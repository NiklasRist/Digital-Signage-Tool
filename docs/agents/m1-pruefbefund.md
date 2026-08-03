# Prüfbefund M1 — vollständig, Stand 02.08.2026

> **Alle 39 Issues geprüft** (sechs unabhängige Prüfer, gegen TK v2.3 / Anforderungsdokument v1.2
> und die Regeln A–E aus `issue-generation-prompt.md`).
> **Ohne Befund: M1-02, M1-30, M1-31, M1-37, M1-38.**
>
> ## ✅ ALLE BEFUNDE BEHOBEN (02.08.2026)
>
> Korrigiert in `issues-draft.md`; Diff je Issue geprüft (+370 / −188 Zeilen).
> **M1-37 und M1-38 blieben unverändert** — sie hatten keinen Befund.
> **Neu:** `M1-40 [contracts] Typ Marke definieren` (die fehlende Nummer ⑤), damit sind es **40**.
>
> Nicht mechanisch entschieden, sondern bewusst als **offene Rückfrage** in die STOPP-Blöcke gelegt:
> die `HistorieEintrag`-Struktur (M1-07, der TK legt sie nicht fest), sync-vs-entprellt beim
> `config-store` (M1-15/16/18), dessen Nebenläufigkeit (M1-19), `letzterAusgabeName` beim
> Duplizieren (M1-24), das Schreib-Lock für den reinen Lesezugriff `listeProjekte` (M1-23) und der
> Fehlercode bei fehlendem aktivem Projekt (M1-26).
>
> **Auch M0 war betroffen:** Dieselbe Regel-E-Lücke steckte in **#4, #6, #8** — dort verlangt die
> DoD einen automatisierten Test, während die Dateigrenze keine Testdatei zuließ. Auf GitHub
> korrigiert. (#3, #7 verlangen nur *manuelle* Tests, #5 hatte die Ausnahme bereits, #9 weist per
> Log nach, #11 führt `tests/` schon im Dateibereich — dort war nichts zu tun.)
>
> **Status: M1 ist damit freigabereif.** Nächster Schritt wäre das Anlegen auf GitHub.

---

<details>
<summary>Der ursprüngliche Befund (zur Nachvollziehbarkeit aufbewahrt)</summary>


---

## Die fünf Muster (wichtiger als die Einzelbefunde)

**① Regel E — die Testdatei-Ausnahme fehlt fast überall. Rund 21 Issues.**
Der DoD-Schlusspunkt lautet „Keine Datei außerhalb von `X` geändert", während andere DoD-Punkte
desselben Issues ausdrücklich Tests verlangen („Test mit Spy", „Test mit künstlicher Zeitsteuerung").
Das Worked Example schreibt „(**+ zugehörige Testdatei**)" — beim Kopieren ging es verloren.
Wörtlich gelesen kann der Agent die geforderten Tests nicht ablegen, ohne einen anderen DoD-Punkt zu
verletzen. **Exakt der Fehler, an dem im M0-Prüflauf Issue #1 scheiterte.** Mechanisch behebbar.
Betroffen: M1-08, M1-10, M1-11, M1-14…M1-19, M1-20…M1-25, M1-32…M1-35, M1-39.

**② Regel C — Signatur entscheidet, STOPP-Block fragt dasselbe nochmal. 7×.**
`M1-03`, `M1-04`, `M1-05`, `M1-10`, `M1-13`, `M1-21`, `M1-24`. Der Agent liest „NICHT ändern", setzt
um und fragt nie — die Rückfrage ist strukturell abgeschaltet. Die Issues entstanden **vor** Regel C.

**③ Regel D — erfundene oder ungenaue Zitate. 7×.**
- `M1-11`: „…werden **nicht** direkt aufgerufen, sondern über `reiheEin` eingereiht" (TK 9.1.1) —
  **steht dort nicht**; der echte Satz steht in **9.3.4** und lautet anders.
- `M1-29`: „Reihenfolge = Array-Reihenfolge" (TK 9.11.3) — **0 Treffer im TK**, stammt aus dem Prompt.
- `M1-20`: zwei Fälle — „Das D1-Lock ist ein prozessinternes Lock" (TK sagt „Das **D1-Schreib-Lock**…")
  und ein zu einem Satz verkürztes TK-9.4.6-Zitat, das so nicht existiert.
- `M1-06`: als „wörtlich" markierte TK-9.2.4-Tabelle ist eine umformatierte Paraphrase.
- `M1-03`, `M1-12`: Zitate ohne Kennzeichnung gekürzt.

**④ Abhängigkeiten ohne Begründung** — die Vorlage verlangt „Blockiert von: #n (warum)".
Fehlt u. a. in M1-20…M1-25, M1-26, M1-27, M1-29.

**⑤ Ein ganzes Issue fehlt: der `Marke`-Typ.**
Kein M1-Issue definiert ihn — aber `M1-14` benutzt `marke: Marke` und `M1-17` braucht ihn.

---

## Kritische Einzelbefunde

| Issue | Befund |
|---|---|
| **M1-28** | **Die Aktion wird nie aus `Project.aktionen` entfernt.** Weder „Ausgang bei Erfolg" noch ein DoD-Punkt verlangen es — geprüft wird nur die Kaskade. Ein Agent kann die schwierige Kaskadenlogik perfekt bauen und das eigentliche Löschen vergessen, ohne dass etwas anschlägt. |
| **M1-05** | **`ausgabeName` fehlt im `RenderRequest`** (TK 9.2.1, FA-22). `M1-06` verweist bereits darauf als existierendes Feld → die Issues **widersprechen sich**. Ohne das Feld ist FA-22 nicht umsetzbar. |
| **M1-07** | **`historieEintrag` fehlt im `RenderResult`** (TK 9.2.3, 9.3.6). M1-07 blockiert die Q3-Protokoll-Issues; ohne das Feld müsste der M2-Agent den Eintrag selbst bauen oder er entfällt → **Lücke im dauerhaften Protokoll**. |
| **M1-21** | **`letzterAusgabeName` fehlt beim Anlegen eines Projekts.** TK 9.11.3 verlangt das Feld und nennt den Startwert (`null`) ausdrücklich. Ein neu erstelltes Projekt verletzt sonst den Datenvertrag und bricht beim ersten Render. |
| **M1-17** | `leseMarke` liefert `Ergebnis<unknown>` statt `Ergebnis<Marke>` (TK 9.5.6) — begründet mit einer **erfundenen** „Übergabe-Prompt-Assumption"; der Prompt sagt das Gegenteil. Folge: `template-canvas` müsste bei jedem Aufruf casten. |
| **M1-23** | **`listeProjekte` erwähnt das D1-Lock nirgends** — als einzige der fünf Operationen unter TK 9.5.2, dessen Abschnittstitel „Operationen (Instant, **über das D1-Lock**)" für alle fünf gilt. |
| **M1-24** | Regel C: Die Signatur legt `dupliziereProjekt` als Instant-Op fest, der STOPP-Block stellt genau diese Grundsatzfrage (Instant vs. Auftrag) erneut. Eine Antwort „doch ein Auftrag" würde die ganze Signatur ungültig machen. |
| **M1-10** | Regel C beim `F`-Typparameter der Fehlercode-Union. Da M3/M4/M6 dem Muster folgen sollen, pflanzt sich eine falsch geratene Entscheidung fort. |
| **M1-13** | Regel E: Die DoD verlangt Demonstrationen **in** den Dateien von M1-11/M1-12 und verbietet zugleich jede Änderung außerhalb von `kanaele.ts`. Nicht gleichzeitig erfüllbar. |

## Wichtige Einzelbefunde

- **M1-04**: `art` und `payload` nicht als diskriminierte Union → `art:'import'` mit `RenderRequest`
  kompiliert anstandslos. Fehlercode-Abhängigkeit zudem zu eng (nur die generischen aus S12).
- **M1-14**: Der Fehlerpfad „`config.json` defekt, **`.bak` intakt** → wiederherstellen" fehlt in der
  als *vollständig* bezeichneten Tabelle — genau der Fall, für den das Backup existiert.
- **M1-15/16/18**: „Keine offenen Punkte" ist falsch — ungeklärt, ob `config.json` synchron oder
  entprellt geschrieben wird; `speicher_fehler` fehlt in allen drei Fehlerpfad-Tabellen (NFA-02).
- **M1-19**: Nebenläufigkeit ungeklärt. `config-store` hat keine eigene Serialisierung; zwei schnell
  aufeinanderfolgende Schreiboperationen → **Lost Update ohne jede Meldung** (bricht FA-15 still).
- **M1-21**: Regel C — der STOPP-Block fragt nach dem Ordnernamen (UUID vs. lesbar), obwohl
  TK Abschnitt 6 mit `projects/<projekt-id>/` bereits antwortet und die DoD es festschreibt.
- **M1-24**: FA-22 beim Duplizieren ungeklärt. TK 9.5.2 nennt nur `project.json` **und** `media/` —
  `output/` also nicht. Das Duplikat erbt damit einen `letzterAusgabeName`, der auf eine **nicht
  existierende** Datei zeigt. Gehört als echter Regel-B-Punkt in den STOPP-Block.
- **M1-26**: Ein Fehlerpfad verweist auf einen STOPP-Punkt, den es im Issue nicht gibt.
- **M1-29**: STOPP-Punkt zu `geaendertAm` fehlt; `M1-31` verweist darauf ins Leere.
- **M1-36**: Der STOPP-Punkt zu `AKTUELLE_SCHEMA_VERSION` ist **bereits beantwortet** — TK 9.11.4
  führt die Konstante seit dem 02.08. auf. *(Zeitliches Artefakt: M1-36 wurde geschrieben, bevor die
  Konstante ins TK und nach M1-09 kam.)* Bleibt der Punkt stehen, definiert der Agent sie womöglich
  lokal — genau die zweite Quelle, die TK 9.11.4 verhindern will.

## Kleine Befunde

`M1-01` (`jpeg` unbelegt in der Whitelist) · `M1-09` (Ziel-Satz und Re-Export-DoD nicht mit dem neu
ergänzten `AKTUELLE_SCHEMA_VERSION` abgeglichen) · `M1-25` (`output/` fehlt in der Aufzählung der zu
löschenden Pfade) · `M1-27` (STOPP-Block verweist nur, statt den Inhalt zu wiederholen — Regel A) ·
`M1-28` (deutsches Anführungszeichen in einem wörtlichen Zitat) · `M1-29` (Default-Trimwerte
fälschlich TK 9.11.3 zugeschrieben).

---

## Ohne Befund

| Issue | |
|---|---|
| **M1-02** | `Aktion`-Typ |
| **M1-30** | `entferneElement` — gründlichstes Issue seiner Gruppe |
| **M1-31** | `ordneNeu` — Permutationsprüfung vollständig und korrekt |
| **M1-37** | Pfad-Autorität — Traversal-Testfälle, reservierte Windows-Namen, Zitate verifiziert, DoD **mit** Testdatei-Ausnahme |
| **M1-38** | `media://`-Auflösung — saubere Abgrenzung zu M1-37 und S9, Protokoll-Handler korrekt **nicht** mit `Ergebnis<T>` verwechselt |

Bemerkenswert: **M1-37, M1-38 und M1-39** entstanden **nach** den Regeln C/D/E — und genau sie sind
die saubersten. M1-39 hat als einzigen Mangel die Testdatei-Ausnahme.

---

## Reihenfolge der Korrektur (Vorschlag)

1. **Mechanisch, alle betroffenen Issues:** „(+ zugehörige Testdatei)" in den DoD-Schlusspunkt.
2. **Regel C auflösen** (7 Issues): je Punkt entscheiden — entweder Signatur gilt und der STOPP-Punkt
   entfällt, oder umgekehrt. Bei `M1-21` und `M1-36` beantwortet das TK die Frage bereits.
3. **Fehlende Felder ergänzen:** `ausgabeName` (M1-05), `historieEintrag` (M1-07),
   `letzterAusgabeName` (M1-21), Aktion-Löschung (M1-28), D1-Lock (M1-23).
4. **Neues Issue schreiben:** `[contracts] Typ Marke definieren` — vor M1-14 und M1-17 einreihen.
5. **Zitate korrigieren** (7 Stellen), Abhängigkeits-Begründungen ergänzen.
6. **Echte offene Fragen in die STOPP-Blöcke:** `config-store`-Nebenläufigkeit (M1-19),
   sync-vs-entprellt (M1-15/16/18), `output/` beim Duplizieren (M1-24).

</details>
