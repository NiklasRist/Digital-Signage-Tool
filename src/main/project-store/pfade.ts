// GENERIERT aus dem Signaturblock von Issue #49.
// [project-store] Pfad-Autorität: Auflösung von Projekt- und Medienpfaden
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
// GERUEST-PRUEFSUMME: 849b17b64e3b8420
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

import { ermittleDatenOrt } from "../datenort";

import type { Ergebnis } from '../../shared/contracts/ergebnis'

// DAS DATEI-LAYOUT EINES PROJEKTS STEHT NUR HIER.
//
// "project-store ist die eine Pfad-Autoritaet. Er loest (projektId, dateiname) ->
// absoluter Pfad auf - die einzige Quelle der Wahrheit fuer das Datei-Layout eines
// Projekts (projects/<id>/media/<datei>)." (TK 9.5.7) Deshalb sind die vier Bausteine
// des Layouts hier Konstanten und nicht an fuenf Stellen eingetippte Zeichenketten:
// Eine Layout-Aenderung darf genau eine Datei betreffen.
//
// KEIN fs, KEIN ffprobe, KEIN Existenztest: Alle fuenf Funktionen rechnen. Ob es die
// Datei gibt, entscheidet die Stelle, die sie oeffnet - haette diese Datei eine
// Existenzpruefung, waere ein "Pfad bilden" ploetzlich eine I/O-Operation, und jeder
// Aufrufer muesste sie asynchron machen.

const PROJEKTE_ORDNER = "projects";
const MEDIEN_UNTERORDNER = "media";
const AUSGABE_UNTERORDNER = "output";
const AUSGABE_ENDUNG = ".mp4";

export function projektOrdner(projektId: string): string {
  // path.resolve auf den Datenort, dann path.join fuer die Segmente - die Reihenfolge
  // ist Absicht und nicht Geschmack:
  //
  // resolve() macht den Datenort absolut (der Vertrag sagt "absoluter Pfad"), auch wenn
  // ermittleDatenOrt() ihn eines Tages relativ liefern sollte.
  //
  // join() fuer die Segmente, weil resolve() ein ABSOLUTES Segment schluckt und alles
  // davor wegwirft: path.resolve(datenOrt, "projects", "C:\\Windows") ergaebe
  // "C:\Windows". join() dagegen haengt an. Fuer eine Funktion, die keinen Fehler
  // melden kann, ist das der wesentliche Unterschied - s. Vermerk am Dateiende.
  return path.join(path.resolve(ermittleDatenOrt()), PROJEKTE_ORDNER, projektId);
}
// absoluter Pfad des Projektordners, z. B. `<Datenort>/projects/<projektId>` (TK Abschnitt 6);
// reine String-Operation, kein Dateisystemzugriff, keine Existenzprüfung

export function medienOrdner(projektId: string): string {
  // Abgeleitet, nicht neu gebaut: "medienOrdner = projektOrdner + /media" (DoD). Wer
  // hier ein zweites Mal bei ermittleDatenOrt() anfinge, haette zwei Wege zum selben
  // Ordner - und beim naechsten Layout-Schritt liefe einer davon mit.
  return path.join(projektOrdner(projektId), MEDIEN_UNTERORDNER);
}
// absoluter Pfad des Medienordners dieses Projekts, z. B.
// `<Datenort>/projects/<projektId>/media` (TK Abschnitt 6, TK 9.5.7);
// reine String-Operation, kein Dateisystemzugriff

export function loeseAssetPfad(projektId: string, dateiname: string): Ergebnis<string> {
  if (!istUnbedenklichesSegment(projektId)) {
    return ungueltig("Die Projekt-ID ist als Pfadsegment nicht verwendbar.");
  }
  if (!istUnbedenklichesSegment(dateiname)) {
    return ungueltig(
      "Der Dateiname ist kein reiner Dateiname ohne Verzeichnisanteil.",
    );
  }

  // "Aufloesung immer per path.join(projektMediaDir, dateiname)." (TK 9.4.8, Punkt 1)
  const ordner = medienOrdner(projektId);
  const kandidat = path.join(ordner, dateiname);

  // Zweite Schranke, absichtlich redundant zur ersten: Nach der Zeichenpruefung KANN
  // der Kandidat nicht mehr aus dem Ordner zeigen. Die Nachrechnung kostet nichts und
  // faengt den Fall ab, dass jemand die Zeichenpruefung spaeter aufweicht - dann faellt
  // es hier auf und nicht beim Nutzer.
  if (!liegtInnerhalb(ordner, kandidat)) {
    return ungueltig("Der aufgeloeste Pfad liegt ausserhalb des Medienordners.");
  }
  return { ok: true, wert: kandidat };
}
// absoluter Pfad zur Asset-Datei; liefert NUR einen Pfad, wenn dieser nach Normalisierung
// nachweislich innerhalb von medienOrdner(projektId) liegt, sonst `ungueltige_eingabe`;
// reine String-/Pfad-Operation (kein `fs.*`-Aufruf, keine Existenzprüfung)

export function ausgabeOrdner(projektId: string): string {
  return path.join(projektOrdner(projektId), AUSGABE_UNTERORDNER);
}
// absoluter Pfad des Ausgabeordners dieses Projekts, z. B.
// `<Datenort>/projects/<projektId>/output` (TK Abschnitt 6, TK 9.5.7);
// reine String-Operation, kein Dateisystemzugriff

export function loeseAusgabePfad(projektId: string, ausgabeName: string): Ergebnis<string> {
  if (!istUnbedenklichesSegment(projektId)) {
    return ungueltig("Die Projekt-ID ist als Pfadsegment nicht verwendbar.");
  }
  if (!istGueltigerAusgabeName(ausgabeName)) {
    return ungueltig(
      "Der Ausgabename ist leer, enthaelt Pfadtrenner, `..`, unzulaessige Zeichen " +
        "(< > : \" | ? *, Steuerzeichen) oder ist ein reservierter Windows-Name.",
    );
  }

  // Die Endung setzt die Pfad-Autoritaet, nicht der Nutzer: "absoluter Pfad
  // ausgabeOrdner(projektId)/<ausgabeName>.mp4" (Signatur). Ein Name, der bereits auf
  // ".mp4" endet, wird deshalb zu "<name>.mp4.mp4" - das ist gewollt, s. Vermerk am
  // Dateiende.
  const ordner = ausgabeOrdner(projektId);
  const kandidat = path.join(ordner, `${ausgabeName}${AUSGABE_ENDUNG}`);

  if (!liegtInnerhalb(ordner, kandidat)) {
    return ungueltig("Der aufgeloeste Pfad liegt ausserhalb des Ausgabeordners.");
  }
  return { ok: true, wert: kandidat };
}
// absoluter Pfad `ausgabeOrdner(projektId)/<ausgabeName>.mp4`; liefert NUR einen Pfad, wenn
// `ausgabeName` die Namensvalidierung aus TK 9.2.6 besteht (s. Invarianten) UND das normalisierte
// Ergebnis nachweislich innerhalb von ausgabeOrdner(projektId) liegt, sonst `ungueltige_eingabe`;
// reine String-/Validierungs-Operation (kein `fs.*`-Aufruf, keine Existenzprüfung)

// ---------------------------------------------------------------------------
// Interne Pruefungen. Bewusst NICHT exportiert: Wer eine davon braucht, braucht in
// Wahrheit eine der fuenf Funktionen oben - sonst entstuende neben der Pfad-Autoritaet
// eine zweite Stelle, die "ist dieser Name in Ordnung?" beantwortet.
// ---------------------------------------------------------------------------

/**
 * Windows-Geraetenamen. Sie sind auf JEDEM Pfad wirksam, auch mit Endung: Ein Schreiben
 * nach `CON.mp4` landet auf der Konsole, nicht auf der Platte, und `NUL.mp4` verschluckt
 * die Datei spurlos - ohne Fehler. Deshalb steht hier der Name VOR dem ersten Punkt zur
 * Pruefung an.
 */
const RESERVIERTE_WINDOWS_NAMEN = new Set([
  "CON", "PRN", "AUX", "NUL",
  "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
  "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9",
]);

/** Die Zeichen aus TK 9.2.6, unzulaessig auf Windows/macOS/FAT32. */
const UNZULAESSIGE_ZEICHEN = ["<", ">", ":", '"', "|", "?", "*"];

/**
 * Beide Pfadtrenner - IMMER beide, unabhaengig von der laufenden Plattform.
 *
 * Auf einem Mac ist der Rueckwaerts-Schraegstrich ein voellig gewoehnliches Zeichen;
 * path.join liesse `..\..\secrets` dort als Dateinamen durch. Das waere auf macOS kein
 * Ausbruch, aber es legte eine Datei an, die auf Windows ein Pfad WAERE - und die
 * Projektordner wandern per USB-Stick zwischen beiden Systemen. Der Vertrag sagt dazu:
 * "Nie ein gespeicherter OS-Pfad mit `\`/`/` - sonst ist das Projekt nicht zwischen
 * Windows und macOS portabel." (TK 9.4.8, Punkt 1)
 */
const PFADTRENNER = ["/", "\\"];

function ungueltig(meldung: string): Ergebnis<string> {
  // Der beanstandete Wert steht ABSICHTLICH nicht in der Meldung: Sie reist ueber IPC
  // bis in die Oberflaeche, und ein zurueckgespiegelter Pfad verraet dem Renderer
  // Ordnernamen, die er nicht kennen soll. Der Grund reicht zum Beheben.
  return { ok: false, fehler: { code: "ungueltige_eingabe", meldung } };
}

/**
 * Ein einzelnes Pfadsegment - ein Name, kein Pfad.
 *
 * Gilt fuer `projektId` (UUID, TK 9.11.3) UND fuer `dateiname`
 * ("`<uuid>.<ext_kleingeschrieben>`, ohne Verzeichnisanteil", TK 9.4.8). Beide Werte
 * stammen aus `project.json` und koennen deshalb aus einer beschaedigten oder fremd
 * erzeugten Datei kommen - der Typ `string` sagt darueber nichts.
 */
function istUnbedenklichesSegment(wert: unknown): wert is string {
  if (typeof wert !== "string" || wert.length === 0) {
    return false;
  }
  if (PFADTRENNER.some((trenner) => wert.includes(trenner))) {
    return false;
  }
  // Der Doppelpunkt ist auf Windows ZWEIMAL gefaehrlich: `C:x` ist ein
  // laufwerksrelativer Pfad, und `datei.mp4:versteckt` schreibt in einen alternativen
  // NTFS-Datenstrom - beides sieht wie ein Dateiname aus und ist keiner.
  if (wert.includes(":")) {
    return false;
  }
  // "enthaelt `..`" - wortgleich zur Fehlertabelle des Issues. Bewusst als
  // Teilzeichenkette und nicht nur als vollstaendiges Segment: Ein `dateiname` ist eine
  // UUID mit Endung, dort kommt `..` nie vor, und die strengere Lesart kann nicht
  // irren.
  if (wert.includes("..")) {
    return false;
  }
  if (wert === ".") {
    return false;
  }
  if (enthaeltSteuerzeichen(wert)) {
    return false;
  }
  // Windows schneidet Punkte und Leerzeichen am Ende still ab: `name .` und `name`
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

/**
 * Die Namensvalidierung aus TK 9.2.6 - Punkt fuer Punkt in derselben Reihenfolge wie
 * dort: "Erlaubt ist ein reiner Dateiname ohne Endung - keine Pfadtrenner, kein `..`,
 * keine fuer Windows/macOS/FAT32 unzulaessigen Zeichen, nicht leer, keine reservierten
 * Windows-Namen."
 *
 * Sie laeuft hier, auch wenn die Oberflaeche schon geprueft hat: Der Renderer ist keine
 * Schranke, und `loeseAusgabePfad` wird auch main-intern gerufen (Render, Export).
 */
function istGueltigerAusgabeName(wert: unknown): wert is string {
  if (typeof wert !== "string" || wert.length === 0) {
    return false;
  }
  if (PFADTRENNER.some((trenner) => wert.includes(trenner))) {
    return false;
  }
  if (wert.includes("..")) {
    return false;
  }
  if (UNZULAESSIGE_ZEICHEN.some((zeichen) => wert.includes(zeichen))) {
    return false;
  }
  if (enthaeltSteuerzeichen(wert)) {
    return false;
  }
  if (wert === ".") {
    return false;
  }
  // Anders als beim `dateiname` ist das hier eine NUTZEREINGABE: `Sommer ` und `Sommer`
  // waeren auf Windows dieselbe Datei, und FA-22 haengt genau daran ("gleicher Name
  // ersetzt, neuer Name legt zusaetzlich an"). Zwei Namen, die sich nur im
  // abgeschnittenen Rest unterscheiden, machen diese Regel unvorhersagbar.
  if (endetAufPunktOderLeerzeichen(wert) || wert.startsWith(" ")) {
    return false;
  }
  if (istReservierterWindowsName(wert)) {
    return false;
  }
  return true;
}

function enthaeltSteuerzeichen(wert: string): boolean {
  // Zeichenweise statt per regulaerem Ausdruck: Ein Muster, das den Bereich U+0000 bis
  // U+001F aufspannt, verletzt die Lint-Regel no-control-regex (js/recommended), und
  // ein eslint-disable an dieser Stelle waere die teurere Loesung.
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

function istReservierterWindowsName(wert: string): boolean {
  const vorDemPunkt = wert.split(".")[0] ?? "";
  return RESERVIERTE_WINDOWS_NAMEN.has(vorDemPunkt.trim().toUpperCase());
}

/**
 * "Der Resolver stellt sicher, dass das Ziel innerhalb des `media/`-Ordners des
 * Projekts bleibt (kein `..`-Ausbruch, keine Symlink-Flucht)." (TK 9.5.7)
 *
 * ZUR GROSS-/KLEINSCHREIBUNG - die offene Frage aus dem STOPP-Block: Sie wird hier
 * nicht beantwortet, sondern UMGANGEN. Diese Funktion vergleicht nie zwei unabhaengig
 * entstandene Pfade, sondern immer einen Ordner mit einem Kandidaten, der aus GENAU
 * DIESEM Ordner-String gebaut wurde. Der gemeinsame Anfang ist damit zeichengleich, und
 * ob das Dateisystem Gross- und Kleinschreibung unterscheidet, kann am Ergebnis nichts
 * aendern. Die Frage wird erst dann echt, wenn jemand hier einen von aussen
 * hereingereichten absoluten Pfad gegen den Ordner haelt - genau das tut hier niemand.
 *
 * `path.relative` statt `startsWith`: Ein Praefix-Vergleich haelt `.../media-alt/x`
 * faelschlich fuer einen Treffer von `.../media`, weil er die Ordnergrenze nicht kennt.
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
// 1. SYMLINK-FLUCHT (STOPP-Punkt 1 des Issues). TK 9.5.7 verlangt "keine
//    Symlink-Flucht"; nachweisen kann das nur fs.realpath, also I/O - und der Vertrag
//    dieser Datei sagt fuenfmal "kein fs.*-Aufruf, keine Existenzpruefung". Der
//    Widerspruch ist NICHT hier aufloesbar und wurde deshalb NICHT aufgeloest: Diese
//    Datei bleibt I/O-frei. Damit gilt: Liegt in projects/<id>/media/ eine
//    Verknuepfung (Symlink, auf Windows auch eine Junction) mit gueltigem Namen, dann
//    liefert loeseAssetPfad dafuer bereitwillig einen Pfad, und das Ziel kann irgendwo
//    liegen. Die Pruefung gehoert an die Stelle, die die Datei OEFFNET - der
//    media://-Handler (#50) und der media-service. Solange die sie nicht haben, hat sie
//    niemand.
//
// 2. projektOrdner/medienOrdner/ausgabeOrdner PRUEFEN IHRE projektId NICHT. Sie
//    koennen es nicht: Ihre Signatur gibt einen String zurueck, kein Ergebnis, und der
//    Vertrag sagt "kein Fehlerfall". Eine projektId wie "../../x" ergibt dort also
//    einen Pfad ausserhalb des Datenorts. Abgemildert ist das an zwei Stellen: join()
//    statt resolve() verhindert wenigstens, dass eine absolute projektId den Datenort
//    komplett ersetzt, und die beiden Ergebnis-Funktionen weisen eine solche projektId
//    ab, bevor sie einen Pfad herausgeben. Wer die drei String-Funktionen direkt ruft
//    (q2-wiederholung #45, oeffne-projektordner #77), gibt ihnen eine ID, die aus dem
//    eigenen Bestand stammt - das Issue weist die Pruefung ausdruecklich den Aufrufern
//    zu ("nie gegen die Platte geprueft (das ist Sache der Aufrufer)").
//
// 3. KEINE LAENGENPRUEFUNG. Windows bricht ohne aktiviertes Langpfad-Verhalten bei 260
//    Zeichen; ein sehr langer Ausgabename ergibt hier klaglos einen Pfad, der erst beim
//    Schreiben scheitert. Weder TK 9.2.6 noch das Issue nennen eine Grenze, und eine
//    frei erfundene Zahl waere eine Produktentscheidung an der falschen Stelle.
//
// 4. KEINE UNICODE-NORMALISIERUNG. macOS legt Dateinamen zerlegt ab (NFD), Windows
//    zusammengesetzt (NFC). Zwei Ausgabenamen, die auf dem Bildschirm gleich aussehen,
//    koennen deshalb verschiedene Zeichenketten sein - und damit zwei Dateien statt
//    einer (FA-22: "gleicher Name ersetzt"). Normalisieren waere eine stille Aenderung
//    der Nutzereingabe und gehoert entschieden, nicht nebenbei eingebaut.
//
// 5. KEINE PROZENT-DEKODIERUNG. "%2e%2e%2f" ist hier ein ganz gewoehnlicher Name und
//    bricht aus nichts aus. Der media://-Handler (#50) bekommt aber eine URL: Er MUSS
//    dekodieren, BEVOR er loeseAssetPfad ruft. Dekodiert er danach, umgeht er diese
//    Pruefung vollstaendig. Diese Datei kann das nicht verhindern.
