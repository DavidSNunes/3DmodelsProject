// WebXR AR integration for ARCore and ARKit
window.addEventListener('DOMContentLoaded', () => {
  if (window.modelData) {
      console.log('Model data loaded:', window.modelData);

      document.getElementById('product-name').innerText = window.modelData.name || 'Loading...';
      document.getElementById('product-desc').innerText = window.modelData.desc || 'Please wait while we load your model.';
      document.getElementById('product-link').href = window.modelData.link || '#';
      document.getElementById('product-link').innerText = 'View Product';

      initializeAR(); // Start AR
  } else {
      console.error('No model data found');
  }
});

let scene, camera, renderer, model;

// AR initialization
function initializeAR() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;

  document.getElementById('model-container').appendChild(renderer.domElement);

  // Add light sources
  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 2);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0x404040));

  // Load 3D model
  loadModel();

  // Set up AR button
  document.getElementById('ar-button').addEventListener('click', () => startARSession());
}

// Load GLTF model
function loadModel() {
  const modelUrl = window.modelData?.file || 'default.glb';
  const loader = new THREE.GLTFLoader();

  loader.load(`https://3dmodelsproject.pages.dev/models/${modelUrl}`, (gltf) => {
      model = gltf.scene;
      model.position.set(0, -0.5, -1);
      model.scale.set(0.05, 0.05, 0.05);

      scene.add(model);
  }, undefined, (error) => console.error('Error loading model:', error));
}

// Start AR session
function startARSession() {
  if (navigator.xr) {
      navigator.xr.requestSession('immersive-ar', { requiredFeatures: ['local-floor', 'hit-test'] })
          .then((session) => {
              renderer.xr.setSession(session);
              renderer.setAnimationLoop(renderAR);
          })
          .catch((error) => console.error('Failed to start AR session:', error));
  } else {
      alert("WebXR not supported on this device.");
  }
}

// AR render loop
function renderAR() {
  if (model) {
      model.rotation.y += 0.01;
  }

  renderer.render(scene, camera);
}

// Handle errors and compatibility checks
navigator.xr?.isSessionSupported('immersive-ar').then((supported) => {
  if (!supported) {
      document.getElementById('ar-button').style.display = 'none';
      console.warn('AR not supported on this device.');
  }
});
