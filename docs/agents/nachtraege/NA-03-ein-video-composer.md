### Issue NA-03 (= #422): [composer] Ein Projekt – ein Video: „Video importieren", Video-Bereich, automatische Übernahme, Ersetzen mit Bestätigung

## Ziel (in einem Satz)
Der Projekt-Editor (Reiter [Zusammenstellen]) behandelt **genau ein Video** je Projekt: der Knopf heißt
„Video importieren", die Bibliothek zeigt unter „Video" das eine Video, ein neu importiertes Video steht
sofort in der Wiedergabeliste, und ein erneuter Import ersetzt das vorhandene Video nach Bestätigung.

## User-Befund (15.10.2026, wörtlich, User-Abnahme der Kernachse)
„statt medien importieren sollt[e] im projekt editor video importieren und das sollte teil des
projekterstellens sein. außerdem muss ich das video aus irgendeinem grund zur liste hinzufügen"
„wobei im composer soll es nicht die möglichkeit geben ein video zu wechseln weil es soll nur eins pro
projekt geben"

## Entscheidungen (User, 15.10.2026 – nachgezogen in AD v1.7 / TK v3.21)
- **Genau ein Video pro Projekt** (neben beliebig vielen Aktions-Segmenten). Überstimmt AD v1.6
  FA-01/FA-03/FA-05; jetzt AD v1.7 (4.9, FA-01) und TK v3.21 (9.7.6).
- **Durchsetzung NUR in der Oberfläche.** Kein neuer Fehlercode, keine neue Main-Invariante; der
  `project-store` bleibt tolerant (TK 9.7.6, vierter Punkt).
- Liegt schon ein Video vor, **ersetzt** ein erneuter Import es **mit Bestätigung** (Dateiwirkung,
  AD 4.9).

## Modul & Datei
- Modul: `composer` [P3] (Renderer)
- Betrifft:
  - `src/renderer/composer/index.tsx` (Kopf-Knopf „Medien importieren", Import-Aufruf)
  - `src/renderer/composer/bibliothek-ansicht.tsx` (Bereiche „Medien"/„Aktionen", Medienzeile mit
    „Zur Liste hinzufügen")
  - `src/renderer/composer/medien-import.ts` (bereits `nurTyp: 'video'`, `einzel` – unverändert)
- Vertrag: AD v1.7 **4.9**, TK v3.21 **9.7.6**

## Fund (am Code nachgelesen)
- `composer/index.tsx:529-535` – Kopf-Knopf heißt „Medien importieren", ruft `importiere`.
- `composer/bibliothek-ansicht.tsx:60-63` – „Medien importieren"; Zeile 139-141 je Medienzeile der
  Knopf „Zur Liste hinzufügen".
- `composer/medien-import.ts:102-106` – importiert **bereits genau ein Video** (`nurTyp: 'video'`,
  `einzel`). Die Beschriftung „Medien" ist damit falsch, nicht die Funktion.

## Verbindliche Regeln (aus AD 4.9 / TK 9.7.6 – NICHT neu erfinden)
- Der Kopf-Knopf **und** der Knopf der Bibliothek heißen **„Video importieren"**.
- Der Medien-Bereich der Bibliothek heißt **„Video"** und zeigt **das eine** Video (Bezeichnung, Dauer)
  mit **Import** und **Löschen**; ein „Zur Liste hinzufügen" entfällt **für das Video** (es ist bereits
  Inhalt). Der **Aktionen**-Bereich bleibt unverändert (Aktionen weiterhin per Klick/Drag).
- Ein neu importiertes Video wird **automatisch ans Ende der Wiedergabeliste** gestellt – über den
  bestehenden Weg `fügeElementHinzu` (#123/#41), **kein** zweiter Einfügeweg.
- **Kein** Bedienweg zu einem zweiten Video.
- Der Import bleibt der bestehende Auftrag über den Torwächter (`nurTyp: 'video'`, TK 9.3) – kein
  direktes `media-service`-Aufrufen.

## Nicht selbst entscheiden – STOPP und fragen
- **Undo-Semantik des Ersetzens.** AD 4.9 sagt: der Import ist **nicht** rückgängig zu machen
  (Dateiwirkung). Der Listenteil (altes Element entfernen + neues ans Ende) läuft aber über den
  Undo-fähigen Sicht-Schreiber (`sichtSchreiber`, #415/#421) und erzeugte so **einen** Schritt.
  Vor dem Bauen klären: Ersetzen als **ein** Undo-Schritt oder Historien-Leerung?
- **Verhalten „Löschen" des Videos.** Heute blockiert Medien-Löschen bei Referenz
  (`asset_referenziert`, TK 9.4.6). Soll das Video-Löschen die Listenzelle mitbereinigen (und die
  Undo-Naht nutzen) oder weiter blockieren? Klären, bevor gebaut wird.
- **Form der Bestätigung.** Eigener Dialog über die bestehende `ComposerLage`/Dialog-Mechanik
  (`verwaltung-montage`-Muster) oder ein Inline-Hinweis – nicht raten.

## Definition of Done
- [ ] Kopf-Knopf und Bibliothek heißen „Video importieren".
- [ ] Bibliothek zeigt unter „Video" genau das eine Video; „Zur Liste hinzufügen" dafür entfällt.
- [ ] Import stellt das Video automatisch ans Listenende (Treiber: Import -> 1 Element mehr).
- [ ] Bei vorhandenem Video: Bestätigung, danach genau **ein** Video im Projekt (Treiber: weiterhin 1).
- [ ] Kein zweiter Video-Weg in der Oberfläche.
- [ ] Suite grün; Typecheck/Lint 0.
- [ ] Treiber-Messung am echten Fenster (Regel: Treiber-Beleg ist **keine** User-Abnahme).

## Abhängigkeiten
- Blockiert von: – (Basis steht: #407/#418)
- Blockiert: **#423** (der Anlege-Weg nutzt denselben Import + die automatische Übernahme).
- Bezug: AD v1.7 (4.9, FA-01, FA-03, FA-05), TK v3.21 (9.7.6), #418
