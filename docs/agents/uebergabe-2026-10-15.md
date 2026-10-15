# Uebergabe – Session 15.10.2026 (Kernachse-Nachzuege #416–#421)

> Fuer die naechste Sitzung: Lies zuerst CLAUDE.md (STAND HEUTE), dann diese Datei.

## Erledigt und gemergt (alle auf lokal `main`)

Alle SECHS Nachzuege der Kernachse sind gebaut UND am echten Fenster (Treiber) gemessen.

| Thema | Ergebnis | Belege |
|---|---|---|
| **#417 Drag-Quellen** | Medien (Bild/Video) sind KEINE Drag-Quelle mehr; einzige Quelle ist die Aktionszeile. User-Weisung 15.10.: Drag&Drop ist fuer AKTIONEN (und spaeter Banner) gedacht. | Merge `5ea9f68`; Specs drag-quellen |
| **#417 Kanten-Einfuegen** | Drei gemessene Ursachen: (1) `onDragOver` feuert nur beim Zielwechsel -> Messung lief einmal bei dx=0, JEDER Drop an Kante 0; Fix `onDragMove`. (2) Koordinaten-Mismatch (Modellgrenzen vs. Layout mit Kante+Luecken) -> `KANTEN_VORSCHUB_PX = 14`. (3) wechselnde Kantenbreite verschob die Nachbarn -> aktiv breiter, aber layoutneutral (Breite + negative Raender). | Treiber 4f: Aktion 2 -> 3 Bloecke, Position 2, Cmd+Z 1 Schritt |
| **#419 Videostage/Play** | Buehne kollabierte auf Hoehe 0: der Reiter-Wrapper (`rahmen.tsx`) hatte keine definite Hoehe; die alte Zeilen-Anordnung lieh der Vorschau die Hoehe vom Composer. Fix: Wrapper `height:100%` + Vorschau-Wurzel als Flex-Spalte. **Play war nie kaputt** (currentTime/Frame liefen). | Merge `8de0f93`; Treiber 4b3: Kasten 768x151, Video 268x151 |
| **#418 Import/Auswahl** | Optionaler Dialog-Parameter `{ nurTyp, einzel }` (Nachtrag #81, rueckwaertskompatibel; Bild-Weg unberuehrt) -> Composer laedt genau EIN Video. Neues Feld `gewaehltesMediumId` in der ComposerLage + Hervorhebung in Galerie/Bibliothek. | Merge `a7732f3`; Treiber 4b3: `data-ausgewaehlt=true` |
| **#420 Kontextmenue Zeitleiste** | ZeilenBlock traegt `data-element-id`; die Wurzel sucht EINEN Traeger-Selektor (Liste UND Zeitleiste), EIN Menue/EINE menueAdresse. | Merge `89964e8`; Treiber 4e2: Duplikat 1->2, Entfernen 2->1 |
| **#416 Aktion anlegen** | Inline-Formular im „Aktionen"-Bereich der Bibliothek (Titel + Vorlage, Marke = Standardmarke). Faehigkeit ueber `ComposerVerdrahtung.legeAktionAn` (E1, kein cross-Import). | Merge `406b68e`; Treiber 4g: Aktionen 1 -> 2 |
| **#421 Reparatur-Kette** | Alle vier Reihen ueber den Wrapped-`sichtSchreiber` (Undo); WARN-Fallback in `element-entfernen.ts` entfaellt. **Befund+behoben:** `fuehreFixAus` hatte KEINEN Aufrufer (keine Fix-Knoepfe) -> neues `reparatur-panel.tsx` + Verdrahtung. | Merge `e08a689`/`b4b17ae`; Treiber 4h: Reparatur 2 -> 1, Cmd+Z 1 Schritt |

## Zaehler auf `main` (lokal)
- **5477/5477 Tests gruen (310 Dateien)**, Typecheck/Lint 0.
- **55 Commits** ungesendet auf `origin` (Push NUR auf Anweisung).
- Untracked (bekannt): `.e2e-echt-datenort/`, `.e2e-flow-ist-datenort/`, `marken.json`, `marken.json.bak`.

## Regeln/Beobachtungen der Session
1. **Der Treiber deckte erst die WAHREN Ursachen auf** – und die Altmessung war schwach: die
   Medien-Drag-Messung vom 14.10. verglich `bloecke[1] === bloecke[0]`, beide trugen aber
   DIESELBE Referenz; die Positionspruefung war trivial wahr. Lehre: Messgroessen muessen
   UNTERSCHEIDBAR sein (hier: eine Aktion mit eigener Id statt zweimal dasselbe Medium).
2. **„Fertige Funktion ohne Aufrufer" zum wiederholten Mal:** `fuehreFixAus` (die
   Reparatur-AUSFUEHRUNG) hatte keinen Knopf. Gefunden erst, als der Treiber-Beleg gebaut
   werden sollte.
3. **Layout-Prozenthosen brauchen eine definite Kette:** `height:100%` loest gegen einen
   Elternteil ohne definite Hoehe auf `auto` auf (Buehne 0).
4. **#289-Flaky** fiel im Volllauf (einzeln gruen) – beobachten.
5. Sprach-Scan nach jedem Schreiben; kurze Einheiten.

## Naechste Sitzung
1. **User-Abnahme der Kernachse** (#416–#421 sind offen; Regel: Treiber-Beleg = keine Abnahme).
2. Danach **Welle 2: Banner-Spur** und die **#371-Klaerung** (verworfene Reflog-Aera; die
   Plan-Quelle `trennung-banner-aktionen-plan.md` FEHLT im Repo).
3. Aufraeum-Rest: gemergte Branches (`bau/411-*` … `bau/421-*`) koennen geloescht werden;
   #215 bleibt Werkzeug-Limit.

## Beim User
- Push nur auf ANWEISUNG (55 Commits).
- Optische Abnahme #327 weiterhin offen.
- #371/#365-#370 (Banner-Kette): DNS freigeben ODER MAX-Veraenderung (fehlende Plan-Datei).
