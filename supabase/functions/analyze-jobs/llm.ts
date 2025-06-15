
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_API_URL_BASE = `https://generativelanguage.googleapis.com/v1beta/models`
const ANALYSIS_MODEL = 'gemini-1.5-flash';

interface LlmConfig {
  provider: 'gemini' | 'local';
  apiKey?: string;
  url?: string;
}

async function analyzeWithGemini(prompt: string, llmConfig: LlmConfig, jobId: string) {
  console.log(`Analyzing job ${jobId} using Gemini.`);
  const geminiApiKey = llmConfig?.apiKey || GEMINI_API_KEY;
  if (!geminiApiKey) throw new Error("Gemini API key is required.");
  
  const geminiAnalysisUrl = `${GEMINI_API_URL_BASE}/${ANALYSIS_MODEL}:generateContent?key=${geminiApiKey}`;
  const geminiResponse = await fetch(geminiAnalysisUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
          responseMimeType: "application/json",
      }
    }),
  });

  if (!geminiResponse.ok) {
    throw new Error(`Gemini API request failed for job ${jobId}`);
  }

  const geminiData = await geminiResponse.json();
  return geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
}

async function analyzeWithOllama(prompt: string, llmConfig: LlmConfig, jobId: string) {
  if (!llmConfig.url) throw new Error("Ollama URL is required for local provider.");
  console.log(`Analyzing job ${jobId} using Ollama at ${llmConfig.url}`);
  const ollamaResponse = await fetch(new URL('/api/chat', llmConfig.url).toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3',
      messages: [{ role: 'user', content: prompt }],
      format: 'json',
      stream: false,
    }),
  });

  if (!ollamaResponse.ok) {
    const errorText = await ollamaResponse.text();
    throw new Error(`Ollama API request failed for job ${jobId}: ${errorText}`);
  }

  const ollamaData = await ollamaResponse.json();
  return ollamaData.message?.content;
}


export async function analyzeJob(prompt: string, llmConfig: LlmConfig, jobId: string): Promise<any> {
    const provider = llmConfig.provider || 'gemini';
    let analysisText;

    if (provider === 'local') {
      analysisText = await analyzeWithOllama(prompt, llmConfig, jobId);
    } else {
      analysisText = await analyzeWithGemini(prompt, llmConfig, jobId);
    }

    if (!analysisText) {
      throw new Error(`LLM did not return parsable text for job ${jobId}.`);
    }
    
    try {
      const jsonString = analysisText.match(/\{[\s\S]*\}/)?.[0];
      if (!jsonString) {
        throw new Error("No JSON object found in the response.");
      }
      return JSON.parse(jsonString);
    } catch (error) {
      console.error(`Error parsing JSON for job ${jobId}:`, error.message, "Raw response:", analysisText);
      throw new Error(`Failed to parse analysis from LLM for job ${jobId}.`);
    }
}
