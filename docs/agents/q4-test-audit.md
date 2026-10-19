# Q4 – Audit der Tests gegen die Anforderungen (erster Durchgang)

**Stand:** 19.10.2026. **Art:** Messung und Stichprobe, **keine Codeänderung**.
**Grundlage:** `docs/agents/codequalitaet-programm.md`, Strang Q4.
**Regel:** Dieses Dokument verurteilt keinen Test. Es misst, benennt Verdachtsfälle und
schlägt eine Prüfreihenfolge vor. Der Befund entsteht erst durch Lesen des Tests.

---

## 1. Baseline (gemessen 19.10.2026)

| Maß | Wert |
|---|---|
| Unit-Specs | **331** |
| `it`-Blöcke | **4.607** |
| `expect()`-Aufrufe | **11.915** (2,59 je `it`) |
| `vi.mock(...)`-Aufrufe | **559** in **199** Dateien |
| Dateien ohne `vi.mock` | **132** |
| Integrationstests | **12** Dateien, **49** `it` |
| Treiber | `npm run durchlauf` (echtes Fenster, eigenes Protokoll) |

**Gate-Zuschnitt (gemessen an `package.json` und den Vitest-Konfigurationen):**

- `npm test` → **nur** `tests/unit/**`. `vitest.config.ts` schreibt das `include` ausdrücklich
  aus, damit ein Aufruf ohne Pfad die Integrationstests nicht mitzieht.
- `npm run test:integration` → **nur** `tests/integration/**`, eigener Lauf, 120-s-Grenze.
- `npm run durchlauf` → eigenes Skript, **kein** Test-Runner.
- **Folge:** Kein Gate-Lauf startet je einen echten Prozess, echtes `ffmpeg`, echtes
  Dateisystem-Verhalten oder das echte Fenster. Das ist der strukturelle Befund – nicht die
  Zahl der Mocks.

**Flächenverteilung** (nach dem ersten `src`-Import ohne `shared/`):

| Bereich | Dateien | `it` | `vi.mock` |
|---|---|---|---|
| `src/renderer` | 142 | 2.166 | 175 |
| `src/shared` | 93 | 1.092 | 195 |
| `src/main` | 58 | 940 | 94 |
| ohne erkennbaren `src`-Import (überwiegend `await import(...)`) | 38 | 409 | 95 |

## 2. Methode

Je Test werden vier Fragen beantwortet:

1. **Was pinnt er?** Eine Zusage aus AD/TK/Issue – oder nur eine Implementierungsform?
2. **Wen mockt er?** Nur die äußere Grenze (Electron, Dateisystem, Zeit) oder auch das
   **Testobjekt selbst**?
3. **Was misst er?** Verhalten (Eingabe → Ausgabe/Nebenwirkung) oder „wurde die Attrappe
   gerufen"?
4. **Ist er redundant?** Deckt ein anderer Test dieselbe Zusage mit weniger Attrappen ab?

Ein Test fällt nur durch, wenn **Frage 1 und Frage 3 zusammen** negativ sind. Hohe
Mock-Zahl allein ist **kein** Befund: Eine jsdom-Ansicht darf ihre Geschwister mocken, solange
das Testobjekt echt läuft.

## 3. Stichprobe (5 Dateien gelesen)

| Datei | Mocks/`it` | Urteil | Begründung |
|---|---|---|---|
| `composer-aktion-loeschen.spec.ts` | 7 / 2 | **halten** | `ComposerWurzel` läuft echt; gemockt sind Geschwister und IPC. Gepinnt sind #430 (ein `setzeProjekt`, Fehler → Meldung). Kein Mock des Testobjekts. |
| `standardmarke-zeilenwert.spec.ts` | 5 / 2 | **halten** | Pinnt #410 am **gerenderten `<select>`-Wert**: offene Zeile liest die Sicht, fremde Zeile die Liste. Genau der Regressionsfall. Keine `toHaveBeenCalled`-Behauptung. |
| `project-store-verdrahtung.spec.ts` | 16 / 16 | **halten** | Grenze ist `electron`; die Wrapper #23/#332 laufen **echt**. Pinnt die vierzehn Kanäle und „ungültige Nutzlast → Operation läuft nicht". |
| `beenden-ablauf.spec.ts` | 4 / 7 | **halten** | Pinnt die **Reihenfolge** der drei Flushes und „nur Gescheiterte wiederholen" (#336) an 33 Erwartungen. |
| `kaputt-erkennung.spec.ts` | 0 / 43 | **Vorbild** | Rein, ohne Attrappen, jede Zusage gegen TK 9.7.5 (inkl. Fall 4). |

**Zwischenergebnis:** In der Stichprobe findet sich **kein** Test, der nur die Attrappe prüft.
Die Vermutung „viele Tests testen die Mocks" bestätigt sich an diesen fünf Stellen **nicht**.

## 4. Verdachtsfälle – Prüfreihenfolge, kein Urteil

Sortiert nach `vi.mock` je `it` (die höchste Dichte zuerst). Diese Dateien werden **zuerst
gelesen**, weil dort das Verhältnis von Attrappen zu geprüfter Zusage am ehesten kippen kann:

| Datei | `it` | `vi.mock` | Mocks/`it` | `expect` | davon `toHaveBeenCalled` |
|---|---|---|---|---|---|
| `composer-aktion-loeschen.spec.ts` | 2 | 7 | 3,50 | 8 | 4 |
| `standardmarke-zeilenwert.spec.ts` | 2 | 5 | 2,50 | 6 | 0 |
| `composer-band.spec.ts` | 4 | 9 | 2,25 | 12 | 1 |
| `live-vorschau.spec.ts` | 3 | 5 | 1,67 | 6 | 4 |
| `projekt-anlegen-video.spec.ts` | 3 | 5 | 1,67 | 7 | 5 |
| `vorlagen-editor-sitzung.spec.ts` | 2 | 3 | 1,50 | 3 | 0 |
| `composer-dialog-einhaengung.spec.ts` | 6 | 7 | 1,17 | 23 | 0 |
| `bootstrap-verdrahtung.spec.ts` | 20 | 23 | 1,15 | 58 | 23 |
| `composer-ein-video.spec.ts` | 7 | 8 | 1,14 | 15 | 7 |
| `project-store-verdrahtung.spec.ts` | 16 | 16 | 1,00 | 39 | 22 |
| `app-einhaengung.spec.ts` | 29 | 25 | 0,86 | 132 | 19 |
| `setze-standard-marke.spec.ts` | 7 | 6 | 0,86 | 31 | 14 |
| `marken-verdrahtung.spec.ts` | 11 | 9 | 0,82 | 30 | 11 |
| `zeichen-vorbereitung.spec.ts` | 5 | 4 | 0,80 | 19 | 0 |
| `dauer-regler-undo.spec.ts` | 3 | 2 | 0,67 | 5 | 0 |
| `marken-editor-wurzel.spec.ts` | 18 | 11 | 0,61 | 54 | 31 |
| `config-store-verdrahtung.spec.ts` | 10 | 6 | 0,60 | 19 | 7 |
| `start-wiederherstellung.spec.ts` | 5 | 3 | 0,60 | 16 | 1 |
| `beenden-ablauf.spec.ts` | 7 | 4 | 0,57 | 33 | 20 |
| `vorschau-anzeige.spec.ts` | 14 | 8 | 0,57 | 43 | 0 |

**Warnung zur Kennzahl:** Eine hohe `toHaveBeenCalled`-Quote ist ebenfalls kein Urteil.
`bootstrap-verdrahtung.spec.ts` und `project-store-verdrahtung.spec.ts` **müssen** Aufrufe
prüfen – ihr Gegenstand ist die Verdrahtung selbst.

## 5. Was das Audit bisher trägt

1. **Die Testbasis ist breit und überwiegend verhaltensnah.** 132 Dateien ohne Attrappe,
   2,59 Erwartungen je Test, Quelltext-Bezug in den meisten Kommentaren.
2. **Das Gate ist das Problem, nicht die Zahl der Tests.** Unit-Tests können per Konstruktion
   weder echtes `ffmpeg` noch echtes Dateisystem noch das Fenster prüfen – genau dort liegen
   aber die teuersten Fehler der letzten Wochen („fertige Funktion ohne Aufrufer",
   `#342`, `#347`, `#340`, `#403`).
3. **Kein Anlass für eine Deleting-Welle.** In der Stichprobe war kein Test ohne Aussage.
   Sollte die Vollprüfung doch welche finden, werden sie **benannt und einzeln** entsorgt –
   nicht pauschal.

## 6. Vorschlag für die nächsten Schritte

**Schritt Q4-1 (Audit fortsetzen, ohne Code):** Die 20 Verdachtsfälle aus Abschnitt 4 lesen
und je Datei ein Urteil `halten / verdichten / streichen` mit einer Zeile Begründung
festhalten. Ergebnis in diesem Dokument ergänzen.

**Schritt Q4-2 (Gate, erst danach entscheiden):**
- `npm test` bleibt der schnelle Unit-Lauf.
- Ein neuer Befehl `npm run pruefung` (Vorschlag) führt **Unit + Integration + Treiber**
  nacheinander aus und ist der Lauf vor einem Merge.
- **Voraussetzung:** Der Treiber muss stabil und schnell genug sein; sein Protokoll ist
  bereits da (`docs/agents/oberflaeche-durchlauf.md`).

**Schritt Q4-3 (Investition verschieben):** Neue Zusagen werden zuerst als
Treiber-Szenario formuliert (Anforderung → echtes Fenster), Unit-Tests bleiben für reine
Logik. Kein Rückbau bestehender Tests ohne Befund aus Q4-1.

## 7. Offene Entscheidung (beim Auftraggeber)

- Soll `npm run pruefung` **verpflichtend** werden (vor jedem Merge), oder bleibt der Treiber
  ein Beweismittel auf Anweisung?
- Sollen die 20 Verdachtsfälle vollständig gelesen werden (Aufwand ca. 1 Sitzung), oder
  genügen die fünf bereits gelesenen plus die drei auffälligsten?

**Nicht entschieden und nicht gebaut:** Gate-Umstellung, Streichungen, neue Testbefehle.
