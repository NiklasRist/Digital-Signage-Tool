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

## 4. Alle 20 Verdachtsfälle gelesen – Urteile

Sortiert nach `vi.mock` je `it` (die höchste Dichte zuerst). Gelesen wurden Kopfkommentar,
`it`-Titel und die tragenden Erwartungen. **Urteil `halten` = die Datei pinnt eine Zusage aus
AD/TK/Issue am echten Testobjekt; die Attrappen sitzen nur an äußeren Grenzen.**

| Datei | `it` | `vi.mock` | Mocks/`it` | `expect` | davon `toHaveBeenCalled` | Urteil |
|---|---|---|---|---|---|---|
| `composer-aktion-loeschen.spec.ts` | 2 | 7 | 3,50 | 8 | 4 | halten |
| `standardmarke-zeilenwert.spec.ts` | 2 | 5 | 2,50 | 6 | 0 | halten |
| `composer-band.spec.ts` | 4 | 9 | 2,25 | 12 | 1 | halten |
| `live-vorschau.spec.ts` | 3 | 5 | 1,67 | 6 | 4 | halten |
| `projekt-anlegen-video.spec.ts` | 3 | 5 | 1,67 | 7 | 5 | halten |
| `vorlagen-editor-sitzung.spec.ts` | 2 | 3 | 1,50 | 3 | 0 | halten |
| `composer-dialog-einhaengung.spec.ts` | 6 | 7 | 1,17 | 23 | 0 | halten |
| `bootstrap-verdrahtung.spec.ts` | 20 | 23 | 1,15 | 58 | 23 | halten |
| `composer-ein-video.spec.ts` | 7 | 8 | 1,14 | 15 | 7 | halten |
| `project-store-verdrahtung.spec.ts` | 16 | 16 | 1,00 | 39 | 22 | halten |
| `app-einhaengung.spec.ts` | 29 | 25 | 0,86 | 132 | 19 | halten |
| `setze-standard-marke.spec.ts` | 7 | 6 | 0,86 | 31 | 14 | halten |
| `marken-verdrahtung.spec.ts` | 11 | 9 | 0,82 | 30 | 11 | halten |
| `zeichen-vorbereitung.spec.ts` | 5 | 4 | 0,80 | 19 | 0 | halten |
| `dauer-regler-undo.spec.ts` | 3 | 2 | 0,67 | 5 | 0 | halten |
| `marken-editor-wurzel.spec.ts` | 18 | 11 | 0,61 | 54 | 31 | halten |
| `config-store-verdrahtung.spec.ts` | 10 | 6 | 0,60 | 19 | 7 | halten |
| `start-wiederherstellung.spec.ts` | 5 | 3 | 0,60 | 16 | 1 | halten |
| `beenden-ablauf.spec.ts` | 7 | 4 | 0,57 | 33 | 20 | halten |
| `vorschau-anzeige.spec.ts` | 14 | 8 | 0,57 | 43 | 0 | halten |

**Warnung zur Kennzahl:** Eine hohe `toHaveBeenCalled`-Quote ist ebenfalls kein Urteil.
`bootstrap-verdrahtung.spec.ts` und `project-store-verdrahtung.spec.ts` **müssen** Aufrufe
prüfen – ihr Gegenstand ist die Verdrahtung selbst.

**Ergebnis: 20 von 20 `halten`.** Kein Test prüft nur eine Attrappe; keiner ist ohne Aussage.
Damit gibt es **keinen Streichkandidaten** aus dieser Runde. Die hohe Mock-Zahl erklärt sich
überall aus demselben Muster: eine echte Wurzel (Komponente oder Verdrahtung) und gemockte
**äußere** Grenzen (Electron, IPC, Dateisystem, Geschwister-Ansichten).

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

## 6. Entscheidung des Auftraggebers (19.10.2026)

1. **Alle 20 Verdachtsfälle lesen** – erledigt (Abschnitt 4): 20 × `halten`.
2. **`npm run pruefung` wird verpflichtend** (vor jedem Merge) und führt
   **Unit + Integration + Treiber** nacheinander aus.

## 7. Umsetzung des Gates

- `package.json` → **`pruefung`**: `build` (der Treiber braucht `dist/`), dann `test`
  (Unit), dann `test:integration`, dann `durchlauf`.
- **Treiber-Exitcode:** Der Treiber setzte bisher nur bei `pageerror` einen Fehlercode.
  Er setzt jetzt auch bei einem Fund der Schwere **`Befund`** Exitcode 2 – `Untersuchung`
  und `MANUEL` bleiben Hinweise. Ohne diese Änderung wäre das Gate blind gegen genau die
  Funde, für die es da ist.
- **Grenze, ehrlich benannt:** Der Treiber ist ein *Regressions*-Gate, keine vollständige
  Anforderungsprüfung. Er misst nur die Szenarien, die in `scripts/durchlauf.mjs` stehen.
  Neue Zusagen brauchen weiterhin ein neues Treiber-Szenario (Schritt Q4-3).

**Weiterhin nicht gebaut:** Streichungen, Rückbau von Tests, Änderung der Unit-Auswahl.

## 8. Q4-3 – erste Treiber-Investition (19.10.2026)

Die erste Zusage, die bisher **nur** der Unit-Test hielt, wird jetzt am echten Fenster
gemessen: **FA-19 / TK 9.7.5 – „der Render wird erst freigegeben, wenn alle behoben sind".**

`scripts/durchlauf.mjs`, Schritt **4h** prüft nun zusätzlich, nachdem eine kaputte Stelle
erzeugt und das Projekt neu geöffnet wurde:

- `reparatur-fortschritt` zeigt **„0 von N behoben"** mit N ≥ 1,
- `composer-render-oefnen` ist **`disabled`** (keine zweite Ableitung – der echte Knopf).

Beleg (Lauf `npm run pruefung`, Exit 0):

```
[schritt-4h] Render-Sperre GEMESSEN: Knopf gesperrt, Fortschritt "0 von N behoben" (FA-19).
```

**Noch offen (bewusst, eigener Schritt):** der **vierte Fall (#438)** am echten Fenster –
ein kaputter **Einschub** (Aktion ohne Bild) sperrt den Render ebenfalls. Dafür fehlt im
Treiber-Seed bisher ein **Bild-Asset** für Aktionen; der Fall ist derzeit nur durch
Unit-Tests gedeckt. Ebenfalls offen: eine Treiber-Matrix „Anforderung → Szenario", damit
Lücken sichtbar werden, statt sie zu erraten.
