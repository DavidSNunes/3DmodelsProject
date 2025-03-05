(async function() {
  const workerURL = "https://3dmodelsworker.davidsousanunes41.workers.dev";
  const currentPageURL = window.location.href;
  const qrCodeURL = `${workerURL}#!${encodeURIComponent(currentPageURL)}`;

  // Inject QR code into the page
  const qrContainer = document.createElement("div");
  qrContainer.style.position = "fixed";
  qrContainer.style.bottom = "10px";
  qrContainer.style.right = "10px";
  qrContainer.style.zIndex = "9999";
  qrContainer.style.background = "white";
  qrContainer.style.padding = "10px";
  qrContainer.style.border = "1px solid black";
  qrContainer.style.borderRadius = "8px";

  const qrCanvas = document.createElement("canvas");
  qrContainer.appendChild(qrCanvas);
  document.body.appendChild(qrContainer);

  new QRCode(qrCanvas, {
      text: qrCodeURL,
      width: 150,
      height: 150
  });
})();
