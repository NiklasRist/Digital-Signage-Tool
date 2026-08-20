// GENERIERT aus dem Signaturblock von Issue #173.
// [render-service] RenderRequest vollständig validieren, bevor irgendetwas geschieht
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
// GERUEST-PRUEFSUMME: 50751a24da2b2e64
//
// ZUR ABSCHALTZEILE IN ZEILE 1 - SIE IST BEIM FUELLEN DES RUMPFES ZU ENTFERNEN:
// Die Parameter und Importe dieser Datei SIND der Vertrag; der Rumpf wirft aber
// nur, benutzt sie also nicht (@typescript-eslint/no-unused-vars). Die Zeile
// gehoert zum Geruest, nicht zum fertigen Code. Wer den Rumpf fuellt und sie
// stehen laesst, macht die Regel in DIESER Datei dauerhaft blind - unauffaellig,
// weil dann nichts mehr rot ist.
//
// Gesetzt hat sie kein Mensch, sondern tools/geruest.py: Es fragt nach dem
// Schreiben EINMAL ESLint, welche Dateien no-unused-vars tatsaechlich melden, und
// versieht nur diese. Deshalb steht sie nirgends ueberfluessig herum.
//
// ============================================================================
// DIE GRENZKONTROLLE DES TEUERSTEN VORGANGS IM PROGRAMM
// ============================================================================
// „Der Main validiert jede eingehende Nutzlast - er vertraut dem Renderer nicht.
// Ungueltige Eingabe -> `ungueltige_eingabe`, ohne jede Wirkung auf die Daten. Ein
// Fehler im Renderer darf D1 niemals beschaedigen." (TK 9.1.1, Punkt 6)
//
// Deshalb wird JEDES Feld ueber `unknown` gelesen. Der statische Typ `RenderRequest`
// ist ueber die IPC-Grenze hinweg nur eine Zusage: Dort ist er geloescht, und was
// ankommt, ist ein strukturell geklontes Objekt beliebigen Inhalts.
//
// WIRKUNGSFREI: kein `node:fs`, kein ffmpeg, kein Zustand, keine Veraenderung an der
// Anfrage. Nicht normalisieren, nicht auffuellen, nichts auf den erlaubten Bereich
// zurechtschneiden - ein stillschweigend zurechtgebogener Auftrag rendert etwas
// anderes, als die Oberflaeche angezeigt hat.
//
// WAS HIER NICHT NACHGEBAUT WIRD - und warum das keine Nachlaessigkeit ist:
//   * die Namensregeln fuer `ausgabeName` (TK 9.2.6) -> `loeseAusgabePfad` (#49),
//   * die Regeln fuer `einblendung.art`/`höhe`      -> `bestimmeBandgeometrie` (#176),
//   * die Frame-Rundung                             -> `zuFrames`/`frameDauer` (#174),
//   * die Existenz der Mediendatei                  -> Normalisierung (#177).
// Eine zweite Umsetzung derselben Regel ist eine zweite Wahrheit - und die
// gefaehrliche Sorte davon: Sie koennte MILDER ausfallen als die echte, dann liefe
// die Pruefung hier durch und der Render scheiterte spaeter an anderer Stelle, mit
// halb gefuelltem Arbeitsbereich und angefangener .part-Datei.
//
// ZU DEN BAND-PNG-MASSEN (Nachtrag zum Issue vom 14.08.2026): Das Issue verlangt den
// Vergleich gegen „`bandBreite` x `bandHoehe` aus der Geometrie". Beide Felder gibt es
// im GEBAUTEN Vertrag `BandGeometrie` (#239) nicht mehr; laut Nachtrag ist die
// Bandbreite immer `RENDER_PROFILE.breite` und die Bandhoehe das `einblendung.höhe`
// der Anfrage. Genau so steht es auch am Vertrag selbst: „abschnitte … Band-PNGs
// bereits gerendert, je 1920 x höhe" (#17).
// DIE FALLE, die der Nachtrag benennt: `BandGeometrie.videoBreite` ist NICHT die volle
// Zielflaeche, sondern die EINGEPASSTE Videobreite (bei H = 162 also 1632, nicht 1920).
// Wer sie hier als Bandbreite einsetzte, wiese jedes richtige Band-PNG ab - und beide
// Felder sind `number`, das uebersetzt fehlerfrei. Diese Datei liest deshalb KEIN Feld
// der Geometrie; sie ruft `bestimmeBandgeometrie` allein als Autoritaet darueber, ob
// `art` und `höhe` zulaessig sind.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { DAUER_BEREICH } from '../../shared/contracts/konstanten'
import { RENDER_PROFILE } from '../../shared/contracts/render-profile'
import type { RenderItem, RenderRequest } from '../../shared/contracts/render-request'
import { loeseAusgabePfad } from '../project-store/pfade'
import { bestimmeBandgeometrie, type Bandart } from './band-geometrie'
import type { ElementFehlerdaten, RenderFehlercode } from './fehlercodes'
import { frameDauer, zuFrames } from './frames'

/** Maße eines PNG-Puffers, aus dem IHDR-Kopf gelesen – ohne Dekodieren. */
export interface PngMasse {
  breite: number
  höhe: number
}

// ---------------------------------------------------------------------------
// Der PNG-Kopf. Mehr als diese 24 Bytes wird nie angefasst (ENTSCHIEDEN 5): keine
// Pruefsumme, keine Farbtiefe, keine Bibliothek, kein Bild im Speicher. Ein Puffer
// von 30 MB darf beim Validieren nicht dekodiert werden.
// ---------------------------------------------------------------------------

/** Die PNG-Signatur, die jede Datei eroeffnet. */
const PNG_SIGNATUR: readonly number[] = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
/** Die vier Buchstaben des ersten Abschnitts, als Bytes: I H D R. */
const KOPF_KENNUNG: readonly number[] = [0x49, 0x48, 0x44, 0x52]
/** Versatz der Abschnittskennung: 8 Byte Signatur + 4 Byte Laenge. */
const KENNUNG_VERSATZ = 12
const BREITE_VERSATZ = 16
const HOEHE_VERSATZ = 20
/** So viele Bytes braucht es, um Breite und Hoehe vollstaendig gelesen zu haben. */
const MINDEST_LAENGE = 24

/** Ein Fehler AN DER ANFRAGE. Setzt NIE `daten` – es gibt kein Element, das benannt werden könnte. */
function anfrageFehler(meldung: string): Ergebnis<never, RenderFehlercode> {
  return { ok: false, fehler: { code: 'ungueltige_eingabe', meldung } }
}

/**
 * Ein Fehler AN EINEM ELEMENT. Traegt IMMER `daten` – ohne die Element-ID koennte der
 * gefuehrte Reparatur-Modus (FA-19) den Nutzer nirgendwohin fuehren (TK 9.2.3).
 */
function elementFehler(elementId: string, meldung: string): Ergebnis<never, RenderFehlercode> {
  const daten: ElementFehlerdaten = { elementId }
  return { ok: false, fehler: { code: 'ungueltiges_element', meldung, daten } }
}

/**
 * Ein Fehler OHNE Elementbezug, wie ihn `liesPngMasse` vergibt: Diese Funktion kennt
 * die Element-ID nicht, ihr Aufrufer in dieser Datei ergaenzt sie.
 */
function massFehler(meldung: string): Ergebnis<never, RenderFehlercode> {
  return { ok: false, fehler: { code: 'ungueltiges_element', meldung } }
}

/** Ein Feld eines fremden Objekts lesen, ohne dem Typ zu glauben – und ohne zu werfen. */
function lies(objekt: unknown, schluessel: string): unknown {
  return typeof objekt === 'object' && objekt !== null
    ? // SAFETY: der ternare Zweig hat objekt als nicht-null Objekt belegt; der Cast
      // macht die Index-Form sichtbar, die Werte selbst bleiben ungeprueft.
      (objekt as Record<string, unknown>)[schluessel]
    : undefined
}

function istNichtLeereZeichenkette(wert: unknown): wert is string {
  return typeof wert === 'string' && wert.length > 0
}

/** Ein Wert fuer eine Meldung, ohne `JSON.stringify` (dessen Ausgabe an der Schluesselreihenfolge haengt). */
function beschreibe(wert: unknown): string {
  return typeof wert === 'string' ? `"${wert}"` : String(wert)
}

/**
 * Vier Bytes Big-Endian als vorzeichenlose Zahl.
 *
 * MULTIPLIZIERT statt zu schieben: `bytes[i] << 24` ist in JavaScript eine
 * VORZEICHENBEHAFTETE 32-Bit-Rechnung - ab einem ersten Byte >= 0x80 kaeme eine
 * negative Breite heraus. Eine negative Breite ist nie gleich 1920 und faellt hier
 * nicht auf, sondern erst als unerklaerliche Abweisung eines gueltigen PNG.
 *
 * Das `?? 0` ist Pflicht unter `noUncheckedIndexedAccess` (ein Index-Zugriff hat den
 * Typ `number | undefined`) und die Fluchttuer `!` ist per Lint-Regel verboten. Greifen
 * kann es nicht: Der Aufrufer hat die Mindestlaenge bereits sichergestellt.
 */
function liesVierBytes(bytes: Uint8Array, versatz: number): number {
  return (
    (bytes[versatz] ?? 0) * 0x1000000 +
    (bytes[versatz + 1] ?? 0) * 0x10000 +
    (bytes[versatz + 2] ?? 0) * 0x100 +
    (bytes[versatz + 3] ?? 0)
  )
}

/** Liest Breite und Höhe aus den ersten 24 Bytes eines PNG. Dekodiert das Bild NICHT. */
export function liesPngMasse(png: Uint8Array): Ergebnis<PngMasse, RenderFehlercode> {
  try {
    // Ueber `unknown` gefuehrt: Der Puffer stammt aus dem Renderer, der Typ ist nur
    // eine Zusage. `Buffer` ist ein `Uint8Array` und wird bewusst mit angenommen.
    const roh: unknown = png
    if (!(roh instanceof Uint8Array)) {
      return massFehler(
        `Der PNG-Puffer ist kein Uint8Array, vorgefunden: ${beschreibe(roh)}.`,
      )
    }
    if (roh.byteLength < MINDEST_LAENGE) {
      return massFehler(
        `Der PNG-Puffer ist mit ${String(roh.byteLength)} Bytes zu kurz; die Masse stehen ` +
          `erst nach ${String(MINDEST_LAENGE)} Bytes vollstaendig fest.`,
      )
    }
    for (let i = 0; i < PNG_SIGNATUR.length; i++) {
      if (roh[i] !== PNG_SIGNATUR[i]) {
        return massFehler(
          `Der Puffer traegt keine PNG-Signatur: Byte ${String(i)} ist ` +
            `${String(roh[i])} statt ${String(PNG_SIGNATUR[i])}.`,
        )
      }
    }
    for (let i = 0; i < KOPF_KENNUNG.length; i++) {
      if (roh[KENNUNG_VERSATZ + i] !== KOPF_KENNUNG[i]) {
        return massFehler(
          'Der erste Abschnitt des PNG ist kein Kopf-Abschnitt; die Masse stehen dort ' +
            'nicht. Der Puffer ist beschaedigt oder kein PNG.',
        )
      }
    }
    return {
      ok: true,
      wert: {
        breite: liesVierBytes(roh, BREITE_VERSATZ),
        höhe: liesVierBytes(roh, HOEHE_VERSATZ),
      },
    }
  } catch (ursache) {
    // Niemals `throw`: Diese Funktion wird aus einer IPC-bedienten Operation heraus
    // benutzt (TK 9.1.1). Eine Ausnahme ueber die Prozessgrenze verlaere ihren Code.
    return {
      ok: false,
      fehler: {
        code: 'unbekannter_fehler',
        meldung: `Die PNG-Masse konnten nicht gelesen werden: ${
          ursache instanceof Error ? ursache.message : String(ursache)
        }`,
      },
    }
  }
}

/**
 * Das Ausgabe-Profil FELDWEISE gegen `RENDER_PROFILE` (#18) halten. Liefert die Meldung
 * zum ERSTEN abweichenden Feld oder `null`.
 *
 * AUSGESCHRIEBEN, Feld fuer Feld - kein selbstgebauter Tiefenvergleich und kein
 * `JSON.stringify`-Vergleich, dessen Ergebnis von der Schluesselreihenfolge abhaengt
 * (ENTSCHIEDEN 3). Heute gibt es genau EIN Profil; ein abweichender Wert im Auftrag kann
 * also nur aus einem Fehler oder einer Manipulation im Renderer stammen - und das Profil
 * IST die TV-Vertraeglichkeit: „Wird das Format der Quelle uebernommen (4:2:2, 4:4:4 oder
 * 10 Bit), spielt der TV die Datei nicht ab" (TK 9.2.4).
 *
 * VERMERK FUER DEN AUFTRAGGEBER: Bekaeme das Projekt je ein ZWEITES Ausgabe-Profil, ist
 * diese Pruefung bewusst zu lockern. Sie steht genau deshalb an EINER Stelle.
 *
 * Zusatzfelder im gelieferten Profil werden NICHT beanstandet: Verglichen wird, was
 * `RENDER_PROFILE` festlegt. Ein Feld, das der Vertrag nicht kennt, liest auch niemand.
 */
function pruefeProfil(profil: unknown): string | null {
  const ratensteuerung = lies(profil, 'ratensteuerung')
  const farbmetadaten = lies(profil, 'farbmetadaten')
  const audio = lies(profil, 'audio')

  return (
    feld('breite', RENDER_PROFILE.breite, lies(profil, 'breite')) ??
    feld('hoehe', RENDER_PROFILE.hoehe, lies(profil, 'hoehe')) ??
    feld('fps', RENDER_PROFILE.fps, lies(profil, 'fps')) ??
    feld('videoCodec', RENDER_PROFILE.videoCodec, lies(profil, 'videoCodec')) ??
    feld('profil', RENDER_PROFILE.profil, lies(profil, 'profil')) ??
    feld('level', RENDER_PROFILE.level, lies(profil, 'level')) ??
    feld('pixelformat', RENDER_PROFILE.pixelformat, lies(profil, 'pixelformat')) ??
    feld('bitTiefe', RENDER_PROFILE.bitTiefe, lies(profil, 'bitTiefe')) ??
    feld(
      'ratensteuerung.zielBitrateKbps',
      RENDER_PROFILE.ratensteuerung.zielBitrateKbps,
      lies(ratensteuerung, 'zielBitrateKbps'),
    ) ??
    feld(
      'ratensteuerung.maxBitrateKbps',
      RENDER_PROFILE.ratensteuerung.maxBitrateKbps,
      lies(ratensteuerung, 'maxBitrateKbps'),
    ) ??
    feld(
      'ratensteuerung.vbvBufferKbit',
      RENDER_PROFILE.ratensteuerung.vbvBufferKbit,
      lies(ratensteuerung, 'vbvBufferKbit'),
    ) ??
    feld('gopMaxSekunden', RENDER_PROFILE.gopMaxSekunden, lies(profil, 'gopMaxSekunden')) ??
    feld(
      'farbmetadaten.primaries',
      RENDER_PROFILE.farbmetadaten.primaries,
      lies(farbmetadaten, 'primaries'),
    ) ??
    feld(
      'farbmetadaten.transfer',
      RENDER_PROFILE.farbmetadaten.transfer,
      lies(farbmetadaten, 'transfer'),
    ) ??
    feld(
      'farbmetadaten.matrix',
      RENDER_PROFILE.farbmetadaten.matrix,
      lies(farbmetadaten, 'matrix'),
    ) ??
    feld('sar', RENDER_PROFILE.sar, lies(profil, 'sar')) ??
    feld('audio.codec', RENDER_PROFILE.audio.codec, lies(audio, 'codec')) ??
    feld('audio.sampleRateHz', RENDER_PROFILE.audio.sampleRateHz, lies(audio, 'sampleRateHz')) ??
    feld('audio.kanaele', RENDER_PROFILE.audio.kanaele, lies(audio, 'kanaele')) ??
    feld('audio.still', RENDER_PROFILE.audio.still, lies(audio, 'still')) ??
    feld('faststart', RENDER_PROFILE.faststart, lies(profil, 'faststart')) ??
    feld('container', RENDER_PROFILE.container, lies(profil, 'container'))
  )
}

function feld(pfad: string, erwartet: unknown, vorgefunden: unknown): string | null {
  if (vorgefunden === erwartet) return null
  return (
    `Das Ausgabe-Profil des Auftrags weicht im Feld "${pfad}" ab: erwartet ` +
    `${beschreibe(erwartet)}, vorgefunden ${beschreibe(vorgefunden)}. Das Profil ist die ` +
    'TV-Vertraeglichkeit selbst und darf sich je Auftrag nicht unterscheiden.'
  )
}

/**
 * Die Dauer eines `bild`- oder `segment`-Elements gegen `DAUER_BEREICH` (#21) halten.
 *
 * GRENZEN EINSCHLIESSLICH (ENTSCHIEDEN 10): 10 und 45 sind zulaessig, 9.99 und 45.01
 * nicht. TK 9.2.3 schreibt „`dauer` ausserhalb 10-45 s"; „ausserhalb" schliesst die
 * Grenzen selbst nicht ein.
 *
 * Gilt NICHT fuer `video` (dessen Dauer ergibt sich aus dem Trim, TK 9.11.3) und NICHT
 * fuer Band-Abschnitte (fuer die nennt das TK keinen Bereich - eine erfundene Grenze
 * wiese einen zulaessigen Auftrag ab), ENTSCHIEDEN 9.
 */
function pruefeDauerBereich(elementId: string, dauer: unknown): Ergebnis<void, RenderFehlercode> {
  // Endlichkeit und `> 0` hat `frameDauer` (#174) bereits festgestellt; hier geht es
  // allein um die beiden Grenzen.
  if (typeof dauer !== 'number' || dauer < DAUER_BEREICH.min || dauer > DAUER_BEREICH.max) {
    return elementFehler(
      elementId,
      `Die Dauer ${beschreibe(dauer)} liegt ausserhalb des zulaessigen Bereichs von ` +
        `${String(DAUER_BEREICH.min)} bis ${String(DAUER_BEREICH.max)} Sekunden ` +
        '(beide Grenzen einschliesslich).',
    )
  }
  return { ok: true, wert: undefined }
}

/**
 * Die Einblendung eines `video`-Elements pruefen - Band-Geometrie, Abschnitte, PNG-Masse.
 *
 * ZUR BANDBREITE: Sie ist IMMER `RENDER_PROFILE.breite`. Sie stammt NICHT aus der
 * Geometrie - `BandGeometrie.videoBreite` ist die EINGEPASSTE Videobreite (bei H = 162
 * gerade 1632) und waere hier ein stiller, uebersetzbarer Fehlgriff. S. Kopf der Datei.
 */
function pruefeEinblendung(
  elementId: string,
  einblendung: unknown,
): Ergebnis<void, RenderFehlercode> {
  // EINMAL lesen, dann mit den gelesenen Werten weiterarbeiten: Ein zweites Lesen
  // koennte bei einem Objekt mit Zugriffsfunktionen einen anderen Wert liefern als den
  // geprueften - dann pruefte #176 die eine Hoehe und die PNG-Pruefung vergliche gegen
  // eine andere.
  const art = lies(einblendung, 'art')
  const höhe = lies(einblendung, 'höhe')

  // #176 ist die EINZIGE Autoritaet fuer „welche `art` und welche Bandhoehe sind
  // zulaessig" - hier steht kein eigener Test auf `höhe < 1080` und keine eigene
  // Geradzahligkeits-Pruefung. Die Umwandlung ist bewusst: Zur Laufzeit sind beide
  // Werte unbekannt, und genau das prueft die gerufene Funktion.
  // SAFETY: der Cast benennt die erwartete Form; bestimmeBandgeometrie ist die
  // Pruefung dieser Invariante (Ergebnis-Huelle, ok/fehler unmittelbar darunter).
  const geometrie = bestimmeBandgeometrie({ art, höhe } as { art: Bandart; höhe: number })
  if (!geometrie.ok) {
    // Code UND Meldung von #176 bleiben, wie sie sind; ergaenzt wird allein der
    // Elementbezug, den jene Funktion nicht kennt (TK 9.2.3).
    return { ok: false, fehler: { ...geometrie.fehler, daten: { elementId } } }
  }

  // Ab hier steht fest: `höhe` ist eine ganze, gerade Zahl zwischen 0 und der Bildhoehe.
  const bandBreite = RENDER_PROFILE.breite
  // SAFETY: geometrie.ok ist belegt - bestimmeBandgeometrie hat die hoehe geprueft;
  // der Cast benennt die damit belegte Zahlenform.
  const bandHoehe = höhe as number

  const abschnitte = lies(einblendung, 'abschnitte')
  if (!Array.isArray(abschnitte)) {
    return elementFehler(
      elementId,
      `Die Abschnitte der Einblendung muessen ein Array sein, vorgefunden: ${beschreibe(abschnitte)}.`,
    )
  }
  if (abschnitte.length === 0) {
    return elementFehler(
      elementId,
      'Die Einblendung hat keine Abschnitte. Ein Band ohne Abschnitt zeichnet nichts.',
    )
  }

  for (let i = 0; i < abschnitte.length; i++) {
    const abschnitt: unknown = abschnitte[i]
    const png = lies(abschnitt, 'png')

    if (!(png instanceof Uint8Array) || png.byteLength === 0) {
      return elementFehler(
        elementId,
        `Der Band-Abschnitt an Position ${String(i)} hat keinen brauchbaren PNG-Puffer, ` +
          `vorgefunden: ${beschreibe(png)}.`,
      )
    }

    const masse = liesPngMasse(png)
    if (!masse.ok) {
      return {
        ok: false,
        fehler: {
          ...masse.fehler,
          meldung: `Band-Abschnitt an Position ${String(i)}: ${masse.fehler.meldung}`,
          daten: { elementId },
        },
      }
    }
    if (masse.wert.breite !== bandBreite || masse.wert.höhe !== bandHoehe) {
      return elementFehler(
        elementId,
        `Der Band-Abschnitt an Position ${String(i)} hat die Masse ` +
          `${String(masse.wert.breite)} x ${String(masse.wert.höhe)}; erwartet waren ` +
          `${String(bandBreite)} x ${String(bandHoehe)}. Wurde die Bandhoehe der Vorlage ` +
          'nach dem Zeichnen geaendert?',
      )
    }

    const dauer = lies(abschnitt, 'dauer')
    if (typeof dauer !== 'number' || !Number.isFinite(dauer) || dauer <= 0) {
      return elementFehler(
        elementId,
        `Die Dauer des Band-Abschnitts an Position ${String(i)} muss eine endliche Zahl ` +
          `groesser als 0 sein, vorgefunden: ${beschreibe(dauer)}.`,
      )
    }
    // Die Rundung wird hier NICHT nachgebaut - `zuFrames` (#174) ist die einzige
    // Rechenstelle. Ein Abschnitt ohne Frames waere ein Band-Bild, das nie erscheint.
    if (zuFrames(dauer) < 1) {
      return elementFehler(
        elementId,
        `Die Dauer ${String(dauer)} s des Band-Abschnitts an Position ${String(i)} rundet ` +
          'auf 0 Frames. Die Mindestdauer ist ein Frame.',
      )
    }
  }

  return { ok: true, wert: undefined }
}

/**
 * STUFE 2 - ein einzelnes Element. Verstoss immer `ungueltiges_element` MIT
 * `daten: { elementId }`, ausser der durchgereichte Code von `frameDauer` (#174) sagt
 * etwas anderes.
 */
function pruefeElement(element: RenderItem, elementId: string): Ergebnis<void, RenderFehlercode> {
  // FUER ALLE ARTEN ZUERST: Damit sind Trim bzw. `dauer` endlich, positiv und
  // mindestens einen Frame lang. Code und `daten` werden UNVERAENDERT durchgereicht.
  const frames = frameDauer(element)
  if (!frames.ok) return { ok: false, fehler: frames.fehler }

  const roh: unknown = element
  const art = lies(roh, 'art')

  if (art === 'video') {
    const medienRef = lies(roh, 'medienRef')
    if (!istNichtLeereZeichenkette(medienRef)) {
      // NUR „nicht leere Zeichenkette" (ENTSCHIEDEN 7/8): Ob die Datei existiert,
      // stellt die Normalisierung fest (#177), und den Pfad loest `loeseAssetPfad`
      // (#49) dort auf, wo die Datei geoeffnet wird. `medium_fehlt` wird hier NIE
      // vergeben - diese Datei hat kein Dateisystem.
      return elementFehler(
        elementId,
        `Der Medienverweis eines "video"-Elements fehlt oder ist leer, vorgefunden: ${beschreibe(medienRef)}.`,
      )
    }
    const einblendung = lies(roh, 'einblendung')
    // Genau `null` heisst „kein Band" (so steht es im Vertrag, #17). Alles andere -
    // auch ein fehlendes Feld - geht in die Pruefung und bekommt dort seinen Fehler,
    // statt stillschweigend als „kein Band" durchzugehen.
    if (einblendung === null) return { ok: true, wert: undefined }
    return pruefeEinblendung(elementId, einblendung)
  }

  // `segment`: Die `art` ist in Stufe 1 bereits auf die zwei zulaessigen Werte
  // eingegrenzt worden, ein dritter Zweig kann hier nicht ankommen.
  const png = lies(roh, 'png')
  if (!(png instanceof Uint8Array) || png.byteLength === 0) {
    // „Bei `"segment"` werden keine Aktions-/Vorlagendaten mitgeschickt - die Pixel
    // sind bereits final; das ist der Kern von Variante A." (TK 9.2.2) Ein `segment`
    // ohne PNG-Puffer ist deshalb kein Sonderfall, sondern ein leeres Element.
    return elementFehler(
      elementId,
      `Das "segment"-Element hat keinen brauchbaren PNG-Puffer, vorgefunden: ${beschreibe(png)}.`,
    )
  }
  const masse = liesPngMasse(png)
  if (!masse.ok) {
    return { ok: false, fehler: { ...masse.fehler, daten: { elementId } } }
  }
  if (masse.wert.breite !== RENDER_PROFILE.breite || masse.wert.höhe !== RENDER_PROFILE.hoehe) {
    // EXAKT, ohne jede Toleranz: Ein um ein Pixel abweichendes Segment zwaenge ffmpeg
    // zum Skalieren und braeche damit die Zusage aus TK 9.10, dass Vorschau und Render
    // dieselben Pixel zeigen.
    return elementFehler(
      elementId,
      `Das "segment"-PNG hat die Masse ${String(masse.wert.breite)} x ` +
        `${String(masse.wert.höhe)}; erwartet waren ${String(RENDER_PROFILE.breite)} x ` +
        `${String(RENDER_PROFILE.hoehe)}.`,
    )
  }
  return pruefeDauerBereich(elementId, lies(roh, 'dauer'))
}

/**
 * Prüft die gesamte Anfrage. Wirkungsfrei: liest nichts, schreibt nichts, startet nichts.
 * Erfolg heisst „diese Anfrage darf ausgeführt werden", nicht „sie wird gelingen".
 */
export function pruefeRenderRequest(request: RenderRequest): Ergebnis<void, RenderFehlercode> {
  try {
    // ------------------------------------------------------------------
    // STUFE 1 - DIE ANFRAGE. Jeder Verstoss: `ungueltige_eingabe`, OHNE `daten`.
    // Die Reihenfolge ist verbindlich: erst die Anfrage, dann die Elemente.
    // ------------------------------------------------------------------
    const roh: unknown = request
    if (roh === null || typeof roh !== 'object') {
      return anfrageFehler(`Der Render-Auftrag ist kein Objekt, vorgefunden: ${beschreibe(roh)}.`)
    }

    const projektId = lies(roh, 'projektId')
    if (!istNichtLeereZeichenkette(projektId)) {
      return anfrageFehler(
        `Die Projekt-Kennung des Auftrags fehlt oder ist leer, vorgefunden: ${beschreibe(projektId)}.`,
      )
    }

    const renderId = lies(roh, 'renderId')
    if (!istNichtLeereZeichenkette(renderId)) {
      return anfrageFehler(
        `Die Render-Kennung des Auftrags fehlt oder ist leer, vorgefunden: ${beschreibe(renderId)}.`,
      )
    }

    const elemente: unknown = lies(roh, 'elemente')
    if (!Array.isArray(elemente)) {
      return anfrageFehler(
        `Die Elementliste des Auftrags muss ein Array sein, vorgefunden: ${beschreibe(elemente)}.`,
      )
    }
    if (elemente.length === 0) {
      // Genau der in TK 9.2.3 genannte Fall „leere Elementliste".
      return anfrageFehler('Der Auftrag enthaelt kein einziges Element; es gaebe nichts zu rendern.')
    }

    // Kennungen und Arten in EINEM Durchgang, VOR jeder Element-Pruefung. Beides
    // gehoert der Anfrage: Ohne eindeutige `id` gibt es keinen Wert fuer
    // `daten: { elementId }` - der Fehler koennte den Nutzer nirgendwohin fuehren, und
    // der Reparatur-Modus (FA-19) stuende vor zwei Elementen mit derselben Kennung
    // (ENTSCHIEDEN 4). Eine unbekannte `art` ordnet TK 9.2.3 ausdruecklich der Anfrage zu.
    const kennungen = new Set<string>()
    for (let i = 0; i < elemente.length; i++) {
      const element: unknown = elemente[i]
      const id = lies(element, 'id')
      if (!istNichtLeereZeichenkette(id)) {
        // Die Meldung nennt den INDEX - eine ID, auf die man verweisen koennte, gibt es ja gerade nicht.
        return anfrageFehler(
          `Das Element an Position ${String(i)} hat keine oder eine leere Kennung, ` +
            `vorgefunden: ${beschreibe(id)}.`,
        )
      }
      if (kennungen.has(id)) {
        return anfrageFehler(
          `Die Element-Kennung "${id}" kommt mehrfach vor (zuletzt an Position ${String(i)}). ` +
            'Kennungen muessen im Auftrag eindeutig sein, sonst ist die Fehlerzuordnung mehrdeutig.',
        )
      }
      kennungen.add(id)

      const art = lies(element, 'art')
      // Zwei zulaessige Arten, nicht drei: `art: 'bild'` ist mit TK v3.16 gestrichen
      // (TK 9.11.3, TK 9.2.2). Ein eingehendes "bild" ist damit genau das, was TK 9.11.3
      // dafuer vorsieht - ein Fehler der Anfrage, keine Sonderbehandlung.
      if (art !== 'video' && art !== 'segment') {
        return anfrageFehler(
          `Das Element "${id}" hat die unbekannte Art ${beschreibe(art)}. ` +
            'Zulaessig sind ausschliesslich "video" und "segment".',
        )
      }
    }

    const profilAbweichung = pruefeProfil(lies(roh, 'profil'))
    if (profilAbweichung !== null) {
      return anfrageFehler(profilAbweichung)
    }

    // Der Ausgabename ist NUTZEREINGABE. Geprueft wird er von der Pfad-Autoritaet
    // (#49) - die Zeichenregeln aus TK 9.2.6 werden hier NICHT nachgebaut
    // (ENTSCHIEDEN 1). Der gelieferte Pfad wird VERWORFEN: Wer die Datei spaeter
    // schreibt, loest ihn erneut auf (ENTSCHIEDEN 2). Der Aufruf ist ohne Nebenwirkung
    // („reine String-/Validierungs-Operation", #49) und verletzt die Wirkungsfreiheit
    // dieser Datei deshalb nicht.
    //
    // Der `ausgabeName` wird ungeprueft weitergereicht: `loeseAusgabePfad` stellt
    // selbst fest, ob ueberhaupt eine Zeichenkette vorliegt. Eine eigene Vorpruefung
    // waere bereits der Anfang der zweiten Wahrheit.
    // SAFETY: loeseAusgabePfad prueft die Zeichenkette selbst (Ergebnis-Huelle); der
    // Cast benennt die erwartete Form, damit hier keine zweite Wahrheit entsteht.
    const pfad = loeseAusgabePfad(projektId, lies(roh, 'ausgabeName') as string)
    if (!pfad.ok) {
      // Die Meldung von #49 wird uebernommen, damit der Nutzer erfaehrt, WAS am Namen
      // unzulaessig war.
      return anfrageFehler(pfad.fehler.meldung)
    }

    // ------------------------------------------------------------------
    // STUFE 2 - JEDES ELEMENT EINZELN. Abbruch beim ERSTEN unstimmigen Element; es
    // werden NICHT alle Fehler gesammelt (ENTSCHIEDEN 6): `RenderResult` hat genau ein
    // Feld `fehlerhaftesElementId` (#19), und der Reparatur-Modus fuehrt den Nutzer
    // laut TK 9.7.5 ohnehin „eins nach dem anderen".
    // ------------------------------------------------------------------
    for (const element of elemente) {
      const id = lies(element, 'id')
      // SAFETY: element stammt aus der geparsten RenderRequest; pruefeElement (im
      // naechsten Schritt) ist die Validierung der Element-Form (Ergebnis-Huelle).
      const ergebnis = pruefeElement(
        element as RenderItem,
        typeof id === 'string' ? id : String(id),
      )
      if (!ergebnis.ok) return ergebnis
    }

    return { ok: true, wert: undefined }
  } catch (ursache) {
    return {
      ok: false,
      fehler: {
        code: 'unbekannter_fehler',
        meldung: `Der Render-Auftrag konnte nicht geprueft werden: ${
          ursache instanceof Error ? ursache.message : String(ursache)
        }`,
      },
    }
  }
}
