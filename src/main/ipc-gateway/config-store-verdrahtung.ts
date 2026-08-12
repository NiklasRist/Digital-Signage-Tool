// GENERIERT aus dem Signaturblock von Issue #77.
// [ipc-gateway] config-store-Kanäle verdrahten
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
// GERUEST-PRUEFSUMME: f1b8e56e5edc89a4

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { KANAELE } from '../../shared/contracts/kanaele'                     // #25
import { leseKonfig } from '../config-store/lese-konfig'                     // #26
import { leseMarke } from '../config-store/lese-marke'                       // #29
import { setzeAktivesProjekt } from '../config-store/setze-aktives-projekt'  // #27
import { setzeExportZiel } from '../config-store/setze-export-ziel'          // #28
import { setzeUIVoreinstellung } from '../config-store/setze-ui-voreinstellung' // #30
import { registriereHandler } from './registriere-handler'                   // #23

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
//   #29: leseMarke(): Promise<Ergebnis<Marke>>
//   #30: setzeUIVoreinstellung(schlüssel: string, wert: unknown): Promise<Ergebnis<void, ConfigFehlercode>>

/**
 * Die eine Stelle, an der aus `unknown` etwas Getipptes wird.
 *
 * WARUM ES SIE GIBT: `registriereHandler` (#23) reicht der Fachoperation genau das
 * herein, was der Validierer als `wert` zurueckgegeben hat - aber seine Signatur
 * schreibt `validierteNutzlast: unknown`, der Typ geht auf dem Weg also verloren. Ohne
 * diese Huelle stuende in JEDEM der fuenf Kanaele ein eigenes `as`; fuenf verstreute
 * Behauptungen kann niemand mehr gegen ihren Validierer halten, und die erste, die zum
 * falschen Validierer gehoert, faellt erst zur Laufzeit auf.
 *
 * Hier steht die Behauptung EINMAL, und `pruefe` und `rufe` sind ueber `W` aneinander
 * gebunden: Ein Validierer, der etwas anderes liefert als die Operation erwartet,
 * uebersetzt nicht. Die Behauptung selbst ist durch #23 gedeckt - der Wrapper reicht
 * `geprueft.wert` durch, nichts anderes.
 */
function meldeAn<W, T, F extends string>(
  kanal: string,
  pruefe: (nutzlast: unknown) => Ergebnis<W, 'ungueltige_eingabe'>,
  rufe: (geprueft: W) => Promise<Ergebnis<T, F>>,
): void {
  registriereHandler<T, F>(kanal, pruefe, (validierteNutzlast) => rufe(validierteNutzlast as W))
}

/** Die Fehlerseite der Form-Pruefung. Diese Datei vergibt sonst KEINEN Code. */
function abgelehnt(meldung: string): Ergebnis<never, 'ungueltige_eingabe'> {
  return { ok: false, fehler: { code: 'ungueltige_eingabe', meldung } }
}

/**
 * Traegt die Nutzlast ein Objekt mit benannten Feldern?
 *
 * Arrays werden AUSGESCHLOSSEN, obwohl `typeof [] === 'object'` gilt: Ein Array hat die
 * erwarteten Felder nie, kaeme aber ohne diese Zeile bis zur Feldpruefung durch und
 * scheiterte dort mit einer Meldung ueber ein fehlendes Feld statt ueber die falsche
 * Form. `null` faellt aus demselben Grund hier heraus - ein Feldzugriff darauf wuerfe.
 */
function istObjekt(nutzlast: unknown): nutzlast is Record<string, unknown> {
  return typeof nutzlast === 'object' && nutzlast !== null && !Array.isArray(nutzlast)
}

/**
 * "nicht leerer String" (Pruef-Tabelle des Issues).
 *
 * `trim` dient ALLEIN dem Erkennen von "leer"; der Wert wird unveraendert weitergereicht
 * (Verbot "keine Nutzlast-Reparatur"). Ohne den Trim kaeme ein Schluessel ' ' klaglos in
 * `config.json` an - dieselbe Lesart wie in #27 und #30, damit Gateway und Operation
 * nicht verschieden streng sind.
 */
function istGefuellterText(wert: unknown): wert is string {
  return typeof wert === 'string' && wert.trim() !== ''
}

/**
 * Validierer der beiden LESE-Kanaele: Es gibt nichts zu pruefen.
 *
 * Eine trotzdem uebergebene Nutzlast wird IGNORIERT, nicht abgelehnt (Pruef-Tabelle des
 * Issues). Grund: `leseKonfig`/`leseMarke` nehmen kein Argument, eine mitgeschickte
 * Nutzlast hat also keine Wirkung - und ein Fehler dafuer bruechte den Aufruf ohne Not,
 * wenn die Renderer-Seite ihre Aufrufe spaeter einmal vereinheitlicht und ueberall ein
 * leeres Objekt mitschickt.
 */
function ohneNutzlast(): Ergebnis<void, 'ungueltige_eingabe'> {
  return { ok: true, wert: undefined }
}

export function verdrahteConfigStoreIPC(): void {
  // Alle fuenf Namen kommen aus der Registry (#25); in dieser Datei steht kein einziger
  // Kanalname als Zeichenkette - auch nicht in den Fehlermeldungen. Ein Tippfehler waere
  // sonst erst zur Laufzeit sichtbar, und zwar als Aufruf, der ins Leere laeuft, nicht
  // als Uebersetzungsfehler.
  meldeAn(KANAELE.config.leseKonfig, ohneNutzlast, () => leseKonfig())

  meldeAn(
    KANAELE.config.setzeAktivesProjekt,
    // Beide Annotationen stehen ABSICHTLICH da: Sie legen `W` der Huelle fest, bevor der
    // zweite Rueckruf getippt wird - ohne sie muesste TypeScript `W` aus zwei zugleich
    // kontextabhaengigen Funktionen erraten.
    (nutzlast: unknown): Ergebnis<{ projektId: string }, 'ungueltige_eingabe'> => {
      if (!istObjekt(nutzlast)) return abgelehnt('setzeAktivesProjekt erwartet ein Objekt { projektId }.')
      // Erst in eine Konstante, dann pruefen: An einer Konstanten greift die Verengung
      // durch `istGefuellterText` verlaesslich, an einem Feld eines Record-Typs nicht
      // ueberall.
      const projektId = nutzlast.projektId
      if (!istGefuellterText(projektId)) {
        return abgelehnt('setzeAktivesProjekt braucht eine nicht leere projektId.')
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

  meldeAn(KANAELE.config.leseMarke, ohneNutzlast, () => leseMarke())

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
// registriert die fünf unten aufgeführten Kanäle über den Wrapper aus #23 – je mit einer eigenen
// Validierungsfunktion. Kein Ereignis, kein Zustand, keine Fachlogik.
