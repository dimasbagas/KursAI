-- Fix public.users table RLS policies and trigger

-- 1. Add INSERT policy for public.users so client-side fallback can create profile if trigger fails
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile"
    ON public.users FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- 2. Fix the trigger function to handle null name gracefully
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.users (id, name, email)
    VALUES (
        new.id,
        COALESCE(
            new.raw_user_meta_data->>'name',
            new.raw_user_meta_data->>'full_name',
            split_part(new.email, '@', 1),
            'Pengguna KursAI'
        ),
        new.email
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        updated_at = now();
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Retroactively sync any missing users from auth.users to public.users
INSERT INTO public.users (id, name, email)
SELECT 
    id,
    COALESCE(
        raw_user_meta_data->>'name',
        raw_user_meta_data->>'full_name',
        split_part(email, '@', 1),
        'Pengguna KursAI'
    ),
    email
FROM auth.users
ON CONFLICT (id) DO NOTHING;
