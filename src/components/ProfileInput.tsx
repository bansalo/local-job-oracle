
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Props = { 
  onSubmit: (profile: any) => void;
  isLoading: boolean;
};

const DEFAULTS = {
  preferredTitle: "",
  skills: "",
  location: "",
  salary: "",
  remotePreference: "Any",
};

export default function ProfileInput({ onSubmit, isLoading }: Props) {
  const { register, handleSubmit, reset } = useForm({ defaultValues: DEFAULTS });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setResumeFile(e.target.files[0]);
    } else {
      setResumeFile(null);
    }
  };

  async function onFormSubmit(profile: any) {
    if (isLoading || isUploading) return;

    let resumeUrl = null;
    if (resumeFile) {
      setIsUploading(true);
      try {
        const fileName = `${Date.now()}-${resumeFile.name}`;
        const { data, error } = await supabase.storage
          .from('resumes')
          .upload(`public/${fileName}`, resumeFile);

        if (error) {
          throw error;
        }

        const { data: urlData } = supabase.storage
          .from('resumes')
          .getPublicUrl(data.path);
        
        resumeUrl = urlData.publicUrl;
        toast.success("Resume uploaded successfully!");
      } catch (error: any) {
        console.error("Error uploading resume:", error);
        toast.error(`Resume upload failed: ${error.message}`);
        setIsUploading(false);
        return; // Don't submit if upload fails
      } finally {
        setIsUploading(false);
      }
    }
    
    onSubmit({ ...profile, resumeUrl });
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={handleSubmit(onFormSubmit)}
      autoComplete="off"
    >
      <div>
        <label className="font-semibold text-sm mb-1 block" htmlFor="title">
          Preferred Job Title
        </label>
        <input
          {...register("preferredTitle")}
          id="title"
          type="text"
          placeholder="e.g. Frontend Developer"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>
      <div>
        <label className="font-semibold text-sm mb-1 block" htmlFor="skills">
          Main Skills (comma-separated)
        </label>
        <input
          {...register("skills")}
          id="skills"
          type="text"
          placeholder="React, Python, AWS"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="font-semibold text-sm mb-1 block" htmlFor="location">
            Preferred Location
          </label>
          <input
            {...register("location")}
            id="location"
            type="text"
            placeholder="e.g. New York, Remote"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <div className="flex-1">
          <label className="font-semibold text-sm mb-1 block" htmlFor="salary">
            Salary Expectation
          </label>
          <input
            {...register("salary")}
            id="salary"
            type="text"
            placeholder="$100,000+"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>
      <div>
        <label className="font-semibold text-sm mb-1 block" htmlFor="remotePreference">
          Remote Preference
        </label>
        <select
          {...register("remotePreference")}
          id="remotePreference"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="Any">Any</option>
          <option value="Remote">Remote</option>
          <option value="Onsite">Onsite</option>
        </select>
      </div>
      <div>
        <label className="block font-semibold text-sm mb-1" htmlFor="resume">
          Upload Resume
        </label>
        <input
          type="file"
          id="resume"
          onChange={handleFileChange}
          className="w-full block rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
          accept=".pdf,.doc,.docx,.txt"
        />
        {resumeFile && <span className="text-xs text-muted-foreground mt-1 block">Selected: {resumeFile.name}</span>}
        <span className="text-xs text-muted-foreground">(PDF, DOC, DOCX, TXT formats)</span>
      </div>
      <Button disabled={isLoading || isUploading} className="mt-2 w-full">
        {isUploading ? "Uploading resume..." : isLoading ? "Analyzing jobs..." : "Find Matched Jobs"}
      </Button>
    </form>
  );
}
