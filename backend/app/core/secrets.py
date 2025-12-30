"""
Secret management module - AWS Secrets Manager integration.
Falls back to environment variables if AWS is not configured.
"""
import os
import json
from typing import Optional, Dict, Any
from functools import lru_cache
import structlog

logger = structlog.get_logger()

# AWS SDK is optional
try:
    import boto3
    from botocore.exceptions import ClientError
    AWS_AVAILABLE = True
except ImportError:
    AWS_AVAILABLE = False
    logger.info("boto3 not installed - using environment variables for secrets")


class SecretsManager:
    """
    Secrets manager with AWS Secrets Manager support.
    Falls back to environment variables if AWS is not configured.
    """
    
    def __init__(
        self,
        use_aws: bool = True,
        aws_region: Optional[str] = None,
        secret_prefix: str = "learntrack"
    ):
        self.use_aws = use_aws and AWS_AVAILABLE
        self.aws_region = aws_region or os.getenv("AWS_REGION", "us-east-1")
        self.secret_prefix = secret_prefix
        self._client = None
        self._secrets_cache: Dict[str, Any] = {}
    
    @property
    def client(self):
        """Lazy initialization of AWS Secrets Manager client"""
        if self._client is None and self.use_aws:
            self._client = boto3.client(
                service_name='secretsmanager',
                region_name=self.aws_region
            )
        return self._client
    
    def _get_secret_from_aws(self, secret_name: str) -> Optional[Dict[str, Any]]:
        """Retrieve secret from AWS Secrets Manager"""
        if not self.use_aws:
            return None
        
        full_name = f"{self.secret_prefix}/{secret_name}"
        
        # Check cache first
        if full_name in self._secrets_cache:
            return self._secrets_cache[full_name]
        
        try:
            response = self.client.get_secret_value(SecretId=full_name)
            
            if 'SecretString' in response:
                secret = json.loads(response['SecretString'])
                self._secrets_cache[full_name] = secret
                logger.info("Retrieved secret from AWS", secret_name=full_name)
                return secret
            else:
                logger.warning("Secret is binary, not string", secret_name=full_name)
                return None
                
        except Exception as e:
            if hasattr(e, 'response') and e.response.get('Error', {}).get('Code') == 'ResourceNotFoundException':
                logger.warning("Secret not found in AWS", secret_name=full_name)
            else:
                logger.error("Failed to retrieve secret from AWS", secret_name=full_name, error=str(e))
            return None
    
    def get_secret(self, key: str, default: Optional[str] = None) -> Optional[str]:
        """
        Get a secret value. Tries AWS first, then falls back to env vars.
        
        Args:
            key: Secret key (e.g., "OPENAI_API_KEY")
            default: Default value if not found
        
        Returns:
            Secret value or default
        """
        # Try AWS Secrets Manager first
        if self.use_aws:
            # Try to get from a secrets bundle first
            secrets = self._get_secret_from_aws("api-secrets")
            if secrets and key in secrets:
                return secrets[key]
            
            # Try individual secret
            secret = self._get_secret_from_aws(key.lower().replace("_", "-"))
            if secret:
                return secret.get("value", secret.get(key))
        
        # Fall back to environment variable
        value = os.getenv(key, default)
        if value:
            logger.debug("Using environment variable", key=key)
        return value
    
    def get_all_secrets(self) -> Dict[str, str]:
        """Get all configured secrets as a dictionary"""
        secrets = {}
        
        # List of secret keys we need
        secret_keys = [
            "CLERK_SECRET_KEY",
            "OPENAI_API_KEY",
            "ANTHROPIC_API_KEY",
            "GOOGLE_API_KEY",
            "GROQ_API_KEY",
            "GEMINI_API_KEY",
            "QDRANT_API_KEY",
            "TAVILY_API_KEY",
            "UPLOADTHING_SECRET",
            "CLERK_WEBHOOK_SECRET",
            "PLUNK_API_KEY",
        ]
        
        for key in secret_keys:
            value = self.get_secret(key)
            if value:
                secrets[key] = value
        
        return secrets
    
    def clear_cache(self):
        """Clear the secrets cache"""
        self._secrets_cache.clear()
        logger.info("Secrets cache cleared")


# Global secrets manager instance
# Set use_aws=False to always use environment variables
secrets_manager = SecretsManager(
    use_aws=os.getenv("USE_AWS_SECRETS", "false").lower() == "true"
)


@lru_cache(maxsize=100)
def get_secret(key: str, default: Optional[str] = None) -> Optional[str]:
    """Cached secret retrieval"""
    return secrets_manager.get_secret(key, default)

