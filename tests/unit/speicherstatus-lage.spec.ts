import { describe, expect, it } from 'vitest';
import {
  ANFANGSLAGE,
  verarbeiteSpeicherEreignis,
  zeigtHinweis,
  betroffeneQuellen,
  type Speicherlage
} from '../../src/renderer/app-shell/speicherstatus-lage';

describe('speicherstatus-lage (#200)', () => {
  it('ANFANGSLAGE hat für beide Quellen zustand: "unbekannt" und letzterFehlercode: null', () => {
    expect(ANFANGSLAGE.projekt).toEqual({ zustand: 'unbekannt', letzterFehlercode: null });
    expect(ANFANGSLAGE.vorlagen).toEqual({ zustand: 'unbekannt', letzterFehlercode: null });
  });

  it('zeigtHinweis(ANFANGSLAGE) ist false', () => {
    expect(zeigtHinweis(ANFANGSLAGE)).toBe(false);
  });

  it('verarbeiteSpeicherEreignis(ANFANGSLAGE, "projekt", { typ: "fehler", code: "speicher_fehler" }) ergibt projekt.zustand === "nicht_gespeichert"', () => {
    const neueLage = verarbeiteSpeicherEreignis(ANFANGSLAGE, 'projekt', {
      typ: 'fehler',
      code: 'speicher_fehler',
    });
    expect(neueLage.projekt.zustand).toBe('nicht_gespeichert');
    expect(neueLage.projekt.letzterFehlercode).toBe('speicher_fehler');
    expect(neueLage.vorlagen).toEqual(ANFANGSLAGE.vorlagen);
  });

  it('Zwei Fehler hintereinander lassen den Zustand auf "nicht_gespeichert" und übernehmen den zuletzt gemeldeten Code', () => {
    const lage1 = verarbeiteSpeicherEreignis(ANFANGSLAGE, 'projekt', {
      typ: 'fehler',
      code: 'fehler_1',
    });
    const lage2 = verarbeiteSpeicherEreignis(lage1, 'projekt', {
      typ: 'fehler',
      code: 'fehler_2',
    });
    expect(lage2.projekt.zustand).toBe('nicht_gespeichert');
    expect(lage2.projekt.letzterFehlercode).toBe('fehler_2');
  });

  it('{ typ: "gespeichert" } derselben Quelle setzt "gespeichert" und letzterFehlercode: null', () => {
    const lage1 = verarbeiteSpeicherEreignis(ANFANGSLAGE, 'projekt', {
      typ: 'fehler',
      code: 'fehler_1',
    });
    const lage2 = verarbeiteSpeicherEreignis(lage1, 'projekt', { typ: 'gespeichert' });
    expect(lage2.projekt.zustand).toBe('gespeichert');
    expect(lage2.projekt.letzterFehlercode).toBe(null);
  });

  it('Steht vorlagen auf "nicht_gespeichert" und projekt meldet "gespeichert", ist zeigtHinweis weiterhin true und betroffeneQuellen liefert genau ["vorlagen"]', () => {
    let lage: Speicherlage = ANFANGSLAGE;
    lage = verarbeiteSpeicherEreignis(lage, 'vorlagen', { typ: 'fehler', code: 'v_fehler' });
    lage = verarbeiteSpeicherEreignis(lage, 'projekt', { typ: 'gespeichert' });
    
    expect(zeigtHinweis(lage)).toBe(true);
    expect(betroffeneQuellen(lage)).toEqual(['vorlagen']);
  });

  it('verarbeiteSpeicherEreignis verändert die übergebene Lage nicht', () => {
    const original = JSON.parse(JSON.stringify(ANFANGSLAGE));
    verarbeiteSpeicherEreignis(ANFANGSLAGE, 'projekt', { typ: 'gespeichert' });
    expect(ANFANGSLAGE).toEqual(original);
  });
});
