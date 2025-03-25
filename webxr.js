// Global variables
let scene, camera, renderer, controller, model, reticle;
let arSession = null; // Track active AR session
let isInARMode = false; // Track AR state
let touchStartX = 0, touchStartY = 0;
let touchRotationX = 0, touchRotationY = 0;
let currentScale = 1;

// Initialize the scene
function initAR() {
    // Clear previous scene if exists
    if (renderer) {
        document.getElementById('model-container').removeChild(renderer.domElement);
    }

    // Create new scene
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
    scene.add(camera);

    // Create renderer with transparent background
    renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true,
        preserveDrawingBuffer: true // For AR session
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    renderer.setClearColor(0x000000, 0); // Transparent background
    document.getElementById('model-container').appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    // Load model
    loadModel();

    // Setup interaction
    setupInteraction();

    // Start render loop
    renderer.setAnimationLoop(render);
}

// Updated AR start function
async function startAR() {
    try {
        if (isInARMode) {
            console.log('AR session already active');
            return;
        }

        if (!navigator.xr) {
            throw new Error('WebXR not supported');
        }

        // Check AR availability
        const supported = await navigator.xr.isSessionSupported('immersive-ar');
        if (!supported) {
            throw new Error('AR not available');
        }

        // Request AR session
        const session = await navigator.xr.requestSession('immersive-ar', {
            requiredFeatures: ['hit-test', 'dom-overlay'],
            domOverlay: { root: document.body }
        });

        arSession = session;
        isInARMode = true;
        
        // Update UI
        document.getElementById('ar-button').textContent = 'Exit AR';
        document.querySelector('.ui-container').style.display = 'none';

        // Setup AR session
        renderer.xr.setSession(session);
        
        // Create reticle for placement
        reticle = new THREE.Mesh(
            new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        reticle.visible = false;
        scene.add(reticle);

        // Setup hit test
        const referenceSpace = await session.requestReferenceSpace('local');
        const hitTestSource = await session.requestHitTestSource({ space: referenceSpace });

        // Handle session end
        session.addEventListener('end', () => {
            endAR();
        });

        // Handle controller select
        controller = renderer.xr.getController(0);
        controller.addEventListener('select', () => {
            if (reticle.visible && model) {
                model.position.copy(reticle.position);
            }
        });
        scene.add(controller);

    } catch (error) {
        console.error('AR Error:', error);
        alert(`AR failed: ${error.message}`);
        endAR();
    }
}

// Clean up AR session
function endAR() {
    if (arSession) {
        arSession.end().catch(console.error);
    }
    
    isInARMode = false;
    arSession = null;
    
    // Reset UI
    document.getElementById('ar-button').textContent = 'Start AR';
    document.querySelector('.ui-container').style.display = 'block';
    
    // Reset renderer
    renderer.setAnimationLoop(null);
    initAR();
}

// Rest of your existing code (loadModel, setupInteraction, event handlers, etc.)
// ... keep all other functions exactly as they were ...

// Update the AR button event listener
document.getElementById('ar-button').addEventListener('click', function() {
    if (isInARMode) {
        endAR();
    } else {
        startAR();
    }
});