document.addEventListener('DOMContentLoaded', () => {
  const messageIcon = document.getElementById('messageIcon');
  const messageBadge = document.getElementById('messageBadge');
  const receivedStationsPopup = document.getElementById('receivedStationsPopup');
  const closePopupBtn = document.getElementById('closePopup');
  const receivedStationsList = document.getElementById('receivedStationsList');

  const backendBaseUrl = 'http://localhost:5001'; // Adjust if your backend runs on a different URL or port

  // Fetch count of pending registrations and update badge
  async function updatePendingCount() {
    try {
      const response = await fetch(`${backendBaseUrl}/api/registrations/pending`);
      if (!response.ok) throw new Error('Failed to fetch pending registrations');
      const registrations = await response.json();
      if (registrations.length > 0) {
        messageBadge.textContent = registrations.length;
        messageBadge.classList.remove('hidden');
      } else {
        messageBadge.classList.add('hidden');
      }
    } catch (error) {
      console.error(error);
    }
  }

  // Fetch and display pending registrations in popup
  async function showPendingRegistrations() {
    try {
      const response = await fetch(`${backendBaseUrl}/api/registrations/pending`);
      if (!response.ok) throw new Error('Failed to fetch pending registrations');
      const registrations = await response.json();

      receivedStationsList.innerHTML = '';
      if (registrations.length === 0) {
        receivedStationsList.innerHTML = '<li class="text-gray-600">No pending registrations found.</li>';
      } else {
        registrations.forEach(registration => {
          const li = document.createElement('li');
          li.className = 'flex justify-between items-center border p-2 rounded';

          const infoDiv = document.createElement('div');
          infoDiv.innerHTML = `<strong>${registration.name}</strong><br/><small>${registration.email}</small><br/><small>${registration.address}</small>`;

          const approveBtn = document.createElement('button');
          approveBtn.textContent = 'Approve';
          approveBtn.className = 'bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 mr-2';
          approveBtn.addEventListener('click', () => approveRegistration(registration._id));

          const rejectBtn = document.createElement('button');
          rejectBtn.textContent = 'Reject';
          rejectBtn.className = 'bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600';
          rejectBtn.addEventListener('click', () => rejectRegistration(registration._id));

          li.appendChild(infoDiv);
          li.appendChild(approveBtn);
          li.appendChild(rejectBtn);
          receivedStationsList.appendChild(li);
        });
      }

      receivedStationsPopup.classList.remove('hidden');
    } catch (error) {
      console.error(error);
    }
  }

  // Confirm station - update status to 'admin confirm'
  async function confirmStation(stationId) {
    try {
      const response = await fetch(`${backendBaseUrl}/api/stations/${stationId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'admin confirm' }),
      });
      if (!response.ok) throw new Error('Failed to update station status');
      await updateReceivedCount();
      await showReceivedStations();
      await loadActiveStations();
    } catch (error) {
      console.error(error);
      alert('Failed to confirm station. Please try again.');
    }
  }

  // Load and display active stations
  async function loadActiveStations() {
    try {
      const response = await fetch(`${backendBaseUrl}/api/stations/status/active`);
      if (!response.ok) throw new Error('Failed to fetch active stations');
      const stations = await response.json();

      const activeStationsContainer = document.getElementById('activeStationsContainer');
      if (!activeStationsContainer) return;

      activeStationsContainer.innerHTML = '';
      if (stations.length === 0) {
        activeStationsContainer.innerHTML = '<p class="text-gray-600">No active stations found.</p>';
      } else {
        const ul = document.createElement('ul');
        ul.className = 'space-y-2';
        stations.forEach(station => {
          const li = document.createElement('li');
          li.className = 'border p-2 rounded bg-white shadow';

          li.innerHTML = `<strong>${station.name}</strong><br/><small>${station.location}</small>`;
          ul.appendChild(li);
        });
        activeStationsContainer.appendChild(ul);
      }
    } catch (error) {
      console.error(error);
    }
  }

  // Approve registration
  async function approveRegistration(registrationId) {
    try {
      const response = await fetch(`${backendBaseUrl}/api/registrations/approve/${registrationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvedBy: 'admin' }),
      });
      if (!response.ok) throw new Error('Failed to approve registration');
      await updatePendingCount();
      await showPendingRegistrations();
    } catch (error) {
      console.error(error);
      alert('Failed to approve registration. Please try again.');
    }
  }

  // Reject registration
  async function rejectRegistration(registrationId) {
    const rejectionReason = prompt('Please enter the reason for rejection:');
    if (!rejectionReason) return;

    try {
      const response = await fetch(`${backendBaseUrl}/api/registrations/reject/${registrationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectedBy: 'admin', rejectionReason }),
      });
      if (!response.ok) throw new Error('Failed to reject registration');
      await updatePendingCount();
      await showPendingRegistrations();
    } catch (error) {
      console.error(error);
      alert('Failed to reject registration. Please try again.');
    }
  }

  // Event listeners
  messageIcon.addEventListener('click', showPendingRegistrations);
  closePopupBtn.addEventListener('click', () => {
    receivedStationsPopup.classList.add('hidden');
  });

  // Add click event listener for checkingIcon to redirect to adminConfirm.html
  const checkingIcon = document.getElementById('checkingIcon');
  if (checkingIcon) {
    checkingIcon.addEventListener('click', () => {
      window.location.href = 'adminConfirm.html';
    });
  }

  // Initial badge update and load active stations
  updatePendingCount();
  loadActiveStations();

  // New code for admin dashboard user loading
  async function loadUsers() {
  }

  // Call loadUsers if on admin dashboard page
  if (document.getElementById('usersTableBody')) {
  }
});
