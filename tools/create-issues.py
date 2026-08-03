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
}

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
    abschnitt = body.split("## Fehlerpfade")[-1].split("## Nicht selbst entscheiden")[0]
    if any(z.lstrip().startswith("|") for z in abschnitt.split("\n")) and \
       re.search(r"`(ungueltige_eingabe|nicht_gefunden|speicher_fehler|unbekannter_fehler)`", abschnitt):
        L.append("art:fehlerbehandlung")
    if nr in M2_BLOCKIEREND: L.append("braucht-entscheidung")
    return L

def labels_fuer(nr, titel, body):
    L = []
    if "[contracts]" in titel:
        L += ["modul:contracts", "ebene:geteilt", "art:typen"]
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
PROFIL = {"M1": labels_fuer, "M2": labels_m2}.get(PRAEFIX)
if PROFIL is None:
    print(f"ABBRUCH: kein Label-Profil fuer Praefix '{PRAEFIX}'."
          f" Bekannt: M1, M2. Neues Profil im Skript anlegen, nicht raten."); sys.exit(1)
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

mapping = {}
for e in eintraege:
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
print(f"\nangelegt: {len(mapping)} von {len(eintraege)} -> Mapping in {MAP}")
