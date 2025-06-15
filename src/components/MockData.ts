
export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  remote: boolean;
  compensation?: string;
  source: string;
  link: string;
  score: number; // Mocked score 1-100
};

// These are only mock jobs for demo!
export const MOCK_JOBS: Job[] = [
  {
    id: "1",
    title: "Frontend Developer",
    company: "TechFlow",
    location: "Remote",
    remote: true,
    compensation: "$120,000",
    source: "LinkedIn",
    link: "https://www.linkedin.com/jobs/1",
    score: 92,
  },
  {
    id: "2",
    title: "Full Stack Engineer",
    company: "UpNext",
    location: "San Francisco, CA",
    remote: false,
    compensation: "$140,000",
    source: "Upwork",
    link: "https://www.upwork.com/job/2",
    score: 88,
  },
  {
    id: "3",
    title: "AI Product Manager",
    company: "FutureAI",
    location: "London, UK",
    remote: true,
    compensation: "£100,000",
    source: "Indeed",
    link: "https://www.indeed.com/job/3",
    score: 85,
  },
  {
    id: "4",
    title: "Backend Developer",
    company: "SysWise",
    location: "New York, NY",
    remote: false,
    compensation: "$125,000",
    source: "Monster",
    link: "https://www.monster.com/job/4",
    score: 81,
  },
  {
    id: "5",
    title: "React Native Engineer",
    company: "MobileCrafter",
    location: "Remote",
    remote: true,
    compensation: "$110,000",
    source: "Upwork",
    link: "https://www.upwork.com/job/5",
    score: 77,
  },
  {
    id: "6",
    title: "Python Data Analyst",
    company: "DataBridge",
    location: "Berlin, Germany",
    remote: false,
    compensation: "€70,000",
    source: "Naukri",
    link: "https://www.naukri.com/job/6",
    score: 75,
  },
  {
    id: "7",
    title: "Javascript Developer",
    company: "JSWorks",
    location: "Remote",
    remote: true,
    compensation: "Contract",
    source: "Craigslist",
    link: "https://craigslist.com/job/7",
    score: 71,
  },
  {
    id: "8",
    title: "Cloud Solutions Architect",
    company: "CloudyMind",
    location: "Austin, TX",
    remote: false,
    compensation: "$160,000",
    source: "LinkedIn",
    link: "https://www.linkedin.com/jobs/8",
    score: 68,
  },
];
