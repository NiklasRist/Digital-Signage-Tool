# Uebergabe – Session 14.10.2026 (Teil 2: Oberflaeche-2.0-Welle 1 + Undo-Naht + Nachzugs-Konvertierung)

> Fuer die naechste Sitzung: Lies zuerst CLAUDE.md (STAND HEUTE), dann diese Datei.

## Erledigt und gemergt (alle auf lokal `main`)

| Thema | Ergebnis | Belege |
|---|---|---|
| **#274 geschlossen** | Bootstrap-Verdrahtung 7/7 war seit 05.10. faktisch erledigt (Code-Kommentar-Beleg "mit #274 verdrahtet"); Schluss-Nachweis gegen den gebauten Code, Start-Re-Test (`npm run dev` ohne Absturz), Spec-Reihe 20/20 | Issue-Kommentar, #274-Kommentar |
| **Plan "Oberflaeche 2.0"** | `docs/agents/oberflaeche-2-0-plan.md`; Weichen vom User entschieden: **(A) position-Parameter** (Variante A statt Anhängen+Reordern), **(B) Zeitleiste primaer** (#248-Liste wird Fallback hinter Umschalter) | Plan-Datei |
| **#411 (position)** | `fuegeElementHinzu(referenz, position)` in Main/Gateway/Renderer; ohne `position` byte-identisch; ein Undo-Schritt | Commits `a25211a`+Merge; Nachtraege an #41/#123 |
| **#412 (Spalten-Drop)** | NEU `spalt-drop.ts` (verbindlich: baueEinfugeKanten/waehleKanteAus; gemeldete Helfer: leseKantenIndex/liestReferenz), Kanten in der Zeitleiste, erscheinen ERST im laufenden Drag | Commit `23f86ea`; Spec 12 Tests |
| **#413 (Drag-Quellen)** | Bibliothek/Galerie je `useDraggable` (id `quelle-<art>-<id>`, Daten exakt `{ referenz }`); Klick-Weg unangetastet | Commit am Branch |
| **#414 (Vorschau-Zentrum)** | Videostage OBEN zentriert, Composer UNTEN volle Breite (app-shell/inhalte.tsx: gemeldete Ausnahme), Bibliothek links (Dock), Umschalter Zeitleiste/Liste, **EIN DndContext auf der Wurzel** | Merge `1ef10da`; Treiber pageerror 0 |
| **#415 (Undo-Naht, Variante a)** | Composer-Sicht-Mutationen laufen UEBER die Wrapped-Zugangs-`setzeListe` (#244-Huelle): Pflichtparameter `sichtSchreiber` an #123/#124/#122 (+ Typ im WERT-Modul); Reparatur-Kette mit sichtbarem WARN-Fallback (Nachzug #421) | Am echten Fenster **GEMESSEN: Cmd+Z 3 -> 2 Bloecke in EINEM Schritt** nach Spalt-Drop 2 -> 3 |
| **Nachzugs-Konvertierung (User-Weisung)** | Die teilerfuellten Reste sind EIGENE Issues: **#416** (Aktion anlegen), **#417** (Drag fuer Menschen), **#418** (Import = EIN Video, standardmaessig ausgewaehlt), **#419** (Videostage/Play), **#420** (KontextMenue an der Zeitleiste - bis dato NUR in der #248-Keine-Ansicht), **#421** (Reparatur-Kette) - je HERKUNFTS-Kommentar am Elternteil (#408/#412/#415, Aktivierung-/Import-/Preview-Ketten) | Plan-Datei |

## Belege-Dateien
- **Basis-Abgleich:** `docs/agents/basis-abgleich-2026-10-14.md` - die geschlossenen
  UI-Issues sind TECHNISCH am Treiber belegt (nachgeprueft, Treiber-Messfehler aus der
  Schritt-3-Erwartung behoben); die Luecken sind die SECHS Nachzuege.
- Treiber-Protokoll: `docs/agents/oberflaeche-durchlauf.md` (paar Nachlaeufe 14.10.:
  pageerror 0; Spalt-Drop/Undo gemessen).

## Zaehlers auf `main` (lokal)
- **5462/5462 Tests gruen (308 Dateien)**, Typecheck/Lint 0.
- **40 Commits** ungesendet auf `origin` (Push NUR auf Anweisung).
- Untracked (bekannt): `.e2e-echt-datenort/`, `.e2e-flow-ist-datenort/`, `marken.json`,
  `marken.json.bak`, `docs/agents/oberflaeche-durchlauf.md`.

## Datenaufraeum (User-Entscheidung)
- Der Datenort des Treibers wurde GERAEMT: 74 Testprojekte geloescht (4.8 GB), 147
  Protokoll-Eintraege entfernt, `aktivesProjektId null, DurchlaufMarke-Seed raus
  (bleibt nur Fitnessworld24). Backup: `datenort-backup.zip` im opencode-Temp.
- **Der Treiber loescht JEDEN Lauf seine eigenen "DurchlaufTest-*"-Projekte via den
  echten `project:löscheProjekt`-Weg** (= solange die App nicht fertig ist; Wegnehmen,
  wenn fertig).

## Regel der Session (neu, an den>User-Befunden gelernt)
1. **TREIBER-BELEG ist nicht USER-ABNAHME.** Die Maussimulation hat die technischen DoDs erfuellt; die Menschenbedienung brachte die
   echten Luecken ans Licht (#416-#419). Jede Karte braucht am Ende die User-Abnahme.
2. **Teilerfuellte Issues konvertieren, nicht "trotzdem fertig" melden** (User-Weisung):
   Reste als EIGENE Nachzugs-Issues mit Herkunfts-Kommentar am Elternteil; die Eltern
   behalten das Gemessene.
3. **Die Sprach-Fehlklasse trat WIEDERHOLT auf** (Fasern/verballhornte Worte in langen
   Writes, gemessene Codepoint-Scans > U+2500, alle behoben). Regel BEIBEHALTEN: kurze
   Schreibeinheiten, Scan nach JEDEM Write, bei Fasern sofort stoppen.
4. Destruktive Aktionen NUR nach Backup + Zähl-Beleg (74 Ordner vorher gezaehlt).

## Naechste Sitzung (Reihenfolge-Vorschlag, keine Sperre)
1. **Die SECHS Nachzuege der Kernachse** - #417 (Drag menschlich bedienbar; Widerspruch
   Treiber-gruen vs. User bricht am echten Fenster LOESEN), #419 (Videostage/Play:
   Ursache MESSen), #420 (KontextMenue an der Zeitleiste), #418 (Import-Auswahl),
   #416 (Aktion anlegen), #421 (Reparatur-Kette). Danach die USER-Abnahme der Kernachse.
2. Danach das Design-Verfahren fuer die **Banner-Spur (Welle 2)**, und noch vor der
   Erledigung die #371-KLAERUNG (verworfene Reflog-Aera; die Plan-Quelle
   `trennung-banner-aktionen-plan.md` FEHLT im Repo, HALT v3.22-Zitattstand ist gesperrt).
3. Aufraeum-Rest: gemergte Branches (`bau/411-415-*`) koennen geloescht werden; #215
   bleibt Werkzeug-Limit.

## Beim User
- Push nur auf ANWEISUNG (40 Commits).
- Optische Abnahme #327 weiterhin offen.
- #371/#365-#370 (Banner-Kette): DNS freigeben ODER MAX-Veraenderung (die fehlende
  Plan-Datei im Repo muss je erzeugt ODER die Issues entfallt werden).
