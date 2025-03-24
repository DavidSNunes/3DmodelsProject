// Ensure data is loaded
window.addEventListener('DOMContentLoaded', () => {
  if (window.modelData) {
      console.log('Model data loaded:', window.modelData);

      // Set product data
      document.getElementById('product-name').innerText = window.modelData.name || 'Loading...';
      document.getElementById('product-desc').innerText = window.modelData.desc || 'Please wait while we load your model.';
      document.getElementById('product-link').href = window.modelData.link || '#';
      document.getElementById('product-link').innerText = 'View Product';

      // Load 3D model into viewer
      const modelViewer = document.getElementById('viewer');
      modelViewer.src = `https://3dmodelsproject.pages.dev/models/${window.modelData.file}`;

      // AR Button setup
      setupARButton();
  } else {
      console.error('No model data found');
  }
});

// Setup AR button
function setupARButton() {
  const arButton = document.getElementById('ar-button');

  // If WebXR is supported, enable the button
  navigator.xr?.isSessionSupported('immersive-ar').then((supported) => {
      if (supported) {
          arButton.style.display = 'block';
          arButton.addEventListener('click', () => startWebXRSession());
      } else {
          console.warn('AR not supported on this device.');
          arButton.style.display = 'none';
      }
  });
}

// Start WebXR AR Session
function startWebXRSession() {
  const modelViewer = document.getElementById('viewer');

  if (modelViewer.canActivateAR) {
      modelViewer.activateAR();
  } else {
      alert("WebXR AR is not supported on this device.");
  }
}
