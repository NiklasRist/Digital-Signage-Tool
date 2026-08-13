// GENERIERT aus dem Signaturblock von Issue #67.
// [auftrags-manager] Beim Öffnen eines Projekts Q2 laden
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
// GERUEST-PRUEFSUMME: 38fc74d115a86a46
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
// der Parameter wird jetzt benutzt. Der Absatz darueber bleibt als Beleg stehen.

import { ladeQ2 } from './q2-wiederholung';

import type { Ergebnis } from '../../shared/contracts/ergebnis';
import type { QueueFehlercode } from './schreibe-queue-json'; // #69

// Fremder Aufruf - vollstaendige Signatur, damit hier nichts geraten wird:
//   #55: ladeQ2(projektId: string): Promise<Ergebnis<Q2Datei, QueueFehlercode>>
//        laedt projects/<id>/queue-retry.json, legt den Stand modul-intern ab und gibt
//        ihn als Kopie heraus; eine fehlende Datei ergibt dort eine leere, gueltige Q2.
//   #55: holeQ2Stand(): { projektId, datei } | null   - die Lese-Operation, ueber die
//        #64 (holeStand) den hier geladenen Stand sieht. Nicht von hier gerufen.
//
// DIESE DATEI BILDET KEINEN PFAD. Sie kennt den Ordner `projects/<id>/` nicht und
// nennt den Dateinamen `queue-retry.json` nirgends - beides gehoert #55 (Invariante
// "Kein eigener Dateizugriff"). Deshalb steht hier auch kein `node:fs` und kein
// `node:path`; ein Import davon waere der erste Schritt zu einem zweiten Leser.

/**
 * Beide Pfadtrenner, unabhaengig von der laufenden Plattform - dieselbe Ueberlegung wie in
 * `pfade.ts` (#49): Auf macOS ist der Rueckwaerts-Schraegstrich ein gewoehnliches Zeichen und
 * kaeme durch, waere hier nur `/` gesperrt. Die Projektordner wandern per USB zwischen beiden
 * Systemen.
 */
const PFADTRENNER = ['/', '\\'];

export async function stelleBeiProjektOeffnungHer(
  projektId: string,
): Promise<Ergebnis<void, QueueFehlercode>> {
  if (!istBrauchbareProjektId(projektId)) {
    // OHNE JEDE WIRKUNG (Fehlertabelle): Der Abbruch steht VOR dem einzigen Aufruf, der
    // etwas bewegen koennte. Nichts wird geleert, nichts geladen, und ein bereits
    // gehaltener Q2-Stand bleibt genau der, der er war. Waere die Pruefung erst nach
    // `ladeQ2` gelaufen, haette eine unbrauchbare ID den Stand des offenen Projekts
    // ueberschrieben, bevor sie beanstandet wird.
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        // Der beanstandete Wert steht ABSICHTLICH nicht in der Meldung - sie reist ueber
        // IPC bis in die Oberflaeche (gleiche Ueberlegung wie in #49).
        meldung: 'Die Projekt-ID ist leer oder als Pfadsegment nicht verwendbar.',
      },
    };
  }

  try {
    // DER GANZE VORGANG: Q2 laden. Mehr ist beim Oeffnen eines Projekts ausdruecklich
    // nicht zu tun.
    //
    // Q1 WIRD NICHT ANGEFASST - weder gefuellt noch geleert. Nicht gefuellt, weil "die
    // aktive Queue wird also *nicht* persistiert" (TK 9.3.5) und Wiederholen eine
    // ausdrueckliche Nutzeraktion ist (FA-17); ein aus Q2 nachgeholter Auftrag wuerde
    // ohne Zutun des Nutzers losrennen. Nicht geleert, weil in Q1 Auftraege eines
    // ANDEREN, vorher geoeffneten Projekts liegen koennen - was mit denen beim
    // Projektwechsel geschieht, ist der offene STOPP-Punkt des Issues und hier nicht zu
    // entscheiden. Ein `leere Q1` an dieser Stelle waere genau diese Entscheidung,
    // heimlich getroffen.
    //
    // Und deshalb wird hier auch NICHTS GESTARTET: kein `starteNaechsten` (#59), kein
    // `reiheEin` (#61). Das Oeffnen eines Projekts ist kein Auftrag.
    //
    // Die pendingDeletions aus Q2 kommen mit und bleiben liegen: "Sie werden in Q2 nur
    // verwahrt; nachgeholt werden sie vom Reconcile des media-service" (TK 9.3). Kein
    // `unlink`, kein `loeschen`-Auftrag - ein solcher scheiterte deterministisch mit
    // `asset_nicht_gefunden`, weil der D1-Eintrag beim Loeschen zuerst verschwindet.
    const geladen = await ladeQ2(projektId);
    if (!geladen.ok) {
      // UNVERAENDERT DURCHGEREICHT - Code und Meldung stammen aus #55 bzw. #69. Kein
      // eigener Code, keine eigene Meldung, kein Umverpacken: Eine volle Platte oder eine
      // beschaedigte Wiederholungsdatei muss am Panel als das ankommen, was sie ist.
      // Insbesondere wird hier NICHT auf eine leere Q2 zurueckgefallen - das saehe aus wie
      // "keine Fehlschlaege" und waere ein unsichtbarer Verlust (FA-17).
      return geladen;
    }

    // Der geladene Stand wird ABSICHTLICH nicht mitgegeben: Er liegt in Q2 und wird von
    // dort ueber `holeStand` (#64) sichtbar. Zwei Wege zum selben Stand waeren zwei
    // Wahrheiten (Signaturblock des Issues).
    return { ok: true, wert: undefined };
  } catch (ursache) {
    // "Niemals `throw` ueber die IPC-Grenze" (TK 9.1.1). #55 faengt seine eigenen
    // Ausnahmen bereits ab; diese Schranke gilt dem Fall, dass sie es eines Tages nicht
    // mehr tut. `unbekannter_fehler` ist einer der drei generischen Codes aus #12, hier
    // entsteht also kein neuer.
    return {
      ok: false,
      fehler: {
        code: 'unbekannter_fehler',
        meldung: `Das Laden der Wiederholungsdaten ist abgebrochen: ${text(ursache)}`,
      },
    };
  }
}

/**
 * Die Pruefung aus der Fehlertabelle des Issues - genau ihr Wortlaut und keine Zeile mehr:
 * "leer, kein String, enthaelt Pfadtrenner oder `..`".
 *
 * Bewusst NICHT die vollstaendige Segmentpruefung aus #49 (Doppelpunkt, Steuerzeichen,
 * reservierte Windows-Namen): Die ist dort absichtlich nicht exportiert, damit keine zweite
 * Stelle entsteht, die "ist dieser Name in Ordnung?" beantwortet - sie hier nachzubauen
 * waere genau diese zweite Stelle, und sie liefe der ersten beim naechsten Zusatz davon.
 *
 * `unknown` als Parametertyp, obwohl die Signatur `string` verspricht: Der Aufrufer sitzt
 * hinter der IPC-Grenze bzw. liest aus einer Datei, und die Fehlertabelle nennt "kein
 * String" ausdruecklich als eigenen Fall. Ein `typeof`-Test auf einen als `string`
 * deklarierten Wert waere sonst toter Code.
 */
function istBrauchbareProjektId(wert: unknown): wert is string {
  if (typeof wert !== 'string' || wert.length === 0) {
    return false;
  }
  if (PFADTRENNER.some((trenner) => wert.includes(trenner))) {
    return false;
  }
  // Als Teilzeichenkette, nicht nur als vollstaendiges Segment: Eine projektId ist eine
  // UUID (TK 9.11.3), dort kommt `..` nie vor - die strengere Lesart kann nicht irren.
  return !wert.includes('..');
}

function text(ursache: unknown): string {
  return ursache instanceof Error ? ursache.message : String(ursache);
}

// NICHT HIER, UND GEMELDET:
//
// 1. ERLEDIGT am 13.08.2026, hier als Warnung stehen gelassen. Der verbindliche
//    Rueckgabetyp lautete `Ergebnis<void>` und konnte den durchzureichenden
//    `speicher_fehler` aus #55/#69 typseitig NICHT tragen, waehrend DoD-Punkt 4 das
//    Durchreichen ausdruecklich verlangt ("jeder Fehler aus dem Q2-Laden wird
//    unveraendert durchgereicht"). Der Signaturblock widersprach also der eigenen
//    Fehlertabelle. Behoben wurde das IM ISSUE (#67 traegt jetzt den zweiten
//    Typparameter), nicht hier - deshalb ist der Notbehelf im Fehlerzweig entfallen.
//    Wer diese Datei erneut anfasst: NICHT auf `Ergebnis<void>` zurueckdrehen.
//
// 2. NOCH KEIN AUFRUFER - aber das ist GEPLANT und KEINE Luecke. Nachgeprueft am
//    13.08.2026 ueber alle 329 Issues: Der Aufrufer ist #94 (M3, ipc-gateway), das den
//    Oeffnen-Ablauf koordiniert und diese Funktion dort als SCHRITT 2 fuehrt - nach
//    oeffneProjekt (#34), vor reconcile (#91). In M7 rufen sie ausserdem #224
//    (Projekt oeffnen) und #196 (Sitzung wiederherstellen); #76 verweist darauf.
//    Richtig ist also nur: Solange #94 nicht gebaut ist, ist Q2 beim Oeffnen NICHT
//    geladen, und `holeStand` (#64) zeigte bis zum ersten `merkeFehlschlag` eine leere
//    Fehlschlag-Liste. Das loest sich mit #94 von selbst.
//    NICHT hier einen eigenen Aufruf nachruesten - #34 darf den auftrags-manager nicht
//    kennen, die Reihenfolge gehoert in den Koordinator.
//
// 3. PROJEKTWECHSEL - am 13.08.2026 vom User ENTSCHIEDEN, Frage 3 des STOPP-Blocks ist
//    damit beantwortet. Die Sachlage bleibt wie beschrieben: `ladeQ2` ERSETZT den
//    gehaltenen Stand (#55 haelt genau EINEN, samt projektId), waehrend Q1 app-weit ist
//    und Auftraege des vorigen Projekts weiterfuehren kann. `holeStand` (#64) zeigt also
//    laufende/anstehende Auftraege ALLER Projekte neben den Fehlschlaegen NUR des zuletzt
//    geladenen. Das bleibt so und wird NICHT gefiltert: Der Torwaechter ist app-weit und
//    seriell - ein laufender Render von A blockiert B wirklich, und ein ausgeblendeter
//    Auftrag liesse die Leiste "nichts laeuft" melden, waehrend B aus unsichtbarem Grund
//    wartet. Das `queue-panel` (M7) nennt dafuer je Eintrag das Projekt.
//    NICHT verwechseln mit einem Schreibproblem: Ein Fehlschlag von A kann NICHT in der
//    queue-retry.json von B landen - alle Q2-Schreibfunktionen nehmen die projektId
//    entgegen, und `sicherGeladen` (#55) laedt nach, sobald der gehaltene Stand zu einem
//    anderen Projekt gehoert. Am 13.08.2026 im gebauten Code nachgeprueft.
