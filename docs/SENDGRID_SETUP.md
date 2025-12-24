# SendGrid Setup Instructions

## Step 1: Get SendGrid API Key

1. Go to https://app.sendgrid.com/login (or signup at https://signup.sendgrid.com/)
2. After logging in, navigate to: **Settings** → **API Keys**
3. Click **"Create API Key"**
4. Name: `VocabMaster`
5. Permissions: Select **"Full Access"** (or at least "Mail Send")
6. Click **"Create & View"**
7. **COPY the API key** (it starts with `SG.` and you can only see it once!)

## Step 2: Add to .env File

Open `server/.env` and add these lines:

```ini
# SendGrid Configuration
SENDGRID_API_KEY=SG.your_api_key_here
FROM_EMAIL=noreply@vocabmaster.com
```

Replace `SG.your_api_key_here` with your actual SendGrid API key.

## Step 3: Verify Domain (Optional but Recommended)

For better deliverability:
1. In SendGrid, go to **Settings** → **Sender Authentication**
2. Click **"Verify a Single Sender"**
3. Fill in your details:
   - From Name: VocabMaster
   - From Email: noreply@vocabmaster.com (you can use any email you control)
4. Verify the confirmation email

## Step 4: Test

Restart your Django server and try signing up with a new email!

## Notes

- SendGrid Free Tier: 100 emails/day (perfect for development)
- Emails usually arrive within seconds
- Check spam folder if you don't see the email
