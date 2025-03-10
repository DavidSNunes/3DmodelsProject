import * as THREE from "https://unpkg.com/three@0.174.0/build/three.module.js";
import { ARButton } from "https://unpkg.com/three@0.174.0/examples/jsm/webxr/ARButton.js";
import { GLTFLoader } from "https://unpkg.com/three@0.174.0/examples/jsm/loaders/GLTFLoader.js";

document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const modelData = JSON.parse(decodeURIComponent(params.get("model") || "{}"));

    if (!modelData.file) {
        alert("Model not found!");
        return;
    }

    // Update UI
    document.getElementById("product-name").textContent = modelData.name;
    document.getElementById("product-desc").textContent = modelData.desc;
    document.getElementById("product-link").href = modelData.link;

    // Setup Three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Load model
    const loader = new GLTFLoader();
    loader.load(`https://3dmodelsproject.pages.dev/models/${modelData.file}`, (gltf) => {
        scene.add(gltf.scene);
        gltf.scene.position.set(0, 0, -2);
    });

    // Add light
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    scene.add(light);

    // AR Button
    document.body.appendChild(ARButton.createButton(renderer));

    // Render loop
    function animate() {
        renderer.setAnimationLoop(() => {
            renderer.render(scene, camera);
        });
    }
    animate();
});
