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
import { ProjektVerwaltungWurzel } from '../projekt-verwaltung'
import { VorlagenEditorWurzel } from '../vorlagen-editor'
import { ActionEditorWurzel } from '../action-editor'
import { umhuelleFuerBearbeitung } from './undo-aufzeichnung'
import { sitzungshalter } from './undo-aufzeichnung-vorlage'
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
      <ActionEditorWurzel
        sichtbar={eigenschaften2.sichtbar}
        projekt={umhuelleFuerBearbeitung(umgebung.projekt)}
        zeichnen={umgebung.zeichnen}
        vorlagen={umgebung.vorlagen}
        marke={umgebung.marke}
        hervorgehobeneAktionId={null}
      />
    ),
    vorlagen: (eigenschaften2) => (
      <VorlagenEditorWurzel
        sichtbar={eigenschaften2.sichtbar}
        vorlagen={umgebung.vorlagen}
        zeichnen={umgebung.zeichnen}
        marke={umgebung.marke}
        sitzung={sitzungshalter()}
      />
    ),
    projekte: (eigenschaften2) => (
      <ProjektVerwaltungWurzel
        sichtbar={eigenschaften2.sichtbar}
        projekt={umgebung.projekt}
        zeichnen={umgebung.zeichnen}
        leereProjektHistorie={() => {}}
        wechsleZuZusammenstellen={() => wechsleReiter('zusammenstellen')}
      />
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
        // Befund 04.10.2026: Ohne diese Wirkung blieb nach dem Import "eingereiht"
        // der letzte sichtbare Text - dass der Auftrag FERTIG ist, zeigte keine
        // Stelle an (die Warteschlangen-Leiste ist als Stumm-Zeile gebaut, ihr
        // Ausbau ist eigenes M7-Issue). Der Import meldet hier seinen Abschluss;
        // der neue Asset selbst kommt über setzeProjekt in die Galerie.
        meldeImportErgebnis: (assetId) => {
          const projekt = holeSichten()?.projekt.hole().projekt ?? null
          const asset = projekt?.assets.find((eintrag) => eintrag.id === assetId)
          setzeAnwendungsmeldung(
            asset === undefined
              ? `Import abgeschlossen (${assetId.slice(0, 8)}).`
              : `Import abgeschlossen: ${asset.originalname}`,
          )
          // Die Meldung ist eine Bestaetigung, kein Fehler: nach 5 s verblasst sie.
          window.setTimeout(() => setzeAnwendungsmeldung(null), 5000)
        },
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
