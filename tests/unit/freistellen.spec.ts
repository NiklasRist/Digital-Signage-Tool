// [template-canvas] Freistellen - Laden, Merken, Ausfall (13.11.2026, FA-29 / TK 9.21.5)
//
// Geprueft werden die Zusagen, die man OHNE Modell pruefen kann - und genau das sind die
// teuren: LAZY (nichts beim Start), EINMAL (auch ein Fehlschlag wird gemerkt), und der
// AUSFALL IST EIN ZUSTAND (ein Klartext, kein Wurf). Der Erfolgsweg mit echten Pixeln
// steht am Fenster (Treiber) - ein Pixel-Test gegen einen nachgebauten Canvas pruefte den
// Ersatz, nicht das Modell.
//
// `onnxruntime-web` ist ein Doppel: Die echte Runtime braucht ein WASM-Binary und einen
// Browser; hier interessiert nur, WANN und WIE sie gerufen wird.

// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const ortDoppel = vi.hoisted(() => ({
  create: vi.fn(),
  run: vi.fn(),
  env: { wasm: { wasmPaths: '', numThreads: 0, proxy: true } },
}))

vi.mock('onnxruntime-web/wasm', () => ({
  env: ortDoppel.env,
  InferenceSession: { create: ortDoppel.create },
  Tensor: class {
    constructor(
      public typ: string,
      public daten: Float32Array,
      public dims: number[],
    ) {}
  },
}))

// LAZY WIRD BEIM IMPORT GEMESSEN, nicht spaeter: `vi.stubGlobal` gilt ab dieser Zeile,
// und der Zaehler steht VOR dem dynamischen Import. Ohne diese Reihenfolge koennte ein
// Modell, das beim Laden des Moduls geholt wird, unbemerkt bleiben - die Zaehler werden
// in `beforeEach` zurueckgesetzt, das Ereignis laege davor.
// (GEMESSEN am 13.11.2026: Genau so war die erste Fassung dieses Tests gruen, obwohl
// eine Gegenprobe das Modell beim Import lud. Erst der Zaehler vor dem Import macht ihn rot.)
const importZaehler = vi.hoisted(() => ({ fetch: 0 }))
vi.stubGlobal(
  'fetch',
  vi.fn(async () => {
    importZaehler.fetch += 1;
    throw new Error('kein modell:// beim Import')
  }),
)

const {
  FREISTELL_KLARTEXT,
  freistellAusfall,
  istFreistellModellBereit,
  ladeFreistellModell,
  stelleFrei,
  vergissFreistellModell,
} = await import('../../src/renderer/template-canvas/freistellen')

/** Der Stand unmittelbar nach dem Import - vor jedem `beforeEach`. */
const fetchBeimImport = importZaehler.fetch

const sitzung = { inputNames: ['input.1'], outputNames: ['ausgang'] }

function antwortOk(): Response {
  return {
    ok: true,
    arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
  } as unknown as Response
}

beforeEach(() => {
  vergissFreistellModell()
  ortDoppel.create.mockReset()
  ortDoppel.run.mockReset()
  ortDoppel.env.wasm.wasmPaths = ''
  ortDoppel.env.wasm.numThreads = 0
  ortDoppel.env.wasm.proxy = true
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => antwortOk()),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('ladeFreistellModell (#474)', () => {
  it('laedt NICHTS beim Import - erst der erste Aufruf holt das Modell', async () => {
    // Kein Aufruf vor dieser Zeile: waere das Modell beim Import geladen worden, stuende
    // hier schon ein Aufruf. Der Fetch-Zaehler steht VOR dem Import (s. o.).
    expect(fetchBeimImport).toBe(0)
    expect(ortDoppel.create).not.toHaveBeenCalled()
    expect(vi.mocked(fetch)).not.toHaveBeenCalled()
    expect(istFreistellModellBereit()).toBe(false)
    expect(freistellAusfall()).toBeNull()

    await ladeFreistellModell()

    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(fetch)).toHaveBeenCalledWith('modell://freistellen.onnx')
  })

  it('stellt die Runtime auf EINEN Thread, ohne Proxy und mit modell:// als Pfad', async () => {
    ortDoppel.create.mockResolvedValue(sitzung)
    await ladeFreistellModell()

    expect(ortDoppel.env.wasm.wasmPaths).toBe('modell://')
    expect(ortDoppel.env.wasm.numThreads).toBe(1)
    expect(ortDoppel.env.wasm.proxy).toBe(false)
    expect(istFreistellModellBereit()).toBe(true)
  })

  it('laedt EINMAL - ein zweiter Aufruf holt nichts nach', async () => {
    ortDoppel.create.mockResolvedValue(sitzung)
    await ladeFreistellModell()
    await ladeFreistellModell()
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1)
    expect(ortDoppel.create).toHaveBeenCalledTimes(1)
  })

  it('merkt einen Fehlschlag - kein zweiter Versuch je Bild, EIN Klartext', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('kein modell://')
      }),
    )

    await ladeFreistellModell()
    await ladeFreistellModell()

    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1)
    expect(freistellAusfall()).toBe(FREISTELL_KLARTEXT)
    expect(istFreistellModellBereit()).toBe(false)
  })

  it('wertet 404 als Ausfall - nicht als leeres Modell', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 404, arrayBuffer: async () => new ArrayBuffer(0) }) as unknown as Response),
    )
    await ladeFreistellModell()
    expect(ortDoppel.create).not.toHaveBeenCalled()
    expect(freistellAusfall()).toBe(FREISTELL_KLARTEXT)
  })

  it('faengt auch eine scheiternde Sitzung ab', async () => {
    ortDoppel.create.mockRejectedValue(new Error('kaputte Bytes'))
    await ladeFreistellModell()
    expect(freistellAusfall()).toBe(FREISTELL_KLARTEXT)
  })
})

describe('stelleFrei (#474)', () => {
  it('wirft nie - ohne Modell gibt es den Klartext zurueck', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('kein modell://')
      }),
    )
    const ergebnis = await stelleFrei({} as ImageBitmap, 10, 10)
    expect(ergebnis).toEqual({ status: 'nicht_verfuegbar', grund: FREISTELL_KLARTEXT })
  })

  it('meldet auch ohne Offscreen-Canvas einen Zustand statt eines Fehlers', async () => {
    // jsdom hat kein OffscreenCanvas - genau der Fall „Umgebung kann es nicht".
    ortDoppel.create.mockResolvedValue(sitzung)
    await ladeFreistellModell()
    const ergebnis = await stelleFrei({} as ImageBitmap, 10, 10)
    expect(ergebnis.status).toBe('nicht_verfuegbar')
    if (ergebnis.status === 'nicht_verfuegbar') expect(ergebnis.grund).toBe(FREISTELL_KLARTEXT)
  })

  it('lehnt unbrauchbare Masse ab, ohne zu rechnen', async () => {
    ortDoppel.create.mockResolvedValue(sitzung)
    await ladeFreistellModell()
    const ergebnis = await stelleFrei({} as ImageBitmap, 0, 0)
    expect(ergebnis.status).toBe('nicht_verfuegbar')
    expect(ortDoppel.run).not.toHaveBeenCalled()
  })
})
