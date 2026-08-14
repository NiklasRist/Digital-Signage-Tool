// Tests zu #167 - der framegenaue Video-Ausschnitt (TK 9.2.6, 9.2.4, 9.2.8).
//
// WAS HIER PRUEFBAR IST: alles bis auf zwei Zusagen. `baueVideoAusschnittArgumente`
// ist eine REINE Funktion; sie startet keinen Prozess, liest keine Datei und kennt
// keine Mediendauer. Der Rest sind Zeichenketten-Vergleiche auf dem
// zurueckgegebenen Array.
//
// NICHT hier, sondern in tests/integration/video-ausschnitt-echt.spec.ts (#11):
//   1. ob der Lauf VON SELBST endet (die stille Tonquelle ist endlos), und
//   2. ob der Schnitt tatsaechlich AM GEWUENSCHTEN BILD beginnt.
// Beides haengt am echten Binary und nicht an der Zeichenkette. Die zweite Frage
// ist die wichtigere: Ein Clip mit richtiger Laenge und Inhalt ab Bild 0 ist genau
// der Fehler, gegen den die Stellung von `-ss` hier absichert - und er ist NUR am
// Bildinhalt zu sehen. Ein Test, der die Dauer misst, kann ihn grundsaetzlich
// nicht finden.
//
// DIE TEUERSTEN FEHLER DIESER DATEI SIND POSITIONELL, nicht vertraglich: Eine
// Option am falschen Platz sieht typrichtig aus und laeuft fehlerfrei durch.
// Deshalb pruefen die Tests unten PLAETZE und WERTE, nicht blosses Vorhandensein.
import { readFileSync } from "node:fs";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { RENDER_PROFILE } from "../../src/shared/contracts/render-profile";

import type { VideoAusschnittAuftrag } from "../../src/main/ffmpeg-adapter/video-ausschnitt";
import type { Ergebnis } from "../../src/shared/contracts/ergebnis";
import type { RenderProfile } from "../../src/shared/contracts/render-profile";

// Die Attrappen fuer #161 und #162.
//
// Sie sind SPIONE, keine Ersatzteile: In der Voreinstellung rufen sie die ECHTEN
// Funktionen. Damit ist das geprueffte Array das, das spaeter wirklich an ffmpeg
// geht - und zugleich sichtbar, MIT WELCHEM Eingangs-Index `baueTonspurMapping`
// gerufen wurde (die Zahl, an der die Uniformitaet der Tonspur haengt).
//
// Nur der Vollstaendigkeits- und Stellungs-Test schaltet sie auf erkennbare
// Platzhalter um. So laesst sich pruefen, dass die Fragmente UNVERAENDERT und an
// der vorgegebenen Stelle stehen, ohne dass echte Flags den Vergleich verrauschen.
const attrappe = vi.hoisted(() => ({
  baueVideoKodierArgumente: vi.fn<(profil: RenderProfile) => string[]>(),
  baueStilleTonspurEingang: vi.fn<(profil: RenderProfile) => string[]>(),
  baueTonspurMapping: vi.fn<(audioEingangIndex: number) => string[]>(),
  baueTonspurKodierArgumente: vi.fn<(profil: RenderProfile) => string[]>(),
}));

vi.mock("../../src/main/ffmpeg-adapter/encoder-argumente", () => ({
  baueVideoKodierArgumente: attrappe.baueVideoKodierArgumente,
}));

vi.mock("../../src/main/ffmpeg-adapter/tonspur", () => ({
  baueStilleTonspurEingang: attrappe.baueStilleTonspurEingang,
  baueTonspurMapping: attrappe.baueTonspurMapping,
  baueTonspurKodierArgumente: attrappe.baueTonspurKodierArgumente,
}));

const echtEncoder = await vi.importActual<
  typeof import("../../src/main/ffmpeg-adapter/encoder-argumente")
>("../../src/main/ffmpeg-adapter/encoder-argumente");
const echtTonspur = await vi.importActual<typeof import("../../src/main/ffmpeg-adapter/tonspur")>(
  "../../src/main/ffmpeg-adapter/tonspur",
);

const { baueVideoAusschnittArgumente } = await import(
  "../../src/main/ffmpeg-adapter/video-ausschnitt"
);

const QUELLE = readFileSync(
  new URL("../../src/main/ffmpeg-adapter/video-ausschnitt.ts", import.meta.url),
  "utf8",
);

// Nur die CODE-Zeilen. Die Begruendungen in den Kommentaren nennen die Flags, die
// hier NICHT stehen duerfen, samt der Stelle, die sie liefert - genau das verlangt
// die Definition of Done ("jeweils mit einem Kommentar, wer stattdessen zustaendig
// ist"). Eine Probe ueber die ganze Datei koennte diese Bedingung also gar nicht
// erfuellen. Dieselbe Trennung benutzen die Tests zu #161, #163, #164, #165
// und #168 im selben Modul.
const CODEZEILEN = QUELLE.split("\n")
  .filter((zeile) => {
    const t = zeile.trim();
    return t !== "" && !t.startsWith("//") && !t.startsWith("*") && !t.startsWith("/*");
  })
  .join("\n");

beforeEach(() => {
  vi.resetAllMocks();
  attrappe.baueVideoKodierArgumente.mockImplementation(echtEncoder.baueVideoKodierArgumente);
  attrappe.baueStilleTonspurEingang.mockImplementation(echtTonspur.baueStilleTonspurEingang);
  attrappe.baueTonspurMapping.mockImplementation(echtTonspur.baueTonspurMapping);
  attrappe.baueTonspurKodierArgumente.mockImplementation(echtTonspur.baueTonspurKodierArgumente);
});

const QUELL_PFAD = "C:\\daten\\projekte\\p1\\medien\\werbespot.mp4";
const BAND_PFAD = "C:\\daten\\t1\\band_0007.mov";
const ZIEL_PFAD = "C:\\daten\\t1\\seg_0007.mp4";

/** Eine Kette ohne Band - sie verbraucht [0:v] und liefert [v]. */
const KETTE_OHNE_BAND =
  "color=c=black:s=1920x1080:r=30[hg];[0:v]fps=30,scale=1920:1080[vg];[hg][vg]overlay[v]";

/** Eine Kette MIT Band - sie verbraucht zusaetzlich [1:v]. */
const KETTE_MIT_BAND =
  "color=c=black:s=1920x918:r=30[hg];[0:v]fps=30[vg];[hg][vg]overlay[oben];" +
  "[1:v]fps=30[unten];[oben][unten]vstack=inputs=2[v]";

function auftrag(aenderung: Partial<VideoAusschnittAuftrag> = {}): VideoAusschnittAuftrag {
  return {
    quellPfad: QUELL_PFAD,
    startFrame: 45,
    endFrame: 345,
    bandSpurPfad: null,
    filterkette: KETTE_OHNE_BAND,
    zielPfad: ZIEL_PFAD,
    ...aenderung,
  };
}

/** Mit Band - Pfad UND Kette gehoeren zusammen, sonst greift die Kreuzpruefung. */
function auftragMitBand(aenderung: Partial<VideoAusschnittAuftrag> = {}): VideoAusschnittAuftrag {
  return auftrag({ bandSpurPfad: BAND_PFAD, filterkette: KETTE_MIT_BAND, ...aenderung });
}

/** Das Array eines gelungenen Aufrufs - schlaegt fehl, statt `undefined` weiterzureichen. */
function argumente(a: VideoAusschnittAuftrag, profil: RenderProfile = RENDER_PROFILE): string[] {
  const ergebnis = baueVideoAusschnittArgumente(a, profil);
  if (!ergebnis.ok) throw new Error(`unerwartet gescheitert: ${ergebnis.fehler.meldung}`);
  return ergebnis.wert;
}

/** Alle Stellen, an denen ein Argument steht. */
function alleIndizes(arr: readonly string[], gesucht: string): number[] {
  return arr.flatMap((wert, i) => (wert === gesucht ? [i] : []));
}

/** Der Wert HINTER einem Argument. */
function wertHinter(arr: readonly string[], flagge: string): string | undefined {
  const i = arr.indexOf(flagge);
  return i === -1 ? undefined : arr[i + 1];
}

function fehler(ergebnis: Ergebnis<string[]>): { code: string; meldung: string } {
  if (ergebnis.ok) throw new Error("Es wurde ein Fehler erwartet, der Aufruf gelang aber.");
  return ergebnis.fehler;
}

describe("#167 baueVideoAusschnittArgumente - die Stellung von -ss", () => {
  // DER KERN DIESES ISSUES.
  //
  // ffmpeg liest seine Optionen POSITIONSABHAENGIG: Alles VOR einem `-i` ist eine
  // Option DIESES Eingangs, alles nach dem LETZTEN `-i` eine Option der Ausgabe.
  //
  // Stuende `-ss` ZWISCHEN zwei `-i`, waere es also nicht Ausgangs-Suchen, sondern
  // die Eingangs-Option des NAECHSTEN Eingangs - der Bandspur bzw. der stillen
  // Tonquelle. Die Folge: DAS QUELLVIDEO WIRD UEBERHAUPT NICHT VORGESPULT UND
  // BEGINNT BEI BILD 0, waehrend ein unbeteiligter Eingang vorgespult wird.
  // `-frames:v` sorgt trotzdem fuer die RICHTIGE LAENGE - die Datei hat die
  // erwartete Bildzahl, die erwartete Dauer, Exit-Code 0, keine Fehlermeldung und
  // den FALSCHEN INHALT. Nachgemessen am echten ffmpeg 6.1.1 (Tabelle im Kopf der
  // Quelldatei, Wiederholung in tests/integration/video-ausschnitt-echt.spec.ts).
  //
  // Deshalb genuegt "`-ss` steht hinter `-i <quellPfad>`" NICHT. Verglichen wird
  // gegen JEDEN Eingang - und der Fall MIT Bandspur ist der einzige, der die
  // Fehlstellung ueberhaupt aufdecken kann, weil es dort drei Eingaenge gibt.
  it("stellt -ss hinter JEDEN Eingang und vor die Filterkette - OHNE Bandspur", () => {
    const arr = argumente(auftrag());

    const eingaenge = alleIndizes(arr, "-i");
    expect(eingaenge).toHaveLength(2); // Quelle + stille Tonquelle

    const ss = arr.indexOf("-ss");
    expect(ss).toBeGreaterThan(-1);
    for (const i of eingaenge) expect(ss).toBeGreaterThan(i);
    expect(ss).toBeLessThan(arr.indexOf("-filter_complex"));
  });

  it("stellt -ss hinter JEDEN Eingang und vor die Filterkette - MIT Bandspur", () => {
    const arr = argumente(auftragMitBand());

    const eingaenge = alleIndizes(arr, "-i");
    expect(eingaenge).toHaveLength(3); // Quelle + Bandspur + stille Tonquelle

    const ss = arr.indexOf("-ss");
    // Die scharfe Zeile: groesser als der LETZTE Eingang, nicht nur als der erste.
    // Waere `-ss` nur hinter die Quelle gerutscht, stuende es vor Eingang 1 und 2
    // und dieser Vergleich schluege fehl - der obige Test ohne Band nicht.
    expect(ss).toBeGreaterThan(Math.max(...eingaenge));
    for (const i of eingaenge) expect(ss).toBeGreaterThan(i);
    expect(ss).toBeLessThan(arr.indexOf("-filter_complex"));
  });

  it("GEGENPROBE: die Reihenfolge-Pruefung beisst bei der historischen Fehlstellung", () => {
    // Kein Test des Produktivcodes, sondern des Tests: Ein von Hand nach der ALTEN,
    // falschen Art gebautes Array (`-ss` zwischen Quelle und Bandspur) muss an
    // genau der Bedingung oben scheitern. Ohne diese Probe koennte die Bedingung
    // wirkungslos sein, ohne dass es auffiele.
    const falsch = ["-i", QUELL_PFAD, "-ss", "1.491667", "-i", BAND_PFAD, "-i", "anullsrc"];
    const eingaenge = alleIndizes(falsch, "-i");
    const ss = falsch.indexOf("-ss");

    expect(ss).toBeGreaterThan(eingaenge[0] ?? -1); // hinter der Quelle: erfuellt
    expect(ss).toBeLessThan(Math.max(...eingaenge)); // hinter ALLEN: NICHT erfuellt
  });
});

describe("#167 baueVideoAusschnittArgumente - die Startzeit", () => {
  it("laesst -ss bei startFrame 0 vollstaendig weg", () => {
    // `(0 - 0.25)/30` waere negativ, und eine negative Startzeit ist bei
    // Ausgangs-Suchen nicht definiert. Ohne das Argument beginnt die Ausgabe
    // ohnehin beim ersten Bild.
    const arr = argumente(auftrag({ startFrame: 0, endFrame: 300 }));
    expect(arr).not.toContain("-ss");
  });

  it("setzt bei startFrame 45 und 30 fps die ZEICHENKETTE 1.491667", () => {
    // Geprueft wird die Zeichenkette, nicht die Zahl: Ein Vergleich mit 1.491667
    // als Zahl liefe auch dann gruen, wenn das Argument "1,491667" lautete.
    const arr = argumente(auftrag({ startFrame: 45 }));
    expect(wertHinter(arr, "-ss")).toBe("1.491667");
  });

  it("rechnet das Viertel-Frame auch an anderen Bildnummern nach", () => {
    // (1 - 0.25)/30 = 0.025 und (300 - 0.25)/30 = 9.991667 - beide auf sechs
    // Nachkommastellen. Die zweite Zeile belegt zugleich, dass nicht gekuerzt wird.
    expect(wertHinter(argumente(auftrag({ startFrame: 1, endFrame: 2 })), "-ss")).toBe("0.025000");
    expect(wertHinter(argumente(auftrag({ startFrame: 300, endFrame: 600 })), "-ss")).toBe(
      "9.991667",
    );
  });

  it("traegt einen PUNKT als Dezimaltrennzeichen - auch auf deutschem Gebietsschema", () => {
    // Die Gefahr ist real und wird hier VORGEFUEHRT, nicht behauptet: Auf einem
    // deutschsprachigen System liefern die lokalisierenden Wege ein KOMMA. ffmpeg
    // liest "1,491667" nicht als Zahl - der Aufruf schluege fehl oder verstuende
    // "1", und der Schnitt laege eine Vierteltelsekunde daneben.
    const lokalisiert = new Intl.NumberFormat("de-DE", {
      minimumFractionDigits: 6,
      maximumFractionDigits: 6,
    }).format(44.75 / 30);
    expect(lokalisiert).toContain(","); // die Gegenprobe beisst
    expect(lokalisiert).not.toContain(".");

    const wert = wertHinter(argumente(auftrag({ startFrame: 45 })), "-ss");
    expect(wert).toBe("1.491667");
    expect(wert).not.toContain(",");
    expect(wert).toMatch(/^\d+\.\d{6}$/);
  });

  it("nimmt weder toLocaleString noch Intl.NumberFormat (Grep-Probe)", () => {
    expect(CODEZEILEN).not.toContain("toLocaleString");
    expect(CODEZEILEN).not.toContain("Intl.NumberFormat");
    expect(CODEZEILEN).toContain("toFixed");
  });
});

describe("#167 baueVideoAusschnittArgumente - Laenge in Bildern", () => {
  // "Die effektive Elementdauer ist damit `(endFrame − startFrame) / 30` - NICHT
  // die rohe Sekundendifferenz." (TK 9.2.6) Deshalb muss der Clip EXAKT so viele
  // Bilder haben, nicht ungefaehr: Die gemeldete `gesamtdauer` summiert genau
  // diese gerundeten Dauern.
  it.each([
    [0, 300, "300"],
    [45, 345, "300"],
    [299, 300, "1"],
  ])("frames:v bei (%i, %i) ist %s", (startFrame, endFrame, erwartet) => {
    const arr = argumente(auftrag({ startFrame, endFrame }));
    expect(wertHinter(arr, "-frames:v")).toBe(erwartet);
  });

  it("enthaelt weder -t noch -to", () => {
    // Eine Sekundenangabe bezieht sich je nach Stellung einmal auf die Zeitachse
    // der Quelle und einmal auf die der Ausgabe. Wer sie ergaenzt, holt genau die
    // Zweideutigkeit zurueck, die die Angabe in Bildern beseitigt.
    for (const a of [auftrag(), auftragMitBand(), auftrag({ startFrame: 0, endFrame: 30 })]) {
      const arr = argumente(a);
      expect(arr).not.toContain("-t");
      expect(arr).not.toContain("-to");
    }
    expect(CODEZEILEN).not.toMatch(/(['"])-to?\1/);
  });
});

describe("#167 baueVideoAusschnittArgumente - Eingaenge, Mapping, Container", () => {
  it("haengt die stille Tonquelle als LETZTEN Eingang an und meldet ihren Index", () => {
    // Ohne Bandspur: zwei Eingaenge, die stille Quelle ist Nummer 1.
    argumente(auftrag());
    expect(attrappe.baueTonspurMapping).toHaveBeenCalledTimes(1);
    expect(attrappe.baueTonspurMapping).toHaveBeenCalledWith(1);
  });

  it("schiebt die Bandspur auf Eingang 1 und die Tonquelle auf 2", () => {
    // Nur so gilt die Label-Konvention der Filterketten ([0:v] Video, [1:v] Band)
    // in BEIDEN Faellen. Ein falscher Index hier gaebe dem Clip KEINE Tonspur -
    // und das verletzt die Uniformitaet, ohne dass `concat -c copy` es meldet.
    const arr = argumente(auftragMitBand());
    const eingaenge = alleIndizes(arr, "-i");
    expect(eingaenge).toHaveLength(3);
    expect(arr[(eingaenge[0] ?? 0) + 1]).toBe(QUELL_PFAD);
    expect(arr[(eingaenge[1] ?? 0) + 1]).toBe(BAND_PFAD);
    expect(arr[(eingaenge[2] ?? 0) + 1]).toContain("anullsrc");

    expect(attrappe.baueTonspurMapping).toHaveBeenCalledWith(2);
  });

  it("mappt GENAU zwei Stroeme - erst [v], dann die stille Tonspur", () => {
    for (const a of [auftrag(), auftragMitBand()]) {
      const arr = argumente(a);
      const maps = alleIndizes(arr, "-map");
      expect(maps).toHaveLength(2);
      expect(arr[(maps[0] ?? 0) + 1]).toBe("[v]");
      // Der Quellton wird NIE durchgereicht, auch nicht "falls vorhanden": "Eine
      // Quelle MIT Ton wird verworfen und durch die stille Spur ERSETZT."
      // (TK 9.2.6). Das zweite Mapping zeigt auf die Tonquelle, nie auf Eingang 0.
      expect(arr[(maps[1] ?? 0) + 1]).not.toBe("0:a");
      expect(arr[(maps[1] ?? 0) + 1]).not.toBe("0:a:0");
      expect(arr[(maps[1] ?? 0) + 1]).toBe(a.bandSpurPfad === null ? "1:a:0" : "2:a:0");
    }
  });

  it("verwirft die Metadaten der Quelle und nennt das Ausgabeformat", () => {
    const arr = argumente(auftrag());
    // Der Drehungs-Vermerk wurde beim Decodieren angewandt und darf in der Ausgabe
    // nicht stehenbleiben - sonst draehte der Player ein zweites Mal.
    expect(wertHinter(arr, "-map_metadata")).toBe("-1");
    expect(arr[arr.length - 2]).toBe(RENDER_PROFILE.container);
  });

  it("stellt den Zielpfad als LETZTES Element", () => {
    // Alles davor ist eine Ausgabe-Option, alles danach waere ein zweiter Ausgang.
    expect(argumente(auftrag()).at(-1)).toBe(ZIEL_PFAD);
    expect(argumente(auftragMitBand()).at(-1)).toBe(ZIEL_PFAD);
  });

  it("laesst einen Pfad mit Leerzeichen und Apostroph unveraendert und ungequotet stehen", () => {
    // Es gibt keine Kommandozeile, die etwas zerlegen koennte (#158 startet ohne
    // Shell). Anfuehrungszeichen zur Abgrenzung wuerden BESTANDTEIL des Wertes -
    // ffmpeg suchte dann eine Datei, deren Name die Zeichen enthaelt.
    const heikel = "C:\\Meine Videos\\Karl's Spot (neu).mp4";
    const arr = argumente(auftrag({ quellPfad: heikel }));
    expect(arr).toContain(heikel);
    expect(arr.filter((w) => w === heikel)).toHaveLength(1);
  });
});

describe("#167 baueVideoAusschnittArgumente - die fremden Fragmente", () => {
  const PLATZ_TON_EINGANG = ["-f", "lavfi", "-i", "PLATZ:tonquelle"];
  const PLATZ_VIDEO_KODIER = ["PLATZ:videokodier-1", "PLATZ:videokodier-2"];
  const PLATZ_TON_MAPPING = ["-map", "PLATZ:tonmapping"];
  const PLATZ_TON_KODIER = ["PLATZ:tonkodier-1", "PLATZ:tonkodier-2"];

  function aufPlatzhalterUmstellen(): void {
    attrappe.baueStilleTonspurEingang.mockReturnValue(PLATZ_TON_EINGANG);
    attrappe.baueVideoKodierArgumente.mockReturnValue(PLATZ_VIDEO_KODIER);
    attrappe.baueTonspurMapping.mockReturnValue(PLATZ_TON_MAPPING);
    attrappe.baueTonspurKodierArgumente.mockReturnValue(PLATZ_TON_KODIER);
  }

  // Mit erkennbaren Platzhaltern statt echter Flags laesst sich das GANZE Array in
  // einem Stueck vergleichen. Das ist die schaerfste Form der Reihenfolge-Pruefung:
  // Sie deckt jede Verschiebung, jede Auslassung und jede Ergaenzung auf, nicht nur
  // die, an die jemand beim Schreiben des Tests gedacht hat.
  it("uebernimmt alle vier Fragmente unveraendert an der vorgegebenen Stelle - ohne Band", () => {
    aufPlatzhalterUmstellen();

    expect(argumente(auftrag({ startFrame: 45, endFrame: 345 }))).toEqual([
      "-i",
      QUELL_PFAD,
      ...PLATZ_TON_EINGANG,
      "-ss",
      "1.491667",
      "-filter_complex",
      KETTE_OHNE_BAND,
      "-map",
      "[v]",
      ...PLATZ_TON_MAPPING,
      "-frames:v",
      "300",
      ...PLATZ_VIDEO_KODIER,
      ...PLATZ_TON_KODIER,
      "-map_metadata",
      "-1",
      "-f",
      "mp4",
      ZIEL_PFAD,
    ]);
  });

  it("uebernimmt alle vier Fragmente unveraendert an der vorgegebenen Stelle - mit Band", () => {
    aufPlatzhalterUmstellen();

    expect(argumente(auftragMitBand({ startFrame: 0, endFrame: 300 }))).toEqual([
      "-i",
      QUELL_PFAD,
      "-i",
      BAND_PFAD,
      ...PLATZ_TON_EINGANG,
      // KEIN -ss: startFrame ist 0.
      "-filter_complex",
      KETTE_MIT_BAND,
      "-map",
      "[v]",
      ...PLATZ_TON_MAPPING,
      "-frames:v",
      "300",
      ...PLATZ_VIDEO_KODIER,
      ...PLATZ_TON_KODIER,
      "-map_metadata",
      "-1",
      "-f",
      "mp4",
      ZIEL_PFAD,
    ]);
  });

  it("reicht das Profil unveraendert an #161 und #162 durch", () => {
    argumente(auftrag());
    expect(attrappe.baueVideoKodierArgumente).toHaveBeenCalledWith(RENDER_PROFILE);
    expect(attrappe.baueStilleTonspurEingang).toHaveBeenCalledWith(RENDER_PROFILE);
    expect(attrappe.baueTonspurKodierArgumente).toHaveBeenCalledWith(RENDER_PROFILE);
  });

  it("verlaesst sich auf die Laengenbegrenzung aus #162 - und die ist wirklich da", () => {
    // NAHT-PRUEFUNG, nicht Zierde. Die stille Quelle (`anullsrc`) ist ENDLOS. Der
    // Lauf endet ALLEIN deshalb, weil `-frames:v` die Videospur hart begrenzt und
    // das Flag aus #162 die Ausgabe mit dem kuerzesten Strom beendet. Liefert #162
    // es eines Tages nicht mehr, endet der Prozess NIE: #158 hat bewusst keine
    // Zeitgrenze, der Auftrag bliebe fuer immer auf "laeuft", und danach steht die
    // GANZE Warteschlange still, bis die App neu gestartet wird.
    //
    // Die Melde-Klausel von #167 verbietet ausdruecklich, das hier zu ergaenzen -
    // also wird stattdessen geprueft, dass es dort steht. Wird dieser Test rot, ist
    // das ein Vertragsfehler in #162 und zu MELDEN.
    expect(echtTonspur.baueTonspurKodierArgumente(RENDER_PROFILE)).toContain("-shortest");
    // Und der feste Vorspann aus #158 traegt das Ueberschreib-Flag, damit nicht zwei
    // Stellen darueber entscheiden.
    const prozessQuelle = readFileSync(
      new URL("../../src/main/ffmpeg-adapter/prozess.ts", import.meta.url),
      "utf8",
    );
    expect(prozessQuelle).toMatch(/FESTER_VORSPANN[\s\S]*?'-y'/);
  });
});

describe("#167 baueVideoAusschnittArgumente - Abgrenzung", () => {
  // Jedes dieser Flags hat GENAU EINE zustaendige Stelle (im Kopf der Quelldatei
  // benannt). Eine zweite Quelle faellt im Test nicht auf: ffmpeg meldet Erfolg,
  // die Datei entsteht, sie laeuft auf dem Laptop tadellos - und am 85-Zoll-Samsung
  // im Studio ruckelt sie, zeigt falsche Farben oder startet gar nicht.
  //
  // Geprueft wird auf die ZITIERTE Form ('-y'), also auf ein Argument-Literal, und
  // nicht auf das blosse Vorkommen der Zeichen: Kurze Flaggen wie -y, -r, -g und -t
  // stecken sonst zufaellig in Wortresten und der Test waere entweder blind oder
  // dauernd falsch rot.
  it.each([
    "-y",
    "-hide_banner",
    "-nostdin",
    "-loglevel",
    "-progress",
    "-nostats",
    "-r",
    "-fps_mode",
    "-c:v",
    "-c:a",
    "-b:v",
    "-crf",
    "-preset",
    "-pix_fmt",
    "-g",
    "-shortest",
    "-noautorotate",
  ])("setzt %s nicht selbst", (flagge) => {
    expect(CODEZEILEN).not.toMatch(new RegExp(`(['"])${flagge.replace(":", ":")}\\1`));
  });

  it.each(["copy", "+faststart", "setsar"])("enthaelt %s nirgends", (stueck) => {
    expect(CODEZEILEN).not.toContain(stueck);
  });

  it("beruehrt weder das Dateisystem noch den Prozessstart", () => {
    // "Nur der Main schreibt/liest das Dateisystem" (TK 9.2.6) - diese Datei tut
    // beides NICHT; sie ist rein und liefert nur ein Array.
    expect(CODEZEILEN).not.toMatch(/from ['"]node:fs['"]/);
    expect(CODEZEILEN).not.toMatch(/from ['"]node:child_process['"]/);
    expect(CODEZEILEN).not.toMatch(/from ['"]\.\/prozess['"]/);
  });

  it("GEGENPROBE: die Abgrenzungs-Probe beisst wirklich", () => {
    // Ohne diese Zeile koennte das Muster falsch sein und JEDE Datei durchwinken.
    const erfunden = "const a = ['-y', '-pix_fmt', 'yuv420p']";
    expect(erfunden).toMatch(/(['"])-y\1/);
    expect(erfunden).toMatch(/(['"])-pix_fmt\1/);
    // Und die echten Flags stehen sehr wohl dort, wo sie hingehoeren:
    expect(echtEncoder.baueVideoKodierArgumente(RENDER_PROFILE)).toContain("-pix_fmt");
  });
});

describe("#167 baueVideoAusschnittArgumente - Fehlerpfade", () => {
  // Alle tragen denselben Code (TK 9.1.1 Punkt 3), und keiner wirft: Ein `throw`
  // waere eine Ausnahme in einem Auftrag, dessen Zusage danach fuer immer offen
  // bliebe.
  const faelle: [string, VideoAusschnittAuftrag][] = [
    ["quellPfad leer", auftrag({ quellPfad: "" })],
    ["quellPfad beginnt mit Bindestrich", auftrag({ quellPfad: "-i" })],
    ["quellPfad mit Zeilenende", auftrag({ quellPfad: "a\nb.mp4" })],
    ["quellPfad mit Nullzeichen", auftrag({ quellPfad: "a\0b.mp4" })],
    ["zielPfad leer", auftrag({ zielPfad: "" })],
    ["zielPfad beginnt mit Bindestrich", auftrag({ zielPfad: "-f" })],
    ["zielPfad gleich quellPfad", auftrag({ zielPfad: QUELL_PFAD })],
    ["zielPfad gleich bandSpurPfad", auftragMitBand({ zielPfad: BAND_PFAD })],
    ["bandSpurPfad beginnt mit Bindestrich", auftragMitBand({ bandSpurPfad: "-x.mov" })],
    ["bandSpurPfad leer", auftragMitBand({ bandSpurPfad: "" })],
    ["startFrame negativ", auftrag({ startFrame: -1 })],
    ["startFrame nicht ganzzahlig", auftrag({ startFrame: 4.5 })],
    ["startFrame NaN", auftrag({ startFrame: Number.NaN })],
    ["endFrame gleich startFrame", auftrag({ startFrame: 45, endFrame: 45 })],
    ["endFrame kleiner startFrame", auftrag({ startFrame: 45, endFrame: 44 })],
    ["endFrame nicht ganzzahlig", auftrag({ startFrame: 0, endFrame: 10.5 })],
    ["endFrame unendlich", auftrag({ endFrame: Number.POSITIVE_INFINITY })],
    ["filterkette leer", auftrag({ filterkette: "" })],
    ["filterkette ohne [v]", auftrag({ filterkette: "[0:v]fps=30[vg]" })],
    ["Band gesetzt, Kette ohne [1:v]", auftragMitBand({ filterkette: KETTE_OHNE_BAND })],
    ["kein Band, Kette mit [1:v]", auftrag({ filterkette: KETTE_MIT_BAND })],
  ];

  it.each(faelle)("%s -> ungueltige_eingabe", (_name, a) => {
    const ergebnis = baueVideoAusschnittArgumente(a, RENDER_PROFILE);
    expect(fehler(ergebnis).code).toBe("ungueltige_eingabe");
    expect(fehler(ergebnis).meldung.length).toBeGreaterThan(0);
  });

  it("weist ein Profil mit unbrauchbarer Bildrate ab", () => {
    for (const fps of [0, -30, 29.97, Number.NaN]) {
      const profil = { ...RENDER_PROFILE, fps } as unknown as RenderProfile;
      expect(fehler(baueVideoAusschnittArgumente(auftrag(), profil)).code).toBe(
        "ungueltige_eingabe",
      );
    }
  });

  it("wirft bei keiner Eingabe - auch nicht bei voellig falsch geformten", () => {
    const muell = [
      undefined,
      null,
      {},
      { quellPfad: 5, startFrame: "a", endFrame: [], bandSpurPfad: 7, filterkette: 1, zielPfad: {} },
    ];
    for (const m of muell) {
      const ergebnis = baueVideoAusschnittArgumente(
        m as unknown as VideoAusschnittAuftrag,
        RENDER_PROFILE,
      );
      expect(ergebnis.ok).toBe(false);
    }
    expect(
      baueVideoAusschnittArgumente(auftrag(), undefined as unknown as RenderProfile).ok,
    ).toBe(false);
  });

  it("hat bei einem Fehler KEINE Wirkung - die Fragmente werden gar nicht erst gerufen", () => {
    baueVideoAusschnittArgumente(auftrag({ startFrame: -1 }), RENDER_PROFILE);
    expect(attrappe.baueVideoKodierArgumente).not.toHaveBeenCalled();
    expect(attrappe.baueStilleTonspurEingang).not.toHaveBeenCalled();
    expect(attrappe.baueTonspurMapping).not.toHaveBeenCalled();
    expect(attrappe.baueTonspurKodierArgumente).not.toHaveBeenCalled();
  });
});
