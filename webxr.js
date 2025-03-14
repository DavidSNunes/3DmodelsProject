// Step 1: Show model data (this part was working, so we keep it intact)
function displayModelData(modelData) {
  console.log('Model data passed to WebXR:', modelData);
  const modelInfo = document.getElementById('model-info');
  if (modelInfo) {
      modelInfo.innerHTML = `
          <h3>${modelData.name}</h3>
          <p>${modelData.desc}</p>
          <a href="${modelData.link}" target="_blank">Buy Now</a>
      `;
  }
}

// Step 2: Fix Model URL Loading
function loadModel(modelUrl) {
  const loader = new THREE.GLTFLoader();
  const modelPath = `https://3dmodelsproject.pages.dev/models/${modelUrl}`; // Fixed model URL path
  console.log(`Loading model from URL: ${modelPath}`);
  loader.load(modelPath, (gltf) => {
      scene.add(gltf.scene); // Add model to the scene
  }, undefined, (error) => {
      console.error('Error loading model:', error);
  });
}

// Step 3: Create AR Button for WebXR Session
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
              requiredFeatures: ['local-floor'],
              optionalFeatures: ['hit-test'] // Optional feature for additional interactions
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

// Step 4: Initialize WebXR and the scene
const button = createARButton();
document.body.appendChild(button);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Initialize AR environment with the simplest configuration
function animate() {
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

// Load model once you have the correct model data
const modelData = {
  name: "TV Hisense 55A6N",
  desc: "Perfeita para quem gosta do Discovery Channel",
  file: "tv-hisense.glb",
  link: "https://www.worten.pt/produtos/tv-hisense-55a6n-led-55-140-cm-4k-ultra-hd-smart-tv-8022846"
};

// Show model data
displayModelData(modelData);

// Step 5: Load the model when AR session is triggered
loadModel(modelData.file); // Pass the model filename to load the model correctly
