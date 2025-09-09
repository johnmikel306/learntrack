"""
API v1 router
"""
from fastapi import APIRouter

# Import working endpoints
from app.api.v1.endpoints import questions, assignments, seeders, subjects, students, progress
# Still disabled due to formatting issues: settings, files, communications

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(questions.router, prefix="/questions", tags=["questions"])
api_router.include_router(assignments.router, prefix="/assignments", tags=["assignments"])
api_router.include_router(subjects.router, prefix="/subjects", tags=["subjects"])
api_router.include_router(students.router, prefix="/students", tags=["students"])
api_router.include_router(seeders.router, prefix="/seeders", tags=["seeders"])
api_router.include_router(progress.router, prefix="/progress", tags=["progress"])

# Still disabled due to formatting issues:
# api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
# api_router.include_router(files.router, prefix="/files", tags=["files"])
# api_router.include_router(communications.router, prefix="/communications", tags=["communications"])
