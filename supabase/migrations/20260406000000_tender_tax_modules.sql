-- Portal Modules: Tender Desk (Public Procurement) & Tax/Disclosure (ELSTER/Bundesanzeiger)
-- Created: 2026-04-06
-- Description: German public procurement and tax portal simulation tables

-- ============================================
-- TENDER DESK MODULE (Public Procurement)
-- ============================================

-- Companies table (shared across Tender and Tax modules)
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    legal_form TEXT NOT NULL CHECK (legal_form IN ('GmbH', 'AG', 'KG', 'OHG', 'UG', 'e.K.', 'eG')),
    vat_id TEXT, -- DE123456789 format
    tax_number TEXT, -- German Steuernummer format
    street TEXT NOT NULL,
    postcode TEXT NOT NULL, -- 5 digits
    city TEXT NOT NULL,
    state TEXT NOT NULL CHECK (state IN ('BW', 'BY', 'BE', 'BB', 'HB', 'HH', 'HE', 'MV', 'NI', 'NW', 'RP', 'SL', 'SN', 'ST', 'SH', 'TH')),
    country TEXT NOT NULL DEFAULT 'DE',
    phone TEXT,
    email TEXT,
    website TEXT,
    registration_court TEXT, -- e.g., "Amtsgericht Berlin"
    hrb_number TEXT, -- Handelsregisternummer
    is_buyer BOOLEAN NOT NULL DEFAULT false, -- Can publish tenders
    is_supplier BOOLEAN NOT NULL DEFAULT true, -- Can submit bids
    seed_run_id UUID REFERENCES scenario_runs(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tenders table (public procurement notices)
CREATE TABLE tenders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    buyer_company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    
    -- Tender identification
    tender_id TEXT NOT NULL UNIQUE, -- e.g., "TD-2024-001234"
    title TEXT NOT NULL,
    description TEXT,
    
    -- Classification
    cpv_codes TEXT[], -- Common Procurement Vocabulary codes
    tender_type TEXT NOT NULL CHECK (tender_type IN ('open', 'restricted', 'negotiated')),
    
    -- Financial
    estimated_value NUMERIC(12, 2),
    currency TEXT NOT NULL DEFAULT 'EUR',
    
    -- Dates
    publish_date DATE NOT NULL,
    deadline_date DATE NOT NULL,
    award_date DATE,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'open', 'closing_soon', 'closed', 'awarded', 'cancelled')),
    
    -- Contact
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    
    -- Documents
    document_count INTEGER NOT NULL DEFAULT 0,
    
    seed_run_id UUID REFERENCES scenario_runs(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tender submissions (bids)
CREATE TABLE tender_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    supplier_company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    
    -- Submission details
    submission_reference TEXT, -- e.g., "BID-2024-5678"
    bid_amount NUMERIC(12, 2),
    currency TEXT NOT NULL DEFAULT 'EUR',
    
    -- Status
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'accepted', 'rejected')),
    
    -- Content
    technical_proposal TEXT,
    financial_proposal TEXT,
    
    -- Dates
    submitted_at TIMESTAMPTZ,
    
    seed_run_id UUID REFERENCES scenario_runs(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tender documents (attachments)
CREATE TABLE tender_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    tender_id UUID NOT NULL REFERENCES tenders(id) ON DELETE CASCADE,
    
    document_type TEXT NOT NULL CHECK (document_type IN ('specification', 'contract_terms', 'q_and_a', 'submission_template')),
    name TEXT NOT NULL,
    description TEXT,
    storage_path TEXT, -- Supabase storage path
    file_size INTEGER,
    mime_type TEXT,
    
    seed_run_id UUID REFERENCES scenario_runs(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- TAX & DISCLOSURE MODULE (ELSTER/Bundesanzeiger)
-- ============================================

-- Tax filings (ELSTER-style)
CREATE TABLE tax_filings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Filing identification
    filing_reference TEXT NOT NULL UNIQUE, -- e.g., "USt-2024-001"
    filing_type TEXT NOT NULL CHECK (filing_type IN ('USt-Voranmeldung', 'USt-Erklärung', 'Gewerbesteuer', 'Körperschaftsteuer')),
    
    -- Period
    filing_period TEXT NOT NULL, -- "03/2024" format
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Financial data
    revenue NUMERIC(15, 2),
    vat_amount NUMERIC(15, 2),
    tax_payable NUMERIC(15, 2),
    
    -- Status
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'accepted', 'rejected', 'correction_needed')),
    
    -- ELSTER-specific
    elster_tax_number TEXT, -- Transmitter tax number
    certificate_id TEXT, -- ELSTER certificate reference
    
    -- Dates
    submitted_at TIMESTAMPTZ,
    due_date DATE NOT NULL,
    
    seed_run_id UUID REFERENCES scenario_runs(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tax filing documents (attachments)
CREATE TABLE tax_filing_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    tax_filing_id UUID NOT NULL REFERENCES tax_filings(id) ON DELETE CASCADE,
    
    document_type TEXT NOT NULL CHECK (document_type IN ('receipt', 'invoice_summary', 'bank_statement', 'calculation_sheet')),
    name TEXT NOT NULL,
    description TEXT,
    storage_path TEXT,
    file_size INTEGER,
    mime_type TEXT,
    
    seed_run_id UUID REFERENCES scenario_runs(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Disclosures (Bundesanzeiger/Unternehmensregister)
CREATE TABLE disclosures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Disclosure details
    disclosure_reference TEXT NOT NULL UNIQUE, -- e.g., "HB-2024-001"
    disclosure_type TEXT NOT NULL CHECK (disclosure_type IN ('annual_financial_statements', 'change_notification', 'insolvency', 'merger')),
    
    -- Content
    title TEXT NOT NULL,
    description TEXT,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'published', 'rejected')),
    
    -- Publication
    publication_date DATE,
    bundesanzeiger_id TEXT, -- Reference number from Bundesanzeiger
    
    -- Documents
    document_count INTEGER NOT NULL DEFAULT 0,
    
    seed_run_id UUID REFERENCES scenario_runs(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Disclosure documents
CREATE TABLE disclosure_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    disclosure_id UUID NOT NULL REFERENCES disclosures(id) ON DELETE CASCADE,
    
    document_type TEXT NOT NULL CHECK (document_type IN ('financial_statement', 'management_report', 'audit_opinion')),
    name TEXT NOT NULL,
    description TEXT,
    storage_path TEXT,
    file_size INTEGER,
    mime_type TEXT,
    
    seed_run_id UUID REFERENCES scenario_runs(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Companies
CREATE INDEX idx_companies_org_id ON companies(org_id);
CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_vat_id ON companies(vat_id) WHERE vat_id IS NOT NULL;
CREATE INDEX idx_companies_is_buyer ON companies(is_buyer) WHERE is_buyer = true;
CREATE INDEX idx_companies_is_supplier ON companies(is_supplier) WHERE is_supplier = true;
CREATE INDEX idx_companies_seed_run_id ON companies(seed_run_id) WHERE seed_run_id IS NOT NULL;

-- Tenders
CREATE INDEX idx_tenders_org_id ON tenders(org_id);
CREATE INDEX idx_tenders_buyer_company_id ON tenders(buyer_company_id);
CREATE INDEX idx_tenders_status ON tenders(status);
CREATE INDEX idx_tenders_tender_type ON tenders(tender_type);
CREATE INDEX idx_tenders_deadline_date ON tenders(deadline_date);
CREATE INDEX idx_tenders_publish_date ON tenders(publish_date DESC);
CREATE INDEX idx_tenders_seed_run_id ON tenders(seed_run_id) WHERE seed_run_id IS NOT NULL;

-- Tender submissions
CREATE INDEX idx_tender_submissions_org_id ON tender_submissions(org_id);
CREATE INDEX idx_tender_submissions_tender_id ON tender_submissions(tender_id);
CREATE INDEX idx_tender_submissions_supplier_company_id ON tender_submissions(supplier_company_id);
CREATE INDEX idx_tender_submissions_status ON tender_submissions(status);
CREATE INDEX idx_tender_submissions_seed_run_id ON tender_submissions(seed_run_id) WHERE seed_run_id IS NOT NULL;

-- Tender documents
CREATE INDEX idx_tender_documents_org_id ON tender_documents(org_id);
CREATE INDEX idx_tender_documents_tender_id ON tender_documents(tender_id);
CREATE INDEX idx_tender_documents_seed_run_id ON tender_documents(seed_run_id) WHERE seed_run_id IS NOT NULL;

-- Tax filings
CREATE INDEX idx_tax_filings_org_id ON tax_filings(org_id);
CREATE INDEX idx_tax_filings_company_id ON tax_filings(company_id);
CREATE INDEX idx_tax_filings_status ON tax_filings(status);
CREATE INDEX idx_tax_filings_filing_type ON tax_filings(filing_type);
CREATE INDEX idx_tax_filings_due_date ON tax_filings(due_date);
CREATE INDEX idx_tax_filings_period_start ON tax_filings(period_start DESC);
CREATE INDEX idx_tax_filings_seed_run_id ON tax_filings(seed_run_id) WHERE seed_run_id IS NOT NULL;

-- Tax filing documents
CREATE INDEX idx_tax_filing_documents_org_id ON tax_filing_documents(org_id);
CREATE INDEX idx_tax_filing_documents_tax_filing_id ON tax_filing_documents(tax_filing_id);
CREATE INDEX idx_tax_filing_documents_seed_run_id ON tax_filing_documents(seed_run_id) WHERE seed_run_id IS NOT NULL;

-- Disclosures
CREATE INDEX idx_disclosures_org_id ON disclosures(org_id);
CREATE INDEX idx_disclosures_company_id ON disclosures(company_id);
CREATE INDEX idx_disclosures_status ON disclosures(status);
CREATE INDEX idx_disclosures_disclosure_type ON disclosures(disclosure_type);
CREATE INDEX idx_disclosures_publication_date ON disclosures(publication_date DESC);
CREATE INDEX idx_disclosures_seed_run_id ON disclosures(seed_run_id) WHERE seed_run_id IS NOT NULL;

-- Disclosure documents
CREATE INDEX idx_disclosure_documents_org_id ON disclosure_documents(org_id);
CREATE INDEX idx_disclosure_documents_disclosure_id ON disclosure_documents(disclosure_id);
CREATE INDEX idx_disclosure_documents_seed_run_id ON disclosure_documents(seed_run_id) WHERE seed_run_id IS NOT NULL;

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tender_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tender_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_filings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_filing_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE disclosures ENABLE ROW LEVEL SECURITY;
ALTER TABLE disclosure_documents ENABLE ROW LEVEL SECURITY;

-- Companies
CREATE POLICY "Members can view org companies" ON companies
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = companies.org_id AND memberships.user_id = auth.uid())
    );

CREATE POLICY "Members can create companies" ON companies
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = companies.org_id AND memberships.user_id = auth.uid())
    );

CREATE POLICY "Members can update companies" ON companies
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = companies.org_id AND memberships.user_id = auth.uid())
    );

CREATE POLICY "Admins can delete companies" ON companies
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = companies.org_id AND memberships.user_id = auth.uid() AND memberships.role = 'admin')
    );

-- Tenders
CREATE POLICY "Members can view org tenders" ON tenders
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = tenders.org_id AND memberships.user_id = auth.uid())
    );

CREATE POLICY "Members can create tenders" ON tenders
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = tenders.org_id AND memberships.user_id = auth.uid())
    );

CREATE POLICY "Members can update tenders" ON tenders
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = tenders.org_id AND memberships.user_id = auth.uid())
    );

CREATE POLICY "Admins can delete tenders" ON tenders
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = tenders.org_id AND memberships.user_id = auth.uid() AND memberships.role = 'admin')
    );

-- Tender submissions
CREATE POLICY "Members can view tender submissions" ON tender_submissions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = tender_submissions.org_id AND memberships.user_id = auth.uid())
    );

CREATE POLICY "Members can create tender submissions" ON tender_submissions
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = tender_submissions.org_id AND memberships.user_id = auth.uid())
    );

CREATE POLICY "Members can update tender submissions" ON tender_submissions
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = tender_submissions.org_id AND memberships.user_id = auth.uid())
    );

CREATE POLICY "Admins can delete tender submissions" ON tender_submissions
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = tender_submissions.org_id AND memberships.user_id = auth.uid() AND memberships.role = 'admin')
    );

-- Tender documents
CREATE POLICY "Members can view tender documents" ON tender_documents
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = tender_documents.org_id AND memberships.user_id = auth.uid())
    );

CREATE POLICY "Members can create tender documents" ON tender_documents
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = tender_documents.org_id AND memberships.user_id = auth.uid())
    );

CREATE POLICY "Admins can delete tender documents" ON tender_documents
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = tender_documents.org_id AND memberships.user_id = auth.uid() AND memberships.role = 'admin')
    );

-- Tax filings
CREATE POLICY "Members can view tax filings" ON tax_filings
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = tax_filings.org_id AND memberships.user_id = auth.uid())
    );

CREATE POLICY "Members can create tax filings" ON tax_filings
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = tax_filings.org_id AND memberships.user_id = auth.uid())
    );

CREATE POLICY "Members can update tax filings" ON tax_filings
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = tax_filings.org_id AND memberships.user_id = auth.uid())
    );

CREATE POLICY "Admins can delete tax filings" ON tax_filings
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = tax_filings.org_id AND memberships.user_id = auth.uid() AND memberships.role = 'admin')
    );

-- Tax filing documents
CREATE POLICY "Members can view tax filing documents" ON tax_filing_documents
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = tax_filing_documents.org_id AND memberships.user_id = auth.uid())
    );

CREATE POLICY "Members can create tax filing documents" ON tax_filing_documents
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = tax_filing_documents.org_id AND memberships.user_id = auth.uid())
    );

CREATE POLICY "Admins can delete tax filing documents" ON tax_filing_documents
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = tax_filing_documents.org_id AND memberships.user_id = auth.uid() AND memberships.role = 'admin')
    );

-- Disclosures
CREATE POLICY "Members can view disclosures" ON disclosures
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = disclosures.org_id AND memberships.user_id = auth.uid())
    );

CREATE POLICY "Members can create disclosures" ON disclosures
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = disclosures.org_id AND memberships.user_id = auth.uid())
    );

CREATE POLICY "Members can update disclosures" ON disclosures
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = disclosures.org_id AND memberships.user_id = auth.uid())
    );

CREATE POLICY "Admins can delete disclosures" ON disclosures
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = disclosures.org_id AND memberships.user_id = auth.uid() AND memberships.role = 'admin')
    );

-- Disclosure documents
CREATE POLICY "Members can view disclosure documents" ON disclosure_documents
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = disclosure_documents.org_id AND memberships.user_id = auth.uid())
    );

CREATE POLICY "Members can create disclosure documents" ON disclosure_documents
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = disclosure_documents.org_id AND memberships.user_id = auth.uid())
    );

CREATE POLICY "Admins can delete disclosure documents" ON disclosure_documents
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = disclosure_documents.org_id AND memberships.user_id = auth.uid() AND memberships.role = 'admin')
    );

-- ============================================
-- TRIGGERS (updated_at)
-- ============================================

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenders_updated_at BEFORE UPDATE ON tenders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tender_submissions_updated_at BEFORE UPDATE ON tender_submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tender_documents_updated_at BEFORE UPDATE ON tender_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_filings_updated_at BEFORE UPDATE ON tax_filings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_filing_documents_updated_at BEFORE UPDATE ON tax_filing_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_disclosures_updated_at BEFORE UPDATE ON disclosures
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_disclosure_documents_updated_at BEFORE UPDATE ON disclosure_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
