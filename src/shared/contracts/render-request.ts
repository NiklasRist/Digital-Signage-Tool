// [contracts] Typen RenderRequest und RenderItem definieren

import type { RenderProfile } from './render-profile'
export interface RenderRequest {
  renderId: string
  projektId: string
  elemente: RenderItem[]           // bereits in Wiedergabereihenfolge
  profil: RenderProfile            // s. #18
  ausgabeName: string              // Dateiname OHNE Endung; Ziel projects/<projektId>/output/<ausgabeName>.mp4 (FA-22)
                                    // vorbelegt mit Project.letzterAusgabeName; gleicher Name ersetzt, neuer Name legt an
}

// Zwei Varianten, nicht drei: Die frühere Variante `RenderItemBild` ist mit TK v3.16 entfallen
// (TK 9.2.2). Sie fällt nicht eigenständig weg, sondern als Folge - `RenderItem.art` wird aus
// `Listenelement.art` gebildet, und dort gibt es die Art `bild` nicht mehr (TK 9.11.3). Ein
// solches Item könnte also gar nicht mehr entstehen; ein Zweig ohne Aufrufer liest sich für den
// Nächsten als vorgesehener Weg und wird nachgebaut.
export type RenderItem = RenderItemVideo | RenderItemSegment

export interface RenderItemVideo {
  id: string
  art: 'video'
  medienRef: string                // relativer Pfad in media/
  trimStart: number                // Sekunden
  trimEnde: number                 // Sekunden
  einblendung: {
    art: 'split' | 'einblendung'     // Kompositionsart: Band UNTER bzw. ÜBER dem Video (TK 9.2.8)
    höhe: number                     // Bandhöhe H in Pixeln (ganzzahlig und gerade, TK 9.2.8)
    bandVorlageId: string
    abschnitte: Array<{ png: Uint8Array; dauer: number }>   // Band-PNGs bereits gerendert, je 1920 × höhe
    // Uint8Array (nicht ArrayBuffer/Buffer): überlebt Electrons structured clone
    // verlustfrei und ist der kleinste gemeinsame Nenner zwischen Renderer und Main.
    // Feldname MIT Umlaut ("höhe") wie im Vertrag und wie in Vorlage (#95) – nicht "hoehe".
    /** PFLICHT (TK 9.2.2): FERTIGER Hex-Wert der Farb-Rolle `flaecheDunkel` für die Restflächen
     *  der Split-Komposition – KEIN Rollen-Name, KEINE Marken-Kennung. Beim EINREIHEN aus
     *  `Project.standardMarkeId` aufgelöst und eingefroren (TK 9.2.8, 9.15.4). Pflicht auch bei
     *  `art: 'einblendung'`, wo er nicht benutzt wird: ein optionales Feld hätte „split ohne
     *  Farbe" zugelassen, und der Render-Service dürfte keine Hexzahl tippen (TK 9.11.1 Punkt 7). */
    flaecheDunkel: string
  } | null
}

export interface RenderItemSegment {
  id: string
  art: 'segment'
  png: Uint8Array                  // Binärpuffer, vom Renderer via template-canvas gerendert
  dauer: number
}
