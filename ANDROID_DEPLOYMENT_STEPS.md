# Android APK Deployment Steps

## ✅ Completed Setup
1. ✅ EAS CLI installed locally
2. ✅ app.json configured with Android package name
3. ✅ eas.json created with build profiles
4. ✅ Icons and splash screens present

## 🔐 Next Step: Login to Expo

You need to login to your Expo account. If you don't have one, create it at https://expo.dev

Run this command in your terminal:
```bash
npx eas login
```

This will prompt for:
- Email/username
- Password

## 📱 Build Android APK

Once logged in, run:
```bash
npx eas build --platform android --profile preview
```

This will:
1. Configure your project for EAS Build (first time only)
2. Upload your project to EAS servers
3. Build an APK (takes 10-20 minutes)
4. Provide a download link when complete

## 🚀 Quick Commands

### Check if logged in:
```bash
npx eas whoami
```

### Build APK:
```bash
npx eas build --platform android --profile preview
```

### Check build status:
```bash
npx eas build:list --platform android
```

### Download APK:
Once build completes, you'll get a URL to download the APK directly.

## 📤 Distribution

After APK is built, you can:
1. Share the direct download link with testers
2. Upload to Google Drive for easier sharing
3. Create a QR code for the download link
4. Send via email/messaging apps

## 🔍 Testing the APK

To install on Android device:
1. Download the APK file
2. Open your file manager
3. Locate and tap the APK
4. If prompted, enable "Install unknown apps" for your file manager
5. Tap "Install"
6. Open GameLauncher

## 📊 Current Configuration

- **Package Name**: com.gamelauncher.app
- **Version**: 1.0.0
- **Version Code**: 1
- **Build Type**: APK (for direct distribution)
- **Profile**: preview (optimized release build)

## ⚠️ Important Notes

1. The first build will take longer as EAS sets up your project
2. Subsequent builds will be faster (10-15 minutes)
3. APK file will be ~50-60MB
4. Works on Android 5.0+ devices

## 🎯 Ready to Build!

Open your terminal and run:
```bash
cd /Users/arun.uppugunduri/KORA/GameLauncher
npx eas login
npx eas build --platform android --profile preview
```

The build will start and you'll receive a URL to monitor progress!