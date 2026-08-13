// GENERIERT aus dem Signaturblock von Issue #87.
// [media-service] löscheMedium zusammensetzen
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
// GERUEST-PRUEFSUMME: e462ad66f4aac999
//
// ERLEDIGT (13.08.2026): Die Abschaltzeile fuer @typescript-eslint/no-unused-vars ist
// mit dem Fuellen des Rumpfes ENTFERNT. Der einzige Parameter, der danach unbenutzt
// waere, ist `kontext` - er wird unten ausdruecklich als "absichtlich unbenutzt"
// verbraucht, statt die Regel fuer die ganze Datei blind zu machen.

import { merkePendingDeletion } from '../auftrags-manager/pending-deletions';
import { entferneAsset } from '../project-store/assets';
import { loeseAssetPfad } from '../project-store/pfade';

import { entferneDatei } from './datei-entfernen';

import type { Auftrag } from '../../shared/contracts/auftrag';
import type { GenerischerFehlercode } from '../../shared/contracts/ergebnis';
import type { AusfuehrungsKontext, HandlerErgebnis } from '../auftrags-manager/dispatcher';
import type { LoeschFehlercode } from './fehlercodes';

// Fremde Aufrufe - vollstaendige Signaturen, damit hier nichts geraten wird:
//   #73:  entferneAsset(projektId: string, assetId: string)
//           : Promise<Ergebnis<Asset, 'asset_referenziert' | 'asset_nicht_gefunden'
//                                     | ProjectStoreFehlercode>>
//         // prueft die Referenzen UND entfernt den Eintrag im SELBEN kritischen Abschnitt unter
//         // dem EINEN D1-Schreib-Lock, schreibt per SOFORT-FLUSH (TK 9.5.4) und liefert den
//         // ENTFERNTEN Asset zurueck. `ok: true` heisst: der Eintrag ist DAUERHAFT weg.
//         // Referenziert -> `asset_referenziert` mit `daten: { referenzenIds: string[] }`,
//         // NICHTS ist veraendert. Nimmt das Lock SELBST - hier wird nichts eingewickelt.
//   #49:  loeseAssetPfad(projektId: string, dateiname: string): Ergebnis<string>
//         // absoluter Pfad der Asset-Datei; `ungueltige_eingabe`, wenn der Pfad nach
//         // Normalisierung nicht innerhalb von medienOrdner(projektId) liegt. Reine
//         // String-Operation, kein Dateisystemzugriff.
//   #86:  entferneDatei(pfad: string): Promise<Ergebnis<void, 'datei_fehler'>>
//         // loescht GENAU EINE Datei, mit Retry+Backoff bei EBUSY/EPERM; eine bereits
//         // fehlende Datei ist ERFOLG (idempotent).
//   #66:  merkePendingDeletion(projektId: string, dateiname: string)
//           : Promise<Ergebnis<void, QueueFehlercode>>
//         // idempotent; nimmt den DATEINAMEN ohne Verzeichnisanteil, NICHT den absoluten Pfad.
//
// DIE REIHENFOLGE IST DER GANZE INHALT DIESER DATEI: D1 zuerst, danach die Datei.
// "Atomizitaet Loeschen: Reihenfolge D1 -> Datei. Kein ListItem zeigt je auf eine bereits
// geloeschte Datei." (TK 9.4.8, Punkt 6) Umgedreht entstuende - zwischen den Schritten oder fuer
// immer, wenn der zweite scheitert - ein Listenelement, das auf eine geloeschte Datei zeigt; der
// Nutzer merkte es erst am mitten im Lauf abbrechenden Render. In DIESER Richtung bleibt
// schlimmstenfalls eine Datei ohne Eintrag liegen: "Konsistenz gewinnt gegen Aufraeum-Sauberkeit."
// (TK 9.4.6)
//
// WAS DIESE DATEI NICHT TUT: keine eigene Referenzpruefung (die liegt im kritischen Abschnitt von
// #73, eine zweite davor oder danach waere wertlos - der `composer` kann dazwischen eine Referenz
// setzen), kein Lock (TK 9.4.8 Punkt 9), kein eigener Sofort-Flush (der steckt in #73), kein
// zweiter Retry (der steckt in #86), kein eigener Pfadbau, kein Lesezugriff auf project.json.

/**
 * Der Fehler, den `entferneAsset` (#73) liefern kann - ABGELEITET statt abgeschrieben.
 *
 * Das ist die Naht-Sicherung dieser Datei: Waechst die Fehlercode-Union des `project-store`, faellt
 * die Zuordnung unten NICHT lautlos auf `unbekannter_fehler` zurueck, sondern bricht hier im
 * Typecheck. Genau dieser Fall ist am 13.08.2026 eingetreten (s. Schlussvermerk Punkt 1) - eine
 * abgetippte Union haette ihn verschluckt.
 */
type StoreFehler = Extract<Awaited<ReturnType<typeof entferneAsset>>, { ok: false }>['fehler'];

export async function löscheMedium(
  auftrag: Extract<Auftrag, { art: 'loeschen' }>,
  kontext: AusfuehrungsKontext,
): Promise<HandlerErgebnis<LoeschFehlercode>> {
  // ABSICHTLICH UNBENUTZT (Festlegung 5 des Issues): "Ein Loeschvorgang dauert Millisekunden bis
  // wenige Sekunden und hat keine sinnvollen Zwischenstaende." `fortschritt` bleibt `null`. Der
  // Parameter steht trotzdem in der Signatur, weil sie der Vertrag jedes Handlers ist (#60) - und
  // `void` sagt das an Ort und Stelle, statt die Lint-Regel fuer die ganze Datei abzuschalten.
  void kontext;

  // EIN Fangnetz um den ganzen Ablauf. "Niemals `throw` - diese Funktion ist der Handler eines
  // Auftrags": Eine durchgereichte Ausnahme wuerde zwar von `fuehreAus` (#60) noch gefangen, aber
  // dort zu einem nichtssagenden `unbekannter_fehler` ohne Bezug zum Loeschen - und der Fangzweig
  // dort weiss nicht, wie weit der Ablauf gekommen ist.
  try {
    // -------------------------------------------------------------------------------------
    // Schritt 0: Nutzlast pruefen. "Der Main validiert jede eingehende Nutzlast - er vertraut
    // dem Renderer nicht." (TK 9.1.1, Punkt 6) Ein Verstoss endet OHNE JEDE WIRKUNG: kein
    // D1-Zugriff, kein Dateizugriff.
    //
    // Der Umweg ueber `unknown`: Die Signatur sagt `LöschRequest`, der Auftrag kann aber aus der
    // Q2-Datei stammen und damit aus JSON, dessen Form niemand mehr garantiert.
    const nutzlast: unknown = auftrag.payload;
    if (typeof nutzlast !== 'object' || nutzlast === null) {
      return fehlgeschlagen('ungueltige_eingabe', 'Der Loeschauftrag hat keine brauchbare Nutzlast.');
    }
    const { projektId, assetId } = auftrag.payload;
    if (typeof projektId !== 'string' || projektId.trim() === '') {
      return fehlgeschlagen('ungueltige_eingabe', 'Es wurde keine brauchbare Projekt-ID uebergeben.');
    }
    if (typeof assetId !== 'string' || assetId.trim() === '') {
      return fehlgeschlagen('ungueltige_eingabe', 'Es wurde keine brauchbare Medien-ID uebergeben.');
    }

    // -------------------------------------------------------------------------------------
    // Schritt 1: D1 ZUERST. Referenzpruefung, Entfernen und Sofort-Flush liegen vollstaendig in
    // #73 - diese Zeile ist der ganze Schritt.
    //
    // Erst ein `ok: true` von hier gibt Schritt 2 frei: Es bedeutet "der Eintrag ist DAUERHAFT
    // weg", nicht "im Arbeitsspeicher weg". Ohne diese Zusage waere "D1 zuerst" nur bis zum
    // naechsten Absturz wahr (project.json wird sonst entprellt geschrieben, 3-5 s, TK 9.5.4).
    const entfernt = await entferneAsset(projektId, assetId);
    if (!entfernt.ok) {
      // Bei `asset_referenziert` ist hier Schluss: Eintrag UND Datei bleiben unangetastet.
      // "Medium loeschen: blockiert bei Referenz." (TK 9.5.3) Es gibt kein "trotzdem loeschen".
      return uebernimmStoreFehler(entfernt.fehler);
    }
    // Der `dateiname` kommt AUSSCHLIESSLICH von hier. In D1 gibt es ihn ab jetzt nicht mehr - ein
    // zweiter Leseweg auf project.json waere nicht nur ueberfluessig, er fuehrte ins Leere.
    const asset = entfernt.wert;

    // -------------------------------------------------------------------------------------
    // Schritt 2: Pfad aufloesen - erst jetzt, weil der `dateiname` aus Schritt 1 stammt. Das
    // Ordner-Layout kennt allein die Pfad-Autoritaet (#49, TK 9.5.7); hier wird nichts
    // zusammengesetzt.
    const pfad = loeseAssetPfad(projektId, asset.dateiname);
    if (!pfad.ok) {
      // KEIN merkePendingDeletion: Der Vermerk truege genau denselben unbrauchbaren `dateiname`
      // und waere beim naechsten Oeffnen wieder nicht aufloesbar - der Reconcile (#90) liesse ihn
      // dauerhaft als offen stehen. Die Datei bleibt als Waise fuer den Aufraeumlauf (#88) liegen,
      // der ohne Pfadaufloesung arbeitet.
      return fehlgeschlagen(
        'ungueltige_eingabe',
        `Der Eintrag ist aus dem Projekt entfernt, die Mediendatei liess sich aber nicht ` +
          `zuordnen und bleibt vorerst liegen. Grund: ${pfad.fehler.meldung}`,
      );
    }

    // -------------------------------------------------------------------------------------
    // Schritt 3: Datei entfernen - AUSSERHALB jedes Locks. Retry+Backoff gegen einen
    // nachhaengenden Vorschau-Handle unter Windows stecken in #86; hier entsteht kein zweiter.
    const geloescht = await entferneDatei(pfad.wert);
    if (!geloescht.ok) {
      if (geloescht.fehler.code !== 'datei_fehler') {
        // `ungueltige_eingabe` darf nach einem erfolgreichen Schritt 2 gar nicht auftreten (der
        // Pfad kommt fertig aus #49). Tritt es doch auf, ist es ein Programmierfehler und KEIN
        // Dateisystemfehler - es gab keinen Loeschversuch, den man nachholen koennte. Also kein
        // Vermerk; die Datei bleibt Waise fuer #88.
        return fehlgeschlagen(geloescht.fehler.code, geloescht.fehler.meldung);
      }

      // ---------------------------------------------------------------------------------
      // Schritt 4: NUR bei `datei_fehler` vormerken. Die Datei ist noch da, der Eintrag ist weg;
      // der Reconcile beim naechsten Oeffnen holt die Loeschung nach (TK 9.4.7).
      const vorgemerkt = await merkePendingDeletion(projektId, asset.dateiname);

      // Vorgemerkt wird der DATEINAME, nie der absolute Pfad: "nie ein gespeicherter OS-Pfad mit
      // `\`/`/`" (TK 9.4.8, Punkt 1). Die App ist portabel - ein Pfad in queue-retry.json ist
      // falsch, sobald der Projektordner umzieht (USB-Stick), und der Reconcile suchte an der
      // falschen Stelle.
      const nachsatz = vorgemerkt.ok
        ? `Die Loeschung ist vorgemerkt und wird beim naechsten Oeffnen des Projekts nachgeholt.`
        : `Die Loeschung konnte ausserdem nicht vorgemerkt werden (${vorgemerkt.fehler.meldung}); ` +
          `die Datei bleibt ohne Eintrag liegen und wird beim naechsten Aufraeumen entfernt.`;

      // FEHLGESCHLAGEN, obwohl vorgemerkt ist - und das ist kein Versehen: TK 9.4.9 nennt
      // `datei_fehler` genau dafuer ("nach Retry -> als pendingDeletion vorgemerkt"). Ein
      // gemeldeter Erfolg verbaerge, dass der Speicherplatz bis zum naechsten Projektstart belegt
      // bleibt, und der Auftrag verschwaende aus der Fehlerhistorie (FA-17).
      //
      // Der Code bleibt auch dann `datei_fehler`, wenn das Vormerken selbst scheitert
      // (Festlegung 2): Der Nutzer soll erfahren, dass seine Datei nicht weg ist; ob sie
      // zusaetzlich in der Wiederholungsliste steht, ist nachrangig - und ein Code fuer den
      // Innenzustand der Warteschlange gehoert nicht in den Loesch-Vertrag.
      return fehlgeschlagen(
        'datei_fehler',
        `Der Eintrag ist aus dem Projekt entfernt. ${geloescht.fehler.meldung} ${nachsatz}`,
      );
    }

    // -------------------------------------------------------------------------------------
    // Erst jetzt Erfolg: Eintrag dauerhaft weg UND Datei weg.
    //
    // "Auftrags-Ergebnis bei Erfolg: { assetId } in Auftrag.ergebnis" (TK 9.4.3). Es reist im Feld
    // `ergebnis` und wird von der Auftragsverwaltung abgelegt (TK 9.3.1) - kein eigener
    // Ereigniskanal, keine zweite Meldung.
    return { status: 'erfolg', ergebnis: { assetId } };
  } catch (ursache) {
    // "Eine rohe Exception-Meldung wird nie zum Code." (TK 9.1.1, Punkt 3) Der Text der Ausnahme
    // reist als Begruendung mit, der Stacktrace NICHT - der ueberlebt die IPC-Grenze ohnehin nur
    // als Rauschen (TK 9.1.1, Punkt 8).
    return fehlgeschlagen(
      'unbekannter_fehler',
      `Das Loeschen des Mediums ist unerwartet fehlgeschlagen. Grund: ${textVon(ursache)}`,
    );
  }
}
// - Reihenfolge verbindlich: entferneAsset (#73) -> loeseAssetPfad (#49) -> entferneDatei (#86)
// - merkePendingDeletion (#66) AUSSCHLIESSLICH nach `datei_fehler` aus Schritt 3
// - kein eigenes Lock, kein eigener Flush, kein eigener Retry, kein eigener Pfadbau
// - liefert NIE { status: 'abgebrochen' } (Abbrechen gibt es laut FA-18 nur fuer `render`)

/**
 * Der Fehler des `project-store` (#73), uebernommen in den Vorrat dieser Funktion.
 *
 * DER CODE WIRD UNVERAENDERT DURCHGEREICHT, ebenso `daten` - #60 verlangt fuer
 * Handler-Ergebnisse ausdruecklich "unveraendert durchreichen, kein Umschreiben, kein
 * Vereinheitlichen". An `daten: { referenzenIds }` haengt der gefuehrte Reparatur-Modus (FA-19);
 * die IDs gehoeren NICHT in den Meldungstext, den die Oberflaeche sonst parsen muesste.
 *
 * ⚠ ZWEI CODES PASSEN NICHT IN `LoeschFehlercode` - GEMELDET, NICHT UMGEBOGEN (s. Schlussvermerk
 * Punkt 1). Das Issue verlangt fuer genau diesen Fall "fragen, nicht lokal umbiegen"; bis zur
 * Antwort ist die einzige Form, die weder `LoeschFehlercode` (#79, fremde Datei) noch den
 * Rueckgabetyp antastet, dieselbe wie in `reconcile-fehlt.ts` (#89): `unbekannter_fehler` mit dem
 * echten Code IM KLARTEXT der Meldung, damit die Ursache wenigstens lesbar bleibt.
 */
function uebernimmStoreFehler(fehler: StoreFehler): HandlerErgebnis<LoeschFehlercode> {
  if (fehler.code === 'projekt_beschaeftigt') {
    return fehlgeschlagen(
      'unbekannter_fehler',
      `Das Medium konnte nicht geloescht werden; der Projektspeicher meldete "${fehler.code}". ` +
        `Grund: ${fehler.meldung}`,
    );
  }
  // Hier bleibt `asset_referenziert | asset_nicht_gefunden | speicher_fehler | kein_projekt`
  // plus die drei generischen Codes - jeder davon passt in `LoeschFehlercode |
  // GenerischerFehlercode` und wird UNVERAENDERT durchgereicht.
  return fehlgeschlagen(fehler.code, fehler.meldung, fehler.daten);
}

/**
 * Die Fehlerhuelle. `daten` reist nur mit, wenn der gerufene Baustein welche geliefert hat - ein
 * immer gesetztes, leeres Feld boete dem Aufrufer etwas zum Auswerten an, das nie etwas enthaelt
 * (TK 9.1.1: das Feld ist optional).
 */
function fehlgeschlagen(
  code: LoeschFehlercode | GenerischerFehlercode,
  meldung: string,
  daten?: unknown,
): HandlerErgebnis<LoeschFehlercode> {
  if (daten === undefined) {
    return { status: 'fehlgeschlagen', fehler: { code, meldung } };
  }
  return { status: 'fehlgeschlagen', fehler: { code, meldung, daten } };
}

/** Der Text einer Ausnahme, ohne Stacktrace - der reist nicht ueber die Grenze. */
function textVon(ursache: unknown): string {
  return ursache instanceof Error ? ursache.message : String(ursache);
}

// NICHT HIER, UND GEMELDET:
//
// 1. ERLEDIGT am 13.08.2026 - der Vermerk bleibt als Beleg stehen.
//    Der Bau-Agent hat gemeldet, dass `ProjectStoreFehlercode` gewachsen ist
//    (`speicher_fehler | projekt_beschaeftigt | kein_projekt`), `LoeschFehlercode` aber nicht -
//    ein Loeschauftrag ohne geoeffnetes Projekt meldete deshalb `unbekannter_fehler`, und der
//    echte Code stand nur im Meldungstext. Nicht theoretisch: Der Auftrag wird beim Einreihen
//    eingefroren (TK 9.3.5) und kann laufen, nachdem der Nutzer das Projekt gewechselt hat.
//    RICHTIG GEHANDELT: #79 ist eine fremde Datei, und den Rueckgabetyp aufzuweichen verbietet
//    der STOPP-Block - also gemeldet statt eigenmaechtig geaendert. Behoben ist es jetzt in #79:
//    `LoeschFehlercode` traegt `kein_projekt`, und diese Datei reicht ihn unveraendert durch.
//    DERSELBE Befund war zuvor fuer `ReconcileFehlercode` (#89) gemeldet und behoben worden -
//    der Loesch- und der Import-Zweig waren dabei uebersehen worden. Beide sind jetzt mit drin.
//
// 2. KEIN NACHHOLEN. Nach einem endgueltigen Fehlschlag wird vorgemerkt und Schluss - kein Timer,
//    kein zweiter Versuch, kein Aufraeumen beim naechsten Loeschauftrag. Offene Loeschungen fuehrt
//    ausschliesslich der Reconcile aus (TK 9.4.7, #90); die Auftragsverwaltung VERWAHRT sie nur
//    (TK v2.4).
//
// 3. KEINE VORBEDINGUNG-PRUEFUNG FUER DIE VORSCHAU. "Vor einem `loeschen` gibt der Renderer jeden
//    `<video>`-Handle auf diesen Asset frei" (TK 9.4.6, Regel B) ist eine Zusage der Oberflaeche
//    (M5/M7). Diese Datei verlaesst sich darauf, prueft es nicht nach und schliesst keine
//    Renderer-Handles aus dem Main heraus; der Windows-Retry in #86 ist das Sicherheitsnetz.
//
// 4. KEIN `zustand`-WECHSEL AUF 'fehlt' ALS TROSTPFLASTER. Bleibt die Datei nach `datei_fehler`
//    liegen, waere es verlockend, irgendwo "fehlt" zu vermerken - es gibt aber gar keinen Eintrag
//    mehr, den man markieren koennte: Schritt 1 hat ihn entfernt.
