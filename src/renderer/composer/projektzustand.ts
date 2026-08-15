// GENERIERT aus dem Signaturblock von Issue #121.
// [composer] Projektzustand laden und als Sicht halten
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
// GERUEST-PRUEFSUMME: 965f9aac9f44ff32
//
// ---------------------------------------------------------------------------
// DIESE DATEI IST DIE GEMEINSAME SICHT AUF DAS OFFENE PROJEKT (TK 9.7.4).
//
// Sie ist kein Speicher, sondern ein Spiegel: "`project-store` ist die Wahrheit:
// die Liste im composer ist nur eine Sicht; nach jeder Mutation mit dem
// Rueckgabestand abgleichen." Deshalb gibt es hier genau vier Wege, den Stand zu
// bewegen - Laden, ganze Liste, ein Element, ganzes Projekt - und einen fuenften,
// ihn zu leeren. Was hier NICHT steht, ist genauso wichtig: keine Regel, WANN
// geladen oder geleert wird (das entscheiden #197/#226), keine Sortierung, kein
// zweiter Zustandshalter irgendwo sonst im composer.
//
// UND SIE ERSETZT EIN EREIGNIS. Der Vertrag kennt bewusst kein
// `<modul>:geaendert`-Ereignis fuer das Projekt: composer, action-editor und
// vorlagen-editor laufen im SELBEN Renderer-Prozess, ein IPC-Ereignis waere eine
// Reise durch den Main und zurueck, nur um zwei Modulen mitzuteilen, was im selben
// Speicher schon passiert ist. Stattdessen liefert jede Operation ihren neuen Stand
// zurueck, der Aufrufer gibt ihn hier hinein, und `aufSichtGeaendert` verteilt ihn
// prozessintern. Module ausserhalb dieses Ordners bekommen die Setz-Funktionen als
// PARAMETER durchgereicht (die Huelle dafuer ist `ProjektZugang` in
// src/renderer/app-shell/sichten.ts, #197) - sie importieren diese Datei nicht.
//
// ZWEI FEHLER WAEREN TEUER, UND BEIDE SEHEN HARMLOS AUS:
//
// 1. EINE ZWEITE WAHRHEIT. Eine Komponente, die sich "kurz" die Liste merkt, laeuft
//    irgendwann auseinander - der Nutzer sieht dann eine Reihenfolge, die es in
//    project.json nicht gibt, und erst die fertige Ausgabedatei deckt es auf.
//
// 2. AENDERN AN ORT UND STELLE. Wer das Element im Array direkt umschreibt, hat
//    keinen "letzten bestaetigten Stand" mehr, auf den der Rollback aus TK 9.7.3
//    (Fehlerklasse 1) zurueckkehren koennte: Der optimistische Schritt haette die
//    alte Wahrheit bereits ueberschrieben. Deshalb entsteht hier bei JEDER Aenderung
//    ein NEUES Sicht-Objekt, ein NEUES Projekt-Objekt und ein NEUES Listen-Array;
//    ein zuvor mit `holeSicht()` genommener Stand aendert sich nie mit. Genau diese
//    Verwechslung - lebende Eintraege statt Kopien - hat im Prueflauf von M2 eine
//    Garantie lautlos gebrochen.
//
// KEIN AUFFRISCHEN AUS DEM MAIN. Es gibt keinen nebenwirkungsfreien Lese-Kanal fuer
// den aktuellen Projektstand; der einzige Weg zu einem `Project` loest den ganzen
// Oeffnen-Ablauf samt Reconcile aus (#94). Er wird deshalb NUR beim Laden benutzt,
// nie zum Nachziehen. Fuer Operationen, die `Ergebnis<void>` liefern (#42, #43),
// gilt bis zur Klaerung: Ein `ok: true` bestaetigt den optimistisch bereits
// angezeigten Stand - der Main hat ihn ja gerade validiert. Ob ein zusaetzlicher
// Lese-Kanal in den Vertrag gehoert, ist eine Vertragsentscheidung und im
// Abschlussbericht gemeldet.

import type { Project, Listenelement } from '../../shared/contracts/project'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'

export interface Projektsicht {
  projekt: Project | null          // null = noch kein Projekt geladen
  ladefehler: { code: string; meldung: string } | null
}

/**
 * Der gesamte Zustand dieses Moduls - EINE Bindung, kein Feld daran wird je
 * beschrieben.
 *
 * `Object.freeze` ist hier keine Zierde: ES-Module laufen im strict mode, ein
 * `holeSicht().projekt = null` in einer fremden Datei wirft damit sofort, statt die
 * gemeinsame Sicht still umzubiegen. Der Griff ist BEWUSST FLACH und geht nicht in
 * `Project` hinein: Ein tiefes Einfrieren muesste bei jeder Aenderung Assets,
 * Aktionen, Liste und jeden Band-Abschnitt durchlaufen - Aufwand proportional zur
 * Projektgroesse fuer jeden Reglerzug - und wuerde nebenbei Objekte einfrieren, die
 * dem AUFRUFER gehoeren und die er weiterbenutzt. Was diese Datei zusagen kann,
 * sagt sie zu: Sie selbst aendert nichts an Ort und Stelle.
 */
let sicht: Projektsicht = Object.freeze({ projekt: null, ladefehler: null })

/** Die angemeldeten Hoerer in Anmeldereihenfolge. */
const hoererListe: Array<(sicht: Projektsicht) => void> = []

/**
 * Schaltet auf einen neuen Stand um und benachrichtigt danach.
 *
 * ERST setzen, DANN melden - ein Hoerer, der in der Benachrichtigung `holeSicht()`
 * ruft (der Normalfall in einer UI-Anbindung), bekaeme sonst den alten Stand.
 */
function schalteUm(neu: Projektsicht): void {
  sicht = Object.freeze(neu)
  benachrichtige()
}

/**
 * Meldet den aktuellen Stand an alle Hoerer - genau einmal je Hoerer.
 *
 * ZWEI VORKEHRUNGEN, die nach Ueberfluss aussehen und keiner sind:
 *
 * Die KOPIE der Hoererliste: Ein Hoerer darf sich waehrend seiner eigenen
 * Benachrichtigung abmelden (eine UI-Komponente, die auf diese Aenderung hin
 * verschwindet, tut genau das). Ohne Kopie verschoebe das `splice` die Indizes des
 * laufenden Durchgangs, und der naechste Hoerer wuerde uebersprungen.
 *
 * Das try/catch: Ein werfender Hoerer ist ein Fehler in der Oberflaeche, aber er
 * darf weder die uebrigen Hoerer abschneiden noch aus `setzeListe` heraus den
 * optimistischen Schritt zerreissen ("kein `throw` an den Aufrufer"). Der Zustand
 * ist zu diesem Zeitpunkt bereits gueltig gesetzt; verschluckt wird der Fehler
 * nicht, er wird gemeldet.
 */
function benachrichtige(): void {
  for (const hoerer of [...hoererListe]) {
    try {
      hoerer(sicht)
    } catch (fehler) {
      console.error('[composer] Ein Hoerer der Projekt-Sicht hat geworfen.', fehler)
    }
  }
}

/** Lädt ein Projekt über den IPC-Vertrag und macht es zur aktuellen Sicht. */
export async function ladeProjekt(projektId: string): Promise<Ergebnis<Project>> {
  // Die EINZIGE Pruefung, die hier stattfindet - und sie ist keine fachliche: Ob es
  // das Projekt gibt, entscheidet der Main ("Der Main validiert jede eingehende
  // Nutzlast", TK 9.1.1 Punkt 6), und er weist einen leeren Wert auch selbst ab.
  // Abgefangen wird er hier trotzdem, weil ein leerer Wert kein Fachfehler ist,
  // sondern ein Bedienfehler der Oberflaeche - er soll nicht als Antwort des Main
  // erscheinen und keinen Oeffnen-Ablauf samt Reconcile anstossen.
  //
  // `typeof` trotz `string` in der Signatur: Der Wert kommt aus der Oberflaeche und
  // kann dort aus einer ungetypten Quelle stammen.
  if (typeof projektId !== 'string' || projektId.trim() === '') {
    // Die Sicht bleibt VOLLSTAENDIG unberuehrt - kein `ladefehler`, keine
    // Benachrichtigung. Das ist der Unterschied zum abgelehnten Main-Aufruf eine
    // Zeile weiter unten: Dort ist etwas ueber das PROJEKT bekannt geworden, das
    // die Oberflaeche anzeigen soll; hier ist nur ein Aufruf falsch gestellt.
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: 'ladeProjekt braucht eine nicht leere projektId.',
      },
    }
  }

  const ergebnis = await rufeAuf<Project>(KANAELE.project.öffneProjekt, { id: projektId })

  if (ergebnis.ok) {
    schalteUm({ projekt: ergebnis.wert, ladefehler: null })
  } else {
    // Der Code wird UNVERAENDERT uebernommen und nicht umgeschrieben: An ihm haengt
    // echtes Verhalten in der Oberflaeche, und ein eigener Ersatzcode waere eine
    // zweite Deutung desselben Vorfalls.
    //
    // Das bisher geladene Projekt BLEIBT stehen. Ein fehlgeschlagener Ladeversuch
    // ist kein Grund, dem Nutzer das Projekt wegzunehmen, an dem er gerade
    // arbeitet; und "kein Projekt geladen" herzustellen ist ausschliesslich Sache
    // von `leereProjektSicht()`.
    schalteUm({
      projekt: sicht.projekt,
      ladefehler: { code: ergebnis.fehler.code, meldung: ergebnis.fehler.meldung },
    })
  }

  // Durchgereicht, nicht nachgebaut - der Aufrufer sieht genau, was der Main
  // gesagt hat.
  return ergebnis
}

/** Momentaufnahme der Sicht. Der zurückgegebene Wert wird NIE verändert (s. Invarianten). */
export function holeSicht(): Projektsicht {
  // Keine Kopie noetig: Das Objekt wird nie beschrieben, sondern bei jeder Aenderung
  // ERSETZT. Wer es festhaelt, haelt damit automatisch den Stand von damals - genau
  // das, was der Rollback aus TK 9.7.3 braucht.
  return sicht
}

/** Ersetzt die Liste der Sicht vollständig – benutzt für den optimistischen Schritt UND für den
 *  Rollback auf einen zuvor mit holeSicht() genommenen Stand. */
export function setzeListe(liste: Listenelement[]): void {
  const aktuell = sicht.projekt
  if (aktuell === null) {
    console.warn('[composer] setzeListe ohne geladenes Projekt - der Aufruf wird ignoriert.')
    return
  }

  // Die uebergebene Liste wird KOPIERT. Sie stammt aus dem optimistischen Schritt
  // des Aufrufers, der sie sich meist gemerkt hat; ohne Kopie zeigten Aufrufer und
  // Sicht auf dasselbe Array, und der naechste Zug am selben Array veraenderte die
  // Sicht an Ort und Stelle - der Fehler, den die Unveraenderlichkeits-Invariante
  // ausschliesst. Die Elemente selbst werden geteilt: Sie gelten als unveraenderlich
  // und werden ersetzt, nicht umgeschrieben.
  //
  // Kein Mischen, kein Anhaengen, KEINE Sortierung: "Angezeigte Reihenfolge =
  // gerenderte Reihenfolge - keine versteckte Sortierung." (TK 9.7.4) Die
  // Reihenfolge ist die Array-Reihenfolge, ein Ordnungsfeld gibt es nicht
  // (TK 9.11.3).
  schalteUm({ projekt: { ...aktuell, liste: [...liste] }, ladefehler: sicht.ladefehler })
}

/** Ersetzt genau ein Listenelement anhand seiner id durch den vom Store zurückgegebenen Stand. */
export function gleicheElementAb(element: Listenelement): void {
  const aktuell = sicht.projekt
  if (aktuell === null) {
    console.warn('[composer] gleicheElementAb ohne geladenes Projekt - der Aufruf wird ignoriert.')
    return
  }

  // `map` statt Index-Suche und Zuweisung: Es baut ein NEUES Array und laesst das
  // alte in Ruhe, und die Position ergibt sich von selbst - "an derselben Stelle"
  // ist keine Extra-Regel, sondern die Bauform.
  let getroffen = false
  const neueListe = aktuell.liste.map((vorhanden) => {
    if (vorhanden.id !== element.id) return vorhanden
    getroffen = true
    return element
  })

  if (!getroffen) {
    // NICHT anhaengen. Ein Element, das die Sicht nicht kennt, kennt der Store
    // moeglicherweise auch nicht - es still einzubauen erzeugte genau die zweite
    // Wahrheit, gegen die diese Datei existiert. Sichtbar gemacht wird es
    // trotzdem, sonst verschwindet ein Programmierfehler spurlos.
    console.warn(
      `[composer] gleicheElementAb: kein Listenelement mit der id "${element.id}" in der Sicht - ` +
        'der Aufruf wird ignoriert.',
    )
    return
  }

  schalteUm({ projekt: { ...aktuell, liste: neueListe }, ladefehler: sicht.ladefehler })
}

/** Ersetzt das gesamte Projekt (nach dem Laden und nach Operationen, die ein Projekt liefern). */
export function setzeProjekt(projekt: Project): void {
  if (sicht.projekt === null) {
    // Auch hier kein Einstieg in den geladenen Zustand: Der einzige Weg dorthin ist
    // `ladeProjekt`. Sonst gaebe es zwei Stellen, die ein Projekt zum offenen
    // erklaeren - eine davon ohne den Reconcile aus #94, also mit Medien, die es auf
    // der Platte womoeglich nicht mehr gibt.
    console.warn('[composer] setzeProjekt ohne geladenes Projekt - der Aufruf wird ignoriert.')
    return
  }

  // `ladefehler` bleibt, wie er ist. Er gehoert zum LADEN; eine geglueckte Mutation
  // sagt nichts darueber aus, ob der letzte Ladeversuch gelungen ist. Geleert wird
  // er beim naechsten erfolgreichen Laden - oder von `leereProjektSicht()`.
  schalteUm({ projekt, ladefehler: sicht.ladefehler })
}

/** Setzt die Sicht in den Zustand „kein Projekt geladen" zurück: `projekt` und `ladefehler`
 *  werden `null`. Kein Eingang, kein Rückgabewert. Zu rufen, wo ein Projekt aufhört, offen zu
 *  sein, ohne dass ein anderes an seine Stelle tritt (TK 9.7.4). */
export function leereProjektSicht(): void {
  // KEIN Sonderfall fuer "war ohnehin leer", KEINE Warnung und vor allem KEIN
  // Ersatzprojekt: "Ausdruecklich verboten ist die naheliegende Notloesung, statt
  // dessen ein leeres Projekt mit erfundener Kennung in die Sicht zu setzen: Das
  // saehe richtig aus, aber jede folgende Instant-Operation liefe in
  // `nicht_gefunden` (9.1.1), und das Auto-Speichern (9.5.4) legte womoeglich einen
  // Projektordner an, den niemand angelegt hat." (TK 9.7.4)
  //
  // `ladefehler` faellt MIT weg: Der Zustand heisst "kein Projekt geladen", nicht
  // "letztes Laden fehlgeschlagen" - ein stehen gebliebener Fehler beschriebe nach
  // dem Loeschen eines Projekts ein anderes, laengst vergangenes Ereignis.
  //
  // Benachrichtigt wird IMMER, auch wenn schon vorher nichts geladen war. Eine
  // Bedingung "nur wenn sich etwas geaendert hat" braeuchte eine Vergleichsregel,
  // die es hier nicht gibt; ein Aufruf zu viel bei unveraendertem Zustand ist
  // dagegen harmlos.
  //
  // Und diese Datei entscheidet NICHT, WANN geleert wird - kein Abo auf die
  // Warteschlange, keine Ueberwachung eines Projektzustands. Gerufen wird sie von
  // dort, wo ein Projekt aufhoert, offen zu sein (#226 ueber den Zugang aus #197).
  schalteUm({ projekt: null, ladefehler: null })
}

/** Abonnement für Sicht-Änderungen; Rückgabewert ist die Abmelde-Funktion. */
export function aufSichtGeaendert(hoerer: (sicht: Projektsicht) => void): () => void {
  hoererListe.push(hoerer)

  // KEIN sofortiger Erstaufruf mit dem aktuellen Stand: Die Signatur gibt nur die
  // Abmeldung zurueck, und ein Anmelden mit Nebenwirkung waere fuer den Aufrufer
  // nicht zu umgehen. Wer den Stand beim Anmelden braucht, holt ihn mit
  // `holeSicht()` - das ist eine Zeile und laesst die Wahl beim Aufrufer.
  let abgemeldet = false
  return () => {
    // Die Abmeldung ist mehrfach aufrufbar. Ohne die Sperre entfernte ein zweiter
    // Aufruf die Anmeldung eines ANDEREN Abonnenten, der dieselbe Funktion
    // uebergeben hat (bei geteilten Handlern keine Seltenheit) - ein Fehler, der
    // sich als "ein Panel aktualisiert nicht mehr" zeigt, weit weg von der Ursache.
    if (abgemeldet) return
    abgemeldet = true

    const stelle = hoererListe.indexOf(hoerer)
    if (stelle !== -1) hoererListe.splice(stelle, 1)
  }
}
