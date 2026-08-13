// GENERIERT aus dem Signaturblock von Issue #72.
// [project-store] fuegeAssetHinzu implementieren
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
// GERUEST-PRUEFSUMME: 16ef9210b65347ca

import { holeAktivesProjekt } from './aktives-projekt'
import { sofortFlush } from './auto-speichern'
import { mitD1Lock } from './d1-lock'

// Fremde Aufrufe - vollstaendige Signaturen, damit hier nichts geraten wird:
//   #32:  mitD1Lock<T>(aktion: () => Promise<T>): Promise<T>
//         // fuehrt aktion() garantiert seriell aus (FIFO, prozessintern, KEINE Datei-Sperre);
//         // `aktion` darf selbst NICHT erneut mitD1Lock aufrufen (Deadlock); eine Exception in
//         // aktion() gibt das Lock trotzdem frei.
//   #47:  sofortFlush(projekt: Project): Promise<Ergebnis<void, ProjectStoreFehlercode>>
//         // bricht einen laufenden Entprellungstimer ab und schreibt `projekt` SOFORT via
//         // schreibeProjekt (#46); MUSS von der aufrufenden Stelle INNERHALB von mitD1Lock
//         // ausgefuehrt werden - genau das ist hier der Fall. Feuert im Fehlerfall sein eigenes
//         // Ereignis und plant einen Wiederholversuch; das ersetzt den Rueckgabewert NICHT.
//   #192: holeAktivesProjekt(): Project | null
//         // das aktuell geoeffnete Projekt als LEBENDEN Stand (dieselbe Objektreferenz, die die
//         // Instant-Operationen mutieren), kein Projekt offen -> null. SYNCHRON, NIMMT KEIN
//         // LOCK, WIRFT NIE.
//
// ZUM STOPP-BLOCK DES ISSUES ("kein holeAktivesProjekt(), kein exportierter Zustand"): Das Verbot
// richtet sich gegen eine ZWEITE TUER, die DIESE Datei aufmacht - es untersagt, hier einen eigenen
// Zugang zum geladenen Projekt zu ERFINDEN. Genau das geschieht nicht: #192 ist seit dem
// 12.08.2026 gebaut, main-intern (kein IPC-Kanal, kein Eintrag in kanaele.ts) und ist der EINE
// Halter des Standes; `auto-speichern.ts` (#47) und `loesche-projekt.ts` (#37) lesen ihn bereits
// ueber dieselbe Funktion. Ein modul-lokaler Zwischenspeicher waere hier die zweite Wahrheit, die
// das Issue ausschliesst - er entsteht nicht. GEMELDET, nicht eigenmaechtig umgedeutet.

import type { Asset } from '../../shared/contracts/asset'
import type { Ergebnis } from '../../shared/contracts/ergebnis'

// Fehlercode-Union des Moduls `project-store` – sie wird HIER deklariert (Begründung unten);
// #73 und #74 liegen in derselben Datei und verwenden sie, #75 (`ausgaben.ts`) importiert sie
// von hier. Diese Zeile ist Teil dieses Issues.
export type ProjectStoreFehlercode = 'speicher_fehler'

/**
 * Zeichen, die einen `dateiname` zu einem PFAD machen wuerden.
 *
 * Geprueft wird auf BEIDE Trenner, unabhaengig vom Betriebssystem: Ein unter Windows
 * geschriebener `a\b.mp4` waere unter macOS ein zulaessiger Dateiname mit Backslash darin - das
 * Projekt soll aber zwischen beiden Systemen portabel sein (TK 9.4.8 Punkt 1). Eine Pruefung, die
 * nur den heimischen Trenner kennt, laesst die Datei genau dort durch, wo sie spaeter bricht.
 */
const PFAD_TRENNER = ['/', '\\']

export async function fuegeAssetHinzu(
  projektId: string,
  asset: Asset,
): Promise<Ergebnis<Asset, ProjectStoreFehlercode>> {
  // ALLES liegt im Lock - auch die Pruefungen. Das ist nicht Vorsicht, sondern noetig: Die
  // Zuordnungs- und die Doppel-ID-Pruefung LESEN den lebenden Stand, den ein parallel laufender
  // Abschnitt (ein zweiter Import, ein Projektwechsel) gerade veraendern koennte. Wer erst
  // ausserhalb prueft und dann drinnen anhaengt, prueft einen Stand, der beim Anhaengen nicht
  // mehr gilt - und traegt das Asset in das inzwischen gewechselte Projekt ein.
  //
  // Genommen wird es GENAU EINMAL, hier. Der `media-service` darf diesen Aufruf nicht noch einmal
  // einwickeln: mitD1Lock (#32) ist nicht reentrant, ein geschachtelter Aufruf wartet auf sich
  // selbst.
  //
  // Die Rueckgabeangabe am Rueckruf ist nicht Zierde: Ohne sie hat `return { ok: true, ... }`
  // keinen Zieltyp, `ok` weitete sich zu `boolean` - und die unterschiedene Union `Ergebnis`
  // passte nicht mehr.
  return mitD1Lock(async (): Promise<Ergebnis<Asset, ProjectStoreFehlercode>> => {
    // ---------------------------------------------------------------------
    // Schritt 1: validieren. Bei jedem Verstoss Abbruch OHNE Wirkung und OHNE Flush.
    //
    // ZUERST die reinen FORMFEHLER beider Eingaenge, DANACH die Zuordnung. Der Grund ist die
    // Unterscheidbarkeit fuer den Aufrufer: Ein kaputter Datensatz ist ein Programmierfehler des
    // `media-service` und liegt unabhaengig davon vor, welches Projekt gerade offen ist. Liefe
    // die Zuordnungspruefung zuerst, bekaeme derselbe Fehler mal `ungueltige_eingabe` und mal
    // `nicht_gefunden`, je nachdem, ob zufaellig ein Projekt geladen war - und der Aufrufer
    // suchte den Fehler im falschen Schritt.

    // `typeof` trotz `string` in der Signatur: "Der Main validiert jede eingehende Nutzlast"
    // (TK 9.1.1, Punkt 6). Der Typ gilt nur, solange der Aufrufer selbst typgeprueft gebaut ist;
    // die Pruefung kostet nichts und faengt den Fall, in dem er es nicht ist.
    if (typeof projektId !== 'string' || projektId.trim() === '') {
      return fehler('ungueltige_eingabe', 'Es wurde keine brauchbare Projekt-ID uebergeben.')
    }

    const formfehler = pruefeAsset(asset)
    if (formfehler !== null) {
      return fehler('ungueltige_eingabe', formfehler)
    }

    // Zuordnung. "Nur *ein* Projekt ist gleichzeitig geladen." (TK 9.5.1) - deshalb ist die
    // Frage "gehoert dieser Import zum offenen Projekt?" mit einem Vergleich beantwortet und
    // braucht kein Nachladen von der Platte. Kein geladenes Projekt und ein FREMDES Projekt sind
    // fachlich derselbe Fall: Das Ziel des Eintrags ist nicht da.
    const projekt = holeAktivesProjekt()
    if (projekt === null || projekt.id !== projektId) {
      return fehler(
        'nicht_gefunden',
        'Das Projekt, in das eingetragen werden soll, ist nicht das geoeffnete Projekt.',
      )
    }

    // Doppelte ID. KEIN Ueberschreiben und kein stilles "ist ja schon da"-Erfolg: Zwei Assets mit
    // derselben ID machen jede Referenzaufloesung (Listenelement.ref) mehrdeutig, und ein
    // vorgetaeuschter Erfolg liesse den Aufrufer glauben, seine gerade kopierte Datei sei
    // eingetragen - eingetragen waere aber die aeltere, auf eine andere Datei zeigende Fassung.
    if (projekt.assets.some((vorhanden) => vorhanden.id === asset.id)) {
      return fehler(
        'ungueltige_eingabe',
        `Ein Asset mit der ID ${asset.id} steht bereits in diesem Projekt; es wurde nichts eingetragen.`,
      )
    }

    // ---------------------------------------------------------------------
    // Schritt 2: anhaengen, am ENDE des Arrays. Die Reihenfolge der vorhandenen Assets bleibt
    // unangetastet - `Project.assets` ist zwar keine Wiedergabeliste, aber die Oberflaeche zeigt
    // sie in Array-Reihenfolge, und ein Import darf die Medienliste nicht umsortieren.
    //
    // Angehaengt wird die UEBERGEBENE Objektreferenz, keine Kopie. Eine Kopie waere die zweite
    // Wahrheit an genau der Stelle, an der #74 (`setzeAssetZustand`) spaeter mutiert: Der
    // Aufrufer hielte dann ein Asset in der Hand, dessen `zustand` sich nie mehr aendert.
    projekt.assets.push(asset)

    // ---------------------------------------------------------------------
    // Schritt 3: sofort schreiben, im SELBEN Lock-Abschnitt, und das Ergebnis ABWARTEN.
    //
    // Nicht `planeAutoSpeicherung`: Der Import ist ein AUFTRAG, und "am Ende jedes Auftrags, der
    // D1 veraendert hat" schreibt der Sofort-Flush (TK 9.5.4, vierter Anlass). Die Entprellung
    // faengt Slider-Zuege ab; hier liegt die kopierte Mediendatei bereits auf der Platte, und ein
    // Absturz in den 3-5 s danach liesse sie als Waise zurueck, die der Reconcile beim naechsten
    // Start stillschweigend loescht (TK 9.4.7) - der Nutzer hat minutenlang gewartet und findet
    // nichts vor. `sofortFlush` bricht den Entprellungstimer selbst ab; ein ZUSAETZLICHES
    // `planeAutoSpeicherung` waere kein Sicherheitsnetz, sondern ein zweiter Schreibanstoss fuer
    // dieselbe Aenderung.
    const geschrieben = await sofortFlush(projekt)

    if (!geschrieben.ok) {
      // ZURUECKNEHMEN. Das ist kein Widerspruch zu "kein Rollback" (TK 9.5.4): Jener Satz
      // schuetzt NUTZERARBEIT (Trims, Dauern, Reihenfolgen) vor der entprellten Speicherung.
      // Hier gibt es keine Nutzerarbeit zu retten - der Auftrag ist gescheitert, und
      // TK 9.4.8 Punkt 5 verlangt woertlich "D1-Schreibfehler nach Rename -> kein Halbzustand
      // mit Referenz". Bliebe der Eintrag im Speicher, zeigte die Oberflaeche ein Medium, das
      // nach dem naechsten Start weg ist.
      //
      // Entfernt wird ueber die IDENTITAET des Objekts, nicht ueber den vor dem `push` gemerkten
      // Index: Zwischen `push` und hier liegt ein `await`, in dem anderer Code laufen kann. Ein
      // fester Index traefe nach einer fremden Aenderung ein FREMDES Asset - der Rollback wuerde
      // dann zum Datenverlust. `lastIndexOf`, weil unser Eintrag der zuletzt angehaengte ist.
      const stelle = projekt.assets.lastIndexOf(asset)
      if (stelle !== -1) {
        projekt.assets.splice(stelle, 1)
      }

      // KEIN eigener Wiederholversuch und KEIN eigenes Ereignis an den Renderer: Beides gehoert
      // #47 (das den Wiederholtermin bereits gesetzt und "nicht gespeichert" gemeldet hat) bzw.
      // dem Auftrags-Zustand. Zwei Wiederholungen fuer einen Schreibvorgang schrieben zweimal.
      //
      // Der Code wird auf `speicher_fehler` FESTGESCHRIEBEN und nicht durchgereicht: Der einzige
      // fachliche Code dieser Funktion ist laut Fehlerpfad-Tabelle `speicher_fehler`, und
      // `sofortFlush` kann daneben `unbekannter_fehler` liefern (sein eigener Fang um
      // schreibeProjekt). Beides bedeutet hier dasselbe - der Eintrag steht nicht auf der Platte.
      // Die urspruengliche Meldung bleibt erhalten, damit die Ursache nicht verlorengeht.
      return fehler(
        'speicher_fehler',
        `Das Medium konnte nicht in das Projekt eingetragen werden, weil der Projektstand nicht ` +
          `gespeichert werden konnte; der Eintrag wurde zurueckgenommen. Grund: ${geschrieben.fehler.meldung}`,
      )
    }

    // ---------------------------------------------------------------------
    // Schritt 4: ERST JETZT Erfolg. Ab hier gilt beides - das Asset steht am Ende von
    // Project.assets UND es steht auf der Platte.
    return { ok: true, wert: asset }
  })
}
// - läuft VOLLSTÄNDIG innerhalb von mitD1Lock(...) (#32) – diese Funktion nimmt das Lock SELBST;
//   der Aufrufer (media-service) darf sie NICHT zusätzlich in mitD1Lock einwickeln
// - hängt asset an Project.assets des aktiven Projekts an (Array-Ende)
// - ruft DANACH, im SELBEN Lock-Abschnitt, sofortFlush(projekt) (#47) auf: der Import ist ein
//   Auftrag, und ein Auftrag, der D1 verändert hat, schreibt am Ende sofort (TK 9.5.4, 9.4.5)
// - meldet Erfolg ERST, wenn der Flush gelungen ist; scheitert er -> speicher_fehler und das
//   Anhängen wird zurückgenommen (s. „ENTSCHIEDEN – Anhängen, Flush, Erfolg")
// - liefert bei Erfolg genau das übernommene Asset zurück

/**
 * Die Formpruefung des Datensatzes. Liefert die Meldung zum Verstoss oder `null`.
 *
 * GEPRUEFT WIRD NUR, WAS D1 VERGIFTET: leere `id` (unauffindbar), unbekannter `typ` (die
 * Oberflaeche entscheidet daran, ob sie ein Video oder ein Bild zeigt), `dateiname` mit
 * Verzeichnisanteil (Path-Traversal-Vorstufe, TK 9.4.8 Punkt 1).
 *
 * NICHT geprueft werden `maße`, `dauer` und `importdatum`. Die stammen aus `ffprobe` im
 * `media-service` und werden dort erzeugt und geprueft; eine zweite, abweichende Pruefung hier
 * waere eine zweite Wahrheitsquelle ueber dasselbe Format - und die beiden liefen mit jeder
 * Formatentscheidung weiter auseinander. Auch die ENDUNG wird hier nicht gegen die
 * FORMAT_WHITELIST (#13) gehalten: Welche Formate importierbar sind, entscheidet der Dateidialog
 * und der Import (TK 9.4.5, Schritte 1-2); der `project-store` traegt ein, was ihm gereicht wird.
 */
function pruefeAsset(asset: Asset): string | null {
  // Der Umweg ueber `unknown`: Die Signatur sagt `Asset`, die Nutzlast kommt aber von einem
  // Aufrufer, dessen Typpruefung hier nicht mehr gilt (TK 9.1.1, Punkt 6). Ein direktes
  // `asset === null` waere gegen den deklarierten Typ ein Vergleich ohne Ueberschneidung und
  // scheiterte im Typecheck - `unknown` sagt genau das aus, was gemeint ist: ungeprueft.
  const roh: unknown = asset
  if (roh === null || typeof roh !== 'object') {
    return 'Es wurde kein Asset-Datensatz uebergeben.'
  }
  if (typeof asset.id !== 'string' || asset.id.trim() === '') {
    return 'Der Asset-Datensatz hat keine brauchbare ID.'
  }
  if (asset.typ !== 'video' && asset.typ !== 'bild') {
    return 'Der Asset-Datensatz nennt keinen bekannten Medientyp (erwartet: video oder bild).'
  }
  if (typeof asset.dateiname !== 'string' || asset.dateiname.trim() === '') {
    return 'Der Asset-Datensatz hat keinen Dateinamen.'
  }
  // `..` wird MITGEPRUEFT, obwohl es ohne Trenner allein noch kein Ausbruch waere: Der Wert wird
  // spaeter mit dem Medienordner zusammengesetzt (path.join, #49), und dort ist ".." genau der
  // Schritt nach oben. Ein Dateiname, der das enthaelt, ist in keinem Fall der von #13 zugesagte
  // "<uuid>.<ext>".
  if (
    PFAD_TRENNER.some((zeichen) => asset.dateiname.includes(zeichen)) ||
    asset.dateiname.includes('..')
  ) {
    // Der beanstandete Wert steht ABSICHTLICH nicht in der Meldung - sie reist bis in die
    // Oberflaeche (gleiche Linie wie pfade.ts #49 und loesche-projekt.ts #37).
    return 'Der Dateiname enthaelt einen Verzeichnisanteil; erwartet wird ein reiner Dateiname.'
  }
  return null
}

/** Eine Fehlerhuelle, damit die sieben Rueckgabestellen oben nicht siebenmal dasselbe bauen. */
function fehler(
  code: ProjectStoreFehlercode | 'ungueltige_eingabe' | 'nicht_gefunden',
  meldung: string,
): Ergebnis<Asset, ProjectStoreFehlercode> {
  // Ohne `daten`: Diese Funktion vergibt keinen Code, zu dem das TK Nutzdaten vorsieht
  // (`asset_referenziert` u. a. entstehen anderswo). Ein leeres Feld mitzuschicken hiesse, dem
  // Aufrufer etwas zum Auswerten anzubieten, das nie etwas enthaelt.
  return { ok: false, fehler: { code, meldung } }
}

// NICHT HIER, UND GEMELDET:
//
// 1. KEIN DATEISYSTEM. Diese Datei enthaelt kein `fs`, kein `path`, kein `child_process`; sie
//    kopiert nichts, loescht nichts und prueft keine Existenz. Ob die Datei zu `asset.dateiname`
//    wirklich in `media/` liegt, hat der `media-service` beim Import sichergestellt (TK 9.4.5,
//    Schritte 1-3) und prueft der Reconcile beim Start (TK 9.4.7).
//
// 2. KEIN `schreibeProjekt` (#46) UND KEIN ZWEITER SCHREIBWEG. Der Weg auf die Platte laeuft
//    ausschliesslich ueber `sofortFlush` (#47); daran haengen das atomare Schreiben, das
//    .bak-Backup und die Fehlermeldung an die Oberflaeche.
//
// 3. KEIN `Project.geaendertAm`. Ob der Zeitstempel bei der Mutation im Speicher oder erst beim
//    Schreiben gesetzt wird, ist im Bestand offen (dieselbe Frage steht in #41). Diese Funktion
//    legt sie nicht einseitig fest - s. Bericht/STOPP.
//
// 4. KEIN ZWEITER FEHLERCODE. `ProjectStoreFehlercode` bleibt bei dem einen Wert
//    `speicher_fehler`. Die uebrigen Import-Codes aus TK 9.4.9 (`datei_nicht_gefunden`,
//    `format_nicht_unterstuetzt`, `probe_fehler`, `kopier_fehler`) entstehen in den Schritten 1-3
//    beim `media-service` und nie hier.

// ================================================================================================
// VON HAND NACHGETRAGEN am 12.08.2026 - die beiden folgenden Ruempfe hat der Generator NIE erzeugt.
//
// Diese Datei wird von DREI Issues beansprucht (#72, #73, #74); geschrieben hat der Generator nur
// den Rumpf von #72. Aufgefallen ist es erst, als #73 und #74 nach dem Bau von #72 weder als
// "bereit" noch als "blockiert" auftauchten: Die Bereitschaftsrechnung haelt eine Datei ohne
// offene Ruempfe fuer fertig - und ohne die Ruempfe SAH sie fertig aus, obwohl zwei Drittel des
// Vertrags fehlten. Nachliefern kann der Generator sie nicht mehr, weil die Pruefsumme dieser
// Datei seit dem Fuellen von #72 nicht mehr stimmt.
//
// Dieselbe Luecke wie bei `flushBeimBeenden` (#47): Signatur im Issue, kein Rumpf in der Datei.
// Die Signaturen unten stammen WOERTLICH aus den Signaturbloecken von #73 und #74.
// ================================================================================================

/* eslint-disable @typescript-eslint/no-unused-vars --
   NUR fuer die zwei folgenden Ruempfe: Ihre Parameter SIND der Vertrag, benutzt werden sie erst,
   wenn #73 bzw. #74 gebaut wird. WER EINEN DIESER RUMPFE FUELLT, PRUEFT, OB DIESE ABSCHALTUNG
   DANACH NOCH NOETIG IST - bleibt sie ohne Grund stehen, ist die Regel in diesem Abschnitt
   dauerhaft blind, und zwar unauffaellig, weil dann nichts mehr rot ist. Die urspruengliche
   Abschaltzeile der Datei hat #72 zu Recht entfernt; sie galt fuer die ganze Datei. */
export async function entferneAsset(
  projektId: string,
  assetId: string,
): Promise<Ergebnis<Asset, 'asset_referenziert' | 'asset_nicht_gefunden' | ProjectStoreFehlercode>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #73."
  );
}
// - Referenzpruefung UND Entfernen in EINEM mitD1Lock-Aufruf; nimmt das Lock SELBST
// - entfernt AUSSCHLIESSLICH den Eintrag aus Project.assets; KEIN fs.unlink
// - liefert den ENTFERNTEN Asset-Datensatz zurueck (der Aufrufer braucht dessen `dateiname`)
// - bei `asset_referenziert` traegt der Fehler daten: { referenzenIds: string[] }
// - ruft im SELBEN Lock-Abschnitt sofortFlush (#47); Erfolg ERST nach gelungenem Flush

export async function setzeAssetZustand(
  projektId: string,
  assetId: string,
  zustand: 'ok' | 'fehlt',
): Promise<Ergebnis<void, ProjectStoreFehlercode>> {
  throw new Error(
    "Noch nicht umgesetzt - Rumpf gehoert zu Issue #74."
  );
}
// - laeuft VOLLSTAENDIG in mitD1Lock; nimmt das Lock SELBST
// - setzt AUSSCHLIESSLICH das Feld `zustand`; kein anderes Feld wird beruehrt
// - ruft danach planeAutoSpeicherung (#47) und schreibt selbst NICHTS auf die Platte
/* eslint-enable @typescript-eslint/no-unused-vars */
