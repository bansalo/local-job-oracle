
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export async function getJobsForAnalysis(supabaseAdmin: SupabaseClient) {
  const { data: jobs, error } = await supabaseAdmin
    .from('jobs')
    .select('id, title, location, description, job_url, companies(name)')
    .limit(50) // To avoid high costs, we'll analyze up to 50 jobs
  
  if (error) {
    throw error;
  }
  return jobs || [];
}

export async function updateJobWithAnalysis(supabaseAdmin: SupabaseClient, jobId: string, analysis: any) {
  const { error } = await supabaseAdmin
    .from('jobs')
    .update({ ai_analysis: analysis, status: 'analyzed' })
    .eq('id', jobId)

  if (error) {
    console.error(`Failed to update job ${jobId} with analysis:`, error.message);
    // Log the error but don't throw, allowing other jobs to complete.
  }
}
