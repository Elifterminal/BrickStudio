// Builds the sidebar: theme, colors, category tabs, and the palette for the active tab.
import { allKinds, categories, kindsInCategory, getKind } from './registry.js';
import { COLORS } from './colors.js';
import { THEMES } from './themes.js';
import { setPiece, setColor, setRot, setSticky, selType, selSize, selColor, axleMountMode, axleVertical, motorDir } from './selection.js';
import { rebuildGhost } from './ghost.js';
import { setHovered, clearAll } from './blocks.js';
import { applyTheme } from './scene.js';
import { saveBuild, exportBuild, importBuild, listSlots, saveSlot, loadSlot, deleteSlot } from './persistence.js';
import { toggleAnimating } from './motion.js';

const modePill = () => document.getElementById('mode-pill');
let activeCat = null;

export function buildUI() {
    buildThemeSelect();
    buildColorRow();
    buildTabs();
    renderCategory(categories()[0]);
    buildBuildsPanel();
    buildAnimateToggle();
    buildFileControls();
}

function buildAnimateToggle() {
    const btn = document.getElementById('animate-toggle');
    btn.addEventListener('click', () => {
        const on = toggleAnimating();
        btn.textContent = on ? 'Animation: On' : 'Animation: Off';
        btn.classList.toggle('active', on);
    });
}

function buildBuildsPanel() {
    const sel = document.getElementById('slot-select');
    refreshSlots();

    document.getElementById('save-slot').addEventListener('click', () => {
        const name = (prompt('Name this build:') || '').trim();
        if (!name) return;
        saveSlot(name);
        refreshSlots();
        sel.value = name;
    });
    document.getElementById('load-slot').addEventListener('click', () => {
        if (sel.value) loadSlot(sel.value);
    });
    document.getElementById('delete-slot').addEventListener('click', () => {
        if (sel.value && confirm(`Delete build "${sel.value}"?`)) { deleteSlot(sel.value); refreshSlots(); }
    });
}

function refreshSlots() {
    const sel = document.getElementById('slot-select');
    const names = listSlots();
    sel.innerHTML = names.length
        ? names.map(n => `<option value="${n}">${n}</option>`).join('')
        : '<option value="">(no saved builds)</option>';
}

function buildFileControls() {
    document.getElementById('clear-all').addEventListener('click', () => { clearAll(); saveBuild(); });
    document.getElementById('export-build').addEventListener('click', exportBuild);

    const fileInput = document.getElementById('import-file');
    document.getElementById('import-build').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', e => {
        const f = e.target.files[0];
        if (f) importBuild(f);
        fileInput.value = '';   // allow re-importing the same file
    });
}

function buildThemeSelect() {
    const ts = document.getElementById('theme-select');
    Object.keys(THEMES).forEach(k => {
        const o = document.createElement('option');
        o.value = o.textContent = k;
        ts.appendChild(o);
    });
    ts.addEventListener('change', () => applyTheme(ts.value));
}

function buildColorRow() {
    const cr = document.getElementById('color-row');
    COLORS.forEach(c => {
        const s = document.createElement('div');
        s.className = 'swatch' + (c.hex === selColor ? ' active' : '');
        s.title = c.name;
        s.style.background = '#' + c.hex.toString(16).padStart(6, '0');
        s.addEventListener('click', () => {
            setColor(c.hex);
            cr.querySelectorAll('.swatch').forEach(x => x.classList.remove('active'));
            s.classList.add('active');
            if (selType) rebuildGhost();
        });
        cr.appendChild(s);
    });
}

function buildTabs() {
    const bar = document.getElementById('tabs');
    categories().forEach(cat => {
        const t = document.createElement('button');
        t.className = 'tab';
        t.textContent = cat;
        t.dataset.cat = cat;
        t.addEventListener('click', () => renderCategory(cat));
        bar.appendChild(t);
    });
}

function renderCategory(cat) {
    activeCat = cat;
    document.querySelectorAll('#tabs .tab').forEach(t => t.classList.toggle('active', t.dataset.cat === cat));

    const pal = document.getElementById('palette');
    pal.innerHTML = '';
    kindsInCategory(cat).forEach(kind => {
        const h = document.createElement('h2');
        h.className = 'section';
        h.textContent = kind.label.toUpperCase();
        pal.appendChild(h);

        const grid = document.createElement('div');
        grid.className = 'grid grid-cols-3 gap-1';
        kind.sizes.forEach(size => {
            const b = document.createElement('button');
            b.className = 'block-button' + (selType === kind.id && selSize === size ? ' active' : '');
            b.textContent = sizeLabel(size);
            b.dataset.type = kind.id;
            b.dataset.size = size;
            b.addEventListener('click', () => selectPiece(b));
            grid.appendChild(b);
        });
        pal.appendChild(grid);
    });
}

// "1x1@6" -> "1x1 ×2" (height in bricks); plain sizes pass through.
function sizeLabel(size) {
    const at = size.indexOf('@');
    if (at === -1) return size;
    const bricks = Number(size.slice(at + 1)) / 3;
    return size.slice(0, at) + ' ×' + (Number.isInteger(bricks) ? bricks : bricks.toFixed(1));
}

function selectPiece(btn) {
    const wasActive = btn.classList.contains('active');
    document.querySelectorAll('#palette .block-button').forEach(b => b.classList.remove('active'));
    if (wasActive) setPiece(null, null);
    else { btn.classList.add('active'); setPiece(btn.dataset.type, btn.dataset.size); }
    setRot(0); setSticky(0);
    setHovered(null);
    rebuildGhost();
    updateModePill();
}

export function deselect() {
    document.querySelectorAll('#palette .block-button').forEach(b => b.classList.remove('active'));
    setPiece(null, null);
    setHovered(null);
    rebuildGhost();
    updateModePill();
}

export function updateModePill() {
    const el = modePill();
    if (selType) {
        const extra = selType === 'axle' ? ` · ${axleVertical ? 'vertical' : 'horizontal'} · M=${axleMountMode}`
            : getKind(selType)?.driver ? ` · ${motorDir > 0 ? 'CW' : 'CCW'}` : '';
        el.textContent = `BUILD: ${selType} ${selSize}${extra}`;
        el.style.borderColor = 'var(--accent)';
        el.style.color = 'var(--accent)';
    } else {
        el.textContent = 'ERASE — click a piece to delete';
        el.style.borderColor = '#ff6b6b';
        el.style.color = '#ff9b9b';
    }
}
