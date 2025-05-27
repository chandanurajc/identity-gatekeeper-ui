
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { OrganizationSearchResult } from "@/types/partner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { partnerService } from "@/services/partnerService";
import { useAuth } from "@/context/AuthContext";
import { Search } from "lucide-react";

const searchSchema = z.object({
  searchType: z.enum(['code', 'gst'], {
    required_error: "Search criteria is required",
  }),
  searchTerm: z.string().min(1, "Search term is required"),
});

interface AddPartnerProps {
  onPartnerAdded: () => void;
}

const AddPartner = ({ onPartnerAdded }: AddPartnerProps) => {
  const [searchResults, setSearchResults] = useState<OrganizationSearchResult[]>([]);
  const [selectedOrganizations, setSelectedOrganizations] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<z.infer<typeof searchSchema>>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      searchType: undefined,
      searchTerm: "",
    },
  });

  const handleSearch = async (values: z.infer<typeof searchSchema>) => {
    setIsSearching(true);
    try {
      const results = await partnerService.searchOrganizations(
        values.searchType,
        values.searchTerm.trim()
      );
      setSearchResults(results);
      setSelectedOrganizations([]);
      
      if (results.length === 0) {
        toast({
          title: "No Results",
          description: "No organizations found matching your search criteria",
        });
      }
    } catch (error) {
      console.error("Search error:", error);
      toast({
        variant: "destructive",
        title: "Search Failed",
        description: error instanceof Error ? error.message : "Failed to search organizations",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleOrganizationSelect = (organizationId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrganizations(prev => [...prev, organizationId]);
    } else {
      setSelectedOrganizations(prev => prev.filter(id => id !== organizationId));
    }
  };

  const handleCreatePartnership = async () => {
    if (selectedOrganizations.length === 0) {
      toast({
        variant: "destructive",
        title: "No Selection",
        description: "Please select at least one organization to create a partnership",
      });
      return;
    }

    if (!user?.name && !user?.email) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "User information not available",
      });
      return;
    }

    setIsCreating(true);
    try {
      await partnerService.createPartnerships(
        selectedOrganizations,
        user.name || user.email || "System"
      );
      
      toast({
        title: "Success",
        description: `${selectedOrganizations.length} partnership(s) created successfully`,
      });
      
      // Reset form and results
      form.reset();
      setSearchResults([]);
      setSelectedOrganizations([]);
      onPartnerAdded();
      
    } catch (error) {
      console.error("Error creating partnerships:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create partnerships",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Search Organizations</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSearch)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="searchType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Search Criteria *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select search criteria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="code">Organization Code</SelectItem>
                          <SelectItem value="gst">GST Number</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="searchTerm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Search Term</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter search term" 
                          {...field} 
                          disabled={isSearching}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex items-end">
                  <Button 
                    type="submit" 
                    disabled={isSearching}
                    className="w-full"
                  >
                    {isSearching ? "Searching..." : "Search"}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {searchResults.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Search Results ({searchResults.length})</CardTitle>
            <Button 
              onClick={handleCreatePartnership}
              disabled={selectedOrganizations.length === 0 || isCreating}
            >
              {isCreating ? "Creating..." : `Create Partnership (${selectedOrganizations.length})`}
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Select</TableHead>
                  <TableHead>Organization Code</TableHead>
                  <TableHead>Organization Name</TableHead>
                  <TableHead>Organization Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {searchResults.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedOrganizations.includes(org.id)}
                        onCheckedChange={(checked) => 
                          handleOrganizationSelect(org.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell className="font-medium">{org.code}</TableCell>
                    <TableCell>{org.name}</TableCell>
                    <TableCell>{org.type}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AddPartner;
