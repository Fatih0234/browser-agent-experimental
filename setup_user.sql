-- Setup test user for browser-agent2 project
-- Creates auth user, profile, demo org, and admin membership

DO $$
DECLARE
    new_user_id uuid;
    org_id uuid;
BEGIN
    -- Check if user already exists
    SELECT id INTO new_user_id FROM auth.users WHERE email = 'test123@gmail.com';
    
    IF new_user_id IS NULL THEN
        -- Create new user with password 'testpassword123'
        new_user_id := gen_random_uuid();
        
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            new_user_id,
            'authenticated',
            'authenticated',
            'test123@gmail.com',
            crypt('testpassword123', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{}',
            '{}'
        );
        
        RAISE NOTICE 'Created user: %', new_user_id;
    ELSE
        RAISE NOTICE 'User already exists: %', new_user_id;
    END IF;
    
    -- Create profile
    INSERT INTO profiles (user_id, email, full_name)
    VALUES (new_user_id, 'test123@gmail.com', 'Test User')
    ON CONFLICT (user_id) DO UPDATE SET full_name = 'Test User';
    
    -- Create demo organization
    INSERT INTO organizations (name, slug)
    VALUES ('Demo Organization', 'demo-org')
    ON CONFLICT (slug) DO NOTHING
    RETURNING id INTO org_id;
    
    IF org_id IS NULL THEN
        SELECT id INTO org_id FROM organizations WHERE slug = 'demo-org';
    END IF;
    
    -- Create admin membership
    INSERT INTO memberships (user_id, org_id, role)
    VALUES (new_user_id, org_id, 'admin')
    ON CONFLICT (user_id, org_id) DO UPDATE SET role = 'admin';
    
    RAISE NOTICE 'Setup complete!';
END $$;
