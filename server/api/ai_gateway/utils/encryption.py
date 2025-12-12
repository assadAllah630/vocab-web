"""
Encryption utilities for AI Gateway API keys.
Uses Fernet symmetric encryption for secure key storage.
"""

import os
import base64
import logging
from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings

logger = logging.getLogger(__name__)


def get_encryption_key() -> bytes:
    """
    Get or generate the Fernet encryption key.
    Uses AI_GATEWAY_ENCRYPTION_KEY from environment or generates a default for dev.
    """
    key = os.environ.get('AI_GATEWAY_ENCRYPTION_KEY')
    
    if key:
        # Ensure it's properly formatted
        try:
            # If it's a valid base64-encoded 32-byte key
            key_bytes = key.encode('utf-8') if isinstance(key, str) else key
            Fernet(key_bytes)  # Validate
            return key_bytes
        except Exception:
            logger.warning("Invalid AI_GATEWAY_ENCRYPTION_KEY, attempting to decode")
    
    # For development: use a derived key from Django's SECRET_KEY
    if settings.DEBUG:
        # Derive a Fernet key from SECRET_KEY (must be exactly 32 url-safe base64-encoded bytes)
        import hashlib
        secret = settings.SECRET_KEY.encode('utf-8')
        derived = hashlib.sha256(secret).digest()
        key_bytes = base64.urlsafe_b64encode(derived)
        logger.warning("Using derived encryption key from SECRET_KEY. Set AI_GATEWAY_ENCRYPTION_KEY in production!")
        return key_bytes
    
    raise ValueError(
        "AI_GATEWAY_ENCRYPTION_KEY environment variable must be set in production. "
        "Generate one with: python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\""
    )


def get_fernet() -> Fernet:
    """Get a Fernet instance for encryption/decryption."""
    return Fernet(get_encryption_key())


def encrypt_api_key(api_key: str) -> str:
    """
    Encrypt an API key for secure storage.
    
    Args:
        api_key: The plaintext API key
        
    Returns:
        Base64-encoded encrypted key string
    """
    fernet = get_fernet()
    encrypted = fernet.encrypt(api_key.encode('utf-8'))
    return encrypted.decode('utf-8')


def decrypt_api_key(encrypted_key: str) -> str:
    """
    Decrypt a stored API key.
    
    Args:
        encrypted_key: The encrypted key from database
        
    Returns:
        The plaintext API key
        
    Raises:
        ValueError: If decryption fails (invalid key or tampered data)
    """
    try:
        fernet = get_fernet()
        decrypted = fernet.decrypt(encrypted_key.encode('utf-8'))
        return decrypted.decode('utf-8')
    except InvalidToken:
        logger.error("Failed to decrypt API key - invalid token or tampered data")
        raise ValueError("Failed to decrypt API key. Key may be corrupted or encryption key changed.")
    except Exception as e:
        logger.error(f"Unexpected error decrypting API key: {e}")
        raise ValueError(f"Failed to decrypt API key: {str(e)}")


def mask_api_key(api_key: str, visible_chars: int = 4) -> str:
    """
    Mask an API key for display, showing only first and last few characters.
    
    Args:
        api_key: The plaintext API key
        visible_chars: Number of characters to show at start and end
        
    Returns:
        Masked string like "sk-ab...xy"
    """
    if len(api_key) <= visible_chars * 2:
        return "*" * len(api_key)
    
    return f"{api_key[:visible_chars]}...{api_key[-visible_chars:]}"
