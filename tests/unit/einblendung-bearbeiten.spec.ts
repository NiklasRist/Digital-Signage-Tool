// Verhaltenstests zu #129 - das Werbeband am Video-Element (FA-20).
//
// Geprüft wird vor allem, was NICHT geschieht: keine Höhe in der Nutzlast (der Typ
// `Einblendung` hat sie nicht - TK 9.2.8), keine Vorlage je Abschnitt, keine
// Arbeitskopie in der Auswahl, keine Sortierung, keine Mutation des Vorzustands
// (den braucht das Rollback aus TK 9.7.3), kein ersetzter Fehlercode.
//
// Die Attrappe ersetzt AUSSCHLIESSLICH `rufeAuf` - mehr Fremdes berührt die Datei
// nicht.
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { KANAELE } from '../../src/shared/contracts/kanaele'
import type { Vorlage } from '../../src/shared/contracts/vorlage'
import type { Listenelement } from '../../src/shared/contracts/project'

const doppel = vi.hoisted(() => ({
  aufrufe: [] as Array<{ kanal: string; nutzlast: unknown }>,
  antwort: null as unknown,
}))

vi.mock('../../src/renderer/ipc-client/rufe-auf', () => ({
  rufeAuf: async (kanal: string, nutzlast?: unknown) => {
    doppel.aufrufe.push({ kanal, nutzlast })
    return doppel.antwort
  },
}))

const {
  waehlbareBandVorlagen,
  fuegeAbschnittAn,
  entferneAbschnitt,
  verschiebeAbschnitt,
  setzeAbschnittsDauer,
  wechsleBandVorlage,
  uebernehmeBand,
} = await import('../../src/renderer/composer/einblendung-bearbeiten')

const element: Listenelement = {
  id: 'el-1',
  art: 'video',
  ref: 'asset-1',
  dauer: null,
  trimStart: 0,
  trimEnde: 12,
  einblendung: null,
}

function vorlage(id: string, art: Vorlage['art'], parent: string | null, hoehe: number | null): Vorlage {
  return { id, name: id, art, höhe: hoehe, parent, eingebaut: false, zonen: [] }
}

function entwurf(): { bandVorlageId: string; abschnitte: Array<{ aktionRef: string; dauer: number }> } {
  return {
    bandVorlageId: 'band-standard',
    abschnitte: [
      { aktionRef: 'a', dauer: 8 },
      { aktionRef: 'b', dauer: 9 },
      { aktionRef: 'c', dauer: 7 },
    ],
  }
}

beforeEach(() => {
  doppel.aufrufe = []
  doppel.antwort = { ok: true, wert: element }
})

describe('waehlbareBandVorlagen', () => {
  it('nimmt split und einblendung, wirft vollflaeche und Arbeitskopien heraus', () => {
    // Die Höhe 210 ist bewusst NICHT durch 18 teilbar: Ein Testbestand, der nur die
    // eingebaute Höhe 162 verwendet, geht bei der Split-Geometrie zufällig glatt auf
    // und belegte damit nichts. Der Filter darf die Höhe ohnehin nicht ansehen.
    const bestand = [
      vorlage('split-210', 'split', null, 210),
      vorlage('voll', 'vollflaeche', null, null),
      vorlage('kopie', 'split', 'split-210', 210),
      vorlage('band', 'einblendung', null, 162),
      vorlage('kopie-band', 'einblendung', 'band', 162),
    ]

    expect(waehlbareBandVorlagen(bestand).map((v) => v.id)).toEqual(['split-210', 'band'])
  })

  it('sortiert nicht und lässt die Eingabeliste unangetastet', () => {
    const bestand = [
      vorlage('zzz', 'split', null, 210),
      vorlage('aaa', 'einblendung', null, 162),
    ]
    const kopie = [...bestand]

    expect(waehlbareBandVorlagen(bestand).map((v) => v.id)).toEqual(['zzz', 'aaa'])
    expect(bestand).toEqual(kopie)
  })

  it('lässt eine vollflaeche auch dann draußen, wenn eine Höhe daran steht', () => {
    // `art` entscheidet, nicht `höhe !== null` - ein von Hand veränderter Bestand
    // dürfte keine vollflächige Vorlage als Band anbieten.
    expect(waehlbareBandVorlagen([vorlage('krumm', 'vollflaeche', null, 162)])).toEqual([])
  })
})

describe('die sechs Entwurfsfunktionen', () => {
  it('fuegeAbschnittAn hängt an und mutiert nichts', () => {
    const vorher = entwurf()
    const arrayVorher = vorher.abschnitte
    const neu = fuegeAbschnittAn(vorher, 'd', 5)

    expect(neu.abschnitte.map((a) => a.aktionRef)).toEqual(['a', 'b', 'c', 'd'])
    expect(vorher.abschnitte).toBe(arrayVorher)
    expect(vorher.abschnitte).toHaveLength(3)
    expect(neu.abschnitte).not.toBe(arrayVorher)
  })

  it('entferneAbschnitt streicht genau einen und mutiert nichts', () => {
    const vorher = entwurf()
    const neu = entferneAbschnitt(vorher, 1)

    expect(neu.abschnitte.map((a) => a.aktionRef)).toEqual(['a', 'c'])
    expect(vorher.abschnitte.map((a) => a.aktionRef)).toEqual(['a', 'b', 'c'])
  })

  it('verschiebeAbschnitt entnimmt bei `von` und fügt bei `nach` ein - vorwärts wie rückwärts', () => {
    expect(verschiebeAbschnitt(entwurf(), 0, 2).abschnitte.map((a) => a.aktionRef)).toEqual([
      'b',
      'c',
      'a',
    ])
    expect(verschiebeAbschnitt(entwurf(), 2, 0).abschnitte.map((a) => a.aktionRef)).toEqual([
      'c',
      'a',
      'b',
    ])
  })

  it('verschiebeAbschnitt mutiert den Vorzustand nicht', () => {
    const vorher = entwurf()
    const arrayVorher = vorher.abschnitte
    verschiebeAbschnitt(vorher, 0, 2)

    expect(vorher.abschnitte).toBe(arrayVorher)
    expect(vorher.abschnitte.map((a) => a.aktionRef)).toEqual(['a', 'b', 'c'])
  })

  it('setzeAbschnittsDauer trifft nur den einen Abschnitt und baut ihn neu', () => {
    const vorher = entwurf()
    const objektVorher = vorher.abschnitte[1]
    const neu = setzeAbschnittsDauer(vorher, 1, 20)

    expect(neu.abschnitte.map((a) => a.dauer)).toEqual([8, 20, 7])
    expect(vorher.abschnitte.map((a) => a.dauer)).toEqual([8, 9, 7])
    expect(neu.abschnitte[1]).not.toBe(objektVorher)
    // Die unbeteiligten Abschnitte werden NICHT kopiert - sie sind unverändert.
    expect(neu.abschnitte[0]).toBe(vorher.abschnitte[0])
  })

  it('wechsleBandVorlage behält alle Abschnitte und tauscht nur die Vorlage', () => {
    const vorher = entwurf()
    const neu = wechsleBandVorlage(vorher, 'split-210')

    expect(neu.bandVorlageId).toBe('split-210')
    expect(neu.abschnitte.map((a) => a.aktionRef)).toEqual(['a', 'b', 'c'])
    expect(vorher.bandVorlageId).toBe('band-standard')
    // Kein Vorlagen- und kein Höhenfeld am Abschnitt (TK 9.2.8).
    expect(Object.keys(neu.abschnitte[0] ?? {})).toEqual(['aktionRef', 'dauer'])
  })

  it.each([
    ['negativ', -1],
    ['zu groß', 3],
    ['krumm', 1.5],
    ['NaN', Number.NaN],
  ])('Index-Randfall %s lässt den Entwurf unverändert - kein Wurf', (_name, index) => {
    const vorher = entwurf()

    expect(entferneAbschnitt(vorher, index)).toBe(vorher)
    expect(setzeAbschnittsDauer(vorher, index, 20)).toBe(vorher)
    expect(verschiebeAbschnitt(vorher, index, 0)).toBe(vorher)
    expect(verschiebeAbschnitt(vorher, 0, index)).toBe(vorher)
    expect(vorher.abschnitte.map((a) => a.aktionRef)).toEqual(['a', 'b', 'c'])
  })
})

describe('uebernehmeBand', () => {
  it('sendet die Einblendung zeichengenau auf dem Kanal aus der Registry', async () => {
    const ergebnis = await uebernehmeBand('el-1', entwurf())

    expect(doppel.aufrufe).toEqual([
      {
        kanal: KANAELE.project.setzeEinblendung,
        nutzlast: {
          elementId: 'el-1',
          einblendung: {
            bandVorlageId: 'band-standard',
            abschnitte: [
              { aktionRef: 'a', dauer: 8 },
              { aktionRef: 'b', dauer: 9 },
              { aktionRef: 'c', dauer: 7 },
            ],
          },
        },
      },
    ])
    // Kein Höhenfeld, kein Zusatzfeld.
    const nutzlast = doppel.aufrufe[0]?.nutzlast as { einblendung: Record<string, unknown> }
    expect(Object.keys(nutzlast.einblendung)).toEqual(['bandVorlageId', 'abschnitte'])
    expect(ergebnis).toEqual({ ok: true, wert: element })
  })

  it.each([
    ['null-Entwurf', null],
    ['leeres Abschnitts-Array', { bandVorlageId: 'band-standard', abschnitte: [] }],
    // Leer heißt leer - auch ohne gewählte Vorlage muss das Entfernen gehen.
    ['leer und ohne Vorlage', { bandVorlageId: '', abschnitte: [] }],
  ])('%s wird als null übernommen (TK 9.5.3)', async (_name, eingabe) => {
    const ergebnis = await uebernehmeBand('el-1', eingabe)

    expect(doppel.aufrufe[0]?.nutzlast).toEqual({ elementId: 'el-1', einblendung: null })
    expect(ergebnis.ok).toBe(true)
  })

  it.each([
    ['leere elementId', '', entwurf()],
    ['elementId nur Leerzeichen', '   ', entwurf()],
    ['leere bandVorlageId', 'el-1', { bandVorlageId: '', abschnitte: [{ aktionRef: 'a', dauer: 8 }] }],
    ['leere aktionRef', 'el-1', { bandVorlageId: 'b', abschnitte: [{ aktionRef: ' ', dauer: 8 }] }],
    ['Dauer 0', 'el-1', { bandVorlageId: 'b', abschnitte: [{ aktionRef: 'a', dauer: 0 }] }],
    ['Dauer negativ', 'el-1', { bandVorlageId: 'b', abschnitte: [{ aktionRef: 'a', dauer: -3 }] }],
    ['Dauer NaN', 'el-1', { bandVorlageId: 'b', abschnitte: [{ aktionRef: 'a', dauer: Number.NaN }] }],
    [
      'Dauer unendlich',
      'el-1',
      { bandVorlageId: 'b', abschnitte: [{ aktionRef: 'a', dauer: Number.POSITIVE_INFINITY }] }],
  ])('%s wird lokal abgewiesen und NICHT gesendet', async (_name, id, eingabe) => {
    const ergebnis = await uebernehmeBand(id, eingabe)

    expect(doppel.aufrufe).toEqual([])
    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) expect(ergebnis.fehler.code).toBe('ungueltige_eingabe')
  })

  it('nennt bei einem fehlerhaften Abschnitt dessen Stelle', async () => {
    const ergebnis = await uebernehmeBand('el-1', {
      bandVorlageId: 'b',
      abschnitte: [
        { aktionRef: 'a', dauer: 8 },
        { aktionRef: 'b', dauer: -1 },
      ],
    })

    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) expect(ergebnis.fehler.meldung).toContain('1')
  })

  it('reicht einen fachlichen Fehlercode des Main unverändert durch', async () => {
    // `kein_projekt` ist ein Code des project-store (#72) - im Renderer nicht
    // importierbar. Genau deshalb darf ihn hier niemand ersetzen oder engführen.
    doppel.antwort = { ok: false, fehler: { code: 'kein_projekt', meldung: 'kein Projekt' } }
    const abgelehnt = await uebernehmeBand('el-1', entwurf())
    expect(abgelehnt).toEqual({ ok: false, fehler: { code: 'kein_projekt', meldung: 'kein Projekt' } })

    // Fehlerklasse 2 (TK 9.7.3): Auch `speicher_fehler` kommt unverändert an - nur
    // am Code kann der Aufrufer unterscheiden, ob zurückgerollt wird.
    doppel.antwort = { ok: false, fehler: { code: 'speicher_fehler', meldung: 'Platte voll' } }
    const nichtGespeichert = await uebernehmeBand('el-1', entwurf())
    expect(nichtGespeichert).toEqual({
      ok: false,
      fehler: { code: 'speicher_fehler', meldung: 'Platte voll' },
    })
  })

  it('mutiert den übergebenen Entwurf auch beim Senden nicht', async () => {
    const vorher = entwurf()
    const arrayVorher = vorher.abschnitte
    await uebernehmeBand('el-1', vorher)

    expect(vorher.abschnitte).toBe(arrayVorher)
    expect(vorher).toEqual(entwurf())
  })
})
