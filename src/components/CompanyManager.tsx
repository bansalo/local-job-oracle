import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Link, Search, XCircle, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import JobResultsTable, { type Job as DisplayedJob } from "./JobResultsTable";
import { Separator } from "@/components/ui/separator";

const fetchCompanies = async () => {
  const { data, error } = await supabase.from("companies").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
};

const addCompany = async (companyName: string) => {
    const { data, error } = await supabase.from("companies").insert([{ name: companyName }]).select();
    if (error) {
        if (error.code === '23505') { // unique constraint violation
            throw new Error(`Company "${companyName}" already exists.`);
        }
        throw new Error(error.message);
    }
    return data;
}

const CompanyManager = () => {
  const [newCompanyName, setNewCompanyName] = useState("");
  const queryClient = useQueryClient();

  const { data: companies, isLoading, isError } = useQuery({
    queryKey: ["companies"],
    queryFn: fetchCompanies,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: jobs, isLoading: isLoadingJobs, isError: isErrorJobs } = useQuery({
    queryKey: ["jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("id, title, job_url, location, companies(name)")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const addCompanyMutation = useMutation({
    mutationFn: addCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Company added successfully!");
      setNewCompanyName("");
    },
    onError: (error: Error) => {
        toast.error(error.message);
    }
  });

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
        queryClient.setQueryData(['companies'], (oldData: any[] | undefined) =>
            oldData ? oldData.map((c) => c.id === companyId ? { ...c, status: 'processing' } : c) : []
        );
        setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ["companies"] });
        }, 10000); 
    },
    onError: (error: Error, companyId) => {
        toast.error(`Failed to find career page: ${error.message}`);
        queryClient.setQueryData(['companies'], (oldData: any[] | undefined) =>
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
        queryClient.setQueryData(['companies'], (oldData: any[] | undefined) =>
            oldData ? oldData.map((c) => c.id === companyId ? { ...c, status: 'scraping' } : c) : []
        );
        setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ["companies"] });
        }, 15000); 
    },
    onError: (error: Error, companyId) => {
        toast.error(`Failed to scrape jobs: ${error.message}`);
        queryClient.setQueryData(['companies'], (oldData: any[] | undefined) =>
            oldData ? oldData.map((c) => c.id === companyId ? { ...c, status: 'error' } : c) : []
        );
    },
  });


  const handleAddCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCompanyName.trim()) {
      addCompanyMutation.mutate(newCompanyName.trim());
    }
  };

  const isActionPending = (company: { id: string, status: string }) => {
    return (
        (findCareerPageMutation.isPending && findCareerPageMutation.variables === company.id) ||
        (scrapeJobsMutation.isPending && scrapeJobsMutation.variables === company.id) ||
        company.status === 'processing' ||
        company.status === 'scraping'
    );
  }

  const formattedJobs: DisplayedJob[] = jobs?.map(job => ({
    id: job.id,
    title: job.title,
    company: job.companies?.name || 'Unknown',
    location: job.location,
    link: job.job_url,
  })) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Pocket Dictionary</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAddCompany} className="flex w-full items-center space-x-2 mb-4">
          <Input
            type="text"
            placeholder="e.g., Google"
            value={newCompanyName}
            onChange={(e) => setNewCompanyName(e.target.value)}
            disabled={addCompanyMutation.isPending}
          />
          <Button type="submit" disabled={addCompanyMutation.isPending || !newCompanyName.trim()}>
            {addCompanyMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {addCompanyMutation.isPending ? "Adding..." : "Add"}
          </Button>
        </form>
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
                                            {company.name} <Link className="h-3 w-3 text-muted-foreground"/>
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
        <Separator className="my-8" />
        <div>
          <h2 className="text-xl font-semibold mb-4">Scraped Jobs</h2>
            <JobResultsTable jobs={formattedJobs} />
        </div>
      </CardContent>
    </Card>
  );
};

export default CompanyManager;
