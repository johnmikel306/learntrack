"""
Centralized constants for the backend application.
"""
from enum import Enum

class UserRole(str, Enum):
    TUTOR = "tutor"
    STUDENT = "student"
    PARENT = "parent"
    ADMIN = "admin"

class CollectionNames(str, Enum):
    TUTORS = "tutors"
    STUDENTS = "students"
    PARENTS = "parents"
    USERS = "users"  # For admin users
    QUESTIONS = "questions"
    ASSIGNMENTS = "assignments"
    SUBJECTS = "subjects"

class QuestionStatus(str, Enum):
    ACTIVE = "active"
    PENDING = "pending"
    REJECTED = "rejected"
    DELETED = "deleted"
    ARCHIVED = "archived"

class AssignmentStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"

# Common string literals
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100
