// [ipc-gateway] marken-Kanaele verdrahten (#304).
//
// DIESE LUECKE IST IN FUENF MEILENSTEINEN AUFGETRETEN: Eine Fach-Operation ist gebaut,
// geprueft und gruene Tests - und niemand meldet sie am ipc-gateway an. Der marken-store
// (#282 bis #289) ist bereits vollstaendig geschrieben; ohne diese Datei bliebe er fuer die
// Oberflaeche unerreichbar: Der marken-editor (#295 bis #303, ebenfalls bereits geschrieben)
// haette keinen Weg, eine Marke zu lesen, anzulegen, zu bearbeiten, zu loeschen oder eine
// Datei zu importieren - FA-23 und FA-24 (beide Muss) blieben unbedienbar, obwohl der
// komplette Code fuer beide Seiten existiert. Die zweite Konsequenz betraf NFA-02: Ohne den
// Ereignis-Sender (eigene Datei, siehe dort) bliebe ein gescheitertes Speichern von
// marken.json vollstaendig unsichtbar.
//
// WAS DIESE DATEI NICHT IST: kein Zustand, keine Fachlogik, kein Ereignis-Versand, kein
// BrowserWindow, keine Lesen von Dateien, kein Lock. Sie reicht die Ergebnis-Huelle
// (TK 9.1.1 Punkt 2) UNVERAENDERT durch - nicht ausgepackt, nicht vereinfacht, nicht in
// eine Exception verwandelt.
//
// WARUM DIESE DATEI EINE EIGENE IST statt eines Zweigs in #238 (speicherstatus-verdrahtung.ts):
// Es gilt dieselbe Grenze wie bei M5-34 gegenueber #76 - "Ein Issue darf keine fremde Datei
// aendern." #238 ist eine fremde, bereits abgeschlossene Datei; verdrahteMarkenIPC ist
// zudem KEIN Ereignis-Sender und hat KEIN Fenster - sie gehoert zur Gruppe der Anmeldungen
// ohne Fenster (11. Anmeldung, hinter meldeExportHandlerAn; beide Aufrufe traegt #309 ein).

import { KANAELE } from '../../shared/contracts/kanaele' // #25
import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { SchriftRolle } from '../../shared/contracts/marke' // #52
import { abgelehnt, istGefuellterText, istObjekt, ohneNutzlast } from './nutzlast-pruefer' // #332
import { meldeAn } from './melde-an' // #333
import { listeMarken } from '../marken-store/liste' // #282
import { leseMarke } from '../marken-store/lese-marke' // #283
import { erstelleMarke } from '../marken-store/erstelle-marke' // #284
import { bearbeiteMarke } from '../marken-store/bearbeite-marke' // #285
import { pruefeMarkenReferenzen } from '../marken-store/referenzpruefung' // #286
import { löscheMarke } from '../marken-store/loesche-marke' // #287
import { entferneMarkenDatei, importiereMarkenDatei } from '../marken-store/dateien' // #289
import { öffneMarkenDateiDialog } from '../marken-store/dialog' // #306

// Fremde Aufrufe - GEPRUEFT AN DEN GEBAUTEN DATEIEN (07.10.2026), nicht nur aus dem Issue
// abgeschrieben. Nur die Form ist abweichungslos, MELDE, wenn der Bau anders lautet:
//   #282: listeMarken(): Promise<Ergebnis<Marke[], MarkenFehlercode>>
//   #283: leseMarke(markeId: string): Promise<Ergebnis<Marke, MarkenFehlercode>>
//   #284: erstelleMarke(name: string, parentId: string | null)
//          : Promise<Ergebnis<Marke, MarkenFehlercode>> - parentId ist PFLICHT-Parameter
//          mit "| null", NICHT optional (ein echtes Argument-Loch zwischen 'fehlend' und
//          'null' waere nicht unterscheidbar).
//   #285: bearbeiteMarke(markeId: string, teilwerte: MarkenTeilwerte)
//          : Promise<Ergebnis<Marke, MarkenFehlercode>> - die feldweise Pruefung der
//          MarkenFeld-Sentinel (eigen gesetzt / geerbt / unveraendert) macht #285, hier
//          prueft nur die FORM.
//   #286: pruefeMarkenReferenzen(markeId: string)
//          : Promise<Ergebnis<Markennutzung, MarkenFehlercode>>
//   #287: löscheMarke(markeId: string): Promise<Ergebnis<void, MarkenFehlercode>>
//   #289: importiereMarkenDatei(markeId, art, schriftRolle, quellPfad)
//          : Promise<Ergebnis<Marke, MarkenFehlercode>> - art MUSS exakt 'logo' oder
//          'schrift' sein; schriftRolle ist PFLICHT mit "| null"; bei 'logo' NULL,
//          bei 'schrift' ueberlaesst die Pruefung der Rolle #289 (nur "vorhanden und
//          String|null", nicht die zulaessigen Rollenwerte - die Fachpruefung ist dort).
//          entferneMarkenDatei(markeId, art, schriftRolle) - dieselbe Form-Pruefung.
//   #306: öffneMarkenDateiDialog(art: 'logo' | 'schrift')
//          : Promise<Ergebnis<{ pfade: string[] }>> - KEIN zweites Typargument; diese
//          Operation erzeugt keinen fachlichen MarkenFehlercode. Ein Abbruch des Nutzers
//          ist ERFOLG mit leerer Liste und wird hier NICHT in einen Fehler umgedeutet
//          und die Pfade werden NICHT nachgefiltert.
//   #278: aufMarkenSpeichernEreignis(hoerer): () => void - siehe Eigen-Datei.

/**
 * Die neun Instant-Kanäle - jede mit eigener Form-Pruefung, VOR jeder Wirkung.
 *
 * "Der Main validiert jede eingehende Nutzlast - er vertraut dem Renderer nicht. Ungültige
 * Eingabe -> ungueltige_eingabe, ohne jede Wirkung auf die Daten. Ein Fehler im Renderer
 * darf D1 niemals beschädigen." (TK 9.1.1, Punkt 6) - dieselbe Sorgfalt gilt hier fuer den
 * Marken-Bestand (marken.json).
 *
 * Geprueft wird die FORM, nicht die Fachlichkeit: Ob die markeId existiert, ob die
 * Ableitungskette zu lang ist, ob art zu schriftRolle passt fachlich, ob die Datei
 * in der Whitelist steht - das pruefen die jeweiligen Operationen (#283 bis #289),
 * nicht diese Datei.
 *
 * KEINE UUID-Formpruefung, keine Pfad-Pruefung der markeId: #76 hat die schaerfere
 * Pruefung (UUID-Form, kein /, kein \, kein ..) ausdruecklich NUR fuer
 * project:listeAusgaben eingefuehrt, weil dessen projektId am Ende der Kette zu einem
 * Pfad-Segment wird. Keine markeId dieses Blocks wird in dieser Datei zu einem Pfad -
 * das leistet, falls noetig, #288 main-intern.
 *
 * Alle Kanalnamen kommen aus der Registry (#25); in dieser Datei steht kein einziger
 * Kanalname als Zeichenkette. Ein vertippter Name waere sonst kein Uebersetzungsfehler,
 * sondern ein Aufruf, der zur Laufzeit ins Leere laeuft.
 */
export function verdrahteMarkenIPC(): void {
  // 1. marken:listeMarken - keine Nutzlast erwartet; eine trotzdem uebergebene wird
  //    IGNORIERT, nicht abgelehnt (#332, ohneNutzlast): Die Operation nimmt kein Argument,
  //    eine mitgeschickte Nutzlast haette keine Wirkung; die uebliche Aufrufform schickt
  //    ohnehin undefined mit.
  meldeAn(KANAELE.marken.listeMarken, ohneNutzlast, () => listeMarken())

  // 2. marken:leseMarke - Objekt { markeId }; markeId nicht leerer String.
  meldeAn(
    KANAELE.marken.leseMarke,
    (nutzlast: unknown): Ergebnis<{ markeId: string }, 'ungueltige_eingabe'> => {
      if (!istObjekt(nutzlast)) return abgelehnt('leseMarke erwartet ein Objekt { markeId }.')
      const markeId = nutzlast.markeId
      if (!istGefuellterText(markeId)) return abgelehnt('leseMarke braucht eine nicht leere markeId.')
      return { ok: true, wert: { markeId } }
    },
    ({ markeId }) => leseMarke(markeId),
  )

  // 3. marken:erstelleMarke - Objekt { name, parentId }; name nicht leerer String;
  //    parentId ist PFLICHT-Feld mit | null und traegt KEINEN dritten Zustand: fehlt das
  //    Feld (undefined) oder traegt '' , ist die Nutzlast ungueltig - die Umkehrung der
  //    M5-34-Regel, weil der bereits geschriebene Main-Code (#284) exakt zwei gueltige
  //    Werte verlangt. Keine Vorbelegung, kein Trimmen (Verbot "keine Nutzlast-Reparatur";
  //    der trim in #284 ist Fachlogik dort, nicht Form-Hier).
  meldeAn(
    KANAELE.marken.erstelleMarke,
    (nutzlast: unknown): Ergebnis<{ name: string; parentId: string | null }, 'ungueltige_eingabe'> => {
      if (!istObjekt(nutzlast)) {
        return abgelehnt('erstelleMarke erwartet ein Objekt { name, parentId }.')
      }
      const name = nutzlast.name
      if (!istGefuellterText(name)) return abgelehnt('erstelleMarke braucht einen nicht leeren name.')
      if (!('parentId' in nutzlast)) {
        return abgelehnt('erstelleMarke verlangt parentId (null oder nicht leerer String).')
      }
      const parentId = nutzlast.parentId
      if (parentId !== null && !istGefuellterText(parentId)) {
        return abgelehnt('erstelleMarke: parentId darf nur null oder ein nicht leerer String sein.')
      }
      return { ok: true, wert: { name, parentId } }
    },
    ({ name, parentId }) => erstelleMarke(name, parentId),
  )

  // 4. marken:bearbeiteMarke - Objekt { markeId, teilwerte }; teilwerte ist ein Objekt
  //    (nicht undefined, kein Array, kein String, keine Zahl). Die feldweise Pruefung der
  //    Rollen und der MarkenFeld-Sentinel macht #285; das { geerbt: true }-Objekt reist
  //    UNVERAENDERT weiter - hier wird es nicht aufgeloest oder umgeformt.
  meldeAn(
    KANAELE.marken.bearbeiteMarke,
    (nutzlast: unknown): Ergebnis<{ markeId: string; teilwerte: unknown }, 'ungueltige_eingabe'> => {
      if (!istObjekt(nutzlast)) {
        return abgelehnt('bearbeiteMarke erwartet ein Objekt { markeId, teilwerte }.')
      }
      const markeId = nutzlast.markeId
      if (!istGefuellterText(markeId)) {
        return abgelehnt('bearbeiteMarke braucht eine nicht leere markeId.')
      }
      if (!istObjekt(nutzlast.teilwerte)) {
        return abgelehnt('bearbeiteMarke braucht teilwerte als Objekt (nicht Array, nicht leer).')
      }
      return { ok: true, wert: { markeId, teilwerte: nutzlast.teilwerte } }
    },
    ({ markeId, teilwerte }) =>
      // SAFETY: der Validierer hat teilwerte oben als Objekt geprueft; #285 erwartet
      // MarkenTeilwerte und prueft die Felder selbst.
      bearbeiteMarke(markeId, teilwerte as Parameters<typeof bearbeiteMarke>[1]),
  )

  // 5. marken:pruefeMarkenReferenzen - Objekt { markeId }; reine Lese-Operation, alle
  //    drei Trefferlisten reisen unveraendert durch (auch die leeren).
  meldeAn(
    KANAELE.marken.pruefeMarkenReferenzen,
    (nutzlast: unknown): Ergebnis<{ markeId: string }, 'ungueltige_eingabe'> => {
      if (!istObjekt(nutzlast)) {
        return abgelehnt('pruefeMarkenReferenzen erwartet ein Objekt { markeId }.')
      }
      const markeId = nutzlast.markeId
      if (!istGefuellterText(markeId)) {
        return abgelehnt('pruefeMarkenReferenzen braucht eine nicht leere markeId.')
      }
      return { ok: true, wert: { markeId } }
    },
    ({ markeId }) => pruefeMarkenReferenzen(markeId),
  )

  // 6. marken:loescheMarke - Objekt { markeId }. Der Registry-Schluessel traegt ASCII,
  //    die Operation traegt den Umlaut (löscheMarke, #287); beides Vertrag.
  meldeAn(
    KANAELE.marken.loescheMarke,
    (nutzlast: unknown): Ergebnis<{ markeId: string }, 'ungueltige_eingabe'> => {
      if (!istObjekt(nutzlast)) return abgelehnt('löscheMarke erwartet ein Objekt { markeId }.')
      const markeId = nutzlast.markeId
      if (!istGefuellterText(markeId)) {
        return abgelehnt('löscheMarke braucht eine nicht leere markeId.')
      }
      return { ok: true, wert: { markeId } }
    },
    ({ markeId }) => löscheMarke(markeId),
  )

  // 7. marken:importiereMarkenDatei - Objekt { markeId, art, schriftRolle, quellPfad };
  //    art exakt 'logo' oder 'schrift'; schriftRolle PFLICHT mit | null (fehlt oder ''
  //    -> ungueltige_eingabe - bei 'logo' null, bei 'schrift' ein Rollenname; ob die
  //    Paarung art/schriftRolle fachlich zusammenpasst, prueft #289); quellPfad
  //    nicht leerer String.
  meldeAn(
    KANAELE.marken.importiereMarkenDatei,
    (nutzlast: unknown): Ergebnis<{ markeId: string; art: 'logo' | 'schrift'; schriftRolle: SchriftRolle | null; quellPfad: string }, 'ungueltige_eingabe'> => {
      if (!istObjekt(nutzlast)) {
        return abgelehnt('importiereMarkenDatei erwartet ein Objekt { markeId, art, schriftRolle, quellPfad }.')
      }
      const markeId = nutzlast.markeId
      if (!istGefuellterText(markeId)) {
        return abgelehnt('importiereMarkenDatei braucht eine nicht leere markeId.')
      }
      if (nutzlast.art !== 'logo' && nutzlast.art !== 'schrift') {
        return abgelehnt("importiereMarkenDatei braucht art als 'logo' oder 'schrift'.")
      }
      if (!('schriftRolle' in nutzlast)) {
        return abgelehnt('importiereMarkenDatei verlangt schriftRolle (null oder Rollenname).')
      }
      const schriftRolle = nutzlast.schriftRolle
      if (schriftRolle !== null && !istGefuellterText(schriftRolle)) {
        return abgelehnt('importiereMarkenDatei: schriftRolle darf nur null oder ein Rollenname sein.')
      }
      // SAFETY: schriftRolle ist oben als "null oder nicht leerer String" geprueft; ob der
      // String EINE der vier Rollen nennt, dazu traegt er hier keine Fachpruefung - lehnte
      // sie hier ab, muesste diese Datei die Rollen-Union kennen, und eine neue Rolle
      // wuerde zwei Stellen gleichzeitig aendern. #289 lehnt eine unbekannte Rolle ab
      // (Fachpruefung bekannter Form war dort der Vertrag). Der Cast benennt die gepruefte
      // Form, NICHT die Fachpruefung.
      const rolle = schriftRolle as SchriftRolle | null
      const quellPfad = nutzlast.quellPfad
      if (!istGefuellterText(quellPfad)) {
        return abgelehnt('importiereMarkenDatei braucht einen nicht leeren quellPfad.')
      }
      return { ok: true, wert: { markeId, art: nutzlast.art, schriftRolle: rolle, quellPfad } }
    },
    ({ markeId, art, schriftRolle, quellPfad }) =>
      importiereMarkenDatei(markeId, art, schriftRolle, quellPfad),
  )

  // 8. marken:entferneMarkenDatei - Objekt { markeId, art, schriftRolle }; dieselbe
  //    Form-Pruefung wie beim Import, nur ohne quellPfad.
  meldeAn(
    KANAELE.marken.entferneMarkenDatei,
    (nutzlast: unknown): Ergebnis<{ markeId: string; art: 'logo' | 'schrift'; schriftRolle: SchriftRolle | null }, 'ungueltige_eingabe'> => {
      if (!istObjekt(nutzlast)) {
        return abgelehnt('entferneMarkenDatei erwartet ein Objekt { markeId, art, schriftRolle }.')
      }
      const markeId = nutzlast.markeId
      if (!istGefuellterText(markeId)) {
        return abgelehnt('entferneMarkenDatei braucht eine nicht leere markeId.')
      }
      if (nutzlast.art !== 'logo' && nutzlast.art !== 'schrift') {
        return abgelehnt("entferneMarkenDatei braucht art als 'logo' oder 'schrift'.")
      }
      if (!('schriftRolle' in nutzlast)) {
        return abgelehnt('entferneMarkenDatei verlangt schriftRolle (null oder Rollenname).')
      }
      const schriftRolle = nutzlast.schriftRolle
      if (schriftRolle !== null && !istGefuellterText(schriftRolle)) {
        return abgelehnt('entferneMarkenDatei: schriftRolle darf nur null oder ein Rollenname sein.')
      }
      // SAFETY: dieselbe begrenzte Behauptung wie beim Import (SCHRITT 7): Die Form ist
      // geprueft, die Rollen-Union prueft #289.
      const rolle = schriftRolle as SchriftRolle | null
      return { ok: true, wert: { markeId, art: nutzlast.art, schriftRolle: rolle } }
    },
    ({ markeId, art, schriftRolle }) => entferneMarkenDatei(markeId, art, schriftRolle),
  )

  // 9. marken:öffneMarkenDateiDialog - Objekt { art }; art exakt 'logo' oder 'schrift';
  //    KEIN weiteres Feld wird geprueft, KEINE markeId erwartet (der Dialog weiss
  //    nicht, fuer welche Marke er oeffnet, und braucht es nicht, #306).
  meldeAn(
    KANAELE.marken.öffneMarkenDateiDialog,
    (nutzlast: unknown): Ergebnis<{ art: 'logo' | 'schrift' }, 'ungueltige_eingabe'> => {
      if (!istObjekt(nutzlast)) return abgelehnt('öffneMarkenDateiDialog erwartet ein Objekt { art }.')
      if (nutzlast.art !== 'logo' && nutzlast.art !== 'schrift') {
        return abgelehnt("öffneMarkenDateiDialog braucht art als 'logo' oder 'schrift'.")
      }
      return { ok: true, wert: { art: nutzlast.art } }
    },
    ({ art }) => öffneMarkenDateiDialog(art),
  )
}
