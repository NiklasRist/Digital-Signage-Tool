// GENERIERT aus dem Signaturblock von Issue #90.
// [media-service] Aufräumen: offene Löschungen nachholen
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
// GERUEST-PRUEFSUMME: cead67b5c2f7c5ba
//
// ERLEDIGT (13.08.2026): Die Abschaltzeile fuer no-unused-vars ist mit dem Fuellen
// des Rumpfes entfernt; alle Importe und der Parameter werden jetzt benutzt.

import { holePendingDeletions, streichePendingDeletion } from '../auftrags-manager/pending-deletions'
import { loeseAssetPfad } from '../project-store/pfade'

import { entferneDatei } from './datei-entfernen'

import type { Ergebnis, GenerischerFehlercode } from '../../shared/contracts/ergebnis'
import type { ReconcileFehlercode } from './fehlercodes'

// Fremde Aufrufe - vollstaendige Signaturen, damit hier nichts geraten wird:
//   #66:  holePendingDeletions(projektId: string)
//           : Promise<Ergebnis<PendingDeletion[], QueueFehlercode>>
//         // leere Liste ist ein gueltiges Ergebnis; eine fehlende queue-retry.json ist KEIN
//         // Fehler. `PendingDeletion = { dateiname: string; vermerktAm: string }` (#55) -
//         // `dateiname` ist `<uuid>.<ext>` OHNE Verzeichnisanteil (TK 9.4.8 Punkt 1).
//   #66:  streichePendingDeletion(projektId: string, dateiname: string)
//           : Promise<Ergebnis<void, QueueFehlercode>>
//         // IDEMPOTENT: ist der dateiname nicht vorgemerkt, lautet das Ergebnis
//         // { ok: true, wert: undefined } - NICHT nicht_gefunden.
//   #49:  loeseAssetPfad(projektId: string, dateiname: string): Ergebnis<string>
//         // absoluter Pfad zur Datei im Medienordner; liefert NUR einen Pfad, wenn dieser nach
//         // Normalisierung nachweislich innerhalb von medienOrdner(projektId) liegt, sonst
//         // `ungueltige_eingabe`; reine String-/Pfad-Operation, KEINE Existenzpruefung.
//   #86:  entferneDatei(pfad: string): Promise<Ergebnis<void, 'datei_fehler'>>
//         // EIN Parameter: der fertig aufgeloeste absolute Pfad. Windows-Retry mit Backoff bei
//         // EBUSY/EPERM steckt DORT; eine bereits fehlende Datei (ENOENT) gilt als ERFOLG.
//
// DIESE DATEI FUEHRT AUS, SIE VERWAHRT NICHT: "`pendingDeletions` sind ausdruecklich KEINE
// Auftraege: Sie werden in Q2 nur verwahrt; nachgeholt werden sie vom Reconcile des
// `media-service` beim Oeffnen des Projekts (9.4.7)" (TK 9.3, Punkt 3). Deshalb kein `reiheEin`,
// kein `Auftrag`-Objekt - ein erneut eingereihter `loeschen`-Auftrag scheiterte DETERMINISTISCH
// mit `asset_nicht_gefunden`, weil sein erster Schritt (D1-Eintrag entfernen) beim Loeschen
// bereits erledigt wurde.
//
// UMGEKEHRT: `queue-retry.json` gehoert der Auftragsverwaltung - "sie allein schreibt sie"
// (TK 9.3). Kein `fs`-Zugriff auf diese Datei, kein eigener Parser, kein selbst gebauter Pfad.
// Auch der Medienpfad entsteht nicht hier: "Auch die Pfadaufloesung ... kommt vom
// `project-store` (Pfad-Autoritaet, 9.5.7)" (TK 9.4.1). Und kein zweites Lock (TK 9.4.8 Punkt 9).

/**
 * Zeichen, die aus der `projektId` einen Pfad statt eines Segments machen wuerden.
 *
 * Beide Trenner, unabhaengig vom Betriebssystem - dieselbe Ueberlegung wie in `pfade.ts` (#49)
 * und `reconcile-fehlt.ts` (#89): Ein unter Windows geschriebener Wert wandert per USB-Stick auf
 * einen Mac, und eine Pruefung, die nur den heimischen Trenner kennt, laesst ihn genau dort durch.
 */
const PFAD_TRENNER = ['/', '\\']

export async function holeLoeschungenNach(
  projektId: string,
): Promise<Ergebnis<{ erledigt: number; offen: number }, ReconcileFehlercode>> {
  // EIN Fangnetz um den ganzen Lauf. Der Reconcile laeuft beim Oeffnen des Projekts; eine
  // durchgereichte Ausnahme wuerde dort das Oeffnen abbrechen, statt einen Befund zu melden -
  // "Kein `throw` nach aussen" (TK 9.1.1, Punkt 2). Es liegt AUSSERHALB der Schleife, weil ein
  // Fehlschlag INNERHALB der Schleife kein Fehler dieser Operation ist, sondern `offen` +1.
  try {
    // `typeof` trotz `string` in der Signatur: "Der Main validiert jede eingehende Nutzlast"
    // (TK 9.1.1, Punkt 6). Geprueft wird VOR dem ersten fremden Aufruf - eine unbrauchbare
    // Projekt-ID darf weder Q2 lesen noch eine Datei anfassen.
    if (
      typeof projektId !== 'string' ||
      projektId.trim() === '' ||
      PFAD_TRENNER.some((zeichen) => projektId.includes(zeichen)) ||
      projektId.includes('..')
    ) {
      return fehler('ungueltige_eingabe', 'Es wurde keine brauchbare Projekt-ID uebergeben.')
    }

    const vorgemerkt = await holePendingDeletions(projektId)
    if (!vorgemerkt.ok) {
      // ABBRUCH VOR DEM ERSTEN LOESCHVERSUCH, und der Code reist UNVERAENDERT weiter (kein
      // Umbiegen auf `unbekannter_fehler`, kein Verschieben in die `meldung`): "Geht der Code
      // verloren, degradieren Reparatur-Modus, Wiederholen und der FAT32-Hinweis alle zu
      // 'irgendwas ist schiefgelaufen'" (TK 9.1.1).
      //
      // KEIN Rueckfall auf eine leere Liste: Ohne die Liste ist unbekannt, WAS aufzuraeumen
      // waere. `{ erledigt: 0, offen: 0 }` zu melden hiesse "es gibt nichts" - waehrend in der
      // Datei womoeglich zehn Eintraege stehen und der belegte Platz nie wieder frei wird.
      return fehler(vorgemerkt.fehler.code, vorgemerkt.fehler.meldung)
    }

    let erledigt = 0
    let offen = 0

    // GENAU EIN VERSUCH JE EINTRAG UND LAUF. Keine eigene Wiederholschleife, kein Warten, kein
    // zweiter Durchgang am Ende: Das Retry-mit-Backoff fuer den Einzelfall steckt in
    // `entferneDatei` (#86), und der naechste Versuch findet beim naechsten Projektoeffnen statt
    // ("kein periodisches Aufraeumen im laufenden Betrieb", TK 9.4.8 Punkt 8).
    //
    // SEQUENTIELL, absichtlich - kein Promise.all: `streichePendingDeletion` schreibt dieselbe
    // Datei, und parallel gestartete Aufrufe stuenden bei der Serialisierung von #55 ohnehin nur
    // Schlange. Ausserdem wartet jeder Fehlschlag in #86 bis zu 1,5 s; parallel liefen die
    // Wartezeiten ineinander und die Platte bekaeme n gleichzeitige `unlink`.
    for (const eintrag of vorgemerkt.wert) {
      // Schritt 1: aus dem Dateinamen wird der absolute Pfad - ausschliesslich hier und
      // ausschliesslich so. Ein Vermerk traegt "bewusst nicht der absolute Pfad" (TK 9.4.6,
      // Schritt 3), weil die App portabel ist und ein gespeicherter OS-Pfad ungueltig wird,
      // sobald der Ordner umzieht.
      const pfad = loeseAssetPfad(projektId, eintrag.dateiname)
      if (!pfad.ok) {
        // Der Eintrag BLEIBT stehen und zaehlt als `offen`; `entferneDatei` wird fuer ihn NICHT
        // gerufen. Ihn zu streichen hiesse zu behaupten, die Datei sei entfernt worden - obwohl
        // niemand weiss, welche Datei gemeint war. Das kann nur bei einem `dateiname` passieren,
        // der die Form aus TK 9.4.8 Punkt 1 verletzt, also bei einer beschaedigten oder von
        // aussen veraenderten queue-retry.json. KEIN Reparaturversuch am Namen (kein
        // `path.basename`, kein Abschneiden von Verzeichnisanteilen).
        offen += 1
        continue
      }

      // Schritt 2: ein Versuch, samt des in #86 eingebauten Windows-Retrys.
      const entfernt = await entferneDatei(pfad.wert)
      if (!entfernt.ok) {
        // KEIN Abbruch des Laufs: Es geht um Speicherplatz, nicht um Konsistenz. Eine einzelne
        // gesperrte Datei darf nicht dazu fuehren, dass die uebrigen offenen Loeschungen erneut
        // liegen bleiben - und schon gar nicht, dass der Aufraeum-Ablauf (#91) und damit das
        // Oeffnen des Projekts (#94) mit einem Fehler enden.
        //
        // UND KEIN STREICHEN: Der Vermerk ist die einzige Spur der liegengebliebenen Datei.
        // Verwerfen (nach Alter, Anzahl oder Versuchszahl) ist ausgeschlossen - "Ein Eintrag
        // verschwindet ausschliesslich, wenn die Loeschung gelingt" (#66).
        offen += 1
        continue
      }

      // Schritt 3, NUR bei Erfolg von Schritt 2: gestrichen wird mit dem `dateiname`, nie mit
      // dem Pfad. Das gilt auch, wenn die Datei schon vorher weg war - #86 meldet ENOENT als
      // Erfolg, und genau darauf beruht dieser Ablauf: Ein Vermerk, dessen Datei inzwischen auf
      // anderem Weg verschwunden ist, muss gestrichen werden, sonst bliebe er ewig stehen.
      const gestrichen = await streichePendingDeletion(projektId, eintrag.dateiname)
      if (!gestrichen.ok) {
        // Die Datei ist weg, der Vermerk steht noch - und `offen` beschreibt genau das: den
        // BESTAND DANACH, nicht die Zahl der Versuche. Ein Zaehlen als `erledigt` wuerde
        // behaupten, der Vermerk sei verschwunden. Beim naechsten Projektoeffnen findet #86
        // keine Datei mehr, meldet Erfolg, und das Streichen wird wiederholt.
        offen += 1
        continue
      }

      erledigt += 1
    }

    return { ok: true, wert: { erledigt, offen } }
  } catch (ursache) {
    // "Eine rohe Exception-Meldung wird nie zum Code" (TK 9.1.1, Punkt 3) - der Code ist
    // `unbekannter_fehler`, der Text der Ausnahme reist nur als Begruendung mit.
    return fehler(
      'unbekannter_fehler',
      `Das Nachholen offener Loeschungen ist unerwartet gescheitert. Grund: ${textVon(ursache)}`,
    )
  }
}
// - liest Q2 und streicht darin AUSSCHLIESSLICH ueber #66; queue-retry.json wird nie selbst
//   angefasst
// - loescht in D2 ausschliesslich ueber entferneDatei (#86); kein eigenes fs.unlink
// - Pfade kommen ausschliesslich aus loeseAssetPfad (#49); kein eigenes path.join
// - KEIN D1-Zugriff, KEIN D1-Lock, kein eigenes Lock
// - `erledigt` + `offen` = Zahl der Eintraege zu Beginn des Laufs; `offen` ist der Bestand danach

/**
 * Die Fehlerhuelle. Ohne `daten`: "Das Feld ist optional - Codes ohne Zusatzdaten lassen es weg"
 * (TK 9.1.1), und kein Code dieser Datei traegt Zusatzdaten.
 *
 * Der Parametertyp nimmt die Union der Q2-Aufrufe mit auf (`QueueFehlercode` = `speicher_fehler`,
 * #69, plus die generischen Codes) - genau deshalb passt der durchgereichte Code ohne
 * Uebersetzung hinein.
 */
function fehler(
  code: ReconcileFehlercode | GenerischerFehlercode,
  meldung: string,
): Ergebnis<{ erledigt: number; offen: number }, ReconcileFehlercode> {
  return { ok: false, fehler: { code, meldung } }
}

/** Der Text einer Ausnahme, ohne Stacktrace - der reist nicht ueber die Grenze. */
function textVon(ursache: unknown): string {
  return ursache instanceof Error ? ursache.message : String(ursache)
}

// NICHT HIER, UND GEMELDET:
//
// 1. KEINE PRUEFUNG, OB DIE DATEI NOCH ZU EINEM ASSET GEHOERT. Ein Vermerk entsteht erst,
//    NACHDEM der D1-Eintrag entfernt wurde (TK 9.4.6, Schritt 1 vor Schritt 3) - eine solche
//    Pruefung scheiterte bei JEDEM Eintrag und verhinderte das Aufraeumen dauerhaft. Das ist
//    dieselbe Denkfalle, aus der TK 9.3 die Regel "keine Auftraege" ableitet.
//
// 2. KEIN `existiert?`-VORABTEST. Dass eine bereits fehlende Datei Erfolg ist, steht in #86 und
//    gilt dort fuer alle Aufrufer; eine zweite Pruefung hier waere eine konkurrierende Wahrheit
//    ueber den Zustand der Datei. Verhielte sich #86 anders, waere das ein Widerspruch zwischen
//    zwei Issues - zu melden, nicht hier zu umgehen. GEPRUEFT am gebauten #86: Der ENOENT-Zweig
//    liefert { ok: true, wert: undefined }.
//
// 3. KEINE GRENZE UND KEIN VERWERFEN - weder Anzahl noch Alter noch Versuchszahl, auch nicht
//    hinter einer Konstante. Eine Datei, die sich dauerhaft nicht loeschen laesst, ist ein echtes
//    Problem und muss sichtbar bleiben (#66).
//
// 4. KEINE SCHLEIFE, KEIN TIMER, KEIN NACHFASSEN. Der naechste Versuch kommt beim naechsten
//    Projektoeffnen (TK 9.4.8, Punkt 8) - hier laeuft die Liste genau einmal durch.
//
// 5. `erledigt` UND `offen` ZAEHLEN EINTRAEGE, NICHT VERSUCHE. Ein Eintrag erhoeht genau einen
//    der beiden Zaehler; die Summe ist die Zahl der Eintraege zu Beginn des Laufs.
