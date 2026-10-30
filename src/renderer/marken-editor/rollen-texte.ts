// [marken-editor] Die Erklaerungsschicht: Name und EIN Satz je Farb- und Schriftrolle (#455).
//
// WARUM ES DIESE DATEI GIBT: Am 29.10.2026 lautete der Befund woertlich „nicht klar, welche
// Option in der Box was macht und warum es die braucht". Die Rollen-Namen allein („Akzent
// kräftig", „Fläche hell") sagen einem Nicht-Designer nichts. Hier steht zu jeder Rolle ein
// Satz, der sie verortet - und bei den Rollen, die keine eingebaute Vorlage benutzt, genau
// das. Der Editor zeigt ihn unter dem Regler; KEIN Regler ohne Satz.
//
// EINE QUELLE: Die Anzeigenamen standen vorher als `ROLLE_TEXT`/`SCHRIFT_TEXT` in
// `index.tsx`; sie sind hierher gewandert, damit Palette, Inspector und Reihenfolge
// dieselbe Beschriftung tragen. `zonen-texte.ts` (#454) ist dasselbe Muster fuer Zonen.
//
// Das Modul ist REIN: kein JSX, kein IPC, kein DOM, kein Dateisystem.

import type { FarbRolle, SchriftRolle } from '../../shared/contracts/marke'

/** Anzeigename und ein Satz zu einer Farb- oder Schriftrolle. */
export interface RollenText {
  /** Anzeigename, z. B. „Fläche hell". */
  name: string
  /** Ein Satz: was die Rolle tut und wo man sie sieht. */
  zweck: string
}

/**
 * Die 13 Farb-Rollen (TK 9.11.2).
 *
 * „Wird von den eingebauten Vorlagen nicht benutzt" ist GEMESSEN (30.10.2026): von den drei
 * eingebauten Vorlagen (`vollbild`, `split`, `band-standard`) referenzieren sieben Rollen -
 * `akzent`, `flaecheDunkel`, `flaecheHell`, `textAufDunkel`, `textAufHell`, `scrimStart`,
 * `scrimEnde`. Die uebrigen sechs stehen nur eigenen Vorlagen zur Verfuegung. Der Satz sagt
 * das, statt „woanders" zu behaupten.
 */
const FARB_TEXTE: Readonly<Record<FarbRolle, RollenText>> = {
  akzent: {
    name: 'Akzent',
    zweck: 'Fläche der Preis-Pille. Fällt im Segment zuerst auf.',
  },
  akzentKraeftig: {
    name: 'Akzent kräftig',
    zweck: 'Kräftigere Fassung des Akzents. Wird von den eingebauten Vorlagen nicht benutzt.',
  },
  akzentTief: {
    name: 'Akzent tief',
    zweck: 'Dunkle Fassung des Akzents. Wird von den eingebauten Vorlagen nicht benutzt.',
  },
  flaecheDunkel: {
    name: 'Dunkle Fläche',
    zweck: 'Grund hinter allem – auch hinter einem Band.',
  },
  flaecheSehrDunkel: {
    name: 'Sehr dunkle Fläche',
    zweck: 'Dunklerer Grund für eigene Vorlagen. Wird von den eingebauten nicht benutzt.',
  },
  flaecheHell: {
    name: 'Helle Fläche',
    zweck: 'Grund des Knopfes. Der Text darauf ist „Text auf heller Fläche".',
  },
  flaecheAkzentZart: {
    name: 'Akzent zart',
    zweck: 'Sehr helle Akzentfläche. Wird von den eingebauten Vorlagen nicht benutzt.',
  },
  textAufDunkel: {
    name: 'Text auf dunklem Grund',
    zweck: 'Schriftfarbe auf Hintergrund und Abdunkelung.',
  },
  textAufHell: {
    name: 'Text auf heller Fläche',
    zweck: 'Schriftfarbe auf der hellen Fläche – also auf dem Knopf.',
  },
  textSekundaer: {
    name: 'Text sekundär',
    zweck: 'Zurückgenommene Schrift. Wird von den eingebauten Vorlagen nicht benutzt.',
  },
  linie: {
    name: 'Linie',
    zweck: 'Trennlinien. Wird von den eingebauten Vorlagen nicht benutzt.',
  },
  scrimStart: {
    name: 'Verlauf oben',
    zweck: 'Anfang der Abdunkelung – dort, wo sie noch durchsichtig ist.',
  },
  scrimEnde: {
    name: 'Verlauf unten',
    zweck: 'Ende der Abdunkelung – am unteren Bildrand.',
  },
}

/**
 * Die 4 Schrift-Rollen (TK 9.11.2). `headlineElegant` und `fliesstextFett` werden von keiner
 * eingebauten Vorlage benutzt (gemessen 30.10.2026); die eingebauten nehmen `headlinePlakativ`
 * und `fliesstext`.
 */
const SCHRIFT_TEXTE: Readonly<Record<SchriftRolle, RollenText>> = {
  headlineElegant: {
    name: 'Überschrift elegant',
    zweck: 'Feine Überschrift. Wird von den eingebauten Vorlagen nicht benutzt.',
  },
  headlinePlakativ: {
    name: 'Überschrift plakativ',
    zweck: 'Die fette Überschrift – und der Text auf Preis-Pille und Knopf.',
  },
  fliesstext: {
    name: 'Fließtext',
    zweck: 'Der erklärende Satz unter der Überschrift.',
  },
  fliesstextFett: {
    name: 'Fließtext fett',
    zweck: 'Hervorgehobener Fließtext. Wird von den eingebauten Vorlagen nicht benutzt.',
  },
}

/** Der Satz zu einer Farb-Rolle. Wirft nie – eine unbekannte Rolle zeigt ihren Rohwert. */
export function farbRollenText(rolle: FarbRolle): RollenText {
  return Object.hasOwn(FARB_TEXTE, rolle) ? FARB_TEXTE[rolle] : { name: String(rolle), zweck: '' }
}

/** Der Satz zu einer Schrift-Rolle. Wirft nie – eine unbekannte Rolle zeigt ihren Rohwert. */
export function schriftRollenText(rolle: SchriftRolle): RollenText {
  return Object.hasOwn(SCHRIFT_TEXTE, rolle)
    ? SCHRIFT_TEXTE[rolle]
    : { name: String(rolle), zweck: '' }
}
