// Columns: shafts (plain / fluted), square columns, bases, and classical capitals.
// Build a column by stacking base → shaft → capital. Heights via "@plates" (3=1 brick).
import { registerKind } from '../registry.js';
import { cylinderGeometry, flutedGeometry, boxGeometry, baseGeometry, capitalGeometry } from '../geometry.js';

const cap = order => (fw, fd, h) => capitalGeometry(fw, fd, h, order);

// ---- Shafts (smooth, studless) ----
registerKind({ id: 'shaft-round', category: 'Pillars', label: 'Round Shafts', heightPlates: 3, studs: false, colorable: true,
    geometry: cylinderGeometry, sizes: ['1x1@3','1x1@6','1x1@9','2x2@6','2x2@9'] });

registerKind({ id: 'shaft-fluted', category: 'Pillars', label: 'Fluted Shafts', heightPlates: 3, studs: false, colorable: true,
    geometry: flutedGeometry, sizes: ['1x1@3','1x1@6','1x1@9','2x2@6','2x2@9'] });

registerKind({ id: 'column', category: 'Pillars', label: 'Square Columns', heightPlates: 3, studs: false, colorable: true,
    geometry: boxGeometry, sizes: ['1x1@3','1x1@6','1x1@9','2x2@6'] });

// ---- Bases ----
registerKind({ id: 'base', category: 'Pillars', label: 'Column Bases', heightPlates: 3, studs: false, colorable: true,
    geometry: baseGeometry, sizes: ['1x1','2x2'] });

// ---- Capitals (studded top so you can build an entablature/arch above) ----
registerKind({ id: 'cap-tuscan', category: 'Pillars', label: 'Tuscan Capital', heightPlates: 3, studs: true, colorable: true,
    geometry: cap('tuscan'), sizes: ['1x1','2x2'] });

registerKind({ id: 'cap-doric', category: 'Pillars', label: 'Doric Capital', heightPlates: 3, studs: true, colorable: true,
    geometry: cap('doric'), sizes: ['1x1','2x2'] });

registerKind({ id: 'cap-ionic', category: 'Pillars', label: 'Ionic Capital', heightPlates: 3, studs: true, colorable: true,
    geometry: cap('ionic'), sizes: ['2x2'] });

registerKind({ id: 'cap-corinthian', category: 'Pillars', label: 'Corinthian Capital', heightPlates: 4, studs: true, colorable: true,
    geometry: cap('corinthian'), sizes: ['2x2'] });
