// [shared] Der Bildplan eines Ganzbild-Segments – die kuerzeste Folge, die exakt abspielt
//
// WARUM ES DIESE DATEI GIBT (09.11.2026, FA-25 / TK 9.16.4): Eine Schleife laeuft ueber die
// GANZE Segmentdauer. Bei 45 s waeren das 1350 gezeichnete Frames – unbezahlbar an Zeit
// und Speicher. Der Plan wiederholt DENSELBEN Frame, statt ihn neu zu zeichnen.
//
// KEIN CANVAS, KEIN DOM, KEINE ZEIT: Der Plan rechnet nur mit Bildnummern. Gezeichnet wird
// vom Aufrufer, mit `effektZustand` und `zeichneSegment`.
//
// DIE ZWEI INVARIANTEN (TK 9.16.4), beide in `tests/unit/bildplan.spec.ts` geprueft:
//   1. Summe aus `anzahl × wiederholungen` = bilderGesamt – EXAKT, ohne Toleranz.
//   2. Jeder expandierte Frame traegt genau den Zustand seines Zeitpunkts.
//
// UND DIE DRITTE, STILLE: Wer keinen Effekt hat, bekommt `null` und damit den Einzel-PNG-Weg.
// Ein leerer Plan waere die schlechteste Antwort – er saehe aus wie ein Plan und ergaebe
// null Bilder.

import type { EffektSatz } from './contracts/aktion'
import { EFFEKT_GRENZEN, effektZustand, type EffektZustand } from './effekte'

/**
 * Ein Lauf: eine Folge von Frames, `wiederholungen`-mal gespielt.
 *
 * `erstesBild` zeigt in `Rahmenplan.bildNummern`, NICHT in die Zeitachse: Der Lauf nennt
 * die zu zeichnenden Frames, nicht den Zeitpunkt. Dieselbe PNG darf in mehreren Laeufen
 * stehen – sie ist ja dasselbe Bild.
 */
export interface Lauf {
  erstesBild: number
  anzahl: number
  wiederholungen: number
}

/**
 * Der Plan: welche Frames gezeichnet werden muessen (eindeutig, in Reihenfolge des ersten
 * Auftretens) und wie sie abgespielt werden.
 */
export interface Rahmenplan {
  bildNummern: number[]
  laeufe: Lauf[]
}

/** Ein Zustand als vergleichbarer Schluessel. Die Reihenfolge ist fest (Objekt aus `effekte.ts`). */
function schluessel(zustand: EffektZustand): string {
  return JSON.stringify(zustand)
}

/** Hat der Satz ueberhaupt eine Wirkung? `staerke: 0` ist AUS (TK 9.16.1). */
function hatWirkung(effekte: EffektSatz | null | undefined): effekte is EffektSatz {
  if (effekte === null || effekte === undefined) return false
  return Object.values(effekte).some(
    (eintrag) => eintrag !== undefined && eintrag.staerke > 0,
  )
}

/**
 * Der Plan fuer ein Segment.
 *
 * `effekte` MUSS der bereits normalisierte Satz sein (M10-01) – derselbe, mit dem auch
 * gezeichnet wird. Waeren es zwei verschiedene, zeigte der Plan auf Frames, die es so nicht
 * gibt; die zweite Invariante waere still verletzt.
 *
 * `null` heisst: kein Effekt, kein Plan. Der Aufrufer nimmt dann den Einzel-PNG-Weg.
 */
export function rahmenplan(
  effekte: EffektSatz | null | undefined,
  bilderGesamt: number,
): Rahmenplan | null {
  if (!hatWirkung(effekte)) return null
  if (!Number.isFinite(bilderGesamt) || bilderGesamt <= 0) return null
  const gesamt = Math.floor(bilderGesamt)

  // 1. Den Zustand JEDES Frames holen. Der Schluessel ist die Vergleichsgrundlage fuer
  //    die Periodensuche – gezeichnet wird spaeter trotzdem jeder Frame des Plans.
  const kennungen: string[] = []
  for (let bild = 0; bild < gesamt; bild += 1) {
    kennungen.push(schluessel(effektZustand(effekte, bild, gesamt)))
  }

  // 2. Die laengste Periode am ENDE finden – und dabei die kleinste, die traegt.
  //    Gesucht ist das kleinste p, fuer das ab einem moeglichst fruehen s gilt:
  //    Zustand[i] = Zustand[i + p] bis zum Ende. Das ist die Naht der Schleife; davor
  //    liegen die Fenster, die einmalig sind.
  let naht = gesamt
  let periode = 0
  const groesstePeriode = Math.min(EFFEKT_GRENZEN.schleifeBilder, gesamt)
  for (let p = 1; p <= groesstePeriode; p += 1) {
    let s = gesamt - p
    while (s > 0 && kennungen[s - 1] === kennungen[s - 1 + p]) s -= 1
    if (s < naht) {
      naht = s
      periode = p
    }
  }
  // Keine Periode gefunden (z. B. ein einziges Bild): alles ist einmalig.
  if (periode === 0) naht = gesamt

  const bildNummern: number[] = []
  const laeufe: Lauf[] = []

  // 3. Der einmalige Teil als zusammenhaengender Block. Gleiche aufeinanderfolgende Bilder
  //    (der Ruhezustand zwischen zwei Fenstern) werden zu EINEM Eintrag mit
  //    `wiederholungen` – das spart Frames, ohne die Reihenfolge zu verlieren.
  let bild = 0
  while (bild < naht) {
    let gleich = 1
    while (bild + gleich < naht && kennungen[bild + gleich] === kennungen[bild]) gleich += 1
    laeufe.push({ erstesBild: bildNummern.length, anzahl: 1, wiederholungen: gleich })
    bildNummern.push(bild)
    bild += gleich
  }

  // 4. Die Periode als EIGENER, zusammenhaengender Block – auch wenn sich Zustaende darin
  //    wiederholen. WARUM NICHT GLOBAL DEDUPLIZIERT: `dreieck` ist symmetrisch, „Zoom-Atmen"
  //    hat bei Bild 10 und Bild 50 denselben Wert. Ein Dedup ueber den ganzen Plan machte
  //    daraus 31 statt 60 Frames – und die Laeufe zeigten dann auf nicht zusammenhaengende
  //    Nummern. Der Block kostet hoechstens 60 Frames und haelt den Vertrag einfach.
  if (periode > 0) {
    const start = bildNummern.length
    for (let versatz = 0; versatz < periode; versatz += 1) {
      bildNummern.push(naht + versatz)
    }
    const rest = gesamt - naht
    const voll = Math.floor(rest / periode)
    const uebrig = rest % periode
    if (voll > 0) laeufe.push({ erstesBild: start, anzahl: periode, wiederholungen: voll })
    if (uebrig > 0) laeufe.push({ erstesBild: start, anzahl: uebrig, wiederholungen: 1 })
  }

  return { bildNummern, laeufe }
}

/**
 * Pruefhilfe: die expandierte Folge von Segment-Bildnummern.
 *
 * Sie ist der Grund, warum die Invarianten ohne Canvas pruefbar sind: Laenge und Inhalt
 * lassen sich gegen `effektZustand` halten.
 */
export function expandiere(plan: Rahmenplan): number[] {
  const folge: number[] = []
  for (const lauf of plan.laeufe) {
    for (let wiederholung = 0; wiederholung < lauf.wiederholungen; wiederholung += 1) {
      for (let versatz = 0; versatz < lauf.anzahl; versatz += 1) {
        const ziel = plan.bildNummern[lauf.erstesBild + versatz]
        if (ziel !== undefined) folge.push(ziel)
      }
    }
  }
  return folge
}
