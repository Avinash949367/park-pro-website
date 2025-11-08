# TODO: Add UPI ID Field and Ensure Razorpay Button Works in FASTag Recharge

## Overview
Add UPI ID input field to the FASTag recharge form and ensure the "Pay with Razorpay" button is functional, alongside existing Direct Recharge option.

## Steps to Complete

### 1. Update fastag.html
- [ ] Add UPI ID input field after FASTag ID field
- [ ] Add "Pay with UPI" button alongside existing Direct Recharge and Pay with Razorpay buttons
- [ ] Add UPI payment UI section (similar to get-fastag.html) with QR code display and confirmation

### 2. Update razorpayFastag.js
- [ ] Add UPI payment validation (UPI ID format)
- [ ] Add UPI payment initiation handler (generate deep link and QR code)
- [ ] Add UPI payment confirmation handler
- [ ] Ensure Razorpay payment flow is complete and functional
- [ ] Add error handling for all payment methods

### 3. Testing
- [ ] Test Direct Recharge functionality
- [ ] Test Razorpay payment flow end-to-end
- [ ] Test UPI payment flow (QR code generation, deep link, confirmation)
- [ ] Verify form validation for all fields including UPI ID

### 4. Documentation
- [ ] Update TODO_RAZORPAY_BUTTON.md to mark as completed
- [ ] Update this TODO file with completion status

## Dependencies
- Backend routes: `/razorpay-order` and `/confirm-upi` already exist
- Razorpay JS SDK already included in fastag.html

## Notes
- UPI payment flow should match the implementation in get-fastag.html
- Razorpay button should initiate checkout and handle success/failure
- All payment methods should update user balance upon completion
