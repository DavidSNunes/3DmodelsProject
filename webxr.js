// Check WebXR support
if ('xr' in navigator) {
  console.log('✅ WebXR supported.');

  const arButton = document.getElementById('ar-button');
  if (arButton) {
      arButton.addEventListener('click', async () => {
          console.log('🎯 AR button clicked, attempting to start AR session...');

          try {
              // Request an immersive AR session
              const session = await navigator.xr.requestSession('immersive-ar', {
                  requiredFeatures: ['hit-test']
              });

              console.log('🚀 WebXR session started:', session);

              // Setup XR environment (placeholder for 3D model loading)
              alert('✅ AR session started! (3D model integration coming)');

              // Listen for the session ending
              session.addEventListener('end', () => console.log('🔚 AR session ended.'));
          } catch (err) {
              console.error('❌ Failed to start AR session:', err);
              alert('⚠️ AR failed: ' + err.message);
          }
      });
  } else {
      console.warn('⚠️ AR button not found!');
      alert('No AR button detected on this page.');
  }
} else {
  console.warn('⚠️ WebXR not supported!');
  alert('Your device or browser doesn’t support WebXR.');
}
