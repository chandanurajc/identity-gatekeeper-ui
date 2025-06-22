
export interface ItemAttachment {
  id: string;
  organizationId: string;
  itemId: string;
  fileName: string;
  fileType: 'display_picture' | 'other_document';
  secureUrl: string;
  uploadedBy: string;
  uploadedOn: Date;
  isDefault: boolean;
  createdOn: Date;
  updatedOn?: Date;
}

export interface CreateAttachmentRequest {
  itemId: string;
  fileName: string;
  fileType: 'display_picture' | 'other_document';
  secureUrl: string;
  isDefault?: boolean;
}

export interface UpdateAttachmentRequest {
  isDefault?: boolean;
}

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}
