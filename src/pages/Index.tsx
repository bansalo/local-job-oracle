import Header from "@/components/Header";
import ProfileInput from "@/components/ProfileInput";
import JobResultsTable from "@/components/JobResultsTable";
import JobFilters from "@/components/JobFilters";
import LayoutControls from "@/components/LayoutControls";
import SearchBar from "@/components/SearchBar";
import JobCard from "@/components/JobCard";
import JobPagination from "@/components/JobPagination";
import LLMConfig from "@/components/LLMConfig";
import { useState, useMemo } from "react";
import { Job, MOCK_JOBS } from "@/components/MockData";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CompanyManager from "@/components/CompanyManager";

const Index = () => {
  const [filters, setFilters] = useState({});
  const [filteredJobs, setFilteredJobs] = useState<Job[]>(MOCK_JOBS);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [jobFilters, setJobFilters] = useState({
    jobTypes: [],
    experienceLevels: [],
    companySizes: [],
    datePosted: "Any time",
    sortBy: "Relevance"
  });
  
  // Layout state
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [density, setDensity] = useState<"compact" | "comfortable">("comfortable");
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [visibleColumns, setVisibleColumns] = useState([
    "title", "company", "location", "remote", "compensation", "source", "score"
  ]);

  // Apply intelligent filtering (simulated)
  const handleProfileSubmit = (profile: any) => {
    setFilters(profile);
    let jobs = MOCK_JOBS;
    if (profile.preferredTitle) {
      jobs = jobs.filter(j =>
        j.title.toLowerCase().includes(profile.preferredTitle.toLowerCase())
      );
    }
    if (profile.location) {
      jobs = jobs.filter(j =>
        j.location.toLowerCase().includes(profile.location.toLowerCase())
      );
    }
    if (profile.remotePreference && profile.remotePreference !== "Any") {
      jobs = jobs.filter(j =>
        j.remote === (profile.remotePreference === "Remote")
      );
    }
    setFilteredJobs(jobs);
    setCurrentPage(1);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredJobs(MOCK_JOBS);
      return;
    }
    
    const searchResults = MOCK_JOBS.filter(job =>
      job.title.toLowerCase().includes(query.toLowerCase()) ||
      job.company.toLowerCase().includes(query.toLowerCase()) ||
      job.location.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredJobs(searchResults);
    setCurrentPage(1);
  };

  const handleColumnToggle = (column: string) => {
    if (column === "title") return; // Title is always visible
    setVisibleColumns(prev =>
      prev.includes(column)
        ? prev.filter(col => col !== column)
        : [...prev, column]
    );
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageJobs = filteredJobs.slice(startIndex, endIndex);

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
                <ProfileInput onSubmit={handleProfileSubmit} />
                <LLMConfig />
                <JobFilters onFiltersChange={setJobFilters} isCollapsed={false} />
                <LayoutControls
                  viewMode={viewMode}
                  density={density}
                  itemsPerPage={itemsPerPage}
                  onViewModeChange={setViewMode}
                  onDensityChange={setDensity}
                  onItemsPerPageChange={setItemsPerPage}
                  visibleColumns={visibleColumns}
                  onColumnToggle={handleColumnToggle}
                />
              </>
            )}
            {sidebarCollapsed && (
              <JobFilters onFiltersChange={setJobFilters} isCollapsed={true} />
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col p-6">
          {/* Search Bar */}
          <div className="mb-6">
            <SearchBar onSearch={handleSearch} />
          </div>

          {/* Results Section */}
          <div className="bg-card border rounded-xl p-6 shadow-lg flex flex-col flex-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold tracking-tight">
                Top Job Opportunities
              </h2>
              <span className="text-sm text-muted-foreground">
                {filteredJobs.length} job(s) found
              </span>
            </div>

            {/* Job Results */}
            <div className="flex-1">
              {viewMode === "table" ? (
                <JobResultsTable 
                  jobs={currentPageJobs} 
                  density={density}
                  visibleColumns={visibleColumns}
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
                  {currentPageJobs.length === 0 && (
                    <div className="col-span-full text-center py-10 text-muted-foreground">
                      No job matches found. Adjust your preferences or try again!
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Pagination */}
            {filteredJobs.length > 0 && (
              <div className="mt-6 flex justify-center">
                <JobPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
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
