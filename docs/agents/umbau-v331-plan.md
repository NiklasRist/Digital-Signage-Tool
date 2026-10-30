# Umbau v3.31: eine Band-Komposition, keine Vorlagen-Art (Plan, 29.10.2026)

**Stand 30.10.2026: GEBAUT.** Der Code ist nachgezogen - Pakete **A–D** in `e4a5549`
(#450–#453), Paket **E** in `1d4867a` (#454). Dieses Dokument bleibt als Beleg stehen.

**Nachtrag zur Paketgrenze (gemessen, 30.10.2026):** Die Trennung A → B → C → D gilt fuer das
Verstaendnis, **nicht** fuer einen kompilierbaren Zwischenstand. `Vorlage.art` wird von 21
Produkt- und 38 Testdateien gelesen; #450 ohne #451/#452/#453 bricht den Typecheck. Wer hier
je wieder schneidet, misst zuerst mit `tsc`, statt der Dateiliste zu glauben.

Vorher: [`marken-editor-ui-2026-10-29.md`](marken-editor-ui-2026-10-29.md) (Marken-Oberfläche,
eigener Schnitt danach).

---

## 1. Was entschieden ist

1. **Der Split-Screen ist gestrichen.** Das Werbeband liegt **deckend über** dem vollflächigen
   Video (1920 × 1080). Keine Verkleinerung, keine Seitenbalken, keine Restflächen-Farbe.
2. **Eine Vorlage trägt keine Art mehr.** `höhe === null` heißt Ganzbild (1920 × 1080), eine
   Zahl heißt Band (1920 × 162). Der **Einfügeweg** entscheidet: Zeitleiste = Ganzbild,
   Bandliste = Band.
3. **Anzeigenamen:** „Vollbild" → **„Ganzflächig"**, „Split" → **„Zwei Spalten"**
   (IDs `vollbild` / `split` bleiben – sie sind Daten).
4. **Zonen bekommen selbsterklärende Namen** (eine Quelle für beide Editoren).

## 2. Ausgangsbeleg (gemessen, 29.10.2026)

| Befund | Quelle |
|---|---|
| Die Vorlage „Split" ist ein **Ganzbild** (`art: vollflaeche`, `höhe: null`), zweispaltig | `vorlagen.json`, TK 9.11.1 |
| Nur „Band-Standard" ist ein Band (`art: split`, `höhe: 162`) | ebd. |
| Kein Projekt nutzt ein Band: 2 Projekte, 0 × `bandVorlageId` | `projects/*/project.json` |
| `vorlagen.json` auf der Platte **enthält** die drei eingebauten Vorlagen samt `art` | Datei, 96 KB |

## 3. Die Arbeitspakete

### A – Vertrag: `art` entfällt, `höhe` trägt die Geometrie

**Dateien:** `src/shared/contracts/vorlage.ts` (`VorlagenArt` löschen), `render-request.ts`
(`band.art`, `band.flaecheDunkel` löschen), `src/shared/band-geometrie.ts` (**löschen**),
`src/main/render-service/band-geometrie.ts` (Split-Zweig raus, `Bandart` löschen),
`normalisieren.ts`, `src/main/ffmpeg-adapter/filter-split.ts` (**löschen**), `concat.ts`,
`fortschritt.ts`, `video-ausschnitt.ts` (Split-Erwähnungen prüfen).

**Fertig, wenn:** `npm run typecheck` grün ist, `grep -r "VorlagenArt"` leer ist und der
Render eines Video-Elements mit Band ein Overlay bei `y = 1080 − H` erzeugt (Integrationstest).

### B – `vorlagen-store`: zwei eingebaute Vorlagen, neue Namen, Migration

**Dateien:** `eingebaute-vorlagen.ts` (Split-Vorlage **bleibt**, aber als „Zwei Spalten";
`EINGEBAUTE_VORLAGEN_IDS` unverändert), `erstelle-vorlage.ts` (kein `art`-Parameter),
`ipc-verdrahtung.ts` (`ARTEN` löschen), `referenzpruefung.ts`, Speicher/Migration.

**Migration:** `vorlagen.json` – Feld `art` entfernen, `name` der beiden Ganzbild-Vorlagen
auf die neuen Anzeigenamen setzen. **Keine** Vorlage löschen. Ein Projekt, das auf eine
Band-Vorlage zeigt, bleibt unverändert gültig.

**Fertig, wenn:** eine bestehende `vorlagen.json` ohne Handarbeit lädt, die drei Vorlagen
erscheinen (Ganzflächig, Zwei Spalten, Band-Standard) und `schemaVersion` hochgezählt ist.

### C – `preview-player`: Split-Bauteil raus, Band über dem Video

**Dateien:** `split.tsx` und `split-stile.ts` (**löschen**), `vorschau.tsx` (Fall `split` raus),
`vorschau-auswahl.ts` (`art === 'split'`-Zweig raus), zugehörige Specs
(`split-anzeige`, `split-stile-*` löschen, `vorschau-anzeige` anpassen).

**Fertig, wenn:** die Bühne ein Band deckend über dem vollflächigen Video zeigt und
`springeZuElement`/die Leiste unverändert funktionieren.

### D – `composer` und `vorlagen-editor`: Einfügeweg statt Art-Auswahl

**Dateien:** `composer/einblendung-bearbeiten.ts`, `einblendung-ansicht.ts`/`.tsx`,
`render-ausloesen.ts`, `template-canvas/zeichne-segment.ts`, `vorlagen-editor/*`
(keine Art-Auswahl; die Fläche wird beim Anlegen bestimmt), `vorlagen-uebersicht.ts`.

**Fertig, wenn:** die Zeitleiste nur Ganzbild-Vorlagen anbietet, die Bandliste nur
Band-Vorlagen, und im Vorlagen-Editor nirgends mehr „vollflächig / Split / Einblendung" steht.

### E – Zonen-Namen: eine Quelle für beide Editoren

**Neu:** `src/renderer/gemeinsam/zonen-texte.ts` – je Zonen-Kennung `{ name, zweck }`.

| Kennung | Name | Zweck |
|---|---|---|
| `hintergrund` | Hintergrund | Die Fläche unter allem – deckt das ganze Bild. |
| `motiv` | Bild der Aktion | Kommt aus der Aktion, nicht aus der Marke. |
| `scrim` | Abdunkelung | Dunkler Verlauf, damit die Schrift lesbar bleibt. |
| `logo` | Logo | Das Markenzeichen. |
| `ueberschrift`, `titel` | Überschrift | Der große Satz der Aktion. |
| `beschreibung` | Beschreibung | Der erklärende Satz darunter. |
| `preis` | Preis | Die runde Plakette mit der Zahl. |
| `cta` | Knopf | Der Handlungsknopf. |

**Verbraucher:** `vorlagen-editor/index.tsx` (Zonen-Liste zeigt heute `Ebene 1: hintergrund`),
`marken-editor/marken-elemente.ts` (`TITEL` ersetzen).

**Fertig, wenn:** keine Oberfläche mehr eine rohe Kennung zeigt.

## 4. Reihenfolge und Abhängigkeiten

```
A (Vertrag) ──► B (Store + Migration) ──► C (Vorschau) ──► D (Oberflächen)
                                                    └──► E (Namen, unabhängig)
```

**E** ist von A–D unabhängig und kann zuerst gebaut werden (klein, sichtbarer Nutzen).
**A** muss zuerst, weil B–D sonst gegen einen Typ bauen, den es nicht mehr gibt.

## 5. Was NICHT in diesen Schnitt gehört

- Die **Marken-Oberfläche** (Inspector, drei Bereiche, Reihenfolge der Arbeit) – eigener Plan,
  `marken-editor-ui-2026-10-29.md`.
- Die **Projekt-Suche** – gebaut am 29.10.2026.
- Die **Videosteuerung** (#443) – gebaut am 29.10.2026.
