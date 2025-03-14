// Global variables for the AR session and model
let scene, camera, renderer, controller, model, clock, arSession, arAnchor, hitTestSource, hitTestSourceRequested = false;

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

  // Load the model
  loadModel();

  // Add a light source
  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  scene.add(light);

  // Add AR Button
  document.body.appendChild(createARButton());

  renderer.setAnimationLoop(render);
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

              // Create an anchor for the model in the AR world
              createARAnchor();

              // Start hit-test source creation
              startHitTest();
          })
          .catch(console.error);
  });

  return button;
}

// Set up an anchor for the AR model (so it can be manipulated)
function createARAnchor() {
  // Create an anchor for placing the model in AR
  arAnchor = new THREE.Group();
  scene.add(arAnchor);

  // Position the model in AR space initially
  model.position.set(0, -0.5, -1); // Adjust model's initial position
  arAnchor.add(model);
}

// Start the hit-test process
function startHitTest() {
  const session = arSession;
  const viewerSpace = session.requestReferenceSpace('viewer');
  
  // Create a hit-test source
  session.requestHitTestSource({ space: viewerSpace })
    .then(source => {
      hitTestSource = source;
      hitTestSourceRequested = true;
    })
    .catch((error) => {
      console.error("Error starting hit-test:", error);
    });
}

// Update the AR scene based on hit-test results
function updateARPosition() {
  if (!hitTestSourceRequested || !hitTestSource) return;

  const session = arSession;
  const viewerSpace = session.requestReferenceSpace('viewer');

  session.requestHitTest({ space: viewerSpace, frame: renderer.xr.getFrame() })
    .then(results => {
      if (results.length > 0) {
        const hit = results[0]; // Get the first hit-test result
        const hitPosition = hit.getPose(viewerSpace).position;

        // Update model position
        model.position.set(hitPosition.x, hitPosition.y, hitPosition.z);
      }
    })
    .catch((error) => {
      console.error("Error performing hit-test:", error);
    });
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
      scene.add(model);

      setupModelInteraction();
  }, undefined, function (error) {
      console.error('Error loading the model:', error);
  });
}

// Render the scene and handle updates
function render() {
  // Perform hit-test to update model position
  updateARPosition();

  // Render the AR scene
  renderer.render(scene, camera);
}

// Handle window resizing
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
