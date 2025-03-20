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
let touchStartX = 0;
let touchStartY = 0;
let touchRotationX = 0;
let touchRotationY = 0;
let isTouching = false; // Track if the user is currently touching the screen

// Initialize the AR scene
function initAR() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
  scene.add(camera);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true; // Enable WebXR
  document.getElementById('model-container').appendChild(renderer.domElement);

  // Clock for animation and movement
  clock = new THREE.Clock();

  // AR Controller
  controller = renderer.xr.getController(0);
  scene.add(controller);

  // Load the model
  loadModel();

  // Add a light source
  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 2);
  scene.add(light);

  // Add additional lighting
  const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
  directionalLight.position.set(1, 1, 1).normalize();
  scene.add(directionalLight);

  const ambientLight = new THREE.AmbientLight(0x808080); // Soft white light
  scene.add(ambientLight);

  // Set up AR session when the AR button is clicked
  document.getElementById('ar-button').addEventListener('click', () => {
    navigator.xr.requestSession('immersive-ar', { requiredFeatures: ['local-floor', 'hit-test'] })
      .then((session) => {
        arSession = session;
        renderer.xr.setSession(session);
        setupTapToPlace();
        setupARRotation(); // Enable rotation in AR mode
      })
      .catch(console.error);
  });

  // Handle touch/mouse interaction for rotation and zoom
  document.addEventListener('mousedown', onMouseDown, false);
  document.addEventListener('mousemove', onMouseMove, false);
  document.addEventListener('mouseup', onMouseUp, false);
  document.addEventListener('wheel', onMouseWheel, false);

  // Handle touch events for mobile
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
    model.position.set(0, -0.5, -1); // Adjust model position

    // Scale the model to a consistent size
    const scaleFactor = 0.05; // Adjust this value to control the size of the model
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

  // Update AR anchor position
  if (arAnchor) {
    model.position.set(arAnchor.position.x, arAnchor.position.y, arAnchor.position.z);
  }

  renderer.render(scene, camera);
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

// Enable rotation in AR mode
function setupARRotation() {
  const onTouchMoveAR = (event) => {
    if (event.touches.length === 1 && isTouching) {
      const touchEndX = event.touches[0].clientX;
      const touchEndY = event.touches[0].clientY;

      // Calculate rotation based on touch movement
      touchRotationX += (touchEndY - touchStartY) * 0.01;
      touchRotationY += (touchEndX - touchStartX) * 0.01;

      // Update touch start positions for the next move event
      touchStartX = touchEndX;
      touchStartY = touchEndY;
    }
  };

  const onTouchStartAR = (event) => {
    if (event.touches.length === 1) {
      isTouching = true;
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
    }
  };

  const onTouchEndAR = (event) => {
    isTouching = false;
  };

  // Add touch event listeners for AR rotation
  document.addEventListener('touchstart', onTouchStartAR, false);
  document.addEventListener('touchmove', onTouchMoveAR, false);
  document.addEventListener('touchend', onTouchEndAR, false);
}

// Mouse and Touch Interaction: Rotation and Zoom (for desktop)
function onMouseDown(event) {
  touchStartX = event.clientX;
  touchStartY = event.clientY;
}

function onMouseMove(event) {
  if (event.buttons === 1) { // Left click or touch dragging
    touchRotationX += (event.clientY - touchStartY) * 0.01;
    touchRotationY += (event.clientX - touchStartX) * 0.01;
    touchStartX = event.clientX;
    touchStartY = event.clientY;
  }
}

function onMouseUp(event) {}

function onMouseWheel(event) {
  if (model) {
    model.scale.multiplyScalar(1 + event.deltaY * -0.01);
  }
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

function onTouchEnd(event) {}

// Handle window resizing
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});