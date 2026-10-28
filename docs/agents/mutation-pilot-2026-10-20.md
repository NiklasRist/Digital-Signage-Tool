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
