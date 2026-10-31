
<strict_log>
- Momentum: Extracted Magic components out of HomeView container.
- Smash: Ripped MagicSearch, MagicToggle, and MagicToolbar out to a dedicated UI component.
- Clean: Isolated HomeView to src/components/HomeView.tsx, separated reusable magic controls into src/components/ui/MagicControls.tsx.
- Memory Update: Magic controls are now globally accessible UI components. Front page is lighter. Next strike: scan AppChrome for scattered layouts.
</strict_log>
