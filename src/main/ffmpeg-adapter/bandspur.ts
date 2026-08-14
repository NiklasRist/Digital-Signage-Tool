// GENERIERT aus dem Signaturblock von Issue #168.
// [ffmpeg-adapter] Bandspur aus den Band-PNGs bauen
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
// GERUEST-PRUEFSUMME: 472aaa2961c330bf
//
// ERLEDIGT (14.08.2026): Rumpf gefuellt, die dateiweite Abschaltzeile
// (@typescript-eslint/no-unused-vars) ist damit entfernt - jeder Parameter und
// jeder Import wird jetzt benutzt.
//
// ============================================================================
// NACHGEMESSEN, NICHT BEHAUPTET (14.08.2026, ffmpeg 6.1.1-essentials aus
// ffmpeg-static, dem Binary aus #6)
// ============================================================================
// Die beiden Argument-Arrays unten sind nicht plausibel gefunden, sondern gegen
// echtes Material gefahren worden. Aufbau: zwei Band-PNGs 1920 x 162 mit ECHTEM
// Alphakanal - "A" halbdeckendes Rot (RGBA 253,0,0,128), "B" deckendes Gruen
// (0,254,0,255). Gemessen wurde mit ffprobe (-count_frames) und mit Pixelproben
// (select=eq(n\,<frame>), crop=1:1:10:10, rawvideo rgba).
//
//   SCHRITT 1, Abschnitte A=300 und B=150 Bilder:
//     Ergebnis 450 Bilder, 15,000 s, 30/1 fps, 1920x162. Die Naht sitzt EXAKT:
//     Bild 299 ist noch A, Bild 300 ist B. Der ALPHAWERT UEBERLEBT - im
//     geschriebenen .mov misst Bild 0 wieder (253,0,0,128), nicht (253,0,0,255).
//     Damit ist die Kernzusage dieser Datei belegt und nicht nur behauptet.
//   SCHRITT 2, gesamtFrames = 1200 aus 450:
//     Ergebnis 1200 Bilder. Die Folge wiederholt sich mit der Periode 450 und
//     bricht am Ende mitten im Abschnitt ab, genau wie verlangt: Bild 450 ist
//     wieder A, Bild 899 ist B, Bild 900 ist A, Bild 1199 ist A (1199 mod 450 =
//     299). Kein Wiederholungsfaktor wird hier gerechnet - er entsteht von
//     selbst.
//   SCHRITT 2, gesamtFrames = 100 (KUERZER als die Folge): Ergebnis 100 Bilder.
//     Der Sonderpfad, den es bewusst nicht gibt, wird auch nicht gebraucht.
//   N = 1 Abschnitt: `concat=n=1:v=1:a=0` ist gueltig und liefert die verlangte
//     Bildzahl. Der Einzelabschnitt braucht also KEINE Ausnahme.
//
// GEGENPROBEN (dass die Glieder wirklich tragen):
//   OHNE `-stream_loop -1`: 450 statt 1200 Bilder - das Band endete lange vor
//     dem Video. Das Glied traegt.
//   `-stream_loop -1` NACH dem `-i` statt davor: ffmpeg bricht LAUT ab
//     ("cannot be applied to output url ... you are trying to apply an input
//     option to an output file"). Das ist die gleiche Klasse wie die
//     `-ss`-Falle aus #167, hier aber gutartig: Sie faellt sofort auf, statt
//     stillschweigend das Falsche zu tun. Trotzdem steht die Reihenfolge unten
//     nicht zufaellig - `-stream_loop` ist eine EINGANGS-Option und gehoert vor
//     den Eingang, auf den sie wirkt.
//   OHNE `setpts=N/FRAME_RATE/TB`: mit DIESEM ffmpeg entstanden ebenfalls 1200
//     Bilder mit richtigem Inhalt - die vom Issue vorhergesagte stille
//     Verkuerzung trat NICHT ein, weil ffmpeg 6.1.1 die Zeitstempel schon beim
//     Demuxer je Schleifendurchlauf fortschreibt. Das Glied bleibt trotzdem
//     stehen: Es ist verbindlich (Issue #168), es kostet nichts, und es macht
//     die Zeitachse unabhaengig davon, ob eine kuenftige ffmpeg-Fassung diese
//     Fortschreibung beibehaelt. Wer es entfernt, verlaesst sich auf ein
//     Verhalten, das nirgends zugesagt ist.
//
// WAS HIER NICHT GEMESSEN WURDE: das Zusammenspiel mit #164/#165 (die Bandspur
// als zweiter Eingang einer Kompositionskette) und der Fall eines PNG, dessen
// Masse NICHT 1920 x H sind. Beides gehoert nicht dieser Datei - sie sieht die
// Dateien nie und skaliert nichts.
//
// DIESE DATEI IST REIN: kein Dateizugriff, kein `fs`, kein `path`, kein ffprobe,
// keine Pfadaufloesung, kein Zufall, kein Datum. Sie startet Prozesse
// ausschliesslich ueber `fuehreFfmpegAus` (#158) und wirft NIE (TK 9.1.1).

import { fuehreFfmpegAus } from './prozess'                     // #158

import type { RenderProfile } from '../../shared/contracts/render-profile'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { FfmpegFehlercode, FfmpegLauf } from './prozess'  // #158

export interface BandAbschnitt {
  /** absoluter Pfad des Band-PNG in T1 (1920 × H) – bereits vom `render-service` abgelegt (#175) */
  pngPfad: string
  /** Länge dieses Abschnitts in Frames, GANZZAHLIG. Die Rundung hat der `render-service`
   *  erledigt (#174); hier wird NICHT von Sekunden umgerechnet. */
  frames: number
}

export interface BandspurAuftrag {
  /** geordnete Folge der Abschnitte, mindestens einer */
  abschnitte: BandAbschnitt[]
  /** Bandhöhe H in Pixeln, aus `RenderItemVideo.einblendung.höhe` (#17) */
  hoeheBand: number
  /** Gesamtlänge der Bandspur in Frames = endFrame − startFrame des Videos (#167).
   *  Diese Datei berechnet sie NICHT und leitet sie NICHT aus den Abschnitten ab. */
  gesamtFrames: number
  /** absoluter Pfad der Zwischendatei (die einmal durchlaufene Abschnittsfolge) in T1 */
  sequenzPfad: string
  /** absoluter Pfad der fertigen, auf gesamtFrames gebrachten Bandspur in T1 */
  zielPfad: string
}

/**
 * Codec der Bandspur. NICHT das Ausgabe-Profil: eine Zwischendatei in T1 mit Alphakanal.
 * H.264 kann KEINEN Alphakanal - ein Einblendungs-Band verloere darin seine Transparenz.
 *
 * VORLAEUFIG - der Vermerk steht hier im Quelltext und nicht nur im Issue, damit die zwei
 * Werte auffindbar sind, falls das Experiment sie umwirft (dasselbe Muster wie bei #82).
 *
 * DAS EXPERIMENT AUS DEM STOPP-BLOCK IST GEFAHREN (14.08.2026, Entwicklungsmodus):
 * `-encoders` meldet " V....D qtrle   QuickTime Animation (RLE) video", der Encoder ist
 * also vorhanden. `-h encoder=qtrle` nennt als unterstuetzte Pixelformate
 * `rgb24 rgb555be argb gray` - `argb` traegt Alpha. Ein echter Schreibversuch mit
 * `format=rgba` am Ende des Filtergraphen erzeugt einen `argb`-Strom, und der
 * gemessene Alphawert 128 kommt beim Zurueckdecodieren unveraendert wieder heraus.
 * NICHT geprueft: dasselbe aus der gepackten Portable-EXE heraus - das kann nur der
 * User, der sie baut (offener Punkt aus #7).
 */
const BAND_CODEC = 'qtrle'      // QuickTime Animation, verlustfrei, mit Alphakanal
/** VORLAEUFIG - gilt, solange das Experiment im STOPP-Block nicht widerlegt ist. */
const BAND_CONTAINER = 'mov'

/**
 * Das Pixelformat IM FILTERGRAPH - nicht das der geschriebenen Datei.
 *
 * Es steht in JEDEM Zweig beider Ketten und ist der Grund, warum ein Einblendungs-Band
 * seine Transparenz behaelt. Ohne dieses Glied handelt ffmpeg das Format selbst aus und
 * waehlt fuer `qtrle` `rgb24` - gemessen: Der Testbefehl aus dem STOPP-Block liefert OHNE
 * ein `format`-Glied genau das, also einen Strom OHNE Alphakanal. Die Transparenz waere
 * dann weg, bevor #165 sie ueberhaupt sieht, und das Band erschiene als deckender Kasten.
 *
 * Ein benannter Wert, weil er an fuenf Stellen steht: Ein Wechsel ist damit EINE Zeile.
 * Abgeleitet wird er NICHT aus `profil.pixelformat` - dort steht `yuv420p`, das
 * AUSGABE-Format, und genau diese Verwechslung soll die Datei nicht zulassen.
 */
const BAND_PIXELFORMAT = 'rgba'

/**
 * Schritt 1: die Abschnitte EINMAL hintereinander – reine Argument-Bildung.
 * Exportiert, damit es testbar ist: Nur so laesst sich die Sequenzkette ohne Prozessstart,
 * ohne Binary und ohne PNG-Dateien vollstaendig pruefen. Ein modulfremder Aufrufer hat hier
 * nichts zu suchen - gerufen wird die Funktion ausschliesslich von `baueBandspur`.
 */
export function baueBandSequenzArgumente(
  auftrag: BandspurAuftrag,
  profil: RenderProfile,
): Ergebnis<string[]> {
  const geprueft = pruefeEingang(auftrag, profil)
  if (!geprueft.ok) return geprueft

  const { abschnitte, fps } = geprueft.wert
  const r = String(fps)

  // Die Bildzahl der einmal durchlaufenen Folge. SUMME, nicht Ableitung von
  // `gesamtFrames`: Schritt 1 schreibt die Folge genau einmal; die Wiederholung ist
  // allein Sache von Schritt 2.
  const sequenzFrames = abschnitte.reduce((summe, abschnitt) => summe + abschnitt.frames, 0)

  // Je Abschnitt ein Zweig. Das Label traegt den EINGANGS-Index, damit Zweig und
  // Eingang nicht auseinanderlaufen koennen - beide entstehen aus derselben
  // Reihenfolge und werden nirgends umsortiert.
  //
  //   fps=<r>                    vereinheitlicht die Bildrate VOR dem concat; der
  //                              Filter verlangt gleiche Parameter aller Eingaenge.
  //   trim=end_frame=<frames[i]> gibt dem Abschnitt EXAKT seine Bildzahl. Bewusst
  //                              nicht `-t <sekunden>` je Eingang: Das haenge an
  //                              einer Fliesskomma-Umrechnung und laege je Abschnitt
  //                              bis zu einem Bild daneben - ueber zehn Abschnitte
  //                              summiert sich das sichtbar auf. Die Rundung ist
  //                              VORHER geschehen (#174); hier kommen ganze Bilder an
  //                              und es wird NICHT erneut gerundet.
  //   setpts=PTS-STARTPTS        setzt die Zeitachse des Abschnitts auf 0; `concat`
  //                              verlangt fortlaufende Zeitstempel, sonst entstehen
  //                              Spruenge und der Muxer verwirft Bilder.
  //   format=<BAND_PIXELFORMAT>  erhaelt den Alphakanal (s. o.).
  //   setsar=1                   Pixel-Seitenverhaeltnis 1:1.
  const zweige = abschnitte.map(
    (abschnitt, i) =>
      `[${String(i)}:v]fps=${r},` +
      `trim=end_frame=${String(abschnitt.frames)},` +
      `setpts=PTS-STARTPTS,` +
      `format=${BAND_PIXELFORMAT},` +
      `setsar=1[a${String(i)}]`,
  )

  const zweigLabels = abschnitte.map((_, i) => `[a${String(i)}]`).join('')
  const zusammenfuegen =
    `${zweigLabels}concat=n=${String(abschnitte.length)}:v=1:a=0,` +
    `format=${BAND_PIXELFORMAT},setsar=1[v]`

  // EINE Zeichenkette, EIN Element des Argument-Arrays (der Wert hinter
  // `-filter_complex`). Niemals in Anfuehrungszeichen: Die wuerden BESTANDTEIL des
  // Filterausdrucks und ffmpeg meldete einen unverstaendlichen Parserfehler.
  const sequenzkette = [...zweige, zusammenfuegen].join(';')

  const argumente: string[] = []

  // JE ABSCHNITT EIN EINGANG - und `-loop 1` sowie `-framerate` sind EINGANGS-Optionen:
  // Sie gelten fuer den `-i`, der ihnen FOLGT. Stuenden sie einmal am Anfang, wirkten sie
  // nur auf den ersten Eingang; stuenden sie hinter dem `-i`, waeren sie Ausgabe-Optionen.
  // Das ist dieselbe Positionsfalle wie `-ss` in #167 - deshalb entsteht jedes Tripel hier
  // in EINER Schleife und nicht in drei getrennten Durchlaeufen.
  //
  // `-loop 1` macht das Standbild zu einem unendlichen Strom; begrenzt wird er allein
  // durch `trim=end_frame` im Zweig und durch `-frames:v` am Ausgang.
  for (const abschnitt of abschnitte) {
    argumente.push('-loop', '1', '-framerate', r, '-i', abschnitt.pngPfad)
  }

  argumente.push(
    '-filter_complex', sequenzkette,
    '-map', '[v]',
    // Die Bandspur hat KEINEN Ton. Ein zusaetzlicher Tonstrom verschoebe bei `-map` in
    // #167 die Indizes.
    '-an',
    '-frames:v', String(sequenzFrames),
    // `-r` und `-fps_mode cfr` stehen hier sehr wohl - und das ist KEINE Doppelung zu
    // #161: Die Bandspur ist kein Ausgabe-Artefakt, `baueVideoKodierArgumente` wird
    // NICHT gerufen, also kaeme die Bildrate sonst von nirgendwo. Sie muss die
    // Zeitachse des Videos teilen (TK 9.2.4: "30 fps, CFR").
    '-r', r,
    '-fps_mode', 'cfr',
    '-c:v', BAND_CODEC,
    // Keine Metadaten aus den PNGs: Orientierungs- und Farbprofil-Tags haben in einer
    // Zwischendatei nichts zu suchen.
    '-map_metadata', '-1',
    // Muxer ausdruecklich festlegen, statt ihn aus der Endung raten zu lassen.
    '-f', BAND_CONTAINER,
    auftrag.sequenzPfad,
  )

  return { ok: true, wert: argumente }
}

/**
 * Schritt 2: die Sequenz wiederholen und auf `gesamtFrames` abschneiden – reine Argument-Bildung.
 * Exportiert, damit es testbar ist (gleiche Begruendung wie bei Schritt 1); auch sie wird
 * ausschliesslich modulintern von `baueBandspur` gerufen.
 */
export function baueBandSchleifeArgumente(
  auftrag: BandspurAuftrag,
  profil: RenderProfile,
): Ergebnis<string[]> {
  // DIESELBE Pruefung wie Schritt 1, obwohl Schritt 2 die `abschnitte` nicht benutzt.
  // Zwei Gruende: Die Fehlerpfad-Tabelle des Issues gilt fuer die Datei, nicht je
  // Funktion - und beide Funktionen beschreiben denselben Auftrag. Duerfte Schritt 2
  // einen Auftrag durchwinken, den Schritt 1 abweist, gaebe es zwei verschiedene
  // Gueltigkeitsbegriffe fuer dasselbe Objekt.
  const geprueft = pruefeEingang(auftrag, profil)
  if (!geprueft.ok) return geprueft

  const r = String(geprueft.wert.fps)

  //   fps=<r>                  haelt die Bildrate auch ueber die Schleifengrenzen.
  //   setpts=N/FRAME_RATE/TB   erzeugt eine NEUE, streng aufsteigende Zeitachse aus der
  //                            laufenden Bildnummer - unabhaengig davon, welche
  //                            Zeitstempel die wiederholte Datei mitbringt.
  //   format=<BAND_PIXELFORMAT> erhaelt den Alphakanal - hier genauso wichtig wie in
  //                            Schritt 1: Diese Datei ist die, die #164/#165 lesen.
  const schleifenkette =
    `[0:v]fps=${r},setpts=N/FRAME_RATE/TB,format=${BAND_PIXELFORMAT},setsar=1[v]`

  return {
    ok: true,
    wert: [
      // EINGANGS-Option, deshalb VOR dem `-i`: `-stream_loop` liest den folgenden
      // Eingang unbegrenzt oft erneut. Hinter dem `-i` bricht ffmpeg ab (gemessen,
      // s. Kopf). Der Weg ueber die Zwischendatei statt ueber den `loop`-FILTER ist
      // Absicht: Der Filter hielte alle zu wiederholenden Bilder im Arbeitsspeicher -
      // eine 45-s-Folge sind 1350 Bilder zu je 1920 x 162 x 4 Byte, rund 1,7 GB fuer
      // ein einziges Element.
      '-stream_loop', '-1',
      '-i', auftrag.sequenzPfad,
      '-filter_complex', schleifenkette,
      '-map', '[v]',
      '-an',
      // Die Laenge steht AUSSCHLIESSLICH hier - kein `-shortest`, kein `-t`, kein `-to`.
      // `gesamtFrames` kommt fertig herein (endFrame - startFrame des Videos, #167) und
      // wird weder berechnet noch aufgerundet noch korrigiert: "Die Elementdauer
      // bestimmt allein das Video (Trim). Das Band verlaengert oder verkuerzt sie nie."
      // (TK 9.2.8)
      '-frames:v', String(auftrag.gesamtFrames),
      '-r', r,
      '-fps_mode', 'cfr',
      '-c:v', BAND_CODEC,
      '-map_metadata', '-1',
      '-f', BAND_CONTAINER,
      auftrag.zielPfad,
    ],
  }
}

/**
 * Führt beide Schritte nacheinander aus. Die EINZIGE Funktion dieses Issues, die einen Prozess
 * startet – und sie tut es ausschließlich über `fuehreFfmpegAus` (#158).
 *
 * Der Rückgabetyp ist EXAKT der von `fuehreFfmpegAus` (#158) – das Ergebnis wird UNVERÄNDERT
 * durchgereicht: kein Code wird hier übersetzt, keine Meldung umformuliert.
 *
 * `lauf` ist optional und wird UNVERAENDERT an BEIDE `fuehreFfmpegAus`-Aufrufe weitergereicht.
 * Diese Datei erzeugt die drei Felder nicht, deutet sie nicht und legt sie nicht ab.
 */
export async function baueBandspur(
  auftrag: BandspurAuftrag,
  profil: RenderProfile,
  lauf?: Pick<FfmpegLauf, 'aufAusgabeZeile' | 'aufProzessStart' | 'abbruchSignal'>,
): Promise<Ergebnis<void, FfmpegFehlercode>> {
  // BEIDE Argument-Arrays entstehen VOR dem ersten Prozessstart. Wuerde Schritt 2 erst
  // nach dem Lauf von Schritt 1 gebildet, koennte ein ungueltiger Auftrag erst ffmpeg
  // beschaeftigen und dann doch scheitern - mit einer halb geschriebenen Zwischendatei
  // in T1 als einzigem Ergebnis.
  const schritt1 = baueBandSequenzArgumente(auftrag, profil)
  if (!schritt1.ok) return schritt1

  const schritt2 = baueBandSchleifeArgumente(auftrag, profil)
  if (!schritt2.ok) return schritt2

  // `{ argumente, ...lauf }` - ein OBJEKT, nicht das Array direkt. Ist `lauf`
  // undefined, ergaenzt der Spread NICHTS: Die drei Felder fehlen dann, statt als
  // `undefined` dazustehen. Hier wird nichts erfunden und nichts gedeutet.
  //
  // WARUM DAS DURCHREICHEN TRAEGT: Ohne `abbruchSignal` waere der Abbrechen-Knopf
  // waehrend des laengsten Schritts wirkungslos; ohne `aufProzessStart` bekaeme der
  // Abbrecher (#159) das Prozess-Handle nie zu sehen, und der `render-service` (#181)
  // raeumte den Arbeitsbereich UNTER einem noch laufenden ffmpeg auf - auf Windows
  // scheitert das mit EBUSY, und in T1 bleiben Leichen liegen.
  const ergebnisSequenz = await fuehreFfmpegAus({ argumente: schritt1.wert, ...lauf })
  // UNVERAENDERT zurueck - kein uebersetzter Code, keine umformulierte Meldung. Und
  // Schritt 2 wird NICHT gestartet: Seine Eingangsdatei ist gerade nicht entstanden.
  if (!ergebnisSequenz.ok) return ergebnisSequenz

  return fuehreFfmpegAus({ argumente: schritt2.wert, ...lauf })
}

/** Die aus dem Auftrag geholten, gepruefen Werte - damit der Aufrufer mit `number` weiterarbeitet. */
interface GepruefterEingang {
  abschnitte: readonly BandAbschnitt[]
  fps: number
}

/**
 * Prueft den GESAMTEN Eingang beider Schritte an EINER Stelle.
 *
 * REIHENFOLGE IST BEGRUENDUNG: Das Profil kommt zuerst, obwohl die Fehlerpfad-Tabelle des
 * Issues mit `abschnitte` beginnt - aus `profil.hoehe` stammt die Obergrenze, gegen die
 * `hoeheBand` geprueft wird. Ohne gueltige `profil.hoehe` lautete die Meldung zur Bandhoehe
 * "zulaessig: 2 bis NaN" und zeigte auf das falsche Feld. Dieselbe Ueberlegung steht in
 * #165. Welcher Fehler zuerst gemeldet wird, ist Meldungsqualitaet - der CODE ist in jedem
 * Fall `ungueltige_eingabe`.
 */
function pruefeEingang(
  auftrag: BandspurAuftrag,
  profil: RenderProfile,
): Ergebnis<GepruefterEingang> {
  // Beide Werte reisen als Teil des Auftrags durch den Main; ein `undefined` an dieser
  // Stelle waere sonst eine Ausnahme in einem Auftrag, dessen Zusage danach fuer immer
  // offen bliebe. Deshalb wird geprueft statt geglaubt (TK 9.1.1: niemals `throw`).
  const rohesProfil = profil as unknown as
    | { hoehe?: unknown; fps?: unknown }
    | null
    | undefined
  if (rohesProfil === null || rohesProfil === undefined) {
    return ungueltig('Es wurde kein Ausgabe-Profil uebergeben.')
  }

  const hoehe = alsMass('profil.hoehe', rohesProfil.hoehe)
  if (!hoehe.ok) return hoehe
  const fps = alsMass('profil.fps', rohesProfil.fps)
  if (!fps.ok) return fps

  const roherAuftrag = auftrag as unknown as Partial<BandspurAuftrag> | null | undefined
  if (roherAuftrag === null || roherAuftrag === undefined) {
    return ungueltig('Es wurde kein Bandspur-Auftrag uebergeben.')
  }

  const abschnitte = roherAuftrag.abschnitte
  if (!Array.isArray(abschnitte) || abschnitte.length === 0) {
    return ungueltig(
      'abschnitte muss mindestens einen Eintrag haben: Ein Band ohne Abschnitte hat nichts zu zeigen.',
    )
  }

  // Der Index steht in JEDER Meldung. Bei zwoelf Abschnitten ist "ein Pfad ist leer"
  // sonst nicht behebbar.
  for (const [i, abschnitt] of abschnitte.entries()) {
    const roherAbschnitt = abschnitt as BandAbschnitt | null | undefined
    if (roherAbschnitt === null || roherAbschnitt === undefined) {
      return ungueltig(`abschnitte[${String(i)}] fehlt.`)
    }
    const pfadFehler = pruefePfad(`abschnitte[${String(i)}].pngPfad`, roherAbschnitt.pngPfad)
    if (pfadFehler !== null) return ungueltig(pfadFehler)

    const frames = alsMass(`abschnitte[${String(i)}].frames`, roherAbschnitt.frames)
    if (!frames.ok) return frames
  }

  const gesamt = alsMass('gesamtFrames', roherAuftrag.gesamtFrames)
  if (!gesamt.ok) return gesamt

  const band = alsMass('hoeheBand', roherAuftrag.hoeheBand)
  if (!band.ok) return band
  if (band.wert >= hoehe.wert) {
    return ungueltig(
      `hoeheBand muss kleiner als profil.hoehe sein (zulaessig: 2 bis ` +
        `${String(hoehe.wert - 2)}), vorgefunden: ${String(band.wert)}. ` +
        'Sonst bliebe kein Video uebrig, das noch zu sehen waere.',
    )
  }
  // `hoeheBand` steht in KEINEM Argument - die Flaeche bringen die PNGs mit, hier wird
  // nichts skaliert. Geprueft wird trotzdem, damit ein offensichtlich falsches H
  // auffaellt, BEVOR drei Bausteine spaeter ein `vstack` oder ein `overlay` mit einer
  // unverstaendlichen Meldung abbricht.
  if (band.wert % 2 !== 0) {
    return ungueltig(
      `hoeheBand ist mit ${String(band.wert)} ungerade. Das Ausgabe-Profil schreibt yuv420p ` +
        'fest; in der 4:2:0-Farbunterabtastung teilen sich je zwei Zeilen eine Farbinformation, ' +
        'ungerade Kantenlaengen und Versaetze sind darin nicht darstellbar. Berichtigt wird das ' +
        'in der Band-Vorlage, NICHT hier durch Runden - ein hier veraendertes H passte nicht ' +
        'mehr zu den bereits gezeichneten PNGs.',
    )
  }

  const sequenzFehler = pruefePfad('sequenzPfad', roherAuftrag.sequenzPfad)
  if (sequenzFehler !== null) return ungueltig(sequenzFehler)
  const zielFehler = pruefePfad('zielPfad', roherAuftrag.zielPfad)
  if (zielFehler !== null) return ungueltig(zielFehler)

  const sequenzPfad = roherAuftrag.sequenzPfad
  const zielPfad = roherAuftrag.zielPfad
  if (sequenzPfad === zielPfad) {
    return ungueltig(
      'sequenzPfad und zielPfad sind gleich. Schritt 2 laese und schriebe dieselbe Datei; ' +
        'das Ergebnis waere bestenfalls unbrauchbar.',
    )
  }

  // Beide Zielpfade gegen ALLE Quell-PNGs. Ein Ziel, das auf einem Band-PNG liegt,
  // ueberschriebe die Quelle - das Ueberschreiben-Flag steht im festen Vorspann (#158),
  // ohne dass ein Aufrufer es setzen muesste; es gaebe also
  // nicht einmal eine Rueckfrage. Verglichen wird REIN TEXTLICH: Diese Datei loest
  // keine Pfade auf und normalisiert nichts (das ist Sache der Pfad-Autoritaet, TK
  // 9.5.7). Der realistische Fall - der `render-service` bildet alle drei Pfade aus
  // demselben Arbeitsbereich - wird davon erfasst.
  for (const [i, abschnitt] of abschnitte.entries()) {
    const pngPfad = (abschnitt as BandAbschnitt).pngPfad
    if (pngPfad === sequenzPfad) {
      return ungueltig(
        `sequenzPfad ist gleich abschnitte[${String(i)}].pngPfad - der Lauf ueberschriebe seine eigene Quelle.`,
      )
    }
    if (pngPfad === zielPfad) {
      return ungueltig(
        `zielPfad ist gleich abschnitte[${String(i)}].pngPfad - der Lauf ueberschriebe seine eigene Quelle.`,
      )
    }
  }

  return { ok: true, wert: { abschnitte: abschnitte as readonly BandAbschnitt[], fps: fps.wert } }
}

/**
 * Nimmt einen Wert als Mass entgegen: endlich, ganzzahlig, groesser als 0.
 *
 * Gibt die ZAHL zurueck und nicht nur ein Urteil, damit der Aufrufer danach mit einem
 * `number` weiterarbeitet statt mit einem `unknown`, das er selbst einengen muesste -
 * genau dort entstuende sonst die naechste Umtypung.
 */
function alsMass(feld: string, wert: unknown): Ergebnis<number> {
  if (typeof wert !== 'number' || !Number.isFinite(wert)) {
    return ungueltig(`${feld} muss eine endliche Zahl sein, vorgefunden: ${beschreibe(wert)}.`)
  }
  if (!Number.isInteger(wert)) {
    return ungueltig(
      `${feld} muss ganzzahlig sein (Pixel bzw. Bilder), vorgefunden: ${String(wert)}.`,
    )
  }
  if (wert <= 0) {
    return ungueltig(`${feld} muss groesser als 0 sein, vorgefunden: ${String(wert)}.`)
  }
  return { ok: true, wert }
}

/**
 * Prueft einen Pfad, der als Argument an ffmpeg geht. Gibt die Meldung zurueck - oder null.
 *
 * EIN FUEHRENDES `-` WIRD ABGEWIESEN und nicht etwa entschaerft: ffmpeg laese den Pfad als
 * OPTION. Die naheliegende Rettung `./` davorzusetzen ist hier verboten - das waere eine
 * Pfadaufloesung, und die gehoert der Pfad-Autoritaet (TK 9.5.7), nicht dem Adapter.
 *
 * `\n` und `\0` sind keine Schikane: Ein `\0` beendet in der Win32-API die Zeichenkette
 * still, der Prozess bekaeme also einen ANDEREN Pfad als den hier geprueften.
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
