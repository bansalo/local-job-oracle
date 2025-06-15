
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
      .select('name')
      .eq('id', companyId)
      .single()

    if (fetchError || !company) {
      throw new Error(fetchError?.message || 'Company not found')
    }

    await supabaseAdmin
      .from('companies')
      .update({ status: 'processing' })
      .eq('id', companyId)

    const prompt = `Find the exact career or jobs page URL for the company "${company.name}". I need the direct link to where the job listings are. If you are certain you found it, return only the URL. If you are unsure or cannot find it, return "NOT_FOUND".`

    const geminiResponse = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    })

    if (!geminiResponse.ok) {
        const errorBody = await geminiResponse.text();
        console.error("Gemini API error:", errorBody);
        throw new Error(`Gemini API request failed: ${geminiResponse.statusText}`);
    }

    const geminiData = await geminiResponse.json();
    const textPart = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    const careerPageUrl = textPart ? textPart.trim() : 'NOT_FOUND';

    if (careerPageUrl && careerPageUrl !== 'NOT_FOUND' && careerPageUrl.startsWith('http')) {
      await supabaseAdmin
        .from('companies')
        .update({ status: 'found', career_page_url: careerPageUrl })
        .eq('id', companyId)
      return new Response(JSON.stringify({ message: 'Career page found.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    } else {
      await supabaseAdmin
        .from('companies')
        .update({ status: 'error' })
        .eq('id', companyId)
      return new Response(JSON.stringify({ message: 'Career page not found.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      })
    }
  } catch (error) {
    console.error(error)
    // Update company status to 'error' on failure
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
