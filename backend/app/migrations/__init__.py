"""
Database Migrations Package

Migrations are versioned using semantic versioning format: YYYYMMDD_HHMMSS_description
"""
from typing import List
from app.core.migrations import Migration


def get_all_migrations() -> List[Migration]:
    """Get all registered migrations in order"""
    from app.migrations.m001_initial_indexes import migration as m001
    from app.migrations.m002_add_tenant_fields import migration as m002
    from app.migrations.m003_add_activity_indexes import migration as m003
    
    return [m001, m002, m003]

