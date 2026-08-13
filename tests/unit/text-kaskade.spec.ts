import { describe, expect, it } from "vitest";

import {
  passeTextEin,
  ZEILENHOEHE_FAKTOR,
  type KaskadenEingang,
} from "../../src/renderer/template-canvas/text-kaskade";

// Unit-Test zu #113. Geprueft wird die KASKADE als Rechnung, nicht die Deklaration.
//
// Der Messer ist gestellt und GERECHNET: Breite = Codepoints x 0,5 x Groesse. Damit ist
// jede Erwartung unten nachrechenbar, und der Test braucht kein Canvas - genau das
// verlangt die DoD ("Ohne Browser pruefbar"). Ein echtes `measureText` gehoert zu #114.
//
// Codepoints und nicht `text.length`: Sonst zaehlte ein Emoji als zwei Zeichen und der
// Surrogatpaar-Test weiter unten pruefte in Wahrheit den Messer statt die Kuerzung.
interface Messung {
  text: string;
  größe: number;
}

function messer(faktor = 0.5): {
  messeBreite: (text: string, größe: number) => number;
  aufrufe: Messung[];
} {
  const aufrufe: Messung[] = [];
  return {
    aufrufe,
    messeBreite: (text: string, größe: number): number => {
      aufrufe.push({ text, größe });
      return Array.from(text).length * faktor * größe;
    },
  };
}

function zone(teil: Partial<KaskadenEingang>): KaskadenEingang {
  return {
    text: "Hallo Welt",
    breite: 200,
    höhe: 100,
    größeMax: 20,
    größeMin: 10,
    maxZeilen: 2,
    ...teil,
  };
}

describe("passeTextEin (#113)", () => {
  it("laesst einen passenden Text bei größeMax und bricht ihn nicht um", () => {
    const { messeBreite, aufrufe } = messer();

    // "Hallo Welt" misst bei 20 px genau 100 px und passt in 200 px Breite.
    const ergebnis = passeTextEin(zone({}), messeBreite);

    expect(ergebnis).toEqual({ zeilen: ["Hallo Welt"], größe: 20, gekürzt: false });
    // Der Beweis, dass Stufe 2 gar nicht erst anlief: Es wurde ausschliesslich bei 20 px
    // gemessen. Ein Ergebnis mit größe 20 allein zeigt das nicht - die Schleife koennte
    // kleinere Groessen probiert und die groesste zurueckgegeben haben.
    expect(aufrufe.every((a) => a.größe === 20)).toBe(true);
  });

  it("bricht um, bevor es verkleinert - zwei Zeilen bei voller Groesse", () => {
    const { messeBreite } = messer();

    // 70 px Breite: "Hallo Welt" (100 px) passt nicht, "Hallo" (50) und "Welt" (40) schon.
    const ergebnis = passeTextEin(zone({ breite: 70, höhe: 60 }), messeBreite);

    // DIE REIHENFOLGE. Wer zuerst verkleinerte, kaeme hier auf eine Zeile mit 14 px -
    // lesbar waere die zweizeilige Fassung in voller Groesse.
    expect(ergebnis).toEqual({ zeilen: ["Hallo", "Welt"], größe: 20, gekürzt: false });
  });

  it("verkleinert erst, wenn der Umbruch an maxZeilen scheitert - und kuerzt dabei nicht", () => {
    const { messeBreite } = messer();

    // maxZeilen 1 verbietet die zweite Zeile. Bei 14 px misst "Hallo Welt" 70 px und
    // passt damit einzeilig; bei 15 px waeren es 75 px.
    const ergebnis = passeTextEin(zone({ breite: 70, maxZeilen: 1 }), messeBreite);

    expect(ergebnis).toEqual({ zeilen: ["Hallo Welt"], größe: 14, gekürzt: false });
  });

  it("kuerzt erst bei größeMin und zerlegt ein ueberlanges Wort nie", () => {
    const { messeBreite } = messer();
    const wort = "Donaudampfschifffahrt"; // 21 Zeichen, misst bei 10 px 105 px

    const ergebnis = passeTextEin(
      zone({ text: wort, breite: 30, höhe: 50, maxZeilen: 1 }),
      messeBreite,
    );

    // Kein Bindestrich, keine Silbentrennung: der Rest ist ein PRAEFIX des Wortes.
    expect(ergebnis.zeilen).toEqual(["Donau…"]);
    expect(ergebnis.größe).toBe(10); // gekuerzt wird ausschliesslich bei größeMin
    expect(ergebnis.gekürzt).toBe(true);
    const zeile = ergebnis.zeilen[0] ?? "";
    expect(wort.startsWith(zeile.slice(0, -1))).toBe(true);
    // Genau EIN Auslassungszeichen (U+2026), keine drei Punkte: drei Punkte messen
    // anders, als sie gezeichnet werden.
    expect(zeile.endsWith("…")).toBe(true);
    expect(zeile.slice(0, -1).includes("…")).toBe(false);
    expect(zeile.includes(".")).toBe(false);
  });

  it("haelt den vertikalen Test ein - lieber kleiner als eine Zeile zu viel", () => {
    const { messeBreite } = messer();

    // Hoehe fuer genau EINE Zeile zu 20 px. Zwei Zeilen zu 20 px braeuchten 48 px.
    const höhe = 20 * ZEILENHOEHE_FAKTOR + 1;
    const ergebnis = passeTextEin(zone({ breite: 70, höhe, maxZeilen: 2 }), messeBreite);

    // maxZeilen erlaubt zwei Zeilen, die HOEHE nicht. Ohne den vertikalen Test stuende
    // hier ein zweizeiliger Text zu 20 px und liefe unten aus der Zone.
    expect(ergebnis.zeilen).toEqual(["Hallo Welt"]);
    expect(ergebnis.größe).toBe(14);
    expect(ergebnis.gekürzt).toBe(false);
  });

  it("zeichnet nichts, wenn die Zone selbst fuer eine Zeile zu niedrig ist", () => {
    const { messeBreite } = messer();

    // 5 px Hoehe, kleinste Zeile braucht 10 x 1,2 = 12 px.
    const ergebnis = passeTextEin(zone({ höhe: 5 }), messeBreite);

    expect(ergebnis).toEqual({ zeilen: [], größe: 10, gekürzt: true });
  });

  it("schneidet auf die vertikal moeglichen Zeilen und kuerzt nur die letzte davon", () => {
    const { messeBreite } = messer();

    // Vier Woerter, die je einzeln in 30 px passen (15 px), paarweise aber nicht (35 px).
    // maxZeilen 3 erlaubt drei Zeilen, die Hoehe 25 px nur zwei.
    const ergebnis = passeTextEin(
      zone({
        text: "aaa bbb ccc ddd",
        breite: 30,
        höhe: 25,
        größeMax: 10,
        größeMin: 10,
        maxZeilen: 3,
      }),
      messeBreite,
    );

    expect(ergebnis).toEqual({ zeilen: ["aaa", "bbb…"], größe: 10, gekürzt: true });
  });

  it("kuerzt an Codepoint-Grenzen, nicht mitten in einem Surrogatpaar", () => {
    const { messeBreite } = messer();
    const emoji = "\u{1F600}"; // U+1F600, in UTF-16 ein Surrogatpaar

    const ergebnis = passeTextEin(
      zone({
        text: emoji.repeat(4),
        breite: 15,
        größeMax: 10,
        größeMin: 10,
        maxZeilen: 1,
      }),
      messeBreite,
    );

    // Zwei ganze Emoji plus Auslassungszeichen. Ein Schnitt ueber `charAt` haette hier
    // ein halbes Surrogatpaar hinterlassen - im Endvideo ein Ersatzzeichen-Kaestchen.
    expect(ergebnis.zeilen).toEqual([emoji + emoji + "…"]);
    const zeile = ergebnis.zeilen[0] ?? "";
    expect(Array.from(zeile)).toHaveLength(3);
    // Kein halbes Surrogatpaar: In der Zerlegung nach Codepoints darf kein Zeichen aus
    // dem Surrogatbereich uebrig bleiben - genau das entstuende bei einem Schnitt ueber
    // `charAt` oder einen Index-Zugriff.
    const einsamesSurrogat = Array.from(zeile).some((z) => {
      const punkt = z.codePointAt(0) ?? 0;
      return punkt >= 0xd800 && punkt <= 0xdfff;
    });
    expect(einsamesSurrogat).toBe(false);
  });

  it("nimmt leeren Text und reinen Leerraum an, ohne zu klagen", () => {
    const { messeBreite } = messer();

    for (const text of ["", "   ", " \n\t "]) {
      expect(passeTextEin(zone({ text }), messeBreite)).toEqual({
        zeilen: [],
        größe: 20,
        gekürzt: false,
      });
    }
  });

  it("fasst eine Folge von Leerraum zu einem Trenner zusammen", () => {
    const { messeBreite } = messer();

    // Doppelte Leerzeichen und ein Zeilenumbruch duerfen weder leere Zeilen noch
    // fuehrenden Leerraum erzeugen.
    const ergebnis = passeTextEin(zone({ text: "  Hallo \n\n Welt  " }), messeBreite);

    expect(ergebnis.zeilen).toEqual(["Hallo Welt"]);
  });

  it("liefert bei gleicher Eingabe dasselbe Ergebnis UND dieselben Messungen", () => {
    const erster = messer();
    const zweiter = messer();
    const eingang = zone({ text: "Sommer Angebot fuer alle", breite: 70, höhe: 40 });

    const a = passeTextEin(eingang, erster.messeBreite);
    const b = passeTextEin(eingang, zweiter.messeBreite);

    expect(a).toEqual(b);
    // Der Messprotokoll-Vergleich ist die eigentliche Aussage: Nicht nur das Ergebnis,
    // auch der WEG dorthin haengt allein an Eingabe und Messwert. Ein Zwischenspeicher
    // oder eine Zeit-/Zufallsentscheidung wuerde die zweite Liste abweichen lassen.
    expect(erster.aufrufe).toEqual(zweiter.aufrufe);
  });

  it("liefert immer eine ganze Zahl in [größeMin, größeMax]", () => {
    const { messeBreite } = messer();

    for (const breite of [10, 35, 60, 85, 110, 300]) {
      const { größe } = passeTextEin(zone({ breite, höhe: 60 }), messeBreite);
      expect(Number.isInteger(größe)).toBe(true);
      expect(größe).toBeGreaterThanOrEqual(10);
      expect(größe).toBeLessThanOrEqual(20);
    }
  });

  it("wirft bei unzulaessigen Zonenparametern und nennt Feld und Wert", () => {
    const { messeBreite } = messer();
    const kaputt: Partial<KaskadenEingang>[] = [
      { breite: 0 },
      { breite: -5 },
      { breite: Number.POSITIVE_INFINITY },
      { breite: Number.NaN },
      { höhe: 0 },
      { höhe: Number.NaN },
      { größeMax: 0 },
      { größeMax: 10.5 },
      { größeMin: 0 },
      { größeMin: 2.5 },
      { größeMax: 10, größeMin: 20 }, // vertauscht - wird NICHT stillschweigend gedreht
      { maxZeilen: 0 },
      { maxZeilen: 1.5 },
    ];

    for (const teil of kaputt) {
      expect(() => passeTextEin(zone(teil), messeBreite)).toThrow();
    }

    // Die Meldung muss das Feld und den Wert nennen, sonst sucht der Leser die kaputte
    // Zahl in der Vorlage.
    expect(() => passeTextEin(zone({ breite: -5 }), messeBreite)).toThrow(/breite.*-5/);

    // Und die Pruefung greift VOR dem Text: Ein leerer Text darf eine kaputte Zone nicht
    // zudecken.
    expect(() => passeTextEin(zone({ text: "", höhe: 0 }), messeBreite)).toThrow();
  });
});
