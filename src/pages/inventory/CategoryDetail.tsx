
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Category, CategoryFormData } from "@/types/category";
import { categoryService } from "@/services/categoryService";
import CategoryForm from "@/components/inventory/CategoryForm";
import { toast } from "@/components/ui/sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCategoryPermissions } from "@/hooks/useCategoryPermissions";
import { Folder } from "lucide-react";

const CategoryDetail = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [category, setCategory] = useState<Category | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { canEditCategory } = useCategoryPermissions();

  useEffect(() => {
    const fetchCategory = async () => {
      if (!categoryId) {
        navigate("/inventory/categories");
        return;
      }

      try {
        const data = await categoryService.getCategoryById(categoryId);
        if (data) {
          setCategory(data);
        } else {
          toast.error("Category not found");
          navigate("/inventory/categories");
        }
      } catch (error) {
        console.error("Error fetching category:", error);
        toast.error("Failed to load category details");
      } finally {
        setLoading(false);
      }
    };

    fetchCategory();
  }, [categoryId, navigate]);

  const handleSubmit = async (formData: CategoryFormData) => {
    if (!categoryId || !canEditCategory) return;

    setIsSubmitting(true);
    try {
      const updatedCategory = await categoryService.updateCategory(categoryId, formData);
      if (updatedCategory) {
        setCategory(updatedCategory);
        toast.success("Category updated successfully");
        navigate("/inventory/categories");
      } else {
        toast.error("Failed to update category");
      }
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error("An error occurred while updating the category");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto py-8 text-center">Loading category details...</div>;
  }

  if (!category) {
    return <div className="container mx-auto py-8 text-center">Category not found</div>;
  }

  if (!canEditCategory) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Folder className="h-6 w-6 text-muted-foreground" />
              <CardTitle>{category.name}</CardTitle>
            </div>
            <CardDescription>Category Details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-semibold">Subcategory:</p>
              <p>{category.subcategory || "—"}</p>
            </div>
            <div>
              <p className="font-semibold">Status:</p>
              <p>{category.isActive ? "Active" : "Inactive"}</p>
            </div>
            <div>
              <p className="font-semibold">Created By:</p>
              <p>{category.createdBy || "—"}</p>
            </div>
            <div>
              <p className="font-semibold">Created On:</p>
              <p>{category.createdOn ? new Date(category.createdOn).toLocaleString() : "—"}</p>
            </div>
            {category.updatedBy && (
              <div>
                <p className="font-semibold">Updated By:</p>
                <p>{category.updatedBy}</p>
              </div>
            )}
            {category.updatedOn && (
              <div>
                <p className="font-semibold">Updated On:</p>
                <p>{new Date(category.updatedOn).toLocaleString()}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Folder className="h-6 w-6 text-muted-foreground" />
            <CardTitle>Edit Category</CardTitle>
          </div>
          <CardDescription>Update category details</CardDescription>
        </CardHeader>
        <CardContent>
          <CategoryForm
            initialData={category}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default CategoryDetail;
