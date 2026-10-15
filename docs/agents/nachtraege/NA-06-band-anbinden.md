### Issue NA-06 (= #425): [composer] Band-Bearbeitung anbinden und eine Aktion auf das Video ziehen

## Ziel (in einem Satz)
Eine Aktion lässt sich **auf das Video** ziehen und läuft dann **während** des Videos im Werbeband
(FA-20); die gebaute, aber nirgends montierte `EinblendungAnsicht` wird angebunden.

## User-Befund (15.10.2026, wörtlich)
„man kann immer noch nicht die aktionen zwischen frames einfügen per drag and drop sondern nur vor und
nach dem video" – auf Rückfrage: **„band parallel"**.

## Fund (am Code nachgelesen)
- `composer/einblendung-ansicht.tsx` (#253/M7-60) bearbeitet das Werbeband EINES Video-Elements
  (Band-Vorlage wählen, Abschnitte anlegen/ordnen); die Logik liegt in `einblendung-bearbeiten.ts`
  (#129). Sie ist **nicht montiert** – `composer/index.tsx:424` zeigt nur den Platzhalter
  „… die Einblendungs-Ansicht (M7-61) ist hier noch nicht angebunden." (Familie „fertige Funktion ohne
  Aufrufer").
- Das Ablegen aus der Bibliothek landet nur **sequenziell** (Kante zwischen Blöcken, #412/#417); es gibt
  **kein** Drop-Ziel auf dem Video-Block.

## Modul & Datei
- Modul: `composer` (Renderer); Vertrag AD 4.5, TK **9.7.7** + 9.7.6
- Betrifft: `src/renderer/composer/index.tsx` (Montage + DnD), `einblendung-ansicht.tsx` (montieren),
  `zeitleiste.tsx` (Drop-Ziel auf den Video-Block), ggf. `einblendung-bearbeiten.ts` (#129) für
  „Abschnitt aus Aktion anhängen".

## Verbindliche Regeln (aus AD 4.5 / TK 9.7.7 – NICHT neu erfinden)
- Das Band hängt an **genau einem** Video-Element (`bandVorlageId` + `abschnitte`), TK 9.2.8; die
  Elementdauer des Videos ändert das Band **nie**.
- Eine auf das Video gezogene Aktion wird **Band-Abschnitt** – über die **bestehenden**
  `einblendung-bearbeiten`-Operationen (#129), **kein** zweiter Schreibweg.
- Die Aufnahme ist eine Sicht-Korrektur über den Wrapped-Zugang (#243) → **ein** Undo-Schritt.
- Wechselwirkung mit #422: ein Projekt hat **genau ein** Video; das Band sitzt an diesem.

## Nicht selbst entscheiden – STOPP und fragen
- **Startdauer** eines per Drag angehängten Band-Abschnitts: Standard-Segmentdauer des Projekts,
  Standarddauer der Aktion oder ein fester Wert? Vor dem Bauen festlegen.
- **Band-Vorlage**, wenn noch keine am Video gewählt ist: die erste wählbare (M7-60-Startentwurf) oder
  erst die Ansicht öffnen und wählen lassen?
- **Drop-Ziel-Vertrag:** Was passiert, wenn eine Aktion auf ein **Aktions**-Segment (nicht das Video)
  gezogen wird – abweisen (Kante wie bisher) oder anderes Verhalten?

## Definition of Done
- [ ] Die Band-Bearbeitung ist am Video-Element erreichbar (kein Platzhalter-Hinweis mehr).
- [ ] Eine aus der Bibliothek auf das **Video** gezogene Aktion wird Band-Abschnitt; das Band läuft
      parallel (in der Vorschau sichtbar), die Elementdauer bleibt die des Videos.
- [ ] Die Aufnahme ist EIN Undo-Schritt (Cmd+Z).
- [ ] Suite grün; Typecheck/Lint 0.
- [ ] Treiber-Messung am echten Fenster (keine User-Abnahme).

## Abhängigkeiten
- Blockiert von: #422 (ein Video, Bibliothek „Video")
- Bezug: AD v1.7 (4.5, FA-20), TK v3.22 (9.7.7, 9.2.8), #253/M7-60/#129, #249
