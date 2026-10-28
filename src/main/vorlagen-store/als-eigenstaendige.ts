// [vorlagen-store] alsEigenstaendige – Arbeitskopie von ihrem Parent lösen

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Vorlage } from '../../shared/contracts/vorlage'
import type { VorlagenFehlercode } from './fehlercodes'
import { aendereBestand } from './schreibe-vorlagen'
export async function alsEigenstaendige(
  arbeitsId: string,
  name: string,
): Promise<Ergebnis<Vorlage, VorlagenFehlercode>> {
  // Schritt 1 – formale Pruefung VOR jedem Bestandszugriff (TK 9.1.1 Punkt 6).
  // Verletzungen ergeben `ungueltige_eingabe` OHNE Wirkung: `aendereBestand` wird gar
  // nicht betreten. Der Renderer darf laut TK inhaltlich unbrauchbare Nutzlasten
  // liefern, und der Main traut ihm nicht – der Typ `string` haelt nur den Compiler ab.
  if (typeof arbeitsId !== 'string' || arbeitsId.length === 0) {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: 'alsEigenstaendige braucht eine nicht-leere arbeitsId.',
      },
    }
  }
  if (typeof name !== 'string') {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: 'alsEigenstaendige braucht einen Namen.',
      },
    }
  }
  // Dieselbe Namensregel wie in #100 und #102: nach `trim()` nicht leer und hoechstens
  // 80 Zeichen. Gespeichert wird der GETRIMMTE Name. Ungueltig heisst abgelehnt,
  // nicht zurechtgebogen: kein Kuerzen, kein Ersatzname, kein Uebernehmen des alten.
  const getrimmterName = name.trim()
  if (getrimmterName.length === 0 || getrimmterName.length > 80) {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: 'Der Name muss nach dem Entfernen von Rand-Leerzeichen 1 bis 80 Zeichen lang sein.',
      },
    }
  }

  // Schritte 2 bis 6 – vollstaendig INNERHALB EINER `aendereBestand(…, 'sofort')`-Einheit.
  // Die Aenderungsfunktion ist SYNCHRON und enthaelt kein `await`: Genau das macht
  // Lesen-Aendern-Schreiben ununterbrechbar. Liefert sie `ok: false`, schreibt #98
  // NICHTS und reicht den Fehler unveraendert durch.
  return aendereBestand<Vorlage>(
    (bestand) => {
      // Schritt 3: der Eintrag muss im Bestand stehen und eine ARBEITSKOPIE sein.
      const eintrag = bestand.find((vorlage) => vorlage.id === arbeitsId)
      if (eintrag === undefined) {
        return {
          ok: false,
          fehler: {
            code: 'nicht_gefunden',
            meldung: `Es gibt keine Vorlage mit der id "${arbeitsId}".`,
          },
        }
      }
      if (eintrag.parent === null) {
        // Kein stiller Erfolg und kein heimliches Umbenennen: Sonst waere diese Operation
        // ein zweiter, ungepruefter Weg, jede beliebige – auch eine eingebaute – Vorlage
        // umzubenennen (Fehlerpfad-Tabelle).
        return {
          ok: false,
          fehler: {
            code: 'ungueltige_eingabe',
            meldung:
              `Die Vorlage "${arbeitsId}" ist bereits eigenstaendig (parent === null); ` +
              'als eigenstaendig wird nur eine Arbeitskopie gemacht.',
          },
        }
      }

      // Schritt 4: an der POSITION des Eintrags steht danach der neue Zustand.
      //   - parent: null          (DIE teure Entscheidung des Issues: das FELD, nicht der Parent)
      //   - name:  getrimmterName (der vom Nutzer gewaehlte Anzeigename)
      //   - eingebaut: false      (das Ergebnis ist per Definition eine eigene Vorlage, FA-13;
      //                            ein versehentlich eingebauter Eintrag waere unreparierbar)
      // id, art, höhe und zonen bleiben unveraendert; `parent` wird NICHT nachgeschlagen
      // (ENTSCHIEDEN – ein fehlender Parent ist kein Grund zu scheitern, das macht #108
      // bei verwaisten Kopien genauso).
      const neuerEintrag: Vorlage = { ...eintrag, parent: null, name: getrimmterName, eingebaut: false }

      // Schritt 5: Rueckgabe an #98. Der Bestand hat danach GENAU SO VIELE Eintraege wie
      // vorher, in unveraenderter Reihenfolge – kein zusaetzlicher Eintrag, kein Entfernen.
      return {
        ok: true,
        wert: {
          bestand: bestand.map((vorlage) => (vorlage.id === arbeitsId ? neuerEintrag : vorlage)),
          wert: neuerEintrag,
        },
      }
    },
    // Schritt 6 ist Sache von #98: 'sofort' bedeutet, die Datei ist geschrieben, BEVOR das
    // Promise erfuellt wird. 'entprellt' ist ausschliesslich fuer das Auto-Speichern (#102) –
    // hier entsteht eine AUSWAEHLBARE Vorlage, die ab dem gemeldeten Erfolg in Aktionen
    // verwendet werden darf.
    'sofort',
  )
}
// - setzt am EINTRAG MIT id === arbeitsId: parent = null, name = <name>, eingebaut = false
// - behält dessen id, art, höhe und zonen unverändert
// - fasst den Parent-Datensatz NICHT an und liest ihn nicht einmal
// - legt KEINEN zusätzlichen Eintrag an und entfernt keinen
// - kein fs, kein Lock, kein IPC-Kanal (den meldet #109 an)
