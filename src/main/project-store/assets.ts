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
import { planeAutoSpeicherung, sofortFlush } from './auto-speichern'
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
// Nur fuer die Referenzpruefung in #73 - der Typ, nicht der Wert; zur Laufzeit bleibt diese Datei
// ohne weitere Abhaengigkeit.
import type { Project } from '../../shared/contracts/project'

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
    // ZUERST anmelden, DANN sofort schreiben (12.08.2026). Das Anmelden ist hier nicht
    // ueberfluessig, obwohl gleich darauf sofort geschrieben wird: planeAutoSpeicherung (#47)
    // ist seit demselben Tag der eine Ort, an dem `geaendertAm` fortgeschrieben wird, und
    // sofortFlush stempelt NICHT. Ohne diese Zeile schriebe ein Auftrag project.json mit dem
    // ALTEN Aenderungsdatum - "zuletzt bearbeitet" in listeProjekte (#35) bliebe nach einem
    // Import bzw. einem Medien-Loeschvorgang stehen, obwohl sich das Projekt geaendert hat.
    //
    // Warum nicht in sofortFlush selbst gestempelt wird: Sie wird auch VOR einem Render, vor
    // einem Export und beim Beenden gerufen - dort hat sich nichts geaendert, und ein Stempel
    // waere schlicht falsch. Den Unterschied kennt nur der Aufrufer.
    //
    // Der von planeAutoSpeicherung gesetzte Entprellungstermin ist unschaedlich: sofortFlush
    // bricht ihn als ERSTES wieder ab.
    planeAutoSpeicherung(projekt)
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

// Die hier zuvor stehende Abschaltzeile fuer @typescript-eslint/no-unused-vars ist ENTFALLEN:
// Sie deckte genau die beiden leeren Ruempfe unten ab, deren Parameter niemand benutzte. Mit dem
// Fuellen von #73 und #74 wird jeder Parameter beider Funktionen verwendet; die Abschaltung haette
// die Regel in diesem Abschnitt nur noch dauerhaft blind gemacht.

/** Der Fehlercode-Vorrat von `entferneAsset` - einmal benannt, damit er nicht dreimal dasteht. */
type EntferneFehlercode = 'asset_referenziert' | 'asset_nicht_gefunden' | ProjectStoreFehlercode

export async function entferneAsset(
  projektId: string,
  assetId: string,
): Promise<Ergebnis<Asset, 'asset_referenziert' | 'asset_nicht_gefunden' | ProjectStoreFehlercode>> {
  // EIN Lock-Abschnitt fuer ALLES - und das ist hier nicht Stilfrage, sondern der Kern des Issues:
  // Laeuft die Referenzpruefung in einem Abschnitt und das Entfernen in einem zweiten, kann der
  // `composer` dazwischen ein Listenelement anlegen, das genau auf dieses Asset zeigt (TOCTOU).
  // Uebrig blieben ein Element mit `ref` ins Leere und - sobald der `media-service` die Datei
  // loescht - ein Render, der mittendrin abbricht.
  //
  // Auch die Formpruefungen liegen drin, obwohl sie das Lock nicht braeuchten ("kein Lock-Zugriff
  // noetig", Fehlerpfad-Tabelle). Sie kosten dort nichts, halten die Funktion bei EINEM
  // Lock-Aufruf je Aufruf - egal welchen Weg sie nimmt - und folgen der Linie von #72 in
  // derselben Datei.
  //
  // Genommen wird das Lock GENAU EINMAL, hier. Der `media-service` darf den Aufruf nicht noch
  // einmal einwickeln: mitD1Lock (#32) ist nicht reentrant, ein geschachtelter Aufruf wartet auf
  // sich selbst.
  return mitD1Lock(async (): Promise<Ergebnis<Asset, EntferneFehlercode>> => {
    // -----------------------------------------------------------------------
    // Schritt 1: pruefen. Jeder Verstoss bricht OHNE Wirkung und OHNE Flush ab.

    // `typeof` trotz `string` in der Signatur: "Der Main validiert jede eingehende Nutzlast"
    // (TK 9.1.1, Punkt 6) - der Typ gilt nur, solange der Aufrufer selbst typgeprueft gebaut ist.
    if (typeof projektId !== 'string' || projektId.trim() === '') {
      return fehlerEntferne('ungueltige_eingabe', 'Es wurde keine brauchbare Projekt-ID uebergeben.')
    }
    if (typeof assetId !== 'string' || assetId.trim() === '') {
      return fehlerEntferne('ungueltige_eingabe', 'Es wurde keine brauchbare Medien-ID uebergeben.')
    }

    // "Nur *ein* Projekt ist gleichzeitig geladen." (TK 9.5.1) - kein geladenes Projekt und ein
    // FREMDES Projekt sind derselbe fachliche Fall: Der Asset ist in diesem Kontext nicht
    // auffindbar. Deshalb `asset_nicht_gefunden` und nicht das generische `nicht_gefunden`; die
    // Fehlerpfad-Tabelle des Issues nennt fuer beide Zeilen genau diesen Code.
    const projekt = holeAktivesProjekt()
    if (projekt === null || projekt.id !== projektId) {
      return fehlerEntferne(
        'asset_nicht_gefunden',
        'Das Projekt, aus dem entfernt werden soll, ist nicht das geoeffnete Projekt.',
      )
    }

    // Erst der Eintrag, dann die Referenzen - in dieser Reihenfolge, weil eine Referenz auf ein
    // gar nicht vorhandenes Asset sonst den echten Befund ("gibt es nicht") verdecken wuerde.
    //
    // `find` + `indexOf` statt `findIndex` + Index-Zugriff: Bei gesetztem
    // noUncheckedIndexedAccess (#1) ist `assets[i]` vom Typ `Asset | undefined`, und die einzige
    // knappe Aufloesung dafuer waere die verbotene Fluchttuer `assets[i]!` (#193). Ueber die
    // gefundene Objektreferenz gibt es diese Luecke gar nicht erst.
    const entfernt = projekt.assets.find((vorhanden) => vorhanden.id === assetId)
    if (entfernt === undefined) {
      // KEIN stiller Erfolg ("war ja schon weg"): Der `media-service` unterscheidet genau daran,
      // ob er die Datei ueberhaupt anfassen darf.
      return fehlerEntferne(
        'asset_nicht_gefunden',
        'Zu dieser Medien-ID steht im Projekt kein Eintrag; es wurde nichts entfernt.',
      )
    }
    const stelle = projekt.assets.indexOf(entfernt)

    // Der Nachbar VOR dem Eintrag, als Objektreferenz - er ist die Rueckfahrkarte fuer den
    // Fehlschlag weiter unten (Begruendung dort). `undefined` heisst: Der Eintrag stand vorn.
    const vorgaenger: Asset | undefined = stelle > 0 ? projekt.assets[stelle - 1] : undefined

    const referenzenIds = sammleAssetReferenzen(projekt, assetId)
    if (referenzenIds.length > 0) {
      // BLOCKIEREN, nicht kaskadieren: "Medium loeschen ... blockiert bei Referenz" (TK 9.5.3).
      // Kein Listenelement wird entfernt, keins auf null gesetzt - nur `loescheAktion` (#40)
      // kaskadiert, und zwar chirurgisch.
      //
      // Die IDs stehen AUSSCHLIESSLICH in `daten`, nie in der Meldung: `daten` ist "kein Ersatz
      // fuer `meldung`" (TK 9.1.1), und ein Aufrufer, der IDs aus einem Meldungstext
      // herausschneidet, bricht bei der ersten Umformulierung.
      return fehlerEntferne(
        'asset_referenziert',
        `Das Medium wird noch von ${referenzenIds.length} Element(en) der Wiedergabeliste ` +
          `verwendet und kann deshalb nicht geloescht werden.`,
        { referenzenIds },
      )
    }

    // -----------------------------------------------------------------------
    // Schritt 2: entfernen. Im SELBEN synchronen Durchlauf wie die Pruefung - zwischen der Zeile
    // darueber und dieser darf KEIN `await` stehen, sonst ist die TOCTOU-Luecke offen.
    projekt.assets.splice(stelle, 1)

    // -----------------------------------------------------------------------
    // Schritt 3: sofort schreiben, im SELBEN Lock-Abschnitt, und das Ergebnis ABWARTEN. Dies ist
    // der EINZIGE `await` dieser Funktion.
    //
    // Nicht `planeAutoSpeicherung`: Das Loeschen ist ein AUFTRAG, und "am Ende jedes Auftrags,
    // der D1 veraendert hat" schreibt der Sofort-Flush (TK 9.5.4, vierter Anlass). Das ist keine
    // Formalie: Erst der gemeldete Erfolg gibt Schritt 2 des Lösch-Ablaufs frei (fs.unlink im
    // `media-service`). Wuerde hier nur die entprellte Speicherung angestossen, koennte die Datei
    // geloescht werden, waehrend der Eintrag in project.json noch steht - ein Absturz in diesen
    // 3-5 s liesse ein Listenelement auf eine geloeschte Datei zeigen. "D1 zuerst" muss ueber
    // einen Absturz hinweg wahr sein, nicht nur im Arbeitsspeicher (TK 9.4.6, Schritt 1).
    // ZUERST anmelden, DANN sofort schreiben (12.08.2026). Das Anmelden ist hier nicht
    // ueberfluessig, obwohl gleich darauf sofort geschrieben wird: planeAutoSpeicherung (#47)
    // ist seit demselben Tag der eine Ort, an dem `geaendertAm` fortgeschrieben wird, und
    // sofortFlush stempelt NICHT. Ohne diese Zeile schriebe ein Auftrag project.json mit dem
    // ALTEN Aenderungsdatum - "zuletzt bearbeitet" in listeProjekte (#35) bliebe nach einem
    // Import bzw. einem Medien-Loeschvorgang stehen, obwohl sich das Projekt geaendert hat.
    //
    // Warum nicht in sofortFlush selbst gestempelt wird: Sie wird auch VOR einem Render, vor
    // einem Export und beim Beenden gerufen - dort hat sich nichts geaendert, und ein Stempel
    // waere schlicht falsch. Den Unterschied kennt nur der Aufrufer.
    //
    // Der von planeAutoSpeicherung gesetzte Entprellungstermin ist unschaedlich: sofortFlush
    // bricht ihn als ERSTES wieder ab.
    planeAutoSpeicherung(projekt)
    const geschrieben = await sofortFlush(projekt)

    if (!geschrieben.ok) {
      // ZURUECKNEHMEN, und zwar AN DIE URSPRUENGLICHE STELLE. TK 9.4.9 sagt fuer genau diesen
      // Code "die Datei bleibt unangetastet, weil Schritt 1 nie abgeschlossen wurde" - Schritt 1
      // gilt also als NICHT geschehen, und ein im Speicher fehlender Eintrag bei unveraenderter
      // project.json waere das Gegenteil davon (der Nutzer saehe ein Medium verschwinden, das
      // nach dem naechsten Oeffnen wieder da ist).
      //
      // Die POSITION zaehlt, weil `Project.assets` kein Sortierfeld traegt: Die Anzeigereihenfolge
      // der Medien IST die Array-Reihenfolge. Ein Wieder-Anhaengen ans Ende sortierte die
      // Medienliste sichtbar um, obwohl gar nichts passiert ist.
      //
      // Gesucht wird die Stelle ueber die IDENTITAET des Vorgaengers, nicht ueber den gemerkten
      // Index: Zwischen `splice` und hier liegt ein `await`, in dem anderer Code laufen kann - ein
      // fester Index setzte den Eintrag nach einer fremden Aenderung an eine FREMDE Stelle.
      // Dieselbe Ueberlegung wie beim `lastIndexOf` in `fuegeAssetHinzu` oben, nur in die andere
      // Richtung.
      projekt.assets.splice(rueckstelle(projekt.assets, vorgaenger, stelle), 0, entfernt)

      // KEIN eigener Wiederholversuch und KEIN eigenes Ereignis an den Renderer: Beides gehoert
      // #47 bzw. dem Auftrags-Zustand. Der Code wird auf `speicher_fehler` FESTGESCHRIEBEN und
      // nicht durchgereicht - `sofortFlush` kann daneben `unbekannter_fehler` liefern, und beides
      // bedeutet hier dasselbe: Der Stand steht nicht auf der Platte. Die urspruengliche Meldung
      // bleibt erhalten, damit die Ursache nicht verlorengeht.
      return fehlerEntferne(
        'speicher_fehler',
        `Das Medium konnte nicht aus dem Projekt entfernt werden, weil der Projektstand nicht ` +
          `gespeichert werden konnte; der Eintrag wurde zurueckgenommen und die Mediendatei bleibt ` +
          `unangetastet. Grund: ${geschrieben.fehler.meldung}`,
      )
    }

    // -----------------------------------------------------------------------
    // Schritt 4: ERST JETZT Erfolg. Ab hier gilt beides - der Eintrag ist aus Project.assets weg
    // UND er ist dauerhaft weg. Der zurueckgegebene Datensatz ist die einzige Bruecke des
    // `media-service` von der assetId zur Datei: Aus seinem `dateiname` bildet er den Pfad fuer
    // das `fs.unlink` (Schritt 2) und, falls das scheitert, den Vermerk der offenen Loeschung
    // (Schritt 3). Nach dieser Zeile gibt es den `dateiname` in D1 nicht mehr.
    return { ok: true, wert: entfernt }
  })
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
  // VOLLSTAENDIG im Lock, obwohl hier nur ein einzelnes Feld gesetzt wird: Der Reconcile laeuft
  // ueber ALLE Assets und damit vielfach hintereinander, waehrend nebenan der Ablauf beim
  // Projektoeffnen weiterarbeitet. Ohne Lock koennte ein Flush genau zwischen Suchen und Setzen
  // laufen - dann stuende auf der Platte ein Stand, den niemand mehr nachtraegt, weil die
  // Speicherung ja gerade gelaufen ist.
  //
  // Das Lock wird SELBST genommen; der `media-service` darf den Aufruf nicht noch einmal
  // einwickeln (mitD1Lock ist nicht reentrant, #32).
  return mitD1Lock(async (): Promise<Ergebnis<void, ProjectStoreFehlercode>> => {
    if (typeof projektId !== 'string' || projektId.trim() === '') {
      return fehlerZustand('ungueltige_eingabe', 'Es wurde keine brauchbare Projekt-ID uebergeben.')
    }
    if (typeof assetId !== 'string' || assetId.trim() === '') {
      return fehlerZustand('ungueltige_eingabe', 'Es wurde keine brauchbare Medien-ID uebergeben.')
    }
    // Das Feld hat GENAU ZWEI Werte (TK 9.4.4); ein dritter waere erfunden. Geprueft wird er
    // trotz der Signatur, weil der Aufrufer main-intern ruft und seine Typpruefung hier nicht
    // mehr gilt (TK 9.1.1, Punkt 6) - ein durchgereichter Fremdwert stuende sonst dauerhaft in
    // project.json, und jede spaetere Fallunterscheidung ('ok' oder 'fehlt') traefe ihn nicht.
    if (zustand !== 'ok' && zustand !== 'fehlt') {
      return fehlerZustand(
        'ungueltige_eingabe',
        'Der Zustand muss entweder "ok" oder "fehlt" sein.',
      )
    }

    // Anders als bei `entferneAsset` ist der Code hier das GENERISCHE `nicht_gefunden`: Die
    // Fehlerpfad-Tabelle dieses Issues nennt fuer beide Faelle genau diesen, und einen eigenen
    // fachlichen Code sieht TK 9.4.9 fuer den Reconcile nicht vor.
    const projekt = holeAktivesProjekt()
    if (projekt === null || projekt.id !== projektId) {
      return fehlerZustand(
        'nicht_gefunden',
        'Das Projekt, dessen Medium markiert werden soll, ist nicht das geoeffnete Projekt.',
      )
    }

    const asset = projekt.assets.find((vorhanden) => vorhanden.id === assetId)
    if (asset === undefined) {
      // KEIN stiller Erfolg: Ein Reconcile, der eine unbekannte ID meldet, hat einen Fehler, der
      // sichtbar bleiben muss.
      return fehlerZustand(
        'nicht_gefunden',
        'Zu dieser Medien-ID steht im Projekt kein Eintrag; es wurde nichts markiert.',
      )
    }

    // UNVERAENDERT IST ERFOLG, ABER KEINE AENDERUNG. Der Reconcile laeuft bei JEDEM Projektstart
    // ueber ALLE Assets; plante jeder unveraenderte Durchlauf eine Speicherung, schriebe die App
    // bei jedem Oeffnen project.json neu - und weil `planeAutoSpeicherung` (#47) dabei
    // `geaendertAm` fortschreibt, waere der Zeitstempel in der Projektuebersicht (#35) nach jedem
    // Blick ins Projekt neu, obwohl der Nutzer nichts getan hat.
    if (asset.zustand === zustand) {
      return { ok: true, wert: undefined }
    }

    // NUR dieses eine Feld. Auch dann nicht `dauer` oder `maße` leeren, wenn es beim Markieren als
    // `fehlt` naheliegt: Diese Werte beschreiben die einmal importierte Datei; kommt sie zurueck,
    // waere das Asset sonst dauerhaft entwertet, obwohl `zustand` wieder 'ok' ist.
    asset.zustand = zustand

    // ENTPRELLT, nicht sofort: Der Reconcile ist KEIN Auftrag (er laeuft im Ablauf beim
    // Projektoeffnen, nicht ueber die Auftragsverwaltung) und damit keiner der vier
    // Sofort-Flush-Anlaesse aus TK 9.5.4. Genau deshalb entsteht fuer zwanzig markierte Assets
    // EIN Schreibvorgang statt zwanzig. Der Erfolg bedeutet hier "gueltig uebernommen", nicht
    // "schon auf Platte" (TK 9.5.4, Instant-Op vs. Speichern).
    planeAutoSpeicherung(projekt)

    return { ok: true, wert: undefined }
  })
}
// - laeuft VOLLSTAENDIG in mitD1Lock; nimmt das Lock SELBST
// - setzt AUSSCHLIESSLICH das Feld `zustand`; kein anderes Feld wird beruehrt
// - ruft danach planeAutoSpeicherung (#47) und schreibt selbst NICHTS auf die Platte

/**
 * Alle Listenelemente, die auf `assetId` zeigen - deren `id`s, in Listenreihenfolge, ohne
 * Duplikate (#73).
 *
 * GEPRUEFT WIRD NUR `art` 'video' und 'bild'. Bei `art: 'segment'` ist `ref` eine AKTIONS-ID
 * (#15, Kommentar am Feld), und `einblendung.abschnitte[].aktionRef` ebenfalls - beide werden hier
 * gar nicht erst durchlaufen. Wer stumpf ueber alle Elemente `ref === assetId` prueft, vergleicht
 * IDs aus zwei Namensraeumen; das geht heute nur deshalb gut, weil beide UUIDs sind, und waere
 * trotzdem falsch begruendet.
 *
 * Gemeldet werden die `id`s der ELEMENTE, nicht deren `ref`: Der Reparatur-Modus (FA-19, TK 9.7.5)
 * muss die betroffenen Elemente anspringen koennen, und die `ref` ist bei allen Treffern ohnehin
 * dieselbe (`assetId`) und damit wertlos. Die Listenreihenfolge macht die Meldung reproduzierbar.
 */
function sammleAssetReferenzen(projekt: Project, assetId: string): string[] {
  const gefunden: string[] = []

  // 1. Die Wiedergabeliste. Nur video/bild - bei `segment` ist `ref` eine AKTIONS-ID,
  //    ein Treffer dort waere ein Zufall der UUID-Belegung.
  for (const element of projekt.liste) {
    if (element.art !== 'video' && element.art !== 'bild') {
      continue
    }
    if (element.ref === assetId && !gefunden.includes(element.id)) {
      gefunden.push(element.id)
    }
  }

  // 2. Die Aktionen-Bibliothek ueber `bildRef` (ENTSCHIEDEN 12.08.2026).
  //    Bis dahin wurde nur die Liste geprueft. Wurde ein Bild geloescht, auf das NUR eine
  //    Aktion zeigte, blieb dort ein Verweis ins Leere zurueck - und das ist NICHT der Fall
  //    aus TK 9.8.5, wo der Eintrag noch existiert und `zustand: 'fehlt'` traegt. Dort weiss
  //    die Anwendung, dass die Datei fehlt; hier zeigte die Aktion auf eine Kennung, die es
  //    gar nicht mehr gibt.
  //    Blockieren statt aufraeumen: Die Anwendung aendert keine Aktion, die der Nutzer nicht
  //    selbst geaendert hat.
  for (const aktion of projekt.aktionen) {
    if (aktion.bildRef === assetId && !gefunden.includes(aktion.id)) {
      gefunden.push(aktion.id)
    }
  }

  // Einblendungen bleiben aussen vor: `abschnitte[].aktionRef` zeigt auf Aktionen, nicht auf
  // Assets. Wer dort suchte, verglich zwei verschiedene Namensraeume.
  return gefunden
}

/**
 * Die Stelle, an der ein zurueckgenommenes Entfernen wieder einzusetzen ist (#73).
 *
 * Gesucht wird ueber den VORGAENGER als Objektreferenz - der Eintrag gehoert unmittelbar hinter
 * ihn, egal wohin er inzwischen gewandert ist. `undefined` heisst "stand ganz vorn". Ist der
 * Vorgaenger selbst nicht mehr da (eine fremde Aenderung waehrend des `await`), bleibt der
 * urspruengliche Index als beste Naeherung, auf die Laenge begrenzt, damit `splice` nicht ins
 * Leere schreibt.
 */
function rueckstelle(assets: Asset[], vorgaenger: Asset | undefined, urspruenglich: number): number {
  if (vorgaenger === undefined) {
    return 0
  }
  const stelle = assets.indexOf(vorgaenger)
  if (stelle !== -1) {
    return stelle + 1
  }
  return Math.min(urspruenglich, assets.length)
}

/**
 * Die Fehlerhuelle von `entferneAsset` (#73). `daten` reist NUR bei `asset_referenziert` mit und
 * wird sonst weggelassen - ein immer mitgeschicktes, leeres Feld boete dem Aufrufer etwas zum
 * Auswerten an, das nie etwas enthaelt (TK 9.1.1: das Feld ist optional).
 */
function fehlerEntferne(
  code: EntferneFehlercode | 'ungueltige_eingabe',
  meldung: string,
  daten?: { referenzenIds: string[] },
): Ergebnis<Asset, EntferneFehlercode> {
  if (daten === undefined) {
    return { ok: false, fehler: { code, meldung } }
  }
  return { ok: false, fehler: { code, meldung, daten } }
}

/**
 * Die Fehlerhuelle von `setzeAssetZustand` (#74). Ohne `daten`: Diese Funktion vergibt keinen
 * Code, zu dem das TK Nutzdaten vorsieht.
 */
function fehlerZustand(
  code: ProjectStoreFehlercode | 'ungueltige_eingabe' | 'nicht_gefunden',
  meldung: string,
): Ergebnis<void, ProjectStoreFehlercode> {
  return { ok: false, fehler: { code, meldung } }
}
