# TODO: Fix Change Password Functionality in StationAdmin Profile

## Steps to Complete

- [ ] Add JavaScript event listeners in frontend/StationAdmin/adminprofile.html
  - [ ] Add event listener to #changePasswordBtn to toggle visibility of #changePasswordFields
  - [ ] Add event listener to #submitPasswordChange to handle password change submission (API call to backend)

- [ ] Add backend route in backend/routes/stationRoutes.js
  - [ ] Add PUT route: /stations/admin/change-password with JWT auth

- [ ] Add controller function in backend/controllers/stationController.js
  - [ ] Implement changeStationAdminPassword function
  - [ ] Verify current password against StoreAdminCredentials
  - [ ] Validate new password (complexity rules)
  - [ ] Hash and update new password in StoreAdminCredentials

- [ ] Test the functionality
  - [ ] Start the server
  - [ ] Open adminprofile.html
  - [ ] Click Change Password button
  - [ ] Verify fields appear
  - [ ] Test password change with valid/invalid inputs
