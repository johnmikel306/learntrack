#!/usr/bin/env python3
"""
Simple script to fix authentication imports and basic dependencies
"""
import os
import re
from pathlib import Path

def simple_fix_auth(file_path):
    """Simple fix for authentication references"""
    print(f"Simple fixing {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove auth imports
    content = re.sub(r'from app\.core\.auth import[^\n]*\n', '# Authentication removed\n', content)
    content = re.sub(r'from app\.core\.tenant_dependencies import[^\n]*\n', '# Authentication removed\n', content)
    
    # Remove specific auth parameters from function signatures
    content = re.sub(r',\s*current_user\s*=\s*Depends\([^)]+\)', '', content)
    content = re.sub(r',\s*context:\s*\w+Context', '', content)
    content = re.sub(r'current_user\s*=\s*Depends\([^)]+\),?\s*', '', content)
    content = re.sub(r'context:\s*\w+Context,?\s*', '', content)
    
    # Remove database dependencies that use get_database
    content = re.sub(r',\s*db:\s*AsyncIOMotorDatabase\s*=\s*Depends\(get_database\)', '', content)
    content = re.sub(r'db:\s*AsyncIOMotorDatabase\s*=\s*Depends\(get_database\),?\s*', '', content)
    
    # Fix parameter syntax
    content = re.sub(r',\s*\)', ')', content)
    content = re.sub(r'\(\s*,', '(', content)
    
    # Replace service instantiation
    content = re.sub(r'(\w+)_service = \w+Service\(db\)', r'\1_service = Service(database)', content)
    content = re.sub(r'service = \w+Service\(db\)', 'service = Service(database)', content)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"Simple fixed {file_path}")

def main():
    """Simple fix for all endpoint files"""
    endpoints_dir = Path("app/api/v1/endpoints")
    
    if not endpoints_dir.exists():
        print(f"Directory {endpoints_dir} not found")
        return
    
    # Process all Python files in endpoints directory
    for file_path in endpoints_dir.glob("*.py"):
        if file_path.name == "__init__.py":
            continue
        if file_path.name in ["auth.py", "users.py"]:
            continue  # These files are already removed
        
        simple_fix_auth(file_path)
    
    print("Simple authentication fix completed!")

if __name__ == "__main__":
    main()
