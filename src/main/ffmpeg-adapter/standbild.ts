// GENERIERT aus dem Signaturblock von Issue #166.
// [ffmpeg-adapter] Standbild-Element zu einem Zwischenclip machen
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
// GERUEST-PRUEFSUMME: 1719a3f1e925e248
//
// ERLEDIGT (14.08.2026): Rumpf gefuellt, die dateiweite Abschaltzeile
// (@typescript-eslint/no-unused-vars) ist damit entfernt - jeder Parameter und
// jeder Import wird jetzt benutzt.
//
// ---------------------------------------------------------------------------
// NACHGEMESSEN, NICHT BEHAUPTET (14.08.2026, ffmpeg 6.1.1-essentials aus
// ffmpeg-static, dem Binary aus #6; gezaehlt mit ffprobe -count_frames)
// ---------------------------------------------------------------------------
// Gefahren wurde jeweils das Array, das DIESE Funktion erzeugt, ueber ein echtes
// PNG (800x800, also bewusst NICHT 16:9, damit die Balken entstehen), mit der
// echten Filterkette aus #163 und dem festen Vorspann aus #158.
//
// 1. DIE BILDZAHL IST EXAKT, NICHT UNGEFAEHR.
//
//      frames verlangt | Bilder in der Datei | Dauer laut ffprobe | Exit
//      ----------------|---------------------|--------------------|-----
//              1       |          1          |   0.034000 s       |  0
//            300       |        300          |  10.000000 s       |  0
//           1350       |       1350          |  45.000000 s       |  0
//
//    300 und 1350 sind die beiden Enden des zulaessigen Dauerbereichs: 10 s und
//    45 s bei 30 fps (Anforderungsdokument 4.4, `DAUER_BEREICH` in #21). Dass
//    10,000000 s herauskommt, ist keine Rundung, sondern die Zeitbasis: 300/30.
//    Die im `composer` angezeigte Laenge und die Laenge der Datei sind damit
//    dieselbe Zahl - und genau darauf prueft die Verifikation der fertigen Datei
//    mit ihrer FESTEN Toleranz von 0,5 s (TK 9.2.6, #180). Ein einziges Bild
//    Abweichung je Element reisst diese Toleranz ab dem sechzehnten Element.
//    (Die 0,034 s beim Ein-Bild-Clip sind die Container-Zeitbasis 1/15360, nicht
//    eine falsche Laenge: 512/15360 s = 0,03333 s wird als 0,034000 gemeldet.)
//
// 2. DER LAUF ENDET VON SELBST - und zwar NUR wegen `-frames:v`.
//    GEGENPROBE (dasselbe Array, `-frames:v 300` herausgenommen): Der Prozess
//    lief nach 20 s immer noch und musste mit SIGTERM getoetet werden; die
//    zurueckgebliebene Datei ist unlesbar ("moov atom not found"), weil ffmpeg
//    nie zum Abschluss kam. Das ist kein Schoenheitsfehler: Dieser Aufruf hat
//    ZWEI unbegrenzte Eingaenge (das mit `-loop 1` wiederholte Standbild und die
//    endlose `anullsrc`-Stille), #158 hat bewusst KEINE Zeitgrenze, der Auftrag
//    bliebe fuer immer auf "laeuft" und danach stuende die GANZE Warteschlange
//    still (kein Import, kein Loeschen, kein Export) bis zum Neustart der App.
//
// 3. `-loop 1` IST NICHT SCHMUCK. GEGENPROBE ohne dieses Argument: Exit-Code 0,
//    keine Warnung, keine Zeile auf stderr - und die Datei hat GENAU EIN Bild
//    (0,034 s) statt 300. Ein Zwischenclip von einem Dreissigstel statt zehn
//    Sekunden, ohne jede Fehlermeldung.
//
// 4. DIE STELLUNG VON `-loop 1` UND `-framerate` IST DER POSITIONELLE FALLSTRICK
//    DIESER DATEI - dieselbe Klasse wie das falsch gestellte `-ss` in #167. Beide
//    sind EINGANGS-Optionen: Sie gelten fuer den NAECHSTEN `-i`, nicht fuer den
//    Aufruf. GEGENPROBE (beide hinter `-i <bildPfad>` gestellt, also unmittelbar
//    vor dem `-f lavfi`-Eingang der stillen Tonspur): ffmpeg bricht mit "Option
//    loop not found" ab, es entsteht keine Datei. Hier faellt der Fehler also
//    auf - anders als beim `-ss` in #167, das an der falschen Stelle
//    stillschweigend den falschen Inhalt lieferte. Verlassen darf man sich darauf
//    trotzdem nicht: Es haengt daran, dass ausgerechnet der lavfi-Demuxer die
//    Option nicht kennt. Die Eingangsliste wird deshalb unten als EIN Block
//    gebaut, in dem die beiden Optionen ihrem `-i` nicht mehr entkommen koennen.
//
// 5. DIE UNIFORMITAET STIMMT (Voraussetzung fuer `concat -c copy`, TK 9.2.6).
//    Gemessen an der 300-Bilder-Datei: 1920x1080, yuv420p, h264 profile=High
//    level=40, r_frame_rate = avg_frame_rate = 30/1, SAR 1:1, Zeitbasis 1/15360,
//    dazu GENAU EINE Tonspur (aac LC, 48000 Hz, 1 Kanal). Der Alphakanal des
//    Quell-PNG ist weg und das Bild ist eingepasst - beides Arbeit der Kette aus
//    #163, hier nur nachgeprueft.
//
// 6. `-framerate` AENDERT AN DIESER STELLE NICHTS AM ERGEBNIS - und bleibt
//    trotzdem. GEGENPROBE ohne das Argument: ebenfalls 300 Bilder und 30/1 in der
//    fertigen Datei. Der Grund ist, dass die Kette aus #163 mit `fps=30` beginnt
//    und die Ausgabe ohnehin auf 30 zieht. Gemessen ist aber auch die Vorgabe des
//    Bild-Demuxers: OHNE das Argument liest ffmpeg das Standbild mit 25 fps ein
//    ("Video: png, 800x800, 25 fps, 25 tbr, 25 tbn"). Es liefe dann ein zweites
//    Bildraten-Regime im selben Lauf, das der Filter stillschweigend wieder
//    geradezieht - genau die Art von verdeckter Umrechnung, die das Ausgabe-Profil
//    vermeiden soll. Das Argument steht ausserdem so im Issue.
//
// 7. WAS SICH NICHT NACHWEISEN LIESS - ehrlich vermerkt: `-map_metadata -1`.
//    Versucht wurden (a) ein PNG mit `-metadata comment=...` - der ffmpeg-eigene
//    PNG-Muxer schreibt den Tag gar nicht erst hinein (format_tags und
//    stream_tags der Quelle sind leer), und (b) ein JPEG mit von Hand
//    eingesetztem EXIF-Block (Orientation = 6): Dieses ffmpeg meldet an der
//    Quelle WEDER einen Drehungs-Vermerk NOCH ein Display-Matrix-Side-Data, dreht
//    also gar nicht - es gibt bei einem Standbild nichts, was stehenbleiben
//    koennte. In beiden Faellen war die Ausgabe MIT und OHNE das Argument
//    metadatengleich. Das Argument bleibt trotzdem: Es ist im Issue verbindlich,
//    es kostet nichts, #170 prueft es nach - und die Aussage "dieses Binary liest
//    bei Standbildern keine Drehung" ist eine Eigenschaft der heutigen Fassung,
//    keine Zusage. Es ist hier also VORSORGE, kein nachgewiesener Effekt.
//
// 8. `-t <sekunden>` STATT `-frames:v` FIEL IM VERSUCH NICHT DURCH: bei 301, 299
//    und 137 Bildern (auf sechs Nachkommastellen umgerechnet) lieferten beide
//    Schreibweisen dieselbe Bildzahl. `-frames:v` bleibt trotzdem das Richtige,
//    weil es die Bildzahl DIREKT zaehlt, statt sie aus einer Zeit und der
//    Zeitbasis zurueckzurechnen - und weil das Issue es ausdruecklich verlangt.
//    Ein Vorteil in Messwerten ist das hier nicht, nur eine kuerzere Kette
//    zwischen der Zahl aus #174 und dem, was in der Datei steht.
//
// 9. EINE UNGEHEUER GROSSE BILDZAHL SCHEITERT LAUT, NICHT LEISE. `String(1e21)`
//    ergibt in JavaScript "1e+21" (und `Number.isInteger(1e21)` ist `true`, der
//    Wert kaeme also durch die Pruefung unten). Gemessen: ffmpeg weist das
//    Argument ab - "The value for frames:v was 1e+21 which is not within
//    -9223372036854775808.000000 - 9223372036854775808.000000", keine Datei,
//    Fehler-Exit nach 0,3 s. Es entsteht also KEIN Clip falscher Laenge. Deshalb
//    steht hier keine zusaetzliche Schranke: Die Fehlerpfad-Tabelle des Issues
//    ist als vollstaendig bezeichnet, eine erfundene siebte Abweisung waere eine
//    eigene Regel - und erreichbar ist der Fall ohnehin nicht, weil `frames` aus
//    `Math.round(dauer * 30)` mit `dauer` <= 45 s stammt (#173/#174).
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
// #162, ebenso das Audio-Mapping; die Container-Option der FERTIGEN Datei
// (+faststart) gehoert allein an den concat-Lauf (#169). Geometrie, Balken und
// das Seitenverhaeltnis setzt die Filterkette (#163). Die Umrechnung von
// Sekunden in Bilder gehoert dem `render-service` (#174, `Math.round(s * 30)`) -
// eine zweite Rundung hier waere eine zweite Wahrheit ueber die Laenge des Clips.
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

export interface StandbildAuftrag {
  /** absoluter Pfad des Standbilds (PNG in T1 oder importiertes Bild in D2) – bereits aufgelöst */
  bildPfad: string
  /** Anzahl der zu erzeugenden Frames, GANZZAHLIG. Die Rundung von Sekunden auf Frames hat
   *  bereits der `render-service` erledigt (#174). Der `ffmpeg-adapter` rechnet NICHT um. */
  frames: number
  /** fertige Filterkette für `-filter_complex`, gebaut von #163. Sie verbraucht `[0:v]` und
   *  liefert `[v]`. Diese Datei WÄHLT die Kette nicht aus und baut sie nicht selbst. */
  filterkette: string
  /** absoluter Zielpfad des Zwischenclips, z. B. <T1>/seg_0003.mp4 – bereits aufgelöst */
  zielPfad: string
}

/**
 * Das Ausgabelabel der Filterkette. Der Aufrufer mappt es - und weil derselbe Name an
 * zwei Stellen dieser Datei gebraucht wird (Pruefung und Argument), steht er einmal.
 */
const AUSGABE_LABEL = '[v]'

/**
 * Der Index der stillen Tonquelle in der Eingangsliste.
 *
 * Er ist hier FEST und trotzdem benannt, weil er eine Aussage ueber die Bauweise
 * traegt: Das Standbild ist Eingang 0, die stille Tonspur haengt als LETZTER
 * Eingang dahinter - und eine Bandspur gibt es bei einem Standbild nicht
 * ("Baender gibt es nur bei `video`-Items", #166; die Kette aus #163 verbraucht
 * ausschliesslich `[0:v]`). Damit bleibt die Label-Konvention des ganzen Moduls
 * gueltig: `[0:v]` die Bildquelle, `[1:v]` waere eine Bandspur, `[v]` das
 * Ergebnis.
 *
 * Der Wert wird UEBERGEBEN und nicht in #162 gesucht: "Diese Funktion zaehlt
 * keine Eingaben und nimmt nicht 'einfach die zweite'." (tonspur.ts, #162) Nur
 * diese Stelle kennt die Eingangsliste.
 */
const AUDIO_EINGANG_INDEX = 1

/**
 * Baut das vollständige Argument-Array für EINEN ffmpeg-Aufruf – ohne Binärpfad und ohne den
 * festen Vorspann, den #158 selbst voranstellt.
 * Startet KEINEN Prozess: Das Ausführen übernimmt der Aufrufer (`render-service`, #177) über
 * `fuehreFfmpegAus` (#158). Begründung s. u. („Warum diese Datei nichts ausführt").
 */
export function baueStandbildArgumente(
  auftrag: StandbildAuftrag,
  profil: RenderProfile,
): Ergebnis<string[]> {
  const geprueft = pruefeEingang(auftrag, profil)
  if (!geprueft.ok) return geprueft

  const { bildPfad, frames, filterkette, zielPfad, fps, container } = geprueft.wert

  // DIE EINGANGSLISTE ALS EIN BLOCK - und das ist der positionelle Kern dieser
  // Datei.
  //
  // `-loop` und `-framerate` sind EINGANGS-Optionen: Sie wirken auf den `-i`, der
  // ihnen FOLGT, nicht auf den Aufruf. Stuenden sie hinter `-i <bildPfad>`,
  // gehoerten sie zum naechsten Eingang - der stillen Tonquelle -, und das
  // Standbild bliebe ein einzelnes Bild. (Gemessen: ffmpeg bricht dann mit
  // "Option loop not found" ab; s. Punkt 4 im Kopf. Dass dieser Fall auffaellt,
  // ist Glueck des Demuxers und keine Zusage.)
  //
  // Deshalb wird die Liste hier VOLLSTAENDIG zusammengebaut, statt die beiden
  // Optionen spaeter irgendwo einzureihen: eine Stellung, die durch die Bauweise
  // stimmt und nicht durch Aufmerksamkeit.
  const eingaenge: string[] = [
    // Ohne dieses Argument liest der Bild-Demuxer die Datei EINMAL - der Clip
    // haette dann genau ein Bild (gemessen, Punkt 3 im Kopf).
    '-loop',
    '1',

    // Die Eingangs-Bildrate des Bild-Demuxers, AUS DEM PROFIL. Sie ist nicht
    // dasselbe wie die Ausgabe-Bildrate aus #161: Diese hier sagt, mit welchem
    // Zeitstempel-Abstand die wiederholten Bilder in den Filtergraph laufen.
    // Bliebe sie weg, naehme ffmpeg seinen Vorgabewert (25) und die Kette aus
    // #163 muesste auf 30 hochrechnen - ein zweites Bildraten-Regime im selben
    // Lauf, das niemand mehr sieht.
    '-framerate',
    String(fps),

    // EINGANG 0. Das Label `[0:v]` der Filterkette (#163) zeigt hierher.
    '-i',
    bildPfad,

    // EINGANG 1 und zugleich der LETZTE Eingang - s. AUDIO_EINGANG_INDEX.
    // "Gehoert an JEDEN Normalisierungslauf (Zwischenclip)" (#162): auch an ein
    // Standbild. "Entscheidend ist nicht, *ob* Ton da ist, sondern dass ALLE
    // Segmente identisch aufgebaut sind." (TK 9.2.6)
    ...baueStilleTonspurEingang(profil),
  ]

  return {
    ok: true,
    wert: [
      ...eingaenge,

      // Die Kette kommt FERTIG herein. Diese Datei waehlt sie nicht aus und
      // veraendert sie nicht - wer hier ein `scale` ergaenzt, "weil das Bild ja
      // noch skaliert werden muss", erzeugt eine zweite Geometrie-Quelle neben
      // #163.
      //
      // EIN Argument, ohne umschliessende Anfuehrungszeichen: Es gibt keine
      // Kommandozeile, die etwas zerlegen koennte (#158 startet ohne Shell), und
      // Anfuehrungszeichen wuerden BESTANDTEIL des Filterausdrucks.
      '-filter_complex',
      filterkette,

      // GENAU ZWEI `-map`-Argumente, Video zuerst. "Sobald irgendein -map gesetzt
      // ist, mappt ffmpeg NICHTS mehr automatisch." (#162) Fehlte dieses `-map`,
      // haette der Clip KEINE Videospur - und `concat -c copy` bricht daran nicht
      // ab, es entstuende eine kaputte Ausgabedatei.
      '-map',
      AUSGABE_LABEL,
      ...baueTonspurMapping(AUDIO_EINGANG_INDEX),

      // DIE LAENGE IN BILDERN, NICHT IN SEKUNDEN.
      //
      // "Ein Aktions-Segment mit 10 s Anzeigedauer muss EXAKT 300 Frames haben,
      // nicht 299 und nicht 301." (#166) `-frames:v` zaehlt AUSGABEBILDER und ist
      // von jeder Zeitrechnung unabhaengig; mit `-t <sekunden>` hinge die
      // Bildzahl an einer Fliesskomma-Umrechnung und koennte um ein Bild
      // danebenliegen. Die Rundung selbst hat der `render-service` erledigt
      // (#174: `Math.round(dauer * 30)`) - hier wird NICHT ein zweites Mal
      // gerechnet, nur eingesetzt.
      //
      // Und dies ist zugleich das einzige Argument, das den Lauf ueberhaupt
      // beenden laesst: Beide Eingaenge sind unbegrenzt, `-shortest` (aus #162)
      // kappt die Ausgabe mit dem kuerzesten Strom - und kurz ist allein die
      // Videospur, weil DIESE Zeile sie hart begrenzt. Ohne sie laeuft der Lauf
      // ewig (gemessen, Punkt 2 im Kopf).
      '-frames:v',
      String(frames),

      // Die vier Fragmente aus #161 und #162, UNVERAENDERT und VOLLSTAENDIG. Sie
      // werden hier weder gefiltert noch ergaenzt noch umsortiert.
      ...baueVideoKodierArgumente(profil),
      ...baueTonspurKodierArgumente(profil),

      // Verwirft ALLE Metadaten der Quelle. Gemeint ist vor allem ein
      // Drehungs-Vermerk: Bliebe er stehen, draehte der Fernseher ein zweites
      // Mal. VORSORGE, kein gemessener Effekt - dieses ffmpeg liest bei einem
      // Standbild gar keine Drehung (Punkt 7 im Kopf). Bleibt trotzdem, weil das
      // Issue es verbindlich verlangt und #170 es nachprueft.
      '-map_metadata',
      '-1',

      // Das Ausgabeformat AUS DEM PROFIL.
      //
      // Das Issue schreibt an dieser Stelle `mp4` aus; `profil.container` IST
      // `'mp4'` (#18), das erzeugte Array ist also dasselbe. Der Wert kommt
      // trotzdem aus dem Profil, weil der Zwilling dieser Datei - der
      // Video-Ausschnitt (#167) - es genauso haelt: Zwei Zwischenclips mit
      // verschiedenen Containern verletzten die Uniformitaet, und ein
      // hingeschriebenes Literal waere genau die zweite Stelle, die bei einer
      // Profil-Aenderung stehenbliebe.
      //
      // Ausdruecklich gesetzt, weil sonst die Endung des Zielpfads entschiede -
      // und die kommt vom Aufrufer.
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
  bildPfad: string
  frames: number
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
 * erst das Profil, dessen `fps` in die Eingangs-Bildrate eingeht, dann der Auftrag.
 */
function pruefeEingang(
  auftrag: StandbildAuftrag,
  profil: RenderProfile,
): Ergebnis<GepruefterEingang> {
  // SAFETY: der Cast erweitert nur um null/undefined und macht die Felder als unknown
  // sichtbar; die Form wird unmittelbar darunter geprueft (alsGanzzahlUeberNull,
  // typeof-Check auf container, Ergebnis-Huelle statt Wurf).
  const rohesProfil = profil as { fps?: unknown; container?: unknown } | null | undefined
  if (rohesProfil === null || rohesProfil === undefined) {
    return ungueltig('Es wurde kein Ausgabe-Profil uebergeben.')
  }

  const fps = alsGanzzahlUeberNull('profil.fps', rohesProfil.fps)
  if (!fps.ok) return fps

  // Nicht in der Fehlerpfad-Tabelle des Issues, weil jene `-f mp4` als Literal
  // fuehrt. Da der Wert hier aus dem Profil kommt (s. o.), wird er auch geprueft -
  // ein leerer oder mit `-` beginnender Formatname waere sonst genau die
  // Argument-Einschleusung, die bei den Pfaden ausgeschlossen wird. Derselbe Code,
  // dieselbe Wirkungslosigkeit; #167 haelt es genauso.
  const container = rohesProfil.container
  if (typeof container !== 'string' || container === '' || container.startsWith('-')) {
    return ungueltig(
      `profil.container muss ein nicht leerer Formatname ohne fuehrenden Bindestrich sein, ` +
        `vorgefunden: ${beschreibe(container)}.`,
    )
  }

  // SAFETY: der Cast erweitert nur um null/undefined; die Pruefung der Form folgt
  // unmittelbar darunter (null/undefined-Check, Ergebnis-Huelle statt Wurf).
  const roherAuftrag = auftrag as Partial<StandbildAuftrag> | null | undefined
  if (roherAuftrag === null || roherAuftrag === undefined) {
    return ungueltig('Es wurde kein Standbild-Auftrag uebergeben.')
  }

  const bildFehler = pruefePfad('bildPfad', roherAuftrag.bildPfad)
  if (bildFehler !== null) return ungueltig(bildFehler)
  const zielFehler = pruefePfad('zielPfad', roherAuftrag.zielPfad)
  if (zielFehler !== null) return ungueltig(zielFehler)

  // SAFETY: pruefePfad hat beide Pfade unmittelbar zuvor als nicht leere
  // Zeichenketten bestaetigt (sonst fruehe Rueckgabe ungueltig); der Cast
  // benennt diese belegte Form.
  const bildPfad = roherAuftrag.bildPfad as string
  // SAFETY: pruefePfad hat auch zielPfad zuvor als nicht leere Zeichenkette
  // bestaetigt (sonst fruehe Rueckgabe ungueltig); der Cast benennt diese Form.
  const zielPfad = roherAuftrag.zielPfad as string

  // Rein TEXTLICHER Vergleich: Diese Datei loest keine Pfade auf und normalisiert
  // nichts (das ist Sache der Pfad-Autoritaet, TK 9.5.7). Der realistische Fall -
  // der `render-service` bildet beide Pfade aus demselben Arbeitsbereich - wird
  // davon erfasst. Ein Ziel auf der Quelle ueberschriebe das Standbild: Das
  // Ueberschreib-Flag steht im festen Vorspann (#158), es gaebe also nicht einmal
  // eine Rueckfrage - und bei einem Segment-PNG in T1 waere die einzige Fassung des
  // gezeichneten Bildes weg.
  if (zielPfad === bildPfad) {
    return ungueltig(
      'zielPfad ist gleich bildPfad - Quelle und Ziel duerfen nicht dieselbe Datei sein; ' +
        'der Lauf ueberschriebe sein eigenes Standbild.',
    )
  }

  const frames = alsGanzzahl('frames', roherAuftrag.frames)
  if (!frames.ok) return frames
  if (frames.wert < 1) {
    return ungueltig(
      `frames muss mindestens 1 sein, vorgefunden: ${String(frames.wert)}. Ein Clip mit ` +
        '0 Bildern ist ein Fehler, kein leeres Segment: Er ergaebe eine leere Eingabedatei ' +
        'fuer den concat-Schritt, und die verlustfreie Verkettung bricht daran NICHT ab.',
    )
  }

  const filterkette = roherAuftrag.filterkette
  if (typeof filterkette !== 'string' || filterkette === '') {
    return ungueltig(
      `filterkette muss eine nicht leere Zeichenkette sein, vorgefunden: ` +
        `${beschreibe(filterkette)}.`,
    )
  }
  if (!filterkette.includes(AUSGABE_LABEL)) {
    return ungueltig(
      `filterkette enthaelt das Ausgabelabel ${AUSGABE_LABEL} nicht. Label-Konvention: ` +
        `[0:v] die Bildquelle, ${AUSGABE_LABEL} das Ergebnis, das der Aufrufer mappt.`,
    )
  }

  return {
    ok: true,
    wert: {
      bildPfad,
      frames: frames.wert,
      filterkette,
      zielPfad,
      fps: fps.wert,
      container,
    },
  }
}

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
function ungueltig(meldung: string): {
  ok: false
  fehler: { code: 'ungueltige_eingabe'; meldung: string }
} {
  return { ok: false, fehler: { code: 'ungueltige_eingabe', meldung } }
}

/** Einen fremden Wert fuer die Meldung beschreiben, ohne ihn zu deuten. */
function beschreibe(wert: unknown): string {
  return typeof wert === 'string' ? JSON.stringify(wert) : String(wert)
}
