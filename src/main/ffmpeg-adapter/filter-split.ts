// GENERIERT aus dem Signaturblock von Issue #164.
// [ffmpeg-adapter] Filterkette für die Split-Geometrie bauen
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
// GERUEST-PRUEFSUMME: 6aeef2bf3f82ae5c
//
// ERLEDIGT: Rumpf gefuellt, die dateiweite Abschaltzeile
// (@typescript-eslint/no-unused-vars) ist damit entfernt - Importe und Parameter
// werden jetzt benutzt.
//
// ============================================================================
// HIER ENTSTEHT DAS BILD DER HAUPTBETRIEBSART - UND ES IST DIE EINZIGE STELLE
// IM PROJEKT, DIE BEWUSST VOM AUSGABE-PROFIL ABWEICHT
// ============================================================================
// „Art A - `split` (Hauptbetriebsart): Band *unter* dem verkleinerten Video."
// (TK 9.2.8). Werbung laeuft parallel zum Video, nichts wird verdeckt (FA-20).
// Und: „Bewusste Abweichung vom Ausgabe-Profil - nur hier: 9.2.4 schreibt
// schwarze Balken vor. In der Split-Komposition werden die Restflaechen in der
// Markenfarbe gefuellt, damit der Split gestaltet wirkt und nicht wie
// ungenutzter Platz." (TK 9.2.8)
//
// DIE BREITE UND DER LINKE RAND WERDEN HIER NICHT GERECHNET. Sie kommen fertig
// von `bestimmeBandgeometrie` (#176), die ihrerseits die geteilte Rechnung
// (#239) durchreicht. Diese Datei PRUEFT sie und SETZT sie ein - sie leitet
// nichts aus der Bandhoehe ab und repariert nichts. Zwei Rundungsstellen laufen
// unweigerlich auseinander, und zwar lautlos: In der Geometrie stuende dann
// 1556 und in der Filterkette 1557, das Video saesse daneben, und NIEMAND
// bekaeme eine Meldung. Ein `ungueltige_eingabe` aus der Pruefung unten ist das
// gewuenschte Verhalten; eine stille Selbstkorrektur ist der Fehler.
//
// WARUM DIE PRUEFUNG NICHT AM BEISPIEL HAENGEN DARF: Die eingebaute Band-
// Vorlage (H = 162) geht als EINZIGE ausgelieferte Hoehe glatt auf. Wer die
// Vierer-Regel falsch versteht oder gar nicht prueft, besteht jeden Test mit
// ihr. Deshalb pruefen die Tests dieser Datei den ganzen Hoehenbereich.
//
// NACHGEMESSEN mit dem mitgelieferten ffmpeg 6.1.1 (nicht behauptet, gemessen -
// 14.08.2026). Aufbau: eine 3 s lange Videoquelle, dazu eine Bandspur 1920 x H
// in Gruen, dazu die stille Tonspur; die hier gebaute Kette unveraendert als
// `-filter_complex`. Danach ffprobe auf das Ergebnis und Pixelproben (`crop` +
// rawvideo bzw. `signalstats`) an den Kanten. Uebergebene Fuellfarbe war der
// Wert der Rolle `flaecheDunkel`; er kommt nach der H.264-Runde als rgb 46/46/46
// wieder heraus (ein Zaehlschritt Rundung, kein Farbfehler).
//
//   H = 162, Quelle 1920x1080 -> 1920x1080, yuv420p, SAR 1:1, 30/1 fps,
//            Profil High / Level 4.0. Fuellfarbe bei x = 0 und x = 142,
//            Bildinhalt ab x = 144 bis x = 1775, Fuellfarbe wieder ab x = 1776.
//            Letzte Videozeile y = 916, Band von y = 918 bis y = 1078 in
//            unversehrtem Gruen - also genau die Zahlen des TK-Beispiels.
//   H = 200, Quelle 640x480 (4:3) -> gleiches Profil. Der Rahmen sitzt bei
//            x = 178, das 4:3-Bild ist darin eingepasst und traegt links und
//            rechts INNEN dieselbe Fuellfarbe (bei x = 1548 gemessen, noch
//            innerhalb des bis x = 1741 reichenden Rahmens) - kein Beschnitt,
//            und keine sichtbare Naht zwischen innerer und aeusserer Flaeche.
//            Die linke Restflaeche ist EINE Farbe: YMIN = YMAX = 56, UAVG =
//            VAVG = 128.
//   H = 300, Quelle 1080x1920 (Hochkant) -> gleiches Profil, Rahmen 1384 x 780
//            bei x = 268, Hochkant-Bild eingepasst, Band ab y = 780.
//   H = 200, Bandspur 1900 statt 1920 px breit -> ffmpeg BRICHT AB
//            ("Error reinitializing filters! / Failed to inject frame into
//            filter network: Invalid argument"), es entsteht keine Datei. Genau
//            so gewollt: ein still verzerrtes Band faellt niemandem auf, ein
//            abgebrochener Render sofort.
//
// DIESE DATEI IST REIN: kein Dateizugriff, kein Prozessstart, kein ffprobe,
// keine Pfadaufloesung, kein Import aus dem `config-store`, kein `leseMarke`,
// kein Zufall, kein Datum. Und sie enthaelt KEINE Hexzahl: Die Farbe der Rolle
// `flaecheDunkel` holt der `render-service` ueber `leseMarke()` (#29) und reicht
// sie herein. „Der `render-service` schlaegt keine Marke nach; er nimmt den
// eingefrorenen Wert und tippt nie eine Hexzahl selbst in eine Filterkette
// (9.11.1, Punkt 7)." (TK 9.2.8)

import type { RenderProfile } from '../../shared/contracts/render-profile'
import type { Ergebnis } from '../../shared/contracts/ergebnis'

/**
 * Die Form, in der diese Datei eine Farbe entgegennimmt: `0x` + genau sechs
 * Hexziffern, wie sie `markenFarbeZuFfmpeg` (unten) liefert.
 *
 * Die enge Form ist zugleich der Schutz des Filtergraphen: `,` `;` `[` `]` und
 * die Anfuehrungs- und Fluchtzeichen von ffmpeg koennen darin nicht vorkommen.
 * Ein Wert mit einem solchen Zeichen koennte den Graphen um BELIEBIGE weitere
 * Filter erweitern - deshalb wird abgewiesen und nicht bereinigt: Eine
 * Bereinigung liefert eine Farbe, die niemand bestellt hat, und der Fehler zeigt
 * sich dann als falsche Flaechenfarbe im fertigen Video statt als Meldung.
 *
 * KEIN Farbname (`black`) und KEIN Alphakanal: Hinter der Restflaeche liegt
 * nichts; ein teildurchsichtiger Wert wuerde gegen Schwarz gemischt und ergaebe
 * eine Farbe, die niemand so gewaehlt hat.
 */
const FFMPEG_FARBE = /^0x[0-9a-fA-F]{6}$/

/**
 * Die Form eines Hexwerts der `Marke`: `#` + sechs Hexziffern, wahlweise mit
 * zwei weiteren fuer den Alphakanal.
 */
const MARKEN_FARBE = /^#([0-9a-fA-F]{6})([0-9a-fA-F]{2})?$/

/** Der einzige Alphawert, der eine deckende Flaeche beschreibt. */
const DECKEND = 'ff'

/** Der Teiler, den die Vierer-Regel aus TK 9.2.8 an die eingepasste Breite stellt. */
const VIERER_RASTER = 4

/**
 * Baut den Wert für `-filter_complex` der Kompositionsart `split` (TK 9.2.8 Art A).
 *
 * Label-Konvention des ganzen `ffmpeg-adapter` (identisch in #163, #164, #165):
 *   [0:v] = das Video          (immer Eingang 0)
 *   [1:v] = die Bandspur       (immer Eingang 1, wenn ein Band vorhanden ist)
 *   [v]   = das Ausgabelabel   (der Aufrufer mappt es mit `-map` `[v]`)
 * Die stille Tonspur (#162) ist IMMER der LETZTE Eingang – hier also Eingang 2 –, damit sich die
 * Indizes 0 und 1 nie verschieben.
 *
 * @param hoeheBand      Bandhöhe H in Pixeln. Kommt aus `RenderItemVideo.einblendung.höhe` (#17)
 *                       und ist dort beim EINREIHEN aus der Band-Vorlage eingefroren worden.
 *                       Hier wird NICHTS nachgeschlagen.
 * @param videoEingepasstBreite  Breite des eingepassten Videos in Pixeln – FERTIG GERECHNET von
 *                       `bestimmeBandgeometrie` (#176) nach TK 9.2.8: `(1080 − H) × 16/9`,
 *                       abgerundet auf das nächstkleinere Vielfache von 4. Diese Datei rundet
 *                       NICHT und leitet die Breite NICHT aus `hoeheBand` ab.
 * @param videoEingepasstX       linker Rand des eingepassten Videos – ebenfalls von #176:
 *                       `(profil.breite − videoEingepasstBreite) / 2`, durch die Vierer-Rundung
 *                       immer ganzzahlig und gerade.
 * @param fuellFarbe     die Fläche für die seitlichen Restflächen, als ffmpeg-Farbausdruck der
 *                       Form `0xRRGGBB`. Der Wert stammt aus der Farb-Rolle `flaecheDunkel` der
 *                       `Marke` und wird vom `render-service` über `leseMarke()` (#29) geholt und
 *                       hierher durchgereicht. Diese Datei enthält KEINE Hexzahl.
 * @param profil         RENDER_PROFILE (#18) – die Quelle aller übrigen Zahlen
 */
export function baueSplitFilter(
  hoeheBand: number,
  videoEingepasstBreite: number,
  videoEingepasstX: number,
  fuellFarbe: string,
  profil: RenderProfile,
): Ergebnis<string> {
  // Der Rueckgabewert ist IMMER die Ergebnis-Huelle, nie ein Wurf (TK 9.1.1).
  // Deshalb wird der Eingang geprueft statt geglaubt: Alle fuenf Werte reisen als
  // Teil des Auftrags durch den Main, und ein `undefined` an dieser Stelle waere
  // sonst eine Ausnahme in einem Auftrag, dessen Zusage danach fuer immer offen
  // bliebe.
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

  // Das Profil zuerst: Aus ihm stammen die Vergleichswerte fuer alles Uebrige
  // (Bildhoehe fuer die Bandhoehe, Bildbreite fuer Breite und Versatz). Ein
  // kaputtes Profil zuerst zu melden erspart Folgemeldungen, die auf ein NaN
  // zeigen statt auf seine Ursache.
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
        'Sonst bliebe kein Video-Bereich uebrig.',
    )
  }

  // Beide Teile muessen gerade sein - und mit der geraden Profilhoehe ist der
  // zweite Test rechnerisch schon erfuellt. Er steht trotzdem da: Die
  // Fehlerpfad-Tabelle des Issues nennt beide Faelle, und die Zusage haengt dann
  // nicht daran, dass irgendwo anders eine Hoehe gerade BLEIBT.
  const ungeraderTeil =
    pruefeGerade('hoeheBand', band.wert) ??
    pruefeGerade('die Hoehe des Video-Bereichs (profil.hoehe - hoeheBand)', hoehe.wert - band.wert)
  if (ungeraderTeil !== null) return ungueltig(ungeraderTeil)

  // ------------------------------------------------------------------
  // Die beiden Einpass-Werte: NUR PRUEFEN, NICHT HERLEITEN.
  //
  // Die Pruefung benutzt ausdruecklich KEIN Seitenverhaeltnis - sie braucht es
  // nicht, um Teilbarkeit und Mittigkeit festzustellen. Sie leitet aus der
  // Bandhoehe nichts ab, sie rundet nichts, und sie ersetzt keinen Wert durch
  // einen besseren. Ergibt sie einen Verstoss, ist das ein Vertragsfehler bei
  // #176 oder #177 - gemeldet wird er, geheilt nicht.
  // ------------------------------------------------------------------
  const videoBreite = alsMass('videoEingepasstBreite', videoEingepasstBreite)
  if (!videoBreite.ok) return videoBreite
  if (videoBreite.wert > breite.wert) {
    return ungueltig(
      `videoEingepasstBreite ${String(videoBreite.wert)} ist breiter als das Bild ` +
        `(profil.breite ${String(breite.wert)}).`,
    )
  }
  if (videoBreite.wert % VIERER_RASTER !== 0) {
    // „Abrunden auf ein Vielfaches von 4 erfuellt beide Bedingungen in einem
    // Schritt." (TK 9.2.8) - gerade Breite UND gerader Versatz, beides von
    // yuv420p verlangt.
    return ungueltig(
      `videoEingepasstBreite ${String(videoBreite.wert)} ist kein Vielfaches von ` +
        `${String(VIERER_RASTER)}. TK 9.2.8 verlangt die Abrundung auf das naechstkleinere ` +
        'Vielfache von 4, weil yuv420p eine gerade Breite UND einen geraden x-Versatz ' +
        'braucht. Der Wert stammt aus bestimmeBandgeometrie (#176) und wird hier weder ' +
        'nachgerechnet noch korrigiert - er ist dort zu berichtigen.',
    )
  }

  const versatzX = alsVersatz('videoEingepasstX', videoEingepasstX)
  if (!versatzX.ok) return versatzX
  const ungeraderVersatz = pruefeGerade('videoEingepasstX', versatzX.wert)
  if (ungeraderVersatz !== null) return ungueltig(ungeraderVersatz)

  // Mittig - und zwar EXAKT. Ein Vergleich, keine Zuweisung: Wer hier den
  // erwarteten Wert einsetzte, statt ihn zu vergleichen, machte diese Datei zur
  // zweiten Stelle, die den Versatz bestimmt.
  const erwarteterVersatz = (breite.wert - videoBreite.wert) / 2
  if (versatzX.wert !== erwarteterVersatz) {
    return ungueltig(
      `videoEingepasstX ${String(versatzX.wert)} liegt nicht mittig zu ` +
        `videoEingepasstBreite ${String(videoBreite.wert)}; erwartet war ` +
        `${String(erwarteterVersatz)}. Beide Werte stammen aus bestimmeBandgeometrie (#176) ` +
        'und werden hier nur geprueft, nicht korrigiert.',
    )
  }

  const farbFehler = pruefeFuellFarbe(fuellFarbe)
  if (farbFehler !== null) return ungueltig(farbFehler)

  // Ab hier stehen nur noch uebergebene Werte in der Kette. Ein hier
  // hingeschriebenes Mass waere eine zweite Quelle fuer das TV-kritische Profil.
  const b = String(breite.wert)
  const r = String(fps.wert)
  const vb = String(videoBreite.wert)
  const vx = String(versatzX.wert)
  // „| Video-Bereich | 1920 x (1080 - H) bei y = 0 |" (TK 9.2.8) - das `VH` der
  // Kette. Es ist eine Aufteilung der Bildhoehe, keine Breitenrechnung.
  const vh = String(hoehe.wert - band.wert)

  // 1. Die DECKENDE Farbflaeche in voller Bildbreite und in der Hoehe des
  //    Video-Bereichs. Sie traegt die seitlichen Restflaechen: „| Restflaechen |
  //    links/rechts - gefuellt mit der Farb-Rolle `flaecheDunkel` |" (TK 9.2.8).
  //    Der Rest von hoechstens 3 px aus der Vierer-Abrundung faellt automatisch
  //    hier hinein, weil die Flaeche die volle Breite hat und das eingepasste
  //    Video schmaler ist.
  //    Sie ist zugleich der Grund, warum eine Quelle MIT Alphakanal
  //    deterministisch aussieht: Ohne Komposition verlaere sie ihren Alphakanal
  //    bei `format=yuv420p`, und vollstaendig transparente Pixel zeigten ihren
  //    gespeicherten, undefinierten RGB-Wert.
  //    `r=` macht die Flaeche gleich in der Zielbildrate - sonst muesste ffmpeg
  //    beim Overlay zwischen zwei Raten vermitteln.
  const hintergrundFlaeche = `color=c=${fuellFarbe}:s=${b}x${vh}:r=${r}[hg]`

  // 2. Das Video „contain" in den VORGERECHNETEN Rahmen - und mit der Fuellfarbe
  //    auf GENAU diesen Rahmen aufgefuellt.
  //
  //    `fps=`   erzwingt die konstante Bildrate IM FILTERGRAPH, nicht erst im
  //             Muxer. Ohne das driftet eine Quelle mit schwankender Bildrate,
  //             und beim Split laeuft das Band gegen das Video weg.
  //    `scale=<vb>:<vh>:force_original_aspect_ratio=decrease` passt EIN, ohne zu
  //             beschneiden. „Die Einpassung bleibt „contain" ohne Beschnitt."
  //             (TK 9.2.8). Mit `increase` + `crop` wuerden Produkte, Gesichter
  //             und Preise am Rand abgeschnitten - auf einem 85-Zoll-Schirm
  //             sofort sichtbar, aber nicht als FEHLER erkennbar, weil das Bild
  //             „gut aussieht".
  //    `flags=bicubic` pinnt den Skalierer; der Vorgabewert ist buildabhaengig.
  //    `pad=<vb>:<vh>` fuellt auf DIESELBE Groesse auf. Ohne das ist der Rahmen
  //             bei einer Nicht-16:9-Quelle schmaler als angekuendigt, und der
  //             aeussere Versatz stimmt nicht mehr. Der INNERE Versatz `(ow-iw)/2`
  //             ist ein Ausdruck von ffmpeg ueber das tatsaechlich dekodierte
  //             Bild - `pad` rundet ihn selbst auf das Farbraster ab (in #163
  //             nachgemessen). Der AEUSSERE Versatz darf so nicht gebildet werden;
  //             er kommt vorgerechnet herein (s. Punkt 3).
  //    `setsar=1` setzt das PIXEL-Seitenverhaeltnis auf 1:1.
  const quelle =
    `[0:v]fps=${r},` +
    `scale=${vb}:${vh}:force_original_aspect_ratio=decrease:flags=bicubic,` +
    `pad=${vb}:${vh}:(ow-iw)/2:(oh-ih)/2:color=${fuellFarbe},` +
    `setsar=1[vg]`

  // 3. Den fertigen Rahmen auf die vollbreite Farbflaeche legen - an den
  //    VORGERECHNETEN, geraden x-Versatz.
  //
  //    `x=<vx>` ist eine Zahl, kein Ausdruck. Ein selbst gebildetes `(W-w)/2`
  //             kann ungerade werden - genau der Fall, den die Vierer-Rundung
  //             ausschliesst -, und es waere die zweite Stelle, die den Versatz
  //             bestimmt.
  //    `y=0`    „| Video-Bereich | 1920 x (1080 - H) bei y = 0 |" (TK 9.2.8).
  //    `shortest=1` beendet das Overlay mit der Quelle - die `color`-Quelle ist
  //             UNENDLICH, ohne das liefe der Clip endlos weiter.
  //    `format=yuv420` (Overlay-Option) mischt alpha-korrekt im YUV-Raum.
  //
  //    Die beiden Formatnamen stehen als Literal, weil die Filtersyntax keinen
  //    Ausdruck nimmt und `overlay` den Modusnamen OHNE abschliessendes `p`
  //    erwartet. Sie MUESSEN `profil.pixelformat` entsprechen; weicht das Profil
  //    ab, ist das ein Vertragsfehler zum Melden - die Kette wird dann nicht
  //    angepasst und das Profil nicht geaendert.
  const oben =
    `[hg][vg]overlay=x=${vx}:y=0:shortest=1:format=yuv420,format=yuv420p,setsar=1[oben]`

  // 4. Die Bandspur - auf Bildrate, Pixelformat und SAR des oberen Teils, sonst
  //    nichts.
  //
  //    HIER STEHT ABSICHTLICH KEIN `scale`. Ist die Bandspur nicht so breit wie
  //    das Bild, soll der ffmpeg-Aufruf LAUT ABBRECHEN (`vstack` verlangt gleiche
  //    Breite) statt das Band still zu verzerren. Ein still verzerrtes Band faellt
  //    niemandem auf, ein abgebrochener Render dagegen sofort. Der Abbruch ist
  //    dann `ffmpeg_fehler` des render-service (TK 9.2.3), nicht Sache dieser
  //    Datei - und ganz sicher kein Anlass fuer eine Ausweichlogik.
  const unten = `[1:v]fps=${r},format=yuv420p,setsar=1[unten]`

  // 5. Stapeln - „bei `split` beide Spuren vertikal stapeln (`vstack`)" (TK 9.2.8) -
  //    und das Ausgabeformat festnageln. `format=yuv420p,setsar=1` am Ende haelt
  //    die Uniformitaet fest, ohne die `concat -c copy` (TK 9.2.6) eine Datei
  //    erzeugt, die nach dem ersten Segment einfriert.
  const gestapelt = '[oben][unten]vstack=inputs=2,format=yuv420p,setsar=1[v]'

  // EINE Zeichenkette, EIN Element des spaeteren Argument-Arrays (der Wert hinter
  // `-filter_complex`). Sie wird NIEMALS in Anfuehrungszeichen gesetzt und niemals
  // mit anderen Argumenten zu einer Kommandozeile verkettet: Wer Anfuehrungszeichen
  // darum legt, macht sie zum BESTANDTEIL des Filterausdrucks, und ffmpeg meldet
  // einen unverstaendlichen Parserfehler.
  return { ok: true, wert: [hintergrundFlaeche, quelle, oben, unten, gestapelt].join(';') }
}

/**
 * Rechnet einen Hexwert der `Marke` (`#RRGGBB` oder `#RRGGBBAA`) in die Farbschreibweise um, die
 * ffmpeg versteht (`0xRRGGBB`).
 * Exportiert, weil der Aufrufer die Umrechnung braucht: Der `render-service` (#177) holt
 * `flaecheDunkel` als Hexwert aus der Marke und muss ihn umrechnen, BEVOR er ihn als `fuellFarbe`
 * hereinreicht - diese Datei nimmt ausschliesslich die Form `0xRRGGBB` entgegen. #177 ist damit
 * der einzige Verbraucher; #165 (Einblendung) benutzt sie NICHT, weil dort die Balkenfarbe
 * schwarz nach 9.2.4 ist und keine Markenfarbe vorkommt.
 */
export function markenFarbeZuFfmpeg(hex: string): Ergebnis<string> {
  if (typeof hex !== 'string') {
    return ungueltig(
      `Der Markenwert muss eine Zeichenkette der Form "#RRGGBB" oder "#RRGGBBAA" sein, ` +
        `vorgefunden: ${beschreibe(hex)}.`,
    )
  }

  const treffer = MARKEN_FARBE.exec(hex)
  if (treffer === null) {
    return ungueltig(
      `${beschreibe(hex)} ist kein Farbwert der Marke. Erwartet wird ein fuehrendes ` +
        'Rautenzeichen und danach genau sechs Hexziffern (oder acht mit Alphakanal).',
    )
  }

  const kanaele = treffer[1]
  const alpha = treffer[2]
  if (kanaele === undefined) {
    // Unerreichbar, solange der Ausdruck oben passt - aber `noUncheckedIndexedAccess`
    // verlangt die Verengung, und eine Fluchttuer (`!`) waere genau die Stelle, an
    // der die Pruefung nur noch so AUSSIEHT.
    return ungueltig(`${beschreibe(hex)} liess sich nicht in Farbkanaele zerlegen.`)
  }

  if (alpha !== undefined && alpha.toLowerCase() !== DECKEND) {
    // Hinter der Restflaeche liegt NICHTS. Ein teildurchsichtiger Wert wuerde gegen
    // Schwarz gemischt und ergaebe eine Farbe, die niemand so gewaehlt hat. Lieber
    // ein sauberer Fehler als eine lautlos falsche Markenfarbe.
    return ungueltig(
      `${beschreibe(hex)} ist nicht vollstaendig deckend (Alphakanal "${alpha}"). ` +
        'Eine Fuellflaeche muss deckend sein; hinter ihr liegt nichts, gegen das ' +
        'gemischt werden koennte.',
    )
  }

  // Die Schreibweise des Aufrufers bleibt erhalten - umgerechnet wird die FORM,
  // nicht der Wert. Ein stilles Umschreiben auf Grossbuchstaben waere eine
  // Veraenderung an einem Wert, der aus der Marke stammt.
  return { ok: true, wert: `0x${kanaele}` }
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
 * Wie `alsMass`, laesst aber die 0 zu: Ein Versatz von 0 ist zulaessig (er
 * entsteht, sobald das eingepasste Video die volle Bildbreite hat), ein Mass von
 * 0 dagegen nie.
 */
function alsVersatz(feld: string, wert: unknown): Ergebnis<number> {
  if (typeof wert !== 'number' || !Number.isFinite(wert)) {
    return ungueltig(`${feld} muss eine endliche Zahl sein, vorgefunden: ${beschreibe(wert)}.`)
  }
  if (!Number.isInteger(wert)) {
    return ungueltig(`${feld} muss ganzzahlig sein (Pixel), vorgefunden: ${String(wert)}.`)
  }
  if (wert < 0) {
    return ungueltig(`${feld} darf nicht negativ sein, vorgefunden: ${String(wert)}.`)
  }
  return { ok: true, wert }
}

/**
 * Ungerade Kantenlaengen und Versaetze sind in 4:2:0 nicht darstellbar: `yuv420p`
 * tastet die Farbe in BEIDEN Richtungen um den Faktor zwei unter, es gibt also je
 * Farbwert genau einen Block aus zwei mal zwei Helligkeitswerten.
 *
 * KEINE Rettung durch Runden - weder hier noch anderswo in dieser Datei. Waere H
 * ungerade, waeren BEIDE Teile ungerade (die Bildhoehe minus H ebenfalls); der
 * `vstack` scheiterte oder ffmpeg rundete still, mit einem um eine Zeile
 * verschobenen Band als Folge. Der richtige Ort fuer die Berichtigung ist die
 * Band-Vorlage, nicht diese Kette.
 */
function pruefeGerade(feld: string, wert: number): string | null {
  if (wert % 2 === 0) return null
  return (
    `${feld} ist mit ${String(wert)} ungerade. Das Ausgabe-Profil schreibt yuv420p fest; ` +
    'ungerade Kantenlaengen und Versaetze sind in 4:2:0 nicht darstellbar.'
  )
}

/**
 * Prueft die Fuellfarbe. Zulaessig ist ausschliesslich die Ausgabe von
 * `markenFarbeZuFfmpeg`: `0x` + genau sechs Hexziffern.
 */
function pruefeFuellFarbe(fuellFarbe: string): string | null {
  if (typeof fuellFarbe !== 'string') {
    return `fuellFarbe muss ein Farbausdruck als Zeichenkette sein, vorgefunden: ${beschreibe(
      fuellFarbe,
    )}.`
  }
  if (!FFMPEG_FARBE.test(fuellFarbe)) {
    // Kein Rueckfall auf Schwarz und kein Vorgabewert: „Die Restflaechen werden
    // nicht schwarz." (TK 9.2.8). Fehlt die Farbe, ist das ein Fehler weiter oben -
    // nicht etwas, das diese Datei ueberdeckt.
    return (
      `fuellFarbe ${beschreibe(fuellFarbe)} hat nicht die erwartete Form "0x" + sechs ` +
      'Hexziffern. Der Wert entsteht aus der Farb-Rolle flaecheDunkel der Marke und ist ' +
      'vom Aufrufer mit markenFarbeZuFfmpeg umzurechnen.'
    )
  }
  return null
}

/** Der einzige Fehlerausgang dieser Datei - sie prueft ausschliesslich ihre eigenen Parameter. */
function ungueltig(meldung: string): { ok: false; fehler: { code: 'ungueltige_eingabe'; meldung: string } } {
  return { ok: false, fehler: { code: 'ungueltige_eingabe', meldung } }
}

/** Einen fremden Wert fuer die Meldung beschreiben, ohne ihn zu deuten. */
function beschreibe(wert: unknown): string {
  return typeof wert === 'string' ? JSON.stringify(wert) : String(wert)
}
