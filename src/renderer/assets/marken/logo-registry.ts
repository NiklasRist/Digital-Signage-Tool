// Issue #315, NACHTRAG 23.08.2026 (FRAGE A, User-Entscheidung): Die gebündelte
// Logo-Datei liegt an diesem festen Ort und wird per STATISCHEM Import geladen;
// diese Registry-Map übersetzt `Marke.logo.datei` in die importierte URL. Kein
// dynamisch zusammengesetzter Pfad, keine Data-URI.
//
// Eingebündelt ist ein 420×120-PLATZHALTER (dunkler Balken mit Primärfarb-Streifen),
// ausdrücklich austauschbar: Das echte Logo ersetzt die Datei unter demselben Namen,
// ohne dass Code oder Eintrag sich ändern. Fester Name laut lese-marke.ts (#29):
// 'logo-fitnessworld24.png', Seitenverhältnis 3.5 (= 420/120).

import logoFitnessworld24 from './logo-fitnessworld24.png'

export const logoRegistry = new Map<string, string>([
  ['logo-fitnessworld24.png', logoFitnessworld24],
])
