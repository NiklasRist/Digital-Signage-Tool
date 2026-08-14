import { readFileSync } from 'node:fs'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Unit-Test zu #183.
//
// `electron` wird gestellt, weil der Dialog Electron gehoert: Ein echter
// `showOpenDialog`-Aufruf oeffnete ein Fenster und liesse den Testlauf haengen, bis
// jemand klickt.
//
// `leseKonfig` (#26) wird gestellt, weil sonst die ECHTE `config.json` des
// Entwicklungsrechners entschiede, ob eine Vorbelegung vorliegt - der Test waere je
// nach Maschine gruen oder rot. Ausserdem ruehrte er dann das Dateisystem an, und
// genau das darf diese Datei nicht.
//
// `setzeExportZiel` (#28) wird gestellt, obwohl `ziel-dialog.ts` es gar nicht
// importiert: Der Spy ist die Gegenprobe zum Verbot "hier wird das Ziel NICHT
// gemerkt". Wuerde jemand den Aufruf nachtraeglich einbauen, schluege der Test an.

const showOpenDialog = vi.fn()
const leseKonfig = vi.fn()
const setzeExportZiel = vi.fn()

// `node:fs/promises` wird VOLLSTAENDIG durch Spies ersetzt. Sie sind der Nachweis zum
// Verbot "hier wird nichts geprueft": Wer eine Existenz-, Rechte- oder Platzpruefung
// einbaute, muesste durch einen dieser Spies. `node:fs` bleibt echt - der Quelltest
// unten liest die Datei selbst damit.
const fsSpies = {
  access: vi.fn(),
  stat: vi.fn(),
  statfs: vi.fn(),
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
}

vi.mock('node:fs/promises', () => ({ default: fsSpies, ...fsSpies }))
vi.mock('electron', () => ({ dialog: { showOpenDialog } }))
vi.mock('../../src/main/config-store/lese-konfig', () => ({ leseKonfig }))
vi.mock('../../src/main/config-store/setze-export-ziel', () => ({ setzeExportZiel }))

const { wähleExportZiel } = await import('../../src/main/export-service/ziel-dialog')

/** Die Konfiguration, wie `leseKonfig` sie liefert - `ziel` ist das gemerkte Exportziel. */
function konfigMit(ziel: string | null) {
  return {
    ok: true,
    wert: { aktivesProjektId: null, letztesExportZiel: ziel, uiVoreinstellungen: {} },
  }
}

beforeEach(() => {
  // Vorbelegt ist standardmaessig NICHTS - der Normalfall des ersten Exports. Tests,
  // die eine Vorbelegung brauchen, setzen sie selbst.
  leseKonfig.mockResolvedValue(konfigMit(null))
  showOpenDialog.mockResolvedValue({ canceled: true, filePaths: [] })
})

afterEach(() => {
  showOpenDialog.mockReset()
  leseKonfig.mockReset()
  setzeExportZiel.mockReset()
})

interface Optionen {
  properties?: string[]
  title?: string
  defaultPath?: string
  filters?: unknown
}

/** Die `options` des ersten Aufrufs - der einzige Weg, die Vorbelegung zu pruefen. */
function letzteOptionen(): Optionen {
  const aufruf = showOpenDialog.mock.calls[0]
  if (aufruf === undefined) throw new Error('showOpenDialog wurde nicht gerufen')
  return aufruf[0] as Optionen
}

describe('Ausgang der Auswahl', () => {
  it('liefert beim Abbruch pfad null und keinen Fehler', async () => {
    showOpenDialog.mockResolvedValue({ canceled: true, filePaths: [] })
    await expect(wähleExportZiel()).resolves.toEqual({ ok: true, wert: { pfad: null } })
  })

  it('liefert bei leerer Auswahl ohne Abbruch denselben Ausgang', async () => {
    showOpenDialog.mockResolvedValue({ canceled: false, filePaths: [] })
    await expect(wähleExportZiel()).resolves.toEqual({ ok: true, wert: { pfad: null } })
  })

  it('liefert bei Auswahl den ersten Pfad', async () => {
    showOpenDialog.mockResolvedValue({ canceled: false, filePaths: ['E:\\Werbung'] })
    await expect(wähleExportZiel()).resolves.toEqual({
      ok: true,
      wert: { pfad: 'E:\\Werbung' },
    })
  })

  // Die Gegenprobe zu jeder gut gemeinten Bequemlichkeit: Ein `path.normalize`, ein
  // `trim()` oder ein vereinheitlichter Schraegstrich fiele hier auf.
  it('reicht den Pfad unveraendert durch - nicht normalisiert, nicht getrimmt', async () => {
    const roh = 'E:\\Werbung/Stick\\\\Neuer Ordner '
    showOpenDialog.mockResolvedValue({ canceled: false, filePaths: [roh] })
    await expect(wähleExportZiel()).resolves.toEqual({ ok: true, wert: { pfad: roh } })
  })

  it('ignoriert weitere Eintraege und liefert nie ein Array', async () => {
    showOpenDialog.mockResolvedValue({ canceled: false, filePaths: ['E:\\eins', 'F:\\zwei'] })
    await expect(wähleExportZiel()).resolves.toEqual({ ok: true, wert: { pfad: 'E:\\eins' } })
  })

  it('liefert bei Abbruch KEINEN leeren String', async () => {
    showOpenDialog.mockResolvedValue({ canceled: true, filePaths: [] })
    const ergebnis = await wähleExportZiel()
    if (!ergebnis.ok) throw new Error('unerwartet fehlgeschlagen')
    expect(ergebnis.wert.pfad).toBeNull()
    expect(ergebnis.wert.pfad).not.toBe('')
  })
})

describe('Vorbelegung aus dem config-store', () => {
  it('uebergibt das gemerkte Ziel als defaultPath', async () => {
    leseKonfig.mockResolvedValue(konfigMit('E:\\Werbung'))
    await wähleExportZiel()
    expect(letzteOptionen().defaultPath).toBe('E:\\Werbung')
  })

  it('setzt ohne gemerktes Ziel gar keinen defaultPath', async () => {
    leseKonfig.mockResolvedValue(konfigMit(null))
    await wähleExportZiel()
    expect('defaultPath' in letzteOptionen()).toBe(false)
  })

  it('oeffnet den Dialog auch dann, wenn leseKonfig fehlschlaegt', async () => {
    leseKonfig.mockResolvedValue({
      ok: false,
      fehler: { code: 'speicher_fehler', meldung: 'config.json ist beschaedigt' },
    })
    await expect(wähleExportZiel()).resolves.toEqual({ ok: true, wert: { pfad: null } })
    expect('defaultPath' in letzteOptionen()).toBe(false)
  })

  // Eine geworfene Ausnahme ist dieselbe Aussage wie `ok: false`, nur unhoeflicher.
  // Schlueg sie durch, bekaeme der Nutzer statt eines Dialogs eine Fehlermeldung.
  it('oeffnet den Dialog auch dann, wenn leseKonfig wirft', async () => {
    const spion = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    leseKonfig.mockRejectedValue(new Error('Datenort nicht ermittelbar'))
    await expect(wähleExportZiel()).resolves.toEqual({ ok: true, wert: { pfad: null } })
    expect('defaultPath' in letzteOptionen()).toBe(false)
    spion.mockRestore()
  })

  it('liest die Konfiguration genau einmal je Aufruf', async () => {
    await wähleExportZiel()
    expect(leseKonfig).toHaveBeenCalledTimes(1)
  })
})

describe('uebergebene Optionen', () => {
  it('waehlt einen Ordner', async () => {
    await wähleExportZiel()
    expect(letzteOptionen().properties).toContain('openDirectory')
  })

  it('setzt weder openFile noch multiSelections noch promptToCreate', async () => {
    await wähleExportZiel()
    const properties = letzteOptionen().properties ?? []
    expect(properties).not.toContain('openFile')
    expect(properties).not.toContain('multiSelections')
    expect(properties).not.toContain('promptToCreate')
  })

  it('uebergibt genau openDirectory und createDirectory', async () => {
    await wähleExportZiel()
    expect(letzteOptionen().properties).toEqual(['openDirectory', 'createDirectory'])
  })

  it('bietet keine Dateifilter an', async () => {
    await wähleExportZiel()
    expect(letzteOptionen().filters).toBeUndefined()
  })

  it('benennt den Dialog nach seinem Zweck', async () => {
    await wähleExportZiel()
    expect(letzteOptionen().title).toBe('Zielordner für den Export wählen')
  })

  it('oeffnet den Dialog genau einmal', async () => {
    await wähleExportZiel()
    expect(showOpenDialog).toHaveBeenCalledTimes(1)
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
    const ergebnis = await wähleExportZiel()
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
    const ergebnis = await wähleExportZiel()
    expect(ergebnis.ok).toBe(false)
  })

  it('vermerkt die Ausnahme im Protokoll des Hauptprozesses', async () => {
    await erwarteUnbekanntenFehler(new Error('kein Fenster bereit'))
    expect(spion).toHaveBeenCalled()
  })
})

describe('Grenzen der Datei', () => {
  // Das Ziel wird HIER nicht gemerkt (TK 9.6.5: geschrieben wird nach erfolgreichem
  // Export, #188). Der Spy deckt den Aufruf ab, die Quelltextprobe darunter auch den
  // Fall, dass jemand die Konfiguration an `setzeExportZiel` vorbei schriebe.
  it('merkt sich das Ziel nicht - weder bei Auswahl noch bei Abbruch', async () => {
    showOpenDialog.mockResolvedValue({ canceled: false, filePaths: ['E:\\Werbung'] })
    await wähleExportZiel()
    showOpenDialog.mockResolvedValue({ canceled: true, filePaths: [] })
    await wähleExportZiel()
    expect(setzeExportZiel).not.toHaveBeenCalled()
  })

  it('ruehrt das Dateisystem nicht an', async () => {
    showOpenDialog.mockResolvedValue({ canceled: false, filePaths: ['E:\\Werbung'] })
    await wähleExportZiel()
    for (const spy of Object.values(fsSpies)) expect(spy).not.toHaveBeenCalled()
  })

  const quelle = readFileSync(
    new URL('../../src/main/export-service/ziel-dialog.ts', import.meta.url),
    'utf8',
  )

  // Ohne Kommentarzeilen, sonst schlagen die Verbots-Vermerke im Kopf der Datei an.
  const code = quelle
    .split('\n')
    .filter((zeile) => !/^\s*(\/\/|\/?\*)/.test(zeile))
    .join('\n')

  it.each([
    'node:fs',
    'existsSync',
    'statfs',
    'setzeExportZiel',
    'schreibeConfig',
    'reiheEin',
    'BrowserWindow',
    'ipcMain',
    'loeseAusgabePfad',
    'homedir',
  ])('benutzt %s nicht', (verboten) => {
    expect(code).not.toContain(verboten)
  })
})
