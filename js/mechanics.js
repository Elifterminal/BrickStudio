// The driveline. Each frame: work out how fast every axle turns (from drivers + meshing
// gears), then rotate each axle and everything mounted on it. Free spinning parts (not on
// an axle) keep their own idle spin. Degrades to "no motion" cleanly when nothing drives.
import { STUD } from './constants.js';
import { axles, placedBlocks } from './blocks.js';
import { animating } from './motion.js';

const MESH_TOL = 0.55 * STUD;    // gear spacing must be ~(r1+r2); forgiving for grid + mixed sizes
const ON_AXLE = 0.3 * STUD;      // how close a part must be to an axle line to count as "on" it

// Perpendicular distance & along-axis distance of a point relative to an axle (handles 'y').
function relTo(axleChar, ax, ay, az, p) {
    if (axleChar === 'x') return [Math.hypot(p.y - ay, p.z - az), Math.abs(p.x - ax)];
    if (axleChar === 'z') return [Math.hypot(p.x - ax, p.y - ay), Math.abs(p.z - az)];
    return [Math.hypot(p.x - ax, p.z - az), Math.abs(p.y - ay)];   // 'y' (vertical)
}

// Which axle a mounted part sits on (nearest axle line it lies along), or null.
function axleForPart(p) {
    let best = null, bestD = ON_AXLE;
    for (const a of axles) {
        const [perp, along] = relTo(a.axleChar, a.cx, a.cy, a.cz, p);
        if (perp < bestD && along <= a.halfLen + ON_AXLE) { bestD = perp; best = a; }
    }
    return best;
}

// Two gears mesh if their axles are parallel, coplanar along the axis, and spaced by r1+r2.
function meshes(A, B) {
    const [perp, along] = relTo(A.axle.axleChar, B.pos.x, B.pos.y, B.pos.z, A.pos);
    return Math.abs(perp - (A.r + B.r)) < MESH_TOL && along < 0.6 * STUD;
}

// Bevel gears mesh across perpendicular axles when they meet at a corner (~touching).
function bevelMeshes(A, B) {
    if (!A.bevel || !B.bevel || A.axle.axleChar === B.axle.axleChar) return false;
    const dist = Math.hypot(A.pos.x - B.pos.x, A.pos.y - B.pos.y, A.pos.z - B.pos.z);
    return dist < (A.r + B.r);
}

// Assign an angular velocity (omega) to every axle.
function computeDrive() {
    const byId = new Map(axles.map(a => [a.id, a]));
    for (const a of axles) a.omega = 0;

    // Associate each mounted mechanism part with its axle.
    const parts = [];
    for (const rec of placedBlocks) {
        if (!rec.role || !rec.spec.mount) { rec._axle = null; continue; }
        rec._axle = axleForPart(rec.group.position);
        if (rec._axle) parts.push(rec);
    }

    // Seed omega from drivers: cranks first, then idle-spin parts (props/fans/wheels).
    const omega = new Map();
    for (const rec of parts) if (rec.role === 'crank' && !omega.has(rec._axle.id)) omega.set(rec._axle.id, rec.speed);
    for (const rec of parts) if (rec.role === 'movable' && !omega.has(rec._axle.id)) omega.set(rec._axle.id, rec.group.userData.spin.speed);

    // Build the gear-mesh graph between axles.
    const gears = parts.filter(r => r.role === 'gear').map(r => ({ axle: r._axle, r: r.radius, pos: r.group.position, bevel: r.bevel }));
    const adj = new Map();
    const link = (id, other, ratio) => { if (!adj.has(id)) adj.set(id, []); adj.get(id).push({ other, ratio }); };
    for (let i = 0; i < gears.length; i++)
        for (let j = i + 1; j < gears.length; j++) {
            const A = gears[i], B = gears[j];
            if (A.axle.id === B.axle.id) continue;
            const parallel = A.axle.axleChar === B.axle.axleChar && meshes(A, B);   // spur gears
            if (!parallel && !bevelMeshes(A, B)) continue;                          // or bevel (90°)
            link(A.axle.id, B.axle.id, -A.r / B.r);   // opposite direction, inverse tooth ratio
            link(B.axle.id, A.axle.id, -B.r / A.r);
        }

    // Propagate omega out from the driven axles through the gear graph.
    const queue = [...omega.keys()];
    while (queue.length) {
        const id = queue.shift(), w = omega.get(id);
        for (const e of adj.get(id) || []) if (!omega.has(e.other)) { omega.set(e.other, w * e.ratio); queue.push(e.other); }
    }
    for (const [id, w] of omega) { const a = byId.get(id); if (a) a.omega = w; }
}

// Advance the driveline one frame and apply rotations.
export function driveStep(dt) {
    computeDrive();
    if (!animating) return;

    const byId = new Map(axles.map(a => [a.id, a]));
    for (const a of axles) a.theta = (a.theta || 0) + a.omega * dt;

    for (const rec of placedBlocks) {
        const ud = rec.group.userData;
        if (!ud.rotor) continue;
        if (rec._axle) ud.rotor.rotation[ud.rotAxis] = rec._axle.theta || 0;          // part on a driven axle
        else if (rec.spec.type === 'axle') { const a = byId.get(rec.id); if (a) ud.rotor.rotation[ud.rotAxis] = a.theta || 0; }
        else if (ud.spin) ud.rotor.rotation[ud.spin.axis] += ud.spin.speed * dt;      // free idle spin
    }
}
