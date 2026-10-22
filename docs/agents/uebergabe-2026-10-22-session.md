# Uebergabe - Session 22.10.2026: FA-24 am echten Fenster, zwei Befunde, Treiber-Flakiness

> Fuer die naechste Sitzung: Lies zuerst `CLAUDE.md` (STAND HEUTE), dann diese Datei.
> Vorgaenger: `docs/agents/uebergabe-2026-10-21-session.md`.

## Worum es ging

Die letzte Luecke der Treiber-Matrix: **FA-24** (Marken-Editor). Der Auftrag war messen,
nicht neu bauen - der Editor und seine Bausteine stehen seit der M8-Reihe. Branch:
`bau/treiber-fa24` (4m) und `bau/treiber-fa24-rest` (4m2).

Ergebnis: **FA-24 ist gemessen** (anlegen, bearbeiten, ableiten, Import, Kontrastwarnung) und
hat **zwei echte Produktbefunde** geliefert, beide behoben und gegengeprobt. Die Matrix hat
**keine Luecke** mehr. Ein weiterer Widerspruch (Logo-Entfernen) ist als Entscheidung
dokumentiert, nicht eigenmaechtig geaendert.

---

## 1. Neuer Treiber-Schritt 4m

**Datei:** `scripts/durchlauf.mjs`; Matrix: `docs/agents/treiber-matrix.md`.

Der Schritt misst am echten Fenster:

1. Eine Marke ueber die Oberflaeche **anlegen** (Namensfeld + "Neue Marke") und **oeffnen**.
2. Die **Akzentfarbe** frei auf `#808080` setzen: der Wert landet im Bestand V2
   (`marken:listeMarken` -> `#808080`), die **Kontrast-Warnung** erscheint mit Zahl
   ("4.13:1 ... mindestens 4.50:1"), das Feld bleibt bedienbar, kein Dialog.
3. Auf die eingebaute Marke wechseln (`#FF4040`, 4,71:1): Warnung weg, **Felder zeigen
   den Wert der neuen Marke**.
4. Eine Marke **ableiten**: Kind im Bestand, Kennzeichnung `abgeleitet`, 20 Herkunftszeilen
   ("Geerbt von ...").
5. Aufraeumen im Schritt selbst (Kind zuerst, dann die Basis).

**Bewusst NICHT gemessen:** die **Live-Vorschau** (rechte Spalte). Sie ist gebaut
(`live-vorschau.ts`, #303) aber nicht montiert; #330 fuehrt die Props-Frage als
"NICHT selbst entscheiden" (Vorlage, `ZeichenZugang`, Schriften/Logo). Die Vorschau ist eine
Zusage aus TK 9.14.1/9.15.2, nicht aus dem FA-24-Satz; FA-24 selbst ist mit 4m/4m2 gemessen
(Einzelheiten: Matrix, B11).

**Drei Korrekturen am Messweg** (kein App-Fehler, im Treiber behoben):

- 4a0 zaehlte `[data-testid="marken-liste"] button` und damit auch "Neue Marke"/"Ableiten"
  als Marken (Log sagte 3/4, real 1/2). Jetzt `> div > div > button`.
- Das Namensfeld ist kontrolliert und behaelt seinen Text; getippte Zeichen wurden in zwei
  Laeufen verschluckt (`DurchlaufMarke-17DurchlaufMarke-FA24-...`). Der Wert wird jetzt ueber
  den nativen Setter + `input`-Ereignis gesetzt - derselbe `onChange`-Pfad, ohne Tastenrennen.
- Das Schritt-5-Aufraeumen loescht **abgeleitete Marken zuerst**; sonst bleibt die Basis als
  gesperrte Leiche liegen, wenn ein Lauf vorher abbricht.

---

## 1b. Schritt 4m2 - der Rest von FA-24

**Datei:** `scripts/durchlauf.mjs`.

Gemessen am echten Fenster (eigene Messmarke, danach geloescht):

- **Alle dreizehn Farbrollen** ueber die Oberflaeche geschrieben, je ein eigener Wert,
  **13/13 im Bestand**.
- **Slogan** (Text + Schalter) ueber "Slogan uebernehmen" -> Bestand
  `{"text":"Saisonstart 2026","aktiv":true}`.
- **Sicherheitsabstand** 80/40 ueber "Abstand uebernehmen" -> Bestand; danach 120 gesetzt
  (nicht gespeichert) -> **Wachsens-Hinweis** erscheint und nennt den neuen Wert.
- **Abgeleitete Marke bearbeiten:** Akzent am Kind gesetzt -> Bestand `herkunftJeFeld.farben.akzent
  = eigen`, Anzeige "Eigener Wert dieser Marke." + "Vererbung wiederherstellen"; Klick ->
  `geerbt`, Anzeige "Geerbt von ...".
- **Import-Pipeline** (Schrift `Arimo-Regular.woff2` und Logo `logo.png` ueber den echten Kanal
  `marken:importiereMarkenDatei`, weil der native Dialog nicht steuerbar ist): Store
  `fliesstext.herkunft = importiert`, `logo.herkunft = importiert`, die Anzeige folgt
  ("(importiert)", Logo-Weg vorhanden).
- **Logo entfernen** ueber den echten Knopf: siehe B12 (Widerspruch, Entscheidung offen).

**MANUELL bleibt** der Klick auf "Eigene Schrift/Logo waehlen" bis zum nativen Dialog - wie
FA-09/Export. Die Pipeline danach ist gemessen.

---

## 2. ZWEI ECHTE PRODUKTBEFUNDE - gemessen, behoben, gegengeprobt

### B9 - Der Editor zeigte den Stand des ERSTEN Aufbaus

- **Symptom:** Marke mit 96/54 px geoeffnet, im Abstands-Feld stand **0/0**.
- **Ursache:** `slogan` und `sicherheit` sind Momentaufnahmen im Zustand der Wurzel und wurden
  beim Wechsel der geoeffneten Marke nicht nachgezogen. Klick auf "Abstand uebernehmen" haette
  den Sicherheitsabstand (TK 9.11.4) still auf 0/0 gesetzt.
- **Fix:** Der Abo-Hoerer auf die geoeffnete Marke zieht beide Werte nach und verwirft den
  alten Abstands-Hinweis.
- **Gegenprobe:** Nachziehen entfernt -> **Test rot** (`expected '0' to be '96'`); Ruecknahme
  byte-identisch (Pruefsumme `8fbcda44086581856916acf916191a3d334f441f847ca093ba33186299c123e6`).

### B10 - Nach dem Markenwechsel stand der alte Farbwert im Feld

- **Symptom:** Marke A auf `#808080` bearbeitet, dann Marke B (`#FF4040`) geoeffnet - das
  Akzentfeld zeigte weiter `#808080`. Der naechste `onBlur` haette den alten Wert in B
  geschrieben.
- **Ursache:** Farbfelder sind unkontrolliert (`defaultValue`); React benutzt dasselbe
  DOM-Element weiter, und ein einmal bearbeitetes Feld folgt einem neuen `defaultValue` nicht.
- **Fix:** `marken-offen` traegt `key=<markeId>` und wird beim Wechsel neu aufgebaut.
- **Gegenprobe:** `key` entfernt -> **Test rot** (`expected '#123456' to be '#FF4040'`);
  Ruecknahme byte-identisch (dieselbe Pruefsumme, Datei unveraendert).

### B12 - Logo entfernen lieferte das gebündelte Fremdlogo (behoben am 22.10.2026, #440)

- **Symptom:** Importiertes Logo (`herkunft: importiert`) auf einer eigenstaendigen Marke,
  dann "Logo entfernen" -> im Bestand stand das **gebuendelte Logo der eingebauten Marke**
  (`logo-fitnessworld24.png`), nicht `logo: null` (Ersatz-Logo).
- **Bewertung:** #298 liess **beide** Ausgaenge zu; der Code war issue-konform. Aber
  `HINWEIS_LOGO_ENTFERNT` verspricht den Markennamen, und `erstelle-marke.ts` kopiert das
  fremde Logo bewusst nicht mit, damit der Ersatz-Logo-Pfad (#293) erreichbar bleibt.
- **Entschieden (Auftraggeber, 22.10.2026):** eigenstaendige Marke -> **`null`**
  (Ersatz-Logo). Eingebaute Marke -> gebuendelter Wert; Schriften -> gebuendelter Rueckfall
  (Pflichtfeld je Rolle).
- **Gebaut:** `dateien.ts` Schritt 5 verzweigt jetzt `eintrag.eingebaut ? quelle.logo : null`.
  Zwei Verhaltensproben in `marken-dateien.spec.ts`. Gegenprobe: alte Zeile -> **Test rot**
  (`expected {…} to be null`), Ruecknahme byte-identisch (`b5305feb…dc13e`).
  Treiber 4m2: `Nach Logo entfernen: null` -> GEMESSEN. Gate: **5.609 Unit-Tests**, Exit 0.

### B13 - `löscheMarke` raeumt `marken-assets/<markeId>/` nicht auf (behoben am 22.10.2026, #441)

Beim Aufraeumen von 4m2: Drei Laeufe importierten je eine Schrift und loeschten die Marke;
danach lagen drei verwaiste `marken-assets/<id>/fliesstext.woff2` im Datenort, deren
Kennungen nicht mehr in `marken.json` standen (geprueft). `loesche-marke.ts` hatte keinen
Datei-Zugriff; TK 9.15.3 sagt „die Kopie gehoert der Marke".

- **Gebaut:** `löscheMarke` loescht nach dem erfolgreichen Bestands-Schreiben den Ordner
  rekursiv (best effort, `force`). Reihenfolge bewusst **erst Bestand, dann Dateien**: ein
  Dateifehler macht das Loeschen nicht rueckgaengig und erscheint nicht als Fehler. Eine
  Pfad-Schranke haelt den rekursiven Loeschpfad innerhalb von `marken-assets/`.
- **Belege:** drei Verhaltensproben in `loesche-marke.spec.ts`; Gegenprobe (Aufraeumblock
  entfernt) -> **2 Tests rot**, Ruecknahme byte-identisch (`e6ed1934…d5d62b`).
  Treiber 4m2: `marken-assets-Ordner nach dem Loeschen: false` -> GEMESSEN. Gate: **5.609
  Unit-Tests**, Exit 0. Der Treiber-Workaround (Dateien vor dem Loeschen entfernen) ist weg.

---

## 3. Treiber-Flakiness beendet (eigener Commit)

Drei Laeufe am 22.10.2026 starben an **verschiedenen** Stellen mit
"Requesting main frame too early", "Attempted to use detached Frame" oder einem stummen
Haenger. Ursache: `scripts/durchlauf.mjs` startete Electron **zweimal** - per `spawn` und per
`puppeteer.launch` mit demselben App-Pfad. Die Einzelinstanz (`instanz.lock`) liess genau einen
gewinnen; verlor der gesteuerte Prozess, starb mitten im Lauf der Frame.

**Behoben:** Puppeteer besitzt den Prozess allein; das `kill()` im `finally` entfaellt. Neu
sind Hoerer fuer `page.on('error')` (Fenster-Crash) und `close`, damit ein solcher Fall im Log
steht statt still zu haengen. **Beleg:** `npm run durchlauf` danach **Exit 0**.

---

## 3b. Gate-Blindstelle B5 geschlossen

`scripts/durchlauf.mjs` wertet jedes **eindeutige** `console.error` aus dem Fenster als
**Befund** ("Fenster-Konsole"); die Gate-Regel (Befund -> Exit 2) greift damit auch fuer
React-Meldungen. `console.warn` bleibt Log-Hinweis, Doppelmeldungen zaehlen einmal.

**Gegenprobe mit Beleg:** `console.error("SEMPEL-B5 …")` voruebergehend in
`src/renderer/main.tsx` -> Lauf **Exit 2** mit
`[Befund] Fenster-Konsole :: kein console.error im Fenster -> SEMPEL-B5 …`; Zeile entfernt,
Ruecknahme **byte-identisch** (`a4adeb90…c928cff1c`), Lauf wieder Exit 0. Der normale
Bestand hat **keine** `console.error`-Meldung (geprueft in den gruenen Laeufen).

## 4. Belege

- **Gate:** `npm run pruefung` **Exit 0** - **5.609 Unit-Tests (333 Dateien)**,
  **49 Integrationstests (12 Dateien)**, Typecheck/Lint 0; Treiber ohne Befund **und ohne
  Untersuchung**.
- **Treiber 4m/4m2:** `GEMESSEN`-Zeilen im Lauf; Protokoll in `docs/agents/oberflaeche-durchlauf.md`.
- **Matrix:** FA-24 von `Luecke` auf **`gemessen`**; Zaehlung **6 gemessen, 15 teilweise,
  0 Luecke, 3 manuell** (Muss: 4 von 15 gemessen). Waechter `tests/unit/treiber-matrix.spec.ts` gruen.
- **Nicht** gepusht; `main` bleibt hinter dem lokalen Stand.

## 5. Ehrlich offen

1. **Live-Vorschau des Marken-Editors** (B11): braucht eine Entscheidung zu den Props
   (`VorlagenZugang`? `ZeichenZugang`? eigenes `stelleMarkeBereit`?) - #303/#330.
2. **MANUELL:** der native Dateidialog beim Logo-/Schrift-Import (wie FA-09/Export).
3. **#433** optische Abnahme beim User.
4. **Mutations-Chargen** 138/92 Dateien offen.

## 6. Regeln, die diese Session bestaetigt hat

- **Ein Feld, das eine Auswahl-Momentaufnahme ist, gehoert nicht in den Zustand ohne Ruecksetzen.**
  B8 (Loeschvorschau), B9 (Slogan/Abstand) und B10 (Farbfelder) sind dieselbe Klasse - und alle
  drei fielen erst am echten Fenster auf.
- **Unkontrollierte Felder (`defaultValue`) sind ein Wechsel-Risiko.** Sobald die Auswahl
  wechselt, braucht der Bereich einen `key` oder einen kontrollierten Wert.
- **Ein Messweg, der Zeichen tippt, muss deterministisch sein.** Der native Setter + `input`
  ist derselbe `onChange`-Pfad ohne Tastenrennen; ein verschluckter Buchstabe ist ein
  Messfehler, kein Befund.
- **Zwei Prozesse fuer eine Einzelinstanz sind ein Muenzwurf.** Der Treiber startet jetzt EINEN.
