# Übergabe – 13.11.2026 (einundsechzigste Sitzung): FA-29 freigestellt, #474 gebaut

**Volltext der Sitzung.** Kurzfassung in [`CLAUDE.md`](../../CLAUDE.md), Abschnitt „STAND HEUTE".

---

## 1. Auftrag

Niklas: „schau dir die übergabe an", dann auf die Rückfrage, womit angefangen werden soll:
**#474 (FA-29) freistellen**. Das Issue setzt #473 (FA-28) voraus – der Stand war da.

## 2. Was gebaut ist

Ein Produktbild bekommt einen **transparenten Hintergrund**. Gerechnet wird **lokal im
Renderer** über ONNX Runtime Web (WASM) – kein Dienst im Netz (NFA-06), keine Bildbytes über
IPC (9.1.1), kein natives Modul im Paket.

- **Datenmodell:** `Aktion.freistellen?: boolean | null`. Nur `true` ist eingeschaltet;
  `false`, `null` und „Feld fehlt" sind derselbe Zustand (`normalisiereFreistellen` in
  `src/shared/aufbereitung.ts`). Keine Migration.
- **Speicherweg:** `erstelle-aktion` und `bearbeite-aktion` übernehmen das Feld; Ausschalten
  **leert** es (`null`), es wird nie `false` geschrieben.
- **Schlüssel:** `motivSchluessel(bildRef, aufbereitung, freistellen)` trägt den Schalter;
  `bereiteMotiveVor` rechnet **einmal je (Asset, Einstellungen)** und legt das Ergebnis unter
  `<assetId>#…|f` ab. `zeichne-segment` schlägt an **einer** Stelle nach.
- **Reihenfolge:** `AUFBEREITUNG_SCHRITTE = ['freistellen', 'helligkeit', 'kontrast', 'schaerfe']`.
  Der Modell-Schritt ist der einzige asynchrone und läuft in `bereiteAuf` **vor** dem
  Byteschritt; die Schleife überspringt ihn (eine Quelle, kein zweiter Weg).
- **Modell:** **U-2-Net, kleine Fassung (`u2netp`)**. 4 574 861 Bytes, SHA-256
  `309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8`, Apache License 2.0
  (Xuebin Qin). Datei: `public/modell/freistellen.onnx`, Lizenztext daneben.
  Die **große** Fassung (`u2net`, 176 MB) reißt den Zaun – deshalb die kleine.
- **Protokoll:** `src/main/modell-protokoll.ts`, `modell://` mit denselben fünf Rechten wie
  `marken://`. **Drei feste Namen** (s. Abweichung 1).
- **Editor:** Schalter „Freistellen" in der Gruppe „Aufbereitung" mit Ladetext, Fortschritt,
  Klartext bei Ausfall und gesperrtem Schalter. Ein Schalten ist **ein** Undo-Schritt.

## 3. Messungen am echten Fenster (13.11.2026)

**Beleg-Skript `scripts/beleg-freistellen.mjs`** (1920 × 1080, weißer Grund, blaues Rechteck):

| Größe | vorher | nachher |
|---|---|---|
| Vorschau-Hash | 3428465122 | 754081738 |
| Ecke (3,3) | (255, 255, 255) weiß | **(47, 46, 46)** Fläche der Vorlage |
| Mitte | (46, 79, 161) Produkt | **(46, 79, 161)** unverändert |
| nach dem Ausschalten | – | **3428465122** = byte-gleich |

**Treiber-Schritt `4v`** (Lauf vom 13.11.2026, `EXIT=0`, 0 Befunde):

```
Hashes 1972816074 -> 1374350399 -> 1972816074 -> 1374350399 -> 1972816074
Ecke vorher=[255,255,255,255] nachher=[47,46,46,255]
Mitte vorher=[46,79,161,255] nachher=[46,79,161,255]
Laden+Rechnen=2436 ms, nur Rechnen=2015 ms, Hinweis=null
Nicht-destruktiv: Gespeichert=true, freistellen=true, Assets=5, Medien 3 -> 3, byte-gleich=true
```

**Der Zaun (TK 9.21.5), gemessen statt geschätzt:**

| Größe | Wert | Grenze |
|---|---|---|
| Modell laden | **434 / 439 ms** (`[freistellen] Modell in … ms geladen`) | ≤ 2 s ✔ |
| Bild rechnen (1920 × 1080) | **1998 / 2014 / 2138 ms** (drei Läufe) | ≤ 5 s ✔ |
| Zusatzgewicht im Paket | **19 719 516 Bytes = 18,8 MiB** | ≤ 25 MB ✔ |

Das Zusatzgewicht ist **gemessen**, nicht addiert: derselbe Baum einmal **ohne** den
ONNX-Import und ohne Modell/Kopierschritt gebaut (`dist` = 7 572 359 Bytes), einmal **mit**
(`dist` = 27 291 875 Bytes). Differenz = 19 719 516 Bytes; darin: Modell 4 574 861,
WASM-Runtime 14 848 852, Lader 24 738, Lizenz 12 034, Bundle + Map rund 271 000.

**Paket:** `npm run dist` Exit 0. `app.asar` = 36 523 581 Bytes, enthält
`dist/renderer/modell/freistellen.onnx`, `ort-wasm-simd-threaded.wasm` und `…mjs`;
**kein** `node_modules/onnxruntime-web` (devDependency). Das gestartete Paket liefert
`modell://freistellen.onnx` **200 / 4 574 861**, `…wasm` **200 / 14 848 852**,
`…mjs` **200 / 24 738** und `modell://geheim.onnx` **404**.

## 4. Abweichungen vom Issue – gemeldet, nicht stillschweigend gelöst

1. **`modell://` bedient DREI feste Namen, nicht einen.** Das Issue nennt „genau EIN Ziel:
   `modell://freistellen.onnx`". Das Modell ist aber nicht die einzige Datei, die der
   Renderer unter `file://` nicht laden kann: ONNX Runtime Web zieht seine WASM-Runtime
   **und deren Lader** nach. Gemessen: ohne den Lader meldet das Fenster „cannot determine
   the script source URL" / CSP-Blockade und das Freistellen ist „nicht verfügbar".
   Die Alternative – Lader als BASE64 im Renderer-Bundle – kostete ~19 MB **Text** im
   Bundle; ein IPC-Weg ist in 9.21.8 ausdrücklich ausgeschlossen. Der **Schutzgedanke** des
   Issues bleibt unangetastet: kein Pfad aus der Anfrage, kein `path.join` mit
   Anfrageanteilen, alles andere 404 (17 Tests).
2. **CSP erweitert um `'wasm-unsafe-eval'`** (und `modell:` in `script-src`). Ohne
   `'wasm-unsafe-eval'` verweigert Chromium **jede** WebAssembly-Kompilierung – gemessen.
   Der Wert erlaubt ausschließlich WASM; `eval()` und `new Function()` bleiben verboten.
   Die Alternative wäre `'unsafe-eval'` gewesen, also das Gegenteil dieser CSP.
3. **Vite löscht das vom Bundler erzeugte `.wasm`-Asset.** ONNX Runtime Web enthält ein
   `new URL('ort-wasm-simd-threaded.wasm', import.meta.url)`; Vite legt die Datei daraufhin
   ein zweites Mal unter `assets/` ab. Gemessen: damit lagen **29,7 MB** WASM im Paket und
   der Zaun war gerissen (34,5 MB Zusatzgewicht). Die Kopie wird nie geladen, weil
   `wasmPaths` vor dem ersten Lauf auf `modell://` gesetzt wird.
4. **TK 9.21.9 sagt weiter „das Modell ist noch nicht gewählt".** Das Issue verbietet eine
   Änderung an AD/TK, deshalb **nicht angefasst** – hier und im Abschlusskommentar gemeldet.

## 5. Eigene Fehler, selbst gefunden

1. **Der Entwurf verlor Felder während des Bildladens** (`aendere` schrieb
   `{...entwurf, ...aenderung}` aus der Closure zurück). Am Fenster: Titel tippen, Bild
   wählen, „Anlegen" – und der Knopf tat **still nichts**, weil der Entwurf wieder ohne
   Titel dastand. **Behoben** mit dem Funktions-Updater; Regressionstest in
   `tests/unit/action-editor-neue-aktion.spec.ts`, Gegenprobe rot.
2. **Der Lazy-Test war blind.** Die vierte Gegenprobe (Modell beim Import laden) blieb
   **grün**, weil `beforeEach` die Zähler nach dem Import zurücksetzte. Der Zähler steht
   jetzt **vor** dem dynamischen Import – danach war die Gegenprobe rot.
3. **`app.getAppPath()` ist beim Start über `electron dist/main/index.cjs` selbst
   `dist/main`** (am Fenster gemessen) – als Wurzel untauglich. Die Pfade kommen jetzt aus
   `__dirname` (…/dist/main) plus festen relativen Teilen; im Test über `setzeModellWurzel`.
4. **Der Medienordner heißt `media`, nicht `medien`.** Die erste Fassung des Treiber-Schritts
   verglich zwei **leere** Listen und war damit grün, ohne etwas zu prüfen.

## 6. Gegenproben (jede rot, jede byte-identisch zurück)

| # | Probe | Ergebnis |
|---|---|---|
| 1 | `modell://` gibt jeden Namen als den Modellnamen aus | 4 Tests rot, restored (SHA-256 gleich) |
| 2 | `stelleFrei` liefert bei Ausfall ein leeres Bild statt `nicht_verfuegbar` | 1 Test rot |
| 3 | `motivSchluessel` ignoriert `freistellen` | 4 Tests rot |
| 4 | Modell wird beim Import geladen (nicht lazy) | 1 Test rot (nachdem der Test geschärft war) |
| 5 | `aendere` schreibt wieder aus der Closure | Regressionstest rot |

## 7. Gate (13.11.2026)

Typecheck **0**, Lint **0** (eine vorbestehende Warnung in `scripts/beleg-effekt-render.mjs`),
Build **0**, Unit **5873/5873** (385 Dateien), Integration **63/63** (18 Dateien),
Treiber **0 Befunde** (`EXIT=0`), `npm run dist` **Exit 0**, Paket startet.

Neu: `tests/unit/modell-protokoll.spec.ts` (17), `tests/unit/freistellen.spec.ts` (9),
`tests/unit/freistellen-schalter.spec.ts` (6), `tests/integration/freistellen-speicherweg.spec.ts` (2).

## 8. Ehrlich offen

- **Der Ausfall ist nicht am Fenster gezeigt.** Das Modell liegt im Paket; der Ausfall ist
  durch Unit-Tests (Modell fehlt / lädt nicht / Rechnung scheitert) und den gesperrten
  Schalter belegt. Dieselbe Aufteilung wie bei #470 (dort war der Erfolgsweg nicht am Fenster).
- **Der Renderweg ist nicht gemessen** (70 s je Segment). Er läuft durch dieselbe
  Nachschlagestelle; belegt durch Unit-Tests und die gemeinsame Zeichenroutine (9.10.1).
- **Am Fernseher ist nichts geprüft.** Ein transparenter Rand und eine weiche Kante sehen
  auf 85 Zoll anders aus als im Fenster (9.21.9).
- **Die Rechenzeit ist nicht auf schwächerer Hardware gemessen.** 2,0–2,1 s bei 1920 × 1080
  auf dem Entwicklungsrechner (Intel i9-9880H). Der Zaun hat Luft bis 5 s, aber ein
  Notebook von 2017 ist nicht gemessen.
- **`freistellen` ist im Entwurf nicht „rückgängig zu machen", ohne neu zu rechnen** – das
  Ausschalten fällt auf das rohe Motiv zurück (Bestand trägt beides unter zwei Schlüsseln).

## 9. Stand für den nächsten Schritt

- **Nicht gepusht.** `git log --oneline origin/main..HEAD` zählen.
- Offen: **#472** (FA-30, TK 9.20), **#466** (Referenzlauf, Phase 1 mit Stoppuhr),
  **#458** (überholt). `bereitschaft.py` meldet „0 bereit" (keine Meilensteine an den neuen
  Issues).
- **Nächster Schritt nach #474:** entweder **#472** (Produktseite finden) oder der
  Referenzlauf **#466** – beides braucht eine Entscheidung, nicht nur Arbeit.
