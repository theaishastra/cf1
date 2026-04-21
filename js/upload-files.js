/**
 * upload-files.js
 * ===============
 * Handles uploading compressed images and the generated PDF to Supabase Storage.
 *
 * Bucket layout:
 *   aadhar/{memberId}/aadhar.jpg
 *   selfie/{memberId}/selfie.jpg
 *   cards/{memberId}/card.pdf
 */

/**
 * Upload a Blob to a Supabase Storage bucket.
 *
 * @param {string} bucket     - Bucket name from CONFIG
 * @param {string} path       - File path inside the bucket
 * @param {Blob}   blob       - The data to upload
 * @param {string} contentType - MIME type
 * @returns {Promise<string>}  - The storage path on success
 */
async function uploadToStorage(bucket, path, blob, contentType) {
  const { data, error } = await supabaseClient.storage
    .from(bucket)
    .upload(path, blob, {
      contentType,
      upsert: true,       // allow re-upload if submission is retried
      cacheControl: '3600',
    });

  if (error) {
    throw new Error(`Storage upload failed (${bucket}/${path}): ${error.message}`);
  }

  return data.path; // returns the stored path
}

/**
 * Upload Aadhaar image blob.
 *
 * @param {string} memberId
 * @param {Blob}   blob
 * @returns {Promise<string>} storage path
 */
async function uploadAadhar(memberId, blob) {
  const path = `${memberId}/aadhar.jpg`;
  return uploadToStorage(CONFIG.BUCKET_AADHAR, path, blob, 'image/jpeg');
}

/**
 * Upload Selfie image blob.
 *
 * @param {string} memberId
 * @param {Blob}   blob
 * @returns {Promise<string>} storage path
 */
async function uploadSelfie(memberId, blob) {
  const path = `${memberId}/selfie.jpg`;
  return uploadToStorage(CONFIG.BUCKET_SELFIE, path, blob, 'image/jpeg');
}

/**
 * Upload PDF blob (the health card).
 *
 * @param {string} memberId
 * @param {Blob}   pdfBlob
 * @returns {Promise<string>} storage path
 */
async function uploadCardPDF(memberId, pdfBlob) {
  const path = `${memberId}/card.pdf`;
  return uploadToStorage(CONFIG.BUCKET_CARDS, path, pdfBlob, 'application/pdf');
}

/**
 * Get a signed (time-limited) public URL for a stored file.
 * Used to send the download link via email.
 *
 * @param {string} bucket
 * @param {string} filePath
 * @param {number} expiresInSeconds - default 1 year
 * @returns {Promise<string>} signed URL
 */
async function getSignedUrl(bucket, filePath, expiresInSeconds = 31536000) {
  const { data, error } = await supabaseClient.storage
    .from(bucket)
    .createSignedUrl(filePath, expiresInSeconds);

  if (error) {
    throw new Error(`Failed to get signed URL: ${error.message}`);
  }

  return data.signedUrl;
}
