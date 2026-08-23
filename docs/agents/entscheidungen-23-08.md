# Entscheidungen vom 23.08.2026 (User)

Alle als Nachträge in den jeweiligen Issues verankert; hier die Sammlung.

| # | Frage | Entscheidung |
|---|---|---|
| #281 | Migration bestehender Projekte auf eingebaute Marke | **GESTRICHEN** – es gibt keine bestehenden Projekte; nie ausführbarer Code. Marke wird beim Projekt-Anlegen gewählt (#328); #280 (Seed der eingebauten Marke) bleibt |
| #82 | ffprobe-Timeout | **10 s** (vorläufige 30 s ersetzt) |
| #134 | Render bei vorhandenem Ausgabenamen | **Hinweis VOR dem Klick** (Vorbelegung zeigt belegten Namen markiert); kein Ersetzen-Dialog |
| #228 | Zweiter Importweg | **Drag-and-drop** aus dem Explorer kommt dazu → NEUES Issue (Verdrahtung fehlt) |
| #320/#328 | schemaVersion wegen Marken-Pflichtfeldern | **Bleibt 1** (keine Projekte → keine Migration) |
| #139 | Akzentfarbe zurücksetzen | **Ja** – Zurücksetzen auf `null` (= Markenfarbe) möglich |
| #53 | Pfad im Protokoll | **Relativ** zum Projektordner (Portabilität) |
| #67 | Projektwechsel bei laufenden Aufträgen | **Dialog**: „Es laufen Aufträge – abbrechen und Projekt wechseln?" Ja = Aufträge abbrechen, dann wechseln; Nein = bleiben |
| #249 | Dauer-/Trim-Regler | **Raster 0,5 s + Zahleneingabefeld** |
| #248 | Wiedergabeliste Bedienung | **Maus only** für v1 (Drag-and-drop, keine Tastatur/Mehrfachauswahl) |
| #250 | Speichern im Aktions-Editor | **Beim Verlassen des Feldes** (kein Auto-Save pro Feld, kein Knopf) |
| #253 | Reihenfolge Band-Abschnitte | **Beides** – Pfeil-Knöpfe UND Drag-and-drop |
| #209 | Entfernen/Abbrechen in Queue | **Bestätigungsdialog** |
| #200 | „Nicht gespeichert"-Hinweis | **Dauerhafte Fußleiste**, verschwindet nach erfolgreichem Speichern |
| #256 | Reparatur-Führung verlassen | **Freiwillig** – keine Blockierung; kaputte Stellen bleiben markiert |

## Offen geblieben (nächste Sitzung)
- Restliche UI-Detailfragen aus der A-Liste (~40): Wortlaut-Hinweise (#203/#204/#211),
  Klappzustand merken (#207/#257), Fortschritt-Anzeige (#208), Wiederholen/Verwerfen (#210),
  Platzhalter-Ähnlichkeit (#221), composer/action-editor/vorlagen-editor Anordnung (#261/#250-Umfeld/#251/#252),
  Undo-Fragen (#233/#234/#236/#237), Vorlagen-Zonen bei Bandhöhen (#100/#102/#155),
  M8-Rest (#277–#330).
- Experimente (Gerät nötig): #163 ffmpeg-Autorotation, #168 qtrle, #110/#118 Canvas/PNG,
  #290 marken://corsEnabled.
- TV-Tests physisch: Stromausfall-Wiedergabe, Repeat One, Firmware-Stand.
