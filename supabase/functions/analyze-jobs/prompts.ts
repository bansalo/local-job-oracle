
interface Profile {
  preferredTitle: string;
  skills: string;
  location: string;
  salary: string;
  remotePreference: string;
}

interface Job {
  title: string;
  location?: string;
  description?: string;
  companies?: { name: string };
}

interface PromptParams {
  profile: Profile;
  job: Job;
  resumeText: string | null;
}

export function createAnalysisPrompt({ profile, job, resumeText }: PromptParams): string {
  return `
    You are an expert ATS resume screener. Analyze this job posting for a candidate.
    
    Candidate Profile:
    - Preferred Title: ${profile.preferredTitle}
    - Skills: ${profile.skills}
    - Preferred Location: ${profile.location}
    - Salary Expectation: ${profile.salary}
    - Remote Preference: ${profile.remotePreference}
    ${resumeText ? `\nCandidate's Full Resume:\n---RESUME---\n${resumeText}\n---END RESUME---` : '\n(Candidate resume not provided for this analysis.)'}

    Job Details:
    - Title: ${job.title}
    - Company: ${job.companies?.name || 'Not specified'}
    - Location: ${job.location || 'Not specified'}
    - Description: ${job.description || 'Not provided'}

    Based on the candidate's profile AND resume (if provided), provide a JSON object with:
    1. "match_score": A number from 0 (not a match) to 100 (perfect match). The score should heavily weigh the resume content against the job description.
    2. "reasoning": A brief, 2-3 sentence explanation for the score, highlighting key matches or mismatches from the resume and profile.
    3. "is_match": a boolean, true if score is 70 or higher.

    Return ONLY the JSON object. Example:
    {"match_score": 85, "reasoning": "The candidate's resume shows strong experience with React and Python, as listed in the job description. The preferred location also aligns.", "is_match": true}
  `;
}
