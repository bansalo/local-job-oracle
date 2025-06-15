
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutGrid, LayoutList, Settings, Eye, EyeOff } from "lucide-react";

type ViewMode = "table" | "cards";
type Density = "compact" | "comfortable";

type Props = {
  viewMode: ViewMode;
  density: Density;
  itemsPerPage: number;
  onViewModeChange: (mode: ViewMode) => void;
  onDensityChange: (density: Density) => void;
  onItemsPerPageChange: (items: number) => void;
  visibleColumns: string[];
  onColumnToggle: (column: string) => void;
};

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];
const AVAILABLE_COLUMNS = [
  { key: "title", label: "Title" },
  { key: "company", label: "Company" },
  { key: "location", label: "Location" },
  { key: "remote", label: "Remote" },
  { key: "compensation", label: "Compensation" },
  { key: "source", label: "Source" },
  { key: "score", label: "Score" }
];

export default function LayoutControls({
  viewMode,
  density,
  itemsPerPage,
  onViewModeChange,
  onDensityChange,
  onItemsPerPageChange,
  visibleColumns,
  onColumnToggle
}: Props) {
  const [showColumnControls, setShowColumnControls] = useState(false);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Display Options
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">View Mode</label>
          <ToggleGroup type="single" value={viewMode} onValueChange={onViewModeChange} className="justify-start">
            <ToggleGroupItem value="table" aria-label="Table view">
              <LayoutList className="h-4 w-4 mr-1" />
              Table
            </ToggleGroupItem>
            <ToggleGroupItem value="cards" aria-label="Card view">
              <LayoutGrid className="h-4 w-4 mr-1" />
              Cards
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Density</label>
          <ToggleGroup type="single" value={density} onValueChange={onDensityChange} className="justify-start">
            <ToggleGroupItem value="compact" aria-label="Compact">
              Compact
            </ToggleGroupItem>
            <ToggleGroupItem value="comfortable" aria-label="Comfortable">
              Comfortable
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Items per page</label>
          <Select value={itemsPerPage.toString()} onValueChange={(value) => onItemsPerPageChange(Number(value))}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ITEMS_PER_PAGE_OPTIONS.map(option => (
                <SelectItem key={option} value={option.toString()}>{option} items</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {viewMode === "table" && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Visible Columns</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowColumnControls(!showColumnControls)}
              >
                {showColumnControls ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
            </div>
            {showColumnControls && (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {AVAILABLE_COLUMNS.map(column => (
                  <div key={column.key} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`column-${column.key}`}
                      checked={visibleColumns.includes(column.key)}
                      onChange={() => onColumnToggle(column.key)}
                      className="rounded"
                    />
                    <label htmlFor={`column-${column.key}`} className="text-sm">{column.label}</label>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
