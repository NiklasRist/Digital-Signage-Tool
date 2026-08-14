// Verhaltenstests zu #332 - die vier Nutzlast-Pruefer an ihrem gemeinsamen Ort.
//
// Geprueft werden die Grenzfaelle, die die vier Kopien bis zum Umzug schon abdeckten:
// `null`, Array, `undefined`, leerer String, String aus Leerzeichen, echtes Objekt.
// Die eigentliche Abnahme des Umzugs sind die UNVERAENDERTEN Tests der vier
// Verdrahtungsdateien (ipc-verdrahtung, config-store-verdrahtung,
// project-store-verdrahtung, media-ipc-verdrahtung) - hier steht, was sie voraussetzen.
import { describe, expect, it } from "vitest";

import {
  abgelehnt,
  istGefuellterText,
  istObjekt,
  ohneNutzlast,
} from "../../src/main/ipc-gateway/nutzlast-pruefer";

describe("istObjekt", () => {
  it("nimmt echte Objekte an - auch das leere", () => {
    expect(istObjekt({})).toBe(true);
    expect(istObjekt({ projektId: "x" })).toBe(true);
  });

  it("weist null und Arrays ab, obwohl beide typeof 'object' sind", () => {
    expect(istObjekt(null)).toBe(false);
    expect(istObjekt([])).toBe(false);
    expect(istObjekt(["a"])).toBe(false);
  });

  it("weist alles Nicht-Objektartige ab", () => {
    expect(istObjekt(undefined)).toBe(false);
    expect(istObjekt("{}")).toBe(false);
    expect(istObjekt(0)).toBe(false);
    expect(istObjekt(false)).toBe(false);
  });
});

describe("istGefuellterText", () => {
  it("nimmt Strings mit Zeichen an", () => {
    expect(istGefuellterText("a")).toBe(true);
    expect(istGefuellterText("  a  ")).toBe(true);
  });

  it("weist leer und reine Leerzeichen ab", () => {
    expect(istGefuellterText("")).toBe(false);
    expect(istGefuellterText("   ")).toBe(false);
    expect(istGefuellterText("\t\n")).toBe(false);
  });

  it("weist Nicht-Strings ab", () => {
    expect(istGefuellterText(undefined)).toBe(false);
    expect(istGefuellterText(null)).toBe(false);
    expect(istGefuellterText([])).toBe(false);
    expect(istGefuellterText({})).toBe(false);
    expect(istGefuellterText(42)).toBe(false);
  });

  it("repariert nichts - der Wert bleibt ungetrimmt", () => {
    // Der Trim dient ALLEIN dem Erkennen von "leer". Wuerde hier getrimmt, bekaeme die
    // Fachoperation eine ID, die der Renderer nie gesendet hat.
    const wert: unknown = "  a  ";
    expect(istGefuellterText(wert) && wert).toBe("  a  ");
  });
});

describe("abgelehnt", () => {
  it("liefert ungueltige_eingabe mit der uebergebenen Meldung", () => {
    expect(abgelehnt("kaputt")).toEqual({
      ok: false,
      fehler: { code: "ungueltige_eingabe", meldung: "kaputt" },
    });
  });

  it("setzt kein daten-Feld", () => {
    const ergebnis = abgelehnt("kaputt");
    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) expect("daten" in ergebnis.fehler).toBe(false);
  });
});

describe("ohneNutzlast", () => {
  it("nimmt an, ohne etwas zu pruefen", () => {
    expect(ohneNutzlast()).toEqual({ ok: true, wert: undefined });
  });

  it("ignoriert eine trotzdem uebergebene Nutzlast, statt sie abzulehnen", () => {
    // Zur Laufzeit nimmt die parameterlose Funktion jedes Argument entgegen. Das ist die
    // Zusage, an der `invoke(kanal)` mit seinem mitgeschickten `undefined` haengt - und
    // ebenso ein Renderer, der eines Tages ueberall ein leeres Objekt mitschickt.
    const alsRueckruf = ohneNutzlast as (nutzlast: unknown) => { ok: true; wert: undefined };
    expect(alsRueckruf({ unerwartet: true })).toEqual({ ok: true, wert: undefined });
    expect(alsRueckruf(undefined)).toEqual({ ok: true, wert: undefined });
  });
});
