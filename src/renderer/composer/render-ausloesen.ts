// GENERIERT aus dem Signaturblock von Issue #134.
// [composer] Render und Export auslösen
//
// Signaturen VERBINDLICH aus dem Issue; der Rumpf ist gefuellt - die
// GERUEST-PRUEFSUMME gilt nicht mehr, die Datei wurde bearbeitet.
//
// DREI TEURE STILLE FEHLER, gegen die der Ablauf verdrahtet ist:
//  1. kein DIREKTER Aufruf des Renders: Der Weg fuehrt über reiheEin (TK 9.3.4) -
//     sonst umgeht ein zweiter Weg die serielle Freigabe des Torwächters (NFA-09),
//     und ein Löschauftrag koennte mitten im Render dieselbe Datei anfassen (EBUSY).
//  2. Kaputte Stellen SPERREN: Ein Render mit Platzhaltern wäre erst später
//     an mangelhafter  zu erkennen, gebaut und abgebrochen; die Führung
//     aus TK 9.7.4 lebte an der andern Stelle.
//  3. Der Ausgabename ist NUTZEREINGABE (TK 9.2.6) und wird VORGEPRÜFT;
//     '../' blende nicht examiner aus (kein Apsprung aus dem Projektordner).
//
// Der Ablauf (abgehandelt im Issue):
//   1. Sperre   : Kaputt-Erkennung (#131) - mit daten{stellen} abgelehnt.
//   2. Namens-VP: Nur die VORPRUEFUNG als Rückmeldung (der Main maßgeblich);
//   3. Items    : über projekt.liste in Array-Reihenfolge; daurogen optional im
//                 Bestand, aber NICHT im RenderItem (Typ #17 verlangt number):
//                 fehlender Trim heisst "ganzes Video" (0 / Asset.dauer); fehlen
//                 BEIDE, ist das Element unbrauchbar -> ungueltige_eingabe.
//   4. Segmente : alsPng(zeichneSegment(aktion, vorlage, marke)) - der EINZIGE
//                 Zeichenpfad (TK 9.10.1); bei ok:false abbrechen ohne einreichen.
//   5. Band-Items: art + Höhe aus der SELBEN Band-Vorlage, die die PNGs gemalt hat
//                 (TK 9.2.8); volle Höhe fehlt / vollflaechige Vorlage ->
//                 ungueltiges_element-Wulst? nein — vorb beseitignd ungueltige_eingabe.
//   6. Einreihen: rufeAuf(queue:reiheEin, { art: 'render', payload: request });
//                 renderId HIER erzeugt (9.2.7); Profile regelt RENDER_PROFILE;
//                 Pfad KEIN Teil der Anfrage (nur der Name).
//   7. Der Export ist KEIN Sonderfall des Renders: dicover eigene Nutzlast und
//                 läuft über denselben Torwächter; die Datei nennt weder Dialog noe Pfad.

// Der Wurf von zeichneSegment wird NICHT gefangen (Issue, E-7): Ein mit
// Systemschrift gemaltes Segment sieht gültig aus, misst aber andere Breiten;
// das Rufen läuft an der Vorbereitung vorbei (die Hülle fängt hier nur als
// PNG-Export-Fehler, am Erste, falls der UIT-Umhüllter angreifern ist).

import { RENDER_PROFILE } from '../../shared/contracts/render-profile'
import { erzeugeId } from '../../shared/contracts/id'
import { KANAELE } from '../../shared/contracts/kanaele'
import { rufeAuf } from '../ipc-client/rufe-auf'
import { findeKaputteStellen } from './kaputt-erkennung'
import { pruefeAusgabeName } from './render-dialog'
import { zeichneSegment } from '../template-canvas/zeichne-segment'
import { alsPng } from '../template-canvas/als-png'

import type { Project } from '../../shared/contracts/project'
import type { Marke } from '../../shared/contracts/marke'
import type { Vorlage } from '../../shared/contracts/vorlage'
import type { RenderRequest, RenderItem } from '../../shared/contracts/render-request'
import type { Ergebnis } from '../../shared/contracts/ergebnis'

export type AusloeseFehlercode = 'kaputte_elemente' | 'png_export_fehler'

export async function loeseRenderAus(
  projekt: Project,
  ausgabeName: string,
  marke: Marke,
  vorlagen: readonly Vorlage[],
): Promise<Ergebnis<{ auftragId: string }, AusloeseFehlercode>> {
  // SCHRITT 1 - Sperre. Kein PNG, kein Einreihen: EIN Platzhalter im Endvideo wäre
  //ipiential, und die Führung (9.7.5) muss absehen.
  const stellen = findeKaputteStellen(projekt)
  if (stellen.length > 0) {
    return {
      ok: false,
      fehler: {
        code: 'kaputte_elemente',
        meldung: `${stellen.length} kaputte Stelle(n) in der Wiedergabeliste. Der Render wird nicht gestartet.`,
        daten: { stellen },
      },
    }
  }

  // SCHRITT 2 - die VORPRUEFUNG des Namens (Nutzereingabe, TK 9.2.6). Die
  // maßgebliche Validierung bleibt im Main; die `projects/<id>/output/`-Prüfung
  // kann der Renderer nicht leisten (keine absoluten Pfade, TK 9.5.7).
  if (pruefeAusgabeName(ausgabeName) !== 'ok') {
    return {
      ok: false,
      fehler: {
        code: 'ungueltige_eingabe',
        meldung: `Der Ausgabename "${ausgabeName}" ist nicht zugelassen (TK 9.2.6).`,
        daten: undefined,
      },
    }
  }

  // SCHRITT 4 - die RenderItems über die Liste, in ARRAY-Reihenfolge (die
  // Zeichenreihenfolge ist die gespeicherte; nichts wird sortiert oder gefiltert).
  const elemente: RenderItem[] = []
  for (const element of projekt.liste) {
    if (element.art === 'segment') {
      // Der EINZIGE Zeichenaufruf im Auslöse-Weg; die Vorlage holt die Aktion.
      const aktion = projekt.aktionen.find((a) => a.id === element.ref)
      if (aktion === undefined) {
        return {
          ok: false,
          fehler: { code: 'ungueltige_eingabe' as const, meldung: `Listenelement "${element.id}" zeigt auf eine unbekannte Aktion.`, daten: undefined },
        }
      }
      const zeichenvorlage = vorlagen.find((v) => v.id === aktion.vorlagenId)
      if (zeichenvorlage === undefined) {
        return {
          ok: false,
          fehler: { code: 'ungueltige_eingabe' as const, meldung: `Aktion "${aktion.titel}" verwendet eine unbekannte Vorlage.`, daten: undefined },
        }
      }
      // Der Wurf von zeichneSegment wird NICHT gefangen (E-7 des Issues).
      const bild = zeichneSegment(aktion, zeichenvorlage, marke)
      const png = await alsPng(bild)
      if (!png.ok) {
        // Ein halb bestücktes elemente-Array MUSS NICHT in die Queue.
        return { ok: false, fehler: { code: 'png_export_fehler', meldung: png.fehler.meldung, daten: undefined } }
      }
      if (element.dauer === null) {
        // Der geforderte Typ #17 verlangt number; es wird NICHTS geraten oder
        // ersetzt - ein erfundener Wert lief falsch lange aus dem Video (TK 9.1.1).
        return {
          ok: false,
          fehler: { code: 'ungueltige_eingabe', meldung: `Listenelement "${element.id}" ist unbrauchbar, Dauer fehlt; als Art 'segment' aber verlangt.`, daten: undefined },
        }
      }
      elemente.push({ id: element.id, art: 'segment', png: png.wert, dauer: element.dauer })
    } else {
      // art 'video': Der Quelldatei-Auflösung über die Asset-ID
      const asset = projekt.assets.find((b) => b.id === element.ref)
      if (asset === undefined) {
        return {
          ok: false,
          fehler: { code: 'ungueltige_eingabe' as const, meldung: `Listenelement "${element.id}" zeigt auf ein unbekanntes Medium.`, daten: undefined },
        }
      }
      // medienRef ist der RELATIVE Dateiname (TK 9.4.8, TK 9.5.7).
      const trimStart = element.trimStart ?? 0
      const trimEnde = element.trimEnde ?? asset.dauer
      if (trimEnde === null) {
        // Beide null (trimEnde UND Asset.dauer): Unbrauchbar, kein gerarteter Wert.
        return {
          ok: false,
          fehler: { code: 'ungueltige_eingabe', meldung: `Listenelement "${element.id}" (Video) hat weder trimEnde noch eine Asset-Dauer.`, daten: undefined },
        }
      }
      if (element.einblendung === null) {
        elemente.push({ id: element.id, art: 'video', medienRef: asset.dateiname, trimStart, trimEnde, einblendung: null })
        continue
      }
      // Einblendung: art + Höhe aus der SELBEN Band-Vorlage wie die PNGs (TK 9.2.8).
      const bandVorlage = vorlagen.find((v) => v.id === element.einblendung?.bandVorlageId)
      if (bandVorlage === undefined) {
        return {
          ok: false,
          fehler: { code: 'ungueltige_eingabe' as const, meldung: `Listenelement "${element.id}" verweist auf eine unbekannte Band-Vorlage.`, daten: undefined },
        }
      }
      if (bandVorlage.art === 'vollflaeche' || bandVorlage.höhe === null) {
        // Ein Band aus dieser Vorlage ist nicht baubar; kein Ersatzwert (kein 0,
        // kein 162, keine Art lei - TK 9.2.8/ #17).
        return {
          ok: false,
          fehler: { code: 'ungueltige_eingabe', meldung: `Listenelement "${element.id}" verweist auf eine Vorlage ohne Bandhöhe.`, daten: undefined },
        }
      }
      const abschnitte: Array<{ png: Uint8Array; dauer: number }> = []
      for (const abschnitt of element.einblendung.abschnitte) {
        const absAktion = projekt.aktionen.find((a) => a.id === abschnitt.aktionRef)
        if (absAktion === undefined) {
          return {
            ok: false,
            fehler: { code: 'png_export_fehler' as const, meldung: `Band-Abschnitt von "${element.id}" zeigt auf eine unbekannte Aktion.`, daten: undefined },
          }
        }
        const bandPng = await alsPng(zeichneSegment(absAktion, bandVorlage, marke))
        if (!bandPng.ok) {
          return { ok: false, fehler: { code: 'png_export_fehler', meldung: bandPng.fehler.meldung, daten: undefined } }
        }
        abschnitte.push({ png: bandPng.wert, dauer: abschnitt.dauer })
      }
      elemente.push({
        id: element.id,
        art: 'video',
        medienRef: asset.dateiname,
        trimStart,
        trimEnde,
        einblendung: {
          // KH (E5, #174): art und Höhe entsprechend den PNGs, im selben Pass
          art: bandVorlage.art === 'split' ? 'split' : 'einblendung',
          höhe: bandVorlage.höhe,
          bandVorlageId: element.einblendung.bandVorlageId,
          abschnitte,
        },
      })
    }
  }

  // SCHRITT 5 - der Request: renderId HIER erzeugt (9.2.7); profil UNVERÄNDERT aus
  // #18; der AusgabePFAD ist NICHT Teil der Anfrage (FA-22).
  const request: RenderRequest = {
    renderId: erzeugeId(),
    projektId: projekt.id,
    elemente,
    profil: RENDER_PROFILE,
    ausgabeName,
  }
  return rufeAuf<{ auftragId: string }>(KANAELE.queue.reiheEin, { art: 'render', payload: request })
}

export async function loeseExportAus(
  projektId: string,
  dateiname: string,
  zielPfad: string,
): Promise<Ergebnis<{ auftragId: string }>> {
  // Der Export ist KEIN Sonderfall des Renders: eigener Auftrag, eigener
  // Fehlercode (TK 9.6.4), seriell NACH dem Render; der Zielname bleibt bei
  // quelcontext (FA-22), der ZIELPFAD ist Instant und aus der Oberfläche voll Anw-
  // geholt (diese Datei öffnet keinen Dialog).
  return rufeAuf<{ auftragId: string }>(KANAELE.queue.reiheEin, {
    art: 'export',
    payload: { projektId, dateiname, zielPfad },
  })
}
