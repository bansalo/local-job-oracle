
import { useState } from "react";
import { Job } from "./MockData";
import { Button } from "@/components/ui/button";

function toCSV(jobs: Job[]): string {
  const headers = [
    "Title",
    "Company",
    "Location",
    "Remote",
    "Est. Compensation",
    "Source",
    "Relevance Score",
  ];
  const rows = jobs.map(j =>
    [
      j.title,
      j.company,
      j.location,
      j.remote ? "Yes" : "No",
      j.compensation || "",
      j.source,
      j.score,
    ]
      .map(field => `"${field}"`)
      .join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

export default function JobResultsTable({ jobs }: { jobs: Job[] }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    setExporting(true);
    const csvStr = toCSV(jobs);
    const blob = new Blob([csvStr], { type: "text/csv" });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.download = "job_matches.csv";
    a.href = href;
    a.click();
    setTimeout(() => {
      setExporting(false);
      URL.revokeObjectURL(href);
    }, 1200);
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">
          {jobs.length} job(s) found
        </span>
        <Button size="sm" onClick={handleExport} disabled={jobs.length === 0 || exporting}>
          {exporting ? "Exporting..." : "Export to CSV"}
        </Button>
      </div>
      <div className="overflow-auto rounded-xl border">
        <table className="min-w-full border-separate border-spacing-0">
          <thead className="bg-muted">
            <tr>
              <th className="px-3 py-2 sticky left-0 bg-muted text-left">Title</th>
              <th className="px-3 py-2 text-left">Company</th>
              <th className="px-3 py-2 text-left">Location</th>
              <th className="px-3 py-2 text-left">Remote</th>
              <th className="px-3 py-2 text-left">Comp.</th>
              <th className="px-3 py-2 text-left">Source</th>
              <th className="px-3 py-2 text-left">Score</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job, idx) => (
              <tr
                key={job.id}
                className={`transition-colors hover:bg-accent/60 dark:hover:bg-muted cursor-pointer ${
                  idx % 2 ? "bg-white dark:bg-background" : "bg-muted"
                }`}
              >
                <td className="px-3 py-2 font-medium sticky left-0 bg-inherit z-10">
                  <a href={job.link} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">
                    {job.title}
                  </a>
                </td>
                <td className="px-3 py-2">{job.company}</td>
                <td className="px-3 py-2">{job.location}</td>
                <td className="px-3 py-2">{job.remote ? "Yes" : "No"}</td>
                <td className="px-3 py-2">{job.compensation || "--"}</td>
                <td className="px-3 py-2">{job.source}</td>
                <td className="px-3 py-2">
                  <span className={`inline-block rounded bg-blue-600/90 text-white px-2 font-semibold text-xs`}>
                    {job.score}
                  </span>
                </td>
              </tr>
            ))}
            {jobs.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-muted-foreground">
                  No job matches found. Adjust your preferences or try again!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
