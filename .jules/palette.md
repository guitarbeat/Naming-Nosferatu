## 2024-07-13 - [Disabled Buttons and Icon-Only Buttons Tooltips]
**Learning:** A common pattern across the app is that disabled buttons lacked an explanation for why they were disabled, leaving users confused. Furthermore, several icon-only buttons lacked tooltips, reducing accessibility.
**Action:** I've added dynamic `title` attributes that update based on form state to explain why a button is disabled, as well as `title` tooltips for icon buttons like the edit and close buttons.
