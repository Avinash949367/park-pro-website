document.addEventListener('DOMContentLoaded', () => {
  const totalUsersElem = document.getElementById('totalUsers');
  const usersTableBody = document.getElementById('usersTableBody');
  const userDetailsModal = document.getElementById('userDetailsModal');
  const userDetailsContent = document.getElementById('userDetailsContent');
  const closeModalBtn = document.getElementById('closeModal');

  // Function to fetch total users count
  async function fetchTotalUsers() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/users/count', {
        headers: {
          'Authorization': 'Bearer ' + token,
        },
      });
      if (response.status === 401) {
        console.error('Unauthorized: Token may be invalid or expired');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'userlogin.html';
        return;
      }
      if (!response.ok) throw new Error('Failed to fetch total users');
      const data = await response.json();
      totalUsersElem.textContent = data.totalUsers;
    } catch (err) {
      console.error(err);
      totalUsersElem.textContent = 'Error';
    }
  }

  // Function to fetch users list
  async function fetchUsersList() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/users/list', {
        headers: {
          'Authorization': 'Bearer ' + token,
        },
      });
      if (response.status === 401) {
        console.error('Unauthorized: Token may be invalid or expired');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'userlogin.html';
        return;
      }
      if (!response.ok) throw new Error('Failed to fetch users list');
      const data = await response.json();
      renderUsersList(data.users);
    } catch (err) {
      console.error(err);
      usersTableBody.innerHTML = '<tr><td colspan="5">Error loading users</td></tr>';
    }
  }

  // Function to render users list in table
  function renderUsersList(users) {
    usersTableBody.innerHTML = '';
    users.forEach(user => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td>${user.role}</td>
        <td>${user.password ? user.password : ''}</td>
        <td><button class="view-details-btn" data-user='${JSON.stringify(user)}'>View Details</button></td>
      `;
      usersTableBody.appendChild(tr);
    });

    // Add event listeners for view details buttons
    document.querySelectorAll('.view-details-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const user = JSON.parse(e.target.getAttribute('data-user'));
        showUserDetails(user);
      });
    });
  }

  // Function to show user details in modal
  function showUserDetails(user) {
    userDetailsContent.innerHTML = `
      <p><strong>Name:</strong> ${user.name}</p>
      <p><strong>Email:</strong> ${user.email}</p>
      <p><strong>Role:</strong> ${user.role}</p>
      <p><strong>Password:</strong> ${user.password ? user.password : ''}</p>
    `;
    userDetailsModal.style.display = 'block';
  }

  // Close modal event
  closeModalBtn.addEventListener('click', () => {
    userDetailsModal.style.display = 'none';
  });

  // Close modal on outside click
  window.addEventListener('click', (event) => {
    if (event.target === userDetailsModal) {
      userDetailsModal.style.display = 'none';
    }
  });

  // Profile menu toggle
  const profileButton = document.getElementById('profileButton');
  const profileMenu = document.getElementById('profileMenu');
  profileButton.addEventListener('click', () => {
    profileMenu.classList.toggle('hidden');
  });

  // Logout button
  const logoutButton = document.getElementById('logoutButton');
  logoutButton.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'userlogin.html';
  });

  // Function to clear users except admins
  async function clearUsers() {
    if (!confirm('Are you sure you want to delete all users except admins? This action cannot be undone.')) {
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/users/clear', {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer ' + token,
        },
      });
      if (response.status === 401) {
        console.error('Unauthorized: Token may be invalid or expired');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'userlogin.html';
        return;
      }
      if (!response.ok) throw new Error('Failed to clear users');
      alert('Users cleared successfully');
      fetchTotalUsers();
      fetchUsersList();
    } catch (err) {
      console.error(err);
      alert('Error clearing users');
    }
  }

  // Add event listener for clear users button
  const clearUsersBtn = document.getElementById('clearUsersBtn');
  clearUsersBtn.addEventListener('click', clearUsers);

  // Initial fetch
  fetchTotalUsers();
  fetchUsersList();
});
