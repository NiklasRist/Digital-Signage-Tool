// GENERIERT aus dem Signaturblock von Issue #257.
// [queue-panel] Modul-Wurzel: die Warteschlangen-Leiste zusammensetzen
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
// GERUEST-PRUEFSUMME: 1f9991628a8d560c

// src/renderer/queue-panel/leisten-montage.ts   (rein: kein JSX, kein react, kein IPC)
import type { AuftragsSicht } from './auftrags-sicht'
import type { QueueAktion } from './entfernen'

/** Die offene Rueckfrage vor einer nicht umkehrbaren Bedienung. Nur `abbrechen` erzeugt eine. */
export interface Rueckfrage {
  auftragId: string
  aktion: QueueAktion
  /** Der Text aus `rueckfrageText` (#209) – hier NICHT gebaut, nur mitgefuehrt. */
  text: string
}

/** Was die Leiste ausser dem Auftragsbestand haelt. Ein WERT – keine Funktion mutiert ihn. */
export interface LeistenLage {
  aufgeklappt: boolean
  /** null = keine Rueckfrage offen. */
  rueckfrage: Rueckfrage | null
  /** Die zuletzt gescheiterte Bedienung; null = keine. Genau EINE, nie ein Stapel. */
  meldung: { code: string; meldung: string } | null
}

/** Eingeklappt, keine Rueckfrage, keine Meldung. */
export const LEERE_LEISTEN_LAGE: LeistenLage = {
  aufgeklappt: false,
  rueckfrage: null,
  meldung: null
};

/** Jede dieser Funktionen liefert eine NEUE Lage; die uebergebene bleibt unveraendert.
 *  Alle sind total: sie werfen nie. */
export function schalteKlappzustand(lage: LeistenLage): LeistenLage {
  return {
    ...lage,
    aufgeklappt: !lage.aufgeklappt
  };
}
export function oeffneRueckfrage(lage: LeistenLage, rueckfrage: Rueckfrage): LeistenLage {
  return {
    ...lage,
    rueckfrage,
    meldung: null
  };
}
export function schliesseRueckfrage(lage: LeistenLage): LeistenLage {
  return {
    ...lage,
    rueckfrage: null,
    meldung: null
  };
}
export function meldeLeistenFehler(lage: LeistenLage, code: string, meldung: string): LeistenLage {
  return {
    ...lage,
    rueckfrage: null,
    meldung: { code, meldung }
  };
}
export function verwirfLeistenMeldung(lage: LeistenLage): LeistenLage {
  return {
    ...lage,
    meldung: null
  };
}

/**
 * Die `renderId` des gerade LAUFENDEN Renders – genau die Auskunft, die #208 als
 * `leseAktuelleRenderId` erwartet. REIN und TOTAL: wirft nie.
 * Genau dann ein Wert, wenn die Sicht `geladen` ist UND ein Auftrag mit `art: 'render'` und
 * `status: 'laeuft'` darin steht; sonst null. Es wird NICHTS nachgeschlagen und NICHTS geraten.
 */
export function aktuelleRenderId(sicht: AuftragsSicht): string | null {
  if (sicht.zustand !== 'geladen') {
    return null;
  }
  const laufendeRender = sicht.auftraege.find(
    (a) => a.art === 'render' && a.status === 'laeuft'
  );
  if (!laufendeRender || laufendeRender.art !== 'render') {
    return null;
  }
  return laufendeRender.payload.renderId ?? null;
}
