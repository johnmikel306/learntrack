#!/usr/bin/env python3
"""
Test script to verify authentication and data isolation by tutor_id
"""
import asyncio
import sys
import os
from datetime import datetime
from typing import List, Dict, Any

# Add the backend directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.core.enhanced_auth import ClerkUserContext
from app.models.user import UserRole
from app.models.student import StudentCreate
from app.services.student_service import StudentService
import structlog

logger = structlog.get_logger()

class AuthenticationIsolationTest:
    """Test class for authentication and data isolation"""
    
    def __init__(self):
        self.client = None
        self.db = None
        
    async def connect(self):
        """Connect to MongoDB"""
        try:
            self.client = AsyncIOMotorClient(settings.MONGODB_URL)
            self.db = self.client[settings.DATABASE_NAME]
            logger.info("Connected to MongoDB", database=settings.DATABASE_NAME)
        except Exception as e:
            logger.error("Failed to connect to MongoDB", error=str(e))
            raise
    
    async def disconnect(self):
        """Disconnect from MongoDB"""
        if self.client:
            self.client.close()
            logger.info("Disconnected from MongoDB")
    
    def create_mock_tutor(self, tutor_id: str, name: str) -> ClerkUserContext:
        """Create a mock tutor user context"""
        return ClerkUserContext(
            user_id=tutor_id,
            clerk_id=tutor_id,
            email=f"{tutor_id}@test.com",
            name=name,
            role=UserRole.TUTOR,
            roles=[UserRole.TUTOR],
            permissions=["read", "write", "create", "delete", "manage_students"],
            tutor_id=tutor_id,  # Tutors use their own clerk_id as tutor_id
            student_ids=[]
        )
    
    def create_mock_parent(self, parent_id: str, name: str, tutor_id: str, student_ids: List[str]) -> ClerkUserContext:
        """Create a mock parent user context"""
        return ClerkUserContext(
            user_id=parent_id,
            clerk_id=parent_id,
            email=f"{parent_id}@test.com",
            name=name,
            role=UserRole.PARENT,
            roles=[UserRole.PARENT],
            permissions=["read", "view_children"],
            tutor_id=tutor_id,  # Parents belong to a tutor's tenant
            student_ids=student_ids
        )
    
    async def test_student_creation_isolation(self) -> Dict[str, Any]:
        """Test that students are created with correct tutor_id and isolated properly"""
        logger.info("Testing student creation and isolation")
        
        # Create two mock tutors
        tutor1 = self.create_mock_tutor("tutor_1", "Tutor One")
        tutor2 = self.create_mock_tutor("tutor_2", "Tutor Two")
        
        student_service = StudentService(self.db)
        
        # Create students for each tutor
        student1_data = StudentCreate(
            name="Student One",
            email="student1@test.com",
            phone="123-456-7890",
            grade="10",
            subjects=["Math", "Science"],
            parentEmail="parent1@test.com",
            parentPhone="123-456-7891",
            notes="Test student 1",
            tutor_id="placeholder"  # This should be overridden by the service
        )
        
        student2_data = StudentCreate(
            name="Student Two", 
            email="student2@test.com",
            phone="123-456-7892",
            grade="11",
            subjects=["English", "History"],
            parentEmail="parent2@test.com",
            parentPhone="123-456-7893",
            notes="Test student 2",
            tutor_id="placeholder"  # This should be overridden by the service
        )
        
        try:
            # Create students
            student1 = await student_service.create_student(student1_data, tutor1)
            student2 = await student_service.create_student(student2_data, tutor2)
            
            # Verify tutor_id was set correctly
            assert student1.tutor_id == tutor1.clerk_id, f"Student1 tutor_id mismatch: {student1.tutor_id} != {tutor1.clerk_id}"
            assert student2.tutor_id == tutor2.clerk_id, f"Student2 tutor_id mismatch: {student2.tutor_id} != {tutor2.clerk_id}"
            
            # Test isolation: tutor1 should only see their student
            tutor1_students = await student_service.list_students(limit=100, current_user=tutor1)
            tutor1_student_ids = [s.id for s in tutor1_students]
            
            # Test isolation: tutor2 should only see their student  
            tutor2_students = await student_service.list_students(limit=100, current_user=tutor2)
            tutor2_student_ids = [s.id for s in tutor2_students]
            
            # Verify isolation
            assert student1.id in tutor1_student_ids, "Tutor1 cannot see their own student"
            assert student2.id not in tutor1_student_ids, "Tutor1 can see tutor2's student (isolation broken)"
            
            assert student2.id in tutor2_student_ids, "Tutor2 cannot see their own student"
            assert student1.id not in tutor2_student_ids, "Tutor2 can see tutor1's student (isolation broken)"
            
            # Test get_student isolation
            try:
                # Tutor1 should be able to get their student
                retrieved_student1 = await student_service.get_student(student1.id, tutor1)
                assert retrieved_student1.id == student1.id, "Tutor1 cannot retrieve their own student"
                
                # Tutor1 should NOT be able to get tutor2's student
                try:
                    await student_service.get_student(student2.id, tutor1)
                    assert False, "Tutor1 was able to access tutor2's student (isolation broken)"
                except Exception:
                    pass  # Expected - should fail
                
            except Exception as e:
                logger.error("Get student test failed", error=str(e))
                raise
            
            return {
                "status": "success",
                "student1_id": student1.id,
                "student2_id": student2.id,
                "tutor1_students_count": len(tutor1_students),
                "tutor2_students_count": len(tutor2_students),
                "isolation_verified": True
            }
            
        except Exception as e:
            logger.error("Student creation/isolation test failed", error=str(e))
            return {
                "status": "failed",
                "error": str(e)
            }
    
    async def test_parent_access_control(self) -> Dict[str, Any]:
        """Test that parents can only access students they are assigned to"""
        logger.info("Testing parent access control")
        
        try:
            # Create a tutor and students
            tutor = self.create_mock_tutor("tutor_parent_test", "Parent Test Tutor")
            student_service = StudentService(self.db)
            
            # Create two students
            student1_data = StudentCreate(
                name="Student Parent Test 1",
                email="student_parent1@test.com",
                tutor_id="placeholder"
            )
            
            student2_data = StudentCreate(
                name="Student Parent Test 2", 
                email="student_parent2@test.com",
                tutor_id="placeholder"
            )
            
            student1 = await student_service.create_student(student1_data, tutor)
            student2 = await student_service.create_student(student2_data, tutor)
            
            # Create a parent who can only access student1
            parent = self.create_mock_parent(
                "parent_test", 
                "Test Parent", 
                tutor.clerk_id,
                [student1.id]  # Only has access to student1
            )
            
            # Test parent can see assigned student
            parent_students = await student_service.list_students(limit=100, current_user=parent)
            parent_student_ids = [s.id for s in parent_students]
            
            # Verify parent access control
            assert student1.id in parent_student_ids, "Parent cannot see assigned student"
            assert student2.id not in parent_student_ids, "Parent can see non-assigned student (access control broken)"
            
            return {
                "status": "success",
                "parent_students_count": len(parent_students),
                "can_see_assigned": student1.id in parent_student_ids,
                "cannot_see_unassigned": student2.id not in parent_student_ids
            }
            
        except Exception as e:
            logger.error("Parent access control test failed", error=str(e))
            return {
                "status": "failed",
                "error": str(e)
            }
    
    async def cleanup_test_data(self):
        """Clean up test data"""
        logger.info("Cleaning up test data")
        
        try:
            # Remove test students
            await self.db.students.delete_many({
                "email": {"$regex": "@test\\.com$"}
            })
            
            logger.info("Test data cleaned up")
            
        except Exception as e:
            logger.error("Failed to clean up test data", error=str(e))
    
    async def run_all_tests(self) -> Dict[str, Any]:
        """Run all authentication and isolation tests"""
        logger.info("Starting authentication and data isolation tests")
        
        results = {}
        
        try:
            # Clean up any existing test data
            await self.cleanup_test_data()
            
            # Run tests
            results["student_creation_isolation"] = await self.test_student_creation_isolation()
            results["parent_access_control"] = await self.test_parent_access_control()
            
            # Clean up test data
            await self.cleanup_test_data()
            
            return results
            
        except Exception as e:
            logger.error("Test suite failed", error=str(e))
            results["error"] = str(e)
            return results

async def main():
    """Main test function"""
    test_suite = AuthenticationIsolationTest()
    
    try:
        await test_suite.connect()
        
        # Run all tests
        results = await test_suite.run_all_tests()
        
        # Print results
        print("\n" + "="*60)
        print("AUTHENTICATION & ISOLATION TEST RESULTS")
        print("="*60)
        
        for test_name, result in results.items():
            if test_name == "error":
                print(f"\nTest Suite Error: {result}")
                continue
                
            print(f"\nTest: {test_name}")
            print(f"  Status: {result['status']}")
            
            if result["status"] == "success":
                for key, value in result.items():
                    if key != "status":
                        print(f"  {key}: {value}")
            else:
                print(f"  Error: {result.get('error', 'Unknown error')}")
        
        # Overall summary
        successful_tests = sum(1 for r in results.values() if isinstance(r, dict) and r.get("status") == "success")
        total_tests = len([r for r in results.values() if isinstance(r, dict) and "status" in r])
        
        print(f"\nOverall: {successful_tests}/{total_tests} tests passed")
        
        if successful_tests == total_tests:
            print("✓ All tests passed - Authentication and data isolation working correctly!")
        else:
            print("✗ Some tests failed - Check authentication and isolation implementation")
            sys.exit(1)
        
        print("="*60)
        
    except Exception as e:
        logger.error("Test execution failed", error=str(e))
        print(f"Test execution failed: {e}")
        sys.exit(1)
    
    finally:
        await test_suite.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
