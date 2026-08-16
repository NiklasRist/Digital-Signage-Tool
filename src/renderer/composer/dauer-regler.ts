// GENERIERT aus dem Signaturblock von Issue #125.
// [composer] Der einheitliche Dauer- und Trim-Regler
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
// GERUEST-PRUEFSUMME: 37c55dc802947c19
//
// ============================================================================
// EIN BEDIEN-BAUSTEIN, ZWEI FACHLICHE DINGE - UND GENAU EIN EINSTIEGSPUNKT
// ============================================================================
// „Dauer (FA-06) und Trim (FA-14) werden für **alle** Elementtypen über
// **denselben** Bedien-Baustein gesteuert – einen Balken mit Griffen, an denen der
// Nutzer die effektive Dauer zieht." (Anforderungsdokument 4.4)
//
// „Kürzen *und* Verlängern fühlen sich überall gleich an („wie Trimmen"); nur die
// Grenzen unterscheiden sich je nach Elementtyp" (ebenda). Das ist der ganze Bauplan
// dieser Datei: EIN Modell (`ReglerModell`), EINE Klemmung (`begrenze`), EIN
// Uebergabeweg (`uebernehmeGrenzen`). Was sich je Elementart unterscheidet, sind
// ausschliesslich DATEN im Modell - Anzahl der Griffe, Unter- und Obergrenze - und
// die Zieloperation hinter dem einen Einstiegspunkt.
//
// „einheitlich" verwaessert man, indem man zwei Einstiegspunkte anbietet und die
// Oberflaeche entscheiden laesst, welchen sie nimmt. Dann gibt es zwei
// Bedienlogiken, und eine von beiden legt den Bereich irgendwann anders aus.
// Deshalb: Die Oberflaeche kennt `uebernehmeGrenzen` und sonst nichts; sie KANN die
// beiden Faelle gar nicht verschieden behandeln.
//
// DIE GRENZEN JE ART (verbindlich, Tabelle des Issues):
//   video   | 2 Griffe | untergrenze 0                | obergrenze asset.dauer
//   bild    | 1 Griff  | untergrenze DAUER_BEREICH.min | obergrenze DAUER_BEREICH.max
//   segment | 1 Griff  | untergrenze DAUER_BEREICH.min | obergrenze DAUER_BEREICH.max
//
// „**Video (FA-14):** zwei Griffe (Anfang/Ende) innerhalb der **Quelllänge** des
// Videos. Kürzen schneidet Anfang/Ende weg; Verlängern ist **nur bis zur
// Quelllänge** möglich (mehr Material existiert nicht). Der Schnitt ist
// **nicht-destruktiv** – die Originaldatei bleibt unverändert."
// (Anforderungsdokument 4.4)
//
// Fuer das Aktions-Segment (FA-06) nennt derselbe Abschnitt einen frei
// einstellbaren Dauerbereich mit einem Standardwert und haelt fest: „Da es keine
// Quelllänge gibt, ist die Obergrenze die konfigurierte Maximaldauer; Kürzen und
// Verlängern laufen über denselben Regler." (Anforderungsdokument 4.4)
//
// DIE BEIDEN GRENZWERTE DIESES BEREICHS STEHEN IN DIESER DATEI NIRGENDS - weder als
// Zahl noch im Zitat. Sie kommen ausschliesslich aus `DAUER_BEREICH` (#21), das
// TK 9.11.4 als die eine Stelle fuehrt, an der sie stehen und gegen die
// `setzeDauer` (TK 9.5.2) prueft. Eine Kopie hier waere eine
// zweite Quelle - der Regler liesse einen Wert zu, den der Store ablehnt, oder
// umgekehrt. Aus demselben Grund ist die Obergrenze eines Videos IMMER
// `Asset.dauer` (#13, aus ffprobe beim Import) und nie ein aus einem <video>-Element
// abgelesener, geschaetzter oder aus der Vorschau uebernommener Wert: Ein
// <video>-Element meldet je nach Container und Browser eine leicht andere Laenge,
// und der Regler liesse dann einen Ausschnitt zu, den setze-trim.ts abweist.
//
// HIER WIRD NICHT GERUNDET. `effektiveDauer` ist die ROHE Differenz `ende − anfang`.
// „Dieselbe Rundungsregel gilt ausnahmslos (kein `floor` an einer, `round` an
// anderer Stelle)" (TK 9.2.6) - und ihr Ort ist der render-service, nicht der
// composer. `setzeTrim` speichert ausdruecklich rohe Sekunden
// (src/main/project-store/setze-trim.ts), und die einzige frame-gerundete Rechnung
// im Renderer ist die SUMME in gesamtlaenge.ts (#127, TK 9.7.4). Zwei
// Rundungsstellen im Renderer waeren zwei Regeln.
//
// UND ES WIRD NICHTS GERASTERT. Ob ein Video-Ausschnitt eine praktische
// Mindestdauer bekommt und ob `dauer` auf ganze Sekunden oder auf das Frame-Raster
// eingeschraenkt wird, sind offene Punkte der beiden Store-Operationen
// (src/main/project-store/setze-trim.ts, setze-dauer.ts). Der Regler gibt die
// gezogenen Werte unveraendert weiter - nur geklemmt. Eine eigene Untergrenze waere
// eine zweite Regel und stuende bei einer anderen Antwort still daneben.
//
// KEIN JSX, KEIN REACT. Diese Datei ist das Modell und der Uebergabeweg; der
// Balken, die Griffe und das Zahlenfeld gehoeren in die Oberflaechen-Datei. So sind
// Grenzen, Klemmung und Verzweigung ohne Browser pruefbar.
//
// KEINE EIGENE ROLLBACK-REGEL. „**Fehlerklasse 1 – Operation abgelehnt
// (synchron):** z. B. ungültiger Wert. → optimistischen Schritt **rückgängig**
// machen (letzter bestätigter Stand) + kurze Inline-Meldung." (TK 9.7.3) - und
// scheitert spaeter das Auto-Speichern (Klasse 2), wird NICHT zurueckgerollt. Beide
// Klassen wohnen ausschliesslich in optimistisch.ts (#126); diese Datei liefert nur
// die drei Rueckrufe und faellt damit strukturell auf die richtige Seite.

import type { Listenelement } from '../../shared/contracts/project'
import type { Asset } from '../../shared/contracts/asset'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { DAUER_BEREICH } from '../../shared/contracts/konstanten'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'
import { gleicheElementAb, holeSicht } from './projektzustand'
import { fuehreOptimistischAus } from './optimistisch'

/** Das eine Modell hinter dem einen Regler – für Video und Aktions-Segment gleich geformt. */
export interface ReglerModell {
  elementId: string
  griffe: 1 | 2            // Video: 2 (Anfang/Ende); Segment: 1 (nur die Länge)
  untergrenze: number      // Sekunden – kleinstmöglicher Wert für `anfang`
  obergrenze: number       // Sekunden – größtmöglicher Wert für `ende`
  anfang: number           // Sekunden – bei Segment immer 0
  ende: number             // Sekunden
  effektiveDauer: number   // Sekunden = ende − anfang (roh, s. „ENTSCHIEDEN" 3)
}

/** Einheitlicher Fehlerausgang. Kein `throw` verlaesst diese Datei – die Signaturen
 *  lauten auf `Ergebnis`, und der Aufrufer prueft `ok`, er faengt nichts. */
function fehler<T>(code: 'ungueltige_eingabe' | 'nicht_gefunden', meldung: string): Ergebnis<T> {
  return { ok: false, fehler: { code, meldung } }
}

/**
 * Klemmt einen Wert in ein geschlossenes Intervall.
 *
 * DIE EINZIGE KLEMMSTELLE DER DATEI. `baueReglerModell` und `begrenze` benutzen
 * dieselbe Funktion; zwei getrennte Klemmungen waeren zwei Auslegungen desselben
 * Bereichs - genau die Doppelung, gegen die dieses Issue existiert.
 *
 * Ein nicht endlicher Eingang wird NICHT „repariert": Er kommt als `null` zurueck,
 * und der Aufrufer entscheidet, was das bedeutet. Ein stillschweigend auf die
 * Untergrenze gezogenes `NaN` waere ein erfundener Nutzerwunsch.
 */
function klemme(wert: number, unten: number, oben: number): number | null {
  if (typeof wert !== 'number' || !Number.isFinite(wert)) return null
  if (wert < unten) return unten
  if (wert > oben) return oben
  return wert
}

/** Ein defensiv gelesenes Listenelement – `art`, `id` und die Zahlenfelder als `unknown`.
 *  Die Typen sind statisch verengt, die Daten kommen aber aus einer JSON-Datei, die auch von
 *  Hand bearbeitet worden sein kann (dieselbe Linie wie `frameDauer` in gesamtlaenge.ts). */
type RohesElement = {
  id?: unknown
  art?: unknown
  dauer?: unknown
  trimStart?: unknown
  trimEnde?: unknown
} | null | undefined

/** Die Element-ID fuer Modell und Meldungen, defensiv gelesen. */
function lesId(roh: RohesElement): string {
  const wert: unknown = roh?.id
  return typeof wert === 'string' ? wert : String(wert)
}

/** Baut das Modell aus dem Listenelement. `asset` ist das über `element.ref` referenzierte Asset –
 *  nur bei art 'video' nötig, sonst null. */
export function baueReglerModell(
  element: Listenelement,
  asset: Asset | null,
): Ergebnis<ReglerModell> {
  const roh = element as unknown as RohesElement

  // ZUERST, VOR JEDEM FELDZUGRIFF: Ohne diese Schranke wirft schon das Auslesen der
  // `id` bei `null`/`undefined` eine TypeError - und werfen darf diese Funktion
  // nicht.
  if (roh === null || roh === undefined || typeof roh !== 'object') {
    return fehler(
      'ungueltige_eingabe',
      `Das Listenelement ist kein Objekt, vorgefunden: ${String(roh)}.`,
    )
  }

  const elementId = lesId(roh)
  const art = roh.art

  if (art === 'video') {
    // „`video` | `Asset` (typ `video`) | `null` – die Dauer ergibt sich aus dem
    // Trim | gesetzt | erlaubt" (TK 9.11.3, Belegungstabelle). `element.dauer`
    // wird bei einem Video deshalb NIE gelesen, auch wenn dort etwas steht.
    if (asset === null || asset === undefined || asset.typ !== 'video') {
      // `nicht_gefunden` und nicht `ungueltige_eingabe`: Der Aufrufer hat das
      // Asset ueber `element.ref` nachgeschlagen und nichts Passendes bekommen -
      // fehlend ist das Asset, nicht die Eingabe.
      return fehler(
        'nicht_gefunden',
        `Zum Video-Element ${elementId} wurde kein Video-Asset uebergeben; ohne das ` +
          'referenzierte Asset gibt es keine Quelllaenge und damit keine Obergrenze.',
      )
    }

    const quelldauer = asset.dauer
    if (
      typeof quelldauer !== 'number' ||
      !Number.isFinite(quelldauer) ||
      quelldauer <= 0
    ) {
      // Ohne Quelllaenge KEIN Modell. Ein Regler mit geratener Obergrenze liesse
      // Ausschnitte zu, die setze-trim.ts abweist - der Nutzer saehe eine Dauer,
      // die der Store nicht annimmt.
      return fehler(
        'ungueltige_eingabe',
        `Zum Medium ${asset.id} ist keine brauchbare Laufzeit hinterlegt ` +
          `(vorgefunden: ${String(quelldauer)}); der Regler haette keine Obergrenze.`,
      )
    }

    const untergrenze = 0
    const obergrenze = quelldauer

    // VOLLE LAENGE ALS RUECKFALL. Ein Video-Listenelement traegt laut
    // Belegungstabelle immer gesetzte Trim-Grenzen, und fuege-element-hinzu.ts
    // legt sie beim Anlegen ausdruecklich mit `trimStart: 0, trimEnde: quelldauer`
    // an. Fehlen sie trotzdem (aelterer oder von Hand veraenderter Projektstand),
    // ist „ungeschnitten" die einzige Deutung, die nichts erfindet - und sie ist
    // dieselbe, die der Store selbst vergibt. Ein Fehler waere hier die
    // schlechtere Wahl: Er sperrte den Regler fuer genau das Element, an dem der
    // Nutzer die Grenzen wieder geradeziehen will.
    const rohAnfang = typeof roh.trimStart === 'number' ? roh.trimStart : untergrenze
    const rohEnde = typeof roh.trimEnde === 'number' ? roh.trimEnde : obergrenze

    return baueModell(elementId, 2, untergrenze, obergrenze, rohAnfang, rohEnde)
  }

  if (art === 'segment') {
    // EIN Griff: „Da es keine Quelllänge gibt, ist die Obergrenze die konfigurierte
    // Maximaldauer" (Anforderungsdokument 4.4). Der Bereich begrenzt hier die
    // LAENGE, nicht eine Position in einer Quelle - deshalb bleibt `anfang` 0 und
    // wird nicht in den Bereich geklemmt.
    const dauer = roh.dauer
    if (typeof dauer !== 'number' || !Number.isFinite(dauer)) {
      return fehler(
        'ungueltige_eingabe',
        `Die Dauer des "segment"-Elements ${elementId} muss eine endliche Zahl sein, ` +
          `vorgefunden: ${String(dauer)}.`,
      )
    }

    return baueModell(elementId, 1, DAUER_BEREICH.min, DAUER_BEREICH.max, 0, dauer)
  }

  return fehler(
    'ungueltige_eingabe',
    `Das Listenelement ${elementId} hat die unbekannte Art ${JSON.stringify(art)}. ` +
      'Zulaessig sind ausschliesslich "video" und "segment".',
  )
}

/**
 * Der gemeinsame Schlussteil beider Zweige - EINE Stelle, an der ein Modell entsteht.
 *
 * Die gespeicherten Werte werden beim Bauen GEKLEMMT, mit derselben Funktion, die
 * `begrenze` benutzt. Grund: Das Modell beschreibt einen Balken mit Griffen; ein
 * `ende` jenseits der `obergrenze` zeichnete einen Griff neben den Balken, und der
 * erste Zug daran spraenge sichtbar. Im Normalfall aendert das Klemmen nichts - der
 * Store laesst nur Werte innerhalb der Grenzen zu (setze-trim.ts prueft
 * `0 <= start < ende <= Quelldauer`, setze-dauer.ts den Bereich). Es greift bei
 * einem von Hand veraenderten oder aelteren Projektstand, und genau dort ist ein
 * bedienbarer Regler mehr wert als eine getreue Wiedergabe eines kaputten Werts.
 *
 * `effektiveDauer` ist danach die ROHE Differenz - kein Runden, kein Formatieren.
 */
function baueModell(
  elementId: string,
  griffe: 1 | 2,
  untergrenze: number,
  obergrenze: number,
  rohAnfang: number,
  rohEnde: number,
): Ergebnis<ReglerModell> {
  const geklemmt = klemmePaar(griffe, untergrenze, obergrenze, rohAnfang, rohEnde)
  if (geklemmt === null) {
    return fehler(
      'ungueltige_eingabe',
      `Die Grenzen des Elements ${elementId} sind keine endlichen Zahlen, vorgefunden: ` +
        `anfang = ${String(rohAnfang)}, ende = ${String(rohEnde)}.`,
    )
  }

  const { anfang, ende } = geklemmt
  if (anfang >= ende) {
    // Ein Modell ohne Laenge ist kein bedienbarer Regler: Beide Griffe laegen
    // aufeinander, und `effektiveDauer` waere 0 oder negativ - eine Zahl, die die
    // Oberflaeche als Tatsache anzeigte.
    return fehler(
      'ungueltige_eingabe',
      `Der Bereich des Elements ${elementId} hat keine Laenge: anfang = ${String(anfang)}, ` +
        `ende = ${String(ende)}.`,
    )
  }

  return {
    ok: true,
    wert: { elementId, griffe, untergrenze, obergrenze, anfang, ende, effektiveDauer: ende - anfang },
  }
}

/**
 * Die Klemmregel selbst - der einzige Ort, an dem der Unterschied der beiden
 * Griffzahlen ueberhaupt vorkommt.
 *
 * ZWEI GRIFFE (Video): Beide Werte sind POSITIONEN in der Quelle; beide werden in
 * [untergrenze, obergrenze] geklemmt, also in [0, Quelllaenge].
 *
 * EIN GRIFF (Segment): Es gibt keine Quelle, in der man sich positionieren
 * koennte - der Bereich begrenzt die LAENGE. `anfang` ist deshalb fest 0 (und wird
 * NICHT in den Bereich geklemmt; das machte aus einem Anfang bei 0 die Untergrenze
 * des Dauerbereichs und verschoebe die Laenge um genau diesen Betrag), und
 * ausschliesslich `ende` traegt die Laenge und wird geklemmt.
 *
 * `null` heisst: mindestens ein Wert war nicht endlich.
 */
function klemmePaar(
  griffe: 1 | 2,
  untergrenze: number,
  obergrenze: number,
  anfang: number,
  ende: number,
): { anfang: number; ende: number } | null {
  const geklemmtesEnde = klemme(ende, untergrenze, obergrenze)
  if (geklemmtesEnde === null) return null

  if (griffe === 1) {
    // Auch bei einem Griff muss `anfang` endlich sein - sonst waere die
    // `effektiveDauer` NaN. Geklemmt wird er nicht, festgesetzt schon.
    if (typeof anfang !== 'number' || !Number.isFinite(anfang)) return null
    return { anfang: 0, ende: geklemmtesEnde }
  }

  const geklemmterAnfang = klemme(anfang, untergrenze, obergrenze)
  if (geklemmterAnfang === null) return null
  return { anfang: geklemmterAnfang, ende: geklemmtesEnde }
}

/** Begrenzt ein gezogenes Griffpaar auf das Modell. Rein rechnend, kein IPC. */
export function begrenze(
  modell: ReglerModell,
  anfang: number,
  ende: number,
): { anfang: number; ende: number } {
  // KLEMMEN, NICHT ABLEHNEN. „Zieht der Nutzer über die Grenze hinaus, wird der Wert
  // auf die Grenze gesetzt (kein Sprung, keine Fehlermeldung)." Das ist reines
  // Bedienverhalten; die fachliche Pruefung bleibt bei den Store-Operationen - „Der
  // Renderer ist nicht die Prüfstelle" (TK 9.1.1).
  //
  // Die Signatur kann nichts melden, sie gibt ein Paar zurueck. Ein unbrauchbares
  // Modell oder ein nicht endlicher Zug ergibt deshalb den Stand des Modells: die
  // letzte Position, die nachweislich gueltig war. Ein auf die Untergrenze gezogenes
  // NaN waere dagegen eine erfundene Nutzereingabe.
  const rueckfall = { anfang: modell.anfang, ende: modell.ende }

  const geklemmt = klemmePaar(
    modell.griffe,
    modell.untergrenze,
    modell.obergrenze,
    anfang,
    ende,
  )
  return geklemmt ?? rueckfall

  // KEINE Mindestdistanz der Griffe ueber `anfang < ende` hinaus, und kein Raster:
  // beides sind offene Punkte der Store-Operationen. `begrenze` darf `anfang ===
  // ende` liefern - `uebernehmeGrenzen` weist das ab, statt hier heimlich einen
  // Abstand zu erzwingen, der spaeter anders lauten koennte.
}

/** Übernimmt die neuen Grenzen – EIN Einstiegspunkt für alle Elementtypen. */
export async function uebernehmeGrenzen(
  element: Listenelement,
  anfang: number,
  ende: number,
): Promise<Ergebnis<Listenelement>> {
  const roh = element as unknown as RohesElement

  if (roh === null || roh === undefined || typeof roh !== 'object') {
    return fehler(
      'ungueltige_eingabe',
      `Das Listenelement ist kein Objekt, vorgefunden: ${String(roh)}.`,
    )
  }

  const elementId = lesId(roh)
  const art = roh.art

  if (art !== 'video' && art !== 'segment') {
    return fehler(
      'ungueltige_eingabe',
      `Das Listenelement ${elementId} hat die unbekannte Art ${JSON.stringify(art)}. ` +
        'Zulaessig sind ausschliesslich "video" und "segment".',
    )
  }

  if (typeof elementId !== 'string' || elementId.trim() === '') {
    // Dieselbe Grenze, die die Nutzlast-Pruefung des ipc-gateway zieht. Zwei
    // verschiedene Grenzen an derselben Naht waeren die Sorte Abweichung, die erst
    // beim Kunden auffaellt.
    return fehler('ungueltige_eingabe', 'uebernehmeGrenzen braucht ein Element mit einer id.')
  }

  // ENDLICH - VOR JEDEM VERGLEICH. Jeder Vergleich mit NaN ist falsch, auch
  // `NaN >= x`; die Pruefung `anfang >= ende` weiter unten wuerde NaN also
  // stillschweigend durchwinken, und in der project.json stuende danach `null`
  // (JSON kennt kein NaN). Ein leeres Zahlenfeld wird schnell zu NaN.
  if (
    typeof anfang !== 'number' ||
    !Number.isFinite(anfang) ||
    typeof ende !== 'number' ||
    !Number.isFinite(ende)
  ) {
    return fehler(
      'ungueltige_eingabe',
      `Anfang und Ende muessen endliche Sekundenwerte sein, vorgefunden: ` +
        `anfang = ${String(anfang)}, ende = ${String(ende)}.`,
    )
  }

  if (anfang >= ende) {
    return fehler(
      'ungueltige_eingabe',
      `Der Anfang (${String(anfang)} s) liegt nicht vor dem Ende (${String(ende)} s); ` +
        'ein Bereich ohne Laenge ist nicht darstellbar.',
    )
  }

  if (art !== 'video' && anfang !== 0) {
    // „Bei Segment ist `anfang` immer 0." Der Regler hat dort nur einen
    // Griff; ein Aufruf mit einem anderen Anfang ist ein Programmierfehler des
    // Aufrufers. Er wird ABGEWIESEN und nicht auf 0 zurechtgebogen: Zurechtbiegen
    // liesse eine Oberflaeche, die den Regler falsch bedient, dauerhaft
    // unauffaellig laufen - und die uebergebene Laenge waere eine andere als die
    // gezogene.
    return fehler(
      'ungueltige_eingabe',
      `Ein "segment"-Element hat nur einen Griff; der Anfang muss 0 sein, vorgefunden: ` +
        `${String(anfang)}.`,
    )
  }

  // KEIN Projekt geladen -> gar nicht erst fragen. Der Main haette keine Liste, in
  // der das Element staende, und die Sicht koennte das Ergebnis nirgends aufnehmen.
  // Dieselbe Vorpruefung wie in element-hinzufuegen.ts und element-entfernen.ts.
  const projekt = holeSicht().projekt
  if (projekt === null) {
    return fehler(
      'ungueltige_eingabe',
      'Es ist kein Projekt geladen, dessen Element bedient werden koennte.',
    )
  }

  // DER STAND VOR DEM ZIEHEN kommt aus der SICHT, nicht aus dem Argument. Das
  // Argument ist der Stand, den die Oberflaeche beim Aufbau des Reglers hatte; die
  // Sicht traegt den letzten bestaetigten - „optimistischen Schritt **rückgängig**
  // machen (letzter bestätigter Stand)" (TK 9.7.3). Nur wenn die Sicht das Element
  // nicht kennt, bleibt das Argument als einzige Auskunft.
  const vorher = projekt.liste.find((eintrag) => eintrag.id === elementId) ?? element

  // Ein NEUES Objekt; das vorhandene wird nicht umgeschrieben (Unveraenderlichkeits-
  // Invariante aus #121). Genau deshalb kann `vorher` als Rueckfallstand dienen -
  // er aendert sich nicht mit.
  //
  // Angefasst werden ausschliesslich die Felder, die zur Art gehoeren
  // (TK 9.11.3): beim Video die beiden Trim-Grenzen, beim Segment `dauer`.
  // Ein Video bekommt hier NIE eine `dauer` gesetzt und ein Segment NIE einen Trim -
  // beides waere eine Belegung, die die Tabelle ausschliesst.
  const neu: Listenelement =
    art === 'video'
      ? { ...element, trimStart: anfang, trimEnde: ende }
      : { ...element, dauer: ende - anfang }

  // Der Kanal kommt aus der Registry, nie als Textliteral: „`setzeTrim` |
  // `elementId`, `trimStart`, `trimEnde` → `Ergebnis<Listenelement>` (validiert
  // `0 ≤ start < ende ≤ Videodauer`)" (TK 9.5.2); `setzeDauer` nimmt dort
  // `elementId` und `dauer` und prueft den Dauerbereich fuer das Segment.
  // Die Nutzlastformen stehen in #76.
  //
  // DIE VERZWEIGUNG SITZT HIER UND NUR HIER. Bei einem Video wird NIE `setzeDauer`
  // gerufen (TK 9.11.3: die Dauer ergibt sich aus dem Trim), bei Bild und Segment
  // NIE `setzeTrim` - setze-dauer.ts weist ein Video ohnehin ab, aber ein Aufruf,
  // der planmaessig abgewiesen wird, ist kein Vertrag, sondern ein Zufall.
  const kanal = art === 'video' ? KANAELE.project.setzeTrim : KANAELE.project.setzeDauer
  const nutzlast =
    art === 'video'
      ? { elementId, trimStart: anfang, trimEnde: ende }
      : { elementId, dauer: ende - anfang }

  // OPTIMISTISCH: „Reorder/Trim/Dauer werden **lokal sofort** angezeigt, dann per
  // Instant-Op bestätigt; der zurückgegebene Stand wird abgeglichen (nie dauerhaft
  // driften)." (TK 9.7.3) Anwenden, Zuruecknehmen und Bestaetigen gehen als
  // Rueckrufe an #126 - die Entscheidung, WANN zurueckgenommen wird, faellt dort.
  //
  // `rufeAuf<Listenelement>` ohne zweiten Typparameter: Der Fehlercode reist zur
  // LAUFZEIT unveraendert durch (nichts hier fasst ihn an); enger machen kann die
  // Datei ihn nicht, weil die fachlichen Codes des project-store in src/main/**
  // liegen und im Renderer nicht importiert werden duerfen.
  const ergebnis = await fuehreOptimistischAus<Listenelement>(
    () => {
      gleicheElementAb(neu)
    },
    () => {
      gleicheElementAb(vorher)
    },
    () => rufeAuf<Listenelement>(kanal, nutzlast),
  )

  if (ergebnis.ok) {
    // DER ABGLEICH. Er gehoert ausdruecklich dem Aufrufer (#126) - und er ist
    // nicht ueberfluessig: Der Store kann den Wert anders ablegen, als er gezogen
    // wurde, und ab dann zeigte die Sicht dauerhaft etwas anderes als die Datei.
    // Uebernommen wird EXAKT das zurueckgegebene Element, ohne Mischen mit dem
    // optimistischen Stand.
    gleicheElementAb(ergebnis.wert)
  }
  // Bei `ok: false` passiert hier NICHTS: Das Zuruecknehmen hat #126 bereits
  // veranlasst, und der Code geht unveraendert an den Aufrufer - an den Codes
  // haengt echtes Verhalten in der Oberflaeche (TK 9.1.1).

  return ergebnis
}
