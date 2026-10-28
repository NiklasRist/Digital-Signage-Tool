# Session 28.10.2026 (zweite Sitzung) – Push, drei Fenster-Belege, #446, FA-13

**Ausgangslage:** Übergabe vom 28.10.2026 (erste Sitzung) – **#445/#394/#364** gebaut,
**nicht gepusht**, Treiber-Matrix-Kopf nachgezogen, **#446** angelegt. Nächster Schritt laut
Übergabe: Fensterbelege, dann #446.

**Ergebnis:** 180 Commits gepusht; vier neue Treiber-Schritte mit Fensterbelegen
(**4o/4p/4q/4r**); #446 in zehn Läufen gemessen; **FA-13 gebaut** (#100/#155);
**#445/#364/#100/#155 geschlossen**; Q1.2 vermessen.

---

## 1. Push (auf Anweisung)

`a53e64d..fd563b4` → `origin/main`, **180 Commits**, 431 Dateien (+17.368/−7.685).
`main` = `origin/main`, Arbeitsbaum sauber. Das Remote meldet **45 Dependabot-Findings**
(22 high/16 moderate/7 low) – **nicht geprüft**, auf Anweisung zurückgestellt
(„Funktionen vor Sicherheit").

Der Gate-Lauf lag **vor** den drei Doku-Commits; nachgeprüft wurde nur
`treiber-matrix.spec.ts` (3/3 grün). Kein voller Gate-Lauf zwischen Push und Doku.

---

## 2. Die vier neuen Treiber-Schritte

| Schritt | Issue | Was am echten Fenster gemessen wird | Beleg (Lauf 28.10.2026) |
|---|---|---|---|
| **4o** | #394 | Statistik-Leiste im Composer: da, in der Kopfzeile, Zähler gegen `project.json` | `Gesamtdauer "0:02", 1 Element / 1 Video / 0 Segmente`, Warnung „unter der Schwelle" |
| **4p** | #364 | `getImageData` auf Filmstreifen-Kacheln; Bühne bleibt `media://` | 6 Kacheln, **kein SecurityError**, **74–82 Farben** je Kachel; Bühne `media://…mp4` |
| **4q** | #445 | „Neue Aktion" → Titel → Feld verlassen → Anlegen | Aktionen **1 → 2**, Titel in `project.json` und Bibliothek; leerer Titel: `Der Titel fehlt …`, **2 → 2** |
| **4r** | #100 | „Neu: einblendung" legt 162-px-Vorlage an | `art=einblendung, hoehe=162, zonen=["hintergrund","logo"]`, Scrim-Verlauf, Logo `{96,20,240,69}` |

Die Schritte stehen in `scripts/durchlauf.mjs`; die Matrix ist nachgezogen
(`docs/agents/treiber-matrix.md`, Zuordnung 4o→FA-08, 4p→FA-07, 4q→FA-02, 4r→FA-13).
`treiber-matrix.spec.ts` grün (3/3).

**Ehrlich:** 4o misst die **aktuelle** Platzierung, nicht ihre Genehmigung; #394 bleibt
deshalb offen. **FA-13 bleibt in der Matrix `teilweise`** – freie Zonen verschieben/bemaßen
ist ungemessen.

---

## 3. #446 – FA-03 in zehn Läufen

Zehn aufeinanderfolgende Treiber-Läufe **10:17–10:56 UTC**, alle **Exit 0**,
4g3 jedes Mal `gefunden=true`, **keine Befunde**. Mit den zwei Gate-Läufen davor:
**12 Läufe ohne roten 4g3**.

Diagnose in allen zehn identisch: `Fensterfokus=true`, `Feld hatte Fokus=true`,
`aktives Element danach=BODY`.

**DoD-Abgleich:** „zehn aufeinanderfolgende Läufe grün" **erfüllt**; „Ursache benannt"
**nicht** – es gab keinen roten Lauf mit den neuen Protokollwerten. **#446 bleibt offen.**

---

## 4. FA-13 gebaut (#100/#155)

### #100 – Store

`erstelleVorlage('einblendung', 162, …)` legt an:

- feste Zonen `hintergrund` (0, 0, 1920, 162) + `logo` (96, 20, 240, 69) aus
  `band-standard`, Zeichenreihenfolge wie dort;
- `hintergrund` mit **Scrim-Verlauf** `scrimStart → scrimEnde`, Richtung `unten`,
  **ohne** `flaecheDunkel`-Füllung (TK 9.11.1, Entscheidung 23.10.2026; TK 9.2.8:
  Deckkraft folgt der Vorlagenart).

Andere Bandhöhen bleiben `unbekannter_fehler` – die Logo-Regel für andere Höhen fehlt
weiterhin, sie wird **nicht** geraten.

### #155 – Übersicht

- `ANLEGBARE_ARTEN` hat den dritten Eintrag → Knopf „Neu: einblendung (162)".
- **DoD nachgeholt:** `tests/unit/vorlagen-uebersicht.spec.ts` (**26 Tests**). Dabei eine
  echte Lücke gefunden und behoben: `entferneVorlage` schickte auch eine **eingebaute**
  Vorlage an den IPC-Kanal; die DoD verlangt `ungueltige_eingabe` **ohne** Aufruf. Jetzt
  prüft die Funktion zuerst gegen die geladene Übersicht.
- `tests/unit/vorlagen-anlegen-einblendung.spec.ts` (**4 Tests**).
- `tests/unit/erstelle-vorlage.spec.ts` **21 → 24** (der alte Test „legt für eine
  einblendung NICHTS an" war die offene Entscheidung – mit Begründung umgedreht).

### Gegenproben

| Probe | Wirkung | Prüfsumme vorher/nachher |
|---|---|---|
| Quelle für `einblendung` entfernt | 3 Tests rot | `4a46ed93…` |
| Scrim-Mapping entfernt | 1 Test rot | `4a46ed93…` |
| `ANLEGBARE_ARTEN`-Eintrag entfernt | 2 Tests rot | `82ea7a2b…` |
| Vorprüfung in `entferneVorlage` entfernt | 1 Test rot | `82ea7a2b…` |

Alle Rücknahmen byte-identisch (`shasum -a 256 -c`).

### Außerhalb der Issue-Dateiliste (im Commit benannt)

`scripts/durchlauf.mjs` (Schritt 4r), `docs/agents/treiber-matrix.md`,
`docs/agents/oberflaeche-durchlauf.md` (vom Lauf erzeugt), `CLAUDE.md`.

---

## 5. Q1.2 vermessen (nicht gebaut)

| Maß | Zahl |
|---|---|
| Kommentarzeilen mit Issue-Referenz in `src/**` | **3.519** |
| verschiedene referenzierte Issues | 356 |
| Cluster mit Vorkommen in **≥ 5 Dateien** | **188** |
| Dateien an diesen Clustern | **308** |
| wiederholte Prosa-Begründungen (≥ 60 Zeichen) | **197 Gruppen**, 449 Dateien |

Größte Cluster: **#49** (42 Dateien), **#47** (29), **#32** (27), **#46** (25),
**#21** (24), **#23/#34** (23), **#76/#192/#25/#243** (22).

**Nebenbefund:** **74 Dateien** tragen noch einen Block *„Fremde Aufrufe – vollständige
Signaturen, damit hier nichts geraten wird"*. Das sind Kopien fremder Verträge im Code –
eine zweite Quelle, die das Projekt sonst vermeidet – und ein **Q1.1-Rest**, kein Q1.2-Fall.

**Empfehlung:** diesen Rest als eigene Charge zuerst (mechanisch, Gate je Modul), danach
Q1.2 bewusst nur über die Top-10-Cluster, mit Bilanz nach dem ersten Batch.

---

## 6. Zahlen und Commits

- **Gate:** `npm run pruefung` **Exit 0** – **5.692 Unit-Tests (340 Dateien)**,
  **49 Integrationstests (12 Dateien)**, Treiber **0 Befunde**; Typecheck/Lint 0.
- Commits dieser Sitzung (lokal, **nicht gepusht**):
  `7f5896c` (Push-Status), `4f990b5` (4o/4p/4q), `3418add` (zehn Läufe/Handover),
  `f05acef` (#445/#364 geschlossen), `01f696d` (FA-13), `09bd8e2` (#100/#155 geschlossen),
  dazu der Handover-Nachtrag mit Q1.2.
- **Offene Issues: 26 → 22.**

---

## 7. Offen / nächste Sitzung

**Beim Auftraggeber:**
- **#394** – Platzierung der Statistik (Leiste / Panel / Teil der Liste).
- **#303**, **#433**, **FA-11/FA-12** – optische Abnahme am echten Fenster.
- **#442** – Reproduktion (Aktion an einer Zeitstelle im Video).
- **#443** – Videosteuerung (entschieden 22.10., Bau offen).
- **Banner #365–#376** – erst AD/TK-Nachtrag (Entscheidung).
- **Push** – nur auf Anweisung.

**Allein machbar:**
- **74 „Fremde Aufrufe"-Blöcke** entfernen (Q1.1-Rest, mechanisch, Gate je Modul).
- **Q1.2** über die Top-10-Cluster, Bilanz nach dem ersten Batch.
- **Mutations-Chargen** (138 Dateien mit `readFileSync`, 92 mit Grep-/Bauvorschriften-
  `describe`) – belegter Ballast, Chargen mit Gate.
- **#393** Vorlagen-Live-Vorschau (kein `braucht-entscheidung`, Muster aus #303/A1).
- **#446** bleibt offen; ein roter Lauf mit den vier Protokollwerten gehört dorthin.
