// Create AR button and handle the session configuration
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
      if (navigator.xr) {
          navigator.xr.requestSession('immersive-ar', {
              requiredFeatures: ['local-floor']
          })
          .then((session) => {
              renderer.xr.setSession(session);
              document.body.appendChild(button); // Add the button to the page after AR is initialized
          })
          .catch((error) => {
              console.error('AR session request failed:', error);
          });
      } else {
          console.error('WebXR is not supported on this device.');
      }
  });

  return button;
}

// Initialize the AR button and renderer
const button = createARButton();
document.body.appendChild(button);

// Model loader (simplified)
function loadModel(modelUrl) {
  const loader = new THREE.GLTFLoader();
  loader.load(modelUrl, (gltf) => {
      scene.add(gltf.scene); // Add model to the scene
  }, undefined, (error) => {
      console.error('Error loading model:', error);
  });
}

// Initialize basic WebXR setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Set up the AR environment
function animate() {
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
