
import { 
  getAllPurchaseOrders, 
  getPurchaseOrderById, 
  generatePONumber, 
  getDivisionShippingAddress 
} from './purchaseOrder/queries';
import { 
  createPurchaseOrder, 
  updatePurchaseOrder,
  receivePurchaseOrder,
  cancelPurchaseOrder
} from './purchaseOrder/mutations';

export const purchaseOrderService = {
  getAllPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  receivePurchaseOrder,
  cancelPurchaseOrder,
  generatePONumber,
  getDivisionShippingAddress,
};
