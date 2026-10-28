// Lokale ESLint-Regel (#447): keine Quelltext-Proben in `tests/unit`.
//
// WARUM: Eine Probe, die den Quelltext liest und Zeichenketten sucht (`expect(CODE).toContain(
// "rufeAuf")`), prueft die FORM einer Datei, nicht ihr Verhalten. Sie faellt bei jeder
// Umbenennung um, sie faellt NICHT, wenn das Verhalten kaputtgeht - und sie ist die zweite
// Vertragsquelle neben dem Code. Die Mutations-Chargen haben 186 solcher Proben entfernt;
// ohne diese Regel wachsen neue nach, sobald jemand eine Zusage "schnell" absichern will.
//
// DIE REGEL IST EINE SPERRKLINKE, KEIN VERBOT: Der Bestand vom 28.10.2026 steht in
// `quelltext-proben-ausnahmen.json` (71 Dateien). Diese Liste darf NUR schrumpfen - jede
// Mutations-Charge streicht ihre fuenf Dateien. Neue Proben in nicht gelisteten Dateien sind
// ein Fehler.
//
// Was als Probe gilt: ein `readFileSync(...)`, dessen Pfad auf `src/` zeigt - direkt als
// Literal, als Template ohne Ausdruck, ueber eine Konstante (`const QUELLE = path.join(...)`)
// oder ueber `new URL(...)`. Gelesen werden Temp-Dateien, Fixtures usw. weiterhin ohne
// Meldung; die Regel prueft den Pfad, nicht den Aufruf.

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HIER = path.dirname(fileURLToPath(import.meta.url))
const WURZEL = path.resolve(HIER, '..', '..')

/** Repo-relative Pfade (POSIX), deren Quelltext-Proben bewusst stehen bleiben. */
const AUSNAHMEN = new Set(
  JSON.parse(readFileSync(path.join(HIER, 'quelltext-proben-ausnahmen.json'), 'utf8')),
)

/** Sammelt alle Zeichenketten-Literale eines Ausdrucks (auch verschachtelt). */
function literale(knoten, sammlung = [], gesehen = new WeakSet()) {
  if (!knoten || typeof knoten !== 'object') return sammlung
  if (gesehen.has(knoten)) return sammlung
  gesehen.add(knoten)
  if (knoten.type === 'Literal' && typeof knoten.value === 'string') {
    sammlung.push(knoten.value)
    return sammlung
  }
  if (knoten.type === 'TemplateLiteral' && knoten.expressions.length === 0) {
    sammlung.push(knoten.quasis.map((teil) => teil.value.cooked ?? '').join(''))
    return sammlung
  }
  for (const [schluessel, wert] of Object.entries(knoten)) {
    // `parent` zeigt rueckwaerts im Baum - ohne diese Sperre laeuft der Walker im Kreis.
    if (schluessel === 'parent') continue
    if (Array.isArray(wert)) {
      for (const teil of wert) literale(teil, sammlung, gesehen)
    } else if (wert && typeof wert === 'object' && typeof wert.type === 'string') {
      literale(wert, sammlung, gesehen)
    }
  }
  return sammlung
}

/** Loest einen Bezeichner auf seine Deklaration auf (eine Ebene, ueber den Scope). */
function aufloesen(knoten, quelltext) {
  if (!knoten || knoten.type !== 'Identifier') return null
  let rahmen = quelltext.getScope(knoten)
  while (rahmen) {
    const variable = rahmen.variables.find((eintrag) => eintrag.name === knoten.name)
    if (variable) {
      const definition = variable.defs[0]
      return definition?.node?.init ?? definition?.node ?? null
    }
    rahmen = rahmen.upper
  }
  return null
}

const regel = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Quelltext-Proben in tests/unit: readFileSync auf src/ ist nur in gelisteten Dateien erlaubt.',
    },
    schema: [],
    messages: {
      probe:
        'Quelltext-Probe: diese Testdatei liest "{{pfad}}" aus src/. Die Zusage gehoert in ' +
        'einen Verhaltens-Test; Ausnahmen stehen in tools/eslint/quelltext-proben-ausnahmen.json (#447).',
    },
  },
  create(rahmen) {
    const datei = path.relative(WURZEL, rahmen.filename).split(path.sep).join('/')
    if (AUSNAHMEN.has(datei)) return {}

    return {
      CallExpression(knoten) {
        if (knoten.callee.type !== 'Identifier' || knoten.callee.name !== 'readFileSync') return
        const argument = knoten.arguments[0]
        if (!argument) return

        const kandidaten = literale(argument)
        const aufgeloest = aufloesen(argument, rahmen.sourceCode)
        if (aufgeloest) kandidaten.push(...literale(aufgeloest))

        const treffer = kandidaten.find((wert) => wert.includes('src/'))
        if (treffer === undefined) return
        rahmen.report({ node: knoten, messageId: 'probe', data: { pfad: treffer } })
      },
    }
  },
}

export default { rules: { 'quelltext-proben': regel } }
