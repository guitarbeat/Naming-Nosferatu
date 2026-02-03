
# UI/UX Improvement Plan: Profile Section Login Experience

## Overview
This plan enhances the Profile Section's login/registration experience to create a more engaging, polished, and intuitive user flow. The changes focus on visual hierarchy, user guidance, and creating a more cohesive "onboarding" feel.

## Key Improvements

### 1. Reduce Avatar Dominance
- Reduce avatar size from `w-24 h-24 md:w-32 md:h-32` to `w-20 h-20 md:w-24 md:h-24`
- Remove the hover camera overlay in login mode (confusing when no profile exists)
- Add subtle pulsing border animation to draw gentle attention without overwhelming

### 2. Enhanced Section Header
- Add a welcoming header above the card with gradient text
- Include a brief, friendly subtitle explaining the purpose
- Create visual hierarchy that guides users downward

### 3. Improved Input Field Design
- Replace plain "Name" label with a more playful, themed label like "Your Name" or "Designation"
- Add a subtle icon prefix to the input (User icon)
- Increase input field prominence with better focus states
- Add placeholder animation on focus

### 4. Enhanced Save Button
- Add shimmer/glow effect when ready to submit
- Include loading state with spinner
- Add success micro-animation after save
- Make button full-width on mobile for easier tapping

### 5. Better Visual Container
- Add subtle glow behind the card
- Improve card border visibility
- Add floating particles or stars around the section for ambiance

### 6. Mobile-First Layout Adjustments
- Stack avatar above form on mobile (centered)
- Side-by-side layout on desktop
- Ensure proper spacing for thumb-friendly interactions

---

## Technical Details

### File Changes

**1. `source/features/tournament/components/ProfileSection.tsx`**

Changes to the editing state view:
- Add section header with gradient title and subtitle
- Reduce avatar dimensions
- Enhance input with icon and improved styling
- Improve button with gradient and full-width on mobile
- Add subtle animations for engagement

```text
Key changes:
- Avatar: w-24 h-24 -> w-20 h-20, md:w-32 md:h-32 -> md:w-24 md:h-24
- Add header section with title "Consult the Spirits" and subtitle
- Input label: "Name" -> "Designation" with styled uppercase tracking
- Button: Full-width gradient with improved shadow
- Remove camera overlay in editing mode (not useful for new users)
- Add glow effect behind avatar
```

### Layout Structure (Editing State)

```text
+--------------------------------------------------+
|           Section Header                          |
|   "Consult the Spirits"                          |
|   "Enter your name to track your rankings..."    |
+--------------------------------------------------+
|                                                   |
|   +------------------------------------------+   |
|   |                                          |   |
|   |        [Avatar - Smaller, Centered]      |   |
|   |              with glow                   |   |
|   |                                          |   |
|   |   Label: DESIGNATION                     |   |
|   |   +----------------------------------+   |   |
|   |   | [User Icon] Enter your name...   |   |   |
|   |   +----------------------------------+   |   |
|   |                                          |   |
|   |   [=== Begin Journey (full width) ===]   |   |
|   |                                          |   |
|   +------------------------------------------+   |
|                                                   |
+--------------------------------------------------+
```

### Specific Style Updates

1. **Section Header**
   - Gradient text: `bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent`
   - Uppercase with tight tracking for dramatic effect
   - Muted subtitle in slate color

2. **Avatar Glow**
   - Add pseudo-element with gradient blur behind avatar
   - Gentle pulse animation: `animate-pulse` on the glow

3. **Input Enhancement**
   - Label: `text-[10px] font-black uppercase tracking-[0.2em] text-purple-400/80`
   - Input: Larger height (`h-14`), rounded corners (`rounded-2xl`)
   - Placeholder: "Who are you?" for playful tone

4. **Button Styling**
   - Full gradient: `bg-gradient-to-r from-purple-600 to-indigo-600`
   - Deep shadow: `shadow-xl shadow-purple-900/30`
   - Hover scale: `active:scale-95`
   - Text: Bold with tight tracking

5. **Logged-in State Improvements**
   - Add status badges ("Omnipresent", "Shadow Archer" rank)
   - Mini stat cards showing user status
   - Stylized logout with icon animation

---

## Expected Outcome

The updated Profile Section will:
- Feel more welcoming and less intimidating for new users
- Guide users through a clear visual flow from top to bottom
- Reduce visual dominance of the avatar to balance the layout
- Create a more premium, polished feel aligned with the app's celestial theme
- Improve mobile usability with full-width buttons and proper spacing
