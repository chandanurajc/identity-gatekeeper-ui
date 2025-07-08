import { usePermissions } from "./usePermissions";

export const useJournalPermissions = () => {
  const { hasPermission } = usePermissions();
  
  return {
    canViewJournal: hasPermission("View Journal"),
    canPostJournal: hasPermission("Post Journal"),
    canReverseJournal: hasPermission("Reverse Journal"),
  };
};