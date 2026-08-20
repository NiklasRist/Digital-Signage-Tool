// GENERIERT aus dem Signaturblock von Issue #158.
// [ffmpeg-adapter] Fehlercode-Union und Prozessstart fuehreFfmpegAus
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
// GERUEST-PRUEFSUMME: bb5b6cd5124cbba1
//
// ERLEDIGT (14.08.2026): Rumpf gefuellt, die dateiweite Abschaltzeile
// (@typescript-eslint/no-unused-vars) ist damit entfernt - jeder Parameter und
// jeder Import wird jetzt benutzt.

import { spawn } from 'node:child_process'

import { ermittleFfmpegPfad } from '../ffmpeg-pfad'

import type { ChildProcess } from 'node:child_process'
import type { Ergebnis } from '../../shared/contracts/ergebnis'

// Fremde Aufrufe - vollstaendig ausgeschrieben, damit hier nichts geraten wird:
//
//   #6 - src/main/ffmpeg-pfad.ts
//   export function ermittleFfmpegPfad(): string
//     Absoluter Pfad zum ausfuehrbaren ffmpeg-Binary (Dev: das Paket im
//     Abhaengigkeitsordner; gepackt: der entpackte Zwilling neben dem Programmarchiv).
//     DIESE FUNKTION IST DIE EINZIGE QUELLE DES PFADES. Hier wird er nicht
//     zusammengesetzt, nicht aus der Umgebung gelesen und es gibt keinen Rueckfall auf
//     ein ffmpeg aus dem System. Ein hier gebauter Pfad funktioniert im
//     Entwicklungsmodus und scheitert in der portablen EXE - also beim Kunden, beim
//     ersten Render.
//     Die Verfuegbarkeit prueft diese Datei NICHT: Das hat der Start-Selbsttest
//     (pruefeFfmpegVerfuegbar, #3) bereits getan.

/**
 * Geschlossener Fehlercode-Satz des ffmpeg-adapter. Modul-lokal (nicht im geteilten Vertrag):
 * Die Enge sitzt dort, wo der Code ENTSTEHT.
 */
export type FfmpegFehlercode = 'ffmpeg_fehler' | 'ffmpeg_abgebrochen'

export interface FfmpegLauf {
  /** Die Argumente EINZELN, ohne Binärpfad und ohne die feste Vorspann-Liste (s. u.). */
  argumente: readonly string[]
  /** Wird je vollstaendiger Zeile auf stdout gerufen (Traeger von -progress). Ohne Deutung. */
  aufAusgabeZeile?: (zeile: string) => void
  /** Reicht das Prozess-Handle sofort nach dem Start heraus (fuer den Abbruch, #159). */
  aufProzessStart?: (kindProzess: ChildProcess) => void
  /** Signalisiert einen vom Nutzer gewollten Abbruch. Diese Datei KILLT NICHT - sie deutet nur. */
  abbruchSignal?: AbortSignal
}

/**
 * Die BETRIEBS-Flags jedes Laufs - an EINER Stelle, von KEINEM Aufrufer wiederholt.
 *
 * - `-hide_banner`  unterdrueckt den Versions- und Konfigurationsblock, der sonst jede
 *                   Fehlerausgabe verwaessert.
 * - `-nostdin`      verhindert, dass ffmpeg die Standardeingabe des Electron-Prozesses an
 *                   sich zieht; sonst kann ein Lauf auf eine Eingabe warten, die nie kommt,
 *                   und die Warteschlange steht.
 * - `-loglevel error` macht stderr AUSSCHLIESSLICH zum Fehlerkanal - erst dadurch sind "die
 *                   letzten N Zeilen" tatsaechlich die Ursache.
 * - `-y`            ueberschreibt eine vorhandene Zieldatei ohne Rueckfrage; alle Ziele dieses
 *                   Adapters sind fluechtige Zwischendateien bzw. .part-Dateien, und eine
 *                   interaktive Rueckfrage waere wieder ein Aufhaenger fuer die ganze Schlange.
 * - `-progress pipe:1` schreibt den Fortschritt als schluessel=wert-Zeilen nach STDOUT - genau
 *                   der Strom, den diese Datei zeilenweise weitergibt. OHNE DIESES FLAG
 *                   SCHREIBT ffmpeg UEBERHAUPT NICHTS NACH STDOUT: zusammen mit
 *                   `-loglevel error` (das die voreingestellte Fortschrittsanzeige auf stderr
 *                   ohnehin unterdrueckt) kaeme beim Fortschritts-Leser (#160) nie eine
 *                   einzige Zeile an. Die Kette #160 -> #177 -> #178 -> #191 waere gebaut,
 *                   fehlerfrei uebersetzbar und TOT - und kein Test schluege an, weil jedes
 *                   Glied fuer sich richtig ist.
 * - `-nostats`      schaltet die zusaetzliche, unstrukturierte Statuszeile ab: dieselbe
 *                   Information in einem Format, das sich zwischen ffmpeg-Fassungen aendert -
 *                   und sie wuerde den stderr-Ringpuffer mit Nicht-Fehlern fuellen.
 *
 * KEINES dieser Flags ist ein Encoder-Parameter. Das Ausgabe-Profil kommt getrennt aus
 * #161/#162; hier steht bewusst nichts davon.
 */
const FESTER_VORSPANN = [
  '-hide_banner',
  '-nostdin',
  '-loglevel',
  'error',
  '-y',
  '-progress',
  'pipe:1',
  '-nostats',
] as const

/**
 * So viele stderr-Zeilen hebt der Ringpuffer auf.
 *
 * ffmpeg schreibt seinen Abbruchgrund ans ENDE von stderr, meist als zwei bis drei Zeilen
 * plus abschliessender Meldung. 20 Zeilen fangen auch den Fall, dass davor noch Warnungen zur
 * Quelldatei stehen, und deckeln zugleich den Speicher: Ein Lauf ueber eine defekte Datei kann
 * Tausende Zeilen erzeugen.
 */
const STDERR_ZEILEN = 20

/** Hoechstlaenge der fertigen Meldung - sie muss durch die IPC-Grenze und in eine Anzeige passen. */
const MELDUNG_ZEICHEN = 2000

/**
 * Startet EINEN ffmpeg-Prozess und beantwortet ihn genau einmal.
 *
 * Die einzige Prozessstartstelle des Projekts. Sie kennt keine Fachbegriffe (keine Projekte,
 * Aktionen, Vorlagen, Auftraege), loest keine Pfade auf, legt nichts an und liest keine Datei.
 * Sie deutet den stdout-Strom NICHT - das ist #160 - und sie beendet nichts: das Handle geht
 * ueber `aufProzessStart` an #159, dort liegt das plattformsichere Beenden.
 *
 * Sie wirft NIE. Jeder Ausgang ist die Ergebnis-Huelle - auch der Fall, dass schon der
 * Prozessstart scheitert. Der Exit-Code wird dabei nie zum Fehlercode (TK 9.1.1 Punkt 3); er
 * darf nur in der Meldung vorkommen.
 *
 * WARUM DIE ANTWORTPFLICHT SO HART IST: Der Render laeuft als Auftrag, und die serielle
 * Reihenfolge ist der einzige Sperr-Mechanismus des Systems (TK 9.3.5). Bliebe eine Zusage
 * offen, stuende danach die GESAMTE Warteschlange - kein Import, kein Loeschen, kein Export
 * mehr, bis die App neu gestartet wird.
 */
export async function fuehreFfmpegAus(
  lauf: FfmpegLauf,
): Promise<Ergebnis<void, FfmpegFehlercode>> {
  return new Promise((fertig) => {
    // Genau eine Antwort, unter allen Umstaenden: `close` und `error` koennen beide feuern -
    // wer zuerst kommt, antwortet, der zweite wird verworfen.
    let bereitsGeantwortet = false
    const antworte = (ergebnis: Ergebnis<void, FfmpegFehlercode>): void => {
      if (bereitsGeantwortet) return
      bereitsGeantwortet = true
      fertig(ergebnis)
    }

    /** Die letzten STDERR_ZEILEN Zeilen - der Grund steht bei ffmpeg immer am Ende. */
    const letzteFehlerZeilen: string[] = []

    /** Der erste Fehler AUS EINEM RUECKRUF des Aufrufers, falls es einen gab. */
    let rueckrufFehler: string | null = null

    // Ausserhalb des Versuchs, damit der Fangzweig unten den Pfad noch nennen kann - beim
    // Kunden ist er die einzige Spur. Vor der Ermittlung ist er leer.
    let binaerPfad = ''

    try {
      binaerPfad = ermittleFfmpegPfad()

      // Der Vorspann steht VOR den Aufrufer-Argumenten - in genau dieser Reihenfolge.
      const argumente = [...FESTER_VORSPANN, ...lauf.argumente]

      // spawn mit Programm UND Argument-Array, ohne Shell:
      //
      // "ffprobe/ffmpeg-Argumente nie per String-Konkatenation, immer als Argument-Array.
      // Windows-Pfade enthalten regelmaessig Leerzeichen; ein zusammengebautes Kommando bricht
      // dort und funktioniert auf macOS scheinbar." (TK 9.4.8 Punkt 2)
      //
      // Es gibt hier also keine Kommandozeile, die ein Leerzeichen zerlegen koennte - und
      // damit auch keinen Weg, ueber einen Dateinamen mit `"` oder `&` fremde Befehle
      // einzuschleusen. Die Dateinamen stammen aus Nutzereingaben (FA-22) und aus
      // importierten Medien, also aus genau den Quellen, denen man nicht trauen darf.
      //
      // `windowsHide` verhindert, dass bei jedem Segment kurz ein Konsolenfenster aufblitzt.
      // Keine Zeitgrenze: Ein Renderlauf darf legitim viele Minuten dauern (NFA-05); der
      // Ausweg des Nutzers ist der Abbruch (TK 9.2.7), nicht eine geratene Frist.
      const kindProzess: ChildProcess = spawn(binaerPfad, argumente, { windowsHide: true })

      // Sofort nach dem Start, einmal, mit dem unveraenderten Handle. Diese Datei merkt es
      // sich NICHT.
      const startFehler = rufeGeschuetzt(() => lauf.aufProzessStart?.(kindProzess))
      if (startFehler !== null) rueckrufFehler = startFehler

      // stdout: ausschliesslich der Fortschrittskanal (Wirkung von `-progress pipe:1`).
      // Weitergegeben werden nur VOLLSTAENDIGE Zeilen; gedeutet wird hier nichts.
      const ausgabeLeser = erzeugeZeilenLeser((zeile) => {
        // Nach dem ersten Fehler aus dem Rueckruf wird er nicht weiter gerufen: Ein
        // Empfaenger, der bei einer Zeile wirft, wirft bei den naechsten tausend auch, und
        // der Lauf ist ohnehin schon verloren.
        if (rueckrufFehler !== null) return
        const fehler = rufeGeschuetzt(() => lauf.aufAusgabeZeile?.(zeile))
        if (fehler !== null) rueckrufFehler = fehler
      })
      kindProzess.stdout?.setEncoding('utf8')
      kindProzess.stdout?.on('data', (block: unknown) => {
        ausgabeLeser.nimm(String(block))
      })

      // stderr: ausschliesslich der Fehlerkanal (Wirkung von `-loglevel error`).
      const fehlerLeser = erzeugeZeilenLeser((zeile) => {
        letzteFehlerZeilen.push(zeile)
        if (letzteFehlerZeilen.length > STDERR_ZEILEN) letzteFehlerZeilen.shift()
      })
      kindProzess.stderr?.setEncoding('utf8')
      kindProzess.stderr?.on('data', (block: unknown) => {
        fehlerLeser.nimm(String(block))
      })

      kindProzess.on('error', (ursache: Error) => {
        // Der Prozess ist gar nicht erst gestartet (oder hat sich beim Start verabschiedet).
        // Ein spaeter noch feuerndes `close` wird vom Waechter verworfen.
        antworte(gescheitert('ffmpeg_fehler', startFehlerMeldung(ursache, binaerPfad)))
      })

      // `close` und nicht `exit`: Erst wenn auch die Stroeme geschlossen sind, ist die letzte
      // stderr-Zeile - also die Ursache - tatsaechlich angekommen.
      kindProzess.on('close', (code: number | null, signal: NodeJS.Signals | null) => {
        ausgabeLeser.schliesse()
        fehlerLeser.schliesse()
        antworte(bestimmeAusgang(lauf, code, signal, letzteFehlerZeilen, rueckrufFehler))
      })
    } catch (unerwartet) {
      // spawn selbst kann werfen, bevor ueberhaupt ein Prozess entsteht (etwa bei einem leeren
      // Binaerpfad), ebenso ermittleFfmpegPfad. Auch das ist ffmpeg_fehler und keine Ausnahme:
      // ein `throw` von hier landete als unbehandelte Ausnahme im Main, und die Zusage bliebe
      // fuer immer offen.
      antworte(gescheitert('ffmpeg_fehler', startFehlerMeldung(unerwartet, binaerPfad)))
    }
  })
}

/**
 * Bestimmt den Ausgang eines beendeten Laufs.
 *
 * REIHENFOLGE IST BEDEUTUNG:
 *
 * 1. Der Abbruch schlaegt jeden Exit-Code. Auf POSIX endet ein beendeter Prozess mit
 *    `code === null` und gesetztem Signal; auf WINDOWS GIBT ES KEINE SIGNALE - ein hart
 *    beendeter Prozess liefert schlicht einen Exit-Code ungleich 0 und `signal === null`.
 *    Wuerde hier aus Exit-Code und Signal geraten, meldete ein Nutzer-Abbruch unter Windows
 *    systematisch einen FEHLER, und die Oberflaeche zeigte einen roten Fehlschlag, obwohl der
 *    Nutzer selbst abgebrochen hat. Das verbietet TK 9.2.3: "abgebrochen ist kein Fehlercode."
 *    Die ABSICHT kennt nur, wer abgebrochen hat - sie reist ueber das AbortSignal herein.
 * 2. Danach ein Fehler aus einem Rueckruf: Der Lauf mag sauber geendet haben, aber der
 *    Aufrufer hat den Fortschritt oder das Handle nicht entgegennehmen koennen - das als
 *    Erfolg zu melden waere ein stiller Fehlschlag.
 * 3. Erst dann der Exit-Code.
 */
function bestimmeAusgang(
  lauf: FfmpegLauf,
  code: number | null,
  signal: NodeJS.Signals | null,
  letzteFehlerZeilen: readonly string[],
  rueckrufFehler: string | null,
): Ergebnis<void, FfmpegFehlercode> {
  if (lauf.abbruchSignal?.aborted === true) {
    // Keine stderr-Auswertung: Was ffmpeg beim Beenden noch geschrieben hat, ist Folge des
    // Abbruchs und keine Ursache.
    return gescheitert('ffmpeg_abgebrochen', 'Lauf abgebrochen')
  }

  if (rueckrufFehler !== null) {
    return gescheitert(
      'ffmpeg_fehler',
      baueMeldung(
        `Ein Rueckruf des Aufrufers hat geworfen: ${rueckrufFehler}`,
        letzteFehlerZeilen.join('\n').trim(),
      ),
    )
  }

  if (code === 0) {
    return { ok: true, wert: undefined }
  }

  const kopf =
    code === null
      ? `ffmpeg wurde durch das Signal ${signal ?? 'unbekannt'} beendet.`
      : `ffmpeg ist mit Exit-Code ${code} fehlgeschlagen.${
          signal === null ? '' : ` Signal: ${signal}.`
        }`

  return gescheitert('ffmpeg_fehler', baueMeldung(kopf, letzteFehlerZeilen.join('\n').trim()))
}

/**
 * Baut die Meldung zu einem gescheiterten PROZESSSTART.
 *
 * ENOENT/EACCES sind hier KEIN Dateiproblem des Nutzers, sondern ein VERPACKUNGSFEHLER: das
 * mitgelieferte Binary liegt nicht ausfuehrbar an seinem Platz. Deshalb nennt die Meldung den
 * Pfad - beim Kunden ist er die einzige Spur. Der Fehlercode bleibt in jedem Fall
 * `ffmpeg_fehler`; ein ENOENT wird nie zum Code (TK 9.1.1 Punkt 3).
 */
function startFehlerMeldung(ursache: unknown, binaerPfad: string): string {
  const ortsangabe = binaerPfad === '' ? '' : ` Pfad: ${binaerPfad}`
  const code = systemCodeVon(ursache)

  if (code === 'ENOENT' || code === 'EACCES') {
    return (
      `ffmpeg liess sich nicht ausfuehren (${code}) - das ist ein VERPACKUNGSFEHLER: ` +
      `das mitgelieferte Binary fehlt an seinem Platz oder ist nicht ausfuehrbar.${ortsangabe}`
    )
  }

  return `ffmpeg liess sich nicht starten: ${textVon(ursache)}${ortsangabe}`
}

/** Der `code` eines Systemfehlers - oder null, wenn der geworfene Wert keinen traegt. */
function systemCodeVon(ursache: unknown): string | null {
  if (typeof ursache !== 'object' || ursache === null || !('code' in ursache)) return null
  // SAFETY: die Zeile davor hat code in ursache belegt; der Cast macht das Feld
  // sichtbar, und der typeof-Check darunter prueft es zur Laufzeit.
  const code = (ursache as { code: unknown }).code
  return typeof code === 'string' ? code : null
}

/**
 * Setzt Kopf und aufgehobene stderr-Zeilen zusammen und deckelt das Ganze auf
 * MELDUNG_ZEICHEN: Vom stderr-Teil bleibt das ENDE erhalten, abgeschnitten wird der Anfang -
 * dort steht bei ffmpeg der Grund. Der Kopf bleibt immer vollstaendig, weil er den Exit-Code
 * traegt.
 */
function baueMeldung(kopf: string, stderrText: string): string {
  if (stderrText === '') return kopf

  const platz = MELDUNG_ZEICHEN - kopf.length - 1
  if (platz <= 0) return kopf

  const anhang = stderrText.length <= platz ? stderrText : stderrText.slice(-platz)
  return `${kopf}\n${anhang}`
}

/** Ein gescheitertes Ergebnis dieses Moduls. */
function gescheitert(
  code: FfmpegFehlercode,
  meldung: string,
): Ergebnis<void, FfmpegFehlercode> {
  return { ok: false, fehler: { code, meldung } }
}

interface ZeilenLeser {
  /** Nimmt einen Datenblock entgegen und gibt jede darin VOLLSTAENDIGE Zeile weiter. */
  nimm(block: string): void
  /** Prozessende: gibt ein uebrig gebliebenes Reststueck weiter - aber nur, wenn es nicht leer ist. */
  schliesse(): void
}

/**
 * Zerlegt einen Strom in Zeilen.
 *
 * WARUM GEPUFFERT WIRD: Ein Datenblock endet dort, wo das Betriebssystem ihn abschneidet, und
 * das ist regelmaessig MITTEN in einer Zeile. Wer jeden Block als Zeile weitergibt, liefert
 * dem Fortschritts-Leser (#160) Halbzeilen wie `out_ti` - er faende darin nichts, der
 * Fortschritt bliebe bei 0 %, und nichts schluege fehl.
 */
function erzeugeZeilenLeser(aufZeile: (zeile: string) => void): ZeilenLeser {
  let rest = ''

  return {
    nimm(block: string): void {
      rest += block
      let umbruch = rest.indexOf('\n')
      while (umbruch !== -1) {
        aufZeile(ohneWagenruecklauf(rest.slice(0, umbruch)))
        rest = rest.slice(umbruch + 1)
        umbruch = rest.indexOf('\n')
      }
    },
    schliesse(): void {
      const letzte = ohneWagenruecklauf(rest)
      rest = ''
      if (letzte !== '') aufZeile(letzte)
    },
  }
}

/** Schneidet das Wagenruecklauf-Zeichen ab, das Windows-Zeilenenden mitbringen. */
function ohneWagenruecklauf(zeile: string): string {
  return zeile.endsWith('\r') ? zeile.slice(0, -1) : zeile
}

/**
 * Ruft einen Rueckruf des Aufrufers gekapselt.
 *
 * Ein Fehler im Empfaenger darf den Lauf nicht in einen unbeantworteten Zustand kippen -
 * geworfen wird hier nie, der Fehler wird als Text zurueckgegeben und beim Prozessende
 * ausgewertet.
 */
function rufeGeschuetzt(aktion: () => void): string | null {
  try {
    aktion()
    return null
  } catch (ursache) {
    return textVon(ursache)
  }
}

/** Der Text eines geworfenen Werts - auch wenn es kein Error war. */
function textVon(ursache: unknown): string {
  return ursache instanceof Error ? ursache.message : String(ursache)
}
