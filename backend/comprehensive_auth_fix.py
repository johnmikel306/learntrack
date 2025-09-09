#!/usr/bin/env python3
"""
Comprehensive script to fix all authentication references and syntax errors
"""
import os
import re
from pathlib import Path

def fix_file_comprehensively(file_path):
    """Comprehensively fix all authentication and syntax issues in a file"""
    print(f"Comprehensively fixing {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    fixed_lines = []
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Skip lines with auth imports
        if 'from app.core.auth import' in line or 'from app.core.tenant_dependencies import' in line:
            i += 1
            continue
            
        # Fix function definitions with auth parameters
        if 'async def ' in line and i + 1 < len(lines):
            # Collect the entire function signature
            func_lines = [line]
            j = i + 1
            while j < len(lines) and not lines[j].strip().endswith('):'):
                func_lines.append(lines[j])
                j += 1
            if j < len(lines):
                func_lines.append(lines[j])
            
            # Join and fix the function signature
            func_signature = ''.join(func_lines)
            
            # Remove auth-related parameters
            func_signature = re.sub(r',\s*current_user[^,)]*', '', func_signature)
            func_signature = re.sub(r',\s*context[^,)]*', '', func_signature)
            func_signature = re.sub(r'current_user[^,)]*,\s*', '', func_signature)
            func_signature = re.sub(r'context[^,)]*,\s*', '', func_signature)
            
            # Remove Depends() calls
            func_signature = re.sub(r'=\s*Depends\([^)]*\)', '', func_signature)
            
            # Fix syntax issues
            func_signature = re.sub(r'=\s*\.\.\.\s*,', ',', func_signature)
            func_signature = re.sub(r'=\s*\.\.\.\s*\)', ')', func_signature)
            func_signature = re.sub(r'=\s*$', '', func_signature, flags=re.MULTILINE)
            func_signature = re.sub(r',\s*\)', ')', func_signature)
            func_signature = re.sub(r'\(\s*,', '(', func_signature)
            
            # Clean up whitespace
            func_signature = re.sub(r'\n\s*\n', '\n', func_signature)
            
            fixed_lines.extend(func_signature.split('\n'))
            i = j + 1
        else:
            # Regular line processing
            line = re.sub(r'from app\.core\.auth import.*', '# Authentication removed', line)
            line = re.sub(r'from app\.core\.tenant_dependencies import.*', '# Authentication removed', line)
            
            fixed_lines.append(line)
            i += 1
    
    # Write the fixed content
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(fixed_lines)
    
    print(f"Comprehensively fixed {file_path}")

def main():
    """Fix all endpoint files comprehensively"""
    endpoints_dir = Path("backend/app/api/v1/endpoints")
    
    if not endpoints_dir.exists():
        print(f"Directory {endpoints_dir} not found")
        return
    
    # Process all Python files in endpoints directory
    for file_path in endpoints_dir.glob("*.py"):
        if file_path.name == "__init__.py":
            continue
        
        fix_file_comprehensively(file_path)
    
    print("Comprehensive authentication fix completed!")

if __name__ == "__main__":
    main()
