// Die Nutzlast-Pruefer der IPC-Grenze (#332).
//
// UMZUG, KEINE NEUENTWICKLUNG: Die vier Funktionen lagen bis zum 14.08.2026 als Kopien
// in vier Verdrahtungsdateien (#71, #76, #77, #93). Die Ruempfe sind woertlich aus
// `config-store-verdrahtung.ts` (#77) uebernommen - der im Issue als massgeblich
// benannten Fassung; die Fassung aus #71 unterschied sich allein im Parameternamen von
// `istObjekt`. Verhalten und Meldungen sind unveraendert.
//
// WARUM SIE HIER LIEGEN UND NICHT IN `src/shared/`: Sie pruefen, was AUS dem Renderer
// kommt. Ein geteilter Ort luede dazu ein, sie auch im Renderer zu benutzen, und
// verwischte genau die Grenze, die zaehlt (TK 2, TK 9.1). Geteilt ist allein `Ergebnis`.
//
// WARUM DER ORT TRAGEND IST: Ein Pruefer, der an einem Kanal strenger ist als am
// naechsten, macht die Sicherheitsgrenze wertlos. Solange die Kopien byte-identisch
// waren, war das kein Fehler - es wurde einer, sobald jemand eine davon verschaerft und
// die uebrigen lax bleiben, denn jede Verdrahtungsdatei prueft ausschliesslich ihre
// eigene Kopie. Kuenftige Verdrahtungen (#109, #191, M7-Nachtraege, M8) importieren
// hierher, statt erneut zu kopieren.
//
// ERGAENZUNGEN KOMMEN HIERHER, nicht zurueck in die Verdrahtungsdateien - und eine
// VERSCHAERFUNG (etwa `istObjekt` gegen Prototyp-Verschmutzung) braucht ein eigenes
// Issue mit eigener Abnahme, weil sie Kanaele treffen kann, deren Tests in ganz anderen
// Dateien liegen.

import type { Ergebnis } from '../../shared/contracts/ergebnis'

/**
 * Traegt die Nutzlast ein Objekt mit benannten Feldern?
 *
 * Arrays werden AUSGESCHLOSSEN, obwohl `typeof [] === 'object'` gilt: Ein Array hat die
 * erwarteten Felder nie, kaeme aber ohne diese Zeile bis zur Feldpruefung durch und
 * scheiterte dort mit einer Meldung ueber ein fehlendes Feld statt ueber die falsche
 * Form. `null` faellt aus demselben Grund hier heraus - ein Feldzugriff darauf wuerfe.
 */
export function istObjekt(nutzlast: unknown): nutzlast is Record<string, unknown> {
  return typeof nutzlast === 'object' && nutzlast !== null && !Array.isArray(nutzlast)
}

/**
 * "nicht leerer String".
 *
 * `trim` dient ALLEIN dem Erkennen von "leer"; der Wert wird unveraendert weitergereicht
 * (Verbot "keine Nutzlast-Reparatur"). Getrimmt bekaeme die Fachoperation eine ID oder
 * einen Schluessel, den der Renderer nie gesendet hat - ein Fehler in der Oberflaeche
 * waere still geheilt statt sichtbar.
 */
export function istGefuellterText(wert: unknown): wert is string {
  return typeof wert === 'string' && wert.trim() !== ''
}

/** Die Fehlerseite der Form-Pruefung. Der einzige Code, den diese Pruefer vergeben. */
export function abgelehnt(meldung: string): Ergebnis<never, 'ungueltige_eingabe'> {
  return { ok: false, fehler: { code: 'ungueltige_eingabe', meldung } }
}

/**
 * Validierer der Kanaele ohne Nutzlast: Es gibt nichts zu pruefen.
 *
 * Eine trotzdem uebergebene Nutzlast wird IGNORIERT, nicht abgelehnt. Grund: Die
 * zugehoerigen Operationen nehmen kein Argument, eine mitgeschickte Nutzlast hat also
 * keine Wirkung - und ein Fehler dafuer bruechte den Aufruf ohne Not, wenn die
 * Renderer-Seite ihre Aufrufe spaeter einmal vereinheitlicht und ueberall ein leeres
 * Objekt mitschickt. Dazu schickt die uebliche Aufrufform `invoke(kanal)` ohnehin
 * `undefined` mit.
 *
 * OHNE PARAMETER, nicht mit einem ungenutzten: Was nicht angenommen wird, kann auch
 * nicht versehentlich weitergereicht werden. Zur Laufzeit nimmt die Funktion jedes
 * Argument entgegen und ignoriert es.
 */
export function ohneNutzlast(): { ok: true; wert: undefined } {
  return { ok: true, wert: undefined }
}
