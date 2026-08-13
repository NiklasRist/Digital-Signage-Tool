// GENERIERT aus dem Signaturblock von Issue #58.
// [auftrags-manager] Zustandsübergänge der Aufträge prüfen
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
// GERUEST-PRUEFSUMME: 9206d99cff343b05
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

import type { AuftragStatus } from '../../shared/contracts/auftrag';
import type { Ergebnis } from '../../shared/contracts/ergebnis';

// Diese Datei importiert AUSSCHLIESSLICH Typen. Kein Laufzeitmodul, kein Q1-Q4, kein
// Journal, kein Logger, kein `fs` - beide Funktionen sind rein (DoD 5 und 6).

/**
 * Das Trennzeichen der Tabellenschluessel.
 *
 * Es darf in KEINEM Wert von `AuftragStatus` vorkommen, sonst liessen sich Schluessel
 * faelschen: Kaeme '>' in einem Status vor, koennte ein Paar wie ('laeuft>erfolg', '')
 * denselben Schluessel bilden wie das echte ('laeuft', 'erfolg'). Die fuenf Werte aus
 * #16 sind reine Kleinbuchstaben, damit ist die Zerlegung eindeutig - und weil der
 * Typ geschlossen ist, kann das nur brechen, wenn jemand #16 aendert.
 */
const TRENNER = '>';

/**
 * Die vollstaendige Zustandsmaschine aus TK 9.3.3 - GENAU fuenf Paare.
 *
 * WARUM EINE MENGE VON SCHLUESSELN UND KEIN `Record<AuftragStatus, AuftragStatus[]>`:
 * Ein Record mit Literal-Schluesseln sagt dem Typechecker, jeder der fuenf Status habe
 * einen Eintrag. Kommt ueber einen umgangenen Typ ein Fremdwert herein, liefert
 * `tabelle[von]` zur Laufzeit `undefined`, waehrend der Typ `AuftragStatus[]`
 * behauptet - der folgende `.includes(...)` wirft dann einen TypeError, obwohl die
 * Funktion laut Issue NIE wirft. `Set.has` kennt dieses Loch nicht: Was nicht
 * eingetragen ist, ist schlicht nicht enthalten.
 *
 * Die drei terminalen Zustaende stehen hier bewusst NICHT als leere Eintraege: Wer in
 * dieser Menge nicht als `von` auftaucht, hat keinen ausgehenden Uebergang. `erfolg`
 * und `abgebrochen` fehlen deshalb ganz; `fehlgeschlagen` kommt genau einmal vor, und
 * zwar nur nach `anstehend` (Wiederholen, #63). Auch die fuenf Selbstuebergaenge
 * (`laeuft` -> `laeuft`) fehlen - ein Uebergang auf sich selbst steht nicht in der
 * Tabelle und ist damit abgelehnt.
 */
const ERLAUBTE_UEBERGAENGE: ReadonlySet<string> = new Set([
  `anstehend${TRENNER}laeuft`,          // Torwaechter gibt frei (#59)
  `laeuft${TRENNER}erfolg`,             // Fachdienst meldet Erfolg (#70)
  `laeuft${TRENNER}fehlgeschlagen`,     // Fachdienst meldet Fehler (#70)
  `laeuft${TRENNER}abgebrochen`,        // Abbruch eines laufenden Renders (#62 -> #70)
  `fehlgeschlagen${TRENNER}anstehend`,  // wiederhole, derselbe Eintrag ans Ende (#63)
]);

/**
 * Praedikat fuer Verzweigungen im Main: Darf dieser Auftrag von `von` nach `nach`?
 *
 * Nackter `boolean`, keine Ergebnis-Huelle - `Ergebnis<boolean>` ist nach TK 9.1.1
 * verboten. Die Waechter-Form fuer die IPC-Grenze ist `pruefeUebergang` weiter unten.
 *
 * KEINE Zusatzbedingung: Ob wirklich schon ein anderer Auftrag `laeuft` (serielle
 * Invariante) und ob der Auftrag ueberhaupt noch in Q1 steht, entscheidet der
 * Torwaechter (#59) - diese Funktion sieht zwei Status und sonst nichts.
 */
export function istUebergangErlaubt(von: AuftragStatus, nach: AuftragStatus): boolean {
  // Laufzeit-Pruefung trotz geschlossener Union: Der Typ ist eine Zusage der
  // Aufrufer, keine Schranke. Ein ueber `as unknown as AuftragStatus`
  // eingeschleustes Symbol wuerde in der Zeichenkettenverknuepfung unten einen
  // TypeError werfen ("Cannot convert a Symbol value to a string") - und ein Wurf ist
  // hier ausdruecklich verboten, weil er am Gateway zu `unbekannter_fehler`
  // degradierte und den Grund vernichtete (TK 9.1.1).
  if (typeof von !== 'string' || typeof nach !== 'string') {
    return false;
  }

  // Alles andere - unbekannte Zeichenketten, Selbstuebergaenge, Rueckwege aus
  // terminalen Zustaenden - faellt hier von selbst durch: Was nicht in der Fuenfer-
  // Tabelle steht, ist verboten. Es gibt keine zweite Fallunterscheidung, die eine
  // sechste Moeglichkeit stillschweigend hinzufuegen koennte.
  return ERLAUBTE_UEBERGAENGE.has(`${von}${TRENNER}${nach}`);
}

/**
 * Waechter-Form desselben Urteils: Das Ergebnis kann ein Aufrufer unveraendert an die
 * IPC-Grenze durchreichen.
 *
 * Sie ENTSCHEIDET NICHT SELBST, sondern fragt `istUebergangErlaubt`. Zwei Kopien
 * derselben Tabelle liefen irgendwann auseinander - und zwar lautlos, weil beide
 * Funktionen fuer sich weiter plausibel antworteten.
 *
 * Bei Erfolg `{ ok: true, wert: undefined }`: Das gelungene `ok` IST die Information
 * (TK 9.1.1). Bei Ablehnung immer `ungueltige_eingabe` - einen eigenen Fehlercode
 * erfindet diese Funktion nicht.
 */
export function pruefeUebergang(von: AuftragStatus, nach: AuftragStatus): Ergebnis<void> {
  if (istUebergangErlaubt(von, nach)) {
    return { ok: true, wert: undefined };
  }

  return {
    ok: false,
    fehler: {
      code: 'ungueltige_eingabe',
      // Beide Status im Klartext - reiner Anzeigetext fuer die Fehlersuche im Main.
      // Niemand vergleicht ihn; wer auf diesen Wortlaut prueft statt auf `ok`, baut
      // eine Bindung, die jede Umformulierung bricht.
      meldung: `Übergang von ${alsText(von)} nach ${alsText(nach)} ist nicht vorgesehen.`,
    },
  };
}

/**
 * Macht einen Wert anzeigbar, OHNE ihn umzuwandeln.
 *
 * Weder `String(wert)` noch `${wert}` sind hier sicher: Ein Objekt mit werfendem
 * `toString` bzw. ein Symbol brechen dabei - ausgerechnet auf dem Fehlerpfad, auf dem
 * Fremdwerte ueberhaupt erst ankommen. Deshalb wird nur die ART des Wertes genannt.
 */
function alsText(wert: unknown): string {
  if (typeof wert === 'string') {
    return wert;
  }
  if (wert === null) {
    return 'null';
  }
  return `<${typeof wert}>`;
}
