// [produktsuche] Der Auftrag `produktseite-suche` (FA-30 / TK 9.20)
//
// ABLAUF (9.20.1): Stichwort -> zuerst die hinterlegten Shops (hoechstens drei, in
// Prioritaetsreihenfolge) -> NUR wenn dort nichts steht, der Notweg -> hoechstens fuenf
// Treffer zurueck. KEIN Bild, kein Asset, kein Schreibvorgang: Die Suche findet eine
// ADRESSE; die Wahl der Seite setzt sie im Entwurf des Editors, und erst der naechste
// ausdrueckliche Klick („Foto abrufen", FA-27) holt Bytes (AD 4.14).
//
// KEIN CRAWLER: Der Auftrag laeuft genau einmal, wenn der Nutzer ihn ausloest, und endet
// mit Treffern oder Klartext. Ohne Netz scheitert er sichtbar; alles andere laeuft weiter
// (NFA-06, AD 4.14).

import { PRODUKTSUCHE_GRENZEN } from '../../shared/contracts/produktsuche'
import { normalisiereProduktQuellen } from '../../shared/produkt-quellen'
import { leseKonfig } from '../config-store/lese-konfig'
import { sucheUeberNotweg } from './notweg'
import { sucheMitMuster } from './suchseite'

import type { Auftrag } from '../../shared/contracts/auftrag'
import type { GenerischerFehlercode } from '../../shared/contracts/ergebnis'
import type {
  ProduktSeiteTreffer,
  ProduktsucheErgebnis,
} from '../../shared/contracts/produktsuche'
import type { AusfuehrungsKontext, HandlerErgebnis } from '../auftrags-manager/dispatcher'
import type { SuchseitenFehlercode } from './suchseite'

/** Die fachlichen Fehlergruende der Suche. Jeder hat einen Klartext (9.20.4, unten). */
export type ProduktsucheFehlercode = SuchseitenFehlercode | 'keine_treffer'

/** Die generischen Codes kommen ueber die Ergebnis-Huelle herein (ungueltige_eingabe u. a.). */
type SuchGrund = ProduktsucheFehlercode | GenerischerFehlercode

export async function produktseiteSuchen(
  auftrag: Extract<Auftrag, { art: 'produktseite-suche' }>,
  kontext: AusfuehrungsKontext,
): Promise<HandlerErgebnis<ProduktsucheFehlercode>> {
  // Schritt 0: Nutzlast pruefen. Ueber die Grenze reist `unknown` als Typ getarnt
  // (TK 9.1.1 Punkt 6); bis hierher wurde nichts geladen und nichts geschrieben.
  const nutzlast: unknown = auftrag.payload
  if (typeof nutzlast !== 'object' || nutzlast === null) {
    return fehlgeschlagen('ungueltige_eingabe', 'Der Suchauftrag hat keine brauchbare Nutzlast.')
  }
  const { projektId, aktionId, stichwort } = auftrag.payload
  if (typeof projektId !== 'string' || projektId.trim() === '') {
    return fehlgeschlagen('ungueltige_eingabe', 'Es wurde keine brauchbare Projekt-ID uebergeben.')
  }
  // LEER IST ERLAUBT: Im Editor-Modus „neu" gibt es die Aktion noch nicht. Die Suche
  // schreibt sie nicht (9.20.3) - die Kennung ordnet nur die Antwort zu.
  if (typeof aktionId !== 'string') {
    return fehlgeschlagen('ungueltige_eingabe', 'Es wurde keine brauchbare Aktions-ID uebergeben.')
  }
  if (typeof stichwort !== 'string' || stichwort.trim() === '') {
    return fehlgeschlagen('ungueltige_eingabe', 'Es wurde kein Stichwort uebergeben.')
  }
  const begriff = stichwort.trim()

  kontext.meldeFortschritt(5)

  // Die Quellen stehen APP-WEIT in `config.json` (9.20.3). Gelesen wird beim START des
  // Auftrags, nicht beim Einreihen: Zwischen Klick und Lauf kann eine Aenderung liegen,
  // und dann gilt die neuere.
  const gelesen = await leseKonfig()
  if (!gelesen.ok) {
    return fehlgeschlagen(
      'keine_treffer',
      'Die Konfiguration ließ sich nicht lesen — es kann nicht gesucht werden. ' +
        'Die Adresse lässt sich von Hand eintragen.',
    )
  }
  const quellen = normalisiereProduktQuellen(gelesen.wert.produktQuellen)
  if (quellen.shops.length === 0 && quellen.webSuche === null) {
    // Der Editor sagt das schon VOR dem Klick (9.20.3); hier steht es fuer den Fall, dass
    // die Konfiguration zwischen Anzeige und Klick geaendert wurde.
    return fehlgeschlagen(
      'keine_treffer',
      'Es sind keine Shops und keine allgemeine Suche hinterlegt — die Adresse lässt sich ' +
        'von Hand eintragen.',
    )
  }

  // EIN Zeitbudget fuer den GESAMTEN Suchschritt (9.20.4).
  const bis = Date.now() + PRODUKTSUCHE_GRENZEN.zeitgrenzeMs

  const treffer: ProduktSeiteTreffer[] = []
  const gesehen = new Set<string>()
  let letzterGrund: SuchGrund | null = null
  let letzterStatus: number | undefined
  let seiteGelesen = false

  /** Merkt sich den ERSTEN Fehlergrund (der erste nennt die Ursache, nicht der letzte). */
  function merkeGrund(fehler: { code: SuchGrund; daten?: unknown }): void {
    if (letzterGrund !== null) return
    letzterGrund = fehler.code
    // Der Status einer 4xx/5xx-Antwort steht in `daten` (Netzschicht, 9.19.4) - er
    // gehoert in den Klartext, sonst bliebe bei "lieferte einen Fehler" offen, welcher.
    if (typeof fehler.daten === 'object' && fehler.daten !== null) {
      // SAFETY: Die Zeile davor belegt ein nicht-null Objekt; der Cast macht `status`
      // lesbar, geprueft wird der Typ unmittelbar darunter.
      const status = (fehler.daten as { status?: unknown }).status
      if (typeof status === 'number') letzterStatus = status
    }
  }

  /** Nimmt Treffer auf: hoechstens fuenf, Duplikate ueber die normalisierte Adresse (9.20.4). */
  function sammle(neue: readonly ProduktSeiteTreffer[]): void {
    for (const eintrag of neue) {
      if (treffer.length >= PRODUKTSUCHE_GRENZEN.maxTreffer) return
      if (gesehen.has(eintrag.url)) continue
      gesehen.add(eintrag.url)
      treffer.push(eintrag)
    }
  }

  // Schritt 1: die hinterlegten Shops, in Prioritaetsreihenfolge, hoechstens drei.
  const shops = quellen.shops.slice(0, PRODUKTSUCHE_GRENZEN.maxShops)
  for (const [nummer, shop] of shops.entries()) {
    if (treffer.length >= PRODUKTSUCHE_GRENZEN.maxTreffer) break
    if (Date.now() >= bis) {
      letzterGrund ??= 'zeitueberschreitung'
      break
    }

    const antwort = await sucheMitMuster(shop.suchMuster, begriff, bis)
    if (!antwort.ok) {
      // Ein Shop, der nicht antwortet, ist ein Befund und kein Absturz (9.20.2): Der
      // naechste wird trotzdem gefragt.
      merkeGrund(antwort.fehler)
      continue
    }
    seiteGelesen = true
    sammle(antwort.wert)
    kontext.meldeFortschritt(10 + Math.round((50 * (nummer + 1)) / shops.length))
  }

  // Schritt 2: der Notweg - NUR wenn die Shops nichts geliefert haben (9.20.1 Punkt 2).
  if (treffer.length === 0 && quellen.webSuche !== null) {
    if (Date.now() >= bis) {
      letzterGrund ??= 'zeitueberschreitung'
    } else {
      kontext.meldeFortschritt(70)
      const antwort = await sucheUeberNotweg(quellen.webSuche, begriff, bis)
      if (antwort.ok) {
        seiteGelesen = true
        sammle(antwort.wert)
      } else {
        merkeGrund(antwort.fehler)
      }
    }
  }

  if (treffer.length === 0) {
    // Unterschieden wird zwischen "keine Seite war lesbar" (Netzgrund) und "Seiten waren
    // lesbar, boten aber nichts" - der zweite Fall ist der haeufigere und fuer den Nutzer
    // ein anderer Satz.
    if (seiteGelesen) {
      return fehlgeschlagen(
        'keine_treffer',
        'Keine Produktseite gefunden — die Adresse lässt sich von Hand eintragen.',
      )
    }
    const grund = letzterGrund ?? 'keine_treffer'
    return fehlgeschlagen(grund, textFuer(grund, letzterStatus))
  }

  kontext.meldeFortschritt(95)

  const ergebnis: ProduktsucheErgebnis = { treffer }
  // Wie beim Import und beim Produktfoto-Abruf: das eigene Ergebnis reist UNVERAENDERT in
  // `Auftrag.ergebnis` (9.20, Signaturblock 3). Kein Speicher im Main - es sind Zeichenketten.
  return { status: 'erfolg', ergebnis }
}

/** Der sichtbare Klartext-Grund je Fehlercode (9.20.4). */
function textFuer(code: SuchGrund, status?: number): string {
  switch (code) {
    case 'kein_netz':
      return 'Keine Verbindung — die Suche braucht Internet. Alles andere funktioniert weiter.'
    case 'zeitueberschreitung':
      return 'Die Suche hat nicht geantwortet (20 s).'
    case 'http_fehler':
      return status === undefined
        ? 'Die Suchseite lieferte einen Fehler.'
        : `Die Suchseite lieferte einen Fehler (${String(status)}).`
    case 'zu_gross':
      return 'Die Suchseite ist größer als 2 MB.'
    case 'lokales_netz':
      return 'Diese Adresse zeigt in ein lokales Netz und wird nicht abgerufen.'
    case 'weiterleitung':
      return 'Die Adresse leitet zu oft weiter.'
    case 'keine_seite':
      return 'Die Adresse lieferte keine Suchseite (kein HTML).'
    case 'format':
      return 'Die Suchadresse hat kein brauchbares Format (erwartet wird eine http(s)-Adresse mit {q}).'
    case 'keine_treffer':
      return 'Keine Produktseite gefunden — die Adresse lässt sich von Hand eintragen.'
    default:
      // Generische Codes (ungueltige_eingabe, unbekannter_fehler): Der Aufrufer hat die
      // Nutzlast schon abgelehnt; hier bleibt nur ein ehrlicher Sammeltext.
      return 'Die Suche ist unerwartet fehlgeschlagen.'
  }
}

function fehlgeschlagen(
  code: SuchGrund,
  meldung: string,
): HandlerErgebnis<ProduktsucheFehlercode> {
  return { status: 'fehlgeschlagen', fehler: { code, meldung } }
}
