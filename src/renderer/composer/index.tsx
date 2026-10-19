// [composer] Modul-Wurzel: die Bausteine anordnen und verdrahten

import { useEffect, useState, useRef, type JSX } from 'react'

import type { Listenelement, Project, Bearbeitungsstand } from '../../shared/contracts/project'
import type { Aktion } from '../../shared/contracts/aktion'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { ProjektZugang, VorlagenZugang, ZeichenZugang } from '../app-shell/sichten'
import type { ReparaturStand } from './reparatur-fuehrung'
import type { ListenZeileModell } from './liste-ansicht'
import type { Uebergabe } from './reparatur-optionen'
import type { MedienImportStarter } from './medien-import'
import type { Projektsicht } from './projektzustand'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
// #414 (Oberflaeche 2.0): EIN DndContext auf Wurzel-Ebene - Quellen (#413) und
// Kanten (#412) im selben Kontext. Der DnD-Zustand (neuZug/aktiveKante/laedtKante)
// liegt im Hook `verwendeZeitleistenZug` (S5); die Zeitleiste ist die Praesentation
// (korbRef = Messraum).
import { Zeitleiste } from './zeitleiste.tsx'
import { EA_PX_PRO_SEKUNDE, ZOOM_STUFEN } from './zeitband'
import { fuegeElementHinzu } from './element-hinzufuegen'
// NACHTRAG #248 (Variante A, 05.10.): Die ad-hoc-Wiedergabeliste dieser Wurzel
// (DndContext/Zeile/Regler unten) ist hier durch die Issue-richtige
// `Wiedergabeliste` aus liste-ansicht.tsx (#248) ERSETZT - dokumentierte Ausnahme
// vom Nicht-ndern-Verbot des Composer-Issues, im Nachtrag auf #248 begrndet.
// Die Bedienung kommt aus #249 (element-zeile.tsx); die Einblendungs-Ansicht
// (M7-61) ist NOCH NICHT angebunden: `aufEinblendungBearbeiten` zeigt bis dahin
// einen Platzhalter-Hinweis statt einer falschen Oberflche (Befund gemeldet).
// #342: Die zwei Dialoge (#231/#232) werden hier eingehaengt. Die Fachlichkeit
// bleibt in den Bausteinen; diese Wurzel haelt GENAU EINE ComposerLage (#259)
// als React-Zustand und schreibt sie ausschliesslich ueber deren Uebergaenge fort.
import {
  LEERE_COMPOSER_LAGE,
  oeffneOverlay,
  schliesseOverlay,
  verwirfWurzelMeldung,
  setzeLaeuft,
  setzeAusgabeName,
  setzeExportauswahl,
  waehleMedium,
  istRenderKnopfFrei,
} from './composer-montage'
// S2 (Naht N2): EIN Melder fuer die stehende Wurzel-Meldung statt 15 Wiederholungen.
import { wurzelMelder } from './wurzel-meldung'
import {
  pruefeAusgabeName,
  loeseRenderMitNamenAus,
  vorbelegterName,
  type RenderDialogWirkungen,
} from './render-dialog'
import {
  LEERE_EXPORTAUSWAHL,
  waehleDatei,
  waehleZiel,
  istExportBereit,
  loeseExportMitAuswahlAus,
  type ExportDialogWirkungen,
} from './export-dialog'
import {
  ladeAusgaben,
  holeAusgaben,
  aufAusgabenGeaendert,
  type Ausgabenstand,
} from './ausgabe-liste'
// S4 (Naht N4): die Ausgaben-Region als eigener Baustein.
import { AusgabenBereich } from './ausgaben-bereich.tsx'
import { starteReparatur, istRenderFreigegeben, aktualisiereReparatur } from './reparatur-fuehrung'
import { fuehreFixAus, type FixOptionId } from './reparatur-optionen'
import { ReparaturPanel } from './reparatur-panel.tsx'
import { loeseRenderAus, loeseExportAus } from './render-ausloesen'
import { holeBereiteMarke } from '../gemeinsam/marken-bereitstellung'
import type { Marke } from '../../shared/contracts/marke'
import { importiereMedien, baueImportBericht, type ImportBericht } from './medien-import'
// S4 (Naht N4): die Galerie-Region (Datei-Drop-Zone #335) als eigener Baustein.
import { GalerieBereich } from './galerie-bereich.tsx'
import { greifeDropAuf, reiheDropEin } from './medien-bibliothek'
import { pfadFuerDatei } from '../ipc-client/pfad-fuer-datei'
// Mit Endung: der Pfad ohne Endung löst gegen die reine .ts-Naht auf, nicht gegen
// die .tsx (dieselbe Auflösung, die composer/index gegen index.tsx geschaltet hat).
import { Wiedergabeliste } from './liste-ansicht.tsx'
import { findeKaputteStellen } from './kaputt-erkennung'
import { ElementBedienung } from './element-zeile.tsx'
// #407-Befund (12.10.2026): Der Baustein #123 hat zwei UI-Aufrufer, deren Ansichten
// in der Geschichte nie in dieser Wurzel montiert wurden (Nachtrag am Issue #407).
// Die Montage ist genau die Aufgabe dieser Datei (#261 "Bausteine anordnen").
// S4 (Naht N4): die Bibliothek-Region als eigener Baustein (der Dock traegt die Ansicht).
import { BibliothekDock } from './bibliothek-dock.tsx'
// S5 (Naht N5): der DnD-Zustand und die vier DndContext-Handler liegen im Hook
// `verwendeZeitleistenZug` (Drag-Verband, Band-Aufnahme #425, Zeitstelle #428).
import { verwendeZeitleistenZug } from './verwende-zeitleisten-zug'
// #437: Unterbrechungen entfernen - die reine Listen-Bildung liegt in unterbrechungs-aufnahme.ts,
// geschrieben wird ueber den EINEN Weg setzeElementUnterbrechungen (#426).
import { entferneUnterbrechung } from './unterbrechungs-aufnahme'
import { setzeElementUnterbrechungen } from './unterbrechungs-bearbeiten'
// #408: Das KontextMenue (#133-Familie, Duplikat/Entfernen) wird in DIESE Wurzel
// montiert - sein Zustand wandert siehtbarseitig in die ComposerLage (menueAdresse,
// composer-montage.ts); die Zeilen tragen data-element-id (#248) - kein Edits an #248.
import { KontextMenue } from './kontext-menu.tsx'
// S3 (docs/agents/composer-umbau-plan.md, Naht N3): die vier Overlays sind eigene
// Bausteine; die Wurzel reicht nur Lage + Daten + Rueckrufe herein.
import { RenderOverlay } from './render-overlay.tsx'
import { ExportOverlay } from './export-overlay.tsx'
import { MediumLoeschenOverlay } from './medium-loeschen-overlay.tsx'
import { BandOverlay } from './band-overlay.tsx'
import { oeffneMenue, schliesseMenue, type ComposerLage } from './composer-montage'


/** #416: der Anlege-Auftrag (Roheingabe + Marke). Die Wurzel baut daraus KEINEN Entwurf -
 *  das tut allein der Aktions-Editor (#136/#319); hier reisen nur die drei Werte. */
export interface AktionAnlegenAuftrag {
  titel: string
  vorlagenId: string
  markeId: string
}

/** #430: die Antwort des Loeschens (Form von `loescheAktion`, #142). Die Kaskade rechnet
 *  der Main (TK 9.5.3); `stand` traegt die neue `liste`/`aktionen`, die beiden
 *  Kennungslisten erklaeren, was geschah. Der Composer wendet `stand` an - nachgebaut
 *  wird nichts. */
export interface LoeschAktionAntwort {
  stand: Bearbeitungsstand
  entfernteElementIds: string[]
  geaenderteElementIds: string[]
}

/**
 * Was diese Wurzel aus ANDEREN Renderer-Modulen braucht und nicht importieren darf
 * (Entscheidung E1: modulübergreifend reisen nur Typen, keine Aufrufe).
 */
export interface ComposerVerdrahtung {
  /** Der Medien-Dialog samt Import-Auftraegen (#204, `app-shell`). Wird an #228
   *  durchgereicht; diese Wurzel oeffnet KEINEN Dialog selbst. */
  starteMedienImport: MedienImportStarter
  /** #416: „Aktion anlegen" (der #136-Weg). Der vollstaendige Entwurf entsteht im
   *  Aktions-Editor; diese Wurzel reisst keinen zweiten Entwurf auf. */
  legeAktionAn: (auftrag: AktionAnlegenAuftrag) => Promise<Ergebnis<Aktion>>
  /** #430: „Aktion loeschen" (der #142-Weg). Die Kaskade rechnet der Main; diese Wurzel
   *  wendet den zurueckgegebenen Stand an (EIN Undo-Schritt ueber den Wrapped-Zugang). */
  loescheAktion: (aktionId: string) => Promise<Ergebnis<LoeschAktionAntwort>>
  /** Der Reparatur-Stand, den die Shell haelt (#201). null = nie gestartet.
   *  Wird NUR GELESEN – diese Wurzel haelt ihn NICHT (s. #259, ENTSCHIEDEN 5). */
  reparatur: ReparaturStand | null
  /** Meldet der Shell einen neu gerechneten Stand (#201 `uebernimmStand`). */
  meldeReparaturStand: (stand: ReparaturStand) => void
  /** Reicht eine Uebergabe aus #133 an die Shell weiter (#201 `uebernimmUebergabe`).
   *  Diese Wurzel fuehrt eine Uebergabe NIEMALS selbst aus (s. STOPP). */
  meldeUebergabe: (an: Uebergabe) => void
}

/**
 * ZEICHENGLEICH zu `ComposerWurzelProps` in #244 (`src/renderer/app-shell/inhalte.tsx`) – die Naht
 * ist geschlossen: #244 fuehrt seit #255/#256 dieselben FUENF Felder (seit #313 ohne `marke` – die
 * Marke kommt je Aktion aus holeBereiteMarke (#312); der Rahmen bedient seine Restflaechen nicht
 * hier, sondern der preview-player) und belegt `verdrahtung` aus `umgebung.composerVerdrahtung`.
 * Ohne dieses Buendel waere der Medien-Import nicht anstossbar
 * (#228 verlangt den Starter als Parameter) und der Reparatur-Modus nicht mit der Shell verbunden
 * (#201 haelt den Stand und die laufende Uebergabe, #256 fuehrt sie aus).
 * Weicht die tatsaechliche Fassung in #244 hiervon ab, ist das ein Vertragsfehler an der Naht
 * zwischen zwei Modulen: MELDEN, NICHT eigenmaechtig anpassen und NICHT #244 aendern.
 */
export interface ComposerWurzelProps {
  sichtbar: boolean
  /** UMHUELLTER Projektzugang (#243). */
  projekt: ProjektZugang
  zeichnen: ZeichenZugang
  vorlagen: VorlagenZugang
  verdrahtung: ComposerVerdrahtung
}

/** Die Modul-Wurzel des `composer`. Wird von #244 als `wurzeln.composer` uebergeben. */
export function ComposerWurzel(p: ComposerWurzelProps): JSX.Element {
  if (!p.sichtbar) {
    // Abbau verboten (TK 9.14.2): unsichtbar, aber gemountet - der Hoerer bleibt.
    return <div data-testid="composer-inaktiv" style={{ display: 'none' }} />
  }
  return (
    <ComposerInterna
      projekt={p.projekt}
      verdrahtung={p.verdrahtung}
      zeichnen={p.zeichnen}
      vorlagen={p.vorlagen}
    />
  )
}

const FEHLERFARBE = '#e5634d'
const TAKTFARBE = '#d9a441'

/** #422: Traegt die Wiedergabeliste bereits ein Video-Element? Dann ist der naechste
 *  Import ein ERSETZEN (genau ein Video pro Projekt, User-Entscheidung 15.10.2026). */
function hatVideoElement(projekt: Project): boolean {
  return projekt.liste.some((element) => element.art === 'video')
}

export function ComposerInterna({
  projekt,
  verdrahtung,
  zeichnen,
  vorlagen,
}: {
  projekt: ProjektZugang
  verdrahtung: ComposerVerdrahtung
  /** Zeichenvoraussetzungen fr die Thumbnails (#154). null = kein Thumbnail. */
  zeichnen: ZeichenZugang
  /** Vorlagen fr den Band-Namen in #249 (ENTSCHIEDEN 8). */
  vorlagen: VorlagenZugang
}): JSX.Element {
  const [sicht, setzeSicht] = useState<Projektsicht>(() => projekt.hole())
  // #425: Die Band-Bearbeitung ist jetzt montiert. `bandElementId` haelt das Video-
  // Element, dessen Werbeband gerade bearbeitet wird (null = Ansicht zu). Fehler der
  // Band-Bearbeitung reisen ueber die stehende Wurzel-Meldung (lage.meldung).
  const [bandElementId, setzeBandElementId] = useState<string | null>(null)
  // #428: das Zoom-Mass der Zeitleiste (px/s). Bild UND Drop-Messung nutzen denselben Wert -
  // sonst laegen gemessene Zeit und gezeichnetes Band auseinander.
  const [pxProSekunde, setzePxProSekunde] = useState<number>(EA_PX_PRO_SEKUNDE)
  // Der Bericht des Imports (#228): ohne ihn "passiert" der Import für den Nutzer
  // NICHTS - eingereiht wird zwar im Main, aber sichtbar war das nie (Befund 04.10.).
  const [importBericht, setzeImportBericht] = useState<ImportBericht | null>(null)
  // #335 (NA-02, Variante A): KEIN zweiter Kanal - der Drop laeuft ueber denselben
  // queue:reiheEin-Weg wie der Dialog (#228), der Main bleibt unangetastet. Die
  // Pfade kommen ueber die Preload-Bruecke (webUtils, ipc-client/pfad-fuer-datei);
  // die Whitelist wird hier VORGEFILTERT (DoD: kein Auftrag fuer nicht
  // unterstuetzte Typen), die finale Pruefung bleibt im Main.
  const [dropFehler, setzeDropFehler] = useState<string | null>(null)
  // #422: liegt schon ein Video vor, fragt der Import VORHER nach (der Import hat
  // Dateiwirkung und ist nicht undo-faehig, AD 4.9/FA-21) - kein window.confirm.
  const [ersetztFrage, setzeErsetztFrage] = useState(false)
  // #342: DIE EINE ComposerLage (#259). Kein zweiter Zustand fuer Overlay, Meldung,
  // Ausgabename oder Exportauswahl - alles laeuft ueber die acht Uebergaenge.
  const [lage, setzeLage] = useState<ComposerLage>(() => LEERE_COMPOSER_LAGE)
  // S2 (Naht N2): der EINE Melder der Wurzel - `(code, meldung) => void`; er passt
  // direkt auf die `aufFehler`/`meldeFehler`-Rueckrufe der Bausteine.
  const meldeWurzel = wurzelMelder(setzeLage)
  // #342: Der Bestand der Ausgaben wird GEHOLET, nicht geladen - der Stand liegt
  // in ausgabe-liste.ts (#230); diese Wurzel abonniert ihn und stoesst den ersten
  // Ladevorgang je Projekt an (M7-68, ENTSCHIEDEN 7). aktualisiereAusgaben bleibt
  // dem Nachlauf (#199) vorbehalten und wird hier NICHT gerufen.
  const [ausgabenStand, setzeAusgabenStand] = useState<Ausgabenstand>(() => holeAusgaben())

  // #414: EIN DndContext auf Wurzel-Ebene fuer die Quellen (#413) und die Kanten (#412).
  // Der Drag-Zustand und die vier Handler liegen im Hook `verwendeZeitleistenZug` (S5).
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))
  // #414 (Weiche B): die Zeitleiste ist PRIMÄR; die #248-Zeilen-Liste bleibt hinter
  // dem Ansichtsschalter als Fallback erreichbar.
  const [ansicht, setzeAnsicht] = useState<'zeitleiste' | 'liste'>('zeitleiste')

  useEffect(() => aufAusgabenGeaendert(setzeAusgabenStand), [])

  useEffect(() => projekt.aufGeaendert(setzeSicht), [projekt])

  const inhalt: Project | null = sicht.projekt
  const liste = inhalt?.liste ?? []

  // S5 (Naht N5): der EINE Zeitleisten-Zug - Drag-Zustand + die vier DndContext-Handler.
  // Zustand und Schreibwege bleiben an EINER Stelle; die Wirkungen reisen als Rueckrufe.
  const zug = verwendeZeitleistenZug({
    projektId: inhalt?.id ?? null,
    liste,
    pxProSekunde,
    holeProjekt: () => projekt.hole().projekt,
    setzeListe: projekt.setzeListe,
    holeVorlagen: () => (vorlagen.hole()?.nutzbare ?? []).map((eintrag) => eintrag.vorlage),
    melde: meldeWurzel,
  })

  // #437: EINE Unterbrechung am Video entfernen. Die neue Liste kommt aus
  // `entferneUnterbrechung` (rein), geschrieben wird ueber den EINEN Weg
  // `setzeElementUnterbrechungen` (#426). Die Sicht-Korrektur geht ueber den
  // Wrapped-Zugang `projekt.setzeListe` - EIN Undo-Schritt (#243).
  const entferneUnterbrechungAmVideo = (elementId: string, index: number): void => {
    const frisch = projekt.hole().projekt
    if (frisch === null) return
    const element = frisch.liste.find((eintrag) => eintrag.id === elementId)
    if (element === undefined || element.art !== 'video') return
    const neu = entferneUnterbrechung(element.unterbrechungen ?? [], index)
    void setzeElementUnterbrechungen(element.id, neu).then((antwort) => {
      if (!antwort.ok) {
        meldeWurzel(antwort.fehler.code, antwort.fehler.meldung)
        return
      }
      const aktuell = projekt.hole().projekt
      if (aktuell === null) return
      const wert = antwort.wert
      projekt.setzeListe(aktuell.liste.map((eintrag) => (eintrag.id === wert.id ? wert : eintrag)))
    })
  }

  // #418: Nach einem Import ist das neue VIDEO standardmaessig ausgewaehlt. Erkannt wird
  // es am NEU erscheinenden Video-Asset der Sicht (der Composer-Import legt genau ein
  // Video an - Bilder kommen ueber einen anderen Weg, #418). Der Erstlauf merkt nur und
  // waehlt nichts: Ein Reiterwechsel montiert diese Wurzel frisch (Abbau verboten, aber
  // unsichtbar), und dann soll nicht eines der bestehenden Medien markiert aufblitzen.
  const bekannteAssets = useRef<Set<string> | null>(null)
  // #422: Ein neu importiertes Video landet AUTOMATISCH ans Ende der Wiedergabeliste.
  // Liegt schon ein Video in der Liste, wird es ERSETZT (User: genau EIN Video pro
  // Projekt). Beides in EINEM Schreibvorgang: `fuegeElementHinzu` liefert das neue
  // Element ueber den Sicht-Schreiber (hier gesammelt, NICHT sofort geschrieben), die
  // alte Video-Zeile wird entfernt - dann geht GENAU EIN `setzeListe` (und damit EIN
  // Undo-Schnappschuss, #422-Entscheidung) hinaus.
  const fuegeVideoAnsEndeEin = (assetId: string): void => {
    let zwischenstand: Listenelement[] | null = null
    void fuegeElementHinzu(assetId, undefined, (liste) => {
      zwischenstand = liste
    }).then((ergebnis) => {
      if (!ergebnis.ok) {
        meldeWurzel(ergebnis.fehler.code, ergebnis.fehler.meldung)
        return
      }
      if (zwischenstand === null) return
      const neuesElement = ergebnis.wert
      const ohneAlte = zwischenstand.filter(
        (element) => element.art !== 'video' || element.id === neuesElement.id,
      )
      projekt.setzeListe(ohneAlte)
    })
  }
  useEffect(() => {
    const assets = inhalt?.assets ?? []
    if (bekannteAssets.current === null) {
      bekannteAssets.current = new Set(assets.map((eintrag) => eintrag.id))
      return
    }
    const neu = assets.filter((eintrag) => !bekannteAssets.current?.has(eintrag.id))
    bekannteAssets.current = new Set(assets.map((eintrag) => eintrag.id))
    const neuesVideo = neu.find((eintrag) => eintrag.typ === 'video')
    if (neuesVideo !== undefined) {
      setzeLage((alt) => waehleMedium(alt, neuesVideo.id))
      fuegeVideoAnsEndeEin(neuesVideo.id)
    }
  }, [inhalt?.assets])

  useEffect(() => {
    // #425: Beim Projektwechsel die Band-Ansicht schliessen - ein Element des alten
    // Projekts ist im neuen nicht mehr vorhanden. (Das Band-Ziel faellt im Hook weg.)
    setzeBandElementId(null)
  }, [inhalt?.id])

  // #342: Der erste Ladevorgang je Projekt (M7-68, ENTSCHIEDEN 7) - nur, wenn der
  // gehaltene Bestand nicht schon zu diesem Projekt gehoert.
  useEffect(() => {
    if (inhalt !== null && holeAusgaben().projektId !== inhalt.id) {
      void ladeAusgaben(inhalt.id)
    }
  }, [inhalt?.id])

  // Die Zeichenvoraussetzungen werden NUR gelesen (#154); bereiteVor wird hier
  // NICHT gerufen (M7-68, ENTSCHIEDEN 3).
  const voraussetzungen = zeichnen.hole()

  // #342: Der Render-Knopf oeffnet das Overlay und belegt den Namen FA-22-gemaess
  // mit projekt.letzterAusgabeName (leer, wenn null - KEIN Ersatzname, #231
  // ENTSCHIEDEN 3). Sperrschranken: Freigabe der Fuehrung (#132) via
  // istRenderKnopfFrei (#259) und vorhandene Zeichenvoraussetzungen (ohne sie
  // kann #134 keine PNGs zeichnen; kein Ersatzwert).
  // #421: Die gefuehrte Reparatur benutzbar machen. Der Composer zeigte bis hierher nur
  // den Fortschrittstext; es gab KEINEN Weg, eine Fix-Option auszuloesen (#421-Befund).
  // Diese Wurzel startet die Fuehrung, sobald es kaputte Stellen gibt, und fuehrt jede
  // Fix-Option aus. Ueber `projekt.setzeListe` (Wrapped-Zugang, #244) nimmt jede Reihe
  // einen Undo-Schritt.
  // Der Stand wird bei JEDEM neuen Projektstand EINMAL neu gerechnet (TK 9.7.5:
  // "bei jedem Aufruf neu gerechnet"). Frueher wurde die Fuehrung nur GESTARTET, wenn
  // keine lief - nach einem Projektwechsel oder einem Aufraeumen zeigte das Panel
  // deshalb die Stellen des ALTEN Stands (am echten Fenster gemessen, 19.10.2026:
  // 4h fand die Unterbrechung statt des Video-Assets; der Fix-Knopf fehlte).
  // Die Referenz-Wache verhindert die Schleife: `meldeReparaturStand` erzeugt neue
  // Props, aber derselbe `inhalt` rechnet nicht erneut.
  const standQuelle = useRef<Project | null>(null)
  const standProjektId = useRef<string | null>(null)
  useEffect(() => {
    if (inhalt === null) return
    if (standQuelle.current === inhalt) return
    standQuelle.current = inhalt
    const bisher = verdrahtung.reparatur
    if (findeKaputteStellen(inhalt).length === 0) {
      // Ist nichts mehr offen, MUSS eine laufende Anzeige enden - sonst bliebe eine
      // bereits behobene Stelle als letzte sichtbar (dieselbe Ursache wie oben).
      if (bisher !== null && bisher.aktiv) {
        verdrahtung.meldeReparaturStand(starteReparatur(inhalt))
      }
      return
    }
    const projektwechsel = standProjektId.current !== inhalt.id
    standProjektId.current = inhalt.id
    verdrahtung.meldeReparaturStand(
      projektwechsel || bisher === null || !bisher.aktiv
        ? starteReparatur(inhalt)
        : aktualisiereReparatur(bisher, inhalt),
    )
  }, [inhalt, verdrahtung])

  const repariere = (option: FixOptionId): void => {
    const stand = verdrahtung.reparatur
    const stelle = stand === null ? null : stand.aktuelle
    if (inhalt === null || stelle === null) return
    void fuehreFixAus(stelle, option, inhalt, projekt.setzeListe).then((ergebnis) => {
      if (!ergebnis.ok) {
        meldeWurzel(ergebnis.fehler.code, ergebnis.fehler.meldung)
        return
      }
      // Uebergabe (z. B. Medium ersetzen): die Shell fuehrt sie aus (Overlay/Reiter).
      if (ergebnis.wert.art === 'uebergabe') {
        verdrahtung.meldeUebergabe(ergebnis.wert.an)
        return
      }
      // erledigt: Stand aus dem FRISCHEN Projektstand neu rechnen (nie vorhersagen).
      const frisch = projekt.hole().projekt
      if (frisch !== null && stand !== null) {
        verdrahtung.meldeReparaturStand(aktualisiereReparatur(stand, frisch))
      }
    })
  }

  // #416: Aktion anlegen aus dem Composer heraus. Die Wurzel baut KEINEN Entwurf (das tut
  // der Aktions-Editor #136 ueber verdrahtung.legeAktionAn); sie ergaenzt NUR die Marke
  // (Projekt-Standardmarke) und pflegt die SICHT nach dem Erfolg - Anhaengen ans ENDE,
  // dieselbe Regel wie mitAktion (#136). Fehler gehen in die stehende Wurzel-Meldung.
  const legeAktionAnInline = (eingabe: { titel: string; vorlagenId: string }): void => {
    if (inhalt === null) return
    void verdrahtung
      .legeAktionAn({ titel: eingabe.titel, vorlagenId: eingabe.vorlagenId, markeId: inhalt.standardMarkeId })
      .then((ergebnis) => {
        if (!ergebnis.ok) {
          meldeWurzel(ergebnis.fehler.code, ergebnis.fehler.meldung)
          return
        }
        const aktion = ergebnis.wert
        // Kein zweiter Entwurf, keine Kaskade: den neuen Stand in die Sicht geben; die
        // Bibliothek liest inhalt.aktionen und zeigt den Eintrag SOFORT (#416-DoD).
        projekt.setzeProjekt({ ...inhalt, aktionen: [...inhalt.aktionen, aktion] })
      })
  }

  // #430: eine Aktion loeschen (der #142-Weg). Der Main rechnet die Kaskade
  // (TK 9.5.3); diese Wurzel baut sie NICHT nach, sondern wendet den zurueckgegebenen
  // Stand an. `projekt.setzeProjekt` laeuft ueber den Wrapped-Zugang -> EIN Undo-Schritt
  // (TK 9.13.1: "Aktionen ... loeschen" ist undo-faehig). KEINE Rueckfrage (User-Entscheidung
  // 16.10.2026) - der Schritt ist in EINEM Zug rueckgaengig zu machen.
  const loescheAktionInline = (aktionId: string): void => {
    if (inhalt === null) return
    void verdrahtung.loescheAktion(aktionId).then((ergebnis) => {
      if (!ergebnis.ok) {
        meldeWurzel(ergebnis.fehler.code, ergebnis.fehler.meldung)
        return
      }
      const aktuell = projekt.hole().projekt
      if (aktuell === null) return
      const stand = ergebnis.wert.stand
      projekt.setzeProjekt({ ...aktuell, aktionen: stand.aktionen, liste: stand.liste })
    })
  }

  const oeffneRenderDialog = (): void => {
    if (inhalt === null) return
    setzeLage((alt) =>
      setzeAusgabeName(oeffneOverlay(alt, { art: 'render' }), vorbelegterName(inhalt) ?? ''),
    )
  }
  const renderKnopfFrei =
    inhalt !== null &&
    voraussetzungen !== null &&
    // #342-MELDUNG (siehe Issue): #134 verlangt noch EINE Marke als Parameter
    // (vor #313 gebaut); seit #313 kommt die Zeichen-Marke je Aktion aus
    // holeBereiteMarke. Bis #134 nachzieht, geht die Standardmarke hinein -
    // dasselbe Muster wie der Rahmen im preview-player (#312/#313).
    holeBereiteMarke(inhalt.standardMarkeId) !== null &&
    istRenderKnopfFrei(istRenderFreigegeben(inhalt), lage.laeuft)

  // ENTSCHIEDEN 8 (#249): Das Asset kommt aufgelst - hier in der Wurzel, nicht in
  // der Zeile. ENTSCHIEDEN 6a: kaputteBandAbschnitte UNVERNDERT aus dem Modell.
  const zeichneBedienung = (modell: ListenZeileModell): JSX.Element => {
    const element = inhalt?.liste.find((eintrag) => eintrag.id === modell.elementId)
    if (element === undefined) {
      return <span data-testid="composer-zeile-abgebaut" />
    }
    return (
      <ElementBedienung
        element={element}
        asset={
          element.art === 'video'
            ? inhalt?.assets.find((eintrag) => eintrag.id === element.ref) ?? null
            : null
        }
        vorlagen={(vorlagen.hole()?.nutzbare ?? []).map((eintrag) => eintrag.vorlage)}
        kaputteBandAbschnitte={modell.kaputteBandAbschnitte}
        aufEinblendungBearbeiten={setzeBandElementId}
        aufFehler={meldeWurzel}
        sichtSchreiber={projekt.setzeListe}
      />
    )
  }


  // #422: Liegt schon ein Video vor, wird ERSETZT - der Import hat Dateiwirkung und ist
  // nicht undo-faehig, deshalb fragt die Wurzel VORHER nach (User-Entscheidung 15.10.).
  const importiere = (): void => {
    if (inhalt === null) return
    if (hatVideoElement(inhalt)) {
      setzeErsetztFrage(true)
      return
    }
    starteImport()
  }

  // Der Medien-Import (#228) hat EINEN Weg - der Kopf-Knopf und die Bibliotheksansicht
  // bedienen denselben Ruf, kein zweiter Ablauf.
  const starteImport = (): void => {
    if (inhalt === null) return
    void importiereMedien(inhalt.id, verdrahtung.starteMedienImport).then((antwort) => {
      if (antwort.ok) setzeImportBericht(antwort.wert)
      else
        setzeImportBericht({
          eingereiht: 0,
          abgebrochen: false,
          text: antwort.fehler.meldung,
          brauchtAufmerksamkeit: antwort.fehler.code !== 'unbekannter_fehler',
        })
    })
  }

  // #423 (User 15.10.2026: "immer mindestens ein Video"): Das eine Video wird NICHT
  // geloescht - ein Projekt hat immer genau eines. Ersetzen geht ueber
  // „Video importieren". Die Meldung steht hier, nicht in der Ansicht (Ownership, #259).
  const meldeVideoPflicht = (): void => {
    meldeWurzel(
      'asset_referenziert',
      'Ein Projekt hat immer genau ein Video – bitte über „Video importieren" ersetzen.',
    )
  }

  // Der Datei-Drop der Galerie (#335): Die Wirkung (Dateien einreihen, Bericht setzen)
  // liegt in der Wurzel; `GalerieBereich` reicht nur die fallengelassenen Dateien herein.
  const verarbeiteGalerieDrop = (dateien: File[]): void => {
    if (inhalt === null) {
      setzeDropFehler(
        'Es ist kein Projekt geladen – ein Import braucht ein geöffnetes Projekt.',
      )
      return
    }
    const aufbereitung: ReturnType<typeof greifeDropAuf> = greifeDropAuf(
      dateien,
      pfadFuerDatei,
    )
    void reiheDropEin(inhalt.id, aufbereitung.einreihbar).then((einreihErgebnis) => {
      // Abgewiesene Formate stehen unter demselben Code wie im Main
      // (format_nicht_unterstuetzt) - EIN Berichtsweg, kein zweiter.
      setzeImportBericht(
        baueImportBericht({
          ...einreihErgebnis,
          uebersprungen: [...einreihErgebnis.uebersprungen],
          abgelehnt: [
            ...einreihErgebnis.abgelehnt,
            ...aufbereitung.abgelehnt,
          ],
        }),
      )
      setzeDropFehler(null)
    })
  }

  // #407: Die Loesch-Vorauswahl als WERT vor dem JSX gerechnet (klare Schranke;
  // die Verschraenkung liest assetId IM verschraenkten Umfang, nicht in Rueckrufen).
  const loeschAsset = (() => {
    if (lage.overlay.art !== 'medium_loeschen' || inhalt === null) return null
    const assetId = lage.overlay.assetId
    return inhalt.assets.find((eintrag) => eintrag.id === assetId) ?? null
  })()

  // #425: Das Video-Element, dessen Werbeband gerade bearbeitet wird (null = Ansicht zu).
  const bandElement = (() => {
    if (bandElementId === null || inhalt === null) return null
    return inhalt.liste.find((eintrag) => eintrag.id === bandElementId) ?? null
  })()

  // #408/#420: Der rechtsklick-Weg. EIN Traeger-Selektor fuer BEIDE Ansichten: die
  // #248-Listenzeile UND der #414-Zeitleisten-Block tragen `data-element-id` (#420).
  // Damit oeffnet dieselbe Wurzel das EINE KontextMenue ueber die ComposerLage
  // (oeffneMenue, #259) - kein zweites Menue, keine zweite Adresse. Rechtsklick neben
  // Traegern (kein `data-element-id` in der Kette) bleibt beim Browser-Standard.
  const oeffneKontextMenue = (ereignis: React.MouseEvent): void => {
    const ziel = ereignis.target as HTMLElement | null
    if (ziel === null) return
    const traeger = ziel.closest('[data-element-id]')
    const elementId = traeger === null ? null : traeger.getAttribute('data-element-id')
    if (elementId === null) return
    ereignis.preventDefault()
    setzeLage((alt) => oeffneMenue(alt, { elementId, x: ereignis.clientX, y: ereignis.clientY }))
  }

  // #428: Zoom um eine Stufe (die Zeitleiste reicht nur die Richtung herein).
  const zoome = (richtung: -1 | 1): void => {
    setzePxProSekunde((alt) => {
      const stelle = ZOOM_STUFEN.indexOf(alt as (typeof ZOOM_STUFEN)[number])
      const naechste = Math.min(ZOOM_STUFEN.length - 1, Math.max(0, stelle + richtung))
      return ZOOM_STUFEN[naechste] ?? alt
    })
  }

  // S3 (Naht N3): Die Wurzel baut die Wirkungen und reicht sie als Rueckrufe an die
  // Overlay-Bausteine; die Handler bleiben HIER (Zustands-Ownership, #259).
  const waehleExportDatei = (dateiname: string): void => {
    setzeLage((alt) =>
      setzeExportauswahl(alt, waehleDatei(alt.exportauswahl, dateiname, ausgabenStand.dateien)),
    )
  }

  const waehleExportZiel = (): void => {
    void waehleZiel(lage.exportauswahl).then((ergebnis) => {
      if (ergebnis.ok) {
        // Abbruch (pfad === null) ist KEIN Fehler (#183): Auswahl unveraendert,
        // keine Meldung (M7-60-Fehlerpfade).
        if (!ergebnis.wert.abgebrochen) {
          setzeLage((alt) => setzeExportauswahl(alt, ergebnis.wert.auswahl))
        }
        return
      }
      meldeWurzel(ergebnis.fehler.code, ergebnis.fehler.meldung)
    })
  }

  // #342: Das Ausloesen des Renders (#231). ENTSCHIEDEN 5 (M7-68): #134 wird
  // UEBERGEBEN, nie direkt gerufen - #231 faengt kaputte_elemente ab und fuehrt in
  // die Reparatur.
  const starteRender = (): void => {
    if (inhalt === null || voraussetzungen === null) return
    if (pruefeAusgabeName(lage.ausgabeName) !== 'ok' || lage.laeuft) return
    setzeLage((alt) => setzeLaeuft(alt, true))
    const wirkungen: RenderDialogWirkungen = {
      loeseRenderAus: (projekt, ausgabeName, marke, vorlagenListe) =>
        loeseRenderAus(projekt, ausgabeName, marke, vorlagenListe),
      starteReparaturModus: () => {
        // M7-60, ENTSCHIEDEN 4 (b): derselbe Ablauf wie beim Klick -
        // Stand rechnen (#132) und der Shell melden, die ihn haelt.
        verdrahtung.meldeReparaturStand(starteReparatur(inhalt))
      },
      meldeFehler: meldeWurzel,
    }
    void loeseRenderMitNamenAus(
      inhalt,
      lage.ausgabeName,
      holeBereiteMarke(inhalt.standardMarkeId) as Marke,
      voraussetzungen.vorlagen,
      wirkungen,
    ).then((ergebnis) => {
      setzeLage((alt) => {
        const ruhig = setzeLaeuft(alt, false)
        // eingereiht/reparatur: Overlay zu (M7-60-Fehlerpfade). abgelehnt:
        // die Meldung kam bereits ueber meldeFehler; Overlay bleibt offen.
        return ergebnis.art === 'abgelehnt' ? ruhig : schliesseOverlay(ruhig)
      })
    })
  }

  const starteExport = (): void => {
    if (inhalt === null) return
    if (!istExportBereit(lage.exportauswahl) || lage.laeuft) return
    setzeLage((alt) => setzeLaeuft(alt, true))
    const wirkungen: ExportDialogWirkungen = {
      loeseExportAus: (projektId, dateiname, zielPfad) =>
        loeseExportAus(projektId, dateiname, zielPfad),
      meldeFehler: meldeWurzel,
    }
    void loeseExportMitAuswahlAus(inhalt.id, lage.exportauswahl, wirkungen).then((ergebnis) => {
      setzeLage((alt) => {
        const ruhig = setzeLaeuft(alt, false)
        return ergebnis.art === 'eingereiht' ? schliesseOverlay(ruhig) : ruhig
      })
    })
  }

  // #425: Uebernahme der Band-Bearbeitung. Die Sicht-Korrektur geht ueber den
  // Wrapped-Zugang (EIN Undo-Schritt, #243); danach schliesst die Ansicht.
  const uebernehmeBandElement = (element: Listenelement): void => {
    const aktuell = projekt.hole().projekt
    if (aktuell === null) {
      setzeBandElementId(null)
      return
    }
    projekt.setzeListe(
      aktuell.liste.map((eintrag) => (eintrag.id === element.id ? element : eintrag)),
    )
    setzeBandElementId(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={zug.amDragStart}
      onDragOver={zug.amUeber}
      // #417: onDragOver feuert NUR beim Wechsel des `over`-Ziels. Beim Ziehen aus der
      // Bibliothek bleibt `over` oft dieselbe Kante - die Messung liefe dann EINMAL bei
      // dx=0 und JEDER Drop landete an Kante 0. onDragMove feuert bei JEDER Bewegung.
      onDragMove={zug.amUeber}
      onDragEnd={zug.amEnde}
      onDragCancel={zug.amDragAbbruch}
    >
    <div
      data-testid="composer-wurzel"
      onContextMenu={oeffneKontextMenue}
      style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, padding: 8, gap: 8 }}
    >
      <div style={{ flex: '0 0 auto', display: 'flex', gap: 8, alignItems: 'center' }}>
        {/* Die Gesamtlnge zeichnet Wiedergabeliste (#248) selbst ber baueLaengenAnzeige. */}
        <span style={{ flex: 1 }} />
        <button
          type="button"
          data-testid="composer-medien-import"
          onClick={importiere}
        >
          Video importieren
        </button>
        <button
          type="button"
          data-testid="composer-render-oefnen"
          disabled={!renderKnopfFrei}
          onClick={oeffneRenderDialog}
        >
          Rendern…
        </button>
      </div>

      {/* #421: das Bedien-Panel der gefuehrten Reparatur - sichtbar, solange es eine
          aktuelle kaputte Stelle gibt. Ohne es waere `fuehreFixAus` weiter ohne Aufrufer. */}
      {verdrahtung.reparatur !== null && verdrahtung.reparatur.aktuelle !== null && (
        <ReparaturPanel stand={verdrahtung.reparatur} aufFix={repariere} />
      )}

      {lage.meldung !== null && (
        <div
          data-testid="composer-wurzel-meldung"
          role="status"
          style={{ color: lage.meldung.warnung ? FEHLERFARBE : undefined, fontSize: 12 }}
          onClick={() => setzeLage((alt) => verwirfWurzelMeldung(alt))}
        >
          {lage.meldung.meldung}
        </div>
      )}

      {dropFehler !== null && (
        <div data-testid="composer-drop-fehler" style={{ color: FEHLERFARBE, fontSize: 12 }}>
          {dropFehler}
        </div>
      )}

      {importBericht !== null && (
        <div
          data-testid="composer-import-bericht"
          style={{
            color: importBericht.brauchtAufmerksamkeit ? TAKTFARBE : undefined,
            fontSize: 12,
          }}
        >
          {importBericht.text}
        </div>
      )}

      {/* #422: Die Rueckfrage vor dem ERSETZEN. Sie erscheint, wenn schon ein Video in
          der Liste liegt - der Import hat Dateiwirkung und ist nicht undo-faehig. */}
      {ersetztFrage && (
        <div
          data-testid="composer-ersetzen-frage"
          role="status"
          style={{ fontSize: 12, display: 'flex', gap: 8, alignItems: 'center' }}
        >
          <span>Es gibt bereits ein Video. Beim Import wird es ersetzt.</span>
          <button
            type="button"
            data-testid="composer-ersetzen-ja"
            onClick={() => {
              setzeErsetztFrage(false)
              starteImport()
            }}
          >
            Video ersetzen
          </button>
          <button
            type="button"
            data-testid="composer-ersetzen-nein"
            onClick={() => setzeErsetztFrage(false)}
          >
            Abbrechen
          </button>
        </div>
      )}

      {sicht.ladefehler !== null && (
        <div data-testid="composer-ladefehler" style={{ color: FEHLERFARBE, fontSize: 12 }}>
          {sicht.ladefehler.meldung}
        </div>
      )}

      {inhalt === null ? (
        <div data-testid="composer-kein-projekt" style={{ color: '#8f8f8f', fontSize: 12 }}>
          Kein Projekt geladen – im Reiter Projekte öffnen.
        </div>
      ) : (
        <>
          {/* #414: Lage-Umbersatz - Bibliothek LINKS (Dock), Galerie + Fallback-Liste
              in der Mitte, Zeitleiste UNTEN ueber die volle Breite (Weiche B: primär).
              Die #248-Wiedergabeliste bleibt hinter dem Umschalter erreichbar. */}
          <div style={{ flex: '0 0 auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              type="button"
              data-testid="composer-ansicht-zeitleiste"
              aria-pressed={ansicht === 'zeitleiste'}
              onClick={() => setzeAnsicht('zeitleiste')}
            >
              Zeitleiste
            </button>
            <button
              type="button"
              data-testid="composer-ansicht-liste"
              aria-pressed={ansicht === 'liste'}
              onClick={() => setzeAnsicht('liste')}
            >
              Liste
            </button>
            <span style={{ flex: 1 }} />
          </div>

          <div style={{ flex: '1 1 auto', display: 'flex', gap: 8, minHeight: 0 }}>
            {/* S4 (Naht N4): die Bibliothek-Region als eigener Baustein; die #423-Wirkung
                (kein Video-Loeschen) bleibt in der Wurzel (Ownership, #259). */}
            <BibliothekDock
              projekt={inhalt}
              sichtSchreiber={projekt.setzeListe}
              aufImportieren={importiere}
              ausgewaehltesId={lage.gewaehltesMediumId}
              aufWaehlen={(assetId) => setzeLage((alt) => waehleMedium(alt, assetId))}
              vorlagen={(vorlagen.hole()?.nutzbare ?? []).map((eintrag) => eintrag.vorlage)}
              aufAktionAnlegen={legeAktionAnInline}
              aufAktionLoeschen={loescheAktionInline}
              aufMediumLoeschen={meldeVideoPflicht}
              aufFehler={meldeWurzel}
            />

            {/* MITTE: Galerie als lebende Drop-Zone (#335) + falls gewaehlt die
                #248-Liste (Fallback). */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
              {ansicht === 'liste' && (
                <>
                  <Wiedergabeliste
                    projekt={inhalt}
                    sichtSchreiber={projekt.setzeListe}
                    stellen={findeKaputteStellen(inhalt)}
                    reparatur={verdrahtung.reparatur}
                    voraussetzungen={zeichnen.hole()}
                    zeichneBedienung={zeichneBedienung}
                    aufZeileGewaehlt={(elementId) => {
                      // ENTSCHIEDEN 8 (#248): Diese Ansicht haelt KEINE Auswahl - hier ist
                      // die Wurzel der Aufrufer.
                      void elementId
                    }}
                  />
                </>
              )}
              {/* S4 (Naht N4): die Galerie-Region als eigener Baustein; die Drop-Wirkung
                  liegt in der Wurzel (`verarbeiteGalerieDrop`, Ownership #259). */}
              <GalerieBereich
                projekt={inhalt}
                ausgewaehltesId={lage.gewaehltesMediumId}
                aufWaehlen={(assetId) => setzeLage((alt) => waehleMedium(alt, assetId))}
                aufDateiDrop={verarbeiteGalerieDrop}
              />
            </div>
          </div>

          {/* UNTEN: die Zeitleiste über die volle Breite (Kernachse #412/#414).
              Wird in JEDER Ansicht gezeigt - sie ist die Einfuege-Flaeche. */}
          <Zeitleiste
            projekt={inhalt}
            neuZug={zug.neuZug}
            aktiveKante={zug.aktiveKante}
            laedtKante={zug.laedtKante}
            korbRef={zug.korbRef}
            bandZiel={zug.bandZiel}
            pxProSekunde={pxProSekunde}
            aufZoom={zoome}
            aufUnterbrechungEntfernen={entferneUnterbrechungAmVideo}
            videoWirkung={zug.videoWirkung}
          />

          {/* S4 (Naht N4): die Ausgaben-Region als eigener Baustein (#230/#232-Oeffnungsweg).
              Der Export-Rueckruf oeffnet das Overlay mit LEERER Auswahl (M7-60,
              ENTSCHIEDEN 3); der Erneut-laden-Weg geht direkt an #230. */}
          <AusgabenBereich
            stand={ausgabenStand}
            aufExportieren={() =>
              setzeLage((alt) =>
                oeffneOverlay(setzeExportauswahl(alt, LEERE_EXPORTAUSWAHL), { art: 'export' }),
              )
            }
            aufErneutLaden={() => {
              if (inhalt !== null) void ladeAusgaben(inhalt.id)
            }}
          />
        </>
      )}

      {/* #342: Das Render-Overlay (#231). befund und Ueberschreib-Lage werden je
          Tastendruck neu gerechnet (#231/#259) - nie zwischengespeichert. */}
      {lage.overlay.art === 'render' && inhalt !== null && voraussetzungen !== null && (
        <RenderOverlay
          ausgabeName={lage.ausgabeName}
          laeuft={lage.laeuft}
          ausgaben={ausgabenStand.dateien}
          aufEingabe={(wert) => setzeLage((alt) => setzeAusgabeName(alt, wert))}
          aufAusloesen={starteRender}
          aufAbbrechen={() => setzeLage((alt) => schliesseOverlay(alt))}
        />
      )}

      {/* #425: Die Band-Bearbeitung (#253/M7-60) - endlich montiert. Sie bearbeitet
          das Werbeband des Video-Elements; das Uebernehmen liefert das neue Element,
          die Wurzel korrigiert die Sicht (EIN Undo-Schritt, #243-Huelle). */}
      {bandElement !== null && inhalt !== null && (
        <BandOverlay
          element={bandElement}
          aktionen={inhalt.aktionen}
          vorlagen={(vorlagen.hole()?.nutzbare ?? []).map((eintrag) => eintrag.vorlage)}
          stellen={findeKaputteStellen(inhalt)}
          aufUebernommen={uebernehmeBandElement}
          aufAbbrechen={() => setzeBandElementId(null)}
          aufFehler={meldeWurzel}
        />
      )}

      {/* #408: Das KontextMenue (Duplikat/Entfernen) - der Baustein zeichnet,
          die Adresse liegt in der ComposerLage; schliessen geht nur ueber
          schliesseMenue, ein Overlay oeffnen nimmt das Menue mit (oeffneOverlay). */}
      {lage.menueAdresse !== null && inhalt !== null && (
        <KontextMenue
          projekt={inhalt}
          adresse={lage.menueAdresse}
          schliesse={() => setzeLage((alt) => schliesseMenue(alt))}
          sichtSchreiber={projekt.setzeListe}
        />
      )}

      {/* #259-Vertrag (art medium_loeschen) + #229: Die Bestätigungs-Anzeige des
          Medium-Löschens. Der Auftrag reist über den Torwächter; das Ergebnis
          zieht der Nachlauf (#199) nach, dieser Overlay-Code wartet NICHT. */}
      {loeschAsset !== null && inhalt !== null && (
        <MediumLoeschenOverlay
          projekt={inhalt}
          assetId={loeschAsset.id}
          aufErledigt={() => setzeLage((alt) => schliesseOverlay(alt))}
          aufAbgebrochen={() => setzeLage((alt) => schliesseOverlay(alt))}
          aufFehler={meldeWurzel}
        />
      )}

      {/* #342: Das Export-Overlay (#232). Die Auswahl ist ein WERT der Lage;
          Datei- und Zielwahl laufen ueber waehleDatei/waehleZiel (#232). */}
      {lage.overlay.art === 'export' && inhalt !== null && (
        <ExportOverlay
          ausgaben={ausgabenStand.dateien}
          auswahl={lage.exportauswahl}
          laeuft={lage.laeuft}
          aufDateiWaehlen={waehleExportDatei}
          aufZielWaehlen={waehleExportZiel}
          aufAusloesen={starteExport}
          aufAbbrechen={() => setzeLage((alt) => schliesseOverlay(alt))}
        />
      )}
    </div>
    </DndContext>
  )
}
