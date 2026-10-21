# UI-Ausrichtung Projekteditor (Notiz vom 21.10.2026)

> **Status: Notiz zur Leitlinie des Schnitts „Oberfläche 2.0".** Keine AD-/TK-Aenderung, kein
> Umbau, kein eigenes Bau-Issue. **Zuordnung (User, 21.10.2026):** Die Richtung gehoert zum
> Schnitt „Oberfläche 2.0" - Heimstatt ist
> [`docs/agents/oberflaeche-2-0-plan.md`](oberflaeche-2-0-plan.md), Abschnitt 6.
> Quelle: muendliche Vorgabe des Users am 21.10.2026. Woertlich festgehalten, weil die
> Richtung sonst in der naechsten Sitzung verloren geht.

## Die Vorgabe (sinngemaess)

Im **Projekteditor** (Reiter „Zusammenstellen") sollen **Bilder- und Videoverwaltung nicht
der Fokus** sein. Der Fokus soll liegen auf:

1. **Aktionsverwaltung** - Aktionen sehen, pflegen, auswaehlen.
2. **Einfuegen** - eine Aktion schnell und verstaendlich in die Wiedergabeliste bringen.
3. **Gute Aktionen erstellen** - der Weg von der Idee zur brauchbaren Aktion (Titel, Text,
   Preis, Bild, Dauer) ist die eigentliche Arbeit.
4. **Eventuell Videobearbeitung** - als moeglicher Schwerpunkt, aber nachrangig und
   ausdruecklich „evtl.".

Begruendung des Users, woertlich: **„so macht die ui keinen sinn"** - gemeint ist die
heutige Gewichtung: Die Medien-Galerie/Bibliothek nimmt sichtbar viel Raum ein, waehrend
die taegliche Arbeit (Aktionen erstellen, einfuegen, anordnen) daneben klein wirkt.

## Was das NICHT ist

- **Keine Streichung** von Bildern/Videos: Medien werden weiter importiert und in Aktionen
  referenziert (FA-01, `Aktion.bildRef`). Sie sind **Mittel**, nicht der Zweck der Ansicht.
- **Keine neue Anforderung an den Render** und keine Aenderung an AD/TK.
- **Keine Entscheidung ueber das Layout.** Die Notiz beschreibt eine Richtung, nicht
  konkrete Panels, Groessen oder Reihenfolgen.

## Was daraus vor einem Umbau werden muss

Die Notiz ist **kein eigener Auftrag**. Sie ist Abschnitt 6 des Plans
[`oberflaeche-2-0-plan.md`](oberflaeche-2-0-plan.md). Daraus wird erst etwas, wenn:

1. **Entscheidung** mit dem User: Welche Flaechen bleiben immer sichtbar, welche werden
   eingeklappt/verschoben? Wo lebt die Medienverwaltung dann (Dock, Dialog, sekundaerer
   Reiter)?
2. **AD/TK nachziehen**, falls die Aenderung eine dokumentierte Zusage beruehrt (z. B.
   TK 9.7 / 9.14.1 zur Zusammenstellung, FA-02/FA-03 zur Aktionspflege).
3. **Erst dann** ein Issue mit Signaturblock und Dateiliste - nach der Regel des Projekts
   „kein Umbau ohne Plan" (Lehre aus #432).

## Beruehrte Stellen (Bestandsaufnahme, nur zur Orientierung)

- `src/renderer/composer/` - Wurzel, `bibliothek-dock.tsx`, `galerie-bereich.tsx`,
  `bibliothek-ansicht.tsx`, `zeitleiste.tsx`.
- `src/renderer/action-editor/` - der Weg „gute Aktion erstellen".
- `src/renderer/app-shell/` - Reiter und Rahmen (fuenf Reiter, TK 9.14.1).

Die Nennung ist **keine Datei-Freigabe** fuer einen Umbau; sie zeigt nur, wo die Richtung
spaeter ansetzen wuerde.

## Offene Fragen (nicht entschieden)

- Ist die Medienverwaltung ein **Dock** (immer erreichbar, klein) oder ein **eigener
  Zustand** (nur beim Import)?
- Soll der Aktions-Editor aus dem Projekteditor heraus **ohne Reiterwechsel** erreichbar
  sein („gute Aktionen erstellen" direkt am Einfuegeweg)?
- Gehoert „Videobearbeitung" (Trim, Unterbrechungen, Band) in denselben Editor oder bleibt
  sie ein eigener Modus?
