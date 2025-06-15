
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X, Bookmark } from "lucide-react";

type SavedSearch = {
  id: string;
  name: string;
  query: string;
};

type Props = {
  onSearch: (query: string) => void;
  placeholder?: string;
};

export default function SearchBar({ onSearch, placeholder = "Search jobs..." }: Props) {
  const [query, setQuery] = useState("");
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([
    { id: "1", name: "React Developer", query: "react developer remote" },
    { id: "2", name: "Senior Python", query: "senior python engineer" }
  ]);
  const [showSaved, setShowSaved] = useState(false);

  const handleSearch = () => {
    onSearch(query);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const saveCurrentSearch = () => {
    if (query.trim()) {
      const newSearch: SavedSearch = {
        id: Date.now().toString(),
        name: query.substring(0, 20),
        query: query.trim()
      };
      setSavedSearches([...savedSearches, newSearch]);
    }
  };

  const loadSavedSearch = (search: SavedSearch) => {
    setQuery(search.query);
    onSearch(search.query);
    setShowSaved(false);
  };

  const removeSavedSearch = (id: string) => {
    setSavedSearches(savedSearches.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="pl-9"
          />
        </div>
        <Button onClick={handleSearch} size="default">
          Search
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowSaved(!showSaved)}
          size="default"
        >
          <Bookmark className="h-4 w-4" />
        </Button>
        {query.trim() && (
          <Button variant="outline" onClick={saveCurrentSearch} size="default">
            Save
          </Button>
        )}
      </div>

      {showSaved && savedSearches.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">Saved searches:</span>
          {savedSearches.map(search => (
            <Badge
              key={search.id}
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80 flex items-center gap-1"
              onClick={() => loadSavedSearch(search)}
            >
              {search.name}
              <X
                className="h-3 w-3 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  removeSavedSearch(search.id);
                }}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
