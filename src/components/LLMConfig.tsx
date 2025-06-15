
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Key, Computer, Settings } from 'lucide-react';
import { toast } from "sonner";

type Provider = "gemini" | "openai" | "local";

const LLMConfig = () => {
  const [provider, setProvider] = useState<Provider>("gemini");
  const [apiKey, setApiKey] = useState("");
  const [localUrl, setLocalUrl] = useState("http://localhost:11434");

  useEffect(() => {
    try {
      const savedProvider = localStorage.getItem("llmProvider") as Provider | null;
      const savedApiKey = localStorage.getItem("llmApiKey");
      const savedLocalUrl = localStorage.getItem("llmLocalUrl");

      if (savedProvider) setProvider(savedProvider);
      if (savedApiKey) setApiKey(savedApiKey);
      if (savedLocalUrl) setLocalUrl(savedLocalUrl);
    } catch (error) {
      console.error("Failed to access localStorage", error);
      toast.error("Could not load settings. Is localStorage available?");
    }
  }, []);

  const handleSave = () => {
    try {
      localStorage.setItem("llmProvider", provider);
      if (provider !== 'local') {
        localStorage.setItem("llmApiKey", apiKey);
        localStorage.removeItem("llmLocalUrl");
      } else {
        localStorage.setItem("llmLocalUrl", localUrl);
        localStorage.removeItem("llmApiKey");
      }
      toast.success("LLM configuration saved!");
    } catch (error) {
      console.error("Failed to access localStorage", error);
      toast.error("Could not save settings. Is localStorage available?");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Settings />
          <span>LLM Configuration</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="llm-provider">Provider</Label>
          <Select value={provider} onValueChange={(value) => setProvider(value as Provider)}>
            <SelectTrigger id="llm-provider">
              <SelectValue placeholder="Select a provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gemini">Gemini</SelectItem>
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="local">Local LLM</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {provider === 'local' ? (
          <div className="space-y-2">
            <Label htmlFor="local-url" className="flex items-center gap-2">
              <Computer />
              Local URL
            </Label>
            <Input
              id="local-url"
              value={localUrl}
              onChange={(e) => setLocalUrl(e.target.value)}
              placeholder="e.g., http://localhost:11434"
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="api-key" className="flex items-center gap-2">
              <Key />
              API Key
            </Label>
            <Input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
            />
          </div>
        )}
        <Button onClick={handleSave} className="w-full">Save Configuration</Button>
      </CardContent>
    </Card>
  );
};

export default LLMConfig;
