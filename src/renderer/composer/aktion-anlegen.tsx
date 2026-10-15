// #416 - Inline-Anlegen einer Aktion aus dem Reiter Zusammenstellen heraus.
//
// Dünn und zustandsarm: Das Formular haelt GENAU seinen eigenen Entwurf (Titel + gewaehlte
// Vorlage) und ruft beim Klick einen Rueckruf. Die OPERATION (der #136-Weg ueber
// project:erstelleAktion) und die Sicht-Pflege geschehen in der Wurzel - dieses Bauteil
// fuehrt KEINEN IPC-Ruf aus (E1, dieselbe Linie wie bibliothek-ansicht.tsx).

import { useState, type JSX } from 'react'

import type { Vorlage } from '../../shared/contracts/vorlage'

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
  const erste = p.vorlagen[0]
  const [titel, setzeTitel] = useState('')
  const [vorlagenId, setzeVorlagenId] = useState<string>(erste?.id ?? '')

  const bereit = titel.trim() !== '' && vorlagenId !== '' && p.laeuft !== true

  return (
    <div
      data-testid="aktion-anlegen"
      style={{ display: 'flex', flexDirection: 'column', gap: 4, margin: '4px 0' }}
    >
      <input
        type="text"
        data-testid="aktion-anlegen-titel"
        placeholder="Titel der Aktion"
        value={titel}
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
      <button
        type="button"
        data-testid="aktion-anlegen-knopf"
        disabled={!bereit}
        onClick={() => p.aufAnlegen({ titel, vorlagenId })}
      >
        Aktion anlegen
      </button>
    </div>
  )
}
