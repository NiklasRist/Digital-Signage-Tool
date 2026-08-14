// GENERIERT aus dem Signaturblock von Issue #167.
// [ffmpeg-adapter] Video-Ausschnitt framegenau schneiden
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
// GERUEST-PRUEFSUMME: e21c036c43644c28
//
// ERLEDIGT (14.08.2026): Rumpf gefuellt, die dateiweite Abschaltzeile
// (@typescript-eslint/no-unused-vars) ist damit entfernt - jeder Parameter und
// jeder Import wird jetzt benutzt.
//
// ---------------------------------------------------------------------------
// NACHGEMESSEN, NICHT BEHAUPTET (14.08.2026, ffmpeg 6.1.1-essentials aus
// ffmpeg-static, dem Binary aus #6)
// ---------------------------------------------------------------------------
// Die Stellung von `-ss` ist der einzige Grund, aus dem es dieses Issue gibt, und
// sie ist der Fehler, der hier schon einmal drinstand. Sie ist deshalb NICHT
// plausibel gefunden, sondern gegen echtes Material gefahren worden.
//
// AUFBAU DER MESSUNG. Eine Quelle mit 220 Bildern, 320x180, 30 fps, in der JEDES
// BILD SEINE EIGENE NUMMER TRAEGT (`geq=lum='16+N'` - Bild n ist eine Flaeche mit
// dem Luma-Wert 16+n). Codiert mit `-g 300 -keyint_min 300 -sc_threshold 0`, also
// mit GENAU EINEM Schluesselbild bei Bild 0 (mit ffprobe nachgezaehlt) - ein
// Schluesselbild-Abstand von 7,3 s, wie ihn Handy-Aufnahmen und
// Streaming-Downloads mitbringen. Erst so eine Quelle macht einen falschen
// Startpunkt ueberhaupt SICHTBAR. Gemessen wurde der Bildpunkt (960|540) des
// fertigen Clips: Sein Wert sagt, WELCHES Quellbild dort steht.
//
// GEFAHREN wurde dasselbe Argument-Array dreimal, nur mit anderer Stellung von
// `-ss 1.491667` (= Bild 45), `-frames:v 120`, ohne Bandspur:
//
//   Stellung von -ss        | Bilder | erstes Bild | letztes Bild | Exit
//   ------------------------|--------|-------------|--------------|-----
//   NACH allen -i (so hier) |   120  | Quellbild 45| Quellbild 164|  0
//   ZWISCHEN den zwei -i    |   120  | Quellbild  0| Quellbild 119|  0
//   VOR dem ersten -i       |   120  | Quellbild 45| Quellbild 164|  0
//
// DIE MITTLERE ZEILE IST DER GANZE PUNKT. Die Datei hat die RICHTIGE LAENGE
// (dafuer sorgt `-frames:v`), einen Exit-Code 0, keine Warnung - und den FALSCHEN
// INHALT. Eine Abnahme, die die Dauer misst, kann diesen Fehler grundsaetzlich
// nicht finden; nur der Bildinhalt zeigt ihn. Genau diese Stellung stand hier
// beim M6-Prueflauf, und genau sie ist der Grund fuer die Regel unten.
//
// ZUR DRITTEN ZEILE - EHRLICH GESAGT: Bei DIESEM Binary und DIESER Quelle liefert
// auch das Eingangs-Suchen den richtigen Inhalt, weil ffmpeg seit langem
// `-accurate_seek` als Vorgabe fuehrt (es springt zum Schluesselbild und
// verwirft dann bis zur Zeit). Das ist KEIN Freibrief, es doch nach vorn zu
// ziehen: Die Zusage haengt dann an einer Vorgabe des Binaries und an der
// Quelle, waehrend die Stellung hinter allen Eingaengen sie aus der Position
// selbst ableitet. Das Issue verbietet die Verschiebung ausdruecklich; sie ist
// ein Vertragsthema, kein lokaler Geschwindigkeitsgriff.
//
// DAS VIERTEL-FRAME, ebenfalls gemessen (erstes Bild des Clips, Soll: Quellbild
// 45; Quellbild 44 und 45 sind an ihren Werten unterscheidbar):
//
//   -ss (45-0.25)/30 = 1.491667  -> Quellbild 45   RICHTIG (so hier)
//   -ss  45     /30  = 1.500000  -> Quellbild 45   richtig, aber ohne Sicherheitsabstand
//   -ss (45-0.5) /30 = 1.483333  -> Quellbild 44   FALSCH, ein Bild zu frueh
//   -ss (45+0.25)/30 = 1.508333  -> Quellbild 45
//
// Das halbe Frame ist damit nicht theoretisch unsicher, sondern MESSBAR FALSCH:
// Es liegt auf der Grenze des VORHERIGEN Bildes und holt es herein. Das Viertel
// liegt sicher zwischen beiden Grenzen. Die Begruendung des Issues haelt der
// Messung stand.
//
// ---------------------------------------------------------------------------
// WAS DIESE DATEI BEWUSST NICHT SETZT - und wer stattdessen zustaendig ist
// ---------------------------------------------------------------------------
// Der feste Vorspann (Banner-, Eingabe-, Protokoll-, Ueberschreib- und die beiden
// Fortschritts-Flags) kommt aus #158 und wird JEDEM Aufruf vorangestellt; ein
// zweites Fortschritts-Flag verdoppelte jede Zeile beim Leser (#160).
// Saemtliche Video-Kodieroptionen - Codec, Profil, Level, Pixelformat, Bildrate,
// Bildraten-Modus, Ratensteuerung, GOP, Farbmetadaten - liefert #161. Codec,
// Abtastrate, Kanalzahl, Bitrate und die Laengenbegrenzung der Tonspur liefert
// #162, ebenso das Audio-Mapping und die Container-Option der FERTIGEN Datei
// (die gehoert allein an den concat-Lauf, #169). Das Seitenverhaeltnis setzt die
// Filterkette (#163/#164/#165). Der Drehungs-Vermerk der Quelle wird angewandt
// und beim Schreiben verworfen (`-map_metadata -1`, nachgeprueft von #170) - hier
// wird nichts gegengedreht.
//
// Jede Wiederholung waere eine ZWEITE Quelle fuer dasselbe. Sie faellt im Test
// nicht auf: ffmpeg meldet Erfolg, die Datei entsteht, sie laeuft auf dem Laptop
// tadellos - und am 85-Zoll-Fernseher im Studio ruckelt sie, zeigt falsche Farben
// oder startet gar nicht.

import type { RenderProfile } from '../../shared/contracts/render-profile'
import type { Ergebnis } from '../../shared/contracts/ergebnis'

import { baueVideoKodierArgumente } from './encoder-argumente'
import {
  baueStilleTonspurEingang,
  baueTonspurKodierArgumente,
  baueTonspurMapping,
} from './tonspur'

export interface VideoAusschnittAuftrag {
  /** absoluter Pfad des Quellvideos in D2 – bereits vom `render-service` aufgelöst */
  quellPfad: string
  /** erstes zu behaltendes Frame (0-basiert), GANZZAHLIG. Die Rundung round(trimStart × 30)
   *  hat bereits der `render-service` erledigt (#174). Der Adapter rechnet NICHT um. */
  startFrame: number
  /** erstes NICHT mehr zu behaltendes Frame, GANZZAHLIG – halboffenes Intervall
   *  [startFrame, endFrame). Die Clip-Länge ist damit endFrame − startFrame Frames. */
  endFrame: number
  /** absoluter Pfad der Bandspur (#168) oder null, wenn das Element kein Werbeband trägt.
   *  Ist er gesetzt, wird die Bandspur EINGANG 1. */
  bandSpurPfad: string | null
  /** fertige Filterkette für `-filter_complex`: #163 ohne Band, #164 bei `split`,
   *  #165 bei `einblendung`. Diese Datei WÄHLT die Kette nicht aus – das tut #177. */
  filterkette: string
  /** absoluter Zielpfad des Zwischenclips, z. B. <T1>/seg_0007.mp4 */
  zielPfad: string
}

/**
 * Der Sicherheitsabstand vor dem gewuenschten Bild, in Bildern.
 *
 * Ein Bild belegt das Zeitintervall `[k/fps, (k+1)/fps)`; ffmpeg verwirft Bilder,
 * deren Zeitstempel KLEINER als die Startzeit ist. Laege die Startzeit durch eine
 * Fliesskomma-Ungenauigkeit auch nur ein Millionstel UEBER `startFrame/fps`, fiele
 * genau das gewuenschte erste Bild weg, der Clip begaenne ein Bild zu spaet, und
 * ueber viele Elemente driftete die Gesamtlaenge.
 *
 * Ein VIERTEL liegt sicher unter der Grenze des gewuenschten Bildes und sicher
 * ueber der Grenze des vorherigen. Ein HALBES waere die Mitte zwischen zwei
 * Bildern - der unsichere Fall; oben nachgemessen holt es tatsaechlich das
 * vorherige Bild herein. Deshalb ist die Zahl benannt und steht nicht als
 * `0.25` mitten in der Rechnung: Wer sie auf 0.5 zoege, aenderte den Bildinhalt
 * jedes getrimmten Elements, ohne dass eine Laengenpruefung es merkte.
 */
const SICHERHEITSABSTAND_FRAMES = 0.25

/**
 * Nachkommastellen der Startzeit.
 *
 * Sechs Stellen sind bei 30 fps rund fuenf Groessenordnungen feiner als ein Bild -
 * die Rundung der Zeichenkette kann das Ergebnis also nicht mehr ueber eine
 * Bildgrenze schieben.
 */
const STARTZEIT_NACHKOMMASTELLEN = 6

/**
 * Baut das vollständige Argument-Array für EINEN ffmpeg-Aufruf – ohne Binärpfad und ohne den
 * festen Vorspann, den #158 selbst voranstellt.
 * Startet KEINEN Prozess – das Ausführen übernimmt der Aufrufer (`render-service`, #177) über
 * `fuehreFfmpegAus` (#158). So bleibt die Argument-Bildung eine reine, vollständig testbare
 * Funktion, und der Prozessstart liegt an genau einer Stelle.
 */
export function baueVideoAusschnittArgumente(
  auftrag: VideoAusschnittAuftrag,
  profil: RenderProfile,
): Ergebnis<string[]> {
  const geprueft = pruefeEingang(auftrag, profil)
  if (!geprueft.ok) return geprueft

  const { quellPfad, startFrame, endFrame, bandSpurPfad, filterkette, zielPfad, fps, container } =
    geprueft.wert

  // "Die Clip-Länge ist damit endFrame − startFrame Frames." (Signaturblock #167)
  const anzahlFrames = endFrame - startFrame

  // DER TONSPUR-EINGANG STEHT IMMER AM ENDE DER EINGANGSLISTE. Damit ist das Video
  // immer Eingang 0 und die Bandspur - falls vorhanden - immer Eingang 1. Nur so
  // gilt die Label-Konvention der Filterketten ([0:v] Video, [1:v] Band) in BEIDEN
  // Faellen. Der Index der stillen Quelle ergibt sich daraus und wird UEBERGEBEN,
  // nicht in #162 gesucht - nur diese Stelle kennt die Eingangsliste.
  const eingaenge: string[] = ['-i', quellPfad]
  if (bandSpurPfad !== null) eingaenge.push('-i', bandSpurPfad)
  const audioEingangIndex = bandSpurPfad === null ? 1 : 2
  eingaenge.push(...baueStilleTonspurEingang(profil))

  // `-ss` NACH ALLEN EINGAENGEN - die eine Entscheidung, um derentwillen es dieses
  // Issue gibt (Messung im Kopf dieser Datei).
  //
  // "Nur HINTER ALLEN Eingaengen ist `-ss` eine AUSGABE-Option und damit das
  // decode-basierte (akkurate) Suchen: ffmpeg decodiert vom Dateianfang und
  // verwirft, bis die Zeit erreicht ist. Vor `-i <quellPfad>` gestellt waere es
  // Eingangs-Suchen und damit - je nach Binary-Version und Quelle -
  // keyframe-approximativ. ZWISCHEN zwei `-i` gestellt waere es die
  // Eingangs-Option des DARAUF FOLGENDEN Eingangs - die Quelle bliebe
  // ungeschnitten bei Frame 0, und vorgespult wuerde die Bandspur bzw. die stille
  // Tonquelle." (#167)
  //
  // Es genuegt also NICHT, dass `-ss` hinter `-i <quellPfad>` steht. Deshalb wird
  // die gesamte Eingangsliste zuerst fertig gebaut und dieses Argument danach
  // angehaengt - eine Stellung, die durch die Bauweise stimmt und nicht durch
  // Aufmerksamkeit.
  const startZeit =
    startFrame > 0
      ? // Gebietsschema-UNABHAENGIG. Auf einem deutschsprachigen Windows erzeugen
        // `toLocaleString`, `Intl.NumberFormat` und jede Vorlagen-Zeichenkette mit
        // einem lokalisierten Zahlenwert ein KOMMA ("3,25"). ffmpeg liest das nicht
        // als Zahl - der Aufruf schluege fehl oder verstuende "3", und der Schnitt
        // laege eine Vierteltelsekunde daneben.
        [
          '-ss',
          ((startFrame - SICHERHEITSABSTAND_FRAMES) / fps).toFixed(STARTZEIT_NACHKOMMASTELLEN),
        ]
      : // `(0 - 0.25)/30` waere negativ; eine negative Startzeit ist bei
        // Ausgangs-Suchen nicht definiert. Ohne das Argument beginnt die Ausgabe
        // ohnehin beim ersten Bild - genau dem gewuenschten Ergebnis.
        []

  return {
    ok: true,
    wert: [
      ...eingaenge,
      ...startZeit,

      // Die Kette kommt FERTIG herein. Diese Datei waehlt sie nicht aus (das tut der
      // Dispatcher #177 anhand von `einblendung.art`) und veraendert sie nicht. Wer
      // hier raet, erzeugt im schlimmsten Fall eine Einblendung statt eines Splits.
      //
      // EIN Argument, ohne umschliessende Anfuehrungszeichen: Es gibt keine
      // Kommandozeile, die etwas zerlegen koennte (#158 startet ohne Shell), und
      // Anfuehrungszeichen wuerden BESTANDTEIL des Filterausdrucks.
      '-filter_complex',
      filterkette,

      // GENAU ZWEI `-map`-Argumente. "Sobald irgendein -map gesetzt ist, mappt
      // ffmpeg NICHTS mehr automatisch. Genau dadurch faellt der Quellton weg - das
      // ist gewollt und vertraglich verlangt." (#162) Der Quellton wird also NIE
      // durchgereicht, auch nicht "falls vorhanden": "Eine Quelle MIT Ton wird
      // verworfen und durch die stille Spur ERSETZT." (TK 9.2.6)
      '-map',
      '[v]',
      ...baueTonspurMapping(audioEingangIndex),

      // DIE LAENGE IN BILDERN, NICHT IN SEKUNDEN. `-frames:v` zaehlt AUSGABEBILDER
      // und ist von jeder Zeitrechnung unabhaengig: Der Clip hat exakt
      // `endFrame - startFrame` Bilder, gleichgueltig wie genau `-ss` getroffen hat,
      // welche Bildrate die Quelle hatte und wie ihre Zeitstempel aussehen.
      //
      // "Die effektive Elementdauer ist damit `(endFrame − startFrame) / 30`."
      // (TK 9.2.6) - und die gemeldete `gesamtdauer` summiert eben diese gerundeten
      // Dauern, weshalb der Clip die Bildzahl EXAKT treffen muss, nicht ungefaehr.
      //
      // Eine Sekundenangabe (`-t`/`-to`) steht hier bewusst NICHT: Sie bezieht sich
      // je nach Stellung einmal auf die Zeitachse der Quelle und einmal auf die der
      // Ausgabe. Wer sie ergaenzt, holt genau die Zweideutigkeit zurueck, die dieses
      // Issue beseitigt.
      '-frames:v',
      String(anzahlFrames),

      // Die vier Fragmente aus #161 und #162, UNVERAENDERT und VOLLSTAENDIG. Sie
      // werden hier weder gefiltert noch ergaenzt noch umsortiert.
      //
      // Die Laengenbegrenzung der Tonspur steckt im letzten davon und ist der Grund,
      // aus dem dieser Lauf ueberhaupt endet: Die stille Quelle ist ENDLOS. Begrenzt
      // wird die Videospur durch `-frames:v`, und die Ausgabe endet mit dem
      // kuerzesten Strom - gekappt wird also die Tonspur, nicht das Bild, und die
      // Frame-Genauigkeit bleibt vollstaendig erhalten. Faellt diese Zusage weg,
      // endet der Prozess NIE: #158 hat bewusst keine Zeitgrenze, der Auftrag bliebe
      // fuer immer auf "laeuft", und danach steht die ganze Warteschlange still.
      ...baueVideoKodierArgumente(profil),
      ...baueTonspurKodierArgumente(profil),

      // Verwirft die Metadaten der Quelle - darunter den Drehungs-Vermerk, der beim
      // Decodieren bereits angewandt wurde und in der Ausgabe nicht stehenbleiben
      // darf (sonst draehte der Player ein zweites Mal). #170 prueft es nach.
      '-map_metadata',
      '-1',

      // Das Ausgabeformat AUS DEM PROFIL, nicht hingeschrieben: Sonst gaebe es eine
      // zweite Stelle, die den Container bestimmt. Ausdruecklich gesetzt, weil sonst
      // die Endung des Zielpfads entschiede - und die kommt vom Aufrufer.
      '-f',
      container,

      // Der Zielpfad ist IMMER das letzte Element: Alles davor ist eine
      // Ausgabe-Option, alles danach waere ein zweiter Ausgang.
      zielPfad,
    ],
  }
}

/** Der geprüfte Eingang - ab hier steht fest, dass jeder Wert die Form hat, die er haben soll. */
interface GepruefterEingang {
  quellPfad: string
  startFrame: number
  endFrame: number
  bandSpurPfad: string | null
  filterkette: string
  zielPfad: string
  fps: number
  container: string
}

/**
 * Prueft ALLE Parameter, bevor ein einziges Argument gebildet wird.
 *
 * Warum gegen die Wirklichkeit und nicht gegen den Typ: Der Auftrag reist durch den
 * Main und stammt mittelbar aus Nutzereingaben und importierten Medien. Ein
 * `undefined` an dieser Stelle waere sonst eine Ausnahme in einem Auftrag, dessen
 * Zusage danach fuer immer offen bliebe - und "Niemals `throw`" ist Vertrag
 * (TK 9.1.1).
 *
 * Alle Fehler tragen denselben Code `ungueltige_eingabe` (TK 9.1.1 Punkt 3); welcher
 * zuerst gemeldet wird, ist Meldungsqualitaet. Geprueft wird von aussen nach innen:
 * erst das Profil, dessen `fps` in die Startzeit eingeht, dann der Auftrag.
 */
function pruefeEingang(
  auftrag: VideoAusschnittAuftrag,
  profil: RenderProfile,
): Ergebnis<GepruefterEingang> {
  const rohesProfil = profil as unknown as
    | { fps?: unknown; container?: unknown }
    | null
    | undefined
  if (rohesProfil === null || rohesProfil === undefined) {
    return ungueltig('Es wurde kein Ausgabe-Profil uebergeben.')
  }

  const fps = alsGanzzahlUeberNull('profil.fps', rohesProfil.fps)
  if (!fps.ok) return fps

  const container = rohesProfil.container
  if (typeof container !== 'string' || container === '' || container.startsWith('-')) {
    return ungueltig(
      `profil.container muss ein nicht leerer Formatname ohne fuehrenden Bindestrich sein, ` +
        `vorgefunden: ${beschreibe(container)}.`,
    )
  }

  const roherAuftrag = auftrag as unknown as Partial<VideoAusschnittAuftrag> | null | undefined
  if (roherAuftrag === null || roherAuftrag === undefined) {
    return ungueltig('Es wurde kein Video-Ausschnitt-Auftrag uebergeben.')
  }

  const quellFehler = pruefePfad('quellPfad', roherAuftrag.quellPfad)
  if (quellFehler !== null) return ungueltig(quellFehler)
  const zielFehler = pruefePfad('zielPfad', roherAuftrag.zielPfad)
  if (zielFehler !== null) return ungueltig(zielFehler)

  // `null` ist der gueltige Normalfall (Element ohne Werbeband) und darf deshalb
  // NICHT durch die Pfadpruefung fallen. `undefined` dagegen ist kein Vertragswert:
  // Es unterschiede sich hier nicht von `null`, waere aber ein Zeichen dafuer, dass
  // der Aufrufer das Feld schlicht vergessen hat - und beim naechsten Feld faende
  // sich derselbe Fehler dann nicht mehr.
  const bandRoh = roherAuftrag.bandSpurPfad
  if (bandRoh !== null) {
    const bandFehler = pruefePfad('bandSpurPfad', bandRoh)
    if (bandFehler !== null) return ungueltig(bandFehler)
  }
  const bandSpurPfad: string | null = typeof bandRoh === 'string' ? bandRoh : null

  const quellPfad = roherAuftrag.quellPfad as string
  const zielPfad = roherAuftrag.zielPfad as string

  // Rein TEXTLICHER Vergleich: Diese Datei loest keine Pfade auf und normalisiert
  // nichts (das ist Sache der Pfad-Autoritaet, TK 9.5.7). Der realistische Fall -
  // der `render-service` bildet die Pfade aus demselben Arbeitsbereich - wird davon
  // erfasst. Ein Ziel auf der Quelle ueberschriebe diese: Das Ueberschreib-Flag
  // steht im festen Vorspann (#158), es gaebe also nicht einmal eine Rueckfrage.
  if (zielPfad === quellPfad) {
    return ungueltig(
      'zielPfad ist gleich quellPfad - der Lauf ueberschriebe seine eigene Quelle.',
    )
  }
  if (bandSpurPfad !== null && zielPfad === bandSpurPfad) {
    return ungueltig(
      'zielPfad ist gleich bandSpurPfad - der Lauf ueberschriebe seine eigene Bandspur.',
    )
  }

  const startFrame = alsGanzzahlAbNull('startFrame', roherAuftrag.startFrame)
  if (!startFrame.ok) return startFrame

  const endFrame = alsGanzzahlAbNull('endFrame', roherAuftrag.endFrame)
  if (!endFrame.ok) return endFrame
  if (endFrame.wert <= startFrame.wert) {
    return ungueltig(
      `endFrame (${String(endFrame.wert)}) muss groesser als startFrame ` +
        `(${String(startFrame.wert)}) sein; das Intervall [startFrame, endFrame) braucht ` +
        'mindestens 1 Bild. Ein Ausschnitt mit 0 Bildern ist ein Fehler, kein leeres Segment.',
    )
  }

  const filterkette = roherAuftrag.filterkette
  if (typeof filterkette !== 'string' || filterkette === '') {
    return ungueltig(
      `filterkette muss eine nicht leere Zeichenkette sein, vorgefunden: ${beschreibe(filterkette)}.`,
    )
  }
  if (!filterkette.includes(AUSGABE_LABEL)) {
    return ungueltig(
      `filterkette enthaelt das Ausgabelabel ${AUSGABE_LABEL} nicht. Label-Konvention: ` +
        `[0:v] die Videoquelle, ${BAND_LABEL} die Bandspur, ${AUSGABE_LABEL} das Ergebnis, ` +
        'das der Aufrufer mappt.',
    )
  }

  // DIE KREUZPRUEFUNG. Sie findet hier statt, weil dies die einzige Stelle ist, an
  // der beide Angaben zusammentreffen - die Kette kennt die Eingangsliste nicht, und
  // #168 kennt die Kette nicht.
  //
  // Fehlte der zweite Eingang, obwohl die Kette ihn verbraucht, braeche ffmpeg mit
  // einer schwer lesbaren Filtergraph-Meldung ab. Waere der Eingang da, aber
  // unbenutzt, VERSCHOEBE SICH DER INDEX DER TONSPUR und der Clip bekaeme keine
  // Tonspur - und das verletzt die Uniformitaet, ohne dass `concat` es meldet.
  const ketteBrauchtBand = filterkette.includes(BAND_LABEL)
  if (bandSpurPfad !== null && !ketteBrauchtBand) {
    return ungueltig(
      `bandSpurPfad ist gesetzt, aber die filterkette verbraucht ${BAND_LABEL} nicht. Der ` +
        'zweite Eingang bliebe unbenutzt, und der Index der stillen Tonspur zeigte ins Leere.',
    )
  }
  if (bandSpurPfad === null && ketteBrauchtBand) {
    return ungueltig(
      `die filterkette erwartet mit ${BAND_LABEL} eine Bandspur, aber bandSpurPfad ist null. ` +
        'Es gibt keinen zweiten Eingang, den sie verbrauchen koennte.',
    )
  }

  return {
    ok: true,
    wert: {
      quellPfad,
      startFrame: startFrame.wert,
      endFrame: endFrame.wert,
      bandSpurPfad,
      filterkette,
      zielPfad,
      fps: fps.wert,
      container,
    },
  }
}

/**
 * Das Ausgabelabel der Filterkette. Der Aufrufer mappt es - und weil derselbe Name an
 * zwei Stellen dieser Datei gebraucht wird (Pruefung und Argument), steht er einmal.
 */
const AUSGABE_LABEL = '[v]'

/** Das Eingangslabel der Bandspur - Eingang 1, wenn es eine gibt. */
const BAND_LABEL = '[1:v]'

/**
 * Ein Pfad, wie ffmpeg ihn gefahrlos entgegennimmt.
 *
 * Der fuehrende Bindestrich ist die eigentliche Gefahr: ffmpeg entscheidet ALLEIN an
 * ihm, ob ein Argument eine Option ist. Auch ohne Shell waere ein solcher Pfad eine
 * echte Argument-Einschleusung.
 *
 * `\n` und `\0` sind keine Schikane: Ein `\0` beendet in der Win32-API die
 * Zeichenkette still, der Prozess bekaeme also einen ANDEREN Pfad als den geprueften.
 */
function pruefePfad(feld: string, wert: unknown): string | null {
  if (typeof wert !== 'string' || wert === '') {
    return `${feld} muss ein nicht leerer Pfad sein, vorgefunden: ${beschreibe(wert)}.`
  }
  if (wert.startsWith('-')) {
    return (
      `${feld} beginnt mit einem Bindestrich (${beschreibe(wert)}). ffmpeg laese ihn als ` +
      'Option statt als Datei.'
    )
  }
  if (wert.includes('\n') || wert.includes('\0')) {
    return `${feld} enthaelt ein Zeilenende- oder Nullzeichen: ${beschreibe(wert)}.`
  }
  return null
}

/** Eine ganze, endliche Zahl `>= 0` - Bildnummern. */
function alsGanzzahlAbNull(feld: string, wert: unknown): Ergebnis<number> {
  const zahl = alsGanzzahl(feld, wert)
  if (!zahl.ok) return zahl
  if (zahl.wert < 0) {
    return ungueltig(`${feld} darf nicht negativ sein, vorgefunden: ${String(zahl.wert)}.`)
  }
  return zahl
}

/** Eine ganze, endliche Zahl `> 0` - Bildraten. */
function alsGanzzahlUeberNull(feld: string, wert: unknown): Ergebnis<number> {
  const zahl = alsGanzzahl(feld, wert)
  if (!zahl.ok) return zahl
  if (zahl.wert <= 0) {
    return ungueltig(`${feld} muss groesser als 0 sein, vorgefunden: ${String(zahl.wert)}.`)
  }
  return zahl
}

/**
 * Eine ganze, endliche Zahl.
 *
 * `Number.isInteger` weist `NaN` und `Infinity` mit ab; die Pruefung auf Endlichkeit
 * steckt also schon darin. Ausgeschrieben bleibt sie trotzdem im Meldungstext, damit
 * der Leser einer Fehlermeldung weiss, was verlangt war.
 */
function alsGanzzahl(feld: string, wert: unknown): Ergebnis<number> {
  if (typeof wert !== 'number' || !Number.isInteger(wert)) {
    return ungueltig(
      `${feld} muss eine ganze, endliche Zahl sein, vorgefunden: ${beschreibe(wert)}.`,
    )
  }
  return { ok: true, wert }
}

/** Der einzige Fehlerausgang dieser Datei - sie prueft ausschliesslich ihre eigenen Parameter. */
function ungueltig(
  meldung: string,
): { ok: false; fehler: { code: 'ungueltige_eingabe'; meldung: string } } {
  return { ok: false, fehler: { code: 'ungueltige_eingabe', meldung } }
}

/** Einen fremden Wert fuer die Meldung beschreiben, ohne ihn zu deuten. */
function beschreibe(wert: unknown): string {
  return typeof wert === 'string' ? JSON.stringify(wert) : String(wert)
}
