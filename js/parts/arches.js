// Arches — several shapes and heights. "@6" = 2 bricks tall (roomier curve).
import { registerKind } from '../registry.js';
import { archGeometry } from '../geometry.js';

const arch = style => (fw, fd, h) => archGeometry(fw, fd, h, style);

registerKind({ id: 'arch-round', category: 'Arches', label: 'Round Arches', heightPlates: 3, studs: true, colorable: true,
    geometry: arch('round'), sizes: ['3x1','4x1','6x1','4x1@6','6x1@6'] });

registerKind({ id: 'arch-pointed', category: 'Arches', label: 'Pointed Arches', heightPlates: 6, studs: true, colorable: true,
    geometry: arch('pointed'), sizes: ['3x1@6','4x1@6','4x1@9'] });

registerKind({ id: 'arch-segmental', category: 'Arches', label: 'Flat Arches', heightPlates: 3, studs: true, colorable: true,
    geometry: arch('segmental'), sizes: ['4x1','6x1','8x1'] });
