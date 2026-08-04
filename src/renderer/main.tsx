// Einstiegspunkt des Renderers - die Datei, auf die index.html zeigt.
//
// Platzhalter (Issue #2, Build-Einrichtung). #10 ersetzt den Inhalt: dort wird
// React an #wurzel gehaengt und App.tsx gerendert. Die Datei existiert hier schon,
// weil "vite build" ohne Einstiegspunkt nichts erzeugen kann - und #10 nennt in
// seiner Datei-Liste nur App.tsx und shell/.

const wurzel = document.getElementById("wurzel");
if (wurzel) {
  wurzel.textContent = "Grundgeruest steht. UI folgt aus #10.";
}

export {};
