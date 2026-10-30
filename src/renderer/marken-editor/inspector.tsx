// [marken-editor] Der Inspector: die rechte Spalte des Marken-Editors (#455, TK 9.15.2).
//
// WAS HIER STEHT UND WARUM: Am 29.10.2026 lautete der Befund woertlich „das mit den marken ist
// untestbar weil die ui so scheiße ist und ich nicht verstehe was was ist" und „nicht klar,
// welche Option in der Box was macht und warum es die braucht". Die Antwort ist diese Spalte:
//
//   - Sie zeigt IMMER genau eine Sache: das gewaehlte Element - oder, wenn nichts gewaehlt ist,
//     die REIHENFOLGE DER ARBEIT (sechs Stufen aus dem Plan vom 29.10.2026).
//   - Jeder Regler traegt seinen Satz aus `rollen-texte.ts` - sichtbar, nicht als Tooltip.
//   - Was die Vorschau nicht zeigt, ist trotzdem erreichbar (`Weitere Rollen`) - kein Regler
//     verschwindet, nur weil eine Vorlage ihn nicht benutzt.
//
// ABGRENZUNG: Dieses Bauteil RECHNET NICHTS FACHLICHES. Es ruft die bestehenden Operationen
// (`setzeFarbe`, `waehleUndImportiereSchrift`, `waehleUndImportiereLogo`, `entferneLogo`,
// `setzeSlogan`, `setzeSicherheitsabstand`, `setzeFeldAufGeerbt`) und reicht Momentaurnahmen
// (Slogan, Sicherheitsabstand) nach oben durch. Kein zweiter Schreibweg (TK 9.15.2).

import type { JSX } from 'react'

import type { FarbRolle, Marke, SchriftRolle } from '../../shared/contracts/marke'
import { KONTRAST_SCHWELLE } from '../../shared/contracts/konstanten'
import type { MarkenElement } from './marken-elemente'
import { farbRollenText, schriftRollenText } from './rollen-texte'
import { FARB_ROLLEN, setzeFarbe } from './farben-bearbeiten'
import { baueSchriftAnzeige, LIZENZHINWEIS_IMPORT, SCHRIFT_ROLLEN } from './schriften-bearbeiten'
import { HINWEIS_LOGO_ENTFERNT, entferneLogo } from './logo-bearbeiten'
import {
  setzeFeldAufGeerbt, leseHerkunft, baueHerkunftText, type HerkunftPfad,
} from './herkunft-anzeigen'
import { KontrastWarnung } from './kontrast-warnung'
import { setzeSlogan } from './slogan-bearbeiten'
import {
  setzeSicherheitsabstand, baueVorlagenHinweis, type Sicherheitsabstand,
} from './sicherheitsabstand-bearbeiten'
import { waehleUndImportiereSchrift, waehleUndImportiereLogo } from './datei-import'

/** Was der Inspector gerade zeigt. Genau EINE Wahl zur Zeit. */
export type Auswahl =
  | { art: 'element'; element: MarkenElement }
  | { art: 'farbe'; rolle: FarbRolle }
  | { art: 'schrift'; rolle: SchriftRolle }
  | { art: 'abstand' }

export interface InspectorProps {
  marke: Marke
  /** Die Elemente der aktuell gezeigten Vorlage (Zonen -> Elemente, #449). */
  elemente: readonly MarkenElement[]
  auswahl: Auswahl | null
  aufAuswahl: (auswahl: Auswahl | null) => void
  /** Name des Parents einer abgeleiteten Marke; null = eigenstaendig oder unbekannt. */
  parentName: string | null
  /** Momentaufnahme, die der Editor haelt (#307). */
  slogan: { text: string; aktiv: boolean }
  /** Momentaufnahme, die der Editor haelt (#308). */
  sicherheit: Sicherheitsabstand
  abstandHinweis: string | null
  /** Zahl der laufenden Importe; > 0 sperrt die Import-Knoepfe. */
  importierLaueft: number
  /** Meldung der letzten Operation, null = keine. */
  meldeaktionFehler: string | null
  aufSlogan: (slogan: { text: string; aktiv: boolean }) => void
  aufSicherheit: (sicherheit: Sicherheitsabstand) => void
  aufAbstandHinweis: (hinweis: string | null) => void
  aufImportStart: () => void
  aufImportEnde: (meldung: string | null) => void
}

/** Ein Eintrag der Reihenfolge der Arbeit (Plan 29.10.2026, Abschnitt 4). */
export interface Arbeitsschritt {
  nummer: number
  titel: string
  /** Ein Satz: was diese Stufe setzt. */
  zweck: string
  /** Das Element, das der Klick waehlt - null, wenn die Stufe kein Element hat. */
  elementId: string | null
  /** Die Rollen, die diese Stufe fuehrt. Der Rest steht unter „Weitere Rollen". */
  farbRollen: readonly FarbRolle[]
  schriftRollen: readonly SchriftRolle[]
}

/**
 * Die sechs Stufen. SIE SIND DATEN, KEINE ANSICHT: Der Plan legt die Reihenfolge fest; wenn
 * sich daran etwas aendert, aendert sich diese Tabelle - nicht das Markup.
 */
export const ARBEITSSCHRITTE: readonly Arbeitsschritt[] = [
  {
    nummer: 1,
    titel: 'Logo',
    zweck: 'Logo-Bild oder Ersatz durch den Markennamen (Slogan).',
    elementId: 'logo',
    farbRollen: [],
    schriftRollen: [],
  },
  {
    nummer: 2,
    titel: 'Flächen',
    zweck: 'Grund hinter allem, und die helle Fläche des Knopfes.',
    elementId: 'hintergrund',
    farbRollen: ['flaecheDunkel', 'flaecheSehrDunkel', 'flaecheHell'],
    schriftRollen: [],
  },
  {
    nummer: 3,
    titel: 'Text',
    zweck: 'Schriften und Textfarben von Überschrift und Beschreibung.',
    elementId: 'ueberschrift',
    farbRollen: ['textAufDunkel', 'textAufHell', 'textSekundaer'],
    schriftRollen: ['headlinePlakativ', 'headlineElegant', 'fliesstext', 'fliesstextFett'],
  },
  {
    nummer: 4,
    titel: 'Preis und Button',
    zweck: 'Die Akzentflächen - sie fallen im Segment zuerst auf.',
    elementId: 'preis',
    farbRollen: ['akzent', 'akzentKraeftig', 'akzentTief', 'flaecheAkzentZart'],
    schriftRollen: [],
  },
  {
    nummer: 5,
    titel: 'Verlauf',
    zweck: 'Die Abdunkelung über dem Bild, damit die Schrift lesbar bleibt.',
    elementId: 'scrim',
    farbRollen: ['scrimStart', 'scrimEnde'],
    schriftRollen: [],
  },
  {
    nummer: 6,
    titel: 'Sicherheitsabstand',
    zweck: 'Der Rand, den der Fernseher abschneiden darf.',
    elementId: null,
    farbRollen: [],
    schriftRollen: [],
  },
]

/** Farb-Rollen, die KEINE Stufe fuehrt - sie waeren sonst unerreichbar. */
export function weitereFarbRollen(): FarbRolle[] {
  const gefuehrt = new Set(ARBEITSSCHRITTE.flatMap((schritt) => schritt.farbRollen))
  return FARB_ROLLEN.filter((rolle) => !gefuehrt.has(rolle))
}

/** Schrift-Rollen, die KEINE Stufe fuehrt. */
export function weitereSchriftRollen(): SchriftRolle[] {
  const gefuehrt = new Set(ARBEITSSCHRITTE.flatMap((schritt) => schritt.schriftRollen))
  return SCHRIFT_ROLLEN.filter((rolle) => !gefuehrt.has(rolle))
}

/** Der Titel einer Auswahl (Kopf der Werte-Spalte). */
function auswahlTitel(auswahl: Auswahl): string {
  if (auswahl.art === 'element') return auswahl.element.titel
  if (auswahl.art === 'farbe') return farbRollenText(auswahl.rolle).name
  if (auswahl.art === 'schrift') return schriftRollenText(auswahl.rolle).name
  return 'Sicherheitsabstand'
}

/** Der Satz zu einer Auswahl - der Kopf traegt ihn immer (#455: kein Regler ohne Satz). */
function auswahlZweck(auswahl: Auswahl): string {
  if (auswahl.art === 'element') return ''
  if (auswahl.art === 'farbe') return farbRollenText(auswahl.rolle).zweck
  if (auswahl.art === 'schrift') return schriftRollenText(auswahl.rolle).zweck
  return 'Horizontal und vertikal in Pixeln des 1920×1080-Rahmens.'
}

export function Inspector(p: InspectorProps): JSX.Element {
  const gewaehlt = p.auswahl
  if (gewaehlt === null) {
    return (
      <div data-testid="marken-inspector" style={{ flex: 1, minWidth: 280, maxWidth: 420 }}>
        <Reihenfolge p={p} />
      </div>
    )
  }
  return (
    <div data-testid="marken-inspector" style={{ flex: 1, minWidth: 280, maxWidth: 420 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <strong data-testid="marken-inspector-titel">{auswahlTitel(gewaehlt)}</strong>
        <button
          data-testid="marken-inspector-zurueck"
          style={{ marginLeft: 'auto' }}
          onClick={() => p.aufAuswahl(null)}
        >
          ×
        </button>
      </div>
      {auswahlZweck(gewaehlt) !== '' && (
        <p data-testid="marken-inspector-zweck" style={{ opacity: 0.75, marginTop: 0 }}>
          {auswahlZweck(gewaehlt)}
        </p>
      )}
      <Werte p={p} auswahl={gewaehlt} />
    </div>
  )
}

/** Die Werte der gewaehlten Sache. Genau EIN Zweig - nie zwei Bereiche gleichzeitig. */
function Werte({ p, auswahl }: { p: InspectorProps; auswahl: Auswahl }): JSX.Element {
  if (auswahl.art === 'farbe') {
    return farbFeld(p, auswahl.rolle)
  }
  if (auswahl.art === 'schrift') {
    return schriftFeld(p, auswahl.rolle)
  }
  if (auswahl.art === 'abstand') {
    return abstandFelder(p)
  }
  if (auswahl.element.art === 'logo') {
    return (
      <>
        {logoFelder(p)}
        {sloganFelder(p)}
      </>
    )
  }
  return (
    <>
      {auswahl.element.schriftRollen.map((rolle) => (
        <div key={`schrift-${rolle}`}>{schriftFeld(p, rolle)}</div>
      ))}
      {auswahl.element.farbRollen.map((rolle) => (
        <div key={`farbe-${rolle}`}>{farbFeld(p, rolle)}</div>
      ))}
    </>
  )
}

/**
 * Die Reihenfolge der Arbeit (#455, Plan Abschnitt 4).
 *
 * FORTSCHRITT NUR, WO ER EHRLICH IST: Logo vorhanden, Slogan gesetzt, Sicherheitsabstand
 * ungleich 0. Eine Farbe ist immer gesetzt - ein Haekchen dafuer waere eine Luege.
 */
function Reihenfolge({ p }: { p: InspectorProps }): JSX.Element {
  const elementNach = (id: string | null): MarkenElement | undefined =>
    id === null ? undefined : p.elemente.find((element) => element.id === id)
  const fortschritt = (schritt: Arbeitsschritt): string | null => {
    if (schritt.nummer === 1) {
      if (p.marke.logo === null && !(p.marke.slogan.aktiv && p.marke.slogan.text !== '')) return '…'
      return '✓'
    }
    if (schritt.nummer === 6) {
      return p.marke.sicherheit.horizontal === 0 && p.marke.sicherheit.vertikal === 0 ? '…' : '✓'
    }
    return null
  }
  return (
    <div data-testid="marken-reihenfolge">
      <strong>Reihenfolge der Arbeit</strong>
      <ol style={{ paddingLeft: 18, margin: '6px 0' }}>
        {ARBEITSSCHRITTE.map((schritt) => {
          const element = elementNach(schritt.elementId)
          const zeichen = fortschritt(schritt)
          return (
            <li key={schritt.nummer} style={{ marginBottom: 6 }}>
              <button
                data-testid={`marken-schritt-${schritt.nummer}`}
                disabled={schritt.elementId !== null && element === undefined}
                onClick={() => {
                  if (element !== undefined) p.aufAuswahl({ art: 'element', element })
                  else if (schritt.elementId === null) p.aufAuswahl({ art: 'abstand' })
                }}
              >
                {schritt.titel}
                {zeichen === null ? '' : ` ${zeichen}`}
              </button>
              <div style={{ opacity: 0.75, fontSize: 12 }}>{schritt.zweck}</div>
              {/* Die Rollen der Stufe sind ANKLICKBAR: sonst waeren sie nur aufgelistet und
                  nicht erreichbar - genau die Luecke, die „alle Rollen erreichbar" schliesst. */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
                {schritt.farbRollen.map((rolle) => (
                  <button
                    key={rolle}
                    data-testid={`marken-farbe-${rolle}`}
                    title={farbRollenText(rolle).zweck}
                    onClick={() => p.aufAuswahl({ art: 'farbe', rolle })}
                    style={{ fontSize: 11 }}
                  >
                    {farbRollenText(rolle).name}
                  </button>
                ))}
                {schritt.schriftRollen.map((rolle) => (
                  <button
                    key={rolle}
                    data-testid={`marken-schrift-${rolle}`}
                    title={schriftRollenText(rolle).zweck}
                    onClick={() => p.aufAuswahl({ art: 'schrift', rolle })}
                    style={{ fontSize: 11 }}
                  >
                    {schriftRollenText(rolle).name}
                  </button>
                ))}
              </div>
            </li>
          )
        })}
      </ol>
      <Rollenliste p={p} />
    </div>
  )
}

/** Was keine Stufe fuehrt - und deshalb hier steht, statt unerreichbar zu sein. */
function Rollenliste({ p }: { p: InspectorProps }): JSX.Element {
  const farben = weitereFarbRollen()
  const schriften = weitereSchriftRollen()
  return (
    <div data-testid="marken-weitere-rollen">
      <p style={{ margin: '8px 0 4px', opacity: 0.75 }}>
        Weitere Rollen (in dieser Vorschau nicht sichtbar):
      </p>
      {farben.map((rolle) => (
        <button
          key={rolle}
          data-testid={`weitere-farbe-${rolle}`}
          title={farbRollenText(rolle).zweck}
          onClick={() => p.aufAuswahl({ art: 'farbe', rolle })}
          style={{ marginRight: 4, marginBottom: 4 }}
        >
          {farbRollenText(rolle).name}
        </button>
      ))}
      {schriften.map((rolle) => (
        <button
          key={rolle}
          data-testid={`weitere-schrift-${rolle}`}
          title={schriftRollenText(rolle).zweck}
          onClick={() => p.aufAuswahl({ art: 'schrift', rolle })}
          style={{ marginRight: 4, marginBottom: 4 }}
        >
          {schriftRollenText(rolle).name}
        </button>
      ))}
    </div>
  )
}

/** Eine Herkunftszeile (#299) - bei abgeleiteten Marken zeigt sie geerbt/eigen. */
function herkunftZeile(marke: Marke, pfad: HerkunftPfad, parentName: string | null): JSX.Element | null {
  if (marke.parent === null || parentName === null) return null
  const lies = leseHerkunft(marke.herkunftJeFeld, pfad)
  const zeile = baueHerkunftText(lies, parentName)
  const zuruecksetzen = (): void => {
    void setzeFeldAufGeerbt(marke.id, pfad as HerkunftPfad)
  }
  return (
    <div data-testid={`herkunft-${pfad.art}`} data-rolle={'rolle' in pfad ? pfad.rolle : undefined}>
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

/** EIN Farbfeld. Geschrieben wird ausschliesslich ueber `setzeFarbe` (#296). */
function farbFeld(p: InspectorProps, rolle: FarbRolle): JSX.Element {
  const text = farbRollenText(rolle)
  return (
    <div data-testid={`feld-farbe-${rolle}`}>
      <label>
        {text.name}{' '}
        <input
          data-testid={`farbe-${rolle}`}
          defaultValue={p.marke.farben[rolle]}
          onBlur={(e) => {
            void setzeFarbe(p.marke.id, rolle, e.target.value)
          }}
        />
      </label>
      <p data-testid={`zweck-farbe-${rolle}`} style={{ opacity: 0.75, margin: '2px 0 0' }}>
        {text.zweck}
      </p>
      {herkunftZeile(p.marke, { art: 'farbe', rolle }, p.parentName)}
      {rolle === 'akzent' && <KontrastWarnung marke={p.marke} schwellenwert={KONTRAST_SCHWELLE} />}
    </div>
  )
}

/** EINE Schriftzeile mit Import (#326 als EINZIGER Weg). */
function schriftFeld(p: InspectorProps, rolle: SchriftRolle): JSX.Element {
  const anzeige = baueSchriftAnzeige(p.marke).find((kandidat) => kandidat.rolle === rolle)
  const text = schriftRollenText(rolle)
  return (
    <div data-testid={`feld-schrift-${rolle}`}>
      <span>
        {text.name}: {anzeige?.schrift.familie ?? '–'}
        {anzeige?.importiert === true ? ' (importiert)' : ' (gebündelt)'}
      </span>
      <p data-testid={`zweck-schrift-${rolle}`} style={{ opacity: 0.75, margin: '2px 0 0' }}>
        {text.zweck}
      </p>
      {herkunftZeile(p.marke, { art: 'schrift', rolle }, p.parentName)}
      <p>{LIZENZHINWEIS_IMPORT}</p>
      <button
        disabled={p.importierLaueft > 0}
        data-testid={`import-schrift-${rolle}`}
        onClick={() => {
          p.aufImportStart()
          void waehleUndImportiereSchrift(p.marke.id, rolle).then((ergebnis) => {
            p.aufImportEnde(ergebnis.ok ? null : ergebnis.fehler.meldung)
          })
        }}
      >
        Eigene Schrift wählen
      </button>
      {p.meldeaktionFehler !== null && <p data-testid="import-fehler">{p.meldeaktionFehler}</p>}
    </div>
  )
}

/** Logo importieren/entfernen (#326/#298). */
function logoFelder(p: InspectorProps): JSX.Element {
  return (
    <div data-testid="feld-logo">
      <button
        data-testid="import-logo"
        disabled={p.importierLaueft > 0}
        onClick={() => {
          p.aufImportStart()
          void waehleUndImportiereLogo(p.marke.id).then((ergebnis) => {
            p.aufImportEnde(ergebnis.ok ? null : ergebnis.fehler.meldung)
          })
        }}
      >
        Eigenes Logo wählen
      </button>
      <button
        data-testid="entferne-logo"
        onClick={() => {
          void entferneLogo(p.marke.id).then((ergebnis) => {
            p.aufImportEnde(ergebnis.ok ? null : ergebnis.fehler.meldung)
          })
        }}
      >
        Logo entfernen
      </button>
      <p>{HINWEIS_LOGO_ENTFERNT}</p>
      {herkunftZeile(p.marke, { art: 'logo' }, p.parentName)}
    </div>
  )
}

/** Slogan (Ersatz-Logo): beide Schluessel ZUSAMMEN (#307). */
function sloganFelder(p: InspectorProps): JSX.Element {
  return (
    <div data-testid="feld-slogan">
      <input
        data-testid="slogan-text"
        value={p.slogan.text}
        onChange={(e) => p.aufSlogan({ ...p.slogan, text: e.target.value })}
      />
      <label>
        <input
          data-testid="slogan-aktiv"
          type="checkbox"
          checked={p.slogan.aktiv}
          onChange={(e) => p.aufSlogan({ ...p.slogan, aktiv: e.target.checked })}
        />{' '}
        Ersatz-Logo zeigen
      </label>
      <button
        data-testid="slogan-uebernehmen"
        onClick={() => {
          void setzeSlogan(p.marke.id, p.slogan).then((ergebnis) => {
            p.aufImportEnde(ergebnis.ok ? null : ergebnis.fehler.meldung)
          })
        }}
      >
        Slogan übernehmen
      </button>
      {herkunftZeile(p.marke, { art: 'slogan' }, p.parentName)}
    </div>
  )
}

/** Sicherheitsabstand (#308) - gehoert zu keiner Zone. */
function abstandFelder(p: InspectorProps): JSX.Element {
  const setze = (horizontal: boolean, wert: string): void => {
    const neu: Sicherheitsabstand = horizontal
      ? { ...p.sicherheit, horizontal: Number(wert) }
      : { ...p.sicherheit, vertikal: Number(wert) }
    // Die Warnung kommt aus der BESTEHENDEN Rechnung (#308) - hier wird nichts nachgebaut.
    p.aufAbstandHinweis(baueVorlagenHinweis(p.marke.sicherheit, neu))
    p.aufSicherheit(neu)
  }
  return (
    <div data-testid="feld-abstand">
      <input
        data-testid="abstand-horizontal"
        value={p.sicherheit.horizontal}
        onChange={(e) => setze(true, e.target.value)}
      />
      <input
        data-testid="abstand-vertikal"
        value={p.sicherheit.vertikal}
        onChange={(e) => setze(false, e.target.value)}
      />
      {p.abstandHinweis !== null && <p data-testid="abstand-hinweis">{p.abstandHinweis}</p>}
      <button
        data-testid="abstand-uebernehmen"
        onClick={() => {
          void setzeSicherheitsabstand(p.marke.id, p.sicherheit).then((ergebnis) => {
            p.aufImportEnde(ergebnis.ok ? null : ergebnis.fehler.meldung)
          })
        }}
      >
        Abstand übernehmen
      </button>
      {herkunftZeile(p.marke, { art: 'sicherheit' }, p.parentName)}
    </div>
  )
}
