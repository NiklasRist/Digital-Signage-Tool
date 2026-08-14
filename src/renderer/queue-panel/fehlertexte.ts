// GENERIERT aus dem Signaturblock von Issue #211.
// [queue-panel] Fehlercodes in Klartext übersetzen
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
// GERUEST-PRUEFSUMME: a4d37a1fb265e2fe

import type { AuftragArt } from '../../shared/contracts/auftrag'

export interface Fehlertext {
  /** Kurze Ueberschrift, z. B. „Nicht genug Speicherplatz". Nie leer. */
  titel: string
  /** Was passiert ist, in einem Satz. Nie leer. */
  erklaerung: string
  /** Was der Nutzer JETZT tun kann – ursachenbezogen, nie ein leerer Platzhalter. */
  handlung: string
  /**
   * Listenelement-Kennungen aus `fehler.daten`, sofern der Code welche traegt.
   * Leeres Array, wenn der Code keine Nutzdaten hat oder sie unbrauchbar sind.
   */
  betroffeneElementIds: string[]
  /**
   * Die Element-Kennung, zu der ein Sprung in den gefuehrten Reparatur-Modus fuehren soll –
   * oder null. Gesetzt NUR bei `medium_fehlt` und `ungueltiges_element` (TK 9.2.3).
   * Diese Datei fuehrt den Sprung NICHT aus; sie benennt nur das Ziel (s. STOPP).
   */
  reparaturElementId: string | null
  /** true, wenn der Fehler durch erneutes Ausfuehren behebbar sein kann (FA-17). */
  wiederholenSinnvoll: boolean
}

// ---------------------------------------------------------------------------
// Der innere Aufbau der Tabelle
// ---------------------------------------------------------------------------

/**
 * Welche Nutzdatenform ein Code mitbringt. Die Form ist JE FEHLERCODE festgelegt
 * (TK 9.1.1), nicht je Dienst - deshalb steht sie am Tabelleneintrag und nicht in
 * einer zweiten Fallunterscheidung weiter unten.
 *
 * - `keine`      – der Code setzt `daten` gar nicht (die grosse Mehrheit)
 * - `referenzen` – `{ referenzenIds: string[] }`, nur `asset_referenziert` (TK 9.4.9)
 * - `element`    – `{ elementId: string }`, nur `medium_fehlt` und
 *                  `ungueltiges_element` (TK 9.2.3)
 */
type Nutzdatenform = 'keine' | 'referenzen' | 'element'

interface Eintrag {
  titel: string
  erklaerung: string
  handlung: string
  nutzdaten: Nutzdatenform
  wiederholenSinnvoll: boolean
}

/**
 * DIE TABELLE - ENTSCHIEDEN 2 des Issues, nach `code` geschluesselt und NICHT nach
 * `art`. Begruendung aus dem Vertrag: „Dieselbe Ursache bekommt denselben Namen."
 * (TK 9.6.4) Ein Code bedeutet in allen vier Diensten dasselbe; nur `kein_platz`
 * meint je nach Dienst einen anderen ORT, und das ist die einzige Verfeinerung
 * ueber `art` (s. `KEIN_PLATZ_EXPORT`).
 *
 * WARUM EINE `Map` UND KEIN OBJEKT-LITERAL. Bei `TABELLE[code]` auf einem Objekt
 * liefert die Prototypkette Treffer, die niemand eingetragen hat: `'constructor'`,
 * `'toString'` und `'__proto__'` sind dort belegt. Der Fehlerpfad „unbekannter Code"
 * bekaeme dann eine FUNKTION als Eintrag, `eintrag.titel` waere `undefined`, und die
 * Zusage „`titel` ist nie leer" braeche ausgerechnet an dem Eingang, gegen den der
 * Zweig „jeder andere Code" gebaut ist. `Map.get` kennt keine Prototypkette. Der
 * Fall ist geprueft (Gegenprobe in der Testdatei) und nicht theoretisch: `code` ist
 * `string`, also alles, was die Gegenseite hineinschreibt.
 *
 * ES GIBT KEINEN TEXTVERGLEICH IN DIESER DATEI. Der technische Text aus dem Main
 * wird nicht gelesen, nicht verglichen und nicht eingesetzt (ENTSCHIEDEN 3):
 * „Der Aufrufer müsste dann Meldungstexte vergleichen […], was bei jeder
 * Umformulierung, Tippfehler-Korrektur oder Übersetzung bricht." (TK 9.1.1)
 * Die im Original an der Auslassung stehende Beispiel-Schreibweise ist absichtlich
 * nicht mitzitiert - sie waere ausgerechnet in DIESER Datei der Fund, den die
 * Grep-Probe der DoD sucht.
 */
const TABELLE: ReadonlyMap<string, Eintrag> = new Map<string, Eintrag>([
  // --- media-service, Import (TK 9.4.9) ---------------------------------------
  [
    'datei_nicht_gefunden',
    {
      titel: 'Datei nicht gefunden',
      erklaerung: 'Die ausgewählte Datei liegt nicht mehr an ihrem Ort.',
      handlung: 'Die Datei suchen und den Import erneut starten.',
      nutzdaten: 'keine',
      // Die Datei ist weg - derselbe Auftrag mit demselben Pfad scheitert wieder.
      wiederholenSinnvoll: false,
    },
  ],
  [
    'format_nicht_unterstuetzt',
    {
      titel: 'Dateiformat wird nicht unterstützt',
      erklaerung: 'Dieses Format kann nicht verarbeitet werden.',
      handlung: 'Die Datei in ein unterstütztes Format umwandeln und erneut importieren.',
      nutzdaten: 'keine',
      wiederholenSinnvoll: false,
    },
  ],
  [
    'probe_fehler',
    {
      titel: 'Datei nicht lesbar',
      erklaerung: 'Die Datei ließ sich nicht auswerten – sie ist vermutlich beschädigt.',
      handlung:
        'Die Datei in einem Player prüfen; wenn sie dort nicht läuft, eine andere Fassung verwenden.',
      nutzdaten: 'keine',
      // TK 9.4.9 nennt neben der beschaedigten Datei ausdruecklich den Timeout
      // (gekilltes ffprobe) - der geht beim naechsten Versuch durch.
      wiederholenSinnvoll: true,
    },
  ],
  [
    'kopier_fehler',
    {
      titel: 'Kopieren fehlgeschlagen',
      erklaerung: 'Die Datei konnte nicht in das Projekt kopiert werden.',
      handlung: 'Freien Speicherplatz prüfen und den Import wiederholen.',
      nutzdaten: 'keine',
      wiederholenSinnvoll: true,
    },
  ],

  // --- media-service, alle drei Auftragsarten ---------------------------------
  [
    'kein_projekt',
    {
      titel: 'Kein Projekt geöffnet',
      erklaerung: 'Der Vorgang braucht ein geöffnetes Projekt – es ist aber keins offen.',
      handlung: 'Ein Projekt öffnen und den Vorgang erneut starten.',
      nutzdaten: 'keine',
      // Ohne ein geoeffnetes Projekt aendert eine Wiederholung nichts - der Nutzer
      // muss zuerst handeln.
      wiederholenSinnvoll: false,
    },
  ],

  // --- media-service, Loeschen (TK 9.4.9) -------------------------------------
  [
    'asset_nicht_gefunden',
    {
      titel: 'Medium nicht gefunden',
      erklaerung: 'Dieses Medium gehört nicht (mehr) zum Projekt.',
      handlung: 'Die Medien-Liste aktualisieren.',
      nutzdaten: 'keine',
      wiederholenSinnvoll: false,
    },
  ],
  [
    'asset_referenziert',
    {
      titel: 'Medium wird noch verwendet',
      erklaerung:
        'Das Medium ist in der Wiedergabeliste in Gebrauch und wurde deshalb nicht gelöscht.',
      handlung:
        'Die genannten Elemente aus der Wiedergabeliste entfernen und dann erneut löschen.',
      // „ein ListItem zeigt noch darauf; trägt `daten: { referenzenIds: string[] }`
      // (strukturierte Fehlerdaten, 9.1.1)" (TK 9.4.9)
      nutzdaten: 'referenzen',
      // Ohne Zutun des Nutzers aendert sich nichts: derselbe Verweis besteht weiter.
      wiederholenSinnvoll: false,
    },
  ],
  [
    'datei_fehler',
    {
      titel: 'Datei konnte nicht entfernt werden',
      erklaerung:
        'Der Eintrag ist weg, die Datei ließ sich aber nicht löschen; sie wird beim nächsten Öffnen des Projekts nachgeholt.',
      handlung: 'Nichts weiter nötig – die Datei wird automatisch nachgeräumt.',
      nutzdaten: 'keine',
      // Der Eintrag ist bereits weg (`pendingDeletion`, TK 9.4.9); ein zweiter Lauf
      // fuende das Asset gar nicht mehr. Zur offenen Bedienfrage, ob dieser Ausgang
      // ueberhaupt als FEHLSCHLAG erscheinen soll, s. den Vermerk am Dateiende.
      wiederholenSinnvoll: false,
    },
  ],

  // --- render-service (TK 9.2.3) ----------------------------------------------
  [
    'medium_fehlt',
    {
      titel: 'Medium fehlt',
      erklaerung: 'Ein Element der Liste zeigt auf ein Medium, das nicht mehr vorhanden ist.',
      handlung:
        'Über den geführten Reparatur-Modus neu verknüpfen, ersetzen oder das Element entfernen.',
      nutzdaten: 'element',
      wiederholenSinnvoll: false,
    },
  ],
  [
    'ungueltiges_element',
    {
      titel: 'Element nicht verwendbar',
      erklaerung: 'Ein Element der Liste ist in sich unstimmig (Dauer, Trim oder Werbeband).',
      handlung: 'Das benannte Element korrigieren und erneut rendern.',
      nutzdaten: 'element',
      wiederholenSinnvoll: false,
    },
  ],
  [
    'ffmpeg_fehler',
    {
      titel: 'Verarbeitung fehlgeschlagen',
      erklaerung: 'Die Videoverarbeitung ist abgebrochen; eine Quelle ließ sich nicht lesen.',
      handlung:
        'Erneut versuchen; bleibt es dabei, das benannte Element austauschen. Eine vorhandene Ausgabedatei ist unverändert.',
      // TK 9.2.3 setzt `daten` bei diesem Code NICHT - `{ elementId }` gibt es nur bei
      // `medium_fehlt` und `ungueltiges_element`. Der Satz „das benannte Element"
      // meint den technischen Text daneben, nicht ein Sprungziel von hier.
      nutzdaten: 'keine',
      wiederholenSinnvoll: true,
    },
  ],
  [
    // Der Render-Fall; der Export-Fall steht in `KEIN_PLATZ_EXPORT`. Das ist die
    // EINZIGE Stelle, an der `art` etwas veraendert - und auch dort nur den ORT,
    // nie die Erkennung des Codes.
    'kein_platz',
    {
      titel: 'Nicht genug Speicherplatz',
      erklaerung: 'Es ist zu wenig freier Speicher vorhanden.',
      handlung: 'Platz schaffen, dann den Auftrag wiederholen.',
      nutzdaten: 'keine',
      wiederholenSinnvoll: true,
    },
  ],

  // --- in allen vier Diensten (TK 9.2.3, 9.4.9, 9.6.4) -------------------------
  [
    'speicher_fehler',
    {
      titel: 'Speichern fehlgeschlagen',
      erklaerung:
        'Die Projektdaten konnten nicht gespeichert werden – der Vorgang wurde deshalb nicht ausgeführt.',
      handlung: 'Freien Platz und Schreibrechte am Speicherort prüfen, dann erneut versuchen.',
      nutzdaten: 'keine',
      wiederholenSinnvoll: true,
    },
  ],

  // --- export-service (TK 9.6.4) ----------------------------------------------
  [
    'keine_ausgabe',
    {
      titel: 'Ausgabedatei nicht gefunden',
      erklaerung:
        'Die gewählte Datei liegt nicht im Ausgabeordner – sie wurde noch nicht gerendert oder inzwischen gelöscht.',
      handlung: 'Zuerst rendern oder eine andere Ausgabedatei wählen.',
      nutzdaten: 'keine',
      wiederholenSinnvoll: false,
    },
  ],
  [
    // Das „ü" gehoert zum Code, nicht zur Anzeige: `ExportFehlercode` schreibt ihn
    // in src/main/export-service/fehlercodes.ts genau so (TK 9.6.4). Wer ihn hier
    // „ziel_nicht_verfuegbar" schreibt, baut einen Eintrag, den nie jemand trifft -
    // und der Nutzer bekaeme den allgemeinen Text. Die Gegenprobe in der Testdatei
    // liest die Union aus der Main-Datei und faende die Abweichung.
    'ziel_nicht_verfügbar',
    {
      titel: 'Ziel nicht erreichbar',
      erklaerung:
        'Das Ziellaufwerk ist nicht erreichbar – vermutlich wurde der Datenträger abgezogen.',
      handlung: 'Den USB-Stick wieder anstecken und erneut versuchen.',
      nutzdaten: 'keine',
      wiederholenSinnvoll: true,
    },
  ],
  [
    'datei_zu_gross_fat32',
    {
      titel: 'Datei zu groß für dieses Laufwerk',
      erklaerung:
        'Der Datenträger ist mit FAT32 formatiert; dort sind einzelne Dateien über 4 GB nicht möglich.',
      // „Ziel ist FAT32 und die Datei überschreitet 4 GB → exFAT nötig" (TK 9.6.4).
      // Das Wort exFAT ist der ganze Zweck dieses Eintrags - es ist der einzige
      // Hinweis, mit dem der Nutzer den Fall ueberhaupt aufloesen kann.
      handlung:
        'Den Stick mit exFAT formatieren (Daten vorher sichern) oder ein anderes Ziel wählen.',
      nutzdaten: 'keine',
      // Dieselbe Datei auf dasselbe FAT32-Laufwerk scheitert beliebig oft erneut.
      wiederholenSinnvoll: false,
    },
  ],
  [
    'ziel_gesperrt',
    {
      titel: 'Zieldatei ist gesperrt',
      erklaerung: 'Eine Datei am Ziel wird von einem anderen Programm benutzt.',
      handlung: 'Die Datei in Player oder Explorer schließen und erneut versuchen.',
      nutzdaten: 'keine',
      wiederholenSinnvoll: true,
    },
  ],
  [
    'schreib_fehler',
    {
      titel: 'Kopieren fehlgeschlagen',
      erklaerung: 'Beim Kopieren auf das Ziel ist ein Fehler aufgetreten.',
      handlung: 'Den Datenträger prüfen und erneut versuchen.',
      nutzdaten: 'keine',
      wiederholenSinnvoll: true,
    },
  ],

  // --- die drei generischen (TK 9.1.1 Punkt 3) --------------------------------
  [
    'ungueltige_eingabe',
    {
      titel: 'Eingabe nicht zulässig',
      erklaerung: 'Die Anfrage war nicht zulässig und wurde ohne Wirkung abgewiesen.',
      handlung: 'Die Eingabe prüfen und den Vorgang erneut auslösen.',
      nutzdaten: 'keine',
      // „ohne jede Wirkung auf Daten oder Dateien" (TK 9.2.3) - unveraendert erneut
      // eingereicht faellt derselbe Code wieder an.
      wiederholenSinnvoll: false,
    },
  ],
  [
    'nicht_gefunden',
    {
      titel: 'Nicht gefunden',
      erklaerung: 'Der Vorgang bezog sich auf etwas, das es nicht (mehr) gibt.',
      handlung: 'Die Ansicht aktualisieren.',
      nutzdaten: 'keine',
      wiederholenSinnvoll: false,
    },
  ],
  [
    'unbekannter_fehler',
    {
      titel: 'Unerwarteter Fehler',
      erklaerung: 'Es ist ein unerwarteter Fehler aufgetreten.',
      handlung: 'Erneut versuchen; der Versuch steht mit Zeitstempel im Protokoll.',
      nutzdaten: 'keine',
      wiederholenSinnvoll: true,
    },
  ],
])

/**
 * Der Export-Fall von `kein_platz` - die einzige Verfeinerung ueber `art`.
 *
 * `titel` ist mit dem Render-Fall identisch (dieselbe Ursache, derselbe Name);
 * verschieden sind ausschliesslich der genannte ORT: beim Export das Ziel (der Stick),
 * beim Render der Datenort bzw. T1. Ohne die Unterscheidung schickte die Oberflaeche
 * den Nutzer beim Export an die falsche Platte - er raeumte C: auf, waehrend der
 * Stick voll ist.
 */
const KEIN_PLATZ_EXPORT: Eintrag = {
  titel: 'Nicht genug Speicherplatz',
  erklaerung: 'Auf dem Ziel ist zu wenig Platz.',
  handlung: 'Auf dem Ziel Platz schaffen und erneut versuchen.',
  nutzdaten: 'keine',
  wiederholenSinnvoll: true,
}

/**
 * Der Zweig „jeder andere Code" aus der Tabelle des Issues.
 *
 * Er ist kein Notnagel, sondern Vertrag: `Auftrag.fehler.code` ist `string`, weil der
 * GETEILTE Vertrag die fachlichen Unionen der Main-Module nicht kennen darf (#16).
 * Also KANN hier ein Code ankommen, den diese Tabelle nicht fuehrt - und dann muss
 * trotzdem ein vollstaendiger, handlungsfaehiger Text herauskommen.
 *
 * DER ROHCODE STEHT BEWUSST NICHT IM TEXT. Ein technischer Bezeichner in der Anzeige
 * ist fuer den Nutzer wertlos und sieht wie ein Absturz aus; die technische Auskunft
 * liegt ohnehin im Text daneben, den der Aufrufer zusaetzlich zeigen kann
 * (ENTSCHIEDEN 3).
 */
const UNBEKANNT: Eintrag = {
  titel: 'Unerwarteter Fehler',
  erklaerung: 'Der Vorgang ist mit einem unbekannten Fehler beendet worden.',
  handlung: 'Erneut versuchen.',
  nutzdaten: 'keine',
  wiederholenSinnvoll: true,
}

// ---------------------------------------------------------------------------
// Nutzdaten - defensiv (ENTSCHIEDEN 4)
// ---------------------------------------------------------------------------

/**
 * `daten` ist `unknown`. Gelesen wird erst nach drei Pruefungen: Objekt, Feld da,
 * Feldtyp richtig. Faellt eine davon durch, bleibt das Ergebnis leer - der Text
 * erscheint trotzdem, ohne Ausnahme und ohne ein `undefined` im Satz.
 *
 * `typeof null === 'object'` ist der klassische Fallstrick und deshalb ausdruecklich
 * mitgeprueft.
 */
function istObjekt(wert: unknown): wert is Record<string, unknown> {
  return typeof wert === 'object' && wert !== null
}

/**
 * `{ referenzenIds: string[] }` bei `asset_referenziert` (TK 9.4.9).
 *
 * Nicht brauchbare Eintraege werden STILLSCHWEIGEND ausgelassen (Fehlerpfad-Tabelle
 * des Issues): Die Anzeige ist nicht der Ort, an dem ein Vertragsbruch des Senders
 * auffaellt. Leere Zeichenketten fliegen mit heraus - sie fuehrten zu einer Zeile
 * ohne Inhalt in der Liste der betroffenen Elemente.
 */
function leseReferenzenIds(daten: unknown): string[] {
  if (!istObjekt(daten)) {
    return []
  }
  const roh = daten['referenzenIds']
  if (!Array.isArray(roh)) {
    return []
  }
  return roh.filter((eintrag): eintrag is string => typeof eintrag === 'string' && eintrag !== '')
}

/**
 * `{ elementId: string }` bei `medium_fehlt` und `ungueltiges_element` (TK 9.2.3).
 *
 * Ist der Wert kein String oder leer, bleibt das Ergebnis `null` - die Anzeige bietet
 * dann KEINEN Sprung in den Reparatur-Modus an, statt ins Leere zu springen.
 */
function leseElementId(daten: unknown): string | null {
  if (!istObjekt(daten)) {
    return null
  }
  const roh = daten['elementId']
  return typeof roh === 'string' && roh !== '' ? roh : null
}

// ---------------------------------------------------------------------------
// Die eine Uebersetzung
// ---------------------------------------------------------------------------

/**
 * Die EINZIGE Uebersetzung von Fehlercode nach Klartext im Renderer.
 * `art` verfeinert nur die Handlungsempfehlung dort, wo derselbe Code je nach Dienst
 * einen anderen ORT meint (`kein_platz`); sie ist nie noetig, um den Code zu ERKENNEN.
 */
export function uebersetzeFehler(
  fehler: { code: string; meldung: string; daten?: unknown },
  art: AuftragArt | null,
): Fehlertext {
  // Die Erkennung haengt AUSSCHLIESSLICH am Code. `art` wird erst danach gefragt und
  // aendert nie, WELCHER Eintrag getroffen wird - nur, welche Fassung eines bereits
  // getroffenen Eintrags gilt. Ist `art` null, bleibt es bei der allgemeineren
  // Render-Formulierung (Fehlerpfad-Tabelle des Issues).
  const gefunden = TABELLE.get(fehler.code)
  const eintrag =
    fehler.code === 'kein_platz' && art === 'export' ? KEIN_PLATZ_EXPORT : (gefunden ?? UNBEKANNT)

  // Nutzdaten je nach der am Eintrag hinterlegten Form. Ein Code ohne Nutzdaten liest
  // `daten` gar nicht erst an - so kann ein faelschlich mitgeschicktes `{ elementId }`
  // bei `speicher_fehler` auch keinen Sprung anbieten, den es dort nicht gibt.
  let betroffeneElementIds: string[] = []
  let reparaturElementId: string | null = null

  if (eintrag.nutzdaten === 'referenzen') {
    betroffeneElementIds = leseReferenzenIds(fehler.daten)
  } else if (eintrag.nutzdaten === 'element') {
    reparaturElementId = leseElementId(fehler.daten)
    // Dieselbe Kennung steht in BEIDEN Feldern (so die Tabelle des Issues):
    // `reparaturElementId` ist das Sprungziel, `betroffeneElementIds` die Anzeige.
    // Ein Aufrufer, der nur betroffene Elemente auflistet, sieht das Element damit
    // auch dann, wenn er den Sprung gar nicht anbietet.
    betroffeneElementIds = reparaturElementId === null ? [] : [reparaturElementId]
  }

  return {
    titel: eintrag.titel,
    erklaerung: eintrag.erklaerung,
    handlung: eintrag.handlung,
    betroffeneElementIds,
    reparaturElementId,
    wiederholenSinnvoll: eintrag.wiederholenSinnvoll,
  }
}

/** Die Codes, die diese Tabelle kennt – fuer die Vollstaendigkeitspruefung im Test. */
export const BEKANNTE_FEHLERCODES: readonly string[] = [...TABELLE.keys()]

// ---------------------------------------------------------------------------
// ENTSCHEIDUNG 14.08.2026: KEIN eigener Code fuer Warteschlangen-Stoerungen
// ---------------------------------------------------------------------------
//
// #205 hat am 14.08.2026 offen gelassen, ob diese Datei einen EIGENEN Code fuer
// Stoerungen der Warteschlange bekommt. Die Stoerungen kommen ueber einen eigenen
// Kanal aus dem Main (#65 sammelt sie, #71 gibt sie weiter) und landen in
// `auftrags-sicht.ts` heute als `unbekannter_fehler`.
//
// ENTSCHIEDEN BEIM BAU DIESER ANZEIGE: NEIN, kein eigener Code. Drei Gruende, in
// dieser Reihenfolge:
//
// (1) DER KANAL TRAEGT KEINEN CODE, SONDERN NUR TEXT. Er ist seit der
//     Verallgemeinerung in #65 die Sammelstelle fuer Stoerungen ganz verschiedener
//     Herkunft (nicht ermittelbarer Stand, misslungenes Schreiben von Q3/Q2,
//     haengende Loeschungen beim Projektoeffnen). Ein gemeinsamer Code ueber diese
//     Herkuenfte hinweg waere eine Scheingenauigkeit - er saehe nach Information aus
//     und traegt keine.
//
// (2) EIN CODE OHNE VERZWEIGUNG IST TOTES GEWICHT. Was diese Datei liefert, ist
//     genau dreierlei: Text (Titel/Erklaerung/Handlung), Nutzdaten und die
//     Wiederhol-Empfehlung. Eine Stoerung hat KEINE Nutzdaten, und wiederholen kann
//     man sie nicht - es gibt keinen Auftrag, auf den sich ein Wiederholen bezoege.
//     Bleibt der Text. Der aber ist bei der Stoerung schon da: Der Klartext aus dem
//     Main reist im Fehlerobjekt mit und wird vom Aufrufer angezeigt. Ein eigener
//     Eintrag lieferte also einen ZWEITEN, allgemeineren Satz neben dem konkreten -
//     und verdraengte damit die einzige Information, die der Fall wirklich hat.
//
// (3) ER WAERE HIER AUCH NICHT ERLAUBT. Der STOPP-Block von #211 verbietet
//     ausdruecklich, Codes zu erfinden: „Die Tabelle enthält genau die Codes aus
//     TK 9.2.3, 9.4.9, 9.6.4 und die drei generischen aus 9.1.1." Ein hier erfundener
//     Code stuende in KEINEM Vertrag, und `auftrags-sicht.ts` (#205) haelt sich schon
//     heute mit derselben Begruendung an den generischen: „Fehlercodes entstehen dort,
//     wo der Fehler entsteht."
//
// Damit bleibt `unbekannter_fehler` die getroffene Wahl - und der Eintrag dafuer ist
// fuer den Stoerungsfall tragfaehig: Titel „Unerwarteter Fehler", eine Handlung, die
// ausfuehrbar ist, und `wiederholenSinnvoll: true` schadet nicht, weil eine Stoerung
// gar keinen Auftrag hat, an dem ein Wiederhol-Knopf haengen koennte.
//
// WAS DIESE ENTSCHEIDUNG UMWERFEN WUERDE: Sobald der Stoerungskanal einen fachlichen
// Code MITTRAEGT (dann entstuende er im Main, wo der Fehler entsteht - kein Erfinden
// mehr), oder sobald die Oberflaeche eine Stoerung sichtbar anders darstellen soll als
// einen Programmfehler (dann gaebe es die Verzweigung, die heute fehlt). Beides ist
// eine Vertragsaenderung und gehoert ins Issue, nicht in diese Datei.
//
// An `auftrags-sicht.ts` ist deshalb NICHTS zu aendern; die dortige Wahl bleibt gueltig.

// ---------------------------------------------------------------------------
// BEFUND (gemeldet, NICHT eigenmaechtig behoben): Codes, die es gibt und die diese
// Tabelle nicht fuehrt
// ---------------------------------------------------------------------------
//
// Die Tabelle oben ist die verbindliche Tabelle aus #211 (ENTSCHIEDEN 2) und deckt
// genau TK 9.2.3, 9.4.9, 9.6.4 und die drei generischen ab. Der GEBAUTE Code kennt
// aber Fehlercodes, die es zum Zeitpunkt des Issue-Schreibens noch nicht gab:
//
//   `kein_projekt` - am 13.08.2026 in src/main/media-service/fehlercodes.ts
//   nachgetragen, und zwar in ALLE DREI Unionen (Import, Loeschen, Reconcile). Import-
//   und Loeschauftrag reichen ihn laut src/main/media-service/import-medium.ts bzw.
//   loesche-medium.ts UNVERAENDERT durch - er erreicht also `Auftrag.fehler.code` und
//   damit diese Datei. Heute faellt er in den Zweig „jeder andere Code" und der Nutzer
//   liest „Unerwarteter Fehler", obwohl die Ursache („es ist ueberhaupt kein Projekt
//   geoeffnet") praezise erklaerbar waere.
//
//   `projekt_beschaeftigt` und `schema_zu_neu` (src/main/project-store/assets.ts,
//   oeffne-projekt.ts) sowie `ffmpeg_abgebrochen` (src/main/ffmpeg-adapter/prozess.ts)
//   stehen ebenfalls in keinem Vertrag dieser Tabelle. Ob sie einen Auftragsfehlschlag
//   erreichen koennen, ist NICHT geprueft.
//
// WARUM SIE TROTZDEM NICHT AUFGENOMMEN SIND: Die DoD von #211 verlangt woertlich, dass
// `BEKANNTE_FEHLERCODES` „genau die Codes der Tabelle" enthaelt, und der STOPP-Block
// verbietet das Ergaenzen weiterer Codes. Eine Ergaenzung ist eine Aenderung der
// verbindlichen Tabelle und gehoert ins Issue.
//
// GEGEN DAS AUSEINANDERLAUFEN gibt es eine Gegenprobe in der Testdatei: Sie liest die
// Fehlercode-Unionen aus src/main/**/fehlercodes.ts als TEXT (importieren darf der
// Renderer sie nicht - Entscheidung E3 des M5-Prueflaufs; und Union-Typen haben zur
// Laufzeit ohnehin keinen Wert) und verlangt, dass jeder dort gefuehrte Code entweder
// in dieser Tabelle steht oder in einer AUSDRUECKLICH begruendeten Ausnahmeliste.
// Kommt im Main ein neuer Code hinzu, schlaegt die Probe fehl, statt dass der Nutzer
// still „Unerwarteter Fehler" liest.
//
// OFFENE FRAGEN AUS DEM STOPP-BLOCK, hier NICHT beantwortet und NICHT vorweggenommen:
// wo `betroffeneElementIds` als NAMEN angezeigt werden (die Aufloesung liegt im
// `composer`, nicht hier); ob der `vorlagen-editor` eine eigene Tabelle bekommt
// (`vorlage_referenziert` erscheint nie in der Warteschlange, ENTSCHIEDEN 5); und ob
// `datei_fehler` ueberhaupt als Fehlschlag statt als Hinweis erscheinen soll.
