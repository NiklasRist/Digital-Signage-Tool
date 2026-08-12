// GENERIERT aus dem Signaturblock von Issue #47.
// [project-store] Auto-Speichern: Entprellung, Sofort-Flush, Ereignis bei Fehler
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
// GERUEST-PRUEFSUMME: ec08c24d5645ef42
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

import { holeAktivesProjekt } from './aktives-projekt'
import { mitD1Lock } from './d1-lock'
import { schreibeProjekt } from './schreibe-projekt'

// Fremde Aufrufe - vollstaendige Signaturen, damit hier nichts geraten wird:
//   #32:  mitD1Lock<T>(aktion: () => Promise<T>): Promise<T>
//         // fuehrt aktion() garantiert seriell aus (FIFO, prozessintern, KEINE Datei-Sperre).
//         // Der kritische Abschnitt darf selbst NICHT erneut mitD1Lock aufrufen
//         // (Deadlock-Gefahr) - deshalb nimmt sofortFlush das Lock NICHT.
//   #46:  schreibeProjekt(projekt: Project): Promise<Ergebnis<void, ProjectStoreFehlercode>>
//         // schreibt project.json atomar (Temp + Rename) mit .bak und schemaVersion.
//         // "Wer schreibeProjekt AUSSERHALB von mitD1Lock ruft, hat keine Serialisierung"
//         // (#46, woertlich) - die Datei nimmt selbst KEIN Lock.
//   #192: holeAktivesProjekt(): Project | null
//         // das aktuell geoeffnete Projekt als LEBENDEN Stand (dieselbe Objektreferenz, die
//         // die Instant-Operationen mutieren), kein Projekt offen -> null. SYNCHRON, NIMMT
//         // KEIN LOCK, WIRFT NIE. Heute noch ein werfender Rumpf (M6) - dagegen zu bauen ist
//         // Absicht des Geruests, nachgebaut wird hier nichts.

import type { Ergebnis, GenerischerFehlercode } from '../../shared/contracts/ergebnis'
import type { ProjectStoreFehlercode } from './assets'            // #72
import type { Project } from '../../shared/contracts/project'
export type AutoSpeichernEreignis =
  | { typ: "gespeichert" }
  | { typ: "fehler"; code: ProjectStoreFehlercode | GenerischerFehlercode }
// KEINE Ergebnis<T>-Hülle: „Ereignisse (Main → Renderer) tragen ebenfalls keine Hülle" (TK 9.1.1)
// Kanalname (an ipc-gateway zu übergeben, M2/später): "project:autoSpeichernStatus"
// ("<modul>:<ereignis>", TK 9.1.1)

/**
 * Die Entprellung. TK 9.5.4 gibt eine SPANNE vor ("entprellt 3-5 s"), keine Zahl; gewaehlt ist
 * die Mitte.
 *
 * WARUM DIESELBEN 4000 ms WIE IM `vorlagen-store` (#98, dort woertlich "4000 ms nach der LETZTEN
 * entprellten Aenderung"): Beide Speicher liegen fuer den Nutzer nebeneinander - er bearbeitet
 * eine Vorlage und schiebt danach ein Element in der Liste. Zwei verschiedene Wartezeiten waeren
 * an keiner Stelle sichtbar begruendet, wuerden aber jede Fehlersuche ("wann steht es auf der
 * Platte?") verdoppeln. BEWUSST NICHT von dort importiert: Das waere eine Modulgrenze fuer eine
 * Zahl, und beide Werte duerfen sich unabhaengig aendern (gleiche Begruendung wie bei den
 * Wiederhol-Wartezeiten in #46/#31).
 */
const ENTPRELLUNG_MS = 4000

/**
 * Abstand zwischen zwei automatischen Wiederholversuchen nach einem `speicher_fehler`.
 *
 * FESTER Abstand, KEIN exponentielles Backoff, KEINE Obergrenze - und das ist eine Abwaegung,
 * keine Beilaeufigkeit:
 *
 * 1. KEIN BACKOFF, WEIL DIE WIEDERHOLUNG UNBEGRENZT IST. Die Fehlerpfad-Tabelle des Issues legt
 *    fest: "Wiederholung laeuft weiter, bis Erfolg oder App-Ende". Eine wachsende Wartezeit
 *    haette nach einer Stunde Abstaende von Minuten - und genau dann trifft sie den Fall, den TK
 *    9.5.4 als den haeufigen benennt: "volle Platte, abgezogener USB-Datentraeger mit dem
 *    Datenort - kann der Nutzer in EINER MINUTE beheben, und dann muss er NICHTS verlieren".
 *    Nach der Behebung darf der Hinweis "nicht gespeichert" nicht noch Minuten stehenbleiben.
 * 2. DIE VORUEBERGEHENDEN FEHLER SIND EINE EBENE TIEFER SCHON ABGEFANGEN. `schreibeProjekt` (#46)
 *    wiederholt bei EPERM/EBUSY selbst mit 100/200/400/800 ms - das ist die Ebene, auf die ein
 *    Backoff gehoert (Virenscanner, offenes Lese-Handle). Was hier oben ankommt, ist bereits die
 *    dauerhafte Ursache; sie verschwindet nicht schneller, wenn man laenger wartet, und nicht
 *    langsamer, wenn man alle 5 s nachsieht.
 * 3. DER PREIS IST MESSBAR KLEIN. Ein Versuch alle 5 s auf eine JSON-Datei von wenigen Kilobyte
 *    ist keine Last; er scheitert im Fehlerfall ohnehin frueh (mkdir bzw. copyFile).
 *
 * NICHT VOM VERTRAG GEDECKT: TK 9.5.4 verlangt "automatischer Wiederholversuch" und nennt weder
 * Intervall noch Obergrenze; der STOPP-Block des Issues verbietet ausdruecklich, das still
 * festzulegen. Der Wert steht hier, damit die Invariante ueberhaupt erfuellt ist - er gehoert
 * bestaetigt, nicht geerbt. S. Bericht/STOPP.
 */
const WIEDERHOLUNG_MS = 5000

/**
 * Der Stand, der noch auf die Platte muss - oder `null`, wenn nichts aussteht.
 *
 * Das ist eine REFERENZ auf das lebende Projekt, keine Kopie: `holeAktivesProjekt` (#192) gibt
 * ausdruecklich "dieselbe Objektreferenz, die die Instant-Operationen mutieren" heraus, und die
 * Instant-Operationen (#33-#45) reichen genau dieses Objekt an `planeAutoSpeicherung` weiter.
 * Deshalb schreibt der Timer beim Ablaufen automatisch den NEUESTEN Stand - eine Kopie wuerde
 * dagegen den Stand vom Beginn der Entprellung festhalten und alles verlieren, was der Nutzer in
 * den 4 s danach noch getan hat.
 */
let vorgemerkt: Project | null = null

/**
 * Zaehlt die Aenderungsmeldungen. Er beantwortet die eine Frage, die sich waehrend eines
 * laufenden Schreibvorgangs stellt: Ist der Stand, der gerade geschrieben wurde, noch der
 * aktuelle?
 *
 * WARUM NICHT EINFACH DIE OBJEKTREFERENZ VERGLEICHEN: Es ist waehrend der ganzen Sitzung
 * DASSELBE Objekt (s. o.) - ein Referenzvergleich waere immer wahr und wuerde `vorgemerkt`
 * loeschen, obwohl waehrend des Schreibens eine neue Aenderung dazukam. Deren Timer liefe dann
 * ins Leere ("nichts vorgemerkt"), und die Aenderung stuende bis zur naechsten Bearbeitung nicht
 * auf der Platte. Der Zaehler unterscheidet die beiden Faelle, die die Referenz nicht
 * unterscheiden kann.
 */
let standZaehler = 0

/** Der EINE ausstehende Schreib-Termin - Entprellung und Wiederholung teilen ihn sich. */
let timer: ReturnType<typeof setTimeout> | null = null

/**
 * Steht der Hinweis "nicht gespeichert" gerade? Nur dann meldet ein Erfolg `{ typ: "gespeichert" }`.
 *
 * So verlangt es das Issue ("danach feuert aufAutoSpeichernEreignis mit { typ: 'gespeichert' },
 * falls zuvor ein Fehler-Zustand aktiv war"). Der Sinn: Das Ereignis dient dem Verschwinden des
 * Hinweises (TK 9.5.4), nicht der Erfolgsmeldung - ein "gespeichert" alle paar Sekunden waere
 * Rauschen auf einem Kanal, der genau ein Signal transportieren soll.
 */
let fehlerAktiv = false

/**
 * Die Hoerer, jeder in einer eigenen Huelle.
 *
 * WARUM DIE HUELLE UND KEIN `Set<Hoerer>`: Ein Set haelt jede Funktion nur EINMAL. Meldet sich
 * dieselbe Funktion zweimal an (zwei Verdrahtungen, ein Neuaufbau des Fensters), traegt das Set
 * einen Eintrag - und die erste Abmeldung nimmt dem zweiten Anmelder lautlos seine Meldungen weg.
 * Mit der Huelle ist jede Anmeldung ein eigener Eintrag, und jede Abmelde-Funktion entfernt genau
 * ihren eigenen.
 */
const hoerende = new Set<{ hoerer: (ereignis: AutoSpeichernEreignis) => void }>()

export function planeAutoSpeicherung(projekt: Project): void {
  vorgemerkt = projekt
  standZaehler += 1
  planeTermin(ENTPRELLUNG_MS)
}
// merkt projekt als zu speichernde, aktuelle Version des aktiven Projekts vor; (re-)startet den
// 3-5s-Entprellungstimer; KEIN Rückgabewert, da reine Terminplanung nicht fehlschlagen kann

export async function sofortFlush(projekt: Project): Promise<Ergebnis<void, ProjectStoreFehlercode>> {
  // Der Timer wird ZUERST abgebrochen, nicht am Ende: Zwischen hier und dem Ende liegt der
  // gesamte Schreibvorgang. Liefe der Termin waehrenddessen ab, stuende ein zweiter Schreibversuch
  // in der Lock-Schlange, der unmittelbar nach diesem hier dasselbe noch einmal schriebe.
  brichTerminAb()
  const standBeimStart = standZaehler

  let ergebnis: Ergebnis<void, ProjectStoreFehlercode>
  try {
    ergebnis = await schreibeProjekt(projekt)
  } catch (ursache) {
    // `schreibeProjekt` (#46) meldet Fehler in der Huelle und wirft nach seinem Vertrag nicht.
    // Der Fang steht trotzdem hier, weil diese Funktion auch AUS EINEM TIMER heraus laeuft
    // (planeTermin): Eine Abweisung haette dort keinen Empfaenger und wuerde als unbehandelte
    // Promise-Abweisung im Main-Prozess landen - sichtbar hoechstens in einer Konsole, die beim
    // Kunden niemand sieht. Fehler reisen in der Huelle, nie als Ausnahme (ergebnis.ts).
    ergebnis = {
      ok: false,
      fehler: {
        code: 'unbekannter_fehler',
        meldung: `Auto-Speichern abgebrochen: ${text(ursache)}`,
      },
    }
  }

  if (ergebnis.ok) {
    // Nur abhaken, wenn waehrend des Schreibens NICHTS dazugekommen ist. Sonst bleibt der neue
    // Stand vorgemerkt und der von `planeAutoSpeicherung` gesetzte Termin schreibt ihn.
    if (standZaehler === standBeimStart) {
      vorgemerkt = null
    }
    if (fehlerAktiv) {
      fehlerAktiv = false
      melde({ typ: 'gespeichert' })
    }
    return ergebnis
  }

  // KEIN ROLLBACK, KEIN VERWERFEN: "die Aenderungen bleiben im Speicher (kein Rollback, kein
  // Arbeitsverlust)" (TK 9.5.4). Der Stand bleibt vorgemerkt, damit die Wiederholung ihn hat -
  // und zwar auch dann, wenn dieser Aufruf gar nicht aus der Entprellung kam (ein Handler-Flush
  // findet `vorgemerkt` moeglicherweise leer vor).
  if (standZaehler === standBeimStart) {
    vorgemerkt = projekt
  }
  fehlerAktiv = true
  melde({ typ: 'fehler', code: ergebnis.fehler.code })

  // WIEDERHOLT WIRD NUR BEI `speicher_fehler`. Das ist der Code, den TK 9.5.4 und die
  // Fehlerpfad-Tabelle des Issues meinen (Platte voll, Rechte, Datei gesperrt) - eine Ursache,
  // die der Nutzer behebt, waehrend die App laeuft. Die uebrigen Codes koennen das nicht:
  // `ungueltige_eingabe` (nicht serialisierbares Projekt, unbrauchbare ID) faellt beim naechsten
  // Versuch mit DEMSELBEN Eingang identisch aus - eine endlose Schleife, die alle 5 s dasselbe
  // Fehler-Ereignis feuert und den Nutzer mit einem Hinweis beschaeftigt, den kein Warten
  // aufloest. Gemeldet wird auch dieser Fall (nichts wird verschluckt), und die naechste
  // Aenderung versucht es ueber die Entprellung ohnehin erneut.
  //
  // Der Termin-Test verhindert, dass eine waehrend des Schreibens eingegangene Aenderung ihren
  // kuerzeren Entprellungstermin gegen den laengeren Wiederholtermin eintauscht.
  if (ergebnis.fehler.code === 'speicher_fehler' && timer === null) {
    planeTermin(WIEDERHOLUNG_MS)
  }
  return ergebnis
}
// bricht einen laufenden Entprellungstimer ab und schreibt projekt sofort via schreibeProjekt
// (#46); MUSS von der aufrufenden Stelle innerhalb von mitD1Lock (#32) ausgeführt werden;
// wird in VIER Fällen aufgerufen (TK 9.5.4):
//   (1) als ERSTER SCHRITT im render- bzw. export-Handler (#189/#190) - also NACH dem
//       Statuswechsel anstehend -> laeuft und BEVOR der Handler arbeitet; NICHT beim
//       Einreihen und NICHT im Torwaechter (#59): dessen Auswahl- und Statuswechsel-
//       Abschnitt ist bewusst synchron, ein await darin braeche die serielle Invariante;
//   (2) bei Projektwechsel (öffneProjekt, #34);
//   (3) beim Beenden der App (Aufrufer wartet das zurückgegebene Promise ab, bevor die App
//       tatsächlich schließt);
//   (4) am Ende jedes Auftrags, der D1 verändert hat (Import, Löschen - TK 9.4.5/9.4.6).
// DIESE Datei ruft sich nicht selbst - sie stellt sofortFlush bereit, die Ausloeser sitzen
// bei den vier genannten Stellen.

export async function flushBeimBeenden(): Promise<Ergebnis<void, ProjectStoreFehlercode>> {
  // Das Lock liegt AUSSEN und das Holen des Standes INNEN - genau so verlangt es die Signatur,
  // und darin liegt der ganze Zweck dieser Funktion: Ein ausserhalb des Locks gelesenes Projekt
  // koennte von einem noch laufenden Schreibvorgang ueberholt werden.
  return mitD1Lock(async (): Promise<Ergebnis<void, ProjectStoreFehlercode>> => {
    const projekt = holeAktivesProjekt()
    if (projekt === null) {
      // "nichts zu tun - das ist KEIN Fehler" (Signatur). Ein etwaiger offener Termin wird
      // NICHT abgebrochen: Ohne aktives Projekt ist ohnehin nichts zu schreiben, und ein
      // Abbruch waere die einzige Stelle in dieser Datei, die einen ausstehenden Stand
      // wegwirft - dazu gibt es keinen Auftrag.
      return { ok: true, wert: undefined }
    }
    // BEWUSST UNBEDINGT, auch wenn nichts vorgemerkt ist: Ein Schreibvorgang zu viel kostet beim
    // Beenden Millisekunden, ein Schreibvorgang zu wenig kostet die Arbeit der letzten Sitzung.
    // Die Bedingung waere zudem nur so verlaesslich wie die Zusage, dass JEDE Aenderung durch
    // planeAutoSpeicherung gelaufen ist - genau die kann diese Datei nicht pruefen.
    return sofortFlush(projekt)
  })
}
// NACHGETRAGEN VON HAND am 12.08.2026. Diese Signatur kam am 10.08.2026 zu #47 hinzu - da war
// das Geruest schon erzeugt, deshalb fehlte sie in dieser Datei. Aufgefallen beim Nachziehen der
// Fehlercode-Signaturen. Der Generator kann sie nicht mehr nachliefern: Die Pruefsumme dieser
// Datei stimmt seit derselben Aenderung nicht mehr, und dann fasst er sie nie wieder an.
//
// Fall (3) von oben, als EIGENE Funktion - der Beenden-Ablauf in src/main/index.ts (#3) ruft
// ausschliesslich diese, nie sofortFlush direkt.
// Sie nimmt mitD1Lock (#32) und holt den aktiven Stand ueber holeAktivesProjekt (#192)
// INNERHALB des Locks; damit ruft sie sofortFlush.
// Ist kein Projekt geoeffnet (holeAktivesProjekt liefert null): { ok: true }, nichts zu tun -
// das ist KEIN Fehler.

export function aufAutoSpeichernEreignis(
  hoerer: (ereignis: AutoSpeichernEreignis) => void,
): () => void {
  const eintrag = { hoerer }
  hoerende.add(eintrag)
  // Mehrfaches Abmelden ist harmlos: `delete` auf einen bereits entfernten Eintrag tut nichts.
  return () => {
    hoerende.delete(eintrag)
  }
}
// registriert einen Listener für Statuswechsel; Rückgabewert ist die Abmelde-Funktion

/**
 * Plant den naechsten Schreibversuch und bricht einen bereits geplanten ab.
 *
 * Es gibt bewusst nur EINEN Termin fuer Entprellung UND Wiederholung: Beide wollen dasselbe tun
 * (den vorgemerkten Stand schreiben), und zwei Timer wuerden im Fehlerfall zwei Schreibvorgaenge
 * in die Lock-Schlange stellen, von denen der zweite garantiert ueberfluessig ist.
 */
function planeTermin(verzoegerungMs: number): void {
  brichTerminAb()
  timer = setTimeout(() => {
    timer = null
    const projekt = vorgemerkt
    if (projekt === null) {
      return
    }
    // HIER wird das D1-Lock genommen und NICHT in sofortFlush: Der Vertrag von sofortFlush
    // verlangt das Lock vom Aufrufer (die drei anderen Ausloeser halten es bereits, ein
    // zweiter Aufruf darin waere die von #32 benannte Deadlock-Falle). Der Timer ist ein
    // Aufrufer wie jeder andere - und der einzige, der in dieser Datei sitzt.
    void mitD1Lock(() => sofortFlush(projekt))
  }, verzoegerungMs)
}

function brichTerminAb(): void {
  if (timer !== null) {
    clearTimeout(timer)
    timer = null
  }
}

/**
 * Gibt ein Ereignis an alle Hoerer.
 *
 * Ueber eine KOPIE der Menge, damit ein Hoerer sich waehrend der Zustellung abmelden darf, ohne
 * die laufende Schleife zu stoeren. Der Fehler eines Hoerers wird gefangen: Ein Empfaenger, der
 * wirft, darf weder die uebrigen Hoerer um ihre Meldung bringen noch einen gelungenen
 * Schreibvorgang nachtraeglich in einen Fehler verwandeln. Das ist die einzige Stelle dieser
 * Datei, an der etwas verschluckt wird - s. Bericht/STOPP.
 */
function melde(ereignis: AutoSpeichernEreignis): void {
  for (const eintrag of [...hoerende]) {
    try {
      eintrag.hoerer(ereignis)
    } catch {
      // absichtlich leer, s. oben
    }
  }
}

function text(ursache: unknown): string {
  return ursache instanceof Error ? ursache.message : String(ursache)
}

// NICHT HIER, UND GEMELDET:
//
// 1. KEIN AUSLOESER. Diese Datei ruft `sofortFlush` nur aus ihrem eigenen Timer. Die vier Faelle
//    aus TK 9.5.4 loesen andere aus: render-/export-Handler (#189/#190), oeffneProjekt (#34),
//    der Beenden-Ablauf (#3, ueber flushBeimBeenden) und die D1-aendernden Auftraege (#72 ff.).
//
// 2. KEIN SENDER AUF DEN IPC-KANAL. `project:autoSpeichernStatus` kennt diese Datei nur als
//    Kommentar; den Weg zum Fenster baut verdrahteSpeicherstatusIPC (#238) im ipc-gateway.
//
// 3. KEINE ENTSCHEIDUNG ZUM BEENDEN-FEHLSCHLAG. Der Fehler wird UNVERAENDERT durchgereicht.
//    Was danach geschieht (App schliesst nicht, Meldung mit Handlungsempfehlung, "Erneut
//    versuchen", benannter Ausweg "Trotzdem schliessen und Aenderungen verwerfen"), legt
//    TK 9.5.4 inzwischen bindend fest - gebaut wird es im Beenden-Ablauf (#3) und in der
//    Oberflaeche, nicht hier.
