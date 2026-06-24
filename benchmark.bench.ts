import { bench, describe } from 'vitest';

interface NameItem {
  name: string;
  rating: number | string; // Assuming rating can be string based on the types
}

function haveRankingsChangedOriginal(newItems: NameItem[], oldRankings: NameItem[]): boolean {
    if (newItems.length !== oldRankings.length) {
        return true;
    }
    return newItems.some(
        (item, index) =>
            item.name !== oldRankings[index]?.name || item.rating !== oldRankings[index]?.rating,
    );
}

function haveRankingsChangedOptimized(newItems: NameItem[], oldRankings: NameItem[]): boolean {
    if (newItems === oldRankings) return false;
    if (newItems.length !== oldRankings.length) {
        return true;
    }

    for (let i = 0; i < newItems.length; i++) {
        const newItem = newItems[i];
        const oldItem = oldRankings[i];
        // Fast path for object reference equality
        if (newItem === oldItem) continue;

        // Deep check
        if (!newItem || !oldItem || newItem.name !== oldItem.name || newItem.rating !== oldItem.rating) {
            return true;
        }
    }
    return false;
}

const generateData = (size: number) => Array.from({ length: size }, (_, i) => ({ name: `name${i}`, rating: i }));
const oldData = generateData(10000);
const newDataSameRef = oldData;
const newDataDiffRefSameContent = generateData(10000);
const newDataDiffRefDiffContent = [...oldData];
newDataDiffRefDiffContent[9999] = { name: "diff", rating: 0 };

const newDataSameObjects = [...oldData]; // new array, same object references

describe('haveRankingsChanged', () => {
  bench('original - same array ref', () => {
    haveRankingsChangedOriginal(newDataSameRef, oldData);
  });
  bench('optimized - same array ref', () => {
    haveRankingsChangedOptimized(newDataSameRef, oldData);
  });

  bench('original - diff array ref, same object refs', () => {
    haveRankingsChangedOriginal(newDataSameObjects, oldData);
  });
  bench('optimized - diff array ref, same object refs', () => {
    haveRankingsChangedOptimized(newDataSameObjects, oldData);
  });

  bench('original - diff array ref, diff object refs, same content', () => {
    haveRankingsChangedOriginal(newDataDiffRefSameContent, oldData);
  });
  bench('optimized - diff array ref, diff object refs, same content', () => {
    haveRankingsChangedOptimized(newDataDiffRefSameContent, oldData);
  });

  bench('original - diff array ref, diff object refs, diff content', () => {
    haveRankingsChangedOriginal(newDataDiffRefDiffContent, oldData);
  });
  bench('optimized - diff array ref, diff object refs, diff content', () => {
    haveRankingsChangedOptimized(newDataDiffRefDiffContent, oldData);
  });
});
