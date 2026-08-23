# Bau-Welle: die baubereiten Issues (Stand 19.08.2026)

> **Für eine neue Sitzung, die Issues BAUEN will.** Diese Datei sagt, welche Issues JETZT baubar
> sind, was je Issue zu tun ist und welche Fallen die Welle kennt. Die Vorgänger-Wellen stehen in
> `docs/agents/bau-welle-bereit-16-08.md` und `bau-welle-bereit-17-08.md` – deren Abschnitte 0, 4c
> und 4d gelten unverändert auch hier.

---

## 0. Du bist ein Bau-Agent. So arbeitest du

1. **`python3 tools/bereitschaft.py`** – zeigt dir die baubereiten Issues.
2. **Wähle EIN Issue** aus der Liste unten und lies seinen **vollständigen** Text auf GitHub
   (`gh issue view <nummer>`). Das Issue ist deine ganze Welt: Signatur, Invarianten, Fehlerpfade,
   DoD.
3. NUR der **Rumpf** der Ziel-Datei ist zu füllen. Die Signatur ist **verbindlich** – wörtlich aus
   dem Issue, in der Datei `src/...` schon abgelegt, **nicht ändern**.
4. Die `/* eslint-disable @typescript-eslint/no-unused-vars */`-Zeile (Zeile 1, wenn vorhanden)
   gehört zum Gerüst und ist **beim Füllen zu entfernen**.
5. Die `GERUEST-PRUEFSUMME`-Zeile im Kopf stehen lassen – ihr Nicht-mehr-stimmen ist das Signal,
   dass die Datei bearbeitet wurde.
6. Prüfe deine doppelten Fehlerpfade gegen den `Ergebnis`-Vertrag (`src/shared/contracts/ergebnis.ts`).
7. Wenn ein Verhalten oder eine Schnittstelle nicht entschieden ist → **STOPP**, mach den STOPP-Block
   des Issues / frage den Projektverantwortlichen. **Nicht raten.**

**Am Ende:**

```bash
npm run typecheck && npx eslint <deine-datei> && npm test
```

Arbeite die Definition of Done **mechanisch** ab – jede Zeile gegen die benannte Quelle, nicht aus
dem Gedächtnis. Danach `python3 tools/bereitschaft.py` erneut.

**Keine zwei Agents arbeiten je an derselben Datei.**

---

## 1. Die baubereiten Issues (Stand 19.08.2026)

> **WICHTIG:** `bereitschaft.py` meldet aktuell überall „0 bereit". Das ist ein **Messfehler des
> Werkzeugs**, kein echter Stand: Es zählt die UNKLAR-Issues `#8` (Ordner `src/renderer/assets/fonts/`)
> und `#1` (Ordnerstruktur) als nicht gebaut, weil ein **Ordner** nicht auf einen werfenden Rumpf
> geprüft werden kann. Beide sind nachweislich gebaut:
> - `#8`: die vier woff2-Dateien liegen in `src/renderer/assets/fonts/`, `ladeMarkenSchriften()`
>   steht in `src/renderer/styles/schriften.ts` und wird in `main.tsx` aufgerufen.
> - `#1`: die Ordnerstruktur existiert – der ganze Baum unter `src/` steht.
>
> Wer die Blocker `#8` und `#1` als gebaut anerkennt (Nachweis oben), bekommt die unten stehende
> Welle. Die **Dateien sind disjunkt** – jede Zieldatei gehört zu genau einem Issue (geprüft).

### M4 – template-canvas (2 bereit, Basis der Pixelquelle)

| Issue | Datei | Kern der Aufgabe |
|---|---|---|
| `#110` | `src/renderer/template-canvas/schriften.ts` | Marken-Schriften bereitstellen, idempotent; `schriftKurzform` exakt formatieren |
| `#119` | `src/renderer/template-canvas/logo-laden.ts` | Marken-Logo aus dem Bundle laden und dekodieren; Fehler → `{ zustand: 'fehlt' }` |

### M5 – vorlagen-editor (1 bereit)

| Issue | Datei | Kern der Aufgabe |
|---|---|---|
| `#155` | `src/renderer/vorlagen-editor/vorlagen-uebersicht.ts` | Vorlagen-Übersicht: nutzbare + verwaiste Arbeitskopien, `ANLEGBARE_ARTEN` |

### M7 – Oberfläche (5 bereit, 2 mit frisch generiertem Gerüst)

| Issue | Datei | Kern der Aufgabe |
|---|---|---|
| `#200` | `src/renderer/app-shell/speicherstatus-lage.ts` (Gerüst neu) | Auto-Speichern-Status: 3 Zustände je Quelle, reine Übergänge |
| `#215` | `src/renderer/preview-player/medien-url.ts` + `bild.tsx` (Gerüst neu) | media://-URL; Bild füllt die ganze Bühne |
| `#221` | `src/renderer/preview-player/platzhalter-text.ts` + `platzhalter.tsx` (Gerüst neu) | Platzhalter-Wortlaut aus `KaputtGrund` |
| `#225` | `src/renderer/projekt-verwaltung/duplizieren.ts` | Duplikatname prüfen/vorschlagen, Hinweis, auslösen |
| `#229` | `src/renderer/composer/medium-loeschen.ts` | Vorprüfung: blockierende Stellen + betroffene Aktionen |
| `#257` | `src/renderer/queue-panel/leisten-montage.ts` (Gerüst neu) | Leisten-Lage: Klappzustand, Rückfrage, Meldung |

### Folgewelle (nach `#110`/`#119`, NICHT in dieser Welle)

`#114` `#115` (nach `#110`), `#116` (nach `#114`), `#117` (nach `#110`+`#114`+`#115`+`#116`+`#119`),
`#118` (nach `#117`). Diese hängen in der Kette – erst wenn die Basis (`#110`, `#119`) steht, sind
sie baubar. Sie gehören in die nächste Welle.

---

## 2. Batch-Plan

**Regel:** Zwei Agents bearbeiten nie dieselbe Datei. Alle Zieldateien dieser Welle sind disjunkt.

### Gruppe A – `#110` `#119` (Basis zuerst – die Kette darunter braucht sie)

### Gruppe B – `#155` `#225` `#229` (unabhängig, sofort parallel)

### Gruppe C – `#200` `#215` `#221` `#257` (unabhängig, sofort parallel)

Gruppen B und C können parallel zu Gruppe A laufen, wenn ein Agent pro Issue eingesetzt wird.

---

## 3. Agent-Briefings je Issue

### M4

| Issue | Kurz-Briefing |
|---|---|
| `#110` | **Datei:** `src/renderer/template-canvas/schriften.ts` · **Verifikation:** `typecheck:renderer`, `eslint`, Unit-Test · **Hinweis:** idempotentes Laden via `ladeMarkenSchriften` (#8); abgelehntes Promise NICHT merken; `schriftKurzForm` exakt `gewicht px "familie"`. |
| `#119` | **Datei:** `src/renderer/template-canvas/logo-laden.ts` · **Verifikation:** `typecheck:renderer`, `eslint`, Unit-Test · **Hinweis:** Fehler → `{ zustand: 'fehlt' }`, NIE werfen (außer leerer `datei`); kein `leereLogoBestand()`. |

### M5

| Issue | Kurz-Briefing |
|---|---|
| `#155` | **Datei:** `src/renderer/vorlagen-editor/vorlagen-uebersicht.ts` · **Verifikation:** `typecheck:renderer`, `eslint`, Unit-Test · **Hinweis:** `UebersichtsEintrag`/`VorlagenUebersicht`/`ANLEGBARE_ARTEN`; Nutzung aus `nutzung-anzeigen` (`holeNutzung` etc.), `starteBearbeitung` aus `arbeitskopie`. |

### M7

| Issue | Kurz-Briefing |
|---|---|
| `#200` | **Datei:** `src/renderer/app-shell/speicherstatus-lage.ts` · **Verifikation:** `typecheck:renderer`, `eslint`, Unit-Test · **Hinweis:** drei Zustände, `ANFANGSLAGE`, reine `verarbeiteSpeicherEreignis`. Gerüst am 19.08. generiert (s. 4a). |
| `#215` | **Datei:** `src/renderer/preview-player/medien-url.ts` + `bild.tsx` · **Verifikation:** `typecheck:renderer`, `eslint`, Unit-Test · **Hinweis:** `medienUrl` mit `encodeURIComponent`; `Bild` füllt die ganze Bühne im Raster von #212. Gerüst am 19.08. generiert. |
| `#221` | **Datei:** `src/renderer/preview-player/platzhalter-text.ts` + `platzhalter.tsx` · **Verifikation:** `typecheck:renderer`, `eslint`, Unit-Test · **Hinweis:** drei Gründe → Wortlaut, kein Rückfall; `PlatzhalterProps` mit `Marke`. Gerüst am 19.08. generiert. |
| `#225` | **Datei:** `src/renderer/projekt-verwaltung/duplizieren.ts` · **Verifikation:** `typecheck:renderer`, `eslint`, Unit-Test · **Hinweis:** `pruefeDuplikatname`, `schlageDuplikatnamenVor`, `baueDuplizierHinweis`, `DuplizierWirkungen`; nur über `rufeAuf`/Kanal. |
| `#229` | **Datei:** `src/renderer/composer/medium-loeschen.ts` · **Verifikation:** `typecheck:renderer`, `eslint`, Unit-Test · **Hinweis:** `LoeschLage`/`BlockierendeStelle`/`BetroffeneAktion`; Vorprüfung auf dem geladenen Projekt. |
| `#257` | **Datei:** `src/renderer/queue-panel/leisten-montage.ts` · **Verifikation:** `typecheck:renderer`, `eslint`, Unit-Test · **Hinweis:** `LeistenLage`, `LEERE_LEISTEN_LAGE`, reine Übergänge. Gerüst am 19.08. generiert. |

---

## 4. Die besonderen Fälle dieser Welle

### 4a. Vier Gerüste wurden am 19.08. neu generiert

`#200` (`speicherstatus-lage.ts`), `#215` (`medien-url.ts` + `bild.tsx`), `#221`
(`platzhalter-text.ts` + `platzhalter.tsx`), `#257` (`leisten-montage.ts`) hatten noch **keine**
Gerüst-Datei. Der Generator hat sie aus den Signaturblöcken erzeugt. Sie sind wie üblich zu füllen.

### 4b. Zwei Dateien pro Issue bei #215/#221

`#215` und `#221` bestehen aus je **zwei** Zieldateien (eine reine `.ts` + eine `.tsx`). Beide
gehören zu demselben Issue – fülle **beide** Rümpfe, keine andere Datei.

### 4c. Die drei vorbestehenden Test-Fehlschläge

`npm test` meldet weiterhin **3 Fehlschläge**, die **vorbestehend** sind: `tests/unit/datenort.spec.ts`
(1) und `tests/unit/einzel-instanz.spec.ts` (2). **Nicht „reparieren"**, wenn sie dein Diff nicht
verursacht hat – aber im Finalbericht erwähnen.

### 4d. Auch „bereit" heißt nicht „gebaut" – die Aufrufer-Frage

Ein baubares Issue garantiert **nicht**, dass sein Aufrufer schon existiert. Stehen fremde
Funktionen im „Fremde Aufrufe"-Kommentar deiner Datei, nutze **deren** Signaturen, rätsele nicht.

---

## 5. Kontext lesen – Reihenfolge

1. **Diese Datei** (kurz halten).
2. **CLAUDE.md**, „Stand heute" (Projektregeln).
3. **Dein Issue vollständig** auf GitHub (`gh issue view <nummer>`).
4. Bei Renderer-Arbeit: `docs/agents/system-design-context.md`.
5. `docs/agents/uebergabe-stand.md` nur als Hintergrund.

## 6. Verifikation

- `npm run typecheck` – alles grün (auch deine Datei).
- `npx eslint <deine-datei>` – ohne die Abschaltzeile von Zeile 1.
- `npm test` – deine neue Testdatei grün; die 3 vorbestehenden Fehlschläge (4c) unverändert.
- `python3 tools/bereitschaft.py` – dein Issue erscheint nicht mehr als bereit.