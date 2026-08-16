// GENERIERT aus dem Signaturblock von Issue #107.
// [vorlagen-store] löscheVorlage – blockierend löschen, mit beiden Trefferlisten im Fehler
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
// GERUEST-PRUEFSUMME: f026c376bb0733ff
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
//
// ERLEDIGT (16.08.2026): Die Abschaltzeile in Zeile 1 ist mit dem Fuellen des
// Rumpfes entfernt; die Importe werden jetzt benutzt. Der Absatz darueber bleibt
// als Beleg stehen.

import type { Ergebnis, GenerischerFehlercode } from '../../shared/contracts/ergebnis'
import type { Vorlagennutzung } from '../../shared/contracts/vorlage'
import type { VorlagenFehlercode } from './fehlercodes'

import { aendereBestand, ladeBestand } from './schreibe-vorlagen'
import { pruefeVorlagenReferenzen } from './referenzpruefung'
import { löseArbeitskopienVomParent } from './verwaiste-arbeitskopien'

// Fremde Aufrufe – vollstaendige Signaturen (aus dem Issue abgeschrieben, gegen die
// gebauten Dateien #98/#106/#108 geprueft):
//   #98: ladeBestand(): Promise<Ergebnis<Vorlage[], VorlagenFehlercode>>   // tiefe Kopie
//        aendereBestand<T>(aenderung, schreibart: 'sofort' | 'entprellt')
//          : Promise<Ergebnis<T, VorlagenFehlercode>>   // aenderung ist SYNCHRON, kein await
//   #106: pruefeVorlagenReferenzen(vorlagenId): Promise<Ergebnis<Vorlagennutzung, VorlagenFehlercode>>
//   #108: löseArbeitskopienVomParent(bestand: Vorlage[], parentId: string): Vorlage[]
//   #95:  type Vorlagennutzung = { aktionen: VorlagenReferenz[]; listenelemente: VorlagenReferenz[] }

export async function löscheVorlage(
  id: string,
): Promise<Ergebnis<void, VorlagenFehlercode>> {
  // Schritt 1: formal pruefen, BEVOR irgendetwas gelesen wird (TK 9.1.1 Punkt 6).
  // "Der Main validiert jede eingehende Nutzlast – er vertraut dem Renderer nicht."
  if (typeof id !== 'string' || id.length === 0) {
    return fehler('ungueltige_eingabe', 'Es wurde keine Vorlagen-ID angegeben (leer oder kein Text).')
  }

  // Schritt 2: Vorpruefung auf dem gelesenen Bestand. Hier wird NICHTS veraendert.
  const geladen = await ladeBestand()
  if (!geladen.ok) {
    return geladen
  }
  const eintrag = geladen.wert.find((vorlage) => vorlage.id === id)
  if (eintrag === undefined) {
    return fehler('nicht_gefunden', `Es gibt keine Vorlage mit der ID "${id}".`)
  }
  if (eintrag.eingebaut) {
    return eingebauteAbgewiesen(id)
  }
  if (eintrag.parent !== null) {
    return arbeitskopieAbgewiesen(id)
  }

  // Schritt 3: Referenzpruefung (#106). ok: false bedeutet "Pruefung NICHT
  // abgeschlossen", NIE "keine Treffer" - dann wird NICHT geloescht.
  const pruefung = await pruefeVorlagenReferenzen(id)
  if (!pruefung.ok) {
    return pruefung
  }
  const nutzung: Vorlagennutzung = pruefung.wert
  if (nutzung.aktionen.length > 0 || nutzung.listenelemente.length > 0) {
    // daten traegt das VOLLSTAENDIGE Pruefergebnis, unveraendert - beide Schluesel
    // immer vorhanden, auch die leere Liste (TK 9.1.1). Nichts kuerzen, nichts umbauen.
    return {
      ok: false,
      fehler: {
        code: 'vorlage_referenziert',
        meldung:
          `Die Vorlage "${id}" wird noch von ${nutzung.aktionen.length} Aktion(en) und ` +
          `${nutzung.listenelemente.length} Listenelement(en) benutzt und kann deshalb ` +
          'nicht geloescht werden.',
        daten: nutzung,
      },
    }
  }

  // Schritt 4: Schreiben. Die Aenderungsfunktion ist SYNCHRON - sie darf kein await
  // enthalten, sonst wuerde sie die Zusage von #98 aufheben, dass Lesen, Aendern und
  // Schreiben eine ununterbrechbare Einheit sind.
  return aendereBestand((bestand) => {
    // 4a: erneut suchen. Zwischen Schritt 2 und hier liegt eine asynchrone Pause
    // (die Referenzpruefung); in dieser Zeit kann eine andere Operation den Bestand
    // veraendert haben.
    const aktuell = bestand.find((vorlage) => vorlage.id === id)
    if (aktuell === undefined) {
      return fehler('nicht_gefunden', `Es gibt keine Vorlage mit der ID "${id}".`)
    }
    if (aktuell.eingebaut) {
      return eingebauteAbgewiesen(id)
    }
    if (aktuell.parent !== null) {
      return arbeitskopieAbgewiesen(id)
    }
    // 4b + 4c: Arbeitskopien loesen (#108), dann den Eintrag entfernen - in EINEM
    // Schreibvorgang. Das Nullen und das Entfernen gehoeren zusammen: Bei zwei
    // Schreibvorgaengen koennte der zweite scheitern (verwaiste Referenz oder
    // grundlos verlorene Merge-Beziehung).
    const geloest = löseArbeitskopienVomParent(bestand, id)
    return {
      ok: true,
      wert: {
        bestand: geloest.filter((eintrag) => eintrag.id !== id),
        wert: undefined,
      },
    }
  }, 'sofort')
}

// ---------------------------------------------------------------------------
// Intern. Die Fehlerhuelle und die beiden standardisierten Ablehnungen - jeweils
// VOLLSTAENDIGE Fehlerobjekte, damit sie in Vorpruefung UND Schreibphase denselben
// Code liefern. "Wo die Operation nichts zu melden hat, lautet die Nutzlast void."
// ---------------------------------------------------------------------------

function fehler(
  code: VorlagenFehlercode | GenerischerFehlercode,
  meldung: string,
): { ok: false; fehler: { code: VorlagenFehlercode | GenerischerFehlercode; meldung: string } } {
  return { ok: false, fehler: { code, meldung } }
}

function eingebauteAbgewiesen(
  id: string,
): { ok: false; fehler: { code: VorlagenFehlercode | GenerischerFehlercode; meldung: string } } {
  return fehler(
    'ungueltige_eingabe',
    `Die Vorlage "${id}" ist eingebaut und eingefroren - sie kann nicht geloescht werden.`,
  )
}

function arbeitskopieAbgewiesen(
  id: string,
): { ok: false; fehler: { code: VorlagenFehlercode | GenerischerFehlercode; meldung: string } } {
  return fehler(
    'ungueltige_eingabe',
    `Die Vorlage "${id}" ist eine Arbeitskopie; Arbeitskopien werden ueber "Arbeitskopie verwerfen" (#105) entfernt.`,
  )
}

// - blockierend, NICHT kaskadierend: kein Projekt wird verändert

// - bei Treffern: fehler.code = 'vorlage_referenziert' mit fehler.daten = Vorlagennutzung

//   (also { aktionen: VorlagenReferenz[], listenelemente: VorlagenReferenz[] })

// - eingebaute Vorlagen sind unlöschbar

// - Arbeitskopien der gelöschten Vorlage werden im SELBEN Schreibvorgang von ihr gelöst (#108)

// - Referenzpruefung VOR der Schreib-Einheit (sie ist async), Entfernen + Loesen in EINER

//   aendereBestand(…, 'sofort')-Einheit (#98)

// - kein fs, kein Lock, kein IPC-Kanal (den meldet #109 an)