// [marken-editor] Die WURZEL des Reiters [Marken] (#330, #455, TK 9.14.1 / 9.15.2).
//
// DREI FESTE BEREICHE (Plan `docs/agents/marken-editor-ui-2026-10-29.md`):
//   1. Kopfzeile   - Name, Herkunft, [Gross], Loeschen
//   2. Vorschau    - gross, darunter Vorlagen-Umschalter und Marken-Auswahl
//   3. Inspector   - rechts; zeigt das gewaehlte Element ODER die Reihenfolge der Arbeit
//
// WAS MIT #455 ENTFALLEN IST: die mittlere Feldliste (schon #449), die Palette und die
// schwebende Box. Ihre Aufgaben liegen jetzt im Inspector; die Palette war die Liste der
// Rollen, die die Vorschau nicht zeigt - genau die steht dort unter „Weitere Rollen".
//
// ORDNET AN und REICHT DURCH - kein IPC, kein eigener fachlicher Zustand, keine
// Pixelentscheidung, kein Undo (TK 9.15.2).

import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import type { MarkenZugang } from '../app-shell/marken-zugang' // #305, nur als TYP
import type { VorlagenZugang } from '../app-shell/sichten' // #155, nur als TYP
import {
  oeffneMarke, holeGeoeffneteMarke, aufGeoeffneteMarkeGeaendert, erstelleEigenstaendigeMarke,
} from './marken-uebersicht' // #295
import {
  HINWEIS_NUR_EIGENSTAENDIGE_BASIS, ableitbareBasen, leiteMarkeAb,
} from './marke-ableiten' // #300
import {
  ermittleLoeschvorschau, brauchtStandardmarkenAusweg, bestaetigeLoeschen, type Loeschvorschau,
} from './loeschen-vorwarnung' // #302
import type { Sicherheitsabstand } from './sicherheitsabstand-bearbeiten'
import { MarkenVorschau, findeVorlage, VORSCHAU_VORLAGEN, VORSCHAU_VORLAGE_ID } from './vorschau-flaeche' // #303
import { baueMarkenElemente } from './marken-elemente' // #449
import { Inspector, type Auswahl } from './inspector' // #455
import { filtereMarken } from './auswahl' // #455
import {
  SymbolKnopf, SymbolPapierkorb, SymbolPfeilLinks, SymbolVergroessern, SymbolVerkleinern,
} from '../gemeinsam/symbole' // #456
import type { Marke } from '../../shared/contracts/marke'

/**
 * ZEICHENGLEICHE Abschrift der Deklaration in `src/renderer/app-shell/inhalte.tsx` (#314, die
 * DEFINIERENDE Quelle). DREI Felder (drittes seit der Entscheidung A1 vom 22.10.2026):
 * KEIN `projekt`, KEIN `zeichnen`, KEIN `sitzung`.
 * Weicht die tatsaechliche Fassung ab, ist das ein Vertragsfehler: melden, NICHT anpassen.
 */
export interface MarkenEditorWurzelProps {
  sichtbar: boolean
  /** Zugang zum app-weiten Marken-Bestand (#305/#311). Wird hier BENUTZT, nicht weitergereicht. */
  marken: MarkenZugang
  /** Zugang zur gemeinsamen Vorlagen-Sicht (#155): liefert die drei Vorschau-Vorlagen.
   *  Nur gelesen; kein `lade()` von hier. */
  vorlagen: VorlagenZugang
  /** v3.32 (#456): die Marke, die beim Öffnen gezeigt wird (aus der Projektleiste). */
  startMarkeId: string
  /** v3.32 (#456): das geöffnete Projekt. Nur fuer die Anzeige - der Bestand bleibt app-weit. */
  projektId: string
  /** v3.32 (#456): die Aktionen des Projekts mit ihrer Marke (`Aktion.markeId`, TK 9.15.4).
   *  Der Editor rechnet NICHTS nach - er zaehlt nur, welche davon DIESE Marke tragen. */
  aktionen: readonly { titel: string; markeId: string }[]
  /** v3.32 (#456): Rueckweg in die Reiterflaeche. */
  aufZurueck: () => void
}

/** Der EINE eigene Zustandswert: ob die zuletzt geoeffnete Marke noch gilt (ENTSCHIEDEN 6). */
type Zustand = {
  markenUebersicht: ReturnType<MarkenZugang['hole']>
  markeOffen: boolean
  loeschvorschau: Loeschvorschau | null
  meldeaktionFehler: string | null
  listFehler: string | null
  abgeleitetFehler: string | null
  eigenstaendigFehler: string | null
  nameNeu: string
  nameAbleiten: string
  basisAbleiten: string
  importierLaueft: number
  abstandHinweis: string | null
  slogan: { text: string; aktiv: boolean }
  sicherheit: Sicherheitsabstand
  /** Was der Inspector zeigt; null = Reihenfolge der Arbeit. */
  auswahl: Auswahl | null
  /** Zu welcher Marke die Auswahl gehoert - ein Speichern derselben Marke laesst sie stehen. */
  auswahlMarkeId: string | null
  /** Welche der drei festen Vorschauen gezeichnet wird (ID, nie Name - TK 9.11.4). */
  vorlageId: string
  /** [Gross]: Kopfzeile und Inspector ausgeblendet, die Vorschau nimmt den Reiter. */
  gross: boolean
  /** Suchtext der Marken-Auswahl. */
  suche: string
  /** Die zwei kleinen Formulare unter der Auswahl. */
  neuOffen: boolean
  ableitenOffen: boolean
}

/**
 * Der Bildschirm des Reiters [Marken]: Kopfzeile, grosse Vorschau, Inspector rechts.
 * ORDNET AN und REICHT DURCH.
 */
export function MarkenEditorWurzel(eigenschaften: MarkenEditorWurzelProps): JSX.Element {
  const { sichtbar, marken, vorlagen, startMarkeId, aktionen, aufZurueck } = eigenschaften
  // ENTSCHIEDEN 3: nichts nachladen beim Auftauchen; die Marke kommt aus holeGeoeffneteMarke.
  const [zustand, setzeZustand] = useState<Zustand>(() => ({
    markenUebersicht: marken.hole(),
    markeOffen: true,
    loeschvorschau: null,
    meldeaktionFehler: null,
    listFehler: null,
    abgeleitetFehler: null,
    eigenstaendigFehler: null,
    nameNeu: '',
    nameAbleiten: '',
    basisAbleiten: '',
    importierLaueft: 0,
    abstandHinweis: null,
    slogan: holeGeoeffneteMarke()?.slogan ?? { text: '', aktiv: false },
    sicherheit: holeGeoeffneteMarke()?.sicherheit ?? { horizontal: 0, vertikal: 0 },
    auswahl: null,
    auswahlMarkeId: null,
    vorlageId: VORSCHAU_VORLAGE_ID,
    gross: false,
    suche: '',
    neuOffen: false,
    ableitenOffen: false,
  }))

  // JE EINEN ABO beim Aufbau, beides wieder abgemeldet beim Abbau (DoD).
  useEffect(() => {
    const abmeldenListe = marken.aufGeaendert((uebersicht) => {
      setzeZustand((alt) => ({ ...alt, markenUebersicht: uebersicht ?? null }))
    })
    const abmeldenMarke = aufGeoeffneteMarkeGeaendert((marke) => {
      // Die LOESCHVORSCHAU gehoert zur zuletzt geoeffneten Marke. Wechselt die geoeffnete
      // Marke (oder wird dieselbe erneut geoeffnet), ist eine alte Vorschau veraltet.
      // Am echten Fenster gemessen 21.10.2026 (Treiber 4a2): Nach einer gesperrten
      // Loeschung blieb `marken-loesch-blockiert` stehen - auch nachdem die Marke im
      // Reiter Projekte freigegeben war. Besuchte Reiter bleiben montiert (TK 9.14.2),
      // der Zustand ueberlebte den Reiterwechsel, und der Ausweg "Wechsle die
      // Standardmarke" war damit eine Sackgasse: kein Loesch-Knopf mehr, keine neue
      // Pruefung. Das erneute Oeffnen der Marke ist der natuerliche Neustart der Pruefung.
      //
      // DASSELBE gilt fuer Slogan und Sicherheitsabstand - beide sind Momentaufnahmen
      // EINER Marke, die im Zustand dieser Wurzel liegen. Am echten Fenster gemessen
      // 22.10.2026 (Treiber 4m): Nach dem Oeffnen einer Marke mit 96/54 px standen im
      // Abstands-Feld 0/0 - der Stand des ERSTEN Aufbaus, als noch keine Marke offen war.
      // Ein Klick auf "Abstand uebernehmen" haette die Marke damit still auf 0/0 gesetzt
      // und den Sicherheitsabstand (TK 9.11.4) zerstoert. Jede Momentaufnahme einer
      // Auswahl wird deshalb beim Wechsel der Auswahl nachgezogen.
      setzeZustand((alt) => ({
        ...alt,
        markeOffen: marke !== null,
        loeschvorschau: null,
        meldeaktionFehler: null,
        abstandHinweis: null,
        slogan: marke?.slogan ?? { text: '', aktiv: false },
        sicherheit: marke?.sicherheit ?? { horizontal: 0, vertikal: 0 },
        // Die Auswahl bleibt offen, solange DIESELBE Marke offen ist: Ein Speichern schickt
        // einen neuen Markenstand, und der Nutzer will weiterarbeiten.
        auswahl: marke?.id === alt.auswahlMarkeId ? alt.auswahl : null,
        auswahlMarkeId: marke?.id === alt.auswahlMarkeId ? alt.auswahlMarkeId : null,
      }))
    })
    return () => {
      abmeldenListe()
      abmeldenMarke()
    }
  }, [])

  // #456: Der Einstieg nennt die Marke - der Editor oeffnet GENAU sie. Nur wenn eine
  // ANDERE Marke offen ist, wird gewechselt (sonst stuende bei jedem Rendern ein neuer
  // Ladevorgang an). Der Aufruf ist idempotent, `oeffneMarke` meldet nur echte Wechsel.
  useEffect(() => {
    if (!sichtbar || startMarkeId === '') return
    if (holeGeoeffneteMarke()?.id === startMarkeId) return
    void oeffneMarke(startMarkeId)
  }, [sichtbar, startMarkeId])

  // ESC hebt die Auswahl auf (#455). NUR im sichtbaren Reiter: Besuchte Reiter bleiben
  // montiert (TK 9.14.2) - ein Hoerer ohne diese Schranke schluckte ESC auch in anderen
  // Reitern und waere dort ein unsichtbarer zweiter Tastenweg (#387).
  useEffect(() => {
    if (!sichtbar) return
    const hoerer = (ereignis: KeyboardEvent): void => {
      if (ereignis.key !== 'Escape') return
      setzeZustand((alt) => (alt.auswahl === null ? alt : { ...alt, auswahl: null }))
    }
    window.addEventListener('keydown', hoerer)
    return () => window.removeEventListener('keydown', hoerer)
  }, [sichtbar])

  const uebersicht = zustand.markenUebersicht
  const marke = holeGeoeffneteMarke()
  const zeigeMarke = marke !== null && zustand.markeOffen
  const vorlage = findeVorlage(vorlagen, zustand.vorlageId)
  const elemente = vorlage === null ? [] : baueMarkenElemente(vorlage)
  const parentName = zeigeMarke ? parentNameVon(marke, zustand.markenUebersicht) : null
  const waehle = (auswahl: Auswahl | null): void =>
    setzeZustand((alt) => ({ ...alt, auswahl, auswahlMarkeId: marke?.id ?? null }))

  // v3.32 (#456): WO die Marke gebraucht wird - gezaehlt aus den Aktionen des offenen
  // Projekts, nicht nachgerechnet (die Zuordnung steht in `Aktion.markeId`, TK 9.15.4).
  const verwendung = zeigeMarke
    ? aktionen.filter((eintrag) => eintrag.markeId === (marke as Marke).id)
    : []

  // #456 (Entscheidung Niklas, 30.10.2026): „minimaler Text, Symbole für die Knöpfe."
  // Der Rückweg ist ein PFEIL, kein breiter Textknopf an der prominentesten Stelle; [Groß]
  // und [Löschen] sind Symbole mit `title`/`aria-label`. Sichtbarer Text bleibt nur, wo er
  // Information traegt: Markenname, Verwendung, Herkunft.
  const kopf = zeigeMarke && (
    <div data-testid="marken-kopfzeile" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      <SymbolKnopf
        kennung="marken-zurueck"
        beschriftung="Zurück zum Projekt"
        groesse={24}
        aufKlick={aufZurueck}
      >
        <SymbolPfeilLinks />
      </SymbolKnopf>
      <h3 data-testid="marken-kopf" style={{ margin: 0 }}>{(marke as Marke).name}</h3>
      <span data-testid="marken-verwendung" style={{ opacity: 0.8 }}>
        {verwendung.length === 0
          ? 'In diesem Projekt verwendet sie keine Aktion.'
          : `In diesem Projekt: ${verwendung.length} ${verwendung.length === 1 ? 'Aktion' : 'Aktionen'}`}
      </span>
      {(marke as Marke).parent !== null && (
        <span data-testid="marken-herkunft" style={{ opacity: 0.8 }}>
          abgeleitet von „{parentName ?? 'unbekannt'}"
        </span>
      )}
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
        <SymbolKnopf
          kennung="marken-gross"
          beschriftung="Vorschau vergrößern"
          gedrueckt={zustand.gross}
          groesse={24}
          aufKlick={() => setzeZustand((alt) => ({ ...alt, gross: !alt.gross }))}
        >
          <SymbolVergroessern />
        </SymbolKnopf>
        <div data-testid="marken-loeschbereich">
          {loeschStamm(marke as Marke, zustand, setzeZustand, marken)}
        </div>
      </div>
    </div>
  )

  return (
    <div
      data-testid={zeigeMarke ? 'marken-offen' : undefined}
      style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}
    >
      {!zustand.gross && kopf}
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {zustand.gross && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
              {/* Derselbe Schalter wie in der Kopfzeile (gleiche Kennung, gleiches Symbol),
                  nur an der Stelle, die im Grossmodus sichtbar bleibt: oben rechts. */}
              <SymbolKnopf
                kennung="marken-gross"
                beschriftung="Vorschau verkleinern"
                gedrueckt={zustand.gross}
                groesse={24}
                aufKlick={() => setzeZustand((alt) => ({ ...alt, gross: !alt.gross }))}
              >
                <SymbolVerkleinern />
              </SymbolKnopf>
            </div>
          )}
          <div data-testid="marken-vorschau">
            <MarkenVorschau
              marke={zeigeMarke ? (marke as Marke) : null}
              vorlagen={vorlagen}
              vorlageId={zustand.vorlageId}
              elemente={elemente}
              offenesElement={zustand.auswahl?.art === 'element' ? zustand.auswahl.element.id : null}
              aufElement={(id) => {
                if (id === null) {
                  waehle(null)
                  return
                }
                const element = elemente.find((kandidat) => kandidat.id === id)
                waehle(element === undefined ? null : { art: 'element', element })
              }}
            />
          </div>
          {zeigeMarke && (
            <div data-testid="marken-umschalter" style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginTop: 6 }}>
              {VORSCHAU_VORLAGEN.map((eintrag) => (
                <button
                  key={eintrag.id}
                  data-testid={`vorschau-vorlage-${eintrag.id}`}
                  aria-pressed={zustand.vorlageId === eintrag.id}
                  onClick={() => {
                    // Die Auswahl gehoert zu den Elementen EINER Vorlage; beim Wechsel wird
                    // sie aufgehoben, statt auf ein Element zu zeigen, das es nicht mehr gibt.
                    setzeZustand((alt) => ({ ...alt, vorlageId: eintrag.id, auswahl: null, auswahlMarkeId: null }))
                  }}
                  style={{
                    fontWeight: zustand.vorlageId === eintrag.id ? 700 : 400,
                    border: zustand.vorlageId === eintrag.id ? '2px solid #4da6ff' : undefined,
                  }}
                >
                  {eintrag.name}
                </button>
              ))}
            </div>
          )}
          {!zeigeMarke && <div data-testid="marken-offen-leer">Waehle oben eine Marke.</div>}
          <Markenwahl
            uebersicht={uebersicht}
            zustand={zustand}
            setzeZustand={setzeZustand}
            marken={marken}
            offeneId={(marke as Marke | null)?.id ?? null}
          />
        </div>
        {!zustand.gross && zeigeMarke && (
          <Inspector
            marke={marke as Marke}
            elemente={elemente}
            auswahl={zustand.auswahl}
            aufAuswahl={waehle}
            parentName={parentName}
            slogan={zustand.slogan}
            sicherheit={zustand.sicherheit}
            abstandHinweis={zustand.abstandHinweis}
            importierLaueft={zustand.importierLaueft}
            meldeaktionFehler={zustand.meldeaktionFehler}
            aufSlogan={(slogan) => setzeZustand((alt) => ({ ...alt, slogan }))}
            aufSicherheit={(sicherheit) => setzeZustand((alt) => ({ ...alt, sicherheit }))}
            aufAbstandHinweis={(abstandHinweis) => setzeZustand((alt) => ({ ...alt, abstandHinweis }))}
            aufImportStart={() =>
              setzeZustand((alt) => ({ ...alt, importierLaueft: alt.importierLaueft + 1 }))
            }
            aufImportEnde={(meldung) =>
              setzeZustand((alt) => ({
                ...alt,
                importierLaueft: alt.importierLaueft - 1,
                meldeaktionFehler: meldung,
              }))
            }
          />
        )}
      </div>
    </div>
  )
}

/** „abgeleitet von …" braucht den NAMEN des Parents, nicht seine Kennung. */
function parentNameVon(marke: Marke, uebersicht: ReturnType<MarkenZugang['hole']>): string | null {
  if (marke.parent === null || uebersicht === null) return null
  const parent = uebersicht.marken.find((kandidat) => kandidat.id === marke.parent)
  return parent !== undefined ? parent.name : null
}

/**
 * Die Marken-Auswahl: Klappliste mit Suchfeld, darunter „Neu" und „Ableiten" als kleine
 * Formulare. Die Feldwand der alten linken Spalte entfaellt; die Funktionen bleiben.
 */
function Markenwahl({
  uebersicht,
  zustand,
  setzeZustand,
  marken,
  offeneId,
}: {
  uebersicht: ReturnType<MarkenZugang['hole']>
  zustand: Zustand
  setzeZustand: (aktualisiere: (alt: Zustand) => Zustand) => void
  marken: MarkenZugang
  offeneId: string | null
}): JSX.Element {
  if (uebersicht === null) {
    return (
      <div data-testid="marken-liste">
        <p>Der Marken-Bestand ist nicht geladen.</p>
        <button
          data-testid="marken-lade"
          onClick={() => {
            void marken.lade()
          }}
        >
          Marken laden
        </button>
      </div>
    )
  }
  const gefiltert = filtereMarken(uebersicht.marken, zustand.suche)
  // Der offene Eintrag bleibt in der Liste, auch wenn er nicht zur Suche passt - sonst
  // spraenge die Klappliste auf „keine Auswahl" und der Nutzer verlöre die offene Marke.
  const auswahlWert = offeneId !== null && gefiltert.some((eintrag) => eintrag.id === offeneId) ? offeneId : ''
  return (
    <div data-testid="marken-liste" style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          data-testid="marken-suche"
          placeholder="Marke suchen"
          value={zustand.suche}
          onChange={(e) => setzeZustand((alt) => ({ ...alt, suche: e.target.value }))}
        />
        <select
          data-testid="marken-auswahl"
          value={auswahlWert}
          onChange={(e) => {
            if (e.target.value === '') return
            void oeffneMarke(e.target.value)
          }}
        >
          <option value="">— Marke wählen —</option>
          {gefiltert.map((eintrag) => (
            <option key={eintrag.id} value={eintrag.id}>
              {eintrag.name}
            </option>
          ))}
        </select>
        <button
          data-testid="marken-neu-oeffnen"
          onClick={() => setzeZustand((alt) => ({ ...alt, neuOffen: !alt.neuOffen }))}
        >
          Neue Marke
        </button>
        <button
          data-testid="marken-ableiten-oeffnen"
          onClick={() => setzeZustand((alt) => ({ ...alt, ableitenOffen: !alt.ableitenOffen }))}
        >
          Ableiten
        </button>
      </div>
      {gefiltert.length === 0 && <p data-testid="marken-kein-treffer">Keine Marke passt zu „{zustand.suche}".</p>}
      {zustand.listFehler !== null && <p data-testid="marken-list-fehler">{zustand.listFehler}</p>}
      {zustand.neuOffen && (
        <div data-testid="marken-neu" style={{ marginTop: 6 }}>
          <input
            data-testid="marken-neu-name"
            placeholder="Name der neuen Marke"
            value={zustand.nameNeu}
            onChange={(e) => setzeZustand((alt) => ({ ...alt, nameNeu: e.target.value }))}
          />
          <button
            data-testid="erstelle-eigenstaendige-marken-namen"
            onClick={() => {
              void erstelleEigenstaendigeMarke(zustand.nameNeu).then((ergebnis) => {
                setzeZustand((alt) => ({
                  ...alt,
                  eigenstaendigFehler: ergebnis.ok ? null : ergebnis.fehler.meldung,
                  neuOffen: ergebnis.ok ? false : alt.neuOffen,
                }))
              })
            }}
          >
            Anlegen
          </button>
          {zustand.eigenstaendigFehler !== null && (
            <p data-testid="marken-neu-fehler">{zustand.eigenstaendigFehler}</p>
          )}
        </div>
      )}
      {zustand.ableitenOffen && (
        <div data-testid="marken-ableiten" style={{ marginTop: 6 }}>
          <p>{HINWEIS_NUR_EIGENSTAENDIGE_BASIS}</p>
          <input
            data-testid="marken-ableiten-name"
            placeholder="Name der abgeleiteten Marke"
            value={zustand.nameAbleiten}
            onChange={(e) => setzeZustand((alt) => ({ ...alt, nameAbleiten: e.target.value }))}
          />
          <select
            data-testid="marken-ableiten-basis"
            value={zustand.basisAbleiten}
            onChange={(e) => setzeZustand((alt) => ({ ...alt, basisAbleiten: e.target.value }))}
          >
            {ableitbareBasen(uebersicht).map((basis) => (
              <option key={basis.id} value={basis.id}>
                {basis.name}
              </option>
            ))}
          </select>
          <button
            data-testid="marke-ableiten"
            onClick={() => {
              void leiteMarkeAb(zustand.nameAbleiten, zustand.basisAbleiten).then((ergebnis) => {
                if (ergebnis.ok) {
                  void marken.lade()
                }
                setzeZustand((alt) => ({
                  ...alt,
                  abgeleitetFehler: ergebnis.ok ? null : ergebnis.fehler.meldung,
                  ableitenOffen: ergebnis.ok ? false : alt.ableitenOffen,
                }))
              })
            }}
          >
            Ableiten
          </button>
          {zustand.abgeleitetFehler !== null && (
            <p data-testid="marken-ableiten-fehler">{zustand.abgeleitetFehler}</p>
          )}
        </div>
      )}
    </div>
  )
}

/** Loeschen (#302): Vorschau, Sperrgruende und Bestaetigung - unveraendert aus #449. */
function loeschStamm(
  marke: Marke,
  zustand: Zustand,
  setzeZustand: (aktualisiere: (alt: Zustand) => Zustand) => void,
  marken: MarkenZugang,
): JSX.Element | null {
  const vorschau = zustand.loeschvorschau
  // Reihenfolge verbindlich: ERST ermittleLoeschvorschau, DANN bestaetigeLoeschen.
  const darfFragen = vorschau !== null && vorschau.darfLoeschen
  if (vorschau !== null && !vorschau.darfLoeschen) {
    const nutzung = vorschau.nutzung
    return (
      <div data-testid="marken-loesch-blockiert">
        <p>Löschen ist gesperrt.</p>
        {nutzung !== null && (
          <>
            {/* ALLE DREI Listen mit NAMEN, nie eine Anzahl (TK 9.15.1). */}
            <ul data-testid="loesch-aktionen">
              {nutzung.aktionen.map((n) => (
                <li key={n.aktionId}>{n.projektName} - {n.aktionId}</li>
              ))}
            </ul>
            <ul data-testid="loesch-abgeleitete">
              {nutzung.abgeleiteteMarken.map((n) => (
                <li key={n.markeId}>{n.markeName}</li>
              ))}
            </ul>
            <ul data-testid="loesch-standard">
              {nutzung.standardInProjekten.map((n) => (
                <li key={n.projektId}>{n.projektName}</li>
              ))}
            </ul>
            {/* Der AUSWEG - benannt, NICHT ausgeführt (TK 9.5.2). */}
            {brauchtStandardmarkenAusweg(vorschau) && (
              <p data-testid="loesch-ausweg">Wechsle die Standardmarke im Reiter Projekte.</p>
            )}
          </>
        )}
        {vorschau.eingebaut && <p>Eingebaute Marken sind nicht lösbar.</p>}
      </div>
    )
  }
  return (
    <div>
      {darfFragen && (
        <button
          data-testid="loeschen-bestaetigen"
          onClick={() => {
            void bestaetigeLoeschen(marke.id).then((ergebnis) => {
              if (ergebnis.ok) {
                void marken.lade()
                setzeZustand((alt) => ({ ...alt, markeOffen: false, loeschvorschau: null }))
              }
              setzeZustand((alt) => ({ ...alt, meldeaktionFehler: ergebnis.ok ? null : ergebnis.fehler.meldung }))
            })
          }}
        >
          Löschen bestätigen
        </button>
      )}
      {!darfFragen && (
        // #456: Der Einstieg in den Loeschweg ist ein SYMBOL (Entscheidung Niklas:
        // „minimaler Text, Symbole für die Knöpfe"). Die BESTAETIGUNG bleibt Text:
        // Ein zweiter, anders aussehender Papierkorb hiesse „nochmal dasselbe" - und
        // bei einer destruktiven Aktion ist genau das die falsche Botschaft.
        <SymbolKnopf
          kennung="loeschengesuch"
          beschriftung="Löschen"
          groesse={24}
          aufKlick={() => {
            void ermittleLoeschvorschau(marke).then((ergebnis) => {
              setzeZustand((alt) => ({ ...alt, loeschvorschau: ergebnis.ok ? ergebnis.wert : null }))
            })
          }}
        >
          <SymbolPapierkorb />
        </SymbolKnopf>
      )}
      {zustand.meldeaktionFehler !== null && (
        <p data-testid="marken-loesch-fehler">{zustand.meldeaktionFehler}</p>
      )}
    </div>
  )
}
