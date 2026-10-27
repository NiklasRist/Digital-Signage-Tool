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
import type { Ergebnis } from '../../shared/contracts/ergebnis'
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
  /** NEU (#338): der Marken-Bestand fuer die Kaputt-Erkennung. Wird UNVERAENDERT
   *  durchgereicht; diese Datei ruft keine seiner drei Funktionen auf. */
  marken: MarkenZugang
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

/** Eigenschaften der Wurzel-Komponente des `marken-editor` (Reiter Marken, TK 9.14.1).
 *  DEFINIERENDE QUELLE (#314) – die Komponente selbst baut #330
 *  (`src/renderer/marken-editor/index.tsx`).
 *  KEIN Projektzugang: Der Marken-Bestand ist app-weit und gehört keinem Projekt (TK 9.14.2) –
 *  dieselbe Festlegung, die #244 für den `vorlagen-editor` getroffen hat (ENTSCHIEDEN 6). */
export interface MarkenEditorWurzelProps {
  sichtbar: boolean
  /** Zugang zum app-weiten Marken-Bestand (#305/#311). Wird UNVERAENDERT durchgereicht;
   *  diese Datei ruft keine seiner drei Funktionen auf. */
  marken: MarkenZugang
  /** Zugang zur Vorlagen-Sicht (#155). Drittes Feld seit der Entscheidung A1 vom 22.10.2026:
   *  die Live-Vorschau braucht die feste Vorlage „Vollbild". Wird UNVERAENDERT durchgereicht;
   *  diese Datei ruft keine seiner drei Funktionen auf. */
  vorlagen: VorlagenZugang
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
  /** SECHSTES Feld (#324/#399): der Marken-Zugang fuer die Standardmarke-Auswahl
   *  der Projektzeilen. Wird UNVERAENDERT (`toBe`) durchgereicht. */
  marken: MarkenZugang
  wechsleZuZusammenstellen: () => void
  /** SIEBTES Feld (#423): „Video zuerst" - oeffnet nur den Video-Dialog. Wird
   *  UNVERAENDERT durchgereicht. */
  waehleVideoPfad: () => Promise<Ergebnis<{ pfade: string[] }, string>>
  /** ACHTES Feld (#423): reiht den gewaehlten Video-Pfad ein (derselbe Weg wie der
   *  Composer-Knopf). Wird UNVERAENDERT durchgereicht. */
  importiereVideoPfad: (projektId: string, pfad: string) => void
}

/** Eigenschaften der Vorschau – ZEICHENGLEICH aus #242 uebernommen. */
export interface VorschauWurzelProps {
  projekt: Project | null
  voraussetzungen: Zeichenvoraussetzungen | null
  sichtbar: boolean
}

/**
 * Die Modul-Wurzeln. Sie werden als PARAMETER uebergeben, NICHT importiert (ENTSCHIEDEN 1).
 * Das Pflichtfeld je Wurzel erzwingt, dass keine vergessen werden kann.
 * SECHS Wurzeln seit #314: `markenEditor` ist Pflicht - sein Fehlen kompiliert nicht.
 */
export interface ModulWurzeln {
  composer: (eigenschaften: ComposerWurzelProps) => JSX.Element
  vorschau: (eigenschaften: VorschauWurzelProps) => JSX.Element
  actionEditor: (eigenschaften: ActionEditorWurzelProps) => JSX.Element
  vorlagenEditor: (eigenschaften: VorlagenEditorWurzelProps) => JSX.Element
  markenEditor: (eigenschaften: MarkenEditorWurzelProps) => JSX.Element
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
  /** #423: oeffnet NUR den Video-Dialog (Video zuerst beim Anlegen - Pflicht). Wird
   *  UNVERAENDERT in `ProjektVerwaltungWurzelProps` gelegt; diese Datei ruft ihn NIE. */
  waehleVideoPfad: () => Promise<Ergebnis<{ pfade: string[] }, string>>
  /** #423: reiht den gewaehlten Video-Pfad als Import-Auftrag ein (derselbe Weg wie der
   *  Composer-Knopf). Wird UNVERAENDERT durchgereicht. */
  importiereVideoPfad: (projektId: string, pfad: string) => void
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
// #414 (Oberflaeche 2.0): Spalte fuer Zusammenstellen - Vorschau oben, Composer unten.
const SPALTE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  height: '100%',
  minHeight: 0,
  padding: 8,
  boxSizing: 'border-box',
}
const BUEHNE_OBEN: CSSProperties = { height: '38%', flexShrink: 0, minHeight: 200, minWidth: 0, position: 'relative' }
const COMPOSER_UNTEN: CSSProperties = { flex: 1, minWidth: 0, minHeight: 0 }

/**
 * BUGFIX (Die Naht-Hooks, 08.10.): die STABLE Komponente, die den inline-Aufruf
 * `kindOffen(...)` von #244 als echtes Element aufnimmt. Die Hooks der gerufenen
 * Wurzel gehoeren DAMIT ihrer eigenen Faser; ein Mount zwischen "kein Projekt"
 * und "Projekt" veraendert die Hook-Zahl NICHT innerhalb einer Instanz, sondern
 * mountet eine Neue. Der Browserbegeisterte Beleg: der Test "Die Naht-Hooks
 * (BUGFIX)" in inhalte-reiter.spec.ts - ohne diesen Fix wirft er EXAKT den
 * Weiß-Screen-Fehler ("Rendered more hooks").
 */
function ProjektKindWurzel({
  sichtbar,
  projekt,
  kindOffen,
}: {
  sichtbar: boolean
  projekt: Project
  kindOffen: (sichtbar: boolean, projekt: Project) => JSX.Element
}): JSX.Element {
  return kindOffen(sichtbar, projekt)
}

/**
 * Belegt die vier Reiter. Der Rückgabewert ist genau das, was #195 als `inhalte` erwartet.
 * Kein `Ergebnis<T>`, kein `async`, kein `throw`.
 */
export function baueReiterInhalte(
  zugaenge: Reiterzugaenge,
  wurzeln: ModulWurzeln,
  holeUmgebung: () => Reiterumgebung,
): Record<ReiterId, ReiterInhalt> {
  // ENTSCHIEDEN 7: Beim Aufbau erst hole() (Initialisierung der Ansicht),
  // DANN aufGeaendert(); die Rueckgabe des Abonnements ist die Aufraeum-Funktion
  // des Effekts. Gelesen wird UEBERDEN ROHEN Zugang (ENTSCHIEDEN 4).
  function ProjektStandReiter(pruefEigenschaften: {
    sichtbar: boolean
    reiter: ReiterId
    kindOffen: (sichtbar: boolean, projekt: Project) => JSX.Element
  }): JSX.Element {
    const umgebung = holeUmgebung()
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
    // BUGFIX (Naht-Hooks, 08.10.): der inline-Aufruf `kindOffen(...)` rechnte die
    // Hooks der Wurzel DER Instanz ProjektStandReiter zu; wechselte dieselbe
    // Instanz von "kein Projekt" zu "Projekt" (das NORMALFALL beim Anlegen),
    // tauchten Hook-Plätze ZUSAETZLICH auf und React warf "Rendered more hooks" -
    // die ganze Oberfläche wurde weiß. Als echtes ELEMENT mountet die Wurzel
    // FRISCH und zählt ihre Hooks selbst (eine Hook-Zähleränderung ist bei
    // einem Mount unbedenklich). Die kindOffen-Signatur bleibt UNVERAENDERT.
    if (sicht.projekt !== null) {
      return (
        <ProjektKindWurzel sichtbar={sichtbar} projekt={sicht.projekt} kindOffen={kindOffen} />
      )
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

  // Der Offene-Teil des Reiters Zusammenstellen - OBERFLAECHE-2.0-LAYOUT (#414,
  // gemeldete Ausnahme zur alten Entscheiden-2-Geometrie "Liste links/Vorschau
  // rechts"): Der User-Wortlaut 14.10.2026 ist "das Video im ZENTRUM"; die
  // Buehne steht OBEN zentriert ueber der vollen Breite, der Composer (Bibliothek
  // links, Zeitleiste unten) darunter. Beide Module bleiben DIESELBEN zwei
  // Bausteine - nur die Geometrie teilt sie in Zeilen statt Spalten.
  const vereinigteOffenZusammenstellen = (sichtbar: boolean, projekt: Project) => {
    const umgebung = holeUmgebung()
    return (
      <div style={SPALTE}>
        <div style={BUEHNE_OBEN}>
          {wurzeln.vorschau({
            projekt,
            voraussetzungen: zugaenge.zeichnen.hole(),
            sichtbar,
          })}
        </div>
        <div style={COMPOSER_UNTEN}>
          {wurzeln.composer({
            sichtbar,
            projekt: zugaenge.projektBearbeitung,
            zeichnen: zugaenge.zeichnen,
            vorlagen: zugaenge.vorlagen,
            marken: zugaenge.marken,
            verdrahtung: umgebung.composerVerdrahtung,
          })}
        </div>
      </div>
    )
  }

  // Der Offene-Teil des Reiters Aktionen: GENAU eine Wurzel, der UMHUELLTE
  // Zugang; die hervorzuhebende Aktion wird nur DURCHGEREICHT (Verbot: kein
  // zweiter Weg dorthin).
  const aktionenOffen = (sichtbar: boolean) => {
    const umgebung = holeUmgebung()
    return wurzeln.actionEditor({
      sichtbar,
      projekt: zugaenge.projektBearbeitung,
      zeichnen: zugaenge.zeichnen,
      vorlagen: zugaenge.vorlagen,
      marken: zugaenge.marken,
      hervorgehobeneAktionId: umgebung.hervorgehobeneAktionId,
    })
  }

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
    vorlagen: (reiterEigenschaften) => {
      const umgebung = holeUmgebung()
      return wurzeln.vorlagenEditor({
        sichtbar: reiterEigenschaften.sichtbar,
        vorlagen: zugaenge.vorlagen,
        zeichnen: zugaenge.zeichnen,
        marken: zugaenge.marken,
        sitzung: umgebung.vorlagenSitzung,
      })
    },
    // Der fuenfte Reiter (TK 9.14.1, #314): GENAU eine Wurzel, OHNE Projektabfrage und
    // OHNE Leerzustand (Marken sind app-weit, TK 9.14.2); auch ohne offenes Projekt
    // voll benutzbar. Nichts wird hier geholt, abonniert oder gelesen.
    marken: (reiterEigenschaften) =>
      wurzeln.markenEditor({
        sichtbar: reiterEigenschaften.sichtbar,
        marken: zugaenge.marken,
        vorlagen: zugaenge.vorlagen,
      }),
    // Zusaetzlich zu #243 (entschieden): der ROHE Zugan (kein Projektwechsel
    // ist ein Bearbeitungsschritt). leereProjektHistorie wird nur GELEGT
    // (ENTSCHIEDEN 12) und hier nie gerufen.
    projekte: (reiterEigenschaften) => {
      const umgebung = holeUmgebung()
      return wurzeln.projektVerwaltung({
        sichtbar: reiterEigenschaften.sichtbar,
        projekt: zugaenge.projektRoh,
        zeichnen: zugaenge.zeichnen,
        leereProjektHistorie,
        wechsleZuZusammenstellen: umgebung.wechsleZuZusammenstellen,
        marken: zugaenge.marken,
        waehleVideoPfad: umgebung.waehleVideoPfad,
        importiereVideoPfad: umgebung.importiereVideoPfad,
      })
    },
  }
}

export { verteileZugaenge, type Reiterzugaenge } from './inhalte-zugaenge'
