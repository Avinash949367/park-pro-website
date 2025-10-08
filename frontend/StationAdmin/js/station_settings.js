document.addEventListener('DOMContentLoaded', function() {
  const open24Radio = document.getElementById('open24');
  const customOpenRadio = document.getElementById('customOpen');
  const customTimingsDiv = document.getElementById('customTimings');
  const settingsForm = document.getElementById('settingsForm');

  // Toggle custom timings visibility
  function toggleCustomTimings() {
    if (customOpenRadio.checked) {
      customTimingsDiv.style.display = 'block';
    } else {
      customTimingsDiv.style.display = 'none';
    }
  }

  open24Radio.addEventListener('change', toggleCustomTimings);
  customOpenRadio.addEventListener('change', toggleCustomTimings);

  // Load current settings
  loadSettings();

  // Handle form submission
  settingsForm.addEventListener('submit', function(e) {
    e.preventDefault();
    saveSettings();
  });

  function loadSettings() {
    const token = localStorage.getItem('token');
    console.log('Token for loadSettings:', token);
    // Fetch current settings from backend
    fetch('http://localhost:5001/api/stations/settings', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (data.success) {
        if (data.settings.open24) {
          open24Radio.checked = true;
        } else {
          customOpenRadio.checked = true;
          document.getElementById('startTime').value = data.settings.startTime || '';
          document.getElementById('endTime').value = data.settings.endTime || '';
        }
        toggleCustomTimings();
      } else {
        console.error('Error loading settings:', data.message);
        alert('Error loading settings: ' + data.message);
      }
    })
    .catch(error => {
      console.error('Error loading settings:', error);
      alert('Error loading settings. Please check your authentication.');
    });
  }

  function saveSettings() {
    const token = localStorage.getItem('token');
    console.log('Token for saveSettings:', token);
    const isOpen24 = open24Radio.checked;
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;

    if (!isOpen24 && (!startTime || !endTime)) {
      alert('Please provide both start and end times for custom timings.');
      return;
    }

    const settings = {
      open24: isOpen24,
      startTime: isOpen24 ? null : startTime,
      endTime: isOpen24 ? null : endTime
    };

    fetch('http://localhost:5001/api/stations/settings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(settings)
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (data.success) {
        alert('Settings saved successfully!');
      } else {
        alert('Error saving settings: ' + data.message);
      }
    })
    .catch(error => {
      console.error('Error saving settings:', error);
      alert('Error saving settings. Please check your authentication.');
    });
  }
});
