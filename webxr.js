// Ensure model data is available and proceed with loading
window.addEventListener('DOMContentLoaded', () => {
  if (window.modelData) {
      // Log model data to make sure it's being passed correctly
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

// Set up the WebXR scene and AR session
let scene, camera, renderer, controller, model, clock;
let isModelInteracted = false;
let touchStartX = 0;
let touchStartY = 0;
let touchRotationX = 0;
let touchRotationY = 0;

// Initialize the AR scene
function initAR() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
  scene.add(camera);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;  // Enable WebXR
  document.body.appendChild(renderer.domElement);

  // Clock for animation and movement
  clock = new THREE.Clock();

  // AR Controller
  controller = renderer.xr.getController(0);
  scene.add(controller);

  // Load the model
  loadModel();

  // Add a light source
  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  scene.add(light);

  // Add AR Button
  document.body.appendChild(createARButton());

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
  const modelUrl = window.modelData ? window.modelData.file : 'default.glb'; // Ensure we're using the model URL from modelData
  console.log(`Loading model from URL: ${modelUrl}`);

  // Update model URL to use the Cloudflare Pages link
  const cloudflareBaseURL = 'https://3dmodelsproject.pages.dev/models/';
  const fullModelURL = cloudflareBaseURL + modelUrl;

  const loader = new THREE.GLTFLoader();

  loader.load(fullModelURL, (gltf) => {
      model = gltf.scene;
      model.position.set(0, -0.5, -1); // Adjust model position
      scene.add(model);

      // Set up the model for interaction
      setupModelInteraction();

  }, undefined, function (error) {
      console.error('Error loading the model:', error);
  });
}

// Render the scene
function render() {
  // Update model rotation manually or automatically (based on user interaction)
  if (model) {
    model.rotation.x = touchRotationX; // Set x-axis rotation
    model.rotation.y = touchRotationY; // Set y-axis rotation
  }

  renderer.render(scene, camera);
}

// Create an AR button
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

  // Set up AR session when clicked
  button.addEventListener('click', () => {
      navigator.xr.requestSession('immersive-ar', { requiredFeatures: ['local-floor', 'hit-test'] })
          .then((session) => {
              renderer.xr.setSession(session);
          })
          .catch(console.error);
  });

  return button;
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

function onMouseUp(event) {
  // Do nothing, but you can use this for other interactions if necessary
}

function onMouseWheel(event) {
  // Zoom in and out
  if (model) {
    model.scale.set(
      model.scale.x + event.deltaY * 0.01,
      model.scale.y + event.deltaY * 0.01,
      model.scale.z + event.deltaY * 0.01
    );
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

function onTouchEnd(event) {
  // Do nothing for now, can be used for other actions
}

// Handle window resizing
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
