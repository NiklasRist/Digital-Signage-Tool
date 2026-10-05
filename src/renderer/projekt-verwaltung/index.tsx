// Die Modul-Wurzel der Projektverwaltung (#252 / M7-59).
//
// Sie LADT und HAeLT die Projektliste (#222), setzt Liste, Beschädigt-Zeile,
// Anlegen, Oeffnen, Duplizieren und Loeschen zu einem Bildschirm zusammen und
// baut aus den uebergebenen Zugaengen die drei Wirkungs-Buendel
// (verwaltung-montage.ts) - und nur daraus.
//
// KEIN IPC, kein KANAELE, kein rufeAuf: Jeder Schreibweg laeuft durch die
// Bausteine #224/#225/#226; die Wurzel ordnet nur.
// Immer GENAU EIN Dialog offen (VerwaltungsDialog, ein Wert); gleicheDialogAb
// laeuft nach jeder Aktualisierung, damit ein Dialog, dessen Eintrag schwindet,
// selbst schliesst.

import { useEffect, useState, type JSX } from 'react'
import type { ProjektZugang, ZeichenZugang } from '../app-shell/sichten'

import {
  aufProjektlisteGeaendert,
  holeProjektliste,
  ladeProjektliste,
  type Projektliste,
} from './liste'
import { Projektlisteansicht } from './liste-ansicht'
// Der Anzeiger wohnt im tsx-Nachbarn der .ts-Regel-Datei; ohne Endung wollte die
// tsconfig die .ts-Datei haben (TS5097-Zeile wie im Projekt ueblich).
import { BeschaedigteZeile } from './beschaedigt.tsx'
import { istOeffnenErlaubt, oeffneProjektordner } from './beschaedigt'
import { legeProjektAn, oeffneProjekt, pruefeProjektname } from './anlegen-oeffnen'
import { baueDuplizierHinweis, dupliziereProjekt, pruefeDuplikatname, schlageDuplikatnamenVor } from './duplizieren'
import {
  baueLoeschBestaetigung,
  istAktivesProjekt,
  loescheProjekt,
} from './loeschen'
import { LoeschBestaetigungsAnzeige } from './loeschen.tsx'
import {
  baueDuplizierWirkungen,
  baueLoeschWirkungen,
  baueWechselWirkungen,
  gleicheDialogAb,
  KEIN_DIALOG,
  oeffneAnlegen,
  oeffneDuplizieren,
  oeffneLoeschen,
  offenesProjektId,
  schliesseDialog,
  type VerwaltungsDialog,
  type VerwaltungsUmgebung,
} from './verwaltung-montage'

/** ZEICHENGLEICH zu `ProjektVerwaltungWurzelProps` in #244. */
export interface ProjektVerwaltungWurzelProps {
  sichtbar: boolean
  /** ROHER Projektzugang (#243) – ein Projektwechsel ist kein Bearbeitungsschritt. */
  projekt: ProjektZugang
  zeichnen: ZeichenZugang
  leereProjektHistorie: () => void
  wechsleZuZusammenstellen: () => void
}

export function ProjektVerwaltungWurzel(p: ProjektVerwaltungWurzelProps): JSX.Element {
  if (!p.sichtbar) {
    // Abbau verboten (TK 9.14.2): unsichtbar, aber gemountet - die Abos bleiben.
    return <div data-testid="verwaltung-inaktiv" style={{ display: 'none' }} />
  }
  return <ProjekteInterna {...p} />
}

function ProjekteInterna(p: ProjektVerwaltungWurzelProps): JSX.Element {
  const [liste, setzeListe] = useState<Projektliste>(() => holeProjektliste())
  const [dialog, setzeDialog] = useState<VerwaltungsDialog>(KEIN_DIALOG)
  const [anlegenName, setzeAnlegenName] = useState('')
  const [duplikatName, setzeDuplikatName] = useState('')
  const [meldungsText, setzeMeldung] = useState<string | null>(null)
  const meldeFehler = (code: string, meldung: string): void => {
    // Der EINE Meldeplatz; eine neue Meldung ersetzt die alte (ENTSCHIEDEN 10).
    setzeMeldung(`${meldung} (${code})`)
  }

  const umgebung: VerwaltungsUmgebung = {
    projekt: p.projekt,
    zeichnen: p.zeichnen,
    leereProjektHistorie: p.leereProjektHistorie,
    wechsleZuZusammenstellen: p.wechsleZuZusammenstellen,
    aktualisiereProjektliste: (async () => {
      await ladeProjektliste()
    }) as () => Promise<unknown>,
    meldeFehler,
  }

  useEffect(() => {
    // Erstladen NUR, wenn der Zustand noch unbekannt ist (ENTSCHIEDEN 11);
    // danach tragen die Abos die Aktualisierung.
    if (holeProjektliste().zustand === 'unbekannt') {
      void ladeProjektliste()
    }
    const abmeldenListe = aufProjektlisteGeaendert((neu) => {
      setzeListe(neu)
      setzeDialog((aktuell) => gleicheDialogAb(aktuell, neu.eintraege))
    })
    // Der Projektstand interessiert für istOffenesProjekt in der Lösch-Abfrage.
    return () => {
      abmeldenListe()
    }
  }, [])

  if (liste.ladefehler !== null) {
    return (
      <div data-testid="verwaltung-ladefehler" style={{ padding: 8, color: '#e5634d', fontSize: 12 }}>
        {liste.ladefehler.meldung}
      </div>
    )
  }

  const ausgeladen = p.projekt.hole().projekt
  const offen = offenesProjektId(ausgeladen)
  const wechsel = baueWechselWirkungen(umgebung)
  const loesch = baueLoeschWirkungen(umgebung)

  return (
    <div data-testid="projekt-verwaltung" style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 8 }}>
      {meldungsText !== null && (
        <div data-testid="verwaltung-meldung" style={{ color: '#e5634d', fontSize: 12 }}>
          {meldungsText}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" data-testid="verwaltung-anlegen" onClick={() => setzeDialog(oeffneAnlegen())}>
          Neues Projekt
        </button>
        <button
          type="button"
          data-testid="verwaltung-erneut-laden"
          onClick={() => {
            void ladeProjektliste()
          }}
        >
          Erneut laden
        </button>
      </div>

      <Projektlisteansicht
        liste={liste}
        offenesProjektId={offen}
        aufOeffnen={(meta) => {
          if (!istOeffnenErlaubt(meta)) {
            return // die einzige Öffnen-Regel des Moduls (#223)
          }
          void oeffneProjekt(meta.id, wechsel).then(() => {
            setzeDialog(schliesseDialog())
          })
        }}
        aufDuplizieren={(meta) => {
          setzeDialog(oeffneDuplizieren(meta))
          setzeDuplikatName(schlageDuplikatnamenVor(meta))
        }}
        aufLoeschen={(meta) => setzeDialog(oeffneLoeschen(meta))}
        aufErneutLaden={() => {
          void ladeProjektliste()
        }}
        zeichneBeschaedigteZeile={(meta) => (
          <BeschaedigteZeile
            meta={meta}
            aufOrdnerOeffnen={(id) => {
              // Der Fehler landet im selben Meldungsplatz wie jeder andere.
              void oeffneProjektordner(id).then((antwort) => {
                if (!antwort.ok) meldeFehler(antwort.fehler.code, antwort.fehler.meldung)
              })
            }}
            aufLoeschen={(metaB) => setzeDialog(oeffneLoeschen(metaB))}
          />
        )}
      />

      {dialog.art === 'anlegen' && (
        <div data-testid="dialog-anlegen">
          <label>
            Projektname{' '}
            <input
              type="text"
              value={anlegenName}
              data-testid="dialog-anlegen-name"
              onChange={(e) => setzeAnlegenName(e.target.value)}
            />
          </label>
          <button
            type="button"
            data-testid="dialog-anlegen-bestätigen"
            onClick={() => {
              // Die einzige Pre-Prüfung des Formulars (#224): leer -> NICHTS rufen.
              const geprueft = pruefeProjektname(anlegenName)
              if (!geprueft.ok) {
                meldeFehler('ungueltige_eingabe', 'Der Projektname ist leer.')
                return
              }
              void legeProjektAn(anlegenName, wechsel).then((antwort) => {
                if (antwort.ok) {
                  setzeDialog(schliesseDialog())
                  setzeAnlegenName('')
                } else {
                  meldeFehler(antwort.fehler.code, antwort.fehler.meldung)
                }
              })
            }}
          >
            Anlegen
          </button>
          <button type="button" onClick={() => setzeDialog(schliesseDialog())}>
            Abbrechen
          </button>
        </div>
      )}

      {dialog.art === 'duplizieren' && dialog.meta !== null && (
        <div data-testid="dialog-duplizieren">
          <p>{baueDuplizierHinweis(dialog.meta)}</p>
          <label>
            Neuer Name{' '}
            <input
              type="text"
              value={duplikatName}
              data-testid="dialog-duplizieren-name"
              onChange={(e) => setzeDuplikatName(e.target.value)}
            />
          </label>
          <button
            type="button"
            data-testid="dialog-duplizieren-bestätigen"
            onClick={() => {
              // Duplizieren öffnet NICHT und wechselt KEINEN Reiter (#225); ein
              // leerer Vorname ruft NICHTS (pruefeDuplikatname, dieselbe Regel).
              const geprueft = pruefeDuplikatname(duplikatName)
              if (!geprueft.ok) {
                meldeFehler('ungueltige_eingabe', 'Der Projektname ist leer.')
                return
              }
              void dupliziereProjekt(dialog.meta.id, duplikatName, baueDuplizierWirkungen(umgebung)).then(
                (antwort) => {
                  if (antwort.ok) setzeDialog(schliesseDialog())
                  else meldeFehler(antwort.fehler.code, antwort.fehler.meldung)
                },
              )
            }}
          >
            Duplizieren
          </button>
          <button type="button" onClick={() => setzeDialog(schliesseDialog())}>
            Abbrechen
          </button>
        </div>
      )}

      {dialog.art === 'loeschen' && dialog.meta !== null && (
        <LoeschBestaetigungsAnzeige
          meta={dialog.meta}
          bestaetigung={baueLoeschBestaetigung(dialog.meta)}
          istOffenesProjekt={istAktivesProjekt(dialog.meta, ausgeladen)}
          aufBestaetigen={() => {
            void loescheProjekt(dialog.meta, loesch).then((antwort) => {
              if (antwort.ok) setzeDialog(schliesseDialog())
              else meldeFehler(antwort.fehler.code, antwort.fehler.meldung)
            })
          }}
          aufAbbrechen={() => setzeDialog(schliesseDialog())}
        />
      )}
      {dialog.art === 'keiner' && null}
    </div>
  )
}

