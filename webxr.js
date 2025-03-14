let scene, camera, renderer, controller, model, controls;

function initAR() {
  scene = new THREE.Scene();
  
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
  scene.add(camera);
  
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);
  
  controller = renderer.xr.getController(0);
  scene.add(controller);

  // Load the model
  loadModel();
  
  // Add a light source
  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  scene.add(light);

  // Add AR Button
  document.body.appendChild(createARButton());

  // Initialize controls (to move/rotate model)
  initControls();

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
    scene.add(model);
  }, undefined, function (error) {
    console.error('Error loading the model:', error);
  });
}

// Initialize model controls (for web interactions)
function initControls() {
  if (isMobile()) {
    addTouchControls(model); // Add touch-based control on mobile
  } else {
    controls = new THREE.OrbitControls(camera, renderer.domElement); // Add OrbitControls for PC
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = true;
    controls.enablePan = true;
  }
}

// Add touch controls for mobile devices
function addTouchControls(model) {
  let isTouching = false;
  let lastTouchX = 0;
  let lastTouchY = 0;

  renderer.domElement.addEventListener('touchstart', (event) => {
    isTouching = true;
    lastTouchX = event.touches[0].clientX;
    lastTouchY = event.touches[0].clientY;
  });

  renderer.domElement.addEventListener('touchmove', (event) => {
    if (isTouching) {
      const deltaX = event.touches[0].clientX - lastTouchX;
      const deltaY = event.touches[0].clientY - lastTouchY;

      model.rotation.y += deltaX * 0.01;
      model.rotation.x += deltaY * 0.01;

      lastTouchX = event.touches[0].clientX;
      lastTouchY = event.touches[0].clientY;
    }
  });

  renderer.domElement.addEventListener('touchend', () => {
    isTouching = false;
  });
}

// Detect if the device is mobile
function isMobile() {
  return /Mobi|Android/i.test(navigator.userAgent);
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

  button.addEventListener('click', () => {
    navigator.xr.requestSession('immersive-ar', { requiredFeatures: ['local-floor', 'hit-test'] })
      .then((session) => {
        renderer.xr.setSession(session);
      })
      .catch(console.error);
  });

  return button;
}

// Render the scene
function render() {
  if (controls) controls.update(); // Update the controls (if available)
  renderer.render(scene, camera);
}

// Handle window resizing
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
