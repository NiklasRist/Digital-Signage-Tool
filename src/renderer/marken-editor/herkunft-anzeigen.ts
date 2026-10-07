// Generiert aus dem Signaturblock von Issue #299 und dort GEFUELLT: 07.10.2026, Session v.
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
// GERUEST-PRUEFSUMME: 1d504dc94e8add1f
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
import type {
  Marke, FarbRolle, SchriftRolle, MarkenHerkunftJeFeld,
} from '../../shared/contracts/marke'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'
import { uebernimmAktualisierteMarke } from './marken-uebersicht'

/** Ein einzelnes änderbares Feld einer Marke, adressiert für Rückgabe UND Anzeige. `name` fehlt
 *  absichtlich: „name" kennt laut #285 kein `{ geerbt: true }` (TK 9.11.2: „außer id, name, parent
 *  und eingebaut"). */
export type HerkunftPfad =
  | { art: 'farbe'; rolle: FarbRolle }
  | { art: 'schrift'; rolle: SchriftRolle }
  | { art: 'logo' }
  | { art: 'sicherheit' }
  | { art: 'radien' }
  | { art: 'schatten' }
  | { art: 'slogan' }

/**
 * Setzt EIN Feld der abgeleiteten Marke `markeId` auf den Sentinel `{ geerbt: true }` (#285) –
 * der eigene Wert wird entfernt, das Feld folgt danach wieder dem Parent. Übernimmt bei Erfolg das
 * Ergebnis in die gemeinsame Sicht (#295). NUR für abgeleitete Marken sinnvoll (s. Fehlerpfade).
 */
export async function setzeFeldAufGeerbt(
  markeId: string,
  pfad: HerkunftPfad,
): Promise<Ergebnis<Marke, string>> {
  // FORM vor IPC (wie #296/#298): markeId muss gefuellter Text sein. Ob die Marke
  // abgeleitet ist, prueft der Store (#285) - KEIN Vorab-Check hier (Verbot, ENTSCHIEDEN 4).
  if (typeof markeId !== 'string' || markeId.trim().length === 0) {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: 'setzeFeldAufGeerbt braucht eine nicht leere markeId.',
      },
    }
  }
  // EXAKT EIN Feld je Aufruf (ENTSCHIEDEN 1): die Abbildungstabelle des Issues,
  // Eins-zu-Eins; der Sentinel-Weg { geerbt: true } ENTFERNT den eigenen Wert (#285).
  const geerbt = { geerbt: true } as const
  const teilwerte =
    pfad.art === 'farbe'
      ? { farben: { [pfad.rolle]: geerbt } }
      : pfad.art === 'schrift'
        ? { schriften: { [pfad.rolle]: geerbt } }
        : pfad.art === 'logo'
          ? { logo: geerbt }
          : pfad.art === 'sicherheit'
            ? { sicherheit: geerbt }
            : pfad.art === 'radien'
              ? { radien: geerbt }
              : pfad.art === 'schatten'
                ? { schatten: geerbt }
                : { slogan: geerbt }
  const antwort = await rufeAuf<Marke, string>(KANAELE.marken.bearbeiteMarke, {
    markeId,
    teilwerte,
  })
  if (!antwort.ok) return antwort
  uebernimmAktualisierteMarke(antwort.wert)
  return antwort
}

// MarkenHerkunftJeFeld wird HIER NICHT deklariert. Der Typ gehoert zu
// src/shared/contracts/marke.ts (Edit an #52 (= **#320**)), weil er als Feld Marke.herkunftJeFeld ueber die
// IPC-Grenze reist (TK 9.11.2, seit v3.5). Diese Datei IMPORTIERT ihn - eine zweite Deklaration
// im Renderer waere die Doppelung, die bei einer Vertragsaenderung lautlos auseinanderlaeuft.
// Form (Abschrift, NICHT hier deklarieren):
//   farben: Record<FarbRolle, 'eigen' | 'geerbt'>
//   schriften: Record<SchriftRolle, 'eigen' | 'geerbt'>
//   logo: 'eigen' | 'geerbt' | 'keins'      // 'keins' = Ersatz-Logo greift
//   sicherheit / radien / schatten / slogan: 'eigen' | 'geerbt'
// Beschafft wird er NICHT ueber einen eigenen Aufruf: Er haengt an der Marke, die #295 haelt
// (marke.herkunftJeFeld).

/** Liest die Herkunft EINES Feldes aus der Gesamtstruktur. */
export function leseHerkunft(
  herkunft: MarkenHerkunftJeFeld,
  pfad: HerkunftPfad,
): 'eigen' | 'geerbt' | 'keins' {
  // Reine Lese-Funktion: der Stempel kommt an der Marke mit (TK 9.11.2), hier wird
  // NICHTS beschafft und NICHTS ausgerechnet (ENTSCHIEDEN 2, Verbot Wert-Vergleich).
  switch (pfad.art) {
    case 'farbe':
      return herkunft.farben[pfad.rolle]
    case 'schrift':
      return herkunft.schriften[pfad.rolle]
    case 'logo':
      return herkunft.logo
    case 'sicherheit':
      return herkunft.sicherheit
    case 'radien':
      return herkunft.radien
    case 'schatten':
      return herkunft.schatten
    case 'slogan':
      return herkunft.slogan
  }
}

/**
 * Der feste Anzeigetext für ein Feld – exportiert, damit die zeichnende Komponente ihn UNVERÄNDERT
 * übernimmt statt eigene Formulierungen zu bauen. `parentName` erscheint NUR bei 'geerbt'.
 */
export function baueHerkunftText(
  status: 'eigen' | 'geerbt' | 'keins',
  parentName: string,
): string {
  // Die DREI Texte des Issues, abschliessend - keine zweite Formulierung daneben (Verbot).
  if (status === 'eigen') return 'Eigener Wert dieser Marke.'
  if (status === 'geerbt') {
    return `Geerbt von \u201E${parentName}". \u00C4ndert sich automatisch, wenn dort ge\u00E4ndert wird.`
  }
  return 'Kein eigenes Logo \u2013 der Ersatz mit Markennamen wird angezeigt.'
}
