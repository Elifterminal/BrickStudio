// Pointer + keyboard handling. Click = place/erase; left-drag = orbit (OrbitControls).
import { renderer, pointer, dolly } from './scene.js';
import { selType, setRot, rot, toggleAxleMount, toggleAxleVertical } from './selection.js';
import { updateGhost, hideGhost, applyRotation, nudge, ghostState } from './ghost.js';
import { placeAt, deleteRoot, rootUnder, setHovered } from './blocks.js';
import { saveBuild } from './persistence.js';
import { deselect, updateModePill } from './ui.js';

let downPos = null, moved = false;

export function setupEvents() {
    const el = renderer.domElement;

    el.addEventListener('pointerdown', e => {
        if (e.button === 0) { downPos = { x: e.clientX, y: e.clientY }; moved = false; }
    });

    el.addEventListener('pointermove', e => {
        updatePointer(e);
        if (downPos && Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y) > 5) moved = true;
        if (selType) updateGhost();
        else setHovered(rootUnder());
    });

    el.addEventListener('pointerup', e => {
        if (e.button !== 0) return;
        const click = downPos && !moved;   // a tap, not an orbit drag
        downPos = null;
        if (!click) return;
        if (selType) { if (placeAt(ghostState)) saveBuild(); }
        else { const r = rootUnder(); if (r) { deleteRoot(r); saveBuild(); } }
    });

    el.addEventListener('pointerleave', () => { hideGhost(); setHovered(null); });

    window.addEventListener('keydown', e => {
        const k = e.key;
        if (k === 'r' || k === 'R') { setRot(rot + 1); applyRotation(); }
        else if (k === 'm' || k === 'M') { toggleAxleMount(); updateGhost(); updateModePill(); }
        else if (k === 'v' || k === 'V') { toggleAxleVertical(); updateGhost(); updateModePill(); }
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
