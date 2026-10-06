// Issue #242 - vorschau-auswahl.ts: die reine Auswahl des Vorschau-Bilds und
// die reine Takt-Hilfsrechnung. Kein JSX, kein react, kein Laden, kein Zeichnen,
// kein Wurf - und ohne Browser pruefbar.
//
// Die ABLAUFSORDNUNG von waehleVorschaubild ist Vertrag ( TK 9.9.2): leer ->
// Element (mit Identitaets-Nachweis) -> kaputte Stelle -> Verzweigung nach
// element.art. Sie bricht beim ersten Treffer ab.
//
// ENTSCHIEDEN 1 (Invariante 4 des Meilensteins): Hier wird nichts gerechnet,
// was schon gerechnet wird - die Achse kommt aus #213, der Bandtakt aus #220,
// die Geometrie aus #218/#219 (die selbst aus berechneBandGeometrie #239
// beziehen). „Nicht nach derselben Formel, sondern mit derselben Funktion".
//
// ENTSCHIEDEN 8: Passt die elementId des Abschnitts nicht zum Element an
// seinem Index (Achse und Liste koennen kurz auseinanderstehen), wird NICHTS
// gezeigt - ein falsch zugeordnetes Bild waere eine Vorschau, die luegt.
//
// Zum Elementart-Bestand: Listenelement.art kennt seit TK v3.16 nur noch
// 'video' | 'segment' (#15, Streeichung von 'bild'); jeder Bild-Zweig ist
// entfallen. ENTSCHIEDEN 4: 'vorlage_unbekannt'/'schriften_fehlen' ergeben
// eine LEERE Flaeche - KaputtGrund (#131) kennt keinen vierten Grund, und
// einen zu erfinden waere eine Vertragsaenderung eines fremden Issues.
// ENTSCHIEDEN 5/6: keine Band-Vorlage (unbekannt, vollflaeche, hoehe null)
// heisst ein flaches Video; kein akzeptierbarer Abschnitt - oder eine
// unbekannte Aktion darin - heisst bandAktion: null (kein Band gezeichnet).

import type { Project } from '../../shared/contracts/project'
import type { Aktion } from '../../shared/contracts/aktion'
import type { Vorlage } from '../../shared/contracts/vorlage'
import type { KaputtGrund, KaputteStelle } from '../composer/kaputt-erkennung'
import type { Achsenabschnitt } from './zeitachse'
import { findeSegmentquelle } from './segment-quelle'
import { baueBandtakt, waehleAbschnitt } from './band-takt'

/**
 * Was auf der Buehne steht – als WERT, nicht als JSX. Genau eine Variante je Baustein aus
 * #215 bis #219 und #221, plus `leer` fuer „nichts zu zeigen".
 */
export type Vorschaubild =
  | { art: 'leer' }
  | { art: 'platzhalter'; grund: KaputtGrund; titel?: string }
  | { art: 'video'; assetId: string; dateiname: string; trimStart: number; trimEnde: number }
  | { art: 'segment'; aktion: Aktion; vorlage: Vorlage }
  | {
      art: 'split'
      assetId: string
      dateiname: string
      trimStart: number
      trimEnde: number
      bandVorlage: Vorlage
      bandAktion: Aktion | null
    }
  | {
      art: 'einblendung'
      assetId: string
      dateiname: string
      trimStart: number
      trimEnde: number
      bandVorlage: Vorlage
      bandAktion: Aktion | null
    }
// `assetId` ist IMMER `asset.id` (#13) desselben Assets, aus dem auch `dateiname` stammt – NIE
// `element.ref` und NIE der Dateiname. Sie geht unveraendert in `VideoProps.assetId` (#216) und
// ist dort der SCHLUESSEL des Handle-Registers (#246). Ohne sie meldet sich das `<video>` der
// Vorschau nirgends an, und das Loeschen scheitert unter Windows am offenen Handle (TK 9.4.6).
// Nur die videotragenden Varianten fuehren sie: TK 9.4.6 nennt ausdruecklich nur den
// `<video>`-Handle.

/**
 * Waehlt das Bild fuer GENAU EINEN Frame. REINE Funktion: liest nur ihre Argumente, laedt nichts,
 * zeichnet nichts, rechnet keine Dauer und keine Geometrie, wirft nie und traegt KEINE
 * Ergebnis-Huelle (TK 9.9.2: der preview-player prueft nichts und meldet keine Fehlercodes).
 */
export function waehleVorschaubild(
  projekt: Project,
  abschnitt: Achsenabschnitt | null,
  lokalerFrame: number,
  vorlagen: readonly Vorlage[],
  kaputteStellen: readonly KaputteStelle[],
  schriftenBereit: boolean,
): Vorschaubild {
  // Schritt 1: vor dem ersten Frame, am Ende der Liste, leere Liste - kein Fehler.
  if (abschnitt === null) {
    return { art: 'leer' }
  }

  // Schritt 2: das Element holen und die Identitaet pruefen (ENTSCHIEDEN 8).
  const element = projekt.liste[abschnitt.index]
  if (element === undefined || element.id !== abschnitt.elementId) {
    return { art: 'leer' }
  }

  // Schritt 3: die erste kaputte Stelle DIESER Art suchen. Alle uebrigen
  // kaputten Stellen (element_aktion mit asset_fehlt/asset_unbekannt und JEDE
  // band_abschnitt-Stelle) fuehren NICHT hierher - sie werden normal gezeichnet
  // (ENTSCHIEDEN 3, die Tabelle aus #221).
  const kaputt = kaputteStellen.find(
    (stelle) =>
      stelle.elementId === element.id &&
      (stelle.art === 'element_asset' ||
        (stelle.art === 'element_aktion' && stelle.grund === 'aktion_unbekannt')),
  )
  if (kaputt !== undefined) {
    // Schritt 4: der Titel; ist nichts auffindbar, bleibt der Titel WEG (kein
    // Ersatzname). Bei element_asset der Asset-Originalname, bei einer
    // unbekannten Aktion ihr Titel.
    if (kaputt.art === 'element_asset') {
      const asset = projekt.assets.find((kandidat) => kandidat.id === kaputt.assetId)
      if (asset === undefined) {
        return { art: 'platzhalter', grund: kaputt.grund }
      }
      return { art: 'platzhalter', grund: kaputt.grund, titel: asset.originalname }
    }
    const aktion = projekt.aktionen.find((kandidat) => kandidat.id === kaputt.aktionId)
    if (aktion === undefined) {
      return { art: 'platzhalter', grund: kaputt.grund }
    }
    return { art: 'platzhalter', grund: kaputt.grund, titel: aktion.titel }
  }

  // Schritt 5: nach element.art verzweigen ('bild' ist seit TK v3.16 gestrichen).
  if (element.art === 'segment') {
    const quelle = findeSegmentquelle(element.ref, projekt.aktionen, vorlagen, schriftenBereit)
    if (quelle.zustand === 'bereit') {
      return { art: 'segment', aktion: quelle.aktion, vorlage: quelle.vorlage }
    }
    // ENTSCHIEDEN 4: unbekannte Vorlage und fehlende Schriften sind KEIN
    // Platzhalter - KaputtGrund kennt diese Gruende nicht. Leere Flaeche,
    // die nichts behauptet.
    if (quelle.zustand === 'aktion_unbekannt') {
      return { art: 'platzhalter', grund: 'aktion_unbekannt' }
    }
    return { art: 'leer' }
  }

  // element.art === 'video'. Das Asset - beides derselbe Fund:
  // assetId UND dateiname, auf KEINEN Fall element.ref als Kennung.
  const asset = projekt.assets.find((kandidat) => kandidat.id === element.ref)
  if (asset === undefined) {
    return { art: 'leer' }
  }
  const assetId = asset.id
  const dateiname = asset.dateiname
  // Der Ausweichwert 0 ist unerreichbar (baueZeitachse scheitert vorher an
  // frameDauer); er steht nur da, weil der Vertrag die Felder als null fuehrt.
  const trimStart = element.trimStart ?? 0
  const trimEnde = element.trimEnde ?? 0

  // Keine Einblendung: ein flaches Video.
  if (element.einblendung === null) {
    return { art: 'video', assetId, dateiname, trimStart, trimEnde }
  }

  // ENTSCHIEDEN 5: keine brauchbare Band-Vorlage heisst KEIN Band, keine
  // Meldung - der preview-player prueft nichts und meldet keine Fehlercodes.
  const einblendung = element.einblendung
  const bandVorlage = vorlagen.find((kandidat) => kandidat.id === einblendung.bandVorlageId)
  if (
    bandVorlage === undefined ||
    bandVorlage.art === 'vollflaeche' ||
    bandVorlage.höhe === null
  ) {
    return { art: 'video', assetId, dateiname, trimStart, trimEnde }
  }

  // Der sichtbare Abschnitt; null = kein Band gezeichnet (ENTSCHIEDEN 6) -
  // ebenso, wenn die Aktion des Abschnitts im Projekt fehlt.
  const takt = baueBandtakt(einblendung)
  const ausgewaehlt = waehleAbschnitt(takt, lokalerFrame, abschnitt.frames)
  let bandAktion: Aktion | null = null
  if (ausgewaehlt !== null) {
    bandAktion =
      projekt.aktionen.find((kandidat) => kandidat.id === ausgewaehlt.aktionRef) ?? null
  }

  if (bandVorlage.art === 'split') {
    return { art: 'split', assetId, dateiname, trimStart, trimEnde, bandVorlage, bandAktion }
  }
  return { art: 'einblendung', assetId, dateiname, trimStart, trimEnde, bandVorlage, bandAktion }
}

/**
 * Verstrichene Zeit zwischen zwei Bildtakten in Millisekunden.
 * `letzterMs === null` bedeutet „erster Takt nach einem Start" und liefert IMMER 0 – das ist die
 * Absicherung gegen den Sprung nach einer Pause (s. ENTSCHIEDEN 7).
 * Total: wirft nie. Nicht brauchbare Werte werden NICHT geglaettet – das erledigt `tick` (#214).
 */
export function taktDelta(jetztMs: number, letzterMs: number | null): number {
  if (letzterMs === null) return 0
  return jetztMs - letzterMs
}

/**
 * Ob der Bildtakt laufen soll: NUR wenn die Uhr laeuft UND der Reiter sichtbar ist.
 * Steht hier und nicht als Bedingung im JSX, damit die wichtigste Regel dieses Issues ohne
 * Browser pruefbar ist (s. ENTSCHIEDEN 7).
 */
export function taktSollLaufen(laeuft: boolean, sichtbar: boolean): boolean {
  return laeuft && sichtbar
}
