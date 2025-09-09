#!/usr/bin/env python3
"""
Fix duplicate auth0_id null values in the users collection
"""
import asyncio
import sys
import os
from datetime import datetime

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

async def fix_duplicate_auth0_ids():
    """Fix duplicate auth0_id null values"""
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    users_collection = db.users
    
    try:
        print("🔍 Checking for duplicate auth0_id null values...")
        
        # Find all users with null auth0_id
        null_auth0_users = []
        async for user in users_collection.find({"auth0_id": None}):
            null_auth0_users.append(user)
        
        print(f"Found {len(null_auth0_users)} users with null auth0_id")
        
        if len(null_auth0_users) <= 1:
            print("✅ No duplicates found. Only 0 or 1 user with null auth0_id.")
            return
        
        # Keep the first one, delete the rest
        users_to_delete = null_auth0_users[1:]  # Skip the first one
        
        print(f"🗑️  Deleting {len(users_to_delete)} duplicate users with null auth0_id...")
        
        for user in users_to_delete:
            result = await users_collection.delete_one({"_id": user["_id"]})
            if result.deleted_count > 0:
                print(f"   ✅ Deleted user: {user.get('email', 'unknown')} (ID: {user['_id']})")
            else:
                print(f"   ❌ Failed to delete user: {user.get('email', 'unknown')} (ID: {user['_id']})")
        
        print("🔧 Attempting to create unique index on auth0_id...")
        
        # Try to create the unique index
        try:
            await users_collection.create_index("auth0_id", unique=True, sparse=True)
            print("✅ Successfully created unique index on auth0_id")
        except Exception as e:
            print(f"❌ Failed to create index: {e}")
        
        # Verify the fix
        remaining_null_users = []
        async for user in users_collection.find({"auth0_id": None}):
            remaining_null_users.append(user)
        
        print(f"✅ Verification: {len(remaining_null_users)} users with null auth0_id remaining")
        
    except Exception as e:
        print(f"❌ Error: {e}")
    finally:
        client.close()

async def main():
    """Main function"""
    print("="*60)
    print("FIX DUPLICATE AUTH0_ID NULL VALUES")
    print("="*60)
    
    await fix_duplicate_auth0_ids()
    
    print("="*60)
    print("✅ Fix completed!")
    print("="*60)

if __name__ == "__main__":
    asyncio.run(main())
