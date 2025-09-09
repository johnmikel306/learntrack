#!/usr/bin/env python3
"""
LearnTrack MVP Database Analysis Script
Comprehensive analysis of MongoDB database without modifications
"""

import asyncio
import motor.motor_asyncio
from pymongo import MongoClient
import json
from datetime import datetime
from collections import defaultdict, Counter
import sys

async def analyze_database():
    """Perform comprehensive database analysis"""
    print("=" * 60)
    print("LEARNTRACK MVP DATABASE ANALYSIS REPORT")
    print("=" * 60)
    print(f"Analysis performed at: {datetime.now()}")
    print()
    
    try:
        # Connect to MongoDB
        client = motor.motor_asyncio.AsyncIOMotorClient('mongodb://localhost:27017')
        db = client['learntrack_mvp']
        
        # Test connection
        await client.admin.command('ping')
        print("✅ Database Connection: SUCCESS")
        print(f"   Database: learntrack_mvp")
        print(f"   Connection: mongodb://localhost:27017")
        print()
        
    except Exception as e:
        print(f"❌ Database Connection: FAILED")
        print(f"   Error: {e}")
        return
    
    # 1. COLLECTION OVERVIEW
    print("1. COLLECTION OVERVIEW")
    print("-" * 30)
    
    collections = await db.list_collection_names()
    print(f"Total Collections: {len(collections)}")
    
    collection_stats = {}
    for collection_name in collections:
        collection = db[collection_name]
        count = await collection.count_documents({})
        collection_stats[collection_name] = count
        print(f"  📋 {collection_name}: {count} documents")
    
    print()
    
    # 2. DETAILED COLLECTION ANALYSIS
    print("2. DETAILED COLLECTION ANALYSIS")
    print("-" * 35)
    
    for collection_name in collections:
        await analyze_collection(db, collection_name)
    
    # 3. AUTHENTICATION DATA ANALYSIS
    print("3. AUTHENTICATION DATA ANALYSIS")
    print("-" * 35)
    await analyze_authentication_data(db)
    
    # 4. DATA RELATIONSHIPS ANALYSIS
    print("4. DATA RELATIONSHIPS ANALYSIS")
    print("-" * 35)
    await analyze_relationships(db)
    
    # 5. DATA QUALITY ASSESSMENT
    print("5. DATA QUALITY ASSESSMENT")
    print("-" * 35)
    await analyze_data_quality(db)
    
    # 6. PERFORMANCE ANALYSIS
    print("6. PERFORMANCE ANALYSIS")
    print("-" * 25)
    await analyze_performance(db)
    
    print("=" * 60)
    print("ANALYSIS COMPLETE")
    print("=" * 60)

async def analyze_collection(db, collection_name):
    """Analyze individual collection structure and content"""
    collection = db[collection_name]
    count = await collection.count_documents({})
    
    print(f"\n📋 Collection: {collection_name}")
    print(f"   Documents: {count}")
    
    if count == 0:
        print("   Status: Empty collection")
        return
    
    # Get sample documents
    sample_docs = await collection.find().limit(3).to_list(length=3)
    
    if sample_docs:
        print("   Document Structure:")
        # Analyze field types from sample
        field_analysis = defaultdict(set)
        for doc in sample_docs:
            for key, value in doc.items():
                field_analysis[key].add(type(value).__name__)
        
        for field, types in field_analysis.items():
            types_str = ", ".join(types)
            print(f"     {field}: {types_str}")
    
    # Analyze indexes
    indexes = await collection.list_indexes().to_list(length=None)
    print(f"   Indexes: {len(indexes)}")
    for idx in indexes:
        name = idx.get('name', 'unnamed')
        key = idx.get('key', {})
        unique = idx.get('unique', False)
        sparse = idx.get('sparse', False)
        
        key_str = ", ".join([f"{k}:{v}" for k, v in key.items()])
        flags = []
        if unique:
            flags.append("unique")
        if sparse:
            flags.append("sparse")
        
        flags_str = f" ({', '.join(flags)})" if flags else ""
        print(f"     - {name}: {key_str}{flags_str}")

async def analyze_authentication_data(db):
    """Analyze user authentication and role data"""
    users_collection = db['users']
    
    # Check if users collection exists
    if 'users' not in await db.list_collection_names():
        print("❌ Users collection not found")
        return
    
    total_users = await users_collection.count_documents({})
    print(f"Total Users: {total_users}")
    
    if total_users == 0:
        print("❌ No users found in database")
        return
    
    # Analyze roles
    role_pipeline = [
        {"$group": {"_id": "$role", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    
    role_stats = await users_collection.aggregate(role_pipeline).to_list(length=None)
    print("\nRole Distribution:")
    for stat in role_stats:
        role = stat['_id'] or 'null'
        count = stat['count']
        print(f"  {role}: {count} users")
    
    # Analyze Clerk ID presence
    clerk_id_count = await users_collection.count_documents({"clerk_id": {"$exists": True, "$ne": None}})
    auth0_id_count = await users_collection.count_documents({"auth0_id": {"$exists": True, "$ne": None}})
    
    print(f"\nAuthentication IDs:")
    print(f"  Users with clerk_id: {clerk_id_count}")
    print(f"  Users with auth0_id: {auth0_id_count}")
    
    # Check for duplicates
    clerk_duplicates = await users_collection.aggregate([
        {"$match": {"clerk_id": {"$exists": True, "$ne": None}}},
        {"$group": {"_id": "$clerk_id", "count": {"$sum": 1}}},
        {"$match": {"count": {"$gt": 1}}}
    ]).to_list(length=None)
    
    if clerk_duplicates:
        print(f"⚠️  Found {len(clerk_duplicates)} duplicate clerk_id values")
    else:
        print("✅ No duplicate clerk_id values found")

async def analyze_relationships(db):
    """Analyze data relationships and referential integrity"""
    collections = await db.list_collection_names()
    
    # Check tutor_id relationships
    if 'users' in collections:
        users = db['users']
        tutors = await users.find({"role": "tutor"}).to_list(length=None)
        tutor_ids = [tutor.get('clerk_id') for tutor in tutors if tutor.get('clerk_id')]
        
        print(f"Found {len(tutor_ids)} tutors")
        
        # Check tutor_id references in other collections
        for collection_name in collections:
            if collection_name == 'users':
                continue
                
            collection = db[collection_name]
            sample = await collection.find_one()
            
            if sample and 'tutor_id' in sample:
                total_docs = await collection.count_documents({})
                valid_tutor_refs = await collection.count_documents({"tutor_id": {"$in": tutor_ids}})
                
                print(f"  {collection_name}: {valid_tutor_refs}/{total_docs} valid tutor_id references")

async def analyze_data_quality(db):
    """Assess data quality and consistency"""
    collections = await db.list_collection_names()
    
    issues = []
    
    for collection_name in collections:
        collection = db[collection_name]
        
        # Check for null/missing required fields
        sample = await collection.find_one()
        if not sample:
            continue
            
        # Check for documents with missing _id
        missing_id = await collection.count_documents({"_id": {"$exists": False}})
        if missing_id > 0:
            issues.append(f"{collection_name}: {missing_id} documents missing _id")
        
        # Check for empty string values in important fields
        if 'email' in sample:
            empty_emails = await collection.count_documents({"email": ""})
            if empty_emails > 0:
                issues.append(f"{collection_name}: {empty_emails} documents with empty email")
    
    if issues:
        print("⚠️  Data Quality Issues Found:")
        for issue in issues:
            print(f"  - {issue}")
    else:
        print("✅ No major data quality issues detected")

async def analyze_performance(db):
    """Analyze database performance characteristics"""
    collections = await db.list_collection_names()
    
    print("Index Coverage Analysis:")
    
    for collection_name in collections:
        collection = db[collection_name]
        count = await collection.count_documents({})
        
        if count == 0:
            continue
            
        indexes = await collection.list_indexes().to_list(length=None)
        index_count = len(indexes) - 1  # Exclude default _id index
        
        print(f"  {collection_name}: {index_count} custom indexes for {count} documents")
        
        # Check for common query patterns that might need indexes
        sample = await collection.find_one()
        if sample:
            if 'tutor_id' in sample and index_count == 0:
                print(f"    ⚠️  Consider adding index on tutor_id for tenant isolation")
            if 'email' in sample:
                email_indexed = any('email' in str(idx.get('key', {})) for idx in indexes)
                if not email_indexed:
                    print(f"    ⚠️  Consider adding index on email for user lookups")

if __name__ == "__main__":
    asyncio.run(analyze_database())
