// Round bricks & plates.
import { registerKind } from '../registry.js';
import { cylinderGeometry } from '../geometry.js';

registerKind({ id: 'round', category: 'Round', label: 'Round Bricks', heightPlates: 3, studs: true, colorable: true,
    geometry: cylinderGeometry, sizes: ['1x1','2x2'] });

registerKind({ id: 'roundplate', category: 'Round', label: 'Round Plates', heightPlates: 1, studs: true, colorable: true,
    geometry: cylinderGeometry, sizes: ['1x1','2x2'] });
