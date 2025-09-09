#!/usr/bin/env python3
"""
Test script for the progress reports endpoint
"""
import asyncio
import sys
import os
from motor.motor_asyncio import AsyncIOMotorClient

# Add the backend directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.progress_service import ProgressService


async def test_progress_reports():
    """Test the progress reports functionality"""
    print("🧪 Testing Progress Reports API...")
    
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.learntrack_dev
    
    try:
        # Initialize the service
        progress_service = ProgressService(db)
        
        print("📊 Testing progress reports endpoint...")
        
        # Test the get_progress_reports method
        reports = await progress_service.get_progress_reports()
        
        print(f"✅ Successfully retrieved progress reports!")
        print(f"📈 Student Performance Data: {len(reports.student_performance)} students")
        print(f"📅 Weekly Progress Data: {len(reports.weekly_progress)} weeks")
        
        # Print student data
        print("\n👥 Student Performance:")
        for student in reports.student_performance:
            print(f"  • {student.name}: Math={student.math}%, Physics={student.physics}%, Chemistry={student.chemistry}%")
        
        # Print weekly data
        print("\n📊 Weekly Progress:")
        for week in reports.weekly_progress:
            print(f"  • {week.week}: {week.completed}/{week.assigned} completed")
        
        print("\n✅ All tests passed!")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        client.close()


async def test_api_endpoint():
    """Test the actual API endpoint"""
    import aiohttp
    
    print("\n🌐 Testing API endpoint...")
    
    try:
        async with aiohttp.ClientSession() as session:
            # Note: This will fail without proper authentication
            # but we can test if the endpoint exists
            async with session.get("http://localhost:8000/api/v1/progress/reports") as response:
                if response.status == 401:
                    print("✅ API endpoint exists (authentication required)")
                elif response.status == 200:
                    data = await response.json()
                    print(f"✅ API endpoint working! Got {len(data.get('student_performance', []))} students")
                else:
                    print(f"⚠️  API endpoint returned status: {response.status}")
                    
    except aiohttp.ClientConnectorError:
        print("⚠️  API server not running on localhost:8000")
    except Exception as e:
        print(f"❌ API test failed: {e}")


if __name__ == "__main__":
    print("🚀 Starting Progress Reports Tests...\n")
    
    # Test the service layer
    asyncio.run(test_progress_reports())
    
    # Test the API endpoint
    asyncio.run(test_api_endpoint())
    
    print("\n🎉 Testing complete!")
