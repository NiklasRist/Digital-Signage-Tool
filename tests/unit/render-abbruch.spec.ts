import { readFileSync } from 'node:fs'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Verhaltenstest zu #179 (Abbruch entgegennehmen).
//
// GESTELLT IST GENAU EINS: der Prozess-Stopp des ffmpeg-adapter (#159). Er ist die
// einzige Aussenwirkung dieser Datei - alles andere ist Zustand, den man direkt
// befragen kann. Mit der Attrappe sind ausserdem die Faelle herstellbar, die ein
// echter Adapter nicht auf Kommando liefert: ein Stopp, der wirft; einer, der
// ablehnt; einer, der nie fertig wird (daran haengt die Zusage "kehrt SOFORT
// zurueck").
//
// WAS HIER GRUNDSAETZLICH NICHT BELEGT WERDEN KANN, ist die Wirkung auf das
// Betriebssystem - ob der ffmpeg-Prozess danach wirklich tot und die Datei wirklich
// frei ist. Das gehoert zu #159 und ist dort gemessen: tests/integration/
// ffmpeg-abbruch-echt.spec.ts. Der dort festgehaltene Befund ist der Grund, warum
// diese Datei ueberhaupt ein AbortSignal fuehrt: Ein per taskkill beendetes ffmpeg
// meldet unter Windows `code 1, signal null` und ist damit von einem echten
// Encoder-Fehler nicht zu unterscheiden.

const adapter = vi.hoisted(() => ({
  aufrufe: 0,
  verhalten: 'loest' as 'loest' | 'wirft' | 'lehntAb' | 'haengt',
}))

vi.mock('../../src/main/ffmpeg-adapter/abbruch', () => ({
  beendeLaufendenProzess: (): Promise<void> => {
    adapter.aufrufe += 1
    if (adapter.verhalten === 'wirft') throw new Error('Der Stopp ist gescheitert')
    if (adapter.verhalten === 'lehntAb') return Promise.reject(new Error('abgelehnt'))
    if (adapter.verhalten === 'haengt') return new Promise<void>(() => {})
    return Promise.resolve()
  },
}))

/**
 * Ein frisches Modul je Test.
 *
 * Die Registrierung ist Modul-Zustand - genau EIN Platz, so verlangt es die serielle
 * Zusage (NFA-09). Ohne diesen Schnitt schleppte ein Test den Lauf des vorigen mit
 * sich, und ein vergessenes freigeben() faende hier nie jemand.
 */
async function frischesModul(): Promise<typeof import('../../src/main/render-service/abbruch')> {
  vi.resetModules()
  return import('../../src/main/render-service/abbruch')
}

let protokoll: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  adapter.aufrufe = 0
  adapter.verhalten = 'loest'
  protokoll = vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  protokoll.mockRestore()
})

/**
 * Die beiden Sichten muessen IMMER denselben Wert liefern - das ist der ganze Sinn
 * des einen Controllers. Diese Probe steht nach jedem Schritt, nicht nur am Ende:
 * Ein zweites Kennzeichen faellt sonst erst dort auf, wo es schon geschadet hat.
 */
function beideSichten(registrierung: { istAbgebrochen(): boolean; signal: AbortSignal }): boolean {
  expect(registrierung.istAbgebrochen()).toBe(registrierung.signal.aborted)
  return registrierung.istAbgebrochen()
}

describe('cancelRender - der registrierte Lauf', () => {
  it('setzt das Kennzeichen und stoesst den Adapter-Stopp genau einmal an', async () => {
    const { registriereLauf, cancelRender } = await frischesModul()
    const lauf = registriereLauf('r-1')

    // Vor dem Abbruch: nichts gesetzt, nichts angestossen.
    expect(beideSichten(lauf)).toBe(false)
    expect(adapter.aufrufe).toBe(0)

    cancelRender('r-1')

    expect(beideSichten(lauf)).toBe(true)
    expect(adapter.aufrufe).toBe(1)
  })

  it('gibt void zurueck und kehrt zurueck, obwohl der Stopp nie fertig wird', async () => {
    // DIE ZUSAGE, an der die Oberflaeche haengt: "Kehrt SOFORT zurueck und wartet
    // NICHT auf das Prozessende." Die Gegenprobe ist ein Stopp, dessen Zusage NIE
    // aufloest - wuerde cancelRender ihn abwarten, kaeme dieser Test nie zur
    // naechsten Zeile und liefe in den Test-Zeitablauf.
    adapter.verhalten = 'haengt'
    const { registriereLauf, cancelRender } = await frischesModul()
    const lauf = registriereLauf('r-1')

    expect(cancelRender('r-1')).toBeUndefined()

    expect(adapter.aufrufe).toBe(1)
    expect(beideSichten(lauf)).toBe(true)
  })

  it('ist idempotent: zweimal abbrechen laesst das Kennzeichen stehen', async () => {
    const { registriereLauf, cancelRender } = await frischesModul()
    const lauf = registriereLauf('r-1')

    cancelRender('r-1')
    expect(() => cancelRender('r-1')).not.toThrow()

    expect(beideSichten(lauf)).toBe(true)
    // Der Stopp wird ERNEUT angestossen - der erste kann folgenlos geblieben sein,
    // und #159 vertraegt den zweiten Anlauf (es loest auch ohne gemerkten Prozess auf).
    expect(adapter.aufrufe).toBe(2)
  })
})

describe('cancelRender - fremde und unbekannte Kennungen', () => {
  it('laesst Kennzeichen und Adapter bei einer fremden renderId unberuehrt', async () => {
    const { registriereLauf, cancelRender } = await frischesModul()
    const lauf = registriereLauf('r-1')

    cancelRender('r-2')

    // Der Kern der Zusage "ein Abbruch trifft nie einen fremden Lauf".
    expect(beideSichten(lauf)).toBe(false)
    expect(adapter.aufrufe).toBe(0)
  })

  it('tut nichts, wenn gar kein Lauf registriert ist', async () => {
    const { cancelRender } = await frischesModul()

    // Der Klick kam, nachdem der Lauf von selbst fertig wurde - kein Fehlerfall.
    expect(() => cancelRender('r-1')).not.toThrow()
    expect(adapter.aufrufe).toBe(0)
    expect(protokoll).not.toHaveBeenCalled()
  })

  it('tut nichts mehr, nachdem der Lauf freigegeben wurde', async () => {
    const { registriereLauf, cancelRender } = await frischesModul()
    const lauf = registriereLauf('r-1')

    lauf.freigeben()
    cancelRender('r-1')

    expect(adapter.aufrufe).toBe(0)
    expect(beideSichten(lauf)).toBe(false)
  })
})

describe('das Kennzeichen ueberlebt einen stolpernden Adapter', () => {
  it('bleibt gesetzt, wenn der Adapter-Stopp wirft', async () => {
    adapter.verhalten = 'wirft'
    const { registriereLauf, cancelRender } = await frischesModul()
    const lauf = registriereLauf('r-1')

    // Der Wurf darf nicht nach aussen dringen: cancelRender laeuft im Abbrecher von
    // #68, und ein Wurf dort risse den Abbruch-Weg der Oberflaeche auf.
    expect(() => cancelRender('r-1')).not.toThrow()

    // ENTSCHEIDEND: Ohne gesetztes Kennzeichen endete der Lauf als roter Fehlschlag,
    // obwohl der Nutzer selbst abgebrochen hat.
    expect(beideSichten(lauf)).toBe(true)
    expect(protokoll).toHaveBeenCalled()
  })

  it('faengt eine abgelehnte Zusage des Adapters ab', async () => {
    adapter.verhalten = 'lehntAb'
    const { registriereLauf, cancelRender } = await frischesModul()
    const lauf = registriereLauf('r-1')

    cancelRender('r-1')
    // Eine Umdrehung der Ereignisschleife - erst danach steht fest, ob die Ablehnung
    // behandelt wurde. Unbehandelt beendet sie in Node den ganzen Hauptprozess.
    await Promise.resolve()

    expect(beideSichten(lauf)).toBe(true)
    expect(protokoll).toHaveBeenCalled()
  })
})

describe('registriereLauf - eine Registrierung, ein frischer Controller', () => {
  it('gibt zwei Laeufen verschiedene Signale; der Abbruch des ersten faerbt nicht ab', async () => {
    const { registriereLauf, cancelRender } = await frischesModul()
    const erster = registriereLauf('r-1')

    cancelRender('r-1')
    expect(beideSichten(erster)).toBe(true)
    erster.freigeben()

    const zweiter = registriereLauf('r-2')

    // Ein wiederverwendeter Controller waere hier bereits ausgeloest - jeder weitere
    // Render endete sofort als abgebrochen, und zwar fuer den Rest der Sitzung.
    expect(zweiter.signal).not.toBe(erster.signal)
    expect(beideSichten(zweiter)).toBe(false)
    expect(beideSichten(erster)).toBe(true)
  })

  it('haelt istAbgebrochen() auch nach dem Freigeben auf true', async () => {
    const { registriereLauf, cancelRender } = await frischesModul()
    const lauf = registriereLauf('r-1')

    cancelRender('r-1')
    lauf.freigeben()

    // #181 fragt am terminalen Ausgang NACH dem Freigeben noch einmal, welcher Zweig
    // gilt. Aenderte die Registrierung dort ihre Antwort, waehlte er den Fehlerzweig.
    expect(beideSichten(lauf)).toBe(true)
  })

  it('ersetzt eine bestehende Registrierung und meldet das intern', async () => {
    const { registriereLauf, cancelRender } = await frischesModul()
    const erster = registriereLauf('r-1')

    const zweiter = registriereLauf('r-2')

    expect(protokoll).toHaveBeenCalled()
    // KEIN eigener Sperr-Mechanismus: verhindert wird der zweite Lauf nicht (das ist
    // Sache des Torwaechters, #59) - und der erste wird auch nicht abgebrochen, denn
    // abgebrochen hat ihn niemand.
    expect(beideSichten(erster)).toBe(false)

    cancelRender('r-1')
    expect(adapter.aufrufe).toBe(0)
    expect(beideSichten(erster)).toBe(false)

    cancelRender('r-2')
    expect(adapter.aufrufe).toBe(1)
    expect(beideSichten(zweiter)).toBe(true)
  })

  it('meldet eine leere renderId, ohne zu werfen', async () => {
    const { registriereLauf } = await frischesModul()

    const lauf = registriereLauf('')

    expect(protokoll).toHaveBeenCalled()
    // Kein Wurf: Er naehme #181 den Anfang seines Laufs und dem Nutzer den Abbruch.
    expect(beideSichten(lauf)).toBe(false)
  })
})

describe('freigeben - idempotent und nur fuer den eigenen Platz', () => {
  it('vertraegt mehrfaches Freigeben', async () => {
    const { registriereLauf } = await frischesModul()
    const lauf = registriereLauf('r-1')

    lauf.freigeben()
    expect(() => lauf.freigeben()).not.toThrow()
    expect(adapter.aufrufe).toBe(0)
  })

  it('meldet einen inzwischen gestarteten fremden Lauf nicht ab', async () => {
    const { registriereLauf, cancelRender } = await frischesModul()
    const erster = registriereLauf('r-1')
    const zweiter = registriereLauf('r-2')

    // Das verspaetete Freigeben des alten Laufs. Ohne die Identitaetspruefung raeumte
    // es den Platz des neuen - der waere danach unabbrechbar, und der Nutzer saesse
    // seinen Fehlstart aus.
    erster.freigeben()

    cancelRender('r-2')
    expect(beideSichten(zweiter)).toBe(true)
    expect(adapter.aufrufe).toBe(1)
  })
})

describe('Grenzen der Datei', () => {
  // Ohne Kommentarzeilen, sonst schlagen die Verbots-Vermerke im Kopf der Datei an -
  // und der einzeilige Doc-Kommentar "Am terminalen Ausgang ...", in dem "rm" steckt.
  // Die drei Anfaenge decken alle Kommentarformen dieser Datei ab: "//", die
  // Folgezeilen eines Blocks ("*") und seine Eroeffnung ("/*", auch "/**").
  const quelle = readFileSync(
    new URL('../../src/main/render-service/abbruch.ts', import.meta.url),
    'utf8',
  )
    .split('\n')
    .filter((zeile) => !/^(\/\/|\*|\/\*)/.test(zeile.trimStart()))
    .join('\n')

  // Die Grep-Probe aus der Definition of Done, mechanisch statt von Hand: Wer hier
  // aufraeumt, loescht unter einem noch laufenden Prozess (Windows: EBUSY; macOS:
  // stiller unlink bei offener Datei), und wer selbst einen Prozess anfasst, macht
  // diese Datei zur zweiten Stelle im Projekt, die ffmpeg-Prozesse kennt.
  it.each(['fs.', 'child_process', 'kill', 'unlink', 'rm'])('enthaelt kein %s', (verboten) => {
    expect(quelle).not.toContain(verboten)
  })

  // Kein zweites Lock: "Das ist der einzige Sperr-Mechanismus des Systems; ein
  // zweites Lock ist nicht noetig und darf nicht eingefuehrt werden." (TK 9.3.5)
  it.each(['lock', 'mutex', 'semaphor', 'sperre'])('baut kein %s', (verboten) => {
    expect(quelle.toLowerCase()).not.toContain(verboten)
  })

  it('haelt genau EINEN Controller je Lauf - kein zweites Kennzeichen', () => {
    // Ein boolean neben dem Controller waere der Fehler, gegen den das ganze Issue
    // gebaut ist. Es gibt genau ein `new AbortController()`, und die Frage-Sicht
    // liest den Controller, statt einen eigenen Wert zu fuehren.
    expect(quelle.match(/new AbortController\(\)/g)).toHaveLength(1)
    expect(quelle).toContain('istAbgebrochen: () => controller.signal.aborted')
  })

  it('wartet nirgends: kein await in dieser Datei', () => {
    expect(quelle).not.toMatch(/\bawait\b/)
  })
})
