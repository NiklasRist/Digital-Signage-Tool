/* eslint-disable @typescript-eslint/no-unused-vars */
// GENERIERT aus dem Signaturblock von Issue #261.
// [composer] Modul-Wurzel: die Bausteine anordnen und verdrahten
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.
//
// Die Pruefsumme haelt fest, was der Generator hier zuletzt hinterlassen hat.
// Stimmt sie beim naechsten Lauf nicht mehr, wurde die Datei bearbeitet - dann
// fasst der Generator sie NIE an, auch wenn sich das Issue geaendert hat. Sie
// mitzupflegen ist NICHT deine Aufgabe: Wer den Rumpf fuellt, laesst sie einfach
// stehen; ihr Nichtmehrstimmen IST das Signal.
// GERUEST-PRUEFSUMME: ba232e8e875c96c3
//
// ZUR ABSCHALTZEILE IN ZEILE 1 - SIE IST BEIM FUELLEN DES RUMPFES ZU ENTFERNEN:
// Die Parameter und Importe dieser Datei SIND der Vertrag; der Rumpf wirft aber
// nur, benutzt sie also nicht (@typescript-eslint/no-unused-vars). Die Zeile
// gehoert zum Geruest, nicht zum fertigen Code. Wer den Rumpf fuellt und sie
// stehen laesst, macht die Regel in DIESER Datei dauerhaft blind - unauffaellig,
// weil dann nichts mehr rot ist.
//
// Gesetzt hat sie kein Mensch, sondern tools/geruest.py: Es fragt nach dem
// Schreiben EINMAL ESLint, welche Dateien no-unused-vars tatsaechlich melden, und
// versieht nur diese. Deshalb steht sie nirgends ueberfluessig herum.

import { useEffect, useState, useRef, type JSX, type MouseEvent as ReactMouseEvent } from 'react'

import type { Listenelement, Project, Bearbeitungsstand } from '../../shared/contracts/project'
import type { Aktion } from '../../shared/contracts/aktion'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { ProjektZugang, VorlagenZugang, ZeichenZugang } from '../app-shell/sichten'
import type { ReparaturStand } from './reparatur-fuehrung'
import type { ListenZeileModell } from './liste-ansicht'
import type { Uebergabe } from './reparatur-optionen'
import type { MedienImportStarter } from './medien-import'
import { aufSichtGeaendert, type Projektsicht } from './projektzustand'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent, type DragOverEvent, type DragStartEvent } from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
// #414 (Oberflaeche 2.0): EIN DndContext auf Wurzel-Ebene - Quellen (#413) und
// Kanten (#412) im selben Kontext. Der DnD-Zustand (neuZug/aktiveKante/laedtKante)
// lebt HIER; die Zeitleiste ist die Praesentation (korbRef = Messraum).
import { Zeitleiste, baueZeitleistenZeilen } from './zeitleiste.tsx'
import { baueEinfugeKanten, leseKantenIndex, liestReferenz, waehleKanteAus } from './spalt-drop'
import { fuegeElementHinzu } from './element-hinzufuegen'
import { ordneNeuOptimistisch } from './liste-reorder'
// NACHTRAG #248 (Variante A, 05.10.): Die ad-hoc-Wiedergabeliste dieser Wurzel
// (DndContext/Zeile/Regler unten) ist hier durch die Issue-richtige
// `Wiedergabeliste` aus liste-ansicht.tsx (#248) ERSETZT - dokumentierte Ausnahme
// vom Nicht-ndern-Verbot des Composer-Issues, im Nachtrag auf #248 begrndet.
// Die Bedienung kommt aus #249 (element-zeile.tsx); die Einblendungs-Ansicht
// (M7-61) ist NOCH NICHT angebunden: `aufEinblendungBearbeiten` zeigt bis dahin
// einen Platzhalter-Hinweis statt einer falschen Oberflche (Befund gemeldet).
import { entferneElementAusListe } from './element-entfernen'
import { berechneGesamtlaenge, frameDauer } from './gesamtlaenge'
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
  pruefeUeberschreiben,
  loeseRenderMitNamenAus,
  vorbelegterName,
  type RenderDialogWirkungen,
} from './render-dialog'
import { RenderDialogAnzeige } from './render-dialog.tsx'
import {
  LEERE_EXPORTAUSWAHL,
  waehleDatei,
  waehleZiel,
  istExportBereit,
  loeseExportMitAuswahlAus,
  type ExportDialogWirkungen,
} from './export-dialog'
import { ExportDialogAnzeige } from './export-dialog.tsx'
import {
  ladeAusgaben,
  holeAusgaben,
  aufAusgabenGeaendert,
  type Ausgabenstand,
} from './ausgabe-liste'
import { AusgabeListenansicht } from './ausgabe-liste.tsx'
import { starteReparatur, istRenderFreigegeben, aktualisiereReparatur } from './reparatur-fuehrung'
import { fuehreFixAus, type FixOptionId } from './reparatur-optionen'
import { ReparaturPanel } from './reparatur-panel.tsx'
import { loeseRenderAus, loeseExportAus } from './render-ausloesen'
import { holeBereiteMarke } from '../gemeinsam/marken-bereitstellung'
import type { Marke } from '../../shared/contracts/marke'
import { importiereMedien, baueImportBericht, type ImportBericht } from './medien-import'
import { AssetGalerie } from './asset-galerie'
import { greifeDropAuf, reiheDropEin, type PfadHoler } from './medien-bibliothek'
import { pfadFuerDatei } from '../ipc-client/pfad-fuer-datei'
// Mit Endung: der Pfad ohne Endung löst gegen die reine .ts-Naht auf, nicht gegen
// die .tsx (dieselbe Auflösung, die composer/index gegen index.tsx geschaltet hat).
import { Wiedergabeliste } from './liste-ansicht.tsx'
import { findeKaputteStellen } from './kaputt-erkennung'
import { ElementBedienung } from './element-zeile.tsx'
import { uebernehmeGrenzen } from './dauer-regler'
// #407-Befund (12.10.2026): Der Baustein #123 hat zwei UI-Aufrufer, deren Ansichten
// in der Geschichte nie in dieser Wurzel montiert wurden (Nachtrag am Issue #407).
// Die Montage ist genau die Aufgabe dieser Datei (#261 "Bausteine anordnen").
import { Bibliotheksansicht } from './bibliothek-ansicht.tsx'
import { loescheMedium } from './medium-loeschen'
import { MediumLoeschen } from './medium-loeschen.tsx'
import { gibVideoHandlesFrei } from '../gemeinsam/video-handles'
// #425: Die Band-Bearbeitung (#253/M7-60) wird endlich MONTIERT (Familie „fertige
// Funktion ohne Aufrufer"); der Drop einer Aktion auf das VIDEO wird ein Band-Abschnitt.
// Die reine Aufnahme-Logik liegt in band-aufnahme.ts, der eine Schreibweg in
// uebernehmeBand (#129) - diese Wurzel ruft nur und pflegt die Sicht.
import { EinblendungAnsicht } from './einblendung-ansicht.tsx'
import { uebernehmeBand } from './einblendung-bearbeiten'
import { bandZielAus, bandAufnahmeAus, startdauerFuerBandabschnitt } from './band-aufnahme'
// #408: Das KontextMenue (#133-Familie, Duplikat/Entfernen) wird in DIESE Wurzel
// montiert - sein Zustand wandert siehtbarseitig in die ComposerLage (menueAdresse,
// composer-montage.ts); die Zeilen tragen data-element-id (#248) - kein Edits an #248.
import { KontextMenue } from './kontext-menu.tsx'
// S1 (docs/agents/composer-umbau-plan.md, Naht N1): der EINE Overlay-Rahmen statt
// vier wortgleicher Backdrops inline.
import { OverlayRahmen } from './overlay-rahmen.tsx'
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

/** #417: Layout-Vorschub je Zeitleisten-Block = Kantenbreite (10 px, zeitleiste.tsx) +
 *  ZWEI Luecken (je 2 px, `gap: 2` in korb UND in der Block-Gruppe). Er hebt den
 *  Zeiger-Raum (mit Kanten) auf den Modell-Raum von `waehleKanteAus` (Summe der
 *  Blockbreiten, s. amUeber). 10 + 2 + 2 = 14. */
const KANTEN_VORSCHUB_PX = 14

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
  // #425: der Video-Block, ueber dem ein Aktion-Neuzug gerade steht (Band-Ziel).
  const [bandZiel, setzeBandZiel] = useState<string | null>(null)
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

  // #414: der Drag-Zustand auf WURZEL-Ebene (EIN DndContext fuer die Quellen #413
  // und die Kanten #412). neuZug = Drag-Daten `{ referenz }`; aktiveKante = gemessene
  // Einfuege-Kante; laedtKante = wartendes Einfuegen (nicht optimistisch, TK 9.7.3).
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))
  const [neuZug, setzeNeuZug] = useState<string | null>(null)
  const [aktiveKante, setzeAktiveKante] = useState<number | null>(null)
  const [laedtKante, setzeLaedtKante] = useState<number | null>(null)
  const zeigerStartX = useRef<number | null>(null)
  const korbRef = useRef<HTMLDivElement | null>(null)
  // #414 (Weiche B): die Zeitleiste ist PRIMÄR; die #248-Zeilen-Liste bleibt hinter
  // dem Ansichtsschalter als Fallback erreichbar.
  const [ansicht, setzeAnsicht] = useState<'zeitleiste' | 'liste'>('zeitleiste')

  useEffect(() => aufAusgabenGeaendert(setzeAusgabenStand), [])

  useEffect(() => projekt.aufGeaendert(setzeSicht), [projekt])

  const inhalt: Project | null = sicht.projekt
  const liste = inhalt?.liste ?? []

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
    // Projekts ist im neuen nicht mehr vorhanden.
    setzeBandElementId(null)
    setzeBandZiel(null)
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
  useEffect(() => {
    if (inhalt === null) return
    if (findeKaputteStellen(inhalt).length === 0) return
    if (verdrahtung.reparatur === null || !verdrahtung.reparatur.aktiv) {
      verdrahtung.meldeReparaturStand(starteReparatur(inhalt))
    }
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

  const gesamt = berechneGesamtlaenge([...liste])

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

  // #414: der DnD-Verband auf der Wurzel (aus #412 uebernommen, auf den gemeinsamen
  // Kontext gehoben; die Routing-Regeln sind woertlich die #412-Regeln).
  const amDragStart = (ereignis: DragStartEvent): void => {
    // NUR ein Drag MIT Referenz (Neu-Einfuegen, #413) oeffnet die Kanten.
    setzeNeuZug(liestReferenz(ereignis.active.data.current))
    setzeBandZiel(null)
    const aktivator = ereignis.activatorEvent as MouseEvent
    if (typeof aktivator?.clientX === 'number') zeigerStartX.current = aktivator.clientX
  }

  const amUeber = (ereignis: DragOverEvent): void => {
    // Messbruecke zu `waehleKanteAus` (#412-Signatur): Zeiger-x (Start + delta) im
    // Zeitleisten-Raum; gescrollte Korbe inklusive. Ohne Messstand Rueckfall auf den
    // Droppable-Index (`kante-N`).
    if (neuZug === null) return
    const korb = korbRef.current
    if (korb === null || zeigerStartX.current === null) {
      setzeAktiveKante(leseKantenIndex(ereignis.over?.id))
      setzeBandZiel(null)
      return
    }
    const umriss = korb.getBoundingClientRect()
    if (umriss.width === 0 && umriss.height === 0) {
      setzeAktiveKante(leseKantenIndex(ereignis.over?.id))
      setzeBandZiel(null)
      return
    }
    const zeilen = baueZeitleistenZeilen(inhalt?.liste ?? [])
    const xImKontext = zeigerStartX.current + ereignis.delta.x - umriss.left + korb.scrollLeft
    const kanten = baueEinfugeKanten(zeilen.length)
    // #417: `waehleKanteAus` rechnet die Grenzen als SUMME der uebergebenen Breiten. Der
    // Zeiger-x liegt aber im echten Layout, in dem zwischen zwei Bloecken eine Kante (10 px)
    // und ZWEI Luecken (je 2 px) stehen. Ohne den Vorschub je Block liegen Modellgrenzen und
    // sichtbare Kanten auseinander - bei kurzen Bloecken um eine ganze Kante. Deshalb traegt
    // die uebergebene "Breite" den Layout-Vorschub Block + Kante + zwei Luecken.
    const gemessen = waehleKanteAus(kanten, xImKontext, (index) => (zeilen[index]?.breitePx ?? 64) + KANTEN_VORSCHUB_PX)
    setzeAktiveKante(gemessen ?? leseKantenIndex(ereignis.over?.id))
    // #425: Steht der Zeiger im KOERPER eines VIDEO-Blocks, wird der Drop ein Band-
    // Abschnitt (nicht sequenziell). Die Messung liegt rein in band-aufnahme.ts.
    setzeBandZiel(
      bandZielAus(zeilen, zeilen.map((zeile) => zeile.breitePx), xImKontext, KANTEN_VORSCHUB_PX),
    )
  }

  // #425: EINE Aktion ins Werbeband des Video-Elements aufnehmen. Der Entwurf kommt
  // aus band-aufnahme.ts (erste waehlbare Band-Vorlage, Dauer-Kette des Produkts),
  // geschrieben wird ausschliesslich ueber uebernehmeBand (#129) - kein zweiter
  // Schreibweg. Die Sicht-Korrektur geht ueber den Wrapped-Zugang (EIN Undo-Schritt).
  const nehmeAktionInsBandAuf = (videoId: string, aktionId: string): void => {
    const frisch = projekt.hole().projekt
    if (frisch === null) return
    const element = frisch.liste.find((eintrag) => eintrag.id === videoId)
    if (element === undefined || element.art !== 'video') return
    const aktion = frisch.aktionen.find((eintrag) => eintrag.id === aktionId)
    if (aktion === undefined) return

    const dauer = startdauerFuerBandabschnitt(aktion.standardDauer, frisch.standardSegmentdauer)
    const entwurf = bandAufnahmeAus(
      element,
      aktion.id,
      dauer,
      (vorlagen.hole()?.nutzbare ?? []).map((eintrag) => eintrag.vorlage),
    )
    if (entwurf === null) {
      meldeWurzel(
        'keine_band_vorlage',
        'Für ein Werbeband wird eine Band-Vorlage gebraucht (Art „split“ oder „einblendung“). Lege eine Vorlage im Reiter Vorlagen an.',
      )
      return
    }

    void uebernehmeBand(element.id, entwurf).then((antwort) => {
      if (!antwort.ok) {
        meldeWurzel(antwort.fehler.code, antwort.fehler.meldung)
        return
      }
      // Die Sicht NACH dem await frisch holen (kein gemerkter Stand) und GENAU EIN
      // setzeListe - das ist der eine Undo-Schritt ueber den Wrapped-Zugang (#243).
      const aktuell = projekt.hole().projekt
      if (aktuell === null) return
      const neu = antwort.wert
      projekt.setzeListe(aktuell.liste.map((eintrag) => (eintrag.id === neu.id ? neu : eintrag)))
    })
  }

  const amEnde = (ereignis: DragEndEvent): void => {
    setzeNeuZug(null)
    setzeAktiveKante(null)
    // #425: Das Band-Ziel VOR dem Zuruecksetzen lesen - der Drop entscheidet daran.
    const zielVideo = bandZiel
    setzeBandZiel(null)
    // Sortier-Drag EINES BESTANDELEMENTS (keine Referenz): der Reorder-Weg (#122).
    const referenz = liestReferenz(ereignis.active.data.current)
    if (referenz === null) {
      const aktiv = ereignis.active.id
      const ueber = ereignis.over?.id
      if (typeof aktiv !== 'string' || typeof ueber !== 'string') return
      ordneNeuOptimistisch(aktiv, ueber, projekt.setzeListe)
      return
    }
    // #425: Drop auf dem VIDEO-Koerper -> Band-Abschnitt; die Video-Elementdauer
    // bleibt unberuehrt (TK 9.2.8). Auf einem Segment-Koerper ist `zielVideo` null;
    // dann laeuft der Drop wie bisher an die gemessene Kante (sequenziell davor/danach).
    if (zielVideo !== null) {
      nehmeAktionInsBandAuf(zielVideo, referenz)
      return
    }
    // NEU-Drag (#413): Einfuegen an der Kante (#411-Mutation, nicht optimistisch).
    let index = aktiveKante
    if (index === null) index = leseKantenIndex(ereignis.over?.id)
    if (index === null) return
    setzeLaedtKante(index)
    void fuegeElementHinzu(referenz, index, projekt.setzeListe)
      .then((ergebnis) => {
        if (!ergebnis.ok) {
          meldeWurzel(ergebnis.fehler.code, ergebnis.fehler.meldung)
        }
      })
      .finally(() => setzeLaedtKante(null))
  }

  const amDragAbbruch = (): void => {
    setzeNeuZug(null)
    setzeAktiveKante(null)
    setzeBandZiel(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={amDragStart}
      onDragOver={amUeber}
      // #417: onDragOver feuert NUR beim Wechsel des `over`-Ziels. Beim Ziehen aus der
      // Bibliothek bleibt `over` oft dieselbe Kante - die Messung liefe dann EINMAL bei
      // dx=0 und JEDER Drop landete an Kante 0. onDragMove feuert bei JEDER Bewegung.
      onDragMove={amUeber}
      onDragEnd={amEnde}
      onDragCancel={amDragAbbruch}
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
            {/* LINKS: Die Bibliothek (Dock breit genug fuer Hinzufuegen/Loeschen). */}
            <div
              data-testid="composer-bibliothek-dock"
              style={{ width: 300, flexShrink: 0, minWidth: 240, minHeight: 0, overflow: 'auto', borderRight: '1px solid #444', paddingRight: 8 }}
            >
              <Bibliotheksansicht
                projekt={inhalt}
                sichtSchreiber={projekt.setzeListe}
                aufImportieren={importiere}
                ausgewaehltesId={lage.gewaehltesMediumId}
                aufWaehlen={(assetId) => setzeLage((alt) => waehleMedium(alt, assetId))}
                vorlagen={(vorlagen.hole()?.nutzbare ?? []).map((eintrag) => eintrag.vorlage)}
                aufAktionAnlegen={legeAktionAnInline}
                aufAktionLoeschen={loescheAktionInline}
                aufMediumLoeschen={(assetId) => {
                  // #423 (User 15.10.2026: "immer mindestens ein Video"): Das eine Video
                  // wird NICHT geloescht - ein Projekt hat immer genau eines. Ersetzen
                  // geht ueber „Video importieren".
                  void assetId
                  meldeWurzel(
                    'asset_referenziert',
                    'Ein Projekt hat immer genau ein Video – bitte über „Video importieren" ersetzen.',
                  )
                }}
                aufFehler={meldeWurzel}
              />
            </div>

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
              <div
                data-testid="composer-galerie"
                style={{ flex: '1 1 auto', minHeight: 120, borderTop: '1px solid #444' }}
                // #335: Die Drop-Zone der Medien-Bibliothek. preventDefault unterdrückt
                // das Öffnen der Datei im Fenster; ohne Bearbeitung ist das ZIEHEN hier
                // überhaupt erst ein Drop auf DIESEN Bereich.
                onDragOver={(ereignis) => {
                  ereignis.preventDefault()
                }}
                onDrop={(ereignis) => {
                  ereignis.preventDefault()
                  if (inhalt === null) {
                    setzeDropFehler(
                      'Es ist kein Projekt geladen – ein Import braucht ein geöffnetes Projekt.',
                    )
                    return
                  }
                  const dateien = Array.from(ereignis.dataTransfer.files)
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
                }}
              >
                {inhalt === null ? (
                  <AssetGalerie projekt={null} />
                ) : (
                  <AssetGalerie
                    projekt={inhalt}
                    ausgewaehltesId={lage.gewaehltesMediumId}
                    aufWaehlen={(assetId) => setzeLage((alt) => waehleMedium(alt, assetId))}
                  />
                )}
              </div>
            </div>
          </div>

          {/* UNTEN: die Zeitleiste über die volle Breite (Kernachse #412/#414).
              Wird in JEDER Ansicht gezeigt - sie ist die Einfuege-Flaeche. */}
          <Zeitleiste
            projekt={inhalt}
            neuZug={neuZug}
            aktiveKante={aktiveKante}
            laedtKante={laedtKante}
            korbRef={korbRef}
            bandZiel={bandZiel}
          />

          {/* #342: Die Ausgabe-Liste (#230) - der Oeffnungsweg des Export-Dialogs
              (#232). Der Export-Rueckruf oeffnet das Overlay mit LEERER Auswahl
              (M7-60, ENTSCHIEDEN 3); der Erneut-laden-Weg geht direkt an #230. */}
          <div data-testid="composer-ausgaben" style={{ borderTop: '1px solid #444', paddingTop: 8 }}>
            <AusgabeListenansicht
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
          </div>
        </>
      )}

      {/* #342: Das Render-Overlay (#231). befund und Ueberschreib-Lage werden je
          Tastendruck neu gerechnet (#231/#259) - nie zwischengespeichert. */}
      {lage.overlay.art === 'render' && inhalt !== null && voraussetzungen !== null && (
        <OverlayRahmen testid="composer-overlay">
          <RenderDialogAnzeige
            eingabe={lage.ausgabeName}
            befund={pruefeAusgabeName(lage.ausgabeName)}
            lage={pruefeUeberschreiben(lage.ausgabeName, ausgabenStand.dateien)}
            laeuft={lage.laeuft}
            aufEingabe={(wert) => setzeLage((alt) => setzeAusgabeName(alt, wert))}
            aufAusloesen={() => {
              if (pruefeAusgabeName(lage.ausgabeName) !== 'ok' || lage.laeuft) return
              setzeLage((alt) => setzeLaeuft(alt, true))
              const wirkungen: RenderDialogWirkungen = {
                // ENTSCHIEDEN 5 (M7-68): #134 wird UEBERGEBEN, nie direkt gerufen -
                // #231 faengt kaputte_elemente ab und fuehrt in die Reparatur.
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
            }}
            aufAbbrechen={() => setzeLage((alt) => schliesseOverlay(alt))}
          />
        </OverlayRahmen>
      )}

      {/* #425: Die Band-Bearbeitung (#253/M7-60) - endlich montiert. Sie bearbeitet
          das Werbeband des Video-Elements; das Uebernehmen liefert das neue Element,
          die Wurzel korrigiert die Sicht (EIN Undo-Schritt, #243-Huelle). */}
      {bandElement !== null && inhalt !== null && (
        <OverlayRahmen
          testid="composer-overlay-band"
          panelStil={{ minWidth: 460, maxHeight: '80vh', overflow: 'auto' }}
        >
          <EinblendungAnsicht
            element={bandElement}
            aktionen={inhalt.aktionen}
            vorlagen={(vorlagen.hole()?.nutzbare ?? []).map((eintrag) => eintrag.vorlage)}
            stellen={findeKaputteStellen(inhalt)}
            aufUebernommen={(element) => {
              const aktuell = projekt.hole().projekt
              if (aktuell === null) {
                setzeBandElementId(null)
                return
              }
              projekt.setzeListe(
                aktuell.liste.map((eintrag) => (eintrag.id === element.id ? element : eintrag)),
              )
              setzeBandElementId(null)
            }}
            aufAbbrechen={() => setzeBandElementId(null)}
            aufFehler={meldeWurzel}
          />
        </OverlayRahmen>
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
        <OverlayRahmen testid="composer-overlay">
          <MediumLoeschen
            projekt={inhalt}
            assetId={loeschAsset.id}
            loescheMedium={loescheMedium}
            gibVideoHandlesFrei={gibVideoHandlesFrei}
            aufErledigt={() => setzeLage((alt) => schliesseOverlay(alt))}
            aufAbgebrochen={() => setzeLage((alt) => schliesseOverlay(alt))}
            aufFehler={meldeWurzel}
          />
        </OverlayRahmen>
      )}

      {/* #342: Das Export-Overlay (#232). Die Auswahl ist ein WERT der Lage;
          Datei- und Zielwahl laufen ueber waehleDatei/waehleZiel (#232). */}
      {lage.overlay.art === 'export' && inhalt !== null && (
        <OverlayRahmen testid="composer-overlay">
          <ExportDialogAnzeige
            ausgaben={ausgabenStand.dateien}
            auswahl={lage.exportauswahl}
            laeuft={lage.laeuft}
            aufDateiWaehlen={(dateiname) =>
              setzeLage((alt) =>
                setzeExportauswahl(alt, waehleDatei(alt.exportauswahl, dateiname, ausgabenStand.dateien)),
              )
            }
            aufZielWaehlen={() => {
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
            }}
            aufAusloesen={() => {
              if (!istExportBereit(lage.exportauswahl) || lage.laeuft) return
              setzeLage((alt) => setzeLaeuft(alt, true))
              const wirkungen: ExportDialogWirkungen = {
                loeseExportAus: (projektId, dateiname, zielPfad) =>
                  loeseExportAus(projektId, dateiname, zielPfad),
                meldeFehler: meldeWurzel,
              }
              void loeseExportMitAuswahlAus(inhalt.id, lage.exportauswahl, wirkungen).then(
                (ergebnis) => {
                  setzeLage((alt) => {
                    const ruhig = setzeLaeuft(alt, false)
                    return ergebnis.art === 'eingereiht' ? schliesseOverlay(ruhig) : ruhig
                  })
                },
              )
            }}
            aufAbbrechen={() => setzeLage((alt) => schliesseOverlay(alt))}
          />
        </OverlayRahmen>
      )}
    </div>
    </DndContext>
  )
}

function Zeile({
  element,
  index,
  auswaehlen,
}: {
  element: Listenelement
  index: number
  auswaehlen: () => void
}): JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: element.id })
  const einzeln = frameDauer(element)
  return (
    <li
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      data-testid={`composer-zeile-${index}`}
      onClick={auswaehlen}
      style={{
        padding: '2px 0',
        cursor: 'grab',
        color: einzeln.ok ? undefined : FEHLERFARBE,
        transform: CSS.Translate.toString(transform),
        transition,
      }}
    >
      {element.art === 'video' ? 'Video' : 'Segment'} · Element {index + 1}
      {einzeln.ok ? '' : ' (Dauer unbestimmbar)'}
    </li>
  )
}
