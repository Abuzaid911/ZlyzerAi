// utils/testSupabase.ts
// Utility to test Supabase connection and authentication

import { supabase, getAccessToken, getCurrentUser } from '../lib/supabaseClient';

/**
 * Test Supabase connection
 */
export async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection...\n');

  try {
    // 1. Check configuration
    console.log('✅ Supabase client initialized');
    console.log(`   URL: ${import.meta.env.VITE_SUPABASE_URL || 'NOT SET'}`);
    console.log(`   Anon Key: ${import.meta.env.VITE_SUPABASE_ANON_KEY ? '***' + import.meta.env.VITE_SUPABASE_ANON_KEY.slice(-10) : 'NOT SET'}\n`);

    // 2. Check session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session Error:', sessionError.message);
      return false;
    }

    if (session) {
      console.log('✅ User is logged in');
      console.log(`   User ID: ${session.user.id}`);
      console.log(`   Email: ${session.user.email}`);
      console.log(`   Provider: ${session.user.app_metadata.provider}\n`);
      
      // 3. Check access token
      const token = await getAccessToken();
      if (token) {
        console.log('✅ Access token available');
        console.log(`   Token: ***${token.slice(-10)}\n`);
      } else {
        console.error('❌ Access token not available\n');
        return false;
      }

      // 4. Check user data
      const user = await getCurrentUser();
      if (user) {
        console.log('✅ User data fetched successfully\n');
      } else {
        console.error('❌ Could not fetch user data\n');
        return false;
      }

      console.log('🎉 All checks passed! Supabase is configured correctly.\n');
      return true;
    } else {
      console.log('⚠️  No active session - user needs to log in\n');
      console.log('To test authentication:');
      console.log('1. Add a login button in your UI');
      console.log('2. Call: await supabase.auth.signInWithOAuth({ provider: "google" })\n');
      return false;
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

/**
 * Test API connectivity
 */
export async function testAPIConnection() {
  console.log('🔍 Testing API Connection...\n');

const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://zanalyzer.fly.dev';
  console.log(`   API URL: ${apiUrl}\n`);

  if (apiUrl === 'NOT SET') {
    console.error('❌ API URL not configured in environment variables\n');
    return false;
  }

  try {
    const response = await fetch(apiUrl);
    console.log(`✅ API is reachable (Status: ${response.status})\n`);
    return true;
  } catch (error) {
    console.error('❌ Cannot reach API:', error instanceof Error ? error.message : error);
    console.log('\nMake sure your backend is running on:', apiUrl, '\n');
    return false;
  }
}

/**
 * Run all tests
 */
export async function runAllTests() {
  console.log('═══════════════════════════════════════');
  console.log('  🧪 Zlyzer Integration Test Suite');
  console.log('═══════════════════════════════════════\n');

  const supabaseOk = await testSupabaseConnection();
  const apiOk = await testAPIConnection();

  console.log('═══════════════════════════════════════');
  console.log('  📊 Test Results');
  console.log('═══════════════════════════════════════');
  console.log(`  Supabase: ${supabaseOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  API:      ${apiOk ? '✅ PASS' : '❌ FAIL'}`);
  console.log('═══════════════════════════════════════\n');

  return supabaseOk && apiOk;
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).testZlyzerIntegration = runAllTests;
  (window as any).testSupabase = testSupabaseConnection;
  (window as any).testAPI = testAPIConnection;
}
