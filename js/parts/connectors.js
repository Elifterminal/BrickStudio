// Technic-style connectors: axles (+ cross-section rods) and pins. Structural for now.
import { registerKind } from '../registry.js';
import { axleGeometry, pinGeometry } from '../geometry.js';

registerKind({ id: 'axle', category: 'Technic', label: 'Axles', heightPlates: 1, studs: false, colorable: true,
    geometry: axleGeometry, sizes: ['2x1','3x1','4x1','6x1'] });

registerKind({ id: 'pin', category: 'Technic', label: 'Pins', heightPlates: 1, studs: false, colorable: true,
    geometry: pinGeometry, sizes: ['1x1','2x1'] });
