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

  // Generate the QR code
  const qrCode = new QRCode(qrContainer, {
      text: window.location.href,
      width: 200, // Larger QR code
      height: 200,
      correctLevel: QRCode.CorrectLevel.H // High error correction
  });

})();
