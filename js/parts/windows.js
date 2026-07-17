// Windows — several opening shapes and sizes. Frame is colorable; a glass pane fills it.
import { registerKind } from '../registry.js';
import { windowGeometry } from '../geometry.js';

const win = style => (fw, fd, h) => windowGeometry(fw, fd, h, style);

registerKind({ id: 'window', category: 'Windows', label: 'Windows', heightPlates: 6, studs: true, colorable: true, pane: true,
    geometry: win('plain'), sizes: ['2x1@6','2x1@9','3x1@6','4x1@9'] });

registerKind({ id: 'window-cross', category: 'Windows', label: 'Cross Windows', heightPlates: 6, studs: true, colorable: true, pane: true,
    geometry: win('cross'), sizes: ['2x1@6','3x1@9'] });

registerKind({ id: 'window-arched', category: 'Windows', label: 'Arched Windows', heightPlates: 9, studs: true, colorable: true, pane: true,
    geometry: win('arched'), sizes: ['2x1@9','3x1@9'] });

registerKind({ id: 'window-round', category: 'Windows', label: 'Round Windows', heightPlates: 6, studs: true, colorable: true, pane: true,
    geometry: win('round'), sizes: ['2x1@6','3x1@9'] });
