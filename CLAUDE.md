# PROJEKT-ÜBERGABE – Digital-Signage-Tool (Baller Gruppe)

## Deine Rolle & meine Arbeitsweise
- Du hilfst mir (Berufspraktikant bei der Baller Gruppe) bei Planung und später Entwicklung
  eines Digital-Signage-Tools. Im Anhang: zwei Dokumente, die den Stand festhalten.
- [ÜBERHOLT seit 04.08.2026, bleibt als Beleg stehen] „WIR SIND IN DER PLANUNGSPHASE. Kein Code,
  keine Task-Listen, bis ich ausdrücklich sage ‚wir sind nicht mehr im Plan'."
  ES WIRD GEBAUT. Der Satz galt bis zum 04.08.2026; seither entsteht Code. Wer ihn heute befolgt,
  weigert sich zu arbeiten. Der aktuelle Stand steht im Abschnitt „STAND HEUTE" direkt darunter.
- Arbeite Schritt für Schritt, ein Thema pro Schritt, und frag am Ende kurz nach Bestätigung,
  bevor du weitergehst. Keine Sprünge nach vorn.
- Ich hasse Ambiguität. Triff klare Annahmen, benenne sie offen und beseitige Unklarheiten aktiv.

## STAND HEUTE (28.10.2026, zweite Sitzung: #445/#394/#364 gebaut, Treiber-Matrix-Kopf, #446 angelegt) – gilt vor ALLEM weiter unten

- **#445 GEBAUT:** Im Modus „Neue Aktion" schreibt `feldVerlassen` den getippten Wert jetzt in
  den **Entwurf** (vorher kehrte es bei `gewaehlt === null` still zurueck); der Anlegen-Knopf
  sitzt in `FormularFelder`, prüft vor dem Kanal mit `pruefeEntwurf` und zeigt den Befund
  **am Formular** (`BefundAnzeige` bzw. `Nicht angelegt: <Meldung>` statt nur `console.warn`).
  4 jsdom-Tests (`tests/unit/action-editor-neue-aktion.spec.ts`); Gegenprobe (Rückschreiben
  entfernt) → **2 Tests rot**, Rücknahme byte-identisch (`c9e3055…`). **Nicht** am Fenster
  gemessen. Der bestehende Speichermeldungs-Spec (`ea2c3ea`) bleibt grün.
- **#394 GEBAUT (Montage):** `Statistik` hatte **keinen Aufrufer**. Sie hängt jetzt als **flache
  Leiste** in der Kopfzeile des Composers (neben "Video importieren"), nicht als eigenes Panel
  über der Zeitleiste - ein Panel kostete die Höhe, die die Zeitleiste zum Ziehen braucht.
  Dafür ist die Darstellung in `statistik.tsx` auf eine Zeile umgestellt (`flex` + `wrap`).
  2 jsdom-Tests (`tests/unit/composer-statistik.spec.ts`, krumme Werte 12,51 s + 7,37 s →
  `0:19`); Gegenprobe (Montage entfernt) → **2 Tests rot**, byte-identisch.
  **Widerspruch gemeldet:** Die DoD-Zeile „Keine Datei außerhalb von `statistik.tsx`" ist für
  eine Montage unerfüllbar (eine Datei kann sich nicht selbst rendern) - geändert wurden
  `composer/index.tsx` und `statistik.tsx`. Der Bau nimmt `readonly Listenelement[]` (breiter
  als die Signatur im Issue); gebauter Code gewinnt.
  **OFFEN (Auftraggeber, 28.10.2026): die Platzierung.** Aktuell flache Leiste in der
  Kopfzeile; Alternativen laut Issue-STOPP: eigenes Panel oder Teil der Liste. Ein Umzug ist
  ein einzelner JSX-Block - **nicht** entschieden, hier festgehalten.
- **#364 GEBAUT:** `src/renderer/gemeinsam/media-blob-url.ts` (`mediaBlobUrl` /
  `gibMediaBlobUrlFrei`, wirft nie, Fehler → `''` + `console.warn`); `video-filmstreifen.tsx`
  bindet die **Blob-URL** und gibt sie im `finally` frei (auch beim Fehlschlag); die **Bühne**
  (`preview-player/video.tsx`) bleibt bei `media://` - Grep-Test. 8 jsdom-Tests.
  **Zwei Änderungen außerhalb der Issue-Dateiliste, gemessen begründet:** `fetch('media://…')`
  erreicht den Handler **nur** mit `corsEnabled: true` am Schema (wie B15 bei `marken://`) und
  `media:` in `connect-src` (wie B14) - beides gesetzt (`media-protokoll.ts`, `index.ts`),
  `media-protokoll-schema.spec.ts` auf **fünf** Privilegien. Gegenprobe: `corsEnabled: false`
  und die Freigabe durch `void objektUrl` ersetzt → **2 Tests rot**, Rücknahme byte-identisch
  (`52b3228…`, `9755635…`). **TK 9.5.7** hat den Nachtrag
  (**v3.29 / 28.10.2026**, `.docx` mit `--dfd` neu erzeugt); `zitate-pruefen.py`:
  **0 veraltete** Zitate. **Ehrlich offen:** der Pixel-Beleg am echten Fenster fehlt - die im
  Issue genannte Datei `tests/integration/e2e-echtes-video.spec.ts` **existiert nicht** (auch
  nicht in der Git-Historie), und jsdom hat keinen Videodecoder. Belegt ist der Bindungsweg,
  nicht "kein SecurityError" am echten Fenster.
- **Treiber-Matrix:** Der **Kopf** stand auf 21.10., der Inhalt trug längst die 22.10.-Messungen
  (4b7/4c2/4f5/4g3/4n, 10 gemessen / 11 teilweise / 0 Lücke / 3 manuell, Muss 8 von 15).
  Kopf auf 28.10. gezogen, Beleg-Absatz ergänzt; `treiber-matrix.spec.ts` grün, seit 22.10.
  kein neuer Szenario-Schritt.
- **#446 angelegt** (FA-03 als Issue, wie in der Backlog-Analyse gefordert): Befund 26.10.
  (3 von 4 Läufen), Abgrenzung zu #445, DoD über zehn grüne Läufe bzw. belegte Ursache.
- **#446 GEMESSEN (28.10.2026, Nachlauf):** **zehn aufeinanderfolgende Treiber-Läufe**
  (10:17–10:56 UTC) alle **Exit 0**, 4g3 jedes Mal `gefunden=true`, **keine Befunde**; dazu die
  zwei Gate-Läufe vom Vormittag (12 Läufe ohne roten 4g3). Die DoD-Zeile „zehn aufeinanderfolgende
  Läufe grün" ist damit erfüllt – die **Ursache** des 26.10.-Befunds ist **nicht benannt** (es gab
  keinen roten Lauf mit den neuen Protokollwerten). Logs: `$TMPDIR/fa03/`; alle zehn Läufe
  protokolliert in `docs/agents/oberflaeche-durchlauf.md`. Die Schritte **4o/4p/4q** liefen mit.
- **Drei neue Treiber-Schritte (`4f990b5`):** **4o** Statistik-Leiste (#394: Gesamtdauer `0:02`,
  1/1/0 gegen `project.json`), **4p** Canvas-Pixel (#364: `getImageData` auf 6 Kacheln ohne
  SecurityError, 74–82 Farben je Kachel, Bühne bleibt `media://`), **4q** „Neue Aktion" (#445:
  Aktion 1→2 mit getipptem Titel, leerer Titel am Formular abgelehnt). Matrix-Kopf auf 28.10.
  gezogen. **Beleg-Kommentare an #445/#394/#364 gesetzt** (28.10.2026); **kein** Issue geschlossen.
- **Gate:** `npm run pruefung` **Exit 0** – Unit **5.659 (338 Dateien)**, Integration **49
  (12 Dateien)**, Treiber **0 Befunde**, Typecheck/Lint 0. Zwei Läufe davor waren rot mit
  **denselben drei** Treiber-Befunden (Band-Aufnahme 4f2 ×2, Aktion löschen 4g4) - und der
  Lauf **08:56 heute**, also **vor** diesen Änderungen, zeigt sie ebenfalls. Sie sind damit
  **nicht** von dieser Sitzung verursacht; im grünen Lauf sind `bandZiel=true` und
  `Aktion loeschen: 1 -> 0 -> Undo 1` belegt. (Die erste Montage von #394 als eigenes Panel
  über der Zeitleiste ist trotzdem verworfen - sie kostete genau die Höhe, an der die
  Zieh-Schritte hängen.)
- **GEPUSHT (28.10.2026, auf Anweisung):** `a53e64d..fd563b4` → `origin/main`, **180 Commits**,
  431 Dateien (+17.368/−7.685); `main` = `origin/main`, Arbeitsbaum sauber. Der Gate-Lauf oben
  liegt **vor** den drei Doku-Commits; danach nachgeprüft wurde nur `treiber-matrix.spec.ts`
  (**3/3 grün**), **kein** voller Gate-Lauf. Das Remote meldet beim Push **45 Dependabot-Findings**
  (22 high/16 moderate/7 low) – **nicht geprüft**, auf Anweisung zurückgestellt („Funktionen vor
  Sicherheit"). Auf GitHub wurden **nur** die Beleg-Kommentare an **#445/#394/#364** gesetzt
  (28.10.2026) und **#446** angelegt; **kein** Issue geschlossen, kein Label geändert.

## STAND HEUTE (28.10.2026, vier Bau-Issues geschlossen, FA-03 messbar, Backlog-Analyse) – historisiert durch den Abschnitt darueber

**Volltext dieser Sitzung: [`docs/agents/uebergabe-2026-10-28-session.md`](docs/agents/uebergabe-2026-10-28-session.md).**

- **Die M8-Kette der 23.10.-Übergabe ist DURCH:** **#316** (`8cbb5f9`, Merge `500c591`) –
  `einblendung.flaecheDunkel` als Pflichtfeld, kein Marken-Zugriff im `render-service`;
  **#317** (`4671f8d`, Merge `500c591`) – `config-store.leseMarke` samt Kanal **gelöscht**;
  **#339** (`4cd6336`, Merge `861632e`) – sechster Prüfpunkt, `flaecheDunkel` nur auf Form;
  **#338** (`a2cbf3d`, `4bd3289`, Merge `8154082`) – fünfte kaputte Art `aktion_marke`.
  Alle vier mit Beleg-Kommentar als `completed` geschlossen.
- **Gate: `npm run pruefung` Exit 0** – **5.645 Unit-Tests (334 Dateien)**, **49
  Integrationstests (12 Dateien)**, Treiber **0 Befunde**. Je Issue eine Gegenprobe belegt und
  byte-identisch zurückgenommen (#316 3/4, #317 7/4, #339 1, #338 4, FA-03 1). Dokumente
  unverändert (AD v1.9 / TK v3.28); `AGENTS.md` auf diesen Stand gezogen (`10adaba`).
- **Gemeldete Widersprüche:** bei #316/#317 fremde Fixtures/Specs mechanisch mitgezogen; bei
  #339 **kein** TK-Nachtrag (DoD verbietet Dateien außerhalb); bei #338 war die DoD-Zeile
  „keine Datei außerhalb der #131-Datei" **nicht haltbar** (13 Produktions-, 8 Testdateien), und
  `naht-typen-313.spec.ts` prüfte bis dahin das **Gegenteil** („composer trägt KEIN
  `marken`-Feld") – Probe mit Begründung umgedreht.
- **Messweg 4g3: die Gegenprobe hat NICHT gebissen** (`9bb8093`). Der FA-03-Befund vom 26.10.
  (3 von 4 Läufen rot) ließ sich durch `focusout` **nicht** erklären – ein Lauf gegen den alten
  Stand war am 27.10. ebenfalls grün. Die Änderung bleibt als Angleichung an #310, **nicht als
  Ursache belegt**; neu loggt 4g3 Fensterfokus, Feldfokus und aktives Element.
- **FA-03-Nachlauf: ein gescheitertes Speichern war unsichtbar – behoben** (`ea2c3ea`, Merge
  `fe27f5e`). `einspeisen` verwarf `{ ok: false }` vollständig (der Typ trug nicht einmal
  `fehler`); `feldVerlassen` kehrte still zurück, wenn die Auswahl auf eine verschwundene Aktion
  zeigte. Jetzt: `Nicht gespeichert: <Meldung des Mains>`. **FA-03 ist damit nicht gelöst,
  sondern messbar** – 4g3 protokolliert bei Fehlschlag Titelfeld, Zeilen, Formular- und
  Wurzel-Meldung.
- **Nebenbefund als #445 angelegt:** Im Modus „Neue Aktion" erreichen getippte Werte das Formular
  nie (`gewaehlt === null` → `feldVerlassen` kehrt vor dem Schreiben zurück; `formular.titel`
  bleibt `''`). Code-belegt, **nicht** am Fenster gemessen.
- **Backlog-Analyse (28.10., 25 offene Issues):** baubar ohne Rückfrage sind **#445**,
  **#394** (Dashboard ohne Aufrufer – montieren oder löschen), **#364** (Tainting), das
  Nachziehen der **Treiber-Matrix** (steht auf 21.10.), ein **FA-03-Issue** sowie Q1.2 und die
  Mutations-Chargen. **Nur der Auftraggeber** kann: **FA-13** freigeben (#100/#155 – die einzige
  zugesagte Funktion ohne Code), **#303** abnehmen, **#442** reproduzieren, **#443** und
  **#394** entscheiden, **FA-11/FA-12** optisch abnehmen, **pushen**.
- **Banner-Familie #365–#376 (12 Issues) ist blockiert**, bis der AD/TK-Nachtrag steht –
  #366/#367/#371 sind `braucht-entscheidung`. Ohne Nachtrag endet sie wie die Zwei-Screens-Ära.
- **Nächster Schritt (Vorschlag):** erst #445, #394, Matrix, FA-03-Issue (alle klein, machen den
  Backlog ehrlich), dann **FA-13** (#100/#155). **Push nur auf Anweisung** – `main` liegt vor
  `origin/main`, nichts gepusht.

## STAND HEUTE (27.10.2026, #316/#317/#338/#339 gebaut, gemergt, belegt – Gate Exit 0) – historisiert durch den Abschnitt darueber

- **Die M8-Kette aus der 23.10.-Übergabe ist DURCH.** Alle drei gebaut, auf `main` gemergt und
  mit Beleg-Kommentar als `completed` geschlossen:
  - **#316** (`8cbb5f9`, Test `86b4745`, Kommentar-Nachzug `c6becb1`): `einblendung.flaecheDunkel`
    ist **Pflichtfeld** im `RenderRequest`; `baueBand` füllt es zeichengleich aus
    `standardMarke.farben.flaecheDunkel` (Bindung aus #310, nicht der Parameter `marke`).
    `NormalisierKontext.flaecheDunkel` und `leseMarke()` im `render-service` entfallen – der
    `render-service` hat **keinen** Marken-Zugriff mehr. Merge `500c591`.
  - **#317** (`4671f8d`): `config-store/lese-marke.ts` samt Spec **gelöscht** (ENTSCHIEDEN 2:
    löschen statt leeren), `KANAELE.config` auf **vier** Einträge, Verdrahtung entlastet;
    `verdrahteConfigStoreIPC` behält Name und Signatur, `main/index.ts` unberührt. Merge `500c591`.
  - **#339** (`4cd6336`): **sechster** Prüfpunkt in `pruefeRenderRequest` – `flaecheDunkel` als
    `#RRGGBB`/`#RRGGBBAA`, **nur Form** (Muster ohne `g`-Flag, kein `lastIndex`-Zustand),
    Ablehnung über `ungueltiges_element` mit `daten.elementId`, gleicher Weg wie die fünf
    bestehenden Punkte. Merge `861632e`. **Kein Dokument-Nachtrag** – begründet: die DoD
    verbietet Änderungen außerhalb der #173-Datei (+ Test), und die TK führt für
    `ungueltiges_element` eine Beispielliste, keine abschließende Prüfpunkt-Zählung.
- **#338 ist ebenfalls gebaut und gemergt** (`a2cbf3d`, Beschriftung `4bd3289`, Merge
  `8154082`): `findeKaputteStellen` prüft die **fünfte** Art `aktion_marke` – eine
  `aktion.markeId` ohne Marke im Bestand ist **je Aktion genau eine** Stelle, **ohne**
  `elementId` (der Defekt hängt an der Aktion, nicht an der Zeile), hinten in der Liste.
  `null` als Bestand heißt „nicht geladen" und schaltet die Prüfung ab (`[]` hätte jede
  Aktion kaputt gemacht). **Der Shell-Vertrag `rechneStandNeu(stand, projekt)` blieb
  unverändert** – `App.tsx` liest den Bestand frisch aus dem ref.
  **Zwei gemeldete Widersprüche:** (a) Die DoD-Zeile „keine Datei außerhalb der
  #131-Datei" war nicht haltbar – ohne Prop und 9 Aufrufstellen hätte die Prüfung nie
  gelaufen; 13 Produktions- und 8 Testdateien geändert. (b) `naht-typen-313.spec.ts`
  prüfte bis dahin das **Gegenteil** („der composer trägt KEIN `marken`-Feld", #313
  ENTSCHIEDEN 2); die Probe ist mit Begründung umgedreht. Reparatur: nur
  `aktionsbild_reparieren` (öffnet den action-editor), Beschriftung dort „Marke der
  Aktion wählen"; ein eigener Marken-Wähler bleibt Folge-Issue.
- **FA-03-Nachlauf: ein gescheitertes Speichern war unsichtbar – behoben** (`ea2c3ea`, Merge
  `fe27f5e`). Nicht der Messweg war die Ursache, sondern der Code: `einspeisen` verwarf
  `{ ok: false }` **vollständig** (der Typ trug nicht einmal `fehler`), und `feldVerlassen`
  kehrte still zurück, wenn die Auswahl auf eine verschwundene Aktion zeigte. Jetzt zeigt das
  Formular `Nicht gespeichert: <Meldung des Mains>`; Erfolg löscht sie. 2 jsdom-Tests,
  Gegenprobe 1 Test rot, byte-identisch. **Der Treiber-Schritt 4g3 protokolliert bei einem
  Fehlschlag jetzt Titelfeld, Bibliothekszeilen, Formular- und Wurzel-Meldung** – der
  26.10.-Befund war unzuordenbar, weil keine dieser vier Angaben gemessen wurde.
  **FA-03 ist damit nicht „gelöst", sondern messbar** – der nächste rote Lauf nennt den Zweig.
- **Offener Nebenbefund als #445 angelegt:** Im Modus „Neue Aktion" erreichen getippte Werte
  das Formular nie (`gewaehlt === null` → `feldVerlassen` kehrt vor dem Schreiben zurück;
  `formular.titel` bleibt `''`, „Anlegen" scheitert). Code-belegt, **nicht** am Fenster gemessen;
  der stille Rückweg im Modus `bestehend` ist mit `ea2c3ea` zu.
- **Gate: `npm run pruefung` Exit 0** – **5.645 Unit-Tests (334 Dateien)**, **49
  Integrationstests (12 Dateien)**, Treiber **0 Befunde**. Je Issue eine Gegenprobe belegt und
  byte-identisch zurückgenommen (#316 3 bzw. 4 Tests rot, #317 7 bzw. 4, #339 1, #338 4,
  FA-03 1); Prüfsummen
  und Zahlen stehen in den Issue-Kommentaren. Dokumente unverändert (AD v1.9 / TK v3.28).
- **Messweg 4g3 nachgezogen – die Gegenprobe hat NICHT gebissen** (`9bb8093`). Der Schritt
  „Aktion bearbeiten" (FA-03) scheiterte am **26.10.** in drei von vier Läufen („Titel im
  project.json: ["Durchlauf-Aktion"]"); Verdacht war derselbe `blur()`-statt-`focusout`-Fehler
  wie am 23.10. (#310). Ein voller Lauf gegen den **alten** Stand war am 27.10. aber ebenfalls
  grün (`gefunden=true`, 0 Befunde, Prüfsumme `54eb697a…`). Die Änderung ist damit **nicht als
  Ursache belegt**; sie bleibt als Angleichung an die zwei Stellen vom 23.10. drin. Neu loggt
  der Schritt `Fensterfokus`, `Feld hatte Fokus` und das aktive Element danach (Gate-Lauf:
  `true / true / BODY`). **FA-03 bleibt unerklärt intermittierend – offener Punkt.**
- **`python3 tools/bereitschaft.py` (27.10.2026):** M0–M6 komplett, **M7 68/71** (bereit:
  #215, #240, #255 – vor dem Anfassen gegen den gebauten Code prüfen), **M8 59/60**, dort wird
  **#317 als „bereit" geführt**. Das ist eine **Werkzeuggrenze**, kein Baufehler: #317 bestand
  im **Löschen** der Datei, das Werkzeug misst „Datei existiert ohne Gerüst-Rumpf" und kann
  einen Lösch-Bauzustand grundsätzlich nicht sehen.
- **25 offene Issues** (Stand 28.10.2026): echte Lücke **#364** (media://-Tainting), neuer
  Befund **#445** („Neue Aktion" speichert nichts);
  M8-Nachlauf **#303** (Live-Vorschau); **#394**
  (Statistik-Dashboard gebaut, aber nirgends gerendert – „fertige Funktion ohne Aufrufer");
  Banner-Familie **#365–#376** (12); UI-2.0-Kandidaten **#383/#388/#391/#392/#393**; beim
  Auftraggeber **#442/#443**; aus der alten Ära **#100/#155** (FA-13).
- **Nächster Schritt:** **FA-13** (#100/#155 – `ANLEGBARE_ARTEN` um `einblendung` mit fester
  Bandhöhe 162 erweitern, AD v1.9/TK v3.28), dann **#364** oder **#303**. Ein Folge-Issue
  „eigener Marken-Wähler für eine kaputte Marken-Stelle" ist **nicht** angelegt. **Push nur auf Anweisung** – `main` liegt vor `origin/main`,
  **nichts gepusht** (Abstand bewusst nicht als feste Zahl geführt).

## STAND HEUTE (23.10.2026, FA-13 entschieden: Einblendung anlegbar, Bandhöhe fest 162) – historisiert durch den Abschnitt darueber

- **FA-13 ist entschieden (Auftraggeber, 23.10.2026):** Eigene Vorlagen der Art **Einblendung** sind
  über die Oberfläche **anlegbar**, mit **fester Bandhöhe 162 px**. Der Hintergrund ist ein
  **Scrim-Verlauf** `scrimStart` → `scrimEnde` (durchsichtig → 70 % Schwarz), **nicht** die deckende
  `flaecheDunkel`-Füllung. Feste Zonen: `hintergrund` + `logo` aus „Band-Standard"; es gibt keine
  eingebaute Einblendungs-Vorlage. Ein Deckkraft-Feld gibt es nicht – die Deckkraft folgt der
  Vorlagenart (TK 9.10.2).
- **Bewusste Anforderungsänderung, dokumentiert:** „Höhere Bänder sind über eigene Vorlagen möglich"
  (AD 4.5) und „Bandhöhe setzen" (TK 9.12.2) sind **zurückgenommen** – angelegt wird nur 162 px.
  Grund: Der Markenrahmen ist auf 162 px zugeschnitten; eine freie Höhe bräuchte eine Logo-Regel,
  die der Vertrag nicht festlegt (TK 9.11.1 Punkt 3: kein automatisches Umlayouten).
- **Dokumente synchron:** **AD v1.9 / TK v3.28**, Datum 23.10.2026, beide `.docx` neu erzeugt
  (`generate-docx.js`, ZIP geprüft, neuer Text im XML belegt). TK-Bezug auf AD v1.9 gezogen
  (stand vorher fälschlich auf v1.6).
- **Code-Stand:** **noch nicht gebaut.** `ANLEGBARE_ARTEN` hat weiterhin zwei Einträge; der
  Main-Zweig in `erstelle-vorlage.ts` lehnt `einblendung` mit `unbekannter_fehler` ab. Die
  Treiber-Matrix führt FA-13 deshalb weiter als **teilweise**.
- **`python3 tools/bereitschaft.py` (23.10.2026):** M0–M6 komplett, **M7 68/71** (3 „bereit":
  #215, #240, #255 – vor dem Anfassen gegen den gebauten Code prüfen), **M8 60/60**. Deckt sich
  mit der Übergabe vom 22.10.
- **Backlog-Abgleich (Charge 1) durchgeführt (23.10.2026):** von **322 offenen Issues** auf
  **28** – **6 BK-Issues (#354–#359)** als `not planned` (verworfene Zwei-Screens-Ära), **288**
  gebaute/überholte Issues mit Beleg-Kommentar als `completed` geschlossen, **6 nach Prüfung
  wieder geöffnet** (#100/#155/#303/#310/#316/#317); #310 ist inzwischen gebaut. Grundlage war eine Messung (Signatur im Code
  definiert + genannte Datei ohne Gerüst-Rumpf + Commit-Nennung + Aufrufer-Grep), keine bloße
  Altersschätzung. **Grenze der Messung:** Sie erkennt weder einen offenen Teilzweig (#100/#155)
  noch eine fehlende Einzel-Edit in einer sonst gebauten Datei (#316/#317) – die DoD muss gegen
  den Code gelesen werden. Details:
  [`docs/agents/uebergabe-2026-10-23-session.md`](docs/agents/uebergabe-2026-10-23-session.md).
- **Drei Befunde aus dem Abgleich, die offen bleiben:** **#394** (Statistik-Dashboard gebaut, aber
  nirgends gerendert – „fertige Funktion ohne Aufrufer"), **#338** (findeKaputteStellen ohne
  Marken-Referenzprüfung; der neue Befund fällt im Reparatur-Modus in `default: []` – Entscheidung:
  bestehende Optionen, „Marke wählen" als Folge-Issue), **#316/#317/#339** (M8-Kette: `flaecheDunkel` fehlt im RenderRequest, der
  `render-service` liest die Marke weiter zur Laufzeit, die Formprüfung fehlt). `.gitignore` deckt
  die Laufzeitartefakte bereits seit 22.10. ab; #442-Label `braucht-entscheidung` entfernt.
- **#310 ist gebaut und gemergt** (`e3e8053`): `stelleMarkeBereit(projekt.standardMarkeId)` nur bei
  Bandspur, genau einmal je Aufruf; `marke_nicht_ladbar`; Band-Abschnitte zeichnen mit der
  Standardmarke als viertem Argument. **Der erste Gate-Lauf war rot (16 Befunde im Marken-Editor);
  die Diagnose zeigte einen Messfehler, keinen App-Fehler:** Reacts `onBlur` hängt an `focusout`,
  der Treiber nutzte `blur()`, das in einem nicht fokussierten Fenster nicht feuert. Der Fix im
  Treiber (4m/4m2 dispatcht `focusout`) ist belegt; `npm run pruefung` **Exit 0** (5.627
  Unit-Tests, 49 Integrationstests, Treiber ohne Befund). Gegenprobe #310: 2 Tests rot, Rücknahme
  byte-identisch.
- **Die 28 offenen Issues:** M8-Kette #316/#317/#339, FA-13-Bau #100/#155, Review #303,
  Banner-Familie #365–#376 (12), echte Lücken #338/#364, UI-2.0-Kandidaten
  #383/#388/#391/#392/#393/#394, beim Auftraggeber #442/#443.
- **Nächster Schritt:** **#316** (`flaecheDunkel` in den Request, Laufzeit-Lookup raus), dann
  **#317** (`config-store.leseMarke` + Kanal löschen), dann **#339** (Formprüfung), je mit Tests
  und Gate. Danach #338 mit den bestehenden Optionen, dann **FA-13** (#100/#155).
  **Push nur auf Anweisung.**

## STAND HEUTE (22.10.2026, zweite Sitzung: Live-Vorschau montiert, Muss-Luecken gemessen, B14–B18) – historisiert durch den Abschnitt darueber

**Der volle Session-Stand steht in [`docs/agents/uebergabe-2026-10-22-session-2.md`](docs/agents/uebergabe-2026-10-22-session-2.md) – LIES DIESE DATEI ZUERST.**

- **Reihenfolge Punkt 2 ist erledigt: die Live-Vorschau des Marken-Editors ist MONTIERT**
  (A1, #303/#330). Drittes Prop `vorlagen: VorlagenZugang`, neuer Baustein
  `marken-editor/vorschau-flaeche.tsx`, fester Zeichenweg `zeichneMarkenVorschau` mit der
  Vorlage **„Vollbild"**. Vorbereitung: `stelleSchriftenBereit()` →
  `stelleMarkenSchriftenBereit(marke)` → `bereiteLogoVor(marke)`; **kein** `stelleMarkeBereit`,
  **kein** `ZeichenZugang`, kein Projekt. Treiber **4m** misst
  `Live-Vorschau GEMESSEN: Canvas 1920x1080`.
- **Drei echte Befunde, die erst die Vorschau sichtbar machte – alle behoben:**
  1. **B14:** Die CSP erlaubte `marken:` weder in `font-src` noch in `connect-src` –
     importierte Schriften/Logos wurden blockiert. Jetzt `marken:` in beiden (Dev + Prod).
  2. **B15:** `MARKEN_SCHEMA` fehlte `corsEnabled`; Chromium blockierte danach JEDEN
     `fetch(marken://…)` per CORS. Die in #290 als Experiment gefuehrte Probe ist damit
     entschieden; `corsEnabled: true` steht im Schema.
  3. **B16:** Eine **abgeleitete** Marke mit importierter Schrift baute die URL mit der
     **Kind-Kennung** → 404 (die Datei liegt beim Parent, TK 9.15.3). Beide Ladewege waehlen
     die Quell-Kennung jetzt ueber `herkunftJeFeld` (`geerbt` → Parent); der Bestand bleibt
     unter der eigenen id. Kein Kopieren, keine zweite Wertquelle.
- **Messweg verbessert:** Fenster-Konsole-Befunde tragen die **Quell-URL**; 4m2 listet
  `marken-assets/<id>` auf. Beides hat B16 erst zuordenbar gemacht.
- **Gate:** `npm run pruefung` **Exit 0**; `lint`/`typecheck` 0. Details in der Session-Datei.
- **Widerspruch gemeldet:** #330 traegt seit 23.08. den Nachtrag „`stelleMarkeBereit`"; A1
  (22.10.) sagt das Gegenteil. Es gilt A1 (juenger, Auftraggeber).
- **Reihenfolge Punkt 3 ist ebenfalls gebaut und gemessen** (Treiber 4b7, 4c2, 4f5, 4g3, 4n):
  FA-01 (Ersetzen mit Rueckfrage, genau ein Video), FA-03 (Aktion bearbeiten), FA-22
  (Vorbelegung/Ersetzen/zweite Ausgabe), FA-08 (`ffprobe 12,022 s` gegen Anzeige `12 s`),
  FA-13 (Vorlage anlegen/Zone/uebernehmen/verwerfen). **Matrix: 10 gemessen, 11 teilweise,
  0 Luecke, 3 manuell; Muss: 8 von 15.**
- **Zwei weitere echte Befunde dabei behoben:**
  - **B17:** „+ Textzone (titel)" bestellte eine nicht existierende Sorte (`text-formatiert`)
    und tat NICHTS; jetzt `{ sorte: 'text', bindung: 'titel' }`, Verhaltenstest.
  - **B18:** Video-Ersetzen filterte nur die SICHT; im `project.json` standen danach ZWEI
    Video-Elemente. Jetzt wird das alte Element ueber `entferneElementAusListe` im Bestand
    entfernt.
- **Offene DESIGNENTSCHEIDUNG (User):** FA-13 – soll „Einblendung" ueber die Oberflaeche
  anlegbar sein, und mit welcher Hoehe/Deckkraft? `ANLEGBARE_ARTEN` bietet nur `vollflaeche`
  und `split`; der Store kennt `einblendung`. Deshalb bleibt FA-13 **teilweise**.
- **Noch offen:** Issue-Kommentare zu #303/#330 und #290 sind gesetzt; die #442-Diagnose
  (Ursache am Nutzerpfad) bleibt offen, das Label `braucht-entscheidung` ist veraltet.
- **Naechster Schritt:** **Backlog-Abgleich (Charge 1)** – 322 offene Issues, alte/gebaute
  schliessen, BK-01…06 als `not planned`, `.gitignore` fuer Laufzeitartefakte. Danach
  Oberflaeche 2.0/Banner (erst AD/TK-Nachtrag). **Push nur auf Anweisung.**
  Die kurze Einstiegsdatei ist [`UEBERGABE-NAECHSTE-SESSION.md`](UEBERGABE-NAECHSTE-SESSION.md).

## STAND HEUTE (22.10.2026, frueher: FA-24 am echten Fenster, B9/B10, Treiber-Flakiness) – historisiert durch den Abschnitt darueber

**Der volle Session-Stand steht in [`docs/agents/uebergabe-2026-10-22-session.md`](docs/agents/uebergabe-2026-10-22-session.md) – LIES DIESE DATEI ZUERST.**

- **FA-24 ist gemessen – die Matrix hat KEINE Luecke mehr.** Treiber-Schritte **4m/4m2**
  (Branches `bau/treiber-fa24` und `bau/treiber-fa24-rest`): Marke ueber die Oberflaeche **anlegen und oeffnen**,
  **Akzentfarbe frei** setzen (Wert im Bestand V2), **Kontrast-Warnung** am Grenzwert
  ("4.13:1 … mindestens 4.50:1") **ohne Sperre**, **Ableiten** mit `abgeleitet` und
  Herkunftszeilen. **4m2:** **alle dreizehn Farbrollen** (13/13 im Bestand), **Slogan** und
  **Sicherheitsabstand** schreiben, **Wachstums-Hinweis**, **Bearbeiten einer abgeleiteten
  Marke** (eigen -> geerbt), **Import-Pipeline** fuer Schrift/Logo mit echten Dateien
  (`herkunft: importiert`), **Logo entfernen**. Matrix jetzt **6 gemessen, 15 teilweise,
  0 Luecke, 3 manuell**; **Muss: 4 von 15** (FA-05/17/23/24). **MANUELL** bleibt nur der native
  Dateidialog beim Import (wie FA-09/Export).
- **Drei echte Produktbefunde, behoben und gegengeprobt:**
  1. **B9 – Stand des ERSTEN Aufbaus:** Nach dem Oeffnen einer Marke mit 96/54 px standen im
     Abstands-Feld **0/0**; ein Klick auf "Abstand uebernehmen" haette den Sicherheitsabstand
     (TK 9.11.4) still zerstoert. `slogan`/`sicherheit` sind Momentaufnahmen und werden jetzt
     im Abo auf die geoeffnete Marke gezogen.
  2. **B10 – alter Farbwert nach dem Wechsel:** Nach dem Bearbeiten von Marke A zeigte das
     Akzentfeld bei Marke B weiter `#808080` (unkontrolliertes `defaultValue`, React benutzt
     dasselbe DOM-Element). Der naechste `onBlur` haette den Wert in B geschrieben. Jetzt
     traegt `marken-offen` `key=<markeId>` und wird beim Wechsel neu aufgebaut.
  3. **B12 – Logo entfernen lieferte das gebuendelte Fremdlogo:** Nach Import + Entfernen
     stand bei einer eigenstaendigen Marke das **Baller-Logo** im Bestand, obwohl der Hinweis
     den Markennamen verspricht. **Entschieden (#440, 22.10.):** eigenstaendig -> `null`
     (Ersatz-Logo), eingebaut -> gebuendelt; Schriften bleiben gebuendelt (Pflichtfeld).
  Gegenproben: je **1 Test rot** (bzw. 2 bei B9), Ruecknahme byte-identisch
  (Pruefsummen `8fbcda44…c123e6`, `b5305feb…dc13e`).
- **Treiber-Flakiness beendet** (eigener Commit): `scripts/durchlauf.mjs` startete Electron
  **zweimal** (spawn + puppeteer.launch); die Einzelinstanz liess einen gewinnen, verlor der
  gesteuerte Prozess, starb der Frame mitten im Lauf ("detached Frame", stummer Haenger –
  am 22.10. dreimal an verschiedenen Stellen). Jetzt **EIN** Start, dazu Hoerer fuer
  Fenster-Crash und Fenster-zu. Danach `npm run durchlauf` **Exit 0**.
- **Drei Messweg-Korrekturen** (kein App-Fehler): 4a0 zaehlte die Knoepfe "Neue Marke"/
  "Ableiten" als Marken (3/4 statt 1/2); getippte Zeichen im kontrollierten Namensfeld wurden
  verschluckt (jetzt nativer Setter + `input`); das Aufraeumen loescht abgeleitete Marken
  **vor** ihrer Basis.
- **#441 behoben (B13):** `löscheMarke` räumt jetzt `marken-assets/<markeId>/` mit ab
  (rekursiv, best effort, erst nach dem Bestands-Schreiben; ein Dateifehler macht das
  Löschen nicht rückgängig). Drei Verhaltensproben, Gegenprobe beißt; Treiber 4m2 belegt
  `Ordner nach dem Loeschen: false`.
- **Gate:** `npm run pruefung` **Exit 0** – **5.609 Unit-Tests (333 Dateien)**,
  **49 Integrationstests (12 Dateien)**, Treiber ohne Befund **und ohne Untersuchung**;
  Typecheck/Lint 0.
- **Ehrlich offen:**
  - **Backlog:** **322 offene Issues**, davon **295 aus der alten M-Aera (≤ #380)** und **103**
    mit `braucht-entscheidung` - ueberwiegend gebauter Code oder die **verworfene**
    Zwei-Screens-Aera. Vor dem naechsten Bauabschnitt **abgleichen** (Charge 1 der Reihenfolge).
  - **Live-Vorschau** des Marken-Editors ist gebaut, aber **nicht montiert**; der Weg ist
    **entschieden** (siehe unten).
  - **Mutations-Chargen** 138/92 offen.
- **Nicht gepusht.**
- **B5 geschlossen (Gate-Blindstelle):** `scripts/durchlauf.mjs` wertet jedes eindeutige
  `console.error` aus dem Fenster als **Befund** ("Fenster-Konsole") - „Maximum update depth"
  kann nicht mehr durch ein gruenes Gate laufen. `console.warn` bleibt Log-Hinweis.
  Gegenprobe: eingebautes `console.error("SEMPEL-B5")` -> **Exit 2**, Rücknahme
  byte-identisch (`a4adeb90…c928cff1c`), Lauf wieder Exit 0.
- **#433 abgenommen (User, 22.10.2026):** Filmstreifen am echten Fenster bestaetigt, keine
  Aenderung an Dichte/Hoehe/Standard-Zoom. Treiber 4b4 (1 -> 6 Bilder bei 128 px/s) und die
  Sichtpruefung sind die Belege; #433 geschlossen.
- **Entscheidungen (Auftraggeber, 22.10.2026):**
  1. **Live-Vorschau (#303):** `vorlagen: VorlagenZugang` als drittes Prop + **eigene
     Vorbereitung** mit `stelleMarkenSchriftenBereit(marke)`/`bereiteLogoVor(marke)`; **kein**
     `stelleMarkeBereit`, **kein** `ZeichenZugang`, kein Projekt. Feste Vorlage „Vollbild".
  2. **#442:** gemeint ist eine **Aktion an einer Zeitstelle im Video** (Unterbrechung, TK 9.2.9),
     kein neues Modell. Offen ist die Diagnose, warum der Weg beim User nicht greift (4b6 belegt
     den vollflaechigen Weg; Band-Aktionen gehen in den Band-Weg, #437).
  3. **#443:** **Kern-Set** (Play/Pause, Scrubbing, Zeit, Lautstaerke/Stumm, Vollbild, ±5 s) als
     **Hover-Overlay** (YouTube-Muster); Geschwindigkeit/Tastatur spaeter.
  4. **Banner:** verbindlich ist die **BA-Familie #365+** (`BannerSchild`), **erst nach
     AD/TK-Nachtrag**. **Aktions-Editor inline** im Projekteditor; **Videobearbeitung im
     selben Editor** (nachrangig).
  Hinterlegt an #303/#442/#443/#365 und in `docs/agents/oberflaeche-2-0-plan.md`.
- **Reihenfolge (vereinbart):**
  1. **Backlog-Abgleich** (alte/built Issues schliessen, BK-01…06 verwerfen, `.gitignore` fuer
     Laufzeitartefakte).
  2. **Live-Vorschau Marken-Editor** (A1).
  3. **Muss-Luecken:** FA-01/03 (+ #442-Diagnose), FA-22, FA-13, FA-08.
  4. **Oberflaeche 2.0 / Banner:** AD/TK-Nachtrag, dann #365-#373/#371, Aktions-Editor inline,
     #443, Videobearbeitung.
  5. **Qualitaet:** Q1.2, Mutationschargen; **Push nur auf Anweisung**.
- **Naechster Schritt:** **Backlog-Abgleich** starten (Charge 1), dann die Live-Vorschau montieren.

## STAND HEUTE (21.10.2026: FA-17/18/23 am echten Fenster, drei Produktbefunde, UI-Ausrichtung) – historisiert durch den Abschnitt darueber

**Der volle Session-Stand steht in [`docs/agents/uebergabe-2026-10-21-session.md`](docs/agents/uebergabe-2026-10-21-session.md) – LIES DIESE DATEI ZUERST.**

- **FA-17/18 sind jetzt am echten Fenster gemessen** (Treiber-Schritte **4k/4l**,
  Branch `bau/treiber-fa17-18`). **4k:** Import einer fehlenden Datei -> Zeile
  `fehlgeschlagen` mit Klartext-Grund und "Erneut versuchen"; Datei nachgereicht, Retry ->
  Auftrag aus Q1/Q2 weg, **Asset in D1**. **4l:** 30-Elemente-Render laeuft, ein dahinter
  eingereihter Import steht `wartet` und wird entfernt (Render laeuft weiter); danach
  "Render abbrechen" mit Rueckfrage -> Zeile weg, Stand leer, **keine Ausgabedatei**.
- **FA-23 ist ebenfalls gemessen** (Schritte **4a0/4a/4a2**): zweite Marke ueber die echte
  Oberflaeche angelegt, Standardmarke am echten `<select>` **gezielt** gewechselt und in
  `project:listeProjekte` belegt; Loeschversuch der genutzten Marke **gesperrt** mit
  Projekt-Grund und Ausweg, nach dem Zurueckstellen **geloescht**. Der Schritt-5-Aufraeumen
  loescht `DurchlaufMarke-*` (auch Reste abgebrochener Laeufe).
  Matrix: **5 gemessen** (FA-05/17/18/19/23), 15 teilweise, **1 Luecke** (FA-24), 3 manuell.
- **Drei echte Produktbefunde gefunden und behoben:**
  1. **Terminale Zeile blieb in der Leiste** (25 s nach Erfolg, 30 s nach Abbruch):
     `beende-auftrag.ts` meldete `queue:geaendert` nur VOR dem Q1-Entfernen; der im
     Kommentar vorausgesetzte "zweite Push" existierte nie. Jetzt zweiter Push nach
     `entferneAusQ1`; Verhaltens-Test prueft die Reihenfolge und dass die zweite Meldung
     den Auftrag nicht mehr traegt.
  2. **"Erneut versuchen" erreichte die Sicht nicht:** `auftrags-nachlauf.ts` merkte sich
     die `auftragId` - ein Wiederholungsversuch behaelt sie (TK 9.3.3), nur `versuche`
     steigt. Der spaetere Erfolg fiel unter den Tisch (Galerie blieb bei 2, D1 hatte 3).
     Jetzt Merker-Schluessel `auftragId:versuche`.
  3. **Der "Ausweg" aus der Marken-Loeschsperre war eine Sackgasse:** Besuchte Reiter
     bleiben montiert (TK 9.14.2); die `loeschvorschau` im `marken-editor` wurde beim
     Oeffnen einer Marke nie zurueckgesetzt. Nach dem Zurueckstellen der Standardmarke
     blieb die Blockade stehen, ohne Loesch-Knopf. Jetzt setzt der Hoerer auf die
     geoeffnete Marke die Vorschau zurueck.
- **UI-Ausrichtung fuer „Oberfläche 2.0" (21.10.2026, User bestaetigt; noch keine
  AD/TK-Anforderung):** Im Projekteditor liegt der Fokus auf **Aktionsverwaltung, Einfuegen,
  dem Erstellen guter Aktionen und der Banner-Spur**; evtl. Videobearbeitung. **Eine eigene
  Bilder-/Videoverwaltung entfaellt als Flaeche** - Bilder und Videos sind Teil der Aktion.
  **Bestaetigt:** „Banner" = Banner-Spur / `BannerSchild` (BA-Familie #365+); das eine
  Projektvideo behaelt seinen schmalen Import/Ersetzen-Weg (FA-01/#422). Begruendung des
  Users: „so macht die ui keinen sinn". **Zuordnung:** Abschnitt 6 in
  [`docs/agents/oberflaeche-2-0-plan.md`](docs/agents/oberflaeche-2-0-plan.md); Volltext in
  [`docs/agents/ui-ausrichtung-projekteditor-2026-10-21.md`](docs/agents/ui-ausrichtung-projekteditor-2026-10-21.md).
  Ein Umbau braucht erst Entscheidung + AD/TK-Nachtrag + Issue (kein Umbau ohne Plan).
- **Alle drei Gegenproben** beißen und sind byte-identisch zurueckgenommen (Pruefsummen in
  der Session-Datei).
- **Gate:** `npm run pruefung` ohne `Befund` - **5.602 Unit-Tests (333 Dateien)**, **49
  Integrationstests (12 Dateien)**, Typecheck/Lint 0.
- **Ehrlich offen:** Gate wertet `console.error` nicht (B5); **FA-24** ist die letzte
  Matrix-Luecke; Fehlschlag eines **Renders** und Entfernen waehrend eines Abbruchs sind
  ungemessen; **#433** optische Abnahme beim User; Mutations-Chargen 138/92 offen.
- **Branches `bau/treiber-fa17-18` und `bau/treiber-fa23`** wurden nach `main` gemergt
  (Merges `17b3175`, `d19a12a`); `main` steht **119 Commits vor `origin/main`**.
  **Nicht gepusht.**
- Naechster Schritt: **FA-24** (Marken-Editor) oder die **Gate-Blindstelle** entscheiden.

## STAND HEUTE (20.10.2026: Matrix, #257, Update-Loop, Mutationstests) – historisiert durch den Abschnitt darueber

**Der volle Session-Stand steht in [`docs/agents/uebergabe-2026-10-20-session.md`](docs/agents/uebergabe-2026-10-20-session.md) – LIES DIESE DATEI ZUERST.**

- **Treiber-Matrix gebaut** (`docs/agents/treiber-matrix.md`, Waechter
  `tests/unit/treiber-matrix.spec.ts`): alle **24 FA** gegen die Treiber-Schritte gemappt,
  Status nur fuer das echte Fenster. Befund: **1 von 15 Muss** war vollstaendig gemessen
  (FA-05). Der Waechter prueft Vollstaendigkeit (jede FA genau eine Zeile, jede genannte
  Kennung existiert, jeder `schritt-4*` ist zugeordnet) - **nicht** die Wahrheit der
  Statusspalte.
- **#257 GEBAUT, gemergt und geschlossen** (`056d21b`, Merge `3189564`):
  `queue-panel/index.tsx` ist die Modul-Wurzel (Sicht genau einmal, danach Fortschritt;
  Klappzustand, Rueckfrage, eine Meldung; Schalter aus #209/#210, Fehlertext aus #211).
  Der **leere Platzhalter** `warteschlangen-leiste.tsx` ist geloescht, `App.tsx` importiert
  `./queue-panel` (Abweichung von der Issue-Dateiliste im Issue-Kommentar gemeldet).
  Treiber-Schritt **4j** misst: Leiste da, eingeklappt, geholter Stand, ueberlebt den
  Reiterwechsel, klappt auf (1 Auftragszeile). **FA-16 ist damit teilweise gemessen**;
  FA-17/18 sind erreichbar, aber noch ohne Treiber-Szenario.
- **Update-Loop gefunden und behoben** (`docs/agents/update-loop-2026-10-20.md`,
  `189b274`, Merge `ca403c7`): `baueReiterInhalte` wurde bei jedem App-Rendern gerufen;
  seine Rueckgabe-Funktionen sind die Komponententypen im Rahmen - jeder App-Render
  **mountete den aktiven Reiter neu** (gemessen: **2.300** Effekt-Durchlaeufe, > 1.900
  Composer-Initialisierungen), der Reparatur-Effekt meldete erneut. Jetzt sind die
  Reiterinhalte je Zugaengen-Satz memoisiert und die Umgebung reist als **Getter**.
  Nachher: **12** Effekt-Durchlaeufe, **keine** `Maximum update depth`-Meldung. Neuer
  Waechter in `app-einhaengung.spec.ts` (App-Rendern baut die Inhalte nicht neu).
- **Gate:** `npm run pruefung` **Exit 0** - **5.600 Unit-Tests (333 Dateien)**, **49
  Integrationstests (12 Dateien)**, Treiber ohne Befund. Typecheck/Lint 0.
- **Mutations-Piloten** (`docs/agents/mutation-pilot-2026-10-20.md`): **vier Runden, 18
  Dateien** gegen **130 Verhaltens-Mutationen** und **20 harmlose Refactorings**. **124**
  Mutationen erkannt, **6** nachweislich aequivalent; **0/20** Refactorings rot. **Sieben
  echte Luecken** gefunden und geschlossen (u. a. `aktuelleStelle` mit `zeigerIndex > 0`,
  `aktuelleRenderId` mit laufendem Import vor Render, Undo-Tiefe 1, `aria-selected`,
  Mindestkante 8 px, Referenz statt Kopie bei `loeseSchrift`). **109 Quelltext-/Meta-Tests
  entfernt**, **7 Verhaltens-Tests ergaenzt**. Suite **5.600 Tests**. Befund: Die
  Behavior-Tests der 18 Dateien sind **nicht** Ballast; der belegte Ballast ist die
  Kategorie Quelltext-/Signatur-Probe (verbleibend: **138** Dateien mit `readFileSync`,
  **92** mit Grep-/Bauvorschriften-`describe`).
- **Ehrlich offen:**
  - **Gate-Blindstelle:** Der Treiber wertet `console.error` nicht; "Maximum update depth"
    waere trotz grünem Lauf sichtbar gewesen. Ein Befund-Rang dafuer ist **nicht** gebaut.
  - **FA-17/18** (Fehlschlag provozieren, Wiederholen, Entfernen/Abbruch) brauchen ein
    eigenes Treiber-Szenario; ein dauerhaft fehlgeschlagener Auftrag bleibt in Q2.
  - **#433** optische Abnahme steht weiter beim User.
- `main` **105 Commits vor `origin/main`**; **nicht gepusht**.
- Naechster Schritt: **#433** beim User oder das **FA-17/18-Treiber-Szenario**.

## STAND HEUTE (19.10.2026, dritte Sitzung: Q3 GEBAUT UND GEMERGT) – historisiert durch den Abschnitt darueber

**Der volle Session-Stand steht in [`docs/agents/uebergabe-2026-10-19-session-3.md`](docs/agents/uebergabe-2026-10-19-session-3.md) – LIES DIESE DATEI ZUERST.**

- **Q3 (Prozess-Fragmentierung) ist komplett gebaut und gemergt** – Programm
  `docs/agents/codequalitaet-programm.md` (Stand dort nachgetragen):
  - **Q3/A:** EINE `meldeAn` (`melde-an.ts`), **sechs** lokale Kopien entfernt – **#337 geschlossen**
    (`f91c2b3` / Merge `495bc0c`). Gemessene Abweichung zu #337: sechs statt drei Kopien, Pfade
    unter `ipc-gateway/` statt `project-store/` (gebauter Code gewinnt).
  - **Q3/C:** **15** Platzhalter-`index.ts` gelöscht; `renderer/shell/` aufgelöst
    (`WarteschlangenLeiste` → `queue-panel/warteschlangen-leiste.tsx`), `406b1f4`.
  - **Q3/B:** fünf `project-store-nachtrag*.ts` → **eine** Datei; `vorlagen-nachtrag.ts` in
    `vorlagen-store/ipc-verdrahtung.ts` (`14c3075`+`484eea2`, Merges `aa12d3c`+`f84ee2a`).
    **Die Einstiegspunkte bleiben** – die Positionen 1–14 in `main/index.ts` sind Vertrag aus #3.
    Befund: die alte Begründung „Eintragszahl darf nicht überschritten werden" ist **nirgends
    geprüft**, sie stand nur in Kommentaren.
- **#433 bleibt offen** – optische Abnahme am echten Fenster steht weiter aus (User konnte noch
  nicht testen). Der Dev-Lauf wurde sauber beendet, kein Waisenprozess.
- **Q4-Audit GEBAUT** (`docs/agents/q4-test-audit.md`): Baseline (331 Dateien, 4.607 `it`,
  559 `vi.mock`, 132 Dateien ohne Mock), Methode und **alle 20 Verdachtsfälle gelesen –
  20 × `halten`**. Fazit: **keine Deleting-Welle**; das Problem war das **Gate**, nicht die
  Tests. `npm test` lief nur `tests/unit/**`.
- **Q4-Gate GEBAUT:** `npm run pruefung` = `build` → `test` (Unit) → `test:integration` →
  `durchlauf`. Der Treiber setzt jetzt auch bei einem Fund der Schwere **`Befund`** Exitcode 2
  (`Untersuchung`/`MANUEL` bleiben Hinweise). **Ein vollständiger Lauf ist grün:**
  5672/331 + 49/12 + Treiber ohne Befund.
- **Drei echte Befunde beim ersten Gate-Lauf behoben (nicht kosmetisch):**
  1. `standardmarke.tsx` ließ eine abgelehnte `aufWechsel`-Zusage als **unbehandelte
     Rejection** entkommen (fix: `catch` im `finally`-Muster) – das blockierte das Gate.
  2. `marken-dateien.spec.ts` racing mit der entprellten Auto-Speicherung (`ENOTEMPTY` im
     `afterEach`); fix: `flushBestand()` + `maxRetries` vor dem Aufräumen.
  3. Zwei Integrationstests widersprachen dem gebauten Code bzw. der Plattform:
     `dateisystem-erkennung-echt` erwartete auf macOS `null` (gebaut ist `diskutil` →
     `'anderes'`), `standbild-echt` maß die Frist über `signal` (ffmpeg fängt SIGTERM) –
     jetzt über `dauerMs`.
- **Belege:** Typecheck/Lint 0, `npm run pruefung` **Exit 0** (Build + Unit + Integration +
  Treiber). Der frühere `standardmarke-anzeige`-„error" ist damit **weg**.
- **S6 (Leichen bewertet und entfernt) GEBAUT und gemergt** (`55d840a`, Merge `3eeccf6`):
  In `composer/index.tsx` standen die S0-Leichen unverändert – `Zeile` (34 Zeilen),
  `const gesamt` und **fünf** weitere Importe, alle nur durch die dateiweite
  `eslint-disable`-Zeile verdeckt. Alle hatten **keinen Aufrufer** (Grep je Name) → gelöscht,
  **Abschaltzeile weg**. Datei **985 → 948**. Beleg: Lint 0 **ohne** Abschaltzeile,
  `npm run pruefung` **Exit 0**. Der Composer-Umbau S1–S6 ist damit **abgeschlossen**
  (`docs/agents/composer-umbau-plan.md`).
- **Q4-3 begonnen** (`0292fe7`, Merge `9d84872`): Die erste Zusage, die bisher nur der
  Unit-Test hielt, misst jetzt der **Treiber Schritt 4h** am echten Fenster: **FA-19 /
  TK 9.7.5 – „Render erst frei, wenn alles behoben"**. Beleg: `Render-Sperre GEMESSEN:
  Knopf gesperrt, Fortschritt "0 von N behoben"`. `npm run pruefung` **Exit 0**.
  - **Vierter Fall (#438) am Fenster belegt** (Treiber-Schritt **4i**): Bild-Asset aus 4b3,
    Aktion mit Bild, Einschub per `setzeUnterbrechungen`, Bilddatei löschen, Projekt über die
    Liste neu öffnen. Beleg: `Vierter Fall GEMESSEN: unterbrechung · asset_fehlt – Render
    gesperrt, 0 von 1 behoben`.
  - **Dabei einen echten UI-Fehler gefunden und behoben:** Der Reparatur-Stand wurde nur
    **gestartet**, nie neu gerechnet – nach Projektwechsel/Aufräumen stand die **alte** Stelle
    im Panel. Jetzt rechnet `composer/index.tsx` bei jedem neuen Projektstand einmal neu
    (Referenz-Wache gegen Schleifen).
  - **Offen:** eine **Treiber-Matrix „Anforderung → Szenario"**, damit Lücken sichtbar werden.
- `main` **86 Commits vor `origin/main`**; **nicht gepusht**.
- Nächster Schritt: **Treiber-Matrix** oder **#433**. **#433** bleibt beim User.

## STAND HEUTE (19.10.2026, zweite Sitzung: #438 GEBAUT UND GEMERGT, #426-Familie geschlossen) – historisiert durch den Abschnitt darueber

**Der volle Session-Stand steht in [`docs/agents/uebergabe-2026-10-19-session-2.md`](docs/agents/uebergabe-2026-10-19-session-2.md) – LIES DIESE DATEI ZUERST.**

- **#438 (Kaputt-Erkennung, vierter Fall) GEBAUT und gemergt** (`d2ebbbc`, Merge `bfbf1df`):
  `findeKaputteStellen` erkennt auch eine **Unterbrechung**, deren Aktion fehlt bzw. deren
  Aktionsbild ein `fehlt`-Asset ist – als eigene vierte Stelle, die den Render sperrt
  (`istRenderFreigegeben` = false). **Zuerst** wurde **TK 9.7.5 von „drei" auf „vier"**
  fortgeschrieben, Kopf auf **TK v3.27 / 19.10.2026**, `.docx` neu erzeugt. Neuer Typ
  `unterbrechung`, neue Fix-Optionen `unterbrechung_ersetzen`/`unterbrechung_entfernen`,
  neues Uebergabe-Ziel `unterbrechungs-auswahl` (eigene Anzeige `app-shell/unterbrechungs-auswahl.tsx`).
  **Ueber die Issue-Dateiliste hinaus** verdrahtet (sonst Sackgasse) – im Issue-Beleg benannt.
- **Gegenprobe #438:** `unterbrechungen`-Zweig entfernt → **9 Tests rot**; Ruecknahme
  byte-identisch (Pruefsumme `a030205391d23c865ebf70ea54acbd070285b939036d5c0eca1ed66aced40b1d`).
- **Volllauf 5672 Tests gruen (331 Dateien)**, Typecheck/Lint 0 (der eine gemeldete „error"
  ist der bekannte `standardmarke-anzeige`-Vorbefund, kein Test rot).
- **Auf GitHub geschlossen:** **#436**, **#437**, **#438** und das **Eltern-Issue #426**
  (alle vier Bau-Issues #434–#437 sind durch). Beleg-Kommentare je Issue.
- **Ehrlich offen:** `kaputteUnterbrechungen` (Feld in `liste-ansicht.ts`) wird noch von
  keiner Komponente angezeigt – Markierung im Video-Block ist ein eigener optischer Schritt.
- `main` **64 Commits vor `origin/main`**; **nicht gepusht**.
- Naechste Sitzung: **#433 optisch abnehmen**; im Programm **Q3/Q4/Q1.2**, danach **S6**.

## STAND HEUTE (19.10.2026, #436/#437 Unterbrechungen GEBAUT UND GEMERGT, #438 Luecke) – historisiert durch den Abschnitt darueber

**Der volle Session-Stand steht in [`docs/agents/uebergabe-2026-10-19-session.md`](docs/agents/uebergabe-2026-10-19-session.md) – LIES DIESE DATEI ZUERST.**

- **#436 (Vorschau) GEBAUT und gemergt** (`e326926`, Merge `04cd903`): An der Zeitstelle steht
  die Aktion ueber dem **pausierten** `<video>`, danach laeuft das Video an derselben Stelle
  weiter (TK v3.26 / 9.2.9). Treiber-Schritt **4b5**.
- **#437 (Composer-Bedienung) GEBAUT und gemergt** (`9d02952`, Merge `db457a3`): Die **Vorlage
  der Aktion** entscheidet den Drop (`vollflaeche` → Unterbrechung, sonst Band); Marken im
  Video-Block; Entfernen per Klick, je **EIN Undo-Schritt**. Treiber-Schritt **4b6**. Der
  `#4f`-Seed nutzt jetzt `band-standard` (sonst waere der Body-Drop eine Unterbrechung).
- **`main` traegt beides; NICHT gepusht.** `main` steht jetzt **61 Commits vor `origin/main`**
  (Push nur auf Anweisung). Beide Merge-Commits wurden nach dem Merge erneut geprueft:
  Typecheck/Lint 0, Suite **5636 gruen (330 Dateien)**, Treiber 4b5/4b6 ohne Befund.
- **Belege:** Treiber 4b5 (`Einschub @53 … -> danach @85`) und 4b6 (`Marken 0->1 …
  1 -> 0 -> 1 -> 0`) am echten Fenster. Gegenproben je Issue mit Pruefsumme
  zurueckgenommen (Details in der Session-Datei).
- **#438 NEU angelegt** (Unterbrechungen in der Kaputt-Erkennung, **vierter Fall**):
  **blockiert, bis TK 9.7.5 von „drei" auf „vier"** fortgeschrieben ist – der Nachtrag
  steht vollstaendig im Issue. Ohne ihn wuerde der Render mit einem Platzhalter im
  Einschub freigegeben (TK 9.10.7 / FA-19).
- **#426 bleibt Eltern-Issue offen**; die vier Bau-Issues #434–#437 sind gebaut und gemergt.
  **#436/#437 sind auf GitHub noch offen** (Schliessen mit Beleg steht aus).
- Naechste Session: **#438** (nach dem TK-9.7.5-Nachtrag), **#433 optisch abnehmen**; im
  Programm **Q3/Q4/Q1.2**; danach **S6**.

## STAND HEUTE (17.10.2026, Composer S4/S5, #433 Filmstreifen, #426/#434/#435 Unterbrechung) – historisiert durch den Abschnitt darueber

**Der volle Session-Stand steht in [`docs/agents/uebergabe-2026-10-17-session.md`](docs/agents/uebergabe-2026-10-17-session.md) – LIES DIESE DATEI ZUERST.**

- **Composer-Umbau S4/S5 GEBAUT und gemergt** (Merge `2ede5d4`; Plan `docs/agents/composer-umbau-plan.md`).
  **S4:** die drei Regionen als eigene, gesteuerte Bausteine (`bibliothek-dock.tsx`,
  `galerie-bereich.tsx`, `ausgaben-bereich.tsx`). **S5:** der DnD-Zug im Hook
  `verwende-zeitleisten-zug.ts` (`neuZug`/`aktiveKante`/`laedtKante`/`bandZiel`/`bandZeit`/`korbRef`
  + die vier Handler + Projektwechsel-Reset). Verhaltensneutral: DOM/Testids zeichengleich, Treiber
  ohne Befund. `index.tsx` **1123→957**. **S6** (Leichen bewerten) bleibt bis nach dem UI-Umbau.
- **#433 GEBAUT und gemergt** (Merge `517c5cc`; Plan `docs/agents/433-frames-plan.md`): Der
  **Video-Block der Zeitleiste zeigt einen Filmstreifen aus echten Einzelbildern** des Videos.
  User-Entscheidung: „literally die frames … die einzelnen Bilder"; Standard-Zoom bleibt. Die
  Anzahl folgt der Blockbreite (Zoom): Treiber 4b4 **1 Bild @ Standard → 6 Bilder @ 128 px/s**.
  Baustein `video-filmstreifen.tsx` nutzt `fangeBild`/`warteAufMetadaten` aus `thumbnails.ts`
  (keine zweite Bildquelle). **OFFEN: optische User-Abnahme am echten Fenster** (Issue bleibt offen).
- Zaehler: Suite **5602 gruen (327 Dateien)**, Typecheck/Lint 0. Alles **lokal auf `main`**,
  **nicht gepusht**.
- **#426 (Aktion unterbricht das Video) ENTSCHIEDEN; #434/#435 GEBAUT, #436/#437 offen.** User-Entscheidung
  **17.10.2026: Modell A – Einschub am Video-Element** (`Listenelement.unterbrechungen`,
  `[{ zeitstelle, aktionRef, dauer }]`; das Video bleibt EIN Element; sequenzielles Gegenstueck zum
  parallelen Band). **AD v1.8 / TK v3.26** (9.2.9 Render-Zerlegung, 9.5.2 `setzeUnterbrechungen`,
  9.5.3 Kaskade, 9.7.7 Bedienung, 9.11.3 Modell), `.docx` synchron, Plan
  `docs/agents/426-unterbrechung-plan.md`, Merge `080ee4e`. **Bau-Issues #434 (Modell+Store,
  GEBAUT+gemergt `e772993`) und #435 (Render-Zerlegung, GEBAUT+gemergt `c8ba86f`)**, dazu #436
  (Vorschau) und #437 (Composer-Bedienung) geschnitten; #426 bleibt als Eltern offen.
- Naechste Session: **#436 bauen** (Vorschau – Pause an der Zeitstelle), dann **#437** (Bedienung);
  **#433 optisch abnehmen**; im Programm **Q3/Q4/Q1.2**.

## STAND HEUTE (16.10.2026, Composer-Umbau + Programm Codequalitaet) – historisiert durch den Abschnitt darueber

**Der volle Session-Stand steht in [`docs/agents/uebergabe-2026-10-16-session.md`](docs/agents/uebergabe-2026-10-16-session.md) – LIES DIESE DATEI ZUERST.**
**WICHTIG OFFEN:** Die **Frames-Anzeige** der Zeitleiste erfuellt den User noch nicht („geht immer
noch nicht") – NICHT diagnostiziert; **Issue #433** (`braucht-entscheidung`) angelegt; am echten
Fenster klaeren.

**Neuer Plan-Zug – nach der #432-Lehre: kein Umbau ohne Plan.** Der Befund „`composer/index.tsx`
ist schwer zu bearbeiten" wurde gemessen und in zwei Plaene gefasst:
- **[`docs/agents/composer-umbau-plan.md`](docs/agents/composer-umbau-plan.md) – S1–S3 gebaut,
  treiber-gemessen, nach `main` gemergt** (Merge `70007ef`, Branch `bau/composer-umbau`). **S1:** EIN
  Overlay-Rahmen (`overlay-rahmen.tsx`) statt vier Kopien. **S2:** EIN Wurzel-Melder
  (`wurzel-meldung.ts`), 15 Wiederholungen weg. **S3:** die vier Overlays
  (`render-/export-/medium-loeschen-/band-overlay.tsx`) als eigene Bausteine; die Wurzel reicht nur
  Lage + Daten + Rueckrufe herein. **S4/S5 erst NACH #428** (sonst Konflikt an der
  Zeitleisten-/DnD-Stelle). Ehrlich: `index.tsx` 1170→1113, composer-Modul **+6 Dateien** – der
  Gewinn ist Ort-Klarheit, nicht Zeilen.
- **[`docs/agents/codequalitaet-programm.md`](docs/agents/codequalitaet-programm.md)** – vier Straenge
  Q1–Q4; Reihenfolge **Q2→Q1→Q3→Q4**. **Q2/A (Atomar-Schreib-Kern) GEBAUT, gemergt** (Merge `c6c77af`,
  Plan `docs/agents/schreib-mechanik-plan.md`, Branch geloescht): die domain-freie Mechanik
  (`mitWiederholung`/`taugtAlsSicherung`/`istCode`/`text`) liegt in
  `src/main/gemeinsam/schreib-mechanik.ts`; die fuenf `schreibe-*`-Dateien nutzen sie. **Weg 2:** nur die
  **Mechanik** geteilt – die **Zahl** `WARTEZEITEN_MS` und die **Serialisierung** bleiben je Store
  (TK 9.5.4); die begrenzte Umkehr der „BEWUSST NICHT"-Entscheidung ist im Modul-Kopf begruendet und als
  Nachtrag an #31/#47/#98/#71 gemeldet. `schreibe-*` **2917→2600** Zeilen, src netto **−235**.
  **S7 (Nachtrag Q2/A) GEBAUT, gemergt** (Merge `76b52ef`): `text`/`istCode` sind generische
  Systemfehler-Helfer und liegen jetzt neutral in `src/main/gemeinsam/systemfehler.ts`; **24
  byte-gleiche Kopien** in `main/` entfernt (netto −108 Zeilen; `ffmpeg-adapter/uniformitaet.ts`
  ausgenommen – andere Sache).
- **Q1 (Kommentare) GEBAUT, gemergt** (Merge `c648fc3`, Branch geloescht;
  `docs/agents/kommentar-regeln.md` + `kommentar-plan.md`): der generierte **Geruest-Kopf ist aus
  allen 241 Dateien** entfernt (**netto −4157 Zeilen**; `[modul]`-Zweckzeile und Hand-Begruendungen
  blieben). Guard `tests/unit/kommentar-guard.spec.ts`; **9 DoD-Grep-Proben** auf den neuen Vertrag
  gezogen (User-Entscheidung – die DoD wurde NICHT still umgeschrieben). Gegenprobe:
  `git diff -- src` hatte **0 Nicht-Kommentar-Zeilen**. **Q1.2** (wiederholte Begruendungen) offen.
- **#432 als verworfen geschlossen** (`not planned`); der Branch ist geloescht.

Zaehler: Suite **5550 gruen (322 Dateien)**, Typecheck/Lint 0, Treiber ohne Befund
(4f/4f2/4f4/4g2/4g4 unveraendert). Alles **lokal auf `main`**, **nicht gepusht**.
**#428 GEBAUT, gemergt** (Merges `063b135` + `f7583c4`; Plan `docs/agents/428-zeitband-plan.md`):
Die Zeitleiste zeigt eine **Frame-Achse mit Zoom** (px/s; bei hohem Zoom einzelne Frames) und Labels
in `mm:ss:ff` (`zeitband.ts`, rein) sowie die **Band-Abschnitte** im Video-Block an ihren Zeitstellen.
Ein Drop auf dem Video fuegt **an der Zeitstelle** ein: liegt sie mitten in einem Abschnitt, wird
dieser **framegenau geteilt** und die neue Aktion dazwischengesetzt (`teileUndFuege`/
`bandAufnahmeMitTeilung`) – das Band bleibt eine **durchgehende Rotation** (FA-20), **kein Luecke,
kein Modellfeld, keine Render-Aenderung**.
Naechste Session: **#433 loesen** (Frames-Anzeige, offenes Beduerfnis des Users), dann **S4/S5** des
Composer-Umbaus; im Programm offen **Q3**, **Q4** und **Q1.2**.

## STAND HEUTE (16.10.2026, Abnahme-Session) – historisiert durch den Abschnitt darueber

**Der volle Session-Stand steht in [`docs/agents/uebergabe-2026-10-15-session-3.md`](docs/agents/uebergabe-2026-10-15-session-3.md) – LIES DIESE DATEI ZUERST.**
Kurz (Fortsetzung): **User-abgenommen am 16.10.: #429 (Dauer/Trim + Undo) und #430 (Aktion löschen)**,
zusätzlich #422/#423/#424. In dieser Sitzung gebaut, treiber-gemessen und geschlossen: **#425, #427,
#429, #430, #431**. **#430** – Aktion in der Composer-Bibliothek **löschen** (ohne Rückfrage, EIN Undo-Schritt; Treiber 4g4: 1→0→Undo 1). **#429** –
Dauer/Trim legen jetzt einen **Undo-Schnappschuss** an (Treiber 4f4: 2,0→1,9→Undo→2,0 in EINEM Schritt);
`uebernehmeGrenzen` (#125) bekam dafür den **Sicht-Schreiber** als vierten Parameter. **#431** – eigenes
Anwendungsmenü ohne Undo/Redo-Acceleratoren (Cmd+Z erreichte den Renderer nicht; Ursache von „Cmd+Z tat
nichts"). **#427** – Beenden nach Fenster-Schliessen (kein Waisenprozess). **#425** – Band-Aufnahme am
Video. **Nur angelegt, NICHT gebaut:** **#428** (Zeitleiste als Zeit-/Frame-Band) und **#426**
(kurze Unterbrechung). Suite **5523 Tests gruen (318 Dateien)**, Typecheck/Lint 0. Alles **lokal auf
`main`**, **nicht gepusht**. Naechste Session: **#428/#426 entscheiden**.

## STAND HEUTE (15.10.2026, nachts) – historisiert durch den Abschnitt darueber

**Der volle Session-Stand steht in [`docs/agents/uebergabe-2026-10-15-session-3.md`](docs/agents/uebergabe-2026-10-15-session-3.md) – LIES DIESE DATEI ZUERST.**
Kurz: Aus der Abnahme **#422–#424** (422/423 abgenommen) kamen weitere Befunde. **#431 GEBAUT +
gemessen + geschlossen** – Cmd+Z wurde vom **Electron-Standardmenue** geschluckt (Rolle „undo",
Cmd+Z-Accelerator); jetzt ein eigenes Menue ohne Undo/Redo-Acceleratoren + Fokus-Waechter in #350,
Merge `05d1850`, TK v3.24 / 9.14.2. **#429** (Dauer/Trim erzeugen **keinen** Undo-Schnappschuss –
Vertragsbruch zu TK 9.13.1) und **#430** (Aktions-Loeschen fehlt in der Composer-Bibliothek) und
**#428** (Zeitleiste als Zeit-/Frame-Band) sind **angelegt, NICHT gebaut**. Suite **5516 gruen
(316 Dateien)**, Typecheck/Lint 0. Alles **lokal auf `main`**, **nicht gepusht**.
Naechste Session: **#429 bauen** (User-Wunsch), **#424-Abnahme** (Cmd+Z ist jetzt pruefbar),
dann **#430/#428 entscheiden**.

## STAND HEUTE (15.10.2026, spaetabends) – historisiert durch den Abschnitt darueber

**Der volle Session-Stand steht in [`docs/agents/uebergabe-2026-10-15-session-3.md`](docs/agents/uebergabe-2026-10-15-session-3.md) – LIES DIESE DATEI ZUERST.**
Kurz: **#425 gebaut + treiber-gemessen** (Band-Aufnahme am Video, TK v3.23 / 9.7.7). **#422/#423
User-abgenommen (ok)**; bei der Abnahme meldete der User zwei Befunde: **#427** (die App beendet
sich nach dem Fenster-Schliessen nicht – Waisenprozess blockierte den Neustart) ist **GEBAUT und
am echten Fenster gemessen** (Gegenprobe beisst; Merge `0ce2d17`); **#428** (neue Anforderung:
„Zeitleiste soll Frames/Zeitstellen zeigen, Aktion an einer Zeitstelle im Video ablegen") ist
**nur angelegt** (`braucht-entscheidung`, Modell offen). #425+#427 geschlossen.
Suite **5512 Tests gruen (315 Dateien)**, Typecheck/Lint 0. Alles **lokal auf `main`**, **nicht
gepusht**. Naechste Session: **#424-Abnahme** (konnte der User noch nicht testen), dann
**#428 entscheiden**, dann **#426** und Welle 2 / #371.

## STAND HEUTE (15.10.2026, abends) – historisiert durch den Abschnitt darueber

**Der volle Session-Stand steht in [`docs/agents/uebergabe-2026-10-15-session-3.md`](docs/agents/uebergabe-2026-10-15-session-3.md) – LIES DIESE DATEI ZUERST.**
Kurz: **#425 ist GEBAUT und treiber-gemessen** (Band-Aufnahme am Video). Vor dem Bauen wurden die
drei STOPP-Punkte des Issues mit dem User entschieden: (1) Startdauer = Dauer-Kette
`aktion.standardDauer ?? projekt.standardSegmentdauer ?? 10`; (2) Band-Vorlage ohne vorhandene =
die erste waehlbare (#129); (3) Drop auf ein Aktions-Segment = sequenziell davor/danach (kein
Ablehnen) – nur der **Koerper eines VIDEO-Blocks** ist Band-Ziel. `einblendung-ansicht.tsx`
(#253/M7-60) ist jetzt **montiert** (war „fertige Funktion ohne Aufrufer"). Neu:
`composer/band-aufnahme.ts` (rein), `zeitleiste.tsx` mit sichtbarem Band-Ziel (`data-band-ziel`).
Treiber 4f2: `bandZiel=true; Bloecke 2->2; Abschnitte=[{aktionRef, dauer:10}]; Band-Zeilen=1;
Undo Cmd+Z -> 0`. TK **v3.23** / 9.7.7, `.docx` neu. Suite **5509 Tests gruen (315 Dateien)**,
Typecheck/Lint 0. Branch `bau/425-band-anbinden` (noch **nicht gepusht**).
Naechste Session: **User-Abnahme #422–#424**, dann **#426 entscheiden**, dann Welle 2 / #371.

## STAND HEUTE (15.10.2026, nachmittags) – historisiert durch den Abschnitt darueber

**Der volle Session-Stand steht in [`docs/agents/uebergabe-2026-10-15-session-2.md`](docs/agents/uebergabe-2026-10-15-session-2.md) – LIES DIESE DATEI ZUERST.**
Kurz: Die **User-Abnahme der Kernachse** (#416–#421) brachte eine Anforderungsaenderung, die entschieden
UND gebaut ist: **Ein Projekt – ein Video**. **#422** (Bibliothek „Video", „Video importieren",
Auto-Uebernahme ans Listenende, Ersetzen mit Bestätigung; das Video wird **nicht gelöscht**), **#423**
(Anlegen: **Video zuerst, Pflicht** – ohne Video kein Projekt; Haeckchen entfernt), **#424** (sichtbare
Undo/Redo-Pfeile in der Reiterleiste). AD **v1.7** / TK **v3.22**. Nur DOKUMENTIERT: **#425** (Band/FA-20
anbinden – `EinblendungAnsicht` war „fertige Funktion ohne Aufrufer") und **#426** („Aktion unterbricht
das Video kurz" – neue Anforderung, Modell/Render zu entwerfen). Suite **5491 Tests gruen (313 Dateien)**,
Typecheck/Lint 0, **alles gepusht**. Naechste Session: **User-Abnahme #422–#424**, dann **#425 bauen**
und **#426 entscheiden**.

## STAND HEUTE (15.10.2026, vormittags) – historisiert durch den Abschnitt darueber

**Der volle Session-Stand steht in [`docs/agents/uebergabe-2026-10-15.md`](docs/agents/uebergabe-2026-10-15.md) – LIES DIESE DATEI ZUERST.**
Kurz: **Die SECHS Kernachse-Nachzuege sind ALLE gebaut UND treiber-gemessen** (#416, #417,
#418, #419, #420, #421) – je ein Branch + Merge auf `main`. Damit ist die Kernachse
inhaltlich fertig; es fehlt nur noch die **User-Abnahme** (Regel: Treiber-Beleg ist keine
User-Abnahme). Wichtigste Messungen: #417 Aktion 2 -> 3 Bloecke an Position 2 (Undo 1
Schritt), #419 Buehne 768x151 mit Video 268x151, #418 `data-ausgewaehlt=true` nach dem
Import, #420 Kontextmenue an der Zeitleiste (Duplikat/Entfernen), #416 Inline-Anlegen
Aktionen 1 -> 2, #421 Reparatur 2 -> 1 (Cmd+Z 1 Schritt). Zusatzbefund+behoben: `fuehreFixAus`
hatte KEINEN Aufrufer (die Fix-Knoepfe fehlten) – neues `composer/reparatur-panel.tsx`.
Suite **5477 Tests gruen (310 Dateien)**, Typecheck/Lint 0, 55 Commits ungesendet.
Naechste Session: **User-Abnahme der Kernachse**, dann Welle 2 (Banner-Spur) und die
#371-Klaerung.

## STAND HEUTE (14.10.2026, spaet) – historisiert durch den Abschnitt darueber

**Der volle Session-Stand steht in [`docs/agents/uebergabe-2026-10-14-session-2.md`](docs/agents/uebergabe-2026-10-14-session-2.md) – LIES DIESE DATEI ZUERST.**
Kurz: Die **Oberflaeche-2.0-Welle 1** ist gebaut und Treiber-gemessen (#411 position-Vertrag,
#412 Spalten-Drop + Kanten, #413 Drag-Quellen, #414 Videostage oben/Composer unten,
#415 Undo-Naht Variante a - **am echten Fenster GEMESSEN: Spalt-Drop 2 -> 3 Bloecke,
Cmd+Z 3 -> 2 in EINEM Schritt**). Suite 5462 Tests gruen (308 Dateien), Typecheck/Lint 0.
**Aber: der User hat 14.10. Befunde gemeldet, die zur KONVERTIERUNG fuehrten** (User-Weisung:
teilerfuellte Issues werden NICHT als fertig gemeldet, sondern die Reste als eigene
Nachzugs-Issues mit Herkunfts-Kommentar gefuehrt): **#416** (Aktion anlegen), **#417**
(Drag zwischen Frames fuer den Menschen bedienbar), **#418** (Import = EIN Video,
standardmaessig ausgewaehlt), **#419** (Videostage/Play), **#420** (KontextMenue an der
Zeitleiste), **#421** (Reparatur-Kette). **Die Kernachse gilt ERST, wenn alle sechs
erledigt sind.** Basis-Abgleich: `docs/agents/basis-abgleich-2026-10-14.md`.
Datenaufraeum: 74 Durchlauf-Testprojekte geloescht (Backup im opencode-Temp), der Treiber
raeumt je Lauf hinter sich (solange die App nicht fertig ist). 40 Commits ungesendet.
Regel neu: Treiber-Beleg ist keine User-Abnahme.
Nächste Session: die SECHS Nachzuege (Vorschlag: **#417 → #419 → #420 → #418 → #416 →
#421**), dann User-Abnahme der Kernachse, dann Welle 2 (Banner-Spur) und die #371-Klaerung.

## STAND HEUTE (14.10.2026, vormittags) – historisiert durch den Abschnitt darueber

**Der volle Session-Stand steht in [`docs/agents/uebergabe-2026-10-14-session.md`](docs/agents/uebergabe-2026-10-14-session.md) – LIES DIESE DATEI ZUERST.**
Kurz: Die Familie „fertige Funktion ohne Aufrufer" ist ABGEARBEITET - vier Issues geschlossen
und gemergt: **#407** (Bibliotheksansicht #227 + Loesch-Anzeige #229 in der Composer-Wurzel
montiert; das Issue-Body-Hypothese wurde korrigiert: der Roh-IPC-Weg ist VERTRAG, die Luecke
waren die zwei unmontierten Ansichten), **#409** (Vorlagen-Editor wirft nicht mehr React #301:
Nutzungs-Laden aus dem Renderkoerper in einen Effect, Hooks vor dem Rueckweg), **#410**
(Standardmarke-Zeile liest den Wert der OFFENEN Zeile aus der Projekt-Sicht statt des
entprellten Listen-Stands), **#408** (KontextMenue montiert - ComposerLage traegt menueAdresse,
#259-Nachtrag angehaengt; Duplikat 1->2 UND Entfernen 2->1 am echten Fenster gemessen).
Treiber: Render-Lauf am echten Dialog belegt (#347 im echten Fenster), Export bleibt MANUELL
(nativer Dialog, User-Entscheidung 13.10.), Vorlagen-Editor-Sitzung belegt. Suite 5431 Tests
gruen (305 Dateien), Typecheck/Lint 0. Kein offener App-Befund. Nächste Session: **#371/#274
pruefen**, dann das Design „Oberfläche 2.0". Beim User: ca. 22 Commits ungesendet (Push nur
auf Anweisung); optische Abnahme #327; #289-Flaky (diesmal nicht aufgetreten, beobachten).

## STAND HEUTE (12.10.2026) – gilt vor allem Aelteren weiter unten

**Der volle Session-Stand steht in [`docs/agents/uebergabe-2026-10-12-session.md`](docs/agents/uebergabe-2026-10-12-session.md) – LIES DIESE DATEI ZUERST.**
Kurz: SECHS E2E-Luecken geschlossen und gemergt - #342 (Dialoge montiert, `ComposerLage`
als einziger Zustand), #347 (Ausgaben-Auffrisch im Nachlauf + Auffrisch-Knopf im
Normalfall), #346 (Start-Hinweis wird reaktiv weggenommen), #340 (der ECHTE
media://-Handler ist am Fenster MESSBAR belegt: 200 statt 404), #350 (Strg/Cmd+Z
Undo/Redo), #352 (Formular-Befunde werden als Bediener-Sätze am Feld gezeigt).
Suite 5421 Tests grün, Typecheck/Lint 0. NEU **#407**
(direkte D1-Mutationen bringen die Liste nicht auf den Stand). Nächste Session:
**#404-Rest** - jetzt baubar, weil #342/#347 weg sind; dann **#407**, dann das
Schließen der BK-Issues #354-#359 (User-Freigabe liegt vor), dann #371/#274-Prüfung.
Beim User: ca. 196 Commits ungesendet (Push nur auf Anweisung); optische Abnahme
#327; #289-Flaky fiel zweimal in drei Vollläufen (einzeln immer grün, beobachten).

Basis-Abgleich #340-#353: DAMIT SIND ALLE SECHS offenen Lücken der Familie „fertige
Funktion ohne Aufrufer" geschlossen (#340/#342/#346/#347/#350/#352) - die Arbeit
des Treibers geht jetzt in die Tiefe (Render-Lauf, Export, Editor-Sitzung).

---

## STAND HEUTE (09.10.2026, spaet) – gilt vor ALLEM weiter unten

**Der volle Session-Stand steht in [`docs/agents/uebergabe-2026-10-09-session.md`](docs/agents/uebergabe-2026-10-09-session.md) - LIES DIESE DATEI ZUERST.**
Kurz: Aufgeräumt (#7, #401, #402, #403 geschlossen; TV-Test entfallen), der DURCHLAUFS-TREIBER
ist gebaut (`npm run durchlauf`, Commit `7f9c096`/`ff90c7f`) und hat den Rest bereits zweimal
gemessen (#347/#342 im echten Fenster bestaetigt; Seed-Import mit gelebten Ereignis-Kanal).
Basis-Abgleich #340-#353: 7 geschlossen, 6 offen (Lueckenklasse). Reflog-Ära (Zwei-Screens,
29.-30.08.) ist ALS VERWORFEN entschieden. Nächste Session: #342 zuerst, dann #404-Rest,
dann #340/#347/#346/#350/#352.

Diese Session hat AUFGERAEMT und das Fundament des Durchlaufs 2.0 gelegt. Kurz, alles belegt in
den Issues:

- **User-Entscheidungen:** Der TV-Test ist ENTFALLEN (Nachtraege an #184/#186/#188 angehaengt);
  das macOS-Artefakt **#7 wurde GEBILDT UND GEMESSEN und geschlossen** (mac-Zielformat `dir`,
  `.app` am echten Mac gestartet, Binaries aus `app.asar.unpacked` belegt, Merge `b1f1534`);
  Zielformat `dir` ist diesmal als Issue-Kommentar in #7 belegt.
- **Zweierlei Versehentliches entdeckt und User-Klaerung:** Der Reflog zeigt eine verworfene
  ArbeitsaeAera (Bedienkonzept „Zwei Screens" AD v1.7/TK v3.21, „Banner & Aktionen" v1.8/v3.22,
  26.-30.08. E2E- und Redesign-Linie). **User-Entscheidung: der Reset war GEWOLLT** -
  die zugehoerigen lokalen Commits (f01def5, Stash) bleiben nur als Nachschlagequelle; die
  E2E-Nutzerfluss-Spec dort ist Vorbild fuer den Treiber.
- **Basis-Abgleich der 13 E2E-befund-Issues #340-#353 gegen heutiges main:** 7 GESCHLOSSEN
  mit Beleg (#341, #343, #344 deckt den #70-Fix, #345, #348, #349, #353; #353 mit der Restnotiz
  "Ersetzen nur via Führung"), 6 OFFEN mit Praezisierung (#340 media://-Stub, #342 Dialoge
  gebaut aber unmountet, #346 Hinweis ohne Ruecksetzweg, #347 Render/Export fritzt Ausgaben
  nicht auf, #350 tastatur.ts komplett ohne Aufrufer, #352 Roh-Codes am Feld).
- **#401** angelegt: die 4 unhandled errors aus marken-editor-wurzel.spec.ts (Test-Narben, vier
  Attrappen ohne mockResolvedValue); Verfahrensfehler (verbastelter erster Body) im Issue
  transparent benannt und berichtigt.
- **#289-Flaky** nachgetragen (dreimal im Volllauf gefallen, einzeln gruene Messung).
- **Durchlauf-Treiber gebaut und geliefert im Erstlauf:** `scripts/durchlauf.mjs` + `npm run durchlauf`
  (puppeteer-core steuert das gebaute Fenster, raeumt instanz.lock, sammelt Ereignisse und
  Fenster-Fehler, schreibt das Fundsprotokoll `docs/agents/oberflaeche-durchlauf.md`),
  Commit `7f9c096`, Lint/Typecheck 0.
- **Erstlauf-Ergebnis (alles im Protokoll):** (a) 5 Reiter im Fenster = RICHTIG (app-shell/
  reiter.ts, TK v3.6/#314); ein tod Altgeruest (`shell/reiter.ts` + ReiterInhalt.tsx +
  WarteschlangenLeiste.tsx, 4-Reiter-Vertrag ohne Aufrufer) verursachte den Scheinwiderspruch
  - **#402**. (b) **#347 und #342 im echten Fenster bestaetigt** (kein Auffrisch-Knopf; keine
  Dialoge im DOM). (c) Nach Projekt-Anlegen fehlt der Name in der Liste - **#403**
  (Ursache ungeklaert, Treiber-Rauschen inklusive). (d) Gegenprobe zum Treiber fehlte die
  Kennung `vorlagen-editor-kopf` im DOM - Arbeit im **#404** (Treiber-Ausbau).
- **#402 ERLEDIGT und gemergt** (d1abaa6): die zwei toten Dateien
  (shell/reiter.ts, shell/ReiterInhalt.tsx) geloescht (63 Zeilen), WarteschlangenLeiste
  ALIVE belegt (App.tsx:59 + mock Korrektur im Issue); Typecheck/Lint 0, 5399 Tests gruen.
- **#403 ENTWERTET und geschlossen** (d217936): Treiber-Rauschen - drei gemessene
  Messfehler (innerText liest keine versteckten Elemente; der Anlege-Ablauf wechselt
  nach Zusammenstellen; Zeilen messen erst NACH Rueckwechsel). Die App arbeitete
  korrekt; Treiber mit korrigiertem Messweise committet.
- **#401 ERLEDIGT und gemergt** (5ff1bb6): die vier Narben tragen je mockResolvedValue
  (Muster des Nachbarn); Spec meldet Errors 0 bei 18/18, der Volllauf nur noch den
  dokumentierten Vorbefund-Rejection (Error: weg, standardmarke-anzeige.spec.ts:150,
  #324-Testthema - bleibt stehen, gehoert zu #324).
- **#404 TEIL 1 ERLEDIGT und gemergt** (ff90c7f/bde004c): Seed-Import gebaut und
  gemessen - Testvideo aus dem gebuendelten ffmpeg, `queue:reiheEin` im echten
  Fenster, 2 queue:geaendert-Ereignisse nach 0 ms, Galerie da, Eintrag 1;
  Vorlagen-Kennung auf `vorlagen-uebersicht` (Erster-Falschbefund zurueckgenommen).
  REST von #404: Render-Lauf (blockiert durch #342), Editor-Sitzung der Vorlagen,
  Hobel der Standardmarke-Auswahl je Zeile in Objekten.
- **Neue Issues fuer die naechsten Sessions (Reihenfolge-Suggestion):** #404 (Treiber-Ausbau zu den neun Schritten),
  dann die offenen #340/#342/#346/#347/#350/#352 (alle "fertige Funktion ohne Aufrufer"-Familie),
  dann #401, der Rest basiert auf dem Treiber-Protokoll.

---

## STAND HEUTE (08.10.2026, spät abends) – gilt vor ALLEN älteren Angaben weiter unten

**Der volle Stand dieser Abendsitzung steht in [`docs/agents/uebergabe-2026-10-08-session-2.md`](docs/agents/uebergabe-2026-10-08-session-2.md) – LIES DIESE DATEI ZUERST.** Kurz:

- **Die Projektphase hat gedreht:** Die Logik ist komplett (M0–M8, 5399 Tests, Typecheck/Lint 0); JETZT läuft der Übergang „verdrahtet → benutzt im echten Fenster". Nächste Session: der **gesteuerte Oberflächen-Durchlauf 2.0** (Nicht-Design! Das Design kommt danach als eigener Schnitt „Oberfläche 2.0" – rot = Markenfarbe, Logo bleibt, Referenz Canva/Clipchamp-Look), je Fund nach dem Muster **Messen → Ursache → Fix → Gegenprobe → Issue-Nachtrag**.
- **Heute im echten Fenster gefunden und behoben (beide Vorbilder):** **#400** (Weiß-Screen beim Projekt anlegen: `kindOffen` inline gerufen → „Rendered more hooks"; jetzt als echtes Element `ProjektKindWurzel` montiert) und der **#70-Nachtrag** (Import-UI blieb alt bis zum Projektneuöffnen: die Push sah den terminalen Auftrag nie; Reihenfolge jetzt Q3 → Q2 → **Ereignis** → Q1-Entfernen → weiterdrehen). Erstere arbeitete mit `ELECTRON_ENABLE_LOGGING=1` + SEMPEL-Markern an vier Nahtstellen (danach SOFORT entfernt).
- Diagnose-Kettenstandards: **vor jedem Start `instanz.lock`/`instanz.signal` räumen** (sonst beendet sich die App lautlos mit Code 0); JEDEM Fix eine Gegenprobe auf dem fix-losen Stand; COMMT first, dann Checkout-Roundtrips.

- **(Vortag) M8: 59/60, 1 baubereit (#327)** – seitdem abgeschlossen: die Kette #311-#313-#314-#322-#327 plus #399; siehe `uebergabe-2026-10-08-session.md`.

- **M8: 59/60, 1 baubereit (#327)** (gemessen `python3 tools/bereitschaft.py`); 5362 Tests grün, 294 Dateien, Typecheck/Lint 0, Branch `main`.
- **Gebaut und gemergt seit der Vorsession:** #297, #298, #299, #300, #302, #323, #324, #326, #330, #336, #331. #309 war bereits geschlossen. Diff belegt: Reparatur-Commit `dcefc40` (Lint-Fehler + Faser in marken-bereitstellung.ts).
- **AM ARBEITSBAUM:** Sauber (nur die drei bekannten Vorbefund-Artefakte untracked). Neue Übergabe: `docs/agents/uebergabe-2026-10-07-session-2.md`.
- **Nächste Kette:** #311 - #313 - #314 - #322 - #327, und #399 (die vier benannten Edits aus #324).
- **Regeln der Serie:** Registry `project` = 21 Einträge, Verdrahtung = 13/4/17 (gebauter Code statt Issue-Text); `bootstrap-verdrahtung.spec.ts` ist die Vertragsquelle der Reihenfolge. Lint-Befund auf `main` widerspricht der vorm. Übergabe ("Lint 0"): siehe #312-Nachtrag.

- **M8: 44/60, 6 baubereit** (gemessen `python3 tools/bereitschaft.py`); 5235 Tests grün, 283 Dateien,
  Typecheck/Lint 0, Branch `main`.
- **Diese Session geschlossen:** #304 (marken-Kanäle), #321+#309 (MEDIA_SCHEMA + Bootstrap),
  #312 (marken-bereitstellung), #319a-Nachzug (setzeMarke stellt bereit), #295 (marken-uebersicht),
  #305 (marken-zugang), #296/#307/#308 (Farben/Slogan/Sicherheitsabstand).
- **AM ARBEITSBAUM UNCOMMITTET (Zweig `bau/m8-297-298`):** die zwei Quelldateien für #297/#298
  stehen; die zugehörige Testdatei ist NUR Gerüst (kein `it`-Block) – die Suite schlägt sie
  deshalb fehl, NUR wenn sie untracked liegt; `main` ist grün. Erste Aktion der Fortsetzung:
  Testblöcke für #297/#298 schreiben, je ein Commit, Nachträge, close, merge. Danach #299/#300.
- **Regeln der Session:** Umlaut-Entscheidung (Schlüssel UND Kanalname tragen den Umlaut,
  aufgelöst mit dem User), Ghost-Spione (`resetAllMocks`, nicht `clearAllMocks`), Zahlwörter
  12/4/16 statt 11/4/15 (#309-Nachtrag), die flaky `ENOTEMPTY`-Beobachtung liegt bei #289.

---

## STAND HEUTE (06.10.2026, spaet) – gilt vor ALLEN älteren Angaben weiter unten

### Session 06.10. (Fortsetzung) in Kürze

- **#262 ist GESCHLOSSEN UND gemergt.** Code `feb5c8c`, jsdom-DoD-Tests
  `tests/unit/app-einhaengung.spec.ts` (27 Pruefungen, `ab523c6`),
  Faser-Berichtigung `58f5bd4` ("Konfiguration unlesbar" statt "Configure
  unlesbar"; Parameter `meldungText` statt `hmldung`). Der Knopf "Erneut
  versuchen" baut den ERSTEN Lauf ab und startet ERST DANN neu - im Test durch
  ein Tagebuch gemessen (`['laeuftAn', 'baueAb', 'laeuftAn']`). Die DoD sprach
  von "SIEBEN" Eigenschaften des `UebergabeOverlay`, die Schnittstelle hat
  ACHT; im Issue-Nachtrag gemeldet, der Test belegt alle acht.
- **GEBUILT, auf `main` (4988 Tests gruen, 260 Dateien, Typecheck/Lint 0):**
  #218 (`b81e550`), #219 (`b997c1c`), #242 (`614186d`), #244 (`cec0066`),
  #260 (`42d689b`), #262 (`feb5c8c` + `ab523c6` + `58f5bd4`). Alle geschlossen.
- **Rueckbau der Naht erledigt (`62a5cfb`):** `inhalte-vorlauf.tsx` geloescht,
  der Re-Export in `inhalte.tsx` entfernt; App.tsx haengt jetzt an der echten
  Kette `starteRenderer` (#260) + #244. Vorher per `grep` belegt: kein
  Verbraucher der Naht mehr.
- **`alt/sicherung-arbeitsstand` VERARBEITET und geloescht (Tip `1a3bc5a`):**
  Gegenprobe vor dem Loeschen - `git diff` Branch/main fuer
  `src/renderer/preview-player/split-stile.ts` zeigt AUSSCHLIESSLICH
  Kommentarzeilen, der Laufzeitcode ist identisch; die Uebernahme ist
  vollstaendig, `main` ist die Obermenge.
- **Verfahrensfehler dieser Session (transparent):** Der Rueckbau-Branch wurde
  zuerst OHNE Commit angelegt; die Aenderung wanderte beim `checkout` mit und
  der erste Merge war ein No-op. Nachgeholt: Commit `62a5cfb` auf
  `abbau/naht-inhalte-vorlauf`, dann nach `main` gemergt.
- **#215** ist entfallen, wird aber von `tools/bereitschaft.py` weiter als
  baubereit angezeigt (Werkzeug-Limit: es zaehlt geschlossene Issues).

### Wo das Projekt steht

| Meilenstein | gebaut | | Meilenstein | gebaut |
|---|---|---|---|---|
| M0 Grundgeruest | 15 / 15 | | M5 Inhalte | 37 / 37 |
| M1 Fundament | 50 / 50 | | M6 Render & Export | 37 / 37 |
| M2 Torwaechter | 20 / 20 | | M7 Oberflaeche | **70 / 71** |
| M3 Medien | 21 / 21 | | M8 Marken | 25 / 60 |
| M4 Pixel | 26 / 26 | | | |

4988 Tests gruen (260 Dateien), Branch `main`, Arbeitsbaum sauber.
In M7 zaehlt das Messwerkzeug nur noch **#215** als offen - das ist aber
entfallen (FA-22/Motiv-Weg laeuft ueber #258), nur `bereitschaft.py` kann
geschlossene Issues nicht ablesen. M7 ist damit inhaltlich VOLLSTAENDIG.

### Offene Punkte fuer die naechste Session (in dieser Reihenfolge)

1. **M8-Kette:** 35 offen; `bereitschaft.py` meldet 0 baubereit - Zirkel #277
   (`schreibe-marken`, braucht `eingebauteMarke`) / #280 (`anfangsbestand`,
   braucht den Typ `MarkenEintrag`). VON HAND loesen: vermutlich #280 zuerst;
   #277 importiert den Typ (oder der Typ wandert in #276).
2. **Offene Meldungen aus #319:** a) Muss `setzeMarke` `stelleMarkeBereit`
   (#312) rufen? b) Zaehlt eine unbekannte `aktion.markeId` als kaputte Stelle
   (#131)?
3. **Werkzeug-Limits:** `bereitschaft.py` zaehlt geschlossene Issues mit
   (#215 bleibt sichtbar); Ursache: `gh issue list --state all`.
4. **Beim User:** [User-Entscheidung 09.10.2026] Der TV-Test (FAT32/exFAT-Befund in
   #184/#186/#188) ist ENTFALLEN - kein offener Punkt mehr (Nachträge sind an allen drei Issues
   angehängt). Das macOS-Artefakt (#7) ist am 09.10. gebaut UND gemessen worden (mac-Zielformat
   `dir`, `.app` am echten Mac gestartet, Binaries aus `app.asar.unpacked` belegt, Merge
   `b1f1534`) - **#7 ist geschlossen.** Offen bleibt: optische Abnahme der Marken-Speicher-Anzeige
   (#327-Nachtrag).
5. **Aufraeumen (optional):** Die gemergten Branches `bau/m7-262` und
   `abbau/naht-inhalte-vorlauf` koennen geloescht werden.

### Regeln, die HEUTE gegolten haben

- **Gegenproben mit Beleg:** #218 (`Math.round` in der Quelle) und #219
  (`hintergrund` an Video) haben gebissen; Ruecknahme mit Pruefsumme
  (`b1ddb55d`, `a080d1d7`). #242: die wortliche Grep-Probe `&& sichtbar` griff
  ZUERST nicht (die Mutante `stand.laeuft && props.sichtbar` enthaelt den
  Wortlaut nicht); Probe verschraerft (Muster ueber JEDE Schreibweise), danach
  gebissen (`0ed2ad21`). Lektion: Eine wortgetreue Grep-Probe NUR nach dem
  geplanten Fehlverhalten-denkbarsten Ausdruck testen.
- **Signaturen aus der definierenden Quelle:** Die MELDE-KLAUSEN von
  #218/#219/#242 haben gezuendet: Der Branch-Stand `42badd4` wich mehrfach ab,
  und das Issue-Body-Zitat zu `Listenelement` (mit `bild`) war seit TK v3.16
  ueberholt. Die gebauten Signaturen gewonnen, die definierte Quelle entscheidet
  immer. Nachtraege ANGEHAENGT (nie einen Body ersetzt).
- **NEUE GEFAHR FUER AGENTS (jetzt als Regel):** Lange Datei-Writes (ueber
  ca. 150 Zeilen) verwursten wiederholt Kommentarfasern (falsche/fremdsprachige
  Zeichen, verbastelte Woerter). Pruefung nach JEDEM Write: ein Sprach-Scan
  (Codepoints > U+2100 pruefen) plus `npm run typecheck`. Wer lang schreibt:
  in HAELFTEN schreiben (write-Kopf + Anhaenge ueber `cat >>`-Heredoc mit
  'EOF'), pro Schritt pruefen.
- **Arbeitsweise:** Ein Thema pro Schritt. Branch ZUERST. Verfahrensfehler im
  Issue-Comment transparent benennen (#242/#260/#262, alle drei benannt).
- **GEFAHR DURCH SELBSTVERSTAERKUNG (06.10., teuer):** Ein Agent, der in lange,
  ausschweifende Ausgaben geraet, kann in einen Zustand kippen, in dem er
  zusammenhanglose, teils fremdsprachige Zeichenketten und fehlerhafte
  Werkzeugaufrufe erzeugt (im heutigen Fall mitten in der Doku-Pflege). Regel:
  Wird die eigene Ausgabe unleserlich, SOFORT STOPPEN, nichts Destruktives
  ausfuehren (kein `rm`, kein `reset`) und den echten Zustand mit klaren,
  einzelnen Befehlen pruefen (`git status`, `git log -3`, `ls`). Kein Befehl auf
  Verdacht - jede Annahme zuerst belegen. Der Arbeitsbaum war trotz des
  Aussetzers sauber; das ist der Zustand, der zaehlt, nicht die Ausgabe.

---

## STAND HEUTE (05.10.2026, spaet) – gilt vor ALLEN älteren Angaben weiter unten

### Session 05.10. (späte Fortsetzung) in Kürze

- **SCHWERER BEFUND, BEHOBEN:** Vierzehn geschlossene M8/M4-Issues behaupteten „gemerged nach
  main", die Merges lagen NUR auf Branches (`bau/m4-*`, `bau/m8-*`). Die komplette Kette ist jetzt
  nach `main` gemergt (`f6992de`) – `m4-20` trug dabei bereits die ganze `m8-06`-Linie. Konflikt-
  Auflösungen BELEGT: `datenort.ts`/`einzel-instanz.ts` -> MAIN (spaetere Korrektur, Vorbefund
  gruen); `schriften.ts`/`zeichne-segment.ts`/`logo-laden.ts` -> M8-KETTE (Obermenge, 4. Parameter
  `rahmenMarke` nach #294/TK v3.18); `zone-*` -> MAIN (Branch == Basis). Die fuenf Aufrufer von
  `zeichneSegment` zeichnen jetzt mit `marke, marke`; `leererEntwurf` ist dreistellig
  (`vorlagenId, markeId, akzentfarbe`, Form laut #319). **Nahtreste-Commit `c58d749`:** Diese Aufrufer-Aenderungen lagen teils UNCOMMITTET; sie sind
  jetzt drin. Wer weiterbaut, findet sie auf `main`.
- **GEBAUT HEUTE:** #253 (Band-Bearbeitung, `834633d`), #259 (composer-montage, `434c29a`),
  #217 (preview-player Segment, `da36f86`), #243 (Undo-Aufzeichnung, `c541092`), #319
  (Aktion.markeId, `bdea7b4`), #303 (Marken-Editor Vorschau, `f3eee4e`), #216 (preview-player
  Video, `c7a900b`). **#215 ENTFALLEN** (geschlossen; `medienUrl` lebt über #258 – Nachtrag im
  Issue). **#231** war bereits gebaut (`ef191f9`), das Messwerkzeug zählte sie UNKLAR –
  `bereitschaft.py` ist nachgezogen (`1918f2d`).
- **USER-ENTSCHEIDUNG #319:** Der Main-Vorbelegungs-Konflikt ging an den #319-Kontrakt:
  `erstelleAktion` lehnt fehlendes/leeres `markeId` ab; die Vorbelegung mit
  `Project.standardMarkeId` lebt im RENDERER (`leererEntwurf`). Die M8-Kette hatte im Main
  `?? projekt.standardMarkeId` gebaut - ENTFALLEN, Nachtrag im Issue #319.
- **USER-ENTSCHEIDUNG #132:** Die geführte Reparatur endet NICHT von selbst; „N von N behoben"
  + Schliessen-Knopf (Nachtrag im Issue #132 und lokal `docs/agents/m5/M5-13.md`, `d1606ad`).
- **VORBEFUND (23.08.) GELÖST:** Die 3 Testfehler existieren nicht mehr (gemessen, 4632 grün
  auf dem Stand davor). Niemandes Arbeit war berührt.

### Wo das Projekt steht

| Meilenstein | gebaut | | Meilenstein | gebaut |
|---|---|---|---|---|
| M0 Grundgerüst | 15 / 15 | | M5 Inhalte | 37 / 37 |
| M1 Fundament | 50 / 50 | | M6 Render & Export | 37 / 37 |
| M2 Torwächter | 20 / 20 | | M7 Oberfläche | **65 / 71** |
| M3 Medien | 21 / 21 | | M8 Marken | **25 / 60** |
| M4 Pixel | 26 / 26 | | | |

**4848 Tests gruen** (234→244 Dateien), Branch `main`, Arbeitsbaum sauber. Die Session hat von 219 auf **226** gebaute Issues gebracht (plus Merge der Kette).

### Offene Punkte für die nächste Session (in dieser Reihenfolge prüfen)

1. **M7-Rest:** #218/#219 (Split-/Einblendungs-Simulation – beide nutzen `Video` mit `rahmen`
   und `hintergrund`), #242 (Vorschau zusammensetzen), #244 (inhalte-zugaenge: hier MUSS
   `umhuelleFuerBearbeitung`/`ohneAufzeichnung` gerufen werden – der Aufrufer von #243!), #260/#261
   (Bootstrap-Verdrahtung), #262.
2. **M8-Kette:** 35 offen; `bereitschaft.py` zeigt **0 baubereit**, weil `#277` (schreibe-marken)
   und `#280` (anfangsbestand) in einem Zirkel stehen (#277 braucht `eingebauteMarke`, #280 braucht
   den Typ `MarkenEintrag` aus #277). **Werkzeug-Limit oder echter Zirkel – von Hand klären**;
   vermutlich baut man #280 zuerst und #277 importiert den Typ (oder der Typ wandert in #276).
3. **Meldungen aus #319 (offen):** a) Muss `setzeMarke` `stelleMarkeBereit` (#312) rufen?
   b) Zählt eine unbekannte `aktion.markeId` als kaputte Stelle (#131)?
4. **Werkzeug-Limits (bekannt):** `bereitschaft.py` zählt geschlossene Issues mit (#215 bleibt
   sichtbar); `gh issue list --state all` heißt die Ursache.
5. **Beim User (unverändert):** TV-Test (FAT32/exFAT-Befund steht in #184/#186/#188), macOS-
   Artefakt (#7).

### Regeln, die HEUTE wieder gegolten haben (wörtlich geblieben)

- Gegenproben mit Beleg: der Bulk-Fixture-Lauf hat in `marke.spec.ts` eine absichtlich
  **falsche** Fixture „repariert" – mit Beleg zurückgenommen. Eine Probe ohne Beleg ist keine.
- Signaturen aus der definierenden Quelle: die MELDE-KLAUSEN von #217/#303 haben gezündet
  (vier-Argument-`zeichneSegment`); gemeldet im Issue-Nachtrag, nie eigenmächtig angepasst.

---

## STAND HEUTE (23.08.2026) – gilt vor ALLEN älteren Angaben weiter unten

Dieses Dokument ist gewachsen. Wo eine ältere Zeile diesem Abschnitt widerspricht, **gilt dieser
Abschnitt**. Die Historie bleibt stehen, weil die Begründungen darin wertvoll sind – sie ist
Vergangenheit, nicht Anweisung.

### Session 23.08.2026 in Kürze (vor der Tabelle das Wichtigste)

- **M6 ist KOMPLETT: 37/37.** #184/#186/#188 geschlossen. Die macOS-FAT32-Erkennung ist GEMESSEN
  (per hdiutil-Images: `statfs().type` unterscheidet FAT32/exFAT nicht; `diskutil info -plist` am
  per `st_dev` aufgelösten Mountpoint liefert Klartext in ~90 ms) und in `ziel-pruefung.ts`
  eingebaut. REST: Gegenprobe an einem ECHTEN Stick beim nächsten Anlass.
- **M8 ist vollständig GEKLÄRT** – alle 21 UNKLAREN haben entschiedene Nachträge in den Issues
  (u. a.: vorlagen-editor zeichnet gegen eine wählbare Marke mit Default „eingebaute Marke";
  Alt-RollenNamen in `akzentfarbe` setzt #281 auf `null`; Standardmarken-Wechsel - Neubereitstellung;
  Kontrast-Warnung im Farbwähler gegen beide Textfarben; Beenden-Hinweis bleibt informativ).
- **Gemessener Befund mit Folgeentscheidung:** `marken://` taintet das Canvas in JEDER
  Registrierungs-Konfiguration (SecurityError bei toBlob/toDataURL). Entscheidung: importierte
  Marken-Dateien im Zeichenpfad als BYTES laden und als Blob-URL einbinden; `marken://` bleibt
  Speicherort-Vertrag (#290), aber KEIN direktes `<img src>` im Zeichenpfad (#315, Nachtrag II).
- **NEUE ISSUES:** #336 (Beenden-Dialog bei gescheitertem Flush, alle drei Speicher, läuft NACH
  #309), #337 (verbliebene meldeAn-Kopien), #338 (`findeKaputteStellen` um Marken erweitern),
  #339 (`flaecheDunkel`-Hex-Prüfpunkt in #173).
- **#333 gebaut UND committed** (`0a78b43`): trim gilt jetzt überall; `meldeAn` liegt in
  `src/main/ipc-gateway/melde-an.ts`. **#8 gebaut UND committed** (`7aae05d`): Full-Latin-Schriften
  (Glyphennachweis ł ć ş ő ž µ), 10-s-Timeout mit sichtbarem Abbruch. Playfair trägt einen
  U+00B5→uni03BC-Cmap-Patch (OFL-Derivat, RFN-Frage offen im Issue).
- **VORBEFUND, unbehandelt:** 3 Testfehler in `tests/unit/datenort.spec.ts` /
  `einzel-instanz.spec.ts`, per Stash-Gegenprobe auf dem sauberen Baum belegt. Wer als Nächstes
  baut: zuerst klären, ob sie die eigene Arbeit berühren.
- **Bodies von #184/#186/#188 waren ZERSTÖRT** (Nachtrag hatte den Body ERSETZT statt angehängt)
  – aus den lokalen Quelldateien wiederhergestellt, deckungsgleich (`fd7aebd`). Regel-Reminder:
  Nachträge ANHÄNGEN, nie `--body-file` ohne den alten Stand.

### Wo das Projekt steht

| Meilenstein | gebaut | | Meilenstein | gebaut |
|---|---|---|---|---|
| M0 Grundgerüst | 14 / 15 | | M5 Inhalte | 28 / 37 |
| M1 Fundament | **49 / 49** ✓ | | M6 Render & Export | **37 / 37** ✓ |
| M2 Torwächter | **20 / 20** ✓ | | M7 Oberfläche | 24 / 71 |
| M3 Medien | 18 / 21 | | M8 Marken | 8 / 60 |
| M4 Pixel | 20 / 26 | | | |

Rund **219 von 339 Issues** (davon 300 offen, aber M6 komplett und M8 vollständig geklärt),
**4130 Tests** grün (plus Integrationstests; DREI Vorbefund-Fehler, s. Session-Kürze oben), Branch
`main`, Arbeitsbaum sauber. In M0 (#8, Ordner) ist die fehlende Nummer faktisch fertig – das
Messwerkzeug kann sie nur nicht ablesen. In M3 zählen #333 (gebaut, Commit `0a78b43`) und #337
(neu) zu den offenen Nummern.

**Die Logik-Kette ist durchgängig verdrahtet:** Projekt-Operationen, Medien, Warteschlange, Render
und Export sind vom Renderer aus erreichbar. Was fehlt, ist überwiegend **Oberfläche** (M7) und die
Marken (M8).

### Wie du herausfindest, was zu tun ist

```
python tools/bereitschaft.py
```

Sagt je Meilenstein: gebaut / baubereit / **UNKLAR**. Der Dateikopf nennt drei Grenzen – lies sie.
Die wichtigste: Das Werkzeug misst, ob eine Funktion **gebaut** ist, **nicht ob sie gerufen wird**.
„Fertige Funktion ohne Aufrufer" ist die häufigste Lücke des Projekts und in **jedem** Meilenstein
seit M1 aufgetreten. Für „hat das einen Aufrufer?" gibt es keinen Ersatz für einen `grep`.

### ✓ ZWEI ANFORDERUNGSÄNDERUNGEN sind entschieden UND dokumentiert

Beide sind am 15.08.2026 vom User entschieden und am 16.08.2026 in **AD v1.6 / TK v3.18** eingearbeitet
worden; die Rückwärts-Zitat-Korrektur über die angelegten Issues ist ebenfalls erledigt (Commits vom
16.08.2026). Es läuft nur noch der **Code-Umbau**.

1. **Projektweite Standarddauer, je Aktion überschreibbar.** Kette:
   `element.dauer ← aktion.standardDauer ?? projekt.standardSegmentdauer ?? 10`.
   `Project` bekommt ein Feld (9.11.3) - in AD/TK ist entschieden: **keine** Migration, weil es noch
   kein einziges Projekt gibt (`Project.standardSegmentdauer` gehört von Anfang an zu `schemaVersion`
   1, TK v3.17). Beim Ändern fragt die Oberfläche, ob der neue Standard auch für bestehende Aktionen
   gilt; betroffen sind alle mit `standardDauer: null`, einzeln **abwählbar**. **Code-Stand (geprüft
   16.08.): noch nicht gebaut** – `Project.standardSegmentdauer` und `setzeStandardSegmentdauer`
   fehlen in `src/shared/contracts/project.ts` und im `project-store`.
2. **Die Elementart `bild` wird gestrichen.** `Listenelement.art` behält nur `'video' | 'segment'`.
   **Code-Stand (geprüft 16.08.): bereits umgesetzt** – `src/shared/contracts/project.ts` führt
   `art: 'video' | 'segment'` (Kommentar verweist auf TK v3.16 / 9.11.3), ebenso `RenderItem.art`
   in `render-request.ts`; der Test-Refactor von `'bild'` auf `'segment'` ist committet. **Nicht
   betroffen:** `Asset.typ: 'video' | 'bild'` bleibt – Bilder werden weiter importiert und über
   `Aktion.bildRef` benutzt.

**Die projektweite Standarddauer ist gebaut (#334, TK v3.19/v3.20)**; `StartBefund` ist mit TK v3.20
ebenso Vertrag. Ob ein Folge-Issue baubar ist, sagt `python tools/bereitschaft.py`.

### Werkzeuge, die du benutzen sollst statt sie neu zu bauen

| Werkzeug | wofür |
|---|---|
| `tools/bereitschaft.py` | was ist baubereit |
| `tools/zitate-pruefen.py` | Rückwärts-Regel: Zitat-Abgleich über **alle** Issues nach einer Vertragsänderung |
| `tools/zitate-korrigieren.py` | setzt veraltete Zitate – in Issue **und** lokaler Quelldatei; jede Ersetzung muss genau einmal passen, sonst Abbruch |
| `tools/geruest.py` | erzeugt Rümpfe aus den Signaturblöcken; fasst bearbeitete Dateien **nie** an |
| `tools/bild-fundstellen.py` | einmalige Erhebung für die `bild`-Streichung (unterscheidet `Listenelement.art` von `Asset.typ`) |
| `tools/generate-docx.js` | Word aus Markdown, Markenlayout |

### Arbeitsweise beim Bauen – teuer gelernt

- **Gegenproben sind Pflicht, und ihre RÜCKNAHME muss belegt sein.** Am 14.08. sind zwei Agents
  mitten in einer Gegenprobe gestorben und haben eine absichtliche Verfälschung liegengelassen.
  Seither: nach jeder Mutation Prüfsumme oder `diff` gegen eine Sicherung.
- **Belege, dass die Mutation überhaupt gegriffen hat.** Achtmal in einer Sitzung meldete eine
  Gegenprobe „alles grün", weil sie einen Kommentar statt Code traf, ein Zeilenende-Muster nicht
  zündete oder das Prüfskript seinen eigenen Absturz als Erfolg las. *Eine Probe ohne Beleg, dass
  sie die Datei verändert hat, ist keine Probe.*
- **Ein Testwert, der zufällig glatt aufgeht, belegt nichts.** `dauer: 0.7` ist exakt 21 Frames und
  übersteht jede 30-fps-Rundung; von 539 zulässigen Bandhöhen gehen nur **59** glatt auf, und die
  eingebaute 162 ist eine davon. Wähle krumme Werte.
- **Grep-Proben unterscheiden nicht zwischen Code und Prosa.** Mehrfach verbot eine DoD eine
  Zeichenkette, die der verbindliche Signaturblock desselben Issues vorschreibt. Wer filtert:
  `\r\n` **zuerst** normalisieren (`core.autocrlf=true`) und mit einer Gegenprobe belegen, dass der
  Filter wirklich etwas entfernt.
- **Tests, die echte Prozesse starten, gehören nach `tests/integration/`** (Zeitgrenze dort global
  120 s). In `tests/unit/` reißen sie unter Last die 5-Sekunden-Grenze und lassen fremde Arbeit
  kaputt aussehen.
- **Widerspricht ein Issue dem gebauten Code, gewinnt der gebaute Code** – und der Widerspruch wird
  gemeldet, nicht stillschweigend aufgelöst.

### Offene Entscheidungen und Befunde (Stand 16.08.2026)

- **Datenort beim Start nicht beschreibbar** (#51/#3): entschieden ist ein Dialog im Main mit
  „Erneut versuchen"/„Beenden" und generischem Text. Ursachenbezogene Texte erst, wenn die
  errno-Zuordnung an echten Sticks **gemessen** ist. `erzwingeEinzelInstanz` liefert `StartBefund`
  mit drei Zuständen – seit TK v3.20 (23.08.2026) Vertrag; #3 trägt einen Nachtrag, der
  `index.ts`-Kommentar ist berichtigt. Die Abweichung ist damit GESCHLOSSEN.
- **`marken_datei_fehlt`** (vierter Reparatur-Weg, TK 2340) ist von `KaputteStelle` nicht abbildbar –
  eigenes Issue, gebaut mit M8.
- **`meldeAn` und `istGefuellterText` doppeln Namen** – die Folge-Issues **#332** (Nutzlast-Prüfer
  an einen Ort) und **#333** (Doppelnamen auflösen) sind angelegt.
- **Beim User:** der TV-Test (hinterlegt in #184, #186, #188, #230, #231; Nachträge vom 23.08.).
  **Recherchiert und belegt (23.08.):** Der UE85AU7170 unterstützt am USB FAT, exFAT und NTFS
  (Samsung offiziell; baugleiche TU7000-Klasse) – die 4-GiB-Grenze ist **keine** Produkteigenschaft,
  sie gilt nur für FAT32-Sticks. #184 bleibt unverändert richtig gebaut; Empfehlung ans Personal:
  Stick als exFAT formatieren. **Weiter offen (nur physisch testbar):** Läuft die USB-Wiedergabe
  nach einem Stromausfall von selbst wieder an? Ist „Repeat One" zuverlässig? Firmware-Version
  steht nur am TV (Einstellungen - Support - „Über dieses TV").

### Behobene Befunde (16.08.2026, Commit `7f6e776`; Beleg unten)

- **`RenderProgress` doppelt definiert** – `render-result.ts` trägt jetzt nur noch den Re-Export,
  `render-progress.ts` (#157) ist die einzige Wahrheit.
- **#180 „Tonspur vorhanden"** – `ausgabe-platzieren.ts` prüft die Tonspur selbst (Schritt 2b),
  unabhängig von den Layout-Merkmalen (#170).
- **H = 1078** (`videoBreite = 0`) – zulässig ist jetzt **H ≤ 1076**; die Schranke fragt den
  geteilten Rechenkern `berechneBandGeometrie` (#239).

Commit `7f6e776` nennt die Gegenproben; alle drei haben gebissen und wurden mit Prüfsumme
zurückgenommen. Damit sind die im „STAND vom 10.08." offenen Punkte **RenderProgress / Tonspur /
Bandhöhe** erledigt.

---

## STAND vom 10.08.2026 (überholt durch den Abschnitt darüber, bleibt als Beleg)
Dieses Dokument ist gewachsen und enthält viel Historie. Wo eine ältere Zeile diesem Abschnitt
widerspricht, gilt dieser Abschnitt. Die Historie bleibt stehen, weil die Begründungen darin wertvoll
sind – aber sie ist Vergangenheit, nicht Anweisung.

- **Es wird gebaut.** M0 (Grundgerüst) ist fertig: Typecheck, Lint, Tests und Build sind grün, und
  eine portable Windows-EXE startet. Offen an M0 sind nur zwei Punkte, die nur der User erledigen
  kann: das macOS-Artefakt und `npm run dist` aus einem normalen Terminal (beides #7).
- **Ein Branch für alles: `main`.** Die früheren Stränge `bau/m0-01-grundgeruest` und
  `planung/ad-v1.2-tk-v2.3-issues` sind am 10.08.2026 konfliktfrei nach `main` gemergt. Neue Arbeit
  bekommt einen eigenen Branch von `main`, je Issue einer. Die Anweisung „NICHT nach main mergen"
  weiter unten ist damit überholt.
- **Dokumente: Technisches Konzept v3.13, Anforderungsdokument v1.4.** Ältere Versionsangaben in
  diesem Dokument (v2.x, v3.3, v1.2) sind Historie. [Stand 16.08.2026: heute gelten v3.18 / v1.6,
  s. „STAND HEUTE".]
- **Meilensteine M0 bis M8.** M8 (Marken) ist am 10.08.2026 mit 56 Issues dazugekommen – mehrere
  Marken, app-weit gespeichert, mit Editor. AD/TK sind dafür bereits nachgezogen.
- **Das Funktionsgerüst steht.** 231 Dateien mit 463 werfenden Rümpfen, erzeugt aus den
  „Signatur (verbindlich)"-Blöcken der Issues durch `tools/geruest.py`. Ein Agent füllt **nur den
  Rumpf**; Signaturen ändert man im Issue, nicht in der Datei. Der Generator vergleicht beim
  erneuten Lauf Byte für Byte und fasst eine bearbeitete Datei **nie** an.
- **Der Bootstrap wird über eine Kette verdrahtet:** #268 - #269 - #270 - #271 - #272 - #273 -
  #274 - #331, je ein Glied als letztes Issue seines Meilensteins. Erst #331 stellt fest, dass
  `src/main/index.ts` lückenlos ist.
- Planungsziel: scharfe Modulgrenzen + Schnittstellen. Ich baue das Grundgerüst selbst und lasse
  die Funktionen von Agents füllen – die brauchen vollen Projektkontext und ihren Platz im Ganzen.
- WARUM der Kontext kritisch ist: Die Agents füllen einzelne, kleine Funktionen (oft nur ~30 Zeilen),
  treffen darin aber Low-Level-Entscheidungen und Trade-offs (Datenformate, Fehlerbehandlung,
  ffmpeg-Parameter, Speicher/Performance, Rundungen, Grenzfälle), die – falsch gewählt – am Ende das
  GANZE Projekt ruinieren können. Ich verstehe nicht alle eingesetzten Technologien in der Tiefe und
  kann solche Fehler nicht zuverlässig erkennen oder gegenprüfen. Deshalb muss die Planung jeden
  Baustein lückenlos in den Gesamtkontext einordnen, Annahmen und Trade-offs explizit machen und die
  Schnittstellen so scharf definieren, dass eine lokale Entscheidung in einer kleinen Funktion nicht
  global Schaden anrichten kann. Lieber eine Vorgabe zu viel als eine zu wenig.
- Liefer-Dokumente immer als Word im Markenlayout UND synchron als Markdown.
  Brand: Primärfarbe #FF4040, Logo nur auf dunklem Balken, Schriften Playfair Display / Arial Black /
  freier Helvetica-Ersatz.

## Projekt in Kürze
- Tool für das Fitnessstudio Fitnessworld24 (Baller Gruppe). Erste Stufe: EIN Studio, EIN Bildschirm.
- Hardware: nur ein Samsung Consumer-TV (UE85AU7170, 85", Tizen) + USB-Stick. Kein Mediaplayer.
- Lösung: Ein Desktop-Tool auf dem Laptop erzeugt je Lauf EINE durchgehende, frei benannte MP4
  (FA-22, mehrere je Projekt möglich); der TV spielt sie vom USB
  als MANUELL gestartete Endlosschleife. Der TV ist nur „dummer" Player (eigene Smart-TV-App
  ungeeignet: kein Autostart beim Booten, Firmware-/Zertifikatsprobleme).

## Die zwei Dokumente (liegen bei)
- Anforderungsdokument v1.6 = das „WAS" (Funktionen, Regeln, Ausgabe-Profil, Akzeptanz).
- Technisches Konzept v3.18 = das „WIE" (Architektur, Datenbestand, DFD, HLD Abschnitt 9).
  Bitte beide unbedingt lesen, bevor du etwas vorschlägst.
- WORKFLOW: Markdown ist Quelle der Wahrheit; beide .docx werden daraus generiert mit
  `node tools/generate-docx.js <in.md> <out.docx> [--dfd tools/assets/dfd.png]`. Nach jeder
  Änderung .md und .docx synchron halten. Agent-Kontext: docs/agents/system-design-context.md
  ist das lebende Kontextdokument und wird laufend mitgepflegt.

## Wichtigste Festlegungen (schon entschieden)
- Ausgabe-Profil: MP4, H.264 High, 1920×1080, 30 fps, ~10–12 Mbit/s, stumm. Dateiname FREI (FA-22).
  Abweichende Seitenverhältnisse - schwarze Balken (Letterbox/Pillarbox, kein Beschnitt).
  Videos sind trimmbar; Standard-Segmentdauer 10 s (einstellbar 10–45 s); harter Schnitt.
- Tech-Stack: Electron + TypeScript + React + Vite; dnd-kit; HTML5-Canvas - PNG für Aktions-Segmente;
  gebündeltes ffmpeg (ffmpeg-static + fluent-ffmpeg); Datenhaltung JSON je Projekt (lowdb),
  SQLite optional; Verpackung electron-builder Portable (Win 10/11 + macOS 13+, kein Installer, ohne Admin).
- Render-Pipeline (bereits prototypisch mit echtem ffmpeg getestet): jedes Element auf identisches
  Profil normalisieren (scale + pad), dann per ffmpeg concat-Demuxer mit -c copy verlustfrei und
  schnell zur fertigen Ausgabedatei zusammenfügen.
- Datenmodell-Entscheidungen: (1) Medien ins Projekt KOPIEREN; (2) Aktionen REFERENZIERBAR
  (Bibliothek je Projekt, Mehrfachnutzung erlaubt); (3) Medien PRO PROJEKT; (4) Segment-PNGs IMMER
  NEU rendern (flüchtig); (5) Vorlagen DATENGETRIEBEN ab v1 (zwei eingebaute: „Vollbild", „Split").

## Architektur & Datenfluss (Stand)
- Electron: Renderer (React-UI) + Main (Node), verbunden über typisierten IPC-Vertrag.
  Nur der Main berührt ffmpeg und Dateisystem.
- DFD-Prozesse: P1 Medienverwaltung, P2 Inhaltsverwaltung, P3 Zusammenstellung,
  P4 Finaler Render + Export, P5 Vorschau.
- Speicher: D1 Projekt-Store, D2 Medienordner, D3 App-Konfig, T1 flüchtiger Render-Arbeitsbereich.
- ZWEI Render-Arten mit gleichem Eingang (Liste + Medien): P5 Vorschau (UI-Simulation, OHNE ffmpeg,
  - Bildschirm) und P4 finaler Render (ffmpeg - benannte Ausgabe-MP4 - USB).
- Vorschau = UI-Simulation: Aktions-Segmente nutzen exakt dasselbe Canvas-Bild wie der finale Render
  (pixelgleich), Videos laufen nativ; finale Kontrolle bleibt die gerenderte Ausgabedatei.

## HLD-Modulschnitt (von mir bestätigt)
- Renderer: ipc-client, app-shell, composer [P3], action-editor [P2],
  template-canvas (geteilt: Segment - PNG), preview-player [P5].
- Main: ipc-gateway, media-service [P1], project-store [D1], config-store [D3],
  render-service [P4], export-service, ffmpeg-adapter (enthält den getesteten buildReel-Kern).
- Geteilt: contracts/types (Project, Action, Asset, ListItem, Template, Brand, RenderRequest …).
  Renderer ↔ Main reden AUSSCHLIESSLICH über den typisierten IPC-Vertrag.
- STATUS HLD: FERTIG sind render-service [P4] (TK 9.2), auftrags-manager [P6] (TK 9.3, NEU – Subsystem),
  media-service [P1] (TK 9.4, NEU). Übrige Modul-Verträge folgen.
- Auftragsverwaltung (auftrags-manager, P6, NEU, zentral): Verwaltungs-Subsystem, nicht nur Queue.
  Torwächter (serielle Freigabe, einziger Sperr-Mechanismus, KEIN zweites Lock) für
  import/loeschen/render/export; Zustandsführung; Wiederholung; drei Speicher mit drei Persistenzen:
  Q1 aktive Warteschlange (flüchtig/RAM), Q2 Wiederholung (persistent bis erledigt, projects/<id>/queue-retry.json),
  Q3 Protokoll (dauerhaft, protokoll.json; enthält Ausgabe-Historie, zuvor D3). Im DFD (TK 7) als P6 + Q1/Q2/Q3.
  Anforderungsdokument: FA-16/17/18, NFA-09, Abschnitt 4.3.

## Bereits geklärt (war der offene Punkt)
- IPC-Granularität ENTSCHIEDEN: Variante A – der Renderer rendert die Segment-PNGs
  (template-canvas, pixelgleich zur Vorschau) und übergibt sie als Binärpuffer; nur der Main
  schreibt/liest das Dateisystem und ruft ffmpeg. Nur Segment-PNGs gehen über IPC; Importe liest
  der Main per relativem Pfad aus D2. Details im TK Abschnitt 9.1/9.2.

## Nächste Schritte (in dieser Reihenfolge)
1. ERLEDIGT: IPC-Granularität entschieden (Variante A).
2. HLD finalisieren: je Modul ein scharfer Schnittstellen-Vertrag (Eingang - Ausgang, fachlich, ohne
   Implementierung), dann ins TK Abschnitt 9 – Word + Markdown.
   - ERLEDIGT: render-service [P4] (9.2), auftrags-queue (9.3), media-service [P1] (9.4).
   - ERLEDIGT: FA-13 (eigene Vorlagen, Kann), FA-14 (Trim, Soll), FA-15 (Auto-Speichern & Sitzung, Soll)
     im Anforderungsdokument v0.5; FA-10 zu „Projektverwaltung" geschärft; neue Rubrik 4.4 (einheitlicher
     Dauer-/Trim-Regler). FA-Nummern lückenlos 01–18.
   - ERLEDIGT: frame-genauer Trim als Invariante in render-service (9.2.6), gesamtdauer framegerundet.
   - ERLEDIGT: project-store/config-store [D1/D3] (9.5) – D1-Lock, Auto-Save (entprellt 3–5 s + Sofort-Flush,
     atomar, .bak-Backup), Lösch-Asymmetrie (Medium blockiert / Aktion kaskadiert medienschonend), schemaVersion.
   - ERLEDIGT: export-service (9.6) – Auftrag art:export, FAT32-Wächter vorab, atomar (.part+Rename-Ersetzen,
     vorhandene Zieldatei geschützt), fsync vor Erfolg, Zielname = QUELLNAME (der Zwang auf exakt
     loop.mp4 ist mit FA-22 ENTFALLEN), letztes Ziel in config-store.
   - ERLEDIGT: composer [P3] (9.7) – Renderer-UI Liste/Reorder/Dauer/Trim, optimistisch mit Abgleich
     (synchron abgelehnt→Rollback / Auto-Save-Fehler→kein Rollback, warnen+retry), Thumbnails renderer-seitig.
     + 9.5.4-Ergänzung (Instant-Op vs. Speichern). + 9.7.5 GEFÜHRTER Reparatur-Modus für kaputte Elemente
     (zurückleiten, eins nach dem anderen, X von N, Render erst frei wenn alle behoben).
   - ERLEDIGT: FA-19 (geführte Reparatur, Soll) im Anforderungsdokument v0.6, Akzeptanzkriterium 7.
   - ERLEDIGT: action-editor [P2] (9.8) – Aktionen anlegen/bearbeiten, Live-Vorschau via template-canvas
     (einzige Pixelquelle), Bild=Referenz, Akzentfarbe aus Markenpalette (fest v1), standardDauer nur Default,
     Kaputt-Handling 9.8.5 (fehlt-Bild - Fix auf Aktions-Ebene behebt alle referenzierenden Elemente).
   - ERLEDIGT: preview-player [P5] (9.9) – UI-Simulation ohne ffmpeg, Medienzugriff über media:// (9.5.7).
   - ERLEDIGT: project-store ist Pfad-Autorität + trägt media://-Protokoll (9.5.7); Detail durchgängig in 2,
     8, 9.1, 9.2.5, 9.4.1, 9.5, Modul-Liste ergänzt (Renderer-Medienzugriff nur lesend via media://).
   - ERLEDIGT: template-canvas (9.10) – EINZIGE Pixelquelle: eine Zeichenroutine - Canvas 1920×1080,
     Anzeige (CSS-skaliert) und PNG-Export aus DEMSELBEN Aufruf (kein zweiter Zeichenpfad); Determinismus
     (devicePixelRatio ignorieren, Schriften+Bild vor dem Zeichnen geladen, kein Zufall/Cache); Marken-
     Schriften GEBÜNDELT (Playfair Display fehlt auf Win/macOS); Sicherheitsabstand 5 % (96/54 px);
     Text-Überlauf-Kaskade umbrechen→verkleinern→„…"; fehlendes Motiv = Platzhalter (nie in den Render).
   - ERLEDIGT: Datenmodell Vorlage (9.11.1) – Zone{rolle fest/frei, bindung, rahmen ABSOLUTE Pixel im
     1920×1080-Raster, wennLeer "leer"/"ausblenden", text/bild/deko}; Zeichenreihenfolge = Array-Reihenfolge;
     KEIN automatisches Umlayouten; feste Zonen Teil der Vorlage (Editor darf sie nicht ändern);
     eigene Vorlagen dürfen freie + dekorative Zonen ergänzen; Farben/Schriften nur als ROLLEN-Verweise.
   - ERLEDIGT: eingebaute Vorlagen konkret (9.11.1) – Logo 420×120 oben links, Zone `hintergrund` zuerst
     (Aktion ohne Bild rendert nicht schwarz), „Vollbild" mit `scrim` für Textlesbarkeit, „Split" mit
     `contain` (kein Produkt-Beschnitt). Vorlagen sind APP-WEIT (vorlagen.json); Löschen nur wenn KEIN
     Projekt sie nutzt - Referenzprüfung über ALLE Projekte; eingebaute unlöschbar + eingefroren.
   - ERLEDIGT: Marke (9.11.2, Rollen + gebündelte OFL-Schriften Playfair/Archivo Black/Arimo);
     RenderProfile geschärft (9.2.4: yuv420p, High/L4.0, BT.709, SAR 1:1, gedeckeltes VBR, geschlossene GOP +
     Keyframe je Segment, stille AAC-Spur - R-06 entschieden, +faststart); Einzel-Instanz (9.5.4, an den
     DATENORT gebunden wegen portabler EXE); Project/Listenelement + ID-Schema UUID + Konstanten (9.11.3/9.11.4,
     Reihenfolge = Array-Reihenfolge, KEIN position-Feld); Undo/Redo (9.13).
   - HLD VOLLSTÄNDIG: Anforderungsdokument v1.1, TK v2.2. FA-Nummern lückenlos 01–21, R-06 entschieden.
     Alle Lücken des Prüfbefunds vom 03.07. geschlossen.
     ERLEDIGT aus dem Befund: A1 Versions-Widerspruch, A2 veraltete Vollständigkeits-Aussagen, P1–P5→P1–P6.
   - ERLEDIGT: Ambiguitäts-Audit (7 Punkte), u. a. IPC-Konventionen 9.1.1 (Ergebnis-Hülle), Q4 Warteschlangen-
     Journal, app-shell 9.14 (Modus-Reiter + Warteschlangen-Leiste).
   - ERLEDIGT: VOLLPRÜFLAUF 23.07. – 5 Befunde behoben: (A1) AD-Abschnitte standen 4.3→4.5→4.6→4.4, jetzt
     sortiert; (A2) Widerspruch 9.1.1 vs. Operations-Tabellen — die Ergebnis-Hülle steht jetzt in JEDER
     Signatur ausgeschrieben (`Ergebnis<T>` / `Ergebnis<void>`), Aufträge dagegen ausdrücklich OHNE Hülle
     (ihr Ergebnis reist über den Auftrags-Zustand); (A3) 9.2 Richtungsangabe (Render läuft über die Queue,
     kein Direktaufruf); (A4) P1–P6→P1–P7; (A5) Schluss-Notiz aktualisiert.
     ZUSÄTZLICH: Generator-Fehler gefunden — `inlineRuns` konnte Fett+Code (`**`x`**`) nicht verschachteln,
     87 Absätze zeigten im Word sichtbare Backticks/Sterne. Behoben (rekursives Parsen), 0 inhaltliche
     Abweichungen im Absatz-Diff. Agent-Kontext: neuer Abschnitt 4b mit dem IPC-Vertrag (fehlte KOMPLETT).
3. LÄUFT: Überführung in Tasks. Repo NiklasRist/Digital-Signage-Tool.
   REIHENFOLGE (vom User klargestellt 03.08.): Erst das GRUNDGERÜST bauen (M0, #1-#12), dann werden
   die offenen Punkte in M1 überhaupt beantwortbar. Die 21 braucht-entscheidung-Issues sind KEINE
   Liste, die vorher abzuarbeiten ist. Und: Ein STOPP-Punkt ist entweder eine ENTSCHEIDUNG (Produkt-
   wahl, die der User treffen kann) oder ein EXPERIMENT (empirische Frage zum Plattformverhalten -
   reicht requestSingleInstanceLock für zwei EXE-Kopien? zeigt PORTABLE_EXECUTABLE_DIR auf den Stick?).
   Experimente kann niemand entscheiden, sie müssen ausprobiert werden - und das Grundgerüst ist die
   Vorrichtung dafür. Deshalb kommt es zuerst. Nicht zu Entscheidungen drängen, die noch nicht dran sind.
   [ÜBERHOLT 10.08.2026: Alles liegt auf main, s. „STAND HEUTE" oben.] Arbeit lief auf dem Branch
   planung/ad-v1.2-tk-v2.3-issues, damals NICHT nach main gemergt.
   - M0 (Grundgerüst) = Issues #1-#12, angelegt, GEPRÜFT und korrigiert (23.07.).
     Prüflauf fand 9 Befunde, 4 kritisch: #1 DoD wegen TS18003 nicht erfüllbar (leere Ordner);
     #5 fehlendes PORTABLE_EXECUTABLE_DIR (NSIS-Portable entpackt nach Temp -> Datenverlust);
     #7 extraResources unvereinbar mit Renderer-Bundling aus #8; #11 Vitest-Config, die die
     Integrationstests nie ausgeführt hätte. #4 und #9 waren ohne Befund.
   - MUSTER dahinter: 4x stand Offenes im Block "Signatur (verbindlich)". Deshalb neu im
     Übergabe-Prompt Abschnitt 7: Regel C (verbindlich = entschieden; Offenes NUR im STOPP-Block,
     nie beides), Regel D (Zitate wörtlich oder gar nicht - ein erfundenes TK-Zitat war drin),
     Regel E (jeder DoD-Punkt muss im erlaubten Dateibereich erfüllbar sein).
   - [HISTORISCH, überholt durch den Eintrag weiter unten] M1 im Draft angefangen (M1-01..M1-29),
     damals noch nicht vollständig und nicht angelegt. Es fehlten:
     entferneElement, ordneNeu, setzeTrim, setzeDauer (TK 9.5.2), Auto-Speichern (9.5.4),
     Einzel-Instanz (9.5.4), Pfad-Autorität + media://-Auflösung (9.5.7).
     ACHTUNG: die 29 entstanden VOR den Regeln C/D/E - vor dem Anlegen gegenprüfen.
   - M1 (M1-01..M1-40) VOLLSTÄNDIG geschrieben, GEPRÜFT, KORRIGIERT und ANGELEGT (02.08.):
     Issues #13-#52, Milestone "M1 - Fundament". M1-XX -> #(XX+12). Alle M1-xx/Sx-Verweise in den
     Bodies sind zu klickbaren #-Nummern umgeschrieben (194 Stellen). Mapping-Tabelle im Draft.
     Labels neu: modul:ipc, modul:config-store, modul:project-store, art:logik, art:fehlerbehandlung.
     HINWEIS zu "braucht-entscheidung": NICHT automatisch vergeben. Regel B verlangt von JEDEM Issue
     einen STOPP-Block, damit träfe "hat offene Punkte" auf 37 von 40 zu = Rauschen. Das Label sitzt
     jetzt auf den 13 M1-Issues, bei denen eine unbeantwortete Frage die SCHNITTSTELLE oder das
     VERHALTEN festlegt (explizite Liste im Anlege-Skript begründet).
     DAS KRITERIUM (jetzt in Prompt Abschnitt 10): Ein STOPP-Block enthält zwei Arten von Einträgen -
     VERBOTE ("hier keine Pfadauflösung einbauen") und ECHTE OFFENE FRAGEN ("Datenort neben EXE oder
     userData?"). Nur die zweite Art rechtfertigt das Label. Nicht automatisierbar, ist Beurteilung.
   - NACHKORREKTUR 02.08. (eigene Fehler): (1) braucht-entscheidung saß auf ALLEN 12 M0-Issues -
     bei #1/#4/#10/#11 enthält der STOPP-Block nur Verbote, Label entfernt (jetzt 21 statt 25).
     (2) #51 (M1-39) hatte Modul "project-store", Datei aber src/main/einzel-instanz.ts, also
     AUSSERHALB des Modulordners -> nach src/main/project-store/einzel-instanz.ts verschoben, in
     Draft und GitHub. (3) Übergabe-Prompt war gegenüber den Dokumenten VERALTET: nannte v1.1/v2.2
     und "EINE fertige loop.mp4" - 11 Stellen abgeglichen auf v1.2/v2.3 + FA-22, neuer Abschnitt 5.11
     mit der kompletten Ausgabe-Regelung (brauchen M2 und M6). Neue Checklistenpunkte: Label-Kriterium
     und "Modul, Titel-Präfix und Dateipfad müssen zusammenpassen". Prüflauf: 6 Prüfer, alle 39 (+1 neues) Issues. Muster: Regel E (Testdatei-Ausnahme
     im DoD fehlte ~21x), Regel C (Signatur entscheidet + STOPP fragt dasselbe, 7x), Regel D
     (erfundene/ungenaue Zitate, 7x). Schwerste Einzelfunde: M1-28 löschte die Aktion gar nicht
     aus Project.aktionen; M1-05 fehlte ausgabeName; M1-07 fehlte historieEintrag; M1-21 fehlte
     letzterAusgabeName; M1-23 fehlte das D1-Lock; M1-17 hatte Ergebnis<unknown> mit ERFUNDENER
     Begründung. NEU: M1-40 [contracts] Typ Marke - war nirgends definiert, obwohl M1-14/M1-17
     ihn brauchen. Befund + Behebung: docs/agents/m1-pruefbefund.md.
   - BELEG, dass die Regeln wirken: M1-37/38/39 entstanden NACH Regel C/D/E - M1-37 und M1-38
     hatten NULL Befunde, M1-39 nur die Testdatei-Zeile.
   - M0 hatte dieselbe Regel-E-Lücke in #4/#6/#8 - auf GitHub korrigiert.
   - [HISTORISCH, überholt: M2-M5 sind angelegt, s. unten] M2-M7 offen. Dry-Run in
     docs/agents/issues-draft.md, Freigabe vor jedem Anlegen.
   - ANFORDERUNGSÄNDERUNG 02.08. (AD v1.2 / TK v2.3): MEHRERE benannte Ausgabedateien je Projekt.
     Ausgabeordner jetzt projects/<id>/output/ statt app-weit (app-weit war ein FEHLER: Render in
     Projekt B hätte die Datei von Projekt A überschrieben - beim Issue-Schreiben gefunden).
     RenderRequest.ausgabeName (ohne Endung), vorbelegt mit Project.letzterAusgabeName -> gleicher
     Name ersetzt, neuer Name legt zusätzlich an. KEIN Zeitstempel im Namen (Datum zeigt die UI).
     Render schreibt atomar über T1 + Rename, damit ein Fehlschlag die alte gute Datei nicht zerstört.
     Name = Nutzereingabe -> validieren. Zwang "Zielname exakt loop.mp4" ENTFALLEN; mehrere Dateien
     dürfen auf den Stick, Personal wählt am TV -> dort "Repeat One" statt "Repeat All" (Risiko R-04).
     Neu: FA-22, AD 4.7, Akzeptanzkriterium 9. Nachgezogen: DFD-Beschriftung, Agent-Kontext 9b2,
     Draft M1-06 (dateiname RAUS aus RenderProfile) und M1-07, GitHub #8.
   - M2 FERTIG (03.08.): Issues #53-#71 angelegt, Milestone "M2 - Torwächter", M2-XX -> #(XX+52).
     19 statt 16 Issues. Geschrieben mit VORAB-BRIEFING (alle vom TK offengelassenen Festlegungen
     ausgeschrieben) -> Regel D zu 100% eingehalten, Regel E lückenlos. Prüflauf: 4 Prüfer (3x je 6
     Issues + 1 QUERSCHNITT über alle), ~45 Befunde, 11 kritisch - ALLE an den NÄHTEN zwischen
     Issues, keiner innerhalb eines Issues. Schwerste: speicher_fehler in keinem Typ deklariert;
     projektId fehlte im ganzen Abschlusspfad; unklar ob Q1 lebende Einträge oder Kopien liefert
     (hätte die serielle Garantie LAUTLOS gebrochen); Abbrecher registrierbar aber nicht aufrufbar;
     NIEMAND meldete die vier Kanäle beim ipc-gateway an (-> neues Issue M2-19); Abbruch löschte
     den Fehlschlag aus Q2 (verletzt FA-17). Durchgehendes Muster: Regel A gilt auch ZWISCHEN
     Modulen - ein Aufruf darf nie nur als Issue-Nummer dastehen, Name und Signatur gehören ins
     Issue (betraf alle 18). Befund: docs/agents/m2-pruefbefund.md.
     LABEL: nach dem Schreiben hätte braucht-entscheidung auf 17 von 18 gepasst = Rauschen. Durch
     15 selbst getroffene Entscheidungen zu lokalen Details jetzt 9 von 19. Merksatz: lokale
     Detailfragen ENTSCHEIDEN, nicht in den STOPP-Block legen.
     WERKZEUG: create-issues.py hat jetzt ein PROFIL je Meilenstein (Präfix der Dateinamen wählt
     aus, unbekannter Präfix bricht ab) + Label-/Milestone-Prüfung im Trockenlauf. NEU
     tools/verweise-nachziehen.py (476 Querverweise M2-xx -> #nn umgeschrieben). Ab M2 liegen die
     Volltexte als EINE DATEI JE ISSUE in docs/agents/m2/, nicht mehr im Draft - eine Quelle.
   - [HISTORISCH] M2-Zuschnitt vom 03.08.: 18 statt 16 Issues. NEU M2-17 (ein gemeinsamer atomarer +
     serialisierter Schreib-Baustein für Q2/Q3/Q4 - TK 9.5.4 verlangt eigene Serialisierung; sonst bauen
     drei Agents drei Mechanismen) und M2-18 ("Auftrag abschließen": terminaler Übergang, Q3-Eintrag,
     Q2-Pflege, nächsten freigeben - hatte im 16er-Schnitt kein Zuhause, dieselbe Lückenklasse wie M1-28).
     KEINE Leseoperation für Q3: die Ausgabe-Liste (FA-22) kommt aus dem Ausgabeordner, nicht aus dem
     Protokoll; Q3 bleibt in v1 bewusst nur schreibend (Historie/Nachweis).
   - TK v2.4 (03.08., beim M2-Zuschnitt gefunden, vom User entschieden): (1) pendingDeletions sind KEINE
     Aufträge - 9.3 sagte "automatisch beim Start neu einreihen", das widerspricht 9.4.6/9.4.7 und wäre
     IMMER mit asset_nicht_gefunden gescheitert (der D1-Eintrag ist beim Löschen zuerst weg). Jetzt:
     Auftragsverwaltung VERWAHRT sie in Q2 und bietet main-intern Lesen/Ergänzen/Streichen; AUSGEFÜHRT
     wird vom Reconcile des media-service. (2) listeAusgaben(projektId) in 9.5.2 ergänzt - Ausgabe-Liste
     (FA-22) und Dateiauswahl beim Export (9.6.1) hatten KEINE Datenquelle; gehört zur Pfad-Autorität.
     Nachgezogen: TK.md + TK.docx (geprüft: ZIP/XML ok, 0 Backticks, Absatz-Diff = nur die Änderungen),
     Agent-Kontext, Übergabe-Prompt, uebergabe-stand. AD unverändert (v1.2).
   - TK v2.5 (03.08., beim M3-Zuschnitt gefunden, vom User entschieden): (1) Auftrag.ergebnis (9.3.1) -
     das Auftrags-Ergebnis ("der fertige Asset", 9.4.3) hatte KEINEN Weg zur Oberfläche; ein Import wäre
     unsichtbar geblieben. (2) fehler.daten (9.1.1) - asset_referenziert musste laut 9.4.9 die betroffenen
     Listenelemente nennen, konnte sie aber nirgends transportieren -> FA-19 (Reparatur-Modus) nicht
     bedienbar. (3) ffprobe wird mitgeliefert (Abschnitt 3, 9.4.5) - ffmpeg-static enthält es NICHT, der
     Import liest damit Maße und Dauer; ohne das wäre JEDER Import beim Kunden gescheitert (im Dev-Modus
     verdeckt ein zufällig installiertes ffprobe den Mangel). (4) versuche steigt beim START (Nachtrag aus
     M2). (5) pendingDeletions speichern dateiname statt Pfad (Nachtrag aus M2). (6) speicher_fehler bei
     löscheMedium ergänzt (9.4.9) - der D1-Schreibfehler war real möglich, aber in der als vollständig
     geführten Tabelle nicht vorgesehen.
     NACHGEZOGEN: 9 Issues an den neuen Vertrag (#6,#12,#16,#22,#53,#60,#61,#68,#70), danach die
     Fehlercode-Naht bis zum Ende verfolgt (HandlerErgebnis<F> generisch; Auftrag.fehler.code und
     ProtokollEintrag.fehler.code als string, weil der GETEILTE Vertrag die fachlichen Unionen der
     Main-Module nicht kennen darf - die Enge sitzt dort, wo der Code ENTSTEHT).
     ZWEI NEUE REGELN: (a) Eine Vertragsänderung erzwingt einen ZITAT-ABGLEICH über ALLE angelegten
     Issues - Regel D gilt rückwärts; 14 von 71 trugen veraltete wörtliche Zitate, 16 Ersetzungen.
     (b) Nach jeder GitHub-Änderung die LOKALEN Quelldateien angleichen, sonst überschreibt der nächste
     Lauf die Korrekturen (Kontrolle: normalisieren + diffen, zuletzt 19/19 deckungsgleich).
   - M3 FERTIG (03.08.): 17 Issues #78-#94 (Milestone "M3 - Medien", M3-XX -> #(XX+77)) plus
     6 Nachzügler #72-#77 im Milestone M1 (M1-41..46; die Faustregel XX+12 gilt für sie NICHT).
     Grösster Befund beim Zuschnitt: In ganz M1 meldet KEINE Operation ihren IPC-Kanal an (nur
     Wrapper #23 und Registry #25 existieren) - M1 wäre fertig gebaut worden und die Oberfläche käme
     an nichts heran. Deshalb die zwei Verdrahtungs-Issues; dazu fehlten dem project-store alle
     Asset-Operationen, obwohl TK 9.4.1 dem media-service eigene D1-Schreibvorgänge verbietet.
     Prüflauf: 4 Prüfer, ~45 Befunde, 5 kritische - erneut ALLE an den Nähten. Schwerste: ein Typ,
     den es nicht gibt (daten?: Fehlerdaten - im TK Platzhalter, im Vertrag unknown, in 8 Texten);
     eine falsch abgeschriebene Signatur; ein Rückgabetyp, der die durchgereichten Fehlercodes nicht
     tragen kann; FA-01 "ein ODER MEHRERE" ohne Zuständigen. Label nach der Korrektur: 7 von 23.
     WERKZEUG: create-issues.py hat jetzt ein M3-Profil und einen [ipc-gateway]-Zweig (die alte
     [ipc]-Bedingung trifft "[ipc-gateway]" NICHT - kein Teilstring); verweise-nachziehen.py nimmt
     jetzt MEHRERE Mappings, weil M3 und die Nachzügler sich gegenseitig referenzieren.
     FALLE, die zwei Stunden gekostet hätte: Ein per Skript geschriebenes "\b" im Suchmuster wurde
     als Backspace-Steuerzeichen in die Datei geschrieben - das Muster fand lautlos NULL Treffer.
     Bei generierten Regex-Zeilen immer das kompilierte Muster mit repr() gegenprüfen.
     ZWEITE FALLE derselben Klasse (04.08., aus M5): Beim Schreiben von Python-Skripten über den
     Datei-Schreibweg wurde das schliessende deutsche Anführungszeichen (U+201D) still zu einem
     ASCII-Anführungszeichen normalisiert und beendete damit das String-Literal - Fehlermeldung
     "unterminated string literal" an einer Stelle, die im Editor KORREKT aussieht. Gegenmittel:
     Sonderzeichen über chr(0x201D) aufbauen und die tatsächlichen Codepoints prüfen, nie das
     Schriftbild. Merke ausserdem: Das TK verwendet durchgehend "..." mit ASCII-Schlusszeichen -
     U+201D ist dort ein Fremdkörper und muss vereinheitlicht werden.
   - M4 (Pixel) angelegt: 25 Issues #95-#119, Milestone "M4 - Pixel", M4-XX -> #(XX+94), Volltexte
     in docs/agents/m4/ (map.json). ACHTUNG: Die Befunde dieses Durchgangs sind hier NIE festgehalten
     worden - wer sie braucht, findet nur die Issues selbst und den Draft-Abschnitt.
   - M5 FERTIG (04.08.): 36 Issues #120-#155 (Milestone "M5 - Inhalte", M5-XX -> #(XX+119)).
     Volltexte in docs/agents/m5/, Mapping in docs/agents/m5/map.json. Aufteilung: project-store
     M5-01 + M5-33; composer M5-02..M5-15 + M5-35; action-editor M5-16..M5-23; vorlagen-editor
     M5-24..M5-31 + M5-36; ipc-client M5-32; ipc-gateway M5-34. Drei neue Labels: modul:composer,
     modul:action-editor, modul:vorlagen-editor. 467 Querverweise aufgelöst. Label
     braucht-entscheidung: 15 von 36.
     ZUSCHNITT WAR 31 - der PRÜFLAUF hat FÜNF Issues ERZWUNGEN, alle fünf an den NÄHTEN:
     (1) Der Renderer konnte gar keine Ereignisse empfangen: ipc-client (#24) kannte nur rufeAuf
     (Invoke), damit war queue:geaendert unbeobachtbar und der "nicht gespeichert"-Hinweis
     (Fehlerklasse 2, TK 9.7.3) nicht baubar - VIER Autoren meldeten es unabhängig -> M5-32 (#151),
     abonniere(kanal, hoerer) -> () => void.
     (2) Listenelement.ref konnte niemand umsetzen: TK 9.7.5 nennt drei Fix-Optionen ("neu
     verknüpft/importiert, ersetzt oder entfernt"), TK 9.5.2 hatte keine Operation dafür -
     ausführbar war nur "entfernen", also FA-19 und Akzeptanzkriterium 7 UNERFÜLLBAR. Verschärfend:
     Ein Neuimport vergibt eine NEUE UUID, das Element hätte weiter auf das fehlende Asset gezeigt.
     -> M5-33 (#152) + TK v2.7.
     (3) Zwei Kanäle ohne Anmeldung: #76 meldet genau 14 project-Kanäle an und verbietet einen
     fünfzehnten; setzeEinblendung und setzeElementReferenz wären fertige Main-Funktionen OHNE
     AUFRUFER gewesen - dieselbe Lückenklasse wie in M1 und M2, jetzt zum dritten Mal -> M5-34 (#153).
     (4) Der composer hätte Platzhalter in die MP4 gebrannt: M5-09/M5-15 setzten Schriften, Logo und
     Motive als bereit voraus und verwiesen dafür auf M5-02, das nichts davon tat. Wer den composer
     öffnet, ohne vorher im Aktions-Editor gewesen zu sein, hätte für jedes Bild einen Platzhalter
     gezeichnet - TK 9.10.7 verbietet genau das im finalen Render -> M5-35 (#154).
     (5) Der Vorlagen-Editor war nicht betretbar: für erstelleVorlage, listeArbeitskopien und
     löscheVorlage gab es in ganz M5 keinen Aufrufer, und FA-13 ist ein MUSS -> M5-36 (#155).
     DREI ÜBERGREIFENDE ENTSCHEIDUNGEN, die auch für M6/M7 gelten:
     E1 - KEINE project:geaendert/vorlagen:geaendert-Ereignisse. composer, action-editor und
     vorlagen-editor laufen im SELBEN Renderer-Prozess; ein IPC-Ereignis wäre eine Reise durch den
     Main und zurück, nur um zwei Modulen mitzuteilen, was im selben Speicher schon passiert ist.
     Stattdessen: Jede Operation liefert den neuen Stand zurück, der Aufrufer gibt ihn an die
     gemeinsame Sicht weiter (Projekt: M5-02, Vorlagen: M5-36). Module ausserhalb des besitzenden
     Ordners bekommen die Aktualisierungsfunktion als PARAMETER, nicht per Import. Wer sie
     durchreicht, ist app-shell (M7).
     E2 - Ereignisse vom Main laufen über abonniere (M5-32). OFFEN bleibt, dass
     project:autoSpeichernStatus im Main KEINEN Sender hat: Empfänger da, Sender nicht.
     E3 - Renderer-Signaturen nutzen Ergebnis<T, string>. Fachliche Fehlercode-Unionen liegen in
     src/main/** und dürfen vom Renderer nicht importiert werden; die Enge sitzt dort, wo der Code
     entsteht. Ohne diese Regel hätte jedes Renderer-Issue die Union ein zweites Mal definiert.
     MUSTER zum dritten Mal bestätigt: alle kritischen Befunde sitzen an den NÄHTEN zwischen Issues,
     keiner innerhalb eines Issues. Regel A und D halten inzwischen (rund 60 fremde Signaturen
     geprüft, keine einzige falsch rekonstruiert - die M4-Fehlerklasse ist geschlossen; über 350
     Zitate verifiziert).
   - TK v2.7 (04.08., beim M5-Prüflauf gefunden, vom User entschieden): Operationsliste 9.5.2 um
     setzeEinblendung und setzeElementReferenz ergänzt. .md und .docx synchron (ZIP/XML ok,
     0 Backticks, Absatz-Diff = nur diese Änderungen). Anforderungsdokument unverändert v1.2.
     NACHGEZOGEN auf GitHub: #76 (DoD "genau 14 Kanäle" -> "die vierzehn dieses Issues", Verbot auf
     DIESE Datei eingegrenzt), #24 (DoD: window.api nur AUSSERHALB von src/renderer/ipc-client/
     verboten; Ereignisse über abonniere), #3 (siebter Bootstrap-Eintrag
     verdrahteProjectStoreNachtragIPC(), Zählung an 6 Stellen), #120/#152/#153 (die "TK ist
     nachzuziehen"-Vermerke sind mit v2.7 erledigt). Lokale Quelldateien gegen GitHub geprüft:
     36/36 deckungsgleich.
   - M6 FERTIG (04.08.): 37 Issues #156-#192 (Milestone "M6 - Render & Export", M6-XX -> #(XX+155)).
     Volltexte in docs/agents/m6/, Mapping in docs/agents/m6/map.json. Aufteilung: contracts M6-01/02;
     ffmpeg-adapter M6-03..M6-15; render-service M6-16..M6-26 + M6-34; export-service M6-27..M6-33 +
     M6-35; ipc-gateway M6-36; project-store M6-37. Vier neue Labels: modul:ffmpeg-adapter,
     modul:render-service, modul:export-service und risiko:tv-ausgabe - das letzte ist NEU und eigen
     fuer M6 (ein Fehler faellt hier nicht im Test auf, sondern erst am Fernseher), es traegt 15 der
     37 Issues. 921 Querverweise aufgeloest. braucht-entscheidung: nur 5 von 37 (#163, #168, #184,
     #191, #192) - und DREI davon sind EXPERIMENTE (Autorotation des ffmpeg-Binaries, kennt es qtrle,
     FAT32-Erkennung), keine Entscheidungen.
     ZUSCHNITT WAR 36 - der PRÜFLAUF hat M6-37 (#192) ERZWUNGEN: sofortFlush (#47) verlangt ein
     Project, das kein einziges Issue in sechs Meilensteinen main-intern herausgibt. Damit war der
     seit TK v2.8 verlangte Sofort-Flush weder in #68 noch in M6-33 baubar. Dieselbe Lückenklasse
     zum VIERTEN Mal (nach #72-#77, #71, #153).
     DIE VIER SCHWERSTEN BEFUNDE: (1) -ss an der falschen Stelle (M6-12/#167) - es stand im
     VERBINDLICHEN Argument-Array zwischen zwei -i und wurde damit zur Eingangs-Option des FALSCHEN
     Eingangs. Der Ausschnitt haette immer bei Frame 0 begonnen: richtige Laenge, falscher Inhalt -
     und die eigene DoD-Pruefung waere gruen durchgelaufen. Das Issue beschreibt diese Falle in
     seiner EIGENEN Einleitung und tappt dann hinein. (2) -progress wurde NIRGENDS gesetzt: die ganze
     Fortschrittskette #160 -> #177 -> #178 -> #191 waere gebaut und TOT gewesen, und -loglevel error
     unterdrueckt zusaetzlich die voreingestellte Ausgabe. Zwei Pruefer meldeten es unabhaengig;
     jetzt im festen Vorspann von M6-03 (#158), an genau EINER Stelle. (3) Zwei Funktionen gleichen
     Namens im selben Ordner (segmentDateiname in #175 und #177, gleiche Signatur, verschiedenes
     Ergebnis) - ein falscher Import kompiliert fehlerfrei und setzt ffmpeg auf Dateien, die es nicht
     gibt. (4) Die Toleranz der Dauerpruefung war rechnerisch falsch (M6-25/#180): max(0.5, 1 % der
     Dauer) haette bei einem 30-Minuten-Reel ein vollstaendig fehlendes Segment durchgewinkt - genau
     der Fall, gegen den die Pruefung existiert. Jetzt fest 0,5 s.
     MUSTER zum VIERTEN Mal bestaetigt: ALLE kritischen Befunde sitzen an den NAEHTEN zwischen
     Issues, keiner innerhalb eines Issues. Regel D hielt ueber rund 300 geprüfte Zitate praktisch
     fehlerfrei, Regel C ohne Verstoss in 37 Dateien, Regel E 37/37. NEU bei M6: die schwersten
     Befunde waren RECHNERISCH/POSITIONELL (Argument-Reihenfolge, Toleranzformel, Geradzahligkeit),
     nicht vertraglich - ein Pruefer, der nur Signaturen abgleicht, findet sie NICHT.
   - TK v2.8 (04.08., beim M6-Zuschnitt gefunden, vom User entschieden) - NEUN Entscheidungen:
     E-3 (WICHTIGSTE) Die fertige Ausgabedatei wird als <name>.mp4.part im PROJEKT-Ausgabeordner
     gestaget, nicht in <Temp>. Umbenennen ist nur auf DERSELBEN Partition unteilbar; die App ist
     portabel, <Temp> liegt auf C:, der Datenort kann auf dem Stick liegen. Sonst waere rename ein
     EXDEV-Fehler, der Ausweg "kopieren und loeschen" hebt Akzeptanzkriterium 9 auf - und der Fehler
     faellt in KEINEM Test auf, weil beim Entwickeln Temp und Daten auf derselben Platte liegen.
     E-5 art und höhe der Band-Vorlage wandern in den RenderRequest (der Auftrag wird beim Einreihen
     eingefroren, TK 9.3.5; sonst passen die bereits gezeichneten Band-PNGs nicht mehr zur spaeter
     nachgeschlagenen Hoehe). E-1 historieEintrag ersatzlos gestrichen - ein Feld, das ueber fuenf
     Meilensteine niemand brauchte, ist keins; Q3 ist dauerhaft, ein doppelt gefuehrtes Datum darin
     bliebe fuer immer falsch. E-4 Der Sofort-Flush laeuft als ERSTER SCHRITT IM HANDLER. Beim
     Nachziehen kam heraus, dass die vom TK genannte Stelle (der Torwaechter) kein await enthalten
     darf - niemand haette ihn gebaut: #59 darf nicht, #68 verbot ihn sich selbst. E-6 "verifiziert"
     = einmal ffprobe auf die fertige Datei gegen das Ausgabe-Profil, VOR dem Ersetzen - die einzige
     Stelle, an der ein stiller Encoder-Fehler noch auffaellt. E-9 render:fortschritt als Ereignis
     (Nutzlast und Empfaenger existierten, es fehlte allein der Sender). E-2 ausgabe.gesamtdauer wird
     number|null (der Export kennt keine Spieldauer, sein Zielpfad steht in pfad). E-7 Der Export
     loest seine Quelldatei ueber loeseAusgabePfad (#49) auf, KEIN eigenes join. E-8 Restflaechen der
     Split-Komposition = Farb-Rolle flaecheDunkel (#2F2E2E), ueber leseMarke() (#29), nie als Hexzahl
     in einer Filterkette.
   - TK v2.9 (04.08., beim M6-Prüflauf gefunden, vom User entschieden): (1) speicher_fehler als
     SIEBTER Fehlercode in 9.6.4 - der Flush-Fehlschlag im Export-Handler hatte keinen Code
     (schreib_fehler meint das Kopieren, die uebrigen fuenf das Ziel, der Flush aber den Datenort).
     (2) BANDHOEHEN MUESSEN GERADE SEIN - yuv420p verlangt gerade Hoehen und Versaetze; bei ungerader
     Hoehe brechen BEIDE Kompositionsarten (split: 1080-H ungerade; einblendung: Overlay auf
     ungerader Zeile). Durchgesetzt an der Quelle (Editor sperrt, Store weist ab), Render prueft
     zusaetzlich. (3) Die SPLIT-VIDEOBREITE WIRD AUF EIN VIELFACHES VON 4 ABGERUNDET - die gerade
     Bandhoehe allein rettet die Geometrie nicht, denn (1080-H)x16/9 ist nur ganzzahlig, wenn 1080-H
     durch 18 teilbar ist, und der zentrierte x-Versatz ist nur bei einem Vielfachen von 4 gerade.
     Die eingebaute Vorlage (H=162) geht als EINZIGE zufaellig auf und haette den Mangel verdeckt.
     Aufrunden ist verboten (braeche "contain ohne Beschnitt"). .md und .docx synchron (geprüft),
     Anforderungsdokument unveraendert v1.2.
     RUECKWAERTS NACHGEZOGEN (eine Vertragsaenderung erzwingt den Zitat-Abgleich ueber ALLE
     angelegten Issues): #3 (sieben -> ZEHN Anmeldungen plus raeumeVerwaisteArbeitsbereiche() als
     Startschritt, und verdrahteExportUndFortschrittIPC muss NACH dem Fenster stehen, weil es als
     einzige Verdrahtung ein BrowserWindow braucht), #47 (trug noch "gerufen wird sie vom
     Torwaechter"), #17, #19, #53, #62, #68, #70, #134, #72/#73/#74/#87, sowie #95/#96/#100/#102/#155
     und #103/#117/#148 (Bandhoehe).
   - M7 FERTIG (05.08.): 69 Issues #194-#262 (Milestone "M7 - Oberflaeche & Komfort").
     Volltexte in docs/agents/m7/, Mapping in docs/agents/m7/map.json. ACHTUNG BEI DEN NUMMERN:
     M7-XX -> #(XX+193) gilt NUR BIS M7-59 (#252). Danach nicht mehr, weil zwei Issues nachtraeglich
     GETEILT wurden: M7-60 -> #259, M7-61..M7-64 + M7-66/M7-67 -> #253-#258, M7-65 -> #260,
     M7-68 -> #261, M7-69 -> #262. IMMER aus map.json abschreiben, NIE rechnen. (#193 gehoert zu
     M0, nicht zu M7 - ein spaeter nachgetragenes Grundgeruest-Issue.) Fuenf neue Labels:
     modul:app-shell, modul:queue-panel, modul:preview-player, modul:projekt-verwaltung,
     modul:renderer-gemeinsam. 2756 Querverweise aufgeloest - mit Abstand der groesste Meilenstein.
     braucht-entscheidung: 38 von 69 (hoechster Anteil aller Meilensteine; passt zur Sache, weil das
     TK auf der Oberflaechen-Ebene am wenigsten vorgibt).
     DIE SIEBEN SCHWERSTEN BEFUNDE - vier davon sind dieselbe Sache: fertig gebaut, fuer den Nutzer
     nicht erreichbar. (1) ES GAB KEINEN WEG, EIN PROJEKT ANZULEGEN. erstelleProjekt, listeProjekte,
     dupliziereProjekt, loescheProjekt sind SEIT M1 GEBAUT - kein Issue rief sie auf. Die Anwendung
     waere beim ersten Start unbenutzbar gewesen. (2) ES GAB KEINEN WEG, EIN VIDEO ZU IMPORTIEREN
     (FA-01, ein MUSS): Der Import wurde genau zweimal gerufen, beide Male fuer das BILD einer
     Aktion. (3) M5 hat die gesamte Bedienlogik als reine .ts-Dateien gebaut - konsequent nach
     Regel E und in jedem Issue richtig -, aber NIEMAND ZEICHNETE Wiedergabeliste, Aktions-Editor
     oder Vorlagen-Editor. FA-05 und Akzeptanzkriterium 1 waren nicht erfuellbar. (4) Die
     BANDBEARBEITUNG (FA-20, die HAUPTBETRIEBSART) hatte keine Oberflaeche. (5) UNDO WAR GEBAUT UND
     WIRKUNGSLOS: TK 9.13.2 verlangt einen Schnappschuss vor jeder Instant-Operation, aber alle
     Instant-Operationen liegen in Modulen, die Undo ausdruecklich ausschliessen. Geloest ueber eine
     HUELLE um die gemeinsame Projekt-Sicht (M7-50 = #243) - der Schnappschuss entsteht an EINER
     Stelle, die jede Aenderung passiert, statt in dreissig aufrufenden Modulen. (6) DER
     RENDERER-BOOTSTRAP FEHLTE: sieben Einstiegspunkte ohne Aufrufer (Auftrags-Auswerter, Sitzung,
     gemeinsame Sichten, Reiterbelegung, Speicherhinweis, Warteschlangen-Leiste) -> M7-65 (#260) und
     M7-69 (#262). SECHSTE WIEDERHOLUNG derselben Lueckenklasse nach #72-#77, #71, #153, #192, #255.
     Nicht mit dem Main-Bootstrap #3 verwechseln - der verdrahtet den Main. (7) ZWEI medienUrl-
     Fassungen mit ENTGEGENGESETZTER ABNAHME (eine verlangt Prozent-Kodierung, die andere prueft
     "ohne Kodierungsumbau"). Heute unauffaellig, WEIL DIE DATEINAMEN UUIDs SIND - ein Zufall der
     Belegung, kein Vertrag. Zusammengefuehrt in M7-67 (#258): die media-Adresse wird an genau
     einer Stelle gebildet.
     NEUE FEHLERKLASSE, M7 eigen: UEBERHOLTE TATSACHENBEHAUPTUNGEN. M7 ist so gross, dass frueh
     geschriebene Dateien nicht wissen, was spaete liefern; weil Regel B von jedem Issue verlangt,
     seine Luecken zu melden, standen rund FUENFZEHN Melde-Auftraege in den Texten, die INS LEERE
     zielten - der Baustein war laengst durch ein spaeteres Issue gedeckt. Warum das gefaehrlich
     ist: Ein Agent, der "Braucht einen Baustein, den kein Issue liefert" liest, BAUT NICHT. Er
     meldet und wartet. Eine ueberholte Behauptung blockiert also GENAUSO wie eine echte Luecke,
     nur unsichtbar. NEUE REGEL: Wer ein Issue anlegt, das die Luecke eines frueheren schliesst,
     STREICHT DORT DIE MELDE-AUFFORDERUNG und setzt den Verweis auf das neue Issue an ihre Stelle.
     Das ist die Vorwaerts-Entsprechung zur Rueckwaerts-Regel (Vertragsaenderung erzwingt
     Zitat-Abgleich ueber alle angelegten Issues).
     WERKZEUG-HAERTUNG: create-issues.py ueberspringt jetzt Eintraege, die schon in map.json stehen.
     ANLASS: GitHub lehnt Bodies ueber 65 536 Zeichen ab. M7-60 und M7-65 lagen bei rund 77 000 und
     scheiterten, waehrend 65 andere im selben Lauf durchliefen - ohne die Haertung haette ein
     zweiter Lauf 65 DUPLIKATE angelegt. Beide wurden GETEILT statt gekuerzt: ein Kuerzungsversuch
     hat nachgerechnet, dass M7-65 selbst mit KOMPLETT LEEREM Signaturblock noch bei 61 561 Zeichen
     laege. Geteilt wurde nach dem Anlegen von M7-61..M7-67, daher die Sprungnummern.
     MUSTER zum FUENFTEN Mal bestaetigt: alle kritischen Befunde sitzen an den NAEHTEN - in M7 an
     der groessten ueberhaupt, der zwischen LOGIK (M1-M6) und BEDIENUNG. Die Lueckenklasse "fertige
     Funktion ohne Aufrufer" ist inzwischen in JEDEM Meilenstein seit M1 aufgetreten und wurde JEDES
     MAL erst im Prueflauf gefunden; die billigere Vorsorge steht seit #255 im Vermerk: ein
     Zuschnitt-Schritt "fuer jede Operation - WER RUFT SIE?".
   - NACHGEZOGEN nach M7 (05.08.): #3 (Main-Bootstrap) traegt jetzt DREIZEHN Anmeldungen statt
     zwoelf - neu ist verdrahteVorlagenNachtragIPC() (#255, Vorlagen-Nutzungsanzeige) als ACHTE der
     nunmehr ZEHN Anmeldungen OHNE Fenster, unmittelbar nach verdrahteVorlagenIPC() (#109);
     meldeRenderHandlerAn/meldeExportHandlerAn ruecken auf 9 und 10. Die drei Anmeldungen MIT
     Fenster bleiben unveraendert. Ausserdem die Platzhalter-Kennungen auf echte Nummern gezogen:
     M7-45 -> #238 (verdrahteSpeicherstatusIPC), M7-47 -> #240 (verdrahteProjectStoreNachtrag2IPC).
     Zaehlung an allen 9 Stellen im Text angepasst.
   - ALLE MEILENSTEINE M0-M7 SIND ANGELEGT. Die Issue-Ueberfuehrung ist abgeschlossen.
     [NACHTRAG 10.08.2026: M8 (Marken) ist mit 56 Issues dazugekommen, #275-#330.]
4. LÄUFT: BAU. Seit 04.08. wird gebaut, Branch bau/m0-01-grundgeruest (von der Planungsbranch-Spitze
   abgezweigt, weil main 21 Commits zurücklag und weder .gitignore noch CLAUDE.md noch die aktuellen
   Dokumente hatte). Nicht nach main gemergt.
   - #1 FERTIG: vier tsconfigs, 19 Modulordner mit Platzhalter-index.ts. Die Prozess-Trennung ist
     NACHGEWIESEN, nicht behauptet: fs/path/child_process in src/renderer/ -> TS2307, dieselben in
     src/main/ -> laufen durch (Gegenprobe), document in src/main/ -> TS2584, fs in src/shared/ ->
     scheitert im Renderer-Check. Tragender Schalter ist "types": [] in tsconfig.renderer.json -
     ohne ihn zieht tsc JEDES @types-Paket ein, auch @types/node, und TK 2 wäre nur Konvention.
   - #2 FERTIG: Vite (Renderer) + esbuild (Main UND Preload) + eigenes Dev-Skript. Zwei Lücken beim
     Bauen gefunden und im Issue nachgezogen: den Preload baute NIEMAND (#4 schreibt den Code, #3
     verweist auf den Pfad), und der Renderer hatte keinen Einstiegspunkt (#10 nennt nur App.tsx und
     shell/). Beide STOPP-Punkte entschieden. Merke zu ffmpeg-static: external in der esbuild-Config
     JA (beim Abnehmen mit echtem Import belegt: require bleibt stehen, Bundle 1,7 KB statt ~80 MB),
     in vite.config.ts NEIN. ACHTUNG - hier stand, dort bringe ein Renderer-Import den Build zum
     Scheitern. NACHGEMESSEN BEIM ABNEHMEN VON #2: stimmt NICHT. Vite stubbt die benutzten
     Node-Bausteine und WARNT nur, Exitcode 0; und der Renderer-Typecheck greift auch nicht, weil
     "types": [] nur ambiente @types-Pakete sperrt - ffmpeg-static bringt eigene Typen mit. Es gibt
     fuer diesen Fall DERZEIT KEINE Schranke; sie gehoert als Lint-Regel nach #193. Bis dahin haengt
     TK 2 ("Nur der Main-Prozess beruehrt ffmpeg und Dateisystem") an der Aufmerksamkeit des
     Schreibenden. Lehre daraus: Eine Schutzzusage, die nur im Kommentar steht, ist keine - beim
     Abnehmen wird sie geprobt, nicht gelesen. Volltext: docs/agents/m0/M0-02-build.md.
   - MUSTER, das sich beim Bauen wiederholt: Die Fehler sitzen an denselben NÄHTEN wie in den
     Prüfläufen - ein Artefakt, das jemand voraussetzt, aber niemand erzeugt. Erst der IPC-Kanal ohne
     Anmelder (M1/M2/M5), jetzt der Preload ohne Erbauer und der Einstiegspunkt ohne Besitzer.
     Beim Bauen JEDES Issues prüfen: Gibt es zu jedem vorausgesetzten Artefakt einen Erzeuger?
   - OFFEN aus #2: Vite warnt zu `"type": "module"`. Beide naheliegenden Auflösungen greifen den
     Bestand an (vite.config.mts widerspricht der Signatur; "type": "module" erklärt
     dist/main/index.js zu ESM und bricht den Electron-Main). Heute nur eine Warnung.
   - UMGEBUNG: Platte war am 04.08. mit 0 MB voll; der scheinbare Netzfehler
     "ENOTFOUND github.com" bei ffmpeg-static war NUR eine Folge davon. Bei seltsamen
     npm-Fehlern zuerst `df -h /c` prüfen. Electron ~215 MB + ffmpeg-static ~83 MB.
   BASIS: docs/agents/issue-generation-prompt.md ist die selbsttragende Übergabe-Prompt dafür
   (Modulschnitt, alle Invarianten zum Wörtlich-Zitieren, Pflicht-Issue-Vorlage + ausgefülltes Beispiel,
   Meilensteine M0-M7 inkl. Grundgerüst-Issues S1-S12, Labels, Dry-Run-vor-Freigabe-Ablauf).
   ERLEDIGT (04.08.): noUncheckedIndexedAccess ist in tsconfig.base.json AN. Der Schalter ist nur
   die halbe Miete - die Fluchttür `elemente[i]!` hebt ihn auf und lässt den Code zugleich geprüft
   aussehen. M0 enthielt KEIN Linting-Issue, das Verbot @typescript-eslint/no-non-null-assertion
   hatte also keinen Ort -> neues M0-Issue #193, Quelle docs/agents/m0/M0-13-eslint.md.
   MERKE zur Nummerierung: ein neues Issue verschiebt NICHTS - GitHub zählt fortlaufend über das
   ganze Repo. Ein M0-Nachzügler bekommt die nächste freie Nummer (hier #193, weil M6 schon auf
   #156-#192 lag), nicht eine Nummer innerhalb von M0.
   HINWEIS package-lock.json: bleibt im Repo (04.08. entschieden). Grund: ffmpeg-static liefert eine
   BINÄRDATEI mit, electron bringt Chromium mit (davon hängt der Canvas-Determinismus aus TK 9.10 ab)
   und electron-builder baut die EXE - driften diese Versionen still, ändert sich das fertige Video,
   ohne dass die App einen Fehler zeigt. Die Konflikt-Schmerzen sind stattdessen über .gitattributes
   entschärft (`package-lock.json binary` -> keine Konflikt-Marker in der Datei). Bei einem Konflikt
   NIE von Hand mergen, sondern regenerieren:
   `git checkout --ours package-lock.json && npm install && git add package-lock.json`
   HINWEIS Doku-Workflow: .docx NIE schreiben, während Word offen ist (Vorfall 03.07.: Schreiben-während-offen
   + harter Neustart hat Datei beschädigt). Generieren - Staging - validieren - nur bei freier Datei platzieren,
   sonst stoppen und User bitten. Keine Retry-Kopier-Schleifen.
