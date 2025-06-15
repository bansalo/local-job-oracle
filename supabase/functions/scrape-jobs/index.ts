
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { companyId } = await req.json()
    if (!companyId) {
      throw new Error('companyId is required')
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: company, error: fetchError } = await supabaseAdmin
      .from('companies')
      .select('name, career_page_url')
      .eq('id', companyId)
      .single()

    if (fetchError || !company || !company.career_page_url) {
      throw new Error(fetchError?.message || 'Company or career page URL not found')
    }

    await supabaseAdmin
      .from('companies')
      .update({ status: 'scraping' })
      .eq('id', companyId)

    const pageResponse = await fetch(company.career_page_url)
    if (!pageResponse.ok) {
      throw new Error(`Failed to fetch career page: ${pageResponse.statusText}`)
    }
    const htmlContent = await pageResponse.text()
    
    const baseUrl = new URL(company.career_page_url).origin

    const prompt = `
      Based on the following HTML from the career page of "${company.name}", extract all job listings.
      For each job, provide the 'title', 'job_url', and 'location'.
      The 'job_url' must be an absolute URL. If you find a relative URL (e.g., "/jobs/123"), convert it to an absolute URL using the base URL: ${baseUrl}.
      Return the data as a valid JSON array of objects.
      Example: [{"title": "Software Engineer", "job_url": "https://company.com/jobs/123", "location": "New York, NY"}]
      If no jobs are found, return an empty array [].
      Do not include anything else in your response, only the JSON array.

      HTML content:
      \`\`\`html
      ${htmlContent.substring(0, 30000)}
      \`\`\`
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
      const errorBody = await geminiResponse.text()
      console.error('Gemini API error:', errorBody)
      throw new Error(`Gemini API request failed: ${geminiResponse.statusText}`)
    }

    const geminiData = await geminiResponse.json()
    const jobsText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!jobsText) {
       throw new Error('Gemini did not return any parsable text for jobs.')
    }

    const jobs = JSON.parse(jobsText)

    if (jobs && jobs.length > 0) {
      const jobsToInsert = jobs.map((job: any) => ({
        company_id: companyId,
        title: job.title,
        job_url: job.job_url,
        location: job.location,
      }))

      const { error: insertError } = await supabaseAdmin.from('jobs').upsert(jobsToInsert, { onConflict: 'company_id,job_url' })
      if (insertError) {
        console.error('Error inserting jobs:', insertError)
        throw new Error(`Failed to save jobs: ${insertError.message}`)
      }
    }

    await supabaseAdmin
      .from('companies')
      .update({ status: 'scraped', jobs_scraped_at: new Date().toISOString() })
      .eq('id', companyId)

    return new Response(JSON.stringify({ message: `${jobs.length} jobs scraped successfully.` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error(error)
    const { companyId } = await req.json().catch(() => ({}));
    if (companyId) {
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )
      await supabaseAdmin
        .from('companies')
        .update({ status: 'error' })
        .eq('id', companyId)
    }
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
