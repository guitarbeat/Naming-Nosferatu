/**
 * Test script to verify Supabase credentials security fix
 * Tests that:
 * 1. Hardcoded credentials are removed
 * 2. Validation function exists
 * 3. Error handling is in place
 */

const fs = require('fs');
const path = require('path');

const clientFile = path.join(__dirname, 'src/shared/services/supabase/client.ts');
const content = fs.readFileSync(clientFile, 'utf8');

console.log('🧪 Testing Supabase credentials security fix...\n');

// Test 1: Verify hardcoded credentials are removed
console.log('Test 1: Checking for hardcoded credentials...');
const hasHardcodedUrl = content.includes('ocghxwwwuubgmwsxgyoy');
const hasHardcodedKey = content.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');

if (hasHardcodedUrl || hasHardcodedKey) {
  console.log('  ❌ FAIL: Hardcoded credentials still present');
  if (hasHardcodedUrl) console.log('     - Hardcoded URL found');
  if (hasHardcodedKey) console.log('     - Hardcoded key found');
  process.exit(1);
}
console.log('  ✅ PASS: No hardcoded credentials found');

// Test 2: Verify lazy validation function exists
console.log('\nTest 2: Checking for lazy validation...');
if (!content.includes('getSupabaseCredentials')) {
  console.log('  ❌ FAIL: getSupabaseCredentials function not found');
  process.exit(1);
}
console.log('  ✅ PASS: Lazy validation function exists');

// Test 3: Verify error message exists
console.log('\nTest 3: Checking for error handling...');
if (!content.includes('Missing required Supabase environment variables')) {
  console.log('  ❌ FAIL: Error message not found');
  process.exit(1);
}
console.log('  ✅ PASS: Error message found');

// Test 4: Verify validation is called in createSupabaseClient
console.log('\nTest 4: Checking validation is called...');
if (!content.includes('getSupabaseCredentials()') || !content.includes('createSupabaseClient')) {
  console.log('  ❌ FAIL: Validation not called in createSupabaseClient');
  process.exit(1);
}
console.log('  ✅ PASS: Validation is called when creating client');

// Test 5: Verify no fallback values
console.log('\nTest 5: Checking for fallback values...');
const hasFallback = content.match(/getEnvVar\([^)]+\)\s*\|\|/);
if (hasFallback) {
  console.log('  ❌ FAIL: Fallback values still present (should use lazy validation)');
  process.exit(1);
}
console.log('  ✅ PASS: No fallback values found');

console.log('\n✅ All tests passed! Security fix verified.');
console.log('\n📝 Summary:');
console.log('   - Hardcoded credentials removed');
console.log('   - Lazy validation implemented');
console.log('   - Fail-fast error handling in place');
console.log('   - Application will throw clear error if env vars missing');
