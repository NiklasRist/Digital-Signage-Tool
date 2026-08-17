// Unit-Tests zu #301 – die Kontrast-Warnung des Marken-Editors (FA-24).
//
// Die Datei ist reine Renderer-UI ohne IPC, ohne Dateisystem und ohne Speicher. Die
// vitest-Umgebung ist "node"; es gibt weder testing-library noch react-dom/test-utils
// im Projekt – deshalb werden die Komponenten-Tests wie bei den uebrigen
// Renderer-Dateien strukturell gefuehrt: `KontrastWarnung` ist eine Funktion, die
// `JSX.Element | null` zurueckgibt, und wird direkt aufgerufen; das zurueckgegebene
// React-Element wird inspiziert, statt es in ein DOM zu rendern.
//
// Die DoD verlangt einen Spy-Test fuer das Aufrufmuster von `ermittleKontrastHinweis`.
// Dafuer wird der Kontrast-Modul-Namespace von #292 bespitzelt – dasselbe Muster wie
// in zeitachse.spec.ts. `erreichtKontrastSchwelle` wird dabei mit einer
// Ersatz-Implementierung belegt, damit ihr interner (echter) Aufruf von
// `kontrastVerhaeltnis` den Zaehler der "genau zweimal"-Probe nicht verfaelscht.
import { readFileSync } from "node:fs";

import { afterEach, describe, expect, it, vi } from "vitest";

import * as kontrastModul from "../../src/renderer/gemeinsam/kontrast";
import {
  KontrastWarnung,
  ermittleKontrastHinweis,
} from "../../src/renderer/marken-editor/kontrast-warnung";
import { SICHERHEITSABSTAND_PX } from "../../src/shared/contracts/konstanten";
import type { FarbRolle, Marke } from "../../src/shared/contracts/marke";

const QUELLE = readFileSync(
  new URL("../../src/renderer/marken-editor/kontrast-warnung.tsx", import.meta.url),
  "utf8",
);

// Nur der Code, ohne Kommentarzeilen – die Grep-Proben der DoD pruefen den Rumpf.
const CODEZEILEN = QUELLE.split("\n")
  .filter((z) => {
    const t = z.trim();
    return !t.startsWith("//") && !t.startsWith("*") && !t.startsWith("/*");
  })
  .join("\n");

// Trailing-Kommentare auf Codzeilen entfernen: Die VERBINDLICHEN Signatur-Kommentare
// stehen AUF Codzeilen (z. B. `schwellenwert: number   // KONTRAST_SCHWELLE (4.5) ...`).
// Die DoD-Grep-Proben pruefen die ZWEITE QUELLE (eigenes Literal, eigener Import) –
// ein Kommentar der Signatur ist keine. Ohne diesen Filter wuerde eine Probe den
// eigenen verbindlichen Signaturblock falsch anzeigen (siehe CLAUDE.md: "Grep-Proben
// unterscheiden nicht zwischen Code und Prosa").
const CODE_OHNE_TRAILING_KOMMENTARE = CODEZEILEN.split("\n")
  .map((z) => z.split("//")[0])
  .join("\n");
const IMPORTE = CODEZEILEN.split("\n")
  .filter((z) => z.trim().startsWith("import "))
  .join("\n");

// Die dreizehn Farb-Rollen mit den Werten aus TK 9.11.2 (wie farben.spec.ts).
const FARBEN: Record<FarbRolle, string> = {
  akzent: "#FF4040",
  akzentKraeftig: "#DF3131",
  akzentTief: "#971316",
  flaecheDunkel: "#2F2E2E",
  flaecheSehrDunkel: "#4B090B",
  flaecheHell: "#FFFFFF",
  flaecheAkzentZart: "#F5AEAF",
  textAufDunkel: "#FFFFFF",
  textAufHell: "#202020",
  textSekundaer: "#8F8F8F",
  linie: "#CCCCCC",
  scrimStart: "#00000000",
  scrimEnde: "#000000B3",
};

const marke = (farben: Record<FarbRolle, string> = FARBEN): Marke => ({
  farben,
  schriften: {
    headlineElegant: { familie: "Playfair Display", gewicht: 700, datei: "PlayfairDisplay-Bold.woff2" },
    headlinePlakativ: { familie: "Archivo Black", gewicht: 900, datei: "ArchivoBlack-Regular.woff2" },
    fliesstext: { familie: "Arimo", gewicht: 400, datei: "Arimo-Regular.woff2" },
    fliesstextFett: { familie: "Arimo", gewicht: 700, datei: "Arimo-Bold.woff2" },
  },
  logo: { datei: "logo.png", seitenverhaeltnis: 3.5 },
  sicherheit: SICHERHEITSABSTAND_PX,
  radien: { pille: 40, karte: 10, klein: 2 },
  schatten: { versatzY: 4, weichzeichnen: 8, farbe: "#00000040" },
  slogan: { text: "", aktiv: false },
});

// Beide Text-Rollen hell: beide Kontraste gegen #FF4040 liegen unter 4,5 (3,47) –
// der Hinweis muss also erscheinen. KRUMM gewaehlt, damit kein glatter Wert
// zufaellig "aufgeht" (siehe CLAUDE.md).
const WEISSE_TEXTE = { ...FARBEN, textAufDunkel: "#FFFFFF", textAufHell: "#FFFFFF" };

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ermittleKontrastHinweis – Aufrufmuster (DoD: Spy)", () => {
  it("ruft kontrastVerhaeltnis genau zweimal (je Text-Rolle) und erreichtKontrastSchwelle genau einmal", () => {
    const kontrastSpion = vi.spyOn(kontrastModul, "kontrastVerhaeltnis");
    const schwelleSpion = vi
      .spyOn(kontrastModul, "erreichtKontrastSchwelle")
      .mockImplementation(() => false);
    // Erste Rolle textAufDunkel (3.0), zweite textAufHell (7.0) – der hoehere gewinnt.
    kontrastSpion
      .mockImplementationOnce(() => 3.0)
      .mockImplementationOnce(() => 7.0);

    const m = marke();
    const ergebnis = ermittleKontrastHinweis(m, 4.5);

    expect(kontrastSpion).toHaveBeenCalledTimes(2);
    expect(kontrastSpion).toHaveBeenNthCalledWith(1, m.farben.akzent, m.farben.textAufDunkel);
    expect(kontrastSpion).toHaveBeenNthCalledWith(2, m.farben.akzent, m.farben.textAufHell);
    expect(schwelleSpion).toHaveBeenCalledTimes(1);
    // Die Text-Rolle des HOEHEREN Verhaeltnisses (textAufHell), dahinter akzent + schwellenwert.
    expect(schwelleSpion).toHaveBeenCalledWith(m.farben.textAufHell, m.farben.akzent, 4.5);
    expect(ergebnis).toEqual({ verhaeltnis: 7.0, ausreichend: false });
  });

  it("uebergibt textAufDunkel, wenn es das hoehere Verhaeltnis hat (DoD)", () => {
    const kontrastSpion = vi.spyOn(kontrastModul, "kontrastVerhaeltnis");
    const schwelleSpion = vi
      .spyOn(kontrastModul, "erreichtKontrastSchwelle")
      .mockImplementation(() => true);
    kontrastSpion
      .mockImplementationOnce(() => 7.0)
      .mockImplementationOnce(() => 3.0);

    const m = marke();
    const ergebnis = ermittleKontrastHinweis(m, 4.5);

    expect(kontrastSpion).toHaveBeenCalledTimes(2);
    expect(schwelleSpion).toHaveBeenCalledTimes(1);
    expect(schwelleSpion).toHaveBeenCalledWith(m.farben.textAufDunkel, m.farben.akzent, 4.5);
    expect(ergebnis.verhaeltnis).toBe(7.0);
  });

  it("waehlt bei exakt gleichem Verhaeltnis textAufDunkel (vAufDunkel >= vAufHell)", () => {
    const kontrastSpion = vi.spyOn(kontrastModul, "kontrastVerhaeltnis");
    const schwelleSpion = vi
      .spyOn(kontrastModul, "erreichtKontrastSchwelle")
      .mockImplementation(() => false);
    kontrastSpion.mockImplementation(() => 5.0);

    ermittleKontrastHinweis(marke(), 4.5);

    expect(kontrastSpion).toHaveBeenCalledTimes(2);
    expect(schwelleSpion).toHaveBeenCalledTimes(1);
    expect(schwelleSpion).toHaveBeenCalledWith(FARBEN.textAufDunkel, FARBEN.akzent, 4.5);
  });
});

describe("ermittleKontrastHinweis – echte Rechnung aus #292", () => {
  it("meldet das bessere der beiden Verhaeltnisse und rechnet NICHT selbst", () => {
    const m = marke();
    const ergebnis = ermittleKontrastHinweis(m, 4.5);
    const vAufDunkel = kontrastModul.kontrastVerhaeltnis(m.farben.akzent, m.farben.textAufDunkel);
    const vAufHell = kontrastModul.kontrastVerhaeltnis(m.farben.akzent, m.farben.textAufHell);
    // #FF4040 gegen #202020: 4,701295804493134 (krummer Wert, aus kontrast.spec.ts).
    expect(ergebnis.verhaeltnis).toBe(Math.max(vAufDunkel, vAufHell));
    expect(ergebnis.verhaeltnis).toBeCloseTo(4.701295804493134, 10);
    expect(ergebnis.ausreichend).toBe(true);
  });
});

describe("KontrastWarnung – null bei ausreichendem Kontrast (DoD)", () => {
  it("liefert null, wenn ermittleKontrastHinweis(...).ausreichend true ist", () => {
    const m = marke(); // akzent #FF4040, textAufHell #202020 → 4,70 >= 4,5
    expect(ermittleKontrastHinweis(m, 4.5).ausreichend).toBe(true);
    expect(KontrastWarnung({ marke: m, schwellenwert: 4.5 })).toBeNull();
  });
});

describe("KontrastWarnung – sichtbarer, nicht blockierender Hinweis (DoD)", () => {
  it("liefert ein sichtbares Element, wenn ausreichend false ist", () => {
    const m = marke(WEISSE_TEXTE); // beide Kontraste 3,47 < 4,5
    expect(ermittleKontrastHinweis(m, 4.5).ausreichend).toBe(false);

    const element = KontrastWarnung({ marke: m, schwellenwert: 4.5 });
    expect(element).not.toBeNull();
    if (element === null) return;

    // Ein intrinsisches DOM-Element (div) ist sichtbar; ein reines Ableitungs-Signal
    // waere z. B. eine Zeichenkette. role="status" kennzeichnet einen Hinweis.
    expect(typeof element.type).toBe("string");
    expect(element.type).toBe("div");
    expect(element.props.role).toBe("status");
    const text = String(element.props.children);
    // Das `verhaeltnis` darf laut Issue im Text angezeigt werden (3,4656945736142615 → "3.47").
    expect(text).toContain("3.47");
  });

  it("blockiert keine Eingabe – kein disabled, kein Overlay, keine Klick-Falle", () => {
    const m = marke(WEISSE_TEXTE);
    const element = KontrastWarnung({ marke: m, schwellenwert: 4.5 });
    if (element === null) return;

    // Kein Steuerelement (nur ein Hinweisblock), kein deaktivierendes Attribut und
    // nichts, was Klicks abfaengt (kein Overlay-Positionierung, keine pointerEvents).
    expect(element.props.disabled).toBeUndefined();
    expect(element.props.style?.position).toBeUndefined();
    expect(element.props.style?.pointerEvents).toBeUndefined();
  });
});

describe("KontrastWarnung – schwellenwert kommt von aussen (DoD)", () => {
  it("liefert bei verschiedenen schwellenwert-Werten verschiedene Ergebnisse – kein eingebauter Wert", () => {
    const m = marke(WEISSE_TEXTE);
    // 4,5: Kontrast 3,47 reicht nicht → Hinweis.
    expect(KontrastWarnung({ marke: m, schwellenwert: 4.5 })).not.toBeNull();
    // 3,0: Kontrast 3,47 reicht → null. Nur das Prop kann diese Entscheidung tragen.
    expect(KontrastWarnung({ marke: m, schwellenwert: 3.0 })).toBeNull();
  });
});

describe("KontrastWarnungProps.schwellenwert – Pflicht-Prop (DoD)", () => {
  it("fehlt schwellenwert, ist das Rendering ein Typfehler (ts-expect-error-Probe)", () => {
    const rendereOhneSchwellenwert = () => {
      // @ts-expect-error schwellenwert ist ein Pflicht-Prop ohne Vorgabewert (DoD)
      return KontrastWarnung({ marke: marke() });
    };
    expect(rendereOhneSchwellenwert).toBeTypeOf("function");
  });
});

describe("8-stellige Markenwerte (Alpha, in #292 entschieden)", () => {
  it("rechnet ein achtstelliges akzent wie das sechsstellige und wirft NICHT (DoD)", () => {
    const m = marke({ ...FARBEN, akzent: "#FF4040CC" });
    expect(() => ermittleKontrastHinweis(m, 4.5)).not.toThrow();
    // Alphakanal wird ignoriert: identisch zu #FF4040 gegen #202020.
    expect(ermittleKontrastHinweis(m, 4.5).verhaeltnis).toBe(
      kontrastModul.kontrastVerhaeltnis("#FF4040", "#202020"),
    );
    expect(() => KontrastWarnung({ marke: m, schwellenwert: 4.5 })).not.toThrow();
  });

  it("zeigt bei achtstelligem akzent und unzureichendem Kontrast einen Hinweis statt zu werfen (DoD)", () => {
    const m = marke({ ...WEISSE_TEXTE, akzent: "#FF4040CC" });
    expect(() => KontrastWarnung({ marke: m, schwellenwert: 4.5 })).not.toThrow();
    expect(KontrastWarnung({ marke: m, schwellenwert: 4.5 })).not.toBeNull();
  });
});

describe("Bauvorschriften dieser Datei (DoD-Grep-Proben)", () => {
  it("rechnet keine Helligkeit/Luminanz/Kontrast selbst – nur Math.max als Vergleich (DoD)", () => {
    const ohneMathMax = CODEZEILEN.replace(/Math\.max/g, "");
    expect(ohneMathMax).not.toMatch(/Math\./);
  });

  it("fuehrt keinen Schwellenwert als Zahlen-Literal (3.0/4.5/7.0/7.1) – zweite Quelle verboten (DoD)", () => {
    expect(CODE_OHNE_TRAILING_KOMMENTARE).not.toMatch(/(^|[^0-9])4\.5([^0-9]|$)/);
    expect(CODE_OHNE_TRAILING_KOMMENTARE).not.toMatch(/(^|[^0-9])3\.0([^0-9]|$)/);
    expect(CODE_OHNE_TRAILING_KOMMENTARE).not.toMatch(/(^|[^0-9])7\.0([^0-9]|$)/);
    expect(CODE_OHNE_TRAILING_KOMMENTARE).not.toMatch(/(^|[^0-9])7\.1([^0-9]|$)/);
  });

  it("importiert nichts aus shared/contracts/konstanten, insbesondere nicht KONTRAST_SCHWELLE (DoD)", () => {
    expect(IMPORTE).not.toMatch(/shared\/contracts\/konstanten/);
    expect(IMPORTE).not.toMatch(/KONTRAST_SCHWELLE/);
  });

  it("exportiert keine eigene Schwellenwert-Konstante (DoD)", () => {
    expect(CODEZEILEN).not.toMatch(/export const (KONTRAST|SCHWELLENWERT)/);
  });

  it("enthaelt kein try/catch und keine Zeichenketten-Operation auf einem Farbwert (DoD)", () => {
    expect(CODEZEILEN).not.toMatch(/\btry\b|\bcatch\b/);
    expect(CODEZEILEN).not.toMatch(/\.(slice|substring|replace)\(/);
    expect(CODEZEILEN).not.toMatch(/length\s*===\s*9/);
  });

  it("enthaelt kein rufeAuf, keinen IPC-Kanal, kein fs, kein BrowserWindow (DoD)", () => {
    expect(CODEZEILEN).not.toMatch(/rufeAuf/);
    expect(CODEZEILEN).not.toMatch(/\bipc\b/i);
    expect(CODEZEILEN).not.toMatch(/\bfs\b/);
    expect(CODEZEILEN).not.toMatch(/BrowserWindow/);
  });
});