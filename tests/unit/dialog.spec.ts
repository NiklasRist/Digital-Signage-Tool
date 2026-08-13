import { readFileSync } from 'node:fs'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { FORMAT_WHITELIST } from '../../src/shared/contracts/asset'

// Unit-Test zu #81.
//
// `electron` wird gestellt, weil der Dialog Electron gehoert: Ein echter
// `showOpenDialog`-Aufruf oeffnete ein Fenster und liesse den Testlauf haengen, bis
// jemand klickt.

const showOpenDialog = vi.fn()

vi.mock('electron', () => ({ dialog: { showOpenDialog } }))

const { öffneMedienDialog } = await import('../../src/main/media-service/dialog')

afterEach(() => {
  showOpenDialog.mockReset()
})

interface Optionen {
  properties?: string[]
  filters?: { name: string; extensions: string[] }[]
  title?: string
  defaultPath?: string
}

/** Die `options` des ersten Aufrufs - der einzige Weg, den Filter zu pruefen. */
function letzteOptionen(): Optionen {
  const aufruf = showOpenDialog.mock.calls[0]
  if (aufruf === undefined) throw new Error('showOpenDialog wurde nicht gerufen')
  return aufruf[0] as Optionen
}

/** Ein Lauf, dessen Ausgang nicht interessiert - es zaehlen die uebergebenen Optionen. */
async function optionenNachLauf(): Promise<Optionen> {
  showOpenDialog.mockResolvedValue({ canceled: true, filePaths: [] })
  await öffneMedienDialog()
  return letzteOptionen()
}

describe('Ausgang der Auswahl', () => {
  it('liefert beim Abbruch ein leeres Array und keinen Fehler', async () => {
    showOpenDialog.mockResolvedValue({ canceled: true, filePaths: [] })
    await expect(öffneMedienDialog()).resolves.toEqual({ ok: true, wert: { pfade: [] } })
  })

  it('liefert bei leerer Auswahl ohne Abbruch denselben Ausgang', async () => {
    showOpenDialog.mockResolvedValue({ canceled: false, filePaths: [] })
    await expect(öffneMedienDialog()).resolves.toEqual({ ok: true, wert: { pfade: [] } })
  })

  it('reicht mehrere Pfade unveraendert und in derselben Reihenfolge durch', async () => {
    showOpenDialog.mockResolvedValue({
      canceled: false,
      filePaths: ['C:\\a\\x.mp4', 'C:\\a\\y.png'],
    })
    await expect(öffneMedienDialog()).resolves.toEqual({
      ok: true,
      wert: { pfade: ['C:\\a\\x.mp4', 'C:\\a\\y.png'] },
    })
  })

  it('sortiert, dedupliziert und normalisiert die Pfade nicht', async () => {
    const roh = ['C:\\z\\b.mp4', 'C:\\a/gemischt.mp4', 'C:\\z\\b.mp4', 'C:\\a\\a.mp4']
    showOpenDialog.mockResolvedValue({ canceled: false, filePaths: roh })
    await expect(öffneMedienDialog()).resolves.toEqual({ ok: true, wert: { pfade: roh } })
  })
})

describe('uebergebene Optionen', () => {
  it('waehlt Dateien und erlaubt Mehrfachauswahl', async () => {
    expect((await optionenNachLauf()).properties).toEqual(
      expect.arrayContaining(['openFile', 'multiSelections']),
    )
  })

  it('setzt weder openDirectory noch promptToCreate', async () => {
    const properties = (await optionenNachLauf()).properties ?? []
    expect(properties).not.toContain('openDirectory')
    expect(properties).not.toContain('promptToCreate')
  })

  it('merkt sich keinen Ordner ueber defaultPath', async () => {
    expect((await optionenNachLauf()).defaultPath).toBeUndefined()
  })

  it('bietet drei Filter an, den kombinierten zuerst', async () => {
    expect((await optionenNachLauf()).filters?.map((f) => f.name)).toEqual([
      'Medien',
      'Videos',
      'Bilder',
    ])
  })

  it('oeffnet den Dialog genau einmal', async () => {
    await optionenNachLauf()
    expect(showOpenDialog).toHaveBeenCalledTimes(1)
  })
})

// Die Kopplung an die EINE Quelle (TK 9.4.2, TK 9.4.8 Punkt 7). Die Erwartungen werden
// aus FORMAT_WHITELIST erzeugt statt abgetippt: Kaeme der Konstanten ein Format hinzu,
// ohne dass der Dialog es anbietet, schluege dieser Block fehl - eine abgetippte Liste
// bliebe gruen, und der Dialog liefe still von der Import-Pruefung (#80) weg.
describe('Kopplung an FORMAT_WHITELIST', () => {
  const alle: string[] = [...FORMAT_WHITELIST.video, ...FORMAT_WHITELIST.bild]

  async function filterNachLauf() {
    return (await optionenNachLauf()).filters ?? []
  }

  it('fuehrt im ersten Filter alle Endungen der Whitelist', async () => {
    expect((await filterNachLauf())[0]?.extensions).toEqual(alle)
  })

  it('trennt Videos und Bilder nach der Whitelist', async () => {
    const filters = await filterNachLauf()
    expect(filters[1]?.extensions).toEqual([...FORMAT_WHITELIST.video])
    expect(filters[2]?.extensions).toEqual([...FORMAT_WHITELIST.bild])
  })

  it('nennt jede Endung ohne fuehrenden Punkt', async () => {
    const endungen = (await filterNachLauf()).flatMap((f) => f.extensions)
    expect(endungen).not.toHaveLength(0)
    for (const endung of endungen) expect(endung.startsWith('.')).toBe(false)
  })

  it('bietet keine Endung an, die nicht in der Whitelist steht', async () => {
    const endungen = (await filterNachLauf()).flatMap((f) => f.extensions)
    expect(endungen.filter((endung) => !alle.includes(endung))).toEqual([])
  })
})

describe('Ausnahme des Dialogs', () => {
  let spion: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    spion = vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    spion.mockRestore()
  })

  async function erwarteUnbekanntenFehler(ursache: unknown): Promise<string> {
    showOpenDialog.mockRejectedValue(ursache)
    const ergebnis = await öffneMedienDialog()
    expect(ergebnis.ok).toBe(false)
    if (ergebnis.ok) throw new Error('unerreichbar - oben bereits geprueft')
    expect(ergebnis.fehler.code).toBe('unbekannter_fehler')
    return ergebnis.fehler.meldung
  }

  it('gibt einen Fehlercode zurueck, statt die Ausnahme durchzureichen', async () => {
    expect(await erwarteUnbekanntenFehler(new Error('kein Fenster bereit'))).toContain(
      'kein Fenster bereit',
    )
  })

  it('haengt keinen Stacktrace an die Meldung', async () => {
    const ursache = new Error('kein Fenster bereit')
    ursache.stack = 'Error: kein Fenster bereit\n    at showOpenDialog (electron.js:12:3)'
    const meldung = await erwarteUnbekanntenFehler(ursache)
    expect(meldung).not.toContain('    at ')
    expect(meldung).not.toContain('electron.js')
  })

  it.each<[string, unknown]>([
    ['Zeichenkette', 'kaputt'],
    ['undefined', undefined],
    ['Objekt ohne Error-Form', { grund: 'kaputt' }],
  ])('faengt auch %s ab', async (_fall, ursache) => {
    await erwarteUnbekanntenFehler(ursache)
  })

  it('faengt eine Antwort ohne filePaths ab, statt zu werfen', async () => {
    showOpenDialog.mockResolvedValue({ canceled: false })
    const ergebnis = await öffneMedienDialog()
    expect(ergebnis.ok).toBe(false)
  })

  it('vermerkt die Ausnahme im Protokoll des Hauptprozesses', async () => {
    await erwarteUnbekanntenFehler(new Error('kein Fenster bereit'))
    expect(spion).toHaveBeenCalled()
  })
})

describe('Grenzen der Datei', () => {
  const quelle = readFileSync(
    new URL('../../src/main/media-service/dialog.ts', import.meta.url),
    'utf8',
  )

  // Ueber die GANZE Datei, Kommentare eingeschlossen - so verlangt es die Definition of
  // Done. Eine zweite Endungsliste bliebe sonst unbemerkt, wenn sie heute zufaellig mit
  // der Whitelist uebereinstimmt.
  it.each([...FORMAT_WHITELIST.video, ...FORMAT_WHITELIST.bild])(
    'enthaelt das Endungs-Literal %s nicht',
    (endung) => {
      expect(quelle).not.toContain(endung)
    },
  )

  it('registriert keinen Kanal', () => {
    expect(quelle).not.toContain('ipcMain')
  })

  // Ohne Kommentarzeilen, sonst schlagen die Verbots-Vermerke im Kopf der Datei an.
  const code = quelle
    .split('\n')
    .filter((zeile) => !/^\s*(\/\/|\/?\*)/.test(zeile))
    .join('\n')

  it.each(['reiheEin', 'pruefeFormat', 'BrowserWindow', 'defaultPath', 'node:fs', 'existsSync'])(
    'ruft %s nicht auf',
    (verboten) => {
      expect(code).not.toContain(verboten)
    },
  )
})
