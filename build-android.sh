#!/bin/bash

# Android Build Script for GameLauncher

echo "🚀 Starting Android APK Build..."
echo ""

# Check if EAS is available
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI not found in PATH"
    echo "Adding Volta's bin directory to PATH..."
    export PATH="/Users/arun.uppugunduri/.volta/tools/image/node/22.13.1/bin:$PATH"
fi

# Verify login
echo "Checking EAS login status..."
eas whoami
if [ $? -ne 0 ]; then
    echo "❌ Not logged in to EAS. Please run: eas login"
    exit 1
fi

echo ""
echo "✅ Logged in successfully"
echo ""

# Start build
echo "📦 Starting Android build (preview profile)..."
echo "This will take 10-20 minutes..."
echo ""

eas build --platform android --profile preview

echo ""
echo "✅ Build command submitted!"
echo ""
echo "📱 Once complete, you'll receive:"
echo "   - Direct APK download link"
echo "   - QR code for easy mobile download"
echo ""
echo "📊 Monitor your build at:"
echo "   https://expo.dev/accounts/aroooniii/projects/GameLauncher/builds"