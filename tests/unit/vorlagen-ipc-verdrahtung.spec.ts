// Verhaltenstest zu #109 - die Anmeldung der neun vorlagen-store-Kanaele.
//
// Gemockt wird `electron` (wie in project-store-verdrahtung.spec.ts) und jede der neun
// Fachoperationen. Der Wrapper #23 laeuft dagegen ECHT mit: Er ist der Weg, den die Nutzlast
// im Betrieb nimmt, und an ihm haengt die Zusage "bei ungueltiger Eingabe laeuft die Operation
// gar nicht erst an".
//
// UMLAUT-ENTSCHEIDUNG 17.08.2026 (Nutzer): Issue #109 verlangt den ASCII-Schluessel
// `loescheVorlage` fuer den String `'vorlagen:löscheVorlage'`; der gebaute Vertragstest von
// #25 (kanaele.spec.ts) verlangt aber fuer ALLE Blaetter `kanal === `${modul}:${operation}``,
// also zeichengleiche Schluessel. Der Konflikt ist zugunsten des GEBAUTEN Codes entschieden
// (wie bei `media`/`export` seit 13.08.2026): der Schluessel heisst `löscheVorlage`. Der
// Widerspruch zum Issue wird im Abschlussbericht gemeldet.
import { readFileSync } from 'node:fs'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { KANAELE } from '../../src/shared/contracts/kanaele'

type Hoerer = (ereignis: unknown, nutzlast: unknown) => Promise<unknown>

const angemeldet = new Map<string, Hoerer>()
/** JEDE Anmeldung, auch eine zweite auf demselben Kanal - die Map allein verschluckte sie. */
const anmeldungen: string[] = []

vi.mock('electron', () => ({
  ipcMain: {
    handle: (kanal: string, hoerer: Hoerer) => {
      anmeldungen.push(kanal)
      angemeldet.set(kanal, hoerer)
    },
  },
}))

const ops = vi.hoisted(() => ({
  listeVorlagen: vi.fn(),
  listeArbeitskopien: vi.fn(),
  erstelleVorlage: vi.fn(),
  oeffneZurBearbeitung: vi.fn(),
  speichereArbeitskopie: vi.fn(),
  uebernehmeInParent: vi.fn(),
  alsEigenstaendige: vi.fn(),
  verwerfeArbeitskopie: vi.fn(),
  löscheVorlage: vi.fn(),
}))

vi.mock('../../src/main/vorlagen-store/liste', () => ({
  listeVorlagen: ops.listeVorlagen,
  listeArbeitskopien: ops.listeArbeitskopien,
}))
vi.mock('../../src/main/vorlagen-store/erstelle-vorlage', () => ({
  erstelleVorlage: ops.erstelleVorlage,
}))
vi.mock('../../src/main/vorlagen-store/oeffne-zur-bearbeitung', () => ({
  oeffneZurBearbeitung: ops.oeffneZurBearbeitung,
}))
vi.mock('../../src/main/vorlagen-store/speichere-arbeitskopie', () => ({
  speichereArbeitskopie: ops.speichereArbeitskopie,
}))
vi.mock('../../src/main/vorlagen-store/uebernehme-in-parent', () => ({
  uebernehmeInParent: ops.uebernehmeInParent,
}))
vi.mock('../../src/main/vorlagen-store/als-eigenstaendige', () => ({
  alsEigenstaendige: ops.alsEigenstaendige,
}))
vi.mock('../../src/main/vorlagen-store/verwerfe-arbeitskopie', () => ({
  verwerfeArbeitskopie: ops.verwerfeArbeitskopie,
}))
vi.mock('../../src/main/vorlagen-store/loesche-vorlage', () => ({
  löscheVorlage: ops.löscheVorlage,
}))

const { verdrahteVorlagenIPC } = await import('../../src/main/vorlagen-store/ipc-verdrahtung')

// EINMAL verdrahten, wie im Bootstrap (#3).
verdrahteVorlagenIPC()

/** Ruft einen angemeldeten Kanal so auf, wie es der Renderer taete. */
function rufe(kanal: string, nutzlast?: unknown): Promise<unknown> {
  const hoerer = angemeldet.get(kanal)
  if (hoerer === undefined) throw new Error(`Kein Hoerer fuer "${kanal}" angemeldet.`)
  return hoerer({}, nutzlast)
}

const OK = { ok: true as const, wert: undefined }
const UNGUELTIG = { ok: false, fehler: { code: 'ungueltige_eingabe' } }

/** Eine minimale, formgueltige Vorlage - geprueft wird hier nur die Objekt-Form. */
function vorlage(id = 'v1'): {
  id: string
  name: string
  art: string
  höhe: number | null
  parent: string | null
  eingebaut: boolean
  zonen: unknown[]
} {
  return { id, name: 'Sommer', art: 'vollflaeche', höhe: null, parent: null, eingebaut: false, zonen: [] }
}

const QUELLE = readFileSync(
  new URL('../../src/main/vorlagen-store/ipc-verdrahtung.ts', import.meta.url),
  'utf8',
)
// Kommentare zuerst zeilen-, dann blockweise entfernen - die Grep-Proben gelten dem Code.
const CODETEIL = QUELLE.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')

beforeEach(() => {
  vi.clearAllMocks()
  for (const op of Object.values(ops)) op.mockResolvedValue(OK)
})

describe('verdrahteVorlagenIPC (#109) – die Anmeldung', () => {
  it('meldet genau die neun Kanaele aus KANAELE.vorlagen an, jeden genau einmal', () => {
    const erwartet = [
      KANAELE.vorlagen.listeVorlagen,
      KANAELE.vorlagen.listeArbeitskopien,
      KANAELE.vorlagen.erstelleVorlage,
      KANAELE.vorlagen.oeffneZurBearbeitung,
      KANAELE.vorlagen.speichereArbeitskopie,
      KANAELE.vorlagen.uebernehmeInParent,
      KANAELE.vorlagen.alsEigenstaendige,
      KANAELE.vorlagen.verwerfeArbeitskopie,
      KANAELE.vorlagen.löscheVorlage,
    ]
    expect(erwartet).toHaveLength(9)
    // #255 (pruefeVorlagenReferenzen) meldet seine Datei separat - hier darf er nicht auftauchen.
    expect(angemeldet.has('vorlagen:pruefeVorlagenReferenzen')).toBe(false)
    expect([...angemeldet.keys()].sort()).toEqual([...erwartet].sort())
    // Eine zweite Anmeldung desselben Kanals wirft erst im Betrieb - die Map allein
    // ueberschriebe sie und verdeckte den Fehler.
    expect(anmeldungen).toHaveLength(9)
  })

  it('KANAELE.vorlagen: neun Namen mit Praefix vorlagen:, Umlaut im String', () => {
    const namen = Object.values(KANAELE.vorlagen)
    expect(namen).toHaveLength(9)
    for (const name of namen) {
      expect(name.startsWith('vorlagen:')).toBe(true)
    }
    // Nutzerentscheidung 17.08.2026: Umlaut-Schluessel (gebauter Code), s. Kopfkommentar.
    expect(KANAELE.vorlagen.löscheVorlage).toBe('vorlagen:löscheVorlage')
  })

  it('laesst die vorhandenen Blaetter der Registry unberuehrt', () => {
    expect(KANAELE.queue).toEqual({
      reiheEin: 'queue:reiheEin',
      entferne: 'queue:entferne',
      wiederhole: 'queue:wiederhole',
      holeStand: 'queue:holeStand',
      geaendert: 'queue:geaendert',
      stoerung: 'queue:stoerung',
    })
    expect(KANAELE.project.erstelleProjekt).toBe('project:erstelleProjekt')
    expect(KANAELE.project.öffneProjekt).toBe('project:öffneProjekt')
    expect(KANAELE.config.leseKonfig).toBe('config:leseKonfig')
    expect(KANAELE.media.öffneMedienDialog).toBe('media:öffneMedienDialog')
    expect(KANAELE.export.wähleExportZiel).toBe('export:wähleExportZiel')
    expect(KANAELE.render.fortschritt).toBe('render:fortschritt')
    // Der zehnte vorlagen-Kanal fehlt hier BEWUSST (eigenes Issue #255).
    expect('pruefeVorlagenReferenzen' in KANAELE.vorlagen).toBe(false)
  })
})

describe('verdrahteVorlagenIPC (#109) – Nutzlasten, Aufrufe und Durchreichen', () => {
  it('ruft alsEigenstaendige mit genau (arbeitsId, name) in dieser Reihenfolge und reicht das Ergebnis unveraendert durch', async () => {
    const antwort = { ok: true as const, wert: { ...vorlage('v1'), parent: null } }
    ops.alsEigenstaendige.mockResolvedValue(antwort)

    const ergebnis = await rufe(KANAELE.vorlagen.alsEigenstaendige, {
      arbeitsId: 'ak1',
      name: 'Eigene Sommerkarte',
      unfug: true,
    })

    expect(ops.alsEigenstaendige).toHaveBeenCalledWith('ak1', 'Eigene Sommerkarte')
    expect(ergebnis).toBe(antwort)
  })

  it('ruft erstelleVorlage mit (art, höhe, name) in dieser Reihenfolge; fehlt höhe, kommt null', async () => {
    await rufe(KANAELE.vorlagen.erstelleVorlage, { art: 'split', höhe: 400, name: 'Band' })
    expect(ops.erstelleVorlage).toHaveBeenLastCalledWith('split', 400, 'Band')

    await rufe(KANAELE.vorlagen.erstelleVorlage, { art: 'vollflaeche', name: 'Ganzseite' })
    expect(ops.erstelleVorlage).toHaveBeenLastCalledWith('vollflaeche', null, 'Ganzseite')

    await rufe(KANAELE.vorlagen.erstelleVorlage, { art: 'split', höhe: null, name: 'Band leer' })
    expect(ops.erstelleVorlage).toHaveBeenLastCalledWith('split', null, 'Band leer')
  })

  it('lehnt art ausserhalb der drei Werte, einen numerischen String und NaN als höhe ab, ohne die Operation zu rufen', async () => {
    const faelle = [
      { art: 'vollflaechig', höhe: null, name: 'x' },
      { art: 'vollflaeche', höhe: '162', name: 'x' },
      { art: 'vollflaeche', höhe: NaN, name: 'x' },
    ]
    for (const nutzlast of faelle) {
      await expect(rufe(KANAELE.vorlagen.erstelleVorlage, nutzlast)).resolves.toMatchObject(UNGUELTIG)
    }
    expect(ops.erstelleVorlage).not.toHaveBeenCalled()
  })

  it('lehnt speichereArbeitskopie mit vorlage null und vorlage Array ab, ohne die Operation zu rufen', async () => {
    for (const vorlageNutzlast of [null, []]) {
      await expect(
        rufe(KANAELE.vorlagen.speichereArbeitskopie, { arbeitsId: 'ak1', vorlage: vorlageNutzlast }),
      ).resolves.toMatchObject(UNGUELTIG)
    }
    expect(ops.speichereArbeitskopie).not.toHaveBeenCalled()
  })

  it('packt die uebrigen Nutzlasten aus und reicht sie unveraendert weiter', async () => {
    const v = vorlage('ak1')
    await rufe(KANAELE.vorlagen.oeffneZurBearbeitung, { id: 'v1' })
    await rufe(KANAELE.vorlagen.speichereArbeitskopie, { arbeitsId: 'ak1', vorlage: v })
    await rufe(KANAELE.vorlagen.uebernehmeInParent, { arbeitsId: 'ak1' })
    await rufe(KANAELE.vorlagen.verwerfeArbeitskopie, { arbeitsId: 'ak1' })
    await rufe(KANAELE.vorlagen.löscheVorlage, { id: 'v1' })

    expect(ops.oeffneZurBearbeitung).toHaveBeenCalledWith('v1')
    expect(ops.speichereArbeitskopie).toHaveBeenCalledWith('ak1', v)
    expect(ops.uebernehmeInParent).toHaveBeenCalledWith('ak1')
    expect(ops.verwerfeArbeitskopie).toHaveBeenCalledWith('ak1')
    expect(ops.löscheVorlage).toHaveBeenCalledWith('v1')
  })

  it('lehnt je Kanal eine ungueltige Nutzlast ab, ohne die Operation aufzurufen', async () => {
    const faelle: [string, ReturnType<typeof vi.fn>, unknown][] = [
      [KANAELE.vorlagen.erstelleVorlage, ops.erstelleVorlage, null],
      [KANAELE.vorlagen.erstelleVorlage, ops.erstelleVorlage, { art: 'vollflaeche', höhe: 400 }],
      [KANAELE.vorlagen.oeffneZurBearbeitung, ops.oeffneZurBearbeitung, { id: '' }],
      [KANAELE.vorlagen.speichereArbeitskopie, ops.speichereArbeitskopie, { arbeitsId: 'ak1' }],
      [KANAELE.vorlagen.speichereArbeitskopie, ops.speichereArbeitskopie, { vorlage: vorlage() }],
      [KANAELE.vorlagen.uebernehmeInParent, ops.uebernehmeInParent, { arbeitsId: 42 }],
      [KANAELE.vorlagen.alsEigenstaendige, ops.alsEigenstaendige, { arbeitsId: 'ak1' }],
      [KANAELE.vorlagen.alsEigenstaendige, ops.alsEigenstaendige, { name: 'x' }],
      [KANAELE.vorlagen.verwerfeArbeitskopie, ops.verwerfeArbeitskopie, {}],
      [KANAELE.vorlagen.löscheVorlage, ops.löscheVorlage, ['v1']],
    ]

    for (const [kanal, op, nutzlast] of faelle) {
      await expect(rufe(kanal, nutzlast)).resolves.toMatchObject(UNGUELTIG)
      expect(op, kanal).not.toHaveBeenCalled()
    }
  })

  it('laesst die Listen-Kanaele ohne Nutzlast arbeiten, ignoriert eine uebergebene und ruft ohne Argument', async () => {
    for (const kanal of [KANAELE.vorlagen.listeVorlagen, KANAELE.vorlagen.listeArbeitskopien]) {
      await expect(rufe(kanal)).resolves.toMatchObject({ ok: true })
      await expect(rufe(kanal, { unerwartet: 1 })).resolves.toMatchObject({ ok: true })
    }
    expect(ops.listeVorlagen).toHaveBeenCalledTimes(2)
    expect(ops.listeArbeitskopien).toHaveBeenCalledTimes(2)
    // Spy prueft arguments.length === 0 - die Operation nimmt kein Argument.
    expect(ops.listeVorlagen.mock.calls[0]).toHaveLength(0)
    expect(ops.listeArbeitskopien.mock.calls[0]).toHaveLength(0)
  })

  it('reicht den vorlage_referenziert-Fehlschlag mit daten voellig durch (Deep-Vergleich)', async () => {
    const referenz = {
      projektId: 'p1',
      projektName: 'Sommer',
      id: 'a1',
    }
    const fehlschlag = {
      ok: false as const,
      fehler: {
        code: 'vorlage_referenziert',
        meldung: 'wird noch benutzt',
        daten: { aktionen: [referenz], listenelemente: [] },
      },
    }
    ops.löscheVorlage.mockResolvedValue(fehlschlag)

    const ergebnis = await rufe(KANAELE.vorlagen.löscheVorlage, { id: 'v1' })

    expect(ergebnis).toBe(fehlschlag)
    expect(ergebnis).toStrictEqual(fehlschlag)
  })

  it('fuegt einem Fehler ohne daten keines hinzu', async () => {
    ops.oeffneZurBearbeitung.mockResolvedValue({
      ok: false,
      fehler: { code: 'nicht_gefunden', meldung: 'gibt es nicht' },
    })

    const ergebnis = (await rufe(KANAELE.vorlagen.oeffneZurBearbeitung, { id: 'v1' })) as {
      fehler: Record<string, unknown>
    }

    expect(ergebnis.fehler.code).toBe('nicht_gefunden')
    expect('daten' in ergebnis.fehler).toBe(false)
  })

  it('reicht nicht_gefunden mit genau diesem Code durch - kein Umschreiben', async () => {
    const fehlschlag = {
      ok: false as const,
      fehler: { code: 'nicht_gefunden', meldung: 'gibt es nicht' },
    }
    ops.oeffneZurBearbeitung.mockResolvedValue(fehlschlag)

    const ergebnis = await rufe(KANAELE.vorlagen.oeffneZurBearbeitung, { id: 'v1' })

    expect(ergebnis).toBe(fehlschlag)
    expect((ergebnis as { fehler: { code: string } }).fehler.code).toBe('nicht_gefunden')
  })

  it('reicht parent_eingebaut unveraendert durch - kein Umschreiben in ungueltige_eingabe', async () => {
    const fehlschlag = {
      ok: false as const,
      fehler: { code: 'parent_eingebaut', meldung: 'eingefroren' },
    }
    ops.uebernehmeInParent.mockResolvedValue(fehlschlag)

    const ergebnis = await rufe(KANAELE.vorlagen.uebernehmeInParent, { arbeitsId: 'ak1' })

    expect(ergebnis).toBe(fehlschlag)
    expect((ergebnis as { fehler: { code: string } }).fehler.code).toBe('parent_eingebaut')
  })

  it('kein throw ueber die Grenze: eine werfende Operation antwortet mit ungueltige_eingabe-Huelle des Wrappers', async () => {
    // Der Wrapper #23 uebersetzt eine unerwartete Ausnahme in 'unbekannter_fehler' -
    // ueber die IPC-Grenze fliegt nichts. Der Validierer laeuft hier ebenfalls echt.
    ops.listeVorlagen.mockRejectedValue(new Error('kaputt'))

    const ergebnis = (await rufe(KANAELE.vorlagen.listeVorlagen)) as {
      ok: false
      fehler: { code: string }
    }

    expect(ergebnis.ok).toBe(false)
    expect(ergebnis.fehler.code).toBe('unbekannter_fehler')
  })
})

describe('verdrahteVorlagenIPC (#109) – Grep-Proben der DoD', () => {
  it('enthaelt kein String-Literal mit dem Praefix vorlagen:', () => {
    // Alle neun Namen kommen aus KANAELE - ein Tippfehler waere sonst erst zur Laufzeit
    // sichtbar. (In kanaele.ts stehen die Namen als Literale und muessen dort stehen.)
    expect(CODETEIL).not.toMatch(/['"`]vorlagen:/)
  })

  it('enthaelt kein fs, kein child_process, kein ipcMain und keine Fensterreferenz', () => {
    expect(CODETEIL).not.toMatch(/\b(fs|child_process)\b/)
    expect(CODETEIL).not.toMatch(/ipcMain/)
    expect(CODETEIL).not.toMatch(/BrowserWindow|webContents/)
  })

  it('ruft weder die Schreibbausteine noch die Referenzpruefung auf', () => {
    expect(CODETEIL).not.toMatch(/ladeBestand|aendereBestand|flushBestand/)
    expect(CODETEIL).not.toMatch(/pruefeVorlagenReferenzen/)
  })
})