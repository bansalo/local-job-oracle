
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CompanyManager from "@/components/CompanyManager";
import ProfileInput from "@/components/ProfileInput";
import LLMConfig from "@/components/LLMConfig";

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
  onProfileSubmit: (profile: any) => void;
  isAnalyzing: boolean;
};

export default function Sidebar({ collapsed, onToggle, onProfileSubmit, isAnalyzing }: SidebarProps) {
  return (
    <div className={`${collapsed ? 'w-16' : 'w-80'} transition-all duration-300 bg-card border-r flex flex-col`}>
      <div className="p-4 border-b">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="w-full justify-start"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span className="ml-2">Collapse</span>}
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!collapsed && (
          <>
            <CompanyManager />
            <ProfileInput onSubmit={onProfileSubmit} isLoading={isAnalyzing} />
            <LLMConfig />
          </>
        )}
      </div>
    </div>
  );
}
