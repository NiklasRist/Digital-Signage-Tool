// [template-canvas] Motiv über media:// laden und dekodieren
//
// DER UEBERGANG VOM ASYNCHRONEN LADEN INS SYNCHRONE ZEICHNEN.
//
// `zeichneSegment` (#117) ist SYNCHRON und darf nicht awaiten - sonst ist "gleiche
// Eingabe -> gleiches Bild" (TK 9.10.3, Punkt 5) nicht mehr pruefbar. Sie kann ein
// Bild deshalb gar nicht selbst beschaffen. Diese Datei loest das in zwei Haelften:
// vorher `bereiteMotiveVor` (asynchron, wartet auf `decode()`), beim Zeichnen nur
// noch `holeMotiv` (synchron, schlaegt nach). Der Bestand dazwischen ist deshalb
// KEIN Cache - er ist die einzige Moeglichkeit, wie das Zeichnen ueberhaupt an ein
// Bild kommt.
//
// KEIN DATEISYSTEM. "Kennt keine Dateisystem-Pfade - Motive kommen ausschliesslich
// ueber `media://` (9.5.7)." (TK 9.10.8) Die einzige Bildquelle dieser Datei ist die
// URL `media://<projektId>/<dateiname>`, die der Main bedient (#9 registriert das
// Schema, #50 loest ueber die Pfad-Autoritaet #49 auf). Kein `fs`, kein `path`, kein
// `file://`, kein IPC-Kanal fuer Bilddaten - IPC transportiert laut TK 9.1.1 Punkt 1
// ausschliesslich gerenderte Segment-PNGs.
//
// NACHTRAG 09.11.2026 - BYTES ALS BLOB-URL (BEFUND AUS #464):
// Ein `media://`-Bild direkt in `<img>` TAINTET das Canvas. Anzeigen geht, aber
// `toBlob` scheitert mit "Tainted canvases may not be exported" - und damit jeder
// Render einer Aktion mit Motiv, nicht nur ein Effekt. GEMESSEN am 09.11.2026 am
// gebauten Fenster (scripts/beleg-effekt-render.mjs, erste Fassung mit Motiv).
//
// DERSELBE WEG WIE #315/NACHTRAG II (`marken://`) UND #364 (`media://` fuer den
// Filmstreifen): Die Bytes kommen ueber den Speicherort-Vertrag (TK 9.5.7,
// `media://` bleibt unveraendert), gebunden wird aber eine Objekt-URL. Blob-URLs
// sind same-origin und tainen nicht. Die eine Stelle dafuer ist
// `gemeinsam/media-blob-url.ts` - hier steht KEINE zweite Kopie des Wegs.
//
// FESTLEGUNG 2 BLEIBT: Die Adresse wird roh zusammengesetzt (kein
// `encodeURIComponent`) - nur jetzt in `mediaBlobUrl`, das denselben Vertrag haelt.
// FESTLEGUNG 8 BLEIBT: kein `crossOrigin`, keine Groessenattribute; das Bild dient
// allein als Quelle fuer `ctx.drawImage`. Die Objekt-URL wird nach dem `decode()`
// widerrufen - das dekodierte Bild bleibt gueltig (im Logo-Weg seit 23.08.2026 so).
//
// `fehlt` IST KEIN FEHLER, SONDERN EIN ZUSTAND. "Ist `aktion.bildRef` ein
// `fehlt`-Asset (9.4.7), zeichnet `template-canvas` einen Platzhalter an der
// Bildzone, damit der `action-editor` den Defekt zeigen kann (9.8.5)." (TK 9.10.7)
// Deshalb wird bei einem Ladefehler weder geworfen noch eine `Ergebnis<T>`-Huelle
// gebaut (Festlegung 4): Ein Wurf naehme der Oberflaeche die Reparaturmoeglichkeit,
// ein stillschweigend leeres Bild liesse den Defekt unsichtbar in den Render laufen.
// Geworfen wird ausschliesslich bei leeren Argumenten - das ist ein Programmierfehler
// und entsteht nie aus gueltigen D1-Daten.

export type Motiv =
  | { zustand: 'geladen'; bild: ImageBitmap | HTMLImageElement; breite: number; höhe: number }
  | { zustand: 'fehlt' }

// Die EINE Stelle fuer media://-Bytes als Blob-URL (#364) - hier keine zweite Kopie
// des Wegs. Blob-URLs sind same-origin und tainen das Canvas nicht.
import { gibMediaBlobUrlFrei, mediaBlobUrl } from '../gemeinsam/media-blob-url'
// Die Aufbereitung (13.11.2026, FA-28 / TK 9.21) sitzt hier, weil das Motiv HIER entsteht:
// einmal je (Asset, Einstellungen) rechnen, nicht je Frame. Die Regelquelle ist geteilt.
import { istAufbereitungNeutral, motivSchluessel } from '../../shared/aufbereitung'
import { bereiteAuf } from './aufbereiten'

import type { BildAufbereitung } from '../../shared/contracts/aktion'
// Das unterscheidende Feld heißt `zustand` (nicht `status`). Diese Datei ist für den Typ
// DEFINIEREND; #115, #117 und #119 übernehmen ihn zeichengenau.
// breite/höhe = naturalWidth/naturalHeight des dekodierten Bildes (native Pixelmaße).
// Sie werden von der Bildzone (#115) für "contain"/"cover" gebraucht – und zwar AUSSCHLIESSLICH
// über diese beiden Felder. Ein Maß, das jede Zeichenfunktion selbst am Bildobjekt abliest,
// driftet; deshalb steht es genau einmal hier.

/**
 * Der vorbereitete Bestand - die EINZIGE Ablage dieser Datei (Festlegung 3).
 *
 * Verboten bleibt jede weitere Zwischenspeicherung: kein zweiter Cache nach URL oder
 * Dateiname, keine `WeakMap` auf Bildobjekte, kein `localStorage`/`sessionStorage`/
 * `IndexedDB`. Der Grund ist nicht Sparsamkeit, sondern Richtigkeit: Nach einem erneuten
 * Import unter gleichem Dateinamen lieferte ein zweiter, nicht mitgeleerter Speicher ALTE
 * Bytes - Vorschau und Endvideo zeigten dann verschiedene Motive, ohne Fehlermeldung.
 *
 * Der Schluessel ist die ASSET-ID (`aktion.bildRef`), NICHT der Dateiname. Unter genau
 * dieser ID schlaegt #117 beim Zeichnen nach; die Aufloesung ID -> `Asset.dateiname` macht
 * der Aufrufer (M5), der das Projekt und damit die Asset-Liste kennt.
 */
const bestand = new Map<string, Motiv>()

/**
 * Wie viele AUFBEREITETE Bilder hoechstens gehalten werden (TK 9.21.4) und wie viel sie
 * zusammen kosten duerfen. Nur aufbereitete Puffer zaehlen: ein rohes Motiv liegt ohnehin
 * im Speicher, wenn es angezeigt wird; ein aufbereiteter Puffer ist ein ZWEITES Bild
 * derselben Groesse und damit der Posten, der bei vielen Aktionen auffiele.
 */
const MAX_AUFBEREITETE = 6
const MAX_AUFBEREITETE_BYTES = 256 * 1024 * 1024

/** Schluessel in der Reihenfolge ihres Einfuegens – das aelteste faellt zuerst heraus. */
const aufbereiteteReihenfolge: string[] = []
/** Groesse je aufbereitetem Schluessel in Bytes (Breite × Hoehe × 4). */
const aufbereiteteBytes = new Map<string, number>()

/** Ein aufbereitetes Motiv ablegen und dabei die Obergrenzen einhalten. */
function legeAufbereitetesAb(schluessel: string, motiv: Motiv, breite: number, hoehe: number): void {
  const bytes = breite * hoehe * 4
  aufbereiteteBytes.set(schluessel, bytes)
  // EIN SCHLUESSEL STEHT NUR EINMAL IN DER REIHENFOLGE. Ohne diese Zeile traege jeder
  // Reglerzug denselben Schluessel ein zweites Mal ein - die Obergrenze zaehlte doppelt,
  // und beim Aufraeumen koennte GENAU DAS Bild verdrängt werden, das gerade gezeigt wird.
  const vorhanden = aufbereiteteReihenfolge.indexOf(schluessel)
  if (vorhanden >= 0) aufbereiteteReihenfolge.splice(vorhanden, 1)
  aufbereiteteReihenfolge.push(schluessel)
  while (
    aufbereiteteReihenfolge.length > MAX_AUFBEREITETE ||
    summeAufbereitet() > MAX_AUFBEREITETE_BYTES
  ) {
    const aeltester = aufbereiteteReihenfolge.shift()
    if (aeltester === undefined) break
    aufbereiteteBytes.delete(aeltester)
    bestand.delete(aeltester)
  }
  bestand.set(schluessel, motiv)
}

/** Nur fuer Tests: wie viele aufbereitete Puffer der Bestand gerade haelt. */
export function anzahlAufbereitete(): number {
  return aufbereiteteReihenfolge.length
}

function summeAufbereitet(): number {
  let summe = 0
  for (const bytes of aufbereiteteBytes.values()) summe += bytes
  return summe
}

/**
 * Generationszaehler (Festlegung 9).
 *
 * `leereMotivBestand()` erhoeht ihn; ein `bereiteMotiveVor`, das vorher gestartet ist,
 * legt danach NICHTS mehr ab. Ohne diese Regel truege der Bestand nach einem
 * Projektwechsel Motive des ALTEN Projekts - ein Segment zeigte dann ein fremdes Bild,
 * ohne jede Fehlermeldung. Genau diese lautlose Fehlerklasse soll das Modul verhindern.
 *
 * Es gibt bewusst KEINEN Abbruch laufender Ladevorgaenge (kein `AbortController`): Eine
 * lokale Datei ist in Millisekunden gelesen, und ein Abbruchpfad waere mehr
 * Angriffsflaeche als Nutzen.
 */
let generation = 0

/**
 * Das eine `fehlt`-Ergebnis.
 *
 * Eingefroren, damit kein Aufrufer es versehentlich in ein `geladen` verwandelt - der
 * Wert wird an vielen Stellen zurueckgegeben und waere sonst gemeinsam veraenderlicher
 * Zustand. Als Konstante statt als frisches Objektliteral, weil dann auch die
 * Identitaet stabil ist: zweimal derselbe Aufruf liefert buchstaeblich dasselbe
 * Ergebnis (TK 9.10.3, Punkt 5).
 */
const FEHLT: Motiv = Object.freeze<Motiv>({ zustand: 'fehlt' })

/**
 * Pflichteingang-Wache fuer `projektId`, `dateiname` und `schluessel` in `eintraege`.
 *
 * Leer oder nur Leerraum ist ein PROGRAMMIERFEHLER, kein Datenfall: Aus gueltigen
 * D1-Daten entsteht so etwas nie (`Asset.dateiname` ist `<uuid>.<ext>`, `projektId` eine
 * UUID). Deshalb wirft es hier, statt als `fehlt` durchzugehen - ein leerer Dateiname
 * ergaebe die URL `media://<id>/`, die der Main ohnehin abweist, und der Aufrufer saehe
 * nur einen Platzhalter statt seines Fehlers.
 *
 * `typeof` und nicht nur `=== ''`: Der Wert kann aus geladenem JSON stammen, das
 * TypeScript nicht prueft.
 */
function pruefeNichtLeer(feld: string, wert: string): void {
  if (typeof wert !== 'string' || wert.trim() === '') {
    throw new Error(
      `bild-laden: ${feld} muss eine nicht leere Zeichenkette sein, bekommen: ${JSON.stringify(wert)}.`,
    )
  }
}

export async function ladeMotiv(projektId: string, dateiname: string): Promise<Motiv> {
  pruefeNichtLeer('projektId', projektId)
  pruefeNichtLeer('dateiname', dateiname)

  // Die Adresse `media://<projektId>/<dateiname>` baut `mediaBlobUrl` - roh, ohne
  // `encodeURIComponent`. Ueber Gueltigkeit entscheidet EINE Instanz, der Main
  // (#49/#50); eine zweite Pruefung hier waere eine zweite Pfad-Autoritaet.
  //
  // `''` heisst: nicht ladbar (abgewiesen, fehlend, Handler-/Lesefehler). Das ist eine
  // Ladelage, kein Programmierfehler - und endet wie jeder Ladefehler als `fehlt`.
  const objektUrl = await mediaBlobUrl(projektId, dateiname)
  if (objektUrl === '') {
    return FEHLT
  }

  let bild: HTMLImageElement
  try {
    // Reihenfolge nach Festlegung 1: Element erzeugen, `src` setzen, DANN `decode()`
    // awaiten - `decode()` auf einem Bild ohne `src` lehnt ab.
    //
    // Das Bild wird NICHT in den DOM gehaengt und bekommt kein `crossOrigin`, kein
    // `loading` und keine Groessenattribute (Festlegung 8). Es dient allein als Quelle
    // fuer `ctx.drawImage`.
    bild = new Image()
    bild.src = objektUrl

    // `await img.decode()` UND NICHT `onload` (Festlegung 1). `onload` bedeutet "die
    // Bytes sind da", NICHT "das Bild ist dekodiert". Wer nach `onload` zeichnet,
    // erzeugt ein Segment mit leerer oder halber Bildflaeche.
    //
    // KEIN eigener Timeout (Festlegung 5): `media://` liest eine LOKALE Datei, keine
    // Netzwerkressource. Ein Abbruch nach n Millisekunden machte das Ergebnis
    // zeitabhaengig - "gleiche Eingabe -> gleiches Bild" waere gebrochen.
    await bild.decode()
  } catch {
    // HIER ENDET JEDER LADEFEHLER: Datei nicht vorhanden, `Asset.zustand === "fehlt"`
    // (TK 9.4.7), Traversal-Verdacht, Lesefehler, fremdes Projekt - und ebenso Bytes,
    // die ankommen, aber kein dekodierbares Bild sind.
    //
    // KEINE Wiederholungsschleife und KEINE Zusatzmeldung: Beides verdeckte die Luecke
    // im Gesamtvertrag, statt sie zu schliessen.
    return FEHLT
  } finally {
    // Die Objekt-URL wird NACH dem decode() freigegeben; das dekodierte Bild bleibt
    // gueltig (derselbe Weg wie im Logo-Ladeweg, #315/Nachtrag II). Ohne das Freigeben
    // bliebe je Vorbereitung ein Blob im Speicher des Renderers liegen.
    gibMediaBlobUrlFrei(objektUrl)
  }

  return {
    zustand: 'geladen',
    bild,
    // `naturalWidth`/`naturalHeight` und NICHT `width`/`height`: Ein Bild ausserhalb des
    // DOM hat kein Layout, `width`/`height` traegen dort keine verlaessliche Groesse
    // (ohne gesetzte Attribute sind sie 0). #115 rechnet mit diesen beiden Feldern
    // "contain"/"cover" aus - eine 0 ergaebe ein Bild ohne Flaeche.
    breite: bild.naturalWidth,
    höhe: bild.naturalHeight,
  }
}
// Holt die Bytes ueber `mediaBlobUrl` (Blob-URL, taintet nicht) und dekodiert sie mit
// new Image() + await img.decode(). Wirft NIE wegen eines Ladefehlers – jeder
// Ladefehler ist { zustand: 'fehlt' }.

export async function bereiteMotiveVor(
  projektId: string,
  eintraege: MotivEintrag[],
): Promise<void> {
  pruefeNichtLeer('projektId', projektId)

  // ALLE EINTRAEGE WERDEN VOR DEM ERSTEN LADEN GEPRUEFT, nicht erst wenn die Schleife
  // dort ankommt. Sonst haette ein Programmierfehler im letzten Eintrag bereits die
  // vorderen im Bestand abgelegt - ein halb vorbereiteter Bestand nach einem Wurf, den
  // der Aufrufer nach dem Abfangen nicht von einem vollstaendigen unterscheiden koennte.
  eintraege.forEach((eintrag, i) => {
    pruefeNichtLeer(`eintraege[${i}].bildRef`, eintrag.bildRef)
    pruefeNichtLeer(`eintraege[${i}].dateiname`, eintrag.dateiname)
  })

  // Der Zaehlerstand BEI START (Festlegung 9). Alles Weitere haengt daran.
  const gestartetIn = generation

  // GELADEN (UND GERECHNET) WIRD NEBENLAEUFIG, ABGELEGT WIRD DANACH IN EINGANGSREIHENFOLGE.
  //
  // Nebenlaeufig, weil die Ladevorgaenge voneinander unabhaengig sind und ein
  // Aktions-Editor mit einem Dutzend Motiven sonst ein Dutzend Mal nacheinander wartete.
  //
  // Abgelegt in Eingangsreihenfolge, weil `eintraege` denselben Schluessel zweimal
  // enthalten kann (zwei Aktionen mit demselben Bild-Asset und denselben Einstellungen):
  // Wer die Ergebnisse in der Reihenfolge ihres Eintreffens ablegte, liesse den ZUFALL
  // entscheiden, welches gewinnt. So gewinnt immer das letzte - "ein bereits vorhandener
  // Schluessel wird ueberschrieben" gilt damit auch innerhalb eines Aufrufs.
  //
  // `Promise.all` kann hier nicht ablehnen: `ladeMotiv` wirft nur bei leeren Argumenten,
  // und die sind oben schon ausgeschlossen. Ein einzelnes nicht ladbares Motiv wird zu
  // `{ zustand: 'fehlt' }` und haelt die uebrigen Eintraege nicht auf.
  const ergebnisse = await Promise.all(
    eintraege.map((eintrag) => bereiteEinenVor(projektId, eintrag)),
  )

  // Wurde zwischenzeitlich geleert (Projektwechsel, Import), wird NICHTS mehr abgelegt.
  // Die Pruefung steht einmal vor der Ablage-Schleife und nicht in ihr: Zwischen ihr und
  // der letzten `set`-Zeile liegt kein `await`, es kann also nichts dazwischenkommen.
  if (generation !== gestartetIn) {
    return
  }

  ergebnisse.forEach((ergebnis) => {
    if (ergebnis === null) {
      // Unerreichbar: `Promise.all` liefert genau so viele Ergebnisse wie Eingaben. Der
      // Zweig steht, weil `noUncheckedIndexedAccess` den Index-Zugriff als moeglicherweise
      // `undefined` fuehrt - und die Fluchttuer `ergebnisse[i]!` ist projektweit verboten
      // (eslint: no-non-null-assertion), weil sie Code geprueft aussehen laesst, der es
      // nicht ist.
      return
    }
    if (ergebnis.aufbereitet) {
      legeAufbereitetesAb(ergebnis.schluessel, ergebnis.motiv, ergebnis.breite, ergebnis.höhe)
      return
    }
    bestand.set(ergebnis.schluessel, ergebnis.motiv)
  })
}
// Lädt jeden Eintrag über ladeMotiv(projektId, dateiname), rechnet — falls gesetzt — die
// Aufbereitung EINMAL je (Asset, Einstellungen) und legt das Ergebnis unter
// `motivSchluessel(...)` im Motiv-Bestand ab (TK 9.21.4). Ohne Aufbereitung ist der
// Schlüssel die nackte Asset-ID; dann wird nichts gerechnet. Wirft nie: ein nicht ladbares
// Motiv landet als { zustand: 'fehlt' } im Bestand. Ein bereits vorhandener Schlüssel wird
// überschrieben.

/**
 * Ein Eintrag der Vorbereitung (TK 9.21.4).
 *
 * `bildRef` heisst wie das Feld der Aktion, und das ist Absicht: `schluessel` und
 * `bildRef` waren zwei Namen fuer dieselbe Kennung, und genau solche Paare driften beim
 * naechsten Umbau auseinander.
 */
export interface MotivEintrag {
  bildRef: string
  dateiname: string
  aufbereitung?: BildAufbereitung | null
  /** Seit 13.11.2026 (FA-29 / TK 9.21.5): `true` rechnet das Modell EINMAL je Bild. */
  freistellen?: boolean
}

/**
 * Der Eintrag fuer `bereiteMotiveVor` aus einer Aktion – EINE Stelle fuer BEIDE Felder.
 *
 * WARUM ALS FUNKTION: Fuenf Aufrufer (Bibliothek, Zeitleiste, Live-Vorschau, Renderer-
 * Vorbereitung, Vorlagen-Editor) bauen diesen Eintrag. Solange jeder die beiden Felder
 * selbst anhaengt, vergisst der naechste Umbau genau eines davon – und das Bild ist dann
 * gespeichert, aber nie aufbereitet. Der Parameter ist STRUKTURELL (`bildRef` +
 * die zwei Felder), damit diese Datei weder `Aktion` noch den Editor kennen muss.
 */
export function motivEintragFuer(
  aktion: {
    bildRef: string | null
    bildAufbereitung?: BildAufbereitung | null
    freistellen?: boolean | null
  },
  dateiname: string,
): MotivEintrag {
  // Der Typ laesst `null` zu, weil `Aktion.bildRef` es zulaesst; die AUFRUFER pruefen
  // vorher. Ein leerer Bestands-Schluessel waere ein Programmierfehler und kein Datenfall
  // - dieselbe Regel wie bei `pruefeNichtLeer` darunter.
  if (aktion.bildRef === null) {
    throw new Error('motivEintragFuer: Aktions-Inhalt ohne bildRef.')
  }
  const eintrag: MotivEintrag = { bildRef: aktion.bildRef, dateiname }
  // Nur setzen, wenn es etwas zu setzen gibt: ein Feld mit `undefined` waere im Vergleich
  // und in den Tests ein Wert, obwohl „keine Aufbereitung" gemeint ist.
  if (aktion.bildAufbereitung !== undefined && aktion.bildAufbereitung !== null) {
    eintrag.aufbereitung = aktion.bildAufbereitung
  }
  if (aktion.freistellen === true) eintrag.freistellen = true
  return eintrag
}

interface VorbereitetesMotiv {
  schluessel: string
  motiv: Motiv
  aufbereitet: boolean
  breite: number
  höhe: number
}

/**
 * Ein Motiv laden und - wenn noetig - einmal aufbereiten.
 *
 * DER RÜCKFALL IST ABSICHT: Kann die Umgebung nicht rechnen (kein Offscreen-Canvas,
 * `createImageBitmap` fehlt), wird das ROHE Motiv unter dem abgeleiteten Schluessel
 * abgelegt. Das Bild bleibt sichtbar, es fehlt nur die Aufbereitung. Ein Platzhalter waere
 * die schlechtere Antwort: Ein optionaler Regler darf kein Bild verschwinden lassen.
 */
async function bereiteEinenVor(
  projektId: string,
  eintrag: MotivEintrag,
): Promise<VorbereitetesMotiv | null> {
  // SEIT 13.11.2026 (FA-29): `freistellen` gehoert in den SCHLUESSEL (9.21.3) - sonst
  // faende das Zeichnen das freigestellte Bild nicht und zeichnete still das Rechteck.
  const freistellen = eintrag.freistellen === true
  const schluessel = motivSchluessel(eintrag.bildRef, eintrag.aufbereitung, freistellen)
  const roh = await ladeMotiv(projektId, eintrag.dateiname)
  if (roh.zustand !== 'geladen' || (!freistellen && istAufbereitungNeutral(eintrag.aufbereitung))) {
    return { schluessel, motiv: roh, aufbereitet: false, breite: 0, höhe: 0 }
  }
  const aufbereitet = await bereiteAuf(
    roh.bild,
    roh.breite,
    roh.höhe,
    eintrag.aufbereitung,
    freistellen,
  )
  if (aufbereitet === null) {
    return { schluessel, motiv: roh, aufbereitet: false, breite: 0, höhe: 0 }
  }
  return {
    schluessel,
    motiv: { zustand: 'geladen', bild: aufbereitet, breite: roh.breite, höhe: roh.höhe },
    aufbereitet: true,
    breite: roh.breite,
    höhe: roh.höhe,
  }
}

export function holeMotiv(schluessel: string): Motiv {
  // EINE ZEILE, UND DAS IST DER PUNKT: kein Nachladen, kein `await`, kein `new Image()`.
  // Waere hier auch nur ein Ladeversuch, muesste `holeMotiv` asynchron werden - und
  // damit `zeichneSegment` (#117) ebenfalls, womit der ganze Zuschnitt hinfaellig waere.
  //
  // Ein unbekannter Schluessel wirft NICHT: Er entsteht regulaer, wenn der Bestand
  // zwischenzeitlich geleert wurde oder ein Motiv nicht ladbar war - beides ist der
  // Platzhalter-Fall (TK 9.10.7), keine Ausnahmelage.
  return bestand.get(schluessel) ?? FEHLT
}
// SYNCHRON. Liest ausschließlich den vorbereiteten Bestand – lädt nichts, wartet auf nichts,
// erzeugt kein Image. Unbekannter Schlüssel → { zustand: 'fehlt' }.

export function leereMotivBestand(): void {
  bestand.clear()
  // Die Aufbereitungs-Buchhaltung MUSS mit: Sonst zaehlten geloeschte Puffer weiter gegen
  // die Obergrenzen, und ein Projektwechsel raeumte den Speicher nicht wirklich.
  aufbereiteteReihenfolge.length = 0
  aufbereiteteBytes.clear()
  // Der Zaehler steigt ZUSAETZLICH zum Leeren, nicht statt dessen: Ohne das Leeren
  // blieben die alten Motive nachschlagbar, ohne den Zaehler legten die noch laufenden
  // Vorbereitungen sie gleich wieder hinein (Festlegung 9).
  generation += 1
}
// Verwirft den gesamten Bestand. Wird bei jedem Projektwechsel und nach jedem Import aufgerufen.

// NICHT HIER, UND GEMELDET:
//
// 1. WER `leereMotivBestand()` WANN RUFT, ENTSCHEIDET DER AUFRUFER (M5). Diese Datei
//    ruft sich nicht selbst auf - weder beim Projektwechsel noch nach einem Import. Sie
//    weiss von beidem nichts.
//
// 2. VORUEBERGEHENDER LADEFEHLER VS. WIRKLICH FEHLENDES MEDIUM - LUECKE IM
//    GESAMTVERTRAG, s. STOPP-Block des Issues. Diese Funktion kann beides nicht
//    unterscheiden; beides wird zu `fehlt` und damit zu einem Platzhalter. Die Sperre
//    "kein Platzhalter im finalen Render" (TK 9.10.7) sitzt im `composer`
//    (Reparatur-Modus 9.7.5) und entscheidet nach dem ASSET-ZUSTAND, nicht nach dem
//    Ergebnis dieses Aufrufs. Scheitert das Laden also voruebergehend, obwohl
//    `Asset.zustand === "ok"` ist, greift sie nicht. Absichtlich NICHT hier geheilt:
//    Eine Wiederholungsschleife oder eine Zusatzmeldung verdeckte die Luecke, statt sie
//    zu schliessen.
//
// 3. `Asset.zustand` WIRD HIER NICHT GELESEN (Festlegung 6). Massgeblich ist allein, ob
//    die Bytes ankommen; der Projektzustand im Renderer kann veraltet sein, und zwei
//    Wahrheiten ueber "ist das Bild da?" liefen auseinander.
//
// 4. DIE OFFENE FRAGE "BEDIENT `media://` JEDE `projektId`?" IST INZWISCHEN
//    ENTSCHIEDEN - und zwar gegen diese Datei. Der STOPP-Block des Issues fuehrt sie
//    noch als offen; #50 ist seit dem 12.08.2026 gebaut und weist ein FREMDES Projekt
//    mit 403 ab, ohne die Platte anzufassen (belegt in
//    tests/unit/project-store-media-protokoll.spec.ts, "weist ein FREMDES Projekt ab").
//    Folge: Fuer jedes nicht offene Projekt liefert `ladeMotiv` stillschweigend `fehlt`.
//    Das ist hier ausdruecklich NICHT umgangen (kein `fetch`, kein Object-URL, kein
//    IPC-Kanal fuer Bilddaten). Wer Motive vorbereitet, muss das Projekt vorher oeffnen.
//
// 5. DAS MARKEN-LOGO LAEUFT NICHT UEBER DIESE DATEI. `marke.logo.datei` ist ein
//    GEBUENDELTES Asset und liegt nicht im Medienordner eines Projekts; `media://` (#50)
//    loest ausschliesslich dort auf. Das Logo hat seinen eigenen Ladeweg (#119,
//    `logo-laden.ts`), der denselben `Motiv`-Typ zurueckgibt. Hier steht bewusst KEIN
//    zweiter Zweig fuer Bundle-Pfade.
