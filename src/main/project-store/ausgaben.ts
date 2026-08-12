// GENERIERT aus dem Signaturblock von Issue #75.
// [project-store] listeAusgaben implementieren
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
// GERUEST-PRUEFSUMME: 8cd6e56cd26d0db1
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

import fs from 'node:fs/promises'
import path from 'node:path'

import { ausgabeOrdner } from './pfade'

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { ProjectStoreFehlercode } from './assets'
import type { Dirent } from 'node:fs'

// DIESE DATEI ZEIGT DEN IST-BESTAND DES ORDNERS, NICHT DIE HISTORIE.
//
// "Q3 ist NICHT die Quelle dieser Liste - Q3 ist Historie und Nachweis (auch der
// Fehlschlaege), die Ausgabe-Liste zeigt den Ist-Bestand des Ordners." (TK 9.5.2)
// Wer die Liste aus dem Protokoll baute, boete Dateien zum Export an, die der Nutzer
// im Explorer laengst geloescht hat - und verschwiege die, die er hineinkopiert hat.
//
// Und sie liest NUR: kein Schreib-Lock, kein D1-Zugriff, kein Anlegen des Ordners.
// "Diese Operation liest nur den Ausgabeordner; sie fasst project.json nicht an und
// laeuft deshalb ohne das D1-Schreib-Lock." (TK 9.5.2)

/** Die Endung, die eine fertige Ausgabedatei kennzeichnet - klein geschrieben zum Vergleich. */
const AUSGABE_ENDUNG = '.mp4'

/** Beide Pfadtrenner, unabhaengig von der laufenden Plattform (s. Pruefung der projektId unten). */
const PFADTRENNER = ['/', '\\']

export interface AusgabeDatei {
  dateiname: string       // MIT Endung, z. B. "sommeraktion.mp4"
  dateigroesse: number    // Bytes
  geaendertAm: string     // ISO-8601 UTC – zugleich der Renderzeitpunkt
}

export async function listeAusgaben(
  projektId: string,
): Promise<Ergebnis<AusgabeDatei[], ProjectStoreFehlercode>> {
  if (!istBrauchbareProjektId(projektId)) {
    // Der beanstandete Wert steht ABSICHTLICH nicht in der Meldung - sie reist bis in
    // die Oberflaeche (gleiche Linie wie in pfade.ts).
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: 'Die Projekt-ID ist leer oder als Pfadsegment nicht verwendbar.',
      },
    }
  }

  // DER EINZIGE ERLAUBTE WEG ZUM ORDNER. Kein eigenes join auf den Datenort, kein
  // nachgebautes Layout: "Er ist die Pfad-Autoritaet (9.5.7) und loest
  // (projektId, ausgabeName) ohnehin auf. Ein zweiter Ort, der das Ordner-Layout kennt,
  // ist damit ausgeschlossen." (TK 9.5.2)
  const ordner = ausgabeOrdner(projektId)

  let eintraege: Dirent[]
  try {
    // withFileTypes spart je Eintrag einen Systemaufruf UND liefert die lstat-Sicht:
    // Ein Symlink meldet isFile() === false, auch wenn er auf eine Datei zeigt. Genau so
    // ist es gewollt - eine Verknuepfung im Ausgabeordner ist nichts, was der Render
    // erzeugt hat.
    eintraege = await fs.readdir(ordner, { withFileTypes: true })
  } catch (ursache) {
    if (istCode(ursache, 'ENOENT')) {
      // "Fehlt der Ordner (noch nie gerendert), ist das Ergebnis eine leere Liste, kein
      // Fehler." (TK 9.5.2) Angelegt wird er hier NICHT - das tut der Render.
      return { ok: true, wert: [] }
    }
    return speicherFehler(ordner, ursache)
  }

  const kandidaten = eintraege.filter(
    (eintrag) => eintrag.isFile() && istFertigeAusgabe(eintrag.name),
  )

  // Parallel, weil jeder stat-Aufruf unabhaengig ist und der Ordner klein bleibt (eine
  // Handvoll Ausgabedateien je Projekt, FA-22). Die Reihenfolge des Ergebnisses spielt
  // keine Rolle, sortiert wird ohnehin am Ende.
  const gelesen = await Promise.all(
    kandidaten.map((eintrag) => beschreibe(ordner, eintrag.name)),
  )

  const dateien: AusgabeDatei[] = []
  for (const eintrag of gelesen) {
    if (eintrag.zustand === 'unlesbar') {
      // Eine Datei, die DA ist und sich trotzdem nicht befragen laesst (EACCES, EIO,
      // EBUSY), ist kein Wettlauf, sondern ein Zugriffsproblem des Datenbestands - und
      // die Fehlertabelle des Issues nennt dafuer genau einen Code. Sie stillschweigend
      // auszulassen hiesse: Die Oberflaeche zeigt neun von zehn Dateien und meldet
      // Erfolg, waehrend der Nutzer die zehnte im Explorer sieht.
      return speicherFehler(ordner, eintrag.grund)
    }
    if (eintrag.zustand === 'gelesen') {
      dateien.push(eintrag.datei)
    }
  }

  return { ok: true, wert: sortiere(dateien) }
}
// - liest NUR den Ordner ausgabeOrdner(projektId) (#49); kein project.json, kein Q3
// - KEIN mitD1Lock: diese Operation fasst project.json nicht an (TK 9.5.2)
// - Sortierung: absteigend nach geaendertAm (neueste zuerst)
// - fehlender Ordner => leere Liste, KEIN Fehler

// ---------------------------------------------------------------------------
// Intern. Bewusst nicht exportiert: Wer eine dieser Regeln braucht, braucht in
// Wahrheit listeAusgaben - sonst entstuende eine zweite Stelle, die entscheidet,
// was als fertige Ausgabedatei gilt.
// ---------------------------------------------------------------------------

type Leseergebnis =
  | { zustand: 'gelesen'; datei: AusgabeDatei }
  | { zustand: 'verschwunden' }
  | { zustand: 'unlesbar'; grund: unknown }

/**
 * Liest Groesse und Zeitstempel EINER Datei.
 *
 * Das `path.join` hier ist KEINE Layout-Kenntnis: Der Ordner kommt aus #49, angehaengt
 * wird ein Name, den `readdir` soeben aus genau diesem Ordner gemeldet hat. Der Pfad
 * verlaesst diese Datei auch nicht - `AusgabeDatei` traegt nur den Dateinamen, "der
 * Renderer bekommt Dateinamen, nie absolute Pfade" (TK 9.5.2).
 */
async function beschreibe(ordner: string, dateiname: string): Promise<Leseergebnis> {
  try {
    const stat = await fs.stat(path.join(ordner, dateiname))
    if (!stat.isFile()) {
      // Zwischen readdir und stat ersetzt (Datei -> Ordner). Behandelt wie verschwunden.
      return { zustand: 'verschwunden' }
    }
    return {
      zustand: 'gelesen',
      datei: {
        dateiname,
        dateigroesse: stat.size,
        // mtime, NICHT birthtime/ctime: Der Render legt die Datei als <name>.mp4.part an
        // und benennt sie erst nach der Verifikation um (TK 9.2.6). birthtime traegt dann
        // je nach Plattform den Beginn des Renders oder gar nichts; die Aenderungszeit
        // ueberlebt das Umbenennen-mit-Ersetzen und IST damit der Renderzeitpunkt.
        geaendertAm: new Date(stat.mtimeMs).toISOString(),
      },
    }
  } catch (ursache) {
    if (istCode(ursache, 'ENOENT', 'ENOTDIR')) {
      // Der Nutzer hat die Datei im Explorer geloescht, waehrend die Liste entstand. Kein
      // Fehler fuer die ganze Liste: Sie ist weg, und genau das soll die Liste zeigen.
      return { zustand: 'verschwunden' }
    }
    return { zustand: 'unlesbar', grund: ursache }
  }
}

/**
 * Absteigend nach `geaendertAm`, bei Gleichstand aufsteigend nach `dateiname`.
 *
 * Verglichen wird die ISO-Zeichenkette und nicht `mtimeMs`: Sortierschluessel und
 * angezeigter Wert sind dann dasselbe. Bei Millisekunden-Genauigkeit ist die
 * Zeichenkettenordnung mit der zeitlichen identisch (feste Stellenzahl, immer UTC).
 *
 * `localeCompare` waere hier falsch - es haengt an der Sprachumgebung des Rechners, und
 * die Reihenfolge einer Liste soll auf jedem Laptop dieselbe sein.
 */
function sortiere(dateien: AusgabeDatei[]): AusgabeDatei[] {
  return dateien.sort((a, b) => {
    if (a.geaendertAm !== b.geaendertAm) {
      return a.geaendertAm < b.geaendertAm ? 1 : -1
    }
    if (a.dateiname === b.dateiname) {
      return 0
    }
    return a.dateiname < b.dateiname ? -1 : 1
  })
}

/**
 * Fertig ist, was auf `.mp4` endet - ohne Ruecksicht auf Gross-/Kleinschreibung.
 *
 * Mehr wird NICHT geprueft: Der Render schreibt `<name>.mp4.part` und benennt erst nach
 * der Verifikation um (TK 9.2.6). Traegt eine Datei den endgueltigen Namen, ist sie
 * vollstaendig. Eine Mindestgroesse oder ein Blick in den Dateikopf waere eine zweite,
 * unzuverlaessige Pruefung derselben Aussage - und `.part`, `.tmp`, `.mp4.part` fallen
 * ohnehin schon durch, weil sie eben nicht auf `.mp4` enden.
 *
 * Der Laengenvergleich schliesst den einen Grenzfall aus, den die Endungsregel nicht
 * abdeckt: eine Datei, die NUR `.mp4` heisst. Sie hat keinen Ausgabenamen, den der
 * Export wieder aufloesen koennte (`loeseAusgabePfad` weist den leeren Namen ab), und
 * waere in der Liste ein Eintrag, den niemand benutzen kann.
 */
function istFertigeAusgabe(dateiname: string): boolean {
  return (
    dateiname.length > AUSGABE_ENDUNG.length &&
    // EXAKT klein geschrieben, kein toLowerCase() (geaendert 12.08.2026).
    // Eine als `datei.MP4` gelistete Datei waere NICHT exportierbar: Der Export loest seine
    // Quelle ueber loeseAusgabePfad (#49) auf, und das haengt immer ein klein geschriebenes
    // `.mp4` an - auf macOS zeigt das ins Leere. Auf Windows faellt es nicht auf, weil das
    // Dateisystem die Schreibweise ignoriert. Eine Datei zu zeigen, die beim Anklicken mit
    // nicht_gefunden scheitert, ist schlechter, als sie wegzulassen; der Render erzeugt
    // ohnehin nur klein geschriebene Namen.
    dateiname.endsWith(AUSGABE_ENDUNG)
  )
}

/**
 * Die Formpruefung der `projektId`.
 *
 * Das Issue verlangt hier nur "nicht leerer String" und weist die Form- und
 * Traversal-Pruefung dem IPC-Kanal (#76) zu. Die zwei Zeilen darueber hinaus sind
 * ABSICHT und gemeldet: `ausgabeOrdner` (#49) prueft seine `projektId` nicht - es kann
 * nicht, seine Signatur hat keinen Fehlerkanal -, und eine ID wie `..\\..\\x` ergaebe
 * dort einen Pfad ausserhalb des Datenorts, dessen Inhalt diese Funktion dann
 * auflistete. Eine UUID (TK 9.11.3) enthaelt weder Pfadtrenner noch `..`; die Pruefung
 * kann also keinen echten Aufruf abweisen, schliesst aber das Lesen fremder Ordner aus.
 */
function istBrauchbareProjektId(wert: unknown): wert is string {
  if (typeof wert !== 'string' || wert.length === 0) {
    return false
  }
  if (PFADTRENNER.some((trenner) => wert.includes(trenner))) {
    return false
  }
  return !wert.includes('..') && wert !== '.'
}

/**
 * Der eine Fehlerausgang dieser Datei.
 *
 * `speicher_fehler` und NICHT `unbekannter_fehler`: Ein Zugriffsfehler auf den
 * Datenbestand ist ein bekannter, benennbarer Fall; `unbekannter_fehler` ist laut
 * TK 9.1.1 fuer unerwartete Ausnahmen reserviert, die das Gateway faengt.
 *
 * Die Meldung nennt den ORDNER, nicht den Stacktrace - so verlangt es die Fehlertabelle
 * des Issues. Der Grund kommt als kurzer Text dazu, weil "nicht lesbar" allein dem
 * Nutzer nicht sagt, ob der Stick abgezogen wurde oder die Rechte fehlen.
 */
function speicherFehler(
  ordner: string,
  ursache: unknown,
): Ergebnis<AusgabeDatei[], ProjectStoreFehlercode> {
  return {
    ok: false,
    fehler: {
      code: 'speicher_fehler',
      meldung: `Der Ausgabeordner ${ordner} ist nicht lesbar. Grund: ${text(ursache)}`,
    },
  }
}

/** Prueft den `code` eines Node-Systemfehlers, ohne ihn auf einen Typ zu zwingen, den er nicht hat. */
function istCode(ursache: unknown, ...codes: readonly string[]): boolean {
  if (typeof ursache !== 'object' || ursache === null || !('code' in ursache)) {
    return false
  }
  const code = (ursache as { code?: unknown }).code
  return typeof code === 'string' && codes.includes(code)
}

function text(ursache: unknown): string {
  return ursache instanceof Error ? ursache.message : String(ursache)
}

// NICHT HIER, UND GEMELDET:
//
// 1. WINDOWS-VERSTECKTE DATEIEN BLEIBEN SICHTBAR. Die Auslegung im Issue nennt
//    "versteckte Dateien" unter dem, was ausgelassen wird. Umgesetzt ist davon nur, was
//    die zwei genannten Kriterien (regulaere Datei + Endung .mp4) hergeben: `.DS_Store`
//    und `Thumbs.db` fallen an der Endung durch. Ein zusaetzliches Verbot fuehrender
//    Punkte waere plattform-schief (auf Windows sagt der fuehrende Punkt gar nichts, das
//    Versteckt-Attribut liest `fs.stat` nicht) und wuerde eine Datei ausblenden, die der
//    Render selbst angelegt haben kann: `loeseAusgabePfad` (#49) laesst den Ausgabenamen
//    `.sommer` zu. Eine Datei, die nicht in der Liste steht, ist fuer den Nutzer
//    unloeschbar und unexportierbar - das waere der teurere Fehler.
//
// 2. GROSSGESCHRIEBENE ENDUNG UND EXPORT PASSEN NICHT ZUSAMMEN. Die DoD verlangt, dass
//    `datei.MP4` in der Liste erscheint. Der Export loest seine Quelldatei aber ueber
//    `loeseAusgabePfad` (TK v2.8, E-7) auf, und das haengt IMMER ein klein geschriebenes
//    `.mp4` an. Wer `datei.MP4` auswaehlt, landet also bei `datei.MP4.mp4` oder - wenn
//    der Aufrufer die Endung vorher abschneidet - bei `datei.mp4`. Beides gibt es nicht.
//    Auf Windows faellt das nicht auf (das Dateisystem unterscheidet nicht), auf macOS
//    schon. Die Naht liegt zwischen #49 und dem export-service (M6), nicht hier.
//
// 3. KEINE UNICODE-NORMALISIERUNG. macOS legt Dateinamen zerlegt ab (NFD), Windows
//    zusammengesetzt (NFC). Der hier gelieferte `dateiname` ist der ROHE Name des
//    Dateisystems; ein Vergleich mit einem in der Oberflaeche getippten Namen kann
//    deshalb scheitern, obwohl beide gleich aussehen. Dieselbe offene Stelle ist in
//    pfade.ts (#49) vermerkt - sie gehoert einmal entschieden, nicht zweimal umgangen.
