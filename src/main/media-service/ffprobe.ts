// GENERIERT aus dem Signaturblock von Issue #82.
// [media-service] ffprobe mit Timeout aufrufen
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
// GERUEST-PRUEFSUMME: 5d46c25a22490831
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
// ERLEDIGT (13.08.2026): Abschaltzeile entfernt, der Rumpf ist gefuellt. Mit ihr ist
// auch `import type { ImportFehlercode }` aus dieser Datei verschwunden - der Import
// war ausschliesslich ein BELEG dafuer, dass 'probe_fehler' aus der Modul-Union
// stammt, und blieb zwangslaeufig unbenutzt. Das Issue sieht genau diesen Fall vor:
// der Beleg steht jetzt in tests/unit/ffprobe.spec.ts als
// `const beleg: ImportFehlercode = 'probe_fehler'`. Ein Import, den nur eine
// dateiweite Regelabschaltung am Leben haelt, kostet mehr, als er belegt.

import { execFile } from 'node:child_process'

import { ermittleFfprobePfad } from '../ffmpeg-pfad'

import type { ChildProcess, ExecFileException } from 'node:child_process'
import type { Ergebnis } from '../../shared/contracts/ergebnis'

// Fremde Aufrufe - vollstaendige Signaturen, damit hier nichts geraten wird:
//
//   #6 - src/main/ffmpeg-pfad.ts
//   export function ermittleFfprobePfad(): string
//     Absoluter Pfad zum ausfuehrbaren ffprobe-Binary. Dev: node_modules/ffprobe-static;
//     gepackt: der ausgepackte Zwilling neben dem Programmarchiv, den #6 ermittelt.
//
//   DIESE FUNKTION IST DIE EINZIGE QUELLE DES PFADES. Hier wird er nicht gebaut, nicht
//   aus ermittleFfmpegPfad() abgeleitet, nicht aus einer Umgebungsvariablen gelesen und
//   es gibt keinen Rueckfall auf ein ffprobe aus dem System-PATH. Ein hier
//   zusammengebauter Pfad funktioniert im Entwicklungsmodus und scheitert in der
//   portablen EXE - also beim Kunden, beim ersten Import.
//
//   Die Verfuegbarkeit prueft diese Datei NICHT: Das hat der Start-Selbsttest
//   (pruefeFfprobeVerfuegbar, #3) bereits getan.

/**
 * Zeitgrenze fuer einen ffprobe-Lauf.
 *
 * WARUM SIE VERPFLICHTEND IST: Der Import laeuft als Auftrag, und die serielle
 * Reihenfolge der Auftragsverwaltung ist "der einzige Sperr-Mechanismus des Systems"
 * (TK 9.3.5). Ein haengendes ffprobe - etwa auf einer halb kopierten Datei - blockiert
 * damit nicht diesen einen Import, sondern die GESAMTE Warteschlange fuer den Rest der
 * Sitzung: kein Import, kein Loeschen, kein Render, kein Export mehr.
 */
const PROBE_TIMEOUT_MS = 30_000 // VORLÄUFIG – Betriebsentscheidung offen, s. STOPP

/**
 * Die festen Argumente, in dieser Reihenfolge; der Dateipfad wird als LETZTES
 * angehaengt.
 *
 * - `-v error`          unterdrueckt Banner und Fortschritt, damit auf stdout
 *                       ausschliesslich JSON steht.
 * - `-print_format json` macht die Ausgabe maschinell lesbar (die Textausgabe ist je
 *                       ffprobe-Version verschieden).
 * - `-show_streams`     liefert Masse, Rotation und Stream-Dauer.
 * - `-show_format`      liefert die Container-Dauer. BEIDE werden gebraucht: #83 liest
 *                       die Dauer bevorzugt aus dem Container und faellt auf den Stream
 *                       zurueck.
 *
 * Kein Schreibargument, kein `-y`, kein Ausgabedateiname: ffprobe liest nur, die
 * Quelldatei bleibt roh (TK 9.4.1).
 */
const FESTE_ARGUMENTE = [
  '-v',
  'error',
  '-print_format',
  'json',
  '-show_streams',
  '-show_format',
] as const

/** So viel stderr nimmt die Diagnose-Meldung hoechstens auf. */
const MELDUNG_ZEICHEN = 500

/**
 * Groesserer Ausgabepuffer als Nodes Vorgabe (1 MB).
 *
 * Eine Datei mit vielen Streams oder Kapiteln sprengt den Vorgabewert; Node bricht den
 * Prozess dann ab, und das saehe hier wie eine defekte Datei aus, obwohl nur der Puffer
 * zu klein war.
 */
const MAX_PUFFER = 8 * 1024 * 1024

/**
 * Liest die Rohmetadaten einer Mediendatei mit dem gebuendelten ffprobe aus.
 *
 * Diese Funktion BESCHAFFT die Metadaten, sie DEUTET sie nicht: Masse, Rotation und
 * Dauer liest allein #83 aus dem hier gelieferten Objekt. Deshalb `unknown` und deshalb
 * steht in dieser Datei kein einziger Zugriff auf `streams`, `format`, `width`,
 * `height`, `rotate` oder `duration` - auch nicht "nur zum Pruefen, ob etwas drin ist".
 * Zwei Stellen, die dasselbe JSON auslegen, runden frueher oder spaeter verschieden.
 *
 * Der Dateipfad geht UNVERAENDERT als letztes Argument hinaus: nicht gequotet, nicht
 * escaped, nicht normalisiert. Seine Existenz wird nicht vorab geprueft - eine fehlende
 * Datei ist hier schlicht `probe_fehler`.
 *
 * Diese Funktion fordert KEIN Lock an und haelt keines (TK 9.4.5, Schritt 2:
 * "ausserhalb des Locks"), sie serialisiert nichts selbst (TK 9.4.8 Punkt 9: "Kein
 * zweites Lock") und sie wiederholt nichts - die Wiederholung ist Sache der
 * Auftragsverwaltung (FA-17, Q2).
 *
 * Sie wirft NIE. Jeder Ausgang ist die Ergebnis-Huelle; der Exit-Code von ffprobe wird
 * dabei nie zum Fehlercode (TK 9.1.1).
 */
export async function leseRohMetadaten(
  dateiPfad: string,
): Promise<Ergebnis<unknown, 'probe_fehler'>> {
  return new Promise((fertig) => {
    // Das Versprechen darf GENAU EINMAL beantwortet werden. execFile ruft seinen
    // Rueckruf zwar nur einmal, aber der Fangzweig unten liegt ausserhalb davon; ohne
    // diese Sperre koennte eine spaetere Aenderung zwei Antworten erzeugen, von denen
    // die zweite lautlos verschwindet.
    let beantwortet = false
    const antworte = (ergebnis: Ergebnis<unknown, 'probe_fehler'>): void => {
      if (beantwortet) return
      beantwortet = true
      fertig(ergebnis)
    }

    try {
      const binaerPfad = ermittleFfprobePfad()

      // execFile - und weder die Zeichenketten-Variante noch ein Spawn ueber die
      // Kommandozeile des Systems.
      //
      // "ffprobe/ffmpeg-Argumente nie per String-Konkatenation, immer als
      // Argument-Array. Windows-Pfade enthalten regelmaessig Leerzeichen; ein
      // zusammengebautes Kommando bricht dort und funktioniert auf macOS scheinbar."
      // (TK 9.4.8, Punkt 2)
      //
      // Es gibt hier also keine Kommandozeile, die ein Leerzeichen zerlegen koennte -
      // und damit auch keinen Weg, ueber einen Dateinamen mit `"` oder `&` fremde
      // Befehle einzuschleusen.
      const kind: ChildProcess = execFile(
        binaerPfad,
        [...FESTE_ARGUMENTE, dateiPfad],
        {
          timeout: PROBE_TIMEOUT_MS,
          // Nicht SIGTERM: Ein haengendes ffprobe soll nicht gebeten, sondern beendet
          // werden. TK 9.4.9 nimmt das Wort "gekillt" woertlich.
          killSignal: 'SIGKILL',
          maxBuffer: MAX_PUFFER,
          // Sonst blitzt auf Windows bei jedem Import kurz ein Konsolenfenster auf.
          windowsHide: true,
        },
        (fehler, stdout, stderr) => {
          try {
            if (fehler) {
              // Erst toeten, dann antworten. Node hat den Prozess bei Zeitablauf und
              // bei Pufferueberlauf zwar selbst schon abgeschossen - aber ein
              // ffprobe, das nach einem anderen Fehler weiterlaeuft, haelt den
              // Datei-Handle, und genau daraus entsteht spaeter auf Windows das EBUSY
              // beim Loeschen derselben Datei.
              stelleSicherDassBeendet(kind)
              antworte(gescheitert(fehlerMeldung(fehler, stderr, binaerPfad)))
              return
            }

            if (stdout.trim() === '') {
              // Kein Ausgang ohne Ursache: Mit `-v error` steht das JSON auf stdout.
              // Ist stdout leer, hat ffprobe nichts Verwertbares gefunden - was immer
              // auf stderr steht, gehoert in die Diagnose.
              antworte(
                gescheitert(
                  `ffprobe hat keine Ausgabe geliefert.${stderrAnhang(stderr)}`,
                ),
              )
              return
            }

            let roh: unknown
            try {
              // Das Parsen gehoert hierher, weil das JSON-Format eine Eigenschaft
              // DIESES Aufrufs ist (`-print_format json`). #83 bekaeme sonst eine
              // Zeichenkette, ohne das Argument-Array zu kennen. WAS in dem Objekt
              // steht, wird hier nicht angesehen.
              roh = JSON.parse(stdout)
            } catch (ursache) {
              antworte(
                gescheitert(
                  `ffprobe hat keine lesbare JSON-Ausgabe geliefert: ${textVon(ursache)}` +
                    stderrAnhang(stderr),
                ),
              )
              return
            }

            antworte({ ok: true, wert: roh })
          } catch (unerwartet) {
            // Auffangnetz: Auch ein Fehler in der Auswertung darf nur als
            // Ergebnis-Huelle nach aussen - ein `throw` aus dem Rueckruf landete sonst
            // als unbehandelte Ausnahme im Main-Prozess, und das Versprechen bliebe
            // fuer immer offen. Ein offenes Versprechen im Import haelt die
            // Warteschlange an - derselbe Schaden wie ein haengendes ffprobe.
            antworte(gescheitert(`Unerwarteter Fehler beim Auswerten: ${textVon(unerwartet)}`))
          }
        },
      )
    } catch (unerwartet) {
      // execFile selbst kann werfen, bevor ueberhaupt ein Prozess entsteht (etwa bei
      // einem leeren Binaerpfad); ebenso ermittleFfprobePfad. Auch das ist ein
      // probe_fehler und keine Ausnahme.
      antworte(gescheitert(`ffprobe liess sich nicht starten: ${textVon(unerwartet)}`))
    }
  })
}

/**
 * Beendet den Kindprozess hart, falls er noch laeuft.
 *
 * `exitCode` und `signalCode` sind beide `null`, solange der Prozess lebt; ist einer
 * gesetzt, ist er bereits weg und ein zweites Signal waere bestenfalls wirkungslos.
 * Ohne `pid` wurde nie ein Prozess gestartet (Spawn-Fehler wie ENOENT) - dann gibt es
 * nichts zu toeten.
 *
 * Der Fangzweig ist kein Zierrat: `kill` kann bei einem Signal, das die Plattform nicht
 * kennt, werfen. Diese Funktion darf unter keinen Umstaenden die Antwort verhindern.
 */
function stelleSicherDassBeendet(kind: ChildProcess): void {
  try {
    if (kind.pid !== undefined && kind.exitCode === null && kind.signalCode === null) {
      kind.kill('SIGKILL')
    }
  } catch {
    // bewusst verschluckt - s. oben
  }
}

/** Ein gescheitertes Ergebnis; der einzige fachliche Code dieser Funktion. */
function gescheitert(meldung: string): Ergebnis<unknown, 'probe_fehler'> {
  return { ok: false, fehler: { code: 'probe_fehler', meldung } }
}

/**
 * Baut die Diagnose-Meldung zu einem execFile-Fehler.
 *
 * WICHTIG: Der Fehlercode bleibt in JEDEM dieser Faelle `probe_fehler`. TK 9.4.9 fuehrt
 * "keine Metadaten (beschaedigte Datei) ODER Timeout (gekillt)" unter demselben Code,
 * und der Exit-Code von ffprobe wird nie zum Fehlercode (TK 9.1.1). Unterschiedlich ist
 * allein der TEXT - er dient der Fehlersuche und ist nie Grundlage einer Fallunterschei-
 * dung beim Aufrufer.
 */
function fehlerMeldung(
  fehler: ExecFileException,
  stderr: string,
  binaerPfad: string,
): string {
  if (fehler.code === 'ENOENT' || fehler.code === 'EACCES') {
    // Das ist ein VERPACKUNGSFEHLER, kein Dateiproblem des Nutzers: Das Binary liegt
    // nicht dort, wo es liegen sollte, oder ist nicht ausfuehrbar. Deshalb nennt die
    // Meldung den Pfad - beim Kunden ist er die einzige Spur.
    return `ffprobe liess sich nicht ausfuehren (${String(fehler.code)}): ${binaerPfad}`
  }

  // VOR der killed-Abfrage, nicht danach: Node toetet den Prozess auch beim
  // Pufferueberlauf und setzt dabei ebenfalls `killed`. Umgekehrte Reihenfolge, und
  // jeder Pufferueberlauf meldete beim Kunden eine Zeitueberschreitung - eine Spur, die
  // in die falsche Richtung fuehrt.
  if (fehler.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER') {
    return `Die Ausgabe von ffprobe hat den Ausgabepuffer gesprengt.${stderrAnhang(stderr)}`
  }

  if (fehler.killed === true) {
    return `ffprobe wurde nach Ablauf der Zeitgrenze beendet.${stderrAnhang(stderr)}`
  }

  return `ffprobe ist fehlgeschlagen: ${textVon(fehler)}${stderrAnhang(stderr)}`
}

/** Haengt gekuerzten stderr an eine Meldung an - oder nichts, wenn er leer ist. */
function stderrAnhang(stderr: string): string {
  const gekuerzt = kuerze(stderr)
  return gekuerzt === '' ? '' : ` (ffprobe: ${gekuerzt})`
}

/** Kuerzt auf MELDUNG_ZEICHEN, damit eine geschwaetzige Ausgabe kein Protokoll flutet. */
function kuerze(text: string): string {
  const sauber = text.trim()
  return sauber.length > MELDUNG_ZEICHEN ? `${sauber.slice(0, MELDUNG_ZEICHEN)}...` : sauber
}

/** Der Text eines geworfenen Werts - auch wenn es kein Error war. */
function textVon(ursache: unknown): string {
  return ursache instanceof Error ? ursache.message : String(ursache)
}
