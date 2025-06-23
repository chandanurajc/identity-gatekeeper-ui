
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Eye } from "lucide-react";
import { ImagePreviewModal } from "./ImagePreviewModal";
import { itemAttachmentService } from "@/services/itemAttachmentService";
import { useMultiTenant } from "@/hooks/useMultiTenant";

interface ItemThumbnailViewerProps {
  itemId: string;
}

export function ItemThumbnailViewer({ itemId }: ItemThumbnailViewerProps) {
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();
  const { getCurrentOrganizationId } = useMultiTenant();

  const organizationId = getCurrentOrganizationId();

  const { data: defaultThumbnail } = useQuery({
    queryKey: ["item-default-thumbnail", itemId, organizationId],
    queryFn: () => itemAttachmentService.getDefaultDisplayPicture(organizationId!, itemId),
    enabled: !!organizationId && !!itemId,
  });

  const handleViewThumbnail = () => {
    if (!defaultThumbnail) {
      toast({
        variant: "destructive",
        title: "No Thumbnail",
        description: "This item doesn't have a default display picture set."
      });
      return;
    }
    setShowPreview(true);
  };

  if (!defaultThumbnail) {
    return null;
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleViewThumbnail}
        className="text-blue-600 hover:text-blue-800 p-1"
      >
        <Eye className="h-4 w-4" />
      </Button>

      <ImagePreviewModal
        open={showPreview}
        onOpenChange={setShowPreview}
        imageUrl={defaultThumbnail.secureUrl}
        fileName={defaultThumbnail.fileName}
      />
    </>
  );
}
