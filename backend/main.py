"""
LearnTrack FastAPI Backend
Main application entry point
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import routers
from routers import auth, users, questions, assignments, submissions, progress, notifications

# Create FastAPI app
app = FastAPI(
    title="LearnTrack API",
    description="Smart Assignment & Progress Monitoring API for Tutors, Students, and Parents",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://your-frontend-domain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(questions.router, prefix="/api/questions", tags=["Questions"])
app.include_router(assignments.router, prefix="/api/assignments", tags=["Assignments"])
app.include_router(submissions.router, prefix="/api/submissions", tags=["Submissions"])
app.include_router(progress.router, prefix="/api/progress", tags=["Progress"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to LearnTrack API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "LearnTrack API"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=True
    )
