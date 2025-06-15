
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

export type Job = {
  id: string;
  title: string;
  company: string;
  location: string | null;
  link: string;
  score?: number;
  reasoning?: string;
  remote?: boolean;
  source?: string;
};

function toCSV(jobs: Job[]): string {
  const headers = [
    "Title",
    "Company",
    "Location",
    "Link",
    "Match Score",
    "Reasoning",
  ];
  const rows = jobs.map(j =>
    [
      j.title,
      j.company,
      j.location || "N/A",
      j.link,
      j.score !== undefined ? `${j.score}%` : 'N/A',
      j.reasoning || 'N/A',
    ]
      .map(field => `"${String(field).replace(/"/g, '""')}"` )
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
  visibleColumns = ["title", "company", "location", "score"]
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
              {visibleColumns.includes("title") && (
                <th className={`${cellPadding} sticky left-0 bg-muted text-left`}>Title</th>
              )}
              {visibleColumns.includes("company") && (
                <th className={`${cellPadding} text-left`}>Company</th>
              )}
              {visibleColumns.includes("location") && (
                <th className={`${cellPadding} text-left`}>Location</th>
              )}
              {visibleColumns.includes("score") && (
                <th className={`${cellPadding} text-left`}>Match Score</th>
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
                  <td className={cellPadding}>{job.location || 'N/A'}</td>
                )}
                {visibleColumns.includes("score") && job.score !== undefined && (
                  <td className={cellPadding}>
                    <TooltipProvider>
                      <Tooltip delayDuration={200}>
                        <TooltipTrigger asChild>
                           <div className="flex items-center gap-2">
                             <Progress value={job.score} className="h-2 w-20" />
                             <span className="font-semibold w-8 text-right">{job.score}%</span>
                           </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-sm">{job.reasoning}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </td>
                )}
              </tr>
            ))}
            {jobs.length === 0 && (
              <tr>
                <td colSpan={visibleColumns.length} className={`${cellPadding} text-center text-muted-foreground h-24`}>
                  No jobs to display.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
