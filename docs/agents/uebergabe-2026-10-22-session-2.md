# Uebergabe - Session 22.10.2026 (zweite Sitzung): Live-Vorschau montiert, drei Messbefunde

> Auftrag des Users: „Reihenfolge 2 & 3 selbstaendig, bis der Kontext halb voll ist;
> Designentscheidungen notieren." **Punkt 2 (Live-Vorschau) und Punkt 3 (Muss-Luecken)
> sind gebaut und am echten Fenster gemessen.** Offen bleibt nur die Auftraggeber-
> Entscheidung zu FA-13/„Einblendung" (Abschnitt 5).

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

- `npm run lint` → 0.
- `npm run typecheck` → 0.
- `npm run pruefung` → **Exit 0** - **5.623 Unit-Tests (334 Dateien)**, **49 Integrationstests
  (12 Dateien)**, Treiber ohne Befund. Vorher: `lint` 0, `typecheck` 0.
  (Ein erster Volllauf fiel am bekannten Flaky `einzel-instanz.spec.ts`; einzeln und im
  zweiten Volllauf gruen - kein Zusammenhang mit den Aenderungen dieser Sitzung.)
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
- `scripts/durchlauf.mjs` (Vorschau-Messung, Quell-URL im Befund, Asset-Liste,
  Treiber-Schritte 4b7, 4c2, 4f5, 4g3, 4n)
- `src/renderer/composer/index.tsx` (B18: alte Video-Elemente im Bestand entfernen)
- `src/renderer/vorlagen-editor/index.tsx` (B17: gueltige Zonen-Sorte)
- Tests: `composer-ein-video.spec.ts` (Bestand-Entfernen), `vorlagen-editor-sitzung.spec.ts`
  (Textzone-Klick)

---

## 5. Punkt 3 (Muss-Luecken) - GEBAUT und GEMESSEN

Neue Treiber-Schritte (alle in der Matrix, alle im Lauf `GEMESSEN`):

| FA | Schritt | Beleg |
|---|---|---|
| **FA-01** | **4b7** | Rueckfrage vor dem Ersetzen; „Abbrechen" ohne Wirkung; zweites Video ersetzt das alte -> **genau ein Video-Element** (zwei Video-Assets). Der native Dialog bleibt MANUELL. |
| **FA-03** | **4g3** | Aktion im Aktionen-Reiter geoeffnet, Titel geaendert -> `project.json`, **Aktionszahl 1 -> 1**. |
| **FA-22** | **4c2** | Feld traegt den letzten Namen; derselbe Name **ersetzt** (mtime neu, eine Datei, eine Zeile); neuer Name -> **zwei** Dateien/Zeilen. |
| **FA-08** | **4f5** | Render Video + vollflaechige Aktion: `ffprobe 12,022 s` gegen Anzeige `12 s`, eine Datei, kein `.part`. |
| **FA-13** | **4n** | Vorlage angelegt, Textzone -> Arbeitskopie 2 -> 3 (Parent 2), uebernehmen -> Parent 3, erneut aendern -> verwerfen -> Parent 3; Testvorlage geloescht. |

**Zwei echte Produktbefunde dabei:**

### B17 - „+ Textzone (titel)" tat NICHTS

Der Knopf bestellte `{ sorte: 'text-formatiert' } as never` - eine Sorte, die
`fuegeZoneHinzu` nicht kennt. Die reine Funktion und ihre Tests waren gruen; der Klick
scheiterte still (nur `console.warn`). Fix: `{ sorte: 'text', bindung: 'titel' }`.
Neuer Verhaltenstest in `vorlagen-editor-sitzung.spec.ts` (Klick -> Zone in der
Arbeitskopie). Beleg: Treiber 4n (2 -> 3 Zonen).

### B18 - Video-Ersetzen filterte nur die SICHT, nicht den Bestand

`fuegeVideoAnsEndeEin` entfernte das alte Video nur aus der angezeigten Liste; im
`project.json` standen danach **zwei** Video-Elemente (beim naechsten Oeffnen sichtbar).
Fix: alte Video-Elemente gehen jetzt ueber `entferneElementAusListe` (schreibt D1 und die
Sicht), der reine Erst-Import setzt die Sicht wie bisher. Test
`composer-ein-video.spec.ts` angepasst (Bestand-Entfernen statt Sicht-Filter).
Beleg: Treiber 4b7 (`Videos=1, alt weg=true`).

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

1. **FA-13-Entscheidung** (Einblendung) steht aus; darum bleibt FA-13 in der Matrix
   **teilweise** (die belegten Wege: anlegen, Zone, uebernehmen, verwerfen).
2. **#442-Diagnose** ist noch offen (Deutung entschieden, Ursache am Nutzerpfad nicht
   reproduziert).
3. **Issue-Kommentare sind gesetzt:** #303, #330, #290 (B14-B16), #422 (B18/4b7),
   #147 (B17/4n). #303/#330 sind noch **offen**; die Montage ist belegt, die Schliessung
   ist eine eigene Entscheidung (Review).
4. **#215/#240/#255** meldet `bereitschaft.py` als "bereit", obwohl die M-Aera als gebaut
   gilt - vor dem Anfassen gegen den gebauten Code pruefen (Backlog-Hygiene).
5. **#442** traegt weiter `braucht-entscheidung`, obwohl die Deutung entschieden ist -
   Backlog-Hygiene (Charge 1).
