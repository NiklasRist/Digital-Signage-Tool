# Erzeugt aus den "Signatur (verbindlich)"-Bloecken der GitHub-Issues das
# Funktionsgeruest fuer M1-M7: je Zieldatei die Typen/Interfaces unveraendert und
# je Funktion einen WERFENDEN Rumpf.
#
# Warum werfend und nicht leer: Ein leerer Rumpf gibt undefined zurueck und gilt dem
# Compiler bei "void" als gueltig - eine Funktion, die stillschweigend "gelingt", ist
# genau die Attrappe, die #3 verbietet. Ein throw scheitert laut und nennt sein Issue.
#
# Aufruf: python geruest.py <issues.json> <zielwurzel> [--nur N,N,N]

import json, io, os, re, sys, collections

SIG = re.compile(r'^## Signatur[^\n]*\n+```(?:ts|tsx|typescript)?\n(.*?)^```', re.M | re.S)
PFAD_KOMMENTAR = re.compile(r'^//\s*(src/[A-Za-z0-9_\-./]+\.(?:ts|tsx))\s*$')
DATEI_ZEILE = re.compile(r'^- \*{0,2}Datei(?:en)?[^`\n]*`([^`]+)`', re.M)
FUNK_START = re.compile(r'^\s*(?:export\s+)?(?:declare\s+)?(?:async\s+)?function\s+[A-Za-z_$]')

# Zeichen, nach denen eine Zeile sicher NICHT zu Ende ist.
OFFEN_ENDE = (',', '|', '&', '(', '<', '=>', ':', '+')


def block_von(body):
    b = (body or '').replace('\r\n', '\n')
    m = SIG.search(b)
    return m.group(1) if m else None


def zielpfade(body, block):
    """Primaer der // src/...-Kommentar im Block, hilfsweise die '- Datei:'-Zeile."""
    pfade = []
    if block:
        for z in block.split('\n'):
            m = PFAD_KOMMENTAR.match(z.strip())
            if m and m.group(1) not in pfade:
                pfade.append(m.group(1))
    if not pfade:
        b = (body or '').replace('\r\n', '\n')
        for treffer in DATEI_ZEILE.findall(b):
            t = treffer.strip()
            if t.startswith('src/') and t.endswith(('.ts', '.tsx')) and t not in pfade:
                pfade.append(t)
    return pfade


def signatur_ende(text, start):
    """Findet das Ende EINER Funktionssignatur ab Position `start`.

    Liefert (ende, art) mit art aus {'rumpf', 'semikolon', 'zeilenende'}:
      'rumpf'      - bei `ende` steht ein '{', die Funktion hat bereits einen Rumpf
      'semikolon'  - bei `ende` steht ein ';' (reine Deklaration)
      'zeilenende' - die Signatur endet am Zeilenumbruch ohne Abschlusszeichen

    Warum ein Scanner und keine Heuristik: Der Rueckgabetyp darf selbst geschweifte
    Klammern enthalten (`Promise<Ergebnis<{ stand: X }>>`). Ein Verfahren, das die
    erste '{' fuer den Rumpfanfang haelt, zerschneidet genau diese Signaturen - und
    zwar lautlos, weil das Ergebnis noch wie TypeScript aussieht.
    """
    rund = eckig = geschweift = spitz = 0
    params_fertig = False       # die Parameterliste ist geschlossen
    im_rueckgabetyp = False     # wir stehen hinter dem ':' des Rueckgabetyps
    i, n = start, len(text)
    while i < n:
        z = text[i]
        # Kommentare und Zeichenketten ueberspringen - sie zaehlen nicht mit.
        if text.startswith('//', i):
            i = text.find('\n', i)
            if i == -1:
                return n, 'zeilenende'
            continue
        if text.startswith('/*', i):
            e = text.find('*/', i + 2)
            i = n if e == -1 else e + 2
            continue
        if z in '"\'`':
            i += 1
            while i < n and text[i] != z:
                i += 2 if text[i] == '\\' else 1
            i += 1
            continue
        if text.startswith('=>', i):      # Pfeil ist kein spitze-Klammer-Ende
            i += 2
            continue

        if z == '(':
            rund += 1
        elif z == ')':
            rund -= 1
            if rund == 0:
                params_fertig = True
        elif z == ':' and params_fertig and rund == eckig == spitz == geschweift == 0:
            # Ab hier laeuft der Rueckgabetyp. Eine '{' bedeutet jetzt einen
            # OBJEKT-TYP (`): { anfang: number }`), nicht den Rumpfanfang. Ohne diese
            # Unterscheidung wird der Rueckgabetyp als Rumpf gelesen - die Funktion
            # bekommt keinen, und der Fehler zeigt sich erst zwei Deklarationen
            # spaeter als "Function implementation name must be ...".
            im_rueckgabetyp = True
        elif z == '[': eckig += 1
        elif z == ']': eckig -= 1
        elif z == '<':
            # Nur als Generic zaehlen, wenn davor ein Bezeichner oder ',' steht.
            davor = text[i - 1] if i else ' '
            if davor.isalnum() or davor in '_$,<': spitz += 1
        elif z == '>':
            if spitz > 0: spitz -= 1
        elif z == '{':
            if rund == eckig == spitz == 0 and not im_rueckgabetyp:
                return i, 'rumpf'
            geschweift += 1
        elif z == '}': geschweift -= 1
        elif z == ';' and rund == eckig == spitz == geschweift == 0:
            return i, 'semikolon'
        elif z == '\n' and rund == eckig == spitz == geschweift == 0:
            # Zeilenende auf Tiefe 0: nur ein Ende, wenn die Zeile nicht offen endet.
            zeile = text[text.rfind('\n', 0, i) + 1:i]
            ohne_kommentar = re.sub(r'//.*$', '', zeile).rstrip()
            if ohne_kommentar and not ohne_kommentar.endswith((',', '|', '&', '(', '<', ':', '=>', '=')):
                return i, 'zeilenende'
        i += 1
    return n, 'zeilenende'


def ruempfe_anhaengen(block, issue_nr):
    """Haengt jeder rumpflosen Funktionssignatur einen werfenden Rumpf an.

    Arbeitet auf dem Gesamttext, nicht zeilenweise: Signaturen erstrecken sich ueber
    mehrere Zeilen, und ihr Ende ist nur ueber die Klammerbilanz bestimmbar.
    """
    aus = []
    pos = 0
    angehaengt = 0
    while True:
        # [^\W\d] statt [A-Za-z_$]: Die Funktionsnamen dieses Projekts sind deutsch
        # (oeffneProjekt, loescheAktion, ...). Ein ASCII-Muster uebersieht jede
        # Funktion mit Umlaut - lautlos, denn sie bleibt einfach ohne Rumpf stehen.
        m = re.compile(r'^[ \t]*(?:export[ \t]+)?(?:declare[ \t]+)?(?:async[ \t]+)?'
                       r'function[ \t]+[^\W\d]', re.M | re.U).search(block, pos)
        if not m:
            aus.append(block[pos:])
            break

        aus.append(block[pos:m.start()])
        ende, art = signatur_ende(block, m.start())

        if art == 'rumpf':
            aus.append(block[m.start():ende + 1])   # hat schon einen Rumpf
            pos = ende + 1
            continue

        sig = block[m.start():ende]
        einrueckung = re.match(r'^[ \t]*', block[m.start():]).group(0)

        # Ein nachgestellter //-Kommentar auf derselben Zeile gehoert zur Signatur und
        # darf nicht zwischen ihr und der oeffnenden Klammer stehen - dort verschluckte
        # er die '{'. Er wandert ueber die Funktion.
        nachsatz = ''
        m_k = re.search(r'//.*$', sig)
        if m_k and '\n' not in sig[m_k.start():]:
            nachsatz = einrueckung + m_k.group(0).strip() + '\n'
            sig = sig[:m_k.start()].rstrip()

        aus.append(nachsatz + sig.rstrip() + ' {\n')
        aus.append(einrueckung + '  throw new Error(\n')
        aus.append(einrueckung + '    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #%d."\n' % issue_nr)
        aus.append(einrueckung + '  );\n')
        aus.append(einrueckung + '}')
        angehaengt += 1
        pos = ende + 1 if art == 'semikolon' else ende

    return ''.join(aus), angehaengt


def konstanten_belegen(text, issue_nr):
    """Gibt `export const X: T` ohne Wert einen werfenden Ausdruck.

    Warum nicht einfach einen passenden Wert einsetzen: Bei zwei der Faelle waere er
    aus dem Literaltyp ableitbar (`readonly ['import', 'loeschen']`), bei den uebrigen
    zwoelf ist er ECHTE IMPLEMENTIERUNG (`LEERE_PROJEKTLISTE: Projektliste`). Ein
    generator-erfundener Wert saehe richtig aus und waere die schlimmste Sorte Fehler:
    einer, den niemand mehr sucht. Deshalb wirft auch die Konstante.

    Der Wurf geschieht beim Laden des Moduls, nicht bei der ersten Benutzung - das ist
    Absicht: Ein ungefuelltes Geruest soll beim ersten Start auffallen, nicht irgendwann
    mitten im Betrieb.
    """
    muster = re.compile(r'^([ \t]*export[ \t]+const[ \t]+[^\W\d][\w$]*[ \t]*:[^\n=]+?)[ \t]*$',
                        re.M | re.U)

    def ersetze(m):
        return (m.group(1) + ' = (() => {\n'
                '  throw new Error(\n'
                '    "Noch nicht umgesetzt - Wert gehoert zu Issue #%d."\n'
                '  );\n'
                '})();' % issue_nr)

    return muster.subn(ersetze, text)


def kopf(nr, titel, pfad):
    return (
        '// GENERIERT aus dem Signaturblock von Issue #%d.\n'
        '// %s\n'
        '//\n'
        '// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht\n'
        '// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt\n'
        '// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den\n'
        '// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.\n\n'
        % (nr, titel)
    )


def main():
    quelle, ziel = sys.argv[1], sys.argv[2]
    nur = None
    if '--nur' in sys.argv:
        nur = {int(x) for x in sys.argv[sys.argv.index('--nur') + 1].split(',')}

    daten = json.load(io.open(quelle, encoding='utf-8'))
    m17 = [i for i in daten
           if (i.get('milestone') or {}).get('title', '').startswith(('M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7'))]

    beansprucht = collections.defaultdict(list)
    geschrieben, ohne_ziel, ohne_block, ruempfe = 0, [], [], 0
    uebersprungen = []
    konstanten = 0

    for iss in sorted(m17, key=lambda x: x['number']):
        nr = iss['number']
        if nur and nr not in nur:
            continue
        block = block_von(iss['body'])
        if not block:
            ohne_block.append(nr)
            continue
        pfade = zielpfade(iss['body'], block)
        if not pfade:
            ohne_ziel.append(nr)
            continue

        # Nur die erste Zieldatei bekommt den Block; mehrere Pfade werden gemeldet.
        pfad = pfade[0]
        beansprucht[pfad].append(nr)

        inhalt, n = ruempfe_anhaengen(block, nr)
        inhalt, k = konstanten_belegen(inhalt, nr)
        ruempfe += n
        konstanten += k
        # Die Pfad-Kommentarzeile selbst nicht mit in die Datei schreiben.
        inhalt = '\n'.join(z for z in inhalt.split('\n')
                           if not PFAD_KOMMENTAR.match(z.strip()))

        voll = os.path.join(ziel, pfad.replace('/', os.sep))
        # Vorhandene Dateien NIE ueberschreiben. Zwei Dateien gehoeren planmaessig je
        # zwei Issues (ergebnis.ts: #12 legt an, #22 erweitert; App.tsx: #10 legt das
        # Skelett an, #262 ersetzt es). Ein Generatorlauf, der die fertige M0-Fassung
        # durch ein werfendes Geruest ersetzt, macht aus gebautem Code eine Baustelle.
        if os.path.exists(voll):
            uebersprungen.append((pfad, nr))
            continue
        os.makedirs(os.path.dirname(voll), exist_ok=True)
        io.open(voll, 'w', encoding='utf-8', newline='\n').write(
            kopf(nr, iss['title'], pfad) + inhalt.strip() + '\n')
        geschrieben += 1

    print('Dateien geschrieben        :', geschrieben)
    print('Werfende Ruempfe angehaengt:', ruempfe)
    print('Werfende Konstanten belegt :', konstanten)
    print('Issues ohne Signaturblock  :', len(ohne_block), ohne_block[:15])
    print('Issues ohne Zieldatei      :', len(ohne_ziel), ohne_ziel[:15])
    mehrfach = {p: v for p, v in beansprucht.items() if len(v) > 1}
    print('Uebersprungen (Datei existiert):', len(uebersprungen), uebersprungen)
    print('Dateien mit mehreren Issues:', len(mehrfach))
    for p, v in list(mehrfach.items())[:10]:
        print('   ', p, '->', v)


main()
