
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { encode } from 'https://deno.land/std@0.224.0/encoding/base64.ts'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_API_URL_BASE = `https://generativelanguage.googleapis.com/v1beta/models`

const TEXT_EXTRACTION_MODEL = 'gemini-1.5-flash';
const ANALYSIS_MODEL = 'gemini-1.5-flash';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { profile } = await req.json()
    if (!profile) {
      throw new Error('Profile data is required')
    }
    
    let resumeText = null;
    if (profile.resumeUrl) {
      console.log(`Processing resume from: ${profile.resumeUrl}`);
      try {
        const fileResponse = await fetch(profile.resumeUrl);
        if (!fileResponse.ok) {
          throw new Error(`Failed to download resume. Status: ${fileResponse.status}`);
        }
        const fileBuffer = await fileResponse.arrayBuffer();
        const fileBase64 = encode(new Uint8Array(fileBuffer));

        const extension = profile.resumeUrl.split('.').pop()?.toLowerCase();
        let mimeType;
        switch (extension) {
          case 'pdf': mimeType = 'application/pdf'; break;
          case 'docx': mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'; break;
          case 'doc': mimeType = 'application/msword'; break;
          case 'txt': mimeType = 'text/plain'; break;
          default: throw new Error(`Unsupported resume file type: ${extension}`);
        }
        console.log(`Extracted mime-type: ${mimeType}`);

        const textExtractionUrl = `${GEMINI_API_URL_BASE}/${TEXT_EXTRACTION_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
        
        const extractionResponse = await fetch(textExtractionUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: "You are an expert ATS. Extract all text from this document. Respond with only the raw text content from the resume, without any commentary or formatting." },
                { inline_data: { mime_type: mimeType, data: fileBase64 } }
              ]
            }],
            generationConfig: {
              responseMimeType: "text/plain",
            }
          })
        });

        if (!extractionResponse.ok) {
          const errorBody = await extractionResponse.text();
          console.error("Gemini text extraction failed. Status:", extractionResponse.status, "Body:", errorBody);
          throw new Error(`Gemini API request for text extraction failed.`);
        }
        
        const extractionData = await extractionResponse.json();
        resumeText = extractionData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (resumeText) {
          console.log("Successfully extracted text from resume.");
        } else {
          console.warn("Could not extract text from resume, proceeding without it.");
        }
      } catch (e) {
        console.error("Error processing resume:", e.message);
        // Don't fail the whole process, just proceed without resume text
      }
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
    
    const geminiAnalysisUrl = `${GEMINI_API_URL_BASE}/${ANALYSIS_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    
    const analysisResults = await Promise.allSettled(jobs.map(async (job) => {
      const prompt = `
        You are an expert ATS resume screener. Analyze this job posting for a candidate.
        
        Candidate Profile:
        - Preferred Title: ${profile.preferredTitle}
        - Skills: ${profile.skills}
        - Preferred Location: ${profile.location}
        - Salary Expectation: ${profile.salary}
        - Remote Preference: ${profile.remotePreference}
        ${resumeText ? `\nCandidate's Full Resume:\n---RESUME---\n${resumeText}\n---END RESUME---` : ''}

        Job Details:
        - Title: ${job.title}
        - Company: ${job.companies.name}
        - Location: ${job.location || 'Not specified'}
        - Description: ${job.description || 'Not provided'}

        Based on the candidate's profile AND resume (if provided), provide a JSON object with:
        1. "match_score": A number from 0 (not a match) to 100 (perfect match). The score should heavily weigh the resume content against the job description.
        2. "reasoning": A brief, 2-3 sentence explanation for the score, highlighting key matches or mismatches from the resume and profile.
        3. "is_match": a boolean, true if score is 70 or higher.

        Return ONLY the JSON object. Example:
        {"match_score": 85, "reasoning": "The candidate's resume shows strong experience with React and Python, as listed in the job description. The preferred location also aligns.", "is_match": true}
      `

      const geminiResponse = await fetch(geminiAnalysisUrl, {
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
