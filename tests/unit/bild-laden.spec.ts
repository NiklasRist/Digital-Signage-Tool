
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import {
  anzahlAufbereitete,
  bereiteMotiveVor,
  holeMotiv,
  ladeMotiv,
  leereMotivBestand,
  type Motiv,
} from "../../src/renderer/template-canvas/bild-laden";

// Unit-Test zu #111.
//
// Es gibt hier kein Chromium und damit kein echtes `Image` und kein registriertes
// `media://` - beides IST gestellt, und genau das verlangt die DoD ("Ohne Browser
// pruefbar"). Der Doppelgaenger antwortet nach URL: Was nicht eingetragen ist, lehnt ab -
// so ist der haeufigste Irrtum ("Datei nicht da") der Standardfall und muss nicht in
// jedem Test aufgebaut werden.
//
// Der Doppelgaenger lehnt `decode()` ausserdem ab, solange `src` leer ist - wie der echte.
// Damit prueft JEDER Erfolgstest nebenbei die Reihenfolge aus Festlegung 1: Wer `decode()`
// vor dem Setzen von `src` riefe, bekaeme auch fuer ein eingetragenes Bild `fehlt`.

type Antwort =
  | { art: "ok"; breite: number; höhe: number }
  | { art: "fehler" }
  // "haengt" haelt das `decode()`-Promise offen, bis der Test es aufloest. Nur so ist
  // pruefbar, dass wirklich GEWARTET wird und was ein zwischenzeitliches
  // `leereMotivBestand()` bewirkt.
  | { art: "haengt"; breite: number; höhe: number };

const antworten = new Map<string, Antwort>();
const erzeugte: Doppelgaenger[] = [];

/**
 * Der Blob-Weg (#364, seit 09.11.2026 auch fuer Motive): `bild-laden` holt die Bytes
 * ueber `mediaBlobUrl` und bindet eine Objekt-URL. Der Baustein hat eigene Tests
 * (`media-blob-url.spec.ts`); hier wird ER gestubbt, damit dieser Test die SEMANTIK
 * von `ladeMotiv` prueft und nicht noch einmal den fetch-Weg.
 *
 * `blob:<media-url>` ist Absicht: Der Bild-Doppelgaenger kann so dieselbe Antwort-Tabelle
 * benutzen wie zuvor.
 */
const blobs = vi.hoisted(() => ({
  angefragt: [] as string[],
  freigegeben: [] as string[],
  nichtLadbar: new Set<string>(),
}));

vi.mock("../../src/renderer/gemeinsam/media-blob-url", () => ({
  mediaBlobUrl: async (projektId: string, dateiname: string) => {
    const url = `media://${projektId}/${dateiname}`;
    blobs.angefragt.push(url);
    if (blobs.nichtLadbar.has(url)) return "";
    return `blob:${url}`;
  },
  gibMediaBlobUrlFrei: (url: string) => {
    if (url !== "") blobs.freigegeben.push(url);
  },
}));

class Doppelgaenger {
  src = "";
  naturalWidth = 0;
  naturalHeight = 0;
  // Auch `width`/`height` sind belegt, und zwar mit ANDEREN Werten: Die DoD verlangt die
  // natuerlichen Masse. Laese die Umsetzung `width`/`height`, faellt es hier auf.
  width = 1;
  height = 1;
  loeseAuf: (() => void) | null = null;

  constructor() {
    erzeugte.push(this);
  }

  decode(): Promise<void> {
    if (this.src === "") {
      return Promise.reject(new Error("decode() ohne src"));
    }
    // Die Quelle ist die Objekt-URL `blob:<media-url>`; die Antwort-Tabelle ist nach
    // der media://-Adresse geschluesselt.
    const schluessel = this.src.startsWith("blob:") ? this.src.slice("blob:".length) : this.src;
    const antwort = antworten.get(schluessel) ?? { art: "fehler" };
    if (antwort.art === "fehler") {
      return Promise.reject(new Error("Ladefehler"));
    }
    if (antwort.art === "ok") {
      this.naturalWidth = antwort.breite;
      this.naturalHeight = antwort.höhe;
      return Promise.resolve();
    }
    return new Promise<void>((aufloesen) => {
      this.loeseAuf = (): void => {
        this.naturalWidth = antwort.breite;
        this.naturalHeight = antwort.höhe;
        aufloesen();
      };
    });
  }
}

const globalMitImage = globalThis as unknown as { Image?: unknown };

beforeEach(() => {
  antworten.clear();
  erzeugte.length = 0;
  blobs.angefragt.length = 0;
  blobs.freigegeben.length = 0;
  blobs.nichtLadbar.clear();
  globalMitImage.Image = Doppelgaenger;
  leereMotivBestand();
});

afterAll(() => {
  delete globalMitImage.Image;
});

function eintragen(url: string, antwort: Antwort): void {
  antworten.set(url, antwort);
}

function geladen(motiv: Motiv): Extract<Motiv, { zustand: "geladen" }> {
  if (motiv.zustand !== "geladen") {
    throw new Error(`erwartet "geladen", war "${motiv.zustand}"`);
  }
  return motiv;
}

/** Laesst alle faelligen Mikroschritte durchlaufen, ohne die Zeit zu bemuehen. */
async function mikroschritte(): Promise<void> {
  for (let i = 0; i < 5; i += 1) {
    await Promise.resolve();
  }
}

describe("ladeMotiv", () => {
  it("liefert das dekodierte Bild mit seinen natürlichen Maßen", async () => {
    eintragen("media://p1/x.jpg", { art: "ok", breite: 800, höhe: 600 });

    const motiv = geladen(await ladeMotiv("p1", "x.jpg"));

    expect(motiv.breite).toBe(800);
    expect(motiv.höhe).toBe(600);
    expect(motiv.bild).toBe(erzeugte[0]);
  });

  it("fragt die Bytes genau als media://<projektId>/<dateiname> an", async () => {
    eintragen("media://p1/x.jpg", { art: "ok", breite: 1, höhe: 1 });

    await ladeMotiv("p1", "x.jpg");

    expect(blobs.angefragt).toEqual(["media://p1/x.jpg"]);
    // Gebunden wird eine Objekt-URL, NICHT die media://-Adresse: Letztere taintet das
    // Canvas und liesse `toBlob` scheitern (Befund 09.11.2026, #464).
    expect(erzeugte[0]?.src).toBe("blob:media://p1/x.jpg");
  });

  it("kodiert den Dateinamen nicht und hängt nichts an", async () => {
    // Der Main dekodiert VOR der Aufloesung (#50) und weist Query wie zusaetzliche
    // Pfadebenen ab. Eine Kodierung hier waere eine zweite Pfad-Autoritaet.
    const roh = "3f2a1c4e-0000-4000-8000-0123456789ab.jpg";
    await ladeMotiv("p1", roh);

    expect(blobs.angefragt).toEqual([`media://p1/${roh}`]);
    expect(blobs.angefragt[0]).not.toMatch(/[?#]|%[0-9a-fA-F]{2}/);
  });

  it("gibt die Objekt-URL nach dem Laden wieder frei", async () => {
    eintragen("media://p1/x.jpg", { art: "ok", breite: 1, höhe: 1 });

    await ladeMotiv("p1", "x.jpg");

    expect(blobs.freigegeben).toEqual(["blob:media://p1/x.jpg"]);
  });

  it("liefert fehlt, wenn die Bytes gar nicht kommen - ohne ein Bild zu erzeugen", async () => {
    // Abgewiesen (403), fehlend (404) oder Handler-Fehler: `mediaBlobUrl` gibt '' zurueck.
    blobs.nichtLadbar.add("media://p1/weg.jpg");

    await expect(ladeMotiv("p1", "weg.jpg")).resolves.toEqual({ zustand: "fehlt" });
    expect(erzeugte).toHaveLength(0);
  });

  it("liefert fehlt, wenn der Main die Anfrage ablehnt", async () => {
    // Nichts eingetragen = der Standardfall "Datei nicht da / fremdes Projekt / Traversal".
    await expect(ladeMotiv("p1", "weg.jpg")).resolves.toEqual({ zustand: "fehlt" });
  });

  it("liefert fehlt, wenn die Bytes kein dekodierbares Bild sind", async () => {
    eintragen("media://p1/kaputt.jpg", { art: "fehler" });

    await expect(ladeMotiv("p1", "kaputt.jpg")).resolves.toEqual({ zustand: "fehlt" });
    // Auch der Fehlerweg gibt die Objekt-URL frei - sonst bliebe der Blob liegen.
    expect(blobs.freigegeben).toEqual(["blob:media://p1/kaputt.jpg"]);
  });

  it("wartet auf decode() und liefert vorher nichts", async () => {
    eintragen("media://p1/lang.jpg", { art: "haengt", breite: 4, höhe: 2 });

    let fertig = false;
    const lauf = ladeMotiv("p1", "lang.jpg").then((m) => {
      fertig = true;
      return m;
    });

    await mikroschritte();
    expect(fertig).toBe(false);
    // Ohne eigenen Timeout (Festlegung 5): Es wird gewartet, nicht abgebrochen.
    erzeugte[0]?.loeseAuf?.();

    expect(geladen(await lauf).breite).toBe(4);
  });

  it("erzeugt bei zweimaligem Laden desselben Motivs zwei Bilder", async () => {
    // `ladeMotiv` selbst fuehrt KEINEN Speicher; der einzige ist der vorbereitete Bestand.
    eintragen("media://p1/x.jpg", { art: "ok", breite: 10, höhe: 5 });

    const erst = geladen(await ladeMotiv("p1", "x.jpg"));
    const zweit = geladen(await ladeMotiv("p1", "x.jpg"));

    expect(erzeugte).toHaveLength(2);
    expect(zweit.bild).not.toBe(erst.bild);
    expect([zweit.breite, zweit.höhe]).toEqual([erst.breite, erst.höhe]);
  });

  it.each([
    ["", "x.jpg"],
    ["   ", "x.jpg"],
    ["p1", ""],
    ["p1", "\t "],
  ])("wirft bei leerem Argument (%o, %o)", async (projektId, dateiname) => {
    await expect(ladeMotiv(projektId, dateiname)).rejects.toThrow();
    expect(erzeugte).toHaveLength(0);
  });
});

describe("bereiteMotiveVor und holeMotiv", () => {
  it("legt das Motiv unter seinem Schlüssel ab und gibt es synchron heraus", async () => {
    eintragen("media://p1/x.jpg", { art: "ok", breite: 800, höhe: 600 });

    await bereiteMotiveVor("p1", [{ bildRef: "a1", dateiname: "x.jpg" }]);

    // Kein `await`, kein Promise - genau darum gibt es diese Datei.
    const motiv = geladen(holeMotiv("a1"));
    expect([motiv.breite, motiv.höhe]).toEqual([800, 600]);
  });

  it("schlägt unter der Asset-ID nach, nicht unter dem Dateinamen", async () => {
    eintragen("media://p1/x.jpg", { art: "ok", breite: 1, höhe: 1 });

    await bereiteMotiveVor("p1", [{ bildRef: "a1", dateiname: "x.jpg" }]);

    expect(holeMotiv("x.jpg")).toEqual({ zustand: "fehlt" });
  });

  it("liefert für einen unbekannten Schlüssel fehlt, ohne ein Bild zu erzeugen", () => {
    expect(holeMotiv("unbekannt")).toEqual({ zustand: "fehlt" });
    expect(erzeugte).toHaveLength(0);
  });

  it("lädt in holeMotiv auch dann nichts nach, wenn der Bestand gelehrt wurde", async () => {
    eintragen("media://p1/x.jpg", { art: "ok", breite: 1, höhe: 1 });
    await bereiteMotiveVor("p1", [{ bildRef: "a1", dateiname: "x.jpg" }]);
    const vorher = erzeugte.length;

    leereMotivBestand();

    expect(holeMotiv("a1")).toEqual({ zustand: "fehlt" });
    expect(erzeugte).toHaveLength(vorher);
  });

  it("bereitet die übrigen Einträge trotz eines nicht ladbaren vor", async () => {
    eintragen("media://p1/a.jpg", { art: "ok", breite: 2, höhe: 2 });
    eintragen("media://p1/c.jpg", { art: "ok", breite: 3, höhe: 3 });

    await bereiteMotiveVor("p1", [
      { bildRef: "a1", dateiname: "a.jpg" },
      { bildRef: "a2", dateiname: "kaputt.jpg" },
      { bildRef: "a3", dateiname: "c.jpg" },
    ]);

    expect(geladen(holeMotiv("a1")).breite).toBe(2);
    expect(holeMotiv("a2")).toEqual({ zustand: "fehlt" });
    expect(geladen(holeMotiv("a3")).breite).toBe(3);
  });

  it("löst bei leerer Liste auf, ohne etwas zu tun", async () => {
    await expect(bereiteMotiveVor("p1", [])).resolves.toBeUndefined();
    expect(erzeugte).toHaveLength(0);
  });

  it("überschreibt einen bereits vorhandenen Schlüssel", async () => {
    eintragen("media://p1/alt.jpg", { art: "ok", breite: 10, höhe: 10 });
    eintragen("media://p1/neu.jpg", { art: "ok", breite: 20, höhe: 20 });

    await bereiteMotiveVor("p1", [{ bildRef: "a1", dateiname: "alt.jpg" }]);
    await bereiteMotiveVor("p1", [{ bildRef: "a1", dateiname: "neu.jpg" }]);

    expect(geladen(holeMotiv("a1")).breite).toBe(20);
  });

  it("lässt bei doppeltem Schlüssel im selben Aufruf den letzten gewinnen", async () => {
    // Zwei Aktionen mit demselben Bild-Asset sind der Normalfall; wer die Ergebnisse in
    // der Reihenfolge ihres Eintreffens ablegte, liesse hier den Zufall entscheiden.
    eintragen("media://p1/alt.jpg", { art: "ok", breite: 10, höhe: 10 });
    eintragen("media://p1/neu.jpg", { art: "ok", breite: 20, höhe: 20 });

    await bereiteMotiveVor("p1", [
      { bildRef: "a1", dateiname: "alt.jpg" },
      { bildRef: "a1", dateiname: "neu.jpg" },
    ]);

    expect(geladen(holeMotiv("a1")).breite).toBe(20);
  });

  it.each([
    [{ bildRef: "", dateiname: "x.jpg" }],
    [{ bildRef: "  ", dateiname: "x.jpg" }],
    [{ bildRef: "a1", dateiname: "" }],
  ])("wirft bei einem leeren Feld in eintraege (%o)", async (kaputt) => {
    eintragen("media://p1/gut.jpg", { art: "ok", breite: 1, höhe: 1 });

    await expect(
      bereiteMotiveVor("p1", [{ bildRef: "a0", dateiname: "gut.jpg" }, kaputt]),
    ).rejects.toThrow();

    // Geprueft wird VOR dem ersten Laden: Ein Programmierfehler hinterlässt keinen halb
    // gefuellten Bestand.
    expect(holeMotiv("a0")).toEqual({ zustand: "fehlt" });
    expect(erzeugte).toHaveLength(0);
  });

  it("wirft bei leerer projektId", async () => {
    await expect(
      bereiteMotiveVor(" ", [{ bildRef: "a1", dateiname: "x.jpg" }]),
    ).rejects.toThrow();
  });
});

describe("leereMotivBestand", () => {
  it("macht jeden zuvor bekannten Schlüssel wieder zu fehlt", async () => {
    eintragen("media://p1/a.jpg", { art: "ok", breite: 1, höhe: 1 });
    eintragen("media://p1/b.jpg", { art: "ok", breite: 1, höhe: 1 });
    await bereiteMotiveVor("p1", [
      { bildRef: "a1", dateiname: "a.jpg" },
      { bildRef: "a2", dateiname: "b.jpg" },
    ]);

    leereMotivBestand();

    expect(holeMotiv("a1")).toEqual({ zustand: "fehlt" });
    expect(holeMotiv("a2")).toEqual({ zustand: "fehlt" });
  });

  it("macht eine laufende Vorbereitung wirkungslos, ohne sie scheitern zu lassen", async () => {
    // Der Projektwechsel-Fall (Festlegung 9): Ohne den Generationszaehler truege der
    // Bestand hier gleich wieder Motive des ALTEN Projekts.
    eintragen("media://p1/lang.jpg", { art: "haengt", breite: 7, höhe: 7 });

    const lauf = bereiteMotiveVor("p1", [{ bildRef: "a1", dateiname: "lang.jpg" }]);
    await mikroschritte();

    leereMotivBestand();
    erzeugte[0]?.loeseAuf?.();

    await expect(lauf).resolves.toBeUndefined();
    expect(holeMotiv("a1")).toEqual({ zustand: "fehlt" });
  });

  it("hält den Bestand auch für die bereits fertigen Einträge desselben Laufs leer", async () => {
    eintragen("media://p1/schnell.jpg", { art: "ok", breite: 1, höhe: 1 });
    eintragen("media://p1/lang.jpg", { art: "haengt", breite: 7, höhe: 7 });

    const lauf = bereiteMotiveVor("p1", [
      { bildRef: "a1", dateiname: "schnell.jpg" },
      { bildRef: "a2", dateiname: "lang.jpg" },
    ]);
    await mikroschritte();

    leereMotivBestand();
    erzeugte[1]?.loeseAuf?.();
    await lauf;

    expect(holeMotiv("a1")).toEqual({ zustand: "fehlt" });
    expect(holeMotiv("a2")).toEqual({ zustand: "fehlt" });
  });

  it("erlaubt danach eine neue Vorbereitung", async () => {
    eintragen("media://p2/x.jpg", { art: "ok", breite: 9, höhe: 9 });

    leereMotivBestand();
    await bereiteMotiveVor("p2", [{ bildRef: "b1", dateiname: "x.jpg" }]);

    expect(geladen(holeMotiv("b1")).breite).toBe(9);
  });
});

// Aufbereitung (13.11.2026, FA-28 / TK 9.21.4): Der Bestand fuehrt aufbereitete Puffer
// unter einem eigenen Schluessel - und zwar JEDEN nur EINMAL. Ohne diese Deckelung
// traege jeder Reglerzug denselben Schluessel ein weiteres Mal ein, die Obergrenze
// zaehlte doppelt, und beim Aufraeumen koennte genau das Bild verdrängt werden, das
// gerade gezeigt wird.
describe("Aufbereitung im Motiv-Bestand", () => {
  class Flaeche {
    constructor(
      public width: number,
      public height: number,
    ) {}
    getContext(): {
      drawImage: () => void;
      getImageData: (x: number, y: number, w: number, h: number) => { data: Uint8ClampedArray };
      putImageData: () => void;
    } {
      return {
        drawImage: () => undefined,
        getImageData: (_x: number, _y: number, w: number, h: number) => ({
          data: new Uint8ClampedArray(w * h * 4),
        }),
        putImageData: () => undefined,
      };
    }
  }

  const globalMitCanvas = globalThis as unknown as {
    OffscreenCanvas?: unknown;
    createImageBitmap?: unknown;
  };

  beforeEach(() => {
    globalMitCanvas.OffscreenCanvas = Flaeche;
    globalMitCanvas.createImageBitmap = async () => ({ kuenstlich: true });
  });

  afterAll(() => {
    delete globalMitCanvas.OffscreenCanvas;
    delete globalMitCanvas.createImageBitmap;
  });

  it("legt dasselbe (Asset, Einstellungen) nur EINMAL ab - auch nach acht Vorbereitungen", async () => {
    eintragen("media://p1/bild.jpg", { art: "ok", breite: 4, höhe: 4 });

    for (let i = 0; i < 8; i += 1) {
      await bereiteMotiveVor("p1", [
        { bildRef: "a1", dateiname: "bild.jpg", aufbereitung: { helligkeit: 60 } },
      ]);
    }

    expect(anzahlAufbereitete()).toBe(1);
    // Und das Bild ist danach immer noch da - nicht verdrängt worden.
    expect(holeMotiv("a1#h60").zustand).toBe("geladen");
    // Ohne Aufbereitung liegt es unter der nackten ID - das ist der alte Weg.
    expect(holeMotiv("a1").zustand).toBe("fehlt");
  });

  it("legt zwei VERSCHIEDENE Einstellungen als zwei Motive ab", async () => {
    eintragen("media://p1/bild.jpg", { art: "ok", breite: 4, höhe: 4 });

    await bereiteMotiveVor("p1", [
      { bildRef: "a1", dateiname: "bild.jpg", aufbereitung: { helligkeit: 60 } },
      { bildRef: "a1", dateiname: "bild.jpg", aufbereitung: { kontrast: 20 } },
    ]);

    expect(anzahlAufbereitete()).toBe(2);
    expect(holeMotiv("a1#h60").zustand).toBe("geladen");
    expect(holeMotiv("a1#k20").zustand).toBe("geladen");
  });
});
