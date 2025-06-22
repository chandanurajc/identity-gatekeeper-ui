
import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ImagePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  fileName: string;
}

export function ImagePreviewModal({ open, onOpenChange, imageUrl, fileName }: ImagePreviewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Image Preview</DialogTitle>
          <DialogDescription>{fileName}</DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-center">
          <img
            src={imageUrl}
            alt={fileName}
            className="max-w-full max-h-96 object-contain rounded-lg"
            style={{ maxWidth: '400px', maxHeight: '400px' }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
