// GENERIERT aus dem Signaturblock von Issue #165.
// [ffmpeg-adapter] Filterkette für die Einblendung bauen
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
// GERUEST-PRUEFSUMME: 241861b71b4ec352
//
// ERLEDIGT: Rumpf gefuellt, die dateiweite Abschaltzeile
// (@typescript-eslint/no-unused-vars) ist damit entfernt - Importe und Parameter
// werden jetzt benutzt.
//
// ============================================================================
// DER UNTERSCHIED ZU #164 IST DER OPTISCH GROESSTE IM GANZEN PRODUKT
// ============================================================================
// „Art B - `einblendung`: Band *ueber* dem vollflaechigen Video. Das Video wird
// wie gewohnt auf 1920 x 1080 normalisiert (schwarze Balken nach 9.2.4, keine
// Verkleinerung, keine Markenfarb-Flaechen). Das Band (1920 x H, mit Alpha) wird
// unten ueberlagert (y = 1080 - H)." (TK 9.2.8)
//
// Bei `split` (#164) wird das Video VERKLEINERT und das Band sitzt DARUNTER;
// hier behaelt das Video seine volle Groesse und das Band liegt DARUEBER. Wer
// die beiden verwechselt, erzeugt kein Fehlerbild und keine Fehlermeldung -
// sondern ein Video, das grundlegend anders aussieht als die Vorschau. DIESE
// DATEI BAUT AUSSCHLIESSLICH ART B. Die Auswahl trifft der Dispatcher im
// `render-service` (#177) anhand von `RenderItemVideo.einblendung.art` (#17) -
// die Art wird hier NICHT erraten, weder aus der Bandhoehe noch aus dem
// Alphakanal des Band-PNG noch aus dem Seitenverhaeltnis der Quelle.
//
// WARUM AUF DEM ZWEIG [1:v] KEIN `format=yuv420p` STEHEN DARF: `yuv420p` hat
// keinen Alphakanal. Wer die Bandspur vor dem `overlay` in dieses Format zwingt,
// wirft die Transparenz weg - das Band erscheint dann als DECKENDER KASTEN ueber
// dem Video, obwohl es als teiltransparente Einblendung gestaltet wurde. Der
// Fehler ist eine einzige Zeile und im fertigen Video sofort sichtbar, im Code
// aber voellig unauffaellig, WEIL DIESELBE ZEILE BEI `split` RICHTIG IST (#164,
// `[1:v]fps=…,format=yuv420p,setsar=1[unten]`).
// Die `format`-Option des `overlay`-Filters sagt dagegen nur, in welchem RAUM
// gemischt wird: Mit `format=yuv420` konvertiert `overlay` den Ueberlagerungs-
// Eingang nach `yuva420p`, Alpha BLEIBT erhalten. Erst das abschliessende
// `format=yuv420p` NACH dem Mischen entfernt den dann verbrauchten Alphakanal.
//
// HIER WIRD NICHTS AUF VIER GERUNDET - und das ist kein Versehen. „Die
// Vierer-Rundung aus TK 9.2.8 betrifft diese Datei NICHT." (#165) Bei `split`
// muss die eingepasste Videobreite `(1080 - H) x 16/9` auf ein Vielfaches von 4
// abgerundet werden, weil sonst der zentrierte x-Versatz ungerade wird; gerechnet
// wird das an genau EINER Stelle, in `berechneBandGeometrie` (#239), und ueber
// `bestimmeBandgeometrie` (#176) an #164 uebergeben. Bei `einblendung` gibt es
// nichts einzupassen: Das Video fuellt `profil.breite x profil.hoehe` ganz aus,
// und der einzige Versatz ist `y = profil.hoehe - hoeheBand` - der ist gerade,
// sobald beide Summanden gerade sind, und genau das prueft der Rumpf unten.
// Wer die Rundung hier trotzdem einbaute, verkleinerte das Video um bis zu 3 px
// und schuefe die zweite Rundungsstelle, die #239 gerade beseitigt hat. Diese
// Datei nimmt deshalb KEINE Einpass-Werte entgegen und importiert die
// Bandgeometrie NICHT.
//
// NACHGEMESSEN mit dem mitgelieferten ffmpeg 6.1.1 (nicht behauptet, gemessen -
// 14.08.2026). Aufbau: eine 2 s lange Videoquelle in EINER Farbe, dazu eine
// Bandspur 1920 x H mit ECHTEM Alphakanal (Rot, `format=rgba` +
// `colorchannelmixer=aa=0.5`, also halbdeckend), dazu die stille Tonspur; die
// hier gebaute Kette unveraendert als `-filter_complex`, danach x264
// High/Level 4.0. Ausgewertet mit ffprobe und Pixelproben
// (`format=rgb24,crop=1:1:x:y` + rawvideo).
//
//   H = 162, Quelle 1920x1080 blau -> 1920x1080, yuv420p, SAR 1:1, 30 fps,
//            Profil High. Zeile y = 917 ist das REINE Video (0,0,248), die
//            Bandkante sitzt exakt bei y = 918 und reicht bis y = 1079. Im
//            Bandbereich steht (132,0,123) bzw. (128,0,124) - eine MISCHUNG aus
//            Videoblau und Bandrot. Der Alphakanal wirkt also wirklich.
//   Gegenprobe mit `format=yuv420p` auf dem Zweig [1:v]: derselbe Bereich zeigt
//            (255,0,1), also die REINE Bandfarbe - das Video ist verdeckt, genau
//            der deckende Kasten aus dem Absatz oben. Der Unterschied ist EINE
//            Zeile im Code und faellt in keinem Typtest auf.
//   H = 200, Quelle 640x480 (4:3) gruen -> das Video ist ueber die VOLLE Hoehe
//            1080 eingepasst: Bildinhalt von x = 242 bis x = 1678, Schwarz bei
//            x = 238 und x = 1682, also ein 1440 px breites Rechteck. Waere es
//            wie bei `split` auf 1080 - 200 = 880 verkleinert worden, waere es
//            nur 1173 px breit (x = 373 bis 1546) - x = 242 und x = 1678 waeren
//            dann schwarz. Genau diese vier Punkte trennen Art B von Art A.
//            Die Bandkante sitzt exakt bei y = 880 = 1080 - 200.
//   H = 162, Bandspur 1900 statt 1920 px breit -> ffmpeg bricht NICHT ab,
//            sondern legt das schmalere Band linksbuendig auf; bei x = 1910
//            steht weiter reines Videoblau. Anders als `vstack` (#164) verlangt
//            `overlay` keine gleiche Breite. Genau deshalb prueft der
//            `render-service` die PNG-Masse (TK 9.2.3, `ungueltiges_element`) -
//            diese Datei kann es nicht, sie sieht die Datei nie.
//
// DIESE DATEI IST REIN: kein Dateizugriff, kein Prozessstart, kein ffprobe,
// keine Pfadaufloesung, kein Import aus dem `config-store`, kein `leseMarke`,
// kein Zufall, kein Datum. Sie enthaelt KEINE Hexzahl und KEINE Markenfarbe:
// „bei `einblendung` gilt das unveraendert; die Ausnahme mit der Markenfarbe
// betrifft ausschliesslich `split`" (#165) - die Balken sind schwarz nach
// TK 9.2.4.

import type { RenderProfile } from '../../shared/contracts/render-profile'
import type { Ergebnis } from '../../shared/contracts/ergebnis'

/**
 * Die Farbe der Balken und des Hintergrunds.
 *
 * „Seitenverhaeltnis-Politik | einpassen + schwarze Balken (`pad`;
 * Letterbox/Pillarbox), kein Beschnitt" (TK 9.2.4). Das ist KEIN Markenwert und
 * keine Entscheidung dieser Datei, sondern das Ausgabe-Profil - deshalb steht
 * hier der ffmpeg-Farbname und keine Hexzahl. Die Markenfarbe `flaecheDunkel`
 * kommt ausschliesslich in der Split-Komposition vor (#164).
 *
 * Ein benannter Wert und kein Parameter: Die Signatur dieser Funktion ist
 * verbindlich `baueEinblendungFilter(hoeheBand, profil)`; eine durchgereichte
 * Farbe waere ein zweiter Weg, die Balkenfarbe zu bestimmen.
 */
const BALKENFARBE = 'black'

/**
 * Baut den Wert für `-filter_complex` der Kompositionsart `einblendung` (TK 9.2.8 Art B).
 *
 * Label-Konvention des ganzen `ffmpeg-adapter` (identisch in #163, #164, #165):
 *   [0:v] = das Video          (immer Eingang 0)
 *   [1:v] = die Bandspur       (immer Eingang 1, wenn ein Band vorhanden ist)
 *   [v]   = das Ausgabelabel   (der Aufrufer mappt es mit `-map` `[v]`)
 * Die stille Tonspur (#162) ist IMMER der LETZTE Eingang – hier also Eingang 2 –, damit sich die
 * Indizes 0 und 1 nie verschieben.
 *
 * @param hoeheBand  Bandhöhe H in Pixeln, aus `RenderItemVideo.einblendung.höhe` (#17), beim
 *                   Einreihen aus der Band-Vorlage eingefroren. Hier wird NICHTS nachgeschlagen.
 * @param profil     RENDER_PROFILE (#18) – die Quelle aller übrigen Zahlen
 */
export function baueEinblendungFilter(
  hoeheBand: number,
  profil: RenderProfile,
): Ergebnis<string> {
  // Der Rueckgabewert ist IMMER die Ergebnis-Huelle, nie ein Wurf (TK 9.1.1).
  // Deshalb wird der Eingang geprueft statt geglaubt: Beide Werte reisen als Teil
  // des Auftrags durch den Main, und ein `undefined` an dieser Stelle waere sonst
  // eine Ausnahme in einem Auftrag, dessen Zusage danach fuer immer offen bliebe.
  const roh = profil as unknown as
    | { breite?: unknown; hoehe?: unknown; fps?: unknown }
    | null
    | undefined

  if (roh === null || roh === undefined) {
    return ungueltig('Es wurde kein Ausgabe-Profil uebergeben.')
  }

  // Das Profil ZUERST, obwohl die Fehlerpfad-Tabelle des Issues mit `hoeheBand`
  // beginnt: Aus dem Profil stammt die Obergrenze, gegen die `hoeheBand` geprueft
  // wird. Ohne gueltige `profil.hoehe` lautete die Meldung zur Bandhoehe
  // „zulaessig: 1 bis NaN" und zeigte auf das falsche Feld.
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

  const band = alsMass('hoeheBand', hoeheBand)
  if (!band.ok) return band
  if (band.wert >= hoehe.wert) {
    return ungueltig(
      `hoeheBand muss kleiner als profil.hoehe sein (zulaessig: 1 bis ` +
        `${String(hoehe.wert - 1)}), vorgefunden: ${String(band.wert)}. ` +
        'Sonst bliebe kein Video uebrig, das noch zu sehen waere.',
    )
  }

  const ungeradesBand = pruefeGerade('hoeheBand', band.wert)
  if (ungeradesBand !== null) return ungueltig(ungeradesBand)

  // Ab hier stehen nur noch gepruefte Werte in der Kette. Ein hier hingeschriebenes
  // Mass waere eine zweite Quelle fuer das TV-kritische Profil.
  const b = String(breite.wert)
  const h = String(hoehe.wert)
  const r = String(fps.wert)

  // Die obere Kante des Bandes im fertigen Bild: „unten ueberlagert (y = 1080 - H)"
  // (TK 9.2.8). GERADE, weil beide Summanden es sind - und die Geradzahligkeit ist
  // hier nicht Kosmetik: In `yuv420p` teilen sich je zwei Zeilen eine
  // Farbinformation. Laege die Bandoberkante auf einer ungeraden Zeile, verliefe
  // die Kante quer durch einen Farbblock und erschiene als ausgefranste, verfaerbte
  // Linie ueber die volle Bildbreite. Deshalb wird `hoeheBand` oben abgewiesen und
  // NICHT gerundet: Der richtige Ort fuer die Berichtigung ist die Band-Vorlage.
  const by = String(hoehe.wert - band.wert)

  // 1. Die DECKENDE schwarze Flaeche in voller Ausgabegroesse.
  //    Sie ist der Grund, warum eine Quelle MIT Alphakanal deterministisch
  //    aussieht: Ohne Komposition verlaere sie ihren Alphakanal bei
  //    `format=yuv420p`, und vollstaendig transparente Pixel zeigten ihren
  //    gespeicherten, undefinierten RGB-Wert.
  //    `r=` macht die Flaeche gleich in der Zielbildrate - sonst muesste ffmpeg
  //    beim Overlay zwischen zwei Raten vermitteln.
  const hintergrundFlaeche = `color=c=${BALKENFARBE}:s=${b}x${h}:r=${r}[hg]`

  // 2. Das Video auf die VOLLE Flaeche - nicht auf `hoehe - hoeheBand`.
  //    Hier liegt der Unterschied zu #164 in einer einzigen Zahl: `scale=<b>:<h>`
  //    statt `scale=<eingepasst>:<h - H>`. „das Video behaelt seine volle Groesse;
  //    dafuer verdeckt das Band den unteren Bildbereich" (TK 9.2.8).
  //
  //    `fps=`   erzwingt die konstante Bildrate IM FILTERGRAPH, nicht erst im
  //             Muxer. Ohne das driftet eine Quelle mit schwankender Bildrate, und
  //             das Band liefe gegen das Video weg.
  //    `scale=<b>:<h>:force_original_aspect_ratio=decrease` passt EIN, ohne zu
  //             beschneiden. „einpassen + schwarze Balken (`pad`;
  //             Letterbox/Pillarbox), kein Beschnitt" (TK 9.2.4) - mit `increase`
  //             + `crop` wuerden Produkte, Gesichter und Preise am Rand
  //             abgeschnitten.
  //    `flags=bicubic` pinnt den Skalierer; der Vorgabewert ist buildabhaengig.
  //    `pad=<b>:<h>` erzeugt die Balken und bringt den Zwischenclip auf
  //             Ausgabegroesse. OHNE `pad` ist die Uniformitaet verletzt und
  //             `concat -c copy` (TK 9.2.6) erzeugt eine Datei, die nach dem
  //             ersten Segment einfriert. Der Versatz `(ow-iw)/2` ist ein Ausdruck
  //             von ffmpeg ueber das tatsaechlich dekodierte Bild; `pad` rundet
  //             ihn selbst auf das Farbraster ab (in #163 nachgemessen).
  //    `setsar=1` setzt das PIXEL-Seitenverhaeltnis auf 1:1.
  const quelle =
    `[0:v]fps=${r},` +
    `scale=${b}:${h}:force_original_aspect_ratio=decrease:flags=bicubic,` +
    `pad=${b}:${h}:(ow-iw)/2:(oh-ih)/2:color=${BALKENFARBE},` +
    `setsar=1[vg]`

  // 3. Das eingepasste Video auf die schwarze Flaeche legen - der Hintergrund ist
  //    damit abgeflacht und traegt keinen Alphakanal mehr.
  //
  //    `shortest=1` beendet das Overlay mit der Quelle - die `color`-Quelle ist
  //             UNENDLICH, ohne das liefe der Clip endlos weiter.
  //    `format=yuv420` (Overlay-Option) mischt alpha-korrekt im YUV-Raum.
  //
  //    HIER STEHT ABSICHTLICH KEIN `format=yuv420p`: Das Ergebnis dieses Overlays
  //    ist der HINTERGRUND des zweiten Overlays, und dort wird das Format ohnehin
  //    festgelegt. Das abschliessende `format=yuv420p` gehoert an das ENDE der
  //    Kette, nach dem Mischen mit dem Band.
  const abgeflacht = `[hg][vg]overlay=x=0:y=0:shortest=1:format=yuv420,setsar=1[bg]`

  // 4. Die Bandspur - auf Bildrate und SAR, sonst NICHTS.
  //
  //    KEIN `format=yuv420p`: Das ist die eine Zeile, an der Art B haengt.
  //    `yuv420p` hat keinen Alphakanal; wer ihn hier erzwingt, macht aus der
  //    teiltransparenten Einblendung einen deckenden Kasten (Gegenprobe im Kopf
  //    dieser Datei gemessen).
  //
  //    KEIN `scale`: Passt das Band nicht (nicht `breite` breit, nicht H hoch),
  //    soll der `overlay` es an der falschen Stelle zeigen, statt es still
  //    hochzuskalieren - ein unscharfes Band faellt niemandem als FEHLER auf. Die
  //    Pruefung der PNG-Masse gehoert dem `render-service` (TK 9.2.3,
  //    `ungueltiges_element`), der die Datei kennt; diese Funktion sieht sie nie.
  const bandspur = `[1:v]fps=${r},setsar=1[band]`

  // 5. Das Band UNTEN ueberlagern - „(`overlay`, Alpha respektiert)" (TK 9.2.8) -
  //    und das Ausgabeformat festnageln.
  //
  //    `x=0`    das Band hat die volle Bildbreite; 0 ist gerade.
  //    `y=<by>` die vorgerechnete, gerade Zahl - KEIN von ffmpeg gebildeter
  //             Ausdruck wie `H-h`, denn der waere die zweite Stelle, die den
  //             Versatz bestimmt, und er koennte bei einem falsch bemassten Band
  //             lautlos etwas anderes ergeben.
  //    `format=yuv420p` (Abschluss) entfernt den dann verbrauchten Alphakanal und
  //             setzt das Pixelformat des Ausgabe-Profils - Consumer-TVs
  //             decodieren NUR 4:2:0/8 Bit (TK 9.2.4).
  //    `setsar=1` (Abschluss) haelt SAR auch nach `overlay` fest; manche Filter
  //             setzen es zurueck, und der Wert muss am AUSGANG stehen.
  //
  //    Die beiden Formatnamen stehen als Literal, weil die Filtersyntax keinen
  //    Ausdruck nimmt und `overlay` den Modusnamen OHNE abschliessendes `p`
  //    erwartet. Sie MUESSEN `profil.pixelformat` entsprechen; weicht das Profil
  //    ab, ist das ein Vertragsfehler zum Melden - die Kette wird dann nicht
  //    angepasst und das Profil nicht geaendert.
  const eingeblendet =
    `[bg][band]overlay=x=0:y=${by}:shortest=1:format=yuv420,format=yuv420p,setsar=1[v]`

  // EINE Zeichenkette, EIN Element des spaeteren Argument-Arrays (der Wert hinter
  // `-filter_complex`). Sie wird NIEMALS in Anfuehrungszeichen gesetzt und niemals
  // mit anderen Argumenten zu einer Kommandozeile verkettet: Wer Anfuehrungszeichen
  // darum legt, macht sie zum BESTANDTEIL des Filterausdrucks, und ffmpeg meldet
  // einen unverstaendlichen Parserfehler.
  return {
    ok: true,
    wert: [hintergrundFlaeche, quelle, abgeflacht, bandspur, eingeblendet].join(';'),
  }
}

/**
 * Nimmt einen Wert als Mass entgegen: endlich, ganzzahlig, groesser als 0.
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
 * Ungerade Kantenlaengen und Versaetze sind in 4:2:0 nicht darstellbar: `yuv420p`
 * tastet die Farbe in BEIDEN Richtungen um den Faktor zwei unter, es gibt also je
 * Farbwert genau einen Block aus zwei mal zwei Helligkeitswerten.
 *
 * KEINE Rettung durch Runden. Waere `hoeheBand` ungerade, laege die Bandoberkante
 * bei `profil.hoehe - hoeheBand` auf einer ungeraden Zeile; die Kante verliefe quer
 * durch einen Farbblock und zeigte sich als ausgefranste, verfaerbte Linie ueber
 * die volle Bildbreite. Ein hier stillschweigend um ein Pixel veraendertes Band
 * passte ausserdem nicht mehr zu dem bereits in 1920 x H gezeichneten PNG.
 */
function pruefeGerade(feld: string, wert: number): string | null {
  if (wert % 2 === 0) return null
  return (
    `${feld} ist mit ${String(wert)} ungerade. Das Ausgabe-Profil schreibt yuv420p fest; ` +
    'in der 4:2:0-Farbunterabtastung teilen sich je zwei Zeilen und Spalten eine ' +
    'Farbinformation, ungerade Kantenlaengen und Versaetze sind darin nicht darstellbar.'
  )
}

/** Der einzige Fehlerausgang dieser Datei - sie prueft ausschliesslich ihre eigenen Parameter. */
function ungueltig(meldung: string): { ok: false; fehler: { code: 'ungueltige_eingabe'; meldung: string } } {
  return { ok: false, fehler: { code: 'ungueltige_eingabe', meldung } }
}

/** Einen fremden Wert fuer die Meldung beschreiben, ohne ihn zu deuten. */
function beschreibe(wert: unknown): string {
  return typeof wert === 'string' ? JSON.stringify(wert) : String(wert)
}
