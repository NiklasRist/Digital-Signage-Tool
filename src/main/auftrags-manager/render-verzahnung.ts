// GENERIERT aus dem Signaturblock von Issue #68.
// [auftrags-manager] Render-Handler verzahnen
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.
//
// Die Pruefsumme haelt fest, was der Generator hier zuletzt hinterlassen hat.
// Stimmt sie beim naechsten Lauf nicht mehr, wurde die Datei bearbeitet - dann
// fasst der Generator sie NIE an, auch wenn sich das Issue geaendert hat. Sie
// mitzupflegen ist NICHT deine Aufgabe: Wer den Rumpf fuellt, laesst sie einfach
// stehen; ihr Nichtmehrstimmen IST das Signal.
// GERUEST-PRUEFSUMME: a597add1c4868bcf
//
// ZUR ABSCHALTZEILE IN ZEILE 1 - SIE IST BEIM FUELLEN DES RUMPFES ZU ENTFERNEN:
// Die Parameter und Importe dieser Datei SIND der Vertrag; der Rumpf wirft aber
// nur, benutzt sie also nicht (@typescript-eslint/no-unused-vars). Die Zeile
// gehoert zum Geruest, nicht zum fertigen Code. Wer den Rumpf fuellt und sie
// stehen laesst, macht die Regel in DIESER Datei dauerhaft blind - unauffaellig,
// weil dann nichts mehr rot ist.
//
// Gesetzt hat sie kein Mensch, sondern tools/geruest.py: Es fragt nach dem
// Schreiben EINMAL ESLint, welche Dateien no-unused-vars tatsaechlich melden, und
// versieht nur diese. Deshalb steht sie nirgends ueberfluessig herum.

import { registriereAuftragsHandler } from './dispatcher';
import { holeAktivesProjekt } from '../project-store/aktives-projekt';
import { sofortFlush } from '../project-store/auto-speichern';
import { mitD1Lock } from '../project-store/d1-lock';

// Fremde Aufrufe - vollstaendige Signaturen, damit hier nichts geraten wird:
//   #60:  registriereAuftragsHandler<A extends AuftragArt>(art, handler: HandlerFuer<A>,
//           brichAb?: (auftrag: Auftrag) => void): void
//         // EIN Handler je Art; ein zweiter Aufruf ERSETZT den Eintrag als Ganzes.
//         // `fuehreAus` faengt jede Ausnahme des Handlers, prueft die FORM der Antwort und
//         // huellt `meldeFortschritt` in einen eigenen Schutz. Nichts davon wird hier nachgebaut.
//   #192: holeAktivesProjekt(): Project | null
//         // der LEBENDE Stand des geoeffneten Projekts (dieselbe Objektreferenz, die die
//         // Instant-Operationen mutieren). SYNCHRON, NIMMT KEIN LOCK, WIRFT NIE.
//   #47:  sofortFlush(projekt: Project): Promise<Ergebnis<void, ProjectStoreFehlercode>>
//         // schreibt `projekt` sofort und bricht den Entprellungstimer ab; MUSS vom Aufrufer
//         // INNERHALB von mitD1Lock ausgefuehrt werden - die Funktion nimmt das Lock nicht selbst.
//   #32:  mitD1Lock<T>(aktion: () => Promise<T>): Promise<T>
//         // serialisiert alle D1-Schreibvorgaenge (FIFO, prozessintern); `aktion` darf nicht
//         // erneut mitD1Lock rufen (Deadlock).

import type { AusfuehrungsKontext, HandlerErgebnis } from './dispatcher';
import type { Auftrag } from '../../shared/contracts/auftrag';
import type { RenderRequest } from '../../shared/contracts/render-request'
import type { RenderResult, RenderProgress } from '../../shared/contracts/render-result'

/**
 * Der GESCHLOSSENE Satz der Render-Fehlercodes - Abschrift der Vertragstabelle TK 9.2.3.
 *
 * WARUM DIE LISTE HIER STEHT UND NICHT IMPORTIERT WIRD: Der `render-service` entsteht erst in
 * M6; ein Import machte M2 von M6 abhaengig und diese Verzahnung unpruefbar. Die Liste wird
 * deshalb NICHT ergaenzt und NICHT gekuerzt - taucht in M6 ein Code auf, der hier fehlt, ist das
 * ein Vertragsfehler und wird gemeldet, nicht nachgetragen.
 *
 * WARUM ZUR LAUFZEIT GEPRUEFT WIRD, obwohl `HandlerFuer` einen `string` durchliesse:
 * `RenderResult.fehlercode` ist laut #19 ein blanker `string`. Diese Datei ist die Stelle, an der
 * er zum Auftrags-Code WIRD - ab #70 gilt "der fachliche Code wird unveraendert uebernommen, nie
 * abgebildet". Was hier durchkommt, steht danach unkorrigiert in Q3, und Q3 ist dauerhaft.
 *
 * `abgebrochen` steht bewusst NICHT darin: "abgebrochen ist kein Fehlercode." (TK 9.2.3) Ein
 * Abbruch reist ueber `status: 'abgebrochen'` und traegt kein `fehler`-Objekt.
 */
const RENDER_FEHLERCODES = [
  'medium_fehlt',        // referenziertes Medium fehlt in media/ oder ist zustand: "fehlt"
  'ungueltiges_element', // einzelnes RenderItem in sich unstimmig (Trim, Dauer, PNG, Band)
  'ungueltige_eingabe',  // die ANFRAGE verletzt den Vertrag (generisch, TK 9.1.1 Punkt 3)
  'ffmpeg_fehler',       // ffmpeg/ffprobe scheitert - einschliesslich fehlgeschlagener Verifikation
  'kein_platz',          // zu wenig freier Speicher (T1 ODER Ausgabeordner)
  'speicher_fehler',     // Schreib-/Rename-Fehler am Ziel jenseits von Platzmangel
  'unbekannter_fehler',  // nicht zuordenbare Ausnahme (generisch, TK 9.1.1 Punkt 3)
] as const;

type RenderFehlercode = (typeof RENDER_FEHLERCODES)[number];

function istRenderFehlercode(wert: string): wert is RenderFehlercode {
  // Die Verbreiterung auf `readonly string[]` ist noetig, weil `includes` auf dem
  // `as const`-Tupel nur seine eigenen sieben Literale als Argument akzeptiert - genau die
  // Werte also, die hier gerade NICHT feststehen. Gecastet wird die LISTE, nie der Code.
  // SAFETY: gecastet wird nur die Listen-Form fuer includes; der eingehende wert bleibt
  // die zu pruefende Zeichenkette, RENDER_FEHLERCODES ist der konstante Pruefbestand.
  return (RENDER_FEHLERCODES as readonly string[]).includes(wert);
}

/**
 * Dieselbe vorlaeufige Loesung wie im `dispatcher` (#60) und im ipc-gateway (#23): Was nicht nach
 * aussen darf, geht ins Protokoll des Hauptprozesses. Ohne diese Zeile bliebe von einem
 * Vertragsbruch des `render-service` nach aussen nur `unbekannter_fehler` uebrig - und gerade
 * diese Faelle waeren die unauffindbarsten.
 */
function protokolliere(stelle: string, ursache: unknown): void {
  console.error(`[auftrags-manager] Render-Verzahnung: ${stelle}:`, ursache);
}

function fehlgeschlagen(
  code: RenderFehlercode,
  meldung: string,
): HandlerErgebnis<RenderFehlercode> {
  return { status: 'fehlgeschlagen', fehler: { code, meldung } };
}

/**
 * Begrenzt den gemeldeten Prozentwert auf den Bereich, den `Auftrag.fortschritt` zusagt
 * ("0-100 oder null", TK 9.3.1).
 *
 * Ein Wert ausserhalb waere ein Vertragsbruch NACH AUSSEN - `queue-panel` und Q3 bekaemen etwas,
 * das der Typ nicht zulaesst. Zum Scheitern fuehrt er trotzdem nie: "Der Fortschrittskanal traegt
 * keinen Endzustand" (TK 9.2.7), ein verrutschter Prozentwert darf keine Minuten Renderarbeit
 * vernichten.
 *
 * NaN IST HIER EINE EIGENE ENTSCHEIDUNG (im Issue nicht geregelt, s. Bericht): Er ist weder
 * kleiner 0 noch groesser 100 und rutschte durch jede Begrenzung hindurch - danach stuende in Q3
 * und im JSON-Kanal ein Wert, den `number` zwar zulaesst, `JSON.stringify` aber zu `null`
 * verwandelt. Gewaehlt ist deshalb der Wert, den der Vertrag selbst fuer "unbestimmt" vorsieht:
 * `null`. Bewusst NICHT stillschweigend verworfen - das machte einen echten Fehler im
 * Fortschrittskanal des `render-service` unsichtbar, und genau davor warnt der STOPP-Block.
 * Unendlich braucht keine Sonderbehandlung: Es faellt in die normale Begrenzung.
 */
function begrenze(prozent: number): number | null {
  if (Number.isNaN(prozent)) return null;
  if (prozent < 0) return 0;
  if (prozent > 100) return 100;
  return prozent;
}

/**
 * Der Sofort-Flush von D1 - der ERSTE Schritt dieses Handlers.
 *
 * "Bei render und export erzwingt der Main den Sofort-Flush von D1 (9.5.4) - nicht beim
 * Einreihen. Er laeuft als erster Schritt IM HANDLER, also nach dem Statuswechsel und bevor der
 * Handler die eigentliche Arbeit aufnimmt." (TK 9.3.3)
 *
 * WARUM NICHT IM TORWAECHTER (#59): Dessen Auswahl- und Statuswechsel-Abschnitt ist bewusst
 * synchron. Ein `await` darin oeffnete genau das Fenster, in dem ein zweiter Auftrag starten
 * koennte - die serielle Invariante braeche lautlos. Nach dem Statuswechsel ist der Platz belegt,
 * ein `await` also gefahrlos.
 *
 * DAS LOCK LIEGT HIER UND NICHT IN `sofortFlush`: Das verlangt deren Vertrag ausdruecklich
 * ("MUSS von der aufrufenden Stelle innerhalb von mitD1Lock ausgefuehrt werden"); sie selbst
 * nimmt es nicht, weil drei ihrer vier Ausloeser es bereits halten. Der Handler haelt kein Lock,
 * ein Deadlock ist hier also ausgeschlossen. Der Abschnitt endet vor `renderReel` - die Minuten
 * des Laufs verbringt niemand im D1-Lock.
 *
 * GEFLUSHT WIRD DAS AKTIVE PROJEKT, nicht ein ueber `payload.projektId` nachgeschlagenes: Es gibt
 * zur Laufzeit genau EINEN geladenen Stand (TK 9.5.1), und nur er kann ungespeicherte Aenderungen
 * halten. Ist keines geoeffnet, gibt es nichts zu schreiben - das ist KEIN Fehler und kein Grund,
 * den Render zu verweigern.
 *
 * Rueckgabe: `null`, wenn der Render starten darf; sonst der fertige Fehlschlag.
 */
async function flusheD1VorDemRender(): Promise<HandlerErgebnis<RenderFehlercode> | null> {
  const projekt = holeAktivesProjekt();
  if (projekt === null) return null;

  try {
    const geschrieben = await mitD1Lock(() => sofortFlush(projekt));
    if (geschrieben.ok) return null;

    // SCHEITERT DER FLUSH, STARTET DER RENDER NICHT. Einen Render auf einen Stand zu fahren, der
    // nicht auf der Platte steht, waere genau der Datenverlust, den der Flush verhindern soll:
    // Die fertige MP4 zeigte dann Inhalte, die das Projekt nach einem Absturz nicht mehr kennt.
    //
    // JEDER Flush-Fehlschlag wird zu `speicher_fehler` - so verlangt es der STOPP-Block. Der
    // urspruengliche Code des project-store (`projekt_beschaeftigt`, `ungueltige_eingabe`, ...)
    // steht nicht in RENDER_FEHLERCODES; er reist in der Meldung mit, damit die Diagnose nicht
    // verloren geht.
    return fehlgeschlagen(
      'speicher_fehler',
      'Der aktuelle Projektstand konnte vor dem Render nicht gespeichert werden ' +
        `(${geschrieben.fehler.code}): ${geschrieben.fehler.meldung}`,
    );
  } catch (ursache) {
    // `sofortFlush` meldet Fehler laut Vertrag in der Huelle und wirft nicht. Der Fang steht
    // trotzdem hier: Ein Wurf duerfte diesen Handler nicht verlassen, ohne dass der Auftrag
    // `laeuft` verlaesst - und der Fehlschlag des Flushs hat einen genaueren Code als den, den
    // der Dispatcher daraus machen wuerde.
    protokolliere('Ausnahme beim Sofort-Flush von D1', ursache);
    return fehlgeschlagen(
      'speicher_fehler',
      'Der aktuelle Projektstand konnte vor dem Render nicht gespeichert werden; ' +
        'der Render wurde deshalb nicht gestartet.',
    );
  }
}

/**
 * Uebersetzt den terminalen Ausgang des `render-service` in den Ausgang der Registry.
 *
 * DAS `HandlerErgebnis` IST DER TRICHTER - mehr als seine Felder kann diese Datei nicht
 * weiterreichen. `renderId` und `abgebrochenBei` bleiben deshalb hier: Fuer sie gibt es kein Feld,
 * und ein neues zu erfinden hiesse, den Typ einer fremden Datei (#60) zu erweitern.
 */
function uebersetze(ergebnis: RenderResult): HandlerErgebnis<RenderFehlercode> {
  switch (ergebnis.status) {
    case 'erfolg':
      // GENAU VIER Nutzdaten - "das sind alle vier, die es gibt" (TK 9.2.3 seit v3.2). Inhaltlich
      // unveraendert; nur das Feld heisst `ergebnis` statt `ausgabe`, weil es bei den anderen
      // Auftragsarten andere Nutzdaten traegt. `ausgabeName` wird ZEICHENGLEICH uebernommen und
      // NICHT aus dem Pfad abgeleitet: Ueber ihn haelt die Oberflaeche ihre Vorbelegung fuer den
      // naechsten Render mit `Project.letzterAusgabeName` im Gleichklang (FA-22).
      // Einen fertig vorbereiteten Historie-Eintrag liefert der render-service seit TK v2.8
      // nicht mehr (das Feld ist ersatzlos gestrichen) - den Q3-Eintrag baut #70 allein.
      return {
        status: 'erfolg',
        ergebnis: {
          pfad: ergebnis.ausgabePfad,
          ausgabeName: ergebnis.ausgabeName,
          dateigroesse: ergebnis.dateigroesse,
          gesamtdauer: ergebnis.gesamtdauer,
        },
      };

    case 'fehler': {
      // `fehler` -> `fehlgeschlagen` ist eine bewusste UEBERSETZUNG, keine Umbenennung, die man
      // sich sparen kann: `RenderResult.status` kennt `fehler` (TK 9.2.3), `Auftrag.status` kennt
      // `fehlgeschlagen` (TK 9.3.1). Wer den Wert durchreicht, erzeugt einen Status, den die
      // Zustandsmaschine (#58) nicht kennt.
      const roh = ergebnis.fehlercode;
      const gelistet = istRenderFehlercode(roh);

      // Kein `as`, kein `@ts-expect-error`: Unbekannt heisst `unbekannter_fehler`, und der
      // Rohwert wandert in die Meldung, damit er diagnostisch nicht verloren geht. Das gilt auch
      // fuer `'abgebrochen'` - der steht bewusst nicht in der Liste, und ein Abbruch, der als
      // Fehlercode ankommt, ist ein Vertragsbruch des Dienstes und wird als solcher gemeldet,
      // nicht in `status: 'abgebrochen'` umgedeutet.
      const fehler: { code: RenderFehlercode; meldung: string; daten?: unknown } = {
        code: gelistet ? roh : 'unbekannter_fehler',
        meldung: gelistet
          ? ergebnis.meldung
          : `${ergebnis.meldung} (unbekannter Fehlercode "${roh}" aus dem render-service)`,
      };

      // `fehlerhaftesElementId` reist als `fehler.daten = { elementId }` - der Schluessel heisst
      // `elementId`, nicht `fehlerhaftesElementId` und nicht `id` (TK 9.2.3). #70 reicht `daten`
      // unveraendert weiter, und der gefuehrte Reparatur-Modus (FA-19) liest genau diesen
      // Schluessel. Ohne diesen Weg erreichte die ID nie den Nutzer.
      //
      // Ist der Wert `null`, bleibt `daten` WEG statt `{ elementId: null }` zu tragen: Die Form
      // von `daten` ist je Fehlercode festgelegt, ein leerer Beutel waere eine dritte Bedeutung.
      if (ergebnis.fehlerhaftesElementId !== null) {
        fehler.daten = { elementId: ergebnis.fehlerhaftesElementId };
      }

      return { status: 'fehlgeschlagen', fehler };
    }

    case 'abgebrochen':
      // KEINE Nutzdaten und KEIN `fehler`-Objekt: "abgebrochen ist kein Fehlercode." (TK 9.2.3)
      // `abgebrochenBei` hat im `HandlerErgebnis` kein Feld und wird nicht weitergereicht.
      return { status: 'abgebrochen' };

    default:
      // Der `render-service` entsteht erst in M6 und ist aus Sicht dieser Datei ein FREMDER
      // Dienst - der Typ sagt drei Ausgaenge zu, die Laufzeit kann einen vierten liefern. Der
      // Dispatcher (#60) prueft die Form MEINER Antwort, nicht die des RenderResult; ohne diesen
      // Zweig fiele die Funktion durch und der Auftrag bliebe fuer immer auf `laeuft`.
      protokolliere('RenderResult ohne gueltigen status', ergebnis);
      return fehlgeschlagen(
        'unbekannter_fehler',
        'Der Render-Lauf hat kein gültiges Ergebnis geliefert. ' +
          'Einzelheiten stehen im Protokoll des Hauptprozesses.',
      );
  }
}

export function registriereRenderHandler(
  renderReel: (
    request: RenderRequest,
    aufFortschritt: (fortschritt: RenderProgress) => void,
  ) => Promise<RenderResult>,
  cancelRender: (renderId: string) => void,
): void {
  const handler = async (
    auftrag: Extract<Auftrag, { art: 'render' }>,
    kontext: AusfuehrungsKontext,
  ): Promise<HandlerErgebnis<RenderFehlercode>> => {
    // SCHRITT 1: der Sofort-Flush. Vor jedem `await` auf `renderReel`, vor jeder Meldung.
    const flushFehlschlag = await flusheD1VorDemRender();
    if (flushFehlschlag !== null) return flushFehlschlag;

    // Der Riegel gegen VERSPAETETE Fortschrittsmeldungen: "Nach dem terminalen RenderResult
    // duerfen keine weiteren RenderProgress-Ereignisse dieser renderId mehr folgen." (TK 9.2.7)
    // Haelt der Dienst sich nicht daran, wird verworfen statt angewendet - sonst ueberschriebe
    // ein Nachzuegler den Fortschritt eines Auftrags, der laengst abgeschlossen ist.
    //
    // DAS IST KEIN ZWEITES LOCK und kein "Render laeuft"-Flag: Der Wert lebt nur innerhalb DIESES
    // Laufs, entscheidet nichts ueber Start oder Reihenfolge und wird von niemandem gelesen
    // ausser dem eigenen Rueckruf.
    let terminal = false;

    const aufFortschritt = (fortschritt: RenderProgress): void => {
      if (terminal) return;
      // NUR `prozent` wandert weiter. `phase`, `elementIndex`, `elementAnzahl` und `elementId`
      // haben im `Auftrag` (#16) kein Feld, und der Typ wird nicht geaendert.
      //
      // Und der Weg fuehrt ueber `kontext.meldeFortschritt`, NICHT ueber ein direktes
      // `auftrag.fortschritt = ...`: Der Kontext ist der eine dafuer vorgesehene Kanal (#60), der
      // Torwaechter (#59) haengt daran seine Q1-Pflege und das `queue:geaendert`-Ereignis (#65).
      // Ein zweiter Schreibweg an denselben Wert liefe daran vorbei. Gedrosselt wird hier nichts
      // - die Frage gehoert zu #65.
      kontext.meldeFortschritt(begrenze(fortschritt.prozent));
    };

    try {
      // AUSSCHLIESSLICH `auftrag.payload` - nichts aus dem Projekt nachgeholt. "Render friert
      // seinen Eingang beim Einreihen ein" (TK 9.3.5); ein Nachladen machte aus "gedrueckt, dann
      // getweakt" ein anderes Video als das bestellte.
      const ergebnis = await renderReel(auftrag.payload, aufFortschritt);

      // `uebersetze` ist rein und synchron: Zwischen dem aufgeloesten `await` und dem `finally`
      // unten gibt es keine Unterbrechungsstelle, an der noch eine Fortschrittsmeldung
      // hereinkaeme. Der Riegel faellt also frueh genug, obwohl er im `finally` steht.
      return uebersetze(ergebnis);
    } catch (ursache) {
      // EINE GESCHEITERTE ZUSAGE IST EIN FEHLSCHLAG, KEIN STILLSTAND. Bliebe der Auftrag auf
      // `laeuft`, stuende die GESAMTE Warteschlange still - die serielle Ordnung ist der einzige
      // Sperr-Mechanismus des Systems (TK 9.3.5), und danach koennte der Nutzer weder importieren
      // noch loeschen noch exportieren.
      //
      // Die rohe Ausnahme-Meldung geht NICHT nach aussen (TK 9.1.1, wie im Dispatcher #60): Sie
      // traegt Pfade und Stacktraces. Ins Protokoll des Hauptprozesses geht sie vollstaendig.
      protokolliere('Ausnahme aus renderReel', ursache);
      return fehlgeschlagen(
        'unbekannter_fehler',
        'Der Render-Lauf ist unerwartet fehlgeschlagen. ' +
          'Einzelheiten stehen im Protokoll des Hauptprozesses.',
      );
    } finally {
      // Im `finally` und nicht hinter dem `await`: Der Riegel muss AUCH dann fallen, wenn die
      // Zusage abgelehnt wurde. Sonst duerfte ein Nachzuegler nach einem Fehlschlag noch
      // schreiben.
      terminal = true;
    }
  };

  // Der Abbrecher bekommt den GANZEN Auftrag - nur so kommt er an die `renderId` aus der
  // Nutzlast; "auftragId und renderId bleiben fest verknuepft" (TK 9.3.6). `entferne` (#62)
  // erreicht ihn ausschliesslich ueber `brich(auftrag)` aus #60 und importiert `cancelRender`
  // nicht selbst - ein zweiter Abbruchweg (Prozess-Kill, eigenes Abbruch-Flag) entsteht hier
  // nicht.
  const brichAb = (auftrag: Auftrag): void => {
    // Nur eine TYP-VERENGUNG, keine zweite Zustaendigkeitspruefung: Die Registry schlaegt den
    // Eintrag allein ueber `auftrag.art` nach (#60), dieser Abbrecher wird also ohnehin nur mit
    // einem Render-Auftrag gerufen. Ohne die Zeile kaeme man an `payload.renderId` gar nicht
    // heran, weil `payload` ueber alle vier Auftragsarten vereinigt ist.
    if (auftrag.art !== 'render') return;
    cancelRender(auftrag.payload.renderId);
  };

  registriereAuftragsHandler('render', handler, brichAb);
}

// NICHT HIER, UND GEMELDET:
//
// 1. KEIN AUFRUFER. Diese Datei traegt den Handler ein, ruft `registriereRenderHandler` aber
//    nicht selbst. Den Aufruf mit den echten `renderReel`/`cancelRender` aus dem render-service
//    (M6) macht der Main-Bootstrap (#3) - hier entsteht dafuer weder ein Import noch ein
//    Vorgriff, sonst haenge M2 an M6.
//
// 2. KEIN IPC-KANAL. Diese Datei registriert ausschliesslich main-intern; `kanaele.ts` wird nicht
//    angefasst. Das Ereignis `render:fortschritt` sendet der ipc-gateway (M6), nicht diese Datei.
//
// 3. KEIN STATUSWECHSEL UND KEIN Q3-EINTRAG. Der Handler liefert nur seinen Ausgang; den
//    terminalen Uebergang (#58), das Entfernen aus Q1 und den Protokolleintrag macht
//    `beendeAuftrag` (#70). Ein zweiter Abschlussweg erzeugte doppelte Eintraege in einem
//    Speicher, der dauerhaft ist.
