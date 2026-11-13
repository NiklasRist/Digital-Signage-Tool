// [action-editor] Das Suchfeld im Schritt „Bild" (FA-30 / TK 9.20.1, 9.20.3)
//
// DREI ZUSAGEN, die dieses Bauteil gibt:
//   1. Das Stichwort ist mit `Aktion.titel` VORBELEGT und ueberschreibbar. Wer nichts
//      tippt, sucht nach dem Titel - das ist der haeufigste Fall (9.20.1 Punkt 1).
//   2. Ohne hinterlegte Quelle sagt es das VOR dem Klick und sperrt den Knopf. Ein
//      Auftrag, der sicher scheitert, gehoert nicht in die Warteschlange.
//   3. Ein Klick auf einen Treffer uebernimmt NUR die Adresse in den Entwurf und laedt
//      NICHTS. Erst „Foto abrufen" (FA-27) holt Bytes - zwei Auswahlen, zwei Klicks
//      (AD 4.14).

import { useEffect, useRef, useState } from 'react'
import type { JSX } from 'react'

import { ladeProduktQuellen, starteProduktsuche } from './produktsuche'
import {
  abonniereProduktsuche,
  holeProduktsucheMeldung,
  verbraucheProduktsuche,
  type ProduktsucheMeldung,
} from './produktsuche-meldung'

import type { ProduktQuellen, ProduktSeiteTreffer } from '../../shared/contracts/produktsuche'

export interface ProduktsucheFeldProps {
  projektId: string
  /** Leer, solange die Aktion nur ein Entwurf ist (Modus „neu"). */
  aktionId: string
  /** `Aktion.titel` - die Vorbelegung des Stichworts. */
  titel: string
  /** Uebernimmt die gewaehlte Adresse in den Entwurf. Schreibt NICHT. */
  aufUebernehmen: (url: string) => void
}

/** Steht bei den Treffern, wenn sie nicht (nur) aus hinterlegten Shops stammen. */
export const NOTWEG_VERMERK = 'allgemeine Suche (kann ausfallen)'

export function ProduktsucheFeld({
  projektId,
  aktionId,
  titel,
  aufUebernehmen,
}: ProduktsucheFeldProps): JSX.Element {
  // `null` = noch nicht gelesen. Der Unterschied zu "keine Quelle" ist sichtbar: Solange
  // gelesen wird, steht kein Hinweis und der Knopf ist nicht gesperrt.
  const [quellen, setQuellen] = useState<ProduktQuellen | null>(null)
  // `null` = das Feld folgt dem Titel. Sobald der Nutzer tippt, bleibt sein Text stehen -
  // ein spaeterer Titelwechsel darf die Eingabe nicht ueberschreiben.
  const [eigenesStichwort, setEigenesStichwort] = useState<string | null>(null)
  const [laeuft, setLaeuft] = useState(false)
  const [hinweis, setHinweis] = useState<string | null>(null)
  const [treffer, setTreffer] = useState<ProduktSeiteTreffer[] | null>(null)
  // Die `auftragId` ordnet die Meldung des Nachlaufs DIESEM Editor zu - zwei montierte
  // Editoren (Reiter und Ansicht) duerfen sich nicht gegenseitig bedienen.
  const auftragRef = useRef<string | null>(null)

  useEffect(() => {
    let aktiv = true
    void ladeProduktQuellen().then((gelesen) => {
      if (aktiv) setQuellen(gelesen)
    })
    return () => {
      aktiv = false
    }
  }, [])

  /** Eine Meldung des Nachlaufs verarbeiten - nur die zu UNSEREM Auftrag. */
  function verarbeite(meldung: ProduktsucheMeldung): void {
    if (auftragRef.current === null || meldung.auftragId !== auftragRef.current) return
    verbraucheProduktsuche()
    auftragRef.current = null
    setLaeuft(false)
    if (meldung.status === 'erfolg') {
      setTreffer(meldung.treffer)
      setHinweis(null)
      return
    }
    setHinweis('Die Suche ist fehlgeschlagen – der Grund steht oben in der Meldung.')
  }

  useEffect(() => {
    return abonniereProduktsuche(() => {
      const meldung = holeProduktsucheMeldung()
      if (meldung !== null) verarbeite(meldung)
    })
    // Die Verarbeitung liest nur Refs und Setter - ein Abo je Montage genuegt.
  }, [])

  const stichwort = eigenesStichwort ?? titel
  const ohneQuelle =
    quellen !== null && quellen.shops.length === 0 && quellen.webSuche === null
  // Stammen ALLE Treffer von einem hinterlegten Shop? Dann war der Notweg nicht im Spiel.
  // ABGELEITET, nicht gemeldet: Das Ergebnis der Suche traegt nur die Treffer (9.20,
  // Signaturblock 2). Ein zusaetzliches Feld waere eine Vertragsaenderung fuer eine
  // Beschriftung; die Hosts sagen dasselbe.
  const nurShops =
    treffer !== null &&
    treffer.length > 0 &&
    quellen !== null &&
    treffer.every((eintrag) =>
      quellen.shops.some((shop) => shop.host === eintrag.host.toLowerCase()),
    )

  async function suche(): Promise<void> {
    const begriff = stichwort.trim()
    if (begriff.length === 0) {
      setHinweis('Bitte ein Stichwort eintragen.')
      return
    }
    setHinweis(null)
    setTreffer(null)
    setLaeuft(true)
    const antwort = await starteProduktsuche(projektId, aktionId, begriff)
    if (!antwort.ok) {
      setLaeuft(false)
      setHinweis(`Suche nicht gestartet: ${antwort.fehler.meldung}`)
      return
    }
    auftragRef.current = antwort.wert.auftragId
    // Ein sehr schneller Fehlschlag kann VOR dieser Zeile gemeldet worden sein.
    const schonDa = holeProduktsucheMeldung()
    if (schonDa !== null) verarbeite(schonDa)
  }

  return (
    <div
      data-testid="produkt-suche"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        borderTop: '1px solid #333',
        paddingTop: 6,
        marginTop: 2,
      }}
    >
      <label style={{ display: 'block' }}>Stichwort suchen{' '}
        <input
          type="text"
          value={stichwort}
          placeholder={titel.length > 0 ? titel : 'z. B. Proteinriegel'}
          data-testid="produkt-suche-stichwort"
          style={{ display: 'block', width: '100%', boxSizing: 'border-box' }}
          onChange={(ereignis) => {
            setEigenesStichwort(ereignis.target.value)
          }}
        />
      </label>
      <button
        type="button"
        data-testid="produkt-suche-knopf"
        disabled={laeuft || ohneQuelle}
        onClick={() => {
          void suche()
        }}
      >
        {laeuft ? 'Suche läuft …' : 'Seiten suchen'}
      </button>
      {ohneQuelle && (
        <p data-testid="produkt-suche-ohne-quelle" style={{ color: '#9aa4b2', fontSize: 11, margin: 0 }}>
          Es sind keine Shops und keine allgemeine Suche hinterlegt – die Adresse lässt sich
          von Hand eintragen.
        </p>
      )}
      {hinweis !== null && (
        <p data-testid="produkt-suche-hinweis" style={{ color: '#9aa4b2', fontSize: 11, margin: 0 }}>
          {hinweis}
        </p>
      )}
      {treffer !== null && (
        <div
          data-testid="produkt-suche-treffer"
          style={{ display: 'flex', flexDirection: 'column', gap: 3 }}
        >
          {!nurShops && (
            <p data-testid="produkt-suche-quelle" style={{ color: '#d9a441', fontSize: 11, margin: 0 }}>
              {NOTWEG_VERMERK} – die Adresse lässt sich auch von Hand eintragen.
            </p>
          )}
          {treffer.map((eintrag, index) => (
            <button
              key={eintrag.url}
              type="button"
              data-testid={`produkt-suche-treffer-${String(index)}`}
              onClick={() => {
                aufUebernehmen(eintrag.url)
                setTreffer(null)
                setHinweis('Die Adresse steht im Feld „Produkt-URL" – „Foto abrufen" holt das Bild.')
              }}
            >
              {eintrag.titel} · {eintrag.host}
              <br />
              <span style={{ color: '#9aa4b2', fontSize: 11 }}>{eintrag.url}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
