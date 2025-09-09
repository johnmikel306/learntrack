#!/usr/bin/env python3
"""
Script to fix remaining authentication references in endpoint files
"""
import os
import re
from pathlib import Path

def fix_auth_references(file_path):
    """Fix remaining authentication references in a Python file"""
    print(f"Fixing {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove specific auth function references
    content = re.sub(r'require_student|require_tutor|require_parent|get_current_user', '', content)
    
    # Remove Depends() calls with auth functions
    content = re.sub(r'Depends\([^)]*\)', '', content)
    
    # Remove auth-related parameters
    content = re.sub(r',\s*current_user:\s*[^=,)]+\s*=\s*[^,)]+', '', content)
    content = re.sub(r'current_user:\s*[^=,)]+\s*=\s*[^,)]+,?\s*', '', content)
    
    # Fix parameter syntax issues
    content = re.sub(r',\s*\)', ')', content)
    content = re.sub(r'\(\s*,', '(', content)
    content = re.sub(r'=\s*\.\.\.,', ',', content)
    content = re.sub(r'=\s*\.\.\.\)', ')', content)
    
    # Clean up empty lines
    content = re.sub(r'\n\s*\n\s*\n', '\n\n', content)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"Fixed {file_path}")

def main():
    """Fix authentication references in all endpoint files"""
    endpoints_dir = Path("app/api/v1/endpoints")
    
    if not endpoints_dir.exists():
        print(f"Directory {endpoints_dir} not found")
        return
    
    # Process all Python files in endpoints directory
    for file_path in endpoints_dir.glob("*.py"):
        if file_path.name == "__init__.py":
            continue
        
        fix_auth_references(file_path)
    
    print("Authentication reference cleanup completed!")

if __name__ == "__main__":
    main()
