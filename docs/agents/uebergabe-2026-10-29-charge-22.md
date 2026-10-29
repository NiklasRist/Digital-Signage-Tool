# Übergabe 29.10.2026 – Stand nach Charge 21

**Nächste Sitzung: Mutations-Charge 22.**
**Der Plan für alle restlichen Chargen: [`charge-17-26-plan.md`](charge-17-26-plan.md).**
Letzte gebaute Charge: [`uebergabe-2026-10-29-charge-21.md`](uebergabe-2026-10-29-charge-21.md).
Einzelbefunde: [`mutation-pilot-2026-10-20.md`](mutation-pilot-2026-10-20.md), Abschnitt 34.

## 1. Stand heute (nichts offen im Bau, Arbeitsbaum sauber nach dem Commit)

| | Wert |
|---|---|
| Gebaute Chargen | **21** – **105 Testdateien** (je fünf), dazu das Lint-Gate #447 |
| Suite | **5.323** Unit-Tests in **340** Dateien, **49** Integrationstests in 12 Dateien |
| Gate | `npm run pruefung` **Exit 0** (Typecheck + Lint + Build + Tests + Integration + Treiber) |
| Treiber | **0 Befunde**; der CDP-Abriss aus Charge 17 trat in 18–21 **nicht** auf |
| Sperrklinke | **25** Dateien in `tools/eslint/quelltext-proben-ausnahmen.json` |
| Lint | 0 Fehler (Warnungen unverändert: 192 × `SAFETY` aus #448) |
| Push | **nicht gepusht** – `main` liegt vor `origin/main`; **Push nur auf Anweisung** |

## 2. Was Charge 21 ergeben hat (kurz)

- **30 Verhaltens-Mutationen, 5 Refactorings**; **29 erkannt**, **1 Lücke**, **0 äquivalent**;
  **0/5 Refactorings rot**; jede Mutation byte-identisch zurückgenommen.
- **L4 war eine echte Lücke:** In `löscheVorlage` blieb
  `daten: { aktionen, listenelemente: [] }` grün — der einzige Tiefenvergleich nutzte eine
  Fixture mit **leerer** zweiter Liste. Neu: ein Fall mit **zwei gefüllten** Listen.
- **Nachmessung nach dem Ausbau: 30 von 30 rot.** Anders als in Charge 19/20 kippte hier
  kein Fall — keine Probe war die einzige Wächterin einer der gebauten Mutationen.
- **Ein defekter Fall, offen benannt:** Das Refactoring **V7** (`nutzlast` → `eingang`) traf
  den **Importpfad** `nutzlast-pruefer`; die Suite lud nicht (`0/0`). Ersetzt durch
  `ARTEN` → `VORLAGEN_ARTEN`.
- **35 Probetests entfernt, 1 Verhaltens-Test ergänzt**; Suite 5.357 → **5.323**.

## 3. Nächster Schritt: Charge 22

Fünf Dateien – erste Renderer-Charge mit `.tsx`:

| Spec | Quelle |
|---|---|
| `verwerfe-arbeitskopie` | `src/main/vorlagen-store/verwerfe-arbeitskopie.ts` |
| `app-einhaengung` | `src/renderer/App.tsx` |
| `aktion-bearbeiten` | `src/renderer/action-editor/aktion-bearbeiten.ts` |
| `aktion-loeschen` | `src/renderer/action-editor/aktion-loeschen.ts` |
| `bild-zuweisen` | `src/renderer/action-editor/bild-zuweisen.ts` |

**Erwartung:** `app-einhaengung` ist der riskanteste Fall der ganzen Reihe — die Probe liest
`App.tsx`, und die Zusage ist „kein zweiter Zustand / keine zweite Montage". **Vor dem
Entfernen prüfen, ob der Verhaltens-Test die Montage wirklich durchläuft** (Mounten, nicht
nur Rendern eines Teilbaums). Bei `verwerfe-arbeitskopie` beachten: Es hängt mit
`loesche-vorlage` (Charge 21) zusammen — beide lösen Arbeitskopien, die Specs sind getrennt.

**Ablauf (wie in den 21 Chargen davor):**

1. Die fünf Specs und Quellen lesen; Probe-Blöcke und ihre Zusagen notieren. **Prüfen, ob
   der Verhaltens-Test die Funktion überhaupt aufruft, in der die Mutation sitzt.**
2. Je Datei 4–6 semantische Mutationen + 1 harmloses Refactoring als JSON nach
   `$TMPDIR/charge22/faelle.json`; **jeder Suchtext genau einmal**. Bewährt: Fälle aus
   **Zeilenbereichen** bauen und die Eindeutigkeit im Builder prüfen.
3. `python3 tools/mutationen.py $TMPDIR/charge22/faelle.json`.
4. Grüne Mutation: Lücke (Verhaltens-Test) oder äquivalent (begründen). **Gegenprobe je
   Lücke**; für „äquivalent" eine Gegenprobe mit **falschem** Wert.
5. Probe-Blöcke entfernen, Importe aufräumen (`readFileSync`, `fileURLToPath`).
6. **Erneut messen** — die zweite Messung nach dem Ausbau gehört seit Charge 17 zum Rezept.
7. Die fünf Einträge aus der Sperrklinke streichen (**25 → 20**), `npx eslint .` muss grün
   sein.
8. `npm run pruefung`, dann `mutation-pilot` (Abschnitt 35), `CLAUDE.md`, Übergabe, Commit.
   Der Treiber hängt je Lauf einen „Nachlauf" an `docs/agents/oberflaeche-durchlauf.md` —
   normal, wird mitcommittet.

## 4. Der Plan für danach

[`charge-17-26-plan.md`](charge-17-26-plan.md) führt die verbleibenden **25** Dateien in
**fünf** Chargen (22–26): Renderer action-editor (22), app-shell-Filter (23), Montage/Zugänge
(24), Composer (25), Rest inkl. Vertragstest (26).

**Sonderfall in Charge 26:** `marke.spec.ts` liest `src/shared/contracts/marke.ts`. Wenn das
ein **Vertragstest** ist (Vollständigkeit der Marken-Felder, wie `fehlertexte`), **bleibt er**
und die Datei wird nur aus der Sperrklinke gestrichen. Vorher lesen, nicht nach dem Namen
urteilen — Charge 18 (`media-protokoll-schema`) und Charge 19 (Registry-Block) haben das
bereits praktiziert.

**Danach:** Sperrklinke steht auf 0 → die Regel von „Sperrklinke" auf „Verbot" stellen
(Ausnahmen-Datei leeren und löschen).

## 5. Die sieben Fallen (aus 21 Chargen, jede hat eine Sitzung gekostet)

1. **Falsche Spec** → alles grün. Die Zuordnung Quelle → Spec steht in jeder Zeile der
   Fallliste; bei `.ts`+`.tsx`-Paaren gibt es **zwei** Specs (Charge 13).
2. **`0 bestanden, 0 rot`** heißt: die Suite lädt nicht. Fall korrigieren, nicht als
   „erkannt" werten (Charge 14; Charge 17: ein Ausbau-Schnitt traf einen Helfer mit).
   Verwandt: Ein Edit, der eine **Methode** einführt, die das Test-Doppel nicht hat (etwa
   `fenster.on` statt `once`), lässt den Import scheitern — dann steht dort `0/0`.
3. **Zufällig deckende Fixtures** — jeder gültige Profilwert im Test war der Profilwert
   (Charge 17: `'30'`, `'high'`, `'mp4'`; Charge 18: `"media"`; **Charge 21: L4, leere
   zweite Liste**). Vor dem Deuten einer grünen Mutation die Fixture ansehen: deckt sie den
   mutierten Wert überhaupt ab?
4. **Eine Meldung mit der richtigen Zahl/Text** ist kein Beleg für den richtigen Grund
   (ML7, Charge 3). **Charge 18:** `toContain("Absturz …")` blieb bei
   `"Error: Absturz …"` grün — erst der **exakte** Vergleich biss.
5. **Die Probe trägt die Zusage, nicht der Test.** Nach dem Ausbau erneut messen; sonst
   zählt eine Mutation als „erkannt", die nur der Quelltext-Vergleich gefangen hat.
   **Charge 19:** EV6. **Charge 20:** L8 (positive `toContain`-Probe).
6. **Grün kann ein Messfehler sein.** Sitzt die Mutation in einer Funktion, die der Test
   nie aufruft, ist sie grün, ohne dass etwas über die Zusage gesagt wäre (Charge 20: P7,
   `projekteOrdner()` fehlte in der Aufrufliste des Spys). Vor dem Bewerten prüfen: **ruft
   der Test diese Funktion?** Und: beobachtet der Spy **diese** Funktion (P7c mit
   `accessSync` war grün, weil `accessSync` nicht in der Beobachtungsliste steht)?
7. **Ein `all`-Rename trifft jede Zeichenkette** — auch Importpfade und fremde Bezeichner
   (Charge 21: `nutzlast` → `eingang` traf `../ipc-gateway/nutzlast-pruefer`, Suite lud
   nicht). Vor `all: true` prüfen, was der Suchtext sonst noch trifft: `grep -c`.

## 6. Ehrlich offen (in Charge 21 gewachsen)

- **Abwesenheits-Zusagen ohne Wächter**: kein `fs`/`kill`/`unlink` im Abbruch, kein zweites
  Lock, kein Marken-/`config-store`-Zugriff in `normalisieren`, kein `fs`/IPC in den drei
  Vorlagen-Dateien, `child_process` nur als Typ. Verhalten kann sie **grundsätzlich** nicht
  tragen — Spione sehen nur Aufrufe, die es gibt. Lint-Kandidat `no-restricted-imports`.
  Aus Charge 20: „eine Pfad-Autorität" (L8), `path.join`/`BrowserWindow`/`webContents`/
  `showItemInFolder`/`openExternal` in `oeffne-projektordner`. Aus Charge 19: `try/catch` in
  beiden Anmeldungen, `whenReady`, Lock/Flush in `loesche-medium`, `existsSync`/`homedir`/
  `loeseAusgabePfad`/`BrowserWindow`/`ipcMain` in `ziel-dialog`.
- **#448**: 192 Typ-Behauptungen in `src` ohne `SAFETY`-Begründung; Regel steht auf `warn`.
- **Treiber**: In Charge 17 waren vier Läufe rot (CDP-Abriss, Pilot Abschnitt 30), ohne
  Codeänderung; Chargen 18–21 liefen ohne Befund. Ursache weiter **unbenannt**;
  Kandidat `dumpio`/Frist/Retry.
- **Einzelquellen-Regeln** (`RENDER_PROFILE`, `SICHERHEITSABSTAND_PX`, Kanal-Registry,
  `FORMAT_WHITELIST`) sind nur durch Werte gedeckt — belegt in Charge 18 (DI7), 19 (EV8),
  20 (L8).
