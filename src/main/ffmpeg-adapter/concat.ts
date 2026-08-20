// GENERIERT aus dem Signaturblock von Issue #169.
// [ffmpeg-adapter] concat-Liste schreiben und verlustfrei verketten
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
// GERUEST-PRUEFSUMME: 5157f82f54b053bc
//
// ERLEDIGT (15.08.2026): Rumpf gefuellt, die dateiweite Abschaltzeile
// (@typescript-eslint/no-unused-vars) ist damit entfernt - jeder Parameter und
// jeder Import wird jetzt benutzt.
//
// ---------------------------------------------------------------------------
// NACHGEMESSEN, NICHT BEHAUPTET (15.08.2026, ffmpeg 6.1.1 aus ffmpeg-static,
// dem Binary aus #6; Windows x64)
// ---------------------------------------------------------------------------
// Die Escaping-Regeln der concat-Liste sind der Kern dieses Issues, und sie sind
// NICHT aus der Erinnerung uebernommen, sondern gefahren worden. Aufbau: drei
// Zwischenclips (320x180, 30 fps, 1 s, stille AAC-Spur) in einem Ordner, dessen
// Name ein LEERZEICHEN und einen APOSTROPH traegt:
//
//   ...\scratchpad\cc\Max O'Neil dir\seg 1.mp4   (usw.)
//
// Gefahren wurde derselbe Aufruf mit drei verschiedenen Listen und zusaetzlich
// zweimal mit weggelassenem Argument:
//
//   Liste / Aufruf                                | Exit | Befund
//   ----------------------------------------------|------|--------------------------
//   A: file '...Max O'\''Neil dir\seg 1.mp4'      |   0  | 90 Bilder = 3 x 30, 3,022 s
//   B: ohne Anfuehrungszeichen                    | 127  | "Impossible to open
//                                                 |      | 'C:UsersacerAppData...Max'"
//   C: Backslashes VERDOPPELT, sonst wie A        | 127  | "Impossible to open
//                                                 |      | '...\\Max O\Neil'"
//   A, aber ohne die unsichere Betriebsart        | 127  | "Unsafe file name '...'"
//   A, aber ohne die Formatangabe, Ziel .part     | 127  | "Unable to choose an output
//                                                 |      | format for '....mp4.part'"
//
// WAS DARAN LEHRREICH IST:
//
//   - B belegt BEIDE Fallen der unangefuehrten Zeile auf einmal: Die Backslashes
//     sind SPURLOS VERSCHWUNDEN (ffmpegs Zeilen-Parser liest sie ausserhalb der
//     Anfuehrung als Escape-Zeichen und wirft sie weg), und das Leerzeichen hat
//     den Pfad zusaetzlich abgeschnitten - der Rest der Zeile wurde als zweites
//     Feld gelesen. Uebrig blieb "...Max". Wer aus dem Windows-Alltag schliesst,
//     ein Pfad ohne Leerzeichen brauche keine Anfuehrung, verliert trotzdem jeden
//     Backslash.
//   - C ist der Fehler, den man aus GUTEM WILLEN macht ("Backslashes muss man
//     doch escapen"). Er fuehrt zu einer Meldung, die einen Pfad nennt, der auf
//     dem Bildschirm fast richtig aussieht.
//   - Beide Fehlversuche brechen hier LAUT ab, weil die Datei unter dem falschen
//     Namen nicht existiert. Das ist Glueck, kein Vertrag: Existierte dort eine
//     andere Datei, verkettete der Lauf sie klaglos.
//
// ZWEITER BEFUND DERSELBEN MESSREIHE - EIN FEHLENDES SEGMENT MELDET ERFOLG:
//
//   fehlt das ERSTE Segment      -> Exit 127, "Error opening input file"
//   fehlt ein SPAETERES Segment  -> EXIT 0, Ausgabedatei entsteht, ABGESCHNITTEN
//
// Im zweiten Fall steht der Grund NUR auf stderr ("Impossible to open ... | Error
// during demuxing"), waehrend der Rueckgabewert Erfolg sagt; nachgezaehlt waren es
// bei drei Segmenten mit einer Luecke an Position 2 genau 30 statt 90 Bilder. Diese
// Datei repariert das NICHT und darf es nicht: Sie ueberbrueckt keine fehlende
// Zwischendatei und deutet das Ergebnis von #158 nicht. Gefangen wird der Fall von
// der Verifikation in #180 (Dauer der fertigen Datei gegen die Solldauer, feste
// Toleranz 0,5 s). Wer diese Verifikation eines Tages fuer entbehrlich haelt, moege
// diese Zeilen lesen: Ohne sie gaebe es gegen den Fall KEINE Sicherung.
//
// Die erfolgreiche Ausgabe wurde mit ffprobe gegengeprueft: 90 Videobilder (= die
// Summe der drei Segmente, kein stiller Verlust), Tonspur vorhanden, und die ersten
// Bytes lauten `ftyp...moov` - der Index steht also VOR den Mediendaten, die
// Container-Argumente aus #162 wirken an dieser Stelle wie vorgesehen.

import type { RenderProfile } from '../../shared/contracts/render-profile'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { fuehreFfmpegAus } from './prozess'                     // #158
import type { FfmpegFehlercode, FfmpegLauf } from './prozess'  // #158

import { writeFile } from 'node:fs/promises'

import { baueContainerArgumente } from './tonspur'              // #162

/**
 * Die Nutzdaten von `unbekannter_fehler` - MODULWEIT dieselbe Form, wortgleich mit
 * #170 (dort steht dieselbe Deklaration mit derselben Begruendung).
 *
 * Alle drei Felder sind optional; jede Stelle setzt genau die, die sie kennt: Diese
 * Datei setzt beim Schreiben der Liste `systemFehlercode` und `datei`, #170 beim
 * gescheiterten ffprobe-Aufruf `datei` und `stderrAuszug`. TK 9.1.1 verlangt, dass die
 * Form "je Fehlercode festgelegt und typisiert" ist - JE FEHLERCODE, nicht je
 * Fundstelle: Zwei Formen fuer einen Code zwaengen den render-service (#177/#181) beim
 * Auswerten zu raten, welche Variante er vor sich hat - und mit dem uebersehenen Feld
 * ginge die Unterscheidung kein_platz <-> speicher_fehler (TK 9.2.3) verloren.
 */
interface Fehlerdaten {
  systemFehlercode?: string
  datei?: string
  stderrAuszug?: string
}

/**
 * Baut den TEXTINHALT der concat-Liste. Reine Funktion – schreibt nichts.
 * Die Reihenfolge des Arrays IST die Wiedergabereihenfolge und wird nicht verändert.
 * Exportiert, damit es testbar ist: Der Listeninhalt laesst sich so ohne Dateisystem und ohne
 * ffmpeg vollstaendig pruefen. Gerufen wird die Funktion ausschliesslich modulintern von
 * `fuehreConcatAus`.
 */
export function baueConcatListe(segmentPfade: string[]): Ergebnis<string> {
  // Gegen die Wirklichkeit geprueft, nicht gegen den Typ: Der Aufruf reist durch den
  // Main, und "Niemals `throw`" ist Vertrag (TK 9.1.1).
  if (!Array.isArray(segmentPfade) || segmentPfade.length === 0) {
    return ungueltig('Keine Elemente zu verketten: die Liste der Zwischenclips ist leer.')
  }

  // Der erste Fundort je Pfad - fuer die Duplikat-Meldung, die BEIDE Indizes nennt.
  const ersterFundort = new Map<string, number>()

  for (const [index, pfad] of segmentPfade.entries()) {
    const pfadFehler = pruefePfad(pfad, `Zwischenclip an Position ${String(index)}`)
    if (pfadFehler !== null) return pfadFehler

    const zuvor = ersterFundort.get(pfad)
    if (zuvor !== undefined) {
      // KEIN stillschweigendes Entfernen: Ein Duplikat ist immer ein Fehler weiter
      // oben (im render-service). Zweimal dasselbe Segment einzubinden verlaengerte
      // die fertige Ausgabe unbemerkt - und niemand im Studio koennte das deuten.
      return ungueltig(
        `Der Zwischenclip ${beschreibe(pfad)} steht doppelt in der Liste ` +
          `(Position ${String(zuvor)} und ${String(index)}).`,
      )
    }
    ersterFundort.set(pfad, index)
  }

  // Die Reihenfolge des Arrays IST die Wiedergabereihenfolge (TK 9.2.1): nicht
  // sortiert, nicht nach Dateinamen geordnet, nicht dedupliziert. Eine Sortierung
  // saehe richtig aus und waere eine zweite Wahrheit neben der uebergebenen Liste.
  //
  // Abschliessender Zeilenumbruch auch nach der letzten Zeile; LF, nie CRLF - die
  // Datei wird von ffmpegs Parser gelesen, nicht von einem Windows-Editor.
  return {
    ok: true,
    wert: segmentPfade.map((pfad) => `file '${escapeFuerConcatListe(pfad)}'`).join('\n') + '\n',
  }
}

/** Escaping EINES Pfades nach den Regeln der concat-Liste. Exportiert, damit es testbar ist. */
export function escapeFuerConcatListe(pfad: string): string {
  // DIE EINZIGE Ersetzung. Innerhalb einfacher Anfuehrungszeichen ist in der
  // concat-Liste JEDES Zeichen buchstaeblich - ausser dem Apostroph selbst, der die
  // Anfuehrung beendet. Also: Anfuehrung schliessen, escapten Apostroph setzen,
  // Anfuehrung wieder oeffnen.
  //
  // Was hier ABSICHTLICH NICHT passiert (beides am echten Binary gemessen, s. Kopf):
  //   - Backslashes werden NICHT verdoppelt. Aus C:\Temp wuerde sonst C:\\Temp, und
  //     das ist ein Pfad, den es nicht gibt.
  //   - Es wird nichts weggelassen und nichts normalisiert: keine
  //     Vorwaertsschraegstriche, kein resolve, kein Kleinschreiben. Der Pfad kommt
  //     fertig herein und geht buchstaeblich in die Liste.
  //
  // Die umschliessenden Anfuehrungszeichen setzt der AUFRUFER (baueConcatListe) -
  // diese Funktion liefert den Inhalt zwischen ihnen.
  return pfad.split("'").join("'\\''")
}

/**
 * Schreibt den Listeninhalt nach `listenPfad` – UTF-8 OHNE Byte-Reihenfolge-Marke, Zeilenende LF.
 * Exportiert, damit es testbar ist (Kodierung und Zeilenenden sind ohne ffmpeg pruefbar);
 * gerufen wird sie ausschliesslich modulintern von `fuehreConcatAus`.
 */
export async function schreibeConcatListe(
  inhalt: string,
  listenPfad: string,
): Promise<Ergebnis<void>> {
  try {
    // 'utf8' schreibt OHNE Byte-Reihenfolge-Marke. Eine solche Marke am Dateianfang
    // macht die erste `file`-Direktive unlesbar, und der Fehler traete nur dort auf,
    // wo die Standard-Kodierung eine Marke setzt - also gerade nicht auf dem Rechner,
    // auf dem entwickelt wird. Der Text bringt seine LF-Zeilenenden aus
    // `baueConcatListe` mit; hier wird nichts umgeschrieben.
    await writeFile(listenPfad, inhalt, { encoding: 'utf8' })
    // "das gelungene `ok` IST die Information" (TK 9.1.1 Punkt 2).
    return { ok: true, wert: undefined }
  } catch (fehler: unknown) {
    // Der Systemfehlercode wird DURCHGEREICHT, nicht gedeutet: Der render-service
    // (TK 9.2.3) macht daraus kein_platz (ENOSPC) bzw. speicher_fehler. Deutete diese
    // Datei ihn selbst, bekaeme der Nutzer bei vollem Datentraeger den Rat, es einfach
    // noch einmal zu versuchen.
    const daten: Fehlerdaten = { datei: listenPfad }
    const code = systemFehlercodeVon(fehler)
    if (code !== null) daten.systemFehlercode = code

    return {
      ok: false,
      fehler: {
        code: 'unbekannter_fehler',
        meldung: `Die concat-Liste ${beschreibe(listenPfad)} konnte nicht geschrieben werden: ${meldungVon(fehler)}`,
        daten,
      },
    }
  }
}

/**
 * Baut das Argument-Array des concat-Aufrufs. Reine Funktion.
 * Exportiert, damit es testbar ist; gerufen wird sie ausschliesslich modulintern von
 * `fuehreConcatAus`.
 */
export function baueConcatArgumente(
  listenPfad: string,
  zielPfad: string,
  profil: RenderProfile,
): Ergebnis<string[]> {
  const listenFehler = pruefePfad(listenPfad, 'Der Pfad der concat-Liste')
  if (listenFehler !== null) return listenFehler

  const zielFehler = pruefePfad(zielPfad, 'Der Zielpfad')
  if (zielFehler !== null) return zielFehler

  if (listenPfad === zielPfad) {
    return ungueltig(
      `Listendatei und Zieldatei sind derselbe Pfad (${beschreibe(zielPfad)}); ` +
        'der Lauf ueberschriebe seine eigene Eingabe.',
    )
  }

  return {
    ok: true,
    wert: [
      // Der concat-DEMUXER, nicht der gleichnamige Filter. Ohne diese Angabe liest
      // ffmpeg die Textdatei als Mediendatei und bricht ab.
      '-f',
      'concat',

      // Die unsichere Betriebsart - ENTSCHIEDEN im Issue, mit drei Gruenden: Auf
      // Windows traegt JEDER absolute Pfad einen Doppelpunkt und gaelte sonst als
      // unsicher (gemessen: "Unsafe file name", Exit 127); Liste (T1) und Ziel
      // (Projekt-Ausgabeordner) koennen auf VERSCHIEDENEN Laufwerken liegen, zwischen
      // denen es keinen relativen Pfad gibt; und in die Liste fliesst kein Nutzertext -
      // sie enthaelt nur Dateien, die derselbe Lauf soeben in T1 erzeugt hat.
      // Muss VOR `-i` stehen: Sie ist eine Option des EINGANGS, den sie betrifft.
      '-safe',
      '0',
      '-i',
      listenPfad,

      // Anzahl und REIHENFOLGE der Ausgabestroeme festgenagelt - erst Video, dann Ton.
      '-map',
      '0:v:0',
      '-map',
      '0:a:0',

      // DER EINZIGE VERLUSTFREIE SCHRITT DER GANZEN PIPELINE. Alle vorherigen Schritte
      // codieren neu (das erzwingt das Normalisieren, TK 9.2.6); dieser hier KOPIERT
      // nur die fertigen Pakete. Daran haengt, dass ein 30-Minuten-Reel in vertretbarer
      // Zeit fertig wird (NFA-05) und dass die Bildqualitaet nicht ein zweites Mal
      // leidet. Jedes andere Codec-Argument - eine Video- oder Tonspur-Angabe, eine
      // Bitrate, eine Qualitaetsstufe, eine Voreinstellung oder irgendein Filter - waere
      // ein Vertragsbruch: Es verdoppelte die Renderzeit und VERDECKTE zugleich eine
      // Uniformitaetsverletzung, statt sie sichtbar zu machen (die prueft #170 VORHER).
      '-c',
      'copy',

      // Container-Argumente der FERTIGEN Datei aus #162 - UNVERAENDERT eingesetzt und
      // hier nicht selbst getippt. Diese Aufrufstelle ist die einzige im Projekt.
      // Liefert die Funktion ein leeres Array, ist das eine bewusste Profil-Aussage
      // und kein Anlass, das Flag hier zu ergaenzen.
      ...baueContainerArgumente(profil),

      // Keine Metadaten aus Liste und Segmenten - haelt die Ausgabe frei von Resten.
      '-map_metadata',
      '-1',

      // PFLICHT, weil der Zielname auf .part endet: ffmpeg raet den Muxer aus der
      // Dateiendung und kennt .part nicht. Gemessen: ohne diese Angabe "Unable to
      // choose an output format", Exit 127 - und zwar erst zur Laufzeit.
      '-f',
      'mp4',

      // Die Ausgabedatei steht IMMER zuletzt.
      zielPfad,
    ],
  }
}

/**
 * Schreibt die Liste und führt den concat-Aufruf aus.
 *
 * Der Rückgabetyp ist EXAKT der von `fuehreFfmpegAus` (#158) – das Ergebnis wird UNVERÄNDERT
 * durchgereicht: kein Code wird hier übersetzt, keine Meldung umformuliert.
 *
 * `lauf` ist optional und wird UNVERAENDERT an `fuehreFfmpegAus` weitergereicht. Diese Datei
 * erzeugt die drei Felder nicht, deutet sie nicht und legt sie nicht ab.
 */
export async function fuehreConcatAus(
  segmentPfade: string[],
  listenPfad: string,
  zielPfad: string,
  profil: RenderProfile,
  lauf?: Pick<FfmpegLauf, 'aufAusgabeZeile' | 'aufProzessStart' | 'abbruchSignal'>,
): Promise<Ergebnis<void, FfmpegFehlercode>> {
  // ERST pruefen und bauen, DANN schreiben, DANN starten. Nichts wird angefasst,
  // solange irgendetwas an der Eingabe nicht stimmt.
  const liste = baueConcatListe(segmentPfade)
  if (!liste.ok) return { ok: false, fehler: liste.fehler }

  const argumente = baueConcatArgumente(listenPfad, zielPfad, profil)
  if (!argumente.ok) return { ok: false, fehler: argumente.fehler }

  // Die zwei Ueberschneidungen, die keine der beiden Einzelpruefungen sehen kann,
  // weil ihr jeweils die andere Seite fehlt: Die Listendatei darf kein Zwischenclip
  // sein (sie wuerde ihn ueberschreiben, bevor er verkettet wird), und die Zieldatei
  // erst recht nicht.
  for (const [rolle, pfad] of [
    ['Die Listendatei', listenPfad],
    ['Die Zieldatei', zielPfad],
  ] as const) {
    const index = segmentPfade.indexOf(pfad)
    if (index !== -1) {
      return ungueltig(
        `${rolle} ${beschreibe(pfad)} ist zugleich der Zwischenclip an Position ${String(index)}.`,
      )
    }
  }

  const geschrieben = await schreibeConcatListe(liste.wert, listenPfad)
  // Ohne Liste kein Lauf: Ein ffmpeg-Aufruf auf eine fehlende oder halbe Liste
  // erzeugte eine Fehlermeldung ueber die falsche Ursache.
  if (!geschrieben.ok) return { ok: false, fehler: geschrieben.fehler }

  // Ein OBJEKT mit dem Feld `argumente`, nicht das Array direkt. Die drei Felder aus
  // `lauf` reisen UNVERAENDERT mit; fehlt `lauf`, ist keines davon gesetzt und es wird
  // keines erfunden. Fehlte das Durchreichen, waere der Abbrechen-Knopf ausgerechnet
  // in dem Schritt wirkungslos, der minutenlang die .part-Datei schreibt (#181 raeumt
  // danach unter einem noch laufenden ffmpeg auf - auf Windows EBUSY), und der
  // Fortschrittsbalken stuende im laengsten Schritt still.
  //
  // Das Ergebnis geht UNVERAENDERT zurueck: kein Code uebersetzt, keine Meldung
  // umformuliert. Die Verdichtung gehoert dem render-service (TK 9.2.3).
  return await fuehreFfmpegAus({ argumente: argumente.wert, ...lauf })
}

/**
 * Die Pruefung, die fuer JEDEN Pfad dieser Datei gilt.
 *
 * Gibt `null` zurueck, wenn nichts zu beanstanden ist - sonst den fertigen Fehler.
 * Alle Faelle tragen `ungueltige_eingabe` (TK 9.1.1 Punkt 3); welcher zuerst gemeldet
 * wird, ist Meldungsqualitaet.
 */
function pruefePfad(pfad: unknown, rolle: string): { ok: false; fehler: FehlerHuelle } | null {
  if (typeof pfad !== 'string' || pfad.length === 0) {
    return ungueltig(`${rolle} ist kein nicht-leerer Pfad (${beschreibe(pfad)}).`)
  }
  if (pfad.startsWith('-')) {
    // ffmpeg laese ihn als Option - und zwar an der Kommandozeile, wo ein Pfad kein
    // Anfuehrungszeichen tragen darf. In der LISTE waere er harmlos; abgewiesen wird
    // er trotzdem ueberall, damit dieselbe Zeichenkette nicht an einer Stelle
    // durchgeht und an der naechsten kippt.
    return ungueltig(`${rolle} beginnt mit einem Bindestrich (${beschreibe(pfad)}) und waere eine Option.`)
  }
  if (pfad.includes('\n')) {
    // Ein Zeilenumbruch erzeugte in der Liste ZWEI Zeilen - die zweite wuerde als
    // weitere Direktive gelesen.
    return ungueltig(`${rolle} enthaelt einen Zeilenumbruch (${beschreibe(pfad)}).`)
  }
  if (pfad.includes('\0')) {
    return ungueltig(`${rolle} enthaelt ein Nullzeichen (${beschreibe(pfad)}).`)
  }
  return null
}

/** Die Fehlerhaelfte der Ergebnis-Huelle, so wie diese Datei sie erzeugt. */
interface FehlerHuelle {
  code: 'ungueltige_eingabe'
  meldung: string
}

/** Der einzige Eingabe-Fehlerausgang dieser Datei. */
function ungueltig(meldung: string): { ok: false; fehler: FehlerHuelle } {
  return { ok: false, fehler: { code: 'ungueltige_eingabe', meldung } }
}

/**
 * Der Fehlercode des Betriebssystems, falls der gefangene Wert einen traegt.
 *
 * Node haengt ihn als `code` an den Fehler (ENOENT, ENOSPC, EACCES, EBUSY). Er wird
 * nur ABGELESEN, nicht gedeutet.
 */
function systemFehlercodeVon(fehler: unknown): string | null {
  if (typeof fehler !== 'object' || fehler === null) return null
  // SAFETY: die Zeile davor hat fehler als nicht-null Objekt belegt; der Cast macht
  // das Feld sichtbar, und der typeof-Check darunter prueft es zur Laufzeit.
  const code = (fehler as { code?: unknown }).code
  return typeof code === 'string' ? code : null
}

/** Die Meldung eines gefangenen Wertes, ohne Annahme darueber, was er ist. */
function meldungVon(fehler: unknown): string {
  return fehler instanceof Error ? fehler.message : String(fehler)
}

/** Einen fremden Wert fuer die Meldung beschreiben, ohne ihn zu deuten. */
function beschreibe(wert: unknown): string {
  return typeof wert === 'string' ? JSON.stringify(wert) : String(wert)
}
