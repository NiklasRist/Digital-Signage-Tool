// GENERIERT aus dem Signaturblock von Issue #172.
// [render-service] Arbeitsbereich T1 anlegen, verwerfen und verwaiste Reste aufräumen
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
// GERUEST-PRUEFSUMME: ba4fbc33762cecbb
//
// ERLEDIGT (14.08.2026): Die Abschaltzeile fuer no-unused-vars ist mit dem Fuellen
// des Rumpfes entfernt - beide Importe und der Parameter werden jetzt benutzt.
//
// ============================================================================
// DIESE DATEI LOESCHT VERZEICHNISSE - REKURSIV, UND EINMAL DAVON UNBEAUFSICHTIGT
// ============================================================================
// `raeumeVerwaisteArbeitsbereiche` laeuft als Startschritt des Programms (#3),
// also bevor jemand hinsieht, und `verwirfArbeitsbereich` loescht mit
// `recursive: true`. Deshalb ist hier - wie in `entferneWaisen` (#88) - JEDE
// Entscheidung nach derselben Asymmetrie gefaellt: Ein liegengebliebener Ordner
// kostet Plattenplatz und verschwindet beim uebernaechsten Start; ein zu weit
// gefasstes Loeschen kostet fremde Daten und ist unwiederbringlich. Im Zweifel
// bleibt etwas liegen.
//
// GELOESCHT WIRD AUSSCHLIESSLICH ein Verzeichnis, das BEIDE Bedingungen erfuellt:
//   - sein Elternverzeichnis IST das Temp-Verzeichnis (`os.tmpdir()`), es ist also
//     ein DIREKTES Kind - kein Enkel, nicht das Temp-Verzeichnis selbst, und
//   - sein Basisname beginnt mit `ARBEITSBEREICH_PRAEFIX`.
// Im Startlauf kommt eine dritte Bedingung hinzu (Alter > `VERWAIST_AB_MS`, s.
// ENTSCHIEDEN 4) und eine vierte: Der Eintrag muss ein ECHTES Verzeichnis sein.
//
// WARUM DIE ELTERN-GLEICHHEIT UND KEIN `startsWith` AUF DEN TEXT: Ein
// Praefix-Vergleich auf Zeichenketten haelt `C:\Users\x\AppData\Local\Temp2` fuer
// einen Teil von `...\Temp`, und `<Temp>/reel-a/../../..` faellt bei ihm ebenfalls
// durch. `path.resolve` + Vergleich des ELTERN-Pfads kann beides nicht: Nach dem
// Aufloesen gibt es keine `..`-Anteile mehr, und `Temp2` ist als Elternteil
// schlicht ein anderer String.
//
// WARUM IM STARTLAUF NUR ECHTE VERZEICHNISSE: `readdir(withFileTypes)` meldet fuer
// eine Verknuepfung bzw. eine Windows-Junction `isDirectory() === false`. Ein
// Eintrag `reel-boese`, der auf `C:\Users\<name>\Dokumente` zeigt, wird hier also
// gar nicht erst angefasst - weder gefolgt noch entfernt. Dieselbe Schranke wie in
// #88 ("Unterordner werden stehen gelassen, nicht betreten"), nur in der
// Gegenrichtung.
//
// KEIN LOCK, KEINE PID-DATEI, KEIN TIMER: "**Kein zweites Lock.** Serialisierung
// von Operationen liefert die Queue (9.3)" (TK 9.4.8, Punkt 9). Und kein
// periodisches Aufraeumen im laufenden Betrieb - der Programmstart ist der einzige
// Zeitpunkt, an dem gefegt wird (STOPP-Block des Issues).
//
// UND HIER LIEGT NIE DIE FERTIGE AUSGABEDATEI. "**T1 bleibt** fuer Segment-PNGs,
// Zwischenclips `seg_*.mp4` und concat-Liste zustaendig (Abschnitt 6)." (TK 9.2.6)
// Das Staging der Enddatei liegt seit TK v2.8 im Projekt-Ausgabeordner, weil
// "Umbenennen [...] nur auf **derselben Partition** unteilbar" ist (TK 9.2.6) und
// ein portabler Datenort auf einem anderen Laufwerk liegen kann - aus <Temp> heraus
// waere das Umbenennen ein `EXDEV`. Diese Datei kennt deshalb nur T1 und baut
// keinen einzigen Pfad im Ausgabeordner.

import { mkdtemp, readdir, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { RenderFehlercode } from './fehlercodes'
import type { Dirent } from 'node:fs'

// Fremde Typen - vollstaendig ausgeschrieben, damit hier nichts geraten wird:
//   #12/#22: type Ergebnis<T, F extends string = GenerischerFehlercode> =
//              | { ok: true; wert: T }
//              | { ok: false; fehler: { code: F | GenerischerFehlercode
//                                       meldung: string; daten?: unknown } }
//   #171:    type RenderFehlercode = 'medium_fehlt' | 'ungueltiges_element'
//              | 'ffmpeg_fehler' | 'kein_platz' | 'speicher_fehler'
//
// Mehr braucht diese Datei nicht. Insbesondere NICHT `ausgabeOrdner` (#49) - T1 und
// Ausgabeordner sind zwei verschiedene Orte auf womoeglich zwei verschiedenen
// Laufwerken - und NICHT `entferneDatei`/`entferneDateiMitRetry` (#86): Ein Import
// aus `src/main/media-service/` waere der erste modulueberschreitende Import
// zwischen zwei Main-Fachdiensten (ENTSCHIEDEN 6). #86 ist das VORBILD der Staffel
// unten, nicht ihre Quelle; es loescht ausserdem eine DATEI (`unlink`), nicht einen
// ORDNER, und liefert einen Fehlercode, den der `render-service` nicht kennt.

/** Namenspräfix aller Arbeitsbereiche – TK Abschnitt 6: `<Temp>/reel-XXXX/`. */
export const ARBEITSBEREICH_PRAEFIX = 'reel-'

/** Ein `reel-*`-Ordner gilt erst nach dieser Zeit als verwaist (Begründung: ENTSCHIEDEN 4). */
export const VERWAIST_AB_MS = 24 * 60 * 60 * 1000

/** Wiederholversuche beim Löschen (Windows-Handles hängen nach). */
export const LOESCH_VERSUCHE = 5
/** Wartezeiten VOR dem 2. bis 5. Versuch, in Millisekunden. */
export const LOESCH_WARTEZEITEN_MS = [50, 100, 200, 400] as const

/**
 * Die Fehlercodes, bei denen ein zweiter Versuch Aussicht auf Erfolg hat
 * (ENTSCHIEDEN 7) - genau diese drei und keinen mehr.
 *
 * `EBUSY`/`EPERM`: Auf Windows blockiert ein noch offenes Handle das Loeschen und
 * das Umbenennen. Hier ist das im Regelfall ein gerade beendetes `ffmpeg`, dessen
 * Handle auf einen Zwischenclip Millisekunden nachhaengt, oder ein Virenscanner.
 * Das vergeht von selbst. `ENOTEMPTY` kommt beim rekursiven Loeschen dazu: Der
 * Ordner wurde geleert, aber eine Datei war belegt und ist noch da.
 *
 * `EACCES` (kein Recht), `EROFS` (Datentraeger nur lesbar) und `EIO` bessern sich
 * durch Warten NICHT - dort waere die Staffel nur eine Verzoegerung mit demselben
 * Ausgang, und sie hielte die streng serielle Warteschlange (NFA-09) auf.
 *
 * Auf macOS wird dieser Pfad im Normalfall nie betreten (dort gelingt das Loeschen
 * auch bei offenem Handle). Das ist der gewuenschte Zustand und kein Hinweis, dass
 * die Wiederholung ueberfluessig waere - dieselbe Plattform-Falle wie in #86.
 */
const WIEDERHOLBAR: readonly string[] = ['EBUSY', 'EPERM', 'ENOTEMPTY']

/** Der erste Versuch laeuft sofort - benannt, damit im Ablauf unten keine nackte 0 steht. */
const SOFORT = 0

/**
 * Die Wartezeit VOR jedem der `LOESCH_VERSUCHE` Versuche; der erste laeuft sofort.
 *
 * ABGELEITET aus BEIDEN Konstanten der Signatur, statt eine von ihnen zu ignorieren.
 * Heute passen sie zusammen (1 sofortiger + 4 gestaffelte = 5), aber es sind zwei
 * getrennt gepflegte Werte: Wer spaeter nur einen von beiden aendert, bekaeme sonst
 * lautlos etwas anderes, als die Konstante behauptet. Hier gilt in jedem Fall
 * `LOESCH_VERSUCHE` als Anzahl - fehlen Eintraege in der Staffel, wird die letzte
 * Wartezeit wiederholt (und NICHT sofort erneut versucht, was aus der Wiederholung
 * eine Beschaeftigungsschleife machte).
 *
 * Gesamtwartezeit heute: 750 ms - "knapp eine Sekunde", wie ENTSCHIEDEN 8 es
 * vorgibt. Die Warteschlange ist streng seriell; diese Zeit steht dem ganzen
 * Programm still.
 */
const WARTESTAFFEL: readonly number[] = bauWartestaffel()

function bauWartestaffel(): readonly number[] {
  const letzte = LOESCH_WARTEZEITEN_MS[LOESCH_WARTEZEITEN_MS.length - 1] ?? SOFORT
  const staffel: number[] = []
  for (let versuch = 0; versuch < LOESCH_VERSUCHE; versuch += 1) {
    if (versuch === 0) {
      staffel.push(SOFORT)
      continue
    }
    // `?? letzte` statt `!`: `noUncheckedIndexedAccess` ist an, und die Fluchttuer
    // `[...]!` ist projektweit verboten (#193).
    staffel.push(LOESCH_WARTEZEITEN_MS[versuch - 1] ?? letzte)
  }
  return staffel
}

/**
 * Das Temp-Verzeichnis - die EINE Stelle, an der es bestimmt wird (ENTSCHIEDEN 2).
 *
 * Alle drei exportierten Funktionen fragen hier; damit reden das Anlegen, die
 * Schranke des Verwerfens und der Startlauf nachweislich vom selben Ort. Stuende
 * `tmpdir()` an drei Stellen, koennte eine davon spaeter still abweichen - und eine
 * abweichende Schranke ist entweder wirkungslos oder loescht am falschen Ort.
 *
 * `os.tmpdir()` und NICHT `app.getPath('temp')`: Beide liefern auf Windows und
 * macOS denselben Ort, aber `os.tmpdir()` haelt diese Datei frei von einer
 * Electron-Abhaengigkeit und damit ohne Attrappe testbar (ENTSCHIEDEN 2). Der Wert
 * wird bei JEDEM Aufruf frisch geholt und nicht in ein Modul-Konstante eingefroren:
 * Ein eingefrorener Wert waere beim Testen nur noch ueber die Import-Reihenfolge
 * beeinflussbar, und genau die Schranke dieser Datei will pruefbar sein.
 */
function tempVerzeichnis(): string {
  return tmpdir()
}

/**
 * Legt einen neuen, garantiert eindeutigen Arbeitsbereich an und liefert seinen absoluten Pfad.
 * Der Ordner existiert nach erfolgreicher Rückkehr und ist leer.
 */
export async function erzeugeArbeitsbereich(): Promise<Ergebnis<string, RenderFehlercode>> {
  try {
    // `mkdtemp` und NICHT `mkdir` mit selbst gebautem Namen (ENTSCHIEDEN 1): Name und
    // Ordner entstehen in EINEM Schritt, es gibt also kein Zeitfenster, in dem zwei
    // Laeufe denselben Namen waehlen. Der Name wird ausdruecklich NICHT aus der
    // `renderId` gebildet - ein Wiederholungsversuch (Q2, FA-17) traegt DIESELBE
    // `renderId` wie der gescheiterte Lauf davor, der Ordner kollidierte also genau
    // dann, wenn ohnehin schon etwas schiefgegangen ist, und die concat-Liste des
    // zweiten Laufs griffe auf halb geschriebene Zwischenclips des ersten zu. `-c copy`
    // braeche dabei NICHT ab (TK 9.2.6) - es entstuende ein Video, das am Fernseher
    // nach wenigen Sekunden einfriert.
    //
    // Der Ordner bleibt LEER: kein `png/`, kein `clips/`, keine Platzhalterdatei
    // (ENTSCHIEDEN 9). Der Ordnerbaum in TK Abschnitt 6 zeigt alles flach:
    // "<Temp>/reel-XXXX/            # C/T1: fluechtig (PNG, seg_*.mp4, concat.txt) -
    // NUR Zwischenprodukte".
    const pfad = await mkdtemp(path.join(tempVerzeichnis(), ARBEITSBEREICH_PRAEFIX))
    return { ok: true, wert: pfad }
  } catch (ursache) {
    const code = systemCode(ursache)

    if (code === '') {
      // Keine Systemfehler-Kennung - also keine Aussage der Platte, sondern etwas
      // Unerwartetes. "Eine rohe Exception-Meldung wird nie zum Code" (TK 9.1.1):
      // Der Text reist als Begruendung mit, der Code ist `unbekannter_fehler`.
      return fehler(
        'unbekannter_fehler',
        `Der Arbeitsbereich liess sich nicht anlegen. Grund: ${textVon(ursache)}`,
      )
    }

    // Die errno-Abbildung dieses Moduls, Wort fuer Wort dieselbe wie in #175 (PNGs in
    // T1), #177 (Zwischenclips in T1) und #180 (Ausgabedatei): `ENOSPC` -> kein_platz,
    // jeder andere Schreibfehler -> speicher_fehler, der Code des Betriebssystems
    // IMMER nur in der `meldung`, NIE im `code`. Weichen die vier Dateien
    // voneinander ab, ist das ein Vertragsfehler - dann melden, nicht hier anders
    // entscheiden.
    if (code === 'ENOSPC') {
      return fehler(
        'kein_platz',
        `Im Temp-Verzeichnis ${tempVerzeichnisOderUnbekannt()} ist kein Platz mehr fuer den ` +
          `Arbeitsbereich des Renders (ENOSPC). Bitte Platz auf der Systemplatte schaffen.`,
      )
    }

    // `EACCES`, `EPERM`, `EROFS` und alles Uebrige: Der Ort ist da, aber nicht
    // beschreibbar (verwaltete Umgebung, schreibgeschuetztes Temp). Kein Ordner ist
    // entstanden.
    //
    // VERMERK FUER DEN AUFTRAGGEBER (steht so auch im Issue): Die als vollstaendig
    // gefuehrte Tabelle in TK 9.2.3 beschreibt `speicher_fehler` als Fehler am ZIEL
    // und meint damit den Ausgabeordner; fuer einen Nicht-Platz-Fehler IN T1 benennt
    // sie keinen Code. Gewaehlt ist `speicher_fehler`, weil es derselbe Fehlerfall
    // derselben Klasse ist und die Handlungsanweisung ("Rechte pruefen, wiederholen")
    // woertlich passt. Das ist eine Auslegung, keine Vorgabe.
    return fehler(
      'speicher_fehler',
      `Der Arbeitsbereich liess sich im Temp-Verzeichnis ${tempVerzeichnisOderUnbekannt()} ` +
        `nicht anlegen (${code}). Bitte die Schreibrechte pruefen und den Render wiederholen.`,
    )
  }
}
// - liefert bei jedem Aufruf einen ANDEREN, existierenden, LEEREN Ordner
// - der Ordner liegt als direktes Kind im Temp-Verzeichnis und heisst `reel-` + Zufall
// - kein Unterordner, keine Platzhalterdatei, kein Pfad im Ausgabeordner
// - wirft nie; jeder Fehler wird zum Ergebnis (TK 9.1.1)

/**
 * Entfernt einen Arbeitsbereich samt Inhalt. Bestmöglich, mit Wiederholung – und OHNE
 * Ergebnis-Hülle: ein misslungenes Aufräumen darf den Ausgang eines Laufs NIE verändern
 * (Begründung: ENTSCHIEDEN 5). Wirft nie.
 */
export async function verwirfArbeitsbereich(pfad: string): Promise<void> {
  // EIN Fangnetz um den ganzen Rumpf. Diese Funktion wird in ALLEN DREI Ausgaengen
  // eines Laufs gerufen (Erfolg, Fehlschlag, Abbruch - TK 9.2.3), auch im
  // Fehlerpfad des Aufrufers. Eine durchgereichte Ausnahme wuerde dort die
  // Fehlerbehandlung selbst zum Absturz bringen.
  try {
    // DIE SCHRANKE. Kein Formalismus: Zwei Zeilen weiter steht ein rekursives
    // Loeschen. Ein leerer, falscher oder fremder Pfad darf niemals in ein `rm -r`
    // auf das Temp-Verzeichnis oder gar auf die Wurzel muenden. Geprueft wird VOR
    // dem ersten Dateisystemzugriff - es wird kein Ordner gelesen und nichts
    // angefasst.
    if (!istArbeitsbereich(pfad)) {
      // Ein Programmierfehler im Main, kein Zustand der Platte: Der einzige
      // vorgesehene Eingang ist ein Pfad, den `erzeugeArbeitsbereich` geliefert hat.
      // Nach aussen geschieht NICHTS - kein Loeschversuch, keine Ausnahme, kein
      // Ergebnis; sichtbar bleibt es nur im Protokoll des Hauptprozesses.
      protokolliere(
        'ein Pfad ausserhalb des Temp-Verzeichnisses oder ohne Praefix wurde nicht angefasst',
        pfad,
      )
      return
    }

    let letzterCode = ''

    // Die Schleife laeuft ueber die Wartezeiten statt ueber einen Zaehler - so gibt es
    // keinen Feldzugriff, der wegen `noUncheckedIndexedAccess` `undefined` liefern
    // koennte, und damit auch keine Versuchung zum verbotenen `!` (#193). Hausform
    // aus #46/#31/#86.
    for (const warteMs of WARTESTAFFEL) {
      if (warteMs > SOFORT) {
        await warte(warteMs)
      }

      try {
        // `recursive: true` ist hier - anders als bei `entferneDatei` (#86) - zwingend:
        // Ein Arbeitsbereich ist ein ORDNER mit Dutzenden Dateien (Segment-PNGs,
        // `seg_*.mp4`, `concat.txt`).
        //
        // `force: true` macht ein bereits fehlendes Ziel zum Erfolg. Der Zweck dieser
        // Funktion ist der ZUSTAND "dieser Ordner existiert nicht mehr", nicht die
        // Handlung "ich habe geloescht" - dieselbe Begruendung wie in #86. Ein
        // fehlender Ordner ist der Normalfall, wenn der Abbruch (#179) und der
        // Ablauf um den Lauf herum (#181) beide aufraeumen.
        //
        // `maxRetries` wird ABSICHTLICH nicht gesetzt, obwohl `fs.rm` das anbietet:
        // Das waeren zwei Wiederholungsmechanismen uebereinander, mit zwei Staffeln,
        // von denen nur eine hier sichtbar ist - und die Obergrenze aus ENTSCHIEDEN 8
        // waere nicht mehr die Obergrenze.
        await rm(pfad, { recursive: true, force: true })
        return
      } catch (ursache) {
        const code = systemCode(ursache)
        if (code === 'ENOENT') {
          // Mit `force: true` kann das kaum auftreten; die Zeile steht trotzdem, weil
          // "war schon weg" in JEDEM Fall Erfolg ist und nicht in die Wartestaffel
          // laufen darf.
          return
        }

        letzterCode = code
        if (!WIEDERHOLBAR.includes(code)) {
          // Sofort aufgeben, OHNE Wartezeit (ENTSCHIEDEN 7). Der Ordner bleibt liegen
          // und wird vom naechsten Programmstart geholt.
          protokolliere(`${path.basename(pfad)} liess sich nicht entfernen (${code})`, ursache)
          return
        }
      }
    }

    // Alle Versuche verbraucht. KEIN Fehler nach oben (ENTSCHIEDEN 5): Ein
    // erfolgreicher Render, dessen Aufraeumen an einem nachhaengenden Windows-Handle
    // scheitert, ist ein ERFOLGREICHER Render - die fertige Datei liegt bereits im
    // Ausgabeordner. Wuerde das Aufraeumen den Lauf scheitern lassen, zerstoerte eine
    // Nebensaechlichkeit ein minutenlanges Ergebnis. Der Preis ist ein
    // liegengebliebener Ordner, und genau dafuer gibt es
    // `raeumeVerwaisteArbeitsbereiche`.
    protokolliere(
      `${path.basename(pfad)} war auch nach ${LOESCH_VERSUCHE} Versuchen noch belegt ` +
        `(${letzterCode}); der Ordner bleibt liegen und wird beim naechsten Programmstart entfernt`,
      pfad,
    )
  } catch (ursache) {
    protokolliere('das Verwerfen des Arbeitsbereichs ist unerwartet gescheitert', ursache)
  }
}
// - loescht NUR ein direktes Kind des Temp-Verzeichnisses, dessen Name mit `reel-` beginnt
// - bei jedem anderen Eingang wird `rm` KEIN EINZIGES MAL gerufen
// - wiederholt nur bei EBUSY/EPERM/ENOTEMPTY, hoechstens LOESCH_VERSUCHE Mal
// - wirft nie, liefert nichts, meldet keinen Fehlschlag nach oben

/**
 * Entfernt beim Programmstart alle verwaisten `reel-*`-Ordner aus dem Temp-Verzeichnis und liefert
 * die Anzahl der entfernten Ordner (nur für Protokoll und Test). Wirft nie.
 */
export async function raeumeVerwaisteArbeitsbereiche(): Promise<number> {
  try {
    const temp = tempVerzeichnis()

    let eintraege: Dirent[]
    try {
      eintraege = await readdir(temp, { withFileTypes: true })
    } catch (ursache) {
      // "Der Programmstart darf daran nie scheitern" (Fehlertabelle des Issues). Ein
      // nicht lesbares Temp-Verzeichnis ist ein Grund, nicht aufzuraeumen - kein
      // Grund, die Anwendung nicht zu starten.
      protokolliere('das Temp-Verzeichnis liess sich nicht lesen', ursache)
      return 0
    }

    const jetzt = Date.now()
    let entfernt = 0

    for (const eintrag of eintraege) {
      // NUR ECHTE VERZEICHNISSE. Eine Verknuepfung oder eine Windows-Junction meldet
      // hier `false` und wird damit weder betreten noch entfernt - s. den Kopf dieser
      // Datei. Eine gleichnamige DATEI (`reel-notizen.txt`) bleibt aus demselben Grund
      // liegen: Diese Datei legt in <Temp> nur Ordner an, alles andere hat sie nicht
      // erzeugt und raeumt sie nicht weg.
      if (!eintrag.isDirectory()) {
        continue
      }

      if (!eintrag.name.startsWith(ARBEITSBEREICH_PRAEFIX)) {
        continue
      }

      // Der Pfad entsteht aus dem Temp-Verzeichnis plus dem Namen, den das
      // Betriebssystem beim Auflisten geliefert hat - ein Name aus dem Verzeichnis
      // selbst kann per Konstruktion nicht aus ihm ausbrechen. Trotzdem laeuft er
      // gleich noch durch dieselbe Schranke wie jeder fremde Pfad: Die Pruefung sitzt
      // in `verwirfArbeitsbereich`, damit es sie nur EINMAL gibt.
      const pfad = path.join(temp, eintrag.name)

      let geaendert: number
      try {
        geaendert = (await stat(pfad)).mtimeMs
      } catch (ursache) {
        // Zwischen Auflisten und Pruefen verschwunden oder nicht lesbar. Liegen
        // lassen - ohne Alter gibt es keine Grundlage fuer ein rekursives Loeschen.
        protokolliere(`${eintrag.name} liess sich nicht pruefen und bleibt liegen`, ursache)
        continue
      }

      // ENTSCHIEDEN 4 - DIE WICHTIGSTE ZEILE DIESER FUNKTION. Ein pauschales "alle
      // reel-* beim Start loeschen" waere der gefaehrlichste Fehlgriff der Datei: Die
      // Einzel-Instanz-Sperre ist an den DATENORT gebunden, nicht an das Programm
      // ("Die Sperre muss an den **Datenort** gebunden sein (den App-Ordner mit
      // `projects/`), nicht an den Programmpfad.", TK 9.5.4). Zwei Kopien der
      // portablen EXE mit VERSCHIEDENEN Datenorten duerfen gleichzeitig laufen und
      // teilen sich dasselbe <Temp>. Ein Start der einen loeschte dann den
      // Arbeitsbereich eines gerade laufenden Renders der anderen - mitten im Lauf.
      //
      // Die Altersschranke schliesst das aus: Ein Render dauert Minuten, nie einen
      // Tag. Massgeblich ist die AENDERUNGSZEIT des Ordners; sie wird bei jedem
      // Anlegen und Entfernen einer Datei darin fortgeschrieben, ein aktiver Lauf
      // haelt seinen Ordner also automatisch jung. Ein Ordner, der einen Tag zu lange
      // liegen bleibt, kostet nichts - er verschwindet beim uebernaechsten Start.
      //
      // Ein Zeitstempel in der ZUKUNFT (falsch gestellte Uhr, Zeitumstellung) ergibt
      // ein negatives Alter und faellt damit ebenfalls durch die Pruefung. Auch das
      // ist die sichere Richtung.
      if (jetzt - geaendert < VERWAIST_AB_MS) {
        continue
      }

      await verwirfArbeitsbereich(pfad)

      // GEZAEHLT WIRD, WAS WIRKLICH WEG IST - nicht, was versucht wurde. Die Zahl
      // reist ins Startprotokoll und in den Test; ein belegter Ordner, der die ganze
      // Staffel ueberstanden hat, darf darin nicht als entfernt erscheinen.
      // `verwirfArbeitsbereich` kann das nicht melden (ENTSCHIEDEN 5: keine Huelle,
      // kein Rueckgabewert), also wird hier einmal nachgesehen. Das ist KEINE
      // Nachkontrolle des Loeschens im Sinne von #86, sondern die einzige Quelle
      // dieser Zahl.
      if (!(await existiertNoch(pfad))) {
        entfernt += 1
      }
    }

    return entfernt
  } catch (ursache) {
    // Letztes Fangnetz. Diese Funktion laeuft als Startschritt (#3) und darf den
    // Start unter keinen Umstaenden abbrechen.
    protokolliere('das Aufraeumen verwaister Arbeitsbereiche ist unerwartet gescheitert', ursache)
    return 0
  }
}
// - liest ausschliesslich das Temp-Verzeichnis; kein D1-, kein D2-, kein Q-Zugriff
// - entfernt nur ECHTE Verzeichnisse mit Praefix `reel-`, die aelter als VERWAIST_AB_MS sind
// - laesst frische Arbeitsbereiche (auch die einer zweiten Instanz) unangetastet
// - wirft nie; ein nicht lesbares Temp-Verzeichnis ergibt 0

/**
 * Die Schranke vor dem rekursiven Loeschen: Ist das ein Arbeitsbereich dieser App?
 *
 * ZWEI BEDINGUNGEN, beide notwendig:
 *  1. Das ELTERNVERZEICHNIS des aufgeloesten Pfads ist das Temp-Verzeichnis. Damit
 *     scheitern `''`, jeder Pfad ausserhalb, das Temp-Verzeichnis SELBST (sein
 *     Elternteil ist ein anderer), jeder Enkel (`<Temp>/reel-a/unterordner`) und
 *     jeder Ausbruchsversuch mit `..` (den loest `path.resolve` vorher auf).
 *  2. Der Basisname beginnt mit `ARBEITSBEREICH_PRAEFIX`.
 *
 * `typeof` trotz `string` in der Signatur: Der Aufrufer ist ein Auftrags-Handler,
 * dessen Eingaben aus JSON stammen koennen (Q2-Wiederholung) - "Der Main validiert
 * jede eingehende Nutzlast" (TK 9.1.1, Punkt 6).
 *
 * Der Vergleich ist auf Windows ohne Ruecksicht auf Gross-/Kleinschreibung, weil NTFS
 * es auch ist: `C:\Users\...\Temp` und `c:\users\...\temp` bezeichnen denselben
 * Ordner, und eine Schranke, die den einen durchlaesst und den anderen nicht, waere
 * von der Schreibweise des Aufrufers abhaengig. Auf macOS/Linux wird exakt
 * verglichen - dort sind es tatsaechlich zwei verschiedene Orte.
 */
function istArbeitsbereich(pfad: unknown): pfad is string {
  if (typeof pfad !== 'string' || pfad.trim() === '') {
    return false
  }

  let ziel: string
  let temp: string
  try {
    ziel = path.resolve(pfad)
    temp = path.resolve(tempVerzeichnis())
  } catch {
    // `path.resolve` kann an einer voellig unbrauchbaren Eingabe scheitern. Dann gilt
    // die sichere Richtung: nicht anfassen.
    return false
  }

  if (!path.basename(ziel).startsWith(ARBEITSBEREICH_PRAEFIX)) {
    return false
  }

  return gleicherOrt(path.dirname(ziel), temp)
}

/** Pfadvergleich mit der Gross-/Kleinschreibung des jeweiligen Dateisystems. */
function gleicherOrt(einer: string, anderer: string): boolean {
  if (process.platform === 'win32') {
    // `toLowerCase` und NICHT `toLocaleLowerCase`: Letzteres haengt an der
    // Spracheinstellung des Rechners (im Tuerkischen wird aus `I` kein `i`, sondern
    // `i` ohne Punkt). Eine Schranke, die je nach Systemsprache anders entscheidet,
    // waere nicht pruefbar - dieselbe Ueberlegung wie in #88.
    return einer.toLowerCase() === anderer.toLowerCase()
  }
  return einer === anderer
}

/** Existiert der Pfad noch? Nur fuer die Zaehlung des Startlaufs. */
async function existiertNoch(pfad: string): Promise<boolean> {
  try {
    await stat(pfad)
    return true
  } catch {
    return false
  }
}

/**
 * Ein echtes `await` auf einen Timer, KEINE Beschaeftigungsschleife: Eine
 * `while`-Schleife auf die Uhr blockierte den Main-Prozess und damit die gesamte
 * Oberflaeche (ENTSCHIEDEN 7).
 */
async function warte(ms: number): Promise<void> {
  await new Promise<void>((weiter) => setTimeout(weiter, ms))
}

/**
 * Liest den `code` eines Node-Systemfehlers, ohne ihn auf einen Typ zu zwingen, den er
 * nicht hat. Leerer String = kein verwertbarer Code (etwa bei einer unerwarteten
 * Ausnahme, die gar kein Systemfehler ist).
 */
function systemCode(ursache: unknown): string {
  if (typeof ursache !== 'object' || ursache === null || !('code' in ursache)) {
    return ''
  }
  const code = (ursache as { code?: unknown }).code
  return typeof code === 'string' ? code : ''
}

/** Der Text einer Ausnahme, ohne Stacktrace - der reist nicht ueber die Grenze. */
function textVon(ursache: unknown): string {
  return ursache instanceof Error ? ursache.message : String(ursache)
}

/**
 * Das Temp-Verzeichnis fuer die Fehlermeldung.
 *
 * Die Fehlertabelle des Issues verlangt ausdruecklich, dass die Meldung "das
 * Temp-Verzeichnis und den Grund" nennt - deshalb steht hier ein absoluter Pfad in
 * einer Meldung, die ueber IPC bis in die Oberflaeche reist. Das ist die Ausnahme,
 * nicht die Regel (TK 9.5.7: der Renderer sieht sonst "nur relative Referenzen"), und
 * sie ist begruendet: Ohne den Ort kann der Nutzer weder Platz schaffen noch Rechte
 * pruefen, und der Ort ist kein Bestandteil seiner Projektdaten.
 *
 * Eigenes `try`, weil diese Funktion IN einer Fehlerbehandlung laeuft: Scheitert
 * `tmpdir()` selbst, darf daraus keine zweite Ausnahme werden, die den ersten Fehler
 * verschluckt.
 */
function tempVerzeichnisOderUnbekannt(): string {
  try {
    return tempVerzeichnis()
  } catch {
    return '(unbekannt)'
  }
}

/**
 * "Intern protokolliert" - die Hausform aus `reconcile-waisen.ts` (#88) und dem
 * `auftrags-manager`: `console.error` im HAUPTPROZESS, mit Modul-Praefix.
 *
 * Kein eigener Logger, keine Log-Datei, nichts davon erreicht den Renderer. Ohne
 * diese Zeilen waere ein dauerhaft unloeschbarer Arbeitsbereich voellig unauffindbar:
 * Nach aussen bleibt von ihm nur eine um eins kleinere Zahl - und beim Verwerfen
 * nicht einmal das (ENTSCHIEDEN 5: "Ein Fehlschlag wird intern protokolliert, nicht
 * verschwiegen").
 */
function protokolliere(stelle: string, ursache: unknown): void {
  console.error(`[render-service] Arbeitsbereich: ${stelle}:`, ursache)
}

/**
 * Die Fehlerhuelle. Ohne `daten`: Das Feld ist optional, und kein Code dieser Datei
 * traegt Zusatzdaten (`ElementFehlerdaten` aus #171 gehoert zu `medium_fehlt` und
 * `ungueltiges_element` - hier entsteht keiner von beiden).
 *
 * Niemals `throw`: Der Aufrufer ist ein Auftrags-Handler, dessen Ergebnis ueber die
 * IPC-Grenze reist; dort ueberlebt eine Ausnahme nur als Text, Fehlerklasse und
 * `code` gingen verloren (TK 9.1.1).
 */
function fehler(
  code: RenderFehlercode | 'unbekannter_fehler',
  meldung: string,
): Ergebnis<string, RenderFehlercode> {
  return { ok: false, fehler: { code, meldung } }
}

// NICHT HIER, UND GEMELDET:
//
// 1. KEIN AUFRUF VON `raeumeVerwaisteArbeitsbereiche` IN DIESER DATEI und keine
//    Selbstanmeldung. `src/main/index.ts` (#3) fuehrt den Aufruf als Startschritt 8
//    heute nur als LUECKE ("LUECKE. Entfernt reel-*-Ordner, die ein frueherer Absturz
//    im Temp-Bereich hinterlassen hat."). Solange dieser Nachzug offen ist, existiert
//    die Funktion, laeuft aber nie - dieselbe Nacharbeit wie die Erweiterung der
//    Anmeldeliste in #3.
//
// 2. KEIN AUFRAEUMEN "VOR JEDEM RENDER" und kein Intervall. Genau das traefe den
//    Arbeitsbereich einer zweiten Instanz mit anderem Datenort; der Programmstart ist
//    der einzige Zeitpunkt (STOPP-Block des Issues).
//
// 3. DIE STAFFEL WEICHT BEWUSST VON DER HAUSVORGABE AB. `schreibe-projekt.ts` (#46),
//    `schreibe-config.ts` (#31), `schreibe-queue-json.ts` und `datei-entfernen.ts`
//    (#86) warten 100/200/400/800 ms; hier stehen laut verbindlicher Signatur
//    50/100/200/400 ms. Das ist kein Versehen, sondern ENTSCHIEDEN 8: Dort entscheidet
//    der Wert darueber, ob eine offene Loeschung oder ein verlorener Schreibvorgang
//    entsteht; hier hat ein Fehlschlag keine Folge ausser einem Ordner, den der
//    naechste Start entfernt - und die Obergrenze bleibt bei knapp einer Sekunde,
//    damit die serielle Warteschlange nicht spuerbar haengt. Faellt die offene Frage
//    in #86 spaeter anders aus, ist HIER nur `LOESCH_WARTEZEITEN_MS` nachzuziehen.
//
// 4. KEINE PRUEFUNG, OB DER ORDNER LEER IST, und kein Zaehlen seines Inhalts. Wer den
//    Arbeitsbereich fuellt (#175, #177), raeumt nicht auf; wer ihn verwirft, sieht
//    nicht hinein.
//
// 5. KEIN `fsync` AUF DAS VERZEICHNIS nach dem Anlegen. Unter Windows gibt es das
//    nicht, und T1 ist per Definition fluechtig - ein Arbeitsbereich, der einen
//    Stromausfall nicht ueberlebt, hat genau das getan, was er soll.
