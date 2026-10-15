### Issue NA-04 (= #423): [projekt-verwaltung] Video-Import beim Anlegen eines Projekts

## Ziel (in einem Satz)
Beim Anlegen eines Projekts lässt sich neben dem Namen optional direkt ein Video importieren; nach dem
Bestätigen steht das Projekt offen und das Video liegt bereits am Ende der Wiedergabeliste.

## User-Befund (15.10.2026, wörtlich, User-Abnahme der Kernachse)
„… und das sollte teil des projekterstellens sein."

## Entscheidung (User, 15.10.2026 – nachgezogen in TK v3.21, 9.14.3)
Der **Anlegen-Dialog** wird um die Option **„Video importieren"** erweitert. Nach dem Anlegen wechselt
die App in den Reiter **Zusammenstellen** (TK-9.14.3-Invariante „Öffnen -> Zusammenstellen") und stößt
den Import an; das Video ist danach **bereits am Ende der Wiedergabeliste**.

## Modul & Datei
- Modul: `projekt-verwaltung` (Renderer, TK **9.14.3**)
- Betrifft voraussichtlich:
  - `src/renderer/projekt-verwaltung/index.tsx` (Anlegen-Dialog, Zeilen 221-258)
  - `src/renderer/projekt-verwaltung/anlegen-oeffnen.ts` / `verwaltung-montage.ts` (Wirkungen)
- Vertrag: TK v3.21 **9.14.3**

## Fund (am Code nachgelesen)
- `projekt-verwaltung/index.tsx:221-258` – der Dialog „Neues Projekt" enthält **nur** ein Namensfeld
  (`dialog-anlegen-name`) und den Knopf „Anlegen"; kein Import.
- Der Import läuft im Composer (`composer/medien-import.ts`) und braucht ein **geladenes** Projekt;
  die Projektverwaltung baut **keinen** zweiten Importpfad (TK 9.14.3).

## Verbindliche Regeln (aus TK 9.14.3 – NICHT neu erfinden)
- Der Import ist **optional**: ohne gewähltes Video verhält sich das Anlegen wie heute.
- Der Import nutzt **denselben** Weg wie der Composer-Knopf (media-service 9.4, composer 9.7.6) –
  **kein** zweiter Importpfad in der Projektverwaltung.
- Nach dem Anlegen: Projekt offen im Reiter **Zusammenstellen**, Video **am Ende der Wiedergabeliste**.
- Das ist abhängig von **NA-03** (Video-Bereich/„Video importieren"/automatische Übernahme).

## Nicht selbst entscheiden – STOPP und fragen
- **Ablauf-Reihenfolge.** Anlegen, dann Import, dann Reiterwechsel – oder Import-Auswahl vor dem
  Anlegen und danach sofort einreihen? Vor dem Bauen mit dem User festlegen (bestimmt den Effekt bei
  einem fehlgeschlagenen Import: Projekt ohne Video bleibt bestehen oder nicht).
- **Fehlerfall Import.** Schlägt der Import fehl (beschädigte Datei, Abbruch), bleibt das angelegte
  Projekt bestehen (leer) – oder wird es zurückgenommen? Nicht raten.

## Definition of Done
- [ ] Der Anlegen-Dialog bietet „Video importieren" (optional).
- [ ] Ohne gewähltes Video: Anlegen wie heute.
- [ ] Mit gewähltem Video: nach dem Anlegen ist das Projekt offen (Reiter Zusammenstellen) und das
      Video steht am Ende der Wiedergabeliste (Treiber: neu angelegtes Projekt hat 1 Video-Element).
- [ ] Kein zweiter Importpfad in der Projektverwaltung (Import über den bestehenden Weg).
- [ ] Suite grün; Typecheck/Lint 0.
- [ ] Treiber-Messung am echten Fenster (keine User-Abnahme).

## Abhängigkeiten
- Blockiert von: **#422** (Composer-Import + automatische Übernahme)
- Bezug: AD v1.7 (4.9, FA-01, FA-10), TK v3.21 (9.14.3)
