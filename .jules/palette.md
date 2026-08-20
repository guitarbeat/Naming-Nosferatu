## 2024-05-18 - Add Tooltips to Icon-Only Buttons
**Learning:** Found several icon-only buttons across the app (like dismiss/close buttons or zoom actions) that had `aria-label` for screen readers but lacked a visible `title` attribute, leaving sighted mouse users without context or reasoning for why an action might be disabled.
**Action:** Always map the intent of an `aria-label` to a native HTML `title` tooltip for icon-only components to support all interaction modes. Additionally, provide dynamic titles for disabled states so users know why an action is restricted.
