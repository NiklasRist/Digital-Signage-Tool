// Platzhalter fuer den geteilten Renderer-Bereich "renderer/gemeinsam" (Issue #1).
// Die echte Implementierung folgt aus dem jeweiligen späteren Issue.
//
// Dies ist KEIN Modul im Sinne des HLD-Modulschnitts (TK 9), sondern ein Ort ohne
// Eigentuemer: Jedes Renderer-Modul darf direkt daraus importieren. Hier liegt, was
// mehrere Module benutzen und keines besitzt - heute das Register der offenen
// <video>-Handles, das vor dem Loeschen eines Mediums freigegeben werden muss (TK 9.4.6).
// NICHT nach src/shared/: dort laege Modul-Zustand, von dem der Main-Prozess beim
// Import eine zweite, eigene Instanz bekaeme.
//
// Diese Datei existiert aus zwei Gruenden und darf deshalb nicht geloescht werden,
// solange der Ordner sonst leer ist: Git verfolgt keine leeren Ordner, und tsc
// braucht je Konfiguration mindestens eine Eingabedatei (sonst TS18003).
export {};
