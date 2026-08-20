// Logik-Tests zu #227 - die Ableitung der Bibliothek (bibliothek-ansicht.ts, node).
//
// Die Datei ist REIN: sie leitet aus einem Project zwei Listen ab und kann nicht
// scheitern (kein Ergebnis<T>, kein async, kein IPC). Bewiesen wird: gleiche Anzahl
// wie der Bestand (auch bei fehlt/kaputt - kein stilles Filtern), Bestandsreihenfolge,
// uebernommener Zustand (nie neu beurteilt, ENTSCHIEDEN 1) und die medienUrl aus
// #258 (Nachtrag 14.08.2026: importiert, nicht nachgebaut).
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

import type { Asset } from '../../src/shared/contracts/asset'
import type { Aktion } from '../../src/shared/contracts/aktion'
import type { Project } from '../../src/shared/contracts/project'
import { istAktionKaputt } from '../../src/renderer/action-editor/bibliothek'
import {
  baueMedienEintraege,
  baueAktionsEintraege,
  medienUrl,
  zaehleFehlende,
} from '../../src/renderer/composer/bibliothek-ansicht'

function asset(ueber: Partial<Asset> & { id: string }): Asset {
  return {
    typ: 'video',
    dateiname: `${ueber.id}.mp4`,
    originalname: `Original ${ueber.id}`,
    maße: { breite: 1920, höhe: 1080 },
    dauer: 10,
    importdatum: '2026-01-01T00:00:00.000Z',
    zustand: 'ok',
    ...ueber,
  }
}

function aktion(ueber: Partial<Aktion> & { id: string }): Aktion {
  return {
    titel: `Aktion ${ueber.id}`,
    beschreibung: null,
    preis: null,
    bildRef: null,
    cta: null,
    standardDauer: null,
    vorlagenId: 'v1',
    akzentfarbe: null,
    ...ueber,
  }
}

function projekt(ueber: Partial<Project> & { id: string }): Project {
  return {
    name: 'Projekt',
    erstelltAm: '2026-01-01T00:00:00.000Z',
    geaendertAm: '2026-01-01T00:00:00.000Z',
    schemaVersion: 1,
    assets: [],
    aktionen: [],
    liste: [],
    letzterAusgabeName: null,
    ...ueber,
  }
}

describe('baueMedienEintraege (DoD)', () => {
  it('liefert genau so viele Einträge wie projekt.assets - auch bei zustand fehlt (DoD)', () => {
    const p = projekt({
      id: 'p1',
      assets: [
        asset({ id: 'a1', zustand: 'ok' }),
        asset({ id: 'a2', zustand: 'fehlt' }),
        asset({ id: 'a3', zustand: 'ok', typ: 'bild' }),
      ],
    })

    const eintraege = baueMedienEintraege(p)

    expect(eintraege).toHaveLength(3)
  })

  it('behaelt die Reihenfolge von projekt.assets - keine Sortierung (DoD)', () => {
    const p = projekt({
      id: 'p1',
      assets: [
        asset({ id: 'c', importdatum: '2026-03-01T00:00:00.000Z', originalname: 'Zebra' }),
        asset({ id: 'a', importdatum: '2026-01-01T00:00:00.000Z', originalname: 'Apfel' }),
        asset({ id: 'b', importdatum: '2026-02-01T00:00:00.000Z', originalname: 'Banane' }),
      ],
    })

    const eintraege = baueMedienEintraege(p)

    expect(eintraege.map((e) => e.asset.id)).toEqual(['c', 'a', 'b'])
  })

  it('uebernimmt asset.zustand identisch - fuer ok und fehlt (DoD)', () => {
    const p = projekt({
      id: 'p1',
      assets: [asset({ id: 'a1', zustand: 'ok' }), asset({ id: 'a2', zustand: 'fehlt' })],
    })

    const eintraege = baueMedienEintraege(p)

    expect(eintraege.map((e) => e.zustand)).toEqual(['ok', 'fehlt'])
  })

  it('setzt bezeichnung = originalname und nie dateiname (DoD)', () => {
    const p = projekt({
      id: 'p1',
      assets: [asset({ id: 'a1', originalname: 'Sommerbild.png', dateiname: 'x-9f.png' })],
    })

    const eintraege = baueMedienEintraege(p)

    expect(eintraege[0]?.bezeichnung).toBe('Sommerbild.png')
    expect(eintraege[0]?.bezeichnung).not.toBe('x-9f.png')
  })

  it('setzt vorschauUrl genau dann, wenn typ bild UND zustand ok - vier benannte Faelle (DoD)', () => {
    const faelle: Array<[Partial<Asset>, boolean]> = [
      [{ typ: 'bild', zustand: 'ok' }, true],
      [{ typ: 'bild', zustand: 'fehlt' }, false],
      [{ typ: 'video', zustand: 'ok' }, false],
      [{ typ: 'video', zustand: 'fehlt' }, false],
    ]
    for (const [teil, erwartet] of faelle) {
      const p = projekt({ id: 'p1', assets: [asset({ id: 'a1', ...teil })] })
      const eintraege = baueMedienEintraege(p)
      expect(eintraege[0]?.vorschauUrl !== null, JSON.stringify(teil)).toBe(erwartet)
    }
  })

  it('baut die Vorschau-URL als media://<projektId>/<dateiname>', () => {
    const p = projekt({
      id: 'p1',
      assets: [asset({ id: 'a1', typ: 'bild', zustand: 'ok', dateiname: 'a-b-c.png' })],
    })

    const eintraege = baueMedienEintraege(p)

    expect(eintraege[0]?.vorschauUrl).toBe('media://p1/a-b-c.png')
  })
})

describe('baueAktionsEintraege (DoD)', () => {
  it('stimmt fuer jede Aktion mit istAktionKaputt ueberein (DoD)', () => {
    const p = projekt({
      id: 'p1',
      assets: [asset({ id: 'b1', typ: 'bild', zustand: 'ok' })],
      aktionen: [
        aktion({ id: 'k1', bildRef: 'b1' }), // vorhandenes Bild -> ok
        aktion({ id: 'k2', bildRef: 'b1' }), // gleiches Bild, zweite Aktion
        aktion({ id: 'k3', bildRef: 'unbekannt' }), // unbekannte Referenz -> kaputt
        aktion({ id: 'k4', bildRef: null }), // kein Bild -> ok
      ],
    })

    const eintraege = baueAktionsEintraege(p)
    const direkt = p.aktionen.map((a) => istAktionKaputt(a, p.assets))

    expect(eintraege.map((e) => e.kaputt)).toEqual(direkt)
  })

  it('behaelt die Reihenfolge von projekt.aktionen (DoD)', () => {
    const p = projekt({
      id: 'p1',
      aktionen: [
        aktion({ id: 'c', titel: 'Zulu' }),
        aktion({ id: 'a', titel: 'Alpha' }),
        aktion({ id: 'b', titel: 'Bravo' }),
      ],
    })

    const eintraege = baueAktionsEintraege(p)

    expect(eintraege.map((e) => e.aktion.id)).toEqual(['c', 'a', 'b'])
  })

  it('bezeichnet die Aktion mit aktion.titel (Pflichtfeld, #14)', () => {
    const p = projekt({ id: 'p1', aktionen: [aktion({ id: 'a1', titel: 'Sommeraktion' })] })

    const eintraege = baueAktionsEintraege(p)

    expect(eintraege[0]?.bezeichnung).toBe('Sommeraktion')
  })
})

describe('medienUrl – aus #258 (Nachtrag 14.08.2026)', () => {
  it('liefert exakt media://p1/a-b-c.png - ohne fuehrenden Schraegstrich (DoD)', () => {
    expect(medienUrl('p1', 'a-b-c.png')).toBe('media://p1/a-b-c.png')
  })
})

describe('zaehleFehlende (DoD)', () => {
  it('zaehlt genau die Eintraege mit zustand fehlt', () => {
    const eintraege = baueMedienEintraege(
      projekt({
        id: 'p1',
        assets: [
          asset({ id: 'a1', zustand: 'ok' }),
          asset({ id: 'a2', zustand: 'fehlt' }),
          asset({ id: 'a3', zustand: 'fehlt' }),
        ],
      }),
    )

    expect(zaehleFehlende(eintraege)).toBe(2)
  })

  it('liefert 0 ohne fehlende Eintraege', () => {
    expect(zaehleFehlende([])).toBe(0)
  })
})

describe('Unveraendertheit (DoD)', () => {
  it('veraendert projekt, assets und aktionen nicht (DoD)', () => {
    const p = projekt({
      id: 'p1',
      assets: [asset({ id: 'a1' }), asset({ id: 'a2', zustand: 'fehlt' })],
      aktionen: [aktion({ id: 'k1' })],
    })
    const kopieAssets = p.assets.map((a) => ({ ...a }))
    const kopieAktionen = p.aktionen.map((a) => ({ ...a }))
    const kopieId = p.id

    baueMedienEintraege(p)
    baueAktionsEintraege(p)

    expect(p.id).toBe(kopieId)
    expect(p.assets.map((a) => ({ ...a }))).toEqual(kopieAssets)
    expect(p.aktionen.map((a) => ({ ...a }))).toEqual(kopieAktionen)
  })
})

describe('DoD-Grep-Proben (bibliothek-ansicht.ts, nur Code - Kommentarzeilen raus)', () => {
  const CODE = readFileSync('src/renderer/composer/bibliothek-ansicht.ts', 'utf8')
    .split('\n')
    .filter((zeile) => {
      const getrimmt = zeile.trim()
      return (
        !getrimmt.startsWith('//') &&
        !getrimmt.startsWith('/*') &&
        !getrimmt.startsWith('*') &&
        getrimmt !== ''
      )
    })
    .join('\n')

  it('enthaelt kein JSX, keinen react-Import, kein rufeAuf, kein KANAELE, kein abonniere, kein queue:, kein window. (DoD)', () => {
    for (const verboten of ['react', 'JSX', 'rufeAuf', 'KANAELE', 'abonniere', "'queue:", 'window.']) {
      expect(CODE, verboten).not.toContain(verboten)
    }
  })

  it('berechnet kaputt nicht selbst - kein zustand-Fehlt-Vergleich fuer Aktionen, kein bildRef-Nachschlag (DoD)', () => {
    // `zustand === 'fehlt'` steht erlaubterweise in baueMedienEintraege und
    // zaehleFehlende (Medien). Fuer AKTIONEN ist jede eigene Beurteilung verboten:
    // die Regel lebt in #135. Gemessen wird deshalb, dass baueAktionsEintraege
    // ausschliesslich istAktionKaputt aufruft und kein bildRef-Vergleich entsteht.
    expect(CODE).toContain('kaputt: istAktionKaputt(aktion, projekt.assets)')
    // Kein bildRef in der ganzen Datei (der Nachschlag waere die Zweitfassung der Regel).
    expect(CODE).not.toMatch(/bildRef/)
    // Im Aktions-Block kein zustand-Vergleich: nur das Stueck der einen Funktion.
    const abAktion = CODE.slice(CODE.indexOf('baueAktionsEintraege'))
    const aktionsBlock = abAktion.slice(0, abAktion.indexOf('zaehleFehlende'))
    expect(aktionsBlock).not.toMatch(/zustand === 'fehlt'/)
  })
})