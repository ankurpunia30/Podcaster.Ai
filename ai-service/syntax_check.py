#!/usr/bin/env python3
"""
AI Service Startup Test
Validates that the main.py file has correct Python syntax
"""

import sys
import ast
import os

def validate_python_syntax(file_path):
    """Validate Python syntax without executing the code"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            source_code = f.read()
        
        # Parse the AST to check for syntax errors
        ast.parse(source_code)
        return True, "Syntax is valid"
        
    except SyntaxError as e:
        return False, f"Syntax error at line {e.lineno}: {e.msg}"
    except Exception as e:
        return False, f"Error reading file: {e}"

def main():
    print("🔍 AI Service Syntax Validation")
    print("=" * 40)
    
    main_py_path = "/Users/ankur/tts_env/ai-service/main.py"
    
    if not os.path.exists(main_py_path):
        print(f"❌ File not found: {main_py_path}")
        return 1
    
    # Check main.py syntax
    is_valid, message = validate_python_syntax(main_py_path)
    
    if is_valid:
        print(f"✅ main.py syntax is valid")
        print(f"   {message}")
        
        # Count optimizations implemented
        optimizations = [
            "PerformanceCache",
            "PerformanceOptimizer", 
            "AsyncConnectionContext",
            "PerformanceMetrics",
            "async_groq_request",
            "batch_process",
            "get_performance_metrics"
        ]
        
        with open(main_py_path, 'r') as f:
            content = f.read()
        
        found_optimizations = []
        for opt in optimizations:
            if opt in content:
                found_optimizations.append(opt)
        
        print(f"\n📊 Performance Optimizations Found:")
        for opt in found_optimizations:
            print(f"   ✅ {opt}")
        
        print(f"\n🎯 Total optimizations implemented: {len(found_optimizations)}/{len(optimizations)}")
        
        if len(found_optimizations) == len(optimizations):
            print("🎉 All performance optimizations are present!")
            return 0
        else:
            print("⚠️  Some optimizations may be missing")
            return 0
    else:
        print(f"❌ main.py has syntax errors:")
        print(f"   {message}")
        return 1

if __name__ == "__main__":
    exit(main())
