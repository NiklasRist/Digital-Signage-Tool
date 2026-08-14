// Verhaltenstests zu #176 - `bestimmeBandgeometrie` im render-service.
//
// WAS HIER GEPRUEFT WIRD UND WAS NICHT: Die Datei unter Test RECHNET SEIT TK v3.1
// NICHTS. Sie prueft `art` und `höhe`, ruft `berechneBandGeometrie` aus dem
// GETEILTEN Bereich und reicht deren Ergebnis unveraendert durch. Geprueft werden
// daher genau drei Dinge: (1) welche Eingaben abgewiesen werden, (2) dass die
// geteilte Funktion erst NACH allen Pruefungen und genau einmal mit
// `einblendung.höhe` gerufen wird, (3) dass ihr Ergebnis unangetastet
// zurueckkommt.
//
// WARUM DIE GETEILTE FUNKTION GEMOCKT IST - UND WARUM DAS HIER RICHTIG IST:
// `src/shared/band-geometrie.ts` gehoert zu Issue #239 und hat HEUTE NOCH EINEN
// WERFENDEN RUMPF. Ein "Durchreich-Nachweis mit der echten Funktion" ist damit
// nicht ausfuehrbar (s. den uebersprungenen Test am Ende). Ersatzweise liefert das
// Doppel eine NACHBILDUNG der Vorschrift aus TK 9.2.8; die Definition of Done
// erlaubt die Formel ausdruecklich in der Testdatei. Damit die Nachbildung nicht
// selbst zur zweiten Wahrheit wird, prueft der ERSTE Test sie gegen von Hand
// nachgerechnete Zahlen.
//
// DIE FALLE, gegen die dieser Testsatz gebaut ist: Die eingebaute Band-Vorlage
// (H = 162) geht als EINZIGE zufaellig auf - 918 x 16/9 = 1632 exakt, bereits
// durch 4 teilbar, Versatz 144. Ein Fehler in der Rundung waere an ihr UNSICHTBAR.
// Deshalb stehen ueberall Hoehen daneben, die nicht aufgehen (200, 204, 1076,
// 1078) und Hoehen, bei denen 1080 - H nicht durch 18 teilbar ist.
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { bestimmeBandgeometrie } from '../../src/main/render-service/band-geometrie'
import { RENDER_PROFILE } from '../../src/shared/contracts/render-profile'

import type { BandGeometrie } from '../../src/shared/band-geometrie'

const doppel = vi.hoisted(() => {
  /**
   * Nachbildung der Rechenvorschrift aus TK 9.2.8 (Umsetzung: #239).
   * Steht bewusst NUR hier - in der Datei unter Test darf sie seit TK v3.1 nicht
   * mehr vorkommen. Gegen von Hand nachgerechnete Zahlen geprueft (erster Test).
   */
  const referenz = (höhe: number): BandGeometrie => {
    const videoBereichHöhe = 1080 - höhe
    const videoBreite = Math.floor((videoBereichHöhe * 4) / 9) * 4
    return {
      videoBereichBreite: 1920,
      videoBereichHöhe,
      videoBreite,
      videoHöhe: videoBereichHöhe,
      videoVersatzX: (1920 - videoBreite) / 2,
      videoVersatzY: 0,
      bandY: videoBereichHöhe,
    }
  }

  return {
    referenz,
    /** Je Aufruf der geteilten Funktion ein Eintrag mit dem uebergebenen Argument. */
    aufrufe: [] as number[],
    /** Erzwungene Antwort; `null` = Nachbildung rechnen lassen. */
    antwort: null as BandGeometrie | null,
    /** Erzwungene Ausnahme der geteilten Funktion. */
    wirft: null as Error | null,
  }
})

vi.mock('../../src/shared/band-geometrie', () => ({
  berechneBandGeometrie: (höhe: number): BandGeometrie => {
    doppel.aufrufe.push(höhe)
    if (doppel.wirft !== null) throw doppel.wirft
    return doppel.antwort ?? doppel.referenz(höhe)
  },
}))

beforeEach(() => {
  doppel.aufrufe = []
  doppel.antwort = null
  doppel.wirft = null
})

/** Bequemer Zugriff auf den Erfolgswert - schlaegt fehl statt still `undefined` zu liefern. */
function wert(
  ergebnis: ReturnType<typeof bestimmeBandgeometrie>,
): BandGeometrie {
  if (!ergebnis.ok) {
    throw new Error(`Erfolg erwartet, bekam ${ergebnis.fehler.code}: ${ergebnis.fehler.meldung}`)
  }
  return ergebnis.wert
}

/** Fehlercode und Meldung eines abgewiesenen Ergebnisses. */
function fehler(ergebnis: ReturnType<typeof bestimmeBandgeometrie>): {
  code: string
  meldung: string
  daten?: unknown
} {
  if (ergebnis.ok) throw new Error('Fehlschlag erwartet, bekam ein ok:true')
  return ergebnis.fehler
}

// Von HAND nachgerechnet, nicht aus der Nachbildung abgeschrieben:
//   videoBereichHöhe = 1080 - H
//   videoBreite      = groesstes Vielfaches von 4, das <= videoBereichHöhe * 16/9 ist
//   videoVersatzX    = (1920 - videoBreite) / 2
const NACHGERECHNET = [
  // 918 * 16/9 = 1632,0  -> 1632 (bereits durch 4 teilbar; die eingebaute Vorlage)
  { höhe: 162, bereichHöhe: 918, breite: 1632, versatzX: 144 },
  // 880 * 16/9 = 1564,44 -> 1564
  { höhe: 200, bereichHöhe: 880, breite: 1564, versatzX: 178 },
  // 876 * 16/9 = 1557,33 -> blosses Abschneiden gaebe 1557 und x = 181,5; die
  //                         Vierer-Abrundung gibt 1556 und x = 182
  { höhe: 204, bereichHöhe: 876, breite: 1556, versatzX: 182 },
  //  80 * 16/9 =  142,22 -> 140 (gestalterisch unsinnig, technisch zulaessig)
  { höhe: 1000, bereichHöhe: 80, breite: 140, versatzX: 890 },
  //   4 * 16/9 =    7,11 -> 4 (kleinste noch gueltige Breite)
  { höhe: 1076, bereichHöhe: 4, breite: 4, versatzX: 958 },
  //   2 * 16/9 =    3,55 -> 0 (kein Bild mehr - bei `split` unzulaessig)
  { höhe: 1078, bereichHöhe: 2, breite: 0, versatzX: 960 },
] as const

describe('Nachbildung der geteilten Rechnung (Pruefgrundlage dieses Testsatzes)', () => {
  it('trifft die von Hand nachgerechneten Zahlen', () => {
    for (const fall of NACHGERECHNET) {
      const geo = doppel.referenz(fall.höhe)
      expect({
        höhe: fall.höhe,
        bereichHöhe: geo.videoBereichHöhe,
        breite: geo.videoBreite,
        versatzX: geo.videoVersatzX,
      }).toEqual({
        höhe: fall.höhe,
        bereichHöhe: fall.bereichHöhe,
        breite: fall.breite,
        versatzX: fall.versatzX,
      })
    }
  })

  it('liefert fuer jede gerade Hoehe eine durch 4 teilbare Breite und einen GERADEN Versatz', () => {
    // Die eigentliche Begruendung der Vierer-Abrundung (TK 9.2.8): yuv420p
    // verlangt gerade Breite UND geraden x-Versatz. Geprueft ueber den ganzen
    // zulaessigen Bereich, nicht an einem Beispiel.
    for (let höhe = 2; höhe < RENDER_PROFILE.hoehe; höhe += 2) {
      const geo = doppel.referenz(höhe)
      expect(geo.videoBreite % 4).toBe(0)
      expect(geo.videoVersatzX % 2).toBe(0)
      expect(Number.isInteger(geo.videoVersatzX)).toBe(true)
      // Aufrunden ist verboten - es braeche „contain ohne Beschnitt".
      expect(geo.videoBreite).toBeLessThanOrEqual((geo.videoBereichHöhe * 16) / 9)
    }
  })
})

describe('Erfolgsfall: die Geometrie wird unveraendert durchgereicht', () => {
  it('liefert bei { split, 162 } die sieben Werte aus TK 9.2.8', () => {
    const geo = wert(bestimmeBandgeometrie({ art: 'split', höhe: 162 }))
    expect(geo).toEqual({
      videoBereichBreite: 1920,
      videoBereichHöhe: 918,
      videoBreite: 1632,
      videoHöhe: 918,
      videoVersatzX: 144,
      videoVersatzY: 0,
      bandY: 918,
    })
  })

  it('liefert bei { einblendung, 162 } DIESELBEN sieben Werte - die Rechnung kennt die Art nicht', () => {
    const split = wert(bestimmeBandgeometrie({ art: 'split', höhe: 162 }))
    const einblendung = wert(bestimmeBandgeometrie({ art: 'einblendung', höhe: 162 }))
    expect(einblendung).toEqual(split)
    // Bedeutungstragend ist bei `einblendung` allein `bandY`: Das Video bleibt
    // vollflaechig 1920 x 1080, das Band wird bei y = 1080 - H ueberlagert.
    // Die uebrigen sechs Felder gelten dort NICHT und duerfen nicht benutzt werden.
    expect(einblendung.bandY).toBe(918)
  })

  it('gibt GENAU das Objekt der geteilten Funktion zurueck - kein Feld ergaenzt, keines umbenannt', () => {
    // Marker-Geometrie: absichtlich unmoegliche Zahlen. Kaeme irgendein Wert aus
    // einer eigenen Rechnung dieser Datei, stuende hier eine andere Zahl.
    const marker: BandGeometrie = {
      videoBereichBreite: 11,
      videoBereichHöhe: 22,
      videoBreite: 33,
      videoHöhe: 44,
      videoVersatzX: 55,
      videoVersatzY: 66,
      bandY: 77,
    }
    doppel.antwort = marker

    const geo = wert(bestimmeBandgeometrie({ art: 'split', höhe: 162 }))
    expect(geo).toBe(marker)
    expect(geo).toEqual(marker)
    expect(Object.keys(geo).sort()).toEqual([
      'bandY',
      'videoBereichBreite',
      'videoBereichHöhe',
      'videoBreite',
      'videoHöhe',
      'videoVersatzX',
      'videoVersatzY',
    ])
  })

  it('ruft die geteilte Funktion genau einmal und genau mit einblendung.höhe', () => {
    bestimmeBandgeometrie({ art: 'split', höhe: 204 })
    expect(doppel.aufrufe).toEqual([204])
  })

  it('reicht die Rundungswerte fuer Hoehen durch, die NICHT aufgehen', () => {
    // 200 und 204 sind die Faelle, an denen sich ein Rundungsfehler zeigen wuerde -
    // bei 162 waere er unsichtbar.
    const zweihundert = wert(bestimmeBandgeometrie({ art: 'split', höhe: 200 }))
    expect(zweihundert.videoBreite).toBe(1564)
    expect(zweihundert.videoVersatzX).toBe(178)

    const zweihundertvier = wert(bestimmeBandgeometrie({ art: 'split', höhe: 204 }))
    expect(zweihundertvier.videoBreite).toBe(1556)
    expect(zweihundertvier.videoVersatzX).toBe(182)
  })

  it('haelt fuer jede zulaessige gerade Hoehe bandY + höhe === RENDER_PROFILE.hoehe', () => {
    for (let höhe = 2; höhe <= 1076; höhe += 2) {
      const ergebnis = bestimmeBandgeometrie({ art: 'split', höhe })
      expect(wert(ergebnis).bandY + höhe).toBe(RENDER_PROFILE.hoehe)
    }
  })
})

describe('Grenzfall: bei `split` bleibt kein Bild mehr uebrig (ENTSCHIEDEN 6)', () => {
  it('weist höhe 1078 bei art split ab', () => {
    // 1080 - 1078 = 2 Pixel Videoflaeche; 2 x 16/9 = 3,55…, groesstes Vielfaches
    // von 4 darunter ist 0. Eine Breite von 0 ist kein Bild.
    expect(fehler(bestimmeBandgeometrie({ art: 'split', höhe: 1078 })).code).toBe(
      'ungueltiges_element',
    )
  })

  it('laesst höhe 1078 bei art einblendung ZU und liefert bandY 2', () => {
    // Dort bleibt das Video vollflaechig; die eingepasste Breite wird gar nicht
    // benutzt. Eine Abweisung waere eine erfundene Regel.
    expect(wert(bestimmeBandgeometrie({ art: 'einblendung', höhe: 1078 })).bandY).toBe(2)
  })

  it('laesst höhe 1076 bei art split ZU und liefert videoBreite 4', () => {
    expect(wert(bestimmeBandgeometrie({ art: 'split', höhe: 1076 })).videoBreite).toBe(4)
  })

  it('klemmt nicht: eine gelieferte Breite von 0 wird abgewiesen, nicht auf 4 hochgezogen', () => {
    doppel.antwort = { ...doppel.referenz(1078) }
    const ergebnis = bestimmeBandgeometrie({ art: 'split', höhe: 1078 })
    expect(ergebnis.ok).toBe(false)
    expect(doppel.antwort.videoBreite).toBe(0)
  })
})

describe('Abgewiesene Eingaben - alle mit ungueltiges_element, ohne daten', () => {
  const abgewiesen: Array<[string, unknown]> = [
    ['einblendung null', null],
    ['einblendung undefined', undefined],
    ['einblendung kein Objekt', 'split/162'],
    ['art vollflaeche', { art: 'vollflaeche', höhe: 162 }],
    ['art leer', { art: '', höhe: 162 }],
    ['art kein String', { art: 7, höhe: 162 }],
    ['art fehlt', { höhe: 162 }],
    ['höhe kein number', { art: 'split', höhe: '162' }],
    ['höhe NaN', { art: 'split', höhe: Number.NaN }],
    ['höhe Infinity', { art: 'split', höhe: Number.POSITIVE_INFINITY }],
    ['höhe 100.5', { art: 'split', höhe: 100.5 }],
    ['höhe 0', { art: 'split', höhe: 0 }],
    ['höhe -2', { art: 'split', höhe: -2 }],
    ['höhe 1080 (= Bildhoehe)', { art: 'split', höhe: 1080 }],
    ['höhe 1082 (> Bildhoehe)', { art: 'split', höhe: 1082 }],
    ['höhe 163 (ungerade)', { art: 'split', höhe: 163 }],
    ['höhe 1079 (ungerade, dicht an der Grenze)', { art: 'split', höhe: 1079 }],
  ]

  for (const [name, eingabe] of abgewiesen) {
    it(`weist ab: ${name}`, () => {
      // Die Werte werden ueber einen Cast untergeschoben, weil der Typ sie nicht
      // zulaesst - genau das belegt, dass zur LAUFZEIT geprueft wird
      // („Der Main validiert jede eingehende Nutzlast", TK 9.1.1 Punkt 6).
      const ergebnis = bestimmeBandgeometrie(
        eingabe as unknown as { art: 'split' | 'einblendung'; höhe: number },
      )
      expect(fehler(ergebnis).code).toBe('ungueltiges_element')
      expect(fehler(ergebnis).daten).toBeUndefined()
      expect('daten' in fehler(ergebnis)).toBe(false)
    })

    it(`ruft die geteilte Rechnung NICHT: ${name}`, () => {
      bestimmeBandgeometrie(
        eingabe as unknown as { art: 'split' | 'einblendung'; höhe: number },
      )
      expect(doppel.aufrufe).toEqual([])
    })
  }

  it('nennt bei ungerader Hoehe den Grund und die naechstliegende gerade Hoehe', () => {
    const meldung = fehler(bestimmeBandgeometrie({ art: 'split', höhe: 163 })).meldung
    expect(meldung).toMatch(/gerade/i)
    expect(meldung).toMatch(/yuv420p/)
    expect(meldung).toContain('162')
  })

  it('nennt bei unbekannter Art den vorgefundenen Wert', () => {
    const meldung = fehler(
      bestimmeBandgeometrie({ art: 'vollflaeche' } as unknown as {
        art: 'split' | 'einblendung'
        höhe: number
      }),
    ).meldung
    expect(meldung).toContain('vollflaeche')
  })

  it('rundet eine ungerade Hoehe NICHT auf eine gerade - sie wird abgewiesen', () => {
    // Keine Ausweich-Geometrie: Das Band-PNG ist bereits in 1920 x H gezeichnet;
    // jede Rettung erzwaenge eine Skalierung und machte den Text unscharf.
    expect(bestimmeBandgeometrie({ art: 'split', höhe: 163 }).ok).toBe(false)
    expect(bestimmeBandgeometrie({ art: 'einblendung', höhe: 163 }).ok).toBe(false)
  })
})

describe('Ausnahmen und Profilbezug', () => {
  it('wandelt eine Ausnahme der geteilten Funktion in unbekannter_fehler - kein throw', () => {
    doppel.wirft = new Error('geteilte Rechnung kaputt')
    const ergebnis = bestimmeBandgeometrie({ art: 'split', höhe: 162 })
    expect(fehler(ergebnis).code).toBe('unbekannter_fehler')
    expect(fehler(ergebnis).meldung).toContain('geteilte Rechnung kaputt')
  })

  it('nimmt die obere Grenze aus RENDER_PROFILE.hoehe - ein abgewandeltes Profil verschiebt sie mit', async () => {
    vi.resetModules()
    vi.doMock('../../src/shared/contracts/render-profile', () => ({
      RENDER_PROFILE: { ...RENDER_PROFILE, hoehe: 500 } as unknown as typeof RENDER_PROFILE,
    }))
    const { bestimmeBandgeometrie: mitKleinemProfil } = await import(
      '../../src/main/render-service/band-geometrie'
    )

    // 600 ist unter dem echten Profil (1080) gueltig ...
    expect(bestimmeBandgeometrie({ art: 'einblendung', höhe: 600 }).ok).toBe(true)
    // ... und unter dem abgewandelten (500) nicht mehr. Dieselbe Eingabe, anderes
    // Ergebnis: die Grenze ist nachweislich ein Datenwert, kein Literal 1080.
    expect(mitKleinemProfil({ art: 'einblendung', höhe: 600 }).ok).toBe(false)
    expect(mitKleinemProfil({ art: 'einblendung', höhe: 498 }).ok).toBe(true)

    vi.doUnmock('../../src/shared/contracts/render-profile')
    vi.resetModules()
  })
})

describe('OFFEN - blockiert von #239', () => {
  // `src/shared/band-geometrie.ts` (#239) hat heute einen werfenden Rumpf. Der von
  // der Definition of Done verlangte Durchreich-Nachweis MIT DER ECHTEN FUNKTION
  // ist deshalb nicht ausfuehrbar; er ist hier ausgeschrieben und wird gruen,
  // sobald #239 gebaut ist. Bis dahin traegt der Testsatz oben die Nachbildung -
  // gegen von Hand nachgerechnete Zahlen geprueft.
  it.skip('rechnet mit der ECHTEN geteilten Funktion dieselben Zahlen', async () => {
    const echt = await vi.importActual<typeof import('../../src/shared/band-geometrie')>(
      '../../src/shared/band-geometrie',
    )
    for (const fall of NACHGERECHNET) {
      const geo = echt.berechneBandGeometrie(fall.höhe)
      expect(geo.videoBereichHöhe).toBe(fall.bereichHöhe)
      expect(geo.videoBreite).toBe(fall.breite)
      expect(geo.videoVersatzX).toBe(fall.versatzX)
      expect(geo.bandY).toBe(fall.bereichHöhe)
      expect(geo.videoBereichBreite).toBe(1920)
      expect(geo.videoHöhe).toBe(fall.bereichHöhe)
      expect(geo.videoVersatzY).toBe(0)
    }
  })
})
