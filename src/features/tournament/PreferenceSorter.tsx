/**
 * @module PreferenceSorter
 * @description A class that implements a merge sort algorithm with custom comparisons
 * for sorting cat names based on user preferences.
 */

export class PreferenceSorter {
  items: string[];
  preferences: Map<string, number>;
  currentRankings: string[];
  ranks: string[];
  rec: number[];
  // pairs removed to save memory/time
  currentIndex: number;
  history: Array<{ a: string; b: string; value: number }>;

  constructor(items: string[]) {
    if (!Array.isArray(items)) {
      throw new Error("PreferenceSorter requires an array of items");
    }
    this.items = items;
    this.preferences = new Map<string, number>();
    this.currentRankings = [...items];
    this.ranks = [];
    this.rec = new Array(items.length).fill(0);
    // Removed eager O(n^2) pairs generation
    this.currentIndex = 0;
    this.history = [];
  }

  getName(item: string | { name?: string } | null | undefined): string {
    if (item == null) {
      return "";
    }
    return typeof item === "string" ? item : item.name || "";
  }

  addPreference(item1: string | { name?: string }, item2: string | { name?: string }, value: number): void {
    const key = `${this.getName(item1)}-${this.getName(item2)}`;
    this.preferences.set(key, value);
    // Record history for undo support
    this.history.push({
      a: this.getName(item1),
      b: this.getName(item2),
      value,
    });
  }

  getPreference(item1: string | { name?: string }, item2: string | { name?: string }): number {
    const key = `${this.getName(item1)}-${this.getName(item2)}`;
    const reverseKey = `${this.getName(item2)}-${this.getName(item1)}`;

    if (this.preferences.has(key)) {
      return this.preferences.get(key) ?? 0;
    } else if (this.preferences.has(reverseKey)) {
      const reverseValue = this.preferences.get(reverseKey);
      return reverseValue !== undefined ? -reverseValue : 0;
    } else {
      return 0;
    }
  }

  getCurrentRankings(): string[] {
    if (this.ranks.length > 0) {
      return this.ranks;
    }
    return this.currentRankings;
  }

  async sort(compareCallback: (a: string, b: string) => Promise<number> | number): Promise<void> {
    const n = this.items.length;

    if (!this.rec || this.rec.length !== n) {
      this.rec = new Array(n).fill(0);
    }

    await this.sortRecursive(0, n - 1, compareCallback);
  }

  async sortRecursive(left: number, right: number, compareCallback: (a: string, b: string) => Promise<number> | number): Promise<void> {
    if (right - left < 1) {
      if (left === right && left >= 0 && left < this.items.length) {
        this.ranks.push(this.items[left]);
      }
      return;
    }

    const mid = Math.floor((left + right) / 2);
    await this.sortRecursive(left, mid, compareCallback);
    await this.sortRecursive(mid + 1, right, compareCallback);
    await this.mergeSubGroups(left, mid, right, compareCallback);
  }

  async mergeSubGroups(left: number, mid: number, right: number, compareCallback: (a: string, b: string) => Promise<number> | number): Promise<void> {
    // Validate bounds
    if (
      left < 0 ||
      right >= this.items.length ||
      left > right ||
      mid < left ||
      mid > right
    ) {
      console.error("Invalid merge bounds:", {
        left,
        mid,
        right,
        itemsLength: this.items.length,
      });
      return;
    }

    let i = left;
    let j = mid + 1;
    const merged: string[] = [];

    while (i <= mid && j <= right) {
      try {
        // Bounds check before accessing
        if (i >= this.items.length || j >= this.items.length) {
          console.error("Array index out of bounds during merge:", {
            i,
            j,
            itemsLength: this.items.length,
          });
          break;
        }
        const result = await compareCallback(this.items[i], this.items[j]);

        if (result <= -0.5) {
          merged.push(this.items[i++]);
        } else if (result >= 0.5) {
          merged.push(this.items[j++]);
        } else if (result < 0) {
          merged.push(this.items[i++]);
          merged.push(this.items[j++]);
        } else {
          merged.push(this.items[j++]);
          merged.push(this.items[i++]);
        }
      } catch (error) {
        console.error("Comparison failed:", error);
        // Handle cancellation or fallback strategy
      }
    }

    while (i <= mid) {
      merged.push(this.items[i++]);
    }
    while (j <= right) {
      merged.push(this.items[j++]);
    }

    for (let k = 0; k < merged.length; k++) {
      this.items[left + k] = merged[k];
      this.currentRankings[left + k] = merged[k];
    }

    if (left === 0 && right === this.items.length - 1) {
      this.ranks = [...merged];
    }
  }

  /**
   * Helper to get the pair at a specific logical index without storing all pairs.
   * Maps a linear index k to (i, j) in the upper triangular matrix.
   */
  getPairAtIndex(index: number): [string, string] | null {
    const n = this.items.length;
    if (index < 0) return null;

    let k = index;
    // We iterate rows to find which row 'k' falls into.
    for (let i = 0; i < n - 1; i++) {
      const pairsInRow = n - 1 - i;
      if (k < pairsInRow) {
        const j = i + 1 + k;
        return [this.getName(this.items[i]), this.getName(this.items[j])];
      }
      k -= pairsInRow;
    }
    return null;
  }

  // Return the next un-judged pair as a match { left, right }
  getNextMatch(): { left: string; right: string } | null {
    const n = this.items.length;
    const maxPairs = (n * (n - 1)) / 2;

    // Advance index to next pair we haven't judged yet
    while (this.currentIndex < maxPairs) {
      const pair = this.getPairAtIndex(this.currentIndex);
      if (!pair) break; // Should not happen if currentIndex < maxPairs

      const [a, b] = pair;
      const key = `${a}-${b}`;
      const reverseKey = `${b}-${a}`;
      if (!this.preferences.has(key) && !this.preferences.has(reverseKey)) {
        return { left: a, right: b };
      }
      this.currentIndex++;
    }
    return null;
  }

  // Undo last added preference
  undoLastPreference(): boolean {
    const last = this.history.pop();
    if (!last) return false;
    const key = `${last.a}-${last.b}`;
    const reverseKey = `${last.b}-${last.a}`;
    this.preferences.delete(key);
    this.preferences.delete(reverseKey);
    // Step back at least one index to revisit the undone pair if needed
    this.currentIndex = Math.max(0, this.currentIndex - 1);
    return true;
  }
}
