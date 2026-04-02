-- Phase 1: Initial Schema for Portal Gym
-- Created: 2025-04-02
-- Description: Core tables for portal-gym benchmark platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- For gen_random_uuid() fallback

-- ============================================
-- CORE TABLES
-- ============================================

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Memberships table (users <-> organizations)
CREATE TABLE memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(org_id, user_id)
);

-- Cases table
CREATE TABLE cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    case_type TEXT NOT NULL DEFAULT 'general',
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'in_review', 'needs_correction', 'closed')),
    assigned_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    seed_run_id UUID, -- For scenario seed/reset tracking
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Documents table (logical documents)
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    mime_type TEXT NOT NULL,
    latest_version_id UUID, -- References document_versions(id), set via trigger
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    seed_run_id UUID, -- For scenario seed/reset tracking
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Document versions table (actual file versions)
CREATE TABLE document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    version_number INTEGER NOT NULL,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    seed_run_id UUID, -- For scenario seed/reset tracking
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(document_id, version_number)
);

-- Add foreign key from documents to latest version (after table creation)
ALTER TABLE documents
    ADD CONSTRAINT fk_latest_version
    FOREIGN KEY (latest_version_id) REFERENCES document_versions(id)
    ON DELETE SET NULL
    DEFERRABLE INITIALLY DEFERRED;

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- User-scoped (null = org-scoped)
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE, -- Org-scoped
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'info',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    seed_run_id UUID, -- For scenario seed/reset tracking
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit events table
CREATE TABLE audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- e.g., 'sign_in', 'document_upload', 'case_create'
    entity_type TEXT, -- e.g., 'case', 'document', 'user'
    entity_id UUID, -- ID of the affected entity
    metadata JSONB, -- Additional context
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scenario templates table (for seeding)
CREATE TABLE scenario_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    config JSONB NOT NULL DEFAULT '{}', -- Template configuration
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scenario runs table (tracks seed/reset operations)
CREATE TABLE scenario_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES scenario_templates(id) ON DELETE SET NULL,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    run_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
    created_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ============================================
-- INDEXES
-- ============================================

-- Profiles
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_email ON profiles(email);

-- Memberships
CREATE INDEX idx_memberships_org_id ON memberships(org_id);
CREATE INDEX idx_memberships_user_id ON memberships(user_id);
CREATE INDEX idx_memberships_role ON memberships(role);

-- Cases
CREATE INDEX idx_cases_org_id ON cases(org_id);
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_assigned_user_id ON cases(assigned_user_id);
CREATE INDEX idx_cases_created_by ON cases(created_by);
CREATE INDEX idx_cases_seed_run_id ON cases(seed_run_id) WHERE seed_run_id IS NOT NULL;

-- Documents
CREATE INDEX idx_documents_org_id ON documents(org_id);
CREATE INDEX idx_documents_case_id ON documents(case_id);
CREATE INDEX idx_documents_created_by ON documents(created_by);
CREATE INDEX idx_documents_seed_run_id ON documents(seed_run_id) WHERE seed_run_id IS NOT NULL;

-- Document versions
CREATE INDEX idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX idx_document_versions_created_by ON document_versions(created_by);
CREATE INDEX idx_document_versions_seed_run_id ON document_versions(seed_run_id) WHERE seed_run_id IS NOT NULL;

-- Notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_notifications_org_id ON notifications(org_id) WHERE org_id IS NOT NULL;
CREATE INDEX idx_notifications_case_id ON notifications(case_id) WHERE case_id IS NOT NULL;
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_seed_run_id ON notifications(seed_run_id) WHERE seed_run_id IS NOT NULL;

-- Audit events
CREATE INDEX idx_audit_events_org_id ON audit_events(org_id) WHERE org_id IS NOT NULL;
CREATE INDEX idx_audit_events_user_id ON audit_events(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_audit_events_action ON audit_events(action);
CREATE INDEX idx_audit_events_entity ON audit_events(entity_type, entity_id) WHERE entity_type IS NOT NULL;
CREATE INDEX idx_audit_events_created_at ON audit_events(created_at DESC);

-- Scenario runs
CREATE INDEX idx_scenario_runs_org_id ON scenario_runs(org_id);
CREATE INDEX idx_scenario_runs_template_id ON scenario_runs(template_id);
CREATE INDEX idx_scenario_runs_status ON scenario_runs(status);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_runs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Organizations policies (members can view their orgs)
CREATE POLICY "Members can view their organizations" ON organizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM memberships
            WHERE memberships.org_id = organizations.id
            AND memberships.user_id = auth.uid()
        )
    );

-- Memberships policies
CREATE POLICY "Members can view org memberships" ON memberships
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM memberships m
            WHERE m.org_id = memberships.org_id
            AND m.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage memberships" ON memberships
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM memberships m
            WHERE m.org_id = memberships.org_id
            AND m.user_id = auth.uid()
            AND m.role = 'admin'
        )
    );

-- Cases policies
CREATE POLICY "Members can view org cases" ON cases
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM memberships
            WHERE memberships.org_id = cases.org_id
            AND memberships.user_id = auth.uid()
        )
    );

CREATE POLICY "Members can create cases in org" ON cases
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM memberships
            WHERE memberships.org_id = cases.org_id
            AND memberships.user_id = auth.uid()
        )
    );

CREATE POLICY "Members can update org cases" ON cases
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM memberships
            WHERE memberships.org_id = cases.org_id
            AND memberships.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can delete org cases" ON cases
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM memberships
            WHERE memberships.org_id = cases.org_id
            AND memberships.user_id = auth.uid()
            AND memberships.role = 'admin'
        )
    );

-- Documents policies
CREATE POLICY "Members can view org documents" ON documents
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM memberships
            WHERE memberships.org_id = documents.org_id
            AND memberships.user_id = auth.uid()
        )
    );

CREATE POLICY "Members can create documents in org" ON documents
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM memberships
            WHERE memberships.org_id = documents.org_id
            AND memberships.user_id = auth.uid()
        )
    );

CREATE POLICY "Members can update org documents" ON documents
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM memberships
            WHERE memberships.org_id = documents.org_id
            AND memberships.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can delete org documents" ON documents
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM memberships
            WHERE memberships.org_id = documents.org_id
            AND memberships.user_id = auth.uid()
            AND memberships.role = 'admin'
        )
    );

-- Document versions policies
CREATE POLICY "Members can view document versions" ON document_versions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM documents d
            JOIN memberships m ON m.org_id = d.org_id
            WHERE d.id = document_versions.document_id
            AND m.user_id = auth.uid()
        )
    );

CREATE POLICY "Members can create document versions" ON document_versions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM documents d
            JOIN memberships m ON m.org_id = d.org_id
            WHERE d.id = document_versions.document_id
            AND m.user_id = auth.uid()
        )
    );

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (
        user_id = auth.uid()
        OR (
            org_id IS NOT NULL
            AND EXISTS (
                SELECT 1 FROM memberships
                WHERE memberships.org_id = notifications.org_id
                AND memberships.user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Audit events policies
CREATE POLICY "Members can view org audit events" ON audit_events
    FOR SELECT USING (
        org_id IS NULL
        OR EXISTS (
            SELECT 1 FROM memberships
            WHERE memberships.org_id = audit_events.org_id
            AND memberships.user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can create audit events" ON audit_events
    FOR INSERT WITH CHECK (true);

-- Scenario templates policies (admin-only management, all users can view)
CREATE POLICY "All users can view templates" ON scenario_templates
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage templates" ON scenario_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM memberships
            WHERE memberships.user_id = auth.uid()
            AND memberships.role = 'admin'
        )
    );

-- Scenario runs policies
CREATE POLICY "Members can view org scenario runs" ON scenario_runs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM memberships
            WHERE memberships.org_id = scenario_runs.org_id
            AND memberships.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can create scenario runs" ON scenario_runs
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM memberships
            WHERE memberships.org_id = scenario_runs.org_id
            AND memberships.user_id = auth.uid()
            AND memberships.role = 'admin'
        )
    );

CREATE POLICY "Admins can update scenario runs" ON scenario_runs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM memberships
            WHERE memberships.org_id = scenario_runs.org_id
            AND memberships.user_id = auth.uid()
            AND memberships.role = 'admin'
        )
    );

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memberships_updated_at BEFORE UPDATE ON memberships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON cases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_versions_updated_at BEFORE UPDATE ON document_versions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scenario_templates_updated_at BEFORE UPDATE ON scenario_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-set latest_version_id on document_versions insert
CREATE OR REPLACE FUNCTION update_document_latest_version()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE documents
    SET latest_version_id = NEW.id
    WHERE id = NEW.document_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_document_latest_version AFTER INSERT ON document_versions
    FOR EACH ROW EXECUTE FUNCTION update_document_latest_version();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (user_id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
