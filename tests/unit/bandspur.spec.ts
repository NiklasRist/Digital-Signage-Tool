// Tests zu #168 - die Bandspur aus den Band-PNGs (TK 9.2.8 Schritt 1, 9.2.6, 9.10.2).
//
// WAS HIER PRUEFBAR IST: die gesamte Argument- und Kettenbildung (reine
// Funktionen) UND die Reihenfolge/Weitergabe in `baueBandspur` - Letzteres ueber
// eine Modul-Attrappe fuer `./prozess`. Es startet also KEIN ffmpeg.
//
// NICHT hier, sondern in tests/integration/bandspur-echt.spec.ts (#11): ob die
// erzeugte Bandspur tatsaechlich `gesamtFrames` Bilder und einen Alphakanal hat.
// Das kann ein Unit-Test grundsaetzlich nicht sagen, weil die Aussage am echten
// Encoder haengt und nicht an der Zeichenkette. Die Messwerte stehen im Kopf der
// Quelldatei; die Zeichenketten-Vergleiche hier sind ihr Anker: Aendert jemand
// eine Kette, wird dieser Test rot und die Messung ist zu wiederholen.
//
// DIE TEUERSTEN FEHLER DIESER DATEI SIND RECHNERISCH UND POSITIONELL, nicht
// vertraglich - eine falsche Bildzahl und eine Option am falschen Platz sehen
// beide typrichtig aus. Deshalb pruefen die Tests unten Werte und PLAETZE, nicht
// nur Vorhandensein.
import { readFileSync } from "node:fs";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { RENDER_PROFILE } from "../../src/shared/contracts/render-profile";

import type { BandspurAuftrag } from "../../src/main/ffmpeg-adapter/bandspur";
import type { RenderProfile } from "../../src/shared/contracts/render-profile";

// Die Attrappe fuer #158. Sie ist der einzige Weg, `baueBandspur` zu pruefen,
// ohne ffmpeg zu starten - und zugleich der einzige, der die OBJEKTIDENTITAET
// der durchgereichten Rueckrufe sichtbar macht.
const attrappe = vi.hoisted(() => ({
  fuehreFfmpegAus: vi.fn(),
}));

vi.mock("../../src/main/ffmpeg-adapter/prozess", () => ({
  fuehreFfmpegAus: attrappe.fuehreFfmpegAus,
}));

const { baueBandSequenzArgumente, baueBandSchleifeArgumente, baueBandspur } = await import(
  "../../src/main/ffmpeg-adapter/bandspur"
);

const QUELLE = readFileSync(
  new URL("../../src/main/ffmpeg-adapter/bandspur.ts", import.meta.url),
  "utf8",
);

// Nur die CODE-Zeilen. Die Begruendungen in den Kommentaren zitieren das TK
// woertlich (Regel D) und nennen dabei die Messwerte und die Flags des festen
// Vorspanns - das ist erwuenscht und darf die Literal-Probe nicht ausloesen.
// Dieselbe Trennung benutzen die Tests zu #161, #163, #164 und #165 im selben
// Modul.
const CODEZEILEN = QUELLE.split("\n")
  .filter((zeile) => {
    const t = zeile.trim();
    return t !== "" && !t.startsWith("//") && !t.startsWith("*") && !t.startsWith("/*");
  })
  .join("\n");

const FPS = String(RENDER_PROFILE.fps);

/** Ein gueltiger Auftrag; jeder Test aendert nur, was er meint. */
function auftrag(aenderung: Partial<BandspurAuftrag> = {}): BandspurAuftrag {
  return {
    abschnitte: [
      { pngPfad: "/t1/band_0000.png", frames: 300 },
      { pngPfad: "/t1/band_0001.png", frames: 150 },
    ],
    hoeheBand: 162,
    gesamtFrames: 1200,
    sequenzPfad: "/t1/band_sequenz.mov",
    zielPfad: "/t1/band_spur.mov",
    ...aenderung,
  };
}

/** Die Argumente oder ein aussagekraeftiger Fehlschlag. */
function sequenz(a: BandspurAuftrag = auftrag(), p: RenderProfile = RENDER_PROFILE): string[] {
  const ergebnis = baueBandSequenzArgumente(a, p);
  if (!ergebnis.ok) throw new Error(`unerwartet gescheitert: ${ergebnis.fehler.meldung}`);
  return ergebnis.wert;
}

function schleife(a: BandspurAuftrag = auftrag(), p: RenderProfile = RENDER_PROFILE): string[] {
  const ergebnis = baueBandSchleifeArgumente(a, p);
  if (!ergebnis.ok) throw new Error(`unerwartet gescheitert: ${ergebnis.fehler.meldung}`);
  return ergebnis.wert;
}

/** Der Wert HINTER einem Flag - so wird die Position mitgeprueft, nicht nur das Vorkommen. */
function wertVon(argumente: readonly string[], flag: string): string | undefined {
  const stelle = argumente.indexOf(flag);
  return stelle === -1 ? undefined : argumente[stelle + 1];
}

/** Die Filterkette des Laufs. */
function kette(argumente: readonly string[]): string {
  const k = wertVon(argumente, "-filter_complex");
  if (k === undefined) throw new Error("keine Filterkette im Argument-Array");
  return k;
}

/** Ein Profil mit abweichenden Werten - die Umtypung gehoert AUSSCHLIESSLICH hierher. */
function abgewandelt(aenderung: Record<string, unknown>): RenderProfile {
  return { ...RENDER_PROFILE, ...aenderung } as unknown as RenderProfile;
}

/** Der Fehler eines Schritts - oder ein aussagekraeftiger Erfolg. */
function fehlerVonBeiden(
  a: BandspurAuftrag,
  p: RenderProfile = RENDER_PROFILE,
): { code: string; meldung: string } {
  const eins = baueBandSequenzArgumente(a, p);
  const zwei = baueBandSchleifeArgumente(a, p);
  if (eins.ok) throw new Error("Schritt 1 haette scheitern muessen");
  // BEIDE Schritte muessen denselben Auftrag gleich beurteilen. Duerfte Schritt 2
  // durchwinken, was Schritt 1 abweist, gaebe es zwei Gueltigkeitsbegriffe fuer
  // dasselbe Objekt - und `baueBandspur` haette einen Auftrag, der zur Haelfte gilt.
  if (zwei.ok) throw new Error("Schritt 2 haette ebenfalls scheitern muessen");
  expect(zwei.fehler.code).toBe(eins.fehler.code);
  return eins.fehler;
}

describe("#168 Schritt 1 - die Abschnittsfolge", () => {
  it("erzeugt je Abschnitt genau einen Eingang, jeweils mit vorangehendem -loop 1 und -framerate", () => {
    // N = 1
    const eins = sequenz(auftrag({ abschnitte: [{ pngPfad: "/t1/nur_eines.png", frames: 90 }] }));
    expect(eins.filter((a) => a === "-i")).toHaveLength(1);
    expect(eins.slice(0, 6)).toEqual([
      "-loop",
      "1",
      "-framerate",
      FPS,
      "-i",
      "/t1/nur_eines.png",
    ]);

    // N = 3. Geprueft wird die REIHENFOLGE der Tripel: `-loop` und `-framerate`
    // sind EINGANGS-Optionen und wirken auf den `-i`, der ihnen FOLGT. Stuenden
    // sie einmal am Anfang, gaelten sie nur fuer den ersten Eingang - dieselbe
    // Positionsfalle wie `-ss` in #167.
    const drei = sequenz(
      auftrag({
        abschnitte: [
          { pngPfad: "/t1/a.png", frames: 10 },
          { pngPfad: "/t1/b.png", frames: 20 },
          { pngPfad: "/t1/c.png", frames: 30 },
        ],
      }),
    );
    expect(drei.filter((a) => a === "-i")).toHaveLength(3);
    expect(drei.slice(0, 18)).toEqual([
      "-loop", "1", "-framerate", FPS, "-i", "/t1/a.png",
      "-loop", "1", "-framerate", FPS, "-i", "/t1/b.png",
      "-loop", "1", "-framerate", FPS, "-i", "/t1/c.png",
    ]);
  });

  it("gibt jedem Abschnitt EXAKT seine Bildzahl und schliesst mit concat", () => {
    const k = kette(
      sequenz(
        auftrag({
          abschnitte: [
            { pngPfad: "/t1/a.png", frames: 7 },
            { pngPfad: "/t1/b.png", frames: 313 },
            { pngPfad: "/t1/c.png", frames: 1 },
          ],
        }),
      ),
    );
    // Die uebergebenen Werte unveraendert - hier wird NICHT von Sekunden
    // umgerechnet und NICHT erneut gerundet (die Rundung ist in #174 geschehen).
    expect(k).toContain("trim=end_frame=7,");
    expect(k).toContain("trim=end_frame=313,");
    expect(k).toContain("trim=end_frame=1,");
    expect(k).toContain("concat=n=3:v=1:a=0");
    // Der Zweig traegt den EINGANGS-Index; Zweig und Eingang duerfen nicht
    // auseinanderlaufen.
    expect(k).toContain("[0:v]fps=");
    expect(k).toContain("[1:v]fps=");
    expect(k).toContain("[2:v]fps=");
    expect(k).toContain("[a0][a1][a2]concat=");
  });

  it("haelt in JEDEM Zweig den Alphakanal und kennt kein yuv420p", () => {
    // DAS IST DIE KERNZUSAGE DER DATEI. `yuv420p` hat keinen Alphakanal: Wer die
    // Bandspur in dieses Format zwingt, wirft die Transparenz weg, BEVOR #165 sie
    // ueberhaupt sieht - das Einblendungs-Band erscheint dann als deckender Kasten
    // ueber dem Video. Der Fehler entsteht hier und wird zwei Bausteine spaeter
    // sichtbar; in #165 wurde die Gegenprobe an echtem ffmpeg gemessen.
    const k = kette(sequenz());
    expect(k).not.toContain("yuv420p");
    const zweige = k.split(";");
    expect(zweige).toHaveLength(3); // zwei Abschnitte + der concat-Zweig
    for (const zweig of zweige) {
      expect(zweig).toContain("format=rgba");
    }
  });

  it("fordert die SUMME der Abschnitts-Bilder", () => {
    expect(wertVon(sequenz(), "-frames:v")).toBe("450"); // 300 + 150
  });
});

describe("#168 Schritt 2 - wiederholen und abschneiden", () => {
  it("liest die Sequenz unbegrenzt oft erneut - und zwar VOR dem Eingang", () => {
    const argumente = schleife();
    // `-stream_loop` ist eine EINGANGS-Option. Hinter dem `-i` bricht ffmpeg ab
    // ("cannot be applied to output url"); nachgemessen, s. Kopf der Quelldatei.
    expect(argumente.slice(0, 4)).toEqual(["-stream_loop", "-1", "-i", "/t1/band_sequenz.mov"]);
  });

  it("erzeugt eine neue Zeitachse ueber die Schleifengrenzen hinweg", () => {
    // An jeder Schleifengrenze koennte der Zeitstempel zurueckspringen; der Muxer
    // verwuerfe dann Bilder und die Bandspur waere STILL zu kurz. `N/FRAME_RATE/TB`
    // bildet die Zeit aus der laufenden Bildnummer und ist davon unabhaengig.
    expect(kette(schleife())).toContain("setpts=N/FRAME_RATE/TB");
  });

  it("schneidet exakt bei gesamtFrames ab - auch wenn die Folge laenger ist", () => {
    // Die Wiederholung ist IMPLIZIT: Diese Datei rechnet keinen
    // Wiederholungsfaktor aus, sie fordert nur eine Bildzahl.
    expect(wertVon(schleife(), "-frames:v")).toBe("1200");

    // gesamtFrames KUERZER als die Folge (450): kein Sonderpfad, keine Anpassung.
    // "Die Elementdauer bestimmt allein das Video (Trim). Das Band verlaengert oder
    // verkuerzt sie nie." (TK 9.2.8)
    const kurz = schleife(auftrag({ gesamtFrames: 100 }));
    expect(wertVon(kurz, "-frames:v")).toBe("100");
    // Und die beiden Faelle unterscheiden sich in NICHTS ausser dieser Zahl.
    expect(kurz).toEqual(
      schleife().map((a) => (a === "1200" ? "100" : a)),
    );
  });

  it("haelt auch hier den Alphakanal", () => {
    expect(kette(schleife())).toContain("format=rgba");
    expect(kette(schleife())).not.toContain("yuv420p");
  });
});

describe("#168 - was BEIDE Schritte gemeinsam haben", () => {
  it("setzt Tonlosigkeit, Bildrate, Codec, Container und Metadaten-Sperre", () => {
    for (const argumente of [sequenz(), schleife()]) {
      // Ein zusaetzlicher Tonstrom verschoebe bei `-map` in #167 die Indizes.
      expect(argumente).toContain("-an");
      // `-r`/`-fps_mode` sind KEINE Doppelung zu #161: Die Bandspur ist kein
      // Ausgabe-Artefakt, `baueVideoKodierArgumente` wird nicht gerufen, die
      // Bildrate kaeme sonst von nirgendwo. Sie muss die Zeitachse des Videos
      // teilen (TK 9.2.4: 30 fps, CFR).
      expect(wertVon(argumente, "-r")).toBe(FPS);
      expect(wertVon(argumente, "-fps_mode")).toBe("cfr");
      expect(wertVon(argumente, "-map_metadata")).toBe("-1");
      expect(wertVon(argumente, "-c:v")).toBe("qtrle");
      expect(wertVon(argumente, "-f")).toBe("mov");
      expect(wertVon(argumente, "-map")).toBe("[v]");
    }
  });

  it("stellt den Zielpfad ans ENDE", () => {
    // ffmpeg deutet das letzte Argument als Ausgabe. Steht dort etwas anderes,
    // schreibt der Lauf in eine Datei, die niemand erwartet.
    expect(sequenz().at(-1)).toBe("/t1/band_sequenz.mov");
    expect(schleife().at(-1)).toBe("/t1/band_spur.mov");
  });

  it("laesst einen Pfad mit Leerzeichen und Apostroph unveraendert und ungequotet", () => {
    // Ein Argument-ARRAY braucht keine Anfuehrungszeichen - es gibt keine
    // Kommandozeile, die etwas zerlegen koennte. Wer trotzdem welche setzt, macht
    // sie zum BESTANDTEIL des Dateinamens.
    const heikel = "/t1/Nikla's Band 01.png";
    const zielHeikel = "/t1/Ziel mit 'Apostroph'.mov";
    const a = auftrag({
      abschnitte: [{ pngPfad: heikel, frames: 30 }],
      zielPfad: zielHeikel,
    });
    const argumente = sequenz(a);
    expect(argumente).toContain(heikel);
    expect(argumente.filter((x) => x === heikel)).toHaveLength(1);
    expect(schleife(a).at(-1)).toBe(zielHeikel);
  });

  it("gibt die Argumente flach zurueck - jedes Argument ein eigenes Element", () => {
    for (const argumente of [sequenz(), schleife()]) {
      for (const teil of argumente) {
        expect(typeof teil).toBe("string");
        expect(teil).not.toBe("");
      }
    }
  });
});

describe("#168 - Frame-Erhaltung, der Kern dieses Issues", () => {
  it("Schritt 1 fordert 450, Schritt 2 fordert 1200 - ohne einen Wiederholungsfaktor", () => {
    const a = auftrag({
      abschnitte: [
        { pngPfad: "/t1/a.png", frames: 300 },
        { pngPfad: "/t1/b.png", frames: 150 },
      ],
      gesamtFrames: 1200,
    });
    expect(wertVon(sequenz(a), "-frames:v")).toBe("450");
    expect(wertVon(schleife(a), "-frames:v")).toBe("1200");

    // gesamtFrames wird NICHT auf ein Vielfaches von 450 aufgerundet (1350 waere
    // das naechste). Jede solche "Rettung" verlaengerte das Element, und die
    // Gesamtdauer stimmte nicht mehr mit der Anzeige im composer ueberein.
    expect(schleife(a)).not.toContain("1350");
  });
});

describe("#168 - Abgrenzung: der feste Vorspann und das Ausgabe-Profil bleiben draussen", () => {
  it("wiederholt keines der sechs Betriebs-Flags aus #158", () => {
    // Doppelt gesetzte Flags sind je nach Position wirkungslos oder ueberschreiben
    // sich gegenseitig. #158 stellt sie JEDEM Aufruf voran - auch den beiden hier.
    //
    // Diese Probe laeuft ueber die GANZE Quelldatei, nicht nur ueber die
    // CODEZEILEN: Die Quelldatei umschreibt die Flags in ihren Begruendungen
    // bewusst ("das Ueberschreiben-Flag"), damit die schaerfste Lesart des Issues
    // ("die Datei enthaelt kein -y") ohne Ausnahme gilt. Nur die beiden Namen
    // `qtrle`/`mov` weiter unten brauchen die CODEZEILEN-Trennung, weil der
    // Messbericht im Kopf sie nennen muss.
    for (const flag of ["-y", "-hide_banner", "-nostdin", "-loglevel", "-progress", "-nostats"]) {
      expect(QUELLE).not.toContain(flag);
      expect(sequenz()).not.toContain(flag);
      expect(schleife()).not.toContain(flag);
    }
  });

  it("ruft weder die Video-Kodierargumente (#161) noch die Tonspur (#162)", () => {
    // Wer #161 einbindet, macht aus der Bandspur ein H.264-yuv420p-Artefakt OHNE
    // Alphakanal - und nimmt dem Einblendungs-Band die Transparenz.
    for (const fremd of [
      "baueVideoKodierArgumente",
      "baueStilleTonspurEingang",
      "baueTonspurMapping",
      "baueTonspurKodierArgumente",
      "baueContainerArgumente",
      "encoder-argumente",
      "tonspur",
    ]) {
      expect(CODEZEILEN).not.toContain(fremd);
    }
  });

  it("kennt kein -shortest, kein -t und kein -to - die Laenge steht nur in -frames:v", () => {
    for (const argumente of [sequenz(), schleife()]) {
      expect(argumente).not.toContain("-shortest");
      expect(argumente).not.toContain("-t");
      expect(argumente).not.toContain("-to");
    }
  });

  it("haelt Codec und Container als benannte Konstanten an genau einer Stelle", () => {
    // Ein spaeterer Wechsel - etwa wenn das Experiment aus dem STOPP-Block sie
    // umwirft - ist damit EINE Zeile und keine Suche durch den Code.
    expect(CODEZEILEN).toContain("const BAND_CODEC = 'qtrle'");
    expect(CODEZEILEN).toContain("const BAND_CONTAINER = 'mov'");
    expect(CODEZEILEN.split("qtrle")).toHaveLength(2); // genau ein Vorkommen
    expect(CODEZEILEN.split("mov")).toHaveLength(2);
  });
});

describe("#168 - Fehlerpfade: alles ungueltige_eingabe, niemals ein Wurf", () => {
  it("weist eine leere Abschnittsfolge ab", () => {
    expect(fehlerVonBeiden(auftrag({ abschnitte: [] })).code).toBe("ungueltige_eingabe");
  });

  it("weist eine Bildzahl von 0 oder 2,5 ab und nennt den Index", () => {
    const null_ = fehlerVonBeiden(
      auftrag({
        abschnitte: [
          { pngPfad: "/t1/a.png", frames: 300 },
          { pngPfad: "/t1/b.png", frames: 0 },
        ],
      }),
    );
    expect(null_.code).toBe("ungueltige_eingabe");
    expect(null_.meldung).toContain("abschnitte[1]");

    const bruch = fehlerVonBeiden(
      auftrag({ abschnitte: [{ pngPfad: "/t1/a.png", frames: 2.5 }] }),
    );
    expect(bruch.code).toBe("ungueltige_eingabe");
    expect(bruch.meldung).toContain("abschnitte[0]");
  });

  it("weist eine ungerade Bandhoehe ab, statt sie zu runden", () => {
    // In yuv420p teilen sich je zwei Zeilen eine Farbinformation. Berichtigt wird
    // das in der Band-Vorlage - ein hier veraendertes H passte nicht mehr zu den
    // bereits in 1920 x H gezeichneten PNGs.
    const fehler = fehlerVonBeiden(auftrag({ hoeheBand: 163 }));
    expect(fehler.code).toBe("ungueltige_eingabe");
    expect(fehler.meldung).toContain("163");
  });

  it("weist eine Bandhoehe ab, die das Video verdraengt", () => {
    expect(fehlerVonBeiden(auftrag({ hoeheBand: RENDER_PROFILE.hoehe })).code).toBe(
      "ungueltige_eingabe",
    );
    expect(fehlerVonBeiden(auftrag({ hoeheBand: 0 })).code).toBe("ungueltige_eingabe");
  });

  it("weist einen Pfad mit fuehrendem Bindestrich ab", () => {
    // ffmpeg laese ihn als OPTION - `-i` als Dateiname waere ein zusaetzlicher
    // Eingang und verschoebe alle Indizes der Filterkette.
    expect(fehlerVonBeiden(auftrag({ abschnitte: [{ pngPfad: "-i", frames: 30 }] })).code).toBe(
      "ungueltige_eingabe",
    );
    expect(fehlerVonBeiden(auftrag({ zielPfad: "-f" })).code).toBe("ungueltige_eingabe");
  });

  it("weist leere Pfade und solche mit Zeilenende- oder Nullzeichen ab", () => {
    expect(fehlerVonBeiden(auftrag({ sequenzPfad: "" })).code).toBe("ungueltige_eingabe");
    expect(fehlerVonBeiden(auftrag({ zielPfad: "/t1/a\nb.mov" })).code).toBe("ungueltige_eingabe");
    expect(fehlerVonBeiden(auftrag({ zielPfad: "/t1/a\0b.mov" })).code).toBe("ungueltige_eingabe");
  });

  it("weist zusammenfallende Pfade ab", () => {
    // `-y` steht im festen Vorspann (#158): Es gaebe nicht einmal eine Rueckfrage,
    // bevor der Lauf seine eigene Quelle ueberschreibt.
    const gleich = "/t1/dasselbe.mov";
    expect(
      fehlerVonBeiden(auftrag({ sequenzPfad: gleich, zielPfad: gleich })).code,
    ).toBe("ungueltige_eingabe");
    expect(
      fehlerVonBeiden(
        auftrag({
          abschnitte: [{ pngPfad: "/t1/band_spur.mov", frames: 30 }],
        }),
      ).code,
    ).toBe("ungueltige_eingabe");
    expect(
      fehlerVonBeiden(
        auftrag({
          abschnitte: [{ pngPfad: "/t1/band_sequenz.mov", frames: 30 }],
        }),
      ).code,
    ).toBe("ungueltige_eingabe");
  });

  it("weist ein unbrauchbares Profil ab", () => {
    expect(fehlerVonBeiden(auftrag(), abgewandelt({ fps: 0 })).code).toBe("ungueltige_eingabe");
    expect(fehlerVonBeiden(auftrag(), abgewandelt({ fps: 29.97 })).code).toBe(
      "ungueltige_eingabe",
    );
    expect(fehlerVonBeiden(auftrag(), abgewandelt({ hoehe: Number.POSITIVE_INFINITY })).code).toBe(
      "ungueltige_eingabe",
    );
  });

  it("weist eine unbrauchbare Gesamtlaenge ab", () => {
    expect(fehlerVonBeiden(auftrag({ gesamtFrames: 0 })).code).toBe("ungueltige_eingabe");
    expect(fehlerVonBeiden(auftrag({ gesamtFrames: 1.5 })).code).toBe("ungueltige_eingabe");
    expect(
      fehlerVonBeiden(auftrag({ gesamtFrames: Number.POSITIVE_INFINITY })).code,
    ).toBe("ungueltige_eingabe");
  });

  it("wirft bei KEINER Eingabe - auch nicht bei voellig falschen Typen", () => {
    // TK 9.1.1: niemals `throw`. Ein Wurf von hier liefe als unbehandelte Ausnahme
    // in den Main, und die Zusage des Auftrags bliebe fuer immer offen - danach
    // stuende die GESAMTE Warteschlange.
    const unsinn = [
      undefined,
      null,
      {},
      { abschnitte: null },
      { abschnitte: [null] },
      auftrag({ abschnitte: [{ pngPfad: 7, frames: "viele" } as unknown as never] }),
    ];
    for (const wert of unsinn) {
      const a = wert as unknown as BandspurAuftrag;
      expect(() => baueBandSequenzArgumente(a, RENDER_PROFILE)).not.toThrow();
      expect(() => baueBandSchleifeArgumente(a, RENDER_PROFILE)).not.toThrow();
      expect(baueBandSequenzArgumente(a, RENDER_PROFILE).ok).toBe(false);
      expect(baueBandSchleifeArgumente(a, RENDER_PROFILE).ok).toBe(false);
    }
    for (const p of [undefined, null, {}]) {
      const profil = p as unknown as RenderProfile;
      expect(() => baueBandSequenzArgumente(auftrag(), profil)).not.toThrow();
      expect(baueBandSequenzArgumente(auftrag(), profil).ok).toBe(false);
    }
  });
});

describe("#168 baueBandspur - Reihenfolge und Weitergabe", () => {
  beforeEach(() => {
    attrappe.fuehreFfmpegAus.mockReset();
  });

  const gelungen = { ok: true, wert: undefined };

  it("ruft fuehreFfmpegAus mit einem OBJEKT und in der richtigen Reihenfolge", () => {
    attrappe.fuehreFfmpegAus.mockResolvedValue(gelungen);

    return baueBandspur(auftrag(), RENDER_PROFILE).then((ergebnis) => {
      expect(ergebnis).toEqual(gelungen);
      expect(attrappe.fuehreFfmpegAus).toHaveBeenCalledTimes(2);

      const [ersterAufruf, zweiterAufruf] = attrappe.fuehreFfmpegAus.mock.calls;
      const erster = ersterAufruf?.[0] as { argumente: string[] };
      const zweiter = zweiterAufruf?.[0] as { argumente: string[] };

      // Ein OBJEKT mit dem Feld `argumente` - nicht das Array direkt.
      expect(Array.isArray(erster)).toBe(false);
      expect(erster.argumente).toEqual(sequenz());
      expect(zweiter.argumente).toEqual(schleife());

      // Schritt 1 schreibt die Sequenz, Schritt 2 liest sie: Die Reihenfolge ist
      // nicht Geschmack, sondern Voraussetzung.
      expect(erster.argumente.at(-1)).toBe("/t1/band_sequenz.mov");
      expect(zweiter.argumente).toContain("/t1/band_sequenz.mov");
      expect(zweiter.argumente.at(-1)).toBe("/t1/band_spur.mov");
    });
  });

  it("startet Schritt 2 NICHT, wenn Schritt 1 fehlschlaegt, und reicht das Ergebnis unveraendert durch", async () => {
    // Die Eingangsdatei von Schritt 2 ist gerade nicht entstanden. Und: Die
    // Verdichtung zu `ffmpeg_fehler` gehoert dem render-service (TK 9.2.3) - hier
    // wird KEIN Code uebersetzt und KEINE Meldung umformuliert.
    const fehlschlag = {
      ok: false as const,
      fehler: { code: "ffmpeg_fehler" as const, meldung: "Exit-Code 1" },
    };
    attrappe.fuehreFfmpegAus.mockResolvedValueOnce(fehlschlag);

    const ergebnis = await baueBandspur(auftrag(), RENDER_PROFILE);

    expect(attrappe.fuehreFfmpegAus).toHaveBeenCalledTimes(1);
    expect(ergebnis).toBe(fehlschlag); // dieselbe Objektidentitaet
    if (ergebnis.ok) throw new Error("haette scheitern muessen");
    expect(ergebnis.fehler.code).toBe("ffmpeg_fehler");
    expect(ergebnis.fehler.meldung).toBe("Exit-Code 1");
  });

  it("reicht auch den Fehlschlag von Schritt 2 unveraendert durch", async () => {
    const abgebrochen = {
      ok: false as const,
      fehler: { code: "ffmpeg_abgebrochen" as const, meldung: "Lauf abgebrochen" },
    };
    attrappe.fuehreFfmpegAus.mockResolvedValueOnce(gelungen).mockResolvedValueOnce(abgebrochen);

    const ergebnis = await baueBandspur(auftrag(), RENDER_PROFILE);

    expect(attrappe.fuehreFfmpegAus).toHaveBeenCalledTimes(2);
    expect(ergebnis).toBe(abgebrochen);
  });

  it("startet gar kein ffmpeg, wenn der Auftrag ungueltig ist", async () => {
    const ergebnis = await baueBandspur(auftrag({ hoeheBand: 163 }), RENDER_PROFILE);

    expect(attrappe.fuehreFfmpegAus).not.toHaveBeenCalled();
    if (ergebnis.ok) throw new Error("haette scheitern muessen");
    expect(ergebnis.fehler.code).toBe("ungueltige_eingabe");
  });

  it("reicht aufAusgabeZeile, aufProzessStart und abbruchSignal an BEIDE Aufrufe identisch durch", async () => {
    // FEHLT DAS DURCHREICHEN, ist der Abbrechen-Knopf waehrend des laengsten
    // Schritts wirkungslos - und #181 raeumt T1 unter einem noch laufenden ffmpeg
    // auf, was auf Windows mit EBUSY scheitert und Leichen in T1 zuruecklaesst.
    attrappe.fuehreFfmpegAus.mockResolvedValue(gelungen);

    const lauf = {
      aufAusgabeZeile: (_zeile: string): void => undefined,
      aufProzessStart: (): void => undefined,
      abbruchSignal: new AbortController().signal,
    };

    await baueBandspur(auftrag(), RENDER_PROFILE, lauf);

    expect(attrappe.fuehreFfmpegAus).toHaveBeenCalledTimes(2);
    for (const aufruf of attrappe.fuehreFfmpegAus.mock.calls) {
      const uebergeben = aufruf[0] as typeof lauf;
      // Objektidentitaet, nicht Gleichheit: Eine Kopie des AbortSignal waere kein
      // Abbruch mehr, und eine umschliessende Funktion um aufProzessStart nicht
      // mehr das Handle, das #159 erwartet.
      expect(uebergeben.aufAusgabeZeile).toBe(lauf.aufAusgabeZeile);
      expect(uebergeben.aufProzessStart).toBe(lauf.aufProzessStart);
      expect(uebergeben.abbruchSignal).toBe(lauf.abbruchSignal);
    }
  });

  it("erfindet die drei Felder nicht, wenn kein lauf uebergeben wurde", async () => {
    attrappe.fuehreFfmpegAus.mockResolvedValue(gelungen);

    await baueBandspur(auftrag(), RENDER_PROFILE);

    for (const aufruf of attrappe.fuehreFfmpegAus.mock.calls) {
      const uebergeben = aufruf[0] as Record<string, unknown>;
      // NICHT GESETZT heisst: der Schluessel fehlt. Ein `aufAusgabeZeile: undefined`
      // waere bereits eine Erfindung dieser Datei.
      expect(Object.keys(uebergeben)).toEqual(["argumente"]);
    }
  });
});
