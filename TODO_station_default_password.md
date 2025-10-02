# TODO: Implement Default Password for Station Login

## Tasks
- [x] Modify `/storeadmin/login` route in `backend/routes/authRoutes.js` to accept default password "stationaccess" for all store admins.
- [x] Add constant for default password in the file.
- [x] Update login logic to check if entered password matches stored hash OR matches default password.
- [ ] Test login with existing credentials and with default password to ensure access to station dashboard.

## Notes
- Default password: "stationaccess"
- Store in code as per requirement.
- Ensure existing stations can login with their stored passwords or the default password.
