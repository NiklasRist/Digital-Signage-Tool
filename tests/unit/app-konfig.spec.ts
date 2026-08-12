// Vertragstest zu #265 - `AppKonfig`.
//
// DoD 5 verlangt beide Richtungen: Ein Objekt mit ALLEN DREI Feldern erfuellt den
// Typ, ein Objekt OHNE `uiVoreinstellungen` besteht den Typecheck NICHT.
//
// DoD 2 und 4 sind Abwesenheits-Aussagen, und die sind die eigentlich wichtigen:
//
//  - KEIN `schemaVersion`: Die App-Konfiguration wird nicht migriert. Ein Feld dafuer
//    weckte die Erwartung, dass irgendwo eine Migration lebt - es gibt keine.
//  - KEIN `marke`: Die Marke kommt ausschliesslich ueber `leseMarke()` (#29). Laege
//    sie zusaetzlich in der Konfiguration, gaebe es zwei Quellen fuer dieselbe
//    Palette, und der Render zeichnete moeglicherweise mit der aelteren.
import { describe, expect, it } from "vitest";

import type { AppKonfig } from "../../src/shared/contracts/app-konfig";
import type { Behaupte, Gleich } from "../typ-gleich";

// --- DoD 1: genau die drei Felder --------------------------------------------
type T1 = Behaupte<
  Gleich<keyof AppKonfig, "aktivesProjektId" | "letztesExportZiel" | "uiVoreinstellungen">
>;

// --- DoD 2 und 4: die Abwesenheiten ------------------------------------------
type T2 = Behaupte<Gleich<Extract<keyof AppKonfig, "schemaVersion">, never>>;
type T3 = Behaupte<Gleich<Extract<keyof AppKonfig, "marke">, never>>;

// --- Die beiden Pfade sind nullbar, nicht optional ---------------------------
// `null` heisst hier etwas Bestimmtes: "noch nie passiert" (erster Start, noch nie
// exportiert). Ein optionales Feld druckte denselben Zustand ein zweites Mal aus.
type T4 = Behaupte<Gleich<AppKonfig["aktivesProjektId"], string | null>>;
type T5 = Behaupte<Gleich<AppKonfig["letztesExportZiel"], string | null>>;

const vollstaendig: AppKonfig = {
  aktivesProjektId: null,
  letztesExportZiel: null,
  uiVoreinstellungen: {},
};

// Gegenbeweise - nie aufgerufen.
function nurTypebene(): void {
  // @ts-expect-error `uiVoreinstellungen` fehlt - Pflichtfeld (DoD 5, zweite Haelfte).
  const ohneUi: AppKonfig = { aktivesProjektId: null, letztesExportZiel: null };

  // @ts-expect-error `schemaVersion` gehoert nicht in die App-Konfiguration.
  const mitVersion: AppKonfig = { ...vollstaendig, schemaVersion: 1 };

  // @ts-expect-error Die Marke kommt ueber leseMarke() (#29), nicht aus der Konfig.
  const mitMarke: AppKonfig = { ...vollstaendig, marke: {} };

  void ohneUi;
  void mitVersion;
  void mitMarke;
}
void nurTypebene;

export type { T1, T2, T3, T4, T5 };

describe("AppKonfig (#265)", () => {
  it("erfuellt den Typ mit allen drei Feldern", () => {
    expect(Object.keys(vollstaendig).sort()).toEqual([
      "aktivesProjektId",
      "letztesExportZiel",
      "uiVoreinstellungen",
    ]);
  });

  it("unterscheidet 'noch nie' von 'leer'", () => {
    // null = noch nie exportiert; ein leerer String waere ein Pfad, nur ein kaputter.
    expect(vollstaendig.letztesExportZiel).toBeNull();
    expect(vollstaendig.aktivesProjektId).toBeNull();
  });

  it("nimmt beliebige Oberflaechen-Voreinstellungen auf", () => {
    // Record<string, unknown>: Die Schluessel gehoeren den Modulen, die sie setzen
    // (z. B. `app-shell.aktiverReiter`, #196) - der Vertrag zaehlt sie nicht auf.
    const belegt: AppKonfig = {
      ...vollstaendig,
      uiVoreinstellungen: { "app-shell.aktiverReiter": "vorlagen" },
    };
    expect(belegt.uiVoreinstellungen["app-shell.aktiverReiter"]).toBe("vorlagen");
  });
});
