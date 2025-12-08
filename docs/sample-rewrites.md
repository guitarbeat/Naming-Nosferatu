# Sample Content Rewrites

This document provides before/after examples of content improvements based on readability guidelines.

---

## README.md - Main Description

### Original (Line 13)
> A scientifically-driven tournament platform that helps you discover the perfect cat name using the same Elo rating algorithm that ranks chess grandmasters. Make data-driven decisions about your feline companion's nomenclature!

**Issues**:
- 24-word sentence (exceeds 20-word limit)
- Jargon: "scientifically-driven", "nomenclature", "Elo rating algorithm"
- Passive construction: "that ranks"
- Complex idea density

### Rewrite Option 1 (Simpler)
> Find the perfect cat name through tournaments. Compare names head-to-head. See which ones rank highest. The system uses the same ranking method as chess players.

**Improvements**:
- ✅ 4 short sentences (avg 8 words)
- ✅ Simple vocabulary
- ✅ Active voice
- ✅ Clear structure

### Rewrite Option 2 (More Engaging)
> Discover your cat's perfect name through fun tournaments. Vote on your favorites. Watch rankings update in real time. Our system uses the same math that ranks chess players.

**Improvements**:
- ✅ Engaging tone ("fun", "Watch")
- ✅ User-focused ("your cat's", "your favorites")
- ✅ Clear action verbs
- ✅ Grade 7 reading level

### Rewrite Option 3 (Balanced - Recommended)
> A tournament platform for finding the perfect cat name. Compare names side-by-side. Vote on your favorites. Rankings update instantly using the same system that ranks chess players.

**Improvements**:
- ✅ Balanced clarity and engagement
- ✅ Short sentences (avg 7 words)
- ✅ Active voice throughout
- ✅ Grade 7-8 reading level

**Recommended**: Option 3

---

## Login.jsx - Welcome Text

### Original (Lines 289-293)
```jsx
<h1 className={styles.welcomeTitle}>Ready to Judge the Names?</h1>
<p className={styles.welcomeText}>
  Now it&apos;s your turn! Enter your name to start judging cat names
  and help find the perfect one.
</p>
```

**Issues**:
- "Judge" sounds formal/intimidating
- Sentence could be split (18 words)
- "help find" is vague

### Rewrite
```jsx
<h1 className={styles.welcomeTitle}>Ready to Rate Cat Names?</h1>
<p className={styles.welcomeText}>
  Enter your name to get started. Compare names and find your favorite.
</p>
```

**Improvements**:
- ✅ "Rate" is friendlier than "Judge"
- ✅ Two short sentences (8 and 7 words)
- ✅ Clear action: "Compare names and find"
- ✅ More engaging tone

---

## Results.jsx - Welcome Message

### Original (Lines 297-299)
```jsx
<p className={styles.welcome}>
  Welcome back, <span className={styles.userName}>{userName}</span>!
  Here are your latest name rankings.
</p>
```

**Issues**:
- "latest" is redundant (they're always latest)
- Could be more engaging

### Rewrite
```jsx
<p className={styles.welcome}>
  Welcome back, <span className={styles.userName}>{userName}</span>!
  Here are your tournament results.
</p>
```

**Improvements**:
- ✅ "tournament results" is more specific
- ✅ Removed redundant "latest"
- ✅ Clearer what users are seeing

---

## BongoPage.jsx - Instructions

### Original (Lines 47-50, 60-62)
```jsx
<p className={styles.subtitle}>
  You found the hidden bongo cat! This is a special page only
  accessible via the /bongo route.
</p>
<p className={styles.instructions}>
  Click around the page to see the bongo cat in action!
</p>
```

**Issues**:
- "accessible via" is technical/jargon
- "Click around" is vague
- Could be more engaging

### Rewrite
```jsx
<p className={styles.subtitle}>
  You found the hidden bongo cat! This special page is only available at /bongo.
</p>
<p className={styles.instructions}>
  Click anywhere on the page to see the bongo cat react!
</p>
```

**Improvements**:
- ✅ "available at" is simpler than "accessible via"
- ✅ "Click anywhere" is more specific than "around"
- ✅ "react" is more engaging than "in action"
- ✅ Shorter, clearer sentences

---

## ErrorBoundaryFallback.jsx - Error Messages

### Original (Line 432)
```jsx
<h2 id="error-title" className={styles.boundaryTitle}>
  Something went wrong
</h2>
```

**Issues**:
- Generic and unhelpful
- Doesn't guide next steps
- No reassurance

### Rewrite
```jsx
<h2 id="error-title" className={styles.boundaryTitle}>
  Something went wrong
</h2>
<p className={styles.boundarySubtitle}>
  Don't worry. You can try again or go back home.
</p>
```

**Improvements**:
- ✅ Adds reassurance ("Don't worry")
- ✅ Clear next steps ("try again or go back home")
- ✅ Friendly, helpful tone
- ✅ Short, scannable sentences

---

## TournamentSetup.jsx - Instructions

### Original (Implicit in component structure)
Complex component with many technical comments and explanations.

### Suggested User-Facing Text Rewrites

**Before**:
> Select 4-16 cat names for your tournament. You can choose from curated collections or add custom names. Tournament automatically generates optimal pairings.

**After**:
> Select 4-16 cat names for your tournament. Choose from our collections or add your own. The tournament starts automatically when you're ready.

**Improvements**:
- ✅ "our collections" is friendlier than "curated collections"
- ✅ "add your own" is simpler than "add custom names"
- ✅ "starts automatically" is clearer than "generates optimal pairings"
- ✅ More conversational tone

---

## Button Text Examples

### Before
- "Click to Start Tournament"
- "You Can Save Changes"
- "View Tournament Results Page"

### After
- "Start Tournament"
- "Save Changes"
- "View Results"

**Improvements**:
- ✅ Removed "Click to" (button implies clicking)
- ✅ Removed "You Can" (unnecessary)
- ✅ Removed "Page" (redundant)
- ✅ Shorter, clearer, action-focused

---

## Link Text Examples

### Before
- "Click here to start"
- "More information"
- "Read more about tournaments"

### After
- "Start a tournament"
- "Learn more"
- "How tournaments work"

**Improvements**:
- ✅ Removed "Click here"
- ✅ More specific ("Learn more" vs "More information")
- ✅ Action-oriented ("How tournaments work" vs "Read more about")

---

## Form Labels & Help Text

### Before
> Enter your name to start judging cat names and help find the perfect one.

### After
> Enter your name to get started. Compare names and find your favorite.

**Improvements**:
- ✅ Split into two sentences
- ✅ "get started" is clearer than "start judging"
- ✅ "find your favorite" is simpler than "help find the perfect one"
- ✅ More direct and actionable

---

## Feature Descriptions

### Before (README.md)
> **🧠 Scientific Ranking**: Elo-based tournament system

### After
> **Ranking System**: Compare names and see which rank highest

**Improvements**:
- ✅ Removed jargon ("Scientific", "Elo-based")
- ✅ Clearer what it does
- ✅ User-focused language

---

## Error Messages

### Before
> An error occurred while attempting to save your tournament data. Please try the operation again.

### After
> Unable to save tournament. Please try again.

**Improvements**:
- ✅ Shorter (6 words vs 15)
- ✅ Direct ("Unable to save" vs "An error occurred")
- ✅ Clear action ("try again")
- ✅ Removed technical language

---

## Summary of Improvements

### Common Patterns Applied

1. **Split Long Sentences**
   - Before: 20+ words
   - After: 8-15 words

2. **Simplify Vocabulary**
   - Before: "scientifically-driven", "nomenclature"
   - After: "uses science", "name"

3. **Use Active Voice**
   - Before: "Names are selected by you"
   - After: "You select names"

4. **Remove Redundancy**
   - Before: "latest name rankings"
   - After: "tournament results"

5. **Be Specific**
   - Before: "Click around"
   - After: "Click anywhere"

6. **Action-Oriented**
   - Before: "You can start"
   - After: "Start"

---

## Implementation Priority

### High Priority (User-Facing)
1. ✅ Login welcome text
2. ✅ Button text throughout app
3. ✅ Error messages
4. ✅ Form labels and help text

### Medium Priority (Documentation)
1. ✅ README.md main description
2. ✅ Feature descriptions
3. ✅ Help text and tooltips

### Low Priority (Internal)
1. ⏳ Code comments (can be technical)
2. ⏳ Developer documentation
3. ⏳ Technical specifications

---

**Last Updated**: December 2025  
**Review**: Apply these patterns to all new content
