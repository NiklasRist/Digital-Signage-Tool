import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { RENDER_PROFILE } from '../../src/shared/contracts/render-profile'

import type { Ergebnis } from '../../src/shared/contracts/ergebnis'
import type { StromEigenschaften } from '../../src/main/ffmpeg-adapter/uniformitaet'

// Verhaltenstest zu #180 - der letzten Schranke vor dem Fernseher.
//
// GESTELLT IST NUR DER PROZESSSTART: `liesStromEigenschaften` (#170) wuerde ein echtes
// ffprobe-Binary und echte MP4s verlangen; das gehoerte nach tests/integration/. Die
// REINE Vergleichsfunktion `vergleicheStroeme` laeuft dagegen ECHT mit - sonst pruefte
// dieser Test nur seine eigene Attrappe und nicht, ob eine 4:2:2-Datei wirklich
// abgewiesen wird.
//
// Das Dateisystem ist ECHT, wo es um die Zusage geht ("die vorhandene Ausgabedatei
// bleibt unveraendert"): Nur eine Datei auf der Platte kann belegen, dass sie noch
// dieselbe ist. Attrappen kommen dort zum Einsatz, wo sich der Zustand nicht herstellen
// laesst - EBUSY, ENOSPC, EXDEV und die Zeitmessung der Wiederholungen.

type LeseAntwort = { art: 'ergebnis'; wert: Ergebnis<StromEigenschaften> } | { art: 'wirft'; fehler: unknown }

const zustand = vi.hoisted(() => ({
  leseAufrufe: [] as { datei: string; ffprobePfad: string }[],
  leseAntwort: null as unknown,
  stat: null as ((pfad: string) => Promise<{ size: number }>) | null,
  rename: null as ((von: string, nach: string) => Promise<void>) | null,
  renameAufrufe: [] as { von: string; nach: string }[],
  rm: null as ((pfad: string) => Promise<void>) | null,
  rmAufrufe: [] as string[],
}))

vi.mock('../../src/main/ffmpeg-adapter/uniformitaet', async (echtLaden) => {
  const echt = await echtLaden<typeof import('../../src/main/ffmpeg-adapter/uniformitaet')>()
  return {
    ...echt,
    liesStromEigenschaften: vi.fn((datei: string, ffprobePfad: string) => {
      zustand.leseAufrufe.push({ datei, ffprobePfad })
      const antwort = zustand.leseAntwort as LeseAntwort
      if (antwort.art === 'wirft') return Promise.reject(antwort.fehler)
      return Promise.resolve(antwort.wert)
    }),
  }
})

vi.mock('node:fs/promises', async (echtLaden) => {
  const echt = await echtLaden<typeof import('node:fs/promises')>()
  return {
    ...echt,
    stat: vi.fn((pfad: string) => (zustand.stat === null ? echt.stat(pfad) : zustand.stat(pfad))),
    rename: vi.fn((von: string, nach: string) => {
      zustand.renameAufrufe.push({ von, nach })
      return zustand.rename === null ? echt.rename(von, nach) : zustand.rename(von, nach)
    }),
    rm: vi.fn((pfad: string, optionen: { force?: boolean }) => {
      zustand.rmAufrufe.push(pfad)
      return zustand.rm === null ? echt.rm(pfad, optionen) : zustand.rm(pfad)
    }),
  }
})

const { DAUER_TOLERANZ_SEKUNDEN, RENAME_WARTEZEITEN_MS, verifiziereUndPlatziere } = await import(
  '../../src/main/render-service/ausgabe-platzieren'
)

const QUELLE = path.join(__dirname, '../../src/main/render-service/ausgabe-platzieren.ts')
const QUELLTEXT = readFileSync(QUELLE, 'utf8')

const WURZEL = mkdtempSync(path.join(os.tmpdir(), 'ds-ausgabe-platzieren-'))
const FFPROBE = path.join('C:', 'app', 'resources', 'ffprobe.exe')

let ordner = ''
let partPfad = ''
let zielPfad = ''

afterAll(() => {
  rmSync(WURZEL, { recursive: true, force: true })
})

beforeEach(() => {
  vi.useRealTimers()
  zustand.leseAufrufe = []
  zustand.leseAntwort = { art: 'ergebnis', wert: { ok: true, wert: profilkonform(120) } }
  zustand.stat = null
  zustand.rename = null
  zustand.renameAufrufe = []
  zustand.rm = null
  zustand.rmAufrufe = []

  ordner = mkdtempSync(path.join(WURZEL, 'lauf-'))
  zielPfad = path.join(ordner, 'werbereel.mp4')
  partPfad = `${zielPfad}.part`
})

/** Ein Befund, der jedes der von #170 geprueften Merkmale des Profils trifft. */
function profilkonform(dauerSekunden: number): StromEigenschaften {
  return {
    datei: partPfad,
    dauerSekunden,
    stromAnzahl: 2,
    stromArten: ['video', 'audio'],
    video: {
      codec: 'h264',
      profil: 'High',
      level: 40,
      breite: 1920,
      hoehe: 1080,
      pixelformat: 'yuv420p',
      bildrate: '30/1',
      mittlereBildrate: '30/1',
      zeitbasis: '1/15360',
      pixelSeitenverhaeltnis: '1:1',
      farbPrimaries: 'bt709',
      farbTransfer: 'bt709',
      farbMatrix: 'bt709',
      feldreihenfolge: null,
      drehung: 0,
    },
    audio: { codec: 'aac', abtastrate: 48000, kanaele: 1 },
  }
}

function liefere(eigenschaften: StromEigenschaften): void {
  zustand.leseAntwort = { art: 'ergebnis', wert: { ok: true, wert: eigenschaften } }
}

function systemfehler(code: string): Error & { code: string } {
  return Object.assign(new Error(`rename ${code}`), { code })
}

/** Legt die fertige Arbeitsdatei an; `zielInhalt` legt zusaetzlich eine gute Vorfassung ab. */
function lege(partInhalt: string, zielInhalt: string | null = null): void {
  writeFileSync(partPfad, partInhalt)
  if (zielInhalt !== null) writeFileSync(zielPfad, zielInhalt)
}

function lauf(erwarteteGesamtdauer = 120): ReturnType<typeof verifiziereUndPlatziere> {
  return verifiziereUndPlatziere(partPfad, zielPfad, erwarteteGesamtdauer, RENDER_PROFILE, FFPROBE)
}

describe('verifiziereUndPlatziere - der Erfolgsweg', () => {
  it('platziert die fertige Datei und meldet Pfad und Groesse', async () => {
    lege('fertige-mp4-bytes')

    const ergebnis = await lauf()

    expect(ergebnis).toEqual({
      ok: true,
      wert: { ausgabePfad: zielPfad, dateigroesse: 'fertige-mp4-bytes'.length },
    })
    expect(readFileSync(zielPfad, 'utf8')).toBe('fertige-mp4-bytes')
    expect(existsSync(partPfad)).toBe(false)
  })

  it('ersetzt eine vorhandene Zieldatei - der Regelfall (FA-22)', async () => {
    lege('die-neue-fassung', 'die-alte-gute-fassung')

    const ergebnis = await lauf()

    expect(ergebnis.ok).toBe(true)
    expect(readFileSync(zielPfad, 'utf8')).toBe('die-neue-fassung')
  })

  it('ruft ffprobe genau einmal, mit dem hereingereichten Binaerpfad', async () => {
    lege('bytes')

    await lauf()

    expect(zustand.leseAufrufe).toEqual([{ datei: partPfad, ffprobePfad: FFPROBE }])
  })

  it('fasst das Ziel mit genau einem rename an und loescht dort nichts', async () => {
    lege('bytes', 'alt')

    await lauf()

    expect(zustand.renameAufrufe).toEqual([{ von: partPfad, nach: zielPfad }])
    expect(zustand.rmAufrufe).not.toContain(zielPfad)
  })

  it('misst die Groesse VOR dem Umbenennen - an der .part', async () => {
    lege('zwoelf-bytes!')
    const gemessen: string[] = []
    zustand.stat = async (pfad) => {
      gemessen.push(pfad)
      expect(zustand.renameAufrufe).toHaveLength(0)
      return { size: 4711 }
    }

    const ergebnis = await lauf()

    expect(gemessen).toEqual([partPfad])
    expect(ergebnis.ok && ergebnis.wert.dateigroesse).toBe(4711)
  })
})

describe('verifiziereUndPlatziere - die Dauerpruefung', () => {
  it('haelt die Toleranz fest bei 0,5 s', () => {
    expect(DAUER_TOLERANZ_SEKUNDEN).toBe(0.5)
  })

  // Der Pflichtfall des Issues: Unter der verworfenen Formel max(0.5, 1 % der Dauer)
  // waeren bei 1800 s ganze 18 s zulaessig gewesen - ein vollstaendig fehlendes
  // Element (mindestens 10 s) waere durchgewinkt worden.
  it('weist ein 30-Minuten-Reel ab, dem ein Element (10 s) fehlt', async () => {
    lege('bytes', 'alt')
    liefere(profilkonform(1790))

    const ergebnis = await lauf(1800)

    expect(ergebnis.ok).toBe(false)
    if (ergebnis.ok) return
    expect(ergebnis.fehler.code).toBe('ffmpeg_fehler')
    expect(ergebnis.fehler.meldung).toContain('1790')
    expect(ergebnis.fehler.meldung).toContain('1800')
    expect(existsSync(partPfad)).toBe(false)
    expect(readFileSync(zielPfad, 'utf8')).toBe('alt')
  })

  it.each([100, 1800, 4500])('nimmt bei %i s eine Abweichung von 0,4 s an', async (soll) => {
    lege('bytes')
    liefere(profilkonform(soll + 0.4))

    expect((await lauf(soll)).ok).toBe(true)
  })

  it.each([100, 1800, 4500])('weist bei %i s eine Abweichung von 0,6 s ab', async (soll) => {
    lege('bytes', 'alt')
    liefere(profilkonform(soll - 0.6))

    const ergebnis = await lauf(soll)

    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) expect(ergebnis.fehler.code).toBe('ffmpeg_fehler')
    expect(readFileSync(zielPfad, 'utf8')).toBe('alt')
  })

  it('laesst die Grenze selbst (genau 0,5 s) noch durch', async () => {
    lege('bytes')
    liefere(profilkonform(100.5))

    expect((await lauf(100)).ok).toBe(true)
  })

  it('weist eine nicht bezifferbare Dauer ab, statt sie durchzuwinken', async () => {
    lege('bytes', 'alt')
    liefere(profilkonform(Number.NaN))

    const ergebnis = await lauf(120)

    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) expect(ergebnis.fehler.code).toBe('ffmpeg_fehler')
    expect(readFileSync(zielPfad, 'utf8')).toBe('alt')
  })
})

describe('verifiziereUndPlatziere - die vier Strom-Kriterien aus #170', () => {
  it('weist ein falsches Pixelformat ab und nennt Feld, Soll und Ist', async () => {
    lege('bytes', 'alt')
    const kaputt = profilkonform(120)
    if (kaputt.video !== null) kaputt.video.pixelformat = 'yuv422p'
    liefere(kaputt)

    const ergebnis = await lauf()

    expect(ergebnis.ok).toBe(false)
    if (ergebnis.ok) return
    expect(ergebnis.fehler.code).toBe('ffmpeg_fehler')
    expect(ergebnis.fehler.meldung).toContain('pixelformat')
    expect(ergebnis.fehler.meldung).toContain('yuv420p')
    expect(ergebnis.fehler.meldung).toContain('yuv422p')
    expect(existsSync(partPfad)).toBe(false)
    expect(readFileSync(zielPfad, 'utf8')).toBe('alt')
    expect(zustand.renameAufrufe).toHaveLength(0)
  })

  it.each([
    ['die Aufloesung', (e: StromEigenschaften): void => void (e.video && (e.video.hoehe = 720))],
    ['die Bildrate', (e: StromEigenschaften): void => void (e.video && (e.video.bildrate = '25/1'))],
  ])('weist %s ab', async (_name, verbiege) => {
    lege('bytes', 'alt')
    const kaputt = profilkonform(120)
    verbiege(kaputt)
    liefere(kaputt)

    const ergebnis = await lauf()

    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) expect(ergebnis.fehler.code).toBe('ffmpeg_fehler')
    expect(readFileSync(zielPfad, 'utf8')).toBe('alt')
  })

  // R-06: Eine still gedroppte Tonspur faellt sonst erst am Fernseher auf.
  it('weist eine fehlende Tonspur ab', async () => {
    lege('bytes', 'alt')
    const ohneTon = profilkonform(120)
    ohneTon.audio = null
    ohneTon.stromAnzahl = 1
    ohneTon.stromArten = ['video']
    liefere(ohneTon)

    const ergebnis = await lauf()

    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) expect(ergebnis.fehler.code).toBe('ffmpeg_fehler')
    expect(existsSync(partPfad)).toBe(false)
    expect(readFileSync(zielPfad, 'utf8')).toBe('alt')
  })
})

// TK 9.2.6 zaehlt die vorhandene Tonspur zu dem, was an der FERTIGEN Datei geprueft wird.
// Der Test darueber weist sie ueber die LAYOUT-Merkmale von #170 nach (stromAnzahl,
// stromArten) - also mittelbar. Hier bleibt das Layout ausdruecklich stimmig und NUR der
// Audioblock fehlt: #170 ueberspringt seine AUDIO_MERKMALE in diesem Fall
// (`pruefeMerkmale` steigt bei `quelle === null` aus), meldet also nichts. Faellt der Lauf
// trotzdem durch, traegt diese Datei das Kriterium SELBST - und wer in #170 je die
// Layout-Merkmale lockert, loescht es nicht lautlos mit.
describe('verifiziereUndPlatziere - die eigene Tonspur-Pruefung', () => {
  it('weist eine fehlende Tonspur auch dann ab, wenn das Streamlayout stimmig aussieht', async () => {
    lege('bytes', 'alt')
    const ohneTon = profilkonform(120)
    ohneTon.audio = null
    // ABSICHTLICH UNVERAENDERT: stromAnzahl 2 und stromArten ['video', 'audio'] - die
    // Layout-Merkmale von #170 finden hier nichts zu beanstanden.
    expect(ohneTon.stromAnzahl).toBe(2)
    expect(ohneTon.stromArten).toEqual(['video', 'audio'])
    liefere(ohneTon)

    const ergebnis = await lauf()

    expect(ergebnis.ok).toBe(false)
    if (ergebnis.ok) return
    expect(ergebnis.fehler.code).toBe('ffmpeg_fehler')
    expect(ergebnis.fehler.meldung).toContain('KEINE Tonspur')
    expect(existsSync(partPfad)).toBe(false)
    expect(readFileSync(zielPfad, 'utf8')).toBe('alt')
    expect(zustand.renameAufrufe).toHaveLength(0)
  })

  it('laesst eine vorhandene Tonspur durch - die Pruefung ist keine Dauerablehnung', async () => {
    lege('bytes', 'alt')
    liefere(profilkonform(120))

    const ergebnis = await lauf()

    expect(ergebnis.ok).toBe(true)
    expect(readFileSync(zielPfad, 'utf8')).toBe('bytes')
  })
})

describe('verifiziereUndPlatziere - die nicht durchfuehrbare Pruefung', () => {
  it('unterscheidet "nicht auslesbar" in der Meldung von "Kriterium verletzt"', async () => {
    lege('bytes', 'alt')
    zustand.leseAntwort = {
      art: 'ergebnis',
      wert: {
        ok: false,
        fehler: { code: 'unbekannter_fehler', meldung: 'ffprobe hat keine Ausgabe geliefert.' },
      },
    }

    const unlesbar = await lauf()

    expect(unlesbar.ok).toBe(false)
    if (unlesbar.ok) return
    expect(unlesbar.fehler.code).toBe('ffmpeg_fehler')
    expect(unlesbar.fehler.meldung).toContain('nicht auslesen')
    expect(unlesbar.fehler.meldung).toContain('ffprobe hat keine Ausgabe geliefert.')
    expect(existsSync(partPfad)).toBe(false)
    expect(readFileSync(zielPfad, 'utf8')).toBe('alt')
    expect(zustand.leseAufrufe).toHaveLength(1)

    // Gegenprobe: dieselbe Kategorie, andere Ursache - andere Meldung.
    lege('bytes', 'alt')
    const kaputt = profilkonform(120)
    if (kaputt.video !== null) kaputt.video.pixelformat = 'yuv422p'
    liefere(kaputt)
    const abweichend = await lauf()

    expect(abweichend.ok).toBe(false)
    if (!abweichend.ok) expect(abweichend.fehler.meldung).not.toBe(unlesbar.fehler.meldung)
  })

  it('macht aus einer geworfenen Ausnahme eine Ergebnis-Huelle', async () => {
    lege('bytes', 'alt')
    zustand.leseAntwort = { art: 'wirft', fehler: new Error('ffprobe explodiert') }

    const ergebnis = await lauf()

    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) expect(ergebnis.fehler.code).toBe('unbekannter_fehler')
    expect(existsSync(partPfad)).toBe(false)
    expect(readFileSync(zielPfad, 'utf8')).toBe('alt')
  })
})

describe('verifiziereUndPlatziere - das Dateisystem', () => {
  it('meldet ein gescheitertes stat als speicher_fehler, ohne umzubenennen', async () => {
    lege('bytes', 'alt')
    zustand.stat = () => Promise.reject(systemfehler('EACCES'))

    const ergebnis = await lauf()

    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) expect(ergebnis.fehler.code).toBe('speicher_fehler')
    expect(zustand.renameAufrufe).toHaveLength(0)
    expect(existsSync(partPfad)).toBe(false)
    expect(readFileSync(zielPfad, 'utf8')).toBe('alt')
  })

  it('meldet ENOSPC als kein_platz', async () => {
    lege('bytes', 'alt')
    zustand.rename = () => Promise.reject(systemfehler('ENOSPC'))

    const ergebnis = await lauf()

    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) expect(ergebnis.fehler.code).toBe('kein_platz')
    expect(readFileSync(zielPfad, 'utf8')).toBe('alt')
  })

  it('meldet EXDEV als speicher_fehler und kopiert nichts', async () => {
    lege('bytes', 'alt')
    zustand.rename = () => Promise.reject(systemfehler('EXDEV'))

    const ergebnis = await lauf()

    expect(ergebnis.ok).toBe(false)
    if (ergebnis.ok) return
    expect(ergebnis.fehler.code).toBe('speicher_fehler')
    expect(ergebnis.fehler.meldung).toContain('EXDEV')
    // Die Meldung muss den Aufbaufehler benennen, nicht nur den errno durchreichen:
    // Quelle und Ziel liegen auf verschiedenen Laufwerken.
    expect(ergebnis.fehler.meldung).toMatch(/laufwerk/i)
    expect(readFileSync(zielPfad, 'utf8')).toBe('alt')
    expect(QUELLTEXT).not.toContain('copyFile')
    expect(QUELLTEXT).not.toContain('createReadStream')
  })

  it('gibt bei EACCES sofort auf, ohne zu warten', async () => {
    lege('bytes', 'alt')
    zustand.rename = () => Promise.reject(systemfehler('EACCES'))

    const ergebnis = await lauf()

    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) expect(ergebnis.fehler.code).toBe('speicher_fehler')
    expect(zustand.renameAufrufe).toHaveLength(1)
  })

  // Idempotenz: Hier ist die .part gar nicht mehr da - das Aufraeumen darf den
  // urspruenglichen Code nicht verdraengen.
  it('liefert bei ENOENT den urspruenglichen Code, nicht den des Aufraeumens', async () => {
    lege('bytes', 'alt')
    rmSync(partPfad)
    zustand.rename = () => Promise.reject(systemfehler('ENOENT'))

    const ergebnis = await lauf()

    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) expect(ergebnis.fehler.code).toBe('speicher_fehler')
    expect(zustand.rmAufrufe).toEqual([partPfad])
    expect(readFileSync(zielPfad, 'utf8')).toBe('alt')
  })

  it('schluckt einen Fehler beim Aufraeumen und meldet trotzdem die wahre Ursache', async () => {
    lege('bytes', 'alt')
    zustand.rename = () => Promise.reject(systemfehler('ENOSPC'))
    zustand.rm = () => Promise.reject(systemfehler('EBUSY'))
    const stumm = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const ergebnis = await lauf()

    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) expect(ergebnis.fehler.code).toBe('kein_platz')
    expect(stumm).toHaveBeenCalled()
    stumm.mockRestore()
  })

  it('meldet einen Fehler ohne Systemcode als unbekannter_fehler', async () => {
    lege('bytes', 'alt')
    zustand.rename = () => Promise.reject(new Error('irgendetwas'))

    const ergebnis = await lauf()

    expect(ergebnis.ok).toBe(false)
    if (!ergebnis.ok) expect(ergebnis.fehler.code).toBe('unbekannter_fehler')
    expect(readFileSync(zielPfad, 'utf8')).toBe('alt')
  })
})

describe('verifiziereUndPlatziere - die Wiederholung bei EBUSY', () => {
  it('wiederholt dreimal nach 100, 300 und 900 ms und endet in speicher_fehler', async () => {
    vi.useFakeTimers()
    zustand.stat = () => Promise.resolve({ size: 12 })
    zustand.rename = () => Promise.reject(systemfehler('EBUSY'))
    zustand.rm = () => Promise.resolve()

    expect(RENAME_WARTEZEITEN_MS).toEqual([100, 300, 900])

    const offen = lauf()

    await vi.advanceTimersByTimeAsync(0)
    expect(zustand.renameAufrufe).toHaveLength(1)

    for (const [nummer, warteMs] of RENAME_WARTEZEITEN_MS.entries()) {
      await vi.advanceTimersByTimeAsync(warteMs - 1)
      expect(zustand.renameAufrufe).toHaveLength(nummer + 1)
      await vi.advanceTimersByTimeAsync(1)
      expect(zustand.renameAufrufe).toHaveLength(nummer + 2)
    }

    const ergebnis = await offen

    expect(ergebnis.ok).toBe(false)
    if (ergebnis.ok) return
    expect(ergebnis.fehler.code).toBe('speicher_fehler')
    expect(ergebnis.fehler.meldung).toContain(zielPfad)
    expect(zustand.rmAufrufe).toEqual([partPfad])
  })
})

describe('verifiziereUndPlatziere - was die Datei nicht tut', () => {
  it('startet keinen eigenen ffprobe-Prozess und ermittelt keinen Binaerpfad', () => {
    const ausfuehrbar = QUELLTEXT.split('\n')
      .filter((zeile) => !zeile.trimStart().startsWith('//') && !zeile.trimStart().startsWith('*'))
      .join('\n')

    expect(ausfuehrbar).not.toContain('child_process')
    expect(ausfuehrbar).not.toContain('ermittleFfprobePfad')
    expect(ausfuehrbar).not.toContain('spawn')
    // Keine laengenabhaengige Toleranz - weder als Formel noch als Anteil.
    expect(ausfuehrbar).not.toContain('0.01')
    expect(ausfuehrbar).not.toContain('Math.max')
  })
})
