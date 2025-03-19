window.addEventListener('DOMContentLoaded', () => {
  if (window.modelData) {
      console.log('Model data passed to WebXR:', window.modelData);

      document.getElementById('product-name').innerText = window.modelData.name || 'Loading...';
      document.getElementById('product-desc').innerText = window.modelData.desc || 'Please wait while we load your model.';
      document.getElementById('product-link').href = window.modelData.link || '#';
      document.getElementById('product-link').innerText = 'View Product';

      initAR();
  } else {
      console.error('No model data found');
  }
});

// Variables
let scene, camera, renderer, controller, model, clock, arSession;
let touchStartX = 0, touchStartY = 0;
let rotationX = 0, rotationY = 0;

// Initialize WebXR scene
function initAR() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
  scene.add(camera);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true; // Enable WebXR
  document.body.appendChild(renderer.domElement);

  // Lights
  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 2);
  scene.add(light);
  scene.add(new THREE.DirectionalLight(0xffffff, 2));

  // Load model
  loadModel();

  // Start AR Button setup
  setupARButton();

  // Handle touch and drag rotation
  setupInteractions();

  renderer.setAnimationLoop(render);
}

// Load the model
function loadModel() {
  const modelUrl = window.modelData?.file || 'default.glb';
  const fullModelURL = `https://3dmodelsproject.pages.dev/models/${modelUrl}`;

  console.log(`Loading model from: ${fullModelURL}`);

  const loader = new THREE.GLTFLoader();
  loader.load(
      fullModelURL,
      (gltf) => {
          model = gltf.scene;
          model.position.set(0, -0.5, -1);
          model.scale.set(0.05, 0.05, 0.05);

          scene.add(model);
      },
      undefined,
      (error) => console.error('Error loading model:', error)
  );
}

// Render loop
function render() {
  if (model) {
      model.rotation.x = rotationX;
      model.rotation.y = rotationY;
  }
  renderer.render(scene, camera);
}

// Setup AR button
function setupARButton() {
  const button = document.getElementById('ar-button');

  button.addEventListener('click', () => {
      navigator.xr.requestSession('immersive-ar', { requiredFeatures: ['local-floor', 'hit-test'] })
          .then((session) => {
              arSession = session;
              renderer.xr.setSession(session);
          })
          .catch((err) => console.error('Failed to start AR session:', err));
  });
}

// Setup interactions for rotation
function setupInteractions() {
  document.addEventListener('mousedown', (e) => {
      touchStartX = e.clientX;
      touchStartY = e.clientY;
  });

  document.addEventListener('mousemove', (e) => {
      if (e.buttons === 1 && model) {
          const deltaX = e.clientX - touchStartX;
          const deltaY = e.clientY - touchStartY;

          rotationY += deltaX * 0.01;
          rotationX += deltaY * 0.01;

          touchStartX = e.clientX;
          touchStartY = e.clientY;
      }
  });

  document.addEventListener('wheel', (e) => {
      if (model) model.scale.multiplyScalar(1 + e.deltaY * -0.01);
  });
}
