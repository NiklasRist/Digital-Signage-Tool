// [produktfoto] Der Auftrag `produktfoto-abruf` (FA-27 / TK 9.19)
//
// ABLAUF: Produktseite laden -> Bildadressen lesen -> hoechstens 5 Kandidaten laden und
// im Speicher des Main ablegen. KEIN Asset, keine Aenderung an der Aktion, keine Datei
// auf der Platte - „erst die Wahl legt ein Asset an" (AD 4.12).
//
// KEIN HINTERGRUNDABRUF: Der Auftrag laeuft, wenn der Nutzer ihn ausloest, und endet mit
// Erfolg oder Klartext-Fehler. Ohne Netz scheitert er sichtbar; jede andere Funktion der
// App bleibt unberuehrt (NFA-06, AD 4.12).

import { normalisiereProduktUrl } from '../../shared/produkt-url'
import { PRODUKTFOTO_GRENZEN } from '../../shared/contracts/produktabruf'
import { legeAbrufAb } from './kandidaten-speicher'
import { endungFuerBildTyp } from './formate'
import { hole } from './netz'
import { findeBildAdressen } from './seite-lesen'

import type { Auftrag } from '../../shared/contracts/auftrag'
import type { ProduktfotoAbrufErgebnis, ProduktfotoKandidat } from '../../shared/contracts/produktabruf'
import type { AusfuehrungsKontext, HandlerErgebnis } from '../auftrags-manager/dispatcher'
import type { GenerischerFehlercode } from '../../shared/contracts/ergebnis'
import type { KandidatIntern } from './kandidaten-speicher'

/** Die fachlichen Fehlergruende des Abrufs. Jeder hat einen Klartext (TK 9.19.9). */
export type ProduktfotoFehlercode =
  | 'kein_netz'
  | 'zeitueberschreitung'
  | 'http_fehler'
  | 'zu_gross'
  | 'lokales_netz'
  | 'weiterleitung'
  | 'format'
  | 'kein_bild'
  | 'keine_seite'

/** Die generischen Codes kommen ueber die Ergebnis-Huelle herein (ungueltige_eingabe u. a.). */
type AbrufGrund = ProduktfotoFehlercode | GenerischerFehlercode

export async function produktfotoAbrufen(
  auftrag: Extract<Auftrag, { art: 'produktfoto-abruf' }>,
  kontext: AusfuehrungsKontext,
): Promise<HandlerErgebnis<ProduktfotoFehlercode>> {
  // Schritt 0: Nutzlast pruefen. Ueber die Grenze reist `unknown` als Typ getarnt
  // (TK 9.1.1 Punkt 6); bis hierher ist nichts geladen und nichts angelegt.
  const nutzlast: unknown = auftrag.payload
  if (typeof nutzlast !== 'object' || nutzlast === null) {
    return fehlgeschlagen('ungueltige_eingabe', 'Der Abrufauftrag hat keine brauchbare Nutzlast.')
  }
  const { projektId, aktionId, produktUrl } = auftrag.payload
  if (typeof projektId !== 'string' || projektId.trim() === '') {
    return fehlgeschlagen('ungueltige_eingabe', 'Es wurde keine brauchbare Projekt-ID uebergeben.')
  }
  // LEER IST ERLAUBT: Im Editor-Modus „neu" gibt es die Aktion noch nicht. Der Abruf
  // schreibt sie nicht (TK 9.19.2) - die Kennung dient nur der Zuordnung der Antwort.
  // Der Treiberlauf vom 12.11.2026 hat gezeigt, was eine zu strenge Pruefung kostet:
  // Der ganze Abruf scheiterte an einer Kennung, die er gar nicht benutzt.
  if (typeof aktionId !== 'string') {
    return fehlgeschlagen('ungueltige_eingabe', 'Es wurde keine brauchbare Aktions-ID uebergeben.')
  }
  const adresse = normalisiereProduktUrl(produktUrl)
  if (adresse === null) {
    return fehlgeschlagen(
      'ungueltige_eingabe',
      'Die Produkt-URL ist keine gültige http(s)-Adresse.',
    )
  }

  // EINE Zeitgrenze fuer Seite UND Bilder (TK 9.19.4: „15 s fuer den gesamten Abruf").
  const bis = Date.now() + PRODUKTFOTO_GRENZEN.zeitgrenzeMs
  kontext.meldeFortschritt(5)

  // Schritt 1: die Seite.
  const seite = await hole(new URL(adresse), PRODUKTFOTO_GRENZEN.maxBildBytes, bis)
  if (!seite.ok) {
    return fehlgeschlagen(seite.fehler.code, textFuer(seite.fehler.code, statusAus(seite.fehler.daten)))
  }
  if (seite.wert.status < 200 || seite.wert.status >= 300) {
    return fehlgeschlagen(
      'http_fehler',
      textFuer('http_fehler', seite.wert.status),
    )
  }
  if (!istHtml(seite.wert.contentType)) {
    return fehlgeschlagen('keine_seite', textFuer('keine_seite'))
  }
  kontext.meldeFortschritt(15)

  // Schritt 2: Bildadressen lesen. Relative Adressen werden gegen die Seite aufgeloest
  // (die NACH Weiterleitungen gueltige Adresse, nicht die eingetippte).
  const html = seite.wert.bytes.toString('utf8')
  const adressen = findeBildAdressen(html, seite.wert.url).slice(
    0,
    PRODUKTFOTO_GRENZEN.maxKandidaten,
  )
  if (adressen.length === 0) {
    return fehlgeschlagen('kein_bild', textFuer('kein_bild'))
  }

  // Schritt 3: die Kandidaten laden. Fehlschlaege einzelner Bilder beenden den Abruf
  // NICHT, solange mindestens eines brauchbar ist - die Seite hat oft Vorschaubilder,
  // Tracking-Pixel oder tote Links neben dem eigentlichen Produktfoto.
  const kandidaten: KandidatIntern[] = []
  let letzterGrund: AbrufGrund | null = null
  let gesamt = 0

  for (const [index, bildAdresse] of adressen.entries()) {
    if (Date.now() >= bis) {
      letzterGrund ??= 'zeitueberschreitung'
      break
    }
    const rest = PRODUKTFOTO_GRENZEN.maxGesamtBytes - gesamt
    if (rest <= 0) {
      letzterGrund ??= 'zu_gross'
      break
    }

    const antwort = await hole(
      new URL(bildAdresse),
      Math.min(PRODUKTFOTO_GRENZEN.maxBildBytes, rest),
      bis,
    )
    if (!antwort.ok) {
      letzterGrund ??= antwort.fehler.code
      continue
    }
    if (antwort.wert.status < 200 || antwort.wert.status >= 300) {
      letzterGrund ??= 'http_fehler'
      continue
    }
    const endung = endungFuerBildTyp(antwort.wert.contentType)
    if (endung === null || antwort.wert.bytes.length === 0) {
      letzterGrund ??= 'format'
      continue
    }
    // Ein einzelnes Bild ueber 8 MB ist ein eigener Grund - der naechste Kandidat darf
    // trotzdem noch geprueft werden.
    if (antwort.wert.bytes.length > PRODUKTFOTO_GRENZEN.maxBildBytes) {
      letzterGrund ??= 'zu_gross'
      continue
    }

    gesamt += antwort.wert.bytes.length
    kandidaten.push({
      url: antwort.wert.url,
      typ: antwort.wert.contentType,
      bytes: antwort.wert.bytes,
    })
    kontext.meldeFortschritt(15 + Math.round((75 * (index + 1)) / adressen.length))
  }

  if (kandidaten.length === 0) {
    const grund = letzterGrund ?? 'kein_bild'
    return fehlgeschlagen(grund, textFuer(grund))
  }

  kontext.meldeFortschritt(95)

  // Schritt 4: ablegen. `abgerufenAm` ist der Zeitpunkt des Abrufs, nicht der Wahl -
  // die Herkunft beschreibt, wann die Bytes geholt wurden (TK 9.19.6).
  const abgerufenAm = new Date().toISOString()
  const abrufId = legeAbrufAb({ projektId, aktionId, abgerufenAm, kandidaten })

  const ergebnis: ProduktfotoAbrufErgebnis = {
    abrufId,
    kandidaten: kandidaten.map((eintrag, index): ProduktfotoKandidat => ({
      index,
      url: eintrag.url,
      typ: eintrag.typ,
      groesse: eintrag.bytes.length,
    })),
  }

  // Wie beim Import: das eigene Ergebnis reist UNVERAENDERT in `Auftrag.ergebnis`.
  return { status: 'erfolg', ergebnis }
}

/** Ist die Antwort eine Produktseite? Leerer Content-Type gilt als "nicht entscheidbar". */
function istHtml(contentType: string): boolean {
  const typ = contentType.split(';')[0]?.trim().toLowerCase() ?? ''
  return (
    typ === '' ||
    typ === 'text/html' ||
    typ === 'application/xhtml+xml' ||
    typ === 'text/xml' ||
    typ === 'application/xml'
  )
}

function statusAus(daten: unknown): number | undefined {
  if (typeof daten !== 'object' || daten === null) return undefined
  // SAFETY: Die Zeile davor belegt ein nicht-null Objekt; der Cast macht `status`
  // lesbar, geprueft wird der Typ unmittelbar darunter.
  const status = (daten as { status?: unknown }).status
  return typeof status === 'number' ? status : undefined
}

/** Der sichtbare Klartext-Grund je Fehlercode (TK 9.19.9). */
function textFuer(code: AbrufGrund, status?: number): string {
  switch (code) {
    case 'kein_netz':
      return 'Keine Verbindung — der Abruf braucht Internet. Alles andere funktioniert weiter.'
    case 'zeitueberschreitung':
      return 'Die Seite hat nicht geantwortet (15 s).'
    case 'http_fehler':
      return status === undefined
        ? 'Die Seite lieferte einen Fehler.'
        : `Die Seite lieferte einen Fehler (${status}).`
    case 'kein_bild':
      return 'Auf dieser Seite wurde kein Produktbild gefunden.'
    case 'format':
      return 'Das Bild hat ein Format, das nicht unterstützt wird.'
    case 'zu_gross':
      return 'Das Bild ist größer als 8 MB.'
    case 'lokales_netz':
      return 'Diese Adresse zeigt in ein lokales Netz und wird nicht abgerufen.'
    case 'weiterleitung':
      return 'Die Adresse leitet zu oft weiter.'
    case 'keine_seite':
      return 'Die Adresse lieferte keine Produktseite (kein HTML).'
    default:
      // Generische Codes (ungueltige_eingabe, unbekannter_fehler): Der Aufrufer hat die
      // Nutzlast schon abgelehnt; hier bleibt nur ein ehrlicher Sammeltext.
      return 'Der Abruf ist unerwartet fehlgeschlagen.'
  }
}

function fehlgeschlagen(
  code: AbrufGrund,
  meldung: string,
): HandlerErgebnis<ProduktfotoFehlercode> {
  return { status: 'fehlgeschlagen', fehler: { code, meldung } }
}
