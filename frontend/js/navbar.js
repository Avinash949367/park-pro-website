export function getNavbarHTML() {
  return `
  <style>
    .option {
      text-decoration: none;       /* Remove underline */
      color: #1e3740;              /* Dark teal text color */
      padding: 8px 12px;           /* Spacing around text */
      border-radius: 8px;          /* Rounded corners */
      transition: all 0.3s ease;   /* Smooth hover transition */
      font-weight: 500;
    }

    /* Hover effect */
    .option:hover {
      color: white;                /* Text turns white */
      background-color: #46949d;   /* Medium teal background on hover */
      box-shadow: 0 2px 6px rgb(18, 105, 28); /* Subtle shadow */
    }
  </style>

  <div class=" bg-white bg-opacity-90 backdrop-blur-md text-gray-900 p-4 flex justify-between items-center z-50 border-b border-gray-200">
    <a href="index.html"><div class="flex items-center space-x-4">
      <img src="assets/images/logo_edited-removebg-preview.png" alt="Park Pro Logo" class="h-20 w-15 object-contain" loading="lazy" />
      <img src="assets/images/parkproText-removebg-preview.png" alt="Park Pro Logo" class="h-20 w-15 object-contain" loading="lazy" />
    </div></a>
    <nav class="space-x-6 hidden md:flex font-medium">
      <a href="index.html" class="option">About us</a>
      <a href="#" class="option">Park Pro For Business</a>
      <a href="#" class="option">Products</a>
      <a href="#" class="option">Contact</a>
    </nav>
    <div id="loginProfileContainer" class="relative inline-block flex space-x-4 items-center">
      <a href="userlogin.html" id="loginButton" class="bg-black font-bold text-white px-6 py-2 rounded-lg hover:opacity-90 transition transform hover:scale-110 duration-300 cursor-pointer">Login</a>
      <a href="#" id="getAppButton" class="text-white rounded-lg px-6 py-2 cursor-pointer font-bold bg-black hover:bg-orange-600 transition transform hover:scale-110 duration-300">
        Get the App
      </a>
      <div id="profileContainer" class="hidden relative">
        <div id="profileAvatar" class="h-8 w-8 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center font-semibold text-lg"></div>
        <div id="profileDropdown" class="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-4 z-20 opacity-0 invisible transform -translate-y-2 transition-all duration-300">
          <div class="px-4 flex items-center space-x-4 border-b border-gray-200 pb-4">
            <div id="dropdownAvatar" class="h-12 w-12 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center font-semibold text-xl"></div>
            <div>
              <p class="font-semibold text-gray-900" id="userName">User</p>
              <p class="text-sm text-gray-600" id="userEmail">user@example.com</p>
            </div>
          </div>
          <button id="logoutButton" class="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-200 mt-4">Logout</button>
        </div>
      </div>
  </div>
  </div>
  `;
}
