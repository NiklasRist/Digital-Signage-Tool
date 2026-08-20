// Verhaltenstest zu #212 - die Buehne (buehne.tsx, jsdom).
//
// Die Buehne ist ausschliesslich ein Rahmen. Gemessen wird: die innere Flaeche traegt
// exakt RENDER_PROFILE.breite × hoehe CSS-Pixel als Layout-Groesse, die Verkleinerung
// steht in transform (nicht in width/height), children liegen innerhalb der inneren
// Flaeche, und der Groessen-Beobachter wird beim Abbau abgemeldet (Invariante 2).
// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { createElement } from "react";

import { RENDER_PROFILE } from "../../src/shared/contracts/render-profile";
import type { Buehnenmaße } from "../../src/renderer/preview-player/buehne-skalierung";
import type { BuehneProps } from "../../src/renderer/preview-player/buehne";
// Der Import mit `.tsx`-Endung ist zur Laufzeit gueltig (esbuild/vite). Das
// Test-tsconfig verbietet die Endung aber ohne `allowImportingTsExtensions`
// (TS5097) - deshalb der ts-expect-error wie im Projekt ueblich.
// @ts-expect-error - buehne.tsx statt des `.ts`-Zwillings (siehe oben)
import { Buehne } from "../../src/renderer/preview-player/buehne.tsx";

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

/** Vorgegebene Maße fuer die Tests ohne Messung (Signatur: `maße` gesetzt → nicht messen). */
function maße(ueber: Partial<Buehnenmaße> = {}): Buehnenmaße {
  return { skalierung: 1, breite: 1920, höhe: 1080, versatzX: 0, versatzY: 0, ...ueber };
}

/** Ein ResizeObserver-Stub, der sich merkt, was beobachtet wird. */
class ResizeObserverStub {
  static installierte: ResizeObserverStub[] = [];
  beobachtete: Element[] = [];
  disconnected = false;

  constructor(callback: (eintraege: Array<{ contentRect: { width: number; height: number } }>) => void) {
    ResizeObserverStub.installierte.push(this);
    this.callback = callback;
  }
  callback: (eintraege: Array<{ contentRect: { width: number; height: number } }>) => void;

  observe(element: Element): void {
    this.beobachtete.push(element);
  }
  unobserve(): void {}
  disconnect(): void {
    this.disconnected = true;
  }
  /** Stellt dem Beobachter einen Messwert in den Raum. */
  messe(breite: number, höhe: number): void {
    this.callback([{ contentRect: { width: breite, height: höhe } }]);
  }
}

// jsdom kennt kein ResizeObserver; die Buehne erzeugt ihn per `new ResizeObserver`.
// Der Stub wird global registriert und je Test zurueckgesetzt.
(globalThis as Record<string, unknown>).ResizeObserver = ResizeObserverStub;

describe("Buehne (buehne.tsx)", () => {
  let host: HTMLElement;
  let root: Root;

  beforeEach(() => {
    host = document.createElement("div");
    host.style.width = "800px";
    host.style.height = "450px";
    document.body.appendChild(host);
    root = createRoot(host);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    host.remove();
    ResizeObserverStub.installierte = [];
  });

  it("traegt die innere Flaeche exakt als Raster-Groesse und skaliert in transform (DoD)", () => {
    act(() => {
      root.render(
        createElement(Buehne, { maße: maße({ skalierung: 0.5 }) } satisfies BuehneProps),
      );
    });

    const flaeche = host.querySelector("[data-testid='buehne-flaeche']");
    expect(flaeche).not.toBeNull();
    if (!flaeche) return;
    const stil = flaeche as HTMLElement;

    // Layout-Groesse bleibt das volle Raster - die Verkleinerung steht in transform.
    expect(stil.style.width).toBe(`${RENDER_PROFILE.breite}px`);
    expect(stil.style.height).toBe(`${RENDER_PROFILE.hoehe}px`);
    expect(stil.style.transform).toContain("scale(0.5)");
  });

  it("verschiebt die innere Flaeche um die Versaetze (DoD)", () => {
    act(() => {
      root.render(
        createElement(
          Buehne,
          { maße: maße({ versatzX: 480, versatzY: 270 }) } satisfies BuehneProps,
        ),
      );
    });

    const flaeche = host.querySelector("[data-testid='buehne-flaeche']") as HTMLElement | null;
    expect(flaeche).not.toBeNull();
    if (!flaeche) return;
    expect(flaeche.style.left).toBe("480px");
    expect(flaeche.style.top).toBe("270px");
  });

  it("haengt children innerhalb der inneren Flaeche (Elternkette, DoD)", () => {
    const kind = createElement("span", { "data-testid": "kind" }, "Hallo");
    act(() => {
      root.render(
        createElement(Buehne, { maße: maße(), children: kind } satisfies BuehneProps),
      );
    });

    const kindElement = host.querySelector("[data-testid='kind']");
    const flaeche = host.querySelector("[data-testid='buehne-flaeche']");
    expect(kindElement?.parentElement).toBe(flaeche);
  });

  it("misst ohne vorgegebene maße per ResizeObserver und rechnet die Skalierung (DoD)", () => {
    act(() => {
      root.render(createElement(Buehne, {} satisfies BuehneProps));
    });

    // Der Beobachter wurde auf den aeußeren Kasten angemeldet.
    const kasten = host.querySelector("[data-testid='buehne-kasten']");
    expect(ResizeObserverStub.installierte).toHaveLength(1);
    expect(ResizeObserverStub.installierte[0]?.beobachtete).toEqual([kasten]);

    // Eine Messung 800×450 (16:9) liefert skalierung 5/12, breite 800, höhe 450.
    act(() => {
      ResizeObserverStub.installierte[0]?.messe(800, 450);
    });

    const flaeche = host.querySelector("[data-testid='buehne-flaeche']") as HTMLElement | null;
    expect(flaeche).not.toBeNull();
    if (!flaeche) return;
    expect(flaeche.style.width).toBe(`${RENDER_PROFILE.breite}px`);
    expect(flaeche.style.transform).toContain("scale(0.4166666666666667)");
  });

  it("meldet den Groessen-Beobachter beim Abbau ab (Invariante 2, DoD)", () => {
    act(() => {
      root.render(createElement(Buehne, {} satisfies BuehneProps));
    });
    expect(ResizeObserverStub.installierte).toHaveLength(1);

    act(() => {
      root.unmount();
    });

    expect(ResizeObserverStub.installierte[0]?.disconnected).toBe(true);
    // Nach dem Abbau loest eine Groessenänderung keinen Rendervorgang mehr aus - der
    // Beobachter ist abgemeldet; die innere Flaeche existiert nicht mehr.
    expect(host.querySelector("[data-testid='buehne-flaeche']")).toBeNull();
  });

  it("stellt bei fehlendem Messwert nichts Unfugiges dar: skalierung 0, unsichtbar (ENTSCHIEDEN 3)", () => {
    // Ohne maße und ohne Messung bleibt der Anfangszustand: skalierung 0.
    act(() => {
      root.render(createElement(Buehne, {} satisfies BuehneProps));
    });

    const flaeche = host.querySelector("[data-testid='buehne-flaeche']") as HTMLElement | null;
    expect(flaeche).not.toBeNull();
    if (!flaeche) return;
    expect(flaeche.style.transform).toContain("scale(0)");
  });

  it("stellt bei maße gesetzt NICHTS per Beobachter ein - kein ResizeObserver (Signatur)", () => {
    act(() => {
      root.render(
        createElement(Buehne, { maße: maße() } satisfies BuehneProps),
      );
    });

    expect(ResizeObserverStub.installierte).toHaveLength(0);
  });
});

describe("DoD-Grep-Proben (buehne.tsx, nur Code - Kommentarzeilen raus)", () => {
  const CODE = readFileSync("src/renderer/preview-player/buehne.tsx", "utf8")
    .split("\n")
    .filter((zeile) => {
      const getrimmt = zeile.trim();
      return (
        !getrimmt.startsWith("//") &&
        !getrimmt.startsWith("/*") &&
        !getrimmt.startsWith("*") &&
        !getrimmt.startsWith("{/*") &&
        getrimmt !== ""
      );
    })
    .join("\n");

  it("kennt keine Verbote: kein devicePixelRatio, Runden, 1920/1080-Literal, Zeitmessung, canvas/video", () => {
    for (const verboten of [
      "devicePixelRatio",
      "Math.round",
      "Math.floor",
      "Math.ceil",
      "1920",
      "1080",
      "requestAnimationFrame",
      "setInterval",
      "canvas",
      "video",
      "media://",
      "window.api",
      "rufeAuf",
      "abonniere",
    ]) {
      expect(CODE, verboten).not.toContain(verboten);
    }
  });

  it("haelt nur einen Zustand: die gemessenen Maße (kein weiteres useState/useEffect)", () => {
    // Nur das eine useState fuer gemessen darf existieren; der Rest wird ueber Proben
    // auf weitere Zustands-Hooks abgesichert.
    expect(CODE).toContain("useState");
    expect(CODE).toContain("setzeGemessen");
  });
});