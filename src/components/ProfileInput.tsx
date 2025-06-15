
import { useForm } from "react-hook-form";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type Props = { onSubmit: (profile: any) => void };

const DEFAULTS = {
  preferredTitle: "",
  skills: "",
  location: "",
  salary: "",
  remotePreference: "Any",
};

export default function ProfileInput({ onSubmit }: Props) {
  const { register, handleSubmit, reset } = useForm({ defaultValues: DEFAULTS });
  const [loading, setLoading] = useState(false);

  function onFormSubmit(profile: any) {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSubmit(profile);
    }, 500); // Simulate backend processing
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
          Resume (Not uploaded - demo)
        </label>
        <input
          type="file"
          id="resume"
          disabled
          className="w-full block rounded-md border bg-muted text-muted placeholder:text-muted-foreground px-3 py-2 text-sm"
        />
        <span className="text-xs text-muted-foreground">(Resume parsing available in full version)</span>
      </div>
      <Button disabled={loading} className="mt-2 w-full">
        {loading ? "Analyzing profile..." : "Find Jobs"}
      </Button>
    </form>
  );
}
