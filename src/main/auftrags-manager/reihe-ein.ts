// GENERIERT aus dem Signaturblock von Issue #61.
// [auftrags-manager] reiheEin implementieren
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
// GERUEST-PRUEFSUMME: 377d4c7663213470
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
// ERLEDIGT (13.08.2026): Die Abschaltzeile ist mit dem Fuellen des Rumpfes entfernt;
// Parameter und Importe werden jetzt benutzt. Der Absatz darueber bleibt als Beleg
// stehen.

import type { Auftrag, AuftragArt } from '../../shared/contracts/auftrag'
import type { Ergebnis } from '../../shared/contracts/ergebnis'

// Fremde Aufrufe - vollstaendige Signaturen, damit hier nichts geraten wird:
//   #20  (IDs):        erzeugeId(): string
//   #54  (Q1):         fuegeAnsEndeAn(auftrag: Auftrag): number   - liefert die Position (1-basiert)
//   #57  (Q4-Journal): haengeJournalEintragAn(eintrag: JournalEintrag)
//                        : Promise<Ergebnis<void, QueueFehlercode>>
//   #65  (Ereignis):   sendeQueueGeaendert(): Promise<void>
//   #59  (Torwaechter):starteNaechsten(): void
//   #192 (project-store): holeAktivesProjekt(): Project | null
//                        synchron, nimmt kein Lock, wirft nie; liefert den LEBENDEN Stand.

import type { JournalEintrag } from '../../shared/contracts/protokoll'
import { erzeugeId } from '../../shared/contracts/id'
import { holeAktivesProjekt } from '../project-store/aktives-projekt'
import { fuegeAnsEndeAn } from './q1-warteschlange'
import { haengeJournalEintragAn } from './q4-journal'
import { sendeQueueGeaendert } from './queue-ereignis'
import { starteNaechsten } from './torwaechter'

// Bindet die Nutzlast typsicher an die Auftragsart (Auftrag ist eine diskriminierte Union über
// `art`, #16): NutzlastVon<'render'> ist RenderRequest, NutzlastVon<'import'> ist ImportRequest usw.
export type NutzlastVon<A extends AuftragArt> = Extract<Auftrag, { art: A }>['payload']

export async function reiheEin<A extends AuftragArt>(
  art: A,
  payload: NutzlastVon<A>,
): Promise<Ergebnis<{ auftragId: string }>> {
  // SCHRITT 1 UND 2 in einem: Die Nutzlast wird geprueft, und nur wenn sie traegt,
  // entsteht ueberhaupt ein Auftrag. Bis hierher hat der Aufruf KEINE Wirkung - kein
  // Q1-Eintrag, keine Journalbewegung, kein Ereignis, kein Anstoss des Torwaechters
  // ("Ein Fehler im Renderer darf D1 niemals beschaedigen.", TK 9.1.1 Punkt 6).
  const gebaut = baueAuftrag(art, payload)
  if (typeof gebaut === 'string') {
    return { ok: false, fehler: { code: 'ungueltige_eingabe', meldung: gebaut } }
  }

  // ---------------------------------------------------------------------------------
  // SCHRITT 3 - SYNCHRON, UNMITTELBAR NACH DEM BAUEN. Zwischen `baueAuftrag` und dieser
  // Zeile steht KEIN `await`: Zwei dicht aufeinanderfolgende Aufrufe wuerden sonst in
  // einer anderen Reihenfolge in Q1 landen, als sie hereinkamen, und das Panel zeigte
  // eine andere Abfolge, als tatsaechlich ausgefuehrt wird (FIFO, TK 9.3.5).
  // ---------------------------------------------------------------------------------
  const position = fuegeAnsEndeAn(gebaut)

  // ---------------------------------------------------------------------------------
  // AB HIER IST DER AUFTRAG EINGEREIHT. Was jetzt noch schiefgeht, nimmt ihn NICHT
  // wieder heraus und macht die Antwort nicht zum Fehler.
  // ---------------------------------------------------------------------------------

  // SCHRITT 4: Q4 ist "rein diagnostisch" (TK 9.3) - deshalb NICHT abgewartet, aber mit
  // `.catch` (ein floating Promise ohne Fang ist verboten). Dieselbe Zeit wie
  // `erstelltAm` und keine zweite Abfrage: Es ist derselbe Vorgang, und zwei `new Date()`
  // ergaeben fuer ihn zwei minimal verschiedene Zeitpunkte in zwei Speichern.
  schreibeBewegung({
    zeit: gebaut.erstelltAm,
    auftragId: gebaut.auftragId,
    bewegung: 'eingereiht',
    position,
  })

  // SCHRITT 5: ABGEWARTET, so verlangt es das Issue ausdruecklich - die Hoerer haben den
  // neuen Stand, bevor der Aufrufer seine `auftragId` bekommt. (Der Torwaechter #59
  // meldet an derselben Stelle OHNE `await`; er ist synchron und kann nicht warten.)
  await melde()

  // SCHRITT 6: Anstossen, NICHT selbst starten. Ob etwas losgeht, entscheidet allein der
  // Torwaechter - laeuft schon einer, passiert hier nichts. Ein "wenn die Schlange
  // gerade leer ist, starte ich eben selbst" waere das Umgehen des EINZIGEN
  // Sperr-Mechanismus des Systems (TK 9.3.5).
  stosseAn()

  // SCHRITT 7: SOFORT antworten. Der Ausgang des Vorgangs reist nicht in dieser Antwort,
  // sondern ueber den Auftrags-Zustand ("Zwei Ebenen nicht verwechseln.", TK 9.1.1
  // Punkt 1). Wer hier auf das Ende warten wuerde, hielte die Oberflaeche fuer die
  // gesamte Renderdauer an - und die Warteschlange waere sinnlos.
  return { ok: true, wert: { auftragId: gebaut.auftragId } }
}
// Ablauf: pruefen -> Auftrag bauen (versuche 0, status 'anstehend') -> fuegeAnsEndeAn
//         (synchron) -> Q4-Bewegung `eingereiht` (ohne await) -> queue:geaendert (await)
//         -> starteNaechsten() -> { ok: true, wert: { auftragId } }

// -------------------------------------------------------------------------------------------
// Der Auftrag
// -------------------------------------------------------------------------------------------

/**
 * Baut den fertigen `Auftrag` - oder liefert den Mangel als Klartext, wenn die Nutzlast
 * nicht traegt.
 *
 * WARUM `Auftrag | string` UND KEINE HUELLE: Der einzige Fehlercode dieser Datei steht
 * fest (`ungueltige_eingabe`, der Satz ist geschlossen); zurueckzugeben bleibt allein die
 * Meldung. Eine zweite Huelle hier wuerde nur an einer Stelle wieder ausgepackt.
 *
 * WARUM VIER ZWEIGE UND KEINE UMSCHREIBUNG (`as Auftrag`): `Auftrag` ist eine
 * diskriminierte Union (#16), und die Bindung "art passt zu payload" ist genau das, was
 * sie zusichert. Mit einer Umschreibung koennte hier eine `render`-Nutzlast unter
 * `art: 'import'` landen, ohne dass irgendetwas rot wuerde - und der Dispatcher (#60)
 * uebergaebe sie dem falschen Fachdienst. So prueft der Typechecker jeden Zweig einzeln.
 */
function baueAuftrag<A extends AuftragArt>(art: A, payload: NutzlastVon<A>): Auftrag | string {
  if (art === 'import') {
    if (!istImportNutzlast(payload)) {
      return 'Die Nutzlast eines Imports braucht die Textfelder projektId und quellPfad.'
    }
    return { ...basis(), art: 'import', label: `Import: ${dateiname(payload.quellPfad)}`, payload }
  }

  if (art === 'loeschen') {
    if (!istLoeschNutzlast(payload)) {
      return 'Die Nutzlast eines Loeschauftrags braucht die Textfelder projektId und assetId.'
    }
    return { ...basis(), art: 'loeschen', label: loeschLabel(payload), payload }
  }

  if (art === 'render') {
    if (!istRenderNutzlast(payload)) {
      return (
        'Die Nutzlast eines Renders braucht die Textfelder renderId, projektId und ' +
        'ausgabeName, eine Liste elemente und ein Profil.'
      )
    }
    return { ...basis(), art: 'render', label: `Render: ${payload.ausgabeName}.mp4`, payload }
  }

  if (art === 'export') {
    if (!istExportNutzlast(payload)) {
      return 'Die Nutzlast eines Exports braucht die Textfelder projektId, dateiname und zielPfad.'
    }
    return { ...basis(), art: 'export', label: `Export: ${payload.dateiname}`, payload }
  }

  // Erreichbar, obwohl `art` typisiert ist: Der Aufruf kommt ueber #71 vom Renderer
  // herein, und die Nutzlast eines IPC-Aufrufs ist zur Laufzeit alles Moegliche.
  return `Unbekannte Auftragsart "${String(art)}".`
}

/**
 * Die Felder, die JEDER frisch eingereihte Auftrag gleich traegt.
 *
 * `versuche: 0` - gezaehlt wird die Anzahl TATSAECHLICH GESTARTETER Ausfuehrungen, und das
 * tut genau einmal der Torwaechter beim Start (#59). Nicht hier und nicht in `wiederhole`
 * (#63); zaehlten zwei Stellen mit, waere `ProtokollEintrag.versuch` unbrauchbar.
 *
 * `ergebnis: null` aus demselben Grund wie `fehler: null`: Ein eben eingereihter Auftrag
 * hat noch nichts hervorgebracht. Die fachlichen Nutzdaten traegt erst der Abschluss ein
 * (#70), und zwar nur bei `erfolg` (TK 9.3.1).
 *
 * Eine Funktion und keine Konstante, damit auf dem Fehlerpfad weder eine UUID verbraucht
 * noch eine Zeit gestempelt wird - dort soll nachweislich nichts entstehen.
 */
function basis(): {
  auftragId: string
  status: 'anstehend'
  versuche: number
  fortschritt: null
  fehler: null
  ergebnis: null
  erstelltAm: string
} {
  return {
    // Die auftragId kommt aus dem geteilten Generator (#20) - "Alle IDs sind UUIDs …
    // Keine fortlaufenden Zaehler … Keine aus Namen abgeleiteten IDs" (TK 9.11.4). Ein
    // Zeitstempel als Kennung schiede schon deshalb aus, weil zwei Aufrufe in derselben
    // Millisekunde dieselbe traegen.
    auftragId: erzeugeId(),
    status: 'anstehend',
    versuche: 0,
    fortschritt: null,
    fehler: null,
    ergebnis: null,
    erstelltAm: new Date().toISOString(),
  }
}

// -------------------------------------------------------------------------------------------
// Das Label - reine Anzeige (TK 9.3.1). Nie Steuerung, nie Vergleich, nie Dateiname.
// -------------------------------------------------------------------------------------------

/**
 * Der Dateiname ohne Verzeichnisanteil - AUF BEIDE TRENNER geprueft.
 *
 * `path.basename` steht hier bewusst nicht: Auf macOS zerlegt es einen Windows-Pfad NICHT
 * (der Backslash ist dort ein gueltiges Zeichen im Dateinamen), und das Panel zeigte dann
 * den ganzen Pfad. Das Projekt laeuft auf beiden Plattformen, und ein Projektordner kann
 * auf einem Stick zwischen ihnen wandern.
 *
 * Endet der Pfad auf einem Trenner, bleibt der ganze String stehen - lieber zu viel
 * anzeigen als eine leere Zeile im Panel.
 */
function dateiname(pfad: string): string {
  const stelle = Math.max(pfad.lastIndexOf('/'), pfad.lastIndexOf('\\'))
  const name = stelle === -1 ? pfad : pfad.slice(stelle + 1)
  return name.length > 0 ? name : pfad
}

/**
 * `Löschen: <originalname>` - der einzige Label-Fall mit einem Nachschlag im Projekt.
 *
 * ZUM STOPP-PUNKT DES ISSUES ("Ueber welche Funktion des project-store liest der Main den
 * originalname zu einer assetId? … Nicht selbst waehlen"): Die Frage IST beantwortet, nur
 * spaeter als das Issue. #192 (`holeAktivesProjekt`, seit dem 12.08.2026 gebaut) ist der
 * main-interne Lesezugang zum geladenen Projekt, und #50 - genau das Issue, mit dem der
 * Punkt laut Vorgabe "einheitlich beantwortet werden" muss - benutzt seit dem 12.08.2026
 * ebendiese Funktion. Hier entsteht also KEIN zweiter Weg an das geladene Projekt,
 * sondern derselbe. Gemeldet ist der ueberholte STOPP-Punkt trotzdem (s. Dateiende).
 *
 * DER VERGLEICH `projekt.id === payload.projektId` STEHT VOR DEM NACHSCHLAG: Es ist immer
 * nur EIN Projekt geladen (TK 9.5.1). Faende man ohne den Vergleich eine gleichlautende
 * assetId in einem ANDEREN Projekt, stuende im Panel der Name einer fremden Datei -
 * schlimmer als kein Name, weil er glaubwuerdig aussieht.
 *
 * KEIN FEHLER, WENN NICHTS GEFUNDEN WIRD: Ob das Medium existiert, entscheidet sich erst
 * beim Ausfuehren (media-service, M3) und reist ueber den Auftrags-Zustand; ein
 * `nicht_gefunden` gibt es in dieser Operation ausdruecklich nicht. Und die assetId als
 * Ersatz einzusetzen verbietet das Issue - "Loeschen: 9f3c…-a1" waere fuer den Nutzer
 * wertlos.
 */
function loeschLabel(payload: NutzlastVon<'loeschen'>): string {
  const projekt = holeAktivesProjekt()
  const asset =
    projekt !== null && projekt.id === payload.projektId
      ? projekt.assets.find((a) => a.id === payload.assetId)
      : undefined

  return `Löschen: ${asset === undefined ? 'unbekannte Datei' : asset.originalname}`
}

// -------------------------------------------------------------------------------------------
// Die Pruefung der Nutzlast - STRUKTUR, nicht Fachlichkeit (s. Vermerk am Dateiende)
// -------------------------------------------------------------------------------------------

function istObjekt(wert: unknown): wert is Record<string, unknown> {
  // Arrays sind ausgeschlossen: `typeof [] === 'object'`, und ein Array hat keine der
  // verlangten Eigenschaften - ohne diese Zeile fiele es erst zufaellig weiter unten durch.
  return typeof wert === 'object' && wert !== null && !Array.isArray(wert)
}

/**
 * Ein Textfeld, das WIRKLICH etwas enthaelt.
 *
 * Der leere String zaehlt nicht: Als `ausgabeName` ergaebe er die Zieldatei ".mp4", als
 * `quellPfad` einen Import ohne Quelle - beides scheiterte deterministisch, aber erst
 * Minuten spaeter als fehlgeschlagener Auftrag. Reine Leerzeichen ebenso, weil ein
 * Dateiname aus Leerzeichen auf Windows nicht anlegbar ist.
 */
function istText(wert: unknown): boolean {
  return typeof wert === 'string' && wert.trim().length > 0
}

function istImportNutzlast(wert: unknown): wert is NutzlastVon<'import'> {
  return istObjekt(wert) && istText(wert['projektId']) && istText(wert['quellPfad'])
}

function istLoeschNutzlast(wert: unknown): wert is NutzlastVon<'loeschen'> {
  return istObjekt(wert) && istText(wert['projektId']) && istText(wert['assetId'])
}

function istRenderNutzlast(wert: unknown): wert is NutzlastVon<'render'> {
  return (
    istObjekt(wert) &&
    istText(wert['renderId']) &&
    istText(wert['projektId']) &&
    istText(wert['ausgabeName']) &&
    // Die Elemente werden GEZAEHLT, nicht gedeutet: Was ein gueltiges RenderItem ist,
    // weiss der render-service (M6), und er prueft es beim Ausfuehren erneut. Eine leere
    // Liste wird hier NICHT abgewiesen - das waere bereits eine fachliche Aussage
    // darueber, was ein sinnvoller Render ist.
    Array.isArray(wert['elemente']) &&
    istObjekt(wert['profil'])
  )
}

function istExportNutzlast(wert: unknown): wert is NutzlastVon<'export'> {
  return (
    istObjekt(wert) &&
    istText(wert['projektId']) &&
    istText(wert['dateiname']) &&
    istText(wert['zielPfad'])
  )
}

// -------------------------------------------------------------------------------------------
// Die drei Nebenwege - keiner darf das bereits vollzogene Einreihen zurueckdrehen
// -------------------------------------------------------------------------------------------

/**
 * Q4-Bewegung schreiben, ohne den Auftragsfluss anzuhalten.
 *
 * NICHT ABGEWARTET (Invariante des Issues): "Ein gesperrtes oder volles Journal darf weder
 * die Antwortzeit von `reiheEin` bestimmen noch das Einreihen verhindern." Der Fehlschlag
 * bekommt deshalb auch keinen Fehlercode - es gibt dafuer keinen.
 *
 * Der `.catch` deckt den Vertragsbruch ab: #57 sagt zu, nicht zu werfen. Ohne ihn waere
 * dies ein floating Promise, dessen Abweisung als unbehandelt im Prozess landete.
 *
 * KEINE Stoerungsmeldung an die Oberflaeche (#65): Der Nutzer kann an einer verlorenen
 * Journal-Zeile nichts tun, sein Auftrag steht in der Schlange, und die
 * Warteschlangen-Leiste mit einer Meldung ueber eine Diagnosedatei zu belegen waere Laerm.
 * #59 und #62 halten es bei derselben Bewegung genauso.
 */
function schreibeBewegung(eintrag: JournalEintrag): void {
  void haengeJournalEintragAn(eintrag)
    .then((geschrieben) => {
      if (!geschrieben.ok) {
        protokolliere(
          `Q4-Bewegung "eingereiht" fuer Auftrag ${eintrag.auftragId} nicht geschrieben ` +
            `(${geschrieben.fehler.code}): ${geschrieben.fehler.meldung}`,
        )
      }
    })
    .catch((ursache: unknown) => {
      protokolliere('haengeJournalEintragAn (#57) hat entgegen seinem Vertrag geworfen', ursache)
    })
}

/**
 * Das Ereignis ausloesen - abgewartet (Schritt 5), aber gefangen.
 *
 * #65 faengt nach seinem Vertrag selbst und wirft nicht. Der Fang gilt dem Fall, dass es
 * das eines Tages nicht mehr tut: Eine gescheiterte BENACHRICHTIGUNG darf einen bereits
 * eingereihten Auftrag nicht nachtraeglich zum Fehler machen - der Aufrufer bekaeme
 * `unbekannter_fehler` und wuesste nicht, dass sein Auftrag laeuft.
 */
async function melde(): Promise<void> {
  try {
    await sendeQueueGeaendert()
  } catch (ursache) {
    protokolliere('sendeQueueGeaendert (#65) hat entgegen seinem Vertrag geworfen', ursache)
  }
}

/**
 * Den Torwaechter anstossen - und einen Wurf von dort nicht in die Antwort tragen.
 *
 * #59 sichert seine gefaehrlichen Teile selbst ab und wirft nach seinem Vertrag nicht. Der
 * Fang steht trotzdem hier, weil der Auftrag zu diesem Zeitpunkt IN Q1 STEHT: Eine
 * Ausnahme wuerde am Gateway (#23) zu `unbekannter_fehler`, der Nutzer schloesse auf einen
 * misslungenen Aufruf - und saehe seinen Auftrag zugleich im Panel stehen.
 *
 * Bewusst OHNE `meldeQueueStoerung` (#65): Die Schlange zeigt in diesem Fall weiterhin die
 * Wahrheit (der Auftrag steht als `anstehend` da, und das ist er auch); der naechste
 * Anstoss - ein weiteres `reiheEin`, `wiederhole` oder ein Abschluss (#70) - nimmt ihn
 * mit. Das ist etwas anderes als der Fall, fuer den die Stoerungsmeldung gebaut wurde:
 * dort friert die Anzeige auf einem ALTEN Stand ein, ohne dass es jemand merkt.
 */
function stosseAn(): void {
  try {
    starteNaechsten()
  } catch (ursache) {
    protokolliere('starteNaechsten (#59) hat entgegen seinem Vertrag geworfen', ursache)
  }
}

/** Dieselbe vorlaeufige Loesung wie im Torwaechter (#59) und in `entferne` (#62). */
function protokolliere(stelle: string, ursache?: unknown): void {
  if (ursache === undefined) {
    console.error(`[auftrags-manager] reiheEin: ${stelle}`)
    return
  }
  console.error(`[auftrags-manager] reiheEin: ${stelle}:`, ursache)
}

// NICHT HIER, UND GEMELDET:
//
// 1. UEBERHOLTER STOPP-PUNKT (Label bei `loeschen`). Das Issue sagt, M1 definiere keinen
//    Zugriff auf das geladene Projekt, und verbietet die eigene Wahl. Beides stammt aus der
//    Zeit vor #192: `holeAktivesProjekt()` ist seit dem 12.08.2026 gebaut und wird heute von
//    zwoelf Dateien benutzt - darunter #50, das das Issue selbst als die Stelle nennt, mit der
//    einheitlich zu antworten ist, und `render-verzahnung.ts` (#160) in DIESEM Modul. Ein
//    zweiter Weg entsteht dadurch nicht. Waere der Punkt heute noch offen, koennte diese Datei
//    das Label ueberhaupt nicht bauen: Die assetId einzusetzen verbietet das Issue
//    ausdruecklich. Der Ersatztext "Loeschen: unbekannte Datei" (kein Projekt offen, fremdes
//    Projekt, Asset nicht im Projekt) ist meine eigene Festlegung - das Issue schweigt dazu.
//
// 2. TIEFE DER NUTZLAST-PRUEFUNG - eigene Festlegung, weil ohne sie kein Fehlerpfad baubar
//    waere. Geprueft wird ausschliesslich die STRUKTUR: Art bekannt, Nutzlast ein Objekt,
//    Pflichtfelder vorhanden und vom richtigen Typ (Textfelder zusaetzlich nicht leer).
//    NICHT geprueft wird Fachliches: keine Existenzpruefung einer Datei, kein Blick auf den
//    Zielordner, keine Namensregeln fuer `ausgabeName`, keine Deutung der RenderItems, kein
//    Nachschlag, ob die assetId im Projekt liegt (der Label-Nachschlag oben liest nur, er
//    weist nichts ab). Begruendung: Der auftrags-manager "plant, ordnet und protokolliert"
//    (TK 9.3); ein Dateisystemzugriff hier braechte Fachwissen in dieses Modul und verzoegerte
//    zugleich eine Operation, die sofort antworten soll. Die Fachdienste pruefen beim
//    Ausfuehren ohnehin erneut (TK 9.1.1 Punkt 6). FOLGE, die der Auftraggeber kennen muss:
//    Ein Import einer geloeschten Datei oder ein Export auf einen vollen Stick wird
//    EINGEREIHT und scheitert erst sichtbar als fehlgeschlagener Auftrag - nicht sofort im
//    Dialog. Eine tiefere Pruefung waere nachtraeglich ohne Vertragsaenderung moeglich.
//
// 3. KEIN AUFRUFER UND KEIN KANALNAME. `reiheEin` wird heute nirgends importiert (geprueft mit
//    grep ueber `src/`: ausserhalb dieser Datei nur Erwaehnungen in Kommentaren). Die
//    Verdrahtung auf den Warteschlangen-Kanal ist #71 (`ipc-verdrahtung.ts`), dessen Rumpf noch
//    offen ist. Der Kanalname selbst kommt in dieser Datei bewusst NICHT vor - weder als Literal
//    noch im Kommentar (DoD-Grep-Probe).
//
// 4. NICHT GEPRUEFT: dass der spaetere Handler tatsaechlich nur `auftrag.payload` benutzt und
//    sich die Liste nicht frisch aus dem Projekt holt. Diese Datei kann den Snapshot nur
//    ANLEGEN (der uebergebene `payload` wandert unveraendert und ohne Kopie in den Auftrag);
//    ob #59/#60 ihn respektieren, ist dort zu pruefen.
