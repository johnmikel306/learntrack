
import asyncio
import os
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure, OperationFailure
from bson import ObjectId
import random

# --- Configuration ---
MONGO_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "learntrack_mvp")

# --- Seed Data ---
TUTOR_CLERK_ID = "user_2j5d1oZaP8cE7b6aF4gH3i2kL1m"
TUTOR_EMAIL = "tutor@example.com"
TUTOR_NAME = "Dr. Evelyn Reed"

STUDENTS_DATA = [
    {"clerk_id": "user_1a2b3c4d5e6f7g8h9i0j1k2l3m", "name": "Alice Johnson", "email": "alice@example.com", "grade": "10th"},
    {"clerk_id": "user_2b3c4d5e6f7g8h9i0j1k2l3m4n", "name": "Bob Williams", "email": "bob@example.com", "grade": "11th"},
    {"clerk_id": "user_3c4d5e6f7g8h9i0j1k2l3m4n5o", "name": "Charlie Brown", "email": "charlie@example.com", "grade": "10th"},
]

PARENTS_DATA = [
    {"clerk_id": "user_p1a2b3c4d5e6f7g8h9i0j1k2l", "name": "David Johnson", "email": "d.johnson@example.com"},
    {"clerk_id": "user_p2b3c4d5e6f7g8h9i0j1k2l3", "name": "Mary Williams", "email": "m.williams@example.com"},
]

SUBJECTS_DATA = {
    "Mathematics": ["Algebra", "Geometry", "Calculus"],
    "Science": ["Biology", "Chemistry", "Physics"],
}

async def seed_database():
    """Connects to the database and runs all seeding functions."""
    print(f"Connecting to MongoDB at {MONGO_URL}...")
    try:
        client = AsyncIOMotorClient(MONGO_URL)
        await client.admin.command('ping')
        db = client[DATABASE_NAME]
        print(f"Successfully connected to database '{DATABASE_NAME}'.")
    except ConnectionFailure as e:
        print(f"Error: Could not connect to MongoDB. Details: {e}")
        return

    print("\n--- Starting Database Seeding ---")
    
    await clean_database(db)
    
    tutor = await seed_tutor(db)
    students = await seed_students(db, tutor)
    parents = await seed_parents(db)
    await link_parents_and_students(db, students, parents)
    
    subjects = await seed_subjects(db, tutor)
    await seed_questions(db, tutor, subjects)

    print("\n--- Seeding Complete! ---")
    client.close()

async def clean_database(db):
    """Clears all relevant collections for a fresh start."""
    print("Clearing existing collections...")
    collections_to_clear = ["users", "subjects", "questions"]
    for collection in collections_to_clear:
        await db[collection].delete_many({})
    print("Collections cleared.")

async def seed_tutor(db):
    """Creates the main tutor user."""
    print("Creating tutor...")
    tutor_doc = {
        "clerk_id": TUTOR_CLERK_ID,
        "email": TUTOR_EMAIL,
        "name": TUTOR_NAME,
        "role": "tutor",
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    await db.users.insert_one(tutor_doc)
    print(f"  - Tutor '{TUTOR_NAME}' created.")
    return tutor_doc

async def seed_students(db, tutor):
    """Creates student users with embedded profiles."""
    print("Creating students...")
    students_to_insert = []
    for data in STUDENTS_DATA:
        student_doc = {
            "clerk_id": data["clerk_id"],
            "email": data["email"],
            "name": data["name"],
            "role": "student",
            "is_active": True,
            "tutor_id": tutor["clerk_id"],
            "parent_ids": [],
            "student_profile": {
                "grade": data["grade"],
                "subjects": [],
                "averageScore": round(random.uniform(75, 98), 1),
                "completionRate": round(random.uniform(80, 100), 1),
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        students_to_insert.append(student_doc)
    
    await db.users.insert_many(students_to_insert)
    print(f"  - Created {len(students_to_insert)} students.")
    return students_to_insert

async def seed_parents(db):
    """Creates parent users."""
    print("Creating parents...")
    parents_to_insert = []
    for data in PARENTS_DATA:
        parent_doc = {
            "clerk_id": data["clerk_id"],
            "email": data["email"],
            "name": data["name"],
            "role": "parent",
            "is_active": True,
            "children_ids": [],
            "parent_profile": {
                "phone_number": f"555-01{random.randint(10,99)}",
            },
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        parents_to_insert.append(parent_doc)

    await db.users.insert_many(parents_to_insert)
    print(f"  - Created {len(parents_to_insert)} parents.")
    return parents_to_insert

async def link_parents_and_students(db, students, parents):
    """Links students to parents and vice-versa."""
    print("Linking parents and students...")
    # Link Alice Johnson to David Johnson
    alice_clerk_id = students[0]["clerk_id"]
    david_clerk_id = parents[0]["clerk_id"]
    await db.users.update_one({"clerk_id": alice_clerk_id}, {"$addToSet": {"parent_ids": david_clerk_id}})
    await db.users.update_one({"clerk_id": david_clerk_id}, {"$addToSet": {"children_ids": alice_clerk_id}})
    print(f"  - Linked {students[0]['name']} to {parents[0]['name']}.")

    # Link Bob Williams to Mary Williams
    bob_clerk_id = students[1]["clerk_id"]
    mary_clerk_id = parents[1]["clerk_id"]
    await db.users.update_one({"clerk_id": bob_clerk_id}, {"$addToSet": {"parent_ids": mary_clerk_id}})
    await db.users.update_one({"clerk_id": mary_clerk_id}, {"$addToSet": {"children_ids": bob_clerk_id}})
    print(f"  - Linked {students[1]['name']} to {parents[1]['name']}.")

async def seed_subjects(db, tutor):
    """Creates subjects for the tutor."""
    print("Creating subjects...")
    subjects_to_insert = []
    for name, topics in SUBJECTS_DATA.items():
        subjects_to_insert.append({
            "_id": ObjectId(),
            "name": name,
            "description": f"A comprehensive overview of {name}.",
            "topics": topics,
            "tutor_id": tutor["clerk_id"],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        })
    
    result = await db.subjects.insert_many(subjects_to_insert)
    print(f"  - Created {len(result.inserted_ids)} subjects.")
    # Return the inserted documents with their new _ids
    return await db.subjects.find({"_id": {"$in": result.inserted_ids}}).to_list(length=None)

async def seed_questions(db, tutor, subjects):
    """Generates questions for each subject and topic."""
    print("Generating questions...")
    questions_to_insert = []
    for subject in subjects:
        for topic in subject["topics"]:
            for i in range(5): # 5 questions per topic
                questions_to_insert.append({
                    "question_text": f"This is question {i+1} for the topic '{topic}' in {subject['name']}.",
                    "question_type": "multiple-choice",
                    "subject_id": str(subject["_id"]),
                    "topic": topic,
                    "difficulty": random.choice(["easy", "medium", "hard"]),
                    "points": random.randint(1, 5),
                    "tutor_id": tutor["clerk_id"],
                    "status": "active",
                    "options": [
                        {"text": "Correct Answer", "is_correct": True},
                        {"text": "Wrong Answer 1", "is_correct": False},
                        {"text": "Wrong Answer 2", "is_correct": False},
                    ],
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow(),
                })

    await db.questions.insert_many(questions_to_insert)
    print(f"  - Generated {len(questions_to_insert)} questions.")

if __name__ == "__main__":
    asyncio.run(seed_database())
