document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const errorElem = document.getElementById('loginError');
  const showSignUpBtn = document.getElementById('showSignUp');
  const signUpFormContainer = document.getElementById('signUpForm');
  const registerForm = document.getElementById('registerForm');
  const googleLoginBtn = document.getElementById('googleLogin');
  const facebookLoginBtn = document.getElementById('facebookLogin');

  if (!loginForm) {
    console.error('Login form not found');
    return;
  }

  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value.trim();
      errorElem.classList.add('hidden');
      errorElem.textContent = '';

      console.log('Submitting login for:', email);

      try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        console.error('Login failed:', data.message);
        errorElem.textContent = data.message || 'Login failed';
        errorElem.classList.remove('hidden');
      } else {
        console.log('Login successful:', data);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('email', email);
        // Redirect based on user role
        if (data.user.role === 'admin') {
          window.location.href = 'admindashboard.html';
        } else {
          window.location.href = 'index.html';
        }
      }
    } catch (err) {
      console.error('Error during login:', err);
      errorElem.textContent = 'An error occurred during login.';
      errorElem.classList.remove('hidden');
    }
  });

  // Toggle sign-up form visibility
  showSignUpBtn.addEventListener('click', () => {
    if (signUpFormContainer.classList.contains('hidden')) {
      signUpFormContainer.classList.remove('hidden');
      loginForm.classList.add('hidden');
      errorElem.classList.add('hidden');
    } else {
      signUpFormContainer.classList.add('hidden');
      loginForm.classList.remove('hidden');
    }
  });

  // Handle sign-up form submission
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('emailSignUp').value.trim();
    const password = document.getElementById('passwordSignUp').value.trim();

    try {
      const response = await fetch('http://localhost:5000/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.message || 'Sign up failed');
      } else {
        alert('Sign up successful! Please log in.');
        signUpFormContainer.classList.add('hidden');
        loginForm.classList.remove('hidden');
      }
    } catch (err) {
      alert('An error occurred during sign up.');
      console.error('Sign up error:', err);
    }
  });

  // Handle Google login button click
  googleLoginBtn.addEventListener('click', () => {
    window.location.href = 'http://localhost:5000/auth/google';
  });

  // Handle Facebook login button click
  facebookLoginBtn.addEventListener('click', () => {
    window.location.href = 'http://localhost:5000/auth/facebook';
  });
});
