// GENERIERT aus dem Signaturblock von Issue #43.
// [project-store] ordneNeu implementieren
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
// GERUEST-PRUEFSUMME: e5eb548402f690ae
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

import { holeAktivesProjekt } from './aktives-projekt'        // #192
import { planeAutoSpeicherung } from './auto-speichern'       // #47
import { mitD1Lock } from './d1-lock'                         // #32

// Fremde Aufrufe - vollstaendige Signaturen, damit hier nichts geraten wird:
//   #32:  mitD1Lock<T>(aktion: () => Promise<T>): Promise<T>
//         // fuehrt aktion() garantiert seriell aus (FIFO, prozessintern, KEINE Datei-Sperre).
//         // Der kritische Abschnitt darf selbst NICHT erneut mitD1Lock aufrufen
//         // (Deadlock-Gefahr).
//   #47:  planeAutoSpeicherung(projekt: Project): void
//         // merkt projekt als zu speichernde, aktuelle Version vor und (re-)startet den
//         // Entprellungstimer. SYNCHRON, kein Rueckgabewert, nimmt KEIN Lock, wirft nie.
//   #192: holeAktivesProjekt(): Project | null
//         // das aktuell geoeffnete Projekt als LEBENDEN Stand (dieselbe Objektreferenz, die
//         // die Instant-Operationen mutieren), kein Projekt offen -> null. SYNCHRON, NIMMT
//         // KEIN LOCK, WIRFT NIE.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { ProjectStoreFehlercode } from './assets'            // #72
import type { Listenelement } from '../../shared/contracts/project'
export async function ordneNeu(
  reihenfolge: string[],
): Promise<Ergebnis<void, ProjectStoreFehlercode>> {
  return mitD1Lock(async (): Promise<Ergebnis<void, ProjectStoreFehlercode>> => {
    // GELESEN WIRD INNERHALB DES LOCKS, und das ist der ganze Grund, warum diese
    // Operation ueberhaupt ein Lock nimmt, obwohl sie selbst nichts auf die Platte
    // schreibt: Zwischen "welche IDs stehen in der Liste?" und "so sieht die Liste
    // ab jetzt aus" darf keine andere Mutation (entferneElement #42,
    // fuegeElementHinzu #41) dazwischenkommen. Sonst wuerde eine Reihenfolge
    // uebernommen, die gegen einen inzwischen ueberholten Stand geprueft wurde -
    // und genau dabei verschwaende ein Element.
    const projekt = holeAktivesProjekt()

    if (projekt === null) {
      // KEIN AKTIVES PROJEKT. `nicht_gefunden` und nicht `ungueltige_eingabe`:
      // Der Aufruf selbst ist tadellos, es fehlt der Gegenstand, auf den er sich
      // bezieht. Der Renderer kann daraus ausserdem etwas machen - "kein Projekt
      // offen" ist ein Zustand, den die Oberflaeche behebt (Projekt oeffnen),
      // waehrend `ungueltige_eingabe` ihn zu einem Programmierfehler erklaerte.
      //
      // GEMELDET, NICHT ENTSCHIEDEN: #38 legt diese Wahl ausdruecklich in den
      // STOPP-Block, weil sie fuer ALLE project-store-Mutationen einheitlich
      // getroffen werden muss. S. Bericht/STOPP.
      return {
        ok: false,
        fehler: {
          code: 'kein_projekt',
          meldung: 'Es ist kein Projekt geoeffnet, dessen Wiedergabeliste umsortiert werden koennte.',
        },
      }
    }

    // DER EINGANG KOMMT UEBER DIE PROZESSGRENZE. Der Typ `string[]` gilt beim
    // Uebersetzen, nicht zur Laufzeit: Was durch den IPC-Kanal kommt, hat der
    // Renderer zusammengestellt, und ein `undefined` oder ein Objekt statt eines
    // Arrays wuerde in der Schleife unten als Ausnahme enden - eine Ausnahme, die
    // ueber die Grenze zu blossem Text zerfaellt (s. ergebnis.ts). Deshalb hier
    // eine Huelle statt eines Wurfs.
    if (!Array.isArray(reihenfolge)) {
      return ungueltig('Die uebergebene Reihenfolge ist keine Liste von Element-IDs.')
    }

    // Nachschlagewerk statt `find` in der Schleife: Bei einer Wiedergabeliste mit
    // vielen Elementen waere das quadratisch, und diese Operation laeuft am Ende
    // JEDER Drag-and-Drop-Bewegung.
    const nachId = new Map<string, Listenelement>()
    for (const element of projekt.liste) {
      nachId.set(element.id, element)
    }

    // ERSTE SCHRANKE: die Anzahl. Sie allein beweist nichts (eine fehlende und
    // eine doppelte ID heben sich in der Zahl auf), aber zusammen mit den beiden
    // Pruefungen in der Schleife ergibt sie die Vollstaendigkeit - s. den Beweis
    // weiter unten.
    if (reihenfolge.length !== projekt.liste.length) {
      return ungueltig(
        `Die uebergebene Reihenfolge nennt ${reihenfolge.length} Elemente, ` +
          `die Wiedergabeliste enthaelt ${projekt.liste.length}.`,
      )
    }

    // DIE NEUE LISTE WIRD ERST VOLLSTAENDIG GEBAUT UND DANN UEBERNOMMEN.
    // Waehrend `projekt.liste` direkt umzustellen und beim ersten Fehler
    // abzubrechen, hinterliesse eine halb sortierte Liste - "keine Wirkung" aus
    // der Fehlerpfad-Tabelle waere dann eine Behauptung, kein Verhalten.
    const neu: Listenelement[] = []
    const gesehen = new Set<string>()
    for (const id of reihenfolge) {
      const element = nachId.get(id)
      if (element === undefined) {
        return ungueltig(
          'Die uebergebene Reihenfolge nennt eine ID, die in der Wiedergabeliste nicht vorkommt.',
        )
      }
      if (gesehen.has(id)) {
        return ungueltig('Die uebergebene Reihenfolge nennt dieselbe ID mehrfach.')
      }
      gesehen.add(id)
      neu.push(element)
    }

    // WARUM KEINE VIERTE PRUEFUNG AUF FEHLENDE IDs NOETIG IST (der Beweis, den die
    // Vollstaendigkeits-Invariante des Issues verlangt):
    // Alle IDs aus `reihenfolge` stammen aus `nachId` (zweite Pruefung), keine
    // kommt zweimal vor (dritte Pruefung), also ist `gesehen` eine TEILMENGE der
    // Element-IDs mit genau `reihenfolge.length` Eintraegen. Mit der ersten
    // Pruefung ist das genau `projekt.liste.length` - eine Teilmenge dieser
    // Groesse ist die ganze Menge. Es kann also nichts fehlen.
    //
    // Und der einzige Fall, der diesen Schluss angreifen koennte - eine
    // Wiedergabeliste, die DIESELBE Element-ID zweimal enthaelt (nur denkbar bei
    // von Hand verbogener project.json) -, faellt auf die sichere Seite: `nachId`
    // haette dann WENIGER Eintraege als `liste` lang ist, keine gueltige
    // `reihenfolge` koennte beide Schranken zugleich erfuellen, und die Operation
    // lehnt ab, statt beim Umbau lautlos ein Element zu verdoppeln oder zu
    // verlieren.

    // IN-PLACE, NICHT `projekt.liste = neu`. Beides mutiert dasselbe lebende
    // Project-Objekt (#192) und ist insofern gleichwertig - aber wer eine
    // Referenz auf das ARRAY haelt (eine Sicht, ein bereits laufender
    // Speichervorgang), sieht nach einer Zuweisung fuer immer die alte
    // Reihenfolge, ohne dass irgendetwas bricht. Das waere die zweite Wahrheit,
    // die TK 9.11.3 und #192 ausschliessen. `splice` haelt die Array-Identitaet.
    projekt.liste.splice(0, projekt.liste.length, ...neu)

    // KEIN FELD DER `Listenelement`-Objekte WIRD ANGEFASST. Die Reihenfolge IST
    // die Array-Reihenfolge (TK 9.11.3, "es gibt KEIN separates position-Feld");
    // hier zusaetzlich irgendetwas nachzufuehren, waere genau die zweite
    // Ordnungsquelle, die das TK verbietet. Es werden dieselben Objekte
    // umgehaengt, keine Kopien - ein `{ ...element }` waere unbemerkt der
    // Zwilling, den ein anderswo gehaltener Verweis nicht mitbekommt.

    // GESCHRIEBEN WIRD HIER NICHT. `schreibeProjekt` (#46) direkt zu rufen, waere
    // eine Platte pro Mausbewegung und hebelte die Entprellung aus TK 9.5.4 aus;
    // die Instant-Operation aendert den Speicherstand und meldet ihn zum
    // Speichern an. Auch bei unveraenderter Reihenfolge (der Nutzer legt das
    // Element wieder dort ab, wo es lag): Die Fallunterscheidung spart einen
    // Schreibvorgang von wenigen Kilobyte und kostet dafuer eine Bedingung, die
    // falsch sein koennte - der teurere Fehler waere die ausgelassene Speicherung.
    planeAutoSpeicherung(projekt)

    // `geaendertAm` WIRD BEWUSST NICHT GESETZT - der STOPP-Block des Issues
    // verbietet, den Zeitpunkt hier festzulegen, weil alle Liste-Mutationen
    // (#41/#42/#44/#45) dasselbe Verhalten zeigen muessen. S. Bericht/STOPP.

    return { ok: true, wert: undefined }
  })
}
// reihenfolge: die komplette neue Abfolge von Listenelement-IDs, in der gewünschten Reihenfolge

/**
 * Die Fehlerhuelle fuer alle drei Abweichungen. EIN Code (`ungueltige_eingabe`,
 * so die Fehlerpfad-Tabelle des Issues), unterschiedliche Meldung.
 *
 * Die Meldung nennt die ART der Abweichung, aber KEINE IDs, und `daten` bleibt
 * leer: Wie tief die Diagnose gehen muss, steht im STOPP-Block des Issues und ist
 * nicht hier zu entscheiden. Ein Text ist Pflicht (`meldung: string`), also ist
 * das die zurueckhaltendste Fassung, die den Vertrag erfuellt. S. Bericht/STOPP.
 */
function ungueltig(meldung: string): Ergebnis<void, ProjectStoreFehlercode> {
  return { ok: false, fehler: { code: 'ungueltige_eingabe', meldung } }
}

// NICHT HIER, UND GEMELDET:
//
// 1. KEIN SCHNAPPSCHUSS FUER UNDO. TK 9.13.2 verlangt vor jeder Instant-Operation
//    einen Schnappschuss; gebaut wird er laut M7 NICHT in den dreissig aufrufenden
//    Modulen, sondern in der Huelle um die gemeinsame Projekt-Sicht (#243). Diese
//    Datei legt deshalb keinen an - taete sie es, gaebe es zwei.
//
// 2. KEIN IPC-KANAL. Die Anmeldung von `project:ordneNeu` gehoert ins ipc-gateway
//    (#75/#76), nicht hierher.
//
// 3. KEINE PRUEFUNG DER ELEMENT-INHALTE. Ob ein Element auf ein vorhandenes Asset
//    zeigt, entscheidet der Reparatur-Modus (FA-19); Umsortieren aendert daran
//    nichts und darf ein kaputtes Element nicht zusaetzlich blockieren.
