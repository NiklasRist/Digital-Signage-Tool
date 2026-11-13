// Der Weg der Produktseiten-Suche durch KONFIGURATION und AUFTRAG (#472, FA-30 / TK 9.20).
//
// Integration, weil hier die echte Kette laeuft: `config.json` schreiben (atomar, mit
// Sicherung) -> lesen und normalisieren -> Suchauftrag -> Treffer. Die Netzschicht ist
// GEDOPPELT (wie in #470): Eine echte Suchseite waere ein fremdes Ziel, das der Lauf nicht
// voraussetzen darf (9.20.6). Geprueft wird ausserdem die zweite Zusage des Issues: Die
// Wahl setzt `produktUrl` im ENTWURF und schreibt NICHTS (belegt ueber `unterschiede`).
import { mkdtempSync, existsSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import type { Aktion } from '../../src/shared/contracts/aktion'
import type { Ergebnis } from '../../src/shared/contracts/ergebnis'
import type { NetzAntwort, NetzFehlercode } from '../../src/main/produktfoto/netz'

vi.mock('electron', () => ({ app: { isPackaged: false, getPath: () => '' } }))

const doppel = vi.hoisted(() => ({
  antworten: new Map<string, unknown>(),
  aufrufe: [] as string[],
}))

vi.mock('../../src/main/produktfoto/netz', () => ({
  hole: async (url: URL): Promise<unknown> => {
    doppel.aufrufe.push(url.href)
    return doppel.antworten.get(url.href) ?? { ok: false, fehler: { code: 'kein_netz', meldung: 'kein_netz' } }
  },
}))

const { schreibeConfig } = await import('../../src/main/config-store/schreibe-config')
const { leseKonfig } = await import('../../src/main/config-store/lese-konfig')
const { produktseiteSuchen } = await import('../../src/main/produktsuche/produktsuche-ausfuehren')
const { unterschiede } = await import('../../src/renderer/action-editor/aktions-entwurf')

const urspruenglicherOrt = process.cwd()
const arbeitsordner = mkdtempSync(path.join(tmpdir(), 'signage-produktsuche-'))

function ok(url: string, koerper: string): Ergebnis<NetzAntwort, NetzFehlercode> {
  return {
    ok: true,
    wert: { url, status: 200, contentType: 'text/html; charset=utf-8', bytes: Buffer.from(koerper), weiter: null },
  }
}

beforeAll(() => {
  process.chdir(arbeitsordner)
})

afterEach(() => {
  doppel.antworten.clear()
  doppel.aufrufe.length = 0
})

afterAll(() => {
  process.chdir(urspruenglicherOrt)
  rmSync(arbeitsordner, { recursive: true, force: true })
})

const SHOP = { host: 'best-body-shop.de', suchMuster: 'https://best-body-shop.de/suche?q={q}' }

describe('Produktseiten-Suche ueber config.json und Auftrag', () => {
  it('liest die Quellen aus der Datei, sucht im Shop und bietet den Treffer an', async () => {
    const geschrieben = await schreibeConfig({
      aktivesProjektId: null,
      letztesExportZiel: null,
      uiVoreinstellungen: {},
      produktQuellen: { shops: [SHOP], webSuche: 'https://suche.example/?q={q}' },
    })
    expect(geschrieben.ok).toBe(true)

    const gelesen = await leseKonfig()
    expect(gelesen.ok).toBe(true)
    if (!gelesen.ok) return
    expect(gelesen.wert.produktQuellen).toEqual({
      shops: [SHOP],
      webSuche: 'https://suche.example/?q={q}',
    })

    doppel.antworten.set(
      'https://best-body-shop.de/suche?q=Proteinriegel',
      ok(
        'https://best-body-shop.de/suche?q=Proteinriegel',
        '<a href="/produkt/proteinriegel-500g">Proteinriegel 500 g</a>',
      ),
    )

    const ergebnis = await produktseiteSuchen(
      {
        auftragId: 'auftrag-1',
        art: 'produktseite-suche',
        status: 'laeuft',
        label: 'Produktsuche',
        payload: { projektId: 'p-1', aktionId: '', stichwort: 'Proteinriegel' },
        fortschritt: null,
        versuche: 1,
        fehler: null,
        ergebnis: null,
        erstelltAm: '2026-11-13T10:00:00.000Z',
      },
      { auftragId: 'auftrag-1', meldeFortschritt: () => undefined },
    )

    expect(ergebnis.status).toBe('erfolg')
    if (ergebnis.status !== 'erfolg') return
    const daten = ergebnis.ergebnis as { treffer: Array<{ url: string; titel: string; host: string }> }
    expect(daten.treffer).toEqual([
      {
        url: 'https://best-body-shop.de/produkt/proteinriegel-500g',
        titel: 'Proteinriegel 500 g',
        host: 'best-body-shop.de',
      },
    ])
    // Der Notweg wurde NICHT befragt - die Shops hatten etwas (9.20.1 Punkt 2).
    expect(doppel.aufrufe).toEqual(['https://best-body-shop.de/suche?q=Proteinriegel'])

    // NICHTS GESCHRIEBEN: Es gibt keinen Projektordner. Die Suche legt nichts an (9.20.5).
    expect(existsSync(path.join(arbeitsordner, 'projects'))).toBe(false)
  })

  it('schreibt ohne Feld den Standard und sucht dann nicht', async () => {
    const geschrieben = await schreibeConfig({
      aktivesProjektId: null,
      letztesExportZiel: null,
      uiVoreinstellungen: {},
    })
    expect(geschrieben.ok).toBe(true)

    const gelesen = await leseKonfig()
    expect(gelesen.ok).toBe(true)
    if (!gelesen.ok) return
    expect(gelesen.wert.produktQuellen).toEqual({ shops: [], webSuche: null })

    const ergebnis = await produktseiteSuchen(
      {
        auftragId: 'auftrag-2',
        art: 'produktseite-suche',
        status: 'laeuft',
        label: 'Produktsuche',
        payload: { projektId: 'p-1', aktionId: 'a-1', stichwort: 'Proteinriegel' },
        fortschritt: null,
        versuche: 1,
        fehler: null,
        ergebnis: null,
        erstelltAm: '2026-11-13T10:05:00.000Z',
      },
      { auftragId: 'auftrag-2', meldeFortschritt: () => undefined },
    )

    expect(ergebnis.status).toBe('fehlgeschlagen')
    if (ergebnis.status !== 'fehlgeschlagen') return
    expect(ergebnis.fehler.code).toBe('keine_treffer')
    expect(doppel.aufrufe).toEqual([])
  })

  it('die Wahl landet im ENTWURF - `unterschiede` meldet genau `produktUrl`', () => {
    const gespeichert: Aktion = {
      id: 'a-1',
      titel: 'Proteinriegel',
      beschreibung: null,
      preis: '19,95 €',
      bildRef: null,
      cta: null,
      standardDauer: 10,
      vorlagenId: 'vollbild',
      markeId: 'm-1',
      akzentfarbe: null,
      produktUrl: null,
    }
    const { id: _kennung, ...entwurf } = gespeichert
    const gewaehlt = 'https://best-body-shop.de/produkt/proteinriegel-500g'

    // 9.20.1 Punkt 4: Die gewaehlte Adresse wird `Aktion.produktUrl` - im Entwurf.
    const nachWahl = { ...entwurf, produktUrl: gewaehlt }
    expect(unterschiede(nachWahl, gespeichert)).toEqual({ produktUrl: gewaehlt })
    // Kein Schreibvorgang hier: `unterschiede` ist eine Ableitung, kein Aufruf (9.19.8).
    expect(readdirSync(arbeitsordner)).not.toContain('project.json')
  })
})
