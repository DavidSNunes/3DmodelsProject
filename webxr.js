document.addEventListener("DOMContentLoaded", async () => {
  let modelData;

  try {
      // Try to get the injected model data from a global variable set by the Worker
      if (window.injectedModelData) {
          modelData = window.injectedModelData;
      } else {
          console.error("❌ No injected model data found!");
          alert("Model data is missing.");
          return;
      }
  } catch (error) {
      console.error("❌ Error retrieving model data:", error);
      alert("Failed to load model data.");
      return;
  }

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
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Load model
  const loader = new GLTFLoader();
  const modelUrl = `/models/${decodeURIComponent(file)}`;

  loader.load(modelUrl, (gltf) => {
      scene.add(gltf.scene);
      gltf.scene.position.set(0, 0, -2);
  }, undefined, (error) => {
      console.error("❌ Error loading model:", error);
      alert("Failed to load the model.");
  });

  // Add lighting
  const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
  scene.add(light);

  // Add AR Button
  document.body.appendChild(ARButton.createButton(renderer));

  // Start rendering
  renderer.setAnimationLoop(() => renderer.render(scene, camera));
}
