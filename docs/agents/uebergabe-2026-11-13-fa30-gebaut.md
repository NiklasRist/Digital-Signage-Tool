# Übergabe – 13.11.2026 (zweiundsechzigste Sitzung): #475 geschlossen, FA-30 gebaut (#472)

**Volltext der Sitzung.** Kurzfassung in [`CLAUDE.md`](../../CLAUDE.md), Abschnitt „STAND HEUTE".

---

## 1. Auftrag

Niklas: „beides" – auf die Frage, ob **#475 schließen** oder **#472 bauen**. Also beides, in
dieser Reihenfolge.

1. **#475** (`[doku] TK v3.66`) war gebaut und kommentiert; der Kommentar vom 13.11.2026
   15:59 UTC stand. **Geschlossen** (`completed`) auf Anweisung. Kein neuer Kommentar.
2. **#472** (`[bau] FA-30 Produktseite finden`) gebaut: Stichwortsuche, zuerst hinterlegte
   Shops, danach die allgemeine Websuche als Notweg.

## 2. Was gebaut ist

**Der Weg:** Stichwort → Suchauftrag → Shops (höchstens drei, in Reihenfolge) → **nur wenn dort
nichts steht** der Notweg → höchstens fünf Treffer. Die Wahl setzt `Aktion.produktUrl` **im
Entwurf**; geholt wird erst mit „Foto abrufen" (FA-27). Zwei Auswahlen, zwei Klicks (AD 4.14).

| Schicht | Datei | Inhalt |
|---|---|---|
| Vertrag | `src/shared/contracts/produktsuche.ts` (neu) | `ProduktQuelleShop`, `ProduktQuellen`, `ProduktSeiteTreffer`, `ProduktsucheRequest/-Ergebnis`, `PRODUKTSUCHE_GRENZEN` |
| Vertrag | `src/shared/produkt-quellen.ts` (neu) | `normalisiereSuchMuster`, `normalisiereProduktQuellen` – die EINE Auslegung von 9.20.3 |
| Vertrag | `app-konfig.ts`, `auftrag.ts`, `kanaele.ts` | `produktQuellen?`; sechste Auftragsart `produktseite-suche`; Kanal `produkt:seiten-suchen` |
| Main | `src/main/produktsuche/treffer-lesen.ts` (neu) | Anker lesen, Duplikate über die normalisierte Adresse, Startseite raus |
| Main | `src/main/produktsuche/suchseite.ts` (neu) | **eine** Adressbildung (`baueSuchadresse`, `encodeURIComponent`) und **eine** Seitenauswertung über `hole()` |
| Main | `src/main/produktsuche/notweg.ts` (neu) | die **austauschbare** Funktion; Adresse nur aus `webSuche` |
| Main | `src/main/produktsuche/produktsuche-ausfuehren.ts` (neu) | der Auftrag: Shops zuerst, Notweg nur als Rückfall, 20 s Budget, Klartexte |
| Main | `handler-registrierung.ts`, `ipc-gateway/produkt-suche-verdrahtung.ts` (neu) | Anmeldung beim Dispatcher; Kanal über `reiheEin` |
| Main | `lese-konfig.ts`, `reihe-ein.ts`, `auftrags-manager/ipc-verdrahtung.ts`, `index.ts` | Quellen normalisiert lesen; Art + Label + Nutzlastprüfung; Art in der Erlaubnisliste; Verdrahtung |
| Renderer | `action-editor/produktsuche-feld.tsx` (neu) | Feld „Stichwort suchen" (vorbelegt mit dem Titel), Knopf, Trefferliste, Ehrlichkeit ohne Quelle |
| Renderer | `produktsuche.ts`, `produktsuche-meldung.ts` (neu) | Kanalaufruf + Meldungsspeicher (wie FA-27) |
| Renderer | `index.tsx`, `App.tsx`, `app-shell/bootstrap.ts`, `app-shell/auftrags-nachlauf.ts` | Schritt „Bild" trägt das Feld; Nachlauf reicht die Treffer an den Editor |

**Grenzen (9.20.4), alle in `PRODUKTSUCHE_GRENZEN`:** höchstens **5** Treffer, höchstens **3**
Shops befragt, höchstens **8** in der Liste, **20 s** gesamt, **2 MB** je Suchseite. Die
Netzschicht ist **`hole()` aus FA-27** – keine zweite Implementierung.

## 3. Messung am echten Fenster (13.11.2026, Treiber **4w**, `EXIT=0`)

```
[schritt-4w] Produktsuche: QuelleInDatei=1, Kachel=true, Feld=true,
  ohneQuelle="Es sind keine Shops und keine allgemeine Suche hinterlegt – die Adresse lässt
  sich von Hand eintragen.", gesperrtOhneQuelle=true, neuMontiert=true, Klick=true,
  Hinweis=null, Meldung="Diese Adresse zeigt in ein lokales Netz und wird nicht abgerufen.
  (lokales_netz)Schließen", KnopfNachher=false, produktUrlGeschrieben=false.
```

Drei Dinge sind damit am Fenster belegt:

1. **Ohne Quelle ist der Knopf gesperrt** und der Satz steht **vor** dem Klick.
2. Der **ganze Weg** läuft: Kanal → Warteschlange → Handler → `hole()` → Abweisung mit
   Klartext. Die Konfiguration kommt aus `config.json` (`QuelleInDatei=1`).
3. Nach dem Fehlschlag ist der Knopf **wieder frei** (`KnopfNachher=false` = nicht gesperrt) –
   das ist der unten gemeldete Befund, hier gemessen.

**Nicht am Fenster gemessen:** der **Erfolgsweg** (Stichwort → Shop-Treffer → Wahl →
`produktUrl` in `project.json`). Er braucht eine erreichbare Suchseite; eine lokale Testseite
ist genau das Ziel, das 9.19.4 verbietet, und einen fremden Shop setzt der Lauf nicht voraus
(9.20.6). Er steht im Integrationstest `produktsuche-suchweg` mit **gedoppelter Netzschicht** –
dieselbe Aufteilung wie bei #470 (4t).

## 4. BEFUND in fremdem Code – gefunden und behoben

**Der Auftrags-Nachlauf gab Fehlschläge NICHT an den Editor weiter.** In
`src/renderer/app-shell/auftrags-nachlauf.ts` endete der gemeinsame Fehlerzweig mit `return`,
**bevor** die artspezifische Meldung kam. Damit war `meldeProduktfotoAbruf({status:'fehler'})`
**unerreichbar** – und der Editor von FA-27 hält eine Sperre, die nur diese Meldung löst. Am
Fenster sichtbar: Nach einem fehlgeschlagenen Abruf blieb der Knopf auf „Foto wird abgerufen …"
stehen. **Seit 13.11.2026 behoben** (beide Netzarten, FA-27 und FA-30), die Datei steht ohnehin
im Dateibereich dieses Issues. **Belegt:** Treiber-4t-Zeile im selben Lauf zeigt jetzt
`Hinweis="Der Abruf ist fehlgeschlagen – …"` (vorher wäre dort `null` gestanden und der Knopf
gesperrt geblieben), und 4w misst `KnopfNachher=false`.

## 5. Abweichungen und Auslegungen – gemeldet, nicht stillschweigend gelöst

1. **`src/shared/produkt-quellen.ts` ist eine NEUE Datei** außerhalb der im Issue genannten
   Liste (dort stehen nur `contracts/produktsuche.ts`, `app-konfig.ts`, `auftrag.ts`,
   `kanaele.ts`). Die Normalisierung wird von **zwei** Seiten gelesen (Main und Editor) und
   gehört deshalb in `shared` – dieselbe Aufteilung wie `produkt-url.ts` (#470). Die Dateiliste
   des Issues nennt sich selbst „erwartet, im Bau zu bestätigen".
2. **`src/main/gemeinsam/html.ts` ist neu**: der Attribut-/Entity-Leser ist aus
   `produktfoto/seite-lesen.ts` **dorthin gezogen** und wird von beiden Lesern benutzt. Eine
   zweite Kopie wäre die Stelle, an der ein Attribut in Anführungszeichen beim einen gelesen
   wird und beim anderen nicht. Verhalten unverändert (9/9 Netz- und Seiten-Tests grün).
3. **`ProduktQuelleShop.host` wird beim Lesen GEGEN das Muster geprüft**; ein Widerspruch wirft
   den Eintrag weg. 9.20.3 nennt den Host „Anzeige und **Prüfwert**" – zeigte die Anzeige
   woandershin als die Suche, wäre sie eine Lüge über das Ziel. Der Host darf dabei als
   `shop.de`, `https://shop.de/` oder `shop.de:8443` geschrieben werden (wird normalisiert).
4. **`keine_treffer` trägt drei verschiedene Klartexte**: „keine Quelle hinterlegt",
   „Konfiguration nicht lesbar", „Seiten gelesen, aber nichts gefunden". Die Codeliste des
   Issues ist geschlossen (sieben Gründe); einen achten Code für einen Zustand zu erfinden, den
   das Issue selbst benennt, wäre eine Vertragsänderung.
5. **`maxSeiteBytes` = 2 MB** steht nicht wörtlich in 9.20.4; dort steht „Zeit- und
   Größenlimits" aus 9.19.4, und die dortigen Zahlen gelten für Bilder. Eine Suchseite ist HTML.
6. **Der Notweg-Vermerk wird aus den Hosts abgeleitet**, nicht gemeldet: `ProduktsucheErgebnis`
   trägt nur `treffer` (Signaturblock 2). Stammen **alle** Treffer von einem hinterlegten Shop,
   entfällt „allgemeine Suche (kann ausfallen)"; sonst steht er da. Ein zusätzliches Feld wäre
   eine Vertragsänderung für eine Beschriftung.
7. **Die „keine Quelle"-Anzeige liest die Konfiguration beim MONTIEREN.** Wer `config.json` bei
   laufender App von Hand ändert, sieht die Änderung erst nach Neuaufbau der Ansicht oder
   Neustart. Der Treiber belegt, dass der Reiterwechsel reicht (`neuMontiert=true`).

## 6. WIDERSPRUCH im Bestand – gemeldet, NICHT aufgelöst

**TK 9.20.3 sagt: „Die Liste ist bearbeitbar."** Das Issue #472 kennt aber **nur einen Kanal**
(`produkt:seiten-suchen`) und sagt ausdrücklich „**Kein zweiter Schreibkanal**"; seine Dateiliste
enthält **keine** Oberfläche für die Shops. Gebaut ist deshalb **kein Schreibweg** – die Quellen
stehen in `config.json` und werden von Hand gepflegt. Ein normaler Nutzer kann das nicht.
**Das ist eine offene Lücke zwischen TK 9.20.3 und #472**, kein Baufehler; sie braucht eine
Entscheidung (eigener Kanal + Felder im Projektverwaltungs-Bereich, oder TK sagt „von Hand").

## 7. Zweiter Befund – gemeldet, NICHT behoben (fremdes Issue, Sicherheit)

**Der `lookup`-Haken in `produktfoto/netz.ts` ist von keinem Test gedeckt.** Gegenprobe: die
Zeile `lookup: geprueftesLookup,` entfernt → **9/9 Tests bleiben grün**. Die Zusage „geprüft wird
die AUFGELÖSTE Adresse" (9.19.4) hängt aber genau an diesem Haken; `istOeffentlicheAdresse`
allein prüft nur, was dasteht, und fängt kein DNS-Rebinding. Ein Test dafür braucht einen
Namen, der auf Loopback auflöst – der Test dürfte dafür keinen echten Server starten.
**Nicht gebaut** (fremder Dateibereich, #470 abgeschlossen); hier festgehalten, damit es nicht
verloren geht.

## 8. Gegenproben (jede rot, jede byte-identisch zurück)

| # | Probe | Ergebnis |
|---|---|---|
| 1 | Host-Prüfung in `normalisiereProduktQuellen` abgeschaltet (`if (false && …)`) | 1 Test rot, zurück (SHA-256 `299eb6a6…` vorher = nachher) |
| 2 | Notweg auch bei Shop-Treffern befragt (`treffer.length === 0` entfernt) | 1 Test rot, zurück (`7a8752bf…`) |
| 3 | Startseiten-Regel im Treffer-Leser entfernt | 1 Test rot, zurück (`cb83aace…`) |
| 4 | **DoD: lokales Netz** – `if (a === 127) return false` in `netz.ts` entfernt | **3 von 9** Tests rot („weist Loopback ab", „IPv4-mapped", „bevor eine Verbindung entsteht"), zurück (`c2ce4b06…`, `git diff` leer) |

**Zusätzlich gemessen (und es ist ein Befund, s. Abschnitt 7):** Entfernen von
`lookup: geprueftesLookup` macht **keinen** Test rot.

## 9. Gate (13.11.2026)

- Typecheck **0**, Lint **0** (eine vorbestehende Warnung in `scripts/beleg-effekt-render.mjs`),
  Build **0**.
- Unit **5913/5913** (389 Dateien; vorher 5873/385 – **+40 Tests, +4 Dateien**).
- Integration **66/66** (19 Dateien; vorher 63/18 – **+3, +1**).
- Treiber **`EXIT=0`, 0 Befunde** (die bekannte `Untersuchung` Mehrfachauswahl und der
  `MANUELL` Export-Dialog bleiben).
- `npm run dist` **Exit 0**, Paket startet.

Neu: `tests/unit/produkt-quellen.spec.ts` (8), `produktsuche-treffer.spec.ts` (8),
`produktsuche-ausfuehren.spec.ts` (11), `produktsuche-schalter.spec.ts` (7),
`tests/integration/produktsuche-suchweg.spec.ts` (3).
Angepasst (Vertragstests, weil Verträge wachsen): `app-konfig`, `auftrag`, `kanaele`,
`lese-konfig`, `bootstrap-ablauf`, `bootstrap-verdrahtung`, `project-store-nachtrag-3`,
`entfernen`, `wiederholen`.

## 9a. #472 kommentiert und geschlossen (13.11.2026)

**#472 IST KOMMENTIERT UND GESCHLOSSEN** (`completed`, GitHub-Schreiben auf Anweisung von
Niklas). Der Abschlusskommentar
([#472 (comment)](https://github.com/NiklasRist/Digital-Signage-Tool/issues/472#issuecomment-6860389501))
nennt: den gebauten Weg, den Fensterbeleg 4w im Wortlaut, den **behobenen Befund** im
Auftrags-Nachlauf, die **sieben** Abweichungen/Auslegungen, den **Widerspruch** zu TK 9.20.3,
den **zweiten Fund** (`lookup`-Haken ungetestet), die vier Gegenproben mit Prüfsummen, das Gate
und die ehrlichen Grenzen. Vorher wurde das Gate auf dem committeten Stand gefahren.

## 10. Ehrlich offen

- **Der Erfolgsweg am Fenster fehlt** (s. Abschnitt 3). Der Integrationstest deckt ihn mit
  gedoppelter Netzschicht; ein echter Shop ist nie angesprochen worden (9.20.6).
- **Der Notweg ist ungemessen.** Er hängt an fremdem Markup; der Lauf setzt keinen Anbieter
  voraus. Ein Ausfall ist ein Befund, kein Absturz – gebaut, aber nicht erlebt.
- **Die Shops sind nicht über die Oberfläche pflegbar** (Abschnitt 6).
- **Der `lookup`-Haken ist ungetestet** (Abschnitt 7).
- **`config.json` bekommt beim nächsten Schreibvorgang das Feld `produktQuellen`** (der Leser
  setzt den Standard ein). Das ist keine Migration – es gibt keinen Versionsschritt –, aber die
  Datei sieht danach anders aus; gewollt, weil sonst jeder Leser die Normalisierung selbst
  aufrufen müsste.
