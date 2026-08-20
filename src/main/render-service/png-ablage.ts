// GENERIERT aus dem Signaturblock von Issue #175.
// [render-service] Segment- und Band-PNGs aus dem Auftrag nach T1 schreiben
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
// GERUEST-PRUEFSUMME: d0cdba3cbaca9c10
//
// ERLEDIGT (14.08.2026): Die Abschaltzeile fuer no-unused-vars ist mit dem Fuellen
// des Rumpfes entfernt - alle drei Importe werden jetzt benutzt.
//
// ============================================================================
// HIER TRIFFT VARIANTE A AUF DIE PLATTE
// ============================================================================
// "**PNG-Uebergabe als Binaerpuffer** (kein Base64 im Nachrichtenkoerper). Der
// **Renderer schreibt nichts auf die Platte**; er liefert die Bytes, der **Main**
// persistiert sie in den fluechtigen Arbeitsbereich (T1)." (TK 9.1, Punkt 3) -
// DIESE Datei ist der Satz, in Code. Die Bytes stammen aus `alsPng` (#118), also
// aus demselben Zeichenvorgang, der die Vorschau erzeugt hat. Was hier ankommt,
// geht hier UNVERAENDERT wieder heraus: kein Umkodieren, kein Neu-Komprimieren,
// keine Bildbibliothek, kein Anfassen des Farbprofils (ENTSCHIEDEN 1). Jede
// Aenderung an den Bytes braeche die Pixelgleichheit zwischen Vorschau und
// Endvideo - lautlos, denn `ffmpeg` liest auch ein umkodiertes PNG anstandslos.
//
// ZWEI STILLE FEHLGRIFFE, gegen die diese Datei ausdruecklich gebaut ist:
//
// 1. DEN PUFFER UEBER SEINEN SPEICHERBLOCK SCHREIBEN. Ein `Uint8Array` ist oft nur
//    ein AUSSCHNITT eines groesseren `ArrayBuffer`. `Buffer.from(png.buffer)`
//    schriebe den GANZEN Block - die Datei enthielte Fremdbytes vor und hinter dem
//    PNG. Deshalb wird der `Uint8Array` SELBST an `writeFile` gereicht; Node
//    beachtet dabei `byteOffset` und `byteLength`. Waere doch einmal ein `Buffer`
//    noetig, dann ausschliesslich
//    `Buffer.from(png.buffer, png.byteOffset, png.byteLength)` (ENTSCHIEDEN 2).
//    Der Fehler zeigt sich nur, wenn der Puffer zufaellig ein Ausschnitt IST - also
//    nicht in jedem Testlauf. Ein Test erzwingt den Fall.
//
// 2. DATEINAMEN AUS `element.id` BILDEN. Die Kennung kommt aus dem Renderer, und
//    "**Der Main validiert jede eingehende Nutzlast** - er vertraut dem Renderer
//    **nicht**" (TK 9.1.1, Punkt 6). Ein Wert mit einem Verzeichnistrenner darin
//    schriebe die Datei ausserhalb des Arbeitsbereichs. Die Namen entstehen
//    deshalb ALLEIN aus den Listenindizes (ENTSCHIEDEN 3); die Kennung darf in die
//    Fehlermeldung, nie in einen Pfad.
//
// UND: DIE HIER GELIEFERTEN ABSOLUTEN PFADE BLEIBEN IM MAIN. "Der Renderer kennt
// **keine** absoluten Pfade." (TK 9.2.1) Sie sind Eingang fuer die Filterketten
// (#166, #168, #177), nicht Teil einer IPC-Antwort.

import { writeFile } from 'node:fs/promises'
import path from 'node:path'

import type { RenderItem } from '../../shared/contracts/render-request'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { RenderFehlercode } from './fehlercodes'

// Fremde Typen - vollstaendig ausgeschrieben, damit hier nichts geraten wird:
//   #17:     type RenderItem = RenderItemVideo | RenderItemSegment
//            RenderItemSegment { id; art: 'segment'; png: Uint8Array; dauer }
//            RenderItemVideo   { id; art: 'video'; medienRef; trimStart; trimEnde;
//                                einblendung: { art; höhe; bandVorlageId;
//                                  abschnitte: Array<{ png: Uint8Array; dauer }> } | null }
//   #12/#22: type Ergebnis<T, F extends string = GenerischerFehlercode> =
//              | { ok: true; wert: T }
//              | { ok: false; fehler: { code: F | GenerischerFehlercode
//                                       meldung: string; daten?: unknown } }
//   #171:    type RenderFehlercode = 'medium_fehlt' | 'ungueltiges_element'
//              | 'ffmpeg_fehler' | 'kein_platz' | 'speicher_fehler'
//
// Mehr braucht diese Datei nicht. Insbesondere NICHT `loeseAssetPfad` (#49) - sie
// kennt nur den ihr uebergebenen Arbeitsbereich und weiss nichts von Projekt-,
// Medien- oder Ausgabeordnern - und NICHT `verwirfArbeitsbereich` (#172):
// Aufgeraeumt wird vom Aufrufer, als Ganzes (ENTSCHIEDEN 7).

/** Wo die geschriebenen PNGs liegen – beide Felder sind index-parallel zu `elemente`. */
export interface PngAblage {
  /** Je Listenindex der absolute Pfad des Segment-PNGs; `null` bei `video` und `bild`. */
  segmentPngs: ReadonlyArray<string | null>
  /** Je Listenindex die absoluten Pfade der Band-Abschnitte in Abschnittsreihenfolge; leeres Array ohne Einblendung. */
  bandPngs: ReadonlyArray<readonly string[]>
}

/**
 * So viele Stellen bekommt ein Index MINDESTENS - "mindestens", nicht "genau".
 *
 * Ein Index ab 10000 macht den Namen laenger; abgeschnitten wird NIE. Ein Schnitt
 * auf vier Stellen liesse `10000` und `0000` auf denselben Dateinamen fallen: Das
 * zehntausendundeinste Element ueberschriebe das erste, und die Filterkette des
 * ersten arbeitete danach mit fremden Pixeln - ohne Fehlermeldung, weil die Datei
 * ja existiert.
 */
const NAMENS_STELLEN = 4

/**
 * Dateiname eines Segment-PNGs, allein aus dem Listenindex.
 * Der Namensbestandteil `Png` ist Pflicht – Begründung: ENTSCHIEDEN 10.
 */
export function segmentPngDateiname(elementIndex: number): string {
  // Praefix `segment-` mit Bindestrich und AUSGESCHRIEBEN (ENTSCHIEDEN 5): Die
  // Zwischenclips heissen laut TK Abschnitt 6 `seg_*.mp4`. Ein `seg_0007.png` waere
  // beim Betrachten des Ordners und in jedem Suchmuster eine Falle - zwei Dateien
  // desselben Elements, deren Namen sich nur in der Endung unterscheiden.
  return `segment-${aufStellen(elementIndex)}.png`
}

/** Dateiname eines Band-Abschnitts, allein aus Listen- und Abschnittsindex. */
export function bandDateiname(elementIndex: number, abschnittIndex: number): string {
  // BEIDE Indizes werden aufgefuellt, wie die Namenstabelle des Issues es vorgibt.
  // Der Bindestrich allein verhinderte zwar schon jede Verwechslung (`band-3-12` und
  // `band-31-2` sind auch ohne Auffuellen verschieden) - aber nur mit gleicher
  // Stellenzahl steht `band-0003-0002` im Ordner VOR `band-0003-0012`, und genau
  // diese Reihenfolge braucht, wer beim Fehlersuchen von Hand hineinsieht.
  return `band-${aufStellen(elementIndex)}-${aufStellen(abschnittIndex)}.png`
}

/** Ein Index als Zeichenkette, links mit Nullen auf NAMENS_STELLEN aufgefuellt. */
function aufStellen(index: number): string {
  return String(index).padStart(NAMENS_STELLEN, '0')
}

/** Schreibt alle PNGs des Auftrags flach in den Arbeitsbereich. */
export async function legePngsAb(
  arbeitsbereich: string,
  elemente: readonly RenderItem[],
): Promise<Ergebnis<PngAblage, RenderFehlercode>> {
  // EIN Fangnetz um den ganzen Rumpf. "Niemals `throw`" (TK 9.1.1): Der Aufrufer
  // (#181) laeuft in einem Auftrag, dessen Ergebnis ueber die IPC-Grenze reist -
  // dort ueberlebt eine Ausnahme nur als Text, Fehlerklasse und `code` gingen
  // verloren.
  try {
    // `typeof` trotz `string` in der Signatur - der Auftrag kann aus einer
    // Q2-Wiederholung stammen und damit durch JSON gegangen sein.
    if (typeof arbeitsbereich !== 'string' || arbeitsbereich.trim() === '') {
      // KEIN Schreibversuch. Ein leerer Ordnerpfad machte aus `path.join` einen
      // relativen Namen - die PNGs landeten im ARBEITSVERZEICHNIS des Programms
      // und blieben dort liegen, weil niemand sie dort aufraeumt.
      return fehler(
        'speicher_fehler',
        'Es wurde kein Arbeitsbereich uebergeben; die Segment-PNGs koennen nirgends ' +
          'abgelegt werden. Der Render wurde nicht begonnen.',
      )
    }

    if (!Array.isArray(elemente)) {
      return fehler(
        'ungueltige_eingabe',
        'Die Elementliste des Render-Auftrags ist keine Liste; es wurde nichts geschrieben.',
      )
    }

    const segmentPngs: (string | null)[] = []
    const bandPngs: string[][] = []

    // DER REIHE NACH, nicht gleichzeitig (ENTSCHIEDEN 8). Eine Wiedergabeliste kann
    // hundert Elemente haben; hundert gleichzeitige Schreibvorgaenge mit je mehreren
    // Megabyte belasten die Platte ohne Gewinn - der Engpass IST die Platte - und
    // der erste Fehler soll den Vorgang beenden, statt neben neunundneunzig weiteren
    // aufzutreten. Ausserdem ist die Fehlermeldung so eindeutig: Sie nennt das eine
    // Element, an dem es scheiterte.
    for (const [index, element] of elemente.entries()) {
      let segmentPfad: string | null = null
      const bandPfade: string[] = []

      // Nur `segment` und die `abschnitte` einer `einblendung` tragen Pixel (#17).
      // `bild` und `video` verweisen per `medienRef` auf Dateien in media/ - die
      // gehen NIE ueber IPC und werden hier NICHT angefasst; ihr Eintrag bleibt
      // `null` bzw. leer, damit beide Felder index-parallel zur Liste bleiben.
      if (element.art === 'segment') {
        const geschrieben = await schreibePng(
          arbeitsbereich,
          segmentPngDateiname(index),
          element.png,
          element,
        )
        if (!geschrieben.ok) {
          return geschrieben
        }
        segmentPfad = geschrieben.wert
      } else if (element.art === 'video' && element.einblendung !== null) {
        // Die Abschnitte behalten ihre Reihenfolge - aus ihr entsteht die Bandspur
        // (#168), und ein vertauschter Abschnitt zeigte am Fernseher den falschen
        // Text zur falschen Zeit, ohne dass irgendetwas scheiterte.
        for (const [abschnittIndex, abschnitt] of element.einblendung.abschnitte.entries()) {
          const geschrieben = await schreibePng(
            arbeitsbereich,
            bandDateiname(index, abschnittIndex),
            abschnitt.png,
            element,
          )
          if (!geschrieben.ok) {
            return geschrieben
          }
          bandPfade.push(geschrieben.wert)
        }
      }

      segmentPngs.push(segmentPfad)
      bandPngs.push(bandPfade)
    }

    return { ok: true, wert: { segmentPngs, bandPngs } }
  } catch (ursache) {
    // Alles, was kein Schreibfehler war - etwa eine Liste, deren Eintrag gar kein
    // Element ist. "Eine rohe Exception-Meldung wird nie zum Code" (TK 9.1.1): Der
    // Text reist als Begruendung mit, der Code ist `unbekannter_fehler`.
    return fehler(
      'unbekannter_fehler',
      `Die Segment-PNGs liessen sich nicht ablegen. Grund: ${textVon(ursache)}`,
    )
  }
}
// - schreibt AUSSCHLIESSLICH PNGs, flach, unmittelbar in den uebergebenen Ordner
// - beide Felder haben genau so viele Eintraege wie `elemente`, index-parallel
// - bricht beim ERSTEN Fehler ab und raeumt nichts weg (ENTSCHIEDEN 7)
// - wirft nie; jeder Fehler wird zum Ergebnis (TK 9.1.1)

/**
 * Schreibt EINEN Puffer und liefert seinen absoluten Pfad.
 *
 * Die einzige Stelle dieser Datei, die das Dateisystem beruehrt - und damit die
 * einzige, an der die errno-Abbildung des Moduls steht.
 */
async function schreibePng(
  arbeitsbereich: string,
  dateiname: string,
  png: Uint8Array,
  element: RenderItem,
): Promise<Ergebnis<string, RenderFehlercode>> {
  // `path.join` und KEIN `path.resolve` auf den Arbeitsbereich: Der Ordner kommt
  // fertig von #172 und wird unveraendert benutzt (Eingangstabelle des Issues).
  // Ausbrechen kann der zusammengesetzte Pfad nicht - der Dateiname entsteht allein
  // aus Zahlen und festen Zeichen, es gibt darin weder Trenner noch `..`.
  //
  // Flach, ohne Unterordner (ENTSCHIEDEN 4): Der Ordnerbaum in TK Abschnitt 6 zeigt
  // PNGs, `seg_*.mp4` und `concat.txt` alle unmittelbar in `reel-XXXX/`. Ein selbst
  // erfundener Unterordner muesste von drei weiteren Dateien erraten werden.
  const pfad = path.join(arbeitsbereich, dateiname)

  try {
    // DER PUFFER SELBST, nicht sein Speicherblock - s. Kopf dieser Datei, Punkt 1.
    // `writeFile` erzeugt die Datei oder ersetzt eine vorhandene vollstaendig; ein
    // Rest einer laengeren Vordatei kann also nicht stehen bleiben.
    //
    // NICHT atomar, kein `.part`, kein Rename (ENTSCHIEDEN 6): T1 ist fluechtig.
    // Scheitert ein Schreibvorgang, scheitert der ganze Lauf, und der Aufrufer
    // verwirft den kompletten Arbeitsbereich. Die Regel ".part + Rename" gilt im
    // Projekt ausschliesslich fuer die FERTIGE Ausgabedatei (TK 9.2.6); sie hier
    // ohne Not zu wiederholen, verwaesserte sie.
    //
    // KEIN `fsync`. T1 ueberlebt einen Stromausfall per Definition nicht, und der
    // gleich folgende `ffmpeg`-Aufruf liest ueber dasselbe Betriebssystem, sieht die
    // Bytes also auch ungeschrieben.
    await writeFile(pfad, png)
    return { ok: true, wert: pfad }
  } catch (ursache) {
    const code = systemCode(ursache)

    // NUR DER DATEINAME, NIE DER GANZE PFAD (Fehlertabelle des Issues): Die Meldung
    // reist ueber IPC bis in die Oberflaeche, und "Der Renderer kennt **keine**
    // absoluten Pfade" (TK 9.2.1). Der Dateiname sagt trotzdem genau, welches
    // Element betroffen ist - dafuer traegt er den Index.
    const stelle = `${dateiname} (Element ${kennung(element)})`

    if (code === '') {
      return fehler(
        'unbekannter_fehler',
        `${stelle} liess sich nicht in den Arbeitsbereich schreiben. Grund: ${textVon(ursache)}`,
      )
    }

    // DIE ERRNO-ABBILDUNG DIESES MODULS, Wort fuer Wort dieselbe wie in #172
    // (Arbeitsbereich), #177 (Zwischenclips in T1) und #180 (Ausgabedatei):
    // `ENOSPC` -> kein_platz, jeder andere Schreibfehler -> speicher_fehler, der
    // Code des Betriebssystems IMMER nur in der `meldung`, NIE im `code`. Weichen
    // die vier Dateien voneinander ab, ist das ein Vertragsfehler - dann melden,
    // nicht hier anders entscheiden.
    if (code === 'ENOSPC') {
      return fehler(
        'kein_platz',
        `${stelle} passt nicht mehr in den Arbeitsbereich - die Platte ist voll (ENOSPC). ` +
          `Bitte Platz auf der Systemplatte schaffen und den Render wiederholen.`,
      )
    }

    if (code === 'ENOENT') {
      // Der Ordner war beim Anlegen da (#172 hat ihn erzeugt) und ist es jetzt nicht
      // mehr: ein fremder Aufraeumdienst, ein entfernter Datentraeger, ein
      // Virenscanner. Das ausdruecklich zu sagen erspart die Suche nach einer Datei,
      // die nie geschrieben wurde.
      return fehler(
        'speicher_fehler',
        `${stelle} liess sich nicht schreiben: Der Arbeitsbereich ist waehrend des Renders ` +
          `verschwunden (ENOENT). Bitte den Render wiederholen.`,
      )
    }

    // `EACCES`, `EPERM`, `EROFS`, `EIO` und alles Uebrige.
    //
    // VERMERK FUER DEN AUFTRAGGEBER (steht so auch im Issue): Die als vollstaendig
    // gefuehrte Tabelle in TK 9.2.3 beschreibt `speicher_fehler` als Fehler am ZIEL
    // und nennt dabei nur den Ausgabeordner; `kein_platz` nennt dagegen ausdruecklich
    // BEIDE Orte. Fuer einen Nicht-Platz-Schreibfehler IN T1 benennt sie keinen Code.
    // Gewaehlt ist `speicher_fehler`, weil es derselbe Fehlerfall derselben Klasse
    // ist; ein neuer Code ist verboten (#171).
    return fehler(
      'speicher_fehler',
      `${stelle} liess sich nicht in den Arbeitsbereich schreiben (${code}). ` +
        `Bitte die Schreibrechte im Temp-Verzeichnis pruefen und den Render wiederholen.`,
    )
  }
}

/**
 * Die Kennung des Elements FUER DIE MELDUNG - und nur dafuer.
 *
 * Sie stammt aus dem Renderer und ist deshalb kein Baustein eines Pfades
 * (ENTSCHIEDEN 3), wohl aber die einzige Angabe, mit der sich das betroffene Element
 * spaeter wiederfinden laesst. `String(...)` statt blindem Einsetzen, weil ein
 * fehlendes Feld sonst als "undefined" mitten im Satz staende; gekuerzt wird sie,
 * damit eine ueberlange Kennung die Meldung nicht unlesbar macht.
 */
function kennung(element: RenderItem): string {
  const roh = typeof element?.id === 'string' ? element.id : ''
  if (roh === '') {
    return 'ohne Kennung'
  }
  return roh.length > 80 ? `${roh.slice(0, 80)}...` : roh
}

/**
 * Liest den `code` eines Node-Systemfehlers, ohne ihn auf einen Typ zu zwingen, den
 * er nicht hat. Leerer String = kein verwertbarer Code.
 */
function systemCode(ursache: unknown): string {
  if (typeof ursache !== 'object' || ursache === null || !('code' in ursache)) {
    return ''
  }
  // SAFETY: die Zeile davor hat code in ursache belegt; der Cast macht das Feld
  // sichtbar, und der typeof-Check darunter prueft es zur Laufzeit.
  const code = (ursache as { code?: unknown }).code
  return typeof code === 'string' ? code : ''
}

/** Der Text einer Ausnahme, ohne Stacktrace - der reist nicht ueber die Grenze. */
function textVon(ursache: unknown): string {
  return ursache instanceof Error ? ursache.message : String(ursache)
}

/**
 * Die Fehlerhuelle - IMMER OHNE `daten`.
 *
 * "Die Form von `daten` ist damit **je Fehlercode festgelegt**: `{ elementId: string }`
 * bei `medium_fehlt` und `ungueltiges_element`, sonst nicht gesetzt." (TK 9.2.3)
 * Keiner der vier Codes dieser Datei (`kein_platz`, `speicher_fehler`,
 * `ungueltige_eingabe`, `unbekannter_fehler`) gehoert zu den beiden genannten - also
 * bleibt `daten` durchgehend weg. Das ist kein Informationsverlust: Die Kennung des
 * betroffenen Elements steht in der `meldung`, und der gefuehrte Reparatur-Modus
 * (FA-19) haengt nur an den beiden Codes, die diese Datei nicht vergibt.
 */
function fehler<T>(
  code: RenderFehlercode | 'ungueltige_eingabe' | 'unbekannter_fehler',
  meldung: string,
): Ergebnis<T, RenderFehlercode> {
  return { ok: false, fehler: { code, meldung } }
}

// NICHT HIER, UND GEMELDET:
//
// 1. KEINE ZWEITE PRUEFUNG DER PUFFER (ENTSCHIEDEN 9). Ob ein `segment` ueberhaupt
//    einen Puffer hat und ob die Masse stimmen, hat #173 entschieden
//    (`ungueltiges_element`). Eine zweite Pruefung mit womoeglich abweichenden Regeln
//    waere eine zweite Wahrheit. Faende diese Datei einen fehlenden Puffer vor, waere
//    das ein Vertragsfehler - er faellt dann als `unbekannter_fehler` auf und ist zu
//    MELDEN, nicht mit einem eigenen `ungueltiges_element` zu ueberdecken.
//
// 2. KEIN AUFRAEUMEN NACH EINEM FEHLER (ENTSCHIEDEN 7). Bereits geschriebene PNGs
//    bleiben liegen; der Aufrufer verwirft den Arbeitsbereich ohnehin als Ganzes
//    (#172). Ein eigenes Zurueckrollen waere eine zweite, schwaechere Aufraeumlogik
//    neben `verwirfArbeitsbereich`.
//
// 3. KEINE WIEDERHOLUNGSSTAFFEL wie in #172/#86. Dort geht es ums LOESCHEN, das unter
//    Windows an einem nachhaengenden fremden Handle scheitert und Sekunden spaeter
//    gelingt. Hier wird in einen frisch angelegten, exklusiv benutzten Ordner
//    GESCHRIEBEN, in dem noch niemand ein Handle haelt; ein `EACCES` oder `ENOSPC`
//    bessert sich durch Warten nicht, und die Warteschlange ist streng seriell
//    (NFA-09) - eine Staffel waere hier reine Verzoegerung mit demselben Ausgang.
//
// 4. NICHTS ANDERES ALS PNGs. Keine concat-Liste, keine Zwischenclips, keine
//    Protokolldatei im Arbeitsbereich - jede dieser Dateien hat ihren eigenen
//    Besitzer (#177, #176). Und es wird in T1 nichts GELESEN und nichts GELOESCHT:
//    Diese Datei schreibt, sonst nichts.
//
// 5. DIE GEGENSTELLE IN #177 HEISST `zwischenclipDateiname` - geprueft am 14.08.2026
//    in `src/main/render-service/normalisieren.ts`. Damit ist die Kollision aus
//    ENTSCHIEDEN 10 ausgeschlossen: Die beiden Funktionen haben dieselbe Signatur und
//    liegen im selben Ordner, liefern aber Verschiedenes (`segment-0007.png` gegen
//    `seg_0007.mp4`). Hiessen sie gleich, kompilierte ein vertauschter Import
//    fehlerfrei und setzte ffmpeg auf Dateien an, die es nicht gibt.
