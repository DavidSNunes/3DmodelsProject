// Ensure model data is available and proceed with loading
window.addEventListener('DOMContentLoaded', () => {
  if (window.modelData) {
    console.log('Model data passed to WebXR:', window.modelData);

    // Update UI elements with model info
    document.getElementById('product-name').innerText = window.modelData.name || 'Loading...';
    document.getElementById('product-desc').innerText = window.modelData.desc || 'Please wait while we load your model.';
    document.getElementById('product-link').href = window.modelData.link || '#';

    initAR(); // Initialize AR after ensuring model data is ready
  } else {
    console.log('No model data found');
  }
});

let scene, camera, renderer, controller, model, arSession;
let isTouching = false;
let touchStartX = 0, touchStartY = 0;
let touchRotationX = 0, touchRotationY = 0;

// Initialize the AR scene
function initAR() {
  // Set up the scene
  scene = new THREE.Scene();

  // Set up the camera
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
  scene.add(camera);

  // Set up the renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true; // Enable WebXR
  document.body.appendChild(renderer.domElement);

  // Add lighting
  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 2);
  scene.add(light);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
  directionalLight.position.set(1, 1, 1).normalize();
  scene.add(directionalLight);

  const ambientLight = new THREE.AmbientLight(0x808080); // Soft white light
  scene.add(ambientLight);

  // Load the model
  loadModel();

  // Set up AR button
  const arButton = document.getElementById('ar-button');
  arButton.addEventListener('click', startARSession);

  // Handle window resizing
  window.addEventListener('resize', onWindowResize);

  // Start the render loop
  renderer.setAnimationLoop(render);
}

// Load the 3D model
function loadModel() {
  const modelUrl = window.modelData ? window.modelData.file : 'default.glb';
  console.log(`Loading model from URL: ${modelUrl}`);

  const cloudflareBaseURL = 'https://3dmodelsproject.pages.dev/models/';
  const fullModelURL = cloudflareBaseURL + modelUrl;

  const loader = new THREE.GLTFLoader();
  loader.load(fullModelURL, (gltf) => {
    model = gltf.scene;
    model.position.set(0, -0.5, -1); // Adjust model position
    model.scale.set(0.05, 0.05, 0.05); // Scale the model
    scene.add(model);

    // Enable interaction
    setupModelInteraction();
  }, undefined, (error) => {
    console.error('Error loading the model:', error);
  });
}

// Start AR session
function startARSession() {
  navigator.xr.requestSession('immersive-ar', { requiredFeatures: ['local-floor', 'hit-test'] })
    .then((session) => {
      arSession = session;
      renderer.xr.setSession(session);
      setupTapToPlace();
      setupARRotation();
    })
    .catch(console.error);
}

// Set up tap-to-place functionality
function setupTapToPlace() {
  controller = renderer.xr.getController(0);
  controller.addEventListener('select', (event) => {
    const frame = event.frame;
    const hitTestResults = frame.getHitTestResults(event.inputSource.targetRaySpace);

    if (hitTestResults.length > 0) {
      const hit = hitTestResults[0];
      const pose = hit.getPose(renderer.xr.getReferenceSpace());
      model.position.set(pose.transform.position.x, pose.transform.position.y, pose.transform.position.z);
    }
  });
  scene.add(controller);
}

// Set up AR rotation
function setupARRotation() {
  document.addEventListener('touchstart', onTouchStartAR, false);
  document.addEventListener('touchmove', onTouchMoveAR, false);
  document.addEventListener('touchend', onTouchEndAR, false);
}

// Touch event handlers for AR rotation
function onTouchStartAR(event) {
  if (event.touches.length === 1) {
    isTouching = true;
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
  }
}

function onTouchMoveAR(event) {
  if (event.touches.length === 1 && isTouching) {
    const touchEndX = event.touches[0].clientX;
    const touchEndY = event.touches[0].clientY;

    touchRotationX += (touchEndY - touchStartY) * 0.01;
    touchRotationY += (touchEndX - touchStartX) * 0.01;

    touchStartX = touchEndX;
    touchStartY = touchEndY;
  }
}

function onTouchEndAR(event) {
  isTouching = false;
}

// Render the scene
function render() {
  if (model) {
    model.rotation.x = touchRotationX;
    model.rotation.y = touchRotationY;
  }
  renderer.render(scene, camera);
}

// Handle window resizing
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}