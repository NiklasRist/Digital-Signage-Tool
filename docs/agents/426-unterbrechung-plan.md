# Plan: Aktion unterbricht das Video (#426) – Modell „Einschub am Video"

**Status:** AD/TK fortgeschrieben; Bau-Issues geschnitten (baut noch nicht). **Erstellt:** 17.10.2026.
**Art:** neue Anforderung – Datenmodell, Render, Vorschau, Bedienung.
**Quellen:** #426; AD v1.8 (4.5/FA-20); TK v3.26 (9.2.9, 9.5.2, 9.5.3, 9.7.7, 9.11.3).

## Entscheidung (User, 17.10.2026)

Wörtlich wollte der User: **„Video unterbrechen: Aktion läuft, Video pausiert, danach weiter"**.
Modell **A – Einschub am Video-Element** (nicht das Video real teilen). Das Video bleibt **EIN**
Listenelement; die Unterbrechung ist das **sequenzielle** Gegenstück zum **parallelen** Werbeband.

## Das Modell (TK 9.11.3)

```ts
interface Unterbrechung {
  zeitstelle: number   // Sekunden ab 0 der getrimmten Video-Sicht
  aktionRef: string    // die Aktion, die hier läuft
  dauer: number        // Sekunden, frame-gerundet (9.2.6)
}
// Listenelement (art === 'video') += unterbrechungen: Unterbrechung[]   // [] = keine
```
- Einträge **aufsteigend** nach `zeitstelle`, **ohne Überschneidung**.
- `zeitstelle`/`dauer` unterliegen **derselben** Frame-Rundung wie der Trim (9.2.6).
- `art: 'segment'` → immer `[]`.
- Eine Aktion ist **entweder** Band-Abschnitt **oder** Unterbrechung, **nie beides**.

## Die Zerlegung (TK 9.2.9)

Ein Video mit `n` Unterbrechungen → `2n+1` Render-Items:
`[VideoClip₀][Aktion₁][VideoClip₁]…`, Grenzen `round(zᵢ×30)` Frames.
**Wechselwirkung Band:** das Band liegt auf den Teil-Clips auf und pausiert mit dem Video.
**Elementdauer** = Video-Frames + Σ Einschub-Frames – **EINE Regel, zwei Orte** (`gesamtlaenge.ts`
und `render-service/frames.ts`), wie ohne Unterbrechung.

## Bau-Pakete (geschnitten als Issues, s. unten)

1. **Modell + Store:** `contracts/project.ts` (`Unterbrechung`, Feld), Main-Validierung,
   Store-Operation `setzeUnterbrechungen` + IPC + Handler, Löschkaskade (`loesche-aktion.ts`),
   Referenzprüfung. Undo über den bestehenden Schnappschuss.
2. **Render:** Zerlegung in Teil-Clips + Aktions-PNGs (RenderRequest-Bau), Prüfung
   (`ungueltiges_element`), `frames.ts`-Elementdauer.
3. **Vorschau:** Pause an der `zeitstelle`, Aktion für `dauer`, danach weiter.
4. **Composer-Bedienung:** Drop **auf den Video-Körper** = Unterbrechung an der gemessenen
   Zeitstelle (Umschalter Band ↔ Unterbrechung), sichtbare Marken am Filmstreifen, Entfernen.

## Belege je Paket (Pflicht)

Typecheck/Lint 0, Suite grün, Treiber-Messung am echten Fenster (neuer Schritt), und – wo die
Rechnung berührt ist – die „EINE Regel, zwei Orte"-Gegenprobe.

## Offen / bewusst nicht hier entschieden

- Genauer Bedienweg for „Band **oder** Unterbrechung" (Umschalter am Block, Kontextmenü-Zweig o. a.) –
  im Paket 4 zu wählen, sobald der Drop steht.
- Maximale Zahl der Unterbrechungen je Video (Vorschlag: offen, keine künstliche Grenze).
