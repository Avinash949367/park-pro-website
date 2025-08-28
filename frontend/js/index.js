// Removed card toggle related code from index.js as it is now handled by cardToggle.js

document.addEventListener('DOMContentLoaded', () => {
  const profileContainer = document.getElementById('profileContainer');
  const loginButton = document.getElementById('loginButton');
  const profileDropdown = document.getElementById('profileDropdown');
  const userNameElem = document.getElementById('userName');
  const logoutButton = document.getElementById('logoutButton');
  const profileAvatar = document.getElementById('profileAvatar');

  // Function to decode JWT token payload
  function parseJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }

  // Check for token and user data in URL parameters (for OAuth redirects)
  const urlParams = new URLSearchParams(window.location.search);
  const urlToken = urlParams.get('token');
  const urlUser = urlParams.get('user');
  const urlEmail = urlParams.get('email');
  
  if (urlToken) {
    // Store the token from URL in localStorage
    localStorage.setItem('token', urlToken);
    
    // Store user data if available
    if (urlUser) {
      try {
        const userData = JSON.parse(decodeURIComponent(urlUser));
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (e) {
        console.error('Error parsing user data from URL:', e);
      }
    }
    
    // Store email if available
    if (urlEmail) {
      localStorage.setItem('email', decodeURIComponent(urlEmail));
    }
    
    // Remove token and user data from URL to prevent showing it in the address bar
    const newUrl = window.location.pathname;
    window.history.replaceState({}, document.title, newUrl);
  }

  const token = localStorage.getItem('token');
  if (token) {
    // Hide login button
    if (loginButton) loginButton.style.display = 'none';

    // Show profile container
    if (profileContainer) {
      profileContainer.style.display = 'inline-block';
      profileContainer.classList.remove('hidden');
    }

    // Parse token to get user info
    const user = parseJwt(token);
    if (userNameElem && user) {
      userNameElem.textContent = user.name || 'User';
    }
    // Set avatar initials and user email from localStorage
    const dropdownAvatar = document.getElementById('dropdownAvatar');
    const userEmailElem = document.getElementById('userEmail');
    const storedUser = localStorage.getItem('user');
    const storedEmail = localStorage.getItem('email');
    if (profileAvatar && dropdownAvatar && storedUser) {
      try {
        const userObj = JSON.parse(storedUser);
        const initials = userObj.name.split(' ').map(n => n[0]).join('').toUpperCase();
        profileAvatar.textContent = initials;
        dropdownAvatar.textContent = initials;
        if (userNameElem) userNameElem.textContent = userObj.name || 'User';
      } catch {
        // fallback to token user name
        const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
        profileAvatar.textContent = initials;
        dropdownAvatar.textContent = initials;
      }
    }
    if (userEmailElem && storedEmail) {
      userEmailElem.textContent = storedEmail;
    }

    // Remove hover dropdown behavior, keep only click redirect to userprofile.html
    if (profileAvatar) {
      // Remove any existing event listeners for hover if needed (not strictly necessary here)
      // Add click event to redirect to userprofile.html
      profileAvatar.addEventListener('click', () => {
        console.log('Profile avatar clicked, redirecting to userprofile.html');
        window.location.href = 'userprofile.html';
      });
    }

    // Logout button clears token and reloads page
    if (logoutButton) {
      logoutButton.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
      });
    }

    // Close dropdown if clicked outside
    document.addEventListener('click', (event) => {
      if (profileDropdown && profileContainer && !profileContainer.contains(event.target)) {
        profileDropdown.style.opacity = '0';
        profileDropdown.style.visibility = 'hidden';
        profileDropdown.style.transform = 'translateY(-10px)';
      }
    });
  } else {
    // No token, show login button and hide profile container
    if (loginButton) loginButton.style.display = 'inline-block';
    if (profileContainer) {
      profileContainer.style.display = 'none';
      profileContainer.classList.add('hidden');
    }
  }
});
