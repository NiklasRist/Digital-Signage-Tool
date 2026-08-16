// GENERIERT aus dem Signaturblock von Issue #180.
// [render-service] Fertige Datei verifizieren und atomar platzieren
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
// GERUEST-PRUEFSUMME: c375a9b0a09209a1
//
// ERLEDIGT (15.08.2026): Rumpf gefuellt, die dateiweite Abschaltzeile
// (@typescript-eslint/no-unused-vars) ist damit entfernt - jeder Import und jeder
// Parameter wird jetzt benutzt.
//
// ============================================================================
// DIES IST DIE LETZTE SCHRANKE VOR DEM FERNSEHER - UND DIE EINZIGE STELLE IM
// PROJEKT, AN DER EINE FERTIGE, GUTE NUTZERDATEI UEBERSCHRIEBEN WIRD
// ============================================================================
// Zwei Zusagen haengen an dieser Datei, und beide brechen lautlos:
//
// 1. VERIFIKATION. ffmpeg meldet Erfolg auch dann, wenn die Datei unbrauchbar ist:
//    ein abgebrochener concat liefert Exitcode 0 und eine Datei, die nach dem
//    ersten Segment einfriert; eine still verlorene Tonspur bemerkt niemand, bis
//    der Fernseher die Datei nicht startet (R-06); ein falsches Pixelformat laeuft
//    auf jedem Laptop tadellos und auf dem Consumer-TV gar nicht. "Das ist die
//    EINZIGE Stelle, an der ein stiller Encoder-Fehler [...] noch auffaellt, BEVOR
//    er die letzte funktionierende Datei ersetzt - danach geht die Datei ungeprueft
//    auf den Fernseher im Studio." (TK 9.2.6)
//
// 2. ATOMARITAET. "Weil der Standard-Zielname der ZULETZT VERWENDETE ist,
//    ueberschreibt ein Render im Regelfall eine vorhandene, gute Datei." (TK 9.2.6)
//    Ueberschreiben ist hier der REGELFALL. Deshalb gibt es am Ziel genau EINEN
//    Schreibvorgang: den `rename`. Kein `unlink` davor, keine Existenzpruefung,
//    kein Umbenennen der alten Fassung auf `.alt` - jede dieser Varianten oeffnet
//    ein Fenster, in dem am Zielnamen gar keine oder eine halbe Datei liegt.
//
// DAS STAGING LIEGT IM AUSGABEORDNER, NICHT IN <Temp>. "Umbenennen ist nur auf
// DERSELBEN Partition unteilbar." (TK 9.2.6) Die App ist portabel; ihr Datenort
// kann auf einem USB-Stick liegen, waehrend <Temp> auf der Systemplatte liegt.
// NACHGEMESSEN (14.08.2026, echte Wechseldatentraeger - exFAT 117 GB und zweimal
// FAT32 3,7 GB): Ein `rename` aus <Temp> auf den Datentraeger scheitert auf BEIDEN
// Dateisystemen mit EXDEV; ein `rename` innerhalb desselben Datentraegers gelingt
// und ERSETZT dabei eine vorhandene Zieldatei. Die Regel aus TK v2.8 E-3 ist damit
// empirisch belegt, und der Ausweg "kopieren und loeschen" bleibt verboten: Er ist
// nicht unteilbar und hebt Akzeptanzkriterium 9 auf.
//
// DIESE DATEI SETZT KEINEN PFAD ZUSAMMEN. `zielPfad` kommt aus `loeseAusgabePfad`
// (#49, die eine Pfad-Autoritaet - TK 9.5.7), `partPfad` ist derselbe Pfad plus
// `.part`, und der ffprobe-Binaerpfad reist als Parameter. Kein `path.join` mit
// Projekt-IDs, keine Namenspruefung, kein `ermittleFfprobePfad()` - sonst waere sie
// die zweite Stelle, die das Ordner-Layout bzw. das benutzte Binary kennt.

import { rename, rm, stat } from 'node:fs/promises'

import { liesStromEigenschaften, vergleicheStroeme } from '../ffmpeg-adapter/uniformitaet' // #170

import type { Abweichung, StromEigenschaften } from '../ffmpeg-adapter/uniformitaet' // #170
import type { RenderProfile } from '../../shared/contracts/render-profile'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { RenderFehlercode } from './fehlercodes'      // #171

// Fremde Vertraege - abgeschrieben, damit hier nichts geraten wird:
//
//   #12/#22: type Ergebnis<T, F extends string = GenerischerFehlercode> =
//              | { ok: true; wert: T }
//              | { ok: false; fehler: { code: F | GenerischerFehlercode
//                                       meldung: string; daten?: unknown } }
//   #171:    type RenderFehlercode = 'medium_fehlt' | 'ungueltiges_element'
//              | 'ffmpeg_fehler' | 'kein_platz' | 'speicher_fehler'
//   #170:    liesStromEigenschaften(datei, ffprobePfad): Promise<Ergebnis<StromEigenschaften>>
//            vergleicheStroeme(befunde, profil): Uniformitaetsbefund
//
// GEGENGEPRUEFT am gebauten Code in `src/main/ffmpeg-adapter/uniformitaet.ts`: Beide
// Signaturen stimmen wortgleich, und `StromEigenschaften.dauerSekunden` existiert und
// wird dort aus `format.duration` gelesen (der Aufruf traegt `-show_format` genau
// deswegen). Es gibt also keinen Grund - und keine Erlaubnis - fuer einen zweiten
// ffprobe-Lauf nur wegen der Dauer.

/**
 * Die Toleranz der Dauerpruefung - FEST, keine Formel, kein Anteil an der Solldauer.
 *
 * 0,5 s sind bei 30 fps 15 Frames. Container- und Zeitstempel-Rundung ueber viele
 * verkettete Segmente bewegt sich im Bereich einzelner Frames und ist damit sicher
 * abgedeckt.
 *
 * AUSDRUECKLICH VERWORFEN ist die naheliegende Formel `max(0.5, 0.01 * Solldauer)`.
 * Sie ist nachgerechnet falsch und hebt die Pruefung genau dort auf, wo sie gebraucht
 * wird:
 *
 *   Solldauer  1 % davon   faengt ein fehlendes Element (mind. 10 s)?
 *      100 s       1 s     ja
 *     1000 s      10 s     Grenzfall - ab hier nicht mehr
 *     1800 s      18 s     NEIN (30-Minuten-Reel: ein ganzes Segment faellt durch)
 *     4500 s      45 s     NEIN, nicht einmal das laengstmoegliche Element (45 s)
 *
 * Ab 1000 s Solldauer uebersteigt der 1-%-Anteil die MINDESTDAUER eines Elements
 * (10 s, Anforderungsdokument 4.4): Je laenger das Reel, desto blinder die Pruefung -
 * die Formel dreht die Absicht um. Die feste Toleranz bleibt bei jeder Laenge
 * dieselben 15 Frames, und ein fehlendes Element ist mindestens ihr Zwanzigfaches.
 *
 * DIE BEWEISLAST LIEGT BEIM AUFWEITEN: Schlaegt die Pruefung bei einem KORREKTEN Lauf
 * an, ist die Ursache im Encoder oder in der Rundung zu suchen und zu MELDEN - die
 * Konstante wird nicht erhoeht (STOPP-Block des Issues).
 */
export const DAUER_TOLERANZ_SEKUNDEN = 0.5

/**
 * Wartezeiten VOR dem 2., 3. und 4. `rename`-Versuch, in Millisekunden.
 *
 * ZUR ANZAHL - die Vorgabe nennt "3 Versuche, Wartezeiten 100 ms, 300 ms, 900 ms"
 * und die DoD "dreimal [...] wiederholt". Beides zusammen ergibt EINEN sofortigen
 * Versuch und DREI Wiederholungen, also hoechstens vier `rename`-Aufrufe: Nur in
 * dieser Lesart wird jede der drei Wartezeiten auch benutzt. Bei drei Aufrufen
 * insgesamt bliebe die 900 ms eine tote Zahl - und eine Konstante, die nie zum
 * Einsatz kommt, ist ein Fehler und keine Vorgabe. Die Gesamtwartezeit von 1,3 s
 * deckt sich ausserdem mit der Begruendung des Issues ("nach gut einer Sekunde ist
 * das fast immer vorbei").
 *
 * WARUM UEBERHAUPT WIEDERHOLT WIRD: Auf Windows haelt ein Virenscanner oder ein
 * offener Player die Zieldatei kurzzeitig gesperrt. Laenger zu warten hilft nicht
 * mehr und laesst die Warteschlange - den einzigen Sperr-Mechanismus des Systems
 * (TK 9.3.5) - unnoetig lange stehen.
 */
export const RENAME_WARTEZEITEN_MS = [100, 300, 900] as const

/**
 * Die Systemfehler, bei denen ein zweiter Versuch Aussicht auf Erfolg hat - genau
 * diese beiden und keinen mehr.
 *
 * `EACCES` (kein Recht), `EROFS` (Datentraeger nur lesbar), `ENOSPC` (voll) und
 * `EXDEV` (verschiedene Laufwerke) bessern sich durch Warten NICHT; dort waere die
 * Staffel nur eine Verzoegerung mit demselben Ausgang.
 */
const WIEDERHOLBAR: readonly string[] = ['EBUSY', 'EPERM']

/** Der erste Versuch laeuft sofort - benannt, damit unten keine nackte 0 steht. */
const SOFORT = 0

/**
 * Die Wartezeit VOR jedem Versuch; der erste laeuft sofort, danach die Staffel.
 *
 * Abgeleitet aus der einen Konstante, nicht ein zweites Mal hingeschrieben: Wer die
 * Staffel spaeter aendert, aendert damit automatisch auch die Anzahl der Versuche.
 */
const WARTESTAFFEL: readonly number[] = [SOFORT, ...RENAME_WARTEZEITEN_MS]

/**
 * Die Nutzlast dieses Schritts - der Weg der fertigen Datei zurueck an `renderReel`
 * (#181), das daraus das `RenderResult { status: 'erfolg' }` baut.
 */
export interface PlatzierenErgebnis {
  ausgabePfad: string      // absoluter Pfad der fertigen <name>.mp4
  dateigroesse: number     // Bytes
}

export async function verifiziereUndPlatziere(
  partPfad: string,               // absoluter Pfad projects/<id>/output/<name>.mp4.part
  zielPfad: string,               // absoluter Pfad projects/<id>/output/<name>.mp4 (aus #49)
  erwarteteGesamtdauer: number,   // Sekunden, framegerundet (#174)
  profil: RenderProfile,          // #18 – die Sollwerte der Pruefung
  ffprobePfad: string,            // von renderReel (#181) hereingereicht, s. u.
): Promise<Ergebnis<PlatzierenErgebnis, RenderFehlercode>> {
  // EIN Fangnetz um den ganzen Rumpf: "Kein `throw` verlaesst diese Datei." Der
  // Aufrufer ist ein Auftrags-Handler, dessen Ergebnis ueber die IPC-Grenze reist -
  // dort ueberlebt eine Ausnahme nur als Text, Fehlerklasse und `code` gingen
  // verloren (TK 9.1.1).
  try {
    // ---------------------------------------------------------------- Schritt 1
    // GENAU EIN ffprobe-Lauf ueber die fertige Datei, mit dem hereingereichten
    // Binaerpfad. Die Datei wird dabei UNVERAENDERT ausgelesen, trotz der Endung
    // `.part`: ffprobe erkennt MP4 an der `ftyp`-Box, nicht an der Endung. Ein
    // Umbenennen vor der Pruefung waere genau das Ersetzen, das erst NACH der
    // Pruefung stattfinden darf.
    const gelesen = await liesStromEigenschaften(partPfad, ffprobePfad)
    if (!gelesen.ok) {
      // Die Huelle ist `ok: false` - die PRUEFUNG SELBST war nicht durchfuehrbar.
      // Andere Meldung als bei einer erkannten Abweichung: einmal "liess sich nicht
      // auslesen", einmal "diese Felder weichen ab".
      return await scheitere(
        partPfad,
        'ffmpeg_fehler',
        `Die fertige Ausgabedatei liess sich nicht auslesen, die Verifikation war damit ` +
          `nicht durchfuehrbar: ${gelesen.fehler.meldung} Die vorhandene Ausgabedatei ` +
          `bleibt unveraendert.`,
      )
    }

    const eigenschaften: StromEigenschaften = gelesen.wert

    // ---------------------------------------------------------------- Schritt 2
    // Die vier Strom-Kriterien (Aufloesung, Bildrate, Pixelformat, Tonspur) werden
    // NICHT hier nachgebaut, sondern von #170 gegen dasselbe Profil geprueft. Eine
    // eigene Auswertung waere die zweite Stelle, die entscheidet, was
    // "profilkonform" heisst - beide liefen bei der naechsten Profilaenderung
    // auseinander. Dass `vergleicheStroeme` STRENGER prueft als der Mindestumfang aus
    // TK 9.2.6 (Codec, Level, Farbmetadaten, SAR, Drehung obendrein), ist erwuenscht:
    // Genau diese Werte entscheiden, ob der Fernseher die Datei abspielt.
    //
    // EIN Befund in der Liste, nicht mehrere: Verglichen wird gegen das PROFIL; die
    // Vergleiche untereinander, fuer die #170 sonst da ist, haben bei einer einzelnen
    // fertigen Datei keinen Gegenpart.
    const befund = vergleicheStroeme([eigenschaften], profil)
    if (!befund.ok) {
      // `befund.ok === false` ist ein FEHLGESCHLAGENES KRITERIUM, kein Aufruffehler:
      // #170 gibt die Abweichungen bewusst als Erfolgs-Nutzlast zurueck, damit die
      // Diagnose nicht verloren geht.
      return await scheitere(
        partPfad,
        'ffmpeg_fehler',
        `Die fertige Ausgabedatei entspricht nicht dem Ausgabe-Profil und wurde verworfen ` +
          `(${abweichungsText(befund.abweichungen)}). Die vorhandene Ausgabedatei bleibt ` +
          `unveraendert.`,
      )
    }

    // --------------------------------------------------------------- Schritt 2b
    // DAS KRITERIUM "TONSPUR VORHANDEN" WIRD HIER EIGENSTAENDIG GETRAGEN.
    //
    // TK 9.2.6 zaehlt die vorhandene Tonspur ausdruecklich zu dem, was an der fertigen
    // Datei geprueft wird (R-06: ein Consumer-TV startet eine tonlose Datei unter
    // Umstaenden gar nicht erst). `vergleicheStroeme` (#170) faengt den Fall heute zwar
    // ebenfalls - aber nur MITTELBAR, ueber die Layout-Merkmale `stromAnzahl` und
    // `stromArten`: `pruefeMerkmale` steigt bei fehlendem Audioblock AUS, BEVOR die
    // `AUDIO_MERKMALE` ueberhaupt ausgewertet werden (`if (quelle === null) return`).
    // Wer in #170 je die Layout-Merkmale lockert - etwa um einen zusaetzlichen
    // Datenstrom zuzulassen -, loeschte damit lautlos ein Abnahmekriterium DIESER
    // Datei, ohne dass hier irgendetwas rot wuerde. Deshalb steht die Frage hier noch
    // einmal, und zwar direkt am Befund statt an einer fremden Merkmalsliste.
    //
    // KEINE DOPPELUNG DER AUDIO-EIGENSCHAFTEN: Codec, Abtastrate und Kanalzahl bleiben
    // Sache von #170. Hier steht ausschliesslich die eine Frage, die #170 gar nicht
    // erreicht - IST ueberhaupt eine Tonspur da?
    if (eigenschaften.audio === null) {
      return await scheitere(
        partPfad,
        'ffmpeg_fehler',
        `Die fertige Ausgabedatei hat KEINE Tonspur (gefundene Stroeme: ` +
          `${stromArtenText(eigenschaften.stromArten)}). Das Ausgabe-Profil verlangt eine ` +
          `stille Tonspur; ohne sie startet der Fernseher die Datei unter Umstaenden nicht. ` +
          `Die Datei wurde verworfen, die vorhandene Ausgabedatei bleibt unveraendert.`,
      )
    }

    // ---------------------------------------------------------------- Schritt 3
    // Das fuenfte Kriterium: die Dauer. Sie ist KEINE Uniformitaets-Eigenschaft -
    // sie haengt am Auftrag - und hat in `vergleicheStroeme` deshalb keinen Platz.
    // Der Istwert stammt aus DEMSELBEN ffprobe-Lauf (`format.duration`), der Sollwert
    // ist die framegerundete `gesamtdauer` aus #174. KEIN zweiter ffprobe-Aufruf,
    // auch nicht "nur fuer die Dauer".
    //
    // Die Toleranz kommt aus der EINEN benannten Konstante; hier steht weder ein
    // Zahlenliteral noch eine Formel.
    const abweichungSekunden = Math.abs(eigenschaften.dauerSekunden - erwarteteGesamtdauer)
    if (!(abweichungSekunden <= DAUER_TOLERANZ_SEKUNDEN)) {
      // Verneinte `<=`-Pruefung statt `>`: Ein nicht endlicher Wert (NaN) ist damit
      // ebenfalls eine Abweichung. Bei `>` wuerde er still durchgewinkt - und die
      // Pruefung, die einen abgebrochenen Encoder-Lauf abfangen soll, waere genau
      // dann wirkungslos, wenn etwas nicht stimmt.
      return await scheitere(
        partPfad,
        'ffmpeg_fehler',
        `Die fertige Ausgabedatei ist ${sekunden(eigenschaften.dauerSekunden)} lang, ` +
          `erwartet waren ${sekunden(erwarteteGesamtdauer)} (zulaessige Abweichung ` +
          `${sekunden(DAUER_TOLERANZ_SEKUNDEN)}). Das deutet auf einen abgebrochenen oder ` +
          `unvollstaendigen Render hin; die Datei wurde verworfen und die vorhandene ` +
          `Ausgabedatei bleibt unveraendert.`,
      )
    }

    // ---------------------------------------------------------------- Schritt 4
    // Die Groesse wird VOR dem Umbenennen ermittelt. Der `rename` aendert den Inhalt
    // nicht, die Groesse ist danach identisch - wuerde aber erst danach gemessen und
    // schluege dieses `stat` fehl, muesste ein ERFOLGREICHER Lauf als Fehler gemeldet
    // werden, obwohl die richtige Datei laengst am Ziel liegt.
    //
    // Sie kommt aus `fs.stat` und NICHT aus der ffprobe-Ausgabe: `fs.stat` ist die
    // Quelle, die auch der Export und die Ausgabe-Liste (#75) benutzen; ein zweiter
    // Weg zur selben Zahl liefe irgendwann auseinander.
    let dateigroesse: number
    try {
      dateigroesse = (await stat(partPfad)).size
    } catch (ursache) {
      return await scheitereAmDateisystem(partPfad, ursache, 'stat', partPfad)
    }

    // Und jetzt der EINE Schreibvorgang am Ziel. Ohne vorheriges Loeschen, ohne
    // Existenzpruefung: Node bildet `rename` auf beiden Plattformen auf eine
    // ersetzende Operation ab (POSIX `rename`, Windows `MoveFileEx` mit
    // Ersetzen-Kennzeichen), und am 14.08.2026 auf exFAT und FAT32 nachgemessen.
    let letzteUrsache: unknown = null
    for (const warteMs of WARTESTAFFEL) {
      if (warteMs > SOFORT) {
        await warte(warteMs)
      }

      try {
        await rename(partPfad, zielPfad)
        return { ok: true, wert: { ausgabePfad: zielPfad, dateigroesse } }
      } catch (ursache) {
        letzteUrsache = ursache
        if (!WIEDERHOLBAR.includes(systemCode(ursache))) {
          // Sofort aufgeben, OHNE Wartezeit: Ein fehlendes Recht oder ein volles
          // Laufwerk bessert sich in 100 ms nicht.
          break
        }
      }
    }

    return await scheitereAmDateisystem(partPfad, letzteUrsache, 'rename', zielPfad)
  } catch (ursache) {
    // Letztes Fangnetz. Auch hier wird die `.part` entfernt - sie darf unter keinen
    // Umstaenden im Ausgabeordner liegen bleiben und dort als halb geschriebene
    // Datei auf dem USB-Stick landen.
    return await scheitere(
      partPfad,
      'unbekannter_fehler',
      `Die fertige Ausgabedatei liess sich nicht platzieren: ${textVon(ursache)} ` +
        `Die vorhandene Ausgabedatei bleibt unveraendert.`,
    )
  }
}
// - ruft `liesStromEigenschaften` GENAU EINMAL, mit dem hereingereichten Binaerpfad
// - prueft alle fuenf Kriterien aus EINEM Auslesen
// - fasst den `zielPfad` ausschliesslich mit `rename` an - kein Loeschen, kein Kopieren
// - entfernt in JEDEM Fehlerfall die `.part` und laesst die Zieldatei unveraendert
// - wirft nie; jeder Fehler wird zur Ergebnis-Huelle (TK 9.1.1)

/**
 * Der gemeinsame Misserfolgs-Ausgang: `.part` wegraeumen, dann den Code liefern.
 *
 * Das Entfernen ist IDEMPOTENT (`force: true`): Manche Fehlerpfade erreichen diese
 * Stelle, obwohl die `.part` gar nicht (mehr) existiert - etwa `ENOENT` beim
 * `rename`. Ohne Idempotenz erzeugte das Aufraeumen dort einen zweiten Fehler, der
 * den eigentlichen verdraengen koennte. Dieselbe Zusage gilt in #181, das die `.part`
 * in seinen terminalen Ausgaengen ebenfalls entfernt - BEIDE Entfernungen duerfen
 * sich ueberschneiden, ohne dass eine davon scheitert.
 *
 * Ein Fehlschlag beim Entfernen wird GESCHLUCKT und intern protokolliert: Er darf den
 * eigentlichen Fehlercode nicht verdraengen, sonst erfuehre der Nutzer die wahre
 * Ursache nie.
 *
 * DER `zielPfad` KOMMT HIER NICHT VOR. Es gibt in dieser Datei keinen Loeschaufruf
 * mit ihm als Argument - im Fehlerfall wird die vorhandene Ausgabedatei nicht
 * angefasst, nicht einmal ihr Zeitstempel.
 */
async function scheitere(
  partPfad: string,
  code: RenderFehlercode | 'unbekannter_fehler',
  meldung: string,
): Promise<Ergebnis<PlatzierenErgebnis, RenderFehlercode>> {
  try {
    await rm(partPfad, { force: true })
  } catch (ursache) {
    protokolliere('die Arbeitsdatei liess sich nicht entfernen', ursache)
  }
  return { ok: false, fehler: { code, meldung } }
}

/**
 * Der Misserfolgs-Ausgang fuer einen Systemfehler beim `stat` oder beim `rename`.
 *
 * DIE errno-ABBILDUNG DIESES MODULS, Wort fuer Wort dieselbe wie in #172
 * (Arbeitsbereich), #175 (PNG-Ablage in T1) und #177 (Zwischenclips in T1):
 * `ENOSPC` -> `kein_platz`, jeder andere Schreib-/Rename-Fehler ->
 * `speicher_fehler`, der Code des Betriebssystems IMMER nur in der `meldung`, NIE im
 * `code`. Fuer DIESE Datei ist die Abbildung durch TK 9.2.3 ausdruecklich gedeckt
 * ("Schreib- oder Rename-Fehler am ZIEL jenseits von Platzmangel"). Weicht eine der
 * vier Dateien ab, ist das ein Vertragsfehler - melden, nicht hier anders
 * entscheiden.
 */
async function scheitereAmDateisystem(
  partPfad: string,
  ursache: unknown,
  schritt: 'stat' | 'rename',
  betroffenerPfad: string,
): Promise<Ergebnis<PlatzierenErgebnis, RenderFehlercode>> {
  const code = systemCode(ursache)

  if (code === '') {
    // Keine Systemfehler-Kennung - also keine Aussage der Platte, sondern etwas
    // Unerwartetes. "Eine rohe Exception-Meldung wird nie zum Code" (TK 9.1.1).
    return await scheitere(
      partPfad,
      'unbekannter_fehler',
      `Die fertige Ausgabedatei liess sich nicht platzieren (${schritt}): ` +
        `${textVon(ursache)} Die vorhandene Ausgabedatei bleibt unveraendert.`,
    )
  }

  if (code === 'ENOSPC') {
    return await scheitere(
      partPfad,
      'kein_platz',
      `Im Ausgabeordner ist kein Platz mehr fuer die fertige Datei ${betroffenerPfad} ` +
        `(ENOSPC). Bitte Platz schaffen und den Render wiederholen. Die vorhandene ` +
        `Ausgabedatei bleibt unveraendert.`,
    )
  }

  if (code === 'EXDEV') {
    // DAS DARF NICHT VORKOMMEN und ist ein Aufbaufehler des Aufrufers: Das Staging
    // gehoert in DENSELBEN Ordner wie das Ziel. Es wird ausdruecklich NICHT durch
    // Kopieren repariert - ein solcher Ausweg ist nicht unteilbar und hoebe
    // Akzeptanzkriterium 9 auf.
    return await scheitere(
      partPfad,
      'speicher_fehler',
      `Die fertige Datei liegt auf einem ANDEREN LAUFWERK als ihr Ziel ${betroffenerPfad} ` +
        `(EXDEV) und kann deshalb nicht unteilbar an ihren Platz gebracht werden. Das ist ` +
        `ein Aufbaufehler: Die Arbeitsdatei .part gehoert in denselben Ordner wie die ` +
        `Ausgabedatei. Die vorhandene Ausgabedatei bleibt unveraendert.`,
    )
  }

  if (code === 'EBUSY' || code === 'EPERM') {
    // Alle Versuche der Staffel sind verbraucht - die Datei ist dauerhaft belegt.
    return await scheitere(
      partPfad,
      'speicher_fehler',
      `Die Ausgabedatei ${betroffenerPfad} ist belegt und liess sich auch nach ` +
        `${String(WARTESTAFFEL.length)} Versuchen nicht ersetzen (${code}). Bitte die Datei ` +
        `im Player oder im Explorer schliessen und den Render wiederholen. Die vorhandene ` +
        `Ausgabedatei bleibt unveraendert.`,
    )
  }

  // `EACCES`, `EROFS`, `ENOENT` und alles Uebrige. Ein `ENOENT` (die `.part` ist weg)
  // ist AUSDRUECKLICH `speicher_fehler` und nicht `nicht_gefunden`: Der Nutzer soll
  // die Ausgabedatei in Player/Explorer schliessen, Rechte pruefen und wiederholen -
  // genau die Handlungsanweisung, die TK 9.2.3 zu `speicher_fehler` nennt.
  return await scheitere(
    partPfad,
    'speicher_fehler',
    `Die fertige Datei liess sich nicht an ihren Platz ${betroffenerPfad} bringen ` +
      `(${code}). Bitte die Datei im Player oder im Explorer schliessen, die Schreibrechte ` +
      `pruefen und den Render wiederholen. Die vorhandene Ausgabedatei bleibt unveraendert.`,
  )
}

/**
 * Die Abweichungen als lesbare Meldung: Feld, Soll und Ist - jede einzelne.
 *
 * KEINE Kuerzung: Wer beim ersten Treffer abschneidet, zwingt den Nutzer zu so vielen
 * Durchlaeufen, wie es Fehler gibt - und ein Render dauert Minuten. Es geht um EINE
 * Datei mit einer ueberschaubaren Zahl gepruefter Merkmale.
 *
 * KEIN Stacktrace und KEINE rohe ffprobe-Ausgabe: Beides gehoert nicht in eine
 * Meldung, die bis in die Oberflaeche reist (TK 9.1.1).
 */
function abweichungsText(abweichungen: readonly Abweichung[]): string {
  if (abweichungen.length === 0) {
    // Kann nur eintreten, wenn #170 `ok: false` ohne eine einzige Abweichung liefert.
    // Dann bleibt wenigstens die Aussage stehen, statt einer leeren Klammer.
    return 'ohne naehere Angabe'
  }
  return abweichungen
    .map((a) => `${a.feld}: erwartet ${a.erwartet}, gefunden ${a.gefunden}`)
    .join('; ')
}

/**
 * Die gefundenen Stromarten fuer die Meldung.
 *
 * Eine leere Liste erscheint als Wort, nicht als leere Klammer: "gefundene Stroeme: "
 * ohne Fortsetzung saehe nach einem abgeschnittenen Text aus.
 */
function stromArtenText(arten: readonly string[]): string {
  return arten.length === 0 ? 'keine' : arten.join(', ')
}

/**
 * Eine Sekundenangabe fuer die Meldung.
 *
 * Drei Nachkommastellen, weil die Dauerpruefung im Bereich von Frames (1/30 s)
 * entscheidet: Eine auf ganze Sekunden gerundete Anzeige zeigte bei einer
 * Abweichung von 0,6 s zweimal dieselbe Zahl - und die Meldung, die dem Nutzer
 * sagen soll, WAS nicht passt, saehe wie ein Widerspruch aus.
 */
function sekunden(wert: number): string {
  return Number.isFinite(wert) ? `${wert.toFixed(3)} s` : `${String(wert)} s`
}

/**
 * Ein echtes `await` auf einen Timer, KEINE Beschaeftigungsschleife: Eine
 * `while`-Schleife auf die Uhr blockierte den Hauptprozess und damit die gesamte
 * Oberflaeche.
 */
async function warte(ms: number): Promise<void> {
  await new Promise<void>((weiter) => setTimeout(weiter, ms))
}

/**
 * Liest den `code` eines Node-Systemfehlers, ohne ihn auf einen Typ zu zwingen, den
 * er nicht hat. Leerer String = kein verwertbarer Code.
 */
function systemCode(ursache: unknown): string {
  if (typeof ursache !== 'object' || ursache === null || !('code' in ursache)) {
    return ''
  }
  const code = (ursache as { code?: unknown }).code
  return typeof code === 'string' ? code : ''
}

/** Der Text einer Ausnahme, ohne Stacktrace - der reist nicht ueber die Grenze. */
function textVon(ursache: unknown): string {
  return ursache instanceof Error ? ursache.message : String(ursache)
}

/**
 * "Intern protokolliert" - die Hausform aus #172 und #88: `console.error` im
 * HAUPTPROZESS, mit Modul-Praefix. Nichts davon erreicht den Renderer.
 */
function protokolliere(stelle: string, ursache: unknown): void {
  console.error(`[render-service] Ausgabe platzieren: ${stelle}:`, ursache)
}

// NICHT HIER, UND BEWUSST SO:
//
// 1. KEIN `ermittleFfprobePfad()` (#6) und KEIN eigener ffprobe-Start. Der Binaerpfad
//    reist als Parameter; gerufen wird #6 genau einmal je Lauf, in `renderReel`
//    (#181), das ihn an diese Funktion UND an `pruefeUniformitaet` durchreicht.
//
// 2. KEIN ZWEITER AUSLESE-LAUF, auch nicht "zur Sicherheit" nach dem Umbenennen und
//    auch nicht nur fuer die Dauer. Ein Auslesen, alle fuenf Pruefungen daraus.
//
// 3. KEIN IMPORT VON `entferneDateiMitRetry` (#86). Die Wartestaffel oben ist bewusst
//    gedoppelt: #86 liegt im `media-service`, und ein Import von dort waere der erste
//    modulueberschreitende Import ZWISCHEN ZWEI FACHDIENSTEN DES MAIN. (Der Import
//    aus dem `ffmpeg-adapter` weiter oben ist keiner: Der Adapter ist kein
//    Fachdienst, sondern das Werkzeug, durch das der `render-service` ffmpeg und
//    ffprobe ueberhaupt erreicht - dieselbe Naht wie in `normalisieren.ts` (#177) und
//    `abbruch.ts` (#179).) #86 ist das VORBILD fuer Aufbau und Fehlerklassen, nicht
//    die Bibliothek; dieselbe Doppelung mit derselben Begruendung steht in #172. Wer
//    sie aufloesen will, hebt die Regel an EINER Stelle fuer alle auf.
//
// 4. KEINE PRUEFUNG, OB AM ZIEL SCHON EINE DATEI LIEGT. Es interessiert diese Datei
//    nicht: Sie ersetzt in jedem Fall. Eine Existenzpruefung waere nur eine
//    Einladung, daraus eine Sonderbehandlung ("erst loeschen") abzuleiten.
//
// 5. KEIN Q3-PROTOKOLLEINTRAG und kein `historieEintrag`-Feld. Den Q3-Eintrag baut
//    allein die Auftragsverwaltung; der `render-service` liefert nur Pfad, Groesse
//    und Gesamtdauer (TK 9.2.3).
//
// 6. KEIN `fsync` VOR DEM `rename`. Die Datei wurde von ffmpeg geschrieben und
//    geschlossen; ein `fsync` verlangte ein eigenes Handle, und auf Windows scheitert
//    er auf einem nur lesend geoeffneten Handle mit `EPERM` (nachgemessen in diesem
//    Projekt). Ein Verzeichnis-`fsync`, mit dem sich das Umbenennen selbst haltbar
//    machen liesse, gibt es dort ohnehin nicht. Das Issue verlangt ihn an dieser
//    Stelle auch nicht - er ist Sache des `export-service` (9.6), der auf einen
//    abziehbaren USB-Stick schreibt.
