import { describe, expect, it } from 'vitest'

import { erzeugeFortschrittsLeser } from '../../src/main/ffmpeg-adapter/fortschritt'

// Verhaltenstest zu #160 (Fortschritt aus der ffmpeg-Ausgabe lesen und drosseln).
//
// Kein echtes ffmpeg: Die Zeilen kommen im Betrieb ohnehin von aussen herein (#158 reicht sie
// ungedeutet weiter), und die Zeit wird hineingereicht - beides zusammen macht die Drosselung
// ohne Zeitfaelschung und ohne Warten pruefbar.

const MIND_ABSTAND_MS = 250

describe('erzeugeFortschrittsLeser', () => {
  it('rechnet out_time_us in Prozent der erwarteten Dauer um', () => {
    const leser = erzeugeFortschrittsLeser(60)

    expect(leser.nimmZeile('out_time_us=30000000', 0)).toBe(50)
  })

  it('nimmt out_time als Ersatzweg, wenn die Zeile kein out_time_us traegt', () => {
    const leser = erzeugeFortschrittsLeser(60)

    expect(leser.nimmZeile('out_time=00:00:30.000000', 0)).toBe(50)
  })

  it('rechnet Stunden und Minuten aus out_time stellenrichtig', () => {
    // 01:01:01 sind 3661 s - also genau die Haelfte. Jede stellenverschobene Rechnung
    // ergaebe hier eine andere Zahl als 50.
    const leser = erzeugeFortschrittsLeser(7322)

    expect(leser.nimmZeile('out_time=01:01:01.000000', 0)).toBe(50)
  })

  it('wertet out_time_ms nicht aus', () => {
    const leser = erzeugeFortschrittsLeser(60)

    expect(leser.nimmZeile('out_time_ms=30000000', 0)).toBeNull()
  })

  it('ignoriert eine Zeile ohne Gleichheitszeichen', () => {
    const leser = erzeugeFortschrittsLeser(60)

    expect(leser.nimmZeile('irgendein Rauschen', 0)).toBeNull()
  })

  it('ignoriert unbekannte Schluessel', () => {
    const leser = erzeugeFortschrittsLeser(60)

    expect(leser.nimmZeile('frame=60', 0)).toBeNull()
    expect(leser.nimmZeile('speed=25.6x', 0)).toBeNull()
    expect(leser.nimmZeile('bitrate=  55.0kbits/s', 0)).toBeNull()
  })

  it('meldet nichts, wenn der Zeitwert keine Zahl ist', () => {
    const leser = erzeugeFortschrittsLeser(60)

    // Der erste -progress-Block eines jeden echten Laufs sieht genau so aus.
    expect(leser.nimmZeile('out_time_us=N/A', 0)).toBeNull()
    expect(leser.nimmZeile('out_time=N/A', 0)).toBeNull()
  })

  it('wiederholt nach einem unlesbaren Wert nicht den zuletzt gemeldeten', () => {
    const leser = erzeugeFortschrittsLeser(60)

    expect(leser.nimmZeile('out_time_us=30000000', 0)).toBe(50)
    expect(leser.nimmZeile('out_time_us=N/A', MIND_ABSTAND_MS)).toBeNull()
  })

  it('laesst den ersten Wert sofort durch', () => {
    const leser = erzeugeFortschrittsLeser(60)

    expect(leser.nimmZeile('out_time_us=600000', 0)).toBe(1)
  })

  it('drosselt auf MIND_ABSTAND_MS und meldet danach wieder', () => {
    const leser = erzeugeFortschrittsLeser(60)

    expect(leser.nimmZeile('out_time_us=6000000', 1000)).toBe(10)
    expect(leser.nimmZeile('out_time_us=12000000', 1100)).toBeNull()
    expect(leser.nimmZeile('out_time_us=18000000', 1100 + MIND_ABSTAND_MS)).toBe(30)
  })

  it('bezieht die Drosselung auf den zuletzt gemeldeten Wert, nicht auf die letzte Zeile', () => {
    const leser = erzeugeFortschrittsLeser(60)

    expect(leser.nimmZeile('out_time_us=6000000', 0)).toBe(10)
    expect(leser.nimmZeile('out_time_us=12000000', 200)).toBeNull()
    expect(leser.nimmZeile('out_time_us=18000000', 249)).toBeNull()
    expect(leser.nimmZeile('out_time_us=24000000', MIND_ABSTAND_MS)).toBe(40)
  })

  it('meldet bei progress=end 100 und geht dabei an der Drosselung vorbei', () => {
    const leser = erzeugeFortschrittsLeser(60)

    expect(leser.nimmZeile('out_time_us=30000000', 0)).toBe(50)
    expect(leser.nimmZeile('progress=end', 1)).toBe(100)
  })

  it('meldet bei progress=continue nichts', () => {
    const leser = erzeugeFortschrittsLeser(60)

    expect(leser.nimmZeile('progress=continue', 0)).toBeNull()
  })

  it('setzt sich nach progress=end nicht zurueck', () => {
    const leser = erzeugeFortschrittsLeser(60)

    expect(leser.nimmZeile('progress=end', 0)).toBe(100)
    expect(leser.nimmZeile('out_time_us=6000000', 1)).toBeNull()
  })

  it('begrenzt einen Wert jenseits der erwarteten Dauer auf 100', () => {
    const leser = erzeugeFortschrittsLeser(60)

    expect(leser.nimmZeile('out_time_us=90000000', 0)).toBe(100)
  })

  it('begrenzt einen negativen Wert auf 0', () => {
    const leser = erzeugeFortschrittsLeser(60)

    expect(leser.nimmZeile('out_time_us=-6000000', 0)).toBe(0)
  })

  it('erzwingt keine Monotonie', () => {
    const leser = erzeugeFortschrittsLeser(60)

    expect(leser.nimmZeile('out_time_us=30000000', 0)).toBe(50)
    expect(leser.nimmZeile('out_time_us=6000000', MIND_ABSTAND_MS)).toBe(10)
  })

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    'bleibt bei erwarteteDauerSekunden %p dauerhaft stumm',
    (dauer) => {
      const leser = erzeugeFortschrittsLeser(dauer)

      expect(() => leser.nimmZeile('out_time_us=30000000', 0)).not.toThrow()
      expect(leser.nimmZeile('out_time_us=30000000', 0)).toBeNull()
      expect(leser.nimmZeile('out_time=00:00:30.000000', MIND_ABSTAND_MS)).toBeNull()
      expect(leser.nimmZeile('progress=end', 2 * MIND_ABSTAND_MS)).toBeNull()
    },
  )

  it('wirft nicht, wenn jetztMs rueckwaerts laeuft, und drosselt dann nicht', () => {
    const leser = erzeugeFortschrittsLeser(60)

    expect(leser.nimmZeile('out_time_us=6000000', 5000)).toBe(10)
    expect(leser.nimmZeile('out_time_us=12000000', 4000)).toBe(20)
  })

  it('gibt ganze Zahlen zurueck', () => {
    const leser = erzeugeFortschrittsLeser(7)

    expect(leser.nimmZeile('out_time_us=1000000', 0)).toBe(14)
  })

  it('bedient zwei Leser unabhaengig voneinander', () => {
    const einer = erzeugeFortschrittsLeser(60)
    const anderer = erzeugeFortschrittsLeser(60)

    expect(einer.nimmZeile('out_time_us=30000000', 0)).toBe(50)
    expect(anderer.nimmZeile('out_time_us=6000000', 0)).toBe(10)
  })
})
