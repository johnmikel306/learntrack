"""
Utility functions for generating URL-friendly slugs
"""
import re
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorDatabase


def generate_slug(name: str) -> str:
    """
    Generate a URL-friendly slug from a name
    
    Args:
        name: The name to convert to a slug (e.g., "John Doe")
        
    Returns:
        A URL-friendly slug (e.g., "john-doe")
    """
    # Convert to lowercase
    slug = name.lower()
    
    # Replace spaces and special characters with hyphens
    slug = re.sub(r'[^\w\s-]', '', slug)
    slug = re.sub(r'[\s_]+', '-', slug)
    slug = re.sub(r'-+', '-', slug)
    
    # Remove leading/trailing hyphens
    slug = slug.strip('-')
    
    return slug


async def generate_unique_slug(
    database: AsyncIOMotorDatabase,
    collection_name: str,
    name: str,
    exclude_id: Optional[str] = None
) -> str:
    """
    Generate a unique slug for a user by appending a number if necessary
    
    Args:
        database: MongoDB database instance
        collection_name: Name of the collection to check for uniqueness
        name: The name to convert to a slug
        exclude_id: Optional ID to exclude from uniqueness check (for updates)
        
    Returns:
        A unique URL-friendly slug
    """
    base_slug = generate_slug(name)
    slug = base_slug
    counter = 1
    
    collection = database[collection_name]
    
    while True:
        # Check if slug exists
        query = {"slug": slug}
        if exclude_id:
            query["_id"] = {"$ne": exclude_id}
            
        existing = await collection.find_one(query)
        
        if not existing:
            return slug
            
        # Slug exists, try with a number
        slug = f"{base_slug}-{counter}"
        counter += 1

