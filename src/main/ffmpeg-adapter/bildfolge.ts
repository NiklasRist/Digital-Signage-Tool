// [ffmpeg-adapter] Bildfolge aus dem Bildplan bauen – bildgenau, ohne ffmpeg-Bewegung
//
// ============================================================================
// WARUM ES DIESE DATEI GIBT (TK 9.16.5, FA-25, 09.11.2026)
// ============================================================================
// Ein Segment MIT Effekten kommt nicht mehr als EIN PNG an, sondern als
// `SegmentBildplan` (#464): die EINDEUTIGEN Frames plus die Laeufe, die sagen, wie sie
// abgespielt werden. Der Main rechnet KEINE Bewegung – er bekommt fertige Pixel und
// muss sie nur in der richtigen Reihenfolge und Anzahl abspielen (TK 9.1, Variante A).
//
// DIE EINE ZUSAGE DIESER DATEI: Die fertige Datei hat EXAKT `gesamtFrames` Bilder –
// nicht 299, nicht 301. "Die Bildzahl ist die Dauer. Geschrieben wird auf die Summe
// aus 9.16.4 fest; es gibt keine Toleranz (9.2.6)." (TK 9.16.5)
//
// ---------------------------------------------------------------------------
// DER WEG, UND WARUM ER SO AUSSIEHT (gemessen, nicht behauptet)
// ---------------------------------------------------------------------------
// Je PNG-Eingang: `-framerate <fps> -i <png>`. Ohne `-loop 1` – ein Standbild liefert
// genau EIN Frame, und genau das ist hier gewollt. (Der Standbild-Weg #166 braucht
// `-loop 1`, weil er EIN Bild ueber die ganze Dauer haelt; hier kommen die Bilder aus
// dem Plan.)
//
// Filtergraph je Lauf:
//   * je Frame  `trim=end_frame=1,setpts=PTS-STARTPTS,format=…,setsar=1`
//   * `concat`  die Frames des Laufs zu EINEM Strom
//   * `loop`    wiederholt den Lauf `wiederholungen − 1`-mal
// Der `concat`-FILTER ist hier NICHT der Weg, mehrere Einzelbilder zu verketten: Ein
// Abschnitt aus EINEM Frame hat nach `setpts=PTS-STARTPTS` die Dauer 0, und `concat`
// behandelt ihn dann als leeren Abschnitt – gemessen am 09.11.2026: drei Einzelbilder
// ergaben drei Bilder auf demselben Zeitstempel, der Encoder verwarf zwei. Deshalb
// steht am ENDE jeder Kette `setpts=N/FRAME_RATE/TB`: Es vergibt jedem Bild seinen
// eigenen, aufsteigenden Zeitstempel aus seiner Nummer. GEMESSEN mit dieser Datei
// (tests/integration/bildfolge-echt.spec.ts, 60 Frames × 5 = 300): 300 Bilder,
// 10,000 s. GEGENPROBE ohne das letzte `setpts`: 243 statt 300 Bilder – der Encoder
// verwarf 57. Genau diese Zeile traegt die Bildzahl.
//
// `loop` kopiert den Lauf im FILTERGRAPHEN. Das kostet Speicher in Hoehe EINES Laufs
// (hoechstens 180 Frames, TK 9.16.7) – nicht in Hoehe der Segmentdauer. Der Weg ueber
// eine Zwischendatei wie bei der Bandspur (#168) waere hier teurer: Er muesste einen
// zweiten ffmpeg-Lauf und eine zweite Datei in T1 bezahlen, fuer eine Folge, die
// bereits vollstaendig im Speicher liegt.
//
// ---------------------------------------------------------------------------
// WAS DIESE DATEI NICHT TUT
// ---------------------------------------------------------------------------
// Kein `zoompan`, kein Filter-Ausdruck fuer Bewegung (TK 9.16.5). Die Bewegung steckt
// in den Pixeln; hier wird nur abgespielt. Keine Zeitrechnung in Sekunden, keine
// Rundung – `gesamtFrames` kommt fertig herein, und die Laengen der Laeufe entstehen
// aus der Anzahl ihrer Pfade, nicht aus einer zweiten Umrechnung.
//
// DIESE DATEI IST REIN: kein Dateizugriff, kein `fs`, kein ffprobe, keine
// Pfadaufloesung, kein Zufall, kein Datum. Sie startet keinen Prozess – der Aufrufer
// (`render-service`, #177) fuehrt das Array ueber `fuehreFfmpegAus` (#158) aus. Sie
// wirft NIE (TK 9.1.1).

import { baueVideoKodierArgumente } from './encoder-argumente'
import {
  baueStilleTonspurEingang,
  baueTonspurKodierArgumente,
  baueTonspurMapping,
} from './tonspur'

import type { RenderProfile } from '../../shared/contracts/render-profile'
import type { Ergebnis } from '../../shared/contracts/ergebnis'

/** Ein Lauf: seine Frames in Abspielreihenfolge, `wiederholungen`-mal gespielt. */
export interface BildfolgeLauf {
  /** absolute Pfade der Frames in T1, in Abspielreihenfolge – bereits abgelegt (#175) */
  pngPfade: string[]
  /** wie oft dieser Lauf gespielt wird, GANZZAHLIG und mindestens 1 */
  wiederholungen: number
}

export interface BildfolgeAuftrag {
  /** die Laeufe in Abspielreihenfolge, mindestens einer */
  laeufe: BildfolgeLauf[]
  /** Gesamtlaenge in Frames = Summe `anzahl × wiederholungen`, GANZZAHLIG.
   *  Diese Datei leitet sie NICHT ab – sie prueft, dass beide Zahlen uebereinstimmen. */
  gesamtFrames: number
  /** absoluter Zielpfad des Zwischenclips in T1 */
  zielPfad: string
}

/**
 * Das Ausgabelabel der Filterkette. Der Aufrufer mappt es.
 * Dieselbe Konvention wie in #163/#166: `[v]` ist das Ergebnis.
 */
const AUSGABE_LABEL = '[v]'

/**
 * Baut das vollstaendige Argument-Array fuer EINEN ffmpeg-Aufruf – ohne Binärpfad und
 * ohne den festen Vorspann, den #158 voranstellt.
 */
export function baueBildfolgeArgumente(
  auftrag: BildfolgeAuftrag,
  profil: RenderProfile,
): Ergebnis<string[]> {
  const geprueft = pruefeEingang(auftrag, profil)
  if (!geprueft.ok) return geprueft

  const { laeufe, gesamtFrames, zielPfad, fps, pixelformat, container } = geprueft.wert
  const r = String(fps)

  const argumente: string[] = []
  const ketten: string[] = []
  const laufLabels: string[] = []
  let eingang = 0

  for (const [laufIndex, lauf] of laeufe.entries()) {
    const anzahl = lauf.pngPfade.length
    const labels: string[] = []

    // Je PNG EIN Eingang und EIN Zweig. `-framerate` ist eine EINGANGS-Option – sie
    // gilt fuer den `-i`, der ihr folgt, und steht deshalb in derselben Schleife wie
    // er. Dieselbe Positionsfalle wie in #166/#168.
    for (const pngPfad of lauf.pngPfade) {
      argumente.push('-framerate', r, '-i', pngPfad)
      const label = `[b${String(eingang)}]`
      // `trim=end_frame=1`: Ein PNG traegt genau ein Bild. Der Ausdruck haelt das
      // auch dann fest, wenn ein Eingang wider Erwarten mehrere Bilder liefert –
      // sonst verschöbe sich die Bildzahl, und die Dauer waere nicht mehr exakt.
      ketten.push(
        `[${String(eingang)}:v]trim=end_frame=1,` +
          `setpts=PTS-STARTPTS,` +
          `format=${pixelformat},` +
          `setsar=1${label}`,
      )
      labels.push(label)
      eingang += 1
    }

    const zusammen = `${labels.join('')}concat=n=${String(anzahl)}:v=1:a=0`
    const wiederholungen = lauf.wiederholungen
    const laufLabel = `[r${String(laufIndex)}]`
    if (wiederholungen === 1) {
      ketten.push(`${zusammen}${laufLabel}`)
    } else {
      // `loop` zaehlt die ZUSATZ-Wiederholungen: loop=loop=W−1 spielt den Lauf W-mal.
      // `size` ist die Laenge des Laufs in Bildern; mehr muss nicht gehalten werden.
      ketten.push(
        `${zusammen},loop=loop=${String(wiederholungen - 1)}:size=${String(anzahl)}:start=0` +
          `${laufLabel}`,
      )
    }
    laufLabels.push(laufLabel)
  }

  // Das abschliessende `setpts` ist KEIN Schmuck: Die `concat`-Glieder der ersten Stufe
  // tragen Einzelbilder, deren Dauer der Filter als 0 liest; ohne die Neunummerierung
  // landen mehrere Bilder auf demselben Zeitstempel, und der Encoder verwirft sie
  // (gemessen, s. Kopf). Es vergibt jedem Bild genau einen Zeitstempel im Raster der
  // Bildrate – die Bildzahl bleibt dabei unveraendert.
  ketten.push(
    `${laufLabels.join('')}concat=n=${String(laeufe.length)}:v=1:a=0,` +
      `setpts=N/FRAME_RATE/TB,` +
      `format=${pixelformat},setsar=1${AUSGABE_LABEL}`,
  )

  const audioEingang = eingang
  argumente.push(
    // "Gehoert an JEDEN Normalisierungslauf (Zwischenclip)" (#162): Ohne die stille
    // Spur haette dieser Clip ein anderes Streamlayout als alle anderen, und
    // `concat -c copy` braeche daran NICHT ab – die fertige Datei verlore mitten im
    // Video den Ton (gemessen in #162).
    ...baueStilleTonspurEingang(profil),

    // EIN Argument, ohne umschliessende Anfuehrungszeichen – sie waeren Bestandteil
    // des Filterausdrucks.
    '-filter_complex',
    ketten.join(';'),

    '-map',
    AUSGABE_LABEL,
    ...baueTonspurMapping(audioEingang),

    // DIE LAENGE IN BILDERN. Dieselbe Zusage wie #166: `-frames:v` zaehlt
    // Ausgabebilder und haengt an keiner Fliesskomma-Umrechnung.
    '-frames:v',
    String(gesamtFrames),

    // Die vier Fragmente aus #161/#162 unveraendert und vollstaendig.
    ...baueVideoKodierArgumente(profil),
    ...baueTonspurKodierArgumente(profil),

    '-map_metadata',
    '-1',

    // Das Ausgabeformat aus dem Profil – wie in #166/#167, damit die Zwischenclips
    // untereinander uniform bleiben.
    '-f',
    container,

    zielPfad,
  )

  return { ok: true, wert: argumente }
}

/** Der geprüfte Eingang – ab hier steht fest, dass jeder Wert die Form hat, die er haben soll. */
interface GepruefterEingang {
  laeufe: readonly BildfolgeLauf[]
  gesamtFrames: number
  zielPfad: string
  fps: number
  pixelformat: string
  container: string
}

/**
 * Prueft ALLE Parameter, bevor ein einziges Argument gebildet wird.
 *
 * Der Auftrag reist durch den Main und stammt mittelbar aus dem Renderer; ein
 * `undefined` an dieser Stelle waere eine Ausnahme in einem Auftrag, dessen Zusage
 * danach fuer immer offen bliebe – "Niemals `throw`" ist Vertrag (TK 9.1.1).
 */
function pruefeEingang(
  auftrag: BildfolgeAuftrag,
  profil: RenderProfile,
): Ergebnis<GepruefterEingang> {
  // SAFETY: der Cast erweitert nur um null/undefined und macht die Felder als unknown
  // sichtbar; die Form wird unmittelbar darunter geprueft (Ergebnis-Huelle statt Wurf).
  const rohesProfil = profil as
    | { fps?: unknown; pixelformat?: unknown; container?: unknown }
    | null
    | undefined
  if (rohesProfil === null || rohesProfil === undefined) {
    return ungueltig('Es wurde kein Ausgabe-Profil uebergeben.')
  }

  const fps = alsGanzzahlUeberNull('profil.fps', rohesProfil.fps)
  if (!fps.ok) return fps

  // Beide Werte stehen im FILTERGRAPH bzw. in `-f`; ein fuehrender Bindestrich waere
  // Argument-Einschleusung, ein Trenner im Filtergraph koennte den Graphen erweitern.
  const pixelformat = alsFormatname('profil.pixelformat', rohesProfil.pixelformat)
  if (!pixelformat.ok) return pixelformat
  const container = alsFormatname('profil.container', rohesProfil.container)
  if (!container.ok) return container

  // SAFETY: der Cast erweitert nur um null/undefined; die Pruefung der Form folgt
  // unmittelbar darunter (null/undefined-Check, Ergebnis-Huelle statt Wurf).
  const roherAuftrag = auftrag as Partial<BildfolgeAuftrag> | null | undefined
  if (roherAuftrag === null || roherAuftrag === undefined) {
    return ungueltig('Es wurde kein Bildfolge-Auftrag uebergeben.')
  }

  const laeufe = roherAuftrag.laeufe
  if (!Array.isArray(laeufe) || laeufe.length === 0) {
    return ungueltig(
      'laeufe muss mindestens einen Eintrag haben: Ein Plan ohne Lauf hat nichts abzuspielen.',
    )
  }

  let summe = 0
  for (const [laufIndex, lauf] of laeufe.entries()) {
    // SAFETY: der Cast erweitert nur um null/undefined; die Pruefung folgt unmittelbar.
    const roherLauf = lauf as BildfolgeLauf | null | undefined
    if (roherLauf === null || roherLauf === undefined) {
      return ungueltig(`laeufe[${String(laufIndex)}] fehlt.`)
    }

    const pngPfade = roherLauf.pngPfade
    if (!Array.isArray(pngPfade) || pngPfade.length === 0) {
      return ungueltig(
        `laeufe[${String(laufIndex)}].pngPfade muss mindestens ein Frame sein – ein Lauf ` +
          'ohne Bild zeigt nichts.',
      )
    }

    for (const [bildIndex, pngPfad] of pngPfade.entries()) {
      const pfadFehler = pruefePfad(
        `laeufe[${String(laufIndex)}].pngPfade[${String(bildIndex)}]`,
        pngPfad,
      )
      if (pfadFehler !== null) return ungueltig(pfadFehler)
    }

    const wiederholungen = alsGanzzahlUeberNull(
      `laeufe[${String(laufIndex)}].wiederholungen`,
      roherLauf.wiederholungen,
    )
    if (!wiederholungen.ok) return wiederholungen

    summe += pngPfade.length * wiederholungen.wert
  }

  const gesamtFrames = alsGanzzahlUeberNull('gesamtFrames', roherAuftrag.gesamtFrames)
  if (!gesamtFrames.ok) return gesamtFrames

  // DIE INVARIANTE, an der die Dauer haengt (TK 9.16.4). Geprueft wird sie AUCH im
  // `render-service` (#464, gegen `dauer × 30`); hier gegen `gesamtFrames`, weil diese
  // Datei genau diese Zahl schreibt. Zwei Zahlen, die auseinanderliegen, ergaeben eine
  // Datei, die nicht das ist, was der Plan sagt – und niemand saehe es.
  if (summe !== gesamtFrames.wert) {
    return ungueltig(
      `Die Laeufe ergeben ${String(summe)} Bilder, gesamtFrames verlangt aber ` +
        `${String(gesamtFrames.wert)}. Die Bildzahl ist die Dauer – hier gibt es keine Toleranz.`,
    )
  }

  const zielFehler = pruefePfad('zielPfad', roherAuftrag.zielPfad)
  if (zielFehler !== null) return ungueltig(zielFehler)

  // SAFETY: pruefePfad hat zielPfad unmittelbar zuvor als nicht leere Zeichenkette
  // bestaetigt (sonst fruehe Rueckgabe); der Cast benennt diese belegte Form.
  const zielPfad = roherAuftrag.zielPfad as string

  // Ein Ziel auf einer Quelle ueberschriebe die einzige Fassung eines Frames: Das
  // Ueberschreib-Flag steht im festen Vorspann (#158), es gaebe nicht einmal eine
  // Rueckfrage. Verglichen wird REIN TEXTLICH – diese Datei loest keine Pfade auf
  // (das ist Sache der Pfad-Autoritaet, TK 9.5.7).
  for (const [laufIndex, lauf] of laeufe.entries()) {
    // SAFETY: die Laeufe wurden oben als BildfolgeLauf geprueft (pngPfade, wiederholungen).
    for (const [bildIndex, pngPfad] of (lauf as BildfolgeLauf).pngPfade.entries()) {
      if (pngPfad === zielPfad) {
        return ungueltig(
          `zielPfad ist gleich laeufe[${String(laufIndex)}].pngPfade[${String(bildIndex)}] – ` +
            'der Lauf ueberschriebe seine eigene Quelle.',
        )
      }
    }
  }

  // SAFETY: die Laeufe sind oben feldweise geprueft (Ergebnis-Huelle statt Wurf); der
  // Cast benennt die damit belegte Form der Rueckgabe.
  return {
    ok: true,
    wert: {
      laeufe: laeufe as readonly BildfolgeLauf[],
      gesamtFrames: gesamtFrames.wert,
      zielPfad,
      fps: fps.wert,
      pixelformat: pixelformat.wert,
      container: container.wert,
    },
  }
}

/**
 * Prueft einen Pfad, der als Argument an ffmpeg geht. Gibt die Meldung zurueck - oder null.
 *
 * EIN FUEHRENDES `-` WIRD ABGEWIESEN und nicht entschaerft: ffmpeg laese den Pfad als
 * OPTION. `\n` und `\0` sind keine Schikane: Ein `\0` beendet in der Win32-API die
 * Zeichenkette still, der Prozess bekaeme einen ANDEREN Pfad als den hier geprueften.
 */
function pruefePfad(feld: string, wert: unknown): string | null {
  if (typeof wert !== 'string' || wert === '') {
    return `${feld} muss ein nicht leerer Pfad sein, vorgefunden: ${beschreibe(wert)}.`
  }
  if (wert.startsWith('-')) {
    return (
      `${feld} beginnt mit einem Bindestrich (${beschreibe(wert)}). ffmpeg laese ihn als ` +
      'Option statt als Datei.'
    )
  }
  if (wert.includes('\n') || wert.includes('\0')) {
    return `${feld} enthaelt ein Zeilenende- oder Nullzeichen: ${beschreibe(wert)}.`
  }
  return null
}

/**
 * Ein Formatname aus dem Profil, wie ihn ffmpeg gefahrlos entgegennimmt.
 *
 * Der Trenner-Check ist hier keine Angst vor einem Angriff aus dem Profil: `pixelformat`
 * steht IM Filtergraphen, und ein Komma darin wuerde einen weiteren Filter aufmachen.
 * Ein solcher Wert waere ein Vertragsfehler – gemeldet, nicht repariert.
 */
function alsFormatname(feld: string, wert: unknown): Ergebnis<string> {
  if (typeof wert !== 'string' || wert === '' || wert.startsWith('-')) {
    return ungueltig(
      `${feld} muss ein nicht leerer Formatname ohne fuehrenden Bindestrich sein, ` +
        `vorgefunden: ${beschreibe(wert)}.`,
    )
  }
  if (/[,;[\]]/.test(wert)) {
    return ungueltig(
      `${feld} enthaelt ein Zeichen, das im Filtergraph trennt: ${beschreibe(wert)}.`,
    )
  }
  return { ok: true, wert }
}

/** Eine ganze, endliche Zahl `> 0`. `isSafeInteger` haelt auch die Summe exakt. */
function alsGanzzahlUeberNull(feld: string, wert: unknown): Ergebnis<number> {
  if (typeof wert !== 'number' || !Number.isSafeInteger(wert)) {
    return ungueltig(
      `${feld} muss eine ganze, endliche Zahl sein, vorgefunden: ${beschreibe(wert)}.`,
    )
  }
  if (wert <= 0) {
    return ungueltig(`${feld} muss groesser als 0 sein, vorgefunden: ${String(wert)}.`)
  }
  return { ok: true, wert }
}

/** Der einzige Fehlerausgang dieser Datei - sie prueft ausschliesslich ihre eigenen Parameter. */
function ungueltig(
  meldung: string,
): { ok: false; fehler: { code: 'ungueltige_eingabe'; meldung: string } } {
  return { ok: false, fehler: { code: 'ungueltige_eingabe', meldung } }
}

/** Einen fremden Wert fuer die Meldung beschreiben, ohne ihn zu deuten. */
function beschreibe(wert: unknown): string {
  return typeof wert === 'string' ? JSON.stringify(wert) : String(wert)
}
