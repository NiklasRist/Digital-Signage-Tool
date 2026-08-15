// GENERIERT aus dem Signaturblock von Issue #153.
// [ipc-gateway] Die beiden neuen project-store-Kanäle verdrahten
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
// GERUEST-PRUEFSUMME: a5734886a0d02f3b

import { KANAELE } from '../../shared/contracts/kanaele'                     // #25
import { setzeEinblendung } from '../project-store/setze-einblendung'        // #120
import { setzeElementReferenz } from '../project-store/setze-element-referenz' // #152
// Die vier Nutzlast-Pruefer liegen seit #332 an EINEM Ort - importiert, NICHT kopiert.
// Genau die vierfache Kopie war der Anlass fuer #332; eine fuenfte waere der Rueckfall.
import { abgelehnt, istGefuellterText, istObjekt } from './nutzlast-pruefer'  // #332
import { registriereHandler } from './registriere-handler'                   // #23

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Einblendung } from '../../shared/contracts/project'

// Fremde Aufrufe - vollstaendige Signaturen, GEPRUEFT AN DEN GEBAUTEN DATEIEN und NICHT
// aus dem Issue abgeschrieben. An ZWEI Stellen weichen sie vom Issue-Text ab (Vermerk 1
// am Dateiende): Das Issue fuehrt beide Operationen mit der einparametrigen Huelle
// `Ergebnis<Listenelement>`; gebaut sind sie mit `ProjectStoreFehlercode` als zweitem
// Parameter. Fuer diese Datei ist der Unterschied folgenlos - sie reicht die Huelle durch
// und `F` wird aus dem Rueckruf abgeleitet -, nachgeschlagen werden muss er trotzdem, weil
// ein hier ausgeschriebener falscher Rueckgabetyp die Codes beschnitte.
//   #23:  registriereHandler<T, F extends string>(
//           kanal: string,
//           validiere: (nutzlast: unknown) => Ergebnis<unknown, 'ungueltige_eingabe'>
//                                           | { ok: true; wert: unknown },
//           ausfuehren: (validierteNutzlast: unknown) => Promise<Ergebnis<T, F>>,
//         ): void
//         // validiert zuerst; bei ok:false laeuft `ausfuehren` GAR NICHT an. Faengt jede
//         // Ausnahme und uebersetzt sie in 'unbekannter_fehler'. Reicht das Ergebnis von
//         // `ausfuehren` UNVERAENDERT zurueck.
//   #120: setzeEinblendung(elementId: string, einblendung: Einblendung | null)
//           : Promise<Ergebnis<Listenelement, ProjectStoreFehlercode>>
//   #152: setzeElementReferenz(elementId: string, referenz: string)
//           : Promise<Ergebnis<Listenelement, ProjectStoreFehlercode>>

/**
 * Die eine Stelle, an der aus `unknown` etwas Getipptes wird.
 *
 * `registriereHandler` (#23) reicht der Fachoperation genau das herein, was der Validierer
 * als `wert` zurueckgegeben hat - seine Signatur schreibt aber `validierteNutzlast: unknown`,
 * der Typ geht auf dem Weg also verloren. Ohne diese Huelle stuende in JEDEM Kanal ein
 * eigenes `as`, das niemand mehr gegen seinen Validierer halten kann.
 *
 * ZEICHENGLEICH zu `meldeAn` in `project-store-verdrahtung.ts` (#76),
 * `config-store-verdrahtung.ts` (#77) und `auftrags-manager/ipc-verdrahtung.ts` (#71). Sie
 * zusammenzufuehren hiesse, fremde Dateien zu aendern - dieses Issue erlaubt genau zwei
 * Dateien. Die Doppelung ist am Dateiende gemeldet (Vermerk 2); sie ist derselbe Fall, den
 * #332 fuer die Nutzlast-Pruefer bereits aufgeloest hat.
 */
function meldeAn<W, T, F extends string>(
  kanal: string,
  pruefe: (nutzlast: unknown) => Ergebnis<W, 'ungueltige_eingabe'>,
  rufe: (geprueft: W) => Promise<Ergebnis<T, F>>,
): void {
  registriereHandler<T, F>(kanal, pruefe, (validierteNutzlast) => rufe(validierteNutzlast as W))
}

export function verdrahteProjectStoreNachtragIPC(): void {
  // Beide Namen kommen aus der Registry (#25); in dieser Datei steht kein einziger
  // Kanalname als Zeichenkette - auch nicht in einer Fehlermeldung.
  //
  // KEIN Schutz gegen einen zweiten Aufruf dieser Funktion (kein "schon registriert"-Merker):
  // #3 ruft genau einmal, und `ipcMain.handle` wirft bei doppelter Anmeldung von sich aus.
  // Der Wurf faellt beim Start des Hauptprozesses an und SOLL auffallen - er ist gerade die
  // Probe darauf, dass sich die Namensraeume von #76 und dieser Datei nicht ueberschneiden.
  //
  // KEIN Ereignis, keine Fensterreferenz, kein Zustand, kein eigenes try/catch (das gehoert
  // dem Wrapper #23), kein Lock, kein Dateizugriff.

  meldeAn(
    KANAELE.project.setzeEinblendung,
    // Der ausgeschriebene Rueckgabetyp steht ABSICHTLICH da: Er legt `W` der Huelle fest,
    // bevor der zweite Rueckruf getippt wird.
    (
      nutzlast: unknown,
    ): Ergebnis<{ elementId: string; einblendung: Einblendung | null }, 'ungueltige_eingabe'> => {
      if (!istObjekt(nutzlast)) {
        return abgelehnt('setzeEinblendung erwartet ein Objekt { elementId, einblendung }.')
      }
      // Erst in eine Konstante, dann pruefen: An einer Konstanten greift die Verengung durch
      // die Waechterfunktionen verlaesslich, an einem Feld eines Record-Typs nicht ueberall.
      const elementId = nutzlast.elementId
      if (!istGefuellterText(elementId)) {
        return abgelehnt('setzeEinblendung braucht eine nicht leere elementId.')
      }

      const einblendung = nutzlast.einblendung
      // DAS FEHLENDE FELD IST EIN FEHLER, KEIN `null`. `null` heisst "Band entfernen"
      // (#120) - eine loeschende Handlung. Wuerde ein fehlendes Feld als `null` gelesen,
      // vernichtete ein Fluechtigkeitsfehler in der Oberflaeche stillschweigend die Arbeit
      // des Nutzers. Bewusst ANDERS als `höhe` in #109, wo `null` der harmlose Normalfall
      // ist. Die Pruefung auf `undefined` deckt beide Formen ab - Feld gar nicht gesetzt und
      // Feld ausdruecklich `undefined` -, und das ist noetig, weil die Strukturklonung an
      // der IPC-Grenze ein `undefined`-Feld ohnehin nicht von einem fehlenden unterscheidet.
      //
      // GEMESSEN, nicht behauptet: Diese Wache allein zu entfernen aendert das Verhalten
      // NICHT - die Formpruefung darunter weist `undefined` ebenfalls ab. Sie steht trotzdem
      // hier, weil sie den ENTSCHEIDENDEN Fall benennt und ihn mit eigener Meldung abweist;
      // was wirklich beisst, ist die Vorbelegung (`nutzlast.einblendung ?? null`), und genau
      // die verbietet dieser Absatz. Beides ist als Gegenprobe belegt.
      if (einblendung === undefined) {
        return abgelehnt('setzeEinblendung braucht das Feld einblendung (Objekt oder null).')
      }
      // NUR die FORM wird geprueft. Die Felder des Bandes - `bandVorlageId`, `abschnitte`,
      // deren `dauer > 0`, die Existenz der Aktionen und die gerade Bandhoehe - prueft #120;
      // eine zweite, leicht abweichende Fachpruefung an dieser Stelle waere schlimmer als
      // keine. `istObjekt` weist dabei Arrays, Strings und Zahlen zurueck.
      if (einblendung !== null && !istObjekt(einblendung)) {
        return abgelehnt('setzeEinblendung erwartet fuer einblendung ein Objekt oder null.')
      }

      // Die Behauptung `as Einblendung | null` ist NICHT geprueft und soll es hier auch
      // nicht sein: Geprueft ist "Objekt oder null", und die feldweise Pruefung liegt in
      // #120. Sie steht an genau dieser einen Stelle, damit sie nachlesbar bleibt.
      //
      // NUR die zwei erwarteten Felder reisen weiter; ein Fremdfeld landete ueber die
      // Operation in project.json und bliebe dort. Das Band selbst wird dabei als DIESELBE
      // Objektreferenz durchgereicht - nicht kopiert, nicht ergaenzt, nicht getrimmt.
      return { ok: true, wert: { elementId, einblendung: einblendung as Einblendung | null } }
    },
    ({ elementId, einblendung }) => setzeEinblendung(elementId, einblendung),
  )

  meldeAn(
    KANAELE.project.setzeElementReferenz,
    (nutzlast: unknown): Ergebnis<{ elementId: string; referenz: string }, 'ungueltige_eingabe'> => {
      if (!istObjekt(nutzlast)) {
        return abgelehnt('setzeElementReferenz erwartet ein Objekt { elementId, referenz }.')
      }
      const elementId = nutzlast.elementId
      if (!istGefuellterText(elementId)) {
        return abgelehnt('setzeElementReferenz braucht eine nicht leere elementId.')
      }
      const referenz = nutzlast.referenz
      if (!istGefuellterText(referenz)) {
        return abgelehnt('setzeElementReferenz braucht eine nicht leere referenz.')
      }
      // KEINE UUID-Formpruefung, und das ist eine Festlegung: #76 hat die schaerfere Pruefung
      // (UUID-Form, kein Pfadtrenner, kein '..') ausdruecklich NUR fuer `listeAusgaben`
      // eingefuehrt, weil dessen `projektId` am Ende der Kette zu einem PFADSEGMENT wird.
      // `elementId` und `referenz` werden nie zu einem Pfad - sie werden ausschliesslich mit
      // IDs im bereits geladenen Projekt verglichen (#152). Ob die Referenz im richtigen
      // Bestand liegt (assets vs. aktionen, passender typ), entscheidet ebenfalls #152.
      return { ok: true, wert: { elementId, referenz } }
    },
    ({ elementId, referenz }) => setzeElementReferenz(elementId, referenz),
  )
}

// ---------------------------------------------------------------------------------------
// VERMERKE (Befunde aus dem Bau, KEINE Arbeitsauftraege an diese Datei)
//
// 1. SIGNATUR-ABWEICHUNG ZUM ISSUE-TEXT, offen benannt: #153 schreibt beide Operationen als
//    `Promise<Ergebnis<Listenelement>>` aus. GEBAUT sind sie als
//    `Promise<Ergebnis<Listenelement, ProjectStoreFehlercode>>`
//    ('speicher_fehler' | 'projekt_beschaeftigt' | 'kein_projekt'). Der gebaute Code gewinnt;
//    diese Datei schreibt den Rueckgabetyp nirgends aus, sondern leitet `F` aus dem Rueckruf
//    ab - die zusaetzlichen Codes reisen dadurch unbeschnitten zum Renderer. Dieselbe
//    Abweichung ist bereits fuer elf Operationen in #76 vermerkt.
//
// 2. DOPPELUNG `meldeAn`: Diese Huelle steht nun zum VIERTEN Mal im Projekt (#71, #76, #77,
//    hier). Sie zusammenzufuehren braucht ein eigenes Issue - dieselbe Klasse und derselbe
//    Weg wie #332 fuer die Nutzlast-Pruefer.
//
// 3. WEITERHIN OFFEN, hier nur gemeldet: `project:autoSpeichernStatus` (#47) hat im Main
//    KEINEN Sender. Die Empfangsseite im Renderer gibt es (#151, `abonniere`), #76 verbietet
//    sich den Sender ausdruecklich, und dieses Issue tut es ebenso. Solange die Luecke
//    besteht, kann `app-shell` den Hinweis "nicht gespeichert" (NFA-02, TK 9.5.4) nicht
//    zeigen. Zustaendig ist #238.
//
// 4. DER AUFRUF FEHLT NOCH: `verdrahteProjectStoreNachtragIPC()` steht in
//    `src/main/index.ts` als Luecke an Position 2 der Anmeldungen ohne Fenster, unmittelbar
//    nach `verdrahteProjectStoreIPC()`. `index.ts` ist nicht der Dateibereich dieses Issues;
//    nachzuziehen ist der Aufruf durch #3. Bis dahin sind beide Kanaele gebaut, aber im
//    laufenden Programm nicht angemeldet.
