# Test Data Setup Guide

This guide explains how to set up and use the test data infrastructure for browser-gym.

## Overview

The test data system provides:
- **709+ realistic German business records** across 3 portal types
- **Faker-based generators** with German localization (`de_DE`)
- **UV Python environment** for dependency management
- **Database seeding** to load data into Supabase
- **Mock API server** for testing without real systems
- **Playwright integration** for automated browser testing

## Quick Start

```bash
# 1. Setup UV environment and generate data
npm run data:setup

# 2. Seed the database (requires org_id and user_id)
npm run data:seed -- --org-id <uuid> --user-id <uuid>

# 3. Start the dev server
npm run dev
```

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run data:setup` | Setup UV environment and generate test data |
| `npm run data:generate` | Generate fresh test data |
| `npm run data:seed` | Load data into Supabase |
| `npm run data:check` | Check database status |
| `npm run data:mock` | Start mock API server |
| `npm run dev:full` | Seed database and start dev server |

## Python Scripts (Alternative)

If you prefer using UV directly:

```bash
# Generate test data
uv run python scripts/generate_data.py

# Seed database
uv run python scripts/seed.py --org-id <uuid> --user-id <uuid>

# Check database
uv run python scripts/check_db.py
```

## Data Structure

### Generated Records (709 total)

| Entity | Count | Description |
|--------|-------|-------------|
| Companies | 10 | German businesses with VAT IDs, tax numbers, HRB |
| Tenders | 50 | Public procurement tenders with CPV codes |
| Tender Submissions | 165 | Bid submissions from suppliers |
| Tender Documents | 180 | Technical/financial proposals |
| Tax Filings | 37 | ELSTER tax returns (USt-Voranmeldung, etc.) |
| Tax Filing Documents | 93 | Supporting documents |
| Disclosures | 25 | Bundesanzeiger disclosures |
| Disclosure Documents | 50 | Annual reports, financial statements |
| Shipments | 30 | DHL/UPS/FedEx/DPD shipments |
| Shipment Invoices | 23 | Freight invoices |
| Employees | 20 | German employees with tax IDs |
| HR Submissions | 26 | Kurzarbeit, sick notes, etc. |

### German Localization

All data uses authentic German identifiers:
- **VAT IDs**: `DE123456789` format
- **Tax Numbers**: `XXX/XXX/XXXX` format
- **HRB Numbers**: `HRB 123456` (Handelsregisternummer)
- **Addresses**: Real German street names, postal codes
- **IBANs**: German IBANs starting with `DE`
- **Legal Forms**: GmbH, AG, KG, OHG, etc.

## Database Seeding

### Prerequisites

1. **Supabase credentials** in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

2. **Organization and user** created in the database

### Seeding Options

**Option 1: With existing org/user**
```bash
npm run data:seed -- --org-id <uuid> --user-id <uuid>
```

**Option 2: Generate fixtures only (no database)**
```bash
uv run python scripts/seed.py --fixtures-only --output-dir ./fixtures
```

**Option 3: Custom counts**
```bash
uv run python scripts/seed.py \
  --org-id <uuid> \
  --user-id <uuid> \
  --companies 20 \
  --tenders 100 \
  --tax-filings 50
```

## Mock API Server

Start a local JSON server for testing:

```bash
npm run data:mock
```

This starts a server at `http://localhost:3002` with endpoints:
- `GET /api/companies`
- `GET /api/tenders`
- `GET /api/tax-filings`
- `GET /api/shipments`
- `GET /api/employees`

## Playwright Integration

Use test data in your Playwright tests:

```typescript
import { testData, FormHelpers } from './test-data-helpers';

test('tender submission workflow', async ({ page }) => {
  // Get random test data
  const company = testData.getRandomCompany();
  const tender = testData.getRandomTender();
  
  // Fill forms using helpers
  const formHelpers = new FormHelpers(page);
  await formHelpers.fillCompanyForm(company);
  await formHelpers.fillTenderForm(tender);
  
  // Query by relationships
  const submissions = testData.getSubmissionsForTender(tender.id);
  expect(submissions.length).toBeGreaterThan(0);
});
```

### Available Helpers

- `testData.getRandomCompany()` - Get random company
- `testData.getRandomTender()` - Get random tender
- `testData.getSubmissionsForTender(tenderId)` - Get submissions for tender
- `testData.getTaxFilingsForCompany(companyId)` - Get tax filings
- `testData.getShipmentsForCompany(companyId)` - Get shipments
- `testData.getEmployeesForOrg(orgId)` - Get employees
- `FormHelpers.fillCompanyForm(company)` - Auto-fill company form
- `FormHelpers.fillTenderForm(tender)` - Auto-fill tender form

## Project Structure

```
browser-gym/browser-agent-experimental/
├── pyproject.toml              # UV configuration
├── test-data/
│   ├── generators/             # Python generators
│   │   ├── companies.py        # GermanCompany generator
│   │   ├── tenders.py          # Tender generator
│   │   ├── tax.py              # TaxFiling generator
│   │   ├── shipping.py         # Shipment generator
│   │   └── employees.py        # Employee generator
│   ├── fixtures/               # 709 generated JSON files
│   └── mock-server/            # JSON server setup
├── scripts/
│   ├── generate_data.py        # Data generation entry point
│   ├── seed.py                 # Database seeding
│   └── check_db.py             # Database checker
└── playwright-tests/
    └── test-data-helpers.ts    # TypeScript test utilities
```

## Troubleshooting

### UV not installed
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Supabase connection errors
- Check `.env.local` has correct credentials
- Ensure you're using the correct key (anon vs service_role)
- Verify network access to Supabase project

### Missing fixtures
```bash
npm run data:generate
```

### Database permission errors
The seeding script requires appropriate Supabase permissions. If you get RLS errors:
1. Use service_role key for seeding
2. Or disable RLS temporarily for seeding
3. Or run seeding as an authenticated user with proper permissions

## Next Steps

1. **Generate test data**: `npm run data:setup`
2. **Create organization/user** via the web app
3. **Seed database**: `npm run data:seed -- --org-id <uuid> --user-id <uuid>`
4. **Start dev server**: `npm run dev`
5. **Access the app**: `http://localhost:3000/{org-slug}`

For AI agent testing, see `docs/AI_AGENT_GUIDE.md`.
