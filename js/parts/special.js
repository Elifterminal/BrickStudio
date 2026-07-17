// Non-realistic extras (kept intentionally). Water becomes real particle water later;
// lights get multiple sizes/brightness later.
import { registerKind } from '../registry.js';
import { boxGeometry } from '../geometry.js';

registerKind({ id: 'light', category: 'Special', label: 'Lights', heightPlates: 3, studs: true, colorable: false,
    color: 0xfff2a0, emissive: 0x998100, glow: true,
    geometry: boxGeometry, sizes: ['1x1','2x2'] });

registerKind({ id: 'water', category: 'Special', label: 'Water', heightPlates: 3, studs: true, colorable: false,
    color: 0x2aa8ff, water: true,
    geometry: boxGeometry, sizes: ['1x1'] });
