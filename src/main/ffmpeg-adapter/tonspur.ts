// GENERIERT aus dem Signaturblock von Issue #162.
// [ffmpeg-adapter] Stille Tonspur und Container-Argumente bilden
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
// GERUEST-PRUEFSUMME: 8314e51ab2904f91
//
// ERLEDIGT: Rumpf gefuellt, die dateiweite Abschaltzeile
// (@typescript-eslint/no-unused-vars) ist damit entfernt - Import und Parameter
// werden jetzt benutzt.
//
// WARUM DIESE DATEI GEFAEHRLICH IST: Sie entscheidet ueber zwei Eigenschaften,
// deren Fehlen KEINE Fehlermeldung erzeugt.
//
// 1. DAS STREAMLAYOUT. Der letzte Schritt der Pipeline fuegt alle Zwischenclips mit
//    `concat -c copy` zusammen. Das setzt voraus, dass ALLE Clips denselben
//    Streamaufbau haben. Fehlt einem einzigen die Tonspur, bricht ffmpeg NICHT ab.
//    NACHGEMESSEN (ffmpeg 6.1.1, 14.08.2026): zwei Zwischenclips zu je 3 s
//    verkettet, einer mit und einer ohne Tonspur - Exit-Code 0, keine Warnung, und
//    die entstandene Datei ist 6,02 s lang, ihre Tonspur aber nur 3,008 s. Der
//    Fehler zeigt sich nicht beim Rendern, sondern minutenweit hinten im Video, auf
//    dem Fernseher im Studio.
// 2. DASS UEBERHAUPT EINE TONSPUR DA IST. Das Video ist STILL und traegt trotzdem
//    Ton: Manche Player und Fernseher erwarten eine Audiospur und verhalten sich bei
//    einem reinen Video-MP4 eigenartig - bis zum Nichtabspielen. Das ist als Risiko
//    R-06 entschieden, nicht hier neu abzuwaegen.
//
// Und `+faststart` holt den Index (`moov`) an den Dateianfang. NACHGEMESSEN an
// derselben Datei: mit dem Flag liegt `moov` bei Byte 32 (vor `mdat`), ohne es bei
// Byte 1 654 875, also am Ende. Auf einem langsamen USB-Stick sind das lange
// Sekunden bis zum ersten Bild - und manche Geraete geben vorher auf.

import type { RenderProfile } from '../../shared/contracts/render-profile'

/**
 * Die Bitrate der stillen Spur - die EINE Zahl dieser Datei, die NICHT aus dem
 * Profil kommt.
 *
 * `RENDER_PROFILE` (#18) fuehrt fuer die Tonspur Codec, Abtastrate und Kanalzahl,
 * aber KEINE Bitrate; das Technische Konzept 9.2.4 sagt dort nur "niedrige
 * Bitrate". Deshalb steht sie hier, als eine benannte Konstante.
 *
 * WARUM 64 UND NICHTS KLEINERES: Die Spur enthaelt Stille, ihr Inhalt ist
 * gleichgueltig - entscheidend ist, dass sie EXISTIERT und in JEDEM Segment
 * identisch ist. 64 kbit/s sind rund 0,6 % der Videobitrate und liegen im Bereich,
 * den jeder Consumer-Decoder verarbeitet. Exotisch niedrige Raten sind genau die
 * Ecke, in der einzelne Fernseher-Decoder aussteigen - damit waere das Risiko
 * wieder da, das die Tonspur ueberhaupt erst beseitigen soll.
 *
 * Die Zahl ist eine ANFORDERUNG an den Encoder, keine Zusage ueber die Dateigroesse:
 * Beim Nachmessen belegte die codierte Stille nur rund 1,5 kbit/s (der Encoder
 * meldet die verlangten 64 kbit/s im Streamkopf und braucht sie fuer Stille nicht
 * auf). Der Zuwachs ist also noch kleiner als die obige Abschaetzung.
 */
const STILLE_BITRATE_KBPS = 64

/**
 * Kanalzahl -> LAYOUT-NAME.
 *
 * #18 fuehrt die Kanalzahl fachlich (`kanaele: 1`), `anullsrc` verlangt aber einen
 * Layout-NAMEN. Die Uebersetzung steht deshalb hier als eine benannte Tabelle statt
 * als eingestreutes Literal - sonst waere aus der Kanalzahl des Profils eine
 * Zeichenkette geworden, die mit ihr nicht mehr mitwandert.
 *
 * Der zweite Eintrag ist kein Vorrat auf Verdacht: Er ist der Beleg, dass hier
 * uebersetzt und nicht geraten wird, und er ist als solcher in der Definition of
 * Done von #162 verlangt. Weitere Eintraege gehoeren erst hierher, wenn das Profil
 * sie fuehrt.
 *
 * NACHGEMESSEN (ffmpeg 6.1.1): Beide Namen werden vom mitgelieferten Binary
 * angenommen.
 */
const KANAL_LAYOUT: Readonly<Record<1 | 2, string>> = {
  1: 'mono',
  2: 'stereo',
}

/**
 * Format -> ENCODER, dieselbe Trennung wie bei den Video-Argumenten (#161): `aac`
 * ist das FORMAT (fachlich, in #18), der Encoder-Name ist eine ffmpeg-Eigenheit.
 * Dass beide hier gleich lauten, ist ein Zufall dieser einen Zeile und kein Grund,
 * die Tabelle wegzulassen.
 *
 * Der Schluesseltyp kommt aus dem Profil: Kaeme dort ein zweites Tonformat hinzu,
 * wird DIESE Tabelle rot, statt still einen Encoder zu raten.
 *
 * KEIN `libfdk_aac`: Der ist wegen seiner Lizenz in den ueblichen Fertigbauten
 * nicht enthalten (auch nicht im mitgelieferten). Ein Encoder-Name, der auf dem
 * Rechner des Entwicklers zufaellig vorhanden ist, laesst den Render beim Kunden
 * scheitern.
 */
const AUDIO_ENCODER_JE_CODEC: Readonly<Record<RenderProfile['audio']['codec'], string>> = {
  aac: 'aac',
}

/**
 * Die EINGABE der stillen Tonquelle. Wird als ZUSAETZLICHE Eingabe an den ffmpeg-Aufruf
 * gehaengt - sie erzeugt endlos Stille.
 * Gehoert an JEDEN Normalisierungslauf (Zwischenclip), nicht an den concat-Lauf.
 */
export function baueStilleTonspurEingang(profil: RenderProfile): string[] {
  // "Einheitliche stille Tonspur: Jeder Zwischenclip erhaelt DIESELBE stille
  // AAC-Spur (9.2.4), damit das Streamlayout ueber alle Segmente gleich bleibt
  // (Voraussetzung fuer verlustfreies `-c copy`). Eine Quelle MIT Ton wird
  // verworfen und durch die stille Spur ERSETZT; eine Quelle OHNE Ton bekommt sie
  // hinzugefuegt. Entscheidend ist nicht, *ob* Ton da ist, sondern dass ALLE
  // Segmente identisch aufgebaut sind." (TK 9.2.6)
  //
  // DESHALB haengt diese Eingabe an JEDEM Normalisierungslauf - ohne Ausnahme und
  // ohne Blick darauf, was die Quelle mitbringt. Jede Fallunterscheidung an dieser
  // Stelle erzeugt zwei verschiedene Streamlayouts.
  //
  // Der Ausdruck ist EIN Argument und darf deshalb aus Teilen zusammengesetzt
  // werden: Er ist eine Filterbeschreibung, keine Kommandozeile, und enthaelt
  // niemals einen Dateipfad (vgl. TK 9.4.8 Punkt 2).
  return [
    '-f',
    'lavfi',
    '-i',
    `anullsrc=channel_layout=${layoutName(profil.audio.kanaele)}` +
      `:sample_rate=${String(profil.audio.sampleRateHz)}`,
  ]
}

/**
 * Das ausdrueckliche Mapping der stillen Tonspur.
 * `audioEingangIndex` ist die Nummer der oben angehaengten Eingabe (0-basiert, in der
 * Reihenfolge der -i-Argumente).
 * WICHTIG: Sobald irgendein -map gesetzt ist, mappt ffmpeg NICHTS mehr automatisch.
 * Genau dadurch faellt der Quellton weg - das ist gewollt und vertraglich verlangt.
 * Der Aufrufer MUSS deshalb die Videospur ebenfalls ausdruecklich mappen.
 */
export function baueTonspurMapping(audioEingangIndex: number): string[] {
  // Der Quellton wird NICHT gemappt und faellt damit weg. NACHGEMESSEN an einer
  // Quelle mit 440-Hz-Sinuston: Die Quelle misst -24,1 dB, der daraus erzeugte
  // Zwischenclip -91,0 dB - der Ton ist also tatsaechlich ersetzt, nicht
  // durchgereicht und nicht heruntergeregelt.
  //
  // Der Index wird UEBERGEBEN, nicht gesucht: Diese Funktion zaehlt keine Eingaben
  // und nimmt nicht "einfach die zweite". Nur der Aufrufer, der die Eingaben
  // zusammenstellt (#166/#167/#177), weiss, an welcher Stelle die stille Quelle
  // haengt; ob es sie gibt, prueft diese Funktion deshalb auch nicht.
  //
  // `:a:0` und nicht nur `:a`: Die stille Quelle hat genau einen Tonstrom, und die
  // ausdrueckliche Nummer bleibt richtig, falls das je anders waere.
  return ['-map', `${String(audioEingangIndex)}:a:0`]
}

/**
 * Die Kodierargumente der Tonspur. Gehoeren an JEDEN Normalisierungslauf.
 */
export function baueTonspurKodierArgumente(profil: RenderProfile): string[] {
  // "| Audio | stille AAC-Spur (48 kHz, mono, niedrige Bitrate) - in JEDEM Segment
  // identisch | Manche Player/TVs erwarten eine Audiospur und verhalten sich bei
  // rein-Video-MP4 eigenartig. Das Ergebnis ist trotzdem STILL (Anforderungsdokument
  // R-06 ist damit ENTSCHIEDEN) |" (TK 9.2.4)
  //
  // Abtastrate und Kanalzahl stehen hier ein ZWEITES Mal, obwohl sie schon in der
  // Eingabe stecken: Das ist kein Versehen. Die Eingabe legt fest, was `anullsrc`
  // ERZEUGT, diese Argumente legen fest, was der Encoder SCHREIBT. Ohne sie
  // entschiede der Encoder selbst - und genau diese Werte sind es, die ueber alle
  // Segmente gleich sein muessen.
  return [
    // Der Encoder zum Format - die einzige Uebersetzung dieser Zeile.
    '-c:a',
    AUDIO_ENCODER_JE_CODEC[profil.audio.codec],

    // Die eine Zahl, die nicht aus dem Profil kommt (s. o.). Die Einheit gehoert
    // dazu: Ohne sie deutet ffmpeg den Wert als Bit pro Sekunde.
    '-b:a',
    `${String(STILLE_BITRATE_KBPS)}k`,

    // Abtastrate und Kanalzahl AUS DEM PROFIL - dieselbe Quelle wie oben in der
    // Eingabe. Zwei Stellen, die auseinanderlaufen koennen, gaebe es nur, wenn eine
    // davon die Zahl hinschriebe.
    '-ar',
    String(profil.audio.sampleRateHz),
    '-ac',
    String(profil.audio.kanaele),

    // ZWINGEND: `anullsrc` erzeugt ENDLOS Stille. NACHGEMESSEN - ein Lauf ueber eine
    // 3 s lange Quelle ohne dieses Flag lief nach 12 s immer noch, wurde erst von
    // der gesetzten Frist beendet und hinterliess eine unlesbare Datei (kein
    // `moov`). Ohne die Frist waere er nie fertig geworden, und die Warteschlange
    // stuende fuer immer.
    '-shortest',
  ]
}

/**
 * Container-Argumente der FERTIGEN Datei (+faststart).
 * Gehoeren AUSSCHLIESSLICH an den abschliessenden concat-Lauf (#169),
 * nicht an die Zwischenclips - siehe Begruendung unten.
 */
export function baueContainerArgumente(profil: RenderProfile): string[] {
  // "| Container / Dateiname | MP4 mit `+faststart` / `<ausgabeName>.mp4` (frei,
  // FA-22) | Index vorn - hilft Playern, die ihn frueh erwarten |" (TK 9.2.4)
  //
  // NUR an der fertigen Datei: `+faststart` schreibt die Datei nach dem Encodieren
  // ein zweites Mal, um den Index nach vorn zu holen. Bei den Zwischenclips in T1
  // waere das reine Zeitverschwendung - sie werden nie abgespielt, sondern nur
  // verkettet, und `concat` liest den Index unabhaengig von seiner Position. Bei
  // 40 Elementen waeren das 40 unnoetige Neuschreibvorgaenge. Ein
  // Uniformitaetsproblem ist das NICHT: Das Flag aendert die Anordnung IM
  // CONTAINER, nicht den Streamaufbau.
  //
  // Das fuehrende `+` ERGAENZT das Flag, statt die uebrigen zu ersetzen.
  //
  // Der Fall "aus" ist kein toter Zweig: Er haelt die Aussage des Profils am Leben.
  // Waere das Flag fest, wuerde das Feld gelesen und dann ignoriert - eine
  // Einstellung, die nichts einstellt, ist schlimmer als keine.
  if (!profil.faststart) return []

  return ['-movflags', '+faststart']
}

/**
 * Der Layout-Name zu einer Kanalzahl.
 *
 * Der Parametertyp ist bewusst `keyof typeof KANAL_LAYOUT` und nicht `number`:
 * Dadurch ist der Aufruf mit `profil.audio.kanaele` der Beweis, dass die Tabelle
 * die Kanalzahl des Profils kennt. Fuehrte das Profil eines Tages eine Zahl, die
 * hier fehlt, wird die AUFRUFSTELLE rot - statt zur Laufzeit ein `undefined` in
 * den Filterausdruck zu schreiben, das ffmpeg als unbekanntes Layout zurueckweist.
 * Genau deshalb gibt es hier auch keinen Rueckfall auf einen Vorgabewert.
 */
function layoutName(kanaele: keyof typeof KANAL_LAYOUT): string {
  return KANAL_LAYOUT[kanaele]
}
