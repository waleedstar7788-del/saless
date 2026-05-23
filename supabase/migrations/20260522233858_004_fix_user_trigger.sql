/*
  # Fix User Registration Trigger

  1. Changes:
    - Fix the trigger function: AFTER INSERT means user already exists,
      so count = 1 (not 0) for first user
    - Change condition from user_count = 0 to user_count = 1
    - Also approve the existing first user who got stuck as pending

  2. Important:
    - The existing user "محمد الفاتح" will be updated to manager/approved
*/

-- Fix the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_count integer;
BEGIN
  -- Count users BEFORE this new one was added
  -- Since this is AFTER INSERT, the new user is already counted
  -- So count=1 means this is the first user
  SELECT COUNT(*) INTO user_count FROM auth.users;
  
  INSERT INTO public.profiles (id, email, full_name, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE WHEN user_count = 1 THEN 'manager' ELSE 'employee' END,
    CASE WHEN user_count = 1 THEN 'approved' ELSE 'pending' END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix existing first user who got stuck as pending employee
UPDATE profiles 
SET role = 'manager', status = 'approved', updated_at = now()
WHERE status = 'pending' 
AND NOT EXISTS (
  SELECT 1 FROM profiles WHERE role = 'manager'
);