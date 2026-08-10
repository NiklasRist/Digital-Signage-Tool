# Zitat-Abgleich nach v3.4: gemessener Umfang

> **Stand 10.08.2026.** Erhoben aus den Issue-Volltexten in `docs/agents/m*/`, Zuordnung über die
> `map.json` je Meilenstein. **Noch nicht durchgeführt** – diese Datei ist die Bestandsaufnahme.

## Es sind 54 Issues, nicht 19

Das Auftrags-Briefing nannte 19. Das waren die `leseMarke`-**Aufrufer**. Die Änderung berührt aber
sechs weitere Muster:

| Muster | Anzahl | Was daran falsch ist |
|---|---|---|
| `leseMarke` ohne Argument | **19** | Signatur hat jetzt eine `markeId` (9.15.1) |
| Zitat „**read-only** … Marken-Editor ist **kein MVP**" | **16** | Behauptung ist jetzt **falsch** (FA-24) |
| Zitat des `Marke`-Typs (9.11.2) | **18** | Typ trägt jetzt `id`, `name`, `parent`, `eingebaut`; `logo` ist `\| null` |
| Palettenzwang der Akzentfarbe | **12** | Zwang ist **gestrichen** (freier Hex, FA-24) |
| `9.5.6` **mit** Markenbezug | **11** | Quelle ist jetzt **9.15.1**, nicht 9.5.6 |
| `logo.datei` / `logo: {` | **8** | `logo` ist `\| null`, Referenzen tragen `herkunft` |
| `config.json … Marke` | **1** | Feld ist dort weg |

**Nicht betroffen:** 13 Verweise auf `9.5.6` **ohne** Markenbezug (`leseKonfig`, `setzeExportZiel`,
`setzeUIVoreinstellung`). Die bleiben gültig – ein pauschales Ersetzen von „9.5.6" wäre falsch.

## Ein Teil davon ist KEIN Zitat-Abgleich, sondern eine Vertragsänderung

Das ist der wichtigere Befund. Drei Klassen, die sich nicht gleich behandeln lassen:

**Klasse 1 – reines Zitat (mechanisch).** Der Wortlaut hat sich geändert, die Aussage des Issues
bleibt. Beispiel: `9.5.6` → `9.15.1` bei den Restflächen. Ersetzen genügt.

**Klasse 2 – die Aussage kippt.** Das Issue baut auf einer Zusage auf, die zurückgenommen wurde.
`leseMarke` bekommt ein Argument, der Palettenzwang fällt, `logo` kann `null` sein. Hier ändert sich
die **Signatur** oder das **Verhalten** – Nachdenken je Issue, nicht suchen und ersetzen.

**Klasse 3 – das Issue argumentiert gegen v3.4.** Am deutlichsten **#77** (`M1-46`): Es begründet
ausdrücklich, dass es **keinen Schreibkanal für die Marke** gibt, warnt davor, aus Symmetrie einen
`config:setzeMarke` zu ergänzen, und stützt das auf „Marken-Editor ist kein MVP". Diese Begründung ist
jetzt **umgekehrt** – es gibt Schreiboperationen, nur nicht im `config-store`. Solche Issues brauchen
einen neu geschriebenen Abschnitt, keine Textersetzung.

Ebenfalls Klasse 3: **#112** und **#119** (`template-canvas`) – sie müssen das **Ersatz-Logo**
(9.10.10) und das Laden **importierter** Schriften kennen, was v3.3 nicht gab.

## Die Verteilung über die Meilensteine

| Meilenstein | betroffene Issues |
|---|---|
| M1-Nachzügler | `#77` |
| M4 Pixel | `#95`, `#96`, `#100`, `#106`, `#110`, `#111`, `#112`, `#114`, `#115`, `#116`, `#117`, `#119` |
| M5 Inhalte | `#121`, `#134`, `#135`, `#136`, `#139`, `#140`, `#144`, `#147`, `#148`, `#150`, `#154` |
| M6 Render & Export | `#164`, `#176`, `#177`, `#181`, `#183`, `#188`, `#192` |
| M7 Oberfläche | `#194`, `#196`, `#197`, `#198`, `#203`, `#215`, `#216`, `#217`, `#218`, `#219`, `#221`, `#224`, `#226`, `#237`, `#239`, `#244`, `#250`, `#251`, `#252`, `#258`, `#260`, `#261`, `#262` |

## Empfohlene Reihenfolge

**Erst die neuen Issues zuschneiden, dann abgleichen.** Grund: Die Klasse-3-Issues müssen auf die
neuen verweisen (`#112` braucht das Ersatz-Logo-Issue, `#77` braucht den `marken-store`). Gleicht man
vorher ab, schreibt man Verweise auf Issue-Nummern, die es noch nicht gibt – und fasst dieselben Texte
zweimal an. Das ist die Vorwärts-Regel, die schon in `uebergabe-stand.md` steht: Wer ein Issue anlegt,
das die Lücke eines früheren schließt, streicht dort die Melde-Aufforderung und setzt den Verweis auf
das neue Issue.
