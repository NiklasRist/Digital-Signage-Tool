// Verhaltenstests zu #135 - die Aktions-Bibliothek des Projekts: alle Aktionen
// in Bestandsreihenfolge, jede mit dem Kennzeichen, ob ihr Bild fehlt. Reine
// Ableitung aus den zwei uebergebenen Arrays; kein IPC, kein Dateisystem.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { baueBibliothek, findeBildAsset, istAktionKaputt, zaehleKaputte } from '../../src/renderer/action-editor/bibliothek'
import type { Aktion } from '../../src/shared/contracts/aktion'
import type { Asset } from '../../src/shared/contracts/asset'

/** Ein Gesund-Asset (immer `zustand: 'ok'`), `typ` frei waehlbar. */
function bildAsset(id = 'asset-1', zustand: Asset['zustand'] = 'ok', typ: Asset['typ'] = 'bild'): Asset {
  return {
    id,
    typ,
    dateiname: `${id}.png`,
    originalname: 'Motiv.png',
    maße: { breite: 1920, höhe: 1080 },
    dauer: null,
    importdatum: '2026-08-01T00:00:00.000Z',
    zustand,
  }
}

/** Eine Aktion mit gesetztem oder leerem `bildRef`. */
function aktion(id: string, bildRef: string | null): Aktion {
  return {
    id,
    titel: `Aktion ${id}`,
    beschreibung: null,
    preis: null,
    bildRef,
    cta: null,
    standardDauer: null,
    vorlagenId: 'vorlage-vollbild',
    akzentfarbe: null,
  }
}

describe('findeBildAsset loest bildRef gegen die Medien-Bibliothek auf', () => {
  it('liefert null, wenn bildRef null ist', () => {
    expect(findeBildAsset(null, [])).toBeNull()
    expect(findeBildAsset(null, [bildAsset('asset-1')])).toBeNull()
  })

  it('liefert null bei einer ID, die in assets nicht vorkommt', () => {
    const assets = [bildAsset('asset-1')]
    expect(findeBildAsset('asset-nirgends', assets)).toBeNull()
  })

  it('liefert null, wenn das Asset im zustand fehlt ist (TK 9.8.5)', () => {
    const assets = [bildAsset('asset-fehlend', 'fehlt')]
    expect(findeBildAsset('asset-fehlend', assets)).toBeNull()
  })

  it('liefert DASSELBE Asset-Objekt zurueck (Identitaet, keine Kopie)', () => {
    const asset = bildAsset('asset-ok')
    const assets = [asset]
    expect(findeBildAsset('asset-ok', assets)).toBe(asset)
  })

  it('findet das Asset unabhaengig von seiner Position im Array', () => {
    const asset = bildAsset('asset-mitte')
    const assets = [bildAsset('asset-a'), asset, bildAsset('asset-c')]
    expect(findeBildAsset('asset-mitte', assets)).toBe(asset)
  })
})

describe('istAktionKaputt kennzeichnet nur falsch aufgeloeste bildRefs', () => {
  it('bildRef null ist niemals kaputt - eine Aktion ohne Bild ist gueltig (TK 9.8.5)', () => {
    expect(istAktionKaputt(aktion('a-1', null), [])).toBe(false)
    expect(istAktionKaputt(aktion('a-2', null), [])).toBe(false)
  })

  it('kaputt, wenn bildRef auf ein fehlt-Asset zeigt', () => {
    const assets = [bildAsset('asset-fehlend', 'fehlt')]
    expect(istAktionKaputt(aktion('a-1', 'asset-fehlend'), assets)).toBe(true)
  })

  it('kaputt, wenn bildRef auf eine nicht vorhandene ID zeigt', () => {
    expect(istAktionKaputt(aktion('a-1', 'asset-nirgends'), [bildAsset('asset-1')])).toBe(true)
  })

  it('heil, wenn bildRef auf ein ok-Asset zeigt', () => {
    expect(istAktionKaputt(aktion('a-1', 'asset-1'), [bildAsset('asset-1')])).toBe(false)
  })

  it('kaputt, wenn die Asset-Liste leer ist und bildRef gesetzt ist', () => {
    expect(istAktionKaputt(aktion('a-1', 'asset-1'), [])).toBe(true)
  })
})

describe('baueBibliothek - Bestandsreihenfolge, genau n Eintraege je n Aktionen', () => {
  it('liefert bei n Aktionen genau n Eintraege in der Reihenfolge des Eingabe-Arrays', () => {
    const assets = [bildAsset('asset-1')]
    // Absichtlich unsortierte Titel: DoD verlangt, dass die Reihenfolge des
    // Eingabe-Arrays erhalten bleibt, ohne jede Sortierung.
    const aktionen = [
      aktion('a-z', 'asset-1'),
      aktion('a-a', null),
      aktion('a-m', 'asset-1'),
    ]
    const bibliothek = baueBibliothek(aktionen, assets)
    expect(bibliothek).toHaveLength(3)
    expect(bibliothek.map((eintrag) => eintrag.aktion)).toEqual(aktionen)
    expect(bibliothek.map((eintrag) => eintrag.aktion.titel)).toEqual(['Aktion a-z', 'Aktion a-a', 'Aktion a-m'])
  })

  it('liefert eine leere Bibliothek fuer ein leeres Aktionen-Array', () => {
    expect(baueBibliothek([], [])).toEqual([])
    expect(baueBibliothek([], [bildAsset('asset-1')])).toEqual([])
  })

  it('hat eine leere Asset-Liste nur bei null-bildRef-Aktionen als heil', () => {
    const bibliothek = baueBibliothek([aktion('a-1', null), aktion('a-2', 'asset-1')], [])
    expect(bibliothek.map((e) => e.kaputt)).toEqual([false, true])
  })

  it('liefert im Eintrag dasselbe Aktionen- und Asset-Objekt (Identitaet)', () => {
    const akt = aktion('a-1', 'asset-1')
    const asset = bildAsset('asset-1')
    const [eintrag] = baueBibliothek([akt], [asset])
    expect(eintrag!.aktion).toBe(akt)
    expect(eintrag!.bildAsset).toBe(asset)
  })

  it('bildAsset ist null, wenn der Eintrag kaputt ist - auch bei fehlt-Asset', () => {
    const assets = [bildAsset('asset-fehlend', 'fehlt')]
    const bibliothek = baueBibliothek([aktion('a-1', 'asset-fehlend')], assets)
    expect(bibliothek[0]).toEqual({ aktion: bibliothek[0]!.aktion, kaputt: true, bildAsset: null })
  })

  it('bildAsset ist null bei bildRef null (kaputt false)', () => {
    const [eintrag] = baueBibliothek([aktion('a-1', null)], [bildAsset('asset-1')])
    expect(eintrag!.kaputt).toBe(false)
    expect(eintrag!.bildAsset).toBeNull()
  })

  it('laesst die uebergebenen Arrays unveraendert (tiefe Gleichheit vor/nach)', () => {
    const aktionen = [aktion('a-1', 'asset-ok'), aktion('a-2', 'asset-kaputt')]
    const assets = [bildAsset('asset-ok'), bildAsset('asset-kaputt', 'fehlt')]
    const aktionenVorher = JSON.stringify(aktionen)
    const assetsVorher = JSON.stringify(assets)

    baueBibliothek(aktionen, assets)
    findeBildAsset('asset-ok', assets)
    istAktionKaputt(aktionen[0]!, assets)
    zaehleKaputte(baueBibliothek(aktionen, assets))

    expect(JSON.stringify(aktionen)).toBe(aktionenVorher)
    expect(JSON.stringify(assets)).toBe(assetsVorher)
  })
})

describe('zaehleKaputte - Zaehler fuer die Oberflaeche', () => {
  it('stimmt mit der Anzahl der kaputten Eintraege ueberein', () => {
    const assets = [bildAsset('asset-1'), bildAsset('asset-kaputt', 'fehlt')]
    const bibliothek = baueBibliothek(
      [aktion('a-1', 'asset-1'), aktion('a-2', 'asset-kaputt'), aktion('a-3', null), aktion('a-4', 'asset-nirgends')],
      assets,
    )
    expect(bibliothek.map((e) => e.kaputt)).toEqual([false, true, false, true])
    expect(zaehleKaputte(bibliothek)).toBe(2)
  })

  it('liefert 0 fuer eine leere oder vollstaendig heile Bibliothek', () => {
    expect(zaehleKaputte([])).toBe(0)
    const heile = baueBibliothek([aktion('a-1', null), aktion('a-2', 'asset-1')], [bildAsset('asset-1')])
    expect(zaehleKaputte(heile)).toBe(0)
  })

  it('liefert die volle Laenge, wenn jede Aktion kaputt ist', () => {
    const kaputte = baueBibliothek([aktion('a-1', 'asset-x'), aktion('a-2', 'asset-y')], [])
    expect(zaehleKaputte(kaputte)).toBe(2)
  })
})

describe('es wird nichts eigenmaechtig entschieden, nichts repariert', () => {
  it('STOPP-Fall: video-Asset mit zustand ok zaehlt wie ein heiles Bild (nicht kaputt)', () => {
    // Der STOPP-Block des Issues verlangt, den Fall `typ: 'video'` bis zur
    // Klaerung wie `zustand === 'ok'` zu behandeln und zu melden.
    const video = bildAsset('asset-video', 'ok', 'video')
    expect(findeBildAsset('asset-video', [video])).toBe(video)
    expect(istAktionKaputt(aktion('a-1', 'asset-video'), [video])).toBe(false)
  })
})

describe('Grep-Proben aus der Definition of Done', () => {
  const pfad = fileURLToPath(new URL('../../src/renderer/action-editor/bibliothek.ts', import.meta.url))
  const quelltext = readFileSync(pfad, 'utf8')

  // Kommentare entfernen - die Verbote gelten dem CODE. Die Erklaerungen
  // duerfen die Regeln zitieren. REIHENFOLGE BEACHTEN: erst die Zeilen-, dann
  // die Blockkommentare.
  const code = quelltext.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')

  it('die Abschaltzeile aus Zeile 1 ist entfernt', () => {
    expect(quelltext.startsWith('/* eslint-disable')).toBe(false)
    expect(quelltext.startsWith('// GENERIERT aus dem Signaturblock von Issue #135.')).toBe(true)
  })

  it('die vier Signaturen sind woertlich unveraendert geblieben', () => {
    expect(quelltext).toContain('export function findeBildAsset(bildRef: string | null, assets: Asset[]): Asset | null')
    expect(quelltext).toContain('export function istAktionKaputt(aktion: Aktion, assets: Asset[]): boolean')
    expect(quelltext).toContain('export function baueBibliothek(aktionen: Aktion[], assets: Asset[]): BibliothekEintrag[]')
    expect(quelltext).toContain('export function zaehleKaputte(eintraege: BibliothekEintrag[]): number')
    expect(quelltext).toContain('export interface BibliothekEintrag {')
  })

  it('kein sort, kein rufeAuf, kein window.api, kein fs (Grep-Probe)', () => {
    expect(code).not.toContain('.sort(')
    expect(code).not.toContain('rufeAuf')
    expect(code).not.toContain('window.api')
    expect(code).not.toMatch(/\bfrom '(node:)?fs'/)
  })

  it('keine Funktion wirft - der werfende Rumpf ist entfernt', () => {
    expect(quelltext).not.toContain('Rumpf gehoert zu Issue #135')
    expect(code).not.toContain('throw new Error')
    expect(code).not.toMatch(/throw\b/)
  })

  it('kein Modul-Zustand: keine Top-Level-Variable ausser den Signaturen', () => {
    // `const`/`let` auf oberster Ebene waere eigene Wahrheit neben dem
    // project-store; die Datei ist nur Funktionen plus Typ-Interface.
    expect(code).not.toMatch(/^(const|let|var)\s/m)
  })

  it('bildAsset ist bei kaputt bewusst null (nicht das fehlt-Asset durchreichen)', () => {
    expect(code).toContain('bildAsset: kaputt ? null : ')
  })
})

describe('Gegenproben, die pruefen, dass die Grep-Proben wirklich greifen', () => {
  // Eine Probe ohne Beleg ist keine Probe: Diese Faelschungen muessen
  // DURCHFALLEN. Wuerde eine davon gruen, triefe der Filter ins Leere.
  it('eine eingeschmuggelte Abschaltzeile wird gefunden', () => {
    const gefaelscht = "/* eslint-disable @typescript-eslint/no-unused-vars */\n// x"
    expect(gefaelscht.startsWith('/* eslint-disable')).toBe(true)
  })

  it('ein eingeschmuggelter sort-Aufruf wird gefunden', () => {
    const gefaelscht = "return eintraege.sort((a, b) => 0)"
    expect(gefaelscht).toContain('.sort(')
  })

  it('ein eingeschmuggelter throw wird gefunden', () => {
    const gefaelscht = "if (x) throw new Error('kaputt')"
    expect(gefaelscht).toMatch(/throw new Error/)
  })

  it('eine eingeschmuggelte Top-Level-Konstante wird gefunden', () => {
    const gefaelscht = "const zwischenlager: Asset[] = []"
    const code = gefaelscht.replace(/\/\/.*$/gm, '')
    expect(code).toMatch(/^(const|let|var)\s/m)
  })
})