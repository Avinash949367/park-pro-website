const axios = require('axios');

// Test Razorpay integration
async function testRazorpay() {
  try {
    console.log('Testing Razorpay integration...');

    // First, login to get token (using demo user)
    const loginResponse = await axios.post('http://localhost:5001/login', {
      email: 'demo@gmail.com',
      password: 'demo123'
    });

    if (!loginResponse.data.token) {
      console.error('Login failed:', loginResponse.data);
      return;
    }

    const token = loginResponse.data.token;
    console.log('Login successful, token obtained');

    // Use existing vehicle since user already has FASTag
    const vehicleNumber = 'KA01AB8041';
    console.log('Using existing vehicle:', vehicleNumber);

    // Test create Razorpay order via recharge endpoint
    const orderResponse = await axios.post('http://localhost:5001/api/fastag/recharge', {
      amount: 100,
      vehicleNumber: vehicleNumber,
      paymentMethod: 'razorpay'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Order creation response:', orderResponse.data);

    if (orderResponse.data.success) {
      console.log('✅ Razorpay order created successfully');
      console.log('Order ID:', orderResponse.data.orderId);
      console.log('Amount:', orderResponse.data.amount);
      console.log('Key:', orderResponse.data.key ? 'Present' : 'Missing');
    } else {
      console.error('❌ Order creation failed:', orderResponse.data);
    }

  } catch (error) {
    console.error('Test failed:', error.response ? error.response.data : error.message);
    console.error('Full error:', error);
  }
}

testRazorpay();
