// Issue #244 - inhalte.tsx: die Belegung der vier Reiter und die Verteilung der
// Zugaenge. TK 9.14.1 Quelle der Wahrheit:
//   Zusammenstellen = composer [P3] + preview-player [P5]
//   Aktionen        = action-editor [P2] (+ grosse Live-Vorschau HINTER der Wurzel)
//   Vorlagen        = vorlagen-editor
//   Projekte        = projekt-verwaltung (TK 9.14.3)
//
// ENTSCHIEDEN 1: Die fuenf Modul-Wurzeln kommen als PARAMETER, nicht per Import
// (E1 des Meilensteins; als Pflichtfelder eines Typs bleibt kein fehlendes
// Glied unentdeckt - es kompiliert nicht). Deshalb stehen hier nur Typen, keine
// Wert-Importe aus fremden Modulen - die echten Wurzeln werden von App.tsx
// (#262) als Werte importiert und hereingegeben (Naht-Nachtrag erledigt).
//
// ENTSCHIEDEN 2: Zusammenstellen ordnet ZWEI Module nebeneinander an - das ist
// Anordnung, kein Rendern eigener Inhalte (die Zusage aus TK 9.14.2 bleibt
// unangetastet). Bedienentscheidung (23.08., User): Liste LINKS (schmal),
// Vorschau RECHTS (gross). Die grosse Live-Vorschau des Reiters Aktionen
// entsteht im action-editor (template-canvas) und sitzt hinter dessen Wurzel -
// hier stehen je Reiter GENAU die Wurzeln aus TK 9.14.1.
//
// ENTSCHIEDEN 3/5/6: composer und action-editor bekommen den UMHUELLTEN Zugang
// (#243), projekt-verwaltung den ROHEN, die preview-player-Wurzel bekommt
// WERTE (projekt, voraussetzungen), gelesen ueber projektRoh/zeichnen, und der
// vorlagen-editor bekommt KEINEN Projektzugang (Vorlagen sind app-weit,
// TK 9.14.2).
//
// ENTSCHIEDEN 7: Erst hole(), dann aufGeaendert(); die Abmelde-Funktion wird
// beim Abbau gerufen. ENTSCHIEDEN 8: sichtbar wird UNVERAENDERT
// durchgereicht; es wird NICHTS abgebaut (#195 haelt besuchte Reiter
// montiert). ENTSCHIEDEN 9: keine Warteschlangen-Leiste, kein Speicherhinweis
// und keine Meldungsflaeche hier (alle drei sind Schlitze des Rahmens #195).
// ENTSCHIEDEN 10: kein Reiterwechsel in dieser Datei - aufProjekteWechseln
// und wechsleZuZusammenstellen kommen aus der Reiterumgebung. ENTSCHIEDEN 11:
// wechsleZuZusammenstellen heisst GENAU so wie in ProjektVerwaltungWurzelProps
// (#252) und wird unbenannt durchgereicht. ENTSCHIEDEN 12: leereProjektHistorie
// kommt aus #234 (dasselbe Modul, IMPORTIERT - nicht durchgereicht); hier
// wird sie NIE gerufen, sie wird nur gelegt.

import { useEffect, useState, type CSSProperties, type JSX } from 'react'
import type { Project } from '../../shared/contracts/project'
import type { Zeichenvoraussetzungen } from '../composer/zeichen-vorbereitung'
import type { ComposerVerdrahtung } from '../composer/index'
import type { ReiterId } from './reiter'
import type { ReiterInhalt } from './rahmen'
import type { ProjektZugang, VorlagenZugang, ZeichenZugang, MarkenZugang } from './sichten'
import type { Reiterzugaenge } from './inhalte-zugaenge'
import type { Sitzungshalter } from './undo-aufzeichnung-vorlage'
import { Leerzustand } from './leerzustand'
import { zeigtLeerzustand } from './leerzustand-regel'
import { leereProjektHistorie } from './undo-historien'

// ----------------------------------------------------------------------------
// DIE FUENF PROP-TYPEN - zeichengleich zu den definierenden Quellen.
// ----------------------------------------------------------------------------

/** Eigenschaften der Wurzel-Komponente des `composer` (Reiter Zusammenstellen, linke Haelfte).
 *  ZEICHENGLEICH zu `ComposerWurzelProps` in #261 (`src/renderer/composer/index.tsx`). */
export interface ComposerWurzelProps {
  sichtbar: boolean
  /** UMHUELLTER Projektzugang (#243). */
  projekt: ProjektZugang
  zeichnen: ZeichenZugang
  vorlagen: VorlagenZugang
  /** ZUSAETZLICH gegenueber der ersten Fassung dieses Issues – ohne dieses Buendel ist der Reiter
   *  unvollstaendig: kein Medien-Import (FA-03) und kein Anschluss an die Reparatur-Fuehrung
   *  (FA-19). Wird UNVERAENDERT aus `umgebung.composerVerdrahtung` durchgereicht. */
  verdrahtung: ComposerVerdrahtung
}

/** Eigenschaften der Wurzel-Komponente des `action-editor` (Reiter Aktionen). */
export interface ActionEditorWurzelProps {
  sichtbar: boolean
  /** UMHUELLTER Projektzugang (#243). */
  projekt: ProjektZugang
  zeichnen: ZeichenZugang
  vorlagen: VorlagenZugang
  /** NEU (#313, ENTSCHIEDEN 2): Zugang zum app-weiten Marken-Bestand, AUSSCHLIESSLICH als
   *  Auswahlliste fuer die Markenwahl einer Aktion (FA-23, Setzweg in #319). NICHT die Marke zum
   *  Zeichnen – die holt die Wurzel je Aktion ueber holeBereiteMarke (#312). Wird UNVERAENDERT
   *  (`toBe`) durchgereicht; diese Datei ruft keine seiner drei Funktionen auf. */
  marken: MarkenZugang
  /** Die hervorzuhebende Aktion aus der Reparatur-Fuehrung (#201); null = keine. */
  hervorgehobeneAktionId: string | null
}

/** Eigenschaften der Wurzel-Komponente des `vorlagen-editor` (Reiter Vorlagen). */
export interface VorlagenEditorWurzelProps {
  sichtbar: boolean
  vorlagen: VorlagenZugang
  zeichnen: ZeichenZugang
  /** NEU (#313-Nachzug 08.10.2026, User-Entscheidung Variante (b)): die AUSWAHLLISTE
   *  „Vorschau gegen Marke". Liste nur fuer die Wahl – gezeichnet wird ueber
   *  stelleMarkeBereit/holeBereiteMarke (#312). Default: die Marke mit `eingebaut: true`. */
  marken: MarkenZugang
  /** Der Sitzungshalter der Shell (#245) – er haelt die Arbeitskopie ueber den Reiterwechsel
   *  hinweg und loest die Undo-Schnappschuesse aus. KEIN Projektzugang (ENTSCHIEDEN 6). */
  sitzung: Sitzungshalter
}

/** Eigenschaften der Wurzel-Komponente der `projekt-verwaltung` (Reiter Projekte).
 *  ZEICHENGLEICH zu `ProjektVerwaltungWurzelProps` in #252
 *  (`src/renderer/projekt-verwaltung/index.tsx`). */
export interface ProjektVerwaltungWurzelProps {
  sichtbar: boolean
  /** ROHER Projektzugang (#243) – ein Projektwechsel ist kein Bearbeitungsschritt. */
  projekt: ProjektZugang
  /** ZUSAETZLICH gegenueber der ersten Fassung dieses Issues – ohne diese drei ist der
   *  Projektwechsel unvollstaendig: `ProjektWechselWirkungen` (#224) und `LoeschWirkungen`
   *  (#226) sind ueber `ProjektZugang` allein NICHT bildbar. */
  zeichnen: ZeichenZugang
  leereProjektHistorie: () => void
  wechsleZuZusammenstellen: () => void
}

/** Eigenschaften der Vorschau – ZEICHENGLEICH aus #242 uebernommen. */
export interface VorschauWurzelProps {
  projekt: Project | null
  voraussetzungen: Zeichenvoraussetzungen | null
  sichtbar: boolean
}

/**
 * Die vier Modul-Wurzeln. Sie werden als PARAMETER uebergeben, NICHT importiert (ENTSCHIEDEN 1).
 * Das Pflichtfeld je Wurzel erzwingt, dass keine vergessen werden kann.
 */
export interface ModulWurzeln {
  composer: (eigenschaften: ComposerWurzelProps) => JSX.Element
  vorschau: (eigenschaften: VorschauWurzelProps) => JSX.Element
  actionEditor: (eigenschaften: ActionEditorWurzelProps) => JSX.Element
  vorlagenEditor: (eigenschaften: VorlagenEditorWurzelProps) => JSX.Element
  projektVerwaltung: (eigenschaften: ProjektVerwaltungWurzelProps) => JSX.Element
}

/** Was diese Datei ausser den Zugaengen braucht und selbst NICHT ermittelt. */
export interface Reiterumgebung {
  /** Der Weg zum Reiter Projekte fuer den Leerzustand (#198). Der Aufrufer bildet ihn aus
   *  `wechsleReiter('projekte')` (#194) – diese Datei wechselt selbst KEINEN Reiter. */
  aufProjekteWechseln: () => void
  /** Der Weg zum Reiter Zusammenstellen fuer die `projekt-verwaltung` (TK 9.14.3). Wird
   *  UNVERAENDERT in `ProjektVerwaltungWurzelProps` gelegt (ENTSCHIEDEN 11); diese Datei
   *  ruft ihn NIE selbst. */
  wechsleZuZusammenstellen: () => void
  /** Das Verdrahtungs-Buendel des `composer` (#261). Wird UNVERAENDERT gereicht; diese
   *  Datei ruft keines seiner Felder (kein Lesen, keine Ergaenzung). */
  composerVerdrahtung: ComposerVerdrahtung
  /** Die hervorzuhebende Aktion (#201). Wird UNVERAENDERT durchgereicht, auch als null. */
  hervorgehobeneAktionId: string | null
  /** Der Sitzungshalter des Vorlagen-Editors (#245). Wird UNVERAENDERT durchgereicht;
   *  keine seiner Funktionen wird hier gerufen. */
  vorlagenSitzung: Sitzungshalter
}

// ----------------------------------------------------------------------------
// Die Anordnung des Reiters Zusammenstellen (ENTSCHIEDEN 2, Bedienentscheidung
// 23.08.): Liste LINKS (schmal), Vorschau RECHTS (gross). Nur Ordnung - keine
// Fachlogik, keine Beschriftung, keine verschiebbare Trennlinie.
// ----------------------------------------------------------------------------
const REIHE: CSSProperties = {
  display: 'flex',
  gap: 8,
  height: '100%',
  minHeight: 0,
  padding: 8,
  boxSizing: 'border-box',
}
const LISTE: CSSProperties = { width: 320, minWidth: 260, flexShrink: 0, minHeight: 0 }
const BUEHNE: CSSProperties = { flex: 1, minWidth: 0, minHeight: 0, position: 'relative' }

/**
 * Belegt die vier Reiter. Der Rückgabewert ist genau das, was #195 als `inhalte` erwartet.
 * Kein `Ergebnis<T>`, kein `async`, kein `throw`.
 */
export function baueReiterInhalte(
  zugaenge: Reiterzugaenge,
  wurzeln: ModulWurzeln,
  umgebung: Reiterumgebung,
): Record<ReiterId, ReiterInhalt> {
  // ENTSCHIEDEN 7: Beim Aufbau erst hole() (Initialisierung der Ansicht),
  // DANN aufGeaendert(); die Rueckgabe des Abonnements ist die Aufraeum-Funktion
  // des Effekts. Gelesen wird UEBERDEN ROHEN Zugang (ENTSCHIEDEN 4).
  function ProjektStandReiter(pruefEigenschaften: {
    sichtbar: boolean
    reiter: ReiterId
    kindOffen: (sichtbar: boolean, projekt: Project) => JSX.Element
  }): JSX.Element {
    const { sichtbar, reiter, kindOffen } = pruefEigenschaften
    const [sicht, setzeSicht] = useState(() => zugaenge.projektRoh.hole())
    useEffect(() => {
      const abmelden = zugaenge.projektRoh.aufGeaendert(setzeSicht)
      return () => {
        abmelden()
      }
      // Das Abonnement bleibt fuer die Lebensdauer der Komponente dieselbe Quelle.
    }, [])
    // ENTSCHIEDEN 8: sichtbar wird unveraendert durchgereicht - der Reiterinhalt
    // wird bei sichtbar: false NICHT abgebaut, das Modul entscheidet selbst.
    if (sicht.projekt !== null) {
      return kindOffen(sichtbar, sicht.projekt)
    }
    // Der Leerzustand ohne offenes Projekt - nur fuer zusammenstellen/aktionen
    // (zeigtLeerzustand ist die EINZIGE Quelle der Regel, #198).
    if (zeigtLeerzustand(reiter, false)) {
      return (
        <Leerzustand
          reiter={reiter as 'zusammenstellen' | 'aktionen'}
          aufProjekteWechseln={umgebung.aufProjekteWechseln}
        />
      )
    }
    // Fuer 'vorlagen'/'projekte' tritt dieser Fall fachlich nie auf - diese
    // beiden Reiter haengen ihre Wurzeln direkt ein, ohne Projektstand.
    return null as unknown as JSX.Element
  }

  // Der Offene-Teil des Reiters Zusammenstellen: GENAU zwei Module, Liste
  // links, Vorschau rechts (ENTSCHIEDEN 2). Die Vorschau bekommt WERTE
  // (ENTSCHIEDEN 5): projekt aus dem ROHEN Stand, voraussetzungen via
  // zeichnen.hole().
  const vereinigteOffenZusammenstellen = (sichtbar: boolean, projekt: Project) => (
    <div style={REIHE}>
      <div style={LISTE}>
        {wurzeln.composer({
          sichtbar,
          projekt: zugaenge.projektBearbeitung,
          zeichnen: zugaenge.zeichnen,
          vorlagen: zugaenge.vorlagen,
          verdrahtung: umgebung.composerVerdrahtung,
        })}
      </div>
      <div style={BUEHNE}>
        {wurzeln.vorschau({
          projekt,
          voraussetzungen: zugaenge.zeichnen.hole(),
          sichtbar,
        })}
      </div>
    </div>
  )

  // Der Offene-Teil des Reiters Aktionen: GENAU eine Wurzel, der UMHUELLTE
  // Zugang; die hervorzuhebende Aktion wird nur DURCHGEREICHT (Verbot: kein
  // zweiter Weg dorthin).
  const aktionenOffen = (sichtbar: boolean) =>
    wurzeln.actionEditor({
      sichtbar,
      projekt: zugaenge.projektBearbeitung,
      zeichnen: zugaenge.zeichnen,
      vorlagen: zugaenge.vorlagen,
      marken: zugaenge.marken,
      hervorgehobeneAktionId: umgebung.hervorgehobeneAktionId,
    })

  const reiterAktionen = (reiterEigenschaften: { sichtbar: boolean }) => (
    <ProjektStandReiter
      reiter="aktionen"
      sichtbar={reiterEigenschaften.sichtbar}
      kindOffen={aktionenOffen}
    />
  )

  return {
    zusammenstellen: (reiterEigenschaften) => (
      <ProjektStandReiter
        reiter="zusammenstellen"
        sichtbar={reiterEigenschaften.sichtbar}
        kindOffen={vereinigteOffenZusammenstellen}
      />
    ),
    aktionen: (reiterEigenschaften) => reiterAktionen(reiterEigenschaften),
    // ENTSCHIEDEN 6: KEIN Projektzugang; der Sitzungshalter wird unveraendert
    // durchgereicht (ENTSCHIEDEN 12-Grundlage: Vorlagen sind app-weit).
    vorlagen: (reiterEigenschaften) =>
      wurzeln.vorlagenEditor({
        sichtbar: reiterEigenschaften.sichtbar,
        vorlagen: zugaenge.vorlagen,
        zeichnen: zugaenge.zeichnen,
        marken: zugaenge.marken,
        sitzung: umgebung.vorlagenSitzung,
      }),
    // Zusaetzlich zu #243 (entschieden): der ROHE Zugan (kein Projektwechsel
    // ist ein Bearbeitungsschritt). leereProjektHistorie wird nur GELEGT
    // (ENTSCHIEDEN 12) und hier nie gerufen.
    projekte: (reiterEigenschaften) =>
      wurzeln.projektVerwaltung({
        sichtbar: reiterEigenschaften.sichtbar,
        projekt: zugaenge.projektRoh,
        zeichnen: zugaenge.zeichnen,
        leereProjektHistorie,
        wechsleZuZusammenstellen: umgebung.wechsleZuZusammenstellen,
      }),
  }
}

export { verteileZugaenge, type Reiterzugaenge } from './inhalte-zugaenge'
