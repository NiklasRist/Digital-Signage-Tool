// GENERIERT aus dem Signaturblock von Issue #66.
// [auftrags-manager] pendingDeletions in Q2 führen
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
// GERUEST-PRUEFSUMME: 4c0ab794b52ef5e0
//
// ZUR ABSCHALTZEILE IN ZEILE 1 - SIE IST BEIM FUELLEN DES RUMPFES ZU ENTFERNEN:
// Die Parameter und Importe dieser Datei SIND der Vertrag; der Rumpf wirft aber
// nur, benutzt sie also nicht (@typescript-eslint/no-unused-vars). Die Zeile
// gehoert zum Geruest, nicht zum fertigen Code. Wer den Rumpf fuellt und sie
// stehen laesst, macht die Regel in DIESER Datei dauerhaft blind - unauffaellig,
// weil dann nichts mehr rot ist.
//
// Gesetzt hat sie kein Mensch, sondern tools/geruest.py: Es fragt nach dem
// Schreiben EINMAL ESLint, welche Dateien no-unused-vars tatsaechlich melden, und
// versieht nur diese. Deshalb steht sie nirgends ueberfluessig herum.
//
// ERLEDIGT (13.08.2026): Die Abschaltzeile ist mit dem Fuellen der Rumpfe entfernt;
// alle Parameter werden jetzt benutzt. Der Absatz darueber bleibt als Beleg stehen.

import { aenderePendingDeletions, holeQ2Stand, ladeQ2 } from './q2-wiederholung'

import type { Ergebnis, GenerischerFehlercode } from '../../shared/contracts/ergebnis'
import type { PendingDeletion } from './q2-wiederholung'      // Typ und Dateiform aus #55
import type { QueueFehlercode } from './schreibe-queue-json'  // = 'speicher_fehler' (#69)
                                                              // NUR als Typ – #69 wird aus dieser
                                                              // Datei NICHT aufgerufen

// Fremde Aufrufe – vollstaendige Signaturen. #55 ist der EINZIGE Kenner der Q2-Dateiform;
// der Zugriff auf queue-retry.json laeuft ausschliesslich ueber diese Funktionen:
//   #55: ladeQ2(projektId: string): Promise<Ergebnis<Q2Datei, QueueFehlercode>>
//   #55: holeQ2Stand(): { projektId: string; datei: Q2Datei } | null   // synchron, nur RAM
//   #55: interface Q2Datei { schemaVersion: number; auftraege: Auftrag[];
//                              pendingDeletions: PendingDeletion[] }
//   #55: interface PendingDeletion { dateiname: string; vermerktAm: string }
//   #55: aenderePendingDeletions(
//              projektId: string,
//              aendere: (liste: PendingDeletion[]) => PendingDeletion[],
//          ): Promise<Ergebnis<void, QueueFehlercode>>
//          // die EINZIGE Schreib-Tuer fuer pendingDeletions: wendet `aendere` nur auf diese Liste
//          // an, laesst `auftraege` unveraendert und schreibt die Datei

export async function holePendingDeletions(projektId: string): Promise<Ergebnis<PendingDeletion[], QueueFehlercode>> {
  if (!istGefuellterText(projektId)) {
    return fehler('ungueltige_eingabe', 'holePendingDeletions wurde ohne Projekt-ID aufgerufen.')
  }

  try {
    const gelesen = await liesVorgemerkte(projektId)
    if (!gelesen.ok) {
      // Durchgereicht, KEIN Rueckfall auf eine leere Liste: Eine unlesbare oder fremdversionierte
      // queue-retry.json saehe sonst aus wie ein Projekt ohne offene Loeschungen. Der Reconcile
      // raeumte nichts weg, und der belegte Platz - bei Videos schnell mehrere Gigabyte - wuerde
      // nie wieder frei, ohne dass irgendetwas darauf hinweist.
      return gelesen
    }
    // Eine eigene Liste nach draussen: Wer sie sortiert oder filtert, darf damit nicht den Stand
    // beruehren, den #55 haelt. Dass #55 heute schon kopiert, ist dessen Innenleben und steht in
    // keiner der beiden Signaturen.
    return { ok: true, wert: [...gelesen.wert] }
  } catch (ursache) {
    return fehler('unbekannter_fehler', `holePendingDeletions abgebrochen: ${text(ursache)}`)
  }
}

export async function merkePendingDeletion(projektId: string, dateiname: string): Promise<Ergebnis<void, QueueFehlercode>> {
  const abgewiesen = pruefeEingaben('merkePendingDeletion', projektId, dateiname)
  if (abgewiesen !== null) {
    return abgewiesen
  }

  try {
    const bisher = await liesVorgemerkte(projektId)
    if (!bisher.ok) {
      return bisher
    }
    if (istVorgemerkt(bisher.wert, dateiname)) {
      // SCHON VERMERKT - und deshalb ohne Schreibvorgang. Nicht nur aus Sparsamkeit: Ein
      // Durchreichen an #55 schriebe die Datei neu und setzte damit ein `vermerktAm` auf die
      // Platte, das zwar gleich bliebe, aber jeden Schreibfehler (volle Platte) an einer Stelle
      // melden koennte, an der fachlich gar nichts zu tun ist.
      return { ok: true, wert: undefined }
    }

    const vermerk: PendingDeletion = { dateiname, vermerktAm: new Date().toISOString() }
    return await aenderePendingDeletions(projektId, (liste) =>
      // Die Doppelung der Pruefung ist Absicht: Massgeblich ist die Liste, die #55 hier
      // uebergibt, nicht die weiter oben gelesene. Ein zweiter Eintrag entstuende sonst, sobald
      // zwischen Lesen und Schreiben etwas dazukommt.
      istVorgemerkt(liste, dateiname) ? liste : [...liste, vermerk],
    )
  } catch (ursache) {
    return fehler('unbekannter_fehler', `merkePendingDeletion abgebrochen: ${text(ursache)}`)
  }
}
// idempotent: derselbe dateiname erzeugt keinen zweiten Eintrag
// schreibt ausschliesslich ueber aenderePendingDeletions (#55)

export async function streichePendingDeletion(projektId: string, dateiname: string): Promise<Ergebnis<void, QueueFehlercode>> {
  const abgewiesen = pruefeEingaben('streichePendingDeletion', projektId, dateiname)
  if (abgewiesen !== null) {
    return abgewiesen
  }

  try {
    const bisher = await liesVorgemerkte(projektId)
    if (!bisher.ok) {
      return bisher
    }
    if (!istVorgemerkt(bisher.wert, dateiname)) {
      // KEIN TREFFER, KEIN FEHLER UND KEIN SCHREIBVORGANG. Der Regelfall ist die geglueckte
      // Loeschung, die nie offen war - der Reconcile streicht "vorsichtshalber". Ein Fehlercode
      // machte daraus einen gescheiterten Aufraeumlauf; ein Schreibvorgang legte die
      // queue-retry.json in einem Projekt, das nie eine hatte, ueberhaupt erst an
      // (schreibeQueueDatei legt den Ordner mit an). Dieselbe Ueberlegung wie bei streicheAusQ2.
      return { ok: true, wert: undefined }
    }

    return await aenderePendingDeletions(projektId, (liste) =>
      liste.filter((vorhanden) => vorhanden.dateiname !== dateiname),
    )
  } catch (ursache) {
    return fehler('unbekannter_fehler', `streichePendingDeletion abgebrochen: ${text(ursache)}`)
  }
}
// IDEMPOTENT: ohne Treffer { ok: true, wert: undefined } – NICHT nicht_gefunden
// schreibt ausschliesslich ueber aenderePendingDeletions (#55)

// MAIN-INTERN: kein IPC-Kanal, keine Registrierung im ipc-gateway, kein Eintrag in kanaele.ts

// ---------------------------------------------------------------------------------------------
// Innere Bausteine
// ---------------------------------------------------------------------------------------------

/**
 * Die einzige Lesestelle dieser Datei - und sie haelt keinen eigenen Zustand.
 *
 * Gehoert der von #55 gehaltene Stand zum gefragten Projekt, ist er die Quelle: Er ist stets
 * mindestens so aktuell wie die Platte (#55 aendert erst den Speicher, dann die Datei), und ein
 * Dateizugriff je Aufruf machte aus jedem Streichen ein Lesen. Andernfalls wird ueber ladeQ2
 * geladen - das setzt bei #55 zugleich den Stand auf dieses Projekt.
 *
 * Eine fehlende queue-retry.json ist dabei kein Fehler: #55 liefert dafuer eine leere, gueltige
 * Q2 und legt nichts an.
 */
async function liesVorgemerkte(projektId: string): Promise<Ergebnis<PendingDeletion[], QueueFehlercode>> {
  const gehalten = holeQ2Stand()
  if (gehalten !== null && gehalten.projektId === projektId) {
    return { ok: true, wert: gehalten.datei.pendingDeletions }
  }

  const geladen = await ladeQ2(projektId)
  if (!geladen.ok) {
    // Unveraendert weiter: kein eigener Code, keine eigene Meldung. Jede Uebersetzung auf dem Weg
    // ist eine Stelle, an der aus "Platte voll" etwas anderes wird (NFA-02).
    return geladen
  }
  return { ok: true, wert: geladen.wert.pendingDeletions }
}

function istVorgemerkt(liste: readonly PendingDeletion[], dateiname: string): boolean {
  return liste.some((vorhanden) => vorhanden.dateiname === dateiname)
}

/**
 * Ein `dateiname`, der mehr ist als ein Name.
 *
 * Verboten sind Trennzeichen beider Betriebssysteme, `..` und ein vorangestellter Laufwerks-
 * buchstabe. Grund ist nicht nur die Sicherheit: Gespeichert wird laut TK 9.4.8 Punkt 1 der
 * `dateiname` in der Form `<uuid>.<ext>`, aufgeloest wird spaeter per
 * `path.join(projektMediaDir, dateiname)`. Ein Pfadanteil in der Q2-Datei wandert mit dem
 * Projektordner mit und zeigt auf einem anderen Laufwerk oder Betriebssystem ins Leere - und der
 * Reconcile des media-service loeschte im schlimmsten Fall etwas ausserhalb des Medienordners.
 *
 * Geprueft wird auf `..` an JEDER Stelle: Die geforderte Form enthaelt nie zwei aufeinander
 * folgende Punkte, ein Aussortieren nach Pfadsegmenten waere hier bereits eine Pfadauslegung.
 */
const KEIN_BLOSSER_DATEINAME = /[/\\]|\.\.|^[A-Za-z]:/

/** Gibt die fertige Fehlerhuelle zurueck - oder `null`, wenn beide Eingaben in Ordnung sind. */
function pruefeEingaben(
  aufruf: string,
  projektId: string,
  dateiname: string,
): { ok: false; fehler: { code: QueueFehlercode | GenerischerFehlercode; meldung: string } } | null {
  if (!istGefuellterText(projektId)) {
    return fehler('ungueltige_eingabe', `${aufruf} wurde ohne Projekt-ID aufgerufen.`)
  }
  if (!istGefuellterText(dateiname)) {
    return fehler('ungueltige_eingabe', `${aufruf} wurde ohne Dateinamen aufgerufen.`)
  }
  if (KEIN_BLOSSER_DATEINAME.test(dateiname)) {
    return fehler(
      'ungueltige_eingabe',
      `"${dateiname}" ist kein blosser Dateiname. Vorgemerkt wird ausschliesslich die Form ` +
        `<uuid>.<ext> ohne Verzeichnisanteil - kein "/", kein "\\", kein "..", kein absoluter Pfad.`,
    )
  }
  return null
}

function istGefuellterText(wert: unknown): wert is string {
  return typeof wert === 'string' && wert.length > 0
}

function text(ursache: unknown): string {
  return ursache instanceof Error ? ursache.message : String(ursache)
}

/**
 * Die Fehlerseite der Huelle - ohne Nutztyp, damit sie fuer `Ergebnis<PendingDeletion[], …>`
 * genauso passt wie fuer `Ergebnis<void, …>`. Kein `throw` (TK 9.1.1).
 */
function fehler(
  code: QueueFehlercode | GenerischerFehlercode,
  meldung: string,
): { ok: false; fehler: { code: QueueFehlercode | GenerischerFehlercode; meldung: string } } {
  return { ok: false, fehler: { code, meldung } }
}

// NICHT HIER, UND GEMELDET:
//
// 1. HIER WIRD NICHTS GELOESCHT. Kein fs, kein unlink, kein Retry, kein Timer - ausgefuehrt wird
//    eine offene Loeschung allein vom Reconcile des media-service (TK 9.4.7, M3). Diese Datei
//    verwahrt.
//
// 2. KEINE GRENZE UND KEIN VERFALL. Keine Hoechstzahl, kein Hoechstalter, keine Versuchszaehlung.
//    Ein Eintrag verschwindet ausschliesslich ueber streichePendingDeletion.
//
// 3. KEIN AUFTRAG. Kein reiheEin, kein Auftrag-Objekt. Ein wieder eingereihter Loesch-Auftrag
//    scheiterte deterministisch mit asset_nicht_gefunden, weil sein erster Schritt (D1-Eintrag
//    entfernen) beim Loeschen bereits erledigt wurde (TK 9.3).
//
// 4. KEIN EIGENER ZUSTAND UND KEINE UNTEILBARKEIT. Der Q2-Stand gehoert #55; zwischen dem Lesen
//    hier und dem Schreiben in #55 liegt eine Luecke, in der ein anderer Aufrufer die Liste
//    aendern koennte. Getragen wird das von der `aendere`-Funktion, die auf der von #55
//    uebergebenen Liste arbeitet - ein Duplikat oder ein wiederauferstandener Eintrag kann daraus
//    nicht entstehen. Verloren gehen kann dabei hoechstens die Entscheidung "nicht schreiben"
//    (dann wird einmal zuviel dieselbe Datei geschrieben). Ein eigener Mutex waere das vom
//    STOPP-Block verbotene zweite Lock.
//
// 5. KEINE PRUEFUNG DER projektId ALS PFADSEGMENT. Die Fehlertabelle des Issues verlangt "leer
//    oder kein String"; die Segmentpruefung von #49 ist bewusst nicht exportiert. Dieselbe Lage
//    wie in #55, dort im Schluss-Vermerk Punkt 3 festgehalten.
