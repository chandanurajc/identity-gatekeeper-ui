import { usePermissions } from './usePermissions';

export const usePaymentPermissions = () => {
  const { hasPermission, isLoading, user } = usePermissions();

  return {
    canViewPayments: hasPermission('view_payments'),
    canCreatePayments: hasPermission('create_payments'),
    canEditPayments: hasPermission('edit_payments'),
    canApprovePayments: hasPermission('approve_payments'),
    canRejectPayments: hasPermission('reject_payments'),
    loading: isLoading,
    user,
  };
};