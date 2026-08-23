// Verhaltenstests zu #315 - logo-laden.ts auf Marken je Aktion umgestellt.
//
// Ohne Browser: `Image` wird durch einen globalen Doppelgänger ersetzt, der die
// gesetzte `src` aufzeichnet und dessen `decode()` sich je Test steuern lässt
// (auflösen oder ablehnen). `URL.createObjectURL`/`revokeObjectURL` sind mit
// Aufruf-Zählern gestubbelt - der Beleg, dass der Stub griff, ist der Zähler.
// Für den Zweig 'importiert' ist auch `fetch` gestubbelt (Bytes über marken://).

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Marke } from '../../src/shared/contracts/marke'
import {
  bereiteLogoVor,
  holeLogo,
  leereLogoBestand,
} from '../../src/renderer/template-canvas/logo-laden'

// ---------------------------------------------------------------------------
// Image-Doppelgänger: globaler Konstruktor, decode() steuerbar, src aufgezeichnet.
// ---------------------------------------------------------------------------

class BildDoppel {
  static erzeugt = 0
  static quellen: string[] = []
  /** Steuert das Verhalten des NÄCHSTEN decode(): 'ok' oder 'ablehnen'. */
  static decodeVerhalten: 'ok' | 'ablehnen' = 'ok'
  static naturalWidth = 420
  static naturalHeight = 120

  src = ''
  decode(): Promise<void> {
    if (BildDoppel.decodeVerhalten === 'ablehnen') {
      return Promise.reject(new Error('decode fehlgeschlagen'))
    }
    return Promise.resolve()
  }

  constructor() {
    BildDoppel.erzeugt += 1
    Object.defineProperty(this, 'src', {
      set(ziel: string) {
        this._quellwert = ziel
        BildDoppel.quellen.push(ziel)
      },
      get() {
        return this._quellwert
      },
    })
    this.naturalWidth = BildDoppel.naturalWidth
    this.naturalHeight = BildDoppel.naturalHeight
  }

  _quellwert = ''
  naturalWidth = 0
  naturalHeight = 0
}

// ---------------------------------------------------------------------------
// URL-Stubs mit Aufruf-Nachweis und fetch-Doppel für marken://-Bytes.
// ---------------------------------------------------------------------------

let createObjectURLAufrufe = 0
let revokeObjectURLAufrufe = 0
const erzeugteObjektUrls: string[] = []

vi.stubGlobal('Image', BildDoppel)
vi.stubGlobal('URL', {
  ...URL,
  createObjectURL: (_blob: Blob) => {
    createObjectURLAufrufe += 1
    const url = `blob:objekt-url-nr-${createObjectURLAufrufe}`
    erzeugteObjektUrls.push(url)
    return url
  },
  revokeObjectURL: (url: string) => {
    revokeObjectURLAufrufe += 1
    expect(erzeugteObjektUrls).toContain(url)
  },
})

let fetchAntwortBlob: Blob | null = null
let fetchAdressen: string[] = []
vi.stubGlobal('fetch', async (adresse: string | URL) => {
  fetchAdressen.push(String(adresse))
  if (fetchAntwortBlob === null) {
    throw new Error('Datei hinter marken:// nicht gefunden')
  }
  return { blob: async () => fetchAntwortBlob } as unknown as Response
})

// ---------------------------------------------------------------------------

function markeMitLogo(
  id: string,
  herkunft: 'gebuendelt' | 'importiert',
  // Gebündelt nur unter dem ECHTEN Registry-Namen sinnvoll - jeder andere Name
  // liefert laut Vertrag zu Recht { zustand: 'fehlt' } (Datei fehlt im Bundle).
  datei = herkunft === 'gebuendelt' ? 'logo-fitnessworld24.png' : 'logo.png',
): Marke {
  return {
    id,
    name: `Marke ${id}`,
    logo: { datei, herkunft, seitenverhaeltnis: 3.5 },
  } as Marke
}

function krummeId(n: number): string {
  // bewusst krumme UUID-artige Werte (Determinismus, keine glatten Zufallstreffer)
  return `a${n}7e4c2f-91b3-4d8e-b201-${String(n).padStart(12, '3')}`
}

describe('logo-laden (#315)', () => {
  beforeEach(() => {
    BildDoppel.erzeugt = 0
    BildDoppel.quellen = []
    BildDoppel.decodeVerhalten = 'ok'
    BildDoppel.naturalWidth = 420
    BildDoppel.naturalHeight = 120
    createObjectURLAufrufe = 0
    revokeObjectURLAufrufe = 0
    erzeugteObjektUrls.length = 0
    fetchAntwortBlob = new Blob(['bytes'])
    fetchAdressen = []
    leereLogoBestand()
  })

  afterEach(() => {
    leereLogoBestand()
  })

  describe('holeLogo ist eine reine Abfrage', () => {
    it('liefert { zustand: "fehlt" } vor jeder Vorbereitung und wirft nie – auch nicht bei leerer ID', () => {
      const vorab = BildDoppel.erzeugt
      expect(() => holeLogo('')).not.toThrow()
      expect(holeLogo('')).toEqual({ zustand: 'fehlt' })
      expect(holeLogo(krummeId(1))).toEqual({ zustand: 'fehlt' })
      expect(BildDoppel.erzeugt).toBe(vorab) // nachweislich kein Image erzeugt
    })
  })

  describe('Bestand je markeId', () => {
    it('zwei Marken bekommen eigene, unterscheidbare Bilder', async () => {
      const a = krummeId(1)
      const b = krummeId(2)
      await bereiteLogoVor(markeMitLogo(a, 'gebuendelt'))
      expect(holeLogo(a).zustand).toBe('geladen')
      expect(holeLogo(b)).toEqual({ zustand: 'fehlt' })

      BildDoppel.naturalWidth = 777
      await bereiteLogoVor(markeMitLogo(b, 'gebuendelt'))
      const motivA = holeLogo(a)
      const motivB = holeLogo(b)
      expect(motivA.zustand).toBe('geladen')
      expect(motivB.zustand).toBe('geladen')
      expect(motivA).not.toBe(motivB)
      if (motivA.zustand === 'geladen' && motivB.zustand === 'geladen') {
        expect(motivA.breite).toBe(420)
        expect(motivB.breite).toBe(777)
      }
    })

    it('breite/höhe stammen aus naturalWidth/naturalHeight', async () => {
      BildDoppel.naturalWidth = 1234
      BildDoppel.naturalHeight = 567
      const id = krummeId(9)
      await bereiteLogoVor(markeMitLogo(id, 'gebuendelt'))
      const motiv = holeLogo(id)
      expect(motiv).toMatchObject({ zustand: 'geladen', breite: 1234, höhe: 567 })
    })
  })

  describe('Verzweigung nach herkunft', () => {
    it("'importiert': Bytes über marken:// als Blob-URL im <img> (Nachtrag II), revoke nach dem decode", async () => {
      const id = krummeId(3)
      const datei = 'firmen-logo.png'
      await bereiteLogoVor(markeMitLogo(id, 'importiert', datei))

      // Bytes wurden über marken:// beschafft (Speicherort-vertrag bleibt)
      expect(fetchAdressen).toEqual([`marken://${id}/${datei}`])
      // Stub griff nachweislich: genau ein createObjectURL …
      expect(createObjectURLAufrufe).toBe(1)
      // … und genau diese Blob-URL stand im <img>, zeichengleich gebildet
      expect(BildDoppel.quellen).toEqual([erzeugteObjektUrls[0]])
      expect(BildDoppel.quellen[0]).toMatch(/^blob:/)
      // … und sie wurde nach dem decode widerrufen
      expect(revokeObjectURLAufrufe).toBe(1)

      expect(holeLogo(id).zustand).toBe('geladen')
    })

    it("'gebuendelt': src aus der Registry, ohne marken:// und ohne media://", async () => {
      const id = krummeId(4)
      const datei = 'logo-fitnessworld24.png'
      await bereiteLogoVor(markeMitLogo(id, 'gebuendelt', datei))
      expect(createObjectURLAufrufe).toBe(0)
      expect(BildDoppel.quellen).toHaveLength(1)
      const quelle = BildDoppel.quellen[0]
      expect(quelle).not.toContain('marken://')
      expect(quelle).not.toContain('media://')
      expect(quelle).toContain(datei)
      expect(holeLogo(id).zustand).toBe('geladen')
    })

    it("unbekannter herkunft-Wert führt zu 'fehlt', null Images, keinem Wurf", async () => {
      const id = krummeId(5)
      const fremd = { ...markeMitLogo(id, 'importiert'), logo: { datei: 'x.png', herkunft: 'fremd', seitenverhaeltnis: 1 } } as unknown as Marke
      await expect(bereiteLogoVor(fremd)).resolves.toBeUndefined()
      expect(BildDoppel.erzeugt).toBe(0)
      expect(holeLogo(id)).toEqual({ zustand: 'fehlt' })
    })

    it("'importiert' mit fehlender Datei: normal aufgelöst, 'fehlt' im Bestand", async () => {
      const id = krummeId(6)
      fetchAntwortBlob = null // fetch wirft -> Ladefehler
      await expect(bereiteLogoVor(markeMitLogo(id, 'importiert'))).resolves.toBeUndefined()
      expect(holeLogo(id)).toEqual({ zustand: 'fehlt' })
      expect(createObjectURLAufrufe).toBe(0)
    })

    it("nicht dekodierbare Bytes ('gebuendelt'): decode lehnt ab -> 'fehlt'", async () => {
      const id = krummeId(7)
      BildDoppel.decodeVerhalten = 'ablehnen'
      await expect(bereiteLogoVor(markeMitLogo(id, 'gebuendelt'))).resolves.toBeUndefined()
      expect(holeLogo(id)).toEqual({ zustand: 'fehlt' })
    })
  })

  describe('logo === null ist regulärer Zustand (TK 9.10.10)', () => {
    it('kehrt sofort folgenlos zurück: kein Image, kein Eintrag, kein Wurf', async () => {
      const id = krummeId(8)
      const partnerMarke: Marke = { id, name: 'Partner', logo: null } as Marke
      await expect(bereiteLogoVor(partnerMarke)).resolves.toBeUndefined()
      expect(BildDoppel.erzeugt).toBe(0)
      expect(holeLogo(id)).toEqual({ zustand: 'fehlt' })
    })

    it('räumt nichts weg: geladenes Logo bleibt bestehen (ENTSCHIEDEN 5)', async () => {
      const id = krummeId(10)
      await bereiteLogoVor(markeMitLogo(id, 'gebuendelt'))
      expect(holeLogo(id).zustand).toBe('geladen')
      await bereiteLogoVor({ ...markeMitLogo(id, 'gebuendelt'), logo: null } as Marke)
      expect(holeLogo(id).zustand).toBe('geladen') // weiterhin da
    })
  })

  describe('Programmierfehler werfen', () => {
    it('fehlende Marke wirft', async () => {
      await expect(bereiteLogoVor(null as unknown as Marke)).rejects.toThrow()
    })
    it('leere marke.id wirft', async () => {
      await expect(bereiteLogoVor({ id: '   ', name: 'x', logo: null } as Marke)).rejects.toThrow(/id/)
    })
    it("logo !== null mit leerem datei wirft", async () => {
      await expect(bereiteLogoVor(markeMitLogo(krummeId(11), 'importiert', '   '))).rejects.toThrow(/datei/)
    })
  })

  describe('Determinismus (TK 9.10.3)', () => {
    it('zehnmal parallel UND zehnmal nacheinander mit derselben markeId: genau EIN Image', async () => {
      const id = krummeId(12)
      const marke = markeMitLogo(id, 'gebuendelt')
      await Promise.all(Array.from({ length: 10 }, () => bereiteLogoVor(marke)))
      expect(BildDoppel.erzeugt).toBe(1)
      for (let i = 0; i < 10; i++) {
        await bereiteLogoVor(marke)
      }
      expect(BildDoppel.erzeugt).toBe(1)
      expect(holeLogo(id).zustand).toBe('geladen')
    })

    it('zwei verschiedene markeIds parallel: genau zwei Images, getrennt im Bestand', async () => {
      const a = krummeId(13)
      const b = krummeId(14)
      await Promise.all([
        bereiteLogoVor(markeMitLogo(a, 'gebuendelt')),
        bereiteLogoVor(markeMitLogo(b, 'importiert')),
      ])
      expect(BildDoppel.erzeugt).toBe(2)
      expect(holeLogo(a).zustand).toBe('geladen')
      expect(holeLogo(b).zustand).toBe('geladen')
      expect(fetchAdressen).toEqual([`marken://${b}/logo.png`])
    })

    it('Fehlschlag wird nicht gemerkt: der nächste Aufruf startet einen neuen Versuch', async () => {
      const id = krummeId(15)
      BildDoppel.decodeVerhalten = 'ablehnen'
      await bereiteLogoVor(markeMitLogo(id, 'gebuendelt'))
      expect(holeLogo(id)).toEqual({ zustand: 'fehlt' })

      BildDoppel.decodeVerhalten = 'ok'
      await bereiteLogoVor(markeMitLogo(id, 'gebuendelt'))
      expect(holeLogo(id).zustand).toBe('geladen')
      expect(BildDoppel.erzeugt).toBe(2) // zweiter Ladeversuch
    })
  })

  describe('leereLogoBestand()', () => {
    it('setzt den Bestand vollständig zurück; erneutes Vorbereiten lädt neu; doppelter Aufruf wirkungsgleich', async () => {
      const a = krummeId(16)
      const b = krummeId(17)
      await bereiteLogoVor(markeMitLogo(a, 'gebuendelt'))
      await bereiteLogoVor(markeMitLogo(b, 'importiert'))
      expect(BildDoppel.erzeugt).toBe(2)

      leereLogoBestand()
      expect(holeLogo(a)).toEqual({ zustand: 'fehlt' })
      expect(holeLogo(b)).toEqual({ zustand: 'fehlt' })

      expect(() => leereLogoBestand()).not.toThrow()

      await bereiteLogoVor(markeMitLogo(a, 'gebuendelt'))
      await bereiteLogoVor(markeMitLogo(b, 'importiert'))
      expect(BildDoppel.erzeugt).toBe(4) // beide neu geladen
    })
  })
})
