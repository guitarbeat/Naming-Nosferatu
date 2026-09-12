1. Add `React.memo` to `Iridescence` component.
   - The `Iridescence` component is an expensive WebGL component. Re-renders will cause it to re-initialize or do unnecessary work. Wrapping it in `React.memo` will prevent re-renders when its props (which are usually constants like `IRIDESCENCE_COLOR`) haven't changed.
2. Complete pre commit steps
   - Complete pre commit steps to make sure proper testing, verifications, reviews and reflections are done.
3. Submit the change.
   - Once all tests pass, I will submit the change with a descriptive commit message formatting as required by Bolt.
