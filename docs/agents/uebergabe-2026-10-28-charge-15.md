# Übergabe 28.10.2026 – Mutations-Charge 15, nächster Schritt Charge 16

**Volltext:**
[`docs/agents/mutation-pilot-2026-10-20.md`](mutation-pilot-2026-10-20.md), Abschnitt 28.
Vorbereitung dieser Charge: [`charge-15-vorbereitung.md`](charge-15-vorbereitung.md).
Vorherige Sitzung: [`uebergabe-2026-10-28-charge-14.md`](uebergabe-2026-10-28-charge-14.md).

## 1. Auftrag und Stand

Fünf Dateien von der Sperrklinken-Liste (#447): `marken-vorschau`, `medium-loeschen-anzeige`,
`segment-anzeige`, `render-dialog-anzeige`, `speicherstatus-anzeige`.

**Gate am Ende:** `npm run pruefung` **Exit 0** – Typecheck 0, Lint 0 Fehler, Unit **5.487
(340 Dateien)**, Integration **49 (12 Dateien)**, Treiber **0 Befunde**.

**Ausgangspunkt:** Suite 5.490, Sperrklinke 60. **Ende:** 5.487, **55**. Die Vorbereitung
(Vorab-Dokument, 30 Fälle trocken geprüft) hat gehalten: keine EDIT-PROBLEME, keine falsche Spec.

## 2. Messung

**25 Verhaltens-Mutationen**, **5 harmlose Refactorings**; **20 erkannt**, **4 Lücken**, **1
äquivalent**; **0/5 Refactorings rot**; jede Mutation byte-identisch zurückgenommen.

## 3. Die vier Lücken

- **ML5** – der Aktions-Absatz erschien auch **ohne** betroffene Aktionen (`length > -1`). Neu:
  `medium-loeschen-aktionen` ist dann nicht im DOM.
- **ML7** – „Position 1/2" las der Test nur aus `lage.text`; die **Listenzeile** konnte die
  Positionsangabe verlieren. Neu: die Zeilen selbst, exakt verglichen.
- **SG5** – der Zeichen-Effekt hing nur an `[aktion]`: Wechsel von **Vorlage oder Marke** ließ
  das alte Bild stehen. Neu: beide Wechsel ⇒ je ein weiterer Aufruf.
- **SS2** – `join(' und ')` statt `', '` blieb grün. Neu: beide Quellen ⇒ exakter Satz.

**Äquivalent:** ML2 – `if (blockiert) return` ist über die Oberfläche unerreichbar (im
Blockade-Zweig gibt es keinen Bestätiger; der Test prüft das).

## 4. Der Treiber-Befund (wichtig für die nächste Sitzung)

Der **erste** Gate-Lauf war **rot**:

```
[Befund] Vorlagen (FA-13) :: nach dem Uebernehmen ist die Sitzung beendet
         -> arbeitskopie-kopf steht noch (vorlagen-editor/index.tsx)
```

Produktcode war nachweislich unverändert (`git diff -- src/` leer; die Charge ändert nur Tests).

| Stand | Läufe | Ergebnis |
|---|---|---|
| vor der Korrektur | 3 | **2 rot, 1 grün** |
| nach der Korrektur | 3 | **3 grün** |

**Ursache:** Der Schritt las den DOM **einmal** unmittelbar nach dem Store-Schreiben – der
Bestand war aktualisiert, React hatte noch nicht gerendert.
**Korrektur (`scripts/durchlauf.mjs`):** Warten auf das Verschwinden des `arbeitskopie-kopf` mit
**5 s Frist**, dieselbe Bauform wie die 15-s-Fristen daneben. Reine Messkorrektur: Die Zusage
„nach dem Übernehmen ist die Sitzung zu" gilt unverändert und wird weiter geprüft.

**Lehre:** Ein roter Treiber-Lauf gegen unveränderten Produktcode ist erst dann ein Befund, wenn
er reproduzierbar ist. Hier war er es (2/3) – und die Ursache lag im Messweg.

## 5. Entfernt (6 Tests, 3 ergänzt – netto −3)

`marken-vorschau` 1, `medium-loeschen-anzeige` 1, `segment-anzeige` 2, `render-dialog-anzeige` 1,
`speicherstatus-anzeige` 1. **Sperrklinke:** 60 → **55**, ESLint grün.

**Ehrlich offen:** Die entfernten Architekturregeln (kein Timer, kein Kanal-Literal, kein
`confirm`, kein zweiter Zeichenpfad) sind **ohne Wächter** – Lint-Kandidat.

## 6. Nächster Schritt: Charge 16

1. Fünf der verbleibenden **55** wählen: `queue-panel-wurzel` (556 Zeilen, mehrere Proben),
   `marken-uebersicht`, `marken-zugang`, `element-zeile`, `concat`.
2. Rezept mit `tools/mutationen.py`; **je Datei die richtige Spec**.
3. Fünf Einträge aus der Sperrklinken-Liste streichen, Lint belegen.
4. Gate, Doku, Commit. **Push nur auf Anweisung.**

## 7. Ehrlich offen

- **Architektur-Verbote** ohne Wächter (Lint-Kandidat), inklusive der ffmpeg-Flaggen aus Charge 14.
- **#448**: 192 Typ-Behauptungen ohne `SAFETY`-Kommentar; Regel auf `warn`.
- **Einzelquellen-Regeln** nur durch Werte gedeckt.
- **Treiber:** Die FA-13-Sitzung ist jetzt mit Frist gemessen; ob es weitere Einmal-Leser gibt,
  ist **nicht** systematisch geprüft (Kandidat für einen eigenen Durchgang).
