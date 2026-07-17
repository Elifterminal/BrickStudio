// Part registry core. Parts register themselves (see parts/) and the UI reads them back.
const kinds = new Map();

export function registerKind(def) { kinds.set(def.id, def); }
export function getKind(id) { return kinds.get(id); }
export function allKinds() { return [...kinds.values()]; }

// Distinct categories, in first-registration order (drives the tab bar).
export function categories() {
    const seen = [];
    for (const k of kinds.values()) if (!seen.includes(k.category)) seen.push(k.category);
    return seen;
}
export function kindsInCategory(cat) { return allKinds().filter(k => k.category === cat); }

// Sizes are "WxD" (studs). Optional "@N" suffix overrides height in plates, e.g. "1x1@6".
export function footprint(size) { return size.split('@')[0].split('x').map(Number); }
export function heightPlatesOf(kindId, size) {
    const at = size.indexOf('@');
    if (at !== -1) return Number(size.slice(at + 1));
    return getKind(kindId).heightPlates;
}
