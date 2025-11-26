# Testing Image Generation - Step by Step Guide

## Current Status
✅ Backend fixed - proper error handling for missing API keys
✅ Frontend updated - better error messages
⚠️ **You need to configure API keys to test**

## How to Test Image Generation

### Step 1: Get an API Key (Choose One)

#### Option A: Stable Horde (Free, Recommended for Testing)
1. Go to: https://stablehorde.net/register
2. Create account (free)
3. Copy your API key

#### Option B: Hugging Face (Faster)
1. Go to: https://huggingface.co/settings/tokens
2. Create new token with "Read" permission
3. Copy the token

### Step 2: Add API Key to Settings
1. In the app, go to **Settings** page
2. Scroll to **"Image Generation Configuration"** section
3. Paste your key in the appropriate field:
   - **Stable Horde API Key** OR
   - **Hugging Face API Token**
4. Click **"Save Image Keys"**
5. Wait for "Saved!" confirmation

### Step 3: Generate a New Story with Images
1. Go to **AI Content Generator**
2. Select **"Story"** type
3. **IMPORTANT**: Toggle **"Illustrated Story"** to ON (you should see it turn blue/active)
4. Fill in:
   - Topic: e.g., "A day at work"
   - Student Level: e.g., "B1"
5. Click **"Generate Content"**
6. You'll be redirected to the story viewer

### Step 4: Watch Images Generate
- **Text appears immediately** - You can start reading right away
- **Images load progressively** - You'll see:
  - "Waiting for artist..." (pending)
  - "Painting scene..." (generating) - Takes 1-2 minutes per image
  - Image appears when complete
- **Check browser console** for any errors (F12 → Console tab)

## Troubleshooting

### Problem: "No GeneratedContent matches the given query"
**Cause**: Trying to view a story that doesn't exist or was deleted
**Solution**: Generate a NEW story - don't try to view old ones

### Problem: All images show "failed"
**Cause**: No API keys configured
**Solution**: 
1. Go to Settings
2. Add your Stable Horde or Hugging Face key
3. Generate a NEW story (don't retry old ones)

### Problem: Images stuck on "Waiting for artist..."
**Cause**: Polling might not be working
**Solution**:
1. Open browser console (F12)
2. Check Network tab for `/images/status/` requests
3. Look for errors in Console tab
4. Refresh the page

### Problem: "Image generation providers configured" error
**Cause**: Empty API keys in database
**Solution**:
1. Make sure you SAVED the keys in Settings
2. Check that the "Saved!" message appeared
3. Try logging out and back in

## What You Should See

### With Images Enabled:
```
┌─────────────────────────────────────┐
│  [Image]          │  Story Text     │
│  (or loading)     │  Event 1        │
│                   │  Content...     │
└─────────────────────────────────────┘
```

### Without Images:
```
┌─────────────────────────────────────┐
│         Story Text                  │
│         Event 1                     │
│         Content...                  │
└─────────────────────────────────────┘
```

## Checking if It's Working

### In Browser Console:
Look for these logs:
- ✅ `Attempting generation with StableHordeProvider...` (or HuggingFaceProvider)
- ✅ Polling requests to `/api/ai/generated-content/X/images/status/`
- ❌ `No image generation providers configured` = Need to add keys

### In Network Tab:
1. Open DevTools (F12) → Network tab
2. Filter by "status"
3. You should see requests to `/images/status/` every 5 seconds
4. Click on a request → Preview tab to see the response
5. Check `status` field: should be "generating" then "completed"

## Expected Timeline
- Story text: **Instant** (5-10 seconds)
- First image: **1-2 minutes** (Stable Horde) or **30-60 seconds** (Hugging Face)
- Each additional image: **1-2 minutes** each
- Total for 8 images: **8-16 minutes**

## Quick Test Command
Run this in Django shell to verify your keys are saved:
```python
python manage.py shell
>>> from django.contrib.auth.models import User
>>> user = User.objects.first()
>>> print("Horde Key:", bool(user.profile.stable_horde_api_key))
>>> print("HF Token:", bool(user.profile.huggingface_api_token))
```

Should print `True` for at least one of them.
