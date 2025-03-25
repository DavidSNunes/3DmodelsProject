// Ensure model data is available and proceed with loading
window.addEventListener('DOMContentLoaded', () => {
  if (window.modelData) {
      console.log('Model data passed to WebXR:', window.modelData);

      // Update UI elements with model info
      document.getElementById('product-name').innerText = window.modelData.name || '3D Model';
      document.getElementById('product-desc').innerText = window.modelData.desc || 'Interactive 3D preview';
      document.getElementById('product-link').href = window.modelData.link || '#';
      document.getElementById('product-link').innerText = 'View Product';

      initAR(); // Initialize AR after ensuring model data is ready
  } else {
      console.error('No model data found');
      document.getElementById('product-desc').innerText = 'Error: Model data missing';
  }
});

let scene, camera, renderer, controller, model, reticle;
let isTouching = false;
let touchStartX = 0, touchStartY = 0;
let touchRotationX = 0, touchRotationY = 0;
let currentScale = 1;

// Initialize the AR scene
function initAR() {
  // Scene setup
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
  scene.add(camera);

  // Renderer with WebXR support
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  document.getElementById('model-container').appendChild(renderer.domElement);

  // Lighting (improved)
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
  directionalLight.position.set(1, 1, 1).normalize();
  scene.add(directionalLight);

  // Controller
  controller = renderer.xr.getController(0);
  scene.add(controller);

  // Load model
  loadModel();

  // AR Button event
  document.getElementById('ar-button').addEventListener('click', startAR);

  // Interaction handlers
  setupInteraction();

  // Window resize
  window.addEventListener('resize', onWindowResize);

  // Start render loop
  renderer.setAnimationLoop(render);
}

// Improved model loading
function loadModel() {
  const modelUrl = window.modelData?.file || 'default.glb';
  const loader = new THREE.GLTFLoader();
  const fullUrl = `https://3dmodelsproject.pages.dev/models/${modelUrl}`;

  loader.load(
      fullUrl,
      (gltf) => {
          model = gltf.scene;
          
          // Center and scale model
          const bbox = new THREE.Box3().setFromObject(model);
          bbox.getCenter(model.position);
          model.position.multiplyScalar(-1);
          
          const size = bbox.getSize(new THREE.Vector3()).length();
          const scale = (0.5 / size) * 0.5;
          currentScale = scale;
          model.scale.set(scale, scale, scale);

          // Apply environment lighting
          const pmremGenerator = new THREE.PMREMGenerator(renderer);
          const envMap = pmremGenerator.fromScene(new THREE.Scene()).texture;
          model.traverse((child) => {
              if (child.isMesh) {
                  child.material.envMap = envMap;
                  child.material.needsUpdate = true;
              }
          });

          scene.add(model);
          document.getElementById('loading-progress').style.width = '100%';
      },
      (xhr) => {
          const percent = (xhr.loaded / xhr.total) * 100;
          document.getElementById('loading-progress').style.width = `${percent}%`;
      },
      (error) => {
          console.error('Model loading error:', error);
          document.getElementById('product-desc').innerText = 'Failed to load model';
      }
  );
}

// AR Session Start
async function startAR() {
  try {
      if (!navigator.xr) throw new Error('WebXR not supported');
      
      const session = await navigator.xr.requestSession('immersive-ar', {
          requiredFeatures: ['hit-test', 'dom-overlay'],
          domOverlay: { root: document.body }
      });

      renderer.xr.setSession(session);
      
      // AR reticle for placement
      reticle = new THREE.Mesh(
          new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
          new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      reticle.visible = false;
      scene.add(reticle);

      // Hit test source
      const referenceSpace = await session.requestReferenceSpace('local');
      const hitTestSource = await session.requestHitTestSource({ space: referenceSpace });

      controller.addEventListener('select', () => {
          if (reticle.visible && model) {
              model.position.copy(reticle.position);
          }
      });

      renderer.setAnimationLoop(() => {
          if (session && hitTestSource && model) {
              const frame = renderer.xr.getFrame();
              const hitTestResults = frame.getHitTestResults(hitTestSource);
              
              if (hitTestResults.length > 0) {
                  const pose = hitTestResults[0].getPose(referenceSpace);
                  reticle.visible = true;
                  reticle.position.setFromMatrixPosition(pose.transform.matrix);
              } else {
                  reticle.visible = false;
              }
          }
      });
  } catch (error) {
      console.error('AR Error:', error);
      alert(`AR failed: ${error.message}`);
  }
}

// Interaction setup
function setupInteraction() {
  // Mouse/touch events
  document.addEventListener('mousedown', onPointerStart);
  document.addEventListener('mousemove', onPointerMove);
  document.addEventListener('mouseup', onPointerEnd);
  document.addEventListener('wheel', onMouseWheel);
  document.addEventListener('touchstart', onPointerStart);
  document.addEventListener('touchmove', onPointerMove);
  document.addEventListener('touchend', onPointerEnd);
}

// Event handlers
function onPointerStart(event) {
  isTouching = true;
  touchStartX = event.clientX || event.touches[0].clientX;
  touchStartY = event.clientY || event.touches[0].clientY;
}

function onPointerMove(event) {
  if (!isTouching || !model) return;
  
  const clientX = event.clientX || event.touches[0].clientX;
  const clientY = event.clientY || event.touches[0].clientY;
  
  touchRotationY += (clientX - touchStartX) * 0.01;
  touchRotationX += (clientY - touchStartY) * 0.01;
  
  touchStartX = clientX;
  touchStartY = clientY;
}

function onPointerEnd() {
  isTouching = false;
}

function onMouseWheel(event) {
  if (!model) return;
  event.preventDefault();
  currentScale *= 1 + event.deltaY * -0.001;
  currentScale = Math.max(0.1, Math.min(currentScale, 2.0));
  model.scale.set(currentScale, currentScale, currentScale);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Render loop
function render() {
  if (model) {
      model.rotation.x = touchRotationX;
      model.rotation.y = touchRotationY;
  }
  renderer.render(scene, camera);
}