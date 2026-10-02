// GENERIERT aus dem Signaturblock von Issue #244.
// [app-shell] Die Bausteine der vier Reiter anordnen und verdrahten
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue.

import { useEffect, useState, type JSX } from 'react'

import { Rahmen } from './rahmen'
import type { ReiterId } from './reiter'
import type { ReiterInhalt, RahmenEigenschaften } from './rahmen'
import { baueSichten, holeSichten, type Sichten } from './sichten'
import { starteAuftragsNachlauf } from './auftrags-nachlauf'
import { abonniere } from '../ipc-client/ereignisse'
import { KANAELE } from '../../shared/contracts/kanaele'
import { ComposerWurzel, type ComposerVerdrahtung, type ComposerWurzelProps } from '../composer/index'
import { starteMedienImport } from './medien-import-uebergabe'
import { wechsleReiter } from './reiter'
import {
  aufProjektlisteGeaendert,
  holeProjektliste,
  
} from '../projekt-verwaltung/liste'
import { type Projektliste, ladeProjektliste } from '../projekt-verwaltung/liste'
import {


  istOeffnenErlaubt,
  oeffneProjektordner,
} from '../projekt-verwaltung/beschaedigt'
import {

  dupliziereProjekt,
  schlageDuplikatnamenVor,
} from '../projekt-verwaltung/duplizieren'
import {
  baueLoeschBestaetigung,

  loescheProjekt,
  type LoeschWirkungen,
} from '../projekt-verwaltung/loeschen'
import { legeProjektAn, oeffneProjekt, type ProjektWechselWirkungen } from '../projekt-verwaltung/anlegen-oeffnen'
import { WarteschlangenLeiste } from '../shell/WarteschlangenLeiste'

/**
 * Die EINE Stelle, die ZUSEHEND die Bausteine zusammensetzt. ReiterBAU-Platzhalter der
 * übrigen drei Reiter bleiben hier ausdrücklich SEE (M7-Thema):
 *   zusammenstellen -> composer [P3] (M7 #261)
 *   aktionen        -> action-editor [P2] + Live-Vorschau (M5/M7)
 *   vorlagen        -> vorlagen-editor (M7)
 *   projekte        -> projekt-verwaltung (M7, TK 9.14.3)
 */
export type KomponentenZusammensetzer = () => Record<ReiterId, ReiterInhalt>

export function erzeugeVerdrahtung(): ComposerVerdrahtung {
  return {
    // Der Medien-Dialog samt Import-Obersetze (#204). Reparatur bleibt im ersten Mountbe
    // ungebraucht: null = nie gestartet (der'=> #201-Halter krank Anbindung im M7).
    starteMedienImport,
    reparatur: null,
    meldeReparaturStand: (stand) => {
      console.warn('[inhalte] meldeReparaturStand: #201 (Halter) ist noch nicht angebunden.', stand)
    },
    meldeUebergabe: (uebergabe) => {
      console.warn('[inhalte] meldeUebergabe: #201 (Halter) ist noch nicht angebunden.', uebergabe)
    },
  }
}

/** Die Umgebungs-Hülle um ComposerWurzel (verbindlich, siehe composer/index.tsx #261). */
export function baueWurzeln(umgebung: Sichten): Record<ReiterId, ReiterInhalt> {
  const verdrahtung = erzeugeVerdrahtung()
  const eigenschaften: ComposerWurzelProps = {
    sichtbar: true,
    projekt: umgebung.projekt,
    zeichnen: umgebung.zeichnen,
    vorlagen: umgebung.vorlagen,
    marke: umgebung.marke,
    verdrahtung,
  }

  return {
    // Ausgewogen: Der einzige echte Mount des ersten M7-Mount-Laufs.
    zusammenstellen: (eigenschaften2) => <ComposerWurzel {...eigenschaften} sichtbar={eigenschaften2.sichtbar} />,
    aktionen: (eigenschaften2) => (
      <div data-testid="inhalte-aktionen" style={{ display: eigenschaften2.sichtbar ? undefined : 'none' }}>
        (Reiter aktionen - M7)
      </div>
    ),
    vorlagen: (eigenschaften2) => (
      <div data-testid="inhalte-vorlagen" style={{ display: eigenschaften2.sichtbar ? undefined : 'none' }}>
        (Reiter vorlagen - M7)
      </div>
    ),
    projekte: (eigenschaften2) => (
      <ProjekteAnzeige sichtbar={eigenschaften2.sichtbar} umgebung={umgebung} />
    ),
  }
}

/** Die MOUNT-FUNKTION der App: holt einmal die Sichten und rendert dann den Rahmen. */
export function inhalte(): JSX.Element {
  const [sichten, setzeSichten] = useState<Sichten | null>(() => holeSichten())
  const [fehler, setzeFehler] = useState<string | null>(null)
  // Die anwendungsweite Meldungsfläche (#195/#199): Nachlauf- und Start-Ausnahmen
  // leben HIER, nicht in den Reiterinhalten.
  const [anwendungsmeldung, setzeAnwendungsmeldung] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      const ergebnis = await baueSichten()
      if (ergebnis.ok) setzeSichten(ergebnis.wert)
      else setzeFehler(ergebnis.fehler.meldung)
    })()
  }, [])

  // Der Nachlauf (#199): EIN Abonnement auf `queue:geaendert` (über `abonniere`, #151).
  // Er lebt ANWENDUNGSWEIT, nicht je Reiter - deshalb hier, neben dem Erstaufbau.
  // Die Wirkungen lesen die Sichten IMMER über `holeSichten()` zur Laufzeit: Die
  // Sichten werden asynchron gebaut, und ein Echo-Effekt-Läufer darf keinen veralteten
  // Stand einfrieren. Bevor sie existieren, gibt es kein offenes Projekt - der Nachlauf
  // meldet das sichtbar (kein_projekt), nichts geht still verloren.
  useEffect(() => {
    const abmelden = starteAuftragsNachlauf(
      (hoerer) => abonniere(KANAELE.queue.geaendert, hoerer),
      {
        holeProjekt: () => holeSichten()?.projekt.hole().projekt ?? null,
        setzeProjekt: (projekt) => holeSichten()?.projekt.setzeProjekt(projekt),
        verwirfMotivBestand: () => holeSichten()?.zeichnen.verwirfMotivBestand(),
        bereiteZeichnenVor: async (projekt) =>
          holeSichten()?.zeichnen.bereiteVor(projekt) ?? {
            ok: false,
            fehler: { code: 'kein_projekt', meldung: 'Die Sichten sind noch nicht gebaut.' },
          },
        leereProjektHistorie: () => {},
        aktualisiereAusgabenListe: undefined,
        meldeFehler: (code, meldung) => setzeAnwendungsmeldung(`${meldung} (${code})`),
      },
    )
    return () => abmelden()
  }, [])

  if (sichten === null || fehler !== null) {
    return (
      <div data-testid="app-ladehinweis" style={{ padding: 24, fontSize: 13 }}>
        {fehler === null ? 'Anwendung startet …' : `Start fehlgeschlagen: ${fehler}`}
      </div>
    )
  }

  const eigenschaften: RahmenEigenschaften = {
    inhalte: baueWurzeln(sichten),
    warteschlangenLeiste: () => <WarteschlangenLeiste />,
    meldungsFlaeche: () =>
      anwendungsmeldung === null ? <></> : (
        <div
          data-testid="meldungs-flaeche"
          style={{ padding: '4px 8px', fontSize: 12, color: '#d9a441', borderBottom: '1px solid #444' }}
        >
          {anwendungsmeldung}
        </div>
      ),
  }

  // DER RAMEN (aus #195) rendert die Reiterleiste; die Startregeln (#196) sitzen
  // ganz genau hier – M7 ergänzt den Aufruf der starteSitzung-Kette (#245) NICHT
  // verhookt. Nur der Rahmen.
   
  return <Rahmen {...eigenschaften} />
}

/** Der FA-10-Reiter: Liste anlegen/öffnen/duplizieren/löschen, Rednerschild der Beschrift. */
export function ProjekteAnzeige({
  sichtbar,
  umgebung,
}: {
  sichtbar: boolean
  umgebung: Sichten
}): JSX.Element {
  if (!sichtbar) return <div data-testid="inhalte-projekte-inaktiv" style={{ display: 'none' }} />

  return <ProjekteInterna umgebung={umgebung} />
}

type RohMeta = { beschaedigt: boolean; id: string; name: string; anzahlMedien: number; anzahlAusgaben: number }

export function ProjekteInterna({
  umgebung,
}: {
  umgebung: Sichten
}): JSX.Element {
  const [stand, setzeStand] = useState<Projektliste>(() => holeProjektliste())
  const [hinweis, setzeHinweis] = useState<string | null>(null)
  const [fehlerText, setzeFehlerText] = useState<string | null>(null)

  useEffect(() => aufProjektlisteGeaendert(setzeStand), [])

  useEffect(() => {
    void ladeProjektliste()
  }, [])

  const zeilen = stand.eintraege

  const wirkungen: LoeschWirkungen = {
    holeProjekt: () => umgebung.projekt.hole().projekt,
    verwirfMotivBestand: () => umgebung.zeichnen.verwirfMotivBestand(),
    leereProjektHistorie: () => {},
    leereProjektSicht: () => umgebung.projekt.leere(),
    aktualisiereProjektliste: async () => await ladeProjektliste(),
    meldeFehler: (code, meldung) => setzeFehlerText(`${code}: ${meldung}`),
  }

  const wechselWirkungen: ProjektWechselWirkungen = {
    ladeProjekt: umgebung.projekt.lade,
    verwirfMotivBestand: () => umgebung.zeichnen.verwirfMotivBestand(),
    bereiteZeichnenVor: umgebung.zeichnen.bereiteVor,
    leereProjektHistorie: () => {},
    wechsleZuZusammenstellen: () => wechsleReiter('zusammenstellen'),
    aktualisiereProjektliste: async () => await ladeProjektliste(),
    meldeFehler: (code, meldung) => setzeFehlerText(`${code}: ${meldung}`),
  }

  return (
    <div
      data-testid="inhalte-projekte"
      style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, padding: 8, gap: 8 }}
    >
      <div style={{ flex: '0 0 auto', display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Projektname"
          data-testid="projekte-name"
          value={hinweis ?? ''}
          onChange={(ereignis) => setzeHinweis(ereignis.target.value)}
          style={{ width: 220, fontSize: 12 }}
        />
        <button
          type="button"
          data-testid="projekte-anlegen"
          disabled={hinweis === null || hinweis.trim() === ''}
          onClick={() => {
            void (async () => {
              const ergebnis = await legeProjektAn(hinweis ?? '', wechselWirkungen)
              if (!ergebnis.ok) setzeFehlerText(ergebnis.fehler.meldung)
              else setzeHinweis('')
            })()
          }}
        >
          Neu anlegen
        </button>
        <span style={{ color: '#8f8f8f', fontSize: 11 }}>
          (Der Name darf nicht leer sein – die Ablehnung kommt aus dem Main.)
        </span>
      </div>

      {fehlerText !== null && (
        <div data-testid="projekte-fehler" style={{ color: '#e5634d', fontSize: 12 }}>
          {fehlerText}
        </div>
      )}

      <ul data-testid="projekte-liste" style={{ listStyle: 'none', margin: 0, padding: 0, fontSize: 12, overflow: 'auto' }}>
        {zeilen.map((meta: RohMeta) => (
          <li
            key={meta.id}
            data-testid={`projekte-zeile-${meta.id}`}
            style={{ padding: '2px 0', color: meta.beschaedigt ? '#e5634d' : undefined }}
          >
            {meta.name}
            {meta.beschaedigt && ' (BESCHÄDIGT · Öffnen deaktiviert)'}{' '}
            {istOeffnenErlaubt(meta as never) && (
              <button
                type="button"
                data-testid={`projekte-oeffnen-${meta.id}`}
                onClick={() => {
                  void (async () => {
                    const ergebnis = await oeffneProjekt(meta.id, wechselWirkungen)
                    if (!ergebnis.ok) setzeFehlerText(ergebnis.fehler.meldung)
                  })()
                }}
              >
                Öffnen
              </button>
            )}
            {!meta.beschaedigt && (
              <>
                <button
                  type="button"
                  data-testid={`projekte-duplizieren-${meta.id}`}
                  onClick={() => {
                    void (async () => {
                      const ergebnis = await dupliziereProjekt(
                        meta.id,
                        schlageDuplikatnamenVor(meta as never),
                        { aktualisiereProjektliste: async () => await ladeProjektliste() },
                      )
                      if (!ergebnis.ok) setzeFehlerText(ergebnis.fehler.meldung)
                    })()
                  }}
                >
                  Duplizieren
                </button>
                <button
                  type="button"
                  data-testid={`projekte-loeschen-${meta.id}`}
                  onClick={() => {
                    void (async () => {
                      const bestätigt = window.confirm(baueLoeschBestaetigung(meta as never).ok
                        ? (baueLoeschBestaetigung(meta as never) as { ok: true; text: string }).text
                        : '')
                      if (!bestätigt) return
                      const ergebnis = await loescheProjekt(meta as never, wirkungen)
                      if (!ergebnis.ok) setzeFehlerText(ergebnis.fehler.meldung)
                    })()
                  }}
                >
                  Löschen
                </button>
              </>
            )}
            <button
              type="button"
              data-testid={`projekte-ordner-${meta.id}`}
              onClick={() => {
                void (async () => {
                  const ergebnis = await oeffneProjektordner(meta.id)
                  if (!ergebnis.ok) setzeFehlerText(ergebnis.fehler.meldung)
                })()
              }}
            >
              Ordner öffnen
            </button>
          </li>
        ))}
        {zeilen.length === 0 && (
          <li style={{ color: '#8f8f8f' }}>
            Noch keine Projekte – oben einen Namen eingeben und „Neu anlegen" klicken.
          </li>
        )}
      </ul>
    </div>
  )
}

