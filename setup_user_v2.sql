-- Setup test user for browser-agent2 project
-- Creates auth user, profile, demo org, and admin membership

DO $$
DECLARE
    v_user_id uuid;
    v_org_id uuid;
BEGIN
    -- Check if user already exists
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'test123@gmail.com';
    
    IF v_user_id IS NULL THEN
        -- Create new user with password 'testpassword123'
        v_user_id := gen_random_uuid();
        
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
            v_user_id,
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
        
        RAISE NOTICE 'Created user: %', v_user_id;
    ELSE
        RAISE NOTICE 'User already exists: %', v_user_id;
    END IF;
    
    -- Create profile
    INSERT INTO profiles (user_id, email, full_name)
    VALUES (v_user_id, 'test123@gmail.com', 'Test User')
    ON CONFLICT (user_id) DO UPDATE SET full_name = 'Test User';
    
    -- Create demo organization
    INSERT INTO organizations (name, slug)
    VALUES ('Demo Organization', 'demo-org')
    ON CONFLICT (slug) DO NOTHING
    RETURNING id INTO v_org_id;
    
    IF v_org_id IS NULL THEN
        SELECT id INTO v_org_id FROM organizations WHERE slug = 'demo-org';
    END IF;
    
    -- Create admin membership
    INSERT INTO memberships (user_id, org_id, role)
    VALUES (v_user_id, v_org_id, 'admin')
    ON CONFLICT (user_id, org_id) DO UPDATE SET role = 'admin';
    
    RAISE NOTICE 'Setup complete!';
END $$;
