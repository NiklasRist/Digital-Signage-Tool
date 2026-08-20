// GENERIERT aus dem Signaturblock von Issue #177.
// [render-service] Ein Element normalisieren
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
// GERUEST-PRUEFSUMME: 2082b8bbef619a71
//
// ERLEDIGT (14.08.2026): Rumpf gefuellt, die dateiweite Abschaltzeile
// (@typescript-eslint/no-unused-vars) ist damit entfernt - jeder Parameter und
// jeder Import wird jetzt benutzt.
//
// ===========================================================================
// DIE WEICHE - was diese Datei entscheidet und was sie ausdruecklich nicht tut
// ===========================================================================
// Sie waehlt je Element EINE der drei Filterketten aus, laesst die Argumente vom
// `ffmpeg-adapter` bauen und drueckt genau einmal ab. Sie formuliert KEINE
// Filterkette, baut KEIN Argument-Array, kennt KEINE Encoder-Option und startet
// KEINEN Prozess selbst (`fuehreFfmpegAus`, #158, ist die einzige Startstelle).
// Sie loest auch KEINEN Medienpfad selbst auf: `loeseAssetPfad` (#49) ist die
// Pfad-Autoritaet, und nur sie kennt das Datei-Layout und die Traversal-Schranke.
// Zusammengesetzt werden hier ausschliesslich Pfade INNERHALB des
// Arbeitsbereichs - T1 gehoert diesem Modul.
//
// ---------------------------------------------------------------------------
// DER EINHEITEN-BRUCH AN DER FORTSCHRITTS-NAHT - hier und nur hier geteilt
// ---------------------------------------------------------------------------
// `erzeugeFortschrittsLeser(...).nimmZeile()` (#160) liefert einen GANZZAHLIGEN
// PROZENTWERT 0..100. `NormalisierKontext.aufElementFortschritt` (Signatur oben)
// nimmt einen ANTEIL 0..1 entgegen. Beide Seiten sind `number`, beide fuer sich
// richtig - wer durchreicht, meldet ab dem ersten Tick den Wert 42 als Anteil,
// der Sender (#178) klemmt ihn auf 1, und der Balken springt bei jedem
// Elementwechsel sofort ans Abschnittsende und steht dort still. NICHTS stuerzt
// ab, nichts wird rot, kein Test schlaegt an.
//
// Geteilt wird deshalb GENAU HIER, an der Naht, die die beiden verbindet: nicht
// in #160 (dessen Prozentwert geht auch anderswohin) und nicht in #178 (dessen
// Vertrag 0..1 sagt und dessen Klemmung ein Schutz ist, kein Umrechner).
//
// ---------------------------------------------------------------------------
// BEFUNDE ZUM ISSUE #177 - gemeldet, NICHT eigenmaechtig aufgeloest
// ---------------------------------------------------------------------------
// B1  PARAMETER-REIHENFOLGE von `baueVollbildFilter`. Das Issue zitiert
//     `baueVollbildFilter(profil, hintergrund)`; GEBAUT ist
//     `baueVollbildFilter(hintergrund, profil)` (#163, filter-vollbild.ts).
//     Gebaut gewinnt. Der Irrtum ist hier ungefaehrlich, weil die Typen
//     `string` und `RenderProfile` sich nicht vertauschen lassen - der
//     Typechecker beisst sofort.
//
// B2  BANDGEOMETRIE. Die im Issue zitierte `Bandgeometrie` ist ueberholt; der
//     Nachtrag vom 14.08.2026 nennt die gebauten Namen. Benutzt werden
//     `geo.videoBreite` (die TATSAECHLICH EINGEPASSTE Breite, bei H = 162 also
//     1632) und `geo.videoVersatzX`. Die alte Bedeutung von `videoBreite` war
//     die VOLLE Zielflaeche (1920) - sie heisst jetzt `videoBereichBreite` und
//     wird hier NICHT gereicht.
//
// B3  TRIM + BAND ist an der Wurzel kaputt, und das Issue gibt keine Regel
//     dafuer. Gemessen beim Bau von #167 (Commit 3d9fe17, 14.08.2026): Ist ein
//     Videoelement GETRIMMT (`startFrame > 0`) UND traegt es ein Band, dann
//       - `einblendung`: der Clip wird ZU KURZ (gemessen 75 statt 120 Bilder),
//         weil `-ss` als Ausgabe-Option auch die Bandspur vorspult und
//         `overlay=…:shortest=1` mit dem kuerzeren Strom endet;
//       - `split`: der Clip hat die richtige Laenge, aber das Band ist um
//         `startFrame` VERSETZT und friert am Ende ein (`vstack`/framesync
//         haelt das letzte Bild).
//     Zwei verschiedene Fehler, beide mit Exitcode 0 und ohne Warnung. Das
//     Issue sagt fuer beide "zu kurz" voraus - das stimmt nur zur Haelfte.
//     UMGESETZT IST DIE VERBINDLICHE VORGABE des Issues:
//     `BandspurAuftrag.gesamtFrames` = `trimFrames(...).frames`. Eine eigene
//     Korrektur (etwa `endFrame` statt `frames`) waere eine erfundene Regel an
//     der falschen Stelle: Sie aenderte zugleich, WELCHER Bandabschnitt am
//     Anfang steht, und gehoert damit in den Vertrag von #164/#165/#168, nicht
//     in die Weiche. UNGETRIMMTE Elemente (`startFrame === 0`) sind nicht
//     betroffen - das ist heute der Normalfall.
//
// B4  Die Definition of Done verlangt eine Grep-Probe auf `child_process`. Der
//     VERBINDLICHE Signaturblock schreibt aber `import type { ChildProcess }
//     from 'node:child_process'` vor. Umgesetzt ist die erkennbare Absicht: kein
//     `spawn`, kein `exec`, kein Wert-Import - der Typ-Import bleibt, weil die
//     Signatur unveraenderlich ist.
//
// B5  `aufProzessStart` kann NICHT `kontext.merkeProzess` selbst sein. Das Issue
//     verlangt beides: den Rueckruf unveraendert durchzureichen UND nach dem
//     `await` `gibProzessFrei` mit DEMSELBEN Handle zu rufen. Ohne eine Huelle,
//     die das Handle im Vorbeigehen festhaelt, kennt diese Datei es nie. Der
//     Rueckruf ist deshalb eine duenne Huelle, die `kontext.merkeProzess`
//     unveraendert mit demselben Handle aufruft; `abbruchSignal` wird
//     identisch durchgereicht. Ein Test, der auf Objektgleichheit von
//     `aufProzessStart` prueft, kann nicht erfuellt werden - geprueft wird das
//     VERHALTEN.
//
// B6  Die Bandspur-Zwischendateien heissen nach ENTSCHIEDEN `bandseq_NNNN.mp4`
//     und `band_NNNN.mp4`, ihr Inhalt ist aber `qtrle` in einem `mov`-Container
//     (#168 - H.264 kann keinen Alphakanal). Die Endung luegt also. Sie ist
//     harmlos, weil #168 den Muxer mit `-f` ausdruecklich setzt und die
//     concat-Liste (#169) ausschliesslich uebergebene Pfade fuehrt, statt den
//     Ordner abzusuchen. Uebernommen wie vorgegeben, gemeldet.
//
// B7  Der Fortschritt eines Elements MIT Band laeuft zweimal von 0 nach 1: Das
//     Issue schreibt "je ffmpeg-Aufruf ein `erzeugeFortschrittsLeser(...)`" und
//     "Solldauer = frames / fps" vor, ohne eine Gewichtung zwischen Bandspur
//     und Videolauf zu nennen. Eine erfundene Gewichtung waere eine dritte
//     Wahrheit ueber denselben Balken; die Vorgabe ist woertlich umgesetzt.
//     "Grober Stand" (Signatur oben) deckt das ab.
//
// ---------------------------------------------------------------------------
// DIE errno-ABBILDUNG - Wort fuer Wort dieselbe wie in #172, #175 und #180
// ---------------------------------------------------------------------------
// `ENOSPC` -> `kein_platz`, jeder andere Systemfehler -> `speicher_fehler`, kein
// Systemcode -> `unbekannter_fehler`; der Code des Betriebssystems steht IMMER
// nur in der `meldung`, NIE im `code`. Weicht eine der vier Dateien ab, ist das
// ein Vertragsfehler - dann melden, nicht hier anders entscheiden.

import { access, constants } from 'node:fs/promises'
import path from 'node:path'

import type { ChildProcess } from 'node:child_process'
import type { RenderItem } from '../../shared/contracts/render-request'
import type { RenderProfile } from '../../shared/contracts/render-profile'
import type { Ergebnis, GenerischerFehlercode } from '../../shared/contracts/ergebnis'
import type { ElementFehlerdaten, RenderFehlercode } from './fehlercodes'      // #171

import { loeseAssetPfad } from '../project-store/pfade'                         // #49
import { fuehreFfmpegAus } from '../ffmpeg-adapter/prozess'                     // #158
import type { FfmpegFehlercode, FfmpegLauf } from '../ffmpeg-adapter/prozess'   // #158
import { erzeugeFortschrittsLeser } from '../ffmpeg-adapter/fortschritt'        // #160
import { baueVollbildFilter } from '../ffmpeg-adapter/filter-vollbild'          // #163
import { baueSplitFilter, markenFarbeZuFfmpeg } from '../ffmpeg-adapter/filter-split'  // #164
import { baueEinblendungFilter } from '../ffmpeg-adapter/filter-einblendung'    // #165
import { baueStandbildArgumente } from '../ffmpeg-adapter/standbild'            // #166
import { baueVideoAusschnittArgumente } from '../ffmpeg-adapter/video-ausschnitt'  // #167
import { baueBandspur } from '../ffmpeg-adapter/bandspur'                       // #168
import type { BandAbschnitt } from '../ffmpeg-adapter/bandspur'                 // #168
import { frameDauer, trimFrames, zuFrames } from './frames'                     // #174
import { bestimmeBandgeometrie } from './band-geometrie'                        // #176
import type { Bandart } from './band-geometrie'                                 // #176

/** Die in T1 abgelegten PNGs GENAU DIESES Elements (aus PngAblage, #175). */
export interface ElementPngs {
  /** Pfad des Segment-PNG; `null` bei `video`. */
  segment: string | null
  /** Pfade der Band-Abschnitte in Abschnittsreihenfolge; leeres Array ohne Einblendung. */
  band: readonly string[]
}

export interface NormalisierKontext {
  projektId: string
  /** absoluter Pfad des T1-Ordners <Temp>/reel-XXXX (#172); existiert bereits */
  arbeitsbereich: string
  /** aus RenderRequest.profil; wird UNVERAENDERT durchgereicht */
  profil: RenderProfile
  /** Hexwert '#RRGGBB' der Farb-Rolle flaecheDunkel, vom Aufrufer aus leseMarke() (#29) */
  flaecheDunkel: string
  /** DIESELBE Abbruch-Quelle wie istAbgebrochen() (#179) – KEIN zweites Flag */
  abbruchSignal: AbortSignal
  /** = merkeProzess (#159), von renderReel hereingereicht */
  merkeProzess: (kindProzess: ChildProcess) => void
  /** = gibProzessFrei (#159), von renderReel hereingereicht */
  gibProzessFrei: (kindProzess: ChildProcess) => void
  /** grober Stand INNERHALB dieses Elements, 0..1 – geht an den Fortschritts-Sender (#178) */
  aufElementFortschritt: (anteilImElement: number) => void
}

/**
 * So viele Stellen bekommt ein Index MINDESTENS - "mindestens", nicht "genau".
 *
 * Vier, damit die Namen zur PNG-Ablage passen (#175: `segment-0007.png`) und zu den
 * Beispielen in #166/#167 (`<T1>/seg_0003.mp4`). Ein Index ab 10000 macht den Namen
 * LAENGER; abgeschnitten wird NIE - sonst fielen `10000` und `0000` auf denselben
 * Dateinamen, und der Zwischenclip des ersten Elements traege die Pixel des
 * zehntausendundersten, ohne dass irgendetwas eine Meldung erzeugte.
 */
const NAMENS_STELLEN = 4

/**
 * Der Hintergrund JEDER vollflaechigen Normalisierung.
 *
 * "9.2.4 schreibt SCHWARZE Balken vor." Die Markenfarbe kommt ausschliesslich in
 * der Split-Komposition vor und reist dort als `kontext.flaecheDunkel` herein - in
 * dieser Datei steht KEINE Hexzahl, auch nicht als Rueckfallwert.
 */
const HINTERGRUND = 'black'

/** Der Wert, den der Fortschritts-Leser (#160) als "fertig" meldet - s. Einheiten-Bruch oben. */
const VOLLE_PROZENT = 100

/**
 * Die beiden Fehlercodes, die `daten` tragen duerfen.
 *
 * "Die Form von `daten` ist damit je Fehlercode festgelegt: `{ elementId: string }`
 * bei `medium_fehlt` und `ungueltiges_element`, sonst nicht gesetzt." (TK 9.2.3)
 *
 * Die Enge hat einen Empfaenger: `RenderResult.fehlerhaftesElementId` speist den
 * gefuehrten Reparatur-Modus (FA-19). Ein `{ elementId }` an `kein_platz` schickte
 * den Nutzer zu einem Element, an dem nichts falsch ist, waehrend die Platte voll
 * bleibt. Die Element-ID geht trotzdem nie verloren - sie steht bei JEDEM Code in
 * der `meldung`.
 */
const CODES_MIT_DATEN: readonly string[] = ['medium_fehlt', 'ungueltiges_element']

/** Alle Codes, die diese Datei vergeben oder durchreichen kann. */
type Fehlercode = RenderFehlercode | GenerischerFehlercode

/** Elementbezug fuer jede Meldung dieser Datei - einmal gebildet, ueberall benutzt. */
interface Elementbezug {
  /** Klartext fuer die `meldung`, enthaelt die Element-ID (Vertrag: die ID reist im Text mit). */
  text: string
  /** Die strukturierte Form fuer die beiden Codes, die sie tragen duerfen. */
  daten: ElementFehlerdaten
}

/**
 * Dateiname des Zwischenclips, allein aus dem Listenindex.
 * NICHT `segmentDateiname` nennen – Begründung: ENTSCHIEDEN unten.
 *
 * Der Name ist Kollisionsschutz, kein Geschmack: Im selben Modulordner liefert
 * `segmentPngDateiname` (#175) `segment-0007.png` - gleiche Signatur, gleicher
 * Ordner, anderes Ergebnis. Hiessen beide gleich, kompilierte ein vertauschter
 * Import fehlerfrei und setzte ffmpeg auf Dateien an, die es nicht gibt.
 */
export function zwischenclipDateiname(elementIndex: number): string {
  return `seg_${aufStellen(elementIndex)}.mp4`
}

/**
 * Prueft VOR dem ersten ffmpeg-Aufruf, dass jedes referenzierte Medium physisch vorhanden ist.
 * Wird von renderReel (#181) einmal ueber die GESAMTE Elementliste aufgerufen, bevor irgendein
 * ffmpeg- oder ffprobe-Prozess startet.
 *
 * Geprueft wird die DATEI AUF DER PLATTE, nicht `Asset.zustand` in D1: Der
 * `render-service` hat keine Leseoperation auf D1 in seinem Vertrag, und die
 * physische Pruefung ist die staerkere - ein Asset, das in D1 noch als vorhanden
 * gefuehrt wird, dessen Datei aber geloescht wurde, rutschte durch eine reine
 * D1-Pruefung hindurch. Beide Wege enden ohnehin im selben Fehlercode.
 *
 * Gemeldet wird der ERSTE Treffer, dann bricht sie ab: `RenderResult.fehler` traegt
 * genau EINE Element-ID, und der gefuehrte Reparatur-Modus arbeitet nach der Regel
 * "Eins nach dem anderen" (TK 9.7.5). Eine Liste haette keinen Empfaenger.
 */
export async function pruefeMedienVorhanden(
  elemente: readonly RenderItem[],
  projektId: string,
): Promise<Ergebnis<void, RenderFehlercode>> {
  // EIN Fangnetz um den ganzen Rumpf. "Niemals `throw`" (TK 9.1.1): Diese Zusage
  // reist im Auftrag ueber die IPC-Grenze, wo eine Ausnahme nur als Text ueberlebt -
  // Fehlerklasse und `code` gingen verloren.
  try {
    if (!Array.isArray(elemente)) {
      return fehler('ungueltige_eingabe', 'Es wurde keine Elementliste uebergeben.')
    }

    for (const [index, element] of elemente.entries()) {
      const art = feld(element, 'art')

      // Nur `art: 'video'` hat ein Medium; `art: 'segment'` traegt seine Pixel im
      // Auftrag mit und wird uebersprungen. (Bis TK v3.15 gehoerte `art: 'bild'`
      // ebenfalls hierher - die Elementart ist mit v3.16 gestrichen, TK 9.11.3.) Ein
      // UNBEKANNTER `art`-Wert wird hier ebenfalls uebersprungen: Er hat kein Medium,
      // und sein Urteil faellt die Weiche in `normalisiereElement`
      // (`ungueltige_eingabe`). Zwei Stellen, die dasselbe verwerfen, sind zwei
      // Wahrheiten.
      if (art !== 'video') continue

      const bezug = bilde(element, index)
      const geprueft = await loeseUndPruefeMedium(projektId, feld(element, 'medienRef'), bezug)
      if (!geprueft.ok) return geprueft
    }

    return { ok: true, wert: undefined }
  } catch (ursache) {
    return ausAusnahme(ursache, 'Die Medienpruefung', '')
  }
}

/**
 * Normalisiert GENAU EIN Element zu genau einer Datei seg_NNNN.mp4 im Arbeitsbereich.
 * Erfolgsnutzlast ist der absolute Pfad dieser Datei.
 *
 * Der `default`-Zweig der Weiche ist PFLICHT, obwohl TypeScript ihn fuer unerreichbar
 * haelt: `RenderItem` kommt ueber die IPC-Grenze, dort ist der Typ geloescht und nur
 * noch eine Zusage. Ein unbekannter `art`-Wert ist zur Laufzeit moeglich und liefert
 * `ungueltige_eingabe` - niemals einen stillen Durchfall.
 */
export async function normalisiereElement(
  element: RenderItem,
  index: number,                 // 0-basiert; bestimmt den Dateinamen
  pngs: ElementPngs,             // aus PngAblage.segmentPngs[index] / .bandPngs[index] (#175)
  kontext: NormalisierKontext,
): Promise<Ergebnis<string, RenderFehlercode>> {
  const bezug = bilde(element, index)

  // Ausserhalb des Versuchs, damit der Fangzweig den Ort noch nennen kann.
  let arbeitsbereich = ''

  try {
    if (kontext === null || kontext === undefined || typeof kontext !== 'object') {
      return fehler('ungueltige_eingabe', `${bezug.text}: Es wurde kein Normalisier-Kontext uebergeben.`)
    }

    const roherBereich: unknown = kontext.arbeitsbereich
    if (typeof roherBereich !== 'string' || roherBereich.trim() === '') {
      return fehler(
        'ungueltige_eingabe',
        `${bezug.text}: Der Arbeitsbereich (T1) fehlt oder ist leer. ` +
          'Er wird von #172 angelegt und hereingereicht; diese Datei legt ihn nicht an.',
      )
    }
    arbeitsbereich = roherBereich

    // Der Index bildet den Dateinamen. Ein `NaN` oder ein negativer Wert erzeugte
    // `seg_NaN.mp4` bzw. `seg_00-1.mp4` - eine Datei, die der concat-Schritt (#169)
    // spaeter unter einem anderen Namen sucht. Das ist KEINE Wiederholung der
    // Validierung aus #173: Der Index ist ein Parameter DIESER Funktion und steht in
    // keinem `RenderRequest`.
    const roherIndex: unknown = index
    if (typeof roherIndex !== 'number' || !Number.isInteger(roherIndex) || roherIndex < 0) {
      return fehler(
        'ungueltige_eingabe',
        `${bezug.text}: Der Listenindex muss eine ganze Zahl ab 0 sein, vorgefunden: ${String(roherIndex)}.`,
      )
    }

    const zielPfad = path.join(arbeitsbereich, zwischenclipDateiname(index))
    const art = feld(element, 'art')

    switch (art) {
      case 'segment':
        return await ausSegment(element, pngs, zielPfad, bezug, kontext)
      case 'video':
        return await ausVideo(element, index, pngs, zielPfad, bezug, kontext)
      default:
        // TK 9.2.3 nennt "unbekannte `art`" ausdruecklich bei `ungueltige_eingabe`.
        // KEIN `daten`: Die Regel bindet `daten` an genau zwei Codes.
        return fehler(
          'ungueltige_eingabe',
          `${bezug.text}: Unbekannte Elementart ${JSON.stringify(art)}. ` +
            'Zulaessig sind ausschliesslich "video" und "segment".',
        )
    }
  } catch (ursache) {
    return ausAusnahme(ursache, bezug.text, arbeitsbereich)
  }
}

// ===========================================================================
// Die vier Faelle der Weiche
// ===========================================================================

/** Fall 1: `art === 'segment'` - die Pixel liegen als PNG in T1 (#175). */
async function ausSegment(
  element: RenderItem,
  pngs: ElementPngs,
  zielPfad: string,
  bezug: Elementbezug,
  kontext: NormalisierKontext,
): Promise<Ergebnis<string, RenderFehlercode>> {
  // SAFETY: pngs reist ueber die IPC-Grenze und kann null sein; der Cast erweitert den
  // Typ, und der unmittelbar folgende typeof-Check prueft diese Invariante zur Laufzeit.
  const segmentPfad = (pngs as ElementPngs | null | undefined)?.segment
  if (typeof segmentPfad !== 'string' || segmentPfad === '') {
    return fehler(
      'ungueltiges_element',
      `${bezug.text}: Zu einem "segment"-Element gehoert ein Segment-PNG in T1, ` +
        `vorgefunden: ${String(segmentPfad)}.`,
      bezug.daten,
    )
  }
  return await ausStandbild(element, segmentPfad, zielPfad, bezug, kontext)
}

/**
 * Der Standbild-Rumpf von Fall 1.
 *
 * "Standbild -> Clip: `"segment"`-Items werden als Standbild ueber ihre `dauer` bei
 * 30 fps im Profil ausgehalten; harter Schnitt an den Grenzen." (TK 9.2.6, sinngemaess
 * nach der Streichung der Elementart `bild`, TK 9.11.3) Ein Segment traegt KEIN Band:
 * "Parallele Baender gibt es nur bei `"video"`-Items." (TK 9.2.8) - deshalb immer die
 * Vollbild-Kette mit schwarzem Hintergrund.
 */
async function ausStandbild(
  element: RenderItem,
  bildPfad: string,
  zielPfad: string,
  bezug: Elementbezug,
  kontext: NormalisierKontext,
): Promise<Ergebnis<string, RenderFehlercode>> {
  const frames = frameDauer(element)
  if (!frames.ok) return uebernimm(frames.fehler, bezug)

  // Reihenfolge der Argumente wie GEBAUT (#163): (hintergrund, profil). Das
  // Issue-Zitat dreht sie um - s. Befund B1 im Kopf.
  const kette = baueVollbildFilter(HINTERGRUND, kontext.profil)
  if (!kette.ok) return uebernimm(kette.fehler, bezug)

  const argumente = baueStandbildArgumente(
    { bildPfad, frames: frames.wert, filterkette: kette.wert, zielPfad },
    kontext.profil,
  )
  if (!argumente.ok) return uebernimm(argumente.fehler, bezug)

  // Das Array wird UNVERAENDERT weitergereicht - kein Anhaengen, kein Entfernen,
  // kein Umsortieren. Es ist die einzige Quelle fuer das Ausgabe-Profil.
  const lauf = await starteFfmpeg(argumente.wert, kontext, frames.wert)
  if (!lauf.ok) return ausFfmpeg(lauf.fehler, bezug)

  return { ok: true, wert: zielPfad }
}

/**
 * Faelle 2, 3 und 4: `art === 'video'`.
 *
 * VERBINDLICHE REIHENFOLGE (Issue #177): `trimFrames` (#174) ->
 * `bestimmeBandgeometrie` (#176, nur mit Band) -> `baueBandspur` (#168, nur mit Band)
 * -> Filterkette -> `baueVideoAusschnittArgumente` (#167) -> `fuehreFfmpegAus` (#158).
 *
 * Die Pfad-Aufloesung steht in dieser Aufzaehlung nicht; sie ist hier VOR die
 * Geometrie gezogen, weil sie kein ffmpeg braucht und ein fehlendes Medium sonst
 * erst NACH dem Bandspur-Lauf auffiele - "Geprueft vor dem ersten `ffmpeg`-Aufruf,
 * nicht mitten im Lauf" (TK 9.2.3). Die relative Ordnung der genannten Schritte
 * bleibt unangetastet.
 */
async function ausVideo(
  element: RenderItem,
  index: number,
  pngs: ElementPngs,
  zielPfad: string,
  bezug: Elementbezug,
  kontext: NormalisierKontext,
): Promise<Ergebnis<string, RenderFehlercode>> {
  // 1. Trim. Zwei EINZELNE Rundungen auf dasselbe 30-fps-Raster macht #174; hier
  //    wird keine zweite Rundungsregel erfunden.
  // SAFETY: trimStart/trimEnde wurden in der Validierung (pruefeRenderRequest) als
  // endliche Zahlen geprueft; feld() liefert unknown, der Cast benennt diese belegte Form.
  const grenzen = trimFrames(feld(element, 'trimStart') as number, feld(element, 'trimEnde') as number)
  if (!grenzen.ok) return uebernimm(grenzen.fehler, bezug)
  const { startFrame, endFrame, frames } = grenzen.wert

  // 2. Pfad-Autoritaet + physische Pruefung.
  const quelle = await loeseUndPruefeMedium(kontext.projektId, feld(element, 'medienRef'), bezug)
  if (!quelle.ok) return quelle

  const einblendung = feld(element, 'einblendung')

  // Fall 3 - ohne Band: "Ohne Band bleibt die Verarbeitung unveraendert: Video
  // vollflaechig 1920 x 1080 mit SCHWARZEN Balken nach 9.2.4." (TK 9.2.8)
  if (einblendung === null || einblendung === undefined) {
    const kette = baueVollbildFilter(HINTERGRUND, kontext.profil)
    if (!kette.ok) return uebernimm(kette.fehler, bezug)
    return await schreibeVideoclip(
      { quellPfad: quelle.wert, startFrame, endFrame, bandSpurPfad: null, filterkette: kette.wert, zielPfad },
      frames,
      bezug,
      kontext,
    )
  }

  // 3. Geometrie - fuer BEIDE Bandarten. Sie ist zugleich der Torwaechter ueber die
  //    Bandhoehe (ganzzahlig, gerade, 0 < H < 1080); die reine Rechnung liegt im
  //    geteilten Bereich und prueft nichts.
  // SAFETY: bestimmeBandgeometrie prueft art/höhe als Torwaechter; der Cast reicht
  // die Form weiter, die Pruefung selbst folgt unmittelbar darunter (Ergebnis-Huelle).
  const geo = bestimmeBandgeometrie(einblendung as { art: Bandart; höhe: number })
  if (!geo.ok) return uebernimm(geo.fehler, bezug)

  // SAFETY: geo.ok ist belegt, also hat bestimmeBandgeometrie art/höhe geprueft; der
  // Cast benennt die damit belegte Form des Einblendungs-Objekts.
  const hoeheBand = feld(einblendung, 'höhe') as number
  const bandart = feld(einblendung, 'art')

  const abschnitte = sammleBandAbschnitte(einblendung, pngs, bezug)
  if (!abschnitte.ok) return abschnitte

  // 4. Bandspur. `gesamtFrames` kommt VOM VIDEO, nicht von den Abschnitten: "Die
  //    Elementdauer bestimmt allein das Video (Trim). Das Band verlaengert oder
  //    verkuerzt sie nie." (TK 9.2.8) - s. aber Befund B3 im Kopf.
  const sequenzPfad = path.join(kontext.arbeitsbereich, `bandseq_${aufStellen(index)}.mp4`)
  const bandSpurPfad = path.join(kontext.arbeitsbereich, `band_${aufStellen(index)}.mp4`)

  const spur = await starteBandspur(
    { abschnitte: abschnitte.wert, hoeheBand, gesamtFrames: frames, sequenzPfad, zielPfad: bandSpurPfad },
    kontext,
    frames,
  )
  if (!spur.ok) return ausFfmpeg(spur.fehler, bezug)

  // 5. Filterkette. Erst JETZT - so verlangt es die verbindliche Reihenfolge.
  const kette =
    bandart === 'split'
      ? baueSplitKette(geo.wert.videoBreite, geo.wert.videoVersatzX, hoeheBand, bezug, kontext)
      : // Art B: Band UEBER dem vollflaechigen Video. Keine Markenfarbe - die
        // Balken bleiben schwarz nach 9.2.4 (#165 setzt sie selbst).
        baueEinblendungFilter(hoeheBand, kontext.profil)
  if (!kette.ok) return uebernimm(kette.fehler, bezug)

  return await schreibeVideoclip(
    { quellPfad: quelle.wert, startFrame, endFrame, bandSpurPfad, filterkette: kette.wert, zielPfad },
    frames,
    bezug,
    kontext,
  )
}

/**
 * Fall 4: Art A - `split`, Band UNTER dem verkleinerten Video.
 *
 * "Bewusste Abweichung vom Ausgabe-Profil - nur hier: 9.2.4 schreibt SCHWARZE Balken
 * vor. In der Split-Komposition werden die Restflaechen IN DER MARKENFARBE gefuellt."
 * (TK 9.2.8) Der Hexwert reist im Kontext ein (beim Einreihen eingefroren); diese
 * Datei schlaegt KEINE Marke nach und tippt keine Hexzahl.
 *
 * Gereicht werden `geo.videoBreite` (die tatsaechlich EINGEPASSTE Breite) und
 * `geo.videoVersatzX`. Die Vierer-Abrundung macht ausschliesslich die geteilte
 * Rechnung - zwei Rundungsstellen liefen unweigerlich auseinander, und der Fehler
 * bliebe bei der eingebauten Vorlage (H = 162) zufaellig unsichtbar.
 */
function baueSplitKette(
  videoBreite: number,
  videoVersatzX: number,
  hoeheBand: number,
  bezug: Elementbezug,
  kontext: NormalisierKontext,
): Ergebnis<string> {
  const farbe = markenFarbeZuFfmpeg(kontext.flaecheDunkel)
  if (!farbe.ok) {
    return {
      ok: false,
      fehler: { code: farbe.fehler.code, meldung: `${bezug.text}: ${farbe.fehler.meldung}` },
    }
  }
  return baueSplitFilter(hoeheBand, videoBreite, videoVersatzX, farbe.wert, kontext.profil)
}

/** Der gemeinsame Schluss der Faelle 3 bis 5: Argumente bauen, ausfuehren, Pfad melden. */
async function schreibeVideoclip(
  auftrag: {
    quellPfad: string
    startFrame: number
    endFrame: number
    bandSpurPfad: string | null
    filterkette: string
    zielPfad: string
  },
  frames: number,
  bezug: Elementbezug,
  kontext: NormalisierKontext,
): Promise<Ergebnis<string, RenderFehlercode>> {
  const argumente = baueVideoAusschnittArgumente(auftrag, kontext.profil)
  if (!argumente.ok) return uebernimm(argumente.fehler, bezug)

  const lauf = await starteFfmpeg(argumente.wert, kontext, frames)
  if (!lauf.ok) return ausFfmpeg(lauf.fehler, bezug)

  return { ok: true, wert: auftrag.zielPfad }
}

/**
 * Die Band-Abschnitte aus Auftrag und PNG-Ablage zusammenfuehren.
 *
 * "Die Abschnittslaengen sind `zuFrames(abschnitt.dauer)` (#174), NICHT Sekunden."
 * Die PNG-Pfade sind index-parallel zu `einblendung.abschnitte` (#175).
 */
function sammleBandAbschnitte(
  einblendung: unknown,
  pngs: ElementPngs,
  bezug: Elementbezug,
): Ergebnis<BandAbschnitt[], RenderFehlercode> {
  const abschnitte = feld(einblendung, 'abschnitte')
  if (!Array.isArray(abschnitte) || abschnitte.length === 0) {
    return fehler(
      'ungueltiges_element',
      `${bezug.text}: Die Einblendung hat keine Abschnitte; ein Band ohne Abschnitte hat nichts zu zeigen.`,
      bezug.daten,
    )
  }

  // SAFETY: pngs reist ueber die IPC-Grenze und kann null sein; der Cast erweitert den
  // Typ, und der unmittelbar folgende Array.isArray-Check prueft die Invariante.
  const bandPngs = (pngs as ElementPngs | null | undefined)?.band
  if (!Array.isArray(bandPngs) || bandPngs.length < abschnitte.length) {
    return fehler(
      'ungueltiges_element',
      `${bezug.text}: Zu ${String(abschnitte.length)} Band-Abschnitten liegen nur ` +
        `${String(Array.isArray(bandPngs) ? bandPngs.length : 0)} PNG-Pfade in T1 vor.`,
      bezug.daten,
    )
  }

  const gesammelt: BandAbschnitt[] = []
  for (const [i, abschnitt] of abschnitte.entries()) {
    const pngPfad = bandPngs[i]
    if (typeof pngPfad !== 'string' || pngPfad === '') {
      return fehler(
        'ungueltiges_element',
        `${bezug.text}: Der PNG-Pfad des Band-Abschnitts ${String(i)} fehlt.`,
        bezug.daten,
      )
    }
    // `zuFrames` prueft nicht und traegt keine Huelle (#174, ENTSCHIEDEN 4). Eine
    // unbrauchbare Dauer ergibt `NaN` - und wird von #168 als `ungueltige_eingabe`
    // abgewiesen. Eine zweite Pruefung hier waere eine zweite Wahrheit.
    // SAFETY: eine unbrauchbare dauer wird bewusst NICHT hier abgewiesen, sondern
    // ergibt NaN und faellt bei #168; der Cast benennt die erwartete Zahlenform.
    gesammelt.push({ pngPfad, frames: zuFrames(feld(abschnitt, 'dauer') as number) })
  }

  return { ok: true, wert: gesammelt }
}

// ===========================================================================
// Prozess-Anbindung: Abbruch-Kette und Fortschritt
// ===========================================================================

/**
 * Baut die drei Rueckruf-Felder, die an JEDEN ffmpeg-Aufruf gehoeren - auch an die,
 * die diese Datei nicht selbst startet (#168 startet zwei).
 *
 * DIE ABBRUCH-KETTE: Ohne `abbruchSignal` waere der Abbrechen-Knopf waehrend des
 * laengsten Schritts wirkungslos; ohne `aufProzessStart` bekaeme der Abbrecher (#159)
 * das Prozess-Handle nie zu sehen, `beendeLaufendenProzess()` haette nichts zu
 * beenden, und der Nutzer koennte einen 40-Minuten-Lauf nicht stoppen.
 *
 * WARUM DER RUECKRUF EINE HUELLE IST und nicht `kontext.merkeProzess` selbst: s.
 * Befund B5 im Kopf. Die Huelle tut zwei Dinge und sonst nichts - sie meldet einen
 * VORGAENGER ab, bevor sie den neuen anmeldet (#159 haelt genau EIN Handle und
 * protokolliert sonst eine verletzte serielle Zusage), und sie merkt sich das Handle,
 * damit `freigeben()` es spaeter mit DEMSELBEN Wert zurueckgeben kann.
 */
function erzeugeBegleiter(
  kontext: NormalisierKontext,
  sollDauerSekunden: number,
): {
  lauf: Pick<FfmpegLauf, 'aufAusgabeZeile' | 'aufProzessStart' | 'abbruchSignal'>
  freigeben: () => void
} {
  const leser = erzeugeFortschrittsLeser(sollDauerSekunden)

  // Ein Halter statt einer freien Variablen: Der Wert entsteht in einem Rueckruf,
  // und nur so bleibt er im `finally` als `ChildProcess | null` sichtbar.
  const spur: { laufend: ChildProcess | null } = { laufend: null }

  const freigeben = (): void => {
    const kind = spur.laufend
    if (kind === null) return
    spur.laufend = null
    kontext.gibProzessFrei(kind)
  }

  return {
    lauf: {
      // IDENTISCH durchgereicht - dieselbe Abbruch-Quelle wie `istAbgebrochen()`
      // (#179). Diese Datei fragt das Signal NICHT selbst ab und legt kein zweites
      // Flag an; den Abbruch entscheidet #179, den Ausgang #181.
      abbruchSignal: kontext.abbruchSignal,

      aufProzessStart: (kindProzess: ChildProcess): void => {
        freigeben()
        spur.laufend = kindProzess
        kontext.merkeProzess(kindProzess)
      },

      // HIER WIRD GETEILT. `nimmZeile` liefert 0..100, `aufElementFortschritt` will
      // 0..1 - s. den Einheiten-Bruch im Kopf. Gedrosselt wird NICHT hier: das tut
      // #160, und die zweite Drosselung sitzt im Sender (#178).
      aufAusgabeZeile: (zeile: string): void => {
        const prozent = leser.nimmZeile(zeile, Date.now())
        if (prozent === null) return
        kontext.aufElementFortschritt(prozent / VOLLE_PROZENT)
      },
    },
    freigeben,
  }
}

/**
 * Fuehrt EIN fertiges Argument-Array aus. Das Array wird unveraendert gereicht; das
 * Flag, das ffmpeg die Fortschrittszeilen ueberhaupt schreiben laesst
 * (`-progress pipe:1 -nostats`), kommt aus dem festen Vorspann in #158 und wird hier
 * NICHT ergaenzt. Kommt aus einem Lauf keine Fortschrittszeile an, ist das ein Befund
 * zum Melden, kein Anlass fuer ein zusaetzliches Argument.
 */
async function starteFfmpeg(
  argumente: readonly string[],
  kontext: NormalisierKontext,
  frames: number,
): Promise<Ergebnis<void, FfmpegFehlercode>> {
  const begleiter = erzeugeBegleiter(kontext, sollDauerSekunden(frames, kontext.profil))
  try {
    return await fuehreFfmpegAus({ argumente, ...begleiter.lauf })
  } finally {
    // Auch im Fehlerfall - sonst bliebe ein totes Handle beim Abbrecher liegen und
    // der naechste `merkeProzess` meldete eine verletzte serielle Zusage.
    begleiter.freigeben()
  }
}

/**
 * Startet die Bandspur (#168) - mit DREI Argumenten. Das dritte ist in der Signatur
 * optional, hier aber Pflicht: #168 startet ZWEI ffmpeg-Prozesse und reicht den
 * Parameter an beide durch; ohne ihn liefen beide ausserhalb der Abbruch-Kette.
 */
async function starteBandspur(
  auftrag: {
    abschnitte: BandAbschnitt[]
    hoeheBand: number
    gesamtFrames: number
    sequenzPfad: string
    zielPfad: string
  },
  kontext: NormalisierKontext,
  frames: number,
): Promise<Ergebnis<void, FfmpegFehlercode>> {
  const begleiter = erzeugeBegleiter(kontext, sollDauerSekunden(frames, kontext.profil))
  try {
    return await baueBandspur(auftrag, kontext.profil, begleiter.lauf)
  } finally {
    begleiter.freigeben()
  }
}

/**
 * Die Solldauer EINES Aufrufs in Sekunden: `frames / profil.fps`.
 *
 * Ueber `unknown` gefuehrt, weil das Profil durch den Main reist: Bei einem kaputten
 * `fps` entsteht `NaN`, und der Leser (#160) wird davon stumm - er rechnet dann
 * nicht, statt zu raten. Ein Wurf an dieser Stelle waere eine Ausnahme in einem
 * Auftrag, dessen Zusage danach fuer immer offen bliebe.
 */
function sollDauerSekunden(frames: number, profil: RenderProfile): number {
  // SAFETY: Das Profil reist durch den Main; fps kann fremd sein. Der Cast erweitert
  // nur um null/undefined, und der typeof-Check unten prueft die Zahl zur Laufzeit.
  const fps: unknown = (profil as { fps?: unknown } | null | undefined)?.fps
  return typeof fps === 'number' ? frames / fps : Number.NaN
}

// ===========================================================================
// Medienzugang - ausschliesslich ueber die Pfad-Autoritaet
// ===========================================================================

/**
 * "Die absoluten Pfade der Importe (`medienRef`) loest er ueber die Pfad-Autoritaet
 * `project-store` auf (9.5.7), statt das Layout selbst zu kennen." (TK 9.2.5)
 *
 * Danach die physische Pruefung mit `access` (LESBARKEIT), nicht mit `stat` und
 * Groessenpruefung: Eine Datei der Groesse 0 ist kein fehlendes Medium, sondern ein
 * defekter Stream - dafuer gibt es `ffmpeg_fehler`. Ein Fehlercode je Ursache, sonst
 * zeigt die Oberflaeche dem Nutzer den falschen Reparaturweg an.
 */
async function loeseUndPruefeMedium(
  projektId: string,
  medienRef: unknown,
  bezug: Elementbezug,
): Promise<Ergebnis<string, RenderFehlercode>> {
  if (typeof medienRef !== 'string' || medienRef === '') {
    return fehler(
      'ungueltige_eingabe',
      `${bezug.text}: Die Medienreferenz fehlt oder ist leer, vorgefunden: ${String(medienRef)}.`,
    )
  }

  const aufgeloest = loeseAssetPfad(projektId, medienRef)
  if (!aufgeloest.ok) {
    // Traversal oder ungueltiger Name: `ungueltige_eingabe`, KEIN `daten` - die ID
    // steht in der Meldung.
    return {
      ok: false,
      fehler: { code: aufgeloest.fehler.code, meldung: `${bezug.text}: ${aufgeloest.fehler.meldung}` },
    }
  }

  if (!(await istLesbar(aufgeloest.wert))) {
    return fehler(
      'medium_fehlt',
      `${bezug.text}: Das Medium "${medienRef}" liegt nicht (mehr) im Medienordner des Projekts ` +
        'oder ist nicht lesbar.',
      bezug.daten,
    )
  }

  return { ok: true, wert: aufgeloest.wert }
}

/** Lesbarkeit einer Datei. Wirft nie - jede Ursache bedeutet hier "nicht lesbar". */
async function istLesbar(pfad: string): Promise<boolean> {
  try {
    await access(pfad, constants.R_OK)
    return true
  } catch {
    return false
  }
}

// ===========================================================================
// Fehlerausgaenge - ein geschlossener Satz, keine freie Zeichenkette
// ===========================================================================

/**
 * Der einzige Fehlerausgang dieser Datei.
 *
 * `daten` wird AUSSCHLIESSLICH bei `medium_fehlt` und `ungueltiges_element` gesetzt -
 * auch dann, wenn der Aufrufer es mitgibt. Die Regel steht an EINER Stelle, damit sie
 * nicht an der Aufmerksamkeit der zwoelf Aufrufstellen haengt.
 */
function fehler<T>(
  code: Fehlercode,
  meldung: string,
  daten?: ElementFehlerdaten,
): Ergebnis<T, RenderFehlercode> {
  if (daten !== undefined && CODES_MIT_DATEN.includes(code)) {
    return { ok: false, fehler: { code, meldung, daten } }
  }
  return { ok: false, fehler: { code, meldung } }
}

/**
 * Uebernimmt den Fehler eines fremden Bausteins: Der CODE bleibt unveraendert, die
 * Meldung bekommt den Elementbezug vorangestellt (die ID muss bei JEDEM Code im Text
 * stehen), und `daten` entsteht nur bei den beiden dafuer vorgesehenen Codes.
 */
function uebernimm<T>(
  fremd: { code: Fehlercode; meldung: string },
  bezug: Elementbezug,
): Ergebnis<T, RenderFehlercode> {
  return fehler<T>(fremd.code, `${bezug.text}: ${fremd.meldung}`, bezug.daten)
}

/**
 * Bildet den Fehlercode-Satz des `ffmpeg-adapter` auf den des `render-service` ab.
 *
 * `ffmpeg_abgebrochen` -> `ffmpeg_fehler`: `RenderFehlercode` (#171) kennt den Code
 * nicht, und der Satz ist geschlossen - erfunden wird hier nichts. Der RICHTIGE
 * Ausgang eines abgebrochenen Laufs entsteht ohnehin nicht hier: `renderReel` (#181)
 * fragt vor der Auswertung `istAbgebrochen()` und waehlt dann
 * `RenderResult { status: 'abgebrochen' }`. Diese Abbildung ist nur der Rueckfallweg.
 *
 * KEIN `daten` - auch nicht bei bekannter Element-ID; sie reist in der Meldung.
 */
function ausFfmpeg<T>(
  fremd: { code: FfmpegFehlercode | GenerischerFehlercode; meldung: string },
  bezug: Elementbezug,
): Ergebnis<T, RenderFehlercode> {
  if (fremd.code === 'ffmpeg_abgebrochen') {
    return fehler(
      'ffmpeg_fehler',
      `${bezug.text}: Der ffmpeg-Lauf wurde abgebrochen. ${fremd.meldung}`,
    )
  }
  // `ffmpeg_fehler` bleibt zeichengleich; die drei generischen Codes gehen
  // unveraendert durch. Die Meldung des Adapters wird uebernommen, kein Stacktrace.
  return fehler(fremd.code, `${bezug.text}: ${fremd.meldung}`)
}

/**
 * Die errno-Abbildung dieses Moduls - Wort fuer Wort dieselbe wie in #172, #175
 * und #180.
 */
function ausAusnahme<T>(
  ursache: unknown,
  bezugstext: string,
  arbeitsbereich: string,
): Ergebnis<T, RenderFehlercode> {
  const code = systemCode(ursache)
  const ort = arbeitsbereich === '' ? 'dem Arbeitsbereich (T1)' : `"${arbeitsbereich}"`

  if (code === '') {
    // Keine Systemfehler-Kennung - also keine Aussage der Platte, sondern etwas
    // Unerwartetes. "Eine rohe Exception-Meldung wird nie zum Code" (TK 9.1.1):
    // Der Text reist als Begruendung mit, ohne Stacktrace.
    return fehler('unbekannter_fehler', `${bezugstext} ist unerwartet gescheitert. Grund: ${textVon(ursache)}`)
  }

  if (code === 'ENOSPC') {
    return fehler(
      'kein_platz',
      `${bezugstext}: In ${ort} ist kein Platz mehr fuer den Zwischenclip (ENOSPC). ` +
        'Bitte Platz auf der Systemplatte schaffen und den Render wiederholen.',
    )
  }

  return fehler(
    'speicher_fehler',
    `${bezugstext}: Der Zwischenclip liess sich in ${ort} nicht ablegen (${code}). ` +
      'Bitte die Schreibrechte pruefen und den Render wiederholen.',
  )
}

// ===========================================================================
// Kleinwerkzeug
// ===========================================================================

/** Ein Index als Zeichenkette, links mit Nullen auf NAMENS_STELLEN aufgefuellt. */
function aufStellen(index: number): string {
  return String(index).padStart(NAMENS_STELLEN, '0')
}

/**
 * Ein Feld eines Objekts, das ueber die IPC-Grenze kam.
 *
 * "Der Main validiert jede eingehende Nutzlast - er vertraut dem Renderer nicht."
 * (TK 9.1.1 Punkt 6) Der statische Typ ist dort geloescht und nur noch eine Zusage.
 */
function feld(objekt: unknown, name: string): unknown {
  if (objekt === null || objekt === undefined || typeof objekt !== 'object') return undefined
  // SAFETY: die Zeile davor hat objekt als nicht-null Objekt belegt; der Cast macht
  // die fuer den Feldzugriff noetige Index-Form sichtbar, ohne den Werten zu glauben.
  return (objekt as Record<string, unknown>)[name]
}

/**
 * Der Elementbezug fuer alle Meldungen dieses Aufrufs.
 *
 * Eine fehlende ID ist KEIN eigener Fehlerfall - die Fehlerpfade des Issues kennen
 * keinen, und ein zusaetzlicher wuerde die eigentliche Ursache verdecken.
 * `String(...)` liefert dann "undefined": eine wahrheitsgemaesse Angabe, die den Typ
 * `ElementFehlerdaten` einhaelt. (Dieselbe Regel wie in #174.)
 */
function bilde(element: unknown, index: number): Elementbezug {
  const roh = feld(element, 'id')
  const id = typeof roh === 'string' ? roh : String(roh)
  return { text: `Element ${id} (Index ${String(index)})`, daten: { elementId: id } }
}

/** Die Systemfehler-Kennung (`ENOSPC`, `EACCES`, …) oder der leere Text. */
function systemCode(ursache: unknown): string {
  const code = feld(ursache, 'code')
  return typeof code === 'string' ? code : ''
}

/** Die Meldung einer Ausnahme - ohne Stacktrace. */
function textVon(ursache: unknown): string {
  const meldung = feld(ursache, 'message')
  return typeof meldung === 'string' && meldung !== '' ? meldung : String(ursache)
}
