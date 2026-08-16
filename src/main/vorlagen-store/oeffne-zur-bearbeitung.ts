// GENERIERT aus dem Signaturblock von Issue #101.
// [vorlagen-store] oeffneZurBearbeitung implementieren
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
// GERUEST-PRUEFSUMME: 4bb26939ed47e469
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
import type { Vorlage } from '../../shared/contracts/vorlage'
import type { VorlagenFehlercode } from './fehlercodes'
import { aendereBestand } from './schreibe-vorlagen'
import { erzeugeId } from '../../shared/contracts/id'

// Fremde Aufrufe – vollstaendige Signaturen, damit hier nichts geraten wird:
//   #98: aendereBestand<T>(
//            aenderung: (bestand: Vorlage[]) =>
//              Ergebnis<{ bestand: Vorlage[]; wert: T }, VorlagenFehlercode>,
//            schreibart: 'sofort' | 'entprellt',
//          ): Promise<Ergebnis<T, VorlagenFehlercode>>
//          // `aenderung` ist SYNCHRON und bekommt eine tiefe Kopie des Bestands.
//   #20:   erzeugeId(): string    // UUID v4
//   #97: type VorlagenFehlercode = 'vorlage_referenziert' | 'parent_eingebaut' | 'speicher_fehler'
//   #95: interface Vorlage { id: string; name: string; art: VorlagenArt; höhe: number | null
//                              parent: string | null; eingebaut: boolean; zonen: Zone[] }

/**
 * Liefert die Arbeitskopie, auf der bearbeitet wird.
 * Existiert bereits eine mit parent === id, wird GENAU DIESE zurueckgegeben (fortsetzen);
 * sonst wird eine neue angelegt.
 */
export async function oeffneZurBearbeitung(id: string): Promise<Ergebnis<Vorlage, VorlagenFehlercode>> {
  try {
    // Schritt 1 (Fehlerpfad-Tabelle): `id` muss ein nicht-leerer String sein - und zwar VOR jedem
    // Bestandszugriff. "Keine Wirkung" heisst hier: `aendereBestand` wird gar nicht erst betreten.
    // Ein zur Laufzeit durchgereichter Nicht-String scheitert an `typeof` - der Renderer darf
    // laut TK 9.1.1 Punkt 6 inhaltlich unbrauchbare Nutzlasten liefern, und der Main traut ihm
    // nicht. (Der Typ `string` haelt nur den Compiler ab, nicht den IPC.)
    if (typeof id !== 'string' || id.length === 0) {
      return {
        ok: false,
        fehler: {
          code: 'ungueltige_eingabe',
          meldung: 'oeffneZurBearbeitung braucht eine nicht-leere id.',
        },
      }
    }

    // Schritte 2 bis 5 - vollstaendig INNERHALB EINER `aendereBestand(…, 'sofort')`-Einheit.
    // Lesen, Suchen, Entscheiden und Schreiben sind damit ununterbrechbar: Zwischen dem Suchen
    // und dem Anhaengen kann keine andere Operation eine zweite Arbeitskopie desselben Parents
    // anlegen. Der Preis fuer den unveraenderten Fortsetzen-Fall (aendereBestand schreibt den
    // unveraenderten Bestand) ist entschieden - ein Lesen VOR der Einheit oeffnete genau die
    // Verschraenkungsluecke wieder, die #98 schliesst.
    return await aendereBestand<Vorlage>(
      (bestand) => {
        // Schritt 2: der Eintrag mit dieser id muss existieren.
        const parent = bestand.find((eintrag) => eintrag.id === id)
        if (parent === undefined) {
          return {
            ok: false,
            fehler: {
              code: 'nicht_gefunden',
              meldung: `Es gibt keine Vorlage mit der id "${id}".`,
            },
          }
        }

        // Schritt 3: keine Kette von Arbeitskopien. Der Parameter muss auf eine NUTZBARE Vorlage
        // zeigen; wer eine Arbeitskopie weiterbearbeiten will, benutzt sie direkt (#99 liefert sie).
        if (parent.parent !== null) {
          return {
            ok: false,
            fehler: {
              code: 'ungueltige_eingabe',
              meldung:
                `"${id}" ist selbst eine Arbeitskopie. Arbeitskopien werden direkt bearbeitet; ` +
                'oeffneZurBearbeitung nimmt nur nutzbare Vorlagen (parent === null) an.',
            },
          }
        }

        // Schritt 4: Fortsetzen. Existiert bereits eine Arbeitskopie mit parent === id, wird GENAU
        // DIESE zurueckgegeben - keine zweite, kein Abgleich mit dem aktuellen Parent-Stand ("Merge
        // ist ein vollstaendiges Ersetzen, kein Feld-Abgleich", TK 9.12.1). Der Bestand bleibt
        // unveraendert; `aendereBestand` schreibt denselben Inhalt trotzdem (entschieden, s. oben).
        const vorhanden = bestand.find((eintrag) => eintrag.parent === id)
        if (vorhanden !== undefined) {
          return { ok: true, wert: { bestand, wert: vorhanden } }
        }

        // Schritt 5: neue Arbeitskopie, HINTEN an den Bestand angehaengt.
        //   - id: frische UUID (#20). Sie behaelt NICHT die des Parents - sonst waere der Parent
        //     aus dem Bestand verdraengt und alle Referenzen zeigten auf das halbfertige Layout
        //     (Invariante "Arbeitskopien sind nicht auswaehlbar").
        //   - eingebaut: IMMER false, auch bei eingebautem Parent - sonst waere die Arbeitskopie
        //     selbst unlöschbar und eingefroren (Sackgasse fuer Bearbeiten und Verwerfen).
        //   - zonen: TIEFE Kopie. Ein flacher Spread teilte `rahmen`/`text`/`deko` weiterhin mit
        //     dem Parent - das erste Verschieben einer Zone veraenderte den Parent im Speicher.
        const kopie: Vorlage = {
          id: erzeugeId(),
          name: parent.name,
          art: parent.art,
          höhe: parent.höhe,
          parent: id,
          eingebaut: false,
          zonen: structuredClone(parent.zonen),
        }
        return { ok: true, wert: { bestand: [...bestand, kopie], wert: kopie } }
      },
      'sofort',
    )
  } catch (ursache) {
    // Fehlerpfad-Tabelle: "unerwartete Ausnahme | unbekannter_fehler | gefangen und als Huelle
    // gemeldet, kein throw, nichts geschrieben". `aendereBestand` faengt intern schon; die Zange
    // hier ist der Auffangbogen fuer alles, was davor liegt. Geschrieben wurde in keinem dieser
    // Faelle etwas.
    return {
      ok: false,
      fehler: {
        code: 'unbekannter_fehler',
        meldung: `oeffneZurBearbeitung unerwartet abgebrochen: ${
          ursache instanceof Error ? ursache.message : String(ursache)
        }`,
      },
    }
  }
}
