/**
 * card-builder.js
 * Premium Membership Card builder
 * Designed to closely match the uploaded membership card PDF
 * with a cleaner, more professional layout and branding.
 */

function buildCardElement(memberData) {
  /**
   * This version of the card builder renders each side of the membership card
   * using predesigned template images (front.png and back.png) and overlays
   * only the dynamic fields (member name, member ID, photo and optional QR).
   *
   * The card dimensions remain 900×540px, matching the original design.
   * Position values below were chosen to align the overlays with the blank
   * regions of the provided templates. Adjust these values if you update the
   * template artwork.
   */

  const {
    fullName = "Member Name",
    memberId = "CF260001",
    selfieDataUrl = "",
    qrTarget = "",
  } = memberData;

  const safeName = _esc(fullName);
  const safeId = _esc(memberId);
  const safeSelfie = _esc(selfieDataUrl);

  const wrapper = document.createElement("div");
  wrapper.className = "cf-card-wrapper";

  /** FRONT CARD */
  const front = document.createElement("div");
  front.className = "cf-card cf-card-front new-design";
  front.style.position = "relative";
  // Inject the front template as an img so html2canvas can capture it reliably.
  const frontImg = document.createElement("img");
  frontImg.src = "img/front.png";
  frontImg.alt = "Front Template";
  frontImg.style.position = "absolute";
  frontImg.style.top = "0";
  frontImg.style.left = "0";
  frontImg.style.width = "100%";
  frontImg.style.height = "100%";
  frontImg.style.objectFit = "cover";
  // Do not set crossOrigin or referrerPolicy on the template image.
  // When the page is served from file:// or other static hosting,
  // specifying crossOrigin may cause html2canvas to exclude the image
  // due to CORS restrictions. By omitting these attributes the image
  // is treated as same‑origin and captured correctly.
  front.appendChild(frontImg);

  // Overlay container for photo and text
  const overlay = document.createElement("div");
  overlay.className = "cf-custom-overlay";

  // Photo box
  const photoBox = document.createElement("div");
  photoBox.className = "cf-custom-photo";
  if (safeSelfie) {
    const img = document.createElement("img");
    img.src = safeSelfie;
    img.alt = safeName;
    // The member photo is loaded as a data URI, so there is no need to
    // specify crossOrigin/referrerPolicy. Omitting these attributes
    // avoids potential CORS issues when generating the PDF locally.
    photoBox.appendChild(img);
  } else {
    // Placeholder when no selfie is provided
    const placeholder = document.createElement("div");
    placeholder.className = "cf-photo-placeholder-icon";
    placeholder.textContent = "PHOTO";
    photoBox.appendChild(placeholder);
  }

  // Info container for name and ID
  const infoBox = document.createElement("div");
  infoBox.className = "cf-custom-info";
  const nameEl = document.createElement("div");
  nameEl.className = "cf-custom-name";
  nameEl.textContent = safeName;
  const idEl = document.createElement("div");
  idEl.className = "cf-custom-id";
  idEl.textContent = `CFOT ID: ${safeId}`;
  infoBox.appendChild(nameEl);
  infoBox.appendChild(idEl);

  overlay.appendChild(photoBox);
  overlay.appendChild(infoBox);

  front.appendChild(overlay);

  /** BACK CARD */
  const back = document.createElement("div");
  back.className = "cf-card cf-card-back new-design";
  back.style.position = "relative";
  // Inject the back template as an img so html2canvas can capture it reliably.
  const backImg = document.createElement("img");
  backImg.src = "img/back.png";
  backImg.alt = "Back Template";
  backImg.style.position = "absolute";
  backImg.style.top = "0";
  backImg.style.left = "0";
  backImg.style.width = "100%";
  backImg.style.height = "100%";
  backImg.style.objectFit = "cover";
  // See the note above about crossOrigin/referrerPolicy. We avoid
  // specifying these attributes on the back template so that
  // html2canvas can capture the image when running from file://.
  back.appendChild(backImg);

  // Optional QR overlay if a target is provided
  if (qrTarget) {
    const qrBox = document.createElement("div");
    qrBox.className = "cf-custom-qr";
    // maintain backward compatibility with existing submit.js which looks for #cardQrBox
    qrBox.id = "cardQrBox";
    const qrDiv = document.createElement("div");
    qrDiv.id = "generatedQr";
    qrDiv.setAttribute("data-qr-target", _esc(qrTarget));
    qrBox.appendChild(qrDiv);
    back.appendChild(qrBox);
  }

  wrapper.appendChild(front);
  wrapper.appendChild(back);

  return wrapper;
}

function _esc(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}