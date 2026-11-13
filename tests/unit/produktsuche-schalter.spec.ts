// [action-editor] Das Suchfeld im Schritt „Bild" (#472, FA-30 / TK 9.20.1)
//
// Geprueft wird das BAUTEIL - der Auftrag und die Netzschicht haben eigene Tests. Die
// Zusagen hier:
//   1. Das Stichwort ist mit dem Titel VORBELEGT und ueberschreibbar.
//   2. Ohne hinterlegte Quelle sagt es das VOR dem Klick und sperrt den Knopf.
//   3. Ein Treffer-Klick uebernimmt NUR die Adresse - es wird nichts geholt.
//   4. Ein Fehlschlag loest die Sperre (Befund vom 13.11.2026, s. Nachlauf).

// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

const doppel = vi.hoisted(() => ({
  quellen: { shops: [], webSuche: null } as unknown,
  aufrufe: [] as Array<{ projektId: string; aktionId: string; stichwort: string }>,
  antwort: { ok: true, wert: { auftragId: 'auftrag-1' } } as unknown,
}))

vi.mock('../../src/renderer/action-editor/produktsuche', () => ({
  ladeProduktQuellen: async (): Promise<unknown> => doppel.quellen,
  starteProduktsuche: async (
    projektId: string,
    aktionId: string,
    stichwort: string,
  ): Promise<unknown> => {
    doppel.aufrufe.push({ projektId, aktionId, stichwort })
    return doppel.antwort
  },
}))

const { ProduktsucheFeld } = await import('../../src/renderer/action-editor/produktsuche-feld')
const { meldeProduktsuche, verbraucheProduktsuche } = await import(
  '../../src/renderer/action-editor/produktsuche-meldung'
)

const GERAETE: Array<{ wurzel: Root; behaelter: HTMLDivElement }> = []

interface Geraet {
  behaelter: HTMLDivElement
  uebernommen: string[]
}

async function montiere(titel = 'Proteinriegel 500g', aktionId = 'a-1'): Promise<Geraet> {
  const behaelter = document.createElement('div')
  document.body.appendChild(behaelter)
  const wurzel = createRoot(behaelter)
  GERAETE.push({ wurzel, behaelter })
  const uebernommen: string[] = []
  await act(async () => {
    wurzel.render(
      createElement(ProduktsucheFeld, {
        projektId: 'p-1',
        aktionId,
        titel,
        aufUebernehmen: (url: string) => {
          uebernommen.push(url)
        },
      }),
    )
  })
  // Der Konfigurations-Leser ist ein Promise - einmal durchlaufen lassen.
  await act(async () => undefined)
  return { behaelter, uebernommen }
}

function feld(behaelter: HTMLDivElement): HTMLInputElement {
  const eingabe = behaelter.querySelector<HTMLInputElement>('[data-testid="produkt-suche-stichwort"]')
  if (eingabe === null) throw new Error('Stichwortfeld fehlt')
  return eingabe
}

function knopf(behaelter: HTMLDivElement): HTMLButtonElement {
  const gefunden = behaelter.querySelector<HTMLButtonElement>('[data-testid="produkt-suche-knopf"]')
  if (gefunden === null) throw new Error('Suchknopf fehlt')
  return gefunden
}

afterEach(() => {
  for (const geraet of GERAETE.splice(0)) {
    act(() => geraet.wurzel.unmount())
    geraet.behaelter.remove()
  }
  verbraucheProduktsuche()
})

beforeEach(() => {
  doppel.quellen = { shops: [], webSuche: null }
  doppel.aufrufe.length = 0
  doppel.antwort = { ok: true, wert: { auftragId: 'auftrag-1' } }
})

describe('ProduktsucheFeld (FA-30)', () => {
  it('ist mit dem Titel vorbelegt und laesst sich ueberschreiben', async () => {
    doppel.quellen = { shops: [{ host: 'a.example', suchMuster: 'https://a.example/?q={q}' }], webSuche: null }
    const { behaelter } = await montiere()
    expect(feld(behaelter).value).toBe('Proteinriegel 500g')

    const setzeWert = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
    await act(async () => {
      setzeWert?.call(feld(behaelter), 'Schoko')
      feld(behaelter).dispatchEvent(new Event('input', { bubbles: true }))
    })

    expect(feld(behaelter).value).toBe('Schoko')
  })

  it('sagt OHNE Quelle vor dem Klick Bescheid und sperrt den Knopf', async () => {
    const { behaelter } = await montiere()

    expect(behaelter.querySelector('[data-testid="produkt-suche-ohne-quelle"]')).not.toBeNull()
    expect(knopf(behaelter).disabled).toBe(true)
    expect(doppel.aufrufe).toEqual([])
  })

  it('reiht die Suche mit getrimmtem Stichwort und LEERER Aktionskennung ein', async () => {
    doppel.quellen = { shops: [{ host: 'a.example', suchMuster: 'https://a.example/?q={q}' }], webSuche: null }
    const { behaelter } = await montiere('Riegel', '')

    await act(async () => {
      knopf(behaelter).click()
    })

    expect(doppel.aufrufe).toEqual([{ projektId: 'p-1', aktionId: '', stichwort: 'Riegel' }])
  })

  it('zeigt die Treffer und uebernimmt beim Klick NUR die Adresse', async () => {
    doppel.quellen = { shops: [{ host: 'a.example', suchMuster: 'https://a.example/?q={q}' }], webSuche: null }
    const { behaelter, uebernommen } = await montiere()

    await act(async () => {
      knopf(behaelter).click()
    })
    await act(async () => {
      meldeProduktsuche({
        status: 'erfolg',
        auftragId: 'auftrag-1',
        treffer: [{ url: 'https://a.example/produkt/1', titel: 'Riegel A', host: 'a.example' }],
      })
    })

    const trefferKnopf = behaelter.querySelector('[data-testid="produkt-suche-treffer-0"]')
    expect(trefferKnopf?.textContent).toContain('Riegel A')
    expect(trefferKnopf?.textContent).toContain('a.example')
    // Treffer aus einem hinterlegten Shop: KEIN Notweg-Vermerk.
    expect(behaelter.querySelector('[data-testid="produkt-suche-quelle"]')).toBeNull()

    await act(async () => {
      behaelter.querySelector<HTMLButtonElement>('[data-testid="produkt-suche-treffer-0"]')?.click()
    })

    expect(uebernommen).toEqual(['https://a.example/produkt/1'])
    // Die Liste ist weg - die Adresse steht jetzt im Feld „Produkt-URL" darunter.
    expect(behaelter.querySelector('[data-testid="produkt-suche-treffer"]')).toBeNull()
  })

  it('kennzeichnet Treffer aus der allgemeinen Suche als Notweg', async () => {
    doppel.quellen = {
      shops: [{ host: 'a.example', suchMuster: 'https://a.example/?q={q}' }],
      webSuche: 'https://suche.example/?q={q}',
    }
    const { behaelter } = await montiere()

    await act(async () => {
      knopf(behaelter).click()
    })
    await act(async () => {
      meldeProduktsuche({
        status: 'erfolg',
        auftragId: 'auftrag-1',
        treffer: [{ url: 'https://fremd.example/produkt/9', titel: 'Fremd', host: 'fremd.example' }],
      })
    })

    const vermerk = behaelter.querySelector('[data-testid="produkt-suche-quelle"]')
    expect(vermerk?.textContent).toContain('kann ausfallen')
  })

  it('loest die Sperre nach einem Fehlschlag wieder', async () => {
    doppel.quellen = { shops: [{ host: 'a.example', suchMuster: 'https://a.example/?q={q}' }], webSuche: null }
    const { behaelter } = await montiere()

    await act(async () => {
      knopf(behaelter).click()
    })
    expect(knopf(behaelter).disabled).toBe(true)

    await act(async () => {
      meldeProduktsuche({ status: 'fehler', auftragId: 'auftrag-1' })
    })

    expect(knopf(behaelter).disabled).toBe(false)
    expect(behaelter.querySelector('[data-testid="produkt-suche-hinweis"]')).not.toBeNull()
  })

  it('ignoriert die Meldung eines FREMDEN Auftrags', async () => {
    doppel.quellen = { shops: [{ host: 'a.example', suchMuster: 'https://a.example/?q={q}' }], webSuche: null }
    const { behaelter } = await montiere()

    await act(async () => {
      knopf(behaelter).click()
    })
    await act(async () => {
      meldeProduktsuche({
        status: 'erfolg',
        auftragId: 'auftrag-9',
        treffer: [{ url: 'https://a.example/produkt/9', titel: 'Fremd', host: 'a.example' }],
      })
    })

    expect(behaelter.querySelector('[data-testid="produkt-suche-treffer"]')).toBeNull()
    expect(knopf(behaelter).disabled).toBe(true)
  })
})
