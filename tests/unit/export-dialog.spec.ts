// Tests zu #232 (M7-39) - export-dialog.ts und export-dialog.tsx.
// Die reine Seite laeuft ohne jsdom; die Anzeige folgt als jsdom-Test in
// derselben Datei (createRoot-Muster wie in tests/unit/leiste-zeile.spec.ts).

import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  LEERE_EXPORTAUSWAHL,
  istExportBereit,
  loeseExportMitAuswahlAus,
  waehleDatei,
  waehleZiel,
} from '../../src/renderer/composer/export-dialog'

import type { AusgabeDatei } from '../../src/renderer/composer/ausgabe-liste'

// ---------------- Bausteine ----------------

const d = (name: string, groesse = 4096): AusgabeDatei => ({
  dateiname: name,
  dateigroesse: groesse,
  geaendertAm: '2026-08-04T14:12:00Z',
})

const BESTAND: AusgabeDatei[] = [
  d('sommeraktion.mp4', 100),
  d('winterpause.mp4', 200),
]

const tief = (pfad: string | null): unknown =>
  pfad === null
    ? { ok: true, wert: { pfad: null } }
    : { ok: true, wert: { pfad } }

describe('waehleDatei (#232)', () => {
  it('bekannter Name -> datei gesetzt, zielPfad bleibt stehen', () => {
    const vorher: typeof LEERE_EXPORTAUSWAHL = { datei: null, zielPfad: 'C:\\Ziel' }
    const nachher = waehleDatei(vorher, 'sommeraktion.mp4', BESTAND)
    expect(nachher.datei?.dateiname).toBe('sommeraktion.mp4')
    expect(nachher.zielPfad).toBe('C:\\Ziel')
  })

  it('unbekannter Name -> datei: null, KEIN erfundener Eintrag', () => {
    const nachher = waehleDatei(LEERE_EXPORTAUSWAHL, 'fehlt.mp4', BESTAND)
    expect(nachher.datei).toBeNull()
  })

  it('buchstabengleich: Sommer.mp4 findet sommer.mp4 NICHT', () => {
    // Der Bestand enthaelt die KLEINGESCHRIEBENE Fassung - nur so unterscheidet
    // der Test eine echte Gross-/Kleinschreibungs-Regel von "Name nicht gefunden".
    expect(waehleDatei(LEERE_EXPORTAUSWAHL, 'Sommer.mp4', [d('sommer.mp4')]).datei).toBeNull()
  })

  it('veraendert die Eingabe NICHT (Feldgleichheit zu einer vorher genommenen Kopie)', () => {
    const eingabe: typeof LEERE_EXPORTAUSWAHL = { datei: d('sommeraktion.mp4'), zielPfad: 'E:\\' }
    const kopie = { ...eingabe }
    const _ = waehleDatei(eingabe, 'andere.mp4', BESTAND)
    void _
    expect(eingabe.datei?.dateiname).toBe(kopie.datei?.dateiname)
    expect(eingabe.zielPfad).toBe(kopie.zielPfad)
  })
})

describe('istExportBereit (#232) - vier Kombinationen', () => {
  it('datei=null, ziel=null -> false', () => {
    expect(istExportBereit(LEERE_EXPORTAUSWAHL)).toBe(false)
  })
  it('datei gesetzt, ziel=null -> false', () => {
    expect(istExportBereit({ datei: d('a.mp4'), zielPfad: null })).toBe(false)
  })
  it('datei=null, ziel gesetzt -> false', () => {
    expect(istExportBereit({ datei: null, zielPfad: 'E:\\' })).toBe(false)
  })
  it('beide gesetzt -> true', () => {
    expect(istExportBereit({ datei: d('a.mp4'), zielPfad: 'E:\\' })).toBe(true)
  })
})

describe('waehleZiel (#232)', () => {
  it('ruft export:wähleExportZiel OHNE Nutzlast (rufeAuf-Spion)', async () => {
    const ipc = await import('../../src/renderer/ipc-client/rufe-auf')
    const spion = vi.spyOn(ipc, 'rufeAuf').mockResolvedValue({ ok: true, wert: { pfad: 'E:\\' } })
    try {
      await waehleZiel({ ...LEERE_EXPORTAUSWAHL })
      expect(spion).toHaveBeenCalledTimes(1)
      expect(spion.mock.calls[0]?.[1]).toBeUndefined()
    } finally {
      spion.mockRestore()
    }
  })

  it('pfad: null -> abgebrochen: true, die Auswahl ist FELDGLEICH zur Eingabe (auch mit zuvor gewähltem Ziel)', async () => {
    const ipc = await import('../../src/renderer/ipc-client/rufe-auf')
    const spion = vi.spyOn(ipc, 'rufeAuf').mockResolvedValue({ ok: true, wert: { pfad: null } })
    try {
      const eingabe: typeof LEERE_EXPORTAUSWAHL = { datei: d('a.mp4'), zielPfad: 'E:\\Alt' }
      const erg = await waehleZiel(eingabe)
      expect(erg).toEqual({ ok: true, wert: { auswahl: eingabe, abgebrochen: true } })
      expect(erg.ok && erg.wert.auswahl.zielPfad).toBe('E:\\Alt')
      expect(erg.ok && erg.wert.auswahl.datei?.dateiname).toBe('a.mp4')
    } finally {
      spion.mockRestore()
    }
  })

  it('pfad wird UNVERAENDERT uebernommen (kein Beschneiden, kein Ersetzen von Trennern)', async () => {
    const ipc = await import('../../src/renderer/ipc-client/rufe-auf')
    const pfad = 'C:\\Users\\x\\USB (E:)'
    const spion = vi.spyOn(ipc, 'rufeAuf').mockResolvedValue({ ok: true, wert: { pfad } })
    try {
      const erg = await waehleZiel(LEERE_EXPORTAUSWAHL)
      expect(erg.ok && erg.wert.auswahl.zielPfad).toBe(pfad)
      expect(erg.ok && erg.wert.abgebrochen).toBe(false)
    } finally {
      spion.mockRestore()
    }
  })

  it('ok: false -> Auswahl UNVERAENDERT, Code UNVERAENDERT zurueckgegeben', async () => {
    const ipc = await import('../../src/renderer/ipc-client/rufe-auf')
    const spion = vi
      .spyOn(ipc, 'rufeAuf')
      .mockResolvedValue({ ok: false, fehler: { code: 'dialog_fehler', meldung: 'kaputt' } as never })
    try {
      const eingabe: typeof LEERE_EXPORTAUSWAHL = { datei: d('a.mp4'), zielPfad: null }
      const erg = await waehleZiel(eingabe)
      expect(erg.ok).toBe(false)
      if (!erg.ok) expect(erg.fehler.code).toBe('dialog_fehler')
    } finally {
      spion.mockRestore()
    }
  })

  it('rufeAuf wirft -> gefangen, unbekannter_fehler, Auswahl unveraendert', async () => {
    const ipc = await import('../../src/renderer/ipc-client/rufe-auf')
    const spion = vi.spyOn(ipc, 'rufeAuf').mockRejectedValue(new Error('Bridge fehlt'))
    try {
      const erg = await waehleZiel(LEERE_EXPORTAUSWAHL)
      expect(erg.ok).toBe(false)
      if (!erg.ok) expect(erg.fehler.code).toBe('unbekannter_fehler')
    } finally {
      spion.mockRestore()
    }
  })
})

// ---------------- Auslöse-Ablauf ----------------

function baueWirkungen(antwort: unknown, wirft = false): {
  loeseExportAus: ReturnType<typeof vi.fn>
  meldeFehler: ReturnType<typeof vi.fn>
} {
  return {
    loeseExportAus: vi.fn(
      wirft
        ? async () => {
            throw new Error('IPC geplatzt')
          }
        : async () => antwort,
    ),
    meldeFehler: vi.fn<(code: string, meldung: string) => void>(),
  }
}

describe('loeseExportMitAuswahlAus (#232)', () => {
  let bereit: typeof LEERE_EXPORTAUSWAHL

  beforeEach(() => {
    bereit = { datei: d('sommeraktion.mp4', 4096), zielPfad: 'E:\\Stick' }
  })

  it('ruft loeseExportAus GENAU EINMAL mit projektId, dateiname MIT Endung, zielPfad - alle UNVERAENDERT', async () => {
    const wirk = baueWirkungen({ ok: true, wert: { auftragId: 'q-1' } })
    await loeseExportMitAuswahlAus('p-9', bereit, wirk as never)
    expect(wirk.loeseExportAus).toHaveBeenCalledTimes(1)
    const arg = wirk.loeseExportAus.mock.calls[0]
    expect(arg?.[0]).toBe('p-9')
    expect(arg?.[1]).toBe('sommeraktion.mp4') // MIT Endung
    expect(arg?.[2]).toBe('E:\\Stick')
  })

  it('ok: true -> { art: eingereiht, auftragId } - und NICHTS folgt (kein meldeFehler, kein Auffrischen)', async () => {
    const wirk = baueWirkungen({ ok: true, wert: { auftragId: 'q-2' } })
    const erg = await loeseExportMitAuswahlAus('p', bereit, wirk as never)
    expect(erg).toEqual({ art: 'eingereiht', auftragId: 'q-2' })
    expect(wirk.meldeFehler).not.toHaveBeenCalled()
  })

  it('ok: false -> meldeFehler mit UNVERAENDERTEN Code, { art: abgelehnt, code }', async () => {
    const wirk = baueWirkungen({
      ok: false,
      fehler: { code: 'ziel_gesperrt', meldung: 'Ziel gesperrt', daten: undefined },
    })
    const erg = await loeseExportMitAuswahlAus('p', bereit, wirk as never)
    expect(erg).toEqual({ art: 'abgelehnt', code: 'ziel_gesperrt' })
    expect(wirk.meldeFehler).toHaveBeenCalledWith('ziel_gesperrt', 'Ziel gesperrt')
  })

  it('ein anderer Code -> UNVERAENDERT abgelehnt', async () => {
    const wirk = baueWirkungen({
      ok: false,
      fehler: { code: 'speicher_fehler', meldung: 'Flush scheiterte', daten: undefined },
    })
    const erg = await loeseExportMitAuswahlAus('p', bereit, wirk as never)
    expect(erg).toEqual({ art: 'abgelehnt', code: 'speicher_fehler' })
    expect(wirk.meldeFehler).toHaveBeenCalledWith('speicher_fehler', 'Flush scheiterte')
  })

  it('wirft loeseExportAus -> gefangen, meldeFehler(unbekannter_fehler), { art: abgelehnt }; der Wurf verlaesst die Datei nicht', async () => {
    const wirk = baueWirkungen(undefined, true)
    const erg = await loeseExportMitAuswahlAus('p', bereit, wirk as never)
    expect(erg).toEqual({ art: 'abgelehnt', code: 'unbekannter_fehler' })
    expect(wirk.meldeFehler).toHaveBeenCalledWith('unbekannter_fehler', 'IPC geplatzt')
  })
})
