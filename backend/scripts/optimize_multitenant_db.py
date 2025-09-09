#!/usr/bin/env python3
"""
Database optimization script for multi-tenant LearnTrack

This script creates optimized compound indexes for multi-tenant queries
and provides performance analysis for the multi-tenant architecture.

Usage:
    python backend/scripts/optimize_multitenant_db.py --analyze  # Analyze current performance
    python backend/scripts/optimize_multitenant_db.py --optimize  # Create optimized indexes
    python backend/scripts/optimize_multitenant_db.py --benchmark  # Run performance benchmarks
"""

import asyncio
import argparse
import time
from typing import Dict, List, Tuple
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from bson import ObjectId
import structlog

logger = structlog.get_logger()


class MultiTenantDBOptimizer:
    """Database optimizer for multi-tenant architecture"""
    
    def __init__(self, database: AsyncIOMotorDatabase):
        self.db = database
        self.optimization_results = {
            "indexes_created": [],
            "indexes_dropped": [],
            "performance_improvements": {},
            "recommendations": []
        }
    
    async def analyze_current_state(self):
        """Analyze current database state and performance"""
        logger.info("Analyzing current database state")
        
        # Check existing indexes
        await self._analyze_existing_indexes()
        
        # Analyze query patterns
        await self._analyze_query_patterns()
        
        # Check collection sizes and distribution
        await self._analyze_data_distribution()
        
        return self.optimization_results
    
    async def _analyze_existing_indexes(self):
        """Analyze existing indexes across all collections"""
        collections = ["users", "students", "questions", "assignments", "files", "progress", "subjects", "student_groups"]
        
        for collection_name in collections:
            collection = getattr(self.db, collection_name)
            indexes = await collection.list_indexes().to_list(None)
            
            logger.info("Current indexes", collection=collection_name, count=len(indexes))
            
            # Check for tenant-aware indexes
            has_tenant_index = any(
                "tenant_id" in str(index.get("key", {})) 
                for index in indexes
            )
            
            if not has_tenant_index:
                self.optimization_results["recommendations"].append(
                    f"Collection {collection_name} needs tenant_id indexes"
                )
    
    async def _analyze_query_patterns(self):
        """Analyze common query patterns for optimization"""
        logger.info("Analyzing query patterns")
        
        # Common query patterns for each collection
        query_patterns = {
            "users": [
                {"clerk_id": 1},
                {"tenant_id": 1, "role": 1},
                {"email": 1}
            ],
            "students": [
                {"tenant_id": 1, "status": 1},
                {"tenant_id": 1, "email": 1},
                {"tenant_id": 1, "grade": 1}
            ],
            "questions": [
                {"tenant_id": 1, "subject_id": 1},
                {"tenant_id": 1, "tutor_id": 1},
                {"tenant_id": 1, "difficulty": 1},
                {"tenant_id": 1, "question_type": 1}
            ],
            "assignments": [
                {"tenant_id": 1, "tutor_id": 1},
                {"tenant_id": 1, "due_date": 1},
                {"tenant_id": 1, "status": 1},
                {"tenant_id": 1, "student_ids": 1}
            ],
            "files": [
                {"tenant_id": 1, "uploaded_by": 1},
                {"tenant_id": 1, "content_type": 1},
                {"tenant_id": 1, "status": 1}
            ],
            "progress": [
                {"tenant_id": 1, "student_id": 1},
                {"tenant_id": 1, "assignment_id": 1},
                {"tenant_id": 1, "status": 1},
                {"tenant_id": 1, "submitted_at": 1}
            ],
            "subjects": [
                {"tenant_id": 1, "tutor_id": 1},
                {"tenant_id": 1, "name": 1}
            ],
            "student_groups": [
                {"tenant_id": 1, "name": 1},
                {"tenant_id": 1, "studentIds": 1}
            ]
        }
        
        # Test query performance for each pattern
        for collection_name, patterns in query_patterns.items():
            collection = getattr(self.db, collection_name)
            
            for pattern in patterns:
                start_time = time.time()
                
                # Run explain to get query plan
                try:
                    explain_result = await collection.find(pattern).explain()
                    execution_time = time.time() - start_time
                    
                    # Check if query uses index
                    winning_plan = explain_result.get("queryPlanner", {}).get("winningPlan", {})
                    uses_index = "IXSCAN" in str(winning_plan)
                    
                    logger.info("Query analysis", 
                               collection=collection_name,
                               pattern=pattern,
                               uses_index=uses_index,
                               execution_time_ms=execution_time * 1000)
                    
                    if not uses_index:
                        self.optimization_results["recommendations"].append(
                            f"Query pattern {pattern} in {collection_name} needs index optimization"
                        )
                        
                except Exception as e:
                    logger.warning("Query analysis failed", 
                                 collection=collection_name, 
                                 pattern=pattern, 
                                 error=str(e))
    
    async def _analyze_data_distribution(self):
        """Analyze data distribution across tenants"""
        logger.info("Analyzing data distribution")
        
        collections = ["students", "questions", "assignments", "files", "progress", "subjects"]
        
        for collection_name in collections:
            collection = getattr(self.db, collection_name)
            
            # Get tenant distribution
            pipeline = [
                {"$group": {
                    "_id": "$tenant_id",
                    "count": {"$sum": 1}
                }},
                {"$sort": {"count": -1}}
            ]
            
            try:
                distribution = await collection.aggregate(pipeline).to_list(None)
                
                total_docs = sum(item["count"] for item in distribution)
                largest_tenant = distribution[0] if distribution else None
                
                logger.info("Data distribution", 
                           collection=collection_name,
                           total_documents=total_docs,
                           tenant_count=len(distribution),
                           largest_tenant_docs=largest_tenant["count"] if largest_tenant else 0)
                
                # Check for data skew
                if largest_tenant and total_docs > 0:
                    skew_percentage = (largest_tenant["count"] / total_docs) * 100
                    if skew_percentage > 50:
                        self.optimization_results["recommendations"].append(
                            f"Collection {collection_name} has data skew: {skew_percentage:.1f}% in largest tenant"
                        )
                        
            except Exception as e:
                logger.warning("Distribution analysis failed", 
                             collection=collection_name, 
                             error=str(e))
    
    async def create_optimized_indexes(self):
        """Create optimized compound indexes for multi-tenant queries"""
        logger.info("Creating optimized indexes")
        
        # Define optimized indexes for each collection
        index_definitions = {
            "users": [
                [("clerk_id", 1)],  # Unique lookup
                [("tenant_id", 1), ("role", 1)],  # Tenant + role queries
                [("email", 1)],  # Email lookup
                [("tenant_id", 1), ("is_active", 1)]  # Active users per tenant
            ],
            "students": [
                [("tenant_id", 1), ("status", 1)],  # Active students per tenant
                [("tenant_id", 1), ("email", 1)],  # Student lookup by email
                [("tenant_id", 1), ("grade", 1)],  # Students by grade
                [("tenant_id", 1), ("enrollmentDate", 1)],  # Recent enrollments
                [("tenant_id", 1), ("subjects", 1)]  # Students by subject
            ],
            "questions": [
                [("tenant_id", 1), ("subject_id", 1)],  # Questions by subject
                [("tenant_id", 1), ("tutor_id", 1)],  # Questions by tutor
                [("tenant_id", 1), ("difficulty", 1)],  # Questions by difficulty
                [("tenant_id", 1), ("question_type", 1)],  # Questions by type
                [("tenant_id", 1), ("status", 1)],  # Active questions
                [("tenant_id", 1), ("created_at", -1)]  # Recent questions
            ],
            "assignments": [
                [("tenant_id", 1), ("tutor_id", 1)],  # Assignments by tutor
                [("tenant_id", 1), ("due_date", 1)],  # Assignments by due date
                [("tenant_id", 1), ("status", 1)],  # Assignments by status
                [("tenant_id", 1), ("subject_id", 1)],  # Assignments by subject
                [("tenant_id", 1), ("created_at", -1)]  # Recent assignments
            ],
            "files": [
                [("tenant_id", 1), ("uploaded_by", 1)],  # Files by uploader
                [("tenant_id", 1), ("content_type", 1)],  # Files by type
                [("tenant_id", 1), ("status", 1)],  # Files by processing status
                [("tenant_id", 1), ("uploaded_at", -1)]  # Recent files
            ],
            "progress": [
                [("tenant_id", 1), ("student_id", 1)],  # Progress by student
                [("tenant_id", 1), ("assignment_id", 1)],  # Progress by assignment
                [("tenant_id", 1), ("status", 1)],  # Progress by status
                [("tenant_id", 1), ("submitted_at", -1)],  # Recent submissions
                [("tenant_id", 1), ("student_id", 1), ("assignment_id", 1)]  # Unique progress
            ],
            "subjects": [
                [("tenant_id", 1), ("tutor_id", 1)],  # Subjects by tutor
                [("tenant_id", 1), ("name", 1)],  # Subjects by name
                [("tenant_id", 1), ("is_active", 1)]  # Active subjects
            ],
            "student_groups": [
                [("tenant_id", 1), ("name", 1)],  # Groups by name
                [("tenant_id", 1), ("createdDate", -1)]  # Recent groups
            ]
        }
        
        # Create indexes
        for collection_name, indexes in index_definitions.items():
            collection = getattr(self.db, collection_name)
            
            for index_spec in indexes:
                try:
                    index_name = await collection.create_index(index_spec)
                    self.optimization_results["indexes_created"].append({
                        "collection": collection_name,
                        "index": index_spec,
                        "name": index_name
                    })
                    logger.info("Created index", 
                               collection=collection_name, 
                               index=index_spec,
                               name=index_name)
                    
                except Exception as e:
                    logger.warning("Failed to create index", 
                                 collection=collection_name, 
                                 index=index_spec, 
                                 error=str(e))
    
    async def benchmark_performance(self):
        """Run performance benchmarks for multi-tenant queries"""
        logger.info("Running performance benchmarks")
        
        # Get a sample tenant for testing
        sample_tenant = await self._get_sample_tenant()
        if not sample_tenant:
            logger.warning("No tenant data found for benchmarking")
            return
        
        # Define benchmark queries
        benchmark_queries = [
            ("students", {"tenant_id": sample_tenant, "status": "active"}),
            ("questions", {"tenant_id": sample_tenant, "difficulty": "medium"}),
            ("assignments", {"tenant_id": sample_tenant, "status": "active"}),
            ("progress", {"tenant_id": sample_tenant, "status": "submitted"})
        ]
        
        # Run benchmarks
        for collection_name, query in benchmark_queries:
            collection = getattr(self.db, collection_name)
            
            # Warm up
            await collection.find(query).limit(1).to_list(1)
            
            # Benchmark
            start_time = time.time()
            results = await collection.find(query).to_list(None)
            execution_time = time.time() - start_time
            
            self.optimization_results["performance_improvements"][f"{collection_name}_query"] = {
                "execution_time_ms": execution_time * 1000,
                "result_count": len(results),
                "query": query
            }
            
            logger.info("Benchmark result", 
                       collection=collection_name,
                       execution_time_ms=execution_time * 1000,
                       result_count=len(results))
    
    async def _get_sample_tenant(self):
        """Get a sample tenant ID for benchmarking"""
        try:
            sample_user = await self.db.users.find_one({"role": "tutor"})
            return sample_user.get("tenant_id") if sample_user else None
        except Exception:
            return None


async def main():
    parser = argparse.ArgumentParser(description="Optimize database for multi-tenant architecture")
    parser.add_argument("--analyze", action="store_true", help="Analyze current database state")
    parser.add_argument("--optimize", action="store_true", help="Create optimized indexes")
    parser.add_argument("--benchmark", action="store_true", help="Run performance benchmarks")
    parser.add_argument("--mongo-url", default="mongodb://localhost:27017", help="MongoDB connection URL")
    parser.add_argument("--database", default="learntrack", help="Database name")
    
    args = parser.parse_args()
    
    if not any([args.analyze, args.optimize, args.benchmark]):
        print("Error: Must specify at least one action (--analyze, --optimize, or --benchmark)")
        return
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(args.mongo_url)
    database = client[args.database]
    
    try:
        optimizer = MultiTenantDBOptimizer(database)
        
        if args.analyze:
            results = await optimizer.analyze_current_state()
            print("\nDatabase Analysis Results:")
            print(f"Recommendations: {len(results['recommendations'])}")
            for rec in results['recommendations']:
                print(f"  - {rec}")
        
        if args.optimize:
            await optimizer.create_optimized_indexes()
            print(f"\nCreated {len(optimizer.optimization_results['indexes_created'])} indexes")
        
        if args.benchmark:
            await optimizer.benchmark_performance()
            print("\nPerformance Benchmarks:")
            for query, metrics in optimizer.optimization_results['performance_improvements'].items():
                print(f"  {query}: {metrics['execution_time_ms']:.2f}ms ({metrics['result_count']} results)")
        
    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(main())
