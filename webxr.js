// Global references
const arButton = document.getElementById('arButton');
const arUI = document.querySelector('.ar-ui');
const modelEntity = document.getElementById('model');

// AR Button click event to trigger the AR experience
arButton.addEventListener('click', async () => {
  // Hide UI elements when entering AR
  arUI.style.display = 'none';

  // Check if the browser supports WebXR
  if (navigator.xr) {
    try {
      // Request XR session for immersive AR
      const session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay']
      });

      // Initialize AR session and add event listener for session end
      session.addEventListener('end', () => {
        arUI.style.display = 'block'; // Show UI again when AR session ends
      });

      // Set up AR environment (for ARCore / ARKit)
      const xrViewer = new XRViewer(session);
      xrViewer.start();

    } catch (error) {
      console.error('WebXR session failed: ', error);
      alert('Failed to start AR session. Make sure your device supports AR.');
    }
  } else {
    alert('WebXR is not supported on your device.');
  }
});

// Custom WebXR Viewer class for managing the AR session
class XRViewer {
  constructor(session) {
    this.session = session;
  }

  start() {
    // Start the AR session and handle rendering of models, UI elements
    console.log('AR session started');

    // Load the 3D model (GLTF or GLB)
    modelEntity.setAttribute('gltf-model', 'url(model.glb)');

    // You can add more logic here to handle further AR features, like animations, interactions, etc.
  }
}
