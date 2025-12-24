import os
import json
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials

# Scopes required for Gmail API sending
SCOPES = ['https://www.googleapis.com/auth/gmail.send']

def main():
    print("--- Google Refresh Token Generator ---")
    print("This script will help you get a new Refresh Token for Gmail API.")
    
    # Check for credentials.json or ask for Client ID/Secret
    client_config = None
    
    if os.path.exists('credentials.json'):
        print("Found credentials.json")
        client_config_file = 'credentials.json'
    else:
        print("\nWe need your Google Cloud Client ID and Secret.")
        print("You can find these in your Google Cloud Console or Render Environment Variables.")
        client_id = input("Enter Client ID: ").strip()
        client_secret = input("Enter Client Secret: ").strip()
        
        client_config = {
            "installed": {
                "client_id": client_id,
                "client_secret": client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "redirect_uris": ["http://localhost:8080/"]
            }
        }
    
    try:
        if client_config:
            flow = InstalledAppFlow.from_client_config(client_config, SCOPES)
        else:
            flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)

        print("\nOpening browser for authentication...")
        print("IMPORTANT: Ensure 'http://localhost:8080/' is added to your Authorized Redirect URIs in Google Cloud Console.")
        # Fixed port 8080 is easier to whitelist than random ports
        creds = flow.run_local_server(port=8080)

        print("\n" + "="*50)
        print("SUCCESS! Here is your new Refresh Token:")
        print("="*50)
        print(f"\n{creds.refresh_token}\n")
        print("="*50)
        print("Copy this token and update GOOGLE_REFRESH_TOKEN in your Render Dashboard.")
        
    except Exception as e:
        print(f"\nError: {e}")
        print("Make sure you have added 'http://localhost' (and the specific port if not 0) to your Redirect URIs in Google Cloud Console if needed, though port 0 usually handles random ports.")

if __name__ == '__main__':
    main()
