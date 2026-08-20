// GENERIERT aus dem Signaturblock von Issue #163.
// [ffmpeg-adapter] Filterkette für die Vollbild-Normalisierung bauen
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
// GERUEST-PRUEFSUMME: ff136cfac5cf4a35
//
// ERLEDIGT: Rumpf gefuellt, die dateiweite Abschaltzeile
// (@typescript-eslint/no-unused-vars) ist damit entfernt - Importe und Parameter
// werden jetzt benutzt.
//
// ============================================================================
// HIER ENTSTEHT DAS BILD - UND EIN FEHLER FAELLT IN KEINEM TEST AUF
// ============================================================================
// Diese Kette ist der REGELFALL der gesamten Render-Pipeline: Jedes Element ohne
// Werbeband laeuft durch sie. Sie entscheidet ueber drei Dinge, die erst am
// Fernseher sichtbar werden: ob ein 4:3- oder Hochkant-Video BESCHNITTEN statt
// eingepasst wird, ob eine Quelle mit nicht-quadratischen Pixeln VERZERRT
// erscheint, und ob alle Zwischenclips wirklich identisch aufgebaut sind.
// Bricht das Letzte, scheitert der spaetere `concat -c copy` NICHT - er erzeugt
// eine Datei, die nach dem ersten Segment einfriert.
//
// DIE KETTE IST VERBINDLICH (Issue #163, Abschnitt "Die zu erzeugende Kette").
// Kein Glied darf entfallen, keins die Stelle wechseln, keins hinzukommen. Wer
// hier "fuer bessere Qualitaet" etwas ergaenzt oder den Skalierer wechselt,
// aendert einen Vertrag - das gehoert ins Issue.
//
// NACHGEMESSEN mit dem mitgelieferten ffmpeg 6.1.1 (nicht behauptet, gemessen -
// Quellgroesse -> eingepasstes Rechteck im fertigen 1920x1080-Bild):
//   640x480   -> 1440 x 1080 bei x=240   (Pillarbox, kein Beschnitt)
//   1000x100  -> 1920 x  192 bei y=444   (Letterbox)
//   3840x1600 -> 1920 x  800 bei y=140   (Letterbox)
//   200x800   ->  270 x 1080 bei x=824   (Pillarbox; s. Hinweis zum Versatz unten)
//   32x32     -> 1080 x 1080 bei x=420
//   passendes Format -> vollflaechig, keine Balken
// In JEDEM Fall meldet ffprobe danach 1920x1080, SAR 1:1, yuv420p, 30 fps,
// Profil High / Level 4.0.
//
// ZUM GERADEN VERSATZ: `pad` bekommt `(ow-iw)/2`, und das kann UNGERADE sein -
// bei einem 270 px breiten Rechteck waere es 825. `yuv420p` tastet die Farbe in
// beiden Richtungen um den Faktor zwei unter und vertruege das nicht. Der
// `pad`-Filter rundet seinen Versatz deshalb SELBST auf das Farbraster ab
// (gemessen: 824 links, 826 rechts). Das ist der Grund, warum hier - anders als
// bei der Split-Geometrie (#164/#239) - KEINE Vierer-Rundung gerechnet wird:
// Dort gehen bereits gezeichnete Band-PNGs in feste Pixelmasse ein, hier
// rechnet ffmpeg aus dem tatsaechlich dekodierten Bild. Zwei Rundungsstellen
// waeren genau der Fehler, den #239 beseitigt hat.
//
// DIESE DATEI IST REIN: kein Dateizugriff, kein Prozessstart, kein ffprobe,
// keine Pfadaufloesung, kein Zufall, kein Datum. Sie ermittelt insbesondere
// KEINE Quellgroesse - die Skalierung rechnet ffmpeg aus dem dekodierten Bild.
// Zoege sie die Masse stattdessen aus der Projektdatei, gaebe es ZWEI Wahrheiten
// ueber die Groesse einer Quelle, und die aus der Projektdatei waere die falsche,
// sobald ein Video einen Drehungs-Vermerk traegt (dort stehen Breite und Hoehe
// vertauscht).

import type { RenderProfile } from '../../shared/contracts/render-profile'
import type { Ergebnis } from '../../shared/contracts/ergebnis'

/**
 * Die Zeichen, die im FILTERGRAPH trennen: `,` steht zwischen den Filtern einer
 * Kette, `;` zwischen den Ketten, `[` und `]` klammern die Label; einfaches und
 * doppeltes Anfuehrungszeichen sowie der Rueckwaertsstrich sind die Klammer- und
 * Fluchtzeichen von ffmpeg, und ein Leerzeichen beendet zusaetzlich ein Argument.
 *
 * Steht eines davon in der durchgereichten Farbe, koennte der Wert den Graphen um
 * BELIEBIGE weitere Filter erweitern. Deshalb wird abgewiesen und nicht bereinigt:
 * Eine Bereinigung liefert eine Farbe, die niemand bestellt hat, und der Fehler
 * zeigt sich dann als falsche Balkenfarbe im fertigen Video statt als Meldung.
 *
 * `:` und `=` stehen bewusst NICHT hier. Sie trennen Optionen INNERHALB eines
 * Filters und koennen keinen neuen Filter aufmachen; die Fehlerpfad-Tabelle des
 * Issues ist als vollstaendig bezeichnet, eine vierte Abweisung waere eine
 * erfundene Regel.
 */
const GRAPH_TRENNZEICHEN: readonly string[] = [',', ';', '[', ']', "'", '"', '\\', ' ']

/**
 * Baut den Wert für `-filter_complex`, der Eingang 0 auf das volle Ausgabe-Profil normalisiert.
 *
 * Ein-/Ausgabe-Label-Konvention des ganzen `ffmpeg-adapter` (gilt in #163, #164, #165 gleich):
 *   [0:v] = die Bild-/Videoquelle          (immer Eingang 0)
 *   [1:v] = die Bandspur                   (nur wenn ein Band vorhanden ist; hier NICHT benutzt)
 *   [v]   = das fertige Video-Ausgabelabel (immer; der Aufrufer mappt es mit `-map` `[v]`)
 * Die stille Tonspur (#162) ist IMMER der LETZTE Eingang, damit sich die Indizes 0 und 1 nie
 * verschieben.
 *
 * @param hintergrund  ffmpeg-Farbausdruck für Balken und Hintergrund; für die Vollbild-
 *                     Normalisierung ist das immer `'black'` (9.2.4). Der Parameter existiert,
 *                     damit #164 dieselbe Geometrie mit `flaecheDunkel` verwenden kann, ohne die
 *                     Kette zu kopieren.
 * @param profil       das feste Ausgabe-Profil, RENDER_PROFILE aus #18 – KEIN eigener Zahlenwert
 */
export function baueVollbildFilter(
  hintergrund: string,
  profil: RenderProfile,
): Ergebnis<string> {
  // Der Rueckgabewert ist IMMER die Ergebnis-Huelle, nie ein Wurf (TK 9.1.1).
  // Deshalb wird der Eingang geprueft statt geglaubt: `profil` reist als Teil des
  // Auftrags durch den Main, und ein `undefined` an dieser Stelle waere sonst eine
  // Ausnahme in einem Auftrag, dessen Zusage danach fuer immer offen bliebe.
  // SAFETY: der Cast erweitert nur um null/undefined und macht die Felder als unknown
  // sichtbar; die Form wird unmittelbar darunter geprueft (alsGanzzahlUeberNull,
  // Ergebnis-Huelle statt Wurf).
  const roh = profil as
    | { breite?: unknown; hoehe?: unknown; fps?: unknown }
    | null
    | undefined

  if (roh === null || roh === undefined) {
    return ungueltig('Es wurde kein Ausgabe-Profil uebergeben.')
  }

  // Reihenfolge wie in der Fehlerpfad-Tabelle des Issues: erst die drei Masse auf
  // endlich/ganzzahlig/groesser 0, DANACH die Geradzahligkeit. So nennt die Meldung
  // bei einem NaN das NaN und nicht ersatzweise "ungerade".
  const breite = alsMass('profil.breite', roh.breite)
  if (!breite.ok) return breite
  const hoehe = alsMass('profil.hoehe', roh.hoehe)
  if (!hoehe.ok) return hoehe
  const fps = alsMass('profil.fps', roh.fps)
  if (!fps.ok) return fps

  // Nur Breite und Hoehe: Die Bildrate hat mit der Farbunterabtastung nichts zu tun.
  const ungeradesMass =
    pruefeGerade('profil.breite', breite.wert) ?? pruefeGerade('profil.hoehe', hoehe.wert)
  if (ungeradesMass !== null) return ungueltig(ungeradesMass)

  const farbFehler = pruefeHintergrund(hintergrund)
  if (farbFehler !== null) return ungueltig(farbFehler)

  // Ab hier stehen nur noch Werte AUS DEM PROFIL in der Kette. Ein hier
  // hingeschriebenes Mass waere eine zweite Quelle fuer das TV-kritische Profil.
  const b = String(breite.wert)
  const h = String(hoehe.wert)
  const r = String(fps.wert)

  // 1. Die DECKENDE Farbflaeche in voller Ausgabegroesse.
  //    Sie ist der Grund, warum ein Quellbild MIT ALPHAKANAL (importierbares
  //    PNG/WebP) deterministisch aussieht: Ohne Komposition verlaere es seinen
  //    Alphakanal bei `format=yuv420p`, und vollstaendig transparente Pixel
  //    zeigten ihren gespeicherten, undefinierten RGB-Wert.
  //    NACHGEMESSEN: ein PNG, dessen transparente Haelfte WEISS gespeichert ist,
  //    kommt bei `hintergrund` = 0xFF0000 als ROT heraus - die Flaeche wirkt also
  //    wirklich, statt dass der gespeicherte Wert durchschlaegt.
  //    `r=` macht die Flaeche gleich in der Zielbildrate - sonst muesste ffmpeg
  //    beim Overlay zwischen zwei Raten vermitteln.
  const hintergrundFlaeche = `color=c=${hintergrund}:s=${b}x${h}:r=${r}[hg]`

  // 2. Die Quelle: konstante Bildrate, EINPASSEN ohne Beschnitt, Balken, SAR 1:1.
  //
  //    `fps=`   erzwingt die konstante Bildrate IM FILTERGRAPH, nicht erst im
  //             Muxer. Ohne das driftet eine Quelle mit schwankender Bildrate: Die
  //             gemeldete Laenge stimmt nicht mit der Datei ueberein, und beim
  //             Split laeuft das Band gegen das Video weg.
  //    `scale=…:force_original_aspect_ratio=decrease` passt EIN, ohne zu
  //             beschneiden. Ohne die Option wird auf das Zielmass VERZERRT; mit
  //             `increase` + `crop` wuerde BESCHNITTEN - beides verboten (9.2.4:
  //             "einpassen + schwarze Balken (`pad`; Letterbox/Pillarbox), kein
  //             Beschnitt").
  //    `flags=bicubic` pinnt den Skalierer. Der Vorgabewert ist buildabhaengig;
  //             gepinnt bleibt dieselbe Quelle auf jedem Rechner pixelgleich.
  //    `pad=…`  erzeugt die Balken. OHNE `pad` ist der Zwischenclip nicht in
  //             Ausgabegroesse -> Uniformitaet verletzt -> `concat -c copy`
  //             erzeugt eine kaputte Datei (9.2.6).
  //    `setsar=1` setzt das PIXEL-Seitenverhaeltnis auf 1:1.
  const quelle =
    `[0:v]fps=${r},` +
    `scale=${b}:${h}:force_original_aspect_ratio=decrease:flags=bicubic,` +
    `pad=${b}:${h}:(ow-iw)/2:(oh-ih)/2:color=${hintergrund},` +
    `setsar=1[vg]`

  // 3. Das eingepasste Bild auf die Farbflaeche legen und das Ausgabeformat festnageln.
  //
  //    `shortest=1` beendet das Overlay mit der Quelle - die `color`-Quelle ist
  //             UNENDLICH, ohne das liefe der Clip endlos weiter.
  //    `format=yuv420` (Overlay-Option) mischt alpha-korrekt im YUV-Raum. `rgb`
  //             waere ebenfalls richtig, aber deutlich langsamer; `auto` waere
  //             buildabhaengig verhandelt.
  //    `format=yuv420p` (Abschluss) ist das Pixelformat des Ausgabe-Profils -
  //             Consumer-TVs decodieren NUR 4:2:0/8 Bit (9.2.4).
  //    `setsar=1` (Abschluss) haelt SAR auch nach `overlay` fest; manche Filter
  //             setzen es zurueck, und der Wert muss am AUSGANG stehen.
  //
  //    Die beiden Formatnamen stehen hier als Literal, weil die Filtersyntax
  //    keinen Ausdruck nimmt und `overlay` den Modusnamen OHNE abschliessendes `p`
  //    erwartet. Sie MUESSEN `profil.pixelformat` entsprechen; weicht das Profil
  //    ab, ist das ein Vertragsfehler zum Melden - die Kette wird dann nicht
  //    angepasst und das Profil nicht geaendert.
  const zusammensetzung = `[hg][vg]overlay=x=0:y=0:shortest=1:format=yuv420,format=yuv420p,setsar=1[v]`

  // EINE Zeichenkette, EIN Element des spaeteren Argument-Arrays (der Wert hinter
  // `-filter_complex`). Sie wird NIEMALS in Anfuehrungszeichen gesetzt und niemals
  // mit anderen Argumenten zu einer Kommandozeile verkettet: Wer Anfuehrungszeichen
  // darum legt, macht sie zum BESTANDTEIL des Filterausdrucks, und ffmpeg meldet
  // einen unverstaendlichen Parserfehler.
  return { ok: true, wert: [hintergrundFlaeche, quelle, zusammensetzung].join(';') }
}

/**
 * Nimmt einen Profilwert als Mass entgegen: endlich, ganzzahlig, groesser als 0.
 *
 * Gibt die ZAHL zurueck und nicht nur ein Urteil, damit der Aufrufer danach mit
 * einem `number` weiterarbeitet statt mit einem `unknown`, das er selbst
 * einengen muesste - genau dort entstuende sonst die naechste Umtypung.
 */
function alsMass(feld: string, wert: unknown): Ergebnis<number> {
  if (typeof wert !== 'number' || !Number.isFinite(wert)) {
    return ungueltig(`${feld} muss eine endliche Zahl sein, vorgefunden: ${beschreibe(wert)}.`)
  }
  if (!Number.isInteger(wert)) {
    return ungueltig(`${feld} muss ganzzahlig sein (Pixel bzw. Bilder), vorgefunden: ${String(wert)}.`)
  }
  if (wert <= 0) {
    return ungueltig(`${feld} muss groesser als 0 sein, vorgefunden: ${String(wert)}.`)
  }
  return { ok: true, wert }
}

/**
 * Ungerade Kantenlaengen sind in 4:2:0 nicht darstellbar: `yuv420p` tastet die
 * Farbe in BEIDEN Richtungen um den Faktor zwei unter, es gibt also je Farbwert
 * genau einen Block aus zwei mal zwei Helligkeitswerten. Eine ungerade Kante
 * liesse den letzten Block halb leer.
 *
 * KEINE Rettung durch Runden: Das Mass kommt aus dem Ausgabe-Profil, und ein hier
 * stillschweigend um ein Pixel veraendertes Profil braeche die Uniformitaetszusage
 * fuer `concat -c copy` (9.2.6) - jeder Zwischenclip haette dann ein anderes Mass
 * als das Profil verspricht.
 */
function pruefeGerade(feld: string, wert: number): string | null {
  if (wert % 2 === 0) return null
  return (
    `${feld} ist mit ${String(wert)} ungerade. Das Ausgabe-Profil schreibt yuv420p fest; ` +
    'ungerade Kantenlaengen sind in 4:2:0 nicht darstellbar.'
  )
}

/**
 * Prueft den Farbausdruck. Zulaessig ist ein ffmpeg-Farbname (`black`) oder die
 * Form `0xRRGGBB`; abgewiesen wird ein leerer Wert und jedes Zeichen, das im
 * Filtergraph trennt.
 */
function pruefeHintergrund(hintergrund: string): string | null {
  if (typeof hintergrund !== 'string') {
    return `hintergrund muss ein Farbausdruck als Zeichenkette sein, vorgefunden: ${beschreibe(
      hintergrund,
    )}.`
  }
  if (hintergrund === '') {
    // Kein Rueckfall auf Schwarz: Der Aufrufer bestimmt die Farbe (#164 reicht
    // `flaecheDunkel` herein). Ein stiller Ersatzwert liefe darauf hinaus, dass
    // eine vergessene Markenfarbe als schwarze Flaeche im fertigen Video landet.
    return 'hintergrund ist leer; erwartet wird ein ffmpeg-Farbausdruck wie "black" oder "0xRRGGBB".'
  }
  for (const zeichen of GRAPH_TRENNZEICHEN) {
    if (hintergrund.includes(zeichen)) {
      return (
        `hintergrund enthaelt das Zeichen ${benenne(zeichen)}, das im Filtergraph trennt. ` +
        'Ein solcher Wert koennte den Graphen um beliebige weitere Filter erweitern. ' +
        'Zulaessig sind ein ffmpeg-Farbname wie "black" oder die Form "0xRRGGBB".'
      )
    }
  }
  return null
}

/** Der einzige Fehlerausgang dieser Datei - sie prueft ausschliesslich ihre eigenen Parameter. */
function ungueltig(meldung: string): { ok: false; fehler: { code: 'ungueltige_eingabe'; meldung: string } } {
  return { ok: false, fehler: { code: 'ungueltige_eingabe', meldung } }
}

/** Ein Zeichen so benennen, dass die Meldung es auch dann zeigt, wenn es unsichtbar ist. */
function benenne(zeichen: string): string {
  return zeichen === ' ' ? 'Leerzeichen' : JSON.stringify(zeichen)
}

/** Einen fremden Wert fuer die Meldung beschreiben, ohne ihn zu deuten. */
function beschreibe(wert: unknown): string {
  return typeof wert === 'string' ? JSON.stringify(wert) : String(wert)
}
