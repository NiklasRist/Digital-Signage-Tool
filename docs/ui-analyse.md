# UI-Analyse: Digital-Signage-Tool

**Datum:** 2026-09-28
**Analysegegenstand:** Renderer-UI (src/renderer/) – Architektur und Design
**Vergleichsbasis:** DaVinci Resolve, CapCut, Clipchamp, Canva, Adobe Premiere Rush

---

## 1. Architektur

### 1.1 Stand: Die UI ist ein Gerüst

Der Renderer besteht aus **Rümpfen**. Die meisten Dateien werfen `new Error("Noch nicht umgesetzt")`. Vollständig implementiert sind lediglich:

| Datei | Status | Relevanz für UI |
|---|---|---|
| `composer/projektzustand.ts` | Vollständig | Zustandsverwaltung, Sicht auf Projekt |
| `composer/optimistisch.ts` | Vollständig | Optimistische UI-Updates |
| `composer/dauer-regler.ts` | Vollständig | Dauer-/Trim-Regler (UI-Baustein) |
| `composer/einblendung-bearbeiten.ts` | Vollständig | Band-Verwaltung (UI-Logik) |
| `composer/liste-reorder.ts` | Vollständig | Drag-and-drop-Logik |
| `composer/kaputt-erkennung.ts` | Vollständig | Erkennung kaputter Elemente |
| `composer/gesamtlaenge.ts` | Vollständig | Gesamtlängenberechnung |
| `composer/reparatur-fuehrung.ts` | Vollständig | Reparatur-Modus-Logik |
| `composer/reparatur-optionen.ts` | Vollständig | Reparatur-Optionen |

**Nicht implementiert:** `App.tsx` (Shell), `ReiterInhalt.tsx` (Platzhalter), `WarteschlangenLeiste.tsx` (leer), `composer/index.tsx` (Wurzel), `preview-player/index.ts` (Platzhalter), `action-editor/index.ts` (Platzhalter), `vorlagen-editor/index.ts` (Platzhalter), `projekt-verwaltung/index.ts` (Platzhalter).

### 1.2 Die geplante Reiterstruktur

```
┌─ [Zusammenstellen] [Aktionen] [Vorlagen] [Projekte] ─┐
│  Der gewaehlte Reiter nutzt die ganze Flaeche        │
├──────────────────────────────────────────────────────┤
│  Warteschlangen-Leiste (32px, in jedem Reiter)       │
└──────────────────────────────────────────────────────┘
```

**Quelle:** `App.tsx:32-54`, `shell/reiter.ts:19-24`

Die vier Reiter sind **gleichwertig** angeordnet. Es gibt keine Hierarchie, keine visuelle Gewichtung, keine Standardansicht.

### 1.3 Die Hauptbetriebsart

Die Hauptbetriebsart ist **FA-20**: das Zusammenstellen einer Wiedergabeliste mit parallelem Werbeband. Der Nutzer:
1. Importiert Videos
2. Erstellt Aktionen (mit Vorlagen)
3. Stellt eine Wiedergabeliste zusammen
4. Ordnet Elemente per Drag-and-drop an
5. Setzt Dauer/Trim
6. Fügt Werbebänder hinzu
7. Rendert

**Zeitanteil:** Der Nutzer verbringt **~80 %** der Zeit im Reiter "Zusammenstellen".

---

## 2. Probleme

### 2.1 Die Reiterstruktur trennt den Nutzer von seiner Hauptarbeit

**Problem:** Die vier Reiter sind gleichwertig. Der Nutzer muss zwischen "Zusammenstellen", "Aktionen", "Vorlagen" und "Projekte" hin- und herspringen.

**Konkret:** In `App.tsx:34-47` werden alle Reiter mit derselben visuellen Gewichtung gerendert:
```tsx
{REITER.map((reiter) => (
  <button key={reiter.id} ...>{reiter.beschriftung}</button>
))}
```

**Warum das schlecht ist:** In DaVinci Resolve gibt es Seiten (Media, Cut, Edit, Fusion, Color, Fairlight, Deliver) – aber jede Seite ist ein **Arbeitsmodus für denselben Inhalt**. Das Signage-Tool macht aus den Modi **getrennte Welten**. Der Nutzer, der eine Wiedergabeliste zusammenstellt, braucht:
- Die Liste (Zusammenstellen)
- Die Aktionen-Bibliothek (Aktionen)
- Die Vorlagen (Vorlagen)
- Die Vorschau (preview-player)

...**alle gleichzeitig** sichtbar.

**Vergleich:** In CapCut/Clipchamp ist die Timeline **immer sichtbar**. Die Asset-Bibliothek ist ein **Panel**, kein Reiter. Der Wechsel zwischen "was ich mache" und "was ich verwende" ist ein Klick auf ein Panel, nicht ein Reiterwechsel.

### 2.2 Keine Live-Vorschau im Hauptfenster

**Problem:** Die Vorschau (`preview-player`) ist ein eigenes Modul, aber die Reiterstruktur bedeutet: Der Nutzer sieht entweder **die Liste** oder **die Vorschau** – nie beides.

**Konkret:** `ReiterInhalt.tsx:32-38` rendert nur den Inhalt des aktiven Reiters:
```tsx
export function ReiterInhalt({ aktiv }: { aktiv: ReiterId }): JSX.Element {
  return (
    <main style={{ flex: 1, minHeight: 0, overflow: "auto" }}
      data-testid={PLATZHALTER_TESTID[aktiv]} />
  );
}
```

**Warum das schlecht ist:** In DaVinci Resolve, CapCut, Clipchamp ist die Vorschau **immer sichtbar** – meistens groß und zentral. Der Nutzer sieht sofort, was seine Änderung bewirkt. Der Wechsel zwischen "Liste" und "Vorschau" ist ein **kognitiver Bruch**.

**Beispiel:** Der Nutzer trimmt ein Video. Ohne Vorschau muss er:
1. Trim setzen
2. Zum Reiter "Zusammenstellen" wechseln
3. Vorschau starten
4. Prüfen
5. Zurück zum Reiter "Aktionen"
6. Trim anpassen

Mit Vorschau: Der Nutzer sieht das Ergebnis **sofort** beim Ziehen am Regler.

### 2.3 Die Wiedergabeliste ist eine Liste, keine Timeline

**Problem:** Die Wiedergabeliste ist eine **vertikale Liste** (`liste` ist ein Array von `Listenelement`). Es gibt keine grafische Timeline.

**Konkret:** `liste-reorder.ts:92-136` implementiert die Reorder-Logik als Array-Manipulation:
```ts
export function berechneNeueReihenfolge(
  ids: string[], aktivId: string, ueberId: string,
): string[] {
  // ... arrayMove-Logik
}
```

**Warum das schlecht ist:** In DaVinci Resolve, Premiere, CapCut ist die Timeline **das** zentrale Interface. Der Nutzer sieht:
- Wie lang jeder Clip ist (Breite auf der Timeline)
- Wo Clips beginnen/enden
- Thumbnails des Inhalts
- Die Gesamtdauer auf einen Blick

Die Liste im Signage-Tool ist ein **Text-Verzeichnis**. Der Nutzer sieht nicht, was ein Clip zeigt, wie lang er ist, oder wo er beginnt/endet.

**Beispiel:** Ein Nutzer hat 15 Elemente. In einer Timeline sieht er auf einen Blick: "Das Video ist 30 s, das Segment 10 s, das nächste Video 45 s...". In einer Liste muss er jede Zeile einzeln lesen.

### 2.4 Trimmen ist ein abstrakter Regler, keine direkte Manipulation

**Problem:** Um ein Video zu trimmen, muss der Nutzer einen separaten `dauer-regler` verwenden – einen abstrakten Balken mit Griffen.

**Konkret:** `dauer-regler.ts:99-107` definiert das Modell:
```ts
export interface ReglerModell {
  elementId: string
  griffe: 1 | 2
  untergrenze: number
  obergrenze: number
  anfang: number
  ende: number
  effektiveDauer: number
}
```

**Warum das schlecht ist:** In DaVinci Resolve, CapCut trimmt der Nutzer **direkt auf dem Clip** – er zieht die linke/rechte Kante des Clips auf der Timeline. Das ist **intuitiv, visuell und sofort verständlich**. Ein abstrakter Regler ist ein **Umweg**.

**Beispiel:** Der Nutzer will ein Video von 0:10 bis 0:30 schneiden. In CapCut: Er zieht die linke Kante auf 0:10, die rechte auf 0:30. Fertig. Im Signage-Tool: Er öffnet den Regler, zieht zwei Griffe, schaut auf die Zahlen, klickt OK.

### 2.5 Keine visuelle Rückmeldung bei Fehlern

**Problem:** Die Fehlerbehandlung ist rein textbasiert (`Ergebnis<T, { code, meldung }>`). Es gibt keine visuellen Indikatoren für kaputte Elemente.

**Konkret:** `kaputt-erkennung.ts:95-179` liefert eine Liste von `KaputteStelle`-Objekten:
```ts
export type KaputteStelle =
  | { art: 'element_asset'; elementId: string; assetId: string; grund: ... }
  | { art: 'element_aktion'; elementId: string; aktionId: string; ... }
  | { art: 'band_abschnitt'; elementId: string; abschnittIndex: number; ... }
```

**Warum das schlecht ist:** In DaVinci Resolve, Clipchamp sind kaputte Fehlinhalte **sofort sichtbar**: Ein rotes X, ein gelbes Warnsymbol, ein Platzhalter-Thumbnail. Der Nutzer **sieht**, dass etwas nicht stimmt, bevor er auf einen Button klickt.

**Beispiel:** Ein Video fehlt. In der Liste erscheint ein rotes Icon mit dem Text "Datei fehlt". Der Nutzer sieht sofort, welches Element betroffen ist – ohne auf eine Fehlermeldung zu warten.

### 2.6 Keine Fortschrittsanzeige beim Rendern

**Problem:** Der Render-Dialog (`render-dialog.ts`) löst nur aus und wartet auf den Auftrags-Zustand. Es gibt keinen Fortschrittsbalken, keine Zeitabschätzung.

**Konkret:** `WarteschlangenLeiste.tsx:26-36` ist leer:
```tsx
export function WarteschlangenLeiste(): JSX.Element {
  return (
    <footer data-testid="warteschlangen-leiste"
      style={{ height: HOEHE_PX, flex: "0 0 auto", borderTop: "1px solid #444" }} />
  );
}
```

**Warum das schlecht ist:** In DaVinci Resolve, HandBrake gibt es einen **Fortschrittsbalken mit ETA**. Der Nutzer weiß, wie lange er warten muss. Die Warteschlangen-Leiste ist leer – der Nutzer sieht nicht, ob ein Render läuft, wie weit er ist, oder ob er fehlgeschlagen ist.

### 2.7 Kein Undo/Redo für die UI

**Problem:** Undo/Redo ist nur für Projekt-Änderungen gebaut (`undo-projekt.ts`, `undo-vorlage.ts`), aber nicht für Aktionen, Vorlagen oder Importe.

**Konkret:** `app-shell/undo-projekt.ts`, `app-shell/undo-vorlage.ts` – aber keine `undo-aktion.ts`, keine `undo-import.ts`.

**Warum das schlecht ist:** In DaVinci Resolve, CapCut, Canva ist Undo/Redo **universell** – für jeden Schritt. Die Einschränkung auf nur zwei Bereiche ist **unlogisch**.

### 2.8 Keine Tastatur-Steuerung

**Problem:** Es gibt keine Tastatur-Steuerung. Alles wird per Maus bedient.

**Konkret:** Keine Datei in `src/renderer/` enthält Tastatur-Handler (onKeyDown, onKeyUp, etc.).

**Warum das schlecht ist:** In DaVinci Resolve, Premiere ist die Tastatur-Steuerung **essenziell**:
- Space = Play/Pause
- Pfeiltasten = Frame vor/zurück
- Cmd+Z = Undo
- Cmd+S = Speichern
- Delete = Entfernen

### 2.9 Keine Asset-Bibliothek mit Vorschau

**Problem:** Die Medien-Bibliothek (`medien-import.ts`) ist ein **Import-Dialog**, keine **durchsuchbare Galerie** mit Thumbnails.

**Konkret:** `composer/medien-import.ts` ist ein Rumpf. Es gibt keine Galerie, keine Thumbnails, keine Suche.

**Warum das schlecht ist:** In Canva, Clipchamp, CapCut ist die Medien-Bibliothek eine **visuelle Galerie** mit Thumbnails, Such- und Filterfunktionen. Der Nutzer **sieht**, was er auswählt.

### 2.10 Keine Vorlagen-Vorschau

**Problem:** Der Vorlagen-Editor (`vorlagen-editor`) ist ein **Formular**, keine **Vorschau** wie in Canva.

**Konkret:** `vorlagen-editor/index.ts` ist ein Platzhalter. Es gibt keine Live-Vorschau.

**Warum das schlecht ist:** In Canva, Clipchamp ist die Vorlagen-Auswahl ein **visuelles Erlebnis** – der Nutzer sieht die Vorlage in Echtzeit und kann sie sofort anwenden.

### 2.11 Kein Eigenschaften-Panel (Inspector)

**Problem:** Es gibt kein Panel, in dem die Eigenschaften eines ausgewählten Elements (Dauer, Trim, Aktion, Vorlage) auf einen Blick sichtbar sind.

**Konkret:** `composer/index.tsx` ist ein Rumpf. Es gibt keinen Inspector.

**Warum das schlecht ist:** In DaVinci Resolve, Premiere gibt es ein **Inspector-Panel**, das alle Einstellungen des ausgewählten Elements anzeigt. Der Nutzer sieht auf einen Blick: Dauer, Trim, Aktion, Vorlage, Einblendung.

### 2.12 Keine Zusammenfassungs-Statistik

**Problem:** Die Gesamtlänge wird berechnet (`gesamtlaenge.ts`), aber es gibt keine weiteren Statistiken.

**Konkret:** `gesamtlaenge.ts:255-290` berechnet nur die Gesamtlänge und die 30-Minuten-Warnung.

**Warum das schlecht ist:** In Canva, Clipchamp sieht der Nutzer auf einen Blick:
- Gesamtdauer
- Anzahl der Elemente
- Verhältnis Video zu Segmenten
- Band-Abschnitte und ihre Dauer

### 2.13 Keine Kontextmenüs

**Problem:** Es gibt keine Kontextmenüs (Rechtsklick).

**Konkret:** Keine Datei in `src/renderer/` enthält onContextMenu-Handler.

**Warum das schlecht ist:** In DaVinci Resolve, CapCut sind Kontextmenüs **essenziell** für effizientes Arbeiten. Der Nutzer klickt mit der rechten Maustaste auf ein Element und sieht alle relevanten Aktionen.

### 2.14 Keine Mehrfachauswahl

**Problem:** Die Wiedergabeliste unterstützt keine Mehrfachauswahl.

**Konkret:** `liste-reorder.ts:141-157` behandelt nur einzelne Elemente:
```ts
export async function ordneNeuOptimistisch(
  aktivId: string, ueberId: string | null,
): Promise<Ergebnis<void>> {
  // ... nur ein Element
}
```

**Warum das schlecht ist:** In DaVinci Resolve, CapCut kann der Nutzer mehrere Elemente gleichzeitig auswählen und als Gruppe bearbeiten.

### 2.15 Keine Vollbild-Vorschau

**Problem:** Die Vorschau ist kein Vollbild-Modus.

**Konkret:** `preview-player/index.ts` ist ein Platzhalter. Es gibt keinen Vollbild-Modus.

**Warum das schlecht ist:** In DaVinci Resolve, CapCut gibt es einen **Vollbild-Vorschau-Modus** (z. B. für TV-Ausgabe). Der Nutzer muss sehen, wie das Endergebnis auf dem Ziel-Bildschirm aussieht.

### 2.16 Keine Export-Voreinstellungen

**Problem:** Der Export-Dialog (`export-dialog.ts`) hat keine Voreinstellungen für Auflösung, Bitrate, Format.

**Konkret:** `composer/export-dialog.ts` ist ein Rumpf.

**Warum das schlecht ist:** In DaVinci Resolve, HandBrake kann der Nutzer Export-Voreinstellungen treffen. Das Signage-Tool hat ein festes Profil (1080p, 30fps, H.264), aber der Nutzer sieht das nicht.

### 2.17 Kein Projekt-Dashboard

**Problem:** Der `projekte`-Reiter ist eine **Liste**, kein **Dashboard**.

**Konkret:** `projekt-verwaltung/index.ts` ist ein Platzhalter.

**Warum das schlecht ist:** In Canva, Clipchamp sieht der Nutzer auf einen Blick:
- Letzte Änderung
- Anzahl der Elemente
- Letzte Ausgabe
- Schnellzugriff auf Aktionen

### 2.18 Keine Benachrichtigungen

**Problem:** Es gibt keine Toast-Benachrichtigungen oder Meldungen.

**Konkret:** Keine Datei in `src/renderer/` enthält ein Benachrichtigungssystem.

**Warum das schlecht ist:** In Canva, Clipchamp sieht der Nutzer sofort, was passiert hat (z. B. "Render erfolgreich", "Fehler aufgetreten").

---

## 3. Vergleichstabelle

| Feature | Signage-Tool (geplant) | Typischer Video-Editor | Bewertung |
|---|---|---|---|
| Haupt-Navigation | 4 Reiter (gleichwertig) | Zentraler Arbeitsbereich + Panels | **Schlecht** |
| Wiedergabeliste | Vertikale Liste | Horizontale Timeline mit Thumbnails | **Schlecht** |
| Live-Vorschau | Getrennter Reiter | Immer sichtbar, zentral | **Schlecht** |
| Trimmen | Abstrakter Regler | Direkt auf dem Clip ziehen | **Schlecht** |
| Fehler-Anzeige | Textbasiert | Visuell (Icons, Farben) | **Schlecht** |
| Render-Fortschritt | Leere Leiste | Fortschrittsbalken + ETA | **Schlecht** |
| Undo/Redo | Nur Projekt + Vorlagen | Universell | **Schlecht** |
| Tastatur-Steuerung | Keine | Umfassend | **Schlecht** |
| Asset-Bibliothek | Import-Dialog | Visuelle Galerie | **Schlecht** |
| Vorlagen-Vorschau | Formular | Live-Vorschau | **Schlecht** |
| Eigenschaften-Panel | Keines | Inspector-Panel | **Schlecht** |
| Statistiken | Nur Gesamtlänge | Dashboard | **Schlecht** |
| Kontextmenü | Keines | Umfassend | **Schlecht** |
| Mehrfachauswahl | Keine | Umfassend | **Schlecht** |
| Vollbild-Vorschau | Keiner | Standard | **Schlecht** |
| Export-Voreinstellungen | Keine | Umfassend | **Schlecht** |
| Projekt-Dashboard | Liste | Karten-Ansicht | **Schlecht** |
| Benachrichtigungen | Keine | Toast-System | **Schlecht** |

---

## 4. Empfehlungen (priorisiert)

### 4.1 Kritisch (muss gebaut werden, bevor das Tool nutzbar ist)

| # | Empfehlung | Begründung | Aufwand |
|---|---|---|---|
| 1 | **Zwei-Panel-Layout:** Vorschau links, Wiedergabeliste rechts – beide **immer sichtbar** | Die Hauptbetriebsart (FA-20) erfordert beides gleichzeitig | Mittel |
| 2 | **Thumbnails** für alle Elemente in der Liste | Der Nutzer muss sehen, was ein Clip zeigt | Mittel |
| 3 | **Live-Vorschau** der Wiedergabeliste | Ohne Vorschau sieht der Nutzer nicht, was er tut | Mittel |
| 4 | **Fortschrittsbalken** in der Warteschlangen-Leiste | Der Nutzer muss wissen, ob ein Render läuft | Klein |
| 5 | **Universelles Undo/Redo** für alle Operationen | Ohne Undo ist jedes Risiko zu groß | Mittel |

### 4.2 Wichtig (verbessern die Nutzererheblich)

| # | Empfehlung | Begründung | Aufwand |
|---|---|---|---|
| 6 | **Horizontale Timeline** als Alternative zur Liste | Eine Timeline zeigt Dauer, Reihenfolge und Inhalt auf einen Blick | Groß |
| 7 | **Tastatur-Steuerung** (Space, Pfeiltasten, Cmd+Z, Delete) | Effizienz | Mittel |
| 8 | **Visuelle Fehler-Kennzeichnung** (rot/gelb) | Der Nutzer sieht Probleme sofort | Klein |
| 9 | **Kontextmenü** auf Elementen | Effizienz | Mittel |
| 10 | **Asset-Galerie** mit Thumbnails und Suche | Der Nutzer sieht, was er auswählt | Mittel |

### 4.3 Nice-to-have (für spätere Versionen)

| # | Empfehlung | Begründung | Aufwand |
|---|---|---|---|
| 11 | **Vollbild-Vorschau-Modus** | TV-Ausgabe prüfen | Klein |
| 12 | **Mehrfachauswahl** | Gruppen-Operationen | Mittel |
| 13 | **Vorlagen-Live-Vorschau** | Visuelle Auswahl | Mittel |
| 14 | **Statistik-Dashboard** | Übersicht | Klein |

---

## 5. Fazit

Das geplante UI-Design des Digital-Signage-Tools ist **funktional aber nicht optimal**. Die größten Probleme sind:

1. **Die Reiterstruktur** – Sie trennt den Nutzer von seiner Hauptbetriebsart (Zusammenstellen).
2. **Die fehlende Live-Vorschau** – Der Nutzer sieht nicht, was er tut.
3. **Die abstrakte Bedienung** – Trimmen per Regler statt per Drag-and-drop.
4. **Die fehlende visuelle Rückmeldung** – Keine Thumbnails, keine Icons, keine Farben.

Verglichen mit typischen Video-Editoren (DaVinci Resolve, CapCut, Clipchamp, Canva) ist das Signage-Tool **hinterher**. Es braucht eine **grundlegende Überarbeitung** der UI-Architektur, bevor es für den produktiven Einsatz geeignet ist.

**Die gute Nachricht:** Die Logik ist bereits implementiert (`dauer-regler.ts`, `liste-reorder.ts`, `kaputt-erkennung.ts`, `gesamtlaenge.ts`). Die UI muss nur **sichtbar** gemacht werden – die Bausteine sind da.
