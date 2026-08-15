// GENERIERT aus dem Signaturblock von Issue #132.
// [composer] Durch die Reparatur führen
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
// GERUEST-PRUEFSUMME: 8bc7a693baff0247
//
// ---------------------------------------------------------------------------
// Diese Datei FUEHRT nur - sie repariert nichts, sie ruft keine Store-Operation
// und keinen IPC-Kanal, und sie kennt keine Reiter. Sie rechnet aus dem jeweils
// uebergebenen Projektstand, wo der Nutzer gerade steht und wie weit er ist.
//
// Der Stand ist ein WERT, keine Klasse und keine Modulvariable: Er muss ueber
// einen Reiterwechsel hinweg ueberleben (TK 9.14.2, "Der Fortschritt 'X von N
// behoben' bleibt dabei ueber den Reiterwechsel hinweg sichtbar"). Gehalten wird
// er von der app-shell (#201 `ShellReparatur.stand`), durchgereicht an den
// composer (#261 `ComposerVerdrahtung.reparatur`, ausdruecklich "wird NUR
// GELESEN"). Laege er hier als Modulvariable, waere er an die Lebensdauer dieses
// Renderer-Moduls gebunden und die Zusage nicht mehr pruefbar.
//
// Und die zweite Grundentscheidung: Es wird IMMER neu gerechnet, nie eine Wirkung
// vorhergesagt. Nur so sinkt "X von N" um MEHR ALS EINS, wenn ein einziger Fix an
// einer Aktion drei Verwendungen auf einmal behebt (TK 9.7.5) - und nur so
// verschwindet eine Stelle wieder, wenn der Nutzer die Datei zurueckkopiert hat
// (TK 9.4.7 setzt `zustand` dann auf 'ok').

import type { Project } from '../../shared/contracts/project'
import { findeKaputteStellen } from './kaputt-erkennung'
import type { KaputteStelle } from './kaputt-erkennung'

export interface ReparaturStand {
  aktiv: boolean
  offen: KaputteStelle[]      // in der Reihenfolge aus findeKaputteStellen
  gesamt: number              // N – wächst nie zurück, s. Ablauf 3
  behoben: number             // X = gesamt - offen.length
  zeigerIndex: number         // Position in `offen`, auf die die UI zeigt
  aktuelle: KaputteStelle | null   // offen[zeigerIndex] bzw. null, wenn nichts offen ist
}

/**
 * Haelt den Zeiger im gueltigen Bereich `[0, laenge - 1]`; bei leerer Liste 0.
 *
 * `Math.trunc` und die NaN-Pruefung sind kein Zierrat: `offen[1.5]` und
 * `offen[NaN]` sind beide `undefined`. Ohne sie stuende `aktuelle: null` bei
 * NICHT leerer `offen`-Liste - die Fuehrung waere still stehengeblieben, obwohl
 * der Fortschritt noch offene Stellen zeigt. Geworfen wird nie (Fehlerpfad-
 * Tabelle: "auf gueltigen Bereich geklemmt, kein Wurf").
 *
 * Nur `NaN` faellt auf 0 zurueck, denn es hat keine Richtung - jeder Vergleich
 * mit ihm ist falsch, und `Math.min`/`Math.max` reichten es unveraendert durch.
 * `Infinity` dagegen wird NICHT abgefangen, sondern regulaer geklemmt: Der
 * Vertrag sagt "geklemmt auf [0, offen.length - 1]", und die naechstgelegene
 * gueltige Position zu `+Infinity` ist das ENDE der Liste, nicht ihr Anfang.
 * Ein Sprung ans Ende, der stillschweigend an den Anfang fuehrt, waere fuer den
 * Nutzer nicht von einem Zuruecksetzen des Zeigers zu unterscheiden.
 */
function klemmeZeiger(index: number, laenge: number): number {
  if (laenge === 0) return 0
  if (Number.isNaN(index)) return 0
  return Math.min(Math.max(Math.trunc(index), 0), laenge - 1)
}

/** Startet den geführten Modus für den aktuellen Projektstand. */
export function starteReparatur(projekt: Project): ReparaturStand {
  const offen = findeKaputteStellen(projekt)

  // Der EINZIGE Uebergang `aktiv: false -> true` im ganzen Modul (s.
  // `aktualisiereReparatur`). Ist nichts kaputt, gibt es nichts zu fuehren.
  //
  // Die Datei ist dabei ausloeser-neutral: Ob der Render-Versuch oder der Hinweis
  // direkt nach dem Oeffnen hierher fuehrt (TK 9.7.5 nennt beides), entscheidet
  // der Aufrufer - hier gibt es keinen Selbststart, keine "gerade geoeffnet"-
  // Pruefung und keinen Timer.
  return {
    aktiv: offen.length > 0,
    offen,
    gesamt: offen.length,
    behoben: 0,
    zeigerIndex: 0,
    aktuelle: offen[0] ?? null,
  }
}

/** Rechnet nach jeder Änderung neu – aus DEM Projektstand, nicht aus vermuteten Wirkungen. */
export function aktualisiereReparatur(stand: ReparaturStand, projekt: Project): ReparaturStand {
  const neuOffen = findeKaputteStellen(projekt)

  // N waechst, schrumpft aber nie. `stand.gesamt - stand.offen.length` ist das
  // bisher Behobene; kommt eine NEUE kaputte Stelle hinzu, steigt N auf die neue
  // Gesamtzahl, statt dass X zurueckspringt. Ein rueckwaerts laufender
  // Fortschritt sieht wie ein Fehler der Anwendung aus, auch wenn er rechnerisch
  // stimmt - und er zerstoert das Vertrauen in die Zusage "erst wenn alles
  // behoben ist".
  //
  // Dass `behoben` dabei nie negativ wird, haengt an der Invariante
  // `gesamt >= offen.length`. Die ist geschlossen: `starteReparatur` setzt
  // gesamt = offen.length, diese Zeile haelt gesamt >= neuOffen.length, und
  // `springeZu`/`beendeReparatur` ruehren an beiden Zahlen nicht.
  const gesamt = Math.max(stand.gesamt, neuOffen.length + (stand.gesamt - stand.offen.length))

  // Der Zeiger bleibt STEHEN - dadurch springt die UI automatisch weiter: Ist die
  // Stelle an Position i behoben, rutscht die naechste offene genau auf i nach.
  // Kein Zuruecksetzen, kein Hochzaehlen - und kein Sonderfall dafuer, dass ein
  // Fix mehrere Stellen auf einmal entfernt.
  const zeigerIndex = klemmeZeiger(stand.zeigerIndex, neuOffen.length)

  return {
    // `aktiv` wird hier NIE eingeschaltet, nur aus. Nach `beendeReparatur` steht
    // der Stand auf false, waehrend `offen` weiter gefuellt ist; wuerde daraus
    // erneut true abgeleitet, risse die naechste beliebige Aenderung den Nutzer in
    // den Modus zurueck, den er gerade verlassen hat - bei jeder Aenderung aufs
    // Neue. Der Verzicht kostet nichts: Die Render-Sperre haengt nicht an `aktiv`,
    // sondern an `istRenderFreigegeben`.
    aktiv: stand.aktiv && neuOffen.length > 0,
    offen: neuOffen,
    gesamt,
    behoben: gesamt - neuOffen.length,
    zeigerIndex,
    aktuelle: neuOffen[zeigerIndex] ?? null,
  }
}

/** Manuelles Überspringen/Zurückgehen; klemmt auf den gültigen Bereich. */
export function springeZu(stand: ReparaturStand, index: number): ReparaturStand {
  // Ueberspringen ist erlaubt, Freigeben nicht: Der Nutzer darf eine Stelle
  // zurueckstellen, an der er gerade nicht weiterkommt (die Datei liegt auf einem
  // anderen Rechner). An der Sperre aendert das nichts - "eins nach dem anderen"
  // ist eine Fuehrung, kein Zwangsablauf.
  //
  // Bewegt wird deshalb NUR der Zeiger: `gesamt`, `behoben`, `aktiv` und der
  // Inhalt von `offen` bleiben, wie sie waren.
  const offen = [...stand.offen]
  const zeigerIndex = klemmeZeiger(index, offen.length)

  return { ...stand, offen, zeigerIndex, aktuelle: offen[zeigerIndex] ?? null }
}

/** Verlässt den geführten Modus, ohne etwas zu reparieren. Die Render-Sperre bleibt bestehen. */
export function beendeReparatur(stand: ReparaturStand): ReparaturStand {
  // Ohne an `gesamt`, `behoben` oder `offen` zu ruehren: Der Nutzer darf den
  // gefuehrten Modus verlassen, aber die Sperre bleibt - `istRenderFreigegeben`
  // fragt ohnehin das Projekt.
  //
  // Die flache Kopie von `offen` haelt die beiden Staende voneinander frei: Der
  // Typ ist ein schreibbares Array, und die app-shell haelt Staende ueber einen
  // Reiterwechsel hinweg (TK 9.14.2). Wuerde ein spaeterer Halter das Array in
  // Ruhe sortieren, aenderte er sonst rueckwirkend den alten Stand mit.
  return { ...stand, aktiv: false, offen: [...stand.offen] }
}

/** Die einzige Freigabe-Auskunft des composer. */
export function istRenderFreigegeben(projekt: Project): boolean {
  // Bewusst aus dem PROJEKT, nicht aus dem `ReparaturStand`: "Erst wenn KEIN
  // kaputtes Element mehr existiert, ist der Render wieder frei. So kann ein Lauf
  // nicht an einem uebersehenen kaputten Element scheitern." (TK 9.7.5)
  //
  // Eine aus dem Stand abgeleitete Freigabe liesse sich durch `beendeReparatur`
  // oder einen veralteten Stand aushebeln; es gaebe zwei Wahrheiten darueber, ob
  // das Projekt renderbar ist - und die eine davon gaebe den Render faelschlich
  // frei.
  return findeKaputteStellen(projekt).length === 0
}
