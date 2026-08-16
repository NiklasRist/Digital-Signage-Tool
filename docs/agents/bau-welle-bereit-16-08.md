# Bau-Welle: die baubereiten Issues (Stand 16.08.2026)

> **Für eine neue Sitzung, die Issues BAUEN will.** Diese Datei sagt, welche Issues JETZT baubar
> sind, was je Issue zu tun ist und welche Fallen die Welle kennt. Sie ist **das** Einsteigedoku für
> einen Bau-Agenten. Den Stand der PLANUNG (Dokumente, Issue-Entstehung) findest du in
> `docs/agents/uebergabe-stand.md` – hier geht es um den Bau.

---

## 0. Du bist ein Bau-Agent. So arbeitest du

1. **`python3 tools/bereitschaft.py`** – zeigt dir die baubereiten Issues deines Meilensteins.
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
dem Gedächtnis. Grep-Proben belegbar ausführen und zeigen, dass sie die Datei wirklich ändern (eine
Probe ohne Beleg ist keine Probe). Danach `python3 tools/bereitschaft.py` erneut – das Issue darf
nicht mehr als `bereit` gemeldet werden.

**Keine zwei Agents arbeiten je an derselben Datei. Insbesondere: `src/main/index.ts` ist ein
Ein-Mann-Territorium (siehe die Warnung zu #272/#273 weiter unten).**

---

## 1. Die 20 baubereiten Issues (bereitschaft.py, 16.08.2026)

`bereitschaft.py` meldet **20 Issues als baubereit** – **18 mit eigenem, unangetastetem Gerüst-Rumpf**
(bytegleich zum Issue-Stand geprüft am 16.08.), dazu die beiden Bootstrap-Issues `#272`/`#273` auf
`src/main/index.ts` (eine bereits von Hand gebaute Datei, dort steht kein Gerüst-Rumpf mehr).

Durch die Gerüst-Erzeugung am 16.08. hat sich die M8-Liste verändert: `#276` (`fehlercodes.ts`) ist
**rechnerisch gebaut** (reine Typdefinition, kein werfender Rumpf), neu **baubereit** ist `#288`
(`marken-store/pfade.ts`, Gerüst am 16.08. generiert). Die Ziel-Datei je Issue ist die **erste Zeile
des Datei-Abschnitts** (`## Modul & Datei`), im Kopf jeder Gerüst-Datei als
`// GENERIERT aus dem Signaturblock von Issue #N.` notiert.

### M4 – Pixel (2 bereit)

| Issue | Datei | Kern der Aufgabe |
|---|---|---|
| `#101` | `src/main/vorlagen-store/oeffne-zur-bearbeitung.ts` | Arbeitskopie öffnen bzw. fortsetzen |
| `#107` | `src/main/vorlagen-store/loesche-vorlage.ts` | Blockierendes Löschen mit beiden Trefferlisten |

### M5 – Inhalte (6 bereit)

| Issue | Datei | Kern der Aufgabe |
|---|---|---|
| `#130` | `src/renderer/composer/einblendung-vorschau.ts` | Wirkung der Abschnittsfolge anzeigen |
| `#135` | `src/renderer/action-editor/bibliothek.ts` | Aktions-Bibliothek des Projekts |
| `#142` | `src/renderer/action-editor/aktion-loeschen.ts` | Aktion löschen – Kaskade sichtbar machen |
| `#144` | `src/renderer/vorlagen-editor/zonen-canvas.ts` | Zonen ziehen, bemaßen, einrasten |
| `#146` | `src/renderer/vorlagen-editor/zonen-liste.ts` | Zonen-Liste als Zeichenreihenfolge |
| `#272` | `src/main/index.ts` | **Bootstrap-Verdrahtung 5/7** – s. Warnung unten |

### M6 – Render & Export (1 bereit)

| Issue | Datei | Kern der Aufgabe |
|---|---|---|
| `#273` | `src/main/index.ts` | **Bootstrap-Verdrahtung 6/7** – s. Warnung unten |

### M7 – Oberfläche & Komfort (9 bereit)

| Issue | Datei | Kern der Aufgabe |
|---|---|---|
| `#194` | `src/renderer/app-shell/reiter.ts` | Reiter-Zustand und Reiterwechsel |
| `#204` | `src/renderer/app-shell/medien-import-uebergabe.ts` | Übergabe-Ziel Medien-Import |
| `#208` | `src/renderer/queue-panel/fortschritt.ts` | Feiner Render-Fortschritt |
| `#209` | `src/renderer/queue-panel/entfernen.ts` | Entfernen und Abbrechen |
| `#210` | `src/renderer/queue-panel/wiederholen.ts` | Wiederholen |
| `#213` | `src/renderer/preview-player/zeitachse.ts` | Frame-gerundete Zeitachse |
| `#233` | `src/renderer/app-shell/undo-stapel.ts` | Schnappschuss-Stapel (Undo/Redo) |
| `#241` | `src/main/project-store/oeffne-projektordner.ts` | Projektordner im Datei-Explorer öffnen |
| `#246` | `src/renderer/gemeinsam/video-handles.ts` | Video-Handles vor dem Löschen freigeben |

### M8 – Marken (2 bereit)

| Issue | Datei | Kern der Aufgabe |
|---|---|---|
| `#288` | `src/main/marken-store/pfade.ts` | Pfad-Autorität des Modules (Assets-Wurzel, Marken-Ordner, Pfad-Lösung innerhalb der Wurzel) |
| `#292` | `src/renderer/gemeinsam/kontrast.ts` | WCAG-Kontrast-Rechnung als geteilte Funktion |

---

## 2. Wellenplan (Stand 16.08.2026, vorausgesetzt: nächste Welle)

**Regel:** Zwei Agents bearbeiten nie dieselbe Datei. Die einzige Datei-Kollision dieser 20 ist
`src/main/index.ts` für `#272` und `#273`.

### Gruppe A – parallel, 18 Agents, je eine eigene Datei (kollisionsfrei)

Je Agent genau **ein** Issue aus diesen 18 – die Datei ist pro Issue einmalig:

`#101` `#107` `#130` `#135` `#142` `#144` `#146` `#194` `#204` `#208` `#209` `#210` `#213` `#233`
`#241` `#246` `#288` `#292`

### Gruppe B – sequentiell, 1 Agent für die Bootstrap-Kette

`#272` → `#273` auf `src/main/index.ts`. **Zuerst `#272`, nach dessen Fertigstellung `#273`** –
nie parallel, oder von einem einzigen Agenten in einem Zug (s. 4b).

### Übrig bleiben aus dieser Welle (bewusst, kein Fehler)

- `#276` ist bereits **gebaut** (s. 4a) – nur der DoD-Typ-Test steht offen.
- `#8`, `#332`, `#333` und die M7/M8-`UNKLAR`-Issues sind **nicht** baubereit (Zeilentext
  aus `bereitschaft.py`); sie blockieren keinen Start dieser Welle.

---

## 3. Agent-Briefings je Issue

> Je Issue steht dein Briefing in einem eigenen Block. Lies **deinen** Block + Abschnitt 0 oben +
> ggf. einen markierten Sonderfall. Das GitHub-Issue (`gh issue view <nummer>`) bleibt deine ganze
> Welt – Signatur, Invarianten, Fehlerpfade, DoD.

### M4

| Issue | Kurz-Briefing |
|---|---|
| `#101` | **Datei:** `src/main/vorlagen-store/oeffne-zur-bearbeitung.ts` · **Verifikation:** `typecheck:main`, `eslint`, Unit-Test in `tests/unit/` · **Hinweis:** neuer Rumpf, Signatur aus Issue verträgt keine eigenen Importe (`fs`, `randomUUID` verboten – Grep-Probe im DoD). |
| `#107` | **Datei:** `src/main/vorlagen-store/loesche-vorlage.ts` · **Verifikation:** `typecheck:main`, `eslint`, Unit-Test · **Hinweis:** blockierendes Löschen; beide Trefferlisten (`VorlagenNutzung`) in `fehler.daten`. STOPP lesen, Referenz-Suche im DoD. |

### M5

| Issue | Kurz-Briefing |
|---|---|
| `#130` | **Datei:** `src/renderer/composer/einblendung-vorschau.ts` · **Verifikation:** `typecheck:renderer`, `eslint`, Unit-Test · **Hinweis:** reine Anzeige-Rechnung, wirkt in der Abschnittsfolge; kein IPC. |
| `#135` | **Datei:** `src/renderer/action-editor/bibliothek.ts` · **Verifikation:** `typecheck:renderer`, `eslint`, Unit-Test · **Hinweis:** Aktions-Bibliothek des Projekts; kaputte Aktionen kennzeichnen. |
| `#142` | **Datei:** `src/renderer/action-editor/aktion-loeschen.ts` · **Verifikation:** `typecheck:renderer`, `eslint`, Unit-Test · **Hinweis:** Kaskade VOR dem Löschen sichtbar machen (Bestätigung), keine direkte Löschung hier. |
| `#144` | **Datei:** `src/renderer/vorlagen-editor/zonen-canvas.ts` · **Verifikation:** `typecheck:renderer`, `eslint`, Unit-Test · **Hinweis:** Canvas-Interaktion (ziehen, bemaßen, einrasten) – Geometrie-Randfälle sind im DoD aufgeführt. |
| `#146` | **Datei:** `src/renderer/vorlagen-editor/zonen-liste.ts` · **Verifikation:** `typecheck:renderer`, `eslint`, Unit-Test · **Hinweis:** Zonen-Liste = Zeichenreihenfolge (z vor n); Ordnung im DoD prüfen. |
| `#272` | **Datei:** `src/main/index.ts` · **Verifikation:** `typecheck:main`, `eslint`, `build:main` · **Hinweis:** Bootstrap-Verdrahtung 5/7 – siehe Sonderfall 4b. M5-Module einhängen; **erst nach diesem Issue `#273`**. |

### M6

| Issue | Kurz-Briefing |
|---|---|
| `#273` | **Datei:** `src/main/index.ts` · **Verifikation:** `typecheck:main`, `eslint`, `build:main` · **Hinweis:** Bootstrap-Verdrahtung 6/7 – siehe Sonderfall 4b. **NUR wenn `#272` fertig ist** (nicht parallel). |

### M7

| Issue | Kurz-Briefing |
|---|---|
| `#194` | **Datei:** `src/renderer/app-shell/reiter.ts` · **Verifikation:** `typecheck:renderer`, `eslint`, Unit-Test · **Hinweis:** Reiter-Zustand und -wechsel; aktive Modus-Konstante aus dem Issue. |
| `#204` | **Datei:** `src/renderer/app-shell/medien-import-uebergabe.ts` · **Verifikation:** `typecheck:renderer`, `eslint`, Unit-Test · **Hinweis:** Übergabe-Ziel des Medien-Imports; Übergabe-Kanal/Konvention aus `system-design-context.md`. |
| `#208` | **Datei:** `src/renderer/queue-panel/fortschritt.ts` · **Verifikation:** `typecheck:renderer`, `eslint`, Unit-Test · **Hinweis:** feiner Render-Fortschritt; Fortschritts-Zustand kommt über die Queue-Ereignisse. |
| `#209` | **Datei:** `src/renderer/queue-panel/entfernen.ts` · **Verifikation:** `typecheck:renderer`, `eslint`, Unit-Test · **Hinweis:** Entfernen und Abbrechen; Auftrags-Zustände aus dem Issue, nicht erfinden. |
| `#210` | **Datei:** `src/renderer/queue-panel/wiederholen.ts` · **Verifikation:** `typecheck:renderer`, `eslint`, Unit-Test · **Hinweis:** Wiederholen einer Warteschlangen-Zeile; DoD-Grenzfälle untersuchen. |
| `#213` | **Datei:** `src/renderer/preview-player/zeitachse.ts` · **Verifikation:** `typecheck:renderer`, `eslint`, Unit-Test · **Hinweis:** frame-gerundete Zeitachse; Rundung ist im DoD bestimmt, nicht weich zeichnen. |
| `#233` | **Datei:** `src/renderer/app-shell/undo-stapel.ts` · **Verifikation:** `typecheck:renderer`, `eslint`, Unit-Test · **Hinweis:** Schnappschuss-Stapel (Undo/Redo); Stack-Disziplin (Tiefe, Parents) aus dem Issue. |
| `#241` | **Datei:** `src/main/project-store/oeffne-projektordner.ts` · **Verifikation:** `typecheck:main`, `eslint`, Unit-Test · **Hinweis:** Datei-Explorer öffnen; Pfad-Auflösung ohne `fs`-Schreibzugriff, System-Call laut Issue. |
| `#246` | **Datei:** `src/renderer/gemeinsam/video-handles.ts` · **Verifikation:** `typecheck:renderer`, `eslint`, Unit-Test · **Hinweis:** Video-Handles vor dem Löschen freigeben; kein `fs` im Renderer (IPC über `window.api`). |

### M8

| Issue | Kurz-Briefing |
|---|---|
| `#288` | **Datei:** `src/main/marken-store/pfade.ts` · **Verifikation:** `typecheck:main`, `eslint`, Unit-Test · **Hinweis:** Pfad-Autorität – reine String-Operation, KEIN `fs`-Aufruf und keine Existenzprüfung (steht im Gerüst-Kommentar); `loeseMarkenDateiPfad` nimmt nach Normalisierung nur Pfade innerhalb der Marken-Wurzel. |
| `#292` | **Datei:** `src/renderer/gemeinsam/kontrast.ts` · **Verifikation:** `typecheck:renderer`, `eslint`, Unit-Test · **Hinweis:** WCAG-Kontrast; 8-stelliges Hex ignoriert der Alpha-Kanal (wirft nicht); `schwellenwert` ist Pflicht-Parameter, keine Konstante hier. |

---

## 4. Die besonderen Fälle dieser Welle

### 4a. #276 ist gebaut – nur der DoD-Typ-Test fehlt

`src/main/marken-store/fehlercodes.ts` ist eine **reine Typdefinition ohne werfenden Rumpf**. Damit
zählt `bereitschaft.py` die Datei als „gebaut", sobald sie existiert. Der Generator hat sie am
16.08. aus dem Signaturblock erzeugt – die Union steht wortwörtlich. **Offen ist nur noch der
DoD-Punkt „ein Typ-Test belegt …"**: Ein Agent, der die Welle minutiös schließt, schreibt für
`#276` einzig den kleinen `ergebnis.ts`-Typ-Test (in der zugehörigen Testdatei). Die Datei selbst
wird dann **nicht mehr angefasst**. `#276` gehört deshalb **nicht** zu Gruppe A dieser Welle.

### 4b. #272 und #273 – dieselbe Datei, unbedingt nacheinander

Beide Issues arbeiten auf **`src/main/index.ts`** (Bootstrap-Verdrahtung 5/7 und 6/7). Die Datei
existiert bereits von Hand (der geruest-Lauf meldet `[fremd oder alt]` – das ist richtig so, kein
Gerüst-Rumpf mehr). Es gilt:

- **Ein Agent allein füllt `src/main/index.ts`**, nie zwei parallel.
- Die Verdrahtung ist eine **Kette**: `#268 → #269 → #270 → #271 → #272 → #273 → #274 → #331`
  (CLAUDE.md, „Stand heute"). `#272` und `#273` sind **paarweise** zu bearbeiten: erst 272, dann 273,
  oder beides in einem Zug – denn jede Veränderung an der einen Stelle berührt die andere.
- Wer hier etwas verändert, prüft zusätzlich `npm run build:main`.

### 4c. Die drei vorbestehenden Test-Fehlschläge

`npm test` meldet am 16.08.2026 **3 Fehlschläge**, die **vorbestehend** sind (auf sauberem `main`
ohne jede Änderung bestätigt): `tests/unit/datenort.spec.ts` (1) und `tests/unit/einzel-instanz.spec.ts`
(2). Sie hängen nicht mit der Gerüst-Welle zusammen. **Nicht „reparieren"**, wenn du sie in deinem
Diff nicht verursacht hast – aber im Finalbericht erwähnen.

### 4d. Auch „bereit" heißt nicht „gebaut" – die Aufrufer-Frage

Ein baubares Issue garantiert **nicht**, dass sein Aufrufer schon existiert. Wenn dein Issue eine
Funktion erwartet, die ein ANDERES Issue liefert, steht deren **Signatur komplett** im
„Fremde Aufrufe"-Kommentar deiner Datei (vom Generator eingetragen). Nutze die, rätsele nicht.
Fertig ohne Aufrufer ist keine kaputte Arbeit, aber: Der Aufrufer wird in einem späteren Issue
verdrahtet – das steht als „Blockiert"-Relation im Issue.

---

## 5. Kontext lesen – Reihenfolge

1. **Diese Datei** (kurz halten).
2. **CLAUDE.md**, „Stand heute" (Projektregeln, die teuer gelernt wurden).
3. **Dein Issue vollständig** auf GitHub (`gh issue view <nummer>`).
4. Bei Renderer-Arbeit: `docs/agents/system-design-context.md` – wie die Renderer-Module
   untereinander kommunizieren (Übergabe-Overlays, Kanäle, `window.api`).
5. `docs/agents/uebergabe-stand.md` nur als Hintergrund, wenn du wissen willst, WIE die Issues
   entstanden sind (fürs Bauen meist unnötig).

## 6. Verifikation

- `npm run typecheck` – alles grün (auch deine Datei).
- `npx eslint <deine-datei>` – ohne die Abschaltzeile von Zeile 1.
- `npm test` – deine neue Testdatei grün; die 3 vorbestehenden Fehlschläge (4c) unverändert.
- Zusätzlich für `#272`/`#273` und andere `src/main`-Arbeit: `npm run build:main`.
- Zusätzlich für `#288`/`#292` (Marken-Modul): `npm run typecheck:main` bzw.
  `npm run typecheck:renderer`.
- `python3 tools/bereitschaft.py` – dein Issue erscheint nicht mehr als `bereit` (bei #276: s. 4a).