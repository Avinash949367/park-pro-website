// JavaScript for register-spot.html multi-step form with map and validation

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registrationForm');
  const steps = Array.from(document.querySelectorAll('.step'));
  const progressbarItems = Array.from(document.querySelectorAll('#progressbar li'));
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const toastEl = document.getElementById('toast');
  const toastBody = document.getElementById('toastBody');
  let currentStep = 0;

  // Initialize Google Map variables
  let map;
  let marker;

  // Leaflet map variables for reviews
  let leafletMap;
  let leafletMarkers = [];

  // Show current step
  function showStep(index) {
    steps.forEach((step, i) => {
      step.classList.toggle('active', i === index);
      step.setAttribute('aria-hidden', i !== index);
    });
    progressbarItems.forEach((item, i) => {
      item.classList.toggle('active', i <= index);
    });
    prevBtn.disabled = index === 0;
    nextBtn.textContent = index === steps.length - 1 ? 'Submit' : 'Next';
    if (index === steps.length - 1) {
      populateReview();
      // Initialize Leaflet map when step 5 is shown
      initLeafletMap();
    }
  }

  // Validate current step inputs
  function validateStep() {
    const step = steps[currentStep];
    let valid = true;

    // Validate required inputs
    const requiredInputs = step.querySelectorAll('[required]');
    requiredInputs.forEach(input => {
      if (input.type === 'checkbox') {
        // For checkboxes, check if at least one is checked in group
        if (input.name === 'allowedVehicles') {
          const checkboxes = step.querySelectorAll('input[name="allowedVehicles"]');
          const anyChecked = Array.from(checkboxes).some(cb => cb.checked);
          if (!anyChecked) {
            valid = false;
            showInvalidFeedback(checkboxes[0], true);
          } else {
            showInvalidFeedback(checkboxes[0], false);
          }
        }
      } else if (!input.value.trim()) {
        valid = false;
        showInvalidFeedback(input, true);
      } else {
        showInvalidFeedback(input, false);
      }
    });

    // Additional validation for phone pattern
    if (currentStep === 3) {
      const phoneInput = document.getElementById('ownerPhone');
      const phonePattern = /^\+?[0-9-\s]{7,15}$/;
      if (phoneInput.value.trim() && !phonePattern.test(phoneInput.value.trim())) {
        valid = false;
        showInvalidFeedback(phoneInput, true);
      }
    }

    return valid;
  }

  // Show or hide invalid feedback for an input
  function showInvalidFeedback(input, show) {
    const feedback = input.closest('div, fieldset').querySelector('.invalid-feedback');
    if (feedback) {
      feedback.classList.toggle('hidden', !show);
    }
  }

  // Populate review summary on last step
  function populateReview() {
    const reviewDiv = document.getElementById('reviewSummary');
    const formData = new FormData(form);
    let html = '<ul class="list-disc pl-5 space-y-1 text-gray-700">';
    html += `<li><strong>Spot Name:</strong> ${formData.get('spotName')}</li>`;
    html += `<li><strong>Address:</strong> ${formData.get('address')}</li>`;
    html += `<li><strong>Parking Type:</strong> ${formData.get('parkingType')}</li>`;
    html += `<li><strong>Number of Slots:</strong> ${formData.get('numSlots')}</li>`;

    const vehicles = formData.getAll('allowedVehicles').join(', ');
    html += `<li><strong>Allowed Vehicles:</strong> ${vehicles}</li>`;
    html += `<li><strong>Hourly Rate:</strong> $${formData.get('hourlyRate')}</li>`;
    html += `<li><strong>Daily Rate:</strong> $${formData.get('dailyRate')}</li>`;
    html += `<li><strong>Monthly Rate:</strong> $${formData.get('monthlyRate')}</li>`;

    html += `<li><strong>Open Time:</strong> ${formData.get('openTime')}</li>`;
    html += `<li><strong>Close Time:</strong> ${formData.get('closeTime')}</li>`;
    html += `<li><strong>Open 24/7:</strong> ${formData.get('open247') ? 'Yes' : 'No'}</li>`;

    html += `<li><strong>Owner Name:</strong> ${formData.get('ownerName')}</li>`;
    html += `<li><strong>Owner Email:</strong> ${formData.get('ownerEmail')}</li>`;
    html += `<li><strong>Owner Phone:</strong> ${formData.get('ownerPhone')}</li>`;

    html += `<li><strong>Latitude:</strong> ${formData.get('latitude')}</li>`;
    html += `<li><strong>Longitude:</strong> ${formData.get('longitude')}</li>`;
    html += `<li><strong>IoT GPS Serial Number:</strong> ${formData.get('iotSerial') || 'N/A'}</li>`;

    html += '</ul>';
    reviewDiv.innerHTML = html;
  }

  // Handle next button click
  nextBtn.addEventListener('click', () => {
    if (!validateStep()) {
      showToast('Please fill all required fields correctly.', 'bg-danger');
      return;
    }
    if (currentStep === steps.length - 1) {
      submitForm();
    } else {
      currentStep++;
      showStep(currentStep);
    }
  });

  // Handle previous button click
  prevBtn.addEventListener('click', () => {
    if (currentStep > 0) {
      currentStep--;
      showStep(currentStep);
    }
  });

  // Toast notification helper
  function showToast(message, bgClass = 'bg-primary') {
    toastBody.textContent = message;
    toastEl.className = 'toast align-items-center text-white ' + bgClass + ' border-0';
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
  }

  // Initialize Google Map

  // Use browser geolocation to set marker position
  document.getElementById('useLocationBtn').addEventListener('click', () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          map.setCenter(pos);
          marker.setPosition(pos);
          document.getElementById('latitude').value = pos.lat.toFixed(6);
          document.getElementById('longitude').value = pos.lng.toFixed(6);
          showToast('Location fetched successfully.', 'bg-success');
        },
        () => {
          showToast('Failed to get your location.', 'bg-danger');
        }
      );
    } else {
      showToast('Geolocation is not supported by your browser.', 'bg-danger');
    }
  });

  // Upload preview handlers
  function handleFilePreview(inputId, previewId) {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);

    input.addEventListener('change', () => {
      preview.innerHTML = '';
      Array.from(input.files).forEach((file, index) => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          const div = document.createElement('div');
          div.classList.add('relative');
          div.style.position = 'relative';
          const img = document.createElement('img');
          img.src = e.target.result;
          img.alt = file.name;
          img.title = file.name;
          div.appendChild(img);

          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'remove-btn';
          btn.innerHTML = '&times;';
          btn.addEventListener('click', () => {
            const dt = new DataTransfer();
            Array.from(input.files)
              .filter((_, i) => i !== index)
              .forEach(f => dt.items.add(f));
            input.files = dt.files;
            div.remove();
          });
          div.appendChild(btn);

          preview.appendChild(div);
        };
        reader.readAsDataURL(file);
      });
    });
  }

  handleFilePreview('parkingPhotos', 'parkingPhotosPreview');
  handleFilePreview('ownershipDocs', 'ownershipDocsPreview');

  // Submit form data via API call
  function submitForm() {
    const formData = new FormData(form);

    // Show loading spinner on submit button
    nextBtn.disabled = true;
    nextBtn.textContent = 'Submitting...';

    fetch('/api/parking-spots', {
      method: 'POST',
      body: formData,
    })
      .then(async (response) => {
        nextBtn.disabled = false;
        nextBtn.textContent = 'Submit';
        if (response.ok) {
          showToast('Parking spot registered successfully!', 'bg-success');
          form.reset();
          currentStep = 0;
          showStep(currentStep);
          // Clear previews
          document.getElementById('parkingPhotosPreview').innerHTML = '';
          document.getElementById('ownershipDocsPreview').innerHTML = '';
          // Reset map marker to default
          const defaultPos = { lat: 37.7749, lng: -122.4194 };
          map.setCenter(defaultPos);
          marker.setPosition(defaultPos);
          document.getElementById('latitude').value = defaultPos.lat.toFixed(6);
          document.getElementById('longitude').value = defaultPos.lng.toFixed(6);
        } else {
          const errorData = await response.json();
          showToast(errorData.message || 'Failed to register parking spot.', 'bg-danger');
        }
      })
      .catch(() => {
        nextBtn.disabled = false;
        nextBtn.textContent = 'Submit';
        showToast('Network error. Please try again later.', 'bg-danger');
      });
  }

  // Initialize map after Google Maps script loads
  window.initMap = initMap;

  // Show initial step
  showStep(currentStep);
});
