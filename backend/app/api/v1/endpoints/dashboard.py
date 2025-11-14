"""
Dashboard data endpoints
"""
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
import structlog
from datetime import datetime

from app.core.database import get_database
from app.core.enhanced_auth import require_tutor, require_authenticated_user, ClerkUserContext
from pydantic import BaseModel

logger = structlog.get_logger()
router = APIRouter()


class DashboardStats(BaseModel):
    """Dashboard statistics response"""
    total_students: int
    active_assignments: int
    avg_performance: float
    engagement_rate: float
    top_performers: List[Dict[str, Any]]
    performance_data: List[Dict[str, Any]]
    recent_activity: List[Dict[str, Any]]
    upcoming_deadlines: List[Dict[str, Any]]


class TopPerformer(BaseModel):
    """Top performer data"""
    name: str
    subject: str
    score: float
    trend: str
    avatar: str


class SubjectPerformance(BaseModel):
    """Subject performance data"""
    subject: str
    avgScore: float
    completionRate: float


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: ClerkUserContext = Depends(require_tutor),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get dashboard statistics for tutor - calculated in real-time from actual data"""
    try:
        # Calculate real-time stats from actual data

        # 1. Count total students for this tutor from students collection
        total_students = await database.students.count_documents({
            "tutor_id": current_user.clerk_id,
            "is_active": True
        })

        # 2. Count active assignments (assignments with status "active" or "published")
        active_assignments = await database.assignments.count_documents({
            "tutor_id": current_user.clerk_id,
            "status": {"$in": ["active", "published"]}
        })

        # 3. Calculate average performance from student submissions
        # Get all submissions for this tutor's assignments
        pipeline = [
            {
                "$match": {
                    "tutor_id": current_user.clerk_id
                }
            },
            {
                "$group": {
                    "_id": None,
                    "avg_score": {"$avg": "$score"}
                }
            }
        ]

        avg_result = await database.submissions.aggregate(pipeline).to_list(length=1)
        avg_performance = round(avg_result[0]["avg_score"], 1) if avg_result and avg_result[0].get("avg_score") else 0.0

        # 4. Calculate engagement rate (students who submitted in last 7 days / total students)
        from datetime import datetime, timedelta, timezone
        seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)

        active_students = await database.submissions.distinct(
            "student_id",
            {
                "tutor_id": current_user.clerk_id,
                "submitted_at": {"$gte": seven_days_ago}
            }
        )

        engagement_rate = round((len(active_students) / total_students * 100), 1) if total_students > 0 else 0.0

        # Return calculated stats
        return DashboardStats(
            total_students=total_students,
            active_assignments=active_assignments,
            avg_performance=avg_performance,
            engagement_rate=engagement_rate,
            top_performers=[],  # Fetched separately via /top-performers endpoint
            performance_data=[],  # Fetched separately via /performance-chart endpoint
            recent_activity=[],  # Fetched separately via /recent-activity endpoint
            upcoming_deadlines=[]  # Fetched separately via /upcoming-deadlines endpoint
        )
    except Exception as e:
        logger.error("Failed to get dashboard stats", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to get dashboard stats: {str(e)}")


@router.get("/top-performers", response_model=List[TopPerformer])
async def get_top_performers(
    current_user: ClerkUserContext = Depends(require_tutor),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get top performing students - calculated from real submissions"""
    try:
        # Calculate top performers from actual submission data
        pipeline = [
            {
                "$match": {
                    "tutor_id": current_user.clerk_id
                }
            },
            {
                "$group": {
                    "_id": "$student_id",
                    "avg_score": {"$avg": "$score"},
                    "total_submissions": {"$sum": 1}
                }
            },
            {
                "$sort": {"avg_score": -1}
            },
            {
                "$limit": 4
            }
        ]

        top_students = await database.submissions.aggregate(pipeline).to_list(length=4)

        # If no real data, return empty list
        if not top_students:
            return []

        # Fetch student details and format response from students collection
        performers = []
        for student_data in top_students:
            student = await database.students.find_one({"clerk_id": student_data["_id"]})
            if student:
                performers.append(TopPerformer(
                    name=student.get("name", "Unknown"),
                    subject="General",  # Can be enhanced to get actual subject
                    score=round(student_data["avg_score"], 1),
                    trend="up" if student_data["avg_score"] >= 90 else "down",
                    avatar=student.get("name", "U")[:2].upper()
                ))

        return performers if performers else []

    except Exception as e:
        logger.error("Failed to get top performers", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to get top performers: {str(e)}")


@router.get("/subject-performance", response_model=List[SubjectPerformance])
async def get_subject_performance(
    current_user: ClerkUserContext = Depends(require_tutor),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get subject performance data calculated from real submissions"""
    try:
        # Get all subjects for this tutor
        subjects = await database.subjects.find({"tutor_id": current_user.clerk_id}).to_list(length=100)

        subject_performance = []
        for subject in subjects:
            subject_id = str(subject.get("_id"))

            # Calculate average score from submissions for this subject
            pipeline = [
                {
                    "$match": {
                        "tutor_id": current_user.clerk_id,
                        "subject_id": subject_id
                    }
                },
                {
                    "$group": {
                        "_id": None,
                        "avg_score": {"$avg": "$score"},
                        "total_submissions": {"$sum": 1}
                    }
                }
            ]

            result = await database.submissions.aggregate(pipeline).to_list(length=1)

            if result and result[0].get("avg_score"):
                avg_score = round(result[0]["avg_score"], 1)
                # Calculate completion rate based on submissions vs assignments
                total_assignments = await database.assignments.count_documents({
                    "tutor_id": current_user.clerk_id,
                    "subject_id": subject_id
                })
                completion_rate = round((result[0]["total_submissions"] / max(total_assignments, 1)) * 100, 1)
            else:
                avg_score = 0.0
                completion_rate = 0.0

            subject_performance.append({
                "subject": subject["name"],
                "avgScore": avg_score,
                "completionRate": min(completion_rate, 100.0)  # Cap at 100%
            })

        return subject_performance
    except Exception as e:
        logger.error("Failed to get subject performance", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to get subject performance: {str(e)}")


@router.get("/recent-activity")
async def get_recent_activity(
    current_user: ClerkUserContext = Depends(require_tutor),
    database: AsyncIOMotorDatabase = Depends(get_database),
    limit: int = 10
):
    """Get recent student activity from database"""
    try:
        # Fetch from recent_activity collection
        activities = await database.recent_activity.find(
            {"tutor_id": current_user.clerk_id}
        ).sort("created_at", -1).limit(limit).to_list(length=limit)

        # Remove MongoDB _id field
        for activity in activities:
            activity.pop("_id", None)

        return activities
    except Exception as e:
        logger.error("Failed to get recent activity", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to get recent activity: {str(e)}")


@router.get("/upcoming-deadlines")
async def get_upcoming_deadlines(
    current_user: ClerkUserContext = Depends(require_tutor),
    database: AsyncIOMotorDatabase = Depends(get_database),
    limit: int = 10
):
    """Calculate upcoming assignment deadlines dynamically with relative dates"""
    try:
        from datetime import datetime, timedelta, timezone

        # Get current date in UTC (timezone-aware)
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

        # Get assignments with upcoming due dates (including today's assignments)
        assignments = await database.assignments.find({
            "tutor_id": current_user.clerk_id,
            "due_date": {"$gte": today_start},  # Include assignments from start of today
            "status": {"$in": ["active", "published"]}
        }).sort("due_date", 1).limit(limit).to_list(length=limit)

        deadlines = []
        for assignment in assignments:
            due_date = assignment.get("due_date")
            if not due_date:
                continue

            # Make due_date timezone-aware if it isn't already
            if due_date.tzinfo is None:
                due_date = due_date.replace(tzinfo=timezone.utc)

            # Calculate relative date label
            due_date_start = due_date.replace(hour=0, minute=0, second=0, microsecond=0)
            days_until = (due_date_start - today_start).days

            if days_until == 0:
                date_label = "Today"
                urgency = "high"
            elif days_until == 1:
                date_label = "Tomorrow"
                urgency = "high"
            elif days_until <= 7:
                date_label = due_date.strftime("%b %d")  # e.g., "Dec 28"
                urgency = "medium"
            else:
                date_label = due_date.strftime("%b %d")
                urgency = "low"

            # Get subject name
            subject_id = assignment.get("subject_id")
            subject = await database.subjects.find_one({"_id": subject_id}) if subject_id else None
            subject_name = subject.get("name", "Unknown") if subject else "Unknown"

            # Count submissions vs expected
            submission_count = await database.submissions.count_documents({
                "assignment_id": str(assignment.get("_id")),
                "tutor_id": current_user.clerk_id
            })

            # Get total students for this tutor from students collection
            total_students = await database.students.count_documents({
                "tutor_id": current_user.clerk_id,
                "is_active": True
            })

            deadlines.append({
                "title": assignment.get("title", "Untitled Assignment"),
                "subject": subject_name,
                "dueDate": date_label,
                "urgency": urgency,
                "completed": submission_count,
                "total": total_students,
                "due_date_iso": due_date.isoformat()  # For sorting/filtering on frontend
            })

        return deadlines
    except Exception as e:
        logger.error("Failed to calculate upcoming deadlines", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to calculate upcoming deadlines: {str(e)}")


@router.get("/performance-chart")
async def get_performance_chart(
    current_user: ClerkUserContext = Depends(require_tutor),
    database: AsyncIOMotorDatabase = Depends(get_database),
    days: int = 30
):
    """Calculate performance chart data dynamically from submissions"""
    try:
        from datetime import datetime, timedelta

        # Calculate date range (last 30 days)
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)

        # Get all subjects for this tutor
        subjects = await database.subjects.find({"tutor_id": current_user.clerk_id}).to_list(length=100)
        subject_map = {str(s.get("_id")): s.get("name", "Unknown") for s in subjects}

        # Aggregate submissions by date and subject
        pipeline = [
            {
                "$match": {
                    "tutor_id": current_user.clerk_id,
                    "submitted_at": {"$gte": start_date, "$lte": end_date}
                }
            },
            {
                "$group": {
                    "_id": {
                        "date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$submitted_at"}},
                        "subject_id": "$subject_id"
                    },
                    "avg_score": {"$avg": "$score"}
                }
            },
            {
                "$sort": {"_id.date": 1}
            }
        ]

        results = await database.submissions.aggregate(pipeline).to_list(length=1000)

        # Group by date
        date_map = {}
        for result in results:
            date = result["_id"]["date"]
            subject_id = result["_id"]["subject_id"]
            subject_name = subject_map.get(subject_id, "Unknown").lower().replace(" ", "_")
            avg_score = round(result["avg_score"], 1)

            if date not in date_map:
                date_map[date] = {"day": date[-2:]}  # Get day from YYYY-MM-DD

            date_map[date][subject_name] = avg_score

        # Convert to list and fill missing days with interpolated values
        chart_data = list(date_map.values())

        return chart_data
    except Exception as e:
        logger.error("Failed to calculate performance chart data", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to calculate performance chart data: {str(e)}")


@router.get("/progress-chart")
async def get_progress_chart(
    current_user: ClerkUserContext = Depends(require_tutor),
    database: AsyncIOMotorDatabase = Depends(get_database),
    days: int = 30
):
    """Calculate weekly assignment progress chart data dynamically from assignments and submissions"""
    try:
        from datetime import datetime, timedelta, timezone

        # Calculate date range
        end_date = datetime.now(timezone.utc)
        start_date = end_date - timedelta(days=days)

        # Get all subjects for this tutor
        subjects = await database.subjects.find({"tutor_id": current_user.clerk_id}).to_list(length=100)
        subject_map = {str(s.get("_id")): s.get("name", "Unknown") for s in subjects}

        # Calculate completion rate by date and subject
        # Get assignments created in the date range
        assignments = await database.assignments.find({
            "tutor_id": current_user.clerk_id,
            "created_at": {"$gte": start_date, "$lte": end_date}
        }).to_list(length=1000)

        # Group by date and subject
        date_map = {}
        for assignment in assignments:
            created_date = assignment.get("created_at")
            if not created_date:
                continue

            date_str = created_date.strftime("%Y-%m-%d")
            subject_id = assignment.get("subject_id")
            subject_name = subject_map.get(subject_id, "Unknown").lower().replace(" ", "_")

            # Count submissions for this assignment
            submission_count = await database.submissions.count_documents({
                "assignment_id": str(assignment.get("_id")),
                "tutor_id": current_user.clerk_id
            })

            # Calculate completion rate (assuming 10 students per assignment as baseline)
            expected_submissions = 10
            completion_rate = min((submission_count / expected_submissions) * 100, 100)

            if date_str not in date_map:
                date_map[date_str] = {"day": date_str[-2:]}

            # Average if multiple assignments on same day
            if subject_name in date_map[date_str]:
                date_map[date_str][subject_name] = (date_map[date_str][subject_name] + completion_rate) / 2
            else:
                date_map[date_str][subject_name] = round(completion_rate, 1)

        chart_data = list(date_map.values())

        return chart_data
    except Exception as e:
        logger.error("Failed to calculate progress chart data", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to calculate progress chart data: {str(e)}")


@router.get("/student-stats")
async def get_student_dashboard_stats(
    current_user: ClerkUserContext = Depends(require_authenticated_user),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get dashboard statistics for student"""
    try:
        # Get student's assignments
        assignments = await database.assignments.find({
            "student_ids": current_user.clerk_id
        }).to_list(length=100)
        
        # Get student's progress
        progress_records = await database.progress.find({
            "student_id": current_user.clerk_id
        }).to_list(length=100)
        
        # Calculate stats
        total_assignments = len(assignments)
        completed = len([p for p in progress_records if p.get("status") == "completed"])
        pending = total_assignments - completed
        
        # Calculate average score
        completed_scores = [p.get("score", 0) for p in progress_records if p.get("status") == "completed" and p.get("score")]
        avg_score = round(sum(completed_scores) / len(completed_scores), 1) if completed_scores else 0
        
        return {
            "total_assignments": total_assignments,
            "completed": completed,
            "pending": pending,
            "overall_average": avg_score,
            "current_grade": "A" if avg_score >= 90 else "B+" if avg_score >= 85 else "B" if avg_score >= 80 else "C"
        }
    except Exception as e:
        logger.error("Failed to get student dashboard stats", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to get student dashboard stats: {str(e)}")


@router.get("/parent-stats")
async def get_parent_dashboard_stats(
    current_user: ClerkUserContext = Depends(require_authenticated_user),
    database: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get dashboard statistics for parent"""
    try:
        # Get parent's children from parents collection
        parent = await database.parents.find_one({"clerk_id": current_user.clerk_id})

        if not parent:
            return {"children": []}

        child_ids = parent.get("parent_children", [])

        # Get children data from students collection
        children = []
        for child_id in child_ids:
            child = await database.students.find_one({"clerk_id": child_id})
            if child:
                # Get child's progress
                progress_records = await database.progress.find({
                    "student_id": child_id
                }).to_list(length=100)
                
                completed_scores = [p.get("score", 0) for p in progress_records if p.get("status") == "completed" and p.get("score")]
                avg_score = round(sum(completed_scores) / len(completed_scores), 1) if completed_scores else 0
                
                children.append({
                    "id": child_id,
                    "name": child.get("name", "Unknown"),
                    "grade": child.get("student_profile", {}).get("grade", "N/A"),
                    "overall_progress": avg_score,
                    "recent_grade": "A" if avg_score >= 90 else "B+" if avg_score >= 85 else "B",
                    "assignments_due": len([p for p in progress_records if p.get("status") == "in_progress"])
                })
        
        return {"children": children}
    except Exception as e:
        logger.error("Failed to get parent dashboard stats", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to get parent dashboard stats: {str(e)}")

