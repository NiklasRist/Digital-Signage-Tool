# Übergabe 30.10.2026 – Marken-Ansicht und Streichung des Reiters

**Diese Sitzung hat #443 abgenommen, #455 gebaut und den Reiter [Marken] abgeschafft.**

**Vorher:** [`uebergabe-2026-10-30-zonen-texte-m9.md`](uebergabe-2026-10-30-zonen-texte-m9.md).

---

## 1. Stand heute

| | Wert |
|---|---|
| Commits | **23 vor `origin/main`**, **nicht gepusht** |
| Arbeitsbaum | sauber |
| Gate | `npm run pruefung` **Exit 0** |
| Unit | **5.280** Tests in **346** Dateien |
| Integration | **50** in **13** Dateien |
| Treiber | **0 Befunde** |
| Reiter | **vier** (Zusammenstellen, Aktionen, Vorlagen, Projekte) |

**Die Commits dieser Sitzung (auf `b6f0042` aufbauend):**

| Commit | Inhalt |
|---|---|
| `c15f135` | #455 – Marken-Editor mit Inspector, Reihenfolge der Arbeit, Erklärungsschicht |
| `21b5f38` | AD v1.11 / TK v3.32 – Reiter [Marken] entfällt |
| `ffa02dc` | #456 – Reiter entfällt, Projektleiste, Marken-Ansicht |
| `ac5e8fb` | #456 – kein Marken-Knopf, der Markenname ist der Einstieg |
| `c13d288` | #456 – der Markenname ist ein Umschalter (Rückweg ins Projekt) |

---

## 2. #443 abgenommen und geschlossen

Review am Fenster ohne Befund. Das Issue ist **zu** (Freigabe „abgenommen", 30.10.2026).
Die zwei offenen Punkte aus #391 (Warteschlangen-Leiste im Vollbild, Overlay oder eigener Modus)
sind mit dem Issue geschlossen — sie waren als Notiz an #443 geführt.

---

## 3. #455 – Marken-Editor mit Inspector (GEBAUT, `c15f135`)

- **Palette und schwebende Box entfallen.** Der Inspector rechts zeigt immer genau eine Sache:
  das gewählte Element oder die **Reihenfolge der Arbeit** (sechs Stufen).
- **Erklärungsschicht** `rollen-texte.ts`: Name **und ein Satz** je Farb-/Schriftrolle, sichtbar
  unter dem Regler. Die Sätze sagen auch, was die eingebauten Vorlagen **nicht** benutzen — das
  ist **gemessen** und im Test an `eingebauteVorlagen()` gekoppelt (7 von 13 Farben, 2 von 4
  Schriften).
- **Drei feste Vorschauen über die ID**: `vollbild`, `split`, `band-standard`. Über den Namen zu
  suchen war der Fehler, den M9 still zugeschaltet hat.
- **`[Groß]`** blendet Kopfzeile und Inspector aus; **ESC** und **Klick ins Leere** heben die
  Auswahl auf. ESC wirkt **nur im sichtbaren Reiter** (besuchte Reiter bleiben montiert, TK 9.14.2
  — ohne die Schranke wäre ESC ein unsichtbarer zweiter Tastenweg, #387).
- **Entschieden (Niklas, 30.10.):** Die Vollflächen-Zone `hintergrund` verliert ihre **Klickfläche**
  (Weg B) — sonst fängt sie jeden Klick ab und es gäbe kein „daneben". Sie bleibt **Element** und
  ist über Stufe 2 „Flächen" erreichbar. Die Regel hängt an der **Fläche** (deckt das ganze Bild),
  nicht an der Kennung.

### Was an #449 NICHT nachgebessert wurde — und warum

Vor dem Bau von #455 mechanisch geprüft, drei DoD-Lücken in #449:

| DoD-Punkt (#449) | Befund |
|---|---|
| „ESC schließt sie" | **fehlte** — im ganzen Renderer gab es keinen `keydown`-Handler |
| „Klick daneben schließt sie" | **strukturell tot** — `hintergrund` (0,0,1920,1080) fing jeden Klick ab |
| Kopfzeile mit Ableiten/Löschen/Speichern | **teilweise** — Ableiten lag in der linken Spalte, ein Speichern-Knopf existierte nie |
| Treiber „Box öffnet sich" | **fehlte** |

**Nicht nachgebessert:** Der Plan `docs/agents/marken-editor-ui-2026-10-29.md` ersetzt die Box
durch den Inspector; Feinarbeit an einer Form, die verworfen wird, wäre verbrannt. #449 ist
**weiterhin offen** — entscheiden, ob es geschlossen oder in #455 überführt wird.

---

## 4. #456 – der Reiter [Marken] entfällt (GEBAUT, `ffa02dc` + `ac5e8fb` + `c13d288`)

**Entscheidung (Niklas, 30.10.2026):** Marken werden **nur noch aus einem geöffneten Projekt**
bearbeitet. Der **Bestand bleibt app-weit** — eine Marke darf von **n** Projekten genutzt werden.
**Keine Migration**: Am Datenformat ändert sich nichts. Alle bestehenden Projekte wurden auf
Freigabe gelöscht (2 Projekte, 512 MB, `projects/` ist leer).

- **Vier Reiter.** `ReiterId` kennt `'marken'` nicht mehr; `istGueltigerReiter('marken')` ist
  `false`. `undo-historien.ts` hat den Fall verloren.
- **`projektleiste.tsx` (neu)** über jedem Reiter, solange ein Projekt offen ist: Projektname,
  Standardmarke (über die **bestehende** Operation `wechsleStandardMarke` — kein zweiter
  Schreibweg) und der **Name der gewählten Marke**.
- **Kein `[Marken]`-Knopf.** Der **Name** öffnet den Editor **genau dieser Marke**
  (`aufMarken(markeId)`). Zweiter Klick = zurück ins Projekt (**Umschalter**).
- **Der Editor ist eine Ansicht über der Reiterfläche**, kein Reiter: Die besuchten Reiter bleiben
  **montiert** und nur verdeckt. Jeder Reiterklick — auch ein **programmatischer** Wechsel — und
  „Zurück zum Projekt" schließen sie.
- **Kontext:** Der Editor bekommt `projektId`, `startMarkeId` und die **Aktionen des Projekts** und
  zeigt „In diesem Projekt: N Aktionen" (gezählt aus `Aktion.markeId`, nichts nachgerechnet).
- **Ausdrücklich unberührt:** Der Wechsel der Projekt-Standardmarke bleibt in der Projektverwaltung
  und funktioniert **ohne** geöffnetes Projekt — er ist der Ausweg aus der Lösch-Sperre (TK 9.15.1).

### Abweichung vom Issue-Text (gemeldet, nicht still gelöst)

Der Signaturblock in #456 nennt `projektId: string`. Für „in diesem Projekt verwendet" reicht eine
Kennung nicht — der Editor braucht die Aktionen. Gebaut ist zusätzlich
`aktionen: readonly { titel; markeId }[]`. Der Issue-Text ist **nicht** nachgezogen (GitHub-Schreib-
aktion, nicht freigegeben).

---

## 5. Der Befund aus dem Gate: die Leiste kostet Höhe

Der erste Lauf nach `ffa02dc` war **rot**: zwei `Befund` beim Drop auf das Video und einer beim
Löschen-Knopf der Aktionsliste. Ursache gemessen, nicht geraten:

> Im Treiberfenster (**800 × 572**) schob die 30-px-Projektleiste bei `BUEHNE_OBEN.minHeight: 200`
> die Zeitleiste des Composers aus dem Bild. **Gegenprobe:** Leiste per `display:none` ausgeblendet
> → beide Fälle grün (`EXIT=0`).

**Behoben mit zwei Schritten:**

1. Die Leiste ist flach: `minHeight: 22`, `fontSize: 11`, kein vertikales Padding.
2. `BUEHNE_OBEN.minHeight` **200 → 160** (`inhalte.tsx`). Die Bühne behält ihren Anteil von 38 %.

**Merksatz für die nächste Sitzung:** Wer der Oberfläche dauerhaft Höhe hinzufügt, muss den
Composer nachmessen. Das Gate fängt es — aber nur, weil der Treiber bei 800 × 572 läuft.

---

## 6. Gegenproben (jede Datei vorher/nachher per `shasum`, byte-identisch zurückgenommen)

**#455 (6):** Klickflächen-Filter entfernt · ESC-Hörer entfernt · ESC-Schranke für unsichtbare
Reiter entfernt · Rollen-Knöpfe der Stufen entfernt · leere Suche filtert statt durchzureichen ·
Vorschau ignoriert die Vorlagen-ID.

**#456 (4 + 1):** Reiterklick schließt die Ansicht nicht · **programmatischer** Reiterwechsel
schließt sie nicht · Ansicht ohne Slot bleibt sichtbar · „Zurück" meldet nicht · Projektfilter der
Verwendung entfernt.

**#456-Nachtrag (1):** Umschalter entfernt → der Test „zweiter Klick führt zurück" rot.

**Ehrlich benannt:** Die erste Fassung der Reiterklick-Probe blieb **grün** — mein Test deckte nur
den Klickweg, nicht den programmatischen Wechsel. Test ergänzt, danach rot. Ebenso war die erste
Fassung des Deckend-Tests in M9 wertlos (dort schon vermerkt).

---

## 7. Fallen für die nächste Sitzung

1. **`reiter-marken` existiert nicht mehr.** Wer es sucht (Treiber, Tests, Doku), findet es nicht:
   Der Einstieg heißt `projektleiste-marke-oeffnen` und ist ein **Umschalter**.
2. **Der Treiber darf nicht zweimal „öffnen".** Er prüft jetzt `rahmen-inhalt-marken`, bevor er
   klickt — sonst schließt der zweite Klick. An einer Stelle (4a2) klickte er vorher doppelt.
3. **Der Marken-Editor hat vier Pflichtfelder**: `marken`, `vorlagen`, `startMarkeId`, `projektId`,
   `aktionen`, `aufZurueck`. Wer ihn ohne sie rendert, bekommt einen Laufzeitfehler
   (`aktionen.filter` auf `undefined`).
4. **`hintergrund` ist keine Klickfläche mehr.** Wer die Zonen-Tabelle aus #449 liest, findet dort
   das Gegenteil — der gebaute Code gewinnt, der Widerspruch steht hier.
5. **Die Bühnenhöhe ist jetzt 160.** Wer sie wieder anhebt, bricht den Composer bei 800 × 572.
6. **`findeVorschauVorlage` heißt `findeVorlage(vorlagen, id)`.** Der Name ist weg, nicht nur
   umbenannt: Die Signatur hat ein Argument mehr.

---

## 8. Offene Punkte ohne Bau

- **#449** — Box und Palette sind durch #455 ersetzt. Schließen oder überführen: **Entscheidung
  offen**.
- **#453** — Treiber-Schritt „Aktion auf die Zeitleiste = Segment, Aktion an die Bandliste =
  Abschnitt" fehlt weiterhin (DoD nicht erfüllt).
- **#446** — FA-03-Ursache (12 Läufe grün, Ursache unbenannt).
- **#448** — 192 `SAFETY`-Warnungen.
- **Flächen-Beschriftungen** im Vorlagen-Editor sind der Vorschlag aus #453 und **unbestätigt**.
- **Beenden-Frist 15 s** aus der Sitzung vom 29.10. ist weiterhin unbestätigt.

---

## 9. Nächste Schritte

1. **#456 am Fenster abnehmen**: Projekt öffnen → Name in der Leiste klicken → Marke bearbeiten →
   „Zurück zum Projekt" → Standardmarke wechseln → Name erneut klicken (muss die andere Marke
   öffnen). Danach schließen (auf Anweisung).
2. **#449 entscheiden** (schließen oder in #455 überführen).
3. **#453-Treiber-Schritt** bauen.
4. **Push** — nur auf Anweisung (23 Commits).

---

## 10. Nachtrag noch am 30.10.2026: #456 bekommt Symbole, Abnahme erfolgt

**Anlass (User, wörtlich):** „also fürs erste geht das aber es sollten icons sein und die position
der buttons ist müll #456" — nachgefragt: **„minimaler text aber es braucht symbole und beide"**.

**Gebaut (`060abe1`), beide Stellen:**

| Ort | vorher | jetzt |
|---|---|---|
| Projektleiste | `Fitnessworld24  Standardmarke [ … ▾]` … `Fitnessworld24` (unterstrichen, `marginLeft:auto`) | `Fitnessworld24 · Marke [ … ▾] ✎` |
| Marken-Kopfzeile | `[Zurück zum Projekt]` … `[Groß] [Löschen]` | `[←] Name … [⤢] [🗑]` |

- Der **Name stand zweimal** in derselben 22-px-Zeile; Wahl und Einstieg waren getrennt. Jetzt sitzt
  der Stift direkt hinter der Klappliste, und offen wird dasselbe Feld zum **Pfeil zurück**.
- „Standardmarke" ist nicht mehr sichtbar; es ist der `aria-label` der Klappliste. Sichtbar bleibt
  **ein** Wort: „Marke".
- **Bewusst Text geblieben:** „Löschen bestätigen" — ein zweiter Papierkorb hieße „nochmal
  dasselbe".
- **Neue Quelle:** `src/renderer/gemeinsam/symbole.tsx` (5 Piktogramme + `SymbolKnopf`).
  `preview-player/symbole.tsx` (#443) bleibt unberührt.
- **Abgelöst, offen benannt:** Die Entscheidung vom selben Tag („der Markenname ist der Einstieg,
  kein eigener Knopf") gilt nicht mehr. `ProjektleisteProps` ist unverändert.

**Belege:** Gate `npm run pruefung` **Exit 0** — Unit **5.288 (347 Dateien, +8)**, Integration 50
(13), Treiber 0 Befunde, Lint 0. **6 Gegenproben**, jede rot und byte-identisch zurückgenommen.
**25 Commits** vor `origin/main`, nicht gepusht.

**#456 ist am Fenster abgenommen** („passt"). Offen bleibt: **#449 entscheiden**, der
**#453-Treiber-Schritt**, und ein Befund ohne Bau — die **Lösch-Sperrgründe** erscheinen mitten in
der Kopfzeile (älter als #456).

**Nachgetragen am selben Tag:** #449 ist **geschlossen** (`not planned`) — durch #455 ersetzt, die
zwei Abweichungen (kein Klick auf `hintergrund`, Palette → „Weitere Rollen") stehen im
Abschlusskommentar. Der **#453-Treiber-Schritt** ist gebaut (`6295605`): 4f belegt
`art: "segment"` aus dem Store, 4f6 belegt den Band-Abschnitt. Gate weiter **Exit 0**.
