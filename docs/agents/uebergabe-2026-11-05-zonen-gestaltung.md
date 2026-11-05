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
- **Gate:** Typecheck 0 (auch tests), ESLint/oxlint 0, Build 0, Unit **5572/5572** (366 Dateien),
  Integration **51/51** (13), Treiber **0 Befunde** (1 Untersuchung: Mehrfachauswahl; 1 MANUELL:
  Export-Dialog).

## Ehrlich offen

- **Der Scrim ist nicht einstellbar** (Verlauf, zwei Stopps). Wer ihn tönen will, braucht einen
  eigenen Weg — z. B. zwei Regler oder eine Scrim-Rolle je Zone.
- **Die senkrechte Ausrichtung** ist nicht einstellbar.
- **Ein eigener Bildrahmen** (x/y/Breite/Höhe je Aktion) ist nicht gebaut; der Rahmen kommt aus der
  Vorlage.
- **Die sechs Looks sind nicht am Fernseher geprüft.** Die Koordinaten halten die Inhaltsbox ein
  (Test), aber ob „Riesig" bei 190 px auf dem Studio-Bildschirm wirkt, sagt erst der Blick.
- **Der Editor ist weiterhin ein Formular.** Die Frage vom 05.11. („PowerPoint-Folie statt Werbung")
  ist mit mehr Looks und mehr Reglern beantwortet worden, nicht mit einem anderen Bedienmodell.
- `einzel-instanz.spec.ts` (#289) bleibt flaky, unverändert.

**Nicht gepusht.** Zahl mit `git log --oneline origin/main..HEAD` zählen. **Push nur auf Anweisung.**
