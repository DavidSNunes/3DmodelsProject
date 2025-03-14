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
let scene, camera, renderer, controller, model, clock, raycaster;
let isModelInteracted = false;

// Initialize the AR scene
function initAR() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
  scene.add(camera);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;  // Enable WebXR
  document.body.appendChild(renderer.domElement);

  // AR Controller
  controller = renderer.xr.getController(0);
  scene.add(controller);

  // Clock for animation and movement
  clock = new THREE.Clock();

  // Raycaster for controlling model movement and interaction
  raycaster = new THREE.Raycaster();

  // Load the model
  loadModel();

  // Add a light source
  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  scene.add(light);

  // Add AR Button
  document.body.appendChild(createARButton());

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
  // Rotate the model for free interaction (basic movement behavior)
  if (model) {
    model.rotation.y += 0.01; // Auto rotate (optional, remove if you want to handle manually)
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

// Setup model interaction for rotation, scaling, and movement
function setupModelInteraction() {
  // Add logic to interact with the model via raycasting
  controller.addEventListener('selectstart', onSelectStart);
  controller.addEventListener('selectend', onSelectEnd);
}

// Select start (touch or controller press down)
function onSelectStart(event) {
  const controller = event.target;
  const controllerRay = new THREE.Raycaster();

  // Set up ray direction and intersection with model
  controllerRay.ray.origin.copy(controller.position);
  controllerRay.ray.direction.copy(controller.rotation);

  // Hit-test logic for selecting and moving the model
  const intersections = getIntersections(controllerRay);

  if (intersections.length > 0) {
    isModelInteracted = true; // Start interaction with the model
    const intersection = intersections[0];
    model.position.copy(intersection.point);
  }
}

// Select end (touch or controller release)
function onSelectEnd() {
  isModelInteracted = false; // Stop interaction when released
}

// Get intersections (detect where the controller's ray intersects objects in the scene)
function getIntersections(ray) {
  const intersects = [];
  const objects = [model]; // Add any other interactable objects here

  // Check intersection with model
  for (let i = 0; i < objects.length; i++) {
    const object = objects[i];
    const intersectsObject = ray.intersectObject(object);

    if (intersectsObject.length > 0) {
      intersects.push(intersectsObject[0]);
    }
  }

  return intersects;
}

// Handle window resizing
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
