// GENERIERT aus dem Signaturblock von Issue #124.
// [composer] Ein Element aus der Wiedergabeliste entfernen
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
// GERUEST-PRUEFSUMME: 7f8f72e90d58b234
//
// ---------------------------------------------------------------------------
// "ENTFERNEN" HEISST HIER: NUR DER LISTENEINTRAG. NICHTS SONST.
//
// Die Loeschsemantik ist ausdruecklich ASYMMETRISCH (TK 9.5.3): "Medium loeschen
// (media-service 9.4.6): blockiert bei Referenz (asset_referenziert). Die Datei ist
// die schwere, geteilte Ressource; versehentlicher Verlust waere teuer." Und: "Die
// von der Aktion verwendeten Medien-Assets bleiben unangetastet und projektweit
// verfuegbar - eine Aktion referenziert ein Asset nur, sie besitzt es nicht."
//
// Daraus folgt fuer diese Datei das schaerfste ihrer Verbote: Sie ruft
// AUSSCHLIESSLICH den einen Kanal aus der Registry
// (KANAELE.project.entferneElement). Keinen Kanal des media-service, kein
// `loescheAktion`, keine "das braucht ja jetzt niemand mehr"-Aufraeumlogik.
// Ein Asset kann in
// mehreren Listenelementen UND in Aktionen stecken, eine Aktion darf mehrfach
// referenziert sein - wer hier mitloescht, nimmt dem Nutzer Material weg, das an
// anderer Stelle noch benutzt wird. Verwaiste Dateien behandelt der Reconcile des
// media-service (TK 9.4.7), nicht der composer.
//
// UND KEINE ZUSATZPRUEFUNG AUF KAPUTTE ELEMENTE. Der gefuehrte Reparatur-Modus
// benutzt genau diesen Weg: "Fix-Optionen je Element: Medium neu
// verknuepfen/importieren (media-service), durch ein anderes ersetzen (Referenz
// umsetzen), oder das Element entfernen (entferneElement, project-store). Es werden
// ausschliesslich bestehende Operationen genutzt." (TK 9.7.5) Ein Element, dessen
// `ref` auf ein Asset mit `zustand: 'fehlt'` zeigt, geht deshalb denselben einen Weg
// wie ein heiles. Eine "Sicherheitspruefung" hier verriegelte die Reparatur gegen
// sich selbst - der Nutzer will das kaputte Element ja gerade loswerden.
//
// NICHT OPTIMISTISCH. TK 9.7.3 nennt "Reorder/Trim/Dauer" als die optimistisch
// bedienten Vorgaenge; Entfernen steht dort nicht. Das Element verschwindet erst
// nach `ok: true` aus der Sicht. Damit gibt es hier auch KEINEN Rollback-Pfad: Wo
// nichts vorweggenommen wird, ist nichts zurueckzunehmen, und die Sicht bleibt bei
// JEDEM Fehlschlag unberuehrt. Der Rollback aus Fehlerklasse 1 wohnt in #126, und
// eine zweite Stelle dafuer waere genau die Doppelung, die dort vermieden wird.
// Fehlerklasse 2 (Auto-Speichern schlaegt spaeter fehl) ist hier ebenfalls kein
// Thema: kein Rollback, nur warnen - und zustaendig dafuer ist #126, nicht diese
// Datei.
//
// KEIN UNDO. FA-21 / TK 9.13 ist M7: kein Stapel, kein "zuletzt entfernt"-Gedaechtnis,
// kein Zwischenspeichern des entfernten Elements "fuer spaeter". Und keine
// Rueckfrage, kein Papierkorb - ob die Oberflaeche vorher fragt, entscheidet die
// Oberflaeche.

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'
import { holeSicht, setzeListe } from './projektzustand'

/** Entfernt genau ein Listenelement aus der Wiedergabeliste. */
export async function entferneElementAusListe(elementId: string): Promise<Ergebnis<void>> {
  // `typeof` trotz `string` in der Signatur: Die Kennung kommt aus der Oberflaeche
  // (Listenzeile, Reparatur-Fuehrung) und kann dort aus einer ungetypten Quelle
  // stammen. Gemessen wird mit `trim()` - dieselbe Grenze, die die Nutzlast-Pruefung
  // des ipc-gateway zieht ("entferneElement braucht eine nicht leere elementId").
  // Zwei verschiedene Grenzen an derselben Naht waeren die Sorte Abweichung, die
  // erst beim Kunden auffaellt.
  //
  // Ob es das Element GIBT, prueft diese Datei ausdruecklich nicht - das ist Sache
  // des Main (#42, `nicht_gefunden`).
  if (typeof elementId !== 'string' || elementId.trim() === '') {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: 'entferneElementAusListe braucht eine nicht leere elementId.',
      },
    }
  }

  // KEIN Projekt geladen -> gar nicht erst fragen. Der Main haette keine Liste, aus
  // der er etwas streichen koennte, und die Sicht koennte das Ergebnis nirgends
  // aufnehmen.
  if (holeSicht().projekt === null) {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: 'Es ist kein Projekt geladen, aus dessen Wiedergabeliste entfernt werden koennte.',
      },
    }
  }

  // Die Nutzlast ist AUSSCHLIESSLICH `{ elementId }` - so verlangt es die
  // Form-Pruefung des ipc-gateway, die daraus `entferneElement(nutzlast.elementId)`
  // macht. Die Kennung geht UNVERAENDERT hinaus: `trim()` oben ist eine Messung,
  // keine Umformung; wer hier den gekuerzten Wert schickte, veraenderte
  // stillschweigend eine ID.
  const antwort = await rufeAuf<void>(KANAELE.project.entferneElement, { elementId })

  if (!antwort.ok) {
    // Unveraendert durchgereicht - Code UND Meldung; insbesondere wird das Element
    // bei `nicht_gefunden` NICHT "vorsichtshalber" auch lokal entfernt. Weiss der
    // Main nichts davon, ist entweder die Sicht veraltet (dann repariert das kein
    // blindes Streichen) oder die Kennung falsch (dann waere das Streichen ein
    // Datenverlust ohne Deckung im Store).
    return antwort
  }

  // ERST JETZT die Sicht anfassen, und zwar mit dem Stand von JETZT: `holeSicht()`
  // wird nach dem `await` erneut geholt. Ein vor dem Aufruf gemerkter Stand waere
  // waehrend der Wartezeit veraltet - ein parallel gelaufenes Hinzufuegen oder
  // Umsortieren wuerde beim Zurueckschreiben rueckgaengig gemacht.
  const projekt = holeSicht().projekt
  if (projekt !== null) {
    // `filter` baut ein NEUES Array und laesst das alte in Ruhe
    // (Unveraenderlichkeits-Invariante aus #121); kein `splice`, kein Herausschneiden
    // an Ort und Stelle. Die uebrigen Elemente behalten dabei ihre relative
    // Reihenfolge und ruecken auf: "Die Reihenfolge ist die Array-Reihenfolge von
    // `liste` - es gibt kein separates `position`-Feld." (TK 9.11.3) Es bleibt keine
    // Luecke, kein Platzhalter, kein `undefined`.
    //
    // Angefasst wird ausschliesslich `liste`; `setzeListe` (#121) laesst `assets` und
    // `aktionen` unberuehrt - genau die Grenze aus TK 9.5.3.
    setzeListe(projekt.liste.filter((vorhanden) => vorhanden.id !== elementId))
  }
  // Ist das Projekt waehrend des Aufrufs verschwunden (geschlossen, geloescht), wird
  // NICHTS ersatzweise gesetzt. Der Erfolg wird trotzdem ehrlich zurueckgemeldet -
  // er hat stattgefunden.

  return antwort
}
