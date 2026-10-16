# Plan: Schreib-Mechanik gemeinsam nutzen (Q2/A, Weg 2)

**Status:** Entwurf zur Abnahme. **Erstellt:** 16.10.2026.
**Herkunft:** `docs/agents/codequalitaet-programm.md`, Strang Q2, Ziel A.
**Art:** struktureller Bau, **verhaltensneutral** (kein Verhaltens-/Datenwechsel).

## 1. Zweck

Die **byte-gleiche** Mechanik des atomaren Schreibens (Retry, Backup-Prüfung,
Fehler-Inspektion) liegt **5×** vor. Sie soll an **einer** Stelle leben. Das entfernt ~180
Zeilen echte Duplikation und macht einen Bugfix einmalig statt fünfmal.

## 2. Beleg (gemessen 16.10.2026, kommentarfrei normalisiert)

| Helfer | Fassungen über 5 `schreibe-*` | identisch |
|---|---|---|
| `mitWiederholung` | 1 (18 Zeilen × 5) | ja |
| `taugtAlsSicherung` | 1 (8 × 5) | ja |
| `istCode` | 1 (7 × 5) | ja |
| `text` | 1 (3 × 5) | ja |
| `inReihe`/`inKette` (Serienschreiber) | **3** | nein, echt verschieden |
| `schreibeJetzt`/`schreibeDateiNeu` (Domain) | **3+** | nein, echt verschieden |

## 3. Abwägung und Entscheidung (bewusste, begrenzte Umkehr)

Der gebaute Code verbietet wörtlich ein gemeinsames Modul („BEWUSST NICHT importiert …
Modulgrenze für eine Zahl", in allen fünf Dateien). Diese Entscheidung wird hier **bewusst und
begrenzt** aufgehoben — ihr Schutzgegenstand bleibt erhalten:

- **Geschützt bleibt:** die **Zahl** `WARTEZEITEN_MS` (bleibt je Store) und die
  **Serialisierung** (Serien-Executor + `schreibeJetzt`/`schreibeDateiNeu` + Fehlercode-Typen
  bleiben je Store; TK 9.5.4 weist jedem Speicher eine EIGENE Serialisierung zu).
- **Geteilt wird nur** die domain-freie Mechanik.

Die Umkehr wird **nicht stillschweigend** vollzogen: im Modul-Kopf begründet und als
Nachtrag-Kommentar an den betreffenden Issues (#31, #47/#76, #98, #71) gemeldet.

## 4. Naht: was wandert, was bleibt

**Wandert** nach `src/main/gemeinsam/schreib-mechanik.ts`:
- `mitWiederholung(arbeit, wartezeiten)` — die Zahl reist als **Parameter** herein (kein geteilter Wert!),
- `taugtAlsSicherung(pfad)`,
- `istCode(ursache, ...codes)`,
- `text(ursache)`.

**Bleibt je Store:** `WARTEZEITEN_MS`, der Serien-Executor (`inReihe`/`inKette`),
`schreibeJetzt`/`schreibeDateiNeu`, Fehlercode-Union, Events/Entprellung, `schemaVersion`.

## 5. Schritte und Belege

Branch `bau/schreib-mechanik`. Jeder Schritt: `typecheck` 0, `lint` 0, Suite grün,
Treiber unverändert; ein Commit je Store.

- **S1** Modul + eigene **Unit-Tests** (`taugtAlsSicherung`, `mitWiederholung` mit übergebenen
  Wartezeiten, `istCode`, `text`).
- **S2** `config-store/schreibe-config.ts` umstellen.
- **S3** `marken-store/schreibe-marken.ts` umstellen.
- **S4** `project-store/schreibe-projekt.ts` umstellen.
- **S5** `auftrags-manager/schreibe-queue-json.ts` umstellen.
- **S6** `vorlagen-store/schreibe-vorlagen.ts` umstellen.

**Nachtrag S7 (16.10.2026, gebaut):** `text`/`istCode` sind generische Systemfehler-Helfer und
**nicht** schreibspezifisch – sie liegen jetzt neutral in `src/main/gemeinsam/systemfehler.ts`
(H1). `schreib-mechanik.ts` nutzt `istCode` von dort; **24 byte-gleiche Kopien** in `main/`
wurden entfernt (`ffmpeg-adapter/uniformitaet.ts` ausgenommen – andere Sache). Merge `76b52ef`.

**Sicherheitsnetz:** die fünf bestehenden `tests/unit/schreibe-*.spec.ts` pinnt je Store das
Verhalten; sie bleiben unverändert grün.

## 6. Nicht-Ziele

- Serien-Executor **nicht** vereinheitlichen (die drei Fassungen sind echt verschieden).
- `WARTEZEITEN_MS` **nicht** zusammenlegen.
- Keine Signatur-, Fehlercode- oder Verhaltensänderung.

## 7. Offene Entscheidung

Ort/Name des Moduls: `src/main/gemeinsam/schreib-mechanik.ts` (neu) — oder
`src/main/atomar-schreiben.ts`. Vorschlag: `gemeinsam/schreib-mechanik.ts`.
