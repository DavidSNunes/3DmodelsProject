// Global variables
let scene, camera, renderer, model, controls;
let xrSession = null, hitTestSource = null, xrReferenceSpace = null;
let isARSession = false;

// Initialize when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    if (window.modelData) {
        updateUI();
        initScene();
        checkARSupport();
    } else {
        document.getElementById('product-desc').textContent = 'Error: Model data missing';
    }
});

function updateUI() {
    document.getElementById('product-name').textContent = window.modelData.name || '3D Model';
    document.getElementById('product-desc').textContent = window.modelData.desc || 'Interactive 3D preview';
    document.getElementById('product-link').href = window.modelData.link || '#';
    document.getElementById('product-link').textContent = 'View Product Details';
}

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
    document.getElementById('model-container').appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    // Load model
    loadModel();

    // Event listeners
    setupEventListeners();

    // Start render loop
    renderer.setAnimationLoop(render);
}

function loadModel() {
    const loader = new THREE.GLTFLoader();
    const modelUrl = `https://3dmodelsproject.pages.dev/models/${window.modelData.file}`;
    
    loader.load(modelUrl, (gltf) => {
        model = gltf.scene;
        
        // Optimal scaling calculation
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const scale = 1.5 / Math.max(size.x, size.y, size.z);
        
        model.scale.set(scale, scale, scale);
        model.position.set(0, 0, 0);
        scene.add(model);
        
        // Update loading progress
        document.getElementById('loading-progress').style.width = '100%';
    }, 
    (xhr) => {
        // Loading progress
        const percent = (xhr.loaded / xhr.total) * 100;
        document.getElementById('loading-progress').style.width = `${percent}%`;
    }, 
    (error) => {
        console.error('Model loading error:', error);
        document.getElementById('product-desc').textContent = 'Failed to load model';
    });
}

// AR Support Check - Modified from working reference code
async function checkARSupport() {
    const arButton = document.getElementById('ar-button');
    const arMessage = document.getElementById('ar-support-message');
    
    if (!navigator.xr) {
        arButton.style.display = 'none';
        arMessage.textContent = 'WebXR not supported in this browser';
        return;
    }

    try {
        const supported = await navigator.xr.isSessionSupported('immersive-ar');
        if (!supported) {
            arButton.style.display = 'none';
            arMessage.textContent = 'AR not available on this device';
        } else {
            arMessage.textContent = 'AR supported - Tap to start';
        }
    } catch (error) {
        console.error('AR check failed:', error);
        arButton.style.display = 'none';
        arMessage.textContent = 'AR check failed';
    }
}

// AR Session Management - Adapted from working reference code
async function startAR() {
    try {
        if (!navigator.xr) {
            throw new Error("WebXR not supported");
        }

        if (xrSession) {
            return; // Already in AR session
        }

        // First try with viewer reference space (works on iOS)
        const sessionInit = { 
            optionalFeatures: ['dom-overlay'],
            domOverlay: { root: document.body }
        };

        xrSession = await navigator.xr.requestSession('immersive-ar', sessionInit);
        xrSession.addEventListener('end', onXRSessionEnded);
        
        // Try viewer reference space first (iOS compatible)
        try {
            xrReferenceSpace = await xrSession.requestReferenceSpace('viewer');
        } catch (viewerError) {
            console.log('Viewer space failed, trying local');
            try {
                xrReferenceSpace = await xrSession.requestReferenceSpace('local');
            } catch (localError) {
                throw new Error("Device doesn't support required AR features");
            }
        }

        await renderer.xr.setSession(xrSession);
        
        // UI updates
        document.querySelector('.ui-container').style.display = 'none';
        document.getElementById('exit-ar-button').style.display = 'block';
        isARSession = true;

    } catch (error) {
        console.error("AR Error:", error);
        alert(`AR not available: ${error.message}`);
        if (xrSession) {
            try {
                await xrSession.end();
            } catch (e) {
                console.error("Error ending session:", e);
            }
            xrSession = null;
        }
    }
}

function onXRSessionEnded() {
    document.querySelector('.ui-container').style.display = 'block';
    document.getElementById('exit-ar-button').style.display = 'none';
    isARSession = false;
    xrSession = null;
    xrReferenceSpace = null;
}

function endAR() {
    if (xrSession) {
        xrSession.end();
    }
}

function setupEventListeners() {
    document.getElementById('ar-button').addEventListener('click', startAR);
    document.getElementById('exit-ar-button').addEventListener('click', endAR);
    
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

function render() {
    if (!isARSession && model) {
        // Small auto-rotation when not in AR
        model.rotation.y += 0.005;
    }
    renderer.render(scene, camera);
}