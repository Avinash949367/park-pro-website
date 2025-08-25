// User Profile API Integration
class UserProfileAPI {
    constructor() {
        this.baseURL = 'http://localhost:5000/api/user';
        this.token = localStorage.getItem('token');
    }

    // Set authorization header
    getAuthHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
        };
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.token;
    }

    // Redirect to login if not authenticated
    checkAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'userlogin.html';
            return false;
        }
        return true;
    }

    // Get user profile data
    async getUserProfile() {
        if (!this.checkAuth()) return null;

        try {
            const response = await fetch(`${this.baseURL}/profile`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            if (response.status === 401) {
                // Token expired or invalid
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'userlogin.html';
                return null;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                // Store user data in localStorage for quick access
                localStorage.setItem('user', JSON.stringify(data.user));
                return data.user;
            } else {
                throw new Error(data.message || 'Failed to fetch profile');
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
            this.showError('Failed to load profile data');
            return null;
        }
    }

    // Update user profile
    async updateUserProfile(profileData) {
        if (!this.checkAuth()) return null;

        try {
            const response = await fetch(`${this.baseURL}/profile`, {
                method: 'PUT',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(profileData)
            });

            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'userlogin.html';
                return null;
            }

            const data = await response.json();
            
            if (data.success) {
                // Update localStorage with new user data
                const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                const updatedUser = { ...currentUser, ...profileData };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                
                return data;
            } else {
                throw new Error(data.message || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            this.showError('Failed to update profile');
            return null;
        }
    }

    // Change password
    async changePassword(passwordData) {
        if (!this.checkAuth()) return null;

        try {
            const response = await fetch(`${this.baseURL}/profile/change-password`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(passwordData)
            });

            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'userlogin.html';
                return null;
            }

            const data = await response.json();
            
            if (data.success) {
                return data;
            } else {
                throw new Error(data.message || 'Failed to change password');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            this.showError('Failed to change password');
            return null;
        }
    }

    // Get dashboard data
    async getDashboardData() {
        if (!this.checkAuth()) return null;

        try {
            const response = await fetch(`${this.baseURL}/dashboard`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });

            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'userlogin.html';
                return null;
            }

            const data = await response.json();
            
            if (data.success) {
                return data.dashboard;
            } else {
                throw new Error(data.message || 'Failed to fetch dashboard data');
            }
        } catch (error) {
            console.error('Error fetching dashboard:', error);
            this.showError('Failed to load dashboard data');
            return null;
        }
    }

    // Show error message
    showError(message) {
        // Create or show error notification
        const errorDiv = document.getElementById('errorNotification') || this.createErrorNotification();
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
        
        setTimeout(() => {
            errorDiv.classList.add('hidden');
        }, 5000);
    }

    // Create error notification element
    createErrorNotification() {
        const errorDiv = document.createElement('div');
        errorDiv.id = 'errorNotification';
        errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg hidden z-50';
        document.body.appendChild(errorDiv);
        return errorDiv;
    }

    // Show success message
    showSuccess(message) {
        const successDiv = document.getElementById('successNotification') || this.createSuccessNotification();
        successDiv.textContent = message;
        successDiv.classList.remove('hidden');
        
        setTimeout(() => {
            successDiv.classList.add('hidden');
        }, 3000);
    }

    // Create success notification element
    createSuccessNotification() {
        const successDiv = document.createElement('div');
        successDiv.id = 'successNotification';
        successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg hidden z-50';
        document.body.appendChild(successDiv);
        return successDiv;
    }
}

// Initialize user profile functionality
document.addEventListener('DOMContentLoaded', function() {
    const userProfileAPI = new UserProfileAPI();
    
    // Check authentication
    if (!userProfileAPI.isAuthenticated()) {
        window.location.href = 'userlogin.html';
        return;
    }

    // Load user profile data
    loadUserProfile();

    // Set up event listeners
    function setupEventListeners() {
    console.log("Setting up event listeners"); // Add this line
    document.getElementById('editButton').addEventListener('click', openEditModal);
    document.getElementById('closeModal').addEventListener('click', closeEditModal);
    document.getElementById('editForm').addEventListener('submit', handleProfileUpdate);
}

    async function loadUserProfile() {
        showLoading(true);
        
        const user = await userProfileAPI.getUserProfile();
        if (user) {
            populateProfileData(user);
            
            // Load dashboard data for statistics
            const dashboard = await userProfileAPI.getDashboardData();
            if (dashboard) {
                populateDashboardStats(dashboard.stats);
            }
        }
        
        showLoading(false);
    }

    function populateProfileData(user) {
        // Basic information
        document.getElementById('userNameDisplay').textContent = user.name || 'User Name';
        document.getElementById('userEmail').textContent = user.email || 'user@example.com';
        document.getElementById('userPhone').textContent = user.phone || '+1234567890';
        document.getElementById('userVehicle').textContent = user.vehicle || 'Vehicle not added';

        // Update header elements with unique IDs
        document.getElementById('userNameHeader').textContent = user.name || 'User Name';
        document.getElementById('userEmailHeader').textContent = user.email || 'user@example.com';
        document.getElementById('userPhoneHeader').textContent = user.phone || '+1234567890';

        // Update all instances of user data
        const userNameElements = document.querySelectorAll('#userNameDisplay');
        const userEmailElements = document.querySelectorAll('#userEmail');
        const userPhoneElements = document.querySelectorAll('#userPhone');
        
        userNameElements.forEach(el => el.textContent = user.name || 'User Name');
        userEmailElements.forEach(el => el.textContent = user.email || 'user@example.com');
        userPhoneElements.forEach(el => el.textContent = user.phone || '+1234567890');
    }

    function populateDashboardStats(stats) {
        // Update statistics in the UI
        const statsElements = {
            'savedVehicles': document.querySelector('[data-stat="savedVehicles"]'),
            'preferredSpots': document.querySelector('[data-stat="preferredSpots"]'),
            'recentBookings': document.querySelector('[data-stat="recentBookings"]'),
            'upcomingReservations': document.querySelector('[data-stat="upcomingReservations"]'),
            'totalTransactions': document.querySelector('[data-stat="totalTransactions"]')
        };

        for (const [key, element] of Object.entries(statsElements)) {
            if (element && stats[key] !== undefined) {
                element.textContent = stats[key];
            }
        }
    }

    function setupEventListeners() {
        // Edit profile modal
        document.getElementById('editButton').addEventListener('click', openEditModal);
        document.getElementById('closeModal').addEventListener('click', closeEditModal);
        document.getElementById('editForm').addEventListener('submit', handleProfileUpdate);

        // Change password modal
        document.getElementById('changePasswordButton').addEventListener('click', openChangePasswordModal);
        document.getElementById('closeChangePasswordModal').addEventListener('click', closeChangePasswordModal);
        document.getElementById('changePasswordForm').addEventListener('submit', handlePasswordChange);

        // Back button
        document.getElementById('backButton').addEventListener('click', () => {
            window.history.back();
        });

        // Logout button
        document.getElementById('logoutButton').addEventListener('click', handleLogout);
    }

    function openEditModal() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        document.getElementById('editName').value = user.name || '';
        document.getElementById('editEmail').value = user.email || '';
        document.getElementById('editPhone').value = user.phone || '';
        document.getElementById('editVehicle').value = user.vehicle || '';
        document.getElementById('editModal').classList.remove('hidden');
    }

    function closeEditModal() {
        document.getElementById('editModal').classList.add('hidden');
    }

    async function handleProfileUpdate(event) {
        event.preventDefault();
        console.log("Profile update function called"); // Add this line
        const profileData = {
            name: document.getElementById('editName').value,
            email: document.getElementById('editEmail').value,
            phone: document.getElementById('editPhone').value,
            vehicle: document.getElementById('editVehicle').value
        };

        const result = await userProfileAPI.updateUserProfile(profileData);
        if (result) {
            userProfileAPI.showSuccess('Profile updated successfully!');
            closeEditModal();
            // Reload profile data to reflect changes
            loadUserProfile();
        }
    }

    function openChangePasswordModal() {
        document.getElementById('changePasswordModal').classList.remove('hidden');
        // Clear password fields
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmNewPassword').value = '';
    }

    function closeChangePasswordModal() {
        document.getElementById('changePasswordModal').classList.add('hidden');
    }

    async function handlePasswordChange(event) {
        event.preventDefault();
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;

        if (newPassword !== confirmNewPassword) {
            userProfileAPI.showError('New passwords do not match!');
            return;
        }

        if (newPassword.length < 6) {
            userProfileAPI.showError('Password must be at least 6 characters long!');
            return;
        }

        const result = await userProfileAPI.changePassword({
            currentPassword,
            newPassword
        });

        if (result) {
            userProfileAPI.showSuccess('Password changed successfully!');
            closeChangePasswordModal();
        }
    }

    function handleLogout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }

    function showLoading(show) {
        const loadingElement = document.getElementById('loadingIndicator') || createLoadingIndicator();
        loadingElement.style.display = show ? 'block' : 'none';
    }

    function createLoadingIndicator() {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'loadingIndicator';
        loadingDiv.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 hidden';
        loadingDiv.innerHTML = `
            <div class="bg-white p-4 rounded-lg shadow-lg">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p class="mt-2 text-gray-700">Loading...</p>
            </div>
        `;
        document.body.appendChild(loadingDiv);
        return loadingDiv;
    }
});
