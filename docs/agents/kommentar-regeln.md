# Kommentar-Regeln

**Beschlossen:** 16.10.2026. **Gilt für:** allen Quellcode in `src/` und `tests/`.
**Grundsatz:** Ein Kommentar ist eine **Begründung**, kein zweiter Erzählstrang des Codes.

## Die Regeln

1. **WARUM, nicht WAS.** Der Kommentar erklärt die Absicht, den Zwang oder den Trade-off -
   nicht, was die nächste Zeile ohnehin schon sagt.
   - *schlecht:* `// setze Titel auf den Namen`
   - *gut:* `// Der Name geht OHNE Endung in den Auftrag (FA-22) - "sommer", nicht "sommer.mp4".`

2. **Quelle nennen, einen Satz.** Trägt eine Entscheidung ein Issue/TK/AD, wird die Nummer
   genannt, statt sie nachzuerzählen. Eine Begründung = ein Satz (notfalls zwei).

3. **Kein Gerüst-Kopf in fertigen Dateien.** Der generierte Block
   („GENERIERT aus dem Signaturblock …" + Signatur-Vertrag + `GERUEST-PRUEFSUMME`) ist ein
   Generator-Artefakt. Sobald der Rumpf steht, gehört er entfernt (die Datei sagt es selbst).
   Der `[modul] Zweck`-Satz darf als **eine** Kopfzeile bleiben.

4. **Kopf kurz.** Datei-Kopf höchstens 3 Zeilen Zweck. Doku an einer Funktion nur, wo die
   Signatur nicht selbsterklärend ist - sonst keine.

5. **Keine Wiederholung.** Dieselbe Begründung an mehreren Stellen ist ein Fehler: **eine
   Adresse**. Am Aufrufer genügt ein Verweis (`// s. #259`).

6. **Verboten:** auskommentierter Code, „später"-Notizen (`// TODO …`), Anekdoten und
   Prozess-Erzählung (`// ERLEDIGT am …`, „ein früherer Entwurf …"). Die gehören in Issue,
   Übergabe oder Commit - nicht in die Quelle.

7. **Durchsetzung.** Wo mechanisch prüfbar, gilt eine **Maschinenregel** (z. B. „kein
   `GERUEST-PRUEFSUMME` in `src/`"); alles Übrige ist Review-Regel.

## Was ausdrücklich bleibt

- **Genau EIN** Begründungssatz pro nicht-offensichtlicher Entscheidung - erhalten, nicht löschen.
- **Belege** (Messwerte, TK/Abschnitt, Issue-Nr) sind erwünscht, solange sie **zitieren** statt
  **nacherzählen**.
- **`SAFETY:`-Kommentare** an Typ-Assertions bleiben (verlangt von der anti-slop-Regel).

## Herkunft

Risiko, offen benannt: Die bisherigen Kommentare tragen oft **echte** Begründung. Deshalb gilt
beim Entschlacken: **Quelle zuerst sichern, dann kürzen** - nie stillschweigend entfernen.
