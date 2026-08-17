// GENERIERT aus dem Signaturblock von Issue #105.
// [vorlagen-store] verwerfeArbeitskopie – Bearbeitungsstand fallenlassen
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
// GERUEST-PRUEFSUMME: cdff6ab531ca0d4d
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
import type { VorlagenFehlercode } from './fehlercodes'
import { aendereBestand } from './schreibe-vorlagen'

export async function verwerfeArbeitskopie(
  arbeitsId: string,
): Promise<Ergebnis<void, VorlagenFehlercode>> {
  // SCHRITT 1: formal pruefen, BEVOR irgendetwas gelesen wird (TK 9.1.1 Punkt 6). "Der Main
  // validiert jede eingehende Nutzlast – er vertraut dem Renderer nicht." Ungueltige Eingabe ->
  // ungueltige_eingabe OHNE jede Wirkung auf die Daten; aendereBestand wird gar nicht gerufen.
  if (typeof arbeitsId !== 'string' || arbeitsId.length === 0) {
    return fehler(
      'ungueltige_eingabe',
      'Es wurde keine Arbeitskopien-ID angegeben (leer oder kein Text).',
    )
  }

  // SCHRITTE 2 bis 5: die ganze Operation laeuft in EINER aendereBestand(…, 'sofort')-Einheit.
  // Die Aenderungsfunktion ist SYNCHRON und darf kein `await` enthalten - genau das macht
  // Lesen-Aendern-Schreiben zu einer ununterbrechbaren Einheit (#98). Meldet sie ok:false,
  // schreibt #98 nichts und reicht den Fehler unveraendert durch. 'sofort', nicht 'entprellt':
  // Das Verwerfen ist eine bewusste, unumkehrbare Nutzerhandlung - ein entprellter Stand kaeme
  // nach einem Absturz zurueck und stuende wieder unter "Bearbeitung fortsetzen".
  return aendereBestand<void>((bestand) => {
    const eintrag = bestand.find((vorlage) => vorlage.id === arbeitsId)
    if (eintrag === undefined) {
      return fehler('nicht_gefunden', `Es gibt keine Vorlage mit der ID "${arbeitsId}".`)
    }
    if (eintrag.parent === null) {
      // DIE zentrale Sicherung dieser Datei: Eine nutzbare Vorlage (parent === null) wird hier
      // NICHT entfernt - das ist ausschliesslich #107 nach der Referenzpruefung ueber alle
      // Projekte. Ein Eintrag mit parent === null kann referenziert sein; Arbeitskopien nicht.
      return fehler(
        'ungueltige_eingabe',
        `Die Vorlage "${arbeitsId}" ist keine Arbeitskopie und kann hier nicht entfernt werden.`,
      )
    }
    // "alles zurueck, X unveraendert": Gefiltert wird nach id !== arbeitsId - GENAU dieser eine
    // Eintrag, kein Aufraeumen anderer Kopien (das ist #108) und nichts am Parent.
    return {
      ok: true,
      wert: {
        bestand: bestand.filter((vorlage) => vorlage.id !== arbeitsId),
        wert: undefined,
      },
    }
  }, 'sofort')
}

/**
 * Die Fehlerseite der Huelle - bewusst OHNE Nutztyp, damit sie fuer `Ergebnis<void, …>` passt
 * (TK 9.1.1). `daten` setzt diese Funktion NIE.
 */
function fehler(
  code: VorlagenFehlercode | GenerischerFehlercode,
  meldung: string,
): { ok: false; fehler: { code: VorlagenFehlercode | GenerischerFehlercode; meldung: string } } {
  return { ok: false, fehler: { code, meldung } }
}
// - entfernt GENAU den einen Eintrag mit id === arbeitsId, und nur wenn dessen parent ≠ null ist
// - fasst den Parent NICHT an und liest ihn nicht einmal
// - liefert bei Erfolg Ergebnis<void> – das gelungene `ok` IST die Information
// - laeuft vollstaendig in EINER aendereBestand(…, 'sofort')-Einheit (#98)
// - kein fs, kein Lock, kein IPC-Kanal (den meldet #109 an)
