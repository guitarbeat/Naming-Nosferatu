1. **Extract and Enhance Inputs**: Create `src/components/ui/Input.tsx` and move `Input`, `Textarea`, and `FormField` from `LayoutBlocks.tsx` into it. Enhance the inputs using Framer Motion to make them playful and magic to touch (e.g. springy focus animations).
2. **Extract and Enhance MagicToggle**: Create `src/components/ui/MagicToggle.tsx` and move `MagicToggle` from `LayoutBlocks.tsx` into it. Ensure it remains playful and tactile.
3. **Clean up LayoutBlocks.tsx**: Remove the extracted components from `src/components/LayoutBlocks.tsx` to keep the main file light.
4. **Update Barrel File**: Update `src/components/index.ts` to export the new components from `components/ui/`, ensuring backward compatibility.
5. **Pre-commit Steps**: Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
6. **Submit**: Submit the change with branch `caveman-smash-ui` and an appropriate commit message.
