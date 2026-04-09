-- =============================================
-- CUSTOMS & EXPORT MODULE
-- Tables: customs_declarations, customs_documents, customs_exceptions
-- =============================================

-- customs_declarations: main customs entry record
CREATE TABLE customs_declarations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  reference_number TEXT NOT NULL DEFAULT (
    'ATL-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTR(gen_random_uuid()::TEXT, 1, 8))
  ),
  declaration_type TEXT NOT NULL CHECK (declaration_type IN ('export', 'import', 'transit')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'cleared', 'exception')),
  hs_code TEXT,
  commodity_description TEXT,
  quantity NUMERIC,
  unit_of_measure TEXT,
  declared_value_eur NUMERIC,
  currency TEXT NOT NULL DEFAULT 'EUR',
  origin_country TEXT,
  destination_country TEXT,
  transport_mode TEXT CHECK (transport_mode IN ('air', 'sea', 'road', 'rail')),
  incoterms TEXT CHECK (incoterms IN ('EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DDP', 'FOB', 'CFR', 'CIF')),
  exporter_name TEXT,
  importer_name TEXT,
  customs_office TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  seed_run_id UUID
);

CREATE INDEX idx_customs_declarations_org_id ON customs_declarations(org_id);
CREATE INDEX idx_customs_declarations_status ON customs_declarations(status);
CREATE INDEX idx_customs_declarations_type ON customs_declarations(declaration_type);
CREATE INDEX idx_customs_declarations_seed_run_id ON customs_declarations(seed_run_id) WHERE seed_run_id IS NOT NULL;

CREATE TRIGGER update_customs_declarations_updated_at
  BEFORE UPDATE ON customs_declarations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE customs_declarations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org customs declarations" ON customs_declarations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM memberships WHERE org_id = customs_declarations.org_id AND user_id = auth.uid())
  );

CREATE POLICY "Members can create customs declarations" ON customs_declarations
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM memberships WHERE org_id = customs_declarations.org_id AND user_id = auth.uid())
  );

CREATE POLICY "Members can update customs declarations" ON customs_declarations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM memberships WHERE org_id = customs_declarations.org_id AND user_id = auth.uid())
  );

CREATE POLICY "Admins can delete customs declarations" ON customs_declarations
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM memberships WHERE org_id = customs_declarations.org_id AND user_id = auth.uid() AND role = 'admin')
  );

-- customs_documents: supporting documents per declaration
CREATE TABLE customs_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  declaration_id UUID NOT NULL REFERENCES customs_declarations(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('commercial_invoice', 'packing_list', 'certificate_of_origin', 'export_license', 'bill_of_lading', 'other')),
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  seed_run_id UUID
);

CREATE INDEX idx_customs_documents_org_id ON customs_documents(org_id);
CREATE INDEX idx_customs_documents_declaration_id ON customs_documents(declaration_id);
CREATE INDEX idx_customs_documents_seed_run_id ON customs_documents(seed_run_id) WHERE seed_run_id IS NOT NULL;

ALTER TABLE customs_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org customs documents" ON customs_documents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM memberships WHERE org_id = customs_documents.org_id AND user_id = auth.uid())
  );

CREATE POLICY "Members can create customs documents" ON customs_documents
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM memberships WHERE org_id = customs_documents.org_id AND user_id = auth.uid())
  );

CREATE POLICY "Members can update customs documents" ON customs_documents
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM memberships WHERE org_id = customs_documents.org_id AND user_id = auth.uid())
  );

CREATE POLICY "Admins can delete customs documents" ON customs_documents
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM memberships WHERE org_id = customs_documents.org_id AND user_id = auth.uid() AND role = 'admin')
  );

-- customs_exceptions: exception queue for declarations requiring attention
CREATE TABLE customs_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  declaration_id UUID NOT NULL REFERENCES customs_declarations(id) ON DELETE CASCADE,
  exception_code TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  notes TEXT,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  seed_run_id UUID
);

CREATE INDEX idx_customs_exceptions_org_id ON customs_exceptions(org_id);
CREATE INDEX idx_customs_exceptions_declaration_id ON customs_exceptions(declaration_id);
CREATE INDEX idx_customs_exceptions_status ON customs_exceptions(status);
CREATE INDEX idx_customs_exceptions_severity ON customs_exceptions(severity);
CREATE INDEX idx_customs_exceptions_seed_run_id ON customs_exceptions(seed_run_id) WHERE seed_run_id IS NOT NULL;

ALTER TABLE customs_exceptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view org customs exceptions" ON customs_exceptions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM memberships WHERE org_id = customs_exceptions.org_id AND user_id = auth.uid())
  );

CREATE POLICY "Members can create customs exceptions" ON customs_exceptions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM memberships WHERE org_id = customs_exceptions.org_id AND user_id = auth.uid())
  );

CREATE POLICY "Members can update customs exceptions" ON customs_exceptions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM memberships WHERE org_id = customs_exceptions.org_id AND user_id = auth.uid())
  );

CREATE POLICY "Admins can delete customs exceptions" ON customs_exceptions
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM memberships WHERE org_id = customs_exceptions.org_id AND user_id = auth.uid() AND role = 'admin')
  );
