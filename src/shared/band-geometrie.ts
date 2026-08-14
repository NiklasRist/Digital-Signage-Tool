// GENERIERT aus dem Signaturblock von Issue #239.
// [contracts] Bandgeometrie in den geteilten Bereich ziehen
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
// GERUEST-PRUEFSUMME: 19493e1f1481d08c
//
// ============================================================================
// DIE EINZIGE STELLE, AN DER DIE BANDGEOMETRIE GERECHNET WIRD
// ============================================================================
// `render-service` (TK 9.2.8) und `preview-player` (TK 9.9.2) rufen DIESELBE
// Funktion auf; keiner von beiden rechnet selbst. Deshalb liegt sie im
// geteilten Bereich: Laege sie im Main, koennte der Renderer sie nicht
// importieren (TK 9.1) und muesste sie abschreiben - und abgeschriebene Formeln
// driften. Eine Vorschau, die leicht daneben liegt, ist schlechter als gar
// keine: Sie erteilt eine Freigabe, die sie nicht decken kann.
//
// WARUM DIE VIERER-ABRUNDUNG BINDEND IST (TK 9.2.8): `yuv420p` (TK 9.2.4)
// tastet die Farbe in BEIDEN Richtungen um den Faktor zwei unter und verlangt
// deshalb eine gerade Breite UND einen geraden x-Versatz. Die gerade Bandhoehe
// allein genuegt dafuer nicht: (1080 - H) x 16/9 ist nur ganzzahlig, wenn
// 1080 - H durch 18 teilbar ist. Und selbst eine gerade Breite reicht nicht,
// weil (1920 - Breite) / 2 nur dann gerade ist, wenn die Breite durch 4 teilbar
// ist (1564 -> 178 richtig, 1562 -> 179 falsch). Das Abrunden auf ein
// Vielfaches von 4 erfuellt beide Bedingungen in einem Schritt. Der Rest von
// hoechstens 3 px faellt in die seitlichen Fuellflaechen und ist unsichtbar.
// AUFRUNDEN IST VERBOTEN: Es vergroesserte das Video ueber den Video-Bereich
// hinaus und braeche die Zusage „contain ohne Beschnitt".
//
// DIE FALLE: Die eingebaute Band-Vorlage (H = 162) geht zufaellig glatt auf -
// 918 x 16/9 = 1632, bereits durch 4 teilbar, es wird nichts weggerundet. Wer
// die Abrundung vergisst, falsch rundet oder aufrundet, besteht JEDEN Test mit
// ihr. Glatt aufgehende Hoehen sind selten - nachgerechnet sind es 59 der 539
// geraden, genau die durch 18 teilbaren -, und H = 162 ist die einzige, die in
// der Auslieferung vorkommt. Der Fehler zeigt sich also erst bei einer eigenen
// Vorlage, und dann nicht als Meldung, sondern als drei Pixel Versatz. Die
// Tests dieser Datei pruefen deshalb den GANZEN Hoehenbereich, nicht das
// Beispiel.
//
// WOFUER DIE SIEBEN FELDER GELTEN: Diese Funktion bekommt nur die Hoehe - sie
// weiss nicht, wie das Band zusammengesetzt wird, und das ist richtig so. Bei
// `split` (Band UNTER dem verkleinerten Video) gelten alle sieben Felder. Bei
// `einblendung` (Band UEBER dem vollflaechigen Video) bleibt das Video
// 1920 x 1080, es gibt nichts einzupassen - dort ist `bandY` das EINZIGE
// bedeutungstragende Feld, die uebrigen sechs beschreiben eine Aufteilung, die
// in dieser Betriebsweise nicht stattfindet. Wer sie dort liest, liest Zahlen
// ohne Gegenstand.
//
// WAS HIER NICHT PASSIERT: keine Pruefung der Hoehe (weder ganzzahlig noch
// gerade noch im Bereich), kein Fehlercode, keine Ergebnis-Huelle, kein
// `throw`, kein Klemmen und kein Mindestwert. Die Funktion ist TOTAL. Das
// Urteil ueber eine unbrauchbare Hoehe faellt der `render-service`
// (`ungueltiges_element`, TK 9.2.8) - er ist Torwaechter am Auftrags-Eingang
// und kennt die Fehlercodes des Main; eine zweite, leicht abweichende Pruefung
// hier waere eine zweite Wahrheit ueber zulaessige Bandhoehen. Ebenso nicht
// hier: Farben (die Fuellflaechen sind eine Farb-Entscheidung), das
// Nachschlagen der Vorlage (die Hoehe kommt als Parameter herein - beim Render
// aus dem beim Einreihen eingefrorenen Auftrag, TK 9.3.5) und das
// Zeitverhalten der Band-Abschnitte.

import { RENDER_PROFILE } from './contracts/render-profile'

export interface BandGeometrie {
  /** Breite des Video-Bereichs – immer die Profilbreite (1920). */
  videoBereichBreite: number
  /** Hoehe des Video-Bereichs: 1080 − H. */
  videoBereichHöhe: number
  /**
   * Breite des tatsaechlich eingepassten Videos (16:9-Quelle):
   * `videoBereichHöhe × 16 / 9`, ABGERUNDET auf das naechstkleinere Vielfache von 4 (TK 9.2.8).
   */
  videoBreite: number
  /** Hoehe des eingepassten Videos – hoehenbegrenzt, also gleich `videoBereichHöhe`. */
  videoHöhe: number
  /** Linker Rand des eingepassten Videos: `(videoBereichBreite − videoBreite) / 2`. */
  videoVersatzX: number
  /** Oberer Rand des eingepassten Videos im Video-Bereich – immer 0 (hoehenbegrenzt). */
  videoVersatzY: number
  /** Obere Kante des Bandes im 1920×1080-Bild: 1080 − H. */
  bandY: number
}

/**
 * Die REINE Rechnung. Total: wirft nie, liefert immer eine vollstaendig belegte Geometrie,
 * traegt KEINE Ergebnis-Huelle und KEINEN Fehlercode.
 *
 * VORBEDINGUNG (wird hier NICHT geprueft – s. „Was hier NICHT passiert"):
 *   `höhe` ist ganzzahlig, gerade, > 0 und < RENDER_PROFILE.hoehe.
 * Die Pruefung dieser Vorbedingung und die Vergabe des Fehlercodes `ungueltiges_element`
 * bleiben im render-service (TK 9.2.8).
 */
export function berechneBandGeometrie(höhe: number): BandGeometrie {
  // Die Masse sind Datenwerte aus dem Profil (#18), keine Zahlen im Code: Eine
  // spaetere Profil-Aenderung muss sich hier von selbst auswirken.
  const videoBereichBreite = RENDER_PROFILE.breite
  const videoBereichHöhe = RENDER_PROFILE.hoehe - höhe

  // GENAU EINE Rundungsstelle und GENAU EINE Division. `videoBereichHöhe * 4`
  // bleibt eine ganze Zahl; `videoBereichHöhe * 4 / 9` ist dasselbe wie
  // `videoBereichHöhe * 16 / 9 / 4`, nur ohne Zwischenschritt. Wer stattdessen
  // erst auf eine ganze Zahl und danach noch einmal auf 4 rundet, bekommt zwar
  // dieselben Werte, hat aber eine zweite Rundungsstelle in einer Zeile, in der
  // es keine geben muss. Die 16, die 9 und die 4 stammen NICHT aus dem Profil,
  // sondern aus dem Seitenverhaeltnis 16:9 und aus der 4:2:0-Abtastung von
  // `yuv420p` - aus dem Profil abgeleitet waeren sie eine Scheingenauigkeit.
  // Kaufmaennisches und aufrundendes Runden sind hier verboten: Es gibt genau
  // eine Rundung, und die geht nach unten.
  const videoBreite = Math.floor((videoBereichHöhe * 4) / 9) * 4

  return {
    videoBereichBreite,
    videoBereichHöhe,
    videoBreite,
    // Hoehenbegrenzt: Der 16:9-Rahmen fuellt den Video-Bereich senkrecht ganz aus,
    // waagerecht bleibt links und rechts Fuellflaeche.
    videoHöhe: videoBereichHöhe,
    // Zentriert. Weil `videoBreite` durch 4 teilbar ist, ist die Differenz zur
    // Profilbreite es auch - die Haelfte davon ist deshalb ganzzahlig UND gerade.
    videoVersatzX: (videoBereichBreite - videoBreite) / 2,
    videoVersatzY: 0,
    // Das Band sitzt unmittelbar unter dem Video-Bereich; beide Kanten fallen
    // zusammen. Bei `einblendung` ist dies der einzige benutzte Wert.
    bandY: videoBereichHöhe,
  }
}
