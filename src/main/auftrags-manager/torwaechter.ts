// GENERIERT aus dem Signaturblock von Issue #59.
// [auftrags-manager] Nächsten Auftrag seriell freigeben
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
// GERUEST-PRUEFSUMME: 366a619a4752fd0e

import { beendeAuftrag } from './beende-auftrag'
import { fuehreAus } from './dispatcher'
import { laufender, naechsterAnstehender } from './q1-warteschlange'
import { haengeJournalEintragAn } from './q4-journal'
import { sendeQueueGeaendert } from './queue-ereignis'
import { pruefeUebergang } from './zustandsuebergang'

import type { AusfuehrungsKontext, HandlerErgebnis } from './dispatcher'
import type { Auftrag } from '../../shared/contracts/auftrag'
import type { JournalEintrag } from '../../shared/contracts/protokoll'

// Fremde Aufrufe - vollstaendige Signaturen, damit hier nichts geraten wird:
//   #54: laufender(): Q1Eintrag | undefined
//        naechsterAnstehender(): Q1Eintrag | undefined
//        Beide liefern den INTERNEN, LEBENDEN Eintrag { auftrag, begonnenAm } - keine
//        Kopie. Genau darauf beruhen die Schritte 4 bis 6: Was hier gesetzt wird, steht
//        danach in Q1, und `laufender()` sieht es beim naechsten Aufruf.
//        `naechsterAnstehender` liefert den ERSTEN Eintrag in Einfuegereihenfolge, also
//        FIFO (TK 9.3.3) - diese Datei sortiert und waehlt nicht selbst aus.
//   #58: pruefeUebergang(von: AuftragStatus, nach: AuftragStatus): Ergebnis<void>
//   #57: haengeJournalEintragAn(eintrag: JournalEintrag)
//          : Promise<Ergebnis<void, QueueFehlercode>>
//   #65: sendeQueueGeaendert(): Promise<void>
//   #60: fuehreAus(auftrag: Auftrag, kontext: AusfuehrungsKontext)
//          : Promise<HandlerErgebnis<string>>
//   #70: beendeAuftrag(auftragId: string, ergebnis: HandlerErgebnis): Promise<void>
//
// ZUM IMPORT VON #70: Die Abhaengigkeit ist gegenseitig - der Torwaechter ruft
// `beendeAuftrag`, wenn ein Handler aufloest, und `beendeAuftrag` ruft am Ende
// `starteNaechsten`. Das ist die im Issue gewollte Richtung, kein Versehen. Beide Module
// benutzen einander erst zur LAUFZEIT, nicht beim Laden; ein Modulzyklus entsteht dadurch
// nicht. #70 vermerkt dasselbe an Ort und Stelle.

export function starteNaechsten(): void {
  // ---------------------------------------------------------------------------------
  // SCHRITTE 1 BIS 6 - DIE GEFAEHRLICHSTE STELLE IN GANZ M2.
  //
  // Bis einschliesslich `auftrag.versuche += 1` steht in diesem Block KEIN `await`,
  // KEIN `.then()` und KEIN Aufruf, der ein Promise zurueckgibt. Wer hier zuerst etwas
  // abwartet und DANACH den Status setzt, oeffnet ein Zeitfenster: In ihm laeuft ein
  // zweiter Aufruf (aus `reiheEin` #61, `wiederhole` #63 oder `beendeAuftrag` #70) durch
  // Schritt 1, sieht `laufender() === undefined` und startet einen zweiten Auftrag.
  // Zwei ffmpeg-Laeufe teilten sich dann T1, und ein `loeschen` liefe parallel zu einem
  // Render, der dasselbe Medium liest. Weil der auftrags-manager der EINZIGE
  // Sperr-Mechanismus des Systems ist (TK 9.3.5), gibt es nichts, was das abfinge.
  //
  // Journal (7), Ereignis (8) und Ausfuehrung (9) stehen deshalb allesamt UNTERHALB des
  // Statuswechsels.
  // ---------------------------------------------------------------------------------

  // SCHRITT 1: Laeuft schon einer? Der Status in Q1 IST das Lock - es gibt daneben
  // keinen Mutex, keine Dateisperre und kein `istBeschaeftigt`-Flag.
  if (laufender() !== undefined) {
    return
  }

  // SCHRITT 2: Der aelteste anstehende. KEINE Priorisierung nach Art, Dauer oder
  // Projekt, kein Vorziehen "kurzer" Auftraege - die im Panel sichtbare Reihenfolge
  // muss die ausgefuehrte sein (Determinismus, TK 9.3.5).
  const eintrag = naechsterAnstehender()
  if (eintrag === undefined) {
    return
  }

  const auftrag = eintrag.auftrag

  // SCHRITT 3: Der Uebergang wird von #58 beurteilt, nicht hier neu formuliert.
  //
  // Uebergeben wird `auftrag.status` und NICHT das Literal 'anstehend': Beides ist
  // dasselbe, weil `naechsterAnstehender` ausschliesslich anstehende Eintraege liefert -
  // aber mit dem Literal koennte diese Pruefung nie ablehnen, und der Fehlerpfad
  // "pruefeUebergang lehnt ab (Programmierfehler)" waere blosse Zierde. So prueft sie
  // wirklich das, was in Q1 steht.
  const uebergang = pruefeUebergang(auftrag.status, 'laeuft')
  if (!uebergang.ok) {
    // NICHT starten, nichts veraendern: kein Statuswechsel, keine Journal-Bewegung, kein
    // Ereignis. Der Auftrag bleibt unveraendert liegen.
    protokolliere(
      `Auftrag ${auftrag.auftragId}: Uebergang ${auftrag.status} -> laeuft abgelehnt ` +
        `(${uebergang.fehler.code}) - nicht gestartet.`,
    )
    return
  }

  // EINE Zeitabfrage, ZWEI Verwendungen: `begonnenAm` (Schritt 5) und die Zeit der
  // Q4-Bewegung `gestartet` (Schritt 7). Zwei getrennte `new Date()` ergaeben zwei
  // minimal verschiedene Werte fuer DASSELBE Ereignis - im Protokoll (Q3, ueber
  // `begonnenAm`) und im Journal (Q4) stuende derselbe Vorgang dann mit zwei Zeiten.
  const startzeit = new Date().toISOString()

  // SCHRITT 4: Das Lock zuschnappen lassen.
  auftrag.status = 'laeuft'

  // SCHRITT 5: am EINTRAG, nicht am Auftrag - `begonnenAm` gehoert dem internen
  // Q1Eintrag (#54); der geteilte Typ `Auftrag` (#16) hat kein solches Feld. #70 liest
  // es von dort in den Q3-Protokolleintrag.
  eintrag.begonnenAm = startzeit

  // SCHRITT 6: `versuche` zaehlt die Anzahl TATSAECHLICH GESTARTETER Ausfuehrungen
  // (TK 9.3.1) und steigt deshalb genau hier - nicht beim Einreihen (#61 setzt 0), nicht
  // beim Wiederholen (#63 zaehlt ausdruecklich nicht mit) und nicht beim Abschluss.
  // Zaehlten Wiederholung und Start beide, stuende nach einem Fehlschlag und einer
  // Wiederholung `versuche = 3` statt 2, und `ProtokollEintrag.versuch` waere unbrauchbar.
  auftrag.versuche += 1

  // SCHRITT 6b (nachgetragen am 13.08.2026, s. Issue-Nachtrag zu #59): `fortschritt` zurueck
  // auf seinen Anfangswert. Ohne diese Zeile traegt ein WIEDERHOLTER Auftrag (#63) noch den
  // Fortschritt des vorigen Versuchs, und die Warteschlangen-Leiste zeigt ihn an, bis der
  // Fachdienst zum ersten Mal meldet - bei einem Render etliche Sekunden lang. Der Nutzer saehe
  // einen Balken, der von 80 % rueckwaerts springt, oder einen, der stillsteht und wie ein
  // Haenger aussieht.
  //
  // Das ist KEINE Fachlogik (nichts wird berechnet, nichts gedeutet) und gehoert genau hierher:
  // an die Stelle, die den Auftrag in den Startzustand versetzt, VOR dem ersten `await`. #70
  // leert `fehler` beim Erfolg mit derselben Begruendung - fuer `fortschritt` tat das bisher
  // niemand.
  auftrag.fortschritt = null

  // ---------------------------------------------------------------------------------
  // AB HIER IST DER START VOLLZOGEN. Was jetzt noch schiefgeht, dreht ihn NICHT zurueck.
  // ---------------------------------------------------------------------------------

  // SCHRITT 7: Q4 ist "rein diagnostisch" (TK 9.3). Der Aufruf wird NICHT abgewartet -
  // ein Diagnose-Schreibvorgang darf den Start eines Auftrags nicht um eine Plattenrunde
  // verzoegern -, bekommt aber ein `.catch`: ein floating Promise ohne Fang ist verboten.
  schreibeBewegung({
    zeit: startzeit,
    auftragId: auftrag.auftragId,
    bewegung: 'gestartet',
    // NULL UND KEINE ZAHL - eigene Festlegung, weil das Issue dazu schweigt und #57 den
    // Wert `null` ausdruecklich zulaesst ("nicht jede Bewegung hat einen sinnvollen Platz
    // in der Schlange"). Der gerade gestartete Auftrag steht in `alleQ1()` per
    // Konstruktion an erster Stelle - der laufende kommt dort zuerst -, eine hier
    // eingetragene `1` waere also in JEDER Zeile dieselbe und taeuschte eine Aussage vor,
    // die sie nicht macht. Der Platz VOR dem Start waere derselbe Wert, denn gestartet
    // wird immer der aelteste anstehende.
    position: null,
  })

  // SCHRITT 8: Ereignis - ebenfalls ohne `await`. `starteNaechsten` ist synchron (`void`)
  // und hat niemanden, dem es antworten muesste; ein `await` ist hier gar nicht moeglich.
  //
  // ABWEICHUNG VOM VERMERK IN #65 ("der Vertrag verlangt vom Aufrufer ausdruecklich das
  // Abwarten"), gemeldet am Dateiende: Dieses Issue schreibt das Nicht-Abwarten
  // ausdruecklich vor, und das Issue schlaegt den Vermerk. Folge ist allein, dass die
  // REIHENFOLGE zweier dicht aufeinanderfolgender Meldungen nicht zugesagt ist; die
  // Nutzlast ist jedes Mal der vollstaendige Stand, keine Differenz.
  melde()

  // SCHRITT 9 und 10: anstossen, nicht abwarten.
  begleiteAusfuehrung(auftrag)
}
// Ablauf: laufender()? -> naechsterAnstehender()? -> pruefeUebergang -> status='laeuft',
//         begonnenAm, versuche+1 (alles OHNE await) -> Q4 `gestartet` -> queue:geaendert
//         -> fuehreAus (abgesichert) -> beendeAuftrag mit dem HandlerErgebnis.

// -------------------------------------------------------------------------------------------
// Die drei Nebenwege - jeder ohne Rueckwirkung auf den bereits vollzogenen Start
// -------------------------------------------------------------------------------------------

/**
 * Q4-Bewegung schreiben und einen Fehlschlag NUR vermerken.
 *
 * #57 verlangt das ausdruecklich von seinen Aufrufern ("Dass die Aufrufer bei
 * `speicher_fehler` NICHT abbrechen, ist ihre Pflicht"). Q4 ist rein diagnostisch; der
 * Auftrag LAEUFT, wenn diese Zeile ausgefuehrt wird, und kein Diagnose-Ausfall dreht einen
 * gesetzten Status zurueck.
 *
 * KEINE Stoerungsmeldung an die Oberflaeche (#65): Der Nutzer kann an einer verlorenen
 * Journal-Zeile nichts tun, sein Auftrag laeuft, und die Warteschlangen-Leiste mit einer
 * Meldung ueber eine Diagnosedatei zu belegen waere Laerm. `entferne` (#62) haelt es bei
 * derselben Bewegung genauso.
 */
function schreibeBewegung(eintrag: JournalEintrag): void {
  void haengeJournalEintragAn(eintrag)
    .then((geschrieben) => {
      if (!geschrieben.ok) {
        protokolliere(
          `Q4-Bewegung "gestartet" fuer Auftrag ${eintrag.auftragId} nicht geschrieben ` +
            `(${geschrieben.fehler.code}): ${geschrieben.fehler.meldung}`,
        )
      }
    })
    .catch((ursache: unknown) => {
      protokolliere('haengeJournalEintragAn (#57) hat entgegen seinem Vertrag geworfen', ursache)
    })
}

/**
 * Das Ereignis ausloesen - ohne `await`, mit `.catch`.
 *
 * #65 faengt nach seinem Vertrag selbst und wirft nicht; der Fang gilt dem Fall, dass es
 * das eines Tages nicht mehr tut. Eine gescheiterte BENACHRICHTIGUNG darf einen laufenden
 * Auftrag nicht umbringen - das waere die Umkehrung dessen, wofuer das Ereignis da ist.
 */
function melde(): void {
  void sendeQueueGeaendert().catch((ursache: unknown) => {
    protokolliere('sendeQueueGeaendert (#65) hat entgegen seinem Vertrag geworfen', ursache)
  })
}

/**
 * Der Kontext des Laufs (#60): die Kennung und der Weg, Fortschritt zu melden.
 *
 * `meldeFortschritt` schreibt AUSSCHLIESSLICH `auftrag.fortschritt` - am lebenden Objekt
 * aus Q1, das `holeStand` (#64) und `queue:geaendert` (#65) ohnehin herausgeben; die
 * Oberflaeche sieht den neuen Wert also ohne ein weiteres Ereignis. Hier wird NICHTS
 * gedrosselt, gepuffert, begrenzt oder gemeldet: Drosseln ist Sache des meldenden
 * Fachdienstes (TK 9.2.7), und ein Ereignis je Fortschrittsschritt machte aus dem
 * diskreten Kanal `queue:geaendert` einen Strom.
 *
 * Der Wert wird auch nicht gedeutet: `number | null` steht im Vertrag, und was ein
 * Fachdienst dort meldet, gehoert ihm. #60 huellt den Aufruf ausserdem bereits in einen
 * eigenen Schutz, damit eine Ausnahme aus dieser Zeile keinen zwanzig Minuten laufenden
 * Render beendet.
 */
function kontextFuer(auftrag: Auftrag): AusfuehrungsKontext {
  return {
    auftragId: auftrag.auftragId,
    meldeFortschritt: (prozent: number | null): void => {
      auftrag.fortschritt = prozent
    },
  }
}

/**
 * Schritt 9 und 10 - die Absicherung, die verhindert, dass ein Auftrag auf `laeuft` haengen
 * bleibt.
 *
 * `fuehreAus` darf laut #60 NIEMALS werfen und faengt jede Ausnahme selbst; diese Huelle
 * kommt trotzdem obendrauf, weil der Schaden sonst total waere: Ein Auftrag, der auf
 * `laeuft` stehen bleibt, blockiert den EINZIGEN Sperr-Mechanismus des Systems, und die
 * Schlange stuende still, bis die App neu gestartet wird.
 *
 * Sie bewertet nichts und wiederholt nichts. Sie sorgt allein dafuer, dass der Auftrag
 * einen Abschluss bekommt - mit dem generischen `unbekannter_fehler` (TK 9.1.1), ohne
 * eigenen Q3-Eintrag, ohne Umschreiben eines fremden Codes und ohne neuen Code.
 *
 * Das `await` FANGT BEIDE FAELLE in einem Zug: Der Aufruf selbst steht im `try` (synchroner
 * `throw`), und `await` leitet eine Abweisung des Promise in denselben `catch`. Ein
 * `return fuehreAus(...)` liefe am `try` vorbei und faenge ausgerechnet den haeufigeren der
 * beiden Faelle nicht.
 */
async function fuehreAusUndSchliesseAb(
  auftrag: Auftrag,
  kontext: AusfuehrungsKontext,
): Promise<void> {
  let ergebnis: HandlerErgebnis<string>

  try {
    ergebnis = await fuehreAus(auftrag, kontext)
  } catch (ursache) {
    protokolliere(
      `fuehreAus (#60) hat fuer Auftrag ${auftrag.auftragId} entgegen seinem Vertrag geworfen`,
      ursache,
    )
    ergebnis = {
      status: 'fehlgeschlagen',
      fehler: {
        code: 'unbekannter_fehler',
        // Aufbereiteter Klartext, KEIN Stacktrace und keine rohe Ausnahme-Meldung: "Eine
        // rohe Exception-Meldung wird nie zum Code." (TK 9.1.1) Die Auftragsart stammt aus
        // dem eigenen Bestand (`AuftragArt`), nie aus einer Nutzereingabe.
        meldung:
          `Der Auftrag "${auftrag.art}" ist unerwartet fehlgeschlagen. ` +
          'Einzelheiten stehen im Protokoll des Hauptprozesses.',
      },
    }
  }

  // UNVERAENDERT weiter: derselbe Ausgang, den der Fachdienst gemeldet hat - kein
  // Umschreiben des Codes, kein Abschneiden von `daten`, keine Bewertung. Ob daraus
  // Q3-Eintrag, Q2-Pflege und die Freigabe des naechsten Auftrags werden, entscheidet #70.
  await beendeAuftrag(auftrag.auftragId, ergebnis)
}

/**
 * Der Anstoss - bewusst ohne Rueckgabewert und ohne Abwarten.
 *
 * `starteNaechsten` wartet nicht auf den Auftrag; sie stoesst ihn an (TK 9.1.1: Trennung
 * von Aufruf-Ergebnis und Auftrags-Ergebnis). Der Ausgang kommt spaeter ueber
 * `beendeAuftrag` und den Auftrags-Zustand.
 */
function begleiteAusfuehrung(auftrag: Auftrag): void {
  void fuehreAusUndSchliesseAb(auftrag, kontextFuer(auftrag)).catch((ursache: unknown) => {
    protokolliere(
      `beendeAuftrag (#70) hat fuer Auftrag ${auftrag.auftragId} entgegen seinem Vertrag ` +
        'geworfen - der Auftrag bleibt auf "laeuft"',
      ursache,
    )
  })
}

/**
 * "intern protokolliert" - dieselbe vorlaeufige Loesung wie im dispatcher (#60), im
 * Q4-Journal (#57) und in `beende-auftrag` (#70).
 *
 * Diese Funktion hat keinen Aufrufer, dem sie etwas melden koennte (`void`, keine
 * Ergebnis-Huelle). Ohne diese Zeile waeren ausgerechnet die Faelle, in denen jemand seinen
 * Vertrag bricht, die unauffindbarsten.
 */
function protokolliere(stelle: string, ursache?: unknown): void {
  if (ursache === undefined) {
    console.error(`[auftrags-manager] torwaechter: ${stelle}`)
    return
  }
  console.error(`[auftrags-manager] torwaechter: ${stelle}:`, ursache)
}

// NICHT HIER, UND GEMELDET:
//
// 1. KEIN AUSLOESER IN DIESER DATEI. Kein `setInterval`, kein Polling, kein Selbstaufruf.
//    Gerufen wird `starteNaechsten` allein aus `reiheEin` (#61), `wiederhole` (#63) und
//    `beendeAuftrag` (#70). Heute ruft sie im ganzen Baum genau EINE Stelle: #70
//    (`beende-auftrag.ts`, Schritt 7) - geprueft mit grep ueber `src/`. #61 und #63 sind
//    noch werfende Ruempfe; ohne sie startet ein frisch eingereihter Auftrag in einer
//    leeren Schlange nicht von selbst. Das ist keine Luecke dieser Datei, sondern der
//    offene Rumpf der beiden Issues.
//
// 2. WIDERSPRUCH ZU #65, ENTSCHIEDEN ZUGUNSTEN DIESES ISSUES: `queue-ereignis.ts` vermerkt
//    am Dateiende, der Vertrag verlange vom Aufrufer das Abwarten von
//    `sendeQueueGeaendert` (nur so ist die Reihenfolge mehrerer Meldungen zugesagt).
//    Schritt 8 dieses Issues verbietet das Abwarten ausdruecklich - `starteNaechsten` ist
//    synchron und KANN nicht abwarten. Gebaut ist der Issue-Text. Praktische Folge: Fiele
//    ein Start mit einem Abschluss zeitlich zusammen, koennten die beiden Meldungen in
//    vertauschter Reihenfolge bei den Hoerern ankommen. Beide tragen den VOLLSTAENDIGEN
//    Stand (#64), keine Differenz - die Anzeige waere also hoechstens einen Wimpernschlag
//    alt, nie falsch zusammengesetzt.
//
// 3. KEIN ZURUECKSETZEN VON `fortschritt` UND `fehler` BEIM START. Die Schritte 4 bis 6
//    nennen `status`, `begonnenAm` und `versuche` - mehr nicht, und "keine Fachlogik hier"
//    ist Invariante. Folge bei einer Wiederholung (#63): Bis zur ersten Fortschrittsmeldung
//    des Fachdienstes zeigt das Panel den Fortschritt des VORIGEN Versuchs, und `fehler`
//    traegt noch dessen Grund. `beendeAuftrag` (#70) leert `fehler` beim Erfolg
//    ausdruecklich; fuer `fortschritt` tut das heute niemand. Gemeldet, nicht hier gefixt.
//
// 4. KEINE STOERUNGSMELDUNG (#65), WENN #70 WIRFT. Wirft `beendeAuftrag` entgegen seinem
//    Vertrag, bleibt der Auftrag auf `laeuft` und die Schlange steht fuer den Rest der
//    Sitzung - sichtbar wird das nur im Protokoll des Hauptprozesses. Eine Meldung an die
//    Oberflaeche steht weder in der als vollstaendig gefuehrten Fehlerpfad-Tabelle dieses
//    Issues, noch waere der Fall erreichbar, solange #70 seine drei Fangstellen behaelt
//    (Q3, Q2 und `starteNaechsten` sind dort einzeln umschlossen). Gemeldet, damit die
//    Entscheidung nicht unbemerkt hier faellt.
