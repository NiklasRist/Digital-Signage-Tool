// Netzgrenzen des Produktfoto-Abrufs (FA-27 / TK 9.19.4).
//
// Die IP-Regel ist die Sicherheitszusage dieser Funktion: „keine Ziele im lokalen Netz -
// geprueft wird die AUFGELOESTE Adresse". Sie wird hier direkt geprueft, ohne Netzaufruf;
// der Aufruf gegen 127.0.0.1 belegt zusaetzlich, dass die Regel VOR der Verbindung greift.
import { describe, expect, it } from 'vitest'

import { hole, istOeffentlicheAdresse } from '../../src/main/produktfoto/netz'

describe('istOeffentlicheAdresse (TK 9.19.4)', () => {
  it('weist Loopback ab', () => {
    expect(istOeffentlicheAdresse('127.0.0.1')).toBe(false)
    expect(istOeffentlicheAdresse('127.255.0.1')).toBe(false)
    expect(istOeffentlicheAdresse('::1')).toBe(false)
  })

  it('weist die privaten IPv4-Bereiche ab', () => {
    expect(istOeffentlicheAdresse('10.0.0.1')).toBe(false)
    expect(istOeffentlicheAdresse('172.16.0.1')).toBe(false)
    expect(istOeffentlicheAdresse('172.31.255.255')).toBe(false)
    expect(istOeffentlicheAdresse('192.168.1.1')).toBe(false)
  })

  it('weist Link-Local, 0.0.0.0 und Multicast ab', () => {
    expect(istOeffentlicheAdresse('169.254.1.1')).toBe(false)
    expect(istOeffentlicheAdresse('0.0.0.0')).toBe(false)
    expect(istOeffentlicheAdresse('224.0.0.1')).toBe(false)
    expect(istOeffentlicheAdresse('255.255.255.255')).toBe(false)
  })

  it('weist Unique-Local und Link-Local im IPv6 ab', () => {
    expect(istOeffentlicheAdresse('fe80::1')).toBe(false)
    expect(istOeffentlicheAdresse('fc00::1')).toBe(false)
    expect(istOeffentlicheAdresse('fd12:3456::1')).toBe(false)
  })

  it('prueft bei IPv4-mapped die eingebettete Adresse', () => {
    expect(istOeffentlicheAdresse('::ffff:127.0.0.1')).toBe(false)
    expect(istOeffentlicheAdresse('::ffff:7f00:1')).toBe(false)
    expect(istOeffentlicheAdresse('::ffff:8.8.8.8')).toBe(true)
  })

  it('laesst oeffentliche Adressen durch', () => {
    expect(istOeffentlicheAdresse('8.8.8.8')).toBe(true)
    expect(istOeffentlicheAdresse('172.32.0.1')).toBe(true)
    expect(istOeffentlicheAdresse('2001:4860:4860::8888')).toBe(true)
  })

  it('lehnt Nicht-IP-Werte ab (nur Adressen, keine Namen)', () => {
    expect(istOeffentlicheAdresse('example.com')).toBe(false)
    expect(istOeffentlicheAdresse('')).toBe(false)
  })
})

describe('hole (TK 9.19.4)', () => {
  it('weist eine Loopback-Adresse ab, BEVOR eine Verbindung entsteht', async () => {
    const antwort = await hole(new URL('http://127.0.0.1:9/produkt'), 1024, Date.now() + 5000)

    expect(antwort.ok).toBe(false)
    if (antwort.ok) return
    expect(antwort.fehler.code).toBe('lokales_netz')
  })

  it('weist auch eine lokale Adresse mit Pfad und Port ab', async () => {
    const antwort = await hole(
      new URL('https://192.168.0.10:8443/x/y'),
      1024,
      Date.now() + 5000,
    )

    expect(antwort.ok).toBe(false)
    if (antwort.ok) return
    expect(antwort.fehler.code).toBe('lokales_netz')
  })
})
