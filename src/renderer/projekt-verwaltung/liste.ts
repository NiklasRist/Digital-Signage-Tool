// GENERIERT aus dem Signaturblock von Issue #222.
// [projekt-verwaltung] Die Projektliste laden, halten und anzeigen
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
// GERUEST-PRUEFSUMME: 6a50e61f80534df1

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'
import type { ProjektMeta } from '../../shared/contracts/projekt-meta'

/**
 * Die Nutzlast von `project:listeProjekte` (TK 9.5.2). Sie wird hier NICHT deklariert, sondern
 * aus dem GETEILTEN Vertrag (#247, `src/shared/contracts/projekt-meta.ts`) importiert und
 * UNVERAENDERT weiter-exportiert. Der Re-Export ist PFLICHT und keine Bequemlichkeit: SECHS
 * fremde Stellen importieren `ProjektMeta` aus `'./liste'` (#223 zweimal, #225, #226 zweimal,
 * #252). Ohne ihn brechen sie alle; mit ihm bleiben sie Zeichen fuer Zeichen gueltig.
 * Die Feldliste steht unter „Fremde Signaturen" – schreibe sie NICHT hier ab.
 */
export type { ProjektMeta }

/** Der gehaltene Bestand. `zustand: 'unbekannt'` heißt: es wurde noch nie erfolgreich geladen. */
export interface Projektliste {
  zustand: 'unbekannt' | 'geladen'
  eintraege: readonly ProjektMeta[]
  ladefehler: { code: string; meldung: string } | null
}

/** Der Ausgangswert: unbekannt, leer, ohne Fehler. */
export const LEERE_PROJEKTLISTE: Projektliste = Object.freeze({
  zustand: 'unbekannt',
  eintraege: [],
  ladefehler: null,
})

// ENTSCHIEDEN 2: Der Modul-Zustand liegt in dieser Datei, nicht in einer React-Komponente -
// vier weitere Issues und der Start-Ablauf greifen darauf zu (Liste, Loeschen, Oeffnen, ...).
let stand: Projektliste = LEERE_PROJEKTLISTE

/** Die angemeldeten Hoerer in Anmeldereihenfolge. */
const hoererListe: Array<(liste: Projektliste) => void> = []

/**
 * Schaltet auf einen neuen Stand um und benachrichtigt danach.
 *
 * ERST setzen, DANN melden - ein Hoerer, der in der Benachrichtigung `holeProjektliste()`
 * ruft (der Normalfall in einer UI-Anbindung), bekaeme sonst den alten Stand.
 */
function schalteUm(neu: Projektliste): void {
  stand = Object.freeze(neu)
  benachrichtige()
}

/**
 * Meldet den aktuellen Stand an alle Hoerer - genau einmal je Hoerer.
 *
 * ZWEI VORKEHRUNGEN wie im etablierten Muster des composers (projektzustand.ts):
 * Die KOPIE der Hoererliste, damit ein Hoerer, der sich waehrend seiner eigenen
 * Benachrichtigung abmeldet, keinen laufenden Durchgang verschiebt - und das
 * try/catch, damit ein werfender Hoerer weder die uebrigen abschneidet noch den
 * Aufrufer erreicht ("kein `throw` an den Aufrufer"). Verschluckt wird der Fehler
 * nicht, er wird gemeldet.
 */
function benachrichtige(): void {
  for (const hoerer of [...hoererListe]) {
    try {
      hoerer(stand)
    } catch (fehler) {
      console.error('[projekt-verwaltung] Ein Hoerer der Projektliste hat geworfen.', fehler)
    }
  }
}

/** Holt den Bestand über `project:listeProjekte` und macht ihn zum gehaltenen Stand. */
export async function ladeProjektliste(): Promise<Ergebnis<readonly ProjektMeta[], string>> {
  try {
    // Ablauf 1: GENAU EIN Aufruf, ohne Nutzlast (laut #76 ruft der Handler ohne Argument).
    const ergebnis = await rufeAuf<ProjektMeta[]>(KANAELE.project.listeProjekte)

    if (ergebnis.ok) {
      // Ablauf 3: Ein leeres Array ist ein gültiger Bestand (Ablauf 4) - der Wert wird
      // UNVERAENDERT uebernommen, nicht sortiert, nicht gefiltert, nicht ergaenzt.
      schalteUm({ zustand: 'geladen', eintraege: ergebnis.wert, ladefehler: null })
      return { ok: true, wert: ergebnis.wert }
    }

    // Ablauf 2: Ein Fehlschlag loescht KEINEN funktionierenden Bestand. Der gehaltene
    // Stand behaelt eintraege und zustand, bekommt aber ladefehler gesetzt; der Code
    // wird UNVERAENDERT zurueckgegeben (TK 9.1.1 Punkt 7: kein stiller Fehlschlag).
    schalteUm({
      ...stand,
      ladefehler: { code: ergebnis.fehler.code, meldung: ergebnis.fehler.meldung },
    })
    return ergebnis
  } catch (ursache) {
    // `rufeAuf` wirft, wenn die Preload-Bruecke fehlt (#24) - das ist kein Fachfehler,
    // sondern ein Verdrahtungsfehler. Er wird wie ein Fehlschlag behandelt: melden statt
    // werfen ("kein Wurf nach aussen", Fehlerpfad).
    const meldung = ursache instanceof Error ? ursache.message : String(ursache)
    const fehler = { code: 'unbekannter_fehler', meldung }
    schalteUm({ ...stand, ladefehler: fehler })
    return { ok: false, fehler }
  }
}

/** Momentaufnahme des gehaltenen Standes. Der zurückgegebene Wert wird NIE verändert. */
export function holeProjektliste(): Projektliste {
  return stand
}

/** Abonnement für Änderungen des gehaltenen Standes; Rückgabewert ist die Abmelde-Funktion. */
export function aufProjektlisteGeaendert(hoerer: (liste: Projektliste) => void): () => void {
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

/** Der Eintrag mit dieser Kennung aus dem gehaltenen Stand; null, wenn es ihn nicht gibt. */
export function findeProjekt(id: string): ProjektMeta | null {
  // Unbekannte Kennung → null, kein Fehler und KEIN Nachladen (Fehlerpfad). Der Bestand
  // ist Momentaufnahme; ein Nachladen wuerde unter dem Zeiger des Aufrufers wechseln.
  for (const eintrag of stand.eintraege) {
    if (eintrag.id === id) {
      return eintrag
    }
  }
  return null
}

/** Eine anzeigefertige Zeile – rein abgeleitet, ohne Zustand. */
export interface ListenZeile {
  id: string
  bezeichnung: string        // = meta.name (bei beschaedigt: true ist das der Ordnername)
  erstelltAmText: string
  geaendertAmText: string
  ordner: string             // relativer Ordnername – NIE ein absoluter Pfad
  beschaedigt: boolean
  oeffnenErlaubt: boolean    // === !beschaedigt
}

/** Die anzeigbaren Zeilen, in der Reihenfolge, die der Main geliefert hat (s. ENTSCHIEDEN 4). */
export function baueListenZeilen(eintraege: readonly ProjektMeta[]): ListenZeile[] {
  // ENTSCHIEDEN 4: Es wird NICHT sortiert. Die Reihenfolge ist die des Main; ein
  // Sortieren nach geaendertAm verschöbe Zeilen unter dem Zeiger des Nutzers und
  // waere fuer beschaedigte Projekte (Ordner-Zeitstempel) ohnehin nicht vergleichbar.
  // ENTSCHIEDEN 5: Die beiden Zahlen werden weder ergaenzt noch ersetzt - sie sind in
  // `meta` vorhanden und werden hier einfach nicht angefasst.
  return eintraege.map((meta) => ({
    id: meta.id,
    bezeichnung: meta.name,
    erstelltAmText: formatiereZeitpunkt(meta.erstelltAm),
    geaendertAmText: formatiereZeitpunkt(meta.geaendertAm),
    ordner: meta.ordner,
    beschaedigt: meta.beschaedigt,
    oeffnenErlaubt: !meta.beschaedigt,
  }))
}

/**
 * ISO-8601 UTC → lesbarer Zeitpunkt in der lokalen Zeitzone (Datum UND Uhrzeit, ENTSCHIEDEN 7).
 * Ein unbrauchbarer Wert ergibt den Ersatztext '—', NIE 'Invalid Date' und NIE den Rohwert.
 */
export function formatiereZeitpunkt(iso: string): string {
  // `new Date(iso)` liefert fuer einen unbrauchbaren Wert `Invalid Date`; das wird ueber
  // `Number.isNaN(datum.getTime())` erkannt und durch den Ersatztext '—' ersetzt.
  const datum = new Date(iso)
  if (Number.isNaN(datum.getTime())) {
    return '—'
  }
  // Lokale Zeitzone (die Werte sind ISO-8601 UTC); Datum UND Uhrzeit (ENTSCHIEDEN 7).
  // Die expliziten Optionen machen die Ausgabe deterministisch - ein schlichtes
  // `toLocaleString()` ohne Argumente laesst je nach Laufzeitumgebung die Uhrzeit weg.
  return datum.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
}