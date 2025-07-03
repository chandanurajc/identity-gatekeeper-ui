import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";
import type { ReferenceTransactionSearchParams, ReferenceTransactionResult } from "@/types/invoice";

interface ReferenceTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (transaction: ReferenceTransactionResult) => void;
  suppliers: Array<{ id: string; name: string }>;
}

export function ReferenceTransactionDialog({ 
  open, 
  onOpenChange, 
  onSelect,
  suppliers 
}: ReferenceTransactionDialogProps) {
  const [searchParams, setSearchParams] = useState<ReferenceTransactionSearchParams>({
    transactionType: 'Purchase Order',
    transactionNumber: '',
    transactionDate: '',
    supplierName: ''
  });
  
  const [searchResults, setSearchResults] = useState<ReferenceTransactionResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      // Mock search results for now - in real implementation this would call the API
      const mockResults: ReferenceTransactionResult[] = [
        {
          id: "1",
          transactionType: searchParams.transactionType,
          transactionNumber: "PO-2024-001",
          transactionDate: "2024-01-15",
          supplierName: "ABC Suppliers",
          totalValue: 15000
        },
        {
          id: "2", 
          transactionType: searchParams.transactionType,
          transactionNumber: "PO-2024-002",
          transactionDate: "2024-01-16",
          supplierName: "XYZ Corp",
          totalValue: 25000
        }
      ];
      
      setSearchResults(mockResults);
    } catch (error) {
      console.error("Error searching transactions:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (transaction: ReferenceTransactionResult) => {
    onSelect(transaction);
    onOpenChange(false);
    setSearchResults([]);
    setSearchParams({
      transactionType: 'Purchase Order',
      transactionNumber: '',
      transactionDate: '',
      supplierName: ''
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Search Reference Transaction</DialogTitle>
          <DialogDescription>
            Search for purchase orders or sales orders to reference in this invoice
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Search Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="transactionType">Transaction Type *</Label>
              <Select
                value={searchParams.transactionType}
                onValueChange={(value: 'Purchase Order' | 'Sales Order') => 
                  setSearchParams(prev => ({ ...prev, transactionType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Purchase Order">Purchase Order</SelectItem>
                  <SelectItem value="Sales Order">Sales Order</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transactionNumber">Transaction Number</Label>
              <Input
                id="transactionNumber"
                value={searchParams.transactionNumber}
                onChange={(e) => setSearchParams(prev => ({ ...prev, transactionNumber: e.target.value }))}
                placeholder="Enter transaction number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transactionDate">Transaction Date</Label>
              <Input
                id="transactionDate"
                type="date"
                value={searchParams.transactionDate}
                onChange={(e) => setSearchParams(prev => ({ ...prev, transactionDate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplierName">Supplier Name</Label>
              <Select
                value={searchParams.supplierName}
                onValueChange={(value) => setSearchParams(prev => ({ ...prev, supplierName: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.name}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSearch} disabled={isSearching} className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <span>{isSearching ? 'Searching...' : 'Search'}</span>
            </Button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <Label>Search Results</Label>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction Type</TableHead>
                      <TableHead>Number</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Total Value</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchResults.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{transaction.transactionType}</TableCell>
                        <TableCell>{transaction.transactionNumber}</TableCell>
                        <TableCell>{new Date(transaction.transactionDate).toLocaleDateString()}</TableCell>
                        <TableCell>{transaction.supplierName}</TableCell>
                        <TableCell>₹{transaction.totalValue.toLocaleString('en-IN')}</TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            onClick={() => handleSelect(transaction)}
                          >
                            Select
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}