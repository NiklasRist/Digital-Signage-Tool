# Übergabe 09.11.2026 — Effekte: vom Bildplan bis zum gemessenen Video (fünfundfünfzigste Sitzung)

**Vorgeschichte (54. Sitzung, vormittags):**
[`uebergabe-2026-11-09-effekte.md`](uebergabe-2026-11-09-effekte.md) — AD v1.14/TK v3.55, #459–#463
gebaut und geschlossen, Fensterbeleg der Vorschau, **#464 offen**.

**Fortsetzung (diese Sitzung):** #464 gebaut **und verdrahtet**, der Motiv-Render repariert, der
Treiber-Schritt für FA-25 gebaut — dabei zwei Fehler gefunden, die den ganzen Weg vorher
unerreichbar machten.

---

## 1. #464 — der Bildplan im Render (`1e23754`)

Vertrag (`RenderItemSegment` trägt `png` **oder** `bildplan`), `bildfolge.ts` (je Frame ein Eingang,
je Lauf `concat` + `loop`, am Ende `setpts=N/FRAME_RATE/TB`), Prüfung in `validierung.ts`
(Summe = `dauer × 30`, jeder Frame 1920 × 1080), `bildfolgeDateiname` in `png-ablage.ts`,
Effekt-Weg in `normalisieren.ts`.

**Beleg (echtes ffmpeg, `tests/integration/bildfolge-echt.spec.ts`):** 60 eindeutige Frames × 5 →
**300 Bilder, 10,000 s**. **Gegenprobe** ohne das abschließende `setpts`: **243 Bilder** (der
Encoder verwirft die Dubletten). Die Reihenfolge ist mitgeprüft: Bild 0, 60, 120 … tragen dieselbe
Farbe, Bild 0 und 1 unterscheiden sich.

**DoD-Abweichung, gemeldet:** `render-reel.ts` (sechste Produktivdatei) musste die Plan-Pfade aus
der Ablage an `normalisieren` durchreichen — ohne sie wäre der Weg unerreichbar.

## 2. Der Produzent im Renderer (`7b19f03`)

`render-ausloesen.ts` baut das Segment jetzt über **einen** Weg: ohne Effekt genau ein PNG
(unverändert), mit Effekt `rahmenplan` → je **eindeutigem** Frame `zeichneSegment(…,
effektZustand(bildNummer))` + `alsPng`. 10 s mit Schleife = **60 Zeichenvorgänge statt 300**.

**Beleg am echten Fenster (`scripts/beleg-effekt-render.mjs`):** Projektkopie, ein Segment, über
den echten Dialog gerendert.

| | mit Effekt | ohne Effekt |
|---|---|---|
| Bilder | 300 | 300 |
| Dauer | 10,02 s (Container; Clip 10,000 s) | 10,02 s |
| Preiszone Bild 0 vs. 30 | **2122 Bytes** | **2 Bytes** |

## 3. Der Motiv-Befund und seine Behebung (`0d934e4`, TK v3.56)

Beim ersten Versuch mit „Zoom-Atmen" **und Motiv** scheiterte jeder Render:
*„Failed to execute 'toBlob' on 'HTMLCanvasElement': Tainted canvases may not be exported."*
Ursache: `bild-laden.ts` setzte `media://…` **direkt** als `<img src>`; das taintet das Canvas.
Das traf **jeden** Render einer Aktion mit `bildRef`, nicht nur Effekte — nur der direkte Weg über
`project.json` (Beleg-Skript) kam daran vorbei.

**Behoben:** `bild-laden.ts` holt die Bytes über `mediaBlobUrl`
(`gemeinsam/media-blob-url.ts`, #364) und bindet eine **Objekt-URL**; Blob-URLs sind same-origin
und tainen nicht. Dieselbe Stelle wie Filmstreifen und Logo-Ladeweg — keine zweite Kopie. Das
entspricht der bestehenden TK-Regel **9.5.7** („Blob-Bindung für Canvas-Nutzer", 28.10.2026); neu
ist nur, dass Motive sie jetzt auch befolgen (TK **9.10.8**, Version **3.56**).

**Beleg am Fenster:** mit „Zoom-Atmen" + Motiv **300 Bilder / 10,02 s**, Bildmitte Bild 0 vs. 30 =
**14972 Bytes**; ohne Effekt **0 Bytes**. **Gegenprobe:** direktes `media://` im `<img>` → Render
wird mit genau dieser Meldung abgelehnt; byte-identisch zurück (SHA-256 `ccccd824…`).

## 4. FA-25 im Treiber (`4s`, `f2871a2`)

Ablauf über die echte Oberfläche: neue Aktion „Preis zählt" (Preis 199) → an die Abspielmarke
(Frame 30) legen → **zweimal** rendern (mit/ohne Effekt) → Datei messen.

| | mit Effekt | ohne Effekt |
|---|---|---|
| Bilder | **2100** | **2100** |
| Dauer | **70,022 s** | **70,022 s** |
| Preiszone Bild 30 vs. 60 | **2109 Bytes** | **1 Byte** |

Die 70 s kommen vom Treiber-Projekt (30 Blöcke aus Schritt 4l), nicht vom Effekt. Die Zusage wird
deshalb als **Vergleich** gemessen: dasselbe Projekt mit und ohne Effekt muss dieselbe Bildzahl und
Dauer haben.

**Eine Messfalle, bezahlt:** Lag die Abspielmarke auf Frame 1, entstand ein 1-Bild-Videoteil vor
dem Einschub; die Prüfung der fertigen Datei verwarf sie mit `mittlereBildrate: erwartet 30/1,
gefunden 31500/1049`. Der Schritt setzt die Marke jetzt auf Frame 30 (wie 4f8).

**Matrix:** FA-25 von **Lücke** auf **gemessen** — 11 gemessen, 10 teilweise, 0 Lücken.

## 5. Der Store-Befund (`f2871a2`) — Effekte wurden nie gespeichert

Beim Treiber-Schritt kam heraus: `Aktion.effekte` überstand den **`project-store`** nicht.
`erstelle-aktion.ts` und `bearbeite-aktion.ts` bauen die Aktion Feld für Feld auf (bewusst, gegen
Fremdfelder) — das neue Feld fehlte in **beiden** Listen und wurde **lautlos verworfen**. Effekte
ließen sich über die Oberfläche also **nie speichern**; die Vorschau zeigte sie (Entwurf), der
Render bekam `null`.

**Behoben:** beide Stellen übernehmen `effekte` und normalisieren über `normalisiereEffekte`
(Fenster auf `standardDauer ?? 10` — dieselbe Basis wie der Editor, TK 9.16.6). `null` löscht den
Satz. **6 neue Tests** (anlegen, klemmen, nicht mitgeschickt, löschen). Kommentar an #463.

**Lehre:** Ein Feld, das die Oberfläche schreibt, muss auch **jede** Feldliste des Stores kennen.
Der Typechecker erzwingt das bei **Pflichtfeldern**; bei optionalen Feldern (`effekte?`) schweigt
er. Wer ein optionales Feld einführt, braucht einen Test auf dem Speicherweg — die Vorschau allein
beweist nichts.

## 6. Der Treiber-Speicherbefund (`f2871a2`)

Der Treiber sammelte Ereignisse mit `window.api.on(kanal, (d) => sammel.push({ …, wert: d }))`.
`queue:geaendert` trägt `Auftrag[]` — und ein Render-Auftrag enthält den **vollständigen
`RenderRequest` mit allen PNGs**. Nach zwei 70-s-Renders standen **292 MB** im Fenster; die
Übergabe an den Treiber scheiterte an der 256-MB-Grenze (`Too large write data is pending`), die
CDP-Verbindung riss ab. Das sah wie ein Hänger der App aus, war ein Leck im Messwerkzeug.
**Behoben:** es wird nur noch der Kanalname gespeichert (gebraucht wird nur die Zählung).

## 7. Gegenproben (jede rot, byte-identisch zurück)

| Eingriff | Ergebnis | SHA-256 vorher = nachher |
|---|---|---|
| Plansumme nur `anzahl` statt `anzahl × wiederholungen` | Unit rot | `2542a791…` ✔ |
| `loop=loop=0` (Wiederholung aus) | 60 statt 300 Bilder | `d13def96…` ✔ |
| letztes `setpts` entfernt | 243 statt 300 | `d13def96…` ✔ |
| Plan-Frames mit `segmentPngDateiname` | Unit rot | `d922da4f…` ✔ |
| `bild.src` wieder `media://` | Render abgelehnt (Tainted) | `ccccd824…` ✔ |

## 8. Gate und Doku

Typecheck 0 (auch tests), ESLint/oxlint 0, Build 0, Unit **5718/5718** (372 Dateien),
Integration **54/54** (14), Treiber **0 Befunde** (nur MANUELL Export-Dialog, Untersuchung
Mehrfachauswahl). `einzel-instanz` (#289) bleibt flaky.

**TK v3.56** (9.10.8 + Bezug 9.5.7/#364), `.docx` im selben Commit neu erzeugt: **2654 Absätze**,
`unzip -t` heil, **0 Backticks**, zwei Bilder (Logo + DFD). AD v1.14 unverändert.

## 9. Ehrlich offen

- **Kein Komponententest** für die Effekt-Gruppe (nur `unterschiede`).
- `bereitschaft.py` meldet #464 weiter **UNKLAR** — die Regex liest nur eine einzeilige
  `Datei:`-Angabe, nicht die `Dateien:`-Liste. Werkzeuggrenze, kein Bauzustand.
- **71 Dependabot-Findings** (33 high, 25 moderate, 13 low), nicht angefasst.
- Der Treiber-Schritt rendert das **ganze** 70-s-Projekt zweimal (~2× 70 s). Das ist korrekt, aber
  teuer; ein eigener Kurzprojekt-Aufbau wäre schneller und ist nicht gebaut.
- `protocolTimeout` im Treiber steht jetzt auf **900 s** (Standard 180 s reichte nach den zwei
  Renders nicht). Das ist eine Werkzeugeinstellung, kein Produktverhalten.

## 10. Stand am Sitzungsende

**24 Commits** vor `origin/main`, Arbeitsbaum sauber, **nicht gepusht** — Push nur auf Anweisung.
Die Commits dieser Sitzung: `1e23754` (#464), `7b19f03` (Produzent), `0d934e4` (Motiv-Blob),
`725fce7` (CLAUDE-Stand), `f2871a2` (FA-25-Treiber + Store-Fix). #459–#464 sind geschlossen.

**Nächster Schritt:** es gibt keinen offenen Bauauftrag. Offen sind die Punkte aus Abschnitt 9;
der Komponententest für die Effekt-Gruppe ist der kleinste davon.
