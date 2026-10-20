# Mutations-Pilot: Sind unsere Tests relevant? (20.10.2026)

**Frage:** Prüfen die Tests der drei ausgewählten Dateien Verhalten – oder nur die Form des
Quelltexts? **Methode:** Mutationstest. Eine Zusage wird absichtlich gebrochen; bleibt die
Testdatei grün, prüft sie diese Zusage nicht.

**Grenze:** Drei Dateien, 29 Verhaltens-Mutationen. Das ist ein **Pilot**, kein Urteil über
alle 333 Testdateien.

---

## 1. Vorgehen

Je Mutation:

1. Sicherung der Quelldatei + Prüfsumme.
2. Genau eine semantische Änderung (z. B. Bedingung entfernt, Rückgabe vertauscht).
3. `npx vitest run <Testdatei>`.
4. Rücknahme aus der Sicherung, Prüfsumme byte-identisch.
5. Zusätzlich **harmlose Refactorings** (lokale Variable umbenannt, Kommentar umformuliert,
   Felder umsortiert): Diese **müssen grün bleiben**. Rot wäre ein falsch positiver Test.

## 2. Ergebnis vor dem Eingriff

| Kategorie | Anzahl | erkannt |
|---|---|---|
| Verhaltens-Mutationen | 27 | **25** |
| harmlose Refactorings | 5 | **0 rot** (korrekt) |

**Zwei echte Testlücken** – genau die Sorte, die der Pilot finden soll:

- **C6** – `aktuelleStelle` gab statt `stand.aktuelle` einfach `stand.offen[0]` zurück.
  Kein Test fiel. Grund: Alle Teststände hatten `zeigerIndex: 0`, dort ist beides gleich.
  Die Zusage „liest `aktuelle`, rechnet nicht nach" war damit **nur zufällig** geprüft.
- **L1** – `aktuelleRenderId` ignorierte die Auftragsart. Kein Test fiel. Grund: Es gab
  keinen Fall mit einem **laufenden Import vor einem laufenden Render**; nur dann liefert
  die Suche ohne `art`-Bedingung den falschen Auftrag (und damit `null` statt `r1`).

## 3. Die 29 Verhaltens-Mutationen (Endstand: alle erkannt)

| ID | Mutation | erkannt von |
|---|---|---|
| C1 | `schliesseOverlay` räumt zusätzlich die Auswahl | 1 Test |
| C2 | `melde` behält die erste Meldung | 1 |
| C3 | `oeffneOverlay` öffnet nichts | 1 |
| C4 | `folgeAus` verschluckt die Übergabe | 2 |
| C5 | `istRenderKnopfFrei` ignoriert den Laufzustand | 1 |
| C6 | `aktuelleStelle` nimmt `offen[0]` statt `aktuelle` | **neu: 1** |
| C7 | `setzeLaeuft` löscht die Meldung | 1 |
| C8 | `waehleMedium` schließt das Overlay | 1 |
| C9 | `oeffneOverlay` mutiert die übergebene Lage | 2 |
| L1 | `aktuelleRenderId` ignoriert die Art | **neu: 1** |
| L2 | `aktuelleRenderId` ignoriert den Status | 2 |
| L3 | `meldeLeistenFehler` behält die erste Meldung | 1 |
| L4 | `schalteKlappzustand` mutiert die Lage | 2 |
| L5 | `schliesseRueckfrage` lässt die Meldung stehen | 1 |
| L6 | `oeffneRueckfrage` lässt die Meldung stehen | 1 |
| L7 | `verwirfLeistenMeldung` schließt die Rückfrage | 1 |
| L8 | `aktuelleRenderId` liefert eine falsche Kennung | 3 |
| U1 | Tonspur wird nicht geprüft | 2 |
| U2 | `vergleicheStroeme` meldet immer `ok` | 14 |
| U3 | fehlende Dauer fällt auf 0 zurück | 4 |
| U4 | Display-Matrix wird nicht gelesen | 1 |
| U5 | Layout-Merkmale werden nicht geprüft | 4 |
| U6 | Video-Merkmale werden nicht geprüft | 17 |
| U7 | Abbruch nach der ersten Abweichung | 7 |
| U8 | Profil wird als Sollwert ignoriert | 5 |
| U9 | Stromzahl wird nicht gemeldet | 12 |
| U10 | Profil als Literal `'High'` | 1 |
| U11 | Breite als Literal `1920` | **neu: 1** |
| U12 | Level als Literal `40` | 2 |

**Refactorings, alle grün:** lokale Variable in `oeffneOverlay` (R1), in
`aktuelleRenderId` (R2), in `vergleicheStroeme` (R3), Kommentar umformuliert (R4), zwei
Felder in `LEERE_COMPOSER_LAGE` umsortiert (R5).

## 4. Was gestrichen wurde – und warum

**Acht Quelltext-Tests** (Grep-/Literal-Proben), die **keine** Verhaltens-Mutation fangen:

- `composer-montage.spec.ts`: 1 Test („kein react/JSX/IPC/Math.round …"). Die
  Architekturverbote gehören in eine Lint-Regel, nicht in einen Test.
- `uniformitaet.spec.ts`: 7 Tests („enthält 1920/1080/48000/30/40 nicht als Literal",
  „High nur in der Tabelle"). Sie pinnten **Codeform**, nicht Verhalten.

**Wichtiger Zwischenbefund:** Mutation **U11** (Breite als Literal `1920`) wurde
**nur** von der Literal-Probe gefangen. Ein pauschales Löschen hätte also eine Lücke
gerissen. Stattdessen wurde ein **Verhaltens-Test** ergänzt: „ein Profil mit breite 720
weist 1920er ab". Erst danach ist die Literal-Probe entbehrlich. U10 und U12 waren schon
vorher durch Profil-Tests gedeckt.

**Nicht gestrichen:** die übrigen Tests der drei Dateien und der Test „ermittelt den
ffprobe-Pfad nicht selbst" (er schützt eine reale Grenze: keinen zweiten Prozessstarter).
Für ihn gilt dieselbe Empfehlung: später durch eine Lint-Regel ersetzen, nicht ersatzlos
löschen.

## 5. Ergebnis nach dem Eingriff

| Kategorie | Anzahl | erkannt |
|---|---|---|
| Verhaltens-Mutationen | **29** | **29** |
| harmlose Refactorings | 5 | **0 rot** |
| Tests gesamt (Suite) | vorher 5.702 | nachher **5.697** |

Typecheck/Lint 0; die drei Testdateien grün (`composer-montage` 22, `uniformitaet` 64,
`leisten-montage` 23 Tests, inkl. `it.each`-Expansionen).

## 6. Was der Pilot **nicht** bestätigt hat

Die Ausgangsvermutung „die Tests sind überwiegend irrelevant" trifft für diese drei
Dateien **nicht** zu: 25 von 27 Verhaltens-Mutationen wurden schon vorher gefangen, und
alle fünf harmlosen Refactorings blieben grün. Die Tests prüfen dort **Verhalten**, nicht
Attrappen.

Der belegte Ballast ist eine **Kategorie**, nicht die Masse:

- Quelltext-/Grep-/Signatur-Proben, die Codeform statt Verhalten pinnen.
- DoD-Sätze wie „kein Literal 30", „keine Signatur geändert", die TypeScript oder ESLint
  billiger und präziser prüfen.

**Die eigentliche Lücke ist eine andere:** Die Suite prüft sehr viel *kleine* Korrektheit
und fast nichts am echten Fenster. Die teuersten Fehler der letzten Wochen (leere
Warteschlange, 2.300 Mounts, #433) waren für diese Art Test unsichtbar – nicht weil die
Tests schlecht sind, sondern weil sie die falsche Ebene prüfen.

## 7. Empfehlung

1. **Keine neuen Quelltext-/Grep-Tests.** Architekturverbote als Lint-Regel.
2. **Mutationsprobe statt Mock-Zählung** als Q4-Maßstab: „Welche Zusage bricht, wenn ich
   diese Zeile ändere?" – nicht „wie viele Mocks hat der Test?".
3. **Löschen nur mit Ersatz:** Wie U11 zeigt, kann eine Quelltext-Probe der einzige
   Wächter sein. Erst Verhaltens-Test ergänzen, dann die Form-Probe entfernen.
4. **Nächste fünf Dateien** mit hohem Quelltext-Anteil nach demselben Rezept prüfen
   (Kandidaten: `rahmen`, `medien-import`, `bibliothek`, `zonen-liste`, `undo-stapel`).
5. **Investition verschieben:** Treiber-Szenarien für FA-17/18, FA-13, FA-23/24 – dort,
   wo die Anforderungen tatsächlich brechen können.

---

## 8. Pilot 2: fünf weitere Dateien (20.10.2026, Fortsetzung)

**Dateien:** `undo-stapel`, `zonen-liste`, `bibliothek` (action-editor), `medien-import`
(composer), `rahmen` (app-shell). Dieselbe Methode, **39 Verhaltens-Mutationen** und
**5 harmlose Refactorings**.

### Ergebnis

| Kategorie | Anzahl | erkannt |
|---|---|---|
| Verhaltens-Mutationen | 39 | **37** |
| harmlose Refactorings | 5 | **0 rot** |
| Quelltext-/Meta-Tests entfernt | **47** | – |
| Verhaltens-Tests ergaenzt | **2** | – |

**Zwei echte Lücken gefunden und geschlossen:**

- **U7** – `erzeugeUndoStapel(1)` fiel still auf Tiefe 50 zurueck (`>= 1` → `> 1`), kein
  Test fiel. Neu: Tiefe 1 ist gueltig, nach zwei `ablegen` bleibt genau einer.
- **R1** – alle Reiter trugen `aria-selected={true}`; kein Test pruefte das Attribut.
  Neu: genau der aktive Reiter ist markiert.

### Die zwei nicht gefangenen Mutationen sind **aequivalent**, keine Luecken

- **Z8** – die Pruefung „feste Zonen behalten ihre relative Reihenfolge" ist nach der
  Sperre auf `rolle === 'fest'` **nicht erreichbar**: Eine feste Zone kann nicht bewegt
  werden, und das Verschieben einer freien Zone aendert die Reihenfolge der festen nicht.
  Der Test, der sie zu decken schien, war tautologisch. Die Schutzschicht bleibt als
  defensive Absicherung stehen; sie braucht keinen Test.
- **B4** – `bildAsset: kaputt ? null : findeBildAsset(...)` ist fuer `kaputt === true`
  immer `null`, weil `kaputt` genau dann true ist, wenn `findeBildAsset` null liefert.
  Die Bedingung ist redundant; beide Fassungen verhalten sich gleich.

### Was entfernt wurde (47 Tests)

- **10** in `undo-stapel` („enthaelt kein JSX/react/rufeAuf/…", „kein Modul-Zustand").
- **10** in `zonen-liste` (4 Quelltext-Proben + 6 **Meta-Proben**, die nur die eigenen
  Regexe gegen erfundene Zeichenketten testeten).
- **10** in `bibliothek` (6 Quelltext + 4 Meta).
- **10** in `medien-import` (6 Quelltext + 4 Meta).
- **7** in `rahmen` (Bauvorschriften fuer `rahmen.tsx` und `App.tsx`).

Die Verhaltens-Tests dieser fuenf Dateien fingen **alle nicht-aequivalenten** Mutationen.
Die geloeschten Proben prueften Codeform, Signaturen (macht TypeScript) oder die
Testwerkzeuge selbst. Sie sind durch die bestehenden Verhaltens-Tests bzw. eine spaetere
Lint-Regel ersetzbar.

### Stand nach beiden Piloten

| | vorher | nachher |
|---|---|---|
| Suite | 5.702 Unit-Tests | **5.652** |
| Quelltext-/Meta-Tests entfernt | – | **55** |
| Verhaltens-Tests ergaenzt | – | **5** |
| Verhaltens-Mutationen | – | **68**: 66 erkannt, 2 aequivalent |

**Verbleibend (gemessen):** 148 Testdateien lesen noch eine Quelldatei; 102 Dateien tragen
einen Grep-/Bauvorschriften-`describe`. Das ist die naechste Charge – dieselbe Methode,
Datei fuer Datei, **nie pauschal**.

**Nicht bestaetigt:** „Die Tests sind ueberwiegend irrelevant." In allen acht geprueften
Dateien waren die Verhaltens-Tests stark. Der belegte Ballast ist die Kategorie
**Quelltext-/Meta-Probe** – 55 Tests in zwei Piloten, Tendenz in den verbleibenden 102
Dateien aehnlich.

---

## 9. Pilot 3: fünf weitere Dateien (20.10.2026, Fortsetzung)

**Dateien:** `frames` (render-service), `zone-hinzufuegen` (vorlagen-editor),
`einblendung-vorschau` (composer), `medien-url` (shared),
`medien-import-uebergabe` (app-shell).

| Kategorie | Anzahl | erkannt |
|---|---|---|
| Verhaltens-Mutationen | 33 | **30** |
| harmlose Refactorings | 5 | **0 rot** |
| Quelltext-/Meta-Tests entfernt | **29** | – |
| Verhaltens-Tests ergaenzt | **1** | – |

**Eine echte Luecke gefunden und geschlossen:** **H6** – die Mindestkante einer Zone
(`MINDEST_ZONEN_KANTE_PX = 8`) wurde mit `<=` statt `<` geprueft; genau 8 px waere
abgelehnt worden. Kein Test deckte die Grenze **einschliesslich** ab. Neu: eine Vorlage
mit genau 8 px Hoehe nimmt noch eine Zone auf.

**Drei nicht gefangene Mutationen sind aequivalent:**

- **E6** – `abschnitt.dauer > 0` gegen `>= 0`: Bei Dauer 0 ergibt `Math.round(0 * fps)`
  in beiden Faellen 0 Frames; negative Dauern werden in beiden Faellen verworfen.
- **I4** – `punkt <= 0` gegen `< 0`: Bei `.gitignore` lautet die „Endung" `gitignore`;
  sie steht in keiner Whitelist, das Ergebnis ist so oder so `null`.
- **I8** – Windows-Trenner im `split`: Die letzte Endung eines Pfades liegt immer hinter
  dem letzten Punkt der GESAMTEN Zeichenkette; das Verzeichnis-Trennzeichen aendert das
  Ergebnis fuer alle Pfade mit bekannter Endung nicht.

**Entfernt (29):** 1 in `frames` (Literal-30-Probe), 9 in `zone-hinzufuegen`, 8 in
`einblendung-vorschau`, 3 in `medien-url`, 8 in `medien-import-uebergabe` – jeweils
Quelltext-Verbote und Gegenproben, die nur die eigenen Regexe pruefen.

## 10. Stand nach drei Piloten

| | |
|---|---|
| Mutationen gesamt | **101**: 96 erkannt, 5 aequivalent |
| Refactorings | **0 / 15 rot** |
| Quelltext-/Meta-Tests entfernt | **84** |
| Verhaltens-Tests ergaenzt | **6** |
| Echte Luecken geschlossen | **6** |
| Suite | 5.702 → **5.624** |
| Verbleibend | **143** Dateien mit `readFileSync`, **97** mit Grep-/Bauvorschriften-`describe` |

Das Bild ist ueber drei Runden stabil: Die Verhaltens-Tests tragen, die
Quelltext-/Meta-Proben sind der Ballast. In 13 geprueften Dateien wurden **84** solche
Tests entfernt, ohne eine einzige nicht-aequivalente Mutation zu verlieren.
