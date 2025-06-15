
import { 
  getAllPurchaseOrders, 
  getPurchaseOrderById, 
  generatePONumber, 
  getDivisionShippingAddress 
} from './purchaseOrder/queries';
import { 
  createPurchaseOrder, 
  updatePurchaseOrder,
  receivePurchaseOrder
} from './purchaseOrder/mutations';

export const purchaseOrderService = {
  getAllPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  receivePurchaseOrder,
  generatePONumber,
  getDivisionShippingAddress,
};
