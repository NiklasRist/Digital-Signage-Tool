import { describe, expect, it, vi } from "vitest";

import type { Auftrag, AuftragStatus } from "../../src/shared/contracts/auftrag";

// Verhaltenstests zur Q1-Warteschlange (#54). Geprueft wird, was die Schlange TUT -
// Reihenfolge, Identitaet der herausgegebenen Eintraege, Verhalten bei Unbekanntem -,
// nicht was ihre Deklaration behauptet.
//
// FRISCHER ZUSTAND JE TEST: Q1 ist modulweiter, fluechtiger Zustand ohne Leer-Funktion
// im Vertrag (absichtlich - eine solche Funktion gehoerte niemandem und koennte im
// Betrieb einen laufenden Auftrag verschwinden lassen). `vi.resetModules()` + erneuter
// Import liefert ein Modul mit leerer Schlange; dasselbe Muster nutzt bereits
// einzel-instanz.spec.ts.
type Q1Modul = typeof import("../../src/main/auftrags-manager/q1-warteschlange");

async function frischesQ1(): Promise<Q1Modul> {
  vi.resetModules();
  return import("../../src/main/auftrags-manager/q1-warteschlange");
}

// Testauftraege als Objektliterale - kein echter Fachdienst noetig. Die Variante
// 'import' ist die mit der kleinsten Nutzlast; welche Art es ist, spielt fuer Q1
// keine Rolle, sie ordnet nur.
function auftrag(id: string, status: AuftragStatus = "anstehend"): Auftrag {
  return {
    auftragId: id,
    art: "import",
    status,
    label: `Import ${id}`,
    payload: { projektId: "p1", quellPfad: `C:/quelle/${id}.mp4` },
    fortschritt: null,
    versuche: 0,
    fehler: null,
    ergebnis: null,
    erstelltAm: "2026-08-13T10:00:00.000Z",
  };
}

const ids = (auftraege: Auftrag[]): string[] => auftraege.map((a) => a.auftragId);

describe("Q1-Warteschlange (#54)", () => {
  it("antwortet auf eine leere Schlange ohne Fehler", async () => {
    const q1 = await frischesQ1();

    expect(q1.alleQ1()).toEqual([]);
    expect(q1.laufender()).toBeUndefined();
    expect(q1.naechsterAnstehender()).toBeUndefined();
    expect(q1.findeQ1("gibt-es-nicht")).toBeUndefined();
    expect(q1.entferneAusQ1("gibt-es-nicht")).toBe(false);
  });

  it("liefert beim Anhaengen die 1-basierte Position", async () => {
    const q1 = await frischesQ1();

    expect(q1.fuegeAnsEndeAn(auftrag("a1"))).toBe(1);
    expect(q1.fuegeAnsEndeAn(auftrag("a2"))).toBe(2);
    expect(q1.fuegeAnsEndeAn(auftrag("a3"))).toBe(3);
  });

  it("legt neue Eintraege mit begonnenAm = null an", async () => {
    const q1 = await frischesQ1();
    q1.fuegeAnsEndeAn(auftrag("a1"));

    // Der Startzeitpunkt gehoert dem Torwaechter (#59). Stuende hier schon einer,
    // waere er die Einreih- und nicht die Startzeit - der Q3-Eintrag (#70) wuerde
    // eine zu lange Laufzeit ausweisen.
    expect(q1.findeQ1("a1")?.begonnenAm).toBeNull();
  });

  it("gibt LEBENDE Eintraege heraus, keine Kopien", async () => {
    const q1 = await frischesQ1();
    q1.fuegeAnsEndeAn(auftrag("a1"));

    // Genau so arbeitet der Torwaechter: Eintrag holen, Status daran setzen.
    const eintrag = q1.findeQ1("a1");
    expect(eintrag).toBeDefined();
    if (eintrag === undefined) return;
    eintrag.auftrag.status = "laeuft";
    eintrag.begonnenAm = "2026-08-13T10:00:05.000Z";

    // Waere oben eine Kopie herausgekommen, saehe die Schlange den Wechsel nicht:
    // `laufender()` bliebe undefined und der Torwaechter startete beim naechsten
    // Aufruf einen zweiten Auftrag - die serielle Invariante braeche lautlos.
    expect(q1.laufender()).toBe(eintrag);
    expect(q1.laufender()?.begonnenAm).toBe("2026-08-13T10:00:05.000Z");
  });

  it("liefert unter anstehenden den aeltesten und ueberspringt den laufenden", async () => {
    const q1 = await frischesQ1();
    q1.fuegeAnsEndeAn(auftrag("a1", "laeuft"));
    q1.fuegeAnsEndeAn(auftrag("a2"));
    q1.fuegeAnsEndeAn(auftrag("a3"));

    expect(q1.naechsterAnstehender()?.auftrag.auftragId).toBe("a2");
    // Reine Auswahl, kein Statuswechsel: derselbe Aufruf liefert erneut denselben.
    expect(q1.naechsterAnstehender()?.auftrag.auftragId).toBe("a2");
    expect(q1.laufender()?.auftrag.auftragId).toBe("a1");
  });

  it("stellt in alleQ1 den laufenden voran, danach die anstehenden in Einfuegereihenfolge", async () => {
    const q1 = await frischesQ1();
    q1.fuegeAnsEndeAn(auftrag("a1"));
    q1.fuegeAnsEndeAn(auftrag("a2", "laeuft"));
    q1.fuegeAnsEndeAn(auftrag("a3"));
    q1.fuegeAnsEndeAn(auftrag("a4"));

    // Der laufende steht ABSICHTLICH nicht an erster Einfuegestelle. Waere er es,
    // koennte die Reihenfolge auch zufaellig stimmen und der Test bewiese nichts -
    // nach einem Entfernen oder einem hinten angehaengten `wiederhole` (#65) ist
    // jede Anordnung moeglich.
    expect(ids(q1.alleQ1())).toEqual(["a2", "a1", "a3", "a4"]);
  });

  it("behaelt ohne laufenden Auftrag die reine Einfuegereihenfolge", async () => {
    const q1 = await frischesQ1();
    q1.fuegeAnsEndeAn(auftrag("a1"));
    q1.fuegeAnsEndeAn(auftrag("a2"));
    q1.fuegeAnsEndeAn(auftrag("a3"));

    expect(ids(q1.alleQ1())).toEqual(["a1", "a2", "a3"]);
  });

  it("stellt terminale Eintraege ans Ende", async () => {
    const q1 = await frischesQ1();
    q1.fuegeAnsEndeAn(auftrag("a1", "fehlgeschlagen"));
    q1.fuegeAnsEndeAn(auftrag("a2"));
    q1.fuegeAnsEndeAn(auftrag("a3", "laeuft"));

    // Terminale Eintraege liegen nur kurz in Q1 - zwischen Statuswechsel und
    // Entfernen in #70. In dieser Spanne darf ein erledigter Auftrag nicht vor dem
    // laufenden im Panel stehen.
    expect(ids(q1.alleQ1())).toEqual(["a3", "a2", "a1"]);
  });

  it("gibt in alleQ1 ein neues Array mit denselben Auftrags-Referenzen zurueck", async () => {
    const q1 = await frischesQ1();
    const a1 = auftrag("a1");
    q1.fuegeAnsEndeAn(a1);

    const liste = q1.alleQ1();
    expect(liste[0]).toBe(a1); // dieselbe Referenz - der Fortschritt bleibt sichtbar
    liste.length = 0; // die LISTE ist eine Kopie ...
    expect(ids(q1.alleQ1())).toEqual(["a1"]); // ... Q1 bleibt davon unberuehrt
  });

  it("entfernt aus der Mitte und laesst die Reihenfolge der uebrigen stehen", async () => {
    const q1 = await frischesQ1();
    q1.fuegeAnsEndeAn(auftrag("a1"));
    q1.fuegeAnsEndeAn(auftrag("a2"));
    q1.fuegeAnsEndeAn(auftrag("a3"));

    expect(q1.entferneAusQ1("a2")).toBe(true);
    expect(ids(q1.alleQ1())).toEqual(["a1", "a3"]);
    expect(q1.findeQ1("a2")).toBeUndefined();
    expect(q1.naechsterAnstehender()?.auftrag.auftragId).toBe("a1");
  });

  it("laesst Q1 bei einer unbekannten ID unveraendert", async () => {
    const q1 = await frischesQ1();
    q1.fuegeAnsEndeAn(auftrag("a1"));
    q1.fuegeAnsEndeAn(auftrag("a2"));

    expect(q1.entferneAusQ1("a9")).toBe(false);
    expect(ids(q1.alleQ1())).toEqual(["a1", "a2"]);
  });

  it("entfernt auch einen laufenden Auftrag", async () => {
    const q1 = await frischesQ1();
    q1.fuegeAnsEndeAn(auftrag("a1", "laeuft"));
    q1.fuegeAnsEndeAn(auftrag("a2"));

    // Die Zulaessigkeit prueft der Aufrufer (#62 lehnt ab, #70 raeumt gerade
    // deshalb weg). Diese Datei kennt die fachlichen Bedingungen nicht.
    expect(q1.entferneAusQ1("a1")).toBe(true);
    expect(q1.laufender()).toBeUndefined();
    expect(ids(q1.alleQ1())).toEqual(["a2"]);
  });

  it("fuegt eine bereits vorhandene auftragId nicht ein zweites Mal ein", async () => {
    const q1 = await frischesQ1();
    const a1 = auftrag("a1", "laeuft");
    q1.fuegeAnsEndeAn(a1);
    q1.fuegeAnsEndeAn(auftrag("a2"));

    const zweiterVersuch = auftrag("a1");
    zweiterVersuch.label = "Doppelgaenger";

    // Position des VORHANDENEN Eintrags - #61 schreibt sie in die Q4-Bewegung und
    // darf dort keine erfundene Zahl stehen haben.
    expect(q1.fuegeAnsEndeAn(zweiterVersuch)).toBe(1);
    expect(ids(q1.alleQ1())).toEqual(["a1", "a2"]);
    // Weder ersetzt (das tauschte hier einen LAUFENDEN Auftrag unter der Hand aus)
    // noch verschoben (das braeche FIFO fuer einen bereits Wartenden).
    expect(q1.findeQ1("a1")?.auftrag).toBe(a1);
    expect(q1.findeQ1("a1")?.auftrag.label).toBe("Import a1");
  });
});
