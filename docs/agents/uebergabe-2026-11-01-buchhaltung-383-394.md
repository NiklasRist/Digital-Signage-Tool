# Übergabe 01.11.2026 – Buchhaltung #383/#388/#393/#394 und die Lösch-Sperrgründe

**Sitzung 36.** Gearbeitet wurde am 01.11.2026. Vorher:
[`uebergabe-2026-10-31-bedienfluss-446-392-457.md`](uebergabe-2026-10-31-bedienfluss-446-392-457.md).

---

## 1. Stand heute

| | Wert |
|---|---|
| Commits | **10** vor `origin/main` (`9bba122`, `a94ec2e`, `72dea60`, `f13bc02`, `57c98e2`, `2f53521`, `103811a`, `bb7deb0`, `dfd9e48`, `25a0cba`); **nicht gepusht** |
| Arbeitsbaum | sauber |
| Gate | `npm run pruefung` **Exit 0** |
| Unit | **5.363** Tests in **352** Dateien |
| Integration | **50** in **13** Dateien |
| Treiber | **0 Befunde** |
| Lint | **0 Fehler**, **65 Warnungen** |
| Offene Issues | **0** — alle geschlossen |

**Geschlossen in dieser Sitzung:** #383, #388, #394 (je `completed`, Abweichungen benannt) und
**#393** (erst geprüft, dann auf Anweisung nachgebessert und geschlossen).

---

## 2. Die Buchhaltung – was die Prüfung ergab

Der Auftrag war „DoD gegen den Code prüfen, mit Beleg schließen — oder nachbessern". Ergebnis:
**drei echte Lücken**, ein Issue war vollständig.

### #383 (preview-player) – geschlossen

- **Gebaut:** Anzeige, Achse, Auswahl, `media://` — alles vorhanden.
- **Lücke:** „aktualisiert sich bei Änderungen" war in **keinem** Test belegt. Neu:
  `vorschau-anzeige.spec.ts` → „#383: ein GEAENDERTES Projekt zeigt sofort das neue Element".
- **Abweichungen (benannt):** Der Signaturblock nennt `zeigeVorschau(liste, projekt)` in
  `preview-player/index.ts` — gebaut ist `Vorschau({projekt, voraussetzungen, sichtbar})` in
  `vorschau.tsx`, die Datei `index.ts` gibt es nicht. Und „keine Datei außerhalb
  `preview-player/`" ist unerfüllbar (Montage in `App.tsx`, `composer/kaputt-erkennung`,
  `gemeinsam/abspielposition` seit #457).

### #388 (composer) – geschlossen, ein Punkt nachgebessert

- **Befund:** `fehler-markierung.tsx` (die Datei des Issues) hat **keinen Importeur** — ein
  Gerüst aus `110b9a6`. Die Markierung ist in `liste-ansicht.tsx` / `element-zeile.tsx` gebaut
  (Sicht, kein Rechner — #242/#248).
- **Lücke, gebaut:** „Warnungen sind gelb" fehlte. Die 30-Minuten-Warnung trug dasselbe **Rot**
  (`#e5634d`) wie eine kaputte Zeile, obwohl sie laut TK 9.7.4 nichts blockiert. Jetzt
  `WARNFARBE = '#d9a441'` (`liste-ansicht.tsx`), derselbe Ton wie im Statistik-Panel.
- **Datei gelöscht (Anweisung Niklas, 01.11.2026):** `fehler-markierung.tsx`, `a94ec2e`.

### #394 (composer) – geschlossen, keine Änderung

Vollständig: `statistik.tsx` gebaut, in `composer/index.tsx` (`<Statistik>`, heute Zeile 833) montiert (`2a2f551`), Unit-Test
und **Treiber 4o** am Fenster (Gesamtdauer in `m:ss`, Zähler gegen `project.json`).
**Lesart, benannt:** „Verhältnis Video/Segment" = die beiden Zähler nebeneinander, kein eigenes
„3 : 1"-Feld. **Kleine Feststellung:** `zustand: 'keinProjekt'` ist in `baueStatistik` unerreichbar.

### #393 (vorlagen-editor) – erst offen gelassen, dann gebaut

Die Prüfung ergab: Die Vorschau zeichnete **immer** `BEISPIEL_AKTION`, und der Editor hatte
**keinen Projektzugang**. Genau das steht im Issue unter „Nicht selbst entscheiden". Entscheidung
des Auftraggebers am 01.11.2026: **Variante b** (Aktionen-Auswahl bauen).

---

## 3. #393 – was gebaut wurde (`72dea60`)

- **`VorlagenEditorWurzelProps.projekt`** in **beiden Kopien** (`vorlagen-editor/index.tsx` **und**
  `app-shell/inhalte.tsx`), montiert mit `zugaenge.projektRoh`. **Ablösung, offen benannt:**
  die frühere Regel „KEIN Projektzugang" (ENTSCHIEDEN 6) gilt für diesen Reiter nicht mehr.
- **Auswahlfeld „Vorschau mit Aktion"** (`data-testid="vorschau-aktion-wahl"`): Liste aus
  `projekt.aktionen`; ohne Aktion im Projekt steht die Beispiel-Aktion und das Feld sagt es.
- **Zwei bisher ungenutzte Funktionen bekamen ihren Aufrufer:** `waehleVorschauAktion`
  (gewählt → erste → Beispiel) und `bereiteVorschauVor` (Motive der gewählten Aktion — ohne sie
  zeigte eine Aktion mit Bild eine leere Bildzone).
- **Projekt-Abo** (`aufGeaendert`) hält die Liste aktuell, wenn in einem anderen Reiter eine
  Aktion entsteht.

### Der dabei gefundene Fehler

Der Vorbereitungs-Effekt hing **allein an `arbeitsId`**. Die Wahl einer anderen **Marke** setzte
`vorbereitet` auf `false` — und nichts stellte es wieder her: **die Vorschau blieb für immer
leer.** Nur am Fenster sichtbar, in keinem Test. Jetzt hängt der Effekt am Stand (Marke, Aktion,
Projekt); eigener Test.

### Wächter nachgezogen

- `inhalte-reiter.spec.ts` prüfte bisher „vorlagenEditor bekommt **kein** Feld `projekt`". Jetzt:
  `projektRoh`, **nie** `projektBearbeitung` (Lesen zeichnet keinen Undo-Schnappschuss auf).
- `naht-typen-313.spec.ts` verlangt `projekt` als **Pflichtfeld** des Editors.

---

## 4. Lösch-Sperrgründe (`f13bc02`)

Offener Punkt aus den Übergaben 30./31.10.: Der Block mit den drei Namenslisten stand **zwischen
[Groß] und dem Papierkorb** und machte aus der einzeiligen Kopfzeile einen mehrzeiligen Kasten.

- `loeschKnopf` — Einstieg/Bestätigung samt Fehlerzeile, **bleibt im Kopf**.
- `loeschSperrgründe` — eigene Fläche **unter** der Kopfzeile, mit Rahmen.
- Gezeigt wie der Kopf: nur im Normalmodus, nicht in [Groß].
- Neuer Test prüft die **Lage**: Block **nicht** in `marken-kopfzeile`, Knopf **im** Kopf.

---

## 5. Gegenproben dieser Sitzung (alle rot, byte-identisch zurückgenommen)

| Gegenprobe | Wirkung |
|---|---|
| `WARNFARBE` zurück auf `KAPUTTFARBE` | 1 Test rot |
| Achsen-`useMemo` ohne `props.projekt` | 1 Test rot |
| `vorlage` aus den Effekt-Abhängigkeiten | 1 Test rot |
| Effekt-Deps zurück auf `[arbeitsId]` | 2 Tests rot |
| `aktion={BEISPIEL_AKTION}` | 2 Tests rot |
| `abmeldeProjekt` entfernt | 1 Test rot |
| `projektBearbeitung` statt `projektRoh` | 1 Test rot |
| Sperrgründe-Block zurück in den Kopf | 1 Test rot |

Prüfsummen der zurückgenommenen Dateien: `vorschau.tsx ee5229f9…`, `liste-ansicht.tsx ddcb30d1…`,
`vorlagen-editor/index.tsx 54429474…`, `marken-editor/index.tsx b9038d13…`.

---

## 6. Fallen für die nächste Sitzung

1. **Zwei Kopien von `VorlagenEditorWurzelProps`** (`app-shell/inhalte.tsx` und
   `vorlagen-editor/index.tsx`, laut Kommentar „zeichengleich"). Wer ein Feld ergänzt, muss
   **beide** anfassen — sonst bricht `tsc` an der Montage, und der Fehler sieht nach etwas
   anderem aus.
2. **Attrappen müssen sich wie der Speicher verhalten.** Ein frisches Objekt je `hole()`- oder
   `holeBereiteMarke()`-Aufruf setzte den Zeichen-Effekt in eine **Endlosschleife** (gemessen,
   sechs rote Tests). Der echte Zugang liefert den **gespeicherten** Stand.
3. **Ein Effekt, der nur an `arbeitsId` hängt, kann auf keine Auswahl reagieren.** Die
   Marken-Wahl war deshalb tot (#393). Wer künftig einen beweglichen Eingang einbaut: in die
   Abhängigkeiten.
4. **Lesen heißt `projektRoh`.** `projektBearbeitung` zeichnet Undo-Schnappschüsse auf und ist
   ausschließlich für `composer` und `action-editor`.
5. **„Keine Datei außerhalb X" ist in diesem Projekt fast nie erfüllbar** — Montage braucht den
   Aufrufer. In allen vier Abschlusskommentaren steht die Abweichung ausdrücklich.

---

## 7. Offene Punkte ohne Bau

- **#374/#375 — am 01.11.2026 neu geschnitten und `not planned` geschlossen.** Begründung steht
  in den Abschlusskommentaren: **#374** (Aktionen-Overlay über Hauptmenü) setzt ein Hauptmenü und
  vier Dateien voraus, die es nicht gibt; der **Reiter „Aktionen"** erfüllt das Ziel (Bibliothek,
  Editor, Live-Vorschau). Übrig bleibt die **Navigationsfrage** (Editor als Overlay wie der
  Marken-Editor seit #456) — dafür wäre ein neues Issue nötig. **#375** (Bibliothek auf Vollbild,
  Badges) hat keine Voraussetzung mehr: `Aktion` kennt kein `art`, es gibt keine Badges und keine
  Banner-Aktionen (M9/TK v3.33).
- **Beenden-Frist 15 s** ist weiterhin unbestätigt (Zahl vom Auftraggeber nicht bestätigt).
- **#456-Signaturblock** nennt `projektId`, gebaut ist zusätzlich `aktionen`.
- **71 Dependabot-Lücken** (33 high) — nicht angefasst.
- **Layout-Frage Welle 1:** Plan sagt „Video mittig", gebaut ist „Bühne oben".
- **Nicht am Fenster gemessen:** die Aktionen-Auswahl im Vorlagen-Editor (FA-13/4n misst
  Anlegen/Speichern/Verwerfen) und die Sperrgründe-Lage (nur jsdom).

---

## 8. Nachzügler derselben Sitzung: Projekteditor entrümpelt (`103811a`)

**Entscheidung Niklas (01.11.2026): „Aktionen in die Mitte, Galerie raus."** Richtung aus der
Notiz vom 21.10. (`ui-ausrichtung-projekteditor-2026-10-21.md`): Die Medien-Galerie stand vorne,
die tägliche Arbeit daneben klein.

- Der **linke Bibliothek-Dock** (300 px) ist entfallen; die **Aktionen-Bibliothek** steht in der
  **Mitte** (Video-Zeile + Aktionen + Anlegen).
- Die **Medien-Galerie** ist als Fläche aus „Zusammenstellen" entfernt. Bilder gehören zum
  Aktions-Editor, das eine Projektvideo zu seinem schmalen Import-Weg (FA-01, unverändert).
- Die **Datei-Drop-Zone** (#335) bleibt — sie hängt jetzt an der Bibliothek.
- **Liste und Bibliothek schließen sich aus** (Umschalter): Bei 800 × 572 sind zwei Blöcke unter
  der Bühne nicht unterzubringen (Lehre aus #456).
- **Treiber nachgezogen:** 4b misst die Video-Zeile statt `galerie-eintrag`, 4b3 die Auswahl am
  `medium`, 4k die Zeilenzahl; die Montage-Prüfung bleibt als BLOCKER an der Bibliothek.
- **Die drei toten Dateien sind gelöscht:** `galerie-bereich.tsx`, `asset-galerie.tsx`,
  `bibliothek-dock.tsx` — samt sechs Test-Mocks und den zwei Galerie-Fällen in
  `drag-quellen.spec.ts`.
- **Der Aktions-Editor geht aus dem Projekteditor auf** (offene Frage der Notiz vom 21.10.):
  Jede Aktions-Zeile trägt **„Bearbeiten"**; der Klick öffnet denselben `ActionEditorWurzel`
  als **Ansicht über der Reiterfläche**. Die Reiter bleiben montiert und nur verdeckt
  (TK 9.14.2); „Zurück zum Projekt" oder ein Reiterklick schließt sie. Der Editor bekommt den
  **umhüllten** Zugang (`projektBearbeitung`), damit Bearbeiten ein Undo-Schritt bleibt.
  NEU `gemeinsam/aktionen-ansicht.ts` (kleiner Speicher wie `reiter.ts`). **Treiber `4g6`**
  misst es am Fenster; **Matrix FA-03** ist nachgezogen.
- **Messfehler, den der Treiber aufdeckte:** Der erste Lauf meldete „Zurück schließt nicht".
  Die Sonde `rahmen-inhalt-aktionen` traf aber den **Testid des Aktionen-Reiters**, nicht die
  Ansicht. Sie heißt jetzt `rahmen-ansicht-aktionen`; beim Marken-Editor fiel die Kollision
  nicht auf, weil es keinen Reiter `marken` mehr gibt. Der falsche Fund steht noch im
  Protokoll (`oberflaeche-durchlauf.md`, Nachlauf 14:18) — als Geschichte, nicht als Befund.

## 9. Nächster Schritt

**Es ist kein Issue mehr offen.** Die nächste Arbeit ist eine **Entscheidung**, kein Bau:

1. **Bild-Import-Form** (letzte offene Frage der Notiz vom 21.10.): Feld im Aktions-Editor,
   kleiner Dialog oder Datei-Drop? Der Weg selbst ist gebaut (`aktion-bild-import`).
2. **Layout-Frage Welle 1:** Plan sagt „Video mittig", gebaut ist „Bühne oben". Entscheiden.
3. **Alle Editoren und die UI weiter überarbeiten** — Ansage Niklas, 01.11.2026: der Umbau ist
   damit begonnen, nicht abgeschlossen.
4. **Zwei unbestätigte Zahlen:** Beenden-Frist 15 s und der #456-Signaturblock.

**Sicherheit (71 Dependabot-Lücken) ist nachrangig, solange der MVP nicht steht** — Ansage
Niklas, 01.11.2026.

## 10. Nachtrag derselben Sitzung: der Dauer-Regler ist am Fenster nicht erreichbar

Ausgangspunkt war der Befund, der seit dem 31.10. in **jedem** Treiberlauf steht:
`Untersuchung Dauer/Trim-Undo … Dauer unveraendert ("2,0 s")`. Drei Messungen, drei Ergebnisse:

1. **Die Kreuzung war ein echter Fehler (behoben).** `ziehe` (`element-zeile.ts`) klemmte jedes
   Ende einzeln in `[untergrenze, obergrenze]`; `begrenze` kennt den anderen Griff nicht. Der
   Endgriff konnte den Anfangsgriff überholen — die Anzeige zeigte dann **`-1,0 s`** (belegt mit
   jsdom-Probe: `waehrendZug=-1,0 s`, `uebernehme={anfang:2.5, ende:1.535}`, abgelehnt
   `ungueltige_eingabe`). Jetzt hält der **bewegte** Griff am anderen an; Gleichstand bleibt
   erlaubt (die Mindestdistanz ist weiter offener Punkt der Store-Operationen). Der bisherige
   Test „gekreuztes Paar: ziehe klemmt exakt wie begrenze" kreuzte in Wahrheit **nicht** — er
   ist ersetzt.
2. **Der Regler selbst ist in Ordnung.** Probe mit echtem Store, echtem Sicht-Schreiber und
   ersetztem IPC: `10,0 → 12,8 s (Zug) → 12,8 s (Antwort)`, `project.json` `trimEnde 15.35`.
   Der Rücksprung aus der ersten Probe wird vom Effekt eingefangen, sobald die Sicht das neue
   Element liefert.
3. **Die Ursache am Fenster ist das Layout.** Sonde in `scripts/durchlauf.mjs` (Schritt 4f4):
   ```
   elementsFromPoint(525,263) -> ["statistik","DIV","composer-wurzel"]
   wiedergabeliste      y=222 h=112
     └ Eltern-DIV       y=316 h=18   <- der Scrollkasten der Liste
   ```
   Die Wiedergabeliste steckt bei **800 × 572** in einem **18 px hohen** Scrollkasten und ist
   nach oben herausgescrollt; die Zeile ist damit nicht treffbar, der Klick landet auf der
   Statistik-Leiste. Der Treiber zieht jetzt zusätzlich nur bis zur Mitte zwischen den Griffen
   (statt pauschal 64 px) und **meldet**, wenn der Zug gar nicht erst beginnt.

**Offen — und das ist die Entscheidung, nicht der Bau:** Bei 800 × 572 verteilen sich die 494 px
der Reiterfläche auf Bühne **38 %** (`BUEHNE_OBEN`, `inhalte.tsx`) ≈ 198 px, den Composer ≈ 296 px
und darin Kopfzeile 32 px + Umschalter ≈ 25 px + **Zeitleiste ≈ 190 px** + Liste **18 px**. Der
Plan (`oberflaeche-2-0-plan.md`, Welle 1, #414) sagt: **Bibliothek links, Video mittig,
Zeitleiste unten** — dann steht die Bühne nicht mehr über dem Composer und die Liste bekommt
volle Höhe. Bis das entschieden ist, bleiben FA-06/FA-14 in `treiber-matrix.md` **blockiert**.

**Gate nach dem Nachtrag:** typecheck 0, lint 0 Fehler / 65 Warnungen, Unit **5.364** (352),
Integration **50** (13), Treiber `exit 0` mit **einem** Befund (der Layout-Blocker oben).

## 11. Gestaltung: die Oberfläche hatte kein CSS

Niklas, 01.11.2026: *„das hauptproblem ist designmaessig sieht das nicht professionell aus"*.
Der harte Befund dahinter: **Der Renderer enthielt keine Zeile CSS** — kein Reset, keine
Typografie, keine Tokens. Jeder Knopf war der Browser-Standardknopf, jede Überschrift die
Browser-Vorgabe (~24 px fett), der Hintergrund weiß, obwohl der Code durchgehend auf dunkel
ausgelegt ist.

**Neu `src/renderer/styles/basis.css`** (in `main.tsx` VOR dem ersten Zeichnen importiert):
Tokens (Flächen, Ränder, Text, Akzent, Fehler, Warnung), Reset, Systemschrift 13 px, ein
Aussehen für Knopf/Eingabe/Auswahl, Fokusring, Bildlaufleisten, `color-scheme: dark`.

Dazu, jeweils am Bild beurteilt (Treiber-Screenshot `/tmp/kai-ui-composer.png`, bei 800 × 572):

- **Statistik** als Zeilen (Bezeichnung links, Wert rechts) statt Fließtext; lange Bezeichnung
  wird mit Ellipse gekürzt.
- **Ein** Import-Weg: der zweite „Video importieren"-Knopf in der Kopfzeile ist weg, der
  Testid `composer-medien-import` liegt am Knopf der Video-Sektion.
- **Ausgaben** zugeklappt eine Zeile (Schalter, neueste Datei, „Exportieren"); die volle Liste
  bleibt **im DOM** und wird nur verdeckt — sonst zählt der Treiber `ausgaben-liste li` falsch
  (am 01.11. gemessen: drei Befunde, danach weg).
- **Bibliothek**: Video-Zeilen einzeilig mit Ellipse, Aktions-Karten mit Rahmen und breitem
  „Zur Liste hinzufügen". Die Umbenennung auf „Einfügen" ist **zurückgenommen** — fünf Tests
  sichern den Weg über genau diesen Text.
- **Zeitleiste**: Blocktext bricht nicht mehr um; die Art-Bezeichnung entfällt unter 56 px
  Breite (vorher stand „video" in vier Zeilen). Block, Rail und Bühne sind gerahmt.
- **Der aktive Reiter** war nicht markiert — die Reiter tragen `aria-selected`, gestylt war nur
  `aria-pressed`. Jetzt sichtbar.

Gemessen bei 800 × 572: Bühne **520 × 288**, Zeitleiste **520 × 124**, `gleichLang true`.
Offen: Die Wiedergabeliste bleibt ausgeblendet (Konzept); von ihr kommen der eine Befund
(Bandliste) und die zwei „Untersuchungen" (Gesamtdauer, Dauer-Zug).

## 12. Blickführung: die Messlatte für alles Weitere

Niklas, 01.11.2026 (nach dem ersten Gestaltungs-Pass): *„es fehlen kontraste … die augen
werden nicht dahin geleitet wo sie hingehen sollen … die tabs oben in der jetzigen form
grausam … du musst einfach überlegen was selbst erklärend ist und ob das Auge richtig
geleitet wird. das ist die methodik nach der man weiter konzipieren muss … konzipieren,
testen wie das ist, konzipieren."*

**Die fünf Kriterien** (gelten ab jetzt für jede Oberflächen-Entscheidung):

1. **Eine Haupthandlung je Fläche** (Akzent), alles andere still.
2. **Drei Kontraststufen** (Fenster / Fläche / erhaben), drei Textstufen.
3. **Handlung → Arbeit → Beiwerk** in der Reihenfolge des Sichtfelds.
4. **Jedes Element sagt, was es ist** — Aktionsname statt Datenart.
5. **Leere Zustände sagen, was zu tun ist.**

**Umgesetzt (`b6c0c5d`):** Flächen- und Textstufen deutlich getrennt; Reiter sind eine
Leiste mit Unterkante statt eines gefüllten blauen Felds; stille Knöpfe und EIN Hauptknopf
(„Rendern…", bzw. „Video importieren" im leeren Projekt); Statistik an den Fuß der Rail;
Abschnittsköpfe mit Trennlinie; Rail-Kopf bleibt beim Scrollen stehen; Zeitleisten-Block
nennt den Aktionsnamen; leerer Zustand nennt den nächsten Schritt. Drei Rücknahmen sind
dokumentiert (klebende Etiketten deckten den Import-Knopf zu; zwei verschachtelte
Scroll-Kästen ließen den Abschnittskopf verschwinden; ein geklemmter Flex-Kasten schob die
Statistik über die Aktionskarte).

**Undo/Redo (`aba05f5`):** SVG-Symbole in 28 × 28-Knöpfen, eigene Gruppe mit Trennlinie,
`aria-label`. `tsc` für Renderer und Tests: exit 0. **Die Unit-Suite konnte in dieser
Sitzung nicht sauber laufen** — der Rechner stand bei Last 13–30 (I/O-Stau, kein Prozess
über 10 % CPU), einzelne Tests liefen in 675–900-Sekunden-Timeouts. Das ist ein
**offener Belegpunkt**, kein grünes Gate.

## 13. Nächste Schritte (vereinbart 01.11.2026)

1. **Rail entlasten.** Das „Neue Aktion"-Formular ist immer offen und frisst ~100 px;
   deshalb scrollt die Rail überhaupt. Es gehört hinter einen „+ Neue Aktion"-Knopf.
   *Achtung:* Der Treiber tippt in `aktion-anlegen-titel` (`seite.click`/`type`) — das
   Formular muss dafür erreichbar bleiben (erst öffnen, dann messen).
2. **Lineal über die volle Breite.** Die Zeitachse ist heute nur so breit wie der Inhalt;
   rechts bleibt eine leere Fläche.
3. **Danach: das Konzept für alles im Seitenpanel** — Liste/Inspector, Bibliothek,
   Auswahl und Bearbeiten eines Elements. Niklas' Vorschlag: ausklappbares Sidepanel nach
   VS-Code-Muster. **Das wird gemeinsam entschieden, nicht allein gebaut.**

## 14. Schritte 1 und 2 gebaut (02.11.2026) — und die Beleglücke ist zu

- **BELEGLÜCKE GESCHLOSSEN (zuerst, vor jedem Bau):** Die Unit-Suite lief sauber —
  **5376/5376, 353 Dateien, 27–36 s, Exit 0**. Der Gestaltungs-Pass (`96b069b`/`aba05f5`)
  steht damit auf belegtem Boden; die 675–900-s-Timeouts der Vorsitzung waren Rechnerlast.
- **SCHRITT 1 — RAIL ENTLASTET (`d379289`):** Das Inline-Formular „Aktion anlegen" (#416)
  stand IMMER offen und war der Grund, aus dem die Rail überhaupt scrollte. Jetzt öffnet
  „+ Neue Aktion" es; „Abbrechen" und ein abgeschickter Entwurf schließen es wieder. Der
  Absende-Knopf ist ein Submit-Knopf (Enter legt an), der Titel wird beim Schließen
  geleert — sonst legte ein zweiter Klick eine Dublette an.
  **Gemessen am Fenster (Treiber 4g):** Rail-Überlauf **0 px** zu, **48 px** offen,
  **67 px** nach dem Anlegen (eine Aktion mehr). Öffner und Anlegen-Knopf werden mit der
  **echten Maus** geklickt, nicht per `evaluate`.
- **SCHRITT 2 — LINEAL VOLL BREIT:** Die Achse trägt eine Grundlinie
  (`zeitleiste-lineal`), absolut auf `left: 0` / `right: 0` gespannt; die **Graduierung
  bleibt beim Inhalt** (Entscheidung Niklas, 02.11.2026 — rechts gibt es keine Zeit, weil
  das Projekt dort endet). Absolut, damit kein Segment um einen Platz rückt.
  **Gemessen am Fenster (Treiber 4f4):** Achse **510 px**, Lineal **510 px**, Inhalt
  **106 px** — vorher lagen 404 px ohne Lineal brach.
- **MESSFEHLER, OFFEN BENANNT:** Der erste Treiberlauf nach Schritt 1 maß `dist/` von VOR
  der Änderung (`npm run durchlauf` ohne `npm run build` fährt den letzten Build). Drei
  Befunde waren Artefakte; der Protokollblock ist als **UNGÜLTIG** markiert, nicht
  gelöscht. Als Probe war er nützlich: genau die zwei neuen Prüfungen sprangen an.
  **Regel daraus: vor jeder Fenstermessung bauen.**
- **Gegenproben:** 6 in dieser Sitzung (3 × Schritt 1, 3 × Schritt 2), jede rot und
  byte-identisch zurückgenommen (Prüfsumme vor/nach gleich).
- **Treiber:** **1 Befund** — der bekannte Bandliste-Fund (Wiedergabeliste ausgeblendet,
  in 16 Läufen des Protokolls schon vorhanden), dazu 2 Untersuchungen und 1 MANUELL wie
  zuvor. **Kein neuer Fund.** Das Gate bleibt deshalb bei Exit 2; es war vorher nicht anders.
- **Nächster Schritt:** das **Seitenpanel-Konzept** (Liste/Inspector, Bibliothek, Auswahl
  und Bearbeiten eines Elements) — **gemeinsam**, nicht allein gebaut.

## 15. Seitenpanel: Ist-Stand, Lücken, Streichliste (02.11.2026)
**Volltext: [`seitenpanel-konzept.md`](seitenpanel-konzept.md).** Konzeptentwurf, **nichts gebaut.**
Die Entscheidung in Abschnitt 5 ist **OFFEN**.

- **Die teuerste Stelle, belegt:** Die Wiedergabeliste steht seit 01.11.2026 auf `display: none`
  (`composer/index.tsx:1084`). Daran hängen `element-bedienung`, `element-regler`,
  `element-griff-*`, `element-band` und `wiedergabeliste-laenge`. **Damit sind 3 der 4 offenen
  Treiber-Einträge Folgen EINER Entscheidung:** der Befund „Bandliste lässt sich nicht öffnen"
  und die zwei Untersuchungen (Gesamtdauer, Dauer-Zug). Der vierte ist der native Export-Dialog
  (MANUELL, unverändert).
- **Fünf Lücken benannt:** (L1) ein Zeitleisten-Element ist nicht bearbeitbar; (L2) s. o.;
  (L3) kein Inspector für die Auswahl; (L4) die Aktionen-Liste steht doppelt (Rail +
  `aktion-bibliothek`, 260 px); (L5) zwei Muster für Editoren (Reiter vs. Ansicht über der
  Reiterfläche).
- **Drei Streichungen vorgeschlagen:** der Umschalter Zeitleiste/Liste, die Bibliothek im
  Aktionen-Editor, der Reiter „Aktionen" (die größte — eigene Entscheidung).
- **Vorschlag:** ein ausklappbares Panel mit drei Abschnitten — Kopf („was ist gewählt?") ·
  Eigenschaften (heute `element-zeile`) · Reihenfolge (heute `wiedergabeliste`). Damit werden
  L1–L3 erreichbar, **ohne Produktlogik zu ändern**: die Flächen existieren und werden nur wieder
  gezeigt und an die Auswahl gebunden.
- **OFFEN, von Niklas zu entscheiden:** (a) **A — das Panel schiebt** (nimmt Breite, Bühne wird
  bei 800 schmal) oder **B — das Panel liegt darüber** (verdeckt Bühne/Zeitleiste, nichts
  schrumpft). Bei 800 × 572 passen 240 + 520 + 300 px nicht in 784. (b) Ist der Inspector an die
  **Auswahl** gekoppelt?






## 16. DIE MESSLATTE FÜR DAS PANEL (Niklas, 02.11.2026) — gilt vor allen Einzelheiten

> „es muss besser sein für produktwerbung als powerpoint und am besten schneller vom aufwand
> her und das ist es nicht"
>
> „es ist einfach wichtig dass du das verstehst weil sonst verstehst du nicht was das panel soll"

**Diese zwei Bedingungen sind der Zweck des Panels.** Wer das Panel als Ablage für drei Listen
baut, hat die Aufgabe nicht verstanden. Es muss den Werbebau **schneller** machen als
PowerPoint **und** besser für Produktwerbung.

**Worin das Werkzeug PowerPoint schlägt — und was dabei heute verschenkt wird:**

- Das Band **wiederholt sich von selbst** durch das ganze Video, frame-genau (30 fps),
  markengebunden. In PowerPoint kopiert man dafür die Folie zwanzigmal.
- **Zeit ist ein Gegenstand des Werkzeugs**, keine Eigenschaft einer Folie. Deshalb sitzt das
  Panel **neben der Zeitleiste**: Inhalt (was läuft) und Zeit (wann, wie lange) liegen im
  selben Blickfeld. PowerPoint hat diesen Ort nicht.

**Warum es heute trotzdem LANGSAMER ist als PowerPoint (fünf Ursachen, alle im Code):**

1. **Draggen statt Klicken** — bei 800 px ist das Einfügeziel wenige Pixel breit.
2. **Jede Aktion wird von Hand gebaut** — kein Preset, keine Kopie.
3. **Zwei Aktionen sind ohne Öffnen nicht unterscheidbar** — kein Bild in der Liste.
4. **Die Folge einer Änderung ist unsichtbar** — Gesamtdauer, Bandwiederholungen, Startzeit.
5. **Das Ergebnis zeigt sich erst nach dem Rendern.**

**Daraus folgt für die drei Ansichten des Panels:**

- **Aktionen** = Regal, nicht Verwaltung: jede Zeile mit **Bild** (die Maschinerie ist da), mit
  **„läuft bei 0:12 · 3×"** (Rückverweis fehlt heute im Code, 0 Treffer) und **einem Klick
  „ins Video"** statt Drag. Dazu **Vorlage beim Anlegen** und **Duplizieren mit neuem Preis**.
- **Video** = Zeitbasis, nicht Datei: Länge, Auflösung, fps — und **wie viel davon belegt ist**.
- **Eigenschaften** = Folge, nicht Wert: „10 s" wird zu **„+10 s · Gesamt 0:42 · Band 3× · ab
  0:12"**, dazu ±1 Frame und **„an die Abspielmarke setzen"** (die Marke existiert, ist aber
  nirgends als Bezug nutzbar).

**Effekte (später, aber Teil des Versprechens).** Geprüft: Der Band-Overlay ist heute **statisch**
(`overlay=x=0:y=<by>`, `filter-einblendung.ts:258`). Bewegung ist kein neuer Motor, sondern ein
Parameter — `overlay` nimmt Zeitausdrücke in `t`. Klein und billig: **Band fährt ein/aus**,
**Motiv atmet** (`zoompan`), **Übergang statt hartem Schnitt** (`fade`), **mehrere Varianten in
einem Lauf**.
**Ehrliche Grenze:** Das Band ist EIN gerendertes Standbild (`standbild.ts`). Bewegung *im* Band
heißt Bildfolge rendern — teuer. Das Band als Ganzes zu bewegen ist billig, seinen Inhalt zu
animieren nicht.

**Nächster Schritt bleibt:** Leiste + Panel, drei Ansichten — aber jede Ansicht wird nach DIESER
Messlatte geschnitten, nicht nach dem, was heute in der Rail steht.

### 16a. DER FILTER (Niklas, 02.11.2026)

> „schneller oder sehr viel besser sonst passt es"

**Jedes Element des Panels muss EINES von beiden sein — schneller oder sehr viel besser.
Sonst gehört es nicht hinein.** Nicht „auch ganz hübsch", nicht „schon immer da". Die Frage je
Zeile, je Knopf, je Zahl: *Macht das den Werbebau schneller, oder kann PowerPoint das nicht?*

Angewendet auf den Bestand:

| Element | Urteil |
|---|---|
| Aktion mit **Bild** in der Liste | **schneller** (kein Öffnen, um zu vergleichen) |
| **„läuft bei 0:12 · 3×"** an der Aktion | **sehr viel besser** (Rückverweis gibt es in PowerPoint nicht) |
| **„Ins Video"** als Klick | **schneller** als der Drag |
| **Duplizieren mit neuem Preis** | **schneller** |
| **„+10 s · Gesamt 0:42 · Band 3×"** | **sehr viel besser** |
| **±1 Frame**, **„an die Abspielmarke"** | **sehr viel besser** (frame-genau kann PowerPoint nicht) |
| nackte Dauer-Zahl („10 s") | **fällt durch** — weder schneller noch besser |
| Titelliste ohne Bild (heutige Aktionen) | **fällt durch** |
| Statistik „Elemente 2 · Videos 1 · Segmente 1" | **fällt durch** — Buchhaltung, kein Nutzen für den Bau |

**Konsequenz:** Der Filter ist ein **Streich-Werkzeug**, kein Rechtfertigungsformular. Was
durchfällt, wird entfernt und nicht umgestaltet.

### 16b. WAS ZÄHLT, IST DAS ERGEBNIS (Niklas, 02.11.2026)

> „wichtig ist vorallem das ergebnis am ende"

Nicht das Panel, nicht die Ansicht, nicht die Ordnung im Werkzeug: **der fertige Werbespot**.
Das Panel ist Mittel, das Ergebnis ist der Zweck. Folgen:

- **Rückwärts planen:** erst beschreiben, wie der fertige Spot aussieht, dann die Schritte
  dorthin zählen, dann das Panel daraus schneiden. Nicht vom vorhandenen Code her.
- **Die Bühne ist der einzige Ort, an dem das Ergebnis VOR dem Rendern sichtbar ist.** Sie
  zeichnet das Band bereits über das Video (`preview-player/einblendung.tsx`, `band-takt.ts`).
  Also muss gelten: was im Panel geändert wird, ist **sofort auf der Bühne** zu sehen.
- **Der Prüfstein jeder Änderung** ist damit nicht „ist die Liste schöner", sondern „sieht der
  fertige Spot dadurch besser aus, und komme ich schneller dorthin".

## 17. SIDEPANEL, SCHRITT 1 GEBAUT (`fff1d85`, 02.11.2026)

**Leiste und Panel sind DASSELBE** — kein zweiter Block, kein Overlay.

- **`seitenleiste.tsx`:** Leiste **36 px** (drei Symbole: Video · Aktionen · Eigenschaften,
  Zuklapp-Pfeil unten), Panel **240 px**. **EINE Regel** im Bauteil: Klick auf die **offene**
  Ansicht klappt zu, jeder andere Klick öffnet sie. Der Aufrufer (`composer/index.tsx`) speichert
  nur `{ ansicht, offen }` — er rechnet die Regel nicht nach.
- **`bibliothek-ansicht.tsx`** bekam `bereich: 'alle' | 'video' | 'aktionen'`. **Ohne Angabe
  bleibt beides sichtbar** — deshalb sind alle bestehenden Aufrufer und Tests unberührt.
- **„Eigenschaften" ist noch leer** und sagt, was zu tun ist (Anbindung an die Auswahl = Schritt 3).
- **BEFUND AM BILD, den keine Zahl zeigte:** Der **gedrückte Zustand war unsichtbar**.
  `SymbolKnopf` setzt seinen Hintergrund **inline**, und inline schlägt die
  `aria-pressed`-Regel aus `basis.css` — das galt für **jede** Leiste der App (auch die
  Projektleiste seit #456). Jetzt Akzentfläche mit dunkler Schrift; ein Test prüft den
  **sichtbaren** Zustand, nicht nur `aria-pressed`.

**Gemessen am Fenster (Treiber 4f4):**

| | Breite |
|---|---|
| Sidepanel | **284** (Leiste 36 + Panel 240 + 8) |
| Bühne / Zeitleiste | **476** |
| Hauptspalte **zugeklappt** | **724** (Rail weg — gemessen) |
| wieder aufgeklappt | **476** (exakt zurück) |

**Belegt:** Typecheck 0, ESLint 0, Unit **5385/5385** (353 Dateien, +9: fünf Leiste, drei
Bereichs-Filter, einer sichtbarer Zustand). Treiber **1 Befund** (Bandliste) + 2 Untersuchungen
+ 1 MANUELL — **derselbe Stand wie vor dem Umbau**.

**Falle für die nächste Sitzung:** Der Treiber wählt die Ansicht selbst über die Leiste
(`zeigeAnsicht`, liest `aria-pressed` — ein Klick auf die offene Ansicht würde **zuklappen**).
Der Panel-Zustand **überlebt kein Projekt-Neuöffnen**: Der Composer setzt ihn auf „Video" zurück.
Deshalb schaltet der Treiber an jeder der 25 Stellen, an denen er den Composer betritt.
Zwei Protokoll-Läufe sind als **UNGÜLTIG** markiert — sie maßen falsche Ansichten, nicht
defekten Code.

**Nächster Schritt (Schritt 2 nach Konzept Abschnitt 10):** Aktionszeile mit **Bild** und
**„läuft bei 0:12 · 3×"**. **Vorher messen (Lücke L-C):** ob `composer/thumbnails.ts` ein
AKTIONS-Motiv liefert oder nur Videobilder — sonst wird eine Vorschau versprochen, die es
nicht gibt.

## 18. SIDEPANEL, SCHRITT 2 GEBAUT (`250f736`, `23be1f1`, 02.11.2026)

**Die Aktionszeile ist jetzt ein Regal-Eintrag: Bild + Verwendung.**

- **`verwendungen.ts`** (`250f736`, rein): Startsekunde im Band = Summe der Abschnitte davor;
  Wiederholungszahl aus **derselben** Rechnung wie der Block `x3` (`baueBandspur`);
  Unterbrechungen aufsteigend; laeuft eine Aktion zweimal in der Folge, nennt die Zeile die
  **erste** Stelle. Ohne Verwendung: „noch nicht im Video".
- **`aktions-vorschau.ts`** (`23be1f1`): zeichnet das Motiv **einmal** (voller Canvas), verkleinert
  es und merkt nur das kleine Bild (max. 40). **Der Schluessel sind die EINGABEN**, nicht die ID —
  sonst bliebe nach jeder Textaenderung das alte Motiv stehen. Ohne Canvas → `null`, kein Wurf.
- **`bibliothek-ansicht.tsx`**: laedt die Bilder der Aktionen **vor** dem Zeichnen
  (`bereiteMotiveVor`) — sonst waere das Motiv ein Rahmen ohne Inhalt. Zaehler statt Zeitgeber.

**BEFUND AM FENSTER (nur die Messung zeigte ihn):** Der Treiber druckt die Motivbreiten
**474** und **71** — das erste Motiv ist ein **Band** (1920 × 162 = 11,85:1). Eine feste
Anzeigebox 71 × 40 haette es zusammengequetscht. Die Anzeigegroesse folgt jetzt dem
Seitenverhaeltnis, gedeckelt auf **96 px**; ein Band wird dadurch **flach** (96 × 8) — das ist,
was ein Band ist.

**Belegt:** Typecheck 0, ESLint 0, Unit **5404/5404**; Treiber **1 Befund** (Bandliste) — beide
Motive im Fenster **gezeichnet** (`motivBreite 474 / 71`).

**ENTSCHIEDEN UND GEBAUT (`bcc1673`): ZWEI FORMEN, ZWEI LAYOUTS.** Ein Band bekommt eine
**eigene Zeile in voller Breite** (216 × 18) — dort sind Logo, Ueberschrift und Preis als
Flecken erkennbar; ein Ganzbild bleibt **neben dem Titel** (71 × 40), wo der Titel lesbar ist.
Beide behalten ihr Seitenverhaeltnis: die Anzeige kommt aus dem CSS (`width` + `height: auto`),
nicht aus gerechneten Pixeln. **Keine Verzerrung, kein Beschnitt.** Der Text im Band ist bei
18 px nicht lesbar — das ist die ehrliche Grenze und steht so in der Abnahme.

## 19. SIDEPANEL, SCHRITT 3: EIGENSCHAFTEN — UND DER TREIBER IST SAUBER (`93c3343`, `921f3a1`)

**„Eigenschaften" ist an die Auswahl gebunden.** Die Ansicht baut **keine zweite Bedienung**:
sie montiert `ElementBedienung` aus #249, die bisher nur in der **versteckten** Wiedergabeliste
lag und damit unerreichbar war.

- **`eigenschaften.ts`** (rein): die **Folge** eines Blocks — Gesamtlaenge, Bandwiederholungen,
  Startstelle. Alles aus bestehenden Rechnungen (`gesamtlaenge`, `zeitband`, `verwendungen`);
  was fehlt, steht als „unbekannt" da und wird nicht erfunden.
- **`eigenschaften-ansicht.tsx`**: Kopf (Bezeichnung, „Block n von m"), Folge, dann die
  bestehende Bedienung. Ohne Auswahl sagt sie, was zu tun ist; bei Mehrfachauswahl nennt sie
  den ersten; ein verschwundener Block sagt das statt zu werfen.

### Der Befund ist WEG — nicht dokumentiert, behoben

Der Treiber geht den Band-Weg jetzt **wie ein Nutzer**: Block in der Zeitleiste waehlen,
Ansicht „Eigenschaften", dort „Band". Ergebnis:

```
[schritt-4f6] Bandliste: wahl=ok; Zeilen 0->1; uebernehmen=true;
               Store: einblendung.abschnitte = 1 Abschnitt
[schritt-4f6] Einfuegeweg GEMESSEN ... (#453 belegt)
[schritt-4f6] Verwendung nach dem Band: ["Band ab 0:00"]
```

### Auch die zwei Untersuchungen sind Messungen geworden (`921f3a1`)

| Eintrag | vorher | jetzt |
|---|---|---|
| **Dauer der MP4** | las `wiedergabeliste-laenge` in der versteckten Liste → `null` | liest die Gesamtdauer aus der **Statistik** → `"0:12" (12 s)` |
| **Dauer/Trim-Undo** | las `element-dauer` in der versteckten Liste → `null` | Block waehlen → „Eigenschaften" → `"2,0 s" -> "1,1 s" -> Undo "2,0 s"`, **GEMESSEN** (#429) |

**TREIBER-STAND: 0 Befunde, 0 Untersuchungen, 1 MANUELL** (nativer Export-Dialog,
User-Entscheidung 13.10.2026 — der bleibt MANUELL, weil der Treiber einen nativen Dialog
weder bedienen noch mocken soll).

**VOLLER PRUEFLAUF `npm run pruefung` — EXIT 0:** Unit **5417/5417** (358 Dateien),
Integration **50/50** (13 Dateien), Treiber **0 Befunde**, Typecheck 0, ESLint 0 Fehler/0
Warnungen.

**Ehrlich offen:** Im ERSTEN Gesamtlauf fiel `einzel-instanz.spec.ts` (#289, Last-Flaky ueber
eine Signaldatei); einzeln dreimal 7/7 gruen, im zweiten Gesamtlauf gruen. Nicht behoben,
aber benannt.

**Naechster Schritt:** Im Konzept (Abschnitt 10) stehen noch **`Ins Video` als Knopf** und
**Preset beim Anlegen** — die Aufwand-Senker. Danach die **Effekte** (Band faehrt ein/aus,
Motiv atmet, Uebergang statt hartem Schnitt).

## 20. „INS VIDEO" GEBAUT (`0268bf5`, `6a73785`), die Buchhaltung nachgezaehlt — und ein Produktwiderspruch gefunden (02.11.2026)

### 20.1 Die Commit-Zahl war falsch, und zwar systematisch

Die Uebergabe sagte **23**; `git log --oneline origin/main..HEAD` zaehlte **24**. Ursache: der
korrigierende Commit `c362ef9` („23 statt 13") zaehlte sich selbst nicht mit. Die Zahl steht
jetzt **mit dem Befehl** und dem Bezugs-Commit in `CLAUDE.md` — eine abgeschriebene Zahl driftet
bei jedem Doku-Commit um eins.

### 20.2 Was „Ins Video" tut — und was es ablöst

**Ein Knopf je Aktionszeile**, der die Aktion **per Klick** ins Video legt. Die Regel liegt in
**`composer/ins-video.ts`** (rein, ohne React/DOM/IPC):

| Form der Aktion | Wirkung | Weg |
|---|---|---|
| Band (`vorlage.höhe !== null`) | **Abschnitt am Ende der Bandfolge**; bestehende Abschnitte und die Band-Vorlage bleiben | `uebernehmeBand` (#129) |
| Ganzbild (`höhe === null`, auch **unbekannte** Vorlage) | **Unterbrechung an der Abspielmarke** | `nehmeAktionAlsUnterbrechungAuf` — derselbe Weg wie ein Drop auf den Video-Koerper (#442) |

**Die Zeitstelle** kommt aus der **Abspielmarke** (`gemeinsam/abspielposition`): projektweite
Frames -> Block und Sekunden im Block (Summe der `frameDauer` davor) -> Videozeit
(`spieleZeitBeiSequenzzeit`, rechnet Unterbrechungen heraus und klemmt in `(0, Videodauer)`).
Steht die Marke nicht in einem Video, sagt die Meldung das — **es wird nichts erfunden.**

**ABLÖSUNG, OFFEN BENANNT (Entscheidung Niklas, 02.11.2026):** #442 hatte festgelegt,
Band-Abschnitte entstuenden **ausschliesslich in der Band-Bearbeitung**. Fuer diesen Knopf gilt
das nicht mehr — er ist der Aufwand-Senker, für den das Band überhaupt existiert. Die
**Drop-Regel bleibt unberührt** (Drop auf den Video-Körper = immer Unterbrechung).

### 20.3 Am Fenster gemessen (Treiber `4f8`, neu)

| Messung | Ergebnis |
|---|---|
| Marke setzen (Klick auf die Zeitachse, +8 px) | Frame **30** (= 1 s) |
| **Ganzbild** klicken | Unterbrechung `{zeitstelle: 1, aktionRef: <neu>, dauer: 10}`, **0 -> 1**, Store nach **4270 ms**, **kein** neues Listenelement |
| **Band** klicken | Abschnitte **1 -> 2**, letzter `aktionRef` = die geklickte Aktion, Liste **2 -> 2**, Zeile sagt **„Band ab 0:00"** |
| Höhen bei 800 × 572 | Bühne **280**, Zeitachse **18**, „Rendern…" **27** px — nichts aus dem Bild geschoben |
| Aufräumen | beide Wirkungen per Cmd+Z zurück, Zustand wie vorher |

**Der Klick braucht keine Zielscheibe** — genau der Punkt aus Abschnitt 16 („Draggen statt
Klicken: bei 800 px ist das Einfügeziel wenige Pixel breit").

### 20.4 DER BEFUND, DER WICHTIGER IST ALS DAS FEATURE: ein Projekt MIT Unterbrechung lässt sich nicht rendern

Beim Messen fiel ein **neuer** Treiber-Befund auf (`FA-08`, „der Render legt die Ausgabedatei
an"). Die Ursachenkette ist vollständig belegt:

1. `4f5` klickte den **ersten Knopf** der Aktionszeile — mit „Ins Video" an dieser Stelle legte
   der Schritt die Aktion als **Unterbrechung** an (Messfehler, behoben: der Schritt klickt
   jetzt `aktion-hinzufuegen-<id>`).
2. Der Render **scheiterte** danach mit `ungueltige_eingabe`: *„Die Element-Kennung … kommt
   mehrfach vor"*. `project.json` hatte dabei **ein** Element mit **einer** Unterbrechung.
3. **`render-ausloesen.ts:189`** vergibt jedem **Video-Teil** bewusst **dieselbe** Element-Kennung
   („damit der Reparatur-Modus (9.7.5) das Element über `RenderResult.fehlerhaftesElementId`
   findet"). **`validierung.ts:524`** verlangt **eindeutige** Kennungen im Auftrag.
4. Ergebnis: **jedes Projekt mit mindestens einer Unterbrechung ist nicht renderbar.** Die
   Unterbrechung ist mit #426/#442 gebaut, im Editor bedienbar — und die Ausgabe scheitert.

**NICHT behoben.** Es ist eine Entscheidung, keine Reparatur: entweder dürfen Teil-Clips
dieselbe Kennung tragen (dann muss die Validierung sie zulassen und die Fehlerzuordnung eine
Regel für „welcher Teil" bekommen), oder die Teile bekommen eigene Kennungen (dann braucht der
Reparatur-Modus eine Rückabbildung auf das Element). Beides berührt TK 9.2.1 („Jedes
`RenderItem` trägt eine `id` zur eindeutigen Fehlerzuordnung") — **das entscheidet Niklas,
nicht der Agent.** Für den MVP ist es blockierend: „Ins Video" für Ganzbilder erzeugt genau
so eine Unterbrechung.

### 20.5 Belege

- **Unit 5445/5445** (360 Dateien, +28: 21 `ins-video`, 5 Knopf, 2 Klick-Weg), **Integration
  50/50** (13), **Treiber 0 Befunde / 0 Untersuchungen**, Typecheck 0, ESLint 0 Fehler /
  0 Warnungen. `npm run pruefung` **EXIT 0**.
- **10 Gegenproben**, jede rot und byte-identisch zurückgenommen. **Eine blieb zuerst grün**
  (IV6, `art !== 'video'`): der Test führte nur ein Segment mit `trimStart: null` vor — dann
  greift schon `videoSekunden`, und die Prüfung war von der Fixture verdeckt. Neuer Fall: ein
  Segment, das **von Hand** Trim-Werte trägt. Danach rot.
- **Nebenbefund, behoben:** `tests/unit/eigenschaften-ansicht.spec.ts` trug seit `93c3343`
  einen unbenutzten `vi`-Import — die Uebergabe behauptete „0 Warnungen", oxlint meldete eine.
  Entfernt.

**Nächster Schritt:** der Widerspruch aus 20.4 (Entscheidung), danach Konzept Abschnitt 10
weiter: **Preset beim Anlegen**, dann die **Effekte**.

## 21. UNTERBRECHUNGEN SIND WIEDER RENDERBAR — und der Block-Weg ist weg (03.11.2026)

### 21.1 Die Reparatur (`6e09d4f`)

Der Widerspruch aus 20.4 ist **behoben**, nicht umgangen:

| Stelle | vorher | jetzt |
|---|---|---|
| `composer/render-ausloesen.ts` | jeder Video-Teil trägt `id: element.id` | `<elementId>#<n>` (n = 1..Anzahl Teile); **ohne** Zerlegung bleibt die nackte Kennung |
| `auftrags-manager/render-verzahnung.ts` | reicht `fehlerhaftesElementId` durch | `elementIdAusItemKennung(...)` schneidet am **ersten** `#` — **eine** Rückabbildungsstelle |

Damit gilt beides: der Auftrag hat **eindeutige** Kennungen (Validierung), und der Reparatur-Modus
bekommt das **Element** (FA-19). TK 9.2.1 bleibt erfüllt — „jedes `RenderItem` trägt eine `id` zur
eindeutigen Fehlerzuordnung" ist mit Teil-Kennungen sogar wörtlicher als vorher.

### 21.2 Der Beleg, der nicht von der Umgebung abhängt

**`render-ausloesen.spec.ts` → „NAHT: der fertige Auftrag besteht die Pruefung des render-service":**
Der Test baut den Auftrag mit `loeseRenderAus` (Unterbrechung im Video) und schickt ihn durch
**`pruefeRenderRequest`** des render-service. Beide Seiten in **einem** Lauf, ohne ffmpeg.
Er war zuerst **rot** („Die Element-Kennung … kommt mehrfach vor") und ist jetzt grün.
Zwei Nebenarbeiten dafür: der `alsPng`-Doppel liefert einen **echten PNG-Kopf** (sonst prüft der
Fall die Attrappe), und `electron` wird gemockt (`app.isPackaged`).

### 21.3 „Zur Liste hinzufügen" ist entfernt — und was das nach sich zog

**Niklas, 02.11.2026:** *„aktion als eigener block zur liste hinzufügen ist müll von früher der muss
weg … und die unterbrechungen sind ja essenziell"*.

- **Entfernt:** der Knopf, der Helfer `hinzufuegen`, der `fuegeElementHinzu`-Import und die Props
  `aufFehler` + `sichtSchreiber` der Bibliothek (beide ohne Verbraucher). Der Prop
  `sichtSchreiber` bleibt nur dort, wo er noch schreibt.
- **Tests:** drei Fälle des alten Wegs sind entfallen (`fuegeElementHinzu`-Ruf, Fehlerdurchreichung,
  Sperrfreiheit) und durch zwei neue ersetzt (kaputte Aktion bleibt **bedienbar**; der alte Knopf
  existiert **nirgends** mehr). `drag-quellen.spec.ts` prüft den Klick-Weg jetzt an „Ins Video".
- **NICHT entfernt:** der **Drag an eine Kante** erzeugt weiterhin ein `segment`-Element, und alte
  Projekte tragen solche Blöcke. Sie müssen weiter rendern — 4f5 ist deshalb auf einen
  **Altbestands-Fall** umgestellt (Element per Store, nicht per Bedienung; offen benannt).

### 21.4 Treiber: vier Schritte mussten mitziehen (`96861fc`)

| Schritt | Grund | Lösung |
|---|---|---|
| 4f5 | klickte den entfallenen Knopf | Element per `project:fügeElementHinzu`, Aufräumen per `project:entferneElement` (der Undo-Pfeil nimmt einen Store-Ruf **nicht** zurück — gemessen: 2 Blöcke blieben, die Kontextmenü-Schritte fanden eine zu lange Zeitleiste) |
| 4f | dito (zweiter Block für die Drag-Messung) | dito, mit Aufräumen |
| 4f3 | klickte den entfallenen Knopf | misst die Pfeile an „Ins Video": `"noch nicht im Video"` → `"Band ab 0:00"` → Undo → Redo |
| 4f7 | `laeuft=nein`, obwohl die Marke wanderte | „die Uhr läuft" wird **0,4 s** nach dem Start gemessen; ein 2-s-Projekt ist nach 1,5 s am Ende |

**4f8** rendert zusätzlich ein Projekt **mit** Unterbrechung (Datei + ffprobe gegen die Anzeige).

### 21.5 Was NICHT belegt ist (und warum)

- **Der Render-Beleg in 4f8 kam nicht durch.** Der Auftrag **besteht die Prüfung** — der Fehler ist
  von `ungueltige_eingabe` zu `ffmpeg_fehler` gewandert, das ist der Fortschritt —, dann scheiterte
  ffmpeg an **„Error while filtering: No space left on device"** (Exit 228 = `256 − 28`), bei
  **843 GB freiem Platz** und 140 MB Temp-Verzeichnis. Ursache **nicht** gefunden; eine gezielte
  Diagnose (voller ffmpeg-`stderr` + `argv` in eine Datei) wurde vorbereitet, aber der Lauf starb
  vorher.
- **Danach starben die Läufe früher:** reproduzierbar **`detached Frame` bei 4a2**
  (`standZurueckLesen`), ohne `[fenster crash]` und ohne Main-stderr (mit `dumpio: true` geprüft).
  Zwei Läufe hingen dort 25 bzw. 15 Minuten.
- **Das volle Gate ist nach diesen Änderungen NICHT gelaufen.** Belegt sind: `eslint .` **Exit 0**,
  `tsc` main **0**, `tsc` renderer **0**, die Naht-Probe grün (22/22 in `render-ausloesen.spec.ts`),
  `render-verzahnung.spec.ts` 25/25. **Nicht** belegt: volle Unit-Zahl, Integration, Treiber,
  `tsc -p tsconfig.tests.json` **nach** der letzten Teständerung.
  *Grund, ehrlich:* `tsc`, `oxlint` und `vitest` hängen in dieser Sitzung sporadisch (Vitest:
  „Worker exited unexpectedly"), während dieselben Befehle Minuten später in Sekunden durchlaufen.
  Nach einem Dutzend Electron-Läufen und 7 Tagen Laufzeit ist die Maschine die naheliegende Ursache
  — **belegt ist das nicht.**

### 21.6 Zwei NEUE Widersprüche, offen

1. **Band-Aktion als Unterbrechung ist nicht renderbar.** Ein Drop auf den Video-Körper legt seit
   #442 **immer** eine Unterbrechung an — auch für eine Band-Aktion. `zeichneSegment` zeichnet dann
   mit der Band-Vorlage: **1920 × 162**. Der Render verlangt für `segment` **1920 × 1080** und weist
   ab („Das `segment`-PNG hat die Masse 1920 x 162; erwartet waren 1920 x 1080"). Belegt in 4f8
   (Fehlercode `ungueltiges_element`, `daten.elementId` sauber zurückgebildet).
   **Entscheidung nötig:** Band-Aktionen als Unterbrechung **verbieten** (Drop landet im Band) oder
   sie **vollflächig** zeichnen.
2. **Unterbrechung mit Dauer < 10 s ist nicht renderbar.** `fuegeUnterbrechungEin` erlaubt jede Dauer
   `> 0`; die Auftragsprüfung verlangt für `segment` **10–45 s** (TK 9.5.2). Der Standard ist 10 s,
   deshalb fällt es nur nach einer Änderung auf. **Entscheidung nötig:** Grenze für Einschübe
   festlegen (und dann an EINER Stelle prüfen) oder die Prüfung für Unterbrechungen öffnen.

**Nächster Schritt:** Maschine neu starten, `npm run pruefung` **einmal vollständig**; dann die zwei
Entscheidungen aus 21.6, danach Konzept Abschnitt 10 weiter (Preset beim Anlegen, Effekte).

## 22. DAS GATE LÄUFT DURCH, DER ENOSPC IST ERKLÄRT, BEIDE WIDERSPRÜCHE SIND ZU (03.11.2026)

### 22.1 Das Gate — vollständig, zum ersten Mal nach den Reparaturen

| Prüfung | Ergebnis |
|---|---|
| typecheck main / preload / renderer / **tests** | 0 |
| eslint + oxlint | 0 |
| build | ok |
| Unit | **5452 / 5452** (360 Dateien) |
| Integration | **51 / 51** (13 Dateien) |
| Treiber | **0 Befunde**, 1 Untersuchung (`Mehrfachauswahl`, kein Befund), 1 MANUELL (nativer Export-Dialog) |

Damit ist die Lücke aus 21.5 geschlossen — auch `tsc -p tsconfig.tests.json`, das dort ausdrücklich
ungeprüft war. **`einzel-instanz.spec.ts` fiel in einem Lauf** und lief einzeln dreimal grün: der
bekannte Flaky (#289), nicht behoben.

**Der Render-Beleg ist erbracht:** `4f8` rendert ein Projekt **mit** Unterbrechung —
`Datei=true, ffprobe 12.022 s` bei Anzeige `0:12` (2 s Video + 10 s Einschub).

### 22.2 Der ENOSPC war ein Produktfehler (`fcbc758`)

Die Meldung sah wie ein Umgebungsproblem aus („No space left on device" bei **843 GB** frei), und der
vorige Abschnitt hat sie so behandelt. Sie war keine: eine **Diagnose-Probe** (volles `argv` und
voller `stderr` in eine Datei, per Umgebungsvariable `SIGNAGE_FFMPEG_PROTOKOLL`, danach byte-identisch
entfernt) zeigte den scheiternden Aufruf — ein **Video mit Band**, `-ss 0.991667`, `-frames:v 30`,
`band_0002.mp4` als zweiter Eingang.

| Stelle | vorher | jetzt |
|---|---|---|
| `normalisieren.ts` (Bandspur) | `gesamtFrames = frames` (Teillänge) | **`gesamtFrames = endFrame`** |
| Fortschritts-Solldauer der Bandspur | `frames` | `endFrame` |

**Warum das die Ursache war.** Der Schnitt läuft über einen **Ausgabe**-`-ss`
(`(startFrame − 0,25)/fps`, `video-ausschnitt.ts`), und der spult **jede** Spur im Graph vor — auch
die Bandspur. Eine Spur von `frames` Bildern verliert damit `startFrame` Bilder am Anfang. Blieb
weniger als ein Bild, brach ffmpeg mit **Exit 228** ab (`= 256 − 28 = ENOSPC`). Am echten Aufruf
gemessen, `startFrame = 30`, `frames = 30`:

| Bandlänge | Exit |
|---|---|
| 30 Bilder (= `frames`) | **228** |
| 31 Bilder | 0 |
| 60 Bilder (= `startFrame + frames`) | 0 |

**Das betraf JEDES getrimmte Video mit Band** — nicht nur Unterbrechungen. Die Unterbrechung hat nur
zum ersten Mal einen Videoteil mit `startFrame ≠ 0` erzeugt; ein von Hand getrimmtes Video mit Band
wäre an derselben Wand gelandet, nur hatte das kein Treiber gerendert.

**Folge, offen benannt:** Das Band ist am **Elementanfang** verankert und läuft über eine
Unterbrechung hinweg **weiter**, statt an jedem Teil neu mit dem ersten Abschnitt zu beginnen. Das ist
die gewollte Semantik, aber eine Verhaltensänderung gegen die alte Vorgabe. Befund **B3** im Kopf von
`normalisieren.ts` ist neu geschrieben und nennt die Messung; `tests/unit/normalisieren.spec.ts` trug
die alte Regel wörtlich im Testnamen („nimmt bei GETRIMMTEM Video die Laenge, nicht endFrame") und ist
umgedreht. Neuer Integrationstest in `einblendung-echt.spec.ts`: getrimmter Teil mit Band, **ffprobe
zählt die Bilder** (30 erwartet) — `lauf.ok` allein hätte nicht gereicht, ein zu kurzer Clip wäre auch
„ok".

### 22.3 Eine Dauer-Spanne für alle Segmente (`0f1d223`, AD v1.12 / TK v3.34)

**Niklas, 03.11.2026:** *„sonst nehmen wir einfach jede dauer größer als 8s und keine zwei typen"*.

Damit fällt der zweite Typ weg: **kein** Feld im Render-Auftrag, das Einschub und Zeitleisten-Segment
unterscheidet. Es gilt **eine** Spanne aus **einer** Konstante.

- `DAUER_BEREICH.min` **10 → 8** (`shared/contracts/konstanten.ts`). Die Konstante ist die eine Quelle;
  `setzeDauer`, `setzeStandardSegmentdauer`, `fuegeElementHinzu`, `pruefeRenderRequest`, der
  Dauer-Regler und der Aktions-Editor lesen sie schon.
- **`setzeUnterbrechungen` prüft die Dauer jetzt gegen dieselbe Spanne.** Vorher stand dort nur `> 0`
  mit dem ausdrücklichen Vermerk, ob eine Grenze gilt sei „nicht hier festgelegt". Folge: eine
  Unterbrechung von 5 s wurde **gespeichert** und erst der **Render** wies sie ab — der Nutzer sah den
  Fehler erst beim Rendern.

**Warum 8 und nicht die Slot-Grenze 10:** Das Anforderungsdokument nennt das Merkmal selbst „**kurze**
Unterbrechung" (4.5). Mit einer Untergrenze von 10 s **und** einem Standard von 10 s war jede
Unterbrechung mindestens 10 s lang — der Name war ein Etikett. Die Obergrenze **45 bleibt**.

**Doku:** AD v1.12 (4.4 mit eigener Begründung), TK v3.34 (Operationstabelle 9.5.2, Konstantentabelle
9.11.4), `AGENTS.md`. Die Zeile zur mit v3.16 gestrichenen `bild`-Art bleibt als **historisches Zitat**
auf 10–45 stehen.

**Ehrlich benannt:** Ein **Altprojekt** mit einer Unterbrechung unter 8 s (nur per API oder
Handeditierung möglich — die Oberfläche bietet keine Dauer-Eingabe) wäre beim Verschieben dieses
Einschubs blockiert. **Kein Sonderfall gebaut**, solange kein solcher Fall existiert.

### 22.4 Widerspruch 1: Der Drop entscheidet nach der Vorlage (`85adaf7`, TK v3.35)

**Vorher:** Der **Klick** entschied nach der Form der Aktion (`ins-video.ts`), der **Drop** auf den
Video-Körper legte **immer** eine Unterbrechung an (#442). Eine Band-Aktion wurde damit als
vollflächiger Einschub gezeichnet: **1920 × 162**, während der Render für ein `segment`
**1920 × 1080** verlangt — jedes solche Projekt war **nicht renderbar** (`ungueltiges_element`).

**Jetzt entscheidet EINE Stelle für BEIDE Eingänge:** `legeAktionInsVideo`
(`composer/verwende-zeitleisten-zug.ts`).

| Form der Aktion | Wirkung beim Klick **und** beim Drop |
|---|---|
| Band-Vorlage (`höhe !== null`) | **Abschnitt ans Band** über `uebernehmeBand` (derselbe Schreibweg wie die Band-Bearbeitung) |
| Ganzbild (auch unbekannte Vorlage) | **Unterbrechung** an der Zeitstelle |

`index.tsx` bleibt nur noch: Video finden, Zeitstelle aus der Abspielmarke lesen, abgeben.

**Warum nicht „vollflächig zeichnen":** Die Zonen einer Bandvorlage liegen auf **festen `y`-Werten
ihrer Bandhöhe**. Auf 1080 gestreckt wäre es unlesbar; oben leer gelassen wäre es kein Vollbild,
sondern ein Streifen mit schwarzem Loch. Für beides bräuchte es eine **zweite Layout-Wahrheit je
Vorlage**. AD 4.5 sagt ohnehin: die Unterbrechung ist ein „eigenes, **vollflächiges** Segment".

**Belege:** `zeitleisten-zug-wirkung.spec.ts` schrieb die alte Regel wörtlich fest („auch fuer eine
Aktion mit Band-Vorlage") und hat jetzt zwei Aktionen und beide Wege — **7 Fälle**, darunter der
Band-Fall **ohne** Zeitstelle. Der Mock ersetzt nur `uebernehmeBand`; `fuegeAbschnittAn` und
`waehlbareBandVorlagen` bleiben **echt**, sonst prüfte der Test seine eigene Attrappe.
Am Fenster: `4b6` (Ganzbild → Unterbrechung) und `4f2` (Band → Abschnitt, keine Unterbrechung,
Blockzahl 1 → 1, ein `Cmd+Z` nimmt den Abschnitt zurück).

### 22.5 `4f7` war ein Messfehler (`5203b42`)

Der Lauf meldete „bei Pause steht die Marke still" mit **Frame 11 → 29**. Das Projekt ist **2 s** lang;
die Wiedergabe war nach 1,5 s **am Ende**, und der Klick auf `vorschau-play-pause` traf denselben Knopf
im **Play**-Zustand. Play beginnt am Ende wieder bei 0 (ENTSCHIEDEN 3) — die Marke wanderte, weil sie
**neu startete**. Die Zahlen passen frame-genau: 400 ms nach dem Neustart Frame 11, 1000 ms Frame 29,
bei 30 fps.

Jetzt: kein Warten bis zum Ende, **pausiert wird 400 ms nach dem Start**; die Bewegung wird **vor** dem
Pausieren belegt; ein **neuer Zweig** verlangt nach der Pause `laeuft="nein"` (vorher prüfte der
Schritt nur „Frame unverändert" — das wäre auch grün gewesen, wenn die Uhr weiterläuft und nur die
Marke hängt); ein Wiederholungsversuch ist erlaubt und wird protokolliert.

### 22.6 Treiber (`4c2cbce`) und drei Lehren

| Schritt | Grund | Lösung |
|---|---|---|
| `4b5` | Seed legte eine **1-s**-Unterbrechung an — mit der neuen Untergrenze ungültig | 8 s (die Untergrenze, damit sie mitgemessen wird); Frames 120/275 statt 45/70 |
| `4b6` | zog bewusst eine **Band**-Aktion, um zu zeigen, dass die Vorlage nichts entscheidet | zieht jetzt eine **Ganzbild**-Aktion |
| `4f2` | maß den alten Fall und zog die **erste** Aktionszeile | misst Band → Abschnitt; greift die gesäte Aktion über **`aktion-<id>`** |
| `4b5`-Frames | Projekt zu kurz für die Wartezeit | Messpunkt 275 statt 345, Wartezeit 200 ms |

**Die Lehren, alle teuer bezahlt:**

1. **Vor jeder Fenstermessung `npm run build`.** Der Durchlauf fährt `dist/`. Ich habe es einmal
   verletzt — der Treiber maß das **alte Bündel**, und der „Produktfehler" (ein Drop legte noch eine
   Unterbrechung an) war meiner. Dieselbe Regel stand schon in der vorigen Übergabe.
2. **Im Treiber Aktionen über die Kennung greifen, nie über die erste Zeile.** Welche Aktion oben
   steht, hängt an den Schritten davor; `4f2` meldete deshalb einen Fehler, den es nicht gab.
3. **Ein Projekt kann zu kurz für die Wartezeit sein.** `4b5` ist in dieser Sitzung **dreimal**
   gekippt: einmal lief die Uhr über das Projektende hinaus (Frame 360 von 360, das `<video>`-Element
   war weg, `paused` null), einmal lag „danach" mit Frame 245 **mitten im** Einschub (30 + 240 = 270).

### 22.7 Gegenproben

Drei, jede **rot** und **byte-identisch** zurückgenommen (Prüfsummen im Commit):

1. Integrationstest mit `gesamtFrames: frames` → `lauf.ok` falsch (der 228).
2. `normalisieren.ts` auf `frames` → „expected 120 to be 150".
3. Band-Zweig mit `false && istBandAktion(...)` → beide Band-Fälle rot.

Dazu eine **Diagnose-Probe** (kein Test, sondern eine Messung): volles `argv` + voller `stderr` je
ffmpeg-Lauf nach `SIGNAGE_FFMPEG_PROTOKOLL`, ohne die Variable verhält sich die Datei unverändert. Sie
hat den 228-Aufruf identifiziert und ist byte-identisch entfernt (`prozess.ts`, `eec0169d…`).

### 22.8 Offen

- **`einzel-instanz.spec.ts` (#289)** flaky — im Gate gefallen, einzeln 3/3 grün. Nicht behoben.
- **Altprojekte mit Unterbrechung < 8 s** (siehe 22.3) — kein Sonderfall gebaut.
- **Kein Issue offen.** `projects/lallala` bleibt (Nutzerdaten, nicht anfassen).

### 22.9 Nächster Schritt

Konzept Abschnitt 10 weiter: **Preset beim Anlegen** (Vorlage + Marke + Dauer vorbelegt), danach die
**Effekte** (Band fährt ein/aus, Motiv atmet, Übergang statt hartem Schnitt).

---

## 23. DER BAND-ABSCHNITT HAT KEINE DAUER-EINGABE MEHR (03.11.2026)

### 23.1 Die Entscheidung

**Niklas, 03.11.2026:** *„feste zeit weil es macht keinen sinn dafür eine zeit festzulegen"*.

Damit ist die Dauer eines **Band-Abschnitts** keine Nutzereingabe mehr. Sie folgt der
**Dauer-Kette des Produkts** (`AD 4.4`): die **eigene Standarddauer der Aktion**, sonst die
**projektweite Standarddauer**, sonst **10 s**. Das Eingabefeld im Band-Editor entfällt.

**Warum die Kette und nicht die Konstante 10:** Sie war beim Einfügen schon der Startwert
(`band-aufnahme.ts`, TK 9.7.7) — und sie ist die *eine* Dauerregel des Produkts. Eine Konstante
hätte eine zweite Wahrheit neben `AD 4.4` gestellt.

**Warum überhaupt ohne Eingabe:** Das Band läuft **parallel** zum Video und **wiederholt** sich,
wenn die Folge kürzer ist. Die Dauer eines Abschnitts ist damit nur das **Tempo der Rotation**;
eine je Abschnitt gesetzte Zeit müsste bei jeder Änderung der Standarddauer nachgezogen werden.

**Doku:** AD **v1.13** (4.5, eigener Absatz mit Begründung), TK **v3.36** (9.2.8 Zeitverhalten,
9.5.2 `setzeEinblendung`, 9.7.2 Bedienung, 9.7.7 „Dauer" statt „Startdauer", 9.11.3).
Die Bezugszeile des TK („Anforderungsdokument v1.11") stand seit zwei Versionen falsch und ist
auf **v1.13** gezogen.

### 23.2 Was gebaut ist

| Stelle | vorher | jetzt |
|---|---|---|
| `band-aufnahme.ts` | `startdauerFuerBandabschnitt` | **`dauerNachKette`** — eine Funktion für Unterbrechung **und** Band-Abschnitt |
| `einblendung-ansicht.ts` (`entwurfAus`) | kopierte die gespeicherte `dauer` | dritter Parameter `dauerFuer`; **jeder** Abschnitt bekommt die Kette |
| `einblendung-ansicht.tsx` | Textfeld je Zeile, `setzeAbschnittsDauer` | Feld weg; „hinzufuegen" nimmt die Kette statt der Konstante 10 |
| `einblendung-bearbeiten.ts` | `setzeAbschnittsDauer` | **gelöscht** (kein toter Export) |
| `band-overlay.tsx`, `composer/index.tsx` | — | reichen `standardSegmentdauer` durch |
| `reparatur-optionen.ts` (`schliesseAbschnittsFixAb`) | behielt die Dauer des kaputten Abschnitts | zieht die Kette der **neuen** Aktion |

**Der letzte Punkt war kein Beiwerk.** Er hätte sonst eine zweite Wahrheit erzeugt: repariert man
einen Abschnitt, stünde dort die alte Dauer — bis die Band-Bearbeitung das nächste Mal geöffnet
wird und sie überschreibt. Die **unbeteiligten** Abschnitte bleiben unangetastet; ein Fix soll
nicht das ganze Band verschieben.

**Verhaltensänderung, offen benannt:** Ein Altprojekt mit von Hand gesetzten Zeiten gleicht sich
beim **ersten Öffnen** der Band-Bearbeitung an die Kette an. Das ist gewollt — die Anzeige soll
zeigen, was geschrieben wird. Wer die alten Zeiten erhalten will, muss sie vorher sichern; ein
Sonderfall ist **nicht** gebaut.

### 23.3 Belege

- **Typecheck 0** (main/preload/renderer/**tests**), **ESLint + oxlint 0**, **Build 0**.
- **Unit 5452/5452** (360 Dateien). Neu: „die Zeile zeigt die Dauer aus der Kette, nicht die im
  Element gespeicherte Zahl" und „eine Abschnitts-Zeile hat KEIN Dauer-Eingabefeld mehr";
  der Ersetzen-Fall in `reparatur-optionen.spec.ts` prüft die Kette der neuen Aktion (22) **und**
  den Rückfall auf die projektweite (10).
- **Integration 51/51** (13 Dateien).
- **Treiber: 0 Befunde**, 1 Untersuchung (Mehrfachauswahl, Baseline), 1 MANUELL (Export-Dialog).
  `4f8` misst erneut: Band-Aktion → Abschnitt (`dauer: 10`), Ganzbild → Unterbrechung,
  Render mit Unterbrechung **12,022 s** bei Anzeige 0:12.

### 23.4 Befund: die .docx waren stehengeblieben

Beim Erzeugen fiel auf: `Anforderungsdokument_…docx` stand auf **Version 1.9**,
`Technisches_Konzept_…docx` auf **3.29** — während die `.md` bei 1.12/3.35 lagen. Die Word-Dateien
waren also seit mehreren Sitzungen **nicht** mitgezogen worden, obwohl die Regel „.md und .docx
synchron halten" im Projekt steht.

Beide neu erzeugt (`tools/generate-docx.js`, Staging, `unzip -t`, 0 Backticks, Absatz-Diff gegen
den alten Stand) und platziert. **Der Sprung in den Word-Dateien enthält deshalb auch die
Änderungen der Sitzungen davor** — nicht nur diese. Ab jetzt gilt: **wer die `.md` ändert, erzeugt
die `.docx` im selben Commit neu.** Word war beim Schreiben geschlossen, die Dateien frei.

### 23.5 Nachgezogen (Niklas: „ja" auf beide Punkte)

- **`system-design-context.md`:** Die Dauer-Regel steht jetzt in 9h („Die Dauer je Abschnitt ist
  keine Eingabe"). **Dabei aufgefallen:** 9h beschreibt weiter den **gestrichenen Split-Screen**
  (918er-Videospalte, 144-px-Restflächen, `vstack`). Die Sektion trägt jetzt einen Marker
  „Split-Screen ist gestrichen (29.10.2026)" — der Text darunter bleibt als Historie, ist aber als
  solche gekennzeichnet. **Wer 9h liest, baute sonst eine zweite Wahrheit.**
- **Drei geschlossene Issues kommentiert** (deren Signaturblock `setzeAbschnittsDauer` nennt):
  **#129** (M5-10), **#249** (M7-56, nur der Einordnungsblock), **#253** (M7-61). Die lokalen
  Volltexte in `docs/agents/m5/` und `docs/agents/m7/` tragen denselben Nachtrag — GitHub und
  lokale Datei sagen dasselbe.

### 23.6 Nächster Schritt

Konzept Abschnitt 10 weiter: **Preset beim Anlegen** (Vorlage + Marke + Dauer vorbelegt), danach
die **Effekte** (Band fährt ein/aus, Motiv atmet, Übergang statt hartem Schnitt).
