# iOS Build Guide for GameLauncher

## Requirements for iOS Build

### 1. Apple Developer Account ($99/year)
- Required for TestFlight distribution
- Sign up at: https://developer.apple.com

### 2. Build Command
Once you have an Apple Developer account:
```bash
npx eas build --platform ios --profile preview
```

This will:
- Create iOS certificates automatically
- Build the .ipa file
- Submit to TestFlight automatically

### 3. TestFlight Distribution
- iOS users install TestFlight app from App Store
- You invite testers via email or public link
- Testers can install and test for 90 days
- Up to 10,000 external testers

## Alternative: Development Build (No App Store)

For testing with a few devices without Apple Developer account:
```bash
npx eas build --platform ios --profile development
```
- Requires registering specific device UDIDs
- Limited to registered devices only
- Free but more complex setup

## Quick iOS Build Steps

1. **Ensure you're logged in**:
   ```bash
   npx eas whoami
   ```

2. **Start iOS build**:
   ```bash
   npx eas build --platform ios --profile preview
   ```

3. **Follow prompts**:
   - Log in to Apple Developer account when prompted
   - Let EAS create certificates automatically
   - Wait 15-30 minutes for build

4. **Distribute via TestFlight**:
   - Build automatically submits to TestFlight
   - Add testers in App Store Connect
   - Send invitation links

## Cost Comparison

| Method | Cost | Distribution | Testers | Duration |
|--------|------|-------------|---------|----------|
| Android APK | Free | Direct link | Unlimited | Forever |
| iOS TestFlight | $99/year | TestFlight app | 10,000 | 90 days |
| iOS Dev Build | Free | Direct install | ~100 devices | 1 year |

## Recommendation

For MVP testing:
1. **Android**: Use the APK you just built (free, unlimited)
2. **iOS**: Consider if you need it immediately or can wait
   - If urgent: Get Apple Developer account
   - If not urgent: Focus on Android testing first