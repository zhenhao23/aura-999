# Firebase Setup Guide for WhateverClicks

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Enter project name: `whateverclicks-kitahack` (or any name)
4. Disable Google Analytics (optional for hackathon)
5. Click **"Create project"**

## Step 2: Register Web App

1. In your Firebase project, click the **Web icon** (`</>`)
2. Register app with nickname: `whateverclicks-web`
3. **Don't check** "Firebase Hosting" for now
4. Click **"Register app"**
5. Copy the `firebaseConfig` object (you'll need this!)

```javascript
// Example firebaseConfig (yours will be different)
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "whateverclicks-xxxx.firebaseapp.com",
  projectId: "whateverclicks-xxxx",
  storageBucket: "whateverclicks-xxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456",
};
```

## Step 3: Enable Firestore Database

1. In Firebase Console, go to **Build** → **Firestore Database**
2. Click **"Create database"**
3. Select **"Start in test mode"** (for hackathon - easier)
4. Choose a location closest to you (e.g., `asia-southeast1` for Malaysia)
5. Click **"Enable"**

### Security Rules (Test Mode)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Note:** This is insecure but fine for hackathon. For production, add proper auth!

## Step 4: Configure Environment Variables

1. Create `.env.local` file in your project root:

```bash
# Copy from .env.example
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Add Firebase config from Step 2
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=whateverclicks-xxxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=whateverclicks-xxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=whateverclicks-xxxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

2. **Never commit `.env.local`** (already in .gitignore)

## Step 5: Deploy to Vercel (with Firebase)

1. Go to your Vercel project dashboard
2. Settings → Environment Variables
3. Add all `NEXT_PUBLIC_*` variables from `.env.local`
4. Redeploy your app

## Step 6: Test the Connection

### Testing Locally:

```bash
npm run dev
```

1. Open `http://localhost:3000/caller` (your phone)
2. Open `http://localhost:3000/dashboard` (your laptop)
3. Click "Start Emergency Call" on caller page
4. You should see incoming call alert on dashboard
5. Click "Answer" to establish connection

### Testing on Vercel:

1. Open `https://your-app.vercel.app/caller` on phone
2. Open `https://your-app.vercel.app/dashboard` on laptop
3. Follow same steps as local testing

## Firestore Data Structure

When calls are active, you'll see this in Firestore:

```
calls/
  ├── {auto-generated-id}/
      ├── offer: { sdp: "...", type: "offer" }
      ├── answer: { sdp: "...", type: "answer" }
      ├── status: "connected"
      ├── timestamp: Timestamp
      ├── callerCandidates/
      │   └── {candidate-id}: { candidate: {...} }
      └── dispatcherCandidates/
          └── {candidate-id}: { candidate: {...} }
```

## Troubleshooting

### Video doesn't show:

- Check browser permissions for camera/mic
- Ensure HTTPS (required for WebRTC) - localhost is OK
- Check browser console for errors

### Connection fails:

- Verify Firebase config in `.env.local`
- Check Firestore rules (test mode should allow all)
- Try different browsers (Chrome/Edge recommended)

### ICE connection issues:

- STUN server should work for most cases
- If behind strict firewall, may need TURN server

## Security Notes for Production

Before going live:

1. Update Firestore rules with proper authentication
2. Add rate limiting
3. Clean up old call documents
4. Use environment-specific Firebase projects

## Resources

- [Firebase Docs](https://firebase.google.com/docs)
- [WebRTC Docs](https://webrtc.org/getting-started/overview)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
