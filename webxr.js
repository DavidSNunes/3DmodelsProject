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
let isModelPlaced = false; // Track if the model has been placed in the environment

// Initialize the AR scene
function initAR() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
  scene.add(camera);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true; // Enable WebXR
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
    model.visible = false; // Hide the model until it's placed in the environment

    // Scale the model to a consistent size
    const scaleFactor = 0.05; // Adjust this value to control the size of the model
    model.scale.set(scaleFactor, scaleFactor, scaleFactor);

    scene.add(model);
  }, undefined, function (error) {
    console.error('Error loading the model:', error);
  });
}

// Render the scene
function render() {
  if (arAnchor) {
    model.position.set(arAnchor.position.x, arAnchor.position.y, arAnchor.position.z);
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
        arSession = session;
        renderer.xr.setSession(session);
        setupHitTesting(); // Enable hit testing for surface detection
      })
      .catch(console.error);
  });

  return button;
}

// Enable hit testing for surface detection
function setupHitTesting() {
  const referenceSpace = renderer.xr.getReferenceSpace();
  const hitTestSource = arSession.requestHitTestSource({ space: referenceSpace });

  controller.addEventListener('select', (event) => {
    if (!isModelPlaced) {
      const frame = event.frame;
      const hitTestResults = frame.getHitTestResults(hitTestSource);

      if (hitTestResults.length > 0) {
        const hit = hitTestResults[0];
        const pose = hit.getPose(referenceSpace);

        // Place the model at the hit position
        model.position.set(pose.transform.position.x, pose.transform.position.y, pose.transform.position.z);
        model.visible = true; // Make the model visible
        isModelPlaced = true; // Mark the model as placed
      }
    }
  });
}