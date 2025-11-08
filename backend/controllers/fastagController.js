const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const FastagTransaction = require('../models/FastagTransaction');
const Counter = require('../models/Counter');
const { v4: uuidv4 } = require('uuid');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { sendPaymentSuccessEmail } = require('../services/emailService');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_your_key_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'your_key_secret'
});

// Get FASTag balance for user
exports.getBalance = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has an active FASTag
    const hasActiveFastag = !!(user.fastagId || user.vehicle);

    // Get primary vehicle if exists
    let primaryVehicle = null;
    if (user.vehicle) {
      const vehicle = await Vehicle.findOne({ userId, number: user.vehicle });
      if (vehicle) {
        primaryVehicle = {
          number: vehicle.number,
          type: vehicle.type
        };
      }
    }

    // Get recent transaction for last transaction info
    const lastTransaction = await FastagTransaction.findOne({ userId })
      .sort({ createdAt: -1 })
      .select('amount location createdAt type');

    res.json({
      success: true,
      isActive: hasActiveFastag,
      tagId: user.fastagId || null,
      balance: user.walletBalance || 0,
      linkedVehicle: primaryVehicle,
      lastTransaction: lastTransaction ? {
        amount: lastTransaction.amount,
        location: lastTransaction.location || 'Unknown',
        date: lastTransaction.createdAt,
        type: lastTransaction.type
      } : null
    });
  } catch (error) {
    console.error('Error fetching balance:', error);
    res.status(500).json({ message: 'Error fetching balance', error: error.message });
  }
};

exports.recharge = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, upiId, vehicleNumber, paymentMethod } = req.body;

    if (!amount || amount < 1) {
      return res.status(400).json({ message: 'Minimum recharge amount is ₹1' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find the vehicle document
    let vehicle = null;
    if (vehicleNumber) {
      vehicle = await Vehicle.findOne({ userId, number: vehicleNumber });
    } else if (user.vehicle) {
      vehicle = await Vehicle.findOne({ userId, number: user.vehicle });
    }

    // If no vehicle document found, create one if user has vehicle info
    if (!vehicle && user.vehicle) {
      vehicle = new Vehicle({
        userId: user._id,
        number: user.vehicle,
        type: user.vehicleType || 'car',
        isPrimary: true,
        fastTag: {
          tagId: user.fastagId,
          balance: user.walletBalance || 0,
          status: 'active'
        }
      });
      await vehicle.save();
    }

    if (!vehicle) {
      return res.status(400).json({ message: 'No vehicle found for recharge. Please ensure you have a registered vehicle.' });
    }

    // Handle different payment methods
    if (paymentMethod === 'razorpay') {
      // Create Razorpay order
      const options = {
        amount: amount * 100, // Razorpay expects amount in paisa
        currency: 'INR',
        receipt: `rcpt_${Date.now()}`,
        payment_capture: 1
      };

      const order = await razorpay.orders.create(options);

      // Create pending transaction record
      const transaction = new FastagTransaction({
        userId,
        vehicleId: vehicle._id,
        vehicleNumber: vehicle.number,
        type: 'recharge',
        amount,
        method: 'razorpay',
        status: 'pending',
        txnId: order.id,
        description: 'FASTag wallet recharge via Razorpay'
      });

      await transaction.save();

      res.json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID || 'rzp_test_your_key_id',
        transactionId: transaction._id
      });
    } else if (paymentMethod === 'upi') {
      // For UPI, create a pending transaction and return transaction details
      const transaction = new FastagTransaction({
        userId,
        vehicleId: vehicle._id,
        vehicleNumber: vehicle.number,
        type: 'recharge',
        amount,
        method: 'upi',
        status: 'pending',
        txnId: `UPI_${Date.now()}`,
        description: 'FASTag wallet recharge via UPI'
      });

      await transaction.save();

      res.json({
        success: true,
        transactionId: transaction._id,
        amount,
        method: 'upi',
        message: 'UPI payment initiated. Please confirm payment.'
      });
    } else {
      // Fallback to dummy implementation for other methods
      user.walletBalance = (user.walletBalance || 0) + amount;
      await user.save();

      const transaction = new FastagTransaction({
        userId,
        vehicleId: vehicle._id,
        vehicleNumber: vehicle.number,
        type: 'recharge',
        amount,
        method: paymentMethod || 'card',
        status: 'completed',
        txnId: `DUMMY_${Date.now()}`,
        description: `FASTag wallet recharge via ${paymentMethod || 'Card'} (Dummy)`
      });

      await transaction.save();

      res.json({
        success: true,
        message: 'Recharge successful (Dummy implementation)',
        newBalance: user.walletBalance,
        transactionId: transaction._id
      });
    }
  } catch (error) {
    console.error('Error processing recharge:', error);
    res.status(500).json({ message: 'Error processing recharge', error: error.message });
  }
};

// Confirm UPI payment
exports.confirmUpiPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { transactionId } = req.body;

    if (!transactionId) {
      return res.status(400).json({ message: 'Transaction ID is required' });
    }

    // Find the pending transaction
    const transaction = await FastagTransaction.findOne({
      _id: transactionId,
      userId,
      status: 'pending',
      type: 'recharge',
      method: 'upi'
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Pending UPI transaction not found' });
    }

    // Update transaction status to completed
    transaction.status = 'completed';
    await transaction.save();

    // Update user wallet balance
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.walletBalance = (user.walletBalance || 0) + transaction.amount;
    await user.save();

    // Fetch recent transactions
    const recentTransactions = await FastagTransaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('type amount status createdAt description');

    res.json({
      message: 'UPI payment confirmed successfully',
      newBalance: user.walletBalance,
      transactionId: transaction.txnId,
      fastagId: user.fastagId,
      recentTransactions: recentTransactions
    });
  } catch (error) {
    console.error('Error confirming UPI payment:', error);
    res.status(500).json({ message: 'Error confirming payment', error: error.message });
  }
};

// Pay toll and update transaction history
exports.payToll = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, location } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid toll amount is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentBalance = user.walletBalance || 0;
    if (currentBalance < amount) {
      return res.status(400).json({
        message: 'Insufficient wallet balance',
        currentBalance: currentBalance,
        requiredAmount: amount
      });
    }

    // Deduct toll amount from wallet
    user.walletBalance = currentBalance - amount;
    await user.save();

    // Create transaction record
    const transaction = new FastagTransaction({
      userId,
      vehicleNumber: user.vehicle,
      type: 'toll_payment',
      amount,
      location: location || 'Unknown',
      status: 'completed',
      txnId: uuidv4(),
      description: `Toll payment at ${location || 'Unknown location'}`
    });

    await transaction.save();

    // Fetch recent transactions
    const recentTransactions = await FastagTransaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('type amount status createdAt description');

    res.json({
      message: 'Toll payment successful',
      newBalance: user.walletBalance,
      transactionId: transaction.txnId,
      amount: amount,
      location: location || 'Unknown',
      fastagId: user.fastagId,
      recentTransactions: recentTransactions
    });
  } catch (error) {
    console.error('Error processing toll payment:', error);
    res.status(500).json({ message: 'Error processing toll payment', error: error.message });
  }
};

// Get transaction history
exports.getTransactionHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const transactions = await FastagTransaction.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('vehicleNumber type amount location status transactionId description createdAt');

    const totalTransactions = await FastagTransaction.countDocuments({ userId });

    res.json({
      transactions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalTransactions / limit),
        totalTransactions,
        hasNext: page * limit < totalTransactions,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    res.status(500).json({ message: 'Error fetching transaction history', error: error.message });
  }
};

// Link vehicle to FASTag
exports.linkVehicle = async (req, res) => {
  try {
    const userId = req.user.id;
    const { vehicleNumber } = req.body;

    if (!vehicleNumber) {
      return res.status(400).json({ message: 'Vehicle number is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if vehicle is already linked to another user
    const existingUser = await User.findOne({
      vehicle: vehicleNumber,
      _id: { $ne: userId }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Vehicle is already linked to another account' });
    }

    user.vehicle = vehicleNumber;
    await user.save();

    res.json({
      message: 'Vehicle linked successfully',
      vehicle: vehicleNumber
    });
  } catch (error) {
    console.error('Error linking vehicle:', error);
    res.status(500).json({ message: 'Error linking vehicle', error: error.message });
  }
};

// Deactivate FASTag and process refund
exports.deactivateFastag = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const remainingBalance = user.walletBalance || 0;

    // Find the vehicle with FASTag
    const vehicle = await Vehicle.findOne({ userId, 'fastTag.tagId': user.fastagId });
    if (vehicle) {
      vehicle.fastTag.status = 'disabled';
      await vehicle.save();
    }

    if (remainingBalance > 0) {
      // Create refund transaction
      const refundTransaction = new FastagTransaction({
        userId,
        vehicleId: vehicle?._id,
        vehicleNumber: user.vehicle,
        type: 'refund',
        amount: remainingBalance,
        method: 'refund',
        status: 'completed',
        txnId: uuidv4(),
        description: 'FASTag deactivation refund'
      });

      await refundTransaction.save();

      // Reset balance and vehicle
      user.walletBalance = 0;
      user.vehicle = null;
      user.fastagId = null;
      await user.save();

      res.json({
        success: true,
        message: 'FASTag deactivated successfully. Refund processed.',
        refundAmount: remainingBalance,
        transactionId: refundTransaction.txnId
      });
    } else {
      // No balance to refund, just deactivate
      user.vehicle = null;
      user.fastagId = null;
      await user.save();

      res.json({
        success: true,
        message: 'FASTag deactivated successfully.'
      });
    }
  } catch (error) {
    console.error('Error deactivating FASTag:', error);
    res.status(500).json({ message: 'Error deactivating FASTag', error: error.message });
  }
};

// Handle Razorpay webhook
exports.handleRazorpayWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'your_webhook_secret';
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    const receivedSignature = req.headers['x-razorpay-signature'];

    if (expectedSignature !== receivedSignature) {
      console.error('Razorpay webhook signature verification failed');
      return res.status(400).json({ message: 'Invalid signature' });
    }

    const event = req.body.event;

    console.log('Razorpay webhook received:', event);

    if (event === 'payment.captured') {
      const paymentEntity = req.body.payload.payment.entity;

      // Find the pending transaction
      const transaction = await FastagTransaction.findOne({
        txnId: paymentEntity.order_id,
        status: 'pending',
        type: 'recharge'
      });

      if (!transaction) {
        console.error('Transaction not found for order:', paymentEntity.order_id);
        return res.status(200).json({ message: 'Transaction not found' });
      }

      // Update transaction status
      transaction.status = 'completed';
      transaction.paymentId = paymentEntity.id;
      await transaction.save();

      // Update user wallet balance
      const user = await User.findById(transaction.userId);
      if (user) {
        user.walletBalance = (user.walletBalance || 0) + transaction.amount;
        await user.save();

        // Send payment success email
        await sendPaymentSuccessEmail(user.email, user.name, transaction.amount, transaction.txnId);

        console.log('Payment processed successfully for user:', user.email);
      }
    } else if (event === 'order.paid') {
      // Handle order paid event for UPI payments
      const orderEntity = req.body.payload.order.entity;

      // Find the pending transaction
      const transaction = await FastagTransaction.findOne({
        txnId: orderEntity.id,
        status: 'pending',
        type: 'recharge',
        method: 'upi'
      });

      if (!transaction) {
        console.error('UPI Transaction not found for order:', orderEntity.id);
        return res.status(200).json({ message: 'Transaction not found' });
      }

      // Update transaction status
      transaction.status = 'completed';
      await transaction.save();

      // Update user wallet balance
      const user = await User.findById(transaction.userId);
      if (user) {
        user.walletBalance = (user.walletBalance || 0) + transaction.amount;
        await user.save();

        // Send payment success email
        await sendPaymentSuccessEmail(user.email, user.name, transaction.amount, transaction.txnId);

        console.log('UPI Payment processed successfully for user:', user.email);
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Razorpay webhook error:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
};

// Handle Stripe webhook
exports.handleStripeWebhook = async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_your_webhook_secret';

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log('Stripe webhook received:', event.type);

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;

      // Find the pending transaction
      const transaction = await FastagTransaction.findOne({
        txnId: paymentIntent.id,
        status: 'pending',
        type: 'recharge'
      });

      if (!transaction) {
        console.error('Transaction not found for payment intent:', paymentIntent.id);
        return res.status(200).json({ message: 'Transaction not found' });
      }

      // Update transaction status
      transaction.status = 'completed';
      transaction.paymentId = paymentIntent.id;
      await transaction.save();

      // Update user wallet balance
      const user = await User.findById(transaction.userId);
      if (user) {
        user.walletBalance = (user.walletBalance || 0) + transaction.amount;
        await user.save();

        // Send payment success email
        await sendPaymentSuccessEmail(user.email, user.name, transaction.amount, transaction.txnId);

        console.log('Payment processed successfully for user:', user.email);
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
};

const mongoose = require('mongoose');

// Generate FASTag ID for new user
exports.generateFastagId = async (req, res) => {
  try {
    // TEMPORARY: For testing purposes, allow userId from body or auth
    const userId = req.user ? req.user.id : req.body.userId;
    const { vehicleNumber, vehicleType } = req.body;

    if (!vehicleNumber || !vehicleType) {
      return res.status(400).json({ message: 'Vehicle number and type are required' });
    }

    const user = await User.findById(userId);

    if (!user) {
      console.log('User not found:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User found:', { id: user._id, email: user.email, existingFastagId: user.fastagId });

    // Check if vehicle number is already registered to another user
    const existingVehicle = await Vehicle.findOne({ number: vehicleNumber });
    if (existingVehicle && existingVehicle.userId.toString() !== userId) {
      return res.status(400).json({ message: 'Vehicle number is already registered to another account' });
    }

    // Check if user already has a FASTag (either in user.fastagId or in vehicles)
    let existingFastagId = user.fastagId;
    if (!existingFastagId) {
      // Check if any vehicle has a fastTag
      const vehicleWithFastTag = await Vehicle.findOne({ userId: userId, 'fastTag.tagId': { $exists: true, $ne: null } });
      if (vehicleWithFastTag) {
        existingFastagId = vehicleWithFastTag.fastTag.tagId;
      }
    }

    if (existingFastagId) {
      console.log('User already has FASTag:', existingFastagId);
      return res.status(400).json({ message: 'You already have a FASTag', fastagId: existingFastagId });
    }

    console.log('Attempting to update counter for fastagId');
    // Use a counter collection to generate unique sequential FASTag IDs
    const counter = await Counter.findOneAndUpdate(
      { name: 'fastagId' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    console.log('Counter updated:', counter);

    // Format the FASTag ID as FT + zero-padded sequence number (e.g., FT000123)
    const fastagId = 'FT' + counter.seq.toString().padStart(6, '0');

    console.log('Generated FASTag ID:', fastagId);

    // Check if fastagId already exists (unlikely but safe to check)
    const existingUser = await User.findOne({ fastagId });
    if (existingUser) {
      console.log('FASTag ID conflict detected:', { fastagId, existingUserId: existingUser._id });
      return res.status(500).json({ message: 'FASTag ID generation conflict, please try again' });
    }

    console.log('Updating user with FASTag details');
    // Update user with vehicle details and FASTag ID
    user.vehicle = vehicleNumber;
    user.vehicleType = vehicleType;
    user.fastagId = fastagId;

    const savedUser = await user.save();
    console.log('User updated successfully:', { id: savedUser._id, fastagId: savedUser.fastagId });

    // Find or create vehicle and update FastTag information
    let vehicle = await Vehicle.findOne({ userId: userId, number: vehicleNumber });

    if (!vehicle) {
      // Create new vehicle if it doesn't exist
      vehicle = new Vehicle({
        userId: userId,
        number: vehicleNumber,
        type: vehicleType,
        isPrimary: true, // Make this the primary vehicle
        fastTag: {
          tagId: fastagId,
          balance: 0,
          status: 'active'
        }
      });
      console.log('Creating new vehicle with FastTag:', vehicleNumber);
    } else {
      // Update existing vehicle with FastTag information
      vehicle.fastTag = {
        tagId: fastagId,
        balance: vehicle.fastTag?.balance || 0,
        status: 'active'
      };
      console.log('Updating existing vehicle with FastTag:', vehicleNumber);
    }

    await vehicle.save();
    console.log('Vehicle updated successfully:', { id: vehicle._id, fastagId: vehicle.fastTag.tagId });

    res.json({
      message: 'FASTag ID generated successfully',
      fastagId: fastagId,
      vehicleNumber: vehicleNumber,
      vehicleType: vehicleType
    });
  } catch (error) {
    console.error('Error generating FASTag ID:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ message: 'Error generating FASTag ID. Please try again.' });
  }
};

// Apply for new FASTag
exports.applyForFastag = async (req, res) => {
  try {
    const userId = req.user.id;
    const { vehicleNumber, vehicleType } = req.body;

    if (!vehicleNumber || !vehicleType) {
      return res.status(400).json({ message: 'Vehicle number and type are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user already has a FASTag
    if (user.fastagId) {
      return res.status(400).json({ message: 'You already have an active FASTag', fastagId: user.fastagId });
    }

    // Generate FASTag ID
    const counter = await Counter.findOneAndUpdate(
      { name: 'fastagId' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const fastagId = 'FT' + counter.seq.toString().padStart(6, '0');

    // Update user with FASTag details
    user.vehicle = vehicleNumber;
    user.fastagId = fastagId;
    await user.save();

    // Create or update vehicle
    let vehicle = await Vehicle.findOne({ userId, number: vehicleNumber });
    if (!vehicle) {
      vehicle = new Vehicle({
        userId,
        number: vehicleNumber,
        type: vehicleType,
        isPrimary: true,
        fastTag: {
          tagId: fastagId,
          balance: 0,
          status: 'active'
        }
      });
    } else {
      vehicle.fastTag = {
        tagId: fastagId,
        balance: vehicle.fastTag?.balance || 0,
        status: 'active'
      };
    }
    await vehicle.save();

    // Create initial transaction for FASTag activation
    const activationTransaction = new FastagTransaction({
      userId,
      vehicleId: vehicle._id,
      vehicleNumber,
      type: 'recharge',
      amount: 0, // No charge for activation in this simplified version
      method: 'activation',
      status: 'completed',
      txnId: uuidv4(),
      description: 'FASTag activation'
    });

    await activationTransaction.save();

    res.json({
      success: true,
      message: 'FASTag activated successfully!',
      fastagId: fastagId,
      vehicleNumber: vehicleNumber,
      vehicleType: vehicleType
    });
  } catch (error) {
    console.error('Error processing FASTag application:', error);
    res.status(500).json({ message: 'Error processing application', error: error.message });
  }
};
