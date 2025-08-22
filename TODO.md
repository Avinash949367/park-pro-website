# Fix Document Submission Form - Station Information Update

## Issue Summary
The document submission form was only updating address and location fields, but other fields like total slots, price per slot, and other station details were not being updated in the database.

## Root Cause
The `updateAddress` function in `registerController.js` was using incorrect field names that didn't match the Register model schema:
- `zipCode` → should be `zip`
- `totalSlots` → should be `slots`
- `pricePerSlot` → should be `price`
- `location.latitude/longitude` → should be `latitude/longitude` directly

## Changes Made
✅ **Fixed field name mappings** in `updateAddress` function:
- Updated `zipCode` to `zip`
- Updated `totalSlots` to `slots`
- Updated `pricePerSlot` to `price`
- Updated location coordinates to use direct field names

## Next Steps
1. **Test the fix**:
   - Submit a document submission form
   - Verify all fields update correctly in the database
   - Check that address, location, slots, and price all save properly

2. **Frontend verification**:
   - Ensure the form sends correct field names
   - Verify the API endpoint `/api/registrations/update-address` receives correct data

3. **Database verification**:
   - Check that all fields are properly updated for the registration ID

## Testing Checklist
- [ ] Submit document submission form with all fields
- [ ] Verify address and location update correctly
- [ ] Verify total slots and price per slot update correctly
- [ ] Check that all other fields persist correctly
- [ ] Test with different registration IDs

## Files Modified
- `backend/controllers/registerController.js` - Fixed field name mappings in updateAddress function

## API Endpoints
- POST `/api/registrations/update-address` - Now correctly updates all station information fields
