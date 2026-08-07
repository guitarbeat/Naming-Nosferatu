1. **Analyze:** The `AppLayout` component contains a deeply nested inline `onClick` handler for the "Skip to main content" button. Extracting this inline arrow function into a well-named callback function will improve readability. Applying an early return pattern in the extracted function will also flatten the code inside it.
2. **Implement Refactoring:** Extract `handleSkipToMain` as a named function inside `AppLayout`, using an early return `if (!main) return;`. Apply the function as the `onClick` handler. Also extract `handleDismissError` for the `onDismiss` handler of the `ErrorComponent`.
3. **Verify:** Use `run_in_bash_session` to run `pnpm run fix` to run the format and lint checks, and `pnpm run test` to verify the code works and tests pass.
4. **Pre-commit:** Complete pre-commit steps to ensure proper testing, verification, review, and reflection are done.
5. **Submit:** Submit a PR with the correct format for the Code Health agent using the `submit` tool.
