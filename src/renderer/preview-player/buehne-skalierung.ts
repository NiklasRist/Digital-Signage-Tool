// GENERIERT aus dem Signaturblock von Issue #212.
// [preview-player] Die Bühne – ein festes 1920×1080-Raster, das nur zur Darstellung skaliert wird
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.
//
// Die Pruefsumme haelt fest, was der Generator hier zuletzt hinterlassen hat.
// Stimmt sie beim naechsten Lauf nicht mehr, wurde die Datei bearbeitet - dann
// fasst der Generator sie NIE an, auch wenn sich das Issue geaendert hat. Sie
// mitzupflegen ist NICHT deine Aufgabe: Wer den Rumpf fuellt, laesst sie einfach
// stehen; ihr Nichtmehrstimmen IST das Signal.
// GERUEST-PRUEFSUMME: 41b597743144ae0b

import { RENDER_PROFILE } from '../../shared/contracts/render-profile'

/** Wie das feste 1920×1080-Raster in einen äußeren Kasten gelegt wird. Reine Rechnung. */
export interface Buehnenmaße {
  /** Faktor, mit dem das Raster dargestellt wird. 0, wenn der äußere Kasten unbrauchbar ist. */
  skalierung: number
  /** Dargestellte Breite in CSS-Pixeln: RENDER_PROFILE.breite × skalierung. */
  breite: number
  /** Dargestellte Höhe in CSS-Pixeln: RENDER_PROFILE.hoehe × skalierung. */
  höhe: number
  /** Linker Rand zur Zentrierung im äußeren Kasten: (aussenBreite − breite) / 2. */
  versatzX: number
  /** Oberer Rand zur Zentrierung im äußeren Kasten: (aussenHöhe − höhe) / 2. */
  versatzY: number
}

const NULLMAßE: Buehnenmaße = { skalierung: 0, breite: 0, höhe: 0, versatzX: 0, versatzY: 0 }

/**
 * Total: wirft nie. Bei einem unbrauchbaren äußeren Kasten (0, negativ, NaN, Infinity) sind ALLE
 * fünf Felder 0 – das ist der „noch nicht gemessen"-Fall und kein Fehler.
 */
export function berechneBuehnenmaße(aussenBreite: number, aussenHöhe: number): Buehnenmaße {
  // ENTSCHIEDEN 3: Der Nullfall ist ausdrücklich modelliert. Unbrauchbare Werte sind
  // „noch nicht gemessen", kein Fehler - nichts wird geworfen, kein Ersatzwert.
  if (!Number.isFinite(aussenBreite) || !Number.isFinite(aussenHöhe)) {
    return NULLMAßE
  }
  if (aussenBreite <= 0 || aussenHöhe <= 0) {
    return NULLMAßE
  }

  // ENTSCHIEDEN 1: Es wird NICHT gerundet. Der Browser stellt Bruchteile korrekt dar;
  // ein Math.round hier wuerde die Zentrierung verschieben und falsches Vertrauen wecken.
  // ENTSCHIEDEN 2: Keine Obergrenze - ein Kasten grosser als das Raster vergroessert.
  const skalierung = Math.min(aussenBreite / RENDER_PROFILE.breite, aussenHöhe / RENDER_PROFILE.hoehe)
  const breite = RENDER_PROFILE.breite * skalierung
  const höhe = RENDER_PROFILE.hoehe * skalierung

  return {
    skalierung,
    breite,
    höhe,
    versatzX: (aussenBreite - breite) / 2,
    versatzY: (aussenHöhe - höhe) / 2,
  }
}