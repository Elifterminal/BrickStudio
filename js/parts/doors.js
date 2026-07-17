// Doors: a doorway frame (opening to the floor) and a door leaf with a small window.
import { registerKind } from '../registry.js';
import { doorFrameGeometry, doorLeafGeometry } from '../geometry.js';

registerKind({ id: 'doorframe', category: 'Doors', label: 'Doorways', heightPlates: 9, studs: true, colorable: true,
    geometry: doorFrameGeometry, sizes: ['2x1@9','2x1@12','3x1@12'] });

registerKind({ id: 'door', category: 'Doors', label: 'Doors', heightPlates: 9, studs: false, colorable: true,
    geometry: doorLeafGeometry, sizes: ['2x1@9','2x1@12'] });
