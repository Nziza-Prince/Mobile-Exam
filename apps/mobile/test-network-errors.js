/**
 * Network Error Testing Script
 * 
 * This script helps you manually test different network error scenarios.
 * Run this in your browser console while debugging the app.
 */

// Save original axios instance
const originalAxios = window.axios;

// Test Scenario 1: Network Error (No connection)
function testNetworkError() {
  console.log('🔴 Testing Network Error...');
  
  window.axios = {
    ...originalAxios,
    get: () => Promise.reject(new Error('Network Error'))
  };
  
  console.log('✅ Network error simulation active');
  console.log('Try searching for a word now');
}

// Test Scenario 2: 404 Not Found
function test404Error() {
  console.log('🔴 Testing 404 Error...');
  
  window.axios = {
    ...originalAxios,
    get: () => Promise.reject({
      response: {
        status: 404,
        data: { message: 'Not Found' }
      },
      isAxiosError: true
    })
  };
  
  console.log('✅ 404 error simulation active');
  console.log('Try searching for a word now');
}

// Test Scenario 3: 500 Server Error
function test500Error() {
  console.log('🔴 Testing 500 Server Error...');
  
  window.axios = {
    ...originalAxios,
    get: () => Promise.reject({
      response: {
        status: 500,
        data: { message: 'Internal Server Error' }
      },
      isAxiosError: true
    })
  };
  
  console.log('✅ 500 error simulation active');
  console.log('Try searching for a word now');
}

// Test Scenario 4: Timeout
function testTimeout() {
  console.log('🔴 Testing Timeout...');
  
  window.axios = {
    ...originalAxios,
    get: () => new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error('timeout of 5000ms exceeded'));
      }, 6000);
    })
  };
  
  console.log('✅ Timeout simulation active (6 seconds)');
  console.log('Try searching for a word now');
}

// Test Scenario 5: Slow Network (for testing loading states)
function testSlowNetwork() {
  console.log('🐌 Testing Slow Network...');
  
  const originalGet = originalAxios.get;
  
  window.axios = {
    ...originalAxios,
    get: async (...args) => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      return originalGet(...args);
    }
  };
  
  console.log('✅ Slow network simulation active (3 second delay)');
  console.log('Try searching for a word now');
}

// Test Scenario 6: Intermittent Failures (50% chance)
function testIntermittentFailures() {
  console.log('⚡ Testing Intermittent Failures...');
  
  const originalGet = originalAxios.get;
  
  window.axios = {
    ...originalAxios,
    get: (...args) => {
      if (Math.random() > 0.5) {
        console.log('❌ Request failed (random)');
        return Promise.reject(new Error('Random network failure'));
      } else {
        console.log('✅ Request succeeded (random)');
        return originalGet(...args);
      }
    }
  };
  
  console.log('✅ Intermittent failure simulation active (50% failure rate)');
  console.log('Try searching for multiple words');
}

// Restore normal behavior
function restoreNormal() {
  console.log('🔄 Restoring normal behavior...');
  window.axios = originalAxios;
  console.log('✅ Network simulation disabled');
}

// Help menu
function showHelp() {
  console.log(`
🧪 Network Error Testing Commands
==================================

testNetworkError()         - Simulate no internet connection
test404Error()             - Simulate word not found (404)
test500Error()             - Simulate server error (500)
testTimeout()              - Simulate request timeout
testSlowNetwork()          - Add 3 second delay to all requests
testIntermittentFailures() - Random 50% failure rate
restoreNormal()            - Restore normal behavior

Usage:
1. Open browser console (Cmd+Option+J)
2. Run any test function
3. Use the app to trigger the error
4. Run restoreNormal() when done testing
  `);
}

// Export functions to global scope
if (typeof window !== 'undefined') {
  window.testNetworkError = testNetworkError;
  window.test404Error = test404Error;
  window.test500Error = test500Error;
  window.testTimeout = testTimeout;
  window.testSlowNetwork = testSlowNetwork;
  window.testIntermittentFailures = testIntermittentFailures;
  window.restoreNormal = restoreNormal;
  window.showNetworkTestHelp = showHelp;
}

// Show help on load
showHelp();

console.log('💡 Tip: Use the built-in debug mode by triple-tapping the app title!');
