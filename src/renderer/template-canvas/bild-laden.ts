// GENERIERT aus dem Signaturblock von Issue #111.
// [template-canvas] Motiv über media:// laden und dekodieren
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
// GERUEST-PRUEFSUMME: d99f3a7ec8ab6713

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
// `file://`, kein `fetch`, kein IPC-Kanal fuer Bilddaten - IPC transportiert laut
// TK 9.1.1 Punkt 1 ausschliesslich gerenderte Segment-PNGs.
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

  // DIE URL WIRD ROH ZUSAMMENGESETZT - kein `encodeURIComponent`, keine eigene
  // Pfad- oder Musterpruefung (Festlegung 2). Zwei Gruende:
  //
  // 1. Es gibt nichts zu kodieren. `dateiname` ist laut TK 9.4.8 Punkt 1
  //    `<uuid>.<ext_kleingeschrieben>` OHNE Verzeichnisanteil, `projektId` eine UUID -
  //    beides enthaelt nur Zeichen, die in einer URL unveraendert stehen duerfen.
  // 2. Wichtiger: Ueber Gueltigkeit entscheidet EINE Instanz, der Main (#49/#50). Eine
  //    zweite Pruefung hier waere eine zweite Pfad-Autoritaet - und jede spaetere
  //    Verschaerfung dort erreichte diesen Code dann nicht mehr. Ungueltiges wird vom
  //    Main abgewiesen und kommt hier als `fehlt` an.
  //
  // Ohne Query, ohne Fragment, ohne fuehrenden oder doppelten Schraegstrich im
  // Pfadteil: #50 weist genau solche Adressen ab (geprueft in
  // tests/unit/project-store-media-protokoll.spec.ts).
  const url = `media://${projektId}/${dateiname}`

  // `new Image()` steht ABSICHTLICH VOR dem try: Fehlt der Konstruktor, ist das keine
  // Ladelage, sondern eine kaputte Umgebung (diese Datei laeuft nur im Renderer). Ein
  // solcher Fehler soll auffallen und nicht als Platzhalter im Bild landen.
  const bild = new Image()

  // Reihenfolge nach Festlegung 1: Element erzeugen, `src` setzen, DANN `decode()`
  // awaiten - `decode()` auf einem Bild ohne `src` lehnt ab.
  //
  // Das Bild wird NICHT in den DOM gehaengt und bekommt kein `crossOrigin`, kein
  // `loading` und keine Groessenattribute (Festlegung 8). Es dient allein als Quelle
  // fuer `ctx.drawImage`.
  bild.src = url

  try {
    // `await img.decode()` UND NICHT `onload` (Festlegung 1). `onload` bedeutet "die
    // Bytes sind da", NICHT "das Bild ist dekodiert". Wer nach `onload` zeichnet,
    // erzeugt ein Segment mit leerer oder halber Bildflaeche - in der Vorschau
    // vielleicht unauffaellig, im Endvideo aber dauerhaft. Genau diese Zusicherung
    // verlangt TK 9.10.3 Punkt 4: "Bilder sind vor dem Zeichnen dekodiert."
    //
    // KEIN eigener Timeout (Festlegung 5): `media://` liest eine LOKALE Datei, keine
    // Netzwerkressource. Ein Abbruch nach n Millisekunden machte das Ergebnis
    // zeitabhaengig - derselbe Aufruf liefe auf einem langsamen Rechner auf `fehlt`,
    // auf einem schnellen auf das Motiv, und "gleiche Eingabe -> gleiches Bild" waere
    // gebrochen.
    await bild.decode()
  } catch {
    // HIER ENDET JEDER LADEFEHLER: Datei nicht vorhanden, `Asset.zustand === "fehlt"`
    // (TK 9.4.7), Traversal-Verdacht, Lesefehler, fremdes Projekt - und ebenso Bytes,
    // die ankommen, aber kein dekodierbares Bild sind. Der Main antwortet in all diesen
    // Faellen mit einem Fehlerstatus, nie mit einer `Ergebnis<T>`-Huelle; welcher es
    // war, ist hier weder erkennbar noch von Belang.
    //
    // KEINE Wiederholungsschleife und KEINE Zusatzmeldung (s. STOPP-Vermerk am
    // Dateiende): Beides verdeckte die Luecke im Gesamtvertrag, statt sie zu schliessen.
    return FEHLT
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
// Baut die URL `media://${projektId}/${dateiname}`, lädt sie mit new Image() + await img.decode()
// und liefert das Ergebnis. Wirft NIE wegen eines Ladefehlers – jeder Ladefehler ist
// { zustand: 'fehlt' }.

export async function bereiteMotiveVor(
  projektId: string,
  eintraege: Array<{ schluessel: string; dateiname: string }>,
): Promise<void> {
  pruefeNichtLeer('projektId', projektId)

  // ALLE EINTRAEGE WERDEN VOR DEM ERSTEN LADEN GEPRUEFT, nicht erst wenn die Schleife
  // dort ankommt. Sonst haette ein Programmierfehler im letzten Eintrag bereits die
  // vorderen im Bestand abgelegt - ein halb vorbereiteter Bestand nach einem Wurf, den
  // der Aufrufer nach dem Abfangen nicht von einem vollstaendigen unterscheiden koennte.
  eintraege.forEach((eintrag, i) => {
    pruefeNichtLeer(`eintraege[${i}].schluessel`, eintrag.schluessel)
    pruefeNichtLeer(`eintraege[${i}].dateiname`, eintrag.dateiname)
  })

  // Der Zaehlerstand BEI START (Festlegung 9). Alles Weitere haengt daran.
  const gestartetIn = generation

  // GELADEN WIRD NEBENLAEUFIG, ABGELEGT WIRD DANACH IN EINGANGSREIHENFOLGE.
  //
  // Nebenlaeufig, weil die Ladevorgaenge voneinander unabhaengig sind und ein
  // Aktions-Editor mit einem Dutzend Motiven sonst ein Dutzend Mal nacheinander wartete.
  //
  // Abgelegt in Eingangsreihenfolge, weil `eintraege` denselben Schluessel zweimal
  // enthalten kann (zwei Aktionen mit demselben Bild-Asset): Wer die Ergebnisse in der
  // Reihenfolge ihres Eintreffens ablegte, liesse den ZUFALL entscheiden, welches
  // gewinnt. So gewinnt immer das letzte - "ein bereits vorhandener Schluessel wird
  // ueberschrieben" gilt damit auch innerhalb eines Aufrufs.
  //
  // `Promise.all` kann hier nicht ablehnen: `ladeMotiv` wirft nur bei leeren Argumenten,
  // und die sind oben schon ausgeschlossen. Ein einzelnes nicht ladbares Motiv wird zu
  // `{ zustand: 'fehlt' }` und haelt die uebrigen Eintraege nicht auf.
  const ergebnisse = await Promise.all(
    eintraege.map((eintrag) => ladeMotiv(projektId, eintrag.dateiname)),
  )

  // Wurde zwischenzeitlich geleert (Projektwechsel, Import), wird NICHTS mehr abgelegt.
  // Die Pruefung steht einmal vor der Ablage-Schleife und nicht in ihr: Zwischen ihr und
  // der letzten `set`-Zeile liegt kein `await`, es kann also nichts dazwischenkommen.
  if (generation !== gestartetIn) {
    return
  }

  eintraege.forEach((eintrag, i) => {
    const motiv = ergebnisse[i]
    if (motiv === undefined) {
      // Unerreichbar: `Promise.all` liefert genau so viele Ergebnisse wie Eingaben. Der
      // Zweig steht, weil `noUncheckedIndexedAccess` den Index-Zugriff als moeglicherweise
      // `undefined` fuehrt - und die Fluchttuer `ergebnisse[i]!` ist projektweit verboten
      // (eslint: no-non-null-assertion), weil sie Code geprueft aussehen laesst, der es
      // nicht ist.
      return
    }
    bestand.set(eintrag.schluessel, motiv)
  })
}
// Lädt jeden Eintrag über ladeMotiv(projektId, dateiname) und legt das Ergebnis unter seinem
// `schluessel` im Motiv-Bestand ab. `schluessel` ist die ASSET-ID (aktion.bildRef), NICHT der
// Dateiname – unter dieser ID schlägt das Zeichnen später nach. Wirft nie: ein nicht ladbares
// Motiv landet als { zustand: 'fehlt' } im Bestand. Ein bereits vorhandener Schlüssel wird
// überschrieben.

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
