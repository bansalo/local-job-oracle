
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Building, DollarSign, ExternalLink, Clock } from "lucide-react";
import { Job } from "./MockData";

type Props = {
  job: Job;
  density: "compact" | "comfortable";
};

export default function JobCard({ job, density }: Props) {
  const isCompact = density === "compact";

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader className={`${isCompact ? "pb-2" : "pb-4"}`}>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <a 
              href={job.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-700 hover:underline font-semibold"
            >
              {job.title}
            </a>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Building className="h-3 w-3" />
              {job.company}
            </div>
          </div>
          <Badge className="bg-blue-600/90 text-white">
            {job.score}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className={`${isCompact ? "pt-0" : ""}`}>
        <div className="space-y-2">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {job.location}
            </div>
            {job.remote && (
              <Badge variant="outline" className="text-xs">
                Remote
              </Badge>
            )}
          </div>
          
          {job.compensation && (
            <div className="flex items-center gap-1 text-sm">
              <DollarSign className="h-3 w-3 text-green-600" />
              <span className="text-green-600 font-medium">{job.compensation}</span>
            </div>
          )}
          
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {job.source}
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href={job.link} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3 mr-1" />
                View
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
