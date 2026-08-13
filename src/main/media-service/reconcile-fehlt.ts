// GENERIERT aus dem Signaturblock von Issue #89.
// [media-service] Aufräumen: fehlende Dateien als fehlt markieren
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
// GERUEST-PRUEFSUMME: 5b2ce401806c2992

import fs from 'node:fs/promises'

import { setzeAssetZustand } from '../project-store/assets'
import { loeseAssetPfad } from '../project-store/pfade'

import type { ProjectStoreFehlercode } from '../project-store/assets'
import type { Ergebnis, GenerischerFehlercode } from '../../shared/contracts/ergebnis'
import type { Asset } from '../../shared/contracts/asset'
import type { ReconcileFehlercode } from './fehlercodes'

// Fremde Aufrufe - vollstaendige Signaturen, damit hier nichts geraten wird:
//   #49:  loeseAssetPfad(projektId: string, dateiname: string): Ergebnis<string>
//         // absoluter Pfad zur Asset-Datei; liefert NUR einen Pfad, wenn dieser nach
//         // Normalisierung nachweislich innerhalb von medienOrdner(projektId) liegt, sonst
//         // `ungueltige_eingabe`; reine String-/Pfad-Operation, KEINE Existenzpruefung.
//   #74:  setzeAssetZustand(projektId: string, assetId: string, zustand: 'ok' | 'fehlt')
//           : Promise<Ergebnis<void, ProjectStoreFehlercode>>
//         // setzt Asset.zustand im geladenen Projekt, nimmt das D1-Lock (#32) SELBST und
//         // stoesst danach die entprellte Auto-Speicherung an. Erfolg heisst "gueltig
//         // uebernommen", NICHT "schon auf Platte" (TK 9.5.4).
//
// Der EINZIGE Dateisystemzugriff dieser Datei ist das `fs.stat` in `ermittleBefund`. Sie
// schreibt nichts, loescht nichts und fasst das uebergebene `Asset`-Objekt nicht an: Jede
// D1-Aenderung laeuft ueber `setzeAssetZustand` ("Alle D1-Schreibvorgaenge delegiert er an den
// `project-store`", TK 9.4.1), und ein eigenes Lock gibt es nicht (TK 9.4.8, Punkt 9).

/**
 * Zeichen, die aus der `projektId` einen Pfad statt eines Segments machen wuerden.
 *
 * Beide Trenner, unabhaengig vom Betriebssystem - dieselbe Ueberlegung wie in `pfade.ts` (#49)
 * und `assets.ts` (#72): Ein unter Windows geschriebener Wert wandert per USB-Stick auf einen
 * Mac, und eine Pruefung, die nur den heimischen Trenner kennt, laesst ihn genau dort durch.
 */
const PFAD_TRENNER = ['/', '\\']

export async function markiereFehlende(
  projektId: string,
  assets: Asset[],
): Promise<Ergebnis<{ markiert: number }, ReconcileFehlercode>> {
  // EIN Fangnetz um den ganzen Lauf. Der Reconcile laeuft beim Projektstart; eine
  // durchgereichte Ausnahme wuerde dort das Oeffnen abbrechen, statt einen Befund zu melden -
  // "Kein `throw` nach aussen" (TK 9.1.1, Punkt 2).
  try {
    // `typeof` trotz `string` in der Signatur: "Der Main validiert jede eingehende Nutzlast"
    // (TK 9.1.1, Punkt 6). Der deklarierte Typ gilt nur, solange der Aufrufer selbst
    // typgeprueft gebaut ist.
    //
    // Geprueft wird hier, VOR dem ersten Dateisystem- und Schreibzugriff: Eine unbrauchbare
    // Projekt-ID darf keinen einzigen Zustand anfassen. `loeseAssetPfad` wuerde sie zwar auch
    // abweisen - aber erst je Asset, und ein abgewiesener Pfad gilt weiter unten als "Datei
    // fehlt". Ohne diese Vorpruefung faerbte eine kaputte Projekt-ID die gesamte Bibliothek rot.
    if (
      typeof projektId !== 'string' ||
      projektId.trim() === '' ||
      PFAD_TRENNER.some((zeichen) => projektId.includes(zeichen)) ||
      projektId.includes('..')
    ) {
      return fehler('ungueltige_eingabe', 'Es wurde keine brauchbare Projekt-ID uebergeben.')
    }

    let markiert = 0

    // SEQUENTIELL, absichtlich - kein Promise.all. Zwei Gruende: Der Abbruch bei einem
    // D1-Schreibfehler muss die noch nicht besuchten Assets WIRKLICH unbesucht lassen (mit
    // Promise.all liefen ihre Aufrufe laengst), und jeder `setzeAssetZustand`-Aufruf nimmt das
    // D1-Lock (#32) - parallel gestartete Aufrufe stuenden ohnehin nur Schlange.
    for (const asset of assets) {
      const befund = await ermittleBefund(projektId, asset)

      // `null` = die Platte hat keine Auskunft gegeben, die "ist nicht da" bedeutet. Dann
      // bleibt der bisherige Zustand stehen: "Ich darf nicht hinsehen" ist nicht dasselbe wie
      // "ist nicht da", und der Zustand wird persistiert - ein Fehlbefund bliebe rot, auch
      // wenn das Netzlaufwerk Sekunden spaeter wieder da ist.
      if (befund === null) {
        continue
      }

      // Nur schreiben, wenn sich wirklich etwas aendert. Jeder Aufruf nimmt das D1-Lock und
      // stoesst die entprellte Speicherung an; bei hundert intakten Medien waeren das hundert
      // Lock-Zyklen und ein Plattenschreibvorgang bei JEDEM Projektoeffnen, ohne dass sich ein
      // Byte aendert. (`setzeAssetZustand` prueft dasselbe noch einmal - dort schuetzt es den
      // Zeitstempel `geaendertAm`, hier den Lauf. Die doppelte Pruefung kostet nichts und haelt
      // beide Seiten fuer sich richtig.)
      if (asset.zustand === befund) {
        continue
      }

      const gesetzt = await setzeAssetZustand(projektId, asset.id, befund)
      if (!gesetzt.ok) {
        // ABBRUCH, kein Weiterlaufen. Sonst entstuende ein Bestand, in dem ein Teil der Medien
        // korrekt rot ist und ein anderer unauffaellig aussieht, obwohl er fehlt - und das
        // Versprechen "der `render-service` bricht FRUEH ab statt mitten im Lauf" (TK 9.4.7)
        // waere gebrochen, ohne dass es jemand sieht.
        //
        // KEIN Rollback der bereits gesetzten Zustaende: Sie sind fuer sich genommen richtig -
        // die Dateien fehlen tatsaechlich. TK 9.5.4 gibt dieselbe Richtung vor ("die
        // Aenderungen bleiben im Speicher").
        return uebernimmFehler(gesetzt.fehler.code, gesetzt.fehler.meldung)
      }

      // GEZAEHLT WERDEN NUR DIE NEUEN SCHAEDEN. Rueckkehrer ('ok') bleiben aussen vor: Der
      // Zaehler beantwortet im Aufraeum-Ablauf (#91) die Frage "ist seit dem letzten Mal etwas
      // kaputtgegangen?", und ein mitgezaehlter Rueckkehrer machte sie unbeantwortbar.
      if (befund === 'fehlt') {
        markiert += 1
      }
    }

    return { ok: true, wert: { markiert } }
  } catch (ursache) {
    // "Eine rohe Exception-Meldung wird nie zum Code" (TK 9.1.1, Punkt 3) - der Code ist
    // `unbekannter_fehler`, der Text der Ausnahme reist nur als Begruendung mit.
    return fehler(
      'unbekannter_fehler',
      `Der Abgleich der Mediendateien ist unerwartet gescheitert. Grund: ${textVon(ursache)}`,
    )
  }
}
// - liest D2 (nur `fs.stat`), schreibt D1 AUSSCHLIESSLICH delegiert ueber setzeAssetZustand (#74)
// - Pfade kommen ausschliesslich aus loeseAssetPfad (#49); kein eigenes path.join
// - `markiert` zaehlt nur die in DIESEM Lauf neu auf 'fehlt' gesetzten Assets
// - bricht bei einem D1-Schreibfehler ab und reicht dessen Code weiter, ohne Rollback

/**
 * Der Befund zu einem einzelnen Asset: `'ok'` (die Datei liegt da), `'fehlt'` (sie liegt
 * nachweislich nicht da) oder `null` (die Platte hat keine verwertbare Auskunft gegeben).
 *
 * `null` ist nicht dasselbe wie `'fehlt'` - das ist der Kern dieser Funktion. Ein Lesefehler,
 * der nicht "gibt es nicht" bedeutet (`EACCES`, `EPERM`, `EIO`, ein nicht verbundenes
 * Netzlaufwerk), laesst den bisherigen Zustand unberuehrt.
 */
async function ermittleBefund(projektId: string, asset: Asset): Promise<'ok' | 'fehlt' | null> {
  const pfad = loeseAssetPfad(projektId, asset.dateiname)
  if (!pfad.ok) {
    // Ein `dateiname`, der die Form aus TK 9.4.8 Punkt 1 verletzt, kann NIE gelesen werden -
    // er stammt aus einem beschaedigten oder von aussen veraenderten project.json. Ihn auf
    // 'fehlt' zu setzen fuehrt den Nutzer ueber die gefuehrte Reparatur (FA-19) zu dem
    // Element hin; der Lauf bricht deswegen NICHT ab.
    return 'fehlt'
  }

  try {
    // `stat`, nicht `lstat`: Eine Verknuepfung auf eine echte Datei ist lesbar und damit
    // vorhanden; eine ins Leere zeigende faellt hier von selbst in den ENOENT-Zweig, weil
    // `stat` dem Link folgt.
    const eintrag = await fs.stat(pfad.wert)

    // "Vorhanden" heisst: es gibt dort eine REGULAERE Datei. Ein Verzeichnis oder ein
    // Geraetename mit dem Namen eines Videos ist fuer `render-service` und `preview-player`
    // genauso unbrauchbar wie gar nichts - und ein frueher Abbruch mit `medium_fehlt` ist die
    // ehrlichere Antwort als ein Lesefehler tief im ffmpeg-Aufruf.
    return eintrag.isFile() ? 'ok' : 'fehlt'
  } catch (ursache) {
    return istNichtVorhanden(ursache) ? 'fehlt' : null
  }
}

/**
 * Bedeutet dieser Fehler "gibt es nicht"?
 *
 * NUR `ENOENT`. Die Fehlertabelle des Issues nennt genau diesen einen Fall; jeder andere Code
 * (`EACCES`, `EPERM`, `EIO`, `EBUSY`, `ENOTDIR` …) heisst "ich konnte nicht nachsehen", und
 * daraus ein "fehlt" zu machen faerbte bei einem kurz gesperrten Ordner die halbe Bibliothek
 * rot - dauerhaft, weil der Zustand gespeichert wird.
 */
function istNichtVorhanden(ursache: unknown): boolean {
  // `code` steht auf NodeJS.ErrnoException, nicht auf `Error` - deshalb wird das Feld gefragt
  // und nicht die Klasse. Die `in`-Pruefung verengt `unknown` ohne Typbehauptung; ein `as` waere
  // hier genau die Behauptung, die der Fangzweig gerade nicht aufstellen darf.
  if (typeof ursache !== 'object' || ursache === null || !('code' in ursache)) {
    return false
  }
  return ursache.code === 'ENOENT'
}

/**
 * Der Fehler des `project-store` (#74), uebersetzt in den Vorrat dieser Funktion.
 *
 * DER CODE WIRD SO WEIT WIE MOEGLICH UNVERAENDERT WEITERGEREICHT - "Geht der Code verloren,
 * degradieren Reparatur-Modus, Wiederholen und der FAT32-Hinweis alle zu 'irgendwas ist
 * schiefgelaufen'" (TK 9.1.1).
 *
 * ERLEDIGT am 13.08.2026 - der Vermerk bleibt als Beleg stehen. `ProjectStoreFehlercode` ist am
 * 12./13.08.2026 auf `speicher_fehler | projekt_beschaeftigt | kein_projekt` gewachsen, waehrend
 * `ReconcileFehlercode` nur `speicher_fehler | datei_fehler` fuehrte. `kein_projekt` fiel deshalb
 * auf `unbekannter_fehler`, und der echte Code stand nur noch im Meldungstext - worauf kein
 * Aufrufer verzweigen kann. Der Bau-Agent hat das korrekt GEMELDET statt eigenmaechtig #79 zu
 * aendern (dessen STOPP-Block verlangt genau das). Behoben ist es dort: `ReconcileFehlercode`
 * traegt jetzt `kein_projekt`, und diese Funktion reicht es unveraendert durch.
 *
 * `projekt_beschaeftigt` bleibt der EINZIGE Code, der hier umgedeutet wird - er ist aus
 * `setzeAssetZustand` nicht erreichbar (die Funktion stoesst nur das entprellte Speichern an, nie
 * einen Sofort-Flush). Der Zweig steht trotzdem: Er kostet nichts und faengt den Tag, an dem #74
 * seine Codes erweitert, ohne dass es hier jemand merkt.
 */
function uebernimmFehler(
  code: ProjectStoreFehlercode | GenerischerFehlercode,
  meldung: string,
): Ergebnis<{ markiert: number }, ReconcileFehlercode> {
  if (code === 'projekt_beschaeftigt') {
    return fehler(
      'unbekannter_fehler',
      `Der Abgleich wurde abgebrochen; der Projektspeicher meldete "${code}". Grund: ${meldung}`,
    )
  }
  // Hier bleibt `speicher_fehler | kein_projekt | ungueltige_eingabe | nicht_gefunden |
  // unbekannter_fehler` - jeder davon passt in die Huelle und wird UNVERAENDERT durchgereicht.
  return fehler(code, meldung)
}

/**
 * Die Fehlerhuelle. Ohne `daten`: "Das Feld ist optional - Codes ohne Zusatzdaten lassen es
 * weg" (TK 9.1.1), und kein Code dieser Datei traegt Zusatzdaten.
 */
function fehler(
  code: ReconcileFehlercode | GenerischerFehlercode,
  meldung: string,
): Ergebnis<{ markiert: number }, ReconcileFehlercode> {
  return { ok: false, fehler: { code, meldung } }
}

/** Der Text einer Ausnahme, ohne Stacktrace - der reist nicht ueber die Grenze. */
function textVon(ursache: unknown): string {
  return ursache instanceof Error ? ursache.message : String(ursache)
}

// NICHT HIER, UND GEMELDET:
//
// 1. KEINE PRUEFUNG DES `assets`-ARRAYS. Die Fehlertabelle bindet `ungueltige_eingabe` an die
//    `projektId`; ein eigener Code fuer "das ist gar kein Array" waere erfunden. Kommt dennoch
//    etwas Nicht-Iterierbares herein, faengt es das Fangnetz oben als `unbekannter_fehler` -
//    genau die Zeile "unerwartete Ausnahme" der Tabelle.
//
// 2. KEINE SYMLINK-PRUEFUNG. `loeseAssetPfad` (#49) haelt in seinem eigenen Schlussvermerk
//    fest, dass es die von TK 9.5.7 verlangte "Symlink-Flucht" nicht ausschliessen kann (es ist
//    I/O-frei) und weist die Pruefung der oeffnenden Stelle zu. Diese Datei OEFFNET nicht - sie
//    fragt nur, ob dort eine Datei liegt. Eine Verknuepfung in `media/`, die nach draussen
//    zeigt, gilt hier also als vorhanden. Wo die Bytes wirklich gelesen werden (media://-Handler
//    #50, ffmpeg-adapter), ist die Pruefung weiterhin offen.
//
// 3. KEIN ZWEITER LAUF UND KEIN BEOBACHTER. Kein `fs.watch`, kein Intervall, kein erneutes
//    Pruefen nach n Sekunden ("kein periodisches Aufraeumen im laufenden Betrieb", TK 9.4.8
//    Punkt 8) - und kein eigenes "Reconcile laeuft"-Flag (Punkt 9).
//
// 4. KEIN WIEDERBESCHAFFEN. Kein `unlink`, kein Kopieren, kein Suchen der Datei an anderer
//    Stelle. Das Wiederverknuepfen ist Sache der gefuehrten Reparatur (FA-19, TK 9.7.5) und
//    geschieht mit dem Nutzer, nicht hinter seinem Ruecken.
