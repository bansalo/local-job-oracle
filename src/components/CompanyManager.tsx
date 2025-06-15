
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Link, Search, XCircle } from 'lucide-react';

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

  const handleAddCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCompanyName.trim()) {
      addCompanyMutation.mutate(newCompanyName.trim());
    }
  };

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
                    <TableHead>Career Page</TableHead>
                    <TableHead className="text-right">Action</TableHead>
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
                                <TableCell className="font-medium">{company.name}</TableCell>
                                <TableCell className="capitalize">
                                    <div className="flex items-center gap-2">
                                        {company.status === 'processing' && <Loader2 className="h-4 w-4 animate-spin" />}
                                        {company.status === 'error' && <XCircle className="h-4 w-4 text-destructive" />}
                                        {company.status === 'found' && <Link className="h-4 w-4 text-primary" />}
                                        <span>{company.status}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {company.career_page_url ? (
                                        <a href={company.career_page_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                            Visit Link
                                        </a>
                                    ) : (
                                        <span className="text-muted-foreground">N/A</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => findCareerPageMutation.mutate(company.id)}
                                      disabled={
                                        (findCareerPageMutation.isPending && findCareerPageMutation.variables === company.id) ||
                                        company.status !== 'pending'
                                      }
                                    >
                                      <Search className="h-4 w-4 mr-2" />
                                      Find
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
      </CardContent>
    </Card>
  );
};

export default CompanyManager;
