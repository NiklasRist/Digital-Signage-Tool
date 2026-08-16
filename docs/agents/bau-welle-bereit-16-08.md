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

`bereitschaft.py` meldet **20 Issues als baubereit**. Davon haben **18** einen stehenden,
unangetasteten Gerüst-Rumpf (bytegleich zum Issue-Stand geprüft am 16.08.2026). **Zwei weitere**
(#276, #292 in M8) hatten noch keine Datei – `tools/geruest.py` wurde am 16.08. auf M8 erweitert und
die Gerüste sind generiert.

Die Ziel-Datei je Issue ist die **erste Zeile des Datei-Abschnitts** (`## Modul & Datei`), im Kopf
jeder Gerüst-Datei als `// GENERIERT aus dem Signaturblock von Issue #N.` notiert.

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

### M8 – Marken (2 bereit; #276 faktisch schon erledigt)

| Issue | Datei | Kern der Aufgabe |
|---|---|---|
| `#276` | `src/main/marken-store/fehlercodes.ts` | Fehlercode-Union – **durch die Gerüst-Erzeugung bereits vollständig** (s. unten) |
| `#292` | `src/renderer/gemeinsam/kontrast.ts` | WCAG-Kontrast-Rechnung als geteilte Funktion |

---

## 2. Die besonderen Fälle dieser Welle

### 2a. #276 sieht bereitschaft.py nicht mehr als „bereit"

`src/main/marken-store/fehlercodes.ts` ist eine **reine Typdefinition ohne werfenden Rumpf**. Damit
zählt `bereitschaft.py` die Datei als „gebaut", sobald sie existiert. Der Generator hat sie am
16.08. aus dem Signaturblock erzeugt – die Union steht wortwörtlich. **Offen ist nur noch der
DoD-Punkt „ein Typ-Test belegt …"**: Ein Agent, der die Welle minutiös schließt, schreibt für
`#276` einzig den kleinen `ergebnis.ts`-Typ-Test (in der zugehörigen Testdatei). Die Datei selbst
wird dann **nicht mehr angefasst**.

### 2b. #272 und #273 – dieselbe Datei, unbedingt nacheinander

Beide Issues arbeiten auf **`src/main/index.ts`** (Bootstrap-Verdrahtung 5/7 und 6/7). Die Datei
existiert bereits von Hand (der geruest-Lauf meldet `[fremd oder alt]` – das ist richtig so, kein
Gerüst-Rumpf mehr). Es gilt:

- **Ein Agent allein füllt `src/main/index.ts`**, nie zwei parallel.
- Die Verdrahtung ist eine **Kette**: `#268 → #269 → #270 → #271 → #272 → #273 → #274 → #331`
  (CLAUDE.md, „Stand heute"). `#272` und `#273` sind **paarweise** zu bearbeiten: erst 272, dann 273,
  oder beides in einem Zug – denn jede Veränderung an der einen Stelle berührt die andere.
- Wer hier etwas verändert, prüft zusätzlich `npm run build:main`.

### 2c. Die drei vorbestehenden Test-Fehlschläge

`npm test` meldet am 16.08.2026 **3 Fehlschläge**, die **vorbestehend** sind (auf sauberem `main`
ohne jede Änderung bestätigt): `tests/unit/datenort.spec.ts` (1) und `tests/unit/einzel-instanz.spec.ts`
(2). Sie hängen nicht mit der Gerüst-Welle zusammen. **Nicht „reparieren"**, wenn du sie in deinem
Diff nicht verursacht hast – aber im Finalbericht erwähnen.

### 2d. Auch „bereit" heißt nicht „gebaut" – die Aufrufer-Frage

Ein baubares Issue garantiert **nicht**, dass sein Aufrufer schon existiert. Wenn dein Issue eine
Funktion erwartet, die ein ANDERES Issue liefert, steht deren **Signatur komplett** im
„Fremde Aufrufe"-Kommentar deiner Datei (vom Generator eingetragen). Nutze die, rätsele nicht.
Fertig ohne Aufrufer ist keine kaputte Arbeit, aber: Der Aufrufer wird in einem späteren Issue
verdrahtet – das steht als „Blockiert"-Relation im Issue.

---

## 3. Kontext lesen – Reihenfolge

1. **Diese Datei** (kurz halten).
2. **CLAUDE.md**, „Stand heute" (Projektregeln, die teuer gelernt wurden).
3. **Dein Issue vollständig** auf GitHub (`gh issue view <nummer>`).
4. Bei Renderer-Arbeit: `docs/agents/system-design-context.md` – wie die Renderer-Module
   untereinander kommunizieren (Übergabe-Overlays, Kanäle, `window.api`).
5. `docs/agents/uebergabe-stand.md` nur als Hintergrund, wenn du wissen willst, WIE die Issues
   entstanden sind (fürs Bauen meist unnötig).

## 4. Verifikation

- `npm run typecheck` – alles grün (auch deine Datei).
- `npx eslint <deine-datei>` – ohne die Abschaltzeile von Zeile 1.
- `npm test` – deine neue Testdatei grün; die 3 vorbestehenden Fehlschläge (2c) unverändert.
- `python3 tools/bereitschaft.py` – dein Issue erscheint nicht mehr als `bereit` (bei #276: s. 2a).