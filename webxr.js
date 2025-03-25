// Global variables
let scene, camera, renderer, controller, model, reticle;
let arSession = null;
let isInARMode = false;
let touchStartX = 0, touchStartY = 0;
let touchRotationX = 0, touchRotationY = 0;
let currentScale = 1;

// Initialize the scene
function initScene() {
    // Clear previous scene if exists
    if (renderer && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
    }

    // Create new scene
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
    scene.add(camera);

    // Create renderer with transparent background
    renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true,
        preserveDrawingBuffer: true
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

// Load model function
function loadModel() {
    const modelUrl = window.modelData?.file || 'default.glb';
    const loader = new THREE.GLTFLoader();
    const fullUrl = `https://3dmodelsproject.pages.dev/models/${modelUrl}`;

    loader.load(
        fullUrl,
        (gltf) => {
            model = gltf.scene;
            const bbox = new THREE.Box3().setFromObject(model);
            bbox.getCenter(model.position);
            model.position.multiplyScalar(-1);
            const size = bbox.getSize(new THREE.Vector3()).length();
            currentScale = (0.5 / size) * 0.5;
            model.scale.set(currentScale, currentScale, currentScale);
            scene.add(model);
            document.getElementById('loading-progress').style.width = '100%';
        },
        (xhr) => {
            const percent = (xhr.loaded / xhr.total) * 100;
            document.getElementById('loading-progress').style.width = `${percent}%`;
        },
        (error) => {
            console.error('Model loading error:', error);
            document.getElementById('product-desc').textContent = 'Failed to load model';
        }
    );
}

// AR session management
async function toggleAR() {
    if (isInARMode) {
        endAR();
    } else {
        await startAR();
    }
}

async function startAR() {
    try {
        document.getElementById('ar-button').textContent = 'Loading AR...';
        document.getElementById('ar-button').disabled = true;
        document.getElementById('ar-error').style.display = 'none';

        if (!navigator.xr) {
            throw new Error('WebXR not supported in this browser');
        }

        const supported = await navigator.xr.isSessionSupported('immersive-ar');
        if (!supported) {
            throw new Error('AR not available on this device');
        }

        const session = await navigator.xr.requestSession('immersive-ar', {
            requiredFeatures: ['hit-test', 'dom-overlay'],
            domOverlay: { root: document.body }
        });

        arSession = session;
        isInARMode = true;
        
        // Update UI
        document.getElementById('ar-button').textContent = 'Exit AR';
        document.getElementById('ar-button').disabled = false;
        document.querySelector('.ui-container').style.opacity = '0.5';

        // Setup AR session
        await renderer.xr.setSession(session);
        
        // Create reticle
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
        session.addEventListener('end', endAR);

        // Controller setup
        controller = renderer.xr.getController(0);
        controller.addEventListener('select', () => {
            if (reticle.visible && model) {
                model.position.copy(reticle.position);
            }
        });
        scene.add(controller);

        // AR render loop
        renderer.setAnimationLoop((timestamp, frame) => {
            if (!frame) return;

            if (hitTestSource && model) {
                const hitTestResults = frame.getHitTestResults(hitTestSource);
                if (hitTestResults.length > 0) {
                    const pose = hitTestResults[0].getPose(referenceSpace);
                    reticle.visible = true;
                    reticle.position.setFromMatrixPosition(pose.transform.matrix);
                } else {
                    reticle.visible = false;
                }
            }
            renderer.render(scene, camera);
        });

    } catch (error) {
        console.error('AR Error:', error);
        document.getElementById('ar-error').textContent = error.message;
        document.getElementById('ar-error').style.display = 'block';
        endAR();
    }
}

function endAR() {
    if (arSession) {
        arSession.end().catch(console.warn);
    }
    
    isInARMode = false;
    arSession = null;
    
    // Reset UI
    document.getElementById('ar-button').textContent = 'Start AR';
    document.getElementById('ar-button').disabled = false;
    document.querySelector('.ui-container').style.opacity = '1';
    
    // Reset scene
    renderer.setAnimationLoop(null);
    initScene();
}

// Interaction setup
function setupInteraction() {
    const container = document.getElementById('model-container');
    
    container.addEventListener('mousedown', onPointerStart);
    container.addEventListener('mousemove', onPointerMove);
    container.addEventListener('mouseup', onPointerEnd);
    container.addEventListener('wheel', onMouseWheel);
    
    container.addEventListener('touchstart', onPointerStart);
    container.addEventListener('touchmove', onPointerMove);
    container.addEventListener('touchend', onPointerEnd);
}

// Event handlers
function onPointerStart(event) {
    if (isInARMode) return;
    
    event.preventDefault();
    if (event.touches) {
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
    } else {
        touchStartX = event.clientX;
        touchStartY = event.clientY;
    }
}

function onPointerMove(event) {
    if (isInARMode || !model) return;
    
    event.preventDefault();
    let clientX, clientY;
    
    if (event.touches) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    } else {
        clientX = event.clientX;
        clientY = event.clientY;
    }
    
    touchRotationY += (clientX - touchStartX) * 0.01;
    touchRotationX += (clientY - touchStartY) * 0.01;
    
    touchStartX = clientX;
    touchStartY = clientY;
}

function onPointerEnd() {
    // No action needed
}

function onMouseWheel(event) {
    if (isInARMode || !model) return;
    
    event.preventDefault();
    currentScale *= 1 + event.deltaY * -0.001;
    currentScale = Math.max(0.1, Math.min(currentScale, 2.0));
    model.scale.set(currentScale, currentScale, currentScale);
}

// Render function
function render() {
    if (model && !isInARMode) {
        model.rotation.x = touchRotationX;
        model.rotation.y = touchRotationY;
    }
    renderer.render(scene, camera);
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    if (window.modelData) {
        document.getElementById('product-name').innerText = window.modelData.name || '3D Model';
        document.getElementById('product-desc').innerText = window.modelData.desc || '';
        document.getElementById('product-link').href = window.modelData.link || '#';
        document.getElementById('ar-button').addEventListener('click', toggleAR);
        initScene();
    } else {
        console.error('No model data found');
        document.getElementById('product-desc').innerText = 'Error: Model data missing';
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
});