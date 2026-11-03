// #416 - Inline-Anlegen einer Aktion aus dem Reiter Zusammenstellen heraus.
//
// Dünn und zustandsarm: Das Formular haelt GENAU seinen eigenen Entwurf (Titel + gewaehlte
// Vorlage) und ruft beim Klick einen Rueckruf. Die OPERATION (der #136-Weg ueber
// project:erstelleAktion) und die Sicht-Pflege geschehen in der Wurzel - dieses Bauteil
// fuehrt KEINEN IPC-Ruf aus (E1, dieselbe Linie wie bibliothek-ansicht.tsx).
//
// 02.11.2026 - DAS FORMULAR STECKT HINTER EINEM KNOPF (Uebergabe-Schritt 1): Es stand
// IMMER offen und kostete der Rail rund 100 px Hoehe - deshalb scrollte die Bibliothek
// ueberhaupt. Jetzt oeffnet "+ Neue Aktion" es; "Abbrechen" oder ein abgeschickter
// Entwurf schliessen es wieder. Der Entwurf bleibt nur im Titel NICHT stehen: Wer eine
// Aktion angelegt hat, will die naechste anlegen, nicht dieselbe noch einmal (ein
// zweiter Klick auf "Anlegen" haette sonst eine Dublette erzeugt).
//
// SCHEITERT das Anlegen, erscheint der Fehler in der STEHENDEN WURZEL-MELDUNG
// (composer/index.tsx:536-554) - nicht in diesem Bauteil. Das Formular ist dann zu und
// der Titel weg; bei einem Fehler auf dieser Ebene ist nichts getippt, was zu retten
// waere (der Knopf ist bei leerem Titel gesperrt).

import { useState, type JSX } from 'react'

import type { Vorlage } from '../../shared/contracts/vorlage'
import { vorlageFuerNeueAktion } from '../gemeinsam/vorlage-vorbelegung'

export interface AktionAnlegenEingabe {
  titel: string
  vorlagenId: string
}

export interface AktionAnlegenEigenschaften {
  /** Die nutzbaren Vorlagen (app-weit). Leer = kein Anlegen moeglich. */
  vorlagen: readonly Vorlage[]
  /** Legt an - die Wurzel fuehrt aus und meldet Fehler. */
  aufAnlegen: (eingabe: AktionAnlegenEingabe) => void
  /** true, solange ein Anlegen laeuft - der Knopf ist dann gesperrt. */
  laeuft?: boolean
}

/** Das Inline-Formular „Aktion anlegen" (Titel + Vorlage; Marke = Projekt-Standardmarke). */
export function AktionAnlegen(p: AktionAnlegenEigenschaften): JSX.Element {
  // 02.11.2026: zu, bis jemand anlegen will. Die Rail ist der engste Ort der
  // Oberflaeche - ein dauerhaft offenes Formular nimmt der Bibliothek die Hoehe.
  const [offen, setzeOffen] = useState(false)
  const [titel, setzeTitel] = useState('')
  // 03.11.2026: dieselbe Vorbelegung wie „Neue Aktion" im Aktions-Editor -
  // die zuletzt benutzte Vorlage, sonst die erste (gemeinsam/vorlage-vorbelegung).
  const [vorlagenId, setzeVorlagenId] = useState<string>(() => vorlageFuerNeueAktion(p.vorlagen))

  const bereit = titel.trim() !== '' && vorlagenId !== '' && p.laeuft !== true

  const schliesse = (): void => {
    setzeTitel('')
    setzeOffen(false)
  }

  if (!offen) {
    return (
      <button
        type="button"
        data-testid="aktion-anlegen-oeffnen"
        onClick={() => setzeOffen(true)}
        style={{ width: '100%' }}
      >
        + Neue Aktion
      </button>
    )
  }

  return (
    <form
      data-testid="aktion-anlegen"
      onSubmit={(ereignis) => {
        ereignis.preventDefault()
        if (!bereit) return
        p.aufAnlegen({ titel, vorlagenId })
        schliesse()
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: 4, margin: '4px 0' }}
    >
      <input
        type="text"
        data-testid="aktion-anlegen-titel"
        placeholder="Titel der Aktion"
        value={titel}
        autoFocus
        onChange={(ereignis) => setzeTitel(ereignis.target.value)}
        style={{ fontSize: 12 }}
      />
      <select
        data-testid="aktion-anlegen-vorlage"
        value={vorlagenId}
        onChange={(ereignis) => setzeVorlagenId(ereignis.target.value)}
        style={{ fontSize: 12 }}
      >
        {p.vorlagen.map((vorlage) => (
          <option key={vorlage.id} value={vorlage.id}>
            {vorlage.name}
          </option>
        ))}
      </select>
      <div style={{ display: 'flex', gap: 4 }}>
        <button
          type="submit"
          data-testid="aktion-anlegen-knopf"
          disabled={!bereit}
          style={{ flex: '1 1 auto' }}
        >
          Anlegen
        </button>
        <button type="button" data-testid="aktion-anlegen-abbrechen" onClick={schliesse}>
          Abbrechen
        </button>
      </div>
    </form>
  )
}
