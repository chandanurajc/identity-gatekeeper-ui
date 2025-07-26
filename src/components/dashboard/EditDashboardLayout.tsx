import React from "react";
import { Button } from "@/components/ui/button";

// Simple pencil SVG icon
const PencilIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    width={20}
    height={20}
    {...props}
  >
    <path
      d="M15.232 2.232a2 2 0 0 1 2.828 2.828l-10 10A2 2 0 0 1 6.586 16H4a1 1 0 0 1-1-1v-2.586a2 2 0 0 1 .586-1.414l10-10Z"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M13 4 16 7"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

interface EditDashboardLayoutProps {
  editing: boolean;
  onEditToggle: () => void;
}

export const EditDashboardLayout: React.FC<EditDashboardLayoutProps> = ({ editing, onEditToggle }) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={editing ? "Finish editing layout" : "Edit dashboard layout"}
      onClick={onEditToggle}
      className="absolute top-0 right-0 m-2 z-10"
    >
      <PencilIcon className={editing ? "text-primary" : "text-muted-foreground"} />
    </Button>
  );
};
