// Turns the cursor into a snapped, validated placement target.
// Key behaviour: a piece stays on the surface it's building on and can hang off edges
// (staggered / overhang), dropping to a lower level only when it would otherwise float.
import * as THREE from 'three';
import { STUD, PLATE } from './constants.js';
import { camera, raycaster, pointer } from './scene.js';
import { placedMeshes } from './blocks.js';
import { heightPlatesOf } from './registry.js';
import { selType, selSize, effFoot, stickyLevel, setSticky } from './selection.js';
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

export function computeTarget() {
    if (!selType) return null;
    raycaster.setFromCamera(pointer, camera);
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
