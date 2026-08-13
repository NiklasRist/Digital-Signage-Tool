import { describe, expect, it } from "vitest";

import { FORMAT_WHITELIST } from "../../src/shared/contracts/asset";
import { pruefeFormat } from "../../src/main/media-service/format-pruefung";

// Unit-Test zu #80 (Format-Whitelist anwenden).
//
// Kein Mock und kein Aufraeumen: Die Funktion fasst weder Dateisystem noch Electron an.
// Die Eingaben sind hier absichtlich als Literale getippt - in der QUELLDATEI darf keine
// Endung stehen (sie kommt dort aus FORMAT_WHITELIST), im Test SIND die Endungen die
// Eingabe und muessen unabhaengig von der Konstanten dastehen. Ein Test, der seine
// Erwartung aus derselben Konstanten zieht wie der Prueflling, prueft nichts.
// Ausnahme mit Absicht: der letzte Block - er prueft die KOPPLUNG an die Whitelist.

function erwarteAbweisung(dateiname: string): string {
  const ergebnis = pruefeFormat(dateiname);
  expect(ergebnis.ok).toBe(false);
  if (ergebnis.ok) throw new Error("unerreichbar - oben bereits geprueft");
  expect(ergebnis.fehler.code).toBe("format_nicht_unterstuetzt");
  return ergebnis.fehler.meldung;
}

describe("erkannte Formate", () => {
  it.each([
    ["FILM.MP4", "video", "mp4"],
    ["Foto.JPEG", "bild", "jpeg"],
    ["a.PNG", "bild", "png"],
    ["a.webp", "bild", "webp"],
    ["a.jpg", "bild", "jpg"],
    ["sommer.aktion.final.png", "bild", "png"],
  ])("nimmt %s als %s mit Endung %s an", (dateiname, typ, endung) => {
    expect(pruefeFormat(dateiname)).toEqual({ ok: true, wert: { typ, endung } });
  });

  it.each([
    ["Windows-Pfad", "C:\\Videos\\sommer.aktion.final.mp4"],
    ["POSIX-Pfad", "/Users/nr/Videos/sommer.aktion.final.mp4"],
    ["Ordner mit Punkt im Namen", "C:\\Kampagne.2026\\clip.mp4"],
  ])("nimmt beim %s das letzte Segment und dessen letzten Punkt", (_fall, pfad) => {
    expect(pruefeFormat(pfad)).toEqual({ ok: true, wert: { typ: "video", endung: "mp4" } });
  });

  // Doppelte Endung: Es zaehlt der LETZTE Punkt. Beide Richtungen stehen hier, weil ein
  // Umbenennen von .txt auf .mp4 genau der Fall ist, den die Endungspruefung bewusst
  // nicht erkennt (Inhalt wird nicht geprueft) - und der umgekehrte Fall genauso
  // bewusst durchfaellt.
  it("wertet bei doppelter Endung die letzte", () => {
    expect(pruefeFormat("film.txt.mp4")).toEqual({
      ok: true,
      wert: { typ: "video", endung: "mp4" },
    });
    erwarteAbweisung("film.mp4.txt");
  });
});

describe("abgewiesene Eingaben", () => {
  it.each([
    ["ausgeschlossenes Videoformat", "film.mkv"],
    ["ausgeschlossenes Videoformat", "clip.mov"],
    ["ausgeschlossenes Videoformat", "alt.avi"],
    ["nicht abspielbares Bildformat", "bild.gif"],
    ["Fremdformat", "text.txt"],
    ["leere Eingabe", ""],
    ["Punkt nur an erster Stelle", ".gitkeep"],
    ["leere Endung", "film."],
    ["Datei ohne Endung", "C:\\Videos\\clip"],
    ["Punkt im Ordnernamen, Datei ohne Endung", "C:\\Kampagne.2026\\clip"],
    ["nur Pfadtrenner", "\\"],
    ["nur Pfadtrenner", "/"],
    ["Pfad, der auf einen Trenner endet", "C:\\Kampagne.2026\\"],
    ["Endung ohne Dateinamen", ".mp4"],
  ])("weist %s ab (%s)", (_fall, dateiname) => {
    erwarteAbweisung(dateiname);
  });

  it("nennt in der Meldung die abgelehnte Endung und den Hinweis aufs Konvertieren", () => {
    const meldung = erwarteAbweisung("film.mkv");
    expect(meldung).toContain("mkv");
    expect(meldung.toLowerCase()).toContain("konvertier");
  });

  it("nennt bei fehlender Endung den gelieferten Namen", () => {
    expect(erwarteAbweisung("C:\\Videos\\clip")).toContain("C:\\Videos\\clip");
  });
});

describe("Vertrag der Funktion", () => {
  // Der Aufrufer ist eine Auftrags-Ausfuehrung: Eine Ausnahme statt eines Fehlercodes
  // liesse den Auftrag ohne brauchbare Diagnose scheitern (TK 9.1.1). Deshalb steht hier
  // absichtlich auch, was kein Mensch je eingibt.
  it.each([
    ["leere Eingabe", ""],
    ["nur Punkte", "..."],
    ["Steuerzeichen", `film${String.fromCharCode(1)}.mkv`],
    ["Zeilenumbruch", "film\n.mkv"],
    ["Sonderzeichen", "?*|<>.mkv"],
    ["sehr langer Name", `${"a".repeat(5000)}.mkv`],
    ["Emoji", "🎬.mkv"],
  ])("wirft bei %s nicht", (_fall, dateiname) => {
    expect(() => pruefeFormat(dateiname)).not.toThrow();
  });

  it("liefert bei zweimal demselben Eingang zweimal dasselbe Ergebnis", () => {
    expect(pruefeFormat("FILM.MP4")).toEqual(pruefeFormat("FILM.MP4"));
    expect(pruefeFormat("film.mkv")).toEqual(pruefeFormat("film.mkv"));
  });
});

// Die Kopplung an die EINE Quelle: Kommt der Whitelist (#13) ein Format hinzu, ohne dass
// die Pruefung es annimmt, schlaegt dieser Block fehl - er zieht seine Faelle aus der
// Konstanten statt aus einer zweiten Liste. Er ersetzt die getippten Faelle oben nicht,
// sondern sichert die Verbindung; und er belegt zugleich, dass die gelieferte Endung
// woertlich der Whitelist-Schreibweise entspricht.
describe("Kopplung an FORMAT_WHITELIST", () => {
  it.each(FORMAT_WHITELIST.video.map((endung) => [endung]))(
    "nimmt die Video-Endung %s der Whitelist an",
    (endung) => {
      expect(pruefeFormat(`datei.${endung.toUpperCase()}`)).toEqual({
        ok: true,
        wert: { typ: "video", endung },
      });
    },
  );

  it.each(FORMAT_WHITELIST.bild.map((endung) => [endung]))(
    "nimmt die Bild-Endung %s der Whitelist an",
    (endung) => {
      expect(pruefeFormat(`datei.${endung.toUpperCase()}`)).toEqual({
        ok: true,
        wert: { typ: "bild", endung },
      });
    },
  );
});
