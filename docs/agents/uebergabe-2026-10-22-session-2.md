# Uebergabe - Session 22.10.2026 (zweite Sitzung): Live-Vorschau montiert, drei Messbefunde

> Auftrag des Users: „Reihenfolge 2 & 3 selbstaendig, bis der Kontext halb voll ist;
> Designentscheidungen notieren." **Punkt 2 (Live-Vorschau) ist gebaut und gemessen.**
> **Punkt 3 (Muss-Luecken) ist NICHT begonnen** - die Recherche steht in Abschnitt 5.

---

## 1. Live-Vorschau des Marken-Editors ist montiert (A1, #303/#330)

**Entscheidung A1 (22.10.2026) umgesetzt - nicht die aeltere Fassung aus #330.**

- `MarkenEditorWurzelProps` hat jetzt **drei** Felder: `sichtbar`, `marken`, `vorlagen:
  VorlagenZugang`. Die definierende Quelle `app-shell/inhalte.tsx` (#314) ist mitgezogen und
  reicht `zugaenge.vorlagen` durch.
- Neuer Baustein `src/renderer/marken-editor/vorschau-flaeche.tsx`:
  `MarkenVorschau({ marke, vorlagen })` bereitet vor und zeichnet. Die Wurzel bleibt beim
  Anordnen und ruft keinen Zeichenweg.
- **Zeichenweg:** genau `zeichneMarkenVorschau(marke, vorlage)` (#303) - dieselbe Routine wie
  das Segment (TK 9.10.1). Kein CSS-Nachbau, kein zweiter `getContext`.
- **Vorbereitung:** `stelleSchriftenBereit()` (die vier gebuendelten Rollen, #8) →
  `stelleMarkenSchriftenBereit(marke)` (#291) → `bereiteLogoVor(marke)` (#315). **Kein**
  `stelleMarkeBereit`, **kein** `ZeichenZugang`, **kein** Projekt. `stelleSchriftenBereit`
  gehoert dazu, weil die gebuendelten Schriften NICHT beim App-Start geladen werden, sondern
  von jedem zeichnenden Modul vor dem ersten Aufruf (action-editor #140, vorlagen-editor #155,
  composer #313). Ohne ihn faende `zeichneSegment` klanglos eine Ersatzschrift (TK 9.10.3).
- **Feste Vorlage:** „Vollbild" (eingebaut, id `vollbild`), gesucht ueber `name === 'Vollbild'`
  **und** `eingebaut`. Fehlt sie, erscheint ein Hinweis und es wird nicht gezeichnet - kein
  Ersatzweg, kein Nachladen.
- **Markenwechsel:** Der Effekt haengt an der Marken-Objektidentitaet; ein abgebrochener Lauf
  zeichnet nicht mehr, wenn inzwischen eine andere Marke offen ist. Das Canvas bleibt nativ
  1920x1080, skaliert wird nur per CSS (`width: 100%`, `aspectRatio`).
- **Tests:** `tests/unit/marken-vorschau-flaeche.spec.ts` (9 Proben: Reihenfolge der
  Vorbereitung, genau ein Zeichenaufruf, Canvas, kein Zeichnen ohne Marke/Vorlage, Fehlerhinweis,
  Wechsel). `marken-editor-wurzel.spec.ts` prueft die Prop-Weitergabe; `inhalte-reiter.spec.ts`
  prueft `vorlagen` als drittes Feld.

**Widerspruch, gemeldet und nicht still aufgeloest:** #330 traegt seit 23.08.2026 den Nachtrag
„die Marke wird DIREKT ueber `stelleMarkeBereit(markeId)` bereitgestellt". Die Entscheidung A1
vom 22.10.2026 (in `CLAUDE.md` und `oberflaeche-2-0-plan.md`) sagt ausdruecklich **kein**
`stelleMarkeBereit`, sondern eigene Vorbereitung. Diese Sitzung folgt A1 (juenger und vom
Auftraggeber). #330 ist entsprechend kommentiert.

---

## 2. Drei ECHTE Befunde, die erst die Vorschau sichtbar gemacht hat

Alle drei waren vorher unsichtbar, weil importierte Marken-Dateien nie am echten Fenster
**gezeichnet** wurden (4m2 pruefte nur den Bestand und die Anzeige „(importiert)").

### B14 - CSP blockierte `marken://` fuer fetch und FontFace

- **Symptom:** Im Lauf meldete das Fenster
  `Refused to connect ... connect-src 'self'` fuer `logo.png` und
  `Loading the font 'marken://.../fliesstext.woff2' ... font-src 'self' data:`.
- **Ursache:** `src/main/index.ts` erlaubte `marken:` weder in `connect-src` noch in
  `font-src`. Der Kommentar dort begruendete die Abwesenheit fuer `media:`; fuer `marken:`
  war der Weg nie ausgeloest.
- **Fix:** `font-src 'self' data: marken:`; `connect-src 'self' marken:` in **beiden**
  Fassungen (Dev zusaetzlich `ws:`). Begruendung an der Richtlinie.
- **Beleg:** Der Lauf danach meldete **keine** CSP-Meldung mehr.

### B15 - `corsEnabled` fehlte am `marken`-Schema

- **Symptom nach B14:** `Access to fetch at 'marken://.../logo.png' ... has been blocked by
  CORS policy: Cross origin requests are only supported for protocol schemes: chrome, ...`.
  Importiertes Logo wurde `fehlt`, importierte Schrift fiel still auf die Ersatzschrift.
- **Ursache:** `MARKEN_SCHEMA` meldete die vier Privilegien des `media`-Schemas, aber nicht
  `corsEnabled`. #290 hatte das ausdruecklich als **Experiment** gefuehrt: „erst MESSEN".
- **Fix:** `corsEnabled: true` im Schema. Die DoD-Bedingung von #290 („nicht setzen, solange
  die Probe nicht gelaufen ist") ist damit erfuellt; der Kommentar dort ist fortgeschrieben.
- **Beleg:** Danach laden Logo-Bytes und Schrift; keine CORS-Meldung mehr.

### B16 - Vererbte importierte Schrift/Logo zeigte auf die Kind-Kennung (404)

- **Symptom:** Beim Oeffnen einer ABGELEITETEN Marke (Parent mit importierter Schrift) meldete
  das Fenster `404 marken://<kindId>/fliesstext.woff2`. Die Datei liegt aber unter
  `marken-assets/<parentId>/` - TK 9.15.3: „die Kopie gehoert der Marke", die sie importiert hat.
- **Ursache:** `stelleMarkenSchriftenBereit` und `bereiteLogoVor` bauten die URL immer mit
  `marke.id`. Die aufgeloeste Marke traegt bei geerbtem Feld das `Schrift`-/Logo-Objekt des
  Parents, aber ihre EIGENE id.
- **Fix:** Beide Ladewege waehlen die Quell-Kennung ueber `marke.herkunftJeFeld`:
  `geerbt` + `parent !== null` → Parent-Kennung, sonst eigene. Der **Bestand** bleibt unter der
  eigenen id (`holeLogo(marke.id)` unveraendert). Damit folgt ein Kind auch einem SPAETEREN
  Re-Import des Parents - es wird nichts kopiert, es gibt keine zweite Wertquelle.
- **Tests:** je eine Probe in `marken-schriften.spec.ts` und `logo-laden.spec.ts`
  (geerbt → Parent-URL; eigen → eigene URL; Logo bleibt unter der KindId abrufbar).
- **Beleg:** Der Treiberlauf danach ist ohne Fenster-Konsole-Befund.

### Treiber-Messung (4m, erweitert)

`scripts/durchlauf.mjs` misst in **4m** jetzt zusaetzlich die dritte Spalte:

```
[schritt-4m] Live-Vorschau: {"da":true,"canvas":true,"breite":1920,"hoehe":1080,"text":""}.
[schritt-4m] Live-Vorschau GEMESSEN: Canvas 1920x1080 ueber den Zeichenweg (#303).
```

Zwei Verbesserungen am Messweg, die bleiben:
- Fenster-Konsole-Befunde tragen jetzt die **Quell-URL** (`meldung.location().url`).
  „Failed to load resource: 404" ohne URL hatte die Ursache (Kind vs. Parent) offen gelassen.
- 4m2 listet nach dem Import `marken-assets/<id>` auf. Das trennte „Datei fehlt" von
  „URL zeigt auf die falsche Marke".

---

## 3. Gate

Siehe `/tmp/pruefung.log` dieser Sitzung; Ergebnis wird hier nachgetragen:
- `npm run lint` → 0.
- `npm run typecheck` → 0.
- `npm run pruefung` → **Exit 0** - **5.622 Unit-Tests (334 Dateien)**, **49 Integrationstests
  (12 Dateien)**, Treiber ohne Befund. Vorher: `lint` 0, `typecheck` 0.
  Der Treiber meldet die Live-Vorschau als GEMESSEN, keine Fenster-Konsole-Meldung.

---

## 4. Geaenderte/neue Dateien

- neu: `src/renderer/marken-editor/vorschau-flaeche.tsx`
- neu: `tests/unit/marken-vorschau-flaeche.spec.ts`
- `src/renderer/marken-editor/index.tsx` (drittes Prop, Baustein eingebunden)
- `src/renderer/app-shell/inhalte.tsx` (Prop-Typ + Durchreichung)
- `src/renderer/template-canvas/marken-schriften.ts` (Quell-Kennung bei Vererbung)
- `src/renderer/template-canvas/logo-laden.ts` (Quell-Kennung bei Vererbung)
- `src/main/index.ts` (CSP: `marken:` in font-src/connect-src)
- `src/main/marken-store/marken-protokoll.ts` (`corsEnabled: true`)
- Tests: `marken-editor-wurzel.spec.ts`, `inhalte-reiter.spec.ts`,
  `marken-schriften.spec.ts`, `logo-laden.spec.ts`, `marken-protokoll.spec.ts`
- `scripts/durchlauf.mjs` (Vorschau-Messung, Quell-URL im Befund, Asset-Liste)

---

## 5. Punkt 3 (Muss-Luecken) - Recherche, NICHT gebaut

Reihenfolge laut Uebergabe: FA-01/03 (+ #442-Diagnose), FA-22, FA-13, FA-08.
Recherchestand (jeweils belegt, aber **nicht** in dieser Sitzung umgesetzt):

| FA | Was fehlt | Was schon gebaut ist | Aufwand |
|---|---|---|---|
| **FA-01** | Ersetzen-Weg mit Bestaetigung ist am Fenster ungemessen (#422) | Rueckfrage + Ersetzen in `composer/index.tsx`, Unit `composer-ein-video.spec.ts` | 1 Treiber-Schritt |
| **FA-03** | „Aktion bearbeiten" am Fenster ungemessen; Video-Ersetzen = FA-01 | `action-editor` (Klick auf Zeile, `speichereAktion`), `aktion-bearbeiten.spec.ts` | 1 Treiber-Schritt |
| **FA-22** | zweite Ausgabe / Vorbelegung / Ersetzen ungemessen | `render-dialog.ts`, `ausgabe-platzieren.ts`, `auftrags-nachlauf.ts`, Tests | 1 Treiber-Schritt, 2 Render |
| **FA-13** | Zonen aendern/speichern/verwerfen/neu anlegen ungemessen | `vorlagen-editor` + Tests; **Aufraeumen einer Testvorlage fehlt im Treiber** | 1 Treiber-Schritt + Cleanup + **Entscheidung** |
| **FA-08** | Dauer/Framezahl der erzeugten MP4 nicht gegen die Liste geprueft | `ausgabe-platzieren.ts` prueft bereits per ffprobe (±0,5 s) | 1 Treiber-Schritt, richtig platziert (nach 4f, nicht nach 4c) |

**#442-Diagnose (Hypothesen, am Fenster noch nicht verifiziert):** Die Vorlagenart entscheidet
still - `art === 'vollflaeche'` wird Unterbrechung, sonst Band (`unterbrechungs-aufnahme.ts`).
Bei Standard-Zoom 8 px/s zeigt der Filmstreifen nur EIN Bild (#433/4b4), „zwischen Frames" ist
dort nicht darstellbar. 4b6 belegt nur den vollflaechigen Weg. Die Deutung ist entschieden
(A2: Zeitstelle/Unterbrechung) - offen ist die Diagnose, nicht das Modell.

### DESIGNENTSCHEIDUNG, die der Auftraggeber treffen muss

**FA-13 / Einblendung:** Das Anforderungsdokument nennt drei Vorlagenarten (vollflaechig,
Split-Screen-Band, **Einblendung**). `ANLEGBARE_ARTEN` in `vorlagen-uebersicht.ts` bietet nur
`vollflaeche` und `split`; der Store akzeptiert `einblendung`, die UI nicht.
**Frage:** Soll eine neu angelegte Einblendung ueber die Oberflaeche anlegbar sein - und mit
welcher Hoehe/Deckkraft? Oder bleibt „Einblendung" eingebaut-only?

---

## 6. Ehrlich offen

1. **Punkt 3 ist nicht begonnen** (siehe Tabelle).
2. **FA-13-Entscheidung** (Einblendung) steht aus.
3. Die drei Befunde B14-B16 sind behoben, aber **noch nicht auf GitHub** als Kommentar
   hinterlegt (in dieser Sitzung bewusst zuletzt, damit der Gate-Lauf nicht durch
   Netzzugriffe stoert).
4. #303/#330 sind noch offen; die Montage ist belegt, eine Schliessung braucht die
   Issue-Kommentare.
5. **#442** traegt weiter `braucht-entscheidung`, obwohl die Deutung entschieden ist -
   Backlog-Hygiene (Charge 1).
