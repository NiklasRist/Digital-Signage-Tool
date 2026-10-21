# Plan „Oberfläche 2.0" – Welle 1: die Kernachse (CapCut-Schnitt)

**Status:** Angelegt 14.10.2026. Welle 1 auf GitHub: #411 (position-Vertrag) → #412
(Spalten-Drop) + #413 (Drag-Quellen) parallel → #414 (Vorschau-Zentrum) → Abnahme
(Treiber-Lauf am echten Fenster).

**NACHTRAG 14.10. (Konvertierung, User-Weisung):** Die zuletzt geschlossenen Issues gelten
als TEILWEISE erfuellt; die Reste sind AUS DEN ELTHERN heraus als eigene Nachzugs-Issues
gefuehrt (#416-#421), mit Herkunft-Kommentaren an den Eltern (#408, #412, #415,
Aktions-Import-Preview-Ketten). Die Kernachse gilt ERST, wenn alle sechs Nachzuege
(#416, #417, #418, #419, #420, #421) erledigt sind. Treiber-Abgleich: siehe
`docs/agents/basis-abgleich-2026-10-14.md`.
**Quelle der Was-Frage:** User-Anforderung (14.10., wörtlich): „das Video im Zentrum… die Aktion kannst du einfach per Drag and Drop zwischen Frames einfügen. Das ist die wichtigste Funktion überhaupt."
**Referenz-Look:** CapCut / Canva / Clipchamp – Vorschau im Zentrum, Zeitleiste unten, Bibliothek als Dock.

---

## 1. Der User-Satz als Ziel

Heute: Elemente werden per Klick **ans Ende** angehängt (`fuegeElementHinzu` #123/#41, ohne Position,
„ANS ENDE, ohne Einfuegeposition", TK 9.11.3) und müssen danach manuell verschoben werden
(#122-Reorder auf dem fertigen Element). **Einfügen zwischen zwei bestehenden Blöcken ist heute
keine Operation der Oberfläche.**

Ziel: Jede Lücke zwischen zwei Zeitleisten-Blöcken (plus vor der ersten/nach der letzten) ist ein
Drop-Ziel. Zieht man eine Aktion oder ein Medium aus der Bibliothek auf den Spalt, wird das Element
**genau dort** erzeugt – nicht ans Ende und verschoben, sondern direkt an der Position.

## 2. Ist-Zustand (gemessen am Code, 14.10., Stand `bb2c22c`)

| Baustein | Datei | Stand |
|---|---|---|
| Zeitleiste | `src/renderer/composer/zeitleiste.tsx` | Horizontale Blöcke, Breite ∝ Dauer (8 px/s), Reorder per dnd-kit (`ordneNeuOptimistisch` #122, optimistisch). KEINE Drop-Ziele zwischen Blöcken. Blöcke ohne Thumbnails, ohne Playhead. |
| Einfügen | `src/renderer/composer/element-hinzufuegen.ts` (#123), Main `project-store/fuege-element-hinzu.ts` (#41) | Nur am-Ende-Anhängen; UUID vergibt der Main (TK 9.11.4); **nicht optimistisch** (bewusst, TK 9.7.3). |
| Vorschau | `preview-player` | Vorhanden und belegt (#342/#347), steht aber randseitig klein. |
| Bibliothek/Galerie | `bibliothek-ansicht.tsx` (#407), `asset-galerie.tsx` | Klick-Knopf-Anlege-Weg; Galerie (#390) offen. Keine Drag-Quelle zur Timeline. |
| Banner-Spur | – | **FEHLT KOMPLETT**: das Datenmodell (BannerSchild, #365) existiert nicht; TK im Repo steht v3.20; die BA-Familie #365–#373 gehört zur dokumentierten, aber code-seitig nicht begonnenen Linie. |

## 3. Die zwei Weichen (ENTSCHIEDEN durch den User, 14.10.2026)

**Weiche A – Wie kommt das Element an seine Position? → Variante A (position-Parameter).**
- **ENTSCHIEDEN (Variante A):** Neuer optionaler Parameter `position?: number` auf dem existierenden
  Weg `project:fügeElementHinzu`. Eine Mutation, ein Undo-Schritt, atomar; der Main verschiebt den
  Rest. Vertragsänderung: Signatur von #41/#123 wird UM EINEN OPTIONALWERT ergänzt (bestehende
  Aufrufer unverändert gültig). Der Nachtrag wird als Issue an #41/#123 gehängt, die Verträge
  (TK 9.5.2 Operationstabelle, 9.11.3 „kein position-Feld am ELEMENT" – ein Einfüge-INDEX ist KEIN
  position-Feld, dieser Nachtrag wird im TK-Text durchgeführt) werden nachgezogen.
- Variante B (Anhängen + sofortiger `ordneNeu`-Ruf #122) ist VERWORFEN: zwei Aufrufe, zwei
  Undo-Einträge, sichtbare Zwischenlage (Element erscheint kurz am Ende), eigener Rollback-Fall.

**Weiche B – Umbau der Composer-Wurzel: → Die Zeitleiste wird primär.**
Zeitleiste unten ist DAS Eingabefeld; die heutige `Wiedergabeliste` (#248-Liste) bleibt bis zur
Abnahme von Welle 1 als Reiter/Fallback erreichbar.

## 4. Wellen

**Welle 1 – die Kernachse (Scope laut User, 14.10.):**
1. **#411 [project-store] Vertrag:** `fügeElementHinzu(referenz, position?)` – Signatur-Nachtrag
   an #41/#123 (Weiche A: Variante A).
2. **#413 [composer] Drag-Quellen:** Bibliothek/Galerie-Karten tragen `referenz`-Drag-Daten.
3. **#412 [composer] Spalten-Drop:** Jede Einfüge-Lücke zwischen Blöcken ist ein `useDroppable`-
   Ziel (dnd-kit, bereits im Projekt); beim Drop wird mit der Lücken-Index-Position eingefügt.
4. **#414 [composer] Vorschau-Zentrum:** Bibliothek links, Video mittig, Zeitleiste unten über
   volle Breite; die #248-Zeilen-Liste bleibt als Reiter/Fallback (Weiche B).
5. **Abnahme:** Der Treiber (`npm run durchlauf`) misst am echten Fenster:
   Drag aus Bibliothek auf Spalt 2 von 3 → Liste 3 → 4 Zeilen, Position 2 ist das neue Element;
   Undo (Strg/Cmd+Z #350) nimmt GENAU EINEN Schritt zurück.

**Welle 2** (danach, nicht in Welle 1): Banner-Spur (zweite Zeitleisten-Spur, gleiche Zeitachse) –
setzt die BA-Familie #365+ voraus (Datenmodell BannerSchild) UND die Klärung, ob die Banner-Linie
nach dem TK-Stand v3.20 gebaut wird (Plan-Dokument fehlt im Repo).
**Welle 3** (Optik): Zoom der Zeitleiste, Thumbnails in den Blöcken, Playhead mit Wiedergabe-Mitscroll.

## 5. Verträge, die Welle 1 berührt

- `project:fügeElementHinzu` (#41/#123) – Signatur-Nachtrag (optionaler Parameter).
- TK 9.7.3: Hinzufügen bleibt NICHT optimistisch (UUID vom Main) – der Spalt-Drop wartet auf die
  UUID; die Lücke zeigt waehrend der Wartezeit eine Lade-Markierung.
- Undo (#243/#350): Einfügen ist EIN Historien-Eintrag (kritisches Kriterium der Abnahme).
- Versicherungs-Regel aus #123 bleibt: KEIN Vorfiltern, KEINE Entdopplung, UUID nie im Renderer.

---

## 6. Leitlinie 21.10.2026 - der Fokus des Projekteditors

**Quelle:** User-Vorgabe vom 21.10.2026 (muendlich). **Status:** Leitlinie fuer diesen
Schnitt, **keine AD-/TK-Anforderung** und kein Umbau-Auftrag. Volltext, Abgrenzung und
offene Fragen: [`docs/agents/ui-ausrichtung-projekteditor-2026-10-21.md`](ui-ausrichtung-projekteditor-2026-10-21.md).

**Die Vorgabe, sinngemaess:** Im Projekteditor (Reiter „Zusammenstellen") sollen **Bilder-
und Videoverwaltung nicht der Fokus** sein. Fokus sind:

1. **Aktionsverwaltung** (Aktionen sehen, pflegen, auswaehlen),
2. **Einfuegen** (Aktion schnell und verstaendlich in die Wiedergabeliste),
3. **gute Aktionen erstellen** (Titel, Text, Preis, Bild, Dauer),
4. **evtl. Videobearbeitung** (nachrangig).

Begruendung woertlich: **„so macht die ui keinen sinn"** - die heutige Gewichtung stellt die
Medien-Galerie sichtbar in den Vordergrund, waehrend die taegliche Arbeit daneben klein wirkt.

**Was das fuer die Wellen bedeutet (Vorschlag, nicht beschlossen):**

- **Welle 1 bleibt unveraendert** - der Spalt-Drop und die Vorschau im Zentrum sind
  ausdruecklich Teil des „Einfuegens" und damit vom Fokus gedeckt.
- **Medienverwaltung wird Mittel, nicht Flaeche:** Galerie/Bibliothek bleiben erreichbar
  (Import, Auswahl fuer `Aktion.bildRef`), bekommen aber keinen gleichrangigen Dauerplatz.
  Ob Dock, einklappbarer Bereich oder eigener Zustand, ist **offen**.
- **Der Weg „gute Aktion erstellen" bekommt Eigengewicht** (Aktions-Editor aus dem
  Projekteditor erreichbar, ohne Reiterwechsel?) - **offen**.
- **Eine neue Welle** fuer diese Umgewichtung ist erst nach der Entscheidung zu schneiden.

**Die drei offenen Fragen (unverändert, s. Notiz):** Medien als Dock oder eigener Zustand?
Aktions-Editor ohne Reiterwechsel? Videobearbeitung im selben Editor oder eigener Modus?

**Regel:** Erst Entscheidung, dann AD/TK-Nachtrag, dann Issue mit Signaturblock und
Dateiliste - kein Umbau ohne Plan (Lehre aus #432).
