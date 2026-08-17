# Bau-Welle: die baubereiten Issues (Stand 17.08.2026)

> **ERLEDIGT – Welle abgeschlossen.** Alle 14 Issues wurden am 17.08.2026 gebaut, verifiziert
> und je einzeln committet (Batch 1: `1f4af69`–`e27f856`; Batch 2: `322e969`–`5466c4a`; dazu
> zwei typecheck-Fixes `3013a12`/`1a98104`). Nur noch als Referenz: Die Abschnitte unten
> beschreiben den Plan vor der Ausführung. Die erste bereite Gruppe der nächsten Welle zeigt
> `python3 tools/bereitschaft.py` – Stand jetzt (17.08.): M4 bereit `#109`, M5–M8 0 bereit.

> **Für eine neue Sitzung, die Issues BAUEN will.** Diese Datei sagt, welche Issues JETZT baubar
> sind, was je Issue zu tun ist und welche Fallen die Welle kennt. Sie ist **das** Einsteigedoku für
> einen Bau-Agenten. Die Vorgänger-Welle (16.08.) steht in `docs/agents/bau-welle-bereit-16-08.md` –
> die dortigen Abschnitte 0, 4c und 4d gelten unverändert auch hier.

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

**Keine zwei Agents arbeiten je an derselben Datei.** In dieser Welle teilt sich KEIN bereites
Issue eine Datei mit einem anderen bereiten Issue – die 14 Ziel-Dateien sind disjunkt (geprüft am
17.08. per Gerüst-Scan). `src/main/index.ts` ist in dieser Welle **nicht** betroffen.

---

## 1. Die 14 baubereiten Issues (bereitschaft.py, 17.08.2026)

`bereitschaft.py` meldet **14 Issues als baubereit**, alle mit eigenem, unangetastetem
Gerüst-Rumpf. Zwei davon wurden am 17.08. neu generiert (`#290`, `#301`) – siehe Sonderfall 4a.
Die Ziel-Datei je Issue ist die **erste Zeile des Datei-Abschnitts** (`## Modul & Datei`), im Kopf
jeder Gerüst-Datei als `// GENERIERT aus dem Signaturblock von Issue #N.` notiert.

### M4 – Pixel (4 bereit)

| Issue | Datei | Kern der Aufgabe |
|---|---|---|
| `#102` | `src/main/vorlagen-store/speichere-arbeitskopie.ts` | Arbeitskopie fortlaufend + entprellt sichern |
| `#103` | `src/main/vorlagen-store/uebernehme-in-parent.ts` | Arbeitskopie vollständig in den Parent übernehmen |
| `#104` | `src/main/vorlagen-store/als-eigenstaendige.ts` | Arbeitskopie unter neuem Namen lösen |
| `#105` | `src/main/vorlagen-store/verwerfe-arbeitskopie.ts` | Bearbeitungsstand fallenlassen |

### M5 – Inhalte (2 bereit)

| Issue | Datei | Kern der Aufgabe |
|---|---|---|
| `#145` | `src/renderer/vorlagen-editor/inspektor.ts` | Zahlen-Inspektor für exakte Rahmenwerte |
| `#147` | `src/renderer/vorlagen-editor/zone-hinzufuegen.ts` | Neue freie Zone: Text/Bild/Dekoration |

### M7 – Oberfläche & Komfort (6 bereit)

| Issue | Datei | Kern der Aufgabe |
|---|---|---|
| `#196` | `src/renderer/app-shell/start.ts` | Start-Ablauf: Sitzung wiederherstellen |
| `#201` | `src/renderer/app-shell/reparatur-fuehrung-shell.ts` | Reparatur-Fortschritt als Werte in der Sicht |
| `#214` | `src/renderer/preview-player/transport.ts` | Transport: Uhr auf der Zeitachse (Play/Pause/Springen) |
| `#220` | `src/renderer/preview-player/band-takt.ts` | Zeitverhalten des Werbebandes |
| `#228` | `src/renderer/composer/medien-import.ts` | Import aus der Medien-Bibliothek anstoßen |
| `#234` | `src/renderer/app-shell/undo-historien.ts` | Zwei getrennte Undo-Historien |

### M8 – Marken (2 bereit)

| Issue | Datei | Kern der Aufgabe |
|---|---|---|
| `#290` | `src/main/marken-store/marken-protokoll.ts` | Lese-Protokoll `marken://` für den Marken-Ordner |
| `#301` | `src/renderer/marken-editor/kontrast-warnung.tsx` | Kontrast-Warnung zwischen Akzentfläche und Text |

---

## 2. Wellenplan (Stand 17.08.2026)

**Regel:** Zwei Agents bearbeiten nie dieselbe Datei. In dieser Welle sind alle 14 Ziel-Dateien
**disjunkt** – es gibt **keine** Gruppe B, kein `src/main/index.ts`.

### Gruppe A – parallel, 14 Agents, je eine eigene Datei (kollisionsfrei)

Je Agent genau **ein** Issue aus diesen 14 – die Datei ist pro Issue einmalig:

`#102` `#103` `#104` `#105` `#145` `#147` `#196` `#201` `#214` `#220` `#228` `#234` `#290` `#301`

### Empfohlene Batch-Größe

Wie in der Vorgänger-Welle: **erst 6, dann 8** Agents starten (der Projektverantwortliche
committet je Issue einzeln und verifiziert danach unabhängig). Die Milestones sind dabei so
verteilt, dass in jeder Stufe mehrere Milestones abgedeckt sind:

- **Batch 1 (6):** `#102` `#103` `#104` `#105` (M4) + `#145` `#147` (M5)
- **Batch 2 (8):** `#196` `#201` `#214` `#220` `#228` `#234` (M7) + `#290` `#301` (M8)

---

## 3. Agent-Briefings je Issue

> Je Issue steht dein Briefing in einem eigenen Block. Lies **deinen** Block + Abschnitt 0 oben +
> ggf. einen markierten Sonderfall. Das GitHub-Issue (`gh issue view <nummer>`) bleibt deine ganze
> Welt – Signatur, Invarianten, Fehlerpfade, DoD.

### M4

| Issue | Kurz-Briefing |
|---|---|
| `#102` | **Datei:** `src/main/vorlagen-store/speichere-arbeitskopie.ts` · **Verifikation:** `typecheck:main`, `eslint`, Unit-Test · **Hinweis:** fortlaufendes, entprelltes Sichern der Arbeitskopie; die Entprell-Logik steht wörtlich im Issue. |
| `#103` | **Datei:** `src/main/vorlagen-store/uebernehme-in-parent.ts` · **Verifikation:** `typecheck:main`, `eslint`, Unit-Test · **Hinweis:** der Inhalt der Arbeitskopie **ersetzt** den Parent; Verzeichnis-/Referenz-Übernahme laut Issue, `aendereBestand` ist die einzige erlaubte Mutationsquelle. |
| `#104` | **Datei:** `src/main/vorlagen-store/als-eigenstaendige.ts` · **Verifikation:** `typecheck:main`, `eslint`, Unit-Test · **Hinweis:** Arbeitskopie unter neuem Namen von ihrem Parent lösen; Namen-/Kollisionsregeln im DoD. |
| `#105` | **Datei:** `src/main/vorlagen-store/verwerfe-arbeitskopie.ts` · **Verifikation:** `typecheck:main`, `eslint`, Unit-Test · **Hinweis:** verwerfen heißt **genau die Arbeitskopie** entfernen; was zurückbleibt, steht im Issue. |

### M5

| Issue | Kurz-Briefing |
|---|---|
| `#145` | **Datei:** `src/renderer/vorlagen-editor/inspektor.ts` · **Verifikation:** `typecheck:renderer`, `eslint`, Unit-Test · **Hinweis:** `x`, `y`, `breite`, `höhe` als Zahl eingeben; die Geometrie kommt aus `#144` (`begrenzeAufFlaeche`, `MINDEST_ZONEN_KANTE_PX`), NICHT neu erfinden. |
| `#147` | **Datei:** `src/renderer/vorlagen-editor/zone-hinzufuegen.ts` · **Verifikation:** `typecheck:renderer`, `eslint`, Unit-Test · **Hinweis:** neue freie Zone in einer der drei Sorten; Geometrie aus `#144`, Farb-/Schriftrollen aus `#52`. |

### M7

| Issue | Kurz-Briefing |
|---|---|
| `#196` | **Datei:** `src/renderer/app-shell/start.ts` · **Verifikation:** `typecheck:renderer`, `eslint`, Unit-Test · **Hinweis:** Start-Ablauf liest Konfiguration, öffnet zuletzt aktives Projekt, landet im richtigen Reiter; mehrere Rümpfe in dieser Datei (nur die zu `#196` füllen – alle tragen ihre Issue-Nummer). |
| `#201` | **Datei:** `src/renderer/app-shell/reparatur-fuehrung-shell.ts` · **Verifikation:** `typecheck:renderer`, `eslint`, Unit-Test · **Hinweis:** Fortschritt „X von N" und hervorgehobene Aktion als Werte in der Sicht; mehrere Rümpfe in der Datei (nur `#201` füllen). |
| `#214` | **Datei:** `src/renderer/preview-player/transport.ts` · **Verifikation:** `typecheck:renderer`, `eslint`, Unit-Test · **Hinweis:** Uhr läuft auf der Zeitachse aus `#213` (`findeAbschnitt`, `lokalerFrame`) – NICHT selbst rechnen; mehrere Rümpfe (nur `#214`). |
| `#220` | **Datei:** `src/renderer/preview-player/band-takt.ts` · **Verifikation:** `typecheck:renderer`, `eslint`, Unit-Test · **Hinweis:** welcher Bandabschnitt pro Frame; nutzt `sekundenZuFrame` aus `#213`; mehrere Rümpfe (nur `#220`). |
| `#228` | **Datei:** `src/renderer/composer/medien-import.ts` · **Verifikation:** `typecheck:renderer`, `eslint`, Unit-Test · **Hinweis:** Import aus der Bibliothek; `starteMedienImport`/`ImportUebergabeErgebnis` aus `#204` sind die definierende Quelle. |
| `#234` | **Datei:** `src/renderer/app-shell/undo-historien.ts` · **Verifikation:** `typecheck:renderer`, `eslint`, Unit-Test · **Hinweis:** genau ZWEI Historien (Projekt + Vorlage), Reiterwechsel vermischt sie nicht; Stapel aus `#233` (`erzeugeUndoStapel`, `UndoStapel<T>`); mehrere Rümpfe (nur `#234`). |

### M8

| Issue | Kurz-Briefing |
|---|---|
| `#290` | **Datei:** `src/main/marken-store/marken-protokoll.ts` · **Verifikation:** `typecheck:main`, `eslint`, Unit-Test · **Hinweis:** `MARKEN_SCHEMA` als DATEN (kein `registerSchemesAsPrivileged`-Aufruf hier – das macht #309 genau einmal); Pfad-Auflösung aus `#288` (`loeseMarkenDateiPfad`); Gerüst am 17.08. generiert (s. 4a). |
| `#301` | **Datei:** `src/renderer/marken-editor/kontrast-warnung.tsx` · **Verifikation:** `typecheck:renderer`, `eslint`, Unit-Test · **Hinweis:** sichtbar warnen, Auswahl NICHT verhindern (FA-24); Kontrast aus `#292` (`kontrastVerhaeltnis`, `erreichtKontrastSchwelle`); TSX-Komponente, Gerüst am 17.08. generiert (s. 4a). |

---

## 4. Die besonderen Fälle dieser Welle

### 4a. Zwei Gerüste wurden am 17.08. neu generiert

`#290` (`marken-protokoll.ts`) und `#301` (`kontrast-warnung.tsx`) hatten am Morgen des 17.08.
noch **keine** Gerüst-Datei. Der Generator hat sie aus dem Signaturblock erzeugt; danach wurden
zwei reine Typ-Importe ergänzt, damit typecheck grün ist (`CustomScheme` aus `electron` bzw.
`JSX` aus `react` – beides Typ-Auflösung, **kein** Signatur-Bruch). Die `GERUEST-PRUEFSUMME`
dieser beiden Dateien entspricht dem generierten Stand **nach** der Import-Ergänzung – ein
Bau-Agent füllt wie üblich nur den Rumpf.

### 4b. Mehrere Rümpfe in einer Datei – nur deinen füllen

Einige M7-Dateien (`start.ts`, `reparatur-fuehrung-shell.ts`, `transport.ts`, `band-takt.ts`,
`undo-historien.ts`) tragen mehrere werfende Rümpfe, die zu **verschiedenen** Issues gehören.
Jeder Rumpf nennt seine Issue-Nummer (`// Rumpf gehoert zu Issue #N.`). **Fülle ausschließlich
die Rümpfe mit deiner Issue-Nummer.** Die anderen bleiben werfen – sie gehören zu späteren
Issues und werden dort gefüllt.

### 4c. Die drei vorbestehenden Test-Fehlschläge

`npm test` meldet am 17.08.2026 **3 Fehlschläge**, die **vorbestehend** sind (auf sauberem `main`
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
- Zusätzlich für `src/main`-Arbeit (`#102`–`#105`, `#290`): `npm run typecheck:main` und
  `npm run build:main`.
- Zusätzlich für Marken-Arbeit (`#290`, `#301`): `npm run typecheck:main` bzw.
  `npm run typecheck:renderer`.
- `python3 tools/bereitschaft.py` – dein Issue erscheint nicht mehr als `bereit`.
