# Plan: #428 – Zeitleiste als Zeit-/Frame-Band (Zeitstelle)

**Status:** Entwurf zur Abnahme. **Erstellt:** 16.10.2026.
**Entscheidung (16.10.2026, am Issue):** **1a** – das Band bleibt eine **Rotation** (Reihenfolge);
„Zeitstelle" ist **nur die Bedienung**. **Kein Modellfeld, keine Render-Änderung.**
Raster **Sekunden + Frame**; Zeitachse für den **ganzen** Streifen, Ablage nur am Video.

## 1. Befund (am Code nachgelesen)

- `composer/zeitleiste.tsx` zeichnet die Liste als Blöcke, Breite ∝ Dauer
  (`EA_PX_PRO_SEKUNDE = 8`), mit Einfüge-Kanten (#412). **Ohne Zeitachse.**
- Die **Band-Abschnitte sind in der Zeitleiste nicht sichtbar** – sie leben nur in
  `einblendung-ansicht.tsx` (Overlay). „Aktion an einer Zeitstelle" braucht sie **im Video-Block**.
- Ein Drop auf dem Video-Körper hängt heute einen Abschnitt **ans Ende** an
  (`bandAufnahmeAus` → `fuegeAbschnittAn`, #425).

## 2. Ziel

Die Zeitleiste **zeigt** das Video als Zeitband (Sekunden, Frame) und **die Band-Abschnitte an
ihren Zeitstellen**; ein Drop auf dem Video legt den neuen Abschnitt an die **passende Stelle der
Rotation** – statt immer ans Ende.

## 3. Naht (was wandert, was bleibt)

| Ort | Änderung |
|---|---|
| `zeitleiste.tsx` | **Zeitachse** (Sekunden-Ticks) über der Blockzeile; **Frame-Beschriftung** am Video-Block; **Band-Spur** im Video-Block (Abschnitte als Unterblöcke an `[kumStart, kumEnde)`) |
| **neu** `band-aufnahme.ts` (rein) | `bandEinfuegeIndex(zeitSekunden, abschnitte, videoDauer)` – **reine** Funktion, kein Zustand |
| `composer/index.tsx` | `amEnde`: statt „anhängen" den **Index aus der Drop-Zeit** bestimmen und **einfügen** |

**Bleibt unberührt:** `Einblendung`-Modell (`abschnitte: [{aktionRef, dauer}]`), `uebernehmeBand`,
Render, Undo. Einfügen baut auf den **bestehenden** Operationen (`fuegeAbschnittAn` +
`verschiebeAbschnitt`) – kein zweiter Schreibweg.

## 4. Auslegung (die zwei UX-Punkte)

**A – Zeitachse/Raster:** **Tick je Sekunde** (bei 8 px/s = 8 px), beschriftet **alle 5 s**
(sonst überlappen die Labels); der Video-Block zeigt zusätzlich `Sekunde s · Frame f`
(`f = round(s × 30)`, TK 9.2.6).

**B – Zeitstelle → Einfüge-Index (die Rotation bleibt):** Sei `bandGesamt = Σ Abschnittsdauern`
und `videoDauer` die (getrimmte) Videolänge (TK 9.2.8). Dann:
- `bandGesamt === 0` → Index 0 (der erste Abschnitt).
- sonst `wirksam = bandGesamt < videoDauer ? (t mod bandGesamt) : min(t, bandGesamt)`
  (Wiederholung bei kürzerer Folge, Abschnitt bei längerer – genau 9.2.8).
- Index = die **erste** Abschnittsstelle, deren kumulativer **Ende** > `wirksam` ist;
  sonst ans Ende (`length`).

**Sichtbarmachung:** Im Video-Block liegen die Abschnitte an `[kumStart, kumEnde)`, also ab
Sekunde 0. Ist `bandGesamt < videoDauer`, markiert ein Zeichen die **Wiederholung** (das Band läuft
mehrfach). So sieht der Nutzer, wohin ein Drop bei `t` trifft.

## 5. Schritte und Belege

Branch `bau/428-zeitband`. Je Schritt: `typecheck`/`lint` 0, Suite grün, Treiber (4f2/4f4/4g2/4g4)
unverändert.

- **S1** `bandEinfuegeIndex` (rein) + Unit-Tests (Wiederholung, Abschnitt, leer, Grenzen).
- **S2** Zeitachse + Frame-Beschriftung in `zeitleiste.tsx`.
- **S3** Band-Spur im Video-Block (Abschnitte sichtbar).
- **S4** Drop aufs Video: Index aus der Zeit statt „ans Ende"; Treiber-Beleg am echten Fenster.

## 6. Nicht-Ziele

- **Kein** `position`/`startFrames`-Feld; **keine** AD/TK-Modelländerung; **keine** Render-/Undo-Änderung.
- Die Rotation, das Wiederholen/Abschneiden und die Vorlagen-Regeln bleiben, wie sie sind.
