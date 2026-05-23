/*
  # Employee permissions (JSON per profile)

  Managers have full access via role = 'manager'.
  Employees use permissions jsonb set by manager.
*/

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS permissions jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN profiles.permissions IS 'Feature permissions for employees; managers ignore this column';
