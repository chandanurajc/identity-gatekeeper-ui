
import * as React from "react";
import { X, Check, ChevronsUpDown } from "lucide-react";
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList 
} from "@/components/ui/command";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type OptionType = {
  label: string;
  value: string;
};

interface MultiSelectProps {
  options: OptionType[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select options",
  className,
  disabled = false,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  // Debug
  React.useEffect(() => {
    console.log("MultiSelect options:", options);
    console.log("MultiSelect selected:", selected);
  }, [options, selected]);

  // Filter out any options with empty values to prevent the error
  const validOptions = React.useMemo(() => {
    const filtered = options.filter(option => option.value && option.value.trim() !== '');
    console.log("Filtered valid options:", filtered);
    return filtered;
  }, [options]);

  // Ensure selected values are valid
  const validSelected = React.useMemo(() => {
    const filtered = selected.filter(value => value && value.trim() !== '');
    console.log("Filtered valid selected:", filtered);
    return filtered;
  }, [selected]);

  const handleUnselect = (value: string) => {
    onChange(validSelected.filter((item) => item !== value));
  };

  const handleSelect = (value: string) => {
    if (!value || value.trim() === '') {
      console.warn("Attempted to select an empty value");
      return;
    }
    
    if (validSelected.includes(value)) {
      onChange(validSelected.filter((item) => item !== value));
    } else {
      onChange([...validSelected, value]);
    }
  };

  // Get displayed label for selected values
  const selectedLabels = React.useMemo(() => {
    return validOptions
      .filter((option) => validSelected.includes(option.value))
      .map((option) => option.label);
  }, [validOptions, validSelected]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between min-h-10",
            validSelected.length > 0 ? "h-auto" : "",
            className
          )}
          disabled={disabled}
        >
          <div className="flex flex-wrap gap-1">
            {validSelected.length === 0 && <span className="text-muted-foreground">{placeholder}</span>}
            {selectedLabels.map((label) => (
              <Badge
                key={label}
                variant="secondary"
                className="mr-1 mb-1"
              >
                {label}
                <button
                  className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const option = validOptions.find(o => o.label === label);
                    if (option) handleUnselect(option.value);
                  }}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>No options found.</CommandEmpty>
            <CommandGroup>
              {validOptions.length > 0 ? (
                validOptions.map((option) => {
                  const isSelected = validSelected.includes(option.value);
                  return (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      onSelect={() => handleSelect(option.value)}
                    >
                      <div className="flex items-center gap-2 w-full">
                        <span className={cn(
                          "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                          isSelected ? "bg-primary text-primary-foreground" : "opacity-50"
                        )}>
                          {isSelected && <Check className="h-3 w-3" />}
                        </span>
                        <span>{option.label}</span>
                      </div>
                    </CommandItem>
                  );
                })
              ) : (
                <CommandItem disabled>No valid options available</CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
