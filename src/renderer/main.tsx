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
import { ladeMarkenSchriften } from "./styles/schriften";

const wurzel = document.getElementById("wurzel");
if (!wurzel) {
  // Kein stiller Fehlschlag: Fehlt der Anker, bliebe sonst ein weisses Fenster ohne
  // jeden Hinweis zurueck - und der Fehler liegt dann in index.html, nicht hier.
  throw new Error('Anker-Element "#wurzel" fehlt in index.html.');
}

// Schriften VOR dem ersten Zeichnen laden (#8, TK 9.10.3).
//
// WARUM DIESER AUFRUF HIER STEHEN MUSS - teuer gelernt: Ohne ihn ist
// ladeMarkenSchriften() tote Materie. Vite buendelt nur, was erreichbar ist; die vier
// woff2-Dateien landeten dann WEDER in dist/renderer/assets/ NOCH im fertigen Paket.
// Beim Abnehmen von #8 ist genau das passiert und zunaechst unbemerkt geblieben, weil
// die Pruefsonde selbst den fehlenden Import mitbrachte - der Nachweis hat also seine
// eigene Voraussetzung geschaffen. Aufgefallen ist es erst beim Blick in die fertige
// app.asar (#7).
//
// Zustaendig fuer den Renderer-Bootstrap ist spaeter M7-65 (#260); wandert der Aufruf
// dorthin, muss er dort VOR dem ersten Canvas-Zeichnen stehen, nicht irgendwo.
//
// KORRIGIERT am 14.08.2026: Hier stand `.finally(...)`. Damit mountete React AUCH nach
// einem Ladefehler - der stille Fallback auf eine Systemschrift, den #8 ausdruecklich
// verbietet: "Ladefehler (z. B. Datei fehlt im Bundle) wirft eine Exception, die den
// App-Start sichtbar abbrechen laesst - KEIN stiller Fallback auf eine Systemschrift."
// Aufgefallen bei der Mutationsprobe zu #8 (Playfair durch Muell ersetzt): Die App lief
// weiter, nur das Aussehen war falsch. Genau die Fehlerklasse - kein Absturz, nur
// falsches Aussehen -, gegen die dieses Issue existiert.
ladeMarkenSchriften().then(
  () => {
    createRoot(wurzel).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  },
  (grund: unknown) => {
    // BEWUSST OHNE REACT: Wer hier landet, hat einen Fehler im Buendel selbst. Ein
    // Fehlerbild ueber die App-Shell zu zeichnen hiesse, auf denselben Bauteilen
    // aufzusetzen, deren Grundlage gerade fehlt. Reines DOM haelt immer.
    const text = grund instanceof Error ? grund.message : String(grund);
    wurzel.textContent =
      "Die Marken-Schriften konnten nicht geladen werden. " +
      "Das Programm startet nicht, weil es sonst mit falschen Schriften zeichnen " +
      "und ein fehlerhaftes Video erzeugen wuerde. Bitte die Installation erneuern. " +
      `(Technischer Grund: ${text})`;
    // Zusaetzlich ins Protokoll, damit der Grund auch dann auffindbar ist, wenn das
    // Fenster schon geschlossen wurde.
    console.error("Start abgebrochen - Marken-Schriften nicht ladbar:", grund);
  },
);
