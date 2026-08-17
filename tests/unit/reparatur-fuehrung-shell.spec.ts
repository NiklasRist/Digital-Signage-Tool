// Verhaltenstests zu #201 - den Reparatur-Modus über den Reiterwechsel führen.
//
// Der Prüfumfang ist die Definition of Done des Issues plus die Fehlerpfad-Tabelle.
// Die Kernzusage steht in TK 9.14.2: „Der Fortschritt ‚X von N behoben' bleibt dabei
// über den Reiterwechsel hinweg sichtbar" - geprüft im benannten Ablauf-Test weiter
// unten. Diese Datei rechnet den Fortschritt NICHT; sie hält den Stand und reicht ihn
// durch. Deshalb prüfen die Tests durchgehend, dass `uebernimmStand` die Felder
// identisch übernimmt und dass KEINE Funktion die übergebene `lage` verändert.
import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import type { ReparaturStand } from '../../src/renderer/composer/reparatur-fuehrung'
import type { Uebergabe } from '../../src/renderer/composer/reparatur-optionen'
import {
  LEERE_SHELL_REPARATUR,
  beendeFuehrung,
  beendeUebergabe,
  reiterFuerUebergabe,
  uebernimmStand,
  uebernimmUebergabe,
} from '../../src/renderer/app-shell/reparatur-fuehrung-shell'

// ---------------------------------------------------------------------------
// Bausteine
// ---------------------------------------------------------------------------

/** Ein `ReparaturStand` aus #132 mit `gesamt - behoben` offenen Stellen. */
function stand(gesamt: number, behoben: number): ReparaturStand {
  const offen = Array.from({ length: gesamt - behoben }, (_, i) => ({
    art: 'element_asset' as const,
    elementId: `el-${i}`,
    assetId: 'asset-weg',
    grund: 'asset_fehlt' as const,
  }))
  return {
    aktiv: behoben < gesamt,
    offen,
    gesamt,
    behoben,
    zeigerIndex: 0,
    aktuelle: offen[0] ?? null,
  }
}

const UEBERGABE_ACTION_EDITOR: Uebergabe = { ziel: 'action-editor', aktionId: 'a1' }
const UEBERGABE_ASSET_AUSWAHL: Uebergabe = { ziel: 'asset-auswahl', elementId: 'el-1' }
const UEBERGABE_AKTIONS_AUSWAHL: Uebergabe = {
  ziel: 'aktions-auswahl',
  elementId: 'el-1',
  abschnittIndex: null,
}
const UEBERGABE_MEDIEN_IMPORT: Uebergabe = { ziel: 'medien-import', elementId: 'el-1' }

// ---------------------------------------------------------------------------
// LEERE_SHELL_REPARATUR
// ---------------------------------------------------------------------------

describe('LEERE_SHELL_REPARATUR', () => {
  it('hat alle vier Felder auf null', () => {
    expect(LEERE_SHELL_REPARATUR).toEqual({
      stand: null,
      laufendeUebergabe: null,
      hervorgehobeneAktionId: null,
      rueckkehrReiter: null,
    })
  })
})

// ---------------------------------------------------------------------------
// reiterFuerUebergabe - die Zuordnungstabelle aus dem Issue
// ---------------------------------------------------------------------------

describe('reiterFuerUebergabe - die Zuordnungstabelle', () => {
  it('liefert für eine action-editor-Übergabe den Reiter aktionen', () => {
    expect(reiterFuerUebergabe(UEBERGABE_ACTION_EDITOR)).toBe('aktionen')
  })

  it('liefert für eine asset-auswahl-Übergabe null - die Auswahl bleibt im Reiter', () => {
    expect(reiterFuerUebergabe(UEBERGABE_ASSET_AUSWAHL)).toBeNull()
  })

  it('liefert für eine aktions-auswahl-Übergabe null - die Auswahl bleibt im Reiter', () => {
    expect(reiterFuerUebergabe(UEBERGABE_AKTIONS_AUSWAHL)).toBeNull()
  })

  it('liefert für eine medien-import-Übergabe null - der Dialog ist kein Reiter', () => {
    expect(reiterFuerUebergabe(UEBERGABE_MEDIEN_IMPORT)).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// uebernimmUebergabe
// ---------------------------------------------------------------------------

describe('uebernimmUebergabe', () => {
  it('setzt beim action-editor die Hervorhebung, merkt den Rückkehr-Reiter und wechselt zu aktionen', () => {
    const schritt = uebernimmUebergabe(LEERE_SHELL_REPARATUR, UEBERGABE_ACTION_EDITOR, 'zusammenstellen')

    expect(schritt.wechselZu).toBe('aktionen')
    expect(schritt.lage.laufendeUebergabe).toEqual(UEBERGABE_ACTION_EDITOR)
    expect(schritt.lage.hervorgehobeneAktionId).toBe('a1')
    expect(schritt.lage.rueckkehrReiter).toBe('zusammenstellen')
    expect(schritt.lage.stand).toBeNull()
  })

  it('legt bei asset-auswahl keine Übergabe an einen Reiter ab und hebt nichts hervor', () => {
    const schritt = uebernimmUebergabe(LEERE_SHELL_REPARATUR, UEBERGABE_ASSET_AUSWAHL, 'zusammenstellen')

    expect(schritt.wechselZu).toBeNull()
    expect(schritt.lage.laufendeUebergabe).toEqual(UEBERGABE_ASSET_AUSWAHL)
    expect(schritt.lage.hervorgehobeneAktionId).toBeNull()
    expect(schritt.lage.rueckkehrReiter).toBeNull()
  })

  it('legt bei aktions-auswahl und medien-import ebenfalls keinen Reiterwechsel ab', () => {
    for (const an of [UEBERGABE_AKTIONS_AUSWAHL, UEBERGABE_MEDIEN_IMPORT]) {
      const schritt = uebernimmUebergabe(LEERE_SHELL_REPARATUR, an, 'projekte')
      expect(schritt.wechselZu).toBeNull()
      expect(schritt.lage.laufendeUebergabe).toEqual(an)
      expect(schritt.lage.hervorgehobeneAktionId).toBeNull()
      expect(schritt.lage.rueckkehrReiter).toBeNull()
    }
  })

  it('ersetzt eine laufende Übergabe, ohne den gemerkten Rückkehr-Reiter zu überschreiben', () => {
    const nachAktionsFix = uebernimmUebergabe(
      LEERE_SHELL_REPARATUR,
      UEBERGABE_ACTION_EDITOR,
      'zusammenstellen',
    ).lage
    expect(nachAktionsFix.rueckkehrReiter).toBe('zusammenstellen')

    // Eine zweite Übergabe trifft ein, während bereits eine läuft: Die neue ersetzt
    // die alte; der bereits gemerkte Weg zurück bleibt unangetastet (ENTSCHIEDEN 7).
    const zweiter = uebernimmUebergabe(nachAktionsFix, UEBERGABE_ASSET_AUSWAHL, 'vorlagen')

    expect(zweiter.lage.laufendeUebergabe).toEqual(UEBERGABE_ASSET_AUSWAHL)
    expect(zweiter.lage.rueckkehrReiter).toBe('zusammenstellen')
    expect(zweiter.wechselZu).toBeNull()
  })

  it('überschreibt einen bereits gemerkten Rückkehr-Reiter auch bei einem zweiten Aktions-Fix nicht', () => {
    const nachErstem = uebernimmUebergabe(
      LEERE_SHELL_REPARATUR,
      { ziel: 'action-editor', aktionId: 'a1' },
      'zusammenstellen',
    ).lage

    const zweiter = uebernimmUebergabe(
      nachErstem,
      { ziel: 'action-editor', aktionId: 'a2' },
      'vorlagen',
    )

    expect(zweiter.lage.hervorgehobeneAktionId).toBe('a2')
    expect(zweiter.lage.rueckkehrReiter).toBe('zusammenstellen')
    expect(zweiter.wechselZu).toBe('aktionen')
  })
})

// ---------------------------------------------------------------------------
// beendeUebergabe
// ---------------------------------------------------------------------------

describe('beendeUebergabe', () => {
  it('kehrt nach einem action-editor-Wechsel in den gemerkten Reiter zurück und räumt auf', () => {
    const nachWechsel = uebernimmUebergabe(
      LEERE_SHELL_REPARATUR,
      UEBERGABE_ACTION_EDITOR,
      'zusammenstellen',
    ).lage

    const schritt = beendeUebergabe(nachWechsel)

    expect(schritt.wechselZu).toBe('zusammenstellen')
    expect(schritt.lage.laufendeUebergabe).toBeNull()
    expect(schritt.lage.hervorgehobeneAktionId).toBeNull()
    expect(schritt.lage.rueckkehrReiter).toBeNull()
    expect(schritt.lage.stand).toBeNull()
  })

  it('kehrt nach einem Overlay ohne Reiterwechsel in den aktuellen Reiter zurück', () => {
    const nachAuswahl = uebernimmUebergabe(
      LEERE_SHELL_REPARATUR,
      UEBERGABE_ASSET_AUSWAHL,
      'zusammenstellen',
    ).lage

    const schritt = beendeUebergabe(nachAuswahl)

    expect(schritt.wechselZu).toBeNull()
    expect(schritt.lage.laufendeUebergabe).toBeNull()
    expect(schritt.lage.hervorgehobeneAktionId).toBeNull()
  })

  it('ist ohne laufende Übergabe wirkungslos, liefert wechselZu null und wirft nicht', () => {
    expect(() => beendeUebergabe(LEERE_SHELL_REPARATUR)).not.toThrow()

    const schritt = beendeUebergabe(LEERE_SHELL_REPARATUR)
    expect(schritt.wechselZu).toBeNull()
    expect(schritt.lage).toEqual(LEERE_SHELL_REPARATUR)
  })
})

// ---------------------------------------------------------------------------
// uebernimmStand
// ---------------------------------------------------------------------------

describe('uebernimmStand', () => {
  it('übernimmt gesamt, behoben, offen, zeigerIndex, aktuelle und aktiv identisch', () => {
    const ankommend = stand(7, 2)
    const uebernommen = uebernimmStand(LEERE_SHELL_REPARATUR, ankommend)

    expect(uebernommen.stand).not.toBeNull()
    expect(uebernommen.stand!.gesamt).toBe(7)
    expect(uebernommen.stand!.behoben).toBe(2)
    expect(uebernommen.stand!.offen).toBe(ankommend.offen)
    expect(uebernommen.stand!.zeigerIndex).toBe(ankommend.zeigerIndex)
    expect(uebernommen.stand!.aktuelle).toBe(ankommend.aktuelle)
    expect(uebernommen.stand!.aktiv).toBe(ankommend.aktiv)
    // Nichts nachgerechnet, nichts ergänzt: exakt der übergebene Wert.
    expect(uebernommen.stand).toEqual(ankommend)
  })

  it('übernimmt auch einen Stand mit leerer offen-Liste unverändert - das entscheidet #132', () => {
    const fertig = stand(2, 2)
    expect(fertig.offen).toEqual([])
    expect(fertig.aktiv).toBe(false)

    const uebernommen = uebernimmStand(LEERE_SHELL_REPARATUR, fertig)
    expect(uebernommen.stand).toEqual(fertig)
    expect(uebernommen.stand!.offen).toEqual([])
  })

  it('lässt eine laufende Übergabe stehen - der Wechsel wird dadurch nicht abgebrochen', () => {
    const nachWechsel = uebernimmUebergabe(
      LEERE_SHELL_REPARATUR,
      UEBERGABE_ACTION_EDITOR,
      'zusammenstellen',
    ).lage

    const mitStand = uebernimmStand(nachWechsel, stand(7, 2))

    expect(mitStand.laufendeUebergabe).toEqual(UEBERGABE_ACTION_EDITOR)
    expect(mitStand.hervorgehobeneAktionId).toBe('a1')
    expect(mitStand.rueckkehrReiter).toBe('zusammenstellen')
  })
})

// ---------------------------------------------------------------------------
// Die Kernzusage von TK 9.14.2: der Fortschritt überlebt den Reiterwechsel
// ---------------------------------------------------------------------------

describe('der Fortschritt überlebt den Reiterwechsel (TK 9.14.2)', () => {
  it('gesamt und behoben bleiben nach dem Durchlauf durch den action-editor unverändert', () => {
    const erster = stand(7, 0)
    const neuer = stand(7, 2)

    // uebernimmStand(erster) → uebernimmUebergabe('action-editor') →
    // uebernimmStand(neuer) → beendeUebergabe (Definition of Done)
    let lage = uebernimmStand(LEERE_SHELL_REPARATUR, erster)
    expect(lage.stand!.gesamt).toBe(7)
    expect(lage.stand!.behoben).toBe(0)

    const hin = uebernimmUebergabe(lage, UEBERGABE_ACTION_EDITOR, 'zusammenstellen')
    lage = hin.lage

    lage = uebernimmStand(lage, neuer)

    const rueck = beendeUebergabe(lage)

    // Zurück im Reiter Zusammenstellen, und "X von N" steht, wo #132 es hingerechnet
    // hat - der Wechsel hat nichts verworfen.
    expect(rueck.wechselZu).toBe('zusammenstellen')
    expect(rueck.lage.stand).toEqual(neuer)
    expect(rueck.lage.stand!.gesamt).toBe(7)
    expect(rueck.lage.stand!.behoben).toBe(2)
    expect(rueck.lage.stand!.behoben).toBe(lage.stand!.behoben)
  })
})

// ---------------------------------------------------------------------------
// beendeFuehrung
// ---------------------------------------------------------------------------

describe('beendeFuehrung', () => {
  it('lässt stand stehen und setzt die drei übrigen Felder auf null', () => {
    const mitStand = uebernimmStand(LEERE_SHELL_REPARATUR, stand(7, 2))
    const nachUebergabe = uebernimmUebergabe(mitStand, UEBERGABE_ACTION_EDITOR, 'zusammenstellen').lage

    const beendet = beendeFuehrung(nachUebergabe)

    expect(beendet.stand).toEqual(mitStand.stand)
    expect(beendet.stand).not.toBeNull()
    expect(beendet.laufendeUebergabe).toBeNull()
    expect(beendet.hervorgehobeneAktionId).toBeNull()
    expect(beendet.rueckkehrReiter).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Reine Werte - keine Funktion verändert die übergebene lage
// ---------------------------------------------------------------------------

describe('reine Werte - keine Funktion mutiert die Lage', () => {
  it('keine der vier Funktionen verändert die übergebene lage', () => {
    const lage = uebernimmStand(LEERE_SHELL_REPARATUR, stand(3, 1))
    const vorher = structuredClone(lage)

    uebernimmUebergabe(lage, UEBERGABE_ACTION_EDITOR, 'zusammenstellen')
    uebernimmUebergabe(lage, UEBERGABE_ASSET_AUSWAHL, 'zusammenstellen')
    beendeUebergabe(lage)
    beendeFuehrung(lage)
    uebernimmStand(lage, stand(3, 2))

    expect(lage).toEqual(vorher)
  })

  it('jede Funktion liefert einen NEUEN Wert - kein Aufruf gibt die Eingabe selbst zurück', () => {
    const lage = uebernimmStand(LEERE_SHELL_REPARATUR, stand(3, 1))

    expect(uebernimmUebergabe(lage, UEBERGABE_ASSET_AUSWAHL, 'zusammenstellen').lage).not.toBe(lage)
    expect(beendeUebergabe(lage).lage).not.toBe(lage)
    expect(beendeFuehrung(lage)).not.toBe(lage)
    expect(uebernimmStand(lage, stand(3, 2))).not.toBe(lage)
  })
})

// ---------------------------------------------------------------------------
// Modulgrenze - reiner Zustandsautomat, kein Aufruf nach außen
// ---------------------------------------------------------------------------

describe('Modulgrenze - reiner Zustandsautomat', () => {
  const QUELLE = readFileSync(
    new URL('../../src/renderer/app-shell/reparatur-fuehrung-shell.ts', import.meta.url),
    'utf8',
  )
  // Kommentare nennen "Reiter", "starteReparatur" und "aktualisiereReparatur" in der
  // Begründung. Geprüft werden deshalb nur echte Code-Zeilen, sonst schlüge die Regel
  // an ihrer eigenen Erklärung an.
  const CODEZEILEN = QUELLE.split('\n').filter(
    (z) =>
      !z.trimStart().startsWith('//') &&
      !z.trimStart().startsWith('*') &&
      !z.trimStart().startsWith('/**'),
  )

  it('enthält kein JSX, keinen react-Import, kein rufeAuf und kein abonniere', () => {
    expect(CODEZEILEN.filter((z) => /react|rufeAuf|abonniere|JSX/.test(z))).toEqual([])
  })

  it('ruft weder wechsleReiter noch die Rechnung aus #131/#132', () => {
    expect(
      CODEZEILEN.filter((z) =>
        /wechsleReiter|findeKaputteStellen|starteReparatur|aktualisiereReparatur/.test(z),
      ),
    ).toEqual([])
  })

  it('exportiert kein starteFuehrung - der Modus beginnt über uebernimmStand (ENTSCHIEDEN 8)', () => {
    expect(CODEZEILEN.filter((z) => /starteFuehrung/.test(z))).toEqual([])
  })
})
