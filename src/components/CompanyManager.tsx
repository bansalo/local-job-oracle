
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import AddCompanyForm from "./AddCompanyForm";
import CompanyTable from "./CompanyTable";
import ScrapedJobs from "./ScrapedJobs";

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
  const queryClient = useQueryClient();

  const { data: companies, isLoading, isError } = useQuery({
    queryKey: ["companies"],
    queryFn: fetchCompanies,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: jobs } = useQuery({
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
    },
    onError: (error: Error) => {
        toast.error(error.message);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Pocket Dictionary</CardTitle>
      </CardHeader>
      <CardContent>
        <AddCompanyForm addCompanyMutation={addCompanyMutation} />
        <CompanyTable companies={companies} isLoading={isLoading} isError={isError} />
        <ScrapedJobs jobs={jobs} />
      </CardContent>
    </Card>
  );
};

export default CompanyManager;
