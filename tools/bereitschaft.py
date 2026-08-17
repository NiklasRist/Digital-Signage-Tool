# -*- coding: utf-8 -*-
"""bereitschaft.py - welche Issues sind JETZT baubar?

    python tools/bereitschaft.py

Braucht `gh` (angemeldet). Legt einen Zwischenspeicher unter .zwischenspeicher/ an.

AUSGABE JE MEILENSTEIN: "X von Y gebaut, Z bereit, N UNKLAR".
  gebaut  - die im Issue genannte Datei existiert, traegt keinen werfenden
            Geruest-Rumpf und kein `// LUECKE` am Zeilenanfang
  bereit  - offen UND kein Blocker mehr offen -> kann sofort gebaut werden
  UNKLAR  - der Bauzustand ist NICHT ablesbar; von Hand nachsehen

DREI GRENZEN, DIE MAN KENNEN MUSS - das Werkzeug misst weniger, als es scheint:

1. Es misst, ob eine Funktion GEBAUT ist, NICHT ob sie GERUFEN wird. Am 15.08.2026
   hat es deshalb drei Bootstrap-Luecken gemeldet, von denen eine laengst verdrahtet
   war. Fuer "hat das einen Aufrufer?" gibt es keinen Ersatz fuer einen grep.

2. "UNKLAR" heisst wirklich unklar, nicht "fast fertig". Es trifft Issues, deren
   Dateibereich ein ORDNER ist (#8) oder als Aufzaehlung statt als einzelner Pfad
   steht (39 von 70 in M7). Vor der Korrektur galten die stillschweigend als
   BAUBEREIT - das ist der Fehler, der #176 auf einen werfenden Rumpf gesetzt hat.

3. Ein Blocker zaehlt nur dann als erledigt, wenn er NACHWEISLICH gebaut ist.
   "UNKLAR" gilt als nicht erledigt - lieber ein Issue zu wenig anbieten als eine
   Welle auf einer Annahme starten.

WER EINE WELLE STARTET, prueft zusaetzlich von Hand: Liegt der Arbeitsbaum sauber?
Zwei Agents duerfen nie dieselbe Datei bearbeiten.
"""
#
# KORRIGIERT am 14.08.2026: Die frueheren Fassungen suchten in den "Blockiert von"-Zeilen
# nur nach `#nnn`. Ein Blocker, der als PLANUNGSKUERZEL dasteht (`M7-46` statt `#239`), war
# damit unsichtbar - und das Issue galt als bereit, obwohl sein Unterbau fehlte. Genau so
# wurde #176 gebaut, dessen Rechenkern (#239) noch ein werfender Rumpf ist.
#
# 25 angelegte Issues tragen solche Kuerzel. Aufgeloest wird ueber die map.json-Dateien in
# docs/agents/*/ - die Projektregel dazu lautet: "IMMER aus map.json abschreiben, NIE rechnen"
# (die Faustformel XX+193 gilt fuer M7 nur bis M7-59).
#
# Zweite Korrektur (13.08.): Nummern aus dem KLAMMER-Fliesstext zaehlen nicht als Blocker -
# "#23 (faengt Ausnahmen der ueber #71 registrierten Operation)" nennt nur #23.
#
# Dritte Korrektur (13.08.): `// LUECKE` gilt nur am Zeilenanfang, und die Bootstrap-Kette
# teilt sich EINE Datei - dort entscheidet eine Liste, nicht der Dateiinhalt.

import glob
import io
import json
import os
import re
import subprocess

S = os.path.join(".zwischenspeicher")
os.makedirs(S, exist_ok=True)

BOOTSTRAP = {268, 269, 270, 271, 272, 273, 274, 331}
# NACHGEZOGEN am 17.08.2026: #272 (Schritt 5, Position 2) und #273 (Schritt 5,
# Positionen 9/10, Schritt 7 Position 2, Schritt 8) waren bereits durch die
# #3-Bootstrap-Commits verdrahtet - die Aufrufe stehen im Code, jede Funktion wird
# genau einmal gerufen, keine gerufene Funktion traegt mehr einen werfenden Rumpf.
# #271 bleibt offen: Position 7 (verdrahteVorlagenIPC) fehlt noch.
FERTIGE_BOOTSTRAP = {268, 269, 270, 272, 273}

DATEI = re.compile(r"^- \*{0,2}Datei(?:en\)?)?[^`\n]*`([^`]+)`", re.M)
KUERZEL = re.compile(r"\bM[0-8]-\d{1,2}\b")


def lade_zuordnung():
    # M1-01..M1-40 hat KEINE map.json - dort galt beim Anlegen die Faustregel M1-XX -> #(XX+12)
    # (CLAUDE.md, "M1 (M1-01..M1-40) ... Issues #13-#52"). Die Nachzuegler M1-41..46 stehen
    # dagegen in docs/agents/m1-nachzuegler/map.json und ueberschreiben diese Vorbelegung.
    zuordnung = {"M1-%02d" % x: x + 12 for x in range(1, 41)}
    for pfad in glob.glob("docs/agents/*/map.json"):
        try:
            zuordnung.update(json.load(io.open(pfad, encoding="utf-8")))
        except Exception as fehler:  # noqa: BLE001 - eine kaputte Karte darf nicht alles stoppen
            print("WARNUNG: %s nicht lesbar (%s)" % (pfad, fehler))
    return zuordnung


def hole_issues():
    ergebnis = subprocess.run(
        ["gh", "issue", "list", "--state", "all", "--limit", "400",
         "--json", "number,title,body,milestone"],
        capture_output=True, text=True, encoding="utf-8", shell=(os.name == "nt"),
    )
    assert ergebnis.returncode == 0, ergebnis.stderr
    return json.loads(ergebnis.stdout)


def ohne_klammern(text):
    aus, tiefe = [], 0
    for zeichen in text:
        if zeichen == "(":
            tiefe += 1
        elif zeichen == ")":
            tiefe = max(0, tiefe - 1)
        elif tiefe == 0:
            aus.append(zeichen)
    return "".join(aus)


def datei_von(eintrag):
    treffer = DATEI.search((eintrag["body"] or "").replace("\r\n", "\n"))
    return treffer.group(1) if treffer else None


def ist_gebaut(nummer, eintrag):
    # NACHGEZOGEN am 14.08.2026: Diese beiden Zweige lieferten True/False, waehrend der
    # Rest der Funktion inzwischen Zeichenketten liefert. Folge: Die betroffenen Issues
    # fielen aus ALLEN DREI Toepfen heraus und verschwanden lautlos aus der Zaehlung -
    # M1 meldete 48 von 49, ohne dass ein Issue als offen auftauchte. Die Summenprobe
    # unten faengt so etwas kuenftig ab.
    if nummer == 3:
        return "gebaut"
    if nummer in BOOTSTRAP:
        return "gebaut" if nummer in FERTIGE_BOOTSTRAP else "offen"
    pfad = datei_von(eintrag)

    # BLINDER FLECK, behoben am 14.08.2026: Steht im Issue ein ORDNER statt einer Datei
    # (z. B. #8 mit `src/renderer/assets/fonts/`), lieferte os.path.isfile() False - das
    # Issue galt als offen UND baubereit. #8 war laengst gebaut (bd3a755); ein Agent hat
    # das erkannt und Doppelarbeit vermieden, aber verlassen kann man sich darauf nicht.
    # Am Ordner ist der Bauzustand nicht ablesbar (es gibt keinen werfenden Rumpf), also
    # wird hier NICHT geraten, sondern "unklar" gemeldet.
    if pfad and os.path.isdir(pfad):
        return "unklar"

    # Kein Dateiname im Issue gefunden - haeufig bei Oberflaechen-Issues, deren
    # Dateibereich als Aufzaehlung steht. Auch hier ist nichts messbar.
    if not pfad:
        return "unklar"

    if not os.path.isfile(pfad):
        return "offen"
    inhalt = io.open(pfad, encoding="utf-8", errors="replace").read()
    if ("Rumpf gehoert zu Issue #%d." % nummer) in inhalt:
        return "offen"
    return "offen" if re.search(r"^// LUECKE", inhalt, re.M) else "gebaut"


def blocker_von(eintrag, zuordnung):
    text = (eintrag["body"] or "").replace("\r\n", "\n")
    kopf = re.search(r"^## Abh(?:ä|ae)ngigkeiten\s*$", text, re.M)
    if not kopf:
        return set()
    rest = text[kopf.end():]
    naechste = re.search(r"^## ", rest, re.M)
    abschnitt = rest[: naechste.start()] if naechste else rest

    punkte, aktuell = [], None
    for zeile in abschnitt.split("\n"):
        if re.match(r"^- ", zeile):
            if aktuell:
                punkte.append(aktuell)
            aktuell = zeile
        elif aktuell is not None and zeile.startswith("  "):
            aktuell += " " + zeile.strip()
        elif zeile.strip():
            if aktuell:
                punkte.append(aktuell)
            aktuell = None
    if aktuell:
        punkte.append(aktuell)

    nummern = set()
    for punkt in punkte:
        if "Blockiert von" not in punkt:
            continue
        roh = ohne_klammern(punkt)
        nummern |= {int(x) for x in re.findall(r"#(\d+)", roh)}
        # DIE KORREKTUR: Planungskuerzel ebenfalls aufloesen.
        for kuerzel in KUERZEL.findall(roh):
            if kuerzel in zuordnung:
                nummern.add(zuordnung[kuerzel])
            else:
                print("  WARNUNG: %s hat keine Zuordnung in map.json" % kuerzel)
    return nummern


def main():
    zuordnung = lade_zuordnung()
    issues = hole_issues()
    nach_nummer = {i["number"]: i for i in issues}
    gebaut = {n: ist_gebaut(n, e) for n, e in nach_nummer.items()}

    for praefix in ("M0", "M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8"):
        nummern = sorted(
            i["number"] for i in issues
            if (i.get("milestone") or {}).get("title", "").startswith(praefix)
        )
        if not nummern:
            continue
        fertig = [n for n in nummern if gebaut[n] == "gebaut"]
        offen = [n for n in nummern if gebaut[n] == "offen"]
        unklar = [n for n in nummern if gebaut[n] == "unklar"]

        # Ein Blocker gilt nur dann als erledigt, wenn er NACHWEISLICH gebaut ist.
        # "unklar" zaehlt als nicht erledigt - sonst startet eine Welle auf einer
        # Annahme, und genau das ist hier schon einmal passiert (#176 wurde gebaut,
        # waehrend sein Rechenkern #239 noch ein werfender Rumpf war).
        bereit = []
        for n in offen:
            wartet = [
                x for x in blocker_von(nach_nummer[n], zuordnung) - {n}
                if x in nach_nummer and gebaut[x] != "gebaut"
            ]
            if not wartet:
                bereit.append(n)

        # SUMMENPROBE: Jedes Issue muss in genau einem Topf landen. Ohne sie verschwindet
        # ein Issue lautlos, sobald ein Zweig einen unerwarteten Wert liefert - genau das
        # ist am 14.08.2026 passiert, als zwei Zweige noch True/False lieferten.
        fehlend = len(nummern) - (len(fertig) + len(offen) + len(unklar))
        if fehlend:
            werte = {gebaut[n] for n in nummern} - {"gebaut", "offen", "unklar"}
            raise SystemExit(
                "FEHLER im Messwerkzeug: %d %s-Issues in keinem Topf. "
                "Unerwartete Zustaende: %r" % (fehlend, praefix, werte)
            )

        print("=== %s: %d von %d gebaut, %d bereit, %d UNKLAR ==="
              % (praefix, len(fertig), len(nummern), len(bereit), len(unklar)))
        for n in bereit[:10]:
            print("  #%-4d %-50s %s"
                  % (n, datei_von(nach_nummer[n]), nach_nummer[n]["title"][:40]))
        for n in unklar:
            print("  ? #%-4d %-48s %s"
                  % (n, str(datei_von(nach_nummer[n]))[:48], nach_nummer[n]["title"][:40]))


main()
