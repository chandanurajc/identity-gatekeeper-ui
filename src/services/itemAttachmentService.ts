import { supabase } from "@/integrations/supabase/client";
import { ItemAttachment, CreateAttachmentRequest, UpdateAttachmentRequest, CloudinaryUploadResponse } from "@/types/itemAttachment";

export const itemAttachmentService = {
  async uploadToCloudinary(file: File): Promise<CloudinaryUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'upload_image');
    formData.append('public_id', `item_${crypto.randomUUID()}`);

    const response = await fetch('https://api.cloudinary.com/v1_1/dwonqkxgc/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Cloudinary upload error:', errorData);
      throw new Error(`Failed to upload to Cloudinary: ${response.status} ${response.statusText}`);
    }

    return response.json();
  },

  async createAttachment(organizationId: string, data: CreateAttachmentRequest, uploadedBy: string): Promise<ItemAttachment> {
    // Check if trying to set as default display picture
    if (data.isDefault && data.fileType === 'display_picture') {
      const existingDefault = await this.getDefaultDisplayPicture(organizationId, data.itemId);
      if (existingDefault) {
        throw new Error('This item already has a default display picture. Unset the existing one to continue.');
      }
    }

    const { data: result, error } = await supabase
      .from('item_attachments')
      .insert({
        organization_id: organizationId,
        item_id: data.itemId,
        file_name: data.fileName,
        file_type: data.fileType,
        secure_url: data.secureUrl,
        uploaded_by: uploadedBy,
        is_default: data.isDefault || false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating attachment:', error);
      throw new Error(error.message);
    }

    return {
      id: result.id,
      organizationId: result.organization_id,
      itemId: result.item_id,
      fileName: result.file_name,
      fileType: result.file_type,
      secureUrl: result.secure_url,
      uploadedBy: result.uploaded_by,
      uploadedOn: new Date(result.uploaded_on),
      isDefault: result.is_default,
      createdOn: new Date(result.created_on),
      updatedOn: result.updated_on ? new Date(result.updated_on) : undefined
    };
  },

  async getAttachmentsByItem(organizationId: string, itemId: string): Promise<ItemAttachment[]> {
    const { data, error } = await supabase
      .from('item_attachments')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('item_id', itemId)
      .order('created_on', { ascending: false });

    if (error) {
      console.error('Error fetching attachments:', error);
      throw new Error(error.message);
    }

    return data.map(item => ({
      id: item.id,
      organizationId: item.organization_id,
      itemId: item.item_id,
      fileName: item.file_name,
      fileType: item.file_type,
      secureUrl: item.secure_url,
      uploadedBy: item.uploaded_by,
      uploadedOn: new Date(item.uploaded_on),
      isDefault: item.is_default,
      createdOn: new Date(item.created_on),
      updatedOn: item.updated_on ? new Date(item.updated_on) : undefined
    }));
  },

  async getDefaultDisplayPicture(organizationId: string, itemId: string): Promise<ItemAttachment | null> {
    const { data, error } = await supabase
      .from('item_attachments')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('item_id', itemId)
      .eq('file_type', 'display_picture')
      .eq('is_default', true)
      .maybeSingle();

    if (error) {
      console.error('Error fetching default display picture:', error);
      throw new Error(error.message);
    }

    if (!data) return null;

    return {
      id: data.id,
      organizationId: data.organization_id,
      itemId: data.item_id,
      fileName: data.file_name,
      fileType: data.file_type,
      secureUrl: data.secure_url,
      uploadedBy: data.uploaded_by,
      uploadedOn: new Date(data.uploaded_on),
      isDefault: data.is_default,
      createdOn: new Date(data.created_on),
      updatedOn: data.updated_on ? new Date(data.updated_on) : undefined
    };
  },

  async updateAttachment(organizationId: string, attachmentId: string, data: UpdateAttachmentRequest): Promise<ItemAttachment> {
    // If setting as default, check if another default exists
    if (data.isDefault) {
      const { data: currentAttachment } = await supabase
        .from('item_attachments')
        .select('item_id, file_type')
        .eq('id', attachmentId)
        .eq('organization_id', organizationId)
        .single();

      if (currentAttachment?.file_type === 'display_picture') {
        const existingDefault = await this.getDefaultDisplayPicture(organizationId, currentAttachment.item_id);
        if (existingDefault && existingDefault.id !== attachmentId) {
          throw new Error('This item already has a default display picture. Unset the existing one to continue.');
        }
      }
    }

    const { data: result, error } = await supabase
      .from('item_attachments')
      .update({
        is_default: data.isDefault,
        updated_on: new Date().toISOString()
      })
      .eq('id', attachmentId)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) {
      console.error('Error updating attachment:', error);
      throw new Error(error.message);
    }

    return {
      id: result.id,
      organizationId: result.organization_id,
      itemId: result.item_id,
      fileName: result.file_name,
      fileType: result.file_type,
      secureUrl: result.secure_url,
      uploadedBy: result.uploaded_by,
      uploadedOn: new Date(result.uploaded_on),
      isDefault: result.is_default,
      createdOn: new Date(result.created_on),
      updatedOn: result.updated_on ? new Date(result.updated_on) : undefined
    };
  },

  async deleteAttachment(organizationId: string, attachmentId: string): Promise<void> {
    const { error } = await supabase
      .from('item_attachments')
      .delete()
      .eq('id', attachmentId)
      .eq('organization_id', organizationId);

    if (error) {
      console.error('Error deleting attachment:', error);
      throw new Error(error.message);
    }
  },

  validateDisplayPicture(file: File): string | null {
    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return 'Invalid file format. Please use JPEG, PNG, or WEBP.';
    }

    // Check file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return 'File size exceeds 5MB limit.';
    }

    return null; // Valid
  },

  async validateImageDimensions(file: File): Promise<string | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const { width, height } = img;
        
        if (width < 800 || height < 800) {
          resolve('Image resolution must be at least 800x800 pixels.');
        } else if (width > 3000 || height > 3000) {
          resolve('Image resolution must not exceed 3000x3000 pixels.');
        } else {
          resolve(null); // Valid
        }
      };
      img.onerror = () => resolve('Unable to validate image dimensions.');
      img.src = URL.createObjectURL(file);
    });
  }
};
