// Preload-Bridge (#4) - die EINZIGE Stelle, an der Renderer- und Main-Welt sich
// beruehren.
//
// Diese Datei baut absichtlich nur den generischen, TYPLOSEN Transport. Die fachlichen
// Kanalnamen und Typen kommen erst mit dem ipc-client (M1). Hier wird nichts geprueft,
// nichts umgeformt und nichts vereinfacht.
//
// WARUM DAS DURCHREICHEN OHNE UMFORMUNG DER GANZE PUNKT IST: Ueber diese Datei laeuft
// jede spaetere IPC-Operation aus M1 bis M7. Wuerde sie die Ergebnis-Huelle hier
// "aufraeumen" - etwa `{ ok: true, wert }` zu `wert` reduzieren und im Fehlerfall
// werfen -, ginge der `Fehlercode` (TK 9.1.1) verloren. An ihm haengt echtes
// Verhalten: `asset_referenziert` zeigt die betroffenen Listenelemente,
// `datei_zu_gross_fat32` erklaert exFAT, `kein_platz` und `ziel_gesperrt` brauchen
// verschiedene Hinweise. Bliebe davon nur eine geworfene Meldung uebrig, muessten
// spaetere Aufrufer Texte vergleichen - und Reparatur-Modus (FA-19), Wiederholen
// (FA-17) und der FAT32-Hinweis degradierten alle zu "irgendwas ist schiefgelaufen".
// Der Schaden entstuende an dieser einen Stelle und waere ueberall zu sehen.

import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";

/**
 * Ruft eine Main-Operation auf und liefert deren Antwort UNVERAENDERT zurueck.
 *
 * Kein try/catch: Wirft die Gegenseite, lehnt dieses Promise mit demselben Grund ab.
 * Ein Fangen und Umverpacken waere genau die Umformung, die diese Datei nicht machen
 * darf - die Fehlerbehandlung gehoert ins Gateway (M1), nicht in den Transport.
 *
 * `kanal` wird hier NICHT geprueft. Die Kanal-Namens-Registry entsteht erst in M1;
 * eine hier improvisierte Liste waere eine zweite Quelle der Wahrheit.
 */
function invoke(kanal: string, nutzlast?: unknown): Promise<unknown> {
  return ipcRenderer.invoke(kanal, nutzlast);
}

/**
 * Abonniert ein Ereignis vom Main und liefert die Funktion zum Abbestellen.
 *
 * Ereignisse tragen keine Huelle und keinen Endzustand (TK 9.1.1 Punkt 5) - die Daten
 * gehen deshalb ebenso unveraendert durch wie bei `invoke`.
 *
 * WICHTIG - das `IpcRendererEvent` wird BEWUSST NICHT durchgereicht: Es traegt unter
 * anderem `sender` und `ports`, also Griffe zurueck in die IPC-Maschinerie. Gaebe man
 * es dem Renderer, waere die contextBridge an genau dieser Stelle umgangen - der
 * Renderer koennte ueber das Ereignis-Objekt selbst senden, obwohl er kein rohes
 * `ipcRenderer` sehen darf. Der Hoerer bekommt daher nur die Nutzlast.
 *
 * Die Abbestell-Funktion entfernt GENAU DIESEN Hoerer (nicht alle Hoerer des Kanals):
 * Mehrere Module koennen dasselbe Ereignis abonnieren, und ein `removeAllListeners`
 * wuerde beim Aufraeumen des einen die Abonnements der anderen stillschweigend
 * mitloeschen.
 */
function on(ereignis: string, handler: (daten: unknown) => void): () => void {
  const hoerer = (_ereignisObjekt: IpcRendererEvent, daten: unknown): void => {
    handler(daten);
  };
  ipcRenderer.on(ereignis, hoerer);
  return () => {
    ipcRenderer.removeListener(ereignis, hoerer);
  };
}

// `exposeInMainWorld` ist der einzige Weg nach draussen. Mit contextIsolation (#3)
// liegt das Ergebnis in einer eigenen Welt: Der Renderer sieht `window.api`, aber
// weder `require` noch `ipcRenderer` noch das Modulsystem dieses Skripts.
contextBridge.exposeInMainWorld("api", { invoke, on });
