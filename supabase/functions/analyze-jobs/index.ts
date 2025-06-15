
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent?key=${GEMINI_API_KEY}`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { profile } = await req.json()
    if (!profile) {
      throw new Error('Profile data is required')
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: jobs, error: fetchError } = await supabaseAdmin
      .from('jobs')
      .select('id, title, location, description, job_url, companies(name)')
      .limit(50) // To avoid high costs, we'll analyze up to 50 jobs

    if (fetchError) {
      throw fetchError
    }

    if (!jobs || jobs.length === 0) {
      return new Response(JSON.stringify({ jobs: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    
    const analysisResults = await Promise.allSettled(jobs.map(async (job) => {
      const prompt = `
        Analyze this job posting for a candidate with the following profile:
        - Preferred Title: ${profile.preferredTitle}
        - Skills: ${profile.skills}
        - Preferred Location: ${profile.location}
        - Salary Expectation: ${profile.salary}
        - Remote Preference: ${profile.remotePreference}

        Job Details:
        - Title: ${job.title}
        - Company: ${job.companies.name}
        - Location: ${job.location || 'Not specified'}
        - Description: ${job.description || 'Not provided'}

        Based on the profile, provide a JSON object with:
        1. "match_score": A number from 0 (not a match) to 100 (perfect match).
        2. "reasoning": A brief explanation for the score (max 2-3 sentences).
        3. "is_match": a boolean, true if score is 70 or higher.

        Return ONLY the JSON object. Example:
        {"match_score": 85, "reasoning": "Good match on skills and location.", "is_match": true}
      `

      const geminiResponse = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
              responseMimeType: "application/json",
          }
        }),
      })

      if (!geminiResponse.ok) {
        throw new Error(`Gemini API request failed for job ${job.id}`)
      }

      const geminiData = await geminiResponse.json()
      const analysisText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!analysisText) {
        throw new Error(`Gemini did not return parsable text for job ${job.id}.`)
      }
      
      const analysis = JSON.parse(analysisText)

      await supabaseAdmin
        .from('jobs')
        .update({ ai_analysis: analysis, status: 'analyzed' })
        .eq('id', job.id)

      return { ...job, ai_analysis: analysis }
    }))

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

