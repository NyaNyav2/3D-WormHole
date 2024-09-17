import * as THREE from "three";
import { OrbitControls } from 'jsm/controls/OrbitControls.js';
import spline from "./spline.js";
import { EffectComposer } from "jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "jsm/postprocessing/UnrealBloomPass.js";

const w = window.innerWidth;
const h = window.innerHeight;
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.3);
const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
camera.position.z = 5;
const renderer = new THREE.WebGLRenderer();
renderer.setSize(w, h);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.03;

// post-processing
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), 1.5, 0.4, 100);
bloomPass.threshold = 0.002;
bloomPass.strength = 3.5;
bloomPass.radius = 0;
const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

// create a line geometry from the spline
const points = spline.getPoints(100);
const geometry = new THREE.BufferGeometry().setFromPoints(points);
const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
const line = new THREE.Line(geometry, material);
// scene.add(line);

// create a tube geometry from the spline
const tubeGeo = new THREE.TubeGeometry(spline, 400, 2.5, 40, true);

// create edges geometry from the spline
const edges = new THREE.EdgesGeometry(tubeGeo, 0.2);
const lineMat = new THREE.LineBasicMaterial({ color: 0xff0000 });
const tubeLines = new THREE.LineSegments(edges, lineMat);
scene.add(tubeLines);

const numBoxes = 55;
const size = 0.075;
const boxGeo = new THREE.BoxGeometry(size, size, size);
for (let i = 0; i < numBoxes; i += 1) {
  const boxMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    wireframe: true
  });
  const box = new THREE.Mesh(boxGeo, boxMat);
  const p = (i / numBoxes + Math.random() * 0.1) % 1;
  const pos = tubeGeo.parameters.path.getPointAt(p);
  pos.x += Math.random() - 0.4;
  pos.z += Math.random() - 0.4;
  box.position.copy(pos);
  const rote = new THREE.Vector3(
    Math.random() * Math.PI,
    Math.random() * Math.PI,
    Math.random() * Math.PI
  );
  box.rotation.set(rote.x, rote.y, rote.z);
  const edges = new THREE.EdgesGeometry(boxGeo, 0.2);
  const color = new THREE.Color().setHSL(0.7 - p, 1, 0.5);
  const lineMat = new THREE.LineBasicMaterial({ color });
  const boxLines = new THREE.LineSegments(edges, lineMat);
  boxLines.position.copy(pos);
  boxLines.rotation.set(rote.x, rote.y, rote.z);
  // scene.add(box);
  scene.add(boxLines);
}

// Create divs for displaying information
const infoDivs = [];
const infoPositions = [0.1, 0.3, 0.5, 0.7, 0.9]; // Positions along the spline

infoPositions.forEach((p, index) => {
  const div = document.createElement('div');
  div.className = 'info-div';
  div.textContent = `Info ${index + 1}`;
  div.h1 = `animeeeeeee`
  document.body.appendChild(div);
  infoDivs.push({ div, p });
});

// Set initial scroll position to a fixed point on the spline (e.g., 0.5 for middle)
let scrollPosition = 0.5;  // Start at the middle of the spline
let targetScrollPosition = 0.5;  // Initial target position is the same to avoid jumps

// Handle mouse wheel scroll
function onScroll(event) {
  targetScrollPosition -= event.deltaY * 0.0001; // Reverse direction of scroll
  targetScrollPosition = THREE.MathUtils.clamp(targetScrollPosition, 0, 1); // Clamp to [0, 1]
}

function updateCamera() {
  // Smooth transition between current and target scroll position
  scrollPosition = THREE.MathUtils.lerp(scrollPosition, targetScrollPosition, 0.1);

  const pos = tubeGeo.parameters.path.getPointAt(scrollPosition);
  const lookAt = tubeGeo.parameters.path.getPointAt((scrollPosition + 0.03) % 1);
  camera.position.copy(pos);
  camera.lookAt(lookAt);

  // Update the position of the info divs
  updateInfoDivs();
}

function animate() {
  requestAnimationFrame(animate);
  updateCamera();
  composer.render(scene, camera);
  controls.update();
}
animate();

// Listen for the scroll event
window.addEventListener('wheel', onScroll);

function handleWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', handleWindowResize, false);

function updateInfoDivs() {
  infoDivs.forEach(({ div, p }) => {
    const pos = tubeGeo.parameters.path.getPointAt(p);
    const projected = pos.clone().project(camera);

    const x = (projected.x * 0.5 + 0.5) * window.innerWidth;
    const y = (projected.y * -0.5 + 0.5) * window.innerHeight;

    div.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
    div.style.display = projected.z < 1 && projected.z > -1 ? 'block' : 'none';
  });
}


