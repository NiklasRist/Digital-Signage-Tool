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

import { useEffect, useState, type JSX } from 'react'

import type { Listenelement, Project } from '../../shared/contracts/project'
import type { ProjektZugang, VorlagenZugang, ZeichenZugang } from '../app-shell/sichten'
import type { ReparaturStand } from './reparatur-fuehrung'
import type { ListenZeileModell } from './liste-ansicht'
import type { Uebergabe } from './reparatur-optionen'
import type { MedienImportStarter } from './medien-import'
import { aufSichtGeaendert, holeSicht, type Projektsicht } from './projektzustand'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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
  melde,
  verwirfWurzelMeldung,
  setzeLaeuft,
  setzeAusgabeName,
  setzeExportauswahl,
  istRenderKnopfFrei,
  type ComposerLage,
} from './composer-montage'
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
import { starteReparatur, istRenderFreigegeben } from './reparatur-fuehrung'
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


/**
 * Was diese Wurzel aus ANDEREN Renderer-Modulen braucht und nicht importieren darf
 * (Entscheidung E1: modulübergreifend reisen nur Typen, keine Aufrufe).
 */
export interface ComposerVerdrahtung {
  /** Der Medien-Dialog samt Import-Auftraegen (#204, `app-shell`). Wird an #228
   *  durchgereicht; diese Wurzel oeffnet KEINEN Dialog selbst. */
  starteMedienImport: MedienImportStarter
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
  // Die Band-/Fehlermeldungen von #249: Bandbearbeitung (M7-61) ist nicht
  // angebunden - der Hinweis ist ein Platzhalter, KEINE falsche Oberflche.
  const [bandHinweis, setzeBandHinweis] = useState<string | null>(null)
  // Der Bericht des Imports (#228): ohne ihn "passiert" der Import für den Nutzer
  // NICHTS - eingereiht wird zwar im Main, aber sichtbar war das nie (Befund 04.10.).
  const [importBericht, setzeImportBericht] = useState<ImportBericht | null>(null)
  // #335 (NA-02, Variante A): KEIN zweiter Kanal - der Drop laeuft ueber denselben
  // queue:reiheEin-Weg wie der Dialog (#228), der Main bleibt unangetastet. Die
  // Pfade kommen ueber die Preload-Bruecke (webUtils, ipc-client/pfad-fuer-datei);
  // die Whitelist wird hier VORGEFILTERT (DoD: kein Auftrag fuer nicht
  // unterstuetzte Typen), die finale Pruefung bleibt im Main.
  const [dropFehler, setzeDropFehler] = useState<string | null>(null)
  // #342: DIE EINE ComposerLage (#259). Kein zweiter Zustand fuer Overlay, Meldung,
  // Ausgabename oder Exportauswahl - alles laeuft ueber die acht Uebergaenge.
  const [lage, setzeLage] = useState<ComposerLage>(() => LEERE_COMPOSER_LAGE)
  // #342: Der Bestand der Ausgaben wird GEHOLET, nicht geladen - der Stand liegt
  // in ausgabe-liste.ts (#230); diese Wurzel abonniert ihn und stoesst den ersten
  // Ladevorgang je Projekt an (M7-68, ENTSCHIEDEN 7). aktualisiereAusgaben bleibt
  // dem Nachlauf (#199) vorbehalten und wird hier NICHT gerufen.
  const [ausgabenStand, setzeAusgabenStand] = useState<Ausgabenstand>(() => holeAusgaben())

  useEffect(() => aufAusgabenGeaendert(setzeAusgabenStand), [])

  useEffect(() => projekt.aufGeaendert(setzeSicht), [projekt])

  const inhalt: Project | null = sicht.projekt
  const liste = inhalt?.liste ?? []

  useEffect(() => {
    setzeBandHinweis(null)
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
        aufEinblendungBearbeiten={(elementId) =>
          setzeBandHinweis(
            `Bandbearbeitung fr ${elementId}: die Einblendungs-Ansicht (M7-61) ist hier noch nicht angebunden.`,
          )
        }
        aufFehler={(code, meldung) => setzeBandHinweis(`${code}: ${meldung}`)}
      />
    )
  }

  const gesamt = berechneGesamtlaenge([...liste])

  return (
    <div
      data-testid="composer-wurzel"
      style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, padding: 8, gap: 8 }}
    >
      <div style={{ flex: '0 0 auto', display: 'flex', gap: 8, alignItems: 'center' }}>
        {/* Die Gesamtlnge zeichnet Wiedergabeliste (#248) selbst ber baueLaengenAnzeige. */}
        <span style={{ flex: 1 }} />
        <button
          type="button"
          data-testid="composer-medien-import"
          onClick={() => {
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
          }}
        >
          Medien importieren
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
          <Wiedergabeliste
            projekt={inhalt}
            stellen={findeKaputteStellen(inhalt)}
            reparatur={verdrahtung.reparatur}
            voraussetzungen={zeichnen.hole()}
            zeichneBedienung={zeichneBedienung}
            aufZeileGewaehlt={(elementId) => {
              // ENTSCHIEDEN 8 (#248): Diese Ansicht hlt KEINE Auswahl - hier ist
              // die Wurzel der Aufrufer. Band-Hinweis zurcksetzen gehrt dazu.
              setzeBandHinweis(null)
              void elementId
            }}
          />

          {bandHinweis !== null && (
            <div data-testid="composer-band-hinweis" style={{ color: TAKTFARBE, fontSize: 12 }}>
              {bandHinweis}
            </div>
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
            {inhalt === null ? <AssetGalerie projekt={null} /> : <AssetGalerie projekt={inhalt} />}
          </div>

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
        <div
          data-testid="composer-overlay"
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div style={{ background: '#1f1f1f', padding: 16, minWidth: 360 }}>
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
                  meldeFehler: (code, meldung) =>
                    setzeLage((alt) => melde(alt, { code, meldung, warnung: true })),
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
          </div>
        </div>
      )}

      {/* #342: Das Export-Overlay (#232). Die Auswahl ist ein WERT der Lage;
          Datei- und Zielwahl laufen ueber waehleDatei/waehleZiel (#232). */}
      {lage.overlay.art === 'export' && inhalt !== null && (
        <div
          data-testid="composer-overlay"
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div style={{ background: '#1f1f1f', padding: 16, minWidth: 360 }}>
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
                  setzeLage((alt) =>
                    melde(alt, {
                      code: ergebnis.fehler.code,
                      meldung: ergebnis.fehler.meldung,
                      warnung: true,
                    }),
                  )
                })
              }}
              aufAusloesen={() => {
                if (!istExportBereit(lage.exportauswahl) || lage.laeuft) return
                setzeLage((alt) => setzeLaeuft(alt, true))
                const wirkungen: ExportDialogWirkungen = {
                  loeseExportAus: (projektId, dateiname, zielPfad) =>
                    loeseExportAus(projektId, dateiname, zielPfad),
                  meldeFehler: (code, meldung) =>
                    setzeLage((alt) => melde(alt, { code, meldung, warnung: true })),
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
          </div>
        </div>
      )}
    </div>
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
