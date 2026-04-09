#!/usr/bin/env python3
"""
Generate all test data for browser-gym.

Usage:
    uv run python scripts/generate_data.py
    
This will generate 709+ realistic German business records and save them to test-data/fixtures/.
"""

import sys
import os
from pathlib import Path

# Add test-data to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'test-data'))

from generators.companies import CompanyGenerator
from generators.tenders import TenderGenerator
from generators.tax import TaxFilingGenerator
from generators.shipping import ShippingGenerator
from generators.employees import EmployeeGenerator


def main():
    """Generate all test data fixtures."""
    print("\n" + "=" * 70)
    print("🚀 Generating browser-gym test data...")
    print("=" * 70)
    
    # Generate in dependency order
    print("\n📊 Generating companies...")
    companies = CompanyGenerator().generate_companies(
        org_id="00000000-0000-0000-0000-000000000000",  # Placeholder
        count=10,
        buyer_ratio=0.3,
        supplier_ratio=0.7
    )
    print(f"   ✅ Generated {len(companies)} companies")
    
    print("\n📊 Generating tenders...")
    tender_gen = TenderGenerator()
    
    # Filter buyer companies for tenders
    buyer_companies = [c for c in companies if hasattr(c, 'is_buyer') and c.is_buyer]
    if not buyer_companies:
        buyer_companies = companies[:3]  # Use first 3 if no buyers marked
    
    tenders = tender_gen.generate_tenders(
        org_id="00000000-0000-0000-0000-000000000000",
        buyer_companies=buyer_companies,
        count=50
    )
    print(f"   ✅ Generated {len(tenders)} tenders")
    
    # Generate submissions for all tenders
    supplier_companies = [c for c in companies if hasattr(c, 'is_supplier') and c.is_supplier]
    if not supplier_companies:
        supplier_companies = companies[3:]  # Use remaining companies as suppliers
    
    submissions = tender_gen.generate_tender_submissions(
        org_id="00000000-0000-0000-0000-000000000000",
        tenders=tenders,
        supplier_companies=supplier_companies,
        submissions_per_tender=3
    )
    print(f"   ✅ Generated {len(submissions)} tender submissions")
    
    # Generate documents for all tenders
    documents = tender_gen.generate_tender_documents(
        org_id="00000000-0000-0000-0000-000000000000",
        tenders=tenders
    )
    print(f"   ✅ Generated {len(documents)} tender documents")
    
    print("\n📊 Generating tax filings...")
    tax_gen = TaxFilingGenerator()
    tax_filings = tax_gen.generate_tax_filings(
        org_id="00000000-0000-0000-0000-000000000000",
        companies=companies,
        filings_per_company=3
    )
    print(f"   ✅ Generated {len(tax_filings)} tax filings")
    
    # Generate tax filing documents
    tax_docs = tax_gen.generate_tax_filing_documents(
        org_id="00000000-0000-0000-0000-000000000000",
        tax_filings=tax_filings
    )
    print(f"   ✅ Generated {len(tax_docs)} tax filing documents")
    
    print("\n📊 Generating disclosures...")
    disclosures = tax_gen.generate_disclosures(
        org_id="00000000-0000-0000-0000-000000000000",
        companies=companies,
        disclosures_per_company=2
    )
    print(f"   ✅ Generated {len(disclosures)} disclosures")
    
    # Generate disclosure documents
    disclosure_docs = tax_gen.generate_disclosure_documents(
        org_id="00000000-0000-0000-0000-000000000000",
        disclosures=disclosures
    )
    print(f"   ✅ Generated {len(disclosure_docs)} disclosure documents")
    
    print("\n📊 Generating shipments...")
    shipping_gen = ShippingGenerator()
    shipments = shipping_gen.generate_shipments(
        org_id="00000000-0000-0000-0000-000000000000",
        companies=companies,
        created_by="00000000-0000-0000-0000-000000000000",
        count=30
    )
    print(f"   ✅ Generated {len(shipments)} shipments")
    
    # Generate shipment invoices
    invoices = shipping_gen.generate_shipment_invoices(
        org_id="00000000-0000-0000-0000-000000000000",
        shipments=shipments
    )
    print(f"   ✅ Generated {len(invoices)} shipment invoices")
    
    print("\n📊 Generating employees...")
    employee_gen = EmployeeGenerator()
    employees = employee_gen.generate_employees(
        org_id="00000000-0000-0000-0000-000000000000",
        count=20
    )
    print(f"   ✅ Generated {len(employees)} employees")
    
    # Generate HR submissions
    hr_subs = employee_gen.generate_hr_submissions(
        org_id="00000000-0000-0000-0000-000000000000",
        employees=employees,
        created_by="00000000-0000-0000-0000-000000000000",
        submissions_per_employee=2
    )
    print(f"   ✅ Generated {len(hr_subs)} HR submissions")
    
    # Calculate total
    total = (
        len(companies) + len(tenders) + len(submissions) + len(documents) +
        len(tax_filings) + len(tax_docs) + len(disclosures) + len(disclosure_docs) +
        len(shipments) + len(invoices) + len(employees) + len(hr_subs)
    )
    
    print("\n" + "=" * 70)
    print(f"🎉 Successfully generated {total} records!")
    print("=" * 70)
    print("\n📁 Data saved to test-data/fixtures/")
    print("\nNext steps:")
    print("  npm run data:seed    # Load into Supabase")
    print("  npm run data:mock    # Start mock API server")


if __name__ == "__main__":
    main()
