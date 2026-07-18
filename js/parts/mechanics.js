// Mechanics: gears (mesh to drive other axles) and cranks (drive an axle).
// Both mount on axles like wheels; `rotates` gives them a rotor the driveline turns.
import { registerKind } from '../registry.js';
import { gearGeometry, bevelGeometry, crankGeometry, motorGeometry } from '../geometry.js';

registerKind({ id: 'gear', category: 'Mechanics', label: 'Gears', heightPlates: 4, studs: false, colorable: true,
    mount: 'axle', rotates: true, gear: true, geometry: gearGeometry, sizes: ['1x1','2x2','3x3'] });

// Bevel gears mesh across perpendicular axles — pair one on a horizontal axle with one on a
// vertical axle at the corner to turn power 90° (horizontal <-> vertical).
registerKind({ id: 'bevel', category: 'Mechanics', label: 'Bevel Gears (90°)', heightPlates: 4, studs: false, colorable: true,
    mount: 'axle', rotates: true, gear: true, bevel: true, geometry: bevelGeometry, sizes: ['2x2'] });

registerKind({ id: 'crank', category: 'Mechanics', label: 'Cranks (driver)', heightPlates: 4, studs: false, colorable: true,
    mount: 'axle', rotates: true, driver: 3.0, geometry: crankGeometry, sizes: ['2x2'] });

// Motor: drives its axle at a chosen direction (press F to flip CW/CCW before placing).
registerKind({ id: 'motor', category: 'Mechanics', label: 'Motors (F=dir)', heightPlates: 4, studs: false, colorable: true,
    mount: 'axle', driver: 3.0, geometry: motorGeometry, sizes: ['2x2'] });
