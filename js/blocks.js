// Placed pieces: creation, deletion, occupancy writes, and erase-mode hover/pick.
import { PLATE } from './constants.js';
import { scene, camera, raycaster, pointer } from './scene.js';
import { makeGroup, disposeGroup, bodyColor } from './factory.js';
import { getKind, heightPlatesOf } from './registry.js';
import { selType, selSize, selColor, rot } from './selection.js';
import { STUD } from './constants.js';
import { addVoxels, removeVoxels, isValid } from './occupancy.js';

export const placedBlocks = [];   // { id, group, voxels, meshes, level, hP }
export const placedMeshes = [];   // flattened child meshes, for raycasting
let nextId = 1;
let hoveredRoot = null;

export function placeAt(st) {
    if (!st) return;
    // Re-validate against live occupancy (guards double-taps, keeps nudged positions honest).
    const hP = heightPlatesOf(selType, selSize);
    if (!isValid(st.cells, st.level, hP)) return false;

    const h = hP * PLATE;
    const g = makeGroup(selType, selSize, bodyColor(selType, selColor));
    const cx = (st.minGX + (st.ew - 1) / 2) * STUD;
    const cz = (st.minGZ + (st.ed - 1) / 2) * STUD;
    g.position.set(cx, st.level * PLATE + h / 2, cz);
    g.rotation.y = rot * Math.PI / 2;
    scene.add(g);

    const voxels = addVoxels(st.cells, st.level, hP);
    const meshes = g.children.filter(c => c.isMesh);
    const rec = { id: nextId++, group: g, voxels, meshes, level: st.level, hP };
    g.userData.record = rec;
    placedBlocks.push(rec);
    meshes.forEach(m => placedMeshes.push(m));
    return true;
}

export function deleteRoot(root) {
    const idx = placedBlocks.findIndex(b => b.group === root);
    if (idx === -1) return;
    const rec = placedBlocks[idx];
    removeVoxels(rec.voxels);
    rec.meshes.forEach(m => { const i = placedMeshes.indexOf(m); if (i !== -1) placedMeshes.splice(i, 1); });
    scene.remove(rec.group);
    disposeGroup(rec.group);
    placedBlocks.splice(idx, 1);
}

export function clearAll() { [...placedBlocks].forEach(b => deleteRoot(b.group)); }

export function rootUnder() {
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(placedMeshes, false);
    return hits.length ? hits[0].object.userData.root : null;
}

export function setHovered(root) {
    if (hoveredRoot === root) return;
    if (hoveredRoot) tint(hoveredRoot, null);
    hoveredRoot = root;
    if (hoveredRoot) tint(hoveredRoot, 0x662222);
}

function tint(root, hex) {
    const base = getKind(root.userData.type).emissive || 0x000000;
    root.userData.record.meshes.forEach(m => m.material.emissive && m.material.emissive.setHex(hex == null ? base : hex));
}
