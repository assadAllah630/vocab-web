# Auth Module Context

## Purpose
The **Auth Module** handles user registration, login, and identity verification. It supports multiple authentication methods.

## Authentication Methods
1.  **Token (REST Framework)**: Session-based + Token.
    -   `POST /api/auth/signin/`: Returns DRF Token.
    -   Token sent in `Authorization: Token <key>` header.
2.  **Email OTP**: Passwordless login.
    -   `POST /api/auth/send-otp/`: Sends code via email.
    -   `POST /api/auth/verify-otp/`: Validates code, returns token.
3.  **Google OAuth 2.0**: `POST /api/auth/google/`.
4.  **Firebase ID Token**: `POST /api/auth/firebase/` for mobile.

## Key Models
See `server/api/models.py`.

-   **UserProfile**: Settings, preferences, `fcm_token`.
-   **OTPCode** (implicit logic in `auth_views.py`): Temporary codes.

## Core Features
-   **Password Management**: `set-password`, `change-password`, `password-status` endpoints.
-   **Email Verification**: OTP flow before account activation.
-   **Teacher Role**: `Teacher` model is linked if user applies and is approved.

## Key Files
-   `server/api/views/auth_views.py`: All authentication logic.
-   `server/api/serializers.py`: User/Profile serializers.
