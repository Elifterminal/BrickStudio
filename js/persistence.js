// Save / load builds. Auto-persists to localStorage so a build survives a refresh,
// plus Export/Import of a JSON file for backup and sharing.
import { placedBlocks, addBlock, clearAll } from './blocks.js';
import { serializeBelts, restoreBelts, clearBelts } from './belts.js';

const KEY = 'brickstudio.build.v1';        // the auto-saved current build
const SLOTS_KEY = 'brickstudio.slots.v1';  // named saves { name: {v, blocks} }

// One-time migration from the pre-rename keys (safe to remove after a while).
(function migrateLegacyKeys() {
    try {
        for (const [oldK, newK] of [['eliflego.build.v1', KEY], ['eliflego.slots.v1', SLOTS_KEY]]) {
            const v = localStorage.getItem(oldK);
            if (v && !localStorage.getItem(newK)) { localStorage.setItem(newK, v); localStorage.removeItem(oldK); }
        }
    } catch (e) { /* localStorage unavailable */ }
})();

export function serialize() {
    return { v: 1, blocks: placedBlocks.map(b => b.spec), belts: serializeBelts() };
}

// ---- Named build slots ----
function readSlots() { try { return JSON.parse(localStorage.getItem(SLOTS_KEY) || '{}'); } catch { return {}; } }
function writeSlots(o) { try { localStorage.setItem(SLOTS_KEY, JSON.stringify(o)); } catch (e) { console.warn('Brick Studio: slots write failed', e); } }

export function listSlots() { return Object.keys(readSlots()).sort(); }

export function saveSlot(name) {
    const o = readSlots();
    o[name] = serialize();
    writeSlots(o);
}

export function loadSlot(name) {
    const o = readSlots();
    if (!o[name]) return 0;
    const n = restore(o[name].blocks || [], o[name].belts || []);
    saveBuild();                        // make the loaded build the current one
    return n;
}

export function deleteSlot(name) {
    const o = readSlots();
    delete o[name];
    writeSlots(o);
}

export function saveBuild() {
    try { localStorage.setItem(KEY, JSON.stringify(serialize())); }
    catch (e) { console.warn('Brick Studio: save failed', e); }
}

export function loadBuild() {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return 0;
        const data = JSON.parse(raw);
        return restore(data.blocks || [], data.belts || []);
    } catch (e) { console.warn('Brick Studio: load failed', e); return 0; }
}

// Rebuild from arrays of specs. Bottom-up so supports exist first; trusts the data.
// Belts are recreated after the blocks (pulleys) exist.
export function restore(specs, beltSpecs) {
    clearAll();
    clearBelts();
    let n = 0;
    specs.slice().sort((a, b) => a.level - b.level).forEach(sp => { if (addBlock(sp, { validate: false })) n++; });
    restoreBelts(beltSpecs);
    return n;
}

export function exportBuild() {
    const blob = new Blob([JSON.stringify(serialize())], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'brick-studio-build.json';
    a.click();
    URL.revokeObjectURL(url);
}

export function importBuild(file, done) {
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const data = JSON.parse(reader.result);
            const n = restore(data.blocks || [], data.belts || []);
            saveBuild();
            done && done(n);
        } catch (e) { console.warn('Brick Studio: import failed', e); done && done(-1); }
    };
    reader.readAsText(file);
}
