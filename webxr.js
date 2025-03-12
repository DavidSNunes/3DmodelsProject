import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.130.1/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.130.1/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

function loadModel(url) {
  loader.load(
    url,
    (gltf) => {
      const model = gltf.scene;
      model.scale.set(1, 1, 1);
      scene.add(model);
    },
    undefined,
    (error) => console.error("Error loading model:", error)
  );
}

window.addEventListener('load', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const modelData = JSON.parse(decodeURIComponent(urlParams.get("model") || "{}"));
  if (modelData.file) loadModel(`https://3dmodelsproject.pages.dev/models/${modelData.file}`);
});
