document.addEventListener("DOMContentLoaded", () => {
  // Hardcode the model data for testing
  const modelData = {
    file: "tv-hisense.glb",
    name: "TV Hisense 55A6N",
    desc: "Perfeita para quem gosta do Discovery Channel",
    link: "https://www.worten.pt/produtos/tv-hisense-55a6n-led-55-140-cm-4k-ultra-hd-smart-tv-8022846"
  };

  console.log("🔍 Model data received:", modelData);

  // Load model into the scene
  loadModel(modelData.file);
});

function loadModel(file) {
  // Set up the scene, camera, and renderer
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Add lighting
  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  scene.add(light);

  // Load the model
  const loader = new THREE.GLTFLoader();
  loader.load(
    `https://3dmodelsproject.pages.dev/models/${file}`,
    (gltf) => {
      const model = gltf.scene;
      scene.add(model);

      // Position the camera
      camera.position.z = 5;

      // Render the scene
      const animate = () => {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
      };
      animate();
    },
    undefined,
    (error) => {
      console.error("❌ Error loading model:", error);
      alert("Failed to load the model.");
    }
  );
}