// Pointer + keyboard handling. Click = place/erase; left-drag = orbit (OrbitControls).
// With a Belt/Chain tool selected, drag from a pulley handle to another to connect them.
import { renderer, pointer, camera, raycaster, controls, dolly } from './scene.js';
import { selType, setRot, rot, toggleAxleMount, toggleAxleVertical, toggleMotorDir } from './selection.js';
import { updateGhost, hideGhost, applyRotation, nudge, ghostState } from './ghost.js';
import { placeAt, deleteRoot, rootUnder, setHovered } from './blocks.js';
import { getKind } from './registry.js';
import { startDrag, dragActive, updateDrag, endDrag, handleUnderRay } from './belts.js';
import { saveBuild } from './persistence.js';
import { deselect, updateModePill } from './ui.js';

let downPos = null, moved = false;
const toolOf = () => getKind(selType)?.tool;

export function setupEvents() {
    const el = renderer.domElement;

    el.addEventListener('pointerdown', e => {
        if (e.button !== 0) return;
        if (toolOf()) {                                   // belt/chain: start a drag off a handle
            updatePointer(e); raycaster.setFromCamera(pointer, camera);
            const h = handleUnderRay(raycaster);
            if (h) { controls.enabled = false; startDrag(h); return; }
        }
        downPos = { x: e.clientX, y: e.clientY }; moved = false;
    });

    el.addEventListener('pointermove', e => {
        updatePointer(e);
        if (dragActive()) { raycaster.setFromCamera(pointer, camera); updateDrag(raycaster); return; }
        if (downPos && Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y) > 5) moved = true;
        if (selType && !toolOf()) updateGhost();
        else if (!selType) setHovered(rootUnder());
    });

    el.addEventListener('pointerup', e => {
        if (e.button !== 0) return;
        if (dragActive()) {                               // finish a belt drag
            raycaster.setFromCamera(pointer, camera);
            if (endDrag(handleUnderRay(raycaster), toolOf() === 'chain')) saveBuild();
            controls.enabled = true; downPos = null; return;
        }
        const click = downPos && !moved; downPos = null;
        if (!click) return;
        if (selType) { if (!toolOf() && placeAt(ghostState)) saveBuild(); }
        else { const r = rootUnder(); if (r) { deleteRoot(r); saveBuild(); } }
    });

    el.addEventListener('pointerleave', () => { hideGhost(); setHovered(null); });

    window.addEventListener('keydown', e => {
        const k = e.key;
        if (k === 'r' || k === 'R') { setRot(rot + 1); applyRotation(); }
        else if (k === 'm' || k === 'M') { toggleAxleMount(); updateGhost(); updateModePill(); }
        else if (k === 'v' || k === 'V') { toggleAxleVertical(); updateGhost(); updateModePill(); }
        else if (k === 'f' || k === 'F') { toggleMotorDir(); updateModePill(); }
        else if (k === 'Escape') deselect();
        else if (k.startsWith('Arrow')) { e.preventDefault(); nudge(k.slice(5).toLowerCase()); }
    });

    document.getElementById('zoom-in').addEventListener('click', () => dolly(0.82));
    document.getElementById('zoom-out').addEventListener('click', () => dolly(1.22));
}

function updatePointer(e) {
    const r = renderer.domElement.getBoundingClientRect();
    pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
}
