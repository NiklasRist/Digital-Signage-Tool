// [marken-editor] Die WURZEL des Reiters [Marken] (#330, TK 9.14.1 / 9.15.2): Liste links,
// geoeffnete Marke in der Mitte, Live-Vorschau rechts. ORDNET AN und REICHT DURCH - kein IPC,
// kein eigener fachlicher Zustand, keine Pixelentscheidung, kein Undo.
//
// IMPORTE: Die Importliste ist der VERTRAG - sie umfasst die einundzwanzig Funktionen, die
// dieser Bildschirm ruft; alle anderen Bausteine ruft der eigene Baustein. DER EINE
// zurueckgestellte Ruf zeichneMarkenVorschau (#303) steht NICHT in der Liste.

import { useEffect, useState } from 'react'
import type { JSX } from 'react'
import type { MarkenZugang } from '../app-shell/marken-zugang' // #305, nur als TYP
import { KONTRAST_SCHWELLE } from '../../shared/contracts/konstanten' // #21, TK 9.11.4
import {
  oeffneMarke, holeGeoeffneteMarke, aufGeoeffneteMarkeGeaendert, erstelleEigenstaendigeMarke,
} from './marken-uebersicht' // #295
import { FARB_ROLLEN, setzeFarbe } from './farben-bearbeiten' // #296
import { baueSchriftAnzeige, LIZENZHINWEIS_IMPORT } from './schriften-bearbeiten' // #297
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

import type { Marke } from '../../shared/contracts/marke'

/**
 * ZEICHENGLEICHE Abschrift der Deklaration in `src/renderer/app-shell/inhalte.tsx` (#314, die
 * DEFINIERENDE Quelle). ZWEI Felder, kein drittes: KEIN `projekt`, KEIN `zeichnen`, KEIN `sitzung`.
 * Weicht die tatsaechliche Fassung ab, ist das ein Vertragsfehler: melden, NICHT anpassen.
 */
export interface MarkenEditorWurzelProps {
  sichtbar: boolean
  /** Zugang zum app-weiten Marken-Bestand (#305/#311). Wird hier BENUTZT, nicht weitergereicht. */
  marken: MarkenZugang
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
  loeschDialog: boolean
  slogan: { text: string; aktiv: boolean }
  sicherheit: Sicherheitsabstand
}

/**
 * Der Bildschirm des Reiters [Marken]: Liste links, geoeffnete Marke in der Mitte,
 * Live-Vorschau rechts (TK 9.14.1). ORDNET AN und REICHT DURCH.
 */
export function MarkenEditorWurzel(eigenschaften: MarkenEditorWurzelProps): JSX.Element {
  const { marken } = eigenschaften
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
      setzeZustand((alt) => ({
        ...alt,
        markeOffen: marke !== null,
        loeschvorschau: null,
        meldeaktionFehler: null,
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
  const spalteMarke = !zeigeMarke ? (
    <div data-testid="marken-offen-leer">Waehle links eine Marke.</div>
  ) : (
    <div data-testid="marken-offen" style={{ overflowY: 'auto' }}>
      {offenAusbau(marke as Marke, zustand, setzeZustand, marken)}
    </div>
  )
  const spalteVorschau = (
    <div data-testid="marken-vorschau" style={{ position: 'sticky', top: 0 }}>
      {/* Live-Vorschau (TK 9.14.1) - zurueckgestellter Ruf zeichneMarkenVorschau (#303),
        s. STOPP des Issues; bis zur Antwort bleibt hier eine neutrale Flaeche. */}
      Live-Vorschau
    </div>
  )
  return (
    <div style={{ display: 'flex', gap: 8, minHeight: 0 }}>
      {spalteListe}
      {spalteMarke}
      {spalteVorschau}
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
    <div data-testid={`herkunft-${pfad.art}`} key={pfad.art}>
      <span>{zeile}</span>
      {lies === 'eigen' && (
        <button data-testid={`herkunft-zurueck-${pfad.art}`} onClick={zuruecksetzen}>
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

function offenAusbau(
  marke: Marke,
  zustand: Zustand,
  setzeZustand: (aktualisiere: (alt: Zustand) => Zustand) => void,
  marken: MarkenZugang,
): JSX.Element {
  const parentName = umstaendeParentName(marke, zustand.markenUebersicht)
  const abstandAlt: Sicherheitsabstand = marke.sicherheit
  return (
    <div>
      <h3 data-testid="marken-kopf">{marke.name}</h3>
      {marke.parent !== null && <p>abgeleitet</p>}
      {/* 1 Farben: über FARB_ROLLEN iterieren, NIE über Object.keys (#296). */}
      <section data-testid="marken-farben">
        {FARB_ROLLEN.map((rolle) => (
          <div key={rolle}>
            <label>
              {rolle}
              <input
                data-testid={`farbe-${rolle}`}
                defaultValue={marke.farben[rolle]}
                onBlur={(e) => {
                  void setzeFarbe(marke.id, rolle, e.target.value)
                }}
              />
            </label>
            {herkunftZeile(marke, { art: 'farbe', rolle }, parentName)}
            {/* Kontrast-Warnung unmittelbar unter `akzent` (ENTSCHIEDEN 7 / 8). */}
            {rolle === 'akzent' && (
              <KontrastWarnung marke={marke} schwellenwert={KONTRAST_SCHWELLE} />
            )}
          </div>
        ))}
      </section>
      {/* 2 Schriften: über SCHRIFT_ROLLEN iterieren. Der Import läuft AUSSCHLIESSLICH über #326. */}
      <section data-testid="marken-schriften">
        {baueSchriftAnzeige(marke).map((anzeige) => (
          <div key={anzeige.rolle}>
            <span>
              {anzeige.rolle}: {anzeige.schrift.familie}
              {anzeige.importiert ? ' (importiert)' : ' (gebündelt)'}
            </span>
            {herkunftZeile(marke, { art: 'schrift', rolle: anzeige.rolle }, parentName)}
            {/* Lizenzhinweis VOR dem Auslöser (R-07); nichts nachgeliefert. */}
            <p>{LIZENZHINWEIS_IMPORT}</p>
            <button
              disabled={zustand.importierLaueft > 0}
              data-testid={`import-schrift-${anzeige.rolle}`}
              onClick={() => {
                void waehleUndImportiereSchrift(marke.id, anzeige.rolle).then((ergebnis) => {
                  // Abbruch ({ ok: true, wert: null }) ist KEIN Fehler (ENTSCHIEDEN 14):
                  // nichts anzeigen, nichts zurücksetzen, kein zweiter Versuch.
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
            {zustand.meldeaktionFehler !== null && (
              <p data-testid="import-fehler">{zustand.meldeaktionFehler}</p>
            )}
          </div>
        ))}
      </section>
      {/* 3 Logo: Import über #326, Entfernen als reguläre Handlung das entferntes Logo */}
      <section data-testid="marken-logo">
        <button
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
      </section>
      {/* 4 Slogan: beide Schlüssel ZUSAMMEN (#307) - auch wenn nur der Schalter sich ändert. */}
      <section data-testid="marken-slogan">
        <input
          value={zustand.slogan.text}
          onChange={(e) =>
            setzeZustand((alt) => ({ ...alt, slogan: { ...alt.slogan, text: e.target.value } }))
          }
        />
        <input
          type="checkbox"
          checked={zustand.slogan.aktiv}
          onChange={(e) =>
            setzeZustand((alt) => ({ ...alt, slogan: { ...alt.slogan, aktiv: e.target.checked } }))
          }
        />
        <button
          onClick={() => {
            void setzeSlogan(marke.id, zustand.slogan).then((ergebnis) => {
              setzeZustand((alt) => ({ ...alt, meldeaktionFehler: ergebnis.ok ? null : ergebnis.fehler.meldung }))
            })
          }}
        >
          Slogan übernehmen
        </button>
        {herkunftZeile(marke, { art: 'slogan' }, parentName)}
      </section>
      {/* 5 Sicherheitsabstand: vor dem Schreiben baueVorlagenHinweis (beim WACHSEN warnen). */}
      <section data-testid="marken-sicherheit">
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
          onClick={() => {
            void setzeSicherheitsabstand(marke.id, zustand.sicherheit).then((ergebnis) => {
              setzeZustand((alt) => ({ ...alt, meldeaktionFehler: ergebnis.ok ? null : ergebnis.fehler.meldung }))
            })
          }}
        >
          Abstand übernehmen
        </button>
        {herkunftZeile(marke, { art: 'sicherheit' }, parentName)}
        <p>{JSON.stringify(abstandAlt)}</p>
      </section>
      {/* Fuß: Löschen mit Vorwarnung (#302) - gefährliche Handlung, NICHT zwischen harmlose. */}
      {loeschStamm(marke, zustand, setzeZustand, marken)}
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
