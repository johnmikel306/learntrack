"""
Database seeder for LearnTrack development data using the unified user model.
"""
import asyncio
from datetime import datetime
from typing import List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
import random
from bson import ObjectId

from app.models.user import UserRole

class DatabaseSeeder:
    def __init__(self, database: AsyncIOMotorDatabase):
        self.db = database

    async def seed_all(self, clear_existing: bool = True):
        """Seed all collections with development data."""
        print("🌱 Starting database seeding...")
        if clear_existing:
            await self.clear_collections()

        tutor = await self.seed_tutor()
        students = await self.seed_students(tutor)
        parents = await self.seed_parents()
        await self.link_parents_and_students(students, parents)
        subjects = await self.seed_subjects(tutor)
        questions = await self.seed_questions(tutor, subjects)

        print("✅ Database seeding completed!")
        return {
            "users": len(students) + len(parents) + 1,
            "subjects": len(subjects),
            "questions": len(questions),
        }

    async def clear_collections(self):
        """Clear existing data from relevant collections."""
        collections = ["users", "subjects", "questions"]
        for collection in collections:
            await self.db[collection].delete_many({})
            print(f"🗑️  Cleared {collection} collection")

    async def seed_tutor(self) -> Dict[str, Any]:
        """Seed the main tutor."""
        print("👥 Seeding tutor...")
        tutor_doc = {
            "clerk_id": "user_2j5d1oZaP8cE7b6aF4gH3i2kL1m",
            "email": "tutor@example.com",
            "name": "Dr. Evelyn Reed",
            "role": UserRole.TUTOR,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        await self.db.users.insert_one(tutor_doc)
        print("  - Tutor 'Dr. Evelyn Reed' created.")
        return tutor_doc

    async def seed_students(self, tutor: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Seed student users."""
        print("👥 Seeding students...")
        students_data = [
            {"clerk_id": "user_1a2b3c4d5e6f7g8h9i0j1k2l3m", "name": "Alice Johnson", "email": "alice@example.com", "grade": "10th"},
            {"clerk_id": "user_2b3c4d5e6f7g8h9i0j1k2l3m4n", "name": "Bob Williams", "email": "bob@example.com", "grade": "11th"},
        ]
        students_to_insert = []
        for data in students_data:
            students_to_insert.append({
                "clerk_id": data["clerk_id"],
                "email": data["email"],
                "name": data["name"],
                "role": UserRole.STUDENT,
                "is_active": True,
                "tutor_id": tutor["clerk_id"],
                "parent_ids": [],
                "student_profile": {
                    "grade": data["grade"],
                    "subjects": [],
                    "averageScore": round(random.uniform(70, 95), 1),
                    "completionRate": round(random.uniform(80, 100), 1),
                },
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            })
        await self.db.users.insert_many(students_to_insert)
        print(f"  - Created {len(students_to_insert)} students.")
        return students_to_insert

    async def seed_parents(self) -> List[Dict[str, Any]]:
        """Seed parent users."""
        print("👥 Seeding parents...")
        parents_data = [
            {"clerk_id": "user_p1a2b3c4d5e6f7g8h9i0j1k2l", "name": "David Johnson", "email": "d.johnson@example.com"},
        ]
        parents_to_insert = []
        for data in parents_data:
            parents_to_insert.append({
                "clerk_id": data["clerk_id"],
                "email": data["email"],
                "name": data["name"],
                "role": UserRole.PARENT,
                "is_active": True,
                "children_ids": [],
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            })
        await self.db.users.insert_many(parents_to_insert)
        print(f"  - Created {len(parents_to_insert)} parents.")
        return parents_to_insert

    async def link_parents_and_students(self, students: List[Dict[str, Any]], parents: List[Dict[str, Any]]):
        """Link the first student to the first parent."""
        print("🔗 Linking parents and students...")
        if students and parents:
            student_id = students[0]["clerk_id"]
            parent_id = parents[0]["clerk_id"]
            await self.db.users.update_one({"clerk_id": student_id}, {"$addToSet": {"parent_ids": parent_id}})
            await self.db.users.update_one({"clerk_id": parent_id}, {"$addToSet": {"children_ids": student_id}})
            print(f"  - Linked {students[0]['name']} to {parents[0]['name']}.")

    async def seed_subjects(self, tutor: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Seed subjects for the tutor."""
        print("📚 Seeding subjects...")
        subjects_data = {
            "Mathematics": ["Algebra", "Geometry"],
            "Science": ["Biology", "Chemistry"],
        }
        subjects_to_insert = []
        for name, topics in subjects_data.items():
            subjects_to_insert.append({
                "_id": ObjectId(),
                "name": name,
                "description": f"A course on {name}.",
                "topics": topics,
                "tutor_id": tutor["clerk_id"],
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            })
        result = await self.db.subjects.insert_many(subjects_to_insert)
        print(f"  - Created {len(result.inserted_ids)} subjects.")
        return await self.db.subjects.find({"_id": {"$in": result.inserted_ids}}).to_list(length=None)

    async def seed_questions(self, tutor: Dict[str, Any], subjects: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Seed questions for subjects."""
        print("❓ Seeding questions...")
        questions_to_insert = []
        for subject in subjects:
            for topic in subject["topics"]:
                for i in range(3): # 3 questions per topic
                    questions_to_insert.append({
                        "question_text": f"Question {i+1} for {topic}.",
                        "question_type": "multiple-choice",
                        "subject_id": str(subject["_id"]),
                        "topic": topic,
                        "difficulty": "medium",
                        "points": 10,
                        "tutor_id": tutor["clerk_id"],
                        "status": "active",
                        "options": [{"text": "Correct", "is_correct": True}, {"text": "Incorrect", "is_correct": False}],
                        "created_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow(),
                    })
        await self.db.questions.insert_many(questions_to_insert)
        print(f"  - Created {len(questions_to_insert)} questions.")
        return questions_to_insert
