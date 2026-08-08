import { execFile } from "node:child_process";

import ffmpegStatic from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";

// Die Pfade zu den beiden mitgelieferten Binaries (#6).
//
// TK 3 liefert BEIDE mit: "gebuendeltes `ffmpeg` und `ffprobe` (`ffmpeg-static` +
// `ffprobe-static` + `fluent-ffmpeg`)". Das sind zwei getrennte Pakete, und das ist
// kein Versehen: `ffmpeg-static` enthaelt KEIN ffprobe. Der Medien-Import liest damit
// Masse und Dauer (TK 9.4.5, Schritt 2) - ohne ffprobe scheitert JEDER Import beim
// Kunden, waehrend es beim Entwickeln funktioniert, weil dort oft zufaellig ein
// systemweites ffprobe im Pfad liegt.

/**
 * Ersetzt `app.asar` durch `app.asar.unpacked` im uebergebenen Pfad.
 *
 * WARUM DAS NOETIG IST: Im gepackten Zustand liegt der Code in einem Archiv
 * (`app.asar`). Node kann daraus lesen, aber das Betriebssystem kann eine Datei
 * DARIN NICHT AUSFUEHREN - ein Binary muss ausgepackt daneben liegen. Genau dafuer
 * traegt die electron-builder-Konfiguration einen `asarUnpack`-Eintrag fuer beide
 * Pakete (#7); die Pakete melden aber weiterhin den Pfad INS Archiv, weil sie von
 * ihrem eigenen Dateiort ausgehen. Diese Ersetzung biegt ihn auf den ausgepackten
 * Zwilling um.
 *
 * Im Dev-Modus kommt `app.asar` im Pfad nicht vor - dann bleibt er unveraendert.
 */
function aufEntpacktenPfad(pfad: string): string {
  return pfad.replace(`app.asar${pfadTrenner(pfad)}`, `app.asar.unpacked${pfadTrenner(pfad)}`);
}

/** Der Trenner, den der uebergebene Pfad tatsaechlich benutzt. */
function pfadTrenner(pfad: string): string {
  return pfad.includes("\\") ? "\\" : "/";
}

/**
 * Absoluter Pfad zum ausfuehrbaren ffmpeg-Binary.
 *
 * Dev: node_modules/ffmpeg-static. Gepackt: der Pfad aus app.asar.unpacked.
 */
export function ermittleFfmpegPfad(): string {
  // Die Typen des Pakets geben `string | null` an (null auf nicht unterstuetzten
  // Plattformen). Ein leerer Pfad waere ein stiller Fehlschlag - der Selbsttest
  // unten schlaegt darauf an und der Start bricht mit Meldung ab.
  return ffmpegStatic ? aufEntpacktenPfad(ffmpegStatic) : "";
}

/**
 * Absoluter Pfad zum ausfuehrbaren ffprobe-Binary.
 *
 * Eigenes Paket, denn `ffmpeg-static` enthaelt kein ffprobe.
 */
export function ermittleFfprobePfad(): string {
  return aufEntpacktenPfad(ffprobeStatic.path);
}

/**
 * Fuehrt `<pfad> -version` aus und meldet, ob das Binary benutzbar ist.
 *
 * WARUM execFile UND KEIN exec: `exec` uebergibt eine ZEICHENKETTE an die
 * Kommandozeile des Systems. Enthaelt der Pfad ein Leerzeichen - und das tut er
 * regelmaessig, etwa unter "C:\Program Files\..." oder in einem Nutzerordner mit
 * Vor- und Nachname -, zerfaellt der Aufruf in mehrere Wortteile und scheitert mit
 * einer Meldung, die auf alles Moegliche hindeutet, nur nicht auf das Leerzeichen.
 * `execFile` uebergibt Programm und Argumente GETRENNT; es gibt keine Kommandozeile,
 * die etwas zerlegen koennte, und damit auch keinen Weg, ueber einen praeparierten
 * Pfad fremde Befehle einzuschleusen.
 */
async function pruefeBinary(pfad: string): Promise<boolean> {
  if (!pfad) {
    return false;
  }
  return new Promise((fertig) => {
    execFile(pfad, ["-version"], (fehler, ausgabe) => {
      // Nicht nur der Rueckgabewert zaehlt, sondern auch eine erkennbare
      // Versionsausgabe: Ein beliebiges anderes Programm an dieser Stelle koennte
      // ebenfalls mit 0 enden. Beide Binaries beginnen ihre Ausgabe mit ihrem Namen.
      fertig(!fehler && /ff(mpeg|probe) version/i.test(ausgabe));
    });
  });
}

/** Selbsttest fuer ffmpeg. Wird beim App-Start aufgerufen (#3). */
export async function pruefeFfmpegVerfuegbar(pfad: string): Promise<boolean> {
  return pruefeBinary(pfad);
}

/** Selbsttest fuer ffprobe (`ffprobe -version`). Wird beim App-Start aufgerufen (#3). */
export async function pruefeFfprobeVerfuegbar(pfad: string): Promise<boolean> {
  return pruefeBinary(pfad);
}
