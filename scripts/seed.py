#!/usr/bin/env python3
"""
Portal-Gym Database Seeding Script

Generates realistic German test data and seeds it into Supabase.
Creates relationships between entities (companies → tenders → submissions, etc.)

Usage:
    python seed.py --org-id <uuid> --user-id <uuid> [options]
    
Examples:
    # Seed with defaults (10 companies, 50 tenders, etc.)
    python seed.py --org-id 123e4567-e89b-12d3-a456-426614174000 --user-id 123e4567-e89b-12d3-a456-426614174001
    
    # Seed with custom counts
    python seed.py --org-id <uuid> --user-id <uuid> --companies 20 --tenders 100
    
    # Generate fixtures only (no database insertion)
    python seed.py --fixtures-only --output-dir ./fixtures
    
    # Use specific seed for reproducible data
    python seed.py --org-id <uuid> --user-id <uuid> --seed 12345
"""

import os
import sys
import json
import argparse
from datetime import datetime
from typing import Optional, Dict, Any
from pathlib import Path

# Add generators to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'test-data'))

from generators import (
    CompanyGenerator, GermanCompany,
    TenderGenerator, Tender, TenderSubmission, TenderDocument,
    TaxFilingGenerator, TaxFiling, TaxFilingDocument, Disclosure, DisclosureDocument,
    ShippingGenerator, Shipment, ShipmentInvoice,
    EmployeeGenerator, Employee, HRSubmission
)


def get_supabase_client():
    """Initialize Supabase client from environment variables."""
    try:
        from supabase import create_client
        from dotenv import load_dotenv
        
        # Load .env.local from project root
        env_path = Path(__file__).parent.parent / '.env.local'
        if env_path.exists():
            load_dotenv(env_path)
        
        url = os.environ.get('SUPABASE_URL') or os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
        key = os.environ.get('SUPABASE_SERVICE_KEY') or os.environ.get('SUPABASE_SERVICE_ROLE_KEY') or os.environ.get('SUPABASE_ANON_KEY') or os.environ.get('NEXT_PUBLIC_SUPABASE_ANON_KEY')
        
        if not url or not key:
            print("❌ Error: Supabase credentials not found in environment variables")
            print("   Required: SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_ANON_KEY)")
            print("   Or set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local")
            sys.exit(1)
        
        return create_client(url, key)
    except ImportError as e:
        print(f"❌ Error: {e}")
        print("   Run: uv pip install supabase python-dotenv")
        sys.exit(1)


class DatabaseSeeder:
    """Seeds Portal-Gym database with realistic test data."""
    
    def __init__(self, org_id: str, user_id: str, seed: Optional[int] = None):
        self.org_id = org_id
        self.user_id = user_id
        self.seed = seed
        self.scenario_run_id = None
        
        # Initialize generators
        self.company_gen = CompanyGenerator(seed=seed)
        self.tender_gen = TenderGenerator(seed=seed)
        self.tax_gen = TaxFilingGenerator(seed=seed)
        self.shipping_gen = ShippingGenerator(seed=seed)
        self.employee_gen = EmployeeGenerator(seed=seed)
        
        # Data storage
        self.companies: list = []
        self.tenders: list = []
        self.tender_submissions: list = []
        self.tender_documents: list = []
        self.tax_filings: list = []
        self.tax_filing_documents: list = []
        self.disclosures: list = []
        self.disclosure_documents: list = []
        self.shipments: list = []
        self.shipment_invoices: list = []
        self.employees: list = []
        self.hr_submissions: list = []
    
    def create_scenario_run(self, supabase) -> str:
        """Create a scenario run record to track this seeding."""
        run_data = {
            'org_id': self.org_id,
            'run_by': self.user_id,
            'status': 'running',
            'template_id': None,
            'created_count': 0
        }
        
        try:
            result = supabase.table('scenario_runs').insert(run_data).execute()
            self.scenario_run_id = result.data[0]['id']
            print(f"✅ Created scenario run: {self.scenario_run_id}")
            return self.scenario_run_id
        except Exception as e:
            print(f"⚠️  Could not create scenario run (skipping): {e}")
            return None
    
    def update_scenario_run(self, supabase, count: int, status: str = 'completed'):
        """Update scenario run with final count and status."""
        if self.scenario_run_id:
            supabase.table('scenario_runs').update({
                'status': status,
                'created_count': count,
                'completed_at': datetime.now().isoformat()
            }).eq('id', self.scenario_run_id).execute()
    
    def generate_all_data(
        self,
        company_count: int = 10,
        tender_count: int = 50,
        tax_filing_count: int = 30,
        disclosure_count: int = 20,
        shipment_count: int = 30,
        employee_count: int = 20
    ):
        """Generate all test data with relationships."""
        print(f"\n🎯 Generating test data with seed={self.seed}...")
        print("=" * 60)
        
        # 1. Generate companies (foundation for all other entities)
        print(f"\n📊 Generating {company_count} companies...")
        self.companies = self.company_gen.generate_companies(
            self.org_id, 
            count=company_count,
            buyer_ratio=0.3,
            supplier_ratio=0.7
        )
        print(f"   ✅ Generated {len(self.companies)} companies")
        
        # Separate buyers and suppliers
        buyer_companies = [c for c in self.companies if c.is_buyer]
        supplier_companies = [c for c in self.companies if c.is_supplier]
        
        # 2. Generate tenders
        print(f"\n📊 Generating {tender_count} tenders...")
        self.tenders = self.tender_gen.generate_tenders(
            self.org_id,
            buyer_companies,
            count=tender_count
        )
        print(f"   ✅ Generated {len(self.tenders)} tenders")
        
        # 3. Generate tender submissions
        print(f"\n📊 Generating tender submissions...")
        self.tender_submissions = self.tender_gen.generate_tender_submissions(
            self.org_id,
            self.tenders,
            supplier_companies,
            submissions_per_tender=3
        )
        print(f"   ✅ Generated {len(self.tender_submissions)} tender submissions")
        
        # 4. Generate tender documents
        print(f"\n📊 Generating tender documents...")
        self.tender_documents = self.tender_gen.generate_tender_documents(
            self.org_id,
            self.tenders
        )
        print(f"   ✅ Generated {len(self.tender_documents)} tender documents")
        
        # 5. Generate tax filings
        print(f"\n📊 Generating {tax_filing_count} tax filings...")
        self.tax_filings = self.tax_gen.generate_tax_filings(
            self.org_id,
            self.companies,
            filings_per_company=3
        )
        print(f"   ✅ Generated {len(self.tax_filings)} tax filings")
        
        # 6. Generate tax filing documents
        print(f"\n📊 Generating tax filing documents...")
        self.tax_filing_documents = self.tax_gen.generate_tax_filing_documents(
            self.org_id,
            self.tax_filings
        )
        print(f"   ✅ Generated {len(self.tax_filing_documents)} tax filing documents")
        
        # 7. Generate disclosures
        print(f"\n📊 Generating {disclosure_count} disclosures...")
        self.disclosures = self.tax_gen.generate_disclosures(
            self.org_id,
            self.companies,
            disclosures_per_company=2
        )
        print(f"   ✅ Generated {len(self.disclosures)} disclosures")
        
        # 8. Generate disclosure documents
        print(f"\n📊 Generating disclosure documents...")
        self.disclosure_documents = self.tax_gen.generate_disclosure_documents(
            self.org_id,
            self.disclosures
        )
        print(f"   ✅ Generated {len(self.disclosure_documents)} disclosure documents")
        
        # 9. Generate shipments
        print(f"\n📊 Generating {shipment_count} shipments...")
        self.shipments = self.shipping_gen.generate_shipments(
            self.org_id,
            self.companies,
            created_by=self.user_id,
            count=shipment_count
        )
        print(f"   ✅ Generated {len(self.shipments)} shipments")
        
        # 10. Generate shipment invoices
        print(f"\n📊 Generating shipment invoices...")
        self.shipment_invoices = self.shipping_gen.generate_shipment_invoices(
            self.org_id,
            self.shipments
        )
        print(f"   ✅ Generated {len(self.shipment_invoices)} shipment invoices")
        
        # 11. Generate employees
        print(f"\n📊 Generating {employee_count} employees...")
        self.employees = self.employee_gen.generate_employees(
            self.org_id,
            count=employee_count
        )
        print(f"   ✅ Generated {len(self.employees)} employees")
        
        # 12. Generate HR submissions
        print(f"\n📊 Generating HR submissions...")
        self.hr_submissions = self.employee_gen.generate_hr_submissions(
            self.org_id,
            self.employees,
            created_by=self.user_id,
            submissions_per_employee=2
        )
        print(f"   ✅ Generated {len(self.hr_submissions)} HR submissions")
        
        # Calculate total
        total = (
            len(self.companies) +
            len(self.tenders) +
            len(self.tender_submissions) +
            len(self.tender_documents) +
            len(self.tax_filings) +
            len(self.tax_filing_documents) +
            len(self.disclosures) +
            len(self.disclosure_documents) +
            len(self.shipments) +
            len(self.shipment_invoices) +
            len(self.employees) +
            len(self.hr_submissions)
        )
        
        print(f"\n📦 Total entities generated: {total}")
        return total
    
    def seed_database(self, supabase):
        """Insert all generated data into Supabase."""
        print("\n💾 Seeding database...")
        print("=" * 60)
        
        total_inserted = 0
        
        # Helper function to insert batch
        def insert_batch(table_name: str, items: list, batch_size: int = 100):
            nonlocal total_inserted
            if not items:
                return
            
            # Convert dataclasses to dicts and add seed_run_id
            dicts = []
            for item in items:
                d = self.company_gen.to_dict(item) if hasattr(item, 'id') else item
                if isinstance(d, dict):
                    d['seed_run_id'] = self.scenario_run_id
                dicts.append(d)
            
            # Insert in batches
            for i in range(0, len(dicts), batch_size):
                batch = dicts[i:i + batch_size]
                try:
                    result = supabase.table(table_name).insert(batch).execute()
                    total_inserted += len(result.data)
                    print(f"   ✅ Inserted {len(result.data)} records into {table_name}")
                except Exception as e:
                    print(f"   ❌ Error inserting into {table_name}: {e}")
        
        # Insert all entities
        insert_batch('companies', self.companies)
        insert_batch('tenders', self.tenders)
        insert_batch('tender_submissions', self.tender_submissions)
        insert_batch('tender_documents', self.tender_documents)
        insert_batch('tax_filings', self.tax_filings)
        insert_batch('tax_filing_documents', self.tax_filing_documents)
        insert_batch('disclosures', self.disclosures)
        insert_batch('disclosure_documents', self.disclosure_documents)
        insert_batch('shipments', self.shipments)
        insert_batch('shipment_invoices', self.shipment_invoices)
        insert_batch('employees', self.employees)
        insert_batch('hr_submissions', self.hr_submissions)
        
        print(f"\n✅ Total records inserted: {total_inserted}")
        return total_inserted
    
    def save_fixtures(self, output_dir: str = './fixtures'):
        """Save generated data as JSON fixtures."""
        print(f"\n💾 Saving fixtures to {output_dir}...")
        
        Path(output_dir).mkdir(parents=True, exist_ok=True)
        
        fixtures = {
            'companies.json': [self.company_gen.to_dict(c) for c in self.companies],
            'tenders.json': [self.company_gen.to_dict(t) for t in self.tenders],
            'tender_submissions.json': [self.company_gen.to_dict(s) for s in self.tender_submissions],
            'tender_documents.json': [self.company_gen.to_dict(d) for d in self.tender_documents],
            'tax_filings.json': [self.company_gen.to_dict(t) for t in self.tax_filings],
            'tax_filing_documents.json': [self.company_gen.to_dict(d) for d in self.tax_filing_documents],
            'disclosures.json': [self.company_gen.to_dict(d) for d in self.disclosures],
            'disclosure_documents.json': [self.company_gen.to_dict(d) for d in self.disclosure_documents],
            'shipments.json': [self.company_gen.to_dict(s) for s in self.shipments],
            'shipment_invoices.json': [self.company_gen.to_dict(i) for i in self.shipment_invoices],
            'employees.json': [self.company_gen.to_dict(e) for e in self.employees],
            'hr_submissions.json': [self.company_gen.to_dict(h) for h in self.hr_submissions],
        }
        
        for filename, data in fixtures.items():
            filepath = Path(output_dir) / filename
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print(f"   ✅ Saved {filename} ({len(data)} records)")
        
        print(f"\n✅ All fixtures saved to {output_dir}")


def main():
    parser = argparse.ArgumentParser(
        description='Seed Portal-Gym database with realistic German test data',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Basic usage
  python seed.py --org-id <uuid> --user-id <uuid>
  
  # Custom counts
  python seed.py --org-id <uuid> --user-id <uuid> --companies 20 --tenders 100
  
  # Fixtures only (no database)
  python seed.py --fixtures-only --output-dir ./fixtures
  
  # Reproducible data
  python seed.py --org-id <uuid> --user-id <uuid> --seed 12345
        """
    )
    
    # Required arguments
    parser.add_argument('--org-id', type=str, help='Organization UUID')
    parser.add_argument('--user-id', type=str, help='User UUID (created_by)')
    
    # Optional count arguments
    parser.add_argument('--companies', type=int, default=10, help='Number of companies (default: 10)')
    parser.add_argument('--tenders', type=int, default=50, help='Number of tenders (default: 50)')
    parser.add_argument('--tax-filings', type=int, default=30, help='Number of tax filings (default: 30)')
    parser.add_argument('--disclosures', type=int, default=20, help='Number of disclosures (default: 20)')
    parser.add_argument('--shipments', type=int, default=30, help='Number of shipments (default: 30)')
    parser.add_argument('--employees', type=int, default=20, help='Number of employees (default: 20)')
    
    # Other options
    parser.add_argument('--seed', type=int, default=None, help='Random seed for reproducible data')
    parser.add_argument('--fixtures-only', action='store_true', help='Only generate fixtures, skip database')
    parser.add_argument('--output-dir', type=str, default='./fixtures', help='Output directory for fixtures')
    
    args = parser.parse_args()
    
    # Validate arguments
    if not args.fixtures_only and (not args.org_id or not args.user_id):
        parser.error("--org-id and --user-id are required unless using --fixtures-only")
    
    print("\n" + "=" * 60)
    print("🚀 Portal-Gym Database Seeder")
    print("=" * 60)
    
    # Create seeder
    seeder = DatabaseSeeder(
        org_id=args.org_id or '00000000-0000-0000-0000-000000000000',
        user_id=args.user_id or '00000000-0000-0000-0000-000000000000',
        seed=args.seed
    )
    
    # Generate all data
    total = seeder.generate_all_data(
        company_count=args.companies,
        tender_count=args.tenders,
        tax_filing_count=args.tax_filings,
        disclosure_count=args.disclosures,
        shipment_count=args.shipments,
        employee_count=args.employees
    )
    
    # Save fixtures
    seeder.save_fixtures(args.output_dir)
    
    # Seed database if not fixtures-only
    if not args.fixtures_only:
        supabase = get_supabase_client()
        seeder.create_scenario_run(supabase)
        inserted = seeder.seed_database(supabase)
        seeder.update_scenario_run(supabase, inserted)
        
        print("\n" + "=" * 60)
        print("✅ Database seeding completed successfully!")
        print("=" * 60)
        print(f"\nScenario Run ID: {seeder.scenario_run_id}")
        print(f"Total Records: {inserted}")
        print(f"\nYou can now view the data in the Portal-Gym dashboard.")
    else:
        print("\n" + "=" * 60)
        print("✅ Fixtures generated successfully!")
        print("=" * 60)
        print(f"\nFixtures saved to: {args.output_dir}")
        print("No database changes were made (--fixtures-only mode)")


if __name__ == '__main__':
    main()
