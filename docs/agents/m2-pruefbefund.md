# Prüfbefund M2 — vollständig, Stand 03.08.2026

> **Alle 18 geschriebenen Issues geprüft** (vier unabhängige Prüfer: drei je sechs Issues, einer im
> Querschnitt über alle), gegen TK **v2.4** / Anforderungsdokument **v1.2** und die Regeln A–E aus
> `issue-generation-prompt.md`.
>
> ## ✅ ALLE BEFUNDE BEHOBEN · M2 ist angelegt: Issues **#53–#71** (`M2-XX → #(XX+52)`)
>
> Rund **45 Befunde, elf kritische**. Aus dem Befund entstand ein **19. Issue** (M2-19,
> IPC-Verdrahtung). Korrigiert in drei Durchgängen, jeder mit Diff-Kontrolle.

---

## Was sauber war (und warum das etwas heißt)

- **Regel D zu 100 % eingehalten.** Rund 90 wörtliche Zitate, jedes einzeln per Suche gegengeprüft –
  **kein erfundenes, kein falsch zugeordnetes**. Bei M1 waren es sieben Verstöße, zwei davon Zitate,
  die im Technischen Konzept **gar nicht** standen.
- **Regel E durchgehend erfüllt.** Die Testdatei-Klammer stand von Anfang an in allen 18 (bei M1
  fehlte sie ~21×).
- **Die gefährlichste Stelle war richtig gelöst:** der Übergang `anstehend → laeuft` im Torwächter,
  wo ein falsch gesetztes `await` zwei Aufträge gleichzeitig starten und die serielle Garantie –
  den **einzigen** Sperr-Mechanismus des Systems – lautlos aushebeln würde.

**Der Unterschied zu M1 kommt aus der Vorgabe:** Die Agents bekamen vorab eine Briefing-Datei, in der
alle Festlegungen ausgeschrieben standen, die das Technische Konzept offen lässt. Was dort entschieden
war, musste niemand raten.

## Die elf kritischen Befunde — alle an den Nähten

Kein einziger war ein Denkfehler **innerhalb** eines Issues. Alle elf lagen **zwischen** zwei Issues –
genau die Klasse, die ein Agent mit begrenztem Kontext nicht bemerken kann.

| # | Befund | Was passiert wäre |
|---|---|---|
| 1 | `speicher_fehler` in keinem Typ deklariert (#12 liefert nur die drei generischen Codes, #22 nur den Typparameter) | Fünf Issues hätten nicht kompiliert |
| 2 | `projektId` fehlt in jeder Signatur, die sie braucht | Der gesamte Abschlusspfad wäre nicht baubar gewesen |
| 3 | Undefiniert, ob Q1 lebende Einträge oder Kopien liefert | Statuswechsel laufen ins Leere → serielle Garantie bricht **lautlos** |
| 4 | Der Abbrecher war registrierbar, aber nicht aufrufbar | FA-18 („laufenden Render abbrechen") unerreichbar |
| 5 | Niemand meldet die vier Kanäle beim `ipc-gateway` an | M2 endete mit Funktionen, die die Oberfläche nicht erreichen kann → **M2-19** |
| 6 | Abbruch löscht den Q2-Eintrag | Export scheitert → Wiederholung abgebrochen → Fehlschlag endgültig weg (verletzt FA-17) |
| 7 | Der geladene Q2-Stand hatte keinen Eigentümer | Zwei Issues setzten ihn voraus, keines hielt ihn |
| 8 | `sendeQueueGeaendert` synchron, `holeStand` asynchron | Zwei Meldungen könnten vertauscht ankommen; Panel bliebe veraltet |
| 9 | Verweis auf ein „Muster aus #47", das dort nicht existiert | Der Agent hätte nichts gefunden |
| 10 | Vier Abhängigkeitspaare blockieren sich gegenseitig | Keines der Issues wäre startbar gewesen |
| 11 | Fehlende Verneinung kehrt eine Invariante um („darf hier wieder auftauchen") | Der entfallene Code `render_aktiv` wäre erlaubt gewesen |

## Das durchgehende Muster: Regel A auf Modulebene

In **allen 18** Issues wurden Nachbar-Funktionen nur mit der Issue-Nummer genannt („über M2-04 an Q3
anhängen") statt mit **Namen und Signatur**. Der umsetzende Agent sieht nur sein eigenes Issue und
hätte jeden Aufruf raten müssen. Behoben: Jedes Issue führt die fremden Signaturen jetzt ausgeschrieben.

**Konsequenz für M3–M7:** Das gehört in die Vorgabe, bevor geschrieben wird – nicht in den Prüflauf.

## Entscheidungen, die der Befund erzwungen hat

**Vom Auftraggeber (03.08.):**
1. **`versuche` wird beim tatsächlichen Start erhöht**, nicht bei `wiederhole`. Grund: Das Feld heißt
   „Anzahl bisheriger Ausführungen" (TK 9.3.1) – nach der Konzept-Fassung stünde ein einmal
   gelaufener, gescheiterter Auftrag bei **null**. → **TK 9.3.3/9.3.4/9.3.5 nachziehen.**
2. **Kein neuer Fehlercode für nicht abbrechbare Aufträge.** Die Oberfläche bietet „Abbrechen" nur bei
   laufendem `render` an (FA-18); erreicht der Aufruf dennoch den Main, ist es `ungueltige_eingabe`.
   → **Betriebsregel gehört in M7 (`queue-panel`).**
3. **Den Klartext (`label`) baut der Main selbst**, die Schnittstelle bleibt wie in TK 9.3.4.

**Von mir, offen benannt (15 lokale Details):** keine Obergrenzen für Warteschlange, Fehlschlag-Anzeige
und offene Löschungen (eine Grenze verstecke genau das, was sichtbar sein soll) · keine Zeitgrenze je
Auftrag (ein Render darf zwanzig Minuten dauern) · eine defekte **Diagnose**-Datei (Q4) darf neu
begonnen werden, eine defekte **Daten**-Datei (Q2/Q3) niemals · Doppelklick auf „Wiederholen" bleibt
wirkungslos statt zu doppeln · `streicheAusQ2` ist idempotent · eine Zeitabfrage für `begonnenAm` und
die Q4-Bewegung, nicht zwei.

## Das Label als Filter

Nach dem Schreiben hätte `braucht-entscheidung` auf **17 von 18** gepasst – Rauschen, genau das, wovor
Abschnitt 10 des Übergabe-Prompts warnt. Durch die 15 Entscheidungen oben sind es **9 von 19**:

**#53** (absoluter vs. projektbezogener Pfad im dauerhaften Protokoll) · **#61** (Zugriff auf den
`originalname` für den Klartext) · **#64** (Verhalten ohne geöffnetes Projekt, gekoppelt an #38) ·
**#65** (Drosselung des Ereignisses bei Fortschritt) · **#67** (Projektwechsel: app-weite Schlange vs.
projektbezogenes Q2) · **#68** (Struktur des `historieEintrag`, geerbt aus #19) · **#69**
(Rename-mit-Ersetzen auf Windows, `fsync`) · **#70** (Verhalten, wenn Q3/Q2 nicht schreibbar sind) ·
**#71** (Aufrufzeitpunkt der Verdrahtung, mehrere Fenster).

## Offene Doku-Nachträge (eigener Schritt, eigene Freigabe)

1. **TK 9.3.3/9.3.4/9.3.5:** `versuche` +1 gehört an den Start, nicht an `wiederhole` (s. o.).
2. **TK 9.4.6 Schritt 3:** „**Pfad** in `pendingDeletions`" → `dateiname` ohne Verzeichnisanteil,
   passend zu 9.4.8 Punkt 1 und zur portablen Auslieferung.
3. **M7:** „Abbrechen" wird nur bei laufendem `render` angeboten.
