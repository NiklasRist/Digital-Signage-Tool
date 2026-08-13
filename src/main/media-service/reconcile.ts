// GENERIERT aus dem Signaturblock von Issue #91.
// [media-service] Aufräum-Ablauf zusammensetzen
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
// GERUEST-PRUEFSUMME: c08c3ef276810477
//
// ERLEDIGT (13.08.2026): Die Abschaltzeile fuer no-unused-vars ist mit dem Fuellen
// des Rumpfes entfernt; alle Importe und beide Parameter werden jetzt benutzt.
//
// DIESE DATEI HAT KAUM LOGIK UND TRAEGT TROTZDEM DIE WICHTIGSTE ENTSCHEIDUNG DES
// AUFRAEUMENS: die REIHENFOLGE. Die drei Schritte sehen unabhaengig aus, sind es
// aber nicht - jeder veraendert die Grundlage, auf der der naechste urteilt. In der
// falschen Reihenfolge produzieren dieselben drei korrekten Funktionen ein falsches
// Ergebnis, und zwar OHNE Fehlermeldung.
//
// UND SIE IST KEIN DIENST. "Abweichungen ... bereinigt ausschliesslich der Reconcile
// beim Start; kein periodisches Aufraeumen im laufenden Betrieb." (TK 9.4.8, Punkt 8)
// Kein setInterval, kein fs.watch, kein "nach dem Import nochmal kurz aufraeumen" -
// wer hier einen Timer einbaut, loescht irgendwann die `.part`-Datei eines gerade
// laufenden Imports. Und kein zweites Lock, auch nicht als "Reconcile laeuft"-Flag
// (TK 9.4.8, Punkt 9): Dass der Lauf genau einmal und zum richtigen Zeitpunkt
// geschieht, stellt der Ablauf beim Projektoeffnen sicher (#94), nicht diese Datei.

import { markiereFehlende } from './reconcile-fehlt'
import { holeLoeschungenNach } from './reconcile-loeschungen'
import { entferneWaisen } from './reconcile-waisen'

import type { Ergebnis, GenerischerFehlercode } from '../../shared/contracts/ergebnis'
import type { Asset } from '../../shared/contracts/asset'
import type { ReconcileFehlercode } from './fehlercodes'

// Fremde Aufrufe - vollstaendige Signaturen, damit hier nichts geraten wird
// (GEPRUEFT an den gebauten Dateien, nicht aus dem Issue abgeschrieben):
//   #90:  holeLoeschungenNach(projektId: string)
//           : Promise<Ergebnis<{ erledigt: number; offen: number }, ReconcileFehlercode>>
//         // erledigt = Datei weg UND Vermerk gestrichen; offen = Eintraege, die danach noch in
//         // Q2 stehen. Ein einzelner gescheiterter Loeschversuch ist KEIN Fehler.
//   #88:  entferneWaisen(projektId: string, bekannteDateinamen: Set<string>)
//           : Promise<Ergebnis<{ entfernt: number }, ReconcileFehlercode>>
//         // leere Menge bedeutet: jede Datei im Medienordner ist eine Waise.
//   #89:  markiereFehlende(projektId: string, assets: Asset[])
//           : Promise<Ergebnis<{ markiert: number }, ReconcileFehlercode>>
//         // markiert zaehlt NUR die in diesem Lauf neu auf 'fehlt' gesetzten Assets.
//
// MEHR BRAUCHT DIESE DATEI NICHT - insbesondere KEINE Pfad-Aufloesung. Sie fasst keinen Pfad an:
// `medienOrdner` und `loeseAssetPfad` (#49) rufen die drei Schritte selbst. Ein Aufruf hier waere
// ein ungenutzter Import und die erste Zeile Fachlogik in einer Datei, die keine haben darf.
// Ebenso: kein `fs`, kein `unlink`, kein Zustand-Setzen, keine eigene Pruefung "existiert die
// Datei?". Diese Datei ruft drei Funktionen in einer Reihenfolge auf, addiert nichts hinzu und
// filtert nichts weg.

/**
 * Zeichen, die aus der `projektId` einen Pfad statt eines Segments machen wuerden.
 *
 * Beide Trenner, unabhaengig vom Betriebssystem - dieselbe Ueberlegung wie in `pfade.ts` (#49)
 * und in allen drei Schritten: Ein unter Windows geschriebener Wert wandert per USB-Stick auf
 * einen Mac, und eine Pruefung, die nur den heimischen Trenner kennt, laesst ihn genau dort durch.
 */
const PFAD_TRENNER = ['/', '\\']

export async function reconcile(
  projektId: string,
  assets: Asset[],
): Promise<
  Ergebnis<
    { entfernt: number; markiert: number; erledigt: number; offen: number },
    ReconcileFehlercode
  >
> {
  // EIN Fangnetz um den ganzen Ablauf. Der Reconcile laeuft beim Oeffnen des Projekts; eine
  // durchgereichte Ausnahme wuerde dort das Oeffnen abbrechen, statt einen Befund zu melden -
  // "Kein `throw` nach aussen" (TK 9.1.1, Punkt 2).
  try {
    // GEPRUEFT WIRD VOR DEM ERSTEN SCHRITT: "kein Schritt wird gestartet". Die drei pruefen die
    // `projektId` zwar jeder fuer sich - aber Schritt 1 haette dann schon Q2 gelesen, bevor
    // Schritt 2 dasselbe abweist, und das Ergebnis dieses Ablaufs waere ein Fehler MIT
    // Nebenwirkung. `typeof` trotz `string` in der Signatur: "Der Main validiert jede eingehende
    // Nutzlast" (TK 9.1.1, Punkt 6).
    if (
      typeof projektId !== 'string' ||
      projektId.trim() === '' ||
      PFAD_TRENNER.some((zeichen) => projektId.includes(zeichen)) ||
      projektId.includes('..')
    ) {
      return fehler('ungueltige_eingabe', 'Es wurde keine brauchbare Projekt-ID uebergeben.')
    }

    // EIN LEERES ARRAY IST GUELTIG und wird NICHT abgewiesen - "das Projekt hat keine Medien",
    // dann ist jede Datei im Medienordner eine Waise. Abgewiesen wird nur, was gar kein Array
    // ist: Aus einem String entstuende weiter unten eine Menge seiner BUCHSTABEN, und Schritt 2
    // loeschte den gesamten Medienbestand des Projekts.
    if (!Array.isArray(assets)) {
      return fehler('ungueltige_eingabe', 'Die Asset-Liste fehlt oder ist kein Array.')
    }

    // DIESELBE QUELLE FUER SCHRITT 2 UND SCHRITT 3: die uebergebene Liste. Die Menge entsteht
    // HIER aus ihr und wird NICHT getrennt beschafft - sonst urteilten die beiden Schritte ueber
    // verschiedene Bestaende, und Schritt 2 loeschte eine Datei, die Schritt 3 gleich vermisst.
    // `map` liest nur; das uebergebene Array wird weder sortiert noch veraendert.
    const bekannteDateinamen = new Set(assets.map((asset) => asset.dateiname))

    // ── SCHRITT 1: offene Loeschungen nachholen (#90) ────────────────────────────────────────
    // ZUERST, weil eine gerade erfolgreich nachgeholte Loeschung nicht im selben Lauf als
    // "Waise" wieder auftauchen darf: Nach Schritt 1 ist die Datei weg, Schritt 2 findet sie gar
    // nicht mehr vor. Umgekehrt haetten die Zahlen behauptet, es sei eine Waise beseitigt worden,
    // wo in Wirklichkeit eine vorgemerkte Loeschung nachgeholt wurde.
    const loeschungen = await holeLoeschungenNach(projektId)
    if (!loeschungen.ok) {
      // Schritte 2 und 3 laufen NICHT. Die drei Zahlen im Erfolgsfall sind eine Aussage ueber den
      // Endzustand; ein Lauf, in dem ein Schritt ausgefallen ist, haette sie nicht mehr gedeckt.
      return uebernimm(loeschungen)
    }

    // ── SCHRITT 2: Waisen entfernen (#88) ────────────────────────────────────────────────────
    // NACH Schritt 1 (s. o.) und VOR Schritt 3 (s. u.). Jeder Schritt wird ABGEWARTET; kein
    // Promise.all, keine Parallelisierung "weil es schneller geht": Schritt 2 und 3 urteilen
    // beide ueber den Ordnerinhalt, den Schritt 1 gerade veraendert - parallel gestartet
    // entscheidet der Zufall, wer welchen Zustand sieht.
    const waisen = await entferneWaisen(projektId, bekannteDateinamen)
    if (!waisen.ok) {
      // Schritt 3 laeuft NICHT; die Wirkung von Schritt 1 bleibt bestehen (nichts wird
      // zurueckgenommen - was geloescht ist, ist geloescht, und der Vermerk dazu ist zu Recht
      // gestrichen).
      return uebernimm(waisen)
    }

    // ── SCHRITT 3: fehlende Dateien markieren (#89) ──────────────────────────────────────────
    // ZULETZT. Ob ein D1-Eintrag wirklich ohne Datei dasteht, ist erst NACH beiden vorangehenden
    // Schritten zuverlaessig feststellbar: Schritt 1 kann eine Datei entfernen, Schritt 2
    // ebenfalls; ein vorgezogenes Schritt 3 urteilte ueber einen Ordnerzustand, den es selbst
    // gleich veralten laesst. Der Nutzer saehe rote Eintraege fuer vorhandene Medien, und die
    // gefuehrte Reparatur (FA-19) zwaenge ihn, intakte Elemente neu zu verknuepfen.
    //
    // (Dass Schritt 2 nie eine Datei mit D1-Eintrag anfasst, ist DORT zugesichert - die
    // Reihenfolge ist trotzdem bindend, weil das Ergebnis sonst von einer Zusicherung eines
    // Nachbar-Issues abhinge statt von der Ablauflogik hier.)
    //
    // DIESELBE Liste, aus der oben die Menge entstand - nicht eine zweite, nicht eine gefilterte.
    const fehlende = await markiereFehlende(projektId, assets)
    if (!fehlende.ok) {
      // Die Wirkungen der Schritte 1 und 2 bleiben bestehen.
      return uebernimm(fehlende)
    }

    // ALLE VIER ZAHLEN STAMMEN UNVERAENDERT AUS DEN SCHRITTEN. Hier wird nichts addiert, nichts
    // abgezogen, nichts hergeleitet: `entfernt` aus Schritt 2, `markiert` aus Schritt 3,
    // `erledigt` UND `offen` aus Schritt 1.
    //
    // ZU `offen` (Issue-Nachtrag vom 13.08.2026, der die aeltere Prosa im Abschnitt
    // "Eingang -> Ausgang" ersetzt): Es sind die vorgemerkten Loeschungen, die AUCH DIESES MAL
    // nicht durchgingen. Ohne die Zahl erfaehrt niemand, dass etwas haengt - der Lauf versuchte
    // es bei jedem Projektstart erneut, still und fuer immer, und der Nutzer saehe nur, dass sein
    // Datentraeger nicht leerer wird. "Was der Ablauf bewusst ueberlebt, muss sichtbar sein."
    // Deshalb steht sie im Ergebnis und NICHT in einem selbstgebauten Protokoll.
    //
    // NICHT ZU VERWECHSELN: `erledigt` zaehlt die in DIESEM Lauf endlich weggeraeumten
    // Loeschungen, `offen` die weiterhin haengenden.
    return {
      ok: true,
      wert: {
        entfernt: waisen.wert.entfernt,
        markiert: fehlende.wert.markiert,
        erledigt: loeschungen.wert.erledigt,
        offen: loeschungen.wert.offen,
      },
    }
  } catch (ursache) {
    // "Eine rohe Exception-Meldung wird nie zum Code" (TK 9.1.1, Punkt 3) - der Code ist
    // `unbekannter_fehler`, der Text der Ausnahme reist nur als Begruendung mit. Hierher faellt
    // insbesondere ein `assets`-Array mit Eintraegen, die keine Objekte sind (die Menge oben);
    // einen eigenen Code dafuer gibt es nicht, und erfunden wird keiner.
    return fehler(
      'unbekannter_fehler',
      `Der Aufraeumlauf ist unerwartet gescheitert. Grund: ${textVon(ursache)}`,
    )
  }
}
// - ruft ausschliesslich #90 -> #88 -> #89, in dieser Reihenfolge, jeden abgewartet
// - kein fs, kein Pfad, kein Lock, kein Timer, kein IPC-Kanal, kein reiheEin
// - die vier Zahlen kommen unveraendert aus den Schritten; hier wird nichts gerechnet
// - der erste scheiternde Schritt beendet den Lauf; sein Fehler reist UNVERAENDERT weiter

/**
 * Der Fehler eines Schrittes, unveraendert weitergereicht - Code, Meldung UND `daten`.
 *
 * WEITERGEGEBEN WIRD DAS FEHLEROBJEKT SELBST, nicht eine Abschrift seiner Felder. Wer es Feld
 * fuer Feld neu zusammensetzt, verliert lautlos jedes Feld, das er nicht kennt - heute waere das
 * `daten`, morgen ein weiteres. "Ein Aufrufer, der `daten` nicht kennt, funktioniert unveraendert
 * weiter." (TK 9.1.1) Diese Datei fuellt das Feld nie selbst und liest es nie.
 *
 * Und der Code wird NICHT umgeschrieben: Alle drei Schritte fuehren dieselbe Union
 * (`ReconcileFehlercode` plus die generischen Codes) - nur deshalb passt er ohne Uebersetzung
 * hinein. "Geht der Code verloren, degradieren Reparatur-Modus, Wiederholen und der FAT32-Hinweis
 * alle zu 'irgendwas ist schiefgelaufen'." (TK 9.1.1)
 */
function uebernimm(gescheitert: {
  ok: false
  fehler: {
    code: ReconcileFehlercode | GenerischerFehlercode
    meldung: string
    daten?: unknown
  }
}): Ergebnis<
  { entfernt: number; markiert: number; erledigt: number; offen: number },
  ReconcileFehlercode
> {
  return { ok: false, fehler: gescheitert.fehler }
}

/**
 * Die Fehlerhuelle fuer die zwei Faelle, die HIER entstehen (`ungueltige_eingabe`,
 * `unbekannter_fehler`). Ohne `daten`: "Das Feld ist optional - Codes ohne Zusatzdaten lassen es
 * weg" (TK 9.1.1), und kein Code dieser Datei traegt Zusatzdaten.
 */
function fehler(
  code: ReconcileFehlercode | GenerischerFehlercode,
  meldung: string,
): Ergebnis<
  { entfernt: number; markiert: number; erledigt: number; offen: number },
  ReconcileFehlercode
> {
  return { ok: false, fehler: { code, meldung } }
}

/** Der Text einer Ausnahme, ohne Stacktrace - der reist nicht ueber die Grenze. */
function textVon(ursache: unknown): string {
  return ursache instanceof Error ? ursache.message : String(ursache)
}

// NICHT HIER, UND GEMELDET:
//
// 1. DIE ASSET-LISTE WIRD NICHT SELBST BESCHAFFT. Kein `oeffneProjekt`, kein Lesen von
//    project.json, keine gemerkte Kopie im Modul, und beim `project-store` wird auch keine neue
//    Leseoperation angefordert. "`media-service` besitzt NICHT: das Lesen der Asset-Liste (das
//    macht `project-store`)" (TK 9.4.1); ein exportierter Zugriff auf das geladene Projekt waere
//    eine ZWEITE TUER neben seinen Operationen, von der nur eine am D1-Lock vorbeikaeme.
//
// 2. WORAUF #94 ACHTEN MUSS - EINE NAHT, DIE HIER NUR GEMELDET WERDEN KANN: `markiereFehlende`
//    (#89) reicht den Fehler von `setzeAssetZustand` (#74) unveraendert durch, darunter
//    `nicht_gefunden` und `kein_projekt` - und ein solcher Fehler BRICHT DEN GANZEN AUFRAEUMLAUF
//    AB (Schritt 3 laeuft nicht zu Ende, der Fehler reist von hier nach oben). Das trifft ein,
//    sobald `assets` und `projektId` nicht zum GEOEFFNETEN Projekt gehoeren: eine fremde
//    Projekt-ID, eine veraltete Liste, eine Asset-ID, die D1 nicht mehr kennt. Diese Datei kann
//    das nicht pruefen - sie darf die Liste nicht lesen (Punkt 1) und kennt das geladene Projekt
//    nicht. Die Zusicherung liegt bei #94: `projektId` und `projekt.assets` MUESSEN aus DERSELBEN
//    Rueckgabe von `oeffneProjekt` (#34) stammen, und zwischen beidem darf kein Projektwechsel
//    liegen.
//
// 3. KEIN TEILWEISER ERFOLG, KEINE MISCHFORM "ok mit Warnungen". Entweder alle drei Schritte sind
//    gelaufen (`ok: true` mit den vier Zahlen) oder es liegt ein Fehler vor. Die Faelle, die man
//    als "Warnung" empfinden koennte - eine nicht loeschbare Waise, eine weiterhin offene
//    Loeschung -, sind in den Schritten selbst ausdruecklich KEIN Fehler und stecken in den
//    Zahlen (`offen`, und die um eins kleinere `entfernt`).
//
// 4. DIE REIHENFOLGE IST NICHT KONFIGURIERBAR. Kein Parameter, kein Schalter, keine "schnelle
//    Variante ohne Schritt 2" - die Begruendung steht an den drei Schritten oben.
//
// 5. KEIN EIGENER LOGGER. Diese Datei protokolliert nichts: Was sie zu sagen hat, steht in den
//    vier Zahlen des Ergebnisses. (Der frueher hier vorgesehene interne Vermerk fuer `offen` ist
//    mit dem Issue-Nachtrag vom 13.08.2026 entfallen - die Zahl reist jetzt sichtbar mit.)
