# Übergabe 11.11.2026 — Vom Logo zur Messlatte: die Baseline wird genommen, nicht gebaut (siebenundfünfzigste Sitzung)

**Vorgeschichte:** [`uebergabe-2026-11-10-leitforderung.md`](uebergabe-2026-11-10-leitforderung.md)
(56. Sitzung: L-01, AD v2.0, Issues #465/#466 — die Anforderung ist gestellt, gebaut ist sie nicht).

---

## 1. Der Anlass und eine Korrektur

Die Sitzung begann mit dem Auftrag, `#466` zu klären: die **PowerPoint-Baseline** für die
L-01-Abnahme. Ich habe dreimal in dieselbe falsche Richtung gearbeitet — erst „eine gute PowerPoint
bauen", dann „Template plus Markenmaster", dann „ein fertiges Template füllen". Niklas hat es zweimal
korrigiert:

> „es macht keinen sinn wenn ich eine gute powerpoint baue. es gibt so viele fertige präsentationen
> die gut sind in power point außerdem wäre das 3-5 stunden arbeit um am ende etwas mittelmäßiges zu
> haben"

> „nimm gute powerpoints als vorlage weil das gilt es zu übertreffen"

**Die Messlatte sind fertige, gute PowerPoints. Sie werden genommen, nicht gebaut.** Eine selbst
gebaute Referenz wäre ein Strohmann: das Tool gewänne gegen etwas, das niemand so einsetzen würde.

## 2. #467 — das echte Logo ist gebündelt (TK v3.59, `6893b53`)

**Der Befund: der Code widersprach dem TK.** TK 9.15.1 (Nachtrag v3.11) sagt wörtlich: *„Auch die
EINGEBAUTE Marke startet mit `logo: null` … Ein Logo wird nicht mitgeliefert … wer dort einen Zweig
‚gebündeltes Logo' baut, baut toten Code."* Gebaut war das Gegenteil: `anfangsbestand.ts:52` trug
`logo: { datei: 'logo-fitnessworld24.png', herkunft: 'gebuendelt', seitenverhaeltnis: 3.5 }`, und im
Bundle lag ein **503-Byte-Platzhalter** („dunkler Balken mit Primärfarb-Streifen").

Nur diese eine Stelle wich ab — `erstelle-marke.ts:89` setzt für **neue** Marken korrekt
`logo: null`. Deshalb fiel es bei Partner-Marken nie auf.

**Entscheidung Niklas, 10.11.2026:** Der Code bleibt, das TK wird nachgezogen.

**Gebaut:** Das echte Website-Logo (`static.wixstatic.com/media/56c717_54a0190a…`, 735 × 253, RGBA,
orange `#F8971D` auf `#231F20`) ist auf ein **weißes Trägerfeld** gesetzt: 840 × 240, Eckenradius 20,
Logo mittig 24 px eingerückt, außerhalb transparent. **Das Seitenverhältnis bleibt 3,5** — damit
bleiben alle neun Logo-Zonen und `Marke.logo.seitenverhaeltnis` unverändert; **kein Code-Pfad, keine
Vorlage, kein Test** wurde angefasst.

**Das Trägerfeld steckt im ASSET, nicht in einer Zone.** Erst wollte ich es in die neun eingebauten
Vorlagen schreiben — Niklas hat das mit einem Satz erledigt: *„dir ist schon klar dass es
unterschiedliche logos gibt … no! different companies have different logos"*. Vorlagen sind
markenneutral; eine zweite Marke bekäme ein Feld aufgezwungen, das zu ihrem Logo nicht passt. TK
9.11.1 sagt es seit je: „der dunkle Balken ist im Logo-Asset **enthalten**".

**Fensterbeleg mit Gegenprobe** (Logozone 96/54 in der Vorschau, `scripts/schau.mjs`):

| | neues Asset | Platzhalter |
|---|---|---|
| weiß | **82,2 %** | 0,0 % |
| orange | **3,2 %** | 0,0 % |
| schwarze Tinte | 5,4 % | 86,2 % |
| rot | – | 1,7 % |

Dafür musste der **Datenort** vorübergehend die gebündelte Marke tragen: in Niklas' `marken.json`
steht ein **importiertes** `logo.jpeg` (`herkunft: "importiert"`, Verhältnis 1), das die Vorgabe
überschreibt — richtig so, aber es heißt: der Beleg gilt für den Vorgabewert. `marken.json` und
`config.json` sind danach **byte-identisch** zurück (SHA-256 vorher = nachher).

**TK v3.59:** 9.10.10, 9.11.1, 9.15.1, 9.15.3 korrigiert; der v3.11-Punkt 4 im Anhang als
**überholt** markiert. `.docx` 2653 Absätze, 0 Backticks, zwei Bilder.

**Bekannte Werkzeuggrenze:** `tools/bereitschaft.py` meldet **0 UNKLAR**, weil ein **geschlossenes**
Issue unabhängig von der Dateizeile als gebaut zählt. Ein Widerspruch zwischen Doku und gebautem Code
wird von diesem Werkzeug **nicht** gefunden — dieser hier stand über Monate.

## 3. #468 — FA-26 in die Treiber-Matrix (`06e6eab`)

Beim Bauen fiel ein **roter Test** auf: `tests/unit/treiber-matrix.spec.ts` meldete
`fehlend: ['FA-26']` — AD v2.0 hatte eine Nummer eingeführt, die die Matrix nicht kannte. **Vorbestehend**,
per `git stash`-Probe auf `HEAD` belegt (identisch rot), nicht aus dieser Sitzung.

Gebaut: eine Zeile `| FA-26 | … | - | … | Luecke |` und `toBe(25)` → `toBe(26)`. **Die Zählung im
Abschlussblock war schon vorher falsch** — der Text sagte „9 x teilweise" bei 10 Zeilen und
„4 teilweise" bei den Soll bei 5. Neu gezählt (per Skript gegen die Tabelle):
**12 gemessen, 10 teilweise, 1 Lücke, 3 manuell; 16 Muss, 10 Soll.** Gate wieder **5741/5741**.

**Ein Fehler auf dem Weg, offen:** Mein erster Edit hat die FA-25-Zeile **ersetzt** statt ergänzt.
Sofort korrigiert; `diff` gegen `HEAD` belegt, dass FA-25 byte-identisch unverändert ist.

## 4. #465 — TK v3.60: Varianten (FA-26) und die L-01-Abnahme (`9615d1d`)

Neu **9.17** mit neun Unterabschnitten (Datenmodell, Auflösung, Zeichnen, Auswahl, Speicherweg/Undo,
Grenzen, Fehlerpfade, „was nicht passiert") und **9.18** für die Abnahme.

**Drei der fünf im Issue gestellten Fragen waren keine** — die AD beantwortet sie:
- `aktiveVarianteId` gehört an die **Aktion**: AD 4.11 wörtlich „gilt für die **Aktion** an allen
  Stellen im Video (dieselbe Aktion sieht überall gleich aus, 4.10)".
- **Keine Vorbelegung**: „Der Nutzer legt Varianten an …" und „Fehlt eine Variante, gilt die Aktion
  wie bisher".
- **Feld an der Aktion, keine eigene Entität**: wie `zonenGestaltung`, `bildAusschnitt`, `effekte`.

**Eine Auslegung, offen benannt:** FA-26 „mindestens 3 je Aktion" ist als **Fähigkeitszusage** gelesen,
nicht als Pflicht zur Vorbelegung. Die Gegenlesart widerspräche zwei Sätzen derselben Anforderung. Die
Drei wird in 9.18 **gemessen**.

**Befund aus dem Code:** `pruefeVorlagenReferenzen` kennt **zwei** Referenzarten und warnt im
Kommentar ausdrücklich vor der vergessenen dritten („Wer nur Aktionen prüft, hält sie fälschlich für
unbenutzt"). Mit `varianten[].vorlagenId` entsteht sie. 9.12.1 ist an **beiden** Stellen auf **drei**
gezogen.

**Drei Zitatfehler, gefunden und behoben.** Mehrere Stellen waren als „AD 4.11 wörtlich" ausgegeben:
(1) „Eine Variante ist eine benannte, gespeicherte Kombination aus:" war meine Paraphrase und stand so
nicht im AD; (2) bei „wählt sie manuell aus" fehlte die Auszeichnung `**manuell**`; (3) bei „sieht
überall gleich aus" fehlte „, 4.10". Danach: **9 von 9** Zitaten (AD 1.1/4.11/12.1/14) per Skript
gegen das AD geprüft.

## 5. AD v2.1 / TK v3.61 — die Baseline wird genommen (`2e6979f`)

AD 12.1 sagte wörtlich: *„Die PowerPoint-Referenz wird einmal echt **gebaut** und gestoppt: gute
Masterfolie, dieselben 5 Angebote, dieselben Bilder, derselbe Export."* Damit stand #466 im
**Widerspruch zur Anforderung** — und in diesem Projekt gewinnt die Doku.

**Die beiden Referenz-Decks** (beide frei, beide **markenfremd**):

| Deck | Quelle |
|---|---|
| **Fitness Studio** (beige/orange, harte diagonale Schnitte, Studiofotos) | `presentationgo.com/presentation/fitness-studio-presentation-template` |
| **Salerio** (dunkles Foto, oranges Dreieck, klare serifenlose Schrift; 4,1/1094) | `slidescarnival.com/template/salerio-free-presentation-template/1875` |

**Die Markenfremdheit ist gewollt** (Niklas: *„markenfremdheit ist egal weil das markenunabhängig sein
soll"*). Folge für zwei Kriterien: **Markentreue** heißt hier „das Deck hält eine **eigene**,
durchgehaltene visuelle Identität durch" (AD 14 ergänzt); **Konsistenz** bleibt unverändert.

**Eine Zahl steht zur Disposition:** AD 12.1 nennt „PowerPoint ≤ 14/24". Das gilt für eine
mittelmäßige Folie — **diese** Decks erreichen eher 17–20/24. Der belastbare Satz ist **„das Tool
liegt über einer guten PowerPoint"**; die Zahl wird nach der ersten Messung **abgeleitet, nicht
verteidigt**.

**Beleg, dass nichts kaputtging:** Der Zitat-Abgleich über alle 468 Issues lief vor und nach der
Änderung — **8784 Zitate, 1109 A- und 354 B-Befunde, identisch**. Kein Issue zitiert den geänderten
Satz.

## 6. AD v2.2 — FA-27 Produktfoto-Abruf (`613c03b`) und #469

Niklas: *„das ist aber ein wichtiges feature das funktioniert wenn es internet gibt"*. Das ist eine
**andere** Zusage als „braucht Internet": das Tool muss ohne Netz vollständig bleiben.

- **FA-27** (Soll) + **4.12**: zu einer Produkt-URL ein Foto abrufen, als Asset übernehmen, der
  Nutzer **wählt** — kein automatisches Einsetzen.
- **2.3** präzisiert; **NFA-06 bleibt Muss** und bekommt **genau eine** benannte Ausnahme. Der
  Widerspruch ist damit nicht weggeschrieben, sondern benannt.
- Abschnitt 6: der einmalige Abruf ist **keine** Synchronisation und **keine** Fernverwaltung.
- **#469** (TK v3.62) schreibt die Umsetzung aus. Der tragende Punkt steht dort: der Abruf läuft im
  **Main** und als **Auftrag über `reiheEin`** — sonst bräche die Prozess-Isolation.

## 7. Material für den Referenzlauf (`17e0038`, `21c4115`)

**`docs/artikel/`** — acht Aufnahmen von Niklas (Automat, Kühlschrank, Theke) mit lesbaren Namen und
**`preise.md`**: die Preise mit **Quelle je Zeile**. Die alte `docs/Automat.txt` ist laut Niklas
veraltet; sie nennt Sorten und Links, aber **keine Preise**.

**Zwei Artikel der Liste existieren nicht mehr:** „Muscle Shock" und das 500-g-Protein mit Iced Coffee
stehen am 11.11.2026 **nicht mehr** im Best-Body-Shop (137 Produkte, keins davon). Im Studio sind sie
aber noch im Bestand — die Liste beschreibt den **Studio-Bestand**, nicht das Lieferprogramm.

**`docs/artikel/referenzangebote/`** — die fünf Angebote des Referenzlaufs mit Texten, Preisen und
Bildern:

| # | Angebot | Preis | Bild |
|---|---|---|---|
| 1 | Whey Crisp Proteinriegel | 2,50 € | Hersteller-Render (All Stars, transparent, 1200 × 1200) |
| 2 | OATCake Hafer-Riegel | 2,00 € | Hersteller-Render (All Stars) |
| 3 | Best Body Protein 500 g | 19,95 € | Ausschnitt aus Niklas' Aufnahme, Preiszettel sichtbar |
| 4 | Protein Shake to go | 2,50 € | Herstellerfoto (Best Body) |
| 5 | Obstkorb am Eingang | gratis, max. 1 Stück | Ausschnitt, Etikett lesbar |

**Preisspanne 0 – 19,95 € ist Absicht:** ohne einen hohen Preis prüft „Preis-Hierarchie" nichts.
Bewusst **nicht** enthalten: Vorlage, Farbe, Effekte — das ist die Designarbeit, die gemessen wird.

Alle Bilder mit `file` **und** ffmpeg geprüft: echte PNG/JPEG, fehlerfrei dekodierbar. Die
Sicherheitsfrage ist damit strukturell beantwortet: **es wird nichts geöffnet** — Vorschaubilder der
Anbieter und Produktfotos, keine Office-Datei.

## 8. Was diese Sitzung NICHT geschafft hat

- **Projekt A und B sind nicht gebaut.** Grund, technisch und nicht bequemlich: Aktionen in die
  **Wiedergabeliste** zu legen ist Renderer-Logik (`fuegeAktionInsVideo`, `setzeListe`) und hat
  **keinen IPC-Kanal**. Ein Skript müsste Drag-and-drop am Fenster nachspielen — dann würde die
  5-Minuten-Zusage meine Klickroutine messen statt einen Menschen. Der Aufbau gehört in den
  Referenzlauf.
- **`#469`** (TK v3.62) ist angelegt und **nicht** bearbeitet.

## 9. Ehrlich offen

- **71 Dependabot-Findings** (33 high, 25 moderate, 13 low), nicht angefasst.
- `einzel-instanz` (#289) flaky.
- Der Treiber rendert das 70-s-Projekt zweimal (~2 × 70 s); teuer, aber korrekt.
- `protocolTimeout` im Treiber steht auf 900 s (Werkzeugeinstellung, kein Produktverhalten).
- **Die Zählung „9 x teilweise" in älteren Übergabetexten** ist durch #468 korrigiert — sie stand in
  mehreren Abschnitten. Wer sie liest, nimmt die Zahlen aus `treiber-matrix.md` (Stand 10.11.2026).

## 10. Stand am Sitzungsende

**10 Commits** vor `origin/main`, Arbeitsbaum sauber, **nicht gepusht** — Push nur auf Anweisung:

- `21c4115` Referenzangebote
- `17e0038` Artikel und Preise
- `613c03b` AD v2.2 (FA-27)
- `2e6979f` AD v2.1 / TK v3.61 (Baseline nehmen)
- `9615d1d` TK v3.60 (Varianten)
- `06e6eab` FA-26 in die Matrix
- `6893b53` echtes Logo
- `bdd08ad`, `e11c40d`, `e37338a` (aus der 56./55. Sitzung)

**Gate:** Unit **5741/5741**, Typecheck 0, Lint 0 (eine bestehende Warnung in
`scripts/beleg-effekt-render.mjs`), Build 0. **AD v2.2** (535 Absätze, 1 Bild), **TK v3.61**
(2815 Absätze, 2 Bilder) — beide `unzip -t` heil, 0 Backticks.

**Offene Issues:** #469 (TK v3.62 Produktfoto-Abruf), #466 (Referenzlauf), #458 (überholt).

## 11. Nächster Schritt

1. **Referenzlauf #466** — Niklas trägt die fünf Angebote aus `referenzangebote/README.md` in beide
   Decks ein (Zeit stoppen) und setzt Projekt A im Tool auf. Material liegt bereit.
2. Danach **A/B schneiden, Bögen ausfüllen, Protokoll** `docs/agents/abnahme-2026-11-*.md`.
3. **#469** (TK v3.62) — offen, aber sinnvoll erst, wenn der Referenzlauf zeigt, ob der Bildabruf den
   Unterschied macht.
