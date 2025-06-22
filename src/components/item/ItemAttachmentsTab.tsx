
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { Upload, Eye, Edit, Trash2 } from "lucide-react";
import { FileUploadDialog } from "./FileUploadDialog";
import { ImagePreviewModal } from "./ImagePreviewModal";
import { itemAttachmentService } from "@/services/itemAttachmentService";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { ItemAttachment } from "@/types/itemAttachment";

interface ItemAttachmentsTabProps {
  itemId: string;
  readonly?: boolean;
}

export function ItemAttachmentsTab({ itemId, readonly = false }: ItemAttachmentsTabProps) {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; fileName: string } | null>(null);
  const { toast } = useToast();
  const { getCurrentOrganizationId } = useMultiTenant();
  const queryClient = useQueryClient();

  const organizationId = getCurrentOrganizationId();

  const { data: attachments = [], isLoading } = useQuery({
    queryKey: ["item-attachments", itemId, organizationId],
    queryFn: () => itemAttachmentService.getAttachmentsByItem(organizationId!, itemId),
    enabled: !!organizationId && !!itemId,
  });

  const updateMutation = useMutation({
    mutationFn: ({ attachmentId, isDefault }: { attachmentId: string; isDefault: boolean }) =>
      itemAttachmentService.updateAttachment(organizationId!, attachmentId, { isDefault }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["item-attachments", itemId] });
      toast({ title: "Success", description: "Attachment updated successfully." });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (attachmentId: string) =>
      itemAttachmentService.deleteAttachment(organizationId!, attachmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["item-attachments", itemId] });
      toast({ title: "Success", description: "Attachment deleted successfully." });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const handlePreview = (attachment: ItemAttachment) => {
    setPreviewImage({
      url: attachment.secureUrl,
      fileName: attachment.fileName
    });
  };

  const handleToggleDefault = (attachment: ItemAttachment) => {
    if (attachment.fileType !== 'display_picture') return;
    
    updateMutation.mutate({
      attachmentId: attachment.id,
      isDefault: !attachment.isDefault
    });
  };

  const handleDelete = (attachmentId: string) => {
    if (window.confirm('Are you sure you want to delete this attachment?')) {
      deleteMutation.mutate(attachmentId);
    }
  };

  const handleUploadSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["item-attachments", itemId] });
  };

  if (isLoading) {
    return <div>Loading attachments...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Attachments</CardTitle>
            <CardDescription>
              Manage files and display pictures for this item
            </CardDescription>
          </div>
          {!readonly && (
            <Button onClick={() => setShowUploadDialog(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {attachments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No attachments found for this item.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead>File Type</TableHead>
                <TableHead>Default</TableHead>
                <TableHead>Uploaded By</TableHead>
                <TableHead>Uploaded On</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attachments.map((attachment) => (
                <TableRow key={attachment.id}>
                  <TableCell>
                    <Button
                      variant="link"
                      className="p-0 h-auto"
                      onClick={() => handlePreview(attachment)}
                    >
                      {attachment.fileName}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Badge variant={attachment.fileType === 'display_picture' ? 'default' : 'secondary'}>
                      {attachment.fileType === 'display_picture' ? 'Display Picture' : 'Other Document'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {attachment.fileType === 'display_picture' && (
                      <Badge variant={attachment.isDefault ? 'default' : 'outline'}>
                        {attachment.isDefault ? 'Yes' : 'No'}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{attachment.uploadedBy}</TableCell>
                  <TableCell>{format(attachment.uploadedOn, 'PPp')}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePreview(attachment)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {!readonly && attachment.fileType === 'display_picture' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleDefault(attachment)}
                          disabled={updateMutation.isPending}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {!readonly && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(attachment.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <FileUploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        itemId={itemId}
        onUploadSuccess={handleUploadSuccess}
      />

      <ImagePreviewModal
        open={!!previewImage}
        onOpenChange={() => setPreviewImage(null)}
        imageUrl={previewImage?.url || ""}
        fileName={previewImage?.fileName || ""}
      />
    </Card>
  );
}
