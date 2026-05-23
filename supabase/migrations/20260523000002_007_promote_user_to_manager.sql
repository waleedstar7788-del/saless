/*
  # Promote a user to manager (run manually in Supabase SQL Editor)

  Replace the email below with your account email, then run this script.
*/

-- UPDATE profiles
-- SET role = 'manager', status = 'approved', updated_at = now()
-- WHERE email = 'your-email@example.com';

-- Promote ALL pending users (use with caution):
-- UPDATE profiles SET role = 'manager', status = 'approved', updated_at = now() WHERE status = 'pending';
