# Anforderungsdokument – Digital-Signage-Tool

**Projekt:** Digital-Signage-Tool für das Fitnessstudio der Baller Gruppe
**Auftraggeber:** Baller Gruppe
**Bearbeitung:** Niklas Rist, Berufspraktikum
**Datum:** 10.08.2026
**Version:** 1.3 (Entwurf)
**Status:** In Abstimmung

---

## 1. Einleitung und Zielsetzung

Im Rahmen des Berufspraktikums bei der Baller Gruppe wird ein Digital-Signage-Tool für das Fitnessstudio der Gruppe konzipiert und entwickelt. Ziel ist eine moderne, flexibel einsetzbare Softwarelösung, mit der Produktwerbung, studiointerne Angebote und sportbezogene Videoinhalte zentral verwaltet und auf dem Studio-Bildschirm professionell ausgespielt werden können.

Der Kern des Werkzeugs ist eine intern genutzte Anwendung, mit der Mitarbeitende verschiedene Medieninhalte (Videos sowie Produkte/Aktionen) strukturiert pflegen, in eine gewünschte Reihenfolge bringen und daraus **ein einziges, fertiges Ausgabevideo** erzeugen. Dieses Video wird auf einem USB-Speicher abgelegt und am Studio-Fernseher als Endlosschleife wiedergegeben.

Im Fokus stehen eine intuitive Bedienbarkeit, eine stabile Systemstruktur sowie eine flexible und visuell ansprechende Ausspielung der Inhalte im Studioalltag.

---

## 2. Ausgangslage und Rahmenbedingungen

### 2.1 Fachlicher Kontext

Anzuzeigen sind drei Arten von Inhalten:

- **Produktwerbung** – beworbene Produkte des Studios bzw. der Gruppe.
- **Studiointerne Angebote / Aktionen** – zeitlich begrenzte Aktionen, Hinweise, Informationen.
- **Sportbezogene Videoinhalte** – bestehende Videoclips (z. B. Übungen, Imagevideos).

### 2.2 Hardware-Umgebung (Wiedergabegerät)

Die Wiedergabe erfolgt auf einem vorhandenen Consumer-Fernseher. Es steht **keine** zusätzliche Abspiel-Hardware (z. B. Mediaplayer, Mini-PC) zur Verfügung. Die Inhalte werden über einen **USB-Speicher** bereitgestellt und über den integrierten Media Player des Fernsehers im **Demo-/Store-Modus** als Schleife abgespielt.

| Merkmal | Wert |
|---|---|
| Modell (MN) | UE85AU7170UXXN (85", 4K UHD, Tizen) |
| Seriennummer (SN) | 0EAS3SUT800009L |
| Firmware (FW) | T-KSU2EDEUC-2111.1 |
| Firmware-Paket (FC) | SWU-OU_T-KSU2EDEUC_2111_221104 |
| Modell-ID (MI) | T-KSU2EDEUC |
| Region (LS) | EU_BENELUX |
| Geräte-ID (DI) | MTCAXEUHRAU3G |
| MAC-Adresse (MA) | 04:B9:E3:F6:E4:80 |
| Empfohlene Ausgabeauflösung | 3840 × 2160 (4K) bzw. 1920 × 1080 als Fallback |

### 2.3 Organisatorische Rahmenbedingungen

- Die Anwendung wird **intern** genutzt; es wird maximal **ein Nutzer gleichzeitig** mit dem Tool arbeiten.
- Es ist **keine Netzwerk- oder Cloud-Anbindung** erforderlich; das Tool arbeitet lokal/offline.
- Die Anwendung läuft auf einem Arbeitsplatzrechner (Laptop), **nicht** auf dem Fernseher.

---

## 3. Systemüberblick / Lösungskonzept

Das System ist bewusst zweigeteilt, um die Einschränkungen des Consumer-Fernsehers zu umgehen:

1. **Management- und Render-Tool (auf dem Laptop):** Verwaltung von Videos und Produkten/Aktionen, Festlegung der Reihenfolge, Rendering zu **einer durchgehenden MP4-Datei je Lauf**, Ablage auf USB. Ein Projekt kann **mehrere solche Ausgabedateien** unter frei gewählten Namen vorhalten (FA-22, Abschnitt 4.7).
2. **Wiedergabe (am Fernseher):** Der Fernseher gibt die fertige MP4 vom USB-Speicher im Demo-/Store-Modus als Endlosschleife aus.

```
[Laptop: Management- & Render-Tool]  --rendert-->  [benannte MP4]  --kopiert-->  [USB-Stick]  --steckt in-->  [TV: Datei wählen, Endlosschleife]
```

**Begründung der Entkopplung:** Eine eigene App direkt auf dem Fernseher ist für den Dauerbetrieb ungeeignet, da Consumer-Geräte sideloadete Apps nicht automatisch beim Booten starten, sich nach Abstürzen nicht selbst wiederherstellen und durch Firmware-Updates oder ablaufende Zertifikate ausfallen können. Die gewählte Lösung verlagert die gesamte Software auf den Laptop und nutzt am Fernseher nur die robuste, eingebaute USB-Wiedergabe.

---

## 4. Funktionale Anforderungen

Priorität nach MoSCoW: **Muss** (zwingend), **Soll** (wichtig), **Kann** (optional).

| ID | Anforderung | Beschreibung | Priorität |
|---|---|---|---|
| FA-01 | Video importieren | Ein oder mehrere bestehende Videos (mind. MP4) können in das Projekt importiert und in einer Liste verwaltet werden. | Muss |
| FA-02 | Produkt/Aktion anlegen | Produkte bzw. Aktionen können neu angelegt werden (Felder z. B.: Titel, Beschreibung/Text, optional Preis, optional Bild, Anzeigedauer). | Muss |
| FA-03 | Inhalte bearbeiten/löschen | Vorhandene Videos und Produkte/Aktionen können bearbeitet und entfernt werden. | Muss |
| FA-04 | Aktions-Segment erzeugen | Aus einem Produkt/einer Aktion (Text + optional Bild) wird ein anzeigbares Video-/Bildsegment mit definierter Anzeigedauer erzeugt. | Muss |
| FA-05 | Reihenfolge festlegen | Alle Elemente (Videos + Aktions-Segmente) können zu einer Wiedergabeliste zusammengestellt und in der Reihenfolge angeordnet werden (z. B. per Drag-and-drop). | Muss |
| FA-06 | Anzeigedauer steuern | Je Element (Bilder, Aktions-Segmente) ist eine individuelle Anzeigedauer einstellbar; die Bedienung erfolgt über einen **einheitlichen Dauer-/Trim-Regler** – Kürzen *und* Verlängern per Griff, s. 4.4. | Soll |
| FA-07 | Vorschau | Die zusammengestellte Sequenz kann vor dem Rendern in der Anwendung vorab betrachtet werden. | Soll |
| FA-08 | Ausgabe-Rendering | Aus der Wiedergabeliste wird **je Lauf eine einzige, durchgehende MP4-Datei** in definierter Auflösung und Codierung erzeugt (Verkettung aller Segmente). Dass es **eine** Datei ist, ist wesentlich: nur so läuft die Schleife am Fernseher ohne sichtbaren Übergang (Risiko R-04). | Muss |
| FA-09 | Export auf USB | Eine gewählte Ausgabedatei kann in einen Zielordner bzw. direkt auf den USB-Speicher exportiert werden – **unter ihrem eigenen Namen**. Auf dem Speicher dürfen mehrere Ausgabedateien nebeneinander liegen. | Muss |
| FA-10 | Projektverwaltung | Projekte werden in einer Übersicht geführt (Name, Erstell-/Änderungsdatum, Speicherort) und können angelegt, geöffnet, dupliziert und gelöscht werden – um Inhalte effizient zu aktualisieren statt neu anzulegen. Das Sichern selbst erfolgt automatisch (FA-15). | Soll |
| FA-11 | Einheitliches Grundlayout | Aktions-Segmente verwenden ein einheitliches Grundlayout im Corporate Design der **zugewiesenen Marke** (Logo, Farbwelt, Typografie). **Eingebauter Standard ist Fitnessworld24**, abgeleitet aus dem Markenauftritt der Website fitnessworld24.li; weitere Marken sind möglich (FA-23). | Soll |
| FA-12 | Gestalterischer Spielraum | Innerhalb des Grundlayouts sind definierte Bereiche frei gestaltbar (z. B. Überschrift, Motiv-/Produktbild, Preis bzw. Call-to-Action, Akzentfarbe), damit jede Werbung individuell und wirkungsvoll gestaltet werden kann. | Soll |
| FA-13 | Vorlagen erstellen & bearbeiten | Über die eingebauten Vorlagen hinaus können **eigene Vorlagen angelegt und bearbeitet** werden – **bereits im Prototyp**. Dabei wird die **Art** der Vorlage gewählt: vollflächiges Segment, **Split-Screen-Band** oder **Einblendung** (s. 4.5). Eine eigene Vorlage arrangiert nur die **freien Zonen** (Position/Größe/Feldzuordnung) innerhalb des **festen Markenrahmens** (Logo, Sicherheitsabstände), der nicht abschaltbar ist. Datengetrieben – eine eigene Vorlage ist nur ein neuer Datensatz, kein Code-Umbau. | Muss |
| FA-14 | Video trimmen | Ein Video-Element kann am Anfang und Ende beschnitten werden (Trim-Start/-Ende); nur der gewählte Ausschnitt wird wiedergegeben und gerendert. **Nicht-destruktiv** – die Originaldatei bleibt unverändert; der Trim liegt am Listenelement. Bedienung über denselben Dauer-/Trim-Regler wie FA-06 (s. 4.4). | Soll |
| FA-15 | Automatisches Speichern & Sitzung | Änderungen (Liste, Reihenfolge, Trim, Aktionen) werden **fortlaufend automatisch** gesichert – **kein manuelles Speichern, kein Datenverlust** (Rückgrat von NFA-02). Beim Start öffnet die App automatisch das **zuletzt aktive Projekt** und stellt letztes Export-Ziel und UI-Voreinstellungen wieder her. | Soll |
| FA-16 | Prozessübersicht (Auftrags-Queue) | Länger laufende oder dateiverändernde Vorgänge (Medien-Import, Löschen von Medien, finaler Render, USB-Export) werden als Aufträge in einer sichtbaren Warteschlange geführt; erkennbar ist jederzeit, welcher Auftrag läuft, welche anstehen und welche fehlgeschlagen sind. | Muss |
| FA-17 | Fehlgeschlagene Vorgänge wiederholen | Ein fehlgeschlagener Auftrag bleibt mit Fehlergrund sichtbar und kann erneut ausgeführt werden; er wird dabei ans Ende der Warteschlange gestellt. | Muss |
| FA-18 | Vorgänge abbrechen/entfernen | Ein noch nicht gestarteter Auftrag kann aus der Warteschlange entfernt, ein laufender Render abgebrochen werden. | Soll |
| FA-19 | Geführte Reparatur kaputter Elemente | Verweisen Elemente auf ein **fehlendes Medium** (z. B. extern gelöschte Datei), führt die Anwendung den Nutzer **vor dem Rendern** aktiv durch die Reparatur: kaputte Elemente werden **nacheinander** hervorgehoben („X von N behoben") und können **neu verknüpft/importiert, ersetzt oder entfernt** werden; der Render wird **erst freigegeben, wenn alle behoben** sind. Betrifft auch **Aktions-Bilder** – fehlt das Bild einer Aktion, wird die Aktion repariert, was in einem Schritt **alle** Listenelemente behebt, die diese Aktion verwenden. | Soll |
| FA-20 | Parallele Anzeige (Split-Screen / Einblendung) — **Hauptbetriebsart** | Werbeinhalte laufen **parallel während eines Videos**: entweder als **Split-Screen** (Video oben verkleinert, Werbeband darunter, nichts verdeckt) oder als **Einblendung** (Video vollflächig, Band überlagernd). Während eines Videos können **mehrere Aktionen nacheinander** im Band rotieren. Die sequenzielle Werbepause (FA-04) bleibt zusätzlich möglich. Details: 4.5. | Muss |
| FA-21 | Rückgängig / Wiederherstellen | **Beide** Editoren – Projekt-Bearbeitung und Vorlagen-Editor – bieten **Undo/Redo** für Bearbeitungsschritte (Liste, Reihenfolge, Trim, Dauer, Aktionen, Zonen). **Nicht** rückgängig machbar sind abgeschlossene Vorgänge mit Dateiwirkung (Import, Löschen von Medien, Render, Export) – ein gelöschtes Medium muss neu importiert werden. | Muss |
| FA-22 | Mehrere benannte Ausgabedateien | Ein Projekt kann **mehrere** gerenderte MP4-Dateien vorhalten. Beim Speichern eines Renders vergibt der Nutzer den Dateinamen; vorbelegt ist der **zuletzt verwendete** Name, sodass wiederholtes Rendern die vorige Fassung standardmäßig **ersetzt** und der Ordner nicht zuläuft. Ein abweichender Name legt eine zusätzliche Datei an. Datum und Uhrzeit stehen in der Ausgabe-Liste der Anwendung, **nicht** im Dateinamen. | Muss |
| FA-23 | Marken-Bestand | Die Anwendung führt **mehrere Marken** in einem **app-weiten, projektunabhängigen** Bestand. Ein Projekt darf mehrere Marken verwenden; eine **Aktion** trägt **genau eine**. Eine Marke kann von einer anderen **abgeleitet** sein und einzelne Werte überschreiben (Saison- oder Kampagnen-Look). Die Fitnessworld24-Marke ist immer vorhanden und **nicht löschbar**. Eine Marke lässt sich nur löschen, wenn **keine Aktion** und **keine abgeleitete Marke** sie mehr nutzt. | Muss |
| FA-24 | Marken-Editor | Marken lassen sich in der Anwendung **anlegen, bearbeiten und ableiten**: Farben, Slogan, Sicherheitsabstände sowie **Import** von Logo und Schriftdateien. Bei zu geringem Kontrast zwischen Akzentfläche und darauf liegendem Text **warnt** die Anwendung sichtbar, verhindert die Wahl aber nicht. | Muss |

### 4.1 Gestaltung der Aktions-Segmente (Corporate Design)

Aktions-Segmente folgen dem Markenauftritt von Fitnessworld24 (24/7-Fitnessstudio, Weißensberg/Lindau am Bodensee). Gestalterische Grundlage ist die Website fitnessworld24.li. Ziel ist eine **Balance aus Wiedererkennbarkeit und Werbewirkung**: ein fester Markenrahmen sorgt für ein einheitliches, professionelles Erscheinungsbild, während klar definierte freie Bereiche jeder Aktion einen eigenen, ansprechenden Auftritt erlauben **Seit FA-23 gilt diese Zusage je Rahmen, nicht mehr für das ganze Video:** der Rahmen bleibt in der Projekt-Standardmarke, die Inhalte darin dürfen fremde Marken tragen (Abschnitt 4.8).

**Fester Rahmen (einheitlich, FA-11):**

- Studio-Logo an einer definierten Position.
- Durchgängige Markenfarbwelt und Typografie gemäß Website.
- Einheitliche Ränder/Sicherheitsabstände, abgestimmt auf die TV-Auflösung (4K bzw. 1080p) inkl. Rand zum Bildschirmrand.
- Optionaler, wiederkehrender Marken-Slogan im Stil der Website (z. B. „Trainiere wann du willst. Nicht wann es passt.").

**Variable Bereiche (Spielraum, FA-12):**

- Überschrift / Aktionstext (z. B. Angebot, Aktionsname).
- Motiv- oder Produktbild.
- Preis bzw. Call-to-Action (z. B. „Gratis Probetraining sichern").
- Akzentfarbe oder Aktions-Badge zur Hervorhebung.

### 4.2 Design-Tokens / Style-Guide

> **Diese Tabellen beschreiben die *eingebaute* Marke Fitnessworld24** – seit FA-23 den **Standard**, nicht die einzige Marke. Weitere Marken tragen dieselben Rollen mit eigenen Werten; die Rollen-Namen und ihre Bedeutung sind für **alle** Marken verbindlich (Technisches Konzept 9.11.2).

Aus dem Markenauftritt (Export der Website-Tokens) ergibt sich folgende Gestaltungsbasis. Wix-spezifische Editor-/Systemfarben wurden aussortiert (siehe Hinweis unten).

**Farben**

| Rolle | Hex | Anmerkung |
|---|---|---|
| Primär / Akzent (Rot) | `#FF4040` | **Primärfarbe** – Signal für Aktionen, Badges, CTA |
| Akzent kräftig | `#DF3131` | satte Variante |
| Akzent alternativ | `#D62B2B` | zweite Rot-Stufe |
| Dunkelrot | `#971316` | Akzenttext, Tiefe |
| Bordeaux / sehr dunkel | `#4B090B` | dunkle Flächen, starker Kontrast |
| Rot-Tint hell | `#F5AEAF` | dezente Hintergründe/Flächen |
| Schwarz / Text | `#212121` / `#202020` | Haupttext |
| Hintergrund dunkel (Charcoal) | `#2F2E2E` | dunkle Segment-Hintergründe |
| Weiß | `#FFFFFF` | Flächen, Text auf Dunkel |
| Grautöne | `#8F8F8F`, `#646464`, `#A0A09F`, `#CCCCCC`, `#E2E2E2` | Sekundärtext, Linien, Flächen |

**Typografie**

| Rolle | Schrift | Anmerkung |
|---|---|---|
| Headline / Display (elegant) | Playfair Display | Serif, für Überschriften |
| Headline / Display (kräftig) | Avenir 85 Heavy bzw. Arial Black | für plakative Werbe-Headlines/Slogans |
| Fließtext / UI | Helvetica / Helvetica Neue (Light, Roman, Bold) | Standardtext |

**Form & Tiefe**

- Eckenradius: Buttons/Badges als Pille (`30–50px`), Karten/Flächen `8–10px`, kleine Elemente `2px`.
- Schatten (Karten/Flächen, dezent): `0 4px 8px rgba(0,0,0,.1)`.

**Hinweis (aussortierte Wix-Artefakte):** Das Editor-Blau `#116DFF` (inkl. der zugehörigen Fokus-Schatten), das Standard-Link-Blau `#0000EE`, die Wix-Systemschrift „Madefor" sowie unaufgelöste Theme-Variablen (`color_xx`, Ricos-Text-Tupel) und CSS-Systemfarben (`Highlight`) gehören **nicht** zum Studio-Branding und werden nicht verwendet.

**Logo & Primärfarbe (geklärt):** Die verbindliche Primärfarbe ist `#FF4040`. Das offizielle Logo liegt vor (Quelle: Markenauftritt / Website).

### 4.3 Prozessverwaltung (Auftrags-Queue)

Länger laufende oder dateiverändernde Vorgänge — **Medien-Import, Löschen von Medien, finaler Render und USB-Export** — laufen nicht unsichtbar im Hintergrund, sondern werden als **Aufträge** in einer für den Nutzer sichtbaren Warteschlange geführt (FA-16). Damit bleibt der Systemzustand jederzeit nachvollziehbar, und Fehler gehen nicht verloren.

- **Sichtbarkeit (FA-16):** Zu jedem Zeitpunkt ist erkennbar, welcher Auftrag gerade läuft, welche anstehen und welche fehlgeschlagen sind (jeweils mit Klartext-Bezeichnung, bei Fehlern mit Fehlergrund).
- **Serielle Ausführung (NFA-09):** Es läuft stets nur **ein** Auftrag gleichzeitig; die übrigen warten in Reihenfolge. Das macht den Ablauf vorhersehbar und verhindert Konflikte — z. B. wartet das Löschen eines Mediums, das gerade in einen laufenden Render einfließt, automatisch, bis der Render fertig ist.
- **Wiederholen (FA-17):** Ein fehlgeschlagener Auftrag (z. B. Import einer beschädigten Datei, Export auf einen vollen USB-Stick) kann per Klick erneut ausgeführt werden; er wird dabei ans Ende der Warteschlange gestellt.
- **Abbrechen/Entfernen (FA-18):** Ein noch nicht gestarteter Auftrag kann aus der Warteschlange entfernt, ein laufender Render abgebrochen werden.
- **Lebensdauer:** Die *aktive* Warteschlange (laufende/anstehende Vorgänge) ist ein reines Laufzeit-Hilfsmittel und nach einem Neustart der Anwendung leer. **Fehlgeschlagene Vorgänge bleiben jedoch erhalten** – auch über einen Neustart hinweg –, damit sie nicht verloren gehen und später erneut ausgeführt werden können (FA-17).

Die interaktive Vorschau (FA-07) ist **kein** Auftrag und läuft unabhängig von der Warteschlange.

### 4.4 Dauer und Trim – einheitliche Bedienung

Dauer (FA-06) und Trim (FA-14) werden für **alle** Elementtypen über **denselben** Bedien-Baustein gesteuert – einen Balken mit Griffen, an denen der Nutzer die effektive Dauer zieht. Kürzen *und* Verlängern fühlen sich überall gleich an („wie Trimmen"); nur die Grenzen unterscheiden sich je nach Elementtyp:

- **Video (FA-14):** zwei Griffe (Anfang/Ende) innerhalb der **Quelllänge** des Videos. Kürzen schneidet Anfang/Ende weg; Verlängern ist **nur bis zur Quelllänge** möglich (mehr Material existiert nicht). Der Schnitt ist **nicht-destruktiv** – die Originaldatei bleibt unverändert.
- **Bild / Aktions-Segment (FA-06):** die effektive Anzeigedauer ist frei im Bereich **10–45 s** einstellbar (Standard 10 s). Da es keine Quelllänge gibt, ist die Obergrenze die konfigurierte Maximaldauer; Kürzen und Verlängern laufen über denselben Regler.

Der Regler zeigt die aktuelle effektive Dauer numerisch an. So bleibt die Bedienung über Video, Bild und Aktions-Segment hinweg konsistent, obwohl technisch ein Trim (Ausschnitt) und eine reine Anzeigedauer dahinterstehen.


---

### 4.5 Betriebsarten für Werbeinhalte (FA-20) — Split-Screen ist die Hauptbetriebsart

Werbeinhalte erscheinen auf **drei** Wegen. **Hauptbetriebsart ist die parallele Anzeige während eines Videos**; die sequenzielle Werbepause ist die zusätzliche Möglichkeit:

1. **Split-Screen (Hauptbetriebsart):** Während ein **Video läuft**, erscheint **darunter** ein durchgehendes **Werbeband**. Das Video wird dafür verkleinert, aber **nichts wird verdeckt**. Im Band können **mehrere Aktionen nacheinander rotieren**, solange das Video läuft.
2. **Einblendung (parallel, überlagernd):** Das Video bleibt **vollflächig**; das Werbeband liegt **darüber** und verdeckt den unteren Bildbereich. Vorteil: das Video behält seine volle Größe, ohne Seitenbalken.
3. **Sequenziell (Werbepause):** Eine Aktion wird als **eigenes, vollflächiges Segment** zwischen den Videos gezeigt (FA-04).

Welche Art eine Vorlage bedient, wird **bei der Vorlagenerstellung gewählt** (FA-13).

**Geometrie beim Split-Screen:** Der Bildrahmen bleibt 1920 × 1080. Die **Bandhöhe legt die Vorlage fest** (eingebaute Vorlage: **162 px**, 15 %); das Video nutzt die restliche Höhe (bei 162 px also **918 px**). Weil **kein Beschnitt** erlaubt ist, wird ein 16:9-Video höhenbegrenzt eingepasst (bei 918 px → **1632 × 918**); die verbleibenden Flächen links und rechts (je 144 px) werden in der **dunklen Markenfarbe** gefüllt, damit der Split gestaltet wirkt und nicht wie ungenutzter Platz.

**Bewusste Konsequenz beim Split-Screen:** Das Video erscheint kleiner (bei 162 px Band ca. 72 % der Fläche) — reine Geometrie bei festem 16:9-Rahmen, kein Fehler. Wer das Video in **voller** Größe behalten will, nutzt die **Einblendung** (Art 2), die dafür den unteren Bildbereich verdeckt.

**Platz im Band:** In ein 162 px hohes Band passt eine **kompakte Zeile** (Logo, Titel, Preis/CTA); eine längere Beschreibung ist dort nicht vorgesehen. Höhere Bänder sind über eigene Vorlagen möglich — sie verkleinern beim Split-Screen entsprechend das Video.

### 4.6 Vorlagen bearbeiten: Arbeitskopie und explizites Speichern (FA-13)

Vorlagen werden typischerweise **anhand eines konkreten Projekts** gestaltet – man sieht am echten Inhalt, ob das Layout trägt. Damit dabei nicht versehentlich laufende Werbung verändert wird, gilt ein **Zwei-Stufen-Ablauf**:

1. **Bearbeiten:** Wer eine Vorlage öffnet, arbeitet auf einer **Arbeitskopie**. Diese wird **automatisch gesichert** (nichts geht verloren), die genutzte Vorlage bleibt aber **unberührt**. Experimentieren ist damit gefahrlos.
2. **Abschließen:** Am Ende wird **explizit gespeichert**, mit der Wahl zwischen
   - **„Vorlage überarbeiten"** – die Änderungen wandern in die bestehende Vorlage. Vorher wird angezeigt, **wie viele Aktionen in wie vielen Projekten** davon betroffen sind, denn alle ändern ihr Aussehen.
   - **„Als neue eigenständige Vorlage"** – es entsteht eine zusätzliche Vorlage; die ursprüngliche bleibt unverändert.
   - **„Verwerfen"** – der Bearbeitungsstand wird fallengelassen.

**Eingebaute Vorlagen** lassen sich nicht überarbeiten; bei ihnen steht nur „als neue eigenständige Vorlage" zur Verfügung (sie bleiben als verlässliche Ausgangsbasis erhalten). **Halbfertige Arbeitskopien** stehen nicht zur Auswahl für Aktionen – sie können also nicht versehentlich in ein Video geraten.

---

### 4.7 Ausgabedateien: Benennung, Ersetzen, Export (FA-22)

Ein Projekt hält seine gerenderten Videos in einem **eigenen Ausgabeordner** (`projects/<projekt-id>/output/`).
Dass der Ordner **zum Projekt** gehört, ist wesentlich: Läge er anwendungsweit, würde ein Render in
Projekt B die noch nicht exportierte Datei von Projekt A überschreiben.

- **Benennung:** Der Nutzer vergibt beim Speichern des Renders den Dateinamen (z. B.
  `sommeraktion.mp4`). **Kein Zeitstempel im Namen** – Datum und Uhrzeit der Erzeugung zeigt die
  Anwendung in ihrer Ausgabe-Liste an. So bleibt der Name stabil, und eine neue Fassung ersetzt die
  alte auch auf dem USB-Speicher, statt sich daneben anzusammeln.
- **Ersetzen als Standard:** Vorbelegt ist der **zuletzt verwendete** Name. Wer nur eine Kleinigkeit
  korrigiert und neu rendert, überschreibt damit die vorige Fassung – nach zehn Probeläufen liegt
  **eine** Datei im Ordner, nicht zehn. Wer eine Fassung behalten will, vergibt einen neuen Namen.
- **Schutz der vorigen Fassung:** Ein Render, der abbricht oder fehlschlägt, darf die vorhandene
  Datei **nicht** beschädigen. Geschrieben wird zuerst vollständig unter einem Arbeitsnamen; erst die
  fertige Datei ersetzt die alte (technisch verbindlich im Technischen Konzept 9.2.6).
- **Export:** Der Nutzer wählt, **welche** Ausgabedatei auf den USB-Speicher geht; sie behält dort
  ihren Namen. Mehrere Dateien dürfen nebeneinander liegen.

---

### 4.8 Marken: Bestand, Ableitung, Zuweisung (FA-23, FA-24)

Bis v1.2 kannte das System **eine** Marke – die von Fitnessworld24. Mit FA-23 wird daraus ein
**Bestand**. Zwei Anlässe machen das nötig:

- **Partner- und Fremdwerbung.** Im Studio wird für Dritte geworben (etwa Nahrungsergänzungs-Hersteller).
  Diese Aktionen tragen die Marke des Partners, nicht die des Studios.
- **Saison- und Kampagnen-Looks.** Dieselbe Fitnessworld24-Marke in einer abweichenden Anmutung
  (Sommeraktion, Jahreswechsel) – gleiche Schriften, gleiches Logo, andere Farben.

**Was das an der Zusage aus 4.1 ändert – bitte bewusst lesen.** Der Satz „ein fester Markenrahmen sorgt
für ein einheitliches, professionelles Erscheinungsbild" gilt weiterhin, aber **je Rahmen**, nicht mehr
für das ganze Video: Der **Rahmen** (Band-Hintergrund, Restflächen neben einem eingepassten Video)
bleibt in der **Projekt-Standardmarke** stabil; die **Inhalte** darin dürfen fremde Marken tragen. Ohne
diese Trennung wechselte bei rotierenden Partner-Aktionen die Flächenfarbe im Sekundenrhythmus – auf
einem 85-Zoll-Schirm unruhig statt professionell.

**Bestand und Ablage.** Marken liegen **app-weit**, nicht im Projekt – wie die Vorlagen (4.6). Eine
Marke, die für ein Projekt angelegt wurde, steht damit allen zur Verfügung; ein Partner wird einmal
erfasst und nicht je Projekt erneut.

**Ableitung.** Eine Marke kann von einer anderen abgeleitet sein und **einzelne** Werte überschreiben.
Ein Saison-Look setzt also nur die Farben und erbt Schriften, Logo und Abstände. Ändert sich das
Fitnessworld24-Logo, wirkt das ohne Nacharbeit in allen abgeleiteten Looks. Ohne Ableitung müsste jede
Variante alles selbst tragen – und beim nächsten Logo-Wechsel würde eine vergessen.

**Zuweisung.** Jede **Aktion** trägt **genau eine** Marke. Elemente ohne Aktion (Video, Bild) tragen
keine eigene: Über sie zeichnet die Anwendung kein Logo; ihre Restflächen kommen aus der
Projekt-Standardmarke.

**Wenn eine Marke kein Logo hat** – bei Partnern der Normalfall –, zeichnet die Anwendung einen
**Ersatz**: den Markennamen auf farbigem Grund in der Akzentfarbe der Marke. Kein leerer Bereich und
kein fremdes Logo an dieser Stelle.

**Löschen.** Nur möglich, wenn **keine Aktion** und **keine abgeleitete Marke** sie nutzt – wie bei den
Vorlagen (4.6). Die Anwendung nennt vorher, was betroffen ist. Die eingebaute Fitnessworld24-Marke ist
**nie** löschbar, weil sie der Projekt-Standard und die Basis der abgeleiteten Looks ist; **bearbeitbar
ist sie aber**, damit eine echte Änderung des Corporate Designs nicht zu einer Kopie daneben führt.

**Eigene Schriften und Logos.** Der Editor importiert beides. Die Dateien werden in den Marken-Bestand
**kopiert**, die Originale bleiben unberührt (wie beim Medien-Import, FA-01). Fehlt eine importierte
Datei zur Renderzeit, **bricht der Render ab, bevor er beginnt** – ein stiller Rückfall auf eine andere
Schrift würde den Markenbruch erst am Fernseher zeigen.

---

## 5. Nicht-funktionale Anforderungen

| ID | Anforderung | Beschreibung | Priorität |
|---|---|---|---|
| NFA-01 | Bedienbarkeit | Übersichtliche, intuitive Oberfläche, ohne technische Vorkenntnisse durch Studio-Personal bedienbar. | Muss |
| NFA-02 | Stabilität | Die Anwendung arbeitet zuverlässig; ein Renderlauf läuft reproduzierbar und ohne Datenverlust durch. | Muss |
| NFA-03 | Ausgabe-Kompatibilität | Das erzeugte Video ist mit dem Media Player des Samsung-Fernsehers kompatibel (Container/Codec: MP4, H.264 High/Level 4.0, `yuv420p`, BT.709, mit **stiller** AAC-Tonspur – verbindlich in 9.2.4). | Muss |
| NFA-04 | USB-Kompatibilität | Die Ausgabe funktioniert von einem gängig formatierten USB-Speicher (z. B. exFAT/FAT32). | Muss |
| NFA-05 | Performance | Das Rendern einer üblichen Sequenz erfolgt in vertretbarer Zeit auf dem Arbeitsplatzrechner. | Soll |
| NFA-06 | Offline-Fähigkeit | Die Anwendung funktioniert vollständig lokal, ohne Internet- oder Serververbindung. | Muss |
| NFA-07 | Wartbarkeit | Klar strukturierter, dokumentierter Aufbau, damit das Tool später erweitert werden kann. | Soll |
| NFA-08 | Portabilität | Die Anwendung lässt sich auf einem Standard-Arbeitsplatzrechner einrichten und betreiben. | Soll |
| NFA-09 | Serielle Verarbeitung | Länger laufende Vorgänge (Import, Löschen, Render, Export) werden nacheinander ausgeführt; es läuft maximal ein Auftrag gleichzeitig. Das garantiert einen vorhersehbaren, konfliktfreien Ablauf. | Muss |

---

## 6. Technische Rahmenbedingungen (Vorschlag)

Die konkrete Technologiewahl ist nicht festgeschrieben; vorgeschlagen wird:

- **Render-Engine:** `ffmpeg` für das Verketten der Clips, das Erzeugen der Aktions-Segmente (Bild/Text → Videosegment) und das Encoding der finalen MP4.
- **Benutzeroberfläche:** Web- oder Desktop-Oberfläche (z. B. Browser-App oder Electron) mit Liste, Drag-and-drop-Reihenfolge und Vorschau.
- **Datenhaltung:** lokale Speicherung der Projektdaten (z. B. JSON oder SQLite) sowie der importierten Medien im Dateisystem.
- **Zielformat der Ausgabe:** MP4, **H.264 High / Level 4.0**, **1920 × 1080, 30 fps**, `yuv420p`, **BT.709**, gedeckeltes VBR (10–12 Mbit/s), **stille AAC-Tonspur**, `+faststart`. Verbindlich als `RenderProfile` im Technischen Konzept 9.2.4. Die zunächst offene 4K-Option ist zugunsten von 1080p entschieden.

---

## 7. Wiedergabe am Fernseher (Demo-Modus)

Die Wiedergabe der fertigen MP4 erfolgt über den eingebauten Media Player. Folgende Punkte sind für einen stabilen Dauerbetrieb relevant:

- **Wiederholung:** Quelle USB wählen, die gewünschte Datei starten und **„Wiederholen: eine Datei" („Repeat One")** aktivieren, damit **genau dieses** Video als Endlosschleife läuft.
- **Warum nicht „Repeat All":** Liegen mehrere Ausgabedateien auf dem Speicher (FA-22), würde „Repeat All" den Ordner durchlaufen und bei **jedem** Dateiwechsel kurz die Bedienleiste zeigen (Risiko R-04). Genau das soll die eine durchgehende Datei je Schleife vermeiden.
- **Demo-/Store-Modus:** Über den Store-Modus (mit deaktiviertem Demo-Overlay/E-POP) kann der Fernseher die USB-Schleife nach dem Einschalten automatisch starten. Dieses Verhalten ist **modell- und firmwareabhängig und am vorhandenen Gerät zu verifizieren** (siehe Risiken).
- **Energieoptionen:** Automatisches Ausschalten, Energiesparmodus und Bildschirmschoner sind zu deaktivieren, damit der Loop nicht unterbrochen wird.
- **Aktualisierung der Inhalte:** Inhalte werden aktualisiert, indem die MP4 auf dem USB-Speicher durch eine neue Version **gleichen Namens** ersetzt wird. Behält die Datei ihren Namen, bleibt die am Fernseher eingestellte Auswahl gültig; ein neuer Name erfordert, die Datei am Gerät erneut auszuwählen.
- **Mehrere Dateien auf dem Speicher:** Zulässig (FA-22). Das Personal wählt die gewünschte Datei am Gerät aus. Je mehr Dateien, desto größer die Verwechslungsgefahr – sprechende Namen helfen.

---

## 8. Abgrenzung (Out of Scope)

Nicht Bestandteil der ersten Version:

- Entwicklung und Deployment einer App **direkt auf dem Fernseher** (Tizen/Smart-TV-App).
- Cloud-Anbindung, Netzwerk-Synchronisation oder Fernverwaltung.
- Mehrbenutzerbetrieb bzw. gleichzeitige Bearbeitung.
- Zeit-/Kalendersteuerung (Scheduling) der Wiedergabe.
- Verwaltung mehrerer Standorte/Bildschirme von zentraler Stelle.
- Automatische Verteilung des Videos (außer Ablage auf USB).

---

## 9. Annahmen

- Es ist zunächst **ein** Studio-Bildschirm zu bespielen (Prototyp/erste Ausbaustufe).
- Die Inhalte (Videos, Produktinfos, Bilder) liegen in verwertbarer Form vor bzw. werden vom Studio bereitgestellt.
- Der Fernseher verbleibt im Studio dauerhaft eingeschaltet bzw. wird täglich von Personal eingeschaltet.
- Das Ausgabevideo wird voraussichtlich **ohne Ton** (stummgeschaltet) wiedergegeben.

---

## 10. Risiken und offene Punkte

| ID | Thema | Beschreibung / zu klären |
|---|---|---|
| R-01 | Auto-Start im Demo-Modus | Ob der konkrete Fernseher (UE85AU7170, FW T-KSU2EDEUC-2111.1) die USB-Schleife nach dem Einschalten automatisch startet, muss am Gerät getestet werden. |
| R-02 | Manueller Neustart | Ohne funktionierenden Auto-Start muss der Loop nach Stromausfall/Einschalten manuell gestartet werden – Ablauf für das Personal definieren. |
| R-03 | Codec-/Format-Kompatibilität | Konkrete Encoding-Parameter sind am Gerät zu verifizieren (Auflösung, Bitrate, Audiospur). |
| R-04 | Steuerleisten-Einblendung | Beim Wiederholen kann sich kurz eine Bedienleiste einblenden; durch eine einzige lange MP4 **je Schleife** wird dies minimiert. **Verschärft durch FA-22:** Liegen mehrere Dateien auf dem Speicher, muss am Gerät „Repeat One" (nicht „Repeat All") eingestellt sein – sonst tritt der Effekt bei jedem Dateiwechsel auf (Abschnitt 7). |
| R-05 | Energie-/Timeout-Verhalten | Energiespar- und Abschalt-Einstellungen müssen korrekt gesetzt sein, damit die Schleife nicht abbricht. |
| R-06 | Ton | **ENTSCHIEDEN:** Die Ausgabe ist **still**, enthält aber eine **stille AAC-Tonspur** – manche Player/TVs erwarten eine Audiospur und verhalten sich bei rein-Video-MP4 eigenartig. Verbindlich im Technischen Konzept 9.2.4. |
| R-07 | Fremdschriften und Lizenzen | Die vier mitgelieferten Schriften sind bewusst frei lizenziert (OFL). Für **importierte** Schriften (FA-24) trägt der Nutzer die Nutzungsrechte – die Anwendung brennt sie in ein Video ein, das weitergegeben und öffentlich gezeigt wird. Vor dem Import einer Fremdschrift ist die Lizenz zu prüfen. |
| R-08 | Unlesbarer Kontrast | Die Akzentfarbe einer Aktion ist ab FA-24 ein **freier** Farbwert (vorher nur Auswahl aus der Palette). Damit sind Kombinationen möglich, die am 85-Zoll-Schirm aus mehreren Metern unlesbar sind. Gegenmaßnahme ist die **Warnung** (FA-24), nicht die Sperre – Partner-Hausfarben sollen nicht an einem Schwellenwert scheitern. Die Restverantwortung bleibt beim Nutzer; maßgeblich ist die Kontrolle am Gerät. |

---

## 11. Ausbaustufen (Roadmap, optional)

Bei späterem Bedarf ohne Architekturbruch erweiterbar:

- **Dedizierter Player (z. B. Raspberry Pi):** ermöglicht echten Auto-Start beim Booten und automatische Wiederherstellung nach Absturz.
- **Mehrere Studios / zentrale Verwaltung:** zentrale Inhaltsverwaltung mit Verteilung an mehrere Bildschirme.
- **Scheduling:** zeit- oder tagesabhängige Steuerung der angezeigten Inhalte.

---

## 12. Akzeptanzkriterien

Die erste Version gilt als erfolgreich, wenn:

1. Videos sowie Produkte/Aktionen über die Oberfläche angelegt, bearbeitet, gelöscht und in der Reihenfolge angeordnet werden können (FA-01 bis FA-05).
2. Aus der Zusammenstellung **eine durchgehende** abspielbare MP4-Datei erzeugt und auf einen USB-Speicher exportiert wird (FA-08, FA-09).
3. Diese MP4 auf dem Studio-Fernseher als Endlosschleife wiedergegeben wird (Abschnitt 7).
4. Die Bedienung ohne technische Vorkenntnisse möglich ist (NFA-01).
5. Länger laufende Vorgänge (Import, Render, Export) in der Prozessübersicht sichtbar sind und fehlgeschlagene Vorgänge erneut ausgeführt werden können (FA-16, FA-17).
6. Änderungen gehen nicht verloren: die Anwendung speichert fortlaufend automatisch und stellt beim Start das zuletzt aktive Projekt wieder her (FA-15, NFA-02).
7. Fehlende Medien werden vor dem Rendern erkannt und der Nutzer wird geführt, bis alle kaputten Elemente behoben sind (FA-19).
8. Werbeinhalte können **parallel** während eines Videos als Band unten angezeigt werden, mit mehreren rotierenden Aktionen (FA-20, Abschnitt 4.5).
9. Ein Projekt kann mehrere benannte Ausgabedateien vorhalten; erneutes Rendern unter demselben Namen ersetzt die vorige Fassung, ohne sie bei einem Fehlschlag zu beschädigen (FA-22, Abschnitt 4.7).
10. Eine Aktion kann eine andere als die eingebaute Marke tragen; das gerenderte Video zeigt deren Logo und Farben, während Band-Hintergrund und Restflächen in der Projekt-Standardmarke bleiben (FA-23, FA-24, Abschnitt 4.8).

---

## 13. Glossar

- **Digital Signage:** Digitale Beschilderung – computergesteuerte Anzeige von Inhalten auf Bildschirmen.
- **Aktions-Segment:** Aus einem Produkt/einer Aktion erzeugter Video- oder Bildabschnitt mit fester Anzeigedauer.
- **Rendering:** Erzeugen der finalen Videodatei aus den zusammengestellten Einzelelementen.
- **Demo-/Store-Modus:** Betriebsmodus des Fernsehers, der u. a. die automatische USB-Wiedergabe ermöglicht.
- **Split-Screen:** Hauptbetriebsart – das Video läuft verkleinert oben, darunter ein Werbeband; nichts wird verdeckt (4.5).
- **Einblendung:** Parallele Anzeige, bei der das Video vollflächig bleibt und das Werbeband darüber liegt (verdeckt den unteren Bildbereich).
- **Werbeband (Band):** Der schmale Bereich mit Werbeinhalt bei Split-Screen bzw. Einblendung; seine Höhe legt die Vorlage fest.
- **Vorlage:** Datengetriebene Layout-Definition aus Zonen (feste Markenzonen + freie Zonen). Ihre *Art* bestimmt, ob sie ein vollflächiges Segment, ein Split-Screen-Band oder eine Einblendung beschreibt.
- **Arbeitskopie:** Bearbeitungsstand einer Vorlage. Wird automatisch gesichert, verändert die genutzte Vorlage aber erst beim expliziten Speichern (4.6).
- **Auftrag / Auftrags-Queue:** Ein länger laufender oder dateiverändernder Vorgang (Import, Löschen, Render, Export) wird als *Auftrag* in einer *Warteschlange* (Queue) geführt. Aufträge werden nacheinander abgearbeitet und sind für den Nutzer sichtbar (laufend, anstehend, fehlgeschlagen).
