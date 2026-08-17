// GENERIERT aus dem Signaturblock von Issue #102.
// [vorlagen-store] speichereArbeitskopie implementieren
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
// GERUEST-PRUEFSUMME: 6494af67b909e315
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

import type { Ergebnis, GenerischerFehlercode } from '../../shared/contracts/ergebnis'
import type { Vorlage, Zone } from '../../shared/contracts/vorlage'
import { isDeepStrictEqual } from 'node:util'
import type { VorlagenFehlercode } from './fehlercodes'
import { aendereBestand } from './schreibe-vorlagen'

// Fremde Aufrufe – vollstaendige Signaturen, damit hier nichts geraten wird:
//   #98: aendereBestand<T>(
//            aenderung: (bestand: Vorlage[]) =>
//              Ergebnis<{ bestand: Vorlage[]; wert: T }, VorlagenFehlercode>,
//            schreibart: 'sofort' | 'entprellt',
//          ): Promise<Ergebnis<T, VorlagenFehlercode>>
//          // 'entprellt': der Bestand ist im Speicher uebernommen und das Promise wird erfuellt;
//          //             die Datei wird 4000 ms nach der LETZTEN entprellten Aenderung geschrieben.
//          //             Ein Fehler der SYNCHRONEN `aenderung` kommt sofort im Ergebnis zurueck.
//   #97: type VorlagenFehlercode = 'vorlage_referenziert' | 'parent_eingebaut' | 'speicher_fehler'
//   #95: interface Vorlage { id: string; name: string; art: VorlagenArt; höhe: number | null
//                              parent: string | null; eingebaut: boolean; zonen: Zone[] }
//          interface Zone { id: string; rolle: 'fest'|'frei'; bindung: Bindung | null
//                           rahmen: { x: number; y: number; breite: number; höhe: number }
//                           ausrichtung: { horizontal: 'links'|'mitte'|'rechts'
//                                          vertikal: 'oben'|'mitte'|'unten' }
//                           wennLeer: 'leer'|'ausblenden'
//                           text?: { schriftRolle: SchriftRolle; farbRolle: FarbRolle
//                                    größeMax: number; größeMin: number; maxZeilen: number }
//                           bild?: { einpassung: 'contain'|'cover' }
//                           deko?: { füllungFarbRolle?: FarbRolle; radius?: number
//                                    statischerText?: string; verlauf?: { … } } }

/** Gleiche Namensgrenze wie beim Anlegen (#100, TK 9.12.1). */
const NAME_MAX_ZEICHEN = 80

/** Gleiche Flaeche wie beim Anlegen (#100). */
const FLAECHE_BREITE = 1920

/** Gleiche Grundflaeche wie beim Anlegen (#100): vollflaechige Vorlagen sind 1080 hoch. */
const FLAECHE_GRUNDHOEHE = 1080

/** Der Markenrahmen (FA-11) – feste Zonen, die unveraenderlich sind (TK 9.11.1 Punkt 4). */
const TEXT_BINDUNGEN: readonly string[] = ['titel', 'beschreibung', 'preis', 'cta', 'slogan']
const BILD_BINDUNGEN: readonly string[] = ['bild', 'logo']

/**
 * Auto-Speichern waehrend des Bearbeitens. Trifft NUR die Arbeitskopie mit dieser arbeitsId.
 *
 * Laueft vollstaendig in EINER `aendereBestand(…, 'entprellt')`-Einheit (TK 9.5.4): Der Bestand
 * ist im Speicher uebernommen, wenn das Ergebnis `ok: true` ist; die Platte folgt entprellt
 * spaeter (4 s in #98). Geschrieben wird ausschliesslich der Eintrag mit `id === arbeitsId`.
 */
export async function speichereArbeitskopie(
  arbeitsId: string,
  vorlage: Vorlage,
): Promise<Ergebnis<Vorlage, VorlagenFehlercode>> {
  try {
    // Ablauf-Schritt 1 (verbindlich): die formale Pruefung steht VOR jedem Bestandszugriff -
    // eine unbrauchbare arbeitsId oder Nutzlast betritt `aendereBestand` gar nicht erst.
    if (typeof arbeitsId !== 'string' || arbeitsId.length === 0) {
      return fehler('ungueltige_eingabe', 'speichereArbeitskopie braucht eine nicht-leere arbeitsId.')
    }
    if (typeof vorlage !== 'object' || vorlage === null || Array.isArray(vorlage)) {
      return fehler('ungueltige_eingabe', 'speichereArbeitskopie braucht eine Vorlage als Objekt.')
    }

    // Ablauf-Schritte 2 bis 7 - vollstaendig in EINER `aendereBestand(…, 'entprellt')`-Einheit.
    // Die Aenderungsfunktion ist SYNCHRON und darf nicht `await`en (#98) - nur so bleiben Lesen,
    // Entscheiden und Uebernehmen eine ununterbrechbare Einheit.
    return await aendereBestand<Vorlage>(
      (bestand) => {
        // Schritt 2: die Arbeitskopie muss im Bestand stehen.
        const kopie = bestand.find((eintrag) => eintrag.id === arbeitsId)
        if (kopie === undefined) {
          return fehler('nicht_gefunden', `Es gibt keine Vorlage mit der id "${arbeitsId}".`)
        }

        // Schritt 3: sie muss eine Arbeitskopie sein - parent !== null. Ein Schreibversuch auf
        // eine GENUTZTE Vorlage ist genau der Fall, den der Arbeitskopie-Fluss ausschliesst.
        if (kopie.parent === null) {
          return fehler(
            'ungueltige_eingabe',
            `"${arbeitsId}" ist keine Arbeitskopie (parent ist null); Auto-Speichern trifft nur ` +
              'Arbeitskopien.',
          )
        }

        // Schritt 4: unveraenderliche Felder abgleichen. Eine Abweichung ist ein Fehler im
        // Aufrufer - nicht stillschweigend korrigieren, sonst zeigen Editor und Store dauerhaft
        // verschiedene Staende.
        if (vorlage.id !== kopie.id || vorlage.art !== kopie.art || vorlage.parent !== kopie.parent) {
          return fehler(
            'ungueltige_eingabe',
            `Die Nutzlast passt nicht zum gespeicherten Eintrag "${arbeitsId}" (id, art oder ` +
              'parent weichen ab); nichts wird uebernommen.',
          )
        }
        if (vorlage.eingebaut !== kopie.eingebaut) {
          return fehler(
            'ungueltige_eingabe',
            `Die Nutzlast passt nicht zum gespeicherten Eintrag "${arbeitsId}" (eingebaut weicht ` +
              'ab); nichts wird uebernommen.',
          )
        }

        // Schritt 5: veraenderliche Felder pruefen und uebernehmen - name, höhe, zonen.
        const nameFehler = pruefeName(vorlage)
        if (nameFehler !== null) {
          return nameFehler
        }
        const hoehenFehler = pruefeHoehe(vorlage)
        if (hoehenFehler !== null) {
          return hoehenFehler
        }
        const zonenFehler = pruefeZonen(vorlage, kopie)
        if (zonenFehler !== null) {
          return zonenFehler
        }

        // Schritt 6: den Eintrag AN SEINEM BISHERIGEN PLATZ ersetzen - kein Entfernen und
        // Anhaengen, das wuerde die Reihenfolge der Bibliothek bei jedem Auto-Speichern umwerfen.
        const neuerBestand = bestand.map((eintrag) =>
          eintrag.id === arbeitsId ? gespeicherterStand(vorlage) : eintrag,
        )

        // Schritt 7: den GESPEICHERTEN Stand zurueckgeben - getrimmt und geprueft, als tiefe
        // Kopie, damit ein Aufrufer den zwischengespeicherten Bestand nicht verbiegen kann.
        return { ok: true, wert: { bestand: neuerBestand, wert: structuredClone(gespeicherterStand(vorlage)) } }
      },
      'entprellt',
    )
  } catch (ursache) {
    // TK 9.1.1: kein throw ueber die IPC-Grenze - die Funktion wirft nie, jeder Ausgang ist eine
    // Huelle. `aendereBestand` faengt intern schon; der Bogen hier ist der Auffang fuer alles,
    // was davor liegt.
    return fehler('unbekannter_fehler', `speichereArbeitskopie unerwartet abgebrochen: ${text(ursache)}`)
  }
}

/**
 * Prueft den zu uebernehmenden Namen (gleiche Regel wie #100): String, nach trim() nicht leer,
 * hoechstens 80 Zeichen. Rueckgabe `null` = in Ordnung, sonst die Fehler-Huelle.
 */
function pruefeName(vorlage: Vorlage): Ergebnis<never, VorlagenFehlercode> | null {
  if (typeof vorlage.name !== 'string') {
    return fehler('ungueltige_eingabe', 'Der Name einer Vorlage muss eine Zeichenkette sein.')
  }
  const getrimmt = vorlage.name.trim()
  if (getrimmt.length === 0) {
    return fehler('ungueltige_eingabe', 'Der Name einer Vorlage darf nicht leer sein.')
  }
  if (getrimmt.length > NAME_MAX_ZEICHEN) {
    return fehler(
      'ungueltige_eingabe',
      `Der Name einer Vorlage darf hoechstens ${NAME_MAX_ZEICHEN} Zeichen lang sein ` +
        `(uebergeben: ${getrimmt.length}).`,
    )
  }
  return null
}

/**
 * Prueft die zu uebernehmende höhe gegen die art (TK 9.11.1 Punkt 8 / 9.12.1): bei
 * vollflaeche muss höhe null sein, bei split/einblendung eine gerade ganze Zahl > 0 und < 1080.
 * Geprueft wird, NICHT gerundet. Rueckgabe `null` = in Ordnung, sonst die Fehler-Huelle.
 */
function pruefeHoehe(vorlage: Vorlage): Ergebnis<never, VorlagenFehlercode> | null {
  const { id, art, höhe } = vorlage
  if (art === 'vollflaeche') {
    if (höhe !== null) {
      return fehler(
        'ungueltige_eingabe',
        `Die Arbeitskopie "${id}" ist vollflaechig und darf keine Bandhoehe tragen ` +
          `(uebergeben: ${String(höhe)}).`,
      )
    }
    return null
  }
  if (
    typeof höhe !== 'number' ||
    !Number.isInteger(höhe) ||
    höhe <= 0 ||
    höhe >= FLAECHE_GRUNDHOEHE ||
    höhe % 2 !== 0
  ) {
    return fehler(
      'ungueltige_eingabe',
      `Die Arbeitskopie "${id}" traegt eine unbrauchbare Bandhoehe (${String(höhe)}): ` +
        'erwartet wird eine gerade ganze Zahl groesser 0 und kleiner 1080.',
    )
  }
  return null
}

/**
 * Prueft die Zonen der Nutzlast gegen die Sperren aus TK 9.12.2. Rueckgabe `null` = in Ordnung,
 * sonst die Fehler-Huelle. Es wird NICHTS geklemmt, ergaenzt, sortiert oder wiederhergestellt:
 * Abgelehnt wird abgelehnt (kein stilles Zurechtbiegen). Ueberlappung und Sicherheitsabstand sind
 * ausdruecklich KEIN Fehler.
 */
function pruefeZonen(
  vorlage: Vorlage,
  kopie: Vorlage,
): Ergebnis<never, VorlagenFehlercode> | null {
  const { id, höhe, zonen } = vorlage
  const flaechenHoehe = höhe ?? FLAECHE_GRUNDHOEHE

  // Eindeutigkeit: die ids aller Zonen sind paarweise verschieden.
  const gesehen = new Set<string>()
  for (const zone of zonen) {
    if (typeof zone.id !== 'string' || zone.id.length === 0) {
      return fehler('ungueltige_eingabe', `Die Vorlage "${id}" enthaelt eine Zone ohne gueltige id.`)
    }
    if (gesehen.has(zone.id)) {
      return fehler(
        'ungueltige_eingabe',
        `Die Vorlage "${id}" enthaelt die Zonen-id "${zone.id}" mehrfach; die ids muessen ` +
          'paarweise verschieden sein.',
      )
    }
    gesehen.add(zone.id)

    // Flaeche: jede Zone liegt vollstaendig in 1920 x Flächenhoehe, alle vier Rahmenwerte endlich.
    const r = zone.rahmen
    if (
      typeof r !== 'object' ||
      r === null ||
      ![r.x, r.y, r.breite, r.höhe].every(Number.isFinite) ||
      r.x < 0 ||
      r.y < 0 ||
      r.breite <= 0 ||
      r.höhe <= 0 ||
      r.x + r.breite > FLAECHE_BREITE ||
      r.y + r.höhe > flaechenHoehe
    ) {
      return fehler(
        'ungueltige_eingabe',
        `Die Zone "${zone.id}" liegt ganz oder teilweise ausserhalb der Flaeche ` +
          `1920 x ${flaechenHoehe} oder traegt einen unbrauchbaren Rahmen; nichts wird uebernommen.`,
      )
    }

    // Text-Parameter: gebundene Textzonen und Zonen mit deko.statischerText brauchen `text`.
    const brauchtText = TEXT_BINDUNGEN.includes(zone.bindung ?? '') || zone.deko?.statischerText !== undefined
    if (brauchtText) {
      const t = zone.text
      if (
        t === undefined ||
        typeof t.größeMin !== 'number' ||
        typeof t.größeMax !== 'number' ||
        !(t.größeMin > 0) ||
        !(t.größeMax >= t.größeMin) ||
        !Number.isInteger(t.maxZeilen) ||
        t.maxZeilen < 1
      ) {
        return fehler(
          'ungueltige_eingabe',
          `Die Textzone "${zone.id}" braucht Text-Parameter mit 0 < größeMin <= größeMax und ` +
            'ganzzahligem maxZeilen >= 1; nichts wird uebernommen.',
        )
      }
    }

    // Bild-Parameter: gebundene Bild-/Logo-Zonen brauchen `bild` mit gueltigem einpassung.
    if (BILD_BINDUNGEN.includes(zone.bindung ?? '')) {
      const b = zone.bild
      if (b === undefined || (b.einpassung !== 'contain' && b.einpassung !== 'cover')) {
        return fehler(
          'ungueltige_eingabe',
          `Die Zone "${zone.id}" braucht bild.einpassung 'contain' oder 'cover'; nichts wird ` +
            'uebernommen.',
        )
      }
    }
  }

  // Feste Zonen: unveraendert gegenueber dem gespeicherten Stand - gleiche Anzahl, gleiche ids,
  // jede tief-gleich, und ihre RELATIVE Reihenfolge untereinander unveraendert (die absolute
  // Index-Position darf sich durch freie Zonen dazwischen verschieben).
  const festVorher = kopie.zonen.filter((zone) => zone.rolle === 'fest')
  const festNachher = vorlage.zonen.filter((zone) => zone.rolle === 'fest')
  if (festVorher.length !== festNachher.length) {
    return fehler(
      'ungueltige_eingabe',
      `Die Vorlage "${id}" darf feste Zonen weder entfernen noch hinzufuegen ` +
        `(gespeichert: ${festVorher.length}, uebergeben: ${festNachher.length}); nichts wird uebernommen.`,
    )
  }
  for (let i = 0; i < festVorher.length; i += 1) {
    const vorher = festVorher[i]
    const nachher = festNachher[i]
    if (vorher === undefined || nachher === undefined) {
      return fehler(
        'ungueltige_eingabe',
        `Die Vorlage "${id}" enthaelt eine feste Zone, die sich nicht zuordnen laesst.`,
      )
    }
    if (vorher.id !== nachher.id || !tiefGleich(vorher, nachher)) {
      return fehler(
        'ungueltige_eingabe',
        `Die feste Zone "${vorher.id}" wurde geaendert; feste Zonen sind unveraenderlich ` +
          '(Markenrahmen erzwungen, FA-11).',
      )
    }
  }

  return null
}

/**
 * Der GESPEICHERTE Stand der Arbeitskopie: getrimmter Name, gepruefte Zonen in exakt uebergebener
 * Reihenfolge, id/art/parent/eingebaut von der Nutzlast (nach Abgleich mit dem Eintrag). Es wird
 * ein NEUES Objekt gebaut - der Aufrufer-Eintrag bleibt unberuehrt.
 */
function gespeicherterStand(vorlage: Vorlage): Vorlage {
  return {
    id: vorlage.id,
    name: vorlage.name.trim(),
    art: vorlage.art,
    höhe: vorlage.höhe,
    parent: vorlage.parent,
    eingebaut: vorlage.eingebaut,
    zonen: vorlage.zonen,
  }
}

function tiefGleich(a: Zone, b: Zone): boolean {
  return isDeepStrictEqual(a, b)
}

function text(ursache: unknown): string {
  return ursache instanceof Error ? ursache.message : String(ursache)
}

/**
 * Die Fehlerseite der Huelle - bewusst OHNE Nutztyp, damit sie fuer `Ergebnis<Vorlage, …>`
 * genauso passt wie fuer `Ergebnis<never, …>`. `daten` wird hier nie gesetzt (Issue, woertlich).
 */
function fehler(
  code: VorlagenFehlercode | GenerischerFehlercode,
  meldung: string,
): { ok: false; fehler: { code: VorlagenFehlercode | GenerischerFehlercode; meldung: string } } {
  return { ok: false, fehler: { code, meldung } }
}