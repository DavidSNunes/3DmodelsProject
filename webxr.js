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

let scene, camera, renderer, controller, model, clock, arSession, arAnchor;
let isModelInteracted = false;
let touchStartX = 0, touchStartY = 0;
let touchRotationX = 0, touchRotationY = 0;
let isTouching = false;

// Initialize the AR scene
function initAR() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
  scene.add(camera);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true; 
  document.body.appendChild(renderer.domElement);

  clock = new THREE.Clock();

  controller = renderer.xr.getController(0);
  scene.add(controller);

  loadModel();

  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  scene.add(light);

  document.body.appendChild(createARButton());

  // Add interaction listeners
  document.addEventListener('mousedown', onMouseDown, false);
  document.addEventListener('mousemove', onMouseMove, false);
  document.addEventListener('mouseup', onMouseUp, false);
  document.addEventListener('wheel', onMouseWheel, false);

  document.addEventListener('touchstart', onTouchStart, false);
  document.addEventListener('touchmove', onTouchMove, false);
  document.addEventListener('touchend', onTouchEnd, false);

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
    model.position.set(0, -0.5, -1);

    // Dynamically scale model to fit within 1 unit max dimension
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scaleFactor = 1 / maxDim;
    model.scale.set(scaleFactor, scaleFactor, scaleFactor);

    scene.add(model);

    setupModelInteraction();
  }, undefined, function (error) {
    console.error('Error loading the model:', error);
  });
}

// Render the scene
function render() {
  if (model) {
    model.rotation.x = touchRotationX;
    model.rotation.y = touchRotationY;
  }

  if (arAnchor) {
    model.position.set(arAnchor.position.x, arAnchor.position.y, arAnchor.position.z);
  }

  renderer.render(scene, camera);
}

// Create AR button
function createARButton() {
  const button = document.createElement('button');
  button.innerText = 'Start AR';
  button.style.position = 'absolute';
  button.style.bottom = '20px';
  button.style.left = '50%';
  button.style.transform = 'translateX(-50%)';
  button.style.padding = '12px 24px';
  button.style.fontSize = '16px';
  button.style.backgroundColor = '#4CAF50';
  button.style.color = '#fff';
  button.style.border = 'none';
  button.style.borderRadius = '5px';
  button.style.cursor = 'pointer';
  button.style.zIndex = '1000';

  button.addEventListener('click', () => {
    navigator.xr.requestSession('immersive-ar', { requiredFeatures: ['local-floor', 'hit-test'] })
      .then((session) => {
        arSession = session;
        renderer.xr.setSession(session);
        setupTapToPlace();
      })
      .catch(console.error);
  });

  return button;
}

// Setup tap-to-place functionality
function setupTapToPlace() {
  controller.addEventListener('select', (event) => {
    const frame = event.frame;
    const hitTestResults = frame.getHitTestResults(event.inputSource.targetRaySpace);

    if (hitTestResults.length > 0) {
      const hit = hitTestResults[0];
      const pose = hit.getPose(renderer.xr.getReferenceSpace());
      model.position.set(pose.transform.position.x, pose.transform.position.y, pose.transform.position.z);
    }
  });
}

// Mouse and Touch Interaction: Rotation and Zoom
function onMouseDown(event) {
  touchStartX = event.clientX;
  touchStartY = event.clientY;
}

function onMouseMove(event) {
  if (event.buttons === 1) { 
    touchRotationX += (event.clientY - touchStartY) * 0.01;
    touchRotationY += (event.clientX - touchStartX) * 0.01;
    touchStartX = event.clientX;
    touchStartY = event.clientY;
  }
}

function onMouseUp() {}

function onMouseWheel(event) {
  if (model) model.scale.multiplyScalar(1 + event.deltaY * -0.01);
}

// Mobile touch interaction
function onTouchStart(event) {
  if (event.touches.length === 1) {
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
  }
}

function onTouchMove(event) {
  if (event.touches.length === 1) {
    const touchEndX = event.touches[0].clientX;
    const touchEndY = event.touches[0].clientY;

    touchRotationX += (touchEndY - touchStartY) * 0.01;
    touchRotationY += (touchEndX - touchStartX) * 0.01;

    touchStartX = touchEndX;
    touchStartY = touchEndY;
  }
}

function onTouchEnd() {}

// Handle window resizing
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
