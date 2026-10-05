// Issue #253 (M7-60) - einblendung-ansicht.ts: die REINE Ableitung der Anzeigewerte
// fuer die Band-Bearbeitung. Kein JSX, kein react, kein IPC, kein throw.
//
// Die Fachlichkeit dieses Issues sitzt ausschliesslich hier. Diese Datei RECHNET
// NICHTS NACH: Die Frame-Zahlen kommen unveraendert aus `planeBandAblauf` (#130),
// die Dauern im Anzeigeformat aus `formatiereReglerDauer` (#249). „Frames sind die
// Wahrheit, Sekunden sind Anzeige" (Issue #130) - wer hier selbst rundete, wuerde
// ein zweites Mal runden und neben dem Render eine zweite Wahrheit aufstellen.
//
// KEINE GEOMETRIE (ENTSCHIEDEN 1): Weder Bandhoehe, noch Videoflaeche, noch
// Versaetze. `berechneBandGeometrie` (#239) wird weder gerufen noch nachgebaut.
//
// KEINE VIELZEIT-LITERALE in einem eigenen Format: Das einzige Dauerformat ist das
// von #249; die Wirkung, die „ka jumping", ergeben nur die Zahlen des Plans.
// `volleDurchlaeufe` und `angeschnittenerIndex` werden UNVERAENDERT uebernommen
// (DoD: der Text folgt den Zahlen, nicht der Plausibilitaet).
//
// Kaputte Stellen (#131) kommen als Eigenschaft herein und werden hier nur
// gefiltert; `findeKaputteStellen` wird von dieser Datei NICHT gerufen
// (ENTSCHIEDEN 7).

import type { Listenelement } from '../../shared/contracts/project'
import type { Aktion } from '../../shared/contracts/aktion'
import type { Vorlage } from '../../shared/contracts/vorlage'
import type { KaputteStelle } from './kaputt-erkennung'
import type { BandEntwurf } from './einblendung-bearbeiten'
import type { BandAblaufplan } from './einblendung-vorschau'
import { formatiereReglerDauer } from './element-zeile'

/** Der Ersatzname, wenn `aktionRef` ins Leere zeigt. EINE Quelle fuer diesen Text. */
export const BEZEICHNUNG_UNBEKANNT = 'Nicht gefunden'

/**
 * Der Entwurf, mit dem die Bearbeitung startet: die vorhandene `einblendung` des Elements,
 * sonst ein leerer Entwurf mit `vorgabeVorlagenId`. null, wenn es kein Video-Element ist ODER
 * keine Band-Vorlage zur Verfuegung steht (s. ENTSCHIEDEN 2). Wirft nie.
 */
export function entwurfAus(
  element: Listenelement,
  vorgabeVorlagenId: string | null,
): BandEntwurf | null {
  // „Parallele Baender gibt es nur bei `\"video\"`-Items" (TK 9.2.8). Alles andere
  // liefert null - die Ansicht zeigt dann einen Hinweis statt Bedienung (Fehlerpfade).
  // Der gebaute Vertrag (#15, nach der Streichung von `bild`) kennt nur
  // `video` und `segment`; die Abfrage ist bewusst `!== 'video'`, sodass eine
  // etwaige Bestands-`bild`-Zeile denselben Weg nimmt.
  if (element.art !== 'video') return null
  if (vorgabeVorlagenId === null) return null

  const vorhanden = element.einblendung
  if (vorhanden !== null) {
    // Kopie, nicht Referenz: eine spaetere Entwurfsbearbeitung darf das
    // Element nie anfassen (DoD: neues Array, Object.freeze auf dem Element).
    return {
      bandVorlageId: vorhanden.bandVorlageId,
      abschnitte: vorhanden.abschnitte.map((abschnitt) => ({
        aktionRef: abschnitt.aktionRef,
        dauer: abschnitt.dauer,
      })),
    }
  }

  return { bandVorlageId: vorgabeVorlagenId, abschnitte: [] }
}

/** Eine anzeigefertige Abschnitts-Zeile. Rein abgeleitet, ohne Zustand. */
export interface AbschnittZeile {
  /** 0-basierter Index im Entwurf – dieselbe Zaehlung wie `abschnittIndex` in #131/#133. */
  index: number
  /** 1-basierte Position fuer die Anzeige. */
  position: number
  aktionRef: string
  /** `Aktion.titel`; sonst BEZEICHNUNG_UNBEKANNT. */
  bezeichnung: string
  dauerSekunden: number
  /** `formatiereReglerDauer(dauerSekunden)` (#249) – KEIN zweites Zeitformat. */
  dauerText: string
  /** `plan.abschnittsFrames[index]`; 0, wenn der Plan diesen Index nicht kennt. */
  frames: number
  /** true, wenn `index` in `plan.nullFrameIndizes` steht: der Abschnitt kommt im Render NICHT vor. */
  faelltAus: boolean
  /** true, wenn `plan.angeschnittenerIndex === index`: hier bricht das Band am Videoende ab. */
  angeschnitten: boolean
  /** true, wenn zu diesem Abschnitt eine kaputte Stelle vorliegt (#131, Art 'band_abschnitt'). */
  kaputt: boolean
}

/**
 * Die Zeilen in der Reihenfolge des Entwurfs – ohne Sortierung, ohne Gruppierung, ohne
 * Filterung. Rein und synchron; wirft nie.
 */
export function baueAbschnittZeilen(
  entwurf: BandEntwurf,
  aktionen: readonly Aktion[],
  plan: BandAblaufplan,
  kaputteIndizes: readonly number[],
): AbschnittZeile[] {
  // Nachschlagetabelle statt linearer Suche je Zeile: Die Bibliothek kann gross
  // werden, und die Zeilenzahl folgt dem Entwurf, nicht dem Bestand.
  const titel = new Map(aktionen.map((aktion) => [aktion.id, aktion.titel]))

  // Genau eine Zeile je Abschnitt, in Antwortreihenfolge des Entwurfs - nichts
  // wird sortiert oder gefiltert, auch nicht bei unbekannten Aktionen (die Zeile
  // bleibt an ihrer Position; s. Fehlerpfade).
  return entwurf.abschnitte.map((abschnitt, index) => ({
    index,
    position: index + 1,
    aktionRef: abschnitt.aktionRef,
    bezeichnung: titel.get(abschnitt.aktionRef) ?? BEZEICHNUNG_UNBEKANNT,
    dauerSekunden: abschnitt.dauer,
    dauerText: formatiereReglerDauer(abschnitt.dauer),
    // Kein eigener Fallback auf die Dauer: Der Plan ist die einzige Frame-Quelle;
    // ein fehlender Eintrag ist 0, ohne hier zu pruefen, warum er fehlt.
    frames: plan.abschnittsFrames[index] ?? 0,
    // `faelltAus` folgt NUR der Liste des Plans - NICHT `frames === 0`. Beide
    // Angaben koennen laut DoD absichtlich auseinanderlaufen; die Liste ist der
    // Vertrag, die abgeleitete Zahl waere eine zweite Wahrheit.
    faelltAus: plan.nullFrameIndizes.includes(index),
    angeschnitten: plan.angeschnittenerIndex === index,
    kaputt: kaputteIndizes.includes(index),
  }))
}

/**
 * Die Indizes der kaputten Band-Abschnitte DIESES Elements, aufsteigend und ohne Dubletten.
 * Liest ausschliesslich Eintraege der Art 'band_abschnitt' mit passender `elementId`.
 */
export function kaputteAbschnitte(
  stellen: readonly KaputteStelle[],
  elementId: string,
): number[] {
  // Nur Fall 3 (TK 9.7.5) und nur DIES Element: Stellen anderer Elemente und der
  // anderen Arten (`element_asset`, `element_aktion`) gehoeren nicht in diese
  // Abschnitten-Ansicht und wuerden Indizes zeigen, die hier nichts bedeuten.
  const eigen = stellen
    .filter((stelle) => stelle.art === 'band_abschnitt' && stelle.elementId === elementId)
    .map((stelle) => (stelle.art === 'band_abschnitt' ? stelle.abschnittIndex : -1))

  // Aufsteigend und ohne Dubletten - die Eingabe des Aufrufers (#131 liefert sie
  // stabil, aber dieser Vertrag gilt unabhaengig davon) darf unsortiert oder
  // doppelt sein.
  return [...new Set(eigen.filter((index) => index >= 0))].sort((a, b) => a - b)
}

/** Die Wirkung der Folge in einem Satz – aus den ZAHLEN von #130, nie nachgerechnet. */
export interface Wirkungsanzeige {
  /** Der eine Satz fuer die Oberflaeche. */
  text: string
  /** true, wenn der Nutzer hinsehen sollte: 'abgeschnitten', 'leer' oder Nullframe-Abschnitte. */
  warnung: boolean
  /** Der Zusatzsatz zu den Abschnitten, die im Render fehlen; leer, wenn keiner betroffen ist. */
  ausfallText: string
}
export function baueWirkungsanzeige(plan: BandAblaufplan): Wirkungsanzeige {
  // Der Text folgt den ZAHLEN des Plans, nicht der Plausibilitaet (DoD): Ein Plan,
  // dessen Angaben absichtlich nicht zueinander passen, wird so angezeigt, wie
  // er lautet - NICHT hier plausibilisiert.
  let text: string
  switch (plan.verhalten) {
    case 'leer':
      // Wirkungsanzeige mit warnung: true - die Folge wuerde NICHTS zeigen
      // (Fehlerpfade-Tabelle).
      text = 'Aus dem Band wuerde nichts angezeigt werden - bei dieser Folge bliebe der Bildausschnitt leer.'
      break
    case 'exakt':
      text = 'Die Folge passt genau in die Videolaenge: sie wird einmal durchgespielt und wiederholt sich nicht.'
      break
    case 'wiederholt':
      text = `Die Folge ist kuerzer als das Video und wiederholt sich bis zum Videoende: ${plan.volleDurchlaeufe} volle Durchlaeufe, dann ${plan.restFrames} Frames Rest.`
      break
    case 'abgeschnitten':
      text = `Die Folge ist laenger als das Video und bricht am Videoende ab: ${plan.volleDurchlaeufe} volle Durchlaeufe, ${plan.restFrames} Frames werden abgeschnitten.`
      break
  }

  // Warnumfang: abgeschnitten, leer oder Nullframe-Abschnitte; bei
  // `wiederholt` ohne Ausfaelle ist nichts ueberraschend.
  const warnung =
    plan.verhalten === 'abgeschnitten' ||
    plan.verhalten === 'leer' ||
    plan.nullFrameIndizes.length > 0

  // Die Positionen (1-basiert) der Abschnitte, die auf 0 Frames runden und im
  // fertigen Video NICHT vorkommen (DoD).
  let ausfallText = ''
  if (plan.nullFrameIndizes.length > 0) {
    const positionen = plan.nullFrameIndizes.map((index) => index + 1).join(', ')
    ausfallText =
      `Diese Abschnittsdauern ergeben 0 Frames und fallen im fertigen Video aus: Position ${positionen}.`
  }

  return { text, warnung, ausfallText }
}

/** Die gewaehlte Band-Vorlage aus dem uebergebenen Bestand; null, wenn sie dort fehlt. */
export function bandVorlage(entwurf: BandEntwurf, vorlagen: readonly Vorlage[]): Vorlage | null {
  // Referenzgleichheit (DoD: toBe-gleich): Der Bestand ist die Quelle; ein
  // tiefen-gleiches Zwillingsobjekt waere nicht die gewaehlte Vorlage.
  return vorlagen.find((vorlage) => vorlage.id === entwurf.bandVorlageId) ?? null
}

/** Der Text, der die gewaehlte Art benennt – „Split-Screen" bzw. „Einblendung"; leer bei null. */
export function artLabel(vorlage: Vorlage | null): string {
  // `vollflaeche` kann als Band nichts heissen: Der Text bleibt leer
  // (Fehlerpfade-Tabelle: `vollflaeche` ist keine Band-Vorlage).
  if (vorlage === null) return ''
  if (vorlage.art === 'split') return 'Split-Screen'
  if (vorlage.art === 'einblendung') return 'Einblendung'
  return ''
}

/**
 * Darf uebernommen werden? true, wenn `bandVorlageId` nicht leer ist UND jede `dauer` eine
 * endliche Zahl > 0 ist UND jede `aktionRef` nicht leer ist. Ein Entwurf OHNE Abschnitte ist
 * ebenfalls uebernehmbar – er entfernt die Einblendung (TK 9.5.3, s. ENTSCHIEDEN 6).
 * Dies ist eine FRUEHE RUECKMELDUNG, KEIN Ersatz fuer die Pruefung des Main (TK 9.1.1 Punkt 6).
 */
export function istUebernehmbar(entwurf: BandEntwurf): boolean {
  // Dieselbe Grenze wie #129, frueh gemeldet statt beim Senden: `trim()`
  // behandelt reine Leerzeichen als leer (dieselbe Konvention wie dauer-regler).
  if (entwurf.bandVorlageId.trim() === '') return false

  // Ein leerer Entwurf ist uebernehmbar und ENTFERNT die Einblendung (TK 9.5.3,
  // ENTSCHIEDEN 6) - sonst waere das Band nicht mehr loszuwerden.
  for (const abschnitt of entwurf.abschnitte) {
    if (abschnitt.aktionRef.trim() === '') return false
    if (typeof abschnitt.dauer !== 'number') return false
    if (!Number.isFinite(abschnitt.dauer)) return false
    if (abschnitt.dauer <= 0) return false
  }
  return true
}
