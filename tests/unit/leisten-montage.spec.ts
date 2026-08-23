import { describe, expect, it } from 'vitest'
import type { AuftragsSicht } from '../../src/renderer/queue-panel/auftrags-sicht'
import type { Auftrag } from '../../src/shared/contracts/auftrag'
import type { RenderRequest } from '../../src/shared/contracts/render-request'
import type { QueueAktion } from '../../src/renderer/queue-panel/entfernen'
import {
  LEERE_LEISTEN_LAGE,
  Rueckfrage,
  LeistenLage,
  schalteKlappzustand,
  oeffneRueckfrage,
  schliesseRueckfrage,
  meldeLeistenFehler,
  verwirfLeistenMeldung,
  aktuelleRenderId
} from '../../src/renderer/queue-panel/leisten-montage'

describe('leisten-montage', () => {
  describe('LEERE_LEISTEN_LAGE', () => {
    it('is { aufgeklappt: false, rueckfrage: null, meldung: null }', () => {
      expect(LEERE_LEISTEN_LAGE).toEqual({
        aufgeklappt: false,
        rueckfrage: null,
        meldung: null
      })
    })
  })

  describe('schalteKlappzustand', () => {
    it('toggles aufgeklappt and leaves rueckfrage and meldung unchanged', () => {
      const rueckfrage: Rueckfrage = {
        auftragId: 'auftrag1',
        aktion: 'abbrechen',
        text: 'Test rückfrage'
      }
      
      const meldung = { code: 'test-code', meldung: 'Test meldung' }
      
      const eingeklapptMitRueckfrageUndMeldung: LeistenLage = {
        aufgeklappt: false,
        rueckfrage,
        meldung
      }
      
      const aufgeklapptMitRueckfrageUndMeldung: LeistenLage = {
        aufgeklappt: true,
        rueckfrage,
        meldung
      }

      // From eingeklappt to aufgeklappt
      expect(schalteKlappzustand(eingeklapptMitRueckfrageUndMeldung))
        .toEqual(aufgeklapptMitRueckfrageUndMeldung)
      
      // From aufgeklappt to eingeklappt
      expect(schalteKlappzustand(aufgeklapptMitRueckfrageUndMeldung))
        .toEqual(eingeklapptMitRueckfrageUndMeldung)
    })

    it('does not mutate the original object', () => {
      const original: LeistenLage = {
        aufgeklappt: false,
        rueckfrage: null,
        meldung: null
      }
      
      const kopie = { ...original }
      schalteKlappzustand(original)
      
      expect(original).toEqual(kopie)
    })
  })

  describe('oeffneRueckfrage', () => {
    it('sets rueckfrage and clears meldung', () => {
      const rueckfrage: Rueckfrage = {
        auftragId: 'auftrag1',
        aktion: 'abbrechen',
        text: 'Test rückfrage'
      }
      
      const eingabe: LeistenLage = {
        aufgeklappt: true,
        rueckfrage: null,
        meldung: { code: 'test-code', meldung: 'Test meldung' }
      }
      
      const erwartet: LeistenLage = {
        aufgeklappt: true,
        rueckfrage,
        meldung: null
      }
      
      expect(oeffneRueckfrage(eingabe, rueckfrage)).toEqual(erwartet)
    })

    it('does not mutate the original object', () => {
      const original: LeistenLage = {
        aufgeklappt: false,
        rueckfrage: null,
        meldung: null
      }
      
      const rueckfrage: Rueckfrage = {
        auftragId: 'auftrag1',
        aktion: 'abbrechen',
        text: 'Test rückfrage'
      }
      
      const kopie = { ...original }
      oeffneRueckfrage(original, rueckfrage)
      
      expect(original).toEqual(kopie)
    })
  })

  describe('schliesseRueckfrage', () => {
    it('clears rueckfrage and meldung', () => {
      const rueckfrage: Rueckfrage = {
        auftragId: 'auftrag1',
        aktion: 'abbrechen',
        text: 'Test rückfrage'
      }
      
      const eingabe: LeistenLage = {
        aufgeklappt: false,
        rueckfrage,
        meldung: { code: 'test-code', meldung: 'Test meldung' }
      }
      
      const erwartet: LeistenLage = {
        aufgeklappt: false,
        rueckfrage: null,
        meldung: null
      }
      
      expect(schliesseRueckfrage(eingabe)).toEqual(erwartet)
    })

    it('does not mutate the original object', () => {
      const original: LeistenLage = {
        aufgeklappt: false,
        rueckfrage: null,
        meldung: null
      }
      
      const kopie = { ...original }
      schliesseRueckfrage(original)
      
      expect(original).toEqual(kopie)
    })
  })

  describe('meldeLeistenFehler', () => {
    it('sets meldung and clears rueckfrage', () => {
      const eingabe: LeistenLage = {
        aufgeklappt: true,
        rueckfrage: {
          auftragId: 'auftrag1',
          aktion: 'abbrechen',
          text: 'Test rückfrage'
        },
        meldung: null
      }
      
      const code = 'test-code'
      const meldungText = 'Test meldung'
      
      const erwartet: LeistenLage = {
        aufgeklappt: true,
        rueckfrage: null,
        meldung: { code, meldung: meldungText }
      }
      
      expect(meldeLeistenFehler(eingabe, code, meldungText)).toEqual(erwartet)
    })

    it('replaces existing meldung with new one', () => {
      const eingabe: LeistenLage = {
        aufgeklappt: false,
        rueckfrage: null,
        meldung: { code: 'alter-code', meldung: 'Alte meldung' }
      }
      
      const code = 'neuer-code'
      const meldungText = 'Neue meldung'
      
      const erwartet: LeistenLage = {
        aufgeklappt: false,
        rueckfrage: null,
        meldung: { code, meldung: meldungText }
      }
      
      expect(meldeLeistenFehler(eingabe, code, meldungText)).toEqual(erwartet)
    })

    it('does not mutate the original object', () => {
      const original: LeistenLage = {
        aufgeklappt: false,
        rueckfrage: null,
        meldung: null
      }
      
      const kopie = { ...original }
      meldeLeistenFehler(original, 'test-code', 'test-meldung')
      
      expect(original).toEqual(kopie)
    })
  })

  describe('verwirfLeistenMeldung', () => {
    it('clears meldung and leaves rueckfrage unchanged', () => {
      const rueckfrage: Rueckfrage = {
        auftragId: 'auftrag1',
        aktion: 'abbrechen',
        text: 'Test rückfrage'
      }
      
      const eingabe: LeistenLage = {
        aufgeklappt: true,
        rueckfrage,
        meldung: { code: 'test-code', meldung: 'Test meldung' }
      }
      
      const erwartet: LeistenLage = {
        aufgeklappt: true,
        rueckfrage,
        meldung: null
      }
      
      expect(verwirfLeistenMeldung(eingabe)).toEqual(erwartet)
    })

    it('does not mutate the original object', () => {
      const original: LeistenLage = {
        aufgeklappt: false,
        rueckfrage: null,
        meldung: null
      }
      
      const kopie = { ...original }
      verwirfLeistenMeldung(original)
      
      expect(original).toEqual(kopie)
    })
  })

  describe('aktuelleRenderId', () => {
    it('returns null for unbekannter zustand', () => {
      const sicht: AuftragsSicht = { zustand: 'unbekannt' }
      expect(aktuelleRenderId(sicht)).toBeNull()
    })

    it('returns null for fehler zustand', () => {
      const sicht: AuftragsSicht = { 
        zustand: 'fehler', 
        code: 'test-code', 
        meldung: 'Test meldung' 
      }
      expect(aktuelleRenderId(sicht)).toBeNull()
    })

    it('returns null for empty auftraege array', () => {
      const sicht: AuftragsSicht = { 
        zustand: 'geladen', 
        auftraege: [] 
      }
      expect(aktuelleRenderId(sicht)).toBeNull()
    })

    it('returns null when no render auftrag is running', () => {
      const sicht: AuftragsSicht = { 
        zustand: 'geladen', 
        auftraege: [
          {
            auftragId: '1',
            art: 'import',
            status: 'laeuft',
            label: 'Test Import',
            payload: { /* import payload */ } as any,
            fortschritt: null,
            versuche: 0,
            fehler: null,
            ergebnis: null,
            erstelltAm: new Date().toISOString()
          }
        ] as Auftrag[]
      }
      expect(aktuelleRenderId(sicht)).toBeNull()
    })

    it('returns renderId of running render auftrag', () => {
      const renderAuftrag: Auftrag = {
        auftragId: 'render1',
        art: 'render',
        status: 'laeuft',
        label: 'Test Render',
        payload: { renderId: 'render-123', /* other render request fields */ } as RenderRequest,
        fortschritt: 50,
        versuche: 1,
        fehler: null,
        ergebnis: null,
        erstelltAm: new Date().toISOString()
      }
      
      const sicht: AuftragsSicht = { 
        zustand: 'geladen', 
        auftraege: [renderAuftrag] 
      }
      
      expect(aktuelleRenderId(sicht)).toBe('render-123')
    })

    it('returns null when render auftrag exists but is not running', () => {
      const renderAuftrag: Auftrag = {
        auftragId: 'render1',
        art: 'render',
        status: 'erfolg', // not running
        label: 'Test Render',
        payload: { renderId: 'render-123', /* other render request fields */ } as RenderRequest,
        fortschritt: 100,
        versuche: 1,
        fehler: null,
        ergebnis: null,
        erstelltAm: new Date().toISOString()
      }
      
      const sicht: AuftragsSicht = { 
        zustand: 'geladen', 
        auftraege: [renderAuftrag] 
      }
      
      expect(aktuelleRenderId(sicht)).toBeNull()
    })

    it('returns the renderId of the first running render auftrag when multiple exist', () => {
      const renderAuftrag1: Auftrag = {
        auftragId: 'render1',
        art: 'render',
        status: 'laeuft',
        label: 'Test Render 1',
        payload: { renderId: 'render-123', /* other render request fields */ } as RenderRequest,
        fortschritt: 30,
        versuche: 1,
        fehler: null,
        ergebnis: null,
        erstelltAm: new Date().toISOString()
      }
      
      const renderAuftrag2: Auftrag = {
        auftragId: 'render2',
        art: 'render',
        status: 'laeuft',
        label: 'Test Render 2',
        payload: { renderId: 'render-456', /* other render request fields */ } as RenderRequest,
        fortschritt: 60,
        versuche: 1,
        fehler: null,
        ergebnis: null,
        erstelltAm: new Date().toISOString()
      }
      
      const sicht: AuftragsSicht = { 
        zustand: 'geladen', 
        auftraege: [renderAuftrag1, renderAuftrag2] 
      }
      
      // Should return the first one found (renderAuftrag1)
      expect(aktuelleRenderId(sicht)).toBe('render-123')
    })

    it('does not mutate the original object', () => {
      const original: AuftragsSicht = { zustand: 'unbekannt' }
      const kopie = { ...original }
      aktuelleRenderId(original)
      expect(original).toEqual(kopie)
    })
  })
})