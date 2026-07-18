// Axle connectors: axles (+ cross-section rods) and pins. Structural for now.
import { registerKind } from '../registry.js';
import { axleGeometry, pinGeometry } from '../geometry.js';

registerKind({ id: 'axle', category: 'Axles', label: 'Axles', heightPlates: 1, studs: false, colorable: true,
    sideMount: true, rotates: true, geometry: axleGeometry, sizes: ['2x1','3x1','4x1','6x1'] });

registerKind({ id: 'pin', category: 'Axles', label: 'Pins', heightPlates: 1, studs: false, colorable: true,
    geometry: pinGeometry, sizes: ['1x1','2x1'] });
