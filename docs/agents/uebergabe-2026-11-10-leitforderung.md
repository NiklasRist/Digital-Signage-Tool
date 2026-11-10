# Übergabe 10.11.2026 — Leitforderung L-01: schneller, einfacher, besser als PowerPoint (sechsundfünfzigste Sitzung)

**Vorgeschichte:** [`uebergabe-2026-11-09-effekte-render.md`](uebergabe-2026-11-09-effekte-render.md)
(55. Sitzung: Effekte vom Bildplan bis zum gemessenen Video; FA-21 nachgezogen).

---

## 1. Der Anlass

Niklas, 10.11.2026:

> „die anforderungen sind aktuell an dem punkt dass der output schneller und einfacher zu erstellen
> sowie qualitativ besser sein muss als eine gute powerpoint"

und

> „das war definitiv nicht die letzte muss lücke. ich habe die anforderungen falsch erstellt."

Die alte AD war ein **Funktionskatalog** (FA-01…FA-25). Sie prüft, **ob** etwas existiert. Sie prüft
nicht, ob das Ergebnis die Arbeit **besser macht** als das Werkzeug, das ersetzt wird. Die
Treiber-Matrix ist nur eine Belegkarte für diese FA — **keine** Produktabnahme.

## 2. AD v2.0 (Commit `e11c40d`)

Neu in `docs/Anforderungsdokument_Digital-Signage-Tool.md`:

| Stelle | Inhalt |
|---|---|
| **1.1 L-01** | Die oberste Leitforderung: Output **schneller, einfacher, qualitativ besser** als eine gute PowerPoint mit Masterfolie. |
| **FA-26 / 4.11** | **Varianten** (Muss, neu): eine Aktion trägt mehrere benannte Varianten aus Look, Effekt-Satz und optional Bildausschnitt/Akzentfarbe; **manuell** gewählt, mindestens 3 je Aktion, Wechsel ≤ 1 Klick. |
| **12.1** | Abnahme L-01: Referenzaufgabe, Stoppuhr, PowerPoint-Baseline, A/B-Qualitätsvergleich. |
| **14** | Heuristik-Bogen: 12 Kriterien, je 0/1/2 (max. 24); Tool ≥ 20/24, PowerPoint ≤ 14/24. |
| **Glossar** | L-01, Designarbeit, Variante. |

**Die Messlatte (wörtlich aus 1.1):**

| Teil | Zusage |
|---|---|
| Erstellung | Ein Angebot **inklusive Designarbeit** (Look/Variante, Bild, Farbe, Effekt) in **≤ 5 min** |
| Änderung | Preis/Bild/Text in **≤ 1 min**, **ohne Renderzeit** |
| Varianten | **manuell**, ≥ 3 je Aktion, Wechsel ≤ 1 Klick |
| Zwischenwerbung | **3 Band-Spots + 2 Unterbrecher in 15 min**, ein MP4, keine Naht |
| Länge | **15–30 min pro Projekt**; der Stick darf **mehrere MP4s** enthalten |
| Qualität | Besser als die PowerPoint-Referenz nach **12 Heuristiken** |

**Korrektur aus der Sitzung:** Die 5 Minuten gelten **inklusive Designarbeit** — nicht „ohne". Das
war der einzige Punkt, den Niklas an der ersten Fassung geändert hat.

**Ein Projekt – ein Video bleibt.** FA-01/4.9 ist **unverändert**. Die mehreren MP4s auf dem USB-Stick
entstehen aus mehreren Projekten/Ausgaben (FA-22); jede Datei ist für sich loopbar. Sie werden nicht
zu einem Projekt zusammengefasst.

**AD `.docx`** im selben Commit neu erzeugt: **500 Absätze**, `unzip -t` heil, 0 Backticks, ein Bild.
**TK bleibt v3.58** — L-01/FA-26 sind dort noch nicht ausgeschrieben. Das ist Issue **#465**.

## 3. Die Abnahme (12.1 + 14)

- **Projekt A:** 15-min-Video, 5 Angebote, 3 Band-Spots, 2 Unterbrecher.
- **Projekt B:** 10-min-Video, 3 Angebote.
- Beide rendern, beide MP4s auf denselben USB-Stick.
- In Projekt A: ein neues Angebot **inklusive Designarbeit** in ≤ 5 min; danach einen Preis in
  ≤ 1 min ändern (ohne Renderzeit).
- **Qualität:** 5 Angebote gegen 5 PowerPoint-Folien, Etiketten A/B, 12 Kriterien, 0/1/2.
  Bewertung durch Niklas; Familie und Freunde können denselben Bogen ausfüllen, die Bögen werden
  **einzeln** berichtet.
- **Startwerte:** Tool ≥ 20/24, PowerPoint ≤ 14/24; das Tool gewinnt bei „Bewegung" und
  „Differenzierung" und verliert nicht bei „TV-Lesbarkeit" und „Markentreue".
- **Die PowerPoint-Referenz** wird einmal echt gebaut und gestoppt. Ohne sie ist „schneller und
  besser" nicht belegbar.

## 4. Was das für die Matrix bedeutet

Die Treiber-Matrix (`docs/agents/treiber-matrix.md`, Stand 09.11.2026) führt **12 gemessen, 9
teilweise, 3 manuell**; bei den Muss **9 gemessen, 5 teilweise, 1 manuell**. Sie misst aber die
**alten FA**, nicht L-01. Sie ist ab jetzt eine technische Belegkarte, **nicht** die Abnahme.

FA-21 ist seit dem 09.11.2026 **gemessen** (Commit `e37338a`): Der Vorlagen-Editor hatte die
Undo-Logik, aber keinen Aufrufer; jetzt wählen Pfeile und Cmd+Z den **wirksamen Bereich** (offene
Ansicht vor Reiter), und der Treiber-Schritt `4n` misst Zone → Undo-Pfeil → Shift+Cmd+Z. TK **v3.58**,
11 Unit-Fälle, zwei Gegenproben.

## 5. Die Issues dieser Sitzung

- **#465** — `[doku] TK v3.59: L-01 und FA-26 – Varianten, Auswahl, Speicherweg, Abnahme`.
  Entscheidungs-Issue, **keine Signatur**: Datenmodell, Auswahl, Zeichnen, Speicherweg, Undo,
  Migration und Fehlerpfade werden zuerst im TK entschieden. Offene Punkte im Issue.
- **#466** — `[abnahme] PowerPoint-Baseline und L-01-Referenzlauf`.
  Mess-Issue, **keine Signatur**: PowerPoint-Referenz bauen und stoppen; Tool-Referenzlauf messen;
  12 Kriterien bewerten; Protokoll schreiben. Keine Produktivdatei.

#466 verweist auf #465; #465 hat den Gegenverweis als Kommentar.

## 6. Was gebaut und gemessen ist — und was nicht

**Gebaut und gemessen (09.11.2026):**

- FA-21 (Commit `e37338a`): Undo/Redo im Vorlagen-Editor; 11 Unit-Fälle, Treiber `4n`, TK v3.58.
- Gate: Unit **5741/5741** (373 Dateien), Integration **54/54**, Build 0, Typecheck 0 (auch tests),
  ESLint/oxlint 0 (eine bestehende Warnung in `scripts/beleg-effekt-render.mjs`), Treiber
  **0 Befunde** (zwei Läufe).

**Nicht gebaut / nicht gemessen:**

- **FA-26 Varianten fehlt vollständig.** Heute hat eine Aktion einen Look und einen Effekt-Satz.
- **Der 5-Minuten-Flow inklusive Designarbeit ist unbelegt.** Der Action-Editor hat sechs Schritte;
  ob er in 5 Minuten inkl. Design bedienbar ist, weiß niemand.
- **Die 1-Minuten-Änderung ist unbelegt.**
- **Die L-01-Abnahme ist nicht gelaufen.** Es gibt keine PowerPoint-Baseline und keinen
  Tool-Referenzlauf.
- **Die App erfüllt L-01 damit nicht.** Das ist keine Vermutung, sondern der Stand.

## 7. Ehrlich offen

- **#458** (Effekt-Entscheidung) ist noch offen und überholt — die Entscheidung ist mit #459–#464
  gebaut. Schließen erst auf Anweisung.
- **71 Dependabot-Findings** (33 high, 25 moderate, 13 low), nicht angefasst.
- `einzel-instanz` (#289) flaky.
- Der Treiber rendert das 70-s-Projekt zweimal (~2× 70 s); das ist teuer, aber korrekt.
- `protocolTimeout` im Treiber steht auf 900 s (Werkzeugeinstellung, kein Produktverhalten).

## 8. Nächster Schritt

1. **#466:** PowerPoint-Baseline bauen, stoppen, bewerten; Tool-Referenzlauf als Ist-Stand messen.
2. **#465:** TK v3.59 entscheiden und schreiben (Datenmodell Varianten, Auswahl, Speicherweg, Undo,
   Migration, Fehlerpfade).
3. Danach Bau-Issues für FA-26 und den 5-/1-Minuten-Flow schneiden.
4. Erst dann L-01 erneut messen und „schneller/besser" behaupten.

## 9. Stand

**3 Commits** vor `origin/main` (die 28 Commits davor wurden am 09.11.2026 gepusht:
`1569d36..1764274`):

- `e37338a` — FA-21: Undo/Redo im Vorlagen-Editor verdrahtet
- `e11c40d` — AD v2.0: Leitforderung L-01
- dieser Übergabe-Commit

Arbeitsbaum sauber, **nicht gepusht** — Push nur auf Anweisung.
