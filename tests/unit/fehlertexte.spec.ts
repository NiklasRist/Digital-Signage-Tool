// Verhaltenstest zu #211 - die eine Uebersetzung von Fehlercode nach Klartext
// (TK 9.1.1, 9.2.3, 9.4.9, 9.6.4).
//
// Der Kern dieser Datei ist die VOLLSTAENDIGKEIT: Eine Uebersetzungstabelle ist genau
// dann gefaehrlich, wenn ein Code FEHLT - der Nutzer liest dann „Unerwarteter Fehler"
// statt der Ursache, und niemand merkt es, weil nichts bricht. Deshalb stehen hier
// zwei Pruefungen nebeneinander: eine gegen den VERTRAG (TK) und eine gegen den
// GEBAUTEN Code der Main-Module.
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import type { AuftragArt } from "../../src/shared/contracts/auftrag";
import {
  BEKANNTE_FEHLERCODES,
  uebersetzeFehler,
} from "../../src/renderer/queue-panel/fehlertexte";

/** Kurzform: die Funktion nimmt immer ein volles Fehlerobjekt. */
function uebersetze(code: string, daten?: unknown, art: AuftragArt | null = null) {
  return uebersetzeFehler({ code, meldung: "technischer Text aus dem Main", daten }, art);
}

const ALLE_ARTEN: AuftragArt[] = ["import", "loeschen", "render", "export"];

describe("Vollstaendigkeit gegen den Vertrag", () => {
  // Woertlich aus den Fehlercode-Tabellen des TK abgeschrieben. Doppelnennungen
  // (speicher_fehler, kein_platz, ungueltige_eingabe, unbekannter_fehler) stehen
  // absichtlich mehrfach da - sie werden beim Vereinigen einfach gezaehlt.
  const IMPORT_TK_9_4_9 = [
    "datei_nicht_gefunden",
    "format_nicht_unterstuetzt",
    "probe_fehler",
    "kopier_fehler",
    "speicher_fehler",
  ];
  const LOESCHEN_TK_9_4_9 = [
    "asset_nicht_gefunden",
    "asset_referenziert",
    "datei_fehler",
    "speicher_fehler",
  ];
  const RENDER_TK_9_2_3 = [
    "medium_fehlt",
    "ungueltiges_element",
    "ungueltige_eingabe",
    "ffmpeg_fehler",
    "kein_platz",
    "speicher_fehler",
    "unbekannter_fehler",
  ];
  const EXPORT_TK_9_6_4 = [
    "keine_ausgabe",
    "ziel_nicht_verfügbar",
    "datei_zu_gross_fat32",
    "kein_platz",
    "ziel_gesperrt",
    "schreib_fehler",
    "speicher_fehler",
  ];
  const GENERISCH_TK_9_1_1 = ["ungueltige_eingabe", "nicht_gefunden", "unbekannter_fehler"];

  /**
   * Codes, die im GEBAUTEN Code gefuehrt werden, im Technischen Konzept aber (noch)
   * NICHT stehen. Diese Liste ist absichtlich von den TK-Listen getrennt - sonst
   * behauptete der Test, das TK sage etwas, das dort nicht steht.
   *
   * `kein_projekt`: am 13.08.2026 als Vertragsaenderung eingefuehrt und ueber den
   * project-store und alle drei media-service-Unionen nachgezogen. GEMESSEN am
   * 14.08.2026: Der Code steht in 19 Quelldateien unter src/ und in NULL Zeilen unter
   * docs/ - weder im Technischen Konzept noch im Anforderungsdokument. Er erreicht
   * `Auftrag.fehler.code` (Import und Loeschen reichen ihn unveraendert durch) und
   * braucht deshalb einen Anzeigetext; die verbindliche Tabelle in #211 ist am
   * 14.08.2026 entsprechend ergaenzt worden.
   *
   * DIESE LISTE IST EINE SCHULD, KEINE LOESUNG. Sie soll leer werden, sobald das TK
   * nachgezogen ist (eigener Schritt, eigene Freigabe - Dokumente werden in diesem
   * Projekt nicht nebenbei geaendert). Wer das TK ergaenzt, verschiebt den Eintrag in
   * die passende TK-Liste oben und laesst diese hier leer zurueck.
   */
  const IM_CODE_ABER_NICHT_IM_TK = ["kein_projekt"];

  it("fuehrt die im TK genannte Anzahl je Dienst", () => {
    expect(IMPORT_TK_9_4_9).toHaveLength(5);
    expect(LOESCHEN_TK_9_4_9).toHaveLength(4);
    expect(RENDER_TK_9_2_3).toHaveLength(7);
    expect(EXPORT_TK_9_6_4).toHaveLength(7);
    expect(GENERISCH_TK_9_1_1).toHaveLength(3);
  });

  const erwartet = new Set([
    ...IMPORT_TK_9_4_9,
    ...LOESCHEN_TK_9_4_9,
    ...RENDER_TK_9_2_3,
    ...EXPORT_TK_9_6_4,
    ...GENERISCH_TK_9_1_1,
    ...IM_CODE_ABER_NICHT_IM_TK,
  ]);

  it("kennt GENAU die Codes des Vertrags - keinen weniger und keinen erfundenen", () => {
    expect([...BEKANNTE_FEHLERCODES].sort()).toEqual([...erwartet].sort());
  });

  it.each([...BEKANNTE_FEHLERCODES])("%s ergibt drei nicht leere Texte", (code) => {
    const text = uebersetze(code);
    expect(text.titel).not.toBe("");
    expect(text.erklaerung).not.toBe("");
    // Die Handlungsempfehlung ist der Punkt der ganzen Uebung: kein Zweig darf sie
    // leer lassen oder auf „wenden Sie sich an den Support" verkuerzen.
    expect(text.handlung).not.toBe("");
  });
});

describe("Vollstaendigkeit gegen den GEBAUTEN Main-Code", () => {
  // Warum die Unionen als TEXT gelesen werden und nicht importiert: Der Renderer darf
  // die fachlichen Unionen aus src/main/** nicht importieren (Entscheidung E3 des
  // M5-Prueflaufs) - und Union-TYPEN haben zur Laufzeit ohnehin keinen Wert, den man
  // vergleichen koennte. Diese Probe ist die einzige Klammer, die verhindert, dass die
  // Liste hier und die Unionen dort auseinanderlaufen.
  const UNION_DATEIEN = [
    "../../src/main/media-service/fehlercodes.ts",
    "../../src/main/render-service/fehlercodes.ts",
    "../../src/main/export-service/fehlercodes.ts",
  ];

  /**
   * Codes, die im Main existieren, aber bewusst NICHT in der Tabelle stehen - jeder
   * mit Grund. Wer hier etwas eintraegt, trifft eine Entscheidung; wer nichts
   * eintraegt, laesst den Test fehlschlagen. Beides ist sichtbar.
   */
  // ERLEDIGT am 14.08.2026: Hier stand `kein_projekt` als begruendete Ausnahme. Der
  // Bau-Agent hatte gemeldet, dass der Code Auftrag.fehler.code erreicht, in der
  // verbindlichen Tabelle von #211 aber fehlt - und ihn nicht eigenmaechtig ergaenzt,
  // weil der STOPP-Block das Erfinden von Codes verbietet. Richtig gemeldet: Die
  // Tabelle im Issue ist daraufhin ergaenzt worden (Nachtrag zu #211), der Code steht
  // jetzt regulaer in FEHLERTEXTE. Die Ausnahmeliste ist damit leer - und bleibt
  // bestehen, weil der Test darunter beide Richtungen prueft.
  const BEGRUENDETE_AUSNAHMEN = new Map<string, string>([]);

  const gefundeneCodes = new Set<string>();
  for (const relativ of UNION_DATEIEN) {
    const quelle = readFileSync(new URL(relativ, import.meta.url), "utf8");
    // Nur Deklarationen der Form `export type …Fehlercode = 'a' | 'b' | …`.
    const blockMuster = /export type \w*Fehlercode\w*\s*=\s*((?:\s*\|?\s*'[^']+')+)/g;
    for (const treffer of quelle.matchAll(blockMuster)) {
      const block = treffer[1] ?? "";
      for (const literal of block.matchAll(/'([^']+)'/g)) {
        const code = literal[1];
        if (code !== undefined) {
          gefundeneCodes.add(code);
        }
      }
    }
  }

  it("hat ueberhaupt etwas gefunden - ein leerer Scan waere ein gruener Blindgaenger", () => {
    // Ohne diese Zusicherung koennte ein missgluecktes Muster NULL Treffer liefern und
    // die eigentliche Probe darunter waere lautlos wirkungslos.
    expect(gefundeneCodes.size).toBeGreaterThanOrEqual(15);
    expect(gefundeneCodes).toContain("datei_zu_gross_fat32");
    expect(gefundeneCodes).toContain("medium_fehlt");
    expect(gefundeneCodes).toContain("asset_referenziert");
  });

  it("kennt jeden Code der gebauten Unionen - oder nennt einen Grund", () => {
    const ungedeckt = [...gefundeneCodes].filter(
      (code) => !BEKANNTE_FEHLERCODES.includes(code) && !BEGRUENDETE_AUSNAHMEN.has(code),
    );
    expect(ungedeckt).toEqual([]);
  });

  it("fuehrt keine Ausnahme, die es im Main gar nicht mehr gibt", () => {
    // Die Gegenrichtung: Verschwindet ein Code aus dem Main, soll auch seine
    // Ausnahme verschwinden - sonst waechst eine Liste alter Entschuldigungen.
    const verwaist = [...BEGRUENDETE_AUSNAHMEN.keys()].filter(
      (code) => !gefundeneCodes.has(code),
    );
    expect(verwaist).toEqual([]);
  });
});

describe("Nutzdaten", () => {
  it("asset_referenziert nennt die betroffenen Elemente und bietet KEINEN Sprung an", () => {
    const text = uebersetze("asset_referenziert", { referenzenIds: ["a", "b"] });
    expect(text.betroffeneElementIds).toEqual(["a", "b"]);
    expect(text.reparaturElementId).toBeNull();
  });

  it("medium_fehlt benennt das Sprungziel", () => {
    const text = uebersetze("medium_fehlt", { elementId: "e1" });
    expect(text.reparaturElementId).toBe("e1");
    expect(text.betroffeneElementIds).toEqual(["e1"]);
  });

  it("ungueltiges_element benennt das Sprungziel", () => {
    const text = uebersetze("ungueltiges_element", { elementId: "e2" });
    expect(text.reparaturElementId).toBe("e2");
    expect(text.betroffeneElementIds).toEqual(["e2"]);
  });

  it("uebernimmt nur die brauchbaren Eintraege einer gemischten Liste", () => {
    const text = uebersetze("asset_referenziert", { referenzenIds: ["a", 7, null, "", "b"] });
    expect(text.betroffeneElementIds).toEqual(["a", "b"]);
  });

  it.each([
    ["daten fehlt", undefined],
    ["daten ist null", null],
    ["daten ist eine Zahl", 42],
    ["daten ist ein String", "elementId"],
    ["referenzenIds ist kein Array", { referenzenIds: "x" }],
    ["elementId ist eine Zahl", { elementId: 5 }],
    ["elementId ist leer", { elementId: "" }],
  ])("%s: kein Wurf, leeres Array, kein Sprungziel", (_fall, daten) => {
    for (const code of ["asset_referenziert", "medium_fehlt", "ungueltiges_element"]) {
      const text = uebersetze(code, daten);
      expect(text.betroffeneElementIds).toEqual([]);
      expect(text.reparaturElementId).toBeNull();
      // Der Text erscheint trotzdem - und ohne ein „undefined" im Satz.
      expect(text.titel).not.toBe("");
      expect(text.erklaerung).not.toContain("undefined");
      expect(text.handlung).not.toContain("undefined");
    }
  });

  it("liest Nutzdaten nur bei den Codes, die welche haben", () => {
    // Ein faelschlich mitgeschicktes elementId darf bei speicher_fehler keinen Sprung
    // in den Reparatur-Modus anbieten - dort gibt es kein Element zu reparieren.
    const text = uebersetze("speicher_fehler", { elementId: "e9", referenzenIds: ["a"] });
    expect(text.reparaturElementId).toBeNull();
    expect(text.betroffeneElementIds).toEqual([]);
  });
});

describe("unbekannte und boesartige Codes", () => {
  it.each([
    "gibt_es_nicht",
    "",
    "  ",
    "ä€\n\t<script>",
    "kein platz",
    // Die drei Namen, an denen ein Objekt-Literal als Tabelle gestolpert waere:
    // sie sind auf jedem Objekt ueber die Prototypkette belegt.
    "constructor",
    "__proto__",
    "toString",
    "valueOf",
  ])("%j ergibt einen gueltigen Fehlertext ohne Ausnahme", (code) => {
    const text = uebersetze(code);
    expect(text.titel).toBe("Unerwarteter Fehler");
    expect(text.erklaerung).not.toBe("");
    expect(text.handlung).not.toBe("");
    expect(text.betroffeneElementIds).toEqual([]);
    expect(text.reparaturElementId).toBeNull();
    expect(typeof text.wiederholenSinnvoll).toBe("boolean");
  });

  it("schreibt den Rohcode NICHT in die Anzeige", () => {
    const text = uebersetze("streng_geheimer_interner_code");
    expect(text.titel).not.toContain("streng_geheimer_interner_code");
    expect(text.erklaerung).not.toContain("streng_geheimer_interner_code");
    expect(text.handlung).not.toContain("streng_geheimer_interner_code");
  });

  it("setzt den technischen Text aus dem Main nirgends ein", () => {
    const text = uebersetzeFehler(
      { code: "ffmpeg_fehler", meldung: "ERKENNUNGSZEICHEN-4711", daten: undefined },
      "render",
    );
    expect(text.titel).not.toContain("ERKENNUNGSZEICHEN-4711");
    expect(text.erklaerung).not.toContain("ERKENNUNGSZEICHEN-4711");
    expect(text.handlung).not.toContain("ERKENNUNGSZEICHEN-4711");
  });
});

describe("die Auftragsart verfeinert genau einen Code", () => {
  it("kein_platz nennt beim Export einen anderen Ort als beim Render", () => {
    const beimExport = uebersetze("kein_platz", undefined, "export");
    const beimRender = uebersetze("kein_platz", undefined, "render");
    expect(beimExport.handlung).not.toBe(beimRender.handlung);
    // Dieselbe Ursache, derselbe Name (TK 9.6.4) - verschieden ist nur der Ort.
    expect(beimExport.titel).toBe(beimRender.titel);
  });

  it("kein_platz ohne Art bleibt bei der allgemeineren Render-Formulierung", () => {
    expect(uebersetze("kein_platz", undefined, null)).toEqual(
      uebersetze("kein_platz", undefined, "render"),
    );
  });

  it("speicher_fehler lautet fuer alle vier Arten gleich", () => {
    const texte = ALLE_ARTEN.map((art) => uebersetze("speicher_fehler", undefined, art));
    const erster = texte[0];
    expect(erster).toBeDefined();
    for (const text of texte) {
      expect(text.titel).toBe(erster?.titel);
      expect(text.handlung).toBe(erster?.handlung);
    }
  });

  it("die Art aendert bei keinem anderen Code etwas", () => {
    for (const code of BEKANNTE_FEHLERCODES) {
      if (code === "kein_platz") {
        continue;
      }
      for (const art of ALLE_ARTEN) {
        expect(uebersetze(code, undefined, art)).toEqual(uebersetze(code, undefined, null));
      }
    }
  });
});

describe("einzelne Zusagen der Tabelle", () => {
  it("datei_zu_gross_fat32 erklaert exFAT", () => {
    expect(uebersetze("datei_zu_gross_fat32", undefined, "export").handlung).toContain("exFAT");
  });

  it.each([
    "asset_referenziert",
    "medium_fehlt",
    "format_nicht_unterstuetzt",
    "datei_zu_gross_fat32",
  ])("%s ist durch blosses Wiederholen nicht zu beheben", (code) => {
    expect(uebersetze(code).wiederholenSinnvoll).toBe(false);
  });

  it.each(["ffmpeg_fehler", "kein_platz", "speicher_fehler", "ziel_gesperrt", "probe_fehler"])(
    "%s darf wiederholt werden (FA-17)",
    (code) => {
      expect(uebersetze(code).wiederholenSinnvoll).toBe(true);
    },
  );
});

describe("Grenzen der Datei", () => {
  const quelle = readFileSync(
    new URL("../../src/renderer/queue-panel/fehlertexte.ts", import.meta.url),
    "utf8",
  );

  it.each(["includes(", "startsWith(", "match(", "toLowerCase("])(
    "vergleicht keine Texte: %s kommt nicht vor",
    (verboten) => {
      expect(quelle).not.toContain(verboten);
    },
  );

  it("liest den technischen Text aus dem Main an keiner Stelle", () => {
    // Genau EIN Vorkommen ist erlaubt: die Parametertypangabe der Signatur.
    const treffer = quelle.split("meldung").length - 1;
    expect(treffer).toBe(1);
  });

  it.each(["rufeAuf", "abonniere", "window.api", "queue:"])(
    "spricht nicht mit dem Main: %s kommt nicht vor",
    (verboten) => {
      expect(quelle).not.toContain(verboten);
    },
  );
});
