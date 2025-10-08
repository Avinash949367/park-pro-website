// stripeFastag.js
// This script handles Stripe payment flow for FASTag recharge using Stripe Elements.

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('rechargeForm');
  const rechargeBtn = document.getElementById('rechargeBtn');
  const loadingSpinner = document.getElementById('loadingSpinner');
  const selectedAmountInput = document.getElementById('selectedAmount');
  const vehicleNumberInput = document.getElementById('vehicleNumber');
  const fastagIdInput = document.getElementById('fastagId');

  // Initialize Stripe
  const stripe = Stripe('pk_test_your_publishable_key'); // Replace with your actual publishable key
  const elements = stripe.elements();

  // Create card element
  const cardElement = elements.create('card');
  cardElement.mount('#payment-element');

  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const vehicleNumber = vehicleNumberInput.value.trim();
    const fastagId = fastagIdInput.value.trim();
    const amount = selectedAmountInput.value;

    if (!vehicleNumber) {
      alert('Please enter your vehicle number.');
      return;
    }
    if (!fastagId) {
      alert('Please enter your FASTag ID.');
      return;
    }
    if (!amount || isNaN(amount) || Number(amount) < 100) {
      alert('Please select or enter a valid recharge amount (minimum ₹100).');
      return;
    }

    // Get authentication token
    const token = localStorage.getItem('token');
    if (!token) {
      alert('You must be logged in to recharge your FASTag.');
      return;
    }

    rechargeBtn.disabled = true;
    loadingSpinner.classList.remove('hidden');

    try {
      // Create PaymentIntent on backend
      const response = await fetch('http://localhost:5001/api/fastag/recharge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          amount: Number(amount)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || 'Failed to create payment intent.');
        rechargeBtn.disabled = false;
        loadingSpinner.classList.add('hidden');
        return;
      }

      // Confirm payment with Stripe
      const { error } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: 'FASTag Recharge'
          }
        }
      });

      if (error) {
        alert('Payment failed: ' + error.message);
        rechargeBtn.disabled = false;
        loadingSpinner.classList.add('hidden');
      } else {
        alert('Payment successful! Your FASTag wallet has been recharged.');
        rechargeBtn.disabled = false;
        loadingSpinner.classList.add('hidden');
        form.reset();
        // Optionally refresh balance
        location.reload();
      }
    } catch (err) {
      console.error('Error during payment:', err);
      alert('An error occurred during payment. Please try again.');
      rechargeBtn.disabled = false;
      loadingSpinner.classList.add('hidden');
    }
  });

  // Amount selection buttons logic
  const amountButtons = document.querySelectorAll('.amount-option');
  const customAmountBtn = document.getElementById('customAmountBtn');
  const customAmountContainer = document.getElementById('customAmountContainer');
  const customAmountInput = document.getElementById('customAmount');

  amountButtons.forEach(button => {
    button.addEventListener('click', () => {
      amountButtons.forEach(btn => btn.classList.remove('bg-blue-600', 'text-white'));
      button.classList.add('bg-blue-600', 'text-white');
      selectedAmountInput.value = button.dataset.amount;
      customAmountContainer.classList.add('hidden');
      customAmountInput.value = '';
    });
  });

  customAmountBtn.addEventListener('click', () => {
    amountButtons.forEach(btn => btn.classList.remove('bg-blue-600', 'text-white'));
    customAmountContainer.classList.remove('hidden');
    selectedAmountInput.value = '';
  });

  customAmountInput.addEventListener('input', () => {
    selectedAmountInput.value = customAmountInput.value;
  });
});
