// GENERIERT aus dem Signaturblock von Issue #160.
// [ffmpeg-adapter] Fortschritt aus der ffmpeg-Ausgabe lesen und drosseln
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
// GERUEST-PRUEFSUMME: 38df4b01c843f32f
//
// ERLEDIGT (14.08.2026): Rumpf gefuellt, die dateiweite Abschaltzeile
// (@typescript-eslint/no-unused-vars) ist damit entfernt - der Parameter wird
// jetzt benutzt.
//
// WOHER DIE ZEILEN KOMMEN: Der Prozessstart (#158) setzt im festen Vorspann
// `-progress pipe:1 -nostats` und reicht jede VOLLSTAENDIGE stdout-Zeile
// ungedeutet weiter. Diese Datei importiert prozess.ts NICHT - verdrahtet wird
// beides in renderReel (#181). Sie sucht sich auch keine eigene Quelle: sie
// beantwortet ausschliesslich, was ihr hereingereicht wird.
//
// DAS GEMESSENE FORMAT (echtes ffmpeg-static, 14.08.2026, ein Lauf ueber
// testsrc mit -t 2): je Block eine Zeile `schluessel=wert`, abgeschlossen mit
// `progress=continue` bzw. beim letzten Block `progress=end`. Der ERSTE Block
// trug durchgehend `N/A` als Wert - auch fuer die Zeitfelder. Deshalb ist "kein
// lesbarer Zahlenwert" hier der Normalfall und kein Ausnahmezustand.
//
//   frame=0            frame=60
//   out_time_us=N/A    out_time_us=1900000
//   out_time_ms=N/A    out_time_ms=1900000
//   out_time=N/A       out_time=00:00:01.900000
//   progress=continue  progress=end
//
// Der Lauf belegt zugleich das Verbot aus dem Issue: `out_time_ms` trug
// denselben Wert wie `out_time_us`, also MIKROSEKUNDEN. Wer den Namen glaubt und
// durch den Faktor 1000 teilt, meldet nach der ersten Sekunde 100 % und laesst den Balken
// dann minutenlang stillstehen - ein Fehler, der wie ein Absturz aussieht.
// Ausgewertet werden deshalb nur `out_time_us` und ersatzweise `out_time`; die
// Zeichenkette out_time_ms kommt in dieser Datei ausserhalb dieses Kommentars
// nicht mehr vor.

/**
 * Kleinster Abstand zwischen zwei gemeldeten Werten - hoechstens vier Meldungen je Sekunde.
 *
 * TK 9.2.7 fuehrt die Drosselung als VERTRAG, nicht als Umsetzungsdetail: ffmpeg schreibt
 * mehrmals je Sekunde einen Block, bei manchen Einstellungen im Bildtakt. Ungebremst wuerde
 * daraus je ein Ereignis ueber die Prozessgrenze, jedes serialisiert und im Renderer eine
 * React-Aktualisierung - die Oberflaeche wird genau WAEHREND des Renders zaeh, also dann,
 * wenn der Nutzer sie beobachtet. Vier Werte je Sekunde sind fuer das Auge fluessig (schneller
 * liest niemand einen Balken) und ergeben bei zehn Minuten rund 2400 Nachrichten statt einer
 * fuenfstelligen Zahl.
 */
const MIND_ABSTAND_MS = 250

/** Voller Ausschlag - zugleich der Faktor der Prozentrechnung und die obere Schranke. */
const VOLL_PROZENT = 100

const MIKROSEKUNDEN_JE_SEKUNDE = 1_000_000
/** Gewicht je Stelle in `HH:MM:SS` - Stunden zu Minuten wie Minuten zu Sekunden. */
const SEKUNDEN_JE_MINUTE = 60

/** `HH:MM:SS.uuuuuu` - Stunden, Minuten, Sekunden. */
const ZEIT_TEILE = 3

export interface FortschrittsLeser {
  /**
   * Nimmt EINE Zeile der ffmpeg-Standardausgabe entgegen.
   * Liefert einen Prozentwert 0..100 (ganzzahlig), wenn jetzt ein Wert gemeldet werden soll,
   * sonst null (Zeile uninteressant ODER Drosselung greift).
   * `jetztMs` ist die Zeitquelle - sie wird HINEINGEREICHT, nicht in dieser Datei gelesen.
   */
  nimmZeile(zeile: string, jetztMs: number): number | null
}

/**
 * Erzeugt einen Leser fuer GENAU EINEN ffmpeg-Aufruf.
 * `erwarteteDauerSekunden` ist die Solldauer des Ergebnisses DIESES Aufrufs.
 * Ist sie <= 0, nicht endlich oder keine Zahl, liefert der Leser dauerhaft null -
 * er rechnet dann nicht, statt zu raten.
 */
export function erzeugeFortschrittsLeser(erwarteteDauerSekunden: number): FortschrittsLeser {
  // Einmal entschieden, nicht je Zeile: Eine unbrauchbare Solldauer macht den Leser
  // dauerhaft stumm. Kein Wurf, kein geratener Ersatzwert - und vor allem keine Division,
  // aus der Infinity oder NaN in den Prozentwert liefe.
  const rechnetNicht =
    typeof erwarteteDauerSekunden !== 'number' ||
    !Number.isFinite(erwarteteDauerSekunden) ||
    erwarteteDauerSekunden <= 0

  /** Zeitpunkt des zuletzt ZURUECKGEGEBENEN Werts; null, solange noch keiner durchging. */
  let letzteMeldungMs: number | null = null

  /**
   * Wendet die Drosselung an und merkt sich den Zeitpunkt - aber nur bei einem Wert, der
   * tatsaechlich herausgeht. Ein gedrosselter Wert verschiebt das Fenster nicht.
   *
   * `ohneDrosselung` gilt allein fuer den Abschluss (`progress=end`): Der letzte Wert darf
   * nicht bei 93 % haengen bleiben, nur weil eben erst gemeldet wurde.
   */
  const melde = (prozent: number, jetztMs: number, ohneDrosselung: boolean): number | null => {
    if (!ohneDrosselung && letzteMeldungMs !== null) {
      const abstand = jetztMs - letzteMeldungMs
      // Rueckwaerts laufende oder unbrauchbare Zeit fuehrt hier bewusst NICHT zu einem
      // Wurf: `abstand >= 0` ist dann falsch (bei NaN ebenso) und der Wert geht durch.
      // Die Drosselung greift eben nicht - schlimmstenfalls eine Meldung zu viel.
      if (abstand >= 0 && abstand < MIND_ABSTAND_MS) return null
    }

    // Nur endliche Zeitstempel werden zum Bezugspunkt. Ein einmal gemerktes NaN wuerde
    // jeden weiteren Vergleich verderben.
    if (Number.isFinite(jetztMs)) letzteMeldungMs = jetztMs

    return prozent
  }

  return {
    nimmZeile(zeile: string, jetztMs: number): number | null {
      if (rechnetNicht) return null

      const feld = zerlegeZeile(zeile)
      if (feld === null) return null

      // Der Abschluss geht an der Drosselung vorbei und bedeutet 100 PROZENT - nicht
      // "erfolgreich". Der Fortschrittskanal traegt keinen Endzustand (TK 9.1.1 Punkt 5);
      // ob der Aufruf gelang, sagt allein der Exit-Code (#158). Danach setzt sich hier
      // nichts zurueck: Ein Leser gehoert zu einem Aufruf.
      if (feld.schluessel === 'progress') {
        return feld.wert === 'end' ? melde(VOLL_PROZENT, jetztMs, true) : null
      }

      const abgelaufeneSekunden = sekundenAus(feld.schluessel, feld.wert)
      if (abgelaufeneSekunden === null) return null

      const prozent = (abgelaufeneSekunden / erwarteteDauerSekunden) * VOLL_PROZENT
      return melde(begrenzt(prozent), jetztMs, false)
    },
  }
}

interface Feld {
  schluessel: string
  wert: string
}

/**
 * Zerlegt `schluessel=wert`. Alles ohne `=` ist keine Fortschrittszeile und wird ignoriert -
 * das trifft auch auf leere Zeilen und auf alles zu, was sonst noch im Strom landet.
 */
function zerlegeZeile(zeile: string): Feld | null {
  const trennung = zeile.indexOf('=')
  if (trennung === -1) return null

  return {
    schluessel: zeile.slice(0, trennung).trim(),
    wert: zeile.slice(trennung + 1).trim(),
  }
}

/**
 * Die abgelaufene Ausgabezeit in Sekunden - oder null, wenn diese Zeile keine traegt.
 *
 * `out_time_us` ist die Quelle; fehlt sie in DIESER Zeile, dient `out_time` als Ersatzweg.
 * Jeder andere Schluessel ist uninteressant.
 */
function sekundenAus(schluessel: string, wert: string): number | null {
  if (schluessel === 'out_time_us') {
    const mikrosekunden = zahlAus(wert)
    return mikrosekunden === null ? null : mikrosekunden / MIKROSEKUNDEN_JE_SEKUNDE
  }

  if (schluessel === 'out_time') return sekundenAusUhrzeit(wert)

  return null
}

/**
 * `HH:MM:SS.uuuuuu` in Sekunden. `N/A` und alles andere Unlesbare ergeben null - geraten
 * wird nicht, und der zuletzt gemeldete Wert wird nicht wiederholt.
 */
function sekundenAusUhrzeit(wert: string): number | null {
  const negativ = wert.startsWith('-')
  const teile = (negativ ? wert.slice(1) : wert).split(':')
  if (teile.length !== ZEIT_TEILE) return null

  // Von links nach rechts, jede Stelle mit 60 gewichtet: aus h wird h*60+m, daraus
  // (h*60+m)*60+s. Der Index entscheidet, NICHT der Inhalt - bei "01:01:30" waere ein
  // Vergleich auf Gleichheit der Zeichenkette in der zweiten Runde stillschweigend falsch.
  let sekunden = 0
  for (let stelle = 0; stelle < teile.length; stelle += 1) {
    const teil = teile[stelle]
    if (teil === undefined) return null

    const zahl = zahlAus(teil)
    if (zahl === null || zahl < 0) return null

    sekunden = (stelle === 0 ? 0 : sekunden * SEKUNDEN_JE_MINUTE) + zahl
  }

  return negativ ? -sekunden : sekunden
}

/**
 * Eine Zahl in Dezimalschreibweise - oder null.
 *
 * Bewusst streng statt `Number(...)`: Jenes macht aus einer leeren Zeichenkette eine 0 und
 * aus `0x10` eine 16. Der erste Block eines jeden Laufs traegt gemessen `N/A`; daraus darf
 * niemals eine 0 werden, sonst meldete jeder Lauf zuerst einen Fortschritt, den es nicht gibt.
 */
function zahlAus(text: string): number | null {
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)) return null

  const zahl = Number(text)
  return Number.isFinite(zahl) ? zahl : null
}

/**
 * Der Prozentwert, ganzzahlig und auf 0..100 begrenzt.
 *
 * Die Begrenzung ist kein Schoenheitsfehler-Schutz: Bei ungenauer Quelldauer meldet ffmpeg
 * regelmaessig eine Ausgabezeit JENSEITS der erwarteten Laenge - ohne Schranke stuende im
 * Balken "117 %". Eine Monotonie wird dagegen NICHT erzwungen; der Fortschritt ist eine
 * Schaetzung und darf springen. Ein geglaetteter Verlauf taeuschte eine Genauigkeit vor,
 * die es nicht gibt.
 */
function begrenzt(prozent: number): number {
  if (prozent > VOLL_PROZENT) return VOLL_PROZENT
  if (prozent > 0) return Math.round(prozent)

  // Schliesst zugleich NaN mit ein: Jeder Vergleich damit ist falsch, und ein NaN im
  // Balken waere schlimmer als eine 0. Entstehen kann es hier zwar nicht mehr (die
  // Solldauer ist geprueft, die Zeitwerte sind es auch) - aber das ist eine Zusage
  // zweier anderer Stellen, und die Schranke kostet nichts.
  return 0
}
