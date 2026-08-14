// GENERIERT aus dem Signaturblock von Issue #178.
// [render-service] Fortschritts-Ereignisse bilden und senden
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
// GERUEST-PRUEFSUMME: 341c70a6bbf61fcd
//
// ERLEDIGT (14.08.2026): Rumpf gefuellt, die dateiweite Abschaltzeile
// (@typescript-eslint/no-unused-vars) ist damit entfernt - alle Parameter werden
// jetzt benutzt.
//
// WOHER DIE DATEN KOMMEN - die Kette in Leserichtung:
//   #158 (ffmpeg-adapter/prozess.ts) setzt im FESTEN VORSPANN `-progress pipe:1`
//        und `-nostats` vor JEDE Argumentliste und reicht jede vollstaendige
//        stdout-Zeile ungedeutet weiter. NACHGEPRUEFT am 14.08.2026 in der
//        gebauten Datei (Konstante FESTER_VORSPANN, vorangestellt beim spawn) -
//        ohne dieses Flag schriebe ffmpeg zusammen mit `-loglevel error`
//        UEBERHAUPT NICHTS nach stdout und die ganze Kette waere gebaut und tot.
//   #160 (ffmpeg-adapter/fortschritt.ts) deutet die Zeilen und liefert je Aufruf
//        einen Prozentwert 0..100 des EINZELNEN ffmpeg-Laufs.
//   #177 gibt daraus den Anteil INNERHALB des Elements (0..1) an `meldeAnteil`.
//   DIESE DATEI rechnet daraus den Gesamtfortschritt und meldet ihn.
//   #191 haengt sich ueber `aufRenderFortschritt` an und traegt die Meldung auf
//        den Ereignis-Kanal in den Renderer.

import type { RenderProgress } from '../../shared/contracts/render-result'

/**
 * Mindestabstand zwischen zwei ZWISCHENTICKS aus `meldeAnteil` - hoechstens vier je Sekunde.
 *
 * TK 9.2.7 fuehrt die Drosselung als Vertrag und ueberlaesst die Rate der Umsetzung; das Issue
 * legt sie auf 250 ms fest, damit sie nicht dreimal verschieden ausfaellt. Dieselbe Zahl steht
 * aus demselben Grund in #160 - dort fuer den einzelnen ffmpeg-Lauf, hier fuer den Gesamtlauf.
 * Zwei Drosselstufen hintereinander sind kein Versehen: #160 kennt nur seinen Aufruf, diese
 * Datei sieht alle Elemente und die Elementwechsel dazwischen.
 */
const MIND_ABSTAND_MS = 250

/**
 * Die Phase `normalisieren` belegt 0-95, `verketten` die restlichen 95-100.
 *
 * Grund (Issue, ENTSCHIEDEN): Das Normalisieren codiert jedes Element neu, der abschliessende
 * `concat` laeuft mit `-c copy` und ist um Groessenordnungen schneller. Eine Gleichverteilung
 * liesse den Balken bei 50 % minutenlang stehen und am Ende springen.
 */
const NORMALISIEREN_BIS = 95

/** Obere Schranke der Nutzlast. Erreicht wird sie hier NIE - s. `begrenzt`. */
const VOLL_PROZENT = 100

/**
 * Die main-internen Hoerer, jeder in einer eigenen Huelle.
 *
 * WARUM DIE HUELLE UND KEIN `Set<Hoerer>` - woertlich dieselbe Begruendung wie in #65 und #47:
 * Ein Set haelt jede Funktion nur EINMAL. Meldet sich dieselbe Funktion zweimal an (zwei
 * Verdrahtungen, ein Neuaufbau des Fensters), traegt das Set einen Eintrag, und die erste
 * Abmeldung naehme dem zweiten Anmelder lautlos seine Meldungen weg. Mit der Huelle ist jede
 * Anmeldung ein eigener Eintrag, und jede Abmelde-Funktion entfernt genau ihren eigenen.
 *
 * Das ist zugleich der ganze Grund, warum die Abmelde-Funktion IDEMPOTENT ist, ohne dafuer ein
 * Merkflag zu brauchen: Sie schliesst ueber IHRE Huelle, und `Set.delete` auf einen bereits
 * entfernten Eintrag tut nichts. Ein spaeter angemeldeter Hoerer hat eine andere Huelle und
 * kann von ihr gar nicht getroffen werden.
 */
const hoerende = new Set<{ hoerer: (fortschritt: RenderProgress) => void }>()

/**
 * Meldet einen MAIN-INTERNEN Hoerer fuer RenderProgress-Ereignisse an; Rueckgabewert ist die
 * Abmelde-Funktion. Wird beim App-Start EINMAL von der Verdrahtung (#191) gerufen, die jede
 * Meldung auf dem EREIGNIS-Kanal `render:fortschritt` an den Renderer weitergibt.
 * Diese Datei kennt den Kanalnamen nicht und sendet nicht selbst (ENTSCHIEDEN unten).
 */
export function aufRenderFortschritt(
  hoerer: (fortschritt: RenderProgress) => void,
): () => void {
  const eintrag = { hoerer }
  hoerende.add(eintrag)
  return () => {
    hoerende.delete(eintrag)
  }
}

export interface FortschrittSender {
  /** Beginn der Normalisierung von Element k (0-basiert). Wird NIE gedrosselt. */
  starteElement(elementIndex: number, elementId: string): void
  /** Grober Zwischenstand INNERHALB des laufenden Elements, 0..1. Wird gedrosselt. */
  meldeAnteil(anteilImElement: number): void
  /** Element k ist fertig normalisiert. Wird NIE gedrosselt. */
  beendeElement(elementIndex: number): void
  /** Uebergang in die Phase `verketten` (ein Gesamtschritt). Wird NIE gedrosselt. */
  starteVerketten(): void
  /** Nach dem terminalen RenderResult aufzurufen. Danach feuert dieser Sender NICHTS mehr. */
  schliesse(): void
}

export function erzeugeFortschrittSender(
  renderId: string,
  elementAnzahl: number,
  anAuftrag: (ereignis: RenderProgress) => void,   // der Rueckruf aus #68
): FortschrittSender {
  /**
   * Der Riegel aus dem Issue: Nach dem terminalen RenderResult feuert dieser Sender NICHTS
   * mehr. Ein spaeter Tick wuerde sonst ueber #68 einen Prozentwert in einen Auftrag
   * schreiben, der bereits `fehlgeschlagen` oder `abgebrochen` ist - aus der roten Meldung
   * wuerde wieder ein wandernder Balken.
   */
  let geschlossen = false

  /** Zeitpunkt des zuletzt GESENDETEN Ereignisses; null, solange noch keins raus ist. */
  let letzteMeldungMs: number | null = null

  /**
   * Das Element, dessen Normalisierung gerade laeuft - oder null.
   *
   * Ohne laufendes Element gibt es fuer `meldeAnteil` kein k und damit nichts zu rechnen;
   * solche Aufrufe werden verworfen. Das ist der Zustand VOR dem ersten `starteElement`, nach
   * `beendeElement` und ab `starteVerketten`. Besonders der Fall nach `beendeElement` ist real:
   * Ein Zwischenstand, der aus dem stdout-Puffer eines schon beendeten ffmpeg-Prozesses
   * nachtroepfelt, meldete sonst 95x(k+0,3)/n, nachdem bereits 95x(k+1)/n gemeldet war - der
   * Balken liefe an genau der Stelle RUECKWAERTS, an der der Nutzer den Wechsel sieht.
   */
  let laufendesElement: { index: number; id: string } | null = null

  /**
   * `0 <= k < elementAnzahl`, ganzzahlig.
   *
   * Diese eine Pruefung deckt zugleich den Randfall `elementAnzahl = 0` (und jede unbrauchbare
   * Anzahl) ab: Es gibt dann kein gueltiges k, jedes Normalisier-Ereignis wird verworfen, und
   * die Division weiter unten wird nie mit 0 oder NaN erreicht. Ein Lauf ohne Elemente
   * existiert ohnehin nicht - `ungueltige_eingabe` faellt schon in der Validierung (#173).
   */
  const gueltigerIndex = (k: number): boolean =>
    Number.isInteger(k) && k >= 0 && k < elementAnzahl

  /**
   * Ein Ereignis an ALLE Empfaenger: erst `anAuftrag` (#68), dann - in Anmeldereihenfolge -
   * jeder ueber `aufRenderFortschritt` angemeldete Hoerer.
   *
   * `jetztMs` wird hereingereicht statt hier gelesen, damit der Aufrufer die Drosselung und
   * das Nachfuehren des Fensters mit DERSELBEN Zeitmarke entscheidet. Zwei getrennte Lesungen
   * koennten sonst um Millisekunden auseinanderliegen.
   */
  const sende = (ereignis: RenderProgress, jetztMs: number): void => {
    // Auch ein Grenz-Ereignis setzt das Drosselfenster zurueck (Issue, ENTSCHIEDEN) - sonst
    // kaeme unmittelbar nach einem Elementwechsel noch ein Zwischentick hinterher, der
    // dasselbe sagt. Nur endliche Zeitstempel werden zum Bezugspunkt; ein einmal gemerktes
    // NaN verdaerbe jeden weiteren Vergleich.
    if (Number.isFinite(jetztMs)) letzteMeldungMs = jetztMs

    // #68 zuerst: Der Auftrags-Fortschritt ist der Weg in die Warteschlangen-Leiste, die in
    // JEDEM Reiter sichtbar ist (TK 9.14).
    rufeGeschuetzt(() => {
      anAuftrag(ereignis)
    }, 'Der Rueckruf anAuftrag (#68) hat geworfen')

    // Ueber eine MOMENTAUFNAHME: Ein Hoerer darf sich waehrend der Zustellung an- oder
    // abmelden, ohne die laufende Schleife zu stoeren. Die Kopie allein genuegt aber nicht -
    // meldet ein Hoerer waehrend der Runde einen anderen ab, stuende der noch in ihr, und die
    // Zusage "nach der Abmeldung keine weitere Meldung" gilt ab dem Aufruf der
    // Abmelde-Funktion, nicht ab der naechsten Runde. Genau dieselbe Disziplin wie in #65.
    for (const eintrag of [...hoerende]) {
      if (!hoerende.has(eintrag)) continue
      rufeGeschuetzt(() => {
        eintrag.hoerer(ereignis)
      }, 'Ein Hoerer hat beim Melden geworfen')
    }

    // ALLE EMPFAENGER BEKOMMEN DASSELBE OBJEKT, keine Kopie je Empfaenger. Es wird nach dem
    // Bauen nicht mehr angefasst, und der einzige Hoerer laut Plan (#191) reicht es ueber die
    // Prozessgrenze weiter, wo es ohnehin kopiert wird.
  }

  /** Nutzlast fuer die Phase `normalisieren`. `anteil` ist bereits auf 0..1 begrenzt. */
  const normalisierEreignis = (
    index: number,
    id: string | null,
    anteil: number,
  ): RenderProgress => ({
    renderId,
    phase: 'normalisieren',
    elementIndex: index,
    elementAnzahl,
    elementId: id,
    // Die Rechnung des Issues, woertlich:
    //   prozent = round(95 x (elementIndex + anteilImElement) / elementAnzahl)
    // Sie kann nicht ueber 95 hinauslaufen: `index + anteil` ist hoechstens
    // (elementAnzahl - 1) + 1 = elementAnzahl, der Bruch also hoechstens 1.
    prozent: begrenzt((NORMALISIEREN_BIS * (index + anteil)) / elementAnzahl),
  })

  return {
    starteElement(elementIndex: number, elementId: string): void {
      if (geschlossen) return
      // Ein ungueltiger Index setzt AUCH KEIN laufendes Element: Sonst rechneten die
      // folgenden Zwischenticks mit einem k, das es nicht gibt.
      if (!gueltigerIndex(elementIndex)) return

      laufendesElement = { index: elementIndex, id: elementId }
      sende(normalisierEreignis(elementIndex, elementId, 0), Date.now())
    },

    meldeAnteil(anteilImElement: number): void {
      if (geschlossen) return

      const aktuell = laufendesElement
      if (aktuell === null) return

      const jetztMs = Date.now()
      if (letzteMeldungMs !== null) {
        const abstand = jetztMs - letzteMeldungMs
        // Rueckwaerts laufende oder unbrauchbare Zeit fuehrt hier bewusst NICHT zu einem
        // Wurf: `abstand >= 0` ist dann falsch (bei NaN ebenso) und der Wert geht durch. Die
        // Drosselung greift eben nicht - schlimmstenfalls eine Meldung zu viel. Dieselbe
        // Entscheidung wie in #160.
        if (abstand >= 0 && abstand < MIND_ABSTAND_MS) return
      }

      sende(
        normalisierEreignis(aktuell.index, aktuell.id, anteilBegrenzt(anteilImElement)),
        jetztMs,
      )
    },

    beendeElement(elementIndex: number): void {
      if (geschlossen) return
      if (!gueltigerIndex(elementIndex)) return

      // Die Kennung nur, wenn sie zu DIESEM Index gehoert. Ein Ende, das ein anderes Element
      // meldet als das begonnene, faerbte sonst die Markierung der Oberflaeche falsch ein.
      const id = laufendesElement?.index === elementIndex ? laufendesElement.id : null

      // Anteil 1 = dieses Element ist ganz durch. Damit gilt
      // beendeElement(k) == starteElement(k+1) im Prozentwert - der Uebergang zwischen zwei
      // Elementen erzeugt keinen Sprung und erst recht keinen Ruecksprung.
      laufendesElement = null
      sende(normalisierEreignis(elementIndex, id, 1), Date.now())
    },

    starteVerketten(): void {
      if (geschlossen) return

      // Kein Element mehr: In `verketten` gibt es keins, und ein nachtroepfelnder
      // Zwischenstand darf die Phase nicht rueckwaerts drehen.
      laufendesElement = null
      sende(
        {
          renderId,
          phase: 'verketten',
          // Alle drei null (Issue, ENTSCHIEDEN; TK 9.2.7 fuehrt sie nur "in Phase
          // normalisieren"). Ein zurueckgelassener Index liesse die Oberflaeche das letzte
          // Element weiter markieren, obwohl daran gar nichts mehr passiert.
          elementIndex: null,
          elementAnzahl: null,
          elementId: null,
          prozent: NORMALISIEREN_BIS,
        },
        Date.now(),
      )
    },

    schliesse(): void {
      // Idempotent, und danach wird still verworfen: Ein spaet eintreffender Tick aus einem
      // bereits beendeten ffmpeg-Prozess ist ein normales Rennen, kein Defekt - er wird nicht
      // protokolliert und nicht gemeldet.
      geschlossen = true
      laufendesElement = null
    },
  }
}

/**
 * Der Prozentwert, ganzzahlig und auf 0-100 begrenzt.
 *
 * Die 100 kommt aus dieser Datei NIE heraus, und zwar durch die Rechnung, nicht durch diese
 * Schranke: Die Phase `normalisieren` endet bei 95, `starteVerketten` meldet 95. Das Ende des
 * Laufs meldet allein das `RenderResult` - eine 100 auf dem Fortschrittskanal waere ein
 * verkappter Endzustand (TK 9.1.1 Punkt 5). Die Schranke steht trotzdem hier, weil sie NaN
 * mit abfaengt: Jeder Vergleich damit ist falsch, und ein NaN im Balken waere schlimmer als
 * eine 0.
 *
 * Monotonie wird NICHT erzwungen (Issue, ENTSCHIEDEN): Der Wert ist eine Schaetzung und darf
 * springen. Ein geglaetteter Verlauf taeuschte eine Genauigkeit vor, die es nicht gibt.
 */
function begrenzt(prozent: number): number {
  if (prozent > VOLL_PROZENT) return VOLL_PROZENT
  if (prozent > 0) return Math.round(prozent)
  return 0
}

/**
 * Der Anteil innerhalb des Elements, auf 0..1 festgeklemmt.
 *
 * Nicht endlich (NaN, Infinity aus einer Division durch 0 beim Aufrufer) wird zu 0 und nicht
 * zu einem Wurf: Diese Datei hat keine Fehlerpfade nach aussen, und ein NaN duerfte auf keinen
 * Fall in die Prozentrechnung laufen.
 */
function anteilBegrenzt(anteil: number): number {
  if (!Number.isFinite(anteil)) return 0
  if (anteil > 1) return 1
  if (anteil < 0) return 0
  return anteil
}

/**
 * Ruft einen fremden Rueckruf und laesst ihn nichts umbringen.
 *
 * Ein Fortschritts-Ereignis ist eine Einbahnstrasse (TK 9.1.1 Punkt 5): Es traegt keine
 * Ergebnis-Huelle und keinen Fehlercode, also gibt es niemanden, dem ein Fehler hier zu melden
 * waere. Ein defekter Zuhoerer darf einen laufenden Render NIEMALS scheitern lassen und die
 * uebrigen Hoerer nicht mitreissen. Verschluckt wird trotzdem nicht ganz: Ohne diese Zeile
 * waeren genau die Faelle, in denen jemand seinen Vertrag bricht, die unauffindbarsten.
 */
function rufeGeschuetzt(ruf: () => void, stelle: string): void {
  try {
    ruf()
  } catch (ursache) {
    console.error(`[render-service] fortschritt: ${stelle}:`, ursache)
  }
}

// NICHT HIER, UND GEMELDET:
//
// 1. KEIN WEG ZUM RENDERER. Diese Datei kennt weder Fenster noch Kanalnamen; sie importiert
//    weder das Fenster-Werkzeug noch die Kanalliste und ruft nichts zum Senden auf (die
//    Grep-Probe der DoD faende sonst ihr eigenes Stichwort in einem Kommentar). Den Uebergang auf
//    den Ereignis-Kanal baut #191, das sich hier ueber `aufRenderFortschritt` anmeldet -
//    genau EIN Ort mit Fensterreferenz. NICHT hier einen zweiten Sendeweg nachruesten.
//
// 2. KEIN AUSLOESER. `erzeugeFortschrittSender` ruft in dieser Datei niemand. Der Erzeuger ist
//    renderReel (#181): Es baut den Sender, verdrahtet `meldeAnteil` in den
//    NormalisierKontext (`aufElementFortschritt`, #177) und ruft `schliesse()` im terminalen
//    Ausgang. Heute ruft sie im ganzen Baum noch KEINE Stelle (geprueft mit grep ueber src/
//    am 14.08.2026) - erwartbar, weil #177, #181 und #191 noch offen sind.
//
// 3. ZWEI LUECKEN DER "VOLLSTAENDIGEN" FEHLERPFAD-TABELLE DES ISSUES, hier entschieden:
//    (a) `meldeAnteil` OHNE laufendes Element (vor dem ersten `starteElement`, nach
//        `beendeElement`, nach `starteVerketten`) - die Tabelle kennt den Fall nicht. Er wird
//        verworfen, weil ohne k nichts zu rechnen ist; die Begruendung steht bei
//        `laufendesElement`.
//    (b) Ein `starteElement` NACH `starteVerketten` wird nicht gesperrt. Die Reihenfolge
//        garantiert der Aufrufer (#181, ein Lauf, eine Instanz); eine Phasensperre hier waere
//        eine Regel, die im Vertrag nicht steht. Faellt in #181 das Gegenteil auf: melden.
//
// 4. KEINE MONOTONIE-GARANTIE ueber `meldeAnteil` hinweg. Innerhalb eines Elements kann #160
//    einen kleineren Anteil nachliefern als zuvor; der Wert darf dann sinken. Das Issue
//    erlaubt es ausdruecklich ("darf springen und muss nicht monoton sein"). An den
//    ELEMENTGRENZEN kann es nicht passieren, weil beendeElement(k) und starteElement(k+1)
//    denselben Wert ergeben.
