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
export const axles = [];          // { id, cx, cy, cz, axleChar, halfLen } — mount targets
let nextId = 1;
let hoveredRoot = null;

// Footprint after rotation (swaps W/D on 90°/270°).
function effFoot(size, rotation) {
    const [w, d] = footprint(size);
    return (rotation % 2) ? [d, w] : [w, d];
}

// Which 90° turn aligns a part's local long/spin axis to the axle direction.
// Movable parts spin about spin.axis; an axle's own geometry lies along local X.
export function mountRotation(kindId, axleChar) {
    const localAxis = getKind(kindId).spin?.axis || 'x';
    return localAxis === axleChar ? 0 : 1;
}

function registerBlock(g, voxels, spec) {
    const meshes = [];
    g.traverse(o => { if (o.isMesh) meshes.push(o); });   // includes rotor children
    const rec = { id: nextId++, group: g, voxels, meshes, level: spec.level ?? 0, hP: 0, spec };
    g.userData.record = rec;
    placedBlocks.push(rec);
    meshes.forEach(m => placedMeshes.push(m));
    if (spec.type === 'axle') recordAxle(rec, spec);
    return rec;
}

function recordAxle(rec, spec) {
    const long = Math.max(...footprint(spec.size));
    const axleChar = spec.mount ? spec.mount.axleChar : ((spec.rot % 2) ? 'z' : 'x');
    axles.push({
        id: rec.id, cx: rec.group.position.x, cy: rec.group.position.y, cz: rec.group.position.z,
        axleChar, halfLen: long * STUD / 2,
    });
}

// Place a block from a full spec. This is the single source of truth for creation,
// used by both interactive placement and save/load restore. opts.validate=false trusts
// the caller (restore of previously-valid data).
export function addBlock(spec, opts = {}) {
    if (spec.mount) return addMounted(spec);

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
    const rec = registerBlock(g, voxels, { type, size, color, rot: r, minGX, minGZ, level });
    rec.hP = hP;
    return true;
}

// A movable part attached to an axle: explicit position + axis-aligned orientation, no occupancy.
function addMounted(spec) {
    const { type, size, color, mount } = spec;
    const k = getKind(type);
    const g = makeGroup(type, size, color);
    g.position.set(mount.x, mount.y, mount.z);
    g.rotation.y = mountRotation(type, mount.axleChar) * Math.PI / 2;
    scene.add(g);
    const rec = registerBlock(g, [], { type, size, color, mount, level: 0 });
    const [fw, fd] = footprint(size);
    rec.role = k.gear ? 'gear' : (k.driver ? 'crank' : (k.spin ? 'movable' : null));
    rec.radius = k.gear ? Math.max(fw, fd) * STUD : 0;   // pitch radius = size in studs (teeth = size*8)
    rec.speed = k.driver || 0;
    return true;
}

// Interactive placement from the current selection + the snapped ghost target.
export function placeAt(st) {
    if (!st) return false;
    const color = bodyColor(selType, selColor);
    if (st.mount) return addBlock({ type: selType, size: selSize, color, mount: st.mount });
    return addBlock({ type: selType, size: selSize, color, rot, minGX: st.minGX, minGZ: st.minGZ, level: st.level });
}

export function deleteRoot(root) {
    const idx = placedBlocks.findIndex(b => b.group === root);
    if (idx === -1) return;
    const rec = placedBlocks[idx];
    removeVoxels(rec.voxels);
    const ai = axles.findIndex(a => a.id === rec.id);
    if (ai !== -1) axles.splice(ai, 1);
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
