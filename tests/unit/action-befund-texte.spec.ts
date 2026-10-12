// Verhaltenstests zu #352 - befund-texte.tsx (E13): Formular-Befunde werden als
// Bediener-Saetze gezeigt, nie als Roh-Codes („standardDauer: ausserhalb_bereich").
import { describe, expect, it } from 'vitest'

import type { EntwurfBefund } from '../../src/renderer/action-editor/aktion-bearbeiten'
import { bedienerBefundText } from '../../src/renderer/action-editor/befund-texte'
import { DAUER_BEREICH } from '../../src/shared/contracts/konstanten'

describe('bedienerBefundText (#352)', () => {
  it('JEDE feld/grund-Kombination der Union liefert einen Satz OHNE den Roh-Code', () => {
    const befunde: EntwurfBefund[] = [
      { feld: 'titel', grund: 'leer' },
      { feld: 'vorlagenId', grund: 'leer' },
      { feld: 'markeId', grund: 'leer' },
      { feld: 'standardDauer', grund: 'ausserhalb_bereich' },
      { feld: 'akzentfarbe', grund: 'kein_hex' },
    ]
    for (const befund of befunde) {
      const satz = bedienerBefundText(befund)
      expect(typeof satz).toBe('string')
      expect(satz.length).toBeGreaterThan(0)
      // E13 wörtlich: der Roh-Code am Feld darf nicht mehr stehen.
      expect(satz).not.toContain(`${befund.feld}: ${befund.grund}`)
    }
  })

  it('der Standarddauer-Satz nennt die Grenzen aus DAUER_BEREICH (#21), nicht abgeschrieben', () => {
    const satz = bedienerBefundText({ feld: 'standardDauer', grund: 'ausserhalb_bereich' })
    expect(satz).toContain(String(DAUER_BEREICH.min))
    expect(satz).toContain(String(DAUER_BEREICH.max))
  })
})
