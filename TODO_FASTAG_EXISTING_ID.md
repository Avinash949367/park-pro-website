# FASTAG Existing ID Display Task

## Completed Tasks
- [x] Modified backend `generateFastagId` in `fastagController.js` to return existing `fastagId` when user already has a FASTAG
- [x] Updated frontend `apply-fastag.html` to display the existing FASTAG ID in confirm dialog and result message

## Changes Made
- Backend: Return `{ message: 'You already have a FASTag', fastagId: user.fastagId }` instead of just the message
- Frontend: Show existing ID in confirm: `You already have a FASTag (ID: ${existingId}). Would you like to recharge it now?`
- Frontend: Show existing ID in result message when user chooses not to recharge

## Testing
- Test by logging in as a user who already has a FASTAG and trying to apply again via apply-fastag.html
- Verify that the existing FASTAG ID is displayed in the popup and messages
