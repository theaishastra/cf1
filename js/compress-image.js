/**
 * compress-image.js
 * =================
 * Compresses an image File using a canvas element.
 * Returns a Promise<Blob>.
 *
 * Target sizes:
 *   - Aadhaar: maxWidth 1200px, quality 0.70 → ~300–500 KB
 *   - Selfie:  maxWidth 800px,  quality 0.65 → ~200–400 KB
 */

/**
 * Compress an image file.
 *
 * @param {File} file            - Original image File object
 * @param {number} maxWidth      - Maximum width in pixels
 * @param {number} maxHeight     - Maximum height in pixels
 * @param {number} quality       - JPEG quality 0.0–1.0
 * @param {string} outputType    - MIME type ('image/jpeg' | 'image/png')
 * @returns {Promise<Blob>}      - Compressed image Blob
 */
function compressImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.70, outputType = 'image/jpeg') {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions while preserving aspect ratio
        let { width, height } = img;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width  = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        // White background for transparent PNGs converted to JPEG
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas toBlob failed'));
              return;
            }
            resolve(blob);
          },
          outputType,
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = event.target.result;
    };

    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Compress Aadhaar photo.
 * Target: ~300–500 KB JPEG
 *
 * @param {File} file
 * @returns {Promise<Blob>}
 */
function compressAadhar(file) {
  return compressImage(file, 1200, 1200, 0.70, 'image/jpeg');
}

/**
 * Compress Selfie photo.
 * Target: ~200–400 KB JPEG
 *
 * @param {File} file
 * @returns {Promise<Blob>}
 */
function compressSelfie(file) {
  return compressImage(file, 800, 800, 0.65, 'image/jpeg');
}

/**
 * Read a Blob as a base64 data URL.
 * Used by card-builder.js to embed the selfie image in the card HTML.
 *
 * @param {Blob} blob
 * @returns {Promise<string>} data URL
 */
function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read blob'));
    reader.readAsDataURL(blob);
  });
}
