
import { encodeBase64 } from 'https://deno.land/std@0.224.0/encoding/base64.ts'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_API_URL_BASE = `https://generativelanguage.googleapis.com/v1beta/models`
const TEXT_EXTRACTION_MODEL = 'gemini-1.5-flash';

export async function extractTextFromResume(resumeUrl: string): Promise<string | null> {
  if (!resumeUrl) {
    return null;
  }

  console.log(`Processing resume from: ${resumeUrl} using Gemini`);
  try {
    const fileResponse = await fetch(resumeUrl);
    if (!fileResponse.ok) {
      throw new Error(`Failed to download resume. Status: ${fileResponse.status}`);
    }
    const fileBuffer = await fileResponse.arrayBuffer();
    const fileBase64 = encodeBase64(new Uint8Array(fileBuffer));

    const extension = resumeUrl.split('.').pop()?.toLowerCase();
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
    const resumeText = extractionData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (resumeText) {
      console.log("Successfully extracted text from resume.");
      return resumeText;
    } else {
      console.warn("Could not extract text from resume, proceeding without it.");
      return null;
    }
  } catch (e) {
    console.error("Error processing resume:", e.message);
    // Don't fail the whole process, just proceed without resume text
    return null;
  }
}
