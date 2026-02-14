/**
 * Test Script for Admin Functions and Tournament
 * Run this in the browser console to test all functionality
 */

console.log('🧪 Starting Admin Functions Test Script...\n');

async function requireSupabaseClient() {
	if (window.__supabaseClient) {
		return window.__supabaseClient;
	}

	// In Vite dev, we can import source modules by URL from the browser console.
	// This avoids bare specifiers like '@supabase/supabase-js'.
	try {
		const mod = await import('/src/services/supabase/client.ts');
		const resolved = await mod.resolveSupabaseClient();
		if (resolved) {
			return resolved;
		}
	} catch {
		/* ignore */
	}

	throw new Error(
		"Supabase client not found. Try reloading the page, then run again. If you're not in Vite dev, window.__supabaseClient must be available.",
	);
}

// Test 1: Check User Authentication and Admin Status
async function testAuthStatus() {
  console.log('📋 Test 1: Authentication & Admin Status');
  try {
    const client = await requireSupabaseClient();
    
    // Get current user
    const { data: { user }, error: authError } = await client.auth.getUser();
    if (authError) throw authError;
    
    console.log('✅ Authenticated user:', user?.user_metadata?.user_name || user?.email);
    
    // Test admin status
    const { data: adminData, error: adminError } = await client.rpc('is_admin');
    if (adminError) throw adminError;
    
    console.log('✅ Admin status:', adminData ? 'ADMIN' : 'NOT ADMIN');
    return { user, isAdmin: adminData, client };
  } catch (error) {
    console.error('❌ Auth test failed:', error.message);
    return null;
  }
}

// Test 2: Test Lock/Unlock Function
async function testLockUnlock(client, userName) {
  console.log('\n📋 Test 2: Lock/Unlock Function');
  try {
    // Get a test name
    const { data: names, error: fetchError } = await client
      .from('cat_name_options')
      .select('id, name, locked_in')
      .eq('is_active', true)
      .limit(1);
    
    if (fetchError) throw fetchError;
    if (!names || names.length === 0) {
      console.log('⚠️ No names available for testing');
      return;
    }
    
    const testName = names[0];
    console.log(`🔄 Testing with name: "${testName.name}" (ID: ${testName.id})`);
    console.log(`Current locked status: ${testName.locked_in}`);
    
    // Test lock
    const { data: lockResult, error: lockError } = await client.rpc('toggle_name_locked_in', {
      p_name_id: testName.id,
      p_locked_in: true,
      p_user_name: userName
    });
    
    if (lockError) throw lockError;
    console.log('✅ Lock result:', lockResult);
    
    // Test unlock
    const { data: unlockResult, error: unlockError } = await client.rpc('toggle_name_locked_in', {
      p_name_id: testName.id,
      p_locked_in: false,
      p_user_name: userName
    });
    
    if (unlockError) throw unlockError;
    console.log('✅ Unlock result:', unlockResult);
    
    return true;
  } catch (error) {
    console.error('❌ Lock/Unlock test failed:', error.message);
    return false;
  }
}

// Test 3: Test Hide/Unhide Function
async function testHideUnhide(client, userName) {
  console.log('\n📋 Test 3: Hide/Unhide Function');
  try {
    // Get a test name
    const { data: names, error: fetchError } = await client
      .from('cat_name_options')
      .select('id, name, is_hidden')
      .eq('is_active', true)
      .limit(1);
    
    if (fetchError) throw fetchError;
    if (!names || names.length === 0) {
      console.log('⚠️ No names available for testing');
      return;
    }
    
    const testName = names[0];
    console.log(`🔄 Testing with name: "${testName.name}" (ID: ${testName.id})`);
    console.log(`Current hidden status: ${testName.is_hidden}`);
    
    // Test hide
    const { data: hideResult, error: hideError } = await client.rpc('toggle_name_hidden', {
      p_name_id: testName.id,
      p_hidden: true,
      p_user_name: userName
    });
    
    if (hideError) throw hideError;
    console.log('✅ Hide result:', hideResult);
    
    // Test unhide
    const { data: unhideResult, error: unhideError } = await client.rpc('toggle_name_hidden', {
      p_name_id: testName.id,
      p_hidden: false,
      p_user_name: userName
    });
    
    if (unhideError) throw unhideError;
    console.log('✅ Unhide result:', unhideResult);
    
    return true;
  } catch (error) {
    console.error('❌ Hide/Unhide test failed:', error.message);
    return false;
  }
}

// Test 4: Test Tournament Functions
async function testTournamentFunctions(client, userName) {
  console.log('\n📋 Test 4: Tournament Functions');
  try {
    // Test increment selection
    const { data: names, error: fetchError } = await client
      .from('cat_name_options')
      .select('id, name')
      .eq('is_active', true)
      .limit(1);
    
    if (fetchError) throw fetchError;
    if (!names || names.length === 0) {
      console.log('⚠️ No names available for testing');
      return;
    }
    
    const testName = names[0];
    console.log(`🔄 Testing tournament functions with: "${testName.name}"`);
    
    // Test increment selection
    const { data: incrementResult, error: incrementError } = await client.rpc('increment_selection', {
      p_name_id: testName.id,
      p_user_name: userName
    });
    
    if (incrementError) throw incrementError;
    console.log('✅ Increment selection result:', incrementResult);
    
    // Test get top selections
    const { data: topSelections, error: topError } = await client.rpc('get_top_selections', {
      p_limit: 5
    });
    
    if (topError) throw topError;
    console.log('✅ Top selections:', topSelections);
    
    // Test update user tournament data
    const { data: updateResult, error: updateError } = await client.rpc('update_user_tournament_data', {
      p_user_name: userName,
      p_tournament_data: {
        rounds_completed: 1,
        total_votes: 5,
        completion_time: new Date().toISOString()
      }
    });
    
    if (updateError) throw updateError;
    console.log('✅ Update tournament data result:', updateResult);
    
    return true;
  } catch (error) {
    console.error('❌ Tournament functions test failed:', error.message);
    return false;
  }
}

// Test 5: Test Data Retrieval
async function testDataRetrieval(client) {
  console.log('\n📋 Test 5: Data Retrieval');
  try {
    // Test getting active names
    const { data: activeNames, error: activeError } = await client
      .from('cat_name_options')
      .select('id, name, is_hidden, locked_in')
      .eq('is_active', true)
      .limit(5);
    
    if (activeError) throw activeError;
    console.log('✅ Active names (first 5):', activeNames?.map(n => `${n.name} (hidden: ${n.is_hidden}, locked: ${n.locked_in})`));
    
    // Test getting hidden names
    const { data: hiddenNames, error: hiddenError } = await client
      .from('cat_name_options')
      .select('id, name')
      .eq('is_active', true)
      .eq('is_hidden', true)
      .limit(5);
    
    if (hiddenError) throw hiddenError;
    console.log('✅ Hidden names count:', hiddenNames?.length || 0);
    
    // Test getting locked names
    const { data: lockedNames, error: lockedError } = await client
      .from('cat_name_options')
      .select('id, name')
      .eq('is_active', true)
      .eq('locked_in', true)
      .limit(5);
    
    if (lockedError) throw lockedError;
    console.log('✅ Locked names count:', lockedNames?.length || 0);
    
    return true;
  } catch (error) {
    console.error('❌ Data retrieval test failed:', error.message);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting comprehensive test suite...\n');
  
  const authResult = await testAuthStatus();
  if (!authResult) {
    console.log('\n❌ Tests failed: Authentication issues');
    return;
  }
  
  const { user, isAdmin, client } = authResult;
  const actualUserName = user?.user_metadata?.user_name || user?.email || 'unknown';
  
  if (!isAdmin) {
    console.log('\n⚠️ Skipping admin tests - user is not an admin');
    return;
  }
  
  // Set user context
  await client.rpc('set_user_context', { user_name_param: actualUserName });
  
  // Run all tests
  const results = {
    auth: true,
    lockUnlock: await testLockUnlock(client, actualUserName),
    hideUnhide: await testHideUnhide(client, actualUserName),
    tournament: await testTournamentFunctions(client, actualUserName),
    dataRetrieval: await testDataRetrieval(client)
  };
  
  // Summary
  console.log('\n🎯 Test Results Summary:');
  console.log('========================');
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const testName = test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    console.log(`${status} ${testName}`);
  });
  
  const allPassed = Object.values(results).every(Boolean);
  console.log('\n' + (allPassed ? '🎉 ALL TESTS PASSED!' : '⚠️ Some tests failed - check logs above'));
  
  return results;
}

// Export for manual testing
window.testAdminFunctions = {
  runAllTests,
  testAuthStatus,
  testLockUnlock,
  testHideUnhide,
  testTournamentFunctions,
  testDataRetrieval
};

console.log('💡 Test functions loaded! Run: window.testAdminFunctions.runAllTests()');
