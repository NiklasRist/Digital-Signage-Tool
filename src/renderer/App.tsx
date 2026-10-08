// Issue #262 - App.tsx: die Einhaengung. Der Ablauf selbst liegt in bootstrap.ts
// (#260): App fuehrt `starteRenderer` GENAU EINmal aus, haelt die BootstrapLage
// und rendert erst bei 'bereit' den Rahmen - mit allen VIER Eigenschaften - und
// NEBEN dem Rahmen, als Geschwister, das UebergabeOverlay (#256).
//
// Die Schritte 5-8:
//   5. Speicherhinweis (#200) und anwendungsweite meldungsFlaeche - der
//      Halter sitzt hier als State (ENTSCHIEDEN 7); GENAU EINE aktuelle
//      Meldung, kein Stapel, kein Ausblend-Timer; die Abo-Funktionen werden
//      aus `abonniere` (#151) gebildet.
//   6. WarteschlangenLeiste (#257) als Schlitz; sie beschafft sich selbst
//      (#205) - hier wird KEINE ihrer inneren Funktionen gerufen.
//   7. baueReiterInhalte (#244) ZULETZT - ab hier ist die Anwendung bedienbar.
//   8. UebergabeOverlay als GESCHWISTER des Rahmens (#195: GENAU VIER
//      Eintraege, ein fuenfter ist verboten; das Overlay soll ueber ALLE
//      Reiter liegen).
//
// ENTSCHIEDEN 1: Diese Datei ist die EINZIGE Renderer-Datei, die die
// Modul-Wurzeln als WERTE importiert (sie liegt ausserhalb von app-shell; als
// Pflichtfelder von ModulWurzeln bleibt ein fehlendes Glied unuebersehbar).
// Auch UebergabeOverlay/beendeLaufende/schliesseFixAb (#256) und die drei
// Abschluss-Funktionen (#133) kommen hier als Werte hinein.
//
// ENTSCHIEDEN 3: 'laeuft' = Ladeflaeche; 'gescheitert' = Fehlerflaeche mit
// unverändertem code/meldung und „Erneut versuchen" (Ruft ERST die Abbau-
// Funktion des ersten Laufs, DANN starteRenderer erneut).
//
// ENTSCHIEDEN 4/7: Die Reiterumgebung hier vollstaendig; die zwei Werte
// (hervorgehobeneAktionId, reparatur) bleiben aktuell ueber GENAU EIN
// aufLageGeaendert-Abonnement (Abbau meldet ab). meldeFehler ist DIESE eine
// stabile Funktion in allen drei Faellen (schritte/wirkungen/umgebung).
//
// ENTSCHIEDEN 8: `schliesseMediumFixAb` ist dieselbe Funktion (#133) wie im
// Overlay (ToBe) und geht in die UebergabeUmgebung; der Rueckruf des Nachlaufs:
// `(assetId) => { void schliesseMedienImportAb(umgebung, assetId) }` - void
// ist beabsichtigt (Vertrag synchron und total).

import { useCallback, useEffect, useMemo, useRef, useState, type JSX } from 'react'
import type { Project } from '../shared/contracts/project'
import type { Auftrag } from '../shared/contracts/auftrag'
import type { FixWirkung, Uebergabe } from './composer/reparatur-optionen'
import type { ReparaturStand } from './composer/reparatur-fuehrung'
import {
  ANFANGS_BOOTSTRAP,
  starteRenderer,
  type BootstrapLage,
  type BootstrapSchritte,
} from './app-shell/bootstrap'
import { verteileZugaenge, type Reiterzugaenge } from './app-shell/inhalte-zugaenge'
import { baueReiterInhalte, type ModulWurzeln, type Reiterumgebung } from './app-shell/inhalte'
import { baueSichten } from './app-shell/sichten'
import { starteSitzung, merkeAktivenReiter } from './app-shell/start'
import { starteAuftragsNachlauf } from './app-shell/auftrags-nachlauf'
import { abonniere } from './ipc-client/ereignisse'
import { KANAELE } from '../shared/contracts/kanaele'
import { SpeicherHinweis } from './app-shell/speicherstatus'
import { WarteschlangenLeiste } from './shell/WarteschlangenLeiste'
import { leereProjektHistorie } from './app-shell/undo-historien'
import { aktualisiereAusgaben } from './composer/ausgabe-liste'
import { starteMedienImport } from './app-shell/medien-import-uebergabe'
import { ComposerWurzel } from './composer/index'
import { ActionEditorWurzel } from './action-editor'
import { VorlagenEditorWurzel } from './vorlagen-editor'
import { ProjektVerwaltungWurzel } from './projekt-verwaltung'
import { Vorschau } from './preview-player/vorschau'
import { MarkenEditorWurzel } from './marken-editor'
import {
  reparaturhalter,
  nimmUebergabeEntgegen,
  beendeLaufende,
  schliesseFixAb,
  meldeStand,
  schliesseMedienImportAb,
  type UebergabeUmgebung,
} from './app-shell/uebergabe'
import { UebergabeOverlay } from './app-shell/uebergabe.tsx'
import type { ShellReparatur } from './app-shell/reparatur-fuehrung-shell'
import {
  schliesseMediumFixAb,
  schliesseAktionsFixAb,
  schliesseAbschnittsFixAb,
} from './composer/reparatur-optionen'
import { aktualisiereReparatur } from './composer/reparatur-fuehrung'
import { sitzungshalter } from './app-shell/undo-aufzeichnung-vorlage'
import { wechsleReiter, holeReiter, type ReiterId } from './app-shell/reiter'
import { Rahmen } from './app-shell/rahmen'

/** Der Anzeige-Datentyp des StartHinweis (#196). */
type StartHinweisInfo = Extract<BootstrapLage, { schritt: 'bereit' }>['startHinweis'] & object

/** Die fuenf echten Modul-Wurzeln - HIER ist der Wert-Import erlaubt (ENTSCHIEDEN 1). */
const WURZELN: ModulWurzeln = {
  composer: ComposerWurzel,
  vorschau: Vorschau,
  actionEditor: ActionEditorWurzel,
  vorlagenEditor: VorlagenEditorWurzel,
  markenEditor: MarkenEditorWurzel,
  projektVerwaltung: ProjektVerwaltungWurzel,
}

export function App(): JSX.Element {
  // DIE LAGE (#260): vom Bootstrap gemeldet; 'laeuft' gehoert dem Aufrufer.
  const [lage, setzeLage] = useState<BootstrapLage>(ANFANGS_BOOTSTRAP)
  // DER Melde-Halter (ENTSCHIEDEN 7): GENAU EINE aktuelle Meldung; eine neue
  // ersetzt die vorherige; kein Stapel, kein Timer, keine Historie.
  const [meldung, setzeMeldung] = useState<{ code: string; meldung: string } | null>(null)
  // DER Reparatur-Stand (#256/#201), Wert, aktuell gehalten (ENTSCHIEDEN 4).
  const [reparatur, setzeReparatur] = useState<ShellReparatur>(() => reparaturhalter().holeLage())

  // Der Zugaenge-Spiegel: der Bootstrap meldet 'bereit' mit den fertigen
  // Zugaengen; die UebergabeUmgebung liest HIER zur Laufzeit (Ursache: sie
  // wird vor der Lage gebildet, das Projekt folgt nach).
  const zugaengeRef = useRef<Reiterzugaenge | null>(null)
  const umgebungRef = useRef<UebergabeUmgebung | null>(null)
  const abbauRef = useRef<(() => void) | null>(null)

  // DER Meldeweg - DIESE eine Funktion, stabil (ToBe ueber alle drei Stellen).
  const meldeFehler = useCallback((code: string, meldungText: string) => {
    setzeMeldung({ code, meldung: meldungText })
  }, [])

  // GENAU EIN Reparatur-Abo; beim Abbau abgemeldet.
  useEffect(() => {
    const abmelden = reparaturhalter().aufLageGeaendert((neue) => setzeReparatur(neue))
    return () => {
      abmelden()
    }
  }, [])

  // DIE UebergabeUmgebung - genau EINE; gebaut mit stabilem Kern, die
  // Selbstreferenz wandert UEBER den ref (kein Zirkel im Objekt-Literal).
  const umgebung = useMemo<UebergabeUmgebung>(() => {
    const selbst = {
      halter: reparaturhalter(),
      holeProjekt: () => zugaengeRef.current?.projektRoh.hole().projekt ?? null,
      holeReiter: () => holeReiter(),
      wechsleReiter: (ziel: ReiterId) => wechsleReiter(ziel),
      rechneStandNeu: (stand: ReparaturStand, projekt: Project) => aktualisiereReparatur(stand, projekt),
      starteMedienImport,
      schliesseMediumFixAb,
      meldeFehler,
    }
    umgebungRef.current = selbst
    return selbst
  }, [])
  void umgebung

  // DIE Reiterumgebung (#244): beide Werte hier aktuell, der Rest
  // durchgereicht; neu gebaut NUR bei Reparatur-Aenderung (kein Atom sonst).
  const reiterumgebung = useMemo<Reiterumgebung>(
    () => ({
      aufProjekteWechseln: () => wechsleReiter('projekte'),
      wechsleZuZusammenstellen: () => wechsleReiter('zusammenstellen'),
      composerVerdrahtung: {
        starteMedienImport,
        reparatur: reparatur.stand,
        meldeReparaturStand: (stand: ReparaturStand) => {
          if (umgebungRef.current !== null) meldeStand(umgebungRef.current, stand)
        },
        meldeUebergabe: (an: Uebergabe) => {
          if (umgebungRef.current !== null) nimmUebergabeEntgegen(umgebungRef.current, an)
        },
      },
      hervorgehobeneAktionId: reparatur.hervorgehobeneAktionId,
      vorlagenSitzung: sitzungshalter(),
    }),
    [reparatur],
  )

  // DER Bootstrap - GENAU EINmal je Fenster (Aufbau-Effekt); SetzeLage spigelt
  // gleichzeitig die Zugaenge in den ref (die Umgebung liest da zur Laufzeit).
  const laufe = useCallback((): () => void => {
    const schritte: BootstrapSchritte = {
      baueSichten,
      verteileZugaenge,
      starteSitzung,
      merkeAktivenReiter,
      starteAuftragsNachlauf,
      abonniereQueue: (hoerer: (auftraege: Auftrag[]) => void) =>
        abonniere(KANAELE.queue.geaendert, hoerer),
      leereProjektHistorie,
      aktualisiereAusgabenListe: aktualisiereAusgaben,
      meldeImportErgebnis: (assetId: string) => {
        // ENTSCHIEDEN 8 - void ist beabsichtigt (total, synchron vertrag):
        if (umgebungRef.current !== null) void schliesseMedienImportAb(umgebungRef.current, assetId)
      },
      meldeFehler,
      setzeLage: (neu: BootstrapLage) => {
        if (neu.schritt === 'bereit') zugaengeRef.current = neu.zugaenge
        setzeLage(neu)
      },
    }
    const erster = starteRenderer(schritte)
    abbauRef.current = erster
    return erster
  }, [meldeFehler])

  useEffect(() => laufe(), [laufe])

  // ENTSCHIEDEN 3: bei 'laeuft' und 'gescheitert' KEIN Rahmen, KEINE Wurzel,
  // KEIN Overlay.
  if (lage.schritt === 'laeuft') {
    return (
      <div data-testid="app-laeuft" style={{ padding: 24, fontSize: 13 }}>
        Anwendung startet …
      </div>
    )
  }
  if (lage.schritt === 'gescheitert') {
    return (
      <div data-testid="app-fehlerflaeche" style={{ padding: 24, fontSize: 13 }}>
        <p data-testid="app-fehler-code">{lage.code}</p>
        <p data-testid="app-fehler-meldung">{lage.meldung}</p>
        <button
          type="button"
          onClick={() => {
            // ERST der Abbau des ersten Laufs, DANN der neue Lauf:
            if (abbauRef.current !== null) abbauRef.current()
            laufe()
          }}
        >
          Erneut versuchen
        </button>
      </div>
    )
  }

  const zugaenge = lage.zugaenge
  const projektOffen = zugaenge.projektRoh.hole().projekt

  const meldezeile = (text: string): JSX.Element => (
    <div data-testid="meldung-zeile" style={{ padding: '4px 8px', fontSize: 12 }}>
      {text}
    </div>
  )

  const rahmenEigenschaften = {
    inhalte: baueReiterInhalte(zugaenge, WURZELN, reiterumgebung),
    warteschlangenLeiste: () => <WarteschlangenLeiste />,
    speicherHinweis: () => (
      <SpeicherHinweis
        abonniereProjekt={(hoerer) => abonniere(KANAELE.project.autoSpeichernStatus, hoerer)}
        abonniereVorlagen={(hoerer) => abonniere(KANAELE.vorlagen.autoSpeichernStatus, hoerer)}
      />
    ),
    meldungsFlaeche: () =>
      meldung === null && lage.startHinweis === null ? (
        <></>
      ) : (
        <div data-testid="meldungs-flaeche">
          {meldung !== null ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
              {meldezeile(`${meldung.meldung} (${meldung.code})`)}
              <button type="button" onClick={() => setzeMeldung(null)}>
                Schließen
              </button>
            </div>
          ) : null}
          {lage.startHinweis !== null ? <div>{meldezeile(startHinweisZeile(lage.startHinweis))}</div> : null}
        </div>
      ),
  }

  return (
    <>
      <Rahmen {...rahmenEigenschaften} />
      <UebergabeOverlay
        lage={reparatur}
        projekt={projektOffen}
        schliesseMediumFixAb={schliesseMediumFixAb}
        schliesseAktionsFixAb={schliesseAktionsFixAb}
        schliesseAbschnittsFixAb={schliesseAbschnittsFixAb}
        aufAbgeschlossen={(wirkung: FixWirkung) => schliesseFixAb(umgebung, wirkung)}
        aufAbgebrochen={() => beendeLaufende(umgebung)}
        aufFehler={meldeFehler}
      />
    </>
  )
}

function startHinweisZeile(hinweis: StartHinweisInfo): string {
  switch (hinweis.art) {
    case 'kein_aktives_projekt':
      return 'Kein Projekt aktiv (es konnte keines wiederhergestellt werden).'
    case 'projekt_unlesbar':
      return `Das Projekt ${hinweis.projektId} war unlesbar (${hinweis.code}): ${hinweis.meldung}`
    default:
      return `Konfiguration unlesbar (${hinweis['code']}): ${hinweis['meldung']}`
  }
}
