// GENERIERT aus dem Signaturblock von Issue #54.
// [auftrags-manager] Q1-Warteschlange im Arbeitsspeicher führen
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
// GERUEST-PRUEFSUMME: 9e87c2333f17ecda
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

import type { Auftrag } from '../../shared/contracts/auftrag';

/** Interner Datensatz UM den Auftrag herum. Verlässt dieses Modul NICHT nach außen (IPC/UI). */
export interface Q1Eintrag {
  auftrag: Auftrag;
  begonnenAm: string | null;   // ISO-8601 UTC; null, solange der Auftrag anstehend ist
}

// ---------------------------------------------------------------------------
// DER GESAMTE ZUSTAND VON Q1: ein modul-privates Array in Einfuegereihenfolge.
//
// WARUM EIN ARRAY UND KEINE MAP: Die zwei wichtigsten Fragen an Q1 sind
// Reihenfolge-Fragen ("der aelteste anstehende", "die Liste fuers Panel"). Ein
// Array HAT diese Reihenfolge; eine Map muesste sie in einem zweiten Feld
// nachfuehren, das beim Entfernen aus der Mitte auseinanderlaufen kann. Die
// Schlange ist durch Nutzerhandlungen begrenzt (eine Handvoll Eintraege), das
// lineare Suchen kostet hier nichts.
//
// WARUM `const` UND KEIN NEUZUWEISEN: Alle Aufrufer halten ausschliesslich
// Verweise auf die EINTRAEGE, nie auf das Array - aber ein `let` liesse die
// Versuchung zu, den Zustand irgendwo durch ein neues Array zu ersetzen. Entfernt
// wird deshalb mit `splice`, nicht mit `filter` + Zuweisung.
//
// WARUM NICHT EXPORTIERT (DoD): Waere das Array selbst nach aussen sichtbar,
// koennte jeder Aufrufer daran vorbei einfuegen, sortieren oder leeren - die
// serielle Invariante haette dann keinen einzigen Ort mehr, an dem sie gilt.
// Aus demselben Grund liegt der Zustand NICHT auf `globalThis`.
//
// FLUECHTIG (TK 9.3, Speichertabelle Q1): Dieses Array ist der einzige Ort, an
// dem Q1 existiert. Es gibt hier bewusst keinen `fs`-Import und keinen
// Persistenz-Pfad - in-flight-Arbeit ist nach einem Neustart nicht fortsetzbar
// (T1 verworfen, ffmpeg tot), und ein wiederhergestellter halber Render wuerde
// ohne Arbeitsbereich und ohne Prozess "auferstehen".
const eintraege: Q1Eintrag[] = [];

export function fuegeAnsEndeAn(auftrag: Auftrag): number {
  // Erst nachsehen, ob die ID schon da ist. Alle IDs sind UUIDs (#20), ein
  // zweites Vorkommen kann also nur ein Programmierfehler des Aufrufers sein.
  // Was hier NICHT passiert und warum:
  //   - kein zweiter Eintrag: derselbe Auftrag liefe zweimal - bei `import` oder
  //     `export` echter Schaden (Datei zweimal kopiert, Zieldatei ein zweites Mal
  //     ueberschrieben), waehrend das stille Verwerfen folgenlos bleibt;
  //   - kein Ersetzen: das koennte einen LAUFENDEN Auftrag unter der Hand
  //     austauschen - der Torwaechter haelt dann einen Eintrag fuer den Lauf, den
  //     ffmpeg gar nicht bearbeitet;
  //   - kein Verschieben ans Ende: das braeche die FIFO-Reihenfolge fuer einen
  //     Eintrag, der bereits wartet.
  // Zurueck kommt die Position des VORHANDENEN Eintrags, damit der Aufrufer
  // (#61) in der Q4-Bewegung `eingereiht` keine erfundene Zahl schreibt.
  const vorhanden = eintraege.findIndex((e) => e.auftrag.auftragId === auftrag.auftragId);
  if (vorhanden !== -1) {
    return vorhanden + 1;
  }

  // Ans ENDE anhaengen - das ist die FIFO-Zusage aus TK 9.3.5, und sie gilt
  // ausdruecklich auch fuer `wiederhole` (#65), das hier ebenfalls hereinkommt.
  //
  // `begonnenAm` startet als null: Der Auftrag ist beim Einreihen anstehend, und
  // ein hier gesetzter Zeitstempel waere die Einreih-, nicht die Startzeit - der
  // Q3-Protokolleintrag (#70) wuerde damit eine falsche Laufzeit ausweisen. Den
  // echten Wert setzt der Torwaechter (#59) beim Start am lebenden Eintrag.
  //
  // `status` wird hier NICHT gesetzt: Der Auftrag kommt fertig mit
  // `status: 'anstehend'` vom Aufrufer (#61). Dieses Modul plant und ordnet nur
  // (TK 9.3), es aendert keine Fachdaten.
  eintraege.push({ auftrag, begonnenAm: null });

  // 1-basiert: Der erste Eintrag hat Position 1, nicht 0. Nach dem Anhaengen ist
  // die Laenge genau diese Position - das ist der Wert NACH dem Einfuegen, so wie
  // ihn #61 in die Q4-Bewegung schreibt.
  return eintraege.length;
}

export function findeQ1(auftragId: string): Q1Eintrag | undefined {
  // `find` gibt den INTERNEN, lebenden Eintrag heraus - keine Kopie, kein
  // structuredClone, kein Spread. Das ist Absicht und die wichtigste Eigenschaft
  // dieser Datei: Die Aufrufer (#59, #70) setzen `auftrag.status`,
  // `auftrag.versuche`, `auftrag.fortschritt`, `auftrag.fehler` und `begonnenAm`
  // direkt an diesem Objekt. Gaebe es hier eine Kopie, liefe jeder Statuswechsel
  // ins Leere: `laufender()` bliebe dauerhaft `undefined`, der Torwaechter saehe
  // nie einen laufenden Auftrag und startete bei jedem Aufruf einen weiteren -
  // die serielle Invariante braeche LAUTLOS, ohne Fehlermeldung.
  //
  // Kein Treffer ist ein normaler Fall, kein Fehler: `undefined` genuegt, und ob
  // daraus fachlich `nicht_gefunden` wird, entscheidet der Aufrufer (#62).
  return eintraege.find((e) => e.auftrag.auftragId === auftragId);
}

export function entferneAusQ1(auftragId: string): boolean {
  const stelle = eintraege.findIndex((e) => e.auftrag.auftragId === auftragId);
  if (stelle === -1) {
    // Q1 bleibt unveraendert. Kein Wurf: Diese Funktionen werden aus
    // IPC-bedienten Operationen heraus benutzt, und eine Ausnahme wuerde am
    // Gateway zu `unbekannter_fehler` degradieren und den echten Grund
    // vernichten (TK 9.1.1).
    return false;
  }

  // `splice` entfernt AN DER STELLE und laesst die Reihenfolge der uebrigen
  // Eintraege unangetastet - auch beim Entfernen aus der Mitte. Genau darauf
  // beruht, dass `naechsterAnstehender` weiterhin FIFO liefert.
  //
  // ENTFERNT WIRD UNABHAENGIG VOM STATUS, also auch ein Eintrag mit
  // `status: 'laeuft'`. Ob das zulaessig ist, weiss allein der Aufrufer
  // (`entferne` #62 lehnt einen laufenden ab, `beendeAuftrag` #70 raeumt ihn
  // gerade deshalb weg). Eine Pruefung hier waere eine zweite, konkurrierende
  // Regel an einer Stelle, die die fachlichen Bedingungen gar nicht kennt.
  eintraege.splice(stelle, 1);
  return true;
}

export function naechsterAnstehender(): Q1Eintrag | undefined {
  // `find` liefert den ERSTEN Treffer in Array- also Einfuegereihenfolge - das
  // ist die FIFO-Auswahl aus TK 9.3.3. Der laufende Auftrag wird dabei
  // uebersprungen, weil sein Status nicht 'anstehend' ist; ein gesondertes
  // Ausblenden braucht es nicht.
  //
  // REINE AUSWAHL, KEIN STATUSWECHSEL: Das Umstellen auf 'laeuft' - und damit
  // die Entscheidung, ob ueberhaupt gestartet werden darf - gehoert dem
  // Torwaechter (#59). Wuerde hier schon umgestellt, waere allein das Nachsehen
  // ein Start, und zwei Nachsehende starteten zwei Auftraege.
  return eintraege.find((e) => e.auftrag.status === 'anstehend');
}

export function laufender(): Q1Eintrag | undefined {
  // Es darf NIE mehr als einen geben - das ist die serielle Invariante und der
  // einzige Sperr-Mechanismus des Systems (TK 9.3.5); ein zweites Lock daneben
  // waere weder noetig noch erlaubt.
  //
  // Deshalb steht hier `find` und nicht `filter(...).length === 1` mit Wurf: Ein
  // Wurf verginge sich gegen die Zusage, dass diese Datei keine Fehlerpfade nach
  // aussen hat, und wuerde am Gateway ohnehin zu `unbekannter_fehler`. Und
  // durchsetzen laesst sich die Invariante hier gar nicht: Den Status setzt der
  // Torwaechter, dieses Modul liest ihn nur.
  return eintraege.find((e) => e.auftrag.status === 'laeuft');
}

export function alleQ1(): Auftrag[] {
  // Die Reihenfolge fuer die Oberflaeche: laufender zuerst, danach die
  // anstehenden in FIFO-Reihenfolge, ganz am Ende die (nur kurzzeitig
  // vorhandenen) terminalen Eintraege zwischen Statuswechsel und Entfernen in
  // #70.
  //
  // WARUM AUSDRUECKLICH SORTIERT UND NICHT EINFACH DAS ARRAY: Meist steht der
  // laufende Auftrag ohnehin vorn, weil er der aelteste ist - aber eben nur
  // meist. Entfernt der Nutzer einen wartenden Auftrag, oder haengt `wiederhole`
  // einen Fehlschlag hinten an, kann jede andere Anordnung entstehen. Die
  // Reihenfolge des Panels darf nicht davon abhaengen, wie das Array gerade
  // zufaellig aussieht.
  //
  // Drei `filter`-Durchlaeufe statt eines `sort`: `sort` braeuchte eine
  // Rangfunktion ueber fuenf Status-Werte, und nur die Stabilitaet der
  // Sortierung wuerde die FIFO-Reihenfolge innerhalb einer Gruppe retten.
  // Filtern sagt dasselbe ohne diese Voraussetzung, und die Reihenfolge
  // innerhalb jeder Gruppe ist per Konstruktion die Einfuegereihenfolge.
  const laufende = eintraege.filter((e) => e.auftrag.status === 'laeuft');
  const anstehende = eintraege.filter((e) => e.auftrag.status === 'anstehend');
  const terminale = eintraege.filter(
    (e) => e.auftrag.status !== 'laeuft' && e.auftrag.status !== 'anstehend',
  );

  // NEUES Array mit denselben `Auftrag`-Referenzen - die einzige Stelle in
  // diesem Modul, die kopiert. Kopiert wird nur die LISTE: Wer sie umsortiert
  // oder Eintraege daraus entfernt, veraendert Q1 nicht. Die Auftraege selbst
  // bleiben dieselben Objekte, sonst waere der Fortschritt im Panel eine
  // Momentaufnahme von gestern.
  //
  // Und ohne `begonnenAm`: Der interne `Q1Eintrag` verlaesst dieses Modul nicht.
  // Nach aussen - `holeStand` (#64), Ereignis `queue:geaendert` - wandert
  // ausschliesslich `Auftrag[]`. `begonnenAm` existiert nur, weil der
  // Q3-Protokolleintrag es braucht und der Typ `Auftrag` (#16) dafuer nicht
  // geaendert wird.
  //
  // Bei leerer Schlange kommt hier ein leeres Array heraus, nie null/undefined.
  return [...laufende, ...anstehende, ...terminale].map((e) => e.auftrag);
}

export function hatAuftraegeFuerProjekt(projektId: string): boolean {
  // NACHGETRAGEN 12.08.2026. Beim Bau von #54 fehlte diese Funktion im verbindlichen
  // Signaturblock - sie stand nur im Fliesstext des Issues, und der Bauende hat sie deshalb
  // zu Recht nicht gebaut, sondern gemeldet (Regel C: verbindlich heisst entschieden).
  // Inzwischen steht sie im Block; hier nachgezogen, weil der Generator die Datei nach dem
  // Fuellen nicht mehr anfasst.
  //
  // WOFUER: Das Loeschen eines Projekts (#37) ist eine Instant-Operation und laeuft am
  // Torwaechter vorbei - dessen `loeschen`-Auftragsart meint das Loeschen eines MEDIUMS.
  // Ein laufender Render fuer dasselbe Projekt verloere mitten im Lauf seinen Ordner und
  // legte Teile davon per mkdir wieder an. Der Nutzer bekommt stattdessen eine verstaendliche
  // Meldung.
  //
  // TERMINALE EINTRAEGE ZAEHLEN NICHT: 'erfolg', 'fehlgeschlagen' und 'abgebrochen' halten
  // keinen Ordner mehr. Wuerden sie mitzaehlen, waere ein Projekt nach dem ersten
  // fehlgeschlagenen Render dauerhaft unloeschbar - Q1 haelt seine Eintraege bis zum
  // Abschluss der Sitzung.
  return eintraege.some(
    (e) =>
      (e.auftrag.status === 'laeuft' || e.auftrag.status === 'anstehend') &&
      e.auftrag.payload.projektId === projektId,
  );
}
