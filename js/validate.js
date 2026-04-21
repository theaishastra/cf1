/**
 * validate.js
 * ===========
 * Client-side form validation for the registration form.
 * Exports: validateForm() → { valid: boolean, errors: object }
 */

/**
 * Show or clear an error message for a field.
 * @param {string} fieldId
 * @param {string} message – empty string clears the error
 */
function setFieldError(fieldId, message) {
  const errEl = document.getElementById('err-' + fieldId);
  const inputEl = document.getElementById(fieldId) ||
                  document.querySelector(`[name="${fieldId}"]`);

  if (errEl) errEl.textContent = message;

  if (inputEl) {
    if (message) {
      inputEl.classList.add('error');
    } else {
      inputEl.classList.remove('error');
    }
  }
}

/**
 * Validate all form fields.
 * Returns { valid: boolean, errors: { fieldName: errorMessage } }
 */
function validateForm() {
  const errors = {};

  // 1. Full Name
  const fullName = (document.getElementById('fullName')?.value || '').trim();
  if (!fullName) {
    errors.fullName = 'Full name is required.';
  } else if (fullName.length < 3) {
    errors.fullName = 'Name must be at least 3 characters.';
  }

  // 2. Gender
  const gender = document.getElementById('gender')?.value || '';
  if (!gender) {
    errors.gender = 'Please select your gender.';
  }

  // 3. Age
  const age = parseInt(document.getElementById('age')?.value || '0', 10);
  if (!age || age < 1 || age > 120) {
    errors.age = 'Please enter a valid age (1–120).';
  }

  // 4. Relation
  const relation = document.getElementById('relation')?.value || '';
  if (!relation) {
    errors.relation = 'Please select your relation.';
  }

  // 5. Mobile Number
  const mobile = (document.getElementById('mobile')?.value || '').trim();
  const mobileRegex = /^[6-9]\d{9}$/;
  if (!mobile) {
    errors.mobile = 'Mobile number is required.';
  } else if (!mobileRegex.test(mobile)) {
    errors.mobile = 'Enter a valid 10-digit Indian mobile number.';
  }

  // 6. Email
  const email = (document.getElementById('email')?.value || '').trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    errors.email = 'Email address is required.';
  } else if (!emailRegex.test(email)) {
    errors.email = 'Enter a valid email address.';
  }

  // 7. Address
  const address = (document.getElementById('address')?.value || '').trim();
  if (!address) {
    errors.address = 'Address is required.';
  } else if (address.length < 10) {
    errors.address = 'Please enter your complete address.';
  }

  // 8. Aadhaar Photo (optional)
  const aadharInput = document.getElementById('aadharPhoto');
  if (aadharInput && aadharInput.files && aadharInput.files.length > 0) {
    const file = aadharInput.files[0];
    if (file.size > 10 * 1024 * 1024) {
      errors.aadhar = 'Aadhaar photo must be under 10MB.';
    }
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      errors.aadhar = 'Only JPG, PNG, or WebP images are allowed.';
    }
  }

  // 9. Passport Photo
  const selfieInput = document.getElementById('selfiePhoto');
  if (!selfieInput || !selfieInput.files || selfieInput.files.length === 0) {
    errors.selfie = 'Passport photo is required.';
  } else {
    const file = selfieInput.files[0];
    if (file.size > 10 * 1024 * 1024) {
      errors.selfie = 'Passport photo must be under 10MB.';
    }
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      errors.selfie = 'Only JPG, PNG, or WebP images are allowed.';
    }
  }

  // 10. Consent
  const consent = document.getElementById('consent')?.checked;
  if (!consent) {
    errors.consent = 'You must agree to the terms to proceed.';
  }

  // Apply errors to DOM
  const allFields = ['fullName','gender','age','relation','mobile','email','address','aadhar','selfie','consent'];
  allFields.forEach(f => setFieldError(f, errors[f] || ''));

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Wire up real-time validation on input/change events.
 * Called once from submit.js after DOM is ready.
 */
function attachRealTimeValidation() {
  const fieldMap = {
    fullName: () => {
      const v = (document.getElementById('fullName')?.value || '').trim();
      setFieldError('fullName', v.length < 3 && v.length > 0 ? 'Name must be at least 3 characters.' : '');
    },
    mobile: () => {
      const v = (document.getElementById('mobile')?.value || '').trim();
      const ok = /^[6-9]\d{9}$/.test(v);
      setFieldError('mobile', v && !ok ? 'Enter a valid 10-digit Indian mobile number.' : '');
    },
    email: () => {
      const v = (document.getElementById('email')?.value || '').trim();
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      setFieldError('email', v && !ok ? 'Enter a valid email address.' : '');
    },
  };

  Object.entries(fieldMap).forEach(([id, fn]) => {
    document.getElementById(id)?.addEventListener('input', fn);
  });
}
