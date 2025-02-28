(async function () {
  const url = window.location.href;

  // Send the URL to the Cloudflare Worker for processing
  const response = await fetch("https://3dmodelsworker.davidsousanunes41.workers.dev/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
  });

  if (!response.ok) return console.warn("Failed to fetch response from Worker.");

  const data = await response.json();
  if (!data.qrCodeUrl) return console.warn("No QR code generated.");

  // Inject the QR code into the webpage
  injectQRCode(data.qrCodeUrl);
})();

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
