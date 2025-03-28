// Global variables
let scene, camera, renderer, model, controls;
let xrSession = null;
let isARSession = false;

// Initialize the scene
function initScene() {
    // Scene setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 3);
    
    // Renderer
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

// Improved model loading with better scaling
function loadModel() {
    const loader = new THREE.GLTFLoader();
    const modelUrl = `https://3dmodelsproject.pages.dev/models/${window.modelData.file}`;
    
    loader.load(modelUrl, (gltf) => {
        model = gltf.scene;
        
        // Optimal scaling calculation
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 1.5 / maxDim;
        
        model.scale.set(scale, scale, scale);
        model.position.set(0, 0, 0);
        scene.add(model);
        
        // Update UI
        document.getElementById('product-name').textContent = window.modelData.name;
        document.getElementById('product-desc').textContent = window.modelData.description;
    }, undefined, (error) => {
        console.error('Error loading model:', error);
    });
}

// AR session management
async function startAR() {
    try {
        if (!navigator.xr) {
            throw new Error("WebXR not supported");
        }
        
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
        const sessionInit = {
            optionalFeatures: ['dom-overlay'],
            domOverlay: { root: document.body }
        };
        
        xrSession = await navigator.xr.requestSession('immersive-ar', sessionInit);
        await renderer.xr.setSession(xrSession);
        
        // iOS-specific reference space
        const refSpace = await xrSession.requestReferenceSpace(isIOS ? 'viewer' : 'local');
        
        // UI updates
        document.querySelector('.ui-container').style.display = 'none';
        document.getElementById('exit-ar-button').style.display = 'block';
        isARSession = true;
        
    } catch (error) {
        console.error("AR Error:", error);
        alert(`AR not available: ${error.message}`);
    }
}

function endAR() {
    if (xrSession) {
        xrSession.end();
    }
}

// Event handling
function setupEventListeners() {
    // AR buttons
    document.getElementById('ar-button').addEventListener('click', startAR);
    document.getElementById('exit-ar-button').addEventListener('click', endAR);
    
    // Window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    // Session end handling
    if (navigator.xr) {
        navigator.xr.addEventListener('sessionend', () => {
            document.querySelector('.ui-container').style.display = 'block';
            document.getElementById('exit-ar-button').style.display = 'none';
            isARSession = false;
        });
    }
}

// Render loop
function render() {
    if (!isARSession && model) {
        // Small auto-rotation when not in AR
        model.rotation.y += 0.005;
    }
    renderer.render(scene, camera);
}

// AR support detection
function checkARSupport() {
    const arButton = document.getElementById('ar-button');
    const arMessage = document.getElementById('ar-support-message');
    
    if (!navigator.xr) {
        arButton.style.display = 'none';
        arMessage.textContent = 'WebXR not supported in this browser';
        return;
    }
    
    navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
        if (!supported) {
            arButton.style.display = 'none';
            arMessage.textContent = 'AR not available on this device';
        } else {
            arMessage.textContent = 'AR supported - Tap to start';
        }
    });
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    if (window.modelData) {
        checkARSupport();
        initScene();
    } else {
        document.getElementById('product-name').textContent = 'Error: No model data';
    }
});