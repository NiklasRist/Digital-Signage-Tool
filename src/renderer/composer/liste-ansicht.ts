// Issue #248 (M7-55) - liste-ansicht.ts: die reine Ableitung der Anzeigewerte,
// ohne JSX, ohne react, ohne dnd-kit, ohne IPC. Hier sitzt die gesamte Fachlichkeit.
//
// KERNNACHWEIS (TK 9.7.4): "Angezeigte Reihenfolge = gerenderte Reihenfolge -
// keine versteckte Sortierung." baueListenZeilen fuehrt projekt.liste WUERDEGLEICH
// auf; sortieren, gruppieren, filtern ist hier verboten.
//
// Zwei Formatregeln (ENTSCHIEDEN 2): die Dauer EINES Elements benutzt
// formatiereReglerDauer (M7-56/#249) - dieselbe Zahl wie der Regler derselben Zeile;
// formatiereLaenge (#127) ist AUSSCHLIESSLICH die Gesamtlänge. Beide zeigen nie
// dieselbe Zahl in zwei Fassungen.
//
// Das Thumbnail-URTEIL (Asset/Aktion-Referenz) wird hier gefällt, das LADEN macht
// die .tsx (ENTSCHIEDEN 5): Die zurückgegebene Referenz ist DIESELBE
// Objektreferenz wie im Projekt - sie ist die Abhängigkeit des Ladeeffekts und
// damit die Ungültigkeitsregel (#128 baut keinen eigenen Zwischenspeicher).

import type { Project, Listenelement } from '../../shared/contracts/project'
import type { Asset } from '../../shared/contracts/asset'
import type { Aktion } from '../../shared/contracts/aktion'
import type { InlineMeldung } from './optimistisch'
import { haengtAmElement, type KaputteStelle } from './kaputt-erkennung'
import type { ReparaturStand } from './reparatur-fuehrung'
import { RENDER_PROFILE } from '../../shared/contracts/render-profile'
import {
  frameDauer,
  berechneGesamtlaenge,
  formatiereLaenge,
  WARNSCHWELLE_SEKUNDEN,
} from './gesamtlaenge'
import { formatiereReglerDauer } from './element-zeile'

/** Der Ersatzname, wenn die Referenz einer Zeile ins Leere zeigt. EINE Quelle fuer diesen Text. */
export const BEZEICHNUNG_UNBEKANNT = 'Nicht gefunden'

/** Der Ersatztext, wenn die Dauer einer Zeile nicht ermittelbar ist. */
export const DAUER_UNBEKANNT = '—'

/** Eine anzeigefertige Zeile der Wiedergabeliste. Rein abgeleitet, ohne Zustand. */
export interface ListenZeileModell {
  elementId: string
  /** 1-basierte Position in `Project.liste` – so, wie der Nutzer die Liste zählt. */
  position: number
  /** `Asset.originalname` (video|bild) bzw. `Aktion.titel` (segment); sonst BEZEICHNUNG_UNBEKANNT. */
  bezeichnung: string
  artLabel: 'Video' | 'Bild' | 'Aktion'
  /** Frames aus `frameDauer` (#127); 0, wenn sie nicht ermittelbar ist. */
  dauerFrames: number
  /**
   * `formatiereReglerDauer(dauerFrames / RENDER_PROFILE.fps)` (M7-56); DAUER_UNBEKANNT, wenn nicht
   * ermittelbar. AUSDRÜCKLICH NICHT `formatiereLaenge` (#127) – s. ENTSCHIEDEN „ein Format je
   * Zeile". `formatiereLaenge` bleibt der GESAMTLÄNGE vorbehalten (`LaengenAnzeige.text`).
   */
  dauerText: string
  /** true, wenn zu diesem Element eine Stelle der Art 'element_asset' oder 'element_aktion' vorliegt. */
  kaputt: boolean
  /** Indizes der kaputten Band-Abschnitte dieses Elements, aufsteigend. Leer, wenn keiner. */
  kaputteBandAbschnitte: readonly number[]
  /** Indizes der kaputten Unterbrechungen dieses Elements (Fall 4, v3.27), aufsteigend.
   *  Leer, wenn keine. Getrenntes Feld von `kaputteBandAbschnitte`, weil beide Indizes
   *  VERSCHIEDENE Arrays indizieren (#131). */
  kaputteUnterbrechungen: readonly number[]
  /** true, wenn `aktuelleStelle` zu DIESEM Element gehört (Reparatur-Führung, TK 9.7.5). */
  hervorgehoben: boolean
}

/**
 * Die Zeilen in der Reihenfolge von `projekt.liste` – ohne Sortierung, ohne Gruppierung,
 * ohne Filterung. Rein und synchron; wirft nie.
 */
export function baueListenZeilen(
  projekt: Project,
  stellen: readonly KaputteStelle[],
  aktuelleStelle: KaputteStelle | null,
): ListenZeileModell[] {
  // Eine Objekt-Menge aus den Stellen; die Reihenfolge der EINGABE ist irrelevant -
  // ausschlaggebend bleibt ausschliesslich projekt.liste.
  const kaputtElemente = new Set<string>()
  const kaputteBaender = new Map<string, number[]>()
  const kaputteEinschuebe = new Map<string, number[]>()
  for (const stelle of stellen) {
    // #338: Die Marken-Stelle haengt an einer AKTION, nicht an einer Zeile - sie
    // markiert keine Zeile und traegt keinen Index.
    if (!haengtAmElement(stelle)) continue
    if (stelle.art === 'element_asset' || stelle.art === 'element_aktion') {
      kaputtElemente.add(stelle.elementId)
    } else if (stelle.art === 'band_abschnitt') {
      // Die Zeile gilt NICHT als kaputt (Fall 3, TK 9.7.5) - der Index kommt an
      // den Band-Zugang, nicht an die Zeile.
      const bisher = kaputteBaender.get(stelle.elementId) ?? []
      bisher.push(stelle.abschnittIndex)
      kaputteBaender.set(stelle.elementId, bisher)
    } else {
      // unterbrechung (Fall 4, v3.27): ebenfalls KEINE kaputte Zeile - der
      // Einschub ist kein Listenelement; der Index wird an der Videozeile
      // gesammelt. Getrennt vom Band, weil er ein anderes Array indiziert.
      const bisher = kaputteEinschuebe.get(stelle.elementId) ?? []
      bisher.push(stelle.unterbrechungIndex)
      kaputteEinschuebe.set(stelle.elementId, bisher)
    }
  }

  const aktuelleElementId =
    aktuelleStelle !== null && haengtAmElement(aktuelleStelle) ? aktuelleStelle.elementId : null

  return projekt.liste.map((element, abIndex) => {
    const asset =
      element.art === 'video'
        ? projekt.assets.find((eintrag) => eintrag.id === element.ref) ?? null
        : null
    const aktion =
      element.art === 'segment'
        ? projekt.aktionen.find((eintrag) => eintrag.id === element.ref) ?? null
        : null

    const artLabel =
      element.art === 'video' ? 'Video' : element.art === 'segment' ? 'Aktion' : 'Bild'
    const bezeichnung = asset?.originalname ?? aktion?.titel ?? BEZEICHNUNG_UNBEKANNT

    const dauerErgebnis = frameDauer(element)
    const dauerFrames = dauerErgebnis.ok ? dauerErgebnis.wert : 0
    const dauerText = dauerFrames > 0 ? formatiereReglerDauer(dauerFrames / RENDER_PROFILE.fps) : DAUER_UNBEKANNT

    const bandIndizes = kaputteBaender.get(element.id) ?? []
    const einschubIndizes = kaputteEinschuebe.get(element.id) ?? []
    return {
      elementId: element.id,
      position: abIndex + 1,
      bezeichnung,
      artLabel,
      dauerFrames,
      dauerText,
      kaputt: kaputtElemente.has(element.id),
      // Aufsteigend und ohne Dubletten - Unsortierung oder Doppelte in der Eingabe
      // wuerde die Anzeige unzuverlaessig machen.
      kaputteBandAbschnitte: [...new Set(bandIndizes)].sort((a, b) => a - b),
      kaputteUnterbrechungen: [...new Set(einschubIndizes)].sort((a, b) => a - b),
      hervorgehoben: aktuelleStelle !== null && aktuelleElementId === element.id,
    }
  })
}

/** Die ID-Folge für `SortableContext` – exakt die Reihenfolge der Zeilen. */
export function zeilenIds(zeilen: readonly ListenZeileModell[]): string[] {
  return zeilen.map((zeile) => zeile.elementId)
}

/** Woraus das Vorschaubild einer Zeile entsteht. Die ANZEIGE macht die .tsx, das NACHSCHLAGEN hier. */
export type Thumbnailquelle =
  | { art: 'asset'; asset: Asset }
  | { art: 'aktion'; aktion: Aktion }
  | { art: 'fehlt' }

/**
 * Löst `element.ref` im geladenen Projekt auf. Die zurückgegebene Referenz ist DIESELBE
 * Objektreferenz wie im Projekt – die .tsx benutzt sie als Abhängigkeit ihres Ladeeffekts
 * (s. ENTSCHIEDEN 5). Wirft nie.
 */
export function findeThumbnailquelle(element: Listenelement, projekt: Project): Thumbnailquelle {
  if (element.art === 'video') {
    const asset = projekt.assets.find((eintrag) => eintrag.id === element.ref)
    return asset === undefined ? { art: 'fehlt' } : { art: 'asset', asset }
  }
  if (element.art === 'segment') {
    const aktion = projekt.aktionen.find((eintrag) => eintrag.id === element.ref)
    return aktion === undefined ? { art: 'fehlt' } : { art: 'aktion', aktion }
  }
  // art 'bild' ist mit TK v3.16 gestrichen; falls ein alter Stand es noch trägt,
  // ist die Referenz wie eine Asset-Referenz zu behandeln - sonst fehlt.
  const asset = projekt.assets.find((eintrag) => eintrag.id === element.ref)
  return asset === undefined ? { art: 'fehlt' } : { art: 'asset', asset }
}

/** Die Längenanzeige über der Liste. */
export interface LaengenAnzeige {
  /** `formatiereLaenge(sekunden)` (#127); DAUER_UNBEKANNT, wenn die Summe nicht bildbar ist. */
  text: string
  /** true, sobald WARNSCHWELLE_SEKUNDEN überschritten ist (#127). */
  warnung: boolean
  /** Der fertige Warntext; null, wenn `warnung === false`. */
  warntext: string | null
  /** true, wenn `berechneGesamtlaenge` abgelehnt hat – die Zahl ist dann KEINE Aussage. */
  unvollstaendig: boolean
}

export function baueLaengenAnzeige(liste: readonly Listenelement[]): LaengenAnzeige {
  const gesamt = berechneGesamtlaenge([...liste])
  if (!gesamt.ok) {
    // ENTSCHIEDEN 11: KEINE Teilsumme - eine Länge, die Elemente stillschweigend
    // ausspart, ist schlimmer als gar keine; der Nutzer prüft an ihr die Grenze.
    return { text: DAUER_UNBEKANNT, warnung: false, warntext: null, unvollstaendig: true }
  }
  const warntext = gesamt.wert.warnung
    ? `Die Wiedergabeliste ist länger als ${Math.floor(WARNSCHWELLE_SEKUNDEN / 60)} Minuten - der TV-Zyklus wird unhandlich.`
    : null
  return {
    text: formatiereLaenge(gesamt.wert.sekunden),
    // ENTSCHIEDEN 10: `warnung` kommt UNVERÄNDERT aus #127 - die Schwelle wird hier
    // NICHT ein zweites Mal aus sekunden abgeleitet.
    warnung: gesamt.wert.warnung,
    warntext,
    unvollstaendig: false,
  }
}

/** Der Fortschritt des geführten Reparatur-Modus, anzeigefertig. */
export interface ReparaturAnzeige {
  sichtbar: boolean
  behoben: number
  gesamt: number
  /** „X von N behoben"; leer, wenn `sichtbar === false`. */
  text: string
}

export function baueReparaturAnzeige(stand: ReparaturStand | null): ReparaturAnzeige {
  if (stand === null || !stand.aktiv) {
    return { sichtbar: false, behoben: 0, gesamt: 0, text: '' }
  }
  // Die Zahlen kommen UNVERÄNDERT aus #132 ("formuliert X von N NICHT") - hier wird
  // nichts nachgerechnet.
  return {
    sichtbar: true,
    behoben: stand.behoben,
    gesamt: stand.gesamt,
    text: `${stand.behoben} von ${stand.gesamt} behoben`,
  }
}

/** Die zuletzt gemeldete Inline-Meldung der Fehlerklasse 1 (#126). Genau EINE, nie ein Stapel. */
export interface MeldungsLage {
  meldung: InlineMeldung | null
}

export const LEERE_MELDUNGSLAGE: MeldungsLage = { meldung: null }

/** Nimmt eine Meldung auf; liefert einen NEUEN Wert (die Eingabe bleibt unangetastet). */
export function nimmMeldungAuf(meldungsLage: MeldungsLage, meldung: InlineMeldung): MeldungsLage {
  void meldungsLage
  return { meldung }
}

/** Verwirft die Meldung. */
export function verwirfMeldung(meldungsLage: MeldungsLage): MeldungsLage {
  void meldungsLage
  return { meldung: null }
}

// Der Parameter `_lage` in nimmMeldungAuf/verwirfMeldung bleibt bewusst unbeachtet:
// die Lage ist ein WERT, der bisherige Inhalt tritt ersetzt zurück - genau EINE
// Meldung (ENTSCHIEDEN 9).
