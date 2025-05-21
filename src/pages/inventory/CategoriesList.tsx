
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Folder, Check, X, Edit, Trash } from "lucide-react";
import { categoryService } from "@/services/categoryService";
import { Category } from "@/types/category";
import { useCategoryPermissions } from "@/hooks/useCategoryPermissions";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";

const CategoriesList = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();
  const { canCreateCategory } = useCategoryPermissions();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await categoryService.getAllCategories();
        setCategories(data);
        setFilteredCategories(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("Failed to load item categories");
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter(category => 
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (category.subcategory && category.subcategory.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredCategories(filtered);
    }
  }, [searchTerm, categories]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleDelete = async (id: string) => {
    try {
      const success = await categoryService.deleteCategory(id);
      if (success) {
        setCategories(prev => prev.filter(category => category.id !== id));
        toast.success("Item category deleted successfully");
      } else {
        toast.error("Failed to delete item category");
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error("An error occurred while deleting the item category");
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Item Categories</h1>
        {canCreateCategory && (
          <Button onClick={() => navigate("/master-data/item-category/create")}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item Category
          </Button>
        )}
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter the item categories list</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Input
                placeholder="Search by name or subcategory..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-10">Loading item categories...</div>
      ) : (
        <Table>
          <TableCaption>List of item categories</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Subcategory</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Created On</TableHead>
              <TableHead>Updated By</TableHead>
              <TableHead>Updated On</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  No item categories found
                </TableCell>
              </TableRow>
            ) : (
              filteredCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <Folder className="h-4 w-4 mr-2 text-muted-foreground" />
                      {category.name}
                    </div>
                  </TableCell>
                  <TableCell>{category.subcategory || "—"}</TableCell>
                  <TableCell>
                    {category.isActive ? (
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                        <Check className="h-3 w-3 mr-1" /> Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                        <X className="h-3 w-3 mr-1" /> Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{category.createdBy || "—"}</TableCell>
                  <TableCell>
                    {category.createdOn
                      ? new Date(category.createdOn).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell>{category.updatedBy || "—"}</TableCell>
                  <TableCell>
                    {category.updatedOn
                      ? new Date(category.updatedOn).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/master-data/item-category/${category.id}`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(category.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default CategoriesList;
