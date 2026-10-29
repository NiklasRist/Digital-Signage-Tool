// [marken-editor] Die WURZEL des Reiters [Marken] (#330, TK 9.14.1 / 9.15.2): Liste links,
// geoeffnete Marke in der Mitte, Live-Vorschau rechts. ORDNET AN und REICHT DURCH - kein IPC,
// kein eigener fachlicher Zustand, keine Pixelentscheidung, kein Undo.
//
// IMPORTE: Die Importliste ist der VERTRAG - sie umfasst die Funktionen, die dieser
// Bildschirm ruft; alle anderen Bausteine ruft der eigene Baustein. Die Live-Vorschau
// (#303) wird seit der Entscheidung A1 (22.10.2026) gerufen - aber in ihrem eigenen
// Baustein `vorschau-flaeche.tsx`; diese Wurzel bleibt beim Anordnen.

import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import type { MarkenZugang } from '../app-shell/marken-zugang' // #305, nur als TYP
import type { VorlagenZugang } from '../app-shell/sichten' // #155, nur als TYP
import { KONTRAST_SCHWELLE } from '../../shared/contracts/konstanten' // #21, TK 9.11.4
import {
  oeffneMarke, holeGeoeffneteMarke, aufGeoeffneteMarkeGeaendert, erstelleEigenstaendigeMarke,
} from './marken-uebersicht' // #295
import { FARB_ROLLEN, setzeFarbe } from './farben-bearbeiten' // #296
import { baueSchriftAnzeige, LIZENZHINWEIS_IMPORT, SCHRIFT_ROLLEN } from './schriften-bearbeiten' // #297
import { HINWEIS_LOGO_ENTFERNT, entferneLogo } from './logo-bearbeiten' // #298
import {
  setzeFeldAufGeerbt, leseHerkunft, baueHerkunftText, type HerkunftPfad,
} from './herkunft-anzeigen' // #299
import {
  HINWEIS_NUR_EIGENSTAENDIGE_BASIS, ableitbareBasen, leiteMarkeAb,
} from './marke-ableiten' // #300
import { KontrastWarnung } from './kontrast-warnung' // #301
import {
  ermittleLoeschvorschau, brauchtStandardmarkenAusweg, bestaetigeLoeschen, type Loeschvorschau,
} from './loeschen-vorwarnung' // #302
import { setzeSlogan } from './slogan-bearbeiten' // #307
import {
  setzeSicherheitsabstand, baueVorlagenHinweis, type Sicherheitsabstand,
} from './sicherheitsabstand-bearbeiten' // #308
import { waehleUndImportiereSchrift, waehleUndImportiereLogo } from './datei-import' // #326
import { MarkenVorschau, findeVorschauVorlage } from './vorschau-flaeche' // #303
import {
  baueMarkenElemente,
  nichtGezeigteFarbRollen,
  nichtGezeigteSchriftRollen,
  type MarkenElement,
} from './marken-elemente' // #449

import type { FarbRolle, Marke, SchriftRolle } from '../../shared/contracts/marke'

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
  /** Zugang zur gemeinsamen Vorlagen-Sicht (#155): liefert die feste Vorschau-Vorlage
   *  „Vollbild". Nur gelesen; kein `lade()` von hier. */
  vorlagen: VorlagenZugang
}

/** Was die kleine Box unter der Vorschau gerade zeigt (#449). */
type BoxZiel =
  | { art: 'element'; element: MarkenElement }
  | { art: 'farbe'; rolle: FarbRolle }
  | { art: 'schrift'; rolle: SchriftRolle }
  | { art: 'abstand' }

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
  loeschDialog: boolean
  slogan: { text: string; aktiv: boolean }
  sicherheit: Sicherheitsabstand
  boxZiel: BoxZiel | null
  /** Zu welcher Marke die offene Box gehoert - ein Speichern derselben Marke laesst sie offen. */
  boxMarkeId: string | null
}

/**
 * Der Bildschirm des Reiters [Marken]: Liste links, geoeffnete Marke in der Mitte,
 * Live-Vorschau rechts (TK 9.14.1). ORDNET AN und REICHT DURCH.
 */
export function MarkenEditorWurzel(eigenschaften: MarkenEditorWurzelProps): JSX.Element {
  const { marken, vorlagen } = eigenschaften
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
    loeschDialog: false,
    slogan: holeGeoeffneteMarke()?.slogan ?? { text: '', aktiv: false },
    sicherheit: holeGeoeffneteMarke()?.sicherheit ?? { horizontal: 0, vertikal: 0 },
    boxZiel: null,
    boxMarkeId: null,
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
        // Die Box bleibt offen, solange DIESELBE Marke offen ist: Ein Speichern schickt
        // einen neuen Markenstand, und der Nutzer will weiterarbeiten.
        boxZiel: marke?.id === alt.boxMarkeId ? alt.boxZiel : null,
        boxMarkeId: marke?.id === alt.boxMarkeId ? alt.boxMarkeId : null,
      }))
    })
    return () => {
      abmeldenListe()
      abmeldenMarke()
    }
  }, [])

  const uebersicht = zustand.markenUebersicht
  const marke = holeGeoeffneteMarke()
  const zeigeMarke = marke !== null && zustand.markeOffen
  const spalteListe = (
    <div data-testid="marken-liste">
      {listAusbau(
        uebersicht,
        zustand,
        setzeZustand,
        (id: string) => {
          void oeffneMarke(id)
        },
        marken,
      )}
    </div>
  )
  // #449: Die Elemente kommen aus der Vorschau-Vorlage selbst (Zonen -> Rollen).
  const vorlage = findeVorschauVorlage(vorlagen)
  const elemente = vorlage === null ? [] : baueMarkenElemente(vorlage)
  const spalteMarke = (
    // `key` = Kennung der geoeffneten Marke: Die Farbfelder sind unkontrolliert
    // (defaultValue) und behalten nach einer Bearbeitung ihren sichtbaren Wert, wenn
    // React dasselbe DOM-Element weiterbenutzt. Am echten Fenster gemessen 22.10.2026
    // (Treiber 4m): Nach dem Wechsel auf die eingebaute Marke stand im Akzentfeld noch
    // der Wert der vorigen Marke (#808080 statt #FF4040) - der naechste onBlur haette
    // ihn in die NEUE Marke geschrieben. Der Wechsel der Marke baut den Bereich deshalb
    // neu auf; innerhalb derselben Marke bleibt alles stehen (key unveraendert).
    <div key={zeigeMarke ? (marke as Marke).id : 'leer'} data-testid="marken-offen" style={{ flex: 1, minWidth: 0 }}>
      {zeigeMarke && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <h3 data-testid="marken-kopf" style={{ margin: 0 }}>{(marke as Marke).name}</h3>
          {(marke as Marke).parent !== null && <span style={{ opacity: 0.8 }}>abgeleitet</span>}
          <div style={{ marginLeft: 'auto' }}>{loeschStamm(marke as Marke, zustand, setzeZustand, marken)}</div>
        </div>
      )}
      {/* #303/#449: die EINE Zeichenroutine; die Klickflaechen liegen als Rechtecke darueber. */}
      <div data-testid="marken-vorschau">
        <MarkenVorschau
          marke={zeigeMarke ? (marke as Marke) : null}
          vorlagen={vorlagen}
          elemente={elemente}
          offenesElement={zustand.boxZiel?.art === 'element' ? zustand.boxZiel.element.id : null}
          aufElement={(id) => {
            const element = id === null ? undefined : elemente.find((kandidat) => kandidat.id === id)
            setzeZustand((alt) => ({
              ...alt,
              boxZiel: element === undefined ? null : { art: 'element', element },
              boxMarkeId: element === undefined ? null : ((marke as Marke | null)?.id ?? null),
            }))
          }}
        />
      </div>
      {!zeigeMarke && <div data-testid="marken-offen-leer">Waehle links eine Marke.</div>}
      {zeigeMarke && palette(marke as Marke, elemente, setzeZustand)}
      {zeigeMarke &&
        zustand.boxZiel !== null &&
        elementBox(
          marke as Marke,
          zustand.boxZiel,
          zustand,
          setzeZustand,
          umstaendeParentName(marke as Marke, zustand.markenUebersicht),
        )}
    </div>
  )
  return (
    <div style={{ display: 'flex', gap: 8, minHeight: 0 }}>
      {spalteListe}
      {spalteMarke}
    </div>
  )
}

function listAusbau(
  uebersicht: ReturnType<MarkenZugang['hole']>,
  zustand: Zustand,
  setzeZustand: (aktualisiere: (alt: Zustand) => Zustand) => void,
  oeffne: (id: string) => void,
  marken: MarkenZugang,
): JSX.Element {
  // ENTSCHIEDEN 3: hole() liefert null NUR im Ausnahmefall - dann
  // ein NACH druckender Knopf (kein automatischer Versuch, keine Schleife).
  const liste = uebersicht
  if (liste === null) {
    return (
      <div>
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
  // Kennzeichnung NUR aus den eigenen Feldern: eingebaut und parent (#295 zustand).
  function kennzeichne(m: Marke): string {
    if (m.eingebaut) return 'eingebaut'
    if (m.parent === null) return 'eigenstaendig'
    return 'abgeleitet'
  }
  return (
    <div>
      {/* Liste in Bestandsreihenfolge, KEINE Sortierung, kein Filter (ENTSCHIEDEN 6/13). */}
      {liste.marken.map((m) => (
        <div key={m.id}>
          <button onClick={() => oeffne(m.id)}>{m.name}</button>
          <span> ({kennzeichne(m)})</span>
        </div>
      ))}
      {zustand.listFehler !== null && <p data-testid="marken-list-fehler">{zustand.listFehler}</p>}
      {/* Neue eigenstaendige Marke (#295): Namensfeld + Auslöser; KEIN marken.lade() danach
          (#295 laedt selbst nach). Fehler an dieser Stelle. */}
      <input
        value={zustand.nameNeu}
        onChange={(e) => setzeZustand((alt) => ({ ...alt, nameNeu: e.target.value }))}
      />
      <button
        data-testid="erstelle-eigenstaendige-marken-namen"
        onClick={() => {
          void erstelleEigenstaendigeMarke(zustand.nameNeu).then((ergebnis) => {
            if (!ergebnis.ok) {
              setzeZustand((alt) => ({ ...alt, eigenstaendigFehler: ergebnis.fehler.meldung }))
            } else {
              setzeZustand((alt) => ({ ...alt, eigenstaendigFehler: null }))
            }
          })
        }}
      >
        Neue Marke
      </button>
      {zustand.eigenstaendigFehler !== null && (
        <p data-testid="marken-neu-fehler">{zustand.eigenstaendigFehler}</p>
      )}
      {/* Marke ableiten (#300): Basis nur aus ableitbareBasen, HINWEIS unverändert;
          nach Erfolg marken.lade() GENAU EINMAL (ENTSCHIEDEN 4). KEIN zweites oeffneMarke
          hier - leiteMarkeAb öffnet selbst. */}
      <p>{HINWEIS_NUR_EIGENSTAENDIGE_BASIS}</p>
      <input
        value={zustand.nameAbleiten}
        onChange={(e) => setzeZustand((alt) => ({ ...alt, nameAbleiten: e.target.value }))}
      />
      <select
        value={zustand.basisAbleiten}
        onChange={(e) => setzeZustand((alt) => ({ ...alt, basisAbleiten: e.target.value }))}
      >
        {ableitbareBasen(liste).map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
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
  )
}

function herkunftZeile(
  marke: Marke,
  pfad: HerkunftPfad,
  parentName: string | null,
): JSX.Element | null {
  // Keine Zeile, wenn die Marke eigenstaendig ist oder die Kennung der parent fehlt.
  if (marke.parent === null || parentName === null) return null
  const lies = leseHerkunft(marke.herkunftJeFeld, pfad)
  const zeile = baueHerkunftText(lies, parentName)
  const zuruecksetzen = (): void => {
    void setzeFeldAufGeerbt(marke.id, pfad as HerkunftPfad)
  }
  return (
    <div
      data-testid={`herkunft-${pfad.art}`}
      // #449: Die Rolle gehoert an die Zeile - eine Box zeigt mehrere Farben, und ein
      // Selektor ohne Rolle traefe sonst die erste statt der gemeinten.
      data-rolle={'rolle' in pfad ? pfad.rolle : undefined}
      key={pfad.art}
    >
      <span>{zeile}</span>
      {lies === 'eigen' && (
        <button
          data-testid={`herkunft-zurueck-${pfad.art}`}
          data-rolle={'rolle' in pfad ? pfad.rolle : undefined}
          onClick={zuruecksetzen}
        >
          Vererbung wiederherstellen
        </button>
      )}
    </div>
  )
}

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
        <button
          data-testid="loeschengesuch"
          onClick={() => {
            void ermittleLoeschvorschau(marke).then((ergebnis) => {
              setzeZustand((alt) => ({ ...alt, loeschvorschau: ergebnis.ok ? ergebnis.wert : null }))
            })
          }}
        >
          Löschen
        </button>
      )}
      {zustand.meldeaktionFehler !== null && (
        <p data-testid="marken-loesch-fehler">{zustand.meldeaktionFehler}</p>
      )}
    </div>
  )
}

/** Deutsche Namen der Farb-Rollen fuer die Box (#449) - Anzeige, kein Vertrag. */
const ROLLE_TEXT: Record<FarbRolle, string> = {
  akzent: 'Akzent (Preis-Pille)',
  akzentKraeftig: 'Akzent kräftig',
  akzentTief: 'Akzent tief',
  flaecheDunkel: 'Dunkle Fläche (Hintergrund, Band)',
  flaecheSehrDunkel: 'Sehr dunkle Fläche',
  flaecheHell: 'Helle Fläche (Button)',
  flaecheAkzentZart: 'Akzent zart',
  textAufDunkel: 'Text auf dunklem Grund',
  textAufHell: 'Text auf heller Fläche',
  textSekundaer: 'Text sekundär',
  linie: 'Linie',
  scrimStart: 'Verlauf oben',
  scrimEnde: 'Verlauf unten',
}

/** Deutsche Namen der Schrift-Rollen fuer die Box (#449). */
const SCHRIFT_TEXT: Record<SchriftRolle, string> = {
  headlineElegant: 'Überschrift elegant',
  headlinePlakativ: 'Überschrift plakativ',
  fliesstext: 'Fließtext',
  fliesstextFett: 'Fließtext fett',
}

/** EIN Farbfeld. Geschrieben wird ausschliesslich ueber `setzeFarbe` (#296). */
function farbFeld(marke: Marke, rolle: FarbRolle, parentName: string | null): JSX.Element {
  return (
    <div data-testid={`feld-farbe-${rolle}`}>
      <label>
        {ROLLE_TEXT[rolle]}{' '}
        <input
          data-testid={`farbe-${rolle}`}
          defaultValue={marke.farben[rolle]}
          onBlur={(e) => {
            void setzeFarbe(marke.id, rolle, e.target.value)
          }}
        />
      </label>
      {herkunftZeile(marke, { art: 'farbe', rolle }, parentName)}
      {rolle === 'akzent' && <KontrastWarnung marke={marke} schwellenwert={KONTRAST_SCHWELLE} />}
    </div>
  )
}

/** EINE Schriftzeile mit Import (#326 als EINZIGER Weg). */
function schriftFeld(
  marke: Marke,
  rolle: SchriftRolle,
  zustand: Zustand,
  setzeZustand: (aktualisiere: (alt: Zustand) => Zustand) => void,
  parentName: string | null,
): JSX.Element {
  const anzeige = baueSchriftAnzeige(marke).find((kandidat) => kandidat.rolle === rolle)
  return (
    <div data-testid={`feld-schrift-${rolle}`}>
      <span>
        {SCHRIFT_TEXT[rolle]}: {anzeige?.schrift.familie ?? '–'}
        {anzeige?.importiert === true ? ' (importiert)' : ' (gebündelt)'}
      </span>
      {herkunftZeile(marke, { art: 'schrift', rolle }, parentName)}
      <p>{LIZENZHINWEIS_IMPORT}</p>
      <button
        disabled={zustand.importierLaueft > 0}
        data-testid={`import-schrift-${rolle}`}
        onClick={() => {
          void waehleUndImportiereSchrift(marke.id, rolle).then((ergebnis) => {
            setzeZustand((alt) => ({
              ...alt,
              importierLaueft: alt.importierLaueft - 1,
              meldeaktionFehler: ergebnis.ok ? null : ergebnis.fehler.meldung,
            }))
          })
          setzeZustand((alt) => ({ ...alt, importierLaueft: alt.importierLaueft + 1 }))
        }}
      >
        Eigene Schrift wählen
      </button>
      {zustand.meldeaktionFehler !== null && <p data-testid="import-fehler">{zustand.meldeaktionFehler}</p>}
    </div>
  )
}

/** Logo importieren/entfernen (#326/#298). */
function logoFelder(
  marke: Marke,
  zustand: Zustand,
  setzeZustand: (aktualisiere: (alt: Zustand) => Zustand) => void,
  parentName: string | null,
): JSX.Element {
  return (
    <div data-testid="feld-logo">
      <button
        data-testid="import-logo"
        disabled={zustand.importierLaueft > 0}
        onClick={() => {
          void waehleUndImportiereLogo(marke.id).then((ergebnis) => {
            setzeZustand((alt) => ({
              ...alt,
              importierLaueft: alt.importierLaueft - 1,
              meldeaktionFehler: ergebnis.ok ? null : ergebnis.fehler.meldung,
            }))
          })
          setzeZustand((alt) => ({ ...alt, importierLaueft: alt.importierLaueft + 1 }))
        }}
      >
        Eigenes Logo wählen
      </button>
      <button
        data-testid="entferne-logo"
        onClick={() => {
          void entferneLogo(marke.id).then((ergebnis) => {
            setzeZustand((alt) => ({ ...alt, meldeaktionFehler: ergebnis.ok ? null : ergebnis.fehler.meldung }))
          })
        }}
      >
        Logo entfernen
      </button>
      <p>{HINWEIS_LOGO_ENTFERNT}</p>
      {herkunftZeile(marke, { art: 'logo' }, parentName)}
    </div>
  )
}

/** Slogan (Ersatz-Logo): beide Schluessel ZUSAMMEN (#307). */
function sloganFelder(
  marke: Marke,
  zustand: Zustand,
  setzeZustand: (aktualisiere: (alt: Zustand) => Zustand) => void,
  parentName: string | null,
): JSX.Element {
  return (
    <div data-testid="feld-slogan">
      <input
        data-testid="slogan-text"
        value={zustand.slogan.text}
        onChange={(e) => setzeZustand((alt) => ({ ...alt, slogan: { ...alt.slogan, text: e.target.value } }))}
      />
      <label>
        <input
          data-testid="slogan-aktiv"
          type="checkbox"
          checked={zustand.slogan.aktiv}
          onChange={(e) => setzeZustand((alt) => ({ ...alt, slogan: { ...alt.slogan, aktiv: e.target.checked } }))}
        />{' '}
        Ersatz-Logo zeigen
      </label>
      <button
        data-testid="slogan-uebernehmen"
        onClick={() => {
          void setzeSlogan(marke.id, zustand.slogan).then((ergebnis) => {
            setzeZustand((alt) => ({ ...alt, meldeaktionFehler: ergebnis.ok ? null : ergebnis.fehler.meldung }))
          })
        }}
      >
        Slogan übernehmen
      </button>
      {herkunftZeile(marke, { art: 'slogan' }, parentName)}
    </div>
  )
}

/** Sicherheitsabstand (#308) - gehoert nicht zu einer Zone, liegt in der Palette. */
function abstandFelder(
  marke: Marke,
  zustand: Zustand,
  setzeZustand: (aktualisiere: (alt: Zustand) => Zustand) => void,
  parentName: string | null,
): JSX.Element {
  return (
    <div data-testid="feld-abstand">
      <input
        data-testid="abstand-horizontal"
        value={zustand.sicherheit.horizontal}
        onChange={(e) => angeleitetAbstand(e, zustand, setzeZustand, marke, true)}
      />
      <input
        data-testid="abstand-vertikal"
        value={zustand.sicherheit.vertikal}
        onChange={(e) => angeleitetAbstand(e, zustand, setzeZustand, marke, false)}
      />
      {zustand.abstandHinweis !== null && <p data-testid="abstand-hinweis">{zustand.abstandHinweis}</p>}
      <button
        data-testid="abstand-uebernehmen"
        onClick={() => {
          void setzeSicherheitsabstand(marke.id, zustand.sicherheit).then((ergebnis) => {
            setzeZustand((alt) => ({ ...alt, meldeaktionFehler: ergebnis.ok ? null : ergebnis.fehler.meldung }))
          })
        }}
      >
        Abstand übernehmen
      </button>
      {herkunftZeile(marke, { art: 'sicherheit' }, parentName)}
    </div>
  )
}

/** Die kleine Box (#449): genau das Element, das angeklickt wurde. */
function elementBox(
  marke: Marke,
  ziel: BoxZiel,
  zustand: Zustand,
  setzeZustand: (aktualisiere: (alt: Zustand) => Zustand) => void,
  parentName: string | null,
): JSX.Element {
  const titel =
    ziel.art === 'element'
      ? ziel.element.titel
      : ziel.art === 'farbe'
        ? ROLLE_TEXT[ziel.rolle]
        : ziel.art === 'schrift'
          ? SCHRIFT_TEXT[ziel.rolle]
          : 'Sicherheitsabstand'
  const schliessen = (): void => setzeZustand((alt) => ({ ...alt, boxZiel: null }))
  let inhalt: JSX.Element
  if (ziel.art === 'farbe') {
    inhalt = farbFeld(marke, ziel.rolle, parentName)
  } else if (ziel.art === 'schrift') {
    inhalt = schriftFeld(marke, ziel.rolle, zustand, setzeZustand, parentName)
  } else if (ziel.art === 'abstand') {
    inhalt = abstandFelder(marke, zustand, setzeZustand, parentName)
  } else if (ziel.element.art === 'logo') {
    inhalt = (
      <>
        {logoFelder(marke, zustand, setzeZustand, parentName)}
        {sloganFelder(marke, zustand, setzeZustand, parentName)}
      </>
    )
  } else {
    inhalt = (
      <>
        {ziel.element.schriftRollen.map((rolle) => (
          <div key={`schrift-${rolle}`}>{schriftFeld(marke, rolle, zustand, setzeZustand, parentName)}</div>
        ))}
        {ziel.element.farbRollen.map((rolle) => (
          <div key={`farbe-${rolle}`}>{farbFeld(marke, rolle, parentName)}</div>
        ))}
      </>
    )
  }
  return (
    <div
      data-testid="marken-box"
      style={{ border: '1px solid #4da6ff', borderRadius: 6, padding: 8, marginTop: 8, maxWidth: 420 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <strong data-testid="marken-box-titel">{titel}</strong>
        <button data-testid="marken-box-schliessen" style={{ marginLeft: 'auto' }} onClick={schliessen}>
          ×
        </button>
      </div>
      {inhalt}
    </div>
  )
}

/** Die Palette unter der Vorschau: alles, was die feste Vorlage nicht zeigt. */
function palette(
  marke: Marke,
  elemente: readonly MarkenElement[],
  setzeZustand: (aktualisiere: (alt: Zustand) => Zustand) => void,
): JSX.Element {
  const farben = nichtGezeigteFarbRollen(FARB_ROLLEN, elemente)
  const schriften = nichtGezeigteSchriftRollen(SCHRIFT_ROLLEN, elemente)
  const waehle = (ziel: BoxZiel): void =>
    setzeZustand((alt) => ({ ...alt, boxZiel: ziel, boxMarkeId: marke.id }))
  return (
    <div data-testid="marken-palette" style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
      <span style={{ opacity: 0.75 }}>Nicht in dieser Vorschau:</span>
      {farben.map((rolle) => (
        <button
          key={rolle}
          data-testid={`palette-farbe-${rolle}`}
          title={ROLLE_TEXT[rolle]}
          aria-label={ROLLE_TEXT[rolle]}
          onClick={() => waehle({ art: 'farbe', rolle })}
          style={{ width: 20, height: 20, padding: 0, background: marke.farben[rolle], border: '1px solid #888', borderRadius: 3 }}
        />
      ))}
      {schriften.map((rolle) => (
        <button key={rolle} data-testid={`palette-schrift-${rolle}`} onClick={() => waehle({ art: 'schrift', rolle })}>
          {SCHRIFT_TEXT[rolle]}
        </button>
      ))}
      <button data-testid="palette-abstand" onClick={() => waehle({ art: 'abstand' })}>
        Sicherheitsabstand {marke.sicherheit.horizontal}/{marke.sicherheit.vertikal}
      </button>
    </div>
  )
}

function umstaendeParentName(
  marke: Marke,
  uebersicht: ReturnType<MarkenZugang['hole']>,
): string | null {
  if (marke.parent === null || uebersicht === null) return null
  const parent = uebersicht.marken.find((kandidat) => kandidat.id === marke.parent)
  return parent !== undefined ? parent.name : null
}

function angeleitetAbstand(
  ereignis: { target: { value: string } },
  zustand: Zustand,
  setzeZustand: (aktualisiere: (alt: Zustand) => Zustand) => void,
  marke: Marke,
  horizontal: boolean,
): void {
  const wert = Number(ereignis.target.value)
  const neue: Sicherheitsabstand = horizontal
    ? { ...zustand.sicherheit, horizontal: wert }
    : { ...zustand.sicherheit, vertikal: wert }
  const hinweis = baueVorlagenHinweis(marke.sicherheit, neue) // reine Funktion, wirft nie (#308)
  setzeZustand((alt) => ({ ...alt, sicherheit: neue, abstandHinweis: hinweis }))
}
