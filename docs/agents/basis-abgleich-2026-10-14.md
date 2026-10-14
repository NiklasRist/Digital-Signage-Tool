# Basis-Abgleich 14.10.2026 – die geschlossenen Oberflaechen-Issues gegen den Nutzerstand

Anlass: User-Befunde 14.10. ("die Issues von davor waren nicht richtig erfuellt"). Gefuehrt
wird der Abgleich gegen den Treiber-Lauf vom 14.10. (Protokoll `oberflaeche-durchlauf.md`,
letzter Nachlauf: pageerror 0, nur die zwei bekannten Grenzen: 5-Reiter-Tool-Limit und der
MANUELL-Export).

## Tabelle: Issue -> am echten Fenster belegt? -> Restbefund

| Issue | Treiber-Beleg heute | Bewertung |
|---|---|---|
| #314 (5 Reiter) | Reiter 5 gemessen | belegt (Tool-Limit: erwartet "4", TK-Vertragszitat steht) |
| #342 (Dialoge montiert) | render-dialog nach Klick im Fenster; export MANUELL | belegt |
| #346 (Start-Hinweis weg) | Kein Projekt aktiv check laeuft durch | belegt |
| #347 (Render-Lauf auffrischt) | render:fortschritt 5x, Ausgabe in der Liste ohne Klick | belegt |
| #340 (media://-Handler) | 3 geladen / 0 abgelehnt | belegt |
| #404-Seed (queue:reiheEin) | 2 queue-Ereignisse | belegt |
| #407 (Bibliothek montiert, Sicht aktuell) | Klick "Zur Liste hinzufuegen" -> Element sichtbar | belegt (in der NEUEN Information via Zeitleisten-Bloecke) |
| #409 (Vorlagen-Editor-Sitzung) | arbeitskopie-kopf im Fenster, pageerror 0 | belegt |
| #410 (Standardmarke-Zeilenwert) | select haelt bestatigung am echten select | belegt |
| #408 (KontextMenue) | Duplikat 1->2, Entfernen 2->1 Zeilen am echten Menue | belegt |
| #412/#414 (Zeitleiste prim., Kanten-Ruhelage) | Zeitleiste da, Kanten unsichtbar in Ruhelage | belegt |
| #411/#413/#415 (Kernachse: Spalt-Drop + Undo) | 4f: 2 -> 3 Bloecke, Cmd+Z 3 -> 2 (EIN Schritt) | treiber-belegt |
| **#417 (User-Befund Drag zwischen Frames)** | Treiber belegt es, der User NICHT | **OFFEN (User-Abnahme fehlt)** |
| **#416 (Aktion anlegen)** | Treiber misst keinen Anlege-Weg | **OFFEN (Neu)** |
| **#418 (Import = EIN Video, standardmaessig ausgewaehlt)** | nicht gemessen | **OFFEN (Neu)** |
| **#419 (Play + Videodarstellung)** | nicht gemessen (nur media://-Ladecheck) | **OFFEN (Neu)** |
| #415-Rest (Reparatur-Naht) | noch mit WARN-Fallback | nachziehen |
| #327 (optische Abnahme Marke) | User-Privatweg | offen beim User |

## Fazit
Die TECHNISCHEN DoD der geschlossenen Issues sind am Treiber belegt; die LUECKEN sind die
userseitigen Gefuehlsluecken (#416-#419) - die Kernachse gilt erst, wenn alle vier
erledigt sind. Der Treiber-Beleg ist eine MAUSSIMULATION; #417 dokumentiert den Widerspruch
(Treibermessung gruen, User-Bedienung bricht) offiziell als Issue.

## Verabredete Treiber-Nachzuege (klein)
- Schritt 3 misst die Zeitleiste als PRIMARE Ansicht (seit #414) samt der
  Ruhelage-Regel der Kanten (#412).
- Der Treiber-Aufraeumer loescht je Lauf seine eigenen DurchlaufTest-Projekte
  (User-Entscheidung 14.10.: solange die App nicht fertig ist).
- NEU: ein Videostage-Messschritt (Schritt 4g: video-Rechteck, Play -> currentTime)
  als Nachzug fuer #419.
