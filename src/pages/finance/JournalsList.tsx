import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus, Eye, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { useAuth } from "@/context/AuthContext";
import { useJournalPermissions } from "@/hooks/useJournalPermissions";
import { journalService } from "@/services/journalService";
import PermissionButton from "@/components/PermissionButton";

export default function JournalsList() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { getCurrentOrganizationId } = useMultiTenant();
  const organizationId = getCurrentOrganizationId();
  const { canViewJournal, canPostJournal, canReverseJournal } = useJournalPermissions();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data: journals = [], isLoading, refetch } = useQuery({
    queryKey: ['journals', organizationId],
    queryFn: () => organizationId ? journalService.getJournals(organizationId) : Promise.resolve([]),
    enabled: !!organizationId && canViewJournal,
  });

  const handlePostJournal = async (id: string) => {
    if (!organizationId) return;
    
    setProcessingId(id);
    try {
      await journalService.postJournal(id, organizationId, user?.email || '');
      toast({
        title: "Success",
        description: "Journal posted successfully",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to post journal",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReverseJournal = async (id: string) => {
    if (!organizationId) return;
    
    setProcessingId(id);
    try {
      await journalService.reverseJournal(id, organizationId, user?.email || '');
      toast({
        title: "Success",
        description: "Journal reversed successfully",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reverse journal",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (!canViewJournal) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to view journals.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Journals</h1>
          <p className="text-muted-foreground">Manage journal entries</p>
        </div>
        <Link to="/finance/journals/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Journal
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : journals.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No journals found. Create your first journal to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Journal Date</TableHead>
                  <TableHead>Source Type</TableHead>
                  <TableHead>Source Reference</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Lines</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {journals.map((journal) => (
                  <TableRow key={journal.id}>
                    <TableCell className="font-medium">
                      {new Date(journal.journalDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {journal.sourceType && (
                        <Badge variant="outline">{journal.sourceType}</Badge>
                      )}
                    </TableCell>
                    <TableCell>{journal.sourceReference || '-'}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          journal.status === 'Posted' ? 'default' : 
                          journal.status === 'Reversed' ? 'destructive' : 'secondary'
                        }
                      >
                        {journal.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{journal.journalLines?.length || 0}</TableCell>
                    <TableCell>{journal.createdBy}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                        >
                          <Link to={`/finance/journals/${journal.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        
                        {journal.status === 'Draft' && (
                          <PermissionButton
                            permission="Post Journal"
                            onClick={() => handlePostJournal(journal.id)}
                            size="sm"
                            variant="outline"
                            disabled={processingId === journal.id}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </PermissionButton>
                        )}
                        
                        {journal.status === 'Posted' && (
                          <PermissionButton
                            permission="Reverse Journal"
                            onClick={() => handleReverseJournal(journal.id)}
                            size="sm"
                            variant="outline"
                            disabled={processingId === journal.id}
                          >
                            <XCircle className="h-4 w-4" />
                          </PermissionButton>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}