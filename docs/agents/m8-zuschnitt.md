# M8 – Marken: Zuschnitt (Inventar zur Freigabe)

> **32 Volltexte sind geschrieben, nichts ist angelegt.** Diese Datei ist das Inventar; sie wurde am
> 10.08. nach dem Verifikationslauf über die Zuschnitt-Lücken überarbeitet.
>
> Grundlage: AD **v1.3** (FA-23, FA-24, Abschnitt 4.8), TK **v3.7** (9.15, 9.10.10, 9.2.2/9.2.3).
> Milestone-Titel: **`M8 – Marken`** · neue Labels: `modul:marken-store`, `modul:marken-editor`.
>
> **Was sich seit der ersten Fassung (TK v3.4) geändert hat**, ist in jedem betroffenen Eintrag
> vermerkt. Die vier Fassungen dazwischen haben sieben Festlegungen gebracht, die M8 direkt berühren:
> der Herkunfts-Stempel `herkunftJeFeld` (v3.5), der Protokollname `marken://`, der fünfte Reiter
> [Marken], `Marke.sicherheit` als bearbeitbares Feld (alle v3.6) und die Rücknahme von
> `marken_datei_fehlt` als Render-Fehlercode samt eingefrorener Restflächen-Farbe (v3.7).

---

## Die Unterscheidung, die den Umfang bestimmt

Nicht alles Neue ist ein neues Issue. Wo es eine **bestehende** Datei gibt, ist die Erweiterung ein
**Edit** am bestehenden Issue. Sonst hätten zwei Issues dieselbe Datei – die Lückenklasse, die in
jedem Meilenstein aufgetreten ist.

**Neu in dieser Fassung: die Edits stehen jetzt vollständig HIER** (Abschnitt „Edits an bestehenden
Issues"). In der ersten Fassung standen nur drei Typ-Erweiterungen; der Verifikationslauf hat neun
weitere gefunden – alle an derselben Art Naht: eine als *abgeschlossen* geführte Datei, die
erweitert werden muss. **Das ist die Lehre aus M8:** Zum Zuschnitt einer Anforderungsänderung gehört
ein eigener Schritt „welche bestehenden Verträge muss das anfassen?" – und das Editierrecht muss
ausdrücklich vergeben werden, sonst meldet ein Agent und baut nicht.

---

## 39 neue Issues

### contracts (geteilt) – 2

| Nr. | Issue |
|---|---|
| M8-01 | [contracts] Typ `Markennutzung` definieren – die zwei Trefferlisten (Aktionen je Projekt, abgeleitete Marken) für die Referenzprüfung |
| M8-02 | [marken-store] Fehlercode-Union des Moduls definieren (`marke_referenziert`, `marke_eingebaut`, `marke_nicht_gefunden`, `marken_datei_fehlt`) |

> **Korrektur zur ersten Fassung:** M8-02 gehört **nicht** in `contracts`. Die Projektregel sagt,
> fachliche Fehlercode-Unionen liegen in `src/main/**` (Präzedenz: `VorlagenFehlercode` in M4-03) –
> die Enge sitzt dort, wo der Code entsteht. Die geschriebene Datei folgt bereits dieser Regel; hier
> stand der Fehler.

### `marken-store` [V2] (Main) – 14

| Nr. | Issue |
|---|---|
| M8-03 | Atomares Schreiben von `marken.json` mit `.bak` und `schemaVersion` |
| M8-04 | Auto-Speichern + Ereignis `marken:autoSpeichernStatus` (eigener Kanal, nicht der des Projekts) |
| M8-05 | **Vererbung auflösen** – die eine Stelle; feldweise, Parent-Werte für nicht gesetzte Felder. **Seit v3.5 zusätzlich: den Herkunfts-Stempel `herkunftJeFeld` mitliefern** |
| M8-06 | **Bestand beim Start sicherstellen** – existiert `marken.json` nicht, die eingebaute Fitnessworld24-Marke anlegen (`eingebaut: true`, `parent: null`) |
| M8-07 | **Migration aus `config.json`** – die namenlose Marke wird die eingebaute; `standardMarkeId` und `markeId` aller Projekte darauf setzen; Feld aus `config.json` entfernen |
| M8-08 | `listeMarken` – aufgelöst, je samt `herkunftJeFeld` |
| M8-09 | `leseMarke(markeId)` – liefert die **aufgelöste** Marke samt `herkunftJeFeld` |
| M8-10 | `erstelleMarke(name, parentId?)` – inkl. Sperre für Ketten über eine Stufe |
| M8-11 | `bearbeiteMarke(markeId, teilwerte)` – Sentinel `{ geerbt: true }` gibt ein Feld an den Parent zurück |
| M8-12 | `pruefeMarkenReferenzen(markeId)` – rein lesend, über **alle** Projekte |
| M8-13 | `löscheMarke(markeId)` – blockiert bei Referenz, eingebaute nie löschbar |
| M8-14 | Pfad-Auflösung für `marken-assets/<markeId>/` (der `marken-store` ist dafür die Autorität, nicht der `project-store`) |
| M8-15 | `importiereMarkenDatei` / `entferneMarkenDatei` – Whitelist `.woff2` bzw. Bild, Kopieren, Rückfall auf geerbt/gebündelt |
| **M8-33** | **NEU: `öffneMarkenDateiDialog(art)` – der Dateidialog für `.woff2` und Logo-Bilder** |

> **Warum M8-33 fehlte:** `öffneMedienDialog` (TK 9.4.3) gehört dem `media-service` und filtert auf
> die Bild-/Video-Whitelist – für `.woff2` unbrauchbar. Ohne ein eigenes Gegenstück ist der Import
> **von der Oberfläche aus nicht auslösbar**: M8-15 nimmt einen `quellPfad` entgegen, den niemand
> beschafft. Gebaut wird es wie sein Vorbild, das dreiteilig geschnitten ist (Implementierung
> **#81**, IPC **#93**, Aufrufer **#138**); der Filter kommt aus **derselben** Konstante, die M8-15
> prüft. Der Kanal gehört in M8-31.

### Import-Weg und Renderzeit – 3

| Nr. | Issue |
|---|---|
| M8-16 | Lese-Protokoll **`marken://<markeId>/<dateiname>`** – Renderer bekommt **nie** absolute Pfade |
| M8-17 | [template-canvas] **Importierte Schriften je Marke laden**, bevor die erste Zone gezeichnet wird; Nachweis über `document.fonts.check()`. **Seit v3.7 ist das auch die Stelle, an der eine fehlende Datei auffällt** – schlägt das Laden fehl, entsteht kein Segment-PNG |
| **M8-36** | **NEU: Schema und Handler des `marken://`-Protokolls im Main-Bootstrap anmelden** – Schema **vor** `app.ready`, Handler nach `app.whenReady()` und vor dem Fenster |

> **M8-18 ENTFÄLLT** (war: „[render-service] Frühe Prüfung auf fehlende Marken-Dateien"). **Der
> `render-service` bekommt bei Variante A nie eine Marken-Datei zu sehen** – der Renderer liefert
> alle gezeichneten Pixel als fertiges PNG (TK 9.2.2). Eine Prüfung dort bräche einen Lauf ab,
> dessen PNGs bereits fertig **und korrekt** sind. Mit TK v3.7 ist `marken_datei_fehlt` kein
> Render-Fehlercode mehr; die Prüfung sitzt in M8-17. **Die Nummer M8-18 bleibt unbesetzt** – nicht
> nachrücken, sonst zeigen Querverweise in den bereits geschriebenen Volltexten ins Falsche.
>
> **M8-36 schließt die Lücke „fertige Funktion ohne Aufrufer" zum siebten Mal:** M8-16 baut beide
> Registrierungsfunktionen und sagt selbst, dass es sich „**nicht** selbst aus dem Bootstrap" ruft.
> Für `media://` leistet das ein M0-Issue (**#9**); für `marken://` gab es kein Gegenstück.

### `template-canvas` (Renderer) – 3

| Nr. | Issue |
|---|---|
| M8-19 | **Kontrast-Rechnung als geteilte Funktion** – einmal gebaut, zweimal genutzt (Ersatz-Logo wählt automatisch, Editor warnt) |
| M8-20 | **Ersatz-Logo zeichnen** (9.10.10): Markenname, Akzentfarbe **der Marke**, gebündelte `headlinePlakativ`, Textfarbe nach Kontrast, kein `…` |
| M8-21 | Marken-Kontext in die Zonen-Auflösung führen **und den `logo === null`-Zweig einhängen** – beides in `zeichne-segment.ts` |

> **Warum der `logo === null`-Dispatch zu M8-21 wandert und kein eigenes Issue wird:** Beide
> Änderungen betreffen **dieselbe Datei** (`src/renderer/template-canvas/zeichne-segment.ts`, M4-23).
> Zwei Issues auf einer Datei sind genau die Doppelung, die dieser Zuschnitt vermeidet – das
> Datei-Eigentum bleibt bei einem Issue. M8-20 zeichnet das Ersatz-Logo, **entscheidet aber nicht**,
> wann es gebraucht wird; diese Entscheidung trifft der Aufrufer.

### `marken-editor` (Renderer) – 11

| Nr. | Issue |
|---|---|
| M8-22 | Grundgerüst des Editors + Marken-Liste (eigenständige und abgeleitete unterscheidbar) |
| M8-23 | Farb-Rollen bearbeiten – Rollen **fest**, Werte frei |
| M8-24 | Schrift-Rollen anzeigen und Schrift importieren |
| M8-25 | Logo importieren und entfernen (Entfernen → Ersatz-Logo greift) |
| M8-26 | **Geerbt vs. eigen sichtbar machen** – ausschließlich aus `herkunftJeFeld` (v3.5), **nie** aus einem Wertvergleich |
| M8-27 | Marke ableiten (neue Marke mit `parent`) |
| M8-28 | **Kontrast-Warnung** (FA-24) – warnen, nicht blockieren |
| M8-29 | Löschen mit Vorwarnung – zeigt `pruefeMarkenReferenzen` vor dem Löschen |
| M8-30 | Live-Vorschau über `template-canvas` – dieselbe Zeichenroutine wie das Segment |
| **M8-34** | **NEU: Slogan bearbeiten** (`text`, `aktiv`) |
| **M8-35** | **NEU: Sicherheitsabstand bearbeiten** (`horizontal`, `vertikal`) |

> **Warum M8-34 und M8-35 fehlten:** FA-24 nennt wörtlich „Farben, **Slogan**, **Sicherheitsabstände**
> sowie Import von Logo und Schriftdateien". Farben deckt M8-23, den Import M8-24/M8-25 – Slogan und
> Sicherheitsabstand deckte **niemand**; beide kamen in den Editor-Issues nur als *durchgereichte*
> Werte vor. **Zwei Issues, nicht eines**, weil M8-23/24/25 dem Muster „ein Feld je Datei" folgen.
> **Für M8-35 gilt zusätzlich TK v3.6:** `Marke.sicherheit` ist bearbeitbar, die 96/54 px sind nur
> noch die Vorbelegung der eingebauten Marke – und weil Vorlagen app-weit sind, muss der
> `vorlagen-editor` seine Sicherheitslinie gegen eine **benannte** Marke zeichnen.
> Beide gehören in M8-22 als weitere Rückmelder an `uebernimmAktualisierteMarke`.

### Verdrahtung und geteilte Bausteine – 6

| Nr. | Issue |
|---|---|
| M8-31 | [ipc-gateway] Die Kanäle des `marken-store` anmelden – **einschließlich `marken:öffneMarkenDateiDialog`** (M8-33) |
| M8-32 | [app-shell] Zugang zur gemeinsamen Marken-Sicht bereitstellen |
| **M8-37** | **NEU: Die vier bestehenden Aufrufer von `zeichneSegment` an die neue Signatur anpassen** (`action-editor`, `composer`-Thumbnails, `preview-player`, Render-Vorbereitung) – dazu `holeLogo(markeId)` aus dem Edit an **#119** |
| **M8-38** | **NEU: `sichten.ts` und den Renderer-Bootstrap auf den Marken-Zugang umstellen** – `Sichten.marke` fällt weg |

| **M8-39** | **NEU: [gemeinsam] Marken fuer die Zeichner aufloesen und bereitstellen** – `markeId` → `Marke` ueber `leseMarke`, je Marke zwischengespeichert, Schriften und Logo vor dem ersten Zeichnen bereit |

| **M8-40** | **NEU: [composer] Die Zeichner auf Marken je Aktion umstellen** – `Zeichenvoraussetzungen.marke` und die drei `…WurzelProps.marke` fallen **ersatzlos** weg |

> **Warum M8-40 ein eigenes Issue ist und nicht Teil von M8-38:** `Zeichenvoraussetzungen.marke` und
> die drei `WurzelProps.marke` fallen **zusammen** weg. Nur eines davon mitzunehmen zerschnitte eine
> zusammenhängende Änderung in der Mitte – genau die Nahtstellen-Fehlerklasse, die dieses Projekt in
> jedem Meilenstein Geld gekostet hat.
>
> **Beim Nachprüfen wuchs sein Dateibereich von fünf auf acht** – und dabei kam ein **sachlicher
> Fehler** in einem abgenommenen Issue zutage: `split.tsx` (**#218**) führt heute **ein** `marke`,
> das laut eigener Beschreibung „AUSSCHLIESSLICH die Farb-Rolle `flaecheDunkel`" liefert. Die kommt
> nach TK 9.15.4 aus der **Projekt-Standardmarke** – der Band-Abschnitt **darin** trägt aber die
> Marke der **rotierenden Aktion**. Es braucht dort **zwei** Marken; mit einer ist die Komposition
> nicht korrekt darstellbar. Dasselbe gilt für `einblendung.tsx` (**#219**).

> **Warum M8-39 fehlte – die SIEBTE Wiederholung derselben Lueckenklasse.** Bis v3.3 gab es **eine**
> app-weite Marke, durchgereicht ueber `Sichten.marke`; die Beschaffung war trivial und stand
> deshalb in keinem Issue. Seit jede Aktion ihre eigene `markeId` traegt, muss sie **je Segment**
> aufgeloest werden – und `marken:leseMarke` wird im Renderer nur von M8-22 (die im Editor
> **geoeffnete** Marke), M8-37 und M8-38 gerufen. Die fuenf Zeichner bekommen `marke: Marke` als
> Parameter, **beschafft haette sie niemand**. Der Ort ist der geteilte Bereich
> `src/renderer/gemeinsam/`: Alle fuenf brauchen es, keiner besitzt es.

> **Der Einstieg in den Editor ist entschieden (TK v3.6):** ein **fünfter Reiter [Marken]**, neben
> [Vorlagen] – app-weiter Bestand, ohne offenes Projekt benutzbar, Undo/Redo dort **abgeschaltet**.
> Die erste Fassung ließ „Reiter oder Unterbereich" offen.
>
> **Warum M8-38 nötig ist:** `Sichten.marke: Marke` (M7-04, **#197**) ist ein app-weiter Einzelwert
> aus `config:leseMarke`. Genau dieses Feld entfernt M8-07 aus der App-Konfig. Ohne Nachzug scheitert
> `baueSichten()` an einem toten Kanal – oder, schlimmer, es liefert unbemerkt eine falsche Marke.
> M8-32 verbietet sich den Zugriff auf `sichten.ts` ausdrücklich und meldet den Bedarf als
> „eigenständigen Nachtrag". **M8-38 ist dieser Nachtrag.**

---

## Edits an bestehenden Issues

Ohne diese Edits sind die neuen Issues nicht baubar. **Jeder braucht ein ausdrücklich vergebenes
Editierrecht** – eine Meldung ohne Recht führt dazu, dass ein Agent wartet statt baut.

### Typ-Erweiterungen (standen schon in der ersten Fassung)

| Typ | Issue | Was sich ändert |
|---|---|---|
| `Marke` | **#52** (M1-40) | `id`, `name`, `parent`, `eingebaut`; `logo` wird `\| null`; `Schrift.herkunft`; `Herkunft`; **`herkunftJeFeld`** (v3.5) |
| `Aktion` | **#14** (M1-02) | neues Pflichtfeld `markeId`; `akzentfarbe` ist **freier** Hex-Wert |
| `Project` | **#15** (M1-03) | neues Feld `standardMarkeId` |

### Vom Verifikationslauf gefunden

| Issue | Datei | Was sich ändert | Grund |
|---|---|---|---|
| **#119** (M4-25) | `template-canvas/logo-laden.ts` | Bestand **je `markeId`** statt Einzelwert; `holeLogo()` → `holeLogo(markeId)`; Ladeweg nach `herkunft` verzweigen (`gebuendelt` → Bundle, `importiert` → `marken://`); `leereLogoBestand()` wird gebraucht | lädt heute **ein** gebündeltes, projektunabhängiges Logo; begründet mit „read-only, kann sich zur Laufzeit nicht ändern" – seit v3.4 falsch |
| **#117** (M4-23) | `template-canvas/zeichne-segment.ts` | vierter Parameter `rahmenMarke`; `logo === null`-Zweig | Recht liegt bei **M8-21** – bereits vergeben |
| **#128, #134, #140, #150, #217** | die **fünf** Aufrufer von `zeichneSegment` | vierter Parameter `rahmenMarke`; `#134` löst zusätzlich `Project.standardMarkeId` auf | zugewiesen an **M8-37** |
| **#154** (M5-35) | `composer`-Zeichenvoraussetzungen | **zweiter** Renderer-Aufrufer von `config:leseMarke`, das M8-07 abschafft | neu, 10.08. gefunden |

> **Zwei Korrekturen an der eigenen Zuschnitt-Annahme (10.08., beim Schreiben von M8-37 gefunden):**
> Es sind **fünf** Aufrufer von `zeichneSegment`, nicht vier, und **keiner liegt in M6** – die in
> M8-21 als „Render-Vorbereitung/M6" geführte Stelle ist `#134` im `composer` (M5). Übersehen worden
> war **`#150`** (`vorlagen-editor/editor-vorschau.ts`) – ausgerechnet der einzige Aufrufer außerhalb
> des Renders, der eine **`einblendung`**-Vorlage zeichnet und bei dem `rahmenMarke` überhaupt von
> `marke` abweichen kann. Und **`#154`** stand in keiner Edit-Liste, obwohl er `config:leseMarke`
> ruft.
| **#197** (M7-04) | `app-shell/sichten.ts` | `marke: Marke` → Marken-Zugang; Schritt 1 von `baueSichten()` von `config:leseMarke` umstellen | M8-38 |
| **#244** (M7-51) | `app-shell/inhalte-zugaenge.ts` | durchgereichtes Feld | M8-38 |
| **#260** (M7-65) | `app-shell/bootstrap.ts` | Bootstrap-Schritt + Begründungstext | M8-38 |
| **#250** (M7-57) u. a. | Konsumenten von `p.marke` | Lesezugriff umstellen | **Umfang ungeprüft** – ein Grep über alle M7-Volltexte nach `.marke` steht aus |
| **#29** | `config-store/lese-marke.ts` | **Operation und Kanal `config:leseMarke` entfallen ersatzlos** | **entschieden** – TK 9.5.6 führt `leseMarke` gar nicht mehr in der Operationstabelle |
| **#197** (M7-04), **#154** (M5-35) | `app-shell/sichten.ts`, `composer` | streichen den Aufruf von `config:leseMarke`, statt ihn umzubiegen | Folge derselben Entscheidung |

### Aus der Entscheidung zu den Sicherheitsabstand-Grenzen (10.08.)

| Issue | Datei | Was sich ändert |
|---|---|---|
| **#21** (M1-09) | `src/shared/contracts/konstanten.ts` | neue Konstante **`SICHERHEITSABSTAND_BEREICH`** = `{ horizontal: { min: 0, max: 480 }, vertikal: { min: 0, max: 270 } }` – gelesen von **M8-11** (Main-Validierung) **und** M8-35 (frühe Rückmeldung am Formular) |

> **Ohne diesen Edit importieren M8-11 und M8-35 ins Leere.** Die Konstante liegt bewusst in
> `konstanten.ts` neben `SICHERHEITSABSTAND_PX` (der **Vorbelegung**) und `DAUER_BEREICH` (dem
> **erlaubten Bereich**) – nicht im Edit an `#52`, weil `contracts/marke.ts` nach dem Muster von
> M3-01/M4-01 ausschließlich **Typen** enthält und Grenzen ein **Laufzeitwert** sind.
>
> **Bewusst NICHT mitentschieden:** `radien`, `schatten`, `logo.seitenverhaeltnis` und `slogan.text`
> haben **dieselbe** Lücke – für sie validiert `bearbeiteMarke` ebenfalls nichts, und **niemand hat
> Grenzen beschlossen**. M8-11 schreibt ausdrücklich fest, dass es **keine erfindet**. Heute gehen
> `radien: { pille: -50, karte: 9999 }` oder `schatten.farbe: 'lila'` ungeprüft durch; die Wirkung
> ist **rein optisch** – kein Datenverlust, kein Renderabbruch. Das ist der Unterschied zum
> Sicherheitsabstand, wo ein Extremwert die Sicherheitszusage **aller** Vorlagen aufhebt. Offen zu
> lassen, bis der Editor die Felder überhaupt anbietet, ist vertretbar – aber es ist eine
> **Entscheidung**, keine Nachlässigkeit.

### Aus dem Electron-Zwang bei der Schema-Registrierung (10.08. entschieden)

`protocol.registerSchemesAsPrivileged(customSchemes: CustomScheme[])` nimmt ein **Array** und darf
laut `electron.d.ts` **nur einmal** gerufen werden. Heute planten `#9` (für `media`) und M8-16 (für
`marken`) **je einen eigenen** Aufruf. *Folge ohne die Änderung – und beide Ausgänge sind still:*
Entweder wäre `marken://` nicht privilegiert, **oder `media://` hätte aufgehört zu funktionieren**,
und dann fehlten in der Vorschau sämtliche Projektmedien, ohne dass irgendetwas auf die Marken zeigt.
**Entschieden:** Die Module liefern ihre Schema-Beschreibung als **Daten**, der Bootstrap ruft
**einmal** auf.

| Issue | Datei | Was sich ändert |
|---|---|---|
| **#9** (S9) | `src/main/media-protokoll.ts` | `registriereMediaProtokollSchema()` **entfällt**, ersetzt durch `export const MEDIA_SCHEMA: CustomScheme`. Der Handler-Stub bleibt unverändert |
| **#3** | `src/main/index.ts` (CSP) | `marken:` in **`img-src`** (Logos über `<img>`) und **`font-src`** (importierte Schriften). **Nicht** in `media-src` (aus Marken kommen keine Videos), **nicht** in `connect-src` – aus demselben Grund, aus dem `media:` dort fehlt (s. u.). Ohne Nachzug lädt der Renderer kein importiertes Logo und keine importierte Schrift, und zwar **still** |
| **#3** | `src/main/index.ts` (Zählung) | Die Anmeldungen wachsen von **dreizehn auf fünfzehn** – `verdrahteMarkenIPC()` als **elfte** ohne Fenster (ans Ende von Schritt 5, hinter `meldeExportHandlerAn()`), `verdrahteMarkenSpeicherstatusIPC(fenster)` als **vierte** mit Fenster (Schritt 7, direkt hinter `verdrahteSpeicherstatusIPC`). `#3` nennt die Zahl an mehreren Stellen im Text |

> **Die CSP ist bereits GEBAUT** (`src/main/index.ts`, aus `#3`) und lautet heute
> `img-src 'self' data: blob: media:` · `media-src 'self' blob: media:` · `font-src 'self' data:`.
> `font-src` kennt **kein** `media:`, weil Projektmedien keine Schriften sind – für `marken:` ist es
> dagegen **zwingend**.
>
> **DAZU EIN EXPERIMENT, kein Textnachzug (neu, 10.08.):** Neben der CSP steht im gebauten Code ein
> **gemessener** Befund: „`fetch('media://...')` scheitert auch dann, wenn `connect-src` es erlaubt –
> und der Protokoll-Handler wird dabei **NICHT EINMAL ERREICHT** […] `media://` ist gegenüber der
> Seite ein fremder Ursprung, und Electron kennt dafür ein eigenes Schema-Privileg (`corsEnabled`),
> das in der verbindlichen Signatur von `#9` nicht steht." Die gebauten Privilegien sind `secure`,
> `supportFetchAPI`, `stream`, `standard` – **kein `corsEnabled`**.
> **Für `marken://` wiegt das schwerer als für `media://`:** Ein Logo lädt über `<img>` und ist
> unbetroffen – eine **Schrift** lädt über `FontFace`, und das ist ein Cross-Origin-Ladeweg. Der
> Verdacht lautet deshalb: **`marken` braucht `corsEnabled: true`**, sonst lädt keine importierte
> Schrift, unabhängig von `font-src`. **Das ist ein Verdacht aus einer Ableitung, kein Messwert** –
> gemessen wurde `fetch`, nicht `FontFace`. Nach der Projektregel ist es damit ein **Experiment**
> (Schrift über `marken://` laden, einmal mit und einmal ohne `corsEnabled`), geführt im STOPP-Block
> von M8-16.

### Aus TK v3.7 (die eingefrorene Restflächen-Farbe)

| Issue | Datei | Was sich ändert |
|---|---|---|
| **#17** (M1-05) | `shared/contracts/render-request.ts` | neues Pflichtfeld **`einblendung.flaecheDunkel: string`** (fertiger Hex-Wert) |
| **#134** (M5-15) | `composer/render-ausloesen.ts` | **befüllt** das Feld beim Einreihen – Auflösung aus `Project.standardMarkeId`, derselben Marke, mit der die Band-PNGs gezeichnet wurden |
| **#177** (M6-22) | `render-service/normalisieren.ts` | nimmt den Wert **aus dem Auftrag**, statt `leseMarke()` (**#29**) zu rufen und selbst aufzulösen |

> Diese drei sind die vollständige Kette: Typ – Befüller – Verbraucher. **Fehlte der mittlere**, wäre
> das Feld vorhanden und immer leer; das ist die Lückenklasse „Feld ohne Befüller".
>
> **Nicht mehr nötig** (mit v3.7 entfallen): eine Marken-Referenz im `RenderRequest`, der Edit an
> **#68** (`RENDER_FEHLERCODES`) und der Edit an **#171** (`RenderFehlercode`). Die zweite Liste
> hatte der Verifikationslauf zusätzlich gefunden – ohne sie hätte der `render-service`
> `marken_datei_fehlt` nicht einmal erzeugen können.

---

## Was beim Zuschnitt entschieden wurde

1. **Die Pfad-Auflösung für `marken-assets/` gehört dem `marken-store`** (M8-14), nicht dem
   `project-store`. Der `project-store` ist Pfad-Autorität für **Projekt**-Daten (TK 9.5.7);
   `marken-assets/` liegt **app-weit**. Eine zweite Autorität für einen fremden Ordner wäre genau
   die Doppelung, die 9.5.7 ausschließt. Aus demselben Grund ein **eigenes** Protokoll `marken://`
   statt einer Erweiterung von `media://` (TK v3.6).
2. **`importiereMarkenDatei` und `entferneMarkenDatei` in einem Issue** (M8-15) – dieselbe Datei,
   dieselbe Whitelist, und das Entfernen ist die Umkehrung des Imports.
3. **Die Kontrast-Rechnung ist ein eigenes Issue** (M8-19) im geteilten Renderer-Bereich. Zwei
   Aufrufer (M8-20 zeichnet automatisch, M8-28 warnt) – zweimal gebaut liefen sie auseinander, und
   dann warnte der Editor bei etwas, das der Canvas anders bewertet.
4. **Kein Undo für den Marken-Bestand** – so in TK 9.15.2 festgelegt. Deshalb **kein** Issue dafür.
5. **Der `logo === null`-Dispatch wandert in M8-21**, statt ein eigenes Issue zu werden – eine Datei,
   ein Eigentümer.
6. **M8-18 entfällt ersatzlos, seine Nummer bleibt unbesetzt.**

## Was noch offen ist und vor dem Prüflauf geklärt werden muss

- **Der Kontrast-Schwellenwert ist nirgends genannt.** M8-19 weigert sich bewusst, ihn festzulegen,
  und übergibt ihn als Pflicht-Parameter; M8-28 führt ihn als Prop. **Irgendwer muss die Zahl
  nennen.**
- **`Markennutzung` deckt `Project.standardMarkeId` nicht.** Die zwei Trefferlisten erfassen Aktionen
  und abgeleitete Marken – eine Marke ließe sich löschen, während sie noch **Projekt-Standard** ist,
  und der nächste Render liefe in `marke_nicht_gefunden`. Braucht eine dritte Liste oder eine bewusste
  Entscheidung.
- **M8-07: reihum oder träge migrieren?** Träge (beim Öffnen) macht die projektübergreifende
  Referenzprüfung (M8-12) für nie wieder geöffnete Projekte unzuverlässig; für „reihum beim Start"
  gibt es keinen etablierten Schreibweg für nicht-aktive Projekte.
  **ERLEDIGT – der zweite Teil dieser Frage ist beantwortet:** Ob „Feld aus `config.json` entfernen"
  auch den Rückbau von `config-store.leseMarke` (#29) meint, stand offen. **Es meint ihn.** Die
  Operationstabelle in TK 9.5.6 führt vier Operationen – `leseKonfig`, `setzeAktivesProjekt`,
  `setzeExportZiel`, `setzeUIVoreinstellung` – und `leseMarke` ist **nicht** darunter. Der Vertrag
  hatte die Operation längst abgeschafft; nur die Issues kannten den Stand nicht. Der Kanal
  verschwindet **ersatzlos**; `baueSichten()` (#197) und `#154` streichen ihren Aufruf, statt ihn
  umzubiegen. *Ein inhaltsleerer Kanal wäre ohnehin genau die Doppelung gewesen, die 9.5.6
  ausschließt: „lägen `leseKonfig().marke` und `leseMarke(...)` nebeneinander, könnten sie
  auseinanderlaufen, ohne dass etwas bricht."*
- **Dateiname beim Import** (Originalname oder neutral?) und Verhalten bei Namenskollision.
- **Das eingebaute Logo** (Dateiname, `seitenverhaeltnis`) ist nirgends festgenagelt.
- **Gegen welche Marke zeichnet der `vorlagen-editor`?** Er hat **keinen** Projektzugang, also auch
  keine `Project.standardMarkeId`. Bis v3.5 war das gleichgültig – seit v3.6 **`Marke.sicherheit`
  bearbeitbar** ist, entscheidet die Marke darüber, **wo die Sicherheitslinie liegt**, die der Editor
  zeichnet und gegen die er warnt (9.11.2). Eine Vorlage, die gegen die eingebaute Marke sicher
  aussieht, kann es bei einer anderen nicht sein.
- **Was geschieht beim Wechsel der Marke einer Aktion bei offenem Projekt?** Die Zeichner halten die
  Marken vorab bereit (M8-40); ein Wechsel bringt eine Marke ins Spiel, die noch nicht bereitsteht.

## Textkorrekturen an den geschriebenen Volltexten

Vor dem Prüflauf, sonst prüfen die Prüfer gegen einen Vertrag, den es nicht mehr gibt:

- **M8-16** – Schemaname `marken-assets` → **`marken`** (Zielsatz, Eingang-Tabelle, Fehlerpfade, zwei
  DoD-Punkte). Der **Ordner** heißt weiterhin `marken-assets/`. Mitzuprüfen: M8-17, M8-24, M8-25.
- **M8-18** – Datei entfernen.
- **M8-22** – M8-34/M8-35 als weitere Rückmelder eintragen.
- **M8-24 / M8-25** – Dialog-STOPP auflösen (M8-33 ist die Antwort).
- **M8-26** – der 9.15-Widerspruch ist mit TK v3.5 gelöst; der STOPP-Punkt zur Beschaffung von
  `MarkenHerkunftJeFeld` wird zum Verweis auf M8-05/M8-09.
- **M8-31** – stale Signaturen nachziehen (`erstelleMarke`, `MarkenTeilwerte`) + neuer Dialog-Kanal.
- **M8-32** – „Reiter oder Unterbereich" → fünfter Reiter (TK v3.6); der VERMERK zu `Sichten.marke`
  wird zum Verweis auf M8-38.
- **M8-22 ↔ M8-32** – Divergenz auflösen: `marken-bestand.ts` mit `MarkenBestand`/`ladeMarkenBestand`
  (M8-32) vs. `marken-uebersicht.ts` (M8-22). Ebenso `Herkunft` (M8-11) vs. `MarkenHerkunft` (M8-22)
  – zwei Namen für denselben Typ.
- **BRIEFING.md** – auf TK v3.7 heben.

## Danach: der Zitat-Abgleich

54 Issues, drei Klassen (`marken-abgleich-umfang.md`). Er läuft **nach** dem Anlegen von M8, damit
die Klasse-3-Issues auf echte Nummern verweisen können statt auf Platzhalter. **Der Umfang ist seit
v3.4 gewachsen** – die Edit-Liste oben gehört dazu.
