
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

type Props = {
  jobs: Job[];
  density?: "compact" | "comfortable";
  visibleColumns?: string[];
};

export default function JobResultsTable({ 
  jobs, 
  density = "comfortable",
  visibleColumns = ["title", "company", "location", "remote", "compensation", "source", "score"]
}: Props) {
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

  const isCompact = density === "compact";
  const cellPadding = isCompact ? "px-2 py-1" : "px-3 py-2";

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">
          {jobs.length} job(s) on this page
        </span>
        <Button size="sm" onClick={handleExport} disabled={jobs.length === 0 || exporting}>
          {exporting ? "Exporting..." : "Export to CSV"}
        </Button>
      </div>
      <div className="overflow-auto rounded-xl border">
        <table className="min-w-full border-separate border-spacing-0">
          <thead className="bg-muted">
            <tr>
              {visibleColumns.includes("title") && (
                <th className={`${cellPadding} sticky left-0 bg-muted text-left`}>Title</th>
              )}
              {visibleColumns.includes("company") && (
                <th className={`${cellPadding} text-left`}>Company</th>
              )}
              {visibleColumns.includes("location") && (
                <th className={`${cellPadding} text-left`}>Location</th>
              )}
              {visibleColumns.includes("remote") && (
                <th className={`${cellPadding} text-left`}>Remote</th>
              )}
              {visibleColumns.includes("compensation") && (
                <th className={`${cellPadding} text-left`}>Comp.</th>
              )}
              {visibleColumns.includes("source") && (
                <th className={`${cellPadding} text-left`}>Source</th>
              )}
              {visibleColumns.includes("score") && (
                <th className={`${cellPadding} text-left`}>Score</th>
              )}
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
                {visibleColumns.includes("title") && (
                  <td className={`${cellPadding} font-medium sticky left-0 bg-inherit z-10`}>
                    <a href={job.link} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">
                      {job.title}
                    </a>
                  </td>
                )}
                {visibleColumns.includes("company") && (
                  <td className={cellPadding}>{job.company}</td>
                )}
                {visibleColumns.includes("location") && (
                  <td className={cellPadding}>{job.location}</td>
                )}
                {visibleColumns.includes("remote") && (
                  <td className={cellPadding}>{job.remote ? "Yes" : "No"}</td>
                )}
                {visibleColumns.includes("compensation") && (
                  <td className={cellPadding}>{job.compensation || "--"}</td>
                )}
                {visibleColumns.includes("source") && (
                  <td className={cellPadding}>{job.source}</td>
                )}
                {visibleColumns.includes("score") && (
                  <td className={cellPadding}>
                    <span className={`inline-block rounded bg-blue-600/90 text-white px-2 font-semibold text-xs`}>
                      {job.score}
                    </span>
                  </td>
                )}
              </tr>
            ))}
            {jobs.length === 0 && (
              <tr>
                <td colSpan={visibleColumns.length} className={`${cellPadding} text-center text-muted-foreground`}>
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
