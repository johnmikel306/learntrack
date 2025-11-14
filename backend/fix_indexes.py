"""
Script to fix index conflicts by dropping old non-unique email indexes
and allowing the application to recreate them with unique constraints.
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import OperationFailure

async def fix_indexes():
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["learntrack"]
    
    # Collections that should have unique email indexes
    collections_with_email = ["tutors", "students", "parents"]
    
    print("🔧 Fixing index conflicts...\n")
    
    for collection_name in collections_with_email:
        collection = db[collection_name]
        
        try:
            # Get existing indexes
            indexes = await collection.index_information()
            
            # Check if email_1 index exists
            if "email_1" in indexes:
                index_info = indexes["email_1"]
                is_unique = index_info.get("unique", False)
                
                if not is_unique:
                    print(f"📋 {collection_name}: Found non-unique email_1 index")
                    print(f"   Dropping old index...")
                    
                    # Drop the old non-unique index
                    await collection.drop_index("email_1")
                    print(f"   ✅ Dropped successfully")
                    
                    # Create new unique index
                    print(f"   Creating unique email index...")
                    await collection.create_index("email", unique=True, name="email_unique")
                    print(f"   ✅ Created unique index 'email_unique'\n")
                else:
                    print(f"✅ {collection_name}: email_1 index is already unique\n")
            else:
                print(f"📋 {collection_name}: No email_1 index found")
                print(f"   Creating unique email index...")
                await collection.create_index("email", unique=True, name="email_unique")
                print(f"   ✅ Created unique index 'email_unique'\n")
                
        except OperationFailure as e:
            print(f"❌ Error processing {collection_name}: {e}\n")
    
    # Close connection
    client.close()
    print("✅ Index fix complete!")

if __name__ == "__main__":
    asyncio.run(fix_indexes())

