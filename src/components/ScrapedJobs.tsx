
import JobResultsTable, { type Job as DisplayedJob } from "./JobResultsTable";
import { Separator } from "@/components/ui/separator";

type JobFromSupabase = {
    id: string;
    title: string;
    location: string | null;
    job_url: string;
    companies: { name: string } | null;
};

type Props = {
    jobs: JobFromSupabase[] | undefined;
};

const ScrapedJobs = ({ jobs }: Props) => {
    const formattedJobs: DisplayedJob[] = jobs?.map(job => ({
        id: job.id,
        title: job.title,
        company: job.companies?.name || 'Unknown',
        location: job.location,
        link: job.job_url,
    })) || [];

    return (
        <div>
            <Separator className="my-8" />
            <h2 className="text-xl font-semibold mb-4">Scraped Jobs</h2>
            <JobResultsTable jobs={formattedJobs} />
        </div>
    );
};

export default ScrapedJobs;
