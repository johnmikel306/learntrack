#!/usr/bin/env python3
"""
Database Fix Script for LearnTrack MVP
Fixes data consistency issues identified in the analysis
"""

import asyncio
import motor.motor_asyncio
from datetime import datetime
from bson import ObjectId

async def fix_database_issues():
    """Fix all identified database consistency issues"""
    print("=" * 60)
    print("LEARNTRACK MVP DATABASE FIX SCRIPT")
    print("=" * 60)
    print(f"Started at: {datetime.now()}")
    print()
    
    client = motor.motor_asyncio.AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['learntrack_mvp']
    
    try:
        # Test connection
        await client.admin.command('ping')
        print("✅ Connected to MongoDB successfully")
        print()
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
        return
    
    # Get current user data for reference mapping
    users = await db.users.find().to_list(length=None)
    print(f"📊 Found {len(users)} users in database")
    
    # Create mapping dictionaries
    clerk_id_to_object_id = {user['clerk_id']: user['_id'] for user in users}
    object_id_to_clerk_id = {user['_id']: user['clerk_id'] for user in users}
    tutor_users = [user for user in users if user.get('role') == 'tutor']
    
    print(f"📊 Found {len(tutor_users)} tutors")
    print()
    
    # 1. FIX PROGRESS COLLECTION TUTOR_ID FORMAT
    print("1. FIXING PROGRESS COLLECTION TUTOR_ID FORMAT")
    print("-" * 50)
    
    progress_docs = await db.progress.find().to_list(length=None)
    print(f"Found {len(progress_docs)} progress documents")
    
    if progress_docs:
        # Check current format
        sample_tutor_id = progress_docs[0].get('tutor_id')
        print(f"Current tutor_id format: {type(sample_tutor_id).__name__}")
        
        if isinstance(sample_tutor_id, ObjectId):
            print("Converting ObjectId tutor_id to string clerk_id format...")
            
            fixed_count = 0
            for doc in progress_docs:
                old_tutor_id = doc.get('tutor_id')
                
                # Map ObjectId to clerk_id if possible
                if old_tutor_id in object_id_to_clerk_id:
                    new_tutor_id = object_id_to_clerk_id[old_tutor_id]
                    
                    await db.progress.update_one(
                        {'_id': doc['_id']},
                        {'$set': {'tutor_id': new_tutor_id}}
                    )
                    fixed_count += 1
                else:
                    # If no mapping found, use the first tutor's clerk_id as fallback
                    if tutor_users:
                        fallback_tutor_id = tutor_users[0]['clerk_id']
                        await db.progress.update_one(
                            {'_id': doc['_id']},
                            {'$set': {'tutor_id': fallback_tutor_id}}
                        )
                        fixed_count += 1
                        print(f"  ⚠️  Used fallback tutor_id for progress {doc['_id']}")
            
            print(f"✅ Fixed {fixed_count} progress documents")
        else:
            print("✅ Progress tutor_id format is already correct")
    
    print()
    
    # 2. FIX ASSIGNMENTS CREATED_BY REFERENCES
    print("2. FIXING ASSIGNMENTS CREATED_BY REFERENCES")
    print("-" * 45)
    
    assignments = await db.assignments.find().to_list(length=None)
    print(f"Found {len(assignments)} assignments")
    
    if assignments:
        fixed_assignments = 0
        for assignment in assignments:
            created_by = assignment.get('created_by')
            
            # Check if created_by is a valid user ObjectId
            if created_by not in [user['_id'] for user in users]:
                # Use the first tutor as the creator
                if tutor_users:
                    new_creator = tutor_users[0]['_id']
                    
                    await db.assignments.update_one(
                        {'_id': assignment['_id']},
                        {'$set': {'created_by': new_creator}}
                    )
                    fixed_assignments += 1
        
        print(f"✅ Fixed {fixed_assignments} assignment created_by references")
    
    print()
    
    # 3. FIX STUDENT_GROUPS STUDENT REFERENCES
    print("3. FIXING STUDENT_GROUPS STUDENT REFERENCES")
    print("-" * 45)
    
    student_groups = await db.student_groups.find().to_list(length=None)
    print(f"Found {len(student_groups)} student groups")
    
    student_users = [user for user in users if user.get('role') == 'student']
    student_object_ids = [user['_id'] for user in student_users]
    
    if student_groups:
        fixed_groups = 0
        for group in student_groups:
            student_ids = group.get('studentIds', [])
            
            # Filter out invalid student IDs and keep only valid ones
            valid_student_ids = []
            for student_id in student_ids:
                # Convert string to ObjectId if needed
                try:
                    if isinstance(student_id, str):
                        student_oid = ObjectId(student_id)
                    else:
                        student_oid = student_id
                    
                    if student_oid in student_object_ids:
                        valid_student_ids.append(student_oid)
                except:
                    # Skip invalid ObjectId strings
                    continue
            
            # If no valid students found, add all current students
            if not valid_student_ids and student_object_ids:
                valid_student_ids = student_object_ids
            
            # Update the group with valid student IDs
            if valid_student_ids != student_ids:
                await db.student_groups.update_one(
                    {'_id': group['_id']},
                    {'$set': {'studentIds': valid_student_ids}}
                )
                fixed_groups += 1
        
        print(f"✅ Fixed {fixed_groups} student group references")
    
    print()
    
    # 4. ADD MISSING INDEXES FOR PERFORMANCE
    print("4. ADDING MISSING INDEXES")
    print("-" * 30)
    
    # Add index on notifications.recipient_id
    try:
        await db.notifications.create_index("recipient_id")
        print("✅ Added index on notifications.recipient_id")
    except Exception as e:
        print(f"⚠️  Index on notifications.recipient_id: {e}")
    
    # Add index on student_groups.tutor_id (if not exists)
    try:
        await db.student_groups.create_index("tutor_id")
        print("✅ Added index on student_groups.tutor_id")
    except Exception as e:
        print(f"⚠️  Index on student_groups.tutor_id: {e}")
    
    print()
    
    # 5. VERIFY FIXES
    print("5. VERIFYING FIXES")
    print("-" * 20)
    
    # Verify progress collection
    progress_with_valid_tutor = await db.progress.count_documents({
        "tutor_id": {"$in": [user['clerk_id'] for user in tutor_users]}
    })
    total_progress = await db.progress.count_documents({})
    print(f"Progress with valid tutor_id: {progress_with_valid_tutor}/{total_progress}")
    
    # Verify assignments
    assignments_with_valid_creator = await db.assignments.count_documents({
        "created_by": {"$in": [user['_id'] for user in users]}
    })
    total_assignments = await db.assignments.count_documents({})
    print(f"Assignments with valid created_by: {assignments_with_valid_creator}/{total_assignments}")
    
    print()
    print("=" * 60)
    print("DATABASE FIX COMPLETE")
    print("=" * 60)
    print(f"Completed at: {datetime.now()}")

if __name__ == "__main__":
    asyncio.run(fix_database_issues())
