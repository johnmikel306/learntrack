#!/usr/bin/env python3
"""
Detailed Data Analysis for LearnTrack MVP
Focus on data consistency and migration issues
"""

import asyncio
import motor.motor_asyncio
from datetime import datetime
import json

async def detailed_analysis():
    """Perform detailed data consistency analysis"""
    print("=" * 60)
    print("DETAILED DATA CONSISTENCY ANALYSIS")
    print("=" * 60)
    
    client = motor.motor_asyncio.AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['learntrack_mvp']
    
    # 1. EXAMINE USER DATA IN DETAIL
    print("1. USER DATA DETAILED ANALYSIS")
    print("-" * 35)
    
    users = await db.users.find().to_list(length=None)
    print(f"Total users: {len(users)}")
    
    for user in users:
        print(f"\nUser ID: {user['_id']}")
        print(f"  Name: {user.get('name', 'N/A')}")
        print(f"  Email: {user.get('email', 'N/A')}")
        print(f"  Role: {user.get('role', 'N/A')}")
        print(f"  Clerk ID: {user.get('clerk_id', 'N/A')}")
        print(f"  Auth0 ID: {user.get('auth0_id', 'N/A')}")
        print(f"  Tutor ID: {user.get('tutor_id', 'N/A')}")
        print(f"  Active: {user.get('is_active', 'N/A')}")
        
        if user.get('student_profile'):
            profile = user['student_profile']
            print(f"  Student Profile:")
            print(f"    Grade: {profile.get('grade', 'N/A')}")
            print(f"    Avg Score: {profile.get('averageScore', 'N/A')}")
            print(f"    Completion Rate: {profile.get('completionRate', 'N/A')}")
    
    # 2. EXAMINE PROGRESS DATA ISSUES
    print("\n\n2. PROGRESS DATA ANALYSIS")
    print("-" * 30)
    
    progress_docs = await db.progress.find().to_list(length=None)
    print(f"Total progress documents: {len(progress_docs)}")
    
    # Check tutor_id references in progress
    tutor_ids_in_users = [user['clerk_id'] for user in users if user.get('role') == 'tutor']
    print(f"Valid tutor IDs from users: {tutor_ids_in_users}")
    
    progress_tutor_ids = list(set([str(doc.get('tutor_id', '')) for doc in progress_docs]))
    print(f"Tutor IDs in progress collection: {progress_tutor_ids}")
    
    # Check for ObjectId vs string inconsistencies
    print("\nProgress document tutor_id types:")
    for doc in progress_docs[:5]:  # Sample first 5
        tutor_id = doc.get('tutor_id')
        tutor_id_type = type(tutor_id).__name__
        print(f"  Progress {doc['_id']}: tutor_id = {tutor_id} (type: {tutor_id_type})")
    
    # 3. EXAMINE STUDENT GROUPS
    print("\n\n3. STUDENT GROUPS ANALYSIS")
    print("-" * 30)
    
    groups = await db.student_groups.find().to_list(length=None)
    print(f"Total student groups: {len(groups)}")
    
    for group in groups:
        print(f"\nGroup: {group.get('name', 'N/A')}")
        print(f"  ID: {group['_id']}")
        print(f"  Tutor ID: {group.get('tutor_id', 'N/A')}")
        print(f"  Student IDs: {group.get('studentIds', [])}")
        print(f"  Subjects: {group.get('subjects', [])}")
    
    # 4. EXAMINE ASSIGNMENTS
    print("\n\n4. ASSIGNMENTS ANALYSIS")
    print("-" * 25)
    
    assignments = await db.assignments.find().to_list(length=None)
    print(f"Total assignments: {len(assignments)}")
    
    for assignment in assignments[:3]:  # Sample first 3
        print(f"\nAssignment: {assignment.get('title', 'N/A')}")
        print(f"  ID: {assignment['_id']}")
        print(f"  Created by: {assignment.get('created_by', 'N/A')}")
        print(f"  Assigned to: {assignment.get('assigned_to', [])}")
        print(f"  Subject: {assignment.get('subject', 'N/A')}")
        print(f"  Status: {assignment.get('status', 'N/A')}")
    
    # 5. CHECK FOR ORPHANED DATA
    print("\n\n5. ORPHANED DATA ANALYSIS")
    print("-" * 30)
    
    # Check for assignments with invalid created_by references
    user_object_ids = [user['_id'] for user in users]
    
    orphaned_assignments = 0
    for assignment in assignments:
        created_by = assignment.get('created_by')
        if created_by and created_by not in user_object_ids:
            orphaned_assignments += 1
    
    print(f"Assignments with invalid created_by: {orphaned_assignments}")
    
    # 6. MIGRATION STATUS CHECK
    print("\n\n6. MIGRATION STATUS CHECK")
    print("-" * 30)
    
    # Check for any remaining auth0_id references
    collections_to_check = ['users', 'assignments', 'subjects', 'questions', 'progress']
    
    for collection_name in collections_to_check:
        if collection_name in await db.list_collection_names():
            collection = db[collection_name]
            
            # Check for auth0_id fields
            auth0_docs = await collection.count_documents({"auth0_id": {"$exists": True, "$ne": None}})
            
            # Check for tenant_id fields (should be migrated to tutor_id)
            tenant_id_docs = await collection.count_documents({"tenant_id": {"$exists": True}})
            
            print(f"{collection_name}:")
            print(f"  Documents with auth0_id: {auth0_docs}")
            print(f"  Documents with tenant_id: {tenant_id_docs}")
    
    print("\n" + "=" * 60)
    print("DETAILED ANALYSIS COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(detailed_analysis())
