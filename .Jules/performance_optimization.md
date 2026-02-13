# Performance Optimization Learnings

## Debouncing Resize Events
- **Issue:** `resize` events fire extremely rapidly, causing layout thrashing and excessive React updates if handled synchronously or even throttled via `requestAnimationFrame`.
- **Solution:** Use a `debounce` utility to delay the update until the resize action pauses (e.g., 150ms).
- **Implementation:**
  - Create a reusable `debounce` function that returns a wrapped function with a `.cancel()` method.
  - Apply this to the `resize` listener in `useBrowserState` or similar hooks.
  - Ensure `.cancel()` is called in the `useEffect` cleanup to prevent memory leaks or updates on unmounted components.

## Pattern
```typescript
function debounce<T extends (...args: any[]) => void>(func: T, wait: number) {
    let timeout: ReturnType<typeof setTimeout>;
    const debounced = (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
    debounced.cancel = () => clearTimeout(timeout);
    return debounced;
}

// Usage in useEffect
useEffect(() => {
    const handleResize = debounce(() => {
        // heavy work
    }, 150);
    window.addEventListener("resize", handleResize);
    return () => {
        handleResize.cancel();
        window.removeEventListener("resize", handleResize);
    };
}, []);
```
