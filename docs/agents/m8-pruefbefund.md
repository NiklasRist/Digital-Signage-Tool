# M8 – Prüfbefund (10.08.2026)

> **Sieben unabhängige Prüfer** über 39 Issues: fünf Lose à 6–11 Dateien, dazu zwei Querschnitte
> (Nähte zwischen den Issues; die sechzehn Edits an fremden Verträgen). Grundlage: TK v3.8/v3.9,
> AD v1.3, `BRIEFING.md`, `issue-generation-prompt.md` Abschnitt 7.
>
> **Rund 100 Befunde, davon etwa 20 kritisch.** Sie verteilen sich nicht gleichmäßig: Der gesamte
> main-seitige `marken-store` (M8-02…M8-16) ist in sich geschlossen und signaturtreu – Querschnitt A
> hat **24 von 25 Signaturketten als zeichengleich** bestätigt und **keine einzige
> Doppelbeanspruchung** einer Datei gefunden. Die Fehler sitzen an den Nähten, wie in jedem
> Meilenstein zuvor.

---

## Die fünf Ursachen der kritischen Befunde

### ① M8-21 ist ein Flaschenhals und kennt nur ein Drittel seines Auftrags

Drei Issues verweisen auf `zeichne-segment.ts`, das M8-21 besitzt:

| Auftrag | Quelle | Stand |
|---|---|---|
| vierter Parameter `rahmenMarke` | M8-21 selbst | **erledigt** |
| `logo === null → zeichneErsatzLogo` | M8-20 STOPP; `m8-zuschnitt.md` weist es M8-21 zu | **fehlt** |
| `sindMarkenSchriftenBereit` in Ablaufschritt 0 | M8-17, M8-39 („das tut zeichneSegment, M8-21") | **fehlt** |

M8-21 schließt beides sogar aus („ändert **ausschließlich** die Signatur und Ablauf-Punkt 4.d";
DoD: „Verhalten **bytegleich** zum Verhalten vor diesem Issue").

**Warum es schwer wiegt:** Beide fehlenden Zweige laufen **still** falsch. Eine Marke ohne Logo
bekäme den Bild-Platzhalter statt des Ersatz-Logos (Auftraggeber-Entscheidung 10/11), und eine nicht
geladene Marken-Schrift führt zum Canvas-Rückfall – der Fehler, den das Briefing als eigene
Fallenklasse führt. Beide fallen **erst am 85-Zoll-Fernseher** auf.

### ② Der neunte Kanal fehlt – und drei Issues schalten die Meldung ab

M8-31 registriert acht Instant-Kanäle und **verbietet den neunten per DoD-Test**. M8-24, M8-25 und
M8-36 schreiben dagegen „**ERLEDIGT – nicht mehr melden** … erreichbar über den Kanal
`marken:öffneMarkenDateiDialog` (angemeldet in M8-31)".

**Das ist die schlimmste Kombination des Laufs:** Die Lücke ist echt, **und** drei Issues sorgen
dafür, dass niemand sie meldet. M8-33 meldet als einziges korrekt – aber wer M8-24 baut, liest
„erledigt" und geht weiter. Ergebnis: Schrift- und Logo-Import sind aus der Oberfläche nicht
auslösbar, also genau der Zustand, den M8-33 beheben sollte.

*Ursache: Die ERLEDIGT-Vermerke wurden beim Auflösen der Dialog-Frage geschrieben, ohne M8-31
nachzuziehen. Die Textkorrektur-Liste des Zuschnitts führte den Nachzug, er wurde nicht ausgeführt.*

### ③ Der Reiter [Marken] hat keinen Bauauftrag

TK 9.14.1 (v3.6) zeigt fünf Reiter. Angelegt wird der Reiter in `reiter.ts` (`#194`) und
`inhalte.tsx` (`#244`) – **kein M8-Issue beansprucht sie**; M8-32 und M8-38 verbieten sie sich
ausdrücklich, M8-40 besitzt `inhalte.tsx`, legt aber keinen Reiter an.

Damit sind **zwölf Funktionen aus elf Editor-Issues** gebaut, geprüft, grün – und für den Nutzer
unerreichbar. **Neunte Wiederholung** derselben Lückenklasse im Projekt.

### ④ Der Edit an `#119` hat keinen Eigentümer

Vier Issues setzen `holeLogo(markeId)`, die `herkunft`-Verzweigung und `leereLogoBestand()` voraus
(M8-39 als harter Blocker, M8-40, M8-30, mittelbar M8-22). Alle sperren sich `template-canvas/**`.
Der Zuschnitt beschreibt den Edit vollständig, nennt aber – anders als die Nachbarzeilen – **keinen
Empfänger**.

**Verschärfend:** M8-39 schreibt `Marke.logo` **ohne `herkunft`** ab – ausgerechnet ohne das Feld,
an dem die Ladeweg-Verzweigung hängt. M8-37 benennt die Folge selbst: „dann ist die Zuordnung in
diesem Issue richtig **und das Bild trotzdem falsch**." Ein grüner Typecheck, ein falsches Bild.

### ⑤ Von sechzehn Edits haben drei einen Ausführenden

Ohne Adressat sind unter anderem **alle Typ-Erweiterungen** – `#52` (`Marke`), `#14` (`Aktion`),
`#15` (`Project`), `#21` (Konstante) –, also die Grundlage, auf der 39 Issues stehen. Die Regel steht
wörtlich im Zuschnitt: *„eine Meldung ohne Recht führt dazu, dass ein Agent wartet statt baut."*

---

## Drei Funde, die über M8 hinausgehen

### Die freie Akzentfarbe entwertet zwei abgenommene Verträge

- **`#139`** (M5-20): „Der Nutzer wählt die Akzentfarbe einer Aktion aus einer **festen** Auswahl von
  Rollen der Markenpalette – es gibt **keinen freien Farbwähler**, und in der Aktion wird der
  **Rollenname** gespeichert, **nie ein Hex-Wert**."
- **`#112`** (M4-18, `loeseFarbe`): „`aktion.akzentfarbe` ist gesetzt, aber **kein Schlüssel von
  `marke.farben`** (z. B. **`'#FF4040'`**) | – | **wirft**"

Das Beispiel im Vertrag ist **wörtlich der neue Normalfall**. Seit TK v3.4 zurückgenommen, nie
nachgezogen. → **M8-45**

### `Aktion.markeId` ist Pflichtfeld ohne Setzweg

Grep über alle angelegten Issues: das Wort `markeId` kommt in **keinem** vor. FA-23 ist ohne einen
Zuweisungsweg nicht benutzbar. → **M8-46**

### `flushBestand()` wird nie gerufen

M8-03 baut eine 4000-ms-Entprellung und den Flush; M8-03 und M8-04 verweisen den Aufruf an „#3
(Main-Bootstrap … beim Beenden)". M8-36 ist das einzige Issue an `src/main/index.ts` und schließt
`before-quit` aus.

**Datenverlust ohne Fehlermeldung** – und der einzige Kanal, der ihn sichtbar machen könnte
(`marken:autoSpeichernStatus`), hat **keinen Abonnenten**. Zwei unabhängige Lücken decken sich
gegenseitig zu.

---

## Zitat- und Formfehler (Auswahl der schwersten)

| Datei | Befund |
|---|---|
| **M8-02** | Zitiert an zwei Stellen die mit v3.7 zurückgenommene Verortung, davon einmal im Block „Verbindliche Invarianten (**wörtlich**)" mit einem Tabellentext, der so in TK v3.9 **nirgends** steht. Widerspricht der eigenen Tabelle sieben Zeilen höher. |
| **M8-17** | Zitiert denselben zurückgenommenen Satz und schreibt ihn 9.15.3 zu. *Das Issue trifft keine Schuld: TK 9.10.4 trug den Satz bis v3.9 weiter – die Quelle widersprach sich selbst.* |
| **M8-13** | Verwendet durchgängig `nicht_gefunden` statt des fachlichen `marke_nicht_gefunden`. M8-09 macht es an derselben Stelle richtig. |
| **M8-25** | IPC-Nutzlast ohne `schriftRolle` in Kanal-Angabe **und** DoD – der Main antwortet mit `ungueltige_eingabe`. Die Datei sagt es zwölf Zeilen höher selbst richtig. |
| **M8-24/M8-25** | STOPP-Block behauptet „Diese Datei ruft ihn mit `art: …`" – widerspricht dem eigenen ENTSCHIEDEN-Block („löst **keinen** Dateidialog aus") und der DoD-Grep-Probe. |
| **M8-38** | Erfundenes TK-Zitat: „Ausgenommen sind Projekte **und Vorlagen**" – TK 9.14.2 sagt seit v3.6 „Projekte, Vorlagen **und Marken**". |
| **M8-28** | Behauptet, `Marke.farben`-Werte seien „immer **6-stellige** Hex-Werte". TK 9.11.2: „**6- oder 8-stellig**". M8-19 **wirft** bei 8-stelligen. |
| **M8-10** | Neue eigenständige Marke bekommt eine tiefe Kopie **einschließlich `logo`** → jede Partner-Marke trägt ab Sekunde eins das Fitnessworld24-Logo, und der Ersatz-Logo-Pfad wird **strukturell nie** ausgelöst. Als „lokale Entscheidung" geführt, obwohl es Verhalten festlegt. |
| **M8-08/M8-09** | Zitieren die Operationstabelle und brechen **ohne Auslassungszeichen** genau vor dem v3.5-Zusatz „je samt `herkunftJeFeld`" ab. Folge: Der Stempel kommt in keinem verbindlichen Block vor. |
| **M8-21** | Regel C: `zone.id === 'hintergrund'` steht **verbindlich** in Signatur und DoD **und** parallel im STOPP als ungeklärt. |
| **M8-09/M8-11/M8-15** | Weitere Regel-C-Fälle: derselbe Punkt entschieden **und** im STOPP offen. |
| **M8-23/24/25/27** | Verweisen auf „**BRIEFING Abschnitt M8-XX**" – solche Abschnitte gibt es nicht; das Briefing ist nach Themen gegliedert. In einem Fall ist der zitierte Satz frei erfunden. |
| **M8-39** | `Marke.logo` ohne `herkunft` abgeschrieben (s. ④). |
| **M8-32** | Führt „Reiter oder Unterbereich" als offene Frage (seit v3.6 entschieden) **und** fordert, M8-38 zu melden statt anzulegen – während der eigene Abhängigkeitsblock sagt, es existiere. |

## Überholte Melde-Aufforderungen (blockieren, ohne dass es auffällt)

M8-01, M8-02, M8-07, M8-03, M8-21, M8-24, M8-25, M8-27, M8-30, M8-31, M8-32, M8-39 – Sätze der Form
„kein Issue liefert X", „noch nicht geschrieben", „echte offene Frage", obwohl X inzwischen
existiert. **Ein Agent, der so etwas liest, meldet und baut nicht.**

*Gegenprobe: Fünf Stellen sind korrekt als ERLEDIGT nachgezogen (M8-16, M8-26, M8-35, M8-24/M8-25
inhaltlich, M8-32 Abhängigkeiten) – die Nachzugs-Disziplin funktioniert grundsätzlich.*

---

## Was ausdrücklich sauber ist

- **Keine Doppelbeanspruchung einer Datei** – obwohl sich vier Issues drei Module teilen. Die
  Arbeitsteilung ist wechselseitig verschriftlicht; der heikelste Fall (die zwei Dateien von `#244`)
  ist beidseitig ausgeschrieben.
- **24 von 25 Signaturketten zeichengleich**, darunter `MarkenFehlercode`, `MarkenTeilwerte`,
  `MarkenZugang`, `loeseMarkenDateiPfad` über drei Dateien.
- **Der `marken-store` ist als Modul geschlossen**: Kanal-Kette, Protokoll-Kette und
  Renderer-Umstellung sind in Datei-Eigentum und Reihenfolge widerspruchsfrei.
- **`SICHERHEITSABSTAND_BEREICH`**: Name, Importpfad und Werte in M8-11 und M8-35 identisch und
  deckungsgleich mit TK 9.11.4 – der einzige durchgängig saubere Edit der Liste.
- **Der Kontrast-Schwellenwert** ist nirgends erfunden: Pflicht-Parameter ohne Vorgabewert, per
  Grep-DoD gesichert, in beiden STOPP-Blöcken als offen geführt.
- **Das `corsEnabled`-Experiment** trennt vorbildlich zwischen Gemessenem und Abgeleitetem, mit
  benannter Probe und einem DoD-Punkt, der das Privileg bis zum Messergebnis sperrt.
- **Ohne Beanstandung:** M8-20, M8-26, M8-33, M8-34.

---

## Behebung

| Ursache | Maßnahme |
|---|---|
| ① Flaschenhals M8-21 | M8-21 um beide Zweige erweitern |
| ② neunter Kanal | M8-31 nachziehen; die drei falschen ERLEDIGT-Vermerke korrigieren |
| ③ Reiter | **M8-41** (neu) |
| ④ `#119` | **M8-42** (neu) |
| ⑤ Edits ohne Ausführenden | Zuweisung je Zeile im Zuschnitt; die großen als eigene Issues |
| `flaecheDunkel`-Kette (vier Glieder, im Zuschnitt falsch adressiert) | **M8-43** (neu) |
| `config:leseMarke` | **M8-44** (neu) |
| freie Akzentfarbe | **M8-45** (neu) |
| `markeId`-Setzweg | **M8-46** (neu) |
| `flushBestand()` | in M8-36 |
| Zitat- und Formfehler | Textkorrekturen je Datei |

**TK v3.9** hat den auslösenden Vertragsfehler behoben: 9.10.4 trug den mit v3.7 zurückgenommenen
Satz weiter. Daraus die Regel, die im Schlussblock steht: *Eine Änderung gilt erst als nachgezogen,
wenn eine **Volltextsuche über die geänderte Aussage** gelaufen ist.*
