-- Storage buckets configuration for Portal Gym
-- Documents bucket for file storage

-- Create the documents bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for documents bucket

-- Policy: Users can upload files to their org folder
CREATE POLICY "Users can upload to org folder" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'documents'
        AND EXISTS (
            SELECT 1 FROM memberships
            WHERE memberships.org_id = (storage.foldername(name))[1]::UUID
            AND memberships.user_id = auth.uid()
        )
    );

-- Policy: Users can view files in their org folder
CREATE POLICY "Users can view org files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'documents'
        AND EXISTS (
            SELECT 1 FROM memberships
            WHERE memberships.org_id = (storage.foldername(name))[1]::UUID
            AND memberships.user_id = auth.uid()
        )
    );

-- Policy: Admins can delete files in their org
CREATE POLICY "Admins can delete org files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'documents'
        AND EXISTS (
            SELECT 1 FROM memberships
            WHERE memberships.org_id = (storage.foldername(name))[1]::UUID
            AND memberships.user_id = auth.uid()
            AND memberships.role = 'admin'
        )
    );
