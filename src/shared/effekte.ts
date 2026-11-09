// [shared] Die Effekte eines Ganzbild-Segments – EINE Quelle fuer Vorschau und Render
//
// WARUM ES DIESE DATEI GIBT (09.11.2026, FA-25 / TK 9.16): Ein Aktions-Segment war
// bisher ein Standbild. `template-canvas` zeichnete es EINMAL, der `render-service`
// spielte genau dieses PNG fuer die Dauer ab. Mit Effekten haengt das Bild vom
// ZEITPUNKT ab. Diese Datei rechnet einen BILDINDEX in einen ZUSTAND um – ohne DOM,
// ohne Uhr, ohne Zufall. Editor (requestAnimationFrame) und Render (PNG-Folge) rufen
// dieselbe Funktion; eine zweite Rechnung im Main waere das Ende der Pixelgleichheit.
//
// KEIN CANVAS, KEIN DOM, KEIN NODE: nur Zahlen. Damit ist die Datei ohne Browser
// pruefbar (`tests/unit/effekte.spec.ts`).
//
// DIE GRUNDREGEL: Fehlt der Satz, ist alles wie heute (`RUHE_ZUSTAND`). Ein Eintrag
// mit `staerke: 0` ist AUS und darf keinen Frame erzeugen (TK 9.16.1).

import type { EffektSatz, FensterEffekt, SchleifenEffekt } from './contracts/aktion'

/**
 * Was an EINEM Bild eines Segments zu tun ist. Die Zeichenroutine liest nur diesen
 * Zustand – sie kennt weder Effekt-Namen noch Fenster.
 *
 * Die Werte sind ABSOLUT (Prozent, Deckkraft, Skala), nicht relativ: `100` heisst
 * „unveraendert", `1` heisst „voll". So kann das Zeichnen jeden Wert ohne Fallunter-
 * scheidung anwenden – und der Ruhezustand ist exakt der Stand von vorher.
 */
export interface EffektZustand {
  /** Zoom der Bildzone in Prozent, 100 = Einpassung der Vorlage. Ken Burns + Zoom-Atmen. */
  zoomBild: number
  /** Versatz der Bildzone in Prozent ihrer Breite. Ken Burns + Drift. */
  versatzBildX: number
  /** Versatz der Bildzone in Prozent ihrer Hoehe. Ken Burns + Drift. */
  versatzBildY: number
  /** Parallax: Versatz der Hintergrundflaeche, aus der Bildbewegung abgeleitet. */
  versatzHintergrundX: number
  /** Parallax: Versatz der Hintergrundflaeche, aus der Bildbewegung abgeleitet. */
  versatzHintergrundY: number
  /** Deckkraft der Textzonen, 0…1. */
  textAlpha: number
  /** Zusaetzlicher Versatz der Textzonen nach oben in Pixeln. */
  textVersatzY: number
  /** Skala der Preiszone, 1 = voll. */
  preisSkala: number
  /** Anteil fuer den hochzaehlenden Preis (0…1); `null` = keine Zaehlung. */
  zaehlAnteil: number | null
  /** Fortschritt des Glanz-Sweeps (0…1); `null` = kein Sweep. */
  glanzFortschritt: number | null
  /** Wie viel vom Bild sichtbar ist: 0 = verdeckt, 1 = vollstaendig. */
  revealAnteil: number
  /** Skala des Call-to-Action, 1 = voll. */
  pulsSkala: number
}

/**
 * Die Grenzen. Sie stehen hier und NICHT im Formular: Editor, Zeichnen und Bildplan
 * muessen dieselben Zahlen kennen (TK 9.16.7) – dieselbe Linie wie `GESTALTUNG_GRENZEN`.
 *
 * - `bilderProSekunde` 30: das Ausgabe-Profil (TK 9.2.4). Die Effekte erfinden keine
 *   zweite Zeitbasis; `bilderGesamt = dauer × 30`.
 * - `schleifeBilder` 60: die Schleifen-Periode (2 s). Bild 0 und Bild 60 sind identisch,
 *   sonst gaebe es an der Naht einen Sprung.
 * - `staerke` 0–100: Prozent der Vorgabe aus Anforderungsdokument 4.10.
 * - `fensterSekunden` 0,3–3: ein Fenster ist eine Einblendung, kein Dauerlauf. Die
 *   Untergrenze deckt die kuerzeste Vorgabe aus Anforderungsdokument 4.10 (Preis-Pop
 *   0,33 s) und faengt zugleich ein versehentliches Null-Fenster ab; ueber 3 s waeren
 *   es mehr als 90 gezeichnete Frames.
 * - `maxEindeutigeBilder` 180: die Frames liegen als PNG im Speicher; Schleife (60) plus
 *   3-s-Fenster bleiben darunter.
 */
export const EFFEKT_GRENZEN = {
  bilderProSekunde: 30,
  schleifeBilder: 60,
  staerke: { min: 0, max: 100 },
  fensterSekunden: { min: 0.3, max: 3 },
  maxEindeutigeBilder: 180,
} as const

/**
 * Der Zustand, in dem nichts passiert – exakt das Bild von vor dieser Fassung.
 * Eingefroren, weil ihn viele Aufrufe gleichzeitig lesen; geschrieben wird nie hinein
 * (jeder Aufruf von `effektZustand` gibt eine eigene Kopie zurueck).
 */
export const RUHE_ZUSTAND: Readonly<EffektZustand> = Object.freeze({
  zoomBild: 100,
  versatzBildX: 0,
  versatzBildY: 0,
  versatzHintergrundX: 0,
  versatzHintergrundY: 0,
  textAlpha: 1,
  textVersatzY: 0,
  preisSkala: 1,
  zaehlAnteil: null,
  glanzFortschritt: null,
  revealAnteil: 1,
  pulsSkala: 1,
})

/** Eine Zahl auf einen Bereich begrenzen. Nicht-endliche Werte fallen auf `min`. */
function begrenze(wert: number, min: number, max: number): number {
  if (!Number.isFinite(wert)) return min
  return Math.min(max, Math.max(min, wert))
}

/** Die eine Ausblendkurve (TK 9.16.2): 0 → 0, 1 → 1, schnell herein, sanft auslaufend. */
function weich(t: number): number {
  return 1 - (1 - t) ** 3
}

/** Hin und zurueck (TK 9.16.2): 0 → 0, 0,5 → 1, 1 → 0. Das macht die Schleife nahtlos. */
function dreieck(t: number): number {
  return 1 - Math.abs(2 * t - 1)
}

/**
 * Wo im Fenster steht dieses Bild?
 *
 * Das Fenster umfasst die Bilder `[von, bis)`. `t` erreicht **exakt 1** am LETZTEN Bild
 * – nur so endet ein Fenster im Ruhezustand und nicht einen Wimpernschlag davor
 * (TK 9.16.2). Liegt das Fenster nach der Rundung auf keinem Bild, gibt es `null`.
 */
interface FensterLage {
  /** Das Bild liegt VOR dem Fenster. */
  vor: boolean
  /** Das Bild liegt NACH dem Fenster (der Endzustand steht). */
  nach: boolean
  /** Fortschritt im Fenster, 0…1. */
  t: number
}

function fensterLage(
  bild: number,
  fenster: FensterEffekt,
  bilderGesamt: number,
): FensterLage | null {
  const von = begrenze(
    Math.round(fenster.vonSekunden * EFFEKT_GRENZEN.bilderProSekunde),
    0,
    bilderGesamt,
  )
  const bis = begrenze(
    Math.round(fenster.bisSekunden * EFFEKT_GRENZEN.bilderProSekunde),
    0,
    bilderGesamt,
  )
  if (bis <= von) return null
  const letztes = bis - 1
  const spanne = letztes - von
  return {
    vor: bild < von,
    nach: bild >= bis,
    t: bild <= von ? 0 : bild >= letztes ? 1 : (bild - von) / spanne,
  }
}

/**
 * Raeumt einen Effekt-Satz auf: begrenzt die Staerke, klemmt die Fenster auf die Dauer
 * und auf 0,3–3 s, wirft Eintraege mit Staerke 0 und unbrauchbare Fenster weg.
 *
 * WARUM AUFRAEUMEN UND NICHT BEIM ZEICHNEN PRUEFEN: Der Satz kommt aus einem Formular
 * und landet in `project.json`. Was hier verschwindet, waechst nicht in die Datei – und
 * ein Eintrag, der nie wirkt, aber gespeichert ist, sieht fuer den Naechsten aus wie
 * ein Fehler im Zeichnen.
 *
 * Ergebnis `null` heisst: kein Effekt. Das ist der Zustand von vorher (TK 9.16.1).
 */
export function normalisiereEffekte(
  effekte: EffektSatz | null | undefined,
  dauerSekunden: number,
): EffektSatz | null {
  if (effekte === null || effekte === undefined) return null
  const dauer = begrenze(dauerSekunden, 0, Number.MAX_SAFE_INTEGER)
  const ziel: EffektSatz = {}

  const fenster = (eintrag: FensterEffekt | undefined): FensterEffekt | null => {
    if (eintrag === undefined) return null
    const staerke = begrenze(eintrag.staerke, EFFEKT_GRENZEN.staerke.min, EFFEKT_GRENZEN.staerke.max)
    if (staerke <= 0) return null
    const von = begrenze(eintrag.vonSekunden, 0, dauer)
    const bisRoh = begrenze(eintrag.bisSekunden, 0, dauer)
    // Ein Fenster ohne Länge ist KEIN Fenster: „von >= bis" wird verworfen (Issue
    // M10-01, Fehlerpfade). Erst danach wird ein zu KURZES Fenster auf die
    // Mindestlänge gehoben – sonst wäre ein 0,1-s-Fenster dasselbe wie gar keines.
    if (bisRoh <= von) return null
    let bis = bisRoh
    if (bis - von < EFFEKT_GRENZEN.fensterSekunden.min) bis = von + EFFEKT_GRENZEN.fensterSekunden.min
    if (bis - von > EFFEKT_GRENZEN.fensterSekunden.max) bis = von + EFFEKT_GRENZEN.fensterSekunden.max
    if (bis > dauer) bis = dauer
    if (bis <= von) return null
    return { staerke, vonSekunden: von, bisSekunden: bis }
  }

  const schleife = (eintrag: SchleifenEffekt | undefined): SchleifenEffekt | null => {
    if (eintrag === undefined) return null
    const staerke = begrenze(eintrag.staerke, EFFEKT_GRENZEN.staerke.min, EFFEKT_GRENZEN.staerke.max)
    return staerke > 0 ? { staerke } : null
  }

  const fensterEffekte = [
    ['kenBurns', effekte.kenBurns],
    ['textEinblendung', effekte.textEinblendung],
    ['preisPop', effekte.preisPop],
    ['glanzSweep', effekte.glanzSweep],
    ['preisZaehlt', effekte.preisZaehlt],
    ['bildReveal', effekte.bildReveal],
    ['puls', effekte.puls],
  ] as const
  for (const [name, eintrag] of fensterEffekte) {
    const sauber = fenster(eintrag)
    if (sauber !== null) ziel[name] = sauber
  }

  const schleifenEffekte = [
    ['zoomAtmen', effekte.zoomAtmen],
    ['drift', effekte.drift],
    ['parallax', effekte.parallax],
  ] as const
  for (const [name, eintrag] of schleifenEffekte) {
    const sauber = schleife(eintrag)
    if (sauber !== null) ziel[name] = sauber
  }

  return Object.keys(ziel).length === 0 ? null : ziel
}

/**
 * Der Zustand EINES Bildes.
 *
 * `bild` ist der Bildindex im Segment (0 … bilderGesamt − 1), `bilderGesamt` ist
 * `dauer × 30`. Beide werden geklemmt, die Funktion wirft nicht – sie wird in einer
 * Zeichenschleife gerufen, dort ist ein Wurf kein Fehlerpfad, sondern ein leeres Bild.
 *
 * Die Reihenfolge ist bindend: erst die Fenster (Ken Burns setzt den Bild-Versatz),
 * dann die Schleifen, dann der Parallax – er rechnet aus dem Bild-Versatz und waere
 * vorher immer null.
 */
export function effektZustand(
  effekte: EffektSatz | null | undefined,
  bild: number,
  bilderGesamt: number,
): EffektZustand {
  const zustand: EffektZustand = { ...RUHE_ZUSTAND }
  if (!effekte || !Number.isFinite(bilderGesamt) || bilderGesamt <= 0) return zustand

  const gesamt = Math.floor(bilderGesamt)
  const index = Math.min(gesamt - 1, Math.max(0, Math.floor(bild)))

  // ---- Fenster-Effekte: einmalig, danach steht der Endzustand -------------------
  const kenBurns = effekte.kenBurns
  if (kenBurns !== undefined && kenBurns.staerke > 0) {
    const lage = fensterLage(index, kenBurns, gesamt)
    if (lage !== null) {
      const s = kenBurns.staerke / 100
      const w = weich(lage.nach ? 1 : lage.t)
      zustand.zoomBild = 100 + 8 * s * w
      zustand.versatzBildX = 2 * s * w
    }
  }

  const einblendung = effekte.textEinblendung
  if (einblendung !== undefined && einblendung.staerke > 0) {
    const lage = fensterLage(index, einblendung, gesamt)
    if (lage !== null) {
      const w = weich(lage.nach ? 1 : lage.t)
      // VOR dem Fenster ist der Text noch nicht da – das ist der Sinn einer Einblendung
      // mit spaeterem Beginn. NACH dem Fenster bleibt er stehen.
      zustand.textAlpha = lage.vor ? 0 : w
      zustand.textVersatzY = lage.vor ? 12 : 12 * (1 - w)
    }
  }

  const preisPop = effekte.preisPop
  if (preisPop !== undefined && preisPop.staerke > 0) {
    const lage = fensterLage(index, preisPop, gesamt)
    if (lage !== null && !lage.vor && !lage.nach) {
      const s = preisPop.staerke / 100
      // 0,85 → ueber 1,04 → exakt 1,00: `weich` traegt den Anstieg, der Sinus das
      // Ueberschwingen. Bei t = 1 ist der Sinus 0 – der Endpunkt ist damit exakt die
      // Vorgabe und nicht „ungefaehr 1".
      zustand.preisSkala = 0.85 + 0.15 * weich(lage.t) + 0.06 * s * Math.sin(Math.PI * lage.t)
    }
  }

  const glanz = effekte.glanzSweep
  if (glanz !== undefined && glanz.staerke > 0) {
    const lage = fensterLage(index, glanz, gesamt)
    if (lage !== null && !lage.vor && !lage.nach) zustand.glanzFortschritt = lage.t
  }

  const zaehlt = effekte.preisZaehlt
  if (zaehlt !== undefined && zaehlt.staerke > 0) {
    const lage = fensterLage(index, zaehlt, gesamt)
    if (lage !== null && !lage.vor && !lage.nach) {
      zustand.zaehlAnteil = 0.8 + 0.2 * weich(lage.t)
    }
  }

  const reveal = effekte.bildReveal
  if (reveal !== undefined && reveal.staerke > 0) {
    const lage = fensterLage(index, reveal, gesamt)
    if (lage !== null) {
      zustand.revealAnteil = lage.vor ? 0 : weich(lage.nach ? 1 : lage.t)
    }
  }

  const puls = effekte.puls
  if (puls !== undefined && puls.staerke > 0) {
    const lage = fensterLage(index, puls, gesamt)
    if (lage !== null && !lage.vor && !lage.nach) {
      const s = puls.staerke / 100
      // Drei Schläge, Anfang und Ende exakt 1,00: |sin(3πt)| ist an 0, 1/3, 2/3 und 1
      // null. Damit springt am Fensterrand nichts.
      zustand.pulsSkala = 1 + 0.03 * s * Math.abs(Math.sin(3 * Math.PI * lage.t))
    }
  }

  // ---- Schleifen-Effekte: ueber die ganze Dauer, nahtlos -----------------------
  // ENTSCHEIDEN 09.11.2026: Sie wirken auf das BILD, nicht auf die Hintergrund-Zone.
  // Die Hintergrund-Zone ist in jeder eingebauten Vorlage eine Farbflaeche – ein Zoom
  // darauf waere unsichtbar. Das „bewegte Hintergrundbild" ist hier das Motiv.
  const atem = effekte.zoomAtmen
  if (atem !== undefined && atem.staerke > 0) {
    const t = (index % EFFEKT_GRENZEN.schleifeBilder) / EFFEKT_GRENZEN.schleifeBilder
    zustand.zoomBild += 4 * (atem.staerke / 100) * dreieck(t)
  }

  const drift = effekte.drift
  if (drift !== undefined && drift.staerke > 0) {
    const s = drift.staerke / 100
    // VERSCHIEDENE Perioden fuer x und y (TK 9.16.2): mit derselben Periode liefe das
    // Bild auf einer Geraden hin und zurueck – das sieht nach Metronom aus.
    const tx = (index % EFFEKT_GRENZEN.schleifeBilder) / EFFEKT_GRENZEN.schleifeBilder
    const ty = (index % (EFFEKT_GRENZEN.schleifeBilder / 2)) / (EFFEKT_GRENZEN.schleifeBilder / 2)
    zustand.versatzBildX += 1.5 * s * dreieck(tx)
    zustand.versatzBildY += 1 * s * dreieck(ty)
  }

  // ---- Parallax: eine BEZIEHUNG, kein eigener Antrieb --------------------------
  const parallax = effekte.parallax
  if (parallax !== undefined && parallax.staerke > 0) {
    // 100 % = Hintergrundflaeche laeuft mit 0,6× der Bildbewegung. Ohne Bildbewegung
    // bleibt das unsichtbar – genauso auf einer Vollton-Flaeche (TK 9.16.2).
    const faktor = 1 - 0.4 * (parallax.staerke / 100)
    zustand.versatzHintergrundX = zustand.versatzBildX * faktor
    zustand.versatzHintergrundY = zustand.versatzBildY * faktor
  }

  return zustand
}
