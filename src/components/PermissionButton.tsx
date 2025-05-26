
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/usePermissions";

interface PermissionButtonProps {
  permission: string;
  onClick: () => void;
  children: ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  disabled?: boolean;
  title?: string;
}

const PermissionButton = ({ 
  permission, 
  onClick, 
  children, 
  variant = "default",
  size = "default",
  className = "",
  disabled = false,
  title
}: PermissionButtonProps) => {
  const { hasPermission } = usePermissions();
  
  const hasRequiredPermission = hasPermission(permission);
  const isDisabled = disabled || !hasRequiredPermission;
  
  const buttonTitle = title || (hasRequiredPermission ? "" : `No permission: ${permission}`);
  
  return (
    <Button
      onClick={onClick}
      variant={variant}
      size={size}
      disabled={isDisabled}
      className={`${isDisabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
      title={buttonTitle}
    >
      {children}
    </Button>
  );
};

export default PermissionButton;
