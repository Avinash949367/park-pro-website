# TODO: Implement Booking, Payment, and Slot Generation Features

## Database Changes
- [x] Update SlotBooking model to include status (reserved, confirmed, cancelled, expired) and reservation_expires_at
- [x] Create new Payment model with id, booking_id, amount, method, txn_id, status, timestamp

## API Additions
- [x] Admin API: POST /admin/stations/{id}/hours to update station working hours (openAt, closeAt)
- [x] User API: GET /stations/{id}/availability?date=YYYY-MM-DD to generate 1-hour slots with availability status
- [x] POST /bookings/reserve to create booking with status reserved, reservation_expires_at = now + 10m, return reservation_id and payment_payload
- [x] POST /payments/verify to verify payment and mark booking as confirmed

## Slot Generation Logic
- [x] Implement slot generation in availability API based on station openAt/closeAt and existing bookings

## Payment Integration
- [x] Generate UPI string for payment payload in booking reservation
- [x] Implement payment verification in payments/verify API

## Reservation Expiry
- [x] Implement background job to clear expired reservations and free slots
