// GENERIERT aus dem Signaturblock von Issue #148.
// [vorlagen-editor] Prüfungen des Editors: harte Sperre gegen Warnung
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
// GERUEST-PRUEFSUMME: 4abf8d3ebc6c38f0
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

import type { Rahmen, Vorlage, Zone } from '../../shared/contracts/vorlage'
import type { Flaeche } from './zonen-canvas'
import { flaecheDerVorlage, sicherheitsBox } from './zonen-canvas'
import { SICHERHEITSABSTAND_PX } from '../../shared/contracts/konstanten'
import { RENDER_PROFILE } from '../../shared/contracts/render-profile'

export type BefundSchwere = 'sperre' | 'warnung'

export type BefundCode =
  | 'zone_ausserhalb'          // Sperre  – TK 9.12.2, Zeile 1
  | 'bandhoehe_ungueltig'      // Sperre  – TK 9.12.2, Zeilen 2 UND 3 (Wertebereich und Geradzahligkeit)
  | 'textparameter_fehlen'     // Sperre  – TK 9.12.2, Zeile 4
  | 'bildparameter_fehlen'     // Sperre  – zusätzlich, weil #102 sie ablehnt (s. u.)
  | 'zonen_id_doppelt'         // Sperre  – zusätzlich, weil #102 sie ablehnt (s. u.)
  | 'feste_zone_veraendert'    // Sperre  – TK 9.12.2, Zeile 7
  | 'sicherheitsabstand'       // Warnung – TK 9.12.2, Zeile 5

export interface Befund {
  schwere: BefundSchwere
  code: BefundCode
  zonenId: string | null   // null = betrifft die Vorlage als Ganzes (nur bei bandhoehe_ungueltig)
  meldung: string          // fertiger Anzeigetext, nennt die betroffene Zone beim Namen
}

/**
 * Prüft die gesamte Arbeitskopie.
 * `festeZonenSoll` sind die festen Zonen, wie sie beim Öffnen der Arbeitskopie vorlagen –
 * der Vergleichsmassstab für 'feste_zone_veraendert'. Der Aufrufer nimmt sie aus
 * `sitzung.festeZonenSoll` (#143) und bildet sie NICHT aus dem aktuellen Stand neu.
 */
export function pruefeVorlage(vorlage: Vorlage, festeZonenSoll: readonly Zone[]): Befund[] {
  const befunde: Befund[] = []

  // 1. bandhoehe_ungueltig ZUERST - ein Befund ueber die Vorlage als Ganzes (zonenId: null).
  const bandBefund = bandhoeheBefund(vorlage)
  if (bandBefund !== null) {
    befunde.push(bandBefund)
  }

  const flaeche = flaecheDerVorlage(vorlage)
  const box = sicherheitsBox(vorlage)
  const geseheneIds = new Set<string>()
  const festeVerstossIds = festeZonenVerstoesse(vorlage, festeZonenSoll)

  // 2.-7. Alle Zonen in ARRAY-Reihenfolge; je Zone die Codes in der festgelegten Reihenfolge.
  for (const zone of vorlage.zonen) {
    // zone_ausserhalb (Sperre)
    if (!istZoneInFlaeche(zone, flaeche)) {
      befunde.push({
        schwere: 'sperre',
        code: 'zone_ausserhalb',
        zonenId: zone.id,
        meldung: `Die Zone „${zone.id}" ragt aus der Fläche (${flaeche.breite} × ${flaeche.höhe} px).`,
      })
    }

    // textparameter_fehlen (Sperre)
    if (brauchtText(zone) && !hatGueltigeTextParameter(zone)) {
      befunde.push({
        schwere: 'sperre',
        code: 'textparameter_fehlen',
        zonenId: zone.id,
        meldung: `Die Text-Zone „${zone.id}" braucht gültige Text-Parameter (größeMin ≤ größeMax, maxZeilen ≥ 1).`,
      })
    }

    // bildparameter_fehlen (Sperre)
    if (brauchtBild(zone) && !hatGueltigesBild(zone)) {
      befunde.push({
        schwere: 'sperre',
        code: 'bildparameter_fehlen',
        zonenId: zone.id,
        meldung: `Die Bild-Zone „${zone.id}" braucht eine Einpassung ('contain' oder 'cover').`,
      })
    }

    // zonen_id_doppelt (Sperre) - ab der ZWEITEN Zone mit derselben id.
    if (geseheneIds.has(zone.id)) {
      befunde.push({
        schwere: 'sperre',
        code: 'zonen_id_doppelt',
        zonenId: zone.id,
        meldung: `Die Zonen-Id „${zone.id}" ist doppelt vergeben.`,
      })
    }
    geseheneIds.add(zone.id)

    // feste_zone_veraendert (Sperre) - nur die betroffene id, an dieser Position der Zone.
    if (zone.rolle === 'fest' && festeVerstossIds.has(zone.id)) {
      befunde.push({
        schwere: 'sperre',
        code: 'feste_zone_veraendert',
        zonenId: zone.id,
        meldung: `Die feste Zone „${zone.id}" wurde verändert, entfernt oder verschoben.`,
      })
    }

    // sicherheitsabstand (Warnung) - nur bei bedeutungstragendem Inhalt.
    if (traegtBedeutung(zone) && !istZoneInBox(zone, box)) {
      befunde.push({
        schwere: 'warnung',
        code: 'sicherheitsabstand',
        zonenId: zone.id,
        meldung: sicherheitsabstandMeldung(zone.id, vorlage),
      })
    }
  }

  // Fehlende feste Zonen (in festeZonenSoll, aber nicht im Stand) - nach allen Zonen.
  for (const soll of festeZonenSoll) {
    if (!vorlage.zonen.some((zone) => zone.id === soll.id)) {
      befunde.push({
        schwere: 'sperre',
        code: 'feste_zone_veraendert',
        zonenId: soll.id,
        meldung: `Die feste Zone „${soll.id}" fehlt im Stand.`,
      })
    }
  }

  return befunde
}

/** true, wenn KEIN Befund die Schwere 'sperre' hat. Warnungen blockieren nie. */
export function istSpeicherbar(befunde: readonly Befund[]): boolean {
  return !befunde.some((befund) => befund.schwere === 'sperre')
}

/**
 * Band-y, ab dem der Inhalt im Overscan liegt (= höhe − 54).
 * null bei `vollflaeche` und wenn die ganze Bandfläche unsicher ist.
 */
export function bandSicherheitsLinie(vorlage: Vorlage): number | null {
  if (vorlage.art === 'vollflaeche') {
    return null
  }
  const hoehe = vorlage.höhe
  if (hoehe === null || !Number.isInteger(hoehe) || hoehe <= 0) {
    // Auf ungültigen Daten ist die Sicherheitsbox nicht sinnvoll auszuwerten.
    return null
  }
  // Aus sicherheitsBox abgeleitet (box.y + box.höhe) - KEINE eigene Subtraktion.
  const box = sicherheitsBox(vorlage)
  const linie = box.y + box.höhe
  return linie > 0 ? linie : null
}

// ---------------------------------------------------------------------------
// Hilfsfunktionen - eine pro Regel der Prueftabelle, damit jede Zeile an genau
// einer Stelle steht.
// ---------------------------------------------------------------------------

/** bandhoehe_ungueltig - eine der drei ungueltigen Auspraegungen, sonst null. */
function bandhoeheBefund(vorlage: Vorlage): Befund | null {
  const hoehe = vorlage.höhe
  if (vorlage.art === 'vollflaeche') {
    if (hoehe === null) {
      return null
    }
    return {
      schwere: 'sperre',
      code: 'bandhoehe_ungueltig',
      zonenId: null,
      meldung: 'Eine vollflächige Vorlage trägt keine Bandhöhe; höhe muss null sein.',
    }
  }
  // split / einblendung: endliche ganze Zahl > 0 und < 1080 UND gerade (yuv420p).
  if (hoehe === null || !Number.isInteger(hoehe) || !Number.isFinite(hoehe) || hoehe <= 0) {
    return {
      schwere: 'sperre',
      code: 'bandhoehe_ungueltig',
      zonenId: null,
      meldung: `Die Bandhöhe muss eine ganze Zahl größer als 0 und kleiner als ${RENDER_PROFILE.hoehe} sein.`,
    }
  }
  if (hoehe >= RENDER_PROFILE.hoehe) {
    return {
      schwere: 'sperre',
      code: 'bandhoehe_ungueltig',
      zonenId: null,
      meldung: `Die Bandhöhe muss eine ganze Zahl größer als 0 und kleiner als ${RENDER_PROFILE.hoehe} sein.`,
    }
  }
  if (hoehe % 2 !== 0) {
    // Der ungerade Fall ist eine eigene Meldung: Der Nutzer soll eine Zahl korrigieren,
    // nicht Zonen suchen. NICHT stillschweigend runden.
    return {
      schwere: 'sperre',
      code: 'bandhoehe_ungueltig',
      zonenId: null,
      meldung: `Die Bandhöhe ${hoehe} ist ungerade; erlaubt ist die nächste gerade Höhe ${hoehe + 1}.`,
    }
  }
  return null
}

/** zone_ausserhalb: alle vier Rahmenwerte endlich und innerhalb der Flaeche. */
function istZoneInFlaeche(zone: Zone, flaeche: Flaeche): boolean {
  const r = zone.rahmen
  return (
    Number.isFinite(r.x) &&
    Number.isFinite(r.y) &&
    Number.isFinite(r.breite) &&
    Number.isFinite(r.höhe) &&
    r.x >= 0 &&
    r.y >= 0 &&
    r.breite > 0 &&
    r.höhe > 0 &&
    r.x + r.breite <= flaeche.breite &&
    r.y + r.höhe <= flaeche.höhe
  )
}

/** Braucht diese Zone einen text-Block? Textbindung oder gefuellter statischer Text. */
function brauchtText(zone: Zone): boolean {
  const bindung = zone.bindung
  if (
    bindung === 'titel' ||
    bindung === 'beschreibung' ||
    bindung === 'preis' ||
    bindung === 'cta' ||
    bindung === 'slogan'
  ) {
    return true
  }
  const statisch = zone.deko?.statischerText
  return statisch !== undefined && statisch.trim() !== ''
}

/** textparameter_fehlen: 0 < größeMin ≤ größeMax und ganzzahliges maxZeilen ≥ 1. */
function hatGueltigeTextParameter(zone: Zone): boolean {
  const text = zone.text
  if (text === undefined) {
    return false
  }
  return (
    text.größeMin > 0 &&
    text.größeMin <= text.größeMax &&
    Number.isInteger(text.maxZeilen) &&
    text.maxZeilen >= 1
  )
}

/** Braucht diese Zone einen bild-Block? Nur Bindung bild oder logo. */
function brauchtBild(zone: Zone): boolean {
  return zone.bindung === 'bild' || zone.bindung === 'logo'
}

/** bildparameter_fehlen: einpassung ist 'contain' oder 'cover'. */
function hatGueltigesBild(zone: Zone): boolean {
  const bild = zone.bild
  return bild !== undefined && (bild.einpassung === 'contain' || bild.einpassung === 'cover')
}

/** sicherheitsabstand: nur bedeutungstragender Inhalt (text oder Bindung logo). */
function traegtBedeutung(zone: Zone): boolean {
  return zone.text !== undefined || zone.bindung === 'logo'
}

/** Liegt die Zone vollständig in der Sicherheitsbox? */
function istZoneInBox(zone: Zone, box: Rahmen): boolean {
  const r = zone.rahmen
  return (
    r.x >= box.x &&
    r.y >= box.y &&
    r.x + r.breite <= box.x + box.breite &&
    r.y + r.höhe <= box.y + box.höhe
  )
}

/** Der Meldungstext der Warnung - unterscheidet Vollflaeche und Band (TK 9.11.2). */
function sicherheitsabstandMeldung(zonenId: string, vorlage: Vorlage): string {
  const horizontal = SICHERHEITSABSTAND_PX.horizontal
  const vertikal = SICHERHEITSABSTAND_PX.vertikal
  if (vorlage.art === 'vollflaeche') {
    return `Die Zone „${zonenId}" liegt im Rand von ${horizontal}/${vertikal} px (TV-Overscan) und kann am Fernseher abgeschnitten werden.`
  }
  const sicher = vorlage.höhe !== null ? vorlage.höhe - vertikal : 0
  return `Die Zone „${zonenId}" liegt im Rand von ${horizontal}/${vertikal} px (TV-Overscan); die unteren ${vertikal} px des Bildes liegen im Band, sicher sind nur die oberen ${sicher} px.`
}

/**
 * Die ids der festen Zonen, die den Vergleich gegen festeZonenSoll verletzen -
 * Anzahl, id-Menge, relative Reihenfolge oder Tiefengleichheit. Fehlende Zonen
 * (in festeZonenSoll, nicht im Stand) werden separat gemeldet.
 */
function festeZonenVerstoesse(vorlage: Vorlage, festeZonenSoll: readonly Zone[]): Set<string> {
  const verstoesse = new Set<string>()
  const istFeste = vorlage.zonen.filter((zone) => zone.rolle === 'fest')
  const sollIds = festeZonenSoll.map((zone) => zone.id)
  const istIds = istFeste.map((zone) => zone.id)

  // Tiefengleichheit je Paar; eine zusaetzliche feste Zone ist ebenfalls ein Verstoss.
  for (const ist of istFeste) {
    const gegenstueck = festeZonenSoll.find((soll) => soll.id === ist.id)
    if (gegenstueck === undefined || !tiefGleich(ist, gegenstueck)) {
      verstoesse.add(ist.id)
    }
  }

  // Relative Reihenfolge: die Folge der gemeinsamen festen Zonen muss gleich sein.
  // Bei Gleichstand (nur eine gemeinsame Zone) ist die Ordnung immer erfuellt.
  const gemeinsame = sollIds.filter((id) => istIds.includes(id))
  if (gemeinsame.length > 1 && !istIds.every((id, index) => id === gemeinsame[index])) {
    for (const id of gemeinsame) {
      verstoesse.add(id)
    }
  }

  return verstoesse
}

function tiefGleich(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true
  }
  if (a === null || b === null || typeof a !== typeof b) {
    return false
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    return (
      Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((wert, index) => tiefGleich(wert, b[index]))
    )
  }
  if (typeof a === 'object' && typeof b === 'object') {
    const objA = a as Record<string, unknown>
    const objB = b as Record<string, unknown>
    const schluesselA = Object.keys(objA)
    const schluesselB = Object.keys(objB)
    return (
      schluesselA.length === schluesselB.length &&
      schluesselA.every((schluessel) => tiefGleich(objA[schluessel], objB[schluessel]))
    )
  }
  return false
}
