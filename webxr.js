let scene, camera, renderer, model, controller;
let currentSession = null;

// Setup Three.js scene
function initScene() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;

    document.getElementById('model-container').appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    loadModel();
}

// Load the GLTF model
function loadModel() {
    const modelUrl = window.modelData?.file || 'default.glb';
    const loader = new THREE.GLTFLoader();
    loader.load(
        `https://3dmodelsproject.pages.dev/models/${modelUrl}`,
        (gltf) => {
            model = gltf.scene;
            scene.add(model);
            document.getElementById('loading-progress').style.width = '100%';
        },
        (xhr) => {
            const percent = (xhr.loaded / xhr.total) * 100;
            document.getElementById('loading-progress').style.width = `${percent}%`;
        },
        (error) => console.error('Model loading error:', error)
    );
}

// Start AR session
async function startAR() {
    if (!navigator.xr) {
        alert("WebXR not supported");
        return;
    }

    if (currentSession) {
        console.warn("AR session already active");
        return;
    }

    try {
        currentSession = await navigator.xr.requestSession('immersive-ar', {
            requiredFeatures: ['hit-test']
        });
        renderer.xr.setSession(currentSession);

        currentSession.addEventListener('end', () => {
            console.log("AR session ended");
            currentSession = null;
        });

        animate();
    } catch (error) {
        console.error("Failed to start AR session:", error);
        alert(`AR failed: ${error.message}`);
    }
}

// Render loop
function animate() {
    renderer.setAnimationLoop(() => {
        renderer.render(scene, camera);
    });
}

// Setup event listeners
window.addEventListener('DOMContentLoaded', () => {
    initScene();
    document.getElementById('ar-button').addEventListener('click', startAR);
});
