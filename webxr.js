// Global variables
let scene, camera, renderer, controller, model, reticle;
let xrSession = null, hitTestSource = null, xrReferenceSpace = null;
let isARSession = false;
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

// Initialize when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    if (window.modelData) {
        updateUI();
        showModelViewer(); // Always show model viewer by default
        checkARSupport(); // Check AR support for mobile devices
    } else {
        showError('Error: Model data missing');
    }
});

function updateUI() {
    document.getElementById('product-name').textContent = window.modelData.name;
    document.getElementById('product-desc').textContent = window.modelData.desc;
    document.getElementById('product-link').href = window.modelData.link;
    document.getElementById('product-link').textContent = 'View Product Details';
}

// AR Support Check - Only for mobile devices
async function checkARSupport() {
    const arButton = document.getElementById('ar-button');
    const arMessage = document.getElementById('ar-support-message');
    
    // Only show AR button on mobile
    if (!isMobile) {
        arButton.style.display = 'none';
        arMessage.style.display = 'none';
        return false;
    }

    if (!navigator.xr) {
        arButton.style.display = 'none';
        arMessage.textContent = 'AR not supported in this browser';
        return false;
    }

    try {
        const supported = await navigator.xr.isSessionSupported('immersive-ar');
        if (supported) {
            arMessage.textContent = 'Tap to view in AR';
            arButton.style.display = 'block';
        } else {
            arButton.style.display = 'none';
            arMessage.textContent = 'AR not available on this device';
        }
        return supported;
    } catch (error) {
        console.error('AR support check failed:', error);
        arButton.style.display = 'none';
        arMessage.textContent = 'Could not check AR support';
        return false;
    }
}

// Model Viewer implementation (always shown)
function showModelViewer() {
    document.getElementById('model-container').style.display = 'none';
    const modelViewer = document.getElementById('model-viewer');
    
    // Use USDZ for iOS, GLB for others
    const modelFile = /iPhone|iPad|iPod/i.test(navigator.userAgent) && window.modelData.usdz ? 
        `https://3dmodelsproject.pages.dev/models/${window.modelData.usdz}` :
        `https://3dmodelsproject.pages.dev/models/${window.modelData.glb}`;
    
    modelViewer.src = modelFile;
    modelViewer.alt = window.modelData.name;
    document.getElementById('model-viewer-container').style.display = 'block';
}

// Start AR experience
async function startAR() {
    try {
        // First try WebXR
        if (await checkARSupport()) {
            await startWebXR();
            return;
        }
        
        // Fallback to quick look/scene viewer
        showQuickLookAR();
        
    } catch (error) {
        console.error('AR failed:', error);
        showQuickLookAR();
    }
}

// WebXR implementation
async function startWebXR() {
    try {
        const sessionInit = { 
            optionalFeatures: ['dom-overlay'],
            domOverlay: { root: document.body }
        };

        xrSession = await navigator.xr.requestSession('immersive-ar', sessionInit);
        xrSession.addEventListener('end', onXRSessionEnded);
        
        // Try viewer reference space first (works on iOS)
        try {
            xrReferenceSpace = await xrSession.requestReferenceSpace('viewer');
        } catch (error) {
            console.log('Viewer space failed, trying local');
            xrReferenceSpace = await xrSession.requestReferenceSpace('local');
        }

        // Initialize Three.js AR scene
        initScene();
        await renderer.xr.setSession(xrSession);
        initARFeatures();
        
        document.getElementById('model-viewer-container').style.display = 'none';
        document.getElementById('model-container').style.display = 'block';
        document.getElementById('exit-ar-button').style.display = 'block';
        document.getElementById('ar-tooltip').style.display = 'block';
        isARSession = true;

    } catch (error) {
        console.error('WebXR Error:', error);
        throw error;
    }
}

// Quick Look/Scene Viewer fallback
function showQuickLookAR() {
    const modelViewer = document.getElementById('model-viewer');
    modelViewer.activateAR();
}

// Initialize the scene (only for WebXR)
function initScene() {
    // Scene setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 3);
    scene.add(camera);

    // Renderer with WebXR support
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    document.getElementById('model-container').appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    // Load model
    loadModel();

    // Start render loop
    renderer.setAnimationLoop(render);
}

// Load 3D model (for WebXR)
function loadModel() {
    const loader = new THREE.GLTFLoader();
    const modelUrl = `https://3dmodelsproject.pages.dev/models/${window.modelData.glb}`;

    loader.load(modelUrl, (gltf) => {
        model = gltf.scene;
        
        // Optimal scaling calculation
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const scale = 1.5 / Math.max(size.x, size.y, size.z);
        
        model.scale.set(scale, scale, scale);
        model.position.set(0, 0, 0);
        scene.add(model);
    }, 
    (error) => {
        console.error('Model loading error:', error);
        showError('Failed to load AR model');
    });
}

// Initialize AR features
function initARFeatures() {
    // AR Reticle for placement
    reticle = new THREE.Mesh(
        new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    // Controller setup
    controller = renderer.xr.getController(0);
    controller.addEventListener('selectstart', onSelectStart);
    controller.addEventListener('selectend', onSelectEnd);
    scene.add(controller);
}

// Handle XR session end
function onXRSessionEnded() {
    document.getElementById('model-viewer-container').style.display = 'block';
    document.getElementById('model-container').style.display = 'none';
    document.getElementById('exit-ar-button').style.display = 'none';
    document.getElementById('ar-tooltip').style.display = 'none';
    
    if (reticle) scene.remove(reticle);
    if (controller) scene.remove(controller);
    
    xrSession = null;
    xrReferenceSpace = null;
    isARSession = false;
}

// Event handlers
function onSelectStart() {
    if (reticle.visible && model) {
        model.position.copy(reticle.position);
        model.quaternion.copy(reticle.quaternion);
    }
}

function onSelectEnd() {
    // Handle selection end if needed
}

function setupEventListeners() {
    document.getElementById('ar-button').addEventListener('click', startAR);
    document.getElementById('exit-ar-button').addEventListener('click', endAR);
    
    window.addEventListener('resize', () => {
        if (camera) {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
        }
        if (renderer) {
            renderer.setSize(window.innerWidth, window.innerHeight);
        }
    });
}

function endAR() {
    if (xrSession) {
        xrSession.end();
    }
}

function showError(message) {
    document.getElementById('product-desc').textContent = message;
    document.getElementById('ar-support-message').textContent = message;
}

// Render loop
function render() {
    if (!isARSession && model) {
        // Small auto-rotation when not in AR
        model.rotation.y += 0.005;
    }
    renderer.render(scene, camera);
}