# Navbar States Documentation

This document shows the navbar structure and button states captured from the browser.

## Navbar Structure (Left to Right)

The navbar contains the following elements in order:

1. **Hide navigation bar** button (collapse toggle)
2. **Go to Tournament home** button (brand/home button)
3. **Open cat photo gallery** button
4. **Enable/Disable analysis mode** button
5. **Suggest a new cat name** button
6. **Log out [Username]** button (only visible when logged in)
7. **Switch to light theme** toggle
8. **Open navigation menu** button (mobile menu)

---

## State 1: Logged Out (Login Page)

**URL:** `http://localhost:5173/login`

**Navbar Buttons:**
- Hide navigation bar
- Go to Tournament home
- Open cat photo gallery
- Enable analysis mode
- Suggest a new cat name
- ~~Log out button~~ (NOT VISIBLE - user not logged in)
- Switch to light theme
- Open navigation menu

**Note:** All navigation buttons are visible even when logged out, but the logout button is hidden.

---

## State 2: Logged In - Normal Tournament View

**URL:** `http://localhost:5173/`

**Navbar Buttons:**
- Hide navigation bar
- Go to Tournament home
- Open cat photo gallery
- **Enable analysis mode** (shows "Enable" when inactive)
- Suggest a new cat name
- **Log out Detective pawsome** (shows username - "Detective pawsome" in this case)
- Switch to light theme
- Open navigation menu

**Key Changes:**
- ✅ Logout button now visible with username
- Analysis mode button shows "Enable analysis mode"

---

## State 3: Gallery View Active

**URL:** `http://localhost:5173/` (view state changed to photos)

**Navbar Buttons:**
- Hide navigation bar
- Go to Tournament home
- Open cat photo gallery (still shows same text)
- Enable analysis mode
- Suggest a new cat name
- Log out Detective pawsome
- Switch to light theme
- Open navigation menu

**Note:** The gallery button text doesn't change when gallery is open, but clicking it again will close the gallery and return to tournament view.

---

## State 4: Analysis Mode Active

**URL:** `http://localhost:5173/?analysis=true`

**Navbar Buttons:**
- Hide navigation bar
- Go to Tournament home
- Open cat photo gallery
- **Disable analysis mode** (button text changes to "Disable" when active)
- Suggest a new cat name
- Log out Detective pawsome
- Switch to light theme
- Open navigation menu

**Key Changes:**
- ✅ Analysis mode button text changes from "Enable analysis mode" to "Disable analysis mode"
- URL includes `?analysis=true` query parameter

---

## Observations

1. **Logout Button Visibility:**
   - Hidden when logged out
   - Visible when logged in, showing "Log out [Username]"

2. **Analysis Mode Button:**
   - Shows "Enable analysis mode" when inactive
   - Shows "Disable analysis mode" when active
   - URL reflects state with `?analysis=true` parameter

3. **Gallery Button:**
   - Text remains "Open cat photo gallery" regardless of state
   - Toggles gallery view on/off when clicked

4. **All buttons remain visible in navbar:**
   - The navbar structure is consistent across all states
   - Only the logout button visibility changes based on login status
   - Only the analysis mode button text changes based on its state

---

## Browser Snapshot Data

The navbar is identified in the accessibility tree as:
- **Role:** `banner`
- **Reference:** `ref-ke75g4ccpzg` (varies per page load)

All buttons have:
- Descriptive `name` attributes for accessibility
- Icon images (SVG) as children
- Proper ARIA labels

