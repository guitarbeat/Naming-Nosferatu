# Copy & Microcopy Documentation

This document catalogs all user-facing text, copy, and microcopy used throughout the Name Nosferatu application.

## Table of Contents

1. [Writing Guidelines](#writing-guidelines)
2. [Quick Reference](#quick-reference)
3. [User Journey](#user-journey)
   - [Authentication & Login](#authentication--login)
   - [Tournament Setup](#tournament-setup)
   - [Tournament Voting](#tournament-voting)
   - [Results & Rankings](#results--rankings)
4. [Shared Components](#shared-components)
   - [Navigation](#navigation)
   - [Forms & Inputs](#forms--inputs)
   - [Cards & Displays](#cards--displays)
   - [Modals & Dialogs](#modals--dialogs)
5. [System Messages](#system-messages)
   - [Error Messages](#error-messages)
   - [Loading States](#loading-states)
   - [Empty States](#empty-states)
   - [Success Messages](#success-messages)
6. [Utility Text](#utility-text)
   - [Labels & Metrics](#labels--metrics)
   - [Formatting](#formatting)
   - [Status Indicators](#status-indicators)
7. [Additional Features](#additional-features)
   - [Swipe Mode](#swipe-mode)
   - [Analytics & Analysis Mode](#analytics--analysis-mode)
   - [Home Page](#home-page)
8. [API & External](#api--external)
   - [API Endpoints](#api-endpoints)
   - [Meta Tags & Manifest](#meta-tags--manifest)
9. [Glossary](#glossary)
10. [Notes](#notes)
11. [Critique & Analysis](#critique--analysis)

## Writing Guidelines

### Tone & Voice
- **Tone**: Friendly, playful, and approachable while remaining professional
- **Voice**: Second person ("you", "your") for user-facing text; imperative for actions
- **Style**: Conversational but clear; uses contractions sparingly
- **Personality**: Cat-themed puns and playful language are encouraged (e.g., "Purr-spective Judge")

### Capitalization
- **Buttons**: Title Case for primary actions ("Start Tournament", "Submit Suggestion")
- **Labels**: Title Case for form labels and section headers
- **Messages**: Sentence case for most messages; Title Case for important notifications
- **Aria Labels**: Sentence case, descriptive and complete

### Punctuation
- **Buttons**: No periods unless part of a question
- **Messages**: Use periods for complete sentences
- **Tooltips**: No periods for short phrases; periods for full sentences
- **Placeholders**: No periods, use ellipsis for truncation hints

### Length Guidelines
- **Button Labels**: 1-4 words, ideally 2-3 words
- **Error Messages**: 1-2 sentences, actionable
- **Tooltips**: 1 sentence, maximum 100 characters
- **Aria Labels**: Complete but concise, 5-15 words
- **Form Labels**: 1-3 words
- **Placeholders**: 5-20 characters

### Emoji Usage
- **Sparingly**: Use emojis for visual interest, not as primary communication
- **Consistent**: Same emoji for same concept (🏆 for winners, ⭐ for ratings)
- **Accessible**: Always include text alternative; emojis are decorative, not informational

### Dynamic Content
- **Placeholders**: Use `{variableName}` format consistently
- **Pluralization**: Handle singular/plural correctly ("1 name" vs "5 names")
- **Numbers**: Format consistently (use locale-appropriate formatting)
- **Dates**: Use relative when possible ("2 days ago"), absolute when needed ("Jan 15, 2025")

### Error Message Guidelines
- **User-Friendly**: Avoid technical jargon
- **Actionable**: Tell user what they can do
- **Specific**: Explain what went wrong in simple terms
- **Recovery**: Provide next steps or alternatives

### Button Text Guidelines
- **Action-Oriented**: Start with a verb ("Start", "Submit", "Cancel")
- **Clear Intent**: User should know what will happen
- **Consistent**: Similar actions use similar wording
- **Loading States**: Show progress ("Submitting..." not just "Submit")

---

## Quick Reference

### Common Patterns
- **Dynamic Content**: Uses `{variableName}` placeholders (e.g., `{userName}`, `{count}`)
- **Aria Labels**: All interactive elements include accessibility labels
- **Tooltips**: Additional context provided via `title` attributes
- **Loading States**: All async operations show loading feedback
- **Error Recovery**: All errors include actionable recovery steps

### Button States
- **Primary Action**: "Start Tournament", "Submit", "Save"
- **Secondary Action**: "Cancel", "Back", "Skip"
- **Destructive Action**: "End Tournament", "Delete"
- **Loading State**: Append "..." or show "Loading..." / "Submitting..."

### Status Messages
- **Success**: Green checkmark (✅) or "Success" prefix
- **Error**: Red X (❌) or "Error" prefix
- **Warning**: Yellow triangle (⚠️) or "Warning" prefix
- **Info**: Blue circle (ℹ️) or "Info" prefix

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `←` | Select left name |
| `→` | Select right name |
| `↑` | Vote for both names |
| `↓` | Skip this match |
| `Space` / `Enter` | Vote for selected name |
| `Escape` | Clear selection / Undo vote |
| `Tab` | Navigate between elements |
| `C` | Toggle cat pictures |

### Common Placeholders
| Placeholder | Description | Example | Usage Notes |
|------------|------------|---------|------------|
| `{userName}` | Current user's name | "Alice" | Always capitalize first letter |
| `{count}` | Number of items | "5" | Handle singular/plural (1 name vs 5 names) |
| `{totalCount}` | Total number available | "100" | Format with locale-appropriate separators |
| `{filteredCount}` | Number after filtering | "25" | Always show with {totalCount} for context |
| `{roundNumber}` | Current round number | "3" | Always positive integer |
| `{currentMatchNumber}` | Current match in round | "2" | Always ≤ {totalMatches} |
| `{totalMatches}` | Total matches in round | "8" | Always ≥ {currentMatchNumber} |
| `{progress}` | Percentage complete | "75" | Integer 0-100, append "%" in display |
| `{rating}` | Elo rating value | "1650" | Round to nearest integer, default 1500 |
| `{name}` | Cat name | "Whiskers" | User-provided, may contain special chars |
| `{date}` | Formatted date | "Jan 15, 2025" | Use locale-appropriate format |
| `{percentile}` | Percentile rank | "85" | Integer 0-100, append "th" in display |
| `{leftName}` | Left match name | "Whiskers" | May be "Unknown" if missing |
| `{rightName}` | Right match name | "Fluffy" | May be "Unknown" if missing |
| `{winnerName}` | Winning name | "Whiskers" | Top-ranked name in results |
| `{timeRemaining}` | Time left in seconds | "1.5s" | Format as decimal with "s" suffix |
| `{trackName}` | Music track name | "Ambient Cat Sounds" | May be empty if no track |
| `{error}` | Error message | "Network error" | User-friendly, not technical |
| `{action}` | Action verb | "hidden" / "unhidden" | Past tense for success messages |

---

## User Journey

### Authentication & Login

#### Login Screen
- **Title**: "Welcome, Purr-spective Judge!"
  - *Location*: `src/features/tournament/CombinedLoginTournamentSetup.tsx:188`
- **Subtitle**: Dynamic greeting based on time of day:
  - "Good morning, please enter your name to get started."
  - "Good afternoon, please enter your name to get started."
  - "Good evening, please enter your name to get started."
  - *Location*: `src/features/tournament/CombinedLoginTournamentSetup.tsx:190`
- **Input Placeholder**: "YOUR NAME HERE..."
  - *Location*: `src/features/tournament/CombinedLoginTournamentSetup.tsx:196`
- **Input Aria Label**: "Enter your name to register as a judge"
  - *Location*: `src/features/tournament/CombinedLoginTournamentSetup.tsx:204`
- **Primary Button**: "STEP INSIDE" (when ready) / "PREPARING STAGE..." (when loading)
  - *Location*: `src/features/tournament/CombinedLoginTournamentSetup.tsx:218`
- **Random Name Button**: "[ RE-ROLL IDENTITY 🎲 ]"
  - *Location*: `src/features/tournament/CombinedLoginTournamentSetup.tsx:237`
- **Random Name Aria Label**: "Generate random name"
  - *Location*: `src/features/tournament/CombinedLoginTournamentSetup.tsx:227`
- **Cat Fact Tape**: 
  - "PREPARING FELINE WISDOM..." (loading state)
  - "Fun Fact: {cat fact}" (when loaded)
  - *Location*: `src/features/tournament/CombinedLoginTournamentSetup.tsx:179-185`

#### Name Identity Section
- **Edit Button**: "[ EDIT ]"
- **Edit Button Aria Label**: "Change Name"
- **Save Button**: "✓"
- **Edit Input Aria Label**: "Edit name"
- **Cat Fact Section**: "SYNCING FELINE DATABASE..." (loading) / "{cat fact in uppercase}" (loaded)

---

### Tournament Setup

#### Tournament Toolbar
- **Swipe Mode Toggle**: "Swipe Mode" (on) / "Grid Mode" (off)
- **Swipe Mode Aria Label**: "Enable swipe mode" / "Disable swipe mode"
- **Swipe Mode Title**: "Swipe mode: On" / "Swipe mode: Off"
- **Cat Pictures Toggle**: "🐱 Cats On" / "🐱 Cats Off"
- **Cat Pictures Aria Label**: "Show cat pictures" / "Hide cat pictures"
- **Cat Pictures Title**: "Cat pictures: On" / "Cat pictures: Off"
- **Filter Toggle**: "🔍 Hide Filters" / "🔍 Filter/Sort"
- **Filter Toggle Aria Label**: "Hide filters" / "Show filters"
- **Filter Toggle Title**: "Toggle search and filters"
- **Start Tournament Button**:
  - "Start Tournament ({count} names)" (when ready)
  - "Select at least 2 names ({count} selected)" (when not ready)
  - *Location*: `src/shared/components/TournamentToolbar/TournamentToolbar.tsx:439-441`
  - *See also*: [Swipe Mode Start Button](#swipe-completion)
- **Start Tournament Tooltip** (ready): "Start comparing {count} names head-to-head"
  - *Location*: `src/shared/components/TournamentToolbar/TournamentToolbar.tsx:443`
- **Start Tournament Tooltip** (not ready): "Select at least 2 names to start a tournament. You can select up to 64 names."
  - *Location*: `src/shared/components/TournamentToolbar/TournamentToolbar.tsx:445`
- **Start Tournament Hint**: "Select 1 more name" / "Select {n} more names"
  - *Location*: `src/shared/components/TournamentToolbar/TournamentToolbar.tsx:509-512`

#### Selection Progress
- **Aria Label**: "Selection Progress"
- **Count Display**: "{count} of {total} names selected"
  - *Location*: `src/shared/components/NameManagementView/modes/TournamentMode.tsx:129`
- **Count Label**: "{count} name selected" (singular) / "{count} names selected" (plural)
  - *Location*: `src/shared/components/TournamentToolbar/TournamentToolbar.tsx:437`
- **Progress Hint**: "(Need {n} more to start tournament)"
- **Show Selected Button**: "👁️ Show All Names" / "👀 Show Selected Only"
  - *Location*: `src/shared/components/NameManagementView/modes/TournamentMode.tsx:104`
  - *Location*: `src/shared/components/NameManagementView/modes/TournamentMode.tsx:104`

#### Search & Filters
- **Search**:
  - **Placeholder**: "Search candidates..."
- **Filter Labels**:
  - **Status**: "Status"
  - **User**: "User"
  - **Selection**: "Selection"
  - **Date**: "Date"
  - **Sort By**: "Sort By"
  - **Category**: "Category"
- **Filter Options**:
  - **Status**: "All Names", "Visible Only", "Hidden Only"
  - **User**: "All Users", "Current User", "Other Users"
  - **Selection**: "All Names", "Ever Selected", "Never Selected", "Frequently Selected", "Recently Selected"
  - **Date**: "All Dates", "Today", "This Week", "This Month", "This Year"
  - **Sort**: "Rating", "Name", "Wins", "Losses", "Win Rate", "Created"
  - **Sort Order**: "Ascending" / "Descending"
  - **Sort Order Toggle Aria Label**: "Toggle sort order to {direction}"
- **Results Display**:
  - **Count**: "{filteredCount} / {totalCount} filtered" or "{totalCount} total"
  - **Badge**: "filtered" / "total"

#### Photo Gallery View
- **Title**: "Photo Gallery"
  - *Location*: `src/features/tournament/CombinedLoginTournamentSetup.tsx:251`
- **Subtitle**: "Click any photo to view full size"
  - *Location*: `src/features/tournament/CombinedLoginTournamentSetup.tsx:252`
  - *See also*: [Photo Gallery](#photo-gallery)

---

### Tournament Voting

#### Tournament Header
- **Round Display**: "Round {roundNumber}"
- **Match Display**: "Match {currentMatchNumber} of {totalMatches}"
- **Match Aria Label**: "Match {currentMatchNumber} of {totalMatches} in round {roundNumber}"
- **Match Title**: "Current matchup in this round"
- **Progress Display**: "{progress}% Complete"
- **Progress Aria Label**: "Tournament is {progress}% complete. {eloTooltipText}"
- **Elo Tooltip**: "Each vote updates name rankings using the Elo rating system (same as chess rankings). Your preferences determine which names rank highest!"

#### Match Display
- **VS Text**: "VS"
- **Left Name Aria Label**: "Select {name}"
- **Right Name Aria Label**: "Select {name}"
- **Vote Confirmed Aria Label**: "Vote confirmed"
- **Current Matchup Aria Label**: "Current matchup"
- **Additional Options Aria Label**: "Additional voting options"
- **Unknown Name Fallback**: "Unknown"
- **Both Advance Message**: "Both \"{leftName}\" and \"{rightName}\" advance!"

#### Voting Buttons
- **I Like Both**: "I Like Both! (↑ Up)"
- **I Like Both Aria Label**: "Vote for both names (Press Up arrow key)"
- **Skip**: "Skip (↓ Down)"
- **Skip Aria Label**: "Skip this match (Press Down arrow key)"

#### Match Result Toast
- **Result Display**: "{winner name} wins!"
- **Context**: "Round {roundNumber} - Match {currentMatchNumber} of {totalMatches}"

#### Round Transition
- **Title**: "Round {nextRoundNumber}"
  - *Location*: `src/features/tournament/components/TournamentUI.tsx:171`
- **Subtitle**: "Tournament continues..."
  - *Location*: `src/features/tournament/components/TournamentUI.tsx:174`

#### Progress Milestones
- **50%**: "Halfway there! 🎉"
  - *Location*: `src/features/tournament/components/TournamentUI.tsx:195`
- **80%**: "Almost done! 🚀"
  - *Location*: `src/features/tournament/components/TournamentUI.tsx:204`

#### Undo Banner
- **Message**: "Vote recorded. {timeRemaining}s"
  - *Location*: `src/features/tournament/components/UndoBanner/UndoBanner.tsx:51`
- **First Time Hint**: "💡 You can undo your last vote if you change your mind!"
  - *Location*: `src/features/tournament/components/UndoBanner/UndoBanner.tsx:65`
- **Undo Button**: "Undo (Esc)"
  - *Location*: `src/features/tournament/components/UndoBanner/UndoBanner.tsx:76`
- **Undo Button Aria Label**: "Undo last vote (Esc)"
  - *Location*: `src/features/tournament/components/UndoBanner/UndoBanner.tsx:74`
  - *See also*: [Keyboard Shortcuts - Escape](#keyboard-shortcuts)

#### First Match Tutorial
- **Title**: "🎯 How to Vote"
  - *Location*: `src/features/tournament/components/FirstMatchTutorial/FirstMatchTutorial.tsx:54`
- **Close Button Aria Label**: "Close tutorial"
  - *Location*: `src/features/tournament/components/FirstMatchTutorial/FirstMatchTutorial.tsx:60`
- **Skip Button Aria Label**: "Skip tutorial"
  - *Location*: `src/features/tournament/components/FirstMatchTutorial/FirstMatchTutorial.tsx:107`
- **Step 1 Title**: "Click a name to vote for it"
  - *Location*: `src/features/tournament/components/FirstMatchTutorial/FirstMatchTutorial.tsx:70`
- **Step 1 Description**: "Choose which cat name you prefer in this matchup"
  - *Location*: `src/features/tournament/components/FirstMatchTutorial/FirstMatchTutorial.tsx:72`
- **Step 2 Title**: "Use keyboard shortcuts"
  - *Location*: `src/features/tournament/components/FirstMatchTutorial/FirstMatchTutorial.tsx:80`
- **Step 2 Description**: "Press ← or → to select, ↑ for both, ↓ to skip"
  - *Location*: `src/features/tournament/components/FirstMatchTutorial/FirstMatchTutorial.tsx:82`
  - *See also*: [Keyboard Shortcuts Help](#keyboard-shortcuts-help)
- **Step 3 Title**: "Undo if needed"
  - *Location*: `src/features/tournament/components/FirstMatchTutorial/FirstMatchTutorial.tsx:91`
- **Step 3 Description**: "You can undo your last vote within 2 seconds (or press Esc)"
  - *Location*: `src/features/tournament/components/FirstMatchTutorial/FirstMatchTutorial.tsx:93`
  - *See also*: [Undo Banner](#undo-banner)
- **Got It Button**: "Got it! Let's start"
  - *Location*: `src/features/tournament/components/FirstMatchTutorial/FirstMatchTutorial.tsx:101`
- **Skip Tutorial Button**: "Skip tutorial"
  - *Location*: `src/features/tournament/components/FirstMatchTutorial/FirstMatchTutorial.tsx:109`

#### Keyboard Shortcuts Help
- **Title**: "Keyboard Shortcuts"
  - *Location*: `src/features/tournament/components/TournamentUI.tsx:366`
- **Aria Label**: "Keyboard shortcuts help"
  - *Location*: `src/features/tournament/components/TournamentUI.tsx:364`
- **Shortcuts**:
  - "← Select left name"
    - *Location*: `src/features/tournament/components/TournamentUI.tsx:372`
  - "→ Select right name"
    - *Location*: `src/features/tournament/components/TournamentUI.tsx:378`
  - "↑ Vote for both names"
    - *Location*: `src/features/tournament/components/TournamentUI.tsx:384`
  - "↓ Skip this match"
    - *Location*: `src/features/tournament/components/TournamentUI.tsx:390`
  - "Space or Enter Vote for selected name"
    - *Location*: `src/features/tournament/components/TournamentUI.tsx:396-400`
  - "Escape Clear selection"
    - *Location*: `src/features/tournament/components/TournamentUI.tsx:406`
  - "Tab Navigate between elements"
    - *Location*: `src/features/tournament/components/TournamentUI.tsx:412`
  - "C Toggle cat pictures"
    - *Location*: `src/features/tournament/components/TournamentUI.tsx:418`
  - *See also*: [Quick Reference - Keyboard Shortcuts](#keyboard-shortcuts)

#### Tournament Footer
- **Show Bracket Button**: "Show Tournament History"
  - *Location*: `src/features/tournament/components/TournamentUI.tsx:303`
- **Hide Bracket Button**: "Hide Tournament History"
  - *Location*: `src/features/tournament/components/TournamentUI.tsx:303`
- **Bracket Hint**: "💡 View your tournament bracket history below"
  - *Location*: `src/features/tournament/components/TournamentUI.tsx:321`
- **Keyboard Shortcuts Button**: "Keyboard Shortcuts"
  - *Location*: `src/features/tournament/components/TournamentUI.tsx:349`
  - *See also*: [Keyboard Shortcuts Help](#keyboard-shortcuts-help)
- **Bracket View Aria Label**: "Tournament bracket history"
  - *Location*: `src/features/tournament/components/TournamentUI.tsx:436`
  - *See also*: [Tournament Bracket](#tournament-bracket)

#### Tournament Controls
- **Toolbar Aria Label**: "Tournament controls"
- **Mute/Unmute Title**: "Mute" / "Unmute"
- **Mute/Unmute Aria Label**: "Mute tournament sounds" / "Unmute tournament sounds"
- **Cat Pictures Toggle**: "🐱 Hide Cats" / "🐱 Show Cats"
- **Cat Pictures Aria Label**: "Hide cat pictures" / "Show cat pictures"
- **Next Track Button**: "Next track"
- **Next Track Aria Label**: "Next track"
- **Next Track Title**: "Now Playing: {trackInfo.name}\nClick for next track" / "Next track"
- **Shuffle Toggle Aria Label**: "Disable shuffle" / "Enable shuffle"
- **Shuffle Toggle Title**: "Shuffle: On (toggle to turn off)" / "Shuffle: Off (toggle to turn on)"
- **Retry Audio Aria Label**: "Retry playing audio"
- **Retry Audio Title**: "{audioError}"
- **Volume Labels**: "🎵" (music), "🎮" (effects)
- **Track Info Aria Live**: "polite"
- **Now Playing**: "Now Playing: {trackName}"
- **End Tournament Button**: "End Tournament Early"
  - *Location*: `src/features/tournament/TournamentControls.tsx:212`
- **End Tournament Aria Label**: "End tournament early"
  - *Location*: `src/features/tournament/TournamentControls.tsx:210`
- **End Tournament Confirmation**:
  - **Title**: "End Tournament?"
    - *Location*: `src/features/tournament/TournamentControls.tsx:229`
  - **Description**: "Are you sure you want to end the tournament early? Your progress will be saved, but you won't be able to continue voting."
    - *Location*: `src/features/tournament/TournamentControls.tsx:232`
  - **Confirm Button**: "Yes, End Tournament"
    - *Location*: `src/features/tournament/TournamentControls.tsx:241`
  - **Cancel Button**: "Cancel"
    - *Location*: `src/features/tournament/TournamentControls.tsx:248`

---

### Results & Rankings

#### Personal Results
- **Empty State**: "Complete a tournament to see your personal results here!"
  - *Location*: `src/features/tournament/components/PersonalResults.tsx:329`
- **Start New Button**: "Start New Tournament"
  - *Location*: `src/features/tournament/components/PersonalResults.tsx:332,442`
  - *See also*: [Tournament Setup - Start Tournament Button](#tournament-toolbar)
- **Top 3 Card Title**: "Your Top 3 Names"
  - *Location*: `src/features/tournament/components/PersonalResults.tsx:368`
- **Stats Cards**:
  - "Your Winner" (🏆)
    - *Location*: `src/features/tournament/components/PersonalResults.tsx:394`
  - "Top Name Score" (⭐)
    - *Location*: `src/features/tournament/components/PersonalResults.tsx:402`
  - "Total Names" (📝)
    - *Location*: `src/features/tournament/components/PersonalResults.tsx:410`
- **Bracket Section Title**: "Tournament Bracket"
  - *Location*: `src/features/tournament/components/PersonalResults.tsx:429`
  - *See also*: [Tournament Bracket](#tournament-bracket)
- **Calendar Button**: "Add to Calendar"
  - *Location*: `src/features/tournament/components/PersonalResults.tsx:115`
- **Calendar Button Aria Label**: "Add to Google Calendar"
  - *Location*: `src/features/tournament/components/PersonalResults.tsx:111`
- **Calendar Button Title**: "Add to Google Calendar"
  - *Location*: `src/features/tournament/components/PersonalResults.tsx:112`
- **Calendar Export**:
  - **Event Text**: "🐈‍⬛ {winnerName}"
    - *Location*: `src/features/tournament/components/PersonalResults.tsx:83`
  - **Event Details**: "Cat name rankings for {userName}:\n\n{ranked list with ratings}"
    - *Location*: `src/features/tournament/components/PersonalResults.tsx:84-88`
  - **No Winner Yet**: "No winner yet"
    - *Location*: `src/features/tournament/components/PersonalResults.tsx:73`

#### Rating Labels
- **Top Tier**: "Top Tier" (1800+)
- **Great**: "Great" (1600-1799)
- **Good**: "Good" (1400-1599)
- **Fair**: "Fair" (<1400)

#### Ranking Adjustment
- **Title**: "Your Cat Name Rankings"
  - *Location*: `src/features/tournament/RankingAdjustment.tsx:209`
- **Instructions Aria Label**: "Instructions for adjusting rankings"
  - *Location*: `src/features/tournament/RankingAdjustment.tsx:209`
- **Instructions Title**: "How to Adjust Rankings"
  - *Location*: `src/features/tournament/RankingAdjustment.tsx:209`
- **Instructions Text**: "Drag and drop names to reorder them. Names at the top will receive higher ratings. Your changes are saved automatically."
  - *Location*: `src/features/tournament/RankingAdjustment.tsx:209`
- **Column Headers**: "Rank", "Name", "Rating"
  - *Location*: `src/features/tournament/RankingAdjustment.tsx` (table headers)
- **Rating Display**: "Rating: {rating}"
  - *Location*: `src/features/tournament/RankingAdjustment.tsx` (rating column)
- **Record Display**: "W: {wins} L: {losses}"
  - *Location*: `src/features/tournament/RankingAdjustment.tsx` (record display)
- **Saving Status**: "Saving changes..."
  - *Location*: `src/features/tournament/RankingAdjustment.tsx:103`
- **Success Status**: "✓ Changes saved successfully"
  - *Location*: `src/features/tournament/RankingAdjustment.tsx:117`
- **Error Status**: "Failed to save changes. Your changes are still visible but not saved. Please try again or refresh the page."
  - *Location*: `src/features/tournament/RankingAdjustment.tsx:117`
- **Back Button**: "Back to Tournament"
  - *Location*: `src/features/tournament/RankingAdjustment.tsx` (back button)
- **Success Toast**: "Rankings updated successfully!"
  - *Location*: `src/features/tournament/components/PersonalResults.tsx:312`
  - *See also*: [Toast Messages - Rankings Updated](#toast-messages)
- **Error Toast**: "Failed to update rankings. Please try again."
  - *Location*: `src/features/tournament/components/PersonalResults.tsx:318`
  - *See also*: [Error Messages](#error-messages)

#### Tournament Bracket
- **Winner Badge Title**: "Winner"
- **Tie Badge Title**: "Both Liked"
- **Skip Badge Title**: "Skipped"
- **Round Title**: "Round {roundNumber}"
- **Round Matches**: "{count} match" / "{count} matches"
- **Bye Text**: "Bye"
- **VS Divider**: "vs"
- **Empty State**: "No matches to display yet"

#### Dashboard
- **Personal Title**: "My Tournament Results"
- **Global Title**: "Global Leaderboard"
- **Welcome Message**: "Welcome back, {userName}!"
- **View Toggle (Personal)**: "🏆 My Results"
- **View Toggle (Global)**: "🌍 Global Leaderboard"
- **Loading Dashboard**: "Loading Dashboard..."

---

## Shared Components

### Navigation

#### Navbar Brand
- **Brand Text**: "Tournament"
  - *Location*: `src/shared/components/AppNavbar/AppNavbar.tsx` (brand component)
- **Brand Subtext**: "Daily Bracket"
  - *Location*: `src/shared/components/AppNavbar/AppNavbar.tsx` (brand component)
- **Aria Label**: "Go to Tournament Dashboard"
  - *Location*: `src/shared/components/AppNavbar/AppNavbar.tsx:121`

#### Navigation Links
- **Gallery**: "Gallery" (full) / "Photos" (short)
  - *Location*: `src/shared/components/AppNavbar/NavbarUI.tsx:72-73`
- **Gallery Aria Label**: "Open cat photo gallery"
  - *Location*: `src/shared/components/AppNavbar/NavbarUI.tsx:75`
- **Analysis Mode**: "Analysis Mode" (full) / "Analysis" (short)
  - *Location*: `src/shared/components/AppNavbar/NavbarUI.tsx:81-82`
- **Analysis Aria Label**: "Enable analysis mode" / "Disable analysis mode"
  - *Location*: `src/shared/components/AppNavbar/NavbarUI.tsx:84`
  - *See also*: [Analytics & Analysis Mode](#analytics--analysis-mode)

#### Navbar Actions
- **Suggest Button**: "Suggest"
  - *Location*: `src/shared/components/AppNavbar/NavbarUI.tsx:136`
- **Suggest Aria Label**: "Suggest a name"
  - *Location*: `src/shared/components/AppNavbar/NavbarUI.tsx:136`
- **Suggest Title**: "Suggest a new cat name"
  - *Location*: `src/shared/components/AppNavbar/NavbarUI.tsx:137`
  - *See also*: [Name Suggestion Modal](#name-suggestion-modal)
- **Logout Button**: (icon only)
  - *Location*: `src/shared/components/AppNavbar/NavbarUI.tsx:147`
- **Logout Aria Label**: "Log out"
  - *Location*: `src/shared/components/AppNavbar/NavbarUI.tsx:147`
- **Logout Title**: "Log out"
  - *Location*: `src/shared/components/AppNavbar/NavbarUI.tsx:148`

#### Mode Toggles
- **Play Mode**: "PLAY"
  - *Location*: `src/shared/components/AppNavbar/NavbarUI.tsx:212`
- **Analysis Mode**: "ANALYSIS"
  - *Location*: `src/shared/components/AppNavbar/NavbarUI.tsx:213`
- **Toggle Aria Label**: "Toggle between Play and Analysis modes"
  - *Location*: `src/shared/components/AppNavbar/NavbarUI.tsx:214`
  - *See also*: [Analytics & Analysis Mode](#analytics--analysis-mode)

#### Mobile Menu
- **Toggle Aria Label**: "Open navigation menu" / "Close navigation menu"
- **Collapse Toggle Aria Label**: "Expand navigation" / "Collapse navigation"
- **Collapse Toggle Title**: "Expand" / "Collapse"
- **Mobile Navigation Aria Label**: "Mobile navigation"

---

### Forms & Inputs

#### Validated Input
- **Default Error**: "Invalid input"
- **Success Icon**: "✅"
- **Error Icon**: "❌"

#### Select
- **Placeholder**: "Select an option"

#### Name Suggestion Modal
- **Modal Header**:
  - **Title**: "💡 Suggest a Name"
    - *Location*: `src/shared/components/NameSuggestionModal/NameSuggestionModal.tsx:210`
  - **Description**: "Help us expand the list by suggesting new cat names!"
    - *Location*: `src/shared/components/NameSuggestionModal/NameSuggestionModal.tsx:224`
  - **Close Button**: "×"
    - *Location*: `src/shared/components/NameSuggestionModal/NameSuggestionModal.tsx:219`
  - **Close Button Aria Label**: "Close modal"
    - *Location*: `src/shared/components/NameSuggestionModal/NameSuggestionModal.tsx:216`
- **Form Fields**:
  - **Name Label**: "Name"
    - *Location*: `src/shared/components/NameSuggestionModal/NameSuggestionModal.tsx:236`
  - **Name Placeholder**: "e.g., Whiskers"
    - *Location*: `src/shared/components/NameSuggestionModal/NameSuggestionModal.tsx:247`
  - **Description Label**: "Description"
    - *Location*: `src/shared/components/NameSuggestionModal/NameSuggestionModal.tsx:258`
  - **Description Placeholder**: "Why is this name special? (e.g. 'He looks like a vampire!')"
    - *Location*: `src/shared/components/NameSuggestionModal/NameSuggestionModal.tsx:270`
  - **Description Error**: "Description can be short!"
    - *Location*: `src/shared/components/NameSuggestionModal/NameSuggestionModal.tsx:31`
- **Form Actions**:
  - **Cancel Button**: "Cancel"
    - *Location*: `src/shared/components/NameSuggestionModal/NameSuggestionModal.tsx:291`
  - **Submit Button**: "Submit Suggestion" / "Submitting..."
    - *Location*: `src/shared/components/NameSuggestionModal/NameSuggestionModal.tsx:298`
  - **Success Message**: "Thank you for your suggestion!"
    - *Location*: `src/shared/components/NameSuggestionModal/NameSuggestionModal.tsx:75`
    - *See also*: [Toast Messages - Name Suggestion](#toast-messages)
- **Validation Messages**:
  - **Name Required**: "Name must be at least 2 characters"
    - *Location*: `src/shared/components/NameSuggestionModal/NameSuggestionModal.tsx:25`
  - **Name Too Long**: "Name must be 50 characters or less"
    - *Location*: `src/shared/components/NameSuggestionModal/NameSuggestionModal.tsx:26`
  - **Description Too Long**: "Description must be 500 characters or less"
    - *Location*: `src/shared/components/NameSuggestionModal/NameSuggestionModal.tsx:33`
  - **Login Required**: "Please log in to suggest a name."
    - *Location*: `src/shared/components/NameSuggestionModal/NameSuggestionModal.tsx:59`
  - **Generic Error**: "Unable to submit your suggestion. Please try again."
    - *Location*: `src/shared/components/NameSuggestionModal/NameSuggestionModal.tsx:97`

#### Create Tournament Form
- **Form Fields**:
  - **Tournament Name Label**: "Tournament Name"
  - **Tournament Name Placeholder**: "Enter tournament name"
  - **Cat Names Label**: "Cat Names"
  - **Cat Name Placeholder**: "Enter cat name"
  - **Add Button**: "Add"
- **Validation Messages**:
  - **Tournament Name Required**: "Tournament name is required"
  - **Tournament Name Too Long**: "Name too long"
  - **Names Minimum**: "At least 4 names required"
  - **Names Maximum**: "Maximum 16 names"
- **Submit Button**: "Creating..." / "Create Tournament"
- **Select Placeholder**: "Choose an option"
  - *Location*: `src/shared/components/Form/Form.tsx:240`
- **Generic Validation Error**: "Please check your input"
  - *Location*: `src/shared/components/ValidatedInput/ValidatedInput.tsx:51`, `src/shared/hooks/useValidatedForm.ts:38`
- **Validation Rules**:
  - **Required**: "This field is required"
    - *Location*: `src/shared/utils/errorHandling.ts:109`
  - **Min Length**: "Please enter at least {min} characters"
    - *Location*: `src/shared/utils/errorHandling.ts:118`
  - **Max Length**: "Please enter no more than {max} characters"
    - *Location*: `src/shared/utils/errorHandling.ts:124`
  - **Email**: "Please enter a valid email address"
    - *Location*: `src/shared/utils/errorHandling.ts:127`

---

### Cards & Displays

#### Card Name
- **Average Rating Title**: "Average Rating"
- **Popularity Score Title**: "Popularity Score"
- **Tournament Appearances Title**: "Tournament Appearances"
- **Tooltip Labels**: "Rating", "Wins", "Losses", "Total Matches", "Win Rate"
- **Tooltip Categories Label**: "Categories:"
- **Tooltip Rank**: "#{rank}"
- **Aria Label Format**: "{name} - {description} - {selected/disabled/hidden}"
  - *Location*: `src/shared/components/Card/components/CardName.tsx:189-204`
  - Examples: "Whiskers - selected", "Fluffy - A fluffy cat - disabled", "Shadow - hidden"
  - Uses dashes instead of parentheses for better screen reader flow

#### Card Stats
- **Default Label**: "Statistic"

#### Performance Badge
- **Title**: "{badgeDescription}"
- **Aria Label**: "{badgeLabel}: {badgeDescription}"

---

### Modals & Dialogs

#### Collapsible Headers
- **Toggle Aria Label**: "Expand {title}" / "Collapse {title}"
- **Title**: (Shows title when collapsed)

#### Photo Gallery
- **Photo Components**:
  - **Photo Aria Label**: "Open cat photo {index + 1}"
  - **Gallery Title**: "Cat Photos"
  - **Upload Button**: "📤 Upload"
  - **Show All Button**: "Show Less" / "Show All {count} Photos"
  - **Error Placeholder**: "📷 Unable to load image"
    - *Location*: `src/features/tournament/components/TournamentSidebar/PhotoComponents.tsx:121`
  - **Photo Icon**: "👁️"
- **Lightbox**:
  - **Gallery Aria Label**: "Image gallery"
  - **Close Button Aria Label**: "Close gallery (or press Escape)"
  - **Close Button Title**: "Close (ESC)"
  - **Previous Aria Label**: "Previous photo"
  - **Next Aria Label**: "Next photo"
  - **Counter**: "{currentIndex + 1} / {totalCount}"
  - **Counter Aria Live**: "polite"

---

## System Messages

### Error Messages

#### Error Boundary
- **Title**: "Something went wrong"
- **Aria Label**: "An error has occurred."
- **Retry Button**: "Try Again" / "Reload"
- **Home Button**: "Home"
- **Copy Diagnostics Button**: "Copy Diagnostics" / "Copied!"
- **Error Details Summary**: "Error Details"

#### User-Friendly Error Messages
- **Network Errors**:
  - Low: "Connection is slow. Please try again."
  - Medium: "Having trouble connecting. Check your internet and try again."
  - High: "Can't connect right now. Please try again in a moment."
  - Critical: "Service is temporarily unavailable. Please try again later."
  - *Location*: `src/shared/services/errorManager/index.ts:87-92`
- **Auth Errors**:
  - Low: "Please log in again to continue."
  - Medium: "Your session expired. Please log in again."
  - High: "Sign-in failed. Please check your credentials and try again."
  - Critical: "Unable to access your account. Please contact support if this continues."
  - *Location*: `src/shared/services/errorManager/index.ts:93-98`
- **Database Errors**:
  - Low: "Data is loading slowly. Please wait a moment."
  - Medium: "Having trouble loading data. Please refresh the page."
  - High: "Unable to load data right now. Please try again later."
  - Critical: "Data service is temporarily unavailable. Please try again later."
  - *Location*: `src/shared/services/errorManager/index.ts:99-104`
- **Validation Errors**:
  - Low: "Please check your input and try again."
  - Medium: "There's an issue with your input. Please review and try again."
  - High: "Invalid information entered. Please check your data and try again."
  - Critical: "Unable to process your request. Please contact support if this continues."
  - *Location*: `src/shared/services/errorManager/index.ts:105-110`
- **Runtime Errors**:
  - Low: "Something went wrong. Please try again."
  - Medium: "An error occurred. Please refresh the page and try again."
  - High: "Something went wrong. Please try again in a moment."
  - Critical: "We're experiencing technical difficulties. Please try again later or contact support."
  - *Location*: `src/shared/services/errorManager/index.ts:111-116`
- **Unknown Errors**:
  - Low: "Something unexpected happened. Please try again."
  - Medium: "An unexpected error occurred. Please try again."
  - High: "Something went wrong. Please try again later."
  - Critical: "We encountered an unexpected issue. Please try again later or contact support."
  - *Location*: `src/shared/services/errorManager/index.ts:117-122`
- **Offline Detection**: "You're currently offline. Please check your internet connection and try again."
  - *Location*: `src/shared/services/errorManager/index.ts:310`

#### Inline Errors
- **Icon**: "⚠️"
- **Generic Message**: "Error"

#### Error List
- **Clear All Button**: "Clear All"
- **Dismiss Button**: "×"

#### Context-Specific Errors
- **Home Page**: 
  - Title: "Unable to load tournaments"
  - Message: "Please try refreshing the page. If the problem continues, check your connection."
  - *Location*: `src/pages/HomePage.tsx:20-21`
- **Tournament Error**: 
  - Title: "Tournament Error"
  - Message: "Something went wrong with the tournament. Please try restarting it."
  - Button: "Restart Tournament"
  - *Location*: `src/features/tournament/components/TournamentErrorState/TournamentErrorState.tsx:6-9`
- **Analysis Error**: 
  - Message: "Unable to load names. Please try refreshing the page."
  - *Location*: `src/features/analytics/components/AnalysisDashboard.tsx:222`
- **Name Management**: "An error occurred while loading data"
- **Tournament Match**: (Uses Error component with context "vote")
- **Vote Failed**: 
  - Message: "Unable to submit vote. Please try again."
  - *Location*: `src/features/tournament/hooks/tournamentComponentHooks.ts:735,741`
- **Match Skipped**: "Match skipped"
  - *Location*: `src/features/tournament/hooks/tournamentComponentHooks.ts:588`
- **Profile Operations**:
  - Update Visibility: "Unable to update visibility: {error.message}"
    - *Location*: `src/features/profile/hooks/useProfile.ts:546`
  - Delete Name: "Unable to delete name: {error.message}"
    - *Location*: `src/features/profile/hooks/useProfile.ts:566`
  - Operation Failed: "Unable to complete operation. Please try again."
    - *Location*: `src/features/profile/hooks/useProfile.ts:615`
  - Bulk Operation Failed: "Unable to complete bulk operation: {error.message}"
    - *Location*: `src/features/profile/hooks/useProfile.ts:619`
- **Analysis Operations**:
  - Hide Names: "Unable to hide names: {errorMessage}"
    - *Location*: `src/features/tournament/components/AnalysisWrappers.tsx:373`
  - Unhide Names: "Unable to unhide names: {errorMessage}"
    - *Location*: `src/features/tournament/components/AnalysisWrappers.tsx:386`
- **Tournament Operations**:
  - Create Tournament: "Unable to create tournament. Please try again."
    - *Location*: `src/shared/hooks/useTournament.ts:47`
  - Update Tournament: "Unable to update tournament. Please try again."
    - *Location*: `src/shared/hooks/useTournament.ts:73`
  - Delete Tournament: "Unable to delete tournament. Please try again."
    - *Location*: `src/shared/hooks/useTournament.ts:95`
- **Rankings Update**:
  - Failed to Update: "Unable to update rankings. Please try again."
    - *Location*: `src/features/tournament/components/PersonalResults.tsx:318`
- **Name Suggestion**:
  - Add Name Error: "Unable to add name. Please try again."
    - *Location*: `src/shared/components/NameSuggestionModal/NameSuggestionModal.tsx:72`
- **Context Map** (ErrorManager):
  - "Tournament Completion": "Unable to complete tournament"
  - "Tournament Setup": "Unable to set up tournament"
  - "Rating Update": "Unable to update ratings"
  - "Login": "Unable to log in"
  - "Profile Load": "Unable to load profile"
  - "Save Rankings": "Unable to save rankings"
  - "vote": "Unable to submit vote"
  - *Location*: `src/shared/services/errorManager/index.ts:294-301`

---

### Loading States

#### General Loading
- **Aria Label**: "Loading"
- **Screen Reader Text**: "Loading..."
- **Loading Tournaments**: "Loading tournaments..."
- **Loading Top Names**: "Loading top names..."
- **Loading Dashboard**: "Loading Dashboard..."
- **Initializing Tournament**: "Initializing Tournament..."

#### Tournament Loading
- **Starting Tournament**: "Starting tournament..."
- **Preparing Tournament**: "Preparing tournament..."
- **Setting Up Tournament**: "Setting up tournament..."
- **No Visible Names**: "No visible names available. Please check your filters or try again."
  - *Location*: `src/features/tournament/components/TournamentLoadingState/TournamentLoadingState.tsx:21`

#### Loading Components
- **Skeleton Loader**: (No text, visual only)
- **Unified Loading**: Aria Label: "Loading", Screen Reader: "Loading..."
- **Loading (Spinner)**: Alt Text: "Loading...", Screen Reader: "Loading..."

---

### Empty States

#### Name Grid
- **Title**: "No names found"
  - *Location*: `src/shared/components/NameGrid/NameGrid.tsx:170`
- **Description (Selected Only)**: "You haven't selected any names yet. Switch back to browse mode to pick some favorites!"
  - *Location*: `src/shared/components/NameGrid/NameGrid.tsx:173`
- **Description (Filtered)**: "No names match your search or filters. Try adjusting your filters or search terms to find what you're looking for."
  - *Location*: `src/shared/components/NameGrid/NameGrid.tsx:174`
- **Icon (Selected)**: "🕸️"
  - *Location*: `src/shared/components/NameGrid/NameGrid.tsx:176`
- **Icon (Filtered)**: "🔍"
  - *Location*: `src/shared/components/NameGrid/NameGrid.tsx:176`
  - *See also*: [Empty States](#empty-states)

#### Analysis Dashboard
- **Empty State**: "No names available yet. Start a tournament to see results here!"
  - *Location*: `src/features/analytics/components/AnalysisDashboard.tsx:225`
  - *See also*: [Empty States](#empty-states)

#### Tournament List
- **Empty State**: "No tournaments yet. Create your first tournament to get started!"
  - *Location*: `src/features/tournament/components/TournamentList.tsx:12`
- **Tournament Status**: "Status: {Complete/In Progress}"
  - *Location*: Tournament list components
- **Names Count**: "{count} names"
  - *Location*: Tournament list components
  - *See also*: [Empty States](#empty-states)

#### Tournament Bracket
- **Empty State**: "No matches to display yet"

---

### Success Messages

#### Toast Messages
- **Name Suggestion**: 
  - "Name suggestion submitted!" / "Thank you for your suggestion!"
  - *Location*: `src/shared/components/NameSuggestionModal/NameSuggestionModal.tsx:76,75`
  - *See also*: [Name Suggestion Modal](#name-suggestion-modal)
- **Rankings Updated**: 
  - "Rankings updated successfully!"
  - *Location*: `src/features/tournament/components/PersonalResults.tsx:312`
  - *See also*: [Ranking Adjustment](#ranking-adjustment)
- **Starting Tournament**: 
  - "Starting tournament..."
  - *Location*: Multiple tournament setup components
- **Vote Recorded**: 
  - "Vote recorded successfully!"
  - *Location*: Tournament voting components
  - *See also*: [Undo Banner](#undo-banner)
- **Name Hidden/Unhidden**: 
  - "\"{name}\" is now visible" / "\"{name}\" is now hidden"
  - *Location*: `src/features/profile/hooks/useProfile.ts:530`
- **Name Deleted**: 
  - "\"{name}\" has been deleted"
  - *Location*: `src/features/profile/hooks/useProfile.ts:562`
- **Bulk Hide/Unhide**: 
  - "Successfully {hidden/unhidden} {count} {name/names}" (handles singular/plural)
  - *Location*: `src/features/profile/hooks/useProfile.ts:599`

#### Toast Container
- **Aria Label**: "Notifications"
- **Hidden Count**: "+{count} more"
- **Dismiss Aria Label**: "Dismiss notification"
- **Close Button**: "×"
- **Retry Button**: "Retry"
- **Icons**: Success: "✅", Error: "❌", Warning: "⚠️", Info: "ℹ️"

---

## Utility Text

### Labels & Metrics

#### Metric Labels
- **Rating**: "Rating"
- **Wins**: "Wins"
- **Total Wins**: "Wins"
- **Selected**: "Selected"
- **Avg Rating**: "Avg Rating"
- **Date Added**: "Date Added"

#### Insight Categories
- **Top Rated**: "Top Rated" - "In the top 10% by rating"
- **Trending Up**: "Trending Up" - "Gaining popularity"
- **Trending Down**: "Trending Down" - "Losing popularity"
- **Most Selected**: "Most Selected" - "One of the top selections"
- **Underrated**: "Underrated" - "Good rating but low selections"
- **New**: "New" - "Recently added"
- **Undefeated**: "Undefeated" - "No losses yet"
- **Undiscovered**: "Undiscovered" - "Never selected yet"

#### Rank Display
- **1st**: "🥇 1st"
- **2nd**: "🥈 2nd"
- **3rd**: "🥉 3rd"
- **4th-10th**: "🏅 {rank}th"
- **11th+**: "{rank}th"

---

### Formatting

#### Date Formatting
- **Invalid Date**: "Invalid Date"
- **Date Unknown**: "Date unknown"
- **Date Submitted Aria Label**: "Submitted: {date}"

---

### Status Indicators

#### Offline Indicator
- **Offline**: "You are offline"
- **Back Online**: "Back online"
- **Slow Connection**: "Slow connection detected"
- **Connected**: "Connected"

#### Profile Preferences
- **Large Tournament Preference**: "You prefer large tournaments with many names"
- **Medium Tournament Preference**: "You enjoy medium-sized tournaments"
- **Small Tournament Preference**: "You prefer focused, smaller tournaments"
- **Analyzing Preferences**: "Analyzing your preferences..."
- **Favoring Names**: "You favor: {names}"
- **Discovering Preferences**: "Discovering your preferences..."
- **Start Selecting**: "Start selecting names to see your first tournament!"
- **Create More Tournaments**: "Try creating more tournaments to discover your preferences"
- **Build Streak**: "Build a selection streak by playing daily"
- **Active Participant**: "Great job! You're an active tournament participant"
- **Aggregate Data**: "Aggregate data from all users"
- **Total Activity**: "Total activity across {count} users"

#### Admin Messages
- **Only Admins Can Change Visibility**: "Only admins can change name visibility"
  - *Location*: `src/features/profile/hooks/useProfile.ts:519`
- **Only Admins Can Delete**: "Only admins can delete names"
  - *Location*: `src/features/profile/hooks/useProfile.ts:555`
- **Only Admins Can Perform Bulk Operations**: "Only admins can perform bulk operations on names"
  - *Location*: `src/features/profile/hooks/useProfile.ts:587`
- **Unhidden**: "\"{name}\" is now visible"
  - *Location*: `src/features/profile/hooks/useProfile.ts:530`
- **Hidden**: "\"{name}\" is now hidden"
  - *Location*: `src/features/profile/hooks/useProfile.ts:530`
- **Deleted**: "\"{name}\" has been deleted"
  - *Location*: `src/features/profile/hooks/useProfile.ts:562`
- **Bulk Success**: "Successfully {hidden/unhidden} {count} {name/names}" (handles singular/plural)
  - *Location*: `src/features/profile/hooks/useProfile.ts:599`
- **Bulk Error**: "Unable to complete bulk operation: {error.message}"
  - *Location*: `src/features/profile/hooks/useProfile.ts:619`
- **Analysis Wrappers**:
  - **No Names Selected**: "Please select at least one name to continue"
    - *Location*: `src/features/tournament/components/AnalysisWrappers.tsx:364,378`
  - **Failed to Hide Names**: "Unable to hide names: {errorMessage}"
    - *Location*: `src/features/tournament/components/AnalysisWrappers.tsx:373`

---

## API & External

### API Endpoints

#### Submit Name API
- **Page Title**: "Submit Cat Name - Name Nosferatu"
- **Page Subtitle**: "Add a new name to the Name Nosferatu database"
- **Form Labels**:
  - "Name *" (required indicator)
  - "Description"
  - "Your Name (optional)"
- **Placeholders**:
  - Name: "e.g., Rococo"
  - Description: "Why is this name special? (e.g., An ornate and elaborate art style from 18th century France)"
  - User Name: "For attribution"
- **Character Counters**: "{count}/100 characters", "{count}/500 characters"
- **Submit Button**: "Submit Name" / "Submitting..."
- **Success Message**: "✅ {message}\nID: {id}"
- **Error Message**: "❌ {error}"
- **Network Error**: "❌ Network error: {error.message}"
- **Tip**: "💡 Tip: You can also use the API directly:\nPOST /api/submit-name with JSON body\nor visit GET /api/submit-name for full documentation"

#### API Response Messages
- **Success**: "Name \"{name}\" submitted successfully!"
- **Error**: "Name is required and must be a non-empty string."
- **Validation Error**: "Name must be between 1 and 100 characters."
- **Description Too Long**: "Description must be 500 characters or less."
- **Duplicate Error**: "A similar name already exists."
- **Duplicate Hint**: "Names are case-insensitive. This name may already be in the database."
- **Server Error**: "Server configuration error. Supabase credentials not found."
- **Internal Error**: "Internal server error"

---

### Meta Tags & Manifest

#### HTML Meta Tags
- **Page Title**: "Help Me Name My Cat!"
- **Meta Description**: "Pick the perfect cat name via a fun tournament. Save, compare, and share results."
- **OG Title**: "Name Nosferatu"
- **OG Description**: "Tournament-style voting for cat names."
- **Twitter Title**: "Name Nosferatu"
- **Twitter Description**: "Tournament-style voting for cat names."

#### Manifest
- **App Name**: "Name Nosferatu"
- **Short Name**: "NameNosferatu"
- **Description**: "Pick the perfect cat name via a fun tournament. Save, compare, and share results."

#### App Layout
- **Skip Link**: "Skip to main content"
- **Tournament Aria Label**: "Tournament voting interface"

---

## Additional Features

### Swipe Mode

#### Swipe Controls
- **Controls Aria Label**: "Swipe controls"
- **Undo Button**: "↩️ Undo"
- **Undo Aria Label**: "Undo last swipe"
- **Reject Button**: "❌ Reject"
- **Reject Aria Label**: "Reject name"
- **Accept Button**: "✅ Accept"
- **Accept Aria Label**: "Accept name"
- **Card Progress**: "{currentIndex + 1} / {totalCount}"
- **Name Card Aria Label**: "Name card for {name}"

#### Swipe Completion
- **Title**: "All caught up!"
  - *Location*: `src/features/tournament/components/SwipeableNameCards.tsx`
- **Message**: "You've gone through all available names."
  - *Location*: `src/features/tournament/components/SwipeableNameCards.tsx`
- **Start Tournament Button**: "Start Tournament ({count} selected)"
  - *Location*: `src/features/tournament/components/SwipeableNameCards.tsx`
  - *See also*: [Tournament Setup - Start Tournament Button](#tournament-toolbar)
- **Minimum Selection Message**: "Select at least 2 names to start a tournament."
  - *Location*: `src/features/tournament/components/SwipeableNameCards.tsx`

---

### Analytics & Analysis Mode

#### Analysis Dashboard
- **Title (Admin)**: "All Names"
- **Title (User)**: "Top Names"
- **Icon (Admin)**: "📈"
- **Icon (User)**: "📊"
- **View Toggle Options**:
  - "📊 Bump Chart"
  - "📋 Table"
  - "💡 Insights"

#### Analysis Table
- **Aria Label**: "Top performing cat names ranked by rating, wins, and selection count"
- **Rating Aria Label**: "Rating: {rating} ({percentile}th percentile)" / "Rating: {rating}"
- **Wins Aria Label**: "Wins: {wins}"
- **Selected Aria Label**: "Selected {count} times ({percentile}th percentile)" / "Selected {count} times"
- **Date Submitted Aria Label**: "Submitted: {date}"
- **Date Unknown Aria Label**: "Date unknown"
- **Hide Name Aria Label**: "Hide {name}"
- **Hide Name Title**: "Hide this name from tournaments"

#### Column Headers
- **Metric Title**: "Metric: {metricName}"

#### Analysis Insights
- **Hide Name Aria Label**: "Hide {name}"
- **Hide Name Title**: "Hide this name"
- **Section Title (Low Performers)**: "⚠️ Names to Consider Hiding"
- **Section Title (Top Performers)**: "✨ Top Performers (Keep)"
- **Stat Labels**: "Total Names", "Avg Rating", "Total Votes", "Top Rating", "Total Selected"
- **Stat Subtexts**: "{count} active", "Global Average", "{count} selections", "Across {count} names", "Most: {count}x", "No selections yet"

---

### Home Page

#### Header
- **Welcome**: "Welcome back, {userName}!"
  - *Location*: `src/features/tournament/Dashboard.tsx:125`, `src/pages/HomePage.tsx:29`
- **Subtitle**: "Manage your cat name tournaments"
  - *Location*: `src/pages/HomePage.tsx:30`

#### Sections
- **Create Tournament**: "Create New Tournament"
  - *Location*: `src/pages/HomePage.tsx:35`
- **Your Tournaments**: "Your Tournaments"
  - *Location*: `src/pages/HomePage.tsx:43`

#### Home Page Error
- **Title**: "Unable to load tournaments"
  - *Location*: `src/pages/HomePage.tsx:20`
- **Message**: "Please try refreshing the page. If the problem continues, check your connection."
  - *Location*: `src/pages/HomePage.tsx:21`

---

---

## Examples & Edge Cases

### Dynamic Content Examples

#### Tournament Progress
- **Example 1**: "Round 3" (early tournament)
- **Example 2**: "Match 5 of 8" (mid-round)
- **Example 3**: "75% Complete" (three-quarters done)
- **Example 4**: "Match 1 of 1" (final match)

#### Selection Progress
- **Example 1**: "1 of 50 names selected" (just started)
- **Example 2**: "25 of 50 names selected" (halfway)
- **Example 3**: "50 of 50 names selected" (complete)
- **Edge Case**: "0 of 50 names selected" (no selection yet)

#### Results Count
- **Example 1**: "25 / 100 filtered" (with filters active)
- **Example 2**: "100 total" (no filters)
- **Example 3**: "1 total" (single result)

#### Match Results
- **Example 1**: "Whiskers wins!" (single winner)
- **Example 2**: "Both \"Whiskers\" and \"Fluffy\" advance!" (tie)
- **Example 3**: "Match skipped" (user skipped)

#### Rating Labels
- **Example 1**: "Top Tier (1850)" (high rating)
- **Example 2**: "Great (1650)" (good rating)
- **Example 3**: "Good (1450)" (average rating)
- **Example 4**: "Fair (1200)" (low rating)

### Pluralization Examples
- **Singular**: "1 name selected", "1 match", "1 tournament"
- **Plural**: "5 names selected", "8 matches", "3 tournaments"
- **Zero**: "0 names selected", "No matches", "No tournaments"

### Date Formatting Examples
- **Relative**: "2 days ago", "1 week ago", "Just now"
- **Absolute**: "Jan 15, 2025", "December 3, 2024"
- **Invalid**: "Invalid Date" (fallback)
- **Unknown**: "Date unknown" (missing data)

### Error Message Examples
- **Network**: "Connection is slow. Please try again." (low severity)
- **Auth**: "Session expired. Please log in again." (medium severity)
- **Validation**: "Name must be at least 2 characters" (specific)
- **Generic**: "Something went wrong. Please try again." (fallback)

### Button State Examples
- **Ready**: "Start Tournament (8 names)"
- **Not Ready**: "Select at least 2 names (1 selected)"
- **Loading**: "Submitting...", "Creating...", "Saving changes..."
- **Disabled**: Same text but visually disabled

### Empty State Examples
- **No Data**: "No names found" with search icon
- **No Selection**: "You haven't selected any names yet..." with web icon
- **No Results**: "No matches to display yet"
- **Loading**: "Loading tournaments..." (not empty, but no data yet)

---

## Index of Common Elements

### All Button Labels
- "Start Tournament ({count} names)"
- "Select at least 2 names ({count} selected)"
- "Start New Tournament"
- "Submit Suggestion" / "Submitting..."
- "Cancel"
- "Back to Tournament"
- "Add to Calendar"
- "End Tournament Early"
- "Yes, End Tournament"
- "Undo (Esc)"
- "Got it! Let's start"
- "Skip tutorial"
- "Show Tournament History" / "Hide Tournament History"
- "Keyboard Shortcuts"
- "Restart Tournament"
- "Try Again" / "Reload"
- "Home"
- "Copy Diagnostics" / "Copied!"
- "Clear All"
- "Retry"
- "↩️ Undo" (swipe mode)
- "❌ Reject" (swipe mode)
- "✅ Accept" (swipe mode)

### All Error Messages
- See [Error Messages](#error-messages) section for complete list
- Network, Auth, Database, Validation, Runtime, Unknown errors
- Context-specific errors (Home Page, Tournament, Analysis, etc.)

### All Loading Messages
- "Loading..."
- "Loading tournaments..."
- "Loading top names..."
- "Loading Dashboard..."
- "Initializing Tournament..."
- "Starting tournament..."
- "Preparing tournament..."
- "Setting up tournament..."
- "No visible names available..."
- "PREPARING FELINE WISDOM..."
- "SYNCING FELINE DATABASE..."
- "Submitting..."
- "Creating..."
- "Saving changes..."

### All Empty State Messages
- "No names found"
- "No names available yet."
- "No tournaments yet. Create your first tournament!"
- "No matches to display yet"
- "Complete a tournament to see your personal results here!"
- "You haven't selected any names yet. Go back to browse mode to pick some favorites!"

### All Success Messages
- "Name suggestion submitted!" / "Thank you for your suggestion!"
- "Rankings updated successfully!"
- "Starting tournament..."
- "Vote recorded successfully!"
- "Unhidden" / "Hidden"
- "Deleted {name}"
- "Successfully {action} {count} names"
- "✓ Changes saved successfully"

### All Aria Labels (Key Interactive Elements)
- "Go to Tournament Dashboard"
- "Open cat photo gallery"
- "Enable analysis mode" / "Disable analysis mode"
- "Suggest a name"
- "Log out"
- "Toggle between Play and Analysis modes"
- "Open navigation menu" / "Close navigation menu"
- "Expand navigation" / "Collapse navigation"
- "Selection Progress"
- "Enable swipe mode" / "Disable swipe mode"
- "Show cat pictures" / "Hide cat pictures"
- "Hide filters" / "Show filters"
- "Toggle sort order to {direction}"
- "Select {name}"
- "Vote confirmed"
- "Current matchup"
- "Additional voting options"
- "Vote for both names (Press Up arrow key)"
- "Skip this match (Press Down arrow key)"
- "Undo last vote (Esc)"
- "Close tutorial"
- "Skip tutorial"
- "Keyboard shortcuts help"
- "Tournament bracket history"
- "Tournament controls"
- "Mute tournament sounds" / "Unmute tournament sounds"
- "Next track"
- "Disable shuffle" / "Enable shuffle"
- "Retry playing audio"
- "End tournament early"
- "Add to Google Calendar"
- "Close modal"
- "Close gallery (or press Escape)"
- "Previous photo"
- "Next photo"
- "Open cat photo {index + 1}"
- "Expand {title}" / "Collapse {title}"
- "Hide {name}"
- "Dismiss notification"
- "Undo last swipe"
- "Reject name"
- "Accept name"
- "Name card for {name}"

---

## Glossary

### Common Terms
- **Tournament**: A head-to-head comparison session where users vote on cat names
- **Match**: A single comparison between two names
- **Round**: A stage in the tournament bracket
- **Rating**: Elo-based score for each name (default: 1500)
- **Selection**: When a name is chosen for a tournament
- **Visibility**: Whether a name is shown in tournaments (visible/hidden)
- **Analysis Mode**: Advanced view with statistics and insights
- **Swipe Mode**: Mobile-friendly card-based selection interface

### User Roles
- **Admin**: Can manage all names, view global analytics, hide/unhide names
- **User**: Can create tournaments, vote, view personal results

### Status Types
- **Visible**: Name appears in tournaments
- **Hidden**: Name is hidden from tournaments (admin only)
- **Active**: Name is available for selection
- **Inactive**: Name is not available (deprecated)

---

## Notes

### Accessibility
- All interactive elements include `aria-label` attributes
- Tooltips and `title` attributes provide additional context
- Screen reader text is included for loading states
- Status messages use `aria-live` regions where appropriate

### User Experience
- Error messages are user-friendly and actionable
- Loading states provide clear feedback
- Empty states guide users on next steps
- Success messages confirm actions
- Keyboard shortcuts are documented in the UI

### Content Guidelines
- Dynamic content uses placeholders like `{variableName}` to indicate where values are inserted
- Emojis are used sparingly for visual interest and clarity
- Button text is action-oriented and concise
- Error messages avoid technical jargon when possible

### Maintenance
- When updating copy, search for all instances across the codebase
- Update both the displayed text and any associated aria-labels
- Test with screen readers when changing accessibility text
- Keep error messages consistent with the severity levels defined in the error manager

---

## Critique & Analysis

### Strengths

#### 1. Comprehensive Coverage
- **✅ Complete Inventory**: The document successfully catalogs virtually all user-facing text across the application
- **✅ Multiple Contexts**: Includes UI text, error messages, loading states, API responses, and meta tags
- **✅ Accessibility Focus**: Thoroughly documents aria-labels and accessibility attributes

#### 2. Organization
- **✅ Logical Flow**: User journey structure (Login → Setup → Voting → Results) mirrors actual user experience
- **✅ Clear Hierarchy**: Well-structured sections and subsections make navigation intuitive
- **✅ Quick Reference**: Tables for keyboard shortcuts and placeholders provide fast lookup

#### 3. Practical Utility
- **✅ Actionable**: Includes both what the text says and where it appears
- **✅ Context-Aware**: Notes when text changes based on state (e.g., "when ready" vs "when loading")
- **✅ Maintenance Guidelines**: Notes section provides guidance for keeping content updated

### Areas for Improvement

#### 1. Missing Context & Location Information
**Issue**: The document doesn't specify where in the codebase each piece of copy lives.

**Recommendation**: Add component/file references:
```markdown
- **Title**: "Welcome, Purr-spective Judge!"
  - *Location*: `src/features/tournament/CombinedLoginTournamentSetup.tsx:188`
```

**Impact**: Would make it easier for developers to find and update specific copy.

#### 2. Inconsistent Detail Level
**Issue**: Some sections are very detailed (e.g., Error Messages with severity levels), while others are brief (e.g., Home Page).

**Recommendation**: 
- Add more detail to sparse sections
- Consider adding usage examples or screenshots references
- Document edge cases (e.g., what happens when count is 0, 1, or many)

**Impact**: Would make the document more useful as a complete reference.

#### 3. No Version History or Change Tracking
**Issue**: No way to track when copy was added, changed, or removed.

**Recommendation**: 
- Add a changelog section
- Or use git history with tags in comments
- Document deprecation status for old copy

**Impact**: Would help maintain consistency and track evolution of messaging.

#### 4. Missing Cross-References
**Issue**: Related copy items aren't linked (e.g., "Start Tournament" button appears in multiple contexts).

**Recommendation**: 
- Add "See also" links between related sections
- Create an index of all button labels, all error messages, etc.
- Link validation messages to their corresponding form fields

**Impact**: Would help maintain consistency across similar UI elements.

#### 5. No Tone & Voice Guidelines
**Issue**: The document lists what the copy says, but not why or how it should be written.

**Recommendation**: Add a "Writing Guidelines" section covering:
- Tone (friendly, professional, playful)
- Voice (first person, second person, imperative)
- Style preferences (contractions, capitalization, punctuation)
- Brand voice examples

**Impact**: Would help maintain consistent voice when adding new copy.

#### 6. Missing Internationalization Considerations
**Issue**: No notes about translatability, string length constraints, or cultural considerations.

**Recommendation**: 
- Mark strings that should/shouldn't be translated
- Note maximum character lengths for UI constraints
- Flag culturally specific references (e.g., "Purr-spective Judge")

**Impact**: Would facilitate future internationalization efforts.

#### 7. Incomplete Error Message Documentation
**Issue**: Error messages are well-documented, but success messages are less comprehensive.

**Recommendation**: 
- Expand success message section with all variants
- Document when each success message appears
- Add confirmation dialogs and their copy

**Impact**: Would provide complete coverage of all user feedback.

#### 8. No Testing or Validation Notes
**Issue**: No guidance on how to verify copy is correct or test changes.

**Recommendation**: 
- Add a "Testing Copy Changes" section
- Document how to verify aria-labels work with screen readers
- Note which copy appears in automated tests

**Impact**: Would help ensure copy changes don't break functionality.

#### 9. Missing Dynamic Content Examples
**Issue**: Placeholders are documented, but actual examples of filled-in text are sparse.

**Recommendation**: 
- Add "Examples" subsections showing real filled-in text
- Show edge cases (empty strings, very long names, special characters)
- Document formatting rules (e.g., how numbers are formatted)

**Impact**: Would make it clearer how dynamic content should appear.

#### 10. No Component Relationship Map
**Issue**: Hard to see how copy flows between related components.

**Recommendation**: 
- Add diagrams or lists showing component relationships
- Document copy that appears in multiple places
- Note when copy should be kept in sync

**Impact**: Would help maintain consistency across the application.

### Suggested Enhancements

#### High Priority
1. **Add file/component location references** to each copy item
2. **Create a "Writing Guidelines" section** with tone, voice, and style rules
3. **Add cross-references** between related copy items
4. **Expand success messages** to match error message detail level

#### Medium Priority
5. **Add examples** of filled-in dynamic content
6. **Document edge cases** (empty states, single vs plural, etc.)
7. **Add changelog** or version tracking
8. **Create index** of all button labels, error messages, etc.

#### Low Priority
9. **Add internationalization notes**
10. **Add testing guidelines** for copy changes
11. **Create component relationship map**
12. **Add screenshot references** or visual descriptions

### Overall Assessment

**Rating**: 8.5/10

**Summary**: This is an excellent and comprehensive documentation of copy and microcopy. The organization is logical, the coverage is thorough, and the quick reference sections are particularly useful. The main gaps are in location references, cross-referencing, and writing guidelines. With the suggested improvements, this would be a world-class copy documentation system.

**Best Use Cases**:
- ✅ Quick lookup of specific copy
- ✅ Understanding user journey messaging
- ✅ Accessibility compliance checking
- ✅ Onboarding new team members

**Less Ideal For**:
- ❌ Finding where to edit specific copy in code
- ❌ Understanding why copy is written a certain way
- ❌ Maintaining consistency across similar UI elements
- ❌ Planning internationalization

### Recommendations for Next Steps

1. **Immediate**: Add file/component location references to critical copy items
2. **Short-term**: Create writing guidelines section and add cross-references
3. **Long-term**: Build automated tooling to sync this doc with actual code
4. **Ongoing**: Keep this document updated as part of PR review process
