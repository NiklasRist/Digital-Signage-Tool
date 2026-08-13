import { describe, expect, it } from "vitest";

import type { AuftragStatus } from "../../src/shared/contracts/auftrag";
import {
  istUebergangErlaubt,
  pruefeUebergang,
} from "../../src/main/auftrags-manager/zustandsuebergang";

const ALLE: readonly AuftragStatus[] = [
  "anstehend",
  "laeuft",
  "erfolg",
  "fehlgeschlagen",
  "abgebrochen",
];

const ERLAUBT = [
  "anstehend->laeuft",
  "laeuft->erfolg",
  "laeuft->fehlgeschlagen",
  "laeuft->abgebrochen",
  "fehlgeschlagen->anstehend",
];

function alleKombinationen(): { von: AuftragStatus; nach: AuftragStatus }[] {
  return ALLE.flatMap((von) => ALLE.map((nach) => ({ von, nach })));
}

describe("Zustandsuebergaenge (#58)", () => {
  it("erlaubt von 25 Kombinationen genau die fuenf aus TK 9.3.3", () => {
    const kombinationen = alleKombinationen();
    expect(kombinationen).toHaveLength(25);

    const bejaht = kombinationen
      .filter(({ von, nach }) => istUebergangErlaubt(von, nach))
      .map(({ von, nach }) => `${von}->${nach}`);

    expect(bejaht.sort()).toEqual([...ERLAUBT].sort());
  });

  it("laesst einen terminalen Zustand nicht wieder verlassen", () => {
    // Die teuren Faelle aus dem Issue, jeder einzeln benannt - sie stecken zwar schon
    // in der Matrix oben, aber dort als Zahl. Faellt einer davon weg, soll der Testname
    // sagen, WELCHER Schaden entstuende.
    expect(istUebergangErlaubt("erfolg", "fehlgeschlagen")).toBe(false); // kippt ein protokolliertes Ergebnis
    expect(istUebergangErlaubt("erfolg", "anstehend")).toBe(false); // erfolg ist endgueltig
    expect(istUebergangErlaubt("abgebrochen", "anstehend")).toBe(false); // reaktiviert einen bewussten Abbruch
    expect(istUebergangErlaubt("abgebrochen", "laeuft")).toBe(false);
    expect(istUebergangErlaubt("anstehend", "erfolg")).toBe(false); // ohne `laeuft` entstuende kein Q3-Eintrag
    expect(istUebergangErlaubt("laeuft", "anstehend")).toBe(false); // "zurueckstellen" gibt es nicht
    expect(istUebergangErlaubt("anstehend", "abgebrochen")).toBe(false); // Entfernen ist kein Statuswechsel

    // Nur `fehlgeschlagen` ist reaktivierbar, und ausschliesslich nach `anstehend`.
    expect(istUebergangErlaubt("fehlgeschlagen", "anstehend")).toBe(true);
    expect(istUebergangErlaubt("fehlgeschlagen", "laeuft")).toBe(false);
  });

  it("lehnt jeden Selbstuebergang ab", () => {
    for (const status of ALLE) {
      expect(istUebergangErlaubt(status, status)).toBe(false);
    }
  });

  it("liefert die Ergebnis-Huelle in beiden Richtungen", () => {
    expect(pruefeUebergang("anstehend", "laeuft")).toEqual({
      ok: true,
      wert: undefined,
    });

    const abgelehnt = pruefeUebergang("erfolg", "anstehend");
    expect(abgelehnt.ok).toBe(false);
    if (!abgelehnt.ok) {
      expect(abgelehnt.fehler.code).toBe("ungueltige_eingabe");
      // Die Meldung ist Anzeigetext; geprueft wird nur, dass sie beide Status nennt -
      // ein Vergleich auf den Wortlaut waere genau die Bindung, die sie nicht haben soll.
      expect(abgelehnt.fehler.meldung).toContain("erfolg");
      expect(abgelehnt.fehler.meldung).toContain("anstehend");
    }
  });

  it("wirft bei keinem Fremdwert, sondern lehnt ab", () => {
    // Nur moeglich, wenn ein Aufrufer den Typ umgeht - dann aber toedlich: Ein Wurf
    // degradierte am Gateway zu `unbekannter_fehler` und vernichtete den Grund.
    const fremd: unknown[] = [
      "entfernt",
      "",
      undefined,
      null,
      42,
      { status: "laeuft" },
      Symbol("laeuft"), // wuerde in `${...}` einen TypeError werfen
      { toString: () => { throw new Error("boom"); } },
    ];

    for (const wert of fremd) {
      const x = wert as AuftragStatus;
      expect(istUebergangErlaubt(x, "laeuft")).toBe(false);
      expect(istUebergangErlaubt("laeuft", x)).toBe(false);
      expect(pruefeUebergang(x, "laeuft").ok).toBe(false);
      expect(pruefeUebergang("laeuft", x).ok).toBe(false);
    }
  });

  it("antwortet unabhaengig von Reihenfolge und Anzahl der Aufrufe", () => {
    const kombinationen = alleKombinationen();
    const erwartet = kombinationen.map(({ von, nach }) =>
      istUebergangErlaubt(von, nach),
    );

    for (let lauf = 0; lauf < 100; lauf += 1) {
      // Bei jedem Lauf ein anderer Startpunkt - eine versehentliche Zwischenspeicherung
      // oder ein Modulzaehler faellt so auf, eine feste Reihenfolge verdeckte ihn.
      for (let i = 0; i < kombinationen.length; i += 1) {
        const j = (i + lauf) % kombinationen.length;
        const paar = kombinationen[j];
        if (paar === undefined) {
          throw new Error("Index ausserhalb der Liste - Testfehler, nicht Codefehler.");
        }
        expect(istUebergangErlaubt(paar.von, paar.nach)).toBe(erwartet[j]);
      }
    }
  });
});
