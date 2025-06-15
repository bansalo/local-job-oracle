
-- Create a table for jobs
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  job_url TEXT NOT NULL,
  location TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending_analysis', -- e.g., 'pending_analysis', 'ready_for_review', 'applied', 'irrelevant'
  ai_analysis JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, job_url)
);

-- Allow public access since there is no user-specific data yet
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Jobs are viewable by everyone." ON public.jobs FOR SELECT USING (true);
CREATE POLICY "Anyone can insert a job." ON public.jobs FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update a job." ON public.jobs FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete a job." ON public.jobs FOR DELETE USING (true);

-- Create a trigger on the jobs table to automatically update the 'updated_at' timestamp
CREATE TRIGGER handle_jobs_updated_at
BEFORE UPDATE ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

-- Add a column to the companies table to track the last scrape time
ALTER TABLE public.companies
ADD COLUMN jobs_scraped_at TIMESTAMPTZ;
