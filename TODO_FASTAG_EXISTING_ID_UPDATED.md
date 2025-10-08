# FASTAG Existing ID Display Task

## Completed Tasks
- [x] Modified backend `generateFastagId` in `fastagController.js` to return existing `fastagId` when user already has a FASTAG
- [x] Updated frontend `apply-fastag.html` to display the existing FASTAG ID in confirm dialog and result message
- [x] Fixed backend to check both `user.fastagId` and vehicle fastTags for existing FASTAG

## Changes Made
- Backend: Check for existing FASTAG in both User.fastagId and Vehicle.fastTag.tagId
- Backend: Return `{ message: 'You already have a FASTag', fastagId: existingFastagId }` when found
- Frontend: Show existing ID in confirm: `You already have a FASTag (ID: ${existingId}). Would you like to recharge it now?`
- Frontend: Show existing ID in result message when user chooses not to recharge

## Testing
- Test by logging in as a user who already has a FASTAG and attempting to apply again via apply-fastag.html
- Verify that the existing FASTAG ID is displayed correctly (not N/A) in the popup and messages
