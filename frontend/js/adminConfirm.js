document.addEventListener('DOMContentLoaded', () => {
  const stationsList = document.getElementById('adminConfirmStationsList');

  // Fetch and display stations with status 'admin confirm'
  async function fetchStations() {
    try {
      const backendBaseUrl = 'http://localhost:5000'; // Adjust if your backend runs on a different URL or port
      const statusParam = encodeURIComponent('admin confirm');
      const response = await fetch(`${backendBaseUrl}/api/stations/status/${statusParam}`);
      if (!response.ok) throw new Error('Failed to fetch stations');
      const stations = await response.json();

      stationsList.innerHTML = '';
      if (stations.length === 0) {
        stationsList.innerHTML = '<li class="text-gray-600">No stations awaiting final confirmation.</li>';
      } else {
        stations.forEach(station => {
          const li = document.createElement('li');
          li.className = 'flex justify-between items-center border p-4 rounded bg-white shadow';

          const infoDiv = document.createElement('div');
          infoDiv.innerHTML = `<strong>${station.name}</strong><br/><small>${station.location}</small>`;

          const confirmBtn = document.createElement('button');
          confirmBtn.textContent = 'Final Confirm';
          confirmBtn.className = 'bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700';
          confirmBtn.addEventListener('click', () => finalConfirmStation(station._id));

          li.appendChild(infoDiv);
          li.appendChild(confirmBtn);
          stationsList.appendChild(li);
        });
      }
    } catch (error) {
      console.error(error);
      stationsList.innerHTML = '<li class="text-red-600">Error loading stations.</li>';
    }
  }

  // Final confirm station - update status to 'active' and send credentials
  async function finalConfirmStation(stationId) {
    try {
      const backendBaseUrl = 'http://localhost:5000';
      // First update station status
      const statusResponse = await fetch(`${backendBaseUrl}/api/stations/${stationId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      });
      if (!statusResponse.ok) throw new Error('Failed to update station status');
      
      // Get station details to send credentials
      const stationResponse = await fetch(`${backendBaseUrl}/api/stations/${stationId}`);
      if (!stationResponse.ok) throw new Error('Failed to fetch station details');
      const station = await stationResponse.json();
      
      // Send credentials email
      const emailResponse = await fetch(`${backendBaseUrl}/api/send-credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: station.email,
          password: 'store@Login.1',
          stationName: station.name
        }),
      });
      if (!emailResponse.ok) throw new Error('Failed to send credentials email');

      await fetchStations();
      alert('Station confirmed successfully! Login credentials sent to ' + station.email);
    } catch (error) {
      console.error(error);
      alert('Failed to finalize confirmation. Please try again.');
    }
  }

  // Initial fetch
  fetchStations();
});
