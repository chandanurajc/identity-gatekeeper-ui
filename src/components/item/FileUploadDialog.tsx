
import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { itemAttachmentService } from "@/services/itemAttachmentService";
import { useMultiTenant } from "@/hooks/useMultiTenant";
import { useAuth } from "@/context/AuthContext";

interface FileUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  onUploadSuccess: () => void;
}

export function FileUploadDialog({ open, onOpenChange, itemId, onUploadSuccess }: FileUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'display_picture' | 'other_document'>('other_document');
  const [isDefault, setIsDefault] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { getCurrentOrganizationId } = useMultiTenant();
  const { user } = useAuth();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleFileTypeChange = (value: 'display_picture' | 'other_document') => {
    setFileType(value);
    // Reset default checkbox when changing file type
    if (value !== 'display_picture') {
      setIsDefault(false);
    }
  };

  const validateFile = async (): Promise<boolean> => {
    if (!file) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a file to upload."
      });
      return false;
    }

    if (fileType === 'display_picture') {
      // Validate file format and size
      const basicValidation = itemAttachmentService.validateDisplayPicture(file);
      if (basicValidation) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: basicValidation
        });
        return false;
      }

      // Validate dimensions
      const dimensionValidation = await itemAttachmentService.validateImageDimensions(file);
      if (dimensionValidation) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: dimensionValidation
        });
        return false;
      }
    }

    return true;
  };

  const handleUpload = async () => {
    if (!await validateFile() || !user?.email) return;

    const organizationId = getCurrentOrganizationId();
    if (!organizationId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Organization context not found."
      });
      return;
    }

    setUploading(true);

    try {
      // Upload to Cloudinary
      const cloudinaryResponse = await itemAttachmentService.uploadToCloudinary(file!);

      // Create attachment record
      await itemAttachmentService.createAttachment(
        organizationId,
        {
          itemId,
          fileName: file!.name,
          fileType,
          secureUrl: cloudinaryResponse.secure_url,
          isDefault: fileType === 'display_picture' ? isDefault : false
        },
        user.email
      );

      toast({
        title: "Success",
        description: "File uploaded successfully."
      });

      // Reset form
      setFile(null);
      setFileType('other_document');
      setIsDefault(false);
      onUploadSuccess();
      onOpenChange(false);

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload file."
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
          <DialogDescription>
            Upload a file attachment for this item.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="file">Select File</Label>
            <Input
              id="file"
              type="file"
              onChange={handleFileChange}
              accept={fileType === 'display_picture' ? 'image/jpeg,image/png,image/webp' : '*'}
            />
          </div>

          <div>
            <Label htmlFor="fileType">File Type</Label>
            <Select value={fileType} onValueChange={handleFileTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="other_document">Other Document</SelectItem>
                <SelectItem value="display_picture">Display Picture</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {fileType === 'display_picture' && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isDefault"
                checked={isDefault}
                onCheckedChange={(checked) => setIsDefault(checked as boolean)}
              />
              <Label htmlFor="isDefault">Set as Default Thumbnail</Label>
            </div>
          )}

          {fileType === 'display_picture' && (
            <div className="text-sm text-muted-foreground">
              <p>Display Picture Requirements:</p>
              <ul className="list-disc list-inside mt-1">
                <li>Format: JPEG, PNG, or WEBP</li>
                <li>Resolution: 800x800 to 3000x3000 pixels</li>
                <li>Max file size: 5MB</li>
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={uploading || !file}>
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
