// GENERIERT aus dem Signaturblock von Issue #28.
// [config-store] setzeExportZiel implementieren
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
// GERUEST-PRUEFSUMME: d487114ace561396

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { aendereKonfig, type ConfigFehlercode } from './schreibe-config'   // #31

// Fremde Aufrufe - vollstaendige Signatur, damit hier nichts geraten wird:
//   #31: aendereKonfig<T>(
//          aenderung: (konfig: AppKonfig) => Ergebnis<{ konfig: AppKonfig; wert: T }, ConfigFehlercode>,
//        ): Promise<Ergebnis<T, ConfigFehlercode>>
//        // Lesen - Aendern - Schreiben als EINE ununterbrechbare Einheit; der Rueckruf ist
//        // SYNCHRON und darf nicht awaiten (schreibe-config.ts, woertlich: "Ohne `await` im
//        // Rueckruf kann zwischen dem Lesen und dem Schreiben nichts anderes laufen").
//   #265: interface AppKonfig { aktivesProjektId: string | null
//                               letztesExportZiel: string | null
//                               uiVoreinstellungen: Record<string, unknown> }

/**
 * Merkt sich den zuletzt gewaehlten Export-Zielpfad (TK 9.5.6).
 *
 * "Das gewaehlte Ziel merkt sich der `config-store` (`setzeExportZiel`, 9.5.6) und belegt den
 * Dialog beim naechsten Mal vor." (TK 9.6.5)
 *
 * KEINE EXISTENZ- ODER ERREICHBARKEITSPRUEFUNG. Der Stick kann beim naechsten Export laengst
 * abgezogen sein; geprueft wird deshalb dort, wo tatsaechlich geschrieben wird (TK 9.6.2,
 * `ziel_nicht_verfuegbar`). Eine Pruefung hier waere doppelt, zum Zeitpunkt der Nutzung
 * wertlos - und sie wuerde ein voruebergehend nicht eingestecktes Laufwerk aus dem Gedaechtnis
 * loeschen, also genau die Vorbelegung zerstoeren, um die es geht.
 *
 * WARUM `aendereKonfig` UND NICHT `leseKonfig` + `schreibeConfig`: Zwischen einem eigenen Lesen
 * und dem Zurueckschreiben kann `setzeAktivesProjekt` (#27) oder `setzeUIVoreinstellung` (#30)
 * dazwischenkommen. Beide schrieben dann ihren eigenen Stand ueber den bereits gelesenen, und
 * die zuerst gespeicherte Aenderung waere lautlos weg (Lost Update). `aendereKonfig` klammert
 * Lesen und Schreiben zu einer Einheit.
 */
export async function setzeExportZiel(pfad: string): Promise<Ergebnis<void, ConfigFehlercode>> {
  // VOR jeder Wirkung (DoD). `typeof` ist trotz des Typs noetig: Der Aufrufer sitzt hinter der
  // IPC-Grenze, dort kommt an, was der Renderer schickt - der Typ gilt beim Uebersetzen, nicht
  // zur Laufzeit.
  //
  // Nur-Leerzeichen zaehlt als leer: Ein Pfad aus Leerzeichen ist auf keinem der beiden
  // Zielsysteme ein Ziel, wuerde den Dialog aber beim naechsten Mal mit Unsinn vorbelegen.
  if (typeof pfad !== 'string' || pfad.trim() === '') {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: 'setzeExportZiel braucht einen nicht leeren Pfad.',
      },
    }
  }

  const geschrieben = await aendereKonfig<void>((konfig) => ({
    ok: true,
    wert: {
      // Der Spread erhaelt aktivesProjektId und uiVoreinstellungen. Ein Aufzaehlen der Felder
      // wuerde ein spaeter hinzugekommenes lautlos wegwerfen.
      //
      // GESPEICHERT WIRD DER PFAD UNVERAENDERT - kein trim, kein path.normalize, kein resolve.
      // Der config-store ist ein Gedaechtnis, kein Ausleger: Wer hier normalisiert, entscheidet
      // ueber Pfadsemantik an einer Stelle, die den Zielort nie zu Gesicht bekommt, und der
      // Nutzer bekaeme im Dialog einen anderen Pfad zurueck, als er gewaehlt hat.
      konfig: { ...konfig, letztesExportZiel: pfad },
      wert: undefined,
    },
  }))

  if (!geschrieben.ok) {
    // Der Fehler aus `aendereKonfig` reist UNVERAENDERT weiter - seit dem Nachtrag vom
    // 12.08.2026 traegt die Signatur `ConfigFehlercode`, `speicher_fehler` ist zuweisbar.
    return geschrieben
  }

  return { ok: true, wert: undefined }
}
