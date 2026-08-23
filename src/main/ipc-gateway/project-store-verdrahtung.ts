// GENERIERT aus dem Signaturblock von Issue #76.
// [ipc-gateway] project-store-Kanäle verdrahten
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
// GERUEST-PRUEFSUMME: 9b549547cb91c9d9

import { KANAELE } from '../../shared/contracts/kanaele'                     // #25
import { oeffneProjektAblauf } from './projekt-oeffnen-ablauf'               // #94
import { listeAusgaben } from '../project-store/ausgaben'                    // #75
import { bearbeiteAktion } from '../project-store/bearbeite-aktion'          // #39
import { dupliziereProjekt } from '../project-store/dupliziere-projekt'      // #36
import { entferneElement } from '../project-store/entferne-element'          // #42
import { erstelleAktion } from '../project-store/erstelle-aktion'            // #38
import { erstelleProjekt } from '../project-store/erstelle-projekt'          // #33
import { fügeElementHinzu } from '../project-store/fuege-element-hinzu'      // #41
import { listeProjekte } from '../project-store/liste-projekte'              // #35
import { löscheAktion } from '../project-store/loesche-aktion'               // #40
import { löscheProjekt } from '../project-store/loesche-projekt'             // #37
import { ordneNeu } from '../project-store/ordne-neu'                        // #43
import { setzeDauer } from '../project-store/setze-dauer'                    // #45
import { setzeTrim } from '../project-store/setze-trim'                      // #44
import { meldeAn } from './melde-an'                                         // #333
// Die vier Nutzlast-Pruefer liegen seit #332 an EINEM Ort (Vermerk 4 am Dateiende).
import { abgelehnt, istGefuellterText, istObjekt, ohneNutzlast } from './nutzlast-pruefer' // #332

import type { Aktion } from '../../shared/contracts/aktion'
import type { Ergebnis } from '../../shared/contracts/ergebnis'

// Fremde Aufrufe - vollstaendige Signaturen, GEPRUEFT AN DEN GEBAUTEN DATEIEN und
// NICHT aus dem Issue abgeschrieben. An ELF Stellen weichen sie vom Issue-Text ab
// (s. Vermerk 3 am Dateiende): Der Issue-Text fuehrt die meisten Operationen mit der
// einparametrigen Huelle `Ergebnis<T>`; gebaut sind sie mit `ProjectStoreFehlercode`
// als zweitem Parameter. Fuer diese Datei ist der Unterschied folgenlos - sie reicht
// die Huelle durch und `F` wird aus dem Rueckruf abgeleitet -, aber nachgeschlagen
// werden muss er, weil ein hier ausgeschriebener falscher Rueckgabetyp die Codes
// beschnitte.
//   #23: registriereHandler<T, F extends string>(
//          kanal: string,
//          validiere: (nutzlast: unknown) => Ergebnis<unknown, 'ungueltige_eingabe'>
//                                          | { ok: true; wert: unknown },
//          ausfuehren: (validierteNutzlast: unknown) => Promise<Ergebnis<T, F>>,
//        ): void
//        // validiert zuerst; bei ok:false laeuft `ausfuehren` GAR NICHT an. Faengt jede
//        // Ausnahme und uebersetzt sie in 'unbekannter_fehler'. Reicht das Ergebnis von
//        // `ausfuehren` UNVERAENDERT zurueck.
//   #33: erstelleProjekt(name: string): Promise<Ergebnis<Project, ProjectStoreFehlercode>>
//   #94: oeffneProjektAblauf(projektId: string)
//          : Promise<Ergebnis<Project, ProjectStoreFehlercode | ReconcileFehlercode | 'schema_zu_neu'>>
//   #35: listeProjekte(): Promise<Ergebnis<ProjektMeta[], ProjectStoreFehlercode>>
//   #36: dupliziereProjekt(id: string, neuerName: string)
//          : Promise<Ergebnis<Project, ProjectStoreFehlercode>>
//   #37: löscheProjekt(id: string): Promise<Ergebnis<void, ProjectStoreFehlercode>>
//   #38: erstelleAktion(aktionsdaten: Omit<Aktion, 'id'>)
//          : Promise<Ergebnis<Aktion, ProjectStoreFehlercode>>
//   #39: bearbeiteAktion(id: string, aktionsdaten: Partial<Omit<Aktion, 'id'>>)
//          : Promise<Ergebnis<Aktion, ProjectStoreFehlercode>>
//   #40: löscheAktion(id: string): Promise<Ergebnis<{ stand: Bearbeitungsstand
//          entfernteElementIds: string[]; geaenderteElementIds: string[] }, ProjectStoreFehlercode>>
//   #41: fügeElementHinzu(referenz: string)
//          : Promise<Ergebnis<Listenelement, ProjectStoreFehlercode>>
//   #42: entferneElement(elementId: string): Promise<Ergebnis<void, ProjectStoreFehlercode>>
//   #43: ordneNeu(reihenfolge: string[]): Promise<Ergebnis<void, ProjectStoreFehlercode>>
//   #44: setzeTrim(elementId: string, trimStart: number, trimEnde: number)
//          : Promise<Ergebnis<Listenelement, ProjectStoreFehlercode>>
//   #45: setzeDauer(elementId: string, dauer: number)
//          : Promise<Ergebnis<Listenelement, ProjectStoreFehlercode>>
//   #75: listeAusgaben(projektId: string)
//          : Promise<Ergebnis<AusgabeDatei[], ProjectStoreFehlercode>>

/**
 * Die Anmelde-Huelle ist seit #333 nach `./melde-an.ts` umgezogen (dort der volle
 * Kommentarapparat). Sie steht hier nicht mehr.
 */

/**
 * "endliche Zahl" (Pruef-Tabelle des Issues) - `Number.isFinite` und NICHT `typeof === 'number'`.
 *
 * Der Unterschied ist genau der Fehlerpfad, den die Tabelle nennt: `NaN` und `Infinity` sind
 * `number`. Ein `NaN` als Dauer liefe durch jede Bereichspruefung von #45 hindurch (jeder
 * Vergleich mit `NaN` ist falsch, `dauer < 10` also auch) und stuende danach in `project.json`
 * - und `JSON.stringify` macht daraus `null`, womit das Projekt beim naechsten Oeffnen als
 * beschaedigt gilt.
 *
 * `Number.isFinite` und nicht das globale `isFinite`: Das globale wandelt sein Argument erst
 * um, `isFinite("20")` ist also `true` - und genau der numerische String ist laut Tabelle
 * ausdruecklich ungueltig.
 */
function istEndlicheZahl(wert: unknown): wert is number {
  return typeof wert === 'number' && Number.isFinite(wert)
}

/**
 * Die UUID-Form nach TK 9.11.4 - acht/vier/vier/vier/zwoelf Hexziffern.
 *
 * Gross- und Kleinschreibung sind beide erlaubt (`i`): `crypto.randomUUID` (#20) liefert
 * zwar klein, aber eine per Hand kopierte ID aus einem Ordnernamen darf an dieser Pruefung
 * nicht scheitern - sie soll Pfadangriffe abweisen, nicht Schreibweisen.
 *
 * Die Version wird NICHT festgeschrieben (kein `4` an fester Stelle): Das waere eine Aussage
 * ueber den Generator, die diese Datei nicht treffen darf - wechselt #20 je einmal die
 * Fassung, waere jedes bestehende Projekt aus der Ausgabe-Liste ausgesperrt.
 */
const UUID_FORM = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Beide Pfadtrenner, unabhaengig von der laufenden Plattform - ein unter Windows
 *  geschriebener Wert wandert per USB-Stick auf einen Mac (gleiche Linie wie #75/#94). */
const PFADTRENNER = ['/', '\\']

/**
 * Die EINE schaerfere Pruefung dieser Datei, und sie steht hier mit Grund.
 *
 * Diese `projektId` wird am Ende der Kette zu einem PFADSEGMENT: #75 reicht sie unveraendert
 * an `ausgabeOrdner` (#49) weiter, und das ist eine reine String-Operation ohne eigene
 * Schranke. Eine `projektId` wie `../../..` liesse also einen Ordner AUSSERHALB des
 * Datenbestands auflisten, und dessen Dateinamen, Groessen und Zeiten gingen an den Renderer.
 * Deshalb sitzt die Pruefung hier, an der Stelle, an der Renderer-Daten in den Main kommen
 * (TK 9.1.1 Punkt 6).
 *
 * DIE DREI EXPLIZITEN VERBOTE SIND ABSICHTLICH REDUNDANT: Die UUID-Form schliesst `/`, `\`
 * und `..` bereits aus. Sie stehen trotzdem da, weil sie das ZIEL der Pruefung benennen -
 * wer die Form spaeter lockert (etwa fuer sprechende Projekt-IDs), sieht dann sofort, was
 * dabei erhalten bleiben MUSS, statt die Traversal-Sperre versehentlich mit zu entfernen.
 *
 * NICHT geprueft wird, ob es das Projekt gibt - das ist Fachlichkeit und bleibt bei #75.
 * Und NICHT ausgeweitet wird die Pruefung auf die uebrigen dreizehn Kanaele (Entscheidung
 * des Issues): Deren Projekt-IDs pruefen #34, #36 und #37 selbst, und zwei gleichlautende,
 * aber leicht abweichende Pruefungen sind schlimmer als eine.
 */
function istProjektIdSegment(wert: unknown): wert is string {
  if (!istGefuellterText(wert)) return false
  if (PFADTRENNER.some((trenner) => wert.includes(trenner))) return false
  if (wert.includes('..')) return false
  return UUID_FORM.test(wert)
}

export function verdrahteProjectStoreIPC(): void {
  // Alle vierzehn Namen kommen aus der Registry (#25); in dieser Datei steht kein einziger
  // Kanalname als Zeichenkette - auch nicht in einer Fehlermeldung. Ein Tippfehler waere
  // sonst erst zur Laufzeit sichtbar, und zwar als Aufruf, der ins Leere laeuft, nicht als
  // Uebersetzungsfehler.
  //
  // KEIN Schutz gegen einen zweiten Aufruf dieser Funktion (kein "schon registriert"-Merker):
  // #3 ruft genau einmal, und `ipcMain.handle` wirft bei einer doppelten Anmeldung von sich
  // aus (#23, nachgelesen). Dieser Wurf faellt beim Start des Hauptprozesses an und SOLL
  // auffallen; ein Merker verdeckte einen echten Fehler im Bootstrap.
  //
  // KEIN Ereignis, keine Fensterreferenz, kein Zustand - insbesondere kein Sender fuer den
  // Speicherstatus (s. Vermerk 1 am Dateiende).

  // ------------------------------------------------------------------ Projektverwaltung
  meldeAn(
    KANAELE.project.erstelleProjekt,
    // Der ausgeschriebene Rueckgabetyp steht ABSICHTLICH da: Er legt `W` der Huelle fest,
    // bevor der zweite Rueckruf getippt wird - ohne ihn muesste TypeScript `W` aus zwei
    // zugleich kontextabhaengigen Funktionen erraten.
    (nutzlast: unknown): Ergebnis<{ name: string }, 'ungueltige_eingabe'> => {
      if (!istObjekt(nutzlast)) return abgelehnt('erstelleProjekt erwartet ein Objekt { name }.')
      // Erst in eine Konstante, dann pruefen: An einer Konstanten greift die Verengung durch
      // die Waechterfunktionen verlaesslich, an einem Feld eines Record-Typs nicht ueberall.
      const name = nutzlast.name
      if (!istGefuellterText(name)) return abgelehnt('erstelleProjekt braucht einen nicht leeren name.')
      // NUR das eine erwartete Feld reist weiter; ein Fremdfeld landete ueber die Operation
      // in project.json und bliebe dort.
      return { ok: true, wert: { name } }
    },
    // KEINE Namensbereinigung, keine Kollisionspruefung: Was ein zulaessiger Projektname ist
    // und was daraus fuer ein Ordnername wird, entscheidet #33.
    ({ name }) => erstelleProjekt(name),
  )

  // DER KANAL FUERS OEFFNEN RUFT `oeffneProjektAblauf` (#94) UND NICHT `öffneProjekt` (#34).
  //
  // Das ist verbindlich und keine Bequemlichkeit: Beim Oeffnen muessen DREI Schritte in fester
  // Reihenfolge laufen - Projekt laden (#34), Q2 wiederherstellen (#67), Reconcile (#91) -,
  // und zwar "beim Oeffnen eines Projekts, BEVOR die UI Medien zeigt" (TK 9.4.7). Riefe dieser
  // Kanal direkt #34, bekaeme die Oberflaeche das Projekt in dem Moment zurueck, in dem es
  // geladen ist, und zeigte Medien an, die es auf der Platte nicht mehr gibt; der Nutzer
  // stellte eine Liste zusammen, und der Render schluege dann mitten im Lauf fehl statt frueh.
  meldeAn(
    KANAELE.project.öffneProjekt,
    (nutzlast: unknown): Ergebnis<{ id: string }, 'ungueltige_eingabe'> => {
      if (!istObjekt(nutzlast)) return abgelehnt('öffneProjekt erwartet ein Objekt { id }.')
      const id = nutzlast.id
      if (!istGefuellterText(id)) return abgelehnt('öffneProjekt braucht eine nicht leere id.')
      return { ok: true, wert: { id } }
    },
    ({ id }) => oeffneProjektAblauf(id),
  )

  meldeAn(KANAELE.project.listeProjekte, ohneNutzlast, () => listeProjekte())

  meldeAn(
    KANAELE.project.dupliziereProjekt,
    (nutzlast: unknown): Ergebnis<{ id: string; neuerName: string }, 'ungueltige_eingabe'> => {
      if (!istObjekt(nutzlast)) {
        return abgelehnt('dupliziereProjekt erwartet ein Objekt { id, neuerName }.')
      }
      const id = nutzlast.id
      const neuerName = nutzlast.neuerName
      if (!istGefuellterText(id)) return abgelehnt('dupliziereProjekt braucht eine nicht leere id.')
      if (!istGefuellterText(neuerName)) {
        return abgelehnt('dupliziereProjekt braucht einen nicht leeren neuerName.')
      }
      return { ok: true, wert: { id, neuerName } }
    },
    ({ id, neuerName }) => dupliziereProjekt(id, neuerName),
  )

  meldeAn(
    KANAELE.project.löscheProjekt,
    (nutzlast: unknown): Ergebnis<{ id: string }, 'ungueltige_eingabe'> => {
      if (!istObjekt(nutzlast)) return abgelehnt('löscheProjekt erwartet ein Objekt { id }.')
      const id = nutzlast.id
      if (!istGefuellterText(id)) return abgelehnt('löscheProjekt braucht eine nicht leere id.')
      return { ok: true, wert: { id } }
    },
    // KEINE Sicherheitsabfrage und kein Blick auf das aktive Projekt: Diese Datei enthaelt
    // keine Fachlogik. Die Rueckfrage stellt die Oberflaeche, die Folgen regelt #37.
    ({ id }) => löscheProjekt(id),
  )

  // -------------------------------------------------------------------------- Aktionen
  meldeAn(
    KANAELE.project.erstelleAktion,
    // `aktionsdaten` reist als `unknown` weiter, obwohl es hier als Objekt erkannt wurde:
    // Seine FORM ist Sache von #38, und ein `Record<string, unknown>` an dieser Stelle waere
    // eine Aussage ueber sie, die diese Datei nicht treffen darf. Sie zwaenge die Umschreibung
    // unten ausserdem ueber zwei Stufen, weil ein Record sich mit `Omit<Aktion, 'id'>` nicht
    // ueberschneidet.
    (nutzlast: unknown): Ergebnis<{ aktionsdaten: unknown }, 'ungueltige_eingabe'> => {
      if (!istObjekt(nutzlast)) {
        return abgelehnt('erstelleAktion erwartet ein Objekt { aktionsdaten }.')
      }
      const aktionsdaten = nutzlast.aktionsdaten
      // NICHT TIEFER (Pruef-Tabelle des Issues): Ob Titel, Vorlage und Zonen stimmen,
      // entscheidet #38 - und tut es nachweislich, feldweise. Eine hier nachgebaute zweite
      // Fachpruefung waere die naechste Stelle, die beim Erweitern von `Aktion` vergessen
      // wird, und sie waere dann STRENGER als die Fachoperation: ein Feld, das #38 laengst
      // kennt, kaeme gar nicht erst bei ihm an.
      if (!istObjekt(aktionsdaten)) {
        return abgelehnt('erstelleAktion braucht ein Objekt als aktionsdaten.')
      }
      return { ok: true, wert: { aktionsdaten } }
    },
    // DIE EINE BEHAUPTUNG DIESER DATEI - und sie behauptet weniger, als sie aussieht: Gedeckt
    // ist sie dadurch, dass #38 die Felder SELBST prueft und eine unpassende Eingabe mit
    // `ungueltige_eingabe` abweist (nachgelesen in erstelle-aktion.ts, Formpruefung vor dem
    // Lock). Der Typechecker verliert hier also eine Zusage, die einen Schritt weiter zur
    // Laufzeit erneut eingeloest wird.
    // SAFETY: #38 prueft die Felder in erstelleAktion selbst (Ergebnis-Huelle); der Cast
    // benennt die erwartete Form, die dort erneut eingeloest wird.
    ({ aktionsdaten }) => erstelleAktion(aktionsdaten as Omit<Aktion, 'id'>),
  )

  meldeAn(
    KANAELE.project.bearbeiteAktion,
    (nutzlast: unknown): Ergebnis<{ id: string; aktionsdaten: unknown }, 'ungueltige_eingabe'> => {
      if (!istObjekt(nutzlast)) {
        return abgelehnt('bearbeiteAktion erwartet ein Objekt { id, aktionsdaten }.')
      }
      const id = nutzlast.id
      const aktionsdaten = nutzlast.aktionsdaten
      if (!istGefuellterText(id)) return abgelehnt('bearbeiteAktion braucht eine nicht leere id.')
      // Ein LEERES Objekt ist gueltig: "aendere nichts" ist eine zulaessige Teilaenderung,
      // und welche Felder gesetzt werden duerfen, entscheidet #39.
      if (!istObjekt(aktionsdaten)) {
        return abgelehnt('bearbeiteAktion braucht ein Objekt als aktionsdaten.')
      }
      return { ok: true, wert: { id, aktionsdaten } }
    },
    // SAFETY: die Validierungsfunktion hat die Objektform von aktionsdaten unmittelbar
    // zuvor belegt; #38 prueft die Felder (Ergebnis-Huelle) einen Schritt weiter.
    ({ id, aktionsdaten }) => bearbeiteAktion(id, aktionsdaten as Partial<Omit<Aktion, 'id'>>),
  )

  meldeAn(
    KANAELE.project.löscheAktion,
    (nutzlast: unknown): Ergebnis<{ id: string }, 'ungueltige_eingabe'> => {
      if (!istObjekt(nutzlast)) return abgelehnt('löscheAktion erwartet ein Objekt { id }.')
      const id = nutzlast.id
      if (!istGefuellterText(id)) return abgelehnt('löscheAktion braucht eine nicht leere id.')
      return { ok: true, wert: { id } }
    },
    // Die Kaskade auf die Listenelemente und der Bearbeitungsstand im Ergebnis gehoeren #40;
    // hier wird nichts davon nachgerechnet und nichts davon umgeformt.
    ({ id }) => löscheAktion(id),
  )

  // ---------------------------------------------------------------------- Wiedergabeliste
  meldeAn(
    KANAELE.project.fügeElementHinzu,
    (nutzlast: unknown): Ergebnis<{ referenz: string }, 'ungueltige_eingabe'> => {
      if (!istObjekt(nutzlast)) {
        return abgelehnt('fügeElementHinzu erwartet ein Objekt { referenz }.')
      }
      const referenz = nutzlast.referenz
      if (!istGefuellterText(referenz)) {
        return abgelehnt('fügeElementHinzu braucht eine nicht leere referenz.')
      }
      return { ok: true, wert: { referenz } }
    },
    // Ob die Referenz auf ein Asset oder eine Aktion zeigt und ob es sie gibt, schlaegt #41
    // nach - diese Datei kennt den Bestand nicht.
    ({ referenz }) => fügeElementHinzu(referenz),
  )

  meldeAn(
    KANAELE.project.entferneElement,
    (nutzlast: unknown): Ergebnis<{ elementId: string }, 'ungueltige_eingabe'> => {
      if (!istObjekt(nutzlast)) {
        return abgelehnt('entferneElement erwartet ein Objekt { elementId }.')
      }
      const elementId = nutzlast.elementId
      if (!istGefuellterText(elementId)) {
        return abgelehnt('entferneElement braucht eine nicht leere elementId.')
      }
      return { ok: true, wert: { elementId } }
    },
    ({ elementId }) => entferneElement(elementId),
  )

  meldeAn(
    KANAELE.project.ordneNeu,
    (nutzlast: unknown): Ergebnis<{ reihenfolge: string[] }, 'ungueltige_eingabe'> => {
      if (!istObjekt(nutzlast)) return abgelehnt('ordneNeu erwartet ein Objekt { reihenfolge }.')
      const reihenfolge = nutzlast.reihenfolge
      if (!Array.isArray(reihenfolge)) {
        return abgelehnt('ordneNeu braucht ein Array als reihenfolge.')
      }
      // Der Zwischenschritt ueber `unknown[]` ist tragend: `Array.isArray` auf einem `unknown`
      // liefert `any[]`, und ueber `any` rutschte jeder Eintrag ungeprueft in die Operation -
      // die Waechterfunktion darunter waere dann eine Zeile ohne Wirkung.
      const eintraege: unknown[] = reihenfolge
      if (!eintraege.every(istGefuellterText)) {
        return abgelehnt('ordneNeu braucht in reihenfolge lauter nicht leere Element-IDs.')
      }
      // NICHT geprueft wird, ob die Menge zur Liste passt (vollstaendig, ohne Doppelte) -
      // das tut #43 unter dem D1-Lock, also gegen einen Stand, der sich hier noch aendern
      // koennte. Eine Vorpruefung hier waere gegen einen ueberholten Stand gelaufen.
      // Das ARRAY REIST UNVERAENDERT weiter: nicht kopiert, nicht sortiert, nicht entdoppelt.
      return { ok: true, wert: { reihenfolge: eintraege } }
    },
    ({ reihenfolge }) => ordneNeu(reihenfolge),
  )

  meldeAn(
    KANAELE.project.setzeTrim,
    (
      nutzlast: unknown,
    ): Ergebnis<{ elementId: string; trimStart: number; trimEnde: number }, 'ungueltige_eingabe'> => {
      if (!istObjekt(nutzlast)) {
        return abgelehnt('setzeTrim erwartet ein Objekt { elementId, trimStart, trimEnde }.')
      }
      const elementId = nutzlast.elementId
      const trimStart = nutzlast.trimStart
      const trimEnde = nutzlast.trimEnde
      if (!istGefuellterText(elementId)) {
        return abgelehnt('setzeTrim braucht eine nicht leere elementId.')
      }
      if (!istEndlicheZahl(trimStart) || !istEndlicheZahl(trimEnde)) {
        return abgelehnt('setzeTrim braucht endliche Zahlen als trimStart und trimEnde.')
      }
      // WEDER GERUNDET NOCH GEORDNET: Die Frame-Rundung ist ausdruecklich Sache des Renders
      // (#44 nimmt die Sekunden ROH entgegen), und ob trimStart vor trimEnde liegt und beide
      // in die Medienlaenge passen, prueft #44 gegen das Asset - Wissen, das hier fehlt.
      return { ok: true, wert: { elementId, trimStart, trimEnde } }
    },
    ({ elementId, trimStart, trimEnde }) => setzeTrim(elementId, trimStart, trimEnde),
  )

  meldeAn(
    KANAELE.project.setzeDauer,
    (nutzlast: unknown): Ergebnis<{ elementId: string; dauer: number }, 'ungueltige_eingabe'> => {
      if (!istObjekt(nutzlast)) {
        return abgelehnt('setzeDauer erwartet ein Objekt { elementId, dauer }.')
      }
      const elementId = nutzlast.elementId
      const dauer = nutzlast.dauer
      if (!istGefuellterText(elementId)) {
        return abgelehnt('setzeDauer braucht eine nicht leere elementId.')
      }
      // Der erlaubte Bereich 10-45 s wird hier NICHT geprueft (Pruef-Tabelle des Issues):
      // Er steht in #45, und zwei Stellen mit denselben Grenzen laufen beim naechsten
      // Anpassen auseinander - die Oberflaeche bekaeme dann je nach Weg eine andere Antwort.
      if (!istEndlicheZahl(dauer)) {
        return abgelehnt('setzeDauer braucht eine endliche Zahl als dauer.')
      }
      return { ok: true, wert: { elementId, dauer } }
    },
    ({ elementId, dauer }) => setzeDauer(elementId, dauer),
  )

  // ------------------------------------------------------------------------ Ausgabe-Liste
  meldeAn(
    KANAELE.project.listeAusgaben,
    (nutzlast: unknown): Ergebnis<{ projektId: string }, 'ungueltige_eingabe'> => {
      if (!istObjekt(nutzlast)) {
        return abgelehnt('listeAusgaben erwartet ein Objekt { projektId }.')
      }
      const projektId = nutzlast.projektId
      if (!istProjektIdSegment(projektId)) {
        // Der beanstandete Wert steht ABSICHTLICH nicht in der Meldung - sie reist bis in
        // die Oberflaeche (gleiche Linie wie in #75).
        return abgelehnt('listeAusgaben braucht eine projektId in UUID-Form ohne Pfadanteile.')
      }
      return { ok: true, wert: { projektId } }
    },
    ({ projektId }) => listeAusgaben(projektId),
  )
}
// registriert die 14 unten aufgeführten Kanäle über den Wrapper aus #23 – je mit einer eigenen
// Validierungsfunktion. Kein Zustand, keine Fachlogik, kein Ereignis-Versand (s. STOPP).

// NICHT HIER, UND GEMELDET:
//
// 1. DER SENDER DES SPEICHERSTATUS FEHLT WEITERHIN PROJEKTWEIT - und das ist so gewollt.
//    #47 definiert das Ereignis `AutoSpeichernEreignis`, den zugehoerigen Kanalnamen und die
//    main-interne Hoerer-Registrierung `aufAutoSpeichernEreignis(hoerer)`; angemeldet wird es
//    von niemandem. Diese Datei baut ihn ausdruecklich NICHT (STOPP-Block des Issues): kein
//    Abonnement, keine Fensterreferenz, kein Ereignis-Eintrag in der Registry. Zustaendig ist
//    #238 (`verdrahteSpeicherstatusIPC(fenster)`, Schritt 7 des Bootstraps, Position 3) -
//    dort steht eine Datei bereits bereit. Solange die Luecke besteht, kann `app-shell` (M7)
//    den Hinweis "nicht gespeichert" (NFA-02, TK 9.5.4) nicht anzeigen.
//
// 2. KEIN AUFRUFER. src/main/index.ts fuehrt `verdrahteProjectStoreIPC()` als Schritt 5,
//    Position 1 - als LUECKE im Kommentar, nicht als Zeile. Diese Datei traegt den Aufruf
//    ausdruecklich NICHT selbst ein (kein Selbstaufruf am Modulende, kein Eintrag in einer
//    fremden Datei); das waere eine Aenderung ausserhalb des erlaubten Dateibereichs. Zu
//    verdrahten ist er in der Bootstrap-Kette (#3 / #270 ff.).
//    ZUR EINORDNUNG: Diese Verdrahtung braucht KEIN Fenster und gehoert damit in die Gruppe
//    OHNE Fenster (Schritt 5). Die Reihenfolge-Aussage im Issue-Text ist ueberholt - sie nennt
//    `verdrahteQueueIPC()` parameterlos und vor dem Fenster; gebaut ist
//    `verdrahteQueueIPC(fenster)` in Schritt 7 (#269).
//
// 3. DER ISSUE-TEXT ZITIERT ELF RUECKGABETYPEN ZU KURZ. Er fuehrt #33, #35, #36, #37, #38,
//    #39, #40, #41, #42, #43, #44 und #45 mit der einparametrigen Huelle (`Ergebnis<Project>`,
//    `Ergebnis<void>`, ...); gebaut tragen alle `ProjectStoreFehlercode` als zweiten Parameter
//    ('speicher_fehler' | 'projekt_beschaeftigt' | 'kein_projekt', src/main/project-store/
//    assets.ts). Bei #40 kommt hinzu, dass der Rueckgabetyp dort einen eigenen Namen traegt
//    (`LoeschAktionErgebnis`), und #94 liefert `ProjectStoreFehlercode | ReconcileFehlercode |
//    'schema_zu_neu'`. FOLGENLOS FUER DIESE DATEI, weil `F` aus dem Rueckruf abgeleitet und die
//    Huelle unveraendert durchgereicht wird - gemeldet, weil ein Zitat-Abgleich (Regel D) das
//    Issue nachziehen muss und weil die Renderer-Seite (#24, M5/M7) die Codes kennen sollte.
//
// 4. ERLEDIGT (#332 am 14.08.2026, `meldeAn` durch #333 am 23.08.2026) - der Vermerk
//    bleibt als Beleg stehen. Hier stand, dass die HUELLE `meldeAn` UND die PRUEFER
//    `istObjekt`/`istGefuellterText`/`abgelehnt`/`ohneNutzlast` zum dritten Mal stehen,
//    Wort fuer Wort auch in src/main/ipc-gateway/config-store-verdrahtung.ts (#77) und
//    src/main/auftrags-manager/ipc-verdrahtung.ts (#71).
//    DIE VIER PRUEFER SIND UMGEZOGEN: ./nutzlast-pruefer.ts, importiert oben.
//    DIE HUELLE IST UMGEZOGEN: ./melde-an.ts, importiert oben. Beide stehen in dieser
//    Datei nicht mehr; der Kommentarapparat der Huelle liegt EINMAL in melde-an.ts.
