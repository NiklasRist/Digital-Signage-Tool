 
 
// GENERIERT aus dem Signaturblock von Issue #150.
// [vorlagen-editor] Live-Vorschau mit einer echten Aktion und testweise geleerten Feldern
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
// GERUEST-PRUEFSUMME: 019687f7921d0915
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

import type { Aktion } from '../../shared/contracts/aktion'
import type { Asset } from '../../shared/contracts/asset'
import type { Marke } from '../../shared/contracts/marke'
import type { Vorlage } from '../../shared/contracts/vorlage'
import { zeichneSegment, type SegmentBild } from '../template-canvas/zeichne-segment'
import { bereiteMotiveVor } from '../template-canvas/bild-laden'
import { bereiteLogoVor } from '../template-canvas/logo-laden'
import { stelleSchriftenBereit } from '../template-canvas/schriften'

/** Die Aktions-Felder, die sich für die Vorschau leeren lassen. */
export type VorschauFeld = 'titel' | 'beschreibung' | 'preis' | 'cta' | 'bild'

/** Ersatz, wenn die Aktions-Bibliothek des Projekts leer ist. Wird NIE gespeichert. */
export const BEISPIEL_AKTION: Aktion = {
  id: 'vorschau-beispiel-aktion',
  titel: 'Beispiel-Aktion',
  beschreibung: 'Diese Aktion dient nur der Live-Vorschau und wird nie gespeichert.',
  preis: '9,99 €',
  bildRef: null,
  cta: 'Gratis Probetraining',
  standardDauer: null,
  vorlagenId: 'vollbild',
  akzentfarbe: null,
}

/** Die gewählte Aktion, sonst die erste der Bibliothek, sonst BEISPIEL_AKTION. */
export function waehleVorschauAktion(
  aktionen: readonly Aktion[],
  gewaehlteId: string | null,
): Aktion {
  const gewaehlt =
    gewaehlteId !== null
      ? aktionen.find((aktion) => aktion.id === gewaehlteId)
      : undefined
  if (gewaehlt !== undefined) return gewaehlt
  const erste = aktionen[0]
  if (erste !== undefined) return erste
  return BEISPIEL_AKTION
}

/** Kopie der Aktion mit den genannten Feldern geleert. Verändert die Vorlage NICHT. */
export function leereFelderFuerVorschau(
  aktion: Aktion,
  geleert: ReadonlySet<VorschauFeld>,
): Aktion {
  return {
    ...aktion,
    titel: geleert.has('titel') ? '' : aktion.titel,
    beschreibung: geleert.has('beschreibung') ? null : aktion.beschreibung,
    preis: geleert.has('preis') ? null : aktion.preis,
    cta: geleert.has('cta') ? null : aktion.cta,
    bildRef: geleert.has('bild') ? null : aktion.bildRef,
  }
}

/**
 * Lädt alles, was zeichneSegment synchron voraussetzt: Schriften, Logo und die Motive der
 * übergebenen Aktionen. MUSS vor dem ersten zeichneVorschau abgeschlossen sein.
 * `projektId === null` = kein Projekt geöffnet: Schriften und Logo werden trotzdem geladen,
 * Motive entfallen (media:// löst nur innerhalb eines Projekt-Medienordners auf).
 */
export async function bereiteVorschauVor(
  projektId: string | null,
  aktionen: readonly Aktion[],
  assets: readonly Asset[],
  marke: Marke,
): Promise<void> {
  // Schriften und Logo laden auch ohne Projekt – sie hängen an der Marke.
  await stelleSchriftenBereit()
  await bereiteLogoVor(marke)

  if (projektId === null) return

  const eintraege: Array<{ schluessel: string; dateiname: string }> = []
  for (const aktion of aktionen) {
    if (aktion.bildRef === null) continue
    const asset = assets.find((kandidat) => kandidat.id === aktion.bildRef)
    if (asset === undefined) continue
    if (asset.zustand === 'fehlt') continue
    eintraege.push({ schluessel: aktion.bildRef, dateiname: asset.dateiname })
  }
  if (eintraege.length === 0) return

  await bereiteMotiveVor(projektId, eintraege)
}

/** Der EINZIGE Zeichenaufruf des vorlagen-editor. Leert die Felder und ruft zeichneSegment. */
export function zeichneVorschau(
  aktion: Aktion,
  vorlage: Vorlage,
  marke: Marke,
  geleert: ReadonlySet<VorschauFeld>,
): SegmentBild {
  return zeichneSegment(leereFelderFuerVorschau(aktion, geleert), vorlage, marke)
}
