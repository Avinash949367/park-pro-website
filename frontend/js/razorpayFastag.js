// razorpayFastag.js
// This script handles Razorpay payment flow for FASTag recharge using Razorpay Checkout and UPI payment method.

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('rechargeForm');
  const rechargeBtn = document.getElementById('rechargeBtn');
  const loadingSpinner = document.getElementById('loadingSpinner');
  const selectedAmountInput = document.getElementById('selectedAmount');
  const vehicleNumberInput = document.getElementById('vehicleNumber');
  const fastagIdInput = document.getElementById('fastagId');





  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const vehicleNumber = vehicleNumberInput.value.trim();
    const fastagId = fastagIdInput.value.trim();
    const amount = selectedAmountInput.value;
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'upi';
    const upiId = document.getElementById('upiId').value.trim();

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
      // Create payment on backend
      const response = await fetch('http://localhost:5001/api/fastag/recharge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify({
          amount: Number(amount),
          vehicleNumber: vehicleNumber,
          paymentMethod: paymentMethod,
          upiId: upiId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || 'Failed to initiate payment.');
        rechargeBtn.disabled = false;
        loadingSpinner.classList.add('hidden');
        return;
      }

      // For dummy implementation, directly show success
      showSuccessModal();
      rechargeBtn.disabled = false;
      loadingSpinner.classList.add('hidden');
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

  // Function to initiate Razorpay payment
  function initiateRazorpayPayment(data) {
    const options = {
      key: data.key,
      amount: data.amount,
      currency: data.currency,
      order_id: data.orderId,
      name: 'Park Pro',
      description: 'FASTag Wallet Recharge',
      image: 'https://example.com/logo.png', // Replace with your logo URL
      handler: function (response) {
        // Payment successful - this will be called when payment is completed
        // The webhook will handle the actual confirmation
        alert('Payment initiated successfully! Your FASTag wallet will be updated automatically once payment is confirmed.');
        form.reset();
        // Refresh balance after a short delay to allow webhook processing
        setTimeout(() => {
          location.reload();
        }, 3000);
      },
      prefill: {
        name: '', // You can populate this from user data if available
        email: '',
        contact: ''
      },
      notes: {
        address: 'FASTag Recharge'
      },
      theme: {
        color: '#3399cc'
      },
      modal: {
        ondismiss: function() {
          // Payment cancelled or dismissed
          console.log('Payment modal dismissed');
        }
      }
    };

    const rzp = new Razorpay(options);

    rzp.on('payment.failed', function (response) {
      alert('Payment failed. Please try again.');
      console.error('Payment failed:', response.error);
    });

    rzp.open();
  }

  // Function to show UPI modal
  function showUpiModal(data) {
    const upiModal = document.getElementById('upiModal');
    const confirmBtn = document.getElementById('confirmUpiPayment');
    const cancelBtn = document.getElementById('cancelUpiPayment');

    upiModal.classList.remove('hidden');

    confirmBtn.onclick = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5001/api/fastag/confirm-upi', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
          },
          body: JSON.stringify({
            transactionId: data.transactionId
          })
        });

        const result = await response.json();

        if (response.ok) {
          upiModal.classList.add('hidden');
          showSuccessModal();
        } else {
          alert(result.message || 'Failed to confirm payment.');
        }
      } catch (err) {
        console.error('Error confirming UPI payment:', err);
        alert('An error occurred. Please try again.');
      }
    };

    cancelBtn.onclick = () => {
      upiModal.classList.add('hidden');
    };
  }

  // Function to show success modal
  function showSuccessModal() {
    const successModal = document.getElementById('successModal');
    const closeBtn = document.getElementById('closeSuccessModal');

    successModal.classList.remove('hidden');

    closeBtn.onclick = () => {
      successModal.classList.add('hidden');
      // Reload to update balance in profile
      window.location.reload();
    };
  }
});
