// Global variables
let scene, camera, renderer, controller, model, arSession, arAnchor;
let touchStartX = 0, touchStartY = 0, touchRotationX = 0, touchRotationY = 0;
let isTouching = false;
let hitTestSource = null;
let refSpace = null;
let modelPlaced = false;

// Initialize when DOM is loaded
window.addEventListener('DOMContentLoaded', async () => {
    if (!window.modelData) {
        console.error('No model data available');
        updateLoadingStatus('Error: No model data', true);
        return;
    }

    // Initialize WebXR polyfill if needed
    if (typeof WebXRPolyfill !== 'undefined') {
        new WebXRPolyfill();
    }

    // Update UI with model info
    document.getElementById('product-name').textContent = window.modelData.name || '3D Model';
    document.getElementById('product-link').href = window.modelData.link || '#';
    document.getElementById('ar-product-name').textContent = window.modelData.name || 'AR Model';
    document.getElementById('ar-product-desc').textContent = window.modelData.desc || '';

    try {
        await initARScene();
        updateLoadingStatus('Ready to view', false);
    } catch (error) {
        console.error('Initialization failed:', error);
        updateLoadingStatus(`Error: ${error.message}`, true);
    }
});

// Initialize AR scene
async function initARScene() {
    // Create Three.js scene
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
    scene.add(camera);

    // Set up renderer with WebXR support
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    document.getElementById('model-container').appendChild(renderer.domElement);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    // Load the 3D model
    await loadModel();

    // Set up AR button
    document.getElementById('ar-button').addEventListener('click', startARSession);

    // Set up exit AR button
    document.getElementById('exit-ar').addEventListener('click', endARSession);

    // Set up interaction handlers
    setupInteractionHandlers();

    // Start animation loop
    renderer.setAnimationLoop(render);
}

// Load 3D model with progress tracking
async function loadModel() {
    return new Promise((resolve, reject) => {
        updateLoadingStatus('Loading 3D model...', false);
        
        const modelUrl = window.modelData?.file ? 
            `https://3dmodelsproject.pages.dev/models/${window.modelData.file}` : 
            'default.glb';

        const loader = new THREE.GLTFLoader();
        
        loader.load(modelUrl, 
            (gltf) => {
                if (model) scene.remove(model);
                
                model = gltf.scene;
                
                // Center and scale model
                const box = new THREE.Box3().setFromObject(model);
                const center = box.getCenter(new THREE.Vector3());
                model.position.sub(center);
                
                const size = box.getSize(new THREE.Vector3()).length();
                const scale = 1.0 / size;
                model.scale.set(scale, scale, scale);
                
                // Initial position for non-AR view
                model.position.set(0, -0.5, -1);
                scene.add(model);
                
                updateLoadingStatus('Model loaded successfully', false);
                resolve();
            },
            (xhr) => {
                const percent = Math.round((xhr.loaded / xhr.total) * 100);
                updateLoadingStatus(`Loading model... ${percent}%`, false);
            },
            (error) => {
                console.error('Model loading failed:', error);
                updateLoadingStatus('Failed to load model', true);
                reject(error);
            }
        );
    });
}

// Start AR session with ARCore/ARKit
async function startARSession() {
    updateLoadingStatus('Starting AR session...', false);
    
    try {
        // Check if WebXR is supported
        if (!navigator.xr) {
            throw new Error('WebXR not available in this browser');
        }

        // Request AR session with required features
        const session = await navigator.xr.requestSession('immersive-ar', {
            requiredFeatures: ['local-floor', 'hit-test', 'dom-overlay'],
            optionalFeatures: ['anchors'],
            domOverlay: { root: document.getElementById('ar-ui-container') }
        });

        arSession = session;
        renderer.xr.setSession(session);
        
        // Set up session event handlers
        session.addEventListener('end', endARSession);
        
        // Switch to AR UI
        document.getElementById('model-container').style.display = 'none';
        document.getElementById('ar-ui-container').style.display = 'block';
        
        // Initialize AR hit test
        session.addEventListener('select', onARSelect);
        
        // Get reference space
        refSpace = await session.requestReferenceSpace('local-floor');
        
        // Create hit test source
        const viewerSpace = await session.requestReferenceSpace('viewer');
        hitTestSource = await session.requestHitTestSource({ space: viewerSpace });
        
        modelPlaced = false;
        updateLoadingStatus('AR session started - look around and tap to place model', false);
        
    } catch (error) {
        console.error('AR session failed:', error);
        updateLoadingStatus(`AR Error: ${error.message}`, true);
    }
}

// Handle AR selection (tap to place)
function onARSelect(event) {
    if (!modelPlaced && hitTestSource && event.frame && refSpace) {
        const hitTestResults = event.frame.getHitTestResults(hitTestSource);
        if (hitTestResults.length > 0) {
            const hit = hitTestResults[0];
            const pose = hit.getPose(refSpace);
            
            if (pose && model) {
                // Position model at hit point
                model.position.set(
                    pose.transform.position.x,
                    pose.transform.position.y,
                    pose.transform.position.z
                );
                
                // Create anchor if supported
                if (arSession.requestHitTestSourceForTransientInput) {
                    arSession.requestHitTestSourceForTransientInput({
                        profile: 'generic-touchscreen',
                        offsetRay: new XRRay()
                    }).then((transientHitTestSource) => {
                        arAnchor = transientHitTestSource;
                    });
                }
                
                modelPlaced = true;
                updateLoadingStatus('Model placed - you can now interact with it', false);
            }
        }
    }
}

// End AR session
function endARSession() {
    if (arSession) {
        arSession.end();
    }
    
    // Reset AR state
    document.getElementById('model-container').style.display = 'block';
    document.getElementById('ar-ui-container').style.display = 'none';
    
    if (model) {
        // Reset model position for non-AR view
        model.position.set(0, -0.5, -1);
    }
    
    modelPlaced = false;
    updateLoadingStatus('Ready to view', false);
}

// Set up interaction handlers