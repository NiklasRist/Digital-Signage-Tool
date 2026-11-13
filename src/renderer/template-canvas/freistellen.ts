// [template-canvas] Freistellen ueber ein mitgeliefertes Modell (13.11.2026, FA-29 / TK 9.21.5)
//
// WAS HIER PASSIERT: Ein Produktfoto bekommt einen transparenten Hintergrund. Gerechnet
// wird LOKAL im Renderer ueber ONNX Runtime Web (WASM) - kein Dienst im Netz (NFA-06),
// keine Bildbytes ueber IPC (9.1.1/9.20.2), kein natives Modul im Paket (9.21.5).
//
// DAS MODELL: U-2-Net, kleine Fassung (`u2netp`), Apache License 2.0.
//   Datei   : public/modell/freistellen.onnx  (wird als `modell://freistellen.onnx` ausgeliefert)
//   Groesse : 4 574 861 Bytes
//   SHA-256 : 309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8
//   Quelle  : github.com/danielgatis/rembg/releases/download/v0.0.0/u2netp.onnx
//   Lizenz  : Apache License 2.0 (U-2-Net, Xuebin Qin) - siehe public/modell/LIZENZ-u2net.txt
// Es ist die KLEINE Fassung, weil der Zaun aus 9.21.5 das Modell waehlt und nicht die
// Zahl biegt: die grosse Fassung (`u2net`, 176 MB) reisst die 25 MB.
//
// WARUM DIE RUNTIME AUS EINEM EIGENEN PROTOKOLL KOMMT: Das gepackte Fenster laedt die
// Seite ueber `file://` (#3). Dort ist `fetch` auf eine relative Datei blockiert - genau
// derselbe Grund, den #474 fuer das Modell nennt. Also derselbe Weg fuer beide Dateien:
// `modell://` (src/main/modell-protokoll.ts).
//
// EIN AUSFALL IST EIN ZUSTAND, KEIN ABSTURZ (9.21.5): fehlt das Modell, laedt es nicht
// oder scheitert die Rechnung, gibt es EINEN Klartext, das Bild bleibt unfreigestellt und
// jede andere Funktion laeuft. `stelleFrei` wirft deshalb nie.
//
// DAS MODELL WIRD NUR EINMAL GELADEN (lazy, beim ersten Schalter-Klick) und ein
// Fehlschlag wird GEMERKT - sonst wartete der Nutzer bei jedem Bild erneut auf denselben
// Fehler.

// `/wasm` UND NICHT DAS STANDARDPAKET: Der Standardeintrag zieht bei vorhandenem WebGPU
// die JSEP-Fassung nach - und die laedt ihren Loader als `modell://…jsep.mjs`, also als
// SKRIPT. Unter der CSP dieser App (`script-src 'self'`) ist das blockiert, und der Grund
// waere im Fenster nur ein 404/„Refused to load the script". GEMESSEN am 13.11.2026:
// Genau das passierte. Die WASM-Fassung laedt nur die eine `.wasm` - die reicht.
import * as ort from 'onnxruntime-web/wasm'

/** Der Klartext, der am Schalter steht (9.21.5). EINE Quelle fuer Editor und Tests. */
export const FREISTELL_KLARTEXT = 'Freistellen ist auf diesem Rechner nicht verfügbar.'

/**
 * Die Kantenlaenge des Modell-Eingangs. `u2netp` ist auf 320 × 320 trainiert - die Zahl
 * gehoert zum GEWAEHLTEN Modell, nicht zum Vertrag. Wird das Modell getauscht, muss sie
 * mit; deshalb steht sie genau einmal hier.
 */
const MODELL_KANTE = 320

/** Die drei Mittelwert-/Streuungswerte, mit denen U-2-Net normalisiert (RGB, /255). */
const MITTELWERT = [0.485, 0.456, 0.406] as const
const STREUUNG = [0.229, 0.224, 0.225] as const

export type FreistellErgebnis =
  | { status: 'ok'; bild: ImageBitmap; breite: number; hoehe: number }
  | { status: 'nicht_verfuegbar'; grund: string }

type ModellZustand = 'unberuehrt' | 'laedt' | 'bereit' | 'ausgefallen'

let zustand: ModellZustand = 'unberuehrt'
let sitzung: ort.InferenceSession | null = null
let ausfallGrund = ''
let ladeLauf: Promise<void> | null = null

/**
 * Ist das Modell geladen? `false` heisst NICHT automatisch „geht nicht" - solange nichts
 * versucht wurde, ist der Zustand `unberuehrt`. Der Editor fragt nach dem ersten Versuch
 * ueber `freistellAusfall()`.
 */
export function istFreistellModellBereit(): boolean {
  return zustand === 'bereit'
}

/** Der Klartext eines gemerkten Ausfalls - `null`, solange keiner vorliegt. */
export function freistellAusfall(): string | null {
  return zustand === 'ausgefallen' ? ausfallGrund : null
}

/** Nur fuer Tests: den gemerkten Zustand vergessen (ein Modell laedt danach erneut). */
export function vergissFreistellModell(): void {
  zustand = 'unberuehrt'
  sitzung = null
  ausfallGrund = ''
  ladeLauf = null
}

function merkeAusfall(grund: string): void {
  zustand = 'ausgefallen'
  sitzung = null
  ausfallGrund = grund
}

/**
 * Laedt das Modell - beim ERSTEN Aufruf, danach nie wieder (auch nicht nach einem
 * Fehlschlag). Wirft nie: Jeder Fehler endet als gemerkter Ausfall mit Klartext.
 */
export async function ladeFreistellModell(): Promise<void> {
  if (zustand === 'bereit' || zustand === 'ausgefallen') return
  if (ladeLauf !== null) return ladeLauf
  zustand = 'laedt'
  ladeLauf = (async () => {
    try {
      if (typeof fetch !== 'function' || typeof WebAssembly === 'undefined') {
        merkeAusfall(FREISTELL_KLARTEXT)
        return
      }
      // `wasmPaths` als PRAEFIX: ONNX Runtime Web setzt den Dateinamen selbst an - hier
      // also `modell://ort-wasm-simd-threaded.wasm`. Der Main bedient genau diesen Namen.
      ort.env.wasm.wasmPaths = 'modell://'
      // EIN Thread und kein Proxy: Ein Worker waere unter `file://` ein zweiter
      // Ladevorgang mit eigener Herkunft; Threads brauchen `crossOriginIsolated`, das
      // diese Seite nicht setzt. Ein Thread reicht fuer 320 × 320 (gemessen, s. Bericht).
      ort.env.wasm.numThreads = 1
      ort.env.wasm.proxy = false

      const antwort = await fetch('modell://freistellen.onnx')
      if (!antwort.ok) {
        merkeAusfall(FREISTELL_KLARTEXT)
        return
      }
      const bytes = new Uint8Array(await antwort.arrayBuffer())
      const start = performance.now()
      sitzung = await ort.InferenceSession.create(bytes)
      zustand = 'bereit'
      // MESSZEILE (TK 9.21.5: „Ladezeit <= 2 s"): Der Wert steht im Fenster, damit der
      // Beleg ihn ablesen kann, ohne die Zeit aus zwei Klicks zu schaetzen. Eine Zeile
      // `info`, kein Fehler - sie ist Teil der Zusage, nicht eine Warnung.
      console.info(`[freistellen] Modell in ${Math.round(performance.now() - start)} ms geladen`)
    } catch {
      // ALLES landet hier: fehlendes Modell, fehlende Runtime, kaputte Bytes, ein
      // Speicherfehler. Fuer die Oberflaeche ist das ein Zustand, kein Fehler.
      merkeAusfall(FREISTELL_KLARTEXT)
    }
  })()
  return ladeLauf
}

/**
 * Rechnet EIN Bild. Wirft NIE; jeder Fehler endet als `nicht_verfuegbar` mit Klartext.
 *
 * Der Eingang ist die QUELLE in ihren echten Massen; das Ergebnis hat DIESELBEN Masse,
 * aber RGBA mit Alpha - die Flaeche der Vorlage scheint durch. Kleiner gerechnet wird
 * nur INNEN: Das Modell sieht 320 × 320, die Maske wird danach auf die Originalgroesse
 * zurueckgerechnet (dieselbe Rechnung wie in `rembg`, aus dem auch die Gewichte kommen).
 */
export async function stelleFrei(
  quelle: ImageBitmap,
  breite: number,
  hoehe: number,
): Promise<FreistellErgebnis> {
  try {
    if (zustand !== 'bereit') await ladeFreistellModell()
    if (zustand !== 'bereit' || sitzung === null) {
      return { status: 'nicht_verfuegbar', grund: ausfallGrund === '' ? FREISTELL_KLARTEXT : ausfallGrund }
    }
    if (!Number.isInteger(breite) || !Number.isInteger(hoehe) || breite <= 0 || hoehe <= 0) {
      return { status: 'nicht_verfuegbar', grund: FREISTELL_KLARTEXT }
    }
    if (typeof OffscreenCanvas === 'undefined') {
      return { status: 'nicht_verfuegbar', grund: FREISTELL_KLARTEXT }
    }

    const aktuelleSitzung = sitzung
    const eingang = new Float32Array(3 * MODELL_KANTE * MODELL_KANTE)

    // 1. Das Bild auf die Modellgroesse bringen und planar (R,G,B je Flaeche) ablegen.
    const klein = new OffscreenCanvas(MODELL_KANTE, MODELL_KANTE)
    const kleinStift = klein.getContext('2d', { willReadFrequently: true })
    if (kleinStift === null) return { status: 'nicht_verfuegbar', grund: FREISTELL_KLARTEXT }
    kleinStift.drawImage(quelle, 0, 0, MODELL_KANTE, MODELL_KANTE)
    const kleinBild = kleinStift.getImageData(0, 0, MODELL_KANTE, MODELL_KANTE)
    const flaeche = MODELL_KANTE * MODELL_KANTE
    for (let i = 0; i < flaeche; i += 1) {
      const basis = i * 4
      for (let kanal = 0; kanal < 3; kanal += 1) {
        const wert = (kleinBild.data[basis + kanal] ?? 0) / 255
        eingang[kanal * flaeche + i] = (wert - (MITTELWERT[kanal] ?? 0)) / (STREUUNG[kanal] ?? 1)
      }
    }

    // 2. Rechnen. Der Eingangsname kommt aus der Sitzung, nicht aus einer Annahme.
    const rechenStart = performance.now()
    const eingangsName = aktuelleSitzung.inputNames[0]
    if (eingangsName === undefined) return { status: 'nicht_verfuegbar', grund: FREISTELL_KLARTEXT }
    const tensor = new ort.Tensor('float32', eingang, [1, 3, MODELL_KANTE, MODELL_KANTE])
    const ausgang = await aktuelleSitzung.run({ [eingangsName]: tensor })

    // 3. Die erste Ausgabe ist die verschmolzene Maske (wie in `rembg`); sie wird auf
    //    0…255 gezogen. Min/Max statt fester Grenzen: Das Modell liefert Logits, keine
    //    Wahrscheinlichkeiten - ein fester Faktor waere eine zweite Annahme.
    const ersterName = aktuelleSitzung.outputNames[0]
    const roh = ersterName === undefined ? undefined : ausgang[ersterName]
    const daten = roh?.data
    if (daten === undefined || !(daten instanceof Float32Array) || daten.length < flaeche) {
      return { status: 'nicht_verfuegbar', grund: FREISTELL_KLARTEXT }
    }
    let minimum = Number.POSITIVE_INFINITY
    let maximum = Number.NEGATIVE_INFINITY
    for (let i = 0; i < flaeche; i += 1) {
      const wert = daten[i] ?? 0
      if (wert < minimum) minimum = wert
      if (wert > maximum) maximum = wert
    }
    const spanne = maximum - minimum

    // 4. Die Maske als Alpha auf das ORIGINAL in seinen Massen. Zwei Wege waeren hier
    //    falsch: ein `globalCompositeOperation`-Trick (andere Rundung je Backend) und
    //    ein zweites Modell in Originalgroesse (zu langsam, 9.21.4).
    const maske = new OffscreenCanvas(MODELL_KANTE, MODELL_KANTE)
    const maskenStift = maske.getContext('2d')
    if (maskenStift === null) return { status: 'nicht_verfuegbar', grund: FREISTELL_KLARTEXT }
    const maskenBild = maskenStift.createImageData(MODELL_KANTE, MODELL_KANTE)
    for (let i = 0; i < flaeche; i += 1) {
      const wert = spanne === 0 ? 255 : ((daten[i] ?? 0) - minimum) / spanne
      const basis = i * 4
      maskenBild.data[basis] = 0
      maskenBild.data[basis + 1] = 0
      maskenBild.data[basis + 2] = 0
      maskenBild.data[basis + 3] = Math.round(wert * 255)
    }
    maskenStift.putImageData(maskenBild, 0, 0)

    const gross = new OffscreenCanvas(breite, hoehe)
    const grossStift = gross.getContext('2d', { willReadFrequently: true })
    if (grossStift === null) return { status: 'nicht_verfuegbar', grund: FREISTELL_KLARTEXT }
    // Weich vergroessern: eine 320er Maske hart zu ziehen ergaebe Treppenkanten.
    grossStift.imageSmoothingEnabled = true
    grossStift.imageSmoothingQuality = 'high'
    grossStift.drawImage(quelle, 0, 0, breite, hoehe)
    const grossBild = grossStift.getImageData(0, 0, breite, hoehe)

    const maskenGross = new OffscreenCanvas(breite, hoehe)
    const maskenGrossStift = maskenGross.getContext('2d', { willReadFrequently: true })
    if (maskenGrossStift === null) return { status: 'nicht_verfuegbar', grund: FREISTELL_KLARTEXT }
    maskenGrossStift.imageSmoothingEnabled = true
    maskenGrossStift.imageSmoothingQuality = 'high'
    maskenGrossStift.drawImage(maske, 0, 0, breite, hoehe)
    const maskenGrossBild = maskenGrossStift.getImageData(0, 0, breite, hoehe)

    for (let i = 3; i < grossBild.data.length; i += 4) {
      grossBild.data[i] = maskenGrossBild.data[i] ?? 0
    }
    grossStift.putImageData(grossBild, 0, 0)

    const bild = await createImageBitmap(gross)
    // MESSZEILE (TK 9.21.5: „Laufzeit <= 5 s je Bild"): gerechnet wird in 320 x 320,
    // gerechnet wird aber AUCH das Zurueckskalieren auf die Originalgroesse - und genau
    // das kostet. Deshalb misst die Zeile den ganzen Weg.
    console.info(
      `[freistellen] Bild in ${Math.round(performance.now() - rechenStart)} ms gerechnet (${String(breite)}x${String(hoehe)})`,
    )
    return { status: 'ok', bild, breite, hoehe }
  } catch {
    return { status: 'nicht_verfuegbar', grund: FREISTELL_KLARTEXT }
  }
}
