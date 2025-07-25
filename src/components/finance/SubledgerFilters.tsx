import { useState } from "react";
import { Search, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

interface SubledgerFiltersProps {
  onFiltersChange: (filters: SubledgerFilterState) => void;
  isLoading?: boolean;
}

export interface SubledgerFilterState {
  search: string;
  transactionCategory: string;
  dateFrom: Date | null;
  dateTo: Date | null;
  amountFrom: string;
  amountTo: string;
  transactionType: "all" | "debit" | "credit";
  partyOrganization: string;
}

export function SubledgerFilters({ onFiltersChange, isLoading }: SubledgerFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState<SubledgerFilterState>({
    search: "",
    transactionCategory: "",
    dateFrom: null,
    dateTo: null,
    amountFrom: "",
    amountTo: "",
    transactionType: "all",
    partyOrganization: "",
  });

  const handleFilterChange = (key: keyof SubledgerFilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    const clearedFilters: SubledgerFilterState = {
      search: "",
      transactionCategory: "",
      dateFrom: null,
      dateTo: null,
      amountFrom: "",
      amountTo: "",
      transactionType: "all",
      partyOrganization: "",
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.transactionCategory) count++;
    if (filters.dateFrom) count++;
    if (filters.dateTo) count++;
    if (filters.amountFrom) count++;
    if (filters.amountTo) count++;
    if (filters.transactionType !== "all") count++;
    if (filters.partyOrganization) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search by reference, party name, or transaction category..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Button
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="gap-2"
          disabled={isLoading}
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>

        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            onClick={clearAllFilters}
            className="gap-2 text-muted-foreground"
            disabled={isLoading}
          >
            Clear all filters
          </Button>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Advanced Filters</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Transaction Category */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Transaction Category</label>
                <Select
                  value={filters.transactionCategory}
                  onValueChange={(value) => handleFilterChange("transactionCategory", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All categories</SelectItem>
                    <SelectItem value="Invoice">Invoice</SelectItem>
                    <SelectItem value="Payment">Payment</SelectItem>
                    <SelectItem value="Purchase Order">Purchase Order</SelectItem>
                    <SelectItem value="Journal">Journal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Transaction Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Transaction Type</label>
                <Select
                  value={filters.transactionType}
                  onValueChange={(value) => handleFilterChange("transactionType", value as "all" | "debit" | "credit")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All transactions</SelectItem>
                    <SelectItem value="debit">Debit only</SelectItem>
                    <SelectItem value="credit">Credit only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Party Organization */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Party Organization</label>
                <Input
                  placeholder="Filter by organization name"
                  value={filters.partyOrganization}
                  onChange={(e) => handleFilterChange("partyOrganization", e.target.value)}
                />
              </div>

              {/* Date From */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Date From</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateFrom ? format(filters.dateFrom, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.dateFrom || undefined}
                      onSelect={(date) => handleFilterChange("dateFrom", date || null)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Date To */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Date To</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateTo ? format(filters.dateTo, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.dateTo || undefined}
                      onSelect={(date) => handleFilterChange("dateTo", date || null)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Amount From */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount From</label>
                <Input
                  type="number"
                  placeholder="Min amount"
                  value={filters.amountFrom}
                  onChange={(e) => handleFilterChange("amountFrom", e.target.value)}
                />
              </div>

              {/* Amount To */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount To</label>
                <Input
                  type="number"
                  placeholder="Max amount"
                  value={filters.amountTo}
                  onChange={(e) => handleFilterChange("amountTo", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}