
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Link, Search, XCircle, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type Company = {
    id: string;
    name: string;
    career_page_url: string | null;
    status: string;
    jobs_scraped_at: string | null;
};

type Props = {
    companies: Company[] | undefined;
    isLoading: boolean;
    isError: boolean;
};

const CompanyTable = ({ companies, isLoading, isError }: Props) => {
    const queryClient = useQueryClient();

    const findCareerPageMutation = useMutation({
        mutationFn: async (companyId: string) => {
            const { error } = await supabase.functions.invoke('find-career-page', {
                body: { companyId },
            });
            if (error) throw new Error(error.message);
            return companyId;
        },
        onSuccess: (companyId) => {
            toast.success("Searching for career page... The list will update automatically.");
            queryClient.setQueryData(['companies'], (oldData: Company[] | undefined) =>
                oldData ? oldData.map((c) => c.id === companyId ? { ...c, status: 'processing' } : c) : []
            );
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ["companies"] });
            }, 10000);
        },
        onError: (error: Error, companyId) => {
            toast.error(`Failed to find career page: ${error.message}`);
            queryClient.setQueryData(['companies'], (oldData: Company[] | undefined) =>
                oldData ? oldData.map((c) => c.id === companyId ? { ...c, status: 'error' } : c) : []
            );
        },
    });

    const scrapeJobsMutation = useMutation({
        mutationFn: async (companyId: string) => {
            const { error } = await supabase.functions.invoke('scrape-jobs', {
                body: { companyId },
            });
            if (error) throw new Error(error.message);
            return companyId;
        },
        onSuccess: (companyId) => {
            toast.success("Scraping jobs... The list will update automatically.");
            queryClient.setQueryData(['companies'], (oldData: Company[] | undefined) =>
                oldData ? oldData.map((c) => c.id === companyId ? { ...c, status: 'scraping' } : c) : []
            );
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ["companies"] });
            }, 15000);
        },
        onError: (error: Error, companyId) => {
            toast.error(`Failed to scrape jobs: ${error.message}`);
            queryClient.setQueryData(['companies'], (oldData: Company[] | undefined) =>
                oldData ? oldData.map((c) => c.id === companyId ? { ...c, status: 'error' } : c) : []
            );
        },
    });


    const isActionPending = (company: { id: string, status: string }) => {
        return (
            (findCareerPageMutation.isPending && findCareerPageMutation.variables === company.id) ||
            (scrapeJobsMutation.isPending && scrapeJobsMutation.variables === company.id) ||
            company.status === 'processing' ||
            company.status === 'scraping'
        );
    }

    return (
        <div className="max-h-96 overflow-y-auto border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Company</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Scraped</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center h-24">Loading companies...</TableCell>
                        </TableRow>
                    ) : isError ? (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center h-24 text-destructive">Failed to load companies.</TableCell>
                        </TableRow>
                    ) : companies && companies.length > 0 ? (
                        companies.map((company) => (
                            <TableRow key={company.id}>
                                <TableCell className="font-medium">
                                    {company.career_page_url ? (
                                        <a href={company.career_page_url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                                            {company.name} <Link className="h-3 w-3 text-muted-foreground" />
                                        </a>
                                    ) : (
                                        company.name
                                    )}
                                </TableCell>
                                <TableCell className="capitalize">
                                    <div className="flex items-center gap-2">
                                        {(company.status === 'processing' || company.status === 'scraping') && <Loader2 className="h-4 w-4 animate-spin" />}
                                        {company.status === 'error' && <XCircle className="h-4 w-4 text-destructive" />}
                                        {company.status === 'found' && <Search className="h-4 w-4 text-blue-500" />}
                                        {company.status === 'scraped' && <FileText className="h-4 w-4 text-green-500" />}
                                        <span>{company.status}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {company.jobs_scraped_at ? (
                                        <span className="text-muted-foreground text-sm">
                                            {formatDistanceToNow(new Date(company.jobs_scraped_at), { addSuffix: true })}
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground">Never</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => findCareerPageMutation.mutate(company.id)}
                                        disabled={isActionPending(company) || company.status !== 'pending'}
                                    >
                                        <Search className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => scrapeJobsMutation.mutate(company.id)}
                                        disabled={isActionPending(company) || company.status !== 'found'}
                                    >
                                        <FileText className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center h-24">No companies added yet.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
};

export default CompanyTable;
