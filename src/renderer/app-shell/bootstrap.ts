// Issue #260 - bootstrap.ts: die FESTE Startreihenfolge des Renderers und die
// Zusammensetzung der Wirkstellen des Auftrags-Nachlaufs. Reine Datei: kein
// JSX, kein react, kein IPC, kein DOM - und ohne Browser pruefbar.
//
// DIE REIHENFOLGE IST VERTRAG (Schritte 1-4; 5-8 gehoeren App.tsx/#262). Jeder
// Schritt begruendet, warum GENAU dorthin gehoert; eine Vertauschung ergaebe
// Fehler OHNE Fehlermeldung:
//   1. baueSichten (#197) - ohnedies gibt es kein Ziel, in das geschrieben
//      werden koennte. Scheitert er, endet der Bootstrap (halb gefuellte
//      Sichten sind verboten, #197).
//   2. verteileZugaenge (#244) - VOR allem, was das Projekt anfasst: die
//      einzige Stelle, an der umhüllt wird, MUSS vor dem ersten Schreiber
//      laufen.
//   3. starteSitzung (#196), mit setzeProjekt -> bereiteVor; erst DANACH
//      merkeAktivenReiter (starteSitzung ruft selbst wechsleReiter - ein
//      vorher angemeldetes Abo schreibte den gelesenen Wert sofort zurueck,
//      ein Schreibvorgang auf einen moeglicherweise angesteckten Stick).
//   4. starteAuftragsNachlauf (#199) - VOR jeder Anzeige; Ereignisse, die vor
//      dem Aufbau des Fensters fallen, verfallen STILLE - es wird nicht
//      gepuffert (TK 9.1.1, bindend).
//
// ENTSCHIEDEN 1: Der Bootstrap benutzt AUSSCHLIESSLICH projektRoh; er ruft
// umhuelleFuerBearbeitung NIE und bildet keine Huelle selbst. ENTSCHIEDEN 2: Ein
// fehlgeschlagenes bereiteVor ist KEIN Bootstrap-Fehltritt - der Code geht
// ueber meldeFehler, die Lage wird trotzdem 'bereit' (ehrlich: die Sichten
// sind voll, es fehlen nur die Zeichen-Voraussetzungen dieses Projekts; die
// Vorschau zeichnet dann nichts, #242).
// ENTSCHIEDEN 4: Kein Einmal-Schutz hier - je Fenster genau einmal sichert der
// Aufbau-Effekt von App.tsx.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Auftrag } from '../../shared/contracts/auftrag'
import type { Sichten } from './sichten'
import type { Reiterzugaenge } from './inhalte-zugaenge'
import type { StartErgebnis, StartHinweis } from './start'
import type { NachlaufWirkungen } from './auftrags-nachlauf'

/** Der Stand des Renderer-Bootstraps. Ein WERT – keine Funktion mutiert ihn. */
export type BootstrapLage =
  | { schritt: 'laeuft' }
  | {
      schritt: 'bereit'
      zugaenge: Reiterzugaenge
      /** Warum kein Projekt wiederhergestellt wurde; null = eines ist geladen. */
      startHinweis: StartHinweis | null
    }
  | { schritt: 'gescheitert'; code: string; meldung: string }

/** `{ schritt: 'laeuft' }` – NIE 'bereit' und NIE 'gescheitert' (Invariante 1 des Meilensteins). */
export const ANFANGS_BOOTSTRAP: BootstrapLage = { schritt: 'laeuft' }

/**
 * Alles, was der Ablauf ruft. Wird als Parameter uebergeben – diese Datei importiert KEINE Sicht,
 * KEINEN Reiter-Zustand, KEINEN Undo-Stapel, KEIN fremdes Renderer-Modul und KEINEN IPC-Client.
 */
export interface BootstrapSchritte {
  /** #197. */
  baueSichten: () => Promise<Ergebnis<Sichten, string>>
  /** #244 – REIN, wird genau einmal gerufen. */
  verteileZugaenge: (sichten: Sichten) => Reiterzugaenge
  /** #196 – wirft nie, liefert immer ein StartErgebnis. */
  starteSitzung: () => Promise<StartErgebnis>
  /** #196 – Rueckgabewert ist die Abmelde-Funktion. */
  merkeAktivenReiter: () => () => void
  /** #199 – Rueckgabewert ist die Abmelde-Funktion. */
  starteAuftragsNachlauf: (
    abonniereQueue: (hoerer: (auftraege: Auftrag[]) => void) => () => void,
    wirkungen: NachlaufWirkungen,
  ) => () => void
  /** Das Abo auf `queue:geaendert`, vom Aufrufer aus `abonniere` (#151) gebildet.
   *  Diese Datei kennt keinen Kanalnamen. */
  abonniereQueue: (hoerer: (auftraege: Auftrag[]) => void) => () => void
  /** #234 – wird UNVERAENDERT in die Wirkstellen gelegt, hier NIE gerufen. */
  leereProjektHistorie: () => void
  /** #230 `aktualisiereAusgaben` – wird UNVERAENDERT in die Wirkstellen gelegt, hier NIE gerufen. */
  aktualisiereAusgabenListe: () => void
  /** Der Import-Rueckweg der Reparatur (#256) – wird UNVERAENDERT in die Wirkstellen gelegt,
   *  hier NIE gerufen. */
  meldeImportErgebnis: (assetId: string) => void
  /** Meldeweg fuer Fehler des Nachlaufs und des Vorbereitens. Diese Datei zeigt NICHTS selbst an. */
  meldeFehler: (code: string, meldung: string) => void
  /** Rueckkanal in den Zustand des Aufrufers. Wird bei JEDEM Lagewechsel gerufen. */
  setzeLage: (lage: BootstrapLage) => void
}

/**
 * Baut die Wirkstellen des Auftrags-Nachlaufs (#199) aus den verteilten Zugaengen.
 * REIN: ruft NICHTS auf, legt nur zusammen. ALLE ACHT Felder werden belegt.
 * `holeProjekt` ist die einzige umschliessende Funktion – sie ueberbrueckt `hole()` und `.projekt`.
 */
export function baueNachlaufWirkungen(
  zugaenge: Reiterzugaenge,
  leereProjektHistorie: () => void,
  aktualisiereAusgabenListe: () => void,
  meldeFehler: (code: string, meldung: string) => void,
  meldeImportErgebnis: (assetId: string) => void,
): NachlaufWirkungen {
  return {
    // Die einzige Umschliessung - sie rechnet NICHTS, sie liest zur
    // LAUFZEIT, damit kein veralterter Stand eingefsroren wird:
    holeProjekt: () => zugaenge.projektRoh.hole().projekt,
    // Die uebrigen sieben Felder werden UNVERAENDERT gelegt (ToBe):
    setzeProjekt: zugaenge.projektRoh.setzeProjekt,
    verwirfMotivBestand: zugaenge.zeichnen.verwirfMotivBestand,
    bereiteZeichnenVor: zugaenge.zeichnen.bereiteVor,
    leereProjektHistorie,
    aktualisiereAusgabenListe,
    meldeImportErgebnis,
    meldeFehler,
  }
}

/**
 * Fuehrt den Renderer-Bootstrap EINMAL aus, in der festen Reihenfolge dieses Issues (Schritte 1-4).
 * Kehrt SYNCHRON zurueck und liefert die Abbau-Funktion; `setzeLage` wird beim Betreten NICHT
 * gerufen. Wirft nie.
 */
export function starteRenderer(schritte: BootstrapSchritte): () => void {
  // ENTSCHAEDEN 4: kein Einmal-Schutz; der Ablauf laeuft je Aufruf vollstaendig.
  let abgebaut = false
  const abmeldungen: Array<() => void> = []
  // Invariante 2: JEDE Anmeldung wird abgemeldet; die Abbau-Funktion ist
  // idempotent (mehrfach aufrufbar, ohne zweimal abzumelden).
  const abbau = (): void => {
    if (abgebaut) return
    abgebaut = true
    while (abmeldungen.length > 0) {
      const abmelden = abmeldungen.pop()
      if (abmelden !== undefined) abmelden()
    }
  }

  void (async () => {
    try {
      // SCHRITT 1 - die Sichten; ohnedies gibt es kein Ziel. Ein Fehlschlag
      // endet hier (kaum ein Punkte kann spaeter noch entstehen).
      const sichtenErgebnis = await schritte.baueSichten()
      if (abgebaut) return
      if (!sichtenErgebnis.ok) {
        schritte.setzeLage({
          schritt: 'gescheitert',
          code: sichtenErgebnis.fehler.code,
          meldung: sichtenErgebnis.fehler.meldung,
        })
        return
      }
      const sichten = sichtenErgebnis.wert

      // SCHRITT 2 - die Zugaenge verteilen, VOR dem ersten Schreiber.
      const zugaenge = schritte.verteileZugaenge(sichten)

      // SCHRITT 3 - die Sitzung setzen (Ober 'projekt-geladen'), sonst behalten
      // wir den Hinweis; danach erst die Reiter-Merkung.
      const startErgebnis = await schritte.starteSitzung()
      if (abgebaut) return
      let startHinweis: StartHinweis | null = null
      if (startErgebnis.art === 'projekt-geladen') {
        // Erst setzen, DANN vorbereiten (Reihenfolge beachtet):
        zugaenge.projektRoh.setzeProjekt(startErgebnis.projekt)
        const vorbereitet = await zugaenge.zeichnen.bereiteVor(startErgebnis.projekt)
        if (abgebaut) return
        // ENTSCHIEDEN 2: ein Vorbereitungs-Fehlschlag ist KEIN Bootstrap-Ende.
        if (!vorbereitet.ok) {
          schritte.meldeFehler(vorbereitet.fehler.code, vorbereitet.fehler.meldung)
        }
      } else {
        startHinweis = startErgebnis.hinweis
      }
      abmeldungen.push(schritte.merkeAktivenReiter())

      // SCHRITT 4 - der Nachlauf, VOR jeder Anzeige; wir leiten das Abo
      // UNVERAENDERT durch, unsere Datei kennt keinen Kanalnamen.
      abmeldungen.push(
        schritte.starteAuftragsNachlauf(
          schritte.abonniereQueue,
          baueNachlaufWirkungen(
            zugaenge,
            schritte.leereProjektHistorie,
            schritte.aktualisiereAusgabenListe,
            schritte.meldeFehler,
            schritte.meldeImportErgebnis,
          ),
        ),
      )

      schritte.setzeLage({ schritt: 'bereit', zugaenge, startHinweis })
    } catch (wurf) {
      // Zu fangen sind nur echte Programmfehler (der Vertrag der Baustumanten
      // verspricht, sie werfen nie); die Lage ist gescheitert, die Abbau-
      // Funktion bleibt aufrufbar.
      schritte.setzeLage({
        schritt: 'gescheitert',
        code: 'unbekannter_fehler',
        meldung: wirfText(wurf),
      })
    }
  })()

  return abbau
}

function wirfText(wurf: unknown): string {
  return wurf instanceof Error ? wurf.message : String(wurf)
}
