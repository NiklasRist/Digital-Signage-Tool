// Tests zu #256 (M7-64) - die reine Seite (uebergabe.ts, ohne Browser).
// M7-08 wird ECHT benutzt; `rechneStandNeu`, `wechsleReiter`, `holeReiter`,
// `starteMedienImport`, `schliesseMediumFixAb` und `meldeFehler` sind Doppel.
import { readFileSync } from 'node:fs'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { KaputteStelle } from '../../src/renderer/composer/kaputt-erkennung'
import type { ReparaturStand } from '../../src/renderer/composer/reparatur-fuehrung'
import type { Uebergabe } from '../../src/renderer/composer/reparatur-optionen'
import type { Project } from '../../src/shared/contracts/project'
import {
  LEERE_SHELL_REPARATUR,
  type ShellReparatur,
} from '../../src/renderer/app-shell/reparatur-fuehrung-shell'
import {
  abschnittIndexFuer,
  beendeLaufende,
  brauchtMedienDialog,
  elementIdFuer,
  fuehreMedienImportAus,
  meldeStand,
  nimmUebergabeEntgegen,
  overlayFuer,
  reparaturhalter,
  schliesseFixAb,
  schliesseMedienImportAb,
  setzeReparaturhalterZurueck,
  type UebergabeUmgebung,
} from '../../src/renderer/app-shell/uebergabe'

// ---------------- Quelldatei-Verbote (Grep, nur auf DIESE Datei) ----------------

const QUELLE = readFileSync(
  new URL('../../src/renderer/app-shell/uebergabe.ts', import.meta.url),
  'utf8',
)
const CODEZEILEN = QUELLE.split('\n')
  .filter((z) => {
    const t = z.trim()
    return !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*')
  })
  .join('\n')

describe('uebergabe.ts – Verbote (Grep, nur auf DIESE Datei)', () => {
  it('kein JSX, kein react, kein IPC, kein Timer, kein fremder Fachaufruf, kein starteFuehrung', () => {
    for (const verbot of [
      'react', 'rufeAuf', 'abonniere', 'KANAELE', 'window.', 'setTimeout', 'setInterval',
      "'queue:'", 'istRenderFreigegeben', 'findeKaputteStellen', 'starteReparatur',
      'beendeFuehrung', 'starteFuehrung', 'reiterFuerUebergabe',
    ]) {
      expect(CODEZEILEN).not.toContain(verbot)
    }
    expect(CODEZEILEN).not.toMatch(/<(div|span|ul|li|p|img|canvas|button)\b/)
  })
})

// ---------------- Bausteine ----------------

function projekt(): Project {
  return {
    id: 'p-1',
    name: 'Probe',
    erstelltAm: '2026-08-01T09:00:00Z',
    geaendertAm: '2026-08-01T09:00:00Z',
    schemaVersion: 1,
    assets: [],
    aktionen: [],
    liste: [],
    standardSegmentdauer: 10,
    standardMarkeId: 'm1',
    letzterAusgabeName: null,
  }
}

function stand(ueber: Partial<ReparaturStand> = {}): ReparaturStand {
  return {
    aktiv: true,
    offen: [],
    gesamt: 3,
    behoben: 1,
    zeigerIndex: 0,
    aktuelle: null,
    ...ueber,
  }
}

/** Eine Umgebung mit Spionen; das Projekt ist offen, der Reiter 'zusammenstellen'. */
function umgebung(teil: Partial<UebergabeUmgebung> & { startProjekt?: Project | null; startLage?: ShellReparatur } = {}): {
  u: UebergabeUmgebung
  wechsleReiter: ReturnType<typeof vi.fn>
  holeReiter: ReturnType<typeof vi.fn>
  rechneStandNeu: ReturnType<typeof vi.fn>
  starteMedienImport: ReturnType<typeof vi.fn>
  schliesseMediumFixAb: ReturnType<typeof vi.fn>
  meldeFehler: ReturnType<typeof vi.fn>
} {
  const halter = reparaturhalter()
  if (teil.startLage !== undefined) {
    halter.setzeLage(teil.startLage)
  }
  const projektOderNull =
    teil.startProjekt === undefined ? projekt() : teil.startProjekt
  const wechsleReiter = vi.fn()
  const holeReiter = vi.fn(() => 'zusammenstellen' as const)
  const rechneStandNeu = vi.fn((standWert: ReparaturStand) => ({
    ...standWert,
    behoben: standWert.behoben + 1,
  }))
  const starteMedienImport = vi.fn(async () => ({
    ok: true as const,
    wert: { auftragIds: ['q-1'], uebersprungen: [], abgelehnt: [], abgebrochen: false },
  }))
  const schliesseMediumFixAb = vi.fn(async () => ({
    ok: true as const,
    wert: { art: 'erledigt' as const },
  }))
  const meldeFehler = vi.fn()
  return {
    u: {
      halter,
      holeProjekt: vi.fn(() => projektOderNull),
      holeReiter: holeReiter as unknown as UebergabeUmgebung['holeReiter'],
      wechsleReiter: wechsleReiter as unknown as UebergabeUmgebung['wechsleReiter'],
      rechneStandNeu: rechneStandNeu as unknown as UebergabeUmgebung['rechneStandNeu'],
      starteMedienImport: starteMedienImport as unknown as UebergabeUmgebung['starteMedienImport'],
      schliesseMediumFixAb: schliesseMediumFixAb as unknown as UebergabeUmgebung['schliesseMediumFixAb'],
      meldeFehler: meldeFehler as unknown as UebergabeUmgebung['meldeFehler'],
    },
    wechsleReiter,
    holeReiter,
    rechneStandNeu,
    starteMedienImport,
    schliesseMediumFixAb,
    meldeFehler,
  }
}

const A = 'aktion-1' as const

// ---------------- Die fünf reinen Funktionen ----------------

describe('overlayFuer / brauchtMedienDialog / elementIdFuer / abschnittIndexFuer (#256)', () => {
  it('fünf benannte Overlay-Zuordnungen', () => {
    expect(overlayFuer(null)).toBe('keins')
    expect(overlayFuer({ ziel: 'asset-auswahl', elementId: 'e1' })).toBe('asset-auswahl')
    expect(overlayFuer({ ziel: 'aktions-auswahl', elementId: 'e1', abschnittIndex: null })).toBe('aktions-auswahl')
    expect(overlayFuer({ ziel: 'action-editor', aktionId: A })).toBe('keins')
    expect(overlayFuer({ ziel: 'medien-import', elementId: 'e1' })).toBe('keins')
  })

  it('brauchtMedienDialog: true NUR für medien-import (vier Prüfungen)', () => {
    expect(brauchtMedienDialog(null)).toBe(false)
    expect(brauchtMedienDialog({ ziel: 'asset-auswahl', elementId: 'e' })).toBe(false)
    expect(brauchtMedienDialog({ ziel: 'action-editor', aktionId: A })).toBe(false)
    expect(brauchtMedienDialog({ ziel: 'medien-import', elementId: 'e1' })).toBe(true)
  })

  it('elementIdFuer: Kennung bei den zwei Auswahl-Zielen, null sonst', () => {
    expect(elementIdFuer({ ziel: 'asset-auswahl', elementId: 'e1' })).toBe('e1')
    expect(elementIdFuer({ ziel: 'aktions-auswahl', elementId: 'e2', abschnittIndex: null })).toBe('e2')
    expect(elementIdFuer({ ziel: 'action-editor', aktionId: A })).toBeNull()
    expect(elementIdFuer({ ziel: 'medien-import', elementId: 'e3' })).toBeNull()
    expect(elementIdFuer(null)).toBeNull()
  })

  it('abschnittIndexFuer: die Zahl genau beim Band-Abschnitt', () => {
    expect(abschnittIndexFuer({ ziel: 'aktions-auswahl', elementId: 'e1', abschnittIndex: 1 })).toBe(1)
    expect(abschnittIndexFuer({ ziel: 'aktions-auswahl', elementId: 'e1', abschnittIndex: null })).toBeNull()
    expect(abschnittIndexFuer({ ziel: 'asset-auswahl', elementId: 'e1' })).toBeNull()
    expect(abschnittIndexFuer(null)).toBeNull()
  })
})

describe('reparaturhalter (#256)', () => {
  beforeEach(() => setzeReparaturhalterZurueck())

  it('liefert bei zwei Aufrufen DASSELBE Objekt; zuruecksetzen ergibt ein ANDERES mit leeren Lager', () => {
    const erster = reparaturhalter()
    expect(reparaturhalter()).toBe(erster)
    erster.setzeLage({ stand: stand(), laufendeUebergabe: null, hervorgehobeneAktionId: null, rueckkehrReiter: null })
    setzeReparaturhalterZurueck()
    const zweiter = reparaturhalter()
    expect(zweiter).not.toBe(erster)
    expect(zweiter.holeLage()).toEqual(LEERE_SHELL_REPARATUR)
  })

  it('Hörer: keine Anmeldungsnachricht, Genau-Einmal je Änderung, idempotente Abmeldung, werfender Hörer reißt niemanden mit', () => {
    const halter = reparaturhalter()
    const a = vi.fn()
    const b = vi.fn()
    const aboA = halter.aufLageGeaendert(a)
    const aboB = halter.aufLageGeaendert(b)
    expect(a).not.toHaveBeenCalled()

    halter.setzeLage(LEERE_SHELL_REPARATUR)
    expect(a).toHaveBeenCalledTimes(1)
    expect(b).toHaveBeenCalledTimes(1)

    aboA()
    aboA() // idempotent
    const c = vi.fn()
    const aboC = halter.aufLageGeaendert(c)
    aboC()

    // b wurde abgemeldet durch seine eigene Funktion innerhalb einer Runde?
    const werfer = vi.fn(() => {
      throw new Error('Hörer kaputt')
    })
    const aboWerfer = halter.aufLageGeaendert(werfer as never)
    void aboWerfer
    halter.setzeLage({ ...LEERE_SHELL_REPARATUR, hervorgehobeneAktionId: 'x' })
    // c wurde NICHT abgemeldet (aboC wurde versehentlich sofort gerufen) - nimm
    // die Situation: b und werfer sind angemeldet.
    expect(b).toHaveBeenCalledTimes(2)
    expect(werfer).toHaveBeenCalledTimes(1)
  })

  it('ein Hörer, der sich selbst während der Runde abmeldet, bricht die laufende Benachrichtigung nicht ab', () => {
    const halter = reparaturhalter()
    const zweiter = vi.fn()
    let aboSelbst: (() => void) | null = null
    const selbst = vi.fn(() => {
      aboSelbst?.()
    })
    aboSelbst = halter.aufLageGeaendert(selbst)
    halter.aufLageGeaendert(zweiter)
    halter.setzeLage(LEERE_SHELL_REPARATUR)
    expect(selbst).toHaveBeenCalledTimes(1)
    expect(zweiter).toHaveBeenCalledTimes(1)
  })
})

// ---------------- nimmUebergabeEntgegen ----------------

describe('nimmUebergabeEntgegen (#256) – der HINWEG', () => {
  beforeEach(() => setzeReparaturhalterZurueck())

  it('Kernnachweis „Hinweg wird ausgeführt“: hervorgehobeneAktionId gesetzt, wechsleReiter genau einmal mit "aktionen"', () => {
    const { u, wechsleReiter } = umgebung()
    nimmUebergabeEntgegen(u, { ziel: 'action-editor', aktionId: A })
    expect(u.halter.holeLage().hervorgehobeneAktionId).toBe(A)
    expect(wechsleReiter).toHaveBeenCalledTimes(1)
    expect(wechsleReiter).toHaveBeenCalledWith('aktionen')
  })

  it('Kein Reiterwechsel für asset-auswahl, aktions-auswahl und medien-import (drei benannte Tests)', () => {
    const erste = umgebung()
    nimmUebergabeEntgegen(erste.u, { ziel: 'asset-auswahl', elementId: 'e1' })
    expect(erste.wechsleReiter).not.toHaveBeenCalled()

    const zweite = umgebung()
    nimmUebergabeEntgegen(zweite.u, { ziel: 'aktions-auswahl', elementId: 'e1', abschnittIndex: null })
    expect(zweite.wechsleReiter).not.toHaveBeenCalled()

    const dritte = umgebung()
    nimmUebergabeEntgegen(dritte.u, { ziel: 'medien-import', elementId: 'e1' })
    expect(dritte.wechsleReiter).not.toHaveBeenCalled()
  })

  it('Die Lage steht VOR dem Reiterwechsel bereit (benannter Reihenfolge-Test)', () => {
    const { u } = umgebung()
    const gesehen: unknown[] = []
    u.halter.aufLageGeaendert((lage) => {
      gesehen.push({ lage, reiterGesehen: u.holeReiter() })
    })
    let reiterBeimWechsel: unknown = null
    ;(u.wechsleReiter as ReturnType<typeof vi.fn>).mockImplementation((ziel: string) => {
      reiterBeimWechsel = vistoDurch({ ziel, lage: u.halter.holeLage() })
    })
    function vistoDurch(x: { ziel: string; lage: ShellReparatur }): { ziel: string; lage: ShellReparatur } {
      return x
    }
    nimmUebergabeEntgegen(u, { ziel: 'action-editor', aktionId: A })
    expect(reiterBeimWechsel).toEqual({ ziel: 'aktionen', lage: u.halter.holeLage() })
    expect((u.halter.holeLage().rueckkehrReiter as string) ?? '').toBe('zusammenstellen')
    expect(gesehen.length).toBe(1)
  })

  it('medien-import: starteMedienImport GENAU EINMAL mit (projekt, null) - nicht abgewartet, aber eingeleitet', async () => {
    const { u, starteMedienImport } = umgebung()
    const p = projekt()
    ;(u.holeProjekt as ReturnType<typeof vi.fn>).mockReturnValue(p)
    nimmUebergabeEntgegen(u, { ziel: 'medien-import', elementId: 'e1' })
    // Der Aufruf läuft OHNE await - die eingereihte Promise zk die Tests abfangen.
    await Promise.resolve()
    await Promise.resolve()
    expect(starteMedienImport).toHaveBeenCalledTimes(1)
    // Der Vertrag schickt die PROJEKT-KENNUNG in den Dialog, nicht das Objekt.
    expect(starteMedienImport.mock.calls[0]?.[0]).toBe(p.id)
    expect(starteMedienImport.mock.calls[0]?.[1]).toBeNull()
  })
})

// ---------------- beendeLaufende ----------------

describe('beendeLaufende (#256) – die RÜCKKEHR', () => {
  beforeEach(() => setzeReparaturhalterZurueck())

  it('Kernnachweis „Rückkehr wird ausgeführt“: wechsleReiter genau einmal mit dem Rückkehr-Reiter, alles zurückgesetzt', () => {
    const startLage: ShellReparatur = {
      stand: stand(),
      laufendeUebergabe: { ziel: 'action-editor', aktionId: A },
      hervorgehobeneAktionId: A,
      rueckkehrReiter: 'zusammenstellen',
    }
    const { u, wechsleReiter } = umgebung({ startLage })
    beendeLaufende(u)
    expect(wechsleReiter).toHaveBeenCalledTimes(1)
    expect(wechsleReiter).toHaveBeenCalledWith('zusammenstellen')
    const lage = u.halter.holeLage()
    expect(lage.laufendeUebergabe).toBeNull()
    expect(lage.hervorgehobeneAktionId).toBeNull()
    expect(lage.rueckkehrReiter).toBeNull()
  })

  it('Ohne laufende Übergabe: wirft nicht, ruft wechsleReiter NULL Mal', () => {
    const { u, wechsleReiter } = umgebung()
    expect(() => beendeLaufende(u)).not.toThrow()
    expect(wechsleReiter).not.toHaveBeenCalled()
  })
})

// ---------------- schliesseFixAb ----------------

describe('schliesseFixAb (#256)', () => {
  beforeEach(() => setzeReparaturhalterZurueck())

  it('Kernnachweis „erledigt rechnet neu und beendet“: rechneStandNeu genau einmal mit (stand, projekt), toBe durchgehend', () => {
    const p = projekt()
    const s = stand()
    const startLage: ShellReparatur = {
      stand: s,
      laufendeUebergabe: { ziel: 'asset-auswahl', elementId: 'e1' },
      hervorgehobeneAktionId: null,
      rueckkehrReiter: null,
    }
    const { u, rechneStandNeu } = umgebung({ startLage, startProjekt: p })
    schliesseFixAb(u, { art: 'erledigt' })
    expect(rechneStandNeu).toHaveBeenCalledTimes(1)
    expect(rechneStandNeu.mock.calls[0]?.[0]).toBe(s)
    expect(rechneStandNeu.mock.calls[0]?.[1]).toBe(p)
    expect(u.halter.holeLage().stand?.behoben).toBe(s.behoben + 1)
    expect(u.halter.holeLage().laufendeUebergabe).toBeNull()
  })

  it('RechneStandNeu wird VOR dem Reiterwechsel gerufen (Aufrufreihenfolge der Spione)', () => {
    const reihenfolge: string[] = []
    const startLage: ShellReparatur = {
      stand: stand(),
      laufendeUebergabe: { ziel: 'action-editor', aktionId: A },
      hervorgehobeneAktionId: null,
      rueckkehrReiter: 'zusammenstellen',
    }
    const { u } = umgebung({ startLage })
    u.halter.setzeLage(startLage)
    ;(u.rechneStandNeu as ReturnType<typeof vi.fn>).mockImplementation((standWert: ReparaturStand) => {
      reihenfolge.push('rechne')
      return standWert
    })
    ;(u.wechsleReiter as ReturnType<typeof vi.fn>).mockImplementation((ziel: string) => {
      reihenfolge.push(`wechsel:${ziel}`)
    })
    schliesseFixAb(u, { art: 'erledigt' })
    expect(reihenfolge.indexOf('rechne')).toBeGreaterThanOrEqual(0)
    expect(reihenfolge.indexOf('rechne')).toBeLessThan(reihenfolge.indexOf('wechsel:zusammenstellen'))
  })

  it('stand === null: nichts nachgerechnet, die Übergabe wird trotzdem beendet', () => {
    const startLage: ShellReparatur = {
      ...LEERE_SHELL_REPARATUR,
      laufendeUebergabe: { ziel: 'asset-auswahl', elementId: 'e1' },
    }
    const { u, rechneStandNeu } = umgebung({ startLage })
    schliesseFixAb(u, { art: 'erledigt' })
    expect(rechneStandNeu).not.toHaveBeenCalled()
    expect(u.halter.holeLage().laufendeUebergabe).toBeNull()
  })

  it('projekt === null: dito - KEIN rechneStandNeu mit null', () => {
    const startLage: ShellReparatur = {
      stand: stand(),
      laufendeUebergabe: { ziel: 'asset-auswahl', elementId: 'e1' },
      hervorgehobeneAktionId: null,
      rueckkehrReiter: null,
    }
    const { u, rechneStandNeu } = umgebung({ startLage, startProjekt: null })
    schliesseFixAb(u, { art: 'erledigt' })
    expect(rechneStandNeu).not.toHaveBeenCalled()
    expect(u.halter.holeLage().laufendeUebergabe).toBeNull()
  })

  it('art: "uebergabe" -> die NÄCHSTE Übergabe: rechneStandNeu null Mal, die laufende ist DAS an (ENTSCHIEDEN 5)', () => {
    const startLage: ShellReparatur = {
      stand: stand(),
      laufendeUebergabe: { ziel: 'asset-auswahl', elementId: 'e1' },
      hervorgehobeneAktionId: null,
      rueckkehrReiter: 'zusammenstellen',
    }
    const { u, rechneStandNeu } = umgebung({ startLage })
    const an: Uebergabe = { ziel: 'aktions-auswahl', elementId: 'e2', abschnittIndex: 1 }
    schliesseFixAb(u, { art: 'uebergabe', an })
    expect(rechneStandNeu).not.toHaveBeenCalled()
    expect(u.halter.holeLage().laufendeUebergabe).toBe(an)
  })
})

// ---------------- Der Medien-Import: Hinweg und Rückweg ----------------

describe('fuehreMedienImportAus (#256) – der HINWEG', () => {
  beforeEach(() => setzeReparaturhalterZurueck())

  async function lege(): Promise<Uebergabe> {
    return { ziel: 'medien-import', elementId: 'e1' }
  }

  it('Ohne offenes Projekt: kein Dialog, ungueltige_eingabe gemeldet, Übergabe beendet', async () => {
    const startLage: ShellReparatur = { ...LEERE_SHELL_REPARATUR, laufendeUebergabe: await lege() }
    const { u, starteMedienImport, meldeFehler } = umgebung({ startLage, startProjekt: null })
    await fuehreMedienImportAus(u)
    expect(starteMedienImport).not.toHaveBeenCalled()
    expect(meldeFehler).toHaveBeenCalledWith('ungueltige_eingabe', expect.any(String))
    expect(u.halter.holeLage().laufendeUebergabe).toBeNull()
  })

  it('ok: false -> meldeFehler mit UNVERÄNDERTEM Code, Übergabe beendet', async () => {
    const startLage: ShellReparatur = { ...LEERE_SHELL_REPARATUR, laufendeUebergabe: await lege() }
    const { u, starteMedienImport, meldeFehler } = umgebung({ startLage })
    ;(starteMedienImport as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      fehler: { code: 'speicher_fehler', meldung: 'kaputt' },
    })
    await fuehreMedienImportAus(u)
    expect(meldeFehler).toHaveBeenCalledWith('speicher_fehler', 'kaputt')
    expect(u.halter.holeLage().laufendeUebergabe).toBeNull()
  })

  it('abgebrochen: true -> KEIN Fehler, Übergabe beendet', async () => {
    const startLage: ShellReparatur = { ...LEERE_SHELL_REPARATUR, laufendeUebergabe: await lege() }
    const { u, starteMedienImport, meldeFehler } = umgebung({ startLage })
    ;(starteMedienImport as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      wert: { auftragIds: [], uebersprungen: ['x'], abgelehnt: [], abgebrochen: true },
    })
    await fuehreMedienImportAus(u)
    expect(meldeFehler).not.toHaveBeenCalled()
    expect(u.halter.holeLage().laufendeUebergabe).toBeNull()
  })

  it('ok: true mit leerem auftragIds -> Übergabe beendet, kein Fehler', async () => {
    const startLage: ShellReparatur = { ...LEERE_SHELL_REPARATUR, laufendeUebergabe: await lege() }
    const { u, starteMedienImport, meldeFehler } = umgebung({ startLage })
    ;(starteMedienImport as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      wert: { auftragIds: [], uebersprungen: [], abgelehnt: [], abgebrochen: false },
    })
    await fuehreMedienImportAus(u)
    expect(meldeFehler).not.toHaveBeenCalled()
    expect(u.halter.holeLage().laufendeUebergabe).toBeNull()
  })

  it('Kernnachweis „der Import bleibt offen, bis der Asset da ist“: mindestens ein auftragId -> Übergabe STEHT, wechsle/rechne null', async () => {
    const an = await lege()
    const startLage: ShellReparatur = { ...LEERE_SHELL_REPARATUR, laufendeUebergabe: an }
    const { u, wechsleReiter, rechneStandNeu, schliesseMediumFixAb } = umgebung({ startLage })
    ;(starteMedienImportMock(u) as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      wert: { auftragIds: ['q-9'], uebersprungen: ['ja'], abgelehnt: [{ pfad: 'x', code: 'zeilen', meldung: 'm' }], abgebrochen: false },
    })
    await fuehreMedienImportAus(u)
    expect(u.halter.holeLage().laufendeUebergabe).toBe(an)
    expect(wechsleReiter).not.toHaveBeenCalled()
    expect(rechneStandNeu).not.toHaveBeenCalled()
    // KEINE Abschluss-Funktion gerufen:
    expect(schliesseMediumFixAb).not.toHaveBeenCalled()
  })

  it('wirft starteMedienImport -> gefangen: unbekannter_fehler, Übergabe beendet, der Wurf verlässt die Datei nicht', async () => {
    const startLage: ShellReparatur = { ...LEERE_SHELL_REPARATUR, laufendeUebergabe: await lege() }
    const { u, starteMedienImport, meldeFehler } = umgebung({ startLage })
    ;(starteMedienImport as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Dialog geplatzt'))
    await fuehreMedienImportAus(u)
    expect(meldeFehler).toHaveBeenCalledWith('unbekannter_fehler', 'Dialog geplatzt')
    expect(u.halter.holeLage().laufendeUebergabe).toBeNull()
  })
})

function starteMedienImportMock(u: UebergabeUmgebung): unknown {
  return u.starteMedienImport
}

describe('schliesseMedienImportAb (#256) – der RÜCKWEG', () => {
  beforeEach(() => setzeReparaturhalterZurueck())

  it('Kernnachweis „der Import-Rückweg schliesst die Reparatur“: (e1, a9) genau einmal, Stand neu, Übergabe zu', async () => {
    const startLage: ShellReparatur = {
      stand: stand(),
      laufendeUebergabe: { ziel: 'medien-import', elementId: 'e1' },
      hervorgehobeneAktionId: null,
      rueckkehrReiter: null,
    }
    const { u, schliesseMediumFixAb, rechneStandNeu } = umgebung({ startLage })
    // Der Rückweg aus #133 liefert erledigt - der Weg läuft via schliesseFixAb.
    ;(schliesseMediumFixAb as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      wert: { art: 'erledigt' },
    })
    await schliesseMedienImportAb(u, 'a9')
    expect(schliesseMediumFixAb).toHaveBeenCalledTimes(1)
    expect(schliesseMediumFixAb.mock.calls[0]?.[0]).toBe('e1')
    expect(schliesseMediumFixAb.mock.calls[0]?.[1]).toBe('a9')
    expect(rechneStandNeu).toHaveBeenCalledTimes(1)
    expect(u.halter.holeLage().laufendeUebergabe).toBeNull()
  })

  it('keine laufende Übergabe -> NICHTS: kein Aufruf, keine Meldung, Lage toBe-unverändert', async () => {
    const { u, schliesseMediumFixAb, meldeFehler } = umgebung()
    const vor = u.halter.holeLage()
    await schliesseMedienImportAb(u, 'a9')
    expect(schliesseMediumFixAb).not.toHaveBeenCalled()
    expect(meldeFehler).not.toHaveBeenCalled()
    expect(u.halter.holeLage()).toBe(vor)
  })

  it('eine Übergabe mit ziel asset-auswahl läuft -> ebenfalls NICHTS', async () => {
    const startLage: ShellReparatur = {
      ...LEERE_SHELL_REPARATUR,
      laufendeUebergabe: { ziel: 'asset-auswahl', elementId: 'e1' },
    }
    const { u, schliesseMediumFixAb } = umgebung({ startLage })
    const vor = u.halter.holeLage()
    await schliesseMedienImportAb(u, 'a9')
    expect(schliesseMediumFixAb).not.toHaveBeenCalled()
    expect(u.halter.holeLage()).toBe(vor)
  })

  it('zweiter Aufruf nach dem ersten: schliesseMediumFixAb wird NICHT ein zweites Mal gerufen (ENTSCHIEDEN 13)', async () => {
    const startLage: ShellReparatur = {
      stand: stand(),
      laufendeUebergabe: { ziel: 'medien-import', elementId: 'e1' },
      hervorgehobeneAktionId: null,
      rueckkehrReiter: null,
    }
    const { u, schliesseMediumFixAb } = umgebung({ startLage })
    ;(schliesseMediumFixAb as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      wert: { art: 'erledigt' },
    })
    await schliesseMedienImportAb(u, 'a9')
    await schliesseMedienImportAb(u, 'a10')
    expect(schliesseMediumFixAb).toHaveBeenCalledTimes(1)
  })

  it('u.schliesseMediumFixAb liefert ok false -> UNVERÄNDERT gemeldet, Übergabe TROTZDEM beendet', async () => {
    const startLage: ShellReparatur = {
      stand: stand(),
      laufendeUebergabe: { ziel: 'medien-import', elementId: 'e1' },
      hervorgehobeneAktionId: null,
      rueckkehrReiter: null,
    }
    const { u, schliesseMediumFixAb, meldeFehler } = umgebung({ startLage })
    ;(schliesseMediumFixAb as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      fehler: { code: 'nicht_gefunden', meldung: 'Element weg' },
    })
    await schliesseMedienImportAb(u, 'a9')
    expect(meldeFehler).toHaveBeenCalledWith('nicht_gefunden', 'Element weg')
    expect(u.halter.holeLage().laufendeUebergabe).toBeNull()
  })

  it('u.schliesseMediumFixAb wirft -> unbekannter_fehler, Übergabe beendet, der Wurf verlässt die Datei nicht', async () => {
    const startLage: ShellReparatur = {
      stand: stand(),
      laufendeUebergabe: { ziel: 'medien-import', elementId: 'e1' },
      hervorgehobeneAktionId: null,
      rueckkehrReiter: null,
    }
    const { u, schliesseMediumFixAb, meldeFehler } = umgebung({ startLage })
    ;(schliesseMediumFixAb as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Fix geplatzt'))
    await schliesseMedienImportAb(u, 'a9')
    expect(meldeFehler).toHaveBeenCalledWith('unbekannter_fehler', 'Fix geplatzt')
    expect(u.halter.holeLage().laufendeUebergabe).toBeNull()
  })
})

// ---------------- meldeStand + unveränderliche Eingaben ----------------

describe('meldeStand (#256)', () => {
  beforeEach(() => setzeReparaturhalterZurueck())

  it('stand toBe-gleich, rechneStandNeu null Mal, wechsleReiter null Mal', () => {
    const { u, rechneStandNeu, wechsleReiter } = umgebung()
    const s = stand({ behoben: 9 })
    meldeStand(u, s)
    expect(u.halter.holeLage().stand).toBe(s)
    expect(rechneStandNeu).not.toHaveBeenCalled()
    expect(wechsleReiter).not.toHaveBeenCalled()
  })

  it('KEINE Funktion verändert die eingefrorene Lage', () => {
    const lage: ShellReparatur = Object.freeze({
      stand: Object.freeze(stand()),
      laufendeUebergabe: Object.freeze({ ziel: 'asset-auswahl', elementId: 'e1' } as never) as Uebergabe,
      hervorgehobeneAktionId: null,
      rueckkehrReiter: 'zusammenstellen',
    }) as ShellReparatur
    const { u } = umgebung({ startLage: lage })
    expect(() => nimmUebergabeEntgegen(u, { ziel: 'aktions-auswahl', elementId: 'e2', abschnittIndex: null })).not.toThrow()
    expect(() => beendeLaufende(u)).not.toThrow()
    expect(() => schliesseFixAb(u, { art: 'erledigt' })).not.toThrow()
    expect(() => meldeStand(u, stand({ behoben: 2 }))).not.toThrow()
  })
})

// Die KaputteStelle-Import bleibt als Beleg, dass der Typ in stand.aktuelle fließt.
void (null as unknown as KaputteStelle | null)
