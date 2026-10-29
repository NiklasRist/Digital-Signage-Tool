# Übergabe 29.10.2026 – Stand nach Charge 22

**Nächste Sitzung: Mutations-Charge 23.**
**Der Plan für alle restlichen Chargen: [`charge-17-26-plan.md`](charge-17-26-plan.md).**
Letzte gebaute Charge: [`uebergabe-2026-10-29-charge-22.md`](uebergabe-2026-10-29-charge-22.md).
Einzelbefunde: [`mutation-pilot-2026-10-20.md`](mutation-pilot-2026-10-20.md), Abschnitt 35.

## 1. Stand heute (nichts offen im Bau, Arbeitsbaum sauber nach dem Commit)

| | Wert |
|---|---|
| Gebaute Chargen | **22** – **110 Testdateien** (je fünf), dazu das Lint-Gate #447 |
| Suite | **5.307** Unit-Tests in **340** Dateien, **49** Integrationstests in 12 Dateien |
| Gate | `npm run pruefung` **Exit 0** (Typecheck + Lint + Build + Tests + Integration + Treiber) |
| Treiber | **0 Befunde**; der CDP-Abriss aus Charge 17 trat in 18–22 **nicht** auf |
| Sperrklinke | **20** Dateien in `tools/eslint/quelltext-proben-ausnahmen.json` |
| Lint | 0 Fehler (Warnungen unverändert: 192 × `SAFETY` aus #448) |
| Push | **nicht gepusht** – `main` liegt vor `origin/main`; **Push nur auf Anweisung** |

## 2. Was Charge 22 ergeben hat (kurz)

- **30 Verhaltens-Mutationen, 5 Refactorings**; **28 erkannt**, **2 Test-Lücken** geschlossen,
  **0 äquivalent**; **0/5 Refactorings rot**.
- **A4 – Zugangs-Spiegel:** Ohne `zugaengeRef.current = neu.zugaenge` liefert `holeProjekt()`
  **für immer `null`** — jede Reparatur verlöre ihr Projekt. Kein Test bemerkte es. Neu:
  `holeProjekt()` liefert nach `bereit` das Projekt. **Der Fall war zuerst falsch gebaut**
  (Anführungszeichen-Tausch, grün) — erst `if (false)` ist die echte Mutation.
- **B6 – Meldungstabelle:** `meldungZuBefunden` hatte **keinen** Test; ein gelöschter `case`
  blieb grün. Neu: vier Fälle, je Feldname + Grund.
- **PRODUKT-LÜCKE, gemeldet, nicht geändert:** `meldungZuBefunden` hat keinen
  `case 'markeId'`. Gemessen: `legeAktionAn({ …, markeId: '' })` liefert
  **`" Es wurde nichts gespeichert."`** — ohne Feldnamen, mit führendem Leerzeichen.
  Vorschlag: `case 'markeId': return 'markeId: Es muss eine Marke gewählt sein.'` + Test.
  **Entscheidung steht bei Niklas.**
- **Nachmessung nach dem Ausbau: 30 von 30 rot**, kein Fall kippt.

## 3. Nächster Schritt: Charge 23

Fünf Dateien – zwei Filter-Paare und der Bootstrap:

| Spec | Quelle |
|---|---|
| `kaputt-handling` | `src/renderer/action-editor/kaputt-handling.ts` |
| `live-vorschau` | `src/renderer/action-editor/live-vorschau.ts` |
| `aktions-auswahl` | `src/renderer/app-shell/aktions-auswahl-filter.ts` |
| `asset-auswahl` | `src/renderer/app-shell/asset-auswahl-filter.ts` |
| `bootstrap-ablauf` | `src/renderer/app-shell/bootstrap.ts` |

**Erwartung:** Die zwei Filter sind rein und gut verhaltensgetestet — dort erwarte ich wenige
Lücken. `bootstrap-ablauf` ist der riskanteste Fall (Startreihenfolge, Abbaureihenfolge);
dort besonders genau prüfen, ob der Test die **Reihenfolge** misst und nicht nur „alle
Schritte kamen vor".

**Ablauf (wie in den 22 Chargen davor):**

1. Die fünf Specs und Quellen lesen; Probe-Blöcke und ihre Zusagen notieren. **Prüfen, ob
   der Verhaltens-Test die Funktion überhaupt aufruft, in der die Mutation sitzt.**
2. Je Datei 4–6 semantische Mutationen + 1 harmloses Refactoring als JSON nach
   `$TMPDIR/charge23/faelle.json`; **jeder Suchtext genau einmal**. Bewährt: Fälle aus
   **Zeilenbereichen** bauen und die Eindeutigkeit im Builder prüfen.
3. `python3 tools/mutationen.py $TMPDIR/charge23/faelle.json`.
4. Grüne Mutation: Lücke (Verhaltens-Test) oder äquivalent (begründen). **Gegenprobe je
   Lücke**; für „äquivalent" eine Gegenprobe mit **falschem** Wert.
5. Probe-Blöcke entfernen, Importe aufräumen (`readFileSync`, `fileURLToPath`).
6. **Erneut messen** — die zweite Messung nach dem Ausbau gehört seit Charge 17 zum Rezept.
7. Die fünf Einträge aus der Sperrklinke streichen (**20 → 15**), `npx eslint .` muss grün
   sein.
8. `npm run pruefung`, dann `mutation-pilot` (Abschnitt 36), `CLAUDE.md`, Übergabe, Commit.
   Der Treiber hängt je Lauf einen „Nachlauf" an `docs/agents/oberflaeche-durchlauf.md` —
   normal, wird mitcommittet.

## 4. Der Plan für danach

[`charge-17-26-plan.md`](charge-17-26-plan.md) führt die verbleibenden **20** Dateien in
**vier** Chargen (23–26): app-shell-Filter (23), Montage/Zugänge (24), Composer (25), Rest
inkl. Vertragstest (26).

**Sonderfall in Charge 26:** `marke.spec.ts` liest `src/shared/contracts/marke.ts`. Wenn das
ein **Vertragstest** ist (Vollständigkeit der Marken-Felder, wie `fehlertexte`), **bleibt er**
und die Datei wird nur aus der Sperrklinke gestrichen. Vorher lesen, nicht nach dem Namen
urteilen — Charge 18 (`media-protokoll-schema`) und Charge 19 (Registry-Block) haben das
bereits praktiziert.

**Danach:** Sperrklinke steht auf 0 → die Regel von „Sperrklinke" auf „Verbot" stellen
(Ausnahmen-Datei leeren und löschen).

## 5. Die sieben Fallen (aus 22 Chargen, jede hat eine Sitzung gekostet)

1. **Falsche Spec** → alles grün. Die Zuordnung Quelle → Spec steht in jeder Zeile der
   Fallliste; bei `.ts`+`.tsx`-Paaren gibt es **zwei** Specs (Charge 13).
2. **`0 bestanden, 0 rot`** heißt: die Suite lädt nicht. Fall korrigieren, nicht als
   „erkannt" werten (Charge 14; Charge 17: ein Ausbau-Schnitt traf einen Helfer mit).
   Verwandt: Ein Edit, der eine **Methode** einführt, die das Test-Doppel nicht hat (etwa
   `fenster.on` statt `once`), lässt den Import scheitern — dann steht dort `0/0`.
3. **Zufällig deckende Fixtures** — jeder gültige Profilwert im Test war der Profilwert
   (Charge 17: `'30'`, `'high'`, `'mp4'`; Charge 18: `"media"`; Charge 21: L4, leere zweite
   Liste). Vor dem Deuten einer grünen Mutation die Fixture ansehen: deckt sie den mutierten
   Wert überhaupt ab?
4. **Eine Meldung mit der richtigen Zahl/Text** ist kein Beleg für den richtigen Grund
   (ML7, Charge 3). **Charge 18:** `toContain("Absturz …")` blieb bei `"Error: Absturz …"`
   grün — erst der **exakte** Vergleich biss.
5. **Die Probe trägt die Zusage, nicht der Test.** Nach dem Ausbau erneut messen; sonst
   zählt eine Mutation als „erkannt", die nur der Quelltext-Vergleich gefangen hat.
   **Charge 19:** EV6. **Charge 20:** L8 (positive `toContain`-Probe).
6. **Grün kann ein Messfehler sein.** Sitzt die Mutation in einer Funktion, die der Test
   nie aufruft, ist sie grün, ohne dass etwas über die Zusage gesagt wäre (Charge 20: P7).
   **Charge 22:** A4 war zuerst ein Anführungszeichen-Tausch — ein harmloses Refactoring,
   das als „Angriff" gezählt wurde. Vor dem Deuten prüfen: **ändert die Mutation
   tatsächlich Verhalten?**
7. **Ein `all`-Rename trifft jede Zeichenkette** — auch Importpfade und fremde Bezeichner
   (Charge 21: `nutzlast` → `eingang` traf `../ipc-gateway/nutzlast-pruefer`, Suite lud
   nicht). Vor `all: true` prüfen, was der Suchtext sonst noch trifft: `grep -c`.

## 6. Ehrlich offen (in Charge 22 gewachsen)

- **Abwesenheits-Zusagen ohne Wächter**: In den Renderer-Dateien kein `window.api`, kein
  Kanal-Literal, kein `fs`, kein `throw` im Rumpf; in `App.tsx` kein `setTimeout`, kein
  `reiheEin`. Die Verhaltens-Tests belegen nur den Weg, der gegangen wird. Lint-Kandidat
  `no-restricted-imports`/`no-restricted-syntax`. Aus Charge 21: kein `fs`/`kill`/`unlink`
  im Abbruch, kein zweites Lock, kein Marken-Zugriff in `normalisieren`. Aus Charge 20:
  „eine Pfad-Autorität" (L8). Aus Charge 19: `try/catch` in beiden Anmeldungen, `whenReady`.
- **Produkt-Lücke `markeId`** (s. Abschnitt 2) — gemeldet, Entscheidung offen.
- **#448**: 192 Typ-Behauptungen in `src` ohne `SAFETY`-Begründung; Regel steht auf `warn`.
- **Treiber**: In Charge 17 waren vier Läufe rot (CDP-Abriss, Pilot Abschnitt 30), ohne
  Codeänderung; Chargen 18–22 liefen ohne Befund. Ursache weiter **unbenannt**.
- **Einzelquellen-Regeln** (`RENDER_PROFILE`, `SICHERHEITSABSTAND_PX`, Kanal-Registry,
  `FORMAT_WHITELIST`) sind nur durch Werte gedeckt — belegt in Charge 18 (DI7), 19 (EV8),
  20 (L8).
