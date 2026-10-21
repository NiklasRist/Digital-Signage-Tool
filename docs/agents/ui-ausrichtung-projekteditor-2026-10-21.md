# UI-Ausrichtung Projekteditor (Notiz vom 21.10.2026)

> **Status: Notiz zur Leitlinie des Schnitts „Oberfläche 2.0".** Keine AD-/TK-Aenderung, kein
> Umbau, kein eigenes Bau-Issue. **Zuordnung (User, 21.10.2026):** Die Richtung gehoert zum
> Schnitt „Oberfläche 2.0" - Heimstatt ist
> [`docs/agents/oberflaeche-2-0-plan.md`](oberflaeche-2-0-plan.md), Abschnitt 6.
> **KORREKTUR 21.10.2026 (User):** Der Fokus sind **Aktionen und Banner**. Die
> Medienverwaltung ist nur die ABGRENZUNG ("kein Fokus"), kein eigener Schwerpunkt - die
> erste Fassung dieser Notiz hat sie zu breit behandelt.

## Die Vorgabe

Im **Projekteditor** (Reiter „Zusammenstellen") liegt der Fokus auf **Aktionen und Banner**:

1. **Aktionsverwaltung** - Aktionen sehen, pflegen, auswaehlen.
2. **Einfuegen** - eine Aktion schnell und verstaendlich in die Wiedergabeliste bringen.
3. **Gute Aktionen erstellen** - der Weg von der Idee zur brauchbaren Aktion (Titel, Text,
   Preis, Bild, Dauer) ist die eigentliche Arbeit.
4. **Banner** - die Banner-Linie des Projekts (zweite Zeitleisten-Spur / `BannerSchild`,
   BA-Familie #365+; im Plan die bisherige **Welle 2**).
5. **Eventuell Videobearbeitung** - als moeglicher Schwerpunkt, aber nachrangig und
   ausdruecklich „evtl.".

**Bilder und Videos sind ein Teil der AKTION.** Eine eigene Bilder-/Videoverwaltung
(Galerie/Bibliothek als eigener Bereich) entfaellt als Flaeche: Bild aussuchen und
importieren geschieht dort, wo die Aktion entsteht bzw. bearbeitet wird.

Begruendung des Users, woertlich: **„so macht die ui keinen sinn"** - die heutige Gewichtung
stellt die Medien-Galerie sichtbar in den Vordergrund, waehrend die taegliche Arbeit
(Aktionen erstellen, einfuegen, Banner setzen, anordnen) daneben klein wirkt.

## Entschieden (User, 21.10.2026)

1. **„Banner" = die Banner-Spur / `BannerSchild`-Linie** (BA-Familie #365+, Plan-Welle 2).
   Welche Vertragslinie verbindlich ist (TK-Stand vs. BA-Familie), bleibt eine eigene,
   spaetere Entscheidung - die BEDEUTUNG ist geklaert.
2. **Das EINE Projektvideo behaelt einen schmalen Import/Ersetzen-Weg** (FA-01/#422) - es
   ist kein Aktionsbild. Die Galerie als Flaeche entfaellt trotzdem; der Video-Import bleibt
   ein kleiner Bedienschritt (Projekt anlegen, "Video importieren").

## Was das NICHT ist

- **Keine Streichung der Medien als DATEN:** `Aktion.bildRef`, das Projektvideo, die
  Bilddateien im Projekt und der Render bleiben unveraendert.
- **Gestrichen wird die eigene Verwaltungsflaeche**, nicht die Faehigkeit, ein Bild
  zuzuordnen oder zu importieren.
- **Keine neue Anforderung an den Render** und keine Aenderung an AD/TK.
- **Keine Entscheidung ueber das Layout.** Die Notiz beschreibt eine Richtung, nicht
  konkrete Panels, Groessen oder Reihenfolgen.

## Was daraus vor einem Umbau werden muss

Die Notiz ist **kein eigener Auftrag**. Sie ist Abschnitt 6 des Plans
[`oberflaeche-2-0-plan.md`](oberflaeche-2-0-plan.md). Daraus wird erst etwas, wenn:

1. **Entscheidung** mit dem User: Wird die Banner-Spur jetzt geschnitten? Welche Banner-Linie
   gilt (TK-Stand v3.20 vs. BA-Familie #365+)? Welche Flaechen bleiben immer sichtbar?
2. **AD/TK nachziehen**, falls die Aenderung eine dokumentierte Zusage beruehrt (z. B.
   TK 9.7 / 9.14.1 zur Zusammenstellung, FA-02/FA-03 zur Aktionspflege, Banner-Vertrag).
3. **Erst dann** ein Issue mit Signaturblock und Dateiliste - nach der Regel des Projekts
   „kein Umbau ohne Plan" (Lehre aus #432).

## Beruehrte Stellen (Bestandsaufnahme, nur zur Orientierung)

- `src/renderer/composer/` - Wurzel, `zeitleiste.tsx`, `bibliothek-dock.tsx`,
  Einfuege-Wege.
- `src/renderer/action-editor/` - der Weg „gute Aktion erstellen".
- Banner-Spur / `BannerSchild` - heute **nicht gebaut** (BA-Familie #365+; Plan-Welle 2).
- `src/renderer/app-shell/` - Reiter und Rahmen (fuenf Reiter, TK 9.14.1).

Die Nennung ist **keine Datei-Freigabe** fuer einen Umbau; sie zeigt nur, wo die Richtung
spaeter ansetzen wuerde.

## Offene Fragen (nicht entschieden)

- **Bild-Import:** Dass er beim Aktions-Editor liegt, ist bestaetigt; offen ist die konkrete
  Form (Feld im Editor, kleiner Dialog, Drag aus dem Dateisystem).
- **Banner:** Die BEDEUTUNG ist geklaert (Banner-Spur). Offen: welche Vertragslinie gilt
  (TK-Stand vs. BA-Familie #365+), und ob die Spur jetzt geschnitten wird.
- Soll der Aktions-Editor aus dem Projekteditor heraus **ohne Reiterwechsel** erreichbar
  sein („gute Aktionen erstellen" direkt am Einfuegeweg)?
- Gehoert „Videobearbeitung" (Trim, Unterbrechungen, Band) in denselben Editor oder bleibt
  sie ein eigener Modus?
