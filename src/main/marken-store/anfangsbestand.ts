// [marken-store] Bestand beim Start sicherstellen – die eingebaute Fitnessworld24-Marke

import { erzeugeId } from '../../shared/contracts/id'          // #20
import { SICHERHEITSABSTAND_PX } from '../../shared/contracts/konstanten'   // #21
import type { MarkenEintrag } from './schreibe-marken'

/**
 * Liefert eine FRISCHE, TIEFE Kopie der vollstaendig befuellten Fitnessworld24-Marke
 * (eingebaut: true, parent: null). Jeder Aufruf erzeugt ein NEUES Objekt (auch die `id`, s. u.) –
 * niemals eine gemeinsame Referenz, die ein Aufrufer versehentlich mutieren koennte.
 */
export function eingebauteMarke(): MarkenEintrag {
  const eintrag: MarkenEintrag = {
    // Keine feste Kennung ("fitnessworld24" waere eine zweite ID-Ordnung neben der
    // UUID-Ordnung aus TK 9.11.4); die ID entsteht je Aufruf neu und bleibt EINMAL
    // im Bestand - der einzige bisherige Aufrufer ist das Anlegen einer fehlenden
    // marken.json in schreibe-marken.ts (#277), Schritt 2 des Ladens.
    id: erzeugeId(),
    name: 'Fitnessworld24',         // "true NUR bei Fitnessworld24" (TK 9.15.1)
    parent: null,                   // eigenstaendig - die Basis aller abgeleiteten Looks
    eingebaut: true,                // die EINZIGE Loesch-Sperre (M8-13/loscheMarke)
    // Farb-Rollen, TK 9.11.2 - Wert fuer Wert aus dem; dieselben Werte, die der
    // gelinnte Pendant leseMarke (#29, config-store/lese-marke.ts) traegt.
    farben: {
      akzent: '#FF4040',              // Primaerfarbe - Badges, Preis, CTA
      akzentKraeftig: '#DF3131',
      akzentTief: '#971316',
      flaecheDunkel: '#2F2E2E',       // Segment- und Band-Hintergrund; Split-Restflaechen
      flaecheSehrDunkel: '#4B090B',
      flaecheHell: '#FFFFFF',
      flaecheAkzentZart: '#F5AEAF',
      textAufDunkel: '#FFFFFF',
      textAufHell: '#202020',
      textSekundaer: '#8F8F8F',
      linie: '#CCCCCC',
      scrimStart: '#00000000',        // 8-stellig = mit Alpha: Verlauf beginnt durchsichtig
      scrimEnde: '#000000B3',
    },
    // Schrift-Rollen, TK 9.11.2 - die vier Dateien liegen im Renderer-Bundle
    // (src/renderer/assets/fonts/, angelegt mit #7/#8). `herkunft: 'gebuendelt'` (v3.4).
    schriften: {
      headlineElegant: { familie: 'Playfair Display', gewicht: 700, datei: 'PlayfairDisplay-Bold.woff2', herkunft: 'gebuendelt' },
      headlinePlakativ: { familie: 'Archivo Black', gewicht: 900, datei: 'ArchivoBlack-Regular.woff2', herkunft: 'gebuendelt' },
      fliesstext: { familie: 'Arimo', gewicht: 400, datei: 'Arimo-Regular.woff2', herkunft: 'gebuendelt' },
      fliesstextFett: { familie: 'Arimo', gewicht: 700, datei: 'Arimo-Bold.woff2', herkunft: 'gebuendelt' },
    },
    // Die STOPP-Frage zum Logo ist durch geBUTEN Code beantwortet: #315 (Nachtrag,
    // User-Entscheidung vom 23.08.) buendelt PLATZHALTER-420x120 als
    // src/renderer/assets/marken/logo-fitnessworld24.png (Registry #315), und
    // lese-marke.ts (#29) traeegt exakt dieses Tupel. Dunkler Balken im Asset
    // enthalten - es braucht keine eigene Hintergrundzone (TK 9.11.1).
    logo: { datei: 'logo-fitnessworld24.png', herkunft: 'gebuendelt', seitenverhaeltnis: 3.5 },
    // Die Konstante selbst (#21), nicht ihr Zahlenpaar kopiert: gleichlautend mit
    // lese-marke.ts (#29) - ein abweichendes Literal faellt im Typecheck durch.
    sicherheit: SICHERHEITSABSTAND_PX,
    radien: { pille: 40, karte: 10, klein: 2 },
    schatten: { versatzY: 4, weichzeichnen: 8, farbe: '#0000001A' },
    // PLATZHALTER, ungeklärt (User-Entscheidung 06.10.2026: leerer Text, abgeschaltet).
    // TK 9.11.2 gibt nur die FORM vor, keinen Text; der Satz im Anforderungsdokument 4.1
    // steht ausdruecklich als Beispiel. `aktiv: false` zeigt nichts an, solange niemand
    // einen verbindlichen Text hinterlegt hat - ein geratener Text stuende im Studio.
   // Gleichlaut mit dem Platzhalter in lese-marke.ts (#29).
    slogan: { text: '', aktiv: false },
  }
  return eintrag
}
