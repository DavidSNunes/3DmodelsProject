// Global variables
let scene, camera, renderer, model, controller, reticle;
let xrSession = null, hitTestSource = null, xrReferenceSpace = null;

// Initialize when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    if (window.modelData) {
        updateUI();
        initScene();
        checkARSupport();
    } else {
        showError('Error: Model data missing');
    }
});

function updateUI() {
    document.getElementById('product-name').textContent = window.modelData.name || '3D Model';
    document.getElementById('product-desc').textContent = window.modelData.desc || '';
    document.getElementById('product-link').href = window.modelData.link || '#';
}

function initScene() {
    // Scene setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
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

async function checkARSupport() {
    const arButton = document.getElementById('ar-button');
    const arMessage = document.getElementById('ar-support-message');
    
    if (!navigator.xr) {
        arButton.style.display = 'none';
        arMessage.textContent = 'WebXR not supported in this browser';
        return false;
    }

    try {
        const supported = await navigator.xr.isSessionSupported('immersive-ar');
        if (!supported) {
            arButton.style.display = 'none';
            arMessage.textContent = 'AR not available on this device';
            return false;
        }
        return true;
    } catch (error) {
        console.error('AR support check failed:', error);
        arButton.style.display = 'none';
        arMessage.textContent = 'Could not check AR support';
        return false;
    }
}

async function startAR() {
    try {
        if (!await checkARSupport()) {
            throw new Error("AR not supported on this device");
        }

        if (xrSession) return;

        // First try with minimal requirements
        const sessionInit = { 
            optionalFeatures: ['dom-overlay'],
            domOverlay: { root: document.body }
        };

        xrSession = await navigator.xr.requestSession('immersive-ar', sessionInit);
        xrSession.addEventListener('end', onXRSessionEnded);
        
        // Try all possible reference spaces
        const referenceSpaceTypes = ['viewer', 'local', 'local-floor', 'unbounded'];
        let lastError = null;
        
        for (const type of referenceSpaceTypes) {
            try {
                xrReferenceSpace = await xrSession.requestReferenceSpace(type);
                console.log(`Using reference space: ${type}`);
                break;
            } catch (error) {
                console.log(`Failed ${type} space:`, error);
                lastError = error;
            }
        }

        if (!xrReferenceSpace) {
            throw new Error(`No supported reference space: ${lastError?.message}`);
        }

        await renderer.xr.setSession(xrSession);
        initARFeatures();
        
        // UI updates
        document.querySelector('.ui-container').style.display = 'none';
        document.getElementById('exit-ar-button').style.display = 'block';

    } catch (error) {
        console.error("AR Error:", error);
        showError(`AR not available: ${getUserFriendlyError(error)}`);
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

function getUserFriendlyError(error) {
    if (error.message.includes('reference space')) {
        return "Your device doesn't support AR placement";
    }
    if (error.message.includes('not supported')) {
        return "AR not available on this device";
    }
    return error.message;
}

function initARFeatures() {
    // Basic reticle for placement
    reticle = new THREE.Mesh(
        new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    reticle.visible = false;
    scene.add(reticle);

    // Basic controller
    controller = renderer.xr.getController(0);
    controller.addEventListener('selectstart', onSelectStart);
    scene.add(controller);
}

function onSelectStart() {
    if (reticle.visible && model) {
        model.position.copy(reticle.position);
        model.quaternion.copy(reticle.quaternion);
    }
}

function onXRSessionEnded() {
    document.querySelector('.ui-container').style.display = 'block';
    document.getElementById('exit-ar-button').style.display = 'none';
    
    if (reticle) scene.remove(reticle);
    if (controller) scene.remove(controller);
    
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
    renderer.render(scene, camera);
}

function loadModel() {
    const loader = new THREE.GLTFLoader();
    const modelUrl = `https://3dmodelsproject.pages.dev/models/${window.modelData.file}`;
    
    loader.load(modelUrl, (gltf) => {
        model = gltf.scene;
        
        // Center and scale model
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const scale = 1.5 / Math.max(size.x, size.y, size.z);
        
        model.scale.set(scale, scale, scale);
        model.position.set(0, 0, 0);
        scene.add(model);
        
        document.getElementById('loading-progress').style.width = '100%';
    }, 
    (xhr) => {
        const percent = (xhr.loaded / xhr.total) * 100;
        document.getElementById('loading-progress').style.width = `${percent}%`;
    }, 
    (error) => {
        console.error('Model loading error:', error);
        showError('Failed to load model');
    });
}

function showError(message) {
    document.getElementById('product-desc').textContent = message;
    document.getElementById('ar-support-message').textContent = message;
}