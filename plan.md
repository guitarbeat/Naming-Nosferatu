1. **Understand**
   - We need to create tests for `src/services/SyncQueue.ts`.
   - The file exports a singleton `syncQueue` which is an instance of `SyncQueueService`.
   - The file doesn't export `SyncQueueService` but that's fine, we can test the exported `syncQueue`. Wait, we might need a way to create fresh instances to prevent test pollution, or we can just clear the queue in a `beforeEach` hook. `syncQueue.clear()` is available and it clears the queue and saves to `localStorage`.
   - The class relies on `localStorage` to persist the queue.
   - It relies on `crypto.randomUUID()` to generate item IDs.
   - We need to mock `localStorage` and optionally `crypto.randomUUID()` (or just check that an ID is present and is a string).
   - Functions to test: `load()`, `save()`, `enqueue()`, `dequeue()`, `peek()`, `isEmpty()`, `getQueue()`, `clear()`.

2. **Test Strategy**
   - Framework: Vitest.
   - Setup: Mock `localStorage` global object. We can use `vi.spyOn` or replace `global.localStorage`.
   - Setup: Mock `devError` to ensure we don't spam console and to check if it's called on errors (e.g., when `JSON.parse` fails).
   - We need to be careful with the singleton pattern. When the module is imported, `new SyncQueueService()` is called and it immediately calls `this.load()`. If we want to test `load()` properly (e.g. invalid JSON in localStorage), we might want to re-import the module or dynamically create the instance if we can, but since the class isn't exported, we can just test `syncQueue.load()`? `load()` is private!
   - Wait, `load()` and `save()` are private. We can test them indirectly via `enqueue`, `dequeue`, and by setting `localStorage` before importing the module (if we use `vi.resetModules()`).
   - Actually, since `load()` is private, we can just test that if `localStorage` has data before the module is imported, it loads it. Or we can just let `enqueue` run, check `localStorage`, then we know it saves.
   - Wait, testing `load` with invalid JSON: we can set `localStorage.setItem('offline_sync_queue', 'invalid json')` and then we would need to trigger a `load()`. Since it's only called in the constructor, we can use `await import('@/services/SyncQueue')` after resetting modules or just expect `devError` to be called if we can somehow trigger `load`. Another way is `syncQueue["load"]()` using TypeScript bracket notation to bypass private access for testing.

3. **Implementation Details**
   - Create `src/services/SyncQueue.test.ts`.
   - Mock `localStorage`.
   - Mock `devError` from `@/shared/lib/basic`.
   - Tests:
     - `enqueue`: Adds an item, gives it an ID, sets timestamp, retryCount to 0, and saves to localStorage.
     - `dequeue`: Removes the first item and returns it, saves updated queue to localStorage.
     - `peek`: Returns the first item without removing it.
     - `isEmpty`: Returns true when empty, false otherwise.
     - `getQueue`: Returns a copy of the queue. Modifying the returned array doesn't affect the internal queue.
     - `clear`: Empties the queue and updates localStorage.
     - Error handling: `localStorage.setItem` throws an error -> `devError` is called.
     - Error handling: `localStorage.getItem` returns invalid JSON -> `devError` is called.

4. **Verification**
   - Run `npx vitest run src/services/SyncQueue.test.ts`.

5. **Submit**
   - Complete pre-commit.
   - Create PR.
