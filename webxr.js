// Ensure model data is available and proceed with loading
window.addEventListener('DOMContentLoaded', () => {
    if (window.modelData) {
        console.log('Model data passed to WebXR:', window.modelData);
  
        // Update UI elements with model info
        document.getElementById('product-name').innerText = window.modelData.name || '3D Model';
        document.getElementById('product-desc').innerText = window.modelData.desc || 'Interactive 3D preview';
        document.getElementById('product-link').href = window.modelData.link || '#';
        document.getElementById('product-link').innerText = 'View Product';
  
        initScene(); // Initialize the scene
    } else {
        console.error('No model data found');
        document.getElementById('product-desc').innerText = 'Error: Model data missing';
    }
  });
  
  let scene, camera, renderer, controller, model, reticle;
  let isTouching = false;
  let touchStartX = 0, touchStartY = 0;
  let touchRotationX = 0, touchRotationY = 0;
  let currentScale = 1;
  let xrSession = null;
  let hitTestSource = null;
  let xrReferenceSpace = null;
  let controls;
  
  // AR State Management
  const arState = {
    placingModel: false,
    movingModel: false,
    currentModel: null,
    originalScale: null,
    originalDistance: null
  };
  
  // Initialize the scene
  function initScene() {
    // Scene setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
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
  
    // Lighting (improved)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
  
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);
  
    // Load model
    loadModel();
  
    // AR Button event
    document.getElementById('ar-button').addEventListener('click', startAR);
    document.getElementById('exit-ar-button').addEventListener('click', endAR);
  
    // Interaction handlers
    setupInteraction();
  
    // Window resize
    window.addEventListener('resize', onWindowResize);
  
    // Start render loop
    renderer.setAnimationLoop(render);
  }
  
  // Improved model loading
  function loadModel() {
    const modelUrl = window.modelData?.file || 'default.glb';
    const loader = new THREE.GLTFLoader();
    const fullUrl = `https://3dmodelsproject.pages.dev/models/${modelUrl}`;
  
    loader.load(
        fullUrl,
        (gltf) => {
            model = gltf.scene;
            
            // Center and scale model
            const bbox = new THREE.Box3().setFromObject(model);
            bbox.getCenter(model.position);
            model.position.multiplyScalar(-1);
            
            const size = bbox.getSize(new THREE.Vector3()).length();
            const scale = (0.5 / size) * 0.5;
            currentScale = scale;
            model.scale.set(scale, scale, scale);
  
            // Apply environment lighting
            const pmremGenerator = new THREE.PMREMGenerator(renderer);
            const envMap = pmremGenerator.fromScene(new THREE.Scene()).texture;
            model.traverse((child) => {
                if (child.isMesh) {
                    child.material.envMap = envMap;
                    child.material.needsUpdate = true;
                }
            });
  
            scene.add(model);
            document.getElementById('loading-progress').style.width = '100%';
        },
        (xhr) => {
            const percent = (xhr.loaded / xhr.total) * 100;
            document.getElementById('loading-progress').style.width = `${percent}%`;
        },
        (error) => {
            console.error('Model loading error:', error);
            document.getElementById('product-desc').innerText = 'Failed to load model';
        }
    );
  }
  
  // AR Session Start
  async function startAR() {
      try {
          if (!navigator.xr) {
              throw new Error('WebXR not supported');
          }
  
          if (xrSession) {
              console.log('AR session already active');
              return;
          }
  
          // Show AR tooltip
          document.getElementById('ar-tooltip').style.display = 'block';
  
          const sessionInit = { 
              optionalFeatures: ['dom-overlay', 'hit-test', 'anchors'],
              domOverlay: { root: document.body }
          };
  
          xrSession = await navigator.xr.requestSession('immersive-ar', sessionInit);
          xrSession.addEventListener('end', onXRSessionEnded);
          await renderer.xr.setSession(xrSession);
  
          // Get the best reference space
          const referenceSpaceTypes = ['local', 'local-floor', 'viewer'];
          for (const type of referenceSpaceTypes) {
              try {
                  xrReferenceSpace = await xrSession.requestReferenceSpace(type);
                  console.log(`Using reference space: ${type}`);
                  break;
              } catch (e) {
                  console.log(`${type} space not supported`);
              }
          }
  
          if (!xrReferenceSpace) {
              throw new Error("Couldn't establish any reference space");
          }
  
          // Initialize AR features
          initARFeatures();
          
          // Update UI
          document.querySelector('.ui-container').style.display = 'none';
          document.getElementById('exit-ar-button').style.display = 'block';
          
      } catch (error) {
          console.error('AR Error:', error);
          alert(`AR failed: ${error.message}`);
          if (xrSession) {
              xrSession.end().catch(e => console.error('Error ending session:', e));
          }
          document.getElementById('ar-tooltip').style.display = 'none';
      }
  }
  
  function initARFeatures() {
      // AR Reticle for placement
      reticle = new THREE.Mesh(
          new THREE.RingGeometry(0.1, 0.2, 32).rotateX(-Math.PI / 2),
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
  
      // Hit test source
      xrSession.requestHitTestSource({ space: xrReferenceSpace }).then(source => {
          hitTestSource = source;
      });
  
      // Reset AR state
      resetARState();
  }
  
  function resetARState() {
      arState.placingModel = false;
      arState.movingModel = false;
      arState.currentModel = null;
      arState.originalScale = null;
      arState.originalDistance = null;
  }
  
  // Interaction Handlers
  function onSelectStart() {
      if (!model) return;
  
      if (!arState.placingModel && !arState.movingModel) {
          // First tap - place the model
          if (reticle.visible) {
              model.position.copy(reticle.position);
              model.quaternion.copy(reticle.quaternion);
              arState.placingModel = true;
              provideHapticFeedback(0.5, 100);
          }
      } else {
          // Second tap - start moving/scaling
          arState.movingModel = true;
          arState.currentModel = model;
          arState.originalScale = model.scale.clone();
          arState.originalDistance = controller.position.distanceTo(camera.position);
          provideHapticFeedback(0.3, 50);
      }
  }
  
  function onSelectEnd() {
      if (arState.movingModel) {
          provideHapticFeedback(0.2, 50);
      }
      arState.movingModel = false;
  }
  
  function provideHapticFeedback(intensity, duration) {
      if (xrSession.inputSources && 
          xrSession.inputSources[0] && 
          xrSession.inputSources[0].gamepad && 
          xrSession.inputSources[0].gamepad.hapticActuators) {
          const actuator = xrSession.inputSources[0].gamepad.hapticActuators[0];
          actuator.pulse(intensity, duration);
      }
  }
  
  // Handle XR session end
  function onXRSessionEnded() {
      if (xrSession) {
          xrSession.removeEventListener('end', onXRSessionEnded);
          xrSession = null;
          hitTestSource = null;
          xrReferenceSpace = null;
          
          // Clean up AR-specific elements
          if (reticle) {
              scene.remove(reticle);
              reticle = null;
          }
          
          if (controller) {
              scene.remove(controller);
              controller = null;
          }
          
          // Restore UI
          document.querySelector('.ui-container').style.display = 'block';
          document.getElementById('exit-ar-button').style.display = 'none';
          document.getElementById('ar-tooltip').style.display = 'none';
          
          // Reset AR state
          resetARState();
          
          console.log('AR session ended');
      }
  }
  
  // End AR session
  async function endAR() {
      if (xrSession) {
          try {
              await xrSession.end();
          } catch (error) {
              console.error('Error ending AR session:', error);
          }
      }
  }
  
  // Interaction setup
  function setupInteraction() {
      // Mouse/touch events
      document.addEventListener('mousedown', onPointerStart);
      document.addEventListener('mousemove', onPointerMove);
      document.addEventListener('mouseup', onPointerEnd);
      document.addEventListener('wheel', onMouseWheel);
      document.addEventListener('touchstart', onPointerStart);
      document.addEventListener('touchmove', onPointerMove);
      document.addEventListener('touchend', onPointerEnd);
  }
  
  // Event handlers
  function onPointerStart(event) {
      if (xrSession) return; // Don't handle these events in AR mode
      
      isTouching = true;
      touchStartX = event.clientX || event.touches[0].clientX;
      touchStartY = event.clientY || event.touches[0].clientY;
  }
  
  function onPointerMove(event) {
      if (!isTouching || !model || xrSession) return;
      
      const clientX = event.clientX || event.touches[0].clientX;
      const clientY = event.clientY || event.touches[0].clientY;
      
      touchRotationY += (clientX - touchStartX) * 0.01;
      touchRotationX += (clientY - touchStartY) * 0.01;
      
      touchStartX = clientX;
      touchStartY = clientY;
  }
  
  function onPointerEnd() {
      isTouching = false;
  }
  
  function onMouseWheel(event) {
      if (!model || xrSession) return;
      event.preventDefault();
      currentScale *= 1 + event.deltaY * -0.001;
      currentScale = Math.max(0.1, Math.min(currentScale, 2.0));
      model.scale.set(currentScale, currentScale, currentScale);
  }
  
  function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  // Enhanced Render Loop
  function render(timestamp, frame) {
      if (xrSession && frame) {
          // In AR mode
          if (hitTestSource && !arState.movingModel) {
              const hitTestResults = frame.getHitTestResults(hitTestSource);
              if (hitTestResults.length > 0) {
                  const hit = hitTestResults[0];
                  const pose = hit.getPose(xrReferenceSpace);
                  if (reticle && pose) {
                      reticle.visible = true;
                      reticle.matrix.fromArray(pose.transform.matrix);
                  }
              } else if (reticle) {
                  reticle.visible = false;
              }
          }
  
          // Model movement during AR session
          if (arState.movingModel && model && controller) {
              // Get controller position
              const controllerMatrix = controller.matrix;
              model.position.setFromMatrixPosition(controllerMatrix);
              
              // Scale based on controller movement
              const currentDistance = controller.position.distanceTo(camera.position);
              const scaleFactor = currentDistance / arState.originalDistance;
              model.scale.copy(arState.originalScale).multiplyScalar(scaleFactor);
          }
      }
  
      if (model && !xrSession) {
          // Only rotate model when not in AR mode
          model.rotation.x = touchRotationX;
          model.rotation.y = touchRotationY;
      }
      
      renderer.render(scene, camera);
  }