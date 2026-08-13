import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import type { Vorlage, Zone } from "../../src/shared/contracts/vorlage";
import {
  EINGEBAUTE_VORLAGEN_IDS,
  eingebauteVorlagen,
} from "../../src/main/vorlagen-store/eingebaute-vorlagen";

const QUELLE = readFileSync(
  new URL("../../src/main/vorlagen-store/eingebaute-vorlagen.ts", import.meta.url),
  "utf8",
);

const hole = (id: string): Vorlage => {
  const gefunden = eingebauteVorlagen().find((v) => v.id === id);
  if (!gefunden) throw new Error(`Vorlage "${id}" fehlt im Anfangsbestand`);
  return gefunden;
};

// [id, rolle, bindung, x, y, breite, hoehe] - dieselbe Reihenfolge wie die Tabellen in
// TK 9.11.1. Zeile fuer Zeile, nicht stichprobenartig: Die Werte ergeben zusammen mit dem
// Sicherheitsabstand die Inhaltsbox 96-1824 / 54-1026; ein gerundeter Wert faellt sonst
// erst am Fernseher auf.
type Zeile = [string, Zone["rolle"], Zone["bindung"], number, number, number, number];

const zeile = (z: Zone): Zeile => [
  z.id,
  z.rolle,
  z.bindung,
  z.rahmen.x,
  z.rahmen.y,
  z.rahmen.breite,
  z.rahmen.höhe,
];

const VOLLBILD: Zeile[] = [
  ["hintergrund", "fest", null, 0, 0, 1920, 1080],
  ["motiv", "frei", "bild", 0, 0, 1920, 1080],
  ["scrim", "fest", null, 0, 432, 1920, 648],
  ["logo", "fest", "logo", 96, 54, 420, 120],
  ["ueberschrift", "frei", "titel", 96, 640, 1150, 190],
  ["beschreibung", "frei", "beschreibung", 96, 850, 1150, 100],
  ["preis", "frei", "preis", 1300, 660, 524, 150],
  ["cta", "frei", "cta", 1300, 830, 524, 120],
];

const SPLIT: Zeile[] = [
  ["hintergrund", "fest", null, 0, 0, 1920, 1080],
  ["motiv", "frei", "bild", 0, 0, 960, 1080],
  ["logo", "fest", "logo", 1056, 54, 420, 120],
  ["ueberschrift", "frei", "titel", 1056, 260, 768, 240],
  ["beschreibung", "frei", "beschreibung", 1056, 530, 768, 200],
  ["preis", "frei", "preis", 1056, 780, 360, 130],
  ["cta", "frei", "cta", 1056, 930, 500, 96],
];

const BAND: Zeile[] = [
  ["hintergrund", "fest", null, 0, 0, 1920, 162],
  ["logo", "fest", "logo", 96, 20, 240, 69],
  ["titel", "frei", "titel", 380, 18, 900, 72],
  ["preis", "frei", "preis", 1330, 18, 240, 72],
  ["cta", "frei", "cta", 1590, 18, 234, 72],
];

describe("eingebauteVorlagen (#96)", () => {
  it("liefert genau drei mitgelieferte Vorlagen in der festgelegten Reihenfolge", () => {
    const v = eingebauteVorlagen();
    expect(v.map((e) => e.id)).toEqual([...EINGEBAUTE_VORLAGEN_IDS]);
    expect(v.map((e) => e.name)).toEqual(["Vollbild", "Split", "Band-Standard"]);
    expect(v.map((e) => e.parent)).toEqual([null, null, null]);
    expect(v.map((e) => e.eingebaut)).toEqual([true, true, true]);
  });

  it("gibt der Vorlage \"split\" die Art vollflaeche, nicht split", () => {
    // Die gefaehrlichste Verwechslung dieser Daten: Mit art 'split' waere die Flaeche
    // 1920 x hoehe, und saemtliche Zonen bis y 1026 laegen ausserhalb - auffallen wuerde
    // das erst beim Zeichnen. Die Vorlagenart 'split' meint das Band, nicht dieses Layout.
    expect([hole("vollbild").art, hole("vollbild").höhe]).toEqual(["vollflaeche", null]);
    expect([hole("split").art, hole("split").höhe]).toEqual(["vollflaeche", null]);
    expect([hole("band-standard").art, hole("band-standard").höhe]).toEqual(["split", 162]);
  });

  it("gibt der Band-Vorlage eine gerade Hoehe", () => {
    // yuv420p verlangt gerade Hoehen und Versaetze; bei ungerader Bandhoehe brechen beide
    // Kompositionsarten aus TK 9.2.8.
    const höhe = hole("band-standard").höhe;
    expect(höhe).not.toBeNull();
    expect((höhe ?? 0) % 2).toBe(0);
    expect(höhe ?? 0).toBeGreaterThan(0);
    expect(höhe ?? 0).toBeLessThan(1080);
  });

  it("baut jede Vorlage Zone fuer Zone nach der TK-Tabelle", () => {
    expect(hole("vollbild").zonen.map(zeile)).toEqual(VOLLBILD);
    expect(hole("split").zonen.map(zeile)).toEqual(SPLIT);
    expect(hole("band-standard").zonen.map(zeile)).toEqual(BAND);
  });

  it("zeichnet hintergrund in jeder Vorlage als erstes", () => {
    // Das Bild einer Aktion ist optional (FA-02) - ohne diese Zone zuerst rendert eine
    // Aktion ohne Motiv schwarz statt markenkonform.
    for (const v of eingebauteVorlagen()) {
      expect(v.zonen.map((z) => z.id).indexOf("hintergrund"), v.id).toBe(0);
    }
  });

  it("legt den scrim zwischen motiv und ueberschrift", () => {
    const ids = hole("vollbild").zonen.map((z) => z.id);
    expect(ids.indexOf("motiv")).toBeLessThan(ids.indexOf("scrim"));
    expect(ids.indexOf("scrim")).toBeLessThan(ids.indexOf("ueberschrift"));
  });

  it("passt jede Einpassung zur Rolle des Bildes", () => {
    // Bei "Vollbild" ist das Bild Stimmung (Beschnitt gewollt), bei "Split" das Produkt
    // selbst - ein beschnittenes Produkt ist ein Werbefehler. Nicht vereinheitlichen.
    const bild = (v: Vorlage, id: string) => v.zonen.find((z) => z.id === id)?.bild?.einpassung;
    expect(bild(hole("vollbild"), "motiv")).toBe("cover");
    expect(bild(hole("split"), "motiv")).toBe("contain");
    for (const v of eingebauteVorlagen()) {
      expect(bild(v, "logo"), v.id).toBe("contain");
    }
  });

  it("haelt jede Zone innerhalb der Flaeche ihrer Vorlagenart", () => {
    for (const v of eingebauteVorlagen()) {
      const flächenHöhe = v.art === "vollflaeche" ? 1080 : (v.höhe ?? 0);
      for (const z of v.zonen) {
        expect(z.rahmen.x, `${v.id}/${z.id}`).toBeGreaterThanOrEqual(0);
        expect(z.rahmen.y, `${v.id}/${z.id}`).toBeGreaterThanOrEqual(0);
        expect(z.rahmen.x + z.rahmen.breite, `${v.id}/${z.id}`).toBeLessThanOrEqual(1920);
        expect(z.rahmen.y + z.rahmen.höhe, `${v.id}/${z.id}`).toBeLessThanOrEqual(flächenHöhe);
      }
    }
  });

  it("haelt jede Inhaltszone des Bandes ueber y 90 und links von x 1824", () => {
    // Die unteren 54 px des Rahmens fallen ins Band; sicher nutzbar sind nur die oberen
    // 108 px. Der hintergrund ist ausgenommen - er traegt keinen Inhalt und muss die
    // Bandflaeche ausfuellen, sonst bleibt der untere Bandteil schwarz.
    const band = hole("band-standard");
    const hintergrund = band.zonen.find((z) => z.id === "hintergrund");
    expect(hintergrund?.rahmen).toEqual({ x: 0, y: 0, breite: 1920, höhe: 162 });

    for (const z of band.zonen.filter((z) => z.id !== "hintergrund")) {
      expect(z.rahmen.y + z.rahmen.höhe, z.id).toBeLessThanOrEqual(90);
      expect(z.rahmen.x + z.rahmen.breite, z.id).toBeLessThanOrEqual(1824);
      expect(z.rahmen.x, z.id).toBeGreaterThanOrEqual(96);
    }
    expect(band.zonen.some((z) => z.id === "beschreibung")).toBe(false);
  });

  it("liefert bei jedem Aufruf frische Objekte bis in die Blaetter", () => {
    // Ein geteiltes Teilobjekt verfaelscht den Anfangsbestand fuer die restliche
    // Prozesslaufzeit - ein Fehler, der erst nach einem Neustart verschwindet.
    const a = hole("vollbild");
    const b = hole("vollbild");
    const zoneA = a.zonen[0];
    const zoneB = b.zonen[0];
    if (!zoneA || !zoneB) throw new Error("Vorlage ohne Zonen");

    zoneA.rahmen.x = 999;
    expect(zoneB.rahmen.x).toBe(0);
    expect(zoneA).not.toBe(zoneB);
    expect(zoneA.ausrichtung).not.toBe(zoneB.ausrichtung);
    expect(zoneA.deko).not.toBe(zoneB.deko);

    const preisA = a.zonen.find((z) => z.id === "preis");
    const preisB = b.zonen.find((z) => z.id === "preis");
    expect(preisA?.text).not.toBe(preisB?.text);
    expect(hole("vollbild").zonen.map(zeile)).toEqual(VOLLBILD);
  });

  it("nennt in der Quelldatei nur Rollen, keine Farben und keine Schriftnamen", () => {
    expect(QUELLE).not.toMatch(/(['"])#[0-9A-Fa-f]{3,8}\1/);
    expect(QUELLE).not.toMatch(/Playfair|Archivo|Arimo|Helvetica/);
  });

  it("greift in der Quelldatei nicht auf das Dateisystem zu", () => {
    expect(QUELLE).not.toMatch(/from\s+['"](node:)?(fs|path)[/'"]/);
    expect(QUELLE).not.toMatch(/require\(\s*['"](node:)?(fs|path)['"]\s*\)/);
    expect(QUELLE).not.toMatch(/ermittleDatenOrt/);
  });
});
