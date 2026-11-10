// Issue #315, NACHTRAG 23.08.2026 (FRAGE A, User-Entscheidung): Die gebündelte
// Logo-Datei liegt an diesem festen Ort und wird per STATISCHEM Import geladen;
// diese Registry-Map übersetzt `Marke.logo.datei` in die importierte URL. Kein
// dynamisch zusammengesetzter Pfad, keine Data-URI.
//
// Eingebündelt ist seit #467 (10.11.2026) das ECHTE Fitnessworld24-Logo: 840 × 240,
// weißes Trägerfeld mit Eckenradius 20 px, Logo mittig 24 px eingerückt; außerhalb
// des Feldes transparent. Das Trägerfeld steckt im Asset, nicht in einer Zone – so
// bleibt jede Vorlage markenneutral (TK 9.11.1). Fester Name laut lese-marke.ts (#29):
// 'logo-fitnessworld24.png', Seitenverhältnis 3.5 (= 840/240). Es bleibt 3.5, damit
// alle neun Logo-Zonen und `Marke.logo.seitenverhaeltnis` unverändert gelten.

import logoFitnessworld24 from './logo-fitnessworld24.png'

export const logoRegistry = new Map<string, string>([
  ['logo-fitnessworld24.png', logoFitnessworld24],
])
