// Bricks, plates, tiles.
import { registerKind } from '../registry.js';
import { boxGeometry } from '../geometry.js';

registerKind({ id: 'brick', category: 'Bricks', label: 'Bricks', heightPlates: 3, studs: true, colorable: true,
    geometry: boxGeometry, sizes: ['1x1','1x2','1x3','1x4','1x6','1x8','2x2','2x3','2x4','2x6'] });

registerKind({ id: 'plate', category: 'Bricks', label: 'Plates', heightPlates: 1, studs: true, colorable: true,
    geometry: boxGeometry, sizes: ['1x2','1x4','2x2','2x4','2x6'] });

registerKind({ id: 'tile', category: 'Bricks', label: 'Tiles (smooth)', heightPlates: 1, studs: false, colorable: true,
    geometry: boxGeometry, sizes: ['1x1','1x2','1x4','2x2','2x4'] });
