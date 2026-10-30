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
    höhe: number                     // Bandhöhe H in Pixeln (ganzzahlig und gerade, TK 9.2.8)
    bandVorlageId: string
    abschnitte: Array<{ png: Uint8Array; dauer: number }>   // Band-PNGs bereits gerendert, je 1920 × höhe
    // Uint8Array (nicht ArrayBuffer/Buffer): überlebt Electrons structured clone
    // verlustfrei und ist der kleinste gemeinsame Nenner zwischen Renderer und Main.
    // Feldname MIT Umlaut ("höhe") wie im Vertrag und wie in Vorlage (#95) – nicht "hoehe".
    // `art` und `flaecheDunkel` sind mit TK v3.31 entfallen (9.2.2): Es gibt genau EINE
    // Komposition - das Band liegt DECKEND ueber dem vollflaechigen Video (9.2.8).
  } | null
}

export interface RenderItemSegment {
  id: string
  art: 'segment'
  png: Uint8Array                  // Binärpuffer, vom Renderer via template-canvas gerendert
  dauer: number
}
