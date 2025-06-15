
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

import { extractTextFromResume } from './resume.ts'
import { createAnalysisPrompt } from './prompts.ts'
import { analyzeJob } from './llm.ts'
import { getJobsForAnalysis, updateJobWithAnalysis } from './db.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { profile, llmConfig } = await req.json()
    if (!profile) {
      throw new Error('Profile data is required')
    }
    
    const provider = llmConfig?.provider || 'gemini';
    let resumeText = null;
    
    if (profile.resumeUrl && provider === 'gemini') {
      resumeText = await extractTextFromResume(profile.resumeUrl);
    } else if (profile.resumeUrl) {
      console.log(`Skipping resume processing for local LLM provider: ${provider}`);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const jobs = await getJobsForAnalysis(supabaseAdmin);

    if (jobs.length === 0) {
      return new Response(JSON.stringify({ jobs: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    const analysisResults = await Promise.allSettled(jobs.map(async (job) => {
      const prompt = createAnalysisPrompt({ profile, job, resumeText });
      const analysis = await analyzeJob(prompt, llmConfig, job.id);
      await updateJobWithAnalysis(supabaseAdmin, job.id, analysis);
      return { ...job, ai_analysis: analysis }
    }));

    const successfulAnalyses = analysisResults
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<any>).value);

    const matchedJobs = successfulAnalyses
      .filter(job => job.ai_analysis?.is_match)
      .sort((a, b) => (b.ai_analysis.match_score || 0) - (a.ai_analysis.match_score || 0));

    return new Response(JSON.stringify({ jobs: matchedJobs }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
