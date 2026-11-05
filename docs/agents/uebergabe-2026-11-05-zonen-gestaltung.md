# Übergabe 05.11.2026 — Kontrolle statt Formular (zweiundfünfzigste Sitzung)

**Auftrag (Niklas, 05.11.2026, Sitzungsende der 51.):** *„es fehlen noch mehr richtig krasse
vorlagen"* und *„man hat momentan einfach keine kontrolle"* — dazu: *„mach bitte alles davon in der
session größtenteils selbständig"*. Umgesetzt sind **alle vier** Pakete der damals offenen Liste:

1. **Sechs neue Looks** (Ganzbild-Vorlagen),
2. **Pro-Zone-Farben** (Text und Fläche je Zone),
3. **Textgröße und Ausrichtung je Zone**,
4. **Bildausschnitt** (Zoom und Position).

Vorab entschieden (Niklas, diese Sitzung): alle **sechs** vorgeschlagenen Looks; Farbe **je Zone für
Text und Fläche** (kein eigener Scrim-Regler); Zoom und Position **für alle** Bildzonen.

## 1. Datenmodell (TK v3.48, 9.8.2 / 9.8.8)

`Aktion` bekommt **zwei optionale** Felder:

```ts
zonenGestaltung?: Record<string, ZonenGestaltung>   // Schlüssel = Zone.id
bildAusschnitt?:  BildAusschnitt | null

ZonenGestaltung { textfarbe?, flaechefarbe?, groesseProzent?, ausrichtung? }
BildAusschnitt  { zoom?, versatzX?, versatzY? }
```

**Warum optional und nicht `X | null`:** Fehlt ein Wert, gilt die **Vorlage** — genau der Zustand vor
dieser Fassung. Ein Pflichtfeld hätte jede bestehende `project.json` unlesbar gemacht bzw. eine
Migration erzwungen, die niemand angefordert hat.

**Die Regeln stehen EINMAL** in `src/shared/gestaltung.ts`: Grenzen (`GESTALTUNG_GRENZEN`),
`istHexFarbe`, `groessenFaktor`, `zoomFaktor`, `versatzProzent`, `normalisiereZonenGestaltung`,
`normalisiereBildAusschnitt`, `gleicheGestaltung`. Main, Editor und Zeichenweg lesen dieselbe Datei —
eine zweite Zahlenliste im Formular wäre beim nächsten Umbau still falsch.

## 2. Zeichenweg

- **Farbe:** `loeseFarbeInZone(marke, rolle, aktion, zone)` in `template-canvas/farben.ts` — **die
  eine** Auflösungsstelle bleibt die eine. Reihenfolge: **Zonenfarbe → Akzentfarbe der Aktion →
  Markenwert.** Die Überschreibung gilt **nur** für die Rolle, die die Zone in der Vorlage selbst
  trägt (`zone.text.farbRolle` bzw. `zone.deko.füllungFarbRolle`). Damit färbt eine Flächenwahl
  **nicht** die Schrift und umgekehrt. Es gibt **keine** Rollenliste — solche Listen waren zweimal
  still falsch.
- **Größe:** `groessenFaktor` skaliert `größeMax` **und** `größeMin` (`zonenGroessen` in
  `zone-text.ts`). Nur das Maximum zu skalieren hätte die Kaskade den Regler wieder aufheben lassen.
- **Ausrichtung:** waagerecht (`zonenAusrichtungHorizontal`); die senkrechte bleibt bei der Vorlage.
- **Bildausschnitt:** `zone-bild.ts`. **Ohne** eigene Einstellung läuft der alte Weg unverändert
  (contain: Zielrechteck, cover: Quellrechteck — die Tests prüfen die Argumentzahl 5 bzw. 9). Erst mit
  Zoom/Versatz wird das Zielrechteck größer als die Zone und **auf die Zone beschnitten**; sonst liefe
  das Bild bei „Zwei Spalten" in die Textspalte.
- **Scrim bleibt bei der Marke.** Ein Verlauf hat zwei Stopps; einen aus einem einzigen Regler zu
  raten wäre eine stille Behauptung.

## 3. Speicherweg (Main)

`erstelle-aktion.ts` und `bearbeite-aktion.ts` übernehmen beide Felder **normalisiert**
(`normalisiereZonenGestaltung` / `normalisiereBildAusschnitt`): Ein unbrauchbarer Teil fällt weg, der
heile bleibt — dieselbe Haltung wie `brauchbareDauer`. Ein **Fremdfeld** aus einer anderen Fassung
landet nicht in `project.json` (dort wird das ganze Projekt serialisiert). `zonenGestaltung` wird als
**Ganzes** ersetzt, nicht je Zone gemischt: Nur so lässt sich „bewusst gelöscht" ausdrücken.

## 4. Editor

- Neuer Schritt **„Zonen"** (`action-editor/zonen-gestaltung.tsx`): je Zone, die Text oder Fläche
  trägt, Schriftfarbe, Flächenfarbe, Größenregler (50–200 %) und drei Ausrichtungs-Knöpfe;
  „Zurücksetzen" je Zone und „Markenwert" je Farbe.
- **Bildausschnitt** (`action-editor/bild-ausschnitt.tsx`) sitzt im Schritt **„Bild"**: Zoom 100–300 %,
  Versatz seitlich/hoch-tief in Prozent, „Wie die Vorlage".
- Jede Änderung geht in den **Entwurf** (kein IPC); geschrieben wird beim Abschluss — **ein
  Undo-Schritt je Vorgang** (9.13.1). `unterschiede` vergleicht die beiden verschachtelten Felder
  **inhaltlich** (`gleicheGestaltung`); ein `!==` hätte bei jedem „Fertig" für nichts geschrieben.
- Farbwähler committen bei **`onBlur`** (ein Zieh-Vorgang feuert viele Änderungen, jede zeichnet
  1920 × 1080 neu) — dieselbe Überlegung wie beim Akzentfeld.

## 5. Sechs neue Looks (TK 9.11.1)

`riesig`, `farbband`, `zentriert`, `ecke`, `kopf-fuss`, `grosser-preis` — alle **Ganzbild**
(`höhe: null`), alle **nur** aus dem bestehenden Zonen-Modell, keine neue Zonenart. Die drei alten
Vorlagen stehen weiter **vorn** (die Vorbelegung nimmt die erste wählbare). Die neuen dekorativen
Flächen tragen Anzeigenamen in `zonen-texte.ts` (`band`, `kopf`, `fuss`).

**Zwei Rollen sind dadurch „benutzt":** `flaecheSehrDunkel` und `textSekundaer`. Ihre Sätze im
Marken-Editor sagten „wird von den eingebauten Vorlagen nicht benutzt" — das war ab jetzt falsch und
ist korrigiert. `tests/unit/rollen-texte.spec.ts` hält genau diesen Widerspruch rot; der Test hat den
Fehler gefunden, nicht ich.

## 6. Verhaltensänderung, offen benannt

**Nach einer `.bak`-Rettung wird nicht mehr geschrieben, nur weil eingebaute Vorlagen fehlen.**
Gefunden durch einen roten Test: Mit sechs neuen Looks fehlen einer älteren Sicherung regelmäßig
eingebaute Vorlagen; der Ladevorgang ergänzte sie und **überschrieb dabei die defekte Datei**, obwohl
die Rettung sie ausdrücklich liegen lassen soll (9.12.1). Im Speicher sind die neuen Vorlagen sofort
da; auf die Platte kommen sie mit dem nächsten regulären Schreibvorgang.

## 7. Belege

- **Fenster (Treiber `4g7`, 1440 × 900):**
  `{"zonenBereich":true,"zonenAnzahl":5,"textfarben":4,"flaechen":5,"groessenRegler":4,
  "ausschnitt":true,"zoomTyp":"range","vorlagenKacheln":8}` und
  `{"flaeche":true,"bild":true,"breite":1920,"hoehe":1080,"vorlage":"aktion-vorlage-vollbild",
  "vorlagenBilder":8}`.
- **Gegenproben (4, jede rot, jede byte-identisch zurückgenommen — SHA-256 vorher = nachher):**
  1. Größenfaktor übersprungen → „150 Prozent skalieren groesste UND kleinste Groesse" rot (2 Tests).
  2. Flaechenfarbe für jede Rolle → „eine Flaechenwahl faerbt NICHT die Schrift derselben Zone" rot.
  3. `unterschiede` mit `!==` auf dem Record → „gleicher Inhalt, neue Referenz" rot.
  4. Zoom-Faktor nicht angewandt → „Zoom 200 zieht das Zielrechteck auf die doppelte Groesse" rot.
- **Tests:** neu `tests/unit/gestaltung.spec.ts` (20 Fälle); dazu Fälle in `farben`, `zone-text`,
  `zone-bild`, `aktions-entwurf`, `aktion-bearbeiten`, `erstelle-aktion`, `bearbeite-aktion`,
  `eingebaute-vorlagen`, `action-editor-neue-aktion`. **+61 Tests** gegenüber der Vorsitzung.
- **Gate:** Typecheck 0 (auch tests), ESLint/oxlint 0, Build 0, Unit **5573/5573** (366 Dateien),
  Integration **51/51** (13), Treiber **0 Befunde** (1 Untersuchung: Mehrfachauswahl; 1 MANUELL:
  Export-Dialog).

## Nacharbeit derselben Sitzung (Niklas, 05.11.2026)

Vier Beschwerden, alle vier behoben (TK **v3.49**, 9.8.9):

1. **„die anordnung in der seitenleiste ist scheiße … was zusammen gehört muss zusammen gruppiert
   werden"** — Der Inspector hat jetzt **fünf** Gruppen. Die Trennung „Akzentfarbe" (global) und
   „Zonen" (je Objekt) ist **aufgelöst**: beides steht in **einer** Gruppe **„Gestaltung"** — oben
   „Alle Objekte" (Akzent), darunter **jedes Objekt** mit Schriftfarbe, Flächenfarbe, Größe und
   Ausrichtung. Die Kopfzeile sagt, wie viele Objekte eigene Werte tragen.
2. **„warum kann man nach links und rechts scrollen?"** — Die Vorlagen-Galerie ist eine
   zugeklappte Gruppe mit dem Vorlagennamen in der Kopfzeile (**offen beim Anlegen**, **zu beim
   Bearbeiten**); die Inspector-Fläche trägt `overflowX: 'hidden'`, Regler und Flex-Kinder
   `minWidth: 0`. Der Treiber misst den Überlauf: **`formularQuer: 0`**. Höhe des Inspectors
   gemessen **2124 → 1559 px**.
3. **„die farbauswahl objektunabhängig … objekte haben die unabhängige farbauswahl"** — **Ein**
   Baustein (`action-editor/farb-wahl.tsx`) für **jede** Farbe: Farbfeld, Markenpalette,
   „Zuletzt verwendet", „Markenwert". Der **Wert** bleibt beim Objekt: Akzent und Zone schreiben in
   verschiedene Felder und beeinflussen einander nicht (zwei Tests halten genau das fest).
4. **„die bildausschnitt regler können komische effekte auf das logo haben"** — **Echter Fehler**:
   Der Ausschnitt lief über jede Bildzone, also auch über das **Logo**. Bindend ist jetzt
   `zone.bindung === 'bild'`; ein Logo ist eine Konstante (dieselbe Begründung wie beim
   Ersatz-Logo, 9.10.10). Der Satz am Regler sagt es zusätzlich.

**Gegenproben:** 2 (Logo-Ausschnitt entfernt; Akzent aus der Gruppe genommen) — jede rot und
byte-identisch zurückgenommen. **Gate:** Unit **5579/5579**, Integration 51/51, Treiber 0 Befunde.

## Nacharbeit 2 derselben Sitzung (Niklas, 05.11.2026)

- **Schriftarten-Auswahl** fehlte ganz: `zonenGestaltung.schriftRolle` wählt eine der vier Rollen der
  Marke; sie ist ein **Rollen-Verweis**, nie ein Font-Name. Unbekannte Rollen fallen beim Normalisieren
  weg und werden im Formular gemeldet.
- **Farb-Popup:** Farbfeld, Markenpalette, „Zuletzt verwendet" und „Markenwert" stehen **gleichzeitig**
  in EINEM Popup (vorher: Feld immer da, Palette zugeklappt). Es wird am Fenster gehalten — vorher
  stand es am unteren Rand **unter** dem Bildschirm (gemessen y = 920 bei 900 px → 683).
- **Richtungsfeld statt zweier Prozent-Regler:** Bei Zoom 100 % bewirkte der Versatz nichts, und die
  Regler sagten nicht, wohin das Bild wandert. Jetzt: Zoom-Regler + 3 × 3-Pfeile, ohne Zoom gesperrt
  mit dem Satz „Bild verschieben – erst zoomen".
- **Umbruch statt Abschneiden:** Aktionsname im Bildstreifen und in der Bibliothek, Statistik
  („30-Minuten-War…"), Dateiname, Zonenname, Farbzeile. Die Zeitachse bleibt bei Auslassungspunkten —
  dort ist die Clipbreite die Aussage.

**Gegenproben:** 2 (Schriftart ignoriert; Pfeil setzt nur eine Achse) — beide rot und byte-identisch
zurückgenommen. **Gate:** Unit **5590/5590**, Treiber 0 Befunde, TK v3.50, `.docx` 2444 Absätze.

## Nacharbeit 3 (Niklas, 05.11.2026)

*„jz fehlt nur noch die freie farbwahl in dem popup"* — Das native Farbfeld allein ist keine freie
Wahl: Man kann dort nichts eintippen und keinen Wert aus einer Vorlage einsetzen. Im Popup steht
deshalb unter **„Freie Farbe"** neben dem Farbfeld ein **Hex-Feld**:

- zeigt den geltenden Wert, übernimmt bei **Enter** oder Fokusverlust;
- versteht `#RRGGBB`, `RRGGBB` und `#RGB` (Kurzform wird aufgelöst), normalisiert auf `#RRGGBB`;
- ein unbrauchbarer Wert ändert **nichts**: Das Feld springt auf den geltenden Wert zurück und zeigt
  „Ungültig – erwartet wird #RRGGBB."; Farbnamen werden bewusst nicht angenommen.

**Nacharbeit 4 (gleiche Sitzung):** *„es ist nicht klar dass man eine freie farbe auswählen kann außer
du kannst hex values"* — ein Farbkästchen ist keine sichtbare Einladung. Im Popup steht jetzt der
**beschriftete Knopf „Farbe wählen …"** (öffnet den System-Farbwähler), darunter **„oder Wert"** mit
dem Hex-Feld. Beide Wege sind sichtbar, keiner versteckt sich.

**Gegenprobe:** Hex-Übernahme entfernt → 2 Tests rot, byte-identisch zurückgenommen.
**Gate:** Unit **5595/5595**, Treiber `hexFeld: true`, `freiKnopf: true`, TK **v3.52**, `.docx` 2458 Absätze.

## Scrim (Nacharbeit 5, 05.11.2026)

**Auftrag:** *„mach scrim"*. Die Übergabe hatte den Scrim als offen geführt („Verlauf, zwei Stopps;
ein Regler müsste den anderen raten"). Gebaut ist die wörtliche Antwort: **zwei Stopps, je Farbe und
Deckkraft.**

- **Datenmodell:** `ZonenGestaltung.scrim?: ScrimGestaltung` mit `vonFarbe`, `vonDeckkraft`,
  `bisFarbe`, `bisDeckkraft` (optional). `scrimStart` = erster, `scrimEnde` = zweiter Stopp; eine
  deckende Abdunkelung (`scrimEnde` als Fläche) nimmt die `bis`-Werte. Fehlt nur die Farbe, bleibt
  der Farbton der Marke; fehlt nur die Deckkraft, bleibt deren Alpha.
- **Auflösung:** `loeseFarbe(marke, rolle, aktion, zone?)` — der vierte Parameter ist neu und
  optional. Nur die beiden Scrim-Rollen lesen die Zonen-Angabe; `loeseFarbeInZone` reicht die Zone
  durch, damit Füllung und beide Verlaufs-Stopps denselben Weg nehmen.
- **Editor:** „Abdunkelung" je Scrim-Zone mit „Anfang"/„Ende", je ein Farbwähler und ein
  Deckkraft-Regler; der gewöhnliche Flächen-Regler entfällt dort (sonst zwei Wege für eine Fläche).
- **Grenzen:** Deckkraft 0–100 %, Zonenfarben `#RRGGBB` (8-stellig fällt weg), unbrauchbarer Wert
  wirft statt Ersatzfarbe.
- **Gegenproben:** 3, jede rot und byte-identisch zurückgenommen: Deckkraft ignoriert → 3 Tests rot;
  Zone nicht an den Verlauf gereicht → Naht-Test rot; Scrim-Zeile ausgeblendet → 4 UI-Tests rot.
- **Gate:** Typecheck 0, Lint 0, Build 0, Unit **5617/5617** (366), Integration **51/51**, Treiber
  **0 Befunde** (`scrimFarben: 2`, `scrimDeckkraft: 2`, `formularQuer: 0`).
- **Doku:** TK **v3.53** (9.8.10), `.docx` 2498 Absätze, `unzip -t` heil, 0 Backticks. AD v1.13
  unverändert. **Befund:** Die alte `.docx` trug nur `logo.png` (197 KB); das `<svg>`-DFD-Bild
  fehlte — sie war ohne `--dfd` erzeugt. Neu mit `--dfd`: zwei Bilder (Logo + DFD).

**Fenster-Beleg:** Treiber `4g7` misst `{"zonenAnzahl":6,"textfarben":4,"flaechen":3,
"groessenRegler":4,"schriftarten":4,"scrimFarben":2,"scrimDeckkraft":2,"zoomTyp":"range",
"vorlagenKacheln":8,"formularQuer":0}`. Der Sichtvergleich (`scripts/schau.mjs --gross
--gestaltung`) zeigt „Abdunkelung" mit „Anfang #1B0012, 19 %" und „Ende #B00B00, 70 %" — die Werte
kommen aus der Marke (`#1B001230` / `#B00B00B3`), nicht aus dem Formular.

## Der PowerPoint-Befund (05.11.2026)

**Niklas:** *„das ding ist es sieht immer noch wie eine langweilige powerpoint aus"* — nach allen
Reglern. Am Bild geprüft, nicht geraten:

1. **Das Beispielmotiv ist das erste Projekt-Asset** — hier ein Screenshot der macOS-
   Systemeinstellungen (512 × 599), kein Foto. Jede Vorlage sieht damit wie eine Folie aus.
2. **Die Looks sind Varianten derselben Grammatik:** Textblock, Pillen, Sicherheitsrand; sechs
   Positionen, kein Bruch (keine Überlappung, kein Beschnitt, keine Typografie, die das Bild besetzt).
3. **Die Vorschau ist ein Standbild.** Das Produkt ist ein Video; ohne Bewegung bleibt der Beweis
   „Folie".

**Der ehrliche Satz:** Mehr Regler beantworten die Frage nicht. Die nächsten Hebel sind (1) ein
Beispielmotiv, das kein beliebiges Asset ist, (2) ein Look, der die Grammatik bricht, (3) Bewegung.
**Effekte sind jetzt Issue #458** (Entscheidungs-Issue; Option B empfohlen: Ken Burns,
Text-Einblendung, Preis-Pop; nur Ganzbild; harter Schnitt bleibt). **Kein Bau ohne Entscheidung.**

## Stand am Sitzungsende

**Gepusht** (Niklas, 05.11.2026: „pushen und dann übergabe"): `ca99b6f..a8e0359` nach `origin/main`,
**65 Commits** in einem Zug; `git log --oneline origin/main..HEAD` steht danach auf **0**. Dieses
Dokument ist der letzte Commit darauf (Nachtrag, ebenfalls gepusht) — der Arbeitsbaum ist sauber.

**Gate beim Push:** Typecheck 0 (auch tests), ESLint/oxlint 0, Build 0, Unit **5595/5595** (368 Dateien),
Integration **51/51** (13), Treiber **0 Befunde** (1 Untersuchung: Mehrfachauswahl; 1 MANUELL:
Export-Dialog). TK **v3.52**, `.docx` 2458 Absätze, `unzip -t` heil, 0 Backticks. AD unverändert v1.13.

**Nachtrag nach dem Push (gleiche Sitzung):** Scrim gebaut (9.8.10) — TK **v3.53**, `.docx` 2498
Absätze, Unit **5617/5617** (366), Integration 51/51, Treiber 0 Befunde. Der Arbeitsbaum trägt diese
Änderung; **nicht gepusht** (mit `git log --oneline origin/main..HEAD` zählen, nicht abschreiben).

**Der Push meldete 71 Dependabot-Findings** im Repository (33 high, 25 moderate, 13 low). Sie stammen
nicht aus dieser Arbeit und sind **nicht angefasst** — wer sie angeht, macht das als eigene Aufgabe.

## Ehrlich offen

- **Die senkrechte Ausrichtung** ist nicht einstellbar.
- **Ein eigener Bildrahmen** (x/y/Breite/Höhe je Aktion) ist nicht gebaut; der Rahmen kommt aus der
  Vorlage.
- **Die sechs Looks sind nicht am Fernseher geprüft.** Die Koordinaten halten die Inhaltsbox ein
  (Test), aber ob „Riesig" bei 190 px auf dem Studio-Bildschirm wirkt, sagt erst der Blick.
- **Der Editor ist weiterhin ein Formular.** Die Frage vom 05.11. („PowerPoint-Folie statt Werbung")
  ist mit mehr Looks und mehr Reglern beantwortet worden, nicht mit einem anderen Bedienmodell. Der
  Befund steht oben („Der PowerPoint-Befund"); die Effekte liegen als Entscheidungs-Issue **#458**.
- `einzel-instanz.spec.ts` (#289) bleibt flaky, unverändert.

**Gepusht** am 05.11.2026 auf Anweisung (`ca99b6f..a8e0359`).
