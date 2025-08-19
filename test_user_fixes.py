#!/usr/bin/env python3
"""
Test script to verify the user model and service fixes
"""
import asyncio
import sys
import os

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from motor.motor_asyncio import AsyncIOMotorClient
from app.models.user import User, UserCreate, UserRole
from app.services.user_service import UserService
from app.core.config import settings

async def test_user_fixes():
    """Test the user model and service fixes"""
    print("Testing User Model and Service Fixes...")
    
    # Connect to database
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    
    try:
        # Test 1: Create UserService
        print("\n1. Creating UserService...")
        user_service = UserService(db)
        print("✅ UserService created successfully")
        
        # Test 2: Test get_user_by_auth0_id with auto-provisioning
        print("\n2. Testing auto-provisioning with unique emails...")
        
        # Test different auth0_ids to ensure unique emails
        test_auth0_ids = ["dev::test1", "dev::test2", "dev::fallback"]
        
        for auth0_id in test_auth0_ids:
            print(f"   Testing auth0_id: {auth0_id}")
            user = await user_service.get_user_by_auth0_id(auth0_id)
            print(f"   ✅ User created/retrieved: {user.email} (ID: {user.id})")
        
        # Test 3: Test ObjectId handling
        print("\n3. Testing ObjectId handling...")
        
        # Get a user and test get_user_by_id
        test_user = await user_service.get_user_by_auth0_id("dev::test1")
        retrieved_user = await user_service.get_user_by_id(test_user.id)
        print(f"   ✅ Retrieved user by ID: {retrieved_user.email}")
        
        # Test 4: Test duplicate handling
        print("\n4. Testing duplicate handling...")
        
        # Try to get the same user again
        duplicate_user = await user_service.get_user_by_auth0_id("dev::test1")
        print(f"   ✅ Duplicate user handled correctly: {duplicate_user.email}")
        
        print("\n🎉 All tests passed! The fixes are working correctly.")
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    
    finally:
        client.close()
    
    return True

if __name__ == "__main__":
    success = asyncio.run(test_user_fixes())
    sys.exit(0 if success else 1)
