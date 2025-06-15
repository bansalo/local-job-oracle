
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Filter } from "lucide-react";

type FilterState = {
  jobTypes: string[];
  experienceLevels: string[];
  companySizes: string[];
  datePosted: string;
  sortBy: string;
};

type Props = {
  onFiltersChange: (filters: FilterState) => void;
  isCollapsed: boolean;
};

const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship", "Freelance"];
const EXPERIENCE_LEVELS = ["Entry Level", "Mid Level", "Senior Level", "Executive"];
const COMPANY_SIZES = ["Startup (1-50)", "Small (51-200)", "Medium (201-1000)", "Large (1000+)"];
const DATE_OPTIONS = ["Any time", "Last 24 hours", "Last week", "Last month"];
const SORT_OPTIONS = ["Relevance", "Date posted", "Salary (high to low)", "Company name"];

export default function JobFilters({ onFiltersChange, isCollapsed }: Props) {
  const [filters, setFilters] = useState<FilterState>({
    jobTypes: [],
    experienceLevels: [],
    companySizes: [],
    datePosted: "Any time",
    sortBy: "Relevance"
  });

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFiltersChange(updated);
  };

  const toggleArrayFilter = (key: keyof Pick<FilterState, 'jobTypes' | 'experienceLevels' | 'companySizes'>, value: string) => {
    const current = filters[key];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    updateFilters({ [key]: updated });
  };

  const clearAllFilters = () => {
    const cleared = {
      jobTypes: [],
      experienceLevels: [],
      companySizes: [],
      datePosted: "Any time",
      sortBy: "Relevance"
    };
    setFilters(cleared);
    onFiltersChange(cleared);
  };

  const activeFiltersCount = filters.jobTypes.length + filters.experienceLevels.length + filters.companySizes.length + 
    (filters.datePosted !== "Any time" ? 1 : 0) + (filters.sortBy !== "Relevance" ? 1 : 0);

  if (isCollapsed) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="h-5 px-2 text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </CardTitle>
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                Clear all
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters & Sorting
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="h-5 px-2 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </CardTitle>
          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              <X className="h-3 w-3 mr-1" />
              Clear all
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Sort by</label>
          <Select value={filters.sortBy} onValueChange={(value) => updateFilters({ sortBy: value })}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Date posted</label>
          <Select value={filters.datePosted} onValueChange={(value) => updateFilters({ datePosted: value })}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_OPTIONS.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Job Type</label>
          <div className="space-y-2">
            {JOB_TYPES.map(type => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  id={`job-type-${type}`}
                  checked={filters.jobTypes.includes(type)}
                  onCheckedChange={() => toggleArrayFilter('jobTypes', type)}
                />
                <label htmlFor={`job-type-${type}`} className="text-sm">{type}</label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Experience Level</label>
          <div className="space-y-2">
            {EXPERIENCE_LEVELS.map(level => (
              <div key={level} className="flex items-center space-x-2">
                <Checkbox
                  id={`exp-level-${level}`}
                  checked={filters.experienceLevels.includes(level)}
                  onCheckedChange={() => toggleArrayFilter('experienceLevels', level)}
                />
                <label htmlFor={`exp-level-${level}`} className="text-sm">{level}</label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Company Size</label>
          <div className="space-y-2">
            {COMPANY_SIZES.map(size => (
              <div key={size} className="flex items-center space-x-2">
                <Checkbox
                  id={`company-size-${size}`}
                  checked={filters.companySizes.includes(size)}
                  onCheckedChange={() => toggleArrayFilter('companySizes', size)}
                />
                <label htmlFor={`company-size-${size}`} className="text-sm">{size}</label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
