// Navbar login/logout UI state management

document.addEventListener('DOMContentLoaded', () => {
  const loginButton = document.getElementById('loginButton');
  const profileContainer = document.getElementById('profileContainer');
  const logoutButton = document.getElementById('logoutButton');
  const profileDropdown = document.getElementById('profileDropdown');

  function updateNavbarUI() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    console.log('NavbarAuth: isLoggedIn =', isLoggedIn);
    if (isLoggedIn) {
      loginButton.classList.add('hidden');
      profileContainer.classList.remove('hidden');
    } else {
      loginButton.classList.remove('hidden');
      profileContainer.classList.add('hidden');
      if (profileDropdown) {
        profileDropdown.classList.add('opacity-0', 'invisible', '-translate-y-2');
        profileDropdown.classList.remove('opacity-100', 'visible', 'translate-y-0');
      }
    }
  }

  // Initial UI update on page load
  updateNavbarUI();

  // Logout button click handler
  logoutButton.addEventListener('click', () => {
    console.log('NavbarAuth: Logout clicked');
    // Clear login state
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('email');
    localStorage.removeItem('isLoggedIn');

    // Update navbar UI
    updateNavbarUI();

    // Redirect to login page or homepage
    window.location.href = 'userlogin.html';
  });
});
