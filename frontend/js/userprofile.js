// Global variables
const apiBaseUrl = 'http://localhost:5001/api/user';

// User Profile API Integration
class UserProfileAPI {
    constructor() {
        this.baseURL = 'http://localhost:5001/api/user';
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

    // Get FastTag data
    async getFastTagData() {
        if (!this.checkAuth()) return null;

        try {
            const response = await fetch(`${this.baseURL}/fasttag`, {
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
                return data.fastTag;
            } else {
                throw new Error(data.message || 'Failed to fetch FastTag data');
            }
        } catch (error) {
            console.error('Error fetching FastTag data:', error);
            return null; // Return null instead of showing error for FastTag
        }
    }

    // Apply for FastTag
    async applyForFastTag() {
        if (!this.checkAuth()) return null;

        try {
            const response = await fetch(`${this.baseURL}/fasttag/apply`, {
                method: 'POST',
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
                return data;
            } else {
                throw new Error(data.message || 'Failed to apply for FastTag');
            }
        } catch (error) {
            console.error('Error applying for FastTag:', error);
            this.showError('Failed to apply for FastTag');
            return null;
        }
    }

    // Recharge FastTag
    async rechargeFastTag(amount) {
        if (!this.checkAuth()) return null;

        try {
            const response = await fetch(`${this.baseURL}/fasttag/recharge`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify({ amount })
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
                throw new Error(data.message || 'Failed to recharge FastTag');
            }
        } catch (error) {
            console.error('Error recharging FastTag:', error);
            this.showError('Failed to recharge FastTag');
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
    setupEventListeners();

    // Initialize FastTag functionality
    initializeFastTag();

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

            // Load FastTag data
            const fastTag = await userProfileAPI.getFastTagData();
            if (fastTag) {
                populateFastTagData(fastTag);
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

    async function fetchAndDisplayFastagTransactions(vehicleId) {
        const transactionsContainer = document.getElementById('fastagTransactionsContainer');
        transactionsContainer.innerHTML = '<p>Loading transactions...</p>';

        try {
            const response = await fetch(`/api/user/fastag/transactions/${vehicleId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch transactions');
            }

            const data = await response.json();
            if (data.success && data.transactions.length > 0) {
                let html = '<table class="min-w-full divide-y divide-gray-200"><thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>Method</th><th>Status</th></tr></thead><tbody>';
                data.transactions.forEach(txn => {
                    html += `<tr>
                        <td>${new Date(txn.date).toLocaleString()}</td>
                        <td>${txn.type}</td>
                        <td>₹${txn.amount}</td>
                        <td>${txn.method}</td>
                        <td>${txn.status}</td>
                    </tr>`;
                });
                html += '</tbody></table>';
                transactionsContainer.innerHTML = html;
            } else {
                transactionsContainer.innerHTML = '<p>No transactions found.</p>';
            }
        } catch (error) {
            transactionsContainer.innerHTML = `<p class="text-red-500">Error loading transactions: ${error.message}</p>`;
        }
    }

    // Function to update FastTag UI based on status
    function updateFastTagUI(fastTagData) {
        const fastTagContainer = document.getElementById('fastTagContainer');

        if (!fastTagData || !fastTagData.isActive) {
            // No active FastTag - show get FastTag UI
            fastTagContainer.innerHTML = `
                <div class="text-center py-4">
                    <div class="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span class="material-icons-outlined text-yellow-600 text-2xl">credit_card</span>
                    </div>
                    <h4 class="text-lg font-medium text-gray-900 mb-2">Get FastTag Now</h4>
                    <p class="text-gray-600 mb-6">Activate seamless payments for your parking transactions</p>
                    <button id="getFastTagButton" class="px-6 py-2.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors duration-200 font-medium">
                        Get FastTag
                    </button>
                </div>
            `;

            // Add event listener to the Get FastTag button
            document.getElementById('getFastTagButton').addEventListener('click', applyForFastTag);
        } else {
            // Active FastTag - show FastTag details
            const vehicleInfo = fastTagData.linkedVehicle ?
                `${fastTagData.linkedVehicle.number} (${fastTagData.linkedVehicle.type})` :
                'Not linked to vehicle';

            fastTagContainer.innerHTML = `
                <div class="space-y-6">
                    <div class="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                        <div class="flex items-center">
                            <span class="material-icons-outlined mr-3 text-yellow-600">check_circle</span>
                            <span class="text-gray-700">Status: <span class="font-medium text-green-600">Active</span></span>
                        </div>
                        <span class="text-sm text-gray-500">ID: ${fastTagData.tagId || 'N/A'}</span>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="p-4 bg-gray-50 rounded-xl">
                            <div class="flex items-center mb-2">
                                <span class="material-icons-outlined mr-2 text-gray-500 text-sm">account_balance</span>
                                <span class="text-sm text-gray-600">Balance</span>
                            </div>
                            <div class="text-2xl font-bold text-gray-900">₹${fastTagData.balance || 0}</div>
                        </div>

                        <div class="p-4 bg-gray-50 rounded-xl">
                            <div class="flex items-center mb-2">
                                <span class="material-icons-outlined mr-2 text-gray-500 text-sm">directions_car</span>
                                <span class="text-sm text-gray-600">Linked Vehicle</span>
                            </div>
                            <div class="text-lg font-medium text-gray-900">${vehicleInfo}</div>
                        </div>
                    </div>

                    <div class="p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <div class="flex items-center mb-2">
                            <span class="material-icons-outlined mr-2 text-blue-600 text-sm">info</span>
                            <span class="text-sm font-medium text-blue-800">Last Transaction</span>
                        </div>
                        <div class="text-gray-700">
                            ${fastTagData.lastTransaction ?
                                `${fastTagData.lastTransaction.amount} at ${fastTagData.lastTransaction.location} on ${new Date(fastTagData.lastTransaction.date).toLocaleDateString()}` :
                                'No recent transactions'}
                        </div>
                    </div>

                    <div class="flex flex-col sm:flex-row gap-3 pt-4">
                        <button id="rechargeFastTagButton" class="flex-1 px-4 py-2.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors duration-200 font-medium flex items-center justify-center">
                            <span class="material-icons-outlined mr-2 text-sm">account_balance_wallet</span>
                            Recharge
                        </button>
                        <button id="deactivateFastTagButton" class="flex-1 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium flex items-center justify-center">
                            <span class="material-icons-outlined mr-2 text-sm">block</span>
                            Deactivate
                        </button>
                    </div>
                </div>
            `;

            // Add event listeners
            document.getElementById('rechargeFastTagButton').addEventListener('click', rechargeFastTag);
            document.getElementById('deactivateFastTagButton').addEventListener('click', deactivateFastTag);
        }
    }

    // Function to fetch FastTag data from backend
    async function fetchFastTagData() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No authentication token found');
                return null;
            }

            const response = await fetch(`${apiBaseUrl}/fasttag`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    return data.fastTag;
                }
            }

            return null;
        } catch (error) {
            console.error('Error fetching FastTag data:', error);
            return null;
        }
    }

    // Function to apply for FastTag
    async function applyForFastTag() {
        try {
            // Show loading
            document.getElementById('loadingOverlay').classList.remove('hidden');

            const token = localStorage.getItem('token');
            if (!token) {
                showErrorNotification('Not authenticated. Please login again.');
                window.location.href = 'userlogin.html';
                return;
            }

            // Get user vehicles to select one for FastTag linking
            const userResponse = await fetch(`${apiBaseUrl}/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!userResponse.ok) {
                throw new Error('Failed to fetch user data');
            }

            const userData = await userResponse.json();
            const vehicles = userData.user.vehicles || [];

            if (vehicles.length === 0) {
                showErrorNotification('You need to add a vehicle first before applying for FastTag');
                document.getElementById('addVehicleButton').click(); // Open add vehicle modal
                return;
            }

            // For simplicity, we'll use the first vehicle
            // In a real implementation, you might want to let the user choose
            const selectedVehicle = vehicles[0];

            const response = await fetch(`${apiBaseUrl}/fasttag/apply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    vehicleId: selectedVehicle._id
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showSuccessNotification('FastTag application submitted successfully!');
                // Refresh FastTag data
                const fastTagData = await fetchFastTagData();
                updateFastTagUI(fastTagData);
            } else {
                showErrorNotification(data.message || 'Failed to apply for FastTag');
            }
        } catch (error) {
            console.error('Error applying for FastTag:', error);
            showErrorNotification('Error applying for FastTag. Please try again.');
        } finally {
            document.getElementById('loadingOverlay').classList.add('hidden');
        }
    }

    // Function to recharge FastTag
    async function rechargeFastTag() {
        const amount = prompt('Enter recharge amount (₹):');
        if (!amount || isNaN(amount) || amount <= 0) {
            showErrorNotification('Please enter a valid amount');
            return;
        }

        try {
            document.getElementById('loadingOverlay').classList.remove('hidden');

            const token = localStorage.getItem('token');
            if (!token) {
                showErrorNotification('Not authenticated. Please login again.');
                window.location.href = 'userlogin.html';
                return;
            }

            const response = await fetch(`${apiBaseUrl}/fasttag/recharge`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    amount: parseFloat(amount)
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showSuccessNotification(`FastTag recharged successfully with ₹${amount}`);
                // Refresh FastTag data
                const fastTagData = await fetchFastTagData();
                updateFastTagUI(fastTagData);
            } else {
                showErrorNotification(data.message || 'Failed to recharge FastTag');
            }
        } catch (error) {
            console.error('Error recharging FastTag:', error);
            showErrorNotification('Error recharging FastTag. Please try again.');
        } finally {
            document.getElementById('loadingOverlay').classList.add('hidden');
        }
    }

    // Function to deactivate FastTag
    async function deactivateFastTag() {
        const confirmDeactivate = confirm('Are you sure you want to deactivate your FastTag?');
        if (!confirmDeactivate) return;

        try {
            document.getElementById('loadingOverlay').classList.remove('hidden');

            const token = localStorage.getItem('token');
            if (!token) {
                showErrorNotification('Not authenticated. Please login again.');
                window.location.href = 'userlogin.html';
                return;
            }

            const response = await fetch(`${apiBaseUrl}/fasttag/deactivate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok && data.success) {
                showSuccessNotification('FastTag deactivated successfully');
                // Refresh FastTag data
                const fastTagData = await fetchFastTagData();
                updateFastTagUI(fastTagData);
            } else {
                showErrorNotification(data.message || 'Failed to deactivate FastTag');
            }
        } catch (error) {
            console.error('Error deactivating FastTag:', error);
            showErrorNotification('Error deactivating FastTag. Please try again.');
        } finally {
            document.getElementById('loadingOverlay').classList.add('hidden');
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

        // FastTag functionality
        const applyFastTagBtn = document.getElementById('applyFastTagBtn');
        const rechargeFastTagBtn = document.getElementById('rechargeFastTagBtn');

        if (applyFastTagBtn) {
            applyFastTagBtn.addEventListener('click', handleApplyForFastTag);
        }

        if (rechargeFastTagBtn) {
            rechargeFastTagBtn.addEventListener('click', openRechargeModal);
        }

        // Recharge modal
        const rechargeForm = document.getElementById('rechargeForm');
        const closeRechargeModalBtn = document.getElementById('closeRechargeModal');

        if (rechargeForm) {
            rechargeForm.addEventListener('submit', handleRechargeFastTag);
        }

        if (closeRechargeModalBtn) {
            closeRechargeModalBtn.addEventListener('click', closeRechargeModal);
        }

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

    async function handleApplyForFastTag() {
        const result = await userProfileAPI.applyForFastTag();
        if (result) {
            userProfileAPI.showSuccess('FastTag application submitted successfully!');
            // Reload FastTag data to reflect changes
            const fastTag = await userProfileAPI.getFastTagData();
            if (fastTag) {
                populateFastTagData(fastTag);
            }
        }
    }

    function openRechargeModal() {
        document.getElementById('rechargeModal').classList.remove('hidden');
        // Clear recharge amount field
        document.getElementById('rechargeAmount').value = '';
    }

    function closeRechargeModal() {
        document.getElementById('rechargeModal').classList.add('hidden');
    }

    async function handleRechargeFastTag(event) {
        event.preventDefault();

        const amount = parseFloat(document.getElementById('rechargeAmount').value);

        if (isNaN(amount) || amount <= 0) {
            userProfileAPI.showError('Please enter a valid recharge amount!');
            return;
        }

        if (amount < 100) {
            userProfileAPI.showError('Minimum recharge amount is ₹100!');
            return;
        }

        const result = await userProfileAPI.rechargeFastTag(amount);
        if (result) {
            userProfileAPI.showSuccess('FastTag recharged successfully!');
            closeRechargeModal();
            // Reload FastTag data to reflect changes
            const fastTag = await userProfileAPI.getFastTagData();
            if (fastTag) {
                populateFastTagData(fastTag);
            }
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

    // Function to populate FastTag data in the UI
    function populateFastTagData(fastTagData) {
        updateFastTagUI(fastTagData);
    }

    // Function to initialize FastTag functionality
    async function initializeFastTag() {
        try {
            const fastTagData = await userProfileAPI.getFastTagData();
            if (fastTagData) {
                populateFastTagData(fastTagData);
            } else {
                // Show default FastTag UI if no data
                updateFastTagUI(null);
            }
        } catch (error) {
            console.error('Error initializing FastTag:', error);
            updateFastTagUI(null);
        }
    }

    // Notification functions
    function showErrorNotification(message) {
        const errorDiv = document.getElementById('errorNotification') || createErrorNotification();
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');

        setTimeout(() => {
            errorDiv.classList.add('hidden');
        }, 5000);
    }

    function showSuccessNotification(message) {
        const successDiv = document.getElementById('successNotification') || createSuccessNotification();
        successDiv.textContent = message;
        successDiv.classList.remove('hidden');

        setTimeout(() => {
            successDiv.classList.add('hidden');
        }, 3000);
    }

    function createErrorNotification() {
        const errorDiv = document.createElement('div');
        errorDiv.id = 'errorNotification';
        errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg hidden z-50';
        document.body.appendChild(errorDiv);
        return errorDiv;
    }

    function createSuccessNotification() {
        const successDiv = document.createElement('div');
        successDiv.id = 'successNotification';
        successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg hidden z-50';
        document.body.appendChild(successDiv);
        return successDiv;
    }
});
