import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.130.1/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.130.1/examples/jsm/loaders/GLTFLoader.js';

let scene, camera, renderer, model;
let loader = new GLTFLoader();

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const light = new THREE.AmbientLight(0xffffff, 1);
  scene.add(light);

  animate();
}

// Load 3D model
function loadModelIntoWebXR(modelUrl) {
  loader.load(modelUrl, (gltf) => {
    model = gltf.scene;
    scene.add(model);
  }, undefined, (error) => console.error("Error loading model:", error));
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  if (model) model.rotation.y += 0.01;
  renderer.render(scene, camera);
}

window.addEventListener('load', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const modelData = JSON.parse(decodeURIComponent(urlParams.get("model")));
  loadModelIntoWebXR(`https://3dmodelsproject.pages.dev/models/${modelData.file}`);
  init();
});
