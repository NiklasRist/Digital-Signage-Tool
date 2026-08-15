// GENERIERT aus dem Signaturblock von Issue #126.
// [composer] Optimistische Bedienung und die zwei Fehlerklassen
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
// GERUEST-PRUEFSUMME: 3af93178ee04837a
//
// ---------------------------------------------------------------------------
// HIER LIEGT DIE UNTERSCHEIDUNG DER ZWEI FEHLERKLASSEN (TK 9.7.3) - UND ZWAR AN
// GENAU EINER STELLE, WEIL SIE SICH SONST IN JEDER MUTIERENDEN DATEI WIEDERHOLT
// UND IRGENDWO FALSCH GERAET.
//
// KLASSE 1 - die Operation wurde ABGELEHNT (synchron, `ok: false`). Die Aenderung
// ist NIRGENDS gueltig, auch nicht im Arbeitsspeicher des Main. Die Oberflaeche
// zeigt etwas, das es nicht gibt -> `zuruecknehmen()`, plus eine Inline-Meldung
// mit dem Code und dem Text des Main.
//
// KLASSE 2 - das SPEICHERN auf die Platte ist gescheitert (asynchron, TK 9.5.4).
// Die Aenderung ist GUELTIG: Die Instant-Operation hat sie validiert und im
// Speicher angewendet, BEVOR sie "ok" meldete - nur der Weg auf die Platte hat
// nicht geklappt. Ein Rollback naehme dem Nutzer hier gueltige Arbeit weg, fuer
// einen Fehler, der mit dem Inhalt seiner Aenderung nichts zu tun hat. Deshalb:
// KEIN Rollback, nur ein dauerhafter Hinweis - warnen und (im Main) wiederholen.
//
// DIE ZWEI KLASSEN BERUEHREN SICH IM CODE NICHT: Klasse 1 laeuft ausschliesslich
// in `fuehreOptimistischAus` und fasst den Speicherzustand nie an; Klasse 2 laeuft
// ausschliesslich im Ereignis-Empfaenger von `verbindeSpeicherstatus` und ruft
// weder `zuruecknehmen` noch `anwenden` - sie hat die Rueckrufe gar nicht in
// Reichweite. Das ist keine Stilfrage, sondern die Bauform, die das Zusammenwerfen
// verhindert: Es GIBT keinen Pfad von einem Speicher-Ereignis zu einem Rollback.
//
// WAS DIESE DATEI NICHT TUT: Sie kennt die Liste nicht (der "letzte bestaetigte
// Stand" kommt als `zuruecknehmen`-Rueckruf vom Aufrufer, ENTSCHIEDEN 1), sie
// beruehrt keinen IPC-Kanal (die Abo-Funktion wird uebergeben, ENTSCHIEDEN 5), sie
// loest keinen Speicher-Wiederholversuch aus (der laeuft im Main, #47) und sie
// zeichnet nichts.
//
// OFFENE VERDRAHTUNG (gemeldet, nicht hier gebaut): Im Main gibt niemand das
// main-interne Auto-Speichern-Ereignis auf den IPC-Kanal weiter. Klasse 2 ist
// damit bis zu dieser Verdrahtung ohne Quelle - genau deshalb ist der
// Ausgangswert `'unbekannt'` und NICHT `'gespeichert'`: Fehlt der Sender, waere
// "gespeichert" eine dauerhafte Falschaussage und verwandelte einen sichtbaren
// Fehler in stillen Datenverlust (NFA-02).

import type { Ergebnis } from '../../shared/contracts/ergebnis'

/** Ereignisform des Auto-Speicherns, wie sie #47 im Main definiert (dort:
 *  `AutoSpeichernEreignis`). Sie trägt KEINE Ergebnis-Hülle – Ereignisse tragen keine (TK 9.1.1). */
export type SpeicherEreignis =
  | { typ: 'gespeichert' }
  | { typ: 'fehler'; code: string }

/** DREI Werte - nicht zwei. `'unbekannt'` ist der Ausgangswert und bedeutet: es ist noch keine
 *  Meldung eingetroffen. Er wird NIE als „gespeichert" dargestellt (ENTSCHIEDEN 3). */
export interface Speicherzustand {
  zustand: 'unbekannt' | 'gespeichert' | 'nicht_gespeichert'
  //   'unbekannt'         = kein Ereignis empfangen -> die Oberflaeche zeigt NICHTS an
  //   'gespeichert'       = zuletzt gemeldet { typ: 'gespeichert' } -> kein Hinweis
  //   'nicht_gespeichert' = zuletzt gemeldet { typ: 'fehler' }      -> dauerhafter Hinweis
  letzterFehlercode: string | null
}

export interface InlineMeldung {
  code: string
  meldung: string
}

// ---------------------------------------------------------------------------
// KLASSE 1 - der optimistische Schritt
// ---------------------------------------------------------------------------

/** Die angemeldeten Hoerer auf Inline-Meldungen, in Anmeldereihenfolge. */
const inlineHoerer: Array<(meldung: InlineMeldung) => void> = []

/**
 * Baut eine Abmelde-Funktion, die sich nur EINMAL auswirkt.
 *
 * Ohne die Sperre entfernte ein zweiter Aufruf die Anmeldung eines ANDEREN
 * Abonnenten, der dieselbe Funktion uebergeben hat (bei geteilten Handlern keine
 * Seltenheit) - ein Fehler, der sich als "ein Panel meldet nichts mehr" zeigt, weit
 * weg von der Ursache. Dasselbe Muster nutzt die gemeinsame Projekt-Sicht (#121).
 */
function baueAbmeldung<H>(liste: H[], hoerer: H): () => void {
  let abgemeldet = false
  return () => {
    if (abgemeldet) return
    abgemeldet = true

    const stelle = liste.indexOf(hoerer)
    if (stelle !== -1) liste.splice(stelle, 1)
  }
}

/**
 * Schickt eine Inline-Meldung an alle Hoerer - genau einmal je Hoerer.
 *
 * Die KOPIE der Liste erlaubt einem Hoerer, sich waehrend seiner eigenen
 * Benachrichtigung abzumelden, ohne die Indizes des laufenden Durchgangs zu
 * verschieben. Das try/catch haelt einen werfenden Hoerer davon ab, die uebrigen
 * abzuschneiden oder den optimistischen Schritt zu zerreissen: `fuehreOptimistischAus`
 * muss danach noch das unveraenderte `Ergebnis` zurueckgeben. Verschluckt wird der
 * Fehler nicht - er wird gemeldet.
 */
function meldeInline(meldung: InlineMeldung): void {
  for (const hoerer of [...inlineHoerer]) {
    try {
      hoerer(meldung)
    } catch (fehler) {
      console.error('[composer] Ein Hoerer der Inline-Meldungen hat geworfen.', fehler)
    }
  }
}

/**
 * Das `Ergebnis`, das eine unerwartete Ausnahme ersetzt.
 *
 * Der Code ist `unbekannter_fehler` und NICHT der Text der Ausnahme: "Eine rohe
 * Exception-Meldung wird nie zum Code." (TK 9.1.1) Auch der Text der Ausnahme wandert
 * NICHT in die Meldung - TK 9.1.1 verlangt, unerwartete Ausnahmen zu uebersetzen und
 * keinen Stacktrace in die Oberflaeche zu geben. Fuer die Fehlersuche bleibt der
 * Originalfehler erhalten: Er geht an die Konsole, nicht an den Nutzer.
 */
function ausnahmeAlsErgebnis<T>(stelle: string, fehler: unknown): Ergebnis<T> {
  console.error(`[composer] ${stelle} hat eine Ausnahme geworfen.`, fehler)
  return {
    ok: false,
    fehler: {
      code: 'unbekannter_fehler',
      meldung: 'Der Schritt konnte nicht ausgeführt werden.',
    },
  }
}

/** Klasse 1: optimistisch anwenden, bestätigen lassen, bei Ablehnung zurücknehmen. */
export async function fuehreOptimistischAus<T>(
  anwenden: () => void,
  zuruecknehmen: () => void,
  bestaetigen: () => Promise<Ergebnis<T>>,
): Promise<Ergebnis<T>> {
  // ERST anzeigen, DANN bestaetigen - das ist der ganze Sinn des optimistischen
  // Schritts (TK 9.7.3: "lokal sofort angezeigt, dann per Instant-Op bestaetigt").
  // Wirft `anwenden`, ist NICHTS angezeigt worden: `bestaetigen` wird nicht gerufen
  // (sonst liefe eine Aenderung im Main durch, die die Oberflaeche nie zeigte) und
  // `zuruecknehmen` auch nicht (es gibt nichts zurueckzunehmen, und ein Rueckruf auf
  // einen halb angewendeten Stand koennte selbst Schaden anrichten).
  //
  // KEINE Inline-Meldung in diesem Fall: Die Fehlerpfad-Tabelle des Issues fuehrt
  // diese Zeile ausdruecklich OHNE Fehlerklasse ("-") und zaehlt ihre Wirkungen
  // vollstaendig auf; die Inline-Meldung ist an Klasse 1 gebunden, also an eine
  // Antwort des Main. Ein Fehler im Rueckruf des Aufrufers ist ein Programmfehler der
  // Oberflaeche, kein Fachfehler - er kommt als `Ergebnis` beim Aufrufer an und
  // zusaetzlich in die Konsole, still ist er also nicht.
  try {
    anwenden()
  } catch (fehler) {
    return ausnahmeAlsErgebnis<T>('anwenden', fehler)
  }

  let ergebnis: Ergebnis<T>
  try {
    ergebnis = await bestaetigen()
  } catch (fehler) {
    // ENTSCHIEDEN 2: Eine Ausnahme aus `bestaetigen` ist Klasse 1. Die Aenderung ist
    // nachweislich NICHT bestaetigt worden, also gilt dieselbe Regel wie bei einer
    // Ablehnung - zuruecknehmen. Weitergeworfen wird nichts (TK 9.1.1, "Kein stiller
    // Fehlschlag" und "unerwartete Ausnahmen werden uebersetzt").
    const ersatz = ausnahmeAlsErgebnis<T>('bestaetigen', fehler)
    nimmZurueck(zuruecknehmen)
    // Der Code stammt hier NICHT vom Main, sondern von uns - deshalb ist das kein
    // Verstoss gegen "keine Umformung von Codes und Meldungen": Es gab keine Antwort
    // des Main, die umzuformen waere.
    if (!ersatz.ok) meldeInline({ code: ersatz.fehler.code, meldung: ersatz.fehler.meldung })
    return ersatz
  }

  if (!ergebnis.ok) {
    nimmZurueck(zuruecknehmen)
    // Code und Meldung UNVERAENDERT. Kein Uebersetzen, kein Zusammenfassen, kein
    // "irgendwas ist schiefgelaufen": An den Codes haengt echtes Verhalten in der
    // Oberflaeche (TK 9.1.1 Punkt 3), und wie der Text erscheint, entscheidet die
    // Oberflaeche - nicht diese Datei.
    meldeInline({ code: ergebnis.fehler.code, meldung: ergebnis.fehler.meldung })
  }

  // Bei `ok: true` passiert hier bewusst NICHTS weiter: Ein `ok` einer Instant-Operation
  // ist die VOLLSTAENDIGE Bestaetigung ("ihr Erfolg bedeutet 'gueltig uebernommen',
  // nicht 'schon auf Platte'", TK 9.5.4). Auf ein Speicher-Ereignis wird nicht gewartet
  // - wer das taete, machte den Nutzer von der Platte abhaengig, obwohl seine Aenderung
  // laengst gilt, und verschmelzte damit die beiden Fehlerklassen.
  //
  // Der Abgleich mit dem zurueckgegebenen Stand (TK 9.7.3) gehoert dem Aufrufer: Nur er
  // weiss, ob sein `T` ein Projekt, ein Listenelement oder nichts ist, und nur er hat
  // Zugang zur gemeinsamen Sicht. Deshalb geht das `Ergebnis` unveraendert hinaus.
  return ergebnis
}

/**
 * Ruft den Rollback-Rueckruf - und laesst dessen Ausnahme den Ablauf nicht zerreissen.
 *
 * Wirft der Rueckruf, ist die Oberflaeche in einem falschen Stand, und daran kann diese
 * Datei nichts aendern (sie kennt die Liste nicht). Was sie verhindern kann: dass der
 * Aufrufer statt des sauberen `Ergebnis` eine Ausnahme bekommt und die Inline-Meldung
 * ausfaellt - dann saehe der Nutzer WEDER den richtigen Stand NOCH einen Hinweis.
 */
function nimmZurueck(zuruecknehmen: () => void): void {
  try {
    zuruecknehmen()
  } catch (fehler) {
    console.error('[composer] zuruecknehmen hat eine Ausnahme geworfen.', fehler)
  }
}

/** Abonnement der Inline-Meldungen aus Klasse 1; Rückgabewert ist die Abmelde-Funktion. */
export function aufInlineMeldung(hoerer: (meldung: InlineMeldung) => void): () => void {
  inlineHoerer.push(hoerer)
  return baueAbmeldung(inlineHoerer, hoerer)
}

// ---------------------------------------------------------------------------
// KLASSE 2 - der Speicherzustand
//
// Ab hier gibt es weder `anwenden` noch `zuruecknehmen`: Kein Rueckruf des
// optimistischen Schritts ist in diesem Abschnitt sichtbar. Ein Speicher-Ereignis
// KANN deshalb keinen Rollback ausloesen - nicht, weil niemand es tut, sondern
// weil es nichts zu rufen gaebe.
// ---------------------------------------------------------------------------

/**
 * Der Speicherzustand - EINE Bindung, die bei jeder Aenderung ERSETZT und nie
 * beschrieben wird.
 *
 * `Object.freeze` ist keine Zierde: Ein `holeSpeicherzustand().zustand = 'gespeichert'`
 * in einer fremden Datei wirft damit sofort (ES-Module laufen im strict mode), statt
 * die gemeinsame Anzeige still auf die eine Behauptung umzubiegen, die diese
 * Oberflaeche nicht aufstellen darf.
 *
 * Der Ausgangswert ist `'unbekannt'` (ENTSCHIEDEN 3): Kein Ereignis heisst "Zustand
 * unbekannt", nicht "alles in Ordnung". Die Oberflaeche zeigt in diesem Zustand
 * NICHTS - keinen Hinweis und keine Entwarnung.
 */
let speicherzustand: Speicherzustand = Object.freeze({
  zustand: 'unbekannt' as const,
  letzterFehlercode: null,
})

/** Die angemeldeten Hoerer auf den Speicherzustand, in Anmeldereihenfolge. */
const zustandsHoerer: Array<(zustand: Speicherzustand) => void> = []

/**
 * Schaltet auf einen neuen Speicherzustand um und benachrichtigt danach.
 *
 * ERST setzen, DANN melden - ein Hoerer, der in der Benachrichtigung
 * `holeSpeicherzustand()` ruft (der Normalfall in einer UI-Anbindung), bekaeme sonst
 * den alten Stand. Kein Vergleich auf "hat sich ueberhaupt etwas geaendert": Zwei
 * Fehler-Ereignisse hintereinander koennen verschiedene Codes tragen, und eine
 * wiederholte Meldung desselben Zustands ist harmlos.
 */
function schalteUm(neu: Speicherzustand): void {
  speicherzustand = Object.freeze(neu)
  for (const hoerer of [...zustandsHoerer]) {
    try {
      hoerer(speicherzustand)
    } catch (fehler) {
      console.error('[composer] Ein Hoerer des Speicherzustands hat geworfen.', fehler)
    }
  }
}

/** Klasse 2: verbindet den Speicherstatus-Strom des Main. Die Abo-Funktion wird ÜBERGEBEN –
 *  der Aufrufer bildet sie aus `abonniere` (#151); diese Datei kennt keinen Kanalnamen. */
export function verbindeSpeicherstatus(
  abonniere: (hoerer: (ereignis: SpeicherEreignis) => void) => () => void,
): () => void {
  // Das Anmelden allein ist KEINE Entwarnung: Hier wird der Zustand nicht angefasst.
  // Er bleibt `'unbekannt'`, bis das erste Ereignis eintrifft - alles andere waere
  // die Behauptung "gespeichert" auf Grundlage eines blossen Abonnements.
  return abonniere((ereignis) => {
    // Die Nutzlast kommt ueber die Prozessgrenze und ist damit trotz Typangabe nur
    // eine Behauptung. Eine unbekannte Form wird IGNORIERT statt geraten: Sie als
    // Fehler zu deuten erzeugte einen Fehlalarm, sie als Erfolg zu deuten waere die
    // stille Falschaussage. Sichtbar gemacht wird sie trotzdem.
    if (ereignis === null || typeof ereignis !== 'object') {
      console.warn('[composer] Unbrauchbares Speicher-Ereignis - der Zustand bleibt, wie er ist.')
      return
    }

    if (ereignis.typ === 'gespeichert') {
      // Der Hinweis verschwindet AUSSCHLIESSLICH hier (ENTSCHIEDEN 4, TK 9.5.4:
      // "Erst nach erfolgreichem Schreiben verschwindet der Hinweis."). Kein Timer,
      // kein automatisches Ausblenden - deshalb steht in dieser Datei kein einziger
      // Zeitgeber.
      schalteUm({ zustand: 'gespeichert', letzterFehlercode: null })
      return
    }

    if (ereignis.typ === 'fehler') {
      // HIER, und nur hier, entscheidet sich der teuerste Fehler dieses Moduls: Es
      // wird NICHTS zurueckgenommen, NICHTS neu geladen, NICHTS an der Liste
      // geaendert. Die Aenderung liegt gueltig im Speicher des Main (TK 9.5.4); sie
      // hat nur die Platte noch nicht erreicht. Auch keine Inline-Meldung - die
      // gehoert zu Klasse 1 und beschriebe hier eine Ablehnung, die es nicht gab.
      //
      // Der Code wird UNVERAENDERT uebernommen. `letzterFehlercode` traegt immer den
      // ZULETZT gemeldeten; mehrere Fehler hintereinander lassen den Zustand
      // `'nicht_gespeichert'`.
      schalteUm({ zustand: 'nicht_gespeichert', letzterFehlercode: ereignis.code })
      return
    }

    console.warn('[composer] Unbekannte Art eines Speicher-Ereignisses - der Zustand bleibt.')
  })
}

export function holeSpeicherzustand(): Speicherzustand {
  // Keine Kopie noetig: Das Objekt wird nie beschrieben, sondern bei jeder Aenderung
  // ersetzt - und es ist eingefroren.
  return speicherzustand
}

/** Abonnement des Speicherzustands; Rückgabewert ist die Abmelde-Funktion. */
export function aufSpeicherzustand(hoerer: (zustand: Speicherzustand) => void): () => void {
  // KEIN sofortiger Erstaufruf mit dem aktuellen Stand: Die Signatur gibt nur die
  // Abmeldung zurueck, und ein Anmelden mit Nebenwirkung waere fuer den Aufrufer nicht
  // zu umgehen. Wer den Stand beim Anmelden braucht, holt ihn mit
  // `holeSpeicherzustand()` - dasselbe Vorgehen wie bei der Projekt-Sicht (#121).
  zustandsHoerer.push(hoerer)
  return baueAbmeldung(zustandsHoerer, hoerer)
}
