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

---

## 11. Pilot 4: fünf weitere Dateien (20.10.2026, Fortsetzung)

**Dateien:** `gesamtlaenge` (composer), `farben` (template-canvas), `undo-historien`
(app-shell), `zeitachse` (preview-player), `arbeitskopie` (vorlagen-editor).

| Kategorie | Anzahl | erkannt |
|---|---|---|
| Verhaltens-Mutationen | 29 | **28** |
| harmlose Refactorings | 5 | **0 rot** |
| Quelltext-/Meta-Tests entfernt | **25** | – |
| Verhaltens-Tests ergaenzt | **1** | – |

**Eine echte Luecke gefunden und geschlossen:** **C4** – `loeseSchrift` verspricht den
Datensatz der Marke **selbst** (Referenz, keine Kopie, TK 9.10.3). Der Test prueft nur
`toEqual`; `{ ...marke.schriften[rolle] }` blieb unsichtbar. Neu: `toBe` auf das
Original-Objekt.

**Eine nicht gefangene Mutation ist aequivalent:** **C3** – ohne die ausdrueckliche
`belegt`-Pruefung wirft `alsCanvasFarbe` weiterhin, und seine Meldung nennt die Rolle
(„Farb-Rolle \"linie\""). Die Zusage „kein Ersatzwert" bleibt; nur der spezielle
Meldungstext „ist in der Marke nicht belegt" geht verloren. Kein Verhaltensunterschied
im geprueften Sinn.

**Entfernt (25):** Grep-/Bauvorschriften-Bloecke in `gesamtlaenge`, `farben`,
`undo-historien`, `zeitachse`, `arbeitskopie`. Die Verhaltens-Tests dieser Dateien
fingen alle nicht-aequivalenten Mutationen.

## 12. Endstand nach vier Piloten

| | |
|---|---|
| Runden / Dateien | **4 / 18** |
| Mutationen | **130**: 124 erkannt, 6 aequivalent |
| Refactorings | **0 / 20 rot** |
| Quelltext-/Meta-Tests entfernt | **109** |
| Verhaltens-Tests ergaenzt | **7** |
| Echte Luecken geschlossen | **7** |
| Suite | 5.702 → **5.600** |
| Verbleibend | **138** Dateien mit `readFileSync`, **92** mit Grep-/Bauvorschriften-`describe` |

Das Ergebnis ist ueber vier Runden stabil: **Die Verhaltens-Tests tragen, die
Quelltext-/Meta-Proben sind der Ballast.** In 18 Dateien wurden 109 solche Tests entfernt,
ohne eine einzige nicht-aequivalente Mutation zu verlieren. Die verbleibenden 92 Dateien
enthalten schaetzungsweise noch 200–300 Tests dieser Kategorie.

---

## 13. Charge 1 (28.10.2026): fuenf weitere Dateien

**Dateien:** `fehlertexte` (queue-panel), `liste-ansicht-anzeige` (composer),
`uebergabe-anzeige` (app-shell), `speichern` (vorlagen-editor),
`element-hinzufuegen` (composer).

**Ausgangsmessung:** 26 Verhaltens-Mutationen, 5 harmlose Refactorings.
Erkannt: **22**. Gruen: **L2, L3, S2, E3** – vier echte Luecken. Alle fuenf
Refactorings blieben gruen (0 falsch positive). Jede Mutation wurde vor dem Lauf
byte-identisch gesichert und nach dem Lauf byte-identisch zurueckgenommen
(Pruefsumme je Datei, Harness ausserhalb des Repos).

### Die vier Luecken (geschlossen mit Verhaltens-Tests)

- **L2 – der Abbruch-Merker war ungeprueft.** Der Test „ein verzoegertes Bild,
  dessen Quelle wechselte, wird VERWORFEN" endete mit `expect(...).toBeDefined()`
  und `void textVon` – er konnte nicht fehlschlagen. Ohne den `if (abgebrochen)`-Zweig
  blieb die Suite gruen. Neu: das zweite Bild wird aufgeloest und erscheint; danach
  trifft das veraltete erste ein und darf es nicht ersetzen (`src` bleibt `zweites`).
- **L3 – `data-kaputt` war nie geprueft.** Die Anzeige markiert eine Zeile auch dann,
  wenn nur ein Band-Abschnitt kaputt ist (`modell.kaputt || kaputteBandAbschnitte`).
  Die Mutation auf `modell.kaputt` allein blieb gruen. Neu: eine Zeile mit reinem
  `band_abschnitt`-Defekt traegt `data-kaputt="ja"`.
- **S2 – die Sperren-Zahl in der Meldung zaehlte Warnungen mit.** `befunde.length`
  statt der gefilterten Sperren blieb gruen. Neu: eine Sperre plus eine Warnung
  ergibt „1 Sperre(n) blockieren das Speichern." (Warnungen blockieren nie, TK 9.12.2).
- **E3 – die Klammer der Position war ungeprueft.** `Math.max(0, Math.min(position,
  liste.length))` auf `position` reduziert blieb gruen. Fuer `position > laenge` ist
  die Klammer tatsaechlich aequivalent (`slice` klemmt selbst); fuer **negative**
  Werte nicht – `slice(0, -1)` setzt vor das letzte Element. Neu: `-1` fuegt an
  Index 0 ein.

### Gegenproben nach den Korrekturen

Fuenf Mutationen, alle erkannt: L2, L3, S2, E3 erneut – und **F6**
(`TABELLE.get(fehler.code.toLowerCase())`), der Beleg, dass der neue
Exakt-Vergleichs-Test die fruehere `toLowerCase`-Grep-Probe ersetzt.

### Entfernt (23 Tests, 4 ergaenzt – netto −19)

- **9** in `fehlertexte` („Grenzen der Datei": includes/startsWith/match/toLowerCase,
  `meldung`-Zaehlung, rufeAuf/abonniere/window.api/queue:). Ersatz: ein Verhaltens-Test
  „vergleicht den Code EXAKT" (Grossschreibung, Praefix, Suffix, Leerzeichen).
  **Bewusst geblieben:** „Vollstaendigkeit gegen den GEBAUTEN Main-Code" – sie liest die
  drei Fehlercode-Unionen aus `src/main/**` und haelt Tabelle und Union zusammen. Das ist
  ein Vertrag ueber zwei Module, keine Codeform; zur Laufzeit gibt es keine Union.
- **1** in `liste-ansicht-anzeige` (16 Verbote in einem Grep-Test: IPC, zweiter
  Schreibweg, Reparatur-Ausfuehrung, Canvas-Export). Ersatz: die zwei neuen
  Verhaltens-Tests L2/L3; die uebrigen Verbote sind Architekturregeln (Lint-Kandidat).
- **2** in `uebergabe-anzeige` (Grep-Block + ein Test, der ihn nur wiederholte).
  Die neun Verhaltens-Tests decken alle Zweige (keins, null-Projekt, drei Auswahlarten,
  Index-Durchreichung, Rueckrufe).
- **6** in `speichern` (DoD-Grep-Proben: mitgeliefert-Literal, Nutzungsanzeige,
  `vorlagen:geaendert`, Import aus `vorlagen-uebersicht`, Kanal-Literal, window.api/fs).
  Die 29 Verhaltens-Tests pruefen jeden Kanalaufruf, jede Reihenfolge und jeden
  Fehlerpfad.
- **5** in `element-hinzufuegen` (Kommentar-Filter, `standardDauer`, Dauer-Zahlen,
  Kanal-Literal, Registry-Import). Ersatz: der bestehende Test „haengt EXAKT das
  zurueckgegebene Objekt an" plus der neue Negativ-Positions-Test.

**Ehrlich offen:** Die entfernten Architektur-Verbote (kein IPC im Renderer-Modul,
kein zweiter Schreibweg, kein eigener Zustand, kein Kanal-Literal) haben bis auf
Weiteres **keinen Waechter** – genau die Luecke, fuer die die Piloten eine Lint-Regel
empfohlen haben. Sie sind hier bewusst nicht durch Schein-Tests ersetzt.

### Stand nach Charge 1

| | vorher | nachher |
|---|---|---|
| Mutationen in dieser Charge | – | **31**: 22 im ersten Lauf, 4 nach Korrektur, 5 Gegenproben – **31 erkannt** |
| Refactorings | – | **0 / 5 rot** |
| Quelltext-/Meta-Tests entfernt | – | **23** |
| Verhaltens-Tests ergaenzt | – | **4** (+1 umgeschrieben) |
| Echte Luecken geschlossen | – | **4** |
| Suite | 5.692 | **5.673** (340 Dateien) |
| Gate | – | `npm run pruefung` **Exit 0**, Integration 49, Treiber 0 Befunde |
| Verbleibend | 138 / 92 (20.10.) | **136** Dateien mit `readFileSync`, **95** mit Grep-/Bauvorschriften-`describe` |

Die 136 sind keine Zielliste: `fehlertexte` bleibt trotz `readFileSync` stehen, weil
ihre Probe einen Modul-Vertrag prueft. Die naechste Charge beginnt wieder mit einer
Inventur der 95 Describe-Bloecke, nicht mit einer Zahl.

---

## 14. Charge 2 (28.10.2026): fuenf weitere Dateien

**Dateien:** `liste-reorder` (composer), `reiter` (app-shell),
`kontrast-warnung` (marken-editor), `akzentfarbe` (action-editor),
`zone-text` (template-canvas).

**Ausgangsmessung:** 26 Verhaltens-Mutationen, 5 harmlose Refactorings.
Im ersten Lauf: **24 erkannt**, **A2 gruen** (echte Luecke), **R2** traf die
Zeichenkette des Harness nicht (kein Code-Befund, im zweiten Lauf nachgeholt und
erkannt). Endstand: **26/26 erkannt**, **0/5 Refactorings rot**. Jede Mutation
gesichert und byte-identisch zurueckgenommen.

### Die eine Luecke (geschlossen mit Verhaltens-Test)

- **A2 – der Anker fehlte ungeprueft.** `istAkzentfarbe` prueft mit
  `/^#[0-9a-fA-F]{6}$/`; ohne das `^` akzeptiert die Funktion auch `x#FF4040`.
  Kein Test fiel. Neu: `x#FF4040` steht in der Ablehnungstabelle – die Pruefung ist
  GANZSTRINGIG, nicht „irgendwo ein Hex".

### Gegenproben nach den Korrekturen

- **A2** erneut: erkannt.
- **R2** (`nach + (von < nach ? -1 : 0)` – die im Kommentar ausdruecklich verbotene
  „Korrektur um eins"): erkannt, 7 Tests rot.
- **Z6** (`ctx.fillStyle = "#202020"` statt `loeseFarbe(...)`): erkannt – der
  FillStyle-Test nutzt jetzt `#123456` aus der Marke; ein Literal faellt auf.
- **R7** (`return kopie.sort()`): erkannt – belegt, dass der entfernte
  „sortiert nirgends"-Grep durch den Verhaltenstest „sortiert nichts" gedeckt ist.

### Entfernt (29 Tests, 1 Fall ergaenzt – netto −28)

- **7** in `liste-reorder` (Kommentar-Filter, Kanal-Literal/JSX/react/fs, ein Kanal,
  kein Index, keine eigene Rollback-Regel, kein `sort`/`reverse`, kein fremdes
  `splice`). Ersatz: die Nutzlast-Schluesselmenge, die Rollback-Sequenz und
  „sortiert nichts" sind Verhaltenstests; R6/R7 belegen es.
- **5** in `reiter` (kein JSX, kein react, kein `rufeAuf`, kein `window.`, kein
  `localStorage`). Der Modul-Zustand ist mit 32 Verhaltenstests abgedeckt; die
  Verbote sind Architektur (Lint-Kandidat).
- **6** in `kontrast-warnung` (keine eigene Helligkeitsrechnung, kein
  Schwellenwert-Literal, kein Import aus `konstanten`, keine eigene
  Schwellen-Konstante, kein try/catch, kein IPC/fs). Ersatz: die zwei Spy-Tests
  (genau zwei Aufrufe), der Test „verschiedene `schwellenwert`-Werte" und die echte
  Rechnung aus #292.
- **4** in `akzentfarbe` (gestrichene Bezeichner, kein Hex-Literal/`loeseFarbe`,
  keine Kontrast-Rechnung, kein Kanal-Literal/`window.api`). Ersatz: A2-Test und
  „eine veraenderte Marke aendert das Ergebnis mit".
- **7** in `zone-text` (kein 1.2-Literal, kein font-Literal, kein Farb-Literal,
  kein Selbstlesen von `schriften`/`akzentfarbe`/`sicherheit`, kein
  await/random/document/window, kein `.zeilenhoehe`). Ersatz: der FillStyle-Test
  mit markenfremdem Wert; Zeilenhoehe, Schriftweg und `x=96` sind bereits
  Verhaltenstests.

**Ehrlich offen:** Wie in Charge 1 haben die entfernten Architektur-Verbote
(kein IPC, kein eigener Zustand, kein zweiter Import, kein try/catch) **keinen
Waechter**, bis eine Lint-Regel steht. Der einzige Fall mit echter Zweitquellen-
Gefahr – das Schwellenwert-Literal – ist durch „verschiedene Werte" verhaltens-
seitig abgedeckt: Ein eingebauter Wert kann den Test nicht bestehen.

### Stand nach Charge 2

| | vorher | nachher |
|---|---|---|
| Mutationen in dieser Charge | – | **28**: 26 + 2 Gegenproben – **28 erkannt** |
| Refactorings | – | **0 / 5 rot** |
| Quelltext-/Meta-Tests entfernt | – | **29** |
| Verhaltens-Tests ergaenzt/geschaerft | – | **1 Fall + 1 Test** |
| Echte Luecken geschlossen | – | **1** |
| Suite | 5.673 | **5.645** (340 Dateien) |
| Gate | – | `npm run pruefung` **Exit 0**, Integration 49, Treiber 0 Befunde |
| Verbleibend | 136 / 95 | **131** Dateien mit `readFileSync`, **91** mit Grep-/Bauvorschriften-`describe` |

Die verfeinerte Zaehlung (nur Describe-Bloecke, die wirklich eine Quelldatei lesen)
steht nach dieser Charge bei **116**. Die naechste Charge beginnt wieder mit einer
Inventur – `filter-split` (41 Tests in einem Block, der Quelldatei liest) und
`reparatur-fuehrung` (23) sind die naechsten Kandidaten, aber der Name allein ist
kein Befund.

---

## 15. Charge 3 (28.10.2026): fuenf weitere Dateien

**Dateien:** `filter-split` (ffmpeg-adapter), `reparatur-fuehrung` (composer),
`inspektor` (vorlagen-editor), `bild-laden` (template-canvas),
`zone-deko` (template-canvas).

**Ausgangsmessung:** 25 Verhaltens-Mutationen, 5 harmlose Refactorings.
Erkannt: **23**. Gruen: **F2** (echte Luecke) und **I3** (aequivalent, s. u.).
Alle fuenf Refactorings gruen. Jede Mutation byte-identisch zurueckgenommen.

### Die Luecke (geschlossen – in zwei Schritten)

- **F2 – „durch 4 teilbar" war nur als „gerade" geprueft.** Die Mutation
  `% VIERER_RASTER !== 0` → `% 2 !== 0` blieb gruen: Der bestehende Test nutzt
  **1557** (ungerade), `% 2` faengt ihn ebenfalls. Eine **gerade** Breite, die kein
  Vielfaches von 4 ist (1558), kam durch. Der erste neue Test prueft nur die Zahl
  **1558** in der Meldung – und blieb gruen, weil die spaetere „nicht mittig"-Meldung
  dieselbe Zahl enthaelt. Erst mit `expect(meldung).toContain("Vielfaches von 4")`
  beisst die Probe. **Lehre:** Eine Meldung mit der richtigen Zahl ist kein Beleg
  fuer den richtigen Grund.

### Die eine aequivalente Mutation

- **I3 – die Zwischenklammer fuer `x` ist redundant.** `begrenze(wert, 0,
  flaeche.breite - rahmen.breite)` auf `begrenze(wert, 0, flaeche.breite)` geaendert
  blieb gruen: `begrenzeAufFlaeche` klemmt den fertigen Rahmen anschliessend in die
  Flaeche. Die Klammer bleibt als defensive Absicherung stehen; sie braucht keinen
  eigenen Test (dieselbe Klasse wie Z8 im zweiten Piloten).

### Gegenprobe

- **F2** nach dem geschaerften Test: erkannt (1 Test rot). **I3** erneut: gruen,
  damit als aequivalent belegt.

### Entfernt (25 Tests, 1 ergaenzt – netto −24)

- **5** in `filter-split`: keine Breitenrechnung, kein Mass-Literal, keine Hexfarbe,
  keine wirkungsvollen Importe, keine Fachbegriffe. Ersatz: das abgewandelte Profil
  schlaegt an allen Stellen durch; die Fuellfarbe-Tests nutzen `0xFF4040` (nicht den
  Vorgabewert) und belegen beide Stellen; die Kette ist reine Zeichenkette.
  **Korrektur zur Inventur:** Die „41 Tests" dieses Blocks waren ein Artefakt der
  Blockzaehlung – der Describe „die nachgemessene Kette" hat vier Tests; die Proben
  sassen verteilt in vier anderen Describes.
- **5** in `reparatur-fuehrung` (Modulgrenze: keine Modulvariable, keine
  React/fs/electron-Importe, kein IPC, exakte Importliste, kein async/Timer).
  Ersatz: 40 Verhaltenstests; `starteReparatur` liefert nachweislich neue, gleiche
  Staende, und `istRenderFreigegeben` fragt das Projekt.
- **5** in `inspektor` (keine Abschaltzeile/Geruest-Kopf, kein Einrasten, Geometrie
  aus #144, kein `daten:`). Ersatz: die 16 Verhaltenstests zu Sperre, Parsen und
  Klemmen; die „rastet nicht ein"-Zusage ist der Test mit 1056/1050.
- **5** in `bild-laden` (nur `media://`, kein `onload`, genau ein Speicher, Feld
  heisst `zustand`, kein Timeout). Ersatz: `decode()`-Warten, `clear()` und
  Generationszaehler sind Verhaltenstests; ein zweiter Cache waere an den
  `fehlt`-Faellen sichtbar.
- **5** in `zone-deko` (kein Akzent-Selbstlesen, keine Farb-/Radius-Literale, kein
  `radien`/Zeit-API, kein `fillText`). Ersatz: Gradient-Koordinaten, Deckelung 36,
  Bindung und Schatten sind Verhaltenstests; der FillStyle kommt ueber `loeseFarbe`.

**Ehrlich offen:** Wie in den Charges 1/2 haben die entfernten Architektur-Verbote
keinen Waechter bis zu einer Lint-Regel. Neu ist die Erkenntnis aus F2: Wo eine
Meldung nur eine Zahl traegt, muss der **Grund** geprueft werden, sonst ist die
Probe zufaellig gruen.

### Stand nach Charge 3

| | vorher | nachher |
|---|---|---|
| Mutationen in dieser Charge | – | **26**: 25 + 1 Gegenprobe – 25 erkannt, 1 aequivalent |
| Refactorings | – | **0 / 5 rot** |
| Quelltext-/Meta-Tests entfernt | – | **25** |
| Verhaltens-Tests ergaenzt | – | **1** |
| Echte Luecken geschlossen | – | **1** |
| Suite | 5.645 | **5.621** (340 Dateien) |
| Gate | – | `npm run pruefung` **Exit 0**, Integration 49, Treiber 0 Befunde |
| Verbleibend | 131 / 91 | **126** Dateien mit `readFileSync`, **88** mit Grep-/Bauvorschriften-`describe` |

Verfeinert lesen nach dieser Charge **110** Describe-Bloecke wirklich eine Quelldatei.
Die naechste Charge beginnt wieder mit einer Inventur; Kandidaten mit vielen Proben
sind jetzt `akzentfarbe`-Nachbarn im Marken-Editor, `zonen-canvas` und
`video-anzeige` – der Name allein bleibt kein Befund.

---

## 16. Charge 4 (28.10.2026): fuenf weitere Dateien

**Dateien:** `zonen-canvas` (vorlagen-editor), `zone-bild` (template-canvas),
`video-anzeige` (preview-player), `kontrast` (gemeinsam), `export-dialog` (composer).
Dazu zwei Gegenproben gegen `video-zeit.spec.ts` (die Proben dazu sassen in
`video-anzeige`).

**Ausgangsmessung:** 25 Verhaltens-Mutationen, 5 harmlose Refactorings.
Erkannt: **18**. Gruen: **6 echte Luecken** (ZC6, ZC7, V1, E1, VZ1, VZ2) und
**K4** (aequivalent). Alle Refactorings gruen. Jede Mutation byte-identisch
zurueckgenommen.

### Die sechs Luecken (alle geschlossen)

- **ZC6 – die Mindestkante war selbstbezueglich geprueft.** Der Test verglich die
  Breite mit `MINDEST_ZONEN_KANTE_PX`; die Konstante auf 0 gesetzt blieb er gruen.
  Neu: `expect(MINDEST_ZONEN_KANTE_PX).toBe(8)` – die ZAHL steht fest.
- **ZC7 – der Gleichstand beim Einrasten war ungeprueft.** `<=` auf `<` geaendert
  blieb gruen. Neu: Linien 45/155, roher Wert 50, beide Kanten 5 px entfernt – die
  fuehrende Kante gewinnt.
- **V1 – die Endgrenze war nicht gemessen.** Der Test nutzte `trimEnde: 0` und
  `soll = 0`; `>=` auf `>` geaendert blieb er gruen, weil jsdom ohnehin `paused`
  meldet. Neu: `soll = trimEnde = 1` mit `pause`-Spion – mit `>` wuerde
  `currentTime` auf 1 gesetzt und das letzte Bild ginge verloren.
- **E1 – der Gross-/Kleinschreibungs-Test testete den falschen Fall.** Er suchte
  `Sommer.mp4` in einem Bestand, der `sommeraktion.mp4` enthaelt – also gar keine
  Fallvariante. Ein `toLowerCase()` auf beiden Seiten blieb gruen. Neu: Bestand
  `sommer.mp4`, Suche `Sommer.mp4` ⇒ `null`.
- **VZ1 – die Toleranzgrenze war nicht getroffen.** Der Test prueft 0,2 und 0,3,
  nie 0,25. `>` auf `>=` blieb gruen. Neu: 5 ↔ 5,25 in beide Richtungen ⇒ kein
  Sprung.
- **VZ2 – NaN nur auf der Ist-Seite geprueft.** `Number.isFinite(sollZeit)` aus der
  Bedingung entfernt blieb gruen: `NaN` als Soll liess die Differenz zu `NaN`
  werden, der Vergleich still falsch, das Video stehen. Neu: NaN/Infinity auch als
  Soll ⇒ Sprung.

**Muster dieser Runde:** Fuenf der sechs Luecken waren **selbstbezuegliche oder
randlose Tests** – sie verglichen gegen dieselbe Konstante, nutzten einen nicht
vorhandenen Namen oder lagen neben der Grenze. Die Mutation hat sie sichtbar
gemacht, nicht der Testname.

### Die eine aequivalente Mutation

- **K4 – die Klammer auf [1, 21] ist fuer gueltige Hex-Werte redundant.** Die
  WCAG-Formel liefert fuer `#RRGGBB`/`#RRGGBBAA` von selbst Werte in diesem
  Bereich. Die Klammer bleibt als defensive Absicherung; sie braucht keinen Test.

### Gegenproben

ZC6, ZC7, V1, E1, VZ1, VZ2 nach den Korrekturen: **alle erkannt**.
K4 erneut: **gruen** – damit als aequivalent belegt.

### Entfernt (22 Tests, 1 ergaenzt, 4 geschaerft – netto −21)

- **6** in `zonen-canvas` (Abschaltzeile/Geruest-Kopf, `raste` nicht exportiert,
  zwei Literal-Proben in den Verhaltens-Describes, 1920/1080/96/54).
- **4** in `zone-bild` (kein Akzent-Selbstlesen, kein zweiter Dekodierweg,
  Bildmaße nicht am Objekt, kein `clip`/keine Literale).
- **3** in `video-anzeige` (kein Rueckkanal/Ton/controls, keine eigene
  Bildraten-Division, kein JSX/react in `video-zeit`). Die zwei `video-zeit`-Proben
  sind durch `video-zeit.spec.ts` gedeckt (Gegenproben VZ1/VZ2).
- **5** in `kontrast` (Kommentar-Probe zum Alphakanal, keine Vertragsimporte, kein
  Canvas, kein Schwellenwert-Literal, keine eigene Schwellen-Konstante).
- **4** in `export-dialog` (zwei Grep-Describes: kein JSX/react/queue/window/fs,
  genau ein `rufeAuf`, keine Zielpfad-Pruefung, kein `rufeAuf` in der Anzeige).

**Ehrlich offen:** Die entfernten Architektur- und Kommentar-Proben haben keinen
Waechter bis zu einer Lint-Regel. Die Einzelquellen-Regeln (RENDER_PROFILE,
SICHERHEITSABSTAND, Kanal-Registry) sind jetzt nur noch durch Verhalten bzw. den
gebauten Code gedeckt; ein Literal mit demselben Wert bliebe unsichtbar.

### Stand nach Charge 4

| | vorher | nachher |
|---|---|---|
| Mutationen in dieser Charge | – | **25**: 24 erkannt, 1 aequivalent (+ 2 Gegenproben video-zeit) |
| Refactorings | – | **0 / 5 rot** |
| Quelltext-/Meta-Tests entfernt | – | **22** |
| Verhaltens-Tests ergaenzt/geschaerft | – | **1 + 4** |
| Echte Luecken geschlossen | – | **6** |
| Suite | 5.621 | **5.600** (340 Dateien) |
| Gate | – | `npm run pruefung` **Exit 0**, Integration 49, Treiber 0 Befunde |
| Verbleibend | 126 / 88 | **121** Dateien mit `readFileSync`, **84** mit Grep-/Bauvorschriften-`describe` |

Verfeinert lesen nach dieser Charge **106** Describe-Bloecke wirklich eine Quelldatei.

---

## 17. Charge 5 (28.10.2026): fuenf weitere Dateien

**Dateien:** `liste` (projekt-verwaltung), `ausgabe-liste` (composer),
`leiste-zeile` (queue-panel), `buehne-skalierung` (preview-player),
`nutzung-anzeigen` (vorlagen-editor).

**Ausgangsmessung:** 25 Verhaltens-Mutationen, 5 harmlose Refactorings.
Erkannt: **21**. Gruen: **Z3, Z4, B4, N3** – vier echte Luecken. Alle fuenf
Refactorings gruen. Jede Mutation byte-identisch zurueckgenommen.

### Die vier Luecken (alle geschlossen)

- **Z3 – „der ERSTE laufende Auftrag gewinnt" war ungeprueft.** Ohne
  `&& laufender === null` gewann der letzte; kein Test hatte zwei `laeuft`-Auftraege.
  Neu: zwei laufende Auftraege mit den Labels „Erster"/„Zweiter" – die Zeile zeigt
  „Erster".
- **Z4 – die Fortschritts-Klammer war ungeprueft.** Ohne
  `Math.max(0, Math.min(100, …))` blieb die Suite gruen. Neu: 150 ⇒ „100 %",
  -10 ⇒ „0 %".
- **B4 – `<= 0` war nur mit 0×0 abgedeckt.** Bei 0×0 liefert auch der Normalpfad
  lauter Nullen (0/1920 = 0, Versatz 0) – die Mutation war dort unsichtbar. Bei
  **0×100** waere `versatzY` 50 statt 0. Neu: 0×100 und 100×0 in der Nullfall-Liste.
- **N3 – Projekte NUR in `listenelemente` wurden nicht gezaehlt.** Der bestehende
  Test hatte `p-2` in BEIDEN Listen; der zweite Durchlauf war damit unsichtbar. Neu:
  ein Projekt ausschliesslich in `listenelemente` ⇒ 1.

**Muster:** Drei der vier Luecken waren **zufaellig deckende Fixtures** – 0×0, ein
Projekt in beiden Listen, ein einzelner laufender Auftrag. Die Mutation zeigt, was
der Test NICHT unterscheidet.

### Gegenproben

Z3, Z4, B4, N3 nach den Korrekturen: **alle erkannt** (je 1 Test rot).

### Entfernt (14 Tests, 3 ergaenzt – netto −11)

- **3** in `liste` (kein JSX/react/abonniere/queue\:/window; `ProjektMeta` nicht
  deklariert, genau einmal re-exportiert; keine zweite Typquelle).
- **2** in `ausgabe-liste` (kein JSX/react/abonniere/queue\:/reiheEin/window/fs/path/
  `.part`; `AusgabeDatei` genau einmal re-exportiert).
- **3** in `leiste-zeile` (kein `queue:`-Literal, kein `rufeAuf`/`abonniere`/
  `window.api`, kein `useState`/`useEffect` in der .tsx).
- **3** in `buehne-skalierung` (kein JSX/react, kein Runden, keine Literale
  1920/1080).
- **3** in `nutzung-anzeigen` (kein JSX/react/Timer/`vorlagen:`-Literal, keine
  Store-Aufrufe, kein `window`/`Project`/`src/main`).

**Ehrlich offen:** Die entfernten Verbote sind Architekturregeln (Lint-Kandidat).
Die Re-Export-Regel (`ProjektMeta`/`AusgabeDatei`) ist jetzt nur noch durch die
importierenden Stellen gedeckt – ein zweiter Typ in der Datei bliebe unbemerkt.

### Stand nach Charge 5

| | vorher | nachher |
|---|---|---|
| Mutationen in dieser Charge | – | **25**: 21 im ersten Lauf, 4 nach Korrektur – **25 erkannt** |
| Refactorings | – | **0 / 5 rot** |
| Quelltext-/Meta-Tests entfernt | – | **14** |
| Verhaltens-Tests ergaenzt | – | **3** |
| Echte Luecken geschlossen | – | **4** |
| Suite | 5.600 | **5.589** (340 Dateien) |
| Gate | – | `npm run pruefung` **Exit 0**, Integration 49, Treiber 0 Befunde |
| Verbleibend | 121 / 84 | **116** Dateien mit `readFileSync`, **79** mit Grep-/Bauvorschriften-`describe` |

Verfeinert lesen nach dieser Charge **101** Describe-Bloecke wirklich eine Quelldatei.

---

## 18. Charge 6 (28.10.2026): fuenf weitere Dateien

**Dateien:** `vorlage-waehlen` (action-editor), `band-takt` (preview-player),
`undo-vorlage` (app-shell), `aktions-auswahl-anzeige` (app-shell),
`vorlagen-nachtrag` (vorlagen-store, Main).

**Ausgangsmessung:** 25 Verhaltens-Mutationen, 5 harmlose Refactorings.
Erkannt: **24**, **eine aequivalente** (B5, s. u.), **keine Luecke**. Alle fuenf
Refactorings gruen. Jede Mutation byte-identisch zurueckgenommen.

### Die eine aequivalente Mutation

- **B5 – die Endlichkeitspruefung fuer `lokalerFrame` ist redundant.** Ohne
  `Number.isFinite(lokalerFrame)` bleibt das Verhalten gleich: `NaN % rundeFrames`
  ist `NaN`, jeder Bereichsvergleich damit falsch (→ `null`); `Infinity` faengt
  bereits `lokalerFrame >= elementFrames`; Negative faengt `lokalerFrame < 0`.
  Die Pruefung bleibt als defensive Absicherung stehen (Klasse Z8/I3/K4).

**Befund:** Diese Runde fand **keine** neue Testluecke. Die 24 nicht-aequivalenten
Mutationen wurden alle von bestehenden Verhaltens-Tests gefangen – der erste
Durchgang ohne Nachbesserung seit Beginn der Chargen.

### Entfernt (17 Tests, 0 ergaenzt – netto −17)

- **4** in `vorlage-waehlen` (kein `sort`, kein `'vorlagen:'`-Literal, kein
  `window.api`/fs, kein `src/main`/Fachunion).
- **4** in `band-takt` (keine eigene Rundung/`RENDER_PROFILE`/Literal 30, keine
  Vorlagen/Trim/Geometrie/Zustand, kein JSX/IPC, kein `let` auf Modulebene).
- **3** in `undo-vorlage` (Grep-Probe auf `projektHistorie`, kein
  JSX/react/IPC/Kanal-Literal/window/setTimeout, nur ein Typ-Import). **Der
  Spion-Test „Projekt-Historie bleibt unberuehrt (#234)" ist geblieben** – er ist
  Verhalten, keine Quelltext-Probe.
- **3** in `aktions-auswahl` (kein Kanal, kein selbstgebautes
  Einblendung-Objekt, kein `src/main`); dazu eine eingebettete
  `QUELLE_TSX`-Behauptung aus einem Verhaltens-Test entfernt (die
  Verhaltenszeile „genau zwei Radios" bleibt).
- **3** in `vorlagen-nachtrag` (kein Kanal-Literal, kein fs/Fenster/Lock/
  Nachbar-Verdrahtung, kein eigenes try/catch). Der Registry-Test
  („Kanal-Registry nach #255") ist **geblieben** – er importiert `KANAELE` und
  prueft Werte, keinen Quelltext.

**Ehrlich offen:** Die entfernten Verbote sind Architekturregeln (Lint-Kandidat).
Der Typ-Import in `undo-vorlage` ist jetzt nur noch durch die Import-Zeile selbst
gedeckt.

### Stand nach Charge 6

| | vorher | nachher |
|---|---|---|
| Mutationen in dieser Charge | – | **25**: 24 erkannt, 1 aequivalent |
| Refactorings | – | **0 / 5 rot** |
| Quelltext-/Meta-Tests entfernt | – | **17** |
| Verhaltens-Tests ergaenzt | – | **0** |
| Echte Luecken geschlossen | – | **0** |
| Suite | 5.589 | **5.572** (340 Dateien) |
| Gate | – | `npm run pruefung` **Exit 0**, Integration 49, Treiber 0 Befunde |
| Verbleibend | 116 / 79 | **111** Dateien mit `readFileSync`, **74** mit Grep-/Bauvorschriften-`describe` |

Verfeinert lesen nach dieser Charge **95** Describe-Bloecke wirklich eine Quelldatei.

---

## 19. Charge 7 (28.10.2026): fuenf weitere Dateien

**Dateien:** `start` (app-shell), `sichten` (app-shell),
`projektzustand` (composer), `pruefungen` (vorlagen-editor),
`project-store-nachtrag` (ipc-gateway, Main).

**Ausgangsmessung:** 25 Verhaltens-Mutationen, 5 harmlose Refactorings.
Erkannt: **21**. Gruen: **ST5, S2, S3, S4** – vier echte Luecken. Alle
Refactorings gruen (nach einer Korrektur, s. u.). Jede Mutation byte-identisch
zurueckgenommen.

### Die vier Luecken (alle geschlossen)

- **ST5 – der Rueckgabewert wurde geprueft, der WECHSEL nicht.** `wechsleReiter(reiter)`
  auf `wechsleReiter(START_REITER_OHNE_PROJEKT)` geaendert blieb gruen, weil die Tests
  nur `ergebnis.reiter` lesen. Neu: `holeReiter()` muss nach dem Oeffnen wirklich
  `'vorlagen'` sein.
- **S2 – der Abbruch bei gescheiterter Vorlagen-Uebersicht war ungeprueft.** Die
  Mutation `if (!uebersicht.ok)` → `false` blieb gruen; `uebersicht.wert` wird im
  Erfolgsfall gar nicht gelesen. Neu: `ladeUebersicht` lehnt ab ⇒ `ok: false`,
  `holeSichten()` bleibt auf dem vorherigen Stand.
- **S3/S4 – der Zeichnen-Stand war ungeprueft.** `zeichen.hole()` nach `bereiteVor`
  sowie das Zuruecksetzen beim Verwerfen hatten keinen Test. Neu (mit gemockter
  `zeichen-vorbereitung`): `hole()` liefert den hergestellten Stand, Verwerfen setzt
  ihn auf `null` und ruft die Verwerf-Regel genau einmal.

### Ein Refactoring, das keines war (transparent)

- Der erste harmlose Refactoring-Versuch in `project-store-nachtrag` (alle `nutzlast`
  → `eingang`) brach die Testdatei schon beim Sammeln ab (0 Tests). Ein Refactoring,
  das die Suite nicht mehr laufen laesst, ist **nicht** harmlos – ersetzt durch eine
  reine Kommentar-Umformulierung; die blieb gruen.

### Gegenproben

ST5, S2, S3, S4 nach den Korrekturen: **alle erkannt** (je 1 Test rot). Die
Kommentar-Umformulierung: gruen.

### Entfernt (14 Tests, 2 ergaenzt – netto −12)

- **3** in `start` (kein JSX/react, kein `config:`/`project:`-Literal, kein
  `window.api`).
- **3** in `sichten` (kein `rufeAuf`/`config:`-Literal/`KANAELE`/Marke-Import;
  `inhalte-zugaenge` und `bootstrap` ohne Marke-Treffer).
- **3** in `projektzustand` (kein Kanal-Literal/window.api/Node-Import, kein `sort`,
  kein selbstgebautes Projekt).
- **2** in `pruefungen` (kein `sort`; `bandSicherheitsLinie` leitet aus
  `sicherheitsBox` ab, statt die Konstante zu subtrahieren).
- **3** in `project-store-nachtrag` (kein Kanal-Literal, kein fs/Fenster/Lock/#76,
  Nutzlast-Pruefer importiert statt kopiert). Der Registry-Test ist **geblieben**.

**Ehrlich offen:** Die entfernten Verbote sind Architekturregeln (Lint-Kandidat);
die Ableitung „aus `sicherheitsBox`, nicht aus der Konstante" ist jetzt nur noch
durch das Verhalten (108 bei 162) gedeckt.

### Stand nach Charge 7

| | vorher | nachher |
|---|---|---|
| Mutationen in dieser Charge | – | **25**: 21 im ersten Lauf, 4 nach Korrektur – **25 erkannt** |
| Refactorings | – | **0 / 5 rot** (1 Versuch verworfen, s. o.) |
| Quelltext-/Meta-Tests entfernt | – | **14** |
| Verhaltens-Tests ergaenzt | – | **2** |
| Echte Luecken geschlossen | – | **4** |
| Suite | 5.572 | **5.560** (340 Dateien) |
| Gate | – | `npm run pruefung` **Exit 0**, Integration 49, Treiber 0 Befunde |
| Verbleibend | 111 / 74 | **106** Dateien mit `readFileSync`, **70** mit Grep-/Bauvorschriften-`describe` |

Verfeinert lesen nach dieser Charge **89** Describe-Bloecke wirklich eine Quelldatei.

---

## 20. Charge 8 (28.10.2026): fuenf weitere Dateien

**Dateien:** `kaputt-erkennung` (composer), `validierung` (render-service, Main),
`torwaechter` (auftrags-manager, Main), `eingebaute-vorlagen` (vorlagen-store, Main),
`beende-auftrag` (auftrags-manager, Main).

**Ausgangsmessung:** 24 Verhaltens-Mutationen, 5 harmlose Refactorings (eine geplante
Mutation fiel weg, weil ihr Zieltext dreimal vorkam und nicht eindeutig war).
Erkannt: **22**, **zwei aequivalente** (T5, BA2). **Keine Luecke.** Alle Refactorings
gruen. Jede Mutation byte-identisch zurueckgenommen.

### Die zwei aequivalenten Mutationen

- **T5 – der abgelehnte Uebergang ist ueber die oeffentliche Q1-Schnittstelle nicht
  erreichbar.** `naechsterAnstehender()` liefert ausschliesslich `anstehend`-Auftraege,
  und `anstehend -> laeuft` ist erlaubt. Der Zweig bleibt als Programmierfehler-Wache
  stehen; ein Test muesste Q1 an der Schnittstelle vorbei praeparieren.
- **BA2 – ein unbekannter Handler-Status wird ohnehin von der Uebergangstabelle
  abgewiesen.** Mit entfernter `zielStatus === null`-Wache liefe der Code mit `null` in
  `pruefeUebergang`, das ablehnt, BEVOR `auftrag.status` geschrieben wird – der Zustand
  bleibt gleich. Die Wache verbessert nur die Meldung. Neu ist trotzdem ein Test
  „Ausgang ohne bekannten Status veraendert nichts": Er dokumentiert die Zusage, faengt
  die Mutation aber nicht (aequivalent).

### Harness-Korrekturen (keine Code-Befunde)

- `T3`, `EV3` und ein geplantes `EV6` trafen zunaechst mehrere Stellen (Kommentar bzw.
  drei gleiche `rahmen`-Zeilen). Mit eindeutigem Kontext nachgeholt; `EV6` entfiel.

### Entfernt (13 Tests, 1 ergaenzt – netto −12)

- **4** in `kaputt-erkennung` (Modulgrenze: kein fs/path/electron, kein ipc-client,
  exakte Typ-Importliste, kein async/Ergebnis).
- **4** in `validierung` (kein fs/`Math.round`, keine Namensregeln, keine
  Bandhoehen-Regeln, kein `medium_fehlt`). Die Verhaltens-Tests pruefen die
  PNG-Masse, das Profil Feld fuer Feld und die Dauer-Grenzen.
- **2** in `torwaechter` (kein `await`/`then` zwischen Pruefung und Statuswechsel –
  als statische Probe; kein Timer/Polling/Selbstaufruf). Die Reihenfolge ist als
  Verhaltens-Test „Journal und Ereignis erst NACH dem Statuswechsel" vorhanden.
- **2** in `eingebaute-vorlagen` (nur Rollen, keine Farben/Schriftnamen; kein
  Dateisystem). Die Frische/Tiefe der Kopie ist Verhaltens-Test.
- **1** in `beende-auftrag` (keine Imports aus fs/project-store/ffmpeg).

**Ehrlich offen:** Die entfernten Architektur-Verbote haben keinen Waechter bis zu
einer Lint-Regel. Die `await`-Freiheit zwischen Pruefung und Statuswechsel ist jetzt
nur noch mittelbar (Reihenfolge-Test) gedeckt, nicht mehr statisch.

### Stand nach Charge 8

| | vorher | nachher |
|---|---|---|
| Mutationen in dieser Charge | – | **24**: 22 erkannt, 2 aequivalent |
| Refactorings | – | **0 / 5 rot** |
| Quelltext-/Meta-Tests entfernt | – | **13** |
| Verhaltens-Tests ergaenzt | – | **1** |
| Echte Luecken geschlossen | – | **0** |
| Suite | 5.560 | **5.548** (340 Dateien) |
| Gate | – | `npm run pruefung` **Exit 0**, Integration 49, Treiber 0 Befunde |
| Verbleibend | 106 / 70 | **101** Dateien mit `readFileSync`, **69** mit Grep-/Bauvorschriften-`describe` |

Verfeinert lesen nach dieser Charge **82** Describe-Bloecke wirklich eine Quelldatei.

---

## 21. Charge 9 (28.10.2026): fuenf weitere Dateien

**Dateien:** `quelle` (export-service, Main), `reparatur-fuehrung-shell` (app-shell),
`undo-aufzeichnung-vorlage` (app-shell), `transport` (preview-player),
`vorlagen-uebersicht` (vorlagen-editor).

**Ausgangsmessung:** 25 Verhaltens-Mutationen, 5 harmlose Refactorings.
Erkannt: **23**. Gruen: **T4, VU1** (echte Luecken) und **Q2** (aequivalent); ein
Refactoring war **nicht** harmlos (RR, s. u.). Jede Mutation byte-identisch
zurueckgenommen.

### Die zwei Luecken (geschlossen)

- **T4 – die Tick-Grenze war nur mit Ueberschuss geprueft.** Der bestehende Test
  schickt 1000 ms auf eine 20-Frame-Achse (30 Frames) – das stoppt auch mit `>`.
  Neu: frame 19 + GENAU eine Frame-Dauer ⇒ frame 20, `laeuft: false`. Mit `>` liefe
  die Uhr am Achsenende weiter.
- **VU1 – nur der Fehler der ZWEITEN Liste war geprueft.** `if ('fehler' in ergebnis1)`
  auf `false` geaendert blieb gruen; `ergebnis1.wert` ist dann `undefined`, und der
  Aufbau wuerfe beim `map` (Absturz statt Ergebnis-Huelle). Neu: `listeVorlagen`
  scheitert ⇒ `ok: false`, Stand unveraendert, kein Wurf.

### Die eine aequivalente Mutation

- **Q2 – `dateiname.length === ".mp4".length` kann nicht anders greifen.** Nach
  `endsWith(".mp4")` hat jeder zulaessige Name mindestens 4 Zeichen; ein Name der
  Laenge 4 ist genau ".mp4". `<=` und `===` sind damit gleichbedeutend.

### Ein Refactoring, das keines war (transparent)

- **RR:** `wechselZu` → `zielReiter` (alle Vorkommen) benennt versehentlich die
  PROPERTY `FuehrungsSchritt.wechselZu` um – 9 Tests rot. Ersetzt durch die lokale
  Umbenennung `neueLage` → `naechsteLage`; die blieb gruen.

### Entfernt (9 Tests + 1 eingebetteter Quelltext-Block, 2 ergaenzt – netto −7)

- **1 Block** in `quelle` (kein `path.join/resolve`, kein `ausgabeOrdner` im
  Quelltext) – die Verhaltenszeile `ordnerAufrufe === 0` bleibt.
- **3** in `reparatur-fuehrung-shell` (kein JSX/react/IPC, kein Reiter-/Rechnungs-
  Aufruf, kein `starteFuehrung`).
- **2** in `undo-aufzeichnung-vorlage` (kein JSX/react/IPC/Timer/JSON/Historie-Zugriff;
  nur der Typ-Import aus `arbeitskopie`).
- **2** in `transport` (Kommentar-Filter-Gegenprobe; kein Taktgeber/Systemzeit/video/
  react/IPC/`let` auf Modulebene).
- **2** in `vorlagen-uebersicht` (kein Anzeigetext/keine Zahl; kein Kanal-Literal/
  Main-Import/fs/path/`sort`).

**Ehrlich offen:** Die entfernten Verbote sind Architekturregeln (Lint-Kandidat). Der
Typ-Import in `undo-aufzeichnung-vorlage` ist nur noch durch die Import-Zeile gedeckt.

### Stand nach Charge 9

| | vorher | nachher |
|---|---|---|
| Mutationen in dieser Charge | – | **25**: 24 erkannt, 1 aequivalent |
| Refactorings | – | **0 / 5 rot** (1 Versuch verworfen, s. o.) |
| Quelltext-/Meta-Tests entfernt | – | **9** (+1 Block) |
| Verhaltens-Tests ergaenzt | – | **2** |
| Echte Luecken geschlossen | – | **2** |
| Suite | 5.548 | **5.541** (340 Dateien) |
| Gate | – | `npm run pruefung` **Exit 0**, Integration 49, Treiber 0 Befunde |
| Verbleibend | 101 / 69 | **96** Dateien mit `readFileSync`, **66** mit Grep-/Bauvorschriften-`describe` |

Verfeinert lesen nach dieser Charge **77** Describe-Bloecke wirklich eine Quelldatei.

---

## 22. Charge 10 (28.10.2026): fuenf weitere Dateien

**Dateien:** `liste-ansicht` (composer), `listen-zeilen` (queue-panel),
`leerzustand` (app-shell), `leerzustand-regel` (app-shell),
`dauer-regler` (composer).

**Ausgangsmessung:** 23 Verhaltens-Mutationen, 5 harmlose Refactorings.
Erkannt: **19**. Gruen: **LE3, LE4, LZ3** (echte Luecken); `LZ4` traf zunaechst
einen fehlenden Kommentar im Suchtext (Harness, kein Befund). Alle Refactorings
gruen. Jede Mutation byte-identisch zurueckgenommen.

### Die drei Luecken (geschlossen)

- **LE3 – `role="status"` war ungeprueft.** Auf `alert` geaendert blieb gruen; kein
  Test las das Attribut. Neu: der Hinweis traegt `role="status"`.
- **LE4 – die Knopf-Beschriftung war nur „enthaelt Projekte".** Auf „Projekte"
  verkuerzt blieb gruen. Neu: exakt „Zum Reiter Projekte".
- **LZ3 – ein Status ausserhalb der Union war ungeprueft.** `?? 'unbekannt'` statt
  `?? auftrag.status` blieb gruen. Neu: `'quatsch'` (Cast) ⇒ `zustandText` ist der
  Rohwert.

### Harness-Korrektur (kein Befund)

- **LZ4:** Der Suchtext liess den Kommentar zwischen `{` und `return` aus. Mit dem
  vollstaendigen Block nachgeholt; die vorhandene Leerlisten-Probe fing die Mutation.

### Entfernt (10 Tests, 1 ergaenzt – netto −9)

- **2** in `liste-ansicht` (kein JSX/react/dnd-kit/IPC/Rundung; „ein Format je
  Zeile" als Quelltext-Probe). Die Formatregel ist als Verhaltens-Test vorhanden
  („12,5 s" statt „0:12").
- **2** in `listen-zeilen` (kein `sort`/`reverse`/`filter`/`slice`; kein Kanal/IPC).
- **2** in `leerzustand` (kein IPC/Fremd-Modul-Import; kein Projekt-Datenimport).
- **2** in `leerzustand-regel` (kein JSX/react; kein IPC/Fremd-Import).
- **2** in `dauer-regler` (keine Bereichsgrenzen als Zahl/kein Raster; kein Kanal/
  JSX/react/window/fs).

**Ehrlich offen:** Die entfernten Verbote sind Architekturregeln (Lint-Kandidat);
die „ein Format je Zeile"-Regel ist nur noch durch den Verhaltens-Test gedeckt.

### Stand nach Charge 10

| | vorher | nachher |
|---|---|---|
| Mutationen in dieser Charge | – | **23**: 19 im ersten Lauf, 3 Luecken + 1 Harness-Fehler – **23 erkannt** |
| Refactorings | – | **0 / 5 rot** |
| Quelltext-/Meta-Tests entfernt | – | **10** |
| Verhaltens-Tests ergaenzt/geschaerft | – | **1 + 2** |
| Echte Luecken geschlossen | – | **3** |
| Suite | 5.541 | **5.532** (340 Dateien) |
| Gate | – | `npm run pruefung` **Exit 0**, Integration 49, Treiber 0 Befunde |
| Verbleibend | 96 / 66 | **91** Dateien mit `readFileSync`, **61** mit Grep-/Bauvorschriften-`describe` |

Verfeinert lesen nach dieser Charge **72** Describe-Bloecke wirklich eine Quelldatei.

---

## 23. Charge 11 (28.10.2026): fuenf weitere Dateien

**Dateien:** `vorschau-anzeige` (`vorschau.tsx`), `split-stile-rechnung`,
`png-ablage` (render-service), `nutzung-anzeigen-ansicht`, `inhalte-reiter`.

**Ausgangsmessung:** 21 Verhaltens-Mutationen, 5 harmlose Refactorings.
Erkannt: **17**. Gruen: **NA4, IN4** (echte Luecken) und **VV3, IN2** (aequivalent).
Drei Refactoring-Versuche waren **nicht** harmlos (s. u.). Jede Mutation
byte-identisch zurueckgenommen.

### Die zwei Luecken (geschlossen)

- **NA4 – die Umschalter-Beschriftung war ungeprueft.** Der Text wurde auf
  „Trefferliste anzeigen" festgenagelt; kein Test las die Beschriftung im
  aufgeklappten Zustand. Neu: exakt „Trefferliste ausblenden".
- **IN4 – `hervorgehobeneAktionId` war nur mit `null` geprueft.** Der Test verglich
  `null` mit `null` – eine Konstante `null` waere ebenfalls gruen. Neu: ein gesetzter
  Wert (`'a-hervorgehoben'`) wird unveraendert durchgereicht.

### Die zwei aequivalenten Mutationen

- **VV3 – `schriftenBereit = true` ist ohne Wirkung.** Der Wert wird nur im Zweig
  `props.voraussetzungen !== null` an `waehleVorschaubild` gegeben; dort ist er
  ohnehin `true`. Bleibt als benannte Zusicherung stehen.
- **IN2 – `if (true)` fuer den Leerzustand ist ohne Wirkung.** `ProjektStandReiter`
  wird nur fuer `zusammenstellen`/`aktionen` benutzt; `zeigtLeerzustand` ist dort
  ohne Projekt immer wahr. Die anderen Reiter haengen ihre Wurzeln direkt ein.

### Drei Refactorings, die keine waren (transparent)

- `stand` → `transportStand` (vorschau), `gruppe` → `treffergruppe`
  (nutzung-anzeigen) und `geometrie` → `bandGeometrie` (split-stile) brachen die
  Suiten: Die Ersetzungen trafen auch `setStand`-nahe Bezeichner, `anzeige.gruppen`
  (Plural enthaelt `gruppe`) bzw. den Importnamen. Kein harmloses Refactoring;
  ersetzt durch **Kommentar-Umformulierungen**, die gruen blieben.

### Entfernt (10 Tests, 1 ergaenzt + 2 geschaerft – netto −9)

- **2** in `vorschau-anzeige` (genau ein `requestAnimationFrame`/kein Taktgeber;
  Gesamtdauer aus `formatiereLaenge`).
- **2** in `split-stile` (kein `Math.`/Literal ausser 0/genau eine Subtraktion;
  kein JSX/react).
- **2** in `png-ablage` (kurzer Name nirgends; kein `Promise.all`).
- **2** in `nutzung-anzeigen-ansicht` (kein IPC/`entferneVorlage`/`holeNutzung`/
  `useState`; nur Typ-Importe).
- **2** in `inhalte-reiter` (kein Rueckkanal/`reiheEin`/zweiter Reiterwechsel/
  Wurzel-Wert-Importe).

**Ehrlich offen:** Die entfernten Verbote sind Architekturregeln (Lint-Kandidat).

### Stand nach Charge 11

| | vorher | nachher |
|---|---|---|
| Mutationen in dieser Charge | – | **21**: 19 erkannt, 2 aequivalent |
| Refactorings | – | **0 / 5 rot** (3 Versuche verworfen, s. o.) |
| Quelltext-/Meta-Tests entfernt | – | **10** |
| Verhaltens-Tests ergaenzt/geschaerft | – | **1 + 2** |
| Echte Luecken geschlossen | – | **2** |
| Suite | 5.532 | **5.523** (340 Dateien) |
| Gate | – | `npm run pruefung` **Exit 0**, Integration 49, Treiber 0 Befunde |
| Verbleibend | 91 / 61 | **87** Dateien mit `readFileSync`, **56** mit Grep-/Bauvorschriften-`describe` |

Verfeinert lesen nach dieser Charge **67** Describe-Bloecke wirklich eine Quelldatei.

## 24. Charge 12 (28.10.2026): fuenf weitere Dateien

**Dateien:** `bibliothek-ansicht` (`bibliothek-ansicht.ts`), `ausgabe-liste-ansicht`
(`ausgabe-liste.tsx`), `buehne` (`buehne.tsx`), `einblendung-stile-rechnung`
(`einblendung-stile.ts`), `ausgabe-platzieren` (render-service). Auswahl nach
Probezahl und Lesen; `bibliothek-ansicht-ansicht`, `asset-auswahl-anzeige` und
`einblendung-ansicht-anzeige` bleiben fuer die naechste Charge liegen.

**Ausgangsmessung:** 30 Verhaltens-Mutationen, 5 harmlose Refactorings.
Erkannt: **25**. Gruen: **AL3, AL4, BU4, BU5, AP3**. **0/5 Refactorings rot**;
jede Mutation byte-identisch zurueckgenommen (`tools/mutationen.py`).

### Die vier Luecken (geschlossen)

- **AL4 – der Export-Knopf gab bei mehreren Zeilen die falsche Datei.** Der Test
  hatte genau EINE Zeile; `p.aufExportieren(p.stand.dateien[0])` waere dort gruen.
  Neu: zwei Zeilen, der zweite Knopf muss die zweite Datei liefern.
- **BU4/BU5 – `transformOrigin` und die schwarze Buehnenflaeche waren ungeprueft.**
  `transformOrigin: 'center'` verschiebt die skalierte Flaeche sichtbar; `#FFFFFF`
  als Kastenfarbe ebenso. Beides steht jetzt im bestehenden Raster-Test.
- **AP3 – `EPERM` fehlte in der Wiederholungs-Wache.** Der Spec prueft nur `EBUSY`;
  `['EBUSY']` statt `['EBUSY', 'EPERM']` blieb 32/32 gruen. Neu: ein EPERM-Lauf
  wiederholt viermal und endet in `speicher_fehler`.

### Als aequivalent belegt (Wachen/Testids bleiben)

- **AL3 – `data-testid="ausgaben-fehler"` hat keinen Verbraucher.** Kein Test, kein
  Treiber-Schritt liest die Kennung; sichtbar ist der Text, und der ist geprueft.
- **ES4 – `bandBreite: 1920` statt `RENDER_PROFILE.breite`.** Heute derselbe Wert;
  unterscheidbar erst bei einer Profilaenderung (Einzelquellen-Regel, s. u.).
- **AP4 – `>=` statt `>` vor dem ersten Versuch.** Ein zusaetzliches `await` auf 0 ms
  ist nicht beobachtbar.
- **AP6 – `rm` ohne `force`.** Der Fehler wird geschluckt; die Idempotenz-Zusage ist
  von aussen nicht unterscheidbar. Bleibt als defensive Absicherung stehen.

### Zwei Faelle, die NUR die Grep-Probe fing (wichtig fuer die Entfernung)

- **ES1 (`bandHöhe: höhe`)** war nur ueber die Zeile „GENAU EINE Subtraktion" rot.
  Der Eigenschafts-Test kann ihn nicht sehen: Bei der echten `berechneBandGeometrie`
  ist `1080 − bandY` immer gleich `höhe`. **Ersatz:** eine Attrappe der geteilten
  Rechnung (`vi.doMock`, `bandY: 900` bei `H = 162`) verlangt `bandHöhe: 180`.
  Gegenprobe danach: **erkannt**.
- **ES4** war ebenfalls nur ueber „kein Zahlenliteral" rot – und bleibt nach dem
  Entfernen gruen. Das ist die ehrliche Einzelquellen-Luecke, kein Testfehler.

### Entfernt (9 Tests, 3 ergaenzt – netto −6)

- **2** in `bibliothek-ansicht` (kein JSX/react/IPC; `kaputt` nicht selbst gerechnet).
  Die Zusage „keine zweite Regel" traegt der Verhaltens-Test gegen `istAktionKaputt`.
- **2** in `ausgabe-liste-ansicht` (kein `rufeAuf`/`KANAELE`/eigener Ladevorgang;
  kein `useState`/`useEffect`).
- **2** in `buehne` (kein `devicePixelRatio`/Runden/Literal/canvas/video; nur ein
  Zustand).
- **2** in `einblendung-stile-rechnung` (kein `Math.`/Literal/genau eine Subtraktion;
  kein JSX/react).
- **1** in `ausgabe-platzieren` („was die Datei nicht tut": kein `child_process`/
  `spawn`/`ermittleFfprobePfad`, keine 1-%-Formel) plus die zwei eingebetteten
  `QUELLTEXT`-Zeilen im EXDEV-Test. **Ersatz fuer „kopiert nichts":** die Zieldatei
  ist nach dem EXDEV-Lauf noch die alte – ein `copyFile` laege dort als „bytes".

**Ehrlich offen:** Die entfernten Verbote sind Architekturregeln (Lint-Kandidat);
die Einzelquellen-Regel `bandBreite` ist nur durch den Wert gedeckt.

### Stand nach Charge 12

| | vorher | nachher |
|---|---|---|
| Mutationen in dieser Charge | – | **30**: 25 erkannt, 5 aequivalent/ohne Verbraucher |
| Refactorings | – | **0 / 5 rot** |
| Quelltext-/Meta-Tests entfernt | – | **9** |
| Verhaltens-Tests ergaenzt | – | **3** |
| Echte Luecken geschlossen | – | **4** (AL4, BU4, BU5, AP3) |
| Suite | 5.523 | **5.517** (340 Dateien) |
| Gate | – | `npm run pruefung` **Exit 0**, Integration 49, Treiber 0 Befunde |
| Verbleibend | 87 Dateien mit `readFileSync` | **83** Dateien mit `readFileSync`; **61** mit Grep-/Bauvorschriften-`describe` (breite Namenssuche – die 56 der Vorcharge stammen aus einer engeren Definition und sind damit nicht direkt vergleichbar) |

## 25. Werkzeug seit 28.10.2026: die Sperrklinke (#447)

Ab Charge 13 ist der Fortschritt nicht mehr `grep -rl readFileSync`, sondern eine Liste:

`tools/eslint/quelltext-proben-ausnahmen.json` nennt die **70** Testdateien, die noch `src/`
lesen. Die ESLint-Regel `lokal/quelltext-proben` meldet jede Probe in einer **nicht** gelisteten
Datei.

**Rezept-Ergaenzung je Charge:** die fuenf bearbeiteten Dateien aus der Liste **streichen** und
den Lint-Lauf als Beleg nehmen. Bleibt ein Eintrag stehen, obwohl die Probe weg ist, faellt das
nicht auf – wird eine Probe wieder eingebaut, ist der Lauf rot. Die Liste ist damit der einzige
zaehlbare Fortschrittsmassstab; die Messung „Describe-Bloecke, die eine Quelldatei lesen" ist
abgeloest.

Stand nach dem Bau: 70 Dateien, 80 Einzelproben. Die Regel erkennt direkte Literale, Templates,
`new URL(...)` und einfache Konstanten (`const QUELLE = path.join(...)`); ein Pfad, der erst aus
einem Funktionsparameter entsteht, bleibt unsichtbar – die Sperrklinke ist eine Bremse gegen
Nachwuchs, kein Sandkasten.

## 26. Charge 13 (28.10.2026): fuenf weitere Dateien

**Dateien:** `bibliothek-ansicht-ansicht` (`bibliothek-ansicht.tsx`), `asset-auswahl-anzeige`
(`asset-auswahl.tsx`), `einblendung-ansicht-anzeige` (`einblendung-ansicht.ts` + `.tsx`),
`sicherheitsabstand-bearbeiten` (`sicherheitsabstand-bearbeiten.ts`), `speicherstatus-lage`
(`speicherstatus-lage.ts`). Alle fünf standen auf der Sperrklinken-Liste (#447).

**Ausgangsmessung:** 26 Verhaltens-Mutationen, 5 harmlose Refactorings. Erkannt: **15**.
Gruen: **BI2, BI3, BI4, AS3, AS4, EI1, EI6, EX1, SL3**. **0/5 Refactorings rot**; jede
Mutation byte-identisch zurueckgenommen.

### Harness-Korrektur (kein Code-Befund)

Die sieben Mutationen an `einblendung-ansicht.ts` liefen zuerst gegen
`einblendung-ansicht-anzeige.spec.ts` – **alle 7 gruen**. Die zugehoerige Spezifikation ist
aber `einblendung-ansicht.spec.ts` (die tsx-Spec importiert nur die Ansicht). Nach der
Korrektur: **5 erkannt**, 2 gruen. Wer die falsche Spec laufen laesst, misst nichts.

### Die sieben Luecken (geschlossen)

- **BI2 – der Hinweis „N Medien fehlen" war nur im Fall > 0 geprueft.** `>= 0` zeigte ihn
  immer („0 Medien fehlen"). Neu: kein Hinweis, wenn nichts fehlt.
- **BI3 – die Auswahl-Markierung (#418) war ungeprueft.** `data-ausgewaehlt` und der Klick
  auf die Zeile haben jetzt einen Test (zwei Videos, eines ausgewaehlt).
- **BI4 – „· defekt" war ungeprueft.** `{kaputt && null}` liess die Kennzeichnung verschwinden;
  neu: Text **und** der Hinzufuegen-Weg bleibt offen (gekennzeichnet, nicht gesperrt).
- **AS4 – nach einem Wurf blieb die Auswahl dauerhaft gesperrt.** Die zwei Ruecksetzungen im
  `catch` waren ungeprueft; neu: zweiter Klick nach einem Wurf ruft erneut und schliesst ab.
- **EX1 – die Pfeil-Knoepfe waren am Rand nicht geprueft.** `disabled={false}` machte „nach
  oben" in der ersten Zeile klickbar; neu: erste/letzte Zeile je ein Rand.
- **EI6 – `trim()` in `istUebernehmbar` war ungeprueft.** Eine Vorlagen-ID aus Leerzeichen galt
  als gueltig; neu: `'   '` ist false.
- **SL3 – die feste Reihenfolge von `betroffeneQuellen` war ungeprueft.** Der einzige Test
  hatte nur EINE Quelle; neu: beide Quellen ⇒ `['projekt', 'vorlagen']`.

### Als aequivalent belegt (Wachen bleiben)

- **EI1 – `element.art !== 'video'` gegen `=== 'segment'`.** Der gebaute Vertrag kennt nur
  diese zwei Arten; die `!==`-Form ist die defensive Fassung fuer eine etwaige Bestandszeile.
- **AS3 – der `laeuft`-Ref neben `disabled`.** In jsdom ist der zweite Klick durch den
  gesperrten Knopf schon blockiert; der Ref schliesst das Fenster zwischen Render und Klick
  im ECHTEN Fenster. Als defensive Absicherung stehen gelassen.

### Entfernt (7 Tests, 6 ergaenzt – netto −1) und die Sperrklinke

- **1** in `bibliothek-ansicht-ansicht` (kein `<video`/`file://`/`rufeAuf`/`reiheEin`).
- **2** in `asset-auswahl-anzeige` (kein Kanal; kein Import aus `src/main/`) – die zweite
  Zusage traegt jetzt die ESLint-Regel aus #447.
- **2** in `einblendung-ansicht-anzeige` (Verbotslisten fuer `.ts` und `.tsx`).
- **1** in `sicherheitsabstand-bearbeiten` („keine Magier-Zahlen", `node:fs`).
- **1** in `speicherstatus-lage` (kein JSX/react).

**Sperrklinke:** 70 → **65** Dateien (`tools/eslint/quelltext-proben-ausnahmen.json`).

### Stand nach Charge 13

| | vorher | nachher |
|---|---|---|
| Mutationen in dieser Charge | – | **26**: 15 erkannt, 9 aequivalent (2) / Luecke (7) |
| Refactorings | – | **0 / 5 rot** |
| Quelltext-/Meta-Tests entfernt | – | **7** |
| Verhaltens-Tests ergaenzt | – | **6** |
| Echte Luecken geschlossen | – | **7** |
| Suite | 5.517 | **5.516** (340 Dateien) |
| Gate | – | `npm run pruefung` **Exit 0**, Integration 49, Treiber 0 Befunde |
| Sperrklinke | 70 | **65** Dateien |

## 27. Charge 14 (28.10.2026): fuenf weitere Dateien

**Dateien:** `einblendung-anzeige` (`einblendung.tsx`), `marken-speicherstatus`
(`marken-speicherstatus-lage.ts` + `.tsx`), `speicherstatus-verdrahtung`
(`speicherstatus-verdrahtung.ts`), `split-anzeige` (`split.tsx`), `video-ausschnitt`
(`video-ausschnitt.ts`). Alle fünf von der Sperrklinken-Liste (#447).

**Ausgangsmessung:** 26 Verhaltens-Mutationen, 5 harmlose Refactorings. Erkannt: **23**.
Gruen: **EN3, EN4** (echte Luecken), **EN1/EN2** rot; **0/5 Refactorings rot**; jede
Mutation byte-identisch zurueckgenommen.

### Harness-Korrektur (kein Code-Befund)

**SV4** (`once('closed')` → `on('close')`) meldete „0 bestanden, 0 rot" – das ist **keine
Erkennung**: Das Fenster-Doppel kennt nur `once`, `fenster.on` ist `undefined`, die Suite laedt
nicht. Ersetzt durch `once('close')` (der Doppel merkt sich den Ereignisnamen), danach **erkannt**.
**VA-R** traf den Kommentartext nicht (0 Treffer) – mit der richtigen Zeile gruen.

### Die zwei Luecken (geschlossen)

- **EN3 – `abschnittMarke === null` war ungeprueft.** Ohne die zweite Bedingung entstuende ein
  Segment mit `marke={null}`. Neu: eigenes Element ohne Abschnittsmarke ⇒ kein Segment.
- **EN4 – welche Marke das Segment bekommt, war unsichtbar.** `eigenschaften()` gab beiden
  Marken dieselbe `id` ('m1'); `marke={props.rahmenMarke}` blieb gruen. Neu: zwei unterscheidbare
  Marken, das Segment traegt die **Abschnitts**marke.

### Entfernt (28 Testfaelle, 2 ergaenzt – netto −26)

- **1** in `einblendung-anzeige` (Verbotsliste ueber beide Dateien).
- **1** in `marken-speicherstatus` (react/KANAELE/Timer); der Wortlaut-Test **bleibt**, nur die
  Quelltext-Haelfte („GENAU EINMAL quer ueber beide Dateien") ist weg.
- **1** in `speicherstatus-verdrahtung` (Codeinspektion); die **Diff-Probe** in der
  Kanal-Registry ist durch eine **Wertprobe** ersetzt (drei Kanaele paarweise verschieden,
  importierte Registry statt Quelltext).
- **2** in `split-anzeige` (gemeinsame Verbotsliste; „Naht"-Probe, die zwei Konstanten mit sich
  selbst verglich).
- **24** in `video-ausschnitt`: die **18** Flaggen-Proben (`it.each`), die drei
  Fragment-Verbote (`copy`, `+faststart`, `setsar`), `toLocaleString`/`Intl.NumberFormat`,
  die `node:fs`/`child_process`-Abgrenzung, deren Gegenprobe sowie die `-y`-Zeile aus #158.
  Die `-shortest`-Naht aus #162 **bleibt** (Verhalten am echten Fragment).

**Ehrlich offen:** Die 18 Flaggen-Verbote und „kein `node:fs` in dieser Datei" sind jetzt
**ungeschuetzt** – Kandidat fuer eine dateibezogene Lint-Regel (wie #447 sie fuer den Renderer
gebaut hat). Nicht stillschweigend: der Kopf der Quelldatei nennt weiterhin, wer zustaendig ist.

### Stand nach Charge 14

| | vorher | nachher |
|---|---|---|
| Mutationen in dieser Charge | – | **26**: 23 erkannt, 2 Luecken, 1 Harness-Fall |
| Refactorings | – | **0 / 5 rot** |
| Quelltext-/Meta-Tests entfernt | – | **28** |
| Verhaltens-Tests ergaenzt | – | **2** |
| Echte Luecken geschlossen | – | **2** |
| Suite | 5.516 | **5.490** (340 Dateien) |
| Gate | – | `npm run pruefung` **Exit 0**, Integration 49, Treiber 0 Befunde |
| Sperrklinke | 65 | **60** Dateien |

## 28. Charge 15 (28.10.2026): fuenf weitere Dateien

**Dateien:** `marken-vorschau` (`live-vorschau.ts`), `medium-loeschen-anzeige`
(`medium-loeschen.tsx`), `segment-anzeige` (`segment.tsx`), `render-dialog-anzeige`
(`render-dialog.tsx`), `speicherstatus-anzeige` (`speicherstatus.tsx`). Alle von der
Sperrklinken-Liste (#447); die Charge war vorab als
[`charge-15-vorbereitung.md`](charge-15-vorbereitung.md) dokumentiert und **trocken geprueft**
(30 Faelle, jeder Suchtext genau einmal).

**Ausgangsmessung:** 25 Verhaltens-Mutationen, 5 harmlose Refactorings. Erkannt: **20**.
Gruen: **ML5, ML7, SG5, SS2** (echte Luecken) und **ML2** (aequivalent). **0/5 Refactorings rot**;
jede Mutation byte-identisch zurueckgenommen.

### Die vier Luecken (geschlossen)

- **ML5 – der Aktions-Absatz erschien auch ohne betroffene Aktionen.** `length > -1` zeigte den
  Block mit leerer Liste. Neu: ohne betroffene Aktionen ist `medium-loeschen-aktionen` **nicht im DOM**.
- **ML7 – die Blockade-Zeile war nicht woertlich geprueft.** Der Test las „Position 1/2" nur aus
  `lage.text` – die **Listenzeile** konnte die Positionsangabe verlieren, ohne dass etwas rot
  wurde (dieselbe Falle wie „eine Meldung mit der richtigen Zahl ist kein Beleg"). Neu: die
  Zeilen selbst, exakt `['Position 1: tanzkurs.mov', 'Position 2: tanzkurs.mov']`.
- **SG5 – der Zeichen-Effekt hing nur an `[aktion]`.** Ein Wechsel von **Vorlage oder Marke**
  liess die Flaeche auf dem alten Bild stehen. Neu: Wechsel beider Eingaben ⇒ je ein weiterer
  Aufruf.
- **SS2 – das Verbindungswort des Hinweistexts war ungeprueft.** `join(' und ')` statt `', '`
  blieb gruen. Neu: beide Quellen ⇒ `das Projekt (p-code), die Vorlagen (v-code).`

### Als aequivalent belegt

- **ML2 – die Wache `if (blockiert) return` ist ueber die Oberflaeche unerreichbar.** Im
  Blockade-Zweig wird gar kein Bestaetiger gerendert (der Test prueft das bereits); die Wache
  bleibt als zweite Absicherung.

### Treiber-Befund und -Korrektur (nicht vom Produktcode)

Der Gate-Lauf war **rot**: `[Befund] Vorlagen (FA-13) :: nach dem Uebernehmen ist die Sitzung
beendet -> arbeitskopie-kopf steht noch`. **Gemessen statt vermutet** (Produktcode nachweislich
unveraendert, `git diff -- src/` leer):

| Stand | Laeufe | Ergebnis |
|---|---|---|
| vor der Korrektur | 3 | **2 rot, 1 gruen** |
| nach der Korrektur | 3 | **3 gruen** |

**Ursache:** Der Schritt las den DOM **einmal** direkt nach dem Store-Schreiben – der Bestand war
aktualisiert, React hatte noch nicht gerendert. **Korrektur in `scripts/durchlauf.mjs`:** auf das
Verschwinden des `arbeitskopie-kopf` wird jetzt mit **5 s Frist** gewartet (dieselbe Bauform wie
die 15-s-Fristen daneben). Das ist eine Messkorrektur; die Zusage „die Sitzung ist nach dem
Uebernehmen zu" gilt unveraendert und wird weiter geprueft.

### Entfernt (6 Tests, 3 ergaenzt – netto −3)

- **1** in `marken-vorschau` (kein zweiter Zeichenpfad, kein `await`),
  **1** in `medium-loeschen-anzeige` (kein `rufeAuf`/`KANAELE`/`querySelector`),
  **2** in `segment-anzeige` (Verbotsliste; `segment-quelle` ohne jsx/react),
  **1** in `render-dialog-anzeige` (kein `confirm`/`window.`/Eigenpruefung),
  **1** in `speicherstatus-anzeige` (kein Timer/Kanal-Literal/`window.`).

**Ehrlich offen:** Diese Architekturregeln sind nach dem Entfernen **ohne Waechter** – Lint-Kandidat.

### Stand nach Charge 15

| | vorher | nachher |
|---|---|---|
| Mutationen in dieser Charge | – | **25**: 20 erkannt, 4 Luecken, 1 aequivalent |
| Refactorings | – | **0 / 5 rot** |
| Quelltext-/Meta-Tests entfernt | – | **6** |
| Verhaltens-Tests ergaenzt | – | **3** |
| Echte Luecken geschlossen | – | **4** |
| Suite | 5.490 | **5.487** (340 Dateien) |
| Gate | – | `npm run pruefung` **Exit 0**, Integration 49, Treiber 0 Befunde |
| Sperrklinke | 60 | **55** Dateien |

## 29. Charge 16 (28.10.2026): fuenf weitere Dateien

**Dateien:** `queue-panel-wurzel` (`queue-panel/leisten-montage.ts`), `marken-uebersicht`
(`marken-uebersicht.ts`), `marken-zugang` (`marken-zugang.ts`), `element-zeile`
(`element-zeile.ts`), `concat` (`concat.ts`). Alle von der Sperrklinken-Liste (#447).

**Ausgangsmessung:** 23 Verhaltens-Mutationen, 5 harmlose Refactorings. Erkannt: **21**.
Gruen: **EZ2, EZ4** (echte Luecken) und **QP3** (aequivalent). **0/5 Refactorings rot**; jede
Mutation byte-identisch zurueckgenommen.

### Die zwei Luecken (geschlossen)

- **EZ2 – die Wache gegen nicht endliche Zieh-Werte war unsichtbar.** Der Test nahm eine Lage,
  die **dem Modell entsprach** – der Rueckfall von `begrenze` sah dann genauso aus, und
  `toEqual` blieb gruen. Neu: eine BEWEGTE Lage (ende 7.7 gegen Modell 12.5) und `toBe(lage)`;
  ohne die Wache springt die Lage auf den Modellstand zurueck.
- **EZ4 – `!(spanne > 0)` deckte auch NaN, `=== 0` nicht.** Der Test kannte nur den Gleichstand.
  Neu: `obergrenze: NaN` ⇒ `anteil` liefert 0, nicht NaN.

### Als aequivalent belegt

- **QP3 – `schliesseRueckfrage` raeumt die Meldung mit ab, aber der Zustand ist unerreichbar.**
  `meldeLeistenFehler` setzt `rueckfrage: null`; `schliesseRueckfrage` wird nur aus den beiden
  Knoepfen der offenen Rueckfrage gerufen. Meldung und Rueckfrage sind nie gleichzeitig gesetzt.

### Entfernt (8 Tests, 0 ergaenzt – netto −8, zwei Tests geschaerft)

- **2** in `queue-panel-wurzel` (`leisten-montage.ts` rein; `index.tsx` holt nichts selbst).
- **2** in `marken-uebersicht` (kein verbotenes Muster; kein zweiter Parameter).
- **1** in `marken-zugang` (kein Direktimport/kein Kanal/keine editor-internen Namen).
- **2** in `element-zeile` (Verbotsliste; keine Literale 10/45/30).
- **1** in `concat` (kein Betriebsflag, kein Container-Literal).

**Ehrlich offen:** Die entfernten Architekturregeln (kein `sort`/`filter`/`slice`, keine
Direktimporte zwischen Renderer-Bereichen, kein Timer) sind **ohne Waechter** – Lint-Kandidat.
Die Rangfolge-Zusage in `concat` („kein Betriebsflag") bleibt durch die Integrationstests
gedeckt, die echtes ffmpeg fahren.

### Stand nach Charge 16

| | vorher | nachher |
|---|---|---|
| Mutationen in dieser Charge | – | **23**: 21 erkannt, 2 Luecken, 1 aequivalent |
| Refactorings | – | **0 / 5 rot** |
| Quelltext-/Meta-Tests entfernt | – | **8** |
| Verhaltens-Tests ergaenzt | – | **0** (2 geschaerft) |
| Echte Luecken geschlossen | – | **2** |
| Suite | 5.487 | **5.479** (340 Dateien) |
| Gate | – | `npm run pruefung` **Exit 0**, Integration 49, Treiber 0 Befunde |
| Sperrklinke | 55 | **50** Dateien |

## 30. Charge 17 (28.10.2026): die fuenf ffmpeg-Adapter

**Dateien:** `bandspur` (`src/main/ffmpeg-adapter/bandspur.ts`), `encoder-argumente`
(`encoder-argumente.ts`), `filter-einblendung` (`filter-einblendung.ts`), `filter-vollbild`
(`filter-vollbild.ts`), `standbild` (`standbild.ts`). Alle von der Sperrklinken-Liste (#447).

**Ausgangsmessung:** 30 Verhaltens-Mutationen, 5 harmlose Refactorings. Erkannt: **25**.
Gruen: **BA4, ST3, ST5** (echte Luecken). **0/5 Refactorings rot**; jede Mutation
byte-identisch zurueckgenommen.

**Besonderheit dieser Charge:** Drei weitere Mutationen (**EN2, EN3, EN4**) waren im ersten
Lauf nur von der Quelltext-Probe „schreibt keinen Profilwert als Literal" gefangen worden -
also von genau der Probe, die diese Charge entfernt. Nach der Entfernung waren sie gruen.
Die Charge hat deshalb **nach** dem Ausbau erneut gemessen (41 Faelle): **40 erkannt, 1
aequivalent**.

### Die Luecken (geschlossen, vier neue Verhaltens-Tests)

- **BA4 – die Bildrate von Schritt 1 war ein Literal.** `String(30)` statt `String(fps)`
  blieb bei allen 33 Tests gruen, weil jede gueltige Profil-Bildrate im Test 30 ist. Neu:
  ein Profil mit **25 fps**; `-framerate`, `-r` und `fps=25,` in der Kette muessen wandern.
  Dieselbe Zeile in Schritt 2 (**BA7**, nach dem Ausbau gemessen) faengt derselbe Test.
- **EN2/EN3/EN4 – Profil, Pixelformat und Transfer-Metadatum als Literale.** `'high'`,
  `'yuv420p'`, `'bt709'` sind fuer RENDER_PROFILE die richtigen Werte; nur ein abgewandeltes
  Profil trennt „gelesen" von „abgeschrieben". Neu: ein Profil mit `main`, `4.1`,
  `yuv422p`, `bt2020`/`smpte2084`/`bt2020nc`.
- **ST3 – `-framerate` als Literal `'30'`.** Neu: dasselbe Profil-Wandern fuer `standbild`;
  `-framerate` muss `25` sein.
- **ST5 – `-f` als Literal `'mp4'`.** `profil.container` ist `mp4`; der Unterschied zeigt
  sich erst mit `mov`. Derselbe Test.
- **Ohne Test war auch die Container-Wache** (`-`-Praefix, leerer Name, kein Text): neu ein
  Fall mit `''`, `'-mp4'` und `7`; **ST7/ST8** belegen, dass die Wache beisst.

### Als aequivalent belegt

- **EN7 – `ENCODER_JE_CODEC[profil.videoCodec]` gegen `ENCODER_JE_CODEC['h264']`.** Die
  Tabelle hat genau einen Schluessel; fuer jedes zulaessige Profil ist der Ausdruck gleich.
  Kaeme ein zweites Format hinzu, erzwingt der `Record`-Typ einen Eintrag - das faengt der
  Compiler, kein Laufzeit-Test.

### Entfernt (33 Testfaelle, 4 ergaenzt – netto −29; drei Tests gekuerzt)

- **2** in `bandspur` (kein Fremdimport; Codec/Container als benannte Konstanten) + **1**
  gekuerzt (die `QUELLE`-Zeile der Betriebsflag-Probe; die Argument-Pruefung bleibt).
- **2** in `encoder-argumente` (Profilwert-Literale; Hardware-Encoder/Stellschraube).
- **3** in `filter-einblendung` (Mass-Literale; Importliste; Fachbegriffe) + **2** gekuerzt
  (Hexfarbe in der `QUELLE`; Vierer-Rundung als `CODEZEILEN`-Verbot).
- **3** in `filter-vollbild` (Mass-Literale; Importliste; Fachbegriffe).
- **23** in `standbild` – der ganze Block „Abgrenzung": **17** generierte Flag-Proben,
  **3** Folgen (`+faststart`, `setsar`, `copy`), die Gegenprobe zur Probe und zwei
  Einzelproben. Die Zusage traegt der `toEqual` auf das vollstaendige Array.

**Ehrlich offen:** Die entfernten Architekturregeln sind **ohne Waechter** – kein Import aus
`encoder-argumente`/`tonspur` in `bandspur`, nur Typ-Importe in den Filter-Adaptern, keine
Fachbegriffe, kein Hardware-Encoder, Codec/Container als je eine Konstante. Lint-Kandidat;
die Flaggen-Verbote sind jetzt allein durch die Argument-Arrays gedeckt.

### Stand nach Charge 17

| | vorher | nachher |
|---|---|---|
| Mutationen in dieser Charge | – | **30**: 25 erkannt, 3 Luecken; Nachmessung 41: 40 erkannt, 1 aequivalent |
| Refactorings | – | **0 / 5 rot** |
| Quelltext-/Meta-Tests entfernt | – | **33** (davon 23 generiert) |
| Verhaltens-Tests ergaenzt | – | **4** (3 gekuerzt) |
| Echte Luecken geschlossen | – | **3** + 3 nach dem Ausbau sichtbare Literal-Luecken |
| Suite | 5.479 | **5.450** (340 Dateien) |
| Gate | – | `npm run pruefung` **Exit 0**, Integration 49, Treiber 0 Befunde |
| Sperrklinke | 50 | **45** Dateien |

**Treiber-Messung, transparent:** Zwischen 22:45 und 05:00 waren **vier** aufeinanderfolgende
Treiber-Laeufe rot – zweimal `detached Frame` (Schritt 4 bzw. 4f3), einmal
`Target.setDiscoverTargets`-Timeout beim Start, einmal `socket hang up` (1006). Der
Produktcode war nachweislich unveraendert (`git status` ohne `src/` und `scripts/`), ein
Direktstart der App lief und blieb stehen, ein Minimallaunch mit `dumpio` verband in
**711 ms**. Ohne jede Codeaenderung war der naechste Lauf **Exit 0, 0 Befunde**. Die
Ursache ist **nicht benannt**; die Messung fiel in eine Phase hoher Systemlast (Docker-VM
~100 %, Load 2,4–5,5). Kein Produktbefund – aber ein Kandidat fuer die Treiber-Haertung
(`dumpio`, Frist, ein Wiederholversuch), dieselbe Klasse wie FA-13.

## 31. Charge 18 (29.10.2026): Tonspur und Media-Service

**Dateien:** `tonspur` (`src/main/ffmpeg-adapter/tonspur.ts`), `media-protokoll-schema`
(`src/main/media-protokoll.ts`), `dialog` (`src/main/media-service/dialog.ts`),
`handler-registrierung` (`handler-registrierung.ts`), `import-medium`
(`import-medium.ts`). Alle von der Sperrklinken-Liste (#447).

**Ausgangsmessung:** 29 Verhaltens-Mutationen, 5 harmlose Refactorings. Erkannt: **27**.
Gruen: **MP5** (aequivalent) und **IM8** (echte Luecke). **0/5 Refactorings rot**; jede
Mutation byte-identisch zurueckgenommen.

### Die Luecke (geschlossen, ein neuer Verhaltens-Test)

- **IM8 – `String(error)` blieb gruen.** `textVon` liefert die Meldung, `String(err)`
  liefert `"Error: <meldung>"`. Beide erfuellen „enthaelt den Text" und „kein Stacktrace"
  – der Praefix war unsichtbar. Neu: die Meldung ist **exakt** geprueft.

### Als aequivalent belegt

- **MP5 – `scheme: SCHEMA` gegen `scheme: "media"`.** `SCHEMA` IST `"media"`; die
  Indirektion ist eine Lesbarkeitsfrage, kein Verhalten.
- **TO7 (Nachmessung) – `AUDIO_ENCODER_JE_CODEC[profil.audio.codec]` gegen `['aac']`.**
  Die Tabelle hat genau einen Schluessel. Ein zweites Tonformat erzwingt der
  `Record`-Typ, nicht ein Laufzeit-Test.

### Nach dem Ausbau nachgemessen (37 Faelle)

Erkannt **28 von 32**; neu gruen sind nur noch:

- **DI7 – `extensions: ['mp4']` statt `[...FORMAT_WHITELIST.video]`.** Heute identisch.
  Die Zusage „eine Quelle" tragen die **abgeleiteten** Filter-Tests: Waechst die Whitelist,
  werden sie rot. Ein Verbot im Quelltext gibt es dafuer nicht mehr – ehrlich offen.
- **MP6 – ein zweiter `protocol.`-Griff.** Ohne Electron nicht beobachtbar; die
  „genau einmal"-Zusage ist Architektur, kein Verhalten. Lint-Kandidat.
- Dazu unveraendert **MP5** und **TO7** (aequivalent, s. o.).

### Besonderheit: `media-protokoll-schema` bleibt als Test

Der **Werte**-Test (scheme + genau fuenf Privilegien, seit #364) ist kein Quelltext-Test
und **bleibt stehen**. Entfernt wurden nur die drei Grep-Teile (obsoleter Funktionsname,
`registerSchemesAsPrivileged`, `path.join`/`node:fs`/`protocol.`-Zaehlung). Die Datei
verlaesst die Sperrklinke, weil sie nichts mehr liest.

### Entfernt (34 Testfaelle, 1 ergaenzt – netto −33; ein Test gekuerzt)

- **3** in `tonspur` (Quellton-, Flag- und Literal-Probe).
- **1** in `media-protokoll-schema` (obsoleter Funktionsname) + **1** gekuerzt (die
  Registrierungs-Probe behaelt `typeof`).
- **12** in `dialog` (5 generierte Endungs-Proben, `ipcMain`, 6 generierte Verbote).
- **8** in `handler-registrierung` (5 generierte Syntax-Verbote, render/export,
  fs/ipc, Selbstverdrahtung); der `void`-Test bleibt.
- **10** in `import-medium` (5 Modul-Importe, 3 Pfad-Literale, `new Date`-Zahl,
  Lock/Flush).

**Ehrlich offen:** Die entfernten Architekturregeln sind **ohne Waechter** – Pfadfreiheit
des Protokolls, kein `fs`/IPC im Dialog und im Handler-Paket, „keine
Uebersetzungsschicht" (nur mittelbar ueber die Identitaets-Probe), `new Date` genau
einmal, kein eigenes Lock/Flush im Import. Lint-Kandidat; #448 steht.

### Stand nach Charge 18

| | vorher | nachher |
|---|---|---|
| Mutationen in dieser Charge | – | **29**: 27 erkannt, 1 Luecke, 1 aequivalent; Nachmessung 37: 28/32, 2 aequivalent, 2 offen |
| Refactorings | – | **0 / 5 rot** |
| Quelltext-/Meta-Tests entfernt | – | **34** (davon 16 generiert) |
| Verhaltens-Tests ergaenzt | – | **1** (1 gekuerzt) |
| Echte Luecken geschlossen | – | **1** |
| Suite | 5.450 | **5.417** (340 Dateien) |
| Gate | – | `npm run pruefung` **Exit 0**, Integration 49, Treiber 0 Befunde |
| Sperrklinke | 45 | **40** Dateien |

## 32. Charge 19 (29.10.2026): Handler-Anmeldungen und Verdrahtung

**Dateien:** `loesche-medium` (`src/main/media-service/loesche-medium.ts`),
`export-handler-anmeldung` (`export-service/handler-anmeldung.ts`), `ziel-dialog`
(`export-service/ziel-dialog.ts`), `export-verdrahtung`
(`ipc-gateway/export-verdrahtung.ts`), `render-handler-anmeldung`
(`render-service/handler-anmeldung.ts`). Alle von der Sperrklinken-Liste (#447).

**Ausgangsmessung:** 27 Verhaltens-Mutationen, 5 harmlose Refactorings. Erkannt: **27**.
**0/5 Refactorings rot**; jede Mutation byte-identisch zurueckgenommen.

Bemerkenswert war schon hier **EV6**: `registriereHandler(KANAELE…)` gegen
`registriereHandler('export:wähleExportZiel', …)` wurde **allein von der Quelltextprobe**
gefangen. Das Verhalten sieht denselben Wert und schweigt.

### Nach dem Ausbau nachgemessen (32 Faelle)

Erkannt **26 von 27**; neu gruen ist nur:

- **EV6 – Kanalname als Literal.** **Aequivalent**, nicht Luecke: Der Wert ist derselbe,
  die Verdrahtung also identisch. Die **Form** („kein Literal, immer die Registry") ist
  danach ungedeckt; den **Wert** traegt weiter ein Verhaltens-Test.

**Gegenprobe EV8** (Literal mit **falschem** Wert, `export:waehleExportZiel`): rot,
**11 Tests**, darunter „meldet GENAU EINEN Kanal an, und zwar den aus der Registry".
Damit ist belegt, dass nach dem Ausbau ein Tippfehler auffaellt und nur die
Schreibweise ungeschuetzt ist.

### Was die Verhaltens-Tests je Datei tragen (Auszug)

- **LM** – 5/5 rot. Die Reihenfolge (`reihenfolge`), der Dateiname aus Schritt 1
  (`pfadArgumente`), das Vormerken des **Dateinamens** statt des absoluten Pfads
  (`merkeArgumente`), `daten`-Durchreichung (`referenzenIds`) und die leere ID
  (`reihenfolge` bleibt leer) sind zeichengenau geprueft.
- **EH** – 5/5 rot, auch die **Doppelanmeldung** (`toHaveLength(1)`) und der IPC-Kanal
  (Zaehlwert vor `beforeEach`, nicht der lebende Spion). Die dritte Stelle
  (Abbrecher) faengt zusaetzlich `kannAbbrechen('export') === false`.
- **ZD** – 6/6 rot: `openFile` statt `openDirectory`, der Abbruch als `''` statt `null`,
  das **letzte** statt des ersten Pfads, ein immer gesetztes `defaultPath`, ein falscher
  Titel, ein fremder Fehlercode.
- **EV** – 5/5 rot: falscher Kanal, Funktion ohne Wrapper (Nutzlast als Argument), fehlender
  `isDestroyed`-Waechter, fehlendes `try/catch`, `close` statt `closed`.
- **RH** – 5/5 rot: `cancelRender` durch `renderReel` ersetzt, Argumente vertauscht,
  Wrapper-Lambda, **direkter Dispatcher-Eintrag** (`registriereAuftragsHandler('render', …)`:
  8 Tests rot, weil `kannAbbrechen('render')` faellt), Doppelanmeldung.

### Entfernt (35 Testfaelle, 0 ergaenzt, 0 gekuerzt)

- **8** in `loesche-medium` (4 Modul-Importe, 3 Pfad-Literale, Lock/Flush).
- **8** in `export-handler-anmeldung` (5 Syntax-Verbote, Fremdarten, `fs`/IPC/D1,
  Selbstverdrahtung).
- **10** in `ziel-dialog` (`node:fs`, `existsSync`, `statfs`, `setzeExportZiel`,
  `schreibeConfig`, `reiheEin`, `BrowserWindow`, `ipcMain`, `loeseAusgabePfad`, `homedir`).
- **1** in `export-verdrahtung` (Kanal-Literal) – der Registry-Block bleibt, er prueft
  `kanaele.ts`-Werte, nicht diese Datei.
- **8** in `render-handler-anmeldung` (5 Syntax-Verbote, Dispatcher/Fremdarten, `fs`/IPC/D1,
  Selbstverdrahtung).

**Ehrlich offen:** Ohne Waechter sind jetzt das `try/catch`-Verbot in beiden Anmeldungen,
`whenReady`-Anhaenge, Lock/Flush in `loesche-medium`, und in `ziel-dialog`
`existsSync`/`homedir`/`loeseAusgabePfad`/`BrowserWindow`/`ipcMain`. Gedeckt bleiben:
`setzeExportZiel` (Spion), `node:fs/promises` samt `statfs` (Spies), der Selbstaufruf beim
Import (`registriert beim blossen Import nichts`), die Identitaet der Fachfunktionen und
deren unveraenderte Durchreichung. Lint-Kandidat; #448 steht.

### Stand nach Charge 19

| | vorher | nachher |
|---|---|---|
| Mutationen in dieser Charge | – | **27**: 27 erkannt; Nachmessung 32: 26/27, 1 aequivalent |
| Refactorings | – | **0 / 5 rot** |
| Quelltext-/Meta-Tests entfernt | – | **35** |
| Verhaltens-Tests ergaenzt | – | **0** |
| Echte Luecken geschlossen | – | **0** (EV6 aequivalent, mit Gegenprobe EV8 belegt) |
| Suite | 5.417 | **5.382** (340 Dateien) |
| Gate | – | `npm run pruefung` **Exit 0**, Integration 49, Treiber 0 Befunde |
| Sperrklinke | 40 | **35** Dateien |

## 33. Charge 20 (29.10.2026): Pfad-Autoritaeten und Store-Listen

**Dateien:** `marken-store-pfade` (`src/main/marken-store/pfade.ts`), `ausgaben`
(`project-store/ausgaben.ts`), `liste-projekte` (`project-store/liste-projekte.ts`),
`oeffne-projektordner` (`project-store/oeffne-projektordner.ts`), `pfade`
(`project-store/pfade.ts`). Alle von der Sperrklinken-Liste (#447).

**Ausgangsmessung:** 31 Verhaltens-Mutationen, 5 harmlose Refactorings. Erkannt: **28**.
**0/5 Refactorings rot**; jede Mutation byte-identisch zurueckgenommen.

### Die Luecke (geschlossen, ein neuer Verhaltens-Test)

- **A6 – der Zweig `unlesbar` in `listeAusgaben` war ungetestet.** Eine Datei, die DA ist
  und deren `stat` mit EACCES/EIO scheitert, muss `speicher_fehler` ergeben (sonst zeigt
  die Oberflaeche neun von zehn Dateien und meldet Erfolg). Ersetzte man den `return`
  durch `continue`, blieb die Suite gruen. Neu: `stat` scheitert fuer **eine** Datei mit
  EACCES -> `speicher_fehler`, Meldung nennt den Ordner. Danach ist A6 rot.

### Als aequivalent belegt

- **M2 – `liegtInnerhalb` durch `kandidat.startsWith(ordner)` ersetzt.** Bleibt gruen: Der
  Kandidat wird IMMER aus genau diesem Ordner gebaut (`path.join(ordner, dateiname)`), ein
  Namens-Ausbruch scheitert vorher an `istUnbedenklichesSegment`. Die zweite Schranke ist
  mit gueltiger Eingabe nicht erreichbar – genau wie der Dateikommentar sagt. **Ehrlich:**
  Der Test „trennt 'a' und 'ab' an der Grenze" prueft die **Ausgaben**, nicht diese
  Funktion; er faellt bei einem naiven `startsWith` in der Quelle nicht um.
- **A1 – `eintrag.isFile()` aus dem Filter entfernt.** Bleibt gruen, weil `beschreibe`
  anschliessend `stat.isFile()` prueft und den Ordner `ordner.mp4` als „verschwunden"
  verwirft. Zweite Schranke, gleiches Muster wie M2.
- **L8 – `medienOrdner(ordnername)` durch `path.join(projektOrdner(ordnername), 'media')`
  ersetzt.** War in der Ausgangsmessung rot – **nur** ueber die positive Probe
  `toContain('medienOrdner(')`. Nach dem Ausbau gruen: derselbe Wert. Die Zusage
  „eine Pfad-Autoritaet" ist damit **unbewacht** (Lint-Kandidat).

### Zwei Befunde am Messaufbau selbst

- **P7 war zunaechst falsch gebaut.** Die `fs`-Mutation lag in `projekteOrdner()` – einer
  Funktion, die der Spy-Test gar nicht aufrief. Grün war also ein Messfehler, kein Befund.
  Korrigiert als **P7b/P7c**: eine benutzte `fs`-Funktion in `medienOrdner` bzw.
  `projekteOrdner` ist **rot** (Spy).
- **Dabei aufgefallen:** `projekteOrdner()` fehlte in der Aufrufliste des Spy-Tests.
  Nachgetragen (eine Zeile, kein neuer Test) und mit P7c belegt.
- **Die fs-Probe trug nur den ungenutzten Import.** Ein *benutzter* `fs`-Zugriff wird vom
  Spy gefangen; ein *ungenutzter* Import von `npx eslint` (`no-unused-vars`, geprueft).
  Damit ist die Zusage „kein `fs` in der Pfad-Autoritaet" weiter gedeckt – ohne Quelltextprobe.

### Entfernt (26 Testfaelle, 1 ergaenzt, 0 gekuerzt)

- **1** in `pfade` (kein fs-Modul), **1** in `marken-store-pfade` (dito).
- **5** in `ausgaben` (4 Verbote + „Fehlercode importiert statt deklariert").
- **11** in `oeffne-projektordner` (`mkdir`, `writeFile`, `readFile`, `path.join`,
  `child_process`, `mitD1Lock`, `BrowserWindow`, `webContents`, `showItemInFolder`,
  `openExternal`, `'projects'`).
- **8** in `liste-projekte` (2 Pfad-Literale, 5 Schreib-Verbote, 1 positive Autoritaets-Probe).

**Ehrlich offen:** „eine Pfad-Autoritaet" ist nach L8 unbewacht; ebenso in
`oeffne-projektordner` die Verbote `path.join`/`BrowserWindow`/`webContents`/
`showItemInFolder`/`openExternal` (der Verhaltens-Test deckt Aufruf und Pfad-Durchreichung,
nicht die Abwesenheit dieser Aufrufe). Lint-Kandidaten: `no-restricted-imports`/`no-restricted-syntax`
je Datei, wie in Charge 18/19 notiert. #448 steht.

### Stand nach Charge 20

| | vorher | nachher |
|---|---|---|
| Mutationen in dieser Charge | – | **31**: 28 erkannt, 1 Luecke, 3 aequivalent |
| Refactorings | – | **0 / 5 rot** |
| Quelltext-/Meta-Tests entfernt | – | **26** |
| Verhaltens-Tests ergaenzt | – | **1** (+1 Aufruf im fs-Spy) |
| Echte Luecken geschlossen | – | **1** (A6) |
| Suite | 5.382 | **5.357** (340 Dateien) |
| Gate | – | `npm run pruefung` **Exit 0**, Integration 49, Treiber 0 Befunde |
| Sperrklinke | 35 | **30** Dateien |
