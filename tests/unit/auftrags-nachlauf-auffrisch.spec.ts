// Verhaltenstests zu #347 - auftrags-nachlauf.ts: render/export frischen die
// Ausgabe-Liste auf (M7-06, Ablaufschritt 5); NUR bei render wird
// Project.letzterAusgabeName in der Sicht nachgefuehrt (TK v3.2 / 9.3.6).
//
// Der echte Nachlauf laeuft; die Wirkstellen sind Spione. Merk-Auftraege sind
// async: je Test wird die Mikrotask-Warteschlange abgewartet, bevor gezählt wird.
import { describe, expect, it, vi } from 'vitest'

import type { Auftrag } from '../../src/shared/contracts/auftrag'
import type { Project } from '../../src/shared/contracts/project'
import { starteAuftragsNachlauf, type NachlaufWirkungen } from '../../src/renderer/app-shell/auftrags-nachlauf'

const PROJEKT: Project = {
  id: 'p-1',
  name: 'Testprojekt',
  erstelltAm: '',
  geaendertAm: '',
  schemaVersion: 1,
  assets: [],
  aktionen: [],
  liste: [],
  letzterAusgabeName: 'alt',
  standardMarkeId: 'm',
  standardSegmentdauer: 10,
} as Project

function baueWirkungen() {
  const spione = {
    aktualisiereAusgabenListe: vi.fn(),
    setzeProjekt: vi.fn(),
    holeProjekt: vi.fn(() => PROJEKT),
    verwirfMotivBestand: vi.fn(),
    leereProjektHistorie: vi.fn(),
    meldeFehler: vi.fn(),
    bereiteZeichnenVor: vi.fn(async () => ({ ok: true, wert: { vorlagen: [] } })),
  }
  return { spione, wirkungen: spione as unknown as NachlaufWirkungen }
}

async function warte(): Promise<void> {
  for (let i = 0; i < 20; i += 1) {
    await new Promise((r) => setTimeout(r, 2))
  }
}

function renderAuftrag(status: Auftrag['status'], ergebnis: unknown): Auftrag {
  return {
    auftragId: 'r-1',
    art: 'render',
    status,
    label: 'Render',
    payload: { renderId: 'rr', projektId: 'p-1', elemente: [], profil: {}, ausgabeName: 'sommer' } as never,
    fortschritt: null,
    versuche: 0,
    fehler: null,
    ergebnis,
    erstelltAm: '',
  } as Auftrag
}

function exportAuftrag(ergebnis: unknown): Auftrag {
  return {
    auftragId: 'e-1',
    art: 'export',
    status: 'erfolg',
    label: 'Export',
    payload: { projektId: 'p-1', dateiname: 'sommer.mp4', zielPfad: 'E:/Stick' } as never,
    fortschritt: null,
    versuche: 0,
    fehler: null,
    ergebnis,
    erstelltAm: '',
  } as Auftrag
}

describe('auftrags-nachlauf - der Auffrisch-Weg der Ausgaben (#347)', () => {
  it('render mit Erfolg: aktualisiereAusgabenListe GENAU EINmal; letzterAusgabeName EINZELN nachgefuehrt', async () => {
    const { spione, wirkungen } = baueWirkungen()
    starteAuftragsNachlauf((hoerer) => {
      hoerer([
        renderAuftrag('erfolg', { ausgabeName: 'sommer', pfad: 'x', dateigroesse: 1 }),
      ])
      return () => {}
    }, wirkungen)
    await warte()

    expect(spione.aktualisiereAusgabenListe).toHaveBeenCalledTimes(1)
    expect(spione.setzeProjekt).toHaveBeenCalledTimes(1)
    const nachher = spione.setzeProjekt.mock.calls[0][0] as Project
    expect(nachher.letzterAusgabeName).toBe('sommer')
    // Gleiche Array-Referenzen (M7-06, ENTSCHIEDEN 12): nur das EINZE Feld steht neu.
    expect(nachher.assets).toBe(PROJEKT.assets)
    expect(nachher.liste).toBe(PROJEKT.liste)
    expect(nachher.aktionen).toBe(PROJEKT.aktionen)
    // Kein Motiv-Verwurf, keine Historie-Leerung, keine Zeichenvorbereitung bei Render.
    expect(spione.verwirfMotivBestand).not.toHaveBeenCalled()
    expect(spione.leereProjektHistorie).not.toHaveBeenCalled()
    expect(spione.bereiteZeichnenVor).not.toHaveBeenCalled()
    expect(spione.meldeFehler).not.toHaveBeenCalled()
  })

  it('export mit Erfolg: aktualisiereAusgabenListe, aber KEIN setzeProjekt', async () => {
    const { spione, wirkungen } = baueWirkungen()
    starteAuftragsNachlauf((hoerer) => {
      hoerer([exportAuftrag({ zielPfad: 'E:/Stick', dateigroesse: 1 })])
      return () => {}
    }, wirkungen)
    await warte()

    expect(spione.aktualisiereAusgabenListe).toHaveBeenCalledTimes(1)
    expect(spione.setzeProjekt).not.toHaveBeenCalled()
    expect(spione.verwirfMotivBestand).not.toHaveBeenCalled()
  })

  it('fehlgeschlagener Render frischt NICHT auf', async () => {
    const { spione, wirkungen } = baueWirkungen()
    starteAuftragsNachlauf((hoerer) => {
      hoerer([renderAuftrag('fehlgeschlagen', null)])
      return () => {}
    }, wirkungen)
    await warte()

    expect(spione.aktualisiereAusgabenListe).not.toHaveBeenCalled()
    expect(spione.setzeProjekt).not.toHaveBeenCalled()
  })

  it('dieselbe Kennung wird GENAU EINmal ausgewertet (Push traegt den terminalen Auftrag erneut)', async () => {
    const { spione, wirkungen } = baueWirkungen()
    const auftrag = renderAuftrag('erfolg', { ausgabeName: 'sommer' })
    starteAuftragsNachlauf((hoerer) => {
      hoerer([auftrag])
      hoerer([auftrag])
      return () => {}
    }, wirkungen)
    await warte()

    expect(spione.aktualisiereAusgabenListe).toHaveBeenCalledTimes(1)
  })

  it('render Erfolg ohne gueltigen Ausgabename: melden, kein Sicht-Nachzug; Auffrisch trotzdem', async () => {
    const { spione, wirkungen } = baueWirkungen()
    starteAuftragsNachlauf((hoerer) => {
      hoerer([renderAuftrag('erfolg', { pfad: 'nur/pfad' })])
      return () => {}
    }, wirkungen)
    await warte()

    expect(spione.meldeFehler).toHaveBeenCalledTimes(1)
    expect(spione.setzeProjekt).not.toHaveBeenCalled()
    // Die Auffrisch selbst ist trotzdem geschehen - der Ordner ist die Wahrheit.
    expect(spione.aktualisiereAusgabenListe).toHaveBeenCalledTimes(1)
  })
})
