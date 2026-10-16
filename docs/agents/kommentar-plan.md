# Plan: Q1 – Kommentare entschlacken + Regeln

**Status:** Entwurf zur Abnahme. **Erstellt:** 16.10.2026.
**Herkunft:** `docs/agents/codequalitaet-programm.md`, Strang Q1.
**Regeln:** `docs/agents/kommentar-regeln.md` (beschlossen 16.10.2026).
**Art:** rein strukturell – **kein Verhaltenswechsel**; es werden ausschließlich **Kommentare** berührt.

## 1. Zweck

Die Codebasis ist „gut gebaut, schlecht erzählt" (~47 % Kommentarzeilen). Der größte
Einzelposten ist der **generierte Gerüst-Kopf** in fertigen Dateien: er erklärt den
Generator-Prozess, nicht den Code, und steht in **241** Dateien. Ihn zu entfernen senkt die
Lesekosten aller weiteren Arbeit - und ist laut Kopf selbst die vorgesehene Handlung.

## 2. Befund (gemessen 16.10.2026)

| Baustein | Dateien |
|---|---|
| `// GENERIERT aus dem Signaturblock …` | **241** |
| `// GERUEST-PRUEFSUMME: …` | **241** |
| voller Signatur-Vertrag („Die Signaturen sind VERBINDLICH") | 239 |
| verkürzter Vertrag („Signaturen VERBINDLICH aus dem Issue") | 3 |
| Absatz „ZUR ABSCHALTZEILE IN ZEILE 1 …" | **98** |
| Notiz „… Abschaltzeile … entfernt" | 54 |
| `[modul] Zweck`-Zeile (darf bleiben) | 256 |

**Sicherheit:** `tools/geruest.py` (Z. 406) fasst eine Datei **ohne** Prüfsumme nicht an
(„fremd oder alt"). Das Entfernen des Kopfes ist damit generatorseitig harmlos.

## 3. Vorgehen

### Q1.1 – Gerüst-Kopf entfernen (241 Dateien)

Je Datei:
- **entfernen:** die `// GENERIERT …`-Zeile, den Signatur-Vertrag (voll **und** verkürzt),
  die `// GERUEST-PRUEFSUMME: …`-Zeile, den `ZUR ABSCHALTZEILE`-Absatz und eine etwaige
  „Abschaltzeile entfernt"-Notiz;
- **behalten:** die `// [modul] Zweck`-Zeile als **eine** Kopfzeile (Regel 4), und **jede**
  von Hand geschriebene Begründung darunter;
- Randleerzeilen aufräumen.

Umsetzung in **Batches je Modul** (z. B. `auftrags-manager`, `project-store`, `renderer/composer` …),
je Batch ein Commit. Nach jedem Batch: `git diff` **nur Kommentarzeilen** (Gegenprobe unten),
`typecheck` 0, `lint` 0.

Die drei Sonderformen (`platzhalter.tsx` mit einzeiligem `/* GERUEST-PRUEFSUMME … */`,
die zwei verkürzten Verträge, führende Leerzeilen in `anlegen-oeffnen.ts`/`editor-vorschau.ts`)
werden einzeln behandelt und im Commit benannt.

### Q1.2 – Wiederholte Begründungen (später, fallweise)

Dieselbe Erklärung an mehreren Stellen auf **eine Adresse** ziehen (Regel 5), z. B. das
mehrfach nacherzählten `#342`/`#259`. Das ist Urteilsarbeit - eigener Schritt, Datei für Datei.

### Q1.3 – Durchsetzung

- **Maschinen-Guard:** ein Test, der für `src/**` verbietet, dass `GERUEST-PRUEFSUMME` oder
  `GENERIERT aus dem Signaturblock` vorkommt (Regel 3 mechanisch).
- **Kopf-Längen-Grenze** (Regel 4) nur, wenn sie ohne Fehlalarme geht - sonst Review-Regel.

## 4. Beleg je Schritt

- `npm run typecheck` → 0, `npm run lint` → 0, Suite **grün (Basis 5535 / 320 Dateien)**.
- **Gegenprobe „nur Kommentare":** `git diff -w` zeigt **nur** Zeilen, die mit `//`/`*`
  beginnen oder leer waren - belegt am Diff, nicht behauptet.

## 5. Nicht-Ziele

- **Keine** Code-, Signatur-, Verhaltens- oder Optikänderung.
- **Keine** inhaltliche Neubewertung der Begründungen (wer löscht, sichert zuerst die Quelle).
- Kein Entfernen von `SAFETY:`-Kommentaren.

## 6. Reihenfolge

Q1.1 (Kopf entfernen) → Q1.3 (Guard) → Q1.2 (Wiederholungen, fallweise).

---

## Nachtrag (16.10.2026, gebaut)

**Q1.1 + Q1.3 GEBAUT** (Branch `bau/kommentar-koepfe`): Der Gerüst-Kopf ist aus **allen 241**
Dateien entfernt (`[modul]`-Zweckzeile und Hand-Begründungen blieben); der Guard
(`tests/unit/kommentar-guard.spec.ts`) hält das mechanisch.

**Folge, offen dokumentiert:** **9 DoD-Grep-Proben** (einblendung-vorschau, medien-import,
bibliothek, zone-hinzufuegen, zonen-canvas, medien-import-uebergabe, zonen-liste, inspektor,
export-verdrahtung) forderten den entfernten Kopf. **User-Entscheidung 16.10.2026:** auf den
neuen Vertrag gezogen – sie prüfen jetzt „kein Gerüst-Kopf; Datei beginnt mit `// [`".
Die DoD wurde also **nicht** still umgeschrieben, sondern nach der Entscheidung angepasst.

Beleg: `git diff -- src` enthält **0 Nicht-Kommentar-Zeilen** (Gegenprobe); Typecheck/Lint 0;
Suite **5536 grün (321 Dateien)** + dokumentierter #324-Vorbefund; Build ok (Kommentare
ändern kein Laufzeitverhalten – der Treiber ist daher nicht betroffen).
