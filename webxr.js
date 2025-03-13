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

  // Load model into WebXR scene
  loadModel(modelData.file);
});

function loadModel(file) {
  // Set up the scene, camera, and renderer
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Load the model
  const loader = new THREE.GLTFLoader();
  loader.load(
    `https://3dmodelsproject.pages.dev/models/${file}`,
    (gltf) => {
      scene.add(gltf.scene);
      gltf.scene.position.set(0, 0, -2);
    },
    undefined,
    (error) => {
      console.error("❌ Error loading model:", error);
      alert("Failed to load the model.");
    }
  );

  // Add lighting
  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  scene.add(light);

  // Add AR Button
  document.body.appendChild(THREE.ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] }));

  // Start rendering
  renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
  });
}