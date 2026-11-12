// [produktfoto] Netzabruf mit harten Grenzen (FA-27 / TK 9.19.4)
//
// WARUM DIESE DATEI SO VORSICHTIG IST: Die Adresse stammt vom Nutzer. Ohne Grenzen waere
// der Abruf ein Werkzeug gegen das eigene Netz (SSRF): `http://192.168.0.1/…` oder ein
// Name, der auf 127.0.0.1 zeigt, wuerde vom Main brav geladen. Deshalb gilt:
//
//   - nur http/https,
//   - keine lokalen Ziele - geprueft wird die AUFGELOESTE Adresse (ueber `lookup`), nicht
//     nur der Name; damit faellt auch DNS-Rebinding auf einen privaten Zieleintrag auf,
//   - hoechstens drei Weiterleitungen, jede erneut geprueft,
//   - 15 s gesamt, Groessenobergrenze je Antwort.
//
// Der `lookup`-Haken ist der Kern: Er wird von Node VOR dem Verbindungsaufbau gerufen und
// liefert die Adresse, die tatsaechlich benutzt wird. Ein Vorab-`dns.lookup` daneben waere
// eine zweite Aufloesung mit einem Zeitfenster dazwischen.

import dns from 'node:dns'
import http from 'node:http'
import https from 'node:https'
import { isIP } from 'node:net'

import type { IncomingMessage } from 'node:http'
import type { Ergebnis } from '../../shared/contracts/ergebnis'

/** Die Fehlergruende dieses Moduls. Die Klartexte dazu entstehen im Handler (9.19.9). */
export type NetzFehlercode =
  | 'kein_netz'
  | 'zeitueberschreitung'
  | 'http_fehler'
  | 'zu_gross'
  | 'lokales_netz'
  | 'weiterleitung'
  | 'format'

export interface NetzAntwort {
  /** Die Adresse, die tatsaechlich geantwortet hat (nach Weiterleitungen). */
  url: string
  status: number
  contentType: string
  bytes: Buffer
  /** Ziel einer Weiterleitung (Status 3xx), sonst `null`. Nur `hole` wertet das aus. */
  weiter: string | null
}

export type NetzErgebnis = Ergebnis<NetzAntwort, NetzFehlercode>

/**
 * Ist die Adresse oeffentlich? `false` heisst: lokales Netz, Loopback, Link-Local,
 * Unique-Local, Multicast/reserviert oder gar keine IP-Adresse.
 *
 * Exportiert, weil die Regel die einzige Sicherheitszusage dieser Datei ist - sie wird
 * direkt geprueft, nicht nur ueber einen Netzaufruf.
 */
export function istOeffentlicheAdresse(adresse: string): boolean {
  const bereinigt = adresse.trim().toLowerCase()
  const art = isIP(bereinigt)
  if (art === 4) return istOeffentlichesIpv4(bereinigt)
  if (art === 6) return istOeffentlichesIpv6(bereinigt)
  return false
}

function istOeffentlichesIpv4(adresse: string): boolean {
  const teile = adresse.split('.')
  if (teile.length !== 4) return false
  const zahlen = teile.map((teil) => Number(teil))
  if (zahlen.some((zahl) => !Number.isInteger(zahl) || zahl < 0 || zahl > 255)) return false
  const [a = 0, b = 0] = zahlen

  if (a === 0) return false // "dieses Netz"
  if (a === 10) return false // privat
  if (a === 127) return false // Loopback
  if (a === 169 && b === 254) return false // Link-Local
  if (a === 172 && b >= 16 && b <= 31) return false // privat
  if (a === 192 && b === 168) return false // privat
  if (a === 100 && b >= 64 && b <= 127) return false // Carrier-Grade NAT
  if (a >= 224) return false // Multicast, reserviert, Broadcast
  return true
}

function istOeffentlichesIpv6(adresse: string): boolean {
  // Zonen-Kennung (`fe80::1%en0`) abschneiden - sie gehoert nicht zur Adresse.
  const ohneZone = adresse.split('%')[0] ?? adresse

  if (ohneZone === '::' || ohneZone === '::1') return false
  // fe80::/10 - die ersten vier Hexzeichen sind fe8_, fe9_, fea_ oder feb_.
  if (/^fe[89ab]/.test(ohneZone)) return false
  // fc00::/7 - fc__ oder fd__.
  if (/^f[cd]/.test(ohneZone)) return false
  // ff00::/8 - Multicast.
  if (ohneZone.startsWith('ff')) return false

  // IPv4-mapped (::ffff:127.0.0.1 oder ::ffff:7f00:1): die eingebettete Adresse zaehlt.
  if (ohneZone.startsWith('::ffff:')) {
    const rest = ohneZone.slice('::ffff:'.length)
    if (rest.includes('.')) return istOeffentlichesIpv4(rest)
    const teile = rest.split(':')
    if (teile.length === 2) {
      const hoch = Number.parseInt(teile[0] ?? '', 16)
      const tief = Number.parseInt(teile[1] ?? '', 16)
      if (!Number.isInteger(hoch) || !Number.isInteger(tief)) return false
      const eingebettet = [hoch >> 8, hoch & 0xff, tief >> 8, tief & 0xff].join('.')
      return istOeffentlichesIpv4(eingebettet)
    }
    return false
  }
  return true
}

type LookupRueckruf = (
  fehler: NodeJS.ErrnoException | null,
  adresse: string,
  familie: number,
) => void

/**
 * Nodes `lookup`-Haken: loest auf, prueft JEDE aufgeloeste Adresse und gibt nur eine
 * oeffentliche weiter. Bleibt keine oeffentliche uebrig, wird der Name verworfen - sonst
 * haengt es davon ab, welche Adresse Node zufaellig zuerst nimmt.
 */
function geprueftesLookup(
  hostname: string,
  optionen: dns.LookupOptions,
  rueckruf: LookupRueckruf,
): void {
  dns.lookup(hostname, { all: true, family: optionen.family }, (fehler, adressen) => {
    if (fehler !== null) {
      rueckruf(fehler, '', 4)
      return
    }
    const liste = Array.isArray(adressen) ? adressen : []
    const erlaubt = liste.filter((eintrag) => istOeffentlicheAdresse(eintrag.address))
    const erste = erlaubt[0]
    if (erste === undefined) {
      // SAFETY: `Error` ist kein `ErrnoException`; der Cast macht nur das Feld `code`
      // lesbar, das hier unmittelbar darauf gesetzt und von `ausNetzfehler` geprueft wird.
      const eigen = new Error('lokales_netz') as NodeJS.ErrnoException
      eigen.code = 'LOKALES_NETZ'
      rueckruf(eigen, '', 4)
      return
    }
    rueckruf(null, erste.address, erste.family)
  })
}

function fehler(code: NetzFehlercode, status?: number): { ok: false; fehler: { code: NetzFehlercode; meldung: string; daten?: unknown } } {
  if (status === undefined) {
    return { ok: false, fehler: { code, meldung: code } }
  }
  return { ok: false, fehler: { code, meldung: code, daten: { status } } }
}

/** Ist die Adresse als Ziel ueberhaupt zulaessig? Geprueft wird das, was dasteht. */
function istZieladresse(ziel: URL): boolean {
  if (ziel.protocol !== 'http:' && ziel.protocol !== 'https:') return false
  const name = ziel.hostname.replace(/^\[|\]$/g, '')
  if (isIP(name) !== 0) return istOeffentlicheAdresse(name)
  return true
}

/** Eine einzelne Anfrage - ohne Weiterleitungslogik, aber mit allen Grenzen. */
async function einmal(ziel: URL, maxBytes: number, bis: number): Promise<NetzErgebnis> {
  const restMs = bis - Date.now()
  if (restMs <= 0) return fehler('zeitueberschreitung')

  return new Promise<NetzErgebnis>((erfuellen) => {
    let beendet = false
    const fertig = (ergebnis: NetzErgebnis): void => {
      if (beendet) return
      beendet = true
      erfuellen(ergebnis)
    }

    const modul = ziel.protocol === 'https:' ? https : http
    const anfrage = modul.request(
      {
        protocol: ziel.protocol,
        hostname: ziel.hostname,
        port: ziel.port === '' ? undefined : Number(ziel.port),
        path: `${ziel.pathname}${ziel.search}`,
        method: 'GET',
        headers: {
          // Kein Browser-Profil, kein Cookie, kein Login: Der Abruf liest die
          // oeffentliche Seite so, wie sie jedem anonym ausgeliefert wird.
          'user-agent': 'Digital-Signage-Tool/1.0 (Produktfoto-Abruf)',
          accept: 'text/html,application/xhtml+xml,image/*;q=0.9,*/*;q=0.1',
          'accept-encoding': 'identity',
        },
        lookup: geprueftesLookup,
        timeout: Math.max(1, restMs),
      },
      (antwort: IncomingMessage) => {
        const status = antwort.statusCode ?? 0
        const contentType = String(antwort.headers['content-type'] ?? '')
        const weiter = antwort.headers.location

        if (status >= 300 && status < 400 && typeof weiter === 'string' && weiter.length > 0) {
          antwort.resume() // Koerper verwerfen, Verbindung freigeben.
          fertig({
            ok: true,
            wert: {
              url: ziel.href,
              status,
              contentType,
              bytes: Buffer.alloc(0),
              weiter,
            },
          })
          return
        }

        const stuecke: Buffer[] = []
        let groesse = 0
        antwort.on('data', (stueck: Buffer) => {
          groesse += stueck.length
          if (groesse > maxBytes) {
            antwort.destroy()
            fertig(fehler('zu_gross'))
            return
          }
          stuecke.push(stueck)
        })
        antwort.on('end', () => {
          fertig({
            ok: true,
            wert: {
              url: ziel.href,
              status,
              contentType,
              bytes: Buffer.concat(stuecke),
              weiter: null,
            },
          })
        })
        antwort.on('error', (ursache: Error) => {
          fertig(ausNetzfehler(ursache))
        })
      },
    )

    anfrage.on('timeout', () => {
      anfrage.destroy()
      fertig(fehler('zeitueberschreitung'))
    })
    anfrage.on('error', (ursache: Error) => {
      fertig(ausNetzfehler(ursache))
    })
    anfrage.end()
  })
}

function ausNetzfehler(ursache: Error & { code?: string }): { ok: false; fehler: { code: NetzFehlercode; meldung: string } } {
  if (ursache.code === 'LOKALES_NETZ' || ursache.message === 'lokales_netz') {
    return { ok: false, fehler: { code: 'lokales_netz', meldung: 'lokales_netz' } }
  }
  return { ok: false, fehler: { code: 'kein_netz', meldung: 'kein_netz' } }
}

/**
 * Laedt eine Adresse mit Weiterleitungen. `maxBytes` gilt fuer JEDE Antwort - eine
 * Weiterleitung liefert keinen Koerper.
 */
export async function hole(
  start: URL,
  maxBytes: number,
  bis: number,
): Promise<NetzErgebnis> {
  let aktuell = start

  for (let nummer = 0; nummer <= 3; nummer += 1) {
    if (!istZieladresse(aktuell)) {
      return fehler('lokales_netz')
    }
    if (Date.now() >= bis) return fehler('zeitueberschreitung')

    const antwort = await einmal(aktuell, maxBytes, bis)
    if (!antwort.ok) return antwort

    const { status, weiter } = antwort.wert
    if (status < 300 || status >= 400) {
      return antwort
    }

    if (weiter === null) return fehler('http_fehler', status)
    if (nummer === 3) return fehler('weiterleitung')

    let ziel: URL
    try {
      // Gegen die AKTUELLE Adresse aufgeloest - relative Ziele sind erlaubt.
      ziel = new URL(weiter, aktuell)
    } catch {
      return fehler('weiterleitung')
    }
    if (ziel.protocol !== 'http:' && ziel.protocol !== 'https:') {
      return fehler('weiterleitung')
    }
    aktuell = ziel
  }

  return fehler('weiterleitung')
}
