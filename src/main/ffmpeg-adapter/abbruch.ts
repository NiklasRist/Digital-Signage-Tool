// GENERIERT aus dem Signaturblock von Issue #159.
// [ffmpeg-adapter] Laufenden ffmpeg-Prozess plattformsicher beenden
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
// GERUEST-PRUEFSUMME: ed80a0d887439ec7
//
// ERLEDIGT (14.08.2026): Rumpf gefuellt, die dateiweite Abschaltzeile
// (@typescript-eslint/no-unused-vars) ist damit entfernt - beide Parameter und der
// Import werden jetzt benutzt.
//
// AM 14.08.2026 AUF DIESEM RECHNER NACHGEMESSEN (Windows 11, das gebuendelte
// ffmpeg-static, ein Lauf ueber `testsrc` mit `-t 600` in eine Datei):
//
//   Loeschen der Ausgabedatei WAEHREND der Lauf laeuft ...... EBUSY
//   taskkill /pid <pid> /t /f ............................... Exit-Code 0,
//       ffmpeg endet mit exitCode 1 / signalCode null, PID nach ~500 ms weg,
//       Loeschen danach erfolgreich
//   kindProzess.kill() (Ersatzweg) .......................... PID nach ~40 ms weg,
//       Loeschen danach erfolgreich
//   taskkill auf eine nicht existierende PID ................ Exit-Code 128
//
// Damit ist die teure Behauptung des Issues belegt: Solange der Prozess LEBT, ist
// seine Datei unter Windows gesperrt (EBUSY) - und genau das raeumt #179 danach auf.
// Ebenso belegt ist, dass der Ersatzweg wirkt, falls taskkill nicht durchkommt: Auch
// er laesst die Datei los. Was NICHT gemessen werden konnte, ist ein ffmpeg, das auf
// taskkill /f nicht mehr reagiert - dagegen steht allein ABSCHLUSS_FRIST_MS.
//
// NEBENBEFUND ZUR NAHT MIT #158: Ein ueber taskkill beendetes ffmpeg meldet unter
// Windows `code 1, signal null` - also KEIN Signal. Die Begruendung in prozess.ts
// ("auf WINDOWS GIBT ES KEINE SIGNALE ... die ABSICHT kennt nur, wer abgebrochen
// hat") trifft fuer genau diesen Weg zu: Ohne das AbortSignal waere jeder Abbruch
// unter Windows als roter Fehlschlag angekommen.

import { spawn } from 'node:child_process'

import type { ChildProcess } from 'node:child_process'

/**
 * POSIX: Zeit fuer SIGTERM, bevor SIGKILL folgt.
 *
 * Drei Sekunden reichen ffmpeg sicher, um den Encoder zu schliessen und die
 * Datei-Handles freizugeben. Laenger zu warten hilft nicht: Ein ffmpeg, das nach drei
 * Sekunden nicht reagiert, reagiert gar nicht mehr.
 */
const GNADENFRIST_MS = 3_000

/**
 * Obergrenze fuer das Warten auf 'exit' - danach wird aufgeloest.
 *
 * Die NOTBREMSE GEGEN DEN STILLSTAND DER WARTESCHLANGE. Sie ist bewusst groesser als
 * die erste Frist, damit der regulaere Weg (SIGTERM -> SIGKILL -> exit) hineinpasst,
 * und trotzdem so kurz, dass der Nutzer nach dem Klick auf "Abbrechen" nicht raetselt.
 * Die serielle Ausfuehrung ist der EINZIGE Sperr-Mechanismus des Systems (TK 9.3.5):
 * Bliebe diese Zusage offen, stuende danach die gesamte Warteschlange fuer den Rest
 * der Sitzung.
 */
const ABSCHLUSS_FRIST_MS = 5_000

/**
 * Der EINE Platz. Keine Liste, keine Map: "Es laeuft stets nur ein Auftrag
 * gleichzeitig; die uebrigen warten in Reihenfolge." (Anforderungsdokument NFA-09)
 *
 * Aufbewahrt wird das HANDLE, nie die PID: Das Betriebssystem vergibt PIDs nach dem
 * Prozessende erneut, ein verspaetetes taskkill auf eine gemerkte Zahl traefe dann
 * einen fremden Prozess des Nutzers.
 */
let gemerkterProzess: ChildProcess | null = null

/**
 * Merkt sich das Handle des laufenden ffmpeg-Prozesses. Es gibt genau EINEN Platz:
 * es laeuft nie mehr als ein ffmpeg gleichzeitig (serielle Ausfuehrung, TK 9.3.5).
 * Ein zweiter Aufruf, waehrend noch ein Handle liegt, ERSETZT es und meldet das intern
 * als Programmierfehler - er wirft NICHT.
 */
export function merkeProzess(kindProzess: ChildProcess): void {
  if (gemerkterProzess !== null) {
    // Kein throw: Diese Datei darf den laufenden Render nicht abbrechen, nur weil die
    // Buchfuehrung nicht stimmt. Aber der Umstand verletzt die serielle Zusage - er
    // hiesse, dass ein zweites ffmpeg gestartet wurde, dessen Handle jetzt verloren
    // geht und das kein Abbruch mehr erreicht.
    protokolliere('merkeProzess: Es lag bereits ein Handle - die serielle Zusage ist verletzt')
  }
  gemerkterProzess = kindProzess
}

/**
 * Gibt den Platz wieder frei. Ist ein ANDERES als das gemerkte Handle uebergeben,
 * passiert nichts (ein spaet eintreffendes Ende eines alten Laufs darf den neuen
 * nicht abmelden).
 */
export function gibProzessFrei(kindProzess: ChildProcess): void {
  if (gemerkterProzess !== kindProzess) return
  gemerkterProzess = null
}

/**
 * Beendet den gemerkten Prozess plattformsicher.
 * Loest IMMER auf - auch wenn kein Prozess gemerkt ist, der Prozess schon tot ist
 * oder das Beenden selbst fehlschlaegt. Lehnt NIE ab und wirft NIE.
 */
export function beendeLaufendenProzess(): Promise<void> {
  try {
    const kindProzess = gemerkterProzess

    // Der Platz wird SOFORT frei, nicht erst am Ende jedes Zweiges. Zwei Gruende:
    // Erstens kann so kein Pfad das Freigeben vergessen. Zweitens findet ein zweiter
    // Abbruch, der waehrend des Wartens hereinkommt, kein Handle mehr vor - er loest
    // auf, statt denselben Prozess ein zweites Mal zu beschiessen.
    gemerkterProzess = null

    // Kein Handle: normaler Wettlauf mit dem regulaeren Ende (der Lauf war gerade
    // fertig), kein Fehlerfall - und keine Warnung nach aussen.
    if (kindProzess === null) return Promise.resolve()

    // Schon beendet: Auf ein 'exit' zu warten, das nie mehr kommt, wuerde die Zusage
    // bis zur Frist offen halten - und mit ihr den Auftrag auf "laeuft".
    if (kindProzess.exitCode !== null || kindProzess.signalCode !== null) {
      return Promise.resolve()
    }

    return beendeUndWarte(kindProzess)
  } catch (ursache) {
    // Selbst ein unmoeglicher Zustand darf hier nicht nach aussen dringen: Ein
    // unbehandelter Fehler an dieser Stelle nimmt dem Nutzer den Abbruch UND die
    // Warteschlange.
    gemerkterProzess = null
    protokolliere('beendeLaufendenProzess ist unerwartet gescheitert', ursache)
    return Promise.resolve()
  }
}

/**
 * Beendet den Prozess plattformabhaengig und wartet auf sein Ende - hoechstens
 * ABSCHLUSS_FRIST_MS lang.
 *
 * Die Zusage loest in JEDEM Fall auf. Sie sagt damit ausdruecklich NICHT zu, dass der
 * Prozess wirklich tot ist; sie sagt zu, dass der Aufrufer weiterkommt.
 */
function beendeUndWarte(kindProzess: ChildProcess): Promise<void> {
  return new Promise<void>((fertig) => {
    let erledigt = false
    let gnadenUhr: ReturnType<typeof setTimeout> | null = null
    let abschlussUhr: ReturnType<typeof setTimeout> | null = null

    const loeseAuf = (): void => {
      if (erledigt) return
      erledigt = true
      if (gnadenUhr !== null) clearTimeout(gnadenUhr)
      if (abschlussUhr !== null) clearTimeout(abschlussUhr)
      fertig()
    }

    // Zuerst zuhoeren, dann beenden: Umgekehrt koennte das Ende zwischen Signal und
    // Anmeldung liegen - und die Zusage haenge bis zur Frist.
    kindProzess.once('exit', loeseAuf)
    abschlussUhr = setTimeout(loeseAuf, ABSCHLUSS_FRIST_MS)

    if (process.platform === 'win32') {
      beendeUnterWindows(kindProzess)
      return
    }

    // POSIX: erst freundlich fragen. ffmpeg beendet daraufhin geordnet und gibt seine
    // Datei-Handles frei.
    sendeSignal(kindProzess, 'SIGTERM')
    gnadenUhr = setTimeout(() => {
      if (erledigt) return
      sendeSignal(kindProzess, 'SIGKILL')
    }, GNADENFRIST_MS)
  })
}

/**
 * Der Windows-Zweig.
 *
 * WARUM HIER KEIN SIGNAL STEHT: Windows kennt keine Signale. Node bildet dort jeden
 * Signalnamen auf ein hartes TerminateProcess ab - der Name taeuscht also eine
 * Hoeflichkeit vor, die es nicht gibt, und etwaige Kindprozesse ueberleben. `/t`
 * beendet den ganzen Baum, `/f` erzwingt das Ende.
 *
 * Die PID reist als EIGENES Array-Element: "ffprobe/ffmpeg-Argumente nie per
 * String-Konkatenation, immer als Argument-Array." (TK 9.4.8 Punkt 2) Das gilt auch
 * hier - es gibt keine Kommandozeile, die etwas zerlegen oder einschleusen koennte.
 */
function beendeUnterWindows(kindProzess: ChildProcess): void {
  const pid = kindProzess.pid

  // Ohne PID ist der Start selbst fehlgeschlagen; es gibt nichts, worauf taskkill
  // zeigen koennte. Die Zeichenkette "undefined" waere hier ein Aufruf ins Blaue.
  if (pid === undefined) {
    protokolliere('Das gemerkte Handle hat keine PID - taskkill entfaellt')
    sendeSignal(kindProzess)
    return
  }

  let ersatzGemacht = false
  const ersatzweiseBeenden = (): void => {
    if (ersatzGemacht) return
    ersatzGemacht = true
    sendeSignal(kindProzess)
  }

  try {
    const werkzeug = spawn('taskkill', ['/pid', String(pid), '/t', '/f'], { windowsHide: true })

    werkzeug.once('error', (ursache: Error) => {
      protokolliere('taskkill liess sich nicht starten', ursache)
      ersatzweiseBeenden()
    })

    // Exit-Code ungleich 0 heisst: taskkill hat den Prozess nicht beendet (gemessen:
    // 128, wenn es die PID nicht mehr gibt). Der Ersatzweg ist dann entweder
    // wirkungslos - der Prozess ist ohnehin schon weg - oder er rettet den Abbruch.
    werkzeug.once('close', (code: number | null) => {
      if (code === 0) return
      protokolliere('taskkill meldete einen Fehlschlag - Ersatzweg ueber das Handle')
      ersatzweiseBeenden()
    })
  } catch (ursache) {
    protokolliere('taskkill liess sich nicht starten', ursache)
    ersatzweiseBeenden()
  }
}

/**
 * Sendet ein Signal und schluckt einen Fehler dabei.
 *
 * `kill` kann werfen, wenn der Prozess in der Zwischenzeit verschwunden ist (ESRCH).
 * Das ist kein Fehlerfall: Genau das Ergebnis wollten wir.
 */
function sendeSignal(kindProzess: ChildProcess, signal?: NodeJS.Signals): void {
  try {
    kindProzess.kill(signal)
  } catch (ursache) {
    protokolliere('Das Signal liess sich nicht senden', ursache)
  }
}

/**
 * Die interne Protokollierung - wie im uebrigen Hauptprozess als console.error mit
 * Modul-Praefix (so halten es auftrags-manager, media-service und ipc-gateway).
 * Nach aussen dringt nichts: Diese Datei kennt weder einen Fehlercode noch einen
 * Empfaenger, und ein Ereignis waere ein zweiter Abbruch-Zustand neben dem des
 * render-service (#179).
 */
function protokolliere(stelle: string, ursache?: unknown): void {
  if (ursache === undefined) {
    console.error(`[ffmpeg-adapter] abbruch: ${stelle}`)
    return
  }
  console.error(`[ffmpeg-adapter] abbruch: ${stelle}:`, ursache)
}
