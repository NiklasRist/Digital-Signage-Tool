// Uebergangs-Naht zu Issue #244 - inhalte-vorlauf.tsx.
//
// Diese Datei traegt alle Gelenk-Teile, die #244 ausgeschlossen hat: die
// Wert-Importe der Modul-Wurzeln (DoD-Verbot von #244, bis #262 die Anhaengung
// uebernimmt), den Start der Sichten (#197) und den Auftrags-Nachlauf (#199).
// App.tsx (#262) nimmt den Ablauf auf; bis dahin haelt diese Naht die
// Anwendung am Leben. #260/#262 uebernehmen Wirkstelle fuer Wirkstelle und
// loeschen dann diese Datei.
//
// AUFGERAUMT GEGEN DEN ALTEN STAND (inhalte.tsx vor #244):
// * die Wurzeln der vier Reiter kommen jetzt ueber baueReiterInhalte (#244)
//   mit verteileZugaenge: der composer bekommt den UMHUELLTEN Zugang,
//   aktionen ebenfalls, die projekt-verwaltung den ROHEN (die alte Fassung
//   hatte nur den rohen Zugang benutzt - kein Unterschied, solange #243
//   fehlte; mit #243 waere er ein Abbo fehlender Schnappschuesse gewesen).
// * die Vorschau (#242) ist eingehaengt: die Frage aus dem STOPP-Block von
//   #242 („Wer traegt die Vorschau in den Reiter ein?") ist damit vorlaeufig
//   beantwortet, endgueltig durch #262.

import { useEffect, useMemo, useState, type JSX } from 'react'
import type { RahmenEigenschaften } from './rahmen'
import { Rahmen } from './rahmen'
import { baueSichten, holeSichten, type Sichten } from './sichten'
import { verteileZugaenge } from './inhalte-zugaenge'
import { baueReiterInhalte } from './inhalte'
import { starteAuftragsNachlauf } from './auftrags-nachlauf'
import { abonniere } from '../ipc-client/ereignisse'
import { KANAELE } from '../../shared/contracts/kanaele'
import { wechsleReiter } from './reiter'
import { ComposerWurzel } from '../composer/index'
import { ActionEditorWurzel } from '../action-editor'
import { VorlagenEditorWurzel } from '../vorlagen-editor'
import { ProjektVerwaltungWurzel } from '../projekt-verwaltung'
import { Vorschau } from '../preview-player/vorschau'
import { sitzungshalter } from './undo-aufzeichnung-vorlage'
import { starteMedienImport } from './medien-import-uebergabe'
import { WarteschlangenLeiste } from '../shell/WarteschlangenLeiste'

/** Die fuenf echten Wurzeln - bis #262 einziger Verbraucher ist diese Naht. */
const WURZELN = {
  composer: ComposerWurzel,
  vorschau: Vorschau,
  actionEditor: ActionEditorWurzel,
  vorlagenEditor: VorlagenEditorWurzel,
  projektVerwaltung: ProjektVerwaltungWurzel,
}


/** Uebergangs-Text-Behaelter fuer die anwendungsweite Meldung (#199-Wirkstelle). */
function anwendungsmeldungFlaeche(meldung: string | null): JSX.Element {
  if (meldung === null) {
    return <></>
  }
  return (
    <div
      data-testid="meldungs-flaeche"
      style={{ padding: '4px 8px', fontSize: 12, color: '#d9a441', borderBottom: '1px solid #444' }}
    >
      {meldung}
    </div>
  )
}

/** Die MOUNT-NAHT der App bis #260/#262 (App.tsx haengt hier das einSAMe ein). */
export function inhalte(): JSX.Element {
  const [sichten, setzeSichten] = useState<Sichten | null>(() => holeSichten())
  const [ladeFehler, setzeLadefehler] = useState<string | null>(null)
  const [anwendungsmeldung, setzeAnwendungsmeldung] = useState<string | null>(null)

  // Erste-Schritt-Versorgung: baueSichten (#197) einmalig.
  useEffect(() => {
    void (async () => {
      const ergebnis = await baueSichten()
      if (ergebnis.ok) {
        setzeSichten(ergebnis.wert)
      } else {
        setzeLadefehler(ergebnis.fehler.meldung)
      }
    })()
  }, [])

  // Der Auftrags-Nachlauf (#199), ANWENDUNGSWEIT, nicht je Reiter. Der Stand
  // wird zur Laufzeit per holeSichten() gelesen, nie eingefroren (#199).
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
        meldeImportErgebnis: (assetId) => {
          const projekt = holeSichten()?.projekt.hole().projekt ?? null
          const asset = projekt?.assets.find((eintrag) => eintrag.id === assetId)
          setzeAnwendungsmeldung(
            asset === undefined
              ? `Import abgeschlossen (${assetId.slice(0, 8)}).`
              : `Import abgeschlossen: ${asset.originalname}`,
          )
          window.setTimeout(() => setzeAnwendungsmeldung(null), 5000)
        },
        meldeFehler: (code, meldung) => setzeAnwendungsmeldung(`${meldung} (${code})`),
      },
    )
    return () => abmelden()
  }, [])

  const einrichtung = useMemo(() => {
    if (sichten === null) return null
    const zugaenge = verteileZugaenge(sichten)
    // ENTSCHIEDEN 10/11: die beiden Reiterwege bilden den Aufrufer hier; eine
    // Naht, die #262 endgueltig uebernimmt. Der Reparaturanschluss (#262)
    // bleibt bis dahin offen: hervorgehobeneAktionId ist noch null.
    const umgebung = {
      aufProjekteWechseln: () => wechsleReiter('projekte'),
      wechsleZuZusammenstellen: () => wechsleReiter('zusammenstellen'),
      composerVerdrahtung: {
        starteMedienImport,
        reparatur: null,
        meldeReparaturStand: () => {},
        meldeUebergabe: () => {},
      },
      hervorgehobeneAktionId: null,
      vorlagenSitzung: sitzungshalter(),
    }
    const reiterinhalte = baueReiterInhalte(zugaenge, WURZELN, umgebung)
    return { reiterinhalte, einrichtung: umgebung }
  }, [sichten])

  if (einrichtung === null || ladeFehler !== null) {
    return (
      <div data-testid="app-ladehinweis" style={{ padding: 24, fontSize: 13 }}>
        {ladeFehler === null ? 'Anwendung startet …' : `Start fehlgeschlagen: ${ladeFehler}`}
      </div>
    )
  }

  const rahmenEigenschaften: RahmenEigenschaften = {
    inhalte: einrichtung.reiterinhalte,
    warteschlangenLeiste: () => <WarteschlangenLeiste />,
    meldungsFlaeche: () => anwendungsmeldungFlaeche(anwendungsmeldung),
  }
  return <Rahmen {...rahmenEigenschaften} />
}
