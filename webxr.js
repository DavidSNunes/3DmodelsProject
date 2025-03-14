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
let isModelPlaced = false;

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
  controller.addEventListener('select', onSelect); // Tap to place model

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
      model.visible = false; // Start hidden until placed
      scene.add(model);
  }, undefined, function (error) {
      console.error('Error loading the model:', error);
  });
}

// Render the scene
function render() {
  if (model && isModelPlaced) {
    // Allow rotation
    model.rotation.y += 0.005;
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
          })
          .catch(console.error);
  });

  return button;
}

// Handle tap to place the model
function onSelect() {
  if (model && !isModelPlaced) {
    const hitTestSource = renderer.xr.getHitTestSource();
    if (hitTestSource) {
      const hitTestResults = hitTestSource.getHitTestResults();
      if (hitTestResults.length > 0) {
        const hitPose = hitTestResults[0].getPose(renderer.xr.getReferenceSpace());
        model.position.set(hitPose.transform.position.x, hitPose.transform.position.y, hitPose.transform.position.z);
        model.visible = true;
        isModelPlaced = true;
      }
    }
  }
}

// Handle window resizing
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Pinch-to-zoom functionality
let initialDistance = null;

window.addEventListener('touchmove', (event) => {
  if (isModelPlaced && event.touches.length === 2) {
    const dx = event.touches[0].pageX - event.touches[1].pageX;
    const dy = event.touches[0].pageY - event.touches[1].pageY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (!initialDistance) initialDistance = distance;

    const scaleFactor = distance / initialDistance;
    model.scale.set(scaleFactor, scaleFactor, scaleFactor);
  }
});

window.addEventListener('touchend', () => {
  initialDistance = null;
});
