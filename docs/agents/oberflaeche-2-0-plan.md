# Plan „Oberfläche 2.0" – Welle 1: die Kernachse (CapCut-Schnitt)

**Status:** Angelegt 14.10.2026. Welle 1 auf GitHub: #411 (position-Vertrag) → #412
(Spalten-Drop) + #413 (Drag-Quellen) parallel → #414 (Vorschau-Zentrum) → Abnahme
(Treiber-Lauf am echten Fenster).
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
