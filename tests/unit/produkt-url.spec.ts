// Feldnormalisierung von `Aktion.produktUrl` (FA-27 / TK 9.19.7), 12.11.2026.
//
// Die Regel ist EINE Zeile im TK („getrimmt; nur http/https; alles andere → null") und
// wird von Main (Speicher) und Renderer (Feldeingabe) gelesen. Geprueft wird deshalb die
// gemeinsame Funktion, nicht ihre zwei Verbraucher.
import { describe, expect, it } from 'vitest'

import { normalisiereProduktUrl } from '../../src/shared/produkt-url'

describe('normalisiereProduktUrl (FA-27)', () => {
  it('trimmt Randleerzeichen und behaelt die Adresse sonst unveraendert', () => {
    expect(normalisiereProduktUrl('  https://shop.example/p/1  ')).toBe('https://shop.example/p/1')
  })

  it('nimmt http und https', () => {
    expect(normalisiereProduktUrl('http://shop.example')).toBe('http://shop.example')
    expect(normalisiereProduktUrl('HTTPS://shop.example')).toBe('HTTPS://shop.example')
  })

  it('verwirft andere Schemata (file, ftp, javascript, data)', () => {
    expect(normalisiereProduktUrl('file:///etc/passwd')).toBeNull()
    expect(normalisiereProduktUrl('ftp://shop.example/x')).toBeNull()
    expect(normalisiereProduktUrl('javascript:alert(1)')).toBeNull()
    expect(normalisiereProduktUrl('data:image/png;base64,AAAA')).toBeNull()
  })

  it('verwirft leere, fehlende und nicht-absolute Werte', () => {
    expect(normalisiereProduktUrl('')).toBeNull()
    expect(normalisiereProduktUrl('   ')).toBeNull()
    expect(normalisiereProduktUrl(undefined)).toBeNull()
    expect(normalisiereProduktUrl(null)).toBeNull()
    expect(normalisiereProduktUrl(42)).toBeNull()
    expect(normalisiereProduktUrl('shop.example/ohne-schema')).toBeNull()
  })
})
