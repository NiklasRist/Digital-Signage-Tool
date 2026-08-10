// GENERIERT aus dem Signaturblock von Issue #192.
// [project-store] Das aktive Projekt main-intern herausgeben
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
// GERUEST-PRUEFSUMME: abaae709cb5906fd

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
