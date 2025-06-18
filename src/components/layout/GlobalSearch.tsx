
import React, { useState, useEffect, useRef } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMultiTenant } from '@/hooks/useMultiTenant';
import { supabase } from '@/integrations/supabase/client';

interface SearchResult {
  id: string;
  type: 'po' | 'invoice' | 'partner' | 'item' | 'division';
  title: string;
  subtitle: string;
  url: string;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { getCurrentOrganizationId } = useMultiTenant();
  const organizationId = getCurrentOrganizationId();
  const searchRef = useRef<HTMLDivElement>(null);

  const debounceTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [query, organizationId]);

  const performSearch = async (searchTerm: string) => {
    if (!organizationId || searchTerm.length < 2) return;

    setLoading(true);
    const searchResults: SearchResult[] = [];

    try {
      // Search Purchase Orders
      const { data: poData } = await supabase
        .from('purchase_order')
        .select(`
          id,
          po_number,
          organizations!supplier_id(name)
        `)
        .eq('organization_id', organizationId)
        .or(`po_number.ilike.%${searchTerm}%`)
        .limit(5);

      if (poData) {
        poData.forEach(po => {
          searchResults.push({
            id: po.id,
            type: 'po',
            title: `PO: ${po.po_number}`,
            subtitle: `Supplier: ${po.organizations?.name || 'Unknown'}`,
            url: `/order-management/purchase-orders/${po.id}`
          });
        });
      }

      // Search Invoices
      const { data: invoiceData } = await supabase
        .from('invoice')
        .select('id, invoice_number, po_number')
        .eq('organization_id', organizationId)
        .or(`invoice_number.ilike.%${searchTerm}%,po_number.ilike.%${searchTerm}%`)
        .limit(5);

      if (invoiceData) {
        invoiceData.forEach(invoice => {
          searchResults.push({
            id: invoice.id,
            type: 'invoice',
            title: `Invoice: ${invoice.invoice_number}`,
            subtitle: `PO: ${invoice.po_number}`,
            url: `/invoices/${invoice.id}`
          });
        });
      }

      // Search Partners
      const { data: partnerData } = await supabase
        .from('partners')
        .select(`
          id,
          organizations!organization_id(name, code)
        `)
        .eq('current_organization_id', organizationId)
        .limit(5);

      if (partnerData) {
        const filteredPartners = partnerData.filter(partner => 
          partner.organizations?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          partner.organizations?.code?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        filteredPartners.forEach(partner => {
          searchResults.push({
            id: partner.id,
            type: 'partner',
            title: `Partner: ${partner.organizations?.name || 'Unknown'}`,
            subtitle: `Code: ${partner.organizations?.code || 'N/A'}`,
            url: `/master-data/partners`
          });
        });
      }

      // Search Items
      const { data: itemData } = await supabase
        .from('items')
        .select('id, description')
        .eq('organization_id', organizationId)
        .or(`id.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .limit(5);

      if (itemData) {
        itemData.forEach(item => {
          searchResults.push({
            id: item.id,
            type: 'item',
            title: `Item: ${item.id}`,
            subtitle: item.description,
            url: `/master-data/items/${item.id}`
          });
        });
      }

      // Search Divisions
      const { data: divisionData } = await supabase
        .from('divisions')
        .select('id, code, name')
        .eq('organization_id', organizationId)
        .or(`code.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`)
        .limit(5);

      if (divisionData) {
        divisionData.forEach(division => {
          searchResults.push({
            id: division.id,
            type: 'division',
            title: `Division: ${division.code}`,
            subtitle: division.name,
            url: `/admin/divisions/${division.id}`
          });
        });
      }

      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (url: string) => {
    navigate(url);
    setOpen(false);
    setQuery('');
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'po': return 'Purchase Orders';
      case 'invoice': return 'Invoices';
      case 'partner': return 'Partners';
      case 'item': return 'Items';
      case 'division': return 'Divisions';
      default: return 'Results';
    }
  };

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search POs, Invoices, Items..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(e.target.value.length >= 2);
              }}
              onFocus={() => setOpen(query.length >= 2)}
              className="pl-10 pr-4 bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-700"
            />
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0" align="center">
          <Command>
            <CommandList>
              {loading && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Searching...
                </div>
              )}
              {!loading && query.length >= 2 && results.length === 0 && (
                <CommandEmpty>No results found.</CommandEmpty>
              )}
              {Object.entries(groupedResults).map(([type, typeResults]) => (
                <CommandGroup key={type} heading={getTypeLabel(type)}>
                  {typeResults.map((result) => (
                    <CommandItem
                      key={`${result.type}-${result.id}`}
                      onSelect={() => handleSelect(result.url)}
                      className="cursor-pointer"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{result.title}</span>
                        <span className="text-sm text-muted-foreground">{result.subtitle}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
