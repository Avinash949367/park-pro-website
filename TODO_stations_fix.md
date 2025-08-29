# TODO: Fix Stations.html Active Section Undefined Error

## Steps to Complete:

1. [x] Investigate API endpoint `/api/registrations/status/active` vs `/api/stations/status/active`
2. [x] Check data structure returned by both endpoints
3. [x] Fix Station model status enum to include 'received' or set valid default
4. [x] Update frontend to use correct endpoint or handle data structure differences
5. [ ] Test active stations section to confirm undefined error is resolved

## Current Issues Identified:
- stations.html fetches from `/api/registrations/status/active` (Register model)
- admin.js fetches from `/api/stations/status/active` (Station model) 
- Station model status enum: ['active', 'inactive'] but default is 'received' (not in enum)
- Frontend expects certain fields that might be missing in Register model data

## Files Modified:
- backend/models/Station.js (fixed status enum to include 'received')
- frontend/site_admin/stations.html (updated fetch URL from `/api/registrations/status/active` to `/api/stations/status/active`)

## Next Steps:
- Test the active stations section to confirm the undefined error is resolved
- Verify the data displayed matches the expected fields from Station model
