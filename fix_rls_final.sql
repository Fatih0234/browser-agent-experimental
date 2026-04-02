-- Fix all RLS policies to prevent recursion and allow proper access

-- 1. Drop all existing policies on key tables
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
DROP POLICY IF EXISTS "Members can view their organizations" ON organizations;
DROP POLICY IF EXISTS "Organizations viewable" ON organizations;
DROP POLICY IF EXISTS "org_select" ON organizations;

DROP POLICY IF EXISTS "Users can view their own memberships" ON memberships;
DROP POLICY IF EXISTS "Users can view their memberships" ON memberships;
DROP POLICY IF EXISTS "Members can view org memberships" ON memberships;
DROP POLICY IF EXISTS "Users view own memberships" ON memberships;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- 2. Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- 3. Create simple, non-recursive policies

-- Profiles: Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (user_id = auth.uid());

-- Memberships: Users can view their own memberships (no recursive reference)
CREATE POLICY "Users can view own memberships" ON memberships
    FOR SELECT USING (user_id = auth.uid());

-- Organizations: Use a subquery that doesn't reference organizations table
CREATE POLICY "Users can view their orgs" ON organizations
    FOR SELECT USING (
        id IN (
            SELECT m.org_id 
            FROM memberships m 
            WHERE m.user_id = auth.uid()
        )
    );

-- Cases: Users can view cases in their orgs
CREATE POLICY "Users can view org cases" ON cases
    FOR SELECT USING (
        org_id IN (
            SELECT m.org_id 
            FROM memberships m 
            WHERE m.user_id = auth.uid()
        )
    );

-- Documents: Users can view documents in their orgs
CREATE POLICY "Users can view org documents" ON documents
    FOR SELECT USING (
        org_id IN (
            SELECT m.org_id 
            FROM memberships m 
            WHERE m.user_id = auth.uid()
        )
    );

-- Document versions: Users can view versions of documents they can access
CREATE POLICY "Users can view document versions" ON document_versions
    FOR SELECT USING (
        document_id IN (
            SELECT d.id FROM documents d
            WHERE d.org_id IN (
                SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid()
            )
        )
    );

-- Notifications: Users can view their own notifications or org notifications
CREATE POLICY "Users can view notifications" ON notifications
    FOR SELECT USING (
        user_id = auth.uid() 
        OR org_id IN (
            SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid()
        )
    );

-- Audit events: Users can view audit events for their orgs
CREATE POLICY "Users can view audit events" ON audit_events
    FOR SELECT USING (
        org_id IN (
            SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid()
        )
    );

-- 4. Insert policies (allow authenticated users to create)
CREATE POLICY "Users can create cases" ON cases
    FOR INSERT WITH CHECK (
        org_id IN (
            SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create documents" ON documents
    FOR INSERT WITH CHECK (
        org_id IN (
            SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create document versions" ON document_versions
    FOR INSERT WITH CHECK (
        document_id IN (
            SELECT d.id FROM documents d
            WHERE d.org_id IN (
                SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can create audit events" ON audit_events
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can create notifications" ON notifications
    FOR INSERT WITH CHECK (
        user_id = auth.uid() 
        OR org_id IN (
            SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid()
        )
    );

-- 5. Update policies (allow users to update their own records)
CREATE POLICY "Users can update cases" ON cases
    FOR UPDATE USING (
        org_id IN (
            SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update documents" ON documents
    FOR UPDATE USING (
        org_id IN (
            SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update notifications" ON notifications
    FOR UPDATE USING (
        user_id = auth.uid() 
        OR org_id IN (
            SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid()
        )
    );

-- 6. Delete policies
CREATE POLICY "Users can delete documents" ON documents
    FOR DELETE USING (
        org_id IN (
            SELECT m.org_id FROM memberships m WHERE m.user_id = auth.uid()
        )
    );
