### Issue NA-07 (= #426): [neu] Eine Aktion unterbricht das Video kurz (Video pausiert)

## Ziel (in einem Satz)
Eine Aktion kann mitten im Video **kurz unterbrechen**: das Video pausiert, die Aktion läuft, danach
läuft das Video **an derselben Stelle weiter**.

## User-Entscheidung (15.10.2026, wörtlich)
„aktion unterbricht das video kurz" (neben „band parallel").

## Charakter: NEUE Anforderung – Modell und Render sind zu ENTWERFEN
Anders als das Werbeband (FA-20, parallel) **teilt** die Unterbrechung das Video: `Video-Teil · Aktion ·
Video-Teil`. Das berührt **Datenmodell und Render** und ist noch nirgends definiert.

## Nicht selbst entscheiden – STOPP und fragen (das Issue ist bewusst offen)
- **Datenmodell:** Wie wird die Unterbrechung abgebildet? (a) Einschübe am Video-Listenelement
  (Zeitstelle + Aktion + Dauer), (b) das Video wird beim Einfügen **real geteilt** (zwei Video-Elemente
  mit geteiltem Trim), (c) etwas anderes. **Ohne Entscheidung nicht baubar.**
- **Render (TK 9.2, concat mit `-c copy`):** Zwei Video-Teile + dazwischen ein Aktions-Segment – die
  Frames müssen frame-genau aneinanderpassen (9.2.6). Trim-/Rundungsregeln festlegen.
- **Vorschau (P5):** Hält die Wiedergabe am Unterbrechungspunkt an und spielt die Aktion?
- **Wechselwirkung mit dem Band:** Kann dieselbe Aktion Band **und** Unterbrechung sein? Wohl nicht –
  Regel nötig.
- **Mehrere Unterbrechungen:** erlaubt? Reihenfolge?
- **Undo:** Einfügen/Entfernen einer Unterbrechung als EIN Schritt?

## Definition of Done
- [ ] AD und TK sind um die **entschiedene** Modell-/Render-Fassung ergänzt (4.5 / 9.7.7 / 9.2).
- [ ] Erst danach sind die Bau-Issues zuschnittsfähig.
- [ ] (Bis dahin bleibt dieses Issue **braucht-entscheidung**; es wird NICHT gebaut.)

## Abhängigkeiten
- Blockiert von: –
- Bezug: AD v1.7 (4.5, FA-20), TK v3.22 (9.7.7)
