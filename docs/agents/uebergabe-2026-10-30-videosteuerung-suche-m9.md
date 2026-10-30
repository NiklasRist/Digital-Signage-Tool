# Übergabe 30.10.2026 – Videosteuerung, Projekt-Suche, Umbau-Entscheidung

**Diese Sitzung hat gebaut und entschieden, aber den Umbau selbst nicht angefasst.**

**Vorher:** [`uebergabe-2026-10-29-produktarbeit-442-449.md`](uebergabe-2026-10-29-produktarbeit-442-449.md).

---

## 1. Stand heute

| | Wert |
|---|---|
| Commits | **12 Produkt-Commits vor `origin/main`**, **nicht gepusht** (die Übergabe-Dokumente kommen als eigene Commits dazu) |
| Arbeitsbaum | sauber |
| Gate | `npm run pruefung` **Exit 0** (zuletzt nach der Suchleiste) |
| Unit | **5.389** Tests in **347** Dateien |
| Integration | **49** in 12 Dateien |
| Treiber | **0 Befunde** |
| Offene Issues | 21; neu: M9 mit #450–#454 |

**Die fünf Commits dieser Sitzung:**

| Commit | Inhalt |
|---|---|
| `5cc281a` | #443 Videosteuerung als Overlay mit Symbolen, Ton standardmäßig aus |
| `5e6d0c1` | Projekt-Suche (Name und Ordner) |
| `07fdd7f` | Treiber: Hover vor den Leisten-Klicks, Schritt für die Projekt-Suche |
| `627e530` | AD v1.10 / TK v3.31 + Pläne Marken und M9 |
| `a017657` | `bereitschaft.py`: geschlossene Issues, M9 |

---

## 2. #443 – Videosteuerung (GEBAUT, offen für Review)

Overlay über dem Bild statt fester Leiste darunter. Enthalten: Play/Pause (Knopf **und** Klick aufs
Bild), ±5 s, Position/Gesamt, Balken mit Scrubbing und Kapitelmarken, Tooltip `mm:ss:ff`,
Ton (Standard **aus**, Hinweis „Ausgabe bleibt stumm"), Vollbild, Ausblenden nach 3 s.

**Ehrlich offen:**
- Bei der **kleinsten Bühnenhöhe** (200 px im Treiberfenster) deckt die sichtbare Leiste rund ein
  Drittel. Sie verschwindet beim Abspielen; in der Pause bleibt sie beim Zeigen stehen.
- Die **Element-Nummern** sind weiter **0-basiert** (die Liste darunter zählt ab 1).
- Der **Ton** steht nur im Code-Kommentar (`video.tsx`), nicht in AD/TK. Bewusst: die *Ausgabe*
  bleibt still (TK 9.2.4), der Vorschau-Ton ist ein Hör-Behelf.
- **Tastatur** (Leertaste/Pfeile) ist nicht verdrahtet — eigener Schritt mit #387.

---

## 3. Projekt-Suche (GEBAUT)

`filtereProjekte` in `projekt-verwaltung/liste.ts` (rein), Suchfeld über der Liste, eigener
Leerzustand „Kein Projekt passt zu …". Sucht in **Name und Ordner**, Groß/Klein egal, Umlaute
werden **nicht** gefaltet. Treiber-Schritt 2 misst `3 -> 0 -> 3 Zeilen`.

---

## 4. Die Entscheidung des Tages (AD v1.10 / TK v3.31)

**Der Split-Screen ist gestrichen.** Das Werbeband liegt **deckend über** dem vollflächigen Video.

- **Vorlagen tragen keine Art mehr**: `höhe === null` = Ganzbild (1920 × 1080), Zahl = Band
  (162). Das Feld `art` entfällt, `VorlagenArt` ebenso.
- **Der Einfügeweg entscheidet**: Zeitleiste = Ganzbild, Bandliste = Band (sortierbar, sie loopt).
- **Anzeigenamen**: „Ganzflächig" (ID `vollbild`), „Zwei Spalten" (ID `split`).
  Die IDs bleiben — die Vorlage „Split" ist ein **zweispaltiges Ganzbild**, *nicht* die
  gestrichene Komposition. Diese Verwechslung hat die ganze Sitzung gekostet; sie steht jetzt
  an drei Stellen im TK.
- **Zonen-Namen** in einer Quelle: Hintergrund, Bild der Aktion, Abdunkelung, Logo,
  Überschrift, Beschreibung, Preis, Knopf.

**Wichtig – die Dokumente führen jetzt den Code.** Die App tut noch das Gegenteil: Sie kennt
`art`, `split.tsx`, die Bandgeometrie und die halbtransparente Einblendung. Bis M9 gebaut ist,
ist das **TK die Wahrheit, nicht das Fenster**.

---

## 5. M9 – „Ein Band, keine Art" (#450–#454)

| Issue | Inhalt | wartet auf |
|---|---|---|
| #450 | `contracts`: Art entfällt, `höhe` trägt die Geometrie (+ Render-Pfad) | — |
| #451 | `vorlagen-store`: zwei Ganzbild-Vorlagen + Band, neue Namen, **Migration** | #450 |
| #452 | `preview-player`: Split-Bauteil raus, Band deckend | #450 |
| #453 | `composer`: Einfügeweg entscheidet | #450–#452 |
| #454 | `renderer-gemeinsam`: Zonen-Namen aus einer Quelle | — |

## 6. Fünf Fallen für die nächste Sitzung

1. **`tools/bereitschaft.py` meldet für M9 „4 von 5 gebaut" — das ist FALSCH.** Es misst nur, ob
   die im Issue genannte **Datei existiert**; `vorlage.ts`, `split.tsx` und `eingebaut-vorlagen.ts`
   existieren, die Änderung ist aber nicht gemacht. **Wirklich baubar ist nur #454.** Die
   Werkzeug-Grenze steht in seinem eigenen Kopf („Grenze 1"), hier trifft sie den ganzen
   Meilenstein.
2. **#450 ohne #451 macht den Bestand unlesbar.** Die `vorlagen.json` auf der Platte trägt `art`
   und drei Vorlagen; sobald der Typ das Feld nicht mehr kennt, lädt sie nicht mehr sauber.
   Beide zusammen ausliefern.
3. **M9 entstand von Hand.** `tools/create-issues.py` hat kein **M9-Profil** und bricht bei
   unbekanntem Präfix absichtlich ab — wer Issues für M9 per Skript anlegen will, muss das Profil
   ergänzen.
4. **Der Treiber braucht vor jedem Klick auf die Bedienleiste ein Maus-Hover über die Bühne**
   (`zeigeBedienleiste()` in Schritt 4b3). Sonst klickt Puppeteer bei ausgeblendeter Leiste aufs
   Bild — und die Wiedergabe schaltet um.
5. **`bereitschaft.py` hat jetzt einen Zustandsfilter** (30.10.): geschlossene Issues zählen als
   erledigt und erscheinen nie als „bereit". Vorher standen vier längst geschlossene Issues als
   „bereit" in der Liste.

---

## 7. Erledigt am 30.10.2026 (GitHub)

- **#391** (Vollbild-Vorschau-Modus) **geschlossen**: Der Vollbild-Modus steckt in #443; ein
  eigenes `vollbild.tsx` wäre ein zweiter Player (TK 9.14.1). Die zwei offenen Punkte daraus
  (Warteschlangen-Leiste im Vollbild? Overlay oder Modus?) stehen als Notiz an #443.
- **#303** (Marken-Live-Vorschau) **geschlossen**.
- **#443** hat einen Kommentar „so gebaut"; **bleibt offen** bis zum Review am Fenster.

---

## 8. Offene Punkte ohne Bau

- **#449** (Marken-Editor: Elemente anklicken) — Review ausstehend. Der Umbau (Inspector, zwei
  Vorschauen, Reihenfolge der Arbeit) ist geplant in
  [`marken-editor-ui-2026-10-29.md`](marken-editor-ui-2026-10-29.md), **nicht gebaut**.
  Offen darin: Inspector ↔ Box (Entscheidung nach dem ersten Bau), `[Groß]`-Schalter,
  und wie der Vorlagen-Editor die Fläche wählt, ohne eine „Art" zu verlangen.
- **#446** FA-03-Ursache (12 Läufe grün, Ursache unbenannt).
- **#448** 192 `SAFETY`-Warnungen.
- **Beenden-Frist 15 s** aus der Sitzung vom 29.10. ist weiterhin vom Auftraggeber unbestätigt.

---

## 9. Nächste Schritte

1. **#454** bauen (unabhängig, klein, sofort sichtbar: `Ebene 1: hintergrund` → `1. Hintergrund`).
2. **#450 → #451** zusammen (Vertrag + Migration), dann #452, #453.
3. **#443 am Fenster reviewen**, danach schließen.
4. **Push** — nur auf Anweisung (12 Commits).
