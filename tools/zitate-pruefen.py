# -*- coding: utf-8 -*-
"""
zitate-pruefen.py - mechanischer Zitat-Abgleich ueber alle angelegten GitHub-Issues.

Zweck
-----
Die Projektregel lautet: Jede Vertragsaenderung (TK/AD) erzwingt einen Zitat-Abgleich
ueber ALLE angelegten Issues (Regel D gilt rueckwaerts). Dieses Werkzeug macht das
mechanisch statt von Hand.

Ablauf
------
1. Alle Issue-Bodies holen (ein einziger `gh issue list`-Aufruf, Fallback je Issue)
   und in ein Zwischenverzeichnis legen. Zweiter Lauf laedt nicht erneut (--neu laden).
2. Aus jedem Body die woertlichen Zitate extrahieren:
   - deutsche Anfuehrung: oeffnend U+201E, schliessend ASCII " (U+0022), verschachtelbar
   - Blockzitate: zusammenhaengende Zeilen, die mit "> " beginnen
3. Zuschreibung bestimmen (TK/AD, anderes Issue, oder unbestimmt) anhand von Markern
   im umgebenden Absatz.
4. Normalisiert vergleichen (Whitespace -> ein Leerzeichen; Markdown-Auszeichnung BLEIBT).
5. Auslassungen (… / ...) : Zitat teilen, jedes Teilstueck muss der Reihe nach vorkommen.
6. Bericht nach Gruppen A (TK/AD veraltet), B (Issue-Zitat veraltet), C (rhetorisch, nur Zahl).

Aufruf
------
    python tools/zitate-pruefen.py                # nutzt Zwischenverzeichnis
    python tools/zitate-pruefen.py --neu-laden    # holt alle Bodies frisch
    python tools/zitate-pruefen.py --bericht bericht.md
"""

import argparse
import difflib
import json
import os
import re
import subprocess
import sys

WURZEL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(WURZEL, ".zitat-cache")
TK = os.path.join(WURZEL, "docs", "Technisches_Konzept_Digital-Signage-Tool.md")
AD = os.path.join(WURZEL, "docs", "Anforderungsdokument_Digital-Signage-Tool.md")

AUF = "„"   # „
ZU = '"'        # ASCII, so schreibt das Projekt das Schlusszeichen
ZU_TYPO = "“"  # " - kommt vereinzelt vor, wird toleriert

MAX_ISSUE = 262


# ---------------------------------------------------------------- Bodies holen

def lade_bodies(neu_laden=False):
    os.makedirs(CACHE, exist_ok=True)
    vorhanden = {}
    for name in os.listdir(CACHE):
        if name.endswith(".md") and name[:-3].isdigit():
            nr = int(name[:-3])
            with open(os.path.join(CACHE, name), encoding="utf-8") as f:
                vorhanden[nr] = f.read().replace("\r\n", "\n").replace("\r", "\n")
    if not neu_laden and len(vorhanden) >= MAX_ISSUE:
        return vorhanden

    print("Hole Issue-Bodies von GitHub (ein Sammelaufruf) ...", file=sys.stderr)
    aus = subprocess.run(
        ["gh", "issue", "list", "--state", "all", "--limit", "400",
         "--json", "number,title,body"],
        cwd=WURZEL, capture_output=True, text=True, encoding="utf-8")
    if aus.returncode != 0:
        raise SystemExit("gh issue list fehlgeschlagen: " + aus.stderr)
    daten = json.loads(aus.stdout)
    gefunden = {}
    for eintrag in daten:
        nr = eintrag["number"]
        gefunden[nr] = eintrag.get("body") or ""
    # Luecken einzeln nachholen
    for nr in range(1, MAX_ISSUE + 1):
        if nr in gefunden:
            continue
        r = subprocess.run(["gh", "issue", "view", str(nr), "--json", "body", "-q", ".body"],
                           cwd=WURZEL, capture_output=True, text=True, encoding="utf-8")
        if r.returncode == 0:
            gefunden[nr] = r.stdout
        else:
            print("  WARNUNG: #%d nicht abrufbar" % nr, file=sys.stderr)
    # Zeilenenden vereinheitlichen. GitHub liefert CRLF, die Zwischenablage liest
    # LF zurueck - ohne das liefern "frisch geladen" und "aus dem Cache" fuer
    # DIESELBEN Issues verschiedene Ergebnisse (Absatzgrenzen sind "\n\n").
    gefunden = {nr: b.replace("\r\n", "\n").replace("\r", "\n")
                for nr, b in gefunden.items()}
    for nr, body in gefunden.items():
        with open(os.path.join(CACHE, "%d.md" % nr), "w", encoding="utf-8",
                  newline="\n") as f:
            f.write(body)
    return gefunden


# ------------------------------------------------------------- Normalisierung

def norm(text):
    """Whitespace vereinheitlichen. Markdown-Auszeichnung bleibt ABSICHTLICH stehen.

    Blockzitat-Marker am Zeilenanfang sind Layout, nicht Zitattext: ein
    umgebrochenes Blockzitat traegt sie mitten im Satz - sonst scheitert der
    Vergleich schon an der Formatierung statt am Wortlaut.
    """
    text = text.replace(chr(0xA0), " ")
    text = re.sub(r"(?m)^[ 	]*>[ 	]?", "", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def norm_weich(text):
    """Zusaetzlich Typografie vereinheitlichen - nur fuer den ZWEITEN Versuch,
    damit ein reiner Anfuehrungszeichen-Unterschied nicht als Befund zaehlt."""
    text = norm(text)
    text = (text.replace("„", '"').replace("“", '"').replace("”", '"')
                .replace("‘", "'").replace("’", "'")
                .replace("–", "-").replace("—", "-")
                .replace("‑", "-").replace("…", "..."))
    return text


# ---------------------------------------------------------- Zitate extrahieren

def finde_zitate(body):
    """Liefert Liste (zitat, start, ende, art)."""
    treffer = []
    i = 0
    n = len(body)
    while i < n:
        if body[i] == AUF:
            tiefe = 1
            j = i + 1
            while j < n and tiefe > 0:
                c = body[j]
                if c == AUF:
                    tiefe += 1
                elif c == ZU or c == ZU_TYPO:
                    tiefe -= 1
                    if tiefe == 0:
                        break
                elif c == "\n" and body[j:j + 2] == "\n\n":
                    break  # Absatzgrenze: unabgeschlossene Anfuehrung, abbrechen
                j += 1
            if j < n and tiefe == 0:
                treffer.append((body[i + 1:j], i, j + 1, "anfuehrung"))
                i = j + 1
                continue
        i += 1

    # Blockzitate
    zeilen = body.split("\n")
    pos = 0
    puffer = []
    start = None
    for zeile in zeilen:
        if zeile.startswith("> "):
            if start is None:
                start = pos
            puffer.append(zeile[2:])
        else:
            if puffer:
                treffer.append((" ".join(puffer), start, pos, "blockzitat"))
                puffer, start = [], None
        pos += len(zeile) + 1
    if puffer:
        treffer.append((" ".join(puffer), start, pos, "blockzitat"))
    return treffer


# ------------------------------------------------------------- Zuschreibung

RE_TK = re.compile(
    r"(Technische[sn]?\s+Konzept|\bTK\b|TK\s*v?\d|Konzept\s*\*\*\d|Abschnitt\s*\*?\*?9\.)",
    re.I)
RE_AD = re.compile(
    r"(Anforderungsdokument|\bAD\b|\bFA-\d{2}\b|\bNFA-\d{2}\b|Akzeptanzkriterium)", re.I)
RE_ABSCHNITT = re.compile(r"\*?\*?\b9\.\d+(\.\d+)?\b")
RE_ISSUE = re.compile(r"(#\d{1,3}\b|\bM[0-7]-\d{2}\b|\bS\d{1,2}\b)")


def absatz_um(body, start, ende):
    """Text des Absatzes (blank-line-getrennt), in dem das Zitat steht."""
    a = body.rfind("\n\n", 0, start)
    a = 0 if a < 0 else a + 2
    b = body.find("\n\n", ende)
    b = len(body) if b < 0 else b
    return body[a:b]


def nahfeld(body, start, ende, weite=90):
    """Nur die unmittelbare Umgebung des Zitats.

    Der ganze Absatz taugt NICHT zur Zuschreibung: Issue-Dateien nennen den
    TK-Abschnitt im Kopf jedes Blocks, damit gaelte jede rhetorische Anfuehrung
    im selben Absatz als TK-Zitat. Die Quellenangabe steht in diesem Projekt
    immer unmittelbar vor oder unmittelbar hinter der Anfuehrung.
    """
    a = body.rfind("\n\n", 0, start)
    a = 0 if a < 0 else a + 2
    b = body.find("\n\n", ende)
    b = len(body) if b < 0 else b
    return body[max(a, start - weite):start] + " || " + body[ende:min(b, ende + weite)]


RE_FREMD = re.compile(r"(CLAUDE\.md|Uebergabe-Prompt|Übergabe-Prompt|Übergabe-?Prompt)", re.I)


def zuschreibung(kontext):
    # Quellen, die NICHT TK/AD sind, aber im selben Nahfeld stehen koennen
    # (Aufzaehlungen mischen TK-Zitate und CLAUDE.md-Zitate Zeile fuer Zeile).
    # Steht die Fremdquelle direkt HINTER dem Zitat, gehoert das Zitat ihr.
    hinten = kontext.split("||", 1)[1] if "||" in kontext else kontext
    if RE_FREMD.search(hinten[:60]):
        return "C", "-"
    tk = bool(RE_TK.search(kontext)) or bool(RE_ABSCHNITT.search(kontext))
    ad = bool(RE_AD.search(kontext))
    if tk or ad:
        return "A", ("TK" if tk else "") + ("+AD" if (tk and ad) else ("AD" if ad else ""))
    if RE_ISSUE.search(kontext):
        return "B", "Issue"
    return "C", "-"


# ------------------------------------------------------------------ Vergleich

def teile_auslassung(zitat):
    stuecke = re.split(r"…|\.\.\.", zitat)
    return [norm(s) for s in stuecke if norm(s)]


def kommt_vor(zitat, quelle_norm, weich=False):
    fn = norm_weich if weich else norm
    stuecke = re.split(r"…|\.\.\.", zitat)
    stuecke = [fn(s) for s in stuecke if fn(s)]
    if not stuecke:
        return True
    pos = 0
    for s in stuecke:
        if len(s) < 4:          # zu kurz, um etwas zu belegen -> ueberspringen
            continue
        p = quelle_norm.find(s, pos)
        if p < 0:
            return False
        pos = p + len(s)
    return True


def aehnlichster(zitat, quelle_norm, chunks):
    """Aehnlichsten Abschnitt der Quelle finden.

    Zweistufig, sonst laeuft der Vergleich unbrauchbar lange: erst ueber seltene
    Woerter des Zitats vorfiltern, dann nur auf dieser kleinen Menge difflib.
    """
    z = norm(zitat)
    woerter = [w.strip(".,;:!?()[]`*„\"'").lower() for w in z.split()]
    woerter = [w for w in woerter if len(w) >= 6]
    kandidaten = []
    if woerter:
        seltene = sorted(set(woerter), key=len, reverse=True)[:6]
        for c in chunks:
            cl = c.lower()
            if sum(1 for w in seltene if w in cl) >= max(1, len(seltene) // 3):
                kandidaten.append(c)
    kandidaten = kandidaten[:400]
    if kandidaten:
        besten = difflib.get_close_matches(z, kandidaten, n=1, cutoff=0.4)
        if besten:
            return besten[0]
    # Anker-Suche: die ersten Woerter
    for anzahl in (5, 4, 3):
        anker = " ".join(z.split()[:anzahl])
        p = quelle_norm.find(anker)
        if p >= 0:
            return quelle_norm[p:p + max(len(z) + 40, 80)]
    return None


def zerlege_in_chunks(quelle_norm, ziellaenge=160):
    """Ueberlappende Fenster, damit get_close_matches etwas zum Vergleichen hat."""
    chunks = []
    schritt = ziellaenge // 2
    for i in range(0, len(quelle_norm), schritt):
        chunks.append(quelle_norm[i:i + ziellaenge])
    # zusaetzlich satzweise
    chunks.extend([s.strip() for s in re.split(r"(?<=[.;:!?]) ", quelle_norm) if len(s.strip()) > 15])
    return chunks


# --------------------------------------------------------------------- Lauf

def main():
    p = argparse.ArgumentParser()
    p.add_argument("--neu-laden", action="store_true")
    p.add_argument("--bericht", default=os.path.join(CACHE, "bericht.md"))
    p.add_argument("--min-laenge", type=int, default=20,
                   help="Zitate kuerzer als das gelten als rhetorisch (Gruppe C)")
    args = p.parse_args()

    bodies = lade_bodies(args.neu_laden)
    print("Issue-Bodies: %d" % len(bodies), file=sys.stderr)

    tk_roh = open(TK, encoding="utf-8").read()
    ad_roh = open(AD, encoding="utf-8").read()
    tk_n, ad_n = norm(tk_roh), norm(ad_roh)
    tk_w, ad_w = norm_weich(tk_roh), norm_weich(ad_roh)
    tk_chunks = zerlege_in_chunks(tk_n)
    ad_chunks = zerlege_in_chunks(ad_n)

    # Frueher Stand der Vertragsdokumente. Nur damit laesst sich ein VERALTETES
    # Zitat (stand mal woertlich drin, Vertrag hat sich geaendert) von einem
    # NIE-WOERTLICHEN unterscheiden - zwei ganz verschiedene Fehlerklassen.
    historie = {}
    hist_ordner = os.path.join(CACHE, "hist")
    if os.path.isdir(hist_ordner):
        for name in sorted(os.listdir(hist_ordner)):
            with open(os.path.join(hist_ordner, name), encoding="utf-8") as f:
                historie[name[:-3]] = norm(f.read())

    alle_issues_n = {nr: norm(b) for nr, b in bodies.items()}
    alle_issues_w = {nr: norm_weich(b) for nr, b in bodies.items()}

    gesamt = 0
    zaehler = {"A": 0, "B": 0, "C": 0}
    befunde_a, befunde_b = [], []

    for nr in sorted(bodies):
        body = bodies[nr]
        for zitat, s, e, art in finde_zitate(body):
            z = norm(zitat)
            if not z:
                continue
            gesamt += 1
            kontext = absatz_um(body, s, e)
            gruppe, quelle = zuschreibung(nahfeld(body, s, e))
            if len(z) < args.min_laenge:
                zaehler["C"] += 1
                continue
            zaehler[gruppe] += 1

            if gruppe == "A":
                if kommt_vor(zitat, tk_n) or kommt_vor(zitat, ad_n):
                    continue
                if kommt_vor(zitat, tk_w, weich=True) or kommt_vor(zitat, ad_w, weich=True):
                    continue
                # Nicht in TK/AD - steht es woertlich in einem anderen Issue?
                aus_issue = [k for k, v in alle_issues_n.items()
                             if k != nr and kommt_vor(zitat, v)]
                ziel_chunks = tk_chunks if "TK" in quelle else ad_chunks
                ziel_norm = tk_n if "TK" in quelle else ad_n
                # DIE entscheidende Unterscheidung: Stand das Zitat in einer
                # AELTEREN Fassung woertlich drin? Dann ist es durch eine
                # Vertragsaenderung VERALTET (das gesuchte Ergebnis).
                # Stand es nie drin, war es von Anfang an keine woertliche
                # Uebernahme (Regel-D-Schlamperei, andere Fehlerklasse).
                veraltet_seit = [m for m, txt in historie.items()
                                 if kommt_vor(zitat, txt)]
                befunde_a.append(dict(
                    nr=nr, zitat=z, quelle=quelle, art=art,
                    kontext=norm(kontext)[:400],
                    auch_in_issues=sorted(aus_issue)[:5],
                    veraltet_seit=veraltet_seit,
                    naechster=aehnlichster(zitat, ziel_norm, ziel_chunks)))
            elif gruppe == "B":
                if kommt_vor(zitat, tk_n) or kommt_vor(zitat, ad_n):
                    continue
                gefunden = [k for k, v in alle_issues_n.items()
                            if k != nr and kommt_vor(zitat, v)]
                if gefunden:
                    continue
                gefunden_w = [k for k, v in alle_issues_w.items()
                              if k != nr and kommt_vor(zitat, v, weich=True)]
                if gefunden_w:
                    continue
                if kommt_vor(zitat, tk_w, weich=True) or kommt_vor(zitat, ad_w, weich=True):
                    continue
                befunde_b.append(dict(
                    nr=nr, zitat=z, art=art, kontext=norm(kontext)[:400],
                    naechster=aehnlichster(zitat, tk_n, tk_chunks)))

    zeilen = []
    zeilen.append("# Zitat-Abgleich ueber alle Issues\n")
    zeilen.append("Geprueft: %d Zitate aus %d Issues.\n" % (gesamt, len(bodies)))
    zeilen.append("Zuordnung: A(TK/AD)=%d  B(Issue)=%d  C(rhetorisch/kurz)=%d\n"
                  % (zaehler["A"], zaehler["B"], zaehler["C"]))
    zeilen.append("\n## Gruppe A - TK/AD zugeschrieben, NICHT in der aktuellen Quelle (%d)\n"
                  % len(befunde_a))
    veraltete = [b for b in befunde_a if b["veraltet_seit"]]
    zeilen.append("Davon **VERALTET** (stand in einer aelteren TK/AD-Fassung woertlich "
                  "drin, heute nicht mehr): **%d**\n" % len(veraltete))
    zeilen.append("Die uebrigen %d waren NIE woertlich - andere Fehlerklasse "
                  "(Paraphrase als Zitat gesetzt).\n" % (len(befunde_a) - len(veraltete)))
    zeilen.append("\n### === A1: VERALTET durch Vertragsaenderung ===\n")
    for b in veraltete + [None] + [x for x in befunde_a if not x["veraltet_seit"]]:
        if b is None:
            zeilen.append("\n### === A2: nie woertlich (Paraphrase) ===\n")
            continue
        zeilen.append("\n### #%d  [%s, %s]%s" % (
            b["nr"], b["quelle"], b["art"],
            ("  VERALTET seit: " + ",".join(b["veraltet_seit"])) if b["veraltet_seit"] else ""))
        zeilen.append("ZITAT   : %s" % b["zitat"])
        if b["auch_in_issues"]:
            zeilen.append("steht in Issues: %s" % b["auch_in_issues"])
        zeilen.append("NAECHSTE: %s" % (b["naechster"] or "(kein aehnlicher Treffer)"))
        zeilen.append("KONTEXT : %s" % b["kontext"])
    zeilen.append("\n## Gruppe B - Issue zugeschrieben, nirgends woertlich gefunden (%d)\n"
                  % len(befunde_b))
    for b in befunde_b:
        zeilen.append("\n### #%d  [%s]" % (b["nr"], b["art"]))
        zeilen.append("ZITAT   : %s" % b["zitat"])
        zeilen.append("NAECHSTE: %s" % (b["naechster"] or "(kein aehnlicher Treffer)"))
        zeilen.append("KONTEXT : %s" % b["kontext"])

    text = "\n".join(zeilen)
    with open(args.bericht, "w", encoding="utf-8") as f:
        f.write(text)
    print("Geprueft: %d Zitate | A-Befunde: %d | B-Befunde: %d | C: %d"
          % (gesamt, len(befunde_a), len(befunde_b), zaehler["C"]), file=sys.stderr)
    print("Bericht: %s" % args.bericht, file=sys.stderr)


if __name__ == "__main__":
    main()
