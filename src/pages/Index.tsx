
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import JobDisplay from "@/components/JobDisplay";
import { useState } from "react";
import type { Job } from "@/components/JobResultsTable";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Index = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [matchedJobs, setMatchedJobs] = useState<Job[] | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  
  // Layout state
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [density, setDensity] = useState<"compact" | "comfortable">("comfortable");
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  // Apply intelligent filtering
  const handleProfileSubmit = async (profile: any) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setMatchedJobs(null);
    setCurrentPage(1);

    try {
      const llmProvider = localStorage.getItem("llmProvider") || "gemini";
      const llmApiKey = localStorage.getItem("llmApiKey");
      const llmLocalUrl = localStorage.getItem("llmLocalUrl");

      const { data, error } = await supabase.functions.invoke('analyze-jobs', {
        body: {
          profile,
          llmConfig: {
            provider: llmProvider,
            apiKey: llmApiKey,
            url: llmLocalUrl,
          },
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      const formattedJobs: Job[] = data.jobs.map((job: any) => ({
        id: job.id,
        title: job.title,
        company: job.companies?.name || 'Unknown',
        location: job.location,
        link: job.job_url,
        score: job.ai_analysis.match_score,
        reasoning: job.ai_analysis.reasoning,
        remote: !!job.location?.toLowerCase().includes('remote'),
        source: 'AI Match'
      }));

      setMatchedJobs(formattedJobs);
      toast.success(`${formattedJobs.length} matching jobs found!`);
    } catch (error: any) {
      console.error("Error analyzing jobs:", error);
      toast.error(`Analysis failed: ${error.message}`);
      setAnalysisError(error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const jobsToDisplay = matchedJobs || [];

  // Pagination calculations
  const totalPages = Math.ceil(jobsToDisplay.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageJobs = jobsToDisplay.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-background w-full flex flex-col">
      <Header />
      <main className="flex-1 flex max-w-screen-2xl mx-auto w-full">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          onProfileSubmit={handleProfileSubmit}
          isAnalyzing={isAnalyzing}
        />

        <div className="flex-1 flex flex-col p-6">
          <JobDisplay
            isAnalyzing={isAnalyzing}
            analysisError={analysisError}
            matchedJobs={matchedJobs}
            viewMode={viewMode}
            density={density}
            currentPageJobs={currentPageJobs}
            jobsToDisplay={jobsToDisplay}
            totalPages={totalPages}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </main>
      <footer className="w-full text-xs text-muted-foreground text-center pb-6 pt-2">
        {`Powered by Lovable • All data mock/demo - no account required`}
      </footer>
    </div>
  );
};

export default Index;
