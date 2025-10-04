// Slot Management JavaScript

const API_BASE = 'http://localhost:5000/api/slots';

const CLOUDINARY_CLOUD_NAME = 'dwgwtx0jz';
const CLOUDINARY_API_KEY = '523154331876144';
const CLOUDINARY_API_SECRET = 'j-XAGu4EUdSjqw9tGwa85ZbQ0v0';

async function uploadImageToCloudinary(file) {
    const timestamp = Math.floor(Date.now() / 1000);
    const signatureString = `timestamp=${timestamp}${CLOUDINARY_API_SECRET}`;
    const signature = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(signatureString)).then(hash => {
        return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    });

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', CLOUDINARY_API_KEY);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData
    });

    const data = await response.json();
    if (response.ok) {
        return data.secure_url;
    } else {
        throw new Error(data.error.message);
    }
}

let slots = [];
let currentStationId = null;

async function fetchSlots(stationId) {
    if (!stationId) {
        console.error('Station ID is required to fetch slots');
        slots = [];
        renderSlots();
        return;
    }
    currentStationId = stationId;
    console.log('Fetching slots for stationId:', stationId);
    try {
        const response = await fetch(`${API_BASE}/station/${stationId}`);
        if (response.ok) {
            slots = await response.json();
            console.log('Slots fetched:', slots);
        } else {
            console.error('Failed to fetch slots');
            slots = [];
        }
    } catch (error) {
        console.error('Error fetching slots:', error);
        slots = [];
    }
    renderSlots();
}

// Function to load slots with debug stationId from input or fallback to currentUser.stationId
async function loadSlotsWithDebugId() {
    const debugStationId = document.getElementById('debug-station-id').value.trim();
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const stationId = debugStationId || (currentUser && currentUser.stationId);
    console.log('loadSlotsWithDebugId: Using stationId:', stationId);
    if (!stationId) {
        alert('Please enter a stationId or ensure user has stationId.');
        return;
    }
    await fetchSlots(stationId);
}

function renderSlots() {
    const grid = document.getElementById('slot-grid');
    grid.innerHTML = '';

    if (slots.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center py-12"><div class="text-gray-400 mb-4"><i class="fas fa-parking text-6xl"></i></div><p class="text-xl text-gray-500">No slots added yet. Please create slots.</p></div>';
        return;
    }

    slots.forEach((slot, index) => {
        const card = document.createElement('div');
        card.className = 'slot-card';

        // Determine icon based on slot type
        let iconClass = 'fas fa-car';
        if (slot.type === 'Bike') iconClass = 'fas fa-motorcycle';
        if (slot.type === 'Van') iconClass = 'fas fa-shuttle-van';

        // Status and availability badges
        const statusClass = slot.status === 'Enabled' ? 'status-enabled' : 'status-disabled';
        const availabilityClass = slot.availability === 'Free' ? 'availability-free' : 'availability-booked';

        card.innerHTML = `
            <div class="slot-image">
                <i class="${iconClass}"></i>
            </div>
            <div class="slot-details">
                <div class="flex justify-between items-start mb-3">
                    <h3 class="font-bold text-lg text-gray-800">Slot ${slot.slotId}</h3>
                    <span class="status-badge ${statusClass}">${slot.status}</span>
                </div>
                <div class="space-y-2 text-sm text-gray-600">
                    <div class="flex items-center">
                        <i class="fas fa-tag text-[#46949d] mr-2"></i>
                        <span class="font-medium">${slot.type}</span>
                    </div>
                    <div class="flex items-center">
                        <i class="fas fa-rupee-sign text-[#46949d] mr-2"></i>
                        <span class="font-medium">₹${slot.price}/hour</span>
                    </div>
                    <div class="flex items-center">
                        <i class="fas fa-clock text-[#46949d] mr-2"></i>
                        <span class="status-badge ${availabilityClass}">${slot.availability}</span>
                    </div>
                </div>
            </div>
            <div class="slot-actions">
                <button onclick="editSlot('${slot._id}')" class="btn-secondary" title="Edit Slot">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="toggleStatus('${slot._id}')" class="btn-primary" title="${slot.status === 'Enabled' ? 'Disable' : 'Enable'} Slot">
                    <i class="fas fa-${slot.status === 'Enabled' ? 'ban' : 'check'}"></i>
                </button>
                <button onclick="deleteSlot('${slot._id}')" class="btn-danger" title="Delete Slot">
                    <i class="fas fa-trash"></i>
                </button>
                <button onclick="uploadImage('${slot._id}')" class="btn-secondary" title="Upload Image">
                    <i class="fas fa-camera"></i>
                </button>
                <button onclick="bookSlot('${slot._id}')" class="btn-success" title="Book Slot">
                    <i class="fas fa-calendar-plus"></i>
                </button>
                <button onclick="viewBookings('${slot._id}')" class="btn-primary" title="View Bookings">
                    <i class="fas fa-list"></i>
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

async function addSlot() {
    // Open add slot modal
    document.getElementById('add-slot-modal').classList.remove('hidden');
}

let isSavingSlot = false;

async function saveSlot() {
    if (isSavingSlot) {
        return; // Prevent duplicate submissions
    }
    isSavingSlot = true;

    const addSlotButton = document.querySelector('#add-slot-modal button[type="submit"]');
    addSlotButton.disabled = true;
    addSlotButton.style.cursor = 'not-allowed';
    addSlotButton.textContent = 'Uploading...';

    const type = document.getElementById('slot-type').value;
    const price = parseFloat(document.getElementById('slot-price').value);
    const imageInput = document.getElementById('slot-images');
    const files = imageInput.files;
    if (!type || isNaN(price)) {
        alert('Please fill all fields correctly.');
        addSlotButton.disabled = false;
        addSlotButton.style.cursor = 'pointer';
        addSlotButton.textContent = 'Add Slot';
        isSavingSlot = false;
        return;
    }
    if (files.length > 3) {
        alert('Please select a maximum of 3 images.');
        addSlotButton.disabled = false;
        addSlotButton.style.cursor = 'pointer';
        addSlotButton.textContent = 'Add Slot';
        isSavingSlot = false;
        return;
    }
    try {
        const images = [];
        for (let file of files) {
            const url = await uploadImageToCloudinary(file);
            images.push(url);
        }
        const response = await fetch(API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stationId: currentStationId, type, price, images })
        });
        console.log('Add slot response status:', response.status);
        const responseData = await response.json();
        console.log('Add slot response data:', responseData);
        if (response.ok) {
            await fetchSlots(currentStationId);
            closeModal('add-slot-modal');
            // Clear the form
            document.getElementById('slot-type').value = 'Car';
            document.getElementById('slot-price').value = '';
            imageInput.value = '';
        } else {
            alert('Failed to add slot: ' + (responseData.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error adding slot:', error);
        alert('Error adding slot: ' + error.message);
    } finally {
        addSlotButton.disabled = false;
        addSlotButton.style.cursor = 'pointer';
        addSlotButton.textContent = 'Add Slot';
        isSavingSlot = false;
    }
}

function editSlot(id) {
    const slot = slots.find(s => s._id === id);
    if (!slot) return;
    document.getElementById('edit-slot-type').value = slot.type;
    document.getElementById('edit-slot-price').value = slot.price;
    document.getElementById('edit-id').value = id;
    document.getElementById('edit-slot-modal').classList.remove('hidden');
}

async function saveEdit() {
    const id = document.getElementById('edit-id').value;
    const type = document.getElementById('edit-slot-type').value;
    const price = parseFloat(document.getElementById('edit-slot-price').value);
    if (!type || isNaN(price)) {
        alert('Please fill all fields correctly.');
        return;
    }
    try {
        const response = await fetch(`${API_BASE}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, price })
        });
        if (response.ok) {
            await fetchSlots(currentStationId);
            closeModal('edit-slot-modal');
        } else {
            alert('Failed to update slot');
        }
    } catch (error) {
        console.error('Error updating slot:', error);
    }
}

async function toggleStatus(id) {
    const slot = slots.find(s => s._id === id);
    if (!slot) return;
    const newStatus = slot.status === 'Enabled' ? 'Disabled' : 'Enabled';
    try {
        const response = await fetch(`${API_BASE}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        if (response.ok) {
            await fetchSlots(currentStationId);
        } else {
            alert('Failed to update status');
        }
    } catch (error) {
        console.error('Error updating status:', error);
    }
}

async function deleteSlot(id) {
    if (confirm('Are you sure you want to delete this slot?')) {
        try {
            const response = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
            if (response.ok) {
                await fetchSlots();
            } else {
                alert('Failed to delete slot');
            }
        } catch (error) {
            console.error('Error deleting slot:', error);
        }
    }
}

async function uploadImage(id) {
    const slot = slots.find(s => s._id === id);
    if (!slot) return;

    if (slot.images && slot.images.length >= 3) {
        alert('Maximum of 3 images reached. Please edit the slot to replace images.');
        return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                // Upload new image to Cloudinary
                const url = await uploadImageToCloudinary(file);
                // Add new image URL to slot images array
                slot.images.push(url);

                // Update slot with new images array
                const response = await fetch(`${API_BASE}/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ images: slot.images })
                });

                if (response.ok) {
                    await fetchSlots();
                } else {
                    alert('Failed to upload image');
                }
            } catch (error) {
                console.error('Error uploading image:', error);
                alert('Error uploading image: ' + error.message);
            }
        }
    };
    input.click();
}

// Function to replace an image at a given index for a slot
async function replaceImage(slotId, imageIndex) {
    const slot = slots.find(s => s._id === slotId);
    if (!slot) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                // Delete old image from Cloudinary if it exists and is not placeholder
                const oldUrl = slot.images[imageIndex];
                if (oldUrl && oldUrl !== 'https://via.placeholder.com/150') {
                    await fetch(`${API_BASE}/delete-image`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url: oldUrl })
                    });
                }

                // Upload new image to Cloudinary
                const url = await uploadImageToCloudinary(file);

                // Replace image URL at imageIndex
                slot.images[imageIndex] = url;

                // Update slot with new images array
                const response = await fetch(`${API_BASE}/${slotId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ images: slot.images })
                });

                if (response.ok) {
                    await fetchSlots();
                } else {
                    alert('Failed to replace image');
                }
            } catch (error) {
                console.error('Error replacing image:', error);
                alert('Error replacing image: ' + error.message);
            }
        }
    };
    input.click();
}

function bookSlot(id) {
    document.getElementById('book-slot-modal').classList.remove('hidden');
    document.getElementById('book-id').value = id;
}

async function saveBooking() {
    const id = document.getElementById('book-id').value;
    const userEmail = document.getElementById('book-user-email').value;
    const vehicleNumber = document.getElementById('book-vehicle-number').value;
    const bookingStartTime = document.getElementById('book-start').value;
    const durationHours = parseFloat(document.getElementById('book-duration').value);
    const paymentMethod = document.getElementById('book-payment').value;

    // Find the slot to get price
    const slot = slots.find(s => s._id === id);
    if (!slot) {
        alert('Slot not found');
        return;
    }
    const amountPaid = durationHours * slot.price;

    try {
        const response = await fetch(`${API_BASE}/${id}/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userEmail,
                vehicleNumber,
                bookingStartTime,
                durationHours,
                amountPaid,
                paymentMethod
            })
        });
        if (response.ok) {
            await fetchSlots();
            closeModal('book-slot-modal');
            alert('Slot booked successfully.');
            // Clear form
            document.getElementById('book-user-email').value = '';
            document.getElementById('book-vehicle-number').value = '';
            document.getElementById('book-start').value = '';
            document.getElementById('book-duration').value = '';
            document.getElementById('book-payment').value = 'Cash';
        } else {
            const errorData = await response.json();
            alert('Failed to book slot: ' + (errorData.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error booking slot:', error);
        alert('Error booking slot: ' + error.message);
    }
}

async function viewBookings(id) {
    try {
        const response = await fetch(`${API_BASE}/${id}/bookings`);
        if (response.ok) {
            const bookings = await response.json();
            const now = new Date();

            const pastBookings = [];
            const ongoingBookings = [];
            const futureBookings = [];

            bookings.forEach(b => {
                const startTime = new Date(b.bookingStartTime);
                const endTime = new Date(b.bookingEndTime);
                const userName = b.userId ? b.userId.name : 'Unknown User';
                const vehicleNumber = b.vehicleId ? b.vehicleId.number : 'Unknown Vehicle';
                const status = b.status.charAt(0).toUpperCase() + b.status.slice(1);
                const bookingItem = `<li><strong>${status}</strong>: ${userName} (${vehicleNumber}) - ${startTime.toLocaleString()} to ${endTime.toLocaleString()} - ₹${b.amountPaid}</li>`;

                if (endTime < now) {
                    pastBookings.push(bookingItem);
                } else if (startTime <= now && endTime >= now) {
                    ongoingBookings.push(bookingItem);
                } else if (startTime > now) {
                    futureBookings.push(bookingItem);
                }
            });

            let sectionsHtml = '';

            if (pastBookings.length > 0) {
                sectionsHtml += `<h4 class="font-semibold text-gray-700 mb-2">Past Bookings</h4><ul class="space-y-1 mb-4">${pastBookings.join('')}</ul>`;
            }

            if (ongoingBookings.length > 0) {
                sectionsHtml += `<h4 class="font-semibold text-blue-700 mb-2">Ongoing Bookings</h4><ul class="space-y-1 mb-4">${ongoingBookings.join('')}</ul>`;
            }

            if (futureBookings.length > 0) {
                sectionsHtml += `<h4 class="font-semibold text-green-700 mb-2">Future Bookings</h4><ul class="space-y-1 mb-4">${futureBookings.join('')}</ul>`;
            }

            if (sectionsHtml === '') {
                sectionsHtml = '<p class="text-gray-500">No bookings found for this slot.</p>';
            }

            document.getElementById('bookings-sections').innerHTML = sectionsHtml;
        } else {
            document.getElementById('bookings-sections').innerHTML = '<p class="text-red-500">Failed to load bookings.</p>';
        }
    } catch (error) {
        console.error('Error fetching bookings:', error);
        document.getElementById('bookings-sections').innerHTML = '<p class="text-red-500">Error loading bookings.</p>';
    }
    document.getElementById('view-bookings-modal').classList.remove('hidden');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

function filterSlots() {
    const search = document.getElementById('search').value.toLowerCase();
    const typeFilter = document.getElementById('type-filter').value;
    const statusFilter = document.getElementById('status-filter').value;
    const availabilityFilter = document.getElementById('availability-filter').value;
    const priceSort = document.getElementById('price-sort').value;

    let filtered = slots.filter(slot => {
        return (slot.slotId.toLowerCase().includes(search) || slot.type.toLowerCase().includes(search)) &&
               (typeFilter === 'All' || slot.type === typeFilter) &&
               (statusFilter === 'All' || slot.status === statusFilter) &&
               (availabilityFilter === 'All' || slot.availability === availabilityFilter);
    });

    if (priceSort === 'Low-High') {
        filtered.sort((a, b) => a.price - b.price);
    } else if (priceSort === 'High-Low') {
        filtered.sort((a, b) => b.price - a.price);
    }

    // Temporarily update slots for rendering
    const original = [...slots];
    slots = filtered;
    renderSlots();
    slots = original;
}

// Station management variables
let stations = [];
let currentUser = null;

let hourlySlots = [];
let selectedHourlySlot = null;

// Load user data and stations
async function loadUserData() {
    try {
        const userData = localStorage.getItem('user');
        if (userData) {
            currentUser = JSON.parse(userData);
            console.log('Current user:', currentUser);
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Load all stations
async function loadStations() {
    try {
        const response = await fetch('http://localhost:5000/api/stations');
        if (response.ok) {
            stations = await response.json();
            console.log('Stations loaded:', stations);

            // Display logged-in admin's station info and fetch slots
            if (currentUser && currentUser.stationId) {
                const station = stations.find(s => s.stationId === currentUser.stationId);
                if (station) {
                    updateStationInfo(station);
                    fetchSlots(currentUser.stationId);
                    setBookingDateMinMax(station);
                } else {
                    clearStationInfo();
                    slots = [];
                    renderSlots();
                }
            } else {
                clearStationInfo();
                slots = [];
                renderSlots();
            }
        } else {
            console.error('Failed to load stations');
        }
    } catch (error) {
        console.error('Error loading stations:', error);
    }
}

// Set min and max date for booking date input
function setBookingDateMinMax(station) {
    const bookingDateInput = document.getElementById('booking-date');
    if (!bookingDateInput) return;
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const minDate = `${yyyy}-${mm}-${dd}`;
    bookingDateInput.min = minDate;
    // Set max date to 30 days from today
    const maxDateObj = new Date(today);
    maxDateObj.setDate(maxDateObj.getDate() + 30);
    const maxY = maxDateObj.getFullYear();
    const maxM = String(maxDateObj.getMonth() + 1).padStart(2, '0');
    const maxD = String(maxDateObj.getDate()).padStart(2, '0');
    const maxDate = `${maxY}-${maxM}-${maxD}`;
    bookingDateInput.max = maxDate;
    bookingDateInput.value = minDate;
}

// Remove onStationSelect function as station select is removed

// Update station information display
function updateStationInfo(station) {
    document.getElementById('station-name').textContent = station.name;
    document.getElementById('station-location').textContent = station.location;
    document.getElementById('station-id').textContent = station.stationId || station._id;
    document.getElementById('total-slots').textContent = slots.length;
}

// Clear station information
function clearStationInfo() {
    document.getElementById('station-name').textContent = 'Station not found';
    document.getElementById('station-location').textContent = '-';
    document.getElementById('station-id').textContent = '-';
    document.getElementById('total-slots').textContent = '0';
}

// Load hourly slots for selected date
async function loadHourlySlots() {
    const bookingDateInput = document.getElementById('booking-date');
    if (!bookingDateInput) {
        alert('Booking date input not found');
        return;
    }
    const date = bookingDateInput.value;
    if (!date) {
        alert('Please select a date');
        return;
    }
    if (!currentUser || !currentUser.stationId) {
        alert('Station not found for current user');
        return;
    }
    try {
        const response = await fetch(`http://localhost:5000/api/slots/stations/${currentUser.stationId}/availability?date=${date}`);
        if (response.ok) {
            const data = await response.json();
            hourlySlots = data.slots || [];
            renderHourlySlots();
        } else {
            alert('Failed to load hourly slots');
        }
    } catch (error) {
        console.error('Error loading hourly slots:', error);
        alert('Error loading hourly slots');
    }
}

// Render hourly slots in the UI
function renderHourlySlots() {
    const container = document.getElementById('hourly-slots-container');
    if (!container) return;
    container.innerHTML = '';

    if (hourlySlots.length === 0) {
        container.innerHTML = '<p class="text-gray-500 col-span-full">No hourly slots available for selected date.</p>';
        return;
    }

    hourlySlots.forEach((slot, index) => {
        const slotDiv = document.createElement('div');
        slotDiv.className = 'p-2 rounded cursor-pointer text-center border ' + (slot.available ? 'bg-green-100 border-green-400 text-green-800' : 'bg-red-100 border-red-400 text-red-800');
        slotDiv.textContent = `${slot.start_time} - ${slot.end_time}`;
        slotDiv.title = slot.available ? 'Available' : 'Booked';
        if (slot.available) {
            slotDiv.addEventListener('click', () => {
                selectHourlySlot(index);
            });
        } else {
            slotDiv.style.cursor = 'not-allowed';
        }
        if (selectedHourlySlot === index) {
            slotDiv.classList.add('ring', 'ring-green-600', 'ring-2');
        }
        container.appendChild(slotDiv);
    });
}

// Select an hourly slot
function selectHourlySlot(index) {
    if (!hourlySlots[index] || !hourlySlots[index].available) return;
    selectedHourlySlot = index;
    renderHourlySlots();
}

// Override saveBooking to use selected hourly slot
async function saveBooking() {
    if (selectedHourlySlot === null) {
        alert('Please select an available hourly slot to book.');
        return;
    }
    const id = document.getElementById('book-id').value;
    const userEmail = document.getElementById('book-user-email').value;
    const vehicleNumber = document.getElementById('book-vehicle-number').value;
    const paymentMethod = document.getElementById('book-payment').value;

    const slot = slots.find(s => s._id === id);
    if (!slot) {
        alert('Slot not found');
        return;
    }

    const selectedSlot = hourlySlots[selectedHourlySlot];
    if (!selectedSlot || !selectedSlot.available) {
        alert('Selected hourly slot is not available');
        return;
    }

    // Calculate amount based on 1 hour duration and slot price
    const amountPaid = slot.price;

    // Compose bookingStartTime from selected date and start_time
    const bookingDate = document.getElementById('booking-date').value;
    const bookingStartTime = new Date(`${bookingDate}T${selectedSlot.start_time}:00`);

    try {
        const response = await fetch(`${API_BASE}/${id}/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userEmail,
                vehicleNumber,
                bookingStartTime,
                durationHours: 1,
                amountPaid,
                paymentMethod
            })
        });
        if (response.ok) {
            await fetchSlots();
            closeModal('book-slot-modal');
            alert('Slot booked successfully.');
            // Clear form and reset selection
            document.getElementById('book-user-email').value = '';
            document.getElementById('book-vehicle-number').value = '';
            document.getElementById('book-payment').value = 'Cash';
            selectedHourlySlot = null;
            renderHourlySlots();
        } else {
            const errorData = await response.json();
            alert('Failed to book slot: ' + (errorData.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error booking slot:', error);
        alert('Error booking slot: ' + error.message);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await loadUserData();
    await loadStations();

    // Set up event listeners
    document.getElementById('search').addEventListener('input', filterSlots);
    document.getElementById('type-filter').addEventListener('change', filterSlots);
    document.getElementById('status-filter').addEventListener('change', filterSlots);
    document.getElementById('availability-filter').addEventListener('change', filterSlots);
    document.getElementById('price-sort').addEventListener('change', filterSlots);
});
