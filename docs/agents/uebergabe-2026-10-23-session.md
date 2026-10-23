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

**Drei Fehlschliessungen, sofort korrigiert (Lehre aus dem Abgleich):**
- **#100/#155** waren in den 223 und wurden mitgeschlossen. Sie sind aber **nicht** fertig:
  der `einblendung`-Zweig im Main und der dritte `ANLEGBARE_ARTEN`-Eintrag fehlen. Beide
  wieder **geoeffnet**, mit Kommentar.
- **#303** (Live-Vorschau) wurde mitgeschlossen, obwohl die Uebergabe 22.10. die Schliessung
  ausdruecklich als **eigene Review-Entscheidung** reserviert. Wieder **geoeffnet**.
- **Grenze der Messung:** „Signatur definiert + Datei ohne Rumpf + Commit" erkennt einen
  offenen **Teilzweig** nicht. Wer die Methode wiederholt, muss Issues mit einem
  entschiedenen, aber noch ungebauten Zweig vorher ausnehmen.

**Widersprueche / Befunde, die bleiben:**
- **#394 Statistik-Dashboard:** Komponente gebaut, aber **nirgends gerendert** → offen.
- **#339:** Der Body sagt „GEBAUT"; `validierung.ts` hat den sechsten Pruefpunkt
  `flaecheDunkel` **nicht**. Die Formpruefung liegt nur spaeter im ffmpeg-Adapter.
  Offen, Widerspruch im Issue kommentiert.
- **#338:** `findeKaputteStellen` enthaelt **keine** Marken-Referenzpruefung → offen.
- **`.gitignore`:** Laufzeitartefakte (`marken.json`, `marken-assets/`,
  `.e2e-*-datenort/`) sind bereits seit 22.10. abgedeckt; keine Aenderung noetig.
- **#442:** `braucht-entscheidung` entfernt (Deutung A2 entschieden); offen bleibt die
  Diagnose.

**Offen nach dem Abgleich: 26 Issues.**
- **FA-13-Bau:** #100 (Main-Zweig), #155 (`ANLEGBARE_ARTEN`).
- **Review:** #303 (Live-Vorschau; Schliessung ist eine eigene Entscheidung).
- **Banner-Familie #365–#376** (12): erst nach AD/TK-Nachtrag.
- **Echte Luecken:** #338 (Marken in der Kaputt-Erkennung), #339 (sechster Pruefpunkt),
  #364 (media://-Canvas-Tainting).
- **UI 2.0 / Komfort:** #383, #388, #391, #392, #393, #394.
- **Beim Auftraggeber:** #442 (Diagnose), #443 (Videosteuerung).

---

## 3. Naechster Schritt

1. **FA-13 bauen:** #100 (Main-Zweig `einblendung`/162 mit Scrim-Hintergrund), dann
   #155 (`ANLEGBARE_ARTEN` dritter Eintrag), Tests, Treiber 4n erweitern.
2. **Banner:** AD/TK-Nachtrag, dann #365–#376.
3. Danach Oberflaeche 2.0 / Aktions-Editor inline / #443.

**Push nur auf Anweisung.** Stand: lokal auf `main`, nicht gepusht.
