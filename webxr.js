document.addEventListener("DOMContentLoaded", () => {
  if (!window.modelData) {
    console.error("❌ No model data found!");
    alert("Model data is missing.");
    return;
  }

  const modelData = window.modelData;
  console.log("🔍 Model data received:", modelData);

  if (!modelData.file) {
    alert("Model file missing!");
    return;
  }

  // Update UI
  document.getElementById("product-name").textContent = modelData.name || "Unknown Model";
  document.getElementById("product-desc").textContent = modelData.desc || "No description available.";
  document.getElementById("product-link").href = modelData.link || "#";
  document.getElementById("product-link").textContent = modelData.link ? "View Product" : "No Link Available";

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

      // Center the model in the scene
      const box = new THREE.Box3().setFromObject(model);
      const center = new THREE.Vector3();
      box.getCenter(center);
      model.position.sub(center); // Center the model

      // Adjust the camera to fit the model
      const size = box.getSize(new THREE.Vector3()).length();
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      let cameraZ = Math.abs((maxDim / 2) * Math.tan(fov / 2));
      cameraZ *= 1.5; // Adjust for a better view
      camera.position.z = cameraZ;

      // Set up orbit controls
      const controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true; // Smooth movement
      controls.dampingFactor = 0.25;
      controls.screenSpacePanning = false;
      controls.minDistance = 1; // Prevent zooming too close
      controls.maxDistance = 100; // Prevent zooming too far
      controls.maxPolarAngle = Math.PI / 2; // Prevent flipping the model

      // Render the scene
      const animate = () => {
        requestAnimationFrame(animate);
        controls.update(); // Required if controls.enableDamping is true
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