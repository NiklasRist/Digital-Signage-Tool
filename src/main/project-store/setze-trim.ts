// GENERIERT aus dem Signaturblock von Issue #44.
// [project-store] setzeTrim implementieren
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
// GERUEST-PRUEFSUMME: 5052311e5dcce4b9
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
// [ERLEDIGT: Die Zeile ist mit dem Fuellen des Rumpfes entfernt worden.]

import { holeAktivesProjekt } from './aktives-projekt'
import { planeAutoSpeicherung } from './auto-speichern'
import { mitD1Lock } from './d1-lock'

// Fremde Aufrufe - vollstaendige Signaturen, damit hier nichts geraten wird:
//   #32:  mitD1Lock<T>(aktion: () => Promise<T>): Promise<T>
//         // fuehrt aktion() garantiert seriell aus (FIFO, prozessintern, KEINE Datei-Sperre).
//         // Der kritische Abschnitt darf selbst NICHT erneut mitD1Lock aufrufen
//         // (Deadlock-Gefahr) - deshalb wird hier nichts gerufen, das seinerseits sperrt.
//   #47:  planeAutoSpeicherung(projekt: Project): void
//         // merkt projekt als zu speichernde, aktuelle Version vor und (re-)startet den
//         // Entprellungstimer. SYNCHRON, kein Rueckgabewert, nimmt KEIN Lock.
//   #192: holeAktivesProjekt(): Project | null
//         // das aktuell geoeffnete Projekt als LEBENDEN Stand (dieselbe Objektreferenz, die
//         // die Instant-Operationen mutieren), kein Projekt offen -> null. SYNCHRON, NIMMT
//         // KEIN LOCK, WIRFT NIE.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { ProjectStoreFehlercode } from './assets'            // #72
import type { Listenelement } from '../../shared/contracts/project'
export async function setzeTrim(
  elementId: string,
  trimStart: number,   // Sekunden, ROH – keine Frame-Rundung hier, s. Invarianten
  trimEnde: number,    // Sekunden, ROH
): Promise<Ergebnis<Listenelement, ProjectStoreFehlercode>> {
  // Das Lock liegt UM ALLES, nicht nur um die Zuweisung. Der Grund ist die Reihenfolge
  // Lesen -> Pruefen -> Schreiben: Wuerde nur der Schreibschritt gesperrt, koennte
  // zwischen dem Nachschlagen des Assets und dem Setzen der Grenzen ein anderer
  // Abschnitt genau dieses Asset aus Project.assets nehmen (loescheMedium) oder das
  // Element aus der Liste ziehen. Die Pruefung waere dann gegen einen Stand gelaufen,
  // den es beim Schreiben nicht mehr gibt - und genau davor soll diese Funktion
  // schuetzen (s. "Warum das im Gesamtsystem wichtig ist" im Issue).
  return mitD1Lock(async (): Promise<Ergebnis<Listenelement, ProjectStoreFehlercode>> => {
    const projekt = holeAktivesProjekt()
    if (projekt === null) {
      // NICHT in der Fehlerpfad-Tabelle des Issues, aber unvermeidbar: Ohne geoeffnetes
      // Projekt gibt es keine Project.liste, in der die Kennung stehen koennte. Das ist
      // derselbe Sachverhalt wie Zeile 1 der Tabelle ("elementId existiert nicht in
      // Project.liste"), deshalb derselbe Code. S. Bericht.
      return fehler(
        'kein_projekt',
        'Es ist kein Projekt geoeffnet; es gibt keine Wiedergabeliste, in der ' +
          `das Element ${elementId} liegen koennte.`,
      )
    }

    // LEBENDE Referenz, keine Kopie: `holeAktivesProjekt` (#192) gibt ausdruecklich
    // "dieselbe Objektreferenz, die die Instant-Operationen mutieren" heraus. Wer hier
    // eine Kopie zoege, aenderte sie - und `planeAutoSpeicherung` schriebe spaeter den
    // unveraenderten Originalstand.
    const element = projekt.liste.find((eintrag) => eintrag.id === elementId)
    if (element === undefined) {
      return fehler('nicht_gefunden', `Es gibt kein Listenelement mit der Kennung ${elementId}.`)
    }

    if (element.art !== 'video') {
      // Nur Video-Elemente tragen trimStart/trimEnde; beim Segment zaehlt `dauer`
      // (TK 9.11.3, Belegungstabelle). Ein Trim auf ein Standbild waere sinnlos, und die
      // Werte muessten dort null bleiben.
      return fehler(
        'ungueltige_eingabe',
        `Das Element ${elementId} ist ein ${element.art}-Element; ein Trim ist nur bei ` +
          'Video-Elementen moeglich. Beim Aktions-Segment steuert die Dauer die Spielzeit.',
      )
    }

    // `Number.isFinite` und nicht `> 0`-Vergleiche: Die Werte kommen ueber den IPC-Vertrag
    // aus dem Renderer und koennen NaN, Infinity oder gar keine Zahl sein (eine leere
    // Eingabe im Zahlenfeld wird schnell zu NaN). Jeder Vergleich mit NaN ist falsch,
    // auch `NaN >= x` - eine spaetere Pruefung wuerde NaN also stillschweigend
    // durchwinken, und in der project.json stuende danach `null` (JSON kennt kein NaN).
    // `Number.isFinite` faengt beides in einem Zug ab, ohne dass irgendwo eine Zahl
    // "repariert" wird.
    if (!Number.isFinite(trimStart) || !Number.isFinite(trimEnde)) {
      return fehler(
        'ungueltige_eingabe',
        'Anfang und Ende des Ausschnitts muessen endliche Sekundenwerte sein.',
      )
    }

    if (trimStart < 0) {
      return fehler(
        'ungueltige_eingabe',
        `Der Anfang des Ausschnitts liegt bei ${trimStart} s und damit vor dem Videoanfang.`,
      )
    }

    if (trimStart >= trimEnde) {
      // KEINE Mindestlaenge darueber hinaus - dazu s. den Meldeblock am Dateiende.
      // Geprueft wird ausschliesslich, was TK 9.5.2 verlangt: `0 <= start < ende`.
      return fehler(
        'ungueltige_eingabe',
        `Der Anfang des Ausschnitts (${trimStart} s) liegt nicht vor seinem Ende ` +
          `(${trimEnde} s); ein Ausschnitt ohne Laenge ist nicht darstellbar.`,
      )
    }

    // Die Obergrenze steht NICHT am Listenelement, sondern am referenzierten Asset -
    // das ist der ganze Zweck dieser Funktion. `Listenelement.ref` traegt bei
    // art: "video" die Asset-ID (contracts/project.ts, #15).
    const asset = projekt.assets.find((eintrag) => eintrag.id === element.ref)
    if (asset === undefined) {
      // NICHT in der Fehlerpfad-Tabelle. Ein Element, dessen `ref` in Project.assets ins
      // Leere zeigt, ist ein kaputter Datenstand (der Reparatur-Modus, TK 9.7.5, ist
      // dafuer zustaendig, nicht diese Operation). Bewusst `ungueltige_eingabe` und NICHT
      // `nicht_gefunden`: Die Tabelle bindet `nicht_gefunden` an die elementId, und ein
      // Aufrufer, der ihn hier bekaeme, duerfte schliessen, das ELEMENT sei verschwunden,
      // und es aus seiner Sicht entfernen - ein Datenverlust aus einer Fehlinterpretation.
      // "keine Wirkung" gilt so oder so. S. Bericht.
      return fehler(
        'ungueltige_eingabe',
        `Das Element ${elementId} verweist auf das Medium ${element.ref}, das in diesem ` +
          'Projekt nicht mehr gefuehrt wird. Die Quelllaenge ist damit unbekannt, gegen ' +
          'die der Ausschnitt zu pruefen waere.',
      )
    }

    const quelldauer = asset.dauer
    if (quelldauer === null) {
      // Ebenfalls NICHT in der Tabelle. `Asset.dauer` ist bei Bildern null (#13); ein
      // Video-Listenelement, das auf ein Bild-Asset zeigt, hat also keine Obergrenze.
      // Ohne sie liesse sich Zeile 5 der Tabelle gar nicht pruefen - und genau das
      // Durchwinken eines zu langen Ausschnitts ist der Schaden, den dieses Issue
      // verhindern soll. S. Bericht.
      return fehler(
        'ungueltige_eingabe',
        `Zum Medium ${asset.id} ist keine Laufzeit hinterlegt; ein Ausschnitt laesst sich ` +
          'nicht gegen die Quelllaenge pruefen.',
      )
    }

    if (trimEnde > quelldauer) {
      // Verglichen wird gegen den Wert, wie er im Asset steht - ohne eigene Rundung und
      // ohne Toleranz. Eine Toleranz waere hier die gefaehrlichere Wahl: Sie liesse
      // Werte durch, die groesser sind als die Quelle, und der spaetere Ausschnitt im
      // render-service liefe ueber das Dateiende hinaus. Wer den Regler ans Ende zieht,
      // schickt genau `asset.dauer` - `<=` laesst das zu (AD 4.4: "Verlaengern ist nur
      // bis zur Quelllaenge moeglich").
      return fehler(
        'ungueltige_eingabe',
        `Das Ende des Ausschnitts (${trimEnde} s) liegt hinter dem Ende des Videos ` +
          `(${quelldauer} s). Mehr Material existiert nicht.`,
      )
    }

    // DIE ZUWEISUNG - roh und unveraendert, das ist die Kernzusage dieses Issues.
    // Gerundet wird ausschliesslich im render-service (TK 9.2.6); zwei Stellen mit
    // derselben Rundungsregel liefen unweigerlich auseinander, und der Nutzer saehe im
    // composer eine andere Laenge als in der fertigen Datei.
    element.trimStart = trimStart
    element.trimEnde = trimEnde
    // `element.dauer` wird NICHT angefasst. Bei art: "video" ist es null ("die Dauer
    // ergibt sich aus dem Trim", TK 9.11.3), und es hier vorsorglich auf null zu setzen
    // hiesse, einen kaputten Fremdstand lautlos zu ueberschreiben, statt ihn sichtbar zu
    // lassen. "bleibt null" heisst unveraendert, nicht neu gesetzt.

    // Entprelltes Speichern, KEIN sofortFlush: Das hier ist eine Instant-Operation, kein
    // Auftrag (TK 9.5.4). Der Nutzer zieht am Trim-Regler mehrmals je Sekunde - jeder Zug
    // schriebe sonst die ganze project.json. Uebergeben wird die LEBENDE Referenz, damit
    // der ablaufende Termin den dann neuesten Stand schreibt (#47).
    planeAutoSpeicherung(projekt)

    // Zurueck geht das lebende Element, keine Kopie. Ueber den IPC-Vertrag wird es
    // ohnehin serialisiert (der Renderer bekommt also eine Kopie); ein main-interner
    // Aufrufer bekommt dagegen genau das Objekt, das in Project.liste haengt - eine
    // Kopie waere dort die zweite Wahrheit, die #192 fuer das Projekt ausdruecklich
    // ausschliesst.
    return { ok: true, wert: element }
  })
}

/**
 * Die Fehlerseite der Huelle.
 *
 * Beide Codes sind generisch (ergebnis.ts) - die Signatur ist EINPARAMETRIG
 * (`Ergebnis<Listenelement>`), und die Fehlerpfad-Tabelle des Issues kommt mit genau
 * diesen zwei Codes aus. Es gibt hier also KEINEN Widerspruch zwischen Signatur und
 * Fehlerpfaden, anders als bei oeffneProjekt (#34).
 */
function fehler(
  code: 'nicht_gefunden' | 'ungueltige_eingabe' | ProjectStoreFehlercode,
  meldung: string,
): Ergebnis<Listenelement, ProjectStoreFehlercode> {
  return { ok: false, fehler: { code, meldung } }
}

// ---------------------------------------------------------------------------
// WAS HIER BEWUSST NICHT STEHT - UND GEMELDET IST
//
// 1. KEINE RUNDUNG AUF DAS AUSGABERASTER, IN KEINER FORM. Diese Datei rechnet nirgends
//    mit Bildern je Sekunde, importiert RENDER_PROFILE (#18) nicht und nennt keine
//    Bildrate. So verlangt es das Issue ausdruecklich ("Grep-Probe: keine
//    Frame-Arithmetik in dieser Datei") und begruendet es aus TK 9.2.2/9.2.6: Die
//    Rundungsformel steht im Abschnitt des render-service, nicht in 9.5.
//
// 2. KEINE MINDESTLAENGE DES AUSSCHNITTS. Ein Ausschnitt von wenigen Millisekunden
//    besteht die Pruefung `start < ende` und wird gespeichert; ob er beim Rendern zu
//    einem leeren Bereich zusammenfaellt, entscheidet dort die Rundung. Der STOPP-Block
//    des Issues verbietet ausdruecklich, das hier festzulegen - offen und gemeldet.
//
// 3. KEINE AUSWERTUNG VON `Asset.zustand`. Ein Asset mit zustand "fehlt" traegt laut
//    TK weiterhin seine zuletzt bekannte `dauer`; gegen die wird hier ganz normal
//    geprueft. Das ist NICHT als Entscheidung fuer Variante (a) des STOPP-Blocks zu
//    lesen, sondern als das Fehlen jeder Sonderbehandlung - offen und gemeldet.
//
// 4. KEIN ANFASSEN VON `Project.geaendertAm`. Wann der Zeitstempel gesetzt wird (bei der
//    Mutation im Speicher oder beim entprellten Schreiben), legt das TK nicht fest, und
//    der STOPP-Block verbietet die Festlegung. Zu beachten: `schreibeProjekt` (#46)
//    laesst das Feld ausdruecklich unangetastet - solange niemand es setzt, altert es
//    nie. Offen und gemeldet.
//
// 5. KEIN SCHNAPPSCHUSS FUER UNDO. TK 9.13.2 verlangt einen Schnappschuss vor jeder
//    Instant-Operation; gebaut wird er nach M7-Beschluss NICHT in den einzelnen
//    Operationen, sondern in der Huelle um die gemeinsame Projekt-Sicht (#243).
//
// 6. KEIN IPC-KANAL. `project:setzeTrim` wird hier nicht angemeldet; das tut die
//    Verdrahtung im ipc-gateway.
