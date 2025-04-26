/*
  # Authentication Schema Setup

  1. Changes
    - Update foreign key constraints
    - Add additional RLS policies if not exist
    - Add user deletion trigger
    
  2. Security
    - Enable RLS on profiles table
    - Add policies for profile management
*/

-- Update foreign key to reference auth.users instead of users
ALTER TABLE IF EXISTS public.backups 
  DROP CONSTRAINT IF EXISTS backups_user_id_fkey,
  ADD CONSTRAINT backups_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
EXCEPTION
    WHEN undefined_object THEN 
        NULL;
END $$;

-- Add comprehensive RLS policies for profiles
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
  ON profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- Add trigger to handle profile cleanup
CREATE OR REPLACE FUNCTION public.handle_user_deletion()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.profiles WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_deletion ON auth.users;

CREATE TRIGGER on_user_deletion
  AFTER DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_deletion();