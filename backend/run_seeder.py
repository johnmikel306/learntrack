"""
Script to run the database seeder
"""
import asyncio
from app.core.database import database
from scripts.seeders import DatabaseSeeder


async def main():
    """Run the seeder"""
    try:
        # Connect to database
        await database.connect_to_database()
        
        # Create seeder and run
        seeder = DatabaseSeeder(database.database)
        results = await seeder.seed_all(clear_existing=True)
        
        print("\n✅ Seeding completed successfully!")
        print(f"Results: {results}")
        
        # Close database connection
        await database.close_database_connection()
        
    except Exception as e:
        print(f"\n❌ Seeding failed: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())

