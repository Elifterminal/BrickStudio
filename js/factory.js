// Builds a Three.js group for any registered kind. Used for both real pieces and ghosts.
import * as THREE from 'three';
import { STUD, PLATE, STUD_H, STUD_R } from './constants.js';
import { getKind, footprint, heightPlatesOf } from './registry.js';
import { current as theme, registerEdgeMat } from './themes.js';

// The color a piece should use: picked color for colorable kinds, else the kind's fixed color.
export function bodyColor(kindId, pickedColor) {
    const k = getKind(kindId);
    return k.colorable ? pickedColor : k.color;
}

export function makeGroup(kindId, size, colorHex, opts = {}) {
    const k = getKind(kindId);
    const [fw, fd] = footprint(size);
    const hP = heightPlatesOf(kindId, size), h = hP * PLATE;
    const ghostMode = !!opts.ghost;

    const g = new THREE.Group();
    const geo = k.geometry(fw, fd, h);
    const emissiveBase = k.emissive || 0x000000;
    const ghostMats = { bodies: [] };

    const bodyMat = new THREE.MeshStandardMaterial({
        color: colorHex, emissive: emissiveBase,
        roughness: 0.5, metalness: 0.12,
        transparent: ghostMode, opacity: ghostMode ? 0.55 : 1,
        side: kindId === 'slope' ? THREE.DoubleSide : THREE.FrontSide,
    });
    ghostMats.bodies.push(bodyMat);
    const body = new THREE.Mesh(geo, bodyMat);
    body.castShadow = !ghostMode; body.receiveShadow = !ghostMode;
    body.userData.root = g;
    g.add(body);

    const edgeMat = new THREE.LineBasicMaterial({ color: theme.edge, transparent: true, opacity: ghostMode ? 0.9 : theme.edgeOp });
    g.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat));
    if (ghostMode) ghostMats.edge = edgeMat; else registerEdgeMat(edgeMat);

    if (k.studs) {
        const sGeo = new THREE.CylinderGeometry(STUD_R, STUD_R, STUD_H, 12);
        const sMat = new THREE.MeshStandardMaterial({
            color: colorHex, emissive: emissiveBase,
            roughness: 0.5, metalness: 0.15,
            transparent: ghostMode, opacity: ghostMode ? 0.55 : 1,
        });
        ghostMats.bodies.push(sMat);
        for (let i = 0; i < fw; i++)
            for (let j = 0; j < fd; j++) {
                const s = new THREE.Mesh(sGeo, sMat);
                s.position.set((i - (fw - 1) / 2) * STUD, h / 2 + STUD_H / 2, (j - (fd - 1) / 2) * STUD);
                s.castShadow = !ghostMode; s.userData.root = g;
                g.add(s);
            }
    }

    if (k.glow && !ghostMode) {
        const bulb = new THREE.PointLight(0xffef99, 0.9, 6);
        bulb.position.y = h / 2;
        g.add(bulb);
    }
    if (k.water && !ghostMode) {
        const inner = new THREE.Mesh(
            new THREE.BoxGeometry(fw * STUD * 0.7, h * 0.7, fd * STUD * 0.7),
            new THREE.MeshStandardMaterial({ color: 0x0066ff, emissive: 0x00224a, transparent: true, opacity: 0.7, roughness: 0.2, metalness: 0.7 })
        );
        g.userData.waterInner = inner;
        g.add(inner);
    }

    g.userData = Object.assign(g.userData || {}, { type: kindId, size, fw, fd, hP, h });
    if (ghostMode) g.userData.ghostMats = ghostMats;
    return g;
}

export function disposeGroup(g) {
    g.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose());
    });
}
