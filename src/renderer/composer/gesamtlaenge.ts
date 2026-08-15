// GENERIERT aus dem Signaturblock von Issue #127.
// [composer] Gesamtlänge der Wiedergabeliste und die 30-Minuten-Warnung
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
// GERUEST-PRUEFSUMME: 68094c5413f6187d
//
// ============================================================================
// EINE REGEL, ZWEI ORTE - UND DESHALB KEIN SPIELRAUM
// ============================================================================
// Diese Datei ist die eine Haelfte einer Zusage; die andere liegt im
// `render-service` (src/main/render-service/frames.ts, #174). Hier entsteht die
// Zahl, die der Nutzer VOR dem Rendern sieht; dort entsteht die Laenge, die die
// Datei WIRKLICH bekommt und gegen die sie am Ende mit ffprobe verifiziert wird.
//
// „**Gesamtlänge = frame-gerundete Summe** der Elementdauern - **dieselbe**
// Rundungsregel wie `render-service` (9.2.6), sonst weicht die angezeigte Laenge
// von der echten Ausgabedatei ab. Die 30-Minuten-Warnung (5.3) haengt daran."
// (TK 9.7.4)
//
// WARUM DIE REGEL HIER EIN ZWEITES MAL STEHT UND NICHT IMPORTIERT WIRD: Der
// Renderer darf nichts aus `src/main/**` importieren (Prozess-Trennung, TK 2 -
// der Renderer-Typecheck laeuft mit "types": [] und kaeme an Main-Code ohnehin
// nicht heran). Eine geteilte Fassung in `src/shared/` sieht kein Issue vor. Die
// Doppelung ist also gewollt und gemeldet - sie ist nur so lange harmlos, wie
// BEIDE Seiten woertlich `Math.round(sekunden * RENDER_PROFILE.fps)` je Grenze
// schreiben. IEEE-754 ist deterministisch: gleiche Formel, gleiche Eingabe,
// bitgleiches Ergebnis. Jede „Verbesserung" auf nur einer Seite macht die Seiten
// unterschiedlich, und der Unterschied faellt erst am Fernseher auf.
//
// DIE REIHENFOLGE DER RECHENSCHRITTE IST TEIL DER REGEL. Erst multiplizieren,
// dann runden, dann subtrahieren:
//     zuFrames(trimEnde) - zuFrames(trimStart)     RICHTIG
//     zuFrames(trimEnde - trimStart)               FALSCH
// Nachgerechnet bei fps aus dem Profil mit trimStart = 2,51 und trimEnde = 10,49:
// einzeln 315 - 75 = 240 Frames, gemeinsam round(239,4) = 239 Frames. Ein Frame
// Unterschied je Element - unsichtbar bei einem, mehrere Sekunden bei hundert.
//
// UND VOR ALLEM NICHT: die Dauern der Band-Abschnitte. „Die Elementdauer bestimmt
// **allein das Video** (Trim). Das Band verlaengert oder verkuerzt sie **nie**."
// (TK 9.2.8) Ein Werbeband laeuft PARALLEL zum Video. Wer seine Abschnitts-Dauern
// mitsummiert, zeigt eine Laenge bis zum Doppelten der echten an. Das Feld wird in
// dieser Datei deshalb nirgends gelesen - auch nicht erwaehnt (Grep-Probe im Test).
//
// WAS HIER NICHT PASSIERT: kein IPC, kein Zustand, kein Abonnement, kein
// Dateisystem. Die Liste kommt als Argument herein (der Aufrufer holt sie aus
// `holeSicht()`, #121), heraus kommen Zahlen. Zweimal derselbe Eingang ergibt
// zweimal denselben Ausgang.

import type { Listenelement } from '../../shared/contracts/project'
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { RENDER_PROFILE } from '../../shared/contracts/render-profile'

export interface Gesamtlaenge {
  frames: number        // Summe der frame-gerundeten Elementdauern, in Frames
  sekunden: number      // frames / RENDER_PROFILE.fps – exaktes Vielfaches von 1/fps
  warnung: boolean      // true, sobald WARNSCHWELLE_SEKUNDEN überschritten ist
}

/**
 * Sekunden auf das Frame-Raster des Ausgabe-Profils runden.
 *
 * DIE EINZIGE STELLE IN DIESER DATEI, AN DER MULTIPLIZIERT UND GERUNDET WIRD.
 * Eine zweite Multiplikation waere eine zweite Rundungsstelle, und genau die
 * verbietet der Vertrag: „Dieselbe Rundungsregel gilt ausnahmslos (kein `floor`
 * an einer, `round` an anderer Stelle) - sonst weicht die Dauer um einen Frame
 * ab." (TK 9.2.6)
 *
 * Die Bildrate ist ein DATENWERT aus dem Profil (#18), keine Zahl im Code:
 * „| Bildrate | **30 fps, CFR** (konstant) | Voraussetzung für die Frame-Rundung
 * (9.2.6) |" (TK 9.2.4). Nicht exportiert - der `composer` hat genau diese eine
 * Rechenstelle, und ein zweiter Aufrufer waere ein zweiter Rechenweg.
 *
 * Prueft nichts: `NaN` hinein, `NaN` heraus. Die Pruefung passiert einmal, in
 * `frameDauer`.
 */
function zuFrames(sekunden: number): number {
  return Math.round(sekunden * RENDER_PROFILE.fps)
}

/**
 * Frame-Anzahl zurueck in Sekunden.
 *
 * GETEILT, NICHT MIT DEM KEHRWERT MULTIPLIZIERT. `frames * (1 / fps)` ist NICHT
 * dasselbe - der Kehrwert ist selbst schon gerundet, und der Fehler wird beim
 * Multiplizieren mitgenommen (nachgemessen: 23/30 = 0.7666666666666667 gegen
 * 23 * (1/30) = 0.7666666666666666). Der `render-service` teilt ebenfalls; nur so
 * liefern beide Seiten dieselbe Gleitkommazahl.
 */
function zuSekunden(frames: number): number {
  return frames / RENDER_PROFILE.fps
}

/** Einheitlicher Fehlerausgang; die `meldung` nennt IMMER die `id` des Elements. */
function ungueltigesElement(id: string, meldung: string): Ergebnis<never> {
  return { ok: false, fehler: { code: 'ungueltige_eingabe', meldung: `Element ${id}: ${meldung}` } }
}

/**
 * Die Element-ID fuer die Meldung, defensiv gelesen.
 *
 * Eine fehlende ID ist KEIN eigener Fehlerfall - die Fehlerpfade des Issues kennen
 * keinen, und ein zusaetzlicher wuerde die eigentliche Ursache verdecken.
 * `String(...)` liefert dann „undefined": eine wahrheitsgemaesse Angabe.
 */
function elementId(element: Listenelement): string {
  const roh: unknown = (element as { id?: unknown }).id
  return typeof roh === 'string' ? roh : String(roh)
}

/** Frames eines einzelnen Elements – dieselbe Rundungsregel wie der render-service (TK 9.2.6). */
export function frameDauer(element: Listenelement): Ergebnis<number> {
  // Ueber `unknown` gefuehrt: `art` ist statisch auf drei Werte verengt, die
  // Fehlerpfade des Issues verlangen aber ausdruecklich einen Zweig fuer „`art`
  // ist keiner der drei Werte". Ein Projekt aus einer aelteren Fassung oder einer
  // von Hand bearbeiteten JSON-Datei kann alles Moegliche tragen.
  const roh = element as unknown as
    | { art?: unknown; dauer?: unknown; trimStart?: unknown; trimEnde?: unknown }
    | null
    | undefined

  // ZUERST, VOR JEDEM FELDZUGRIFF. Ohne diese Schranke wirft schon das Auslesen
  // der `id` bei `null`/`undefined` eine TypeError - und eine Funktion, deren
  // Vertrag `Ergebnis<number>` lautet, darf nicht werfen: Der Aufrufer prueft
  // `ok`, er faengt nichts. Ein Loch in der Liste (`[a, , b]`) oder ein aus einer
  // aelteren Projektdatei gelesenes `null` haette so die ganze Anzeige zum
  // Absturz gebracht statt zu einer Meldung gefuehrt. Fachlich ist das derselbe
  // Fall wie eine unbekannte `art` (Fehlertabelle des Issues) - deshalb derselbe
  // Code und keine neue Fehlerart.
  if (roh === null || roh === undefined || typeof roh !== 'object') {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: `Ein Element der Wiedergabeliste ist kein Objekt, vorgefunden: ${String(roh)}.`,
      },
    }
  }

  const id = elementId(element)
  const art = roh.art

  if (art === 'video') {
    // NUR die beiden Trim-Grenzen. „`video` | `Asset` (typ `video`) | `null` – die
    // Dauer ergibt sich aus dem Trim | gesetzt | erlaubt" (TK 9.11.3): bei einem
    // Video wird `dauer` NIE gelesen, auch wenn dort etwas steht.
    const start = roh.trimStart
    const ende = roh.trimEnde

    if (
      typeof start !== 'number' ||
      !Number.isFinite(start) ||
      typeof ende !== 'number' ||
      !Number.isFinite(ende)
    ) {
      // Eine Meldung fuer beide Grenzen: Wer nur die erste schuldige nennt,
      // schickt den Nutzer bei zwei kaputten Werten zweimal los.
      return ungueltigesElement(
        id,
        `Die Trim-Grenzen eines Videos muessen endliche Zahlen sein, vorgefunden: ` +
          `trimStart = ${String(start)}, trimEnde = ${String(ende)}.`,
      )
    }

    if (start < 0) {
      // NICHT in der Fehlertabelle des Issues, aber im `render-service` (#174,
      // `trimFrames`) seit M6 gebaut - und Regel: der gebaute Code gewinnt. Ohne
      // diesen Zweig zeigte die Oberflaeche fuer ein Element mit negativem
      // Anfang eine Laenge an, bei der der Render anschliessend abbricht. Der
      // Store laesst so einen Wert nicht zu (setze-trim.ts prueft `trimStart < 0`);
      // erreichbar ist der Fall nur ueber eine von Hand veraenderte Projektdatei.
      return ungueltigesElement(
        id,
        `Der Trim-Anfang darf nicht negativ sein, vorgefunden: ${String(start)}.`,
      )
    }

    if (ende <= start) {
      return ungueltigesElement(
        id,
        `Das Trim-Ende muss nach dem Trim-Anfang liegen, vorgefunden: ` +
          `trimStart = ${String(start)}, trimEnde = ${String(ende)}.`,
      )
    }

    // HIER SITZT DIE GANZE INVARIANTE: zwei EINZELNE Rundungen, danach die
    // Differenz. „Beide Grenzen werden auf **dasselbe** 30-fps-Raster gerundet:
    // `startFrame = round(trimStart × 30)`, `endFrame = round(trimEnde × 30)`;
    // behalten werden die Frames `[startFrame, endFrame)`. Die effektive
    // Elementdauer ist damit `(endFrame − startFrame) / 30` – **nicht** die rohe
    // Sekundendifferenz." (TK 9.2.6)
    const startFrame = zuFrames(start)
    const endFrame = zuFrames(ende)

    if (startFrame >= endFrame) {
      // Die rohen Sekunden gehen auseinander, das Frame-Raster nicht: ein
      // Ausschnitt kuerzer als ein Frame. Kein Aufrunden (das erfaende Bilder,
      // die der Nutzer nicht ausgewaehlt hat) und kein Durchwinken - ein Element
      // ohne einen einzigen Frame kann im Render nicht entstehen.
      return ungueltigesElement(
        id,
        `Der Ausschnitt [${String(start)}, ${String(ende)}) ergibt nach der Rundung auf das ` +
          `Frame-Raster keine Bilder. Die Mindestdauer ist ein Frame, das sind ` +
          `${String(zuSekunden(1))} Sekunden.`,
      )
    }

    return { ok: true, wert: endFrame - startFrame }
  }

  if (art === 'bild' || art === 'segment') {
    // „**Standbild → Clip:** `"segment"`- und `"bild"`-Items werden als Standbild
    // über ihre `dauer` bei 30 fps im Profil ausgehalten; harter Schnitt an den
    // Grenzen." (TK 9.2.6) - ohne Zu- oder Abschlag fuer Uebergaenge, es gibt
    // keine. `trimStart`/`trimEnde` werden hier NIE gelesen (TK 9.11.3).
    const dauer = roh.dauer

    if (typeof dauer !== 'number' || !Number.isFinite(dauer) || dauer <= 0) {
      return ungueltigesElement(
        id,
        `Die Dauer eines "${art}"-Elements muss eine endliche Zahl groesser als 0 sein, ` +
          `vorgefunden: ${String(dauer)}.`,
      )
    }

    const frames = zuFrames(dauer)
    if (frames < 1) {
      return ungueltigesElement(
        id,
        `Die Dauer ${String(dauer)} s rundet auf 0 Frames. Die Mindestdauer ist ein Frame, ` +
          `das sind ${String(zuSekunden(1))} Sekunden.`,
      )
    }

    return { ok: true, wert: frames }
  }

  return ungueltigesElement(
    id,
    `Unbekannte Elementart ${JSON.stringify(art)}. ` +
      'Zulaessig sind ausschliesslich "video", "bild" und "segment".',
  )
}

/** Summe über die ganze Liste. Eine leere Liste ergibt 0 Frames und ist KEIN Fehler. */
export function berechneGesamtlaenge(liste: Listenelement[]): Ergebnis<Gesamtlaenge> {
  if (!Array.isArray(liste as unknown)) {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: `Die Wiedergabeliste muss ein Array sein, vorgefunden: ${String(liste)}.`,
      },
    }
  }

  // SUMMIERT FRAMES, NICHT SEKUNDEN. Frames sind ganze Zahlen; ihre Summe bleibt
  // bis 2^53 exakt. Eine Summe roher Sekunden haette beides: den Rundungsfehler je
  // Grenze UND einen Additionsfehler, der von der Reihenfolge abhinge.
  let frames = 0
  for (const element of liste) {
    const einzeln = frameDauer(element)
    // KEIN Ueberspringen: Laesst sich die Dauer eines Elements nicht bestimmen,
    // scheitert die GESAMTE Rechnung. Eine „ungefaehre" Laenge waere eine zu kurze
    // Zahl, die stillschweigend als Tatsache dastuende.
    if (!einzeln.ok) return einzeln
    frames += einzeln.wert
  }

  // GENAU EINE Division, ganz am Schluss, auf der fertigen Frame-Summe - deshalb
  // ist `sekunden` immer ein exaktes Vielfaches von 1/fps.
  const sekunden = zuSekunden(frames)

  return {
    ok: true,
    // „ueberschritten" heisst ECHT groesser: genau die Schwelle ist noch keine
    // Ueberschreitung. Die Warnung blockiert nichts (TK 9.7.4 nennt als
    // blockierenden Grund ausschliesslich kaputte Stellen).
    wert: { frames, sekunden, warnung: sekunden > WARNSCHWELLE_SEKUNDEN },
  }
}

// Reine Anzeige-Umrechnung. Bewusst KEINE Ableitung aus dem Ausgabe-Profil: Eine
// Minute hat sechzig Sekunden, gleich mit welcher Bildrate gerendert wird.
const SEKUNDEN_JE_MINUTE = 60
const MINUTEN_JE_STUNDE = 60
const SEKUNDEN_JE_STUNDE = SEKUNDEN_JE_MINUTE * MINUTEN_JE_STUNDE

/** Anzeigeform der Länge: "M:SS" unter einer Stunde, sonst "H:MM:SS". */
export function formatiereLaenge(sekunden: number): string {
  // ABGERUNDET (`Math.floor`), damit die angezeigte Zahl nie groesser wirkt als
  // die tatsaechliche Laenge. Ein unbrauchbarer Eingang wird als 0 dargestellt -
  // die Signatur gibt einen `string` zurueck und kann nicht melden; „0:00" ist
  // die Form, die am wenigsten behauptet.
  const ganz =
    typeof sekunden === 'number' && Number.isFinite(sekunden) && sekunden > 0
      ? Math.floor(sekunden)
      : 0

  const s = ganz % SEKUNDEN_JE_MINUTE
  const m = Math.floor(ganz / SEKUNDEN_JE_MINUTE) % MINUTEN_JE_STUNDE
  const h = Math.floor(ganz / SEKUNDEN_JE_STUNDE)

  const ss = String(s).padStart(2, '0')
  if (h === 0) return `${String(m)}:${ss}`
  return `${String(h)}:${String(m).padStart(2, '0')}:${ss}`
}

/** Schwelle der Warnung aus TK 9.7 („Gesamtlänge + 30-Minuten-Warnung anzeigen"). */
export const WARNSCHWELLE_SEKUNDEN = 1800
