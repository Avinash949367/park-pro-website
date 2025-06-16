document.addEventListener('DOMContentLoaded', () => {
  const messageIcon = document.getElementById('messageIcon');
  const messageBadge = document.getElementById('messageBadge');
  const receivedStationsPopup = document.getElementById('receivedStationsPopup');
  const closePopupBtn = document.getElementById('closePopup');
  const receivedStationsList = document.getElementById('receivedStationsList');

  const backendBaseUrl = 'http://localhost:5000'; // Adjust if your backend runs on a different URL or port

  // Fetch count of received stations and update badge
  async function updateReceivedCount() {
    try {
      const response = await fetch(`${backendBaseUrl}/api/stations/status/received`);
      if (!response.ok) throw new Error('Failed to fetch received stations');
      const stations = await response.json();
      if (stations.length > 0) {
        messageBadge.textContent = stations.length;
        messageBadge.classList.remove('hidden');
      } else {
        messageBadge.classList.add('hidden');
      }
    } catch (error) {
      console.error(error);
    }
  }

  // Fetch and display received stations in popup
  async function showReceivedStations() {
    try {
      const response = await fetch(`${backendBaseUrl}/api/stations/status/received`);
      if (!response.ok) throw new Error('Failed to fetch received stations');
      const stations = await response.json();

      receivedStationsList.innerHTML = '';
      if (stations.length === 0) {
        receivedStationsList.innerHTML = '<li class="text-gray-600">No stations with status "received".</li>';
      } else {
        stations.forEach(station => {
          const li = document.createElement('li');
          li.className = 'flex justify-between items-center border p-2 rounded';

          const infoDiv = document.createElement('div');
          infoDiv.innerHTML = `<strong>${station.name}</strong><br/><small>${station.location}</small>`;

          const confirmBtn = document.createElement('button');
          confirmBtn.textContent = 'Confirm';
          confirmBtn.className = 'bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600';
          confirmBtn.addEventListener('click', () => confirmStation(station._id));

          li.appendChild(infoDiv);
          li.appendChild(confirmBtn);
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

  // Event listeners
  messageIcon.addEventListener('click', showReceivedStations);
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
  updateReceivedCount();
  loadActiveStations();

  // New code for admin dashboard user loading
  async function loadUsers() {
  }

  // Call loadUsers if on admin dashboard page
  if (document.getElementById('usersTableBody')) {
  }
});
