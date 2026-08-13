// GENERIERT aus dem Signaturblock von Issue #80.
// [media-service] Format gegen die Whitelist prüfen
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
// GERUEST-PRUEFSUMME: 862e45b32a892102
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

import { FORMAT_WHITELIST } from '../../shared/contracts/asset'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { ImportFehlercode } from './fehlercodes'

// DER TUERSTEHER DES MEDIENBESTANDS - und die EINZIGE Stelle, an der die Whitelist
// ANGEWENDET wird.
//
// "Der Formatfilter des Dialogs (9.4.3) und die Pruefung beim Import lesen DENSELBEN
// konstanten Wert aus contracts/types - sie duerfen nie auseinanderlaufen." (TK 9.4.2)
// "Format-Whitelist kommt aus EINEM konstanten Wert in contracts/types (Dialog-Filter
// UND Import-Pruefung)." (TK 9.4.8, Punkt 7)
//
// DESHALB STEHT IN DIESER DATEI KEIN EINZIGES ENDUNGS-LITERAL. Keine Aufzaehlung, keine
// Ersatzliste "fuer den Fall der Faelle", auch nicht im Kommentar oder in einem
// Meldungstext: Jede Endung, die hier vorkommt, kommt aus FORMAT_WHITELIST (#13). Eine
// zweite Aufzaehlung liefe mit der ersten Formataenderung auseinander, und der Dialog
// boete dann Dateien an, die der Import abweist (oder umgekehrt).
//
// WARUM DIE LISTE SO KURZ IST UND NIEMAND SIE HIER "ergaenzt": Zugelassen ist genau das
// eine Videoformat, das Chromium in der Vorschau (<video>) zuverlaessig nativ abspielt.
// MKV/MOV/AVI sind AUSGESCHLOSSEN - "sie wuerden im Render (ffmpeg) zwar lesbar, aber
// die Vorschau (P5) bliebe je nach OS lautlos schwarz; das widerspricht der Pixel-/
// Darstellungsgleichheit und ist durch keine lokale 30-Zeilen-Entscheidung heilbar."
// (TK 9.4.2) Dass ffmpeg ein Format lesen KOENNTE, ist also kein Argument, es
// zuzulassen - es entscheidet die Vorschau, nicht der Render. Eine Erweiterung ist eine
// Produktentscheidung und geschieht in src/shared/contracts/asset.ts (#13).
//
// GEPRUEFT WIRD DIE ENDUNG, NICHT DER INHALT. TK 9.4.9 nennt "Endung/MIME"; eine
// Inhaltspruefung (Magic Bytes) setzte einen Dateizugriff voraus, den diese reine
// Funktion per Vertrag nicht hat. Eine als Video umbenannte Fremddatei faellt spaeter
// beim ffprobe-Lesen (#83) bzw. spaetestens im Render auf. Das ist bewusst und KEINE
// Luecke, die hier zu schliessen waere.
//
// REIN UND SYNCHRON: kein fs, kein await, kein Cache, kein veraenderlicher Zustand.
// Zweimal derselbe Eingang -> zweimal dasselbe Ergebnis. Und NIEMALS throw: Die Funktion
// laeuft in einer Auftrags-Ausfuehrung; eine Ausnahme dort liesse den Auftrag scheitern,
// ohne einen brauchbaren Code zu liefern (TK 9.1.1).

/**
 * Der einzige fachliche Fehlercode, den diese Funktion erzeugen kann.
 *
 * `satisfies ImportFehlercode` ist der vom Issue verlangte BELEG, dass das Literal aus
 * der Fehlercode-Union des Moduls (#79) stammt und nicht hier erfunden wurde - und zwar
 * als echte Compiler-Pruefung: Verschwindet der Code eines Tages aus jener Union oder
 * verschreibt sich jemand hier, bricht der Typecheck.
 *
 * Warum `satisfies` und keine Typannotation `: ImportFehlercode`: Eine Annotation
 * verbreiterte den Wert auf die ganze Union; der Rueckgabetyp laesst aber nur dieses
 * eine Literal zu, und diese Enge soll der Typechecker weiter durchsetzen. Nebenbei
 * steht der Import damit nicht ungenutzt herum (@typescript-eslint/no-unused-vars) -
 * die im Issue vorgesehene Ausweichloesung "Beleg in die Testdatei" wird nicht gebraucht.
 */
const NICHT_UNTERSTUETZT = 'format_nicht_unterstuetzt' satisfies ImportFehlercode

export function pruefeFormat(
  dateiname: string,
): Ergebnis<{ typ: 'video' | 'bild'; endung: string }, 'format_nicht_unterstuetzt'> {
  const segment = letztesPfadsegment(dateiname)
  const punkt = segment.lastIndexOf('.')

  // Drei Faelle in einer Bedingung, alle mit demselben Ausgang:
  //   punkt === -1                  kein Punkt im Segment ("clip")
  //   punkt === 0                   Punkt nur an erster Stelle (".gitkeep") - eine
  //                                 Datei ohne Endung, deren Punkt zum Namen gehoert
  //   punkt === segment.length - 1  leere Endung ("film.")
  if (punkt <= 0 || punkt === segment.length - 1) {
    return abgelehnt(
      `"${dateiname}" hat keine auswertbare Dateiendung. ` +
        `Importierbar sind nur: ${erlaubteEndungen()}.`,
    )
  }

  // toLowerCase(), NICHT toLocaleLowerCase(): Letzteres haengt an der Systemsprache des
  // Nutzers und macht im tuerkischen Gebietsschema aus "I" ein punktloses "ı". Die App
  // laeuft auf fremden Rechnern, deren Gebietsschema niemand kennt - dort schlaege eine
  // gross geschriebene Endung dann grundlos fehl.
  const endung = segment.slice(punkt + 1).toLowerCase()

  // Reihenfolge wie im Vertrag: erst Video, dann Bild. Die zurueckgegebene `endung` ist
  // damit zwangslaeufig genau die Schreibweise aus der Whitelist - klein und ohne Punkt.
  // Daran haengt mehr als Kosmetik: Der Aufrufer (#85) baut daraus "<uuid>.<endung>"
  // (TK 9.4.8, Punkt 1). Kaeme sie gross oder mit Punkt zurueck, entstuenden Dateinamen,
  // die der Reconcile auf einem case-sensitiven Dateisystem nicht wiederfindet - das
  // Asset staende als "fehlt" da, obwohl die Datei liegt.
  if (enthaelt(FORMAT_WHITELIST.video, endung)) {
    return { ok: true, wert: { typ: 'video', endung } }
  }
  if (enthaelt(FORMAT_WHITELIST.bild, endung)) {
    return { ok: true, wert: { typ: 'bild', endung } }
  }

  return abgelehnt(
    `Das Format "${endung}" wird nicht unterstuetzt. Importierbar sind nur: ` +
      `${erlaubteEndungen()}. Andere Dateien muessen vorab konvertiert werden.`,
  )
}

/**
 * Alles nach dem letzten `/` ODER `\`.
 *
 * Warum das ueberhaupt sein muss: Der Aufrufer reicht meist den `quellPfad` durch, also
 * einen absoluten Windows- oder macOS-Pfad. Ohne diesen Schritt liefert ein Ordner mit
 * Punkt im Namen (`C:\Kampagne.2026\clipohneendung`) eine erfundene "Endung"
 * `2026\clipohneendung`.
 *
 * Warum NICHT `path.basename`: Das ist plattformabhaengig. Auf POSIX ist `\` kein
 * Trenner - `path.basename("C:\\Videos\\clip.x")` gibt die ganze Zeichenkette zurueck;
 * `path.win32.basename` bricht spiegelbildlich bei POSIX-Pfaden mit `\` im Namen. Hier
 * werden BEIDE Trenner unabhaengig vom laufenden System behandelt, und die Funktion
 * bleibt ohne Node-Baustein rein.
 *
 * Ist gar kein Trenner enthalten, liefern beide `lastIndexOf` -1, `slice(0)` gibt die
 * Zeichenkette unveraendert zurueck - der Fall "blosser Dateiname" braucht keinen
 * eigenen Zweig.
 */
function letztesPfadsegment(pfad: string): string {
  const trenner = Math.max(pfad.lastIndexOf('/'), pfad.lastIndexOf('\\'))
  return pfad.slice(trenner + 1)
}

/**
 * Sucht eine Endung in einer Teilliste der Whitelist.
 *
 * Der Umweg ueber eine eigene Funktion ist kein Zierrat, sondern die Alternative zu
 * einer Typbehauptung: `FORMAT_WHITELIST.video` ist ein `as const`-Tupel, dessen
 * `includes` nur die eigenen Literale als Argument annimmt - ein beliebiger String
 * kompiliert dort nicht. Ueblich waere `(… as readonly string[]).includes(…)`; solche
 * Behauptungen sind hier aber die Sorte Fluchttuer, die den Code geprueft aussehen
 * laesst. Ueber den PARAMETERTYP weitet TypeScript das Tupel ohne jede Behauptung.
 */
function enthaelt(erlaubte: readonly string[], endung: string): boolean {
  return erlaubte.includes(endung)
}

/**
 * Die zugelassenen Endungen fuer die Fehlermeldung - aus der Whitelist erzeugt, nicht
 * getippt. Waere sie hier ausgeschrieben, haette die App eine dritte Wahrheit: Der
 * Dialog boete etwas an, der Import liesse etwas anderes durch und die Meldung nennte
 * ein Drittes.
 */
function erlaubteEndungen(): string {
  return [...FORMAT_WHITELIST.video, ...FORMAT_WHITELIST.bild].join(', ')
}

/**
 * Die eine Fehlerausfahrt. `daten` bleibt ungesetzt: Der Fehlercode dieser Datei hat
 * keine strukturierten Nutzdaten (TK 9.1.1) - es gibt nichts zu reparieren und nichts
 * aufzuzaehlen, der Nutzer waehlt eine andere Datei.
 *
 * `Ergebnis<never, …>` heisst nicht "kein Wert", sondern "dieser Zweig kann keinen Wert
 * tragen": Der Fehlerzweig der Ergebnis-Huelle nennt `T` gar nicht, deshalb passt der
 * Rueckgabewert in jede Ergebnis-Signatur mit demselben Fehlercode.
 */
function abgelehnt(meldung: string): Ergebnis<never, typeof NICHT_UNTERSTUETZT> {
  return { ok: false, fehler: { code: NICHT_UNTERSTUETZT, meldung } }
}
