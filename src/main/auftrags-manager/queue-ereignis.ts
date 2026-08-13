// GENERIERT aus dem Signaturblock von Issue #65.
// [auftrags-manager] Ereignis queue:geaendert senden
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
// GERUEST-PRUEFSUMME: 66b95cafc28fc09b

import { holeStand } from './hole-stand'

import type { Auftrag } from '../../shared/contracts/auftrag'
import type { Ergebnis } from '../../shared/contracts/ergebnis'

// Fremder Aufruf - vollstaendige Signatur, damit hier nichts geraten wird:
//   #64: holeStand(): Promise<Ergebnis<Auftrag[]>>
//        Der zusammengefuehrte Stand aus Q1 und Q2: dedupliziert ueber auftragId
//        (Q1 gewinnt), laufender zuerst, dann anstehende in FIFO-Reihenfolge, dann
//        die Fehlschlaege nach erstelltAm absteigend. Ohne geoeffnetes Projekt
//        KEIN Fehler, sondern die (moeglicherweise leere) Liste - Leseoperationen
//        melden, was da ist (#64, ENTSCHIEDEN am 13.08.2026). Q1 wird dort NICHT
//        auf das geoeffnete Projekt gefiltert.
//
// DIESE DATEI BAUT DIE ZUSAMMENFUEHRUNG NICHT NACH. Panel-Oeffnen (holeStand) und
// Push muessen denselben Stand zeigen; zwei Umsetzungen derselben Regel driften
// auseinander, und dann zeigt das Panel beim Oeffnen etwas anderes als beim Push.
// Deshalb wird hier nicht sortiert, nicht gefiltert und nicht dedupliziert.

/**
 * Die Hoerer, jeder in einer eigenen Huelle.
 *
 * WARUM DIE HUELLE UND KEIN `Set<Hoerer>` - dieselbe Begruendung wie in #47: Ein Set haelt jede
 * Funktion nur EINMAL. Meldet sich dieselbe Funktion zweimal an (zwei Verdrahtungen, ein
 * Neuaufbau des Fensters), traegt das Set einen Eintrag, und die erste Abmeldung naehme dem
 * zweiten Anmelder lautlos seine Meldungen weg. Mit der Huelle ist jede Anmeldung ein eigener
 * Eintrag, und jede Abmelde-Funktion entfernt genau ihren eigenen.
 */
const hoerende = new Set<{ hoerer: (auftraege: Auftrag[]) => void }>()

/**
 * Die Hoerer fuer den Stoerfall, nach demselben Huellen-Muster und aus demselben Grund.
 *
 * NACHGETRAGEN am 13.08.2026 (Entscheidung des Users), s. Vermerk am Dateiende: Ein nicht
 * ermittelbarer Stand wurde vorher VERSCHWIEGEN, und Schweigen ist fuer den Empfaenger von
 * "nichts hat sich geaendert" nicht zu unterscheiden - die Anzeige fror unbemerkt ein.
 */
const stoerungsHoerende = new Set<{ hoerer: (meldung: string) => void }>()

export async function sendeQueueGeaendert(): Promise<void> {
  let stand: Ergebnis<Auftrag[]>
  try {
    stand = await holeStand()
  } catch (ursache) {
    // `holeStand` (#64) faengt selbst und meldet Fehler in der Huelle; nach seinem Vertrag
    // wirft es nicht. Der Fang steht trotzdem hier, weil dieses Promise MITTEN in einer
    // Warteschlangen-Operation abgewartet wird (#59, #61, #62, #63, #70): Eine Abweisung
    // braeche dort den Ablauf ab - eine gescheiterte BENACHRICHTIGUNG wuerde damit den
    // Auftrag selbst umbringen. Das ist genau die Umkehrung dessen, wofuer dieses Ereignis
    // da ist. Verschluckt wird hier deshalb bewusst - s. Vermerk am Dateiende.
    protokolliere("holeStand (#64) hat entgegen seinem Vertrag geworfen", ursache)
    meldeQueueStoerung("Der Stand der Warteschlange konnte nicht ermittelt werden.")
    return
  }

  if (!stand.ok) {
    // KEIN Array-Ereignis in diesem Fall - aber seit dem 13.08.2026 auch kein Schweigen mehr:
    // Die Stoerung geht ueber den EIGENEN Meldeweg hinaus (Entscheidung des Users).
    //
    // Der im Issue benannte Fall "kein Projekt geoeffnet" landet hier NICHT MEHR: #64 hat am
    // 13.08.2026 entschieden, dass Leseoperationen dafuer keinen Fehler melden, sondern die
    // (leere) Liste liefern - die geforderte "dieselbe Antwort wie in #64" ist also der
    // ok-Zweig unten, der ein leeres Array meldet. Uebrig bleibt allein der Auffangzweig von
    // #64, also ein UNERWARTETER Fehler.
    //
    // WARUM KEIN LEERES ARRAY: Ein leeres Array ist eine AUSSAGE - "die Warteschlange ist
    // leer". Waehrend ein Render laeuft, waere das eine Falschmeldung, die FA-16 ("erkennbar
    // ist jederzeit, welcher Auftrag laeuft") ins Gegenteil verkehrt, und das Panel raeumte
    // seine Liste leer. Der zuletzt gemeldete Stand bleibt deshalb stehen - hoechstens
    // veraltet, nicht falsch.
    //
    // WARUM TROTZDEM EINE MELDUNG, und zwar ueber einen ZWEITEN Weg: Bliebe es beim blossen
    // Stehenlassen, waere der Stoerfall von "es hat sich nichts geaendert" nicht zu
    // unterscheiden, und die Leiste froere unbemerkt ein. Der Fehler reist dabei NICHT in der
    // Array-Nutzlast mit (ein Ereignis hat keinen Fehlerkanal, TK 9.1.1 Punkte 2 und 5, und
    // "nacktes Array, keine Huelle" ist in sechs Issues zitiert) - er bekommt seinen eigenen
    // Hoerer-Satz. Uebertragen wird KLARTEXT, kein Code: Der Empfaenger zeigt ihn an, er
    // verzweigt nicht darauf.
    protokolliere(`Stand nicht ermittelbar (${stand.fehler.code})`, stand.fehler.meldung)
    meldeQueueStoerung(`Der Stand der Warteschlange konnte nicht ermittelt werden: ${stand.fehler.meldung}`)
    return
  }

  // Ueber eine MOMENTAUFNAHME der Menge: Ein Hoerer darf sich waehrend der Zustellung an- oder
  // abmelden, ohne die laufende Schleife zu stoeren. Wer sich waehrend der Runde ANMELDET,
  // bekommt sie nicht mehr - richtig so, denn `stand` wurde vor seiner Anmeldung ermittelt;
  // die naechste Meldung erreicht ihn.
  for (const eintrag of [...hoerende]) {
    // Die Momentaufnahme allein genuegt nicht: Meldet ein Hoerer waehrend der Runde einen
    // ANDEREN ab (oder sich selbst, bei mehreren Anmeldungen), stuende dieser noch in der
    // Kopie. Die Zusage "nach der Abmeldung keine weitere Meldung" gilt aber ab dem Aufruf der
    // Abmelde-Funktion, nicht ab der naechsten Runde - in #71 haengt an einem Hoerer eine
    // Fensterreferenz, die beim Schliessen des Fensters abgemeldet wird und danach nicht mehr
    // angesprochen werden darf.
    if (!hoerende.has(eintrag)) {
      continue
    }
    try {
      eintrag.hoerer(stand.wert)
    } catch (ursache) {
      // Gefangen (Festlegung 5 des Issues): Ein Hoerer, der wirft, darf weder die uebrigen um
      // ihre Meldung bringen noch ueber den `await` der Aufrufer die Warteschlange
      // durcheinanderbringen. Ein Fehler in der ANZEIGE ist kein Fehler des Auftrags.
      // Verschluckt wird er trotzdem nicht ganz: Ohne die Zeile waere ein dauerhaft kaputter
      // Empfaenger von aussen nicht von "es gibt nichts Neues" zu unterscheiden.
      protokolliere("Ein Hoerer hat beim Melden geworfen", ursache)
    }
  }

  // ALLE HOERER BEKOMMEN DASSELBE ARRAY, keine Kopie je Hoerer. Eine Kopie waere hier eine
  // halbe Zusage: #64 gibt ausdruecklich die LEBENDEN Auftrag-Objekte heraus (damit der
  // Fortschritt eines laufenden Renders im Panel aktuell ist), ein Hoerer, der etwas
  // veraendern wollte, kaeme also ueber die Elemente ohnehin an Q1 heran. Der einzige Hoerer
  // laut Plan (#71) reicht die Liste ueber die Prozessgrenze weiter, wo sie kopiert wird.
}
// Ermittelt den Stand über holeStand() (#64) und meldet ihn allen registrierten Hörern.
// Nutzlast ist Auftrag[] – derselbe zusammengeführte, deduplizierte und sortierte Stand.
// KEINE Ergebnis-Hülle, KEIN Endzustand.

export function aufQueueGeaendert(
  hoerer: (auftraege: Auftrag[]) => void,
): () => void {
  const eintrag = { hoerer }
  hoerende.add(eintrag)
  // Mehrfaches Abmelden ist harmlos: `delete` auf einen bereits entfernten Eintrag tut nichts.
  return () => {
    hoerende.delete(eintrag)
  }
}
// registriert einen MAIN-INTERNEN Hörer; Rückgabewert ist die Abmelde-Funktion

export function aufQueueStoerung(hoerer: (meldung: string) => void): () => void {
  const eintrag = { hoerer }
  stoerungsHoerende.add(eintrag)
  return () => {
    stoerungsHoerende.delete(eintrag)
  }
}
// registriert einen MAIN-INTERNEN Hörer für den Fall, dass der Stand NICHT ermittelt werden
// konnte; Rückgabewert ist die Abmelde-Funktion.

/**
 * Zustellung der Stoerungsmeldung - dieselbe Disziplin wie beim Zustands-Push, und aus
 * denselben Gruenden: Momentaufnahme der Menge, Pruefung auf zwischenzeitliche Abmeldung vor
 * JEDEM Aufruf (an einem Hoerer haengt in #71 eine Fensterreferenz), und jeder Hoerer einzeln
 * abgesichert.
 *
 * Der Rueckgabetyp ist bewusst `void` und nicht `Promise<void>`: Diese Funktion wird aus einem
 * Zweig gerufen, der ohnehin gleich `return`t, und ein zweites `await` mitten im Stoerfall
 * verlaengerte nur die Zeit, in der die aufrufende Warteschlangen-Operation haengt.
 */
export function meldeQueueStoerung(meldung: string): void {
  for (const eintrag of [...stoerungsHoerende]) {
    if (!stoerungsHoerende.has(eintrag)) {
      continue
    }
    try {
      eintrag.hoerer(meldung)
    } catch (ursache) {
      // Wie beim Zustands-Push: Ein werfender Empfaenger darf die uebrigen nicht mitreissen -
      // und schon gar nicht darf ein Fehler in der STOERUNGSMELDUNG die Operation umbringen,
      // die gerade ohnehin in Schwierigkeiten steckt.
      protokolliere("Ein Stoerungs-Hoerer hat beim Melden geworfen", ursache)
    }
  }
}

/**
 * Die drei Stellen, an denen diese Datei etwas faengt, hinterlassen eine Spur - in der Form,
 * die `dispatcher.ts` in diesem Modul bereits verwendet.
 *
 * Ein Ereignis hat keinen Fehlerkanal (TK 9.1.1 Punkte 2 und 5), und ausbleiben darf die
 * Benachrichtigung der uebrigen Hoerer erst recht nicht. Damit bleibt als einzige Alternative
 * zum stillen Verschlucken diese Zeile: Ohne sie waeren genau die Faelle, in denen jemand
 * seinen Vertrag bricht, die unauffindbarsten.
 */
function protokolliere(stelle: string, ursache: unknown): void {
  console.error(`[auftrags-manager] queue-ereignis: ${stelle}:`, ursache)
}

// NICHT HIER, UND GEMELDET:
//
// 1. KEIN WEG ZUM RENDERER. Diese Datei kennt weder Fenster noch Kanalnamen; sie meldet
//    main-intern. Den Uebergang auf den IPC-Kanal baut #71 (ipc-verdrahtung.ts), das sich
//    hier als Hoerer anmeldet - genau EIN Ort mit Fensterreferenz. Seit dem 13.08.2026 gilt
//    das fuer BEIDE Ereignisse: #71 meldet sich auch ueber `aufQueueStoerung` an und gibt
//    die Meldung auf `queue:standFehler` weiter (im Issue nachgetragen, ebenso in #205, das
//    sie im Warteschlangen-Panel anzeigt). NICHT hier einen zweiten Sendeweg nachruesten.
//
// 2. KEIN AUSLOESER. `sendeQueueGeaendert` ruft in dieser Datei niemand. Die Ausloeser sind
//    die Zustandsaenderungen selbst: #59 (Freigabe), #61/#62/#63 (Einreihen, Abbrechen,
//    Wiederholen) und #70 (Abschluss). Heute ruft sie im ganzen Baum noch KEINE Stelle
//    (geprueft mit grep ueber src/) - das ist erwartbar, weil diese Rumpfe noch offen sind.
//
// 3. KEINE DROSSELUNG - am 13.08.2026 ENTSCHIEDEN, die STOPP-Frage des Issues ist damit
//    beantwortet. Der Vertrag, den das Issue dafuer heranzieht (TK 9.2.7), regelt die
//    Drosselung von FORTSCHRITTS-Ereignissen; jedes Issue, das ihn zitiert, meint den Kanal
//    `render:fortschritt` (#160, #178, #191, #208, #157). Nachgeprueft ueber alle 329 Issues.
//    `queue:geaendert` ist etwas anderes: Es meldet DISKRETE Lebenslauf-Uebergaenge eines
//    Auftrags - einreihen, starten, abschliessen, entfernen, wiederholen -, keinen Strom.
//    Wo nichts stroemt, gibt es nichts zu drosseln.
//    ACHTUNG, frueherer Vermerk an dieser Stelle war FALSCH: Er verwies die Frage an
//    #177/#178. Die gehoeren zum Render-Fortschritt und haben mit diesem Kanal nichts zu tun.
//    Sollte je eine Haeufung auftreten (etwa beim Wiederholen vieler Fehlschlaege auf
//    einmal), wird sie im ANZEIGENDEN Modul zusammengefasst - genau so sieht es #151 vor
//    ("Wer drosseln will, tut es beim Sender oder im anzeigenden Modul").
//    Ein Zeitfilter HIER braeche ausserdem die Zusage, dass ein abgewartetes
//    `sendeQueueGeaendert` die Hoerer erreicht hat, wenn sein Promise erfuellt ist.
//
// 4. KEINE REIHENFOLGE-SICHERUNG UEBER MEHRERE GLEICHZEITIGE AUFRUFE. Wer abwartet, bekommt
//    die Reihenfolge (der Stand wird ermittelt, dann wird gemeldet, dann erfuellt sich das
//    Promise). Wer NICHT abwartet, hat sie nicht zugesagt.
//
//    KORRIGIERT am 13.08.2026: Hier stand, "der Vertrag verlangt vom Aufrufer ausdruecklich das
//    Abwarten". Das war FALSCH und widersprach #59. Der Torwaechter ist SYNCHRON
//    (`starteNaechsten(): void`) und kann gar nicht abwarten; sein Schritt 8 verbietet es sogar
//    ausdruecklich, weil ein `await` an dieser Stelle das Zeitfenster oeffnete, in dem ein
//    zweiter Auftrag startet. Aufgefallen beim Bau von #59, dessen Agent den Widerspruch
//    gemeldet statt umgangen hat.
//
//    WAS DARAUS FOLGT, UND WARUM ES HARMLOS IST: Fallen Start und Abschluss zeitlich zusammen,
//    koennen zwei Meldungen in vertauschter Reihenfolge ankommen. Beide tragen aber den
//    VOLLSTAENDIGEN Stand aus `holeStand` (#64), keine Differenz und kein Teilstueck - die
//    Anzeige waere also hoechstens einen Wimpernschlag alt, nie falsch zusammengesetzt. Eine
//    eigene Warteschlange fuer Meldungen waere dagegen ein zweiter Serialisierer neben dem
//    Torwaechter, und der ist laut TK 9.3 der einzige.
