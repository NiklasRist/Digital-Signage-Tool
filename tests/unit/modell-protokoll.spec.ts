// [main] Das Protokoll `modell://` (13.11.2026, #474 / FA-29)
//
// Geprueft wird VERHALTEN an der Aussengrenze: Was kommt aus dem Renderer herein, und
// was beantwortet der Handler. Die Zusage des Issues ist eng: GENAU die festen Namen,
// kein Pfad aus der Anfrage, kein Verzeichnis, kein Zutritt zu irgendetwas anderem.
//
// `electron` ist gemockt (wie in `marken-protokoll.spec.ts`), weil die Quelle `protocol`
// und `app` importiert. Der Mock kennt `handle` und `getAppPath` - ein zweiter
// Registrier-Aufruf (`registerSchemesAsPrivileged`) scheiterte hier laut als TypeError.
//
// Die Dateien liegen ECHT im Temp-Verzeichnis: Ein Test, der `readFile` ersetzt, prueft
// nicht, ob die Pfade stimmen - und genau die sind hier der Punkt.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

const gehoben = vi.hoisted(() => ({ appPfad: '' }))


vi.mock('electron', () => ({
  protocol: { handle: vi.fn() },
  app: { getAppPath: () => gehoben.appPfad },
}))

const { protocol } = await import('electron')
const {
  MODELL_SCHEMA,
  behandleModellAnfrage,
  registriereModellProtokollHandler,
  setzeModellWurzel,
} = await import('../../src/main/modell-protokoll')

const BASIS = mkdtempSync(path.join(os.tmpdir(), 'ds-modell-'))
gehoben.appPfad = BASIS
setzeModellWurzel(BASIS)

const MODELL_BYTES = Buffer.from([0x08, 0x01, 0x12, 0x02, 0xff, 0xfe])
const LAUFZEIT_BYTES = Buffer.from([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00])

mkdirSync(path.join(BASIS, 'public', 'modell'), { recursive: true })
mkdirSync(path.join(BASIS, 'node_modules', 'onnxruntime-web', 'dist'), { recursive: true })
writeFileSync(path.join(BASIS, 'public', 'modell', 'freistellen.onnx'), MODELL_BYTES)
writeFileSync(
  path.join(BASIS, 'node_modules', 'onnxruntime-web', 'dist', 'ort-wasm-simd-threaded.wasm'),
  LAUFZEIT_BYTES,
)
// Eine Datei, die NIEMALS ausgeliefert werden darf - sie liegt neben dem Modell.
writeFileSync(path.join(BASIS, 'public', 'modell', 'geheim.onnx'), Buffer.from([0x42]))

afterAll(() => {
  rmSync(BASIS, { recursive: true, force: true })
  delete process.env['VITE_DEV_SERVER_URL']
})

beforeEach(() => {
  vi.mocked(protocol.handle).mockClear()
  process.env['VITE_DEV_SERVER_URL'] = 'http://localhost:5173'
})

function anfrage(url: string, methode = 'GET'): Request {
  return new Request(url, { method: methode })
}

describe('MODELL_SCHEMA (#474)', () => {
  it('meldet die fuenf Rechte wie marken:// - inklusive corsEnabled', () => {
    expect(MODELL_SCHEMA.scheme).toBe('modell')
    expect(MODELL_SCHEMA.privileges).toEqual({
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      corsEnabled: true,
    })
  })

  it('registriert den Handler fuer genau dieses Schema', () => {
    registriereModellProtokollHandler()
    expect(protocol.handle).toHaveBeenCalledTimes(1)
    expect(protocol.handle).toHaveBeenCalledWith('modell', behandleModellAnfrage)
  })
})

describe('die zwei festen Ziele', () => {
  it('liefert das Modell byte-gleich aus', async () => {
    const antwort = await behandleModellAnfrage(anfrage('modell://freistellen.onnx'))
    expect(antwort.status).toBe(200)
    expect(antwort.headers.get('content-type')).toBe('application/octet-stream')
    expect(antwort.headers.get('x-content-type-options')).toBe('nosniff')
    expect(Buffer.from(await antwort.arrayBuffer())).toEqual(MODELL_BYTES)
  })

  it('liefert die WASM-Runtime mit dem richtigen Typ aus', async () => {
    const antwort = await behandleModellAnfrage(anfrage('modell://ort-wasm-simd-threaded.wasm'))
    expect(antwort.status).toBe(200)
    expect(antwort.headers.get('content-type')).toBe('application/wasm')
    expect(Buffer.from(await antwort.arrayBuffer())).toEqual(LAUFZEIT_BYTES)
  })

  it('kennt im gepackten Lauf die Dateien im Renderer-Ordner', async () => {
    // Gepackt: `dist/renderer/...` innerhalb von app.asar, NICHT `public/`.
    delete process.env['VITE_DEV_SERVER_URL']
    mkdirSync(path.join(BASIS, 'dist', 'renderer', 'modell'), { recursive: true })
    writeFileSync(path.join(BASIS, 'dist', 'renderer', 'modell', 'freistellen.onnx'), MODELL_BYTES)
    writeFileSync(
      path.join(BASIS, 'dist', 'renderer', 'ort-wasm-simd-threaded.wasm'),
      LAUFZEIT_BYTES,
    )

    const modell = await behandleModellAnfrage(anfrage('modell://freistellen.onnx'))
    const laufzeit = await behandleModellAnfrage(anfrage('modell://ort-wasm-simd-threaded.wasm'))
    expect(modell.status).toBe(200)
    expect(laufzeit.status).toBe(200)
  })
})

describe('alles andere ist 404 oder 405', () => {
  const VERBOTEN = [
    'modell://geheim.onnx',
    'modell://freistellen.onnx.bak',
    'modell://%2e%2e%2ffreistellen.onnx',
    'modell://unterordner/freistellen.onnx',
    'modell://freistellen.onnx?x=1',
    'modell://freistellen.onnx#frag',
    'modell://freistellen.onnx:8080',
    // Der Name steht im HOST (standard-Schema); ein Pfad daneben ist eine andere Adresse.
    // (`modell://freistellen.onnx/` fehlt hier ABSICHTLICH: nach der URL-Regel ist der
    // Schraegstrich am Ende dieselbe Adresse - gleicher Host, Pfad "/".)
    'modell://unterordner/../freistellen.onnx',
    'media://freistellen.onnx',
    'modell://',
  ]

  for (const url of VERBOTEN) {
    it(`antwortet 404 fuer ${url}`, async () => {
      const antwort = await behandleModellAnfrage(anfrage(url))
      expect(antwort.status).toBe(404)
      // KEIN Pfad, kein Name aus der Anfrage im Text - der Handler spiegelt nichts zurueck.
      const text = await antwort.text()
      expect(text).not.toContain('freistellen')
      expect(text).not.toContain(BASIS)
    })
  }

  it('weist jede andere Methode mit 405 ab - ohne die Platte anzufassen', async () => {
    const antwort = await behandleModellAnfrage(anfrage('modell://freistellen.onnx', 'POST'))
    expect(antwort.status).toBe(405)
  })

  it('antwortet 404, wenn die Datei fehlt - und wirft nicht', async () => {
    const leer = mkdtempSync(path.join(os.tmpdir(), 'ds-modell-leer-'))
    setzeModellWurzel(leer)
    try {
      const antwort = await behandleModellAnfrage(anfrage('modell://freistellen.onnx'))
      expect(antwort.status).toBe(404)
    } finally {
      setzeModellWurzel(BASIS)
setzeModellWurzel(BASIS)
      rmSync(leer, { recursive: true, force: true })
    }
  })
})
