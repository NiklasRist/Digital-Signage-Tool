// GENERIERT aus dem Signaturblock von Issue #147.
// [vorlagen-editor] Eine Zone hinzufügen: gebundener Text, Bild oder Dekoration
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
// GERUEST-PRUEFSUMME: 7abaf8996202b225
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

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type {
  Ausrichtung,
  Bindung,
  Rahmen,
  Vorlage,
  VorlagenArt,
  Zone,
  ZonenText,
} from '../../shared/contracts/vorlage'
import { begrenzeAufFlaeche, flaecheDerVorlage, MINDEST_ZONEN_KANTE_PX } from './zonen-canvas'

/** Die drei Sorten aus TK 9.12.2. */
export type ZonenSorte = 'text' | 'bild' | 'deko'

/** Für `text` erlaubt. */
export type TextBindung = 'titel' | 'beschreibung' | 'preis' | 'cta' | 'slogan'
/** Für `bild` erlaubt. */
export type BildBindung = 'bild' | 'logo'

export type ZonenWunsch =
  | { sorte: 'text'; bindung: TextBindung }
  | { sorte: 'bild'; bindung: BildBindung }
  | { sorte: 'deko'; statischerText?: string }

/**
 * Hängt eine neue FREIE Zone ans ENDE von vorlage.zonen (= zuoberst gezeichnet).
 * Liefert eine NEUE Vorlage; die übergebene bleibt unverändert.
 */
export function fuegeZoneHinzu(vorlage: Vorlage, wunsch: ZonenWunsch): Ergebnis<Vorlage> {
  const flaeche = flaecheDerVorlage(vorlage)
  if (flaeche.breite < MINDEST_ZONEN_KANTE_PX || flaeche.höhe < MINDEST_ZONEN_KANTE_PX) {
    return ungueltig(`In die Vorlage '${vorlage.id}' passt keine Zone (Höhe ${vorlage.höhe}).`)
  }

  if (
    wunsch.sorte === 'deko' &&
    wunsch.statischerText !== undefined &&
    wunsch.statischerText.length > 200
  ) {
    return ungueltig('Der statische Text einer dekorativen Zone ist höchstens 200 Zeichen lang.')
  }

  const grundwerte = grundwerteVon(wunsch)
  if (grundwerte === null) {
    return ungueltig('Der Wunsch passt zu keiner der drei Sorten text, bild oder deko.')
  }

  const id = freieZonenId(grundwerte.grundname, vorlage)
  if (id === null) {
    return ungueltig(
      `Für den Grundnamen '${grundwerte.grundname}' sind alle Namen bis -99 vergeben.`,
    )
  }

  const start = startRahmen(vorlage.art)
  const rahmen = begrenzeAufFlaeche(
    {
      x: start.x,
      y: start.y,
      breite: Math.max(Math.min(start.breite, flaeche.breite), MINDEST_ZONEN_KANTE_PX),
      höhe: Math.max(Math.min(start.höhe, flaeche.höhe), MINDEST_ZONEN_KANTE_PX),
    },
    flaeche,
  )

  const zone: Zone = {
    id,
    rolle: 'frei',
    bindung: grundwerte.bindung,
    rahmen,
    ausrichtung: ausrichtungFuer(wunsch.sorte),
    wennLeer: 'leer',
    ...sortenFelder(wunsch, textEinstellungenFuer(vorlage.art)),
  }

  return { ok: true, wert: { ...vorlage, zonen: [...vorlage.zonen, zone] } }
}

function ungueltig(meldung: string): Ergebnis<Vorlage> {
  return { ok: false, fehler: { code: 'ungueltige_eingabe', meldung } }
}

function grundwerteVon(wunsch: ZonenWunsch): { grundname: string; bindung: Bindung | null } | null {
  switch (wunsch.sorte) {
    case 'text':
    case 'bild':
      // Bei den gebundenen Sorten IST der Grundname die Bindung selbst (TK 9.12.2).
      return { grundname: wunsch.bindung, bindung: wunsch.bindung }
    case 'deko':
      return { grundname: 'deko', bindung: null }
    default:
      // Nur aus untypisiertem Code erreichbar; die ZonenWunsch-Union laesst es nicht zu.
      return null
  }
}

/** `-2`, `-3`, … anhaengen, bis der Name frei ist; bis `-99`, sonst null. */
function freieZonenId(grundname: string, vorlage: Vorlage): string | null {
  const vergeben = new Set(vorlage.zonen.map((zone) => zone.id))
  if (!vergeben.has(grundname)) {
    return grundname
  }
  for (let suffix = 2; suffix <= 99; suffix += 1) {
    const kandidat = `${grundname}-${suffix}`
    if (!vergeben.has(kandidat)) {
      return kandidat
    }
  }
  return null
}

/** Startwerte aus dem Issue: Bildmitte auf vollflaeche, sonst knapp unter der Bandoberkante. */
function startRahmen(art: VorlagenArt): Rahmen {
  if (art === 'vollflaeche') {
    return { x: 96, y: 540, breite: 400, höhe: 120 }
  }
  return { x: 96, y: 16, breite: 400, höhe: 72 }
}

/** Die Text-Vorgaben aus den eingebauten Vorlagen (TK 9.11.1), je Vorlagenart. */
function textEinstellungenFuer(art: VorlagenArt): ZonenText {
  if (art === 'vollflaeche') {
    return {
      schriftRolle: 'headlinePlakativ',
      farbRolle: 'textAufDunkel',
      größeMax: 96,
      größeMin: 56,
      maxZeilen: 2,
    }
  }
  return {
    schriftRolle: 'headlinePlakativ',
    farbRolle: 'textAufDunkel',
    größeMax: 64,
    größeMin: 44,
    maxZeilen: 1,
  }
}

/** Text liest links ausgerichtet; ein eingepasstes Bild sitzt mittig in seiner Zone. */
function ausrichtungFuer(sorte: ZonenSorte): Ausrichtung {
  if (sorte === 'bild') {
    return { horizontal: 'mitte', vertikal: 'mitte' }
  }
  return { horizontal: 'links', vertikal: 'mitte' }
}

/** Sortenabhaengige Felder: text/bild/deko - die nicht zur Sorte gehoeren bleiben weg. */
function sortenFelder(wunsch: ZonenWunsch, text: ZonenText): Pick<Zone, 'text' | 'bild' | 'deko'> {
  switch (wunsch.sorte) {
    case 'text':
      return { text }
    case 'bild':
      return { bild: { einpassung: 'contain' } }
    case 'deko': {
      const eigenerText = wunsch.statischerText?.trim()
      if (eigenerText) {
        return {
          deko: { füllungFarbRolle: 'akzent', statischerText: eigenerText },
          text,
        }
      }
      return { deko: { füllungFarbRolle: 'akzent' } }
    }
  }
}
