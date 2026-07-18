// All geometry builders. Each takes (fw, fd in studs; h in world units) and returns a
// BufferGeometry centered on the origin, spanning ±fw*STUD/2, ±h/2, ±fd*STUD/2.
import * as THREE from 'three';
import { STUD } from './constants.js';

export function boxGeometry(fw, fd, h) {
    return new THREE.BoxGeometry(fw * STUD, h, fd * STUD);
}

export function cylinderGeometry(fw, fd, h) {
    const r = Math.min(fw, fd) * STUD / 2;
    return new THREE.CylinderGeometry(r, r, h, 24);
}

// Fluted shaft: a cylinder whose radius ripples around the circumference (classical grooves).
export function flutedGeometry(fw, fd, h) {
    const R = Math.min(fw, fd) * STUD / 2;
    const flutes = 12, per = 6, N = flutes * per;
    const depth = R * 0.14;
    const top = h / 2, bot = -h / 2;
    const ang = i => (i / N) * Math.PI * 2;
    const rad = th => R - depth * (0.5 + 0.5 * Math.cos(flutes * th));
    const pt = (i, y) => { const th = ang(i), r = rad(th); return [Math.cos(th) * r, y, Math.sin(th) * r]; };

    const tris = [];
    for (let i = 0; i < N; i++) {
        const j = (i + 1) % N;
        const bi = pt(i, bot), bj = pt(j, bot), ti = pt(i, top), tj = pt(j, top);
        tris.push(bi, bj, tj, bi, tj, ti);          // wall
        tris.push([0, top, 0], ti, tj);             // top cap
        tris.push([0, bot, 0], bj, bi);             // bottom cap
    }
    return fromTris(tris);
}

// Straight 45° wedge: high along -Z, low along +Z.
export function slopeGeometry(fw, fd, h) {
    const w = fw * STUD / 2, d = fd * STUD / 2, y = h / 2;
    const A = [-w,-y,-d], B = [-w,-y,d], C = [-w,y,-d], D = [w,-y,-d], E = [w,-y,d], F = [w,y,-d];
    return fromTris([A,B,E, A,E,D,  A,D,F, A,F,C,  B,E,F, B,F,C,  A,C,B,  D,E,F]);
}

// Inverted slope: flat studded top, slope on the underside.
export function invSlopeGeometry(fw, fd, h) {
    const w = fw * STUD / 2, d = fd * STUD / 2, y = h / 2;
    const a1 = [-w,y,-d], a2 = [-w,y,d], a3 = [-w,-y,-d];
    const b1 = [ w,y,-d], b2 = [ w,y,d], b3 = [ w,-y,-d];
    return fromTris([
        a1,a2,b2, a1,b2,b1, a1,b1,b3, a1,b3,a3,
        a3,b3,b2, a3,b2,a2, a1,a3,a2, b1,b2,b3,
    ]);
}

// Corner slope: high at back-left, sloping down to front-right.
export function cornerSlopeGeometry(fw, fd, h) {
    const a = Math.min(fw, fd) * STUD / 2, y = h / 2;
    const T1 = [-a,y,-a], T2 = [a,0,-a], T3 = [a,-y,a], T4 = [-a,0,a];
    const B1 = [-a,-y,-a], B2 = [a,-y,-a], B3 = [a,-y,a], B4 = [-a,-y,a];
    return fromTris([
        B1,B3,B2, B1,B4,B3, T1,T2,T3, T1,T3,T4,
        B1,B2,T2, B1,T2,T1, B1,T1,T4, B1,T4,B4, B2,B3,T2, B4,B3,T4,
    ]);
}

// Arch: rectangle with a curved opening cut from the bottom, extruded across the depth.
// style: 'round' (elliptical), 'pointed' (gothic), 'segmental' (shallow), 'parabolic'.
export function archGeometry(fw, fd, h, style = 'round') {
    const L = fw * STUD, D = fd * STUD, H = h;
    const innerX = Math.max(L / 2 - STUD, L * 0.14);
    const footTopY = -H / 2 + H * 0.22;
    const topY = H / 2 - H * 0.12;

    const s = new THREE.Shape();
    s.moveTo(-L / 2, H / 2);
    s.lineTo( L / 2, H / 2);
    s.lineTo( L / 2, -H / 2);
    s.lineTo( innerX, -H / 2);
    s.lineTo( innerX, footTopY);
    if (style === 'round') {
        s.absellipse(0, footTopY, innerX, topY - footTopY, 0, Math.PI, false);
    } else if (style === 'pointed') {
        const apex = topY + H * 0.06;
        s.quadraticCurveTo(innerX * 0.45, apex, 0, apex);
        s.quadraticCurveTo(-innerX * 0.45, apex, -innerX, footTopY);
    } else if (style === 'segmental') {
        const rise = footTopY + (topY - footTopY) * 0.55;
        s.quadraticCurveTo(0, 2 * rise - footTopY, -innerX, footTopY);
    } else { // parabolic
        s.quadraticCurveTo(0, 2 * topY - footTopY, -innerX, footTopY);
    }
    s.lineTo(-innerX, -H / 2);
    s.lineTo(-L / 2, -H / 2);
    s.closePath();

    const g = new THREE.ExtrudeGeometry(s, { depth: D, bevelEnabled: false });
    g.translate(0, 0, -D / 2);
    return g;
}

// Surface of revolution from a [radius, y] profile — for classical bases & capitals.
export function lathe(profile, seg = 20) {
    return new THREE.LatheGeometry(profile.map(p => new THREE.Vector2(p[0], p[1])), seg);
}

// Attic-style column base (plinth + torus + scotia).
export function baseGeometry(fw, fd, h) {
    const R = Math.min(fw, fd) * STUD / 2, y0 = -h / 2, y1 = h / 2;
    return lathe([
        [0, y0], [R*1.28, y0], [R*1.28, y0+h*0.22], [R*1.05, y0+h*0.42],
        [R*0.85, y0+h*0.6], [R*1.02, y0+h*0.82], [R*0.9, y1], [0, y1],
    ]);
}

// Column capital by classical order.
export function capitalGeometry(fw, fd, h, order = 'doric') {
    const R = Math.min(fw, fd) * STUD / 2, y0 = -h / 2, y1 = h / 2;
    const profiles = {
        tuscan: [[0,y0],[R*0.95,y0],[R*1.16,y0+h*0.5],[R*1.24,y1-h*0.1],[R*1.24,y1],[0,y1]],
        doric:  [[0,y0],[R*0.92,y0],[R*0.97,y0+h*0.15],[R*1.18,y0+h*0.55],[R*1.27,y0+h*0.8],[R*1.3,y1-h*0.02],[R*1.3,y1],[0,y1]],
        ionic:  [[0,y0],[R*0.92,y0],[R*0.99,y0+h*0.15],[R*1.36,y0+h*0.6],[R*1.42,y1-h*0.12],[R*1.42,y1],[0,y1]],
        corinthian: [[0,y0],[R*0.85,y0],[R*0.82,y0+h*0.15],[R*0.96,y0+h*0.45],[R*1.2,y0+h*0.75],[R*1.46,y1-h*0.05],[R*1.46,y1],[0,y1]],
    };
    return lathe(profiles[order] || profiles.doric);
}

// ---- Windows: a thin frame (extruded across depth) with a shaped opening ----
// style: 'plain', 'cross' (4 panes), 'arched' (round top), 'round' (porthole).
export function windowGeometry(fw, fd, h, style = 'plain') {
    const L = fw * STUD, H = h, D = fd * STUD, fr = STUD * 0.32;
    const shape = new THREE.Shape();
    shape.moveTo(-L/2, -H/2); shape.lineTo(L/2, -H/2); shape.lineTo(L/2, H/2); shape.lineTo(-L/2, H/2); shape.closePath();

    const ix = L/2 - fr, iy = H/2 - fr;
    if (style === 'round') {
        const r = Math.min(ix, iy);
        const p = new THREE.Path(); p.absarc(0, 0, r, 0, Math.PI * 2, true); shape.holes.push(p);
    } else if (style === 'arched') {
        const p = new THREE.Path();
        p.moveTo(ix, -iy); p.lineTo(-ix, -iy); p.lineTo(-ix, 0);
        p.absellipse(0, 0, ix, iy, Math.PI, 0, true); p.closePath();
        shape.holes.push(p);
    } else if (style === 'cross') {
        const m = fr * 0.6;
        shape.holes.push(rectPath(-ix, -iy, -m, -m), rectPath(m, -iy, ix, -m),
                         rectPath(-ix, m, -m, iy), rectPath(m, m, ix, iy));
    } else {
        shape.holes.push(rectPath(-ix, -iy, ix, iy));
    }
    const g = new THREE.ExtrudeGeometry(shape, { depth: D, bevelEnabled: false });
    g.translate(0, 0, -D / 2);
    return g;
}

// ---- Movable parts (spun by the animation loop) ----
export function wheelGeometry(fw, fd, h) {          // spins about X (rolls)
    const R = Math.min(fw, fd) * STUD * 0.6, W = Math.min(fw, fd) * STUD * 0.55;
    const g = new THREE.CylinderGeometry(R, R, W, 24);
    g.rotateZ(Math.PI / 2);
    return g;
}

export function propellerGeometry(fw, fd, h) {       // spins about Z (faces forward)
    const R = Math.max(fw, fd) * STUD * 0.42, N = 4, geoms = [];
    const hub = new THREE.CylinderGeometry(STUD * 0.26, STUD * 0.26, STUD * 0.7, 14);
    hub.rotateX(Math.PI / 2); geoms.push(hub);
    for (let i = 0; i < N; i++) {
        const b = new THREE.BoxGeometry(R * 1.4, STUD * 0.36, STUD * 0.16);
        b.translate(R * 0.7, 0, 0); b.rotateZ(i * 2 * Math.PI / N); geoms.push(b);
    }
    return mergeGeoms(geoms);
}

export function fanGeometry(fw, fd, h) {              // spins about Z (mounts on an axle)
    const R = Math.max(fw, fd) * STUD * 0.42, N = 6, geoms = [];
    const hub = new THREE.CylinderGeometry(STUD * 0.24, STUD * 0.24, STUD * 0.6, 14);
    hub.rotateX(Math.PI / 2); geoms.push(hub);
    for (let i = 0; i < N; i++) {
        const b = new THREE.BoxGeometry(R * 1.3, STUD * 0.5, STUD * 0.12);
        b.translate(R * 0.65, 0, 0); b.rotateZ(i * 2 * Math.PI / N); geoms.push(b);
    }
    return mergeGeoms(geoms);
}

// Convex curved slope: top edge is a quarter curve from back-top to front-bottom.
export function curvedSlopeGeometry(fw, fd, h) {
    const w = fw * STUD / 2, d = fd * STUD / 2, y = h / 2, N = 8;
    const pts = [];
    for (let i = 0; i <= N; i++) { const a = (i / N) * Math.PI / 2; pts.push([-d + 2 * d * Math.sin(a), -y + 2 * y * Math.cos(a)]); }
    const tris = [];
    for (let i = 0; i < N; i++) {
        const [z0, y0] = pts[i], [z1, y1] = pts[i + 1];
        tris.push([-w,y0,z0],[w,y0,z0],[w,y1,z1],  [-w,y0,z0],[w,y1,z1],[-w,y1,z1]);   // top surface
        tris.push([-w,-y,-d],[-w,y1,z1],[-w,y0,z0]);   // left cap
        tris.push([ w,-y,-d],[ w,y0,z0],[ w,y1,z1]);   // right cap
    }
    tris.push([-w,-y,-d],[w,-y,-d],[w,-y,d],  [-w,-y,-d],[w,-y,d],[-w,-y,d]);           // bottom
    tris.push([-w,-y,-d],[-w,y,-d],[w,y,-d],  [-w,-y,-d],[w,y,-d],[w,-y,-d]);           // back wall
    return fromTris(tris);
}

// Doorway frame: opening reaches the floor (no bottom bar).
export function doorFrameGeometry(fw, fd, h) {
    const L = fw * STUD, H = h, D = fd * STUD, fr = STUD * 0.34;
    const s = new THREE.Shape();
    s.moveTo(-L/2,-H/2); s.lineTo(L/2,-H/2); s.lineTo(L/2,H/2); s.lineTo(-L/2,H/2); s.closePath();
    const ix = L/2 - fr, top = H/2 - fr;
    const p = new THREE.Path();
    p.moveTo(-ix, -H/2); p.lineTo(-ix, top); p.lineTo(ix, top); p.lineTo(ix, -H/2); p.closePath();
    s.holes.push(p);
    const g = new THREE.ExtrudeGeometry(s, { depth: D, bevelEnabled: false });
    g.translate(0, 0, -D / 2);
    return g;
}

// Door leaf: a thin panel with a small window near the top.
export function doorLeafGeometry(fw, fd, h) {
    const L = fw * STUD * 0.88, H = h * 0.94, D = fd * STUD * 0.28;
    const s = new THREE.Shape();
    s.moveTo(-L/2,-H/2); s.lineTo(L/2,-H/2); s.lineTo(L/2,H/2); s.lineTo(-L/2,H/2); s.closePath();
    const wx = L * 0.26, wy = H * 0.14, cy = H * 0.3;
    s.holes.push(rectPath(-wx, cy - wy, wx, cy + wy));
    const g = new THREE.ExtrudeGeometry(s, { depth: D, bevelEnabled: false });
    g.translate(0, 0, -D / 2);
    return g;
}

// ---- Technic connectors ----
export function axleGeometry(fw, fd, h) {             // + cross-section rod along X
    const L = Math.max(fw, fd) * STUD, t = STUD * 0.16;
    return mergeGeoms([
        new THREE.BoxGeometry(L, t * 2.6, t),
        new THREE.BoxGeometry(L, t, t * 2.6),
    ]);
}

export function pinGeometry(fw, fd, h) {              // short connector pin along X
    const r = STUD * 0.2;
    const g = new THREE.CylinderGeometry(r, r, Math.max(fw, fd) * STUD * 0.9, 12);
    g.rotateZ(Math.PI / 2);
    return g;
}

// ---- Mechanics: gear (disc + teeth) and crank (driver handle). Axis along X. ----
// Pitch radius = size-in-studs, teeth = size*8 -> gears mesh at integer stud spacing,
// and the tooth ratio equals the size ratio (clean 2:1, 3:1, ...).
export function gearGeometry(fw, fd, h) {
    const size = Math.max(fw, fd), R = size * STUD, teeth = size * 8, thick = STUD * 0.6;
    const geoms = [];
    const disc = new THREE.CylinderGeometry(R * 0.86, R * 0.86, thick, 28);
    disc.rotateZ(Math.PI / 2); geoms.push(disc);
    const toothW = (2 * Math.PI * R / teeth) * 0.55;
    for (let i = 0; i < teeth; i++) {
        const t = new THREE.BoxGeometry(thick * 0.85, STUD * 0.28, toothW);
        t.translate(0, R, 0); t.rotateX(i * 2 * Math.PI / teeth); geoms.push(t);
    }
    return mergeGeoms(geoms);
}

export function crankGeometry(fw, fd, h) {
    const geoms = [];
    const hub = new THREE.CylinderGeometry(STUD * 0.22, STUD * 0.22, STUD * 0.5, 12); hub.rotateZ(Math.PI / 2); geoms.push(hub);
    const arm = new THREE.BoxGeometry(STUD * 0.2, STUD * 0.95, STUD * 0.2); arm.translate(0, STUD * 0.48, 0); geoms.push(arm);
    const knob = new THREE.CylinderGeometry(STUD * 0.16, STUD * 0.16, STUD * 0.44, 10); knob.translate(0, STUD * 0.95, 0); knob.rotateZ(Math.PI / 2); geoms.push(knob);
    return mergeGeoms(geoms);
}

function rectPath(x0, y0, x1, y1) {                   // clockwise (hole winding)
    const p = new THREE.Path();
    p.moveTo(x0, y0); p.lineTo(x0, y1); p.lineTo(x1, y1); p.lineTo(x1, y0); p.closePath();
    return p;
}

// Merge geometries into one (bake their transforms). Avoids an external util dependency.
function mergeGeoms(geoms) {
    const arrays = geoms.map(g => (g.index ? g.toNonIndexed() : g).getAttribute('position').array);
    const total = arrays.reduce((s, a) => s + a.length, 0);
    const pos = new Float32Array(total);
    let o = 0;
    for (const a of arrays) { pos.set(a, o); o += a.length; }
    const merged = new THREE.BufferGeometry();
    merged.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    merged.computeVertexNormals();
    return merged;
}

function fromTris(verts) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts.flat(), 3));
    g.computeVertexNormals();
    return g;
}
