// GENERIERT aus dem Signaturblock von Issue #60.
// [auftrags-manager] Fachdienst-Handler registrieren und ausführen
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
// GERUEST-PRUEFSUMME: 1bafc042965680f0
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

import type { Auftrag, AuftragArt } from '../../shared/contracts/auftrag';
import type { GenerischerFehlercode } from '../../shared/contracts/ergebnis';

export interface AusfuehrungsKontext {
  auftragId: string;
  meldeFortschritt: (prozent: number | null) => void;
}

// F = die fachliche Fehlercode-Union des ausfuehrenden Dienstes (z. B. ImportFehlercode).
// Die drei generischen Codes sind ueber `F | GenerischerFehlercode` immer enthalten.
export type HandlerErgebnis<F extends string = string> =
  | {
      status: 'erfolg';
      // fachliche Nutzdaten des Dienstes, oder null wenn er nichts zu melden hat.
      // Bedeutung je Auftragsart laut TK 9.3.1: import -> der fertige Asset,
      // loeschen -> { assetId }, render -> Pfad/Groesse/Dauer, export -> { zielPfad, dateigroesse }.
      ergebnis: unknown | null;
    }
  | {
      status: 'fehlgeschlagen';
      fehler: { code: F | GenerischerFehlercode; meldung: string; daten?: unknown };
    }
  | { status: 'abgebrochen' };

export type HandlerFuer<A extends AuftragArt> = (
  auftrag: Extract<Auftrag, { art: A }>,
  kontext: AusfuehrungsKontext,
) => Promise<HandlerErgebnis<string>>;

/**
 * Ein Eintrag der Registry - EIN Handler je Art, dazu ein optionaler Abbrecher.
 *
 * Der abgelegte Handler nimmt den GANZEN `Auftrag`, waehrend `HandlerFuer<A>` nur die
 * zu `A` gehoerende Variante nimmt. Diese Aufweitung ist der Preis dafuer, dass die
 * Registry ihre vier Arten in EINER Ablage fuehrt: TypeScript kann die Verbindung
 * "Schluessel `art` gehoert zu Wert `handler`" nicht ausdruecken (korrelierte Union).
 * Getragen wird die Sicherheit stattdessen vom Schluessel selbst - ein unter `art`
 * abgelegter Handler wird ausschliesslich mit einem Auftrag ebendieser `art` gerufen,
 * weil `fuehreAus` den Eintrag ALLEIN ueber `auftrag.art` nachschlaegt. Es gibt in
 * dieser Datei keinen zweiten Weg an einen Handler heran.
 */
interface Registrierung {
  handler: (auftrag: Auftrag, kontext: AusfuehrungsKontext) => Promise<HandlerErgebnis<string>>;
  brichAb?: (auftrag: Auftrag) => void;
}

/**
 * Die Registry - im RAM des Main-Prozesses, ohne eigenen Speicher (P6).
 *
 * Eine `Map` und kein Objekt-Literal: Der Schluessel ist die geschlossene Union
 * `AuftragArt`, und `Map.get` liefert von sich aus `undefined` fuer eine nicht belegte
 * Art. Das ist genau der Fall, den die Fehlerpfad-Tabelle behandelt.
 */
const registrierungen = new Map<AuftragArt, Registrierung>();

/**
 * "intern protokolliert" - dieselbe vorlaeufige Loesung wie im ipc-gateway (#23).
 *
 * Das ganze Fehlerobjekt geht ins Protokoll des Hauptprozesses, Stacktrace
 * eingeschlossen; verboten ist der Stacktrace nur im RUECKGABEWERT, also auf dem Weg
 * zur Oberflaeche (TK 9.1.1 Punkt 8). Ohne diese Zeile verschwaende eine geworfene
 * Ausnahme spurlos: Nach aussen bleibt von ihr nur `unbekannter_fehler` uebrig, und
 * genau die Faelle, in denen ein Fachdienst seinen Vertrag bricht, waeren die
 * unauffindbarsten.
 */
function protokolliere(stelle: string, auftrag: Auftrag, ursache: unknown): void {
  console.error(
    `[auftrags-manager] ${stelle} (Auftrag ${auftrag.auftragId}, Art "${auftrag.art}"):`,
    ursache,
  );
}

/**
 * Die eine Fehler-Huelle fuer alles Unerwartete.
 *
 * KEIN Stacktrace und KEINE rohe Ausnahme-Meldung: "Eine rohe Exception-Meldung wird
 * nie zum Code." (TK 9.1.1) Der Text nennt die Auftragsart, und die stammt aus unserem
 * eigenen Bestand (`AuftragArt`), nie aus einer Nutzereingabe.
 */
function unbekannterFehler(meldung: string): HandlerErgebnis<string> {
  return { status: 'fehlgeschlagen', fehler: { code: 'unbekannter_fehler', meldung } };
}

/**
 * Prueft die FORM der Handler-Antwort - nicht ihren Inhalt.
 *
 * WARUM DAS NOETIG IST, obwohl der Typ es schon zusagt: Dieselbe Ueberlegung wie im
 * ipc-gateway (#23, entschieden 12.08.2026). Ein vergessenes `return` in einem
 * Fachdienst genuegt, und `fuehreAus` gaebe `undefined` weiter. Der naechste Leser ist
 * `beendeAuftrag` (#70), das ueber `ergebnis.status` verzweigt - es wuerde werfen, und
 * zwar INNERHALB des Torwaechters. Die Folge steht in der Einleitung des Issues: Der
 * Auftrag bliebe auf `laeuft` stehen, es gaebe keinen Q3-Eintrag, und weil kein
 * weiterer Auftrag starten darf, solange einer laeuft, stuende die Warteschlange fuer
 * den Rest der Sitzung still. Das ist dieselbe Lage wie bei einer geworfenen Ausnahme
 * - ein Dienst hat sich nicht an seinen Vertrag gehalten -, also derselbe Code und
 * KEIN neuer.
 *
 * Geprueft wird NUR die Huelle: der Diskriminator und, im Fehlerfall, dass ueberhaupt
 * ein Fehlerobjekt mit Code und Meldung da ist. Der Code selbst wird dabei weder
 * gedeutet noch gegen eine Liste gehalten - JEDER `string` kommt durch. Eine
 * Prueflliste erlaubter Codes waere genau das, was die Invarianten verbieten.
 *
 * `status: 'erfolg'` wird NICHT auf ein vorhandenes `ergebnis` geprueft: Das Feld ist
 * `unknown`, `undefined` ist dort ein zulaessiger Wert, und "der Dienst hat nichts zu
 * melden" ist ein regulaerer Ausgang. Wer hier `undefined` zu `null` verbesserte,
 * deutete die Nutzdaten - diese Datei reicht durch.
 */
function istHandlerErgebnis(wert: unknown): wert is HandlerErgebnis<string> {
  if (typeof wert !== 'object' || wert === null) return false;

  // SAFETY: die Zeile davor hat wert als nicht-null Objekt belegt; der Cast macht das
  // Feld sichtbar, und die Vergleiche darunter pruefen es zur Laufzeit.
  const status = (wert as { status?: unknown }).status;
  if (status === 'erfolg' || status === 'abgebrochen') return true;
  if (status !== 'fehlgeschlagen') return false;

  // SAFETY: dieselbe Belegung wie oben (wert ist nicht-null Objekt); die Pruefung der
  // fehler-Form folgt unmittelbar darunter.
  const fehler = (wert as { fehler?: unknown }).fehler;
  // SAFETY: fehler ist als Objekt belegt (typeof + null-Check); die Feldtypen werden
  // hier zur Laufzeit als Zeichenketten geprueft - code und meldung einzeln.
  return (
    typeof fehler === 'object' &&
    fehler !== null &&
    typeof (fehler as { code?: unknown }).code === 'string' &&
    typeof (fehler as { meldung?: unknown }).meldung === 'string'
  );
}

/**
 * Reicht den Kontext weiter, faengt aber eine Ausnahme aus `meldeFortschritt` ab.
 *
 * Der Handler bekommt deshalb nicht das Objekt des Torwaechters, sondern ein gleich
 * belegtes: `auftragId` unveraendert, `meldeFortschritt` in einen Schutz gehuellt. Ein
 * fehlerhafter Aufrufer darf die laufende Ausfuehrung nicht beenden - ein Render, der
 * zwanzig Minuten gelaufen ist, wuerde sonst an einer Fortschrittsmeldung sterben.
 *
 * HIER WIRD NICHTS GEPUFFERT UND NICHTS ZUSAMMENGEFASST (TK 9.2.7): kein Drosseln,
 * kein Begrenzen des Wertes, kein Merken des letzten Standes. Die Drosselung ist Sache
 * des meldenden Fachdienstes; diese Stelle ist nur die Durchreiche.
 */
function geschuetzterKontext(auftrag: Auftrag, kontext: AusfuehrungsKontext): AusfuehrungsKontext {
  return {
    auftragId: kontext.auftragId,
    meldeFortschritt: (prozent: number | null): void => {
      try {
        kontext.meldeFortschritt(prozent);
      } catch (fehler) {
        protokolliere('Ausnahme in meldeFortschritt()', auftrag, fehler);
      }
    },
  };
}

export function registriereAuftragsHandler<A extends AuftragArt>(
  art: A,
  handler: HandlerFuer<A>,
  brichAb?: (auftrag: Auftrag) => void,
): void {
  // ERSETZEN, nicht ablehnen und nicht still ignorieren - und zwar den Eintrag als
  // GANZES: Wird beim zweiten Aufruf kein `brichAb` uebergeben, ist die Art danach
  // nicht mehr abbrechbar. Ein `set` auf dieselbe Art tut genau das; ein Zusammenfuehren
  // mit dem alten Eintrag ("brichAb behalten, wenn keiner mitkommt") waere das
  // versteckte Verhalten, das die Invariante ausschliesst.
  //
  // Die Aufweitung des Handler-Typs steht bei `Registrierung` begruendet. Sie geht ueber
  // `unknown`, weil TypeScript `HandlerFuer<A>` bei generischem `A` nicht als verwandt
  // mit der aufgeweiteten Form ansieht. KEIN Fehlercode wird dabei angefasst - hier
  // wird eine Funktionsform gecastet, nie ein `code`.
  // SAFETY: der Cast passt nur die Funktionsform an (HandlerFuer<A> zu Registrierung);
  // die Registrierung ist vorher vollstaendig gebaut, kein code wird veraendert.
  registrierungen.set(art, {
    handler: handler as Registrierung['handler'],
    brichAb,
  });
}

/**
 * Der eigentliche Ablauf. `fuehreAus` selbst bleibt Zeichen fuer Zeichen die Signatur
 * aus dem Issue (ohne `async`) und reicht nur hierher durch.
 */
async function fuehreAusGeschuetzt(
  auftrag: Auftrag,
  kontext: AusfuehrungsKontext,
): Promise<HandlerErgebnis<string>> {
  // Auswahl ALLEIN ueber `auftrag.art`. Keine zweite Bedingung, kein Blick in die
  // Nutzlast, kein Vorrang irgendeiner Art.
  const eintrag = registrierungen.get(auftrag.art);

  if (eintrag === undefined) {
    // Ein Programmierfehler im Main - trotzdem KEIN `throw`. Ein Wurf verliesse den
    // Ablauf des Torwaechters, `beendeAuftrag` (#70) liefe nie, und die Warteschlange
    // stuende still.
    const meldung = `Für die Auftragsart "${auftrag.art}" ist kein Dienst registriert.`;
    protokolliere('Kein Handler registriert', auftrag, meldung);
    return unbekannterFehler(meldung);
  }

  try {
    // `await` ist tragend und kein Schoenheitsfehler: Ohne es liefe ein
    // `return eintrag.handler(...)` am try/catch VORBEI - eine abgelehnte Promise wuerde
    // durchgereicht statt gefangen. Da jeder Fachdienst async ist, waere der Fang genau
    // fuer den haeufigsten Fall wirkungslos. Faellt in keinem Typecheck auf.
    //
    // Der Auftrag geht UNVERAENDERT hinein: nichts ergaenzt, nichts aus dem Projekt
    // nachgeladen. "Render friert seinen Eingang beim Einreihen ein" (TK 9.3.5).
    const antwort: unknown = await eintrag.handler(auftrag, geschuetzterKontext(auftrag, kontext));

    if (!istHandlerErgebnis(antwort)) {
      protokolliere('Antwort ohne gueltige Form', auftrag, antwort);
      return unbekannterFehler(
        `Der Auftrag "${auftrag.art}" hat kein gültiges Ergebnis geliefert. ` +
          'Einzelheiten stehen im Protokoll des Hauptprozesses.',
      );
    }

    // UNVERAENDERT weiter, dasselbe Objekt: kein Umschreiben des Codes, kein
    // Vereinheitlichen, kein Abschneiden von `daten`. An `daten` haengt der gefuehrte
    // Reparatur-Modus (FA-19) - ohne sie kann `asset_referenziert` die betroffenen
    // Listenelemente nicht nennen. Und die Nutzdaten aus `ergebnis` gehoeren den
    // Fachdiensten; diese Datei deutet sie nicht.
    return antwort;
  } catch (fehler) {
    protokolliere('Ausnahme aus dem Handler', auftrag, fehler);
    return unbekannterFehler(
      `Der Auftrag "${auftrag.art}" ist unerwartet fehlgeschlagen. ` +
        'Einzelheiten stehen im Protokoll des Hauptprozesses.',
    );
  }
}

export function fuehreAus(
  auftrag: Auftrag,
  kontext: AusfuehrungsKontext,
): Promise<HandlerErgebnis<string>> {
  return fuehreAusGeschuetzt(auftrag, kontext);
}

export function kannAbbrechen(art: AuftragArt): boolean {
  return registrierungen.get(art)?.brichAb !== undefined;
}

/** true, wenn ein Abbrecher registriert war und gerufen wurde. */
export function brich(auftrag: Auftrag): boolean {
  const abbrecher = registrierungen.get(auftrag.art)?.brichAb;

  // Keine Wirkung, kein `throw`: Den Fehlercode `ungueltige_eingabe` fuer einen
  // Abbruch-Wunsch an eine nicht abbrechbare Art erzeugt der Aufrufer `entferne` (#62).
  if (abbrecher === undefined) return false;

  try {
    // Der GANZE Auftrag geht hinein - nur so kommt der Abbrecher des Render-Handlers
    // (#68) an die `renderId` aus `auftrag.payload`, die der auftrags-manager nicht kennt.
    abbrecher(auftrag);
  } catch (fehler) {
    protokolliere('Ausnahme aus dem Abbrecher', auftrag, fehler);
  }

  // Auch nach einer Ausnahme `true`: Der Abbrecher WAR registriert und WURDE gerufen -
  // genau das sagt der Rueckgabewert aus, und nur danach richtet sich `entferne` (#62).
  //
  // Hier wird WEDER der Status gesetzt, NOCH der Auftrag aus Q1 genommen, NOCH ein
  // Q3-Eintrag geschrieben. Der Abschluss kommt regulaer ueber das
  // `HandlerErgebnis { status: 'abgebrochen' }` und `beendeAuftrag` (#70); ein zweiter
  // Abschlussweg erzeugte doppelte Protokolleintraege.
  return true;
}
