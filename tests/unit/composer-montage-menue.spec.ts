// Issue #408: Die ComposerLage (#259) traegt die Adresse des KontextMenues
// (menueAdresse) samt zwei reinen Uebergaengen (oeffneMenue/schliesseMenue):
// - GENAU EIN Menue, ein offenes wird ersetzt (wie beim Overlay)
// - ein Oeffnen des Overlays nimmt das Menue mit (kein Doppel-Stapel)
// Geprueft wird NUR die Datei src/renderer/composer/composer-montage.ts (+ dieser Test).

import { describe, expect, it } from 'vitest'

import {
  LEERE_COMPOSER_LAGE,
  KEIN_OVERLAY,
  melde,
  oeffneMenue,
  oeffneOverlay,
  schliesseMenue,
  type ComposerLage,
} from '../../src/renderer/composer/composer-montage'

const ADRESSE = { elementId: 'el-1', x: 12, y: 34 }
const ANDERE_ADRESSE = { elementId: 'el-2', x: 56, y: 78 }

describe('menueAdresse in der ComposerLage (#408)', () => {
  it('Die leere Lage haelt menueAdresse null', () => {
    expect(LEERE_COMPOSER_LAGE.menueAdresse).toBeNull()
  })

  it('oeffneMenue setzt die Adresse und laesst die uebrigen Felder stehen', () => {
    const geladen = melde({ ...LEERE_COMPOSER_LAGE }, { code: 'probe', meldung: 'Probe', warnung: false })
    const offen = oeffneMenue(geladen, ADRESSE)
    expect(offen.menueAdresse).toEqual(ADRESSE)
    expect(offen.meldung).toEqual(geladen.meldung)
    expect(offen.overlay).toEqual(geladen.overlay)
  })

  it('Ein zweites Oeffnen ERSETZT (Genau EINS, kein Stapel)', () => {
    const offen = oeffneMenue(oeffneMenue(LEERE_COMPOSER_LAGE, ADRESSE), ANDERE_ADRESSE)
    expect(offen.menueAdresse).toEqual(ANDERE_ADRESSE)
  })

  it('schliesseMenue nimmt nur die Adresse; Meldung und Auswahl bleiben', () => {
    const geladen = melde({ ...LEERE_COMPOSER_LAGE, menueAdresse: ADRESSE }, { code: 'x', meldung: 'X', warnung: true })
    const geschlossen = schliesseMenue(geladen)
    expect(geschlossen.menueAdresse).toBeNull()
    expect(geschlossen.meldung).toEqual(geladen.meldung)
  })

  it('Ein Overlay-Oeffnen schliesst ein offenes Menue mit (kein Doppel-Stackfenster)', () => {
    const mitMenue = oeffneMenue(LEERE_COMPOSER_LAGE, ADRESSE)
    const mitOverlay = oeffneOverlay(mitMenue, { art: 'render' })
    expect(mitOverlay.menueAdresse).toBeNull()
    expect(mitOverlay.overlay).not.toEqual(KEIN_OVERLAY)
  })

  it('Die Uebergaenge veraendern die UEBERGEBENE Lage nie (Unveraenderlichkeit, #259-Invariante)', () => {
    const vorgaenger = { ...LEERE_COMPOSER_LAGE, menueAdresse: ADRESSE } as ComposerLage
    const snapshot = { ...vorgaenger }
    void oeffneMenue(vorgaenger, ANDERE_ADRESSE)
    void schliesseMenue(vorgaenger)
    expect(vorgaenger).toEqual(snapshot)
    expect(vorgaenger.menueAdresse).toEqual(ADRESSE)
  })
})
