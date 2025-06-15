
-- Drop trigger and function related to profile creation for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Drop the profiles table
DROP TABLE IF EXISTS public.profiles;

-- Create a table for companies
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  career_page_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'found', 'error'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Allow public access since there is no authentication
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Companies are viewable by everyone." ON public.companies FOR SELECT USING (true);
CREATE POLICY "Anyone can insert a company." ON public.companies FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update a company." ON public.companies FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete a company." ON public.companies FOR DELETE USING (true);

-- Create a function to automatically update the 'updated_at' timestamp
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger on the companies table to call the function
CREATE TRIGGER handle_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();
