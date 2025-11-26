# How to Get Your Google Cloud TTS API Key

Follow these simple steps to get your free Google Cloud Text-to-Speech API key:

## Step 1: Create Google Cloud Account
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account (or create one)
3. **No credit card required for free tier!**

## Step 2: Create a Project
1. Click "Select a project" at the top
2. Click "New Project"
3. Name it anything (e.g., "My TTS Project")
4. Click "Create"

## Step 3: Enable Text-to-Speech API
1. In the search bar, type "Text-to-Speech API"
2. Click on "Cloud Text-to-Speech API"
3. Click the blue "Enable" button
4. Wait a few seconds for it to activate

## Step 4: Create API Key (Service Account)
1. Go to "IAM & Admin" → "Service Accounts" (use search bar)
2. Click "Create Service Account"
3. Enter a name (e.g., "tts-user")
4. Click "Create and Continue"
5. For role, select "Cloud Text-to-Speech User"
6. Click "Continue" → "Done"

## Step 5: Download Your Key
1. Click on the service account you just created
2. Go to the "Keys" tab
3. Click "Add Key" → "Create new key"
4. Select **JSON** format
5. Click "Create"
6. A JSON file will download - **this is your API key!**

## Step 6: Copy the Key Content
1. Open the downloaded JSON file with Notepad
2. **Copy the ENTIRE content** (it looks like `{"type": "service_account", ...}`)
3. Go to your app's Settings page
4. Paste it into the "Google TTS API Key" field
5. Click "Save"

## ✓ Done!
- **Free tier**: 1 million characters/month
- **380+ voices** in 75+ languages
- **No credit card needed**

## Troubleshooting
- **"Invalid API key"**: Make sure you copied the ENTIRE JSON content
- **"Permission denied"**: Make sure you selected "Cloud Text-to-Speech User" role
- **"API not enabled"**: Go back to Step 3 and enable the API

## Security Note
- Keep your API key private
- Don't share it with others
- Each user should have their own key
