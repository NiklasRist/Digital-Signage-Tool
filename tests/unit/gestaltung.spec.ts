import { describe, expect, it } from "vitest";

import {
  GESTALTUNG_GRENZEN,
  begrenzeZahl,
  gleicheGestaltung,
  groessenFaktor,
  istHexFarbe,
  normalisiereBildAusschnitt,
  normalisiereZonenGestaltung,
  versatzProzent,
  zoomFaktor,
} from "../../src/shared/gestaltung";

// Die Regeln der Zonen-Gestaltung (05.11.2026, TK 9.8.8) - ohne Canvas, ohne DOM, ohne
// Dateisystem. Genau darum steht die Datei in `shared`: Main, Editor und Zeichenweg
// benutzen dieselben Grenzen.

describe("istHexFarbe", () => {
  it("nimmt genau # und sechs Hex-Ziffern", () => {
    expect(istHexFarbe("#FF4040")).toBe(true);
    expect(istHexFarbe("#ff4040")).toBe(true);
  });

  it("lehnt acht Stellen, Kurzform, Namen und Leerzeichen ab", () => {
    // Acht Stellen sind den Marken-Rollen vorbehalten (Scrim mit Alpha); das Formular ist
    // ein <input type="color"> und kennt keinen Alpha-Wert.
    expect(istHexFarbe("#000000B3")).toBe(false);
    expect(istHexFarbe("#FFF")).toBe(false);
    expect(istHexFarbe("red")).toBe(false);
    expect(istHexFarbe(" #FF4040")).toBe(false);
    expect(istHexFarbe("")).toBe(false);
  });
});

describe("begrenzeZahl", () => {
  it("rundet und begrenzt auf die Spanne", () => {
    expect(begrenzeZahl(99.6, 50, 200)).toBe(100);
    expect(begrenzeZahl(10, 50, 200)).toBe(50);
    expect(begrenzeZahl(9999, 50, 200)).toBe(200);
  });

  it("liefert null fuer alles, was keine endliche Zahl ist", () => {
    for (const wert of ["120", null, undefined, NaN, Infinity, {}, []]) {
      expect(begrenzeZahl(wert, 50, 200), String(wert)).toBeNull();
    }
  });
});

describe("groessenFaktor", () => {
  it("1 heisst: die Vorlage gilt", () => {
    // Genau dieser Wert muss auch bei unbrauchbaren Eingaben herauskommen - sonst
    // verschwaende eine handeditierte Datei die Schriftgroesse.
    for (const wert of [undefined, null, "120", NaN, Infinity]) {
      expect(groessenFaktor(wert), String(wert)).toBe(1);
    }
  });

  it("rechnet Prozent in einen Faktor und deckelt ihn", () => {
    expect(groessenFaktor(150)).toBe(1.5);
    expect(groessenFaktor(50)).toBe(0.5);
    expect(groessenFaktor(10_000)).toBe(GESTALTUNG_GRENZEN.groesseProzent.max / 100);
  });
});

describe("zoomFaktor und versatzProzent", () => {
  it("Zoom 100 ist die Vorlage, kleinere Werte werden auf 100 gehoben", () => {
    // Unter 100 % entstuende ein Rand um das Bild, den keine Vorlage vorsieht.
    expect(zoomFaktor(100)).toBe(1);
    expect(zoomFaktor(200)).toBe(2);
    expect(zoomFaktor(0)).toBe(1);
    expect(zoomFaktor(undefined)).toBe(1);
  });

  it("Versatz 0 ist die Mitte; unbrauchbare Werte werden zu 0", () => {
    expect(versatzProzent(25)).toBe(25);
    expect(versatzProzent(-25)).toBe(-25);
    expect(versatzProzent(undefined)).toBe(0);
    expect(versatzProzent(999)).toBe(GESTALTUNG_GRENZEN.versatz.max);
  });
});

describe("normalisiereZonenGestaltung", () => {
  it("behaelt nur bekannte, brauchbare Felder", () => {
    const roh = {
      ueberschrift: {
        textfarbe: "#123456",
        flaechefarbe: "kaputt",
        groesseProzent: 130,
        ausrichtung: "mitte",
        unbekannt: "faellt weg",
      },
    };
    expect(normalisiereZonenGestaltung(roh)).toEqual({
      ueberschrift: { textfarbe: "#123456", groesseProzent: 130, ausrichtung: "mitte" },
    });
  });

  it("verwirft nur den kaputten TEIL, nicht die ganze Gestaltung", () => {
    // Dieselbe Haltung wie `brauchbareDauer` im project-store: Eine kaputte Groesse darf
    // nicht auch noch eine heile Farbe mitnehmen.
    const roh = { preis: { flaechefarbe: "#00FF00", groesseProzent: 100_000 } };
    expect(normalisiereZonenGestaltung(roh)).toEqual({
      preis: { flaechefarbe: "#00FF00", groesseProzent: GESTALTUNG_GRENZEN.groesseProzent.max },
    });
  });

  it("leere Zone bleibt als leerer Eintrag - der Aufrufer entscheidet, ob er sie behaelt", () => {
    expect(normalisiereZonenGestaltung({ motiv: { textfarbe: "nein" } })).toEqual({ motiv: {} });
  });

  it("Nicht-Objekte liefern einen leeren Record, keinen Wurf", () => {
    for (const roh of [null, undefined, "x", 42, [], true]) {
      expect(normalisiereZonenGestaltung(roh), String(roh)).toEqual({});
    }
  });

  it("unbekannte Ausrichtungen fallen weg", () => {
    expect(normalisiereZonenGestaltung({ a: { ausrichtung: "zentriert" } })).toEqual({ a: {} });
  });
});

describe("normalisiereBildAusschnitt", () => {
  it("null heisst: die Vorlage gilt", () => {
    expect(normalisiereBildAusschnitt(undefined)).toBeNull();
    expect(normalisiereBildAusschnitt({})).toBeNull();
    expect(normalisiereBildAusschnitt({ zoom: "200" })).toBeNull();
  });

  it("setzt fehlende Teile auf den Vorlagenwert - Zoom NIE unter 100", () => {
    expect(normalisiereBildAusschnitt({ versatzX: 10 })).toEqual({ zoom: 100, versatzX: 10, versatzY: 0 });
    expect(normalisiereBildAusschnitt({ zoom: 20 })).toEqual({ zoom: 100, versatzX: 0, versatzY: 0 });
  });

  it("begrenzt Zoom und Versatz", () => {
    expect(normalisiereBildAusschnitt({ zoom: 999, versatzY: -999 })).toEqual({
      zoom: GESTALTUNG_GRENZEN.zoom.max,
      versatzX: 0,
      versatzY: GESTALTUNG_GRENZEN.versatz.min,
    });
  });
});

describe("gleicheGestaltung", () => {
  it("vergleicht den INHALT, nicht die Referenz", () => {
    // Ohne diesen Vergleich erzeugte jedes „Fertig" einen Schreibvorgang samt Undo-Schritt
    // fuer nichts: der Entwurf ist nach jedem Rendern ein neues Objekt.
    expect(gleicheGestaltung({ a: { textfarbe: "#123456" } }, { a: { textfarbe: "#123456" } })).toBe(true);
    expect(gleicheGestaltung({ a: { textfarbe: "#123456" } }, { a: { textfarbe: "#654321" } })).toBe(false);
  });

  it("ist unabhaengig von der Schluesselreihenfolge", () => {
    expect(
      gleicheGestaltung(
        { a: { textfarbe: "#123456", groesseProzent: 120 } },
        { a: { groesseProzent: 120, textfarbe: "#123456" } },
      ),
    ).toBe(true);
  });

  it('behandelt undefined, null und leere Objekte gleich - „keine Angabe“ hat drei Formen', () => {
    // `undefined` = altes Projekt kennt das Feld nicht; `{}` = der Editor hat alles
    // zurueckgesetzt; `{zone:{}}` = eine Zone ohne Felder. Alle drei sind dasselbe.
    expect(gleicheGestaltung(undefined, null)).toBe(true);
    expect(gleicheGestaltung({}, undefined)).toBe(true);
    expect(gleicheGestaltung({ a: {} }, null)).toBe(true);
    expect(gleicheGestaltung({ a: {} }, undefined)).toBe(true);
  });

  it('eine gesetzte Angabe ist NICHT „keine Angabe“', () => {
    expect(gleicheGestaltung({ a: { textfarbe: "#123456" } }, undefined)).toBe(false);
  });
});
