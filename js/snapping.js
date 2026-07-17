// Turns the cursor into a snapped, validated placement target.
// Key behaviour: a piece stays on the surface it's building on and can hang off edges
// (staggered / overhang), dropping to a lower level only when it would otherwise float.
import * as THREE from 'three';
import { STUD, PLATE } from './constants.js';
import { camera, raycaster, pointer } from './scene.js';
import { placedMeshes, axles } from './blocks.js';
import { heightPlatesOf, getKind, footprint } from './registry.js';
import { selType, selSize, effFoot, stickyLevel, setSticky, axleMountMode } from './selection.js';
import { footCells, isValid } from './occupancy.js';

const UP = new THREE.Vector3(0, 1, 0);

export function projectToLevel(level) {
    const plane = new THREE.Plane(UP, -level * PLATE);
    const p = new THREE.Vector3();
    return raycaster.ray.intersectPlane(plane, p) ? p : null;
}

function topLevelOfHit(obj) {
    const root = obj.userData.root, rec = root && root.userData.record;
    return rec ? rec.level + rec.hP : null;
}

// Nearest axle mount point (mid or either end) under the cursor, if within reach.
function nearestAxleMount() {
    let best = null, bestD = 1.3 * STUD;
    const pt = new THREE.Vector3();
    for (const a of axles) {
        const dx = a.axleChar === 'x' ? a.halfLen : 0;
        const dz = a.axleChar === 'z' ? a.halfLen : 0;
        const points = [[a.cx, a.cy, a.cz], [a.cx + dx, a.cy, a.cz + dz], [a.cx - dx, a.cy, a.cz - dz]];
        for (const [x, y, z] of points) {
            const d = raycaster.ray.distanceToPoint(pt.set(x, y, z));
            if (d < bestD) { bestD = d; best = { x, y, z, axleChar: a.axleChar }; }
        }
    }
    return best;
}

// Snap an axle to the vertical side face under the cursor, sticking out perpendicular.
// 'end' mode puts the axle's near end on the face; 'mid' centers it on the face.
function sideMountForAxle() {
    const hits = raycaster.intersectObjects(placedMeshes, false);
    if (!hits.length || !hits[0].face) return null;
    const hit = hits[0];
    const n = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
    if (Math.abs(n.y) > 0.5) return null;                    // top/bottom face — use grid instead
    const axleChar = Math.abs(n.x) >= Math.abs(n.z) ? 'x' : 'z';
    const halfLen = Math.max(...footprint(selSize)) * STUD / 2;
    const off = axleMountMode === 'mid' ? 0 : halfLen;
    const y = Math.round(hit.point.y / PLATE) * PLATE;
    if (axleChar === 'x') {
        const dir = Math.sign(n.x) || 1;
        return { x: hit.point.x + dir * off, y, z: Math.round(hit.point.z / STUD) * STUD, axleChar };
    }
    const dir = Math.sign(n.z) || 1;
    return { x: Math.round(hit.point.x / STUD) * STUD, y, z: hit.point.z + dir * off, axleChar };
}

export function computeTarget() {
    if (!selType) return null;
    raycaster.setFromCamera(pointer, camera);

    // Movable parts snap onto a nearby axle; otherwise fall back to grid placement.
    if (getKind(selType).mount === 'axle') {
        const m = nearestAxleMount();
        if (m) return { mount: m, valid: true };
    }
    // Axles can snap to a block's side face (else fall through to grid / on-top placement).
    if (getKind(selType).sideMount) {
        const sm = sideMountForAxle();
        if (sm) return { mount: sm, valid: true };
    }

    const [ew, ed] = effFoot();
    const hP = heightPlatesOf(selType, selSize);

    const hits = raycaster.intersectObjects(placedMeshes, false);
    const levels = [];
    if (hits.length) { const t = topLevelOfHit(hits[0].object); if (t != null) levels.push(t); }
    if (!levels.includes(stickyLevel)) levels.push(stickyLevel);
    if (!levels.includes(0)) levels.push(0);

    for (const level of levels) {
        const p = projectToLevel(level);
        if (!p) continue;
        const minGX = Math.round(p.x / STUD - (ew - 1) / 2);
        const minGZ = Math.round(p.z / STUD - (ed - 1) / 2);
        const cells = footCells(minGX, minGZ, ew, ed);
        if (isValid(cells, level, hP)) { setSticky(level); return { minGX, minGZ, level, ew, ed, cells, valid: true }; }
    }

    // Nothing valid — show an invalid preview at the most relevant level.
    const level = levels[0];
    const p = projectToLevel(level) || projectToLevel(0);
    if (!p) return null;
    const minGX = Math.round(p.x / STUD - (ew - 1) / 2);
    const minGZ = Math.round(p.z / STUD - (ed - 1) / 2);
    return { minGX, minGZ, level, ew, ed, cells: footCells(minGX, minGZ, ew, ed), valid: false };
}
