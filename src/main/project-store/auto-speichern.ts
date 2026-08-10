// GENERIERT aus dem Signaturblock von Issue #47.
// [project-store] Auto-Speichern: Entprellung, Sofort-Flush, Ereignis bei Fehler
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Ergebnis, Fehlercode } from '../../shared/contracts/ergebnis'
import type { Project } from '../../shared/contracts/project'
export type AutoSpeichernEreignis =
  | { typ: "gespeichert" }
  | { typ: "fehler"; code: Fehlercode }
// KEINE Ergebnis<T>-Hülle: „Ereignisse (Main → Renderer) tragen ebenfalls keine Hülle" (TK 9.1.1)
// Kanalname (an ipc-gateway zu übergeben, M2/später): "project:autoSpeichernStatus"
// ("<modul>:<ereignis>", TK 9.1.1)

export function planeAutoSpeicherung(projekt: Project): void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #47."
  );
}
// merkt projekt als zu speichernde, aktuelle Version des aktiven Projekts vor; (re-)startet den
// 3-5s-Entprellungstimer; KEIN Rückgabewert, da reine Terminplanung nicht fehlschlagen kann

export async function sofortFlush(projekt: Project): Promise<Ergebnis<void>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #47."
  );
}
// bricht einen laufenden Entprellungstimer ab und schreibt projekt sofort via schreibeProjekt
// (#46); MUSS von der aufrufenden Stelle innerhalb von mitD1Lock (#32) ausgeführt werden;
// wird in VIER Fällen aufgerufen (TK 9.5.4):
//   (1) als ERSTER SCHRITT im render- bzw. export-Handler (#189/#190) - also NACH dem
//       Statuswechsel anstehend -> laeuft und BEVOR der Handler arbeitet; NICHT beim
//       Einreihen und NICHT im Torwaechter (#59): dessen Auswahl- und Statuswechsel-
//       Abschnitt ist bewusst synchron, ein await darin braeche die serielle Invariante;
//   (2) bei Projektwechsel (öffneProjekt, #34);
//   (3) beim Beenden der App (Aufrufer wartet das zurückgegebene Promise ab, bevor die App
//       tatsächlich schließt);
//   (4) am Ende jedes Auftrags, der D1 verändert hat (Import, Löschen - TK 9.4.5/9.4.6).
// DIESE Datei ruft sich nicht selbst - sie stellt sofortFlush bereit, die Ausloeser sitzen
// bei den vier genannten Stellen.

export function aufAutoSpeichernEreignis(
  hoerer: (ereignis: AutoSpeichernEreignis) => void,
): () => void {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #47."
  );
}
// registriert einen Listener für Statuswechsel; Rückgabewert ist die Abmelde-Funktion
