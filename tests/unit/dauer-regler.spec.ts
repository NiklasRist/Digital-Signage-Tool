// Verhaltenstests zu #125 - der einheitliche Dauer- und Trim-Regler im composer.
//
// Zwei Dinge werden hier besonders scharf geprüft, weil sie am teuersten sind, wenn
// sie kippen:
//
// 1. DIE VERZWEIGUNG. Ein Video darf AUSSCHLIESSLICH über `setzeTrim` laufen, Bild
//    und Segment AUSSCHLIESSLICH über `setzeDauer`. Deshalb wird nicht nur geprüft,
//    dass der richtige Kanal gerufen wurde, sondern auch, dass der andere
//    nachweislich NICHT vorkam.
//
// 2. DASS HIER NICHT GERUNDET WIRD. Die Beispielwerte sind absichtlich KRUMM:
//    `4.71 s` sind 141,3 Frames bei der Bildrate des Ausgabe-Profils, `71.37 s` sind
//    2141,1. Ein glatter Wert wie 0.7 (exakt 21 Frames) überstünde jede
//    Frame-Rundung unverändert - eine Gegenprobe zur Rundung KÖNNTE damit gar nicht
//    fehlschlagen. Mit den krummen Werten unterscheiden sich rohe Differenz und
//    frame-gerundete Differenz messbar, und der Test rechnet beide aus.
//
// Die Doppel sind echte kleine Attrappen: `fuehreOptimistischAus` bildet den Ablauf
// aus #126 nach (anwenden -> bestätigen -> bei Ablehnung zurücknehmen), sonst wäre
// der Rollback-Test wirkungslos, und die Sicht speichert wirklich, sonst könnte
// "steht es wieder auf dem alten Stand?" niemand beantworten.
import { readFileSync } from 'node:fs'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Asset } from '../../src/shared/contracts/asset'
import type { Listenelement, Project } from '../../src/shared/contracts/project'
import type { Ergebnis } from '../../src/shared/contracts/ergebnis'
import { KANAELE } from '../../src/shared/contracts/kanaele'
import { DAUER_BEREICH } from '../../src/shared/contracts/konstanten'
import { RENDER_PROFILE } from '../../src/shared/contracts/render-profile'

// ---------------------------------------------------------------------------
// Die Doppel. `vi.hoisted`, weil `vi.mock` vor den Importen ausgeführt wird.
// ---------------------------------------------------------------------------

const doppel = vi.hoisted(() => ({
  aufrufe: [] as Array<{ kanal: string; nutzlast: unknown }>,
  antwort: null as unknown,
  projekt: null as Project | null,
  abgeglichen: [] as Listenelement[],
  optimistischGerufen: 0,
  zurueckgenommen: 0,
}))

vi.mock('../../src/renderer/ipc-client/rufe-auf', () => ({
  rufeAuf: async (kanal: string, nutzlast?: unknown) => {
    doppel.aufrufe.push({ kanal, nutzlast })
    return doppel.antwort
  },
}))

vi.mock('../../src/renderer/composer/projektzustand', () => ({
  holeSicht: () => ({ projekt: doppel.projekt, ladefehler: null }),
  gleicheElementAb: (element: Listenelement) => {
    doppel.abgeglichen.push(element)
    // Wie #121: genau EIN Element wird anhand seiner id ersetzt, ein NEUES Array
    // entsteht. Liefe die geprüfte Datei über einen anderen Weg an die Liste, fiele
    // es hier auf.
    if (doppel.projekt === null) return
    doppel.projekt = {
      ...doppel.projekt,
      liste: doppel.projekt.liste.map((v) => (v.id === element.id ? element : v)),
    }
  },
}))

vi.mock('../../src/renderer/composer/optimistisch', () => ({
  // Der Ablauf aus #126, nachgebaut - NICHT wegabstrahiert. Ein Doppel, das nur
  // `bestaetigen()` durchreicht, könnte weder den optimistischen Schritt noch den
  // Rollback belegen.
  fuehreOptimistischAus: async (
    anwenden: () => void,
    zuruecknehmen: () => void,
    bestaetigen: () => Promise<Ergebnis<unknown>>,
  ) => {
    doppel.optimistischGerufen += 1
    anwenden()
    const ergebnis = await bestaetigen()
    if (!ergebnis.ok) {
      doppel.zurueckgenommen += 1
      zuruecknehmen()
    }
    return ergebnis
  },
}))

import {
  baueReglerModell,
  begrenze,
  uebernehmeGrenzen,
} from '../../src/renderer/composer/dauer-regler'

// ---------------------------------------------------------------------------
// Bausteine - absichtlich KRUMME Werte, s. Kopf der Datei.
// ---------------------------------------------------------------------------

const TRIM_ANFANG = 4.71 // 141,3 Frames
const TRIM_ENDE = 71.37 // 2141,1 Frames
const BILD_DAUER = 23.41 // 702,3 Frames

function videoElement(): Listenelement {
  return {
    id: 'el-video',
    art: 'video',
    ref: 'asset-1',
    dauer: null,
    trimStart: TRIM_ANFANG,
    trimEnde: TRIM_ENDE,
    einblendung: null,
  }
}

function standbild(): Listenelement {
  return {
    id: 'el-segment',
    art: 'segment',
    ref: 'ref-1',
    dauer: BILD_DAUER,
    trimStart: null,
    trimEnde: null,
    einblendung: null,
  }
}

function videoAsset(dauer: number | null): Asset {
  return {
    id: 'asset-1',
    typ: 'video',
    dateiname: 'asset-1.mp4',
    originalname: 'clip.mp4',
    maße: { breite: 1920, höhe: 1080 },
    dauer,
    importdatum: '2026-08-15T00:00:00.000Z',
    zustand: 'ok',
  }
}

function projektMit(...liste: Listenelement[]): Project {
  return {
    id: 'p1',
    name: 'Testprojekt',
    schemaVersion: 1,
    erstellt: '2026-08-15T00:00:00.000Z',
    geaendert: '2026-08-15T00:00:00.000Z',
    assets: [],
    aktionen: [],
    liste,
    letzterAusgabeName: null,
  } as unknown as Project
}

beforeEach(() => {
  doppel.aufrufe = []
  doppel.antwort = null
  doppel.projekt = null
  doppel.abgeglichen = []
  doppel.optimistischGerufen = 0
  doppel.zurueckgenommen = 0
})

// ---------------------------------------------------------------------------
// baueReglerModell
// ---------------------------------------------------------------------------

describe('baueReglerModell', () => {
  it('gibt einem Video zwei Griffe und die Quelllaenge als Obergrenze', () => {
    const ergebnis = baueReglerModell(videoElement(), videoAsset(90))
    expect(ergebnis.ok).toBe(true)
    if (!ergebnis.ok) return

    expect(ergebnis.wert).toEqual({
      elementId: 'el-video',
      griffe: 2,
      untergrenze: 0,
      obergrenze: 90,
      anfang: TRIM_ANFANG,
      ende: TRIM_ENDE,
      effektiveDauer: TRIM_ENDE - TRIM_ANFANG,
    })
  })

  it('gibt dem Segment einen Griff, Anfang 0 und den Bereich aus DAUER_BEREICH', () => {
    const ergebnis = baueReglerModell(standbild(), null)
    expect(ergebnis.ok).toBe(true)
    if (!ergebnis.ok) return

    expect(ergebnis.wert.griffe).toBe(1)
    expect(ergebnis.wert.anfang).toBe(0)
    expect(ergebnis.wert.ende).toBe(BILD_DAUER)
    expect(ergebnis.wert.untergrenze).toBe(DAUER_BEREICH.min)
    expect(ergebnis.wert.obergrenze).toBe(DAUER_BEREICH.max)
  })

  it('rechnet effektiveDauer ROH - nicht auf das Frame-Raster', () => {
    // Die Gegenrechnung steht hier ausgeschrieben, damit der Test beisst: Wer in der
    // geprüften Datei rundete, träfe genau diesen Unterschied.
    const roh = TRIM_ENDE - TRIM_ANFANG // 66.66000000000001
    const frameGerundet =
      (Math.round(TRIM_ENDE * RENDER_PROFILE.fps) -
        Math.round(TRIM_ANFANG * RENDER_PROFILE.fps)) /
      RENDER_PROFILE.fps // (2141 - 141) / 30 = 66.66666666666667
    expect(roh).not.toBe(frameGerundet)

    const video = baueReglerModell(videoElement(), videoAsset(90))
    expect(video.ok && video.wert.effektiveDauer).toBe(roh)
    expect(video.ok && video.wert.effektiveDauer).not.toBe(frameGerundet)

    // Und in beiden Fällen gilt effektiveDauer === ende − anfang.
    for (const modell of [
      baueReglerModell(videoElement(), videoAsset(90)),
      baueReglerModell(standbild(), null),
    ]) {
      expect(modell.ok).toBe(true)
      if (!modell.ok) return
      expect(modell.wert.effektiveDauer).toBe(modell.wert.ende - modell.wert.anfang)
    }
  })

  it('liefert ohne passendes Asset nicht_gefunden und ohne Laufzeit ungueltige_eingabe', () => {
    const ohneAsset = baueReglerModell(videoElement(), null)
    expect(ohneAsset.ok ? null : ohneAsset.fehler.code).toBe('nicht_gefunden')

    const bildAsset = { ...videoAsset(90), typ: 'bild' as const }
    const falscherTyp = baueReglerModell(videoElement(), bildAsset)
    expect(falscherTyp.ok ? null : falscherTyp.fehler.code).toBe('nicht_gefunden')

    for (const dauer of [null, 0, -1]) {
      const ergebnis = baueReglerModell(videoElement(), videoAsset(dauer))
      expect(ergebnis.ok ? null : ergebnis.fehler.code).toBe('ungueltige_eingabe')
    }
  })

  it('liefert fuer ein Segment ohne dauer ungueltige_eingabe', () => {
    const ohneDauer = { ...standbild(), dauer: null }
    const ergebnis = baueReglerModell(ohneDauer, null)
    expect(ergebnis.ok ? null : ergebnis.fehler.code).toBe('ungueltige_eingabe')
  })

  it('wirft bei einer unbekannten art nicht, sondern meldet ungueltige_eingabe', () => {
    const fremd = { ...standbild(), art: 'ton' } as unknown as Listenelement
    const ergebnis = baueReglerModell(fremd, null)
    expect(ergebnis.ok ? null : ergebnis.fehler.code).toBe('ungueltige_eingabe')

    const nichts = baueReglerModell(null as unknown as Listenelement, null)
    expect(nichts.ok ? null : nichts.fehler.code).toBe('ungueltige_eingabe')
  })
})

// ---------------------------------------------------------------------------
// begrenze
// ---------------------------------------------------------------------------

describe('begrenze', () => {
  function videoModell() {
    const ergebnis = baueReglerModell(videoElement(), videoAsset(90))
    if (!ergebnis.ok) throw new Error('Vorbedingung des Tests nicht erfuellt')
    return ergebnis.wert
  }

  it('klemmt unter die Untergrenze und ueber die Obergrenze, laesst dazwischen alles stehen', () => {
    const modell = videoModell()

    expect(begrenze(modell, -3.17, 128.93)).toEqual({ anfang: 0, ende: 90 })
    // Krumme Werte innerhalb der Grenzen kommen UNVERAENDERT zurück - kein Raster,
    // keine "schönen" Werte.
    expect(begrenze(modell, 12.37, 88.09)).toEqual({ anfang: 12.37, ende: 88.09 })
    // Genau auf der Grenze ist erlaubt (AD 4.4: "nur bis zur Quelllänge").
    expect(begrenze(modell, 0, 90)).toEqual({ anfang: 0, ende: 90 })
  })

  it('haelt bei einem Griff den Anfang auf 0 und klemmt nur die Laenge', () => {
    const ergebnis = baueReglerModell(standbild(), null)
    if (!ergebnis.ok) throw new Error('Vorbedingung des Tests nicht erfuellt')
    const modell = ergebnis.wert

    // Der Anfang wird NICHT in [min, max] geklemmt - sonst würde aus 0 die
    // Mindestdauer, und die Länge verschöbe sich um genau diesen Betrag.
    expect(begrenze(modell, 0, 3.19)).toEqual({ anfang: 0, ende: DAUER_BEREICH.min })
    expect(begrenze(modell, 0, 91.44)).toEqual({ anfang: 0, ende: DAUER_BEREICH.max })
    expect(begrenze(modell, 7.5, 19.83)).toEqual({ anfang: 0, ende: 19.83 })
  })

  it('faellt bei nicht endlichen Werten auf den Stand des Modells zurueck', () => {
    const modell = videoModell()
    expect(begrenze(modell, Number.NaN, 30.5)).toEqual({
      anfang: modell.anfang,
      ende: modell.ende,
    })
    expect(begrenze(modell, 1.11, Number.POSITIVE_INFINITY)).toEqual({
      anfang: modell.anfang,
      ende: modell.ende,
    })
  })
})

// ---------------------------------------------------------------------------
// uebernehmeGrenzen
// ---------------------------------------------------------------------------

describe('uebernehmeGrenzen', () => {
  it('ruft fuer ein Video ausschliesslich setzeTrim mit den rohen Sekunden', async () => {
    const element = videoElement()
    doppel.projekt = projektMit(element)
    const bestaetigt: Listenelement = { ...element, trimStart: 9.13, trimEnde: 63.29 }
    doppel.antwort = { ok: true, wert: bestaetigt }

    const ergebnis = await uebernehmeGrenzen(element, 9.13, 63.29)

    expect(ergebnis).toEqual({ ok: true, wert: bestaetigt })
    expect(doppel.aufrufe).toEqual([
      {
        kanal: KANAELE.project.setzeTrim,
        nutzlast: { elementId: 'el-video', trimStart: 9.13, trimEnde: 63.29 },
      },
    ])
    // Der andere Kanal kommt nachweislich NICHT vor.
    expect(doppel.aufrufe.some((a) => a.kanal === KANAELE.project.setzeDauer)).toBe(false)
    expect(doppel.optimistischGerufen).toBe(1)
  })

  it('ruft fuer ein Segment ausschliesslich setzeDauer mit ende − anfang', async () => {
    doppel.aufrufe = []
    const element = standbild()
    doppel.projekt = projektMit(element)
    doppel.antwort = { ok: true, wert: { ...element, dauer: 31.87 } }

    await uebernehmeGrenzen(element, 0, 31.87)

    expect(doppel.aufrufe).toEqual([
      {
        kanal: KANAELE.project.setzeDauer,
        nutzlast: { elementId: 'el-segment', dauer: 31.87 },
      },
    ])
    expect(doppel.aufrufe.some((a) => a.kanal === KANAELE.project.setzeTrim)).toBe(false)
  })

  it('traegt nach ok:true EXAKT das zurueckgegebene Element in die Sicht', async () => {
    const element = videoElement()
    doppel.projekt = projektMit(element)
    // Der Store legt bewusst etwas ANDERES ab als gezogen wurde - genau daran zeigt
    // sich, ob abgeglichen oder der optimistische Stand behalten wird.
    const bestaetigt: Listenelement = { ...element, trimStart: 9.13, trimEnde: 60.0 }
    doppel.antwort = { ok: true, wert: bestaetigt }

    await uebernehmeGrenzen(element, 9.13, 63.29)

    const inSicht = doppel.projekt?.liste[0]
    expect(inSicht).toEqual(bestaetigt)
    expect(inSicht).not.toEqual({ ...element, trimStart: 9.13, trimEnde: 63.29 })
    // Der optimistische Schritt kam ZUERST, der Abgleich danach.
    expect(doppel.abgeglichen).toEqual([{ ...element, trimStart: 9.13, trimEnde: 63.29 }, bestaetigt])
  })

  it('stellt nach ok:false den Stand vor dem Ziehen wieder her', async () => {
    const element = videoElement()
    doppel.projekt = projektMit(element)
    doppel.antwort = {
      ok: false,
      fehler: { code: 'ungueltige_eingabe', meldung: 'zu lang' },
    }

    const ergebnis = await uebernehmeGrenzen(element, 9.13, 63.29)

    // Code und Meldung UNVERAENDERT durchgereicht.
    expect(ergebnis).toEqual({
      ok: false,
      fehler: { code: 'ungueltige_eingabe', meldung: 'zu lang' },
    })
    expect(doppel.zurueckgenommen).toBe(1)
    expect(doppel.projekt?.liste[0]).toEqual(element)
    expect(doppel.projekt?.liste[0]?.trimEnde).toBe(TRIM_ENDE)
  })

  it('reicht einen fachlichen Fehlercode des Main unveraendert durch', async () => {
    const element = standbild()
    doppel.projekt = projektMit(element)
    doppel.antwort = { ok: false, fehler: { code: 'kein_projekt', meldung: 'zu' } }

    const ergebnis = await uebernehmeGrenzen(element, 0, 31.87)
    expect(ergebnis.ok ? null : ergebnis.fehler.code).toBe('kein_projekt')
  })

  it('weist nicht endliche Werte ohne IPC-Aufruf ab', async () => {
    const element = videoElement()
    doppel.projekt = projektMit(element)

    for (const paar of [
      [Number.NaN, 10.5],
      [1.5, Number.POSITIVE_INFINITY],
    ] as const) {
      const ergebnis = await uebernehmeGrenzen(element, paar[0], paar[1])
      expect(ergebnis.ok ? null : ergebnis.fehler.code).toBe('ungueltige_eingabe')
    }
    expect(doppel.aufrufe).toEqual([])
    expect(doppel.optimistischGerufen).toBe(0)
  })

  it('weist anfang >= ende ohne IPC-Aufruf ab und laesst die Sicht unveraendert', async () => {
    const element = videoElement()
    doppel.projekt = projektMit(element)

    const gleich = await uebernehmeGrenzen(element, 12.37, 12.37)
    expect(gleich.ok ? null : gleich.fehler.code).toBe('ungueltige_eingabe')
    const verdreht = await uebernehmeGrenzen(element, 40.19, 12.37)
    expect(verdreht.ok ? null : verdreht.fehler.code).toBe('ungueltige_eingabe')

    expect(doppel.aufrufe).toEqual([])
    expect(doppel.projekt?.liste[0]).toEqual(element)
  })

  it('weist bei einem Segment einen anfang ungleich 0 ohne IPC-Aufruf ab', async () => {
    const element = standbild()
    doppel.projekt = projektMit(element)
    const ergebnis = await uebernehmeGrenzen(element, 2.83, 31.87)
    expect(ergebnis.ok ? null : ergebnis.fehler.code).toBe('ungueltige_eingabe')
    expect(doppel.aufrufe).toEqual([])
  })

  it('weist eine unbekannte art und ein leeres Element ohne IPC-Aufruf ab', async () => {
    doppel.projekt = projektMit(videoElement())

    const fremd = { ...standbild(), art: 'ton' } as unknown as Listenelement
    const a = await uebernehmeGrenzen(fremd, 0, 31.87)
    expect(a.ok ? null : a.fehler.code).toBe('ungueltige_eingabe')

    const b = await uebernehmeGrenzen(null as unknown as Listenelement, 0, 31.87)
    expect(b.ok ? null : b.fehler.code).toBe('ungueltige_eingabe')

    expect(doppel.aufrufe).toEqual([])
  })

  it('fragt ohne geladenes Projekt gar nicht erst', async () => {
    doppel.projekt = null
    const ergebnis = await uebernehmeGrenzen(videoElement(), 9.13, 63.29)
    expect(ergebnis.ok ? null : ergebnis.fehler.code).toBe('ungueltige_eingabe')
    expect(doppel.aufrufe).toEqual([])
  })

  it('nimmt den Rueckfallstand aus der SICHT, nicht aus dem Argument', async () => {
    // Das Argument ist veraltet (die Oberflaeche hat es beim Aufbau des Reglers
    // geholt); die Sicht trägt den letzten bestätigten Stand. Beim Rollback muss
    // DIESER gewinnen, sonst schreibt ein Fehlschlag einen alten Stand fest.
    const veraltet = videoElement()
    const bestaetigt: Listenelement = { ...veraltet, trimStart: 2.03, trimEnde: 55.87 }
    doppel.projekt = projektMit(bestaetigt)
    doppel.antwort = { ok: false, fehler: { code: 'ungueltige_eingabe', meldung: 'nein' } }

    await uebernehmeGrenzen(veraltet, 9.13, 63.29)

    expect(doppel.projekt?.liste[0]).toEqual(bestaetigt)
    expect(doppel.projekt?.liste[0]?.trimStart).toBe(2.03)
  })
})

// ---------------------------------------------------------------------------
// Grep-Proben aus der Definition of Done - am Dateiinhalt, nicht am Verhalten.
// ---------------------------------------------------------------------------

describe('Grep-Proben an der Quelldatei', () => {
  const quelle = readFileSync('src/renderer/composer/dauer-regler.ts', 'utf8')

  it('enthaelt die Bereichsgrenzen nicht als Zahl und nichts Frame-Bezogenes', () => {
    expect(quelle).not.toMatch(/10/)
    expect(quelle).not.toMatch(/45/)
    expect(quelle).not.toMatch(/30/)
    expect(quelle).not.toMatch(/Math\.(round|floor|ceil)/)
    expect(quelle).toMatch(/DAUER_BEREICH/)
  })

  it('enthaelt keinen Kanal als Textliteral, kein JSX, kein react, kein window.api, kein fs', () => {
    expect(quelle).not.toMatch(/'project:/)
    expect(quelle).not.toMatch(/"project:/)
    expect(quelle).not.toMatch(/from 'react'/)
    expect(quelle).not.toMatch(/window\.api/)
    expect(quelle).not.toMatch(/from 'node:fs'/)
    expect(quelle).not.toMatch(/from 'fs'/)
    // Kein Import aus src/main/** (Modulgrenze, TK 2).
    expect(quelle).not.toMatch(/\.\.\/\.\.\/main\//)
  })
})
