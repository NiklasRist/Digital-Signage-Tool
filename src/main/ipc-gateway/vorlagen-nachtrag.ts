// GENERIERT aus dem Signaturblock von Issue #255.
// [ipc-gateway] Den Kanal für die Vorlagen-Nutzung anmelden
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
// GERUEST-PRUEFSUMME: b6a55676160a3ab5

import { KANAELE } from '../../shared/contracts/kanaele'                 // #25
import { pruefeVorlagenReferenzen } from '../vorlagen-store/referenzpruefung' // #106
// Die Nutzlast-Pruefer liegen seit #332 an EINEM Ort - importiert, NICHT kopiert.
import { abgelehnt, istGefuellterText, istObjekt } from './nutzlast-pruefer'  // #332
import { registriereHandler } from './registriere-handler'               // #23

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Vorlagennutzung } from '../../shared/contracts/vorlage'
import type { VorlagenFehlercode } from '../vorlagen-store/fehlercodes'

export function verdrahteVorlagenNachtragIPC(): void {
  // GENAU EIN Kanal - der Name kommt aus der Registry (#25), in dieser Datei steht kein
  // einziger Kanalname als Zeichenkette.
  //
  // KEIN Schutz gegen einen zweiten Aufruf dieser Funktion: #3 ruft genau einmal, und
  // `ipcMain.handle` wirft bei doppelter Anmeldung von sich aus. Der Wurf faellt beim
  // Start des Hauptprozesses an und SOLL auffallen - er ist gerade die Probe darauf,
  // dass sich die Namensraeume von #109 und dieser Datei nicht ueberschneiden.
  //
  // KEIN Ereignis, keine Fensterreferenz, kein Zustand, kein eigenes try/catch (das
  // gehoert dem Wrapper #23), kein Lock, kein Dateizugriff, keine eigene Zaehlung:
  // Die Trefferlisten zaehlt #106, hier wird nur die Form geprueft und durchgereicht.
  registriereHandler<Vorlagennutzung, VorlagenFehlercode>(
    KANAELE.vorlagen.pruefeVorlagenReferenzen,
    // Form-Pruefung nach TK 9.1.1 Punkt 6: Objekt mit nicht leerer String-`vorlagenId`.
    // MEHR NICHT - insbesondere KEINE UUID-Formpruefung: Die eingebauten Vorlagen heissen
    // "vollbild", "split" und "band-standard" (#106) und waeren sonst dauerhaft unpruefbar.
    (nutzlast: unknown): Ergebnis<{ vorlagenId: string }, 'ungueltige_eingabe'> => {
      if (!istObjekt(nutzlast)) {
        return abgelehnt('pruefeVorlagenReferenzen erwartet ein Objekt { vorlagenId }.')
      }
      // Erst in eine Konstante, dann pruefen: An einer Konstanten greift die Verengung
      // durch die Waechterfunktionen verlaesslich, an einem Feld eines Record-Typs nicht
      // ueberall. `istGefuellterText` erkennt auch reine Leerzeichen als leer, laesst aber
      // den Wert UNVERAENDERT weiterreisen (keine Nutzlast-Reparatur, keine Trim-Sendung).
      const vorlagenId = nutzlast.vorlagenId
      if (!istGefuellterText(vorlagenId)) {
        return abgelehnt('pruefeVorlagenReferenzen braucht eine nicht leere vorlagenId.')
      }

      // NUR das eine erwartete Feld reist weiter; ein Fremdfeld landete nicht im Main.
      return { ok: true, wert: { vorlagenId } }
    },
    // #106 heisst den Parameter `vorlagenId` (MELDE-KLAUSEL: der Aufruf folgt der Datei,
    // nicht der Operationstabelle in TK 9.12.1, die ihn `id` nennt).
    (validierteNutzlast) =>
      pruefeVorlagenReferenzen((validierteNutzlast as { vorlagenId: string }).vorlagenId),
  )
}
// registriert den EINEN unten aufgeführten Kanal über den Wrapper aus #23 – mit einer eigenen
// Validierungsfunktion. Kein Zustand, keine Fachlogik, kein Ereignis-Versand (s. STOPP).