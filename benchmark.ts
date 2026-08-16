import { performance } from 'perf_hooks';

interface NameItem {
    id: string;
    name: string;
    rating: number;
}

const items: NameItem[] = Array.from({ length: 10000 }, (_, i) => ({
    id: `id-${i}`,
    name: `name-${i}`,
    rating: i
}));

function testMap() {
    return items.map((item, index) => ({
        ...item,
        rating: Math.round(1000 + (1000 * (items.length - index)) / items.length),
    }));
}

function testLoop() {
    const len = items.length;
    const adjusted = new Array(len);
    for (let i = 0; i < len; i++) {
        const item = items[i];
        adjusted[i] = {
            ...item,
            rating: Math.round(1000 + (1000 * (len - i)) / len),
        };
    }
    return adjusted;
}

const mapStart = performance.now();
for (let i = 0; i < 100; i++) testMap();
const mapEnd = performance.now();
console.log(`Map: ${mapEnd - mapStart}ms`);

const loopStart = performance.now();
for (let i = 0; i < 100; i++) testLoop();
const loopEnd = performance.now();
console.log(`Loop: ${loopEnd - loopStart}ms`);
