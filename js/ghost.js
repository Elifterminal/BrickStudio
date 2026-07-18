// The translucent preview piece + footprint highlight + arrow-key nudging.
import * as THREE from 'three';
import { STUD, PLATE } from './constants.js';
import { scene, camera } from './scene.js';
import { makeGroup, disposeGroup, bodyColor } from './factory.js';
import { computeTarget } from './snapping.js';
import { orientToAxis } from './blocks.js';
import { heightPlatesOf } from './registry.js';
import { selType, selSize, selColor, rot, effFoot } from './selection.js';
import { footCells, isValid } from './occupancy.js';

export let ghostState = null;
let ghost = null, ghostMats = null, footMarker = null;

export function initGhost() {
    const g = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 0.02, 1));
    footMarker = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ transparent: true, opacity: 0.9 }));
    footMarker.visible = false;
    scene.add(footMarker);
}

export function rebuildGhost() {
    if (ghost) { scene.remove(ghost); disposeGroup(ghost); ghost = null; ghostMats = null; }
    if (footMarker) footMarker.visible = false;
    ghostState = null;
    if (!selType) return;
    ghost = makeGroup(selType, selSize, bodyColor(selType, selColor), { ghost: true });
    ghost.rotation.y = rot * Math.PI / 2;
    ghost.visible = false;
    ghostMats = ghost.userData.ghostMats;
    scene.add(ghost);
}

export function applyRotation() {
    if (ghost) { ghost.rotation.y = rot * Math.PI / 2; updateGhost(); }
}

export function updateGhost() {
    if (!ghost) return;
    const st = computeTarget();
    ghostState = st;
    if (!st) { ghost.visible = false; footMarker.visible = false; return; }
    positionGhost(st);
}

function positionGhost(st) {
    const tint = st.valid ? 0x35ff8a : 0xff4d4d;
    if (ghostMats) {
        ghostMats.edge.color.setHex(tint);
        ghostMats.bodies.forEach(m => m.emissive.setHex(st.valid ? 0x0a2a16 : 0x400808));
    }

    // Mounted-on-axle preview: explicit position + axis-aligned orientation, no footprint.
    if (st.mount) {
        ghost.position.set(st.mount.x, st.mount.y, st.mount.z);
        orientToAxis(ghost, selType, st.mount.axleChar);
        ghost.visible = true;
        footMarker.visible = false;
        return;
    }

    const h = heightPlatesOf(selType, selSize) * PLATE;
    const cx = (st.minGX + (st.ew - 1) / 2) * STUD;
    const cz = (st.minGZ + (st.ed - 1) / 2) * STUD;
    ghost.position.set(cx, st.level * PLATE + h / 2, cz);
    ghost.rotation.y = rot * Math.PI / 2;
    ghost.visible = true;

    footMarker.visible = true;
    footMarker.scale.set(st.ew * STUD, 1, st.ed * STUD);
    footMarker.position.set(cx, st.level * PLATE + 0.01, cz);
    footMarker.material.color.setHex(tint);
}

export function hideGhost() {
    if (ghost) ghost.visible = false;
    if (footMarker) footMarker.visible = false;
}

// Nudge the ghost one stud in a screen-relative direction, keeping its level.
export function nudge(dir) {
    if (!selType || !ghost || !ghostState || ghostState.mount) return;   // no nudging axle mounts
    const a = screenAxes();
    let dgx = 0, dgz = 0;
    if (dir === 'left')  { dgx = -a.right[0]; dgz = -a.right[1]; }
    if (dir === 'right') { dgx =  a.right[0]; dgz =  a.right[1]; }
    if (dir === 'up')    { dgx =  a.fwd[0];   dgz =  a.fwd[1]; }
    if (dir === 'down')  { dgx = -a.fwd[0];   dgz = -a.fwd[1]; }

    const st = { ...ghostState, minGX: ghostState.minGX + dgx, minGZ: ghostState.minGZ + dgz };
    st.cells = footCells(st.minGX, st.minGZ, st.ew, st.ed);
    st.valid = isValid(st.cells, st.level, heightPlatesOf(selType, selSize));
    ghostState = st;
    positionGhost(st);
}

function screenAxes() {
    const fwd = new THREE.Vector3();
    camera.getWorldDirection(fwd); fwd.y = 0; fwd.normalize();
    const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
    const ax = v => Math.abs(v.x) >= Math.abs(v.z) ? [Math.sign(v.x), 0] : [0, Math.sign(v.z)];
    return { right: ax(right), fwd: ax(fwd) };
}
