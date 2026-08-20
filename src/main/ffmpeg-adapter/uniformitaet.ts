// GENERIERT aus dem Signaturblock von Issue #170.
// [ffmpeg-adapter] Uniformität der Zwischenclips vor dem concat prüfen
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
// GERUEST-PRUEFSUMME: 6332bfc4cf43d440
//
// ERLEDIGT (14.08.2026): Rumpf gefuellt, die dateiweite Abschaltzeile
// (@typescript-eslint/no-unused-vars) ist damit entfernt - jeder Import und jeder
// Parameter wird jetzt benutzt.
//
// WARUM DIESE DATEI EXISTIERT: `concat -c copy` kopiert Pakete, ohne sie anzusehen.
// Unterscheiden sich zwei Zwischenclips, meldet ffmpeg ERFOLG - und die fertige
// Datei friert am Fernseher nach dem ersten Segment ein oder verliert die Tonspur.
// NACHGEMESSEN in #162 (ffmpeg 6.1.1): zwei Clips zu je 3 s, einer mit und einer
// ohne Tonspur, verkettet zu einer Datei von 6,02 s Laenge mit 3,008 s Ton -
// Exit-Code 0, keine Warnung. Diese Datei macht aus diesem lautlosen Fehler einen
// lauten.
//
// SIE STELLT FEST UND VERAENDERT NICHTS: kein Neucodieren, kein Umbenennen, kein
// Loeschen, kein "das laesst sich noch retten". Sie liest ausschliesslich.

import { execFile } from 'node:child_process'

import type { ChildProcess, ExecFileException } from 'node:child_process'
import type { RenderProfile } from '../../shared/contracts/render-profile'
import type { Ergebnis } from '../../shared/contracts/ergebnis'

// Fremde Aufrufe - hier wird NICHTS geraten:
//
//   #6 - src/main/ffmpeg-pfad.ts
//   export function ermittleFfprobePfad(): string
//     WIRD IN DIESER DATEI ABSICHTLICH NICHT GERUFEN und deshalb auch nicht
//     importiert. Der Binaerpfad reist als PARAMETER herein; gerufen wird #6 einmal
//     je Lauf vom render-service (#181), der den Pfad an pruefeUniformitaet UND an
//     #180 durchreicht. Ein zweiter Aufrufer waere eine zweite Stelle mit eigener
//     Zeitgrenze, eigener Puffergrenze und eigener Fehlerbehandlung.

/**
 * Zeitgrenze EINES ffprobe-Laufs.
 *
 * WARUM SIE PFLICHT IST: Eine beschaedigte Datei kann ffprobe zum Haengen bringen.
 * Ohne Grenze bliebe der ganze Render stehen, ohne dass ein Fehler entsteht - und
 * mit ihm die GESAMTE Warteschlange, denn die serielle Reihenfolge ist der einzige
 * Sperr-Mechanismus des Systems (TK 9.3.5).
 *
 * WARUM DIESER WERT: Es sind kurze Dateien, die dieser Lauf soeben selbst erzeugt
 * hat. 15 Sekunden sind grosszuegig genug fuer einen langsamen Datentraeger und
 * kurz genug, dass ein Haenger auffaellt.
 */
const FFPROBE_ZEITGRENZE_MS = 15_000

/**
 * Ausgabepuffer des ffprobe-Aufrufs - AUSDRUECKLICH gesetzt.
 *
 * Der Vorgabewert unterscheidet sich zwischen Node-Versionen; ein ueberlaufender
 * Puffer bricht den Aufruf mit einer Meldung ab, die nach einem Dateifehler
 * aussieht. Gemessen belegt die Ausgabe eines Zwischenclips rund 3 KB - vier
 * Megabyte lassen also auch einer Datei mit vielen Stroemen Luft.
 */
const FFPROBE_MAX_PUFFER = 4 * 1024 * 1024

/**
 * Der ffprobe-Aufruf, verbindlich aus dem Issue - der Dateipfad wird als LETZTES
 * angehaengt.
 *
 * `-show_format` ist Pflicht und kein Beiwerk: `-show_streams` allein liefert KEIN
 * `format`-Objekt, und damit gaebe es kein `format.duration`. Das Feld
 * `dauerSekunden` bliebe leer, und #180 muesste ffprobe ein ZWEITES Mal rufen, was
 * dort ausdruecklich verboten ist. Beide Angaben kommen aus EINEM Aufruf.
 */
const FFPROBE_ARGUMENTE = [
  '-v',
  'error',
  '-hide_banner',
  '-print_format',
  'json',
  '-show_streams',
  '-show_format',
] as const

/** So viel stderr nimmt `daten.stderrAuszug` hoechstens auf. */
const STDERR_ZEICHEN = 500

/**
 * ffprobe schreibt den H.264-Profilnamen GROSS ('High'), RENDER_PROFILE fuehrt ihn
 * klein ('high'). Die Zuordnung ist eine ffprobe-Eigenheit und kein fachlicher Wert
 * - deshalb steht sie hier und nicht in #18, genau wie ENCODER_JE_CODEC
 * (h264 -> libx264) in #161 dort steht, wo ffmpeg gemeint ist.
 *
 * DIES IST DIE EINZIGE STELLE DER DATEI, AN DER DER ANZEIGENAME VORKOMMEN DARF. An
 * der Vergleichsstelle steht er nicht; sonst wanderte er bei einer Profilaenderung
 * NICHT mit.
 */
const H264_PROFIL_ANZEIGE: Record<string, string> = {
  high: 'High',
  main: 'Main',
  baseline: 'Baseline',
}

/**
 * Das erwartete Streamlayout, in Datei-Reihenfolge.
 *
 * DIE FALLE, um derentwillen dieses Issue existiert: Ein Segment ohne Tonspur
 * bricht den concat nicht ab, sondern zerstoert die Ausgabe. "Entscheidend ist
 * nicht, *ob* Ton da ist, sondern dass **alle Segmente identisch** aufgebaut sind."
 * (TK 9.2.6) - ein Segment OHNE Audiostrom ist deshalb eine Abweichung, kein
 * zulaessiger Sonderfall.
 *
 * Die beiden Woerter sind ffprobe-Vokabular (`codec_type`), kein fachlicher Wert -
 * deshalb als benannte Konstante hier und nicht im Profil. Die erwartete
 * Stromanzahl wird daraus BERECHNET und nicht ein zweites Mal hingeschrieben.
 */
const STROMART_VIDEO = 'video'
const STROMART_AUDIO = 'audio'
const ERWARTETE_STROM_ARTEN: readonly string[] = [STROMART_VIDEO, STROMART_AUDIO]

/** Art eines Stroms, dessen `codec_type` ffprobe nicht lesbar geliefert hat. */
const STROMART_UNBEKANNT = 'unbekannt'

/**
 * ffprobe laesst `field_order` bei progressivem Material oft ganz weg - ein
 * FEHLENDES Feld ist deshalb kein Fehler, ein `tt`/`bb` schon. Der Sollwert steht
 * nicht im Profil (das kennt keine Halbbilder) und deshalb hier.
 */
const FELDREIHENFOLGE_PROGRESSIV = 'progressive'

/**
 * Erwartete Drehung. Steht ebenfalls nicht im Profil: Ein stehengebliebener
 * Drehungs-Vermerk laesst den FERNSEHER ein zweites Mal drehen, obwohl das Bild
 * bereits richtig herum codiert ist.
 */
const KEINE_DREHUNG = 0

/**
 * Platzhalter fuer eine Zahl, die ffprobe nicht geliefert hat.
 *
 * WARUM EIN NEGATIVER WERT UND KEINE 0: Breite, Hoehe, Level, Abtastrate und
 * Kanalzahl sind ausnahmslos positiv. Ein negativer Platzhalter kann deshalb NIE
 * zufaellig einem Sollwert gleichen und still durchrutschen - er erzeugt immer eine
 * Abweichung, angezeigt als "nicht gesetzt".
 */
const FEHLENDER_ZAHLWERT = -1

/** Platzhalter fuer eine Zeichenkette, die ffprobe nicht geliefert hat. */
const FEHLENDER_TEXT = ''

/** So erscheint ein nicht gesetzter Wert in der Abweichung. */
const NICHT_GESETZT = '(nicht gesetzt)'

/**
 * Die Nutzdaten von `unbekannter_fehler` - MODULWEIT dieselbe Form, wortgleich mit
 * #169.
 *
 * Alle drei Felder sind optional; jede Stelle setzt genau die, die sie kennt: Diese
 * Datei setzt `datei` und `stderrAuszug`, #169 beim Schreiben der concat-Liste
 * `systemFehlercode`. TK 9.1.1 verlangt, dass die Form "je Fehlercode festgelegt
 * und typisiert" ist - JE FEHLERCODE, nicht je Fundstelle. Zwei Formen fuer einen
 * Code zwaengen den render-service (#177/#181) beim Auswerten zu raten.
 */
interface Fehlerdaten {
  systemFehlercode?: string
  datei?: string
  stderrAuszug?: string
}

/** Die für die Uniformität bedeutsamen Eigenschaften EINER Datei. */
export interface StromEigenschaften {
  datei: string
  /** Spieldauer der DATEI in Sekunden, aus `format.duration` (deshalb ruft der ffprobe-Aufruf
   *  `-show_format` MIT auf). Wird fuer die Uniformitaet NICHT verglichen – die Segmente sind
   *  unterschiedlich lang, das ist gewollt. Das Feld existiert fuer #180: Die Verifikation der
   *  fertigen Datei (TK 9.2.6, „Dauer im erwarteten Rahmen") braucht die Dauer, und #180 darf
   *  ffprobe nur EINMAL rufen. ffprobe liefert sie im selben JSON – es kostet keinen zweiten
   *  Aufruf. */
  dauerSekunden: number
  stromAnzahl: number
  /** Arten der Ströme in Datei-Reihenfolge, z. B. ['video', 'audio'] */
  stromArten: string[]
  video: {
    codec: string            // codec_name,        erwartet 'h264'
    profil: string           // profile,           erwartet 'High'
    level: number            // level,             erwartet 40  (= Level 4.0)
    breite: number
    hoehe: number
    pixelformat: string      // pix_fmt,           erwartet 'yuv420p'
    bildrate: string         // r_frame_rate,      erwartet '30/1'
    mittlereBildrate: string // avg_frame_rate,    erwartet '30/1'
    zeitbasis: string        // time_base – NICHT im Profil, nur segmentübergreifend verglichen
    pixelSeitenverhaeltnis: string | null   // sample_aspect_ratio, erwartet '1:1' oder nicht gesetzt
    farbPrimaries: string | null            // color_primaries,  erwartet 'bt709'
    farbTransfer: string | null             // color_transfer,   erwartet 'bt709'
    farbMatrix: string | null               // color_space,      erwartet 'bt709'
    feldreihenfolge: string | null          // field_order, wenn gesetzt: 'progressive'
    drehung: number          // aus side_data_list bzw. tags.rotate; erwartet 0
  } | null
  audio: {
    codec: string            // codec_name,   erwartet 'aac'
    abtastrate: number       // sample_rate,  erwartet 48000
    kanaele: number          // channels,     erwartet 1
  } | null
}

export interface Abweichung {
  datei: string
  feld: string
  erwartet: string
  gefunden: string
}

export interface Uniformitaetsbefund {
  ok: boolean
  abweichungen: Abweichung[]
}

/** Der Videoblock eines Befundes - nicht null. */
type VideoBefund = NonNullable<StromEigenschaften['video']>

/** Der Audioblock eines Befundes - nicht null. */
type AudioBefund = NonNullable<StromEigenschaften['audio']>

/**
 * EIN Vergleichsmerkmal.
 *
 * WARUM EINE TABELLE UND KEIN BLOCK AUS if-ZEILEN: Jedes Merkmal wird ZWEIMAL
 * gebraucht - gegen das Profil und gegen das erste Segment. Zwei getrennte
 * Aufzaehlungen liefen auseinander, sobald jemand ein Feld ergaenzt: Es wuerde dann
 * nur noch in einer der beiden Richtungen geprueft, ohne dass irgendetwas rot wird.
 */
interface Merkmal<Q> {
  /** Der Feldname, wie er in der Abweichung erscheint. */
  feld: string
  /**
   * Sollwert AUS DEM PROFIL - oder null, wenn das Profil dieses Merkmal nicht
   * kennt (dann wird nur untereinander verglichen).
   */
  sollwert: (profil: RenderProfile) => string | null
  /** Istwert, oder null, wenn ffprobe das Feld nicht geliefert hat. */
  istwert: (quelle: Q) => string | null
  /** Gegen das Profil ist auch ein NICHT gesetzter Istwert zulaessig. */
  fehlenErlaubt?: boolean
}

/** Merkmale, die am Befund selbst haengen (Streamlayout). */
const LAYOUT_MERKMALE: readonly Merkmal<StromEigenschaften>[] = [
  {
    feld: 'stromAnzahl',
    sollwert: () => String(ERWARTETE_STROM_ARTEN.length),
    istwert: (befund) => String(befund.stromAnzahl),
  },
  {
    feld: 'stromArten',
    sollwert: () => ERWARTETE_STROM_ARTEN.join(', '),
    istwert: (befund) => befund.stromArten.join(', '),
  },
]

/** Merkmale des Videostroms. */
const VIDEO_MERKMALE: readonly Merkmal<VideoBefund>[] = [
  {
    feld: 'codec',
    sollwert: (profil) => profil.videoCodec,
    istwert: (video) => text(video.codec),
  },
  {
    // Der Sollwert kommt aus der BENANNTEN Tabelle, nie als Literal an dieser
    // Stelle - sonst wanderte er bei einer Profilaenderung nicht mit.
    feld: 'profil',
    sollwert: (profil) => H264_PROFIL_ANZEIGE[profil.profil] ?? null,
    istwert: (video) => text(video.profil),
  },
  {
    // ffprobe meldet das Level als GANZZAHL (4.0 -> 40, 3.1 -> 31). Das ist eine
    // reine Schreibweise, keine Zuordnung - deshalb eine Rechnung und keine zweite
    // Tabelle, die bei jeder Profilaenderung gepflegt werden muesste. Die Rundung
    // faengt die Fliesskomma-Ungenauigkeit von 4.1 * 10 ab.
    feld: 'level',
    sollwert: (profil) => String(Math.round(Number(profil.level) * 10)),
    istwert: (video) => zahl(video.level),
  },
  {
    feld: 'breite',
    sollwert: (profil) => String(profil.breite),
    istwert: (video) => zahl(video.breite),
  },
  {
    feld: 'hoehe',
    sollwert: (profil) => String(profil.hoehe),
    istwert: (video) => zahl(video.hoehe),
  },
  {
    // "Consumer-TVs decodieren NUR 4:2:0/8 Bit. Wird das Format der Quelle
    // uebernommen (4:2:2, 4:4:4 oder 10 Bit), spielt der TV die Datei nicht ab."
    // (TK 9.2.4)
    feld: 'pixelformat',
    sollwert: (profil) => profil.pixelformat,
    istwert: (video) => text(video.pixelformat),
  },
  {
    // Beide Bildraten, weil eine variable Bildrate sich nur in einer von beiden
    // zeigt.
    feld: 'bildrate',
    sollwert: (profil) => bildratenBruch(profil),
    istwert: (video) => text(video.bildrate),
  },
  {
    feld: 'mittlereBildrate',
    sollwert: (profil) => bildratenBruch(profil),
    istwert: (video) => text(video.mittlereBildrate),
  },
  {
    // NICHT gegen das Profil: Der Wert ist encoderabhaengig (gemessen 1/15360) und
    // muss keinem Sollwert entsprechen - aber ueber alle Segmente GLEICH sein,
    // sonst rechnet der Demuxer die Zeitstempel um und die Ausgabe stottert.
    feld: 'zeitbasis',
    sollwert: () => null,
    istwert: (video) => text(video.zeitbasis),
  },
  {
    // "Quellvideos mit nicht-quadratischen Pixeln wuerden am TV VERZERRT
    // dargestellt" (TK 9.2.4). Ein nicht gesetztes Feld ist gegen das Profil
    // zulaessig - untereinander muss es trotzdem gleich sein.
    feld: 'pixelSeitenverhaeltnis',
    sollwert: (profil) => profil.sar,
    istwert: (video) => video.pixelSeitenverhaeltnis,
    fehlenErlaubt: true,
  },
  {
    // "Ohne Metadaten RATEN Player, viele nehmen BT.601 an -> die Farben
    // verschieben sich, #FF4040 sieht am TV falsch aus. Bei einer Marke
    // inakzeptabel." (TK 9.2.4) - ein FEHLENDER Farbwert ist deshalb eine
    // Abweichung und kein zulaessiger Sonderfall.
    feld: 'farbPrimaries',
    sollwert: (profil) => profil.farbmetadaten.primaries,
    istwert: (video) => video.farbPrimaries,
  },
  {
    feld: 'farbTransfer',
    sollwert: (profil) => profil.farbmetadaten.transfer,
    istwert: (video) => video.farbTransfer,
  },
  {
    feld: 'farbMatrix',
    sollwert: (profil) => profil.farbmetadaten.matrix,
    istwert: (video) => video.farbMatrix,
  },
  {
    feld: 'feldreihenfolge',
    sollwert: () => FELDREIHENFOLGE_PROGRESSIV,
    istwert: (video) => video.feldreihenfolge,
    fehlenErlaubt: true,
  },
  {
    feld: 'drehung',
    sollwert: () => String(KEINE_DREHUNG),
    istwert: (video) => String(video.drehung),
  },
]

/**
 * Merkmale des Audiostroms.
 *
 * `audioCodec` heisst absichtlich nicht `codec`: Sonst stuende in der Meldung
 * zweimal "codec weicht ab", und niemand wuesste, welcher Strom gemeint ist.
 */
const AUDIO_MERKMALE: readonly Merkmal<AudioBefund>[] = [
  {
    feld: 'audioCodec',
    sollwert: (profil) => profil.audio.codec,
    istwert: (audio) => text(audio.codec),
  },
  {
    feld: 'abtastrate',
    sollwert: (profil) => String(profil.audio.sampleRateHz),
    istwert: (audio) => zahl(audio.abtastrate),
  },
  {
    feld: 'kanaele',
    sollwert: (profil) => String(profil.audio.kanaele),
    istwert: (audio) => zahl(audio.kanaele),
  },
]

/**
 * Der Sollwert beider Bildraten-Felder.
 *
 * ffprobe schreibt Bildraten als BRUCH. Der Zaehler kommt aus dem Profil; der
 * Nenner ist die Schreibweise "ganze Bilder je Sekunde" und keine zweite Zahl aus
 * dem Profil.
 */
function bildratenBruch(profil: RenderProfile): string {
  return `${String(profil.fps)}/1`
}

/** Ein Textfeld als Istwert - der Platzhalter wird wieder zu "nicht geliefert". */
function text(wert: string): string | null {
  return wert === FEHLENDER_TEXT ? null : wert
}

/** Ein Zahlenfeld als Istwert - der Platzhalter wird wieder zu "nicht geliefert". */
function zahl(wert: number): string | null {
  return wert === FEHLENDER_ZAHLWERT ? null : String(wert)
}

/** Wandelt die ffprobe-JSON-Ausgabe EINER Datei in `StromEigenschaften`. REINE Funktion. */
export function leseStromEigenschaften(
  ffprobeJson: unknown,
  datei: string,
): Ergebnis<StromEigenschaften> {
  // Die Struktur wird GEPRUEFT, nicht angenommen - und bei jeder Ueberraschung ist
  // die Antwort eine Ergebnis-Huelle, nie ein `throw` (TK 9.1.1).
  const wurzel = alsObjekt(ffprobeJson)
  if (wurzel === null) {
    return unlesbar(datei, 'die Ausgabe ist kein JSON-Objekt')
  }

  const stroeme = wurzel['streams']
  if (!Array.isArray(stroeme)) {
    return unlesbar(datei, "die Ausgabe enthaelt kein Feld 'streams'")
  }

  const format = alsObjekt(wurzel['format'])
  if (format === null) {
    return unlesbar(
      datei,
      "die Ausgabe enthaelt kein 'format'-Objekt (fehlt '-show_format' im Aufruf?)",
    )
  }

  // "kommt im JSON als Zeichenkette (z. B. "12.033000") und wird mit Number(...)
  // gelesen; das Ergebnis steht unveraendert in dauerSekunden, ohne Rundung."
  //
  // KEIN Rueckfall auf 0 und KEIN NaN: Der einzige Verbraucher ist die Dauerpruefung
  // der fertigen Datei in #180. Eine stillschweigende 0 liesse dort JEDE Datei
  // durchfallen, ein NaN JEDE durchwinken - und die Pruefung, die einen
  // abgebrochenen Encoder-Lauf abfangen soll, waere wirkungslos, ohne dass
  // irgendetwas fehlschlaegt.
  const dauer = zahlVonFeld(format, 'duration')
  if (dauer === null) {
    return unlesbar(datei, "'format.duration' fehlt oder ist keine endliche Zahl")
  }

  const stromArten: string[] = []
  let video: StromEigenschaften['video'] = null
  let audio: StromEigenschaften['audio'] = null

  for (const eintrag of stroeme) {
    const strom = alsObjekt(eintrag)
    if (strom === null) {
      // Kein Abbruch: Ein unlesbarer Stromeintrag ist ein LAYOUT-Befund und wird
      // ueber stromArten gemeldet, nicht ueber die Fehler-Huelle.
      stromArten.push(STROMART_UNBEKANNT)
      continue
    }

    const art = textVonFeld(strom, 'codec_type') ?? STROMART_UNBEKANNT
    stromArten.push(art)

    // Der ERSTE Strom seiner Art zaehlt. Ein zweiter Video- oder Audiostrom faellt
    // ueber stromAnzahl/stromArten auf - dort gehoert er hin.
    if (art === STROMART_VIDEO && video === null) video = leseVideo(strom)
    if (art === STROMART_AUDIO && audio === null) audio = leseAudio(strom)
  }

  return {
    ok: true,
    wert: {
      datei,
      dauerSekunden: dauer,
      stromAnzahl: stroeme.length,
      stromArten,
      video,
      audio,
    },
  }
}

/** Liest den Videoblock eines ffprobe-Stromeintrags. */
function leseVideo(strom: Record<string, unknown>): VideoBefund {
  return {
    codec: textVonFeld(strom, 'codec_name') ?? FEHLENDER_TEXT,
    profil: textVonFeld(strom, 'profile') ?? FEHLENDER_TEXT,
    level: zahlVonFeld(strom, 'level') ?? FEHLENDER_ZAHLWERT,
    breite: zahlVonFeld(strom, 'width') ?? FEHLENDER_ZAHLWERT,
    hoehe: zahlVonFeld(strom, 'height') ?? FEHLENDER_ZAHLWERT,
    pixelformat: textVonFeld(strom, 'pix_fmt') ?? FEHLENDER_TEXT,
    bildrate: textVonFeld(strom, 'r_frame_rate') ?? FEHLENDER_TEXT,
    mittlereBildrate: textVonFeld(strom, 'avg_frame_rate') ?? FEHLENDER_TEXT,
    zeitbasis: textVonFeld(strom, 'time_base') ?? FEHLENDER_TEXT,
    pixelSeitenverhaeltnis: textVonFeld(strom, 'sample_aspect_ratio'),
    farbPrimaries: textVonFeld(strom, 'color_primaries'),
    farbTransfer: textVonFeld(strom, 'color_transfer'),
    farbMatrix: textVonFeld(strom, 'color_space'),
    feldreihenfolge: textVonFeld(strom, 'field_order'),
    drehung: leseDrehung(strom),
  }
}

/** Liest den Audioblock eines ffprobe-Stromeintrags. */
function leseAudio(strom: Record<string, unknown>): AudioBefund {
  // `sample_rate` kommt bei ffprobe als ZEICHENKETTE ("48000"), `channels` als
  // Zahl - nachgemessen am mitgelieferten ffprobe. zahlVonFeld nimmt beides.
  return {
    codec: textVonFeld(strom, 'codec_name') ?? FEHLENDER_TEXT,
    abtastrate: zahlVonFeld(strom, 'sample_rate') ?? FEHLENDER_ZAHLWERT,
    kanaele: zahlVonFeld(strom, 'channels') ?? FEHLENDER_ZAHLWERT,
  }
}

/**
 * Liest den Drehungs-Vermerk.
 *
 * ZWEI QUELLEN, weil ffprobe je nach Fassung und Container die eine oder die andere
 * benutzt: die Display-Matrix in `side_data_list` (die moderne Form) und das alte
 * `tags.rotate`. Wer nur eine davon liest, uebersieht die Haelfte der Faelle - und
 * ein stehengebliebener Vermerk laesst den FERNSEHER ein zweites Mal drehen.
 *
 * Die Display-Matrix hat Vorrang: Sie ist die Angabe, nach der sich heutige Player
 * richten. Traegt keine der beiden Quellen eine endliche Zahl, gilt "keine Drehung"
 * - das ist der Normalfall, in dem ffprobe schlicht nichts schreibt.
 */
function leseDrehung(strom: Record<string, unknown>): number {
  const seitenDaten = strom['side_data_list']
  if (Array.isArray(seitenDaten)) {
    for (const eintrag of seitenDaten) {
      const objekt = alsObjekt(eintrag)
      if (objekt === null) continue
      const drehung = zahlVonFeld(objekt, 'rotation')
      if (drehung !== null) return drehung
    }
  }

  const tags = alsObjekt(strom['tags'])
  if (tags !== null) {
    const drehung = zahlVonFeld(tags, 'rotate')
    if (drehung !== null) return drehung
  }

  return KEINE_DREHUNG
}

/**
 * Vergleicht alle Befunde gegen das Profil UND untereinander. REINE Funktion – der eigentliche
 * Prüfkern und die Stelle, an der dieses Issue ohne jedes Binary vollständig testbar ist.
 */
export function vergleicheStroeme(
  befunde: StromEigenschaften[],
  profil: RenderProfile,
): Uniformitaetsbefund {
  const abweichungen: Abweichung[] = []

  // Das ERSTE Segment ist die Bezugsgroesse fuer die Vergleiche untereinander.
  // Irgendein Bezug muss gewaehlt werden; das erste ist die einzige Wahl, die keine
  // Mehrheitsentscheidung braucht und die Meldung verstaendlich haelt ("Segment 7
  // weicht von Segment 1 ab"). Fuer die Pruefung gegen das Profil spielt der Bezug
  // ohnehin keine Rolle - dort wird jedes Segment einzeln bewertet.
  const bezug = befunde[0]
  if (bezug === undefined) return { ok: true, abweichungen }

  for (const befund of befunde) {
    const istBezug = befund === bezug

    pruefeMerkmale(LAYOUT_MERKMALE, befund, befund, istBezug ? null : bezug, profil, abweichungen)
    pruefeMerkmale(
      VIDEO_MERKMALE,
      befund,
      befund.video,
      istBezug ? null : bezug.video,
      profil,
      abweichungen,
    )
    pruefeMerkmale(
      AUDIO_MERKMALE,
      befund,
      befund.audio,
      istBezug ? null : bezug.audio,
      profil,
      abweichungen,
    )
  }

  // ALLE Abweichungen werden gesammelt, nicht die erste gemeldet: Wer beim ersten
  // Treffer abbricht, zwingt den Nutzer zu so vielen Durchlaeufen, wie es Fehler
  // gibt.
  return { ok: abweichungen.length === 0, abweichungen }
}

/**
 * Prueft eine Merkmalsgruppe eines Befundes - erst gegen das Profil, dann gegen das
 * erste Segment.
 *
 * `quelle === null` heisst: Diese Gruppe gibt es in diesem Befund gar nicht (etwa
 * der Videoblock eines Segments ohne Videostrom). Dann wird sie UEBERSPRUNGEN. Der
 * Grund: Ein fehlender Strom ist bereits ueber `stromArten` gemeldet; wuerde
 * zusaetzlich jedes einzelne Feld als "nicht gesetzt" beklagt, ertraenke die eine
 * aussagekraeftige Zeile in fuenfzehn Folgezeilen.
 *
 * `bezugsQuelle === null` heisst: kein Vergleich untereinander noetig oder moeglich
 * (der Befund IST der Bezug, oder dem Bezug fehlt die Gruppe).
 */
function pruefeMerkmale<Q>(
  merkmale: readonly Merkmal<Q>[],
  befund: StromEigenschaften,
  quelle: Q | null,
  bezugsQuelle: Q | null,
  profil: RenderProfile,
  abweichungen: Abweichung[],
): void {
  if (quelle === null) return

  for (const merkmal of merkmale) {
    const ist = merkmal.istwert(quelle)
    const soll = merkmal.sollwert(profil)

    // 1. Gegen das Profil. Zwei gleich falsche Segmente sind untereinander uniform -
    //    der concat gelaenge, und die Ausgabedatei waere trotzdem unabspielbar.
    const fehltZulaessig = ist === null && merkmal.fehlenErlaubt === true
    if (soll !== null && !fehltZulaessig && ist !== soll) {
      abweichungen.push(baueAbweichung(befund.datei, merkmal.feld, soll, ist))
      // KEINE zweite Zeile fuer dasselbe Feld: Weicht ein Segment vom Profil ab,
      // weicht es fast immer auch vom (profilkonformen) ersten Segment ab. Beide
      // Zeilen saehen gleich aus und sagten dasselbe.
      continue
    }

    // 2. Untereinander - die Zeitbasis wird AUSSCHLIESSLICH hier geprueft, weil das
    //    Profil sie nicht kennt.
    if (bezugsQuelle === null) continue
    const bezugsWert = merkmal.istwert(bezugsQuelle)
    if (ist !== bezugsWert) {
      abweichungen.push(baueAbweichung(befund.datei, merkmal.feld, bezugsWert, ist))
    }
  }
}

/** Eine Zeile des Befundes: Datei, Feldname, Erwartung, Fund. */
function baueAbweichung(
  datei: string,
  feld: string,
  erwartet: string | null,
  gefunden: string | null,
): Abweichung {
  return { datei, feld, erwartet: anzeige(erwartet), gefunden: anzeige(gefunden) }
}

/** Ein fehlender Wert erscheint als Wort, nicht als leere Stelle. */
function anzeige(wert: string | null): string {
  return wert === null || wert === FEHLENDER_TEXT ? NICHT_GESETZT : wert
}

/**
 * Liest EINE Datei mit ffprobe aus. Exportiert, weil #180 dieselbe Auslesung braucht.
 * `ffprobePfad` wird HEREINGEREICHT, nicht hier ermittelt – genauso wie #180 ihn als Parameter
 * entgegennimmt (`verifiziereUndPlatziere(..., ffprobePfad)`). So gibt es EINE Stelle, die
 * `ermittleFfprobePfad()` (#6) ruft: den `render-service`.
 */
export async function liesStromEigenschaften(
  datei: string,
  ffprobePfad: string,
): Promise<Ergebnis<StromEigenschaften>> {
  const pfadFehler = pruefeBinaerPfad(ffprobePfad)
  if (pfadFehler !== null) return pfadFehler

  const dateiFehler = pruefeDateiPfad(datei, null)
  if (dateiFehler !== null) return dateiFehler

  return new Promise((fertig) => {
    // Genau eine Antwort, unter allen Umstaenden. Bliebe eine Zusage offen, stuende
    // die GESAMTE Warteschlange still, bis die App neu gestartet wird.
    let beantwortet = false
    const antworte = (ergebnis: Ergebnis<StromEigenschaften>): void => {
      if (beantwortet) return
      beantwortet = true
      fertig(ergebnis)
    }

    try {
      // execFile - Programm und Argumente GETRENNT, ohne Shell:
      //
      // "ffprobe/ffmpeg-Argumente nie per String-Konkatenation, immer als
      // Argument-Array. Windows-Pfade enthalten regelmaessig Leerzeichen; ein
      // zusammengebautes Kommando bricht dort und funktioniert auf macOS
      // scheinbar." (TK 9.4.8 Punkt 2)
      //
      // Es gibt hier also keine Kommandozeile, die ein Leerzeichen zerlegen koennte
      // - und damit auch keinen Weg, ueber einen Dateinamen mit `"` oder `&` fremde
      // Befehle einzuschleusen.
      const kind: ChildProcess = execFile(
        ffprobePfad,
        [...FFPROBE_ARGUMENTE, datei],
        {
          timeout: FFPROBE_ZEITGRENZE_MS,
          // Nicht SIGTERM: Ein haengendes ffprobe soll nicht gebeten, sondern
          // beendet werden - genau wie in #82.
          killSignal: 'SIGKILL',
          maxBuffer: FFPROBE_MAX_PUFFER,
          // Sonst blitzt auf Windows bei JEDEM Segment kurz ein Konsolenfenster auf
          // - bei 200 Segmenten zweihundertmal.
          windowsHide: true,
        },
        (fehler, stdout, stderr) => {
          try {
            if (fehler) {
              stelleSicherDassBeendet(kind)
              antworte(
                gescheitert(
                  aufrufFehlerMeldung(fehler, ffprobePfad, datei),
                  datei,
                  stderr,
                ),
              )
              return
            }

            if (stdout.trim() === '') {
              antworte(
                gescheitert(
                  `ffprobe hat zu "${datei}" keine Ausgabe geliefert.`,
                  datei,
                  stderr,
                ),
              )
              return
            }

            let roh: unknown
            try {
              roh = JSON.parse(stdout)
            } catch (ursache) {
              antworte(
                gescheitert(
                  `ffprobe hat zu "${datei}" keine lesbare JSON-Ausgabe geliefert: ` +
                    textVon(ursache),
                  datei,
                  stderr,
                ),
              )
              return
            }

            antworte(leseStromEigenschaften(roh, datei))
          } catch (unerwartet) {
            // Auffangnetz: Auch ein Fehler in der Auswertung darf nur als
            // Ergebnis-Huelle nach aussen.
            antworte(
              gescheitert(
                `Unerwarteter Fehler beim Auswerten von "${datei}": ${textVon(unerwartet)}`,
                datei,
                stderr,
              ),
            )
          }
        },
      )

      // DIE STANDARDEINGABE WIRD GESCHLOSSEN, damit ffprobe unter keinen Umstaenden
      // auf eine Eingabe wartet.
      //
      // NACHGEMESSEN (Node v22.12.0): `execFile` reicht die Option `stdio` NICHT an
      // `spawn` weiter - ein `stdio: ['ignore', ...]` in den Optionen oben waere ein
      // stiller Blindgaenger, der aussaehe, als sei die Zusage erfuellt. Die Zusage
      // haengt deshalb an dieser Zeile: Das sofortige Dateiende ist genau das, was
      // ein wartender Leser braucht, um weiterzulaufen.
      kind.stdin?.end()
    } catch (unerwartet) {
      // execFile selbst kann werfen, bevor ueberhaupt ein Prozess entsteht.
      antworte(
        gescheitert(
          `ffprobe liess sich nicht starten: ${textVon(unerwartet)} Pfad: ${ffprobePfad}`,
          datei,
          '',
        ),
      )
    }
  })
}

/**
 * Prüft alle Zwischenclips. Wird vom `render-service` VOR dem concat-Schritt (#169) aufgerufen.
 *
 * WICHTIG zur Bedeutung des Rückgabewerts: Eine erkannte Abweichung ist KEIN `ok: false` der
 * Ergebnis-Hülle, sondern ein erfolgreicher Prüflauf mit `wert.ok === false` und der vollständigen
 * Liste der Abweichungen. Nur wenn die PRÜFUNG SELBST nicht durchführbar war (ffprobe startet
 * nicht, Ausgabe unlesbar), ist die Hülle `ok: false`.
 * Begründung: Der Aufrufer braucht die Abweichungsliste, um dem Nutzer sagen zu können, WAS nicht
 * passt. Ein Fehler-Ergebnis würde genau diese Diagnose wegwerfen und aus dem einzigen brauchbaren
 * Hinweis ein „irgendetwas ist schiefgelaufen" machen.
 */
export async function pruefeUniformitaet(
  dateien: string[],
  profil: RenderProfile,
  ffprobePfad: string,          // ermittleFfprobePfad() (#6) – vom Aufrufer geholt
): Promise<Ergebnis<Uniformitaetsbefund>> {
  const pfadFehler = pruefeBinaerPfad(ffprobePfad)
  if (pfadFehler !== null) return pfadFehler

  if (dateien.length === 0) {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: 'Es gibt nichts zu pruefen: die Liste der Zwischenclips ist leer.',
      },
    }
  }

  for (const [index, datei] of dateien.entries()) {
    const fehler = pruefeDateiPfad(datei, index)
    if (fehler !== null) return fehler
  }

  // DIE DATEIEN WERDEN NACHEINANDER GELESEN, nicht parallel: Das Ergebnis ist damit
  // deterministisch in seiner Reihenfolge, und es entsteht kein Prozessschwarm bei
  // 200 Segmenten. Der Zeitaufwand faellt gegenueber einem mehrminuetigen Render
  // nicht ins Gewicht.
  const befunde: StromEigenschaften[] = []
  for (const datei of dateien) {
    const gelesen = await liesStromEigenschaften(datei, ffprobePfad)
    // Abbruch, KEIN Teilergebnis: Ein Befund ueber die Haelfte der Segmente sagt
    // nichts darueber, ob die andere Haelfte passt.
    if (!gelesen.ok) return gelesen
    befunde.push(gelesen.wert)
  }

  return { ok: true, wert: vergleicheStroeme(befunde, profil) }
}

/**
 * Prueft den hereingereichten Binaerpfad.
 *
 * Ein Pfad, der mit `-` beginnt, wird abgewiesen - ffprobe laese ihn als Option.
 */
function pruefeBinaerPfad(ffprobePfad: string): Ergebnis<never> | null {
  if (ffprobePfad.trim() === '') {
    return eingabeFehler(
      'Der ffprobe-Pfad ist leer. Er kommt von ermittleFfprobePfad() (#6) und wird ' +
        'vom Aufrufer hereingereicht.',
    )
  }
  if (ffprobePfad.startsWith('-')) {
    return eingabeFehler(`Der ffprobe-Pfad beginnt mit "-": ${ffprobePfad}`)
  }
  return null
}

/**
 * Prueft EINEN Dateipfad.
 *
 * `index` benennt die Stelle in der Liste - oder null, wenn die Funktion mit einer
 * einzelnen Datei gerufen wurde.
 */
function pruefeDateiPfad(datei: string, index: number | null): Ergebnis<never> | null {
  const ort = index === null ? 'Der Dateipfad' : `Der Dateipfad an Stelle ${String(index)}`

  if (datei.trim() === '') {
    return eingabeFehler(`${ort} ist leer.`)
  }
  if (datei.startsWith('-')) {
    // ffprobe laese ihn als Option statt als Datei.
    return eingabeFehler(`${ort} beginnt mit "-": ${datei}`)
  }
  if (datei.includes('\n') || datei.includes('\0')) {
    return eingabeFehler(`${ort} enthaelt ein Zeilenende oder ein Nullzeichen.`)
  }
  return null
}

/** Ein abgewiesener Eingang. */
function eingabeFehler(meldung: string): Ergebnis<never> {
  return { ok: false, fehler: { code: 'ungueltige_eingabe', meldung } }
}

/**
 * Ein nicht durchfuehrbarer Prueflauf.
 *
 * Der Fehlercode wird hier NICHT in `ffmpeg_fehler` uebersetzt: Diese Datei kennt
 * die Fehlercodes des render-service nicht, und die Verdichtung gehoert dorthin
 * (TK 9.2.3). Durchgereicht wird der Rohbefund samt stderr-Auszug.
 */
function gescheitert(
  meldung: string,
  datei: string,
  stderr: string,
): Ergebnis<never> {
  const daten: Fehlerdaten = { datei, stderrAuszug: kuerze(stderr) }
  return { ok: false, fehler: { code: 'unbekannter_fehler', meldung, daten } }
}

/** Eine ffprobe-Ausgabe, aus der sich keine Eigenschaften lesen lassen. */
function unlesbar(datei: string, grund: string): Ergebnis<never> {
  const daten: Fehlerdaten = { datei }
  return {
    ok: false,
    fehler: {
      code: 'unbekannter_fehler',
      meldung: `Die ffprobe-Ausgabe zu "${datei}" ist unbrauchbar: ${grund}.`,
      daten,
    },
  }
}

/**
 * Baut die Meldung zu einem gescheiterten ffprobe-Aufruf.
 *
 * ENOENT/EACCES sind hier KEIN Dateiproblem des Nutzers, sondern ein
 * VERPACKUNGSFEHLER (#6): das mitgelieferte Binary liegt nicht ausfuehrbar an
 * seinem Platz. Deshalb nennt die Meldung den Pfad - beim Kunden ist er die einzige
 * Spur.
 */
function aufrufFehlerMeldung(
  fehler: ExecFileException,
  ffprobePfad: string,
  datei: string,
): string {
  if (fehler.code === 'ENOENT' || fehler.code === 'EACCES') {
    return (
      `ffprobe liess sich nicht ausfuehren (${String(fehler.code)}) - das ist ein ` +
      `VERPACKUNGSFEHLER: das mitgelieferte Binary fehlt an seinem Platz oder ist ` +
      `nicht ausfuehrbar. Pfad: ${ffprobePfad}`
    )
  }

  // VOR der killed-Abfrage: Node toetet den Prozess auch beim Pufferueberlauf und
  // setzt dabei ebenfalls `killed`. Umgekehrte Reihenfolge, und jeder
  // Pufferueberlauf meldete eine Zeitueberschreitung - eine Spur, die in die falsche
  // Richtung fuehrt.
  if (fehler.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER') {
    return `Die Ausgabe von ffprobe zu "${datei}" hat den Ausgabepuffer gesprengt.`
  }

  if (fehler.killed === true) {
    return (
      `ffprobe wurde nach Ablauf der Zeitgrenze von ${String(FFPROBE_ZEITGRENZE_MS)} ms ` +
      `beendet. Datei: ${datei}`
    )
  }

  return `ffprobe ist zu "${datei}" fehlgeschlagen: ${textVon(fehler)}`
}

/**
 * Beendet den Kindprozess hart, falls er noch laeuft.
 *
 * Node hat ihn bei Zeitablauf und Pufferueberlauf zwar selbst schon abgeschossen -
 * ein ffprobe, das nach einem anderen Fehler weiterlaeuft, haelt aber den
 * Datei-Handle, und genau daraus entsteht auf Windows spaeter das EBUSY beim
 * Aufraeumen des Arbeitsbereichs T1.
 */
function stelleSicherDassBeendet(kind: ChildProcess): void {
  try {
    if (kind.pid !== undefined && kind.exitCode === null && kind.signalCode === null) {
      kind.kill('SIGKILL')
    }
  } catch {
    // Bewusst verschluckt: Diese Funktion darf unter keinen Umstaenden die Antwort
    // verhindern.
  }
}

/** Kuerzt den stderr-Auszug, damit eine geschwaetzige Ausgabe kein Protokoll flutet. */
function kuerze(stderr: string): string {
  const sauber = stderr.trim()
  // Vom Ende her gekuerzt: Der Grund steht bei ffmpeg-Werkzeugen immer am Schluss.
  return sauber.length > STDERR_ZEICHEN ? sauber.slice(-STDERR_ZEICHEN) : sauber
}

/** Der Text eines geworfenen Werts - auch wenn es kein Error war. */
function textVon(ursache: unknown): string {
  return ursache instanceof Error ? ursache.message : String(ursache)
}

/** Ein Wert als Objekt - oder null, wenn er keins ist. Arrays zaehlen nicht. */
function alsObjekt(wert: unknown): Record<string, unknown> | null {
  // SAFETY: die Bedingung des ternaren Zweigs hat wert als nicht-null, nicht-Array
  // Objekt belegt; der Cast benennt genau diese belegte Form.
  return typeof wert === 'object' && wert !== null && !Array.isArray(wert)
    ? (wert as Record<string, unknown>)
    : null
}

/** Ein Feld als Text - oder null, wenn es fehlt oder leer ist. */
function textVonFeld(objekt: Record<string, unknown>, schluessel: string): string | null {
  const wert = objekt[schluessel]
  if (typeof wert === 'string') return wert.trim() === '' ? null : wert
  if (typeof wert === 'number' && Number.isFinite(wert)) return String(wert)
  return null
}

/**
 * Ein Feld als endliche Zahl - oder null.
 *
 * BEIDE Schreibweisen, weil ffprobe sie mischt: `width` und `channels` kommen als
 * Zahl, `sample_rate` und `format.duration` als Zeichenkette. Nachgemessen am
 * mitgelieferten ffprobe.
 */
function zahlVonFeld(objekt: Record<string, unknown>, schluessel: string): number | null {
  const wert = objekt[schluessel]
  if (typeof wert === 'number') return Number.isFinite(wert) ? wert : null
  if (typeof wert === 'string' && wert.trim() !== '') {
    const zahlwert = Number(wert)
    return Number.isFinite(zahlwert) ? zahlwert : null
  }
  return null
}
