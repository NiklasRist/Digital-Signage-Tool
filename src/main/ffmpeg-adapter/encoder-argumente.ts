// GENERIERT aus dem Signaturblock von Issue #161.
// [ffmpeg-adapter] Encoder-Argumente aus RENDER_PROFILE bilden
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
// GERUEST-PRUEFSUMME: b34100c6871bfb05
//
// ERLEDIGT: Rumpf gefuellt, die dateiweite Abschaltzeile
// (@typescript-eslint/no-unused-vars) ist damit entfernt - Import und Parameter
// werden jetzt benutzt.
//
// WARUM DIESE DATEI GEFAEHRLICH IST: Ein Fehler hier faellt in KEINEM Test auf.
// ffmpeg meldet Erfolg, die Datei entsteht, sie laeuft auf dem Laptop tadellos -
// und am 85-Zoll-Samsung im Studio ruckelt sie, zeigt falsche Farben, friert nach
// dem ersten Segment ein oder startet gar nicht. Der Massstab ist deshalb NICHT
// die Bildqualitaet am Entwicklungsrechner, sondern die Abspielbarkeit auf einem
// Consumer-Fernseher. Jeder Wert steht in RENDER_PROFILE (#18) aus einem Grund,
// und der Grund steht im Technischen Konzept 9.2.4. Wer eine Option "verbessert",
// macht einen Fehler, den kein Test findet.

import type { RenderProfile } from '../../shared/contracts/render-profile'

/**
 * Format -> ENCODER. `h264` ist das FORMAT (fachlich, in #18), `libx264` der
 * ENCODER (eine ffmpeg-Eigenheit). Deshalb kennt #18 den Encoder-Namen bewusst
 * nicht, und deshalb steht die Zuordnung hier als EINE benannte Tabelle statt als
 * eingestreutes Literal.
 *
 * Der Schluesseltyp kommt aus dem Profil: Kaeme dort je ein zweites Format hinzu,
 * wird diese Tabelle rot, statt still einen Encoder zu raten.
 *
 * KEINE Hardware-Encoder (h264_nvenc, h264_qsv, h264_amf, h264_videotoolbox) und
 * keine Erkennung "falls verfuegbar": Sie ignorieren einen Teil dieser
 * Einstellungen, liefern je nach Grafiktreiber UNTERSCHIEDLICHE Dateien und
 * beherrschen die geschlossene GOP mit VBV-Deckel nicht zuverlaessig. Die
 * Uniformitaetszusage fuer `-c copy` (TK 9.2.6) haenge dann an der Hardware des
 * Nutzers - der Fehler traete nur auf MANCHEN Rechnern auf.
 */
const ENCODER_JE_CODEC: Readonly<Record<RenderProfile['videoCodec'], string>> = {
  h264: 'libx264',
}

/**
 * Bildrate-Modus: erzwingt die KONSTANTE Bildrate.
 *
 * Fest, weil das Profil keinen Modus fuehrt - es fuehrt "30 fps, CFR" als EINE
 * Aussage, und `-r` allein garantiert die Konstanz nicht. Eine Quelle mit
 * schwankender Bildrate driftet sonst: Die gemeldete Laenge stimmt nicht mit der
 * Datei ueberein, und beim Split laeuft das Band gegen das Video weg.
 *
 * Aeltere ffmpeg-Fassungen kennen statt `-fps_mode` nur `-vsync`. Ein stiller
 * Wechsel waere eine Profilaenderung an einer Stelle, die niemand mehr prueft -
 * lehnt das mitgelieferte Binary die Option ab, ist das ein BEFUND zum Melden,
 * kein Ausweichen. (Nachgemessen mit dem mitgelieferten ffmpeg 6.1.1: akzeptiert.)
 */
const BILDRATE_MODUS = 'cfr'

/**
 * GESCHLOSSENE GOP. Voraussetzung fuer `concat -c copy` (TK 9.2.6): Ohne
 * Keyframe am Segmentanfang bricht die verlustfreie Verkettung - oder schlimmer,
 * sie bricht NICHT, und die fertige Datei friert am Fernseher nach dem ersten
 * Segment ein.
 *
 * Das fuehrende `+` ERGAENZT das Flag, statt die uebrigen zu ersetzen.
 */
const GOP_FLAGS = '+cgop'

/**
 * Bildet die VIDEO-Kodierargumente aus dem Profil.
 * NICHT enthalten: Eingaben (-i), Filterketten (-vf/-filter_complex), Tonspur,
 * Container-Flags und der Ausgabepfad. Die kommen von den jeweils zustaendigen Stellen.
 */
export function baueVideoKodierArgumente(profil: RenderProfile): string[] {
  // "Alle Werte gelten identisch fuer jedes Segment - sonst scheitert die
  // Uniformitaets-Voraussetzung von -c copy (9.2.6). Das Profil ist eine
  // Konstante, wird aber explizit im Vertrag gefuehrt (spaetere Profil-Aenderung
  // = ein Datenwert, kein Schnittstellenbruch)." (TK 9.2.4)
  //
  // DESHALB kommt jeder Wert aus dem Parameter. Ein hier hingeschriebenes Literal
  // machte aus der spaeteren Profilaenderung eine Quelltextaenderung an einer
  // zweiten, leicht zu uebersehenden Stelle - und die zweite Stelle bliebe beim
  // ersten Mal stehen.
  return [
    // Der Encoder zum Format - die einzige Uebersetzung im Projekt.
    '-c:v',
    ENCODER_JE_CODEC[profil.videoCodec],

    // "Video-Codec | H.264, Profil High, Level 4.0 | 1080p30 bei ~12 Mbit/s liegt
    // sicher in Level 4.0 - der maximal kompatible Wert fuer Consumer-Geraete."
    // (TK 9.2.4)
    '-profile:v',
    profil.profil,
    '-level:v',
    profil.level,

    // "Pixelformat | yuv420p, 8 Bit | Consumer-TVs decodieren NUR 4:2:0/8 Bit.
    // Wird das Format der Quelle uebernommen (4:2:2, 4:4:4 oder 10 Bit), spielt
    // der TV die Datei nicht ab." (TK 9.2.4)
    //
    // Genau deshalb wird es GESETZT und nicht von der Quelle uebernommen: Auf dem
    // Laptop laeuft beides.
    '-pix_fmt',
    profil.pixelformat,

    // "Bildrate | 30 fps, CFR (konstant) | Voraussetzung fuer die Frame-Rundung
    // (9.2.6)." (TK 9.2.4)
    '-r',
    String(profil.fps),
    '-fps_mode',
    BILDRATE_MODUS,

    // "Ratensteuerung | gedeckeltes VBR: Ziel 10, max 12 Mbit/s, VBV-Puffer
    // 24 Mbit | Hardware-Decoder haben begrenzte Puffer; unbegrenztes VBR
    // (z. B. reines CRF) erzeugt Spitzen -> Ruckler am TV." (TK 9.2.4)
    //
    // Die drei gehoeren ZUSAMMEN: Das Ziel allein deckelt nichts, und der Deckel
    // ohne Puffergroesse ist keine VBV-Vorgabe. Der Deckel ist der Teil, der den
    // Fernseher schuetzt.
    '-b:v',
    inKilo(profil.ratensteuerung.zielBitrateKbps),
    '-maxrate',
    inKilo(profil.ratensteuerung.maxBitrateKbps),
    '-bufsize',
    inKilo(profil.ratensteuerung.vbvBufferKbit),

    // "GOP | geschlossen, <= 2 s (60 Frames); jedes Segment beginnt mit einem
    // Keyframe (IDR)." (TK 9.2.4) - BERECHNET, nie als Zahl hingeschrieben: Bei
    // einer anderen Bildrate waere die hingeschriebene Zahl eine andere Dauer.
    //
    // Ein eigenes Flag fuer den Keyframe am Segmentanfang braucht es nicht: Jeder
    // Zwischenclip ist ein EIGENER ffmpeg-Lauf, dessen erstes Bild immer ein IDR
    // ist. Verboten ist alles, was das aufhebt (ein `-g 0`, ein Intra-Refresh,
    // eine offene GOP).
    '-g',
    String(profil.fps * profil.gopMaxSekunden),
    '-flags',
    GOP_FLAGS,

    // "Farbmetadaten | BT.709 explizit gesetzt (Primaries, Transfer, Matrix) |
    // Ohne Metadaten RATEN Player, viele nehmen BT.601 an -> die Farben
    // verschieben sich, #FF4040 sieht am TV falsch aus. Bei einer Marke
    // inakzeptabel." (TK 9.2.4)
    //
    // Alle drei, nicht zwei: Ein Player, der eine davon vermisst, raet sie.
    '-color_primaries',
    profil.farbmetadaten.primaries,
    '-color_trc',
    profil.farbmetadaten.transfer,
    '-colorspace',
    profil.farbmetadaten.matrix,
  ]
}

/**
 * Haengt die Einheit an einen Kilobit-Wert.
 *
 * Ohne Einheit deutet ffmpeg die Zahl als BIT pro Sekunde - aus 10 Mbit/s wuerden
 * 10 kbit/s. Der Lauf gelaenge, die Datei entstuende, und niemand koennte im
 * Studio erklaeren, warum das Bild aussieht wie ein Videoanruf.
 */
function inKilo(kilobit: number): string {
  return `${String(kilobit)}k`
}
