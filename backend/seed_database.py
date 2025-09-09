#!/usr/bin/env python3
"""
Database seeder script for LearnTrack
Run this to populate your MongoDB with realistic development data
"""

import asyncio
import sys
import os

# Add the app directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.core.seeders import run_seeders

async def main():
    """Main seeder function"""
    print("🌱 LearnTrack Database Seeder")
    print("=" * 50)
    print("This will populate your MongoDB with realistic development data:")
    print("• Users (tutors, students, parents)")
    print("• Subjects & Questions")
    print("• Assignments with scheduled dates")
    print("• Progress tracking data")
    print("• Notifications")
    print()
    
    # Confirm before proceeding
    response = input("Continue? This will clear existing data. (y/N): ")
    if response.lower() != 'y':
        print("❌ Seeding cancelled")
        return
    
    try:
        results = await run_seeders()
        
        print("\n" + "=" * 50)
        print("🎉 SUCCESS! Your LearnTrack database is ready!")
        print("\nWhat you can now test:")
        print("• Frontend components will show real data")
        print("• Assignment scheduling with future dates")
        print("• Student daily views")
        print("• Parent progress reports")
        print("• Tutor analytics")
        print("\nNext steps:")
        print("1. Start your backend: uvicorn app.main:app --reload --port 8000")
        print("2. Start your frontend: pnpm dev")
        print("3. Test the Tutor Dashboard with real data")
        
    except Exception as e:
        print(f"\n❌ Seeding failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
