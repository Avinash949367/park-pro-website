# TODO: Add Razorpay Button Under FASTag Payment

## Backend Changes
- [ ] Add `createRazorpayOrder` function in `fastagController.js` to create Razorpay orders for FASTag recharge
- [ ] Add route `/razorpay-order` in `fastagRoutes.js` for creating orders

## Frontend Changes
- [ ] Modify `fastag.html` to add Razorpay as payment method option under the recharge form
- [ ] Update `razorpayFastag.js` to handle Razorpay checkout when selected, create order, and process payment

## Testing
- [ ] Test Razorpay integration end-to-end
- [ ] Verify webhook processing
- [ ] Ensure proper error handling
