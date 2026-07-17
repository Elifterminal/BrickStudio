// Entry point: wire the modules together and run the render loop.
import './parts/index.js';                       // side-effect: registers the default parts
import { initScene, applyTheme, scene, camera, renderer, controls } from './scene.js';
import { initGhost } from './ghost.js';
import { buildUI, updateModePill } from './ui.js';
import { setupEvents } from './input.js';
import { placedBlocks } from './blocks.js';

const canvas = document.getElementById('lego-canvas');
const container = document.getElementById('canvas-container');

initScene(canvas, container);
initGhost();
buildUI();
applyTheme('Tron');
setupEvents();
updateModePill();

let t = 0;
function animate() {
    requestAnimationFrame(animate);
    t += 0.016;
    for (const b of placedBlocks) {
        const w = b.group.userData.waterInner;
        if (w) { w.rotation.y += 0.02; w.scale.setScalar(0.9 + Math.sin(t * 2) * 0.06); }
    }
    controls.update();
    renderer.render(scene, camera);
}
animate();
