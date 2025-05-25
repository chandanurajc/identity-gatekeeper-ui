
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Edit } from "lucide-react";

interface OrganizationHeaderProps {
  organizationName: string;
  organizationStatus: string;
  canEdit: boolean;
  onEdit: () => void;
  onBack: () => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-green-500";
    case "inactive":
      return "bg-red-500";
    case "pending":
      return "bg-yellow-500";
    default:
      return "bg-gray-500";
  }
};

export const OrganizationHeader = ({ 
  organizationName, 
  organizationStatus, 
  canEdit, 
  onEdit, 
  onBack 
}: OrganizationHeaderProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{organizationName}</h2>
          <p className="text-muted-foreground">Organization Details</p>
        </div>
      </div>
      
      <div className="flex space-x-2">
        <Badge className={getStatusColor(organizationStatus)}>
          {organizationStatus.charAt(0).toUpperCase() + organizationStatus.slice(1)}
        </Badge>
        
        {canEdit && (
          <Button variant="outline" onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        )}
      </div>
    </div>
  );
};
