// Set up the WebXR scene and AR session
let scene, camera, renderer, controller;

// Initialize the AR scene
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

    loadModel();

    // Add a light source
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    scene.add(light);

    // Start the XR session
    document.body.appendChild(createARButton());
    renderer.setAnimationLoop(render);
}

// Load the 3D model
function loadModel() {
    const modelUrl = new URLSearchParams(window.location.search).get('model') || 'default.glb';
    const loader = new THREE.GLTFLoader();

    loader.load(`/models/${modelUrl}`, (gltf) => {
        const model = gltf.scene;
        model.position.set(0, -0.5, -1);
        scene.add(model);
    });
}

// Render the scene
function render() {
    renderer.render(scene, camera);
}

// Create an AR button without imports
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

// Handle window resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

initAR();
