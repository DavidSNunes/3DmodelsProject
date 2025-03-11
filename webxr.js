import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.130.1/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.130.1/examples/jsm/loaders/GLTFLoader.js';

let scene, camera, renderer, model;
let controller, controllerGrip;
let clock = new THREE.Clock();
let loader = new GLTFLoader();

function init() {
  // Create a basic WebXR scene setup with three.js

  // Scene and Camera
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;

  // Renderer setup
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // WebXR session setup
  navigator.xr.requestSession("immersive-ar").then(onSessionStarted);

  // Light setup
  const light = new THREE.AmbientLight(0xffffff, 1);
  scene.add(light);

  // Animation loop
  animate();
}

// Handle the WebXR session
function onSessionStarted(session) {
  session.addEventListener('end', onSessionEnded);
  // Here, you can use WebXR API to handle the immersive AR view
  // This is a placeholder for the WebXR session logic, like setting up controllers or features
}

// Handle when the WebXR session ends
function onSessionEnded() {
  console.log("WebXR session ended");
}

// Load the GLB model into the WebXR environment
function loadModelIntoWebXR(modelUrl) {
  loader.load(
    modelUrl, 
    function (gltf) {
      model = gltf.scene;
      model.scale.set(1, 1, 1);  // Scale the model if needed
      scene.add(model);
    },
    undefined, // onProgress callback (optional)
    function (error) {  // onError callback
      console.error("Error loading model:", error);
    }
  );
}

// Main render loop for WebXR environment
function animate() {
  requestAnimationFrame(animate);
  if (model) {
    model.rotation.y += 0.01; // Rotate the model slowly for demo purposes
  }
  renderer.render(scene, camera);
}

// Call init when the page is ready
window.addEventListener('load', () => {
  const modelData = window.modelData; // Fetch model data from the page
  const modelUrl = 'https://3dmodelsproject.pages.dev/models/' + modelData.file;

  // Call the function to load the model into WebXR
  if (modelUrl) {
    loadModelIntoWebXR(modelUrl);
  } else {
    console.error("No valid model URL found.");
  }

  // Continue the initialization after loading the model
  init();
});
