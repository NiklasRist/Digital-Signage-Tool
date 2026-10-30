# Übergabe 30.10.2026 – Zonen-Namen und M9

**Diese Sitzung hat den Umbau gebaut, den die vorige entschieden hat.**

**Vorher:** [`uebergabe-2026-10-30-videosteuerung-suche-m9.md`](uebergabe-2026-10-30-videosteuerung-suche-m9.md).

---

## 1. Stand heute

| | Wert |
|---|---|
| Commits | **17 bis einschließlich `e4a5549` vor `origin/main`**, **nicht gepusht** (diese Übergabe kommt als eigener Commit dazu) |
| Arbeitsbaum | sauber |
| Gate | `npm run pruefung` **Exit 0** |
| Unit | **5.236** Tests in **342** Dateien |
| Integration | **50** in **13** Dateien (+1 neu) |
| Treiber | **0 Befunde** |
| Offene Issues | unverändert; gebaut, aber **nicht geschlossen**: #450–#454 |

**Die zwei Commits dieser Sitzung:**

| Commit | Inhalt |
|---|---|
| `1d4867a` | #454 – Zonen-Namen aus einer Quelle für beide Editoren |
| `e4a5549` | M9 – `art` entfällt, ein Band deckend über dem Video (94 Dateien) |

Die Unit-Zahl **sinkt** (5.389 → 5.236): Split-, Geometrie- und `art`-Tests sind mit
ihrem Gegenstand entfallen; die Migrationstests und der Deckend-Test sind neu.

---

## 2. #454 – Zonen-Namen (GEBAUT)

`src/renderer/gemeinsam/zonen-texte.ts`: je Kennung `{ name, zweck }`, neun Kennungen
der drei eingebauten Vorlagen. `ueberschrift` und `titel` teilen **einen** Eintrag.
Unbekannte Kennung → Rohwert, leerer Zweck, kein Wurf (auch `__proto__`, daher `hasOwn`).

- **Vorlagen-Editor:** `1. Hintergrund — Die Fläche unter allem – deckt das ganze Bild.`
  statt `Ebene 1: hintergrund`; der Knopf heißt `+ Textzone (Überschrift)`.
- **Marken-Editor:** `TITEL`-Tabelle entfällt. Sichtbare Folge: `cta` „Button" → **„Knopf"**,
  `scrim` „Verlauf" → **„Abdunkelung"**, `motiv` „Motiv" → **„Bild der Aktion"**.
- **Ehrlich offen:** Die gerenderte **Zeile** der Zonen-Liste hat keinen Wächter — keine Spec
  importiert `vorlagen-editor/index.tsx`, der Treiber liest die Liste nicht.

---

## 3. M9 – der Befund VOR dem Bau

Gemessen (`Vorlage.art` testweise entfernt, `tsc` über alle Konfigurationen):

- **21 Produktdateien** brechen, **38 Testdateien**.
- `berechneBandGeometrie` zu löschen nimmt `split-stile.ts` und die Split-Vorschau mit;
  `flaecheDunkel` zu streichen nimmt den Split-Zweig in `normalisieren.ts` mit.

**Damit ist #450 nicht allein grün baubar.** Seine DoD „keine Datei außerhalb der genannten"
ist unerfüllbar; #450 und #451 sind ein Atom, #452 und der Kern von #453 folgen typbedingt.
**Entscheidung (Niklas, 30.10.):** M9 komplett als ein Paket bauen. Der Widerspruch steht
im Commit `e4a5549` und hier.

---

## 4. Was gebaut ist

### A – Vertrag und Render-Pfad (#450)

- `VorlagenArt` und `Vorlage.art` gelöscht; `höhe` ist die **einzige** Aussage über die Fläche.
- `RenderRequest.einblendung`: `art` und `flaecheDunkel` gelöscht.
- `src/shared/band-geometrie.ts` und `src/main/ffmpeg-adapter/filter-split.ts` **gelöscht**;
  mit ihnen `markenFarbeZuFfmpeg`.
- `bestimmeBandgeometrie` prüft **nur noch die Höhe** (Meldungen unverändert) und liefert
  `Ergebnis<void>`; `y = 1080 − H` bildet `baueEinblendungFilter` (eine Subtraktion, keine
  eigene Funktion).
- **H = 1078 ist jetzt zulässig** — die Mindest-Videobreite gab es nur im Split.

### B – Store und Migration (#451)

- `erstelleVorlage(höhe, name)`; `ipc-verdrahtung` kennt keine `ARTEN` mehr.
- Eingebaute Vorlagen: **„Ganzflächig"** (ID `vollbild`), **„Zwei Spalten"** (ID `split`),
  **„Band-Standard"**. IDs unverändert, keine Vorlage gelöscht.
- **Migration v1 → v2** in `schreibe-vorlagen.ts` (`VORLAGEN_SCHEMA_VERSION = 2`):
  `art` entfernen, die beiden eingebauten Ganzbilder **über die ID** umbenennen
  (`eingebaut === true` verlangt), sonst nichts anfassen. Danach wird die Datei **einmal**
  als v2 geschrieben.
- **Nach einer `.bak`-Rettung wird NICHT geschrieben** — die defekte Datei bleibt liegen
  (bestehende Regel, gilt auch für die Migration).
- Ein Band entsteht **deckend** aus `band-standard`; die frühere Scrim-Variante für
  `einblendung` ist entfallen.

### C – Vorschau (#452)

- `split.tsx`, `split-stile.ts` und ihre Specs gelöscht; `Vorschaubild` kennt keine
  `'split'`-Variante mehr.
- `einblendung-stile.ts` rechnet `1080 − H` direkt; das Band liegt deckend am unteren Rand.

### D – Einfügewege und Oberfläche (#453-Kern)

- `action-editor`: wählbar = `parent === null && höhe === null` (Zeitleiste/Ganzbild).
- `composer`: Bandliste = `höhe !== null && parent === null`; `artLabel` liefert nur noch „Band".
- `zeichne-segment.ts`: füllt **jede** Fläche deckend (keine durchsichtige Bandvariante);
  die Rahmen-Marke gilt für die `hintergrund`-Zone eines Bandes (`höhe !== null`).
- `vorlagen-editor`: „Neu" bietet **zwei Flächen** — „Ganzbild (1920 × 1080)" und
  „Band (1920 × 162)"; Treiber-Testids `vorlagen-neu-ganzbild` / `vorlagen-neu-band`.
- `unterbrechungs-aufnahme.ts`: Ganzbild-Erkennung über `höhe === null`.

---

## 5. Der Treiber-Fund: Vorschau-Vorlage per Anzeigename

Der Marken-Editor suchte seine feste Vorschau-Vorlage **über den Namen** `'Vollbild'`
(`vorschau-flaeche.tsx`). Mit der Umbenennung auf „Ganzflächig" schaltete das die Vorschau
**still** ab — der Treiber meldete sieben Befunde (fehlendes `farbe-akzent`, leerer
Bestand). Jetzt sucht `findeVorschauVorlage` über die **ID** `vollbild`; zwei Tests halten
fest, dass ein anderer Anzeigename nichts kaputt macht und eine eigene Vorlage mit
derselben ID nicht zählt.

**Lehre für die nächste Sitzung:** Anzeigenamen sind Präsentation, die ID ist die Identität
(TK 9.11.4). Wer über Namen sucht, baut eine zweite Wahrheit, die beim ersten Umbenennen
lautlos bricht.

---

## 6. Abweichungen von den Issue-Texten (gemeldet, nicht still gelöst)

1. **`waehleVorlagenFlaeche(höhe): Ergebnis<Vorlage,string>`** aus #453 ist **nicht gebaut**.
   Eine reine Renderer-Funktion kann keine Vorlage liefern — die eingebauten liegen im Main
   (`eingebauteVorlagen()`), ein Import wäre ein Bruch von TK 9.1. Gebaut ist
   `istAnlegbareFlaeche(höhe)` + `legeVorlageAn(höhe, name)`: **ein** Anlegeweg.
2. **`schema_fehler`** nennt die Fehlerpfad-Tabelle in #451 für unbekannte Versionen;
   der gebaute Code nutzt **`speicher_fehler`** (bestehender Code, Meldung nennt die
   gefundene Version). Gebauter Code gewinnt, Widerspruch steht im Commit.
3. **Flächen-Beschriftungen** im Vorlagen-Editor sind der Vorschlag aus #453 und vom
   Auftraggeber **nicht bestätigt**.

---

## 7. Gegenproben (jede Datei vorher/nachher per shasum, byte-identisch zurückgenommen)

| Mutation | Beleg |
|---|---|
| `y = 1080 − H − 100` in `filter-einblendung.ts` | neuer ffmpeg-Integrationstest **rot** |
| `migriereVon1` gibt unverändert zurück | beide Migrationstests **rot** |
| `fillRect` in `zeichne-segment.ts` entfernt | Deckend-Test **rot** |
| `vorlage.höhe !== kopie.höhe` in `speichere-arbeitskopie.ts` entfernt | Test „geänderte Höhe" **rot** |

**Wichtiger Zwischenbefund:** Die erste Fassung des Deckend-Tests zählte nur
`loeseFarbe`-Aufrufe und blieb bei der `fillRect`-Mutation **grün** — sie war wertlos.
Sie prüft jetzt die tatsächliche Füllung (`fillRect(0, 0, 1920, H)` mit dem gelieferten
Farbwert).

Der neue Integrationstest `tests/integration/einblendung-echt.spec.ts` rendert mit dem
echten ffmpeg: Quelle blau 1920 × 1080, Band-PNG grün 1920 × 162, Bandspur über #168,
Kette über #165, Clip über #167. Gemessen wird eine Spalte: `BAND_Y − 1` blau,
`BAND_Y` und `1080 − 1` grün, `y = 0` **nicht** grün.

---

## 8. Fallen für die nächste Sitzung

1. **`bereitschaft.py` misst nur Dateiexistenz.** Für M9 meldet es jetzt „gebaut", weil die
   Dateien existieren — das stimmt diesmal, ist aber kein Beleg. Die Issues sind **offen**;
   Schließen nur auf Anweisung.
2. **`vorlagen.json` steht auf `schemaVersion` 2.** Eine ältere App-Fassung verweigert das
   Laden (gewollt). Die Datei auf der Platte wurde beim ersten Start migriert; `art` ist weg.
3. **Andere Bandhöhen als 162 sind weiter unentschieden:** `erstelleVorlage` weist sie mit
   `unbekannter_fehler` ab (`festeZonen`), nicht mit `ungueltige_eingabe`. H = 1078 ist seit
   v3.31 **zulässig**, scheitert aber an derselben offenen Festlegung.
4. **`bestimmeBandgeometrie` liefert `void`.** Wer dort wieder eine Geometrie erwartet, baut
   die zweite Rechnung nach, die #450 gerade entfernt hat.
5. **Der Marken-Editor sucht die Vorschau-Vorlage über die ID** `vollbild`. Nicht auf den
   Anzeigenamen zurückbauen.
6. **#453-DoD ist nicht erfüllt:** kein Treiber-Schritt „Aktion auf die Zeitleiste = Segment;
   Aktion an die Bandliste = Abschnitt". Die Filter sind gebaut, der Fensterbeleg fehlt.

---

## 9. Offene Punkte ohne Bau

- **#443** (Videosteuerung) — Review am Fenster ausstehend, Kommentar „so gebaut".
- **#449** (Marken-Editor: Elemente anklicken) — Review ausstehend.
- **#453** — Treiber-Schritt für die Einfügewege; Beschriftung der Flächen bestätigen lassen.
- **#446** FA-03-Ursache (12 Läufe grün, Ursache unbenannt).
- **#448** 192 `SAFETY`-Warnungen.
- **Beenden-Frist 15 s** aus der Sitzung vom 29.10. ist weiterhin unbestätigt.

---

## 10. Nächste Schritte

1. **#443 und #449 am Fenster reviewen**, danach schließen (auf Anweisung).
2. **#453-Treiber-Schritt** bauen: Drop auf die Zeitleiste → Segment, Anhängen an die
   Bandliste → Abschnitt, am echten Fenster gemessen.
3. **Push** — nur auf Anweisung (17 Commits bis `e4a5549`, plus diese Übergabe).
