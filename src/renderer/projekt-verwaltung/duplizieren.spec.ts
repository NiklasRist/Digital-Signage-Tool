import { describe, it, expect, vi } from 'vitest'
import {
  pruefeDuplikatname,
  schlageDuplikatnamenVor,
  baueDuplizierHinweis,
  dupliziereProjekt,
} from './duplizieren'
import { KANAELE } from '../../shared/contracts/kanaele'
import * as rufeAufModule from '../ipc-client/rufe-auf'
import type { ProjektMeta } from './liste'

describe('duplizieren', () => {
  it('pruefeDuplikatname validiert korrekt', () => {
    expect(pruefeDuplikatname('Test').ok).toBe(true)
    expect(pruefeDuplikatname('  ').ok).toBe(false)
    expect(pruefeDuplikatname('  Test  ')).toEqual({ ok: true, name: 'Test' })
  })

  it('schlageDuplikatnamenVor schlägt korrekt vor', () => {
    const meta = { name: 'Sommer' } as unknown as ProjektMeta
    expect(schlageDuplikatnamenVor(meta)).toBe('Sommer Kopie')
  })

  it('baueDuplizierHinweis liefert Text oder null', () => {
    const meta = { anzahlMedien: 5 } as unknown as ProjektMeta
    const hinweis = baueDuplizierHinweis(meta)
    expect(hinweis).toContain('5')
    expect(hinweis).toContain('kopiert')
    expect(hinweis).toContain('nicht mitkopiert')

    expect(baueDuplizierHinweis({ anzahlMedien: -1 } as unknown as ProjektMeta)).toBe(null)
  })

  it('dupliziereProjekt ruft IPC auf und frischt Liste auf', async () => {
    const rufeAufSpy = vi.spyOn(rufeAufModule, 'rufeAuf').mockResolvedValue({
      ok: true,
      wert: { id: 'neu', name: 'Test Kopie' },
    })
    const aktualisiereSpy = vi.fn().mockResolvedValue(undefined)
    const wirkungen = { aktualisiereProjektliste: aktualisiereSpy }

    const ergebnis = await dupliziereProjekt('alt', 'Test', wirkungen)

    expect(rufeAufSpy).toHaveBeenCalledWith(KANAELE.project.dupliziereProjekt, {
      id: 'alt',
      neuerName: 'Test',
    })
    expect(aktualisiereSpy).toHaveBeenCalled()
    expect(ergebnis.ok).toBe(true)
  })

  it('dupliziereProjekt bei Fehler', async () => {
    vi.spyOn(rufeAufModule, 'rufeAuf').mockResolvedValue({
      ok: false,
      fehler: { code: 'nicht_gefunden', meldung: 'Nicht gefunden' },
    })
    const aktualisiereSpy = vi.fn()
    const wirkungen = { aktualisiereProjektliste: aktualisiereSpy }

    const ergebnis = await dupliziereProjekt('alt', 'Test', wirkungen)
    expect(ergebnis.ok).toBe(false)
    expect(aktualisiereSpy).not.toHaveBeenCalled()
  })
})
