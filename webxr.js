// Initialize WebXR polyfill for ARCore/ARKit support
const polyfill = new WebXRPolyfill();

// Ensure model data is available and proceed with loading
window.addEventListener('DOMContentLoaded', () => {
  if (window.modelData) {
    console.log('Model data passed to WebXR:', window.modelData);

    // Update UI elements with model info
    document.getElementById('product-name').innerText = window.modelData.name || 'Loading...';
    document.getElementById('product-desc').innerText = window.modelData.desc || 'Please wait while we load your model.';
    document.getElementById('product-link').href = window.modelData.link || '#';
    document.getElementById('product-link').innerText = 'View Product';

    initAR();
  } else {
    console.log('No model data found');
  }
});

let scene, camera, renderer, controller, model, clock, arSession, arAnchor;
let isModelInteracted = false;
let touchStartX = 0, touchStartY = 0, touchRotationX = 0, touchRotationY = 0, isTouching = false;

// Check for AR support
function checkARSupport() {
  return navigator.xr && navigator.xr.isSessionSupported('immersive-ar');
}

// Initialize the AR scene
function initAR() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
  scene.add(camera);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  document.getElementById('model-container').appendChild(renderer.domElement);

  // Clock for animation
  clock = new THREE.Clock();

  // AR Controller
  controller = renderer.xr.getController(0);
  scene.add(controller);

  // Load the model
  loadModel();

  // Lighting
  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 2);
  scene.add(light);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
  directionalLight.position.set(1, 1, 1).normalize();
  scene.add(directionalLight);
  scene.add(new THREE.AmbientLight(0x808080));

  // Set up AR button
  document.getElementById('ar-button').addEventListener('click', () => {
    checkARSupport().then((supported) => {
      if (supported) {
        startAR();
      } else {
        showError("AR not supported on this device");
      }
    }).catch((err) => {
      showError("AR not supported: " + err.message);
    });
  });

  // Interaction handlers
  document.addEventListener('mousedown', onMouseDown, false);
  document.addEventListener('mousemove', onMouseMove, false);
  document.addEventListener('mouseup', onMouseUp, false);
  document.addEventListener('wheel', onMouseWheel, false);
  document.addEventListener('touchstart', onTouchStart, false);
  document.addEventListener('touchmove', onTouchMove, false);
  document.addEventListener('touchend', onTouchEnd, false);

  renderer.setAnimationLoop(render);
}

// Start AR session with ARCore/ARKit
function startAR() {
  const sessionInit = { 
    requiredFeatures: ['hit-test', 'dom-overlay'],
    domOverlay: { root: document.body }
  };

  navigator.xr.requestSession('immersive-ar', sessionInit)
    .then((session) => {
      arSession = session;
      renderer.xr.setSession(session);
      showPrompt("Move your device to start AR experience");
      
      session.addEventListener('end', () => {
        hidePrompt();
        renderer.xr.setSession(null);
        arSession = null;
      });

      setupHitTest();
      setupARRotation();
    })
    .catch((err) => {
      showError("Failed to start AR session: " + err.message);
    });
}

// Setup hit test for ARCore/ARKit
function setupHitTest() {
  let hitTestSource = null;
  let hitTestSourceRequested = false;

  arSession.requestReferenceSpace('viewer').then((referenceSpace) => {
    arSession.requestHitTestSource({ space: referenceSpace }).then((source) => {
      hitTestSource = source;
    });
  });

  arSession.addEventListener('select', (event) => {
    if (hitTestSource) {
      const hitTestResults = event.frame.getHitTestResults(hitTestSource);
      if (hitTestResults.length > 0) {
        const pose = hitTestResults[0].getPose(renderer.xr.getReferenceSpace());
        model.position.setFromMatrixPosition(pose.transform.matrix);
        hidePrompt();
      }
    }
  });
}

// Load the 3D model with adjustments for AR
function loadModel() {
  const modelUrl = window.modelData ? window.modelData.file : 'default.glb';
  const cloudflareBaseURL = 'https://3dmodelsproject.pages.dev/models/';
  const fullModelURL = cloudflareBaseURL + modelUrl;

  const loader = new THREE.GLTFLoader();
  loader.load(fullModelURL, (gltf) => {
    model = gltf.scene;
    model.position.set(0, -1, -2); // Adjusted for better AR placement
    model.scale.set(0.03, 0.03, 0.03);
    scene.add(model);
  }, undefined, (error) => {
    console.error('Error loading model:', error);
  });
}

// Show AR prompt
function showPrompt(message) {
  const prompt = document.getElementById('ar-prompt');
  prompt.innerText = message;
  prompt.style.display = 'block';
}

// Hide AR prompt
function hidePrompt() {
  document.getElementById('ar-prompt').style.display = 'none';
}

// Show error message
function showError(message) {
  const error = document.getElementById('ar-error');
  error.innerText = message;
  error.style.display = 'block';
  setTimeout(() => error.style.display = 'none', 5000);
}

// Render loop
function render() {
  if (model) {
    model.rotation.x = touchRotationX;
    model.rotation.y = touchRotationY;
  }
  renderer.render(scene, camera);
}

// Interaction handlers (keep your existing ones)
function onMouseDown(event) { /* ... */ }
function onMouseMove(event) { /* ... */ }
function onMouseUp(event) { /* ... */ }
function onMouseWheel(event) { /* ... */ }
function onTouchStart(event) { /* ... */ }
function onTouchMove(event) { /* ... */ }
function onTouchEnd(event) { /* ... */ }

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});