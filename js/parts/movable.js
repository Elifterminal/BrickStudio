// Movable parts. `spin` makes the animation loop rotate them (pausable via the Animate toggle).
// Note: they spin on their own — not mechanically driven by axles (no physics layer yet).
import { registerKind } from '../registry.js';
import { wheelGeometry, propellerGeometry, fanGeometry } from '../geometry.js';

registerKind({ id: 'wheel', category: 'Movable', label: 'Wheels', heightPlates: 6, studs: false, colorable: true,
    spin: { axis: 'x', speed: 2.2 }, geometry: wheelGeometry, sizes: ['2x2','2x3'] });

registerKind({ id: 'propeller', category: 'Movable', label: 'Propellers', heightPlates: 4, studs: false, colorable: true,
    spin: { axis: 'z', speed: 6 }, geometry: propellerGeometry, sizes: ['2x2','3x3'] });

registerKind({ id: 'fan', category: 'Movable', label: 'Fans', heightPlates: 4, studs: false, colorable: true,
    spin: { axis: 'y', speed: 4 }, geometry: fanGeometry, sizes: ['2x2','3x3'] });
