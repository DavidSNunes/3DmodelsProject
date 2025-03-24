// Initialize WebXR polyfill
const polyfill = new WebXRPolyfill();

// Global variables
let scene, camera, renderer, model, controls;
let arSession = null;
let modelRotation = { x: 0, y: 0 };
let modelScale = 1;
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };

// Initialize the application
window.addEventListener('DOMContentLoaded', () => {
    if (window.modelData) {
        document.getElementById('product-name').innerText = window.modelData.name || 'Loading...';
        document.getElementById('product-desc').innerText = window.modelData.desc || 'Please wait while we load your model.';
        document.getElementById('product-link').href = window.modelData.link || '#';
        document.getElementById('product-link').innerText = 'View Product';
        
        initScene();
        loadModel();
        setupEventListeners();
    } else {
        console.log('No model data found');
    }
});

function initScene() {
    // Create scene
    scene = new THREE.Scene();
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    document.getElementById('model-container').appendChild(renderer.domElement);
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // Add orbit controls for desktop
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    
    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    // Start animation loop
    animate();
}

function loadModel() {
    const modelUrl = window.modelData ? window.modelData.file : 'default.glb';
    const fullModelURL = 'https://3dmodelsproject.pages.dev/models/' + modelUrl;
    
    const loader = new THREE.GLTFLoader();
    loader.load(fullModelURL, (gltf) => {
        if (model) scene.remove(model);
        
        model = gltf.scene;
        model.position.set(0, 0, 0);
        model.scale.set(0.05, 0.05, 0.05);
        scene.add(model);
    }, undefined, (error) => {
        console.error('Error loading model:', error);
    });
}

function setupEventListeners() {
    // AR button
    document.getElementById('ar-button').addEventListener('click', startAR);
    
    // Mouse/touch interactions
    const container = document.getElementById('model-container');
    
    // Mouse down/touch start
    container.addEventListener('mousedown', onPointerDown);
    container.addEventListener('touchstart', onPointerDown);
    
    // Mouse move/touch move
    container.addEventListener('mousemove', onPointerMove);
    container.addEventListener('touchmove', onPointerMove);
    
    // Mouse up/touch end
    container.addEventListener('mouseup', onPointerUp);
    container.addEventListener('touchend', onPointerUp);
    container.addEventListener('mouseleave', onPointerUp);
    
    // Zoom
    container.addEventListener('wheel', onWheel);
}

function onPointerDown(event) {
    isDragging = true;
    previousMousePosition = {
        x: event.clientX || event.touches[0].clientX,
        y: event.clientY || event.touches[0].clientY
    };
    event.preventDefault();
}

function onPointerMove(event) {
    if (!isDragging || !model) return;
    
    const mouseX = event.clientX || event.touches[0].clientX;
    const mouseY = event.clientY || event.touches[0].clientY;
    
    const deltaX = mouseX - previousMousePosition.x;
    const deltaY = mouseY - previousMousePosition.y;
    
    modelRotation.y += deltaX * 0.01;
    modelRotation.x += deltaY * 0.01;
    
    if (model) {
        model.rotation.x = modelRotation.x;
        model.rotation.y = modelRotation.y;
    }
    
    previousMousePosition = { x: mouseX, y: mouseY };
    event.preventDefault();
}

function onPointerUp() {
    isDragging = false;
}

function onWheel(event) {
    if (!model) return;
    
    modelScale += event.deltaY * -0.001;
    modelScale = Math.min(Math.max(0.05, modelScale), 2);
    model.scale.set(modelScale, modelScale, modelScale);
    
    event.preventDefault();
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// AR Functions
async function startAR() {
    try {
        if (!navigator.xr) {
            throw new Error('WebXR not supported');
        }
        
        const supported = await navigator.xr.isSessionSupported('immersive-ar');
        if (!supported) {
            throw new Error('AR not supported');
        }
        
        const session = await navigator.xr.requestSession('immersive-ar', {
            requiredFeatures: ['hit-test', 'dom-overlay'],
            domOverlay: { root: document.body }
        });
        
        arSession = session;
        renderer.xr.setSession(session);
        showPrompt("Move your device to start AR experience");
        
        session.addEventListener('end', () => {
            hidePrompt();
            renderer.xr.setSession(null);
            arSession = null;
        });
        
        setupHitTest();
    } catch (error) {
        showError(error.message);
    }
}

function setupHitTest() {
    let hitTestSource = null;
    
    arSession.requestReferenceSpace('viewer').then((referenceSpace) => {
        return arSession.requestHitTestSource({ space: referenceSpace });
    }).then((source) => {
        hitTestSource = source;
    });
    
    arSession.addEventListener('select', (event) => {
        if (hitTestSource && model) {
            const hitTestResults = event.frame.getHitTestResults(hitTestSource);
            if (hitTestResults.length > 0) {
                const pose = hitTestResults[0].getPose(renderer.xr.getReferenceSpace());
                model.position.setFromMatrixPosition(pose.transform.matrix);
                hidePrompt();
            }
        }
    });
}

function showPrompt(message) {
    const prompt = document.getElementById('ar-prompt');
    prompt.innerText = message;
    prompt.style.display = 'block';
}

function hidePrompt() {
    document.getElementById('ar-prompt').style.display = 'none';
}

function showError(message) {
    const error = document.getElementById('ar-error');
    error.innerText = message;
    error.style.display = 'block';
    setTimeout(() => error.style.display = 'none', 5000);
}