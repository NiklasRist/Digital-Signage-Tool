// Einstiegspunkt des Renderers - die Datei, auf die index.html zeigt.
//
// Die Datei gehoert zu #2 (dort wurde sie angelegt, weil "vite build" ohne
// Einstiegspunkt nichts erzeugen kann). #10 nennt in seinem Dateibereich nur App.tsx
// und shell/ - deshalb steht hier NUR das Aufhaengen, kein Aufbau und keine Logik.
//
// Warum das Aufhaengen trotzdem hier passieren MUSS: Ohne diese Zeilen waere App.tsx
// fertig gebaut und haette keinen Aufrufer - die Anwendung zeigte weiter den
// Platzhaltertext, obwohl die Shell existiert. Das ist die Lueckenklasse, die dieses
// Projekt schon mehrfach getroffen hat (IPC-Kanaele ohne Anmelder, Preload ohne
// Erbauer). Die Bereichsueberschreitung ist gemeldet.

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App";

const wurzel = document.getElementById("wurzel");
if (!wurzel) {
  // Kein stiller Fehlschlag: Fehlt der Anker, bliebe sonst ein weisses Fenster ohne
  // jeden Hinweis zurueck - und der Fehler liegt dann in index.html, nicht hier.
  throw new Error('Anker-Element "#wurzel" fehlt in index.html.');
}

createRoot(wurzel).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
