// GENERIERT aus dem Signaturblock von Issue #174.
// [render-service] Frame-Rundung und Gesamtdauer berechnen
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
// GERUEST-PRUEFSUMME: 7d8f9753bea8e3f0
//
// ============================================================================
// EINE REGEL, ZWEI ORTE - UND DESHALB KEIN SPIELRAUM
// ============================================================================
// Diese Datei ist die zweite Haelfte einer Zusage. Die erste liegt im `composer`
// (#127): Er zeigt dem Nutzer VOR dem Rendern die Gesamtlaenge an und warnt ab
// dreissig Minuten. Diese Datei bestimmt, wie lang die Datei WIRKLICH wird.
// Beide muessen dieselbe Zahl liefern - nicht ungefaehr. Am Ende wird die fertige
// Datei mit `ffprobe` gegen genau diese `gesamtdauer` verifiziert (TK 9.2.6).
//
// „**`gesamtdauer` zaehlt gerundete Frame-Dauern:** Die im `RenderResult`
// gemeldete `gesamtdauer` summiert die **gerundeten** Elementdauern (Frame-Anzahl
// / 30), nicht die rohen Trim-Sekunden - sonst driften die angezeigte
// Gesamtlaenge (5.3, 30-Minuten-Warnung) und die tatsaechliche Laenge der
// Ausgabedatei auseinander." (TK 9.2.6)
//
// DIE REIHENFOLGE DER RECHENSCHRITTE IST TEIL DER REGEL. Erst multiplizieren,
// dann runden, dann subtrahieren:
//     zuFrames(trimEnde) - zuFrames(trimStart)     RICHTIG
//     zuFrames(trimEnde - trimStart)               FALSCH
// Die beiden sind NICHT gleich. Nachgerechnet bei 30 fps mit trimStart = 2,51
// und trimEnde = 10,49: einzeln 315 - 75 = 240 Frames, gemeinsam
// round(239,4) = 239 Frames. Ein Frame Unterschied je Element.
//
// WARUM EIN EINZIGER FRAME ZAEHLT: Die Verifikation der fertigen Datei arbeitet
// mit einer FESTEN Toleranz von 0,5 s - nicht mit einem Prozentsatz, weil ein
// relatives Mass bei einem 30-Minuten-Reel ein vollstaendig fehlendes Segment
// durchwinken wuerde. Ein Frame sind 1/30 s; ab dem SECHZEHNTEN Element mit
// gemeinsamer Rundung ist die Toleranz gerissen (nachgerechnet: 16/30 s =
// 0,533 s). Bei zwanzig Elementen sind es 0,667 s. Der Lauf scheitert dann mit
// `ffmpeg_fehler`, obwohl ffmpeg alles richtig gemacht hat - und der Nutzer
// bekaeme „Wiederholen" empfohlen fuer einen Fehler, der bei jeder Wiederholung
// erneut auftritt.
//
// KEIN EPSILON, KEINE TOLERANZ, KEINE „GERECHTERE" RUNDUNG. Der `composer`
// rechnet mit derselben Formel auf denselben Gleitkommazahlen. Solange BEIDE
// Seiten exakt `Math.round(x * fps)` schreiben, liefern sie bitgleich dasselbe
// Ergebnis - IEEE-754 ist deterministisch. Jede Verbesserung auf nur einer Seite
// macht die beiden Seiten unterschiedlich, und der Unterschied faellt erst am
// fertigen Video auf. Genau davor warnt TK 9.2.6 mit „kein `floor` an einer,
// `round` an anderer Stelle". Wem hier etwas numerisch Eleganteres einfaellt:
// Das ist eine Vertragsaenderung an ZWEI Stellen gleichzeitig - melden, nicht
// abweichen.
//
// WAS HIER NICHT PASSIERT: keine Quelldauer-Pruefung (dafuer braeuchte es
// `ffprobe`; sie gehoert in die Normalisierung, #177), keine Dauer-Grenzen
// 10-45 s (die stehen in `DAUER_BEREICH`, #21, und werden bei der Pruefung der
// Anfrage angewandt, #173), kein Dateisystem, kein ffmpeg, kein Zustand und kein
// Zwischenspeicher. Zweimal derselbe Eingang ergibt zweimal denselben Ausgang.
//
// UND VOR ALLEM NICHT: die Dauern der Band-Abschnitte. „Die Elementdauer
// bestimmt **allein das Video** (Trim). Das Band verlaengert oder verkuerzt sie
// **nie**." (TK 9.2.8) Ein Band laeuft PARALLEL zum Video. Wer
// `einblendung.abschnitte[].dauer` mitsummiert, meldet eine Gesamtdauer bis zum
// Doppelten der echten - und die Verifikation scheitert dann bei JEDEM Lauf mit
// einem Band.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { RENDER_PROFILE } from '../../shared/contracts/render-profile'
import type { RenderItem } from '../../shared/contracts/render-request'
import type { ElementFehlerdaten, RenderFehlercode } from './fehlercodes'

/** Frame-Grenzen eines Video-Ausschnitts. Behalten werden die Frames [startFrame, endFrame). */
export interface TrimFrames {
  startFrame: number
  endFrame: number
  frames: number        // endFrame - startFrame, immer >= 1
}

/**
 * Sekunden auf das Frame-Raster des Ausgabe-Profils runden: round(sekunden × fps).
 *
 * DIE EINZIGE STELLE IM MODUL, AN DER MULTIPLIZIERT UND GERUNDET WIRD. Alle
 * uebrigen Funktionen dieser Datei rufen sie auf, statt selbst zu rechnen: Eine
 * zweite Multiplikation waere eine zweite Rundungsstelle, und genau die verbietet
 * der Vertrag. Sie ist auch deshalb OEFFENTLICH, weil die Bandspur (#168) ihre
 * Abschnitts-Dauern mit DIESER Funktion rundet - „Abschnitts-Dauern unterliegen
 * **derselben Frame-Rundung** wie alles andere (30 fps, 9.2.6) - sonst driftet
 * das Band gegen das Video." (TK 9.2.8)
 *
 * PRUEFT NICHTS und traegt KEINE Ergebnis-Huelle (ENTSCHIEDEN 4): Sie ist eine
 * reine Umrechnung. Eine Huelle um eine Multiplikation zwingt jeden Aufrufer zu
 * einer Fallunterscheidung, die es nicht gibt. Die Pruefung der Eingaben passiert
 * EINMAL, in `trimFrames` bzw. `frameDauer`. Wer `NaN` hineingibt, bekommt `NaN`
 * heraus - das ist gewollt und wird oben abgefangen.
 *
 * `Math.round` rundet die Haelfte AUFWAERTS (round(0,5) = 1). Alle Eingaben
 * dieser Datei sind >= 0, damit ist das zugleich „von der Null weg"; ein
 * Vorzeichenfall entsteht nicht.
 */
export function zuFrames(sekunden: number): number {
  // Die Bildrate ist ein DATENWERT aus dem Profil (#18), keine Zahl im Code:
  // „| Bildrate | **30 fps, CFR** (konstant) | Voraussetzung fuer die
  // Frame-Rundung (9.2.6) |" (TK 9.2.4). Eine spaetere Profil-Aenderung muss ein
  // Datenwert bleiben, kein Schnittstellenbruch.
  return Math.round(sekunden * RENDER_PROFILE.fps)
}

/**
 * Frame-Anzahl zurück in Sekunden: frames / fps.
 *
 * GETEILT, NICHT MIT DEM KEHRWERT MULTIPLIZIERT. `frames * (1 / fps)` ist NICHT
 * dasselbe: nachgemessen weichen 88 der ersten 1001 Frame-Zahlen ab, die erste
 * schon bei 23 (23/30 = 0,7666666666666667, 23 × (1/30) = 0,7666666666666666).
 * Der Kehrwert ist selbst schon gerundet, und dieser Fehler wird beim
 * Multiplizieren mitverstaerkt. Prueft ebenfalls nicht (ENTSCHIEDEN 4).
 */
export function zuSekunden(frames: number): number {
  return frames / RENDER_PROFILE.fps
}

/**
 * Einheitlicher Fehlerausgang fuer einen Mangel AM ELEMENT.
 *
 * `daten` ist optional, weil `trimFrames` die Element-ID nicht kennt und sie dort
 * weggelassen wird; der Aufrufer ergaenzt sie (TK 9.2.3).
 */
function ungueltigesElement(
  meldung: string,
  daten?: ElementFehlerdaten,
): Ergebnis<never, RenderFehlercode> {
  return daten === undefined
    ? { ok: false, fehler: { code: 'ungueltiges_element', meldung } }
    : { ok: false, fehler: { code: 'ungueltiges_element', meldung, daten } }
}

/**
 * Fehlerausgang fuer einen Mangel OHNE Elementbezug - der gehoert nach TK 9.2.3
 * der ANFRAGE: „Die **Anfrage** verletzt den Vertrag, unabhaengig von einzelnen
 * Elementen: unzulaessiger `ausgabeName` (9.2.6), leere Elementliste, unbekannte
 * `art`, fehlende `projektId`."
 *
 * Deshalb hier derselbe Code wie bei der Pruefung der Anfrage (#173) - damit
 * dieselbe Situation nicht zwei Codes hat. Setzt NIE `daten`: Es gibt kein
 * Element, das benannt werden koennte.
 */
function ungueltigeEingabe(meldung: string): Ergebnis<never, RenderFehlercode> {
  return { ok: false, fehler: { code: 'ungueltige_eingabe', meldung } }
}

/**
 * Die Element-ID fuer `daten`, defensiv gelesen.
 *
 * Warum nicht einfach `element.id`: Die Nutzlast kommt ueber die IPC-Grenze, dort
 * ist der Typ geloescht und nur noch eine Zusage - „Der Main validiert jede
 * eingehende Nutzlast - er vertraut dem Renderer nicht." (TK 9.1.1 Punkt 6).
 * Eine fehlende ID ist hier trotzdem KEIN eigener Fehlerfall: Die Fehlerpfade des
 * Issues kennen keinen, und ein zusaetzlicher wuerde die eigentliche Ursache
 * verdecken. `String(...)` liefert dann „undefined" - eine wahrheitsgemaesse
 * Angabe, die den Typ `ElementFehlerdaten` einhaelt.
 */
function elementId(element: RenderItem): string {
  const roh: unknown = (element as { id?: unknown }).id
  return typeof roh === 'string' ? roh : String(roh)
}

/**
 * Die beiden Trim-Grenzen eines Video-Elements auf dasselbe Raster runden.
 *
 * „**Video-Trim ist framegenau (30 fps):** Bei `"video"`-Items wird der Ausschnitt
 * `[trimStart, trimEnde)` **framegenau** geschnitten […] Beide Grenzen werden auf
 * **dasselbe** 30-fps-Raster gerundet: `startFrame = round(trimStart × 30)`,
 * `endFrame = round(trimEnde × 30)`; behalten werden die Frames
 * `[startFrame, endFrame)`. Die effektive Elementdauer ist damit
 * `(endFrame − startFrame) / 30` - **nicht** die rohe Sekundendifferenz."
 * (TK 9.2.6)
 *
 * Meldet OHNE `daten`: Diese Funktion kennt die Element-ID nicht. `frameDauer`
 * ergaenzt sie.
 */
export function trimFrames(
  trimStart: number,
  trimEnde: number,
): Ergebnis<TrimFrames, RenderFehlercode> {
  // Ueber `unknown` gefuehrt, weil der statische Typ `number` ueber die
  // IPC-Grenze hinweg nur eine Zusage ist, keine Schranke.
  const start: unknown = trimStart
  const ende: unknown = trimEnde

  if (
    typeof start !== 'number' ||
    !Number.isFinite(start) ||
    typeof ende !== 'number' ||
    !Number.isFinite(ende)
  ) {
    // Eine Meldung fuer beide Werte: Wer nur den ersten schuldigen Wert nennt,
    // schickt den Nutzer bei zwei kaputten Grenzen zweimal los.
    return ungueltigesElement(
      `Die Trim-Grenzen muessen endliche Zahlen sein, vorgefunden: ` +
        `trimStart = ${String(start)}, trimEnde = ${String(ende)}.`,
    )
  }

  if (start < 0) {
    return ungueltigesElement(
      `Der Trim-Anfang darf nicht negativ sein, vorgefunden: ${String(start)}.`,
    )
  }

  if (ende <= start) {
    return ungueltigesElement(
      `Das Trim-Ende muss nach dem Trim-Anfang liegen, vorgefunden: ` +
        `trimStart = ${String(start)}, trimEnde = ${String(ende)}.`,
    )
  }

  // HIER SITZT DIE GANZE INVARIANTE: zwei EINZELNE Rundungen, danach die
  // Differenz. NIEMALS zuFrames(ende - start) - s. Kopf dieser Datei.
  const startFrame = zuFrames(start)
  const endFrame = zuFrames(ende)

  if (startFrame >= endFrame) {
    // Die rohen Sekunden gehen auseinander, das Frame-Raster nicht: ein
    // Ausschnitt kuerzer als ein Frame. KEIN Aufrunden auf einen Frame - das
    // erfaende Bildmaterial, das der Nutzer nicht ausgewaehlt hat. Und kein
    // Durchwinken: Ein Segment ohne Frames erzeugt eine LEERE Eingabedatei fuer
    // den concat-Schritt, und `-c copy` bricht daran NICHT ab - es entstuende
    // eine Datei mit einem Sprung darin (ENTSCHIEDEN 7).
    return ungueltigesElement(
      `Der Ausschnitt [${String(start)}, ${String(ende)}) ist kuerzer als ein Frame ` +
        `und ergibt nach der Rundung auf das Frame-Raster keine Bilder. ` +
        `Die Mindestdauer ist ein Frame, das sind ${String(zuSekunden(1))} Sekunden.`,
    )
  }

  return {
    ok: true,
    wert: { startFrame, endFrame, frames: endFrame - startFrame },
  }
}

/**
 * Frame-Dauer genau eines Elements: bei `video` aus dem Trim, bei `segment` aus `dauer`.
 *
 * Bei `video` werden AUSSCHLIESSLICH `trimStart` und `trimEnde` gelesen - ein
 * `video`-Item hat kein Feld `dauer`, und ein untergeschobenes wird nicht
 * beachtet. Bei `segment` ausschliesslich `dauer`: „**Standbild → Clip:**
 * `"segment"`-Items werden als Standbild ueber ihre `dauer` bei 30 fps im Profil
 * ausgehalten; harter Schnitt an den Grenzen." (TK 9.2.6, sinngemaess nach der
 * Streichung der Elementart `bild`, TK 9.11.3) - ohne Zu- oder Abschlag fuer
 * Uebergaenge, es gibt keine.
 *
 * `einblendung` wird NICHT angefasst. Ein Element mit Band ergibt dieselbe Zahl
 * wie dasselbe Element ohne.
 */
export function frameDauer(element: RenderItem): Ergebnis<number, RenderFehlercode> {
  // Als einzige Funktion dieser Datei liest sie Felder eines FREMDEN Objekts.
  // Ein exotischer Eingang (ein werfender Getter, ein Proxy) darf die
  // IPC-Grenze nicht als Ausnahme erreichen: „Niemals `throw`" (TK 9.1.1).
  try {
    const roh = element as unknown as
      | { art?: unknown; trimStart?: unknown; trimEnde?: unknown; dauer?: unknown }
      | null
      | undefined

    if (roh === null || roh === undefined || typeof roh !== 'object') {
      return ungueltigeEingabe(
        `Ein Element des Auftrags ist kein Objekt, vorgefunden: ${String(roh)}.`,
      )
    }

    const art = roh.art

    if (art === 'video') {
      // NUR die beiden Trim-Grenzen. `dauer` gibt es bei `video` nicht, und die
      // Abschnitts-Dauern der Einblendung gehen in keine Summe dieser Datei ein.
      const grenzen = trimFrames(roh.trimStart as number, roh.trimEnde as number)
      if (!grenzen.ok) {
        // Code und Meldung bleiben, wie `trimFrames` sie vergeben hat; ergaenzt
        // wird allein der Elementbezug, den jene Funktion nicht kennt.
        return {
          ok: false,
          fehler: { ...grenzen.fehler, daten: { elementId: elementId(element) } },
        }
      }
      return { ok: true, wert: grenzen.wert.frames }
    }

    if (art === 'segment') {
      const daten: ElementFehlerdaten = { elementId: elementId(element) }
      const dauer = roh.dauer

      if (typeof dauer !== 'number' || !Number.isFinite(dauer) || dauer <= 0) {
        return ungueltigesElement(
          'Die Dauer eines "segment"-Elements muss eine endliche Zahl groesser als 0 sein, ' +
            `vorgefunden: ${String(dauer)}.`,
          daten,
        )
      }

      const frames = zuFrames(dauer)
      if (frames < 1) {
        // Dieselbe Begruendung wie beim zu kurzen Ausschnitt oben: ein Standbild
        // ohne Frames ergibt eine leere Eingabedatei, an der `-c copy` nicht
        // abbricht (ENTSCHIEDEN 7).
        return ungueltigesElement(
          `Die Dauer ${String(dauer)} s rundet auf 0 Frames. Die Mindestdauer ist ein Frame, ` +
            `das sind ${String(zuSekunden(1))} Sekunden.`,
          daten,
        )
      }

      return { ok: true, wert: frames }
    }

    // Unbekannte `art`: ein Mangel OHNE Elementbezug und damit ein Mangel der
    // ANFRAGE (TK 9.2.3) - deshalb `ungueltige_eingabe` und KEIN `daten`. In der
    // Praxis erreicht dieser Fall diese Datei nie, weil die Anfrage vor dem
    // ersten Rechnen geprueft wird (#173); der Zweig ist die Absicherung, kein
    // Regelweg.
    return ungueltigeEingabe(
      `Unbekannte Elementart ${JSON.stringify(art)}. ` +
        'Zulaessig sind ausschliesslich "video" und "segment".',
    )
  } catch (ursache) {
    return {
      ok: false,
      fehler: {
        code: 'unbekannter_fehler',
        meldung: `Die Frame-Dauer eines Elements konnte nicht bestimmt werden: ${
          ursache instanceof Error ? ursache.message : String(ursache)
        }`,
      },
    }
  }
}

/**
 * Summe der frame-gerundeten Elementdauern, in Frames. Leere Liste ergibt 0.
 *
 * SUMMIERT FRAMES, NICHT SEKUNDEN. Frames sind ganze Zahlen; ihre Summe bleibt
 * bis 2^53 exakt, es gibt also keinen Additionsfehler, der sich aufschaukeln
 * koennte. Eine Summe roher Sekunden haette beides: den Rundungsfehler je Grenze
 * UND den Additionsfehler.
 *
 * BRICHT BEIM ERSTEN unstimmigen Element ab und meldet dessen `elementId` - sie
 * sammelt NICHT alle Fehler ein (ENTSCHIEDEN 6). Der gefuehrte Reparatur-Modus
 * (FA-19) fuehrt den Nutzer ohnehin „eins nach dem anderen" (TK 9.7.5), und
 * `RenderResult` hat genau EIN Feld `fehlerhaftesElementId`.
 *
 * Eine LEERE Liste ergibt 0 und ist hier KEIN Fehler (ENTSCHIEDEN 5): Dass ein
 * `RenderRequest` mindestens ein Element enthalten muss, ist eine Regel der
 * Anfrage und wird dort geprueft (#173). Diese Datei rechnet; sie beurteilt nicht
 * die Anfrage.
 */
export function gesamtFrames(elemente: readonly RenderItem[]): Ergebnis<number, RenderFehlercode> {
  // Ueber `unknown` gefuehrt, damit die Pruefung den deklarierten Typ nicht
  // verengt - `Array.isArray` sagt `x is any[]` zu, und der Nein-Zweig eines
  // `readonly RenderItem[]` liefe sonst auf `never` hinaus.
  if (!Array.isArray(elemente as unknown)) {
    // Kein Elementbezug moeglich -> Mangel der Anfrage (TK 9.2.3), s.
    // `ungueltigeEingabe`.
    return ungueltigeEingabe(
      `Die Elementliste des Auftrags muss ein Array sein, vorgefunden: ${String(elemente)}.`,
    )
  }

  let summe = 0
  // `for ... of` statt Index-Zugriff: Der Index brauchte unter
  // noUncheckedIndexedAccess eine Fallunterscheidung fuer `undefined`, die hier
  // nichts beitraegt - ein Loch im Array landet ohnehin in der Pruefung von
  // `frameDauer` und bekommt dort seinen Code.
  for (const element of elemente) {
    const frames = frameDauer(element)
    if (!frames.ok) return frames
    summe += frames.wert
  }

  return { ok: true, wert: summe }
}

/**
 * Dieselbe Summe in Sekunden – der Wert, der als `RenderResult.gesamtdauer` gemeldet wird.
 *
 * „**`gesamtdauer`** | Summe der (getrimmten) Elementdauern in Sekunden -
 * **framegerundet** gezaehlt (Frame-Anzahl / 30, s. 9.2.6)" (TK 9.2.3)
 *
 * GENAU EINE Division, ganz am Schluss, auf der bereits fertigen Frame-Summe.
 * Wer je Element in Sekunden umrechnete und diese addierte, brauchte pro Element
 * eine weitere Gleitkomma-Operation - und die Summe haenge dann an der
 * Reihenfolge der Elemente. So haengt sie an nichts als der Frame-Zahl.
 *
 * Gegen DIESEN Wert wird die fertige Datei verifiziert: „Bevor die fertige Datei
 * die vorherige Fassung ersetzt, wird sie **genau einmal** mit `ffprobe`
 * ausgelesen und gegen das Ausgabe-Profil (9.2.4) geprueft: **Dauer** im
 * erwarteten Rahmen (die framegerundete `gesamtdauer`, mit enger Toleranz)"
 * (TK 9.2.6).
 */
export function gesamtdauer(elemente: readonly RenderItem[]): Ergebnis<number, RenderFehlercode> {
  const frames = gesamtFrames(elemente)
  if (!frames.ok) return frames
  return { ok: true, wert: zuSekunden(frames.wert) }
}
