// GENERIERT aus dem Signaturblock von Issue #103.
// [vorlagen-store] uebernehmeInParent – Arbeitskopie vollständig in den Parent übernehmen
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
// GERUEST-PRUEFSUMME: 88dd0b862e8515be
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

import type { Ergebnis, GenerischerFehlercode } from '../../shared/contracts/ergebnis'
import type { Vorlage } from '../../shared/contracts/vorlage'
import type { VorlagenFehlercode } from './fehlercodes'
import { aendereBestand } from './schreibe-vorlagen'

/**
 * Übernimmt den Stand einer Arbeitskopie VOLLSTAENDIG in ihren Parent (TK 9.12.1):
 * name, art, höhe und zonen kommen aus der Arbeitskopie, id und eingebaut bleiben die
 * des Parents, parent wird null. Die Arbeitskopie verschwindet im selben Schreibvorgang.
 * Eingebaute Vorlagen werden niemals überschrieben (Code parent_eingebaut).
 */
export async function uebernehmeInParent(
  arbeitsId: string,
): Promise<Ergebnis<Vorlage, VorlagenFehlercode>> {
  try {
    // Ablauf-Schritt 1 (verbindlich): die formale Prüfung steht VOR jedem Bestandszugriff -
    // eine leere/unbrauchbare arbeitsId betritt `aendereBestand` gar nicht erst.
    if (typeof arbeitsId !== 'string' || arbeitsId.length === 0) {
      return fehler('ungueltige_eingabe', 'uebernehmeInParent braucht eine nicht-leere arbeitsId.')
    }

    // Ablauf-Schritte 2 bis 6 - vollständig in EINER `aendereBestand(…, 'sofort')`-Einheit.
    // Ersetzen und Entfernen laufen im selben Schreibvorgang; die Änderungsfunktion ist
    // SYNCHRON und darf nicht `await`en (#98) - nur so bleiben Lesen, Entscheiden und
    // Schreiben eine ununterbrechbare Einheit, in die kein Auto-Speichern hineinfunkt.
    return await aendereBestand<Vorlage>(
      (bestand) => {
        // Schritt 3: die Arbeitskopie muss im Bestand stehen.
        const kopie = bestand.find((eintrag) => eintrag.id === arbeitsId)
        if (kopie === undefined) {
          return fehler('nicht_gefunden', `Es gibt keine Vorlage mit der id "${arbeitsId}".`)
        }

        // Schritt 3: sie muss eine Arbeitskopie sein. Ein Parent mit parent !== null waere
        // eine Arbeitskopie von sich selbst und damit aus listeVorlagen (#99) verschwunden.
        if (kopie.parent === null) {
          return fehler(
            'ungueltige_eingabe',
            `"${arbeitsId}" ist keine Arbeitskopie (parent ist null); uebernommen wird nur der ` +
              'Stand einer Arbeitskopie.',
          )
        }

        // Selbstbezug abfangen: kopie.parent === arbeitsId fände die Parent-Suche in DEMSELBEN
        // Eintrag, der danach als Arbeitskopie entfernt wuerde - die Vorlage waere weg.
        if (kopie.parent === arbeitsId) {
          return fehler(
            'ungueltige_eingabe',
            `Die Arbeitskopie "${arbeitsId}" zeigt auf sich selbst; ein Merge ist nicht moeglich.`,
          )
        }

        // Schritt 3: der Parent muss im Bestand stehen. Kein Ausweichen auf "dann eben
        // eigenstaendig" - das ist #104 und eine andere Nutzerentscheidung.
        const parent = bestand.find((eintrag) => eintrag.id === kopie.parent)
        if (parent === undefined) {
          return fehler(
            'nicht_gefunden',
            `Der Parent "${kopie.parent}" der Arbeitskopie "${arbeitsId}" steht nicht im Bestand.`,
          )
        }

        // Sperre eingebaute Vorlagen: eingefroren (TK 9.11.1.1), der Weg ist alsEigenstaendige.
        if (parent.eingebaut) {
          return fehler(
            'parent_eingebaut',
            `"${parent.id}" ist eine eingebaute Vorlage; eingebaute Vorlagen sind eingefroren. ` +
              'Um ihr Layout zu uebernehmen, lege eine eigenstaendige Vorlage an (alsEigenstaendige).',
          )
        }

        // Ablauf-Schritt 3a: die zu übernehmende höhe - der EINZIGE Feldwert, den diese Funktion
        // inhaltlich ansieht. TK 9.12.1 nennt uebernehmeInParent ausdruecklich als Prüfstelle.
        const hoehenFehler = pruefeHoehe(kopie)
        if (hoehenFehler !== null) {
          return hoehenFehler
        }

        // Schritt 4: vollständiges Ersetzen als NEUES Objekt statt feldweisem Überschreiben
        // (dort vergisst man Felder). id und eingebaut bleiben die des Parents, parent wird
        // null - das parent der Arbeitskopie ist die Merge-Beziehung, kein Teil des Layouts.
        const gemergt: Vorlage = {
          id: parent.id,
          name: kopie.name,
          art: kopie.art,
          höhe: kopie.höhe,
          parent: null,
          eingebaut: parent.eingebaut,
          zonen: kopie.zonen,
        }

        // Der Parent wird an seiner bisherigen Position ersetzt, die Arbeitskopie entfernt;
        // alle übrigen Einträge bleiben unverändert und in unveränderter Reihenfolge.
        const neuerBestand: Vorlage[] = []
        for (const eintrag of bestand) {
          if (eintrag.id === arbeitsId) {
            continue
          }
          neuerBestand.push(eintrag.id === parent.id ? gemergt : eintrag)
        }

        // Schritt 5: wert ist der gemergte PARENT - als tiefe Kopie, damit ein Aufrufer, der am
        // Ergebnis weiterarbeitet, den zwischengespeicherten Bestand nicht hinter dem Ruecken des
        // Stores verbiegen kann (dieselbe Bauart wie in #100).
        return { ok: true, wert: { bestand: neuerBestand, wert: structuredClone(gemergt) } }
      },
      'sofort',
    )
  } catch (ursache) {
    // TK 9.1.1: kein throw über die IPC-Grenze - die Funktion wirft nie, jeder Ausgang ist eine
    // Huelle. `aendereBestand` faengt intern schon; der Bogen hier ist der Auffang fuer alles,
    // was davor liegt.
    return fehler('unbekannter_fehler', `uebernehmeInParent unerwartet abgebrochen: ${text(ursache)}`)
  }
}
// - liefert bei Erfolg den PARENT in seinem neuen Zustand (nicht die Arbeitskopie)
// - Merge = vollständiges Ersetzen: name, art, höhe und zonen kommen aus der Arbeitskopie;
//   id und eingebaut bleiben die des Parents, und parent bleibt null (s. Invarianten)
// - die übernommene höhe wird GEPRÜFT: bei split/einblendung gerade ganze Zahl > 0 und < 1080,
//   bei vollflaeche null -> sonst ungueltige_eingabe, es wird NICHTS geschrieben (TK 9.12.1)
// - die Arbeitskopie wird im SELBEN Schreibvorgang aus vorlagen.json entfernt
// - ist der Parent eingebaut, wird NICHTS geändert -> Code parent_eingebaut
// - laeuft vollstaendig in EINER aendereBestand(…, 'sofort')-Einheit (#98)
// - kein fs, kein Lock, kein IPC-Kanal (den meldet #109 an)

/**
 * Prüft die zu übernehmende höhe gegen die art (TK 9.11.1 Punkt 8 / 9.12.1). Rueckgabe
 * `null` = in Ordnung, sonst die Fehler-Huelle. Die höhe ist der EINZIGE Feldwert, den diese
 * Funktion inhaltlich ansieht - die Zonen werden wörtlich übernommen, nie geprüft.
 *
 * Grenzen identisch zur Hohenregel des Moduls (#100, #102): bei split/einblendung eine gerade
 * ganze Zahl > 0 und < 1080, bei vollflaeche immer null. Geprüft wird, NICHT gerundet: eine
 * ungerade 161 wird abgewiesen, keine still erzeugte 162 (TK 9.12.1 nennt uebernehmeInParent
 * ausdruecklich als Pruefstelle, s. ENTSCHIEDEN-Block des Issues).
 */
function pruefeHoehe(kopie: Vorlage): Ergebnis<never, VorlagenFehlercode> | null {
  const { id, art, höhe } = kopie
  if (art === 'vollflaeche') {
    if (höhe !== null) {
      return fehler(
        'ungueltige_eingabe',
        `Die Arbeitskopie "${id}" ist vollflaechig und darf keine Bandhoehe tragen ` +
          `(uebergeben: ${String(höhe)}).`,
      )
    }
    return null
  }
  if (
    typeof höhe !== 'number' ||
    !Number.isInteger(höhe) ||
    höhe <= 0 ||
    höhe >= 1080 ||
    höhe % 2 !== 0
  ) {
    return fehler(
      'ungueltige_eingabe',
      `Die Arbeitskopie "${id}" traegt eine unbrauchbare Bandhoehe (${String(höhe)}): ` +
        'erwartet wird eine gerade ganze Zahl groesser 0 und kleiner 1080.',
    )
  }
  return null
}

function text(ursache: unknown): string {
  return ursache instanceof Error ? ursache.message : String(ursache)
}

/**
 * Die Fehlerseite der Huelle - bewusst OHNE Nutztyp, damit sie fuer `Ergebnis<Vorlage, …>`
 * genauso passt wie fuer `Ergebnis<never, …>`. `daten` wird hier nie gesetzt (Issue, woertlich).
 */
function fehler(
  code: VorlagenFehlercode | GenerischerFehlercode,
  meldung: string,
): { ok: false; fehler: { code: VorlagenFehlercode | GenerischerFehlercode; meldung: string } } {
  return { ok: false, fehler: { code, meldung } }
}
