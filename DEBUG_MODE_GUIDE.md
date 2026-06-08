# 🐛 Debug Mode User Guide

## Visual Guide to Testing Network Errors

### Step 1: Activate Debug Mode
```
┌─────────────────────────────────┐
│  [☰]  LexiTech Dictionary    [1]│  ← Triple-tap "Dictionary"
│       Dictionary                 │
│                                  │
│  ┌─────────────────────────────┐│
│  │  Find a Word                ││
│  │                             ││
│  │  [ Search input field ]    ││
│  └─────────────────────────────┘│
└─────────────────────────────────┘
```

### Step 2: Debug Mode Activated
```
┌─────────────────────────────────┐
│  [☰]  LexiTech Dictionary    [1]│
│       Dictionary                 │
│       🐛 DEBUG MODE         ← Badge appears
│                                  │
│  ┌─────────────────────────────┐│
│  │  Find a Word                ││
│  │                             ││
│  │  ┌───────────────────────┐ ││  ← Toggle appears
│  │  │ [○─] Simulate Network │ ││
│  │  │      Error OFF        │ ││
│  │  └───────────────────────┘ ││
│  │                             ││
│  │  [ Search input field ]    ││
│  └─────────────────────────────┘│
└─────────────────────────────────┘
```

### Step 3: Enable Error Simulation
```
┌─────────────────────────────────┐
│  [☰]  LexiTech Dictionary    [1]│
│       Dictionary                 │
│       🐛 DEBUG MODE              │
│                                  │
│  ┌─────────────────────────────┐│
│  │  Find a Word                ││
│  │                             ││
│  │  ┌───────────────────────┐ ││
│  │  │ [──○] Simulate Network│ ││  ← Toggle ON
│  │  │      Error ON         │ ││     (red)
│  │  └───────────────────────┘ ││
│  │                             ││
│  │  English word               ││
│  │  [ example              ] ││
│  │                             ││
│  │  [ Search ]  [×]           ││
│  └─────────────────────────────┘│
└─────────────────────────────────┘
```

### Step 4: See Error Message
```
┌─────────────────────────────────┐
│  [☰]  LexiTech Dictionary    [1]│
│       Dictionary                 │
│       🐛 DEBUG MODE              │
│                                  │
│  ┌─────────────────────────────┐│
│  │  Find a Word                ││
│  │                             ││
│  │  ┌───────────────────────┐ ││
│  │  │ [──○] Simulate Network│ ││
│  │  │      Error ON         │ ││
│  │  └───────────────────────┘ ││
│  │                             ││
│  │  English word               ││
│  │  [ example              ] ││
│  │                             ││
│  │  [ Search ]  [×]           ││
│  └─────────────────────────────┘│
│                                  │
│  ┌─────────────────────────────┐│
│  │         ⚠️                   ││  ← Error card
│  │                             ││
│  │  Network error. Please     ││
│  │  check your connection and ││
│  │  try again.                ││
│  │                             ││
│  │    [ Retry search ]        ││
│  └─────────────────────────────┘│
└─────────────────────────────────┘
```

## Quick Reference

### Activation Gesture
```
Tap 1  →  Tap 2  →  Tap 3  →  ✓ Activated
  ^         ^         ^
  └─────────┴─────────┘
    (within 1 second)
```

### Toggle States
```
OFF: [○─────]  Simulate Network Error OFF
              (gray background)

ON:  [─────○]  Simulate Network Error ON
              (red background)
```

### UI Elements

#### Debug Badge
```
🐛 DEBUG MODE
   ▲
   └─ Appears when debug mode is active
```

#### Error Toggle
```
┌────────────────────────────────┐
│ [○─] Simulate Network Error OFF│  ← Yellow background
└────────────────────────────────┘   Warning colors
```

## Testing Flow

```
Start App
    │
    ▼
Triple-tap Title
    │
    ▼
Debug Mode Active ─────► 🐛 Badge Visible
    │                        │
    ▼                        │
Toggle Appears               │
    │                        │
    ▼                        │
Tap Toggle ON ──────────────┘
    │
    ▼
Enter Search Term
    │
    ▼
Press Search
    │
    ▼
Error Displayed! ✓
    │
    ▼
Test Retry Button
    │
    ▼
Toggle OFF ──────► Back to Normal
```

## What Each Element Does

### 1. Triple-tap Title
- **Activates/Deactivates** debug mode
- Must tap 3 times within 1 second
- Visual feedback: 🐛 badge appears/disappears

### 2. Debug Badge (🐛 DEBUG MODE)
- Shows debug mode is active
- Yellow/orange color to stand out
- Positioned below title

### 3. Error Toggle
- **Yellow card** with warning styling
- **Switch-like interface** (not a real Switch component)
- Shows current state: ON or OFF
- Tap anywhere on the card to toggle

### 4. Error Simulation
- When ON: all searches fail with network error
- When OFF: searches work normally
- Persists until toggled off or debug mode disabled

## Color Coding

```
🟡 Yellow/Amber = Debug/Testing UI
   Background: #fef3c7
   Border: #fbbf24
   Text: #92400e

🔴 Red = Error State Active
   Background: #ef4444
   Toggle thumb moves right

⚪ Gray = Normal/Inactive
   Background: #e5e7eb
   Toggle thumb on left
```

## Keyboard Shortcuts & Tips

### Development Tips
1. **Keep debug mode ON** while developing error states
2. **Toggle errors** quickly to test transitions
3. **Test retry flow** thoroughly
4. **Check all error types** (network, 404, 500)

### Production
⚠️ **Important**: Debug mode is available in production but:
- Users won't know about triple-tap gesture
- Toggle is hidden until activated
- Safe to ship with this feature

### Disable in Production (Optional)
If you want to completely remove debug mode from production:

```tsx
const [debugMode, setDebugMode] = useState(__DEV__); // Only in dev builds
```

Or use environment variables:
```tsx
const [debugMode, setDebugMode] = useState(
  process.env.EXPO_PUBLIC_ENABLE_DEBUG === 'true'
);
```

## Troubleshooting

### Debug Mode Won't Activate
- Tap faster (all 3 taps within 1 second)
- Tap the text directly, not around it
- Make sure you're tapping "Dictionary" title
- Try restarting the app

### Toggle Not Working
- Make sure debug mode is active (see badge)
- Tap anywhere on the yellow card
- Check if toggle animation plays

### Errors Not Showing
- Verify toggle shows "ON"
- Try entering a word and searching
- Check if error card appears below search
- Look for error icon (⚠️) and message

### Can't Disable Debug Mode
- Triple-tap the title again
- Badge should disappear
- Toggle should disappear
- If stuck, restart app

## Advanced Usage

### Combine with Other Tools
```
Debug Mode + Chrome DevTools = Powerful Testing
         ↓
Debug Mode  → Quick error simulation
DevTools    → Inspect network requests
Airplane Mode → Real network failure
```

### Test Scenarios
1. **Error → Success**: Toggle ON, search, see error, toggle OFF, retry
2. **Rapid Searches**: Multiple searches with errors ON
3. **Audio + Error**: Search with audio, enable errors, search again
4. **History + Error**: Check history doesn't save failed searches

## Demo Script

Want to show someone? Follow this:

1. "Let me show you error handling..."
2. Triple-tap the title
3. "See this debug mode? I can test errors easily"
4. Tap the toggle ON
5. Search for a word
6. "Here's our error message and retry button"
7. Tap retry (still fails)
8. Toggle OFF
9. Tap retry again (now works!)
10. "Perfect error recovery!"

---

**Pro Tip**: Take screenshots of each step for your documentation or bug reports!
