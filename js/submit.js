/**
 * submit.js - Main form submission orchestrator
 */

document.addEventListener('DOMContentLoaded', () => {
  attachRealTimeValidation();
  setupImagePreviews();
  const form = document.getElementById('registrationForm');
  if (form) form.addEventListener('submit', handleSubmit);
});

function setupImagePreviews() {
  setupPreview('aadharPhoto', 'aadharPreview', 'aadharPlaceholder', 'aadharUploadBox');
  setupPreview('selfiePhoto',  'selfiePreview',  'selfiePlaceholder',  'selfieUploadBox');
}

function setupPreview(inputId, previewId, placeholderId, boxId) {
  const input       = document.getElementById(inputId);
  const preview     = document.getElementById(previewId);
  const placeholder = document.getElementById(placeholderId);
  const box         = document.getElementById(boxId);
  if (!input) return;
  input.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      preview.src = ev.target.result;
      preview.classList.add('visible');
      placeholder.style.display = 'none';
      box.classList.add('has-file');
    };
    reader.readAsDataURL(file);
  });
}

async function handleSubmit(e) {
  e.preventDefault();
  const { valid } = validateForm();
  if (!valid) {
    showGlobalError('Please fix the errors above before submitting.');
    return;
  }
  setLoadingState(true);
  hideGlobalError();

  try {
    const formData = collectFormData();

    updateProgress('Compressing images…');
    const aadharFile = document.getElementById('aadharPhoto').files[0];
    const selfieFile = document.getElementById('selfiePhoto').files[0];
    let aadharBlob = null;
    let selfieBlob;

    // Compress Aadhaar only if a file was provided. If the user leaves
    // Aadhaar photo blank, aadharBlob remains null and we skip uploading it.
    if (aadharFile) {
      aadharBlob = await compressAadhar(aadharFile);
    }
    // Always compress the selfie/passport photo (required)
    selfieBlob = await compressSelfie(selfieFile);
    // Convert the selfie blob to a Data URL for embedding into the card preview
    const selfieDataUrl = await blobToDataURL(selfieBlob);

    updateProgress('Generating Member ID…');
    const memberId = await fetchMemberId();

    updateProgress('Uploading photos…');
    let aadharPath = null;
    let selfiePath = null;
    // Upload the compressed selfie first (always required)
    selfiePath = await uploadSelfie(memberId, selfieBlob);
    // Upload Aadhaar only if provided. If not, leave the path as null.
    if (aadharBlob) {
      aadharPath = await uploadAadhar(memberId, aadharBlob);
    }

    updateProgress('Building your membership card…');
    const cardEl = buildCardElement({
      fullName:      formData.fullName,
      memberId,
      gender:        formData.gender,
      age:           formData.age,
      relation:      formData.relation,
      selfieDataUrl,
    });

    // Generate QR code on the back of the card
    const qrBox = cardEl.querySelector('#cardQrBox');
    if (qrBox && typeof QRCode !== 'undefined') {
      qrBox.innerHTML = '';
      new QRCode(qrBox, {
        text: `https://sncdbjltfhgimqnpwiso.supabase.co/verify?id=${memberId}`,
        width: 70,
        height: 70,
        colorDark: '#1a3561',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M,
      });
    }

    updateProgress('Generating PDF…');
    const pdfBlob = await generateCardPDF(cardEl);

    updateProgress('Uploading your card…');
    const cardPdfPath = await uploadCardPDF(memberId, pdfBlob);

    const cardDownloadUrl = await getSignedUrl(CONFIG.BUCKET_CARDS, cardPdfPath);

    updateProgress('Saving your registration…');
    await insertMemberRecord({ ...formData, memberId, aadharPath, selfiePath, cardPdfPath });

    updateProgress('Sending your card by email…');
    await sendCardEmail({ fullName: formData.fullName, email: formData.email, memberId, cardDownloadUrl });

    const successUrl = `pages/success.html?name=${encodeURIComponent(formData.fullName)}&id=${encodeURIComponent(memberId)}&email=${encodeURIComponent(formData.email)}`;
    window.location.href = successUrl;

  } catch (err) {
    console.error('Submission error:', err);
    showGlobalError(`Submission failed: ${err.message}. Please try again or contact us at 8328605200.`);
    setLoadingState(false);
  }
}

function collectFormData() {
  return {
    fullName: document.getElementById('fullName').value.trim(),
    gender:   document.getElementById('gender').value,
    age:      parseInt(document.getElementById('age').value, 10),
    relation: document.getElementById('relation').value,
    mobile:   document.getElementById('mobile').value.trim(),
    email:    document.getElementById('email').value.trim(),
    address:  document.getElementById('address').value.trim(),
    anyQuery: document.getElementById('anyQuery').value.trim(),
  };
}

async function fetchMemberId() {
  const url = `${CONFIG.SUPABASE_URL}/functions/v1/${CONFIG.FN_CREATE_MEMBER}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Member ID generation failed: ${text}`);
  }
  const json = await res.json();
  if (!json.memberId) throw new Error('Invalid response from member ID function');
  return json.memberId;
}

async function insertMemberRecord(data) {
  const { error } = await supabaseClient.from('members').insert([{
    full_name:     data.fullName,
    gender:        data.gender,
    age:           data.age,
    relation:      data.relation,
    mobile_number: data.mobile,
    email:         data.email,
    address:       data.address,
    any_query:     data.anyQuery || null,
    aadhar_path:   data.aadharPath,
    selfie_path:   data.selfiePath,
    member_id:     data.memberId,
    card_pdf_path: data.cardPdfPath,
    status:        'active',
    email_status:  'pending',
  }]);
  if (error) throw new Error(`Database insert failed: ${error.message}`);
}

async function sendCardEmail({ fullName, email, memberId, cardDownloadUrl }) {
  const url = `${CONFIG.SUPABASE_URL}/functions/v1/${CONFIG.FN_SEND_EMAIL}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ fullName, email, memberId, cardDownloadUrl }),
  });
  if (!res.ok) {
    const text = await res.text();
    console.warn('Email send warning:', text);
  }
}

function setLoadingState(loading) {
  const btn     = document.getElementById('submitBtn');
  const btnText = document.getElementById('btnText');
  const loader  = document.getElementById('btnLoader');
  if (!btn) return;
  btn.disabled = loading;
  btnText.classList.toggle('hidden', loading);
  loader.classList.toggle('hidden', !loading);
}

function updateProgress(message) {
  const el = document.getElementById('progressMsg');
  if (el) el.textContent = message;
}

function showGlobalError(msg) {
  const el = document.getElementById('globalError');
  if (el) {
    el.textContent = msg;
    el.classList.remove('hidden');
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function hideGlobalError() {
  const el = document.getElementById('globalError');
  if (el) el.classList.add('hidden');
}
