# Name Hiding Usability Test Plan

## Test Scenarios

### 1. Basic Hide Operation
**Steps:**
1. Navigate to Analysis mode (`?analysis=true`)
2. Select 1-3 names by clicking on them
3. Click "Hide" button
4. Verify success message appears
5. Verify names disappear from the list
6. Verify selection is cleared

**Expected Results:**
- ✅ Success toast: "Successfully hidden X name(s)"
- Names are removed from visible list
- Selection count resets to 0
- Names are actually hidden in database

### 2. Bulk Hide (5+ names)
**Steps:**
1. Select 6+ names
2. Click "Hide" button
3. Confirm the confirmation dialog
4. Verify success message

**Expected Results:**
- Confirmation dialog appears: "Are you sure you want to hide X names?"
- On confirm: Success toast appears
- On cancel: No action taken, selection remains

### 3. Hide All Selected
**Steps:**
1. Click "Select All"
2. Click "Hide" button
3. Confirm if prompted

**Expected Results:**
- All visible names are selected
- Confirmation dialog appears (if >5 names)
- Success message shows correct count
- All names are hidden

### 4. Unhide Operation
**Steps:**
1. Filter to "Hidden Only"
2. Select hidden names
3. Click "Unhide" button
4. Verify success message
5. Switch filter to "Visible Only"
6. Verify names appear

**Expected Results:**
- ✅ Success toast: "Successfully unhidden X name(s)"
- Names appear in visible list
- Selection is cleared

### 5. Error Cases
**Test Cases:**
- Hide with no selection → Error message: "No names selected"
- Hide as non-admin → Error: "Only admins can hide names"
- Network error → Error message with retry option

**Expected Results:**
- ❌ Error toast appears with clear message
- User understands what went wrong
- Can retry the operation

### 6. Visual Feedback
**Check:**
- Toast notifications are visible and readable
- Success toasts are green/positive styling
- Error toasts are red/negative styling
- Toasts auto-dismiss after 5 seconds
- Toasts can be manually dismissed
- Progress indicator shows during operation

### 7. State Management
**Verify:**
- Selection persists during filter changes
- Hidden names don't appear in "Visible Only" filter
- Hidden names appear in "Hidden Only" filter
- Count updates correctly after hide/unhide
- No duplicate operations if button clicked multiple times

## Issues to Watch For

1. **Toast Notifications Not Visible**
   - Currently only logging to console
   - Need to integrate Toast component

2. **Selection Clearing**
   - Should clear after successful hide
   - Should persist if operation fails

3. **Count Accuracy**
   - Should show correct number of names hidden
   - Should not show "0 names" when names are selected

4. **Confirmation Dialog**
   - Should appear for 5+ names
   - Should be clear and actionable

5. **Loading States**
   - Button should show loading state during operation
   - Should prevent double-clicks

## Test Checklist

- [ ] Can select individual names
- [ ] Can select all names
- [ ] Hide button works for 1 name
- [ ] Hide button works for multiple names
- [ ] Confirmation dialog appears for 5+ names
- [ ] Success message is clear and accurate
- [ ] Error messages are helpful
- [ ] Names actually disappear from list
- [ ] Selection clears after hide
- [ ] Unhide works correctly
- [ ] Filter updates correctly
- [ ] Toast notifications are visible
- [ ] No console errors
- [ ] Works on mobile devices







