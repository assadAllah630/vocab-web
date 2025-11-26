# Image Generation Setup Guide

## Issue Identified

All image generation was failing with a **403 FORBIDDEN** error from Stable Horde API. This happened because:

1. **Stable Horde no longer accepts anonymous requests** - The default anonymous key `"0000000000"` is now rejected
2. **Empty API keys were being passed** - When users hadn't configured their keys in Settings, empty strings were passed to the agent

## Solution Applied

### Backend Changes

1. **Updated `ImageGenerationAgent.__init__`** (`image_generation_agent.py`):
   - Now properly handles empty strings (treats them as `None`)
   - Only initializes providers when valid API keys are available
   - Adds warning log when no providers are configured

2. **Updated `generate_image` method**:
   - Returns a helpful error message when no providers are configured
   - Guides users to add their API keys in Settings

### What You Need to Do

To enable image generation, you **MUST** configure at least one API key:

#### Option 1: Stable Horde (Free, Slower)
1. Go to **https://stablehorde.net/register**
2. Create a free account
3. Get your API key
4. Add it in **Settings → Image Generation Configuration → Stable Horde API Key**

#### Option 2: Hugging Face (Faster, Rate Limited)
1. Go to **https://huggingface.co/settings/tokens**
2. Create a token with **Read** permission
3. Add it in **Settings → Image Generation Configuration → Hugging Face API Token**

#### Option 3: Environment Variables (System-Wide)
Add to your `.env` file or system environment:
```
STABLE_HORDE_API_KEY=your_key_here
HUGGINGFACE_API_TOKEN=your_token_here
```

## Testing

After adding your API key(s):
1. Go to **AI Content Generator**
2. Select **Story**
3. Enable **Illustrated Story** toggle
4. Generate a story
5. Images should now generate successfully!

## Error Messages

- **Before fix**: Silent failures, all images marked as "failed"
- **After fix**: Clear error message: "No image generation providers configured. Please add your Stable Horde API Key or Hugging Face API Token in Settings."

## Priority Fallback System

The system tries providers in this order:
1. **Stable Horde** (if key configured) - Free, unlimited, slower
2. **Hugging Face** (if token configured) - Fast, rate-limited

If both are configured, it will try Stable Horde first and fall back to Hugging Face if it fails.
