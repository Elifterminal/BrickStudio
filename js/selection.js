// Current build selection: which piece, color, rotation, and the "sticky" build level.
// Exported bindings are read live by other modules; only mutate them through the setters here.
import { footprint } from './registry.js';
import { DEFAULT_COLOR } from './colors.js';

export let selType = null;
export let selSize = null;
export let selColor = DEFAULT_COLOR;
export let rot = 0;          // 0..3 (× 90°)
export let stickyLevel = 0;  // last surface level we built on (keeps overhangs smooth)
export let axleMountMode = 'end';   // how a side-mounted axle sits on a face: 'end' | 'mid'

export function setPiece(type, size) { selType = type; selSize = size; }
export function setColor(hex) { selColor = hex; }
export function setRot(r) { rot = ((r % 4) + 4) % 4; }
export function setSticky(level) { stickyLevel = level; }
export function toggleAxleMount() { axleMountMode = axleMountMode === 'end' ? 'mid' : 'end'; return axleMountMode; }

// Footprint after rotation (swaps width/depth on 90°/270°).
export function effFoot() {
    if (!selSize) return [1, 1];
    const [w, d] = footprint(selSize);
    return (rot % 2) ? [d, w] : [w, d];
}
