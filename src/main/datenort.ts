import path from "node:path";

import { app } from "electron";

// Der eine Datenort der Anwendung (#5).
//
// Von diesem Pfad haengt JEDER persistente Speicher ab (TK 6):
//   <Datenort>/config.json                  D3
//   <Datenort>/vorlagen.json                V1
//   <Datenort>/protokoll.json               Q3
//   <Datenort>/warteschlangen-journal.json  Q4
//   <Datenort>/projects/<id>/...            D1, D2, Ausgaben, Q2
//
// ENTSCHIEDEN (Produktentscheidung, 08.08.2026): Die Daten liegen NEBEN DER PORTABLEN
// EXE, nicht in userData. Damit wandert der gesamte Bestand mit dem Datentraeger, und
// das Werkzeug ist auf jedem Laptop dasselbe. Ist der Ort nicht beschreibbar, startet
// die App NICHT, sondern nennt Ordner und Ursache - sie weicht NICHT still nach
// userData aus. Begruendung: Daten, die woanders landen als erwartet, sind aus
// Nutzersicht verloren, und derselbe Stick haette an zwei Rechnern zwei verschiedene
// Bestaende, ohne dass es jemand merkt.
//
// An denselben Ort ist die Einzel-Instanz-Sperre gebunden: "Die Sperre muss an den
// Datenort gebunden sein (den App-Ordner mit `projects/`), nicht an den Programmpfad.
// Sonst koennten zwei Kopien der portablen EXE, die auf dieselben Daten zeigen, beide
// starten." (TK 9.5.4)

/**
 * Liefert den absoluten Pfad zum App-Datenordner.
 *
 * REINE PFAD-BERECHNUNG, kein Dateizugriff: Die Funktion legt den Ordner nicht an
 * (das tun die Store-Module beim ersten Schreiben) und prueft auch nicht, ob er
 * beschreibbar ist (s. Vermerk am Ende dieser Datei).
 */
export function ermittleDatenOrt(): string {
  // Entwicklungslauf: das Projektverzeichnis. Stabil und reproduzierbar, weil npm die
  // Skripte immer aus dem Wurzelverzeichnis startet - und .gitignore haelt genau die
  // Eintraege aus TK 6 dort schon frei (/projects/, /config.json, /vorlagen.json,
  // /protokoll.json, /warteschlangen-journal.json).
  if (!app.isPackaged) {
    return process.cwd();
  }

  // Gepackt und portabel (Windows): die Umgebungsvariable, die electron-builder genau
  // dafuer setzt.
  //
  // WARUM NICHT process.execPath ODER process.resourcesPath - das ist die teuerste
  // Falle dieses Issues: Das Windows-"Portable"-Target von electron-builder ist
  // NSIS-basiert und ENTPACKT DIE ANWENDUNG BEI JEDEM START in ein temporaeres
  // Verzeichnis. Beide Pfade zeigen dann in dieses FLUECHTIGE Temp-Verzeichnis - nicht
  // dorthin, wo der Nutzer die EXE abgelegt hat. Die Anwendung liefe scheinbar normal,
  // und beim naechsten Start waeren alle Projekte weg, weil Windows den Temp-Ordner
  // aufgeraeumt hat. Der Fehler faellt beim Entwickeln NICHT auf, weil dort
  // `app.isPackaged` falsch ist und dieser Zweig gar nicht laeuft.
  const portableOrdner = process.env["PORTABLE_EXECUTABLE_DIR"];
  if (portableOrdner) {
    return portableOrdner;
  }

  // Gepackt, aber ohne PORTABLE_EXECUTABLE_DIR. Das ist der macOS-Fall (dort gibt es
  // kein Portable-Target, die App ist ein .app-Bundle) und ebenso ein Windows-Build
  // mit einem anderen Ziel als `portable`.
  //
  // ACHTUNG - UNGEPRUEFT: Diese Ableitung ist hier nicht getestet worden; es stand
  // kein macOS-Rechner zur Verfuegung. Sie ist als Befund gemeldet und gehoert beim
  // ersten echten macOS-Build nachgemessen.
  //
  // Auf macOS liegt die ausfuehrbare Datei drei Ebenen tief im Bundle
  // (<Name>.app/Contents/MacOS/<Name>). "Neben der App" heisst deshalb: vier Ebenen
  // hoch, also der Ordner, der das .app-Bundle enthaelt.
  //
  // BEFUND vom 04.10.2026 (Vorbefund-Testfehler, jetzt behoben): Die Zweigwahl stand
  // auf `process.platform === "darwin"` - sie richtete sich nach dem HOST, nicht nach
  // dem Pfad. Auf einem macOS-Entwicklungsrechner nahm ein Windows-Pfad den
  // Posix-Zweig: `path.dirname` kennt dort keine Backslashes, "D:\Programme\...\App.exe"
  // wurde zu "." und das Ergebnis lag bei "/Users" (gemessen). Die Wahl ueber die
  // Plattform des Hosts war also der Fehler selbst. Sie steht jetzt auf der FORM des
  // Pfads: Ein macOS-Pfad faengt mit "/" an, ein Windows-Pfad auf ein Laufwerk. Der
  // macOS-Fall bleibt funktional unveraendert (gepackt laufen echte exe-Pfade je
  // Plattform ihrer Form nach richtig); nur der Windows-Fallback rechnet jetzt immer
  // mit win32-Regeln.
  const exe = app.getPath("exe");
  if (exe.startsWith("/")) {
    // `path.posix` statt `path`: dieselbe Begruendung wie im Testfall dokumentiert -
    // der Zweig soll unabhaengig vom WIRT rechnen.
    return path.posix.resolve(path.posix.dirname(exe), "..", "..", "..");
  }
  // Windows: `path` rechnet nach den Regeln des LAUFENDEN Systems - und das kann hier
  // der Mac oder Linux sein, wo Backslashes KEINE Trennzeichen sind. Ohne die
  // Win32-Regeln fuer diesen Windows-Pfad-Fallback lieferte path.dirname auf einem
  // macOS-Testlauf "." statt "D:\Programme\Signage" (gemessen, s. BEFUND oben).
  return path.win32.dirname(exe);
}

// NICHT HIER, UND VON KEINEM ISSUE ABGEDECKT - gemeldet:
//
// Die Entscheidung "ist der Datenort nicht beschreibbar, startet die App nicht"
// braucht eine Schreibprobe und einen Abbruch mit Meldung. Beides ist ein
// DATEIZUGRIFF, und der Vertrag dieses Issues sagt ausdruecklich "reine
// Pfad-Berechnung, kein I/O" - die Pruefung darf also nicht in diese Funktion.
//
// Ein Zuhause hat sie damit noch nicht: Weder #3 (Bootstrap) noch ein M1-Issue nennt
// sie. Solange das offen ist, liefert ermittleDatenOrt() den Pfad, und ein
// schreibgeschuetzter Ort faellt erst beim ersten Schreibversuch eines Store-Moduls
// auf - also spaeter und mit einer Meldung, die den eigentlichen Grund nicht nennt.
