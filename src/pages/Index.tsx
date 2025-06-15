
import Header from "@/components/Header";
import ProfileInput from "@/components/ProfileInput";
import JobResultsTable from "@/components/JobResultsTable";
import JobCard from "@/components/JobCard";
import JobPagination from "@/components/JobPagination";
import LLMConfig from "@/components/LLMConfig";
import { useState } from "react";
import type { Job } from "@/components/JobResultsTable";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import CompanyManager from "@/components/CompanyManager";
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
      const { data, error } = await supabase.functions.invoke('analyze-jobs', {
        body: { profile },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      const formattedJobs: Job[] = data.jobs.map((job: any) => ({
        id: job.id,
        title: job.title,
        company: job.companies?.name || 'Unknown',
        location: job.location,
        link: job.job_url,
        score: job.ai_analysis.score,
        reasoning: job.ai_analysis.reasoning
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
        {/* Sidebar */}
        <div className={`${sidebarCollapsed ? 'w-16' : 'w-80'} transition-all duration-300 bg-card border-r flex flex-col`}>
          <div className="p-4 border-b">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full justify-start"
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              {!sidebarCollapsed && <span className="ml-2">Collapse</span>}
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!sidebarCollapsed && (
              <>
                <CompanyManager />
                <ProfileInput onSubmit={handleProfileSubmit} isLoading={isAnalyzing} />
                <LLMConfig />
              </>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col p-6">
          <div className="bg-card border rounded-xl p-6 shadow-lg flex flex-col flex-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold tracking-tight">
                Matched Job Opportunities
              </h2>
              {matchedJobs && (
                <span className="text-sm text-muted-foreground">
                  {matchedJobs.length} job(s) found
                </span>
              )}
            </div>

            {/* Job Results */}
            <div className="flex-1">
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mb-4" />
                  <p>Analyzing jobs against your profile...</p>
                  <p className="text-xs mt-1">(This may take a moment)</p>
                </div>
              ) : analysisError ? (
                <div className="flex items-center justify-center h-full text-destructive">
                  <p>Error: {analysisError}</p>
                </div>
              ) : matchedJobs === null ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p className="text-center">
                    Enter your profile and click "Find Matched Jobs" to see personalized results.
                  </p>
                </div>
              ) : (
                <>
                  {viewMode === "table" ? (
                    <JobResultsTable 
                      jobs={currentPageJobs} 
                      density={density}
                      visibleColumns={["title", "company", "location", "score"]}
                    />
                  ) : (
                    <div className={`grid gap-4 ${
                      density === "compact" 
                        ? "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3" 
                        : "grid-cols-1 lg:grid-cols-2"
                    }`}>
                      {currentPageJobs.map((job) => (
                        <JobCard 
                          key={job.id} 
                          job={job} 
                          density={density}
                        />
                      ))}
                    </div>
                  )}

                  {jobsToDisplay.length === 0 && !isAnalyzing && (
                     <div className="col-span-full text-center py-10 text-muted-foreground">
                       No job matches found. Try adjusting your profile preferences!
                     </div>
                   )}
                  
                  {jobsToDisplay.length > 0 && (
                    <div className="mt-6 flex justify-center">
                      <JobPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <footer className="w-full text-xs text-muted-foreground text-center pb-6 pt-2">
        {`Powered by Lovable • All data mock/demo - no account required`}
      </footer>
    </div>
  );
};

export default Index;
