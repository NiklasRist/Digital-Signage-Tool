// [contracts] ID-Schema (UUID-Generator) definieren
//
// Die EINE Stelle, an der IDs entstehen (TK 9.11.4).
//
// Der STOPP-Punkt des Issues ("genuegt crypto.randomUUID, oder braucht es die
// Bibliothek uuid?") wurde GEPRUEFT statt angenommen: Main laeuft auf Node 22
// (electron ^43), wo `globalThis.crypto` gesetzt ist; im Renderer liefert Chromium
// `randomUUID` nur im secure context, und beide Ladewege sind das - `localhost` im
// Dev, `file://` im Bau. Wuerde die Oberflaeche je ueber unsicheres http von einem
// fremden Host geladen, waere die Funktion dort `undefined`; das waere eine
// Entscheidung fuers Issue, kein stiller Ersatz.
//
// KEIN Rueckfall auf Math.random: Das waere genau das zweite ID-Schema, das dieses
// Issue verhindern soll - und es fiele nicht auf, weil die IDs gleich aussaehen.
// Fehlt `randomUUID`, soll die Anwendung scheitern. Deshalb faengt hier auch nichts
// ab; der Vertrag sagt, der Aufruf kann nicht regulaer fehlschlagen.
//
// `globalThis.` ausgeschrieben, weil esbuild den Main zu EINER CJS-Datei buendelt,
// in der andere Module `node:crypto` unter eigenem Namen importieren.
export function erzeugeId(): string {
  return globalThis.crypto.randomUUID();
}
// liefert eine UUID v4 (z. B. via crypto.randomUUID() – in Electron Main UND Renderer verfügbar)
