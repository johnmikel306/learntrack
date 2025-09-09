#!/usr/bin/env python3
"""
Test script to verify all imports work correctly
"""

print("Testing imports...")

try:
    print("1. Testing enhanced_auth import...")
    from app.core.enhanced_auth import EnhancedClerkJWTBearer, ClerkUserContext
    print("   ✅ Enhanced auth imports successful")
except Exception as e:
    print(f"   ❌ Enhanced auth import failed: {e}")

try:
    print("2. Testing user service import...")
    from app.services.user_service import UserService
    print("   ✅ User service import successful")
except Exception as e:
    print(f"   ❌ User service import failed: {e}")

try:
    print("3. Testing user models import...")
    from app.models.user import User, UserCreate, UserRole
    print("   ✅ User models import successful")
except Exception as e:
    print(f"   ❌ User models import failed: {e}")

try:
    print("4. Testing auth endpoints import...")
    from app.api.v1.endpoints.auth import router
    print("   ✅ Auth endpoints import successful")
except Exception as e:
    print(f"   ❌ Auth endpoints import failed: {e}")

try:
    print("5. Testing subjects endpoints import...")
    from app.api.v1.endpoints.subjects import router
    print("   ✅ Subjects endpoints import successful")
except Exception as e:
    print(f"   ❌ Subjects endpoints import failed: {e}")

try:
    print("6. Testing main app import...")
    from app.main import app
    print("   ✅ Main app import successful")
except Exception as e:
    print(f"   ❌ Main app import failed: {e}")

print("\nImport testing complete!")
