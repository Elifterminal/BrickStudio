// Placed pieces: creation, deletion, occupancy writes, and erase-mode hover/pick.
import { PLATE } from './constants.js';
import { scene, camera, raycaster, pointer } from './scene.js';
import { makeGroup, disposeGroup, bodyColor } from './factory.js';
import { getKind, heightPlatesOf, footprint } from './registry.js';
import { selType, selSize, selColor, rot } from './selection.js';
import { STUD } from './constants.js';
import { addVoxels, removeVoxels, isValid, footCells } from './occupancy.js';

export const placedBlocks = [];   // { id, group, voxels, meshes, level, hP, spec }
export const placedMeshes = [];   // flattened child meshes, for raycasting
let nextId = 1;
let hoveredRoot = null;

// Footprint after rotation (swaps W/D on 90°/270°).
function effFoot(size, rotation) {
    const [w, d] = footprint(size);
    return (rotation % 2) ? [d, w] : [w, d];
}

// Place a block from a full spec. This is the single source of truth for creation,
// used by both interactive placement and save/load restore. opts.validate=false trusts
// the caller (restore of previously-valid data).
export function addBlock(spec, opts = {}) {
    const { type, size, color, rot: r = 0, minGX, minGZ, level } = spec;
    const [ew, ed] = effFoot(size, r);
    const hP = heightPlatesOf(type, size);
    const cells = footCells(minGX, minGZ, ew, ed);
    if (opts.validate !== false && !isValid(cells, level, hP)) return false;

    const h = hP * PLATE;
    const g = makeGroup(type, size, color);
    const cx = (minGX + (ew - 1) / 2) * STUD;
    const cz = (minGZ + (ed - 1) / 2) * STUD;
    g.position.set(cx, level * PLATE + h / 2, cz);
    g.rotation.y = r * Math.PI / 2;
    scene.add(g);

    const voxels = addVoxels(cells, level, hP);
    const meshes = [];
    g.traverse(o => { if (o.isMesh) meshes.push(o); });   // includes rotor children
    const rec = { id: nextId++, group: g, voxels, meshes, level, hP, spec: { type, size, color, rot: r, minGX, minGZ, level } };
    g.userData.record = rec;
    placedBlocks.push(rec);
    meshes.forEach(m => placedMeshes.push(m));
    return true;
}

// Interactive placement from the current selection + the snapped ghost target.
export function placeAt(st) {
    if (!st) return false;
    return addBlock({
        type: selType, size: selSize, color: bodyColor(selType, selColor), rot,
        minGX: st.minGX, minGZ: st.minGZ, level: st.level,
    });
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
