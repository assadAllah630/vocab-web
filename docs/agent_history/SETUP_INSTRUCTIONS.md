# Final Setup Instructions

Great job completing Part 1! Now let's finish the setup.

## Step 1: Install Backend Dependencies

Run this command in PowerShell as Administrator:

```powershell
cd E:\vocab_web\server
python -m pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client python-dotenv
```

## Step 2: Create Backend .env File

1. Copy `.env.example` to `.env`:
   ```powershell
   cd E:\vocab_web\server
   copy .env.example .env
   ```

2. Edit `server/.env` and add your credentials:
   - `GOOGLE_OAUTH_CLIENT_ID`: Your Client ID from Google Console
   - `GOOGLE_OAUTH_CLIENT_SECRET`: Your Client Secret from Google Console
   - `GMAIL_USER`: Your Gmail address
   - `GMAIL_APP_PASSWORD`: The 16-character app password you generated

## Step 3: Install Frontend Dependencies

Run PowerShell as Administrator and execute:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
cd E:\vocab_web\client
npm install @react-oauth/google
```

## Step 4: Create Frontend .env File

1. Copy `.env.example` to `.env`:
   ```powershell
   cd E:\vocab_web\client
   copy .env.example .env
   ```

2. Edit `client/.env` and add:
   ```
   VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   VITE_API_URL=http://localhost:8000/api
   ```

## Step 5: Test Email Sending

Create a test script `server/test_email.py`:

```python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vocab_server.settings')
django.setup()

from django.core.mail import send_mail
from django.conf import settings

try:
    send_mail(
        'Test Email from Vocab App',
        'If you receive this, your email configuration is working!',
        settings.DEFAULT_FROM_EMAIL,
        ['your-email@example.com'],  # Replace with your email
        fail_silently=False,
    )
    print("✅ Email sent successfully!")
except Exception as e:
    print(f"❌ Email failed: {e}")
```

Run it:
```powershell
cd E:\vocab_web\server
python test_email.py
```

## Step 6: Restart Your Servers

1. Stop both backend and frontend servers (Ctrl+C)
2. Restart backend:
   ```powershell
   cd E:\vocab_web\server
   python manage.py runserver
   ```
3. Restart frontend:
   ```powershell
   cd E:\vocab_web\client
   npm run dev
   ```

## Step 7: Test Google OAuth

1. Go to `http://localhost:5173/login`
2. You should see a "Continue with Google" button
3. Click it and sign in with your Google account
4. You should be logged in automatically!

## What's Been Implemented

### Backend ✅
- Google OAuth login endpoint (`/api/auth/google/`)
- OTP email sending (`/api/auth/send-otp/`)
- OTP verification (`/api/auth/verify-otp/`)
- Exam share notifications (`/api/notifications/share-exam/`)
- Gmail SMTP configuration
- Environment variable management

### Frontend ✅
- Google OAuth button component (`GoogleAuthButton.jsx`)
- Stats page removed from sidebar
- Environment variables setup

## Next Steps (Optional)

### 1. Update Login Page

Add the Google button to your login page:

```javascript
import GoogleAuthButton from '../components/GoogleAuthButton';

// In your Login component:
<GoogleAuthButton 
    onSuccess={(data) => {
        navigate('/');
    }}
    onError={(error) => {
        alert('Login failed');
    }}
/>
```

### 2. Update Signup Page

Add OTP-based registration:

```javascript
const [step, setStep] = useState(1); // 1: email, 2: OTP

// Step 1: Send OTP
const sendOTP = async () => {
    await api.post('auth/send-otp/', { email });
    setStep(2);
};

// Step 2: Verify OTP
const verifyOTP = async () => {
    const response = await api.post('auth/verify-otp/', {
        email,
        otp,
        username,
        password
    });
    localStorage.setItem('token', response.data.token);
    navigate('/');
};
```

### 3. Add Exam Sharing

In your exam detail page:

```javascript
const shareExam = async (recipientEmail) => {
    await api.post('notifications/share-exam/', {
        recipient_email: recipientEmail,
        exam_title: exam.topic,
        share_link: `http://localhost:5173/exams/${exam.id}`
    });
    alert('Invitation sent!');
};
```

## Troubleshooting

### "Module not found: google-auth"
Run: `python -m pip install google-auth google-auth-oauthlib`

### "Cannot load scripts" (PowerShell)
Run PowerShell as Administrator:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Email not sending
1. Check Gmail App Password is correct (16 characters, no spaces)
2. Verify 2-Step Verification is enabled on your Google account
3. Check spam folder
4. Try the test_email.py script

### Google OAuth not working
1. Verify Client ID in both `.env` files matches Google Console
2. Check redirect URIs in Google Console match exactly
3. Clear browser cache and try again

## Security Reminders

1. **NEVER** commit `.env` files to Git
2. Add to `.gitignore`:
   ```
   .env
   .env.local
   *.json
   ```
3. Use different credentials for production
4. Rotate secrets regularly

---

🎉 **Congratulations!** Your app now has:
- Google OAuth login
- Email OTP verification
- Notification emails
- Cleaner sidebar (Stats removed)

Need help? Check the error messages and refer to this guide!
