// Tests zu #259 (M7-66) - composer-montage.ts: die reine Zusammensetz-Logik der
// composer-Wurzel. Vollstaendig ohne Browser pruefbar.
import { join } from 'node:path'
import { readFileSync } from 'node:fs'
//
// Kern-Nachweise:
// - Jede der acht Lage-Funktionen liefert ein NEUES Objekt und laesst die
//   uebergebene Lage unveraendert (Object.freeze-Test je Funktion).
// - folgeAus kennt GENAU zwei Ausgaenge; die Uebergabe reist toBe-gleich und
//   wird hier N I E ausgefuehrt (kein dritter Zweig).
// - Die Ableitungen LESEN den Reparatur-Stand und rechnen nichts nach:
//   aktuelleStelle ist toBe-gleich stand.aktuelle.
// - setzeAusgabeName prueft nichts: auch '../x' und '' kommen unverändert an.
// - Grep-Probe auf DIESE Datei: kein react, kein IPC, keine Rechnung, kein
//   Import aus fremden Renderer-Modulen.
import { describe, expect, it } from 'vitest'

import type { KaputteStelle } from '../../src/renderer/composer/kaputt-erkennung'
import type { ReparaturStand } from '../../src/renderer/composer/reparatur-fuehrung'
import type { FixWirkung, Uebergabe } from '../../src/renderer/composer/reparatur-optionen'
import type { Exportauswahl } from '../../src/renderer/composer/export-dialog'
import { LEERE_EXPORTAUSWAHL } from '../../src/renderer/composer/export-dialog'
import {
  KEIN_OVERLAY,
  LEERE_COMPOSER_LAGE,
  oeffneOverlay,
  schliesseOverlay,
  waehleElement,
  waehleMedium,
  melde,
  verwirfWurzelMeldung,
  setzeLaeuft,
  setzeAusgabeName,
  setzeExportauswahl,
  folgeAus,
  aktuelleStelle,
  fuehrungLaeuft,
  istRenderKnopfFrei,
  type ComposerLage,
  type WurzelMeldung,
} from '../../src/renderer/composer/composer-montage'

// ---------------- Quelldatei-Verbote (Grep, nur auf DIESE Datei) ----------------

const QUELLE = readFileSync(
  join(process.cwd(), 'src/renderer/composer/composer-montage.ts'),
  'utf8',
)
const CODEZEILEN = QUELLE.split('\n')
  .filter((z) => {
    const t = z.trim()
    return !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*')
  })
  .join('\n')

describe('composer-montage.ts – Verbote (Grep, nur auf DIESE Datei)', () => {
  it('kein react, kein JSX, kein DOM, kein IPC, keine Rechnung, keine Freigabe-Ableitung', () => {
    for (const verbot of [
      'rufeAuf', 'abonniere(', 'KANAELE', 'window.', 'Math.round',
      'findeKaputteStellen', 'istRenderFreigegeben', 'useState', 'document.',
      // Aus der kaputt-erkennung reist NUR der Typ: ein Wert-Import waere der Verstoß.
      "import { KaputteStelle", 'starteReparatur', 'aktualisiereReparatur(',
    ]) {
      expect(CODEZEILEN).not.toContain(verbot)
    }
    // Der Import aus der kaputt-erkennung ist ausdruecklich ein TYPE-Import.
    expect(CODEZEILEN).toContain("import type { KaputteStelle }")
    // Kein Import aus fremden Renderer-Modulen.
    for (const fremdModul of [
      'src/renderer/app-shell', 'src/renderer/preview-player',
      'src/renderer/action-editor', 'src/renderer/vorlagen-editor',
      'src/renderer/projekt-verwaltung', 'src/renderer/queue-panel',
    ]) {
      expect(QUELLE).not.toContain(fremdModul)
    }
  })
})

const lage: ComposerLage = {
  overlay: { art: 'einblendung', elementId: 'el-1' },
  gewaehltesElementId: 'el-1',
  gewaehltesMediumId: 'm-1',
  meldung: { code: 'probe', meldung: 'Probe', warnung: true },
  laeuft: true,
  ausgabeName: 'FA-22',
  exportauswahl: LEERE_EXPORTAUSWAHL,
  menueAdresse: null,
}

function stelle(): KaputteStelle {
  return {
    art: 'band_abschnitt',
    elementId: 'el-1',
    abschnittIndex: 0,
    aktionId: 'a-1',
    assetId: null,
    grund: 'asset_fehlt',
  }
}

describe('Nullwerte', () => {
  it('KEIN_OVERLAY ist { art: keins }', () => {
    expect(KEIN_OVERLAY).toEqual({ art: 'keins' })
  })

  it('LEERE_COMPOSER_LAGE enthaelt genau die Vertragsfelder; die Exportauswahl ist toBe-gleich zu #232', () => {
    // #408 (User-Entscheidung 13.10.2026): die ComposerLage traegt NEBEN dem Overlay
    // die Adresse des KontextMenues (menueAdresse) - Nachtrag zu #259 ist angehaengt.
    expect(LEERE_COMPOSER_LAGE).toEqual({
      overlay: KEIN_OVERLAY,
      gewaehltesElementId: null,
      gewaehltesMediumId: null,
      meldung: null,
      laeuft: false,
      ausgabeName: '',
      exportauswahl: LEERE_EXPORTAUSWAHL,
      menueAdresse: null,
    })
    expect(LEERE_COMPOSER_LAGE.exportauswahl).toBe(LEERE_EXPORTAUSWAHL)
  })

  it('die eingefrorene LEERE_COMPOSER_LAGE bleibt beim Lesen unberuehrt', () => {
    const eingefroren = Object.freeze(LEERE_COMPOSER_LAGE)
    expect(eingefroren.overlay).toBe(KEIN_OVERLAY)
    expect(eingefroren.gewaehltesElementId).toBeNull()
    expect(eingefroren.meldung).toBeNull()
    expect(eingefroren.laeuft).toBe(false)
    expect(eingefroren.ausgabeName).toBe('')
  })
})

// ---------------- die acht Lage-Funktionen ----------------

describe('die acht Lage-Funktionen: neu, total, ohne Mutation', () => {
  it('oeffneOverlay liefert ein NEUES Objekt und ersetzt ein bereits offenes Overlay (ENTSCHIEDEN 1)', () => {
    const neu = oeffneOverlay(lage, { art: 'reparatur_optionen', stelle: stelle() })
    expect(neu).not.toBe(lage)
    // Ersetzt (lage hielt vorher das Einblendung-Overlay), nicht gestapelt.
    expect(neu.overlay).toEqual({ art: 'reparatur_optionen', stelle: stelle() })
    // Die uebrigen Felder reisen unveraendert.
    expect(neu.laeuft).toBe(true)
    expect(neu.ausgabeName).toBe('FA-22')
  })

  it('schliesseOverlay setzt KEIN_OVERLAY und laesst Auswahl, Meldung und laeuft unberuehrt', () => {
    const neu = schliesseOverlay(lage)
    expect(neu).not.toBe(lage)
    expect(neu.overlay).toBe(KEIN_OVERLAY)
    expect(neu.gewaehltesElementId).toBe('el-1')
    expect(neu.meldung).toEqual(lage.meldung)
    expect(neu.laeuft).toBe(true)
  })

  it('schliesseOverlay bei KEIN_OVERLAY: eine neue, inhaltlich gleiche Lage - kein Wurf', () => {
    const leere = Object.freeze(LEERE_COMPOSER_LAGE)
    const neu = schliesseOverlay(leere)
    expect(neu).not.toBe(leere)
    expect(neu).toEqual(LEERE_COMPOSER_LAGE)
  })

  it('waehleElement setzt die Auswahl, null geleert; Overlay, Meldung und laeuft unberuehrt', () => {
    const leer = waehleElement(lage, null)
    expect(leer).not.toBe(lage)
    expect(leer.gewaehltesElementId).toBeNull()
    expect(leer.overlay).toBe(lage.overlay)
    expect(leer.meldung).toBe(lage.meldung)
    expect(leer.laeuft).toBe(true)
    const anders = waehleElement(lage, 'el-9')
    expect(anders.gewaehltesElementId).toBe('el-9')
  })

  it('#418: waehleMedium setzt das ausgewaehlte Medium, null geleert; alles andere unberuehrt', () => {
    const anders = waehleMedium(lage, 'asset-9')
    expect(anders).not.toBe(lage)
    expect(anders.gewaehltesMediumId).toBe('asset-9')
    // Nur das Medium wechselt - Element-Auswahl, Overlay, Meldung und laeuft bleiben.
    expect(anders.gewaehltesElementId).toBe(lage.gewaehltesElementId)
    expect(anders.overlay).toBe(lage.overlay)
    expect(anders.meldung).toBe(lage.meldung)
    expect(anders.laeuft).toBe(lage.laeuft)
    expect(waehleMedium(lage, null).gewaehltesMediumId).toBeNull()
  })

  it('melde ERSETZT eine stehende Meldung (genau eine, nie ein Stapel)', () => {
    const zweite: WurzelMeldung = { code: 'code_2', meldung: 'Zweite', warnung: false }
    const neu = melde(lage, zweite)
    expect(neu).not.toBe(lage)
    expect(neu.meldung).toBe(zweite)
  })

  it('verwirfWurzelMeldung setzt null; ohne stehende Meldung ebenfalls - kein Wurf', () => {
    const verworfen = verwirfWurzelMeldung(lage)
    expect(verworfen).not.toBe(lage)
    expect(verworfen.meldung).toBeNull()
    const nochmal = verwirfWurzelMeldung(verworfen)
    expect(nochmal).not.toBe(verworfen)
    expect(nochmal.meldung).toBeNull()
  })

  it('setzeLaeuft setzt NUR laeuft', () => {
    const stop = setzeLaeuft(lage, false)
    expect(stop).not.toBe(lage)
    expect(stop.laeuft).toBe(false)
    expect(stop.overlay).toBe(lage.overlay)
    expect(stop.meldung).toBe(lage.meldung)
    expect(stop.ausgabeName).toBe('FA-22')
  })

  it('setzeAusgabeName setzt den ROHEN Text und prueft NICHTS (auch ../x und \'\' kommen an)', () => {
    for (const wert of ['FA-22', '../x', '']) {
      const neu = setzeAusgabeName(lage, wert)
      expect(neu).not.toBe(lage)
      expect(neu.ausgabeName).toBe(wert)
      // Nur dieses Feld aendert sich.
      expect(neu.overlay).toBe(lage.overlay)
      expect(neu.laeuft).toBe(lage.laeuft)
    }
  })

  it('setzeExportauswahl uebernimmt die Auswahl toBe-gleich - kein Kopieren, keine Ergaenzung', () => {
    const auswahl: Exportauswahl = { datei: null, zielPfad: '/tmp/x.mp4' }
    const neu = setzeExportauswahl(lage, auswahl)
    expect(neu).not.toBe(lage)
    expect(neu.exportauswahl).toBe(auswahl)
  })

  it('Object.freeze auf der uebergebenen Lage: alle acht Funktionen werfen NICHT', () => {
    const eingefroren = Object.freeze(lage)
    expect(() => oeffneOverlay(eingefroren, { art: 'render' })).not.toThrow()
    expect(() => schliesseOverlay(eingefroren)).not.toThrow()
    expect(() => waehleElement(eingefroren, null)).not.toThrow()
    expect(() => melde(eingefroren, { code: 'x', meldung: 'x', warnung: true })).not.toThrow()
    expect(() => verwirfWurzelMeldung(eingefroren)).not.toThrow()
    expect(() => setzeLaeuft(eingefroren, false)).not.toThrow()
    expect(() => setzeAusgabeName(eingefroren, 'x')).not.toThrow()
    expect(() => setzeExportauswahl(eingefroren, LEERE_EXPORTAUSWAHL)).not.toThrow()
  })
})

// ---------------- folgeAus: DIE TABELLE ----------------

describe('folgeAus', () => {
  it('erledigt liefert { art: neu_rechnen }', () => {
    const wirkung: FixWirkung = { art: 'erledigt' }
    expect(folgeAus(wirkung)).toEqual({ art: 'neu_rechnen' })
  })

  it('uebergabe reist toBe-gleich nach oben - NIEMALS hier ausgefuehrt, NICHT kopiert', () => {
    const ziel: Uebergabe = { ziel: 'medien-import', elementId: 'el-1' }
    const wirkung: FixWirkung = { art: 'uebergabe', an: ziel }
    const folge = folgeAus(wirkung)
    expect(folge.art).toBe('an_shell')
    expect((folge as { an: Uebergabe }).an).toBe(ziel)
  })

  it('genau zwei Ausgaenge, keiner dritten Art - es gibt keinen default-Zweig', () => {
    const ziel: Uebergabe = { ziel: 'aktions-auswahl', elementId: 'el-1', abschnittIndex: null }
    const folgen = [folgeAus({ art: 'erledigt' }), folgeAus({ art: 'uebergabe', an: ziel })]
    const arten = new Set(folgen.map((folge) => folge.art))
    expect(arten).toEqual(new Set(['neu_rechnen', 'an_shell']))
  })
})

// ---------------- Ableitungen lesen und rechnen nicht ----------------

describe('die Ableitungen aus dem Reparatur-Stand (lesen, nie nachrechnen)', () => {
  it('aktuelleStelle(null) ist null; mit Stand toBe-gleich stand.aktuelle - nichts nachgerechnet', () => {
    expect(aktuelleStelle(null)).toBeNull()
    const dieStelle = stelle()
    const stand: ReparaturStand = {
      aktiv: true,
      offen: [dieStelle],
      gesamt: 3,
      behoben: 1,
      zeigerIndex: 0,
      aktuelle: dieStelle,
    }
    expect(aktuelleStelle(stand)).toBe(dieStelle)
  })

  it('aktuelleStelle an einem Stand null aktueller Stelle bleibt null', () => {
    const stand: ReparaturStand = {
      aktiv: true, offen: [], gesamt: 2, behoben: 2, zeigerIndex: 0, aktuelle: null,
    }
    expect(aktuelleStelle(stand)).toBeNull()
  })

  it('fuehrungLaeuft(null) ist false; mit Stand exakt stand.aktiv', () => {
    expect(fuehrungLaeuft(null)).toBe(false)
    const basis = {
      offen: [] as KaputteStelle[], gesamt: 0, behoben: 0, zeigerIndex: 0, aktuelle: null,
    }
    expect(fuehrungLaeuft({ ...basis, aktiv: false })).toBe(false)
    expect(fuehrungLaeuft({ ...basis, aktiv: true })).toBe(true)
  })

  it('istRenderKnopfFrei: nur Freigabe UND kein laufender Vorgang lassen den Knopf frei', () => {
    expect(istRenderKnopfFrei(true, false)).toBe(true)
    expect(istRenderKnopfFrei(false, false)).toBe(false)
    expect(istRenderKnopfFrei(true, true)).toBe(false)
    expect(istRenderKnopfFrei(false, true)).toBe(false)
  })
})
