// Der Auftrag `produktfoto-abruf` (FA-27 / TK 9.19) - mit gedeckter Netzschicht.
//
// Das Netz selbst hat seinen eigenen Test (`produktfoto-netz.spec.ts`, inklusive der
// Loopback-Gegenprobe). Hier wird der Ablauf geprueft: Seite lesen, Kandidaten laden,
// ablegen, Klartext-Fehler - und dass NICHT mehr als fuenf Kandidaten entstehen.
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { Auftrag } from '../../src/shared/contracts/auftrag'
import type { Ergebnis } from '../../src/shared/contracts/ergebnis'
import type { NetzAntwort, NetzFehlercode } from '../../src/main/produktfoto/netz'

const doppel = vi.hoisted(() => ({
  antworten: new Map<string, unknown>(),
  aufrufe: [] as string[],
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

const { produktfotoAbrufen } = await import('../../src/main/produktfoto/produktfoto-abrufen')
const { holeAbruf, leereAbrufe } = await import('../../src/main/produktfoto/kandidaten-speicher')

function ok(url: string, contentType: string, bytes = 'BILD'): Ergebnis<NetzAntwort, NetzFehlercode> {
  return {
    ok: true,
    wert: { url, status: 200, contentType, bytes: Buffer.from(bytes), weiter: null },
  }
}

function html(seite: string, koerper: string): Ergebnis<NetzAntwort, NetzFehlercode> {
  return ok(seite, 'text/html; charset=utf-8', koerper)
}

function auftrag(produktUrl = 'https://shop.example/produkt/42'): Extract<Auftrag, { art: 'produktfoto-abruf' }> {
  return {
    auftragId: 'auftrag-1',
    art: 'produktfoto-abruf',
    status: 'laeuft',
    label: 'Produktfoto',
    payload: { projektId: 'p-1', aktionId: 'a-1', produktUrl },
    fortschritt: null,
    versuche: 1,
    fehler: null,
    ergebnis: null,
    erstelltAm: '2026-11-12T10:00:00.000Z',
  }
}

const kontext = { auftragId: 'auftrag-1', meldeFortschritt: (): void => undefined }

afterEach(() => {
  doppel.antworten.clear()
  doppel.aufrufe.length = 0
  leereAbrufe()
})

describe('produktfotoAbrufen (FA-27)', () => {
  it('laedt die Seite, liest Product.image und legt den Kandidaten ab', async () => {
    doppel.antworten.set(
      'https://shop.example/produkt/42',
      html(
        'https://shop.example/produkt/42',
        `<script type="application/ld+json">{"@type":"Product","image":"https://cdn.example/a.jpg"}</script>`,
      ),
    )
    doppel.antworten.set('https://cdn.example/a.jpg', ok('https://cdn.example/a.jpg', 'image/jpeg'))

    const ergebnis = await produktfotoAbrufen(auftrag(), kontext)

    expect(ergebnis.status).toBe('erfolg')
    if (ergebnis.status !== 'erfolg') return
    const daten = ergebnis.ergebnis as { abrufId: string; kandidaten: Array<{ index: number; url: string; typ: string; groesse: number }> }
    expect(daten.kandidaten).toEqual([
      { index: 0, url: 'https://cdn.example/a.jpg', typ: 'image/jpeg', groesse: 4 },
    ])
    const gespeichert = holeAbruf(daten.abrufId)
    expect(gespeichert?.kandidaten[0]?.bytes.toString()).toBe('BILD')
    expect(gespeichert?.projektId).toBe('p-1')
    expect(gespeichert?.aktionId).toBe('a-1')
  })

  it('sammelt HOECHSTENS fuenf Kandidaten, auch wenn die Seite mehr anbietet', async () => {
    const adressen = Array.from({ length: 7 }, (_, i) => `https://cdn.example/${i}.jpg`)
    doppel.antworten.set(
      'https://shop.example/produkt/42',
      html(
        'https://shop.example/produkt/42',
        `<script type="application/ld+json">{"@type":"Product","image":${JSON.stringify(adressen)}}</script>`,
      ),
    )
    for (const adresse of adressen) {
      doppel.antworten.set(adresse, ok(adresse, 'image/jpeg'))
    }

    const ergebnis = await produktfotoAbrufen(auftrag(), kontext)

    expect(ergebnis.status).toBe('erfolg')
    if (ergebnis.status !== 'erfolg') return
    const daten = ergebnis.ergebnis as { kandidaten: unknown[] }
    expect(daten.kandidaten).toHaveLength(5)
  })

  it('meldet "kein Produktbild" als Klartext, wenn die Seite nichts hergibt', async () => {
    doppel.antworten.set(
      'https://shop.example/produkt/42',
      html('https://shop.example/produkt/42', '<html><body>leer</body></html>'),
    )

    const ergebnis = await produktfotoAbrufen(auftrag(), kontext)

    expect(ergebnis.status).toBe('fehlgeschlagen')
    if (ergebnis.status !== 'fehlgeschlagen') return
    expect(ergebnis.fehler.code).toBe('kein_bild')
    expect(ergebnis.fehler.meldung).toContain('kein Produktbild')
  })

  it('uebernimmt den Klartext bei fehlender Verbindung', async () => {
    const ergebnis = await produktfotoAbrufen(auftrag('https://ohne-antwort.example/x'), kontext)

    expect(ergebnis.status).toBe('fehlgeschlagen')
    if (ergebnis.status !== 'fehlgeschlagen') return
    expect(ergebnis.fehler.code).toBe('kein_netz')
    expect(ergebnis.fehler.meldung).toContain('Keine Verbindung')
  })

  it('ueberspringt ein Bild mit unzulaessigem Format und nimmt den naechsten', async () => {
    doppel.antworten.set(
      'https://shop.example/produkt/42',
      html(
        'https://shop.example/produkt/42',
        `<script type="application/ld+json">{"@type":"Product","image":["https://cdn.example/a.gif","https://cdn.example/b.png"]}</script>`,
      ),
    )
    doppel.antworten.set('https://cdn.example/a.gif', ok('https://cdn.example/a.gif', 'image/gif'))
    doppel.antworten.set('https://cdn.example/b.png', ok('https://cdn.example/b.png', 'image/png'))

    const ergebnis = await produktfotoAbrufen(auftrag(), kontext)

    expect(ergebnis.status).toBe('erfolg')
    if (ergebnis.status !== 'erfolg') return
    const daten = ergebnis.ergebnis as { kandidaten: Array<{ url: string }> }
    expect(daten.kandidaten.map((k) => k.url)).toEqual(['https://cdn.example/b.png'])
  })

  it('scheitert mit "Format", wenn KEIN Kandidat brauchbar ist', async () => {
    doppel.antworten.set(
      'https://shop.example/produkt/42',
      html(
        'https://shop.example/produkt/42',
        `<script type="application/ld+json">{"@type":"Product","image":["https://cdn.example/a.gif"]}</script>`,
      ),
    )
    doppel.antworten.set('https://cdn.example/a.gif', ok('https://cdn.example/a.gif', 'image/gif'))

    const ergebnis = await produktfotoAbrufen(auftrag(), kontext)

    expect(ergebnis.status).toBe('fehlgeschlagen')
    if (ergebnis.status !== 'fehlgeschlagen') return
    expect(ergebnis.fehler.code).toBe('format')
    expect(ergebnis.fehler.meldung).toContain('Format')
  })

  it('weist eine Adresse ohne http(s) ab, ohne das Netz zu beruehren', async () => {
    const ergebnis = await produktfotoAbrufen(auftrag('file:///etc/passwd'), kontext)

    expect(ergebnis.status).toBe('fehlgeschlagen')
    if (ergebnis.status !== 'fehlgeschlagen') return
    expect(ergebnis.fehler.code).toBe('ungueltige_eingabe')
    expect(doppel.aufrufe).toEqual([])
  })

  it('meldet eine Seite ohne HTML als "keine Produktseite"', async () => {
    doppel.antworten.set(
      'https://shop.example/produkt/42',
      ok('https://shop.example/produkt/42', 'application/pdf', '%PDF'),
    )

    const ergebnis = await produktfotoAbrufen(auftrag(), kontext)

    expect(ergebnis.status).toBe('fehlgeschlagen')
    if (ergebnis.status !== 'fehlgeschlagen') return
    expect(ergebnis.fehler.code).toBe('keine_seite')
  })
})
