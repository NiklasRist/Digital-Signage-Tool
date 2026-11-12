# Übergabe 12.11.2026 — FA-27 gebaut: vom Produktfoto zum Asset

**Vorgeschichte:** [`uebergabe-2026-11-12-dependabot-und-fa27.md`](uebergabe-2026-11-12-dependabot-und-fa27.md)
(58. Sitzung: Dependabot auf null, FA-27 ausgeschrieben, #470 angelegt).

---

## 1. Auftrag und Reihenfolge

Niklas: *„470 mit was du als sinnvoller empfindest"*. Gewählt wurde **Typen + Migration zuerst**:
`Asset.herkunft` wird Pflichtfeld, und solange das nicht steht, würde der Abruf gegen ein
optionales Feld bauen, das danach wieder umgebaut werden müsste. Außerdem ist die Migration der
einzige Teil, der **bestehende Daten** anfassen kann – sie sollte isoliert und getestet stehen,
bevor Netz-Code dazukommt.

**Ergebnis in einem Satz:** #470 ist gebaut (nicht committet, nicht gepusht); Gate **Unit
5794/5794**, Integration **59/59**, Treiber **0 Befunde**, `npm run dist` packt, das gepackte
Bundle startet.

---

## 2. Fundament: `Asset.herkunft` und die erste echte Migration

- `src/shared/contracts/asset.ts`: `AssetHerkunft` (`{art:'manuell'}` | `{art:'abruf', url,
  abgerufenAm}`), `Asset.herkunft` **Pflicht**.
- `src/shared/contracts/konstanten.ts`: `AKTUELLE_SCHEMA_VERSION` 1 → **2**.
- `src/main/project-store/migriere-projekt.ts`: erster Eintrag in `MIGRATIONS_KETTE`
  (Schlüssel `1`): jedes Element in `assets` bekommt `{art:'manuell'}`, sofern es das Feld nicht
  schon trägt; alle übrigen Felder per Spread. **Kein Werfen** bei kaputtem `assets` – die
  Formprüfung lehnt die Datei weiter unten mit Klartext ab.
- `src/main/media-service/import-medium.ts`: Dateiimporte setzen `{art:'manuell'}`.
- **Seiteneffekt, offen benannt:** `AKTUELLE_SCHEMA_VERSION` gilt laut Kommentar auch für
  `config.json`; die Datei wird jetzt mit 2 geschrieben. Der Leser ignoriert das Feld, es gibt
  und braucht keine Config-Migration. Die Tests dazu wurden auf 2 gezogen.

---

## 3. `Aktion.produktUrl` — der Speicherweg, nicht nur der Typ

- `src/shared/produkt-url.ts`: `normalisiereProduktUrl` (trimmen, nur `http`/`https`, sonst
  `null`) – eine Quelle für Main, Renderer und Tests.
- `src/shared/contracts/aktion.ts`: `produktUrl?: string | null`.
- `erstelle-aktion.ts` **und** `bearbeite-aktion.ts` übernehmen und normalisieren das Feld.
- **Test auf dem Speicherweg:** `tests/integration/produkt-url-speicherweg.spec.ts` schreibt
  über `sofortFlush`, liest die Datei, migriert und prüft; dazu Setzen und Leeren per
  `bearbeiteAktion`. Genau der Fehler von `Aktion.effekte` (#464) ist damit abgedeckt.

---

## 4. Der Abruf (TK 9.19)

Neue Dateien unter `src/main/produktfoto/`:

| Datei | Inhalt |
|---|---|
| `netz.ts` | `hole()` mit harten Grenzen: nur http/https, **aufgelöste** Adresse über den `lookup`-Haken geprüft (Loopback, 10/8, 172.16/12, 192.168/16, 169.254/16, fe80::/10, fc00::/7, 0/8, CGNAT, Multicast; IPv4-mapped eingebettet geprüft), max. 3 Weiterleitungen (jede erneut), 15 s gesamt, Größenkappe je Antwort. |
| `seite-lesen.ts` | JSON-LD `Product.image` (string, array, ImageObject `url`/`contentUrl`, `@graph`), **og:image nur als Rückfall**, relative Adressen gegen die Seite, `data:`/`blob:`/`file:` verworfen, Duplikate über die normalisierte URL entfernt. |
| `kandidaten-speicher.ts` | Kandidaten im Main unter `abrufId`, Verfall nach 10 Minuten (einspeisbare Uhr), Leeren beim Fensterschließen. |
| `produktfoto-abrufen.ts` | Der Auftrag `produktfoto-abruf`: Seite → Adressen → höchstens 5 Kandidaten (8 MB je Bild, 20 MB gesamt) → Speicher. Kein Asset, keine Aktion, keine Datei. Klartexte je Fehlergrund (TK 9.19.9). |
| `waehle-kandidat.ts` | Genau ein Kandidat geht durch die **bestehende** Import-Pipeline (`.part` → fsync/Rename → ffprobe → `fuegeAssetHinzu`), `herkunft` mit Bildadresse und Abrufzeit; danach ist der Abruf verworfen. |
| `handler-registrierung.ts` | `registriereAuftragsHandler('produktfoto-abruf', …)`, kein Abbrecher (FA-18: nur Render). |

---

## 5. IPC und Oberfläche

- `src/shared/contracts/kanaele.ts`: Gruppe `produkt` mit `abrufen` / `waehlen` / `verwerfen`.
- `src/main/ipc-gateway/produkt-abruf-verdrahtung.ts`: die drei Kanäle; `abrufen` geht über
  `reiheEin`, `waehlen`/`verwerfen` sind Instant; `closed` leert den Kandidatenspeicher.
- `src/main/index.ts`: Handler-Anmeldung (ohne Fenster) und IPC (mit Fenster).
- `auftrags-nachlauf.ts`: **einziger** Auswerter von `queue:geaendert` bleibt der Nachlauf; er
  reicht das Abruf-Ergebnis über `meldeProduktfotoAbruf` an einen kleinen Renderer-Speicher
  (`action-editor/produktfoto-meldung.ts`) weiter. Zuordnung über die `auftragId`, damit zwei
  montierte Editoren sich nicht gegenseitig bedienen.
- **Editor, Schritt „Bild":** Feld „Produkt-URL", Knopf „Foto abrufen" (gesperrt während des
  Auftrags), Satz zur Herkunft (Host + „die Adresse wird am Bild gespeichert"), Kandidatenliste,
  „Verwerfen". Klick auf einen Kandidaten ruft `produkt:waehlen`, lädt die Projektsicht frisch
  (`p.projekt.lade`) und geht durch **denselben** Bildweg wie eine Wahl aus der Liste.

**Entscheidung, offen benannt:** `aktionId` darf **leer** sein. Im Modus „neu" existiert die
Aktion noch nicht, und der Abruf schreibt sie nicht (TK 9.19.2). Die Kennung ordnet nur die
Antwort zu. Der Handler hatte das zuerst zu streng geprüft – der Treiberlauf hat es aufgedeckt.

**Ehrliche Grenze der Oberfläche:** Die Kandidaten erscheinen als **Textliste** (Dateiname,
Größe, Host), nicht als Vorschaubilder. Das Issue sagt „Der Abruf liefert **keine** Bilder über
IPC"; eine Bildvorschau bräuchte einen vierten Kanal oder einen zweiten Ablageort. Wer das
ändern will, entscheidet zuerst den Vertrag.

---

## 6. Beweise

- **Gegenproben (alle rot und byte-identisch zurück):**

  | Probe | Datei | SHA-256 vorher = nachher |
  |---|---|---|
  | Loopback-Grenze entfernt | `produktfoto/netz.ts` | `23f56fe7…` |
  | Migration ohne `herkunft` | `project-store/migriere-projekt.ts` | `bb337b4e…` |
  | `produktUrl` im Bearbeiten verworfen | `project-store/bearbeite-aktion.ts` | `6e412954…` |
  | `maxKandidaten` 5 → 7 | `shared/contracts/produktabruf.ts` | `68240ee3…` |
  | „Foto abrufen" ohne `onClick` | `renderer/action-editor/index.tsx` | `73b54eb3…` |
  | JSON-LD und og:image vermischt | `produktfoto/seite-lesen.ts` | `9e3a8757…` |
  | Bildliste wieder `defaultValue` | `renderer/action-editor/index.tsx` | byte-identisch |

- **Treiber 4t (neu):** Loopback-Adresse im echten Fenster → Klartext *„Diese Adresse zeigt in
  ein lokales Netz und wird nicht abgerufen."*, **kein** Asset (`4 → 4`).
- **Nicht am Fenster gemessen:** der Erfolgsweg. Der Beweis-Block von #470 verlangt eine
  **lokale Testseite** – genau das Ziel, das TK 9.19.4 verbietet. Beides ist nicht gleichzeitig
  erfüllbar; die Sicherheitsregel gewinnt. Der Erfolgsweg ist durch die Integrationstests
  `produktfoto-abrufen` (Netzschicht gedoppelt) und `produktfoto-wahl` (echtes ffprobe, echte
  Datei, `herkunft` im `project.json`) belegt.
- **`npm run dist`** packt (electron-builder 26.18.0, Electron 43.8.8); die fünf Binaries liegen
  in `app.asar.unpacked`; das gepackte Bundle startet und läuft nach 8 s noch (Prozess belegt,
  danach beendet).

---

## 7. Ein Messfehler im Treiber, behoben

`4n` war zweimal rot: Nach dem Redo per Tastatur war der **Store** schon auf 3 Zonen, der
**React-Entwurf** aber noch auf 2. Der sofortige Klick auf „Vorlage überarbeiten" sicherte dann
den alten Entwurf – der Parent blieb bei 2, obwohl der Store stimmte. Das ist ein **Messfehler,
kein Produktbefund** (dieselbe Klasse wie der Einmal-Leser vom 28.10.2026). Behoben: `4n` wartet
jetzt, bis die **angezeigte** Zonenliste den Stand zeigt, den der Klick speichern würde. Der
Schritt prüft damit mehr als vorher, nicht weniger.

Der erste 4t-Lauf deckte außerdem die zu strenge `aktionId`-Prüfung im Handler auf (siehe §5) –
der Treiber hat damit genau seine Aufgabe erfüllt.

---

## 8. Stand am Sitzungsende

- **Arbeitsbaum:** 98 Einträge (14 neue Dateien, diese Übergabe und `CLAUDE.md`; Rest
  Änderungen); **nichts committet, nichts gepusht**.
- **Gate:** Typecheck 0, Lint 0 (eine vorbestehende Warnung in `scripts/beleg-effekt-render.mjs`),
  Build 0, Unit **5794/5794** (379 Dateien), Integration **59/59** (16 Dateien), Treiber **0
  Befunde**, `npm run dist` **Exit 0**, Paket startet.
- **Matrix:** FA-27 von `Luecke` auf `teilweise` (Schritt `4t`); FA-28/29/30 als `Luecke`
  nachgetragen (AD v2.4/v2.5 kannte die Matrix nicht). Zählung neu: 12 gemessen, 11 teilweise,
  4 Lücken, 3 manuell; 16 Muss, 13 Soll, 1 Kann.
- **Nicht angefasst:** AD/TK (der Vertrag stand; kein `.docx` geändert), Render, Export.

**Offen / nächster Schritt:**

1. **#470 ist nicht geschlossen und nicht kommentiert** – GitHub-Schreibaktionen nur auf
   Anweisung. Der Bau steht im Arbeitsbaum, nicht auf `main`.
2. **#466** Referenzlauf (geparkt, Phase 1 mit der Stoppuhr).
3. **#458** (Effekt-Entscheidung) bleibt überholt offen.
4. **FA-28/29/30** brauchen eigene Bau-Issues – absichtlich nach FA-27.
5. **`bereitschaft.py` verschweigt #470:** Das Werkzeug gruppiert nach Meilenstein, #470 hat
   keinen, deshalb meldet es „0 bereit". Entweder dem Issue einen Meilenstein geben oder das
   Skript um meilensteinlose offene Issues ergänzen.
6. **Keine Kandidaten-Vorschau** (siehe §5) – Vertragsfrage vor jedem Bau.
