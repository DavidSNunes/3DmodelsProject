(async function () {
  const supportedSites = ["configurador.audi.pt", "www.worten.pt"];
  if (!supportedSites.some(site => window.location.hostname.includes(site))) return;

  const modelCode = extractModelCode();
  if (!modelCode) return;

  const workerUrl = "https://your-cloudflare-worker-url/";
  const response = await fetch(workerUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: window.location.href })
  });

  if (!response.ok) return;
  const { qrCodeUrl } = await response.json();
  injectQRCode(qrCodeUrl);
})();

function extractModelCode() {
  const match = window.location.href.match(/(20A|30A|40A|50B|laptop|monitor)/);
  return match ? match[0] : null;
}

function injectQRCode(qrCodeUrl) {
  const qrContainer = document.createElement("div");
  qrContainer.style.position = "fixed";
  qrContainer.style.bottom = "20px";
  qrContainer.style.right = "20px";
  qrContainer.style.zIndex = "9999";
  qrContainer.style.padding = "10px";
  qrContainer.style.backgroundColor = "#fff";
  qrContainer.style.borderRadius = "10px";
  qrContainer.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
  
  const qrImage = document.createElement("img");
  qrImage.src = qrCodeUrl;
  qrImage.style.width = "150px";
  qrImage.style.height = "150px";

  qrContainer.appendChild(qrImage);
  document.body.appendChild(qrContainer);
}
