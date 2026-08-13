// GENERIERT aus dem Signaturblock von Issue #96.
// [vorlagen-store] Die drei eingebauten Vorlagen als Daten anlegen
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
// GERUEST-PRUEFSUMME: 47fc4c8ba554fb9a

import type { Vorlage } from '../../shared/contracts/vorlage'
// #95 – src/shared/contracts/vorlage.ts:
//   export type VorlagenArt = 'vollflaeche' | 'split' | 'einblendung'
//   export type Bindung = 'titel'|'beschreibung'|'preis'|'cta'|'bild'|'logo'|'slogan'
//   export interface Rahmen { x: number; y: number; breite: number; höhe: number }
//   export interface Ausrichtung { horizontal: 'links'|'mitte'|'rechts'
//                                  vertikal: 'oben'|'mitte'|'unten' }
//   export interface ZonenText { schriftRolle: SchriftRolle; farbRolle: FarbRolle
//                                größeMax: number; größeMin: number; maxZeilen: number }
//   export interface ZonenBild { einpassung: 'contain' | 'cover' }
//   export interface ZonenDeko { füllungFarbRolle?: FarbRolle; radius?: number
//                                statischerText?: string
//                                verlauf?: { vonFarbRolle: FarbRolle; bisFarbRolle: FarbRolle
//                                            richtung: 'oben'|'unten'|'links'|'rechts' } }
//   export interface Zone { id: string; rolle: 'fest'|'frei'; bindung: Bindung | null
//                           rahmen: Rahmen; ausrichtung: Ausrichtung
//                           wennLeer: 'leer'|'ausblenden'
//                           text?: ZonenText; bild?: ZonenBild; deko?: ZonenDeko }
//   export interface Vorlage { id: string; name: string; art: VorlagenArt; höhe: number | null
//                              parent: string | null; eingebaut: boolean; zonen: Zone[] }

/** Die IDs der mitgelieferten Vorlagen – Reihenfolge = Reihenfolge im Anfangsbestand. */
export const EINGEBAUTE_VORLAGEN_IDS = ['vollbild', 'split', 'band-standard'] as const

/**
 * Liefert bei JEDEM Aufruf eine frische, TIEFE Kopie der drei mitgelieferten Vorlagen.
 * Bewusst eine Funktion und kein exportiertes Array: Ein gemeinsam genutztes Array liesse sich von
 * einem Aufrufer versehentlich in-place aendern, und der Anfangsbestand waere fuer die restliche
 * Prozesslaufzeit verfaelscht – ein Fehler, der erst nach einem Neustart wieder verschwindet und
 * deshalb praktisch nicht reproduzierbar ist.
 */
export function eingebauteVorlagen(): Vorlage[] {
  return [vollbild(), split(), bandStandard()]
}

// WIE DIE TIEFE KOPIE ZUSTANDE KOMMT - und warum hier keine Kopierroutine steht:
// Jede der drei Vorlagen wird bei jedem Aufruf aus Literalen NEU aufgebaut. Kein
// eingefrorenes Modul-Objekt, kein structuredClone, kein Spread. Die Frische ist damit
// strukturell und haengt nicht an einer Kopierfunktion, die man beim naechsten
// verschachtelten Feld zu erweitern vergisst - genau dort entstuende sonst ein geteiltes
// Teilobjekt, das den Anfangsbestand fuer die restliche Prozesslaufzeit verfaelscht.
//
// AUS DEMSELBEN GRUND steht in dieser Datei KEIN gemeinsam genutztes Hilfsobjekt, auch
// nicht fuer die immer gleiche `ausrichtung` oder den immer gleichen Vollflaechen-Rahmen.
// Ein `const LINKS_OBEN = { … }` waere in allen Rueckgaben DASSELBE Objekt; die
// Vorlagen saehen kopiert aus und teilten sich doch eine Ebene. Die Wiederholung ist der
// Preis dafuer und bewusst bezahlt.
//
// DIE ZAHLEN stammen Zeile fuer Zeile aus den drei Tabellen in TK 9.11.1. Sie sind NICHT
// gerundet und nicht "aufgeraeumt": Zusammen mit dem Sicherheitsabstand 96/54 ergeben sie
// die Inhaltsbox x 96-1824 / y 54-1026 (TK 9.10.5). Ein gerundeter Wert schiebt Inhalt in
// den Overscan-Bereich des Fernsehers - sichtbar erst am 85-Zoll-Geraet im Studio, nie am
// Laptop. Farben und Schriften stehen ausschliesslich als ROLLEN-Verweise in die Marke;
// ein Hex-Wert oder ein Schriftname hat hier nichts zu suchen (TK 9.11.1 Punkt 7).

/**
 * „Vollbild" – vollflaechiges 1920x1080-Segment: Motiv formatfuellend, darueber der
 * Scrim, darueber Text und Pillen.
 */
function vollbild(): Vorlage {
  return {
    id: EINGEBAUTE_VORLAGEN_IDS[0],
    name: 'Vollbild',
    art: 'vollflaeche',
    höhe: null,
    parent: null,
    eingebaut: true,
    zonen: [
      // 1 – `hintergrund` wird ALS ERSTES gezeichnet. Das Bild einer Aktion ist optional
      //     (FA-02); ohne diese Zone wuerde eine Aktion ohne Motiv SCHWARZ rendern statt
      //     markenkonform. Ans Ende sortiert deckte sie alles zu.
      {
        id: 'hintergrund',
        rolle: 'fest',
        bindung: null,
        rahmen: { x: 0, y: 0, breite: 1920, höhe: 1080 },
        ausrichtung: { horizontal: 'links', vertikal: 'oben' },
        wennLeer: 'leer',
        deko: { füllungFarbRolle: 'flaecheDunkel' },
      },
      // 2 – `motiv`: „cover; darf ueber die Inhaltsbox bluten" (TK 9.11.1). Hier ist das
      //     Bild Hintergrundstimmung, der Beschnitt ist gewollt - anders als bei „Split".
      {
        id: 'motiv',
        rolle: 'frei',
        bindung: 'bild',
        rahmen: { x: 0, y: 0, breite: 1920, höhe: 1080 },
        ausrichtung: { horizontal: 'mitte', vertikal: 'mitte' },
        wennLeer: 'leer',
        bild: { einpassung: 'cover' },
      },
      // 3 – `scrim`: ZWISCHEN Motiv und Text, also ueber dem Foto und unter der Schrift.
      //     Jede andere Stelle im Array macht ihn wirkungslos oder verdeckt den Text.
      {
        id: 'scrim',
        rolle: 'fest',
        bindung: null,
        rahmen: { x: 0, y: 432, breite: 1920, höhe: 648 },
        ausrichtung: { horizontal: 'links', vertikal: 'oben' },
        wennLeer: 'leer',
        deko: {
          verlauf: { vonFarbRolle: 'scrimStart', bisFarbRolle: 'scrimEnde', richtung: 'unten' },
        },
      },
      // 4 – `logo` 420x120 oben links, genau auf dem Sicherheitsabstand (96/54). Der
      //     dunkle Balken ist im Asset enthalten - keine eigene Hintergrundzone noetig.
      {
        id: 'logo',
        rolle: 'fest',
        bindung: 'logo',
        rahmen: { x: 96, y: 54, breite: 420, höhe: 120 },
        ausrichtung: { horizontal: 'links', vertikal: 'mitte' },
        wennLeer: 'leer',
        bild: { einpassung: 'contain' },
      },
      // 5 – `ueberschrift`: unten ausgerichtet, damit der Abstand zur Beschreibung bei
      //     einer wie bei zwei Zeilen gleich bleibt.
      {
        id: 'ueberschrift',
        rolle: 'frei',
        bindung: 'titel',
        rahmen: { x: 96, y: 640, breite: 1150, höhe: 190 },
        ausrichtung: { horizontal: 'links', vertikal: 'unten' },
        wennLeer: 'leer',
        text: {
          schriftRolle: 'headlinePlakativ',
          farbRolle: 'textAufDunkel',
          größeMax: 96,
          größeMin: 56,
          maxZeilen: 2,
        },
      },
      // 6 – `beschreibung`: Gegenstueck zur Ueberschrift, beginnt immer an derselben Kante.
      {
        id: 'beschreibung',
        rolle: 'frei',
        bindung: 'beschreibung',
        rahmen: { x: 96, y: 850, breite: 1150, höhe: 100 },
        ausrichtung: { horizontal: 'links', vertikal: 'oben' },
        wennLeer: 'leer',
        text: {
          schriftRolle: 'fliesstext',
          farbRolle: 'textAufDunkel',
          größeMax: 48,
          größeMin: 34,
          maxZeilen: 2,
        },
      },
      // 7 – `preis`: Pille in der Akzentfarbe, rechter Rand exakt auf 1824 (1300 + 524).
      //     `ausblenden`, weil eine leere Pille eine sichtbare Farbflaeche ohne Inhalt waere.
      {
        id: 'preis',
        rolle: 'frei',
        bindung: 'preis',
        rahmen: { x: 1300, y: 660, breite: 524, höhe: 150 },
        ausrichtung: { horizontal: 'mitte', vertikal: 'mitte' },
        wennLeer: 'ausblenden',
        text: {
          schriftRolle: 'headlinePlakativ',
          farbRolle: 'textAufDunkel',
          größeMax: 84,
          größeMin: 48,
          maxZeilen: 1,
        },
        deko: { füllungFarbRolle: 'akzent', radius: 40 },
      },
      // 8 – `cta`: helle Pille. Der Unterschied zur Akzent-Pille des Preises ist gewollt -
      //     zwei rote Pillen uebereinander haetten keine Hierarchie.
      {
        id: 'cta',
        rolle: 'frei',
        bindung: 'cta',
        rahmen: { x: 1300, y: 830, breite: 524, höhe: 120 },
        ausrichtung: { horizontal: 'mitte', vertikal: 'mitte' },
        wennLeer: 'ausblenden',
        text: {
          schriftRolle: 'headlinePlakativ',
          farbRolle: 'textAufHell',
          größeMax: 56,
          größeMin: 36,
          maxZeilen: 1,
        },
        deko: { füllungFarbRolle: 'flaecheHell', radius: 40 },
      },
    ],
  }
}

/**
 * „Split" – Motiv links, Text rechts, Trennung bei x = 960.
 *
 * ACHTUNG, DIE GEFAEHRLICHSTE VERWECHSLUNG DIESER DATEI: Die `art` ist `'vollflaeche'`,
 * NICHT `'split'`. Diese Vorlage ist ein volles 1920x1080-Segment; die Vorlagenart
 * `'split'` dagegen meint das Werbeband unter einem verkleinerten Video (TK 9.2.8) und
 * wird von `band-standard` bedient. Name und Art tragen zufaellig dasselbe Wort und
 * meinen Verschiedenes. Mit `art: 'split'` waere die Flaeche 1920 x `höhe`, und saemtliche
 * Zonen mit y bis 1026 laegen ausserhalb - auffallen wuerde das erst beim Zeichnen.
 */
function split(): Vorlage {
  return {
    id: EINGEBAUTE_VORLAGEN_IDS[1],
    name: 'Split',
    art: 'vollflaeche',
    höhe: null,
    parent: null,
    eingebaut: true,
    zonen: [
      // 1 – `hintergrund` zuerst, s. Begruendung bei „Vollbild".
      {
        id: 'hintergrund',
        rolle: 'fest',
        bindung: null,
        rahmen: { x: 0, y: 0, breite: 1920, höhe: 1080 },
        ausrichtung: { horizontal: 'links', vertikal: 'oben' },
        wennLeer: 'leer',
        deko: { füllungFarbRolle: 'flaecheDunkel' },
      },
      // 2 – `motiv`: „contain – das ganze Produkt bleibt sichtbar, kein Beschnitt"
      //     (TK 9.11.1). NICHT mit dem `cover` aus „Vollbild" vereinheitlichen: dort ist
      //     das Bild Stimmung, hier ist es das Produkt, und ein beschnittenes Produkt ist
      //     ein Werbefehler. Kein Scrim, weil der Text auf der freien Flaeche rechts steht.
      {
        id: 'motiv',
        rolle: 'frei',
        bindung: 'bild',
        rahmen: { x: 0, y: 0, breite: 960, höhe: 1080 },
        ausrichtung: { horizontal: 'mitte', vertikal: 'mitte' },
        wennLeer: 'leer',
        bild: { einpassung: 'contain' },
      },
      // 3 – `logo`: 420x120, y wie bei „Vollbild" auf 54; x = 1056 = 960 + 96, also der
      //     Sicherheitsabstand ab der Trennkante.
      {
        id: 'logo',
        rolle: 'fest',
        bindung: 'logo',
        rahmen: { x: 1056, y: 54, breite: 420, höhe: 120 },
        ausrichtung: { horizontal: 'links', vertikal: 'mitte' },
        wennLeer: 'leer',
        bild: { einpassung: 'contain' },
      },
      // 4 – `ueberschrift`: 1056 + 768 = 1824, der rechte Rand der Inhaltsbox.
      {
        id: 'ueberschrift',
        rolle: 'frei',
        bindung: 'titel',
        rahmen: { x: 1056, y: 260, breite: 768, höhe: 240 },
        ausrichtung: { horizontal: 'links', vertikal: 'unten' },
        wennLeer: 'leer',
        text: {
          schriftRolle: 'headlinePlakativ',
          farbRolle: 'textAufDunkel',
          größeMax: 84,
          größeMin: 52,
          maxZeilen: 3,
        },
      },
      // 5 – `beschreibung`: ebenfalls buendig bis 1824.
      {
        id: 'beschreibung',
        rolle: 'frei',
        bindung: 'beschreibung',
        rahmen: { x: 1056, y: 530, breite: 768, höhe: 200 },
        ausrichtung: { horizontal: 'links', vertikal: 'oben' },
        wennLeer: 'leer',
        text: {
          schriftRolle: 'fliesstext',
          farbRolle: 'textAufDunkel',
          größeMax: 40,
          größeMin: 30,
          maxZeilen: 4,
        },
      },
      // 6 – `preis`: Akzent-Pille.
      {
        id: 'preis',
        rolle: 'frei',
        bindung: 'preis',
        rahmen: { x: 1056, y: 780, breite: 360, höhe: 130 },
        ausrichtung: { horizontal: 'mitte', vertikal: 'mitte' },
        wennLeer: 'ausblenden',
        text: {
          schriftRolle: 'headlinePlakativ',
          farbRolle: 'textAufDunkel',
          größeMax: 72,
          größeMin: 44,
          maxZeilen: 1,
        },
        deko: { füllungFarbRolle: 'akzent', radius: 40 },
      },
      // 7 – `cta`: helle Pille; 930 + 96 = 1026, die untere Kante der Inhaltsbox.
      {
        id: 'cta',
        rolle: 'frei',
        bindung: 'cta',
        rahmen: { x: 1056, y: 930, breite: 500, höhe: 96 },
        ausrichtung: { horizontal: 'mitte', vertikal: 'mitte' },
        wennLeer: 'ausblenden',
        text: {
          schriftRolle: 'headlinePlakativ',
          farbRolle: 'textAufHell',
          größeMax: 48,
          größeMin: 32,
          maxZeilen: 1,
        },
        deko: { füllungFarbRolle: 'flaecheHell', radius: 40 },
      },
    ],
  }
}

/**
 * „Band-Standard" – das deckende Werbeband unter dem verkleinerten Video, die
 * Hauptbetriebsart Split-Screen (TK 9.2.8). Flaeche 1920 x 162; ALLE Rahmenwerte beziehen
 * sich auf die BANDFLAECHE, nicht auf 1920x1080.
 *
 * ZWEI ZAHLEN, DIE KEINE GESCHMACKSFRAGE SIND:
 * - `höhe: 162` ist GERADE. yuv420p verlangt gerade Hoehen und Versaetze; bei ungerader
 *   Bandhoehe brechen BEIDE Kompositionsarten aus TK 9.2.8 (TK 9.11.1 Punkt 8).
 * - Alle INHALTSZONEN enden bei Band-y 90. Das Band sitzt am unteren Rahmenrand
 *   (Rahmen-y 918-1080), die unteren 54 px des Rahmens fallen also ins Band; sicher
 *   nutzbar sind nur die oberen 108 px. Tiefer liegender Inhalt kann am Fernseher
 *   abgeschnitten werden. Ausgenommen ist allein `hintergrund`: Er traegt keinen Inhalt
 *   und muss die Flaeche ausfuellen - auf 90 px gekuerzt bliebe der untere Bandteil
 *   durchsichtig bzw. schwarz.
 *
 * BEWUSST OHNE `beschreibung`-Zone: In die sicher nutzbaren ~90 px passt genau eine
 * kompakte Zeile; eine Beschreibung waere unlesbar und im Band nicht vorgesehen
 * (Anforderungsdokument 4.5). Auch nicht „fuer spaeter" ergaenzen.
 */
function bandStandard(): Vorlage {
  return {
    id: EINGEBAUTE_VORLAGEN_IDS[2],
    name: 'Band-Standard',
    art: 'split',
    höhe: 162,
    parent: null,
    eingebaut: true,
    zonen: [
      // 1 – `hintergrund`: deckende Grundflaeche ueber das ganze Band. Deckend, weil die
      //     Deckkraft der Vorlagenart folgt: `split`-Baender sind deckend (echter Split),
      //     nur `einblendung`-Baender tragen Alpha (TK 9.2.8).
      {
        id: 'hintergrund',
        rolle: 'fest',
        bindung: null,
        rahmen: { x: 0, y: 0, breite: 1920, höhe: 162 },
        ausrichtung: { horizontal: 'links', vertikal: 'oben' },
        wennLeer: 'leer',
        deko: { füllungFarbRolle: 'flaecheDunkel' },
      },
      // 2 – `logo`: 20 + 69 = 89, innerhalb der sicheren 90.
      {
        id: 'logo',
        rolle: 'fest',
        bindung: 'logo',
        rahmen: { x: 96, y: 20, breite: 240, höhe: 69 },
        ausrichtung: { horizontal: 'links', vertikal: 'mitte' },
        wennLeer: 'leer',
        bild: { einpassung: 'contain' },
      },
      // 3 – Die Zonen-`id` heisst hier `titel`, nicht `ueberschrift` - so steht sie in der
      //     TK-Tabelle, und Zonen-IDs sind Vertragsdaten, keine freie Benennung.
      {
        id: 'titel',
        rolle: 'frei',
        bindung: 'titel',
        rahmen: { x: 380, y: 18, breite: 900, höhe: 72 },
        ausrichtung: { horizontal: 'links', vertikal: 'mitte' },
        wennLeer: 'leer',
        text: {
          schriftRolle: 'headlinePlakativ',
          farbRolle: 'textAufDunkel',
          größeMax: 64,
          größeMin: 44,
          maxZeilen: 1,
        },
      },
      // 4 – `preis`: Radius 36 statt 40, weil die Pille nur 72 px hoch ist. 36 ist genau
      //     die halbe Hoehe und ergibt die saubere Kapselform, ohne sich auf eine
      //     Beschneidungsregel im Zeichencode zu verlassen.
      {
        id: 'preis',
        rolle: 'frei',
        bindung: 'preis',
        rahmen: { x: 1330, y: 18, breite: 240, höhe: 72 },
        ausrichtung: { horizontal: 'mitte', vertikal: 'mitte' },
        wennLeer: 'ausblenden',
        text: {
          schriftRolle: 'headlinePlakativ',
          farbRolle: 'textAufDunkel',
          größeMax: 48,
          größeMin: 32,
          maxZeilen: 1,
        },
        deko: { füllungFarbRolle: 'akzent', radius: 36 },
      },
      // 5 – `cta`: letzte Zone, rechter Rand exakt 1824 (1590 + 234).
      {
        id: 'cta',
        rolle: 'frei',
        bindung: 'cta',
        rahmen: { x: 1590, y: 18, breite: 234, höhe: 72 },
        ausrichtung: { horizontal: 'mitte', vertikal: 'mitte' },
        wennLeer: 'ausblenden',
        text: {
          schriftRolle: 'headlinePlakativ',
          farbRolle: 'textAufHell',
          größeMax: 40,
          größeMin: 28,
          maxZeilen: 1,
        },
        deko: { füllungFarbRolle: 'flaecheHell', radius: 36 },
      },
    ],
  }
}
