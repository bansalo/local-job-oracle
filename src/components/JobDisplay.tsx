
import { Loader2 } from "lucide-react";
import JobResultsTable, { Job } from "./JobResultsTable";
import JobCard from "./JobCard";
import JobPagination from "./JobPagination";

type JobDisplayProps = {
    isAnalyzing: boolean;
    analysisError: string | null;
    matchedJobs: Job[] | null;
    viewMode: "table" | "cards";
    density: "compact" | "comfortable";
    currentPageJobs: Job[];
    jobsToDisplay: Job[];
    totalPages: number;
    currentPage: number;
    onPageChange: (page: number) => void;
}

export default function JobDisplay({
    isAnalyzing,
    analysisError,
    matchedJobs,
    viewMode,
    density,
    currentPageJobs,
    jobsToDisplay,
    totalPages,
    currentPage,
    onPageChange
}: JobDisplayProps) {
    return (
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
                        onPageChange={onPageChange}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
    );
}
