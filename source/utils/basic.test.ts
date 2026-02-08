import { strict as assert } from 'node:assert';
import { sanitizeCSVField, generateCSVContent } from './basic';

// Mock NameItem for testing
const mockRankings = [
    { id: '1', name: 'Fluffy', rating: 1500, wins: 10, losses: 5 },
    { id: '2', name: '=1+1', rating: 1200, wins: 2, losses: 8 }, // Injection attempt
    { id: '3', name: '+100', rating: 1300, wins: 5, losses: 5 }, // Injection attempt
    { id: '4', name: '-100', rating: 1300, wins: 5, losses: 5 }, // Injection attempt
    { id: '5', name: '@SUM(1+1)', rating: 1300, wins: 5, losses: 5 }, // Injection attempt
    { id: '6', name: 'Safe "Name"', rating: 1400, wins: 6, losses: 4 }, // Quotes
];

console.log('Running tests for sanitizeCSVField...');

// Test sanitizeCSVField
assert.equal(sanitizeCSVField('Fluffy'), 'Fluffy', 'Should return safe string unchanged');
assert.equal(sanitizeCSVField('=1+1'), "'=1+1", 'Should escape string starting with =');
assert.equal(sanitizeCSVField('+100'), "'+100", 'Should escape string starting with +');
assert.equal(sanitizeCSVField('-100'), "'-100", 'Should escape string starting with -');
assert.equal(sanitizeCSVField('@SUM(1+1)'), "'@SUM(1+1)", 'Should escape string starting with @');
assert.equal(sanitizeCSVField('Safe "Name"'), 'Safe "Name"', 'Should keep quotes (handled by CSV escaping)');

console.log('sanitizeCSVField tests passed!');

console.log('Running tests for generateCSVContent...');

// Test generateCSVContent
const csvContent = generateCSVContent(mockRankings as any);
const lines = csvContent.split('\n');

assert.equal(lines[0], 'Name,Rating,Wins,Losses', 'Header should be correct');

// Verify Fluffy (Safe)
assert.ok(lines[1].includes('"Fluffy"'), 'Should wrap name in quotes');

// Verify Injection Attempts
assert.ok(lines[2].includes(`"'=1+1"`), 'Should escape =1+1');
assert.ok(lines[3].includes(`"'+100"`), 'Should escape +100');
assert.ok(lines[4].includes(`"'-100"`), 'Should escape -100');
assert.ok(lines[5].includes(`"'@SUM(1+1)"`), 'Should escape @SUM(1+1)');

// Verify Quote Handling
assert.ok(lines[6].includes('"Safe ""Name"""'), 'Should double escape quotes');

console.log('generateCSVContent tests passed!');
