// GENERIERT aus dem Signaturblock von Issue #230.
// [composer] Die Ausgabe-Liste – Dateiname, Größe, Datum und Uhrzeit
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.
//
// Die Pruefsumme haelt fest, was der Generator hier zuletzt hinterlassen hat.
// Stimmt sie beim naechsten Lauf nicht mehr, wurde die Datei bearbeitet - dann
// fasst der Generator sie NIE an, auch wenn sich das Issue geaendert hat. Sie
// mitzupflegen ist NICHT deine Aufgabe: Wer den Rumpf fuellt, laesst sie einfach
// stehen; ihr Nichtmehrstimmen IST das Signal.
// GERUEST-PRUEFSUMME: fed365c782f44acb
//
// ZUR ABSCHALTZEILE IN ZEILE 1 - SIE IST BEIM FUELLEN DES RUMPFES ZU ENTFERNEN:
// Die Parameter und Importe dieser Datei SIND der Vertrag; der Rumpf wirft aber
// nur, benutzt sie also nicht (@typescript-eslint/no-unused-vars). Die Zeile
// gehoert zum Geruest, nicht zum fertigen Code. Wer den Rumpf fuellt und sie
// stehen laesst, macht die Regel in DIESER Datei dauerhaft blind - unauffaellig,
// weil dann nichts mehr rot ist.
//
// Gesetzt hat sie kein Mensch, sondern tools/geruest.py: Es fragt nach dem
// Schreiben EINMAL ESLint, welche Dateien no-unused-vars tatsaechlich melden, und
// versieht nur diese. Deshalb steht sie nirgends ueberfluessig herum.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'
import type { AusgabeDatei } from '../../shared/contracts/projekt-meta'

/**
 * Die Nutzlast von `project:listeAusgaben` (TK 9.5.2). Sie wird hier NICHT deklariert, sondern
 * aus dem GETEILTEN Vertrag (#247, `src/shared/contracts/projekt-meta.ts`) importiert und
 * UNVERAENDERT weiter-exportiert. Der Re-Export ist PFLICHT und keine Bequemlichkeit: DREI fremde
 * Stellen importieren `AusgabeDatei` aus `'./ausgabe-liste'` (#231 `render-dialog.ts`, #232
 * `export-dialog.ts` UND `export-dialog.tsx`). Ohne ihn brechen sie alle; mit ihm bleiben sie
 * Zeichen fuer Zeichen gueltig.
 * Die Feldliste steht unter „Fremde Signaturen" – schreibe sie NICHT hier ab.
 */
export type { AusgabeDatei }

/** Der gehaltene Bestand. `zustand: 'unbekannt'` heißt: es wurde noch nie erfolgreich geladen. */
export interface Ausgabenstand {
  zustand: 'unbekannt' | 'geladen'
  dateien: readonly AusgabeDatei[]
  /** Das Projekt, zu dem `dateien` gehört; null, solange nie geladen wurde. */
  projektId: string | null
  ladefehler: { code: string; meldung: string } | null
}

/** Der Ausgangswert: unbekannt, leer, ohne Projekt, ohne Fehler. */
export const LEERER_AUSGABENSTAND: Ausgabenstand = Object.freeze({
  zustand: 'unbekannt',
  dateien: [],
  projektId: null,
  ladefehler: null,
})

// ENTSCHIEDEN 1: Es wird geholt, aber nichts abonniert (queue:geaendert ist tabu -
// der einzige Auswerter ist #199). Der Modul-Zustand liegt in dieser Datei; der erste
// Ladevorgang kommt vom Aufrufer, der das Projekt ohnehin hat (ENTSCHIEDEN 4).
let stand: Ausgabenstand = LEERER_AUSGABENSTAND

/** Die angemeldeten Hoerer in Anmeldereihenfolge. */
const hoererListe: Array<(stand: Ausgabenstand) => void> = []

/** Schaltet auf einen neuen Stand um und benachrichtigt danach - erst setzen, dann melden. */
function schalteUm(neu: Ausgabenstand): void {
  stand = Object.freeze(neu)
  benachrichtige()
}

/** Meldet den aktuellen Stand an alle Hoerer - Kopie der Liste, werfende Hoerer melden. */
function benachrichtige(): void {
  for (const hoerer of [...hoererListe]) {
    try {
      hoerer(stand)
    } catch (fehler) {
      console.error('[composer] Ein Hoerer der Ausgabe-Liste hat geworfen.', fehler)
    }
  }
}

/** Holt den Bestand über `project:listeAusgaben` und macht ihn zum gehaltenen Stand. */
export async function ladeAusgaben(
  projektId: string,
): Promise<Ergebnis<readonly AusgabeDatei[], string>> {
  // Ablauf 1: projektId pruefen - leer oder keine Zeichenkette ist ungueltige_eingabe
  // OHNE IPC-Aufruf (Fehlerpfad). Eine bereinigte projektId wird NICHT erfunden.
  if (projektId === '') {
    return { ok: false, fehler: { code: 'ungueltige_eingabe', meldung: 'projektId ist leer' } }
  }

  try {
    // Ablauf 2: GENAU EIN Aufruf, mit { projektId } (Nutzlast-Form laut #76).
    const ergebnis = await rufeAuf<AusgabeDatei[]>(KANAELE.project.listeAusgaben, { projektId })

    if (ergebnis.ok) {
      // Ablauf 4 + 5: Ein leeres Array ist ein gueltiger Bestand („noch nie gerendert").
      // Der Wert wird UNVERAENDERT uebernommen - nicht sortiert, nicht gefiltert (E3, E8).
      schalteUm({ zustand: 'geladen', dateien: ergebnis.wert, projektId, ladefehler: null })
      return { ok: true, wert: ergebnis.wert }
    }

    // Ablauf 3: Ein Fehlschlag loescht keinen funktionierenden Bestand; dateien, zustand
    // und projektId bleiben, ladefehler wird gesetzt. Code UNVERAENDERT zurueck.
    schalteUm({ ...stand, ladefehler: { code: ergebnis.fehler.code, meldung: ergebnis.fehler.meldung } })
    return ergebnis
  } catch (ursache) {
    // `rufeAuf` wirft, wenn die Preload-Bruecke fehlt (#24) - melden statt werfen.
    const meldung = ursache instanceof Error ? ursache.message : String(ursache)
    const fehler = { code: 'unbekannter_fehler', meldung }
    schalteUm({ ...stand, ladefehler: fehler })
    return { ok: false, fehler }
  }
}

/** Momentaufnahme des gehaltenen Standes. Der zurückgegebene Wert wird NIE verändert. */
export function holeAusgaben(): Ausgabenstand {
  return stand
}

/** Abonnement für Änderungen des gehaltenen Standes; Rückgabewert ist die Abmelde-Funktion. */
export function aufAusgabenGeaendert(hoerer: (stand: Ausgabenstand) => void): () => void {
  hoererListe.push(hoerer)
  let abgemeldet = false

  return () => {
    // Mehrfaches Aufrufen ist wirkungslos und wirft nicht (Fehlerpfad).
    if (abgemeldet) {
      return
    }
    abgemeldet = true
    const stelle = hoererListe.indexOf(hoerer)
    if (stelle !== -1) {
      hoererListe.splice(stelle, 1)
    }
  }
}

/**
 * Lädt den zuletzt geladenen Bestand erneut – die Form, die #199 als
 * `aktualisiereAusgabenListe?: () => void` erwartet. Ohne vorherigen Ladevorgang (also ohne
 * bekanntes Projekt) geschieht NICHTS (s. ENTSCHIEDEN 4).
 */
export function aktualisiereAusgaben(): void {
  // ENTSCHIEDEN 4: Ohne vorherigen Ladevorgang gibt es keine projektId, und diese Datei
  // besorgt sich keine - kein Fehler, keine Meldung, kein rufeAuf.
  if (stand.projektId === null) {
    return
  }
  // `ladeAusgaben` ist feuer-und-vergiss: Der Nachlauf (#199) braucht keine Antwort.
  void ladeAusgaben(stand.projektId)
}

/** Eine anzeigefertige Zeile – rein abgeleitet, ohne Zustand. */
export interface AusgabeZeile {
  dateiname: string
  groesseText: string      // z. B. "1,2 GB"
  zeitpunktText: string    // Datum UND Uhrzeit, lokale Zeitzone
}

/** Die Zeilen in der Reihenfolge, die der Main geliefert hat (s. ENTSCHIEDEN 3). */
export function baueAusgabeZeilen(dateien: readonly AusgabeDatei[]): AusgabeZeile[] {
  // ENTSCHIEDEN 3: NICHT sortieren - die Reihenfolge ist die des Main („absteigend nach
  // geaendertAm, neueste zuerst", #75). Eine zweite Sortierung waere eine zweite Wahrheit.
  return dateien.map((datei) => ({
    dateiname: datei.dateiname,
    groesseText: formatiereDateigroesse(datei.dateigroesse),
    zeitpunktText: formatiereZeitpunkt(datei.geaendertAm),
  }))
}

/** Bytes → lesbare Größe. Ein unbrauchbarer Wert ergibt '—', NIE 'NaN' und NIE '0 B'. */
export function formatiereDateigroesse(bytes: number): string {
  // ENTSCHIEDEN 5: Ganze, lesbare Einheiten (B, KB, MB, GB) mit einer Nachkommastelle ab
  // MB. Unbrauchbar (negativ, NaN, kein number) ergibt '—' und nicht '0 B' - „0 Byte"
  // waere die Behauptung einer kaputten Datei.
  if (!Number.isFinite(bytes) || bytes < 0) {
    return '—'
  }

  // 1024er-Schritte; bei 0 Bytes bleibt es bei B (eine fertige .mp4 ist nie 0, aber die
  // Funktion ist total und darf fuer 0 nicht werfen).
  const einheiten = ['B', 'KB', 'MB', 'GB'] as const
  let wert = bytes
  let einheitIndex = 0
  while (wert >= 1024 && einheitIndex < einheiten.length - 1) {
    wert /= 1024
    einheitIndex += 1
  }

  // Ab MB eine Nachkommastelle, darunter ganze Zahlen. Die Nachkommastelle im
  // deutschen Format (Komma, s. DoD-Beispiel „1,2 GB").
  const text =
    einheitIndex === 0
      ? `${wert}`
      : wert >= 100
        ? `${Math.round(wert)}`
        : wert.toFixed(1).replace('.', ',')
  return `${text} ${einheiten[einheitIndex]}`
}

/** ISO-8601 UTC → Datum UND Uhrzeit in der lokalen Zeitzone.
 *  Ein unbrauchbarer Wert ergibt '—', NIE 'Invalid Date' und NIE den Rohwert. */
export function formatiereZeitpunkt(iso: string): string {
  // ENTSCHIEDEN 6: Datum UND Uhrzeit, in der lokalen Zeitzone (der Wert ist UTC).
  // Explizite Optionen, damit die Ausgabe deterministisch beides enthaelt.
  const datum = new Date(iso)
  if (Number.isNaN(datum.getTime())) {
    return '—'
  }
  return datum.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

/** Die Datei mit genau diesem Namen aus dem gehaltenen Stand; null, wenn es sie nicht gibt.
 *  Von #231 gebraucht, um vor dem Überschreiben das Datum der vorhandenen Fassung zu nennen. */
export function findeAusgabe(dateiname: string): AusgabeDatei | null {
  // ENTSCHIEDEN 7: Buchstabengetreuer Vergleich - kein Kleinschreiben, kein Abschneiden
  // der Endung. Der Name kommt aus dem Dateisystem und geht unveraendert dorthin zurueck.
  for (const datei of stand.dateien) {
    if (datei.dateiname === dateiname) {
      return datei
    }
  }
  return null
}
