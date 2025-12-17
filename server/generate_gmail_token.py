"""
Gmail Token Generator for VocabMaster

1. Run this script: python generate_gmail_token.py
2. A browser will open - log in with your Gmail account
3. Copy the REFRESH TOKEN that is printed at the end
4. Add it to Render environment variables as GOOGLE_REFRESH_TOKEN
"""

import os
import json

# Check if required library is installed
try:
    from google_auth_oauthlib.flow import InstalledAppFlow
except ImportError:
    print("Installing required library...")
    os.system("pip install google-auth-oauthlib")
    from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ['https://www.googleapis.com/auth/gmail.send']

def main():
    # Check if credentials.json exists
    if not os.path.exists('credentials.json'):
        print("""
ERROR: credentials.json not found!

Steps to get it:
1. Go to https://console.cloud.google.com/
2. Select your project
3. Go to APIs & Services > Credentials
4. Click on your OAuth 2.0 Client ID
5. Download JSON (rename it to credentials.json)
6. Place it in this folder
7. Run this script again
        """)
        return

    print("Opening browser for authentication...")
    print("Log in with: assad.allah630@gmail.com")
    print("")

    flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
    creds = flow.run_local_server(port=0)

    print("\n" + "=" * 60)
    print("SUCCESS! Copy these values to your Render environment:")
    print("=" * 60)
    print(f"\nGOOGLE_REFRESH_TOKEN = {creds.refresh_token}")
    print(f"\nGOOGLE_OAUTH_CLIENT_ID = {creds.client_id}")
    print(f"\nGOOGLE_OAUTH_CLIENT_SECRET = {creds.client_secret}")
    print("\n" + "=" * 60)

    # Also save to a file for convenience
    with open('token_output.txt', 'w') as f:
        f.write(f"GOOGLE_REFRESH_TOKEN={creds.refresh_token}\n")
        f.write(f"GOOGLE_OAUTH_CLIENT_ID={creds.client_id}\n")
        f.write(f"GOOGLE_OAUTH_CLIENT_SECRET={creds.client_secret}\n")
    
    print("\nThese values have also been saved to token_output.txt")
    print("\nDON'T FORGET: Add these to your Render environment variables!")

if __name__ == '__main__':
    main()
