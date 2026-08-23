// GENERIERT aus dem Signaturblock von Issue #33.
// [project-store] erstelleProjekt implementieren
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
// GERUEST-PRUEFSUMME: 9c3c4fde3a192e2e
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

import fs from 'node:fs/promises'
import path from 'node:path'

import { erzeugeId } from '../../shared/contracts/id'
import {
  AKTUELLE_SCHEMA_VERSION,
  STANDARD_ANZEIGEDAUER_SEKUNDEN,
} from '../../shared/contracts/konstanten'

import { merkeAktivesProjekt } from './aktives-projekt'          // #192
import { mitD1Lock } from './d1-lock'
import { medienOrdner, projektOrdner } from './pfade'
import { schreibeProjekt } from './schreibe-projekt'

// Fremde Aufrufe - vollstaendige Signaturen, damit hier nichts geraten wird:
//   #32: mitD1Lock<T>(aktion: () => Promise<T>): Promise<T>
//        // fuehrt aktion() garantiert seriell aus (FIFO, prozessintern);
//        // "darf selbst nicht erneut mitD1Lock aufrufen (Deadlock-Gefahr)".
//   #46: schreibeProjekt(projekt: Project): Promise<Ergebnis<void, ProjectStoreFehlercode>>
//        // schreibt <Datenort>/projects/<projekt.id>/project.json atomar (.tmp + Rename,
//        // .bak-Sicherung, schemaVersion wird beim Schreiben gesetzt) und nimmt SELBST
//        // KEIN Lock: "Wer schreibeProjekt AUSSERHALB von mitD1Lock ruft, hat keine
//        // Serialisierung." Deshalb steht der Aufruf unten INNERHALB des Lock-Abschnitts.
//   #49: projektOrdner(projektId: string): string
//        medienOrdner(projektId: string): string
//        // absolute Pfade, reine String-Operation, kein Dateisystemzugriff. Die
//        // Pfad-Autoritaet ist die EINE Stelle, die das Datei-Layout kennt (TK 9.5.7) -
//        // hier wird nichts aus ermittleDatenOrt() und "projects" zusammengesetzt.
//   #20: erzeugeId(): string
//        // UUID v4, "die EINE Stelle, an der IDs entstehen" (TK 9.11.4).
//   #21: const AKTUELLE_SCHEMA_VERSION = 1

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { ProjectStoreFehlercode } from './assets'            // #72
import type { Project } from '../../shared/contracts/project'
export async function erstelleProjekt(name: string): Promise<Ergebnis<Project, ProjectStoreFehlercode>> {
  // Die Namenspruefung laeuft VOR dem Lock. Ein leerer Name beruehrt D1 nicht ("keine
  // Wirkung", Fehlerpfad-Tabelle) - ihn erst hinter der Warteschlange abzuweisen hiesse,
  // einen laufenden Schreibvorgang abzuwarten, nur um nichts zu tun.
  //
  // `typeof` trotz `name: string`: Der Wert kommt ueber IPC aus dem Renderer, und ueber
  // die Prozessgrenze reist ein `unknown` als `string` getarnt (TK 9.1.1). Ohne die
  // Pruefung wuerde `null.trim()` werfen - und ein Wurf reist nie ueber die Grenze.
  if (typeof name !== 'string' || name.trim().length === 0) {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: 'Ein Projekt braucht einen nicht leeren Namen.',
      },
    }
  }

  // ENTSCHIEDEN - der Anzeigename wird GETRIMMT gespeichert.
  //
  // Das ist eine Aenderung der Nutzereingabe und deshalb begruendungspflichtig: Wer
  // "   " als leer abweist, aber "  Sommer  " unveraendert ablegt, misst mit zweierlei
  // Mass - in der Projektliste stuenden dann zwei Eintraege, die identisch aussehen und
  // es nicht sind. Anders als beim Ausgabenamen (#49, dort wird NICHT getrimmt, sondern
  // abgewiesen) haengt hier nichts an der Zeichenfolge: Der Name ist reines Anzeigefeld,
  // der Ordner heisst nach der ID. Ein Randleerzeichen kann also nichts als Verwirrung
  // stiften.
  const anzeigename = name.trim()

  // Das Lock umschliesst ALLES, was die Platte anfasst - Ordner anlegen UND Schreiben.
  // Zwei gleichzeitige Aufrufe legen zwar verschiedene Ordner an (die IDs sind neu), aber
  // schreibeProjekt (#46) benutzt eine feste `project.json.tmp` je Projektordner und ist
  // ohne Lock nicht serialisiert; ausserdem ist "Ordner anlegen, dann hineinschreiben"
  // nur als Ganzes eine Einheit.
  //
  // FUER AUFRUFER: Diese Funktion nimmt das Lock SELBST. Sie darf NICHT noch einmal in
  // mitD1Lock eingewickelt werden - der innere Aufruf wartete auf den aeusseren, der auf
  // ihn wartet (#32, "Deadlock-Gefahr").
  //
  // Der Rueckgabetyp des Abschnitts steht ausgeschrieben da, statt sich ableiten zu
  // lassen: Ohne ihn wuerde `ok: false` in einem Objektliteral zu `boolean` verbreitert,
  // und die Ergebnis-Huelle waere nicht mehr diskriminierbar.
  return mitD1Lock(async (): Promise<Ergebnis<Project, ProjectStoreFehlercode>> => {
    const jetzt = new Date().toISOString()
    const projekt: Project = {
      id: erzeugeId(),
      name: anzeigename,
      erstelltAm: jetzt,
      // Gleicher Zeitstempel wie erstelltAm, nicht null und nicht ausgelassen: Ein
      // frisch angelegtes Projekt IST auf dem Stand seiner Erzeugung, und jeder
      // Vergleich "seit wann unveraendert" braucht hier einen Wert.
      geaendertAm: jetzt,
      // Wird von schreibeProjekt (#46) beim Schreiben ohnehin neu gesetzt. Hier steht
      // sie trotzdem, weil das ZURUECKGEGEBENE Objekt dieselbe Version tragen muss wie
      // die Datei - sonst haette der Aufrufer einen Stand, der nicht auf der Platte liegt.
      schemaVersion: AKTUELLE_SCHEMA_VERSION,
      assets: [],
      aktionen: [],
      liste: [],
      // "null = noch nie gerendert" (TK 9.11.3, FA-22). Das Feld MUSS gesetzt sein:
      // Fehlt es, liest der erste Render seine Vorbelegung aus `undefined`.
      letzterAusgabeName: null,
      // Pflichtfeld seit TK v3.18 (#334): Ein neues Projekt startet auf der
      // projektweiten Vorbelegung (TK 9.11.4) - dieselbe Konstante wie sonstwo, kein
      // Zahlenliteral. KEINE Migration noetig: Das Feld gehoert von Anfang an dazu
      // (schemaVersion 1, TK 9.5.5).
      standardSegmentdauer: STANDARD_ANZEIGEDAUER_SEKUNDEN,
    }

    const ordner = projektOrdner(projekt.id)
    const medien = medienOrdner(projekt.id)

    // ANLEGEN IN ZWEI SCHRITTEN, UND DER ZWEITE OHNE `recursive`.
    //
    // `recursive: true` waere bequemer, macht aber genau die Auskunft unmoeglich, auf der
    // das Aufraeumen weiter unten beruht: Es meldet Erfolg, egal ob der Ordner neu ist
    // oder schon stand. Ohne den Schalter bedeutet ein gelungener Aufruf "diesen Ordner
    // habe ICH angelegt" - und nur dann darf im Fehlerfall wieder geloescht werden.
    //
    // path.dirname statt eines eigenen join: Der Elternordner wird aus dem Pfad der
    // Autoritaet ABGELEITET, nicht aus Datenort und "projects" nachgebaut. Damit kennt
    // diese Datei das Layout weiterhin nicht (TK 9.5.7).
    let eigenerOrdner = false
    try {
      await fs.mkdir(path.dirname(ordner), { recursive: true })
      // EEXIST hier heisst: Die frisch erzeugte UUID hat schon einen Ordner. Praktisch
      // unmoeglich, aber wenn doch, dann gehoert er jemand anderem - abbrechen, nichts
      // anfassen. Ein `recursive: true` wuerde stattdessen in einen fremden Projektordner
      // hineinschreiben.
      await fs.mkdir(ordner)
      eigenerOrdner = true
      // "Jedes Projekt besitzt einen eigenen Ordner mit `media/`-Unterordner" (TK 6) -
      // und zwar ab dem Anlegen. Der media-service (#78 ff.) kopiert Importe dorthin und
      // muesste sonst selbst entscheiden, wann er den Ordner nachzieht.
      await fs.mkdir(medien)
    } catch (ursache) {
      await raeumeAuf(eigenerOrdner ? ordner : null)
      return speicherFehler(`Projektordner konnte nicht angelegt werden: ${text(ursache)}`)
    }

    // KEIN output/. "Fehlt der Ordner (noch nie gerendert), ist das Ergebnis eine leere
    // Liste, kein Fehler. Angelegt wird er hier NICHT - das tut der Render." (TK 9.5.2,
    // umgesetzt in ausgaben.ts #75). Ein hier vorab angelegter leerer Ausgabeordner waere
    // kein Schaden, aber eine zweite Zustaendigkeit fuer denselben Ordner.

    const geschrieben = await schreibeProjekt(projekt)
    if (!geschrieben.ok) {
      // "keine Wirkung, kein Halbzustand" (Fehlerpfad-Tabelle). Ein Projektordner ohne
      // project.json ist genau der Halbzustand: listeProjekte (#35) findet einen Ordner,
      // der kein Projekt ist, und der Nutzer sieht eine Leiche, die er nicht loeschen
      // kann. Das Aufraeumen ist hier gefahrlos, weil der Ordner nachweislich in diesem
      // Aufruf entstanden ist (s. oben) und seine ID noch niemand kennt - es kann nichts
      // darin liegen ausser dem, was diese Funktion angelegt hat.
      await raeumeAuf(ordner)
      // Der Fehler wird DURCHGEREICHT, nicht neu erfunden: schreibeProjekt unterscheidet
      // ungueltige_eingabe (nicht serialisierbar) von speicher_fehler (Platte), und beide
      // Codes sind in dieser Signatur zulaessig.
      return { ok: false, fehler: geschrieben.fehler }
    }

    // Das neue Projekt IST ab jetzt das aktive (so verlangt es die Beschreibung dieses
    // Issues). Der Halter dafuer wurde am 12.08.2026 in #192 nachgetragen; bis dahin gab es
    // im ganzen Bestand keine Stelle, an der dieser Zustand haette liegen koennen, und der
    // Punkt blieb offen. Gesetzt wird DIESELBE Referenz, die auch zurueckgegeben wird - eine
    // Kopie waere die zweite Wahrheit, die #192 ausschliesst.
    merkeAktivesProjekt(projekt)
    return { ok: true, wert: projekt }
  })
}
// Ausgang bei Erfolg: das neu angelegte, leere Project (assets/aktionen/liste = [],
// letzterAusgabeName = null); auf der Platte liegen projects/<projektId>/project.json und
// projects/<projektId>/media/.

/**
 * Loescht den in diesem Aufruf angelegten Projektordner wieder. `null` = es gibt nichts
 * aufzuraeumen.
 *
 * Ein Fehlschlag beim Aufraeumen wird VERSCHLUCKT und ueberschreibt nicht den Grund, aus
 * dem wir hier sind: Die eigentliche Meldung ("Platte voll", "kein Zugriff") ist die, die
 * dem Nutzer weiterhilft. Bleibt der leere Ordner liegen, ist das ein Schoenheitsfehler -
 * kein Projekt, kein Datenverlust.
 */
async function raeumeAuf(ordner: string | null): Promise<void> {
  if (ordner === null) {
    return
  }
  await fs.rm(ordner, { recursive: true, force: true }).catch(() => undefined)
}

function speicherFehler(meldung: string): Ergebnis<Project, ProjectStoreFehlercode> {
  return { ok: false, fehler: { code: 'speicher_fehler', meldung } }
}

function text(ursache: unknown): string {
  return ursache instanceof Error ? ursache.message : String(ursache)
}

// NICHT HIER, UND GEMELDET:
//
// 1. DAS NEUE PROJEKT WIRD NICHT ALS "AKTIVES PROJEKT" GESETZT. Der Abschnitt
//    "Eingang -> Ausgang" des Issues verlangt es ("bereits als aktives Projekt im
//    Speicher"), die DoD nennt es nicht - und einen Halter dafuer gibt es im ganzen
//    Bestand NICHT. #192 (aktives-projekt.ts) hat genau das als offene Frage
//    festgehalten: "Es gibt heute keinen benannten Halter", exportiert nur den Lesezugang
//    holeAktivesProjekt() und verbietet ausdruecklich, den Zustand zu improvisieren.
//    Eine Modulvariable in DIESER Datei waere die zweite Wahrheit, die #192 verhindern
//    soll. Ebenso wenig wird setzeAktivesProjekt (#27, config-store) gerufen: Das
//    schreibt config.json und ist laut #34 Sache von oeffneProjekt.
//
// 2. KEINE MARKEN-KENNUNG. Das woertliche TK-Zitat im Issue nennt zwei Eingaenge
//    ("name, standardMarkeId"), die verbindliche Signatur nur `name`, und der Typ
//    `Project` (#15) hat kein Marken-Feld. Der Widerspruch ist NICHT hier aufloesbar
//    (das waere eine Vertragsaenderung) und wird gemeldet - M8 (Marken) haengt daran.
//
// 3. KEINE PRUEFUNG AUF DOPPELTE PROJEKTNAMEN. Zwei Projekte duerfen gleich heissen; sie
//    unterscheiden sich ueber die ID, und weder Issue noch TK verlangen Eindeutigkeit.
//    Eine Pruefung muesste alle project.json lesen - I/O fuer eine Regel, die niemand
//    aufgestellt hat.
//
// 4. KEINE LAENGEN- ODER ZEICHENPRUEFUNG DES NAMENS. Er wird nie zu einem Pfad (der
//    Ordner heisst nach der ID), also gibt es hier nichts abzuwehren. Der Ausgabename ist
//    ein anderer Wert und wird an seiner eigenen Stelle geprueft (#49).
