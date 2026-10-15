# Uebergabe – Session 15.10.2026 (Session 3: #425 gebaut – Band-Aufnahme am Video)

> Fuer die naechste Sitzung: Lies zuerst CLAUDE.md (STAND HEUTE), dann diese Datei.
> Vorgaenger: `docs/agents/uebergabe-2026-10-15-session-2.md` (User-Abnahme der Kernachse,
> „Ein Projekt – ein Video" #422–#424; #425/#426 dokumentiert).

## Worum es ging
Der User hat **#425 zuerst** gewuenscht, **dann** die Abnahme von #422–#424. #425 schliesst die
Familie „fertige Funktion ohne Aufrufer" fuer die Band-Bearbeitung: `einblendung-ansicht.tsx`
(#253/M7-60) war fertig, aber nirgends montiert.

## Vor dem Bauen entschieden (die drei STOPP-Punkte des Issues, User 15.10.2026)
1. **Startdauer** eines per Drag angehaengten Band-Abschnitts = **Dauer-Kette des Produkts**
   `aktion.standardDauer ?? projekt.standardSegmentdauer ?? 10` (nicht der feste 10er-Wert).
2. **Band-Vorlage** ohne vorhandene = die **erste waehlbare** (`waehlbareBandVorlagen`, #129) –
   derselbe Startentwurf wie die Ansicht.
3. **Drop auf ein Aktions-Segment** = **kein Ablehnen**; er ordnet **sequenziell** davor/danach ein
   (die bestehende Kanten-Messung #412/#417). Nur der **Körper eines VIDEO-Blocks** ist Band-Ziel.

Festgehalten in **TK v3.23 / 9.7.7** (AD unveraendert – 4.5 beschrieb das Verhalten schon).

## Gebaut und gemergt (Branch `bau/425-band-anbinden`)
- **Neu `src/renderer/composer/band-aufnahme.ts`** (rein): `startdauerFuerBandabschnitt`,
  `bandAufnahmeAus` (ueber `entwurfAus`/`fuegeAbschnittAn`/`waehlbareBandVorlagen` – kein zweiter
  Schreibweg), `bandZielAus` (Körper-Messung am Zeitleisten-Layout).
- **`composer/einblendung-ansicht.tsx` montiert** (Overlay), kein Platzhalter mehr; Uebernehmen
  korrigiert die Sicht ueber `projekt.setzeListe` (EIN Undo-Schritt).
- **`composer/index.tsx`**: Band-Ziel waehrend des Zugs gemessen (`onDragMove`, `bandZiel`); Drop auf
  das Video → `uebernehmeBand` (#129) + EIN `setzeListe`. Nur der Video-Körper ist Band-Ziel.
- **`zeitleiste.tsx`**: sichtbares Band-Ziel (`data-band-ziel`, Umrandung + „Band").
- **Doku**: TK v3.23 / 9.7.7 (Band „gebaut und angeschlossen", drei Regeln); `.docx` neu erzeugt.

## Treiber-Beleg (echtes Fenster, `npm run durchlauf`, Schritt 4f2)
```
bandZiel=true; Bloecke 2->2; Abschnitte=[{aktionRef: <gezogene Aktion>, dauer: 10}]; Band-Zeilen=1
Undo: Band-Zeilen nach Cmd+Z = 0
```
Das heisst: ein Drop einer Aktion auf den Video-Block legt einen **Band-Abschnitt** an (belegt im
`project.json` UND in der Band-Ansicht), die Zahl der Zeitleisten-Bloecke **bleibt gleich** (das Band
ist kein neues Listenelement, TK 9.2.8), und **Cmd+Z** nimmt die Aufnahme in **einem** Schritt zurueck.
Dauer 10 = Projekt-Standard (die gesaete Aktion hat keine eigene Standarddauer).

**Treiber-Messfehler, ehrlich vermerkt:** Der erste Lauf las `project.json` 3,5 s nach dem Drop –
waehrend die Auto-Speicherung entprellt ist (3–5 s, TK 9.5.4). Der Protokolleintrag ist als
„zurueckgenommen" gekennzeichnet; der korrigierte Lauf misst zusaetzlich in der Oberflaeche mit
6,5 s Wartezeit.

## Zaehler auf `main`
- **5509 Tests gruen (315 Dateien)**, Typecheck/Lint 0. Neu: `band-aufnahme.spec.ts` (14),
  `composer-band.spec.ts` (4).
- Driver: keine Befunde ausser den bekannten (5 Reiter / MANUELL-Export).
- `#289`-Flaky im Volllauf **nicht** aufgetreten. Der dokumentierte Vorbefund-Rejection
  (`standardmarke-anzeige.spec.ts`, #324) steht weiter.
- Pendant-Dateien: `docs/agents/oberflaeche-durchlauf.md` (Nachlauf 15:20/15:2x), `docx` neu erzeugt.

## Naechste Sitzung
1. **User-Abnahme #422–#424** (Regel: Treiber-Beleg ist KEINE Abnahme). App starten:
   `./node_modules/electron/dist/Electron.app/Contents/MacOS/Electron dist/main/index.cjs`
   nach `npm run build`; vorher `instanz.lock`/`instanz.signal` raeumen.
2. **#425** ist **Treiber-gemessen** – das Issue nennt ausdruecklich „keine User-Abnahme". Schliessen
   nach dem Merge (Nachtrag-Kommentar mit den drei Entscheidungen + Belegen ist angelegt).
3. **#426 entscheiden** (kurze Unterbrechung: Modell/Render), dann Issues zuschneiden.
4. **Welle 2 / Banner-Spur** und die **#371-Klaerung** (fehlende Plan-Datei
   `trennung-banner-aktionen-plan.md`).
5. Aufraeumen: Branch `bau/425-band-anbinden` kann nach dem Merge geloescht werden; #215 bleibt
   Werkzeug-Limit.

## Beim User
- **Push nur auf ANWEISUNG** (Stand: lokal auf `main` gemergt, **nicht** gepusht).
- Optische Abnahme **#327** weiterhin offen.
- `#289`-Flaky beobachten.
