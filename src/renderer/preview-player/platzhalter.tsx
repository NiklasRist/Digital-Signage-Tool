/* GERUEST-PRUEFSUMME: 72D98D4D6B774CC225B810B108E6627C */
import type { JSX } from 'react'
import React from 'react'

import type { Marke } from '../../shared/contracts/marke'
import type { KaputtGrund } from '../composer/kaputt-erkennung'
import { platzhalterWortlaut } from './platzhalter-text'

export interface PlatzhalterProps {
  grund: KaputtGrund
  /** Die app-weite Marke. Liefert AUSSCHLIESSLICH Farb-Rollen und den Sicherheitsabstand. */
  marke: Marke
  /**
   * Anzeigename des betroffenen Elements, falls bekannt (z. B. Asset.originalname oder
   * Aktion.titel). Fehlt er, wird KEIN Ersatzname erfunden – die Zeile entfaellt.
   */
  titel?: string
}

/** Fuellt die GANZE Buehne: 1920×1080 im Raster von #212. */
export function Platzhalter(props: PlatzhalterProps): JSX.Element {
  const { ueberschrift, erklaerung } = platzhalterWortlaut(props.grund)

  const horizontalPadding = props.marke.sicherheit.horizontal
  const verticalPadding = props.marke.sicherheit.vertikal

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        backgroundColor: props.marke.farben.flaecheDunkel,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: `${verticalPadding}px ${horizontalPadding}px`,
        boxSizing: 'border-box',
        textAlign: 'center',
        border: `2px solid ${props.marke.farben.linie}`,
      }}
    >
      <h2
        style={{
          color: props.marke.farben.textAufDunkel,
          marginBottom: '16px',
        }}
      >
        {ueberschrift}
      </h2>
      <p style={{ color: props.marke.farben.textSekundaer, marginBottom: '8px' }}>{erklaerung}</p>
      {props.titel && (
        <p style={{ color: props.marke.farben.textSekundaer, fontStyle: 'italic' }}>{props.titel}</p>
      )}
    </div>
  )
}
