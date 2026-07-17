// Slopes: straight, inverted, corner.
import { registerKind } from '../registry.js';
import { slopeGeometry, invSlopeGeometry, cornerSlopeGeometry, curvedSlopeGeometry } from '../geometry.js';

registerKind({ id: 'slope', category: 'Slopes', label: 'Slopes', heightPlates: 3, studs: false, colorable: true,
    geometry: slopeGeometry, sizes: ['2x1','2x2'] });

registerKind({ id: 'islope', category: 'Slopes', label: 'Inverted Slopes', heightPlates: 3, studs: true, colorable: true,
    geometry: invSlopeGeometry, sizes: ['2x1','2x2'] });

registerKind({ id: 'cslope', category: 'Slopes', label: 'Corner Slopes', heightPlates: 3, studs: false, colorable: true,
    geometry: cornerSlopeGeometry, sizes: ['2x2'] });

registerKind({ id: 'curveslope', category: 'Slopes', label: 'Curved Slopes', heightPlates: 3, studs: false, colorable: true,
    geometry: curvedSlopeGeometry, sizes: ['2x1','2x2'] });
