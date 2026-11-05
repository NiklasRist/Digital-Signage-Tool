# Übergabe 05.11.2026 — „Ergebnis zuerst" im Aktions-Editor (einundfünfzigste Sitzung)

**Auftrag (Niklas, 05.11.2026):** *„es ist unklar was möglich ist […] man hat zu wenig einfluss
[…] es ist ein fertiges formular für eine langweilige powerpoint folie statt eine beeindruckende
wirksame werbung."* Darauf „ja" zu Schritt 1: **man sieht, was möglich ist** — Beispielinhalt,
Titel bei den Inhaltsfeldern, kein Auto-Platzieren.

## Was gebaut ist

### 1. Beispielinhalt in der Vorschau (`action-editor/beispiel-inhalt.ts`, neu, rein)

- Leere Felder (Titel, Beschreibung, Preis, Knopf) werden **für die Vorschau** mit einem Beispiel
  gefüllt: „Dein Training. Dein Tempo.", „Alle Kurse, Geräte und Studios inklusive.",
  „ab 29 €/Monat", „Jetzt starten".
- Im Modus **„neu"** kommt das **erste nutzbare Bild des Projekts** als Beispielmotiv dazu. Ein
  bewusst gewähltes „– kein Bild –" nimmt es wieder heraus (`keinBeispielBild` in der Wurzel).
- **Der Entwurf bleibt unberührt** — das Beispiel wird nie gespeichert. Der Test prüft beides:
  die Vorschau trägt den Beispieltext, das Titelfeld bleibt leer.
- Über dem Canvas steht: „Beispiel – leere Felder sind mit Beispielinhalt gefüllt." Im Bild-Schritt
  sagt eine Zeile, welches Projektbild als Beispiel dient.

### 2. Vorlagen-Kacheln zeigen ein Ergebnis

`VorlagenWahl` bekommt den **beispielgefüllten** Entwurf; jede Kachel zeichnet damit ein fertiges
Layout statt einer leeren Fläche. Die Bilder entstehen weiterhin **einmal beim Öffnen**.

### 3. Titel bei den Inhaltsfeldern

Der Titel steht jetzt als **erstes Feld in „Inhalt"** (Kopfleiste trägt nur Rückweg und Abschluss).
Die fünf Schritte tragen **keine Nummern** mehr — sie liessen die Fläche wie ein Formular aussehen.
Die Felder haben Beispiel-Platzhalter.

### 4. „Fertig & ins Video" ist ENTFALLEN

- Der zweite Abschluss und `gemeinsam/aktion-ins-video.ts` (Auftragsspeicher) sind gelöscht; der
  Composer hört nicht mehr zu. Der Editor **legt nur an**; platziert wird per Drag oder „Ins Video".
- **Treiber `4g9` neu geschrieben:** `{"zweiterKnopf":false,"aktion":true,"aktionen":"2 -> 3",
  "unterbrechungen":"0 -> 0","ansichtZu":true,"dauerMs":4044}` — der Knopf fehlt, „Anlegen"
  schreibt die Aktion und erzeugt **keine** Unterbrechung.
- **TK v3.46, 9.8.7 (neu):** „Ergebnis zuerst"; die Auftrags-Beschreibung in 9.8.1/9.8.6 ist mit
  Nachtrag als abgelöst markiert. `.docx` im selben Zug neu erzeugt (2235 Absätze, `unzip -t`,
  0 Backticks).

## Belege

- **Fenster (Probe, 1440 × 900):**
  `{"beispielHinweis":"Beispiel – leere Felder sind mit Beispielinhalt gefüllt.",
  "titelImFormular":true,"titelImKopf":false,"insVideoKnopf":false,
  "bildBeispiel":"Die Vorschau zeigt als Beispiel „test-image.jpeg\" – wähle eines, um es zu übernehmen.",
  "vorlagenBilder":2,"canvas":{"x":129,"y":228,"w":950,"h":534},"buehne":{"x":128,"y":109,"w":952,"h":749}}`
- **Tests:** neu `tests/unit/beispiel-inhalt.spec.ts` (6 Fälle), 4 neue Fälle in
  `action-editor-neue-aktion.spec.ts` (Titel im Formular, kein „Fertig & ins Video", Beispielbild,
  „– kein Bild –"), die Vorschau- und Kachel-Prüfung geschärft.
- **Gegenproben (jede rot, danach byte-identisch zurückgenommen, Prüfsumme `3c1736c1…`):**
  1. Hauptvorschau ohne Beispielinhalt → Test rot.
  2. Vorlagen-Kacheln ohne Beispielinhalt → 2 Tests rot.
  3. Kein Beispielbild → Bild-Test rot.
  **Teuer bezahlt:** Die erste Fassung von Probe 1 blieb **grün**, weil der Test den **letzten**
  `zeichneVorschau`-Aufruf prüfte — das war die Vorlagen-Kachel, nicht die Bühne. Der Test prüft
  jetzt den **ersten** Aufruf nach dem Öffnen. *Eine grüne Probe ist eine Aussage über den Test,
  nicht über den Code.*
- **Treiber `4g7`:** `{"typ":"color","altesSelect":false,"markenFarben":10,"letzteFarben":true}` —
  Palette und „Zuletzt verwendet" sind am Fenster da.
- **Gate:** Typecheck 0 (auch tests), ESLint/oxlint 0, Build 0, Unit **5511/5511** (365 Dateien),
  Integration **51/51** (13), Treiber **0 Befunde** (1 Untersuchung: Mehrfachauswahl; 1 MANUELL:
  Export-Dialog).

## Nachtrag (05.11.2026): Farbauswahl

**Auftrag (Niklas):** *„warum kann man nur von dem Preis die frabe anpassen … es muss unter der
freien farbauswahl eine auswahl an farben geben und die letzten 20 verwendeten farben werden
gespeichert."*

- Unter dem freien Farbwähler steht jetzt die **Markenpalette**: alle Farbrollen der bereiten Marke,
  **doppelte Hex-Werte als ein Swatch** (13 Rollen → 10 Swatches bei Fitnessworld24). **8-stellige
  Werte** (die beiden Scrim-Rollen mit Alpha) fallen heraus — `Aktion.akzentfarbe` ist laut Vertrag
  `#RRGGBB`; ein Klick darauf würde erst beim Speichern als `kein_hex` abgelehnt.
- Darunter **„Zuletzt verwendet"**: die letzten **20** Farben, neueste zuerst, ohne Doppel
  (Groß/Klein gleich), ungültige Werte verworfen.
- Gespeichert wird **app-weit** in `config.json` unter
  `uiVoreinstellungen['action-editor.letzteFarben']` — eine UI-Voreinstellung, **kein**
  Projekt-Schreibweg. Ein Klick setzt `akzentfarbe` im Entwurf; „Markenwert" setzt sie auf `null`.
- **Fenster-Beleg (Probe):** `{"markenFarben":10,"letzteFarben":0,"farbe":"#ff4040"}` vor dem
  Klick; nach Klick auf „Akzent kräftig": `{"farbe":"#df3131","letzteFarben":1}` und in
  `config.json` `"action-editor.letzteFarben":["#DF3131"]`.
- **Tests:** `tests/unit/letzte-farben.spec.ts` (7 Fälle, reine Regeln + config-Weg) und drei
  UI-Fälle in `action-editor-neue-aktion.spec.ts` (Palette, letzte Farben, Markenwert).
- **Treiber `4g7`** misst zusätzlich `markenFarben` und den Bereich „Zuletzt verwendet"; ein
  fehlender Bereich oder weniger als 8 Swatches ist ein Befund.
- **Ehrlich offen:** Die Farbe wirkt weiterhin nur als **Akzentfarbe** — also auf die
  Akzentflächen der Vorlage (Preis-Pille, Knopf). **Pro-Zone-Farben** (Text, Fläche, Abdunkelung)
  sind nicht gebaut; das ist der nächste Kontroll-Schritt.

## Ehrlich offen

- **Schritt 2 ist NICHT gebaut:** Bildausschnitt (Zoom/Position), Textgröße/Ausrichtung und weitere
  Looks fehlen. Der Editor zeigt jetzt ein Ergebnis und ist selbsterklärender, gibt aber noch
  **nicht mehr Einfluss** als vorher.
- Das Beispielmotiv ist das **erste Bild des Projekts**. Ohne Bilder bleibt die Beispielvorschau
  textlich; sie zeigt dann kein Produkt.
- Die Beispieltexte sind Fitnessworld24-nah gewählt; sie stehen in `beispiel-inhalt.ts` und sind
  eine Zeile Arbeit, falls Niklas andere will.
- Die Kacheln zeichnen den Stand **beim Öffnen** (kein Live-Bild) — bewusst, sonst entstünde je
  Feldwechsel ein 1920×1080-Canvas pro Vorlage.

## Nächste Sitzung (Stand Sitzungsende, 05.11.2026)

**Niklas' letzter Auftrag:** *„außerdem kann man so viele andere sachen die ursprünglich
spezifiziert waren nicht machen […] es fehlen noch mehr richtig krasse vorlagen […] man hat
momentan einfach keine kontrolle."* Danach: *„mach die übergabe das ist zu viel die restliche
session."* **Davon ist NICHTS gebaut** — die Farbauswahl war der letzte Schritt.

**Vier Arbeitspakete, Reihenfolge NICHT entschieden:**

1. **Mehr Vorlagen** — 4–6 neue, deutlich unterschiedliche Ganzbild-Looks (eingebaute
   Vorlagen-Datensätze mit Zonen). Bestehende Projekte bleiben gültig; die Vorlagen sind app-weit.
2. **Pro-Zone-Farben** — Text-, Flächen-, Akzent- und Scrim-Farbe je Aktion überschreiben. Braucht
   ein neues Feld im `Aktion`-Vertrag, die Auflösung in `zeichneSegment` **vor** der Marke und eine
   UI je Rolle. Heute gibt es nur **eine** eigene Farbe (`akzentfarbe`).
3. **Textkontrolle** — Größe und Ausrichtung je Zone; ebenfalls neue Aktionsfelder (die Vorlage
   liefert heute `größeMax`/`größeMin` und die Ausrichtung fest).
4. **Bildausschnitt** — Zoom/Position im Rahmen; neues Feld plus Zeichnen.

**Warum die Akzentfarbe nur den Preis färbt:** Die Vorlage entscheidet, welche Zonen die Rolle
`akzent` benutzen; in „Ganzflächig" ist das die Preis-Pille. Text, Fläche und Knopf kommen aus der
**Marke**. Das ist das heutige Datenmodell, keine UI-Lücke — mehr geht nur über Paket 2/3.

**Empfehlung für den Start:** Paket 1 (Vorlagen) — schnellster sichtbarer Effekt; danach 2 + 3
(Kontrolle), dann 4. **Niklas hat die Reihenfolge nicht bestätigt.** Effekte bleiben geparkt.

**Nicht gepusht.** Zahl mit `git log --oneline origin/main..HEAD` zählen. **Push nur auf Anweisung.**
