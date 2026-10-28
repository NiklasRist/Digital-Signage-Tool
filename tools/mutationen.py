#!/usr/bin/env python3
"""Mutations-Harness: eine Aenderung, ein Testlauf, byte-identische Ruecknahme.

Rezept der Mutations-Chargen (docs/agents/mutation-pilot-2026-10-20.md):
Genau EINE semantische Aenderung an der Quelldatei, die zugehoerige Spezifikation
laufen lassen, danach die Datei aus der Sicherung zuruecknehmen und die Pruefsumme
vergleichen. Eine Probe ohne belegte Ruecknahme ist keine Probe.

Aufruf:
    python3 tools/mutationen.py faelle.json

Die Fallliste ist JSON:
    [
      {"id": "M1", "file": "src/...", "spec": "tests/unit/....spec.ts",
       "edits": [["alt", "neu"]], "all": false}
    ]

`all: true` ersetzt jedes Vorkommen (nur fuer harmlose Refactorings gedacht);
sonst muss jeder Suchtext genau einmal vorkommen. Mehrere `edits` je Fall sind
erlaubt, wenn eine semantische Aenderung zwei Textstellen braucht.
"""
from __future__ import annotations

import hashlib
import json
import pathlib
import subprocess
import sys
import tempfile

REPO = pathlib.Path(__file__).resolve().parent.parent


def sha(pfad: pathlib.Path) -> str:
    return hashlib.sha256(pfad.read_bytes()).hexdigest()


def laufe(spec: str) -> tuple[int, list[str], str]:
    """Startet die eine Spezifikation und liest das JSON-Ergebnis."""
    with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as datei:
        ausgabe = pathlib.Path(datei.name)
    prozess = subprocess.run(
        ["npx", "vitest", "run", spec, "--reporter=json", f"--outputFile={ausgabe}"],
        cwd=REPO,
        capture_output=True,
        text=True,
    )
    rot: list[str] = []
    bilanz = ""
    if ausgabe.exists():
        try:
            daten = json.loads(ausgabe.read_text())
            bilanz = (
                f"{daten.get('numPassedTests', '?')} bestanden, "
                f"{daten.get('numFailedTests', '?')} rot"
            )
            for datei in daten.get("testResults", []):
                for fall in datei.get("assertionResults", []):
                    if fall.get("status") == "failed":
                        rot.append(fall.get("fullName", fall.get("title", "?")))
        except Exception as fehler:  # noqa: BLE001 - Harness, kein Produktcode
            bilanz = f"JSON unlesbar: {fehler}"
        ausgabe.unlink(missing_ok=True)
    return prozess.returncode, rot, bilanz


def main(fallliste: str) -> int:
    faelle = json.loads(pathlib.Path(fallliste).read_text())
    zeilen: list[tuple[str, str, str]] = []
    fehler = False

    for fall in faelle:
        pfad = REPO / fall["file"]
        original = pfad.read_bytes()
        vorher = hashlib.sha256(original).hexdigest()
        text = original.decode("utf-8")

        for alt, neu in fall["edits"]:
            treffer = text.count(alt)
            erlaubt = treffer >= 1 if fall.get("all") else treffer == 1
            if not erlaubt:
                zeilen.append((fall["id"], f"EDIT-PROBLEM: {treffer} Treffer", ""))
                fehler = True
                break
            text = text.replace(alt, neu) if fall.get("all") else text.replace(alt, neu, 1)
        else:
            pfad.write_bytes(text.encode("utf-8"))
            try:
                code, rot, bilanz = laufe(fall["spec"])
            finally:
                pfad.write_bytes(original)
            if sha(pfad) != vorher:
                print(f"{fall['id']}: RUECKNAHME NICHT BYTE-IDENTISCH", flush=True)
                return 1
            status = "ERKANNT" if code != 0 else "GRUEN"
            zeilen.append((fall["id"], status, bilanz))
            print(f"{fall['id']}: {'rot' if code != 0 else 'GRUEN'} ({bilanz})", flush=True)
            for name in rot[:4]:
                print(f"    - {name}", flush=True)

    print("\n=== TABELLE ===")
    for kennung, status, bilanz in zeilen:
        print(f"{kennung} | {status} | {bilanz}")
    print("\nRuecknahmen: alle byte-identisch geprueft.")
    return 1 if fehler else 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Aufruf: python3 tools/mutationen.py faelle.json", file=sys.stderr)
        raise SystemExit(2)
    raise SystemExit(main(sys.argv[1]))
