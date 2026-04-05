-- Portal Modules: Logistics, Marketplace, HR
-- Created: 2026-04-05
-- Description: Domain-specific portal tables for browser agent benchmark expansion

-- ============================================
-- LOGISTICS / SHIPPING TABLES
-- ============================================

CREATE TABLE shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    tracking_number TEXT NOT NULL,
    carrier TEXT NOT NULL CHECK (carrier IN ('dhl', 'ups', 'fedex', 'dpd')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'booked', 'in_transit', 'delivered', 'failed')),
    origin JSONB NOT NULL DEFAULT '{}',       -- { name, street, city, zip, country }
    destination JSONB NOT NULL DEFAULT '{}',  -- { name, street, city, zip, country }
    weight_kg NUMERIC(8, 2),
    service_type TEXT NOT NULL DEFAULT 'standard' CHECK (service_type IN ('standard', 'express', 'overnight', 'economy')),
    pickup_date DATE,
    estimated_delivery DATE,
    actual_delivery DATE,
    notes TEXT,
    seed_run_id UUID,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE shipment_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'EUR',
    issued_date DATE NOT NULL,
    storage_path TEXT,
    seed_run_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- MARKETPLACE BACK-OFFICE TABLES
-- ============================================

CREATE TABLE marketplace_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    marketplace TEXT NOT NULL CHECK (marketplace IN ('amazon', 'ebay', 'otto')),
    external_id TEXT NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    price NUMERIC(10, 2) NOT NULL,
    stock_qty INTEGER NOT NULL DEFAULT 0,
    seed_run_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE marketplace_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    marketplace TEXT NOT NULL CHECK (marketplace IN ('amazon', 'ebay', 'otto')),
    order_number TEXT NOT NULL,
    listing_id UUID REFERENCES marketplace_listings(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    total_amount NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'EUR',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'shipped', 'delivered', 'returned', 'refunded')),
    customer_name TEXT NOT NULL,
    ordered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    seed_run_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE marketplace_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    marketplace TEXT NOT NULL CHECK (marketplace IN ('amazon', 'ebay', 'otto')),
    report_type TEXT NOT NULL CHECK (report_type IN ('orders', 'payments', 'performance')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    storage_path TEXT,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    seed_run_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- HR / EMPLOYER SERVICES TABLES
-- ============================================

CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_number TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    position TEXT NOT NULL,
    department TEXT NOT NULL,
    hire_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'terminated')),
    seed_run_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE hr_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    submission_type TEXT NOT NULL CHECK (submission_type IN ('sick_note', 'kurzarbeit', 'hiring_support')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'in_review', 'approved', 'rejected')),
    reference_number TEXT,         -- auto-generated on submit
    submitted_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}',  -- type-specific form fields
    notes TEXT,
    seed_run_id UUID,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Shipments
CREATE INDEX idx_shipments_org_id ON shipments(org_id);
CREATE INDEX idx_shipments_status ON shipments(status);
CREATE INDEX idx_shipments_carrier ON shipments(carrier);
CREATE INDEX idx_shipments_tracking_number ON shipments(tracking_number);
CREATE INDEX idx_shipments_seed_run_id ON shipments(seed_run_id) WHERE seed_run_id IS NOT NULL;

-- Shipment invoices
CREATE INDEX idx_shipment_invoices_org_id ON shipment_invoices(org_id);
CREATE INDEX idx_shipment_invoices_shipment_id ON shipment_invoices(shipment_id);
CREATE INDEX idx_shipment_invoices_seed_run_id ON shipment_invoices(seed_run_id) WHERE seed_run_id IS NOT NULL;

-- Marketplace listings
CREATE INDEX idx_marketplace_listings_org_id ON marketplace_listings(org_id);
CREATE INDEX idx_marketplace_listings_marketplace ON marketplace_listings(marketplace);
CREATE INDEX idx_marketplace_listings_status ON marketplace_listings(status);
CREATE INDEX idx_marketplace_listings_seed_run_id ON marketplace_listings(seed_run_id) WHERE seed_run_id IS NOT NULL;

-- Marketplace orders
CREATE INDEX idx_marketplace_orders_org_id ON marketplace_orders(org_id);
CREATE INDEX idx_marketplace_orders_marketplace ON marketplace_orders(marketplace);
CREATE INDEX idx_marketplace_orders_status ON marketplace_orders(status);
CREATE INDEX idx_marketplace_orders_listing_id ON marketplace_orders(listing_id);
CREATE INDEX idx_marketplace_orders_ordered_at ON marketplace_orders(ordered_at DESC);
CREATE INDEX idx_marketplace_orders_seed_run_id ON marketplace_orders(seed_run_id) WHERE seed_run_id IS NOT NULL;

-- Marketplace reports
CREATE INDEX idx_marketplace_reports_org_id ON marketplace_reports(org_id);
CREATE INDEX idx_marketplace_reports_marketplace ON marketplace_reports(marketplace);
CREATE INDEX idx_marketplace_reports_seed_run_id ON marketplace_reports(seed_run_id) WHERE seed_run_id IS NOT NULL;

-- Employees
CREATE INDEX idx_employees_org_id ON employees(org_id);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_seed_run_id ON employees(seed_run_id) WHERE seed_run_id IS NOT NULL;

-- HR submissions
CREATE INDEX idx_hr_submissions_org_id ON hr_submissions(org_id);
CREATE INDEX idx_hr_submissions_employee_id ON hr_submissions(employee_id);
CREATE INDEX idx_hr_submissions_status ON hr_submissions(status);
CREATE INDEX idx_hr_submissions_submission_type ON hr_submissions(submission_type);
CREATE INDEX idx_hr_submissions_seed_run_id ON hr_submissions(seed_run_id) WHERE seed_run_id IS NOT NULL;

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipment_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_submissions ENABLE ROW LEVEL SECURITY;

-- Shipments
CREATE POLICY "Members can view org shipments" ON shipments
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = shipments.org_id AND memberships.user_id = auth.uid())
    );

CREATE POLICY "Members can create shipments" ON shipments
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = shipments.org_id AND memberships.user_id = auth.uid())
    );

CREATE POLICY "Members can update shipments" ON shipments
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = shipments.org_id AND memberships.user_id = auth.uid())
    );

CREATE POLICY "Admins can delete shipments" ON shipments
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = shipments.org_id AND memberships.user_id = auth.uid() AND memberships.role = 'admin')
    );

-- Shipment invoices
CREATE POLICY "Members can view shipment invoices" ON shipment_invoices
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = shipment_invoices.org_id AND memberships.user_id = auth.uid())
    );

CREATE POLICY "Members can create shipment invoices" ON shipment_invoices
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = shipment_invoices.org_id AND memberships.user_id = auth.uid())
    );

CREATE POLICY "Admins can delete shipment invoices" ON shipment_invoices
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = shipment_invoices.org_id AND memberships.user_id = auth.uid() AND memberships.role = 'admin')
    );

-- Marketplace listings
CREATE POLICY "Members can view marketplace listings" ON marketplace_listings
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = marketplace_listings.org_id AND memberships.user_id = auth.uid())
    );

CREATE POLICY "Members can create marketplace listings" ON marketplace_listings
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = marketplace_listings.org_id AND memberships.user_id = auth.uid())
    );

CREATE POLICY "Members can update marketplace listings" ON marketplace_listings
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = marketplace_listings.org_id AND memberships.user_id = auth.uid())
    );

CREATE POLICY "Admins can delete marketplace listings" ON marketplace_listings
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = marketplace_listings.org_id AND memberships.user_id = auth.uid() AND memberships.role = 'admin')
    );

-- Marketplace orders
CREATE POLICY "Members can view marketplace orders" ON marketplace_orders
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = marketplace_orders.org_id AND memberships.user_id = auth.uid())
    );

CREATE POLICY "Members can create marketplace orders" ON marketplace_orders
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = marketplace_orders.org_id AND memberships.user_id = auth.uid())
    );

CREATE POLICY "Members can update marketplace orders" ON marketplace_orders
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = marketplace_orders.org_id AND memberships.user_id = auth.uid())
    );

CREATE POLICY "Admins can delete marketplace orders" ON marketplace_orders
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = marketplace_orders.org_id AND memberships.user_id = auth.uid() AND memberships.role = 'admin')
    );

-- Marketplace reports
CREATE POLICY "Members can view marketplace reports" ON marketplace_reports
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = marketplace_reports.org_id AND memberships.user_id = auth.uid())
    );

CREATE POLICY "Members can create marketplace reports" ON marketplace_reports
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = marketplace_reports.org_id AND memberships.user_id = auth.uid())
    );

CREATE POLICY "Admins can delete marketplace reports" ON marketplace_reports
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = marketplace_reports.org_id AND memberships.user_id = auth.uid() AND memberships.role = 'admin')
    );

-- Employees
CREATE POLICY "Members can view employees" ON employees
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = employees.org_id AND memberships.user_id = auth.uid())
    );

CREATE POLICY "Members can create employees" ON employees
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = employees.org_id AND memberships.user_id = auth.uid())
    );

CREATE POLICY "Members can update employees" ON employees
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = employees.org_id AND memberships.user_id = auth.uid())
    );

CREATE POLICY "Admins can delete employees" ON employees
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = employees.org_id AND memberships.user_id = auth.uid() AND memberships.role = 'admin')
    );

-- HR submissions
CREATE POLICY "Members can view hr submissions" ON hr_submissions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = hr_submissions.org_id AND memberships.user_id = auth.uid())
    );

CREATE POLICY "Members can create hr submissions" ON hr_submissions
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = hr_submissions.org_id AND memberships.user_id = auth.uid())
    );

CREATE POLICY "Members can update hr submissions" ON hr_submissions
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = hr_submissions.org_id AND memberships.user_id = auth.uid())
    );

CREATE POLICY "Admins can delete hr submissions" ON hr_submissions
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = hr_submissions.org_id AND memberships.user_id = auth.uid() AND memberships.role = 'admin')
    );

-- ============================================
-- TRIGGERS (updated_at)
-- ============================================

CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON shipments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketplace_listings_updated_at BEFORE UPDATE ON marketplace_listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketplace_orders_updated_at BEFORE UPDATE ON marketplace_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hr_submissions_updated_at BEFORE UPDATE ON hr_submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
