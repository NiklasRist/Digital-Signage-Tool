import { describe, expect, it, vi } from 'vitest'
import type { Project } from '../../src/shared/contracts/project'
import type { Asset } from '../../src/shared/contracts/asset'
import type { Aktion } from '../../src/shared/contracts/aktion'
import {
  pruefeLoeschLage,
  benenneReferenzen,
  leseReferenzenIds,
  loescheMedium,
  type LoeschWirkungen,
} from '../../src/renderer/composer/medium-loeschen'

describe('medium-loeschen (Renderer)', () => {
  const dummyAsset: Asset = {
    id: 'asset-1',
    typ: 'video',
    dateiname: 'asset-1.mp4',
    originalname: 'Werbung.mp4',
    maße: { breite: 1920, höhe: 1080 },
    dauer: 10,
    importdatum: '',
    zustand: 'ok',
  }

  const dummyProjekt: Project = {
    id: 'p-1',
    name: 'Test-Projekt',
    erstelltAm: '',
    geaendertAm: '',
    schemaVersion: 1,
    assets: [dummyAsset],
    aktionen: [
      {
        id: 'akt-1',
        titel: 'Aktion 1',
        beschreibung: null,
        preis: null,
        bildRef: 'asset-1', // verwendet als bildRef
        cta: null,
        standardDauer: null,
        vorlagenId: '',
        akzentfarbe: null,
      },
    ],
    liste: [
      {
        id: 'el-1',
        art: 'video',
        ref: 'asset-1', // Blockiert!
        dauer: null,
        trimStart: null,
        trimEnde: null,
        einblendung: null,
      },
      {
        id: 'el-2',
        art: 'segment',
        ref: 'asset-1', // Segment, blockiert nicht, auch wenn ref === asset-1 (Regressionstest)
        dauer: 10,
        trimStart: null,
        trimEnde: null,
        einblendung: null,
      },
    ],
    letzterAusgabeName: null,
    // Pflichtfeld seit TK v3.18 (#334)
    standardSegmentdauer: 10,
  }

  describe('pruefeLoeschLage', () => {
    it('findet Blockierer bei art: video', () => {
      const lage = pruefeLoeschLage(dummyProjekt, 'asset-1')
      expect(lage.blockierer).toHaveLength(1)
      expect(lage.blockierer[0]).toEqual({
        elementId: 'el-1',
        position: 1,
        art: 'video',
        bezeichnung: 'Werbung.mp4',
      })
      expect(lage.betroffeneAktionen).toHaveLength(1)
      expect(lage.betroffeneAktionen[0]).toEqual({
        aktionId: 'akt-1',
        titel: 'Aktion 1',
      })
      expect(lage.text).toContain('Das Medium kann nicht gelöscht werden')
      expect(lage.text).toContain('Position 1 (Werbung.mp4)')
    })

    it('gibt Bestätigungsfrage zurück, wenn keine Blockierer existieren', () => {
      const projektOhneBlockierer = {
        ...dummyProjekt,
        liste: [
          {
            id: 'el-2',
            art: 'segment',
            ref: 'asset-1',
            dauer: 10,
            trimStart: null,
            trimEnde: null,
            einblendung: null,
          },
        ] as any[],
      } as Project

      const lage = pruefeLoeschLage(projektOhneBlockierer, 'asset-1')
      expect(lage.blockierer).toHaveLength(0)
      expect(lage.betroffeneAktionen).toHaveLength(1)
      expect(lage.text).toBe('Möchten Sie das Medium "Werbung.mp4" wirklich aus dem Projekt löschen?')
    })
  })

  describe('benenneReferenzen', () => {
    it('übersetzt bekannte Kennungen und überspringt unbekannte', () => {
      const referenzen = benenneReferenzen(dummyProjekt, ['el-1', 'unbekannt', 'el-2'])
      expect(referenzen).toHaveLength(1) // nur el-1 ist bekannt und art: video
      expect(referenzen[0]).toEqual({
        elementId: 'el-1',
        position: 1,
        art: 'video',
        bezeichnung: 'Werbung.mp4',
      })
    })
  })

  describe('leseReferenzenIds', () => {
    it('liefert leeres Array für ungültige Formen', () => {
      expect(leseReferenzenIds(undefined)).toEqual([])
      expect(leseReferenzenIds(null)).toEqual([])
      expect(leseReferenzenIds({})).toEqual([])
      expect(leseReferenzenIds({ referenzenIds: 'x' })).toEqual([])
      expect(leseReferenzenIds({ referenzenIds: [1, 2] })).toEqual([])
    })

    it('extrahiert referenzenIds korrekt bei passender Form', () => {
      expect(leseReferenzenIds({ referenzenIds: ['a', 'b'] })).toEqual(['a', 'b'])
    })
  })

  describe('loescheMedium', () => {
    it('ruft gibVideoHandlesFrei vor rufeAuf auf', async () => {
      const aufrufe: string[] = []
      const wirkungen: LoeschWirkungen = {
        gibVideoHandlesFrei: vi.fn((assetId) => {
          aufrufe.push(`freigeben:${assetId}`)
        }),
      }

      // Mock rufeAuf
      const originalRufeAuf = await import('../../src/renderer/ipc-client/rufe-auf')
      const spyRufeAuf = vi.spyOn(originalRufeAuf, 'rufeAuf').mockImplementation(async (kanal, nutzlast) => {
        aufrufe.push(`rufeAuf:${kanal}`)
        return { ok: true, wert: { auftragId: 'auftrag-123' } } as any
      })

      const ergebnis = await loescheMedium('p-1', 'asset-1', wirkungen)
      
      expect(ergebnis).toEqual({ ok: true, wert: { auftragId: 'auftrag-123' } })
      expect(wirkungen.gibVideoHandlesFrei).toHaveBeenCalledWith('asset-1')
      expect(spyRufeAuf).toHaveBeenCalledTimes(1)
      expect(aufrufe).toEqual(['freigeben:asset-1', 'rufeAuf:queue:reiheEin'])

      spyRufeAuf.mockRestore()
    })

    it('fängt Ausnahmen von gibVideoHandlesFrei ab und liefert unbekannter_fehler', async () => {
      const wirkungen: LoeschWirkungen = {
        gibVideoHandlesFrei: vi.fn(() => {
          throw new Error('Fehler beim Freigeben')
        }),
      }

      const originalRufeAuf = await import('../../src/renderer/ipc-client/rufe-auf')
      const spyRufeAuf = vi.spyOn(originalRufeAuf, 'rufeAuf')

      const ergebnis = await loescheMedium('p-1', 'asset-1', wirkungen)

      expect(ergebnis.ok).toBe(false)
      if (!ergebnis.ok) {
        expect(ergebnis.fehler.code).toBe('unbekannter_fehler')
        expect(ergebnis.fehler.meldung).toContain('Fehler beim Freigeben')
      }
      expect(spyRufeAuf).not.toHaveBeenCalled()

      spyRufeAuf.mockRestore()
    })
  })
})
