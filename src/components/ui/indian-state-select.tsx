
import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface IndianState {
  state_code: number;
  state_name: string;
}

interface IndianStateSelectProps {
  value?: string;
  onValueChange: (stateName: string, stateCode: number) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const IndianStateSelect = ({ 
  value, 
  onValueChange, 
  placeholder = "Select state...",
  disabled = false 
}: IndianStateSelectProps) => {
  const [open, setOpen] = useState(false);
  const [states, setStates] = useState<IndianState[]>([]);
  const [filteredStates, setFilteredStates] = useState<IndianState[]>([]);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    fetchStates();
  }, []);

  useEffect(() => {
    if (searchValue.trim()) {
      const filtered = states
        .filter(state => 
          state.state_name?.toLowerCase().includes(searchValue.toLowerCase())
        )
        .slice(0, 5);
      setFilteredStates(filtered);
    } else {
      setFilteredStates(states.slice(0, 5));
    }
  }, [searchValue, states]);

  const fetchStates = async () => {
    try {
      const { data, error } = await supabase
        .from('india_state_code')
        .select('state_code, state_name')
        .order('state_name');

      if (error) {
        console.error('Error fetching states:', error);
        return;
      }

      setStates(data || []);
      setFilteredStates((data || []).slice(0, 5));
    } catch (error) {
      console.error('Error fetching states:', error);
    }
  };

  const handleSelect = (stateName: string, stateCode: number) => {
    onValueChange(stateName, stateCode);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {value || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder="Search state..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>No state found.</CommandEmpty>
            <CommandGroup>
              {filteredStates.map((state) => (
                <CommandItem
                  key={state.state_code}
                  value={state.state_name || ''}
                  onSelect={() => handleSelect(state.state_name || '', state.state_code)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === state.state_name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {state.state_name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
