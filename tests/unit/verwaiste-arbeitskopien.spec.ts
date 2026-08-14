import { describe, expect, it } from 'vitest'

import type { Vorlage } from '../../src/shared/contracts/vorlage'
import { löseArbeitskopienVomParent } from '../../src/main/vorlagen-store/verwaiste-arbeitskopien'

// Verhaltenstest zu #108. Die Funktion ist rein und synchron - kein Temp-Ordner, kein Mock,
// kein Lader: Eingabe-Array rein, neues Array raus.
//
// SCHWERPUNKT: Diese Funktion greift in fremde, unfertige Nutzerarbeit ein. Der Nachweis, dass
// sie das RICHTIGE trifft, ist weniger wert als der Nachweis, dass sie alles ANDERE in Ruhe
// laesst - deshalb steht in fast jedem Fall unten mindestens ein Eintrag, der ueberleben muss.

function vorlage(id: string, parent: string | null, eingebaut = false): Vorlage {
  return {
    id,
    name: `Name ${id}`,
    art: 'vollflaeche',
    höhe: null,
    parent,
    eingebaut,
    zonen: [
      {
        id: `${id}-zone`,
        rolle: 'frei',
        bindung: 'titel',
        rahmen: { x: 96, y: 54, breite: 800, höhe: 200 },
        ausrichtung: { horizontal: 'links', vertikal: 'oben' },
        wennLeer: 'leer',
      },
    ],
  }
}

// Fuer die Faelle, die der Typ ausschliesst, die eine von Hand editierte vorlagen.json aber
// hergibt (#98 prueft den Inhalt ausdruecklich nicht).
const roh = löseArbeitskopienVomParent as unknown as (
  bestand: Vorlage[],
  parentId: unknown,
) => Vorlage[]

describe('löseArbeitskopienVomParent – was geloest wird', () => {
  it('nullt den parent ALLER Arbeitskopien des geloeschten Parents und laesst sonst jedes Feld stehen', () => {
    const kopie = vorlage('kopie-1', 'eigen')
    const zweite = vorlage('kopie-2', 'eigen')

    const ergebnis = löseArbeitskopienVomParent([vorlage('eigen', null), kopie, zweite], 'eigen')

    expect(ergebnis[1]).toEqual({ ...kopie, parent: null })
    expect(ergebnis[2]).toEqual({ ...zweite, parent: null })
    // "flache Kopie mit ausgetauschtem Feld": die Zonen sind dieselbe Referenz, nicht ein Klon.
    expect(ergebnis[1]?.zonen).toBe(kopie.zonen)
  })

  it('loescht die Arbeitskopie NICHT - Laenge und Reihenfolge bleiben gleich', () => {
    const bestand = [vorlage('eigen', null), vorlage('kopie', 'eigen'), vorlage('andere', null)]

    const ergebnis = löseArbeitskopienVomParent(bestand, 'eigen')

    expect(ergebnis).toHaveLength(3)
    expect(ergebnis.map((v) => v.id)).toEqual(['eigen', 'kopie', 'andere'])
  })

  it('loest auch die Arbeitskopie einer EINGEBAUTEN Vorlage und laesst deren eingebaut-Flag in Ruhe', () => {
    const kopie = vorlage('kopie-vollbild', 'vollbild')
    const eingebaute = vorlage('vollbild', null, true)

    const ergebnis = löseArbeitskopienVomParent([eingebaute, kopie], 'vollbild')

    expect(ergebnis[1]?.parent).toBeNull()
    expect(ergebnis[1]?.eingebaut).toBe(false)
    // Der Parent selbst bleibt unangetastet im Ergebnis stehen - entfernt wird er von #107.
    expect(ergebnis[0]).toBe(eingebaute)
  })
})

describe('löseArbeitskopienVomParent – was ueberleben muss', () => {
  it('reicht jeden Nicht-Treffer als DIESELBE Objekt-Referenz durch', () => {
    const eigenstaendig = vorlage('eigen-b', null)
    const fremdeKopie = vorlage('kopie-b', 'eigen-b')
    const kopieEingebaut = vorlage('kopie-split', 'split')
    const zuLoeschen = vorlage('eigen-a', null)
    const bestand = [zuLoeschen, eigenstaendig, fremdeKopie, kopieEingebaut]

    const ergebnis = löseArbeitskopienVomParent(bestand, 'eigen-a')

    // Der zu loeschende Eintrag selbst, eine eigenstaendige Vorlage, die Arbeitskopie einer
    // ANDEREN Vorlage und die Arbeitskopie einer eingebauten Vorlage: alle vier unberuehrt.
    expect(ergebnis[0]).toBe(zuLoeschen)
    expect(ergebnis[1]).toBe(eigenstaendig)
    expect(ergebnis[2]).toBe(fremdeKopie)
    expect(ergebnis[3]).toBe(kopieEingebaut)
  })

  it('laesst die Eingabe unveraendert - anderes Array, alter parent steht noch drin', () => {
    const kopie = vorlage('kopie', 'eigen')
    const bestand = [vorlage('eigen', null), kopie]

    const ergebnis = löseArbeitskopienVomParent(bestand, 'eigen')

    expect(ergebnis).not.toBe(bestand)
    expect(bestand).toHaveLength(2)
    expect(kopie.parent).toBe('eigen')
    expect(bestand[1]).toBe(kopie)
  })

  it('aendert nichts, wenn kein Eintrag auf den geloeschten Parent zeigt', () => {
    const bestand = [vorlage('eigen', null), vorlage('kopie-b', 'eigen-b')]

    const ergebnis = löseArbeitskopienVomParent(bestand, 'eigen-a')

    expect(ergebnis).not.toBe(bestand)
    expect(ergebnis[0]).toBe(bestand[0])
    expect(ergebnis[1]).toBe(bestand[1])
  })

  it('repariert kaputte parent-Werte nicht, sondern reicht sie durch', () => {
    const kaputt = { ...vorlage('kaputt', null), parent: 42 } as unknown as Vorlage
    const ohneFeld = { ...vorlage('ohne-feld', null) } as Partial<Vorlage> as Vorlage
    delete (ohneFeld as { parent?: unknown }).parent
    const bestand = [kaputt, ohneFeld]

    const ergebnis = löseArbeitskopienVomParent(bestand, 'eigen')

    expect(ergebnis[0]).toBe(kaputt)
    expect(ergebnis[1]).toBe(ohneFeld)
  })
})

describe('löseArbeitskopienVomParent – Randfaelle ohne Fehlerpfad', () => {
  it('liefert bei leerem Bestand ein leeres neues Array', () => {
    const bestand: Vorlage[] = []

    const ergebnis = löseArbeitskopienVomParent(bestand, 'eigen')

    expect(ergebnis).toEqual([])
    expect(ergebnis).not.toBe(bestand)
  })

  it('gibt bei leerer, undefinierter oder nicht-stringiger parentId den Bestand unveraendert zurueck', () => {
    const ohneFeld = { ...vorlage('ohne-feld', null) } as Partial<Vorlage> as Vorlage
    delete (ohneFeld as { parent?: unknown }).parent
    const leererParent = vorlage('leerer-parent', '')
    const bestand = [ohneFeld, leererParent, vorlage('kopie', 'eigen')]

    for (const parentId of ['', undefined, null, 7]) {
      const ergebnis = roh(bestand, parentId)

      expect(ergebnis).not.toBe(bestand)
      expect(ergebnis).toEqual(bestand)
      // Kein Eintrag darf hier zum Treffer werden - auch nicht ueber undefined === undefined
      // oder '' === ''.
      expect(ergebnis[0]).toBe(ohneFeld)
      expect(ergebnis[1]).toBe(leererParent)
    }
  })

  it('ist synchron: der Rueckgabewert ist ein Array, kein Promise', () => {
    expect(Array.isArray(löseArbeitskopienVomParent([vorlage('eigen', null)], 'eigen'))).toBe(true)
  })

  it('wirft nicht, wenn ein Eintrag gar kein Objekt ist', () => {
    const echte = vorlage('kopie', 'eigen')
    const bestand = [null, echte] as unknown as Vorlage[]

    const ergebnis = löseArbeitskopienVomParent(bestand, 'eigen')

    expect(ergebnis[0]).toBeNull()
    expect(ergebnis[1]?.parent).toBeNull()
  })
})
