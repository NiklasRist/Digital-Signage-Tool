// GENERIERT aus dem Signaturblock von Issue #51.
// [project-store] Einzel-Instanz-Sperre, gebunden an den Datenort
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
// GERUEST-PRUEFSUMME: a54960c949e93b0c
//
// ZUR ABSCHALTZEILE IN ZEILE 1 - SIE IST BEIM FUELLEN DES RUMPFES ZU ENTFERNEN:
// Die Parameter und Importe dieser Datei SIND der Vertrag; der Rumpf wirft aber
// nur, benutzt sie also nicht (@typescript-eslint/no-unused-vars). Die Zeile
// gehoert zum Geruest, nicht zum fertigen Code. Wer den Rumpf fuellt und sie
// stehen laesst, macht die Regel in DIESER Datei dauerhaft blind - unauffaellig,
// weil dann nichts mehr rot ist.
//
// Gesetzt hat sie kein Mensch, sondern tools/geruest.py: Es fragt nach dem
// Schreiben EINMAL ESLint, welche Dateien no-unused-vars tatsaechlich melden, und
// versieht nur diese. Deshalb steht sie nirgends ueberfluessig herum.
//
// ACHTUNG - DIESE DATEI IST GEGENUEBER DEM GERUEST GEAENDERT, UND ZWAR IN DER
// SIGNATUR: Das Geruest traegt `: boolean`, das Issue in seinem Block "Signatur
// (verbindlich)" seit dem 12.08.2026 `: StartBefund` mit drei Werten. Gebaut ist
// die Fassung des ISSUES; das Geruest wurde vor der Entscheidung erzeugt. Gemeldet,
// weil auch src/main/index.ts (#3, SCHRITT 2) noch `boolean` und "Rueckgabe false"
// zitiert - dort ist der Aufruf noch eine Luecke, aber der Zitattext ist veraltet.

import fs from 'node:fs'
import path from 'node:path'

// ---------------------------------------------------------------------------
// WORUM ES GEHT - in einem Absatz, damit niemand hier "vereinfacht"
//
// Zwei gleichzeitig laufende App-Instanzen haetten zwei unabhaengige D1-Schreib-Locks
// (#32) auf DERSELBEN project.json: "Das Ergebnis waere ein Lost Update und damit
// Datenkorruption. Deshalb erzwingt die App beim Start eine Einzel-Instanz-Sperre; ein
// zweiter Start fokussiert das bestehende Fenster statt eine zweite Instanz zu oeffnen."
// (TK 9.5.4)
//
// Und sie haengt am DATENORT, nicht am Programm: "Die Sperre muss an den Datenort
// gebunden sein (den App-Ordner mit `projects/`), nicht an den Programmpfad. Sonst
// koennten zwei Kopien der portablen EXE, die auf dieselben Daten zeigen, beide starten -
// genau der Fall, den die Sperre verhindern soll." (TK 9.5.4)
//
// WARUM HIER KEIN app.requestSingleInstanceLock() STEHT - und auch nicht daneben
// (gemessen am 10.08.2026, zwei Electron-Laeufe):
//   - dieselbe Kopie zweimal gestartet          -> zweite bekommt false  (richtig)
//   - zwei Kopien in VERSCHIEDENEN Ordnern      -> zweite bekommt false  (FALSCH)
// Beide Instanzen meldeten denselben userData-Pfad. Electron bindet die Sperre an die
// ANWENDUNGSIDENTITAET, nicht an den Datenort. Sie sperrt damit zu viel (zwei Kopien mit
// je eigenem Datenbestand duerfen nebeneinander laufen, #5 legt den Datenort neben die
// EXE) und zugleich das Falsche (zwei Kopien auf DIESELBEN Daten sieht sie gar nicht).
// Ein zusaetzliches requestSingleInstanceLock() waere deshalb kein Guertel zum
// Hosentraeger, sondern eine zweite, widersprechende Aussage.

/**
 * Die Sperrdatei im Datenort. Ihr Inhalt ist bedeutungslos - sie wird NIE gelesen.
 * Traeger der Sperre ist der offene Handle darauf, nicht ihr Dasein.
 */
const LOCK_DATEI = 'instanz.lock'

/**
 * Die Datei, ueber die ein abgewiesener Zweitstart dem Halter Bescheid gibt. Auch sie
 * wird nie gelesen; beobachtet wird allein, DASS sie geschrieben wurde.
 */
const SIGNAL_DATEI = 'instanz.signal'

/**
 * Entprellung der Zweitstart-Meldung.
 *
 * Ein einziges Schreiben der Signaldatei erzeugt auf Windows regelmaessig MEHRERE
 * Ereignisse (Anlegen und Aendern). Ohne Entprellung fokussierte die App das Fenster
 * zwei- bis dreimal hintereinander. 250 ms sind lang genug fuer diese Doppelmeldungen
 * und kurz genug, dass zwei wirklich getrennte Startversuche eines ungeduldigen
 * Nutzers nicht zu einem verschmelzen - und selbst wenn: zweimal dasselbe Fenster zu
 * fokussieren ist ohnehin dieselbe Wirkung wie einmal.
 */
const ENTPRELLUNG_MS = 250

/**
 * Die Datei-Konstanten als nachschlagbare Tabelle.
 *
 * Warum nicht direkt `fs.constants.O_EXLOCK`: Diese Konstante gibt es nur auf
 * BSD/macOS. @types/node deklariert sie deshalb gar nicht - der direkte Zugriff waere
 * ein Typfehler -, und zur Laufzeit ist sie auf Linux `undefined`, wo `flags |
 * undefined` still mit 0 weiterrechnet: Die Sperre waere wirkungslos, ohne dass
 * irgendwo etwas auffaellt. Ueber die Tabelle ist das Fehlen ein pruefbarer Wert.
 *
 * Die Umleitung ueber `unknown` ist Absicht: Sie sagt aus, dass hier bewusst an der
 * Deklaration vorbeigelesen wird, statt es hinter einer aufgehuebschten Zusicherung zu
 * verstecken. Der Wert wird unmittelbar darunter auf `undefined` geprueft.
 */
// SAFETY: der Cast macht die Konstanten-Tabelle als Index-Form lesbar; O_EXLOCK wird
  // unmittelbar darunter auf undefined geprueft, O_NONBLOCK faellt per ?? auf 0 zurueck.
const KONSTANTEN = fs.constants as Record<string, number | undefined>
const O_EXLOCK = KONSTANTEN['O_EXLOCK']
const O_NONBLOCK = KONSTANTEN['O_NONBLOCK'] ?? 0

/**
 * Der einmal ermittelte Befund.
 *
 * WARUM GEMERKT WIRD: Ein zweiter Aufruf im SELBEN Prozess wuerde erneut versuchen, auf
 * die Sperrdatei umzubenennen - und daran scheitern, weil DIESER Prozess sie offen
 * haelt. Die Funktion meldete dann 'belegt', der Bootstrap beendete die App mit dem
 * Hinweis "laeuft bereits", und gemeint waere sie selbst. Der Vertrag sieht genau einen
 * Aufruf vor (#3, SCHRITT 2); der Merker macht aus einem Programmierfehler eine
 * Wiederholung derselben Antwort statt eines Selbstmords.
 */
let gemerkterBefund: StartBefund | null = null

/**
 * Haelt die Dateiwache am Leben, solange der Prozess laeuft.
 *
 * Ein Array und keine einzelne Variable: Eine nur zugewiesene, nie gelesene Variable
 * meldet @typescript-eslint/no-unused-vars zu Recht an - und die Zusicherung "diese
 * Wache darf nicht eingesammelt werden" waere dann nur ein Kommentar. Das `push` ist
 * eine echte Benutzung und sagt zugleich, wozu die Liste da ist.
 *
 * Der offene Handle auf die Sperrdatei steht ABSICHTLICH NICHT hier: Ein
 * Dateideskriptor ist eine Zahl, die das Betriebssystem fuehrt - er bleibt offen, ob
 * ihn jemand aufhebt oder nicht, und wird bewusst nie geschlossen (s. unten).
 */
const wachen: fs.FSWatcher[] = []

export type StartBefund = 'frei' | 'belegt' | 'datenort_nicht_beschreibbar'

export function erzwingeEinzelInstanz(
  datenOrt: string,
  beiZweitemStart: () => void,
): StartBefund {
  if (gemerkterBefund !== null) {
    return gemerkterBefund
  }
  gemerkterBefund = ermittleBefund(datenOrt, beiZweitemStart)
  return gemerkterBefund
}
// MUSS aufgerufen werden, BEVOR app.whenReady() abgewartet bzw. das erste BrowserWindow erzeugt
// wird (#3, src/main/index.ts).
// 'belegt': eine andere Instanz haelt die Sperre für DIESEN datenOrt bereits. Der Aufrufer
// MUSS unmittelbar app.quit() aufrufen und darf KEIN Fenster mehr erzeugen.
// 'frei': diese Instanz haelt die Sperre. beiZweitemStart() wird aufgerufen, sobald ein
// weiterer Prozess mit demselben datenOrt zu starten versucht (Zeitpunkt: nach dieser Instanz).

function ermittleBefund(datenOrt: string, beiZweitemStart: () => void): StartBefund {
  // SCHRITT 1 - BESCHREIBBARKEIT, UND ZWAR VORHER (entschieden am 12.08.2026).
  //
  // Der Sperrmechanismus unten liest 'belegt' aus einem EPERM. Ein schreibgeschuetzter
  // Datenort (USB-Stick mit Schreibschutz, Ordner ohne Rechte) liefert aber DENSELBEN
  // Fehler - ohne diese Vorpruefung meldete die App "laeuft bereits", und der Nutzer
  // suchte einen Prozess, den es nicht gibt. Zwei Ursachen, zwei Meldungen, zwei
  // Auswege: Prozess beenden gegen anderen Ordner waehlen.
  if (!istBeschreibbar(datenOrt)) {
    return 'datenort_nicht_beschreibbar'
  }

  const lockPfad = path.join(datenOrt, LOCK_DATEI)
  const befund = belegeSperre(lockPfad)

  if (befund === 'belegt') {
    // SCHRITT 2b - dem Halter Bescheid geben. Das ist die einzige Stelle, an der die
    // Signaldatei geschrieben wird; der Halter selbst fasst sie nie an.
    meldeZweitenStart(datenOrt)
    return 'belegt'
  }

  if (befund === 'frei') {
    // SCHRITT 2a - erst jetzt, mit der Sperre in der Hand, die Wache aufziehen.
    starteWache(datenOrt, beiZweitemStart)
  }

  return befund
}

// ---------------------------------------------------------------------------
// Beschreibbarkeit
// ---------------------------------------------------------------------------

/**
 * Legt eine Probedatei an und entfernt sie in JEDEM Fall wieder.
 *
 * WARUM KEIN fs.accessSync(datenOrt, W_OK): Das prueft unter Windows im Wesentlichen
 * das Nur-Lesen-Attribut, nicht die ACLs - ein Ordner, in den der angemeldete Nutzer
 * nachweislich nicht schreiben darf, gilt dort als beschreibbar. Die Probe ist die
 * einzige Antwort auf die Frage, die wirklich zaehlt: "Kann ich hier eine Datei
 * anlegen?"
 *
 * Der Name traegt PID und Zufall, weil zwei Instanzen diese Pruefung gleichzeitig
 * durchlaufen koennen: Mit festem Namen loeschte die eine der anderen die Probedatei
 * unter den Fuessen weg, und der Befund waere Zufall.
 *
 * Das Flag 'wx' statt 'w': Es schlaegt fehl, statt eine vorhandene Datei zu
 * ueberschreiben. Zusammen mit `angelegt` ist damit ausgeschlossen, dass diese
 * Funktion je eine fremde Datei loescht - das `unlink` im finally laeuft nur, wenn
 * genau dieser Aufruf die Datei erzeugt hat.
 */
function istBeschreibbar(datenOrt: string): boolean {
  const probe = path.join(datenOrt, `.schreibprobe-${process.pid}-${zufall()}`)
  let angelegt = false
  try {
    fs.writeFileSync(probe, '', { flag: 'wx' })
    angelegt = true
    return true
  } catch {
    // Jeder Fehlschlag zaehlt gleich: nicht vorhanden, nicht beschreibbar, volle
    // Platte. Fuer den Aufrufer ist die Folge dieselbe - hier kann nicht gearbeitet
    // werden -, und die Unterscheidung gehoert in die Meldung des Bootstraps, nicht
    // in diesen Befund.
    return false
  } finally {
    if (angelegt) {
      try {
        fs.unlinkSync(probe)
      } catch {
        // UNGEPRUEFT und bewusst folgenlos: Scheitert ausgerechnet das Entfernen,
        // bleibt eine leere Datei liegen. Sie stoert niemanden (kein Modul liest den
        // Datenort blind aus), und den Start daran zu hindern waere die schlechtere
        // Antwort - schreiben KONNTEN wir ja gerade.
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Die Sperre selbst
// ---------------------------------------------------------------------------

function belegeSperre(lockPfad: string): StartBefund {
  return process.platform === 'win32'
    ? belegeUeberRename(lockPfad)
    : belegeUeberDateiSperre(lockPfad)
}

/**
 * WINDOWS - der am 10.08.2026 gemessene Mechanismus.
 *
 * Vier Faelle wurden gemessen, alle vier stimmten mit der Erwartung ueberein:
 *   keine Sperrdatei                                  -> FREI
 *   Halter laeuft                                     -> BELEGT (EPERM)
 *   anderer Datenort, waehrend Halter 1 laeuft        -> FREI
 *   Halter hart abgeschossen (taskkill /F), Datei da  -> FREI
 *
 * DER VIERTE FALL IST DER ENTSCHEIDENDE: Die verwaiste Sperrdatei loest sich VON SELBST
 * auf. Es braucht KEINE PID-Pruefung, KEINEN Zeitstempel, KEINE Heuristik "aelter als X
 * Minuten" - das Betriebssystem gibt den Handle frei, wenn der Prozess stirbt, und ab
 * dann geht das Umbenennen durch. Genau die Falle, die das Issue benennt (eine naive
 * Pruefung "Datei existiert -> laeuft bereits" blockiert nach jedem Absturz jeden
 * kuenftigen Start), ist damit umgangen, ohne sie einzeln behandeln zu muessen. Wer hier
 * spaeter eine PID in die Datei schreiben will: nicht noetig, und PIDs werden
 * wiederverwendet.
 *
 * DIE RICHTUNG IST DER GANZE TRICK - und der erste Messversuch hatte sie falsch herum:
 *   rename(gehaltene Datei -> neuer Name)   GEHT DURCH, obwohl jemand sie offen haelt
 *   rename(andere Datei    -> gehaltene)    scheitert mit EPERM
 * Ein Lebendtest, der die Sperrdatei WEGbenennt, meldet also "frei", waehrend eine
 * Instanz laeuft - und zwei Instanzen liefen gleichzeitig auf denselben Daten. Der Test
 * muss AUF die Sperrdatei schreiben. In keinem Testlauf ohne echten Zweitprozess waere
 * das sichtbar geworden.
 *
 * WARUM DER HANDLE SCHON VOR DEM UMBENENNEN OFFEN IST und nicht erst danach geoeffnet
 * wird: Zwischen einem geglueckten Umbenennen und einem nachtraeglichen Oeffnen laege
 * ein Zeitfenster, in dem die Sperrdatei niemandem gehoert - eine zweite Instanz, die
 * genau dort hineinstartet, benennt ebenfalls erfolgreich um, und beide halten sich fuer
 * den Halter. Das Fenster ist winzig, aber ein Datenverlust, der nur alle paar Monate
 * auftritt, ist der teuerste von allen. Weil ein gehaltener Handle beim Umbenennen
 * MITWANDERT (gemessen, s. o.), ist die Datei ab der Millisekunde ihres Erscheinens
 * belegt: Das Fenster existiert nicht.
 *
 * WARUM JEDER Fehler beim Umbenennen als 'belegt' gilt und nicht nur EPERM: Die
 * Alternative waere, bei einem unbekannten Fehlercode weiterzulaufen - also im Zweifel
 * eine zweite Instanz zuzulassen. Bei dieser Sperre ist die vorsichtige Antwort die
 * richtige: Ein faelschlich verweigerter Start kostet eine Meldung, ein faelschlich
 * erlaubter kostet Projektdaten. Der haeufigste Grund fuer EACCES/EPERM neben "belegt"
 * - der Ordner ist gar nicht beschreibbar - ist eine Zeile vorher schon abgefangen.
 */
function belegeUeberRename(lockPfad: string): StartBefund {
  const eigenerPfad = `${lockPfad}.${process.pid}.${zufall()}`

  let griff: number
  try {
    griff = fs.openSync(eigenerPfad, 'w')
  } catch {
    // Die Probe eben ist gelungen, dieses Anlegen nicht - dann hat sich zwischen den
    // beiden Zeilen etwas an den Rechten geaendert oder die Platte ist voll. Beides ist
    // "hier kann nicht gearbeitet werden", nicht "es laeuft schon jemand".
    return 'datenort_nicht_beschreibbar'
  }

  try {
    fs.renameSync(eigenerPfad, lockPfad)
    // AB HIER GEHOERT UNS DIE SPERRE. `griff` wird ABSICHTLICH NIE GESCHLOSSEN: Er IST
    // die Sperre. Das Betriebssystem raeumt ihn beim Prozessende auf - auch beim harten
    // Abschuss, und genau das ist der vierte gemessene Fall.
    return 'frei'
  } catch {
    schliesseStill(griff)
    entferneStill(eigenerPfad)
    return 'belegt'
  }
}

/**
 * NICHT-WINDOWS - UNGEPRUEFT, und der wichtigste Vorbehalt dieser Datei.
 *
 * Der gemessene Windows-Mechanismus ist auf macOS WIRKUNGSLOS: POSIX erlaubt es
 * ausdruecklich, eine geoeffnete Datei zu ersetzen (rename(2) kennt keine Sharing
 * Violation). Das Umbenennen AUF die gehaltene Sperrdatei wuerde dort immer gelingen,
 * jede Instanz haelt sich fuer die erste, und es liefen zwei App-Instanzen auf
 * denselben Projektdaten - genau der Lost-Update-Fall, gegen den diese Datei existiert.
 * Gemessen wurde am 10.08.2026 nur auf Windows; ein macOS-Rechner stand nicht zur
 * Verfuegung (dieselbe Lage wie bei ermittleDatenOrt(), #5).
 *
 * Deshalb steht hier fuer macOS der dort uebliche Weg: eine EXKLUSIVE DATEISPERRE ueber
 * das Oeffnungsflag O_EXLOCK. Sie hat dieselben zwei Eigenschaften, auf die es ankommt -
 * sie haengt am Datenort (die Datei liegt dort) und sie ueberlebt keinen Prozesstod
 * (das Betriebssystem gibt sie mit dem Deskriptor frei, eine verwaiste Datei blockiert
 * also nichts).
 *
 * ZU MESSEN, BEVOR EIN macOS-ARTEFAKT AUSGELIEFERT WIRD (M0/#7 steht noch offen):
 * dieselben vier Faelle wie oben. Faellt die Messung anders aus, ist DIESE Funktion die
 * Stelle, die nachzuziehen ist - der Rest der Datei bleibt unberuehrt.
 *
 * WARUM UNBEKANNTE FEHLER HIER 'frei' ERGEBEN, anders herum als auf Windows: Diese
 * Sperre ist eine Zugabe auf einer ungemessenen Plattform. Ihr Ausgangszustand - sie
 * gar nicht zu bauen - ist "es startet". Ein unbekannter errno (etwa ENOTSUP auf einem
 * Dateisystem ohne Sperrunterstuetzung) darf deshalb nicht dazu fuehren, dass die App
 * auf macOS ueberhaupt nicht mehr startet; das waere ein sicherer Schaden gegen einen
 * moeglichen. Nur das eindeutige "haelt schon jemand" (EAGAIN/EWOULDBLOCK) sperrt.
 */
function belegeUeberDateiSperre(lockPfad: string): StartBefund {
  if (O_EXLOCK === undefined) {
    // Linux. Kein Auslieferungsziel (TK: Windows 10/11 und macOS 13+), aber ein
    // moegliches Entwicklungssystem. Dort gibt es diesen Weg nicht, und ein zweiter
    // Weg (flock ueber ein Fremdpaket) waere ein Fremdkoerper fuer eine Plattform, die
    // nie ausgeliefert wird. GEMELDET, nicht verschwiegen: Auf Linux sperrt hier nichts.
    return 'frei'
  }

  try {
    // Der Deskriptor wird - wie auf Windows - absichtlich nie geschlossen; er IST die
    // Sperre. O_NONBLOCK sorgt dafuer, dass ein belegter Lock sofort einen Fehler
    // liefert, statt den Start haengen zu lassen.
    fs.openSync(lockPfad, fs.constants.O_CREAT | fs.constants.O_RDWR | O_EXLOCK | O_NONBLOCK)
    return 'frei'
  } catch (fehler) {
    // SAFETY: das Original von fs.openSync wirft nur ErrnoException (V8/Node-Vertrag);
    // der Cast benennt diesen Typ, und die Vergleiche darunter pruefen den code.
    const code = (fehler as NodeJS.ErrnoException).code
    if (code === 'EAGAIN' || code === 'EWOULDBLOCK') {
      return 'belegt'
    }
    return 'frei'
  }
}

// ---------------------------------------------------------------------------
// Die Meldung an den Halter
// ---------------------------------------------------------------------------

/**
 * DIE ZWEITSTART-MELDUNG - hier steht die Konstruktionsentscheidung dieses Issues.
 *
 * Der gemessene Sperrmechanismus beantwortet nur die Frage "darf ich starten?". Dass der
 * HALTER erfaehrt, dass jemand es versucht hat, deckt er nicht ab - und Electrons
 * eingebaute Benachrichtigung (`second-instance`) haengt an der Anwendungsidentitaet
 * statt am Datenort und ist damit hier unbrauchbar (gemessen, s. Kopf der Datei).
 *
 * GEWAEHLT: Der abgewiesene Zweitstart SCHREIBT eine Datei in den Datenort, der Halter
 * BEOBACHTET den Datenort mit fs.watch und ruft bei einer Aenderung an genau diesem
 * Namen `beiZweitemStart()`. Der Weg fuehrt damit ueber dasselbe Nadeloehr wie die
 * Sperre selbst: den Datenort. Wer dieselbe Sperre trifft, trifft auch dieselbe
 * Signaldatei - die Bindung ist nicht nachgebaut, sie ist dieselbe.
 *
 * VERWORFEN - Named Pipe (Windows) bzw. Unix-Socket (macOS), benannt nach einem Hash des
 * Datenorts: technisch zuverlaessiger als ein Dateiwaechter, aber der Name lebte in
 * einem GLOBALEN Namensraum, nicht im Datenort. Damit haengt die Bindung an einer
 * Pfad-Normalisierung (Gross-/Kleinschreibung, kurze 8.3-Namen, Laufwerksbuchstabe
 * gegen UNC-Pfad) - zwei Schreibweisen desselben Ordners waeren zwei Sperren, und
 * dieser Fehler saehe genauso aus wie der, den dieses Issue gerade behebt. Dazu zwei
 * Plattformwege statt einem und ein Server-Objekt, das am Leben bleiben muss.
 *
 * VERWORFEN - eine Datei im Sekundentakt abfragen: laeuft die gesamte Sitzung durch,
 * nur damit ein Ereignis erkannt wird, das an einem normalen Arbeitstag nie oder
 * einmal eintritt. fs.watch kostet im Leerlauf nichts.
 *
 * Der Inhalt der Datei ist reine Diagnose - gelesen wird er nie. Wichtig ist allein,
 * dass geschrieben WURDE.
 *
 * Ein Fehlschlag hier wird VERSCHLUCKT: Die Meldung ist eine Hoeflichkeit, der Befund
 * 'belegt' ist die Zusage. Wer den Start wegen einer misslungenen Benachrichtigung
 * abbraeche, taeuschte ein Problem vor, das es nicht gibt - und wer ihn deswegen
 * ERLAUBTE, riskierte Datenverlust.
 */
function meldeZweitenStart(datenOrt: string): void {
  try {
    fs.writeFileSync(
      path.join(datenOrt, SIGNAL_DATEI),
      `${new Date().toISOString()} pid=${process.pid}\n`,
    )
  } catch {
    // s. oben - bewusst folgenlos.
  }
}

/**
 * Die Gegenseite: der Halter hoert auf Aenderungen an der Signaldatei.
 *
 * BEOBACHTET WIRD DER ORDNER, NICHT DIE DATEI. Zwei Gruende: Die Signaldatei existiert
 * beim Aufziehen der Wache in aller Regel noch gar nicht (fs.watch auf einen nicht
 * vorhandenen Pfad wirft ENOENT), und eine Wache auf eine einzelne Datei verliert ihr
 * Ziel, sobald die Datei ersetzt statt beschrieben wird. Der Ordner bleibt.
 *
 * Der Halter SCHREIBT die Signaldatei nie und LOESCHT sie nie. Wuerde er sie nach dem
 * Fokussieren aufraeumen, erzeugte genau dieses Loeschen das naechste Ereignis mit
 * demselben Namen - die App fokussierte sich in einer Schleife selbst. Was liegen
 * bleibt, ist eine Datei von unter hundert Byte, die niemand liest.
 *
 * `unref()`: Die Wache darf den Prozess nicht am Leben halten. Ohne sie bliebe die App
 * nach dem Schliessen des Fensters im Speicher stehen und liesse sich nur ueber den
 * Task-Manager beenden.
 *
 * Der 'error'-Hoerer ist Pflicht, nicht Zierde: Ein FSWatcher ohne ihn wirft bei einem
 * Fehler eine unbehandelte Ausnahme im Main-Prozess - die App stuerbe ab, weil der
 * Datenort umbenannt wurde. Passiert das, endet die Beobachtung still; die SPERRE
 * bleibt davon unberuehrt, denn die haengt am offenen Handle, nicht an dieser Wache.
 */
function starteWache(datenOrt: string, beiZweitemStart: () => void): void {
  let letzterRuf = 0

  try {
    const beobachter = fs.watch(datenOrt, (_art, name) => {
      if (name !== SIGNAL_DATEI) return

      const jetzt = Date.now()
      if (jetzt - letzterRuf < ENTPRELLUNG_MS) return
      letzterRuf = jetzt

      try {
        beiZweitemStart()
      } catch {
        // Der Rueckruf gehoert dem Bootstrap (#3) und fokussiert das Fenster. Wirft er -
        // etwa weil das Fenster gerade zerstoert wird -, darf das nicht als unbehandelte
        // Ausnahme aus einem Dateiereignis heraus die App beenden.
      }
    })

    beobachter.on('error', () => {
      beobachter.close()
    })
    beobachter.unref()
    wachen.push(beobachter)
  } catch {
    // fs.watch ist die einzige Stelle dieser Datei, die auf Netzlaufwerken und
    // ungewoehnlichen Dateisystemen aussteigen kann. Dann gibt es keine
    // Zweitstart-Meldung mehr - der Zweitstart wird weiterhin ABGEWIESEN, er fokussiert
    // nur das bestehende Fenster nicht. Das ist die richtige Reihenfolge des Verzichts:
    // Erst die Bequemlichkeit, nie die Datensicherheit.
  }
}

// ---------------------------------------------------------------------------
// Kleinkram
// ---------------------------------------------------------------------------

/** Acht Zeichen Zufall - genug, damit zwei gleichzeitige Starts nicht denselben Namen waehlen. */
function zufall(): string {
  return Math.random().toString(36).slice(2, 10)
}

function schliesseStill(griff: number): void {
  try {
    fs.closeSync(griff)
  } catch {
    // Aufraeumen auf dem Fehlerweg. Ein Fehlschlag darf den Befund nicht aendern.
  }
}

function entferneStill(pfad: string): void {
  try {
    fs.unlinkSync(pfad)
  } catch {
    // s. oben. Bleibt die Zwischendatei liegen, stoert sie nichts: Sie traegt PID und
    // Zufall im Namen und wird von niemandem gesucht.
  }
}

// ---------------------------------------------------------------------------
// WAS HIER BEWUSST NICHT STEHT
//
// 1. KEIN AUFRAEUMEN BEIM BEENDEN. Weder wird der Handle geschlossen noch die
//    Sperrdatei geloescht. Beides waere ueberfluessig (das Betriebssystem tut es) und
//    zugleich gefaehrlich: Eine Loeschung, die zwischen dem Umbenennen und dem Oeffnen
//    einer zweiten Instanz faellt, raeumte deren frisch erworbene Sperre weg. Der
//    gemessene vierte Fall zeigt, dass eine liegengebliebene Datei niemanden blockiert -
//    also gibt es nichts aufzuraeumen.
//
// 2. KEINE PID, KEIN ZEITSTEMPEL, KEINE "aelter als X Minuten"-HEURISTIK in der
//    Sperrdatei. Sie waere die naheliegende Loesung fuer ein Problem, das nach der
//    Messung vom 10.08.2026 nicht existiert - und PIDs werden wiederverwendet, ein
//    Zeitstempel bricht bei Sommerzeit oder gestellter Uhr.
//
// 3. KEINE PRUEFUNG, OB `datenOrt` ABSOLUT IST. Der Vertrag sagt "absoluter Pfad aus
//    ermittleDatenOrt() (#5)", und diese Datei ist ausdruecklich NICHT die zweite
//    Berechnung des Datenorts. Ein relativer Pfad wuerde hier auf das
//    Arbeitsverzeichnis bezogen - dasselbe, was jedes andere Store-Modul mit ihm taete.
//
// 4. KEIN app.quit() UND KEINE MELDUNG. Diese Funktion stellt fest, sie handelt nicht.
//    Der Bootstrap (#3) besitzt Fenster, Dialoge und den Beenden-Ablauf; ein quit() von
//    hier aus waere eine zweite Stelle, die die App beendet.
//
// 5. KEINE ABHAENGIGKEIT VON `electron`. Die Funktion laeuft vor app.whenReady() und
//    braucht nichts aus Electron - deshalb ist sie ohne Electron-Attrappe testbar.
//
// 6. WAS DIE ZWEITSTART-MELDUNG NICHT LEISTET (vollstaendig, damit sich niemand darauf
//    verlaesst):
//    - Sie transportiert NICHTS. Electrons second-instance reicht die Kommandozeile des
//      zweiten Prozesses durch; hier kommt nur "jemand hat es versucht" an. Soll die App
//      spaeter eine per Doppelklick uebergebene Datei im laufenden Fenster oeffnen,
//      reicht dieser Weg nicht und muss um einen Inhalt erweitert werden.
//    - Sie hat ein winziges Startfenster: Zwischen dem Erwerb der Sperre und dem
//      Aufziehen der Wache liegen wenige Mikrosekunden. Ein Zweitstart, der genau dort
//      hineinfaellt, wird korrekt ABGEWIESEN, aber nicht gemeldet.
//    - Sie haengt an fs.watch. Auf Netzfreigaben (SMB) und manchen virtuellen
//      Dateisystemen liefert das keine oder verspaetete Ereignisse. UNGEPRUEFT: Der
//      gesamte Datenort auf einer Netzfreigabe ist nie gemessen worden - weder die
//      Sperre noch die Meldung.
//    - Sie ist entprellt: Zwei Startversuche innerhalb von 250 ms ergeben einen Ruf.
//    - Sie laeuft ueber die Ereignisschleife des Main-Prozesses. Blockiert dieser gerade
//      (langer synchroner Schreibvorgang), kommt der Ruf spaeter - nicht gar nicht.
// ---------------------------------------------------------------------------
