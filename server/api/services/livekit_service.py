"""
Livekit Cloud Service for Video Sessions.

Provides functionality for:
- Generating access tokens for participants
- Creating room URLs
- Validating webhook events
"""
import os
import time
import jwt
import json
import logging

logger = logging.getLogger(__name__)


class LivekitService:
    """Service for interacting with Livekit Cloud."""
    
    def __init__(self):
        self.api_key = os.getenv('LIVEKIT_API_KEY', '')
        self.api_secret = os.getenv('LIVEKIT_API_SECRET', '')
        self.url = os.getenv('LIVEKIT_URL', 'wss://noor-kpvwjnkk.livekit.cloud')
    
    def is_configured(self) -> bool:
        """Check if Livekit is properly configured."""
        return bool(self.api_key and self.api_secret and self.url)
    
    def get_room_url(self, room_name: str) -> str:
        """Get the full room URL for a session."""
        # Convert wss:// to https:// for the room URL
        base_url = self.url.replace('wss://', 'https://').replace('/ws', '')
        return f"{base_url}/room/{room_name}"
    
    def generate_token(
        self,
        room_name: str,
        participant_identity: str,
        participant_name: str = None,
        is_host: bool = False,
        ttl_seconds: int = 86400  # 24 hours
    ) -> str:
        """
        Generate a JWT access token for a participant to join a Livekit room.
        
        Args:
            room_name: The name of the room to join
            participant_identity: Unique identifier for the participant (e.g., user ID)
            participant_name: Display name for the participant
            is_host: Whether this participant is the host (teacher)
            ttl_seconds: Token validity duration in seconds
            
        Returns:
            JWT token string
        """
        if not self.is_configured():
            raise ValueError("Livekit is not configured. Check environment variables.")
        
        if participant_name is None:
            participant_name = participant_identity
        
        now = int(time.time())
        
        # Livekit token claims
        # Reference: https://docs.livekit.io/realtime/concepts/authentication/
        claims = {
            # Standard JWT claims
            'iss': self.api_key,  # API Key as issuer
            'sub': participant_identity,  # Participant identity
            'nbf': now,  # Not before
            'exp': now + ttl_seconds,  # Expiration
            'iat': now,  # Issued at
            'jti': f"{participant_identity}-{now}",  # Unique token ID
            
            # Livekit-specific claims
            'name': participant_name,
            'video': {
                'room': room_name,
                'roomJoin': True,
                'roomCreate': is_host,  # Only hosts can create rooms
                'canPublish': True,
                'canSubscribe': True,
                'canPublishData': True,
                # Additional permissions for hosts
                'roomAdmin': is_host,
                'roomRecord': is_host,
            },
            'metadata': json.dumps({
                'is_host': is_host,
                'identity': participant_identity
            })
        }
        
        # Sign the token with the API secret
        token = jwt.encode(
            claims,
            self.api_secret,
            algorithm='HS256'
        )
        
        return token
    
    def verify_webhook(self, body: bytes, auth_header: str) -> bool:
        """
        Verify that a webhook request came from Livekit.
        
        Args:
            body: Raw request body
            auth_header: Authorization header value
            
        Returns:
            True if valid, False otherwise
        """
        if not auth_header:
            return False
        
        try:
            # Livekit sends webhooks with Bearer token
            # The token is signed with the API secret
            token = auth_header.replace('Bearer ', '')
            
            decoded = jwt.decode(
                token,
                self.api_secret,
                algorithms=['HS256'],
                options={'verify_exp': True}
            )
            
            # Verify the issuer matches our API key
            return decoded.get('iss') == self.api_key
            
        except jwt.InvalidTokenError as e:
            logger.warning(f"Invalid webhook token: {e}")
            return False
    
    def parse_webhook_event(self, body: bytes) -> dict:
        """Parse webhook event from request body."""
        try:
            return json.loads(body)
        except json.JSONDecodeError:
            return {}


# Singleton instance
livekit_service = LivekitService()
