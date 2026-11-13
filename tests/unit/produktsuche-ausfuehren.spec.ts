// Der Auftrag `produktseite-suche` (#472, FA-30 / TK 9.20) - mit gedeckter Netzschicht.
//
// Das Netz selbst hat seinen eigenen Test (`produktfoto-netz.spec.ts`, inklusive der
// Loopback-Gegenprobe). Hier wird der ABLAUF geprueft: Shops zuerst, Notweg nur wenn noetig,
// hoechstens fuenf Treffer, hoechstens drei Shops - und der Klartext je Fehlergrund.
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { Auftrag } from '../../src/shared/contracts/auftrag'
import type { Ergebnis } from '../../src/shared/contracts/ergebnis'
import type { ProduktQuellen } from '../../src/shared/contracts/produktsuche'
import type { NetzAntwort, NetzFehlercode } from '../../src/main/produktfoto/netz'

const doppel = vi.hoisted(() => ({
  antworten: new Map<string, unknown>(),
  aufrufe: [] as string[],
  quellen: { shops: [], webSuche: null } as unknown,
  konfigFehler: false,
}))

vi.mock('../../src/main/produktfoto/netz', () => ({
  hole: async (url: URL): Promise<unknown> => {
    doppel.aufrufe.push(url.href)
    const antwort = doppel.antworten.get(url.href)
    if (antwort === undefined) {
      return { ok: false, fehler: { code: 'kein_netz', meldung: 'kein_netz' } }
    }
    return antwort
  },
}))

vi.mock('../../src/main/config-store/lese-konfig', () => ({
  leseKonfig: async (): Promise<unknown> =>
    doppel.konfigFehler
      ? { ok: false, fehler: { code: 'speicher_fehler', meldung: 'kaputt' } }
      : {
          ok: true,
          wert: {
            aktivesProjektId: null,
            letztesExportZiel: null,
            uiVoreinstellungen: {},
            produktQuellen: doppel.quellen,
          },
        },
}))

const { produktseiteSuchen } = await import('../../src/main/produktsuche/produktsuche-ausfuehren')

const SHOP_A = { host: 'a.example', suchMuster: 'https://a.example/s?q={q}' }
const SHOP_B = { host: 'b.example', suchMuster: 'https://b.example/s?q={q}' }
const WEB = 'https://suche.example/?q={q}'

function ok(url: string, koerper: string): Ergebnis<NetzAntwort, NetzFehlercode> {
  return {
    ok: true,
    wert: {
      url,
      status: 200,
      contentType: 'text/html; charset=utf-8',
      bytes: Buffer.from(koerper),
      weiter: null,
    },
  }
}

function auftrag(stichwort = 'Proteinriegel'): Extract<Auftrag, { art: 'produktseite-suche' }> {
  return {
    auftragId: 'auftrag-1',
    art: 'produktseite-suche',
    status: 'laeuft',
    label: 'Produktsuche',
    payload: { projektId: 'p-1', aktionId: 'a-1', stichwort },
    fortschritt: null,
    versuche: 1,
    fehler: null,
    ergebnis: null,
    erstelltAm: '2026-11-13T10:00:00.000Z',
  }
}

function seite(adresse: string, treffer: string[]): Ergebnis<NetzAntwort, NetzFehlercode> {
  const anker = treffer.map((pfad) => `<a href="${pfad}">${pfad}</a>`).join('')
  return ok(adresse, `<html><body>${anker}</body></html>`)
}

function quellen(neu: Partial<ProduktQuellen>): void {
  doppel.quellen = { shops: [], webSuche: null, ...neu }
}

afterEach(() => {
  doppel.antworten.clear()
  doppel.aufrufe.length = 0
  doppel.konfigFehler = false
  quellen({})
})

describe('produktseiteSuchen (FA-30)', () => {
  it('befragt zuerst die Shops und den Notweg GAR NICHT, wenn dort etwas steht', async () => {
    quellen({ shops: [SHOP_A], webSuche: WEB })
    doppel.antworten.set('https://a.example/s?q=Proteinriegel', seite('https://a.example/s?q=Proteinriegel', ['/produkt/1']))

    const ergebnis = await produktseiteSuchen(auftrag(), { auftragId: 'a', meldeFortschritt: () => undefined })

    expect(ergebnis.status).toBe('erfolg')
    if (ergebnis.status !== 'erfolg') return
    const daten = ergebnis.ergebnis as { treffer: Array<{ url: string; titel: string; host: string }> }
    expect(daten.treffer).toEqual([
      { url: 'https://a.example/produkt/1', titel: '/produkt/1', host: 'a.example' },
    ])
    expect(doppel.aufrufe).toEqual(['https://a.example/s?q=Proteinriegel'])
    expect(doppel.aufrufe.some((aufruf) => aufruf.startsWith('https://suche.example'))).toBe(false)
  })

  it('faellt auf den Notweg zurueck, wenn die Shops nichts liefern', async () => {
    quellen({ shops: [SHOP_A], webSuche: WEB })
    doppel.antworten.set('https://a.example/s?q=Proteinriegel', seite('https://a.example/s?q=Proteinriegel', []))
    doppel.antworten.set(
      'https://suche.example/?q=Proteinriegel',
      seite('https://suche.example/?q=Proteinriegel', ['https://fremd.example/produkt/9']),
    )

    const ergebnis = await produktseiteSuchen(auftrag(), { auftragId: 'a', meldeFortschritt: () => undefined })

    expect(ergebnis.status).toBe('erfolg')
    if (ergebnis.status !== 'erfolg') return
    const daten = ergebnis.ergebnis as { treffer: Array<{ url: string; host: string }> }
    expect(daten.treffer).toEqual([
      // Der Linktext ist hier die Adresse selbst - die Seite liefert keinen anderen.
      {
        url: 'https://fremd.example/produkt/9',
        titel: 'https://fremd.example/produkt/9',
        host: 'fremd.example',
      },
    ])
    expect(doppel.aufrufe).toHaveLength(2)
  })

  it('fragt hoechstens DREI Shops - der vierte ist Vorrat (9.20.4)', async () => {
    const vier = Array.from({ length: 4 }, (_, nummer) => ({
      host: `s${String(nummer)}.example`,
      suchMuster: `https://s${String(nummer)}.example/?q={q}`,
    }))
    quellen({ shops: vier, webSuche: null })
    for (const [nummer] of vier.entries()) {
      doppel.antworten.set(
        `https://s${String(nummer)}.example/?q=Proteinriegel`,
        seite(`https://s${String(nummer)}.example/?q=Proteinriegel`, [`/p/${String(nummer)}`]),
      )
    }

    const ergebnis = await produktseiteSuchen(auftrag(), { auftragId: 'a', meldeFortschritt: () => undefined })

    expect(ergebnis.status).toBe('erfolg')
    expect(doppel.aufrufe).toHaveLength(3)
    expect(doppel.aufrufe.some((aufruf) => aufruf.includes('s3.example'))).toBe(false)
  })

  it('bietet hoechstens FUENF Treffer an, ohne doppelte Adresse', async () => {
    quellen({ shops: [SHOP_A], webSuche: null })
    doppel.antworten.set(
      'https://a.example/s?q=Proteinriegel',
      seite(
        'https://a.example/s?q=Proteinriegel',
        ['/p/1', '/p/2', '/p/3', '/p/4', '/p/5', '/p/6', '/p/1', '/p/2'],
      ),
    )

    const ergebnis = await produktseiteSuchen(auftrag(), { auftragId: 'a', meldeFortschritt: () => undefined })

    expect(ergebnis.status).toBe('erfolg')
    if (ergebnis.status !== 'erfolg') return
    const daten = ergebnis.ergebnis as { treffer: Array<{ url: string }> }
    expect(daten.treffer).toHaveLength(5)
    expect(new Set(daten.treffer.map((eintrag) => eintrag.url)).size).toBe(5)
  })

  it('befragt den naechsten Shop, wenn einer nicht antwortet - und meldet erst danach den Grund', async () => {
    quellen({ shops: [SHOP_A, SHOP_B], webSuche: null })
    // SHOP_A fehlt in der Antwortliste -> die Attrappe liefert `kein_netz`.
    doppel.antworten.set(
      'https://b.example/s?q=Proteinriegel',
      seite('https://b.example/s?q=Proteinriegel', ['/produkt/2']),
    )

    const ergebnis = await produktseiteSuchen(auftrag(), { auftragId: 'a', meldeFortschritt: () => undefined })

    expect(ergebnis.status).toBe('erfolg')
    expect(doppel.aufrufe).toEqual([
      'https://a.example/s?q=Proteinriegel',
      'https://b.example/s?q=Proteinriegel',
    ])
  })

  it('meldet http_fehler MIT Status, wenn die Suchseite 404 liefert', async () => {
    quellen({ shops: [SHOP_A], webSuche: null })
    doppel.antworten.set('https://a.example/s?q=Proteinriegel', {
      ok: true,
      wert: { url: 'https://a.example/s?q=Proteinriegel', status: 404, contentType: 'text/html', bytes: Buffer.alloc(0), weiter: null },
    })

    const ergebnis = await produktseiteSuchen(auftrag(), { auftragId: 'a', meldeFortschritt: () => undefined })

    expect(ergebnis.status).toBe('fehlgeschlagen')
    if (ergebnis.status !== 'fehlgeschlagen') return
    expect(ergebnis.fehler.code).toBe('http_fehler')
    expect(ergebnis.fehler.meldung).toContain('404')
  })

  it('sagt OHNE Quelle, dass keine hinterlegt ist - und laedt nichts', async () => {
    quellen({})
    const ergebnis = await produktseiteSuchen(auftrag(), { auftragId: 'a', meldeFortschritt: () => undefined })

    expect(ergebnis.status).toBe('fehlgeschlagen')
    if (ergebnis.status !== 'fehlgeschlagen') return
    expect(ergebnis.fehler.code).toBe('keine_treffer')
    expect(ergebnis.fehler.meldung).toContain('keine Shops')
    expect(doppel.aufrufe).toEqual([])
  })

  it('meldet den Zeitgrund im Klartext, wenn keine Seite antwortet', async () => {
    quellen({ shops: [SHOP_A], webSuche: null })
    doppel.antworten.set('https://a.example/s?q=Proteinriegel', {
      ok: false,
      fehler: { code: 'zeitueberschreitung', meldung: 'zeitueberschreitung' },
    })

    const ergebnis = await produktseiteSuchen(auftrag(), { auftragId: 'a', meldeFortschritt: () => undefined })

    expect(ergebnis.status).toBe('fehlgeschlagen')
    if (ergebnis.status !== 'fehlgeschlagen') return
    expect(ergebnis.fehler.code).toBe('zeitueberschreitung')
    expect(ergebnis.fehler.meldung).toContain('20 s')
  })

  it('weist ein leeres Stichwort ab, bevor irgendetwas geladen wird', async () => {
    quellen({ shops: [SHOP_A] })
    const ergebnis = await produktseiteSuchen(auftrag('   '), {
      auftragId: 'a',
      meldeFortschritt: () => undefined,
    })

    expect(ergebnis.status).toBe('fehlgeschlagen')
    if (ergebnis.status !== 'fehlgeschlagen') return
    expect(ergebnis.fehler.code).toBe('ungueltige_eingabe')
    expect(doppel.aufrufe).toEqual([])
  })

  it('meldet Fortschritt, damit die Warteschlange etwas anzeigen kann', async () => {
    quellen({ shops: [SHOP_A], webSuche: null })
    doppel.antworten.set(
      'https://a.example/s?q=Proteinriegel',
      seite('https://a.example/s?q=Proteinriegel', ['/produkt/1']),
    )
    const stufen: Array<number | null> = []

    await produktseiteSuchen(auftrag(), {
      auftragId: 'a',
      meldeFortschritt: (prozent) => stufen.push(prozent),
    })

    expect(stufen[0]).toBe(5)
    expect(stufen.at(-1)).toBe(95)
  })

  it('sagt es, wenn die Konfiguration nicht lesbar ist - ohne Netzaufruf', async () => {
    doppel.konfigFehler = true
    const ergebnis = await produktseiteSuchen(auftrag(), { auftragId: 'a', meldeFortschritt: () => undefined })

    expect(ergebnis.status).toBe('fehlgeschlagen')
    if (ergebnis.status !== 'fehlgeschlagen') return
    expect(ergebnis.fehler.meldung).toContain('Konfiguration')
    expect(doppel.aufrufe).toEqual([])
  })
})
