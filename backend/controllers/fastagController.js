const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const FastagTransaction = require('../models/FastagTransaction');
const Counter = require('../models/Counter');
const { v4: uuidv4 } = require('uuid');
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

    res.json({
      balance: user.walletBalance || 0,
      vehicle: user.vehicle || null
    });
  } catch (error) {
    console.error('Error fetching balance:', error);
    res.status(500).json({ message: 'Error fetching balance', error: error.message });
  }
};

exports.recharge = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, vehicleNumber, paymentMethod, cardNumber, cardExpiry, cardCVV, upiId } = req.body;

    if (!amount || amount < 100) {
      return res.status(400).json({ message: 'Minimum recharge amount is ₹100' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if vehicle number is being updated
    let vehicleUpdated = false;
    if (vehicleNumber && vehicleNumber !== user.vehicle) {
      // Validate that the new vehicle number isn't already linked to another user
      const existingUser = await User.findOne({
        vehicle: vehicleNumber,
        _id: { $ne: userId }
      });

      if (existingUser) {
        return res.status(400).json({ message: 'Vehicle number is already linked to another account' });
      }

      // Update user's vehicle number
      user.vehicle = vehicleNumber;
      vehicleUpdated = true;
    }

    if (paymentMethod === 'upi') {
      // Create Razorpay order for UPI payment
      const options = {
        amount: amount * 100, // amount in paise
        currency: 'INR',
        receipt: `receipt_${uuidv4()}`,
        payment_capture: 1,
        notes: {
          userId: userId.toString(),
          vehicleNumber: vehicleNumber || user.vehicle,
          vehicleUpdated: vehicleUpdated.toString()
        }
      };

      const order = await razorpay.orders.create(options);

      // Create pending transaction record
      const transaction = new FastagTransaction({
        userId,
        vehicleNumber: vehicleNumber || user.vehicle,
        type: 'recharge',
        amount,
        status: 'pending',
        txnId: order.id,
        description: `FASTag recharge via Razorpay UPI${vehicleUpdated ? ' (vehicle updated)' : ''}`
      });

      await transaction.save();

      // Update vehicle if changed
      if (vehicleUpdated) {
        await user.save();
      }

      res.json({
        message: 'Razorpay order created. Complete the payment using Razorpay checkout.',
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_your_key_id',
        vehicleUpdated: vehicleUpdated,
        paymentMethod: 'upi',
        status: 'pending'
      });
    } else {
      // For card and other payment methods, process immediately
      // Validate card details if payment method is card
      if (paymentMethod === 'card') {
        if (!cardNumber || !cardExpiry || !cardCVV) {
          return res.status(400).json({ message: 'Card number, expiry date, and CVV are required for card payment' });
        }

        // Basic validation for card number (13-19 digits)
        const cardNumberPattern = /^[0-9\s]{13,19}$/;
        if (!cardNumberPattern.test(cardNumber.replace(/\s/g, ''))) {
          return res.status(400).json({ message: 'Invalid card number format' });
        }

        // Basic validation for expiry date (MM/YY format)
        const expiryPattern = /^(0[1-9]|1[0-2])\/?([0-9]{2})$/;
        if (!expiryPattern.test(cardExpiry)) {
          return res.status(400).json({ message: 'Invalid expiry date format. Use MM/YY' });
        }

        // Basic validation for CVV (3-4 digits)
        const cvvPattern = /^[0-9]{3,4}$/;
        if (!cvvPattern.test(cardCVV)) {
          return res.status(400).json({ message: 'Invalid CVV format' });
        }
      }

      // Update wallet balance
      user.walletBalance = (user.walletBalance || 0) + amount;
      await user.save();

      // Create transaction record
      const transaction = new FastagTransaction({
        userId,
        vehicleNumber: vehicleNumber || user.vehicle,
        type: 'recharge',
        amount,
        status: 'completed',
        txnId: uuidv4(),
        description: `FASTag recharge via ${paymentMethod || 'online payment'}${vehicleUpdated ? ' (vehicle updated)' : ''}`
      });

      await transaction.save();

      // Send payment success email notification
      await sendPaymentSuccessEmail(user.email, user.name, amount, transaction.txnId);

      // Fetch recent transactions
      const recentTransactions = await FastagTransaction.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('type amount status createdAt description');

      res.json({
        message: vehicleUpdated ? 'Recharge successful and vehicle number updated' : 'Recharge successful',
        newBalance: user.walletBalance,
        transactionId: transaction.txnId,
        vehicleUpdated: vehicleUpdated,
        fastagId: user.fastagId,
        recentTransactions: recentTransactions
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
      txnId: transactionId,
      userId,
      status: 'pending',
      type: 'recharge'
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Pending transaction not found' });
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

    if (remainingBalance > 0) {
      // Create refund transaction
      const refundTransaction = new FastagTransaction({
        userId,
        vehicleNumber: user.vehicle,
        type: 'refund',
        amount: remainingBalance,
        status: 'completed',
        transactionId: uuidv4(),
        description: 'FASTag deactivation refund'
      });

      await refundTransaction.save();

      // Reset balance and vehicle
      user.walletBalance = 0;
      user.vehicle = null;
      await user.save();

      res.json({
        message: 'FASTag deactivated successfully. Refund processed.',
        refundAmount: remainingBalance,
        transactionId: refundTransaction.transactionId
      });
    } else {
      // No balance to refund, just deactivate
      user.vehicle = null;
      await user.save();

      res.json({
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

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    const razorpaySignature = req.headers['x-razorpay-signature'];

    if (expectedSignature !== razorpaySignature) {
      console.error('Invalid webhook signature');
      return res.status(400).json({ message: 'Invalid signature' });
    }

    const event = req.body.event;
    const paymentEntity = req.body.payload.payment.entity;

    console.log('Webhook received:', event, paymentEntity.id);

    if (event === 'payment.captured') {
      // Payment was successful
      const orderId = paymentEntity.order_id;

      // Find the pending transaction
      const transaction = await FastagTransaction.findOne({
        txnId: orderId,
        status: 'pending',
        type: 'recharge'
      });

      if (!transaction) {
        console.error('Transaction not found for order:', orderId);
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
    }

    res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Webhook error:', error);
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

    // Check if user already has a FASTag
    if (user.fastagId) {
      console.log('User already has FASTag:', user.fastagId);
      return res.status(400).json({ message: 'User already has a FASTag' });
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
    const {
      fullName,
      mobile,
      email,
      vehicleNumber,
      vehicleType,
      address
    } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user information
    user.name = fullName;
    user.phone = mobile;
    user.vehicle = vehicleNumber;
    // Note: Email should match the logged-in user's email

    await user.save();

    // Create initial transaction for FASTag purchase (₹100 fee)
    const purchaseTransaction = new FastagTransaction({
      userId,
      vehicleNumber,
      type: 'recharge', // Using recharge type for initial purchase
      amount: 100,
      status: 'completed',
      transactionId: uuidv4(),
      description: 'FASTag purchase and activation fee'
    });

    await purchaseTransaction.save();

    res.json({
      message: 'FASTag application submitted successfully. Your FASTag will be activated within 24 hours.',
      transactionId: purchaseTransaction.transactionId
    });
  } catch (error) {
    console.error('Error processing FASTag application:', error);
    res.status(500).json({ message: 'Error processing application', error: error.message });
  }
};
