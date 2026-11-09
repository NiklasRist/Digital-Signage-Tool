// [app-shell] Der Rahmen mit Reiterleiste oben und Warteschlangen-Leiste unten

import { createElement, useEffect, useReducer, useState, type JSX } from 'react'
import type { ReiterId } from './reiter'
import {
  REITER_REIHENFOLGE,
  aufReiterGeaendert,
  holeReiter,
  wechsleReiter,
} from './reiter'
import { ergaenzeBesuchte, istMontiert } from './rahmen-montage'
import {
  aufAktionenAnsichtGeaendert,
  holeAktionenAnsicht,
  schliesseAktionenAnsicht,
  type AktionenAnsichtLage,
} from '../gemeinsam/aktionen-ansicht'
import {
  aufVorlagenAnsichtGeaendert,
  istVorlagenAnsichtOffen,
  oeffneVorlagenAnsicht,
  schliesseVorlagenAnsicht,
} from '../gemeinsam/vorlagen-ansicht'
import { wirksamerUndoBereich, type Historienbereich } from './undo-historien'

/** Ein Reiterinhalt. Er bekommt gesagt, ob er gerade sichtbar ist – abgebaut wird er NICHT. */
export type ReiterInhalt = (eigenschaften: { sichtbar: boolean }) => JSX.Element

export interface RahmenEigenschaften {
  /** Genau ein Eintrag je ReiterId. Das `Record` erzwingt Vollständigkeit. */
  inhalte: Record<ReiterId, ReiterInhalt>
  /** Die EINE Warteschlangen-Leiste. Wird genau einmal gerendert, außerhalb der Reiterinhalte. */
  warteschlangenLeiste: () => JSX.Element
  /** Der „nicht gespeichert"-Hinweis (#200). Sitzt in der Reiterleiste, damit er den
   *  Reiterwechsel überlebt. Fehlt er, bleibt der Platz leer – es wird NICHTS ersatzweise gezeigt. */
  speicherHinweis?: () => JSX.Element
  /** Die ANWENDUNGSWEITE Meldungsfläche, unmittelbar unter der Reiterleiste. Sie zeigt, was zu
   *  KEINEM Reiter gehört: die Fehler aus `meldeFehler` (#199) und den `StartHinweis` (#196).
   *  Wird genau einmal gerendert, außerhalb aller Reiterinhalte, und überlebt den Reiterwechsel.
   *  Fehlt sie, bleibt der Platz leer – es wird NICHTS ersatzweise gezeigt. */
  meldungsFlaeche?: () => JSX.Element
  /** #424: Die sichtbaren Undo/Redo-Pfeile. Sitzen in der Reiterleiste und überleben den
   *  Reiterwechsel (TK 9.14.2: im Marken-Reiter abgeschaltet, nicht an einen fremden Stapel
   *  gebunden). Der SLOT bekommt den WIRKSAMEN Bereich, weil nur der Rahmen die offenen
   *  Ansichten kennt: Die Vorlagen-Ansicht liegt ueber der Reiterflaeche und arbeitet auf
   *  einer EIGENEN Historie (FA-21/TK 9.13). Fehlt der Slot, bleibt der Platz leer. */
  undoRedo?: (bereich: Historienbereich | null) => JSX.Element
  /** #456: Die Projektleiste über der Reiterfläche (TK 9.14.1, v3.32). Sie erscheint nur,
   *  solange ein Projekt offen ist – das entscheidet ihr Träger, nicht der Rahmen. Fehlt der
   *  Slot, bleibt die Fläche leer; es wird NICHTS ersatzweise gezeigt. */
  projektleiste?: (schalt: ProjektleistenSchalt) => JSX.Element
  /** #456: die Marken-Ansicht ÜBER der Reiterfläche. Sie ist kein Reiter (TK 9.14.2): Die
   *  besuchten Reiter bleiben montiert und nur verdeckt. Fehlt der Slot, bleibt die
   *  Reiterfläche sichtbar – ein offener Zustand ohne Ansicht darf sie NICHT verdecken. */
  markenAnsicht?: (schalt: { markeId: string; aufSchliessen: () => void }) => JSX.Element | null
  /** 01.11.2026: die AKTIONEN-Ansicht über der Reiterfläche - derselbe Vertrag wie die
   *  Marken-Ansicht. Der Einstieg liegt im Composer (Aktions-Zeile); der offene Zustand
   *  steht im gemeinsamen Speicher `gemeinsam/aktionen-ansicht.ts`. Fehlt der Slot,
   *  bleibt die Reiterfläche sichtbar.
   *  03.11.2026 (Entscheidung 29.4): `aktionId === null` heißt **Modus „neu"** - der
   *  Editor legt dann eine neue Aktion an (Einstieg „+ Neue Aktion" im Composer);
   *  eine Kennung heißt „genau diese Aktion bearbeiten". */
  aktionenAnsicht?: (schalt: {
    aktionId: string | null
    aufSchliessen: () => void
  }) => JSX.Element | null
  /** 03.11.2026: die VORLAGEN-Ansicht über der Reiterfläche - derselbe Vertrag. Der
   *  Einstieg sitzt in der Projektleiste; der offene Zustand steht im gemeinsamen
   *  Speicher `gemeinsam/vorlagen-ansicht.ts`. Fehlt der Slot, bleibt die Reiterfläche
   *  sichtbar. */
  vorlagenAnsicht?: (schalt: { aufSchliessen: () => void }) => JSX.Element | null
}

/** #456: Was die Projektleiste vom Rahmen bekommt – mehr braucht sie nicht. */
export interface ProjektleistenSchalt {
  /** true, solange die Marken-Ansicht offen ist. */
  markenOffen: boolean
  /** Öffnet die Marken-Ansicht für GENAU DIESE Marke. */
  aufMarken: (markeId: string) => void
  /** true, solange die Vorlagen-Ansicht offen ist. */
  vorlagenOffen: boolean
  /** Öffnet/schließt die Vorlagen-Ansicht (Umschalter). */
  aufVorlagen: () => void
}

/** Die vier Reiterbeschriftungen (TK 9.14.1, v3.32) – der einzige eigene Text des Rahmens. */
const REITER_BESCHRIFTUNG: Record<ReiterId, string> = {
  zusammenstellen: 'Zusammenstellen',
  aktionen: 'Aktionen',
  vorlagen: 'Vorlagen',
  projekte: 'Projekte',
}

/**
 * Der Anzeigezustand des Rahmens: der aktive Reiter (gespiegelt aus #194 über das
 * eine Abo auf `aufReiterGeaendert`) und die besuchten Reiter. Die besuchten sind
 * reiner lokaler Anzeigezustand des Rahmens (ENTSCHIEDEN 5): sie überleben bewusst
 * keinen Neustart und gehören in keine Konfiguration. Die Reiter selbst hält der
 * Rahmen NICHT – er liest sie über `holeReiter()` und hört auf `aufReiterGeaendert`
 * (ENTSCHIEDEN 4), die Knöpfe rufen `wechsleReiter` (#194).
 */
interface RahmenZustand {
  aktiv: ReiterId
  besuchte: ReiterId[]
  /** #456: true, solange die Marken-Ansicht über der Reiterfläche liegt. */
  markenOffen: boolean
  /** #456: welche Marke der Editor zeigt - null, solange die Ansicht geschlossen ist. */
  markenMarkeId: string | null
}

type RahmenAktion =
  | { art: 'reiter-gewechselt'; reiter: ReiterId }
  | { art: 'marken-geoeffnet'; markeId: string }
  | { art: 'marken-geschlossen' }

/**
 * Ein Reiterwechsel ergänzt die Besuchten um den Zielreiter (rahmen-montage.ts) und
 * SCHLIESST die Marken-Ansicht (#456): Wer einen Reiter anklickt, will den Reiter sehen.
 */
function rahmenReducer(zustand: RahmenZustand, aktion: RahmenAktion): RahmenZustand {
  if (aktion.art === 'marken-geoeffnet') {
    return { ...zustand, markenOffen: true, markenMarkeId: aktion.markeId }
  }
  if (aktion.art === 'marken-geschlossen') {
    return { ...zustand, markenOffen: false, markenMarkeId: null }
  }
  if (aktion.art === 'reiter-gewechselt') {
    const neu = { ...zustand, markenOffen: false, markenMarkeId: null }
    if (aktion.reiter !== zustand.aktiv) {
      return { ...neu, aktiv: aktion.reiter, besuchte: ergaenzeBesuchte(zustand.besuchte, aktion.reiter) }
    }
    return neu
  }
  return zustand
}

export function Rahmen(eigenschaften: RahmenEigenschaften): JSX.Element {
  const [zustand, sende] = useReducer(rahmenReducer, undefined, () => {
    const start = holeReiter()
    return { aktiv: start, besuchte: ergaenzeBesuchte([], start), markenOffen: false, markenMarkeId: null }
  })

  // Genau EIN Abo (ENTSCHIEDEN 4), angemeldet beim Aufbau, abgemeldet beim Abbau.
  // Der Rückgabewert von `aufReiterGeaendert` ist die Abmelde-Funktion – React ruft
  // sie beim Abbau des Rahmens und beendet damit das Abo.
  useEffect(() => {
    return aufReiterGeaendert((reiter) => {
      sende({ art: 'reiter-gewechselt', reiter })
    })
  }, [])

  // 01.11.2026: Die Aktionen-Ansicht haengt am gemeinsamen Speicher (Einstieg aus dem
  // Composer). Der Anfangswert wird gelesen, danach haelt das Abo den Stand aktuell.
  // 03.11.2026: Die Lage hat DREI Formen (zu | neu | aktion) - s. aktionen-ansicht.ts.
  const [aktionenLage, setzeAktionenLage] = useState<AktionenAnsichtLage>(() => holeAktionenAnsicht())
  useEffect(() => aufAktionenAnsichtGeaendert(setzeAktionenLage), [])

  // 03.11.2026: Die Vorlagen-Ansicht (Einstieg in der Projektleiste). Derselbe Weg wie
  // die Aktionen-Ansicht: Anfangswert lesen, danach haelt das Abo den Stand aktuell.
  const [vorlagenOffen, setzeVorlagenOffen] = useState<boolean>(() => istVorlagenAnsichtOffen())
  useEffect(() => aufVorlagenAnsichtGeaendert(setzeVorlagenOffen), [])
  // Es liegt IMMER nur EINE Ansicht ueber der Reiterflaeche. Oeffnet der Composer die
  // Aktionen-Ansicht, schliesst sich die Vorlagen-Ansicht - sonst lagen zwei uebereinander
  // und die Prioritaet entschiede, welche der Nutzer sieht.
  useEffect(() => {
    if (aktionenLage.art !== 'zu') schliesseVorlagenAnsicht()
  }, [aktionenLage])

  // #456: Die Ansicht gilt nur, wenn der Träger sie wirklich liefert. Verschwindet der Slot
  // (Projekt geschlossen), faellt die Reiterfläche sofort zurueck – kein leeres Fenster.
  const markenAnsicht = eigenschaften.markenAnsicht
  const markenAktiv = zustand.markenOffen && markenAnsicht !== undefined
  const aktionenAnsicht = eigenschaften.aktionenAnsicht
  const aktionenAktiv = aktionenLage.art !== 'zu' && aktionenAnsicht !== undefined
  const vorlagenAnsicht = eigenschaften.vorlagenAnsicht
  const vorlagenAktiv = vorlagenOffen && vorlagenAnsicht !== undefined
  // Es liegt IMMER nur EINE Ansicht über der Reiterfläche. Vorrang: Marken, Aktionen,
  // Vorlagen - in dieser Reihenfolge wird gerendert; die Oeffnen-Wege schliessen die
  // jeweils anderen (Projektleiste unten, Composer-Effekt oben).
  const ansichtAktiv = markenAktiv || aktionenAktiv || vorlagenAktiv
  // FA-21: Welche Historie gilt? Eine offene Ansicht gewinnt ueber den Reiter. Die
  // Regel selbst ist rein und in `undo-historien.ts` geprueft (wirksamerUndoBereich):
  // Marken ohne Historie, Aktionen auf dem Projekt, Vorlagen auf der Arbeitskopie.
  const undoBereich: Historienbereich | null = wirksamerUndoBereich({
    marken: markenAktiv,
    aktionen: aktionenAktiv,
    vorlagen: vorlagenAktiv,
    reiter: zustand.aktiv,
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <nav role="tablist" style={{ flex: '0 0 auto', display: 'flex', gap: 4 }}>
        {REITER_REIHENFOLGE.map((reiter) => (
          <button
            key={reiter}
            type="button"
            role="tab"
            aria-selected={reiter === zustand.aktiv}
            data-testid={`reiter-${reiter}`}
            onClick={() => {
              // #456: Auch ein Klick auf den SCHON aktiven Reiter schliesst die
              // Marken-Ansicht. `wechsleReiter` meldet in diesem Fall nichts (ENTSCHIEDEN 3),
              // der Slot des Rahmens wuerde also nie erfahren, dass der Nutzer hier wegwill.
              sende({ art: 'marken-geschlossen' })
              // 01.11.2026: derselbe Rueckweg fuer die Aktionen-Ansicht - ein Reiterklick
              // heisst "zurueck zum Projekt", auch wenn derselbe Reiter schon aktiv ist.
              schliesseAktionenAnsicht()
              schliesseVorlagenAnsicht()
              wechsleReiter(reiter)
            }}
          >
            {REITER_BESCHRIFTUNG[reiter]}
          </button>
        ))}
        {eigenschaften.undoRedo ? eigenschaften.undoRedo(undoBereich) : null}
        {eigenschaften.speicherHinweis ? eigenschaften.speicherHinweis() : null}
      </nav>

      {eigenschaften.projektleiste !== undefined
        ? eigenschaften.projektleiste({
          markenOffen: zustand.markenOffen,
          // #456: Der Name ist ein UMSCHALTER. Wer ihn ein zweites Mal drueckt, will
          // zurueck ins Projekt - nicht denselben Editor ein zweites Mal oeffnen.
          aufMarken: (markeId: string) => {
            // Nur EINE Ansicht: die Vorlagen-Ansicht schliesst, wer Marken oeffnet.
            schliesseVorlagenAnsicht()
            if (zustand.markenOffen && zustand.markenMarkeId === markeId) {
              sende({ art: 'marken-geschlossen' })
            } else {
              sende({ art: 'marken-geoeffnet', markeId })
            }
          },
          vorlagenOffen,
          aufVorlagen: () => {
            if (istVorlagenAnsichtOffen()) {
              schliesseVorlagenAnsicht()
              return
            }
            // Nur EINE Ansicht: Marken und Aktionen schliessen, dann oeffnen.
            if (zustand.markenOffen) sende({ art: 'marken-geschlossen' })
            schliesseAktionenAnsicht()
            oeffneVorlagenAnsicht()
          },
        })
        : null}

      {eigenschaften.meldungsFlaeche ? eigenschaften.meldungsFlaeche() : null}

      <div
        style={{ flex: 1, minHeight: 0, overflow: 'auto' }}
        data-testid="rahmen-inhalt-bereich"
      >
        {REITER_REIHENFOLGE.map((reiter) =>
          istMontiert(zustand.besuchte, reiter) ? (
            <div
              key={reiter}
              hidden={ansichtAktiv || reiter !== zustand.aktiv}
              data-testid={`rahmen-inhalt-${reiter}`}
              // #419: Der Reiter-Wrapper FUeLLT den Inhaltsbereich. Ohne definite Hoehe
              // loesen `height: 100%`-Ketten im Reiterinhalt auf `auto` auf; die
              // Prozenthoehen der Zusammenstellen-Spalte (#414: Buehne 38 %) kollabierten
              // dann auf 0. Die fruehere Zeilen-Anordnung verbarg das (die Vorschau bekam
              // ihre Hoehe vom laengeren Composer daneben); die Spalte deckt es auf.
              style={{ height: '100%' }}
            >
              {createElement(eigenschaften.inhalte[reiter], {
                sichtbar: reiter === zustand.aktiv,
              })}
            </div>
          ) : null,
        )}
        {/* #456: Die Marken-Ansicht liegt ÜBER der Reiterfläche. Die Reiter bleiben
            montiert (TK 9.14.2) – nur verdeckt, damit keine Eingabe verlorengeht. */}
        {markenAktiv ? (
          <div data-testid="rahmen-inhalt-marken" style={{ height: '100%' }}>
            {markenAnsicht({
              markeId: zustand.markenMarkeId ?? '',
              aufSchliessen: () => sende({ art: 'marken-geschlossen' }),
            })}
          </div>
        ) : null}
        {/* 01.11.2026: Die Aktionen-Ansicht über der Reiterfläche - derselbe Vertrag. */}
        {aktionenAktiv && !markenAktiv ? (
          <div data-testid="rahmen-ansicht-aktionen" style={{ height: '100%' }}>
            {aktionenAnsicht({
              // null = Modus „neu" (Entscheidung 29.4) - die Lage `zu` kommt hier nie an.
              aktionId: aktionenLage.art === 'aktion' ? aktionenLage.aktionId : null,
              aufSchliessen: () => schliesseAktionenAnsicht(),
            })}
          </div>
        ) : null}
        {/* 03.11.2026: Die VORLAGEN-Ansicht - „man soll nur im Projekteditor arbeiten
            müssen". Einstieg in der Projektleiste, Rückweg ueber den Knopf darin. */}
        {vorlagenAktiv && !markenAktiv && !aktionenAktiv ? (
          <div data-testid="rahmen-ansicht-vorlagen" style={{ height: '100%' }}>
            {vorlagenAnsicht({ aufSchliessen: () => schliesseVorlagenAnsicht() })}
          </div>
        ) : null}
      </div>

      {eigenschaften.warteschlangenLeiste()}
    </div>
  )
}