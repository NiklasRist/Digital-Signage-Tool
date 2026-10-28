# Vorbereitung Mutations-Charge 15 (28.10.2026)

**Status: VORBEREITET, NICHT GEBAUT.** Keine Quelldatei und keine Spec wurde verändert; der
Arbeitsbaum ist sauber. Fallliste: `$TMPDIR/charge15/faelle.json` (Harness außerhalb des Repos).

## 1. Die fünf Dateien

| Spec | Quellen | Zeilen Spec | Proben |
|---|---|---|---|
| `marken-vorschau` | `src/renderer/marken-editor/live-vorschau.ts` | 120 | 1 Test (ganzer Describe) |
| `medium-loeschen-anzeige` | `src/renderer/composer/medium-loeschen.tsx` | 247 | 1 Test |
| `segment-anzeige` | `src/renderer/preview-player/segment.tsx` | 268 | 2 Tests (auch `segment-quelle.ts`) |
| `render-dialog-anzeige` | `src/renderer/composer/render-dialog.tsx` | 166 | 1 Test |
| `speicherstatus-anzeige` | `src/renderer/app-shell/speicherstatus.tsx` | 186 | 1 Test |

Alle fünf stehen auf der Sperrklinken-Liste (#447), Stand **60** Dateien.

**Spec-Zuordnung, geprüft:** `segment-quelle.ts` wird von `segment-anzeige` nur per Grep
berührt; seine Verhaltens-Spec ist **`segment-quelle.spec.ts`** und bleibt unangetastet. Die
Grep-Probe „kein jsx, kein react" ist eine Architekturregel, kein Verhalten.

## 2. Was die Proben tragen – und was danach trägt

| Datei | entfernte Zusage | Träger danach |
|---|---|---|
| `marken-vorschau` | kein zweiter Zeichenpfad, keine eigene Vorbereitung, kein `await` | Verhaltens-Test: `zeichneSegment` GENAU EINMAL mit `(aktion, vorlage, marke, marke)`, Rückgabe ist dessen Wert |
| `medium-loeschen-anzeige` | kein `rufeAuf`/`KANAELE`/`document.querySelector`, rechnet die Lage nicht selbst | Verhaltens-Tests: `loescheMedium` GENAU EINMAL, Fehlercode unverändert; `#447`-Regeln (Renderer↛Main, `window.api`) |
| `segment-anzeige` | kein zweiter Zeichenpfad, keine Zeitlogik, kein IPC; `segment-quelle` ohne jsx/react | Verhaltens-Tests: Canvas objektgleich, CSS-Maße exakt nativ, GENAU EIN Kind; `segment-quelle.spec.ts` für die Auswahl |
| `render-dialog-anzeige` | kein `confirm`, kein `window.`, keine Eigenprüfung | Verhaltens-Tests: gesperrt bei Befund ≠ ok und bei `laeuft`; Befund-Text aus dem Prop; kein Hinweis ohne Ersetzung |
| `speicherstatus-anzeige` | kein Timer, kein `rufeAuf`/`KANAELE`, kein Kanal-Literal, kein `window.` | Verhaltens-Tests: Anfangszustand zeigt nichts, Abos genau einmal, Abbau meldet ab, Ereignisfluss, Code im Text |

**Ehrlich vorab:** „kein Timer", „kein Kanal-Literal", „kein `confirm`" sind Architekturregeln –
nach dem Entfernen **ohne Wächter**, bis eine Lint-Regel steht. Das ist derselbe offene Posten wie
in den Chargen 1–14 und wird im Abschnitt der Charge benannt, nicht verschwiegen.

## 3. Die Fälle (25 Mutationen, 5 harmlose Refactorings)

**live-vorschau.ts** – MV1 `bildRef: 'x'`, MV2 `akzentfarbe: '#FF4040'`, MV3 `vorlagenId: 'v-x'`,
MV5 vierter Parameter `vorlage` statt `marke`, MV6 leerer `titel`. Erwartung: **alle rot**
(MV5 ist der Kern: „rahmenMarke === marke").

**medium-loeschen.tsx** – ML1 `blockierer.length >= 0`, ML2 Abbruch `if (blockiert) return`
entfernt, ML3 `loescheMedium(assetId, …)` statt `(projekt.id, …)`, ML5 `betroffeneAktionen > -1`,
ML7 Positionsangabe aus der Blockade-Zeile entfernt. Erwartung: ML1/ML2/ML3/ML7 rot,
**ML5 vermutlich grün** (kein Fall „Aktionen leer" mit sichtbarem Block) = Lücke.

**segment.tsx** – SG1 Schriften-Bedingung invertiert, SG2 Breite aus `bild.höhe`, SG3
`firstChild`-Schleife entfernt, SG4 `x = 1`, SG5 Effekt-Abhängigkeiten nur `[aktion]`.
Erwartung: SG1–SG4 rot, **SG5 vermutlich grün** (kein Test wechselt `vorlage`/`marke`) = Lücke.

**render-dialog.tsx** – RD1 `||` → `&&` bei `gesperrt`, RD2 Befund-Absatz abgeschaltet, RD3
Hinweis immer, RD4 `onClick` entkoppelt, RD7 Eingabe wird großgeschrieben.
Erwartung: **alle rot** (RD7 prüft „nichts wird bereinigt").

**speicherstatus.tsx** – SS1 `zeigtHinweis` invertiert, SS2 Verbindungswort `' und '`, SS3 Code
aus dem Text entfernt, SS4 Abmelde-Schleife leer, SS5 Vorlagen-Abo über `abonniereProjekt`.
Erwartung: SS1/SS4/SS5 rot, **SS2/SS3 möglich grün**, wenn der Text nur per `toContain` geprüft
wird = Lücke.

Refactorings: je eine Kommentar-Umformulierung pro Datei (`MV-R`, `ML-R`, `SG-R`, `RD-R`,
`SS-R`) – müssen grün bleiben.

## 4. Bereits geprüft (trocken, ohne Schreibzugriff)

- **30 Fälle** gegen die echten Dateien gezählt: jeder Suchtext trifft **genau einmal**.
- Alle fünf **Spec-Pfade existieren**; die Zuordnung Quelle → Spec ist je Fall gesetzt.
- **Keine Datei angefasst** (`git status` leer).

## 5. Ablauf beim Bauen

1. `python3 tools/mutationen.py $TMPDIR/charge15/faelle.json` → Tabelle.
2. Jede grüne Mutation: **Lücke** (Verhaltens-Test) oder **äquivalent** (begründen).
   Bei „0 bestanden, 0 rot" ist die Suite nicht geladen – Fall korrigieren, nicht werten.
3. Fünf Proben-Describes entfernen, Importe (`join`, `readFileSync`) mit aufräumen.
4. Die fünf Einträge aus `tools/eslint/quelltext-proben-ausnahmen.json` streichen (60 → 55).
5. Gate `npm run pruefung` (Typecheck + Lint + Build + 340 Dateien + Integration + Treiber).
6. Doku: `mutation-pilot` Abschnitt 28, `CLAUDE.md`, Übergabe `uebergabe-2026-10-28-charge-15.md`,
   Commit. **Push nur auf Anweisung.**

## 6. Erwartete Bilanz (Schätzung, keine Zusage)

- Suite: **−4 bis −8** netto (fünf Proben-Describes, 2–3 neue Tests).
- Sperrklinke: **60 → 55**.
- Lücken: voraussichtlich **2–4** (ML5, SG5 und je nach Textschärfe SS2/SS3).
