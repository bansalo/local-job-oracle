
import Header from "@/components/Header";
import ProfileInput from "@/components/ProfileInput";
import JobResultsTable from "@/components/JobResultsTable";
import { useState } from "react";
import { Job, MOCK_JOBS } from "@/components/MockData";

const Index = () => {
  const [filters, setFilters] = useState({});
  const [filteredJobs, setFilteredJobs] = useState<Job[]>(MOCK_JOBS);

  // Apply intelligent filtering (simulated)
  const handleProfileSubmit = (profile: any) => {
    setFilters(profile);
    // Here you'd fetch/scrape jobs, then filter and score.
    // For now, filter mock jobs by title, location, remote, etc.
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
  };

  return (
    <div className="min-h-screen bg-background w-full flex flex-col">
      <Header />
      <main className="flex-1 grid grid-cols-12 max-w-screen-2xl mx-auto w-full gap-8 px-6 py-10">
        <section className="col-span-3 min-w-[350px] bg-card border rounded-xl p-6 shadow-lg">
          <ProfileInput onSubmit={handleProfileSubmit} />
        </section>
        <section className="col-span-9 bg-card border rounded-xl p-6 shadow-lg flex flex-col">
          <h2 className="text-xl font-semibold mb-4 tracking-tight">
            Top Job Opportunities
          </h2>
          <JobResultsTable jobs={filteredJobs} />
        </section>
      </main>
      <footer className="w-full text-xs text-muted-foreground text-center pb-6 pt-2">
        {`Powered by Lovable • All data mock/demo - no account required`}
      </footer>
    </div>
  );
};

export default Index;
