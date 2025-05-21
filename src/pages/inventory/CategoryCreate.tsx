
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CategoryFormData } from "@/types/category";
import { categoryService } from "@/services/categoryService";
import CategoryForm from "@/components/inventory/CategoryForm";
import { toast } from "@/components/ui/sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCategoryPermissions } from "@/hooks/useCategoryPermissions";
import { Folder, Plus } from "lucide-react";

const CategoryCreate = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { canCreateCategory } = useCategoryPermissions();

  const handleSubmit = async (formData: CategoryFormData) => {
    if (!canCreateCategory) {
      toast.error("You don't have permission to create item categories");
      return;
    }

    setIsSubmitting(true);
    try {
      const newCategory = await categoryService.createCategory(formData);
      toast.success("Item category created successfully");
      navigate(`/master-data/item-category/${newCategory.id}`);
    } catch (error) {
      console.error("Error creating item category:", error);
      toast.error("An error occurred while creating the item category");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canCreateCategory) {
    navigate("/unauthorized");
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Plus className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Create New Item Category</CardTitle>
          </div>
          <CardDescription>Add a new item category to the system</CardDescription>
        </CardHeader>
        <CardContent>
          <CategoryForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default CategoryCreate;
