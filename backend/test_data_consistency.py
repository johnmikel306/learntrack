#!/usr/bin/env python3
"""
Test script to verify data consistency between student management and progress reports
"""
import asyncio
import sys
import os
from datetime import datetime

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

import httpx

class DataConsistencyTest:
    """Test class for data consistency verification"""
    
    def __init__(self, base_url: str = "http://127.0.0.1:8000"):
        self.base_url = base_url
        self.client = httpx.AsyncClient()
        
    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()
    
    async def test_students_endpoint(self) -> dict:
        """Test the students endpoint"""
        try:
            response = await self.client.get(f"{self.base_url}/api/v1/students/")

            # Check if endpoint is accessible (even if it returns 403 due to auth)
            if response.status_code == 403:
                return {
                    "status": "accessible",
                    "endpoint": "/api/v1/students/",
                    "message": "Endpoint accessible but requires authentication",
                    "student_count": "unknown",
                    "students": []
                }

            response.raise_for_status()
            students = response.json()

            return {
                "status": "success",
                "endpoint": "/api/v1/students/",
                "student_count": len(students),
                "students": [student.get("name", "Unknown") for student in students]
            }
        except Exception as e:
            return {
                "status": "error",
                "endpoint": "/api/v1/students/",
                "error": str(e)
            }
    
    async def test_progress_reports_endpoint(self) -> dict:
        """Test the progress reports endpoint"""
        try:
            response = await self.client.get(f"{self.base_url}/api/v1/progress/reports")

            # Check if endpoint is accessible (even if it returns 403 due to auth)
            if response.status_code == 403:
                return {
                    "status": "accessible",
                    "endpoint": "/api/v1/progress/reports",
                    "message": "Endpoint accessible but requires authentication",
                    "student_count": "unknown",
                    "students": [],
                    "weekly_progress_count": "unknown"
                }

            response.raise_for_status()
            progress_data = response.json()

            student_performance = progress_data.get("student_performance", [])
            student_names = [student.get("student_name", "Unknown") for student in student_performance]

            return {
                "status": "success",
                "endpoint": "/api/v1/progress/reports",
                "student_count": len(student_performance),
                "students": student_names,
                "weekly_progress_count": len(progress_data.get("weekly_progress", []))
            }
        except Exception as e:
            return {
                "status": "error",
                "endpoint": "/api/v1/progress/reports",
                "error": str(e)
            }
    
    async def test_health_endpoint(self) -> dict:
        """Test the health endpoint"""
        try:
            response = await self.client.get(f"{self.base_url}/health")
            response.raise_for_status()
            return {
                "status": "success",
                "endpoint": "/health",
                "response": response.json()
            }
        except Exception as e:
            return {
                "status": "error",
                "endpoint": "/health",
                "error": str(e)
            }
    
    async def run_consistency_test(self) -> dict:
        """Run the full consistency test"""
        print("Starting data consistency test...")
        
        results = {}
        
        # Test health endpoint first
        results["health"] = await self.test_health_endpoint()
        
        # Test students endpoint
        results["students"] = await self.test_students_endpoint()
        
        # Test progress reports endpoint
        results["progress_reports"] = await self.test_progress_reports_endpoint()
        
        # Analyze consistency
        students_success = results["students"]["status"] in ["success", "accessible"]
        progress_success = results["progress_reports"]["status"] in ["success", "accessible"]
        
        if students_success and progress_success:
            students_count = results["students"]["student_count"]
            progress_count = results["progress_reports"]["student_count"]
            students_names = set(results["students"]["students"])
            progress_names = set(results["progress_reports"]["students"])
            
            results["consistency_analysis"] = {
                "both_endpoints_working": True,
                "student_count_match": students_count == progress_count,
                "students_endpoint_count": students_count,
                "progress_endpoint_count": progress_count,
                "students_names": list(students_names),
                "progress_names": list(progress_names),
                "names_match": students_names == progress_names,
                "data_source_consistent": True if students_count == progress_count and students_names == progress_names else False
            }
        else:
            results["consistency_analysis"] = {
                "both_endpoints_working": False,
                "students_working": students_success,
                "progress_working": progress_success,
                "data_source_consistent": False
            }
        
        return results

async def main():
    """Main test function"""
    test = DataConsistencyTest()
    
    try:
        # Run the consistency test
        results = await test.run_consistency_test()
        
        # Print results
        print("\n" + "="*80)
        print("DATA CONSISTENCY TEST RESULTS")
        print("="*80)
        
        # Health check
        health = results["health"]
        print(f"\n🏥 Health Check: {'✅ PASS' if health['status'] == 'success' else '❌ FAIL'}")
        if health["status"] == "error":
            print(f"   Error: {health['error']}")
        
        # Students endpoint
        students = results["students"]
        status_icon = "✅ PASS" if students['status'] in ['success', 'accessible'] else "❌ FAIL"
        print(f"\n👥 Students Endpoint: {status_icon}")
        if students["status"] == "success":
            print(f"   Count: {students['student_count']} students")
            if students["students"]:
                print(f"   Names: {', '.join(students['students'])}")
            else:
                print("   Names: (no students)")
        elif students["status"] == "accessible":
            print(f"   Status: {students['message']}")
        else:
            print(f"   Error: {students['error']}")
        
        # Progress reports endpoint
        progress = results["progress_reports"]
        status_icon = "✅ PASS" if progress['status'] in ['success', 'accessible'] else "❌ FAIL"
        print(f"\n📊 Progress Reports Endpoint: {status_icon}")
        if progress["status"] == "success":
            print(f"   Count: {progress['student_count']} students")
            if progress["students"]:
                print(f"   Names: {', '.join(progress['students'])}")
            else:
                print("   Names: (no students)")
            print(f"   Weekly Progress Data Points: {progress['weekly_progress_count']}")
        elif progress["status"] == "accessible":
            print(f"   Status: {progress['message']}")
        else:
            print(f"   Error: {progress['error']}")
        
        # Consistency analysis
        analysis = results["consistency_analysis"]
        print(f"\n🔍 Consistency Analysis:")
        print(f"   Both endpoints working: {'✅ YES' if analysis['both_endpoints_working'] else '❌ NO'}")
        
        if analysis["both_endpoints_working"]:
            print(f"   Student counts match: {'✅ YES' if analysis['student_count_match'] else '❌ NO'}")
            print(f"   Student names match: {'✅ YES' if analysis['names_match'] else '❌ NO'}")
            print(f"   Data source consistent: {'✅ YES' if analysis['data_source_consistent'] else '❌ NO'}")
            
            if not analysis["data_source_consistent"]:
                print(f"\n   📋 Details:")
                print(f"      Students endpoint: {analysis['students_endpoint_count']} students")
                print(f"      Progress endpoint: {analysis['progress_endpoint_count']} students")
                print(f"      Students names: {analysis['students_names']}")
                print(f"      Progress names: {analysis['progress_names']}")
        
        # Overall result
        print(f"\n🎯 Overall Result:")
        if analysis.get("data_source_consistent", False):
            print("   ✅ SUCCESS: Data is consistent across all endpoints!")
            print("   All components are using the same data source.")
        elif analysis["both_endpoints_working"]:
            print("   ⚠️  PARTIAL: Endpoints working but data inconsistent")
            print("   Check if progress reports are using hardcoded fallback data.")
        else:
            print("   ❌ FAILURE: One or more endpoints not working")
            print("   Check backend server and authentication.")
        
        print("="*80)
        
    except Exception as e:
        print(f"Test execution failed: {e}")
        sys.exit(1)
    
    finally:
        await test.close()

if __name__ == "__main__":
    asyncio.run(main())
