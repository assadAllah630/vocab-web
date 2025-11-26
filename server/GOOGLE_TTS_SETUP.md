# Google Cloud Text-to-Speech Setup Guide

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: `vocab-web-tts`
4. Click "Create"

## Step 2: Enable Text-to-Speech API

1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Cloud Text-to-Speech API"
3. Click on it and click "Enable"

## Step 3: Create Service Account

1. Go to "IAM & Admin" → "Service Accounts"
2. Click "Create Service Account"
3. Enter details:
   - Name: `tts-service-account`
   - Description: `Service account for Text-to-Speech API`
4. Click "Create and Continue"
5. Grant role: "Cloud Text-to-Speech User"
6. Click "Continue" → "Done"

## Step 4: Create and Download Key

1. Click on the service account you just created
2. Go to "Keys" tab
3. Click "Add Key" → "Create new key"
4. Select "JSON" format
5. Click "Create"
6. Save the downloaded JSON file as `google-tts-key.json` in a secure location

## Step 5: Set Environment Variable

### Windows (PowerShell):
```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS="E:\vocab_web\server\google-tts-key.json"
```

### Windows (Permanent - System Properties):
1. Press `Win + R`, type `sysdm.cpl`, press Enter
2. Go to "Advanced" tab → "Environment Variables"
3. Under "User variables", click "New"
4. Variable name: `GOOGLE_APPLICATION_CREDENTIALS`
5. Variable value: `E:\vocab_web\server\google-tts-key.json`
6. Click OK

### Linux/Mac:
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/google-tts-key.json"
```

## Step 6: Verify Setup

Run this test script to verify your setup:

```python
from google.cloud import texttospeech

client = texttospeech.TextToSpeechClient()
voices = client.list_voices()
print(f"✓ Success! Found {len(voices.voices)} voices")
```

## Important Notes

- **Free Tier**: 1M characters/month for WaveNet, 4M for Standard
- **Security**: Never commit the JSON key file to version control
- **Add to .gitignore**: `google-tts-key.json`

## Next Steps

After completing setup, restart your Django server for the environment variable to take effect.
