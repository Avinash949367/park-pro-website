# TODO: Checking.html Updates

## Completed Tasks
- [x] Add camera/viewport logic with x,y offset to simulate camera movement
- [x] Implement centerCameraOn function to center view on a point
- [x] Update drawPath function to center camera on initial point when path is selected
- [x] Adjust path drawing (lines and arrows) to account for camera offset
- [x] Add drawUserPosition function to draw a circle with arrow indicator at current position
- [x] Update drawPath to draw user position indicator after drawing path
- [x] Initialize the map by drawing path from start to s1 on load

## Followup Steps
- [ ] Test camera movement by clicking different path buttons (e.g., Start → S2, S1 → Exit)
- [ ] Verify user position indicator appears at the initial point of the selected path
- [ ] Check that path lines and arrows are drawn correctly with camera offset
- [ ] Ensure canvas clears and redraws properly on each path selection
- [ ] Test responsiveness and visual clarity of the map
