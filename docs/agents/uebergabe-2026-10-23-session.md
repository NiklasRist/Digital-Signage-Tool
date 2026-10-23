# Uebergabe – Session 23.10.2026: FA-13 entschieden, Backlog-Abgleich (Charge 1)

> Auftrag des Users: „schau dir die Uebergabe an" → „beides" (bereitschaft.py + FA-13
> klaeren) → „erst das und danach den backlog". Diese Datei haelt beides fest: den
> Dokumenten-Nachtrag zu FA-13 und den Backlog-Abgleich.

---

## 1. FA-13 / Einblendung ist entschieden

**Auftraggeber-Entscheidung (23.10.2026):** Eigene Vorlagen der Art **Einblendung** sind
ueber die Oberflaeche **anlegbar**, mit **fester Bandhoehe 162 px** und einem
**Scrim-Verlauf** `scrimStart` → `scrimEnde` (durchsichtig → 70 % Schwarz). Feste Zonen:
`hintergrund` + `logo` aus „Band-Standard"; es gibt keine eingebaute Einblendungs-Vorlage.
Ein Deckkraft-Feld gibt es nicht – die Deckkraft folgt der Vorlagenart (TK 9.10.2).

**Bewusste Anforderungsaenderung:** „Hoehere Baender sind ueber eigene Vorlagen moeglich"
(AD 4.5) und „Bandhoehe setzen" (TK 9.12.2) sind **zurueckgenommen**. Grund: Der
Markenrahmen ist auf 162 px zugeschnitten; eine freie Hoehe braeuchte eine Logo-Regel, die
der Vertrag nicht festlegt (TK 9.11.1 Punkt 3: kein automatisches Umlayouten).

**Dokumente:**
- AD **v1.9** (4.5, FA-13, Glossar), Datum 23.10.2026.
- TK **v3.28** (9.11.1, 9.12.1, 9.12.2), Datum 23.10.2026; Bezug auf AD v1.9 gezogen.
- Beide `.docx` mit `tools/generate-docx.js` neu erzeugt (TK mit `--dfd`), ZIP geprueft,
  neuer Text im `word/document.xml` belegt.

**Issues:** Nachtrag an **#100** (Main-Zweig) und **#155** (`ANLEGBARE_ARTEN`); beide
`braucht-entscheidung`-Labels entfernt. **Code noch nicht gebaut** – `ANLEGBARE_ARTEN`
hat weiterhin zwei Eintraege, der Main lehnt `einblendung` mit `unbekannter_fehler` ab.
FA-13 bleibt in der Treiber-Matrix **teilweise**.

---

## 2. Backlog-Abgleich (Charge 1)

**Messung statt Behauptung.** Grundlage: `gh issue list --state open` (322), die
Issue-Bodies, die **Signaturbloecke**, die im Issue genannten Dateipfade, die
Git-Commit-Nennungen und – fuer UI – ein Aufrufer-Grep. Ein Issue gilt nur dann als
Schliess-Kandidat, wenn **alle** Signatur-Bezeichner im Quellcode definiert sind, die
genannten Dateien existieren (ohne werfenden Geruest-Rumpf) und ein Commit das Issue nennt.
Zusaetzlich wurde geprueft, ob die Signatur **ausserhalb ihrer Definitionsdatei benutzt**
wird (die Klasse „fertige Funktion ohne Aufrufer").

**Ergebnis der Messung (vor dem Schliessen):**

| Kategorie | Anzahl |
|---|---|
| Schliess-Kandidaten (Signatur + Datei + Commit) | 224 |
| davon ohne Aufrufer (`Statistik`) → **offen** | 1 |
| Signatur fehlt/abweichend | 25 |
| Datei/Rumpf unklar, aber gebaut/umgezogen | 23 |
| Signatur + Datei, kein Commit | 9 |
| keine Signatur (manuell) | 41 |

**Ausgefuehrt:**
- **6 BK-Issues #354–#359** als `not planned` geschlossen (verworfene Zwei-Screens-Aera).
- **223** Schliess-Kandidaten als `completed` geschlossen, je mit Beleg-Kommentar
  (Signatur, Dateien, Commit) – **#394** bewusst ausgenommen.
- **70** weitere gebaute Issues geschlossen: umgezogene Pfade (Q3/B-Zusammenfuehrungen),
  abweichend benannte Signaturen, spaeter ueberholte Anforderungen sowie die in den
  Uebergaeben vom 12./15./16.10. belegten Kernachse-Nachzuege und den Treiber #404.
- **#381** (Zwei-Panel-Layout) als `not planned` geschlossen (verworfene Aera).

**Sechs Fehlschliessungen, sofort korrigiert (Lehre aus dem Abgleich):**
- **#100/#155** waren in den 223 und wurden mitgeschlossen. Sie sind aber **nicht** fertig:
  der `einblendung`-Zweig im Main und der dritte `ANLEGBARE_ARTEN`-Eintrag fehlen. Beide
  wieder **geoeffnet**, mit Kommentar.
- **#303** (Live-Vorschau) wurde mitgeschlossen, obwohl die Uebergabe 22.10. die Schliessung
  ausdruecklich als **eigene Review-Entscheidung** reserviert. Wieder **geoeffnet**.
- **#310/#316/#317** (M8-Kette) wurden mitgeschlossen, weil die generischen Typnamen im
  Code stehen. Bei **#310** fehlt der `render-ausloesen.ts`-Teil: kein `stelleMarkeBereit`,
  keine `standardMarke`-Bindung, kein `marke_nicht_ladbar`; der Band-Zweig uebergibt
  weiterhin `marke` als viertes Argument. Die eigentliche Aenderung fehlt: `render-request.ts` hat kein
  `einblendung.flaecheDunkel`, `render-reel.ts` ruft weiter `leseMarke()` zur Laufzeit,
  `config-store/lese-marke.ts` und der Kanal `config:leseMarke` existieren. Beide wieder
  **geoeffnet**, mit Code-Belegen.
- **Grenze der Messung:** „Signatur definiert + Datei ohne Rumpf + Commit" erkennt weder
  einen offenen **Teilzweig** noch eine **fehlende Einzel-Edits** in einer sonst gebauten
  Datei. Wer die Methode wiederholt, muss Issues mit einem entschiedenen, aber noch
  ungebauten Zweig vorher ausnehmen und die DoD gegen den Code lesen.

**Widersprueche / Befunde, die bleiben:**
- **#394 Statistik-Dashboard:** Komponente gebaut, aber **nirgends gerendert** → offen.
- **#310/#316/#317/#339 (M8-Kette):** `flaecheDunkel` ist **nicht** im RenderRequest; der
  `render-service` liest die Marke weiter zur Laufzeit (TK 9.2.2 verlangt Einfrieren beim
  Einreihen); die Formpruefung fehlt. **Zusammen bauen, in dieser Reihenfolge.**
- **#338:** `findeKaputteStellen` enthaelt **keine** Marken-Referenzpruefung → offen.
  Achtung: Die neue Befund-Art faellt in `reparatur-optionen.ts` in `default: []`; ohne
  Entscheidung zum Reparaturweg blockiert sie den Render ohne Ausweg.
- **`.gitignore`:** Laufzeitartefakte (`marken.json`, `marken-assets/`,
  `.e2e-*-datenort/`) sind bereits seit 22.10. abgedeckt; keine Aenderung noetig.
- **#442:** `braucht-entscheidung` entfernt (Deutung A2 entschieden); offen bleibt die
  Diagnose.

**Offen nach dem Abgleich: 29 Issues.**
- **FA-13-Bau:** #100 (Main-Zweig), #155 (`ANLEGBARE_ARTEN`).
- **M8-Kette:** #310, #316, #317, #339 (in dieser Reihenfolge).
- **Review:** #303 (Live-Vorschau; Schliessung ist eine eigene Entscheidung).
- **Banner-Familie #365–#376** (12): erst nach AD/TK-Nachtrag.
- **Echte Luecken:** #338 (Marken in der Kaputt-Erkennung), #364 (media://-Canvas-Tainting).
- **UI 2.0 / Komfort:** #383, #388, #391, #392, #393, #394.
- **Beim Auftraggeber:** #442 (Diagnose), #443 (Videosteuerung).

---

## 3. #310 gebaut, Gate-Befund als Messfehler entlarvt

- **#310 ist gebaut und gemergt** (Merge `e3e8053`): `stelleMarkeBereit(projekt.standardMarkeId)`
  wird **nur bei Bandspur** und **genau einmal** je Aufruf gerufen; neuer Fehlercode
  `marke_nicht_ladbar`; die Band-Abschnitte rufen `zeichneSegment(..., marke, standardMarke)`.
  Verhaltenstests in `render-ausloesen.spec.ts` (16/16), Typecheck/Lint 0.
  **Gegenprobe:** viertes Argument zurück auf `marke` → 2 Tests rot; Rücknahme per SHA-256
  byte-identisch.
- **Der erste volle Gate-Lauf war rot (16 Befunde im Marken-Editor).** Diagnose mit einem
  gezielten Electron-Skript:
  - Direkter IPC-Aufruf `marken:bearbeiteMarke` setzt die Farbe korrekt (`#123456`).
  - Der Editor schreibt ebenfalls korrekt, **sobald** ein echtes `focusout` ausgelöst wird.
  - Der Treiber benutzte `feld.blur()`. Reacts `onBlur` hängt an `focusout`; in einem nicht
    fokussierten Fenster feuert `blur()` nicht. **Kein App-Fehler, ein Messfehler.**
- **Fix** in `scripts/durchlauf.mjs` (4m und `setzeWert4m2`): nach dem Setzen
  `new FocusEvent("focusout", { bubbles: true })` dispatchen. Danach der Treiber allein:
  **13/13 Farbrollen**, Akzent `#808080` im Store, Eigenwert `eigen`, **0 Befunde**.
- **Volle Gate-Bestätigung:** `npm run pruefung` **Exit 0** – 5.627 Unit-Tests (334 Dateien),
  49 Integrationstests (12 Dateien), Treiber ohne Befund. Der Messweg-Fix ist damit belegt.

## 4. Naechster Schritt

1. **#310 mergen** (nach dem grünen Gate), dann **#316** (`flaecheDunkel` in den Request,
   Laufzeit-Lookup raus), dann **#317** (`config-store.leseMarke` + Kanal löschen), dann
   **#339** (Formprüfung) – je mit Tests und Gate.
2. **#338** nach der Entscheidung zum Reparaturweg (Marke waehlen / Aktion ersetzen /
   nur Befund).
3. **FA-13 bauen:** #100 (Main-Zweig `einblendung`/162 mit Scrim-Hintergrund), dann
   #155 (`ANLEGBARE_ARTEN` dritter Eintrag), Tests, Treiber 4n erweitern.
4. **Banner:** AD/TK-Nachtrag, dann #365–#376.
5. Danach Oberflaeche 2.0 / Aktions-Editor inline / #443.

**Push nur auf Anweisung.** Stand: lokal auf `main`, nicht gepusht.
