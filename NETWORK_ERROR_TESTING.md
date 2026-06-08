# Network Error Testing Guide

This guide shows you how to test network errors in your React Native mobile app.

## 🎯 Quick Start: Built-in Debug Mode (Easiest!)

Your app now has a built-in debug mode for testing network errors:

### How to Enable
1. **Triple-tap the "Dictionary" title** at the top of the app
2. You'll see a 🐛 DEBUG MODE badge appear
3. A yellow "Simulate Network Error" toggle appears above the search field
4. Toggle it ON to simulate network failures
5. Try searching for any word - you'll see the network error message
6. Toggle OFF to return to normal operation
7. Triple-tap the title again to hide debug mode

### What It Tests
- Network connection failures
- Error message display
- Loading state handling
- Retry functionality
- Error recovery

---

## Method 1: Device Network Settings (Recommended for Real Testing)

### iOS Simulator
1. Open the iOS Simulator
2. Go to **Settings** → **Wi-Fi**
3. Toggle Wi-Fi off
4. Try searching for a word in the app

### Android Emulator
1. Open the Android Emulator
2. Swipe down to open Quick Settings
3. Tap the Wi-Fi icon to disable
4. Try searching for a word in the app

### Physical Device
1. Enable **Airplane Mode**
2. Launch the app and try searching
3. You should see the network error message

---

## Method 2: Developer Tools - Network Throttling

### Using React Native Debugger
1. Install React Native Debugger: `brew install --cask react-native-debugger`
2. Open React Native Debugger
3. Go to **Network** tab
4. Select **Offline** from the throttling dropdown

### Using Chrome DevTools
1. Shake device or press `Cmd+D` (iOS) / `Cmd+M` (Android)
2. Select **Debug**
3. Open Chrome DevTools (F12)
4. Go to **Network** tab
5. Select **Offline** from throttling dropdown

---

## Method 3: Mock Network Interceptor (Best for Automated Testing)

Add axios-mock-adapter to test network errors programmatically.

### Installation
```bash
npm install --save-dev axios-mock-adapter
```

### Usage in Tests
```typescript
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';

const mock = new MockAdapter(axios);

// Simulate network error
mock.onGet(/.*/).networkError();

// Simulate timeout
mock.onGet(/.*/).timeout();

// Simulate 404
mock.onGet(/.*/).reply(404);

// Simulate 500 server error
mock.onGet(/.*/).reply(500);
```

---

## Method 4: NetworkErrorTester Component (Optional UI Tool)

I've created a reusable testing component you can temporarily add to your app.

### Usage
```tsx
import NetworkErrorTester from './src/components/NetworkErrorTester';

// In your component:
const [errorType, setErrorType] = useState<"none" | "network" | "404" | "500" | "timeout" | "slow">("none");

// Add to your JSX (above the search card):
<NetworkErrorTester onErrorTypeChange={setErrorType} />

// In your network request function:
if (errorType === "network") throw new Error("Network error");
if (errorType === "404") throw { response: { status: 404 }, isAxiosError: true };
if (errorType === "500") throw { response: { status: 500 }, isAxiosError: true };
if (errorType === "slow") await new Promise(resolve => setTimeout(resolve, 3000));
```

This gives you a visual UI to switch between different error scenarios while testing.

---

## Method 5: Debug Mode Toggle (Built into App)

I've added a debug mode to your app that lets you simulate network errors with a UI toggle.

### How to Use
1. Triple-tap the app title to enable debug mode
2. Toggle "Simulate Network Error" switch
3. Try searching - you'll see the network error message
4. Toggle off to return to normal

---

## Method 6: Proxy Tools (Advanced)

### Charles Proxy
1. Install Charles Proxy: https://www.charlesproxy.com/
2. Configure your device to use Charles as proxy
3. Use "Breakpoints" to block requests
4. Or use "Throttle Settings" to simulate slow/failing network

### Proxyman (macOS)
1. Install Proxyman: https://proxyman.io/
2. Enable proxy on your device
3. Use "Breakpoint" or "Blacklist" features

---

## Method 7: Invalid API URL

Temporarily change the API URL to an invalid address:

```typescript
// In App.tsx, change:
const DICTIONARY_API_URL = "https://invalid-url-that-does-not-exist.com";
```

---

## Expected Error Messages

Your app should display these error messages:

### Network Error (No Internet)
> "Network error. Please check your connection and try again."

### 404 Not Found
> "Word not found. Check the spelling and try another word."

### Other Errors
> "The dictionary service could not complete this request. Please try again."

---

## Testing Checklist

- [ ] Test with airplane mode on
- [ ] Test with Wi-Fi disabled
- [ ] Test with slow 3G connection
- [ ] Test with invalid URL
- [ ] Test with 404 response
- [ ] Test with 500 server error
- [ ] Test with timeout (slow connection)
- [ ] Verify error messages display correctly
- [ ] Verify retry button works after error
- [ ] Verify app doesn't crash on network error
- [ ] Test error handling during audio loading

---

## Additional Tips

### Simulate Slow Network
In Chrome DevTools Network tab:
- Select "Slow 3G" or "Fast 3G"
- This helps test loading states and timeouts

### Test Timeout Errors
Add timeout configuration to axios:

```typescript
const response = await axios.get(requestUrl, {
  timeout: 5000 // 5 seconds
});
```

Then use network throttling to make requests take longer than 5 seconds.

### Test Intermittent Failures
Use a random function to sometimes throw errors:

```typescript
if (Math.random() > 0.7) {
  throw new Error('Random network failure');
}
```

---

## Monitoring in Production

Consider adding error tracking:
- **Sentry**: https://sentry.io/for/react-native/
- **Bugsnag**: https://www.bugsnag.com/platforms/react-native/
- **Firebase Crashlytics**: https://firebase.google.com/products/crashlytics

These tools help you track real network errors users experience in production.
