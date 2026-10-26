// [ipc-gateway] config-store-Kanäle verdrahten

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { KANAELE } from '../../shared/contracts/kanaele'                     // #25
import { leseKonfig } from '../config-store/lese-konfig'                     // #26
import { setzeAktivesProjekt } from '../config-store/setze-aktives-projekt'  // #27
import { setzeExportZiel } from '../config-store/setze-export-ziel'          // #28
import { setzeUIVoreinstellung } from '../config-store/setze-ui-voreinstellung' // #30
// Die vier Nutzlast-Pruefer liegen seit #332 an EINEM Ort. Bis dahin standen sie hier
// als Kopie - Wort fuer Wort auch in #71, #76 und #93. Diese Fassung war die
// massgebliche; sie ist unveraendert umgezogen, nicht umgeschrieben.
import { meldeAn } from './melde-an'                                         // #333
import { abgelehnt, istGefuellterText, istObjekt, ohneNutzlast } from './nutzlast-pruefer' // #332

// Fremde Aufrufe - vollstaendige Signaturen, damit hier nichts geraten wird:
//   #23: registriereHandler<T, F extends string>(
//          kanal: string,
//          validiere: (nutzlast: unknown) => Ergebnis<unknown, 'ungueltige_eingabe'>
//                                          | { ok: true; wert: unknown },
//          ausfuehren: (validierteNutzlast: unknown) => Promise<Ergebnis<T, F>>,
//        ): void
//        // validiert zuerst; bei ok:false laeuft `ausfuehren` GAR NICHT an. Faengt jede
//        // Ausnahme und uebersetzt sie in 'unbekannter_fehler'. Reicht das Ergebnis von
//        // `ausfuehren` UNVERAENDERT zurueck.
//   #26: leseKonfig(): Promise<Ergebnis<AppKonfig, ConfigFehlercode>>
//   #27: setzeAktivesProjekt(projektId: string | null): Promise<Ergebnis<void, ConfigFehlercode>>
//   #28: setzeExportZiel(pfad: string): Promise<Ergebnis<void, ConfigFehlercode>>
//   #30: setzeUIVoreinstellung(schlüssel: string, wert: unknown): Promise<Ergebnis<void, ConfigFehlercode>>

export function verdrahteConfigStoreIPC(): void {
  // Alle vier Namen kommen aus der Registry (#25); in dieser Datei steht kein einziger
  // Kanalname als Zeichenkette - auch nicht in den Fehlermeldungen. Ein Tippfehler waere
  // sonst erst zur Laufzeit sichtbar, und zwar als Aufruf, der ins Leere laeuft, nicht
  // als Uebersetzungsfehler.
  meldeAn(KANAELE.config.leseKonfig, ohneNutzlast, () => leseKonfig())

  meldeAn(
    KANAELE.config.setzeAktivesProjekt,
    // Beide Annotationen stehen ABSICHTLICH da: Sie legen `W` der Huelle fest, bevor der
    // zweite Rueckruf getippt wird - ohne sie muesste TypeScript `W` aus zwei zugleich
    // kontextabhaengigen Funktionen erraten.
    (nutzlast: unknown): Ergebnis<{ projektId: string | null }, 'ungueltige_eingabe'> => {
      if (!istObjekt(nutzlast)) return abgelehnt('setzeAktivesProjekt erwartet ein Objekt { projektId }.')
      // Erst in eine Konstante, dann pruefen: An einer Konstanten greift die Verengung
      // durch `istGefuellterText` verlaesslich, an einem Feld eines Record-Typs nicht
      // ueberall.
      const projektId = nutzlast.projektId
      // `null` MUSS durch (nachgetragen 12.08.2026): Es ist der Zustand "kein Projekt
      // offen", den #27 seit demselben Tag annimmt und den #37 nach dem Loeschen des
      // offenen Projekts herstellen muss. Die urspruengliche Pruef-Tabelle verlangte
      // "nicht leerer String" und machte ihn damit aus dem Renderer unerreichbar.
      // Der leere String bleibt ungueltig - wer nichts offen haben will, uebergibt null.
      if (projektId !== null && !istGefuellterText(projektId)) {
        return abgelehnt('setzeAktivesProjekt braucht eine nicht leere projektId oder null.')
      }
      // NUR das eine erwartete Feld reist weiter. Ein durchgereichtes Fremdfeld landete
      // ueber `aendereKonfig` in `config.json` und bliebe dort fuer immer.
      return { ok: true, wert: { projektId } }
    },
    // KEINE Existenzpruefung, kein Abgleich mit dem project-store: Diese Datei enthaelt
    // keine Fachlogik (STOPP-Block des Issues). Ob es das Projekt gibt, entscheidet #27
    // bzw. der Aufrufer.
    ({ projektId }) => setzeAktivesProjekt(projektId),
  )

  meldeAn(
    KANAELE.config.setzeExportZiel,
    (nutzlast: unknown): Ergebnis<{ pfad: string }, 'ungueltige_eingabe'> => {
      if (!istObjekt(nutzlast)) return abgelehnt('setzeExportZiel erwartet ein Objekt { pfad }.')
      const pfad = nutzlast.pfad
      if (!istGefuellterText(pfad)) {
        return abgelehnt('setzeExportZiel braucht einen nicht leeren pfad.')
      }
      return { ok: true, wert: { pfad } }
    },
    // Kein Normalisieren, kein Aufloesen, keine Existenzpruefung des Ordners - der String
    // geht so an #28, wie er ankam (STOPP-Block des Issues).
    ({ pfad }) => setzeExportZiel(pfad),
  )

  meldeAn(
    KANAELE.config.setzeUIVoreinstellung,
    (nutzlast: unknown): Ergebnis<{ schlüssel: string; wert: unknown }, 'ungueltige_eingabe'> => {
      if (!istObjekt(nutzlast)) {
        return abgelehnt('setzeUIVoreinstellung erwartet ein Objekt { schlüssel, wert }.')
      }
      const schlüssel = nutzlast.schlüssel
      const wert = nutzlast.wert
      if (!istGefuellterText(schlüssel)) {
        return abgelehnt('setzeUIVoreinstellung braucht einen nicht leeren schlüssel.')
      }
      // GEPRUEFT WIRD NUR "vorhanden", NICHT DER TYP (Entscheidung des Issues): `wert` ist
      // laut #30 bewusst `unknown`; eine Typpruefung hier schriebe die Menge der erlaubten
      // Voreinstellungen an der falschen Stelle fest. `0`, `false`, `''` und `null` sind
      // GUELTIGE Werte - eine Wahrheitspruefung (`if (!nutzlast.wert)`) waere hier der
      // teure Fehler, weil sie genau die haeufigsten Oberflaechen-Werte verwuerfe.
      //
      // `undefined` ist der einzige mehrdeutige Fall: Es ueberlebt die Serialisierung nicht
      // zuverlaessig und kaeme im Main als "Feld fehlt" an - "Schluessel loeschen" und "Wert
      // setzen" waeren dann nicht mehr unterscheidbar. Der fehlende Schluessel wird von
      // derselben Zeile miterfasst; beides ist hier ununterscheidbar und wird gleich
      // behandelt.
      if (wert === undefined) {
        return abgelehnt('setzeUIVoreinstellung braucht einen wert (undefined ist nicht erlaubt).')
      }
      return { ok: true, wert: { schlüssel, wert } }
    },
    ({ schlüssel, wert }) => setzeUIVoreinstellung(schlüssel, wert),
  )
}
// registriert die vier unten aufgeführten Kanäle über den Wrapper aus #23 – je mit einer eigenen
// Validierungsfunktion. Kein Ereignis, kein Zustand, keine Fachlogik.
