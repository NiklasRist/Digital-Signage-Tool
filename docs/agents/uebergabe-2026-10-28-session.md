# Session 27./28.10.2026 – M8-Kette geschlossen, #338, FA-03-Nachlauf, Backlog-Analyse

**Ausgangslage:** Übergabe vom 23.10.2026 – 28 offene Issues, nächster Schritt
`#316 → #317 → #339`, Push nur auf Anweisung.

**Ergebnis:** Alle vier Bau-Issues gebaut, gemergt, belegt und geschlossen; dazu ein
Produkt-Fix am Aktions-Editor und eine vollständige Bestandsaufnahme des Restes.

---

## 1. Was gebaut und gemergt wurde

| Issue | Commits | Merge | Kern |
|---|---|---|---|
| **#316** | `8cbb5f9`, `86b4745`, `c6becb1` | `500c591` | `einblendung.flaecheDunkel` als **Pflichtfeld** im `RenderRequest`; `baueBand` füllt aus der Standardmarke (#310-Bindung); `NormalisierKontext.flaecheDunkel` und `leseMarke()` im `render-service` entfallen – **kein Marken-Zugriff** mehr |
| **#317** | `4671f8d` | `500c591` | `config-store/lese-marke.ts` samt Spec **gelöscht**; `KANAELE.config` auf vier Einträge; `verdrahteConfigStoreIPC` unverändert in Name und Signatur |
| **#339** | `4cd6336` | `861632e` | sechster Prüfpunkt in `pruefeRenderRequest`: `flaecheDunkel` als `#RRGGBB`/`#RRGGBBAA`, **nur Form**, Muster ohne `g`-Flag |
| **#338** | `a2cbf3d`, `4bd3289` | `8154082` | fünfte kaputte Art `aktion_marke`: **je Aktion genau eine** Stelle, **ohne** `elementId`; `null` als Bestand = „nicht geladen" = Prüfung aus; Reparatur-Knopf heißt bei dieser Stelle „Marke der Aktion wählen" |
| **FA-03-Nachlauf** | `ea2c3ea` | `fe27f5e` | ein gescheitertes Speichern im Aktions-Editor ist **sichtbar** (`Nicht gespeichert: <Meldung des Mains>`); 4g3 protokolliert bei Fehlschlag Titelfeld, Zeilen, Formular- und Wurzel-Meldung |

**Gate am Ende:** `npm run pruefung` **Exit 0** – **5.645 Unit-Tests (334 Dateien)**,
**49 Integrationstests (12 Dateien)**, Treiber **0 Befunde**; `typecheck`/`lint` 0.

**Gegenproben** (alle byte-identisch zurückgenommen, Prüfsummen im Commit bzw. Issue):

| Issue | Gegenprobe | Wirkung |
|---|---|---|
| #316 | Inhaltsmarke statt Standardmarke / Farbe nicht aus dem Element | 3 bzw. 4 Tests rot |
| #317 | fünften Kanal zurück / einen `meldeAn` entfernt | 7 bzw. 4 Tests rot |
| #339 | Prüfung abgeschaltet | 1 Test rot |
| #338 | Prüfung abgeschaltet | 4 Tests rot |
| FA-03 | Meldung abgeschaltet | 1 Test rot |

---

## 2. Die zwei ehrlichen Messweg-Geschichten

### 2a. 4g3 / `focusout` – die Gegenprobe hat NICHT gebissen

Der Treiber-Schritt „Aktion bearbeiten" scheiterte am **26.10.** in drei von vier Läufen
(`Titel im project.json: ["Durchlauf-Aktion"]`). Verdacht war derselbe `blur()`-statt-`focusout`-
Fehler wie am 23.10. bei den Farbfeldern (#310). Der Schritt wurde entsprechend umgebaut –
**und die Gegenprobe widerlegte den Verdacht**: ein voller Lauf gegen den **alten** Stand war
am 27.10. ebenfalls grün (`gefunden=true`, 0 Befunde, `EXIT=0`).

**Die Änderung bleibt trotzdem drin** (Angleichung an die zwei Stellen vom 23.10.), aber sie ist
**nicht als Ursache belegt** – so steht es im Commit `9bb8093` und im Code-Kommentar. Neu loggt
der Schritt `Fensterfokus`, `Feld hatte Fokus` und das aktive Element danach.

### 2b. FA-03 – Ursache nicht gefunden, aber eine echte Lücke geschlossen

`einspeisen` im Aktions-Editor verwarf `{ ok: false }` **vollständig** – der Typ trug nicht
einmal `fehler`. Ein Fehler von `project:bearbeiteAktion` erreichte die Oberfläche **nie**.
`feldVerlassen` kehrte zusätzlich still zurück, wenn die Auswahl auf eine verschwundene Aktion
zeigte. Beides passt auf das Bild „Feld bedienbar, Text getippt, nichts im `project.json`, keine
Meldung".

**FA-03 ist damit nicht gelöst, sondern messbar.** Der nächste rote Lauf nennt den Zweig.

---

## 3. Gemeldete Widersprüche (nicht still aufgelöst)

1. **#316:** drei fremde Fixtures (`frames`, `png-ablage`, `validierung`) bauten ein
   `einblendung`-Objekt und brauchten das neue Pflichtfeld – sonst kompiliert das Testprojekt nicht.
2. **#317:** vier fremde Specs führten die Zahl 5 bzw. die volle config-Schlüsselliste.
3. **#339:** **kein** TK-Nachtrag – begründet: die DoD verbietet Änderungen außerhalb der
   #173-Datei, und die TK führt für `ungueltiges_element` eine Beispielliste, keine Zählung.
4. **#338:** die DoD-Zeile „keine Datei außerhalb der #131-Datei" war **nicht haltbar** – ohne
   Prop und Aufrufstellen hätte die Prüfung nie gelaufen (13 Produktions-, 8 Testdateien).
   Zusätzlich prüfte `naht-typen-313.spec.ts` bis dahin das **Gegenteil** („der composer trägt
   KEIN `marken`-Feld", #313 ENTSCHIEDEN 2); die Probe ist mit Begründung umgedreht. Ebenso die
   Signatur-Probe in `render-ausloesen.spec` (4 → 5 Parameter, löst die #316-Zusage ab).

---

## 4. Backlog-Analyse (Stand 28.10.2026, 25 offene Issues)

### Baubar ohne Rückfrage

| Rang | Issue | Umfang | Anmerkung |
|---|---|---|---|
| 1 | **#445** „Neue Aktion": getippte Werte erreichen das Formular nie | S | code-belegt, nicht am Fenster gemessen |
| 2 | **#394** Statistik-Dashboard gebaut, nirgends gerendert | S | montieren **oder** löschen – Produktentscheidung |
| 3 | **#364** `media://`-Canvas-Tainting (Blob-URL-Weg) | M | Muster #315 steht |
| 4 | **Treiber-Matrix nachziehen** | S | Datei steht auf 21.10.; Übergabe nennt für 22.10. schon „10 gemessen, Muss 8 von 15" |
| 5 | **FA-03 als Issue anlegen** | S | lebt bisher nur in `CLAUDE.md` |
| 6 | **Q1.2** + **Mutations-Chargen** (138 Dateien mit `readFileSync`, 92 mit Grep-Describe) | L | risikofrei, reine Test-/Kommentararbeit |
| 7 | **Banner-Familie #365–#376** (12) | XL | **blockiert**: braucht AD/TK-Nachtrag; #366/#367/#371 sind `braucht-entscheidung` |

### Nur der Auftraggeber

| Sache | Warum |
|---|---|
| **FA-13 bauen?** (#100/#155) | Anforderung entschieden (AD v1.9/TK v3.28), **Code fehlt** – die einzige zugesagte Funktion ohne Bau |
| **#303 abnehmen** | Der letzte Kommentar sagt es: „Die Messung ersetzt die Review nicht." |
| **#442** Aktionen zwischen Frames | Treiber belegt den vollflächigen Weg; der Weg des Nutzers greift nicht → Reproduktion nötig |
| **#443** Videosteuerung | Kern-Set entschieden, Umfang/Reihenfolge offen |
| **#394** Dashboard ja/nein | Produktentscheidung |
| **#445** Fix freigeben | ändert Formularverhalten im Modus „neu" |
| **FA-11 / FA-12** | nur am **gerenderten Bild** prüfbar – kein Test ersetzt das |
| **Push** | `main` liegt weit vor `origin`, **nichts gepusht** |

---

## 5. Doku- und Werkzeugschulden

- **`bereitschaft.py`** kann ein Issue, dessen Bau im **Löschen** besteht, nicht als gebaut
  erkennen (#317 bleibt „bereit", M8 59/60). Werkzeuggrenze, dokumentiert.
- **`docs/agents/treiber-matrix.md`** (21.10.) ist gegenüber dem gebauten Stand veraltet; sie ist
  die einzige Lückenliste des Projekts und verliert ohne Pflege ihren Wert.
- **`docs/agents/oberflaeche-durchlauf.md`** ist auf ~1.750 Zeilen gewachsen und wird nur
  angehängt – irgendwann kein Protokoll mehr, sondern ein Archiv.
- **FA-03** hat kein Issue.
- **`AGENTS.md`** wurde auf **AD v1.9 / TK v3.28** gezogen (`10adaba`); die darin genannte
  Entscheidungsliste ist jetzt vollständig (fünf Änderungen mit ihren Versionen).

---

## 6. Nächste Schritte (Vorschlag)

1. **Klein und sofort:** #445, #394 entscheiden, Treiber-Matrix nachziehen, FA-03 als Issue.
2. **Produkt:** FA-13 (#100/#155) – entschieden, aber nicht gebaut.
3. **Parallel:** #364, dann Codequalität (Q1.2, Mutations-Chargen).
4. **Nicht** ohne AD/TK: die Banner-Familie. Zwölf Issues ohne Anforderungsnachtrag enden wie die
   Zwei-Screens-Ära – gebaut und verworfen.

**Push nur auf Anweisung.**
