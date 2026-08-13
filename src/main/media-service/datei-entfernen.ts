// GENERIERT aus dem Signaturblock von Issue #86.
// [media-service] Datei entfernen mit Retry und Backoff
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
// GERUEST-PRUEFSUMME: 08b718c59e50fba3
//
// ZWEITER SCHRITT DES LOESCHENS (TK 9.4.6). Der erste - der D1-Eintrag - ist zu
// diesem Zeitpunkt bereits unwiderruflich weg. Scheitert diese Funktion endgueltig,
// liegt eine Datei ohne Datenbankeintrag auf der Platte; sie vorzumerken ist Sache
// des Aufrufers (#87), nicht dieser Datei. Genau deshalb muss der Unterschied
// zwischen "war schon weg" (Erfolg) und "liess sich nicht loeschen" (Fehler) hier
// scharf bleiben - beide Verwechslungen sind still und teuer (Issue #86,
// risiko:datenverlust).
//
// KEIN D1-ZUGRIFF, KEIN LOCK, KEINE OS-DATEISPERRE (TK 9.4.8 Punkt 9). Die Datei
// kennt weder `Asset` noch `Project` noch `project.json`, und sie oeffnet die Datei
// insbesondere nicht vorher exklusiv, um "zu pruefen, ob sie frei ist".
//
// KEINE EIGENE PFADPRUEFUNG. `pfad` kommt fertig von der Pfad-Autoritaet (#49) und
// wird unveraendert benutzt - kein `..`-Test, keine Normalisierung, keine Pruefung
// auf den Medienordner. Eine zweite Pruefung mit abweichenden Regeln waere eine
// zweite Wahrheit.

/**
 * Wartezeiten in Millisekunden VOR dem 2., 3., 4. und 5. Versuch; der erste laeuft
 * sofort. Zusammen mit `VERSUCHE_GESAMT` die EINZIGE Stelle mit Zahlen - im Ablauf
 * unten steht kein Zahlenliteral.
 *
 * ⚠ STOPP-PUNKT DES ISSUES, NICHT ABSCHLIESSEND BEANTWORTET. Das Issue erklaert
 * Anzahl und Abstand der Versuche ausdruecklich zur Verhaltens-Entscheidung des
 * Auftraggebers ("Bis zur Antwort keine Zahlen fest einbauen"). Zugleich verlangt
 * seine Definition of Done benannte Konstanten, die der Test liest - ohne Zahlen ist
 * das Issue also nicht baubar. Aufgeloest wurde das NICHT durch Raten, sondern durch
 * Uebernahme der bereits GEBAUTEN Hausvorgabe: dieselben vier Werte stehen wortgleich
 * in `project-store/schreibe-projekt.ts` (#46), `config-store/schreibe-config.ts`
 * (#31) und `auftrags-manager/schreibe-queue-json.ts` - alle drei wiederholen wegen
 * derselben Windows-Eigenheit (offenes fremdes Handle, EPERM/EBUSY) und alle drei
 * verweisen aufeinander, damit nicht drei verschiedene Workarounds entstehen.
 *
 * FOLGE: schlimmstenfalls 1,5 s Wartezeit. Die Warteschlange ist streng seriell
 * (NFA-09), diese Zeit steht also dem ganzen Programm still - deshalb keine
 * grosszuegigere Staffel.
 *
 * Faellt die Antwort des Auftraggebers anders aus, ist DIESE Zeile zu aendern und
 * sonst nichts; der Test liest die Konstanten, statt sie abzuschreiben.
 *
 * BEWUSST NICHT aus einem der drei Module importiert: Das waere eine Modulgrenze fuer
 * eine Zahl, und die Faelle duerfen sich unabhaengig aendern - beim Reconcile (#90)
 * ist genau das sogar zu erwarten (zweiter STOPP-Punkt des Issues).
 */
export const WARTEZEITEN_MS = [100, 200, 400, 800] as const;

/**
 * Obergrenze der `unlink`-Aufrufe: der sofortige erste plus je einer nach jeder
 * Wartezeit. ABGELEITET und nicht getippt - eine zweite Zahl liefe beim Aendern der
 * Staffel lautlos auseinander.
 */
export const VERSUCHE_GESAMT = WARTEZEITEN_MS.length + 1;

/**
 * Die beiden Fehlercodes, bei denen wiederholt wird - genau die, die TK 9.4.6
 * nennt.
 *
 * WARUM NUR DIESE ZWEI: Auf Windows scheitert `unlink` mit `EBUSY`/`EPERM`, solange
 * irgendjemand die Datei offen haelt; hier ist das im Regelfall ein `<video>`-Element
 * der Vorschau, dessen Handle Millisekunden nachhaengt, ein gerade beendetes
 * `ffprobe` oder ein Virenscanner. Das vergeht von selbst. `EACCES` (kein Recht),
 * `EROFS` (Datentraeger nur lesbar), `EISDIR` (kein Ziel fuer `unlink`) und `EIO`
 * vergehen NICHT - dort waere Warten nur eine Verzoegerung mit demselben Ausgang, und
 * sie blockierte die serielle Warteschlange.
 *
 * Auf macOS/Linux gelingt `unlink` auch bei offenem Handle (der Verzeichniseintrag
 * verschwindet sofort, die Bloecke werden mit dem letzten Handle frei). Der Retry-Pfad
 * wird dort im Normalfall nie betreten - das ist der gewuenschte Zustand und kein
 * Hinweis darauf, dass die Wiederholung ueberfluessig waere.
 *
 * ⚠ EIN FALL DER FEHLERTABELLE DES ISSUES IST AUF WINDOWS NICHT TRENNBAR: Sie verlangt
 * fuer "EISDIR bzw. EPERM auf ein Verzeichnis" ein SOFORTIGES Aufgeben, zugleich fuer
 * EPERM das Wiederholen. GEMESSEN auf dieser Maschine (Node, Windows 11):
 * `unlink` auf ein Verzeichnis meldet EPERM, nicht EISDIR - beide Zeilen treffen also
 * denselben Code. Auseinanderhalten liesse sich das nur mit einem `stat` vorweg, und
 * genau das verbietet das Issue ("Keine eigene Pfadpruefung", "Keine Nachkontrolle").
 * Aufgeloest zugunsten des Wiederholens: Der gemeldete `code` ist in beiden Zeilen
 * `datei_fehler`, es unterscheidet sich nur die Dauer bis zur Meldung. Ein Verzeichnis
 * kostet damit einmalig die volle Staffel; ein belegtes Video dagegen wuerde bei der
 * anderen Auflegung ohne Not zur offenen Loeschung - und der Fall ist der haeufige.
 */
const WIEDERHOLBAR = ['EBUSY', 'EPERM'] as const;

import { unlink } from 'node:fs/promises';
import path from 'node:path';

import type { Ergebnis } from '../../shared/contracts/ergebnis';

export async function entferneDatei(pfad: string): Promise<Ergebnis<void, 'datei_fehler'>> {
  // `typeof` trotz `string` in der Signatur: Der Aufrufer ist ein Auftrags-Handler,
  // dessen Eingaben aus JSON stammen koennen (Q2-Wiederholung). Ein leerer oder
  // fehlender Pfad ist ein Programmierfehler im Main, kein Fehler der Platte -
  // deshalb `ungueltige_eingabe` und KEIN Dateisystemzugriff. Der Aufrufer (#87)
  // unterscheidet daran, ob er eine offene Loeschung vormerken muss: bei
  // `datei_fehler` ja, hier nein, denn es gibt keinen brauchbaren Pfad.
  if (typeof pfad !== 'string' || pfad.length === 0) {
    return fehler('ungueltige_eingabe', 'Es wurde kein Pfad zum Entfernen uebergeben.');
  }

  // Der Name fuer die Meldung. Der Renderer sieht "nur relative Referenzen
  // (dateiname), nie absolute Pfade" (TK 9.5.7) - eine Fehlermeldung ist kein Grund,
  // davon abzuweichen. `basename` ist Textzerlegung, keine Pfadpruefung.
  const name = path.basename(pfad);
  let letzterCode = '';

  // Die Schleife laeuft ueber die Wartezeiten statt ueber einen Zaehler - so gibt es
  // keinen Feldzugriff, der wegen `noUncheckedIndexedAccess` `undefined` liefern
  // koennte, und damit auch keine Versuchung zum verbotenen `!` (#193). Hausform aus
  // #46/#31.
  for (const warteMs of [0, ...WARTEZEITEN_MS]) {
    if (warteMs > 0) {
      // Ein echtes `await` auf einen Timer, KEINE Beschaeftigungsschleife: Eine
      // `while`-Schleife auf die Uhr blockierte den Main-Prozess und damit die ganze
      // Oberflaeche.
      await new Promise<void>((weiter) => setTimeout(weiter, warteMs));
    }

    try {
      // `unlink` und NICHT `fs.rm`: `rm({ force: true })` verschluckt `ENOENT` UND
      // andere Fehler stillschweigend - der Unterschied zwischen "war schon weg" und
      // "liess sich nicht loeschen" ginge verloren, und genau der entscheidet, ob
      // eine offene Loeschung vorgemerkt wird. `rm({ recursive: true })` naehme
      // ausserdem ein ganzes Verzeichnis mit.
      await unlink(pfad);
      // KEINE Nachkontrolle (`existsSync`, `stat`, Platzpruefung): Auf macOS waere
      // sie irrefuehrend, auf Windows ueberfluessig. Der gelungene `unlink` IST der
      // Erfolg.
      return { ok: true, wert: undefined };
    } catch (ursache) {
      // Eine bereits fehlende Datei ist ERFOLG, kein Fehler - die Funktion ist damit
      // idempotent. Ihr Zweck ist der Zustand "diese Datei existiert nicht mehr",
      // nicht die Handlung "ich habe geloescht". Der Reconcile (TK 9.4.7) ruft sie
      // fuer vorgemerkte Loeschungen erneut auf; hat der Nutzer die Datei inzwischen
      // selbst im Explorer entfernt, stuende sie sonst FUER IMMER als Fehlschlag in
      // der Wiederholungsliste. Denselben Grundsatz haben `streicheAusQ2` (#55) und
      // `streichePendingDeletion` (#66).
      const code = systemCode(ursache);
      if (code === 'ENOENT') {
        return { ok: true, wert: undefined };
      }

      letzterCode = code;
      if (!(WIEDERHOLBAR as readonly string[]).includes(code)) {
        // Sofort, ohne Wartezeit. Der Code des Betriebssystems steht in der
        // `meldung`, NIE im `code` - dort steht immer `datei_fehler`.
        return fehler(
          'datei_fehler',
          `${name} liess sich nicht entfernen (${beschreibung(ursache)}).`,
        );
      }
    }
  }

  // Alle Versuche mit `EBUSY`/`EPERM` verbraucht. Die Meldung nennt ausdruecklich,
  // dass die Datei belegt war - daran erkennt der Nutzer den Fall, und der Aufrufer
  // (#87) merkt sie ueber `merkePendingDeletion` (#66) als offene Loeschung vor.
  return fehler(
    'datei_fehler',
    `${name} war auch nach ${VERSUCHE_GESAMT} Versuchen noch belegt und liess sich ` +
      `nicht entfernen (${letzterCode}). Die Datei bleibt vorerst liegen und wird ` +
      `beim naechsten Oeffnen des Projekts erneut entfernt.`,
  );
}

/**
 * Liest den `code` eines Node-Systemfehlers, ohne ihn auf einen Typ zu zwingen, den er
 * nicht hat. Leerer String = kein verwertbarer Code (etwa bei einer unerwarteten
 * Ausnahme, die gar kein Systemfehler ist).
 */
function systemCode(ursache: unknown): string {
  if (typeof ursache !== 'object' || ursache === null || !('code' in ursache)) {
    return '';
  }
  const code = (ursache as { code?: unknown }).code;
  return typeof code === 'string' ? code : '';
}

/** Betriebssystem-Code, sonst der Meldungstext - fuer die Klartext-Ergaenzung. */
function beschreibung(ursache: unknown): string {
  const code = systemCode(ursache);
  if (code !== '') {
    return code;
  }
  return ursache instanceof Error ? ursache.message : String(ursache);
}

/**
 * Baut das Fehler-Ergebnis. Niemals `throw`: Der Aufrufer ist ein Auftrags-Handler,
 * dessen Ergebnis ueber die IPC-Grenze reist, und dort ueberlebt eine Ausnahme nur als
 * Text - Fehlerklasse und `code` gingen verloren (TK 9.1.1).
 */
function fehler(
  code: 'datei_fehler' | 'ungueltige_eingabe',
  meldung: string,
): Ergebnis<void, 'datei_fehler'> {
  return { ok: false, fehler: { code, meldung } };
}
