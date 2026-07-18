// Entry point: wire the modules together and run the render loop.
import './parts/index.js';                       // side-effect: registers the default parts
import { initScene, applyTheme, scene, camera, renderer, controls } from './scene.js';
import { initGhost } from './ghost.js';
import { buildUI, updateModePill } from './ui.js';
import { setupEvents } from './input.js';
import { placedBlocks } from './blocks.js';
import { loadBuild } from './persistence.js';
import { driveStep } from './mechanics.js';

const canvas = document.getElementById('brick-canvas');
const container = document.getElementById('canvas-container');

initScene(canvas, container);
initGhost();
buildUI();
applyTheme('Tron');
setupEvents();
updateModePill();
loadBuild();            // restore the previous build, if any

let t = 0, last = performance.now();
function animate() {
    requestAnimationFrame(animate);
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.1);   // clamp big gaps (tab was hidden)
    last = now;
    t += dt;

    driveStep(dt);
    for (const b of placedBlocks) {
        const w = b.group.userData.waterInner;
        if (w) { w.rotation.y += 0.02; w.scale.setScalar(0.9 + Math.sin(t * 2) * 0.06); }
    }
    controls.update();
    renderer.render(scene, camera);
}
animate();
