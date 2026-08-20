// GENERIERT aus dem Signaturblock von Issue #70.
// [auftrags-manager] Auftrag abschließen und die Schlange weiterdrehen
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
// GERUEST-PRUEFSUMME: ed88001245269c22
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
// beide Parameter und alle Importe werden jetzt benutzt. Der Absatz darueber bleibt
// als Beleg stehen.

import { erzeugeId } from '../../shared/contracts/id'

import { entferneAusQ1, findeQ1 } from './q1-warteschlange'
import { merkeFehlschlag, streicheAusQ2 } from './q2-wiederholung'
import { haengeProtokollEintragAn } from './q3-protokoll'
import { meldeQueueStoerung, sendeQueueGeaendert } from './queue-ereignis'
import { starteNaechsten } from './torwaechter'
import { pruefeUebergang } from './zustandsuebergang'

import type { HandlerErgebnis } from './dispatcher'
import type { Auftrag } from '../../shared/contracts/auftrag'
import type { ProtokollEintrag, ProtokollErgebnis } from '../../shared/contracts/protokoll'

// Fremde Aufrufe - vollstaendige Signaturen, damit hier nichts geraten wird:
//   #54: findeQ1(auftragId: string): Q1Eintrag | undefined
//        liefert den INTERNEN, LEBENDEN Eintrag { auftrag, begonnenAm } - keine Kopie.
//        Genau darauf beruht Schritt 2: Was hier an `auftrag` gesetzt wird, steht danach
//        in Q1.
//   #54: entferneAusQ1(auftragId: string): boolean   - entfernt unabhaengig vom Status
//   #58: pruefeUebergang(von: AuftragStatus, nach: AuftragStatus): Ergebnis<void>
//   #56: haengeProtokollEintragAn(eintrag: ProtokollEintrag): Promise<Ergebnis<void, QueueFehlercode>>
//   #55: merkeFehlschlag(projektId: string, auftrag: Auftrag): Promise<Ergebnis<void, QueueFehlercode>>
//   #55: streicheAusQ2(projektId: string, auftragId: string): Promise<Ergebnis<void, QueueFehlercode>>
//        IDEMPOTENT: ohne Treffer { ok: true, wert: undefined } - kein Fehlerpfad.
//   #65: sendeQueueGeaendert(): Promise<void>   - ohne Huelle, wird ABGEWARTET
//   #59: starteNaechsten(): void                - heute noch ein werfender Rumpf
//   #20: erzeugeId(): string                    - UUID v4
//
// ZUM IMPORT VON #59: Die Abhaengigkeit ist gegenseitig (der Torwaechter ruft diese
// Funktion, wenn ein Handler aufloest). Das ist kein Versehen, sondern die im Issue
// ausdruecklich gewollte Richtung - #70 wird VOR #59 gebaut. Beide Module benutzen
// einander erst zur LAUFZEIT, nicht beim Laden; ein Modulzyklus entsteht dadurch nicht.

/**
 * Der terminale Zielstatus zum Ausgang des Fachdienstes - die eindeutige Abbildung aus
 * dem Issue, ohne jede Deutung.
 *
 * `null` fuer alles andere: Der Diskriminator ist eine geschlossene Union, und #60 prueft
 * die Form der Handler-Antwort bereits (`istHandlerErgebnis`), bevor sie hierher gelangt -
 * dieser Zweig ist also unerreichbar, solange der Weg ueber den Dispatcher fuehrt. Er
 * bleibt trotzdem stehen, weil die Alternative schlimmer waere: Ein `default`, das auf
 * `erfolg` oder `fehlgeschlagen` faellt, schriebe einen Ausgang ins DAUERHAFTE Protokoll,
 * den kein Dienst gemeldet hat.
 */
function zielStatusVon(ergebnis: HandlerErgebnis): ProtokollErgebnis | null {
  switch (ergebnis.status) {
    case 'erfolg':
      return 'erfolg'
    case 'fehlgeschlagen':
      return 'fehlgeschlagen'
    case 'abgebrochen':
      return 'abgebrochen'
    default:
      return null
  }
}

export async function beendeAuftrag(auftragId: string, ergebnis: HandlerErgebnis): Promise<void> {
  // FEHLERPFAD "liegt nicht (mehr) in Q1": nichts veraendern, nichts protokollieren, kein
  // `throw`. Das ist zugleich die Schranke gegen das ZWEITE Abschliessen desselben
  // Auftrags - nach Schritt 5 ist er aus Q1 heraus, ein zweiter Aufruf endet hier.
  const q1Eintrag = findeQ1(auftragId)
  if (q1Eintrag === undefined) {
    protokolliere(`Ergebnis fuer Auftrag ${auftragId}, der nicht (mehr) in Q1 liegt - ignoriert.`)
    return
  }
  const auftrag = q1Eintrag.auftrag

  const zielStatus = zielStatusVon(ergebnis)
  if (zielStatus === null) {
    protokolliere(`Auftrag ${auftragId}: Ausgang ohne bekannten Status - nichts veraendert.`)
    return
  }

  // SCHRITT 1: Uebergang pruefen. Ein verspaetetes oder doppeltes Ergebnis darf einen
  // bereits terminalen Auftrag nicht erneut kippen - und vor allem keinen zweiten
  // Q3-Eintrag erzeugen. Erlaubt sind nach #58 allein `laeuft` -> erfolg /
  // fehlgeschlagen / abgebrochen; jeder Selbstuebergang faellt durch.
  const uebergang = pruefeUebergang(auftrag.status, zielStatus)
  if (!uebergang.ok) {
    protokolliere(
      `Auftrag ${auftragId}: Uebergang ${auftrag.status} -> ${zielStatus} abgelehnt ` +
        `(${uebergang.fehler.code}) - nichts veraendert.`,
    )
    return
  }

  // SCHRITT 2: Der Zustand ist die Wahrheit, aus der alle folgenden Schritte lesen.
  //
  // Der Statuswechsel steht VOR dem ersten `await`. Das ist tragend und keine
  // Geschmacksfrage: Traefe ein zweites Ergebnis waehrend des Q3-Schreibens ein, faende es
  // den Auftrag noch auf `laeuft` und liefe ein zweites Mal komplett durch. So findet es
  // einen terminalen Status vor und wird von Schritt 1 abgewiesen.
  auftrag.status = zielStatus

  if (ergebnis.status === 'fehlgeschlagen') {
    // UNVERAENDERT, samt `daten`: Der Code entsteht im Fachdienst und wird hier abgelegt,
    // nicht gedeutet - keine Uebersetzungstabelle, kein `unbekannter_fehler`, kein Cast.
    // An `daten` haengt der gefuehrte Reparatur-Modus (FA-19); abgeschnitten wird es erst
    // auf dem Weg nach Q3.
    auftrag.fehler = ergebnis.fehler
    auftrag.ergebnis = null
  } else if (ergebnis.status === 'erfolg') {
    // `fehler` wird bei `erfolg` AUSDRUECKLICH geleert und nicht bloss "gelassen": Nach
    // einer Wiederholung (#63) steht dort noch der Fehler des vorigen Versuchs, und
    // "die beiden Felder sind die zwei Ausgaenge desselben Datensatzes und duerfen nie
    // gleichzeitig gefuellt sein" (Invariante des Issues). Sichtbar bleibt der alte
    // Fehlschlag in Q3 - der Q3-Eintrag des ersten Versuchs bleibt unangetastet.
    auftrag.fehler = null
    // GENAU DER WERT AUS DEM HANDLER-AUSGANG - dieselbe Referenz, nichts umgeformt,
    // nichts ergaenzt, kein Ersatzwert. Auch ein `undefined` bliebe `undefined`: Es zu
    // "verbessern" hiesse, die Nutzdaten zu deuten, und `Auftrag.ergebnis` ist der
    // EINZIGE Weg, auf dem die Oberflaeche erfaehrt, was der Auftrag hervorgebracht hat.
    auftrag.ergebnis = ergebnis.ergebnis
  } else {
    // ABGEBROCHEN: kein Ergebnis - und `fehler` wird NICHT angefasst. Ein Abbruch hat
    // keinen Fehler zu melden, aber er darf auch keinen loeschen: Wird die Wiederholung
    // eines Fehlschlags abgebrochen, ist der Q2-Eintrag derselbe Auftrag, und mit dem
    // Fehler verschwaende der Grund, den FA-17 sichtbar halten will.
    auftrag.ergebnis = null
  }

  const beendetAm = jetzt()

  // SCHRITT 3: ZUERST der dauerhafte Nachweis. Q3 ist unbegrenzt und der einzige Beleg,
  // dass der Vorgang lief - er entsteht, bevor der fluechtige Q1-Eintrag (und mit ihm
  // `begonnenAm`) verschwindet.
  await schreibeProtokoll({
    id: erzeugeId(),
    auftragId: auftrag.auftragId,
    art: auftrag.art,
    // Der auftrags-manager fuehrt KEIN eigenes "aktives Projekt"; alle vier Nutzlasten
    // tragen die projektId. Kein Ersatzwert, kein Nachschlagen an anderer Stelle.
    projektId: auftrag.payload.projektId,
    versuch: auftrag.versuche,
    begonnenAm: begonnenAmVon(q1Eintrag.begonnenAm, beendetAm, auftrag.auftragId),
    beendetAm,
    ergebnis: zielStatus,
    // NUR `code` und `meldung`. `daten` ist eine Anzeigehilfe des Moments und einen Tag
    // spaeter wertlos, waehrend Q3 nie rotiert - das Feld wird hier ABGESCHNITTEN.
    // Gelesen wird der Ausgang DIESES Versuchs, nicht `auftrag.fehler`: Bei einem
    // abgebrochenen Wiederholungsversuch stuende dort noch der Fehler des vorigen.
    fehler:
      ergebnis.status === 'fehlgeschlagen'
        ? { code: ergebnis.fehler.code, meldung: ergebnis.fehler.meldung }
        : null,
    ausgabe: baueAusgabe(auftrag),
    // Das Label reist NEBEN dem Eintrag mit, nicht darin: ProtokollEintrag (#53) fuehrt
    // bewusst kein `label` - es ist eine Anzeigehilfe, Q3 ist ein dauerhafter Nachweis.
    // Gebraucht wird es allein fuer den Klartext einer etwaigen Stoerungsmeldung.
  }, auftrag.label)

  // SCHRITT 4: DANN die Wiederhol-Faehigkeit. Beides sind persistente Speicher und
  // muessen geschrieben sein, bevor der fluechtige Zustand verschwindet.
  await pflegeQ2(auftrag, ergebnis.status)

  // SCHRITT 5: Erst jetzt darf der fluechtige Eintrag weg. Bleibt er liegen, sieht der
  // Torwaechter dauerhaft einen laufenden Auftrag und die Schlange steht fuer den Rest
  // der Sitzung.
  entferneAusQ1(auftragId)

  // SCHRITT 6: Melden - und zwar ABGEWARTET, damit die Oberflaeche den vollstaendigen
  // neuen Stand sieht und nicht zwei Meldungen in vertauschter Reihenfolge ankommen.
  // Ein Fehlschlag der Meldung darf Schritt 7 NICHT verhindern.
  await meldeAenderung()

  // SCHRITT 7: weiterdrehen. Ohne diesen Aufruf bleibt die Schlange stehen, obwohl alles
  // korrekt protokolliert wurde - ein Fehler, der aussieht wie ein Haenger und keiner ist.
  dreheWeiter()
}

/**
 * Q3 anhaengen und den Ausgang nur vermerken.
 *
 * WAS BEI EINEM FEHLSCHLAG GESCHIEHT, IST AM 13.08.2026 ENTSCHIEDEN WORDEN (STOPP-Block
 * des Issues), und zwar zweiteilig:
 *
 * (1) DER ABSCHLUSS LAEUFT WEITER. Ein Abbruch mitten im Ablauf liesse den Auftrag mit
 *     terminalem Status in Q1 zurueck, und weil `starteNaechsten` dann nie gerufen wuerde,
 *     laege die Warteschlange fuer den Rest der Sitzung still - waehrend der fachliche
 *     Vorgang (Datei kopiert, Render geschrieben) laengst fertig ist.
 *
 * (2) DIE STOERUNG WIRD ABER SICHTBAR. Vorher landete sie allein im Hauptprozess-Protokoll,
 *     und der Nutzer erfuhr nichts - obwohl ein verlorener Q3-Eintrag der Nachweis ist,
 *     DASS ein Render ueberhaupt gelaufen ist. Die Protokollzeile bleibt zusaetzlich
 *     stehen: Sie traegt die technische Ursache, die dem Nutzer nichts sagt.
 */
async function schreibeProtokoll(eintrag: ProtokollEintrag, label: string): Promise<void> {
  try {
    const geschrieben = await haengeProtokollEintragAn(eintrag)
    if (!geschrieben.ok) {
      protokolliere(
        `Q3-Eintrag fuer Auftrag ${eintrag.auftragId} NICHT geschrieben ` +
          `(${geschrieben.fehler.code}): ${geschrieben.fehler.meldung}`,
      )
      meldeQueueStoerung(
        `Der Auftrag "${label}" ist abgeschlossen, konnte aber nicht ins ` +
          `Protokoll geschrieben werden: ${geschrieben.fehler.meldung}`,
      )
    }
  } catch (ursache) {
    protokolliere(`Q3-Eintrag fuer Auftrag ${eintrag.auftragId} abgebrochen`, ursache)
    meldeQueueStoerung(
      `Der Auftrag "${label}" ist abgeschlossen, konnte aber nicht ins Protokoll ` +
        `geschrieben werden.`,
    )
  }
}

/**
 * Q2 je nach Ausgang: anlegen/aktualisieren, streichen - oder in Ruhe lassen.
 *
 * `fehlgeschlagen` -> `merkeFehlschlag` (legt an ODER aktualisiert den bestehenden Eintrag,
 * nie ein Duplikat - "Wiederholen bleibt ein Eintrag", TK 9.3.5).
 * `erfolg` -> `streicheAusQ2`; die Funktion ist idempotent, ein fehlender Eintrag ist der
 * NORMALFALL und wird hier nicht vorher geprueft.
 * `abgebrochen` -> NICHTS. Ein Abbruch ist vom Nutzer gewollt und kein Fehlschlag, er
 * gehoert nicht in einen Speicher zum Wiederholen; er ist aber auch weder Erfolg noch
 * Verwerfen und streicht deshalb nichts (FA-17).
 */
async function pflegeQ2(auftrag: Auftrag, ausgang: HandlerErgebnis['status']): Promise<void> {
  if (ausgang === 'abgebrochen') {
    return
  }

  const projektId = auftrag.payload.projektId
  try {
    const gepflegt =
      ausgang === 'fehlgeschlagen'
        ? await merkeFehlschlag(projektId, auftrag)
        : await streicheAusQ2(projektId, auftrag.auftragId)

    if (!gepflegt.ok) {
      protokolliere(
        `Q2 fuer Auftrag ${auftrag.auftragId} NICHT gepflegt ` +
          `(${gepflegt.fehler.code}): ${gepflegt.fehler.meldung}`,
      )
      meldeQueueStoerung(q2Stoerung(auftrag, ausgang, gepflegt.fehler.meldung))
    }
  } catch (ursache) {
    protokolliere(`Q2-Pflege fuer Auftrag ${auftrag.auftragId} abgebrochen`, ursache)
    meldeQueueStoerung(q2Stoerung(auftrag, ausgang, null))
  }
}

/**
 * Der Klartext fuer eine gescheiterte Q2-Pflege.
 *
 * Die beiden Ausgaenge haben ENTGEGENGESETZTE Folgen fuer den Nutzer, deshalb zwei Texte:
 * Bei `fehlgeschlagen` ist der Fehlschlag NICHT vermerkt worden - der Auftrag laesst sich
 * nach einem Neustart nicht wiederholen (FA-17). Bei `erfolg` ist ein ALTER Eintrag NICHT
 * gestrichen worden - der Auftrag steht weiter als Fehlschlag in der Liste, obwohl er
 * geglueckt ist. Ein gemeinsamer Text ("Q2 nicht gepflegt") saegte genau den Unterschied ab,
 * auf den der Nutzer reagieren muesste.
 */
function q2Stoerung(
  auftrag: Auftrag,
  ausgang: HandlerErgebnis['status'],
  ursache: string | null,
): string {
  const grund = ursache === null ? '' : `: ${ursache}`
  return ausgang === 'fehlgeschlagen'
    ? `Der Auftrag "${auftrag.label}" ist fehlgeschlagen, konnte aber nicht zum Wiederholen ` +
        `vorgemerkt werden${grund}`
    : `Der Auftrag "${auftrag.label}" ist geglueckt, der fruehere Fehlschlag konnte aber nicht ` +
        `aus der Wiederholungsliste gestrichen werden${grund}`
}

/**
 * Schritt 6, gegen jeden Ausgang abgesichert: "darf Schritt 7 nicht verhindern; die
 * Schlange muss weiterdrehen." #65 faengt nach seinem Vertrag selbst und wirft nicht -
 * diese Schranke gilt dem Fall, dass es das eines Tages nicht mehr tut.
 */
async function meldeAenderung(): Promise<void> {
  try {
    await sendeQueueGeaendert()
  } catch (ursache) {
    protokolliere('queue:geaendert konnte nicht gemeldet werden', ursache)
  }
}

/**
 * Schritt 7. Der Fang ist die Einloesung der Invariante "Niemals `throw`": Diese Funktion
 * laeuft im Anschluss an eine IPC-bediente Operation, und eine Ausnahme aus dem
 * Torwaechter machte aus einem vollstaendig protokollierten Abschluss eine abgelehnte
 * Promise beim Aufrufer.
 */
function dreheWeiter(): void {
  try {
    starteNaechsten()
  } catch (ursache) {
    protokolliere('starteNaechsten (#59) hat geworfen', ursache)
  }
}

/**
 * `begonnenAm` kommt aus dem Q1-Eintrag (#54) - "genau dafuer existiert er".
 *
 * Der Rueckfall gilt einem Zustand, den es nicht geben duerfte: Nur der Torwaechter (#59)
 * setzt `status: 'laeuft'`, und er setzt dabei `begonnenAm`; ohne `laeuft` kaeme dieser
 * Ablauf gar nicht bis hierher. Traete er trotzdem ein, gibt es nur zwei Moeglichkeiten -
 * einen Eintrag mit gleicher Anfangs- und Endzeit (Laufzeit 0) oder GAR KEINEN Eintrag,
 * weil #56 ein leeres Pflichtfeld zu Recht abweist. Der Nachweis, DASS der Vorgang lief,
 * wiegt schwerer als seine Dauer; deshalb der Rueckfall - aber laut vermerkt, denn
 * stillschweigend waere er eine erfundene Zahl in einer dauerhaften Datei.
 */
function begonnenAmVon(begonnenAm: string | null, beendetAm: string, auftragId: string): string {
  if (begonnenAm !== null && begonnenAm.length > 0) {
    return begonnenAm
  }
  protokolliere(
    `Auftrag ${auftragId} hat keine Startzeit in Q1 - der Protokolleintrag weist die ` +
      `Endzeit als Beginn aus (Laufzeit 0).`,
  )
  return beendetAm
}

/**
 * Die Abbildung `auftrag.ergebnis` -> `ProtokollEintrag.ausgabe` - je Auftragsart
 * verschieden, UMBENANNT und nicht durchgereicht.
 *
 * KEIN Spread und kein `Object.assign`: Der Render liefert seit TK v3.2 mit `ausgabeName`
 * eine vierte Nutzdate, fuer die `ausgabe` KEIN Feld hat ("er ist dort bereits Teil des
 * Pfades", TK 9.3.6). Eine Kopie des ganzen Objekts schriebe ihn still in eine dauerhafte,
 * unbegrenzte Datei. Die drei Felder werden deshalb einzeln uebernommen.
 *
 * Der Export nennt sein Ergebnisfeld `zielPfad` und meint damit bereits den VOLLSTAENDIGEN
 * Pfad der geschriebenen Zieldatei (TK 9.6.1) - hier wird nichts zusammengesetzt, kein
 * `join`, kein Anhaengen eines Dateinamens. Seine `gesamtdauer` ist `null`: ausdruecklich
 * gesetzt, nicht weggelassen, und weder aus einem vorangegangenen Render uebernommen noch
 * per ffprobe nachgeholt noch als `0` erfunden.
 *
 * `import` und `loeschen` bringen KEINE Datei hervor und bleiben `null`; ebenso jeder
 * Ausgang ausser `erfolg` - dort ist `auftrag.ergebnis` bereits `null`.
 *
 * Die Form wird geprueft, weil `Auftrag.ergebnis` als `unknown` deklariert ist und #56 den
 * INHALT von `ausgabe` nicht mehr prueft: Ein `pfad: undefined` kaeme sonst ungebremst in
 * die dauerhafte Historie und zeigte dort fuer immer eine leere Zeile.
 */
function baueAusgabe(auftrag: Auftrag): ProtokollEintrag['ausgabe'] {
  if (auftrag.art !== 'render' && auftrag.art !== 'export') {
    return null
  }

  const nutzdaten = auftrag.ergebnis
  if (typeof nutzdaten !== 'object' || nutzdaten === null) {
    return null
  }
  // SAFETY: die Zeile davor hat nutzdaten als nicht-null Objekt belegt; der Cast macht
  // die Felder als unknown sichtbar, und ihre Form wird darunter einzeln geprueft.
  const roh = nutzdaten as {
    pfad?: unknown
    zielPfad?: unknown
    dateigroesse?: unknown
    gesamtdauer?: unknown
  }

  const pfad = auftrag.art === 'render' ? roh.pfad : roh.zielPfad
  if (typeof pfad !== 'string' || pfad.length === 0 || typeof roh.dateigroesse !== 'number') {
    protokolliere(
      `Auftrag ${auftrag.auftragId} (${auftrag.art}) meldet Erfolg ohne brauchbaren Pfad ` +
        `oder ohne Dateigroesse - der Protokolleintrag bleibt ohne Ausgabe.`,
    )
    return null
  }

  return {
    pfad,
    dateigroesse: roh.dateigroesse,
    gesamtdauer:
      auftrag.art === 'render' && typeof roh.gesamtdauer === 'number' ? roh.gesamtdauer : null,
  }
}

/** ISO-8601 UTC - dieselbe Form, die Q1, Q3 und Q4 verwenden. */
function jetzt(): string {
  return new Date().toISOString()
}

/**
 * "intern vermerken" - dieselbe vorlaeufige Loesung wie in `dispatcher.ts` und
 * `queue-ereignis.ts` dieses Moduls.
 *
 * Diese Funktion hat keinen Aufrufer, dem sie etwas melden koennte (`Promise<void>`, keine
 * Ergebnis-Huelle), und ein Ereignis kann keinen Fehler tragen (TK 9.1.1). Ohne diese
 * Zeile waeren ausgerechnet die Faelle, in denen ein dauerhafter Speicher nicht
 * geschrieben werden konnte, die unauffindbarsten.
 */
function protokolliere(stelle: string, ursache?: unknown): void {
  if (ursache === undefined) {
    console.error(`[auftrags-manager] beendeAuftrag: ${stelle}`)
    return
  }
  console.error(`[auftrags-manager] beendeAuftrag: ${stelle}:`, ursache)
}

// NICHT HIER, UND GEMELDET:
//
// 1. WAS BEI EINEM FEHLSCHLAG VON SCHRITT 3 (Q3) ODER SCHRITT 4 (Q2) GESCHEHEN SOLL, IST
//    OFFEN - der STOPP-Block des Issues verbietet ausdruecklich, das hier zu entscheiden.
//    Vorlaeufig gilt: Der Fehler wird ins Protokoll des Hauptprozesses geschrieben, der
//    Abschluss laeuft weiter (Q1 wird geraeumt, gemeldet, der naechste startet). Begruendung
//    fuer genau diese Vorlaeufigkeit: Die beiden Alternativen sind nachweislich schlechter -
//    ein Abbruch mitten im Ablauf liesse den Auftrag mit terminalem Status in Q1 zurueck und
//    braechte die Warteschlange fuer den Rest der Sitzung zum Stehen (die Einleitung des
//    Issues nennt genau das als schwersten Schaden), und ein `throw` ist durch die
//    Invariante verboten. WAS FEHLT: Der Nutzer erfaehrt nichts davon. Ein Ereignis dafuer
//    ist nicht vorgesehen, `queue:geaendert` traegt keinen Fehler, und einen Kanal zu
//    erfinden waere eine Vertragsaenderung. Zu entscheiden sind die drei Fragen des
//    STOPP-Blocks zusammen.
//
// 2. KEINE AUTOMATISCHE WIEDERHOLUNG. Diese Funktion legt den Q2-Eintrag an und hoert dort
//    auf; Wiederholen ist eine ausdrueckliche Nutzeraktion (FA-17, #63).
//
// 3. KEIN D1-LOCK, KEIN SCHREIBEN AN project.json, KEINE FACHLOGIK. Kein Aufraeumen von T1,
//    kein Loeschen von Dateien, kein ffmpeg (TK 9.5.4 "Lock-Grenze", TK 9.3 "plant, ordnet
//    und protokolliert nur"). Diese Datei importiert entsprechend weder `fs` noch ein
//    Schreibmodul des project-store.
//
// 4. KEIN Q4-EINTRAG. Die Tabelle "Wann geschrieben wird" (TK 9.3) fuehrt fuer die drei
//    terminalen Uebergaenge je einen Q3-Eintrag und ausdruecklich KEINE Q4-Bewegung.
