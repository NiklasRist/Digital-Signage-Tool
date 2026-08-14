// GENERIERT aus dem Signaturblock von Issue #99.
// [vorlagen-store] listeVorlagen und listeArbeitskopien implementieren
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
// GERUEST-PRUEFSUMME: 9657185f3cfdb456
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
// ERLEDIGT (14.08.2026): Die Abschaltzeile ist mit dem Fuellen der Rumpfe entfernt;
// alle Importe werden jetzt benutzt. Der Absatz darueber bleibt als Beleg stehen.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { Vorlage } from '../../shared/contracts/vorlage'
import type { VorlagenFehlercode } from './fehlercodes'
import { ladeBestand } from './schreibe-vorlagen'

// Fremde Aufrufe – vollstaendige Signaturen, damit hier nichts geraten wird:
//   #98: ladeBestand(): Promise<Ergebnis<Vorlage[], VorlagenFehlercode>>
//          // vollstaendiger Bestand als TIEFE Kopie: nutzbare Vorlagen UND Arbeitskopien
//   #97: type VorlagenFehlercode = 'vorlage_referenziert' | 'parent_eingebaut' | 'speicher_fehler'
//   #95: interface Vorlage { id: string; name: string; art: VorlagenArt; höhe: number | null
//                              parent: string | null; eingebaut: boolean; zonen: Zone[] }

/** Nur NUTZBARE Vorlagen: parent === null. Arbeitskopien erscheinen hier nicht. */
export async function listeVorlagen(): Promise<Ergebnis<Vorlage[], VorlagenFehlercode>> {
  return filtereBestand((vorlage) => vorlage.parent === null)
}

/** Nur ARBEITSKOPIEN: parent !== null. Fuer „Bearbeitung fortsetzen". */
export async function listeArbeitskopien(): Promise<Ergebnis<Vorlage[], VorlagenFehlercode>> {
  return filtereBestand((vorlage) => vorlage.parent !== null)
}

/**
 * Der gemeinsame Rumpf beider Listen: Bestand holen, filtern, Huelle zurueckgeben.
 *
 * BEWUSST NICHT EXPORTIERT. Der STOPP-Block verbietet eine dritte Listenfunktion nach aussen
 * ("kein `listeAlle`, kein `findeVorlage(id)`, kein `existiertVorlage`"); modul-intern haelt diese
 * eine Stelle dagegen sicher, dass die beiden Listen sich nicht auseinanderentwickeln - eine
 * kuenftige Aenderung an der Fehlerbehandlung kann gar nicht nur eine der beiden treffen.
 *
 * ZUR VOLLSTAENDIGKEIT DER ZERLEGUNG: Die beiden Praedikate sind `parent === null` und dessen
 * exakte Verneinung. Damit gilt "lueckenlos und ueberschneidungsfrei" ohne weiteres Zutun - auch
 * fuer einen Eintrag, dessen `parent` gar kein `string | null` ist (die Datei ist von Hand
 * editierbar, #98 prueft den INHALT ausdruecklich nicht). Ein solcher Eintrag landet bei den
 * Arbeitskopien, also auf der Seite, die NICHT auswaehlbar ist; die Sicherheitsschranke des Issues
 * ("halbfertige Vorlagen koennen nicht in einen Render geraten") haelt damit auch im kaputten Fall.
 * Repariert oder ausgeblendet wird hier nichts.
 *
 * KORRIGIERT am 14.08.2026: Hier stand "das ist #108". Der Verweis trifft NICHT zu - #108
 * (`verwaiste-arbeitskopien.ts`) loest beim Loeschen einer Vorlage deren Arbeitskopien
 * (`parent = null`) und hat fuer kaputte `parent`-Werte ausdruecklich keinen Auftrag; sein
 * Issue kennt nur die eine Frage "zeigt der Eintrag auf die Vorlage, die gerade geloescht
 * wird?". Aufgefallen beim Bau von #108 am 14.08.2026.
 *
 * DER FALL HAT DAMIT KEINEN ZUSTAENDIGEN. Das ist heute folgenlos - ein solcher Eintrag
 * entsteht nur durch Bearbeiten der Datei von Hand, und er landet auf der ungefaehrlichen
 * Seite. Wer ihn eines Tages behandeln will, braucht ein eigenes Issue; ein falscher
 * Verweis ist schaedlicher als gar keiner, weil er die Luecke als versorgt ausgibt.
 */
async function filtereBestand(
  behalte: (vorlage: Vorlage) => boolean,
): Promise<Ergebnis<Vorlage[], VorlagenFehlercode>> {
  try {
    const bestand = await ladeBestand()
    if (!bestand.ok) {
      // "Ein Lesefehler aus `ladeBestand` wird DURCHGEREICHT, nicht in eine leere Liste verwandelt."
      // Unveraendert, also mit dem Code UND der Meldung von dort: Ein hier neu formulierter Fehler
      // verlegte die Ursache (defekte Datei? unbekannte schemaVersion?) hinter einen zweiten Text.
      return bestand
    }
    // `ladeBestand` liefert bereits eine TIEFE Kopie (#98). `filter` legt ein neues Array darueber,
    // dessen Elemente zu genau dieser Kopie gehoeren - der zwischengespeicherte Bestand ist von
    // hier aus unerreichbar, auch wenn ein Aufrufer in eine Zone hineinschreibt. Eine zweite Kopie
    // waere deshalb verdoppelte Arbeit; eine FLACHE Kopie statt der tiefen in #98 waere dagegen ein
    // stiller Fehler, denn `filter` allein teilt die Objekte mit der Quelle.
    return { ok: true, wert: bestand.wert.filter(behalte) }
  } catch (ursache) {
    // Der Auffangbogen der Fehlerpfad-Tabelle ("unerwartete Ausnahme -> unbekannter_fehler, kein
    // throw"). Real wird er, wenn `vorlagen.json` von Hand um einen Eintrag ergaenzt wurde, der gar
    // kein Objekt ist: Der Zugriff auf `parent` wirft dann. Laut wie hier ist das richtig - still
    // uebergangen waere die Vorlagenliste unvollstaendig, ohne dass es jemandem auffiele.
    return {
      ok: false,
      fehler: {
        code: 'unbekannter_fehler',
        meldung: `Vorlagenliste konnte nicht gebildet werden: ${
          ursache instanceof Error ? ursache.message : String(ursache)
        }`,
      },
    }
  }
}

// NICHT HIER, UND ABSICHTLICH:
//
// 1. KEIN `fs`. Der einzige Dateizugriff des Moduls ist `ladeBestand` (#98).
// 2. KEIN eigener Zwischenspeicher. Der Bestand liegt bereits in #98 im Speicher; ein zweiter
//    hier lieferte nach jeder Aenderung veraltete Listen.
// 3. KEIN `sort`, keine Gruppierung, kein Anzeige-Name. Die Reihenfolge IST die des Bestands;
//    weil #98 die eingebauten Vorlagen als Anfangsbestand anlegt und fehlende hinten anhaengt,
//    stehen sie ohne Zutun am Anfang.
// 4. KEIN Filter nach `art` und keine `projektId` - Vorlagen sind app-weit (TK 9.11.1.1), und die
//    Auswahl der passenden Art erledigt die Oberflaeche.
