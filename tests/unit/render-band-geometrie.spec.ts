// Verhaltenstests zu #176 - `bestimmeBandgeometrie` im render-service.
//
// WAS HIER GEPRUEFT WIRD UND WAS NICHT: Seit TK v3.31 ist diese Datei NUR noch der
// Torwaechter ueber die Bandhoehe. Sie rechnet keine Geometrie mehr (der Split-Screen
// ist gestrichen, `berechneBandGeometrie` mit ihm entfallen) und gibt deshalb bei
// Erfolg `undefined` zurueck. Geprueft werden drei Dinge: (1) welche Hoehen
// abgewiesen werden, (2) dass die Meldungen unveraendert bleiben (Issue #450),
// (3) dass die Obergrenze ein Datenwert aus RENDER_PROFILE ist.
//
// DIE FRUEHER HIER STEHENDE SONDERREGEL H = 1078 IST ENTFALLEN: Sie verhinderte,
// dass im SPLIT eine Videobreite von 0 uebrig blieb. Das Video ist jetzt immer
// vollflaechig 1920 x 1080, das Band liegt deckend darueber - 1078 ist zulaessig.
import { describe, expect, it, vi } from 'vitest'

import { bestimmeBandgeometrie } from '../../src/main/render-service/band-geometrie'
import { RENDER_PROFILE } from '../../src/shared/contracts/render-profile'

/** Fehlercode und Meldung eines abgewiesenen Ergebnisses. */
function fehler(ergebnis: ReturnType<typeof bestimmeBandgeometrie>): {
  code: string
  meldung: string
  daten?: unknown
} {
  if (ergebnis.ok) throw new Error('Fehlschlag erwartet, bekam ein ok:true')
  return ergebnis.fehler
}

describe('Erfolgsfall: die Hoehe ist brauchbar, mehr gibt es nicht zu liefern', () => {
  it('nimmt die eingebaute Bandhoehe 162 an - ohne Wert', () => {
    const ergebnis = bestimmeBandgeometrie({ höhe: 162 })
    expect(ergebnis).toEqual({ ok: true, wert: undefined })
  })

  it('nimmt 1076 UND 1078 an - die Mindest-Videobreite des Splits gibt es nicht mehr', () => {
    for (const höhe of [1076, 1078]) {
      expect(bestimmeBandgeometrie({ höhe })).toEqual({ ok: true, wert: undefined })
    }
  })

  it('nimmt jede gerade Hoehe von 2 bis 1078 an', () => {
    for (let höhe = 2; höhe < RENDER_PROFILE.hoehe; höhe += 2) {
      expect(bestimmeBandgeometrie({ höhe }).ok, String(höhe)).toBe(true)
    }
  })
})

describe('Abgewiesene Eingaben - alle mit ungueltiges_element, ohne daten', () => {
  const abgewiesen: Array<[string, unknown]> = [
    ['einblendung null', null],
    ['einblendung undefined', undefined],
    ['einblendung kein Objekt', 'band/162'],
    ['höhe fehlt', {}],
    ['höhe kein number', { höhe: '162' }],
    ['höhe NaN', { höhe: Number.NaN }],
    ['höhe Infinity', { höhe: Number.POSITIVE_INFINITY }],
    ['höhe 100.5', { höhe: 100.5 }],
    ['höhe 0', { höhe: 0 }],
    ['höhe -2', { höhe: -2 }],
    ['höhe 1080 (= Bildhoehe)', { höhe: 1080 }],
    ['höhe 1082 (> Bildhoehe)', { höhe: 1082 }],
    ['höhe 163 (ungerade)', { höhe: 163 }],
    ['höhe 1079 (ungerade, dicht an der Grenze)', { höhe: 1079 }],
  ]

  for (const [name, eingabe] of abgewiesen) {
    it(`weist ab: ${name}`, () => {
      // Die Werte werden ueber einen Cast untergeschoben, weil der Typ sie nicht
      // zulaesst - genau das belegt, dass zur LAUFZEIT geprueft wird
      // („Der Main validiert jede eingehende Nutzlast", TK 9.1.1 Punkt 6).
      const ergebnis = bestimmeBandgeometrie(eingabe as unknown as { höhe: number })
      expect(fehler(ergebnis).code).toBe('ungueltiges_element')
      expect(fehler(ergebnis).daten).toBeUndefined()
      expect('daten' in fehler(ergebnis)).toBe(false)
    })
  }

  it('nennt bei ungerader Hoehe den Grund und die naechstliegende gerade Hoehe', () => {
    const meldung = fehler(bestimmeBandgeometrie({ höhe: 163 })).meldung
    expect(meldung).toMatch(/gerade/i)
    expect(meldung).toMatch(/yuv420p/)
    expect(meldung).toContain('162')
  })

  it('rundet eine ungerade Hoehe NICHT auf eine gerade - sie wird abgewiesen', () => {
    // Keine Ausweich-Geometrie: Das Band-PNG ist bereits in 1920 x H gezeichnet;
    // jede Rettung erzwaenge eine Skalierung und machte den Text unscharf.
    expect(bestimmeBandgeometrie({ höhe: 163 }).ok).toBe(false)
  })
})

describe('Profilbezug', () => {
  it('nimmt die obere Grenze aus RENDER_PROFILE.hoehe - ein abgewandeltes Profil verschiebt sie mit', async () => {
    vi.resetModules()
    vi.doMock('../../src/shared/contracts/render-profile', () => ({
      RENDER_PROFILE: { ...RENDER_PROFILE, hoehe: 500 } as unknown as typeof RENDER_PROFILE,
    }))
    const { bestimmeBandgeometrie: mitKleinemProfil } = await import(
      '../../src/main/render-service/band-geometrie'
    )

    // 600 ist unter dem echten Profil (1080) gueltig ...
    expect(bestimmeBandgeometrie({ höhe: 600 }).ok).toBe(true)
    // ... und unter dem abgewandelten (500) nicht mehr. Dieselbe Eingabe, anderes
    // Ergebnis: die Grenze ist nachweislich ein Datenwert, kein Literal 1080.
    expect(mitKleinemProfil({ höhe: 600 }).ok).toBe(false)
    expect(mitKleinemProfil({ höhe: 498 }).ok).toBe(true)

    vi.doUnmock('../../src/shared/contracts/render-profile')
    vi.resetModules()
  })
})
