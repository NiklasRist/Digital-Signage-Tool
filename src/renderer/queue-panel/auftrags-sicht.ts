// GENERIERT aus dem Signaturblock von Issue #205.
// [queue-panel] Auftrags-Sicht: erst holen, dann abonnieren
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
// GERUEST-PRUEFSUMME: 3762e7604c63018a

import type { Auftrag } from '../../shared/contracts/auftrag'
import type { GenerischerFehlercode } from '../../shared/contracts/ergebnis'
import { KANAELE } from '../../shared/contracts/kanaele'
import { abonniere } from '../ipc-client/ereignisse'
import { rufeAuf } from '../ipc-client/rufe-auf'

/**
 * Der Zustand der Auftrags-Sicht. `unbekannt` ist der ANFANGSZUSTAND und bedeutet
 * „noch nicht geholt" – ausdruecklich NICHT „keine Auftraege".
 */
export type AuftragsSicht =
  | { zustand: 'unbekannt' }
  | { zustand: 'geladen'; auftraege: Auftrag[] }
  | { zustand: 'fehler'; code: string; meldung: string }

export const ANFANGS_SICHT: AuftragsSicht = { zustand: 'unbekannt' }

// Der Code fuer die beiden Faelle, die von der Gegenseite KEINEN Code mitbringen:
// ein werfendes `rufeAuf` (Bruecke fehlt, Kanal unbekannt - Fehlerpfad-Tabelle des
// Issues) und die Stoerungsmeldung auf `queue:stoerung` (sie traegt laut Nachtrag vom
// 13.08.2026 nur Klartext, s. `queue-ereignis.ts` #65: `meldeQueueStoerung(meldung: string)`).
//
// Bewusst der GENERISCHE Code aus dem geteilten Vertrag und KEIN hier erfundener
// (etwa `queue_stoerung`): Fehlercodes entstehen dort, wo der Fehler entsteht. Ein
// Code, den kein Vertrag kennt, waere eine stille Absprache mit #211 (Fehlertexte) -
// und #211 fuehrt mit `BEKANNTE_FEHLERCODES` ausdruecklich eine Vollstaendigkeits-
// pruefung, die dann an einer Erfindung dieser Datei haengen wuerde.
//
// Die Typangabe ist kein Schmuck: Sie laesst nur die drei Codes zu, die es wirklich
// gibt, und macht einen Tippfehler zum Uebersetzungsfehler.
const CODE_OHNE_HERKUNFT: GenerischerFehlercode = 'unbekannter_fehler'

/**
 * Baut die Auftrags-Sicht auf: holt EINMAL den vollen Stand und abonniert ERST DANACH
 * `queue:geaendert`. Jeder neue Stand geht ueber `setzeSicht` hinaus.
 *
 * Kehrt SYNCHRON zurueck und liefert die Abbau-Funktion. Der Aufruf der Abbau-Funktion
 * meldet ein bereits bestehendes Abonnement ab und verhindert, dass ein noch laufendes
 * `holeStand` danach noch abonniert oder `setzeSicht` ruft.
 */
export function baueAuftragsSichtAuf(
  setzeSicht: (sicht: AuftragsSicht) => void,
): () => void {
  // Die interne Merkflagge aus Ablauf-Punkt 5. Sie ist der Grund, warum diese Funktion
  // synchron zurueckkehren KANN: Der Aufrufer haelt die Abbau-Funktion ab der ersten
  // Zeile in der Hand, auch waehrend das Holen noch laeuft.
  let abgebaut = false

  // Gesammelte Abmelde-Funktionen der Abonnements. Eine Liste und kein einzelnes Feld,
  // weil zwei Kanaele abonniert werden (s. `abonniereJetzt`) - und weil ein werfendes
  // `abonniere` beim zweiten nicht die Abmeldung des ersten verlieren darf.
  const abmeldungen: Array<() => void> = []

  /**
   * Ablauf-Punkt 4: Abonnieren - und zwar ERST HIER, nach der Antwort auf das Holen,
   * und in BEIDEN Faellen aus Punkt 3 (auch nach `ok: false`; ohne Abonnement bliebe
   * die Leiste bis zum Neuaufbau tot).
   *
   * Die umgekehrte Reihenfolge waere falsch: Die Antwort auf das Holen koennte einen
   * AELTEREN Stand tragen als ein zwischenzeitlich empfangenes Ereignis und es damit
   * ueberschreiben (TK 9.1.1). Deshalb gibt es in dieser Datei genau EINE Stelle, an
   * der abonniert wird, und sie liegt hinter dem `await`.
   */
  const abonniereJetzt = (): void => {
    // Zwischen Antwort und dieser Zeile liegt kein `await` mehr; die Pruefung steht
    // trotzdem hier, damit `abonniereJetzt` fuer sich genommen sicher ist.
    if (abgebaut) {
      return
    }

    // Kanalnamen ausschliesslich aus der Registry (#25) - in dieser Datei steht kein
    // einziges `queue:`-Literal.
    merkeAbonnement(() =>
      abonniere<Auftrag[]>(KANAELE.queue.geaendert, (nutzlast) => {
        if (abgebaut) {
          return
        }
        // Das Array geht UNVERAENDERT hinaus: nicht sortiert, nicht gefiltert, nicht
        // gekappt, nicht umkopiert. Zusammenfuehrung von Q1/Q2, Deduplizierung und
        // Reihenfolge sind Vertrag von #64 und im Ereignis (#65) identisch; eine
        // zweite Sortierregel hier zeigte beim Oeffnen etwas anderes als nach dem
        // naechsten Push.
        //
        // Und es wird NICHTS aus dem Ereignis abgeleitet - kein terminaler Uebergang,
        // keine Merkliste gesehener Kennungen (TK 9.1.1 Punkt 5; das ist #199).
        setzeSicht({ zustand: 'geladen', auftraege: nutzlast })
      }),
    )

    // Nachtrag vom 13.08.2026: `queue:stoerung` traegt die Stoerungen, die der Ablauf
    // im Main bewusst UEBERLEBT und die der Nutzer sonst nirgends saehe - ein nicht
    // ermittelbarer Stand (#65), ein misslungenes Schreiben von Q3/Q2 (#70), haengende
    // Loeschungen beim Projektoeffnen. Schweigen ist von „nichts hat sich geaendert"
    // nicht zu unterscheiden; ohne diesen Kanal fror die Leiste stumm auf einem alten
    // Stand ein.
    //
    // Die Meldung fuehrt in DENSELBEN Fehlerzustand wie ein fehlgeschlagener Erstabruf -
    // es entsteht ausdruecklich KEIN zweiter Anzeigeweg. Sie kommt als Klartext an und
    // wird hier NICHT uebersetzt; das bleibt Sache von #211.
    merkeAbonnement(() =>
      abonniere<string>(KANAELE.queue.stoerung, (meldung) => {
        if (abgebaut) {
          return
        }
        // Der Stand wird NICHT geleert: `{ zustand: 'geladen', auftraege: [] }` traege
        // die Aussage „die Warteschlange ist leer" und verdeckte einen laufenden
        // Render. Diese Datei setzt daher nie eine leere Liste - weder hier noch sonst
        // irgendwo.
        setzeSicht({ zustand: 'fehler', code: CODE_OHNE_HERKUNFT, meldung })
      }),
    )
  }

  /**
   * Fehlerpfad „`abonniere` wirft beim Anmelden": abfangen, die bereits gesetzte Sicht
   * bleibt stehen, die Abbau-Funktion bleibt aufrufbar und ist wirkungslos - und vor
   * allem: kein `throw` nach aussen. Diese Datei wird aus einer React-Komponente heraus
   * benutzt; eine Ausnahme naehme die ganze Leiste vom Bildschirm - die einzige Stelle,
   * an der laufende Auftraege ueberhaupt erkennbar sind (FA-16).
   *
   * Je Kanal einzeln gekapselt, damit ein Fehlschlag beim zweiten Abonnement das erste
   * nicht mitnimmt.
   */
  function merkeAbonnement(anmelden: () => () => void): void {
    try {
      abmeldungen.push(anmelden())
    } catch (ursache) {
      // Kein Meldeweg vorhanden (die Sicht gehoert dem Holen, und ein Ueberschreiben
      // waere der zweite Anzeigeweg, den der Nachtrag ausschliesst) - deshalb dieselbe
      // Form, die #151 und der Main bereits verwenden.
      console.error(
        '[queue-panel] auftrags-sicht: Anmelden eines Abonnements ist fehlgeschlagen:',
        ursache,
      )
    }
  }

  // Ablauf-Punkt 1: Beim Betreten wird `setzeSicht` NICHT gerufen. Der Anfangszustand
  // `ANFANGS_SICHT` gehoert dem Aufrufer, und `{ zustand: 'geladen', auftraege: [] }`
  // waere die Behauptung „die Schlange ist leer", die diese Datei jetzt nicht belegen
  // kann. Beim Start liegen typischerweise Fehlschlaege aus Q2 vor (persistent,
  // TK 9.3.5) - ein gestern gescheiterter Render darf nicht unsichtbar sein (FA-17).
  void (async () => {
    let sicht: AuftragsSicht

    try {
      // Ablauf-Punkt 2: GENAU EIN Aufruf. Kein Wiederholen, kein Intervall, kein
      // zweiter Beschaffungsweg - der Stand kommt einmal aus dem Holen und danach
      // ausschliesslich aus dem Ereignis.
      const ergebnis = await rufeAuf<Auftrag[]>(KANAELE.queue.holeStand)

      // Ablauf-Punkt 3. Der Code wird UNVERAENDERT durchgereicht; uebersetzt wird er
      // in #211, nicht hier.
      sicht = ergebnis.ok
        ? { zustand: 'geladen', auftraege: ergebnis.wert }
        : {
            zustand: 'fehler',
            code: ergebnis.fehler.code,
            meldung: ergebnis.fehler.meldung,
          }
    } catch (ursache) {
      // `rufeAuf` wirft, wenn die Preload-Bruecke fehlt, und lehnt ab, wenn kein
      // Handler auf dem Kanal sitzt (#24 verpackt bewusst nicht in eine Huelle). Beides
      // ist ein Verdrahtungsfehler, kein Fachfehler - er bekommt den generischen Code
      // und muss trotzdem sichtbar werden.
      sicht = {
        zustand: 'fehler',
        code: CODE_OHNE_HERKUNFT,
        meldung: `Der Stand der Warteschlange konnte nicht abgerufen werden: ${grundText(ursache)}`,
      }
    }

    // Ablauf-Punkt 5: Ist die Merkflagge gesetzt, wenn die Antwort eintrifft, geschieht
    // NICHTS mehr - kein `setzeSicht`, kein Abonnement.
    if (abgebaut) {
      return
    }

    try {
      setzeSicht(sicht)
    } catch (ursache) {
      // Ein werfender Aufrufer darf das Abonnieren nicht verhindern: Sonst haette ein
      // einmaliger Anzeigefehler beim Aufbau zur Folge, dass die Leiste fuer den Rest
      // der Sitzung nie wieder etwas erfaehrt. #151 behandelt einen werfenden Hoerer
      // auf dem Ereignisweg genauso - hier steht dieselbe Zusage fuer den Holweg.
      console.error(
        '[queue-panel] auftrags-sicht: setzeSicht hat beim Uebernehmen des Standes geworfen:',
        ursache,
      )
    }

    abonniereJetzt()
  })()

  return () => {
    // Mehrfaches Aufrufen ist wirkungslos: kein zweites Abmelden, kein Fehler.
    // React-Aufraeumfunktionen laufen in der Entwicklung doppelt (Strict-Mode).
    if (abgebaut) {
      return
    }
    abgebaut = true

    // Jedes Abonnement wird abgemeldet (Invariante 2): Wer sich beim Aufbau anmeldet
    // und beim Abbau nicht abmeldet, hat nach zwanzig Auf-/Abbauten zwanzig Zuhoerer -
    // der aelteste schreibt zuletzt und ueberschreibt damit den aktuellen Stand mit
    // einem alten. Das sieht nicht wie ein Fehler aus, sondern wie eine Leiste, die
    // „manchmal hinterherhinkt".
    const zuMelden = abmeldungen.splice(0, abmeldungen.length)
    for (const abmelden of zuMelden) {
      try {
        abmelden()
      } catch (ursache) {
        // Auch der Abbau wirft nicht nach aussen - er laeuft in einer React-
        // Aufraeumfunktion, und eine Ausnahme dort reisst die Demontage der ganzen
        // Leiste mit. Die uebrigen Abmeldungen laufen trotzdem.
        console.error(
          '[queue-panel] auftrags-sicht: Abmelden eines Abonnements ist fehlgeschlagen:',
          ursache,
        )
      }
    }
  }
}

/** Lesbarer Grund fuer die Meldung - ohne Annahme darueber, was geworfen wurde. */
function grundText(ursache: unknown): string {
  return ursache instanceof Error ? ursache.message : String(ursache)
}
