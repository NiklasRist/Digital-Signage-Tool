// GENERIERT aus dem Signaturblock von Issue #288.
// [marken-store] Pfad-Autorität für marken-assets/<markeId>/
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
// GERUEST-PRUEFSUMME: 1d58aa2fa766f924
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

import path from "node:path";

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { MarkenFehlercode } from './fehlercodes'
import { ermittleDatenOrt } from '../datenort'

// Fremde Aufrufe – vollstaendige Signaturen, damit hier nichts geraten wird:
//   #5:    ermittleDatenOrt(): string
//          // absoluter Pfad zum app-weiten Datenort (enthaelt u. a. projects/, marken.json,
//          // vorlagen.json); reine Pfad-Berechnung ohne I/O
//   #276: type MarkenFehlercode =
//            'marke_referenziert' | 'marke_eingebaut' | 'marke_nicht_gefunden'
//            | 'marken_datei_fehlt' | 'speicher_fehler'

export function markenAssetsWurzel(): string {
  // Abgeleitet, nicht gebaut: Ausgangspunkt jeder Aufloesung ist ermittleDatenOrt()
  // (#5) - "`marken-assets/` liegt im Datenort (Abschnitt 6)" (TK 9.15.3).
  return path.join(path.resolve(ermittleDatenOrt()), MARKEN_ASSETS_ORDNER);
}
// absoluter Pfad des app-weiten Ordners, der die Marken-Unterordner enthält, z. B.
// `<Datenort>/marken-assets` (TK Abschnitt 6, TK 9.15.3); reine String-Operation, kein
// Dateisystemzugriff, keine Existenzprüfung

export function markenOrdner(markeId: string): string {
  // Abgeleitet, nicht neu gebaut: "die importierten Dateien ... in einem Ordner je
  // Marke (`marken-assets/<marken-id>/`)" (TK Abschnitt 6) - also genau eine Stelle,
  // die das Layout kennt (TK 9.15.3).
  return path.join(markenAssetsWurzel(), markeId);
}
// absoluter Pfad des Asset-Ordners EINER Marke, z. B. `<Datenort>/marken-assets/<markeId>`
// (TK 9.15.3: "marken-assets/<markeId>/"); reine String-Operation, kein Dateisystemzugriff

export function loeseMarkenDateiPfad(markeId: string, dateiname: string): Ergebnis<string, MarkenFehlercode> {
  if (!istUnbedenklichesSegment(markeId)) {
    return ungueltig("Die Marken-ID ist als Pfadsegment nicht verwendbar.");
  }
  if (!istUnbedenklichesSegment(dateiname)) {
    return ungueltig(
      "Der Dateiname ist kein reiner Dateiname ohne Verzeichnisanteil.",
    );
  }

  // Die eine Aufloesung fuer die `importiert`-Herkunft (TK 9.15.3):
  // <Datenort>/marken-assets/<markeId>/<dateiname>
  const ordner = markenOrdner(markeId);
  const kandidat = path.join(ordner, dateiname);

  // Zweite Schranke, absichtlich redundant zur ersten: Nach der Zeichenpruefung KANN
  // der Kandidat nicht mehr aus dem Ordner zeigen. Die Nachrechnung kostet nichts und
  // faengt den Fall ab, dass jemand die Zeichenpruefung spaeter aufweicht - dann faellt
  // es hier auf und nicht beim Aufrufer.
  if (!liegtInnerhalb(ordner, kandidat)) {
    return ungueltig("Der aufgeloeste Pfad liegt ausserhalb des Marken-Ordners.");
  }
  return { ok: true, wert: kandidat };
}
// absoluter Pfad zur importierten Datei; liefert NUR einen Pfad, wenn dieser nach Normalisierung
// nachweislich innerhalb von markenOrdner(markeId) liegt, sonst `ungueltige_eingabe`;
// reine String-/Pfad-Operation (kein `fs.*`-Aufruf, keine Existenzprüfung)

// ---------------------------------------------------------------------------
// Intern. Bewusst NICHT aus `project-store/pfade` importiert (#288): Der marken-store
// ist die Pfad-Autoritaet fuer `marken-assets/`, und ein Import aus dem project-store
// (DoD: "kein Import aus src/main/project-store/**") waere genau die zweite Autoritaet,
// die TK 9.5.7 ausschliesst. Die Pruefungen unten sind deshalb hier noch einmal
// abgelegt - dieselben Regeln wie in #49, uebertragen auf diesen Ordner.
// ---------------------------------------------------------------------------

const MARKEN_ASSETS_ORDNER = "marken-assets";

/** Beide Pfadtrenner - IMMER beide, unabhaengig von der laufenden Plattform. */
const PFADTRENNER = ["/", "\\"];

function ungueltig(meldung: string): Ergebnis<string, MarkenFehlercode> {
  // Der beanstandete Wert steht ABSICHTLICH nicht in der Meldung: Sie reist ueber IPC
  // bis in die Oberflaeche, und ein zurueckgespiegelter Pfad verraet dem Renderer
  // Ordnernamen, die er nicht kennen soll. Der Grund reicht zum Beheben.
  return { ok: false, fehler: { code: "ungueltige_eingabe", meldung } };
}

/**
 * Ein einzelnes Pfadsegment - ein Name, kein Pfad.
 *
 * Gilt fuer `markeId` (UUID, TK 9.11.4) UND fuer `dateiname`
 * (`MarkenEintrag.logo.datei`/`Schrift.datei`). Beide Werte stammen aus einer
 * `marken.json`, die beschädigt oder von außen manipuliert sein kann - der Typ
 * `string` sagt darueber nichts.
 */
function istUnbedenklichesSegment(wert: unknown): wert is string {
  if (typeof wert !== "string" || wert.length === 0) {
    return false;
  }
  if (PFADTRENNER.some((trenner) => wert.includes(trenner))) {
    return false;
  }
  // Der Doppelpunkt ist eine laufwerksrelative Notation auf Windows; ein `dateiname`,
  // der so aussieht, ist keiner.
  if (wert.includes(":")) {
    return false;
  }
  // "enthaelt `..`" - Fehlerpfad des Issues, als Teilzeichenkette und nicht nur als
  // vollstaendiges Segment: Ein marken-Dateiname ist ein reiner Dateiname, dort kommt
  // `..` nie vor, die strengere Lesart kann nicht irren.
  if (wert.includes("..")) {
    return false;
  }
  if (wert === ".") {
    return false;
  }
  if (enthaeltSteuerzeichen(wert)) {
    return false;
  }
  // Windows schneidet Punkte und Leerzeichen am Ende still ab: `logo.` und `logo`
  // zeigen auf DIESELBE Datei. Ein Wert, dessen Ziel sich beim Anfassen aendert, ist
  // fuer eine Pfad-Autoritaet unbrauchbar.
  if (endetAufPunktOderLeerzeichen(wert) || wert.startsWith(" ")) {
    return false;
  }
  if (istReservierterWindowsName(wert)) {
    return false;
  }
  return true;
}

function enthaeltSteuerzeichen(wert: string): boolean {
  for (const zeichen of wert) {
    const code = zeichen.codePointAt(0) ?? 0;
    if (code < 0x20 || code === 0x7f) {
      return true;
    }
  }
  return false;
}

function endetAufPunktOderLeerzeichen(wert: string): boolean {
  return wert.endsWith(".") || wert.endsWith(" ");
}

/** Windows-Geraetenamen, wirksam auf JEDEM Pfad, auch mit Endung. */
const RESERVIERTE_WINDOWS_NAMEN = new Set([
  "CON", "PRN", "AUX", "NUL",
  "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
  "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
]);

function istReservierterWindowsName(wert: string): boolean {
  const vorDemPunkt = wert.split(".")[0] ?? "";
  return RESERVIERTE_WINDOWS_NAMEN.has(vorDemPunkt.trim().toUpperCase());
}

/**
 * "Der Resolver stellt sicher, dass das Ziel innerhalb des `media/`-Ordners des
 * Projekts bleibt (kein `..`-Ausbruch, keine Symlink-Flucht)." (TK 9.5.7, hier auf
 * `marken-assets/<markeId>/` uebertragen - dieselbe Regel, derselbe Wortlaut).
 *
 * ZUR GROSS-/KLEINSCHREIBUNG - die offene Frage aus dem STOPP-Block: Sie wird hier
 * wie in #49 UMGANGEN. Diese Funktion vergleicht nie zwei unabhaengig entstandene
 * Pfade, sondern einen Ordner mit einem Kandidaten, der aus GENAU DIESEM
 * Ordner-String gebaut wurde. Der gemeinsame Anfang ist damit zeichengleich, und ob
 * das Dateisystem Gross- und Kleinschreibung unterscheidet, kann am Ergebnis nichts
 * aendern. Die Frage wird erst dann echt, wenn jemand hier einen von aussen
 * hereingereichten absoluten Pfad gegen den Ordner haelt - genau das tut hier niemand.
 *
 * `path.relative` statt `startsWith`: Ein Praefix-Vergleich haelt `marken-assets/a/…`
 * (Ordner von markeId "a") faelschlich fuer einen Treffer auf den Ordner von markeId
 * "ab", weil er die Ordnergrenze nicht kennt (Regressionstest im DoD).
 */
function liegtInnerhalb(ordner: string, kandidat: string): boolean {
  const rel = path.relative(path.resolve(ordner), path.resolve(kandidat));
  // rel === "" hiesse: der Kandidat IST der Ordner. Ein Ordner ist keine Datei.
  return (
    rel.length > 0 &&
    rel !== ".." &&
    !rel.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(rel)
  );
}

// NICHT HIER, UND VOM ISSUE AUSDRUECKLICH OFFEN GELASSEN - gemeldet:
//
// 1. SYMLINK-FLUCHT (STOPP-Punkt des Issues). TK 9.5.7 verlangt "keine
//    Symlink-Flucht"; nachweisen kann das nur fs.realpath, also I/O - und der Vertrag
//    dieser Datei sagt "kein `fs.*`-Aufruf, keine Existenzpruefung". Dieselbe offene
//    Frage wie in #49, dort unentschieden. Diese Datei bleibt I/O-frei; die Pruefung
//    gehoert an die Stelle, die die Datei tatsaechlich oeffnet (#290, der
//    `marken://`-Handler), sobald das fuer #49 entschieden ist.
//
// 2. markenAssetsWurzel()/markenOrdner() PRUEFEN IHRE markeId NICHT. Sie koennen es
//    nicht: Ihre Signatur gibt einen String zurueck, kein Ergebnis, und der Vertrag
//    sagt "kein Fehlerfall". Eine markeId wie "../../x" ergaebe dort also einen Pfad
//    ausserhalb des Datenorts - abgemildert dadurch, dass join() statt resolve() keine
//    absolute markeId durchlaesst und dass loeseMarkenDateiPfad eine solche markeId
//    abweist, bevor sie einen Pfad herausgibt. Wer die beiden String-Funktionen direkt
//    ruft, gibt ihr eine ID aus dem eigenen Bestand.
//
// 3. KEINE PROZENT-DEKODIERUNG. "%2e%2e%2f" ist hier ein ganz gewoehnlicher Name und
//    bricht aus nichts aus. Der marken://-Handler (#290) bekommt aber eine URL: Er MUSS
//    dekodieren, BEVOR er loeseMarkenDateiPfad ruft. Dekodiert er danach, umgeht er
//    diese Pruefung vollstaendig. Diese Datei kann das nicht verhindern.
