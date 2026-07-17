// Builds the sidebar: theme, colors, category tabs, and the palette for the active tab.
import { allKinds, categories, kindsInCategory } from './registry.js';
import { COLORS } from './colors.js';
import { THEMES } from './themes.js';
import { setPiece, setColor, setRot, setSticky, selType, selSize, selColor } from './selection.js';
import { rebuildGhost } from './ghost.js';
import { setHovered, clearAll } from './blocks.js';
import { applyTheme } from './scene.js';

const modePill = () => document.getElementById('mode-pill');
let activeCat = null;

export function buildUI() {
    buildThemeSelect();
    buildColorRow();
    buildTabs();
    renderCategory(categories()[0]);
    document.getElementById('clear-all').addEventListener('click', clearAll);
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
        el.textContent = `BUILD: ${selType} ${selSize}`;
        el.style.borderColor = 'var(--accent)';
        el.style.color = 'var(--accent)';
    } else {
        el.textContent = 'ERASE — click a piece to delete';
        el.style.borderColor = '#ff6b6b';
        el.style.color = '#ff9b9b';
    }
}
