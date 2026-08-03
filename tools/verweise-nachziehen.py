# -*- coding: utf-8 -*-
"""Schreibt Querverweise in bereits angelegten Issues auf die echten Nummern um.

    python tools/verweise-nachziehen.py <verzeichnis> [<weitere-map.json> ...] [--go]

Beim Anlegen kennt niemand die Issue-Nummern - die Texte tragen deshalb noch die
Planungs-Kürzel (`M2-07`). Dieses Skript ersetzt sie anhand von <verzeichnis>/map.json
durch klickbare `#`-Nummern und schiebt die Bodies per `gh issue edit` nach.

Ohne --go nur Trockenlauf: zeigt je Issue, wie viele Verweise ersetzt würden.

WICHTIG: Quelle sind die Dateien in <verzeichnis>/bodies/ (die beim Anlegen erzeugten
Bodies OHNE Kopfzeile). Die Planungstexte in <verzeichnis>/*.md bleiben absichtlich in
der Kürzel-Schreibweise - sie sind die lesbare Referenz, die Mapping-Tabelle steht im
Draft. Ein unbekanntes Kürzel wird NICHT ersetzt, sondern gemeldet: lieber ein
stehengebliebener Verweis als eine falsche Nummer.
"""
import io, os, re, sys, json, subprocess
sys.stdout.reconfigure(encoding="utf-8")

if len(sys.argv) < 2:
    print(__doc__); sys.exit(1)
B   = sys.argv[1].rstrip("/")
GO  = "--go" in sys.argv
MAP = f"{B}/map.json"
OUT = f"{B}/bodies"

if not os.path.exists(MAP):
    print("ABBRUCH: kein map.json in", B, "- erst anlegen (create-issues.py --go)."); sys.exit(1)
mapping = json.loads(io.open(MAP, encoding="utf-8").read())
if not mapping:
    print("ABBRUCH: map.json ist leer."); sys.exit(1)

# Praefix aus dem Mapping ableiten (alle Schluessel teilen ihn, s. create-issues.py)
# Nur die EIGENEN Issues werden durchlaufen; fremde Mappings dienen allein dem
# Nachschlagen (sonst sucht das Skript Bodies fremder Verzeichnisse).
EIGENE = dict(mapping)

# Weitere Mappings dazuladen: Texte verweisen ueber Meilenstein-Grenzen hinweg
# (M3-17 wird von M1-45 gerufen, M3 ruft M1-41/42/43 auf). Ohne die fremden
# Mappings blieben genau diese Verweise als Kuerzel stehen - unklickbar und beim
# naechsten Lauf nicht mehr aufloesbar.
for extra in sys.argv[2:]:
    if not extra.endswith(".json"):
        continue
    zusatz = json.loads(io.open(extra, encoding="utf-8").read())
    doppelt = set(zusatz) & set(mapping)
    if doppelt:
        print("ABBRUCH: Schluessel in zwei Mappings:", sorted(doppelt)); sys.exit(1)
    mapping.update(zusatz)
    print(f"Zusatz-Mapping: {extra} ({len(zusatz)} Eintraege)")

# Alle vorkommenden Praefixe bedienen, nicht nur den eigenen.
PRAEFIXE = sorted({k.split("-")[0] for k in mapping})
MUSTER   = re.compile(r"\b(" + "|".join(re.escape(x) for x in PRAEFIXE) + r")-(\d+)\b")

unbekannt, gesamt, betroffen = set(), 0, []
for key in sorted(EIGENE):
    pfad = f"{OUT}/{key}.md"
    if not os.path.exists(pfad):
        print(f"  {key}: KEIN Body unter {pfad} - uebersprungen"); continue
    text = io.open(pfad, encoding="utf-8").read()

    def ersetze(m):
        global unbekannt
        schluessel = f"{m.group(1)}-{m.group(2)}"
        if schluessel not in mapping:
            unbekannt.add(schluessel); return m.group(0)
        return f"#{mapping[schluessel]}"

    neu, n = MUSTER.subn(ersetze, text)
    # Selbstverweise sind sinnlos ("dieses Issue #61") - sie entstehen, wenn ein Text
    # die eigene Nummer nennt. Nur melden, nicht automatisch entfernen.
    selbst = neu.count(f"#{mapping[key]}")
    if n:
        gesamt += n
        betroffen.append((key, mapping[key], n, selbst, pfad, neu))
        print(f"  {key} -> #{mapping[key]}: {n} Verweise" + (f"  (davon {selbst}x auf sich selbst)" if selbst else ""))

print(f"\n{gesamt} Verweise in {len(betroffen)} von {len(mapping)} Issues")
if unbekannt:
    print("NICHT ersetzt (kein Eintrag im Mapping):", sorted(unbekannt))

if not GO:
    print("\n--- TROCKENLAUF, nichts geaendert. Mit --go ausfuehren. ---"); sys.exit(0)

for key, nr, n, _selbst, pfad, neu in betroffen:
    io.open(pfad, "w", encoding="utf-8").write(neu)
    r = subprocess.run(["gh", "issue", "edit", str(nr), "--body-file", pfad],
                       capture_output=True, text=True, encoding="utf-8")
    print(f"  #{nr}: {'ok' if r.returncode == 0 else 'FEHLER ' + r.stderr.strip()[:120]}")
print(f"\nnachgezogen: {len(betroffen)} Issues")
