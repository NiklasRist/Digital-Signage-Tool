// [render-service] renderReel zusammensetzen - Issue #181.
//
// Der Dirigent der Render-Kette (TK 9.2). Aus einem RenderRequest entsteht GENAU EIN
// terminales RenderResult, und in JEDEM Ausgang bleibt ein aufgeraeumter
// Arbeitsbereich zurueck.
//
// DREI EIGENSCHAFTEN, DIE HIER TRAGEN UND STILL VERSAGEN, WENN MAN SIE UEBERGEHT:
//
// 1. DIESE FUNKTION WIRFT NIE. Kehrt sie ohne RenderResult zurueck, bleibt der
//    Auftrag in #68 auf `laeuft` - und weil die serielle Ordnung der EINZIGE
//    Sperr-Mechanismus des Systems ist (TK 9.3.5), steht danach die GESAMTE
//    Warteschlange bis zum Neustart. Deshalb: ein aeusserster try, der alles faengt,
//    ein `ergebnis`, das schon vor dem ersten Schritt belegt ist, und GENAU EIN
//    `return` ganz am Ende.
//
// 2. DIE ABBRUCH-KETTE BRAUCHT BEIDES. Das AbortSignal aus #179 sagt dem
//    ffmpeg-adapter, dass der Ausgang ein Abbruch IST (#158); merkeProzess/
//    gibProzessFrei (#159) sagen ihm, WELCHEN Prozess es zu beenden gilt. Wer nur
//    eines verdrahtet, bekommt entweder den falschen Fehlercode oder ein
//    weiterlaufendes ffmpeg - und ein weiterlaufendes ffmpeg haelt unter Windows ein
//    Handle auf seine Datei, sodass das Aufraeumen im finally mit EBUSY scheitert.
//    Beide Haken reisen deshalb im NormalisierKontext (Schritt 10) UND im fuenften
//    Parameter von fuehreConcatAus (Schritt 12) mit.
//
// 3. KEIN TIMEOUT. Ein Renderlauf darf legitim Minuten dauern (NFA-05); der Abbruch
//    ist der einzige Weg, ihn zu beenden. Diese Datei setzt nirgends eine Frist.
//
// ZUR FORTSCHRITTS-NAHT: `erzeugeFortschrittsLeser` (#160) liefert 0..100, aber
// `NormalisierKontext.aufElementFortschritt` (#177) will 0..1 - und #177 TEILT
// BEREITS (normalisieren.ts, `kontext.aufElementFortschritt(prozent / 100)`). Hier
// wird der Anteil deshalb UNVERAENDERT an `sender.meldeAnteil` weitergereicht, dessen
// Vertrag ebenfalls 0..1 sagt (#178). Ein zweites Teilen liesse den Balken kriechen,
// ein Durchreichen von Prozentwerten liesse ihn beim ersten Tick festfrieren (#178
// klemmt auf 1) - beides ohne Absturz, ohne roten Test.
//
// ZUM STAGING: Die `.part` liegt NEBEN dem Ziel im Projekt-Ausgabeordner, nicht in
// T1. Umbenennen ist nur auf DERSELBEN Partition unteilbar (TK 9.2.6); die App ist
// portabel, <Temp> liegt auf C:, der Datenort kann auf dem Stick liegen - ein rename
// von <Temp> auf einen Stick scheitert auf exFAT und FAT32 mit EXDEV.

import { mkdir, rm } from 'node:fs/promises'

import { fuehreConcatAus } from '../ffmpeg-adapter/concat'                     // #169
import { gibProzessFrei, merkeProzess } from '../ffmpeg-adapter/abbruch'       // #159
import { pruefeUniformitaet } from '../ffmpeg-adapter/uniformitaet'            // #170
import { leseMarke } from '../config-store/lese-marke'                         // #29
import { ermittleFfprobePfad } from '../ffmpeg-pfad'                           // #6
import { ausgabeOrdner, loeseAusgabePfad } from '../project-store/pfade'       // #49

import { registriereLauf } from './abbruch'                                    // #179
import { erzeugeArbeitsbereich, verwirfArbeitsbereich } from './arbeitsbereich' // #172
import { verifiziereUndPlatziere } from './ausgabe-platzieren'                 // #180
import { erzeugeFortschrittSender } from './fortschritt'                       // #178
import { gesamtdauer } from './frames'                                         // #174
import { normalisiereElement, pruefeMedienVorhanden } from './normalisieren'   // #177
import { legePngsAb } from './png-ablage'                                      // #175
import { pruefeRenderRequest } from './validierung'                            // #173

import type { NormalisierKontext } from './normalisieren'
import type { ChildProcess } from 'node:child_process'
import type { RenderRequest } from '../../shared/contracts/render-request'
import type { RenderResult, RenderProgress } from '../../shared/contracts/render-result'

/** Dateiname der concat-Liste IN T1. Fester Name in einem fremd aufgeloesten Ordner. */
const CONCAT_LISTE = 'concat.txt'

/** Hoechstlaenge der Meldung, die beim Nutzer ankommt. */
const MELDUNG_MAX = 400

export async function renderReel(
  request: RenderRequest,
  aufFortschritt: (fortschritt: RenderProgress) => void,
): Promise<RenderResult> {
  // VOR dem try gelesen, und zwar defensiv: `request` kommt ueber die IPC-Grenze, wo
  // der Typ geloescht ist. Ein Zugriff auf ein fehlendes Feld darf nicht schon den
  // Anfang des Laufs sprengen - dann gaebe es weder Registrierung noch Sender, und
  // das finally haette nichts freizugeben.
  const renderId = lies(request, 'renderId')
  const elementAnzahl = Array.isArray(request?.elemente) ? request.elemente.length : 0

  // Schritt 1: Abbruch-Registrierung und Fortschritts-Sender.
  const registrierung = registriereLauf(renderId)
  const sender = erzeugeFortschrittSender(renderId, elementAnzahl, aufFortschritt)

  // Zustand, den das finally braucht. `arbeitsbereich` bleibt null, solange Schritt 6
  // nichts geliefert hat - verwirfArbeitsbereich darf NIE mit '' oder undefined
  // gerufen werden (das waere ein rekursiver Loeschversuch auf einem leeren Pfad).
  let arbeitsbereich: string | null = null
  let partPfad: string | null = null
  let platziert = false
  let letzterElementIndex: number | null = null

  // Schon hier belegt: Faellt weiter unten etwas aus, das kein Zweig abdeckt, ist der
  // Ausgang trotzdem ein RenderResult und kein stehengebliebener Auftrag.
  let ergebnis: RenderResult = scheitere(
    renderId,
    'unbekannter_fehler',
    null,
    'Der Render ist aus einem unerwarteten Grund fehlgeschlagen.',
  )

  try {
    // Ein benannter Block statt frueher `return`s: Jeder Fehlerzweig setzt `ergebnis`
    // und verlaesst den Ablauf mit `break ablauf`, faellt also durch zum gemeinsamen
    // Abschluss. Ein `return` mitten aus der Elementschleife heraus waere die
    // haeufigste Art, das Aufraeumen zu ueberspringen.
    ablauf: {
      // Schritt 2: Validierung - synchron und wirkungsfrei.
      const geprueft = pruefeRenderRequest(request)
      if (!geprueft.ok) {
        ergebnis = ausFehler(renderId, geprueft.fehler)
        break ablauf
      }

      // Schritt 3: Zielpfad und Staging-Pfad. Die Namensvalidierung macht #49, nicht
      // diese Datei; `.part` ist ein festes Suffix an einem fremd aufgeloesten Pfad
      // (TK 9.2.6 schreibt projects/<id>/output/<name>.mp4.part woertlich vor).
      const ziel = loeseAusgabePfad(request.projektId, request.ausgabeName)
      if (!ziel.ok) {
        ergebnis = ausFehler(renderId, ziel.fehler)
        break ablauf
      }
      const zielPfad = ziel.wert

      // Schritt 4: Medien pruefen - VOR dem ersten ffmpeg/ffprobe-Aufruf. Sonst
      // codiert die Anwendung minutenlang, bevor sie meldet, dass Element 17 fehlt.
      const medien = await pruefeMedienVorhanden(request.elemente, request.projektId)
      if (registrierung.istAbgebrochen()) {
        ergebnis = abgebrochen(renderId, letzterElementIndex)
        break ablauf
      }
      if (!medien.ok) {
        ergebnis = ausFehler(renderId, medien.fehler)
        break ablauf
      }

      // Schritt 5: Marke und ffprobe-Pfad. `ermittleFfprobePfad()` wird im GANZEN
      // Lauf GENAU EINMAL gerufen - hier - und danach nur noch durchgereicht
      // (Schritte 11 und 13). Ein zweiter Aufruf tiefer im ffmpeg-adapter waere eine
      // zweite Stelle, die entscheidet, WELCHES ffprobe benutzt wird.
      const marke = await leseMarke()
      if (!marke.ok) {
        ergebnis = scheitere(
          renderId,
          'unbekannter_fehler',
          null,
          `Die Markendaten liessen sich nicht lesen (Verdacht auf einen Verpackungsfehler): ${marke.fehler.meldung}`,
        )
        break ablauf
      }
      const flaecheDunkel = marke.wert.farben.flaecheDunkel
      const ffprobePfad = ermittleFfprobePfad()

      // Schritt 6: T1. AB HIER ist das Verwerfen im finally Pflicht.
      const t1 = await erzeugeArbeitsbereich()
      if (!t1.ok) {
        ergebnis = ausFehler(renderId, t1.fehler)
        break ablauf
      }
      arbeitsbereich = t1.wert

      // Schritt 7: Ausgabeordner anlegen - rekursiv und idempotent. `ausgabeOrdner`
      // ist eine reine String-Operation (#49); irgendjemand muss den Ordner erzeugen,
      // bevor die `.part` hineingeschrieben wird (TK 9.2.3: speicher_fehler).
      //
      // Der Aufruf von `ausgabeOrdner` steht AUSSERHALB des Fangzweigs: Der faengt
      // den Schreibfehler des Dateisystems, nicht einen geplatzten Baustein. Sonst
      // erschiene ein Wurf aus #49 als `speicher_fehler` - ein Fehlerbild, das den
      // Nutzer zur Platte schickt, waehrend in Wahrheit die Pfad-Autoritaet kaputt
      // ist. Ein Wurf gehoert in den aeussersten Faenger (`unbekannter_fehler`).
      const ordner = ausgabeOrdner(request.projektId)
      try {
        await mkdir(ordner, { recursive: true })
      } catch (ursache) {
        ergebnis = scheitere(
          renderId,
          systemCode(ursache) === 'ENOSPC' ? 'kein_platz' : 'speicher_fehler',
          null,
          'Der Ausgabeordner des Projekts liess sich nicht anlegen.',
        )
        break ablauf
      }

      // Erst JETZT, wo der Ordner steht, bekommt das finally den Pfad zu sehen.
      partPfad = `${zielPfad}.part`

      // Schritt 8: Segment- und Band-PNGs nach T1.
      const ablage = await legePngsAb(arbeitsbereich, request.elemente)
      if (registrierung.istAbgebrochen()) {
        ergebnis = abgebrochen(renderId, letzterElementIndex)
        break ablauf
      }
      if (!ablage.ok) {
        ergebnis = ausFehler(renderId, ablage.fehler)
        break ablauf
      }

      // Schritt 9: framegerundete Solldauer (TK 9.2.6).
      const solldauer = gesamtdauer(request.elemente)
      if (!solldauer.ok) {
        ergebnis = ausFehler(renderId, solldauer.fehler)
        break ablauf
      }

      // Der Kontext wird EINMAL gebaut und je Element unveraendert wiederverwendet.
      // Hier sitzt die Abbruch-Verdrahtung fuer die Normalisierung: dasselbe Signal
      // wie istAbgebrochen() (#179) UND die beiden Prozess-Haken aus #159.
      const kontext: NormalisierKontext = {
        projektId: request.projektId,
        arbeitsbereich,
        profil: request.profil,
        flaecheDunkel,
        abbruchSignal: registrierung.signal,
        merkeProzess,
        gibProzessFrei,
        // KEIN zweites Teilen: #177 rechnet 0..100 bereits auf 0..1 um, und
        // meldeAnteil will genau diesen Anteil (#178).
        aufElementFortschritt: (anteil) => {
          sender.meldeAnteil(anteil)
        },
      }

      // Schritt 10: die Elementschleife.
      const segmentPfade: string[] = []
      let elementeFehlgeschlagen = false
      for (const [index, element] of request.elemente.entries()) {
        // Vor dem naechsten Element: Ein Abbruch soll spaetestens beim Elementwechsel
        // wirksam werden, nicht erst am Ende des ganzen Laufs.
        if (registrierung.istAbgebrochen()) break

        letzterElementIndex = index
        sender.starteElement(index, lies(element, 'id'))

        const clip = await normalisiereElement(
          element,
          index,
          // Index-parallel durchgereicht, ohne Umformung in eine Abbildung nach
          // Element-ID: Zwei Darstellungen derselben Information laufen auseinander,
          // sobald jemand die Liste umsortiert.
          { segment: ablage.wert.segmentPngs[index] ?? null, band: ablage.wert.bandPngs[index] ?? [] },
          kontext,
        )

        if (!clip.ok) {
          // Der Abbruch schlaegt jeden Fehlercode: Das Beenden des ffmpeg-Prozesses
          // ERZEUGT typischerweise einen Fehler im gerade laufenden Aufruf. Wuerde
          // der gewinnen, saehe der Nutzer fuer jeden selbst ausgeloesten Abbruch
          // eine Fehlermeldung. "`abgebrochen` ist *kein* Fehlercode." (TK 9.2.3)
          ergebnis = registrierung.istAbgebrochen()
            ? abgebrochen(renderId, letzterElementIndex)
            : ausFehler(renderId, clip.fehler)
          elementeFehlgeschlagen = true
          break
        }

        segmentPfade.push(clip.wert)
        sender.beendeElement(index)
      }
      if (elementeFehlgeschlagen) break ablauf
      if (registrierung.istAbgebrochen()) {
        ergebnis = abgebrochen(renderId, letzterElementIndex)
        break ablauf
      }

      // Schritt 11: Uniformitaet - VOR dem concat. "`-c copy` setzt Uniformitaet
      // voraus" (TK 9.2.6). ACHTUNG: Eine erkannte Abweichung ist ein ERFOLGREICHER
      // Prueflauf mit `wert.ok === false`, nicht `ok: false` der Huelle. Wer nur die
      // Huelle prueft, uebersieht JEDE Abweichung und schickt eine kaputte Datei in
      // den concat.
      const befund = await pruefeUniformitaet(segmentPfade, request.profil, ffprobePfad)
      if (registrierung.istAbgebrochen()) {
        ergebnis = abgebrochen(renderId, letzterElementIndex)
        break ablauf
      }
      if (!befund.ok) {
        ergebnis = scheitere(
          renderId,
          'ffmpeg_fehler',
          null,
          `Die Zwischenclips liessen sich nicht pruefen: ${befund.fehler.meldung}`,
        )
        break ablauf
      }
      if (!befund.wert.ok) {
        const erste = befund.wert.abweichungen
          .slice(0, 3)
          .map((a) => `${a.datei}: ${a.feld} erwartet ${a.erwartet}, gefunden ${a.gefunden}`)
          .join('; ')
        ergebnis = scheitere(
          renderId,
          'ffmpeg_fehler',
          null,
          `Die Zwischenclips sind nicht einheitlich aufgebaut und lassen sich nicht verlustfrei verketten. ${erste}`,
        )
        break ablauf
      }

      // Schritt 12: der concat. Der fuenfte Parameter ist in der Signatur optional,
      // hier aber PFLICHT - ohne ihn liefe ausgerechnet der Schritt, der die `.part`
      // schreibt und am laengsten laeuft, ausserhalb der Abbruch-Kette, und das
      // finally raeumte unter einem NOCH LAUFENDEN ffmpeg auf. `aufAusgabeZeile`
      // bleibt weg: `verketten` ist laut TK 9.2.7 ein Gesamtschritt, #178 sendet
      // dafuer genau ein Ereignis.
      sender.starteVerketten()
      let concatProzess: ChildProcess | null = null
      let verkettet
      try {
        verkettet = await fuehreConcatAus(
          segmentPfade,
          `${arbeitsbereich}/${CONCAT_LISTE}`,
          partPfad,
          request.profil,
          {
            aufProzessStart: (kindProzess) => {
              concatProzess = kindProzess
              merkeProzess(kindProzess)
            },
            abbruchSignal: registrierung.signal,
          },
        )
      } finally {
        // Mit DEMSELBEN Handle, auch im Fehlerfall.
        if (concatProzess !== null) gibProzessFrei(concatProzess)
      }
      if (registrierung.istAbgebrochen()) {
        ergebnis = abgebrochen(renderId, letzterElementIndex)
        break ablauf
      }
      if (!verkettet.ok) {
        ergebnis = ausConcatFehler(renderId, verkettet.fehler)
        break ablauf
      }

      // Schritt 13: verifizieren und platzieren. DIE EINZIGE SICHERUNG gegen den
      // stillen Ausfall des concat: `-c copy` meldet Exitcode 0, auch wenn ein
      // Segment ab Position 2 fehlt (gemessen 15.08.2026: drei Segmente mit Luecke an
      // Position 2 ergaben 30 statt 90 Bilder, Exitcode 0, Grund nur auf stderr). Die
      // Dauerpruefung in #180 (feste Toleranz 0,5 s) faengt genau das - sie darf auf
      // keinem Pfad uebersprungen werden.
      const platzierung = await verifiziereUndPlatziere(
        partPfad,
        zielPfad,
        solldauer.wert,
        request.profil,
        ffprobePfad,
      )
      if (registrierung.istAbgebrochen() && !platzierung.ok) {
        ergebnis = abgebrochen(renderId, letzterElementIndex)
        break ablauf
      }
      if (!platzierung.ok) {
        ergebnis = ausFehler(renderId, platzierung.fehler)
        break ablauf
      }

      // Die `.part` ist durch das Umbenennen verschwunden - das finally soll sie
      // nicht mehr suchen, und die fertige Datei erst recht nicht anfassen.
      platziert = true
      ergebnis = {
        status: 'erfolg',
        renderId,
        ausgabePfad: platzierung.wert.ausgabePfad,
        // ZEICHENGLEICH aus dem Auftrag, NICHT aus dem Pfad zurueckgerechnet: Eine
        // Rueckrechnung waere eine zweite Bildungsregel neben loeseAusgabePfad (#49)
        // und liefe bei jeder dort ergaenzten Normalisierung lautlos auseinander.
        ausgabeName: request.ausgabeName,
        gesamtdauer: solldauer.wert,
        dateigroesse: platzierung.wert.dateigroesse,
      }
    }
  } catch (ursache) {
    // Kein Stacktrace und keine Node-Fehlerklasse in der Meldung; intern
    // protokolliert, damit die Spur nicht verloren geht.
    protokolliere('Unerwartete Ausnahme im Renderlauf', ursache)
    ergebnis = registrierung.istAbgebrochen()
      ? abgebrochen(renderId, letzterElementIndex)
      : scheitere(
          renderId,
          'unbekannter_fehler',
          null,
          'Der Render ist aus einem unerwarteten Grund fehlgeschlagen.',
        )
  } finally {
    // ERST HIER, nach dem letzten await: Der ffmpeg-Prozess muss wirklich beendet
    // sein, bevor seine Dateien verschwinden - sonst scheitert das Loeschen auf
    // Windows mit EBUSY/EPERM, waehrend auf macOS der unlink still gelingt, obwohl
    // die Datei noch offen ist. Genau deshalb raeumt #179 (cancelRender) NICHT selbst
    // auf, sondern nur diese Datei.
    if (arbeitsbereich !== null) {
      // Ohne Huelle, wirft nie (#172).
      await verwirfArbeitsbereich(arbeitsbereich)
    }
    if (partPfad !== null && !platziert) {
      // Idempotent (`force`): #180 hat die Datei im Fehlerfall womoeglich schon
      // entfernt, und bei fruehen Ausgaengen ist nie eine entstanden. Ein Fehlschlag
      // wird geschluckt - er darf den eigentlichen Fehlercode nicht verdraengen.
      try {
        await rm(partPfad, { force: true })
      } catch (ursache) {
        protokolliere('Die angefangene .part liess sich nicht entfernen', ursache)
      }
    }
    sender.schliesse()
    registrierung.freigeben()
  }

  return ergebnis
}

// ---------------------------------------------------------------------------
// Ergebnis-Bau. Die drei Ausgaenge an genau einer Stelle je Form.
// ---------------------------------------------------------------------------

function scheitere(
  renderId: string,
  fehlercode: string,
  fehlerhaftesElementId: string | null,
  meldung: string,
): RenderResult {
  return { status: 'fehler', renderId, fehlercode, fehlerhaftesElementId, meldung: kuerze(meldung) }
}

/** Ohne `fehler`-Objekt und ohne Fehlercode (TK 9.2.3). */
function abgebrochen(renderId: string, abgebrochenBei: number | null): RenderResult {
  return { status: 'abgebrochen', renderId, abgebrochenBei }
}

/**
 * Codes aus #173, #175, #177, #180 werden UNVERAENDERT uebernommen: Der naechste
 * Empfaenger (#68) prueft sie gegen die geschlossene Liste aus TK 9.2.3, und was hier
 * verfaelscht wird, steht danach unkorrigiert in Q3 - das ist dauerhaft.
 */
function ausFehler(renderId: string, fehler: { code: string; meldung: string; daten?: unknown }): RenderResult {
  return scheitere(renderId, fehler.code, elementIdAus(fehler.daten), fehler.meldung)
}

/**
 * Die EINZIGE Abbildung dieser Datei - und sie betrifft nur #169, weil der als
 * einziger Baustein der Kette nicht `RenderFehlercode` liefert, sondern die Union
 * `FfmpegFehlercode` des ffmpeg-adapter.
 *
 * `ffmpeg_abgebrochen` gehoert nicht in den geschlossenen Satz von TK 9.2.3;
 * unveraendert durchgereicht fiele es bei #68 durch und stuende DAUERHAFT als
 * `unbekannter_fehler` in Q3. Der richtige Ausgang eines abgebrochenen Laufs entsteht
 * ohnehin nicht ueber den Code, sondern ueber istAbgebrochen() - diese Abbildung ist
 * nur der Rueckfallweg fuer ein `ffmpeg_abgebrochen` ohne gesetztes Kennzeichen.
 */
function ausConcatFehler(
  renderId: string,
  fehler: { code: string; meldung: string; daten?: unknown },
): RenderResult {
  if (fehler.code === 'ffmpeg_abgebrochen') {
    return scheitere(renderId, 'ffmpeg_fehler', null, `Das Verketten wurde beendet: ${fehler.meldung}`)
  }
  if (fehler.code === 'unbekannter_fehler') {
    // #169 setzt beim Schreiben der concat-Liste `daten.systemFehlercode`.
    const system = systemFehlercodeAus(fehler.daten)
    if (system !== null) {
      return scheitere(renderId, system === 'ENOSPC' ? 'kein_platz' : 'speicher_fehler', null, fehler.meldung)
    }
  }
  return scheitere(renderId, fehler.code, null, fehler.meldung)
}

// ---------------------------------------------------------------------------
// Kleinkram
// ---------------------------------------------------------------------------

/** `{ elementId }` steht laut TK 9.2.3 bei `medium_fehlt` und `ungueltiges_element`. */
function elementIdAus(daten: unknown): string | null {
  if (typeof daten !== 'object' || daten === null || !('elementId' in daten)) return null
  const wert = (daten as { elementId?: unknown }).elementId
  return typeof wert === 'string' && wert !== '' ? wert : null
}

function systemFehlercodeAus(daten: unknown): string | null {
  if (typeof daten !== 'object' || daten === null || !('systemFehlercode' in daten)) return null
  const wert = (daten as { systemFehlercode?: unknown }).systemFehlercode
  return typeof wert === 'string' && wert !== '' ? wert : null
}

function systemCode(ursache: unknown): string {
  if (typeof ursache !== 'object' || ursache === null || !('code' in ursache)) return ''
  const code = (ursache as { code?: unknown }).code
  return typeof code === 'string' ? code : ''
}

/** Defensives Lesen einer Zeichenkette aus einem Wert, der ueber IPC kam. */
function lies(quelle: unknown, feld: string): string {
  if (typeof quelle !== 'object' || quelle === null || !(feld in quelle)) return ''
  const wert = (quelle as Record<string, unknown>)[feld]
  return typeof wert === 'string' ? wert : ''
}

/** Klartext fuer den Nutzer - gekuerzt, damit keine Wand aus stderr ankommt. */
function kuerze(meldung: string): string {
  const text = meldung.trim()
  return text.length <= MELDUNG_MAX ? text : `${text.slice(0, MELDUNG_MAX - 1)}…`
}

function protokolliere(stelle: string, ursache: unknown): void {
  console.error(`[render-service] renderReel: ${stelle}:`, ursache)
}
