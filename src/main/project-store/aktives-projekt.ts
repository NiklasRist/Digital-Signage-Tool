// GENERIERT aus dem Signaturblock von Issue #192.
// [project-store] Das aktive Projekt main-intern herausgeben
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

import type { Project } from '../../shared/contracts/project'

export function holeAktivesProjekt(): Project | null {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #192."
  );
}
// Liefert das aktuell geöffnete Projekt als LEBENDEN Stand (dieselbe Objektreferenz, die die
// Instant-Operationen mutieren) – KEINE Kopie. Begründung unten, Abschnitt „Lebender Stand".
// Ist kein Projekt geöffnet: null.
// SYNCHRON (kein Promise). NIMMT KEIN LOCK. WIRFT NIE.
// MAIN-INTERN: kein IPC-Kanal, kein Eintrag in kanaele.ts, für den Renderer unerreichbar.
