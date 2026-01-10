"""
Configuration - Application settings loaded from environment variables.
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # Gemini API
    gemini_api_key: str
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False
    
    # File Storage
    temp_dir: str = "./temp"
    max_video_size_mb: int = 100
    
    # Playwright
    headless: bool = False  # False = visible browser for noVNC
    browser_timeout_ms: int = 30000
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
