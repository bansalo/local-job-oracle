
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from 'lucide-react';
import { UseMutationResult } from "@tanstack/react-query";

type AddCompanyMutation = UseMutationResult<any, Error, string, unknown>;

type Props = {
    addCompanyMutation: AddCompanyMutation;
};

const AddCompanyForm = ({ addCompanyMutation }: Props) => {
    const [newCompanyName, setNewCompanyName] = useState("");

    const handleAddCompany = (e: React.FormEvent) => {
        e.preventDefault();
        if (newCompanyName.trim()) {
            addCompanyMutation.mutate(newCompanyName.trim(), {
                onSuccess: () => {
                    setNewCompanyName("");
                }
            });
        }
    };

    return (
        <form onSubmit={handleAddCompany} className="flex w-full items-center space-x-2 mb-4">
            <Input
                type="text"
                placeholder="e.g., Google"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                disabled={addCompanyMutation.isPending}
            />
            <Button type="submit" disabled={addCompanyMutation.isPending || !newCompanyName.trim()}>
                {addCompanyMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {addCompanyMutation.isPending ? "Adding..." : "Add"}
            </Button>
        </form>
    );
};

export default AddCompanyForm;
