# -*- coding: utf-8 -*-
"""Legt Issues eines Meilensteins auf GitHub an.

    python tools/create-issues.py <verzeichnis> <milestone> [--go]

<verzeichnis> enthält eine Datei je Issue, benannt <PRAEFIX>-<NR>.md, deren erste Zeile
`### Issue <PRAEFIX>-<NR>: <Titel>` lautet; der Rest ist der Issue-Body.

Ohne --go nur Trockenlauf: zeigt Titel und Labels, legt nichts an. IMMER erst trocken
laufen lassen - beim M1-Lauf hat der Trockenlauf zwei Skriptfehler aufgedeckt, bevor
etwas nach außen ging (ein Regex fraß mit re.S das ganze Dokument; ein Titel trug noch
Backticks und einen Sx-Verweis).

Nach dem Anlegen ist ein ZWEITER Durchgang nötig: die Querverweise im Text (z.B. M1-20)
kennen die echten Issue-Nummern erst danach. Das Mapping landet in <verzeichnis>/map.json;
damit die Bodies erneut durchlaufen und per `gh issue edit` nachziehen.

Die Label-Vergabe folgt einem PROFIL je Meilenstein, gewählt über den Dateinamen-Präfix
(M1-07.md -> Profil "M1"). Ein unbekannter Präfix ist ein Abbruchgrund: Label sind eine
Beurteilung je Meilenstein, kein Textmuster - lieber anhalten als falsch etikettieren.
Der Trockenlauf prüft zusätzlich, ob alle verwendeten Label und der Milestone auf GitHub
existieren; `gh issue create` legt beides NICHT an und bricht sonst mitten in der Reihe ab.
"""
import io, os, re, sys, json, subprocess
sys.stdout.reconfigure(encoding="utf-8")

if len(sys.argv) < 3:
    print(__doc__); sys.exit(1)
B    = sys.argv[1].rstrip("/")
MILE = sys.argv[2]
GO   = "--go" in sys.argv
MAP  = f"{B}/map.json"
OUT  = f"{B}/bodies"
os.makedirs(OUT, exist_ok=True)

# ---------------------------------------------------------------------------
# Profile je Meilenstein. Der Präfix der Dateinamen (M1-07.md -> "M1") wählt aus.
# Die Zuordnungen stehen bewusst als EXPLIZITE Listen: die Label-Vergabe ist eine
# Beurteilung, keine Textheuristik (Begründung s. BLOCKIEREND weiter unten).
# ---------------------------------------------------------------------------

# --- M1 (Fundament, Issues #13-#52) -----------------------------------------
# Datenverlust-Risiko: Schreiben, Löschen, Lock, Migration, Nebenläufigkeit
RISIKO_DATEN = {19, 20, 21, 24, 25, 28, 31, 34, 35, 36, 39}
# Sicherheit: Nutzlast-Validierung an der Grenze, Pfad-Ausbruch, Protokoll
RISIKO_SICHER = {11, 37, 38}

# `braucht-entscheidung`: bewusst als EXPLIZITE Liste, nicht per Textheuristik.
# Regel B verlangt von JEDEM Issue einen STOPP-Block, damit trifft "hat offene Punkte"
# auf 37 von 40 zu und wäre als Label reines Rauschen. Ein Regex-Versuch auf
# "blockierende" Formulierungen war zu brüchig (übersah M1-07/19/23, weil dort
# "nachfragen, bevor M2 darauf aufbaut" bzw. Fragesätze stehen).
# Hier stehen die Issues, bei denen eine unbeantwortete Frage die SCHNITTSTELLE oder
# das VERHALTEN festlegt - ein Agent kann dort ohne Antwort kein korrektes Ergebnis
# liefern, nur eines, das später umgebaut werden muss:
BLOCKIEREND = {
     7,  # Struktur von HistorieEintrag - ohne sie ist der Typ nicht definierbar
    15, 16, 18,  # config.json synchron oder entprellt -> bestimmt die Fehlerpfad-Tabelle
    19,  # braucht config-store eine eigene Serialisierung? -> Lost Update
    23,  # Schreib-Lock fuer einen reinen Lesezugriff?
    24,  # letzterAusgabeName im Duplikat zuruecksetzen?
    25,  # Umgang mit gesperrten Dateien beim Loeschen
    26,  # welcher Fehlercode bei fehlendem aktivem Projekt
    29,  # darf ein Asset mit zustand "fehlt" hinzugefuegt werden?
    32,  # rundet der Store oder erst der Render-Pfad?
    35,  # Wiederhol-Strategie, Verhalten bei Flush-Fehler beim Beenden
    39,  # reicht requestSingleInstanceLock fuer zwei Kopien derselben portablen EXE?
    # --- Nachzuegler vom 03.08. (M1-41..M1-46, Nummern ab #72) ---
    42,  # zaehlt Aktion.bildRef als Referenz? -> entscheidet, ob ein Loeschen blockiert
}
# Nachzuegler: D1-Mutationen (41-43) bzw. Nutzlast-Validierung an der Grenze (45/46).
RISIKO_DATEN  |= {41, 42, 43}
RISIKO_SICHER |= {45, 46}

# --- M2 (Torwächter, auftrags-manager) --------------------------------------
# Datenverlust: die Speicher, in denen echte Nutzdaten liegen (Wiederhol-Fähigkeit,
# dauerhaftes Protokoll, offene Löschungen) und der gemeinsame Schreib-Baustein.
# Q4 (M2-05) steht bewusst NICHT drin: rein diagnostisch, ein Verlust kostet nichts.
M2_RISIKO_DATEN = {3, 4, 14, 17, 18}
# Sicherheit: Nutzlast-Validierung an der Prozessgrenze (der Main vertraut dem
# Renderer nicht, TK 9.1.1 Punkt 6) - beim Einreihen und bei der Kanal-Verdrahtung.
M2_RISIKO_SICHER = {9, 19}

# `braucht-entscheidung` fuer M2, nach dem Pruef- und Korrekturlauf vom 03.08.:
# 9 von 19. Alle uebrigen STOPP-Bloecke enthalten nach der Korrektur nur noch
# VERBOTE (Anweisungen), die keine Rueckfrage brauchen.
M2_BLOCKIEREND = {
     1,  # ausgabe.pfad absolut oder projektrelativ (dauerhaftes Protokoll, portable App)
     9,  # ueber welche project-store-Funktion kommt der originalname fuer den Klartext
    12,  # Verhalten ohne geoeffnetes Projekt - haengt an #38, muss einheitlich sein
    13,  # Drosselung des Ereignisses bei Fortschrittsaenderungen
    15,  # Projektwechsel: app-weite Schlange vs. projektbezogenes Q2
    16,  # Struktur des historieEintrag - geerbt aus #19
    17,  # Rename-mit-Ersetzen auf Windows, fsync vor Erfolg
    18,  # Verhalten, wenn Q3/Q2 nicht schreibbar sind, der Auftrag aber lief
    19,  # Aufrufzeitpunkt der Verdrahtung, Versand bei mehreren Fenstern
}

def hat_fehlertabelle(body, codes):
    """True, wenn der Abschnitt "Fehlerpfade" eine TABELLENZEILE mit echtem Code hat.

    Bewusst nur Zeilen, die mit "|" beginnen: Ein reines Typ-Issue traegt dort
    "entfaellt", nennt Fehlercodes aber im erklaerenden Fliesstext darunter - das
    hat im ersten M3-Trockenlauf faelschlich das Label ausgeloest (M3-01).
    """
    abschnitt = body.split("## Fehlerpfade")[-1].split("## Nicht selbst entscheiden")[0]
    treffer = [z for z in abschnitt.splitlines() if z.lstrip().startswith("|")]
    return any(re.search(r"`(" + codes + r")`", z) for z in treffer)


def labels_m2(nr, titel, body):
    L = []
    if "[contracts]" in titel:
        L += ["modul:contracts", "ebene:geteilt", "art:typen"]
    elif "[auftrags-manager]" in titel:
        L += ["modul:auftrags-manager", "ebene:main", "art:logik"]
    if nr in M2_RISIKO_DATEN:  L.append("risiko:datenverlust")
    if nr in M2_RISIKO_SICHER: L.append("risiko:sicherheit")
    # Nur wenn der Abschnitt "Fehlerpfade" wirklich eine Tabelle MIT Codes traegt.
    # Ueber den ganzen Body gesucht traefe das auch reine Typ-Issues, die einen
    # Fehlercode nur im Fliesstext erwaehnen (M2-01 im ersten Trockenlauf).
    if hat_fehlertabelle(body, r"ungueltige_eingabe|nicht_gefunden|speicher_fehler|unbekannter_fehler"):
        L.append("art:fehlerbehandlung")
    if nr in M2_BLOCKIEREND: L.append("braucht-entscheidung")
    return L

# --- M3 (Medien, media-service) ---------------------------------------------
# Datenverlust: alles, was Mediendateien kopiert, umbenennt, loescht oder den
# D1-Zustand eines Assets aendert. M3-13 (offene Loeschungen nachholen) steht
# NICHT drin - es ruft nur M3-09 und aendert selbst nichts.
M3_RISIKO_DATEN = {7, 8, 9, 10, 11, 12}
# Sicherheit: Nutzlast-Validierung an der Prozessgrenze (TK 9.1.1 Punkt 6).
M3_RISIKO_SICHER = {16}
# Verpackung: ffprobe-Binary im gepackten Zustand (asar-Falle, s. #6).
M3_RISIKO_VERPACKUNG = {5}
# Haertung: Wiederholversuche gegen gesperrte Dateien auf Windows.
M3_HAERTUNG = {9}
# Reine Typ-/Konstantendateien ohne Logik.
M3_TYPEN = {1, 2}

# `braucht-entscheidung` fuer M3, nach Prueflauf und Korrektur (03.08.): 6 von 17.
# Zwei davon sind EXPERIMENTE, keine Entscheidungen - sie lassen sich erst am
# laufenden Grundgeruest beantworten (s. uebergabe-stand.md Abschnitt 4b).
M3_BLOCKIEREND = {
     5,  # Laenge der ffprobe-Zeitgrenze: zu kurz weist gute Dateien ab, zu lang blockiert die Queue
     6,  # EXPERIMENT: liefert unser geb. ffprobe die Drehung als tags.rotate oder als side_data_list?
     7,  # meldet das Kopieren Fortschritt? -> zusaetzlicher Parameter = Schnittstellenaenderung
     8,  # dieselbe Fortschrittsfrage auf der Ablaufebene
     9,  # EXPERIMENT: Anzahl/Abstand der Wiederholversuche bei EBUSY/EPERM auf Windows
    17,  # was gilt, wenn Schritt 2 oder 3 scheitert, Schritt 1 aber gelang
}

def labels_m3(nr, titel, body):
    L = []
    if "[contracts]" in titel:
        L += ["modul:contracts", "ebene:geteilt", "art:typen"]
    elif "[ipc-gateway]" in titel:
        L += ["modul:ipc", "ebene:main", "art:logik"]
    elif "[media-service]" in titel:
        L += ["modul:media-service", "ebene:main"]
        L += ["art:typen"] if nr in M3_TYPEN else ["art:logik"]
    if nr in M3_RISIKO_DATEN:       L.append("risiko:datenverlust")
    if nr in M3_RISIKO_SICHER:      L.append("risiko:sicherheit")
    if nr in M3_RISIKO_VERPACKUNG:  L.append("risiko:verpackung")
    if nr in M3_HAERTUNG:           L.append("art:haertung")
    if hat_fehlertabelle(body, r"ungueltige_eingabe|nicht_gefunden|speicher_fehler|unbekannter_fehler"
                               r"|datei_fehler|kopier_fehler|probe_fehler|asset_referenziert|asset_nicht_gefunden"):
        L.append("art:fehlerbehandlung")
    if nr in M3_BLOCKIEREND: L.append("braucht-entscheidung")
    return L


# --- M4 (Pixel: template-canvas, Vorlagen) ----------------------------------
# Datenverlust: die app-weite Vorlagen-Bibliothek schreiben bzw. loeschen.
M4_RISIKO_DATEN = {4, 13}
# Sicherheit: Nutzlast-Validierung an der Prozessgrenze.
M4_RISIKO_SICHER = {15}
# Pixelgleichheit: alles, was zeichnet oder das Gezeichnete ausgibt. Der Kern
# des Meilensteins - driftet hier etwas, sieht der Nutzer etwas anderes als der
# Fernseher, und zwar lautlos.
M4_PIXEL = {2, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25}
# Verpackung: gebuendelte Schriften bzw. gebuendeltes Logo im gepackten Zustand.
M4_RISIKO_VERPACKUNG = {16, 25}
# Reine Typ-/Datendateien ohne Logik.
M4_TYPEN = {1, 2, 3}

# `braucht-entscheidung` fuer M4, nach Prueflauf und Korrektur: 11 von 25.
# Auffaellig viele EXPERIMENTE - Canvas-, Schrift- und Bundler-Verhalten laesst
# sich nicht am Schreibtisch entscheiden, sondern nur am Grundgeruest ausprobieren.
M4_BLOCKIEREND = {
     4,  # wie erfaehrt die Oberflaeche von einem gescheiterten entprellten Schreibvorgang
     6,  # welche festen Zonen bekommt ein Band != 162 px und eine einblendung-Vorlage
     8,  # Bandhoehe aendern vs. feste Zone hintergrund, die nicht veraendert werden darf
    12,  # ungespeicherte Aenderungen des aktiven Projekts + Vollstaendigkeit der Projektliste (#35)
    13,  # dieselbe Frage mit unmittelbarer Datenverlust-Folge
    15,  # bekommt die Nutzungsanzeige (TK 9.12.2) einen eigenen Kanal
    16,  # EXPERIMENT: genuegt FontFace.load() fuer Canvas-Text (offen in #8)
    17,  # Reichweite von media:// (offen in #50) + voruebergehender Ladefehler vs. fehlendes Medium
    23,  # ueberschreibt aktion.akzentfarbe die Farb-Rollen der Vorlage
    24,  # EXPERIMENT: verunreinigt media:// das Canvas -> toBlob scheitert bei JEDEM Motiv
    25,  # wie wird aus marke.logo.datei eine ladbare Bundle-URL, und wer ruft wann vor
}

def labels_m4(nr, titel, body):
    L = []
    if "[contracts]" in titel:
        L += ["modul:contracts", "ebene:geteilt", "art:typen"]
    elif "[vorlagen-store]" in titel:
        L += ["modul:vorlagen-store", "ebene:main"]
        L += ["art:typen"] if nr in M4_TYPEN else ["art:logik"]
    elif "[template-canvas]" in titel:
        L += ["modul:template-canvas", "ebene:renderer"]
        L += ["art:typen"] if nr in M4_TYPEN else ["art:logik"]
    if nr in M4_RISIKO_DATEN:      L.append("risiko:datenverlust")
    if nr in M4_RISIKO_SICHER:     L.append("risiko:sicherheit")
    if nr in M4_RISIKO_VERPACKUNG: L.append("risiko:verpackung")
    if nr in M4_PIXEL:             L.append("risiko:pixelgleichheit")
    if hat_fehlertabelle(body, r"ungueltige_eingabe|nicht_gefunden|speicher_fehler|unbekannter_fehler"
                               r"|vorlage_referenziert|parent_eingebaut|png_export_fehler"):
        L.append("art:fehlerbehandlung")
    if nr in M4_BLOCKIEREND: L.append("braucht-entscheidung")
    return L

# ---------------------------------------------------------------- M5 (Inhalte)
# Die drei Bedien-Oberflaechen plus vier Nachtraege, die der Prueflauf erzwungen
# hat (M5-32 Ereignis-Abo, M5-33 setzeElementReferenz, M5-34 deren Verdrahtung,
# M5-35 Zeichenvoraussetzungen, M5-36 Vorlagen-Uebersicht).

# Alles, was D1 oder vorlagen.json veraendert bzw. Arbeit verlieren kann.
M5_RISIKO_DATEN = {1, 7, 15, 24, 30, 33}
# Alles, was zeichnet oder das Zeichnen vorbereitet - Vorschau muss pixelgleich
# zum finalen Segment-PNG sein, sonst sieht der Fernseher etwas anderes als der Nutzer.
M5_PIXEL = {9, 11, 21, 25, 26, 27, 28, 29, 31, 35}
# Prozessgrenze: der einzige Renderer-Zugang zu Main-Ereignissen.
M5_RISIKO_SICHER = {32, 34}
# Ueberwiegend Bedienoberflaeche statt Fachlogik.
M5_UI = {3, 4, 5, 6, 10, 13, 14, 16, 18, 19, 20, 23, 24, 25, 26, 27, 28, 30, 31, 36}

# `braucht-entscheidung` fuer M5, nach Prueflauf und Korrektur: 15 von 36.
# Die drei uebergreifenden Fragen (E1 Renderer-Sicht, E2 Ereignisse, E3 Fehlercodes)
# sind ENTSCHIEDEN und deshalb hier NICHT mehr vertreten - sonst haetten 26 das Label.
M5_BLOCKIEREND = {
     1,  # Existenz-/Art-Pruefung der bandVorlageId (project-store -> vorlagen-store) + Dauer-Bereich
     2,  # es gibt keinen nebenwirkungsfreien Lese-Kanal fuer den Projektstand
     6,  # Verhalten des Reglers bei zustand 'fehlt'
     7,  # project:autoSpeichernStatus hat im Main keinen Sender -> Fehlerklasse 2 unversorgt
    15,  # Rueckfrage bei vorhandener Ausgabedatei + wer den Sofort-Flush vor dem Render ausloest
    16,  # gilt ein bildRef auf ein Video als kaputt
    17,  # darf ein leeres aenderungen-Objekt gesendet werden
    19,  # prueft ueberhaupt jemand main-seitig, dass bildRef auf ein existierendes Asset zeigt
    20,  # wie wirkt akzentfarbe auf das gezeichnete Segment (offen in #117/#112)
    24,  # Flush-Ausloeser beim Reiterwechsel + Bandhoehe/Name (Vertragsluecke, haengt an #102)
    30,  # die Nutzungsanzeige (TK 9.12.2) hat keinen Kanal (#106/#109)
    32,  # was tut abonniere, wenn window.api.on fehlt (dieselbe Antwort wie die offene Frage in #24)
    33,  # darf das Ziel zustand 'fehlt' sein (offen in #41) + Zeitpunkt von Project.geaendertAm
    35,  # voruebergehender Ladefehler vs. fehlendes Medium; wer nach dem Import den Bestand leert
    36,  # offener Zweig aus #100 (feste Zonen bei abweichender Bandhoehe / art einblendung)
}

def labels_m5(nr, titel, body):
    L = []
    if "[project-store]" in titel:
        L += ["modul:project-store", "ebene:main", "art:logik"]
    elif "[ipc-gateway]" in titel:
        L += ["modul:ipc", "ebene:main", "art:logik"]
    elif "[ipc-client]" in titel:
        L += ["modul:ipc", "ebene:renderer", "art:logik"]
    elif "[composer]" in titel:
        L += ["modul:composer", "ebene:renderer"]
    elif "[action-editor]" in titel:
        L += ["modul:action-editor", "ebene:renderer"]
    elif "[vorlagen-editor]" in titel:
        L += ["modul:vorlagen-editor", "ebene:renderer"]
    # Renderer-Module: art:ui wo bedient wird, art:logik wo gerechnet wird.
    if "ebene:renderer" in L and "art:logik" not in L:
        L.append("art:ui" if nr in M5_UI else "art:logik")
    if nr in M5_RISIKO_DATEN:  L.append("risiko:datenverlust")
    if nr in M5_RISIKO_SICHER: L.append("risiko:sicherheit")
    if nr in M5_PIXEL:         L.append("risiko:pixelgleichheit")
    if hat_fehlertabelle(body, r"ungueltige_eingabe|nicht_gefunden|speicher_fehler|unbekannter_fehler"
                               r"|vorlage_referenziert|parent_eingebaut|kaputte_elemente"):
        L.append("art:fehlerbehandlung")
    if nr in M5_BLOCKIEREND: L.append("braucht-entscheidung")
    return L

# ------------------------------------------------------ M6 (Render & Export)
# Der Meilenstein, der die Datei erzeugt, die im Studio auf dem Fernseher laeuft.
# Besonderheit gegenueber M1-M5: Ein Fehler faellt hier NICHT im Test auf - ffmpeg
# meldet Erfolg, die Datei entsteht, sie laeuft auf dem Laptop, und erst am
# Consumer-TV ruckelt sie, zeigt falsche Farben oder friert nach dem ersten
# Segment ein. Deshalb ein eigenes Risiko-Label (s. u.).

# TV-KRITISCH: hier entscheidet sich, ob die MP4 am Samsung-Fernseher laeuft.
# Encoder-Flags, Tonspur, Filterketten, Trim, concat, Uniformitaet, Verifikation.
M6_TV = {6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 19, 21, 22, 25, 26}
# D1/Ausgabedatei/Stick - alles, was Arbeit oder eine gute Datei zerstoeren kann.
M6_RISIKO_DATEN = {17, 24, 25, 26, 31, 32, 33, 37}
# Prozessgrenze und Kanal-Anmeldung.
M6_RISIKO_SICHER = {3, 4, 36}
# Reine Typdateien ohne Logik.
M6_TYPEN = {1, 2}

# `braucht-entscheidung` fuer M6, nach Prueflauf und Korrektur: 5 von 37.
# Auffaellig: drei davon sind EXPERIMENTE (Abschnitt 4b des Uebergabe-Prompts) -
# Plattform- und Binary-Verhalten laesst sich nicht am Schreibtisch entscheiden.
M6_BLOCKIEREND = {
     8,  # EXPERIMENT: dreht das mitgelieferte ffmpeg hochkant aufgenommene Videos richtig
    13,  # EXPERIMENT: kennt das Binary qtrle (Alpha in der Bandspur), sonst welches Ersatzformat
    29,  # EXPERIMENT: wie erkennt man FAT32 auf Windows und macOS zuverlaessig
    36,  # an welches BrowserWindow gehen Ereignisse (offen seit #71, betrifft zwei Verdrahtungen)
    37,  # wo liegt der Halter des aktiven Project (drei benannte Varianten)
}

def labels_m6(nr, titel, body):
    L = []
    if "[contracts]" in titel:
        L += ["modul:contracts", "ebene:geteilt", "art:typen"]
    elif "[ipc-gateway]" in titel:
        L += ["modul:ipc", "ebene:main", "art:logik"]
    elif "[ffmpeg-adapter]" in titel:
        L += ["modul:ffmpeg-adapter", "ebene:main", "art:logik"]
    elif "[render-service]" in titel:
        L += ["modul:render-service", "ebene:main"]
        L += ["art:typen"] if nr in M6_TYPEN else ["art:logik"]
    elif "[export-service]" in titel:
        L += ["modul:export-service", "ebene:main"]
        L += ["art:typen"] if nr in M6_TYPEN else ["art:logik"]
    elif "[project-store]" in titel:
        L += ["modul:project-store", "ebene:main", "art:logik"]
    if nr in M6_RISIKO_DATEN:  L.append("risiko:datenverlust")
    if nr in M6_RISIKO_SICHER: L.append("risiko:sicherheit")
    if nr in M6_TV:            L.append("risiko:tv-ausgabe")
    if hat_fehlertabelle(body, r"ungueltige_eingabe|nicht_gefunden|speicher_fehler|unbekannter_fehler"
                               r"|medium_fehlt|ungueltiges_element|ffmpeg_fehler|kein_platz"
                               r"|ziel_gesperrt|keine_ausgabe|schreib_fehler"):
        L.append("art:fehlerbehandlung")
    if nr in M6_BLOCKIEREND: L.append("braucht-entscheidung")
    return L

# -------------------------------------------- M7 (Oberflaeche & Komfort)
# Der letzte Meilenstein und der groesste: 67 Issues. Er ist die Schicht, die
# den Unterbau bedienbar macht - und beim Zuschnitt kam heraus, wie viele Tueren
# fehlten (kein Weg, ein Projekt anzulegen; kein Weg, ein Video zu importieren;
# niemand zeichnete die Wiedergabeliste). Aus 41 geplanten wurden 67.

# Alles, was Arbeit vernichten kann: Loeschen, Rueckgaengig, Sitzung, Handles.
M7_RISIKO_DATEN = {3, 33, 36, 40, 41, 42, 43, 44, 50, 52, 53}
# Prozessgrenze, Kanal-Anmeldung, Ereignis-Versand.
M7_RISIKO_SICHER = {45, 47, 63, 65}
# Die Vorschau muss pixelgleich zum finalen Render sein - sonst erteilt sie eine
# Freigabe, die sie nicht decken kann.
M7_PIXEL = {19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 46, 49, 67}
# Reine Typ-/Vertragsdateien ohne Fachlogik.
M7_TYPEN = {54, 67}
# Ueberwiegend Bedienoberflaeche.
# M7-60 ist nach der Teilung reine Logik (composer-montage.ts); die Ansichten
# sind M7-68 (composer/index.tsx) und M7-69 (App.tsx).
M7_UI = {2, 5, 9, 10, 13, 14, 16, 17, 18, 19, 22, 23, 24, 25, 26, 28, 29, 30,
         31, 32, 33, 34, 36, 37, 38, 39, 55, 56, 57, 58, 59, 61, 62, 64, 66,
         68, 69}

# `braucht-entscheidung` fuer M7: 37 von 67 - deutlich mehr als in M2-M6.
# Das ist keine Nachlaessigkeit, sondern die Natur der Schicht: M1-M6 haben den
# Unterbau gebaut, wo fast jede Frage technisch entscheidbar war. M7 ist das,
# was der Nutzer anfasst, und dort sind die offenen Punkte ueberwiegend echte
# Produkt- und Bedienentscheidungen. Reine Wortlaut- und Darstellungsfragen sind
# NICHT enthalten - die sind lokale Details und in den Issues entschieden.
M7_BLOCKIEREND = {
     4,  # Verhalten bei gescheitertem Sichtaufbau + Zugangsform fuer den preview-player
     6,  # letzterAusgabeName nach einem Render veraltet in der Renderer-Sicht (FA-22)
     7,  # beeinflusst der "nicht gespeichert"-Hinweis das Beenden
     8,  # Zeitpunkt von aktualisiereReparatur; haengende Uebergabe aufraeumen
    10,  # Gleichlauf der Brauchbarkeitsregel mit #131
    11,  # Typfilter beim Aktions-Bild-Import
    12,  # Lebensdauer des Sicht-Aufbaus - bestimmt, wie oft holeStand laeuft
    13,  # Gestaltung von ton:'hervorgehoben' - Markenentscheidung
    14,  # Verhalten bei sehr vielen Fehlschlaegen; Anzeige von versuche
    15,  # Sichtbarkeit der Element-Kennung im Fortschritt
    16,  # Entfernen waehrend eines laufenden Vorgaengers sperren
    17,  # es gibt keinen Weg, einen Fehlschlag zu VERWERFEN (Vertragsfrage)
    18,  # Anzeigeort der betroffenen Elemente; eigener Uebersetzer fuer den Vorlagen-Editor
    28,  # Form des template-canvas-Platzhalters und Reichweite der Konsistenz
    32,  # letzterAusgabeName im Duplikat zuruecksetzen
    33,  # #121 hat keinen Weg, die Projekt-Sicht zu LEEREN (Vertragsluecke)
    35,  # Drag-and-drop-Ablegebereich fuer den Import
    36,  # wer einen spaeten asset_referenziert-Fehlschlag mit Namen zeigt
    40,  # Groessengrenze je Schnappschuss
    41,  # gilt im Reiter Projekte wirklich kein Rueckgaengig
    43,  # leereVorlagenHistorie beim Editor-Schluss; Verhalten nach alsEigenstaendige
    44,  # Lock-Verschachtelung durch listeVorlagen; Asset mit zustand 'fehlt'; Hoechstlaenge
    46,  # Anzeige bei unzulaessiger Bandhoehe
    49,  # unbekannte Vorlage; gescheiterte Vorbereitung
    51,  # Aufteilung composer/Vorschau im Reiter Zusammenstellen
    52,  # Feinheit einer "Aenderung"; Verhalten nach alsEigenstaendige
    55,  # Tastaturbedienung des Reorder; Mehrfachauswahl
    56,  # Rasterung des Reglers; Zahlen-Eingabefeld
    57,  # Speicherzeitpunkt der Bearbeitungsfelder; halbfertiger Entwurf beim Wechsel
    58,  # Name bei "als neue Vorlage"; Gesten-Granularitaet
    59,  # Editor-Sitzung beim Projektwechsel; Sortierung der Projektliste
    60,  # Anordnung im Reiter; Ende der Fuehrung; Ort der Fix-Auswahl
    61,  # Ordnen per Ziehen oder Knoepfen; Dauer-Grenzen fuer Abschnitte
    62,  # Abrufzeitpunkt der Nutzungsanzeige; Bezeichnung einer Fundstelle
    64,  # Darstellungsform des Overlays; Nutzer verlaesst die Fuehrung
    66,  # Herkunft des gemerkten Klappzustands; Darstellung sehr langer Listen
    # 65 traegt es NICHT mehr: bei der Teilung sind seine offenen Fragen nach
    # M7-69 gewandert, und dort ist nur noch ein Wortlaut offen - lokales Detail.
    68,  # Aufteilung von Wiedergabeliste, Bibliothek und Vorschau im Reiter
}
# M7-69 traegt bewusst KEIN Label: seine einzige offene Stelle ist der Wortlaut
# zweier Flaechen - ein lokales Detail, keine Entscheidung des Auftraggebers.

def labels_m7(nr, titel, body):
    L = []
    if "[contracts]" in titel:
        L += ["modul:contracts", "ebene:geteilt", "art:typen"]
    elif "[ipc-gateway]" in titel:
        L += ["modul:ipc", "ebene:main", "art:logik"]
    elif "[project-store]" in titel:
        L += ["modul:project-store", "ebene:main", "art:logik"]
    elif "[app-shell]" in titel:
        L += ["modul:app-shell", "ebene:renderer"]
    elif "[queue-panel]" in titel:
        L += ["modul:queue-panel", "ebene:renderer"]
    elif "[preview-player]" in titel:
        L += ["modul:preview-player", "ebene:renderer"]
    elif "[projekt-verwaltung]" in titel:
        L += ["modul:projekt-verwaltung", "ebene:renderer"]
    elif "[renderer-gemeinsam]" in titel:
        L += ["modul:renderer-gemeinsam", "ebene:renderer"]
    elif "[composer]" in titel:
        L += ["modul:composer", "ebene:renderer"]
    elif "[action-editor]" in titel:
        L += ["modul:action-editor", "ebene:renderer"]
    elif "[vorlagen-editor]" in titel:
        L += ["modul:vorlagen-editor", "ebene:renderer"]
    if "ebene:renderer" in L and "art:logik" not in L:
        L.append("art:typen" if nr in M7_TYPEN else ("art:ui" if nr in M7_UI else "art:logik"))
    if nr in M7_RISIKO_DATEN:  L.append("risiko:datenverlust")
    if nr in M7_RISIKO_SICHER: L.append("risiko:sicherheit")
    if nr in M7_PIXEL:         L.append("risiko:pixelgleichheit")
    if hat_fehlertabelle(body, r"ungueltige_eingabe|nicht_gefunden|speicher_fehler|unbekannter_fehler"
                               r"|asset_referenziert|kaputte_elemente|vorlage_referenziert"
                               r"|medium_fehlt|keine_ausgabe|ziel_gesperrt"):
        L.append("art:fehlerbehandlung")
    if nr in M7_BLOCKIEREND: L.append("braucht-entscheidung")
    return L

# ---------------------------------------------------------------- M8 (Marken)
# Zwei Titel-Praefixe haben KEINE eigene Modul-Marke, und zwar mit Absicht:
#   [Main-Bootstrap]  -> src/main/index.ts gehoert keinem Modul; #3 (M0) traegt
#                        dort ebenfalls nur `ebene:main`.
#   [gemeinsam]       -> src/renderer/gemeinsam/ ist der geteilte Renderer-Bereich;
#                        das Label dafuer heisst seit M7 `modul:renderer-gemeinsam`
#                        (dort gebaut: video-handles.ts, M7-53).
# Wer hier ein neues `modul:`-Label erfindet, spaltet eine bestehende Menge.
M8_UI = {20, 22, 23, 24, 25, 26, 27, 28, 29, 30, 32, 34, 35, 41, 48, 52, 53, 55, 57}
# NICHT als UI gezaehlt: 50 (belegt nur ein Feld in App.tsx, zeichnet nichts) und
# 54 (datei-import.ts oeffnet den Dialog und ruft den Import - reine Logik; die
# Schaltflaechen dazu zeichnet 48).

# `braucht-entscheidung`: 30 von 49 (61 %). Das ist HOCH - zum Vergleich M6 mit
# 5 von 37. Der Grund ist die Lage von M8: TK 9.15 beschreibt ein neues Subsystem,
# das NACHTRAEGLICH in sieben fertige Meilensteine eingesetzt wird; die meisten
# offenen Fragen sitzen an genau diesen Naehten, nicht im Inneren der Issues.
# Das Kriterium ist streng angewandt: Ein STOPP-Block enthaelt VERBOTE ("hier
# keine Pfadaufloesung einbauen") und ECHTE OFFENE FRAGEN. Nur die zweite Art
# zaehlt, und auch nur, wenn sie die SCHNITTSTELLE oder das VERHALTEN festlegt.
# Als ERLEDIGT/ENTSCHIEDEN gekennzeichnete Eintraege zaehlen NICHT - sie zitieren
# den alten Wortlaut nur zur Nachvollziehbarkeit.
# NICHT enthalten sind deshalb u. a.: 23 (nur zwei Verbote), 31 (Hinweis auf
# M8-11), 35 (seit 10.08. entschieden), 43 (Melde-Auftrag mit tragbarem
# Zwischenverhalten), 44 (drei ERLEDIGT), 49/50 (die Abspaltungen vom 11.08. -
# beide tragen nur Verbote; ihre offenen Fragen blieben bei M8-36 bzw. M8-48).
M8_BLOCKIEREND = {
     3,  # Retry/fsync/.bak; Lesen-Aendern-Schreiben ueber Aufrufe hinweg nicht atomar
     4,  # welche Sofort-Flush-Ausloeser gelten fuer marken.json; Wiederholstrategie
     5,  # Fehlerverhalten bei Parent-Kette und unvollstaendigem Parent - neuer Code?
     6,  # Dateiname und Seitenverhaeltnis des gebuendelten Logos; Slogan-Text
     7,  # Migration reihum beim Start oder traege beim Oeffnen; defektes Projekt
    10,  # Parent-Existenzpruefung unter Nebenlaeufigkeit wiederholen?
    11,  # Bedeutung des Rueckgabewerts bei entprelltem Schreiben; wer prueft Hex?
    12,  # standardMarkeId fehlt als dritte Referenzart; Sofort-Flush vor der Pruefung
    13,  # Loeschen trotz standardMarkeId-Referenz; Flush vor Referenzpruefung
    14,  # Symlink-Pruefung und Gross-/Kleinschreibung des Pfadvergleichs
    15,  # Zieldateiname und Namenskonflikt; Herkunft des Seitenverhaeltnisses
    16,  # EXPERIMENT corsEnabled fuer FontFace; Geltungsbereich, Statuscodes
    20,  # Verkleinerungsstufen und Innenabstand des Ersatz-Logos
    21,  # gilt die Rahmen-Ausnahme auch fuer eine Logo-Zone der Band-Vorlage
    22,  # Sofort-Flush beim Verlassen des Marken-Reiters? Kein Kanal vorgesehen
    24,  # importierte Schrift laesst sich nirgends entfernen
    27,  # Widerspruch zu M8-22: wer laedt die Uebersicht nach dem Ableiten neu
    28,  # achtstelliger Hex-Wert in marke.farben - drei Wege, keiner gewaehlt
    29,  # Darstellung des TOCTOU-Falls beim Loeschen (Verhalten, nicht Layout)
    32,  # niemand abonniert marken:autoSpeichernStatus
    34,  # was bedeutet slogan.aktiv=false fuer die Zone
    36,  # was geschieht, wenn der Marken-Flush beim Beenden scheitert
    39,  # zaehlt eine ins Leere zeigende aktion.markeId als kaputte Stelle
    40,  # gegen welche Marke zeichnet der vorlagen-editor; Markenwechsel
    41,  # braucht die Editor-Wurzel zeichnen: ZeichenZugang; wer graut Undo aus
    42,  # wie wird aus gebuendelter logo.datei eine URL; verunreinigt marken://
    45,  # Migration von Rollennamen in akzentfarbe; wer warnt bei Aktionsfarbe
    46,  # wer reicht die Marken-Liste in den action-editor (Ring mit M8-40)
    47,  # schemaVersion-Erhoehung fuer project.json (der standardMarkeId-Teil
         # ist mit M8-56 erledigt)
    48,  # Live-Vorschau nicht baubar; TOCTOU (Dialog-Ausloeser und
         # Speicherhinweis sind mit M8-54/M8-55 erledigt)
    51,  # gemeinsame Projekt-Sicht beim geladenen Projekt; geaendertAm;
         # main-interner Bulk-Aufruf
    52,  # geoeffnetes Projekt, dessen Standardmarke waehrend bereits
         # gezeichneter Band-PNGs wechselt
    53,  # wer bei der AKTIONS-Akzentfarbe warnt (R-08) und gegen welche
         # Textfarbe; Alt-Daten mit Rollennamen in akzentfarbe
    54,  # eine importierte Schrift laesst sich nirgends wieder entfernen
    55,  # beim Beenden ist der Renderer u. U. abgebaut - dann zeigt niemand
         # Empfehlung und Wiederholen-Knopf (gilt fuer alle drei Speicher)
    56,  # schemaVersion; Nutzer-Meldung bei Marken-Fehlschlag
    57,  # aktualisiereProjektliste() nach JEDEM Wechsel = Verzeichnis-Scan
         # ueber alle Projektordner unter dem D1-Lock, und der Regelfall ist
         # laut TK 9.14.3, dass mehrere Projekte hintereinander umgestellt
         # werden. Eine gezielte Auffrischung eines Eintrags gibt es nicht.
}
# 50 traegt es NICHT: Es belegt ein Feld in App.tsx und hat nur Verbote im
# STOPP-Block.
# ZU 57: Ich hatte es zunaechst ausgenommen, weil es M8-52 nur anschliesst und
# dessen offene Frage erbt. Der Autor hat widersprochen - es hat eine EIGENE,
# und zwar eine, die das VERHALTEN unter Last bestimmt. Die geerbte Frage
# (Band-PNGs bei offenem Projekt) fuehrt es richtigerweise NICHT ein zweites
# Mal, sondern nur als Verbot.

# Der Datenpfad von marken.json und alles, was ihn anfasst - plus die zwei
# Operationen, die in project.json SCHREIBEN (51 setzt die Standardmarke, 56 legt
# ein Projekt an).
M8_RISIKO_DATEN = {3, 4, 7, 11, 13, 15, 36, 51, 56}
# Pfadaufloesung, Import-Whitelist und die Schema-Privilegien des Protokolls.
M8_RISIKO_SICHER = {14, 15, 16, 36, 49}
# Was am Ende Pixel erzeugt - ein Fehler faellt hier erst am Fernseher auf.
M8_PIXEL = {17, 19, 20, 21, 39, 40, 42, 43}

def labels_m8(nr, titel, body):
    L = []
    if "[contracts]" in titel:
        L += ["modul:contracts", "ebene:geteilt", "art:typen"]
    elif "[marken-store]" in titel:
        L += ["modul:marken-store", "ebene:main", "art:logik"]
    elif "[marken-editor]" in titel:
        L += ["modul:marken-editor", "ebene:renderer"]
    elif "[template-canvas]" in titel:
        L += ["modul:template-canvas", "ebene:renderer"]
    elif "[gemeinsam]" in titel:
        L += ["modul:renderer-gemeinsam", "ebene:renderer"]
    elif "[app-shell]" in titel:
        L += ["modul:app-shell", "ebene:renderer"]
    elif "[composer]" in titel:
        L += ["modul:composer", "ebene:renderer"]
    elif "[action-editor]" in titel:
        L += ["modul:action-editor", "ebene:renderer"]
    elif "[vorlagen-editor]" in titel:
        L += ["modul:vorlagen-editor", "ebene:renderer"]
    elif "[projekt-verwaltung]" in titel:
        # Nachtrag 11.08.: M8-52 und M8-57 sind erst nach dem ersten Profil
        # entstanden. Ohne diesen Zweig fielen beide durch die ganze Kette und
        # bekamen WEDER modul: NOCH ebene: - und damit auch kein art:, weil das
        # an "ebene:renderer" haengt. Im Trockenlauf sichtbar geworden.
        L += ["modul:projekt-verwaltung", "ebene:renderer"]
    elif "[config-store]" in titel:
        L += ["modul:config-store", "ebene:main", "art:logik"]
    elif "[project-store]" in titel:
        L += ["modul:project-store", "ebene:main", "art:logik"]
    elif "[ipc-gateway]" in titel:
        L += ["modul:ipc", "ebene:main", "art:logik"]
    elif "[render-service]" in titel:
        L += ["modul:render-service", "ebene:main", "art:logik"]
    elif "[Main-Bootstrap]" in titel:
        L += ["ebene:main", "art:logik"]
    if "ebene:renderer" in L and "art:logik" not in L:
        L.append("art:ui" if nr in M8_UI else "art:logik")
    if nr in M8_RISIKO_DATEN:  L.append("risiko:datenverlust")
    if nr in M8_RISIKO_SICHER: L.append("risiko:sicherheit")
    if nr in M8_PIXEL:         L.append("risiko:pixelgleichheit")
    if hat_fehlertabelle(body, r"marke_referenziert|marke_eingebaut|marke_nicht_gefunden"
                               r"|marken_datei_fehlt|ungueltige_eingabe|nicht_gefunden"
                               r"|speicher_fehler|unbekannter_fehler"):
        L.append("art:fehlerbehandlung")
    if nr in M8_BLOCKIEREND: L.append("braucht-entscheidung")
    return L

def labels_fuer(nr, titel, body):
    L = []
    if "[contracts]" in titel:
        L += ["modul:contracts", "ebene:geteilt", "art:typen"]
    elif "[ipc-gateway]" in titel:
        # Nachzuegler M1-45/M1-46 (03.08.): die Verdrahtung der Kanaele. Die alte
        # `[ipc]`-Bedingung darunter trifft sie NICHT ("[ipc]" ist kein Teilstring
        # von "[ipc-gateway]") - ohne diesen Zweig blieben beide ohne Modul-Label.
        L += ["modul:ipc", "ebene:main", "art:logik"]
    elif "[ipc]" in titel:
        L += ["modul:ipc"]
        L += ["ebene:main"] if nr == 11 else (["ebene:renderer"] if nr == 12 else ["ebene:geteilt", "art:typen"])
        if nr in (11, 12): L += ["art:logik"]
    elif "[config-store]" in titel:
        L += ["modul:config-store", "ebene:main", "art:logik"]
    elif "[project-store]" in titel:
        L += ["modul:project-store", "ebene:main", "art:logik"]
    if nr in RISIKO_DATEN:  L.append("risiko:datenverlust")
    if nr in RISIKO_SICHER: L.append("risiko:sicherheit")
    # Fehlerbehandlung, wenn eine Fehlerpfad-Tabelle mit echten Codes existiert
    if re.search(r"`(ungueltige_eingabe|nicht_gefunden|speicher_fehler|asset_referenziert)`", body):
        L.append("art:fehlerbehandlung")
    if nr in BLOCKIEREND: L.append("braucht-entscheidung")
    return L

def sx_zu_nr(text):
    """Sx-Verweise (M0-Issues) auf echte #x umstellen + zwei Redundanzen glätten."""
    t = re.sub(r"(?<![#\w])S(1[0-2]|[1-9])\b", lambda m: "#" + m.group(1), text)
    t = re.sub(r"#(\d+)\s*\(#\1,\s*", r"#\1 (", t)      # "#5 (#5, liefert …" -> "#5 (liefert …"
    t = t.replace("#12/#12", "#12")
    return t

dateien = sorted(f for f in os.listdir(B)
                 if re.match(r"^[A-Za-z0-9]+-\d+\.md$", f))
if not dateien:
    print("keine Issue-Dateien in", B); sys.exit(1)

# Profil aus dem Praefix der Dateinamen waehlen. Uneinheitliche Praefixe sind ein
# Abbruchgrund - sonst bekaeme die Haelfte der Issues die Label des falschen Profils.
PRAEFIXE = {re.match(r"^([A-Za-z0-9]+)-", f).group(1) for f in dateien}
if len(PRAEFIXE) != 1:
    print("ABBRUCH: uneinheitliche Praefixe in", B, "->", sorted(PRAEFIXE)); sys.exit(1)
PRAEFIX = PRAEFIXE.pop()
PROFIL = {"M1": labels_fuer, "M2": labels_m2, "M3": labels_m3,
          "M4": labels_m4, "M5": labels_m5, "M6": labels_m6,
          "M7": labels_m7, "M8": labels_m8}.get(PRAEFIX)
if PROFIL is None:
    print(f"ABBRUCH: kein Label-Profil fuer Praefix '{PRAEFIX}'."
          f" Bekannt: M1, M2, M3, M4, M5, M6, M7. Neues Profil im Skript anlegen, nicht raten."); sys.exit(1)
print(f"Profil: {PRAEFIX}  |  Milestone: {MILE}  |  {len(dateien)} Dateien aus {B}\n")

eintraege = []
for f in dateien:
    nr = int(re.search(r"-(\d+)\.md$", f).group(1))
    roh = io.open(f"{B}/{f}", encoding="utf-8").read()
    zeilen = roh.split("\n")
    kopf = zeilen[0]
    m = re.match(r"^### Issue ([A-Za-z0-9]+-\d+): (.+)$", kopf)
    if not m:
        print("ABBRUCH: unerwartete Kopfzeile in", f, "->", kopf[:70]); sys.exit(1)
    key, titel = m.group(1), sx_zu_nr(m.group(2).strip()).replace("`", "")
    body = sx_zu_nr("\n".join(zeilen[1:]).strip())
    bp = f"{OUT}/{key}.md"
    io.open(bp, "w", encoding="utf-8").write(body + "\n")
    eintraege.append({"key": key, "titel": titel, "body": bp,
                      "labels": PROFIL(nr, titel, body)})

print(f"{'Issue':7} {'Labels':<95} Titel")
for e in eintraege:
    print(f"{e['key']:7} {','.join(e['labels']):<95} {e['titel'][:60]}")

# GitHub lehnt Issue-Bodies ueber 65536 ab. Die Fehlermeldung lautet "Body is too
# long (maximum is 65536 characters)" - GEMESSEN WIRD ABER IN UTF-8-BYTES.
# EMPIRISCH BELEGT beim M8-Lauf: M8-48 mit 64754 Zeichen / 66337 Bytes wurde
# ABGELEHNT, M8-57 mit 64048 Zeichen / 65079 Bytes lief DURCH. Haetten Zeichen
# gezaehlt, waeren beide durchgelaufen.
# Fuer deutsche Texte ist der Unterschied betraechtlich: Jeder Umlaut, jedes
# scharfe S und jeder Gedankenstrich zaehlt doppelt oder dreifach - bei M8-48
# waren es 1583 Bytes mehr als Zeichen, also gut 2 %.
GRENZE = 65536
gemessen = [(e["key"], len(io.open(e["body"], encoding="utf-8").read().encode("utf-8")))
            for e in eintraege]
zu_gross = [(k, n) for k, n in gemessen if n > GRENZE]
knapp    = [(k, n) for k, n in gemessen if GRENZE - 1500 < n <= GRENZE]
print("\nGroessen-Pruefung:", f"alle unter {GRENZE} UTF-8-Bytes" if not zu_gross else
      "UEBER DER GRENZE -> " + ", ".join(f"{k}: {n} (+{n-GRENZE})" for k, n in zu_gross))
if knapp:
    print("   KNAPP (unter 1500 Bytes Reserve, jede weitere Korrektur kippt sie): "
          + ", ".join(f"{k}: {GRENZE-n}" for k, n in knapp))
if zu_gross:
    print("   GitHub wuerde diese Bodies ABLEHNEN. Teilen (M7-Praezedenz), nicht kuerzen -"
          "\n   die ausgeschriebenen Fremdsignaturen sind der Grund, warum Regel A haelt.")

print("\nLabel-Verteilung:")
from collections import Counter
for lab, c in sorted(Counter(l for e in eintraege for l in e["labels"]).items()):
    print(f"   {c:3}x  {lab}")
print(f"\nbraucht-entscheidung: {sum('braucht-entscheidung' in e['labels'] for e in eintraege)} von {len(eintraege)}")

# Label und Milestone muessen VORHER existieren - `gh issue create` legt sie nicht an
# und bricht sonst mitten in der Reihe ab (die Haelfte angelegt, die Haelfte nicht).
def vorhanden(cmd, feld):
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
    if r.returncode != 0:
        print("WARNUNG: konnte", " ".join(cmd[:3]), "nicht pruefen:", r.stderr.strip()[:120]); return None
    return {z[feld] for z in json.loads(r.stdout)}

gh_labels = vorhanden(["gh", "label", "list", "--limit", "100", "--json", "name"], "name")
if gh_labels is not None:
    fehlt = sorted({l for e in eintraege for l in e["labels"]} - gh_labels)
    print("\nLabel-Pruefung:", "alle vorhanden" if not fehlt else f"FEHLEN AUF GITHUB -> {fehlt}")
gh_miles = vorhanden(["gh", "api", "repos/:owner/:repo/milestones", "--jq",
                      "[.[] | {title}]"], "title")
if gh_miles is not None:
    print("Milestone-Pruefung:", "vorhanden" if MILE in gh_miles
          else f"FEHLT AUF GITHUB -> '{MILE}' (vorhanden: {sorted(gh_miles)})")

if not GO:
    print("\n--- TROCKENLAUF, nichts angelegt. Mit --go ausführen. ---"); sys.exit(0)

# Ein zu grosser Body ist ein sicherer Fehlschlag, kein Risiko - also gar nicht
# erst loslaufen und die Reihe auf halbem Weg zerreissen.
if zu_gross:
    print("\nABBRUCH: "
          + ", ".join(k for k, _ in zu_gross)
          + " ueberschreiten die GitHub-Grenze (UTF-8-BYTES, nicht Zeichen)."
            " Erst teilen oder kuerzen, dann anlegen."); sys.exit(1)

# Ein vorhandenes map.json bedeutet: dieser Meilenstein wurde schon (teilweise)
# angelegt. Diese Eintraege werden UEBERSPRUNGEN und ihre Nummern uebernommen.
# Ohne das legt ein zweiter Lauf alles doppelt an und ueberschreibt das Mapping
# mit nur den neuen Nummern - beim M7-Lauf waeren das 65 Duplikate gewesen.
# Anlass: GitHub lehnt Bodies ueber 65536 Zeichen ab (M7-60 und M7-65 mit rund
# 77000). Ein Teil-Lauf ist damit ein REALER Fall, kein Ausnahmefehler.
mapping = {}
if os.path.exists(MAP):
    mapping = {k: int(v) for k, v in json.loads(io.open(MAP, encoding="utf-8").read()).items()}
    print(f"map.json vorhanden: {len(mapping)} Eintraege werden uebersprungen\n")

for e in eintraege:
    if e["key"] in mapping:
        print(f"  {e['key']} -> #{mapping[e['key']]} (schon angelegt, uebersprungen)"); continue
    cmd = ["gh", "issue", "create", "--title", e["titel"], "--body-file", e["body"],
           "--milestone", MILE]
    for l in e["labels"]: cmd += ["--label", l]
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8")
    if r.returncode != 0:
        print(f"  {e['key']}: FEHLER {r.stderr.strip()[:140]}"); continue
    url = r.stdout.strip().split("\n")[-1]
    nummer = url.rstrip("/").split("/")[-1]
    mapping[e["key"]] = int(nummer)
    print(f"  {e['key']} -> #{nummer}")

io.open(MAP, "w", encoding="utf-8").write(json.dumps(mapping, indent=1))
print(f"\nim Mapping: {len(mapping)} von {len(eintraege)} -> {MAP}")
