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
  const exe = app.getPath("exe");
  if (process.platform === "darwin") {
    // `path.posix` statt `path`: `node:path` rechnet nach den Regeln des LAUFENDEN
    // Systems. Auf macOS ist das ohnehin POSIX - zur Laufzeit aendert die Angabe also
    // nichts. Sie macht diesen Zweig aber von der Wirtsplattform unabhaengig und damit
    // ueberhaupt erst pruefbar: Mit dem plattformabhaengigen `path` rechnete derselbe
    // Testfall unter Windows "C:\Volumes\Stick" statt "/Volumes/Stick" heraus.
    return path.posix.resolve(path.posix.dirname(exe), "..", "..", "..");
  }
  return path.dirname(exe);
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
