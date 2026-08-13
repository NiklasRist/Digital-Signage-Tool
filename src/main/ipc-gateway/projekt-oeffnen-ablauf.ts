// GENERIERT aus dem Signaturblock von Issue #94.
// [ipc-gateway] Ablauf beim Öffnen eines Projekts koordinieren
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
// GERUEST-PRUEFSUMME: d1dfb7c317ee6998
//
// ERLEDIGT (13.08.2026): Die Abschaltzeile fuer no-unused-vars ist mit dem Fuellen
// des Rumpfes entfernt; alle Importe und der Parameter werden jetzt benutzt.
//
// DIESE DATEI IST DER EINZIGE ORT, AN DEM DAS OEFFNEN EIN VORGANG IST. Drei Module
// beschreiben je einen Teil davon (project-store laedt, auftrags-manager holt Q2,
// media-service raeumt auf), und keines von ihnen ruft die anderen - ohne diese
// Reihenfolge liefe der Aufraeumlauf NIE, und die Oberflaeche zeigte Medien, die es
// nicht mehr gibt. Sie hat deshalb bewusst KEINE eigene Fachlogik: kein Dateizugriff,
// keine Pfadbildung, kein Lock, kein IPC-Kanal, kein Fenster. Sie ruft drei Funktionen
// in einer Reihenfolge auf und reicht deren Fehler unveraendert weiter.

import { meldeQueueStoerung } from '../auftrags-manager/queue-ereignis'
import { stelleBeiProjektOeffnungHer } from '../auftrags-manager/start-wiederherstellung'
import { reconcile } from '../media-service/reconcile'
import { öffneProjekt } from '../project-store/oeffne-projekt'

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Project } from '../../shared/contracts/project'
import type { ProjectStoreFehlercode } from '../project-store/assets'
import type { ReconcileFehlercode } from '../media-service/fehlercodes'

// Fremde Aufrufe - vollstaendige Signaturen, GEPRUEFT AN DEN GEBAUTEN DATEIEN
// (nicht aus dem Issue abgeschrieben; an einer Stelle weichen sie ab, s. Vermerk 1):
//   #34: öffneProjekt(id: string): Promise<Ergebnis<Project, OeffneProjektFehlergrund>>
//        // OeffneProjektFehlergrund = ProjectStoreFehlercode | 'schema_zu_neu'
//        // laedt project.json (mit .bak-Rueckfall und Migration) in den Speicher, nimmt das
//        // EINE D1-Lock selbst und setzt das aktive Projekt ueber den config-store.
//   #67: stelleBeiProjektOeffnungHer(projektId: string): Promise<Ergebnis<void, QueueFehlercode>>
//        // laedt projects/<id>/queue-retry.json nach Q2. QueueFehlercode = 'speicher_fehler'.
//        // Eine fehlende Datei ist KEIN Fehler; es wird nichts eingereiht und nichts gestartet.
//   #91: reconcile(projektId: string, assets: Asset[])
//          : Promise<Ergebnis<{ entfernt: number; markiert: number; erledigt: number;
//                               offen: number }, ReconcileFehlercode>>
//        // ReconcileFehlercode = 'speicher_fehler' | 'datei_fehler' | 'kein_projekt'

/**
 * Der Ausgang dieses Ablaufs - genau der verbindliche Rueckgabetyp, einmal benannt, damit die
 * Hilfsfunktionen unten ihn nicht dreimal abschreiben.
 *
 * Das ist KEIN eigener Fehlercode-Typ: Hier entsteht kein einziger neuer Code, beide Unionen
 * kommen aus den Dateien, in denen sie deklariert sind (#72 bzw. #79), und `ergebnis.ts` wird
 * nicht angefasst.
 */
type Ausgang = Ergebnis<
  Project,
  ProjectStoreFehlercode | ReconcileFehlercode | 'schema_zu_neu'
>

/** Die Fehlerseite von Schritt 1 - abgeleitet, nicht abgeschrieben (s. `ausSchritt1`). */
type Schritt1Fehler = Extract<Awaited<ReturnType<typeof öffneProjekt>>, { ok: false }>['fehler']

/**
 * Zeichen, die aus der `projektId` einen Pfad statt eines Segments machen wuerden.
 *
 * Beide Trenner, unabhaengig vom Betriebssystem - dieselbe Ueberlegung wie in allen drei
 * Schritten (#34, #67, #91): Ein unter Windows geschriebener Wert wandert per USB-Stick auf einen
 * Mac, und eine Pruefung, die nur den heimischen Trenner kennt, laesst ihn genau dort durch.
 */
const PFAD_TRENNER = ['/', '\\']

export async function oeffneProjektAblauf(
  projektId: string,
): Promise<Ergebnis<Project, ProjectStoreFehlercode | ReconcileFehlercode | 'schema_zu_neu'>> {
  // EIN Fangnetz um den ganzen Ablauf. Diese Funktion haengt am IPC-Kanal
  // `project:öffneProjekt` (die Verdrahtung dazu gehoert #76) - "Kein `throw` nach aussen"
  // (TK 9.1.1, Punkt 2), und "Eine rohe Exception-Meldung wird nie zum Code" (Punkt 3).
  try {
    // VOR DEM ERSTEN SCHRITT, nicht in ihm: "kein Schritt wird gestartet" (Fehlertabelle).
    // Alle drei pruefen die `projektId` zwar jeder fuer sich - aber Schritt 1 nimmt dabei
    // bereits das D1-Lock und flusht das bisher offene Projekt, bevor Schritt 2 denselben Wert
    // abweist. Das Ergebnis waere ein Fehler MIT Nebenwirkung.
    //
    // `typeof` trotz `string` in der Signatur: Der Wert kommt ueber IPC aus dem Renderer, und
    // "Der Main validiert jede eingehende Nutzlast" (TK 9.1.1, Punkt 6). Ohne den Test waere die
    // in der Fehlertabelle ausdruecklich genannte Lage "kein String" toter Code.
    if (
      typeof projektId !== 'string' ||
      projektId.trim() === '' ||
      PFAD_TRENNER.some((zeichen) => projektId.includes(zeichen)) ||
      projektId.includes('..')
    ) {
      return {
        ok: false,
        fehler: {
          code: 'ungueltige_eingabe',
          // Der beanstandete Wert steht ABSICHTLICH nicht in der Meldung - sie reist ueber IPC
          // bis in die Oberflaeche (gleiche Linie wie #49, #67).
          meldung: 'Die Projekt-ID ist leer oder als Ordnername nicht verwendbar; es wurde nichts geoeffnet.',
        },
      }
    }

    // ── SCHRITT 1: das Projekt laden (#34) ──────────────────────────────────────────────────
    // GENAU EINMAL - hier und nirgends sonst in diesem Ablauf. Kein zweites Laden nach dem
    // Aufraeumen, um die markierten Zustaende "frisch" zu holen: Das Projekt lebt zur Laufzeit im
    // Speicher (TK 9.5.1), und ein zweiter Ladevorgang ueberschriebe genau die noch nicht
    // gespeicherten Aenderungen, die Schritt 3 gerade gesetzt hat (das Speichern ist entprellt,
    // TK 9.5.4).
    const geladen = await öffneProjekt(projektId)
    if (!geladen.ok) {
      // SCHRITT 1 IST VORBEDINGUNG FUER 2 UND 3. Ohne geladenes Projekt gibt es keine
      // Asset-Liste, gegen die der Aufraeumlauf vergleichen koennte - er hielte JEDE Datei im
      // Medienordner fuer eine Waise und loeschte den gesamten Medienbestand. Das ist der
      // teuerste denkbare Fehler dieses Ablaufs; deshalb kehren wir hier um, statt "wenigstens
      // schon mal aufzuraeumen".
      return ausSchritt1(geladen.fehler)
    }

    // DIE EINE REFERENZ, an der alles Weitere haengt. `projektId` und `projekt.assets` stammen ab
    // hier nachweislich aus DERSELBEN Rueckgabe von #34, und dazwischen liegt kein
    // Projektwechsel - #91 hat diese Zusicherung ausdruecklich an dieses Issue adressiert:
    // `markiereFehlende` (#89) reicht ein `nicht_gefunden`/`kein_projekt` von `setzeAssetZustand`
    // (#74) unveraendert durch, und ein solcher Fehler BRICHT DEN GANZEN AUFRAEUMLAUF AB. Eine
    // anderswo beschaffte Liste legte den Lauf also still.
    const projekt = geladen.wert

    // ── SCHRITT 2: den Wiederholungsspeicher Q2 dieses Projekts laden (#67) ─────────────────
    // NACH Schritt 1 (ohne geoeffnetes Projekt gibt es kein Q2) und VOR Schritt 3: In Q2 liegen
    // die vorgemerkten Loeschungen, die Schritt 3 nachholt. "Sie werden in Q2 nur verwahrt;
    // nachgeholt werden sie vom Reconcile des media-service beim Oeffnen des Projekts (9.4.7)"
    // (TK 9.3) - Schritt 2 LAEDT sie, Schritt 3 FUEHRT sie aus. Diese Datei selbst fuehrt nichts
    // aus und reiht nichts ein.
    //
    // ABGEWARTET, nicht nebenher gestartet: kein Promise.all mit Schritt 3, "weil es schneller
    // geht" - Schritt 3 liest genau das, was Schritt 2 gerade laedt.
    const q2 = await stelleBeiProjektOeffnungHer(projektId)
    if (!q2.ok) {
      // OFFENER PUNKT DES ISSUES - und was davon HIER entschieden werden darf und was nicht:
      //
      // Frage 1 ("gilt das Projekt als offen?") ist durch die verbindliche Signatur und die DoD
      // bereits beantwortet, nicht von mir gewaehlt: Der Rueckgabetyp fuehrt eigens
      // `ReconcileFehlercode` (aus Schritt 3 allein erreichbar), und die DoD verlangt woertlich,
      // dass ein `speicher_fehler`/`datei_fehler` eines Schrittes "genau dieser Code" bleibt -
      // "kein unbekannter_fehler, kein as-Cast, keine Abbildung". Beides waere sinnlos, wenn ein
      // Fehlschlag in Schritt 2 oder 3 als `ok: true` herauskaeme. Also: `ok: false`, Code und
      // Meldung UNVERAENDERT durchgereicht. Kein stillschweigendes Verschlucken, kein "im Zweifel
      // Erfolg melden" - ein nicht geladenes Q2 heisst, dass die frueheren Fehlschlaege des
      // Nutzers unsichtbar sind, und FA-17 verspricht das Gegenteil.
      //
      // Frage 2 ("wird der Fehlschlag zurueckgenommen?") bleibt OFFEN und wird hier NICHT
      // beantwortet: Das Projekt IST an dieser Stelle geladen, steht im Speicher (#192) und im
      // config-store als aktives Projekt (#27). Es wieder zu entladen und den config-store
      // zurueckzudrehen waere eine Rueckabwicklung ueber zwei fremde Module - genau die
      // Fachlogik, die dieser Datei verboten ist ("Sie ruft drei Funktionen in einer
      // Reihenfolge auf"), und die Frage "wohin zurueck, wenn vorher ein anderes Projekt offen
      // war?" hat im Bestand keine Antwort. Es wird deshalb NICHTS zurueckgenommen. GEMELDET.
      return { ok: false, fehler: q2.fehler }
    }

    // ── SCHRITT 3: aufraeumen (#91) ─────────────────────────────────────────────────────────
    // ZULETZT UND VOR DER ANTWORT. "Beim Öffnen eines Projekts, bevor die UI Medien zeigt (kein
    // Render/keine Vorschau haelt dann Handles):" (TK 9.4.7) - daraus folgt beides: Der
    // Aufraeumlauf ist Teil des Oeffnens, nicht etwas, das danach nebenher passiert, und er darf
    // sich darauf verlassen, dass jetzt kein Handle auf eine Mediendatei offen ist. Eine Antwort
    // schon vor diesem Schritt braeche beide Zusagen: Die Oberflaeche zeigte Medien, und die
    // Vorschau hielte Handles, waehrend geloescht wird (unter Windows EBUSY).
    //
    // DIE LISTE KOMMT AUS SCHRITT 1 - unveraendert, ungefiltert, nicht umgebaut und nicht auf
    // einem zweiten Weg beschafft. Sie liegt nach Schritt 1 ohnehin hier; ein exportierter
    // Zugriff auf das geladene Projekt waere eine ZWEITE TUER in den project-store neben seinen
    // Operationen, und dem media-service ist das Lesen der Asset-Liste ausdruecklich verboten:
    // "media-service besitzt NICHT: das Lesen der Asset-Liste (das macht project-store)"
    // (TK 9.4.1).
    //
    // Dieser Ablauf ist die EINZIGE Stelle, die `reconcile` ruft: "Abweichungen ... bereinigt
    // ausschliesslich der Reconcile beim Start; kein periodisches Aufraeumen im laufenden
    // Betrieb." (TK 9.4.8, Punkt 8) Kein Timer, keine zweite Aufrufstelle.
    const aufgeraeumt = await reconcile(projektId, projekt.assets)
    if (!aufgeraeumt.ok) {
      // Wie bei Schritt 2: Code und Meldung unveraendert, keine Ruecknahme. Ein nicht gelaufener
      // Aufraeumlauf heisst, dass fehlende Medien nicht markiert sind - der Render braeche dann
      // mitten im Lauf ab statt frueh (TK 9.4.7), und die gefuehrte Reparatur (FA-19) haette
      // nichts zu reparieren, obwohl etwas kaputt ist. "Weiterarbeiten wie immer" ist hier
      // gefaehrlicher, als es aussieht.
      return { ok: false, fehler: aufgeraeumt.fehler }
    }

    vermerkeAufraeumzahlen(projektId, aufgeraeumt.wert)

    // DAS PROJEKT AUS SCHRITT 1, UNVERAENDERT - dieselbe Objektreferenz, die auch der Halter
    // (#192) fuehrt. Kein neu gebautes Objekt, kein Nachladen, kein Anreichern: Zwei Objekte
    // fuer dasselbe Projekt waeren die zweite Wahrheit, und wer die andere Referenz haelt,
    // bearbeitete ab dann einen Zwilling. Die Zustaende, die Schritt 3 gerade auf 'fehlt'
    // gesetzt hat, stehen bereits IN diesem Objekt.
    return { ok: true, wert: projekt }
  } catch (ursache) {
    return {
      ok: false,
      fehler: {
        code: 'unbekannter_fehler',
        meldung: `Das Oeffnen des Projekts ist unerwartet abgebrochen. Grund: ${textVon(ursache)}`,
      },
    }
  }
}
// - ruft ausschliesslich #34 -> #67 -> #91, in dieser Reihenfolge, jeden abgewartet
// - kein fs, kein Pfad, kein Lock, kein Timer, kein IPC-Kanal, kein reiheEin, kein Fenster
// - der erste scheiternde Schritt beendet den Ablauf; sein Fehler reist unveraendert weiter
// - bei Erfolg kommt GENAU das Project aus Schritt 1 heraus

/**
 * Der Fehler aus Schritt 1, unveraendert uebernommen.
 *
 * ERLEDIGT am 13.08.2026 (Entscheidung des Users): Hier stand eine Abbildung von
 * `schema_zu_neu` auf `unbekannter_fehler`, weil der verbindliche Rueckgabetyp den Code nicht
 * tragen konnte. Er kann es jetzt - die Signatur ist um `'schema_zu_neu'` erweitert.
 *
 * WARUM DAS ZAEHLT: "Diese Projektdatei stammt aus einer neueren App-Version" ist eine
 * Auskunft, auf die die Oberflaeche gezielt reagieren koennen muss - mit einem Hinweis auf ein
 * Update, nicht mit "unbekannter Fehler". Auf einen Meldungstext kann kein Aufrufer verzweigen.
 *
 * Die Erweiterung war JETZT billig: #76 ist der einzige Abnehmer und noch ungebaut.
 */
function ausSchritt1(fehler: Schritt1Fehler): Ausgang {
  // JEDER Code kommt genau so heraus, wie er hereinkam - `speicher_fehler`, `nicht_gefunden`,
  // `kein_projekt`, `projekt_beschaeftigt` und `schema_zu_neu`. Keine Abbildung, kein Cast.
  return { ok: false, fehler }
}

/**
 * "Sie sind eine Diagnoseauskunft und werden intern vermerkt" (Issue) - als INTERNE MELDUNG DES
 * MAIN-PROZESSES, dieselbe Hausform wie in `reconcile-waisen.ts` (#88), `q4-journal.ts` (#66),
 * `dispatcher.ts` (#60) und `registriere-handler.ts` (#23).
 *
 * Das Issue verbietet vier Dinge, und keines davon geschieht hier: kein eigener Logger, keine
 * Log-Datei, kein `console.log`, das in der OBERFLAECHE landet (dies ist der Hauptprozess, die
 * Zeile geht ins Terminal und nie ueber die IPC-Grenze), und kein zusaetzliches Feld im
 * Rueckgabewert - die Nutzlast bleibt das `Project`. Als das Issue "einen projektweiten
 * Mechanismus gibt es im Bestand nicht" schrieb, stimmte das; inzwischen gibt es die Hausform,
 * und sie wird benutzt statt neben ihr eine zweite erfunden.
 *
 * WARUM UEBERHAUPT, UND WARUM `offen` DIE WICHTIGSTE DER VIER ZAHLEN IST: `offen` zaehlt die
 * vorgemerkten Loeschungen, die AUCH DIESES MAL nicht durchgingen. Verschluckt man sie, versucht
 * der Lauf es bei jedem Projektstart erneut - still und fuer immer -, und der Nutzer saehe nur,
 * dass sein Datentraeger nicht leerer wird. Deshalb wird die Zeile zur WARNUNG, sobald etwas
 * haengt, und bleibt sonst eine blosse Auskunft.
 */
function vermerkeAufraeumzahlen(
  projektId: string,
  zahlen: { entfernt: number; markiert: number; erledigt: number; offen: number },
): void {
  const meldung =
    `[ipc-gateway] oeffneProjektAblauf: Aufraeumlauf fuer "${projektId}" fertig - ` +
    `${zahlen.entfernt} Waisen entfernt, ${zahlen.markiert} Medien als fehlend markiert, ` +
    `${zahlen.erledigt} vorgemerkte Loeschungen nachgeholt, ${zahlen.offen} weiterhin offen.`
  if (zahlen.offen > 0) {
    console.warn(meldung)

    // SICHTBAR FUER DEN NUTZER, entschieden am 13.08.2026: "Nur zeigen, wenn etwas haengt."
    //
    // Die drei anderen Zahlen bleiben eine reine Diagnoseauskunft - wer ein Projekt oeffnet,
    // will nicht bei jedem Start lesen, wie viele Waisen weggeraeumt wurden. `offen` ist der
    // Ausnahmefall: Diese Loeschungen wurden schon einmal verlangt, sind schon einmal
    // gescheitert und werden bei JEDEM weiteren Start still erneut versucht. Ohne Meldung
    // sieht der Nutzer allein, dass sein Datentraeger nicht leerer wird - und sucht die
    // Ursache dort, wo sie nicht ist.
    //
    // WARUM UEBER DEN STOERUNGSKANAL DER WARTESCHLANGE und nicht ueber einen eigenen Weg:
    // Vorgemerkte Loeschungen liegen in Q2, dem Wiederholungsspeicher der Warteschlange
    // (TK v2.4) - sachlich ist das ihr Gegenstand. Der Kanal existiert seit dem 13.08.2026
    // (#65 `meldeQueueStoerung` -> #71 `queue:stoerung` -> Anzeige in #205) und ist genau
    // dafuer gebaut: Stoerungen, die der Ablauf bewusst ueberlebt und die sonst niemand
    // bemerkt. Ein zweiter Meldeweg daneben waere einer zu viel.
    //
    // KEIN `await`, kein Abbruch: Das Projekt IST geoeffnet. Eine gescheiterte Anzeige darf
    // daran nichts aendern.
    meldeQueueStoerung(
      `${zahlen.offen} vorgemerkte Loeschung(en) konnten auch diesmal nicht ausgefuehrt werden. ` +
        `Die Dateien bleiben vorerst liegen und werden beim naechsten Oeffnen erneut versucht.`,
    )
    return
  }
  console.info(meldung)
}

/** Der Text einer Ausnahme, ohne Stacktrace - der reist nicht ueber die Grenze. */
function textVon(ursache: unknown): string {
  return ursache instanceof Error ? ursache.message : String(ursache)
}

// NICHT HIER, UND GEMELDET:
//
// 1. DER RUECKGABETYP KANN 'schema_zu_neu' NICHT TRAGEN - und das ist eine NAHT, die sich nach
//    dem Schreiben des Issues aufgetan hat. Das Issue haelt fest: "Ein Fehlerobjekt aus einem
//    engeren Ergebnistyp ist auf den weiteren hier zuweisbar", und meinte damit #34 mit seinem
//    damals EINPARAMETRIGEN `Ergebnis<Project>`. Am 12.08.2026 ist #34 auf
//    `Ergebnis<Project, ProjectStoreFehlercode | 'schema_zu_neu'>` geweitet worden; der
//    Ergebnistyp von Schritt 1 ist seither WEITER als der hiesige, nicht enger, und die
//    Zuweisbarkeit gilt nicht mehr. Der Nachtrag vom 13.08.2026 hat #67 und #91 nachgezogen,
//    #34 aber nicht. Behandelt ist es in `ausSchritt1` (Code faellt auf `unbekannter_fehler`,
//    Meldung bleibt woertlich); sauber ist das erst, wenn die verbindliche Signatur dieses
//    Issues um `'schema_zu_neu'` erweitert wird - eine Vertragsaenderung, die ins Issue gehoert
//    und nicht in diese Datei.
//
// 2. KEINE RUECKNAHME BEI EINEM FEHLSCHLAG IN SCHRITT 2 ODER 3. Frage 2 des STOPP-Blocks ist
//    unbeantwortet; das Projekt bleibt geladen und im config-store aktiv, waehrend die Funktion
//    `ok: false` meldet. Das ist ein bewusst hingenommener Halbzustand, kein uebersehener:
//    Entladen hiesse, aus dieser Datei heraus in zwei fremde Module zu greifen (Halter #192,
//    config-store #27), und "wohin zurueck, wenn vorher ein anderes Projekt offen war?" hat im
//    Bestand keine Antwort. Wer das entscheidet, entscheidet es im Issue.
//
// 3. KEIN EIGENER IPC-KANAL UND KEIN EINTRAG IN `kanaele.ts`. Der Kanal `project:öffneProjekt`
//    wird von der project-store-Verdrahtung (#76) registriert und ruft DIESE Funktion auf, nicht
//    `öffneProjekt` direkt. Am 13.08.2026 nachgeprueft: #76 ist noch ungebaut (die Datei
//    `project-store-verdrahtung.ts` wirft noch ihren Geruest-Fehler), und im ganzen `src/`-Baum
//    gibt es bislang keinen Aufrufer dieser Funktion. Das ist KEINE Luecke, sondern die im Issue
//    verzeichnete Abhaengigkeit "Blockiert: #76" - bis dahin bleibt der Aufraeumlauf ungenutzt.
//    NICHT hier einen Kanal nachruesten: Das waere der zweite Weg, bei dem das Aufraeumen wieder
//    ausbleibt.
//
// 4. KEINE VALIDIERUNG DER ASSET-LISTE. Sie wird weitergereicht, wie sie aus #34 kommt - nicht
//    gefiltert, nicht sortiert, nicht auf Vollstaendigkeit geprueft. Eine Pruefung hier waere
//    eine zweite Vorstellung davon, was eine gueltige Asset-Liste ist; #34 stellt sie ueber die
//    Pflichtfeld-Pruefung von #48 bereits sicher.
