(function () {
  if (document.getElementById("qr-code-container")) return; // Prevent duplicate containers

  // Create QR code container
  const qrContainer = document.createElement("div");
  qrContainer.id = "qr-code-container";
  qrContainer.style.position = "fixed";
  qrContainer.style.bottom = "20px";
  qrContainer.style.right = "20px";
  qrContainer.style.width = "220px"; // Larger size
  qrContainer.style.height = "220px";
  qrContainer.style.background = "white";
  qrContainer.style.padding = "10px";
  qrContainer.style.border = "2px solid black";
  qrContainer.style.boxShadow = "0px 0px 10px rgba(0,0,0,0.5)";
  qrContainer.style.zIndex = "999999"; // Super high z-index
  qrContainer.style.borderRadius = "10px"; // Rounded edges
  qrContainer.style.display = "flex";
  qrContainer.style.justifyContent = "center";
  qrContainer.style.alignItems = "center";

  document.body.appendChild(qrContainer);

  // Get the current page URL
  var currentUrl = window.location.href;

  // Construct the full URL for the worker page with the current URL appended
  var workerUrl = "https://3dmodelsworker.davidsousanunes41.workers.dev/?url=";
  var fullUrl = workerUrl + encodeURIComponent(currentUrl);

  // Generate the QR code for the worker page URL
  const qrCode = new QRCode(qrContainer, {
      text: fullUrl, // The worker page with current page URL
      width: 150, // Larger QR code
      height: 150,
      correctLevel: QRCode.CorrectLevel.L // Low error correction for less detailed QR
  });

})();
