# Quick Start: Testing Network Errors

## ⚡ Fastest Way (30 seconds)

### Built-in Debug Mode
1. Open your app
2. **Triple-tap** the "Dictionary" title at the top
3. See 🐛 DEBUG MODE badge appear
4. Toggle "Simulate Network Error" to **ON**
5. Search for any word
6. You'll see: *"Network error. Please check your connection and try again."*
7. Click "Retry search" to test retry functionality
8. Toggle **OFF** to return to normal

**That's it!** No need to disconnect Wi-Fi or use external tools.

---

## 📱 Test on Real Network Conditions

### Airplane Mode Test
1. Enable **Airplane Mode** on your device
2. Open the app
3. Try to search for a word
4. You should see the network error message
5. Disable Airplane Mode
6. Tap "Retry search" - it should work now

---

## 🧪 Other Testing Scenarios

### Test 404 Error (Word Not Found)
Search for: `asdfghjklzxcvbnm` (random letters)
Expected: *"Word not found. Check the spelling and try another word."*

### Test with Slow Connection
1. Open iOS Settings → Developer → Network Link Conditioner
2. Enable "3G" or "Edge"
3. Test the app - loading state should show longer

### Test Audio Loading Errors
1. Enable debug mode
2. Search for a word with audio
3. Try playing audio - it will work or fail
4. Good for testing audio error states

---

## ✅ Testing Checklist

When testing network errors, verify:
- [ ] Loading spinner shows while searching
- [ ] Error message displays clearly
- [ ] "Retry search" button appears
- [ ] Retry button actually works
- [ ] App doesn't crash on error
- [ ] Error clears when successful search happens
- [ ] History doesn't save failed searches
- [ ] Previous search results clear on error

---

## 🐛 Troubleshooting

### Debug mode won't activate
- Make sure you tap 3 times quickly (within 1 second)
- Tap directly on the "Dictionary" text
- Try restarting the app

### Network errors not showing
- Check that toggle is ON (should say "Simulate Network Error ON")
- Make sure debug mode badge (🐛) is visible
- Try typing a word and pressing Search

### Want to test specific errors?
See `NETWORK_ERROR_TESTING.md` for advanced testing methods including:
- 404 errors
- 500 server errors
- Timeout errors
- Intermittent failures

---

## 🎓 Understanding Error Messages

Your app shows 3 different error messages:

1. **Network Error** (no internet)
   > "Network error. Please check your connection and try again."

2. **404 Not Found** (invalid word)
   > "Word not found. Check the spelling and try another word."

3. **Other Errors** (server issues, etc.)
   > "The dictionary service could not complete this request. Please try again."

---

## 💡 Pro Tips

1. **Test in both portrait and landscape** - errors should display well in both
2. **Test with long error messages** - make sure they don't overflow
3. **Test rapid searches** - error state should handle quick retries
4. **Test during audio playback** - errors shouldn't crash audio player
5. **Use debug mode during development** - quick way to test error states

---

## 📚 More Resources

- `NETWORK_ERROR_TESTING.md` - Complete testing guide with all methods
- `test-network-errors.js` - Browser console script for advanced testing
- `NetworkErrorTester.tsx` - Optional UI component for testing

---

**Happy Testing!** 🎉

Remember: Good error handling makes users trust your app even when things go wrong.
