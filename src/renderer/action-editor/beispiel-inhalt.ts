// [action-editor] Beispielinhalt fuer die Vorschau (05.11.2026)
//
// WARUM ES DIESE DATEI GIBT (Niklas, 05.11.2026): „es ist unklar was moeglich ist […]
// es ist ein fertiges formular fuer eine langweilige powerpoint folie statt eine
// beeindruckende wirksame werbung." Der Editor zeigte bei einer neuen Aktion eine
// LEERE 16:9-Flaeche - man sah nicht, was am Ende herauskommt.
//
// DIE REGEL: Leere Felder werden fuer die VORSCHAU mit einem Beispiel gefuellt. Der
// ENTWURF bleibt unberuehrt - gespeichert wird nur, was der Nutzer selbst eingegeben
// hat. Die Vorschau sagt mit einem Hinweis, dass sie ein Beispiel zeigt.
//
// KEIN IPC, KEIN JSX, KEIN ZUSTAND: reine Ableitung, in
// `tests/unit/beispiel-inhalt.spec.ts` ohne React geprueft.

import type { AktionsInhalt } from '../../shared/contracts/aktion'
import type { Asset } from '../../shared/contracts/asset'

/** Der Beispielinhalt. Er steht NUR in der Vorschau und wird NIE gespeichert. */
export const BEISPIEL_INHALT = {
  titel: 'Dein Training. Dein Tempo.',
  beschreibung: 'Alle Kurse, Geräte und Studios inklusive.',
  preis: 'ab 29 €/Monat',
  cta: 'Jetzt starten',
} as const

/** Das erste Bild des Projekts, das als Motiv taugt - dieselbe Regel wie `waehlbareBilder`. */
export function erstesBild(assets: readonly Asset[]): Asset | null {
  return assets.find((asset) => asset.typ === 'bild' && asset.zustand === 'ok') ?? null
}

export interface BeispielVorschau {
  /** Der Inhalt, der GEZEICHNET wird - nicht der Entwurf. */
  inhalt: AktionsInhalt
  /** true, wenn mindestens ein Feld aus dem Beispiel stammt. */
  istBeispiel: boolean
}

function istLeer(wert: string | null): boolean {
  return wert === null || wert.trim() === ''
}

/**
 * Fuellt leere Felder fuer die Vorschau. `bildRef` ist das Beispielbild (das erste Bild
 * des Projekts, nur im Modus „neu" gesetzt); ein bereits gewaehltes Bild gewinnt immer.
 * Ein bewusst geleertes Bild bleibt leer, wenn der Aufrufer `null` uebergibt.
 */
export function mitBeispielinhalt(
  inhalt: AktionsInhalt,
  bildRef: string | null,
): BeispielVorschau {
  const titel = istLeer(inhalt.titel) ? BEISPIEL_INHALT.titel : inhalt.titel
  const beschreibung = istLeer(inhalt.beschreibung) ? BEISPIEL_INHALT.beschreibung : inhalt.beschreibung
  const preis = istLeer(inhalt.preis) ? BEISPIEL_INHALT.preis : inhalt.preis
  const cta = istLeer(inhalt.cta) ? BEISPIEL_INHALT.cta : inhalt.cta
  const bild = inhalt.bildRef ?? bildRef

  const istBeispiel =
    titel !== inhalt.titel ||
    beschreibung !== inhalt.beschreibung ||
    preis !== inhalt.preis ||
    cta !== inhalt.cta ||
    bild !== inhalt.bildRef

  return {
    inhalt: { ...inhalt, titel, beschreibung, preis, cta, bildRef: bild },
    istBeispiel,
  }
}
