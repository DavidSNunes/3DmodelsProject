(async function() {
  const url = window.location.href;
  const configBase = "https://configurador.audi.pt/cc-pt/pt_PT_AUDI23/A/auv/";   //base URL 

  
  //extracts the model code in the URL
  const modelMatch = url.match(/\/([A-B]?\d{2}[A-B]?)\/|\/([A-B]?\d{2}[A-B]?)\?/); 
  if (!modelMatch) return console.warn("No model code found."); 

  
  //registers the model code from the URL according to the parameters
  const modelCode = modelMatch[1] || modelMatch[2]; 
  console.log(`Detected Model Code: ${modelCode}`); 

  
  //fetches the corresponding model path from the Worker(cloud flare)
  const response = await fetch(`https://my-worker.davidsousanunes41.workers.dev/?model=${modelCode}`);
  if (!response.ok) return console.warn("Failed to fetch model from database.");

  const data = await response.json();
  if (!data.modelPath) return console.warn("Model path not found in database.");
  
  
  //creates de model viewer page according to the model code found in the URL
  const modelViewerUrl = `https://3dmodels-7c1.pages.dev/viewer.html?model=${encodeURIComponent(data.modelPath)}`;
  
  
  //QR code generator
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(modelViewerUrl)}`;
  
  
  //QR injector to webpage
  injectQRCode(qrCodeUrl);
})();


//QR injector to webpage
function injectQRCode(qrCodeUrl) {
  const qrImg = document.createElement("img");
  qrImg.src = qrCodeUrl;
  qrImg.style.position = "fixed";
  qrImg.style.bottom = "20px";
  qrImg.style.right = "20px";
  qrImg.style.zIndex = "300000";
  qrImg.style.width = "150px";
  qrImg.style.height = "150px";
  document.body.appendChild(qrImg);
}
