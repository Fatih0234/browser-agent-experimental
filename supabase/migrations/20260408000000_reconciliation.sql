-- Reconciliation Module: Cross-Portal Invoice & Report Reconciliation
-- Created: 2026-04-08
-- Description: Tracks reconciliation status of invoices across logistics and marketplace portals

CREATE TABLE reconciliation_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    -- Source: which portal this invoice came from
    invoice_source TEXT NOT NULL CHECK (invoice_source IN ('shipment', 'marketplace')),
    -- Polymorphic reference to shipment_invoices.id or marketplace_orders.id
    invoice_id UUID NOT NULL,
    -- Amount fields
    invoice_amount NUMERIC(10, 2) NOT NULL,
    expected_amount NUMERIC(10, 2),
    amount_delta NUMERIC(10, 2) GENERATED ALWAYS AS (
        CASE WHEN expected_amount IS NOT NULL THEN invoice_amount - expected_amount ELSE NULL END
    ) STORED,
    currency TEXT NOT NULL DEFAULT 'EUR',
    -- Match details
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'flagged', 'dismissed')),
    match_type TEXT CHECK (match_type IN ('exact', 'partial', 'estimated')),
    flagged_reason TEXT,
    notes TEXT,
    -- Who acted on this
    matched_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    matched_at TIMESTAMPTZ,
    -- Seed tracking
    seed_run_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_reconciliation_matches_org_id ON reconciliation_matches(org_id);
CREATE INDEX idx_reconciliation_matches_status ON reconciliation_matches(status);
CREATE INDEX idx_reconciliation_matches_invoice_source ON reconciliation_matches(invoice_source);
CREATE INDEX idx_reconciliation_matches_invoice_id ON reconciliation_matches(invoice_id);
CREATE INDEX idx_reconciliation_matches_seed_run_id ON reconciliation_matches(seed_run_id) WHERE seed_run_id IS NOT NULL;

-- Updated_at trigger
CREATE TRIGGER update_reconciliation_matches_updated_at
    BEFORE UPDATE ON reconciliation_matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE reconciliation_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org reconciliation matches" ON reconciliation_matches
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = reconciliation_matches.org_id AND memberships.user_id = auth.uid())
    );

CREATE POLICY "Members can create reconciliation matches" ON reconciliation_matches
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = reconciliation_matches.org_id AND memberships.user_id = auth.uid())
    );

CREATE POLICY "Members can update reconciliation matches" ON reconciliation_matches
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = reconciliation_matches.org_id AND memberships.user_id = auth.uid())
    );

CREATE POLICY "Admins can delete seeded reconciliation matches" ON reconciliation_matches
    FOR DELETE USING (
        seed_run_id IS NOT NULL AND
        EXISTS (SELECT 1 FROM memberships WHERE memberships.org_id = reconciliation_matches.org_id AND memberships.user_id = auth.uid() AND memberships.role = 'admin')
    );
