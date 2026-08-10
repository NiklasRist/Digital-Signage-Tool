// GENERIERT aus dem Signaturblock von Issue #18.
// [contracts] RenderProfile-Konstante definieren
//
// Die Signaturen sind VERBINDLICH und stammen woertlich aus dem Issue - nicht
// aendern. Zu fuellen ist ausschliesslich der Rumpf; jeder wirft heute und nennt
// dabei sein Issue. Wer hier eine Signatur anpasst, aendert einen Vertrag, auf den
// sich andere Module stuetzen - das gehoert ins Issue, nicht in diese Datei.

export interface RenderProfile {
  breite: 1920
  hoehe: 1080
  fps: 30                          // CFR
  videoCodec: 'h264'
  profil: 'high'
  level: '4.0'
  pixelformat: 'yuv420p'
  bitTiefe: 8
  ratensteuerung: { zielBitrateKbps: 10000; maxBitrateKbps: 12000; vbvBufferKbit: 24000 }
  gopMaxSekunden: 2                // geschlossen, IDR je Segmentanfang
  farbmetadaten: { primaries: 'bt709'; transfer: 'bt709'; matrix: 'bt709' }
  sar: '1:1'
  audio: { codec: 'aac'; sampleRateHz: 48000; kanaele: 1; still: true }
  faststart: true
  container: 'mp4'
  // KEIN dateiname: Der Ausgabename ist NICHT Teil des Profils, sondern
  // kommt je Lauf als RenderRequest.ausgabeName (FA-22, TK 9.2.1).
}

export const RENDER_PROFILE: RenderProfile = {
  breite: 1920, hoehe: 1080, fps: 30,
  videoCodec: 'h264', profil: 'high', level: '4.0',
  pixelformat: 'yuv420p', bitTiefe: 8,
  ratensteuerung: { zielBitrateKbps: 10000, maxBitrateKbps: 12000, vbvBufferKbit: 24000 },
  gopMaxSekunden: 2,
  farbmetadaten: { primaries: 'bt709', transfer: 'bt709', matrix: 'bt709' },
  sar: '1:1',
  audio: { codec: 'aac', sampleRateHz: 48000, kanaele: 1, still: true },
  faststart: true, container: 'mp4',
}
