// [produktsuche] Der Notweg: die allgemeine Websuche (FA-30 / TK 9.20.2, 9.20.6)
//
// EINE AUSTAUSCHBARE FUNKTION. Die Adresse kommt AUSSCHLIESSLICH aus der Konfiguration
// (`ProduktQuellen.webSuche`, 9.20.3) - kein Anbieter, kein Schluessel, kein Konto steht
// im Quelltext. Wer den Anbieter wechselt, aendert die Konfiguration, nicht dieses Modul.
//
// WARUM DAS HIER EINE EIGENE DATEI IST, obwohl sie nur weiterreicht: 9.20.2 verlangt den
// Notweg als austauschbare Einheit. Diese Datei ist der eine Ort, an dem ein anderer
// Leser eingesetzt werden koennte, ohne die Shop-Suche anzufassen - und sie ist der Ort,
// an dem die Ehrlichkeitsregel steht: Ein Ausfall ist ein BEFUND, kein Absturz.
//
// DER NOTWEG IST FRAGIL (9.20.6): Aendert der Anbieter sein Markup oder sperrt er
// automatisierte Anfragen, liefert er nichts mehr. Das ist keine Zusage dieses Werkzeugs,
// und die Oberflaeche sagt es mit „kann ausfallen".

import { sucheMitMuster } from './suchseite'

import type { Ergebnis } from '../../shared/contracts/ergebnis'
import type { ProduktSeiteTreffer } from '../../shared/contracts/produktsuche'
import type { SuchseitenFehlercode } from './suchseite'

/**
 * Befragt die allgemeine Suche. `webSuche` ist bereits ein geprueftes Muster mit `{q}`
 * (9.20.3); ein Ausfall reist als `Ergebnis`-Fehler und wird vom Auftrag in Klartext
 * uebersetzt.
 */
export async function sucheUeberNotweg(
  webSuche: string,
  stichwort: string,
  bis: number,
): Promise<Ergebnis<ProduktSeiteTreffer[], SuchseitenFehlercode>> {
  return sucheMitMuster(webSuche, stichwort, bis)
}
