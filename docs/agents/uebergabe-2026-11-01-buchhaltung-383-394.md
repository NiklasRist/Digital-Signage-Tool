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


