# Übergabe 01.11.2026 – Buchhaltung #383/#388/#393/#394 und die Lösch-Sperrgründe

**Sitzung 36.** Gearbeitet wurde am 01.11.2026. Vorher:
[`uebergabe-2026-10-31-bedienfluss-446-392-457.md`](uebergabe-2026-10-31-bedienfluss-446-392-457.md).

---

## 1. Stand heute

| | Wert |
|---|---|
| Commits | **6** vor `origin/main` (`9bba122`, `a94ec2e`, `72dea60`, `f13bc02`, `2f53521`, `103811a`) + Doku; **nicht gepusht** |
| Arbeitsbaum | sauber |
| Gate | `npm run pruefung` **Exit 0** |
| Unit | **5.359** Tests in **352** Dateien |
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

Vollständig: `statistik.tsx` gebaut, in `composer/index.tsx:827` montiert (`2a2f551`), Unit-Test
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
- **Offen, benannt:** `galerie-bereich.tsx`, `asset-galerie.tsx` und `bibliothek-dock.tsx` sind
  jetzt **ohne Nutzer**. Löschen erst mit den sieben Test-Mocks (eigener Schritt).

## 9. Nächster Schritt

**Es ist kein Issue mehr offen.** Die nächste Arbeit ist eine **Entscheidung**, kein Bau:

1. **Rest der 21.10.-Richtung:** Soll der **Aktions-Editor aus dem Projekteditor** ohne
   Reiterwechsel erreichbar sein (Overlay wie der Marken-Editor)? Und in welcher Form kommt der
   **Bild-Import** (Feld im Editor, kleiner Dialog, Datei-Drop)?
2. **Navigationsfrage aus #374:** Aktionen-Editor als Overlay über der Reiterfläche — dann neues
   Issue mit eigenem Zuschnitt (Reiterleiste, Projektleiste, Überlagerung).
3. **Layout-Frage Welle 1:** Plan sagt „Video mittig", gebaut ist „Bühne oben". Entscheiden.
4. **Kleinigkeit mit Ansage:** die drei toten Galerie-/Dock-Dateien löschen (mit den Test-Mocks).
5. **Zwei unbestätigte Zahlen:** Beenden-Frist 15 s und der #456-Signaturblock.

**Sicherheit (71 Dependabot-Lücken) ist nachrangig, solange der MVP nicht steht** — Ansage
Niklas, 01.11.2026.
