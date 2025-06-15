
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

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

  const mutation = useMutation({
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

  const handleAddCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCompanyName.trim()) {
      mutation.mutate(newCompanyName.trim());
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
            disabled={mutation.isPending}
          />
          <Button type="submit" disabled={mutation.isPending || !newCompanyName.trim()}>
            {mutation.isPending ? "Adding..." : "Add"}
          </Button>
        </form>
        <div className="max-h-60 overflow-y-auto border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Company Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Career Page</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center h-24">Loading companies...</TableCell>
                        </TableRow>
                    ) : isError ? (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center h-24 text-destructive">Failed to load companies.</TableCell>
                        </TableRow>
                    ) : companies && companies.length > 0 ? (
                        companies.map((company) => (
                            <TableRow key={company.id}>
                                <TableCell className="font-medium">{company.name}</TableCell>
                                <TableCell>{company.status}</TableCell>
                                <TableCell>
                                    {company.career_page_url ? (
                                        <a href={company.career_page_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                            Link
                                        </a>
                                    ) : (
                                        <span className="text-muted-foreground">N/A</span>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center h-24">No companies added yet.</TableCell>
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
