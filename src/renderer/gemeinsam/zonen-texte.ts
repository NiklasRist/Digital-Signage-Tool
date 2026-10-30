// [renderer-gemeinsam] Die deutschen Namen der Zonen – EINE Quelle fuer beide Editoren (#454).
//
// WARUM HIER UND NICHT IN DEN EDITOREN: Der Vorlagen-Editor zeigt die Zonen-Liste, der
// Marken-Editor die anklickbaren Elemente seiner Vorschau-Vorlage. Beide beschriften
// dieselben Kennungen – bisher mit ZWEI Listen, und sie liefen auseinander: die eine
// sagte `titel`, die andere `ueberschrift` fuer dieselbe Sache. Eine Quelle beendet das.
//
// Die KENNUNGEN bleiben unveraendert: `Zone.id` ist gespeicherter Bestand (TK 9.11.1).
// Uebersetzt wird nur die ANZEIGE. Das Modul ist rein: kein JSX, kein IPC, kein DOM,
// kein Dateisystem – es liefert nur Daten.

/** Anzeigename und ein Satz zu einer Zonen-Kennung. */
export interface ZonenText {
  /** Anzeigename, z. B. „Überschrift". */
  name: string
  /** Ein Satz: was die Zone tut und wo man sie sieht. */
  zweck: string
}

/**
 * Die Namen (vom Auftraggeber bestaetigt, 30.10.2026 – Issue #454).
 *
 * `ueberschrift` und `titel` sind zwei Kennungen fuer dieselbe Sache: die eingebauten
 * Ganzbild-Vorlagen tragen `ueberschrift`, die Band-Vorlage traegt `titel` (so steht es
 * in der TK-Tabelle). Angezeigt wird fuer beide „Überschrift" – aus EINEM Eintrag,
 * damit die beiden Kennungen nicht doch wieder auseinanderlaufen koennen.
 */
const UEBERSCHRIFT: ZonenText = {
  name: 'Überschrift',
  zweck: 'Der große Satz, z. B. „Sommer-Aktion".',
}

const TEXTE: Readonly<Record<string, ZonenText>> = {
  hintergrund: {
    name: 'Hintergrund',
    zweck: 'Die Fläche unter allem – deckt das ganze Bild.',
  },
  motiv: {
    name: 'Bild der Aktion',
    zweck: 'Kommt aus der Aktion (Foto/Video), nicht aus der Marke.',
  },
  scrim: {
    name: 'Abdunkelung',
    zweck: 'Dunkler Verlauf über dem Bild, damit die Schrift lesbar bleibt.',
  },
  logo: {
    name: 'Logo',
    zweck: 'Das Markenzeichen.',
  },
  ueberschrift: UEBERSCHRIFT,
  titel: UEBERSCHRIFT,
  beschreibung: {
    name: 'Beschreibung',
    zweck: 'Der erklärende Satz darunter.',
  },
  preis: {
    name: 'Preis',
    zweck: 'Die runde Plakette mit der Zahl.',
  },
  cta: {
    name: 'Knopf',
    zweck: 'Der Handlungsknopf, z. B. „Jetzt Mitglied werden".',
  },
}

/**
 * Fuer jede Kennung aus `Zone.id`; unbekannte Kennungen liefern ihren Rohwert.
 *
 * KEIN FEHLERFALL: Eine aeltere oder selbst gebaute Zone zeigt ihre Kennung, statt zu
 * werfen – der Editor bleibt bedienbar. Der `hasOwn`-Test ist noetig, weil ein einfacher
 * Zugriff auf `'__proto__'` das Prototype-Objekt lieferte statt `undefined`.
 */
export function zonenText(id: string): ZonenText {
  const text = Object.hasOwn(TEXTE, id) ? TEXTE[id] : undefined
  return text ?? { name: id, zweck: '' }
}
