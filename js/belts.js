// Belts & chains linking pulleys. A belt is dragged from a handle (top/bottom) on one pulley
// to a handle on another. Same-side (top-top / bottom-bottom) = open belt = same direction;
// opposite sides (top-bottom) = crossed = reversed. The driveline (mechanics.js) reads `belts`.
import * as THREE from 'three';
import { scene } from './scene.js';

export const belts = [];          // { id, aPulley, aSide, bPulley, bSide, chain, mesh }
const pulleys = [];               // pulley records (registered by blocks.js)
let handleMeshes = [];            // clickable top/bottom handles, shown while a belt tool is active
let dragMesh = null, dragFrom = null;
let beltId = 1;

const handleGeo = new THREE.SphereGeometry(0.14, 12, 8);
const handleMat = new THREE.MeshStandardMaterial({ color: 0xffd24a, emissive: 0x554400 });

export function registerPulley(rec) { pulleys.push(rec); }
export function unregisterPulley(rec) { const i = pulleys.indexOf(rec); if (i !== -1) pulleys.splice(i, 1); }

// World position of a pulley's top/bottom belt-attachment point.
function handlePos(pulley, side) {
    const axleChar = pulley._axle ? pulley._axle.axleChar : 'x';
    const up = axleChar === 'y' ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0);
    return new THREE.Vector3().copy(pulley.group.position).addScaledVector(up, side === 'top' ? pulley.radius : -pulley.radius);
}

// A thin rod between two world points (belt strand).
function rod(p1, p2, r, color) {
    const dir = new THREE.Vector3().subVectors(p2, p1);
    const len = dir.length() || 0.001;
    const m = new THREE.Mesh(
        new THREE.CylinderGeometry(r, r, len, 8),
        new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.35, roughness: 0.5 })
    );
    m.position.copy(p1).addScaledVector(dir, 0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    return m;
}

function beltMesh(a, aSide, b, bSide, chain) {
    return rod(handlePos(a, aSide), handlePos(b, bSide), chain ? 0.06 : 0.05, chain ? 0x9BA19D : 0x35c0ff);
}

function disposeMesh(m) { m.geometry.dispose(); m.material.dispose(); }

// ---- Handles (shown while the Belt/Chain tool is selected) ----
export function showHandles() {
    hideHandles();
    for (const p of pulleys) for (const side of ['top', 'bottom']) {
        const s = new THREE.Mesh(handleGeo, handleMat);
        s.position.copy(handlePos(p, side));
        s.userData.handle = { pulley: p, side };
        scene.add(s); handleMeshes.push(s);
    }
}
export function hideHandles() { handleMeshes.forEach(m => scene.remove(m)); handleMeshes = []; }
export function handleUnderRay(raycaster) {
    const hits = raycaster.intersectObjects(handleMeshes, false);
    return hits.length ? hits[0].object.userData.handle : null;
}

// ---- Drag interaction ----
export function startDrag(handle) { dragFrom = handle; }
export function dragActive() { return !!dragFrom; }
export function updateDrag(raycaster) {
    if (!dragFrom) return;
    const from = handlePos(dragFrom.pulley, dragFrom.side);
    const h = handleUnderRay(raycaster);
    let point;
    if (h && h.pulley !== dragFrom.pulley) point = handlePos(h.pulley, h.side);   // snap to target handle
    else {
        point = new THREE.Vector3();
        const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(raycaster.ray.direction.clone().negate(), from);
        if (!raycaster.ray.intersectPlane(plane, point)) point.copy(from);
    }
    if (dragMesh) { scene.remove(dragMesh); disposeMesh(dragMesh); }
    dragMesh = rod(from, point, 0.04, 0x35ff8a);
    scene.add(dragMesh);
}
export function endDrag(target, chain) {
    if (dragMesh) { scene.remove(dragMesh); disposeMesh(dragMesh); dragMesh = null; }
    const from = dragFrom; dragFrom = null;
    if (from && target && target.pulley !== from.pulley) {
        createBelt(from.pulley, from.side, target.pulley, target.side, chain);
        showHandles();   // refresh (positions unchanged, but keep them on top)
        return true;
    }
    return false;
}

// ---- Belt lifecycle ----
export function createBelt(a, aSide, b, bSide, chain) {
    const mesh = beltMesh(a, aSide, b, bSide, chain);
    scene.add(mesh);
    belts.push({ id: beltId++, aPulley: a, aSide, bPulley: b, bSide, chain, mesh });
}
export function deleteBeltsFor(pulley) {
    for (let i = belts.length - 1; i >= 0; i--) {
        if (belts[i].aPulley === pulley || belts[i].bPulley === pulley) {
            scene.remove(belts[i].mesh); disposeMesh(belts[i].mesh); belts.splice(i, 1);
        }
    }
}

// ---- Save / load ----
export function serializeBelts() {
    const v = p => [p.group.position.x, p.group.position.y, p.group.position.z];
    return belts.map(b => ({ chain: b.chain, a: v(b.aPulley), aSide: b.aSide, b: v(b.bPulley), bSide: b.bSide }));
}
export function clearBelts() { [...belts].forEach(b => { scene.remove(b.mesh); disposeMesh(b.mesh); }); belts.length = 0; }
export function restoreBelts(specs) {
    for (const s of specs || []) {
        const a = findPulleyNear(s.a), b = findPulleyNear(s.b);
        if (a && b) createBelt(a, s.aSide, b, s.bSide, s.chain);
    }
}
function findPulleyNear([x, y, z]) {
    const target = new THREE.Vector3(x, y, z);
    let best = null, bd = 0.3;
    for (const p of pulleys) { const d = p.group.position.distanceTo(target); if (d < bd) { bd = d; best = p; } }
    return best;
}
