#!/usr/bin/env python3
"""
Check browser-gym database status.

Usage:
    uv run python scripts/check_db.py
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

# Load .env.local from project root
env_path = Path(__file__).parent.parent / '.env.local'
if env_path.exists():
    load_dotenv(env_path)

url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
key = os.environ.get('NEXT_PUBLIC_SUPABASE_ANON_KEY')

if not url or not key:
    print("❌ Error: Supabase credentials not found in .env.local")
    print("   Required: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY")
    exit(1)

supabase = create_client(url, key)

print("🔍 Checking browser-gym database...")
print("=" * 60)

# Check organizations
print("\n🏢 Organizations:")
result = supabase.table('organizations').select('*').execute()
if result.data:
    for org in result.data:
        print(f"   • {org['name']} (slug: {org['slug']}, id: {org['id']})")
else:
    print("   ⚠️  No organizations found")

# Check users
print("\n👤 Users:")
result = supabase.table('profiles').select('*').execute()
if result.data:
    for user in result.data:
        print(f"   • {user.get('full_name', 'N/A')} ({user['email']}, id: {user['user_id']})")
else:
    print("   ⚠️  No users found")

# Check data counts
print("\n📊 Data counts:")
tables = [
    'companies', 'tenders', 'tender_submissions', 'tax_filings', 
    'disclosures', 'shipments', 'employees', 'hr_submissions'
]

for table in tables:
    try:
        result = supabase.table(table).select('id', count='exact').execute()
        count = result.count if hasattr(result, 'count') else len(result.data)
        print(f"   • {table}: {count}")
    except Exception as e:
        print(f"   • {table}: Error - {e}")

print("\n" + "=" * 60)
