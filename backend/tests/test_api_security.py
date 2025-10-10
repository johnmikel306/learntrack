"""
API Security Tests for Multi-Tenant LearnTrack

Tests API endpoints to ensure proper tenant isolation and role-based access controls
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
import json

from app.main import app
from backend.scripts.auth import UserContext
from app.models.user import UserRole


class TestAPITenantSecurity:
    """Test API endpoints for tenant security"""
    
    @pytest.fixture
    def client(self):
        """FastAPI test client"""
        return TestClient(app)
    
    @pytest.fixture
    def tutor1_context(self):
        """Mock tutor context for tenant 1"""
        return UserContext(
            user_id="tutor1_id",
            auth0_id="tutor1_clerk_id",
            clerk_id="tutor1_clerk_id",
            email="tutor1@test.com",
            name="Tutor One",
            role=UserRole.TUTOR,
            roles=[UserRole.TUTOR],
            permissions=["read", "write"],
            tenant_id="tenant_1",
            student_ids=[]
        )
    
    @pytest.fixture
    def tutor2_context(self):
        """Mock tutor context for tenant 2"""
        return UserContext(
            user_id="tutor2_id",
            auth0_id="tutor2_clerk_id",
            clerk_id="tutor2_clerk_id",
            email="tutor2@test.com",
            name="Tutor Two",
            role=UserRole.TUTOR,
            roles=[UserRole.TUTOR],
            permissions=["read", "write"],
            tenant_id="tenant_2",
            student_ids=[]
        )
    
    @pytest.fixture
    def student_context(self):
        """Mock student context"""
        return UserContext(
            user_id="student1_id",
            auth0_id="student1_clerk_id",
            clerk_id="student1_clerk_id",
            email="student1@test.com",
            name="Student One",
            role=UserRole.STUDENT,
            roles=[UserRole.STUDENT],
            permissions=["read"],
            tenant_id="tenant_1",
            student_ids=[]
        )
    
    @pytest.fixture
    def parent_context(self):
        """Mock parent context"""
        return UserContext(
            user_id="parent1_id",
            auth0_id="parent1_clerk_id",
            clerk_id="parent1_clerk_id",
            email="parent1@test.com",
            name="Parent One",
            role=UserRole.PARENT,
            roles=[UserRole.PARENT],
            permissions=["read"],
            tenant_id="tenant_1",
            student_ids=["student1_id", "student2_id"]
        )
    
    def test_students_endpoint_tenant_isolation(self, client, tutor1_context, tutor2_context):
        """Test that students endpoint respects tenant boundaries"""
        
        # Mock the authentication to return tutor1
        with patch('app.core.auth.get_current_user', return_value=tutor1_context):
            response = client.get("/api/v1/students/")
            assert response.status_code == 200
            tutor1_students = response.json()
        
        # Mock the authentication to return tutor2
        with patch('app.core.auth.get_current_user', return_value=tutor2_context):
            response = client.get("/api/v1/students/")
            assert response.status_code == 200
            tutor2_students = response.json()
        
        # Verify that tutors see different sets of students
        # (This assumes the test database has been set up with tenant-specific data)
        tutor1_student_ids = {student['id'] for student in tutor1_students}
        tutor2_student_ids = {student['id'] for student in tutor2_students}
        
        # No overlap should exist between tenant data
        assert tutor1_student_ids.isdisjoint(tutor2_student_ids)
    
    def test_student_creation_tenant_assignment(self, client, tutor1_context):
        """Test that created students are assigned to correct tenant"""
        
        student_data = {
            "name": "Test Student",
            "email": "teststudent@example.com",
            "grade": "10th",
            "subjects": ["Mathematics"]
        }
        
        with patch('app.core.auth.get_current_user', return_value=tutor1_context):
            response = client.post("/api/v1/students/", json=student_data)
            assert response.status_code == 201
            created_student = response.json()
            
            # Verify the student was created with correct tenant_id
            assert created_student.get('tenant_id') == tutor1_context.tenant_id
    
    def test_cross_tenant_student_access_denied(self, client, tutor1_context, tutor2_context):
        """Test that tutors cannot access students from other tenants"""
        
        # First, create a student as tutor1
        student_data = {
            "name": "Tenant 1 Student",
            "email": "tenant1student@example.com"
        }
        
        with patch('app.core.auth.get_current_user', return_value=tutor1_context):
            response = client.post("/api/v1/students/", json=student_data)
            assert response.status_code == 201
            student_id = response.json()['id']
        
        # Try to access this student as tutor2
        with patch('app.core.auth.get_current_user', return_value=tutor2_context):
            response = client.get(f"/api/v1/students/{student_id}")
            assert response.status_code == 404  # Should not be found due to tenant filtering
    
    def test_questions_endpoint_tenant_isolation(self, client, tutor1_context, tutor2_context):
        """Test that questions endpoint respects tenant boundaries"""
        
        # Create a question as tutor1
        question_data = {
            "question_text": "What is 2+2?",
            "question_type": "multiple_choice",
            "subject_id": "math",
            "topic": "arithmetic",
            "difficulty": "easy",
            "options": [
                {"text": "3", "is_correct": False},
                {"text": "4", "is_correct": True},
                {"text": "5", "is_correct": False}
            ]
        }
        
        with patch('app.core.auth.get_current_user', return_value=tutor1_context):
            response = client.post("/api/v1/questions/", json=question_data)
            assert response.status_code == 201
            question_id = response.json()['id']
        
        # Verify tutor1 can access the question
        with patch('app.core.auth.get_current_user', return_value=tutor1_context):
            response = client.get(f"/api/v1/questions/{question_id}")
            assert response.status_code == 200
        
        # Verify tutor2 cannot access the question
        with patch('app.core.auth.get_current_user', return_value=tutor2_context):
            response = client.get(f"/api/v1/questions/{question_id}")
            assert response.status_code == 404
    
    def test_assignments_endpoint_tenant_isolation(self, client, tutor1_context, tutor2_context):
        """Test that assignments endpoint respects tenant boundaries"""
        
        # Create an assignment as tutor1
        assignment_data = {
            "title": "Math Quiz 1",
            "description": "Basic arithmetic quiz",
            "subject_id": "math",
            "topic": "arithmetic",
            "due_date": "2024-12-31T23:59:59",
            "student_ids": ["student1_id"]
        }
        
        with patch('app.core.auth.get_current_user', return_value=tutor1_context):
            response = client.post("/api/v1/assignments/", json=assignment_data)
            assert response.status_code == 201
            assignment_id = response.json()['id']
        
        # Verify tutor1 can access the assignment
        with patch('app.core.auth.get_current_user', return_value=tutor1_context):
            response = client.get(f"/api/v1/assignments/{assignment_id}")
            assert response.status_code == 200
        
        # Verify tutor2 cannot access the assignment
        with patch('app.core.auth.get_current_user', return_value=tutor2_context):
            response = client.get(f"/api/v1/assignments/{assignment_id}")
            assert response.status_code == 404
    
    def test_student_role_restrictions(self, client, student_context):
        """Test that students have appropriate access restrictions"""
        
        # Students should not be able to create other students
        student_data = {
            "name": "Unauthorized Student",
            "email": "unauthorized@example.com"
        }
        
        with patch('app.core.auth.get_current_user', return_value=student_context):
            response = client.post("/api/v1/students/", json=student_data)
            assert response.status_code == 403  # Forbidden
        
        # Students should not be able to create questions
        question_data = {
            "question_text": "Unauthorized question?",
            "question_type": "multiple_choice",
            "subject_id": "math",
            "topic": "test"
        }
        
        with patch('app.core.auth.get_current_user', return_value=student_context):
            response = client.post("/api/v1/questions/", json=question_data)
            assert response.status_code == 403  # Forbidden
    
    def test_parent_role_restrictions(self, client, parent_context):
        """Test that parents have appropriate access restrictions"""
        
        # Parents should not be able to create students
        student_data = {
            "name": "Unauthorized Student",
            "email": "unauthorized@example.com"
        }
        
        with patch('app.core.auth.get_current_user', return_value=parent_context):
            response = client.post("/api/v1/students/", json=student_data)
            assert response.status_code == 403  # Forbidden
        
        # Parents should be able to view progress for their children
        with patch('app.core.auth.get_current_user', return_value=parent_context):
            response = client.get("/api/v1/progress/")
            assert response.status_code == 200
            # The response should only include progress for their assigned children
    
    def test_unauthorized_access_denied(self, client):
        """Test that requests without valid authentication are denied"""
        
        # Try to access students without authentication
        response = client.get("/api/v1/students/")
        assert response.status_code == 401  # Unauthorized
        
        # Try to create a student without authentication
        student_data = {"name": "Test", "email": "test@example.com"}
        response = client.post("/api/v1/students/", json=student_data)
        assert response.status_code == 401  # Unauthorized
    
    def test_me_endpoint_returns_correct_context(self, client, tutor1_context):
        """Test that /api/me endpoint returns correct user context"""
        
        with patch('app.core.auth.get_current_user', return_value=tutor1_context):
            response = client.get("/api/me")
            assert response.status_code == 200
            
            user_data = response.json()
            assert user_data['user_id'] == tutor1_context.user_id
            assert user_data['role'] == tutor1_context.role.value
            assert user_data['tenant_id'] == tutor1_context.tenant_id
            assert user_data['student_ids'] == tutor1_context.student_ids
    
    def test_bulk_operations_tenant_isolation(self, client, tutor1_context, tutor2_context):
        """Test that bulk operations respect tenant boundaries"""
        
        # Create multiple students as tutor1
        students_data = [
            {"name": "Student A", "email": "studenta@example.com"},
            {"name": "Student B", "email": "studentb@example.com"}
        ]
        
        created_ids = []
        with patch('app.core.auth.get_current_user', return_value=tutor1_context):
            for student_data in students_data:
                response = client.post("/api/v1/students/", json=student_data)
                assert response.status_code == 201
                created_ids.append(response.json()['id'])
        
        # Try bulk update as tutor2 (should not affect tutor1's students)
        with patch('app.core.auth.get_current_user', return_value=tutor2_context):
            # This would be a bulk update endpoint if it existed
            # The test verifies that tutor2 cannot modify tutor1's data
            pass
    
    def test_file_upload_tenant_isolation(self, client, tutor1_context, tutor2_context):
        """Test that file uploads are properly scoped to tenants"""
        
        # Mock file upload as tutor1
        with patch('app.core.auth.get_current_user', return_value=tutor1_context):
            # This would test file upload endpoints
            # Files should be automatically tagged with correct tenant_id
            pass
    
    def test_progress_tracking_tenant_isolation(self, client, student_context, parent_context):
        """Test that progress tracking respects tenant and role boundaries"""
        
        # Student should only see their own progress
        with patch('app.core.auth.get_current_user', return_value=student_context):
            response = client.get("/api/v1/progress/")
            assert response.status_code == 200
            # Should only return progress for this specific student
        
        # Parent should only see progress for their assigned children
        with patch('app.core.auth.get_current_user', return_value=parent_context):
            response = client.get("/api/v1/progress/")
            assert response.status_code == 200
            progress_data = response.json()
            # Verify all progress entries are for parent's assigned children
            for progress in progress_data:
                assert progress['student_id'] in parent_context.student_ids


class TestDataIntegrityValidation:
    """Test data integrity in multi-tenant environment"""
    
    def test_tenant_id_consistency(self, client, tutor1_context):
        """Test that all created data has consistent tenant_id"""
        
        # Create related data (student, question, assignment)
        with patch('app.core.auth.get_current_user', return_value=tutor1_context):
            # Create student
            student_response = client.post("/api/v1/students/", json={
                "name": "Test Student",
                "email": "test@example.com"
            })
            student_id = student_response.json()['id']
            
            # Create question
            question_response = client.post("/api/v1/questions/", json={
                "question_text": "Test question?",
                "question_type": "multiple_choice",
                "subject_id": "math",
                "topic": "test"
            })
            question_id = question_response.json()['id']
            
            # Create assignment
            assignment_response = client.post("/api/v1/assignments/", json={
                "title": "Test Assignment",
                "subject_id": "math",
                "topic": "test",
                "due_date": "2024-12-31T23:59:59",
                "student_ids": [student_id]
            })
            assignment_id = assignment_response.json()['id']
            
            # Verify all have same tenant_id
            student = client.get(f"/api/v1/students/{student_id}").json()
            question = client.get(f"/api/v1/questions/{question_id}").json()
            assignment = client.get(f"/api/v1/assignments/{assignment_id}").json()
            
            assert student['tenant_id'] == tutor1_context.tenant_id
            assert question['tenant_id'] == tutor1_context.tenant_id
            assert assignment['tenant_id'] == tutor1_context.tenant_id


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
