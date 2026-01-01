
import { describe, it, expect, beforeEach } from 'vitest';
import { PreferenceSorter } from './PreferenceSorter';

describe('PreferenceSorter', () => {
  let sorter: PreferenceSorter;
  const items = ['Cat A', 'Cat B', 'Cat C', 'Cat D'];

  beforeEach(() => {
    sorter = new PreferenceSorter(items);
  });

  it('should initialize with correct items', () => {
    expect(sorter.items).toEqual(items);
  });

  it('should return next match correctly', () => {
    const match = sorter.getNextMatch();
    expect(match).not.toBeNull();
    expect(match?.left).toBe('Cat A');
    expect(match?.right).toBe('Cat B');
  });

  it('should advance match after adding preference', () => {
    sorter.addPreference('Cat A', 'Cat B', 1);
    const match = sorter.getNextMatch();
    expect(match).not.toBeNull();
    expect(match?.left).toBe('Cat A');
    expect(match?.right).toBe('Cat C');
  });
});
