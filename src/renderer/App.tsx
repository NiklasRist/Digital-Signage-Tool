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

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type JSX } from 'react'
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
import { UndoPfeile } from './app-shell/undo-pfeile'
import { baueSichten } from './app-shell/sichten'
import { starteSitzung, merkeAktivenReiter } from './app-shell/start'
import { starteAuftragsNachlauf } from './app-shell/auftrags-nachlauf'
import { abonniere } from './ipc-client/ereignisse'
import { KANAELE } from '../shared/contracts/kanaele'
import { SpeicherHinweis } from './app-shell/speicherstatus'
import { MarkenSpeicherHinweis } from './app-shell/marken-speicherstatus'
import type { MarkenSpeicherEreignis } from './app-shell/marken-speicherstatus-lage'
import { WarteschlangenLeiste } from './queue-panel'
import { leereProjektHistorie } from './app-shell/undo-historien'
import { aktualisiereAusgaben } from './composer/ausgabe-liste'
import { starteMedienImport } from './app-shell/medien-import-uebergabe'
import { waehleVideoPfad, reiheVideoImportEin } from './app-shell/anlegen-video'
import { leererEntwurf, legeAktionAn } from './action-editor/aktion-bearbeiten'
import { loescheAktion } from './action-editor/aktion-loeschen'
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
  schliesseUnterbrechungsFixAb,
} from './composer/reparatur-optionen'
import type { SichtSchreiber } from './composer/projektzustand'
import { aktualisiereReparatur } from './composer/reparatur-fuehrung'
import { sitzungshalter } from './app-shell/undo-aufzeichnung-vorlage'
import { wechsleReiter, holeReiter, type ReiterId } from './app-shell/reiter'
import { registriereTastaturHandler } from './app-shell/tastatur'
import { macheRueckgaengig, stelleWiederHer } from './app-shell/undo-projekt'
import { Rahmen } from './app-shell/rahmen'
import { Projektleiste } from './app-shell/projektleiste'
import { wechsleStandardMarke } from './projekt-verwaltung/standardmarke'
import { ladeProjektliste } from './projekt-verwaltung/liste'

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

  // #421: Der Sicht-Schreiber der Reparatur-Rueckwege - der WRAPPED-Zugang (#244-Huelle),
  // damit jede Reparatur-Reihe einen Undo-Schritt nimmt. Der Zugang steht erst nach dem
  // Bootstrap im ref; vorher ist keine Reparatur ansteuerbar, deshalb der No-op-Rueckfall.
  const reparaturSchreiber = (): SichtSchreiber =>
    zugaengeRef.current?.projektBearbeitung.setzeListe ?? (() => undefined)

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

  // #346: Der Start-Hinweis wird ZURUECKGENOMMEN, solange ein Projekt offen ist -
  // seine Aussage lautet „kein aktives Projekt", und genau das endet hier. Reaktiv,
  // weil „Projekt offen" ein Aussenzustand des Zugangs ist und kein React-Status.
  // Der Abo-Wechsel haengt an der Identität des Projekt-Zugangs: sie ist solange
  // null, wie die Lage nicht 'bereit' ist; ab 'bereit' wird auf den echten Zugang
  // abonniert (React resent es bei Wechsel). Mit einem stabilen Abo, das schon
  // beim Start ohne Zugang ein Noop war, wuerde spaeteres Oeffnen gemeldet, aber
  // NIEMAND haette es abonniert.
  const zugangProjekt = lage.schritt === 'bereit' ? lage.zugaenge.projektRoh : null
  const abonniereProjektOffen = useMemo(() => {
    if (zugangProjekt === null) return () => () => {}
    return (hoerer: () => void) => zugangProjekt.aufGeaendert(hoerer)
  }, [zugangProjekt])
  const projektOffenAktiv = useSyncExternalStore(
    abonniereProjektOffen,
    () => (zugangProjekt?.hole().projekt ?? null) !== null,
    () => false,
  )

  // DIE UebergabeUmgebung - genau EINE; gebaut mit stabilem Kern, die
  // Selbstreferenz wandert UEBER den ref (kein Zirkel im Objekt-Literal).
  const umgebung = useMemo<UebergabeUmgebung>(() => {
    const selbst = {
      halter: reparaturhalter(),
      holeProjekt: () => zugaengeRef.current?.projektRoh.hole().projekt ?? null,
      holeReiter: () => holeReiter(),
      wechsleReiter: (ziel: ReiterId) => wechsleReiter(ziel),
      // #338: Den Marken-Bestand bei JEDEM Aufruf frisch aus dem ref lesen - derselbe
      // Weg wie `holeProjekt` daneben. Ein eingefrorener Wert beim Aufbau waere die
      // zweite Wahrheit ueber den Bestand (der Zugang steht erst nach dem Bootstrap).
      rechneStandNeu: (stand: ReparaturStand, projekt: Project) =>
        aktualisiereReparatur(stand, projekt, zugaengeRef.current?.marken.hole()?.marken ?? null),
      starteMedienImport,
      // #421: Der Rueckweg schreibt ueber den WRAPPED-Zugang (#244-Huelle) - so nimmt
      // die Reparatur-Reihe einen Undo-Schritt. reparaturSchreiber liest die Sicht bei
      // JEDEM Aufruf frisch aus dem ref (der Zugang steht erst nach dem Bootstrap bereit).
      schliesseMediumFixAb: (elementId: string, neueAssetId: string) =>
        schliesseMediumFixAb(elementId, neueAssetId, reparaturSchreiber()),
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
      // #423: „Video zuerst, Pflicht" beim Anlegen - der Dialog zuerst, dann (nach dem
      // Anlegen) das Einreihen des gewaehlten Pfads. Derselbe Auftragsweg wie der
      // Composer-Knopf.
      waehleVideoPfad,
      importiereVideoPfad: (projektId: string, pfad: string) => {
        void reiheVideoImportEin(projektId, pfad).then((ergebnis) => {
          if (!ergebnis.ok) meldeFehler(ergebnis.fehler.code, ergebnis.fehler.meldung)
        })
      },
      composerVerdrahtung: {
        starteMedienImport,
        // #416: „Aktion anlegen" - der vollstaendige Entwurf entsteht HIER aus dem
        // #136-Entwurf (#319: Marke = Projekt-Standardmarke, Akzentfarbe null).
        legeAktionAn: ({ titel, vorlagenId, markeId }) =>
          legeAktionAn({ ...leererEntwurf(vorlagenId, markeId, null), titel }),
        // #430: „Aktion loeschen" - der Composer wendet den zurueckgegebenen Stand an.
        // Reine Durchreichung des #142-Wegs (Kaskade rechnet der Main).
        loescheAktion,
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
    [reparatur, meldeFehler],
  )

  // DIE Reiterinhalte werden EINMAL je Zugaengen-Satz gebaut. Ihre Funktionen sind die
  // Komponententypen im Rahmen (#195): Entstuenden sie bei jedem App-Rendern neu, mountete
  // React den aktiven Reiter bei jedem Rendern neu. Am echten Fenster gemessen am
  // 20.10.2026: ueber 1.900 Composer-Mounts in einem Lauf, weil der Reparatur-Effekt
  // einen Stand meldete, App renderte und der frische Mount den Stand erneut meldete.
  // Die Umgebung bleibt aktuell, weil die Funktionen sie ueber diese Referenz LESEN -
  // nicht aus einem beim Aufbau eingefrorenen Wert.
  const umgebungStand = useRef<Reiterumgebung>(reiterumgebung)
  umgebungStand.current = reiterumgebung
  const zugaengeBereit = lage.schritt === 'bereit' ? lage.zugaenge : null
  const inhalte = useMemo(
    () => (zugaengeBereit === null
      ? null
      : baueReiterInhalte(zugaengeBereit, WURZELN, () => umgebungStand.current)),
    [zugaengeBereit],
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

  // #350: Die Tastatur wird angeschlossen - ihre Vorgaben sind optional, unverdrahtete
  // Tasten werden NICHT abgefangen. Verdrahtet hier: Rueckgaengig (Ctrl/Cmd+Z) und
  // Wiederherstellen (Shift) ueber den Projekt-Zugang des Bootstrap-Laufs (9.13:
  // nur die gemeinsame Projekt-Historie). Pfeile/Space/Delete haben heute keine
  // von der Shell aus erreichbaren Ziele (E1: nur Typen ueber Modulgrenzen) - sie
  // bleiben UNVERDRAHTET und werden nicht abgefangen (siehe Issue-Nachtrag).
  useEffect(() => {
    const abmelden = registriereTastaturHandler({
      rueckgaengig: () => {
        const zug = zugaengeRef.current
        if (zug === null) return
        void macheRueckgaengig({ holeProjekt: () => zug.projektRoh.hole().projekt, setzeProjekt: zug.projektRoh.setzeProjekt }).then((antwort) => {
          if (!antwort.ok) meldeFehler(antwort.fehler.code, antwort.fehler.meldung)
        })
      },
      wiederherstellen: () => {
        const zug = zugaengeRef.current
        if (zug === null) return
        void stelleWiederHer({ holeProjekt: () => zug.projektRoh.hole().projekt, setzeProjekt: zug.projektRoh.setzeProjekt }).then((antwort) => {
          if (!antwort.ok) meldeFehler(antwort.fehler.code, antwort.fehler.meldung)
        })
      },
    })
    return abmelden
  }, [meldeFehler])

  // #424: stabiler Zugang fuer die Undo/Redo-Pfeile - `useCallback` mit leerer
  // Abhaengigkeit, damit die Leiste ihr Abo NICHT bei jedem Render neu aufbaut.
  const holeProjektzugang = useCallback(
    () => (zugaengeRef.current === null ? null : zugaengeRef.current.projektRoh),
    [],
  )

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
  // Unerreichbar: 'laeuft' und 'gescheitert' sind oben zurueckgekehrt. Der Waechter
  // macht die Nicht-Null-Zusage fuer den Typ und fuer spaetere Umbauten sichtbar.
  if (inhalte === null) {
    return null as unknown as JSX.Element
  }
  const projektOffen = zugaenge.projektRoh.hole().projekt
  // Der Start-Hinweis gilt nur, solange kein Projekt offen ist (#346, see oben).
  const startHinweisWirklich: StartHinweisInfo | null =
    projektOffenAktiv ? null : lage.startHinweis

  const meldezeile = (text: string): JSX.Element => (
    <div data-testid="meldung-zeile" style={{ padding: '4px 8px', fontSize: 12 }}>
      {text}
    </div>
  )

  // #456: Die Projektleiste und die Marken-Ansicht. Beide brauchen das GELADENE Projekt;
  // ohne Projekt liefert App KEINEN der beiden Schlitze - die Reiterflaeche bleibt dann
  // unveraendert (der Rahmen kann einen offenen Zustand ohne Ansicht nicht verdecken).
  // Nur lesen, wenn die Leiste sie braucht: ohne offenes Projekt gibt es keinen Einstieg.
  const markenBestand = projektOffen === null ? [] : (lage.zugaenge.marken.hole()?.marken ?? [])
  const projektleiste = projektOffen === null
    ? undefined
    : (schalt: { markenOffen: boolean; aufMarken: () => void }) => (
      <Projektleiste
        projektName={projektOffen.name}
        standardMarkeId={projektOffen.standardMarkeId}
        markenUebersicht={markenBestand.map((marke) => ({ id: marke.id, name: marke.name }))}
        markenOffen={schalt.markenOffen}
        aufMarken={schalt.aufMarken}
        aufStandardMarke={(markeId) => {
          // DIESELBE Operation wie in der Projektverwaltung (TK 9.14.3) - kein zweiter Weg.
          void wechsleStandardMarke(projektOffen.id, markeId, {
            holeProjekt: () => zugaengeRef.current?.projektRoh.hole().projekt ?? null,
            uebernimmProjekt: (projekt) => zugaengeRef.current?.projektRoh.setzeProjekt(projekt),
            aktualisiereProjektliste: (async () => {
              await ladeProjektliste()
            }) as () => Promise<unknown>,
            meldeFehler,
          })
        }}
      />
    )
  const markenAnsicht = projektOffen === null
    ? undefined
    : (schalt: { aufSchliessen: () => void }) => (
      <MarkenEditorWurzel
        sichtbar
        marken={lage.zugaenge.marken}
        vorlagen={lage.zugaenge.vorlagen}
        projektId={projektOffen.id}
        aktionen={projektOffen.aktionen.map((aktion) => ({
          titel: aktion.titel,
          markeId: aktion.markeId,
        }))}
        aufZurueck={schalt.aufSchliessen}
      />
    )

  const rahmenEigenschaften = {
    inhalte,
    projektleiste,
    markenAnsicht,
    warteschlangenLeiste: () => <WarteschlangenLeiste />,
    // #424: die sichtbaren Undo/Redo-Pfeile in der Reiterleiste.
    undoRedo: (reiter: ReiterId) => (
      <UndoPfeile reiter={reiter} holeProjektzugang={holeProjektzugang} meldeFehler={meldeFehler} />
    ),
    speicherHinweis: () => (
      <>
        {/* unverändert aus #262, Schritt 5 – Zeichen für Zeichen */}
        <SpeicherHinweis
          abonniereProjekt={(hoerer) => abonniere(KANAELE.project.autoSpeichernStatus, hoerer)}
          abonniereVorlagen={(hoerer) => abonniere(KANAELE.vorlagen.autoSpeichernStatus, hoerer)}
        />
        {/* #327: der dritte Speicher, derselbe Schlitz – Geschwister, kein zweiter Schlitz */}
        <MarkenSpeicherHinweis
          abonniereMarken={(hoerer: (ereignis: MarkenSpeicherEreignis) => void) =>
            abonniere(KANAELE.marken.autoSpeichernStatus, hoerer)}
        />
      </>
    ),
    meldungsFlaeche: () =>
  // #346: Der Start-Hinweis wird ZURUECKGENOMMEN, sobald ein Projekt offen
  // ist - er sollte ja nur solange stehen, wie KEIN Projekt aktiv ist.
  // Das Zuruecknehmen ist nur die DARSTELLUNG: Die Bootstrap-Lage wird
  // NICHT angefasst - verschwindet das Projekt wieder, steht der Hinweis
  // erneut, denn seine Aussage trifft dann wieder zu.
      startHinweisWirklich === null && meldung === null ? (
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
          {startHinweisWirklich !== null ? (
            <div>{meldezeile(startHinweisZeile(startHinweisWirklich))}</div>
          ) : null}
        </div>
      ),
  }

  return (
    <>
      <Rahmen {...rahmenEigenschaften} />
      <UebergabeOverlay
        lage={reparatur}
        projekt={projektOffen}
        schliesseMediumFixAb={(elementId: string, neueAssetId: string) =>
          schliesseMediumFixAb(elementId, neueAssetId, reparaturSchreiber())}
        schliesseAktionsFixAb={(elementId: string, neueAktionId: string) =>
          schliesseAktionsFixAb(elementId, neueAktionId, reparaturSchreiber())}
        schliesseAbschnittsFixAb={(elementId: string, abschnittIndex: number, neueAktionId: string, p: Project) =>
          schliesseAbschnittsFixAb(elementId, abschnittIndex, neueAktionId, p, reparaturSchreiber())}
        schliesseUnterbrechungsFixAb={(elementId: string, unterbrechungIndex: number, neueAktionId: string, p: Project) =>
          schliesseUnterbrechungsFixAb(elementId, unterbrechungIndex, neueAktionId, p, reparaturSchreiber())}
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
