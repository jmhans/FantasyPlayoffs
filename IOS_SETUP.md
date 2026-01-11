# iOS App Setup

## Overview
The iOS app is a native wrapper around the web application using Capacitor. It loads the production website (https://fantasy-playoffs.vercel.app) in a native WebView.

## Prerequisites
- **macOS required** for iOS development
- **Xcode** (download from Mac App Store)
- **CocoaPods** (install with: `sudo gem install cocoapods`)

## Development Workflow

### 1. Open the iOS Project
```bash
npm run ios:open
```
This opens the project in Xcode.

### 2. Run on Simulator
1. In Xcode, select a simulator (e.g., iPhone 15)
2. Click the Play button or press Cmd+R
3. The app will launch in the iOS simulator

### 3. Run on Physical Device
1. Connect your iPhone via USB
2. In Xcode, select your device from the dropdown
3. You may need to sign the app:
   - Go to "Signing & Capabilities" tab
   - Select your Apple Developer team
4. Click Play button

### 4. Update the App
If you make changes to `capacitor.config.ts`:
```bash
npm run ios:sync
```

## Configuration

### Current Setup
- **App ID**: com.actuarialgames.fantasyplayoffs
- **App Name**: Fantasy Playoffs
- **Server URL**: https://fantasy-playoffs.vercel.app
- **Mode**: Remote server (loads production website)

### Auth0 Configuration
You'll need to update Auth0 to accept iOS app redirects:

1. Go to Auth0 Dashboard → Applications → Fantasy Playoffs
2. Add to "Allowed Callback URLs":
   ```
   com.actuarialgames.fantasyplayoffs://actuarialgames.auth0.com/capacitor/com.actuarialgames.fantasyplayoffs/callback
   ```
3. Add to "Allowed Logout URLs":
   ```
   com.actuarialgames.fantasyplayoffs://actuarialgames.auth0.com/capacitor/com.actuarialgames.fantasyplayoffs/logout
   ```

## Publishing to App Store

### 1. Create App Store Connect Record
- Go to https://appstoreconnect.apple.com
- Create a new app
- Bundle ID: com.actuarialgames.fantasyplayoffs

### 2. Archive and Upload
1. In Xcode: Product → Archive
2. Once archived, click "Distribute App"
3. Follow the wizard to upload to App Store Connect

### 3. Submit for Review
- Add screenshots, description, keywords
- Submit for Apple review (typically 1-2 days)

## Troubleshooting

**Build fails in Xcode:**
- Make sure CocoaPods is installed: `pod --version`
- Navigate to `ios/App` and run: `pod install`

**App won't load website:**
- Check that https://fantasy-playoffs.vercel.app is accessible
- Verify `capacitor.config.ts` has correct URL

**White screen on launch:**
- The app loads the remote server, which may take a moment
- Check network connectivity

## Native Features (Future)

To add native iOS features:
```bash
npm install @capacitor/plugin-name
npx cap sync ios
```

Available plugins:
- `@capacitor/push-notifications` - Push notifications
- `@capacitor/local-notifications` - Local notifications
- `@capacitor/splash-screen` - Custom splash screen
- `@capacitor/status-bar` - Status bar styling
- `@capacitor/haptics` - Haptic feedback
