// [vorlagen-store] oeffneZurBearbeitung implementieren

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Vorlage } from '../../shared/contracts/vorlage'
import type { VorlagenFehlercode } from './fehlercodes'
import { aendereBestand } from './schreibe-vorlagen'
import { erzeugeId } from '../../shared/contracts/id'
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
