
-- Create a new storage bucket for resumes
insert into storage.buckets
  (id, name, public)
values
  ('resumes', 'resumes', true);

-- Add policies to allow anyone to upload and view resumes.
-- In a real-world application with user accounts, you would restrict
-- these policies to only allow authenticated users to manage their own files.

create policy "Public read access for resumes"
on storage.objects for select
using ( bucket_id = 'resumes' );

create policy "Anyone can upload a resume"
on storage.objects for insert
with check ( bucket_id = 'resumes' );
