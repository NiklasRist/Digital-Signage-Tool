// GENERIERT aus dem Signaturblock von Issue #85.
// [media-service] importMedium zusammensetzen
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
// GERUEST-PRUEFSUMME: 8f251567dbb2da2c
//
// ERLEDIGT (13.08.2026): Die Abschaltzeile fuer @typescript-eslint/no-unused-vars ist mit dem
// Fuellen des Rumpfes ENTFERNT. Beide Parameter werden benutzt - `kontext` seit der
// Fortschritts-Verdrahtung unten.

import path from 'node:path';

import { erzeugeId } from '../../shared/contracts/id';
import { fuegeAssetHinzu } from '../project-store/assets';
import { loeseAssetPfad, medienOrdner } from '../project-store/pfade';

import { entferneDatei } from './datei-entfernen';
import { leseRohMetadaten } from './ffprobe';
import { pruefeFormat } from './format-pruefung';
import { kopiereInsStaging, macheEndgueltig } from './import-datei';
import { werteMetadatenAus } from './metadaten';

import type { Asset } from '../../shared/contracts/asset';
import type { Auftrag } from '../../shared/contracts/auftrag';
import type { GenerischerFehlercode } from '../../shared/contracts/ergebnis';
import type { AusfuehrungsKontext, HandlerErgebnis } from '../auftrags-manager/dispatcher';
import type { ImportFehlercode } from './fehlercodes';

// Fremde Aufrufe - vollstaendige Signaturen, damit hier nichts geraten wird (alle am 13.08.2026
// in der gebauten Datei nachgelesen, nicht aus dem Issue abgeschrieben):
//   #20:  erzeugeId(): string                                    // UUID v4
//   #49:  medienOrdner(projektId: string): string                // reine String-Operation
//         loeseAssetPfad(projektId: string, dateiname: string): Ergebnis<string>
//   #80:  pruefeFormat(dateiname: string)
//           : Ergebnis<{ typ: 'video' | 'bild'; endung: string }, 'format_nicht_unterstuetzt'>
//         // nimmt selbst das letzte Pfadsegment, vertraegt also den ganzen quellPfad
//   #84:  kopiereInsStaging(quellPfad, zielOrdner, dateiname, meldeFortschritt?)
//           : Promise<Ergebnis<{ partPfad: string }, 'datei_nicht_gefunden' | 'kopier_fehler'>>
//         macheEndgueltig(partPfad, endPfad): Promise<Ergebnis<void, 'kopier_fehler'>>
//   #82:  leseRohMetadaten(dateiPfad: string): Promise<Ergebnis<unknown, 'probe_fehler'>>
//   #83:  werteMetadatenAus(roh: unknown, typ: 'video' | 'bild')
//           : Ergebnis<{ maße: {breite, höhe}; dauer: number | null }, 'probe_fehler'>
//   #86:  entferneDatei(pfad: string): Promise<Ergebnis<void, 'datei_fehler'>>
//   #72:  fuegeAssetHinzu(projektId: string, asset: Asset): Promise<Ergebnis<Asset,
//           ProjectStoreFehlercode>>   // nimmt das D1-Lock SELBST und flusht sofort
//
// DIE REIHENFOLGE IST DER GANZE INHALT DIESER DATEI. Jeder einzelne Baustein ist harmlos; ihre
// Anordnung ist es, die garantiert, dass nie ein Asset-Eintrag auf eine unvollstaendige oder gar
// nicht vorhandene Datei zeigt:
//   1. "Quelle -> media/.staging/<uuid>.<ext>.part kopieren (langsam, AUSSERHALB des D1-Locks)."
//   2. "ffprobe auf die .part-Datei, MIT TIMEOUT (ausserhalb des Locks)."
//   3. "fs.rename .part -> media/<uuid>.<ext> - ATOMAR, weil gleiche Partition."
//   4. "[D1-Lock] Asset in D1 anhaengen, danach SOFORT-FLUSH (9.5.4) - der Auftrag meldet Erfolg
//      erst, wenn der Eintrag auf der Platte steht (Millisekunden). Scheitert der Flush ->
//      speicher_fehler (9.4.9)." (alles TK 9.4.5)
// Das zugelassene Schadensbild steht daneben und ist ABSCHLIESSEND: "Crash vor 3 -> nur eine
// .part-Leiche; Crash nach 3 vor 4 -> eine fertige Waise ohne D1-Eintrag. Beides raeumt der
// Reconcile (9.4.7) auf." Wer die Schritte umstellt, erzeugt ein Schadensbild, das dort nicht
// vorgesehen ist - und das findet danach niemand mehr.
//
// WAS DIESE DATEI NICHT TUT: kein eigenes Ordner-Layout (Pfade kommen aus #49), kein Lock und kein
// eigener Flush (beides steckt in #72), keine Konvertierung/Normalisierung der Quelldatei (die
// bleibt roh, TK 9.4.1), keine Sonderbehandlung von Aktions-Bildern, kein zweiter Transportweg fuer
// den fertigen Asset (er reist im Feld `ergebnis`), keine Schleife ueber mehrere Quellpfade (die
// Oberflaeche reiht je Datei einen eigenen Auftrag ein).

/**
 * Der Anteil, den das Kopieren am Gesamtauftrag hat - in Prozentpunkten.
 *
 * WOFUER: `kopiereInsStaging` (#84) meldet seit dem 13.08.2026 einen Kopier-Anteil 0..1. Er meint
 * NUR die Kopie; `AusfuehrungsKontext.meldeFortschritt` (#60) will dagegen den Stand des GANZEN
 * Auftrags in Prozent ("0-100 oder null", TK 9.3.1). Diese Datei ist die einzige Stelle, die beide
 * kennt - ohne die Umrechnung hier waere der am selben Tag gebaute Fortschritt gebaut und tot.
 *
 * WARUM 95 UND NICHT 100: Das Kopieren ist der einzige Schritt, dessen Dauer mit der Dateigroesse
 * waechst (ein 2-GB-Video: zig Sekunden). ffprobe ist durch seinen eigenen Timeout gedeckelt,
 * Rename und D1-Eintrag dauern Millisekunden - die Kopie ist also fast der ganze Auftrag, aber eben
 * nicht der ganze. Stuende der Balken schon auf 100, behauptete er Fertigsein, waehrend Pruefung,
 * Uebernahme und Eintrag noch ausstehen - genau der Fehler, den #84 beim Verwerfen der
 * Windows-Messung ("meldet sofort die volle Groesse") ausdruecklich vermeidet. Die letzten 5 Punkte
 * bleiben deshalb bewusst unbesetzt: Dass der Auftrag fertig ist, sagt sein ENDZUSTAND, nicht der
 * Fortschrittskanal ("Der Fortschrittskanal traegt keinen Endzustand", TK 9.2.7).
 *
 * WARUM ES DAZWISCHEN KEINE WEITEREN MARKEN GIBT: Erfunden waeren sie - kein Schritt nach der Kopie
 * hat einen messbaren Zwischenstand. Eine Marke ohne Messung ist eine Behauptung ueber die Restzeit.
 */
const ANTEIL_KOPIE_PROZENT = 95;

export async function importMedium(
  auftrag: Extract<Auftrag, { art: 'import' }>,
  kontext: AusfuehrungsKontext,
): Promise<HandlerErgebnis<ImportFehlercode>> {
  // Die beiden Merker, an denen der Aufraeum-Zustaendigkeit haengt (Regel unten bei `raeumeAuf`).
  // Sie stehen VOR dem try, damit der Fangzweig sie sieht.
  let partPfad: string | null = null;
  let uebernommen = false;

  // EIN Fangnetz um den ganzen Ablauf. "Niemals throw - diese Funktion ist der Handler eines
  // Auftrags": Eine durchgereichte Ausnahme faenge zwar #60 noch ab, aber dort als nichtssagender
  // `unbekannter_fehler` OHNE Wissen darueber, wie weit der Ablauf gekommen ist - die .part-Datei
  // bliebe liegen, obwohl wir sie hier noch wegraeumen koennen.
  try {
    // ---------------------------------------------------------------------------------
    // Schritt 0: Nutzlast pruefen. "Der Main validiert jede eingehende Nutzlast - er vertraut dem
    // Renderer nicht. Ungueltige Eingabe -> ungueltige_eingabe, OHNE jede Wirkung auf die Daten."
    // (TK 9.1.1, Punkt 6) Bis hierher ist nichts angelegt und nichts angefasst.
    //
    // Der Umweg ueber `unknown`: Die Signatur sagt `ImportRequest`, der Auftrag kann aber aus der
    // Q2-Datei stammen und damit aus JSON, dessen Form niemand mehr garantiert.
    const nutzlast: unknown = auftrag.payload;
    if (typeof nutzlast !== 'object' || nutzlast === null) {
      return fehlgeschlagen('ungueltige_eingabe', 'Der Importauftrag hat keine brauchbare Nutzlast.');
    }
    const { projektId, quellPfad } = auftrag.payload;
    if (typeof projektId !== 'string' || projektId.trim() === '') {
      return fehlgeschlagen('ungueltige_eingabe', 'Es wurde keine brauchbare Projekt-ID uebergeben.');
    }
    if (typeof quellPfad !== 'string' || quellPfad.trim() === '') {
      return fehlgeschlagen('ungueltige_eingabe', 'Es wurde keine Quelldatei zum Importieren uebergeben.');
    }

    // ---------------------------------------------------------------------------------
    // Schritt 1: Format pruefen - VOR dem Kopieren. Andersherum wanderten 2 GB ueber die Platte,
    // nur um danach abgewiesen zu werden.
    //
    // Der ganze `quellPfad` geht hinein, KEIN eigenes basename davor: #80 nimmt selbst das letzte
    // Segment (nach `/` ODER `\`, plattformunabhaengig). Ein `path.basename` hier waere die zweite,
    // plattformabhaengige Zerlegung desselben Pfades.
    const format = pruefeFormat(quellPfad);
    if (!format.ok) {
      return fehlgeschlagen(format.fehler.code, format.fehler.meldung);
    }

    // ---------------------------------------------------------------------------------
    // Schritt 2: GENAU EIN erzeugeId(). Die UUID steckt im Dateinamen UND in `Asset.id` - "Die
    // uuid im Dateinamen IST die Asset.id. Es gibt keine zweite ID"; der Reconcile schliesst aus
    // dem Dateinamen auf den Eintrag. Ein zweiter Aufruf machte die beiden lautlos verschieden,
    // und jede Datei saehe fuer den Reconcile wie eine Waise aus.
    const assetId = erzeugeId();

    // ---------------------------------------------------------------------------------
    // Schritt 3: Pfade aufloesen - VOR jedem Dateisystemzugriff, damit ein unbrauchbarer Pfad
    // nichts hinterlaesst.
    //
    // `dateiname` = "<uuid>.<ext_kleingeschrieben>", ohne Verzeichnisanteil (TK 9.4.8, Punkt 1).
    // Die Endung kommt kleingeschrieben und ohne Punkt aus #80 - hier wird nichts nachgebessert;
    // ein zweites toLowerCase() waere eine zweite Zusage ueber dieselbe Schreibweise.
    // Der ORIGINALNAME geht in KEINEN Pfad ein: "Nie der Originalname, nie ein gespeicherter
    // OS-Pfad" (ebd.) - sonst ist das Projekt nicht zwischen Windows und macOS portabel.
    const dateiname = `${assetId}.${format.wert.endung}`;
    const ordner = medienOrdner(projektId);
    const endPfad = loeseAssetPfad(projektId, dateiname);
    if (!endPfad.ok) {
      // Kann nur bei beschaedigten Daten auftreten (die `projektId` ist kein brauchbares
      // Pfadsegment). Es ist nichts angelegt worden.
      return fehlgeschlagen(endPfad.fehler.code, endPfad.fehler.meldung);
    }

    // ---------------------------------------------------------------------------------
    // Schritt 4: Kopieren - der langsame Teil, AUSSERHALB jedes Locks.
    //
    // Der vierte Parameter ist die Fortschritts-Durchreiche (s. `aufGesamtfortschritt`). Sie wird
    // hier NICHT zusaetzlich gedrosselt: #84 meldet bereits nur bei einem Wechsel der ganzen
    // Prozentstufe, also hoechstens 101 Mal, und #60 huellt `meldeFortschritt` seinerseits in einen
    // Schutz gegen Ausnahmen. Ein dritter Mechanismus an derselben Kette waere Doppelung.
    const kopiert = await kopiereInsStaging(quellPfad, ordner, dateiname, (anteil) => {
      kontext.meldeFortschritt(aufGesamtfortschritt(anteil));
    });
    if (!kopiert.ok) {
      // KEIN Aufraeumen: Bei gescheiterter Kopie liefert #84 gar keinen `partPfad`, und ihn selbst
      // zusammenzubauen waere eine zweite Pfadwahrheit. Eine angefangene .part-Datei raeumt der
      // Reconcile (#88), der den Staging-Ordner beim Projektstart leert.
      return fehlgeschlagen(kopiert.fehler.code, kopiert.fehler.meldung);
    }
    // AB HIER GEHOERT DIE .part-DATEI UNS - bis einschliesslich eines gescheiterten Renames.
    partPfad = kopiert.wert.partPfad;

    // ---------------------------------------------------------------------------------
    // Schritt 5: ffprobe auf die .part-DATEI, nicht auf die Quelle. Geprueft wird die Datei, die
    // tatsaechlich im Projekt landet: Eine Kopie kann beschaedigt sein, waehrend die Quelle heil
    // ist - und umgekehrt ist die Quelle nach dem Kopieren vielleicht gar nicht mehr erreichbar.
    const roh = await leseRohMetadaten(partPfad);
    if (!roh.ok) {
      await raeumeAuf(partPfad);
      return fehlgeschlagen(roh.fehler.code, roh.fehler.meldung);
    }

    // ---------------------------------------------------------------------------------
    // Schritt 6: Auswerten - noch VOR dem Rename, damit eine Datei mit unbrauchbaren Metadaten den
    // endgueltigen Namen nie bekommt. Die Rohausgabe wird UNVERAENDERT weitergereicht; aus ihr wird
    // hier nichts gelesen (das Deuten ist vollstaendig #83).
    const metadaten = werteMetadatenAus(roh.wert, format.wert.typ);
    if (!metadaten.ok) {
      await raeumeAuf(partPfad);
      return fehlgeschlagen(metadaten.fehler.code, metadaten.fehler.meldung);
    }

    // ---------------------------------------------------------------------------------
    // Schritt 7: Der eine unteilbare Schritt. Ab hier ist die Datei fuer alle sichtbar.
    // Keine Existenzpruefung des Ziels davor: Der Zielname traegt eine frisch erzeugte UUID.
    const uebernahme = await macheEndgueltig(partPfad, endPfad.wert);
    if (!uebernahme.ok) {
      // #84 raeumt in KEINEM Fall selbst auf - auch nicht, wenn schon der fsync scheitert und der
      // Rename gar nicht mehr stattfindet.
      await raeumeAuf(partPfad);
      return fehlgeschlagen(uebernahme.fehler.code, uebernahme.fehler.meldung);
    }
    uebernommen = true;

    // ---------------------------------------------------------------------------------
    // Schritt 8: Den Asset zusammensetzen - reines Bauen, kein IO.
    //
    // Die Zeit wird genau EINMAL abgefragt (unten bei `importdatum`): Zwei Abfragen koennten zwei
    // Zeitpunkte liefern, und dann stuende im Datensatz eine andere Zeit als in einer davon
    // abgeleiteten Anzeige.
    const asset: Asset = {
      id: assetId,
      typ: format.wert.typ,
      dateiname,
      // NUR FUER DIE ANZEIGE (TK 9.4.4) - dieser Wert bildet nirgends einen Pfad. Deshalb ist
      // `path.basename` hier unbedenklich, obwohl es plattformabhaengig zerlegt: Ein unter macOS
      // importiertes "..\\boese.mp4" bliebe als Anzeigename stehen, kaeme aber in keinen
      // Dateisystemaufruf - der Zielname ist `dateiname` aus Schritt 3.
      originalname: path.basename(quellPfad),
      maße: metadaten.wert.maße,
      dauer: metadaten.wert.dauer,
      importdatum: new Date().toISOString(),
      // "fehlt" setzt ausschliesslich der Reconcile (TK 9.4.4/9.4.7). Eine frisch kopierte und
      // gerade uebernommene Datei ist per Konstruktion da.
      zustand: 'ok',
    };

    // ---------------------------------------------------------------------------------
    // Schritt 9: ZULETZT nach D1 - unter dem einen Schreib-Lock, mit Sofort-Flush. Beides steckt
    // vollstaendig in #72; hier wird kein Lock genommen und kein Flush angestossen.
    const eingetragen = await fuegeAssetHinzu(projektId, asset);
    if (!eingetragen.ok) {
      // KEIN Aufraeumen. "Crash nach 3 vor 4 -> eine fertige Waise ohne D1-Eintrag. Beides raeumt
      // der Reconcile (9.4.7) auf." (TK 9.4.5) Die Waise hier zu loeschen waere falsch: Der
      // D1-Schreibfehler kann ein voller Datentraeger sein, und dann haette der Nutzer eine
      // erfolgreich kopierte Datei verloren, die beim naechsten Versuch nur noch einmal kopiert
      // werden muesste.
      return uebernimmStoreFehler(eingetragen.fehler);
    }

    // ---------------------------------------------------------------------------------
    // Erst jetzt Erfolg: Bytes UND Datensatz stehen dauerhaft.
    //
    // Zurueck geht GENAU DAS OBJEKT, das an #72 uebergeben wurde - nicht `null`, kein Teilobjekt,
    // keine Ersatzform wie { assetId }: "Auftrags-Ergebnis bei Erfolg: der fertige Asset (9.4.4)"
    // (TK 9.4.3). Der auftrags-manager legt es unveraendert nach `Auftrag.ergebnis` (TK 9.3.1);
    // ohne das "erfuehre die Oberflaeche nie, was ein Auftrag hervorgebracht hat". Genommen wird
    // `asset` und nicht `eingetragen.wert`: Beide sind dasselbe Objekt (#72 gibt das uebernommene
    // zurueck), aber nur bei `asset` haengt das an KEINER fremden Zusage.
    return { status: 'erfolg', ergebnis: asset };
  } catch (ursache) {
    // Aufraeumen auch hier - aber nur im eigenen Zustaendigkeitsfenster: nach erfolgreicher Kopie
    // und vor der Uebernahme. Nach der Uebernahme gibt es keine .part-Datei mehr, sondern eine
    // fertige Waise, und die bleibt ausdruecklich liegen.
    if (partPfad !== null && !uebernommen) {
      await raeumeAuf(partPfad);
    }
    // "Eine rohe Exception-Meldung wird nie zum Code." (TK 9.1.1, Punkt 3) Der Text reist als
    // Begruendung mit, der Stacktrace NICHT - der ueberlebt die IPC-Grenze ohnehin nur als Rauschen.
    return fehlgeschlagen(
      'unbekannter_fehler',
      `Der Import ist unerwartet fehlgeschlagen. Grund: ${textVon(ursache)}`,
    );
  }
}
// - Reihenfolge verbindlich: pruefeFormat -> erzeugeId -> medienOrdner/loeseAssetPfad ->
//   kopiereInsStaging -> leseRohMetadaten -> werteMetadatenAus -> macheEndgueltig -> fuegeAssetHinzu
// - .part-Datei wegraeumen ab erfolgreicher Kopie bis EINSCHLIESSLICH gescheitertem Rename
// - nach dem Rename wird NICHTS mehr weggeraeumt (fertige Waise fuer den Reconcile)
// - liefert NIE { status: 'abgebrochen' } (Abbrechen gibt es laut FA-18 nur fuer `render`)

/**
 * Rechnet den Kopier-Anteil (0..1, nur die Kopie) auf den Gesamtfortschritt in Prozent um.
 *
 * `Number.isFinite` und die Begrenzung sind nicht Zierrat: Der Wert kommt aus einer fremden
 * Funktion, und `Auftrag.fortschritt` sagt nach aussen "0-100 oder null" zu (TK 9.3.1). Ein NaN
 * rutschte durch jeden Groessenvergleich hindurch und stuende danach in Q3 und im JSON-Kanal als
 * Wert, den `number` zwar zulaesst, `JSON.stringify` aber zu `null` verwandelt - dieselbe
 * Entscheidung wie in der render-verzahnung (#68): gewaehlt wird der Wert, den der Vertrag selbst
 * fuer "unbestimmt" vorsieht.
 *
 * Gerundet auf ganze Prozent, weil der Wert bis in die Oberflaeche und ins Protokoll reist; #84
 * meldet ohnehin nur bei einem Wechsel der ganzen Kopier-Prozentstufe.
 */
function aufGesamtfortschritt(anteil: number): number | null {
  if (!Number.isFinite(anteil)) return null;
  if (anteil <= 0) return 0;
  if (anteil >= 1) return ANTEIL_KOPIE_PROZENT;
  return Math.round(anteil * ANTEIL_KOPIE_PROZENT);
}

/**
 * Entfernt die eigene .part-Datei - und laesst den gemeldeten Fehler dabei UNANGETASTET.
 *
 * "Das Aufraeumen darf den gemeldeten Fehler NICHT veraendern. Gelingt es nicht, bleibt eine
 * .part-Leiche liegen (Reconcile), und gemeldet wird trotzdem der URSPRUENGLICHE Fehlercode -
 * niemals `datei_fehler`. Der Nutzer soll erfahren, warum sein Import scheiterte, nicht warum eine
 * Zwischendatei nicht wegging." Deshalb wird das Ergebnis bewusst verworfen und selbst eine
 * geworfene Ausnahme geschluckt.
 *
 * Warum #86 und kein direktes `fs.unlink`: Unter Windows haengt der Handle des gerade beendeten
 * ffprobe gelegentlich Millisekunden nach (EBUSY/EPERM) - genau die Falle, fuer die #86 den Retry
 * mitbringt. Eine zweite Loeschroutine im selben Modul waere die Doppelung, die #86 verhindert.
 */
async function raeumeAuf(partPfad: string): Promise<void> {
  try {
    await entferneDatei(partPfad);
  } catch {
    // Bewusst still: Diese Funktion hat keinen Ausgang, ueber den sie etwas melden koennte, ohne
    // den echten Fehler zu ueberschreiben. Was liegenbleibt, findet der Reconcile (#88).
  }
}

/**
 * Der Fehler, den `fuegeAssetHinzu` (#72) liefern kann - ABGELEITET statt abgeschrieben.
 *
 * Das ist die Naht-Sicherung dieser Datei: Waechst die Fehlercode-Union des `project-store`, faellt
 * die Zuordnung unten NICHT lautlos auf `unbekannter_fehler` zurueck, sondern bricht hier im
 * Typecheck. Genau dieser Fall ist am 13.08.2026 mit `kein_projekt` eingetreten - eine abgetippte
 * Union haette ihn verschluckt.
 */
type StoreFehler = Extract<Awaited<ReturnType<typeof fuegeAssetHinzu>>, { ok: false }>['fehler'];

/**
 * Uebernimmt den Fehler des `project-store` in den Vorrat dieser Funktion - UNVERAENDERT.
 *
 * `speicher_fehler` (Sofort-Flush gescheitert), `kein_projekt` (es ist ueberhaupt keins geoeffnet)
 * und `nicht_gefunden` (die `projektId` ist nicht die des geoeffneten) werden NICHT umgedeutet.
 * Der Fall ist nicht theoretisch: Der Auftrag wird beim Einreihen eingefroren (TK 9.3.5) und kann
 * laufen, nachdem der Nutzer das Projekt gewechselt oder geschlossen hat - und der gefuehrte
 * Reparatur-Modus (FA-19) muss auf dem CODE verzweigen koennen, nicht auf dem Meldungstext.
 *
 * `ungueltige_eingabe` reicht ebenfalls durch, bekommt aber einen anderen Text: Doppelte `id` und
 * `dateiname` mit Verzeichnisanteil kann es hier nur geben, wenn DIESE Funktion falsch baut (die ID
 * stammt aus einem einzigen erzeugeId(), den Dateinamen setzt Schritt 3 zusammen). Das dem Nutzer
 * als Dateiproblem zu erklaeren, schickte ihn auf die falsche Suche.
 *
 * Umgedeutet wird allein `projekt_beschaeftigt`, und der ist aus `fuegeAssetHinzu` gar nicht
 * erreichbar; der Zweig steht als Schranke fuer den Tag, an dem #72 seine Codes erweitert.
 */
function uebernimmStoreFehler(fehler: StoreFehler): HandlerErgebnis<ImportFehlercode> {
  if (fehler.code === 'projekt_beschaeftigt') {
    return fehlgeschlagen(
      'unbekannter_fehler',
      `Das Medium wurde kopiert, konnte aber nicht in das Projekt eingetragen werden; der ` +
        `Projektspeicher meldete "${fehler.code}". Grund: ${fehler.meldung}`,
    );
  }
  if (fehler.code === 'ungueltige_eingabe') {
    return fehlgeschlagen(
      'ungueltige_eingabe',
      `Das Medium wurde kopiert, der Eintrag wurde aber abgewiesen. Das ist ein Programmierfehler ` +
        `im Import, kein Problem der gewaehlten Datei. Grund: ${fehler.meldung}`,
      fehler.daten,
    );
  }
  // Hier bleibt `speicher_fehler | kein_projekt | nicht_gefunden | unbekannter_fehler` - jeder
  // davon passt in `ImportFehlercode | GenerischerFehlercode` und reist UNVERAENDERT weiter.
  return fehlgeschlagen(fehler.code, fehler.meldung, fehler.daten);
}

/**
 * Die Fehlerhuelle. `daten` reist nur mit, wenn der gerufene Baustein welche geliefert hat - ein
 * immer gesetztes, leeres Feld boete dem Aufrufer etwas zum Auswerten an, das nie etwas enthaelt
 * (TK 9.1.1: das Feld ist optional).
 */
function fehlgeschlagen(
  code: ImportFehlercode | GenerischerFehlercode,
  meldung: string,
  daten?: unknown,
): HandlerErgebnis<ImportFehlercode> {
  if (daten === undefined) {
    return { status: 'fehlgeschlagen', fehler: { code, meldung } };
  }
  return { status: 'fehlgeschlagen', fehler: { code, meldung, daten } };
}

/** Der Text einer Ausnahme, ohne Stacktrace - der reist nicht ueber die Grenze (TK 9.1.1, Punkt 8). */
function textVon(ursache: unknown): string {
  return ursache instanceof Error ? ursache.message : String(ursache);
}

// NICHT HIER, UND GEMELDET:
//
// 1. DER STOPP-PUNKT "Fortschritt" IST BEANTWORTET, nicht geraten. Das Issue schreibt: "Ob der
//    Import in v1 gar keinen Fortschritt meldet oder grobe Marken zwischen den Schritten setzt, ist
//    Verhalten der Oberflaeche - nicht raten. Ohne Antwort: kein Aufruf von meldeFortschritt." Die
//    Antwort liegt seit dem 13.08.2026 vor (Entscheidung des Users, umgesetzt in #84: vierter,
//    optionaler Parameter `meldeFortschritt`), und der dort gemeldete Anteil hat AUSSER dieser
//    Datei keinen Weg zur Oberflaeche. Umgesetzt ist die schwaechere der beiden im Issue genannten
//    Formen: nur der eine messbare Schritt meldet, es werden keine Marken erfunden.
//
// 2. DER ISSUE-TEXT IST AN DREI STELLEN UEBERHOLT (gemeldet, nicht eigenmaechtig als Vertrag
//    behandelt - die Signaturen stammen alle aus den GEBAUTEN Dateien):
//    (a) `kopiereInsStaging` hat einen vierten, optionalen Parameter (s. Punkt 1).
//    (b) `ImportFehlercode` (#79) traegt seit dem 13.08.2026 zusaetzlich `kein_projekt`; das Issue
//        zaehlt fuenf Codes auf, es sind sechs. Am Verhalten aendert das nichts - der Code wird
//        unveraendert durchgereicht, er passt jetzt nur ohne Umweg in den Rueckgabetyp.
//    (c) `ProjectStoreFehlercode` ist `speicher_fehler | projekt_beschaeftigt | kein_projekt`, das
//        Issue nennt nur `speicher_fehler`. `projekt_beschaeftigt` ist aus `fuegeAssetHinzu` nicht
//        erreichbar und wird deshalb nur als Typ-Schranke behandelt (s. `uebernimmStoreFehler`).
//
// 3. KEIN AUFRAEUMEN DER FERTIGEN WAISE und kein Wiederholversuch fuer den D1-Schreibvorgang -
//    beides verbietet der STOPP-Block ausdruecklich. Wiederholen ist eine Nutzeraktion (FA-17),
//    gesteuert vom auftrags-manager.
//
// 4. KEIN SCHUTZ UM `kontext.meldeFortschritt`. Eine Ausnahme daraus faengt #60 bereits ab
//    (`geschuetzterKontext`); ein zweiter Fang hier waere der zweite Mechanismus fuer dieselbe
//    Zusage. Beim direkten Aufruf ohne Dispatcher (nur im Test) liefe sie in den Fangzweig von #84
//    und ergaebe `kopier_fehler` - kein Datenverlust, nur eine irrefuehrende Meldung.
