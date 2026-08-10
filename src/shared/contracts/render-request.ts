// GENERIERT aus dem Signaturblock von Issue #17.
// [contracts] Typen RenderRequest und RenderItem definieren
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
// GERUEST-PRUEFSUMME: 87f5669e9359d9af

import type { RenderProfile } from './render-profile'
export interface RenderRequest {
  renderId: string
  projektId: string
  elemente: RenderItem[]           // bereits in Wiedergabereihenfolge
  profil: RenderProfile            // s. #18
  ausgabeName: string              // Dateiname OHNE Endung; Ziel projects/<projektId>/output/<ausgabeName>.mp4 (FA-22)
                                    // vorbelegt mit Project.letzterAusgabeName; gleicher Name ersetzt, neuer Name legt an
}

export type RenderItem = RenderItemVideo | RenderItemBild | RenderItemSegment

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
  } | null
}

export interface RenderItemBild {
  id: string
  art: 'bild'
  medienRef: string
  dauer: number
}

export interface RenderItemSegment {
  id: string
  art: 'segment'
  png: Uint8Array                  // Binärpuffer, vom Renderer via template-canvas gerendert
  dauer: number
}
